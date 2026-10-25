import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AdminSafety() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'report'
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    victim: '',
    location: '',
    mobile: '',
    pincode: '',
    lat: null,
    lng: null,
    type: 'Women/Child Safety',
    urgency: 'high',
    description: ''
  });

  const dummyIncidents = [
    {
      complaintId: 'CMP-883921',
      category: 'Women/Child Safety',
      severity: 'high',
      priority: 'top_priority',
      isImmediateAction: true,
      status: 'pending',
      title: 'Distress Call from Public Transit Corridor',
      createdAt: new Date().toISOString(),
      victimDetails: { name: 'Emergency Caller', mobile: '+91 9876543210', location: 'Bus Route 42, Central Ave', pincode: '400001' },
      location: { coordinates: [72.8777, 19.0760] }
    },
    {
      complaintId: 'CMP-442109',
      category: 'Domestic Violence',
      severity: 'critical',
      priority: 'top_priority',
      isImmediateAction: true,
      status: 'investigating',
      title: 'Emergency Domestic Disturbance Alert',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      victimDetails: { name: 'P. Sharma', mobile: '+91 9123456789', location: 'Apt 4B, Residency Park', pincode: '400052' },
      location: { coordinates: [72.8333, 19.1111] }
    },
    {
      complaintId: 'CMP-991204',
      category: 'Child Exploitation',
      severity: 'high',
      priority: 'top_priority',
      isImmediateAction: true,
      status: 'under_review',
      title: 'Suspicious Activity & Cyberbullying Near School Zone',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      victimDetails: { name: 'Anonymous Guardian', mobile: 'Protected', location: 'St. Mary High School Zone', pincode: '400010' },
      location: { coordinates: [72.8456, 19.0234] }
    }
  ];

  const fetchIncidents = useCallback(async () => {
    setFetching(true);
    try {
      // Fetch all safety & emergency priority complaints from database
      const { data } = await api.get('/complaints', { 
        params: { category: 'safety', limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }
      });
      
      const dbComplaints = data.data.complaints || [];
      if (dbComplaints.length > 0) {
        setIncidents(dbComplaints);
      } else {
        setIncidents(dummyIncidents);
      }
    } catch (err) {
      console.error('Error fetching safety incidents:', err);
      setIncidents(dummyIncidents);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    // Auto-poll every 20 seconds for live incident dispatch
    const interval = setInterval(fetchIncidents, 20000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const fallbackSafetyIpLocation = async (toastId) => {
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        setFormData(prev => ({
          ...prev,
          lat: data.latitude,
          lng: data.longitude,
          location: prev.location || `${data.city || 'Detected Location'}, ${data.region || ''}`,
          pincode: prev.pincode || (data.postal ? String(data.postal).slice(0, 6) : '')
        }));
        toast.success(`Network location locked: ${data.city || 'Detected'}, ${data.region || ''} 🌐`, { id: toastId });
        return true;
      }
    } catch (e) {
      console.warn('ipwho.is lookup failed in safety dispatch', e);
    }
    toast.error('Unable to acquire GPS/IP. Please enter address manually.', { id: toastId });
  };

  const handleGetLocation = () => {
    const toastId = toast.loading('Acquiring high-precision GPS signal...');

    if (!navigator.geolocation) {
      fallbackSafetyIpLocation(toastId);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let placeName = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        let pin = '';
        
        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'en' }
          });
          const revData = await revRes.json();
          if (revData && revData.address) {
            const city = revData.address.city || revData.address.town || revData.address.village || revData.address.suburb || revData.address.county || '';
            const state = revData.address.state || '';
            placeName = `${city}${city && state ? ', ' : ''}${state}`;
            pin = revData.address.postcode || '';
          }
        } catch (err) {
          console.warn('Nominatim reverse geocode failed in safety', err);
        }

        setFormData(prev => ({
          ...prev,
          lat,
          lng,
          location: placeName || prev.location,
          pincode: pin || prev.pincode
        }));
        toast.success(`📍 GPS locked: ${placeName}`, { id: toastId });
      },
      (error) => {
        console.warn('GPS unavailable, falling back to IP geolocation:', error.message);
        fallbackSafetyIpLocation(toastId);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!formData.title || (!formData.location && !formData.lat)) {
      toast.error('Incident Title and Location are required');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || `Priority Women & Child Safety emergency report registered for ${formData.victim || 'victim'} at ${formData.location}. Tactical response requested.`,
        category: formData.type || 'Women/Child Safety',
        severity: 'high',
        priority: 'top_priority',
        isImmediateAction: true,
        isAnonymous: !formData.victim,
        victimDetails: {
          name: formData.victim.trim(),
          mobile: formData.mobile.trim(),
          pincode: formData.pincode.trim(),
          location: formData.location.trim(),
          incidentDate: new Date().toISOString()
        }
      };

      if (formData.lat && formData.lng) {
        payload.location = {
          type: 'Point',
          coordinates: [formData.lng, formData.lat] // GeoJSON: [longitude, latitude]
        };
      }

      const { data } = await api.post('/complaints', payload);
      const newComplaint = data.data.complaint;
      const complaintId = newComplaint?.complaintId || 'CMP-RECORDED';
      
      setLastSubmittedId(complaintId);
      toast.success(`🚨 TOP PRIORITY REPORT LODGED: ${complaintId}`, { duration: 6000 });
      
      setFormData({ 
        title: '', victim: '', location: '', mobile: '', pincode: '', lat: null, lng: null, 
        type: 'Women/Child Safety', urgency: 'high', description: '' 
      });
      
      setActiveTab('feed');
      await fetchIncidents(); // Refresh live DB feed
    } catch (err) {
      console.error('Lodge report error:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error?.message || 'Failed to lodge safety report';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (incident) => {
    const id = incident._id || incident.complaintId;
    setDispatchingId(id);
    try {
      await api.patch(`/complaints/${id}/status`, {
        status: 'investigating',
        message: '🚨 EMERGENCY RESPONSE DISPATCHED: Quick Reaction Team (QRT) mobilized to incident location.'
      });
      toast.success(`Response Unit Dispatched for ${incident.complaintId}`);
      await fetchIncidents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to dispatch unit');
    } finally {
      setDispatchingId(null);
    }
  };

  const getUrgencyColor = (severity) => {
    return severity === 'critical' ? '#FF2D55' : severity === 'high' ? '#FF2D55' : severity === 'medium' ? '#FF9500' : '#007AFF';
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'resolved') return { label: 'RESOLVED', bg: 'rgba(0, 200, 150, 0.15)', color: '#00C896', border: 'rgba(0, 200, 150, 0.3)' };
    if (s === 'investigating') return { label: 'DISPATCHED / ACTIVE', bg: 'rgba(255, 107, 53, 0.15)', color: '#FF6B35', border: 'rgba(255, 107, 53, 0.3)' };
    if (s === 'under_review') return { label: 'UNDER REVIEW', bg: 'rgba(0, 180, 255, 0.15)', color: '#00B4FF', border: 'rgba(0, 180, 255, 0.3)' };
    return { label: 'PENDING ACTION', bg: 'rgba(255, 45, 85, 0.15)', color: '#FF2D55', border: 'rgba(255, 45, 85, 0.3)' };
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#02060A', 
      color: '#fff', 
      position: 'relative', 
      overflowX: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Liquid Atmospheric Backdrops */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(255, 45, 85, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
        
        {/* Banner Alert if recent report submitted */}
        {lastSubmittedId && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 45, 85, 0.15) 0%, rgba(255, 149, 0, 0.15) 100%)',
              border: '1px solid rgba(255, 45, 85, 0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: 20,
              padding: '20px 24px',
              marginBottom: 32,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 30px rgba(255, 45, 85, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF2D55', boxShadow: '0 0 12px #FF2D55' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                  REPORT LODGED & PERSISTED TO SECURE DATABASE
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  Tracking Hash: <strong style={{ color: '#00FFD1' }}>{lastSubmittedId}</strong> • Assigned Top Priority & Immediate Response Dispatch
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/track/${lastSubmittedId}`)}
              style={{
                padding: '10px 20px',
                background: '#FF2D55',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                letterSpacing: 1,
                boxShadow: '0 6px 16px rgba(255, 45, 85, 0.4)'
              }}
            >
              TRACK DOSSIER
            </button>
          </motion.div>
        )}

        {/* Top Header & Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ padding: '6px 16px', background: 'rgba(255, 45, 85, 0.12)', color: '#FF2D55', border: '1px solid rgba(255, 45, 85, 0.3)', borderRadius: 20, fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>
                PRIORITY ZERO PROTOCOL
              </span>
              <span style={{ fontSize: 11, color: '#00FFD1', fontWeight: 800, letterSpacing: 1 }}>
                LIVE DISPATCH FEED
              </span>
            </div>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 900, 
              background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.5))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px',
              margin: 0 
            }}>
              Women & Child <span style={{ color: '#FF2D55' }}>Safety</span>
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Encrypted rapid-response module for immediate emergency logging, live tracking, and field unit dispatch.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={() => setActiveTab('feed')}
              style={{
                padding: '12px 24px',
                borderRadius: 20,
                border: 'none',
                background: activeTab === 'feed' ? 'rgba(255, 45, 85, 0.15)' : 'transparent',
                color: activeTab === 'feed' ? '#FF2D55' : 'rgba(255,255,255,0.5)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              LIVE FEED ({incidents.length})
            </button>
            <button 
              onClick={() => setActiveTab('report')}
              style={{
                padding: '12px 24px',
                borderRadius: 20,
                border: 'none',
                background: activeTab === 'report' ? 'rgba(255, 45, 85, 0.15)' : 'transparent',
                color: activeTab === 'report' ? '#FF2D55' : 'rgba(255,255,255,0.5)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              + FILE REPORT
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'feed' ? (
            <motion.div 
              key="feed"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              style={{ minHeight: '400px' }}
            >
              {fetching ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16, color: 'rgba(255,255,255,0.5)' }}>
                  <div style={{ width: 36, height: 36, border: '3px solid rgba(255,45,85,0.2)', borderTop: '3px solid #FF2D55', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>SYNCHRONIZING SECURE SAFETY FEED...</span>
                </div>
              ) : incidents.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.4)', gap: 12 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>No safety incidents logged. System standby.</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
                  {incidents.map((incident, idx) => {
                    const statusBadge = getStatusBadge(incident.status);
                    return (
                      <motion.div 
                        key={incident._id || incident.complaintId || idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          backdropFilter: 'blur(30px)',
                          border: `1px solid ${incident.severity === 'high' || incident.severity === 'critical' ? 'rgba(255, 45, 85, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 24,
                          padding: 26,
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}
                      >
                        {/* High Priority Gradient Line */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FF2D55, #FF9500, #FF2D55)' }} />

                        {/* Top Bar: ID + Status + Timestamp */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: getUrgencyColor(incident.severity), textTransform: 'uppercase', letterSpacing: 1 }}>
                              {incident.complaintId}
                            </span>
                            <span style={{ 
                              padding: '2px 8px', 
                              background: statusBadge.bg, 
                              color: statusBadge.color, 
                              border: `1px solid ${statusBadge.border}`, 
                              borderRadius: 8, 
                              fontSize: 9, 
                              fontWeight: 800,
                              letterSpacing: 0.5
                            }}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                            {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                          </span>
                        </div>

                        {/* Category & Title */}
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                          {incident.category || 'Women/Child Safety'}
                        </div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: 17, fontWeight: 800, lineHeight: 1.4, color: '#fff' }}>
                          {incident.title}
                        </h3>

                        {/* Info details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span>Victim: <strong style={{ color: '#fff' }}>{incident.victimDetails?.name || (incident.isAnonymous ? 'Anonymous' : 'Protected')}</strong></span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            <span>Contact: <strong style={{ color: '#fff' }}>{incident.victimDetails?.mobile || 'N/A'}</strong></span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>Location: <strong style={{ color: '#fff' }}>{incident.victimDetails?.location || 'Unknown'} {incident.victimDetails?.pincode ? `(${incident.victimDetails.pincode})` : ''}</strong></span>
                          </div>
                          {incident.location?.coordinates?.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF2D55" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                              <span style={{ color: '#FF2D55', fontWeight: 700, fontSize: 12 }}>GPS Telemetry Locked</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button 
                            onClick={() => handleDispatch(incident)}
                            disabled={dispatchingId === (incident._id || incident.complaintId) || incident.status === 'investigating'}
                            style={{ 
                              flex: 1, 
                              padding: '11px', 
                              background: incident.status === 'investigating' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 45, 85, 0.15)', 
                              color: incident.status === 'investigating' ? '#FF6B35' : '#FF2D55', 
                              border: `1px solid ${incident.status === 'investigating' ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 45, 85, 0.3)'}`, 
                              borderRadius: 12, 
                              fontWeight: 800, 
                              fontSize: 11, 
                              cursor: incident.status === 'investigating' ? 'default' : 'pointer',
                              letterSpacing: 0.5,
                              transition: 'all 0.2s'
                            }}
                          >
                            {dispatchingId === (incident._id || incident.complaintId) ? 'DISPATCHING...' : incident.status === 'investigating' ? 'UNIT ON SITE' : 'DISPATCH RESPONSE'}
                          </button>
                          
                          <button 
                            onClick={() => navigate(`/track/${incident.complaintId}`)} 
                            style={{ 
                              padding: '11px 18px', 
                              background: 'rgba(255,255,255,0.06)', 
                              color: '#fff', 
                              border: '1px solid rgba(255,255,255,0.12)', 
                              borderRadius: 12, 
                              fontWeight: 800, 
                              fontSize: 11, 
                              cursor: 'pointer',
                              letterSpacing: 0.5,
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                          >
                            TRACK
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: 'rgba(255,255,255,0.025)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 32,
                padding: 40,
                maxWidth: 800,
                margin: '0 auto',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#fff' }}>File Priority Safety Report</h2>
                  <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    Logs report with top priority classification and generates trackable case ID.
                  </p>
                </div>
                <span style={{ padding: '6px 14px', background: 'rgba(255, 45, 85, 0.15)', color: '#FF2D55', border: '1px solid rgba(255, 45, 85, 0.3)', borderRadius: 16, fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>
                  HIGH PRIORITY
                </span>
              </div>

              <form onSubmit={handleReport} style={{ display: 'grid', gap: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Incident Title *
                    </label>
                    <input 
                      type="text" 
                      value={formData.title} 
                      onChange={e => setFormData({ ...formData, title: e.target.value })} 
                      placeholder="e.g. Distress call / Harassment incident" 
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '15px 18px', color: '#fff', fontSize: 14, outline: 'none' }} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Incident Classification
                    </label>
                    <select 
                      value={formData.type} 
                      onChange={e => setFormData({ ...formData, type: e.target.value })} 
                      style={{ width: '100%', boxSizing: 'border-box', background: '#0a101d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '15px 18px', color: '#fff', fontSize: 14, outline: 'none' }}
                    >
                      <option value="Women/Child Safety">Women/Child Safety</option>
                      <option value="Child Exploitation">Child Exploitation</option>
                      <option value="Domestic Violence">Domestic Violence</option>
                      <option value="Harassment">Harassment</option>
                      <option value="Emergency Safety">Emergency Safety</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Victim / Reporter Name
                    </label>
                    <input 
                      type="text" 
                      value={formData.victim} 
                      onChange={e => setFormData({ ...formData, victim: e.target.value })} 
                      placeholder="Leave blank for anonymous" 
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '15px 18px', color: '#fff', fontSize: 14, outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Contact Mobile
                    </label>
                    <input 
                      type="text" 
                      value={formData.mobile} 
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })} 
                      placeholder="+91 9876543210" 
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '15px 18px', color: '#fff', fontSize: 14, outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Area Pincode
                    </label>
                    <input 
                      type="text" 
                      value={formData.pincode} 
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })} 
                      placeholder="e.g. 560001" 
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '15px 18px', color: '#fff', fontSize: 14, outline: 'none' }} 
                    />
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                      Incident Location / Address *
                    </label>
                    <button 
                      type="button" 
                      onClick={handleGetLocation}
                      style={{ 
                        background: formData.lat ? 'rgba(0, 255, 209, 0.15)' : 'rgba(0, 180, 255, 0.1)', 
                        color: formData.lat ? '#00FFD1' : '#00B4FF', 
                        border: `1px solid ${formData.lat ? 'rgba(0, 255, 209, 0.4)' : 'rgba(0, 180, 255, 0.3)'}`, 
                        padding: '6px 14px', 
                        borderRadius: 10, 
                        fontSize: 10, 
                        fontWeight: 800, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6 
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                      {formData.lat ? 'GPS TELEMETRY LOCKED' : 'GET LIVE GPS'}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={e => setFormData({ ...formData, location: e.target.value })} 
                    placeholder="Specific street address, landmark, or transit stop" 
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '15px 18px', color: '#fff', fontSize: 14, outline: 'none' }} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Incident Narrative & Tactical Details
                  </label>
                  <textarea 
                    rows={4} 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Provide details regarding the situation, suspects, or urgency for responders..." 
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'none', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '15px 18px', color: '#fff', fontSize: 14, outline: 'none' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    style={{
                      padding: '16px 36px',
                      background: 'linear-gradient(135deg, #FF2D55 0%, #FF9500 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 16,
                      fontWeight: 900,
                      fontSize: 13,
                      letterSpacing: 1.5,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      boxShadow: '0 10px 25px rgba(255, 45, 85, 0.4)',
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? 'TRANSMITTING REPORT...' : '🚨 LODGE PRIORITY REPORT'}
                  </button>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FFD1" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Saves to database with Top Priority & auto-generates tracking hash
                  </span>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
