import React, { useEffect, useState, useMemo, useRef } from 'react';
import Onee from './Onee.jsx';
import { X, Sparkles, ArrowRight } from 'lucide-react';

/**
 * OneeCompanion.jsx
 * Pure Interactive Digital Guide.
 * 
 * Strict Design Contract:
 * - NO large assistant card.
 * - NO "STEP X OF 11" wizard headers.
 * - NO Back / Next buttons.
 * - NO Voice/Assist button.
 * - NO chat input or chatbot conversation history.
 * - NO dark screen-wide overlay.
 * 
 * Visual Hierarchy:
 *   TARGET UI
 *       ↑
 *   visual pointer
 *       ↑
 *   ONEE
 *       ↑
 *   small speech bubble (1-2 short sentences)
 */
export default function OneeCompanion({
  step,
  targetRect,
  isStepCompleted = false,
  isValidationError = false,
  validationMessage = '',
  prefersReducedMotion = false,
  isActive = true,
  onNext,
  onSkip,
  onStart
}) {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [minimized, setMinimized] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevStepIdRef = useRef(step?.id);

  // Track viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // React briefly when a field is completed
  useEffect(() => {
    if (isStepCompleted && !step?.isIntro && !step?.isFinal) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isStepCompleted, step]);

  // Track step transition
  useEffect(() => {
    prevStepIdRef.current = step?.id;
  }, [step?.id]);

  const isMobile = viewport.width < 768;

  // Determine avatar animation strictly from available animations
  const currentAnimation = useMemo(() => {
    if (justCompleted) return 'happy';
    if (isValidationError) return 'confused';
    if (step?.isIntro) return 'waking';
    if (step?.isFinal) return 'excited';
    return step?.animation || 'listening';
  }, [justCompleted, isValidationError, step]);

  // Determine short speech message (1-2 sentences maximum!)
  const bubbleMessage = useMemo(() => {
    if (justCompleted && step?.successMessage) {
      return step.successMessage;
    }
    if (isValidationError && validationMessage) {
      return validationMessage;
    }
    return step?.message || "I'll guide you through this.";
  }, [justCompleted, isValidationError, validationMessage, step]);

  // Compute docked position beside target element
  const placement = useMemo(() => {
    const mascotSize = isMobile ? 56 : 64;
    const bubbleWidth = isMobile ? 220 : 250;

    if (!targetRect || isMobile) {
      return {
        docked: false,
        style: isMobile
          ? {
              position: 'fixed',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '6px',
              zIndex: 9999,
              pointerEvents: 'none'
            }
          : {
              position: 'fixed',
              top: '140px',
              right: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              zIndex: 9999,
              pointerEvents: 'none'
            }
      };
    }

    // Desktop: dock right next to the active form element
    const targetRight = targetRect.right;
    const targetLeft = targetRect.left;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const spaceRight = viewport.width - targetRight;
    const placeOnRight = spaceRight >= (mascotSize + bubbleWidth + 24);

    let leftPos = 0;
    let topPos = Math.max(70, Math.min(viewport.height - 180, targetCenterY - 32));

    if (placeOnRight) {
      leftPos = targetRight + 18;
    } else if (targetLeft >= (mascotSize + bubbleWidth + 24)) {
      leftPos = targetLeft - mascotSize - bubbleWidth - 18;
    } else {
      leftPos = Math.max(16, targetLeft);
      topPos = Math.min(viewport.height - 180, targetRect.bottom + 12);
    }

    return {
      docked: true,
      placeOnRight,
      style: {
        position: 'fixed',
        left: `${leftPos}px`,
        top: `${topPos}px`,
        display: 'flex',
        flexDirection: placeOnRight ? 'row' : 'row-reverse',
        alignItems: 'flex-start',
        gap: '6px',
        zIndex: 9999,
        pointerEvents: 'none',
        transition: prefersReducedMotion ? 'none' : 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    };
  }, [targetRect, isMobile, viewport, prefersReducedMotion]);

  // Minimized badge at bottom-right
  if (minimized || !isActive) {
    return (
      <aside
        aria-label="Onee Interactive Guide"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'auto'
        }}
      >
        <div
          onClick={() => {
            setMinimized(false);
            if (onStart) onStart();
          }}
          style={{
            background: '#0c1017',
            border: '1px solid rgba(61, 245, 192, 0.35)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#3DF5C0',
            fontFamily: "'IBM Plex Sans', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Sparkles size={12} />
          <span>Onee Guide</span>
        </div>

        <button
          type="button"
          onClick={() => {
            setMinimized(false);
            if (onStart) onStart();
          }}
          aria-label="Open Onee Guide"
          title="Open Onee Guide"
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: '#101520',
            border: '2px solid #3DF5C0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 6px 22px rgba(0, 0, 0, 0.7)'
          }}
        >
          <Onee animation="idle" size={50} />
        </button>
      </aside>
    );
  }

  return (
    <>
      <style>{`
        @keyframes oneeBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes oneeFocusPulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(61, 245, 192, 0.3), 0 0 14px rgba(61, 245, 192, 0.2); }
          50% { box-shadow: 0 0 0 2px rgba(61, 245, 192, 0.55), 0 0 22px rgba(61, 245, 192, 0.35); }
        }
        @keyframes oneeArrowPoint {
          0%, 100% { transform: translateX(0); opacity: 0.85; }
          50% { transform: translateX(-3px); opacity: 1; }
        }
      `}</style>

      {/* ── Target Focus Ring (Strictly pointer-events: none, clicks pass directly to inputs) ── */}
      {targetRect && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: `${targetRect.left - 4}px`,
            top: `${targetRect.top - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            border: '2px solid #3DF5C0',
            borderRadius: '8px',
            pointerEvents: 'none',
            zIndex: 9990,
            animation: prefersReducedMotion ? 'none' : 'oneeFocusPulse 2.4s ease-in-out infinite',
            transition: prefersReducedMotion ? 'none' : 'all 0.38s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      )}

      {/* ── Character & Speech Bubble (Docked directly to target) ── */}
      <aside
        role="region"
        aria-label="Onee Guide"
        style={placement.style}
      >
        {/* Mascot Avatar with gentle bob */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            animation: prefersReducedMotion ? 'none' : 'oneeBob 3s ease-in-out infinite',
            flexShrink: 0,
            pointerEvents: 'auto'
          }}
        >
          {/* In-page visual pointer arrow */}
          {targetRect && !isMobile && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: placement.placeOnRight ? '-20px' : 'auto',
                right: placement.placeOnRight ? 'auto' : '-20px',
                top: '20px',
                pointerEvents: 'none',
                color: '#3DF5C0',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))',
                animation: prefersReducedMotion ? 'none' : 'oneeArrowPoint 1.5s ease-in-out infinite',
                transform: placement.placeOnRight ? 'scaleX(1)' : 'scaleX(-1)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </div>
          )}

          {/* Avatar Disc */}
          <div
            onClick={() => setMinimized(true)}
            title="Click to minimize Onee"
            style={{
              width: isMobile ? '56px' : '64px',
              height: isMobile ? '56px' : '64px',
              borderRadius: '50%',
              background: '#0d1118',
              border: '2px solid rgba(61, 245, 192, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 4px 16px rgba(61, 245, 192, 0.35))',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            <Onee animation={currentAnimation} size={isMobile ? 54 : 62} />
          </div>

          {/* Comic thought dots leading down to Onee */}
          <div
            aria-hidden="true"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              marginTop: '3px',
              pointerEvents: 'none'
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3DF5C0', opacity: 0.75 }} />
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#3DF5C0', opacity: 0.45 }} />
          </div>
        </div>

        {/* ── Small, Compact Speech Bubble (1-2 short sentences, NO assistant buttons) ── */}
        <div
          role="status"
          aria-live="polite"
          style={{
            maxWidth: isMobile ? '230px' : '260px',
            background: '#0c1017',
            border: isValidationError ? '1px solid #ef4444' : '1px solid rgba(61, 245, 192, 0.35)',
            borderRadius: '12px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.8), 0 0 1px rgba(61, 245, 192, 0.3)',
            padding: '8px 12px',
            color: '#f1f5f9',
            fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            pointerEvents: 'auto',
            position: 'relative'
          }}
        >
          {/* Header row with tiny close button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                color: isValidationError ? '#f87171' : '#3DF5C0',
                letterSpacing: '0.3px'
              }}
            >
              Onee
            </span>

            <button
              type="button"
              onClick={() => {
                setMinimized(true);
                if (onSkip) onSkip();
              }}
              aria-label="Dismiss Onee"
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
              <X size={13} />
            </button>
          </div>

          {/* Short 1-sentence instruction */}
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              lineHeight: 1.4,
              color: isValidationError ? '#fca5a5' : '#cbd5e1'
            }}
          >
            {bubbleMessage}
          </p>

          {/* Intro CTA to start */}
          {step?.isIntro && (
            <button
              type="button"
              onClick={() => {
                if (onNext) onNext();
              }}
              style={{
                marginTop: '4px',
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
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            >
              <span>Let's Begin</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
