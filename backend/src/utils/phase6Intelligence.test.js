const mongoose = require('mongoose');
const { calculateEntropy, computeDigests, analyzeArtifact } = require('./artifactForensics');
const { extractLossAmount, extractEntities, categorizeStatement, normalizeStatement } = require('./statementNormalizer');
const { generateSection65BAffidavit } = require('./section65bGenerator');
const complaintsController = require('../controllers/complaintsController');
const Complaint = require('../models/Complaint');

describe('Phase 6: Advanced Cyber Forensics, Section 65B Affidavits & Detonation Sandbox', () => {

  // ---------------------------------------------------------------------------
  // 1. Artifact Forensics & Detonation Sandbox
  // ---------------------------------------------------------------------------
  describe('1. Artifact Forensics & Detonation Sandbox', () => {
    it('accurately calculates Shannon entropy across varying byte distributions', () => {
      // Repetitive text has low entropy
      const lowEntropy = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      const lowVal = calculateEntropy(lowEntropy);
      expect(lowVal).toBeLessThan(1.0);

      // Random high-entropy byte buffer
      const randomBuf = Buffer.alloc(256);
      for (let i = 0; i < 256; i++) randomBuf[i] = i;
      const highVal = calculateEntropy(randomBuf);
      expect(highVal).toBeGreaterThanOrEqual(7.9);
    });

    it('generates consistent MD5, SHA-1, and SHA-256 digests', () => {
      const sample = 'CyberGuard-Evidence-Stream-2026';
      const digests = computeDigests(sample);

      expect(digests.md5).toMatch(/^[a-f0-9]{32}$/);
      expect(digests.sha1).toMatch(/^[a-f0-9]{40}$/);
      expect(digests.sha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it('identifies critical spyware APK indicators, dangerous permissions, and elevates threat score', () => {
      const maliciousApkManifest = `
        <manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.fake.sbi.kyc">
          <uses-permission android:name="android.permission.RECEIVE_SMS" />
          <uses-permission android:name="android.permission.READ_SMS" />
          <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
          <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
          <application android:label="SBI NetBanking Update">
            <!-- C2 Server Connection -->
            <meta-data android:name="c2_server" android:value="http://194.26.29.112/beacon" />
          </application>
        </manifest>
      `;

      const report = analyzeArtifact({
        content: maliciousApkManifest,
        filename: 'SBI_KYC_Update.apk',
        mimeType: 'application/vnd.android.package-archive'
      });

      expect(report.threatScore).toBeGreaterThanOrEqual(60);
      expect(report.verdict).toContain('CRITICAL MALWARE');
      expect(report.detectedPermissions).toEqual(
        expect.arrayContaining([
          'android.permission.RECEIVE_SMS',
          'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android.permission.SYSTEM_ALERT_WINDOW'
        ])
      );
      expect(report.extractedIps).toContain('194.26.29.112');
      expect(report.certificateNumber).toMatch(/^QRN-2026-\d{6}$/);
      expect(report.quarantineCertificate).toContain('CYBERGUARD DIGITAL FORENSIC QUARANTINE CERTIFICATE');
      expect(report.quarantineCertificate).toContain('ISO/IEC 27037');
    });

    it('flags weaponized PDF exploit tags and suspicious macros', () => {
      const weaponizedPdfHeader = `
        %PDF-1.7
        1 0 obj << /Type /Catalog /Pages 2 0 R /OpenAction 3 0 R >> endobj
        3 0 obj << /Type /Action /S /JavaScript /JS (app.launchURL("https://malicious-gateway.top/phish");) >> endobj
      `;

      const report = analyzeArtifact({
        content: weaponizedPdfHeader,
        filename: 'Electricity_Disconnection_Notice.pdf',
        mimeType: 'application/pdf'
      });

      expect(report.matchedPdfTags).toContain('/JavaScript');
      expect(report.matchedPdfTags).toContain('/OpenAction');
      expect(report.threatScore).toBeGreaterThanOrEqual(45);
      expect(report.extractedUrls).toContain('https://malicious-gateway.top/phish');
    });

    it('accurately evaluates clean text or benign logs as low-risk/benign', () => {
      const cleanLog = 'Standard HTTP 200 GET /favicon.ico user-agent: Mozilla/5.0';
      const report = analyzeArtifact({
        content: cleanLog,
        filename: 'access.log',
        mimeType: 'text/plain'
      });

      expect(report.threatScore).toBeLessThan(25);
      expect(report.verdict).toBe('BENIGN / CLEAN');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Citizen Statement Normalizer & Oral Narrative Transcriber
  // ---------------------------------------------------------------------------
  describe('2. Citizen Statement Normalizer & Entity Extraction', () => {
    it('extracts currency amounts across colloquial Indian formats', () => {
      expect(extractLossAmount('Lost 85,000 rupees in fake call')).toBe(85000);
      expect(extractLossAmount('Transferred Rs. 120000 to fraud account')).toBe(120000);
      expect(extractLossAmount('Scammer took 2.5 lakh from my savings')).toBe(250000);
      expect(extractLossAmount('Debited 50k via UPI')).toBe(50000);
      expect(extractLossAmount('Nothing lost, just inquiry')).toBeNull();
    });

    it('extracts Indian mobile numbers, UPI IDs, and 12-digit UTR references', () => {
      const narrative = 'Caller on 9845012345 told me to send money to scammer@okaxis. Transaction UTR was 412345678901.';
      const entities = extractEntities(narrative);

      expect(entities.phones).toContain('9845012345');
      expect(entities.upis).toContain('scammer@okaxis');
      expect(entities.utrs).toContain('412345678901');
    });

    it('categorizes cybercrime types and maps them to BNS 2023 / IT Act sections', () => {
      const digitalArrest = 'Mumbai Police video call saying arrest warrant for money laundering via Skype';
      const cat1 = categorizeStatement(digitalArrest);
      expect(cat1.category).toContain('Digital Arrest');
      expect(cat1.penalSections).toContain('Section 319');

      const electricity = 'Message saying electricity bill unpaid and power supply will be disconnected tonight';
      const cat2 = categorizeStatement(electricity);
      expect(cat2.category).toContain('Electricity Bill');
      expect(cat2.penalSections).toContain('Section 318(4)');

      const sextortion = 'Received video call recording and blackmailing to upload nude photo on social media';
      const cat3 = categorizeStatement(sextortion);
      expect(cat3.category).toContain('Sextortion');
      expect(cat3.penalSections).toContain('Section 308(2)');
    });

    it('formats a structured court-admissible narrative dossier from unstructured statement', () => {
      const rawText = 'I received a call from 9988776655 saying my electricity bill is overdue. Transferred Rs. 35,000 through PhonePe to powerbill@ybl with UTR 498765432109.';
      const res = normalizeStatement(rawText);

      expect(res.incidentRef).toMatch(/^ORAL-INTAKE-\d{6}$/);
      expect(res.lossAmount).toBe(35000);
      expect(res.extractedEntities.phones).toContain('9988776655');
      expect(res.extractedEntities.upis).toContain('powerbill@ybl');
      expect(res.extractedEntities.utrs).toContain('498765432109');
      expect(res.normalizedDossier).toContain('STATEMENT UNDER SECTION 173 BNSS 2023');
      expect(res.normalizedDossier).toContain('INR 35,000/-');
    });

    it('throws error when statement is blank or empty', () => {
      expect(() => normalizeStatement('')).toThrow('Statement text is required');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Section 65B(4) IEA 1872 / Section 63(4) BSA 2023 Sworn Affidavit
  // ---------------------------------------------------------------------------
  describe('3. Section 65B / Section 63 BSA Electronic Evidence Affidavit Builder', () => {
    it('throws error if deponent name is omitted', () => {
      expect(() => generateSection65BAffidavit({
        complaintId: 'CMP-102938',
        deponentName: ''
      })).toThrow('Deponent name is required');
    });

    it('generates a formal sworn affidavit with statutory operating clauses, device specs, and exhibit schedule', () => {
      const affidavit = generateSection65BAffidavit({
        complaintId: 'CMP-998877',
        deponentName: 'Dr. Vikram Malhotra',
        deponentDesignation: 'Complainant & Lawful Device Custodian',
        deponentAddress: 'Indiranagar, Bengaluru, Karnataka - 560038',
        deviceDetails: {
          makeModel: 'Apple iPhone 15 Pro Max',
          osVersion: 'iOS 18.1 (Build 22B83)',
          deviceIdentifier: 'IMEI: 358912345678901',
          custodyPeriod: 'September 2023 to Present'
        },
        exhibits: [
          {
            exhibitId: 'EXHIBIT-P1',
            filename: 'whatsapp_extortion_threat.png',
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            description: 'Screenshot of WhatsApp extortion chat messages'
          },
          {
            exhibitId: 'EXHIBIT-P2',
            filename: 'bank_statement_debit.pdf',
            sha256: 'ca978112ca1bbdcafac231b39a23dc4da786036850f61d0e0d69d50a90f59147',
            description: 'Official HDFC Bank ledger confirming unauthorized debit'
          }
        ]
      });

      expect(affidavit.certificateNumber).toMatch(/^SEC65B-2026-\d{6}$/);
      expect(affidavit.affidavitText).toContain("BEFORE THE HON'BLE COURT");
      expect(affidavit.affidavitText).toContain('AFFIDAVIT UNDER SECTION 65B(4) OF THE INDIAN EVIDENCE ACT, 1872');
      expect(affidavit.affidavitText).toContain('SECTION 63(4) OF THE BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023');
      expect(affidavit.affidavitText).toContain('Apple iPhone 15 Pro Max');
      expect(affidavit.affidavitText).toContain('IMEI: 358912345678901');
      expect(affidavit.affidavitText).toContain('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(affidavit.affidavitText).toContain('ca978112ca1bbdcafac231b39a23dc4da786036850f61d0e0d69d50a90f59147');
      expect(affidavit.affidavitText).toContain('Dr. Vikram Malhotra');
      expect(affidavit.sha256Digest).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Controller Integration & Execution
  // ---------------------------------------------------------------------------
  describe('4. Complaints Controller Phase 6 Execution & State Persistence', () => {
    it('returns 404 AppError when complaint does not exist for Section 65B execution', async () => {
      const mockReq = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: {},
        user: { _id: new mongoose.Types.ObjectId(), role: 'officer', name: 'Inspector Roy' }
      };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      jest.spyOn(Complaint, 'findById').mockResolvedValue(null);

      await complaintsController.generateSection65BAffidavit(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(404);
      expect(caughtError.message).toContain('Complaint not found');

      Complaint.findById.mockRestore();
    });

    it('returns 403 AppError when an unauthorized citizen attempts to execute affidavit on another complaint', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const strangerId = new mongoose.Types.ObjectId();

      const mockComplaint = {
        _id: new mongoose.Types.ObjectId(),
        userId: ownerId,
        complaintId: 'CMP-778899'
      };

      const mockReq = {
        params: { id: mockComplaint._id.toString() },
        body: {},
        user: { _id: strangerId, role: 'user', name: 'Unauthorized Person' }
      };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      jest.spyOn(Complaint, 'findById').mockResolvedValue(mockComplaint);

      await complaintsController.generateSection65BAffidavit(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(403);
      expect(caughtError.message).toContain('Unauthorized');

      Complaint.findById.mockRestore();
    });

    it('successfully executes Section 65B affidavit, commits to custody ledger, timeline, and persists document', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockComplaint = {
        _id: new mongoose.Types.ObjectId(),
        complaintId: 'CMP-554433',
        userId,
        status: 'Investigation in Progress',
        evidence: [
          {
            originalName: 'threat_chat.png',
            mimetype: 'image/png',
            sha256: 'aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff66667777888899990000'
          }
        ],
        affidavits65B: [],
        chainOfCustody: [],
        timeline: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockReq = {
        params: { id: mockComplaint._id.toString() },
        body: {
          deponentName: 'Anita Sharma',
          deponentAddress: 'Koramangala, Bengaluru',
          deviceMakeModel: 'OnePlus 11 5G',
          osVersion: 'OxygenOS 14',
          deviceIdentifier: 'IMEI: 869123456789012',
          custodyPeriod: 'January 2024 to November 2026'
        },
        user: { _id: userId, role: 'user', name: 'Anita Sharma' }
      };

      let jsonResponse = null;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const mockNext = jest.fn();

      jest.spyOn(Complaint, 'findById').mockResolvedValue(mockComplaint);

      await complaintsController.generateSection65BAffidavit(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.status).toBe('success');
      expect(jsonResponse.data.certificateNumber).toMatch(/^SEC65B-2026-\d{6}$/);
      expect(jsonResponse.data.deponentName).toBe('Anita Sharma');

      // Verify model persistence
      expect(mockComplaint.affidavits65B.length).toBe(1);
      expect(mockComplaint.chainOfCustody.some(c => c.action === 'SECTION_65B_AFFIDAVIT_EXECUTED')).toBe(true);
      expect(mockComplaint.timeline.some(t => t.message.includes('Section 65B Electronic Evidence Affidavit executed'))).toBe(true);
      expect(mockComplaint.save).toHaveBeenCalled();

      Complaint.findById.mockRestore();
    });

    it('transcribes oral citizen statement and responds with structured entities and police narrative', async () => {
      const mockReq = {
        body: {
          statement: 'Hello, yesterday I was scammed for Rs. 40,000 by a caller on 9876543210 pretending to be electricity board officer.'
        }
      };

      let jsonResponse = null;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: (data) => { jsonResponse = data; }
      };
      const mockNext = jest.fn();

      await complaintsController.transcribeCitizenStatement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonResponse.status).toBe('success');
      expect(jsonResponse.data.lossAmount).toBe(40000);
      expect(jsonResponse.data.extractedEntities.phones).toContain('9876543210');
      expect(jsonResponse.data.category).toContain('Electricity Bill');
      expect(jsonResponse.data.normalizedDossier).toContain('STATEMENT UNDER SECTION 173 BNSS 2023');
    });

    it('rejects blank statement in transcribeCitizenStatement with 400 AppError', async () => {
      const mockReq = { body: { statement: '   ' } };
      const mockRes = {};
      let caughtError = null;
      const mockNext = (err) => { caughtError = err; };

      await complaintsController.transcribeCitizenStatement(mockReq, mockRes, mockNext);

      expect(caughtError).toBeTruthy();
      expect(caughtError.statusCode).toBe(400);
      expect(caughtError.message).toContain('Statement text or oral transcript is required');
    });
  });

});

