const mongoose = require('mongoose');
const complaintsController = require('../controllers/complaintsController');
const Complaint = require('../models/Complaint');

describe('Phase 7: Batch Statutory Enforcement & Citizen Restitution Pipeline', () => {

  // ---------------------------------------------------------------------------
  // 1. Batch Statutory Enforcement
  // ---------------------------------------------------------------------------
  describe('1. Batch Statutory Enforcement (POST /api/complaints/batch-enforcement)', () => {
    it('returns 400 AppError when complaintIds is not an array or is empty', async () => {
      const mockReq = { body: { complaintIds: [], actionType: 'BATCH_BANK_FREEZE' } };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      await complaintsController.batchEnforcement(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(400);
      expect(caughtError.message).toContain('An array of complaint IDs is required');
    });

    it('returns 400 AppError when actionType is invalid', async () => {
      const mockReq = {
        body: {
          complaintIds: [new mongoose.Types.ObjectId().toString()],
          actionType: 'INVALID_ACTION'
        }
      };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      await complaintsController.batchEnforcement(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(400);
      expect(caughtError.message).toContain('Invalid batch action type');
    });

    it('returns 404 AppError when no complaints are found for provided IDs', async () => {
      const mockReq = {
        body: {
          complaintIds: [new mongoose.Types.ObjectId().toString()],
          actionType: 'BATCH_BANK_FREEZE'
        }
      };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      jest.spyOn(Complaint, 'find').mockResolvedValue([]);

      await complaintsController.batchEnforcement(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(404);
      expect(caughtError.message).toContain('No matching complaints found');

      Complaint.find.mockRestore();
    });

    it('successfully executes BATCH_BANK_FREEZE on multiple complaints and commits to ledgers', async () => {
      const id1 = new mongoose.Types.ObjectId();
      const id2 = new mongoose.Types.ObjectId();

      const mockComplaint1 = {
        _id: id1,
        complaintId: 'CMP-100001',
        status: 'under_review',
        chainOfCustody: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockComplaint2 = {
        _id: id2,
        complaintId: 'CMP-100002',
        status: 'under_review',
        chainOfCustody: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockReq = {
        body: {
          complaintIds: [id1.toString(), id2.toString()],
          actionType: 'BATCH_BANK_FREEZE',
          bankDetails: {
            targetBank: 'State Bank of India',
            beneficiaryAccount: '918273645102',
            beneficiaryUpi: 'mulesyndicate@oksbi'
          }
        },
        user: { _id: new mongoose.Types.ObjectId(), name: 'Inspector Roy', role: 'officer' }
      };

      let jsonResponse = null;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const mockNext = jest.fn();

      jest.spyOn(Complaint, 'find').mockResolvedValue([mockComplaint1, mockComplaint2]);

      await complaintsController.batchEnforcement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.status).toBe('success');
      expect(jsonResponse.data.affectedCount).toBe(2);
      expect(jsonResponse.data.actionType).toBe('BATCH_BANK_FREEZE');

      // Verify individual complaint mutations
      expect(mockComplaint1.chainOfCustody.some(c => c.action === 'BATCH_BANK_FREEZE_ISSUED')).toBe(true);
      expect(mockComplaint2.chainOfCustody.some(c => c.action === 'BATCH_BANK_FREEZE_ISSUED')).toBe(true);
      expect(mockComplaint1.restitutionStatus.currentStage).toBe('FUNDS_DEBIT_FREEZED');
      expect(mockComplaint2.restitutionStatus.currentStage).toBe('FUNDS_DEBIT_FREEZED');
      expect(mockComplaint1.save).toHaveBeenCalled();
      expect(mockComplaint2.save).toHaveBeenCalled();

      Complaint.find.mockRestore();
    });

    it('successfully executes BATCH_STATUS_UPDATE on multiple complaints', async () => {
      const id1 = new mongoose.Types.ObjectId();
      const mockComplaint = {
        _id: id1,
        status: 'pending',
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockReq = {
        body: {
          complaintIds: [id1.toString()],
          actionType: 'BATCH_STATUS_UPDATE',
          targetStatus: 'investigating'
        },
        user: { _id: new mongoose.Types.ObjectId(), name: 'Inspector Roy', role: 'officer' }
      };

      let jsonResponse = null;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const mockNext = jest.fn();

      jest.spyOn(Complaint, 'find').mockResolvedValue([mockComplaint]);

      await complaintsController.batchEnforcement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.data.affectedCount).toBe(1);
      expect(mockComplaint.status).toBe('investigating');
      expect(mockComplaint.timeline.some(t => t.message.includes('Case status updated in batch triage to investigating'))).toBe(true);

      Complaint.find.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Restitution Milestone Progression
  // ---------------------------------------------------------------------------
  describe('2. Restitution Milestone Progression (POST /api/complaints/:id/restitution-milestone)', () => {
    it('returns 404 AppError when complaint is not found', async () => {
      const mockReq = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: { stage: 'COURT_RELEASE_ORDERED' }
      };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      jest.spyOn(Complaint, 'findById').mockResolvedValue(null);

      await complaintsController.updateRestitutionMilestone(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(404);

      Complaint.findById.mockRestore();
    });

    it('returns 400 AppError on invalid restitution stage', async () => {
      const mockReq = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: { stage: 'INVALID_RESTITUTION_STAGE' }
      };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      jest.spyOn(Complaint, 'findById').mockResolvedValue({ _id: mockReq.params.id });

      await complaintsController.updateRestitutionMilestone(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(400);
      expect(caughtError.message).toContain('Valid stage required');

      Complaint.findById.mockRestore();
    });

    it('successfully progresses restitution to ESCROW_REMITTED_SUCCESSFULLY and updates custody ledger', async () => {
      const mockComplaint = {
        _id: new mongoose.Types.ObjectId(),
        status: 'investigating',
        restitutionStatus: {
          currentStage: 'COURT_RELEASE_ORDERED',
          milestones: []
        },
        chainOfCustody: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockReq = {
        params: { id: mockComplaint._id.toString() },
        body: {
          stage: 'ESCROW_REMITTED_SUCCESSFULLY',
          courtOrderNumber: 'CJM/BLR/CRIM/492/2026',
          settlementUtr: 'HDFCR5202611029182',
          amountRestored: 85000,
          remittanceBank: 'HDFC Bank Ltd',
          notes: 'RTGS remittance of frozen escrow to complainant savings account confirmed.'
        },
        user: { _id: new mongoose.Types.ObjectId(), name: 'Inspector Roy', role: 'officer' }
      };

      let jsonResponse = null;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const mockNext = jest.fn();

      jest.spyOn(Complaint, 'findById').mockResolvedValue(mockComplaint);

      await complaintsController.updateRestitutionMilestone(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.status).toBe('success');
      expect(jsonResponse.data.currentStage).toBe('ESCROW_REMITTED_SUCCESSFULLY');
      expect(jsonResponse.data.amountRestored).toBe(85000);
      expect(jsonResponse.data.settlementUtr).toBe('HDFCR5202611029182');

      expect(mockComplaint.chainOfCustody.some(c => c.action === 'RESTITUTION_STAGE_UPDATED')).toBe(true);
      expect(mockComplaint.timeline.some(t => t.message.includes('HDFCR5202611029182'))).toBe(true);
      expect(mockComplaint.save).toHaveBeenCalled();

      Complaint.findById.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Restitution Status Inspection
  // ---------------------------------------------------------------------------
  describe('3. Restitution Status Pipeline (GET /api/complaints/:id/restitution-status)', () => {
    it('returns 404 AppError when complaint is not found', async () => {
      const mockReq = { params: { id: new mongoose.Types.ObjectId().toString() } };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      const selectMock = { select: jest.fn().mockResolvedValue(null) };
      jest.spyOn(Complaint, 'findById').mockReturnValue(selectMock);

      await complaintsController.getRestitutionStatus(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(404);

      Complaint.findById.mockRestore();
    });

    it('computes accurate progress percentage and recovery ratio', async () => {
      const mockComplaint = {
        complaintId: 'CMP-774411',
        victimDetails: { amountLost: 100000 },
        restitutionStatus: {
          currentStage: 'COURT_RELEASE_ORDERED',
          amountRestored: 100000,
          courtOrderNumber: 'CRIM/MISC/503/2026',
          milestones: [
            { stage: 'FUNDS_DEBIT_FREEZED', timestamp: new Date() },
            { stage: 'MAGISTRATE_PETITION_FILED', timestamp: new Date() },
            { stage: 'COURT_RELEASE_ORDERED', timestamp: new Date() }
          ]
        },
        createdAt: new Date()
      };

      const mockReq = { params: { id: new mongoose.Types.ObjectId().toString() } };
      let jsonResponse = null;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const mockNext = jest.fn();

      const selectMock = { select: jest.fn().mockResolvedValue(mockComplaint) };
      jest.spyOn(Complaint, 'findById').mockReturnValue(selectMock);

      await complaintsController.getRestitutionStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.status).toBe('success');
      expect(jsonResponse.data.currentStage).toBe('COURT_RELEASE_ORDERED');
      expect(jsonResponse.data.currentStageOrder).toBe(3);
      expect(jsonResponse.data.progressPercent).toBe(60); // 3/5 = 60%
      expect(jsonResponse.data.recoveryPercentage).toBe(100);
      expect(jsonResponse.data.stages.find(s => s.id === 'COURT_RELEASE_ORDERED').isCurrent).toBe(true);

      Complaint.findById.mockRestore();
    });
  });

});

