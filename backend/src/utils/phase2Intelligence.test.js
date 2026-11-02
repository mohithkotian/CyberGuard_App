const { lookupByIFSC, searchDirectory, getAllEntries } = require('./bankNodalDirectory');
const analyticsController = require('../controllers/analyticsController');
const complaintsController = require('../controllers/complaintsController');
const Complaint = require('../models/Complaint');

jest.mock('../models/Complaint');

describe('Phase 2 Capabilities: Bank Nodal Directory & Intelligence', () => {
  describe('Bank & LEA Nodal Directory', () => {
    test('lookupByIFSC identifies State Bank of India by SBIN prefix', () => {
      const entry = lookupByIFSC('SBIN0001234');
      expect(entry).toBeDefined();
      expect(entry.shortName).toBe('SBI');
      expect(entry.nodalEmail).toBe('nodal.officer@sbi.co.in');
      expect(entry.statutoryNoticeAccepted).toMatch(/Sec 106 BNSS/);
    });

    test('lookupByIFSC identifies HDFC Bank by HDFC prefix', () => {
      const entry = lookupByIFSC('HDFC0000128');
      expect(entry).toBeDefined();
      expect(entry.shortName).toBe('HDFC');
      expect(entry.nodalEmail).toBe('cybercrime.nodal@hdfcbank.com');
    });

    test('lookupByIFSC handles lowercase, whitespace, and short inputs', () => {
      expect(lookupByIFSC('  sbin0005555 ')).toBeDefined();
      expect(lookupByIFSC('SBI')).toBeNull();
      expect(lookupByIFSC('')).toBeNull();
      expect(lookupByIFSC(null)).toBeNull();
      expect(lookupByIFSC(undefined)).toBeNull();
    });

    test('searchDirectory finds institutions by name, category, or payment gateway handle', () => {
      const paytmMatches = searchDirectory('Paytm');
      expect(paytmMatches.length).toBeGreaterThanOrEqual(1);
      expect(paytmMatches[0].nodalEmail).toBe('nodal@paytm.com');

      const phonePeMatches = searchDirectory('PhonePe');
      expect(phonePeMatches.length).toBeGreaterThanOrEqual(1);
      expect(phonePeMatches[0].secondaryEmail).toBe('lawenforcement@phonepe.com');

      const telcoMatches = searchDirectory('', 'telecom');
      expect(telcoMatches.length).toBeGreaterThanOrEqual(3);
      expect(telcoMatches.some(t => t.shortName === 'Airtel')).toBe(true);
      expect(telcoMatches.some(t => t.shortName === 'Jio')).toBe(true);

      const agencyMatches = searchDirectory('', 'agency');
      expect(agencyMatches.some(a => a.shortName.includes('I4C'))).toBe(true);
      expect(agencyMatches.some(a => a.shortName.includes('CERT-In'))).toBe(true);
    });

    test('getAllEntries returns complete directory with 20+ institutions', () => {
      const all = getAllEntries();
      expect(all.length).toBeGreaterThanOrEqual(20);
      all.forEach(entry => {
        expect(entry.id).toBeDefined();
        expect(entry.name).toBeDefined();
        expect(entry.nodalEmail).toContain('@');
        expect(entry.helpline).toBeDefined();
      });
    });
  });

  describe('Real-Time Syndicate Velocity & Surge Alerts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('detects critical cross-jurisdiction syndicate surge when suspect phone repeats across states', async () => {
      const now = new Date();
      const mockComplaints = [
        {
          _id: 'c1',
          complaintId: 'CYBER-2026-001',
          title: 'Electricity Bill Fraud',
          category: 'Financial Fraud',
          severity: 'high',
          status: 'investigating',
          amountLost: 150000,
          location: { city: 'Bengaluru', state: 'Karnataka' },
          ocrData: { extracted: { phones: ['9845012345'], upis: ['scam99@ybl'], accounts: ['30819284910'] } },
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2h ago
        },
        {
          _id: 'c2',
          complaintId: 'CYBER-2026-002',
          title: 'BESCOM Disconnection Threat',
          category: 'Financial Fraud',
          severity: 'critical',
          status: 'pending',
          amountLost: 250000,
          location: { city: 'Mumbai', state: 'Maharashtra' },
          ocrData: { extracted: { phones: ['9845012345'], upis: ['scam99@ybl'], accounts: ['30819284910'] } },
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12h ago
        },
        {
          _id: 'c3',
          complaintId: 'CYBER-2026-003',
          title: 'Power cut scam',
          category: 'Financial Fraud',
          severity: 'high',
          status: 'pending',
          amountLost: 120000,
          location: { city: 'Delhi', state: 'Delhi' },
          ocrData: { extracted: { phones: ['9845012345'], upis: [], accounts: [] } },
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24h ago
        }
      ];

      Complaint.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockComplaints)
        })
      });

      const req = {};
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      await analyticsController.getSyndicateSurgeAlerts(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.status).toBe('success');
      expect(responseData.data.surgeAlerts.length).toBeGreaterThanOrEqual(1);

      const phoneAlert = responseData.data.surgeAlerts.find(a => a.identifier === '9845012345');
      expect(phoneAlert).toBeDefined();
      expect(phoneAlert.caseCount).toBe(3);
      expect(phoneAlert.isCrossJurisdiction).toBe(true);
      expect(phoneAlert.severity).toBe('CRITICAL_SURGE');
      expect(phoneAlert.totalLoss).toBe(520000);
      expect(phoneAlert.recommendedAction).toMatch(/inter-district cyber task force/i);

      expect(responseData.data.summary.criticalCount).toBeGreaterThanOrEqual(1);
      expect(responseData.data.summary.crossJurisdictionCount).toBeGreaterThanOrEqual(1);
    });

    test('returns empty surgeAlerts if identifiers do not recur across multiple cases', async () => {
      const mockComplaints = [
        {
          _id: 'c1',
          complaintId: 'CYBER-2026-010',
          title: 'Isolated phishing report',
          category: 'Phishing',
          ocrData: { extracted: { phones: ['9999900001'] } }
        },
        {
          _id: 'c2',
          complaintId: 'CYBER-2026-011',
          title: 'Different isolated report',
          category: 'Identity Theft',
          ocrData: { extracted: { phones: ['9999900002'] } }
        }
      ];

      Complaint.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockComplaints)
        })
      });

      const req = {};
      const res = { json: jest.fn() };
      const next = jest.fn();

      await analyticsController.getSyndicateSurgeAlerts(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data.surgeAlerts).toEqual([]);
      expect(responseData.data.summary.totalActiveSurges).toBe(0);
    });
  });

  describe('Proactive Community Scam Radar', () => {
    test('returns verified radar threat alerts and aggregates without exposing any PII', async () => {
      Complaint.aggregate.mockResolvedValue([
        {
          _id: { category: 'Financial Fraud', city: 'Bengaluru', state: 'Karnataka' },
          caseCount: 4,
          lastReported: new Date()
        }
      ]);

      const req = { query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await complaintsController.getCommunityScamRadar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.status).toBe('success');
      expect(responseData.data.radarAlerts.length).toBeGreaterThanOrEqual(1);

      // Verify zero PII is present in radar objects
      responseData.data.radarAlerts.forEach(alert => {
        expect(alert.victimDetails).toBeUndefined();
        expect(alert.victimName).toBeUndefined();
        expect(alert.personalPhone).toBeUndefined();
        expect(alert.threatTitle).toBeDefined();
        expect(alert.modusOperandi).toBeDefined();
        expect(alert.citizenDirective).toBeDefined();
      });
    });

    test('filters radar alerts by city parameter', async () => {
      Complaint.aggregate.mockResolvedValue([]);

      const req = { query: { city: 'Bengaluru' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await complaintsController.getCommunityScamRadar(req, res, next);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data.radarAlerts.every(a => a.city.toLowerCase().includes('bengaluru'))).toBe(true);
    });
  });
});

