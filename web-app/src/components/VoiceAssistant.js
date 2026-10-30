import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
      toast('Neural Voice Engine Active', { icon: '◉' });
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
      speak('System status is operational. Accuracy at ninety-seven point four percent.');
    } else if (command.includes('report') || command.includes('incident')) {
      speak('Initializing incident report module.');
      setTimeout(() => window.location.href = '/submit', 2000);
    } else if (command.includes('dashboard')) {
      speak('Navigating to secure dashboard.');
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } else if (command.includes('hello') || command.includes('hi')) {
      speak('Hello agent. I am CyberGuard Voice Assistant. How can I help you today?');
    } else {
      speak(`I heard ${command}. I am still learning neural commands.`);
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
      <motion.div
        whileHover={{ scale: 1.1, boxShadow: isListening ? '0 0 30px rgba(255, 82, 82, 0.6)' : '0 0 25px rgba(0, 255, 170, 0.4)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: isListening ? 'rgba(255, 82, 82, 0.15)' : 'rgba(0, 255, 170, 0.05)',
          border: isListening ? '2px solid #FF5252' : '2px solid rgba(0, 255, 170, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isListening ? '0 0 20px rgba(255, 82, 82, 0.4)' : '0 0 15px rgba(0, 255, 170, 0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isListening ? "#FF5252" : "#00ffaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>

        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -6,
              border: '2px solid #FF5252',
              borderRadius: '14px',
              pointerEvents: 'none'
            }}
          />
        )}
      </motion.div>

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
              background: 'rgba(3, 10, 15, 0.95)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(0, 255, 170, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              minWidth: '200px',
              zIndex: 100
            }}
          >
            <div style={{ color: '#00ffaa', fontFamily: 'Orbitron, monospace', fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px' }}>
              VOICE LINK
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
                  background: isListening ? 'rgba(0, 255, 170, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                  border: isListening ? '1px solid #00ffaa' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isListening ? '#00ffaa' : '#fff',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 'bold'
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
                  background: !isListening ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                  border: !isListening ? '1px solid #FF5252' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: !isListening ? '#FF5252' : '#fff',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 'bold'
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
