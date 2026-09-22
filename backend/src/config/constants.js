module.exports = {
  COMPLAINT_TYPES: [
    'pothole',
    'garbage',
    'broken_streetlight',
    'water_leakage',
    'drainage',
    'damaged_infrastructure',
    'noise_pollution',
    'stray_animals',
    'road_damage',
    'public_property_damage',
    'sewage',
    'electricity',
    'other'
  ],

  DEPARTMENTS: {
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
  },

  COMPLAINT_STATUS: {
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    REJECTED: 'rejected',
    REOPENED: 'reopened'
  },

  PRIORITY_LEVELS: {
    CRITICAL: { score: 4, label: 'Critical', color: '#dc2626' },
    HIGH: { score: 3, label: 'High', color: '#ea580c' },
    MEDIUM: { score: 2, label: 'Medium', color: '#ca8a04' },
    LOW: { score: 1, label: 'Low', color: '#16a34a' }
  },

  USER_ROLES: {
    CITIZEN: 'citizen',
    OFFICIAL: 'official',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
  },

  // Automatic complaint clustering
  CLUSTER: {
    // Minimum similarity score needed to auto-join an existing cluster.
    AUTO_JOIN_THRESHOLD: 0.45,
    // Minimum size a cluster must be to count as a real "hotspot".
    MIN_CLUSTER_SIZE: 2
  },

  SEVERITY_KEYWORDS: {
    critical: ['dangerous', 'hazard', 'emergency', 'collapse', 'flood', 'electrocution', 'accident', 'injury', 'health risk', 'contaminated'],
    high: ['urgent', 'serious', 'broken', 'damaged', 'overflow', 'spill', 'large', 'major', 'extensive'],
    medium: ['moderate', 'noticeable', 'growing', 'worsening', 'frequent'],
    low: ['minor', 'small', 'cosmetic', 'aesthetic', 'small crack']
  }
};
