const { Complaint } = require('../models');
const { sequelize } = require('../models');

exports.getNearbyComplaints = async (req, res) => {
  try {
    const { lat, lng, radius = 500 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'lat and lng required' 
      });
    }

    const complaints = await sequelize.query(`
      SELECT 
        id, 
        title, 
        description,
        type,
        priority,
        department,
        locLat,
        locLng,
        locAddress,
        (
          6371000 * acos(
            cos(radians(:lat)) * cos(radians(locLat)) * 
            cos(radians(locLng) - radians(:lng)) + 
            sin(radians(:lat)) * sin(radians(locLat))
          )
        ) AS distance_meters
      FROM complaints
      WHERE status = 'open'
        AND locLat IS NOT NULL
        AND locLng IS NOT NULL
      HAVING distance_meters < :radius
      ORDER BY distance_meters ASC
      LIMIT 5
    `, {
      replacements: { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      nearby_count: complaints.length,
      complaints: complaints,
      user_location: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
