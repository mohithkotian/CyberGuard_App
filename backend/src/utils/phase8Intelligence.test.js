const mongoose = require('mongoose');
const { compileSyndicateDocket, maskName } = require('./syndicateConsolidator');
const { compileTelecomRequisition, resolveCarrier, normalizeIndianPhone } = require('./telecomRequisition');
const Complaint = require('../models/Complaint');
const analyticsController = require('../controllers/analyticsController');

describe('Phase 8: Syndicate Consolidation & Telecom Requisition Unit Tests', () => {
  describe('syndicateConsolidator', () => {
    test('throws error if complaints array is empty or missing', () => {
      expect(() => compileSyndicateDocket({ complaints: [] })).toThrow(/At least one complaint is required/i);
      expect(() => compileSyndicateDocket({})).toThrow(/At least one complaint is required/i);
    });

    test('masks complainant names accurately for privacy preservation', () => {
      expect(maskName('Mohith Kumar')).toBe('M***h K***r');
      expect(maskName('Al')).toBe('Al');
      expect(maskName(null)).toBe('Protected Complainant');
    });

    test('compiles statutory Master Syndicate Docket with aggregated financials and Section 111 BNS citations', () => {
      const mockComplaints = [
        {
          complaintId: 'CMP-1001',
          amountLost: 45000,
          victimDetails: { name: 'Rahul Sharma' },
          location: { city: 'Bengaluru', state: 'Karnataka' },
          category: 'Digital Arrest Scam',
          ocrData: {
            extracted: {
              phones: ['9880011223'],
              upis: ['cyberarrest@icici'],
              accounts: ['919880011223'],
              ifscs: ['ICIC0000001']
            }
          },
          createdAt: new Date('2026-10-15')
        },
        {
          complaintId: 'CMP-1002',
          amountLost: 75000,
          victimDetails: { name: 'Priya Iyer' },
          location: { city: 'Mumbai', state: 'Maharashtra' },
          category: 'Digital Arrest Scam',
          suspectInfo: { details: 'Offender contacted on WhatsApp +91 9880011223 demanding bail deposit' },
          ocrData: {
            extracted: {
              phones: ['9880011223'],
              upis: ['cyberarrest@icici'],
              accounts: ['919880011223']
            }
          },
          createdAt: new Date('2026-10-18')
        }
      ];

      const docket = compileSyndicateDocket({
        syndicateId: 'SYN-TEST-99',
        leadAgency: 'State Cyber Crime Command Karnataka',
        complaints: mockComplaints,
        notes: 'Priority multi-jurisdiction syndicate operating out of NCR.'
      });

      expect(docket.docketId).toMatch(/^SYN-BNS111-2026-[A-F0-9]{6}$/);
      expect(docket.metrics.totalDefraudedAmount).toBe(120000);
      expect(docket.metrics.victimCount).toBe(2);
      expect(docket.metrics.jurisdictionCount).toBe(2);
      expect(docket.identifiers.phones).toContain('9880011223');
      expect(docket.identifiers.upis).toContain('cyberarrest@icici');
      expect(docket.identifiers.accounts).toContain('919880011223');
      expect(docket.sha256Seal).toHaveLength(64);
      expect(docket.statutorySections.some(s => s.section === 'Section 111')).toBe(true);
      expect(docket.statutorySections.some(s => s.section === 'Section 107')).toBe(true);
    });
  });

  describe('telecomRequisition', () => {
    test('normalizes Indian phone numbers correctly', () => {
      expect(normalizeIndianPhone('+91 98800 11223')).toBe('9880011223');
      expect(normalizeIndianPhone('09880011223')).toBe('9880011223');
      expect(normalizeIndianPhone('123')).toBeNull();
      expect(normalizeIndianPhone(null)).toBeNull();
    });

    test('resolves carrier from MSC prefix', () => {
      expect(resolveCarrier('9880011223')).toBe('Bharti Airtel Limited');
      expect(resolveCarrier('7001122334')).toBe('Reliance Jio Infocomm Limited');
      expect(resolveCarrier('9701122334')).toBe('Vodafone Idea Limited (Vi)');
      expect(resolveCarrier('9401122334')).toBe('Bharat Sanchar Nigam Limited (BSNL)');
    });

    test('throws error if phone number is invalid', () => {
      expect(() => compileTelecomRequisition({ phone: '123' })).toThrow(/Valid 10-digit Indian mobile number/i);
    });

    test('generates formal Section 20 Telecommunications Act 2023 emergency directive', () => {
      const req = compileTelecomRequisition({
        phone: '9880011223',
        imei: '861234567890123',
        complaintIds: ['CMP-1001', 'CMP-1002'],
        officerName: 'Inspector Ananya Rao',
        officerBadge: 'BLR-CYBER-884'
      });

      expect(req.requisitionId).toMatch(/^DOT-TAFCOP-2026-[A-F0-9]{6}$/);
      expect(req.phone).toBe('9880011223');
      expect(req.carrier).toBe('Bharti Airtel Limited');
      expect(req.imei).toBe('861234567890123');
      expect(req.directiveText).toContain('SECTION 20 OF THE TELECOMMUNICATIONS ACT, 2023');
      expect(req.directiveText).toContain('CEIR HARDWARE BLACKLISTING');
      expect(req.sha256Seal).toHaveLength(64);
    });
  });
});

