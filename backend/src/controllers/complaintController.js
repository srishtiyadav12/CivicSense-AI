const { Op } = require('sequelize');
const { Complaint, User, ActivityLog } = require('../models');
const AIService = require('../services/aiService');
const ClusterService = require('../services/clusterService');
const { COMPLAINT_STATUS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../services/mailer');
const geoService = require('../services/geoService');
const { sendPush } = require('../services/pushService');
const { emitToUser, emitToRole, emitToDept, emitToComplaint } = require('../socket');

// Map nested location input -> flattened columns
function mapLocationInput(loc = {}) {
  const coords = loc.coordinates || null;
  return {
    locLat: coords ? coords[1] : null,
    locLng: coords ? coords[0] : null,
    locAddress: loc.address || '',
    locWard: loc.ward || '',
    locCity: loc.city || '',
    locState: loc.state || ''
  };
}

/**
 * Create a new complaint with AI analysis
 */
const createComplaint = asyncHandler(async (req, res) => {
  let { title, description, location, images: bodyImages } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }

  // Parse location if it's a JSON string (from FormData)
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid location format' });
    }
  }

  // Build image list from multer uploads + any URLs passed in body
  const uploadedFiles = (req.files || []).map(f => `/uploads/${f.filename}`);
  const bodyImageUrls = bodyImages ? (typeof bodyImages === 'string' ? JSON.parse(bodyImages) : bodyImages) : [];
  const allImages = [...bodyImageUrls, ...uploadedFiles];

  // Run AI analysis
  const analysis = await AIService.analyzeComplaint({ title, description, location });

  // Smart geo-routing: pin the ward from the GPS point, then auto-assign to the
  // least-loaded eligible official. Best-effort so routing can never block filing.
  let routing = { ward: null, assignment: null };
  try {
    const coords = location && location.coordinates && location.coordinates.length === 2
      ? { lat: location.coordinates[1], lng: location.coordinates[0] }
      : null;
    routing.ward = geoService.determineWard(coords ? coords.lat : null, coords ? coords.lng : null);
    routing.assignment = await geoService.autoAssign({
      department: analysis.department || 'General Administration',
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
      ward: routing.ward
    });
  } catch (routingErr) {
    console.warn('[geo-routing] Routing failed:', routingErr.message);
  }

  const loc = mapLocationInput(location);
  const complaint = await Complaint.create({
    title,
    description,
    type: analysis.complaint_type || 'other',
    priority: analysis.priority || 2,
    priorityLabel: analysis.priority_label || 'Medium',
    department: analysis.department || 'General Administration',
    ...loc,
    locWard: routing.ward || loc.locWard || null,
    assignedToId: routing.assignment ? routing.assignment.officialId : undefined,
    images: JSON.stringify(allImages),
    reportedById: req.user.id,
    aiAnalysis: JSON.stringify({
      classification: analysis.complaint_type,
      confidence: analysis.confidence || 0,
      sentimentScore: analysis.sentiment?.score || 0,
      sentimentLabel: analysis.sentiment?.label || 'neutral',
      keywords: analysis.keywords || [],
      analyzedAt: new Date()
    })
  });

  // Find similar complaints
  try {
    const similarResult = await AIService.findSimilar(complaint);
    if (similarResult.similarities && similarResult.similarities.length > 0) {
      complaint.similarComplaints = JSON.stringify(
        similarResult.similarities.map(s => ({
          complaint: s.complaint_id,
          similarityScore: s.score
        }))
      );
      await complaint.save({ fields: ['similarComplaints'] });

      // Auto-group this complaint into an existing cluster if a strong match exists
      await ClusterService.assignToCluster(complaint);
    }
  } catch (e) { /* similarity + clustering are best-effort */ }

  await ActivityLog.create({
    userId: req.user.id,
    action: 'complaint_created',
    targetModel: 'Complaint',
    targetId: complaint.id,
    details: JSON.stringify({ title: complaint.title, type: complaint.type })
  });

  // Real-time: push the fresh complaint to matching officials and admins so
  // their dashboards / live queues update without a manual refresh.
  try {
    const created = complaint.toJSON();
    const event = {
      type: 'new_complaint',
      complaintId: created.id,
      title: created.title,
      department: created.department,
      priority: created.priority,
      ward: created.locWard || null,
      assignedTo: routing.assignment ? routing.assignment.officialId : null,
      timestamp: new Date().toISOString()
    };
    emitToRole('admin', 'complaint:new', event);
    if (created.department) emitToDept(created.department, event);
    // Directly ping the assigned official so they see it land in their queue.
    if (routing.assignment && routing.assignment.officialId) {
      emitToUser(routing.assignment.officialId, 'complaint:new', event);
    }
    emitToComplaint(created.id, 'complaint:new', event);
  } catch (e) { /* real-time broadcast is best-effort */ }

  // Push notification: alert all admins about the new complaint (citizen's
  // subscription is handled client-side when they first open the app)
  try {
    await sendPush(
      `New complaint #${complaint.id}`,
      `${complaint.type?.replace(/_/g, ' ') || 'Issue'}: "${complaint.title}" — assigned to ${routing.assignment ? routing.assignment.officialName : 'TBD'}`,
      { url: `/complaints/${complaint.id}` }
    );
  } catch (e) { /* push is best-effort */ }

  const out = complaint.toJSON();
  if (routing.assignment) {
    out.routing = {
      ward: routing.ward,
      autoAssignedTo: routing.assignment.officialName,
      workloadAtAssignment: routing.assignment.workload
    };
  } else {
    out.routing = { ward: routing.ward || null, autoAssignedTo: null };
  }

  res.status(201).json({ success: true, complaint: out });
});

