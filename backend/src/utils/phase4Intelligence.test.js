const complaintsController = require('../controllers/complaintsController');
const Complaint = require('../models/Complaint');
const { AppError } = require('../middleware/errorHandler');

jest.mock('../models/Complaint');

describe('Phase 4 Intelligence Capabilities: Telecom Requisitions, Restitution Petitions & Mule Trails', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 1: Section 94 BNSS Telecom & Intermediary Requisition
  // ────────────────────────────────────────────────────────────
  describe('1. Section 94 BNSS Telecom & Intermediary Requisition Notice', () => {
    it('rejects notice issuance if complaint does not exist', async () => {
      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Complaint.findOne.mockResolvedValue(null);

      const req = {
        params: { id: 'NON_EXISTENT' },
        body: { targetProvider: 'Airtel', targetIdentifier: '9845012345' },
        user: { _id: 'u1', name: 'Inspector Rao', role: 'officer' }
      };
      const res = {};
      const next = jest.fn();

      await complaintsController.issueTelecomRequisitionNotice(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
    });

    it('validates that targetProvider and targetIdentifier are required', async () => {
      Complaint.findOne.mockResolvedValue({ complaintId: 'CMP-2026-9901' });

      const req = {
        params: { id: 'CMP-2026-9901' },
        body: { targetProvider: 'Airtel' }, // Missing targetIdentifier
        user: { _id: 'u1', name: 'Inspector Rao', role: 'officer' }
      };
      const res = {};
      const next = jest.fn();

      await complaintsController.issueTelecomRequisitionNotice(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain('Both targetProvider and targetIdentifier');
    });

    it('generates statutory Section 94 BNSS notice and commits to custody ledger', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-9901',
        category: 'Financial Fraud',
        description: 'Citizen defrauded of INR 50,000 via malicious caller.',
        status: 'investigating',
        telecomNotices: [],
        chainOfCustody: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Complaint.findOne.mockResolvedValue(mockComplaint);

      const req = {
        params: { id: 'CMP-2026-9901' },
        body: {
          targetProvider: 'Jio',
          requisitionType: 'CDR',
          targetIdentifier: '9845012345',
          targetTimeWindow: '2026-10-01 to 2026-10-15',
          allegationBrief: 'MSISDN utilized to orchestrate impersonation scam.'
        },
        user: { _id: 'officer1', name: 'Inspector Rao', role: 'officer' }
      };

      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.issueTelecomRequisitionNotice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toBeDefined();
      expect(jsonResponse.status).toBe('success');

      const { noticeNumber, targetProvider, requisitionType, sha256Digest, noticeText } = jsonResponse.data;

      expect(noticeNumber).toContain('SEC94/REQ');
      expect(targetProvider).toBe('Jio');
      expect(requisitionType).toBe('CDR');
      expect(sha256Digest).toHaveLength(64);

      // Verify statutory compliance references
      expect(noticeText).toContain('UNDER SECTION 94 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS) 2023');
      expect(noticeText).toContain('Rule 3(1)(j) of Information Technology');
      expect(noticeText).toContain('Section 223 and Section 238 of Bharatiya Nyaya Sanhita (BNS) 2023');
      expect(noticeText).toContain('9845012345');

      // Verify saved to complaint
      expect(mockComplaint.telecomNotices.length).toBe(1);
      expect(mockComplaint.chainOfCustody.length).toBe(1);
      expect(mockComplaint.chainOfCustody[0].action).toBe('REQUISITION_DISPATCHED');
      expect(mockComplaint.timeline.length).toBe(1);
      expect(mockComplaint.save).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 2: Section 503 BNSS Restitution Court Application
  // ────────────────────────────────────────────────────────────
  describe('2. Section 503 BNSS Restitution Court Application Generator', () => {
    it('returns 404 AppError if complaint not found', async () => {
      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const req = { params: { id: 'NON_EXISTENT' } };
      const res = {};
      const next = jest.fn();

      await complaintsController.generateRestitutionPetition(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
    });

    it('generates structured court restitution application with indemnity clause', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-7702',
        createdAt: new Date('2026-10-10T12:00:00Z'),
        victimDetails: {
          name: 'Priya Sharma',
          mobile: '9845022334',
          email: 'priya@example.com',
          location: 'Indiranagar, Bengaluru',
          pincode: '560038',
          amountLost: 125000,
          incidentDate: new Date('2026-10-09T15:30:00Z')
        },
        ocrData: {
          extracted: {
            accounts: ['309182740192'],
            amounts: [125000]
          }
        }
      };

      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockComplaint)
      });

      const req = { params: { id: 'CMP-2026-7702' } };
      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.generateRestitutionPetition(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toBeDefined();
      expect(jsonResponse.status).toBe('success');

      const { petitionNumber, amountClaimed, suspectAccount, petitionText } = jsonResponse.data;

      expect(petitionNumber).toContain('CRL-MISC');
      expect(amountClaimed).toBe(125000);
      expect(suspectAccount).toBe('309182740192');

      // Verify statutory BNSS clauses and prayer
      expect(petitionText).toContain('CRIMINAL MISCELLANEOUS APPLICATION UNDER SECTION 503 OF BNSS 2023');
      expect(petitionText).toContain('Priya Sharma');
      expect(petitionText).toContain('INR 125000');
      expect(petitionText).toContain('INDEMNITY UNDERTAKING:');
      expect(petitionText).toContain('remit the recovered funds directly to the Applicant\'s bank account via RTGS/NEFT');
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 3: Multi-Layer Financial Mule Trail & Escrow Recovery
  // ────────────────────────────────────────────────────────────
  describe('3. Multi-Layer Financial Mule Trail & Escrow Recovery', () => {
    it('calculates escrow recovery metrics and unfreeze deficits accurately', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-5501',
        victimDetails: { amountLost: 100000 },
        moneyTrail: [
          {
            hopNumber: 1,
            fromAccountOrUpi: 'victim@axis',
            toBankName: 'ICICI Bank',
            toAccountOrUpi: '9018273645',
            amount: 100000,
            status: 'TRANSFER_RECORDED'
          },
          {
            hopNumber: 2,
            fromAccountOrUpi: '9018273645',
            toBankName: 'State Bank of India',
            toAccountOrUpi: '3081928491',
            amount: 60000,
            status: 'FUNDS_SECURED' // Secured in escrow
          },
          {
            hopNumber: 3,
            fromAccountOrUpi: '9018273645',
            toBankName: 'Cash ATM Mule',
            toAccountOrUpi: 'ATM-KORAMANGALA',
            amount: 40000,
            status: 'CASHED_OUT_ATM' // Cashed out
          }
        ]
      };

      Complaint.findOne.mockResolvedValue(mockComplaint);

      const req = { params: { id: 'CMP-2026-5501' } };
      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.getMoneyTrail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.data.summary.totalDefrauded).toBe(100000);
      expect(jsonResponse.data.summary.totalFrozen).toBe(60000);
      expect(jsonResponse.data.summary.totalCashedOut).toBe(40000);
      expect(jsonResponse.data.summary.recoveryRatio).toBe(60); // 60% recovered
      expect(jsonResponse.data.summary.unsecuredDeficit).toBe(40000);
    });

    it('adds a financial hop and records entry in complaint timeline', async () => {
      const mockComplaint = {
        complaintId: 'CMP-2026-5501',
        status: 'investigating',
        moneyTrail: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Complaint.findOne.mockResolvedValue(mockComplaint);

      const req = {
        params: { id: 'CMP-2026-5501' },
        body: {
          hopNumber: 1,
          fromAccountOrUpi: 'victim@okaxis',
          toBankName: 'HDFC Bank',
          toAccountOrUpi: '5010048192837',
          ifsc: 'HDFC0000128',
          amount: 75000,
          utrOrRef: '429182736450',
          status: 'FREEZE_NOTICE_ISSUED',
          freezeNoticeRef: 'SEC106/FREEZE/2026/8812',
          notes: 'Direct Layer 1 beneficiary account'
        },
        user: { _id: 'officer1', name: 'Inspector Rao', role: 'officer' }
      };

      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.addMoneyTrailHop(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockComplaint.moneyTrail.length).toBe(1);
      expect(mockComplaint.moneyTrail[0].toBankName).toBe('HDFC Bank');
      expect(mockComplaint.moneyTrail[0].amount).toBe(75000);
      expect(mockComplaint.timeline.length).toBe(1);
      expect(mockComplaint.save).toHaveBeenCalled();
    });
  });
});