describe('Phase 8: Controller & Routes Integration Tests', () => {
  const officerId = new mongoose.Types.ObjectId();
  const mockOfficer = {
    _id: officerId,
    name: 'Superintendent Vikram Singh',
    badgeNumber: 'SP-CYBER-007',
    role: 'officer'
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('POST /api/analytics/syndicate/consolidate-docket rejects missing complaintIds', async () => {
    const req = { body: {}, user: mockOfficer };
    let capturedError;
    const res = {};
    const next = (err) => { capturedError = err; };

    await analyticsController.consolidateSyndicateDocket(req, res, next);
    expect(capturedError).toBeDefined();
    expect(capturedError.statusCode).toBe(400);
  });

  test('POST /api/analytics/syndicate/consolidate-docket returns 404 when no complaints match', async () => {
    const req = { body: { complaintIds: ['CMP-NON-EXISTENT'] }, user: mockOfficer };
    let capturedError;
    const res = {};
    const next = (err) => { capturedError = err; };

    jest.spyOn(Complaint, 'find').mockResolvedValue([]);

    await analyticsController.consolidateSyndicateDocket(req, res, next);
    expect(capturedError).toBeDefined();
    expect(capturedError.statusCode).toBe(404);
  });

  test('POST /api/analytics/syndicate/consolidate-docket successfully consolidates multi-jurisdiction cases and appends custody ledger', async () => {
    const mockCompA = {
      _id: new mongoose.Types.ObjectId(),
      complaintId: 'CMP-8001',
      title: 'Digital Arrest impersonation fraud',
      description: 'Extorted funds via fake CBI arrest warrant',
      category: 'Financial Fraud',
      amountLost: 80000,
      lostMoney: true,
      victimDetails: { name: 'Sanjay Dutt', mobile: '9123456789' },
      location: { city: 'New Delhi', state: 'Delhi' },
      ocrData: {
        extracted: {
          phones: ['9880011223'],
          upis: ['extortion@paytm'],
          accounts: ['40012345678']
        }
      },
      chainOfCustody: [],
      timeline: [],
      save: jest.fn().mockResolvedValue(true)
    };

    const mockCompB = {
      _id: new mongoose.Types.ObjectId(),
      complaintId: 'CMP-8002',
      title: 'Electricity bill smishing scam',
      description: 'Threatened immediate power disconnection',
      category: 'Financial Fraud',
      amountLost: 40000,
      lostMoney: true,
      victimDetails: { name: 'Kavita Roy', mobile: '9876543210' },
      location: { city: 'Kolkata', state: 'West Bengal' },
      ocrData: {
        extracted: {
          phones: ['9880011223'],
          upis: ['extortion@paytm']
        }
      },
      chainOfCustody: [],
      timeline: [],
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(Complaint, 'find').mockResolvedValue([mockCompA, mockCompB]);

    const req = {
      body: {
        syndicateId: 'SYN-NCR-HUB-01',
        complaintIds: ['CMP-8001', 'CMP-8002'],
        leadAgency: 'Central Bureau of Investigation (CBI) Cyber Wing',
        notes: 'Mewat-Jamtara inter-state syndicated cyber extortion cell.'
      },
      user: mockOfficer
    };

    let responseStatus;
    let responseData;
    const res = {
      status: (code) => { responseStatus = code; return res; },
      json: (payload) => { responseData = payload; }
    };
    const next = jest.fn();

    await analyticsController.consolidateSyndicateDocket(req, res, next);

    expect(responseStatus).toBe(201);
    expect(responseData.status).toBe('success');
    expect(responseData.data.metrics.totalDefraudedAmount).toBe(120000);
    expect(responseData.data.metrics.victimCount).toBe(2);
    expect(responseData.data.leadAgency).toBe('Central Bureau of Investigation (CBI) Cyber Wing');

    // Verify custody records updated on constituent complaints
    expect(mockCompA.chainOfCustody.some(c => c.action === 'SYNDICATE_CONSOLIDATED_BNS111')).toBe(true);
    expect(mockCompA.timeline.some(t => t.title.includes('Master Syndicate Docket Consolidated'))).toBe(true);
    expect(mockCompA.save).toHaveBeenCalled();

    // Verify docket retrieval
    const getReq = {};
    let listData;
    const getRes = {
      json: (payload) => { listData = payload; }
    };
    await analyticsController.getSyndicateDockets(getReq, getRes, next);
    expect(listData.status).toBe('success');
    expect(listData.data.length).toBeGreaterThan(0);
  });

  test('POST /api/analytics/telecom/requisition-disconnect issues emergency TAFCOP order and updates custody', async () => {
    const mockCompA = {
      _id: new mongoose.Types.ObjectId(),
      complaintId: 'CMP-8001',
      chainOfCustody: [],
      timeline: [],
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(Complaint, 'find').mockResolvedValue([mockCompA]);

    const req = {
      body: {
        phone: '9880011223',
        imei: '869900112233445',
        complaintIds: ['CMP-8001'],
        carrier: 'Bharti Airtel Limited',
        reason: 'Serial digital arrest extortion caller'
      },
      user: mockOfficer
    };

    let responseStatus;
    let responseData;
    const res = {
      status: (code) => { responseStatus = code; return res; },
      json: (payload) => { responseData = payload; }
    };
    const next = jest.fn();

    await analyticsController.dispatchTelecomRequisition(req, res, next);

    expect(responseStatus).toBe(201);
    expect(responseData.status).toBe('success');
    expect(responseData.data.requisitionId).toMatch(/^DOT-TAFCOP-2026-[A-F0-9]{6}$/);
    expect(responseData.data.carrier).toBe('Bharti Airtel Limited');

    // Verify complaint custody committed
    expect(mockCompA.chainOfCustody.some(c => c.action === 'TAFCOP_SIM_REQUISITION_ISSUED')).toBe(true);
    expect(mockCompA.save).toHaveBeenCalled();

    // Verify requisition retrieval
    let reqListData;
    const listRes = {
      json: (payload) => { reqListData = payload; }
    };
    await analyticsController.getTelecomRequisitions({}, listRes, next);
    expect(reqListData.status).toBe('success');
    expect(reqListData.data.some(r => r.phone === '9880011223')).toBe(true);
  });

  test('GET /api/analytics/link-analysis returns spatial layout coordinates (x, y) for interactive graph rendering', async () => {
    const mockComplaints = [
      {
        complaintId: 'CMP-9001',
        title: 'UPI phishing scam',
        category: 'Financial Fraud',
        severity: 'high',
        status: 'under_review',
        amountLost: 50000,
        ocrData: {
          extracted: {
            phones: ['9880011223', '9880011223'],
            upis: ['mule@okaxis'],
            accounts: ['1122334455']
          }
        }
      },
      {
        complaintId: 'CMP-9002',
        title: 'UPI loan scam',
        category: 'Financial Fraud',
        severity: 'high',
        status: 'under_review',
        amountLost: 25000,
        ocrData: {
          extracted: {
            phones: ['9880011223'],
            upis: ['mule@okaxis'],
            accounts: ['1122334455']
          }
        }
      }
    ];

    const chainableFind = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockComplaints)
    };
    jest.spyOn(Complaint, 'find').mockReturnValue(chainableFind);

    let responseData;
    const res = {
      json: (payload) => { responseData = payload; }
    };
    const next = jest.fn();

    await analyticsController.getLinkAnalysis({}, res, next);

    expect(responseData.status).toBe('success');
    const { nodes, edges } = responseData.data.syndicateGraph;
    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);

    // Verify that every node has numeric x and y layout coordinates
    nodes.forEach(n => {
      expect(typeof n.x).toBe('number');
      expect(typeof n.y).toBe('number');
      expect(n.color).toBeDefined();
    });
  });
});
