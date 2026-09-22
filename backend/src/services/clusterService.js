const { Op } = require('sequelize');
const { Complaint, User } = require('../models');
const { CLUSTER } = require('../config/constants');

/**
 * Automatic grouping of similar complaints into clusters.
 *
 * A cluster is anchored by a "root" complaint (the first report of the issue):
 *   - root.complaint.clusterId === root.complaint.id
 *   - every member.complaint.clusterId === root.id
 *   - an unclustered complaint has clusterId === null
 *
 * When a new complaint is found similar to an existing one above a threshold,
 * it is joined into that complaint's cluster (creating the cluster at the
 * earlier complaint if it wasn't clustered yet). This mirrors how a person
 * would naturally group "the pothole on Main Road" reports together.
 */

/**
 * Join `complaint` into the best matching existing cluster, as determined by
 * its already-computed `similarComplaints` list. A complaint with no strong
 * match stays unclustered (it is a candidate root for a future cluster).
 */
async function assignToCluster(complaint) {
  const similar = complaint.getSimilarComplaints();
  let best = null;
  for (const s of similar) {
    if (s && s.complaint != null && Number(s.similarityScore) >= CLUSTER.AUTO_JOIN_THRESHOLD) {
      if (!best || Number(s.similarityScore) > Number(best.similarityScore)) {
        best = s;
      }
    }
  }
  if (!best) return null;

  const match = await Complaint.findByPk(best.complaint);
  if (!match || match.isDeleted) return null;

  let rootId;
  if (match.clusterId == null) {
    // The earlier complaint isn't clustered yet — anchor a new cluster at it.
    rootId = match.id;
    await match.update({ clusterId: rootId });
  } else {
    // Join the match's existing cluster.
    rootId = match.clusterId;
  }

  await complaint.update({ clusterId: rootId });
  return rootId;
}

/**
 * Re-derive every cluster from the stored similarity lists. Clears all
 * current cluster assignments, then walks complaints oldest-first and applies
 * the same grouping logic. Runs fully offline (no AI calls).
 * Returns a summary of changes.
 */
async function rebuildClusters() {
  await Complaint.update({ clusterId: null }, { where: { clusterId: { [Op.ne]: null } } });

  const ordered = await Complaint.findAll({
    where: { isDeleted: false },
    order: [['createdAt', 'ASC']]
  });

  let clustered = 0;
  const affected = {};
  for (const complaint of ordered) {
    const rootId = await assignToCluster(complaint);
    if (rootId != null) {
      clustered += 1;
      affected[rootId] = (affected[rootId] || 0) + 1;
    }
  }

  return {
    totalComplaints: ordered.length,
    clusteredComplaints: clustered,
    clusters: Object.keys(affected).length,
    largest: affected[rootOfMax(affected)] || 0
  };
}

function rootOfMax(map) {
  let maxKey = null;
  let maxVal = -1;
  for (const k of Object.keys(map)) {
    if (map[k] > maxVal) { maxVal = map[k]; maxKey = k; }
  }
  return maxKey;
}

/**
 * Compute the centroid (average coordinates) of a group of complaints.
 */
function centroidOf(group) {
  const withCoords = group.filter(c => c.locLat != null && c.locLng != null);
  if (withCoords.length === 0) return null;
  const lat = withCoords.reduce((s, c) => s + Number(c.locLat), 0) / withCoords.length;
  const lng = withCoords.reduce((s, c) => s + Number(c.locLng), 0) / withCoords.length;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

/**
 * List all clusters, each summarized from its root complaint + member counts.
 * `roleContext` optionally restricts an official to their own department.
 */
async function listClusters({ role = null, department = null } = {}) {
  const where = { clusterId: { [Op.ne]: null }, isDeleted: false };
  if (role === 'official' && department) {
    where.department = department;
  }

  const rows = await Complaint.findAll({
    where,
    include: [
      { model: User, as: 'reportedBy', attributes: ['id', 'name'] }
    ]
  });

  // Group complaints by their cluster anchor id.
  const byCluster = {};
  rows.forEach(c => {
    const k = String(c.clusterId);
    (byCluster[k] = byCluster[k] || []).push(c);
  });

  const clusters = [];
  for (const key of Object.keys(byCluster)) {
    const group = byCluster[key];
    const root = group.find(c => Number(c.id) === Number(c.clusterId)) || group[0];
    const members = group.filter(c => c !== root);

    // Best-of each member's own similarity list approximates how strongly it
    // matches the cluster theme (members may reference the root or each other).
    const avgSimilarity = members.length
      ? members.reduce((s, m) => {
          const scores = (m.getSimilarComplaints() || [])
            .map(x => Number(x && x.similarityScore))
            .filter(Boolean);
          return s + (scores.length ? Math.max(...scores) : 0);
        }, 0) / members.length
      : 1;

    clusters.push({
      id: root.id,
      title: root.title,
      type: root.type,
      department: root.department,
      status: root.status,
      priority: root.priority,
      locAddress: root.locAddress || '',
      centroid: centroidOf([root, ...members]),
      memberCount: group.length,
      avgSimilarity: Number(avgSimilarity.toFixed(2)),
      maxPriority: Math.max(root.priority, ...members.map(m => m.priority)),
      createdAt: root.createdAt,
      reporter: root.reportedBy ? { id: root.reportedBy.id, name: root.reportedBy.name } : null
    });
  }

  clusters.sort((a, b) => b.memberCount - a.memberCount);
  return clusters;
}

/**
 * Fetch full detail for a cluster: the root complaint plus every member.
 */
async function getClusterDetail(rootId) {
  const root = await Complaint.findByPk(rootId, {
    include: [
      { model: User, as: 'reportedBy', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'department'] }
    ]
  });
  if (!root || root.isDeleted || Number(root.clusterId) !== Number(root.id)) {
    return null;
  }

  const members = await Complaint.findAll({
    where: { clusterId: rootId, id: { [Op.ne]: rootId }, isDeleted: false },
    order: [['createdAt', 'ASC']],
    include: [{ model: User, as: 'reportedBy', attributes: ['id', 'name'] }]
  });

  return {
    id: root.id,
    root: root.toJSON(),
    members: members.map(m => m.toJSON()),
    memberCount: members.length + 1,
    centroid: centroidOf([root, ...members])
  };
}

module.exports = {
  assignToCluster,
  rebuildClusters,
  listClusters,
  getClusterDetail
};