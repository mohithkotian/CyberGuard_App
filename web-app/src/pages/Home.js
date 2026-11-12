import React, { useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
             : Math.random() < 0.04 ? '#EFEDE8'
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
        display: 'block'
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
  const helpBtnRef = useRef(null);
  const helpMenuRef = useRef(null);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [helpMenuPos, setHelpMenuPos] = useState({ top: 88, left: 0 });
  const { t } = useTranslationStore();

  const updateHelpMenuPos = useCallback(() => {
    if (!helpBtnRef.current) return;
    const rect = helpBtnRef.current.getBoundingClientRect();
    const menuHalfWidth = 90;
    const viewportW = window.innerWidth || 1200;
    const rawCenter = rect.left + rect.width / 2;
    const clampedLeft = Math.max(menuHalfWidth + 12, Math.min(viewportW - menuHalfWidth - 12, rawCenter));
    setHelpMenuPos({ top: rect.bottom + 12, left: clampedLeft });
  }, []);

  const toggleHelpMenu = () => {
    if (!showHelpMenu) {
      updateHelpMenuPos();
    }
    setShowHelpMenu((prev) => !prev);
  };

  useEffect(() => {
    if (!showHelpMenu) return undefined;

    const handleOutside = (e) => {
      if (
        helpBtnRef.current?.contains(e.target) ||
        helpMenuRef.current?.contains(e.target)
      ) {
        return;
      }
      setShowHelpMenu(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowHelpMenu(false);
        helpBtnRef.current?.focus();
      }
    };

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('touchstart', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateHelpMenuPos);
    window.addEventListener('scroll', updateHelpMenuPos, true);

    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateHelpMenuPos);
      window.removeEventListener('scroll', updateHelpMenuPos, true);
    };
  }, [showHelpMenu, updateHelpMenuPos]);

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
        minHeight: '100dvh',
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
      <header className="home-top-header" style={{
        position: 'fixed', top: 30, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, display: 'flex', alignItems: 'center', padding: '12px 24px',
        background: 'rgba(13, 13, 13, 0.92)',
        border: '1px solid #292927',
        borderRadius: '16px', width: '90%', maxWidth: 1200,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        gap: '12px',
      }}>
        <div className="home-top-brand" style={{ flex: 1, minWidth: 0 }}>
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
              style={{ width: 176, maxWidth: '100%', height: 44, objectFit: 'contain' }} 
            />
          </div>
        </div>
        <nav className="home-top-nav" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(12px, 1.8vw, 28px)', position: 'relative', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%', minWidth: 0 }}>
          {navLinks.map(l => (
            <Link 
              key={l.name}
              to={l.path}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
              style={{
                textDecoration: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.12em',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            >
              {l.name}
            </Link>
          ))}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button
              ref={helpBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={showHelpMenu}
              aria-controls="home-help-faq-menu"
              onClick={toggleHelpMenu}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = showHelpMenu ? '#fff' : 'rgba(255,255,255,0.7)'}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 2px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                color: showHelpMenu ? '#fff' : 'rgba(255,255,255,0.7)',
                letterSpacing: '0.12em',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            >
              <span>{t('NAVBAR.HELP_FAQ', 'HELP & FAQ')}</span>
              <span aria-hidden="true" style={{ fontSize: '9px', opacity: 0.75, transform: showHelpMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
            </button>
          </div>
        </nav>
        {showHelpMenu && createPortal(
          <div
            ref={helpMenuRef}
            id="home-help-faq-menu"
            role="menu"
            aria-label="Help and FAQ options"
            style={{
              position: 'fixed',
              top: `${helpMenuPos.top}px`,
              left: `${helpMenuPos.left}px`,
              transform: 'translateX(-50%)',
              background: '#0d0d0d',
              border: '1px solid #292927',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '176px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
              zIndex: 99999
            }}
          >
            {[
              { label: 'Contact Us', action: () => window.open('/contactlist.pdf', '_blank', 'noopener,noreferrer') },
              { label: 'Feedback', action: () => navigate('/feedback') },
              { label: 'FAQ', action: () => navigate('/faq') }
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowHelpMenu(false);
                  item.action();
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1c1c1a';
                  e.currentTarget.style.color = '#f2f0ea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#d8d5ce';
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#d8d5ce',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  textAlign: 'center',
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
        <div className="home-top-actions" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
          <button onClick={() => navigate('/login')}
            style={{ padding: '10px 20px', background: '#141414', border: '1px solid #242422', color: '#EFEDE8', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {t('NAVBAR.LOGIN', 'SIGN IN')}
          </button>
          <button onClick={() => navigate('/register-choice')}
            style={{ padding: '10px 20px', background: '#EFEDE8', border: '1px solid #242422', color: '#0A0A0A', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', boxShadow: 'none', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {t('NAVBAR.JOIN', 'JOIN')}
          </button>
        </div>
      </header>
      <style>{`
        .home-top-nav::-webkit-scrollbar { display: none; }
        @media (max-width: 960px) {
          .home-top-header {
            top: 12px !important;
            width: calc(100% - 24px) !important;
            padding: 10px 14px !important;
            flex-wrap: wrap !important;
          }
          .home-top-brand {
            flex: 1 1 auto !important;
          }
          .home-top-brand img {
            width: 132px !important;
            height: 34px !important;
          }
          .home-top-actions {
            flex: 0 0 auto !important;
            gap: 8px !important;
          }
          .home-top-actions button {
            padding: 8px 12px !important;
          }
          .home-top-nav {
            order: 3;
            flex: 1 0 100% !important;
            justify-content: flex-start !important;
            padding-top: 8px;
            border-top: 1px solid #242422;
          }
        }
      `}</style>

      {/* ════════ TWO-COLUMN HERO ════════ */}
      <main style={{ flex: 1, display: 'flex', minHeight: '100dvh' }}>

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
                color: '#EFEDE8',
                
                
                marginBottom: 36,
                whiteSpace: 'nowrap',
              }}
            >
              REPORT.<br />TRACK.<br />PROTECT.
            </motion.h1>

            {/* SERVICE / AVAILABILITY / SUBMISSION */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              style={{
                display: 'inline-flex',
                gap: 36,
                alignItems: 'center',
                padding: '16px 36px',
                background: '#0d0d0d',
                borderRadius: '16px', border: '1px solid #242422', boxShadow: 'none',
                marginBottom: 28,
              }}
            >
              <div>
                <p style={{
                  fontSize: '11px',
                  color: '#8E8B85',
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  letterSpacing: '0.12em',
                  margin: '0 0 4px',
                  textTransform: 'uppercase'
                }}>
                  SERVICE
                </p>
                <p style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: '#3DF5C0',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  Operational
                </p>
              </div>

              <div style={{ width: 1, height: 36, background: '#262623' }} />

              <div>
                <p style={{
                  fontSize: '11px',
                  color: '#8E8B85',
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  letterSpacing: '0.12em',
                  margin: '0 0 4px',
                  textTransform: 'uppercase'
                }}>
                  AVAILABILITY
                </p>
                <p style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: '#f2f0ea',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  24 / 7
                </p>
              </div>

              <div style={{ width: 1, height: 36, background: '#262623' }} />

              <div>
                <p style={{
                  fontSize: '11px',
                  color: '#8E8B85',
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  letterSpacing: '0.12em',
                  margin: '0 0 4px',
                  textTransform: 'uppercase'
                }}>
                  SUBMISSION
                </p>
                <p style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: '#f2f0ea',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  Encrypted
                </p>
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
                  padding: '16px 48px',
                  background: '#EFEDE8', border: '1px solid #EFEDE8', borderRadius: '8px',
                  color: '#070707', fontSize: '15px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  display: 'block',
                  textShadow: 'none'
                }}
              >
                {t('NAVBAR.REPORT', 'REPORT INCIDENT')}
              </motion.button>
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
              maxHeight: '100dvh',
            }}
          />
        </div>

      </main>
    </div>
  );
}
