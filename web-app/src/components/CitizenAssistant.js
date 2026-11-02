import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';
import Onee from './onee/Onee.jsx';
import { X, ArrowRight } from 'lucide-react';

/**
 * Onee — CyberGuard Citizen Assistant (Global Floating Mascot)
 * Friendly digital companion that lives quietly in the corner of citizen pages.
 * 
 * Strict Design Contract:
 * - Default state: idle. Onee is visible and unobtrusive.
 * - NO giant assistant panel.
 * - NO chat input or conversation UI.
 * - NO generic launcher dashboard (Report Crime, Track Status, Admin Hub).
 * - On /submit, yields completely to in-page docked OneeCompanion.
 * - Strictly excluded from officer and admin interfaces.
 */
export default function CitizenAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [animation, setAnimation] = useState('idle');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Role & Route Safety Check: Strictly exclude from officer and admin interfaces
  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';
  const isOfficerOrAdminRoute = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/officer') ||
    location.pathname.startsWith('/developer');

  // Detect reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // If officer or admin, render nothing (strict constraint #6)
  if (isOfficerOrAdmin || isOfficerOrAdminRoute) {
    return null;
  }

  // On /submit, the in-page form-docked OneeCompanion takes full ownership of the walkthrough
  if (location.pathname === '/submit') {
    return null;
  }

  const handleStartReport = () => {
    navigate('/submit', { state: { startGuide: true } });
  };

  return (
    <>
      <style>{`
        @keyframes oneeGlobalBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      {/* Floating Unobtrusive Onee Character in Bottom-Right Corner */}
      <aside
        role="region"
        aria-label="Onee Citizen Guide"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9995,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '6px',
          pointerEvents: 'auto'
        }}
      >
        {/* Compact Comic Thought Speech Bubble (Optional on click/hover) */}
        {isBubbleOpen && (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: '#0c1017',
              border: '1px solid rgba(61, 245, 192, 0.35)',
              borderRadius: '12px',
              padding: '10px 12px',
              maxWidth: '220px',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.75), 0 0 1px rgba(61, 245, 192, 0.3)',
              color: '#f1f5f9',
              fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 600,
                  color: '#3DF5C0',
                  letterSpacing: '0.3px'
                }}
              >
                Onee
              </span>

              <button
                type="button"
                onClick={() => setIsBubbleOpen(false)}
                aria-label="Close Onee speech bubble"
                title="Dismiss"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                <X size={12} />
              </button>
            </div>

            {/* 1 Short Sentence */}
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.4,
                color: '#cbd5e1'
              }}
            >
              I can guide you through reporting a cybercrime.
            </p>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={handleStartReport}
              style={{
                background: '#3DF5C0',
                color: '#070a0e',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                alignSelf: 'flex-start',
                fontFamily: "'IBM Plex Sans', sans-serif",
                marginTop: '2px'
              }}
            >
              <span>Start guided report</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Mascot Avatar Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            animation: prefersReducedMotion ? 'none' : 'oneeGlobalBob 3s ease-in-out infinite'
          }}
        >
          {/* Comic Thought Dots */}
          {isBubbleOpen && (
            <div
              aria-hidden="true"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                marginBottom: '3px',
                pointerEvents: 'none'
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DF5C0', opacity: 0.75 }} />
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#3DF5C0', opacity: 0.45 }} />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsBubbleOpen(prev => !prev);
              setAnimation(prev => (prev === 'idle' ? 'listening' : 'idle'));
            }}
            aria-label={isBubbleOpen ? "Close Onee Guide" : "Open Onee Guide"}
            title="Onee — CyberGuard Interactive Guide"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#0d1118',
              border: '2px solid rgba(61, 245, 192, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 4px 16px rgba(61, 245, 192, 0.35))',
              overflow: 'hidden',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Onee animation={animation} size={54} />
          </button>
        </div>
      </aside>
    </>
  );
}
