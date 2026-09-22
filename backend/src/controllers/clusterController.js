const asyncHandler = require('../utils/asyncHandler');
const ClusterService = require('../services/clusterService');
const { CLUSTER } = require('../config/constants');

/**
 * List all clusters (paginated summary). Officials scoped to their department.
 */
const listClusters = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const clusters = await ClusterService.listClusters({
    role: req.user.role,
    department: req.user.department
  });

  const start = (parseInt(page) - 1) * parseInt(limit);
  const pageRows = clusters.slice(start, start + parseInt(limit));

  const stats = {
    total: clusters.length,
    clusteredComplaints: clusters.reduce((s, c) => s + c.memberCount, 0),
    avgSize: clusters.length ? Math.round(clusters.reduce((s, c) => s + c.memberCount, 0) / clusters.length) : 0,
    largest: clusters.length ? clusters[0].memberCount : 0,
    hotspots: clusters.filter(c => c.memberCount >= CLUSTER.MIN_CLUSTER_SIZE).length
  };

  res.status(200).json({
    success: true,
    clusters: pageRows,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: clusters.length,
      pages: Math.ceil(clusters.length / parseInt(limit))
    }
  });
});

/**
 * Get full cluster detail (root + member complaints).
 */
const getClusterDetail = asyncHandler(async (req, res) => {
  const detail = await ClusterService.getClusterDetail(req.params.id);
  if (!detail) {
    return res.status(404).json({ success: false, message: 'Cluster not found' });
  }
  res.status(200).json({ success: true, cluster: detail });
});

/**
 * Rebuild all clusters from stored similarity data (admin only).
 */
const rebuildClusters = asyncHandler(async (req, res) => {
  const summary = await ClusterService.rebuildClusters();
  res.status(200).json({ success: true, message: 'Clusters rebuilt', summary });
});

module.exports = {
  listClusters,
  getClusterDetail,
  rebuildClusters
};