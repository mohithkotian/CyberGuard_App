import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';

export default function AdminMails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMail, setSelectedMail] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getEmails({ page, limit: 50 });
      if (data.status === 'success') {
        setEmails(data.data.emails);
        setTotal(data.data.total);
      }
    } catch { 
      toast.error('Failed to load communication logs'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchEmails(); 
  }, [page]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmails = useMemo(() => {
    return emails.filter(mail => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (mail.recipient && mail.recipient.toLowerCase().includes(query)) ||
        (mail.recipientPhone && mail.recipientPhone.toLowerCase().includes(query)) ||
        (mail.complaintId && mail.complaintId.toLowerCase().includes(query)) ||
        (mail.subject && mail.subject.toLowerCase().includes(query)) ||
        (mail.body && mail.body.toLowerCase().includes(query)) ||
        (mail.textMessage && mail.textMessage.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterType === 'status') {
        return mail.subject && mail.subject.includes('Status:');
      }
      if (filterType === 'view') {
        return mail.subject && mail.subject.includes('reviewed');
      }
      if (filterType === 'urgent') {
        return mail.subject && mail.subject.includes('URGENT');
      }
      if (filterType === 'otp') {
        return mail.subject && mail.subject.includes('OTP');
      }

      return true;
    });
  }, [emails, searchQuery, filterType]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#02060A', 
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Liquid Atmospheric Accents */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 180, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 255, 170, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />
      
      <div style={{ 
        maxWidth: 1400, 
        margin: '0 auto', 
        padding: '60px 24px 80px',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Header Title Section */}
        <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 180, 255, 0.1)', border: '1px solid rgba(0, 180, 255, 0.25)', borderRadius: '20px', padding: '4px 12px', marginBottom: '12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FFAA', display: 'inline-block', boxShadow: '0 0 8px #00FFAA' }}></span>
              <span style={{ fontSize: '11px', color: '#00B4FF', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>DUAL-CHANNEL DISPATCH GATEWAY</span>
            </div>
            <h1 style={{ 
              fontSize: '2.8rem', 
              fontWeight: 800,
              background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 10px 0',
              letterSpacing: '-1.5px',
              fontFamily: 'Orbitron, monospace'
            }}>
              Network <span style={{ color: '#00B4FF' }}>Mails &amp; SMS</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', fontWeight: 400, margin: 0 }}>
              Integrated communications log tracking both Email alerts and SMS text messages sent to citizens and officers ({total} total logs).
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Total Dispatches</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: 'Orbitron, monospace', marginTop: '2px' }}>{total}</div>
            </div>
            <div style={{ background: 'rgba(0, 180, 255, 0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', borderRadius: '14px', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#00B4FF', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Email &amp; SMS Sync</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#00FFAA', fontFamily: 'Orbitron, monospace', marginTop: '2px' }}>100% ACTIVE</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>⌕</span>
            <input
              type="text"
              placeholder="Search by recipient, phone, complaint ID or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'All Dispatches' },
              { id: 'status', label: 'Status Updates' },
              { id: 'view', label: 'Review Alerts' },
              { id: 'urgent', label: 'Urgent Filings' },
              { id: 'otp', label: 'Security OTPs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                style={{
                  background: filterType === tab.id ? 'rgba(0, 180, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${filterType === tab.id ? 'rgba(0, 180, 255, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: filterType === tab.id ? '#00B4FF' : 'rgba(255, 255, 255, 0.6)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Table Container */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', width: '130px' }}>
                    Timestamp
                  </th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', width: '220px' }}>
                    Recipient
                  </th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', width: '140px' }}>
                    Complaint ID
                  </th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', width: '200px' }}>
                    Subject
                  </th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', width: '290px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Message Body</span>
                      <span style={{ fontSize: '9px', background: 'rgba(0,180,255,0.15)', color: '#00B4FF', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,180,255,0.3)' }}>@ EMAIL</span>
                    </div>
                  </th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', color: '#00FFAA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', width: '310px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Text Message</span>
                      <span style={{ fontSize: '9px', background: 'rgba(0,255,170,0.15)', color: '#00FFAA', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,255,170,0.3)' }}>@ SMS</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontWeight: 800, letterSpacing: '2px' }}>
                      RETRIEVING COMMUNICATIONS LOG...
                    </td>
                  </tr>
                ) : filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 80, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontWeight: 800, letterSpacing: '2px' }}>
                      NO COMMUNICATIONS LOGGED MATCHING CRITERIA
                    </td>
                  </tr>
                ) : filteredEmails.map((mail, i) => {
                  const hasPhone = mail.recipientPhone && mail.recipientPhone.trim().length > 0;
                  const isOtp = mail.subject && mail.subject.includes('OTP');
                  const isUrgent = mail.subject && mail.subject.includes('URGENT');

                  return (
                    <motion.tr 
                      key={mail._id || i} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedMail(mail)}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {mail.sentAt ? format(new Date(mail.sentAt), 'dd MMM yyyy') : 'Recent'}
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                          {mail.sentAt ? format(new Date(mail.sentAt), 'HH:mm:ss') : ''}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, wordBreak: 'break-all' }}>
                          {mail.recipient}
                        </div>
                        {hasPhone ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', background: 'rgba(0,255,170,0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#00FFAA', fontWeight: 600 }}>
                            <span>⌕</span> {mail.recipientPhone}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                            SMS Dispatched via Verified Profile
                          </div>
                        )}
                      </td>

                      {/* Complaint ID */}
                      <td style={{ padding: '20px 24px' }}>
                        {mail.complaintId ? (
                          <div style={{ 
                            background: isUrgent ? 'rgba(255,59,48,0.12)' : 'rgba(0,180,255,0.12)', 
                            border: `1px solid ${isUrgent ? 'rgba(255,59,48,0.3)' : 'rgba(0,180,255,0.3)'}`,
                            color: isUrgent ? '#FF3B30' : '#00B4FF', 
                            borderRadius: '8px', 
                            padding: '5px 10px', 
                            fontSize: '11px', 
                            fontWeight: 800, 
                            display: 'inline-block', 
                            letterSpacing: '1px', 
                            fontFamily: 'Orbitron, monospace'
                          }}>
                            {mail.complaintId}
                          </div>
                        ) : (
                          <div style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            color: 'rgba(255,255,255,0.4)', 
                            borderRadius: '8px', 
                            padding: '4px 8px', 
                            fontSize: '10px', 
                            fontWeight: 700, 
                            display: 'inline-block' 
                          }}>
                            {isOtp ? 'AUTH SEC' : 'SYSTEM'}
                          </div>
                        )}
                      </td>

                      {/* Subject */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {mail.subject}
                        </div>
                      </td>

                      {/* Message Body (Email) */}
                      <td style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                        <div style={{ 
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          maxHeight: '75px', 
                          overflowY: 'auto',
                          scrollbarWidth: 'thin',
                          fontSize: '11.5px',
                          lineHeight: '1.45'
                        }}>
                          {mail.body ? mail.body.split('\n').map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}<br/>
                            </React.Fragment>
                          )) : 'No email body available.'}
                        </div>
                      </td>

                      {/* Text Message (SMS) */}
                      <td style={{ padding: '20px 24px' }}>
                        <div 
                          style={{ 
                            background: 'linear-gradient(135deg, rgba(0, 255, 170, 0.04) 0%, rgba(0, 180, 255, 0.03) 100%)',
                            border: '1px solid rgba(0, 255, 170, 0.25)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            position: 'relative',
                            boxShadow: 'inset 0 0 12px rgba(0, 255, 170, 0.05)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FFAA', display: 'inline-block' }}></span>
                              <span style={{ fontSize: '10px', color: '#00FFAA', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                SMS GATEWAY
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(mail.textMessage, mail._id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedId === mail._id ? '#00FFAA' : 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                padding: '2px 4px',
                                fontWeight: 700
                              }}
                              title="Copy SMS text"
                            >
                              {copiedId === mail._id ? 'v COPIED' : '⧉ COPY'}
                            </button>
                          </div>

                          <div style={{ 
                            fontSize: '12px', 
                            color: '#E0F2FE', 
                            fontWeight: 500,
                            lineHeight: 1.45,
                            maxHeight: '65px',
                            overflowY: 'auto',
                            fontFamily: 'monospace'
                          }}>
                            {mail.textMessage || 'SMS status update sent to user mobile number.'}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {total > 50 && (
            <div style={{ 
              padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '8px',
                  padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                PREVIOUS
              </button>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                PAGE {page} OF {Math.ceil(total / 50)}
              </span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 50)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: page >= Math.ceil(total / 50) ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '8px',
                  padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: page >= Math.ceil(total / 50) ? 'not-allowed' : 'pointer'
                }}
              >
                NEXT
              </button>
            </div>
          )}
        </div>

        {/* Dual Channel Detail Modal */}
        <AnimatePresence>
          {selectedMail && (
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
              }}
              onClick={() => setSelectedMail(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#040D1A',
                  border: '1px solid rgba(0, 180, 255, 0.3)',
                  borderRadius: '24px',
                  maxWidth: '900px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(0,180,255,0.15)',
                  padding: '36px',
                  position: 'relative'
                }}
              >
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#00FFAA', fontWeight: 800, background: 'rgba(0,255,170,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(0,255,170,0.3)' }}>
                        v DISPATCH LOGGED
                      </span>
                      {selectedMail.complaintId && (
                        <span style={{ fontSize: '12px', color: '#00B4FF', fontWeight: 800, background: 'rgba(0,180,255,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(0,180,255,0.3)', fontFamily: 'Orbitron, monospace' }}>
                          {selectedMail.complaintId}
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                      {selectedMail.subject}
                    </h2>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      Dispatched on {selectedMail.sentAt ? format(new Date(selectedMail.sentAt), 'PPPppp') : 'Recent'}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMail(null)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    x
                  </button>
                </div>

                {/* Dual Column Layout: Email vs SMS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  
                  {/* Email Dispatch Card */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid rgba(0, 180, 255, 0.2)', 
                    borderRadius: '16px', 
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>@</span>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#00B4FF', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
                          Email Dispatch
                        </h3>
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                        SMTP Gateway
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                      <div><strong style={{ color: 'rgba(255,255,255,0.8)' }}>To:</strong> {selectedMail.recipient}</div>
                      <div><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Subject:</strong> {selectedMail.subject}</div>
                    </div>

                    <div style={{ 
                      flex: 1,
                      background: 'rgba(0,0,0,0.4)', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '10px', 
                      padding: '16px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#E2E8F0',
                      whiteSpace: 'pre-line',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}>
                      {selectedMail.body}
                    </div>
                  </div>

                  {/* SMS Text Message Card */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid rgba(0, 255, 170, 0.25)', 
                    borderRadius: '16px', 
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>@</span>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#00FFAA', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
                          Text Message (SMS)
                        </h3>
                      </div>
                      <span style={{ fontSize: '11px', color: '#00FFAA', background: 'rgba(0,255,170,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0,255,170,0.2)' }}>
                        SMS Gateway
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                      <div><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Recipient Mobile:</strong> {selectedMail.recipientPhone || 'Auto-routed via Citizen Profile'}</div>
                      <div><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Sender ID:</strong> CYBERGUARD-GOV</div>
                    </div>

                    {/* Simulated Mobile SMS Bubble */}
                    <div style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, rgba(0, 180, 255, 0.1) 0%, rgba(0, 255, 170, 0.1) 100%)',
                      border: '1px solid rgba(0, 255, 170, 0.3)',
                      borderRadius: '16px 16px 16px 4px',
                      padding: '18px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#fff',
                      fontFamily: 'monospace',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                    }}>
                      {selectedMail.textMessage || 'SMS status update sent to user mobile number.'}
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => copyToClipboard(selectedMail.textMessage, 'modal')}
                        style={{
                          background: 'rgba(0, 255, 170, 0.1)',
                          border: '1px solid rgba(0, 255, 170, 0.3)',
                          color: '#00FFAA',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedId === 'modal' ? 'v Copied SMS' : '⧉ Copy SMS Text'}
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

