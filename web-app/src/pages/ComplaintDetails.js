import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  FileText, ShieldAlert, Download, X, Printer, CheckCircle, Landmark, 
  ShieldCheck, Copy, PhoneCall, AlertTriangle, FileCheck, Mail, Scale, ExternalLink, Building2, Search,
  Radio, ArrowRight, Plus, DollarSign, Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { complaintsAPI, securityAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import SecureChat from '../components/SecureChat';

const STATUS_COLORS = {
  pending: '#d8a43a', under_review: '#3DF5C0', investigating: '#3DF5C0',
  resolved: '#10b981', closed: '#8e8b84', rejected: '#d96464'
};

const BANK_HELPLINES = [
  { name: 'National Cyber Crime Portal', number: '1930', tollfree: true, note: 'First 2-4 Hours Golden Hour Hotline' },
  { name: 'State Bank of India (SBI)', number: '1800 11 1109', tollfree: true, note: '24/7 Fraud & Debit Freeze Desk' },
  { name: 'HDFC Bank', number: '1800 258 3838', tollfree: true, note: 'NetBanking & UPI Fraud Reporting' },
  { name: 'ICICI Bank', number: '1800 1080', tollfree: true, note: 'Emergency Card/UPI Freeze' },
  { name: 'Axis Bank', number: '1860 419 5555', tollfree: false, note: 'Fraud Operations Division' },
  { name: 'Punjab National Bank (PNB)', number: '1800 180 2222', tollfree: true, note: 'Immediate Freeze' },
  { name: 'Paytm Payments Bank', number: '0120 3888 388', tollfree: false, note: 'Wallet & UPI Risk Desk' },
  { name: 'PhonePe Support', number: '080 6872 7374', tollfree: false, note: 'UPI Incident Triage' },
  { name: 'Google Pay India', number: '1800 419 0157', tollfree: true, note: 'Payment Gateway Security' }
];

export default function ComplaintDetails() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOfficerOrAdmin = user?.role === 'admin' || user?.role === 'officer';
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Modals state
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showGoldenHourModal, setShowGoldenHourModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showFIRModal, setShowFIRModal] = useState(false);

  // Data states
  const [custodyLedger, setCustodyLedger] = useState([]);
  const [custodyLoading, setCustodyLoading] = useState(false);
  const [issuedNotice, setIssuedNotice] = useState(null);
  const [freezeSubmitting, setFreezeSubmitting] = useState(false);
  const [firDraft, setFirDraft] = useState(null);
  const [firLoading, setFirLoading] = useState(false);
  const [showDocketModal, setShowDocketModal] = useState(false);
  const [docketData, setDocketData] = useState(null);
  const [docketLoading, setDocketLoading] = useState(false);
  const [showNodalDirectory, setShowNodalDirectory] = useState(false);
  const [nodalMatches, setNodalMatches] = useState([]);
  const [nodalDirectoryList, setNodalDirectoryList] = useState([]);
  const [nodalSearch, setNodalSearch] = useState('');
  const [nodalCategory, setNodalCategory] = useState('all');

  // Phase 4: Telecom Requisition (Sec 94 BNSS)
  const [showTelecomModal, setShowTelecomModal] = useState(false);
  const [telecomForm, setTelecomForm] = useState({
    targetProvider: 'Airtel',
    requisitionType: 'CDR',
    targetIdentifier: '',
    targetTimeWindow: 'Past 30 Days',
    allegationBrief: ''
  });
  const [telecomSubmitting, setTelecomSubmitting] = useState(false);
  const [issuedTelecomNotice, setIssuedTelecomNotice] = useState(null);

  // Phase 4: Restitution Petition (Sec 503 BNSS)
  const [showRestitutionModal, setShowRestitutionModal] = useState(false);
  const [restitutionData, setRestitutionData] = useState(null);
  const [restitutionLoading, setRestitutionLoading] = useState(false);

  // Phase 4: Financial Mule Trail & Escrow Recovery
  const [moneyTrailData, setMoneyTrailData] = useState({ hops: [], summary: {} });
  const [showAddHopModal, setShowAddHopModal] = useState(false);
  const [hopForm, setHopForm] = useState({
    hopNumber: 1,
    fromAccountOrUpi: '',
    toBankName: '',
    toAccountOrUpi: '',
    ifsc: '',
    amount: '',
    utrOrRef: '',
    status: 'TRANSFER_RECORDED',
    freezeNoticeRef: '',
    notes: ''
  });
  const [hopSubmitting, setHopSubmitting] = useState(false);

  // Phase 5: P0 Emergency Takedown (Sec 79(3)(b) IT Act)
  const [showTakedownModal, setShowTakedownModal] = useState(false);
  const [takedownForm, setTakedownForm] = useState({
    targetPlatform: 'Instagram / Meta',
    offenceCategory: 'Non-Consensual Intimate Imagery (NCII)',
    contentUrls: '',
    victimSafetyNotes: ''
  });
  const [takedownSubmitting, setTakedownSubmitting] = useState(false);
  const [issuedTakedownNotice, setIssuedTakedownNotice] = useState(null);

  // Phase 7: Restitution Pipeline & Milestone Progression
  const [showRestitutionMilestoneModal, setShowRestitutionMilestoneModal] = useState(false);
  const [restitutionPipelineData, setRestitutionPipelineData] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({
    stage: 'COURT_RELEASE_ORDERED',
    courtOrderNumber: '',
    settlementUtr: '',
    amountRestored: '',
    remittanceBank: 'State Bank of India',
    notes: ''
  });
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);

  const fetchRestitutionPipeline = useCallback(async () => {
    try {
      const { data } = await complaintsAPI.getRestitutionStatus(complaintId);
      setRestitutionPipelineData(data.data);
    } catch (_) {}
  }, [complaintId]);

  useEffect(() => {
    if (complaintId) {
      fetchRestitutionPipeline();
    }
  }, [complaintId, fetchRestitutionPipeline]);

  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    setMilestoneSubmitting(true);
    try {
      await complaintsAPI.updateRestitutionMilestone(complaintId, milestoneForm);
      toast.success('Restitution pipeline stage updated successfully.');
      setShowRestitutionMilestoneModal(false);
      await fetchRestitutionPipeline();
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update restitution milestone.');
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  // Phase 6: Section 65B(4) IEA / Section 63(4) BSA Electronic Evidence Affidavit
  const [showSection65BModal, setShowSection65BModal] = useState(false);
  const [affidavitForm, setAffidavitForm] = useState({
    deponentName: '',
    deponentDesignation: 'Complainant & Lawful Device Custodian',
    deponentAddress: '',
    deviceMakeModel: 'Apple iPhone 15 Pro / Samsung Galaxy S23',
    osVersion: 'Android 14 / iOS 17 / Windows 11',
    deviceIdentifier: 'IMEI: 358912345678901',
    custodyPeriod: 'During the entire material period of the incident',
    selectedExhibitHashes: []
  });
  const [affidavitSubmitting, setAffidavitSubmitting] = useState(false);
  const [issuedAffidavit, setIssuedAffidavit] = useState(null);

  const openSection65BModal = () => {
    if (complaint) {
      setAffidavitForm(prev => ({
        ...prev,
        deponentName: prev.deponentName || user?.name || complaint.victimDetails?.name || 'Complainant on Record',
        deponentDesignation: user?.role === 'officer' ? (user.role.toUpperCase() + ' / Investigating Officer') : 'Complainant & Lawful Device Custodian',
        selectedExhibitHashes: (complaint.evidence || []).map(e => e.sha256).filter(Boolean)
      }));
    }
    setShowSection65BModal(true);
  };

  const handleAffidavitSubmit = async (e) => {
    e.preventDefault();
    if (!affidavitForm.deponentName || !affidavitForm.deponentName.trim()) {
      toast.error('Deponent name is required to execute Section 65B affidavit.');
      return;
    }
    setAffidavitSubmitting(true);
    try {
      const { data } = await complaintsAPI.generateSection65B(complaintId, affidavitForm);
      setIssuedAffidavit(data.data);
      toast.success('Section 63 BSA Electronic Record Certificate Draft generated.');
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to execute Section 65B affidavit.');
    } finally {
      setAffidavitSubmitting(false);
    }
  };

  // Phase 5: Zero FIR Jurisdictional Transfer (Sec 173(1) BNSS)
  const [showZeroFIRModal, setShowZeroFIRModal] = useState(false);
  const [zeroFIRForm, setZeroFIRForm] = useState({
    destinationPoliceStation: 'Mewat Cyber Crime Police Station',
    destinationDistrict: 'Nuh District, Haryana'
  });
  const [zeroFIRSubmitting, setZeroFIRSubmitting] = useState(false);
  const [zeroFIRData, setZeroFIRData] = useState(null);

  const [freezeForm, setFreezeForm] = useState({
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
    transactionRef: '',
    amount: '',
    reason: 'Fraudulent diversion of citizen funds under active cyber investigation'
  });

  // Auto-lookup verified nodal contacts when bank name or IFSC changes
  useEffect(() => {
    const term = freezeForm.ifsc?.trim() || freezeForm.bankName?.trim();
    if (!term || term.length < 2) {
      setNodalMatches([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await securityAPI.nodalDirectory({
          query: term,
          ifsc: freezeForm.ifsc?.length >= 4 ? freezeForm.ifsc : undefined
        });
        if (res.data?.data?.results) {
          setNodalMatches(res.data.data.results.slice(0, 3));
        }
      } catch (_) {}
    }, 250);
    return () => clearTimeout(timer);
  }, [freezeForm.bankName, freezeForm.ifsc]);

  // Load full nodal directory when modal opened
  useEffect(() => {
    if (showNodalDirectory) {
      securityAPI.nodalDirectory({ query: nodalSearch, category: nodalCategory }).then(res => {
        if (res.data?.data?.results) setNodalDirectoryList(res.data.data.results);
      }).catch(() => {});
    }
  }, [showNodalDirectory, nodalSearch, nodalCategory]);

  const downloadEvidence = async (file) => {
    try {
      const response = await complaintsAPI.getEvidence(complaintId, file.filename);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (_) {
      toast.error('Evidence download was not authorized or is unavailable.');
    }
  };

  const fetchComplaint = useCallback(async () => {
    try {
      const { data } = await complaintsAPI.getOne(complaintId);
      setComplaint(data.data.complaint);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else {
        toast.error('Failed to load complaint details.');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [complaintId, navigate]);

  useEffect(() => {
    if (complaintId) {
      fetchComplaint();
      fetchMoneyTrail();
    }
  }, [complaintId, fetchComplaint]);

  const openDossier = async () => {
    setShowDossierModal(true);
    setCustodyLoading(true);
    try {
      const { data } = await complaintsAPI.getCustody(complaintId);
      setCustodyLedger(data.data.chainOfCustody || []);
    } catch (err) {
      console.warn('Could not fetch custody ledger directly:', err.message);
      setCustodyLedger(complaint.chainOfCustody || []);
    } finally {
      setCustodyLoading(false);
    }
  };

  const openFIR = async () => {
    setShowFIRModal(true);
    setFirLoading(true);
    try {
      const { data } = await complaintsAPI.getFIRDraft(complaintId);
      setFirDraft(data.data);
    } catch (err) {
      toast.error('Failed to generate FIR draft: ' + (err.response?.data?.message || err.message));
    } finally {
      setFirLoading(false);
    }
  };

  const openTakedownModal = () => {
    setShowTakedownModal(true);
  };

  const handleTakedownSubmit = async (e) => {
    e.preventDefault();
    if (!takedownForm.targetPlatform) {
      toast.error('Target platform is required.');
      return;
    }
    setTakedownSubmitting(true);
    try {
      const urls = takedownForm.contentUrls.split('\n').map(u => u.trim()).filter(Boolean);
      const { data } = await complaintsAPI.issueEmergencyTakedown(complaintId, {
        targetPlatform: takedownForm.targetPlatform,
        offenceCategory: takedownForm.offenceCategory,
        contentUrls: urls,
        victimSafetyNotes: takedownForm.victimSafetyNotes
      });
      setIssuedTakedownNotice(data.data);
      toast.success('P0 Emergency Takedown Directive issued.');
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue takedown directive.');
    } finally {
      setTakedownSubmitting(false);
    }
  };

  const openZeroFIRModal = () => {
    setShowZeroFIRModal(true);
  };

  const handleZeroFIRSubmit = async (e) => {
    e.preventDefault();
    setZeroFIRSubmitting(true);
    try {
      const { data } = await complaintsAPI.getZeroFIRTransfer(complaintId, zeroFIRForm);
      setZeroFIRData(data.data);
      toast.success('Zero FIR Jurisdictional Transfer Memo compiled.');
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to compile Zero FIR transfer.');
    } finally {
      setZeroFIRSubmitting(false);
    }
  };

  const openDocket = async () => {
    setShowDocketModal(true);
    setDocketLoading(true);
    try {
      const { data } = await complaintsAPI.getMagistrateDocket(complaintId);
      setDocketData(data.data);
    } catch (err) {
      toast.error('Failed to load Magistrate Docket: ' + (err.response?.data?.message || err.message));
    } finally {
      setDocketLoading(false);
    }
  };

  const openTelecomModal = () => {
    const ocrExtracted = complaint?.ocrData?.extracted || {};
    const defaultPhone = (ocrExtracted.phones && ocrExtracted.phones[0]) || complaint?.suspectInfo?.details || '';
    setTelecomForm(prev => ({
      ...prev,
      targetIdentifier: prev.targetIdentifier || defaultPhone,
      allegationBrief: prev.allegationBrief || complaint?.description || ''
    }));
    setShowTelecomModal(true);
  };

  const handleTelecomSubmit = async (e) => {
    e.preventDefault();
    if (!telecomForm.targetProvider || !telecomForm.targetIdentifier) {
      toast.error('Target provider and identifier are required.');
      return;
    }
    setTelecomSubmitting(true);
    try {
      const { data } = await complaintsAPI.issueTelecomRequisition(complaintId, telecomForm);
      setIssuedTelecomNotice(data.data);
      toast.success('Section 94 BNSS Requisition Notice issued.');
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue telecom requisition.');
    } finally {
      setTelecomSubmitting(false);
    }
  };

  const openRestitution = async () => {
    setShowRestitutionModal(true);
    setRestitutionLoading(true);
    try {
      const { data } = await complaintsAPI.getRestitutionPetition(complaintId);
      setRestitutionData(data.data);
    } catch (err) {
      toast.error('Failed to compile Restitution Petition: ' + (err.response?.data?.message || err.message));
    } finally {
      setRestitutionLoading(false);
    }
  };

  const fetchMoneyTrail = async () => {
    try {
      const { data } = await complaintsAPI.getMoneyTrail(complaintId);
      if (data?.data) {
        setMoneyTrailData(data.data);
      }
    } catch (_) {}
  };

  const handleAddHopSubmit = async (e) => {
    e.preventDefault();
    if (!hopForm.toBankName || !hopForm.toAccountOrUpi || !hopForm.amount) {
      toast.error('Bank Name, Beneficiary Account, and Amount are required.');
      return;
    }
    setHopSubmitting(true);
    try {
      await complaintsAPI.addMoneyTrailHop(complaintId, hopForm);
      toast.success('Financial hop successfully logged in money trail.');
      setShowAddHopModal(false);
      setHopForm({
        hopNumber: ((moneyTrailData.hops?.length || 0) + 2),
        fromAccountOrUpi: hopForm.toAccountOrUpi,
        toBankName: '',
        toAccountOrUpi: '',
        ifsc: '',
        amount: '',
        utrOrRef: '',
        status: 'TRANSFER_RECORDED',
        freezeNoticeRef: '',
        notes: ''
      });
      await fetchMoneyTrail();
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log financial hop.');
    } finally {
      setHopSubmitting(false);
    }
  };

  const handleBankFreezeSubmit = async (e) => {
    e.preventDefault();
    if (!freezeForm.accountNumber && !freezeForm.upiId && !freezeForm.transactionRef) {
      toast.error('Please specify at least an Account Number, UPI ID, or Transaction Reference.');
      return;
    }
    setFreezeSubmitting(true);
    try {
      const { data } = await complaintsAPI.issueBankFreeze(complaintId, freezeForm);
      setIssuedNotice(data.data);
      toast.success('Statutory Bank-Freeze Notice generated under Section 106 BNSS.');
      await fetchComplaint();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch bank-freeze notice.');
    } finally {
      setFreezeSubmitting(false);
    }
  };

  // Generate formal RBI Dispute Letter text
  const generateRBILetterText = () => {
    if (!complaint) return '';
    const victim = complaint.victimDetails || {};
    const victimName = victim.name || complaint.userId?.name || 'Complainant';
    const contact = victim.mobile || complaint.userId?.phone || 'On Record';
    const amount = victim.amountLost || 'As per transaction dispute';
    const txnRef = victim.transactionReference || 'Under investigation / Transaction Statement Attached';
    const dateStr = victim.incidentDate ? format(new Date(victim.incidentDate), 'dd-MMM-yyyy HH:mm') : format(new Date(complaint.createdAt), 'dd-MMM-yyyy');

    return [
      'To,',
      'The Branch Manager / Nodal Cyber Grievance Officer,',
      freezeForm.bankName || '[Name of Financial Institution / Bank],',
      '',
      'SUBJECT: FORMAL WRITTEN DISPUTE OF UNAUTHORIZED TRANSACTION & INVOCATION OF ZERO CUSTOMER LIABILITY UNDER RBI CIRCULAR DBR.No.Leg.BC.78/09.07.005/2017-18',
      '',
      'Dear Sir / Madam,',
      '',
      'I am writing to formally report an unauthorized electronic fraud debit from my account and place on record this statutory dispute within the 3-day reporting window.',
      '',
      '1. INCIDENT PARTICULARS:',
      `   • Account Holder / Complainant : ${victimName}`,
      `   • Registered Mobile Number     : ${contact}`,
      `   • Disputed Transaction Amount  : INR ${amount}`,
      `   • Transaction UTR / Ref Number : ${txnRef}`,
      `   • Date & Time of Occurrence    : ${dateStr}`,
      `   • National Cyber Crime Ref ID  : ${complaint.complaintId}`,
      '',
      '2. STATUTORY LEGAL MANDATE (RESERVE BANK OF INDIA):',
      'Under the Reserve Bank of India (RBI) Circular on "Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions" (DBR.No.Leg.BC.78/09.07.005/2017-18):',
      '   a. Notice is formally tendered within three (3) working days of the transaction.',
      '   b. As per Section 6(a), Zero Liability applies where the unauthorized transaction occurs through third-party breach/fraud where neither the bank nor the customer is at fault, but lies elsewhere in the system.',
      '   c. As per Section 9, the bank is mandated to credit (shadow reversal) the disputed amount to the customer account within 10 working days of this notification.',
      '',
      '3. DIRECTIVES REQUESTED:',
      '   • Immediately transmit an urgent hold/recall request to the beneficiary bank / aggregator.',
      '   • Preserve IP connection logs, device IMEI, and transaction timestamps for the cyber forensics audit.',
      '   • Issue a formal Grievance Acknowledgment Number for this dispute.',
      '',
      'Official Cyber Incident Dossier Ref #' + complaint.complaintId + ' has been registered with law enforcement.',
      '',
      'Sincerely,',
      `${victimName}`,
      `Date: ${format(new Date(), 'dd MMMM yyyy')}`
    ].join('\n');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#070707', color: '#f2f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        LOADING SECURE DATA...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ minHeight: '100dvh', background: '#070707', color: '#f2f0ea', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <h1 style={{ color: '#d96464', fontSize: '2.5rem', marginBottom: '16px', fontWeight: 800 }}>ACCESS DENIED</h1>
        <p style={{ color: '#8e8b84', fontSize: '1.2rem', marginBottom: '32px' }}>
          You don't have permission to view this complaint.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ 
            background: '#141414', 
            border: '1px solid #30302d',
            color: '#f2f0ea', 
            padding: '12px 24px', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          RETURN TO DASHBOARD
        </button>
      </div>
    );
  }

  if (!complaint) return null;

  const canExecuteEnforcement = user?.role === 'admin' || user?.role === 'officer';
  const isFinancialOrScam = complaint.category?.includes('Financial') || complaint.category?.includes('Online Fraud') || complaint.category?.includes('Phishing') || complaint.category?.includes('Crypto') || complaint.victimDetails?.amountLost;

  return (
    <div className="page-shell" style={{ 
      minHeight: '100dvh', 
      background: '#070707', 
      color: '#f2f0ea',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: "'IBM Plex Sans', sans-serif"
    }}>
      <Navbar />
      
      <main className="report-layout" style={{ 
        maxWidth: 1100, 
        margin: '0 auto', 
        padding: '44px 24px 100px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Strip with Back Link */}
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginBottom: 32 }}>
          <button 
            type="button"
            className="back-link"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              color: '#f2f0ea',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 16
            }}
          >
            <span style={{ fontSize: 16 }}>←</span>
            <span>Back to Dashboard</span>
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: 16 }}>
            <div className="aside-copy">
              <p className="eyebrow" style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 10px' }}>
                OFFICIAL CASE DOSSIER
              </p>
              <h1 style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#f2f0ea',
                margin: '0 0 10px'
              }}>
                INCIDENT FORENSIC RECORD
              </h1>
              <p style={{ color: '#8e8b84', margin: 0, fontSize: '14px', maxWidth: 650 }}>
                Cryptographically verified incident timeline, evidentiary custody (Sec 65B), suspect intelligence, and rapid financial dispute protocols.
              </p>
            </div>

            {/* Quick Action Buttons Toolbar */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {isFinancialOrScam && (
                <button
                  type="button"
                  onClick={() => setShowGoldenHourModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 15px',
                    background: 'rgba(216, 164, 58, 0.12)',
                    border: '1px solid #d8a43a',
                    borderRadius: '8px',
                    color: '#d8a43a',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Sans', sans-serif"
                  }}
                >
                  <PhoneCall size={14} />
                  <span>1930 GOLDEN HOUR</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDisputeModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 15px',
                  background: '#141414',
                  border: '1px solid #30302d',
                  borderRadius: '8px',
                  color: '#f2f0ea',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                <Mail size={14} color="#3DF5C0" />
                <span>RBI DISPUTE LETTER</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 15px',
                  background: '#141414',
                  border: '1px solid #30302d',
                  borderRadius: '8px',
                  color: '#f2f0ea',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                <FileCheck size={14} color="#3DF5C0" />
                <span>DEPOSIT RECEIPT</span>
              </button>

              <button
                type="button"
                onClick={openDossier}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 15px',
                  background: '#141414',
                  border: '1px solid #30302d',
                  borderRadius: '8px',
                  color: '#f2f0ea',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                <FileText size={14} color="#3DF5C0" />
                <span>FORENSIC DOSSIER</span>
              </button>

              {canExecuteEnforcement && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIssuedNotice(null);
                      setShowFreezeModal(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 15px',
                      background: '#1b120c',
                      border: '1px solid #d8a43a',
                      borderRadius: '8px',
                      color: '#d8a43a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'IBM Plex Sans', sans-serif"
                    }}
                  >
                    <Landmark size={14} />
                    <span>BANK FREEZE</span>
                  </button>

                  <button
                    type="button"
                    onClick={openFIR}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 15px',
                      background: 'rgba(61, 245, 192, 0.08)',
                      border: '1px solid #3DF5C0',
                      borderRadius: '8px',
                      color: '#3DF5C0',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'IBM Plex Sans', sans-serif"
                    }}
                  >
                    <Scale size={14} />
                    <span>DRAFT FIR</span>
                  </button>

                  <button
                    type="button"
                    onClick={openDocket}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 15px',
                      background: '#121212',
                      border: '1px solid #3DF5C0',
                      borderRadius: '8px',
                      color: '#3DF5C0',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'IBM Plex Sans', sans-serif"
                    }}
                  >
                    <FileText size={14} />
                    <span>MAGISTRATE DOCKET</span>
                  </button>

                  <button
                    type="button"
                    onClick={openTelecomModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 15px',
                      background: '#121212',
                      border: '1px solid #4a4a45',
                      borderRadius: '8px',
                      color: '#f2f0ea',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'IBM Plex Sans', sans-serif"
                    }}
                  >
                    <Radio size={14} />
                    <span>SEC 94 REQUISITION</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={openRestitution}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 15px',
                  background: '#16221c',
                  border: '1px solid #2d5543',
                  borderRadius: '8px',
                  color: '#3DF5C0',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                <Scale size={14} />
                <span>SEC 503 RESTITUTION</span>
              </button>
            </div>
          </div>
        </header>

        {/* Case Header Card */}
        <div style={{ 
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          padding: '36px',
          marginBottom: '28px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ 
                  background: '#141414', 
                  padding: '6px 14px', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  color: '#EFEDE8', 
                  fontWeight: 700,
                  border: '1px solid #30302d',
                  fontFamily: "'IBM Plex Mono', monospace" 
                }}>
                  {complaint.complaintId}
                </div>
                <span style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em' }}>
                  OFFICIAL RECORD
                </span>
                {complaint.evidence?.some(e => e.sha256) && (
                  <span style={{ fontSize: '10px', color: '#3DF5C0', background: 'rgba(61, 245, 192, 0.08)', border: '1px solid rgba(61, 245, 192, 0.25)', borderRadius: '6px', padding: '2px 8px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                    SEC 65B SEALED
                  </span>
                )}
                {isFinancialOrScam && (
                  <span style={{ fontSize: '10px', color: '#d8a43a', background: 'rgba(216, 164, 58, 0.08)', border: '1px solid rgba(216, 164, 58, 0.25)', borderRadius: '6px', padding: '2px 8px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                    1930 / RBI ELIGIBLE
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.8rem', color: '#f2f0ea', margin: '0 0 12px 0', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {complaint.title}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#8e8b84', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
                <span>DATE: {format(new Date(complaint.createdAt), 'dd MMM yyyy HH:mm')}</span>
                <span>• CATEGORY: {complaint.category}</span>
                {complaint.source && <span>• SOURCE: {complaint.source.toUpperCase()}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ 
                background: '#141414',
                color: STATUS_COLORS[complaint.status] || '#3DF5C0',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid #30302d',
                fontFamily: "'IBM Plex Sans', sans-serif",
                letterSpacing: '0.06em'
              }}>
                {complaint.status.replace(/_/g,' ').toUpperCase()}
              </div>
              <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                CRITICALITY: <span style={{ color: complaint.severity === 'high' ? '#d96464' : complaint.severity === 'medium' ? '#d8a43a' : '#3DF5C0' }}>{complaint.severity.toUpperCase()}</span>
              </div>
              {complaint.assignedTo && (
                <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  ASSIGNED OFFICER: <span style={{ color: '#EFEDE8' }}>{complaint.assignedTo.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          {/* Incident Details Panel */}
          <div style={{
            background: '#0d0d0d',
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid #30302d'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.12em', margin: 0, fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                INCIDENT BRIEF
              </h4>
              {!complaint.description && (
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#d8a43a', background: '#141414', border: '1px solid #30302d', borderRadius: '8px', padding: '2px 8px', letterSpacing: '0.08em' }}>
                  MASKED
                </span>
              )}
            </div>
            <p style={{ fontSize: '14px', color: '#d8d5ce', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
              {complaint.description || complaint.maskedDescription || 'Content restricted under secure data handling policies.'}
            </p>
          </div>

          {/* Complainant Details */}
          <div style={{
            background: '#0d0d0d',
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid #30302d'
          }}>
            <h4 style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
              COMPLAINANT INFORMATION
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                <span style={{ color: '#8e8b84', fontSize: '13px' }}>Name</span>
                <span style={{ color: '#f2f0ea', fontSize: '13px', fontWeight: 600 }}>{complaint.victimDetails?.name || complaint.userId?.name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                <span style={{ color: '#8e8b84', fontSize: '13px' }}>Phone</span>
                <span style={{ color: '#f2f0ea', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{complaint.victimDetails?.mobile || complaint.userId?.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                <span style={{ color: '#8e8b84', fontSize: '13px' }}>Location / PIN</span>
                <span style={{ color: '#f2f0ea', fontSize: '13px', fontWeight: 600 }}>{complaint.victimDetails?.location || 'N/A'} - {complaint.victimDetails?.pincode || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span style={{ color: '#8e8b84', fontSize: '13px' }}>Disputed Amount</span>
                <span style={{ color: '#3DF5C0', fontSize: '13px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {complaint.victimDetails?.amountLost ? `INR ${complaint.victimDetails.amountLost}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Suspect Details */}
          <div style={{
            background: '#0d0d0d',
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid #30302d'
          }}>
            <h4 style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
              SUSPECT INTELLIGENCE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                <span style={{ color: '#8e8b84', fontSize: '13px' }}>Name / Handle</span>
                <span style={{ color: '#f2f0ea', fontSize: '13px', fontWeight: 600 }}>{complaint.suspectInfo?.name || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#8e8b84', fontSize: '13px' }}>Identified Details</span>
                <span style={{ color: '#d8d5ce', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{complaint.suspectInfo?.details || 'No additional suspect metadata registered.'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence & AI Analysis */}
        {(complaint.evidence?.length > 0 || complaint.mlPrediction || complaint.ocrData?.rawText) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            
            {/* Evidence List with SHA-256 Checksums */}
            {complaint.evidence && complaint.evidence.length > 0 && (
              <div style={{ background: '#0d0d0d', padding: '28px', borderRadius: '24px', border: '1px solid #30302d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.12em', margin: 0, fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                    SECURED EVIDENCE ({complaint.evidence.length})
                  </h4>
                  <span style={{ fontSize: '10px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    SHA-256 LOCKED
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {complaint.evidence.map((file, idx) => (
                    <div
                      key={idx} 
                      style={{ 
                        background: '#141414',
                        border: '1px solid #30302d',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#f2f0ea', fontWeight: 600 }}>
                          {file.originalName || `Evidence_File_${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => downloadEvidence(file)}
                          style={{
                            background: '#0d0d0d',
                            border: '1px solid #30302d',
                            borderRadius: '6px',
                            color: '#EFEDE8',
                            fontSize: '11px',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            fontWeight: 700,
                            padding: '4px 10px',
                            cursor: 'pointer'
                          }}
                        >
                          DOWNLOAD
                        </button>
                      </div>
                      {file.sha256 && (
                        <div style={{ fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>
                          <span style={{ color: '#3DF5C0' }}>SHA256:</span> {file.sha256}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI / ML Data */}
            {(complaint.mlPrediction || complaint.ocrData?.rawText) && (
              <div style={{ background: '#0d0d0d', padding: '28px', borderRadius: '24px', border: '1px solid #30302d' }}>
                <h4 style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                  AI CATEGORIZATION & OCR
                </h4>
                
                {complaint.mlPrediction && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#8e8b84', marginBottom: '8px' }}>Categorization Confidence</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, background: '#141414', height: '6px', borderRadius: '999px', overflow: 'hidden', border: '1px solid #30302d' }}>
                        <div style={{ width: `${Math.round(complaint.mlPrediction.confidence * 100)}%`, background: '#3DF5C0', height: '100%' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {Math.round(complaint.mlPrediction.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {complaint.ocrData?.rawText && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ fontSize: '12px', color: '#8e8b84', fontWeight: 700 }}>OCR EVIDENCE FORENSICS & TRANSACTION ANALYSIS</div>
                      {complaint.ocrData.extracted?.forgeryAnalysis && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontFamily: "'IBM Plex Mono', monospace",
                          background: complaint.ocrData.extracted.forgeryAnalysis.isSuspect ? '#261212' : '#14241e',
                          color: complaint.ocrData.extracted.forgeryAnalysis.isSuspect ? '#d96464' : '#3DF5C0',
                          border: `1px solid ${complaint.ocrData.extracted.forgeryAnalysis.isSuspect ? '#d96464' : '#3DF5C0'}`
                        }}>
                          {complaint.ocrData.extracted.forgeryAnalysis.verdict}
                        </span>
                      )}
                    </div>

                    {/* Extracted Identifiers Strip */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {(complaint.ocrData.extracted?.utrs || []).map((utr, uIdx) => (
                        <div key={uIdx} style={{ background: '#121212', border: '1px solid #3DF5C0', borderRadius: 6, padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#8e8b84' }}>UTR/RRN:</span>
                          <strong style={{ color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>{utr}</strong>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(utr); toast.success('UTR copied'); }}
                            style={{ background: 'transparent', border: 'none', color: '#f2f0ea', cursor: 'pointer', padding: 0 }}
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      ))}
                      {(complaint.ocrData.extracted?.detectedApps || []).map((app, aIdx) => (
                        <span key={aIdx} style={{ background: '#171716', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: 6, padding: '4px 10px', fontSize: '11px' }}>
                          App: <strong>{app}</strong>
                        </span>
                      ))}
                      {(complaint.ocrData.extracted?.amounts || []).map((amt, mIdx) => (
                        <span key={mIdx} style={{ background: '#171716', border: '1px solid #30302d', color: '#3DF5C0', borderRadius: 6, padding: '4px 10px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>
                          Extracted Loss: INR {amt}
                        </span>
                      ))}
                    </div>

                    <div style={{ 
                      background: '#141414',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #30302d',
                      fontSize: '12px',
                      color: '#a6a39b',
                      fontFamily: "'IBM Plex Mono', monospace",
                      maxHeight: '140px',
                      overflowY: 'auto'
                    }}>
                      {complaint.ocrData.rawText}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multi-Layer Financial Mule Trail & Escrow Recovery Ledger */}
        <div style={{
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          padding: '36px',
          marginBottom: '28px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Layers size={16} color="#3DF5C0" />
                <h3 style={{ fontSize: '13px', color: '#3DF5C0', margin: 0, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                  MULTI-LAYER FINANCIAL MULE TRAIL & ESCROW RECOVERY
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#8e8b84', lineHeight: 1.5 }}>
                Real-time tracking of fund dispersion from primary fraudster account across beneficiary layers, frozen accounts, and cash-out points.
              </p>
            </div>

            {isOfficerOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  setHopForm(prev => ({
                    ...prev,
                    hopNumber: ((moneyTrailData.hops?.length || 0) + 1),
                    fromAccountOrUpi: (moneyTrailData.hops && moneyTrailData.hops.length > 0) ? moneyTrailData.hops[moneyTrailData.hops.length - 1].toAccountOrUpi : (complaint.ocrData?.extracted?.accounts?.[0] || 'Complainant Account')
                  }));
                  setShowAddHopModal(true);
                }}
                style={{
                  background: '#16241e',
                  border: '1px solid #3DF5C0',
                  color: '#3DF5C0',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                <Plus size={14} />
                <span>LOG FINANCIAL HOP</span>
              </button>
            )}
          </div>

          {/* Metric Summary Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                REPORTED LOSS
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f2f0ea', marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                INR {(moneyTrailData.summary?.totalDefrauded || complaint.victimDetails?.amountLost || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: '10px', color: '#3DF5C0', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                FROZEN UNDER LIEN
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#3DF5C0', marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                INR {(moneyTrailData.summary?.totalFrozen || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: '10px', color: '#d8a43a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                ESCROW RECOVERY RATIO
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#d8a43a', marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                {moneyTrailData.summary?.recoveryRatio || 0}%
              </div>
            </div>

            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                MULE HOPS LOGGED
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f2f0ea', marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                {moneyTrailData.hops?.length || 0} Layers
              </div>
            </div>
          </div>

          {/* Hops List */}
          {(!moneyTrailData.hops || moneyTrailData.hops.length === 0) ? (
            <div style={{ background: '#121212', border: '1px dashed #30302d', borderRadius: 10, padding: '24px', textAlign: 'center', color: '#8e8b84', fontSize: '13px' }}>
              No intermediate mule hops recorded yet. Direct transfer to primary fraudster account registered.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {moneyTrailData.hops.map((hop, hIdx) => {
                const isFrozen = hop.status === 'FUNDS_SECURED' || hop.status === 'FREEZE_NOTICE_ISSUED';
                const isCashed = hop.status === 'CASHED_OUT_ATM' || hop.status === 'CRYPTO_CONVERTED';
                const statusColor = isFrozen ? '#3DF5C0' : isCashed ? '#d96464' : '#8e8b84';
                const statusBg = isFrozen ? '#14241e' : isCashed ? '#241212' : '#171716';

                return (
                  <div key={hIdx} style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 6, background: '#181818', border: '1px solid #30302d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                        L{hop.hopNumber}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f2f0ea', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{hop.fromAccountOrUpi || 'Victim Account'}</span>
                          <ArrowRight size={14} color="#8e8b84" />
                          <span style={{ color: '#3DF5C0' }}>{hop.toBankName}: {hop.toAccountOrUpi}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#8e8b84', marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {hop.utrOrRef ? 'UTR: ' + hop.utrOrRef + ' • ' : ''}
                          {hop.ifsc ? 'IFSC: ' + hop.ifsc + ' • ' : ''}
                          Logged: {format(new Date(hop.timestamp), 'dd MMM yyyy HH:mm')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                          INR {Number(hop.amount).toLocaleString()}
                        </div>
                        {hop.freezeNoticeRef && (
                          <div style={{ fontSize: '10px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                            Ref: {hop.freezeNoticeRef}
                          </div>
                        )}
                      </div>

                      <span style={{ background: statusBg, border: '1px solid ' + statusColor, color: statusColor, borderRadius: 6, padding: '4px 10px', fontSize: '10px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                        {hop.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CITIZEN RESTITUTION STATUS & ESCROW PIPELINE ── */}
        <div style={{
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          padding: '36px',
          marginBottom: '28px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Scale size={16} color="#3DF5C0" />
                <h3 style={{ fontSize: '13px', color: '#3DF5C0', margin: 0, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                  CITIZEN RESTITUTION PIPELINE & ESCROW RECOVERY
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#8e8b84', lineHeight: 1.5 }}>
                Statutory restitution progression under Section 503 BNSS / 457 CrPC from bank freeze to judicial release and account credit.
              </p>
            </div>

            {canExecuteEnforcement && (
              <button
                type="button"
                onClick={() => {
                  if (restitutionPipelineData) {
                    setMilestoneForm(prev => ({
                      ...prev,
                      courtOrderNumber: restitutionPipelineData.courtOrderNumber || '',
                      settlementUtr: restitutionPipelineData.settlementUtr || '',
                      amountRestored: restitutionPipelineData.amountRestored || '',
                      remittanceBank: restitutionPipelineData.remittanceBank || 'State Bank of India'
                    }));
                  }
                  setShowRestitutionMilestoneModal(true);
                }}
                style={{
                  background: '#16221c',
                  border: '1px solid #2d5543',
                  color: '#3DF5C0',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                <Sparkles size={14} />
                <span>+ UPDATE RESTITUTION STAGE</span>
              </button>
            )}
          </div>

          {/* Stepper Pipeline Progress */}
          <div style={{ background: '#0a0a0a', border: '1px solid #242422', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '11px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                RECOVERY STAGE: <strong style={{ color: '#3DF5C0' }}>{restitutionPipelineData?.currentStageLabel || 'Sec 106 Bank Debit Freeze'}</strong>
              </span>
              <span style={{ fontSize: '12px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                {restitutionPipelineData?.progressPercent || 20}% PIPELINE COMPLETE
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 6, background: '#1c1c1c', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${restitutionPipelineData?.progressPercent || 20}%`, height: '100%', background: '#3DF5C0', transition: 'width 0.4s ease' }} />
            </div>

            {/* Stage Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
              {(restitutionPipelineData?.stages || [
                { id: 'FUNDS_DEBIT_FREEZED', label: '1. Bank Debit Freeze', completed: true },
                { id: 'MAGISTRATE_PETITION_FILED', label: '2. Sec 503 Petition', completed: false },
                { id: 'COURT_RELEASE_ORDERED', label: '3. Magistrate Order', completed: false },
                { id: 'INDEMNITY_BOND_EXECUTED', label: '4. Indemnity Bond', completed: false },
                { id: 'ESCROW_REMITTED_SUCCESSFULLY', label: '5. Escrow Remitted', completed: false }
              ]).map((stg, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    background: stg.completed ? 'rgba(61, 245, 192, 0.08)' : '#121212',
                    border: '1px solid ' + (stg.completed ? '#3DF5C0' : '#262522'),
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: '11px',
                    color: stg.completed ? '#3DF5C0' : '#8e8b84',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  {stg.label}
                </div>
              ))}
            </div>
          </div>

          {/* Restitution Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <span style={{ display: 'block', fontSize: '10px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                TOTAL LOSS CLAIMED
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                INR {(restitutionPipelineData?.totalLost || complaint.victimDetails?.amountLost || 0).toLocaleString()}
              </span>
            </div>

            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <span style={{ display: 'block', fontSize: '10px', color: '#3DF5C0', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                AMOUNT RESTORED / REMITTED
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                INR {(restitutionPipelineData?.amountRestored || 0).toLocaleString()}
              </span>
            </div>

            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <span style={{ display: 'block', fontSize: '10px', color: '#d8a43a', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                RESTITUTION RATIO
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace" }}>
                {restitutionPipelineData?.recoveryPercentage || 0}%
              </span>
            </div>

            <div style={{ background: '#121212', border: '1px solid #262522', borderRadius: 10, padding: '14px 18px' }}>
              <span style={{ display: 'block', fontSize: '10px', color: '#8e8b84', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                BANK SETTLEMENT UTR
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>
                {restitutionPipelineData?.settlementUtr || 'Pending Release'}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ 
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          padding: '36px',
          marginBottom: '28px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5)'
        }}>
          <h3 style={{ fontSize: '12px', color: '#8e8b84', marginBottom: '32px', fontWeight: 700, letterSpacing: '0.12em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
            OFFICIAL AUDIT TIMELINE
          </h3>
          <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
            <div style={{ position: 'absolute', left: 20, top: 12, bottom: 12, width: '1px', background: '#30302d' }} />
            {(complaint.timeline || []).map((t, i) => {
              const isLast = i === (complaint.timeline.length - 1);
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', gap: '24px', marginBottom: '28px', position: 'relative' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    flexShrink: 0,
                    zIndex: 1,
                    background: isLast ? '#3DF5C0' : '#141414',
                    border: `1px solid ${isLast ? '#3DF5C0' : '#3b3b38'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLast ? '#070707' : '#8e8b84',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}>
                    {isLast ? 'OK' : i + 1}
                  </div>
                  <div style={{ paddingTop: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f2f0ea', marginBottom: '4px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {t.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8e8b84', fontWeight: 500, display: 'flex', gap: '8px', fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span>{format(new Date(t.timestamp), 'dd MMM yyyy • HH:mm')}</span>
                      {t.updatedBy && <span>• {t.updatedBy.name} ({t.updatedBy.role})</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Secure Chat */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ 
            background: '#0d0d0d', 
            borderRadius: '16px', 
            border: '1px solid #30302d',
            overflow: 'hidden',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #292927', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
              <h3 style={{ fontSize: '13px', color: '#f2f0ea', fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono', monospace", margin: 0, textTransform: 'uppercase' }}>
                ENCRYPTED OFFICER DISPATCH LINK
              </h3>
            </div>
            <div style={{ padding: '16px' }}>
              <SecureChat complaintId={complaint._id} />
            </div>
          </div>
        </motion.div>

      </main>

      {/* ── MODAL 1: GOLDEN-HOUR CITIZEN RECOVERY PLAYBOOK ── */}
      <AnimatePresence>
        {showGoldenHourModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #d8a43a', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#141009' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={18} color="#d8a43a" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace" }}>
                    GOLDEN HOUR FINANCIAL CRISIS PROTOCOL (0-4 HOURS)
                  </span>
                </div>
                <button type="button" onClick={() => setShowGoldenHourModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', color: '#f2f0ea' }}>
                <div style={{ background: 'rgba(216, 164, 58, 0.08)', border: '1px solid rgba(216, 164, 58, 0.3)', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: '13px', lineHeight: 1.6 }}>
                  <strong style={{ color: '#d8a43a', display: 'block', marginBottom: 4 }}>CRITICAL ACTION TIMEFRAME:</strong>
                  85% of defrauded funds are cashed out via mule accounts within 4 hours. Immediate notification to the National Helpline (1930) and the beneficiary bank is the single highest determinant of recovery.
                </div>

                {/* Priority Hotline */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#8e8b84', marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                    PRIMARY CITIZEN HELPLINE
                  </div>
                  <a href="tel:1930" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#141414', border: '1px solid #3DF5C0', borderRadius: 10, padding: '16px 20px', textDecoration: 'none', color: '#f2f0ea'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(61, 245, 192, 0.1)', display: 'grid', placeItems: 'center', color: '#3DF5C0' }}>
                        <PhoneCall size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800 }}>DIAL 1930 — NATIONAL CYBERCRIME HELPLINE</div>
                        <div style={{ fontSize: '12px', color: '#8e8b84' }}>Citizen Financial Cyber Fraud Reporting System (CFCFRMS)</div>
                      </div>
                    </div>
                    <span style={{ background: '#3DF5C0', color: '#070707', padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: '12px' }}>
                      CALL NOW
                    </span>
                  </a>
                </div>

                {/* Bank Direct Helplines */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#8e8b84', marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                    BANK & PAYMENT GATEWAY 24/7 FRAUD HELPLINES
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                    {BANK_HELPLINES.map((b, i) => (
                      <a key={i} href={`tel:${b.number.replace(/\s/g, '')}`} style={{
                        background: '#121212', border: '1px solid #242422', borderRadius: 8, padding: '12px 14px', textDecoration: 'none', color: '#f2f0ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{b.name}</div>
                          <div style={{ fontSize: '11px', color: '#8e8b84' }}>{b.note}</div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{b.number}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* 4 Steps Checklist */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#8e8b84', marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                    RECOVERY CHECKLIST (FIRST 24 HOURS)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      '1. Call 1930 immediately with Transaction UTR / RRN to initiate real-time freeze across participating banks.',
                      '2. Contact your bank fraud department and demand an immediate lien hold on the transfer.',
                      '3. Request SIM card blocking or replacement if you suspect SIM-swap / lost mobile signal.',
                      '4. Dispatch the formal RBI Zero-Liability Dispute Letter within 3 days to preserve total customer protection.'
                    ].map((step, idx) => (
                      <div key={idx} style={{ background: '#121212', border: '1px solid #242422', borderRadius: 6, padding: '10px 14px', fontSize: '13px', color: '#d8d5ce' }}>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={() => { setShowGoldenHourModal(false); setShowDisputeModal(true); }}
                    style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                    GENERATE RBI DISPUTE LETTER
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: RBI ZERO-LIABILITY BANK DISPUTE LETTER ── */}
      <AnimatePresence>
        {showDisputeModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #30302d', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#121212' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                    FORMAL BANK DISPUTE LETTER (RBI ZERO-LIABILITY MANDATE)
                  </span>
                </div>
                <button type="button" onClick={() => setShowDisputeModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#f2f0ea' }}>
                <p style={{ fontSize: '13px', color: '#8e8b84', margin: '0 0 16px' }}>
                  This statutory dispute letter cites <strong>RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18</strong>. Sending this within 3 days legally establishes Zero Customer Liability for unauthorized third-party electronic fraud.
                </p>

                <pre style={{
                  background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 18,
                  fontSize: '12px', lineHeight: 1.6, color: '#f2f0ea', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: '360px', overflowY: 'auto'
                }}>
                  {generateRBILetterText()}
                </pre>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontSize: '12px', color: '#3DF5C0' }}>
                    Secured Case Reference: {complaint.complaintId}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => {
                      navigator.clipboard.writeText(generateRBILetterText());
                      toast.success('Dispute letter copied to clipboard.');
                    }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Copy size={14} />
                      <span>COPY TEXT</span>
                    </button>

                    <a href={`mailto:?subject=${encodeURIComponent('Urgent Dispute: Unauthorized Electronic Transaction - Ref ' + complaint.complaintId)}&body=${encodeURIComponent(generateRBILetterText())}`}
                      style={{ background: '#3DF5C0', color: '#070707', padding: '10px 18px', borderRadius: 6, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ExternalLink size={14} />
                      <span>OPEN IN MAIL</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: EVIDENCE DEPOSIT RECEIPT (SHA-256) ── */}
      <AnimatePresence>
        {showReceiptModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 740, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #30302d', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#121212' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileCheck size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                    CRYPTOGRAPHIC EVIDENCE DEPOSIT RECEIPT • SEC 65B
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => window.print()} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={13} />
                    <span>PRINT RECEIPT</span>
                  </button>
                  <button type="button" onClick={() => setShowReceiptModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div id="deposit-receipt-print" style={{ flex: 1, overflowY: 'auto', padding: '32px', color: '#f2f0ea' }}>
                <div style={{ borderBottom: '1px solid #30302d', paddingBottom: '20px', marginBottom: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '0.14em', color: '#8e8b84', fontWeight: 700, marginBottom: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                    DIGITAL EVIDENCE REPOSITORY & CHAIN OF CUSTODY
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em', color: '#f2f0ea', textTransform: 'uppercase', marginBottom: 4 }}>
                    CERTIFICATE OF EVIDENCE DEPOSIT
                  </div>
                  <div style={{ fontSize: '12px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    CASE ID: {complaint.complaintId} • TIMESTAMP: {format(new Date(complaint.createdAt), 'dd-MMM-yyyy HH:mm:ss')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20, fontSize: '13px' }}>
                  <div><strong>Depositor:</strong> {complaint.victimDetails?.name || complaint.userId?.name || 'Citizen on Record'}</div>
                  <div><strong>Category:</strong> {complaint.category}</div>
                  <div><strong>Total Exhibits:</strong> {(complaint.evidence || []).length} Verified Files</div>
                  <div><strong>Custody Integrity:</strong> Section 65B Compliant</div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                    DEPOSITED ARTIFACT SHA-256 CHECKSUM MANIFEST:
                  </div>
                  {(complaint.evidence || []).length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#8e8b84', fontStyle: 'italic' }}>No digital files attached to this complaint.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(complaint.evidence || []).map((ev, i) => (
                        <div key={i} style={{ background: '#121212', border: '1px solid #242422', borderRadius: 6, padding: '10px 14px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, color: '#f2f0ea' }}>Exhibit #{i + 1}: {ev.originalName || ev.filename}</span>
                            <span style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>{ev.verifiedMime || ev.mimetype}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>
                            SHA-256: {ev.sha256 || 'SYSTEM_VERIFIED_ON_INTAKE'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #242422', paddingTop: 16, fontSize: '11px', color: '#8e8b84', lineHeight: 1.5 }}>
                  Disclaimer: Admissibility of electronic records under Section 65B of the Indian Evidence Act / Section 63 Bharatiya Sakshya Adhiniyam (BSA) 2023 is subject to judicial discretion upon court inspection. This certificate records automated cryptographic SHA-256 hash capture and evidentiary custody upon intake without making unilateral claims of guaranteed judicial admissibility.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 4: STATUTORY BNS & IT ACT FIR DRAFTER (OFFICERS/ADMINS) ── */}
      <AnimatePresence>
        {showFIRModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 820, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #3DF5C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0c1613' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Scale size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    PROVISIONAL INVESTIGATIVE DRAFT (BNS 2023 / IT ACT 2000)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => window.print()} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={13} />
                    <span>PRINT FIR</span>
                  </button>
                  <button type="button" onClick={() => setShowFIRModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div id="fir-draft-print" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', color: '#f2f0ea' }}>
                {firLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8e8b84' }}>Compiling statutory sections and FIR narrative...</div>
                ) : firDraft ? (
                  <div>
                    {/* Statutory sections tags */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                        AUTOMATICALLY MAPPED STATUTORY CLAUSES:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(firDraft.sections || []).map((sec, i) => (
                          <div key={i} style={{ background: '#121212', border: '1px solid #3DF5C0', borderRadius: 6, padding: '6px 12px', fontSize: '12px' }}>
                            <strong style={{ color: '#3DF5C0' }}>{sec.section}</strong>: {sec.title}
                          </div>
                        ))}
                      </div>
                    </div>

                    <pre style={{
                      background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 18,
                      fontSize: '11px', lineHeight: 1.6, color: '#d8d5ce', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: '360px', overflowY: 'auto'
                    }}>
                      {firDraft.firDraftText}
                    </pre>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(firDraft.firDraftText);
                        toast.success('FIR draft copied to clipboard.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 18px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={14} />
                        <span>COPY FIR NARRATIVE</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#d96464' }}>Failed to load FIR draft.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 5: FORENSIC DOSSIER MODAL (EXISTING) ── */}
      <AnimatePresence>
        {showDossierModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 820, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #30302d', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0e0e0e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                    OFFICIAL FORENSIC CASE DOSSIER • SEC 65B BSA / IEA
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => window.print()} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={13} />
                    <span>PRINT / SAVE PDF</span>
                  </button>
                  <button type="button" onClick={() => setShowDossierModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div id="forensic-dossier-print" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', color: '#f2f0ea' }}>
                <div style={{ borderBottom: '2px solid #30302d', paddingBottom: '20px', marginBottom: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#8e8b84', fontWeight: 700, marginBottom: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                    GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em', color: '#f2f0ea', textTransform: 'uppercase', marginBottom: 6 }}>
                    NATIONAL CYBER CRIME INVESTIGATION DOSSIER
                  </div>
                  <div style={{ fontSize: '12px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    CASE ID: {complaint.complaintId} • GENERATED: {format(new Date(), 'dd-MMM-yyyy HH:mm:ss')} UTC
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24, fontSize: '13px' }}>
                  <div style={{ background: '#121212', padding: 14, borderRadius: 8, border: '1px solid #242422' }}>
                    <div style={{ color: '#8e8b84', fontSize: '11px', fontWeight: 700, marginBottom: 4 }}>INCIDENT CLASSIFICATION</div>
                    <div><strong>Category:</strong> {complaint.category}</div>
                    <div><strong>Severity:</strong> {complaint.severity?.toUpperCase()}</div>
                    <div><strong>Filed At:</strong> {format(new Date(complaint.createdAt), 'dd MMM yyyy, HH:mm')}</div>
                  </div>
                  <div style={{ background: '#121212', padding: 14, borderRadius: 8, border: '1px solid #242422' }}>
                    <div style={{ color: '#8e8b84', fontSize: '11px', fontWeight: 700, marginBottom: 4 }}>INVESTIGATING JURISDICTION</div>
                    <div><strong>Station / Unit:</strong> Cyber Crime Central Cell</div>
                    <div><strong>Assigned Officer:</strong> {complaint.assignedTo?.name || 'Duty Forensics Officer'}</div>
                    <div><strong>Current Status:</strong> {complaint.status?.toUpperCase()}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#8e8b84', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                    I. STATEMENT OF OCCURRENCE / FACTS
                  </div>
                  <div style={{ background: '#121212', border: '1px solid #242422', borderRadius: 8, padding: 16, fontSize: '13px', lineHeight: 1.6, color: '#d8d5ce' }}>
                    {complaint.description || complaint.maskedDescription || 'Details restricted.'}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#8e8b84', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                    II. FORENSIC EVIDENCE MANIFEST & INTEGRITY REGISTER
                  </div>
                  {(complaint.evidence || []).length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#8e8b84', fontStyle: 'italic' }}>No digital files attached to this complaint.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#141414', borderBottom: '1px solid #30302d', color: '#8e8b84', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Item</th>
                          <th style={{ padding: '8px 10px' }}>Filename</th>
                          <th style={{ padding: '8px 10px' }}>Verified MIME</th>
                          <th style={{ padding: '8px 10px' }}>SHA-256 Checksum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(complaint.evidence || []).map((ev, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1e1e1d' }}>
                            <td style={{ padding: '8px 10px', color: '#8e8b84' }}>#{i + 1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{ev.originalName || ev.filename}</td>
                            <td style={{ padding: '8px 10px', fontFamily: "'IBM Plex Mono', monospace" }}>{ev.verifiedMime || ev.mimetype || 'binary'}</td>
                            <td style={{ padding: '8px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#3DF5C0' }}>{ev.sha256 || 'Pending verification'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ background: '#111110', border: '1px solid #30302d', borderRadius: 8, padding: 20, marginBottom: 24 }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#f2f0ea', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                    III. STATUTORY CERTIFICATE UNDER SECTION 65B OF THE EVIDENCE ACT / BHARATIYA SAKSHYA ADHINIYAM (BSA)
                  </div>
                  <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#a6a39b', margin: '0 0 12px 0' }}>
                    I hereby certify that the electronic records, log hashes, and digital artifacts listed in this case dossier were produced by the automated CyberGuard Computer System during regular official operation. Throughout the target period, the integrity of the database, storage volumes, and transit channels was maintained without malfunction, intrusion, or unauthorized alteration. The SHA-256 cryptographic digests recorded herein serve as tamper-proof verification of data integrity.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", paddingTop: 8, borderTop: '1px solid #242422' }}>
                    <span>ELECTRONIC STAMP: SHA256-SYSTEM-VERIFIED</span>
                    <span>AUTHORITY: CYBERGUARD DIGITAL FORENSICS</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#8e8b84', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                    IV. CRYPTOGRAPHIC CHAIN OF CUSTODY LEDGER ({custodyLedger.length} EVENTS)
                  </div>
                  {custodyLoading ? (
                    <div style={{ fontSize: '12px', color: '#8e8b84' }}>Loading ledger...</div>
                  ) : custodyLedger.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#8e8b84', fontStyle: 'italic' }}>Initial custody logged upon database creation.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {custodyLedger.map((c, i) => (
                        <div key={i} style={{ background: '#121212', border: '1px solid #242422', borderRadius: 6, padding: '10px 14px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>{c.action}</span>
                            <span style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>{format(new Date(c.timestamp), 'dd-MMM-yyyy HH:mm:ss')}</span>
                          </div>
                          <div style={{ color: '#d8d5ce', marginBottom: 4 }}>{c.notes || `Action by ${c.role?.toUpperCase()}`}</div>
                          {c.sha256 && (
                            <div style={{ fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>
                              HASH: {c.sha256}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 6: BANK FREEZE MODAL (EXISTING) ── */}
      <AnimatePresence>
        {showFreezeModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #d8a43a', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#120d08' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={18} color="#d8a43a" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace" }}>
                    STATUTORY LIEN NOTICE (SEC 106 BNSS / 91 CRPC)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => setShowNodalDirectory(true)} style={{ background: '#171716', border: '1px solid #30302d', color: '#3DF5C0', borderRadius: 6, padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={13} />
                    <span>NODAL DIRECTORY</span>
                  </button>
                  <button type="button" onClick={() => setShowFreezeModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#f2f0ea' }}>
                {issuedNotice ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#3DF5C0', marginBottom: 16 }}>
                      <CheckCircle size={20} />
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>STATUTORY FREEZE NOTICE ISSUED & HASHED</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8e8b84', marginBottom: 12 }}>
                      Ref: <strong style={{ color: '#f2f0ea' }}>{issuedNotice.noticeNumber}</strong> • SHA256: <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#3DF5C0' }}>{issuedNotice.sha256Digest.slice(0, 16)}...</span>
                    </div>
                    <pre style={{
                      background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 16,
                      fontSize: '11px', color: '#d8d5ce', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: '300px', overflowY: 'auto'
                    }}>
                      {issuedNotice.noticeText}
                    </pre>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(issuedNotice.noticeText);
                        toast.success('Notice copied to clipboard.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 18px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={14} />
                        <span>COPY NOTICE TEXT</span>
                      </button>
                      <a
                        href={`mailto:${freezeForm.nodalEmail || ''}?subject=${encodeURIComponent('URGENT: Statutory Debit-Freeze Notice Sec 106 BNSS - Ref ' + issuedNotice.noticeNumber)}&body=${encodeURIComponent(issuedNotice.noticeText)}`}
                        style={{ background: '#141414', border: '1px solid #3DF5C0', color: '#3DF5C0', padding: '10px 18px', borderRadius: 6, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px' }}
                      >
                        <Mail size={14} />
                        <span>DISPATCH TO NODAL EMAIL</span>
                      </a>
                      <button type="button" onClick={() => setShowFreezeModal(false)} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                        CLOSE & RETURN
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBankFreezeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: '13px', color: '#a6a39b', margin: 0, lineHeight: 1.5 }}>
                      Issue an official debit-freeze mandate to the nodal fraud division of the beneficiary financial institution. This event is logged in the permanent Section 65B custody ledger.
                    </p>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        DESTINATION BANK / INTERMEDIARY *
                      </label>
                      <input type="text" required value={freezeForm.bankName} onChange={e => setFreezeForm({ ...freezeForm, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India / Paytm Payments Bank" style={{ width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '10px 14px', color: '#f2f0ea', fontSize: '13px' }} />
                    </div>

                    {/* Verified Nodal Auto-Suggest Box */}
                    {nodalMatches.length > 0 && (
                      <div style={{ background: '#121212', border: '1px solid #3DF5C0', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', color: '#3DF5C0', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                          VERIFIED NODAL CYBER DESK FOUND:
                        </div>
                        {nodalMatches.map((m, mIdx) => (
                          <div key={mIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: mIdx > 0 ? 8 : 0, borderTop: mIdx > 0 ? '1px solid #242422' : 'none', paddingTop: mIdx > 0 ? 8 : 0 }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f2f0ea' }}>
                                {m.name} ({m.shortName})
                              </div>
                              <div style={{ fontSize: '11px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                                Email: <span style={{ color: '#3DF5C0' }}>{m.nodalEmail}</span> • TAT: {m.turnaroundTime}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFreezeForm(f => ({
                                  ...f,
                                  bankName: m.name,
                                  ifsc: m.ifscPrefixes?.[0] ? `${m.ifscPrefixes[0]}0001001` : f.ifsc,
                                  nodalEmail: m.nodalEmail
                                }));
                                toast.success(`Applied verified liaison for ${m.shortName}`);
                              }}
                              style={{
                                background: '#3DF5C0',
                                color: '#070707',
                                border: 'none',
                                borderRadius: 4,
                                padding: '5px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              APPLY DETAILS
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>SUSPECT ACCOUNT NUMBER</label>
                        <input type="text" value={freezeForm.accountNumber} onChange={e => setFreezeForm({ ...freezeForm, accountNumber: e.target.value })}
                          placeholder="e.g. 30819284910" style={{ width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '10px 14px', color: '#f2f0ea', fontSize: '13px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>IFSC CODE</label>
                        <input type="text" value={freezeForm.ifsc} onChange={e => setFreezeForm({ ...freezeForm, ifsc: e.target.value.toUpperCase() })}
                          placeholder="e.g. SBIN0001234" style={{ width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '10px 14px', color: '#f2f0ea', fontSize: '13px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>SUSPECT UPI VPA HANDLE</label>
                        <input type="text" value={freezeForm.upiId} onChange={e => setFreezeForm({ ...freezeForm, upiId: e.target.value })}
                          placeholder="e.g. suspect99@ybl" style={{ width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '10px 14px', color: '#f2f0ea', fontSize: '13px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>DISPUTED AMOUNT (INR)</label>
                        <input type="number" value={freezeForm.amount} onChange={e => setFreezeForm({ ...freezeForm, amount: e.target.value })}
                          placeholder="e.g. 50000" style={{ width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '10px 14px', color: '#f2f0ea', fontSize: '13px' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>TRANSACTION REFERENCE / UTR NO.</label>
                      <input type="text" value={freezeForm.transactionRef} onChange={e => setFreezeForm({ ...freezeForm, transactionRef: e.target.value })}
                        placeholder="e.g. 402918491029" style={{ width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '10px 14px', color: '#f2f0ea', fontSize: '13px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                      <button type="button" onClick={() => setShowFreezeModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 18px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                        CANCEL
                      </button>
                      <button type="submit" disabled={freezeSubmitting} style={{ background: '#d8a43a', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', opacity: freezeSubmitting ? 0.6 : 1 }}>
                        {freezeSubmitting ? 'GENERATING...' : 'EXECUTE & DISPATCH NOTICE'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ── MODAL 7: VERIFIED BANK & LEA NODAL DIRECTORY ── */}
      <AnimatePresence>
        {showNodalDirectory && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 840, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #30302d', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#121212' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building2 size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                    VERIFIED CYBER CRIME NODAL DIRECTORY & ESCALATION MATRIX
                  </span>
                </div>
                <button type="button" onClick={() => setShowNodalDirectory(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Filters & Search */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0e0e0e', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8e8b84' }} />
                  <input
                    value={nodalSearch}
                    onChange={e => setNodalSearch(e.target.value)}
                    placeholder="Search by bank, gateway, IFSC prefix, or email..."
                    style={{
                      width: '100%',
                      background: '#141414',
                      border: '1px solid #30302d',
                      borderRadius: 6,
                      padding: '8px 14px 8px 36px',
                      color: '#f2f0ea',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: "'IBM Plex Sans', sans-serif"
                    }}
                  />
                </div>
                <select
                  value={nodalCategory}
                  onChange={e => setNodalCategory(e.target.value)}
                  style={{
                    background: '#141414',
                    border: '1px solid #30302d',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#f2f0ea',
                    fontSize: '13px',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="all">ALL CATEGORIES</option>
                  <option value="bank">BANKS</option>
                  <option value="payment_gateway">GATEWAYS & WALLETS</option>
                  <option value="telecom">TELECOM OPERATORS</option>
                  <option value="agency">STATUTORY AGENCIES</option>
                </select>
              </div>

              {/* List of Entries */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {nodalDirectoryList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8e8b84', fontSize: '13px' }}>
                    No institutions match query.
                  </div>
                ) : (
                  nodalDirectoryList.map((inst, idx) => (
                    <div key={idx} style={{
                      background: '#121212',
                      border: '1px solid #242422',
                      borderRadius: 8,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 14
                    }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: '10px', background: '#1c1c1b', border: '1px solid #333330', color: '#3DF5C0', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                            {inst.category.replace('_', ' ')}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#f2f0ea' }}>{inst.name}</strong>
                          {inst.shortName && (
                            <span style={{ fontSize: '12px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                              ({inst.shortName})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 8, fontSize: '12px' }}>
                          <div>
                            <span style={{ color: '#8e8b84' }}>Nodal Liaison: </span>
                            <span style={{ color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>{inst.nodalEmail}</span>
                          </div>
                          <div>
                            <span style={{ color: '#8e8b84' }}>Helpline: </span>
                            <span style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{inst.helpline}</span>
                          </div>
                          <div>
                            <span style={{ color: '#8e8b84' }}>Turnaround: </span>
                            <span style={{ color: '#f2f0ea' }}>{inst.turnaroundTime}</span>
                          </div>
                          {inst.ifscPrefixes?.length > 0 && (
                            <div>
                              <span style={{ color: '#8e8b84' }}>IFSC Prefix: </span>
                              <span style={{ color: '#d8a43a', fontFamily: "'IBM Plex Mono', monospace" }}>{inst.ifscPrefixes.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#68665f', marginTop: 8 }}>
                          {inst.escalationContact}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(inst.nodalEmail);
                            toast.success(`Copied ${inst.shortName} nodal email`);
                          }}
                          style={{
                            background: '#141414',
                            border: '1px solid #30302d',
                            color: '#f2f0ea',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Copy size={12} />
                          <span>COPY EMAIL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFreezeForm(f => ({
                              ...f,
                              bankName: inst.name,
                              ifsc: inst.ifscPrefixes?.[0] ? `${inst.ifscPrefixes[0]}0001001` : f.ifsc,
                              nodalEmail: inst.nodalEmail
                            }));
                            setShowNodalDirectory(false);
                            setShowFreezeModal(true);
                            toast.success(`Selected ${inst.shortName} for freeze mandate`);
                          }}
                          style={{
                            background: '#3DF5C0',
                            border: 'none',
                            color: '#070707',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          USE IN NOTICE
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ── MODAL 8: STATUTORY MAGISTRATE DOCKET (SEC 193 BNSS / 200 CRPC) ── */}
      <AnimatePresence>
        {showDocketModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 840, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #3DF5C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0c1613' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    IN THE COURT OF THE MAGISTRATE • POLICE REPORT (SEC 193 BNSS)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => window.print()} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={13} />
                    <span>PRINT DOCKET</span>
                  </button>
                  <button type="button" onClick={() => setShowDocketModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div id="magistrate-docket-print" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', color: '#f2f0ea' }}>
                {docketLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8e8b84' }}>Compiling statutory court docket and exhibits manifest...</div>
                ) : docketData ? (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8e8b84', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                        PENAL CLAUSES FOR COGNIZANCE:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(docketData.sections || []).map((sec, i) => (
                          <div key={i} style={{ background: '#121212', border: '1px solid #3DF5C0', borderRadius: 6, padding: '6px 12px', fontSize: '12px' }}>
                            <strong style={{ color: '#3DF5C0' }}>{sec.section}</strong>: {sec.title}
                          </div>
                        ))}
                      </div>
                    </div>

                    <pre style={{
                      background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 18,
                      fontSize: '11px', lineHeight: 1.6, color: '#d8d5ce', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: '380px', overflowY: 'auto'
                    }}>
                      {docketData.docketText}
                    </pre>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(docketData.docketText);
                        toast.success('Magistrate Court Docket copied to clipboard.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 18px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={14} />
                        <span>COPY DOCKET TEXT</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#d96464' }}>Failed to compile docket.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 9: STATUTORY TELECOM & INTERMEDIARY REQUISITION (SEC 94 BNSS / SEC 91 CRPC) ── */}
      <AnimatePresence>
        {showTelecomModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #3DF5C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0c1613' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Radio size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    STATUTORY TELECOM & INTERMEDIARY REQUISITION (SEC 94 BNSS)
                  </span>
                </div>
                <button type="button" onClick={() => { setShowTelecomModal(false); setIssuedTelecomNotice(null); }} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#f2f0ea' }}>
                {issuedTelecomNotice ? (
                  <div>
                    <div style={{ background: '#121212', border: '1px solid #3DF5C0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: '11px', color: '#3DF5C0', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                        NOTICE ISSUED: {issuedTelecomNotice.noticeNumber}
                      </div>
                      <div style={{ fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
                        SHA-256 HASH: {issuedTelecomNotice.sha256Digest}
                      </div>
                    </div>
                    <pre style={{ background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 16, fontSize: '11px', lineHeight: 1.6, color: '#d8d5ce', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: 360, overflowY: 'auto' }}>
                      {issuedTelecomNotice.noticeText}
                    </pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(issuedTelecomNotice.noticeText);
                        toast.success('Notice copied to clipboard.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={13} />
                        <span>COPY NOTICE</span>
                      </button>
                      <button type="button" onClick={() => window.print()} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Printer size={13} />
                        <span>PRINT DIRECTIVE</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTelecomSubmit}>
                    <p style={{ fontSize: '13px', color: '#8e8b84', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                      Issue an official statutory directive under Section 94 BNSS / Section 91 CrPC and Section 79(3)(b) IT Act compelling Telecom Providers or Digital Intermediaries to produce CDRs, IPDRs, or subscriber records within 24 hours.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          TARGET PROVIDER / INTERMEDIARY *
                        </label>
                        <select
                          value={telecomForm.targetProvider}
                          onChange={e => setTelecomForm({ ...telecomForm, targetProvider: e.target.value })}
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        >
                          <option value="Airtel">Bharti Airtel Ltd (Airtel)</option>
                          <option value="Jio">Reliance Jio Infocomm Ltd</option>
                          <option value="Vi">Vodafone Idea Ltd (Vi)</option>
                          <option value="BSNL">Bharat Sanchar Nigam Ltd (BSNL)</option>
                          <option value="WhatsApp / Meta">WhatsApp LLC / Meta Platforms</option>
                          <option value="Google">Google LLC (Gmail / Drive / Android)</option>
                          <option value="Telegram">Telegram Messenger FZ-LLC</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          REQUISITION CLASS *
                        </label>
                        <select
                          value={telecomForm.requisitionType}
                          onChange={e => setTelecomForm({ ...telecomForm, requisitionType: e.target.value })}
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        >
                          <option value="CDR">CDR (Call Detail Records + Cell Tower IDs)</option>
                          <option value="IPDR">IPDR (IP Session Logs + Port Translation)</option>
                          <option value="CAF">CAF (Customer Acquisition Form + Photo KYC)</option>
                          <option value="TOWER_DUMP">Cellular Tower Dump in Crime Perimeter</option>
                          <option value="SESSION_PRESERVATION">Intermediary Account & Session Preservation</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        TARGET MSISDN / PHONE / EMAIL / IP ADDRESS *
                      </label>
                      <input
                        type="text"
                        value={telecomForm.targetIdentifier}
                        onChange={e => setTelecomForm({ ...telecomForm, targetIdentifier: e.target.value })}
                        placeholder="e.g. +91 98450 12345 or suspect@gmail.com or 157.240.22.35"
                        style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        SURVEILLANCE WINDOW / TIME FRAME
                      </label>
                      <input
                        type="text"
                        value={telecomForm.targetTimeWindow}
                        onChange={e => setTelecomForm({ ...telecomForm, targetTimeWindow: e.target.value })}
                        placeholder="e.g. 2026-10-01 00:00 to 2026-10-25 23:59"
                        style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        OFFICIAL ALLEGATION BRIEF (FOR STATUTORY RECORD)
                      </label>
                      <textarea
                        rows={3}
                        value={telecomForm.allegationBrief}
                        onChange={e => setTelecomForm({ ...telecomForm, allegationBrief: e.target.value })}
                        placeholder="Brief facts connecting this identifier to the electronic crime under investigation..."
                        style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button type="button" onClick={() => setShowTelecomModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        CANCEL
                      </button>
                      <button type="submit" disabled={telecomSubmitting} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        {telecomSubmitting ? 'GENERATING...' : 'DISPATCH SEC 94 REQUISITION'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 10: CITIZEN LOSS RESTITUTION COURT PETITION (SEC 503 BNSS / 457 CRPC) ── */}
      <AnimatePresence>
        {showRestitutionModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 840, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #3DF5C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0c1613' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Scale size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    COURT APPLICATION FOR RELEASE OF FROZEN FUNDS (SEC 503 BNSS)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => window.print()} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={13} />
                    <span>PRINT PETITION</span>
                  </button>
                  <button type="button" onClick={() => setShowRestitutionModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#f2f0ea' }}>
                {restitutionLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8e8b84' }}>Compiling Section 503 BNSS Restitution Application...</div>
                ) : restitutionData ? (
                  <div>
                    <div style={{ background: '#121212', border: '1px solid #3DF5C0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                      <div style={{ fontSize: '12px', color: '#3DF5C0', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                        PETITION NUMBER: {restitutionData.petitionNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8e8b84', marginTop: 4 }}>
                        Claimed Defrauded Amount: <strong>INR {Number(restitutionData.amountClaimed).toLocaleString()}</strong> • Target Frozen Account: <strong>{restitutionData.suspectAccount}</strong>
                      </div>
                    </div>

                    <pre style={{ background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 16, fontSize: '11px', lineHeight: 1.6, color: '#d8d5ce', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: 380, overflowY: 'auto' }}>
                      {restitutionData.petitionText}
                    </pre>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(restitutionData.petitionText);
                        toast.success('Restitution Petition copied to clipboard.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 18px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={14} />
                        <span>COPY PETITION TEXT</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#d96464' }}>Failed to compile petition.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 11: LOG FINANCIAL MULE HOP ── */}
      <AnimatePresence>
        {showAddHopModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 600, background: '#0a0a0a', border: '1px solid #3DF5C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0c1613' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Layers size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    LOG FINANCIAL DISPERSION HOP (LAYER {hopForm.hopNumber})
                  </span>
                </div>
                <button type="button" onClick={() => setShowAddHopModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddHopSubmit} style={{ padding: '24px 28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6 }}>FROM ACCOUNT / UPI</label>
                    <input type="text" value={hopForm.fromAccountOrUpi} onChange={e => setHopForm({ ...hopForm, fromAccountOrUpi: e.target.value })} placeholder="Source Account/UPI" style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '8px 12px', color: '#f2f0ea', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6 }}>DESTINATION BANK NAME *</label>
                    <input type="text" required value={hopForm.toBankName} onChange={e => setHopForm({ ...hopForm, toBankName: e.target.value })} placeholder="e.g. State Bank of India" style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '8px 12px', color: '#f2f0ea', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6 }}>BENEFICIARY ACCOUNT / UPI *</label>
                    <input type="text" required value={hopForm.toAccountOrUpi} onChange={e => setHopForm({ ...hopForm, toAccountOrUpi: e.target.value })} placeholder="Mule Account Number or VPA" style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '8px 12px', color: '#f2f0ea', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6 }}>TRANSFER AMOUNT (INR) *</label>
                    <input type="number" required value={hopForm.amount} onChange={e => setHopForm({ ...hopForm, amount: e.target.value })} placeholder="Amount in INR" style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '8px 12px', color: '#f2f0ea', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6 }}>TRANSACTION UTR / RRN</label>
                    <input type="text" value={hopForm.utrOrRef} onChange={e => setHopForm({ ...hopForm, utrOrRef: e.target.value })} placeholder="12-digit UTR/RRN" style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '8px 12px', color: '#f2f0ea', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6 }}>CURRENT STATUS</label>
                    <select value={hopForm.status} onChange={e => setHopForm({ ...hopForm, status: e.target.value })} style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '8px 12px', color: '#f2f0ea', fontSize: '13px' }}>
                      <option value="TRANSFER_RECORDED">TRANSFER RECORDED (UNSECURED)</option>
                      <option value="FREEZE_NOTICE_ISSUED">SEC 106 FREEZE NOTICE ISSUED</option>
                      <option value="FUNDS_SECURED">FUNDS SECURED (BANK CONFIRMED)</option>
                      <option value="CASHED_OUT_ATM">CASHED OUT VIA ATM</option>
                      <option value="CRYPTO_CONVERTED">CONVERTED TO CRYPTO</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6 }}>FREEZE NOTICE REF / INVESTIGATION NOTES</label>
                  <input type="text" value={hopForm.freezeNoticeRef} onChange={e => setHopForm({ ...hopForm, freezeNoticeRef: e.target.value })} placeholder="e.g. SEC106/FREEZE/2026/18291" style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '8px 12px', color: '#f2f0ea', fontSize: '13px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={() => setShowAddHopModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    CANCEL
                  </button>
                  <button type="submit" disabled={hopSubmitting} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    {hopSubmitting ? 'LOGGING...' : 'COMMIT FINANCIAL HOP'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 12: PRIORITY ZERO (P0) EMERGENCY TAKEDOWN DIRECTIVE (SEC 79(3)(b) IT ACT) ── */}
      <AnimatePresence>
        {showTakedownModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #d96464', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#1c0e0e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={18} color="#d96464" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#d96464', fontFamily: "'IBM Plex Mono', monospace" }}>
                    PRIORITY ZERO (P0) EMERGENCY TAKEDOWN DIRECTIVE (RULE 3(2)(b) IT RULES)
                  </span>
                </div>
                <button type="button" onClick={() => { setShowTakedownModal(false); setIssuedTakedownNotice(null); }} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#f2f0ea' }}>
                {issuedTakedownNotice ? (
                  <div>
                    <div style={{ background: '#1c1010', border: '1px solid #d96464', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: '12px', color: '#d96464', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                        STATUTORY TAKEDOWN DIRECTIVE ISSUED: {issuedTakedownNotice.noticeNumber}
                      </div>
                      <div style={{ fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
                        SHA-256 HASH: {issuedTakedownNotice.sha256Digest}
                      </div>
                    </div>

                    <pre style={{ background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 16, fontSize: '11px', lineHeight: 1.6, color: '#d8d5ce', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: 360, overflowY: 'auto' }}>
                      {issuedTakedownNotice.noticeText}
                    </pre>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(issuedTakedownNotice.noticeText);
                        toast.success('Takedown directive copied to clipboard.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={13} />
                        <span>COPY DIRECTIVE</span>
                      </button>
                      <button type="button" onClick={() => window.print()} style={{ background: '#d96464', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Printer size={13} />
                        <span>PRINT DIRECTIVE</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTakedownSubmit}>
                    <div style={{ background: '#1c1210', border: '1px solid #4a2820', borderRadius: 8, padding: '14px 18px', marginBottom: 20, fontSize: '12px', color: '#d8a43a', lineHeight: 1.5 }}>
                      <strong>CRITICAL STATUTORY TIMEFRAME:</strong> Under Rule 3(2)(b) of the Information Technology Rules 2021, digital intermediaries are legally mandated to remove or disable access to non-consensual nudity, sexual acts, or morphed impersonation within <strong>24 hours</strong> of notice.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          TARGET PLATFORM / INTERMEDIARY *
                        </label>
                        <select
                          value={takedownForm.targetPlatform}
                          onChange={e => setTakedownForm({ ...takedownForm, targetPlatform: e.target.value })}
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        >
                          <option value="Instagram / Meta">Instagram / Meta Platforms</option>
                          <option value="WhatsApp / Meta">WhatsApp LLC / Meta</option>
                          <option value="Telegram">Telegram Messenger FZ-LLC</option>
                          <option value="X (Twitter)">X Corp (Twitter)</option>
                          <option value="Google">Google LLC (YouTube / Drive / Blogger)</option>
                          <option value="Reddit">Reddit Inc</option>
                          <option value="Adult Web Hosting / Other">Adult Web Hosting / Third-Party CMS</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          OFFENCE CLASSIFIER *
                        </label>
                        <select
                          value={takedownForm.offenceCategory}
                          onChange={e => setTakedownForm({ ...takedownForm, offenceCategory: e.target.value })}
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        >
                          <option value="Non-Consensual Intimate Imagery (NCII)">Non-Consensual Intimate Imagery (NCII)</option>
                          <option value="Sextortion / Video Call Coercion">Sextortion / Video Call Coercion</option>
                          <option value="Identity Theft / Morphed Media">Identity Theft / Morphed Media (Deepfakes)</option>
                          <option value="Child Sexual Abuse Material (CSAM)">Child Sexual Abuse Material (CSAM)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        CONTENT URLS / PERMALINKS / PROFILES (ONE PER LINE)
                      </label>
                      <textarea
                        rows={3}
                        value={takedownForm.contentUrls}
                        onChange={e => setTakedownForm({ ...takedownForm, contentUrls: e.target.value })}
                        placeholder="https://instagram.com/p/... or @suspect_handle or direct image URL"
                        style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button type="button" onClick={() => setShowTakedownModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        CANCEL
                      </button>
                      <button type="submit" disabled={takedownSubmitting} style={{ background: '#d96464', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        {takedownSubmitting ? 'ISSUING...' : 'DISPATCH 24H TAKEDOWN DIRECTIVE'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 13: ZERO FIR JURISDICTIONAL TRANSFER (SEC 173(1) BNSS) ── */}
      <AnimatePresence>
        {showZeroFIRModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', background: '#0a0a0a', border: '1px solid #3DF5C0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #242422', background: '#0c1613' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ArrowRight size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    ZERO FIR INTER-AGENCY JURISDICTIONAL TRANSFER (SEC 173(1) BNSS)
                  </span>
                </div>
                <button type="button" onClick={() => { setShowZeroFIRModal(false); setZeroFIRData(null); }} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#f2f0ea' }}>
                {zeroFIRData ? (
                  <div>
                    <div style={{ background: '#121212', border: '1px solid #3DF5C0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                      <div style={{ fontSize: '12px', color: '#3DF5C0', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                        TRANSFER MEMORANDUM REF: {zeroFIRData.transferRef}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8e8b84', marginTop: 4 }}>
                        Transferee Police Command: <strong>{zeroFIRData.destinationPoliceStation} ({zeroFIRData.destinationDistrict})</strong>
                      </div>
                    </div>

                    <pre style={{ background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: 16, fontSize: '11px', lineHeight: 1.6, color: '#d8d5ce', whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Mono', monospace", maxHeight: 380, overflowY: 'auto' }}>
                      {zeroFIRData.transferDocketText}
                    </pre>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(zeroFIRData.transferDocketText);
                        toast.success('Zero FIR Transfer Memo copied to clipboard.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Copy size={13} />
                        <span>COPY MEMO</span>
                      </button>
                      <button type="button" onClick={() => window.print()} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Printer size={13} />
                        <span>PRINT TRANSFER PACKAGE</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleZeroFIRSubmit}>
                    <p style={{ fontSize: '13px', color: '#8e8b84', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                      Compile an official inter-agency transfer package under Section 173(1) BNSS transmitting this Zero FIR, Section 65B electronic exhibits, and bank freeze notices to the territorial police station where the cyber syndicate operates.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          DESTINATION POLICE STATION *
                        </label>
                        <input
                          type="text"
                          required
                          value={zeroFIRForm.destinationPoliceStation}
                          onChange={e => setZeroFIRForm({ ...zeroFIRForm, destinationPoliceStation: e.target.value })}
                          placeholder="e.g. Mewat Cyber Crime Police Station"
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          DESTINATION DISTRICT / STATE *
                        </label>
                        <input
                          type="text"
                          required
                          value={zeroFIRForm.destinationDistrict}
                          onChange={e => setZeroFIRForm({ ...zeroFIRForm, destinationDistrict: e.target.value })}
                          placeholder="e.g. Nuh District, Haryana"
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                      <button type="button" onClick={() => setShowZeroFIRModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        CANCEL
                      </button>
                      <button type="submit" disabled={zeroFIRSubmitting} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        {zeroFIRSubmitting ? 'COMPILING...' : 'GENERATE ZERO FIR TRANSFER'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      {/* ── MODAL 14: SECTION 65B / SECTION 63 BSA SWORN AFFIDAVIT BUILDER ── */}
      <AnimatePresence>
        {showSection65BModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{
                width: '100%',
                maxWidth: '740px',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#0d0d0d',
                border: '1px solid #30302d',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #242422', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Scale size={20} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    SECTION 63(4) BSA / SEC 65B ELECTRONIC EVIDENCE CERTIFICATE DRAFT
                  </span>
                </div>
                <button type="button" onClick={() => { setShowSection65BModal(false); setIssuedAffidavit(null); }} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div>
                {issuedAffidavit ? (
                  <div>
                    <div style={{ background: 'rgba(61, 245, 192, 0.06)', border: '1px solid #3DF5C0', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '11px', color: '#3DF5C0', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                          AFFIDAVIT CERTIFICATE NUMBER: {issuedAffidavit.certificateNumber}
                        </span>
                        <span style={{ fontSize: '10px', color: '#070707', background: '#3DF5C0', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                          IMMUTABLY SEALED
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#a8a59d', fontFamily: "'IBM Plex Mono', monospace", margin: 0, wordBreak: 'break-all' }}>
                        SHA-256 INTEGRITY DIGEST: {issuedAffidavit.sha256Digest}
                      </p>
                    </div>

                    <pre style={{
                      background: '#070707',
                      border: '1px solid #242422',
                      borderRadius: 8,
                      padding: 20,
                      color: '#d4d0c7',
                      fontSize: '11px',
                      lineHeight: 1.6,
                      fontFamily: "'IBM Plex Mono', monospace",
                      whiteSpace: 'pre-wrap',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      marginBottom: 20
                    }}>
                      {issuedAffidavit.affidavitText}
                    </pre>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button type="button" onClick={() => {
                        navigator.clipboard.writeText(issuedAffidavit.affidavitText);
                        toast.success('Section 65B Affidavit text copied.');
                      }} style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Copy size={14} />
                        <span>COPY COURT AFFIDAVIT</span>
                      </button>
                      <button type="button" onClick={() => window.print()} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 22px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        PRINT LEGAL CERTIFICATE
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAffidavitSubmit}>
                    <p style={{ fontSize: '13px', color: '#8e8b84', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                      Under Indian Evidence Jurisprudence (*Anvar P.V.* & *Arjun Panditrao Khotkar*), electronic evidence produced from a computer or mobile terminal requires a statutory certificate under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 65B) certifying device custody, continuous operation, and SHA-256 exhibit hashes. This tool compiles an operational draft for execution by the lawful custodian.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          DEPONENT FULL NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={affidavitForm.deponentName}
                          onChange={e => setAffidavitForm({ ...affidavitForm, deponentName: e.target.value })}
                          placeholder="e.g. Vikram Malhotra"
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          DEPONENT OFFICIAL DESIGNATION / ROLE *
                        </label>
                        <input
                          type="text"
                          required
                          value={affidavitForm.deponentDesignation}
                          onChange={e => setAffidavitForm({ ...affidavitForm, deponentDesignation: e.target.value })}
                          placeholder="e.g. Complainant & Lawful Device Custodian"
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                        DEPONENT RESIDENTIAL / OFFICIAL ADDRESS
                      </label>
                      <input
                        type="text"
                        value={affidavitForm.deponentAddress}
                        onChange={e => setAffidavitForm({ ...affidavitForm, deponentAddress: e.target.value })}
                        placeholder="e.g. #42, 100 Feet Road, Indiranagar, Bengaluru, Karnataka - 560038"
                        style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          DEVICE MAKE & MODEL
                        </label>
                        <input
                          type="text"
                          value={affidavitForm.deviceMakeModel}
                          onChange={e => setAffidavitForm({ ...affidavitForm, deviceMakeModel: e.target.value })}
                          placeholder="e.g. Apple iPhone 15 Pro Max"
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          OPERATING SYSTEM / BUILD
                        </label>
                        <input
                          type="text"
                          value={affidavitForm.osVersion}
                          onChange={e => setAffidavitForm({ ...affidavitForm, osVersion: e.target.value })}
                          placeholder="e.g. iOS 18.1 / Android 14"
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                          UNIQUE IDENTIFIER (IMEI / MAC)
                        </label>
                        <input
                          type="text"
                          value={affidavitForm.deviceIdentifier}
                          onChange={e => setAffidavitForm({ ...affidavitForm, deviceIdentifier: e.target.value })}
                          placeholder="e.g. IMEI: 358912345678901"
                          style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                        ATTACHED EVIDENCE EXHIBITS FOR COURT CERTIFICATION ({(complaint.evidence || []).length} DETECTED)
                      </label>
                      <div style={{ background: '#0a0a0a', border: '1px solid #242422', borderRadius: 8, padding: 12, maxHeight: '140px', overflowY: 'auto' }}>
                        {(complaint.evidence && complaint.evidence.length > 0) ? (
                          complaint.evidence.map((ev, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < complaint.evidence.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                              <input
                                type="checkbox"
                                checked={affidavitForm.selectedExhibitHashes.includes(ev.sha256)}
                                onChange={e => {
                                  const list = e.target.checked
                                    ? [...affidavitForm.selectedExhibitHashes, ev.sha256]
                                    : affidavitForm.selectedExhibitHashes.filter(h => h !== ev.sha256);
                                  setAffidavitForm({ ...affidavitForm, selectedExhibitHashes: list });
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '12px', color: '#f2f0ea', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ev.originalName || ev.filename}
                                </p>
                                <span style={{ fontSize: '10px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                                  SHA-256: {ev.sha256 ? ev.sha256.substring(0, 24) + '...' : 'Recorded at intake'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '12px', color: '#8e8b84', margin: 0 }}>No separate evidence files attached; master incident narrative will be certified.</p>
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#121212', border: '1px solid #242422', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                      <p style={{ fontSize: '11px', color: '#a8a59d', margin: 0, lineHeight: 1.5 }}>
                        <strong>Draft Certificate Notice:</strong> Generating this certificate records the operational custody metadata under Section 63(4) Bharatiya Sakshya Adhiniyam 2023 & Section 65B(4) IEA 1872 for judicial inspection. Final admissibility is subject to formal execution by the deponent under oath.
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button type="button" onClick={() => setShowSection65BModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        CANCEL
                      </button>
                      <button type="submit" disabled={affidavitSubmitting} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 22px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                        {affidavitSubmitting ? 'GENERATING CERTIFICATE...' : 'GENERATE CERTIFICATE DRAFT'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── MODAL 15: UPDATE CITIZEN RESTITUTION MILESTONE ── */}
      <AnimatePresence>
        {showRestitutionMilestoneModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{
                width: '100%',
                maxWidth: '600px',
                background: '#0d0d0d',
                border: '1px solid #30302d',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #242422', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Scale size={18} color="#3DF5C0" />
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>
                    UPDATE RESTITUTION ESCROW MILESTONE
                  </span>
                </div>
                <button type="button" onClick={() => setShowRestitutionMilestoneModal(false)} style={{ background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleMilestoneSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                    RESTITUTION PIPELINE STAGE *
                  </label>
                  <select
                    value={milestoneForm.stage}
                    onChange={e => setMilestoneForm({ ...milestoneForm, stage: e.target.value })}
                    style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <option value="FUNDS_DEBIT_FREEZED">1. Sec 106 Bank Debit Freeze Acknowledged</option>
                    <option value="MAGISTRATE_PETITION_FILED">2. Sec 503 Court Petition Filed</option>
                    <option value="COURT_RELEASE_ORDERED">3. Magistrate Release Ordered</option>
                    <option value="INDEMNITY_BOND_EXECUTED">4. Complainant Indemnity Bond Executed</option>
                    <option value="ESCROW_REMITTED_SUCCESSFULLY">5. Escrow Remitted Successfully to Account</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                      COURT ORDER NUMBER (IF ORDERED)
                    </label>
                    <input
                      type="text"
                      value={milestoneForm.courtOrderNumber}
                      onChange={e => setMilestoneForm({ ...milestoneForm, courtOrderNumber: e.target.value })}
                      placeholder="e.g. CJM/BLR/CRIM/492/2026"
                      style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                      AMOUNT RESTORED (INR)
                    </label>
                    <input
                      type="number"
                      value={milestoneForm.amountRestored}
                      onChange={e => setMilestoneForm({ ...milestoneForm, amountRestored: e.target.value })}
                      placeholder="e.g. 85000"
                      style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                      BANK SETTLEMENT UTR
                    </label>
                    <input
                      type="text"
                      value={milestoneForm.settlementUtr}
                      onChange={e => setMilestoneForm({ ...milestoneForm, settlementUtr: e.target.value })}
                      placeholder="e.g. HDFCR5202611029182"
                      style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                      REMITTANCE BANK
                    </label>
                    <input
                      type="text"
                      value={milestoneForm.remittanceBank}
                      onChange={e => setMilestoneForm({ ...milestoneForm, remittanceBank: e.target.value })}
                      placeholder="e.g. HDFC Bank Ltd"
                      style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8e8b84', fontWeight: 700, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                    OPERATIONAL NOTES / PROCEEDINGS SUMMARY
                  </label>
                  <input
                    type="text"
                    value={milestoneForm.notes}
                    onChange={e => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                    placeholder="e.g. RTGS settlement verified from recipient escrow account."
                    style={{ width: '100%', background: '#121212', border: '1px solid #30302d', borderRadius: 8, padding: '10px 12px', color: '#f2f0ea', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" onClick={() => setShowRestitutionMilestoneModal(false)} style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    CANCEL
                  </button>
                  <button type="submit" disabled={milestoneSubmitting} style={{ background: '#3DF5C0', border: 'none', color: '#070707', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    {milestoneSubmitting ? 'RECORDING...' : 'COMMIT MILESTONE UNDER SEAL'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
