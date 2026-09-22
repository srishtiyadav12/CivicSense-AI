const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/complaintController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All complaint routes require authentication
router.use(authenticate);

router.route('/')
  .post(upload.array('images', 5), createComplaint)
  .get(listComplaints);

// Export must come before /:id so it isn't captured by the id param
router.get('/export', authorize('official', 'admin', 'super_admin'), exportComplaints);

router.get('/:id', getComplaint);

router.patch('/:id/status', authorize('official', 'admin', 'super_admin'), updateStatus);
router.patch('/:id/resolve', authorize('official', 'admin', 'super_admin'), addResolutionProof);
router.post('/merge', authorize('admin', 'super_admin'), mergeDuplicate);
router.delete('/:id', deleteComplaint);

// Citizen review loop — rate a resolved complaint, or reopen if unsatisfied
router.post('/:id/rate', authorize('citizen'), rateComplaint);
router.post('/:id/reopen', authorize('citizen'), reopenComplaint);

module.exports = router;
