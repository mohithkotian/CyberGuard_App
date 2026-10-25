import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { complaintsAPI } from '../services/api';
import useTranslationStore from '../hooks/useTranslationStore';

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

const CATEGORY_STYLES = {
  'Phishing': { color: '#FFB800', bg: 'rgba(255, 184, 0, 0.15)', border: 'rgba(255, 184, 0, 0.4)' },
  'Financial Fraud': { color: '#00B4FF', bg: 'rgba(0, 180, 255, 0.15)', border: 'rgba(0, 180, 255, 0.4)' },
  'Ransomware': { color: '#FF3366', bg: 'rgba(255, 51, 102, 0.15)', border: 'rgba(255, 51, 102, 0.4)' },
  'Identity Theft': { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' },
  'Cyber Bullying': { color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.15)', border: 'rgba(255, 107, 53, 0.4)' },
  'Hacking': { color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.15)', border: 'rgba(156, 39, 176, 0.4)' },
  'Data Breach': { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)' },
  'Online Fraud': { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
  'Child Exploitation': { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' },
  'Women/Child Safety': { color: '#FF2A6D', bg: 'rgba(255, 42, 109, 0.15)', border: 'rgba(255, 42, 109, 0.4)' },
  'DDoS / Network Attacks': { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' },
  'Cryptocurrency Scams': { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  'Other': { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' }
};

const CyberReport = () => {
  const navigate = useNavigate();
  const { t } = useTranslationStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [incidentDateTime, setIncidentDateTime] = useState("");
  const [modusOperandi, setModusOperandi] = useState("");
  const [lostMoney, setLostMoney] = useState(false);
  const [incidentOccurredWhere, setIncidentOccurredWhere] = useState("");
  const [relationshipWithVictim, setRelationshipWithVictim] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [nationalIdFile, setNationalIdFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userOverrodeCategory, setUserOverrodeCategory] = useState(false);

  const [aiDetection, setAiDetection] = useState(null);
  const [analysis, setAnalysis] = useState({ label: "READY", color: "var(--muted)" });

  const [pincode, setPincode] = useState("");
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [showAreaSearch, setShowAreaSearch] = useState(false);
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobile, setMobile] = useState("");

  // 🔍 Real-time Advanced AI Neural Analysis on title + description
  useEffect(() => {
    const fullText = `${title} ${description}`.trim();
    if (fullText.length < 10) {
      setAnalysis({ label: "AWAITING DETAILS", color: "rgba(255,255,255,0.4)" });
      setAiDetection(null);
      return;
    }

    setAnalysis({ label: "SCANNING THREAT SIGNATURES...", color: "var(--electric)" });

    const timer = setTimeout(async () => {
      try {
        const { data } = await complaintsAPI.analyze(fullText);
        if (data.status === 'success' && data.data) {
          const res = data.data;
          const detectedCategory = res.category || 'Other';
          const detectedSub = res.subcategory || (SUBCATEGORIES_BY_CATEGORY[detectedCategory]?.[0] || 'General Incident');
          const confPercent = Math.round((res.confidence || 0.85) * 100);
          const style = CATEGORY_STYLES[detectedCategory] || CATEGORY_STYLES['Other'];

          setAiDetection({
            category: detectedCategory,
            subcategory: detectedSub,
            confidence: confPercent,
            severity: res.severity || 'high',
            style
          });

          setAnalysis({
            label: `${detectedCategory.toUpperCase()} DETECTED (${confPercent}%)`,
            color: style.color
          });

          // Auto-apply AI categorization if user hasn't manually selected yet
          if (!userOverrodeCategory || !category) {
            setCategory(detectedCategory);
            setSubCategory(detectedSub);
          }
        }
      } catch (err) {
        console.warn("AI Analysis local fallback active", err);
        setAnalysis({ label: "AI ONLINE (HYBRID)", color: "var(--electric)" });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description, userOverrodeCategory, category]);

  const handleApplyAiSuggestion = () => {
    if (aiDetection) {
      setCategory(aiDetection.category);
      setSubCategory(aiDetection.subcategory);
      setUserOverrodeCategory(false);
      toast.success(`Applied AI Category: ${aiDetection.category} 🤖`);
    }
  };

  // 📍 High-Precision Reverse Geocoding with OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || data.address.state_district || 'Local Area';
        const state = data.address.state || '';
        const postcode = data.address.postcode || '';
        return { city, state, postcode, displayName: data.display_name };
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
    return null;
  };

  // 📍 Geocode 6-Digit Indian PIN Code with Postal Service & Nominatim
  const geocodePincode = async (pin) => {
    if (!pin || pin.length !== 6) return;
    setGettingLocation(true);
    try {
      // 1. Try Nominatim postal search
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json`);
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        const match = nomData[0];
        const lat = parseFloat(match.lat);
        const lng = parseFloat(match.lon);
        const parts = match.display_name.split(',').map(s => s.trim());
        const area = parts[1] || parts[0];
        const state = parts[parts.length - 2] || 'India';
        
        setLocation({
          lat,
          lng,
          city: area,
          region: state
        });
        setGettingLocation(false);
        toast.success(`📍 PIN ${pin} Located: ${area}, ${state}`);
        return;
      }

      // 2. Postal PIN Code fallback
      const pinRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const pinData = await pinRes.json();
      if (pinData && pinData[0]?.Status === 'Success' && pinData[0]?.PostOffice?.length > 0) {
        const po = pinData[0].PostOffice[0];
        const district = po.District;
        const state = po.State;
        
        // Search city coordinates
        const citySearchRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(district + ', ' + state + ', India')}&format=json`);
        const citySearchData = await citySearchRes.json();
        const lat = citySearchData?.[0]?.lat ? parseFloat(citySearchData[0].lat) : 12.97;
        const lng = citySearchData?.[0]?.lon ? parseFloat(citySearchData[0].lon) : 77.59;
        
        setLocation({
          lat,
          lng,
          city: `${po.Name}, ${district}`,
          region: state
        });
        setGettingLocation(false);
        toast.success(`📍 PIN ${pin} Located: ${po.Name}, ${district}`);
        return;
      }
    } catch (err) {
      console.warn("PIN geocode failed", err);
    }
    setGettingLocation(false);
  };

  // 📍 Search by Area / City Name (e.g. Udupi, Indiranagar, Mangalore, Bandra)
  const handleSearchArea = async () => {
    if (!areaSearchQuery || areaSearchQuery.trim().length < 2) {
      toast.error("Please enter a city or area name to search");
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

        setLocation({
          lat,
          lng,
          city,
          region: state
        });
        if (postcode && /^\d{6}$/.test(postcode)) {
          setPincode(postcode);
        }
        setShowAreaSearch(false);
        setGettingLocation(false);
        toast.success(`📍 Location Locked: ${city}, ${state}`);
        return;
      } else {
        toast.error(`No results found for "${areaSearchQuery}". Please try another landmark or city.`);
      }
    } catch (err) {
      toast.error("Area search service error. Please try again.");
    }
    setGettingLocation(false);
  };

  const fallbackIpLocation = async () => {
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        setLocation({
          lat: data.latitude,
          lng: data.longitude,
          city: data.city,
          region: data.region
        });
        setGettingLocation(false);
        toast.success(`Network location locked: ${data.city || 'Detected'}, ${data.region || ''} 🌐`);
        return true;
      }
    } catch (e) {
      console.warn("ipwho.is lookup failed", e);
    }
    setGettingLocation(false);
    toast.info("Please enter your 6-digit PIN code or search for your city directly.");
    return false;
  };

  const handleGetLocation = () => {
    setGettingLocation(true);

    if (!navigator.geolocation) {
      if (pincode && pincode.length === 6) {
        geocodePincode(pincode);
      } else {
        fallbackIpLocation();
      }
      return;
    }

    // High Accuracy GPS Mode
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const geo = await reverseGeocode(lat, lng);
        if (geo) {
          setLocation({
            lat,
            lng,
            city: geo.city,
            region: geo.state
          });
          if (geo.postcode && /^\d{6}$/.test(geo.postcode)) {
            setPincode(geo.postcode);
          }
          setGettingLocation(false);
          toast.success(`📍 Exact Location Locked: ${geo.city}, ${geo.state}`);
        } else {
          setLocation({ lat, lng });
          setGettingLocation(false);
          toast.success(`📍 High-Precision GPS Locked: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      },
      (error) => {
        console.warn("High-accuracy GPS request failed/denied:", error.message);
        if (pincode && pincode.length === 6) {
          geocodePincode(pincode);
        } else {
          fallbackIpLocation();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // 📁 File Upload handling
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 5));
    toast.success(`${acceptedFiles.length} file(s) attached. AI OCR analyzer primed! 🖼️`);
  }, []);

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
    if (!title || title.length < 5) {
      return toast.error("Title must be at least 5 characters");
    }
    if (!description || description.length < 20) {
      return toast.error("Description must be at least 20 characters");
    }
    if (!incidentDateTime) {
      return toast.error("Please select incident date and time");
    }
    if (!pincode || pincode.length !== 6) {
      return toast.error("Please enter a valid 6-digit PIN code");
    }

    setIsSubmitting(true);

    try {
      const finalCategory = category || aiDetection?.category || 'Other';
      const finalSubCategory = subCategory || aiDetection?.subcategory || (SUBCATEGORIES_BY_CATEGORY[finalCategory]?.[0] || 'General');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', finalCategory);
      formData.append('subCategory', finalSubCategory);
      formData.append('modusOperandi', modusOperandi || 'Phishing / Digital Fraud');
      formData.append('lostMoney', lostMoney);
      formData.append('relationshipWithVictim', relationshipWithVictim || 'Self');

      formData.append('victimDetails', JSON.stringify({ 
        incidentDate: incidentDateTime,
        incidentOccurredWhere,
        pincode,
        location: pincode,
        email,
        countryCode,
        mobile
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

      await complaintsAPI.create(formData);

      toast.success(`Incident logged under [${finalCategory}] & projected on Live Map 🚀`, { duration: 5000 });

      // Reset form
      setTitle("");
      setDescription("");
      setIncidentDateTime("");
      setCategory("");
      setSubCategory("");
      setModusOperandi("");
      setLostMoney(false);
      setIncidentOccurredWhere("");
      setRelationshipWithVictim("");
      setPincode("");
      setLocation(null);
      setFiles([]);
      setNationalIdFile(null);
      setAiDetection(null);
      setUserOverrodeCategory(false);
      setAnalysis({ label: "READY", color: "var(--muted)" });

      navigate('/complaints');
    } catch (err) {
      console.error(err.response?.data);
      const msg = err.response?.data?.message || "Submission failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSubcategories = SUBCATEGORIES_BY_CATEGORY[category] || [
    'General Incident',
    'Other'
  ];

  return (
    <section style={{ 
      maxWidth: '1040px', 
      margin: '0 auto', 
      padding: '80px 24px', 
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Liquid Back Button */}
      <button 
        onClick={() => navigate('/')}
        style={{ 
          position: 'fixed',
          left: '40px',
          top: '40px',
          width: 50, height: 50, borderRadius: '50%', 
          background: 'rgba(255,255,255,0.05)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', 
          color: '#00B4FF', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>

      {/* Main Liquid Glass Container */}
      <div style={{ 
        width: '100%',
        background: 'rgba(10, 15, 30, 0.45)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '50px 60px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Accents */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0, 180, 255, 0.15) 0%, transparent 70%)', zIndex: -1 }}></div>
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)', zIndex: -1 }}></div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '3.2rem', 
            margin: '0 0 12px 0', 
            fontWeight: 800,
            background: 'linear-gradient(to bottom, #fff 30%, rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
            fontFamily: 'Inter, sans-serif'
          }}>
            {t('REPORT.TITLE', 'Report Cybercrime')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', fontWeight: 400 }}>
            {t('REPORT.SUBTITLE', 'Neural AI-assisted incident categorization & forensic intake')}
          </p>
        </div>

        {/* AI Insight Live Bar */}
        {aiDetection && (
          <div style={{
            background: aiDetection.style.bg,
            border: `1px solid ${aiDetection.style.border}`,
            borderRadius: '20px',
            padding: '16px 24px',
            marginBottom: '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 25px ${aiDetection.style.color}22`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ 
                width: '12px', height: '12px', borderRadius: '50%', 
                background: aiDetection.style.color, 
                boxShadow: `0 0 14px ${aiDetection.style.color}` 
              }}></span>
              <div>
                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>AI DETECTED:</span>
                  <span style={{ color: aiDetection.style.color }}>{aiDetection.category}</span>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', color: '#fff' }}>
                    {aiDetection.confidence}% Match
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '3px' }}>
                  Sub-Type: <strong>{aiDetection.subcategory}</strong> • Severity: <span style={{ textTransform: 'uppercase', color: aiDetection.style.color }}>{aiDetection.severity}</span>
                </div>
              </div>
            </div>
            {category !== aiDetection.category && (
              <button
                type="button"
                onClick={handleApplyAiSuggestion}
                style={{
                  background: aiDetection.style.color,
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${aiDetection.style.color}44`
                }}
              >
                Sync with AI Suggestion ⚡
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gap: '35px' }}>
          {/* INCIDENT DETAILS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>
                {t('REPORT.INCIDENT_TITLE', 'Incident Title *')}
              </label>
              <input
                type="text"
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '16px', outline: 'none', transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                className="liquid-input"
                placeholder={t('REPORT.TITLE_PLACEHOLDER', 'e.g. Microsoft 365 Phishing email / Unauthorized UPI debit')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* DESCRIPTION */}
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>
                Detailed Narrative & Threat Context *
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  style={{ 
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '20px',
                    paddingBottom: '55px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    height: '190px',
                    resize: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: '1.6'
                  }}
                  placeholder="Describe what occurred in detail. You can paste phishing email headers, OTP scam details, ransomware notes, suspect links, or threat communications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div style={{ 
                  position: 'absolute',
                  bottom: '15px',
                  right: '15px',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(12px)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: analysis.color,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: `1px solid ${analysis.color}44`,
                  boxShadow: `0 4px 12px rgba(0,0,0,0.3)`
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: analysis.color, boxShadow: `0 0 12px ${analysis.color}` }}></span>
                  AI ANALYZER: {analysis.label}
                </div>
              </div>
            </div>
            
            {/* CATEGORY DROPDOWN */}
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>
                {t('REPORT.CATEGORY', 'Category of Cybercrime *')}
              </label>
              <select
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '15px', outline: 'none', transition: '0.3s', WebkitAppearance: 'none', cursor: 'pointer' }}
                className="liquid-input"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setUserOverrodeCategory(true);
                  const firstSub = SUBCATEGORIES_BY_CATEGORY[e.target.value]?.[0] || 'General';
                  setSubCategory(firstSub);
                }}
              >
                <option value="" style={{ color: '#000' }}>Select Category</option>
                {Object.keys(SUBCATEGORIES_BY_CATEGORY).map((catName) => (
                  <option key={catName} value={catName} style={{ color: '#000' }}>
                    {catName}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBCATEGORY DROPDOWN */}
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>
                Sub-Category of Cybercrime *
              </label>
              <select
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '15px', outline: 'none', transition: '0.3s', WebkitAppearance: 'none', cursor: 'pointer' }}
                className="liquid-input"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                <option value="" style={{ color: '#000' }}>Select Sub-Category</option>
                {currentSubcategories.map((sub) => (
                  <option key={sub} value={sub} style={{ color: '#000' }}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Date & Time of Incident *
              </label>
              <input
                type="datetime-local"
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '15px', outline: 'none', transition: '0.3s', colorScheme: 'dark' }}
                className="liquid-input"
                value={incidentDateTime}
                onChange={(e) => setIncidentDateTime(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>Modus Operandi</label>
              <select
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '15px', outline: 'none', transition: '0.3s', WebkitAppearance: 'none', cursor: 'pointer' }}
                className="liquid-input"
                value={modusOperandi}
                onChange={(e) => setModusOperandi(e.target.value)}
              >
                <option value="" style={{ color: '#000' }}>Select Modus Operandi</option>
                <option value="Phishing Websites & Spoofed SSO" style={{ color: '#000' }}>Phishing Websites & Spoofed SSO</option>
                <option value="UPI / QR Code Fraud" style={{ color: '#000' }}>UPI / QR Code Fraud</option>
                <option value="Ransomware & Malware Delivery" style={{ color: '#000' }}>Ransomware & Malware Delivery</option>
                <option value="SIM Swap & Identity Theft" style={{ color: '#000' }}>SIM Swap & Identity Theft</option>
                <option value="Android Malware & Hosting" style={{ color: '#000' }}>Android Malware & Hosting</option>
                <option value="Digital Arrest & Extortion" style={{ color: '#000' }}>Digital Arrest & Extortion</option>
                <option value="Investment Scam - Stock Market / Crypto" style={{ color: '#000' }}>Investment Scam - Stock Market / Crypto</option>
                <option value="Loan Apps Extortion" style={{ color: '#000' }}>Loan Apps Extortion</option>
                <option value="E-Commerce & Booking Scams" style={{ color: '#000' }}>E-Commerce & Booking Scams</option>
                <option value="Impersonation & Deepfakes" style={{ color: '#000' }}>Impersonation & Deepfakes</option>
                <option value="Others" style={{ color: '#000' }}>Others</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>Have You Lost Money in INR?</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: !lostMoney ? '#fff' : 'rgba(255,255,255,0.4)' }}>No</span>
                <div 
                  onClick={() => setLostMoney(!lostMoney)}
                  style={{ width: '50px', height: '26px', background: lostMoney ? '#00B4FF' : 'rgba(255,255,255,0.2)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                >
                  <div style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: lostMoney ? '26px' : '2px', transition: '0.3s' }}></div>
                </div>
                <span style={{ color: lostMoney ? '#00B4FF' : 'rgba(255,255,255,0.4)' }}>Yes</span>
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>Where did the Incident Occur?</label>
              <select
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '15px', outline: 'none', transition: '0.3s', WebkitAppearance: 'none', cursor: 'pointer' }}
                className="liquid-input"
                value={incidentOccurredWhere}
                onChange={(e) => setIncidentOccurredWhere(e.target.value)}
              >
                <option value="" style={{ color: '#000' }}>Select Platform</option>
                <option value="Email" style={{ color: '#000' }}>Email</option>
                <option value="Website URL" style={{ color: '#000' }}>Website URL</option>
                <option value="WhatsApp" style={{ color: '#000' }}>WhatsApp</option>
                <option value="Telegram" style={{ color: '#000' }}>Telegram</option>
                <option value="Instagram" style={{ color: '#000' }}>Instagram</option>
                <option value="Facebook" style={{ color: '#000' }}>Facebook</option>
                <option value="LinkedIn" style={{ color: '#000' }}>LinkedIn</option>
                <option value="Mobile App" style={{ color: '#000' }}>Mobile App</option>
                <option value="SMS / Text Message" style={{ color: '#000' }}>SMS / Text Message</option>
                <option value="Twitter / X" style={{ color: '#000' }}>Twitter / X</option>
                <option value="Youtube" style={{ color: '#000' }}>Youtube</option>
                <option value="Other Media" style={{ color: '#000' }}>Other Media</option>
              </select>
            </div>
          </div>
          
          {/* LOCATION GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingLeft: '4px' }}>
                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Pin Code</label>
                <span style={{ fontSize: '11px', color: '#00B4FF', cursor: 'pointer' }} onClick={() => pincode && geocodePincode(pincode)}>
                  {pincode?.length === 6 ? '⚡ Auto-Geocoded' : 'Enter 6-digit PIN'}
                </span>
              </div>
              <input
                type="text"
                style={{ 
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
                placeholder="6-digit PIN (e.g. 560001)"
                value={pincode}
                maxLength={6}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPincode(val);
                  if (val.length === 6) {
                    geocodePincode(val);
                  }
                }}
                onBlur={() => {
                  if (pincode?.length === 6) {
                    geocodePincode(pincode);
                  }
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingLeft: '4px' }}>
                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Geospatial Threat Map Tag</label>
                <button
                  type="button"
                  onClick={() => setShowAreaSearch(!showAreaSearch)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00B4FF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {showAreaSearch ? '✕ Close Search' : '🔍 Search City / Area'}
                </button>
              </div>

              {showAreaSearch ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter city or locality (e.g. Udupi, Indiranagar, Mangalore)..."
                    value={areaSearchQuery}
                    onChange={(e) => setAreaSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchArea();
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid #00B4FF',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchArea}
                    style={{
                      background: 'linear-gradient(135deg, #00B4FF, #0070F3)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '0 20px',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Locate
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleGetLocation}
                  style={{ 
                    background: location ? 'rgba(0, 180, 255, 0.1)' : 'rgba(255,255,255,0.03)', 
                    border: location ? '1px solid rgba(0, 180, 255, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                    color: location ? '#00B4FF' : 'rgba(255,255,255,0.7)',
                    padding: '16px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    height: '54px',
                    boxShadow: location ? '0 0 20px rgba(0, 180, 255, 0.2)' : 'none'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = location ? 'rgba(0, 180, 255, 0.15)' : 'rgba(255,255,255,0.08)'}
                  onMouseOut={e => e.currentTarget.style.background = location ? 'rgba(0, 180, 255, 0.1)' : 'rgba(255,255,255,0.03)'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {gettingLocation 
                    ? "ACQUIRING SATELLITE GPS..." 
                    : location 
                      ? (location.city ? `📍 ${location.city.toUpperCase()}, ${location.region || ''} (${location.lat.toFixed(2)}, ${location.lng.toFixed(2)})` : `📍 GPS LOCKED (${location.lat.toFixed(2)}, ${location.lng.toFixed(2)})`) 
                      : "CAPTURE LIVE GPS / PIN MAP"}
                </div>
              )}
            </div>
          </div>

          {/* CONTACT INFO GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>Email Address</label>
              <input
                type="email"
                style={{ 
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
                placeholder="victim@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>Mobile Number</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  style={{ 
                    width: '80px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                  placeholder="+91"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                />
                <input
                  type="text"
                  style={{ 
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>

          {/* EVIDENCE SECTION */}
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px dashed rgba(255,255,255,0.15)', 
            borderRadius: '24px', 
            padding: '30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Image Evidence & Screenshots (AI OCR Enabled)
              </label>
              <span style={{ fontSize: '11px', color: '#00B4FF', background: 'rgba(0, 180, 255, 0.1)', padding: '4px 10px', borderRadius: '10px' }}>
                Auto-Extracts UPIs, Phone Numbers & Accounts
              </span>
            </div>
            
            <div 
              {...getRootProps()} 
              style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                borderRadius: '16px',
                border: isDragActive ? '1px solid #00B4FF' : 'none',
                background: isDragActive ? 'rgba(0,180,255,0.05)' : 'transparent',
                transition: '0.3s'
              }}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.7 }}>🖼️</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px' }}>
                Drag & Drop screenshots of phishing emails, transaction receipts, WhatsApp threats, or ransomware screens
              </p>
              <button 
                type="button"
                onClick={open}
                style={{ 
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: '0.3s',
                  boxShadow: '0 8px 16px rgba(255,255,255,0.1)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(255,255,255,0.2)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(255,255,255,0.1)';
                }}
              >
                Browse Files
              </button>
            </div>

            {/* PREVIEWS */}
            {files.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '8px 14px', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    fontSize: '13px',
                    color: '#fff',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <span>📎</span>
                    <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>
                      {file.name}
                    </span>
                    <button 
                      onClick={() => removeFile(idx)}
                      style={{ background: 'rgba(255,59,48,0.2)', border: 'none', color: '#FF3B30', cursor: 'pointer', padding: '2px', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLAINANT DETAILS SECTION */}
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px dashed rgba(255,255,255,0.1)', 
            borderRadius: '24px', 
            padding: '30px'
          }}>
            <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', display: 'block' }}>Complainant Verification</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>Relationship with the Victim *</label>
                <select
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '15px', outline: 'none', transition: '0.3s', WebkitAppearance: 'none', cursor: 'pointer' }}
                  className="liquid-input"
                  value={relationshipWithVictim}
                  onChange={(e) => setRelationshipWithVictim(e.target.value)}
                >
                  <option value="" style={{ color: '#000' }}>Select Relationship</option>
                  <option value="Self" style={{ color: '#000' }}>Self</option>
                  <option value="Father" style={{ color: '#000' }}>Father</option>
                  <option value="Mother" style={{ color: '#000' }}>Mother</option>
                  <option value="Husband" style={{ color: '#000' }}>Husband</option>
                  <option value="Wife" style={{ color: '#000' }}>Wife</option>
                  <option value="Son" style={{ color: '#000' }}>Son</option>
                  <option value="Daughter" style={{ color: '#000' }}>Daughter</option>
                  <option value="Brother" style={{ color: '#000' }}>Brother</option>
                  <option value="Sister" style={{ color: '#000' }}>Sister</option>
                  <option value="Friend" style={{ color: '#000' }}>Friend</option>
                  <option value="Corporate Representative" style={{ color: '#000' }}>Corporate Representative</option>
                  <option value="Lawyer" style={{ color: '#000' }}>Lawyer</option>
                  <option value="Others" style={{ color: '#000' }}>Others</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>National ID Verification (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{
                    background: '#fff', color: '#000', padding: '10px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: '0.3s', boxShadow: '0 8px 16px rgba(255,255,255,0.1)'
                  }}>
                    Upload ID
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      accept=".jpg,.jpeg,.png,.pdf" 
                      onChange={(e) => setNationalIdFile(e.target.files[0])}
                    />
                  </label>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {nationalIdFile ? nationalIdFile.name : "no document chosen"}
                  </span>
                </div>
                <div style={{ color: '#A855F7', fontSize: '12px', marginTop: '8px' }}>Aadhaar / PAN / Passport / Corporate ID (Max 5MB)</div>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #00B4FF 0%, #A855F7 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                padding: '20px',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 15px 35px rgba(0, 180, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 180, 255, 0.5)';
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 180, 255, 0.3)';
              }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  {t('REPORT.SUBMITTING', 'ANALYZING & FILING CASE ON CHAIN...')}
                </div>
              ) : t('REPORT.SUBMIT', 'AUTHENTICATE & SUBMIT COMPLAINT')}
              
              {/* Shine effect */}
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shine 3s infinite' }}></div>
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes shine { 0% { left: -100%; } 100% { left: 200%; } }
          
          .liquid-input:focus {
            background: rgba(255,255,255,0.06) !important;
            border-color: rgba(0, 180, 255, 0.5) !important;
            box-shadow: 0 0 0 4px rgba(0, 180, 255, 0.15), inset 0 2px 4px rgba(0,0,0,0.2) !important;
          }

          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.5;
            cursor: pointer;
          }
        `}
      </style>
    </section>
  );
};

export default CyberReport;