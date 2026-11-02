import React, { useEffect, useState } from 'react';
import Onee from './Onee.jsx';
import OneeGuidePointer from './OneeGuidePointer.jsx';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  HelpCircle
} from 'lucide-react';

/**
 * OneeGuideOverlay.jsx
 * Interactive visual guide overlay providing spotlight cut-out,
 * visual tutorial pointer, and contextual speech tooltip.
 * Follows CyberGuard graphite and mint design system.
 */
export default function OneeGuideOverlay({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  isStepCompleted,
  prefersReducedMotion = false,
  onNext,
  onPrev,
  onSkip,
  onOpenDraftHelper
}) {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Track viewport changes
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!step) return null;

  const isMobile = viewport.width < 640;
  const hasTarget = Boolean(targetRect);

  // Compute tooltip position relative to target
  let tooltipStyle = {};

  if (isMobile) {
    // Mobile bottom card layout
    tooltipStyle = {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxHeight: '44vh',
      zIndex: 10001
    };
  } else if (!hasTarget || step.isIntro) {
    // Centered or intro card layout
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      zIndex: 10001
    };
  } else {
    // Dynamic desktop positioning (above or below target)
    const spaceBelow = viewport.height - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const tooltipWidth = 400;

    // Align horizontally with target element, clamped inside viewport
    let left = targetRect.left;
    if (left + tooltipWidth > viewport.width - 24) {
      left = viewport.width - tooltipWidth - 24;
    }
    left = Math.max(20, left);

    if (spaceBelow >= 240 || spaceBelow >= spaceAbove) {
      // Place below target
      tooltipStyle = {
        position: 'fixed',
        top: `${Math.min(viewport.height - 240, targetRect.bottom + 14)}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 10001
      };
    } else {
      // Place above target
      tooltipStyle = {
        position: 'fixed',
        bottom: `${Math.max(16, viewport.height - targetRect.top + 14)}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 10001
      };
    }
  }

  const paddingBox = 8;
  const spotlightBox = targetRect ? {
    x: Math.max(0, targetRect.left - paddingBox),
    y: Math.max(0, targetRect.top - paddingBox),
    width: targetRect.width + paddingBox * 2,
    height: targetRect.height + paddingBox * 2,
    rx: 8
  } : null;

  return (
    <div
      role="region"
      aria-label="Onee Interactive Citizen Guide"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9998,
        pointerEvents: 'none' // overlay does not block clicking form
      }}
    >
      {/* ── Spotlight SVG Mask for Subdued Page Backdrop ── */}
      {hasTarget && spotlightBox && (
        <svg
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <defs>
            <mask id="onee-spotlight-mask">
              {/* White covers entire screen (opaque) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cut-out over target element (transparent hole) */}
              <rect
                x={spotlightBox.x}
                y={spotlightBox.y}
                width={spotlightBox.width}
                height={spotlightBox.height}
                rx={spotlightBox.rx}
                fill="black"
              />
            </mask>
          </defs>

          {/* Subdued dark veil with cutout */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(7, 9, 12, 0.72)"
            mask="url(#onee-spotlight-mask)"
          />
        </svg>
      )}

      {/* ── Active Target Highlight Ring ── */}
      {hasTarget && spotlightBox && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: `${spotlightBox.x}px`,
            top: `${spotlightBox.y}px`,
            width: `${spotlightBox.width}px`,
            height: `${spotlightBox.height}px`,
            border: '2px solid #3DF5C0',
            borderRadius: `${spotlightBox.rx}px`,
            boxShadow: '0 0 0 1px rgba(61, 245, 192, 0.4), 0 8px 30px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            zIndex: 9999,
            transition: prefersReducedMotion ? 'none' : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      )}

      {/* ── In-page Visual Tutorial Pointer (Points at Target) ── */}
      {hasTarget && !step.isIntro && (
        <OneeGuidePointer
          targetRect={targetRect}
          placement={step.placement}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}

      {/* ── Speech Tooltip / Guidance Card ── */}
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="onee-step-title"
        style={{
          ...tooltipStyle,
          pointerEvents: 'auto', // interactive controls inside card
          background: '#0d0f12',
          border: '1px solid #232b38',
          borderRadius: '12px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.9)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#e2e8f0'
        }}
      >
        {/* Tooltip Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Onee Avatar Avatar */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#131821',
                border: '1px solid #2d3748',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Onee animation={step.animation} size={46} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    color: '#3DF5C0',
                    background: 'rgba(61, 245, 192, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px'
                  }}
                >
                  {step.isIntro ? 'GUIDE INTRO' : `STEP ${stepIndex + 1} OF ${totalSteps}`}
                </span>

                {isStepCompleted && !step.isIntro && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      color: '#10b981',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle2 size={12} /> Complete
                  </span>
                )}
              </div>

              <h4
                id="onee-step-title"
                style={{
                  margin: '4px 0 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f8fafc'
                }}
              >
                {step.title}
              </h4>
            </div>
          </div>

          {/* Dismiss / Skip Control */}
          <button
            onClick={onSkip}
            aria-label="Exit Guide"
            title="Exit Guide and continue on your own"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            className="hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Content */}
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#cbd5e1' }}>
          {step.message}
        </p>

        {/* Pro Tip Box */}
        {step.tip && (
          <div
            style={{
              background: 'rgba(61, 245, 192, 0.05)',
              borderLeft: '3px solid #3DF5C0',
              padding: '8px 10px',
              borderRadius: '0 4px 4px 0',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.4
            }}
          >
            <strong style={{ color: '#3DF5C0' }}>Tip:</strong> {step.tip}
          </div>
        )}

        {/* Optional Draft Helper Trigger Button (on Narrative Step) */}
        {step.hasDraftHelper && (
          <button
            type="button"
            onClick={onOpenDraftHelper}
            style={{
              background: '#131821',
              color: '#3DF5C0',
              border: '1px solid rgba(61, 245, 192, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} /> Help Me Structure Incident Chronology
          </button>
        )}

        {/* Navigation Buttons Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '4px',
            paddingTop: '8px',
            borderTop: '1px solid #1a2230'
          }}
        >
          {step.isIntro ? (
            <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <button
                type="button"
                onClick={onSkip}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #2d3748',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                I'll File on My Own
              </button>

              <button
                type="button"
                onClick={onNext}
                style={{
                  flex: 1.4,
                  background: '#3DF5C0',
                  color: '#070707',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Start Guided Tour <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onPrev}
                disabled={stepIndex === 0}
                style={{
                  background: 'transparent',
                  color: stepIndex === 0 ? '#475569' : '#94a3b8',
                  border: '1px solid #232b38',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={14} /> Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onSkip}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                  className="hover:text-slate-300"
                >
                  Exit Guide
                </button>

                {!step.isFinal ? (
                  <button
                    type="button"
                    onClick={onNext}
                    style={{
                      background: isStepCompleted ? '#3DF5C0' : '#1e293b',
                      color: isStepCompleted ? '#070707' : '#94a3b8',
                      border: isStepCompleted ? 'none' : '1px solid #334155',
                      borderRadius: '6px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSkip}
                    style={{
                      background: '#3DF5C0',
                      color: '#070707',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Got It — I'm Ready
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