/**
 * Get complaint by ID
 */
const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id, {
    include: [
      { model: User, as: 'reportedBy', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'department'] }
    ]
  });

  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  res.status(200).json({ success: true, complaint: complaint.toJSON() });
});

/**
 * List complaints with role-based filters and pagination
 */
const listComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, status, type, department,
    priority, search, sortBy = 'createdAt', sortOrder = 'desc'
  } = req.query;

  const where = { isDeleted: false };

  // Role-based visibility
  if (req.user.role === 'citizen') {
    where.reportedById = req.user.id;
  } else if (req.user.role === 'official') {
    where.department = req.user.department;
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (department) where.department = department;
  if (priority) where.priority = priority;

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { description: { [Op.like]: term } }
    ];
  }

  const sortField = ['createdAt', 'updatedAt', 'priority', 'status', 'title'].includes(sortBy) ? sortBy : 'createdAt';
  const order = [[sortField, sortOrder === 'desc' ? 'DESC' : 'ASC']];

  const { count, rows } = await Complaint.findAndCountAll({
    where,
    order,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    include: [{ model: User, as: 'reportedBy', attributes: ['id', 'name', 'email'] }]
  });

  res.status(200).json({
    success: true,
    complaints: rows.map(c => c.toJSON()),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / parseInt(limit))
    }
  });
});

/**
 * Update complaint status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note = '', assignedTo } = req.body;

  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  if (!Object.values(COMPLAINT_STATUS).includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const updates = { status };
  if (assignedTo) updates.assignedToId = assignedTo;

  if (status === COMPLAINT_STATUS.RESOLVED) {
    const proof = JSON.parse(complaint.resolutionProof || '{}');
    proof.notes = note;
    proof.resolvedAt = new Date().toISOString();
    updates.resolutionProof = JSON.stringify(proof);
  }

  // Append to status history
  const history = JSON.parse(complaint.statusHistory || '[]');
  history.push({
    status,
    updatedBy: req.user.id,
    note,
    timestamp: new Date().toISOString()
  });
  updates.statusHistory = JSON.stringify(history);

  await complaint.update(updates);

  // Real-time broadcast: notify the reporting citizen, any assigned official,
  // and anyone subscribed to this specific complaint's live view.
  const statusEvent = {
    type: 'status_update',
    complaintId: complaint.id,
    title: complaint.title,
    status,
    note,
    updatedBy: req.user.id,
    timestamp: new Date().toISOString()
  };
  emitToUser(complaint.reportedById, 'complaint:status', statusEvent);
  if (complaint.assignedToId) emitToUser(complaint.assignedToId, 'complaint:status', statusEvent);
  emitToComplaint(complaint.id, 'complaint:status', statusEvent);

  // Admins get a live feed event too so a real-time activity wall can be shown.
  emitToRole('admin', 'complaint:activity', statusEvent);

  // Push notification: alert the reporting citizen and any subscribed officials
  try {
    const statusLabel = status.replace(/_/g, ' ');
    await sendPush(
      `Complaint #${complaint.id} — ${statusLabel}`,
      `"${complaint.title}" is now ${statusLabel}.${note ? ` Note: ${note}` : ''}`,
      { url: `/complaints/${complaint.id}`, userIds: [complaint.reportedById, complaint.assignedToId].filter(Boolean) }
    );
  } catch (e) { /* push is best-effort */ }

  await ActivityLog.create({
    userId: req.user.id,
    action: status === COMPLAINT_STATUS.RESOLVED ? 'complaint_resolved'
      : status === COMPLAINT_STATUS.REJECTED ? 'complaint_rejected'
      : 'status_changed',
    targetModel: 'Complaint',
    targetId: complaint.id,
    details: JSON.stringify({ status, note })
  });

  // Notify the reporting citizen about the status change (fire-and-forget)
  try {
    const reporter = await User.findByPk(complaint.reportedById, { attributes: ['id', 'name', 'email'] });
    if (reporter && reporter.email) {
      await sendEmail({
        to: reporter.email,
        subject: `Your CivicSense complaint "${complaint.title}" is now ${status.replace('_', ' ')}`,
        text: `Hi ${reporter.name},\n\nYour complaint "${complaint.title}" (ID: #${complaint.id}) has been updated.\n\nStatus: ${status.replace('_', ' ')}\n${note ? `Note: ${note}\n` : ''}\nTrack it anytime in your dashboard.\n\n— CivicSense AI`
      });
    }
  } catch (emailErr) {
    console.warn('[mailer] Status email error:', emailErr.message);
  }

  res.status(200).json({ success: true, complaint: complaint.toJSON() });
});

