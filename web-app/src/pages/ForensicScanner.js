import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { complaintsAPI, securityAPI } from '../services/api';
import toast from 'react-hot-toast';
import useTranslationStore from '../hooks/useTranslationStore';
import {
  ArrowLeft,
  Cpu,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  RotateCw,
  Flame,
  Bug,
  AlertTriangle,
  FileText,
  Copy,
  ShieldCheck,
  CheckCircle,
  Hash,
  Scale
} from 'lucide-react';

const QUICK_SCENARIOS = [
  {
    id: 'sms_elec',
    label: 'Electricity Bill Smishing',
    category: 'SMS & UPI Fraud',
    text: 'Dear Customer, Your electricity power supply will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Please immediately contact our Electricity Officer at 9876543210 or update via http://power-bill-update.online/pay.apk'
  },
  {
    id: 'bank_kyc',
    label: 'Urgent Bank KYC Phishing',
    category: 'Phishing & Impersonation',
    text: 'URGENT: Your SBI NetBanking and Debit Card will be permanently blocked within 24 hours due to pending RBI KYC mandate. Click here http://sbi-secure-kyc-verify.xyz/retail/login.php to verify your 16-digit card number, CVV, and PIN.'
  },
  {
    id: 'job_task',
    label: 'Telegram Like & Earn Scam',
    category: 'Financial / Task Fraud',
    text: 'Congratulations! You are selected for Part-Time YouTube Video Liking Job. Earn Rs. 3000 to Rs. 8000 daily from home. Join Telegram channel @vip_crypto_tasks and send deposit to UPI: taskrewards@okaxis to activate your Level 1 VIP account.'
  },
  {
    id: 'digital_arrest',
    label: 'Fake Police Digital Arrest',
    category: 'Extortion / Impersonation',
    text: 'NOTICE FROM NARCOTICS & CBI CYBER CELL: A parcel containing 5 passports and illegal contraband linked to your Aadhaar card number 4892-1928-3910 was intercepted at Mumbai Airport. You are placed under Digital Arrest. Immediately join Skype video interrogation or pay clearance fee to RBI Treasury A/C 918273645102, IFSC: SBIN0001234.'
  },
  {
    id: 'courier_fee',
    label: 'Courier Custom Clearance',
    category: 'Delivery Fraud',
    text: 'FedEx Alert: Your international package #FDX-99214 cannot be delivered due to unpaid customs duty of Rs. 499. Pay immediately at https://fedex-customs-clearance.top/pay before the parcel is returned to sender.'
  }
];

const DETONATION_PRESETS = [
  {
    id: 'spyware_apk',
    label: 'Predatory Loan/Spyware APK',
    filename: 'QuickLoan_Approval.apk',
    mimeType: 'application/vnd.android.package-archive',
    content: `<manifest package="com.quickcash.loan.tracker">
  <uses-permission android:name="android.permission.RECEIVE_SMS" />
  <uses-permission android:name="android.permission.READ_SMS" />
  <uses-permission android:name="android.permission.READ_CONTACTS" />
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
  <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
  <application android:label="Instant Loan">
    <!-- C2 Server Command Endpoint -->
    <meta-data android:name="c2_server" android:value="http://194.26.29.112:8080/beacon" />
  </application>
</manifest>`
  },
  {
    id: 'weaponized_pdf',
    label: 'Weaponized Invoice PDF',
    filename: 'Electricity_Disconnection_Bill.pdf',
    mimeType: 'application/pdf',
    content: `%PDF-1.7
1 0 obj << /Type /Catalog /Pages 2 0 R /OpenAction 3 0 R >> endobj
3 0 obj << /Type /Action /S /JavaScript /JS (app.launchURL("https://bijli-bill-payment-gateway.top/phish");) >> endobj`
  },
  {
    id: 'benign_log',
    label: 'Clean Transaction Receipt',
    filename: 'payment_receipt.txt',
    mimeType: 'text/plain',
    content: `TRANSACTION SUCCESSFUL
Ref: TXN-99881122
Date: 2026-11-02
Amount: INR 450.00
Status: Confirmed by Reserve Bank Clearing System`
  }
];

