const { extractFinancialIdentifiers } = require('../services/ocrService');
const { analyzeMessageThreat, OFFICIAL_DLT_HEADERS } = require('./messageThreatAnalyzer');
const complaintsController = require('../controllers/complaintsController');
const Complaint = require('../models/Complaint');
const { AppError } = require('../middleware/errorHandler');

jest.mock('../models/Complaint');

describe('Phase 3 Intelligence Capabilities: OCR Forensics, Phishing Sandbox & Court Dockets', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 1: OCR Financial Extraction & Receipt Forgery Engine
  // ────────────────────────────────────────────────────────────
  describe('1. OCR Financial Extraction & Receipt Forgery Engine', () => {
    it('gracefully handles empty, null, or non-string input', () => {
      const emptyRes = extractFinancialIdentifiers('');
      expect(emptyRes.phones).toEqual([]);
      expect(emptyRes.utrs).toEqual([]);
      expect(emptyRes.amounts).toEqual([]);
      expect(emptyRes.forgeryAnalysis.status).toBe('UNKNOWN');

      const nullRes = extractFinancialIdentifiers(null);
      expect(nullRes.utrs).toEqual([]);
      expect(nullRes.forgeryAnalysis.integrityScore).toBe(100);
    });

    it('extracts 12-digit UTR and UPI reference numbers from standard payment text', () => {
      const text = `
        Payment Successful
        UPI Ref No: 429182740192
        Paid to: merchant@okaxis
        Amount: Rs. 4,500.00
        Google Pay transaction
      `;
      const res = extractFinancialIdentifiers(text);
      expect(res.utrs).toContain('429182740192');
      expect(res.amounts).toContain(4500);
      expect(res.detectedApps).toContain('Google Pay');
      expect(res.forgeryAnalysis.verdict).toBe('AUTHENTIC_RECEIPT');
    });

    it('extracts multiple UTR variants (UTR, RRN, Ref No) and payment apps', () => {
      const text = `
        PhonePe Transaction Successful
        UTR Number: 391827364501
        Bank Ref: 102938475612
        Amount: ₹12,500.50
        From: 9876543210
        To UPI: scammer@ybl
      `;
      const res = extractFinancialIdentifiers(text);
      expect(res.utrs).toContain('391827364501');
      expect(res.utrs).toContain('102938475612');
      expect(res.amounts).toContain(12500.50);
      expect(res.detectedApps).toContain('PhonePe');
      expect(res.phones).toContain('9876543210');
      expect(res.upis).toContain('scammer@ybl');
    });

    it('detects spoof APK signatures and flags tampering with high severity', () => {
      const spoofText = `
        Paid Successfully
        FakePay Simulator Demo
        To: Rohan Kumar
        Amount: ₹10,000
        Ref: 123456789012
      `;
      const res = extractFinancialIdentifiers(spoofText);
      expect(res.forgeryAnalysis.isSuspect).toBe(true);
      expect(res.forgeryAnalysis.verdict).toBe('SUSPECT_TAMPERING');
      expect(res.forgeryAnalysis.flags.some(f => f.code === 'SPOOF_APK_SIGNATURE')).toBe(true);
      expect(res.forgeryAnalysis.integrityScore).toBeLessThan(60);
    });

    it('flags high-value claimed successful receipt missing mandatory 12-digit bank RRN', () => {
      const missingRrnText = `
        Transaction Successful
        Paid to: Diamond Jewellers
        Amount: ₹25,000.00
        Status: Completed
      `;
      const res = extractFinancialIdentifiers(missingRrnText);
      expect(res.forgeryAnalysis.isSuspect).toBe(true);
      expect(res.forgeryAnalysis.flags.some(f => f.code === 'MISSING_MANDATORY_RRN')).toBe(true);
      expect(res.forgeryAnalysis.verdict).toBe('SUSPECT_TAMPERING');
    });

    it('flags predatory micro-loan receipt anomalies', () => {
      const loanText = `
        Instant Loan Disbursal
        Convenience fee: 0.00
        Principal: ₹5,000
      `;
      const res = extractFinancialIdentifiers(loanText);
      expect(res.forgeryAnalysis.flags.some(f => f.code === 'PREDATORY_LOAN_RECEIPT')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 2: Citizen SMS & WhatsApp Phishing Message Analyzer
  // ────────────────────────────────────────────────────────────
  describe('2. Citizen SMS & WhatsApp Phishing Message Analyzer ("Scam Sandbox")', () => {
    it('handles empty message input gracefully', () => {
      const res = analyzeMessageThreat('');
      expect(res.verdict).toBe('NO_CONTENT');
      expect(res.riskScore).toBe(0);
      expect(res.senderHeaderAnalysis.isTraiCompliant).toBe(false);
      expect(res.suggestedComplaintDraft).toBeNull();
    });

    it('validates authorized TRAI DLT header whitelist', () => {
      expect(OFFICIAL_DLT_HEADERS.has('BESCOM')).toBe(true);
      expect(OFFICIAL_DLT_HEADERS.has('SBIINB')).toBe(true);
      expect(OFFICIAL_DLT_HEADERS.has('HDFCBK')).toBe(true);

      const sms = 'VK-BESCOM: Your electricity bill payment of Rs 1,420 is confirmed. Transaction ref: 991827364501.';
      const res = analyzeMessageThreat(sms);
      expect(res.senderHeaderAnalysis.isTraiCompliant).toBe(true);
      expect(res.senderHeaderAnalysis.isOfficialEntity).toBe(true);
      expect(res.senderHeaderAnalysis.headerDetected).toBe('VK-BESCOM');
      expect(res.riskScore).toBeLessThan(45);
    });

    it('identifies personal 10-digit number impersonation as a critical alert', () => {
      const deceptiveSms = '+91 98450 12345: Dear customer your electricity bill is unpaid. Power supply will be disconnected tonight at 9:30 PM. Call electricity officer at 9845012345.';
      const res = analyzeMessageThreat(deceptiveSms);

      expect(res.senderHeaderAnalysis.isTraiCompliant).toBe(false);
      expect(res.senderHeaderAnalysis.isOfficialEntity).toBe(false);
      expect(res.flags).toContain('PERSONAL_NUMBER_IMPERSONATION');
      expect(res.coercionCategories).toContain('UTILITY_POWER_DISCONNECTION');
      expect(res.riskScore).toBeGreaterThanOrEqual(70);
      expect(res.verdict).toBe('CRITICAL_PHISHING_ATTACK');
      expect(res.statutoryAdvisory).toContain('DO NOT DIAL NUMBERS IN THIS SMS');
      expect(res.suggestedComplaintDraft).toBeDefined();
      expect(res.suggestedComplaintDraft.category).toBe('Financial Fraud');
    });

    it('detects Customs & "Digital Arrest" extortion coercion', () => {
      const arrestMsg = 'Mumbai Police Crime Branch: A parcel from FedEx containing MDMA drugs has been seized in your name. Digital arrest warrant issued under CBI supervision. Join Skype immediately.';
      const res = analyzeMessageThreat(arrestMsg);

      expect(res.coercionCategories).toContain('CUSTOMS_DIGITAL_ARREST_EXTORTION');
      expect(res.riskScore).toBeGreaterThanOrEqual(45);
      expect(res.statutoryAdvisory).toContain('DO NOT JOIN ANY VIDEO CALL');
      expect(res.suggestedComplaintDraft.category).toBe('Identity Theft');
    });

    it('detects Banking KYC / YONO account block panic and malicious APK downloads', () => {
      const yonoPhish = 'Dear SBI user, your YONO account is blocked today. Immediately update PAN card at http://sbi-kyc-update.org/login.apk to avoid freeze.';
      const res = analyzeMessageThreat(yonoPhish);

      expect(res.coercionCategories).toContain('BANKING_KYC_ACCOUNT_SUSPENSION');
      expect(res.flags).toContain('MALICIOUS_REMOTE_APK_PAYLOAD');
      expect(res.extractedLinks.length).toBeGreaterThanOrEqual(1);
      expect(res.extractedLinks[0].threatType).toBe('MALICIOUS_APK_DOWNLOAD');
      expect(res.verdict).toBe('CRITICAL_PHISHING_ATTACK');
    });

    it('detects Telegram work-from-home Ponzi scheme triggers', () => {
      const telegramScam = 'Work from home part-time job! Earn Rs 5000 daily by like YouTube videos. Contact Telegram coordinator now.';
      const res = analyzeMessageThreat(telegramScam);

      expect(res.coercionCategories).toContain('TELEGRAM_TASK_PONZI_SCAM');
      expect(res.riskScore).toBeGreaterThanOrEqual(30);
    });

    it('penalizes obfuscated URL shorteners and extracts suspect phone', () => {
      const bitlySms = 'Important notice regarding refund. Visit https://bit.ly/claim-tax-refund or dial officer 9876543210';
      const res = analyzeMessageThreat(bitlySms);

      expect(res.flags).toContain('OBFUSCATED_SHORT_URL');
      expect(res.flags).toContain('UNAUTHORIZED_CALL_CTA');
      expect(res.suspectContact).toBe('9876543210');
    });
  });

  // ────────────────────────────────────────────────────────────
  // SUITE 3: Statutory Magistrate Court Docket Generator (Sec 193 BNSS)
  // ────────────────────────────────────────────────────────────
  describe('3. Statutory Magistrate Court Docket Generator (Sec 193 BNSS / 200 CrPC)', () => {
    it('returns 404 AppError if complaint is not found', async () => {
      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const req = { params: { id: 'NON_EXISTENT_ID' }, user: { name: 'Officer Rao', role: 'officer' } };
      const res = {};
      const next = jest.fn();

      await complaintsController.generateMagistrateDocket(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
    });

    it('compiles formal investigation report with BNSS penal sections and Section 65B electronic certificate', async () => {
      const mockComplaint = {
        _id: '507f1f77bcf86cd799439011',
        complaintId: 'CMP-2026-8801',
        category: 'Financial Fraud',
        lostMoney: true,
        createdAt: new Date('2026-10-15T09:30:00Z'),
        victimDetails: {
          name: 'Sunil Kumar',
          mobile: '9845011223',
          location: 'Koramangala, Bengaluru',
          pincode: '560034',
          amountLost: 185000,
          incidentDate: new Date('2026-10-14T18:00:00Z')
        },
        suspectInfo: {
          name: 'Aadhaar Impersonation Syndicate',
          details: 'Fake customer service portal'
        },
        description: 'Citizen was defrauded of INR 1,85,000 via spoofed UPI request and fraudulent transaction authorization.',
        ocrData: {
          extracted: {
            phones: ['9845099887'],
            upis: ['fraudster@oksbi'],
            accounts: ['5010048192837'],
            utrs: ['429182740192']
          }
        },
        evidence: [
          {
            originalName: 'transaction_receipt.png',
            verifiedMime: 'image/png',
            sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
          }
        ]
      };

      Complaint.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockComplaint)
        })
      });

      const req = {
        params: { id: 'CMP-2026-8801' },
        user: { name: 'Inspector Ananya Rao', role: 'officer' }
      };

      let jsonResponse = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const next = jest.fn();

      await complaintsController.generateMagistrateDocket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toBeDefined();
      expect(jsonResponse.status).toBe('success');

      const { docketNumber, sections, complaintId, docketText } = jsonResponse.data;

      expect(complaintId).toBe('CMP-2026-8801');
      expect(docketNumber).toContain('JMFC/CYBER');
      expect(docketNumber).toContain('2026-8801');

      // Verify BNSS 2023 & IT Act sections mapped
      const sectionCodes = sections.map(s => s.section);
      expect(sectionCodes).toContain('Section 318(4)');
      expect(sectionCodes).toContain('Section 66D');

      // Verify text contains statutory court docket headers and prayer
      expect(docketText).toContain('IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE / SPECIAL CYBER COURT');
      expect(docketText).toContain('UNDER SECTION 193 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS) 2023');
      expect(docketText).toContain('Sunil Kumar');
      expect(docketText).toContain('429182740192');
      expect(docketText).toContain('SECTION 65B BSA / IEA CERTIFICATE OF ELECTRONIC EVIDENCE INTEGRITY');
      expect(docketText).toContain('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
      expect(docketText).toContain('STATUTORY INTERMEDIARY DIRECTIVES & BANK FREEZE STATUS (SEC 106 BNSS)');
      expect(docketText).toContain('INR 185000');
      expect(docketText).toContain('PRAYER TO THE LEARNED COURT');
      expect(docketText).toContain('SUBMITTED BY: Inspector Ananya Rao | CYBER CRIME INVESTIGATION WING');
    });
  });
});

