const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/complaintsController');
const { protect, restrictTo } = require('../middleware/auth');
const { parseNestedFields } = require('../middleware/parseBody');

const complaintValidation = [
  body('title').trim().isLength({ min: 2, max: 300 }).withMessage('Title must be at least 2 characters'),
  body('description').trim().isLength({ min: 3, max: 5000 }).withMessage('Description must be at least 3 characters'),
  body('victimDetails.incidentDate').optional({ checkFalsy: true }).isISO8601().withMessage('Valid incident date required if provided'),
];

// Public routes
router.get('/track/:complaintId', ctrl.trackComplaint);
router.get('/public/search', ctrl.publicSearch);
router.post('/analyze', ctrl.analyzeDescription);

// Protected routes
router.use(protect);
router.get('/:complaintId/evidence/:filename', ctrl.getEvidence);
router.post(
  '/',
  ctrl.upload,
  parseNestedFields(['victimDetails', 'suspectInfo', 'location']),
  complaintValidation,
  ctrl.createComplaint
);
router.get('/', ctrl.getComplaints);
router.get('/:id', ctrl.getComplaint);

// Admin/Officer routes
router.patch('/:id/status', restrictTo('admin', 'officer'), ctrl.updateStatus);
router.delete('/:id', restrictTo('admin'), ctrl.deleteComplaint);

module.exports = router;
