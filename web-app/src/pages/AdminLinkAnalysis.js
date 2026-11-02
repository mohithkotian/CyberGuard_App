import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import {
  Network,
  Phone,
  CreditCard,
  Landmark,
  ShieldAlert,
  Search,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Hash,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  FileText,
  Radio,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  X,
  Shield,
  Building,
  Layers,
  Send,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'surges', label: 'Surge Velocity Alerts', icon: AlertTriangle, color: '#d96464' },
  { id: 'graph', label: 'Interactive Network Graph', icon: Network, color: '#3DF5C0' },
  { id: 'dockets', label: 'Syndicate Dockets (Sec 111 BNS)', icon: FileText, color: '#3DF5C0' },
  { id: 'phones', label: 'Cross-Case Phones', icon: Phone, color: '#d96464' },
  { id: 'upis', label: 'Suspect UPI Links', icon: CreditCard, color: '#d8a43a' },
  { id: 'accounts', label: 'Bank Account Networks', icon: Landmark, color: '#38bdf8' },
];

export default function AdminLinkAnalysis() {
  const [data, setData] = useState({
    links: { phones: [], upis: [], accounts: [] },
    syndicateGraph: { nodes: [], edges: [], totalClusters: 0 },
    syndicates: []
  });
  const [surgeData, setSurgeData] = useState({
    surgeAlerts: [],
    summary: { totalActiveSurges: 0, criticalCount: 0, highVelocityCount: 0, crossJurisdictionCount: 0, totalFinancialRisk: 0 }
  });
  const [dockets, setDockets] = useState([]);
  const [telecomReqs, setTelecomReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('surges');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [graphFilter, setGraphFilter] = useState('all'); // all, phone, upi, bank, case
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Modal States
  const [docketModal, setDocketModal] = useState({
    isOpen: false,
    syndicateId: '',
    complaintIds: [],
    leadAgency: 'Central Bureau of Investigation (CBI) Cyber Wing',
    notes: '',
    createdDocket: null
  });

  const [telecomModal, setTelecomModal] = useState({
    isOpen: false,
    phone: '',
    imei: '',
    complaintIds: [],
    carrier: '',
    reason: 'Active involvement in organized cyber fraud and extortion calls',
    createdRequisition: null
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [linkRes, surgeRes, docketsRes, telecomRes] = await Promise.allSettled([
        analyticsAPI.linkAnalysis(),
        analyticsAPI.syndicateSurges(),
        analyticsAPI.getSyndicateDockets(),
        analyticsAPI.getTelecomRequisitions()
      ]);

      if (linkRes.status === 'fulfilled' && linkRes.value.data?.data) {
        setData(linkRes.value.data.data);
      }
      if (surgeRes.status === 'fulfilled' && surgeRes.value.data?.data) {
        setSurgeData(surgeRes.value.data.data);
      }
      if (docketsRes.status === 'fulfilled' && docketsRes.value.data?.data) {
        setDockets(docketsRes.value.data.data);
      }
      if (telecomRes.status === 'fulfilled' && telecomRes.value.data?.data) {
        setTelecomReqs(telecomRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load link analysis:', err);
      toast.error('Failed to retrieve live syndicate link data.');
    } finally {
      setLoading(false);
    }
  };

  const { links, syndicateGraph, syndicates } = data;
  const { surgeAlerts, summary: surgeSummary } = surgeData;

  // Filtered links
  const filteredPhones = useMemo(() => {
    return (links?.phones || []).filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return item._id.toLowerCase().includes(q) || (item.cases || []).some(c => c.id.toLowerCase().includes(q) || (c.title && c.title.toLowerCase().includes(q)));
    });
  }, [links?.phones, searchQuery]);

  const filteredUpis = useMemo(() => {
    return (links?.upis || []).filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return item._id.toLowerCase().includes(q) || (item.cases || []).some(c => c.id.toLowerCase().includes(q) || (c.title && c.title.toLowerCase().includes(q)));
    });
  }, [links?.upis, searchQuery]);

  const filteredAccounts = useMemo(() => {
    return (links?.accounts || []).filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return item._id.toLowerCase().includes(q) || (item.cases || []).some(c => c.id.toLowerCase().includes(q) || (c.title && c.title.toLowerCase().includes(q)));
    });
  }, [links?.accounts, searchQuery]);

  const filteredSurgeAlerts = useMemo(() => {
    return (surgeAlerts || []).filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.identifier.toLowerCase().includes(q) ||
        item.alertId.toLowerCase().includes(q) ||
        (item.jurisdictions || []).some(j => j.toLowerCase().includes(q)) ||
        (item.cases || []).some(c => c.id.toLowerCase().includes(q) || (c.title && c.title.toLowerCase().includes(q)))
      );
    });
  }, [surgeAlerts, searchQuery]);

  const filteredDockets = useMemo(() => {
    return (dockets || []).filter(d => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.docketId.toLowerCase().includes(q) ||
        d.syndicateId.toLowerCase().includes(q) ||
        d.leadAgency.toLowerCase().includes(q) ||
        (d.jurisdictions || []).some(j => j.toLowerCase().includes(q))
      );
    });
  }, [dockets, searchQuery]);

  const totalLinkedCases = useMemo(() => {
    const caseIds = new Set();
    [...(links?.phones || []), ...(links?.upis || []), ...(links?.accounts || [])].forEach(item => {
      (item.cases || []).forEach(cs => caseIds.add(cs.id));
    });
    return caseIds.size;
  }, [links]);

  // Selected Graph Node & Related Information
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return (syndicateGraph?.nodes || []).find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, syndicateGraph?.nodes]);

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return (syndicateGraph?.edges || []).filter(
      e => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [selectedNodeId, syndicateGraph?.edges]);

  // Filtered graph nodes based on filter pill
  const visibleGraphNodes = useMemo(() => {
    const allNodes = syndicateGraph?.nodes || [];
    if (graphFilter === 'all') return allNodes;
    return allNodes.filter(n => n.type === graphFilter);
  }, [syndicateGraph?.nodes, graphFilter]);

  const visibleGraphEdges = useMemo(() => {
    const allEdges = syndicateGraph?.edges || [];
    const visibleIds = new Set(visibleGraphNodes.map(n => n.id));
    return allEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [syndicateGraph?.edges, visibleGraphNodes]);

  // Copy coordination brief
  const copyBrief = (alert) => {
    const brief = [
      '================================================================================',
      `CYBERGUARD INTER-JURISDICTIONAL TASK FORCE COORDINATION BRIEF`,
      `ALERT REFERENCE: ${alert.alertId} | LEVEL: ${alert.severity}`,
      '================================================================================',
      `ILLICIT IDENTIFIER: ${alert.identifier} (${alert.identifierType.toUpperCase()})`,
      `TOTAL LINKED CASES: ${alert.caseCount} (Last 24h: ${alert.cases24h}, Last 48h: ${alert.cases48h})`,
      `CUMULATIVE FINANCIAL EXPOSURE: INR ${Number(alert.totalLoss).toLocaleString()}`,
      `AFFECTED JURISDICTIONS: ${(alert.jurisdictions || []).join(', ')}`,
      `CROSS-JURISDICTION STATUS: ${alert.isCrossJurisdiction ? 'YES (Multi-District / Multi-State Syndicate)' : 'Local Recurrence'}`,
      '',
      `RECOMMENDED STATUTORY DIRECTIVE:`,
      alert.recommendedAction,
      '',
      `LINKED POLICE COMPLAINT IDS:`,
      alert.cases.map(c => ` - ${c.id}: ${c.category} | INR ${c.amount} | ${c.jurisdiction} | Status: ${c.status}`).join('\n'),
      '================================================================================',
      `DISPATCHED VIA CYBERGUARD LAW ENFORCEMENT LIAISON NETWORK`
    ].join('\n');

    navigator.clipboard.writeText(brief);
    toast.success('Inter-LEA coordination brief copied to clipboard.');
  };

  const copyDocketMemo = (docket) => {
    const text = [
      '================================================================================',
      `MASTER SYNDICATE CONSOLIDATION DOCKET (SECTION 111 BNS 2023)`,
      `DOCKET ID: ${docket.docketId} | SYNDICATE: ${docket.syndicateId}`,
      `LEAD INVESTIGATING AGENCY: ${docket.leadAgency}`,
      `SHA-256 DIGITAL INTEGRITY SEAL: ${docket.sha256Seal}`,
      '================================================================================',
      `TOTAL DEFRAUDED EXPOSURE: INR ${Number(docket.metrics.totalDefraudedAmount).toLocaleString()}`,
      `AGGREGATE VICTIMS: ${docket.metrics.victimCount} across ${docket.metrics.jurisdictionCount} Jurisdictions`,
      `ILLICIT IDENTIFIERS:`,
      `  • Phones: ${(docket.identifiers.phones || []).join(', ') || 'N/A'}`,
      `  • UPI Handles: ${(docket.identifiers.upis || []).join(', ') || 'N/A'}`,
      `  • Bank Accounts: ${(docket.identifiers.accounts || []).join(', ') || 'N/A'}`,
      '',
      `STATUTORY CHARGE SECTIONS APPLIED:`,
      docket.statutorySections.map(s => `  - ${s.act}: ${s.section} (${s.description})`).join('\n'),
      '',
      `EXECUTIVE DIRECTIVE:`,
      docket.executiveSummary,
      '================================================================================'
    ].join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Master Syndicate Docket copied to clipboard.');
  };

  // Open Docket Modal for an alert or node
  const openDocketModalForAlert = (alert) => {
    const cIds = (alert.cases || []).map(c => c.id);
    setDocketModal({
      isOpen: true,
      syndicateId: `SYN-${alert.identifierType.toUpperCase()}-${alert.identifier.replace(/\D/g, '').slice(-4) || 'HUB'}`,
      complaintIds: cIds,
      leadAgency: 'Central Bureau of Investigation (CBI) Cyber Wing',
      notes: `Consolidated from high-velocity surge alert ${alert.alertId} (${alert.identifier}).`,
      createdDocket: null
    });
  };

  const openDocketModalForNode = (node) => {
    let cIds = [];
    if (node.type === 'case') {
      cIds = [node.label];
    } else if (node.cases) {
      cIds = node.cases.map(c => c.id);
    }
    setDocketModal({
      isOpen: true,
      syndicateId: `SYN-${node.type.toUpperCase()}-${node.label.replace(/\D/g, '').slice(-4) || 'CLUSTER'}`,
      complaintIds: cIds.length > 0 ? cIds : [node.label],
      leadAgency: 'Central Bureau of Investigation (CBI) Cyber Wing',
      notes: `Consolidated from relational graph node ${node.id} (${node.label}).`,
      createdDocket: null
    });
  };

  // Open Telecom Requisition Modal
  const openTelecomModalForPhone = (phone, cIds = []) => {
    setTelecomModal({
      isOpen: true,
      phone: String(phone).replace(/\D/g, '').slice(-10),
      imei: '',
      complaintIds: cIds,
      carrier: '',
      reason: 'Active instrument in cross-jurisdiction cyber fraud and extortion calls',
      createdRequisition: null
    });
  };

  // Handle Docket Submission
  const handleConsolidateDocket = async () => {
    if (docketModal.complaintIds.length === 0) {
      toast.error('At least one complaint ID is required for consolidation.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await analyticsAPI.consolidateSyndicateDocket({
        syndicateId: docketModal.syndicateId,
        complaintIds: docketModal.complaintIds,
        leadAgency: docketModal.leadAgency,
        notes: docketModal.notes
      });
      if (res.data?.data) {
        setDocketModal(prev => ({ ...prev, createdDocket: res.data.data }));
        toast.success(`Master Docket ${res.data.data.docketId} created under Section 111 BNS 2023!`);
        fetchData();
      }
    } catch (err) {
      console.error('Docket consolidation failed:', err);
      toast.error(err.response?.data?.message || 'Failed to consolidate syndicate docket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Telecom Requisition Submission
  const handleDispatchTelecom = async () => {
    if (!telecomModal.phone || telecomModal.phone.length !== 10) {
      toast.error('A valid 10-digit Indian phone number is required.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await analyticsAPI.dispatchTelecomRequisition({
        phone: telecomModal.phone,
        imei: telecomModal.imei || undefined,
        complaintIds: telecomModal.complaintIds,
        carrier: telecomModal.carrier || undefined,
        reason: telecomModal.reason
      });
      if (res.data?.data) {
        setTelecomModal(prev => ({ ...prev, createdRequisition: res.data.data }));
        toast.success(`Telecom Requisition Draft ${res.data.data.requisitionId} generated under Sec 94 BNSS!`);
        fetchData();
      }
    } catch (err) {
      console.error('Telecom requisition failed:', err);
      toast.error(err.response?.data?.message || 'Failed to issue telecom requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pan handlers for graph
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="page-shell" style={{
      minHeight: '100dvh', background: '#070707', color: '#f2f0ea',
      position: 'relative', overflowX: 'hidden', fontFamily: "'IBM Plex Sans', sans-serif"
    }}>
      <Navbar />

      <main className="report-layout" style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 24px 100px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#141414', border: '1px solid #30302d', borderRadius: 8, padding: '4px 12px', marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
              <span style={{ fontSize: 11, color: '#3DF5C0', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ORGANIZED CRIME INTELLIGENCE & STATUTORY SYNDICATE GRAPH
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(2rem, 3.2vw, 2.75rem)', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em',
              color: '#f2f0ea', fontFamily: "'IBM Plex Sans', sans-serif"
            }}>
              Syndicate Graph & Link Analysis
            </h1>
            <p style={{ color: '#8e8b84', fontSize: '15px', fontWeight: 400, margin: 0, maxWidth: 720 }}>
              Correlate serial offender identities across live database complaints. Features interactive topological link graph, automated Section 111 BNS Master Syndicate Consolidation Dockets, and Department of Telecommunications (DoT) TAFCOP / CEIR emergency SIM deactivation.
            </p>
          </div>

          {/* Metrics Overview */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Active Surges', value: surgeSummary?.totalActiveSurges || 0, color: '#d96464' },
              { label: 'Syndicate Clusters', value: syndicateGraph?.totalClusters || 0, color: '#3DF5C0' },
              { label: 'Master Dockets', value: dockets.length || 0, color: '#3DF5C0' },
              { label: 'Requisition Drafts', value: telecomReqs.length || 0, color: '#d8a43a' },
              { label: 'Cross-Linked Cases', value: totalLinkedCases, color: '#f2f0ea' },
              { label: 'Linked Phones', value: links?.phones?.length || 0, color: '#d96464' }
            ].map((stat, i) => (
              <div key={i} style={{ background: '#0d0d0d', border: '1px solid #242421', borderRadius: '14px', padding: '16px 20px', minWidth: 120 }}>
                <div style={{ fontSize: 11, color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Critical Syndicate Surge Alert Banner */}
        {surgeSummary?.criticalCount > 0 && (
          <div style={{
            background: '#120d0d',
            border: '1px solid #d96464',
            borderRadius: '12px',
            padding: '16px 22px',
            marginBottom: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: '#261212', border: '1px solid #d96464', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#d96464" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f2f0ea', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>HIGH-VELOCITY SYNDICATE SURGE DETECTED</span>
                  <span style={{ background: '#d96464', color: '#070707', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em' }}>
                    {surgeSummary.criticalCount} CRITICAL
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#8e8b84', marginTop: 3 }}>
                  {surgeSummary.crossJurisdictionCount} syndicated clusters spanning multiple districts • Cumulative exposure: INR {Number(surgeSummary.totalFinancialRisk).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setActiveTab('surges'); setSearchQuery(''); }}
              style={{
                background: '#d96464',
                color: '#070707',
                border: 'none',
                borderRadius: 6,
                padding: '9px 18px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                letterSpacing: '0.04em'
              }}
            >
              INVESTIGATE SURGE ALERTS
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #262522', paddingBottom: 16, flexWrap: 'wrap' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                style={{
                  background: active ? '#141414' : 'transparent',
                  border: `1px solid ${active ? '#3a3936' : 'transparent'}`,
                  borderRadius: '8px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  color: active ? '#f2f0ea' : '#8e8b84',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.18s ease'
                }}
              >
                <Icon size={16} color={active ? tab.color : '#8e8b84'} />
                {tab.label}
                {tab.id === 'surges' && surgeAlerts?.length > 0 && (
                  <span style={{
                    background: '#2b1414',
                    border: '1px solid #d96464',
                    color: '#d96464',
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}>
                    {surgeAlerts.length}
                  </span>
                )}
                {tab.id === 'dockets' && dockets?.length > 0 && (
                  <span style={{
                    background: '#0d2218',
                    border: '1px solid #3DF5C0',
                    color: '#3DF5C0',
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}>
                    {dockets.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        {activeTab !== 'graph' && (
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8e8b84' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by identifier, Case ID, city, or jurisdiction..."
              style={{
                width: '100%',
                background: '#0d0d0d',
                border: '1px solid #30302d',
                borderRadius: '8px',
                padding: '12px 16px 12px 44px',
                color: '#f2f0ea',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            />
          </div>
        )}

        {/* Tab 0: Real-Time Syndicate Velocity & Surge Alerts */}
        {activeTab === 'surges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredSurgeAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', color: '#8e8b84' }}>
                <CheckCircle2 size={32} color="#3DF5C0" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#f2f0ea', marginBottom: 4 }}>No High-Velocity Surges Active</div>
                <div style={{ fontSize: '13px' }}>Suspect identifiers have not crossed the cross-jurisdictional recurrence threshold in the active window.</div>
              </div>
            ) : (
              filteredSurgeAlerts.map((alert, idx) => {
                const isCritical = alert.severity === 'CRITICAL_SURGE';
                const isHigh = alert.severity === 'HIGH_VELOCITY';
                const badgeColor = isCritical ? '#d96464' : isHigh ? '#d8a43a' : '#3DF5C0';

                return (
                  <div key={idx} style={{
                    background: '#0d0d0d',
                    border: `1px solid ${isCritical ? '#4a1e1e' : '#262522'}`,
                    borderRadius: '14px',
                    padding: '24px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{
                            background: isCritical ? '#261212' : '#1a1812',
                            border: `1px solid ${badgeColor}`,
                            color: badgeColor,
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 4,
                            letterSpacing: '0.08em',
                            fontFamily: "'IBM Plex Mono', monospace"
                          }}>
                            {alert.severity}
                          </span>
                          <span style={{ fontSize: '12px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                            {alert.alertId}
                          </span>
                          {alert.isCrossJurisdiction && (
                            <span style={{
                              background: '#141414',
                              border: '1px solid #30302d',
                              color: '#38bdf8',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Globe size={11} />
                              CROSS-JURISDICTION
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                          {alert.identifier}
                          <span style={{ fontSize: '13px', color: '#8e8b84', fontWeight: 400, marginLeft: 8 }}>
                            ({alert.identifierType.toUpperCase()})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => copyBrief(alert)}
                          style={{
                            background: '#141414',
                            border: '1px solid #30302d',
                            color: '#f2f0ea',
                            borderRadius: 6,
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Copy size={13} />
                          <span>COPY LEA BRIEF</span>
                        </button>

                        {alert.identifierType === 'phone' && (
                          <button
                            type="button"
                            onClick={() => openTelecomModalForPhone(alert.identifier, (alert.cases || []).map(c => c.id))}
                            style={{
                              background: '#261212',
                              border: '1px solid #d96464',
                              color: '#d96464',
                              borderRadius: 6,
                              padding: '8px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Radio size={13} />
                            <span>REQUISITION TAFCOP SIM BLOCK</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openDocketModalForAlert(alert)}
                          style={{
                            background: '#3DF5C0',
                            border: 'none',
                            color: '#070707',
                            borderRadius: 6,
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <FileText size={13} />
                          <span>CONSOLIDATE BNS 111 DOCKET</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats strip */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 12,
                      background: '#121212',
                      border: '1px solid #222220',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 16
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total Linked Cases</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{alert.caseCount} Reports</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent 24h Velocity</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: alert.cases24h > 0 ? '#d96464' : '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{alert.cases24h} Incidents</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent 48h Velocity</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{alert.cases48h} Incidents</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cumulative Exposure</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>INR {Number(alert.totalLoss).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Affected Jurisdictions */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                        AFFECTED JURISDICTIONAL ZONES:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(alert.jurisdictions || []).map((j, jIdx) => (
                          <span key={jIdx} style={{ background: '#171716', border: '1px solid #30302d', borderRadius: 4, padding: '4px 10px', fontSize: '12px', color: '#d8d5ce' }}>
                            {j}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Statutory Action */}
                    <div style={{
                      background: '#151514',
                      border: '1px solid #30302d',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#d8d5ce',
                      marginBottom: 16
                    }}>
                      <div style={{ fontSize: '11px', color: '#3DF5C0', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>
                        STATUTORY LEA INTERVENTION DIRECTIVE:
                      </div>
                      {alert.recommendedAction}
                    </div>

                    {/* Linked Cases List */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                        CONNECTED COMPLAINT RECORDS ({alert.cases.length}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                        {alert.cases.map((cs, cIdx) => (
                          <div key={cIdx} style={{ background: '#121212', border: '1px solid #222220', borderRadius: 6, padding: '10px 12px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                              <strong style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{cs.id}</strong>
                              <span style={{ color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>INR {cs.amount}</span>
                            </div>
                            <div style={{ color: '#8e8b84', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cs.title}</div>
                            <div style={{ fontSize: '11px', color: '#68665f', marginTop: 4 }}>{cs.jurisdiction}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 1: Interactive Syndicate Network Graph */}
        {activeTab === 'graph' && (
          <div>
            <div style={{
              background: '#0d0d0d',
              border: '1px solid #262522',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              {/* Graph Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 700, color: '#f2f0ea' }}>
                    Interactive Topological Syndicate Map
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#8e8b84' }}>
                    Click any node to inspect connected cases, dispatch Section 20 DoT SIM deactivation, or consolidate under Section 111 BNS 2023.
                  </p>
                </div>

                {/* Filter Pills & Controls */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', background: '#141414', border: '1px solid #30302d', borderRadius: 8, padding: 3 }}>
                    {[
                      { id: 'all', label: 'All Entities' },
                      { id: 'phone', label: 'Phones' },
                      { id: 'upi', label: 'UPIs' },
                      { id: 'bank', label: 'Accounts' },
                      { id: 'case', label: 'Cases' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setGraphFilter(f.id)}
                        style={{
                          background: graphFilter === f.id ? '#262522' : 'transparent',
                          color: graphFilter === f.id ? '#f2f0ea' : '#8e8b84',
                          border: 'none',
                          borderRadius: 6,
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => Math.min(z + 0.15, 2))}
                      style={{ background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '7px 10px', color: '#f2f0ea', cursor: 'pointer' }}
                      title="Zoom In"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => Math.max(z - 0.15, 0.5))}
                      style={{ background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '7px 10px', color: '#f2f0ea', cursor: 'pointer' }}
                      title="Zoom Out"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                      style={{ background: '#141414', border: '1px solid #30302d', borderRadius: 6, padding: '7px 10px', color: '#f2f0ea', cursor: 'pointer' }}
                      title="Reset View"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Legend Strip */}
              <div style={{ display: 'flex', gap: 16, fontSize: '12px', color: '#8e8b84', flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3DF5C0' }} /> Case Node ({visibleGraphNodes.filter(n => n.type === 'case').length})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d96464' }} /> Phone Link ({visibleGraphNodes.filter(n => n.type === 'phone').length})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d8a43a' }} /> UPI Link ({visibleGraphNodes.filter(n => n.type === 'upi').length})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} /> Bank Account ({visibleGraphNodes.filter(n => n.type === 'bank').length})
                </div>
              </div>

              {/* Visual Graph Canvas Area */}
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                  height: 520,
                  background: '#070707',
                  border: '1px solid #1f1f1d',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
              >
                {visibleGraphNodes.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8b84', fontSize: '14px' }}>
                    No cross-case linkages detected in current database records.
                  </div>
                ) : (
                  <svg
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.15s ease'
                    }}
                    viewBox="0 0 900 550"
                  >
                    {/* Grid Pattern */}
                    <defs>
                      <pattern id="graphGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#181816" />
                      </pattern>
                    </defs>
                    <rect width="900" height="550" fill="url(#graphGrid)" />

                    {/* Edges */}
                    {visibleGraphEdges.map((edge, eIdx) => {
                      const srcNode = visibleGraphNodes.find(n => n.id === edge.source);
                      const tgtNode = visibleGraphNodes.find(n => n.id === edge.target);
                      if (!srcNode || !tgtNode) return null;

                      const isConnected = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);

                      return (
                        <g key={eIdx}>
                          <line
                            x1={srcNode.x || 450}
                            y1={srcNode.y || 275}
                            x2={tgtNode.x || 450}
                            y2={tgtNode.y || 275}
                            stroke={isConnected ? '#3DF5C0' : '#222220'}
                            strokeWidth={isConnected ? 2.5 : 1.2}
                            strokeDasharray={isConnected ? 'none' : '3,3'}
                          />
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {visibleGraphNodes.map((node, nIdx) => {
                      const isSelected = selectedNodeId === node.id;
                      const nx = node.x || 450;
                      const ny = node.y || 275;
                      const radius = node.type === 'case' ? 12 : node.type === 'phone' ? 16 : 14;

                      return (
                        <g
                          key={nIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(node.id);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Selection Halo */}
                          {isSelected && (
                            <circle
                              cx={nx}
                              cy={ny}
                              r={radius + 8}
                              fill="none"
                              stroke={node.color || '#3DF5C0'}
                              strokeWidth={2}
                              strokeDasharray="4,4"
                            />
                          )}

                          {/* Main Node Circle */}
                          <circle
                            cx={nx}
                            cy={ny}
                            r={radius}
                            fill={node.color || '#3DF5C0'}
                            stroke="#070707"
                            strokeWidth={2}
                          />

                          {/* Node Icon/Symbol */}
                          <text
                            x={nx}
                            y={ny + 4}
                            fontSize={node.type === 'case' ? '9' : '10'}
                            fontWeight="800"
                            textAnchor="middle"
                            fill="#070707"
                            fontFamily="'IBM Plex Mono', monospace"
                          >
                            {node.type === 'phone' ? 'P' : node.type === 'upi' ? 'U' : node.type === 'bank' ? 'B' : 'C'}
                          </text>

                          {/* Label below node */}
                          <text
                            x={nx}
                            y={ny + radius + 14}
                            fontSize="10"
                            fontWeight={isSelected ? '800' : '500'}
                            textAnchor="middle"
                            fill={isSelected ? '#f2f0ea' : '#8e8b84'}
                            fontFamily="'IBM Plex Mono', monospace"
                          >
                            {node.label.length > 14 ? `${node.label.slice(0, 12)}…` : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* Entity Inspection Drawer */}
              {selectedNode && (
                <div style={{
                  marginTop: 20,
                  background: '#121212',
                  border: '1px solid #30302d',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        background: selectedNode.color || '#3DF5C0',
                        color: '#070707',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                      }}>
                        {selectedNode.type} NODE
                      </span>
                      <strong style={{ fontSize: '18px', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {selectedNode.label}
                      </strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#8e8b84' }}>
                      {selectedNode.type === 'case' ? (
                        <span>Category: {selectedNode.category} • Status: {selectedNode.status?.toUpperCase()} • Amount: INR {Number(selectedNode.amount || 0).toLocaleString()}</span>
                      ) : (
                        <span>Connected Cases: {selectedNode.frequency || selectedNode.cases?.length || 0} Reports • Cumulative Volume: INR {Number(selectedNode.totalLoss || 0).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {selectedNode.type === 'phone' && (
                      <button
                        type="button"
                        onClick={() => openTelecomModalForPhone(selectedNode.label, (selectedNode.cases || []).map(c => c.id))}
                        style={{
                          background: '#261212',
                          border: '1px solid #d96464',
                          color: '#d96464',
                          borderRadius: 6,
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Radio size={13} />
                        <span>REQUISITION TAFCOP SIM BLOCK</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openDocketModalForNode(selectedNode)}
                      style={{
                        background: '#3DF5C0',
                        border: 'none',
                        color: '#070707',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <FileText size={13} />
                      <span>CONSOLIDATE BNS 111 DOCKET</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Master Syndicate Consolidation Dockets (Sec 111 BNS) */}
        {activeTab === 'dockets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Statutory Guidance Preamble */}
            <div style={{
              background: '#0d1a14',
              border: '1px solid #1a4230',
              borderRadius: '12px',
              padding: '18px 22px',
              marginBottom: 8
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#3DF5C0', marginBottom: 4, letterSpacing: '0.06em' }}>
                STATUTORY MULTI-VICTIM CONSOLIDATION DIRECTIVES UNDER BNS SECTION 111 & BNSS SECTION 107
              </div>
              <div style={{ fontSize: '13px', color: '#c2dbd0', lineHeight: 1.5 }}>
                When an illicit syndicate victimizes citizens across multiple police stations, individual petty theft FIRs fail to deter national scam hubs. Consolidating multi-jurisdictional complaints establishes systemic continuing unlawful activity under Section 111 of Bharatiya Nyaya Sanhita, 2023 (Organized Crime), enabling transfer to specialized State Cyber Crime Cells and CBI for joint prosecution.
              </div>
            </div>

            {filteredDockets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', color: '#8e8b84' }}>
                <FileText size={32} color="#3DF5C0" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#f2f0ea', marginBottom: 4 }}>No Master Syndicate Dockets Generated Yet</div>
                <div style={{ fontSize: '13px' }}>Select cases from Surge Alerts or the Interactive Graph and click "CONSOLIDATE BNS 111 DOCKET" to create the first master docket.</div>
              </div>
            ) : (
              filteredDockets.map((doc, dIdx) => (
                <div key={dIdx} style={{
                  background: '#0d0d0d',
                  border: '1px solid #262522',
                  borderRadius: '14px',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{
                          background: '#0c2618',
                          border: '1px solid #3DF5C0',
                          color: '#3DF5C0',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 4,
                          letterSpacing: '0.08em',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}>
                          SECTION 111 BNS 2023
                        </span>
                        <span style={{ fontSize: '13px', color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>
                          {doc.docketId}
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#f2f0ea' }}>
                        {doc.title}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                        Lead Investigating Agency: <strong>{doc.leadAgency}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => copyDocketMemo(doc)}
                        style={{
                          background: '#141414',
                          border: '1px solid #30302d',
                          color: '#f2f0ea',
                          borderRadius: 6,
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Copy size={13} />
                        <span>COPY CHARGESHEET MEMO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocketModal({ isOpen: true, createdDocket: doc, complaintIds: doc.victimRoster.map(v => v.complaintId) })}
                        style={{
                          background: '#3DF5C0',
                          border: 'none',
                          color: '#070707',
                          borderRadius: 6,
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>VIEW COURT DOCKET</span>
                      </button>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
                    background: '#121212',
                    border: '1px solid #222220',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 16
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Consolidated Victims</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{doc.metrics.victimCount} Complainants</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Jurisdictions</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', fontFamily: "'IBM Plex Mono', monospace" }}>{doc.metrics.jurisdictionCount} Police Zones</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total Exposure</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>INR {Number(doc.metrics.totalDefraudedAmount).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>SHA-256 Seal</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace" }}>{doc.sha256Seal?.slice(0, 16)}...</div>
                    </div>
                  </div>

                  {/* Victim List */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                      VICTIM ROSTER ({doc.victimRoster?.length || 0}):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                      {(doc.victimRoster || []).map((v, vIdx) => (
                        <div key={vIdx} style={{ background: '#141414', border: '1px solid #222220', borderRadius: 6, padding: '8px 12px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <strong style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{v.complaintId}</strong>
                            <span style={{ color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace" }}>INR {v.amountLost}</span>
                          </div>
                          <div style={{ color: '#8e8b84', fontSize: '11px' }}>{v.victimInitials} • {v.jurisdiction}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Cross-Case Phones */}
        {activeTab === 'phones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPhones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', color: '#8e8b84' }}>
                No multi-case phone links found matching query.
              </div>
            ) : (
              filteredPhones.map((item, idx) => (
                <div key={idx} style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Phone size={16} color="#d96464" />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                        +91 {item._id}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', background: '#241414', border: '1px solid #4a1e1e', color: '#d96464', padding: '2px 10px', borderRadius: '6px', fontWeight: 700 }}>
                        {item.count} Connected Reports
                      </span>
                      <button
                        type="button"
                        onClick={() => openTelecomModalForPhone(item._id, (item.cases || []).map(c => c.id))}
                        style={{
                          background: '#261212',
                          border: '1px solid #d96464',
                          color: '#d96464',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Radio size={12} />
                        <span>REQUISITION TAFCOP SIM BLOCK</span>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                    {item.cases.map((cs, cIdx) => (
                      <div key={cIdx} style={{ background: '#141414', border: '1px solid #222220', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{cs.id}</strong>
                          <span style={{ color: '#8e8b84', fontSize: '11px', textTransform: 'uppercase' }}>{cs.status}</span>
                        </div>
                        <div style={{ color: '#8e8b84', fontSize: '12px' }}>{cs.title || cs.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Suspect UPI Links */}
        {activeTab === 'upis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredUpis.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', color: '#8e8b84' }}>
                No multi-case UPI links found matching query.
              </div>
            ) : (
              filteredUpis.map((item, idx) => (
                <div key={idx} style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CreditCard size={16} color="#d8a43a" />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                        VPA: {item._id}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', background: '#241a0d', border: '1px solid #4a3518', color: '#d8a43a', padding: '2px 10px', borderRadius: '6px', fontWeight: 700 }}>
                      {item.count} Connected Reports
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                    {item.cases.map((cs, cIdx) => (
                      <div key={cIdx} style={{ background: '#141414', border: '1px solid #222220', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{cs.id}</strong>
                          <span style={{ color: '#8e8b84', fontSize: '11px', textTransform: 'uppercase' }}>{cs.status}</span>
                        </div>
                        <div style={{ color: '#8e8b84', fontSize: '12px' }}>{cs.title || cs.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Bank Account Networks */}
        {activeTab === 'accounts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', color: '#8e8b84' }}>
                No multi-case bank accounts currently linked.
              </div>
            ) : (
              filteredAccounts.map((item, idx) => (
                <div key={idx} style={{ background: '#0d0d0d', border: '1px solid #262522', borderRadius: '12px', padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Landmark size={16} color="#38bdf8" />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                        ACCOUNT: {item._id}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', background: '#0c1a24', border: '1px solid #16364a', color: '#38bdf8', padding: '2px 10px', borderRadius: '6px', fontWeight: 700 }}>
                      {item.count} Linked Cases
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                    {item.cases.map((cs, cIdx) => (
                      <div key={cIdx} style={{ background: '#141414', border: '1px solid #222220', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>{cs.id}</strong>
                          <span style={{ color: '#8e8b84', fontSize: '11px', textTransform: 'uppercase' }}>{cs.status}</span>
                        </div>
                        <div style={{ color: '#8e8b84', fontSize: '12px' }}>{cs.title || cs.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* MODAL A: Consolidate Syndicate Master Docket Modal */}
      <AnimatePresence>
        {docketModal.isOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#0d0d0d', border: '1px solid #30302d', borderRadius: 16,
                maxWidth: 780, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                padding: 28, position: 'relative'
              }}
            >
              <button
                type="button"
                onClick={() => setDocketModal({ isOpen: false, syndicateId: '', complaintIds: [], createdDocket: null })}
                style={{ position: 'absolute', right: 20, top: 20, background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0c2618', border: '1px solid #3DF5C0', borderRadius: 6, padding: '3px 10px', marginBottom: 12 }}>
                <span style={{ fontSize: '11px', color: '#3DF5C0', fontWeight: 800 }}>SECTION 111 BNS 2023 CONSOLIDATOR</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#f2f0ea' }}>
                {docketModal.createdDocket ? 'Potential Syndicate Assessment Dossier' : 'Generate Potential Syndicate Assessment Dossier Draft (Sec 111 BNS)'}
              </h2>

              {!docketModal.createdDocket ? (
                <div>
                  <p style={{ color: '#8e8b84', fontSize: '13px', margin: '0 0 20px 0' }}>
                    Consolidate {docketModal.complaintIds.length} complaints into a single organized crime docket with aggregated financial losses and shared suspect identifiers.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Syndicate Identifier / Cluster ID
                      </label>
                      <input
                        value={docketModal.syndicateId}
                        onChange={e => setDocketModal({ ...docketModal, syndicateId: e.target.value })}
                        style={{
                          width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                          padding: '10px 14px', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Lead Investigating Law Enforcement Agency
                      </label>
                      <select
                        value={docketModal.leadAgency}
                        onChange={e => setDocketModal({ ...docketModal, leadAgency: e.target.value })}
                        style={{
                          width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                          padding: '10px 14px', color: '#f2f0ea', fontSize: '13px'
                        }}
                      >
                        <option value="Central Bureau of Investigation (CBI) Cyber Wing">Central Bureau of Investigation (CBI) Cyber Wing</option>
                        <option value="State Cyber Crime Command / Special Task Force">State Cyber Crime Command / Special Task Force</option>
                        <option value="National Cyber Crime Coordination Centre (I4C) Joint Task Force">National Cyber Crime Coordination Centre (I4C) Joint Task Force</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Constituent Complaint IDs ({docketModal.complaintIds.length})
                      </label>
                      <div style={{
                        background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                        padding: '10px 14px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px'
                      }}>
                        {docketModal.complaintIds.join(', ') || 'No complaints selected'}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Operational Notes & Syndicate Modus Operandi
                      </label>
                      <textarea
                        rows={3}
                        value={docketModal.notes}
                        onChange={e => setDocketModal({ ...docketModal, notes: e.target.value })}
                        placeholder="Detail multi-state recruitment of mule accounts, VoIP gateway hops, or organized calling centers..."
                        style={{
                          width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                          padding: '10px 14px', color: '#f2f0ea', fontSize: '13px', resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setDocketModal({ isOpen: false, syndicateId: '', complaintIds: [], createdDocket: null })}
                      style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConsolidateDocket}
                      style={{ background: '#3DF5C0', border: 'none', color: '#070707', borderRadius: 6, padding: '10px 24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      {submitting ? 'COMPILING DOCKET...' : 'GENERATE & COMMIT MASTER DOCKET'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Render Complete Court Docket View */
                <div>
                  <div style={{
                    background: '#121212', border: '1px solid #262522', borderRadius: 10,
                    padding: 20, marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px',
                    maxHeight: 380, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#d8d5ce'
                  }}>
                    {docketModal.createdDocket.executiveSummary}
                    {'\n\n================================================================================\n'}
                    {`DOCKET ID: ${docketModal.createdDocket.docketId}\n`}
                    {`LEAD AGENCY: ${docketModal.createdDocket.leadAgency}\n`}
                    {`SHA-256 DIGITAL SEAL: ${docketModal.createdDocket.sha256Seal}\n`}
                    {`TOTAL LOSS: INR ${Number(docketModal.createdDocket.metrics.totalDefraudedAmount).toLocaleString()}\n`}
                    {`VICTIMS: ${docketModal.createdDocket.metrics.victimCount} across ${docketModal.createdDocket.metrics.jurisdictionCount} Jurisdictions\n`}
                    {`PRIMARY VECTOR: ${docketModal.createdDocket.primaryVector}\n`}
                    {'================================================================================\n\n'}
                    {'STATUTORY CHARGE SECTIONS:\n'}
                    {docketModal.createdDocket.statutorySections.map(s => `• ${s.act} - ${s.section}: ${s.description}`).join('\n\n')}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => copyDocketMemo(docketModal.createdDocket)}
                      style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: 6, padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <Copy size={14} />
                      <span>COPY CHARGESHEET MEMO</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocketModal({ isOpen: false, syndicateId: '', complaintIds: [], createdDocket: null })}
                      style={{ background: '#3DF5C0', border: 'none', color: '#070707', borderRadius: 6, padding: '10px 24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL B: TAFCOP Telecom Deactivation Directive Modal */}
      <AnimatePresence>
        {telecomModal.isOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#0d0d0d', border: '1px solid #30302d', borderRadius: 16,
                maxWidth: 740, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                padding: 28, position: 'relative'
              }}
            >
              <button
                type="button"
                onClick={() => setTelecomModal({ isOpen: false, phone: '', imei: '', createdRequisition: null })}
                style={{ position: 'absolute', right: 20, top: 20, background: 'transparent', border: 'none', color: '#8e8b84', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#261212', border: '1px solid #d96464', borderRadius: 6, padding: '3px 10px', marginBottom: 12 }}>
                <span style={{ fontSize: '11px', color: '#d96464', fontWeight: 800 }}>SECTION 94 BNSS 2023 & SECTION 67C IT ACT 2000 (REQUISITION DRAFT)</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#f2f0ea' }}>
                {telecomModal.createdRequisition ? 'Generated Telecom Requisition Draft' : 'Proposed Telecom Requisition Draft (DoT / TAFCOP / CEIR)'}
              </h2>

              {!telecomModal.createdRequisition ? (
                <div>
                  <p style={{ color: '#8e8b84', fontSize: '13px', margin: '0 0 20px 0' }}>
                    Generate an operational requisition draft under Section 94 BNSS 2023 and Section 67C IT Act 2000 for line disconnection, mandatory 24-month CDR preservation, and CEIR IMEI barring request for authorized officer review and transmission.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Target MSISDN / 10-Digit Mobile Number
                      </label>
                      <input
                        value={telecomModal.phone}
                        onChange={e => setTelecomModal({ ...telecomModal, phone: e.target.value })}
                        placeholder="9880011223"
                        style={{
                          width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                          padding: '10px 14px', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Suspected Handset IMEI (Optional - Auto-interrogated via HLR/VLR if blank)
                      </label>
                      <input
                        value={telecomModal.imei}
                        onChange={e => setTelecomModal({ ...telecomModal, imei: e.target.value })}
                        placeholder="861234567890123"
                        style={{
                          width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                          padding: '10px 14px', color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Linked Complaint IDs
                      </label>
                      <div style={{
                        background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                        padding: '10px 14px', color: '#3DF5C0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px'
                      }}>
                        {telecomModal.complaintIds?.join(', ') || 'Direct intelligence input'}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#8e8b84', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                        Statutory Reason for Emergency Disconnection
                      </label>
                      <textarea
                        rows={2}
                        value={telecomModal.reason}
                        onChange={e => setTelecomModal({ ...telecomModal, reason: e.target.value })}
                        style={{
                          width: '100%', background: '#141414', border: '1px solid #30302d', borderRadius: 6,
                          padding: '10px 14px', color: '#f2f0ea', fontSize: '13px', resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setTelecomModal({ isOpen: false, phone: '', imei: '', createdRequisition: null })}
                      style={{ background: '#141414', border: '1px solid #30302d', color: '#8e8b84', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleDispatchTelecom}
                      style={{ background: '#d96464', border: 'none', color: '#070707', borderRadius: 6, padding: '10px 24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      {submitting ? 'DISPATCHING DIRECTIVE...' : 'DISPATCH TAFCOP / CEIR BLOCK'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Render Directive Confirmation */
                <div>
                  <div style={{
                    background: '#121212', border: '1px solid #262522', borderRadius: 10,
                    padding: 20, marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px',
                    maxHeight: 380, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#d8d5ce'
                  }}>
                    {telecomModal.createdRequisition.directiveText}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(telecomModal.createdRequisition.directiveText);
                        toast.success('Directive text copied to clipboard.');
                      }}
                      style={{ background: '#141414', border: '1px solid #30302d', color: '#f2f0ea', borderRadius: 6, padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <Copy size={14} />
                      <span>COPY DIRECTIVE TEXT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTelecomModal({ isOpen: false, phone: '', imei: '', createdRequisition: null })}
                      style={{ background: '#3DF5C0', border: 'none', color: '#070707', borderRadius: 6, padding: '10px 24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      DONE
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
