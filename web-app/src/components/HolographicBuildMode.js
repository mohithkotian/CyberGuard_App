import React from 'react';

export default function HolographicBuildMode() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      <iframe
        src="/neon-ar.html"
        title="Neon Aura AR Hand Tracking"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="camera; microphone"
      />
    </div>
  );
}

