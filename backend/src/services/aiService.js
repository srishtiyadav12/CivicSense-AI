const fetch = require('node-fetch');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// node-fetch v2 ignores the `timeout` option, so enforce it via AbortController
async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

class AIService {
  /**
   * Analyze a complaint using the AI microservice.
   * Returns classification, department, priority, sentiment, and keywords.
   */
  static async analyzeComplaint({ title, description, location }) {
    try {
      const response = await fetchWithTimeout(`${AI_SERVICE_URL}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location: location?.city || location?.ward || '',
        })
      }, 8000);

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`AI service call failed: ${error.message}. Falling back to heuristic analysis.`);
      return this.heuristicAnalysis({ title, description });
    }
  }

  /**
   * Fallback heuristic analysis when AI service is unavailable.
   */
  static heuristicAnalysis({ title, description }) {
    const text = `${title} ${description}`.toLowerCase();
    const rules = [
      { type: 'pothole', keywords: ['pothole', 'craters', 'hole in road', 'dip in road'] },
      { type: 'garbage', keywords: ['garbage', 'trash', 'waste', 'rubbish', 'litter', 'dump', 'bins full'] },
      { type: 'broken_streetlight', keywords: ['streetlight', 'street light', 'lamppost', 'lantern', 'light not working', 'dark street', 'light broken'] },
      { type: 'water_leakage', keywords: ['water leak', 'leaking pipe', 'water dripping', 'leakage', 'pipe burst', 'water flowing'] },
      { type: 'drainage', keywords: ['drain', 'drainage', 'sewer', 'blocked drain', 'clogged', 'flooding', 'water stagnation'] },
      { type: 'damaged_infrastructure', keywords: ['broken bench', 'damaged fence', 'broken bridge', 'damaged sidewalk', 'dangerous structure', 'collapsed'] },
      { type: 'noise_pollution', keywords: ['noise', 'loud', 'construction noise', 'beeping', 'loud music'] },
      { type: 'stray_animals', keywords: ['stray', 'feral', 'dogs', 'animals on road', 'cattle'] },
      { type: 'electricity', keywords: ['power cut', 'electricity', 'no power', 'sparks', 'wire hanging', 'electric'] },
      { type: 'sewage', keywords: ['sewage', 'sewage overflow', 'smell', 'stinking', 'manhole overflowing'] }
    ];

    let type = 'other';
    let matchedKeywords = [];

    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          type = rule.type;
          matchedKeywords.push(keyword);
          break;
        }
      }
      if (type !== 'other') break;
    }

    const departmentMap = {
      pothole: 'Public Works Department',
      road_damage: 'Public Works Department',
      damaged_infrastructure: 'Public Works Department',
      public_property_damage: 'Public Works Department',
      garbage: 'Sanitation Department',
      sewage: 'Sanitation Department',
      broken_streetlight: 'Electricity Board',
      electricity: 'Electricity Board',
      water_leakage: 'Water Supply Department',
      drainage: 'Drainage Department',
      noise_pollution: 'Environmental Department',
      stray_animals: 'Animal Control',
      other: 'General Administration'
    };

    // Simple priority heuristic
    const criticalKeywords = ['dangerous', 'hazard', 'emergency', 'collapse', 'flood', 'electrocution', 'accident', 'injury', 'feels unsafe', 'can cause accident'];
    const highKeywords = ['urgent', 'serious', 'broken', 'damaged', 'overflow', 'spill', 'large', 'major'];
    let priority = 2; // Medium
    let priorityLabel = 'Medium';

    if (criticalKeywords.some(k => text.includes(k))) {
      priority = 4; priorityLabel = 'Critical';
    } else if (highKeywords.some(k => text.includes(k))) {
      priority = 3; priorityLabel = 'High';
    }

    // Simple sentiment heuristic
    const negativeKeywords = ['very bad', 'terrible', 'dangerous', 'worst', 'fed up', 'sick of', 'unacceptable', 'angry', 'frustrated'];
    const mildKeywords = ['issue', 'problem', 'need', 'please fix', 'noticed'];
    let sentimentScore = 0;
    let sentimentLabel = 'neutral';

    if (negativeKeywords.some(k => text.includes(k))) {
      if (text.includes('very') || text.includes('extremely') || text.includes('really')) {
        sentimentScore = -0.8; sentimentLabel = 'very_negative';
      } else {
        sentimentScore = -0.5; sentimentLabel = 'negative';
      }
    } else if (mildKeywords.some(k => text.includes(k))) {
      sentimentScore = -0.1; sentimentLabel = 'neutral';
    } else {
      sentimentScore = 0.2; sentimentLabel = 'positive';
    }

    return {
      complaint_type: type,
      department: departmentMap[type] || 'General Administration',
      priority,
      priority_label: priorityLabel,
      sentiment: { score: sentimentScore, label: sentimentLabel },
      keywords: matchedKeywords,
      source: 'heuristic'
    };
  }

  /**
   * Find similar complaints using the AI microservice.
   * Accepts a Sequelize instance or a normalized object with
   * { id|_id, title, description, type, coordinates?, city? }.
   */
  /**
   * Predict priority and estimate resolution time.
   */
  static async predictPriority({ title, description, department }) {
    try {
      const response = await fetchWithTimeout(`${AI_SERVICE_URL}/api/v1/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, department: department || null })
      }, 5000);
      if (!response.ok) throw new Error(`AI service ${response.status}`);
      return await response.json();
    } catch (e) {
      console.warn(`predict call failed: ${e.message}`);
      return {
        priority_estimate: { priority: 2, priority_label: 'Medium', confidence: 0.6, signals: 'fallback' },
        resolution_estimate: { department: department || 'General Administration', estimated_days_min: 7, estimated_days_max: 14, display: '7–14 working days', basis: 'fallback' }
      };
    }
  }

  /**
   * Citizen assistant chatbot.
   */
  static async chat(message) {
    try {
      const response = await fetchWithTimeout(`${AI_SERVICE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }, 5000);
      if (!response.ok) throw new Error(`AI service ${response.status}`);
      return await response.json();
    } catch (e) {
      console.warn(`chat call failed: ${e.message}`);
      return { reply: "I couldn't reach the AI assistant right now. Please try again shortly.", intent: 'service_down' };
    }
  }

  /**
   * Find similar complaints using the AI microservice.
   * Accepts a Sequelize instance or a normalized object with
   * { id|_id, title, description, type, coordinates?, city? }.
   */
  static async findSimilar(complaint, limit = 5) {
    try {
      const id = complaint._id !== undefined ? complaint._id : complaint.id;
      const coordinates = complaint.location?.coordinates !== undefined
        ? complaint.location.coordinates
        : complaint.coordinates || [0, 0];
      const city = complaint.location?.city || complaint.city || '';

      const response = await fetchWithTimeout(`${AI_SERVICE_URL}/api/v1/similar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: id != null ? String(id) : null,
          title: complaint.title,
          description: complaint.description,
          type: complaint.type,
          coordinates,
          city,
          limit
        })
      }, 6000);

      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`Similarity service call failed: ${error.message}`);
      return { similarities: [] };
    }
  }
}

module.exports = AIService;
