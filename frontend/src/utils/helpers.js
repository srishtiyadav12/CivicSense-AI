import dayjs from 'dayjs';

// Display labels for complaint types
export const COMPLAINT_TYPE_LABELS = {
  pothole: 'Pothole',
  garbage: 'Garbage',
  broken_streetlight: 'Broken Streetlight',
  water_leakage: 'Water Leakage',
  drainage: 'Drainage',
  damaged_infrastructure: 'Damaged Infrastructure',
  noise_pollution: 'Noise Pollution',
  stray_animals: 'Stray Animals',
  road_damage: 'Road Damage',
  public_property_damage: 'Public Property Damage',
  sewage: 'Sewage',
  electricity: 'Electricity',
  other: 'Other'
};

export const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical'
};

export const PRIORITY_COLORS = {
  1: '#16a34a',
  2: '#ca8a04',
  3: '#ea580c',
  4: '#dc2626'
};

export const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  reopened: 'Reopened'
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

export const formatDateShort = (date) => {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY');
};

export const timeAgo = (date) => {
  if (!date) return '—';
  return dayjs(date).fromNow ? dayjs(date).fromNow() : dayjs(date).format('DD MMM');
};

// Format complaint type key to display label
export const typeLabel = (type) => COMPLAINT_TYPE_LABELS[type] || type || 'Other';

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get role display name
export const roleLabel = (role) => {
  const labels = {
    citizen: 'Citizen',
    official: 'Official',
    admin: 'Admin',
    super_admin: 'Super Admin'
  };
  return labels[role] || role;
};

// Compute percentage
export const percent = (part, whole) => {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
};
