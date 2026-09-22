const { Op } = require('sequelize');
const { Complaint, User } = require('../models');
const { COMPLAINT_STATUS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Public (no-auth) endpoints for the citizen transparency page.
 * These intentionally expose only aggregated, non-sensitive data.
 */

// Optional window filter: ?days=30 (default all non-deleted)
function windowFilter(req) {
  const days = parseInt(req.query.days);
  if (!days) return { isDeleted: false };
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  return { isDeleted: false, createdAt: { [Op.gte]: fromDate } };
}

/**
 * GET /api/public/dashboard
 * Aggregated stats for the public page: totals, by type, by status, by dept.
 */
const getPublicDashboard = asyncHandler(async (req, res) => {
  const filter = windowFilter(req);

  const [byType, byStatus, byDepartment, totalComplaints] = await Promise.all([
    Complaint.groupCount('type', filter),
    Complaint.groupCount('status', filter),
    Complaint.groupCount('department', filter),
    Complaint.count({ where: filter })
  ]);

  const resolved = (byStatus.find(s => s._id === COMPLAINT_STATUS.RESOLVED) || {}).count || 0;
  const inProgress = (byStatus.find(s => s._id === COMPLAINT_STATUS.IN_PROGRESS) || {}).count || 0;
  const open = totalComplaints - resolved;

  res.status(200).json({
    success: true,
    stats: {
      total: totalComplaints,
      resolved,
      inProgress,
      open,
      resolutionRate: totalComplaints ? Math.round((resolved / totalComplaints) * 100) : 0,
      byType: byType.map(t => ({ type: t._id, count: t.count })),
      byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
      byDepartment: byDepartment.map(d => ({ department: d._id, count: d.count }))
    }
  });
});

/**
 * GET /api/public/track/:id
 * No-auth status look-up by complaint ID. Returns lightweight progress info,
 * no PII — used by the public "Track a complaint" widget on the landing page.
 */
const trackComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id, {
    include: [
      { model: User, as: 'assignedTo', attributes: ['id', 'name', 'department'] }
    ],
    attributes: [
      'id', 'title', 'type', 'priority', 'priorityLabel', 'status', 'department',
      'locWard', 'locCity', 'createdAt', 'updatedAt', 'statusHistory',
      'satisfactionRating', 'duplicateOfId', 'clusterId'
    ]
  });

  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  const history = complaint.getStatusHistory ? complaint.getStatusHistory() : [];
  res.status(200).json({
    success: true,
    tracking: {
      id: complaint.id,
      title: complaint.title,
      type: complaint.type,
      priority: complaint.priority,
      priorityLabel: complaint.priorityLabel,
      status: complaint.status,
      department: complaint.department,
      ward: complaint.locWard || '',
      city: complaint.locCity || '',
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      satisfactionRating: complaint.satisfactionRating || null,
      duplicateOfId: complaint.duplicateOfId || null,
      clusterId: complaint.clusterId || null,
      assignedOfficial: complaint.assignedTo ? complaint.assignedTo.name : null,
      timeline: history
    }
  });
});

module.exports = { getPublicDashboard, trackComplaint };