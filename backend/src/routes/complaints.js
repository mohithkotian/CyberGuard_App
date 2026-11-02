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
router.get('/public/radar', ctrl.getCommunityScamRadar);
router.post('/analyze', ctrl.analyzeDescription);
router.post('/transcribe-statement', ctrl.transcribeCitizenStatement);

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
router.get('/:id/custody', ctrl.getCustodyLedger);

// Admin/Officer routes
router.post('/batch-enforcement', restrictTo('admin', 'officer'), ctrl.batchEnforcement);
router.patch('/:id/status', restrictTo('admin', 'officer'), ctrl.updateStatus);
router.post('/:id/restitution-milestone', restrictTo('admin', 'officer'), ctrl.updateRestitutionMilestone);
router.get('/:id/restitution-status', ctrl.getRestitutionStatus);
router.post('/:id/bank-freeze', restrictTo('admin', 'officer'), ctrl.issueBankFreezeNotice);
router.get('/:id/fir-draft', restrictTo('admin', 'officer'), ctrl.generateFIRDraft);
router.get('/:id/magistrate-docket', restrictTo('admin', 'officer'), ctrl.generateMagistrateDocket);
router.post('/:id/telecom-requisition', restrictTo('admin', 'officer'), ctrl.issueTelecomRequisitionNotice);
router.get('/:id/restitution-petition', ctrl.generateRestitutionPetition);
router.get('/:id/money-trail', ctrl.getMoneyTrail);
router.post('/:id/money-trail/hop', restrictTo('admin', 'officer'), ctrl.addMoneyTrailHop);
router.post('/:id/emergency-takedown', ctrl.issueEmergencyTakedownNotice);
router.get('/:id/zero-fir-transfer', restrictTo('admin', 'officer'), ctrl.generateZeroFIRTransfer);
router.post('/:id/section65b-affidavit', ctrl.generateSection65BAffidavit);
router.delete('/:id', restrictTo('admin'), ctrl.deleteComplaint);

module.exports = router;
