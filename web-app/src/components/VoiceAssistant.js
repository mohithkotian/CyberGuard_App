import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { IconButton } from './Button';

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognition = React.useMemo(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    
    rec.onstart = () => {
      setIsListening(true);
      toast('Voice input is active');
    };
    
    rec.onresult = (event) => {
      const current = event.resultIndex;
      const result = event.results[current][0].transcript;
      setTranscript(result);
      processCommand(result.toLowerCase());
    };
    
    rec.onend = () => setIsListening(false);
    
    rec.onerror = () => {
      setIsListening(false);
      toast.error('Voice uplink failed');
    };
    
    return rec;
  }, []);

  const processCommand = (command) => {
    if (command.includes('status')) {
      speak('System status is operational.');
    } else if (command.includes('report') || command.includes('incident')) {
      speak('Opening the incident report.');
      setTimeout(() => window.location.href = '/submit', 2000);
    } else if (command.includes('dashboard')) {
      speak('Opening the dashboard.');
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } else if (command.includes('hello') || command.includes('hi')) {
      speak('Hello. How can I help you today?');
    } else {
      speak(`I heard ${command}. I can help with reports, status, and the dashboard.`);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.9;
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ position: 'relative' }}>
      <IconButton
        label="Voice report"
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          background: isListening ? 'rgba(217, 100, 100, 0.12)' : 'var(--cg-surface)',
          borderColor: isListening ? 'var(--danger)' : 'var(--cg-border)',
          color: isListening ? '#FF5252' : 'var(--cg-accent)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>

        {isListening && (
          <span
            style={{
              position: 'absolute',
              inset: -4,
              border: '2px solid #FF5252',
              borderRadius: 'var(--radius-control)',
              pointerEvents: 'none'
            }}
          />
        )}
      </IconButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 15,
              background: 'var(--bg-popover)',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow)',
              minWidth: '200px',
              zIndex: 100
            }}
          >
            <div style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: 700 }}>
              Voice input
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => {
                  if (!recognition) {
                    toast.error('Speech recognition not supported');
                    return;
                  }
                  if (!isListening) recognition.start();
                }}
                style={{ 
                  flex: 1, padding: '10px', 
                  background: isListening ? 'rgba(46, 191, 143, 0.14)' : 'var(--bg-card)', 
                  border: isListening ? '1px solid var(--accent)' : '1px solid var(--border)',
                  color: isListening ? 'var(--accent)' : 'var(--text)',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700
                }}
              >
                ON
              </button>
              <button 
                onClick={() => {
                  if (recognition && isListening) recognition.stop();
                }}
                style={{ 
                  flex: 1, padding: '10px', 
                  background: !isListening ? 'rgba(217, 100, 100, 0.12)' : 'var(--bg-card)', 
                  border: !isListening ? '1px solid var(--danger)' : '1px solid var(--border)',
                  color: !isListening ? 'var(--danger)' : 'var(--text)',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700
                }}
              >
                OFF
              </button>
            </div>
            {transcript && isListening && (
              <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: '#8892b0', fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>
                <span style={{ color: '#00ffaa' }}>&gt;</span> {transcript}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceAssistant;

