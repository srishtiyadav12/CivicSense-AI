/**
 * Free AI Image Analysis Service using TensorFlow.js + MobileNet
 * Detects civic issues from uploaded photos and validates authenticity
 */

let model = null;
let isLoading = false;

// Civic issue keywords that the AI will look for in detected objects
const CIVIC_ISSUE_KEYWORDS = {
  // Infrastructure & Roads
  road: ['pothole', 'crack', 'gravel', 'asphalt', 'road', 'highway', 'street'],
  sidewalk: ['sidewalk', 'pavement', 'curb', 'walkway'],
  bridge: ['bridge', 'overpass', 'underpass'],

  // Sanitation & Waste
  garbage: ['trash', 'garbage', 'waste', 'litter', 'bin', 'container', 'dumpster'],
  debris: ['debris', 'rubble', 'trash', 'waste', 'rubbish'],

  // Water & Drainage
  water: ['water', 'puddle', 'flood', 'pool', 'leak', 'pipe'],
  drainage: ['drain', 'sewer', 'grate', 'gutter'],

  // Lighting
  streetlight: ['lamp', 'light', 'streetlight', 'pole', 'fixture'],

  // Buildings & Structures
  building: ['building', 'house', 'structure', 'roof', 'wall'],
  damaged: ['broken', 'damaged', 'cracked', 'collapsed', 'destroyed'],

  // Nature & Environment
  tree: ['tree', 'plant', 'bush', 'branch', 'leaf'],
  park: ['park', 'grass', 'lawn', 'garden', 'bench'],

  // Vehicles & Traffic
  vehicle: ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle'],
  traffic: ['traffic', 'sign', 'signal', 'light'],

  // Animals
  animal: ['dog', 'cat', 'bird', 'animal', 'cattle', 'stray'],

  // Electricity
  electricity: ['wire', 'cable', 'pole', 'transformer', 'power line'],

  // Pollution
  pollution: ['smoke', 'fume', 'dust', 'smog', 'garbage']
};

// Smarter civic issue detection with context awareness
const CIVIC_ISSUE_PATTERNS = {
  // Pothole detection (looks for road + damage)
  pothole: {
    keywords: ['pothole', 'crater', 'road', 'street', 'asphalt', 'pavement'],
    required: ['road', 'street', 'asphalt', 'pavement', 'highway'],
    context: ['hole', 'damage', 'crack', 'broken', 'uneven'],
    priority: 3,
    department: 'Public Works Department'
  },

  // Garbage detection (trash in urban context)
  garbage: {
    keywords: ['trash', 'garbage', 'waste', 'litter', 'rubbish'],
    required: ['trash', 'garbage', 'waste', 'litter', 'rubbish'],
    context: ['bin', 'dumpster', 'pile', 'heap', 'accumulation'],
    priority: 2,
    department: 'Sanitation Department'
  },

  // Streetlight issues
  broken_streetlight: {
    keywords: ['streetlight', 'lamp', 'light', 'pole', 'fixture'],
    required: ['streetlight', 'lamp', 'light', 'pole', 'fixture'],
    context: ['broken', 'damaged', 'not working', 'out', 'flickering'],
    priority: 2,
    department: 'Electricity Board'
  },

  // Water/drainage issues
  water_leakage: {
    keywords: ['water', 'pipe', 'leak', 'drain', 'sewer'],
    required: ['water', 'pipe', 'leak', 'drain'],
    context: ['flowing', 'pool', 'puddle', 'flood', 'overflow'],
    priority: 3,
    department: 'Water Supply Department'
  },

  // Drainage specifically
  drainage: {
    keywords: ['drain', 'sewer', 'gutter', 'grate'],
    required: ['drain', 'sewer', 'gutter'],
    context: ['blocked', 'clogged', 'overflow', 'stagnation'],
    priority: 2,
    department: 'Drainage Department'
  },

  // General infrastructure damage
  damaged_infrastructure: {
    keywords: ['building', 'wall', 'roof', 'structure', 'bench', 'bridge'],
    required: ['building', 'wall', 'roof', 'structure', 'bench', 'bridge'],
    context: ['broken', 'damaged', 'cracked', 'collapsed', 'destroyed'],
    priority: 3,
    department: 'Public Works Department'
  },

  // Stray animals (looks for animals in urban context)
  stray_animals: {
    keywords: ['dog', 'cat', 'animal', 'cattle', 'stray', 'wild'],
    required: ['dog', 'cat', 'animal', 'cattle', 'stray'],
    context: ['road', 'street', 'public', 'area', 'park'],
    priority: 2,
    department: 'Animal Control'
  },

  // Electricity issues
  electricity: {
    keywords: ['wire', 'cable', 'power line', 'electric', 'spark'],
    required: ['wire', 'cable', 'power line', 'electric'],
    context: ['hanging', 'exposed', 'dangerous', 'spark', 'shock'],
    priority: 3,
    department: 'Electricity Board'
  },

  // Noise pollution
  noise_pollution: {
    keywords: ['construction', 'factory', 'machine', 'vehicle', 'honking'],
    required: ['construction', 'factory', 'machine', 'vehicle'],
    context: ['noise', 'loud', 'disturbance', 'sound', 'pollution'],
    priority: 2,
    department: 'Environmental Department'
  }
};

