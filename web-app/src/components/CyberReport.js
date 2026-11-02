import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { complaintsAPI } from '../services/api';
import useTranslationStore from '../hooks/useTranslationStore';
import { ArrowLeft, Upload, X, MapPin, Lock, Check, Mic, Sparkles, Scale, FileText } from 'lucide-react';
import OneeCompanion from './onee/OneeCompanion';
import { useOneeGuideEngine } from './onee/useOneeGuideEngine';

const SUBCATEGORIES_BY_CATEGORY = {
  'Financial Fraud': [
    'UPI / Banking & Card Fraud',
    'Loan App Scam',
    'Investment & Stock Scam',
    'Digital Arrest & Extortion',
    'Card Skimming & ATM Clone'
  ],
  'Phishing': [
    'Email / SSO Phishing & Spoofing',
    'Spear Phishing & BEC',
    'Fake Banking / Service Login',
    'MFA Interception & Cookie Theft'
  ],
  'Ransomware': [
    'Ransomware Extortion & Malware',
    'Server & Endpoint Encryption',
    'Data Exfiltration & Double Extortion'
  ],
  'Identity Theft': [
    'Aadhaar / SIM Swap & Impersonation',
    'Fake KYC Verification',
    'Unauthorized Loan in My Name'
  ],
  'Cyber Bullying': [
    'Online Harassment & Doxxing',
    'Sextortion & Blackmail',
    'Morphed Photos & Defamation',
    'Stalking & Threatening Messages'
  ],
  'Hacking': [
    'Unauthorized Intrusion & Account Takeover',
    'Website Defacement / SQL Injection',
    'System / Cloud Infrastructure Compromise'
  ],
  'Data Breach': [
    'Corporate Database Leak & PII Theft',
    'Exposed S3 Bucket / Cloud Dump',
    'Dark Web Credential Spill'
  ],
  'Online Fraud': [
    'E-Commerce & Marketplace Scam',
    'Fake Job Portal Scam',
    'Courier / Customs Parcel Scam'
  ],
  'DDoS / Network Attacks': [
    'DDoS & Infrastructure Flooding',
    'DNS Hijacking & Spoofing',
    'Botnet Attack'
  ],
  'Cryptocurrency Scams': [
    'Crypto Drainer & Web3 Scam',
    'Fake Token & Rugpull',
    'Phishing Wallet Connect'
  ],
  'Women/Child Safety': [
    'Emergency Distress & Cyberstalking',
    'Domestic Violence Threats',
    'SOS Immediate Intervention'
  ],
  'Child Exploitation': [
    'CSAM & Minor Protection',
    'Online Child Grooming'
  ],
  'Social Media Crime': [
    'Impersonation & Fake Profiles',
    'Account Takeover',
    'Harassment via Direct Messages'
  ],
  'Other': [
    'General Cyber Incident',
    'Other'
  ]
};

const progressSections = [
  { label: 'Incident', target: 'incident-details' },
  { label: 'Contact', target: 'location-contact' },
  { label: 'Evidence', target: 'evidence' },
  { label: 'Verification', target: 'verification' }
];

