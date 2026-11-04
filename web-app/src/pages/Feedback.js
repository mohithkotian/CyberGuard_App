import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, Check } from 'lucide-react';

export default function Feedback() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNo: '',
    state: '',
    ackNo: '',
    email: '',
    wishList: '',
    feedback: '',
    errorScreenshot: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should not be more than 5 MB");
        return;
      }
      setFormData(prev => ({ ...prev, errorScreenshot: file }));
    }
  };

  const handleGetOTP = (e) => {
    if (e) e.preventDefault();
    if (!formData.firstName || !formData.mobileNo || !formData.state || !formData.wishList || !formData.feedback) {
      toast.error('Please fill all required fields');
      return;
    }
    toast.success('OTP sent to your mobile number!');
  };

  return (
    <div className="page-shell">
      <Navbar />
      
      <main className="report-layout">
        {/* Subheader / Aside Row */}
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
            <p className="eyebrow">CITIZEN ENGAGEMENT</p>
            <h1>FEEDBACK & SUPPORT</h1>
            <p>Provide suggestions, report portal issues, or file feature recommendations with the platform coordinators.</p>
          </div>
          <div className="help-note">
            <p>Reporting a cybercrime?</p>
            <span>Please lodge a formal complaint under the Report section for police action.</span>
          </div>
        </aside>

        {/* Content Workspace */}
        <div className="form-workspace">
          <div className="report-form" style={{ padding: 0 }}>
            {/* Form Intro Header */}
            <div className="form-intro">
              <div>
                <p className="step-label">PORTAL TELEMETRY</p>
                <h2>User Experience & Technical Suggestions</h2>
              </div>
              <p className="required-note">
                <span aria-hidden="true">*</span> Required fields
              </p>
            </div>

            {/* Form Body */}
            <div style={{ padding: '36px 40px' }}>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '32px', 
                color: '#b8b8b0', 
                lineHeight: '1.7', 
                fontFamily: "'IBM Plex Sans', sans-serif" 
              }}>
                We welcome your suggestions and inquiries regarding the National Cyber Crime Reporting Portal.
                If you encountered issues or wish to suggest new capabilities, our administration team will review your submission promptly.
              </p>

              <form onSubmit={handleGetOTP}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>First Name <span style={{ color: '#d96464' }}>*</span></label>
                    <input 
                      type="text" 
                      name="firstName" 
                      value={formData.firstName} 
                      onChange={handleChange} 
                      placeholder="Enter your first name" 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input 
                      type="text" 
                      name="lastName" 
                      value={formData.lastName} 
                      onChange={handleChange} 
                      placeholder="Enter last name" 
                      style={inputStyle} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Mobile No <span style={{ color: '#d96464' }}>*</span></label>
                    <input 
                      type="text" 
                      name="mobileNo" 
                      value={formData.mobileNo} 
                      onChange={handleChange} 
                      placeholder="10-digit mobile number" 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>State / UT <span style={{ color: '#d96464' }}>*</span></label>
                    <select 
                      name="state" 
                      value={formData.state} 
                      onChange={handleChange} 
                      style={inputStyle}
                    >
                      <option value="">Select State / UT</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Acknowledgement Number (If Applicable)</label>
                    <input 
                      type="text" 
                      name="ackNo" 
                      value={formData.ackNo} 
                      onChange={handleChange} 
                      placeholder="e.g. CC-2026-XXXXX" 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Upload Error Screenshot</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <label style={{
                        background: '#1a1a18',
                        border: '1px solid #30302d',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#f2f0ea',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                      }}>
                        <Upload size={14} />
                        CHOOSE FILE
                        <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                      </label>
                      <div style={{
                        border: '1px solid #30302d',
                        background: '#141414',
                        padding: '12px 16px',
                        flex: 1,
                        borderRadius: '12px',
                        color: formData.errorScreenshot ? '#f2f0ea' : '#777',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: "'IBM Plex Mono', monospace"
                      }}>
                        {formData.errorScreenshot ? formData.errorScreenshot.name : 'Max 5MB (PNG/JPG)'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="name@example.com" 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Submission Type <span style={{ color: '#d96464' }}>*</span></label>
                    <select 
                      name="wishList" 
                      value={formData.wishList} 
                      onChange={handleChange} 
                      style={inputStyle}
                    >
                      <option value="">Select Category</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Portal Experience">Portal Experience</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={labelStyle}>Feedback / Suggestion Details <span style={{ color: '#d96464' }}>*</span></label>
                  <textarea 
                    name="feedback" 
                    value={formData.feedback} 
                    onChange={(e) => e.target.value.length <= 500 && handleChange(e)} 
                    placeholder="Provide detailed description of your observation, query, or requested enhancement..."
                    style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
                  ></textarea>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#777', fontFamily: "'IBM Plex Sans', sans-serif" }}>Maximum 500 characters</span>
                    <span style={{ fontSize: '11px', color: '#888', fontFamily: "'IBM Plex Mono', monospace" }}>
                      Remaining: <strong style={{ color: 500 - formData.feedback.length < 50 ? '#d96464' : '#f2f0ea' }}>{500 - formData.feedback.length}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button 
                    type="submit"
                    style={{
                      background: '#f2f0ea',
                      color: '#070707',
                      border: 'none',
                      padding: '0 44px',
                      height: '50px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontWeight: 800,
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    SEND OTP VERIFICATION
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const labelStyle = {
  display: 'block', 
  fontSize: '11px', 
  color: '#888880', 
  marginBottom: '8px', 
  fontWeight: 700, 
  textTransform: 'uppercase', 
  letterSpacing: '1px',
  fontFamily: "'IBM Plex Sans', sans-serif"
};

const inputStyle = {
  width: '100%', 
  padding: '13px 18px', 
  background: '#141414', 
  border: '1px solid #30302d', 
  borderRadius: '12px', 
  fontSize: '14px', 
  color: '#f2f0ea',
  outline: 'none', 
  boxSizing: 'border-box', 
  transition: 'border-color 0.2s',
  fontFamily: "'IBM Plex Sans', sans-serif"
};
