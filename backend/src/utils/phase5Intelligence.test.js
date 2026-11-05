const complaintsController = require('../controllers/complaintsController');
const Complaint = require('../models/Complaint');
const { AppError } = require('../middleware/errorHandler');

jest.mock('../models/Complaint');

describe('Phase 5 Intelligence Capabilities: P0 Takedowns, Zero FIR Transfers & Integrity Validator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 1: Priority Zero (P0) Emergency Takedown Directive
  // ────────────────────────────────────────────────────────────
  describe('1. P0 Emergency Takedown Directive (Sec 79(3)(b) IT Act & Rule 3(2)(b))', () => {
    it('returns 404 AppError if complaint not found', async () => {
      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Complaint.findOne.mockResolvedValue(null);

      const req = {
        params: { id: 'NON_EXISTENT' },
        body: { targetPlatform: 'Instagram / Meta' },
        user: { _id: 'u1', name: 'Officer Rao', role: 'officer' }
      };
      const res = {};
      const next = jest.fn();

      await complaintsController.issueEmergencyTakedownNotice(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
    });

    it('validates that targetPlatform is required', async () => {
      Complaint.findOne.mockResolvedValue({ complaintId: 'CMP-2026-6601' });

      const req = {
        params: { id: 'CMP-2026-6601' },
        body: {}, // Missing targetPlatform
        user: { _id: 'u1', name: 'Officer Rao', role: 'officer' }
      };
      const res = {};
      const next = jest.fn();

      await complaintsController.issueEmergencyTakedownNotice(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain('Target digital platform or intermediary is required');
    });

    it('generates statutory 24-hour takedown notice and logs to custody ledger', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-6601',
        category: 'Women/Child Safety',
        status: 'investigating',
        takedownNotices: [],
        chainOfCustody: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Complaint.findOne.mockResolvedValue(mockComplaint);

      const req = {
        params: { id: 'CMP-2026-6601' },
        body: {
          targetPlatform: 'Telegram',
          offenceCategory: 'Sextortion / Video Call Coercion',
          contentUrls: ['https://t.me/blackmail_channel/99', 'https://t.me/blackmail_channel/100']
        },
        user: { _id: 'u1', name: 'Officer Rao', role: 'officer' }
      };

      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.issueEmergencyTakedownNotice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toBeDefined();
      expect(jsonResponse.status).toBe('success');

      const { noticeNumber, targetPlatform, offenceCategory, sha256Digest, noticeText } = jsonResponse.data;

      expect(noticeNumber).toContain('SEC79/TAKEDOWN');
      expect(targetPlatform).toBe('Telegram');
      expect(offenceCategory).toContain('Sextortion');
      expect(sha256Digest).toHaveLength(64);

      // Verify Rule 3(2)(b) and Section 79(3)(b) mandate
      expect(noticeText).toContain('PRIORITY ZERO (P0) EMERGENCY STATUTORY TAKEDOWN & PRESERVATION DIRECTIVE');
      expect(noticeText).toContain('RULE 3(2)(b) OF THE INFORMATION TECHNOLOGY');
      expect(noticeText).toContain('TWENTY-FOUR (24) HOURS');
      expect(noticeText).toContain('Section 67 / 67A / 67B IT Act and Section 78 / 351 BNS 2023');
      expect(noticeText).toContain('StopNCII.org');

      // Verify saved to complaint
      expect(mockComplaint.takedownNotices.length).toBe(1);
      expect(mockComplaint.chainOfCustody.length).toBe(1);
      expect(mockComplaint.chainOfCustody[0].action).toBe('TAKEDOWN_DIRECTIVE_ISSUED');
      expect(mockComplaint.timeline.length).toBe(1);
      expect(mockComplaint.save).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 2: Section 173(1) BNSS Zero FIR Jurisdictional Transfer
  // ────────────────────────────────────────────────────────────
  describe('2. Section 173(1) BNSS Zero FIR Jurisdictional Transfer Package', () => {
    it('returns 404 AppError if complaint not found', async () => {
      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const req = { params: { id: 'NON_EXISTENT' }, query: {} };
      const res = {};
      const next = jest.fn();

      await complaintsController.generateZeroFIRTransfer(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
    });

    it('compiles formal Zero FIR transfer memorandum to transferee police command', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-3301',
        category: 'Financial Fraud',
        subCategory: 'UPI Syndicate',
        victimDetails: {
          name: 'Rajesh Verma',
          mobile: '9845099112',
          amountLost: 240000
        },
        suspectInfo: {
          name: 'Mewat SIM-Swap Syndicate',
          details: 'Operating from Nuh District'
        },
        evidence: [
          { originalName: 'upi_receipt.png', sha256: 'a1b2c3d4' }
        ],
        chainOfCustody: [
          { action: 'NOTICE_DISPATCHED' }
        ],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockComplaint)
        })
      });

      const req = {
        params: { id: 'CMP-2026-3301' },
        query: {
          destinationPoliceStation: 'Nuh Cyber Crime PS',
          destinationDistrict: 'Nuh District, Haryana'
        },
        user: { name: 'Inspector Rao', role: 'officer' }
      };

      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.generateZeroFIRTransfer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toBeDefined();
      expect(jsonResponse.status).toBe('success');

      const { transferRef, destinationPoliceStation, destinationDistrict, transferDocketText } = jsonResponse.data;

      expect(transferRef).toContain('TRANSFER/ZERO-FIR');
      expect(destinationPoliceStation).toBe('Nuh Cyber Crime PS');
      expect(destinationDistrict).toBe('Nuh District, Haryana');

      // Verify statutory citations
      expect(transferDocketText).toContain('MEMORANDUM OF JURISDICTIONAL TRANSFER OF ZERO FIR');
      expect(transferDocketText).toContain('SECTION 173(1) OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS) 2023');
      expect(transferDocketText).toContain('Lalita Kumari vs. Govt. of U.P.');
      expect(transferDocketText).toContain('Rajesh Verma');
      expect(transferDocketText).toContain('INR 240000');
      expect(transferDocketText).toContain('1 Digital Evidence Files');

      expect(mockComplaint.zeroFIRTransfer.destinationPoliceStation).toBe('Nuh Cyber Crime PS');
      expect(mockComplaint.chainOfCustody.some(c => c.action === 'ZERO_FIR_TRANSFERRED')).toBe(true);
      expect(mockComplaint.save).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 3: Evidence & Statutory Directive Integrity Validator
  // ────────────────────────────────────────────────────────────
  describe('3. Evidence & Statutory Directive Integrity Validator', () => {
    it('verifies authentic SHA-256 evidence file checksum without disclosing PII', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-9912',
        category: 'Financial Fraud',
        createdAt: new Date('2026-10-15T10:00:00Z'),
        evidence: [
          { originalName: 'bank_statement.pdf', sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' }
        ],
        chainOfCustody: [],
        telecomNotices: [],
        takedownNotices: []
      };

      Complaint.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockComplaint)
      });

      const securityRoutes = require('../routes/security');

      const req = {
        body: { query: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' }
      };
      let jsonResponse = null;
      let statusCode = 200;
      const res = {
        status: jest.fn().mockImplementation(code => { statusCode = code; return res; }),
        json: data => { jsonResponse = data; }
      };
      const next = jest.fn();

      await securityRoutes.verifyIntegrity(req, res, next);

      expect(statusCode).toBe(200);
      expect(jsonResponse.status).toBe('success');
      expect(jsonResponse.data.verified).toBe(true);
      expect(jsonResponse.data.status).toBe('VERIFIED_AUTHENTIC');
      expect(jsonResponse.data.recordType).toBe('ELECTRONIC_EVIDENCE_FILE');
      expect(jsonResponse.data.complaintReference).toBe('CMP-2026-9912');
    });

    it('verifies authentic statutory notice reference (e.g. SEC106/FREEZE)', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-9912',
        category: 'Financial Fraud',
        createdAt: new Date('2026-10-15T10:00:00Z'),
        telecomNotices: [
          { noticeNumber: 'SEC94/REQ/2026/8819', sha256Digest: 'abc123sha256digest' }
        ],
        chainOfCustody: [],
        takedownNotices: []
      };

      Complaint.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockComplaint)
      });

      const securityRoutes = require('../routes/security');

      const req = {
        body: { query: 'SEC94/REQ/2026/8819' }
      };
      let jsonResponse = null;
      let statusCode = 200;
      const res = {
        status: jest.fn().mockImplementation(code => { statusCode = code; return res; }),
        json: data => { jsonResponse = data; }
      };
      const next = jest.fn();

      await securityRoutes.verifyIntegrity(req, res, next);

      expect(statusCode).toBe(200);
      expect(jsonResponse.data.verified).toBe(true);
      expect(jsonResponse.data.status).toBe('VERIFIED_AUTHENTIC_DIRECTIVE');
      expect(jsonResponse.data.recordType).toBe('STATUTORY_TELECOM_REQUISITION');
    });

    it('returns unverified status when unknown hash or notice submitted', async () => {
      Complaint.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const securityRoutes = require('../routes/security');

      const req = {
        body: { query: 'UNKNOWN_OR_TAMPERED_HASH_9999999999999999999999999999999999999999999' }
      };
      let jsonResponse = null;
      let statusCode = 200;
      const res = {
        status: jest.fn().mockImplementation(code => { statusCode = code; return res; }),
        json: data => { jsonResponse = data; }
      };
      const next = jest.fn();

      await securityRoutes.verifyIntegrity(req, res, next);

      expect(statusCode).toBe(200);
      expect(jsonResponse.data.verified).toBe(false);
      expect(jsonResponse.data.status).toBe('UNVERIFIED_OR_MODIFIED');
    });
  });
});

