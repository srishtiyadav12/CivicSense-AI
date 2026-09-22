const express = require('express');
const router = express.Router();
const {
  getStats, getTrends, getHeatmap
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/trends', getTrends);
router.get('/heatmap', getHeatmap);

module.exports = router;
