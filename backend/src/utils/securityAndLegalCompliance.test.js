const complaintsController = require('../controllers/complaintsController');
const Complaint = require('../models/Complaint');
const { AppError } = require('../middleware/errorHandler');

// Mock Complaint model methods
jest.mock('../models/Complaint');

describe('Security & Legal Compliance Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. FIR Draft Legal Wording & Disclaimer Verification', () => {
    it('generates a provisional investigative draft and includes statutory disclaimer', async () => {
      const mockComplaint = {
        complaintId: 'CC-2026-9021',
        category: 'Financial Fraud',
        subCategory: 'UPI Fraud',
        createdAt: new Date('2026-11-01T10:00:00Z'),
        victimDetails: { name: 'Test Citizen', mobile: '9876543210', email: 'citizen@example.com', pincode: '560001' },
        suspectInfo: { name: 'Fraudster X', details: 'UPI handle fake@ybl' },
        description: 'Unauthorized debits of INR 45,000 via malicious APK link.',
        evidence: [
          { originalName: 'screenshot1.png', verifiedMime: 'image/png', sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' }
        ],
        populate: jest.fn().mockReturnThis()
      };

      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockComplaint)
        })
      });

      const req = {
        params: { id: 'CC-2026-9021' },
        user: { name: 'Inspector Sharma', role: 'officer' }
      };

      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.generateFIRDraft(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toBeDefined();
      expect(jsonResponse.status).toBe('success');

      const { firDraftText, sections } = jsonResponse.data;

      // Verify no unsupported legal claims (must be provisional draft subject to SHO endorsement)
      expect(firDraftText).toContain('DISCLAIMER: This document is a provisional investigative draft');
      expect(firDraftText).toContain('does not constitute a formally registered court record until verified and endorsed by the Station House Officer (SHO)');

      // Verify statutory penal provisions mapped correctly
      const sectionCodes = sections.map(s => s.section);
      expect(sectionCodes).toContain('Section 318(4)'); // BNS Cheating
      expect(sectionCodes).toContain('Section 66D'); // IT Act Cheating by Personation
    });
  });

  describe('2. Bank Freeze Notice Generation & Validation', () => {
    it('rejects notice generation if no account, UPI, or transaction ref provided', async () => {
      Complaint.findOne.mockResolvedValue({ complaintId: 'CC-2026-9021' });

      const req = {
        params: { id: 'CC-2026-9021' },
        user: { name: 'Inspector Sharma', role: 'officer' },
        body: { bankName: 'SBI' } // Missing account, upiId, and transactionRef
      };
      const res = {};
      const next = jest.fn();

      await complaintsController.issueBankFreezeNotice(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain('At least an Account Number, UPI ID, or Transaction Reference must be specified');
    });

    it('generates SHA-256 hashed statutory notice and commits to custody ledger', async () => {
      const mockComplaint = {
        complaintId: 'CC-2026-9021',
        category: 'Financial Fraud',
        chainOfCustody: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Complaint.findOne.mockResolvedValue(mockComplaint);

      const req = {
        params: { id: 'CC-2026-9021' },
        user: { _id: 'officer123', name: 'Inspector Sharma', role: 'officer' },
        body: {
          bankName: 'State Bank of India',
          accountNumber: '30819284910',
          ifsc: 'SBIN0001234',
          amount: '45000'
        }
      };

      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.issueBankFreezeNotice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.data.noticeNumber).toMatch(/^CG-LIEN-/);
      expect(jsonResponse.data.sha256Digest).toHaveLength(64);

      // Verify custody ledger event
      expect(mockComplaint.chainOfCustody).toHaveLength(1);
      expect(mockComplaint.chainOfCustody[0].action).toBe('BANK_FREEZE_NOTICE_ISSUED');
      expect(mockComplaint.chainOfCustody[0].sha256).toBe(jsonResponse.data.sha256Digest);

      // Verify case timeline updated
      expect(mockComplaint.timeline).toHaveLength(1);
      expect(mockComplaint.timeline[0].message).toContain('Sec 106 BNSS');
    });
  });

  describe('3. Public Tracking Milestone Calculation & PII Sanitization', () => {
    it('computes real milestone state and strips all citizen PII on public tracking', async () => {
      const mockDbComplaint = {
        complaintId: 'CC-2026-9021',
        status: 'under_review',
        category: 'Financial Fraud',
        severity: 'high',
        timeline: [
          { message: 'Emergency statutory bank-freeze / lien notice issued to SBI under Sec 106 BNSS.' }
        ],
        evidence: [{ sha256: 'abc123def456' }],
        createdAt: new Date('2026-11-01T10:00:00Z'),
        updatedAt: new Date('2026-11-01T12:00:00Z'),
        // Unsafe fields that must NEVER be returned:
        victimDetails: { name: 'Secret Citizen', mobile: '9999999999' },
        userId: 'user123',
        description: 'Raw description containing private addresses'
      };

      // Mock lean query that only selects safe fields
      Complaint.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDbComplaint)
        })
      });

      const req = { params: { complaintId: 'CC-2026-9021' } };
      let jsonResponse = null;
      const res = { json: (d) => { jsonResponse = d; } };
      const next = jest.fn();

      await complaintsController.trackComplaint(req, res, next);

      expect(jsonResponse).toBeDefined();
      expect(jsonResponse.status).toBe('success');

      const returned = jsonResponse.data.complaint;

      // PII must be completely excluded
      expect(returned.victimDetails).toBeUndefined();
      expect(returned.userId).toBeUndefined();
      expect(returned.description).toBeUndefined();

      // Milestone must be computed from real backend properties
      expect(returned.milestone).toBeDefined();
      expect(returned.milestone.stage).toBe(3); // Lien Dispatch stage because of bank freeze notice in timeline
      expect(returned.milestone.name).toBe('Lien Dispatch');
      expect(returned.milestone.hasBankNotice).toBe(true);
      expect(returned.milestone.hasSec65B).toBe(true);
    });
  });

  describe('4. Strict Access Control on Case Dossiers', () => {
    it('rejects unprivileged citizens from viewing other citizens complaints with HTTP 403', async () => {
      const mockComplaint = {
        complaintId: 'CC-2026-9021',
        userId: { _id: 'owner123' },
        assignedTo: null
      };

      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockComplaint)
          })
        })
      });

      const req = {
        params: { id: 'CC-2026-9021' },
        user: { _id: 'attacker456', role: 'user' } // Different user ID
      };
      const res = {};
      const next = jest.fn();

      await complaintsController.getComplaint(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Not authorized to view this complaint.');
    });
  });
});

