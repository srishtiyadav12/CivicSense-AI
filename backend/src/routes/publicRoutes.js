const express = require('express');
const router = express.Router();
const { getPublicDashboard, trackComplaint } = require('../controllers/publicController');

// Public transparency endpoints — no authentication required
router.get('/dashboard', getPublicDashboard);
router.get('/track/:id', trackComplaint);

module.exports = router;