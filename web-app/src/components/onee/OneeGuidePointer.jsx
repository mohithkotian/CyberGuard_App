import React from 'react';

/**
 * OneeGuidePointer.jsx
 * In-page animated visual tutorial cursor that guides the citizen's eye toward
 * the target form element.
 * Strictly uses pointer-events: none — never interferes with the user's real OS mouse.
 */
export default function OneeGuidePointer({ targetRect, placement = 'bottom', prefersReducedMotion = false }) {
  if (!targetRect) return null;

  // Calculate pointer positioning relative to viewport
  const isPointerAbove = placement === 'bottom';
  const targetCenterX = targetRect.left + targetRect.width / 2;
  
  // If pointer is above the element, position it pointing down at the top edge
  const pointerX = Math.max(16, Math.min(window.innerWidth - 60, targetCenterX - 20));
  const pointerY = isPointerAbove 
    ? Math.max(8, targetRect.top - 46) 
    : Math.min(window.innerHeight - 50, targetRect.bottom + 8);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: `${pointerX}px`,
        top: `${pointerY}px`,
        pointerEvents: 'none',
        zIndex: 9999,
        transition: prefersReducedMotion ? 'none' : 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: isPointerAbove ? 'column' : 'column-reverse',
        alignItems: 'center',
        gap: '2px'
      }}
    >
      {/* Animated Arrow Icon */}
      <div
        className={prefersReducedMotion ? '' : 'onee-pointer-bounce'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <svg 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="none" 
          style={{ 
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
            transform: isPointerAbove ? 'rotate(180deg)' : 'none'
          }}
        >
          <path 
            d="M12 4L12 20M12 4L6 10M12 4L18 10" 
            stroke="#3DF5C0" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>

        <span
          style={{
            background: '#0d0f12',
            color: '#3DF5C0',
            border: '1px solid #3DF5C0',
            borderRadius: '4px',
            padding: '1px 6px',
            fontSize: '10px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
          }}
        >
          LOOK HERE
        </span>
      </div>

      <style>
        {`
          @keyframes oneePointerBounceAnim {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-6px);
            }
          }
          .onee-pointer-bounce {
            animation: oneePointerBounceAnim 1.6s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}

