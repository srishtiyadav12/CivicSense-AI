const { fn, col, literal, Op } = require('sequelize');
const { Complaint, User } = require('../models');
const { sequelize } = require('../config/db');
const { COMPLAINT_STATUS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Derive convenient top-level counters from a [{_id, count}] status breakdown.
 * The mobile app reads `stats.open / inProgress / resolved / total`, so every
 * role branch returns these alongside the raw breakdown.
 */
function deriveStatusCounts(byStatus) {
  const count = (status) => {
    const row = byStatus.find((s) => s._id === status);
    return row ? Number(row.count) || 0 : 0;
  };
  const submitted = count(COMPLAINT_STATUS.SUBMITTED);
  const underReview = count(COMPLAINT_STATUS.UNDER_REVIEW);
  const assigned = count(COMPLAINT_STATUS.ASSIGNED);
  const inProgress = count(COMPLAINT_STATUS.IN_PROGRESS);
  const resolved = count(COMPLAINT_STATUS.RESOLVED);
  const rejected = count(COMPLAINT_STATUS.REJECTED);

  return {
    open: submitted + underReview + assigned + inProgress,
    pending: submitted + underReview,
    inProgress,
    resolved,
    rejected,
    total: byStatus.reduce((acc, s) => acc + (Number(s.count) || 0), 0)
  };
}

/**
 * Get dashboard statistics based on user role
 */
const getStats = asyncHandler(async (req, res) => {
  const baseFilter = { isDeleted: false };
  const role = req.user.role;

  if (role === 'citizen') {
    const filter = { ...baseFilter, reportedById: req.user.id };
    const [byStatus, byType, byPriority] = await Promise.all([
      Complaint.groupCount('status', filter),
      Complaint.groupCount('type', filter),
      Complaint.groupCount('priority', filter)
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        role: 'citizen',
        filters: { base: 'my_complaints' },
        byStatus,
        byType,
        byPriority,
        ...deriveStatusCounts(byStatus)
      }
    });
  }

  if (role === 'official') {
    const filter = { ...baseFilter, department: req.user.department };
    const [byStatus, byType, byPriority] = await Promise.all([
      Complaint.groupCount('status', filter),
      Complaint.groupCount('type', filter),
      Complaint.groupCount('priority', filter)
    ]);
    const myAssigned = await Complaint.groupCount('status', { ...filter, assignedToId: req.user.id });

    return res.status(200).json({
      success: true,
      stats: {
        role: 'official',
        department: req.user.department,
        filters: { department: req.user.department },
        byStatus,
        byType,
        byPriority,
        assignedToMe: myAssigned,
        ...deriveStatusCounts(byStatus),
        myAssigned: myAssigned.reduce((acc, s) => acc + s.count, 0)
      }
    });
  }

  // Admins see overall stats
  const [byStatus, byType, byDepartment, byPriority, userStats, deptPerformance] = await Promise.all([
    Complaint.groupCount('status', baseFilter),
    Complaint.groupCount('type', baseFilter),
    Complaint.groupCount('department', baseFilter),
    Complaint.groupCount('priority', baseFilter),
    User.findAll({
      attributes: ['role', [fn('COUNT', col('id')), 'count']],
      group: ['role'],
      raw: true
    }),
    Complaint.findAll({
      attributes: [
        'department',
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal(`CASE WHEN status = '${COMPLAINT_STATUS.RESOLVED}' THEN 1 ELSE 0 END`)), 'resolved'],
        [fn('SUM', literal(`CASE WHEN status IN ('${COMPLAINT_STATUS.IN_PROGRESS}', '${COMPLAINT_STATUS.ASSIGNED}') THEN 1 ELSE 0 END`)), 'inProgress'],
        [fn('AVG', col('priority')), 'avgPriority']
      ],
      where: baseFilter,
      group: ['department'],
      raw: true
    })
  ]);

  const deptPerformanceFormatted = deptPerformance.map(d => ({
    department: d.department,
    total: Number(d.total),
    resolved: Number(d.resolved) || 0,
    inProgress: Number(d.inProgress) || 0,
    avgPriority: d.avgPriority ? Number(Number(d.avgPriority).toFixed(2)) : 0,
    resolutionRate: Number(d.total) ? Math.round((Number(d.resolved) / Number(d.total)) * 100) : 0
  }));

  return res.status(200).json({
    success: true,
    stats: {
      role: 'admin',
      filters: baseFilter,
      byStatus,
      byType,
      byDepartment,
      byPriority,
      users: userStats.map(u => ({ _id: u.role, count: Number(u.count) })),
      departmentPerformance: deptPerformanceFormatted,
      ...deriveStatusCounts(byStatus)
    }
  });
});