/**
 * Update resolved complaint with proof
 */
const addResolutionProof = asyncHandler(async (req, res) => {
  const { images = [], notes } = req.body;

  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  // Only officials assigned to this complaint or admins can add proof
  if (req.user.role === 'official' && complaint.department !== req.user.department) {
    return res.status(403).json({ success: false, message: 'Not authorized for this complaint' });
  }

  const proof = JSON.parse(complaint.resolutionProof || '{}');
  proof.images = images.length ? images : proof.images || [];
  proof.notes = notes != null ? notes : proof.notes || '';
  proof.resolvedAt = proof.resolvedAt || new Date().toISOString();

  await complaint.update({ resolutionProof: JSON.stringify(proof) });

  res.status(200).json({ success: true, complaint: complaint.toJSON() });
});

/**
 * Rate a resolved complaint (citizen review).
 * Only the reporting citizen may rate, and only after the complaint is resolved.
 */
const rateComplaint = asyncHandler(async (req, res) => {
  const { rating, feedback = '' } = req.body;
  const score = Number(rating);

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be a whole number between 1 and 5' });
  }

  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  // Only the citizen who reported this complaint can review it
  if (complaint.reportedById !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only the reporting citizen can rate this complaint' });
  }

  if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
    return res.status(400).json({ success: false, message: 'You can only rate a complaint once it is resolved' });
  }

  await complaint.update({ satisfactionRating: score, feedback: feedback.trim() });

  await ActivityLog.create({
    userId: req.user.id,
    action: 'complaint_rated',
    targetModel: 'Complaint',
    targetId: complaint.id,
    details: JSON.stringify({ rating: score, feedback })
  });

  res.status(200).json({ success: true, complaint: complaint.toJSON() });
});

/**
 * Reopen a resolved/rejected complaint.
 * When a citizen is unsatisfied, they send the issue back for further work.
 */
