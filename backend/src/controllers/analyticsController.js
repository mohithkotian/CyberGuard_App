const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { compileSyndicateDocket } = require('../utils/syndicateConsolidator');
const { compileTelecomRequisition } = require('../utils/telecomRequisition');

// In-memory persistent registries for Master Syndicate Dockets and Telecom Requisitions
const syndicateDocketsRegistry = [];
const telecomRequisitionsRegistry = [];

// @desc    Dashboard overview stats
// @route   GET /api/analytics/overview
exports.getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalComplaints, pendingComplaints, resolvedComplaints,
      thisMonthComplaints, lastMonthComplaints,
      totalUsers, criticalComplaints,
      avgResolutionTime,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Complaint.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      User.countDocuments({ role: 'user' }),
      Complaint.countDocuments({ severity: 'critical' }),
      Complaint.aggregate([
        { $match: { status: 'resolved', 'resolution.resolvedAt': { $exists: true } } },
        {
          $project: {
            resolutionTime: {
              $subtract: ['$resolution.resolvedAt', '$createdAt'],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: '$resolutionTime' } } },
      ]),
    ]);

    const growthRate = lastMonthComplaints > 0
      ? (((thisMonthComplaints - lastMonthComplaints) / lastMonthComplaints) * 100).toFixed(1)
      : 0;

    const avgDays = avgResolutionTime[0]
      ? Math.round(avgResolutionTime[0].avg / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      status: 'success',
      data: {
        overview: {
          totalComplaints,
          pendingComplaints,
          resolvedComplaints,
          thisMonthComplaints,
          growthRate: parseFloat(growthRate),
          totalUsers,
          criticalComplaints,
          avgResolutionDays: avgDays,
          resolutionRate: totalComplaints > 0
            ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
            : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complaints by category
// @route   GET /api/analytics/by-category
exports.getByCategory = async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          avgSeverity: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$severity', 'critical'] }, then: 4 },
                  { case: { $eq: ['$severity', 'high'] }, then: 3 },
                  { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                  { case: { $eq: ['$severity', 'low'] }, then: 1 },
                ],
                default: 2,
              },
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ status: 'success', data: { categories: data } });
  } catch (error) {
    next(error);
  }
};

// @desc    Monthly trends
// @route   GET /api/analytics/trends
exports.getTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const data = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const formatted = data.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: item.total,
      resolved: item.resolved,
      pending: item.pending,
      critical: item.critical,
    }));

    res.json({ status: 'success', data: { trends: formatted } });
  } catch (error) {
    next(error);
  }
};

// @desc    Geographic distribution
// @route   GET /api/analytics/geographic
exports.getGeographic = async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      { $match: { 'location.state': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$location.state',
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({ status: 'success', data: { geographic: data } });
  } catch (error) {
    next(error);
  }
};

// @desc    Map points (coordinates)
// @route   GET /api/analytics/map-points
exports.getMapPoints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find()
      .select('complaintId title category subCategory severity priority isImmediateAction status location victimDetails.pincode createdAt')
      .lean();

    const points = complaints.map(c => {
      let coords = c.location?.coordinates;
      if (!coords || coords.length < 2 || !coords[0] || !coords[1]) {
        // Fallback Bangalore IT corridor coordinates with slight jitter
        coords = [77.5946 + (Math.random() - 0.5) * 0.08, 12.9716 + (Math.random() - 0.5) * 0.08];
      }
      return {
        ...c,
        location: {
          type: 'Point',
          coordinates: coords
        }
      };
    });

    res.json({ status: 'success', data: { points } });
  } catch (error) {
    next(error);
  }
};