// Common non-civic objects (false positives to filter out)
const NON_CIVIC_OBJECTS = [
  // People/faces
  'person', 'man', 'woman', 'child', 'face', 'human', 'portrait', 'selfie',
  // Nature (unless damaged)
  'tree', 'plant', 'flower', 'grass', 'sky', 'cloud', 'sun', 'mountain',
  'waterfall', 'river', 'ocean', 'beach', 'forest',
  // Indoor objects
  'indoor', 'room', 'house', 'home', 'furniture', 'chair', 'table', 'bed',
  'kitchen', 'bathroom', 'window', 'door',
  // Food
  'food', 'meal', 'plate', 'dish', 'restaurant', 'cooking',
  // Clothing
  'clothing', 'shirt', 'pants', 'dress', 'shoe', 'bag',
  // Entertainment
  'tv', 'screen', 'computer', 'phone', 'book', 'music', 'art', 'painting'
];

/**
 * Load the MobileNet model (runs once)
 */
export async function loadModel() {
  if (model) return model;
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return model;
  }

  isLoading = true;
  try {
    // Dynamic import TensorFlow.js and MobileNet
    const tf = await import('@tensorflow/tfjs');
    const mobilenet = await import('@tensorflow-models/mobilenet');

    console.log('Loading MobileNet model...');
    model = await mobilenet.load({
      version: 2,
      alpha: 1.0
    });
    console.log('MobileNet model loaded successfully!');
    return model;
  } catch (error) {
    console.error('Failed to load AI model:', error);
    isLoading = false;
    throw error;
  }
}

/**
 * Analyze an image file and detect civic issues
 * @param {File} file - The image file to analyze
 * @returns {Promise<Object>} Analysis result with detected objects, authenticity score, and suggested complaint
 */
export async function analyzeImage(file) {
  try {
    // Load model if not already loaded
    const loadedModel = await loadModel();

    // Create an image element from the file
    const img = await createImageFromFile(file);

    // Run classification
    const predictions = await loadedModel.classify(img);

    // Process predictions
    const analysis = processPredictions(predictions);

    return analysis;
  } catch (error) {
    console.error('Image analysis error:', error);
    return {
      success: false,
      error: error.message,
      detectedObjects: [],
      isAuthentic: false,
      authenticityScore: 0,
      suggestedComplaint: null,
      civicIssueDetected: false
    };
  }
}

/**
 * Create an HTMLImageElement from a File
 */
function createImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process model predictions to extract civic issues
 */
function processPredictions(predictions) {
  const detectedObjects = predictions.map(p => ({
    className: p.className,
    probability: p.probability
  }));

  // Convert all detected objects to lowercase for easier matching
  const allObjects = predictions.map(p => p.className.toLowerCase());

  // Filter out non-civic objects (people, nature, indoor objects)
  const filteredPredictions = predictions.filter(prediction => {
    const lowerClass = prediction.className.toLowerCase();
    // Filter out non-civic objects
    for (const nonCivic of NON_CIVIC_OBJECTS) {
      if (lowerClass.includes(nonCivic)) {
        return false;
      }
    }
    return true;
  });

  // Find civic issues using context-aware detection
  const civicIssues = [];

  for (const [issueType, pattern] of Object.entries(CIVIC_ISSUE_PATTERNS)) {
    // Check if we have the required objects
    const hasRequired = pattern.required.some(req =>
      allObjects.some(obj => obj.includes(req))
    );

    if (hasRequired) {
      // Check for context words (damage, broken, etc.)
      const hasContext = pattern.context.some(context =>
        allObjects.some(obj => obj.includes(context))
      );

      // Check for any keywords
      const keywordMatches = pattern.keywords.filter(keyword =>
        allObjects.some(obj => obj.includes(keyword))
      );

      if (hasContext || keywordMatches.length >= 2) {
        // Find the best matching prediction
        const bestMatch = predictions.find(p =>
          pattern.keywords.some(keyword => p.className.toLowerCase().includes(keyword))
        );

        civicIssues.push({
          type: issueType,
          department: pattern.department,
          priority: pattern.priority,
          confidence: bestMatch ? bestMatch.probability : 0.6,
          keywords: keywordMatches,
          hasContext: hasContext,
          isStrongMatch: hasContext && keywordMatches.length >= 2
        });
      }
    }
  }

  // Calculate authenticity score
  let authenticityScore = 0;
  let isAuthentic = false;

  if (civicIssues.length > 0) {
    // Use highest confidence + context bonus
    const bestIssue = civicIssues.reduce((best, current) =>
      (current.confidence > best.confidence) ? current : best
    );

    // Base score from confidence
    let score = bestIssue.confidence * 100;

    // Add bonuses
    if (bestIssue.hasContext) score += 20;
    if (bestIssue.isStrongMatch) score += 30;
    if (bestIssue.keywords.length >= 3) score += 15;

    authenticityScore = Math.min(100, Math.round(score));
    isAuthentic = authenticityScore > 50;
  }

  // Generate suggested complaint
  const suggestedComplaint = civicIssues.length > 0
    ? generateComplaintFromObjects(civicIssues)
    : null;

  return {
    success: true,
    detectedObjects,
    civicIssues,
    isAuthentic,
    authenticityScore,
    suggestedComplaint,
    civicIssueDetected: civicIssues.length > 0,
    summary: civicIssues.length > 0
      ? `Detected: ${civicIssues.map(o => o.type.replace('_', ' ')).join(', ')}`
      : 'No civic issue detected. Please upload a clear photo of the problem.'
  };
}

