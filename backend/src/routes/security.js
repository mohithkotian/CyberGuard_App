const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { auditCredentialExposure } = require('../services/breachService');
const { searchDirectory, lookupByIFSC, getAllEntries } = require('../utils/bankNodalDirectory');
const { analyzeMessageThreat } = require('../utils/messageThreatAnalyzer');

// @desc    Zero-knowledge credential breach surveillance audit
// @route   POST /api/security/breach-check
router.post('/breach-check', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        status: 'fail',
        message: 'A valid email address is required for breach surveillance.'
      });
    }

    const result = await auditCredentialExposure(email);
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Verified Bank, Payment Gateway & LEA Nodal Directory lookup
// @route   GET /api/security/nodal-directory
router.get('/nodal-directory', (req, res) => {
  try {
    const { q, query, category, ifsc } = req.query;
    const searchParam = q || query || '';

    if (ifsc) {
      const match = lookupByIFSC(ifsc);
      return res.json({
        status: 'success',
        data: {
          results: match ? [match] : [],
          total: match ? 1 : 0
        }
      });
    }

    const results = searchDirectory(searchParam, category);
    res.json({
      status: 'success',
      data: {
        results,
        total: results.length
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @desc    Forensic citizen SMS/Message phishing & coercion analyzer
// @route   POST /api/security/analyze-message
router.post('/analyze-message', (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Message text is required for threat evaluation.'
      });
    }

    const report = analyzeMessageThreat(message);
    res.json({
      status: 'success',
      data: report
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @desc    Public / Institutional Evidence & Statutory Notice Integrity Validator
// @route   POST /api/security/verify-integrity

// @desc    Forensic Digital Evidence Quarantine & Static Heuristic Inspection Sandbox (ISO/IEC 27037)
// @route   POST /api/security/detonate-artifact
router.post('/detonate-artifact', optionalAuth, async (req, res, next) => {
  try {
    const { content, filename, mimeType, complaintId } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Artifact content, base64 payload, or text strings are required for forensic analysis.'
      });
    }

    const { analyzeArtifact } = require('../utils/artifactForensics');
    const report = analyzeArtifact({ content, filename, mimeType });

    // If an optional complaintId is provided, enforce authentication and authorization
    if (complaintId) {
      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'Authentication required to link an artifact to a complaint.'
        });
      }

      const Complaint = require('../models/Complaint');
      const isObjectId = complaintId.match(/^[0-9a-fA-F]{24}$/);
      const complaint = await Complaint.findOne({
        $or: [
          { _id: isObjectId ? complaintId : null },
          { complaintId }
        ]
      });

      if (!complaint) {
        return res.status(404).json({
          status: 'fail',
          message: 'Specified complaint not found.'
        });
      }

      const viewerId = req.user._id.toString();
      const isOwner = complaint.userId?.toString() === viewerId;
      const isOfficer = req.user.role === 'admin' || (req.user.role === 'officer' && (!complaint.assignedTo || complaint.assignedTo.toString() === viewerId));

      if (!isOwner && !isOfficer) {
        return res.status(403).json({
          status: 'fail',
          message: 'Not authorized to link evidence artifacts to this complaint.'
        });
      }

      complaint.forensicArtifacts = complaint.forensicArtifacts || [];
      complaint.forensicArtifacts.push({
        certificateNumber: report.certificateNumber,
        artifactName: report.filename,
        artifactType: report.mimeType,
        md5: report.digests.md5,
        sha1: report.digests.sha1,
        sha256: report.digests.sha256,
        entropy: report.entropy,
        threatScore: report.threatScore,
        verdict: report.verdict,
        indicators: report.matchedIndicators,
        extractedUrls: report.extractedUrls,
        extractedIps: report.extractedIps,
        permissions: report.detectedPermissions,
        sanitizedSummary: report.quarantineCertificate,
        quarantinedAt: new Date()
      });

      complaint.chainOfCustody = complaint.chainOfCustody || [];
      complaint.chainOfCustody.push({
        action: 'EVIDENCE_ARTIFACT_QUARANTINED',
        performedBy: req.user._id,
        role: req.user.role,
        targetFile: report.certificateNumber,
        sha256: report.digests.sha256,
        notes: "Artifact '" + report.filename + "' inspected and quarantined (Verdict: " + report.verdict + ", Threat Score: " + report.threatScore + "/100)",
        timestamp: new Date()
      });

      await complaint.save();
    }

    res.json({
      status: 'success',
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Public / Institutional Evidence & Statutory Notice Integrity Validator
const verifyIntegrity = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'A SHA-256 hash, notice reference, or docket ID is required for verification.'
      });
    }

    const term = query.trim();
    const Complaint = require('../models/Complaint');

    // 1. Search by SHA-256 hash
    if (/^[a-fA-F0-9]{64}$/.test(term)) {
      const match = await Complaint.findOne({
        $or: [
          { 'evidence.sha256': term.toLowerCase() },
          { 'chainOfCustody.sha256': term.toLowerCase() },
          { 'telecomNotices.sha256Digest': term.toLowerCase() },
          { 'takedownNotices.sha256Digest': term.toLowerCase() },
          { 'zeroFIRTransfer.sha256Digest': term.toLowerCase() },
          { 'affidavits65B.sha256Digest': term.toLowerCase() },
          { 'forensicArtifacts.sha256': term.toLowerCase() }
        ]
      }).select('complaintId category createdAt chainOfCustody evidence telecomNotices takedownNotices zeroFIRTransfer affidavits65B forensicArtifacts');

      if (match) {
        const ev = (match.evidence || []).find(e => e.sha256 && e.sha256.toLowerCase() === term.toLowerCase());
        const custodyEvent = (match.chainOfCustody || []).find(c => c.sha256 && c.sha256.toLowerCase() === term.toLowerCase());
        const telecom = (match.telecomNotices || []).find(t => t.sha256Digest && t.sha256Digest.toLowerCase() === term.toLowerCase());
        const takedown = (match.takedownNotices || []).find(tk => tk.sha256Digest && tk.sha256Digest.toLowerCase() === term.toLowerCase());
        const affidavit = (match.affidavits65B || []).find(a => a.sha256Digest && a.sha256Digest.toLowerCase() === term.toLowerCase());
        const artifact = (match.forensicArtifacts || []).find(art => art.sha256 && art.sha256.toLowerCase() === term.toLowerCase());

        let recordType = 'ELECTRONIC_EVIDENCE_FILE';
        let detail = ev ? (ev.originalName || 'Secured Evidence File') : 'Tamper-Evident Ledger Entry';
        if (telecom) { recordType = 'STATUTORY_TELECOM_REQUISITION'; detail = telecom.noticeNumber; }
        if (takedown) { recordType = 'STATUTORY_EMERGENCY_TAKEDOWN'; detail = takedown.noticeNumber; }
        if (affidavit) { recordType = 'SECTION_65B_EVIDENCE_AFFIDAVIT'; detail = affidavit.certificateNumber; }
        if (artifact) { recordType = 'QUARANTINED_EVIDENCE_ARTIFACT'; detail = artifact.certificateNumber; }

        return res.json({
          status: 'success',
          data: {
            verified: true,
            status: 'VERIFIED_AUTHENTIC',
            sha256: term.toLowerCase(),
            recordType,
            detail,
            complaintReference: match.complaintId,
            category: match.category,
            registeredAt: match.createdAt,
            custodyVerifiedAt: custodyEvent?.timestamp || match.createdAt,
            advisory: 'The submitted SHA-256 cryptographic digest matches an authentic, tamper-evident record registered on CyberGuard.'
          }
        });
      }
    }

    // 2. Search by Notice Number or Reference
    const noticeMatch = await Complaint.findOne({
      $or: [
        { complaintId: term },
        { 'chainOfCustody.targetFile': term },
        { 'telecomNotices.noticeNumber': term },
        { 'takedownNotices.noticeNumber': term },
        { 'zeroFIRTransfer.docketNumber': term },
        { 'affidavits65B.certificateNumber': term },
        { 'forensicArtifacts.certificateNumber': term }
      ]
    }).select('complaintId category createdAt chainOfCustody telecomNotices takedownNotices zeroFIRTransfer');

    if (noticeMatch) {
      const telecom = (noticeMatch.telecomNotices || []).find(t => t.noticeNumber === term);
      const takedown = (noticeMatch.takedownNotices || []).find(tk => tk.noticeNumber === term);
      const isZeroFir = noticeMatch.zeroFIRTransfer?.docketNumber === term;
      const affidavit = (noticeMatch.affidavits65B || []).find(a => a.certificateNumber === term);
      const artifact = (noticeMatch.forensicArtifacts || []).find(art => art.certificateNumber === term);

      let recordType = 'OFFICIAL_CASE_RECORD';
      let sha256 = null;
      if (telecom) { recordType = 'STATUTORY_TELECOM_REQUISITION'; sha256 = telecom.sha256Digest; }
      else if (takedown) { recordType = 'STATUTORY_EMERGENCY_TAKEDOWN'; sha256 = takedown.sha256Digest; }
      else if (isZeroFir) { recordType = 'ZERO_FIR_TRANSFER_DOCKET'; sha256 = noticeMatch.zeroFIRTransfer.sha256Digest; }
      else if (affidavit) { recordType = 'SECTION_65B_EVIDENCE_AFFIDAVIT'; sha256 = affidavit.sha256Digest; }
      else if (artifact) { recordType = 'QUARANTINED_EVIDENCE_ARTIFACT'; sha256 = artifact.sha256; }

      return res.json({
        status: 'success',
        data: {
          verified: true,
          status: 'VERIFIED_AUTHENTIC_DIRECTIVE',
          identifier: term,
          sha256,
          recordType,
          complaintReference: noticeMatch.complaintId,
          category: noticeMatch.category,
          registeredAt: noticeMatch.createdAt,
          advisory: 'Valid official statutory instrument issued under Bharatiya Nagarik Suraksha Sanhita (BNSS) / Information Technology Act.'
        }
      });
    }

    return res.json({
      status: 'success',
      data: {
        verified: false,
        status: 'UNVERIFIED_OR_MODIFIED',
        query: term,
        advisory: 'No cryptographic record or statutory notice matches the provided checksum. The file may have been altered or not issued by CyberGuard.'
      }
    });
  } catch (error) {
    next(error);
  }
};

router.post('/verify-integrity', verifyIntegrity);
router.verifyIntegrity = verifyIntegrity;

module.exports = router;
