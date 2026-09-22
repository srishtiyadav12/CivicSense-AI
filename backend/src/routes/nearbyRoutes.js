const express = require('express');
const { getNearbyComplaints } = require('../controllers/nearbyController');

const router = express.Router();

router.get('/', getNearbyComplaints);

module.exports = router;
