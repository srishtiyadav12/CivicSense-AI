const { User, Complaint } = require('../models');
const { Op } = require('sequelize');
const { COMPLAINT_STATUS } = require('../config/constants');

/**
 * Smart Geo-routing.
 *
 * - determineWard(lat,lng) turns a GPS point into a named ward using a simple
 *   deterministic ward grid (a stand-in for real municipal ward polygons, which
 *   would come from a GIS layer).
 * - autoAssign(...) picks the least-loaded eligible official for a complaint's
 *   department and ward, so work is balanced automatically instead of manually.
 */

// Demo ward grid over a plausible metro bounding box.
// Each cell => { name, bounds: {minLat,maxLat,minLng,maxLng} }
function buildWardGrid() {
  const wards = [];
  const rows = 4, cols = 4;
  const minLat = 18.9, maxLat = 19.3;    // south-north
  const minLng = 72.75, maxLng = 72.95;  // west-east
  const latStep = (maxLat - minLat) / rows;
  const lngStep = (maxLng - minLng) / cols;
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      wards.push({
        name: `Ward ${n}`,
        bounds: {
          minLat: minLat + r * latStep,
          maxLat: minLat + (r + 1) * latStep,
          minLng: minLng + c * lngStep,
          maxLng: minLng + (c + 1) * lngStep
        }
      });
      n++;
    }
  }
  return wards;
}
const _wards = buildWardGrid();

/**
 * Map a GPS point to a ward name. Always returns a string.
 */
function determineWard(lat, lng) {
  if (lat == null || lng == null) return 'Unassigned';
  const found = _wards.find(w =>
    lat >= w.bounds.minLat && lat <= w.bounds.maxLat &&
    lng >= w.bounds.minLng && lng <= w.bounds.maxLng
  );
  return found ? found.name : 'Out of Coverage';
}

/**
 * Count in-flight (not yet resolved/rejected) complaints assigned to a user.
 */
async function workloadOfUser(userId) {
  return Complaint.count({
    where: {
      assignedToId: userId,
      isDeleted: false,
      status: { [Op.notIn]: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED] }
    }
  });
}

/**
 * Auto-assign to the official with the lowest open workload.
 * Prefers officials in the same ward + matching department; falls back to any
 * official of the department; returns null if no official is available.
 */
async function autoAssign({ department, ward, lat, lng } = {}) {
  const dept = department || 'General Administration';
  const targetWard = ward || determineWard(lat, lng);

  // Candidate officials in the same ward + department first.
  let candidates = await User.findAll({
    where: { role: 'official', isActive: true, department: dept, ward: targetWard },
    attributes: ['id', 'name', 'department', 'ward']
  });
  // Fall back to the whole department if the ward has no specialist.
  if (!candidates.length) {
    candidates = await User.findAll({
      where: { role: 'official', isActive: true, department: dept },
      attributes: ['id', 'name', 'department', 'ward']
    });
  }

  if (!candidates.length) return null;

  // Load current workload for each candidate and pick the least-busy.
  const withLoad = await Promise.all(candidates.map(async (o) => ({
    id: o.id, name: o.name, ward: o.ward || null,
    load: await workloadOfUser(o.id)
  })));
  withLoad.sort((a, b) => a.load - b.load);

  return {
    officialId: withLoad[0].id,
    officialName: withLoad[0].name,
    ward: targetWard,
    workload: withLoad[0].load
  };
}

module.exports = { determineWard, autoAssign, workloadOfUser, buildWardGrid };