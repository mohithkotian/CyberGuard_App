import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../hooks/useAuthStore';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading } = useAuthStore();
  
  // Get role from URL query: /register?role=admin
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'user';
  const roleIcon = role === 'admin' ? 'admin-command.png' : role === 'officer' ? 'police-badge.png' : role === 'education' ? 'cyber-educator.png' : 'citizen-shield.png';

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(form.email)) e.email = 'Invalid email';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must contain upper, lower and number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register({ 
        name: form.name, 
        email: form.email, 
        phone: form.phone, 
        password: form.password,
        role: role
      });
      toast.success(`Account created! Welcome, ${role}.`);
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const roleColors = {
    admin: { main: 'var(--auth-btn-bg)', accent: 'var(--auth-heading)', glow: 'transparent', bg: 'var(--auth-input-bg)' },
    officer: { main: 'var(--auth-btn-bg)', accent: 'var(--auth-heading)', glow: 'transparent', bg: 'var(--auth-input-bg)' },
    education: { main: 'var(--auth-btn-bg)', accent: 'var(--auth-heading)', glow: 'transparent', bg: 'var(--auth-input-bg)' },
    user: { main: 'var(--auth-btn-bg)', accent: 'var(--auth-heading)', glow: 'transparent', bg: 'var(--auth-input-bg)' }
  };

  const theme = roleColors[role] || roleColors.user;

  const field = (key, label, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 24 }}>
      <label style={{ 
        display: 'block', 
        fontSize: '13px', 
        fontWeight: 700, 
        color: 'var(--auth-label)', 
        marginBottom: '10px', 
        marginLeft: '12px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input 
          className="liquid-input"
          type={type} 
          placeholder={placeholder}
          value={form[key]} 
          onChange={e => setForm({...form, [key]: e.target.value})}
          style={{ 
            width: '100%',
            padding: '16px 24px',
            background: 'var(--auth-input-bg)',
            border: '1px solid var(--auth-input-border)',
            borderRadius: '18px',
            color: 'var(--auth-input-text)',
            fontSize: '15px',
            outline: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'none'
          }}
        />
        {errors[key] && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#b85c5c', fontSize: '12px', marginTop: '6px', marginLeft: '12px', fontWeight: 600 }}>
            {errors[key]}
          </motion.p>
        )}
      </div>
    </div>
  );

  return (
    <div className="auth-page" style={{ 
      minHeight: '100vh', 
      background: 'var(--auth-bg)', 
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Dynamic Role-Based Background Accents */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '60%', height: '60%', background: 'none', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-10%', width: '60%', height: '60%', background: 'none', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(var(--auth-dot) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
            style={{ 
              width: 72, height: 72, borderRadius: '22px',
              background: 'var(--auth-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, margin: '0 auto 24px',
              border: '1px solid var(--auth-card-border)', boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'transparent', opacity: 0.5 }} />
            <img src="/icons/cyberguard/cyberguard-app-icon.png" alt="CyberGuard" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', position: 'relative', zIndex: 1 }} />
          </motion.div>
          <h1 style={{ 
            fontSize: '2.4rem', 
            fontWeight: 800,
            color: 'var(--auth-input-text)', 
            marginBottom: '8px',
            letterSpacing: '-1px'
          }}>
            Create <span style={{ color: theme.accent }}>{role.charAt(0).toUpperCase() + role.slice(1)}</span> Account
          </h1>
          <p style={{ color: 'var(--auth-subtext)', fontSize: '15px' }}>
            {role === 'admin' ? 'Establish Command Center clearance' : 
             role === 'officer' ? 'Access investigative tools and logs' :
             role === 'education' ? 'Join the cyber learning community' :
             'Secure your presence in the network'}
          </p>
        </div>

        <div style={{ 
          background: 'var(--auth-card)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid var(--auth-card-border)',
          borderRadius: '32px',
          padding: '48px',
          boxShadow: 'none'
        }}>
          <form onSubmit={handleSubmit}>
            {field('name',    'Full Name',    'text',     'John Doe')}
            {field('email',   'Email Address', 'email',    'you@example.com')}
            {field('phone',   'Phone (Optional)', 'tel', '9XXXXXXXXX')}
            {field('password','Secure Password', 'password', '••••••••')}
            {field('confirm', 'Confirm Password','password','••••••••')}

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '18px', 
                fontSize: '16px', 
                fontWeight: 800,
                marginTop: '12px',
                background: 'var(--auth-btn-bg)',
                color: 'var(--auth-btn-text)',
                border: '2px solid var(--auth-btn-border)',
                borderRadius: '18px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 15px 35px ${theme.glow}`;
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 10px 25px ${theme.glow}`;
              }}
            >
              {loading ? 'INITIALIZING...' : 'ESTABLISH ACCOUNT →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--auth-subtext)', fontWeight: 500 }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--auth-link)', textDecoration: 'none', fontWeight: 800 }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      <style>
        {`
          .liquid-input:focus {
            background: var(--auth-btn-hover-bg) !important;
            border-color: var(--auth-input-border-focus) !important;
            box-shadow: none !important;
          }
          button:active { transform: scale(0.96) !important; }
        `}
      </style>
    </div>
  );
}
