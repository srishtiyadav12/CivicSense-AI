const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const { Complaint } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const { analyzeImageEndpoint, uploadMiddleware } = require('../controllers/imageAnalysisController');

router.use(authenticate);

/**
 * @route POST /api/ai/analyze
 * @desc Analyze complaint text directly (classification, routing, priority)
 */
router.post('/analyze', asyncHandler(async (req, res) => {
  const { title, description, location } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description required' });
  }

  const analysis = await AIService.analyzeComplaint({ title, description, location });
  res.status(200).json({ success: true, ...analysis });
}));

/**
 * @route POST /api/ai/analyze-image
 * @desc Analyze uploaded image for civic issues (for mobile app)
 */
router.post('/analyze-image', uploadMiddleware, analyzeImageEndpoint);

/**
 * @route POST /api/ai/similar/:id
 * @desc Find similar complaints to a given complaint
 */
router.post('/similar/:id', asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  // Build a payload for the AI service
  const payload = {
    title: complaint.title,
    description: complaint.description,
    type: complaint.type,
    coordinates: complaint.locLat != null && complaint.locLng != null
      ? [Number(complaint.locLng), Number(complaint.locLat)]
      : null,
    city: complaint.locCity || ''
  };

  const result = await AIService.findSimilar(payload, parseInt(req.body.limit) || 5);
  res.status(200).json({ success: true, ...result });
}));

/**
 * @route POST /api/ai/predict
 * @desc Predict priority and estimated resolution time for a complaint
 */
router.post('/predict', asyncHandler(async (req, res) => {
  const { title, description, department } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

  const result = await AIService.predictPriority({ title, description, department });
  res.status(200).json({ success: true, ...result });
}));

/**
 * @route POST /api/ai/chat
 * @desc Citizen assistant (FAQ-driven chatbot)
 */
router.post('/chat', asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'Message is required' });

  const result = await AIService.chat(message);
  res.status(200).json({ success: true, ...result });
}));

/**
 * @route GET /api/ai/health
 * @desc Check AI service health
 */
router.get('/health', asyncHandler(async (req, res) => {
  const fetch = require('node-fetch');
  try {
    // node-fetch v2 ignores `timeout`; enforce it with an AbortController
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    let response;
    try {
      response = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/health`, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const status = await response.json();
    res.status(200).json({ success: true, aiService: 'online', status });
  } catch (error) {
    res.status(200).json({ success: true, aiService: 'offline', message: 'AI service not reachable' });
  }
}));

module.exports = router;