/**
 * Find civic issue from object class name
 */
function findCivicIssue(className) {
  // Check direct matches
  for (const [key, mapping] of Object.entries(OBJECT_TO_COMPLAINT_TYPE)) {
    if (className.includes(key)) {
      return {
        keyword: key,
        ...mapping,
        category: key
      };
    }
  }

  // Check keyword matches
  for (const [category, keywords] of Object.entries(CIVIC_ISSUE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (className.includes(keyword)) {
        const mapping = OBJECT_TO_COMPLAINT_TYPE[keyword];
        if (mapping) {
          return {
            keyword,
            ...mapping,
            category
          };
        }
      }
    }
  }

  return null;
}

/**
 * Generate a complaint description from detected objects
 */
function generateComplaintFromObjects(civicObjects) {
  // Sort by probability (highest first)
  const sorted = [...civicObjects].sort((a, b) => b.probability - a.probability);
  const primary = sorted[0];

  const templates = {
    pothole: (obj) => `Large pothole detected on the road. This poses a danger to vehicles and pedestrians. The road surface has deteriorated significantly at this location.`,
    road_damage: (obj) => `Road damage detected. The road surface is in poor condition and needs repair. This could cause vehicle damage or accidents.`,
    garbage: (obj) => `Garbage/waste accumulation detected. There is an accumulation of trash and waste at this location that needs immediate cleaning.`,
    drainage: (obj) => `Drainage issue detected. Water is not draining properly which could lead to flooding and water stagnation.`,
    water_leakage: (obj) => `Water leakage detected. There is visible water leak or pooling that needs attention from the water department.`,
    broken_streetlight: (obj) => `Streetlight not working or damaged. The area is poorly lit which poses safety concerns, especially at night.`,
    damaged_infrastructure: (obj) => `Infrastructure damage detected. A structure or surface is damaged and needs repair.`,
    stray_animals: (obj) => `Stray animals detected in the area. This could be a safety concern for residents.`,
    electricity: (obj) => `Electrical issue detected. There are exposed wires or electrical infrastructure problems that need immediate attention.`,
    sewage: (obj) => `Sewage issue detected. There is a sewage overflow or blockage that poses health hazards.`,
    noise_pollution: (obj) => `Pollution or environmental concern detected. There are environmental quality issues at this location.`
  };

  const templateFn = templates[primary.type] || templates.damaged_infrastructure;

  return {
    title: `AI Detected: ${primary.type.replace(/_/g, ' ').toUpperCase()} Issue`,
    description: templateFn(primary),
    type: primary.type,
    department: primary.department,
    priority: primary.priority,
    confidence: Math.round(primary.probability * 100),
    detectedIssues: sorted.map(o => ({
      type: o.type,
      confidence: Math.round(o.probability * 100)
    }))
  };
}

/**
 * Check if image is likely a real photo vs random/pixelated
 * Uses basic image quality heuristics
 */
export async function validateImageQuality(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;

      // Check minimum resolution
      if (width < 100 || height < 100) {
        resolve({
          valid: false,
          reason: 'Image resolution too low. Please upload a clearer photo.'
        });
        return;
      }

      // Check for extremely small images (likely icons/thumbnails)
      if (width < 200 || height < 200) {
        resolve({
          valid: true,
          warning: 'Image is quite small. For better analysis, please upload a higher resolution photo.'
        });
        return;
      }

      resolve({
        valid: true,
        dimensions: { width, height }
      });
    };
    img.onerror = () => {
      resolve({
        valid: false,
        reason: 'Unable to read the image. Please try a different photo.'
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

export default {
  loadModel,
  analyzeImage,
  validateImageQuality
};