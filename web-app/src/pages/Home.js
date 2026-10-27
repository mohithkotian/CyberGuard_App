import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatBot from '../components/ChatBot';
import VoiceAssistant from '../components/VoiceAssistant';
import useTranslationStore from '../hooks/useTranslationStore';

/* ═══════════════════════════════════════════════════════════════
   STARFIELD — cursor-reactive stars + cyber glyphs
   ═══════════════════════════════════════════════════════════════ */
const CYBER_GLYPHS = ['⌘','⊕','⊗','◈','⬡','⌬','⎔','⌖','⍟','⎊','⎈','⌭','⍯','⌀','⊞','⊠','⊡','▣'];
const BINARY_STRINGS = ['01','10','00','11','0x','FF','0A','1F','C0','DE','CA','FE'];
const CUSTOM_ICONS = [
  '/icons/antenna.jpg',
  '/icons/dna.jpg',
  '/icons/lock.jpg',
  '/icons/lightning.jpg'
];

function StarField({ mouseRef }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const mouse     = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Preload custom images
    const loadedImages = [];
    CUSTOM_ICONS.forEach((src) => {
      const img = new Image();
      img.src = src;
      loadedImages.push(img);
    });

    let W, H;
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* Sync mouse from parent's mouseRef (normalized -1..1) */
    function syncMouse() {
      if (!mouseRef?.current) return;
      mouse.current.x = ((mouseRef.current[0] + 1) / 2) * W;
      mouse.current.y = ((-mouseRef.current[1] + 1) / 2) * H;
    }

    /* ── Particle factory ── */
    const REPEL_RADIUS = 120;
    const REPEL_FORCE  = 0.38;

    function makeParticle() {
      // Increased chance for custom image (3.5%) and glyphs/binary
      const r = Math.random();
      const isImage  = r < 0.035;
      const isGlyph  = !isImage && r < 0.12;
      const isBinary = !isImage && !isGlyph && r < 0.16;
      const isDNA    = !isImage && !isGlyph && !isBinary && r < 0.22;
      
      let img = null;
      if (isImage && loadedImages.length > 0) {
        img = loadedImages[Math.floor(Math.random() * loadedImages.length)];
      }

      let dnaStrand = null;
      if (isDNA) {
        const dnaPairs = ['01', '10', '00'];
        const strandLength = 5 + Math.floor(Math.random() * 5); // 5 to 9 pairs
        dnaStrand = Array.from({ length: strandLength }, () => dnaPairs[Math.floor(Math.random() * dnaPairs.length)]);
      }
      if (isImage && loadedImages.length > 0) {
        img = loadedImages[Math.floor(Math.random() * loadedImages.length)];
      }

      return {
        x:    Math.random() * W,
        y:    Math.random() * H,
        ox:   0, oy: 0,           // offset from repulsion
        vx:   0, vy: 0,
        size: isImage  ? (40 + Math.random() * 40) // 40-80px for images
              : isGlyph  ? (8 + Math.random() * 10)
              : isBinary ? (7 + Math.random() * 6)
              : isDNA    ? (4 + Math.random() * 3) // very small size (4-7px)
              : (0.5 + Math.random() * 1.8),
        alpha:  isImage  ? (0.4 + Math.random() * 0.4)
                : isGlyph  ? (0.12 + Math.random() * 0.18)
                : isBinary ? (0.08 + Math.random() * 0.12)
                : isDNA    ? (0.15 + Math.random() * 0.3)
                : (0.15 + Math.random() * 0.85),
        glyph:  isGlyph  ? CYBER_GLYPHS[Math.floor(Math.random() * CYBER_GLYPHS.length)] : null,
        binary: isBinary ? BINARY_STRINGS[Math.floor(Math.random() * BINARY_STRINGS.length)] : null,
        isDNA:  isDNA,
        dnaStrand: dnaStrand,
        img:    img,
        drift: { x: (Math.random() - 0.5) * 0.15, y: (Math.random() - 0.5) * 0.15 },
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        color: Math.random() < 0.06 ? '#00ffaa'
             : Math.random() < 0.04 ? '#007AFF'
             : '#ffffff',
      };
    }

    // Further increased star density (divided by 1800 instead of 3000)
    const COUNT = Math.min(800, Math.floor((W * H) / 1800));
    const particles = Array.from({ length: COUNT }, makeParticle);

    let lastTs = 0;
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 16, 3);
      lastTs = ts;
      syncMouse();

      ctx.clearRect(0, 0, W, H);

      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (const p of particles) {
        /* Twinkle */
        const twinkle = 0.7 + 0.3 * Math.sin(ts * 0.001 * p.twinkleSpeed + p.twinklePhase);
        const alpha   = p.alpha * twinkle;

        /* Cursor repulsion */
        const dx = p.x + p.ox - mx;
        const dy = p.y + p.oy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          p.vx += (dx / dist) * force * REPEL_FORCE * dt;
          p.vy += (dy / dist) * force * REPEL_FORCE * dt;
        }
        /* Spring back to origin */
        p.vx += (-p.ox * 0.05) * dt;
        p.vy += (-p.oy * 0.05) * dt;
        /* Damping */
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.ox += p.vx;
        p.oy += p.vy;

        /* Slow drift */
        p.x += p.drift.x * dt;
        p.y += p.drift.y * dt;
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;

        const rx = p.x + p.ox;
        const ry = p.y + p.oy;

        ctx.save();
        ctx.globalAlpha = Math.min(alpha, 1);

        if (p.img && p.img.complete && p.img.naturalWidth > 0) {
          /* Custom Uploaded Images */
          const aspect = p.img.naturalWidth / p.img.naturalHeight;
          const w = p.size;
          const h = p.size / aspect;
          if (dist < REPEL_RADIUS) {
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 10;
          }
          ctx.drawImage(p.img, rx - w / 2, ry - h / 2, w, h);
        } else if (p.glyph) {
          /* Cyber glyph */
          ctx.font = `${p.size}px monospace`;
          ctx.fillStyle = p.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          /* Glow on hover approach */
          if (dist < REPEL_RADIUS) {
            ctx.shadowColor = p.color;
            ctx.shadowBlur  = 8;
          }
          ctx.fillText(p.glyph, rx, ry);
        } else if (p.binary) {
          /* Binary snippet */
          ctx.font = `600 ${p.size}px "Courier New", monospace`;
          ctx.fillStyle = 'rgba(0,255,170,1)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.binary, rx, ry);
        } else if (p.isDNA) {
          /* DNA-like floating substance */
          ctx.font = `600 ${p.size}px "Courier New", monospace`;
          ctx.fillStyle = '#39FF14'; // Neon Green
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (dist < REPEL_RADIUS) {
            ctx.shadowColor = '#39FF14';
            ctx.shadowBlur = 5;
          }

          const spacing = p.size * 1.8;
          const totalHeight = p.dnaStrand.length * spacing;
          const startY = ry - totalHeight / 2;
          const amplitude = p.size * 2.5;
          
          for (let i = 0; i < p.dnaStrand.length; i++) {
            const pair = p.dnaStrand[i];
            const leftChar = pair[0];
            const rightChar = pair[1];
            
            const phase = ts * 0.002 + p.twinklePhase + i * 0.5;
            const xOffsetLeft = Math.sin(phase) * amplitude;
            const xOffsetRight = Math.sin(phase + Math.PI) * amplitude;
            const zLeft = Math.cos(phase);
            const zRight = Math.cos(phase + Math.PI);
            
            // Draw connecting bond (very faint)
            ctx.beginPath();
            ctx.moveTo(rx + xOffsetLeft, startY + i * spacing);
            ctx.lineTo(rx + xOffsetRight, startY + i * spacing);
            ctx.strokeStyle = `rgba(57, 255, 20, ${Math.min(alpha * 0.4, 0.4)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Left strand character
            ctx.globalAlpha = Math.min(alpha * (zLeft > 0 ? 1 : 0.3), 1);
            ctx.fillText(leftChar, rx + xOffsetLeft, startY + i * spacing);
            
            // Right strand character
            ctx.globalAlpha = Math.min(alpha * (zRight > 0 ? 1 : 0.3), 1);
            ctx.fillText(rightChar, rx + xOffsetRight, startY + i * spacing);
          }
        } else {
          /* Star dot */
          ctx.beginPath();
          ctx.arc(rx, ry, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          if (dist < REPEL_RADIUS * 0.6) {
            ctx.shadowColor = p.color;
            ctx.shadowBlur  = 6;
          }
          ctx.fill();
        }
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
        mixBlendMode: 'screen'
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE — Two column layout
   Left:  REPORT. TRACK. PROTECT. + stats + button + bots
   Right: Exact fingerprint image uploaded by user
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const mouseRef = useRef([0, 0]);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const { t } = useTranslationStore();

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = [
      (e.clientX / window.innerWidth)  * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    ];
  }, []);

  const navLinks = [
    { name: t('NAVBAR.HOME', 'HOME'),           path: '/' },
    { name: t('NAVBAR.REPORT', 'REPORT'),       path: '/submit' },
    { name: t('NAVBAR.TRACK', 'TRACK'),         path: '/track' },
    { name: t('NAVBAR.DASHBOARD', 'DASHBOARD'), path: '/dashboard' },
    { name: t('NAVBAR.LEARN', 'LEARN'),         path: '/learn' },
    { name: t('NAVBAR.ADMIN', 'ADMIN'),         path: '/admin' },
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        background: '#000',
        color: '#fff',
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: 'Inter, sans-serif',
        cursor: 'crosshair',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ════════ STARFIELD BACKGROUND ════════ */}
      <StarField mouseRef={mouseRef} />

      {/* ════════ NAVBAR ════════ */}
      <header style={{
        position: 'fixed', top: 30, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, display: 'flex', alignItems: 'center', padding: '12px 24px',
        /* Apple Liquid Glass Effect */
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '32px', width: '90%', maxWidth: 1200,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ flex: 1 }}>
          <div
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            <img 
              src="/icons/cyberguard/cyberguard-white.png" 
              alt="CyberGuard" 
              onError={(e) => {
                if (!e.target.dataset.triedSvg) {
                  e.target.dataset.triedSvg = 'true';
                  e.target.src = '/icons/cyberguard/cyberguard-white.svg';
                }
              }}
              style={{ width: 176, height: 44, objectFit: 'contain' }} 
            />
          </div>
        </div>
        <nav style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, position: 'relative' }}>
          {navLinks.map(l => (
            <span key={l.name}
              onClick={() => navigate(l.path)}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
              style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', transition: 'color 0.3s' }}
            >{l.name}</span>
          ))}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
              style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', transition: 'color 0.3s' }}
            >
              HELP & FAQ
            </span>

            {showHelpMenu && (
              <div style={{
                position: 'absolute',
                top: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(20,20,20,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '150px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 200
              }}>
                {['Contact Us', 'Feedback', 'FAQ'].map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      setShowHelpMenu(false);
                      if (item === 'Contact Us') window.open('/contactlist.pdf', '_blank');
                      else if (item === 'Feedback') navigate('/feedback');
                      else if (item === 'FAQ') navigate('/faq');
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                      e.target.style.color = '#00B4FF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#fff';
                    }}
                    style={{
                      padding: '10px 20px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '1px',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={() => navigate('/login')}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
            {t('NAVBAR.LOGIN', 'SIGN IN')}
          </button>
          <button onClick={() => navigate('/register-choice')}
            style={{ padding: '10px 20px', background: '#007AFF', border: 'none', color: '#fff', borderRadius: '16px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,122,255,0.3)' }}>
            {t('NAVBAR.JOIN', 'JOIN')}
          </button>
        </div>
      </header>

      {/* ════════ TWO-COLUMN HERO ════════ */}
      <main style={{ flex: 1, display: 'flex', minHeight: '100vh' }}>

        {/* ── LEFT: All content ── */}
        <div style={{
          flex: '0 0 48%',
          display: 'flex',
          alignItems: 'center',
          padding: '120px 40px 60px 5vw',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            {/* REPORT. TRACK. PROTECT. — smaller font so T is never clipped */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              style={{
                fontSize: 'clamp(2.4rem, 4.8vw, 5.2rem)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: '1.0',
                background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 36,
                whiteSpace: 'nowrap',
              }}
            >
              REPORT.<br />TRACK.<br />PROTECT.
            </motion.h1>

            {/* Engine / Nodes / Accuracy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              style={{
                display: 'inline-flex', gap: 32, alignItems: 'center',
                padding: '18px 36px',
                /* Apple Liquid Glass Effect */
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(30px) saturate(200%)',
                WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderTop: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                marginBottom: 28,
              }}
            >
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '2px', margin: '0 0 4px' }}>ENGINE</p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#34C759', margin: 0 }}>STABLE</p>
              </div>
              <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '2px', margin: '0 0 4px' }}>NODES</p>
                <p style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>6,402</p>
              </div>
              <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '2px', margin: '0 0 4px' }}>ACCURACY</p>
                <p style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>98.9%</p>
              </div>
            </motion.div>

            {/* REPORT INCIDENT — directly below stats panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              style={{ marginBottom: 28 }}
            >
              <motion.button
                onClick={() => navigate('/submit')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '20px 56px',
                  /* Liquid Glass Blue Effect */
                  background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.8), rgba(0, 80, 200, 0.9))',
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  borderRadius: '40px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.6)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 12px 32px rgba(0, 122, 255, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                  display: 'block',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                {t('NAVBAR.REPORT', 'REPORT INCIDENT')}
              </motion.button>
            </motion.div>

            {/* ChatBot + Voice Assistant — directly below REPORT INCIDENT */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              style={{ display: 'flex', gap: 14 }}
            >
              <div style={{ background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '10px 14px' }}>
                <ChatBot />
              </div>
              <div style={{ background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '10px 14px' }}>
                <VoiceAssistant />
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* ── RIGHT: Fingerprint image — stars visible behind it ── */}
        <div style={{
          flex: '0 0 52%',
          position: 'relative',
          background: 'transparent',  /* transparent so starfield shows through */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src="/fingerprint.png"
            alt="Forensic fingerprint"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center center',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
              maxHeight: '100vh',
              mixBlendMode: 'screen', /* black pixels → transparent; white ridges stay visible */
            }}
          />
          {/* Left-edge blend into left column */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(to right, #000 0%, transparent 12%)',
          }} />
        </div>

      </main>

    </div>
  );
}