const reopenComplaint = asyncHandler(async (req, res) => {
  const { reason = 'Citizen reopened the complaint' } = req.body;

  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  // Only the reporting citizen can reopen their own complaint
  if (complaint.reportedById !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only the reporting citizen can reopen this complaint' });
  }

  if (![COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED].includes(complaint.status)) {
    return res.status(400).json({ success: false, message: 'Only resolved or rejected complaints can be reopened' });
  }

  // On reopen: move back to under_review, clear the review, keep the assignment
  const history = JSON.parse(complaint.statusHistory || '[]');
  history.push({
    status: COMPLAINT_STATUS.REOPENED,
    updatedBy: req.user.id,
    note: reason,
    timestamp: new Date().toISOString()
  });

  await complaint.update({
    status: COMPLAINT_STATUS.UNDER_REVIEW,
    satisfactionRating: null,
    feedback: '',
    statusHistory: JSON.stringify(history)
  });

  // Ping the assigned official + admins so they pick it back up.
  const reopenEvent = {
    type: 'status_update',
    complaintId: complaint.id,
    title: complaint.title,
    status: COMPLAINT_STATUS.UNDER_REVIEW,
    note: reason,
    reopened: true,
    timestamp: new Date().toISOString()
  };
  if (complaint.assignedToId) emitToUser(complaint.assignedToId, 'complaint:status', reopenEvent);
  emitToRole('admin', 'complaint:activity', reopenEvent);

  await ActivityLog.create({
    userId: req.user.id,
    action: 'complaint_reopened',
    targetModel: 'Complaint',
    targetId: complaint.id,
    details: JSON.stringify({ reason })
  });

  res.status(200).json({ success: true, complaint: complaint.toJSON() });
});

/**
 * Merge duplicate complaints
 */
const mergeDuplicate = asyncHandler(async (req, res) => {
  const { duplicateIds, parentId } = req.body;

  if (!parentId) {
    return res.status(400).json({ success: false, message: 'parentId is required' });
  }
  if (!Array.isArray(duplicateIds) || duplicateIds.length === 0) {
    return res.status(400).json({ success: false, message: 'duplicateIds must be a non-empty array' });
  }

  const parent = await Complaint.findByPk(parentId);
  if (!parent) {
    return res.status(404).json({ success: false, message: 'Parent complaint not found' });
  }

  await Complaint.update(
    { duplicateOfId: parentId, isDeleted: true },
    { where: { id: { [Op.in]: duplicateIds } } }
  );

  await ActivityLog.create({
    userId: req.user.id,
    action: 'complaint_updated',
    targetModel: 'Complaint',
    targetId: parentId,
    details: JSON.stringify({ mergedComplaints: duplicateIds.length })
  });

  res.status(200).json({
    success: true,
    message: `Merged ${duplicateIds.length} complaints into parent`,
    parent: parent.toJSON()
  });
});

/**
 * Export complaints as CSV (authorities). Respects the same role-based visibility
 * as listComplaints and accepts the same query filters.
 */
const exportComplaints = asyncHandler(async (req, res) => {
  const { status, type, department, priority, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const where = { isDeleted: false };

  if (req.user.role === 'citizen') {
    where.reportedById = req.user.id;
  } else if (req.user.role === 'official') {
    where.department = req.user.department;
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (department) where.department = department;
  if (priority) where.priority = priority;

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { description: { [Op.like]: term } }
    ];
  }

  const sortField = ['createdAt', 'updatedAt', 'priority', 'status', 'title'].includes(sortBy) ? sortBy : 'createdAt';
  const order = [[sortField, sortOrder === 'desc' ? 'DESC' : 'ASC']];

  const rows = await Complaint.findAll({
    where,
    order,
    include: [{ model: User, as: 'reportedBy', attributes: ['name', 'email'] }]
  });

  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = ['ID', 'Title', 'Type', 'Status', 'Priority', 'Department', 'Ward', 'City', 'Reported By', 'Reported Email', 'Created At'];
  const lines = [header.join(',')];

  rows.forEach(c => {
    lines.push([
      c.id,
      escape(c.title),
      escape(c.type),
      escape(c.status),
      c.priority,
      escape(c.department),
      escape(c.locWard),
      escape(c.locCity),
      escape(c.reportedBy?.name || ''),
      escape(c.reportedBy?.email || ''),
      new Date(c.createdAt).toISOString()
    ].join(','));
  });

  const csv = '﻿' + lines.join('\n'); // BOM for Excel compatibility
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="complaints-export-${Date.now()}.csv"`);
  res.status(200).send(csv);
});

/**
 * Delete complaint (soft delete)
 */
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint || complaint.isDeleted) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  // Only owner or admin can delete
  if (req.user.role === 'citizen' && complaint.reportedById !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this complaint' });
  }

  // Prevent mutating readonly before close
  await complaint.update({ isDeleted: true });

  res.status(200).json({ success: true, message: 'Complaint deleted' });
});

module.exports = {
  createComplaint,
  getComplaint,
  listComplaints,
  updateStatus,
  addResolutionProof,
  rateComplaint,
  reopenComplaint,
  mergeDuplicate,
  deleteComplaint,
  exportComplaints
};