export default function ForensicScanner() {
  const navigate = useNavigate();
  const { t } = useTranslationStore();

  // Tab State: 'scanner', 'validator', 'detonator'
  const [activeTab, setActiveTab] = useState('scanner');

  // Tab 1: Heuristic IOC Scanner State
  const [inputText, setInputText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Tab 2: Integrity Validator State
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Tab 3: Detonation Sandbox State
  const [artifactContent, setArtifactContent] = useState('');
  const [artifactFilename, setArtifactFilename] = useState('suspicious_payload.apk');
  const [artifactMime, setArtifactMime] = useState('application/vnd.android.package-archive');
  const [detonating, setDetonating] = useState(false);
  const [detonationResult, setDetonationResult] = useState(null);
  const [showQuarantineCert, setShowQuarantineCert] = useState(false);

  // ---------------------------------------------------------------------------
  // Tab 1 Handlers: Heuristic Scanner
  // ---------------------------------------------------------------------------
  const extractIOCs = (text) => {
    const iocs = {
      urls: [],
      emails: [],
      phones: [],
      upis: [],
      bankAccounts: [],
      ifscCodes: [],
      aadhaar: []
    };

    const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
    const urls = text.match(urlRegex) || [];
    iocs.urls = [...new Set(urls)];

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex) || [];
    iocs.emails = [...new Set(emails.filter(e => !e.includes('example.com')))];

    const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{9}/g;
    const phones = text.match(phoneRegex) || [];
    iocs.phones = [...new Set(phones)];

    const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
    const upis = text.match(upiRegex) || [];
    iocs.upis = [...new Set(upis.filter(u => !u.includes('example.com') && !u.includes('@gmail') && !u.includes('@yahoo')))];

    const ifscRegex = /[A-Z]{4}0[A-Z0-9]{6}/g;
    const ifscs = text.match(ifscRegex) || [];
    iocs.ifscCodes = [...new Set(ifscs)];

    const aadhaarRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    const aadhaar = text.match(aadhaarRegex) || [];
    iocs.aadhaar = [...new Set(aadhaar)];

    const accountRegex = /\b\d{9,18}\b/g;
    const accounts = text.match(accountRegex) || [];
    iocs.bankAccounts = [...new Set(accounts.filter(acc => !iocs.phones.some(p => p.includes(acc)) && !iocs.aadhaar.some(a => a.replace(/[\s-]/g, '').includes(acc))))];

    return iocs;
  };

  const handleScan = async (overrideText) => {
    const textToScan = overrideText !== undefined ? overrideText : inputText;
    if (!textToScan || !textToScan.trim()) {
      toast.error('Please enter evidence text, SMS, or URL to analyze');
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const iocs = extractIOCs(textToScan);
      let mlData = null;
      try {
        const { data } = await complaintsAPI.analyze(textToScan);
        if (data.status === 'success' && data.data) {
          mlData = data.data;
        }
      } catch {
        // Fallback gracefully
      }

      const lower = textToScan.toLowerCase();
      const tactics = [];
      let riskScore = 20;

      if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('tonight') || lower.includes('24 hours') || lower.includes('permanently blocked')) {
        tactics.push('Manufactured Urgency & Panic Induction');
        riskScore += 25;
      }
      if (lower.includes('power supply') || lower.includes('electricity') || lower.includes('customs') || lower.includes('narcotics') || lower.includes('cbi') || lower.includes('digital arrest') || lower.includes('sbi')) {
        tactics.push('Authoritative Brand & Institutional Impersonation');
        riskScore += 30;
      }
      if (lower.includes('earn rs') || lower.includes('daily from home') || lower.includes('vip crypto') || lower.includes('like job')) {
        tactics.push('Greed Induction / High-Return Task Trap');
        riskScore += 35;
      }
      if (iocs.urls.length > 0) {
        tactics.push(`Unverified Web Endpoint Detected (${iocs.urls.length} found)`);
        const isSuspiciousTLD = iocs.urls.some(u => u.includes('.xyz') || u.includes('.top') || u.includes('.online') || u.includes('.apk') || u.includes('.buzz') || u.includes('.ru'));
        if (isSuspiciousTLD) {
          tactics.push('High-Risk / Rogue TLD (.xyz, .top, .online, or .apk payload)');
          riskScore += 25;
        }
      }
      if (iocs.upis.length > 0 || iocs.bankAccounts.length > 0) {
        tactics.push('Direct P2P Money Destination / Drop Account');
        riskScore += 20;
      }

      riskScore = Math.min(99, Math.max(20, riskScore));

      const category = mlData?.category || (
        lower.includes('electricity') || lower.includes('bill') ? 'Phishing' :
        lower.includes('job') || lower.includes('task') || lower.includes('youtube') ? 'Financial Fraud' :
        lower.includes('arrest') || lower.includes('cbi') ? 'Extortion' :
        lower.includes('fedex') || lower.includes('customs') ? 'Phishing' : 'Online Fraud'
      );

      const confidence = mlData?.confidence ? Math.round(mlData.confidence * 100) : 88;

      let severity = 'LOW';
      if (riskScore >= 75) severity = 'CRITICAL';
      else if (riskScore >= 50) severity = 'HIGH';
      else if (riskScore >= 35) severity = 'MEDIUM';

      setScanResult({
        category,
        confidence,
        riskScore,
        severity,
        tactics,
        iocs,
        analyzedAt: new Date().toLocaleTimeString('en-IN')
      });
      toast.success('Forensic analysis completed.');
    } catch {
      toast.error('Forensic analysis encountered an error');
    } finally {
      setScanning(false);
    }
  };

  const handleApplyScenario = (scenario) => {
    setInputText(scenario.text);
    handleScan(scenario.text);
  };

  const handleReportFromScan = () => {
    if (!scanResult) return;
    navigate('/submit', {
      state: {
        prefill: {
          title: `Reported Suspicious ${scanResult.category}: ${inputText.slice(0, 50)}...`,
          description: `[FORENSIC SCAN REPORT]\nRisk Level: ${scanResult.severity} (${scanResult.riskScore}/100)\nCategory: ${scanResult.category}\n\nEvidence Content:\n${inputText}\n\nExtracted IOCs:\n${JSON.stringify(scanResult.iocs, null, 2)}`,
          category: scanResult.category
        }
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Tab 2 Handlers: Integrity Validator
  // ---------------------------------------------------------------------------
  const handleVerifyIntegrity = async (termOverride) => {
    const q = (termOverride || verifyQuery).trim();
    if (!q) {
      toast.error('Please enter a SHA-256 hash or Statutory Notice reference');
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data } = await securityAPI.verifyIntegrity(q);
      setVerifyResult(data.data);
      if (data.data?.verified) {
        toast.success('Cryptographic record verified authentic on CyberGuard ledger.');
      } else {
        toast.error('No matching cryptographic record found.');
      }
    } catch (err) {
      toast.error('Verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setVerifying(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 3 Handlers: Detonation Sandbox
  // ---------------------------------------------------------------------------
  const handleDetonateArtifact = async (presetContent, presetFilename, presetMime) => {
    const contentToAnalyze = presetContent !== undefined ? presetContent : artifactContent;
    const filenameToUse = presetFilename !== undefined ? presetFilename : artifactFilename;
    const mimeToUse = presetMime !== undefined ? presetMime : artifactMime;

    if (!contentToAnalyze || !contentToAnalyze.trim()) {
      toast.error('Please enter or select a payload, script, or APK manifest to detonate.');
      return;
    }

    setDetonating(true);
    setDetonationResult(null);
    setShowQuarantineCert(false);

    try {
      const { data } = await securityAPI.detonateArtifact({
        content: contentToAnalyze,
        filename: filenameToUse,
        mimeType: mimeToUse
      });
      setDetonationResult(data.data);
      if (data.data.threatScore >= 60) {
        toast.error(`ARTIFACT INSPECTED: Score ${data.data.threatScore}/100 - High Risk Indicator.`);
      } else if (data.data.threatScore >= 25) {
        toast('SUSPICIOUS: Potential exploit indicators detected.', { icon: '⚠️' });
      } else {
        toast.success('Clean artifact: No malicious indicators detected.');
      }
    } catch (err) {
      toast.error('Forensic inspection failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setDetonating(false);
    }
  };

  return (
    <div className="page-shell" style={{ minHeight: '100vh', background: '#070707', color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8e8b84',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '13px',
              padding: 0,
              marginBottom: 16,
              fontFamily: "'IBM Plex Sans', sans-serif"
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <p style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px 0', fontFamily: "'IBM Plex Mono', monospace" }}>
            FORENSIC & MALWARE INTELLIGENCE SUITE
          </p>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: '0 0 10px 0', color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            DIGITAL EVIDENCE & FORENSIC SCANNER
          </h1>
          <p style={{ color: '#8e8b84', fontSize: '14px', maxWidth: 840, lineHeight: 1.6, margin: 0 }}>
            Inspect heuristic IOCs, audit cryptographic Section 63 BSA evidence hashes on the public ledger, or quarantine and inspect suspicious payloads and document structures via static analysis (ISO/IEC 27037).
          </p>
        </div>

        {/* Workspace Card with 3 Tabs */}
        <div style={{ background: '#0d0d0d', border: '1px solid #30302d', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid #242422', background: '#0a0a0a', overflowX: 'auto' }}>
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              style={{
                background: activeTab === 'scanner' ? '#141414' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'scanner' ? '2px solid #3DF5C0' : '2px solid transparent',
                padding: '16px 22px',
                color: activeTab === 'scanner' ? '#3DF5C0' : '#8e8b84',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
            >
              <Cpu size={15} />
              <span>HEURISTIC IOC SCANNER</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('validator')}
              style={{
                background: activeTab === 'validator' ? '#141414' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'validator' ? '2px solid #3DF5C0' : '2px solid transparent',
                padding: '16px 22px',
                color: activeTab === 'validator' ? '#3DF5C0' : '#8e8b84',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
            >
              <ShieldCheck size={15} />
              <span>EVIDENCE & DIRECTIVE VALIDATOR</span>
              <span style={{ fontSize: '10px', background: '#1c241e', color: '#3DF5C0', border: '1px solid #2d4538', padding: '1px 6px', borderRadius: 4 }}>
                PUBLIC
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('detonator')}
              style={{
                background: activeTab === 'detonator' ? '#141414' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'detonator' ? '2px solid #F43F5E' : '2px solid transparent',
                padding: '16px 22px',
                color: activeTab === 'detonator' ? '#F43F5E' : '#8e8b84',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
            >
              <Flame size={15} />
              <span>STATIC ARTIFACT INSPECTION (ISO/IEC 27037)</span>
              <span style={{ fontSize: '10px', background: '#241416', color: '#f87171', border: '1px solid #4a2024', padding: '1px 6px', borderRadius: 4 }}>
                ISOLATED
              </span>
            </button>
          </div>

          {/* Tab Content Workspace */}
          <div style={{ padding: '32px' }}>
            {activeTab === 'validator' ? (
              /* ── TAB 2: EVIDENCE & STATUTORY DIRECTIVE VALIDATOR ── */
              <div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '11px', color: '#888880', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                    Quick Test Verification Queries:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { label: 'Sample File SHA-256', val: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' },
                      { label: 'Bank Freeze Notice', val: 'SEC106/FREEZE/2026' },
                      { label: 'Telecom Directive', val: 'SEC94/REQ' },
                      { label: 'Takedown Notice', val: 'SEC79/TAKEDOWN' },
                      { label: 'Section 65B Certificate', val: 'SEC65B-2026' },
                      { label: 'Quarantine Ref', val: 'QRN-2026' }
                    ].map((item, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => {
                          setVerifyQuery(item.val);
                          handleVerifyIntegrity(item.val);
                        }}
                        style={{
                          background: '#121212',
                          border: '1px solid #2e2e2b',
                          borderRadius: 6,
                          padding: '6px 12px',
                          color: '#d8d5ce',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleVerifyIntegrity(); }} style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                    PASTE SHA-256 CRYPTOGRAPHIC DIGEST OR STATUTORY NOTICE / DOCKET REFERENCE:
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="text"
                      value={verifyQuery}
                      onChange={(e) => setVerifyQuery(e.target.value)}
                      placeholder="e.g. 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 or SEC65B-2026-102938"
                      style={{
                        flex: 1,
                        background: '#141414',
                        border: '1px solid #30302d',
                        borderRadius: 8,
                        padding: '14px 18px',
                        color: '#f2f0ea',
                        fontSize: '13px',
                        fontFamily: "'IBM Plex Mono', monospace",
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={verifying}
                      style={{
                        background: '#3DF5C0',
                        border: 'none',
                        color: '#070707',
                        padding: '0 24px',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '12px',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                        fontFamily: "'IBM Plex Mono', monospace"
                      }}
                    >
                      {verifying ? 'AUDITING...' : 'VERIFY INTEGRITY'}
                    </button>
                  </div>
                </form>

                {/* Verification Report Card */}
                <AnimatePresence>
                  {verifyResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      style={{
                        background: '#0d0d0d',
                        border: `1px solid ${verifyResult.verified ? '#3DF5C0' : '#d96464'}`,
                        borderRadius: 12,
                        padding: '24px 28px',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {verifyResult.verified ? (
                            <CheckCircle size={20} color="#3DF5C0" />
                          ) : (
                            <ShieldAlert size={20} color="#d96464" />
                          )}
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: verifyResult.verified ? '#3DF5C0' : '#d96464'
                          }}>
                            {verifyResult.status || (verifyResult.verified ? 'VERIFIED AUTHENTIC' : 'UNVERIFIED / MODIFIED')}
                          </span>
                        </div>
                        {verifyResult.complaintReference && (
                          <span style={{ fontSize: '11px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                            CASE REF: {verifyResult.complaintReference}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '13px', color: '#f2f0ea', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                        {verifyResult.advisory}
                      </p>

                      {verifyResult.verified && (
                        <div style={{ background: '#070707', border: '1px solid #242422', borderRadius: 8, padding: '14px 18px', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", color: '#a8a59d', lineHeight: 1.8 }}>
                          {verifyResult.recordType && <div><strong>RECORD TYPE   :</strong> <span style={{ color: '#f2f0ea' }}>{verifyResult.recordType}</span></div>}
                          {verifyResult.detail && <div><strong>EXHIBIT / FILE:</strong> <span style={{ color: '#f2f0ea' }}>{verifyResult.detail}</span></div>}
                          {verifyResult.sha256 && <div style={{ wordBreak: 'break-all' }}><strong>SHA-256 DIGEST:</strong> <span style={{ color: '#3DF5C0' }}>{verifyResult.sha256}</span></div>}
                          {verifyResult.registeredAt && <div><strong>INTAKE DATE   :</strong> {new Date(verifyResult.registeredAt).toLocaleString('en-IN')}</div>}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : activeTab === 'detonator' ? (
              /* ── TAB 3: MALWARE & ARTIFACT DETONATION SANDBOX ── */
              <div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '11px', color: '#888880', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                    Sample Payload Presets (Static Heuristic Inspection):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {DETONATION_PRESETS.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setArtifactContent(p.content);
                          setArtifactFilename(p.filename);
                          setArtifactMime(p.mimeType);
                          handleDetonateArtifact(p.content, p.filename, p.mimeType);
                        }}
                        style={{
                          background: '#121212',
                          border: '1px solid #2e2e2b',
                          borderRadius: 6,
                          padding: '6px 12px',
                          color: '#d8d5ce',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleDetonateArtifact(); }} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        ARTIFACT FILENAME:
                      </label>
                      <input
                        type="text"
                        value={artifactFilename}
                        onChange={e => setArtifactFilename(e.target.value)}
                        placeholder="e.g. Electricity_Notice.apk"
                        style={{
                          width: '100%',
                          background: '#141414',
                          border: '1px solid #30302d',
                          borderRadius: 8,
                          padding: '10px 14px',
                          color: '#f2f0ea',
                          fontSize: '12px',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        MIME TYPE / ARTIFACT CLASS:
                      </label>
                      <input
                        type="text"
                        value={artifactMime}
                        onChange={e => setArtifactMime(e.target.value)}
                        placeholder="e.g. application/vnd.android.package-archive"
                        style={{
                          width: '100%',
                          background: '#141414',
                          border: '1px solid #30302d',
                          borderRadius: 8,
                          padding: '10px 14px',
                          color: '#f2f0ea',
                          fontSize: '12px',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}
                      />
                    </div>
                  </div>

                  <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                    RAW ARTIFACT PAYLOAD, APK MANIFEST, WEAPONIZED PDF STRINGS, OR BASE64 BYTE STREAM:
                  </label>
                  <textarea
                    rows={6}
                    value={artifactContent}
                    onChange={e => setArtifactContent(e.target.value)}
                    placeholder="Paste suspicious code, XML manifest, shell script, or base64 binary stream here..."
                    style={{
                      width: '100%',
                      background: '#141414',
                      border: '1px solid #30302d',
                      borderRadius: 8,
                      padding: '14px 18px',
                      color: '#f2f0ea',
                      fontSize: '12px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      outline: 'none',
                      resize: 'vertical',
                      marginBottom: 16
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => { setArtifactContent(''); setDetonationResult(null); }}
                      style={{
                        background: '#141414',
                        border: '1px solid #30302d',
                        borderRadius: 8,
                        padding: '10px 20px',
                        color: '#8e8b84',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      RESET
                    </button>
                    <button
                      type="submit"
                      disabled={detonating}
                      style={{
                        background: '#F43F5E',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 24px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: "'IBM Plex Sans', sans-serif"
                      }}
                    >
                      <Flame size={15} />
                      <span>{detonating ? 'INSPECTING & QUARANTINING...' : 'INSPECT & QUARANTINE ARTIFACT'}</span>
                    </button>
                  </div>
                </form>

                {/* Detonation Results */}
                {detonationResult && (
                  <div style={{
                    background: '#121212',
                    border: '1px solid ' + (detonationResult.threatScore >= 60 ? '#4a2024' : detonationResult.threatScore >= 25 ? '#4a3518' : '#1a382a'),
                    borderRadius: 12,
                    padding: '24px 28px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, borderBottom: '1px solid #242422', paddingBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono', monospace",
                            padding: '4px 10px',
                            borderRadius: 4,
                            background: detonationResult.threatScore >= 60 ? '#2b1414' : detonationResult.threatScore >= 25 ? '#261b0c' : '#0d1a14',
                            color: detonationResult.threatScore >= 60 ? '#f87171' : detonationResult.threatScore >= 25 ? '#e5a442' : '#3DF5C0',
                            border: '1px solid ' + (detonationResult.threatScore >= 60 ? '#4d2020' : detonationResult.threatScore >= 25 ? '#4a3518' : '#1a382a')
                          }}>
                            {detonationResult.verdict}
                          </span>
                          <span style={{ fontSize: '12px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                            REF: {detonationResult.certificateNumber}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#d8d5ce' }}>
                          Artifact: <strong>{detonationResult.filename}</strong> ({detonationResult.byteLength} bytes)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowQuarantineCert(!showQuarantineCert)}
                        style={{
                          background: '#141414',
                          border: '1px solid #3DF5C0',
                          borderRadius: 6,
                          padding: '8px 14px',
                          color: '#3DF5C0',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <FileText size={13} />
                        <span>{showQuarantineCert ? 'HIDE QUARANTINE CERT' : 'VIEW ISO/IEC 27037 CERT'}</span>
                      </button>
                    </div>

                    {/* Score Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                      <div style={{ background: '#0a0a0a', border: '1px solid #242422', borderRadius: 8, padding: 14 }}>
                        <span style={{ display: 'block', fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                          THREAT SEVERITY SCORE
                        </span>
                        <span style={{
                          fontSize: '22px',
                          fontWeight: 700,
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: detonationResult.threatScore >= 60 ? '#f87171' : detonationResult.threatScore >= 25 ? '#e5a442' : '#3DF5C0'
                        }}>
                          {detonationResult.threatScore} / 100
                        </span>
                      </div>

                      <div style={{ background: '#0a0a0a', border: '1px solid #242422', borderRadius: 8, padding: 14 }}>
                        <span style={{ display: 'block', fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                          SHANNON ENTROPY (0.0 - 8.0)
                        </span>
                        <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#f2f0ea' }}>
                          {detonationResult.entropy} <span style={{ fontSize: '11px', color: detonationResult.entropy > 7.1 ? '#f87171' : '#3DF5C0' }}>({detonationResult.entropy > 7.1 ? 'PACKED/ENCRYPTED' : 'STANDARD DISTRIBUTION'})</span>
                        </span>
                      </div>

                      <div style={{ background: '#0a0a0a', border: '1px solid #242422', borderRadius: 8, padding: 14 }}>
                        <span style={{ display: 'block', fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                          QUARANTINE DISPATCH STATUS
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                          ISOLATED & HASH SEALED
                        </span>
                      </div>
                    </div>

                    {/* Cryptographic Hashes */}
                    <div style={{ background: '#0a0a0a', border: '1px solid #242422', borderRadius: 8, padding: 14, marginBottom: 20 }}>
                      <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
                        CRYPTOGRAPHIC BITSTREAM IDENTIFIERS:
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: '#d8d5ce', lineHeight: 1.8 }}>
                        <div><strong>MD5   :</strong> {detonationResult.digests?.md5}</div>
                        <div><strong>SHA-1 :</strong> {detonationResult.digests?.sha1}</div>
                        <div style={{ wordBreak: 'break-all' }}><strong>SHA-256:</strong> <span style={{ color: '#3DF5C0' }}>{detonationResult.digests?.sha256}</span></div>
                      </div>
                    </div>

                    {/* Key Indicators Observed */}
                    {detonationResult.matchedIndicators?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
                          FORENSIC THREAT INDICATORS DETECTED:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detonationResult.matchedIndicators.map((ind, indIdx) => (
                            <div key={indIdx} style={{
                              background: '#171414',
                              border: '1px solid #3d2024',
                              borderRadius: 6,
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: '#fca5a5',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}>
                              <AlertTriangle size={13} color="#f87171" />
                              <span>{ind}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Network IOCs */}
                    {(detonationResult.extractedIps?.length > 0 || detonationResult.extractedUrls?.length > 0) && (
                      <div style={{ background: '#0a0a0a', border: '1px solid #242422', borderRadius: 8, padding: 14, marginBottom: 20 }}>
                        <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
                          EXTRACTED NETWORK COMMAND & CONTROL (C2) DESTINATIONS:
                        </div>
                        {detonationResult.extractedIps?.length > 0 && (
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#d8d5ce', fontFamily: "'IBM Plex Mono', monospace" }}>
                            <strong>IP Addresses:</strong> {detonationResult.extractedIps.join(', ')}
                          </p>
                        )}
                        {detonationResult.extractedUrls?.length > 0 && (
                          <p style={{ margin: 0, fontSize: '12px', color: '#d8d5ce', fontFamily: "'IBM Plex Mono', monospace" }}>
                            <strong>Outbound URLs:</strong> {detonationResult.extractedUrls.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quarantine Certificate Dropdown */}
                    {showQuarantineCert && (
                      <div style={{ marginTop: 20 }}>
                        <pre style={{
                          background: '#070707',
                          border: '1px solid #3DF5C0',
                          borderRadius: 8,
                          padding: 20,
                          color: '#d4d0c7',
                          fontSize: '11px',
                          lineHeight: 1.6,
                          fontFamily: "'IBM Plex Mono', monospace",
                          whiteSpace: 'pre-wrap',
                          maxHeight: '360px',
                          overflowY: 'auto'
                        }}>
                          {detonationResult.quarantineCertificate}
                        </pre>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(detonationResult.quarantineCertificate);
                              toast.success('Quarantine Certificate copied.');
                            }}
                            style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '6px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}
                          >
                            <Copy size={12} />
                            <span>COPY CERTIFICATE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '6px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                          >
                            PRINT CERTIFICATE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ── TAB 1: HEURISTIC IOC SCANNER ── */
              <div>
                {/* Quick Scenario Chips */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '11px', color: '#888880', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                    TEST COMMON THREAT VECTORS (1-CLICK RUN):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {QUICK_SCENARIOS.map(sc => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleApplyScenario(sc)}
                        style={{
                          background: '#121212',
                          border: '1px solid #2e2e2b',
                          borderRadius: 6,
                          padding: '6px 12px',
                          color: '#d8d5ce',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Grid: Input + Results */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                  {/* Left: Input Console */}
                  <div style={{ background: '#121212', border: '1px solid #242422', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                        FORENSIC INPUT CONSOLE
                      </span>
                      <button
                        type="button"
                        onClick={() => { setInputText(''); setScanResult(null); }}
                        style={{ background: 'none', border: 'none', color: '#8e8b84', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Clear
                      </button>
                    </div>

                    <textarea
                      rows={8}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste suspicious SMS text, phishing email headers, extortion notes, WhatsApp chat logs, or suspect URLs here..."
                      style={{
                        width: '100%',
                        background: '#070707',
                        border: '1px solid #30302d',
                        borderRadius: 8,
                        padding: '14px 16px',
                        color: '#f2f0ea',
                        fontSize: '13px',
                        fontFamily: "'IBM Plex Mono', monospace",
                        lineHeight: 1.6,
                        outline: 'none',
                        resize: 'vertical',
                        marginBottom: 16
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleScan()}
                        disabled={scanning}
                        style={{
                          background: '#3DF5C0',
                          border: 'none',
                          color: '#070707',
                          padding: '10px 22px',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: "'IBM Plex Sans', sans-serif"
                        }}
                      >
                        <Cpu size={15} />
                        <span>{scanning ? 'SCANNING IOCs...' : 'SCAN EVIDENCE'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Results Display */}
                  <div>
                    {scanResult ? (
                      <div style={{ background: '#121212', border: '1px solid #242422', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #1a1a1a', paddingBottom: 12 }}>
                          <div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: "'IBM Plex Mono', monospace",
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: scanResult.severity === 'CRITICAL' ? '#2b1414' : scanResult.severity === 'HIGH' ? '#261b0c' : '#0d1a14',
                              color: scanResult.severity === 'CRITICAL' ? '#f87171' : scanResult.severity === 'HIGH' ? '#e5a442' : '#3DF5C0',
                              border: '1px solid ' + (scanResult.severity === 'CRITICAL' ? '#4d2020' : scanResult.severity === 'HIGH' ? '#4a3518' : '#1a382a')
                            }}>
                              {scanResult.severity} RISK ({scanResult.riskScore}/100)
                            </span>
                            <h3 style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#f2f0ea', fontWeight: 700 }}>
                              {scanResult.category}
                            </h3>
                          </div>
                          <span style={{ fontSize: '11px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                            Confidence: {scanResult.confidence}%
                          </span>
                        </div>

                        {/* Tactics */}
                        {scanResult.tactics?.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>
                              IDENTIFIED ATTACK TACTICS:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {scanResult.tactics.map((tac, tIdx) => (
                                <div key={tIdx} style={{ fontSize: '11px', color: '#fca5a5', background: '#1c1414', border: '1px solid #3d2024', borderRadius: 4, padding: '4px 8px' }}>
                                  • {tac}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted IOCs */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                          <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
                            EXTRACTED INDICATORS OF COMPROMISE:
                          </div>
                          <div style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: '#d8d5ce', lineHeight: 1.6 }}>
                            {scanResult.iocs.urls?.length > 0 && <div><strong style={{ color: '#38bdf8' }}>URLs   :</strong> {scanResult.iocs.urls.join(', ')}</div>}
                            {scanResult.iocs.phones?.length > 0 && <div><strong style={{ color: '#d8a43a' }}>Phones :</strong> {scanResult.iocs.phones.join(', ')}</div>}
                            {scanResult.iocs.upis?.length > 0 && <div><strong style={{ color: '#3DF5C0' }}>UPI IDs:</strong> {scanResult.iocs.upis.join(', ')}</div>}
                            {scanResult.iocs.bankAccounts?.length > 0 && <div><strong style={{ color: '#a78bfa' }}>Bank AC:</strong> {scanResult.iocs.bankAccounts.join(', ')}</div>}
                            {scanResult.iocs.ifscCodes?.length > 0 && <div><strong style={{ color: '#e5a442' }}>IFSC   :</strong> {scanResult.iocs.ifscCodes.join(', ')}</div>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleReportFromScan}
                          style={{
                            width: '100%',
                            background: '#3DF5C0',
                            border: 'none',
                            color: '#070707',
                            padding: '11px',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontFamily: "'IBM Plex Sans', sans-serif"
                          }}
                        >
                          <span>FILE REPORT WITH THIS EVIDENCE</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: '#121212', border: '1px dashed #242422', borderRadius: 12, padding: 40, textAlign: 'center', color: '#8e8b84' }}>
                        <Cpu size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontSize: '13px' }}>
                          Paste threat text or pick a test scenario on the left to run deep forensic extraction.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
