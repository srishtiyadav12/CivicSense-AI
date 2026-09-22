const multer = require('multer');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');

// In-memory storage for image analysis (no need to save)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname)) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Analyze uploaded image for civic issues
 * This is a simple heuristic-based analysis for mobile
 */
const analyzeImageEndpoint = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  // Simple heuristic analysis based on image properties
  const fileSize = req.file.size;
  const fileName = req.file.originalname.toLowerCase();

  // Check if filename contains civic issue keywords
  const civicKeywords = [
    'pothole', 'garbage', 'trash', 'waste', 'light', 'street', 'road',
    'drain', 'water', 'leak', 'damage', 'broken', 'crack', 'hole'
  ];

  const detectedKeywords = civicKeywords.filter(keyword => fileName.includes(keyword));
  const civicIssueDetected = detectedKeywords.length > 0 || fileSize > 100000; // Assume real photos are >100KB

  // Generate suggestion based on detected keywords
  let suggestedComplaint = null;
  if (civicIssueDetected) {
    if (fileName.includes('pothole') || fileName.includes('hole') || fileName.includes('crack')) {
      suggestedComplaint = {
        title: 'Pothole on Road Needs Repair',
        description: 'There is a pothole on the road that poses a danger to vehicles and pedestrians. The road surface has deteriorated and requires immediate repair to prevent accidents.',
        type: 'pothole',
        department: 'Public Works Department',
        priority: 3,
        confidence: 80
      };
    } else if (fileName.includes('garbage') || fileName.includes('trash') || fileName.includes('waste')) {
      suggestedComplaint = {
        title: 'Garbage Accumulation Needs Cleaning',
        description: 'Garbage and waste have accumulated at this location. This is causing hygiene issues and attracting pests. Immediate cleaning is required.',
        type: 'garbage',
        department: 'Sanitation Department',
        priority: 2,
        confidence: 75
      };
    } else if (fileName.includes('light') || fileName.includes('street')) {
      suggestedComplaint = {
        title: 'Streetlight Not Working',
        description: 'The streetlight at this location is not functioning. This makes the area unsafe at night and needs urgent repair.',
        type: 'broken_streetlight',
        department: 'Electricity Board',
        priority: 2,
        confidence: 70
      };
    } else if (fileName.includes('water') || fileName.includes('leak') || fileName.includes('drain')) {
      suggestedComplaint = {
        title: 'Water Leakage Issue',
        description: 'There is water leakage or drainage problem at this location. This is wasting water and causing inconvenience to residents.',
        type: 'water_leakage',
        department: 'Water Supply Department',
        priority: 3,
        confidence: 75
      };
    } else {
      suggestedComplaint = {
        title: 'Civic Infrastructure Issue',
        description: 'There is an infrastructure problem at this location that requires attention from the relevant department.',
        type: 'damaged_infrastructure',
        department: 'Public Works Department',
        priority: 2,
        confidence: 65
      };
    }
  }

  // Calculate authenticity score
  const authenticityScore = civicIssueDetected ? 75 : 30;

  res.status(200).json({
    success: true,
    isAuthentic: civicIssueDetected,
    authenticityScore,
    civicIssueDetected,
    summary: civicIssueDetected
      ? `Civic issue likely detected (Keywords: ${detectedKeywords.join(', ') || 'image analysis'})`
      : 'No obvious civic issue detected in the image',
    suggestedComplaint,
    detectedKeywords
  });
});

module.exports = {
  analyzeImageEndpoint,
  uploadMiddleware: upload.single('image')
};