// @desc    Public map points (Anonymized)
// @route   GET /api/analytics/public/map-points
exports.getPublicMapPoints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find()
      .select('category subCategory severity priority isImmediateAction location createdAt')
      .lean();

    const points = complaints.map(c => {
      let coords = c.location?.coordinates;
      if (!coords || coords.length < 2 || !coords[0] || !coords[1]) {
        coords = [77.5946 + (Math.random() - 0.5) * 0.08, 12.9716 + (Math.random() - 0.5) * 0.08];
      }
      return {
        _id: c._id,
        category: c.category || 'Other',
        subCategory: c.subCategory || '',
        severity: c.severity || 'low',
        priority: c.priority || 'standard',
        isImmediateAction: c.isImmediateAction || false,
        location: {
          type: 'Point',
          coordinates: coords
        },
        createdAt: c.createdAt
      };
    });

    res.json({ status: 'success', data: { points } });
  } catch (error) {
    next(error);
  }
};

// @desc    Status distribution
// @route   GET /api/analytics/status-distribution
exports.getStatusDistribution = async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ status: 'success', data: { distribution: data } });
  } catch (error) {
    next(error);
  }
};

// @desc    Financial loss analysis
// @route   GET /api/analytics/financial
exports.getFinancialAnalysis = async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      { $match: { 'victimDetails.financialLoss': { $gt: 0 } } },
      {
        $group: {
          _id: '$category',
          totalLoss: { $sum: '$victimDetails.financialLoss' },
          avgLoss: { $avg: '$victimDetails.financialLoss' },
          count: { $sum: 1 },
          maxLoss: { $max: '$victimDetails.financialLoss' },
        },
      },
      { $sort: { totalLoss: -1 } },
    ]);

    const totalFinancialLoss = data.reduce((sum, d) => sum + d.totalLoss, 0);

    res.json({
      status: 'success',
      data: { financialAnalysis: data, totalFinancialLoss },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspect link analysis & Organized Crime Syndicate Graph
// @route   GET /api/analytics/link-analysis
exports.getLinkAnalysis = async (req, res, next) => {
  try {
    // 1. Fetch relevant complaints containing suspect details or OCR intelligence
    const complaints = await Complaint.find({
      $or: [
        { 'ocrData.extracted.phones': { $exists: true, $ne: [] } },
        { 'ocrData.extracted.upis': { $exists: true, $ne: [] } },
        { 'ocrData.extracted.accounts': { $exists: true, $ne: [] } },
        { 'suspectInfo.details': { $exists: true, $ne: '' } },
        { 'suspectInfo.name': { $exists: true, $ne: '' } }
      ]
    }).select('complaintId title category severity status amountLost lostMoney suspectInfo ocrData createdAt').lean();

    // In-memory relational indexer for multi-field cross-referencing
    const phoneMap = new Map();
    const upiMap = new Map();
    const accountMap = new Map();

    const normalizePhone = (num) => {
      if (!num) return null;
      const digits = String(num).replace(/\D/g, '');
      if (digits.length >= 10) return digits.slice(-10);
      return null;
    };

    const normalizeUpi = (upi) => {
      if (!upi || typeof upi !== 'string' || !upi.includes('@')) return null;
      return upi.trim().toLowerCase();
    };

    const normalizeAccount = (acc) => {
      if (!acc) return null;
      const clean = String(acc).replace(/\s/g, '');
      if (clean.length >= 8 && /^\d+$/.test(clean)) return clean;
      return null;
    };

    complaints.forEach((c) => {
      const caseMeta = {
        id: c.complaintId || String(c._id),
        title: c.title,
        category: c.category,
        severity: c.severity,
        status: c.status,
        amount: c.amountLost || (c.lostMoney ? 25000 : 0),
        createdAt: c.createdAt
      };

      // Index OCR phones
      (c.ocrData?.extracted?.phones || []).forEach(p => {
        const norm = normalizePhone(p);
        if (norm) {
          if (!phoneMap.has(norm)) phoneMap.set(norm, []);
          phoneMap.get(norm).push(caseMeta);
        }
      });

      // Index Suspect details phones (regex extraction)
      if (c.suspectInfo?.details) {
        const found = String(c.suspectInfo.details).match(/(\+?\d{1,4}[\s-]?)?\d{10}/g);
        (found || []).forEach(p => {
          const norm = normalizePhone(p);
          if (norm) {
            if (!phoneMap.has(norm)) phoneMap.set(norm, []);
            if (!phoneMap.get(norm).some(item => item.id === caseMeta.id)) {
              phoneMap.get(norm).push(caseMeta);
            }
          }
        });
      }

      // Index OCR UPIs
      (c.ocrData?.extracted?.upis || []).forEach(u => {
        const norm = normalizeUpi(u);
        if (norm) {
          if (!upiMap.has(norm)) upiMap.set(norm, []);
          upiMap.get(norm).push(caseMeta);
        }
      });

      // Index OCR bank accounts
      (c.ocrData?.extracted?.accounts || []).forEach(a => {
        const norm = normalizeAccount(a);
        if (norm) {
          if (!accountMap.has(norm)) accountMap.set(norm, []);
          accountMap.get(norm).push(caseMeta);
        }
      });
    });

    // Format repeat links
    const formatLinkList = (map, type) => {
      const list = [];
      map.forEach((cases, identifier) => {
        if (cases.length > 1) {
          const totalLoss = cases.reduce((sum, cs) => sum + (Number(cs.amount) || 0), 0);
          list.push({
            _id: identifier,
            type,
            count: cases.length,
            totalLoss,
            cases
          });
        }
      });
      return list.sort((a, b) => b.count - a.count);
    };

    const linkedPhones = formatLinkList(phoneMap, 'phone');
    const linkedUpis = formatLinkList(upiMap, 'upi');
    const linkedAccounts = formatLinkList(accountMap, 'bank');

    // Build Syndicate Graph Nodes & Edges
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    const addNode = (id, label, type, meta = {}) => {
      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        nodes.push({ id, label, type, ...meta });
      }
    };

    // Add identifier nodes & connected case nodes with 2D spatial graph layout
    const linksSlice = [...linkedPhones, ...linkedUpis, ...linkedAccounts].slice(0, 30);
    const totalEntities = Math.max(linksSlice.length, 1);
    const centerX = 450;
    const centerY = 275;
    const baseRadius = 190;

    linksSlice.forEach((link, linkIdx) => {
      const entityId = `${link.type}:${link._id}`;
      const angle = (linkIdx / totalEntities) * 2 * Math.PI;
      const ex = Math.round(centerX + baseRadius * Math.cos(angle));
      const ey = Math.round(centerY + baseRadius * Math.sin(angle));

      addNode(entityId, link._id, link.type, {
        frequency: link.count,
        totalLoss: link.totalLoss,
        x: ex,
        y: ey,
        color: link.type === 'phone' ? '#d96464' : link.type === 'upi' ? '#d8a43a' : '#38bdf8',
        cases: link.cases
      });

      const caseCount = link.cases.length;
      link.cases.forEach((cs, cIdx) => {
        const caseNodeId = `case:${cs.id}`;
        const subAngle = angle + ((cIdx - (caseCount - 1) / 2) * 0.35);
        const subRadius = baseRadius + 65 + (cIdx % 2) * 20;
        const cx = Math.round(centerX + subRadius * Math.cos(subAngle));
        const cy = Math.round(centerY + subRadius * Math.sin(subAngle));

        addNode(caseNodeId, cs.id, 'case', {
          category: cs.category,
          severity: cs.severity,
          status: cs.status,
          amount: cs.amount,
          x: cx,
          y: cy,
          color: '#3DF5C0'
        });

        edges.push({
          id: `${caseNodeId}->${entityId}`,
          source: caseNodeId,
          target: entityId,
          label: link.type.toUpperCase()
        });
      });
    });

    // Detect clusters / syndicates
    const syndicates = [];
    linkedPhones.forEach((p, idx) => {
      if (p.count >= 2) {
        syndicates.push({
          id: `SYN-${1000 + idx}`,
          name: `Syndicate Hub ${p._id}`,
          primaryIdentifier: p._id,
          type: 'phone',
          caseCount: p.count,
          totalExposures: p.totalLoss,
          cases: p.cases
        });
      }
    });

    res.json({
      status: 'success',
      data: {
        links: {
          phones: linkedPhones,
          upis: linkedUpis,
          accounts: linkedAccounts
        },
        syndicateGraph: {
          nodes,
          edges,
          totalClusters: syndicates.length
        },
        syndicates: syndicates.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Real-time syndicate velocity detection & cross-jurisdiction surge alerts
// @route   GET /api/analytics/syndicate-surges
exports.getSyndicateSurgeAlerts = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({
      $or: [
        { 'ocrData.extracted.phones': { $exists: true, $ne: [] } },
        { 'ocrData.extracted.upis': { $exists: true, $ne: [] } },
        { 'ocrData.extracted.accounts': { $exists: true, $ne: [] } },
        { 'suspectInfo.details': { $exists: true, $ne: '' } },
        { 'suspectInfo.name': { $exists: true, $ne: '' } }
      ]
    }).select('complaintId title category severity status amountLost lostMoney suspectInfo ocrData location createdAt').lean();

    const normalizePhone = (num) => {
      if (!num) return null;
      const digits = String(num).replace(/\D/g, '');
      if (digits.length >= 10) return digits.slice(-10);
      return null;
    };

    const normalizeUpi = (upi) => {
      if (!upi || typeof upi !== 'string' || !upi.includes('@')) return null;
      return upi.trim().toLowerCase();
    };

    const normalizeAccount = (acc) => {
      if (!acc) return null;
      const clean = String(acc).replace(/\s/g, '');
      if (clean.length >= 8 && /^\d+$/.test(clean)) return clean;
      return null;
    };

    const identifierMap = new Map();

    const addOccurrence = (type, rawVal, c) => {
      let identifier = null;
      if (type === 'phone') identifier = normalizePhone(rawVal);
      else if (type === 'upi') identifier = normalizeUpi(rawVal);
      else if (type === 'bank') identifier = normalizeAccount(rawVal);

      if (!identifier) return;

      const key = `${type}:${identifier}`;
      if (!identifierMap.has(key)) {
        identifierMap.set(key, {
          type,
          identifier,
          cases: []
        });
      }

      const entry = identifierMap.get(key);
      const caseId = c.complaintId || String(c._id);
      if (!entry.cases.some(item => item.id === caseId)) {
        const city = c.location?.city || '';
        const state = c.location?.state || '';
        const jurisdiction = (city && state) ? `${city}, ${state}` : (city || state || 'Unspecified Jurisdiction');

        entry.cases.push({
          id: caseId,
          title: c.title || 'Untitled Case',
          category: c.category || 'Cyber Fraud',
          severity: c.severity || 'medium',
          status: c.status || 'pending',
          amount: Number(c.amountLost) || (c.lostMoney ? 25000 : 0),
          jurisdiction,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
        });
      }
    };

    complaints.forEach((c) => {
      (c.ocrData?.extracted?.phones || []).forEach(p => addOccurrence('phone', p, c));
      if (c.suspectInfo?.details) {
        const found = String(c.suspectInfo.details).match(/(\+?\d{1,4}[\s-]?)?\d{10}/g);
        (found || []).forEach(p => addOccurrence('phone', p, c));
      }
      (c.ocrData?.extracted?.upis || []).forEach(u => addOccurrence('upi', u, c));
      (c.ocrData?.extracted?.accounts || []).forEach(a => addOccurrence('bank', a, c));
    });

    const now = new Date();
    const surgeAlerts = [];

    identifierMap.forEach((data) => {
      if (data.cases.length >= 2) {
        data.cases.sort((a, b) => b.createdAt - a.createdAt);

        const totalCases = data.cases.length;
        const totalLoss = data.cases.reduce((sum, cs) => sum + (Number(cs.amount) || 0), 0);

        const cases24h = data.cases.filter(cs => (now - cs.createdAt) <= 24 * 60 * 60 * 1000).length;
        const cases48h = data.cases.filter(cs => (now - cs.createdAt) <= 48 * 60 * 60 * 1000).length;
        const cases7d = data.cases.filter(cs => (now - cs.createdAt) <= 7 * 24 * 60 * 60 * 1000).length;

        const distinctJurisdictions = [...new Set(data.cases.map(cs => cs.jurisdiction).filter(j => j !== 'Unspecified Jurisdiction'))];
        const isCrossJurisdiction = distinctJurisdictions.length >= 2;

        let severity = 'MONITORED_CLUSTER';
        let alertScore = 50;

        if (totalCases >= 4 || cases24h >= 2 || (cases48h >= 2 && isCrossJurisdiction) || totalLoss >= 500000) {
          severity = 'CRITICAL_SURGE';
          alertScore = 95;
        } else if (totalCases >= 3 || cases48h >= 1 || cases7d >= 2 || isCrossJurisdiction || totalLoss >= 100000) {
          severity = 'HIGH_VELOCITY';
          alertScore = 75;
        } else {
          severity = 'EMERGING_CLUSTER';
          alertScore = 50;
        }

        let recommendedAction = 'Maintain surveillance on suspect identifier across active investigations.';
        if (severity === 'CRITICAL_SURGE') {
          if (data.type === 'bank') {
            recommendedAction = `Issue urgent Section 106 BNSS Statutory Debit-Freeze notice to Nodal Fraud Desk of bank account ${data.identifier}.`;
          } else if (data.type === 'upi') {
            recommendedAction = `Transmit emergency freeze directive to NPCI and PSP liaison for UPI VPA ${data.identifier}.`;
          } else {
            const locLabel = distinctJurisdictions.join(' & ') || 'affected stations';
            recommendedAction = `Coordinate inter-district cyber task force across ${locLabel} and dispatch CDR/CAF request to telco nodal.`;
          }
        } else if (severity === 'HIGH_VELOCITY') {
          recommendedAction = `Consolidate case files across ${distinctJurisdictions.length || 1} jurisdictional zones and verify KYC records.`;
        }

        surgeAlerts.push({
          alertId: `SURGE-${data.type.toUpperCase()}-${data.identifier.slice(-4)}`,
          identifier: data.identifier,
          identifierType: data.type,
          caseCount: totalCases,
          cases24h,
          cases48h,
          cases7d,
          totalLoss,
          jurisdictions: distinctJurisdictions.length > 0 ? distinctJurisdictions : ['Multi-District (Pending Geolocation)'],
          isCrossJurisdiction,
          severity,
          alertScore,
          recommendedAction,
          firstSeen: data.cases[data.cases.length - 1].createdAt,
          lastSeen: data.cases[0].createdAt,
          cases: data.cases
        });
      }
    });

    surgeAlerts.sort((a, b) => b.alertScore - a.alertScore || b.caseCount - a.caseCount);

    const summary = {
      totalActiveSurges: surgeAlerts.length,
      criticalCount: surgeAlerts.filter(a => a.severity === 'CRITICAL_SURGE').length,
      highVelocityCount: surgeAlerts.filter(a => a.severity === 'HIGH_VELOCITY').length,
      crossJurisdictionCount: surgeAlerts.filter(a => a.isCrossJurisdiction).length,
      totalFinancialRisk: surgeAlerts.reduce((sum, a) => sum + a.totalLoss, 0)
    };

    res.json({
      status: 'success',
      data: {
        surgeAlerts,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Consolidate multi-victim syndicate complaints into Master Section 111 BNS Docket
// @route   POST /api/analytics/syndicate/consolidate-docket
exports.consolidateSyndicateDocket = async (req, res, next) => {
  try {
    const { syndicateId, complaintIds, leadAgency, notes } = req.body;
    if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
      return next(new AppError('At least one complaintId is required to compile a syndicate docket.', 400));
    }

    const validObjectIds = complaintIds.filter(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));

    const complaints = await Complaint.find({
      $or: [
        { complaintId: { $in: complaintIds } },
        { _id: { $in: validObjectIds } }
      ]
    });

    if (!complaints || complaints.length === 0) {
      return next(new AppError('No matching complaints found for the specified complaint IDs.', 404));
    }

    const docket = compileSyndicateDocket({
      syndicateId,
      leadAgency: leadAgency || 'State Cyber Crime Command / CBI Cyber Crime Division',
      investigatingOfficer: {
        name: req.user?.name || 'Superintendent of Police',
        badge: req.user?.badgeNumber || 'SP-CYBER-HQ'
      },
      complaints,
      notes
    });

    syndicateDocketsRegistry.unshift(docket);

    // Commit to custody and timeline of constituent complaints
    const officerId = req.user?._id;
    const custodyNote = `Consolidated into Inter-Jurisdictional Master Syndicate Docket ${docket.docketId} (Sec 111 BNS 2023) under ${docket.leadAgency}. SHA-256: ${docket.sha256Seal.slice(0, 16)}...`;

    for (const comp of complaints) {
      if (!comp.chainOfCustody) comp.chainOfCustody = [];
      comp.chainOfCustody.push({
        action: 'SYNDICATE_CONSOLIDATED_BNS111',
        performedBy: officerId,
        details: custodyNote,
        timestamp: new Date()
      });

      if (!comp.timeline) comp.timeline = [];
      comp.timeline.push({
        status: comp.status,
        title: 'Master Syndicate Docket Consolidated (Sec 111 BNS)',
        description: `Linked into organized crime syndicate docket ${docket.docketId} with ${docket.metrics.victimCount} victims across ${docket.metrics.jurisdictionCount} jurisdictions.`,
        updatedBy: officerId,
        timestamp: new Date()
      });

      await comp.save();
    }

    res.status(201).json({
      status: 'success',
      data: docket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve all consolidated Master Syndicate Dockets
// @route   GET /api/analytics/syndicate/dockets
exports.getSyndicateDockets = async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: syndicateDocketsRegistry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue Emergency TAFCOP / Sanchar Saathi Telecom Disconnection & CEIR IMEI Barring Directive
// @route   POST /api/analytics/telecom/requisition-disconnect
exports.dispatchTelecomRequisition = async (req, res, next) => {
  try {
    const { phone, imei, complaintIds = [], carrier, reason, requestedAction } = req.body;
    if (!phone) {
      return next(new AppError('Phone number (MSISDN) is required for telecom requisition.', 400));
    }

    const requisition = compileTelecomRequisition({
      phone,
      imei,
      complaintIds,
      carrier,
      reason,
      requestedAction,
      officerName: req.user?.name || 'Investigating Officer, Cyber Crime Division',
      officerBadge: req.user?.badgeNumber || 'CYBER-LEA-NODAL'
    });

    telecomRequisitionsRegistry.unshift(requisition);

    // If complaintIds supplied, commit to custody and timeline
    if (complaintIds && complaintIds.length > 0) {
      const validObjectIds = complaintIds.filter(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));
      const complaints = await Complaint.find({
        $or: [
          { complaintId: { $in: complaintIds } },
          { _id: { $in: validObjectIds } }
        ]
      });

      const officerId = req.user?._id;
      for (const comp of complaints) {
        if (!comp.chainOfCustody) comp.chainOfCustody = [];
        comp.chainOfCustody.push({
          action: 'TAFCOP_SIM_REQUISITION_ISSUED',
          performedBy: officerId,
          details: `Statutory Section 20 Telecommunications Act 2023 emergency SIM/IMEI disconnection directive ${requisition.requisitionId} dispatched to ${requisition.carrier}.`,
          timestamp: new Date()
        });

        if (!comp.timeline) comp.timeline = [];
        comp.timeline.push({
          status: comp.status,
          title: 'TAFCOP / CEIR SIM Disconnection Requisitioned',
          description: `Dispatched statutory directive ${requisition.requisitionId} to ${requisition.carrier} for MSISDN +91 ${requisition.phone} and CEIR IMEI barring.`,
          updatedBy: officerId,
          timestamp: new Date()
        });

        await comp.save();
      }
    }

    res.status(201).json({
      status: 'success',
      data: requisition
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve all active Telecom Requisitions
// @route   GET /api/analytics/telecom/requisitions
exports.getTelecomRequisitions = async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: telecomRequisitionsRegistry
    });
  } catch (error) {
    next(error);
  }
};
