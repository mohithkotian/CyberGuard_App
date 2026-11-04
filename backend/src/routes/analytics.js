const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/public/map-points', ctrl.getPublicMapPoints);

router.use(protect, restrictTo('admin', 'officer'));

router.get('/overview', ctrl.getOverview);
router.get('/by-category', ctrl.getByCategory);
router.get('/trends', ctrl.getTrends);
router.get('/geographic', ctrl.getGeographic);
router.get('/status-distribution', ctrl.getStatusDistribution);
router.get('/financial', ctrl.getFinancialAnalysis);
router.get('/map-points', ctrl.getMapPoints);
router.get('/link-analysis', ctrl.getLinkAnalysis);
router.get('/syndicate-surges', ctrl.getSyndicateSurgeAlerts);

// Phase 8: Master Syndicate Consolidation & Telecom Requisition
router.post('/syndicate/consolidate-docket', ctrl.consolidateSyndicateDocket);
router.get('/syndicate/dockets', ctrl.getSyndicateDockets);
router.post('/telecom/requisition-disconnect', ctrl.dispatchTelecomRequisition);
router.get('/telecom/requisitions', ctrl.getTelecomRequisitions);

module.exports = router;
