const express = require('express');
const router = express.Router();
const {
  listClusters,
  getClusterDetail,
  rebuildClusters
} = require('../controllers/clusterController');
const { authenticate, authorize } = require('../middleware/auth');

// All cluster routes require authentication
router.use(authenticate);

router.get('/', listClusters);
router.post('/rebuild', authorize('admin', 'super_admin'), rebuildClusters);
router.get('/:id', getClusterDetail);

module.exports = router;