const CyberReport = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { t } = useTranslationStore();

  // Phase 6: Oral/Voice Statement Transcription Assistant
  const [showTranscribeModal, setShowTranscribeModal] = useState(false);
  const [oralStatement, setOralStatement] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeResult, setTranscribeResult] = useState(null);

  const handleTranscribeStatement = async (overrideText) => {
    const textToUse = overrideText !== undefined ? overrideText : oralStatement;
    if (!textToUse || !textToUse.trim()) {
      toast.error('Please enter or speak your statement.');
      return;
    }
    setTranscribing(true);
    setTranscribeResult(null);
    try {
      const { data } = await complaintsAPI.transcribeStatement(textToUse);
      setTranscribeResult(data.data);
      toast.success('Oral statement normalized into structured forensic dossier.');
    } catch (err) {
      toast.error('Transcription failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setTranscribing(false);
    }
  };

  const applyTranscribedStatement = () => {
    if (!transcribeResult) return;
    if (transcribeResult.suggestedTitle) setTitle(transcribeResult.suggestedTitle);
    if (transcribeResult.normalizedDossier) setDescription(transcribeResult.normalizedDossier);
    if (transcribeResult.lossAmount) {
      setLostMoney(true);
      setAmountLost(transcribeResult.lossAmount.toString());
    }
    if (transcribeResult.extractedEntities?.utrs?.[0]) {
      setTransactionReference(transcribeResult.extractedEntities.utrs[0]);
    }
    if (transcribeResult.category) {
      let mapped = 'Financial Fraud';
      if (/women|child|sextortion/i.test(transcribeResult.category)) mapped = 'Women/Child Safety';
      else if (/harass/i.test(transcribeResult.category)) mapped = 'Cyber Bullying';
      else if (/kyc|phish/i.test(transcribeResult.category)) mapped = 'Phishing';
      else if (/identity/i.test(transcribeResult.category)) mapped = 'Identity Theft';
      setCategory(mapped);
      setUserOverrodeCategory(true);
      const sub = SUBCATEGORIES_BY_CATEGORY[mapped]?.[0] || 'General Incident';
      setSubCategory(sub);
    }
    if (!incidentDateTime) {
      setIncidentDateTime(new Date().toISOString().slice(0, 16));
    }
    setShowTranscribeModal(false);
    toast.success('Pre-filled complaint fields from oral statement!');
  };

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [incidentDateTime, setIncidentDateTime] = useState('');
  const [modusOperandi, setModusOperandi] = useState('');
  const [lostMoney, setLostMoney] = useState(false);
  const [amountLost, setAmountLost] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [incidentOccurredWhere, setIncidentOccurredWhere] = useState('');
  const [relationshipWithVictim, setRelationshipWithVictim] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [nationalIdFile, setNationalIdFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userOverrodeCategory, setUserOverrodeCategory] = useState(false);
  const [skipEvidence, setSkipEvidence] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);

  const [pincode, setPincode] = useState('');
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');

  // Interactive Onee Citizen Guide State Controller
  const formStateForGuide = {
    title,
    description,
    category,
    subCategory,
    incidentDateTime,
    lostMoney,
    amountLost,
    transactionReference,
    incidentOccurredWhere,
    email,
    mobile,
    filesCount: files.length,
    hasNationalId: Boolean(nationalIdFile),
    skipEvidence,
    relationshipWithVictim,
    consentAgreed,
    isSubmitting
  };
  const oneeGuide = useOneeGuideEngine(formStateForGuide);

  // Scanner prefill consumer
  useEffect(() => {
    const prefill = routerLocation.state?.prefill;
    if (prefill) {
      if (prefill.title) setTitle(prefill.title);
      if (prefill.description) setDescription(prefill.description);
      if (prefill.category) {
        setCategory(prefill.category);
        setUserOverrodeCategory(true);
        const firstSub = SUBCATEGORIES_BY_CATEGORY[prefill.category]?.[0] || 'General Incident';
        setSubCategory(firstSub);
      }
    }
  }, [routerLocation.state]);

  // AI analysis fallback
  useEffect(() => {
    const fullText = `${title} ${description}`.trim();
    if (fullText.length < 10) return;

    const timer = setTimeout(async () => {
      try {
        const { data } = await complaintsAPI.analyze(fullText);
        if (data.status === 'success' && data.data && (!userOverrodeCategory || !category)) {
          const res = data.data;
          const detectedCat = res.category || 'Other';
          const detectedSub = res.subcategory || (SUBCATEGORIES_BY_CATEGORY[detectedCat]?.[0] || 'General Incident');
          setCategory(detectedCat);
          setSubCategory(detectedSub);
        }
      } catch (err) {
        // silent fallback
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, description, userOverrodeCategory, category]);

  // Synchronize with Onee Citizen Assistant
  useEffect(() => {
    const checklist = {
      title: !!(title && title.trim().length >= 5),
      category: !!category,
      incidentDate: !!incidentDateTime,
      description: !!(description && description.trim().length >= 20),
      contact: !!(email && email.includes('@') && mobile && mobile.length >= 10),
      declaration: consentAgreed
    };
    const formData = {
      incidentDate: incidentDateTime,
      category,
      amountLost: lostMoney ? amountLost : '',
      transactionRef: lostMoney ? transactionReference : '',
      suspectContact: ''
    };
    window.dispatchEvent(new CustomEvent('cyberguard:assistant-event', {
      detail: { type: 'form_state_update', checklist, formData }
    }));
  }, [title, category, incidentDateTime, description, email, mobile, consentAgreed, lostMoney, amountLost, transactionReference]);

  useEffect(() => {
    const handlePopulate = (e) => {
      if (e.detail?.text) {
        setDescription(e.detail.text);
        toast.success('Applied incident description from Onee Assistant!');
      }
    };
    window.addEventListener('cyberguard:populate-description', handlePopulate);
    return () => window.removeEventListener('cyberguard:populate-description', handlePopulate);
  }, []);

  const geocodePincode = async (pin) => {
    if (!pin || pin.length !== 6) return;
    setGettingLocation(true);
    try {
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json`);
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        const match = nomData[0];
        const lat = parseFloat(match.lat);
        const lng = parseFloat(match.lon);
        const parts = match.display_name.split(',').map(s => s.trim());
        const area = parts[1] || parts[0];
        const state = parts[parts.length - 2] || 'India';

        setLocation({ lat, lng, city: area, region: state });
        setGettingLocation(false);
        toast.success(`PIN ${pin} Located: ${area}, ${state}`);
        return;
      }

      const pinRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const pinData = await pinRes.json();
      if (pinData && pinData[0]?.Status === 'Success' && pinData[0]?.PostOffice?.length > 0) {
        const po = pinData[0].PostOffice[0];
        const district = po.District;
        const state = po.State;

        setLocation({
          lat: 12.97,
          lng: 77.59,
          city: `${po.Name}, ${district}`,
          region: state
        });
        setGettingLocation(false);
        toast.success(`PIN ${pin} Located: ${po.Name}, ${district}`);
        return;
      }
    } catch (err) {
      console.warn('PIN geocode failed', err);
    }
    setGettingLocation(false);
  };

  const handleSearchArea = async () => {
    if (!areaSearchQuery || areaSearchQuery.trim().length < 2) {
      toast.error('Please enter a city or area name to search');
      return;
    }
    setGettingLocation(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(areaSearchQuery.trim() + ', India')}&format=json&addressdetails=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const match = data[0];
        const lat = parseFloat(match.lat);
        const lng = parseFloat(match.lon);
        const city = match.address?.city || match.address?.town || match.address?.village || match.address?.suburb || match.address?.county || areaSearchQuery.trim();
        const state = match.address?.state || '';
        const postcode = match.address?.postcode || '';

        setLocation({ lat, lng, city, region: state });
        if (postcode && /^\d{6}$/.test(postcode)) {
          setPincode(postcode);
        }
        setGettingLocation(false);
        toast.success(`Location: ${city}, ${state}`);
        return;
      } else {
        toast.error(`No results found for "${areaSearchQuery}"`);
      }
    } catch (err) {
      toast.error('Location service error. Please try again.');
    }
    setGettingLocation(false);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const maxEvidence = nationalIdFile ? 4 : 5;
    setFiles(prev => {
      const remainingSlots = Math.max(0, maxEvidence - prev.length);
      if (remainingSlots <= 0) {
        toast.error(`Maximum file limit reached (${maxEvidence} evidence files)`);
        return prev;
      }
      const added = acceptedFiles.slice(0, remainingSlots);
      if (added.length > 0) {
        toast.success(`${added.length} file(s) attached.`);
        setSkipEvidence(false);
      }
      return [...prev, ...added];
    });
  }, [nationalIdFile]);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'video/mp4': ['.mp4'],
      'text/plain': ['.txt']
    }
  });

  const handleSubmit = async () => {
    const notifyValidationError = (msg) => {
      window.dispatchEvent(new CustomEvent('cyberguard:assistant-event', {
        detail: { type: 'validation_error' }
      }));
      return toast.error(msg);
    };

    if (!title || title.trim().length < 5) {
      return notifyValidationError('Incident title must be at least 5 characters');
    }
    if (!description || description.trim().length < 20) {
      return notifyValidationError('Detailed narrative must be at least 20 characters');
    }
    if (!category) {
      return notifyValidationError('Please select an incident category');
    }
    if (!subCategory) {
      return notifyValidationError('Please select an incident sub-category');
    }
    if (!incidentDateTime) {
      return notifyValidationError('Please select date and time of incident');
    }
    if (lostMoney && (!amountLost || Number(amountLost) <= 0)) {
      return notifyValidationError('Please enter the financial amount lost in INR');
    }
    if (!email || !email.includes('@')) {
      return notifyValidationError('Please enter a valid email address');
    }
    if (!mobile || mobile.length < 10) {
      return notifyValidationError('Please enter a valid 10-digit mobile number');
    }
    if (!relationshipWithVictim) {
      return notifyValidationError('Please select your relationship to the victim');
    }
    if (!consentAgreed) {
      return notifyValidationError('Please confirm accuracy by checking the declaration');
    }

    setIsSubmitting(true);

    try {
      let combinedDescription = description.trim();
      if (lostMoney && amountLost) {
        combinedDescription += `\n[Financial Loss: INR ${amountLost}${transactionReference ? ` | Ref: ${transactionReference}` : ''}]`;
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', combinedDescription);
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('modusOperandi', modusOperandi || 'Unknown');
      formData.append('lostMoney', lostMoney);
      formData.append('relationshipWithVictim', relationshipWithVictim || 'Self');

      formData.append('victimDetails', JSON.stringify({
        incidentDate: incidentDateTime,
        incidentOccurredWhere,
        pincode,
        location: pincode,
        email,
        countryCode,
        mobile,
        amountLost: lostMoney ? amountLost : undefined,
        transactionReference: lostMoney ? transactionReference : undefined
      }));

      if (location) {
        formData.append('location', JSON.stringify({
          type: 'Point',
          coordinates: [location.lng, location.lat]
        }));
      }

      files.forEach(file => {
        formData.append('evidence', file);
      });
      if (nationalIdFile) {
        formData.append('evidence', nationalIdFile);
      }

      const response = await complaintsAPI.create(formData);
      const caseId = response.data?.complaintId || response.data?.data?._id || '';

      toast.success(`Incident reported successfully${caseId ? ` [Case #${caseId}]` : ''}`, { duration: 5000 });
      window.dispatchEvent(new CustomEvent('cyberguard:assistant-event', {
        detail: { type: 'complaint_submitted', caseId }
      }));

      // Reset
      setTitle('');
      setDescription('');
      setIncidentDateTime('');
      setCategory('');
      setSubCategory('');
      setModusOperandi('');
      setLostMoney(false);
      setAmountLost('');
      setTransactionReference('');
      setIncidentOccurredWhere('');
      setRelationshipWithVictim('');
      setPincode('');
      setLocation(null);
      setEmail('');
      setMobile('');
      setFiles([]);
      setNationalIdFile(null);
      setUserOverrodeCategory(false);
      setConsentAgreed(false);

      navigate('/complaints');
    } catch (err) {
      console.error(err.response?.data);
      const msg = err.response?.data?.message || 'Submission failed. Please check required fields and retry.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSubcategories = SUBCATEGORIES_BY_CATEGORY[category] || [
    'General Incident',
    'Other'
  ];

  // Step completions
  const section1Complete = Boolean(
    title.trim().length >= 5 &&
    description.trim().length >= 20 &&
    category &&
    subCategory &&
    incidentDateTime
  );

  const section2Complete = Boolean(
    email.trim().includes('@') &&
    mobile.trim().length >= 10
  );

  const section3Complete = Boolean(
    files.length > 0 || nationalIdFile || skipEvidence
  );

  const section4Complete = Boolean(
    relationshipWithVictim && consentAgreed
  );

  const completedSections = [
    section1Complete,
    section2Complete,
    section3Complete,
    section4Complete
  ];

  const completedCount = completedSections.filter(Boolean).length;
  
  // Track active section for orientation as user scrolls through the form
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = progressSections
        .map(sec => document.getElementById(sec.target))
        .filter(Boolean);

      if (sectionElements.length === 0) return;

      const scrollPosition = window.scrollY + 200;
      let currentIndex = 0;

      sectionElements.forEach((el, idx) => {
        if (scrollPosition >= el.offsetTop) {
          currentIndex = idx;
        }
      });

      setActiveSectionIndex(currentIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = (e, targetId, idx) => {
    e.preventDefault();
    setActiveSectionIndex(idx);
    const el = document.getElementById(targetId);
    if (el) {
      const yOffset = -28;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Connected progress rail percentage across 4 checkpoints (0, 1, 2, 3 segments)
  const progressPercent =
    completedCount === 0 ? 0 :
    completedCount === 1 ? 33.33 :
    completedCount === 2 ? 66.67 : 100;

  return (
    <main className="page-shell">
      {/* Main Report Layout */}
      <div className="report-layout">
        {/* Top Subheading / Aside Row */}
        <aside className="report-aside">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back</span>
          </button>
          <div className="aside-copy">
            <p className="eyebrow">SECURE SUBMISSION</p>
            <h1>CYBER INCIDENT REPORT</h1>
            <p>Complete the details below. Required fields are marked with an asterisk.</p>
          </div>
          <div className="help-note">
            <p>Immediate danger?</p>
            <span>Contact local emergency services before completing this form.</span>
          </div>
        </aside>

        {/* Form Workspace with Left Vertical Bar */}
        <div className="form-workspace">
          <form
            className="report-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* Form Intro Banner */}
            <div className="form-intro" data-onee-target="form-intro">
              <div>
                <p className="step-label">REPORT DETAILS</p>
                <h2>Tell us what happened</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <p className="required-note">
                  <span aria-hidden="true">*</span> Required fields
                </p>
              </div>
            </div>

            {/* That Vertical Bar: Integrated Interactive Timeline Rail */}
            <nav className="report-progress" aria-label="Report progress">
              <div className="progress-summary">
                <div className="progress-summary-header">
                  <span>REPORT PROGRESS</span>
                  <span className={`progress-pill ${completedCount === 4 ? 'is-finished' : ''}`}>
                    {Math.round((completedCount / 4) * 100)}%
                  </span>
                </div>
                <strong>
                  {completedCount === 4
                    ? 'All 4 sections verified'
                    : `${completedCount} of 4 complete`}
                </strong>
              </div>
              <div className="progress-rail">
                <div className="progress-track" aria-hidden="true">
                  <span
                    className={`progress-fill progress-${completedCount}`}
                    style={{
                      '--progress-scale': progressPercent / 100,
                      '--has-progress': completedCount > 0 ? 1 : 0
                    }}
                  />
                </div>
                <ol className="progress-steps">
                  {progressSections.map((sec, idx) => {
                    const isComplete = completedSections[idx];
                    const isCurrent = activeSectionIndex === idx;
                    return (
                      <li
                        key={sec.target}
                        className={`${isComplete ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''}`}
                      >
                        <a
                          href={`#${sec.target}`}
                          aria-current={isCurrent ? 'step' : undefined}
                          aria-label={`Step ${idx + 1}: ${sec.label}${isComplete ? ', completed' : ''}${isCurrent ? ', current section' : ''}`}
                          onClick={(e) => handleScrollToSection(e, sec.target, idx)}
                        >
                          <span className="step-badge">
                            {isComplete ? (
                              <Check size={12} strokeWidth={3} aria-hidden="true" />
                            ) : (
                              `0${idx + 1}`
                            )}
                          </span>
                          <span className="step-label-text">{sec.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </nav>

            {/* Section 01: Incident details */}
            <section
              className="form-section"
              id="incident-details"
              data-report-section
            >
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3>Incident details</h3>
                  <p>Start with the key facts. Use clear, specific language.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowTranscribeModal(true); setTranscribeResult(null); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
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
                  <Mic size={14} />
                  <span>RECORD AUDIO STATEMENT</span>
                </button>
              </div>

              <label className="field" htmlFor="incident-title">
                <div className="field-label">
                  <span>INCIDENT TITLE *</span>
                </div>
                <input
                  id="incident-title"
                  data-onee-target="incident-title"
                  type="text"
                  placeholder="e.g. Unauthorized UPI debit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label className="field" htmlFor="narrative">
                <div className="field-label">
                  <span>DETAILED NARRATIVE *</span>
                </div>
                <textarea
                  id="narrative"
                  data-onee-target="incident-description"
                  rows={7}
                  placeholder="Describe what occurred, including messages received, actions taken, transaction details, links, account names, and anything else that may help an investigator."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <span className="field-hint">
                  Do not include passwords, PINs, or one-time passcodes.
                </span>
              </label>

              <div className="field-grid">
                <div className="field" data-onee-target="incident-category">
                  <div className="field-label">
                    <span>INCIDENT CATEGORY *</span>
                  </div>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setUserOverrodeCategory(true);
                      const firstSub = SUBCATEGORIES_BY_CATEGORY[e.target.value]?.[0] || 'General';
                      setSubCategory(firstSub);
                    }}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {Object.keys(SUBCATEGORIES_BY_CATEGORY).map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <div className="field-label">
                    <span>SUB-CATEGORY *</span>
                  </div>
                  <select
                    id="sub-category"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a sub-category</option>
                    {currentSubcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="field" htmlFor="incident-time" data-onee-target="incident-time">
                  <div className="field-label">
                    <span>DATE AND TIME OF INCIDENT *</span>
                  </div>
                  <input
                    id="incident-time"
                    type="datetime-local"
                    value={incidentDateTime}
                    onChange={(e) => setIncidentDateTime(e.target.value)}
                    required
                  />
                </label>

                <div className="field">
                  <div className="field-label">
                    <span>HOW DID IT HAPPEN?</span>
                  </div>
                  <select
                    id="method"
                    value={modusOperandi}
                    onChange={(e) => setModusOperandi(e.target.value)}
                  >
                    <option value="">Select a method</option>
                    <option value="Link or QR code">Link or QR code</option>
                    <option value="Phone call or SMS">Phone call or SMS</option>
                    <option value="Remote access">Remote access</option>
                    <option value="Credential theft">Credential theft</option>
                    <option value="Malicious attachment">Malicious attachment</option>
                    <option value="UPI / Payment fraud">UPI / Payment fraud</option>
                    <option value="Digital Arrest & Extortion">Digital Arrest & Extortion</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div className="field">
                  <div className="field-label">
                    <span>WHERE DID IT HAPPEN?</span>
                  </div>
                  <select
                    id="platform"
                    value={incidentOccurredWhere}
                    onChange={(e) => setIncidentOccurredWhere(e.target.value)}
                  >
                    <option value="">Select a platform</option>
                    <option value="Banking or payment app">Banking or payment app</option>
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Social media">Social media</option>
                    <option value="Website">Website</option>
                    <option value="Phone call or SMS">Phone call or SMS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <fieldset className="field toggle-field" data-onee-target="financial-loss">
                  <legend className="field-label">DID YOU LOSE MONEY?</legend>
                  <div className="segmented-control">
                    <button
                      className={!lostMoney ? 'is-selected' : ''}
                      type="button"
                      onClick={() => setLostMoney(false)}
                      aria-pressed={!lostMoney}
                    >
                      NO
                    </button>
                    <button
                      className={lostMoney ? 'is-selected' : ''}
                      type="button"
                      onClick={() => setLostMoney(true)}
                      aria-pressed={lostMoney}
                    >
                      YES
                    </button>
                  </div>
                </fieldset>
              </div>

              {lostMoney && (
                <div className="money-details">
                  <label className="field" htmlFor="amount">
                    <div className="field-label">
                      <span>AMOUNT LOST (INR) *</span>
                    </div>
                    <div className="input-prefix">
                      <span>₹</span>
                      <input
                        id="amount"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={amountLost}
                        onChange={(e) => setAmountLost(e.target.value)}
                        required
                      />
                    </div>
                  </label>
                  <label className="field" htmlFor="transaction-reference" data-onee-target="utr-number">
                    <div className="field-label">
                      <span>TRANSACTION REFERENCE</span>
                      <span className="optional">OPTIONAL</span>
                    </div>
                    <input
                      id="transaction-reference"
                      type="text"
                      placeholder="UTR or transaction ID"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </section>

            {/* Section 02: Location and contact */}
            <section
              className="form-section"
              id="location-contact"
              data-report-section
            >
              <div className="section-heading">
                <h3>Location and contact</h3>
                <p>Add a location and a reliable way for investigators to reach you.</p>
              </div>

              <div className="field-grid" data-onee-target="contact-info">
                <label className="field" htmlFor="pin-code">
                  <div className="field-label">
                    <span>PIN CODE</span>
                  </div>
                  <input
                    id="pin-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit PIN"
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPincode(val);
                      if (val.length === 6) {
                        geocodePincode(val);
                      }
                    }}
                  />
                </label>

                <div className="field">
                  <div className="field-label">
                    <span>CITY OR AREA</span>
                  </div>
                  <div className="input-icon">
                    <MapPin size={16} aria-hidden="true" />
                    <input
                      id="city"
                      type="text"
                      placeholder="Search city or area"
                      value={areaSearchQuery}
                      onChange={(e) => setAreaSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchArea();
                        }
                      }}
                    />
                  </div>
                </div>

                <label className="field" htmlFor="email">
                  <div className="field-label">
                    <span>EMAIL ADDRESS *</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label className="field" htmlFor="mobile">
                  <div className="field-label">
                    <span>MOBILE NUMBER *</span>
                  </div>
                  <div className="phone-input">
                    <span>+91</span>
                    <input
                      id="mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="Enter mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </label>
              </div>
            </section>

            {/* Section 03: Supporting evidence */}
            <section
              className="form-section"
              id="evidence"
              data-report-section
            >
              <div className="section-heading">
                <h3>Supporting evidence</h3>
                <p>Attach screenshots, receipts, messages, or relevant documents.</p>
              </div>

              <div
                className={`upload-area ${isDragActive ? 'is-drag-active' : ''}`}
                data-onee-target="evidence-upload"
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                <Upload size={30} aria-hidden="true" />
                <div>
                  <p>Drop files here or choose from your device</p>
                  <span>PNG, JPG, PDF, or TXT · Maximum 10 MB per file</span>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={open}
                >
                  CHOOSE FILES
                </button>
              </div>

              {files.length === 0 && (
                <button
                  type="button"
                  className={`skip-evidence ${skipEvidence ? 'is-skipped' : ''}`}
                  onClick={() => setSkipEvidence((s) => !s)}
                >
                  {skipEvidence ? 'Evidence skipped — add files instead' : 'Skip for now'}
                </button>
              )}

              {files.length > 0 && (
                <ul className="file-list" aria-label="Selected evidence">
                  {files.map((file, idx) => (
                    <li key={`${file.name}-${idx}`}>
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => removeFile(idx)}
                        aria-label={`Remove file ${file.name}`}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Section 04: Complainant verification */}
            <section
              className="form-section"
              id="verification"
              data-report-section
            >
              <div className="section-heading">
                <h3>Complainant verification</h3>
                <p>Confirm your relationship to the person affected.</p>
              </div>

              <div className="field-grid">
                <div className="field">
                  <div className="field-label">
                    <span>RELATIONSHIP TO THE VICTIM *</span>
                  </div>
                  <select
                    id="relationship"
                    value={relationshipWithVictim}
                    onChange={(e) => setRelationshipWithVictim(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a relationship</option>
                    <option value="Self">I am the victim</option>
                    <option value="Family member">Family member</option>
                    <option value="Authorized representative">Authorized representative</option>
                    <option value="Employer or organization">Employer or organization</option>
                    <option value="Witness">Witness</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="field">
                  <div className="field-label">
                    <span>NATIONAL ID VERIFICATION</span>
                    <span className="optional">OPTIONAL</span>
                  </div>
                  <div className="compact-upload">
                    <label className="secondary-button compact-upload-btn">
                      UPLOAD ID
                      <input
                        type="file"
                        className="visually-hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            if (files.length >= 5) {
                              toast.error('Maximum 5 total files allowed. Please remove an attached evidence file first.');
                              return;
                            }
                            setNationalIdFile(f);
                            toast.success(`ID attached: ${f.name}`);
                          }
                        }}
                      />
                    </label>
                    <span className="compact-upload-name">
                      {nationalIdFile ? nationalIdFile.name : 'No document selected'}
                    </span>
                    {nationalIdFile && (
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => setNationalIdFile(null)}
                        aria-label="Remove national ID"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <span className="field-hint">
                    Aadhaar, PAN, passport, or corporate ID · Maximum 5 MB
                  </span>
                </div>
              </div>

              <label className="consent" htmlFor="consent-check" data-onee-target="review-declaration">
                <input
                  id="consent-check"
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  required
                />
                <span>
                  I confirm that the information in this report is accurate to the best of my knowledge. *
                </span>
              </label>
            </section>

            {/* Form Footer */}
            <footer className="form-footer">
              <div className="footer-security-note">
                <Lock size={17} aria-hidden="true" />
                <p>
                  <strong>Your report is handled securely.</strong>
                  <span>Review your information before submitting.</span>
                </p>
              </div>
              <button
                type="submit"
                className="primary-button"
                data-onee-target="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT INCIDENT REPORT'}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Onee Interactive Citizen Guide Companion */}
      <OneeCompanion
        step={oneeGuide.currentStep}
        stepIndex={oneeGuide.currentStepIndex}
        totalSteps={oneeGuide.totalSteps}
        targetRect={oneeGuide.targetRect}
        isStepCompleted={oneeGuide.isCurrentStepCompleted}
        isValidationError={oneeGuide.isValidationError}
        validationMessage={oneeGuide.validationMessage}
        prefersReducedMotion={oneeGuide.prefersReducedMotion}
        isActive={oneeGuide.isActive}
        onNext={oneeGuide.nextStep}
        onPrev={oneeGuide.prevStep}
        onSkip={oneeGuide.stopGuide}
        onStart={oneeGuide.startGuide}
        onOpenDraftHelper={() => setShowTranscribeModal(true)}
      />
    </main>
  );
};

export default CyberReport;