/**
 * Get trend data for the last N days
 */
const getTrends = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - parseInt(days));

  const filter = { isDeleted: false, createdAt: { [Op.gte]: fromDate } };

  if (req.user.role === 'citizen') filter.reportedById = req.user.id;
  if (req.user.role === 'official') filter.department = req.user.department;

  const rows = await Complaint.findAll({
    attributes: [
      [fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'date'],
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', literal(`CASE WHEN priority = 4 THEN 1 ELSE 0 END`)), 'critical'],
      [fn('SUM', literal(`CASE WHEN status = '${COMPLAINT_STATUS.RESOLVED}' THEN 1 ELSE 0 END`)), 'resolved']
    ],
    where: filter,
    group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d')],
    order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'ASC']],
    raw: true
  });

  const trends = rows.map(r => ({
    date: r.date,
    count: Number(r.count),
    critical: Number(r.critical) || 0,
    resolved: Number(r.resolved) || 0
  }));

  res.status(200).json({ success: true, trends });
});

/**
 * Get geographic heatmap data (problems per area)
 */
const getHeatmap = asyncHandler(async (req, res) => {
  const { days = 30, lat, lng, radius = 10 } = req.query;

  // NOTE: the distance (Haversine) expression must be wrapped in an aggregate
  // (AVG) and only included when coordinates are actually provided. Otherwise
  // the raw, non-aggregated expression in the SELECT list violates MySQL's
  // default ONLY_FULL_GROUP_BY mode and the whole query throws, which made the
  // Analytics page error out ("Failed to load analytics data").
  const hasGeo = !!(lat && lng);

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - parseInt(days || '30'));

  const where = [
    'isDeleted = 0',
    `createdAt >= '${fromDate.toISOString()}'`,
    'locLat IS NOT NULL',
    'locLng IS NOT NULL'
  ];
  if (req.user.role === 'citizen') where.push(`reportedById = ${req.user.id}`);
  if (req.user.role === 'official') where.push(`department = ${sequelize.escape(req.user.department)}`);

  // Build the Haversine distance once, reused in both SELECT and HAVING.
  const distanceExpr = hasGeo
    ? `6371000 * 2 * ASIN(SQRT(
        POWER(SIN((${Number(lat)} - locLat) * PI()/180 / 2), 2) +
        COS(${Number(lat)} * PI()/180) * COS(locLat * PI()/180) *
        POWER(SIN((${Number(lng)} - locLng) * PI()/180 / 2), 2)
      ))`
    : null;

  const selectDistance = distanceExpr ? `, AVG(${distanceExpr}) AS distance` : '';
  const havingDistance = distanceExpr ? `HAVING AVG(${distanceExpr}) <= ${parseFloat(radius) * 1000}` : '';

  // Group by rounded coordinates to cluster nearby complaints.
  // All non-grouped SELECT columns are aggregates, so this is ALSO safe under
  // ONLY_FULL_GROUP_BY (unlike the previous implementation).
  const query = `
    SELECT
      ROUND(locLat, 3) AS lat,
      ROUND(locLng, 3) AS lng,
      COUNT(*) AS count,
      AVG(priority) AS avgPriority
      ${selectDistance}
    FROM complaints
    WHERE ${where.join(' AND ')}
    GROUP BY ROUND(locLat, 3), ROUND(locLng, 3)
    ${havingDistance}
    ORDER BY count DESC
    LIMIT 500
  `;

  const [results] = await sequelize.query(query);

  // Format into expected shape: { location: [lng, lat], count, avgPriority, intensity }
  const heatmap = results
    .filter(r => r.lat != null && r.lng != null)
    .map(r => ({
      location: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] },
      count: Number(r.count),
      avgPriority: Number(r.avgPriority || 0),
      intensity: Number(r.count) * (Number(r.avgPriority || 0) / 4),
      area: `${r.lat}, ${r.lng}`
    }));

  res.status(200).json({ success: true, heatmap });
});

module.exports = { getStats, getTrends, getHeatmap };