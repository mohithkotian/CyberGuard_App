import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export default function JarvisAssistant({ dbData }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [jarvisResponse, setJarvisResponse] = useState('');
  const [jarvisVoice, setJarvisVoice] = useState(null);
  const recognitionRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);
  const listenRef = useRef(false);
  const currentTiltRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ xOffset: 0, yOffset: 0, active: false });

  useEffect(() => { listenRef.current = isListening; }, [isListening]);

  // Voice Initialization
  useEffect(() => {
    const init = () => {
      const v = window.speechSynthesis.getVoices();
      let voice = v.find(x => x.name === 'Daniel' || x.name === 'Google UK English Male' || (x.lang === 'en-GB'));
      setJarvisVoice(voice || v[0]);
    };
    init();
    window.speechSynthesis.onvoiceschanged = init;
  }, []);

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (e) => { const t = e.results[0][0].transcript; setTranscript(t); processCommand(t); };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [dbData]);

  // ─── CINEMATIC AUDIO ENGINE ───
  const playAudio = (filename) => {
    const audio = new Audio(`/voices/${filename}`);
    audio.volume = 0.8;
    audio.play().catch(e => console.log('Audio play error:', e));
  };

  const speak = (text) => {
    setJarvisResponse(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (jarvisVoice) u.voice = jarvisVoice;
      u.pitch = 0.9; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const processCommand = (cmd) => {
    const t = cmd.toLowerCase();
    if (t.includes('system') && (t.includes('report') || t.includes('status')))
      speak(`System operating at peak efficiency, Sir. ${dbData.users.length} identities, ${dbData.complaints.length} incidents. No anomalies.`);
    else if (t.includes('users') || t.includes('online'))
      speak(`${dbData.users.length} users in the matrix, Sir.`);
    else if (t.includes('hello') || t.includes('hi') || t.includes('jarvis')) {
      setJarvisResponse("At your service, Sir.");
      playAudio('at_your_service.mp3'); // Play authentic Paul Bettany MP3!
    }
    else speak("Command received, Sir, but that protocol is not yet in my matrix.");
  };

  const toggleListen = () => {
    if (isListening) { recognitionRef.current?.stop(); }
    else { 
      recognitionRef.current?.start(); 
      setIsListening(true); 
      setTranscript(''); 
      setJarvisResponse('At your service, Sir.');
      playAudio('at_your_service.mp3');
    }
  };

  // Pre-generate dynamic particles and sparks
  const staticData = useRef(null);
  if (!staticData.current) {
    const sparks = [];
    for (let i = 0; i < 45; i++) {
      sparks.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.5,
        life: Math.random(),
        maxR: 190 + Math.random() * 50,
        size: 0.4 + Math.random() * 1.2
      });
    }
    const nodes = [];
    for (let i = 0; i < 30; i++) {
      nodes.push({
        orbitR: 160 + (i % 3) * 25,
        speed: (i % 2 === 0 ? 1 : -1) * (0.2 + Math.random() * 0.3),
        angle: Math.random() * Math.PI * 2,
        size: 0.8 + Math.random() * 1.5
      });
    }
    staticData.current = { sparks, nodes };
  }

  // Real-time Canvas overlay animation (particles, arcs, dynamic holographic sweeps)
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const S = 600, cx = S / 2, cy = S / 2;
    const t = tRef.current;
    const listening = listenRef.current;
    const { sparks, nodes } = staticData.current;

    // Double-peak heartbeat calculation toned down for a slow and medium pulse
    const period = listening ? 1.8 : 3.0;
    const progress = (t % period) / period;
    let pulse = 1;
    if (progress < 0.14) {
      pulse = 1 + 0.02 * Math.sin((progress / 0.14) * Math.PI / 2);
    } else if (progress < 0.28) {
      pulse = 1.02 - 0.015 * Math.sin(((progress - 0.14) / 0.14) * Math.PI / 2);
    } else if (progress < 0.42) {
      pulse = 1.005 + 0.035 * Math.sin(((progress - 0.28) / 0.14) * Math.PI / 2);
    } else if (progress < 0.70) {
      pulse = 1.04 - 0.04 * Math.sin(((progress - 0.42) / 0.28) * Math.PI / 2);
    }

    // ─── HIGH PERFORMANCE AUTOMATIC DRIFT & TILT SYSTEM ───
    // Medium and soft drift oscillation to mimic slow cinematic floating
    const autoX = 12 * Math.sin(t * 0.6); // slower, softer frequency
    const autoY = 16 * Math.cos(t * 0.45); // slower, softer frequency
    
    let targetX = autoX;
    let targetY = autoY;
    
    // Smooth blending of Mouse Hover/Touch tilt (interactive but soft)
    if (mouseRef.current.active) {
      targetX += mouseRef.current.yOffset * -18;
      targetY += mouseRef.current.xOffset * 18;
    }
    
    // Continuous smooth interpolation (damping / easing - very soft transition)
    currentTiltRef.current.x += (targetX - currentTiltRef.current.x) * 0.05;
    currentTiltRef.current.y += (targetY - currentTiltRef.current.y) * 0.05;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `rotateX(${currentTiltRef.current.x}deg) rotateY(${currentTiltRef.current.y}deg)`;
    }

    ctx.clearRect(0, 0, S, S);

    // Glowing coordinate lines intersecting behind the core (blended/faint)
    ctx.strokeStyle = 'rgba(255, 140, 0, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(S, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, S);
    ctx.stroke();

    // Outermost slow rotating targeting HUD segment
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.1);
    ctx.strokeStyle = 'rgba(255, 140, 20, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 270 * pulse, 0, Math.PI * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 270 * pulse, Math.PI, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();

    // ─── DYNAMIC ORBITING NODES ───
    nodes.forEach((n, i) => {
      const angle = n.angle + t * n.speed;
      const x = cx + Math.cos(angle) * n.orbitR * pulse;
      const y = cy + Math.sin(angle) * n.orbitR * 0.45 * pulse;
      
      ctx.beginPath();
      ctx.arc(x, y, n.size * (listening ? 1.3 : 1), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${150 + Math.floor(80 * Math.sin(i + t))}, 30, ${0.25 + 0.25 * Math.sin(t * 2 + i)})`;
      ctx.fill();

      // Trace line connecting back to center (holographic vector)
      ctx.strokeStyle = `rgba(255, 140, 20, ${0.015 + 0.015 * Math.sin(t + i)})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // ─── OUTER SPARKS ───
    sparks.forEach((sp, i) => {
      const life = (sp.life + t * 0.03) % 1;
      const r = life * sp.maxR * pulse;
      const a = sp.angle + t * sp.speed * 0.03;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const alpha = life < 0.85 ? 0.45 : (1 - life) * 3;

      ctx.beginPath();
      ctx.arc(x, y, sp.size * (1 - life * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${180 + Math.floor(75 * Math.sin(i + t))}, 40, ${alpha})`;
      ctx.fill();
    });

    // ─── INTERACTIVE AUDIO WAVEFORM sweep on listening ───
    if (listening) {
      ctx.strokeStyle = 'rgba(255, 180, 50, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 360; i += 6) {
        const rad = i * Math.PI / 180;
        const wave = 8 * Math.sin(t * 12 + i * 0.2) * Math.cos(t * 3);
        const r = (230 + wave) * pulse;
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    tRef.current += 0.016;
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 600; canvas.height = 600;
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); };
  }, [draw]);

  // Touch and Mouse dynamic parallax tilt handling
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseRef.current = {
      xOffset: x / (rect.width / 2),
      yOffset: y / (rect.height / 2),
      active: true
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { xOffset: 0, yOffset: 0, active: false };
  };

  const baseLayerStyle = {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: '50%',
    backgroundImage: 'url("/jarvis_core.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    mixBlendMode: 'screen',
    transition: 'filter 0.5s ease-in-out',
    filter: isListening ? 'brightness(1.1) contrast(1.05)' : 'brightness(0.9) contrast(1)'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020202', overflow: 'hidden', position: 'relative' }}>
      
      {/* 3D Holographic Core Frame */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            mouseRef.current = {
              xOffset: x / (rect.width / 2),
              yOffset: y / (rect.height / 2),
              active: true
            };
          }
        }}
        onTouchEnd={handleMouseLeave}
        onClick={toggleListen}
        style={{
          position: 'relative',
          width: 580,
          height: 580,
          perspective: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        {/* Tilting Holographic Container (Controlled at 60fps in animation loop) */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Holographic Core Wrapper (Restrained, static aperture) */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformStyle: 'preserve-3d',
              border: isListening ? '2px solid #3DF5C0' : '1px solid #242422',
              borderRadius: '50%',
              transition: 'border-color 0.2s ease'
            }}
          >
            {/* Core Aperture (Static, zero decorative spin loops) */}
            <div style={{
              ...baseLayerStyle,
              transform: 'translateZ(-25px)',
              borderRadius: '50%',
              background: '#0E0E0E'
            }} />

            {/* Interactive HUD Canvas Overlay */}
            <canvas 
              ref={canvasRef}
              style={{
                position: 'absolute',
                width: 580,
                height: 580,
                pointerEvents: 'none',
                transform: 'translateZ(60px)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Voice Assistant Speech Visualizer */}
      <div style={{ marginTop: 20, textAlign: 'center', minHeight: 90, zIndex: 10 }}>
        <p style={{ color: isListening ? '#3DF5C0' : '#8E8B85', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontStyle: 'normal', letterSpacing: '3px', fontWeight: '600' }}>
          {isListening ? (transcript || "J.A.R.V.I.S.") : (transcript ? `> ${transcript.toUpperCase()}` : "J.A.R.V.I.S.")}
        </p>
        <p style={{ color: '#EFEDE8', fontSize: 15, fontFamily: "'IBM Plex Sans', sans-serif", marginTop: 12, maxWidth: 580, lineHeight: 1.6 }}>
          {jarvisResponse}
        </p>
      </div>

      {/* Embedded CSS Animations for High Performance */}
      
    </div>
  );
}

