import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button, { IconButton } from './Button';
import { MessageCircle, Send } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "I can help you find a report, track a case, or open your dashboard.", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      processQuery(userMessage.toLowerCase());
      setIsTyping(false);
    }, 1000);
  };

  const processQuery = (query) => {
    let response = "";
    
    if (query.includes("report") || query.includes("submit") || query.includes("incident") || query.includes("crime")) {
      response = "Open Report to submit a cybercrime incident. The form will guide you through the required details.";
    } else if (query.includes("track") || query.includes("status")) {
      response = "You can track your existing complaints by visiting the 'Track' section. You'll need the Reference ID provided at the time of submission.";
    } else if (query.includes("dashboard") || query.includes("stats") || query.includes("analytics")) {
      response = "The Dashboard shows live stats of cybercrime activity. If you're a user, it shows your reports; if you're an admin, it shows global analytics.";
    } else if (query.includes("admin") || query.includes("police")) {
      response = "Admin access is restricted to authorized personnel. Use the 'ADMIN LOGIN' button at the top right to access the command center.";
    } else if (query.includes("register") || query.includes("sign up")) {
      response = "Click 'GET STARTED' or 'Register' to create an account as a Citizen or join as an Official.";
    } else if (query.includes("hello") || query.includes("hi") || query.includes("hey")) {
      response = "Hello. I can help you navigate CyberGuard and find the right action.";
    } else if (query.includes("help") || query.includes("navigate") || query.includes("menu")) {
      response = "I can guide you! Try: 'How to report?', 'Where is my dashboard?', or 'How to track status?'.";
    } else {
      response = "Query received. My knowledge base suggests checking the 'Report' or 'Dashboard' sections for most actions. Can I help you navigate somewhere?";
    }

    setMessages(prev => [...prev, { text: response, isBot: true }]);
  };

  const quickActions = [
    { label: "Report Crime", path: "/submit" },
    { label: "Track Status", path: "/track" },
    { label: "View Dashboard", path: "/dashboard" },
    { label: "Admin Hub", path: "/admin" },
  ];

  return (
    <div style={styles.container}>
      {/* Chat Toggle Button — Accessible Icon Button with mint stroke and 12px control radius */}
      <IconButton
        label="Chat assistance"
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <MessageCircle size={20} strokeWidth={1.8} />
      </IconButton>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            style={styles.window}
          >
            <div style={styles.header}>
              <div style={styles.headerTitle}>
                <span style={styles.onlineDot} />
                Help assistant
              </div>
              <IconButton label="Close help" size="sm" onClick={() => setIsOpen(false)}>Ã—</IconButton>
            </div>

            <div style={styles.messagesContainer}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  ...styles.message,
                  alignSelf: msg.isBot ? 'flex-start' : 'flex-end',
                  background: msg.isBot ? 'rgba(0, 255, 170, 0.08)' : 'rgba(0, 180, 255, 0.08)',
                  borderColor: msg.isBot ? 'rgba(0, 255, 170, 0.2)' : 'rgba(0, 180, 255, 0.2)',
                  borderTopLeftRadius: msg.isBot ? 0 : 12,
                  borderTopRightRadius: msg.isBot ? 12 : 0,
                }}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div style={{ ...styles.message, alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', fontStyle: 'italic', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  Analyzing query...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.quickActions}>
              {quickActions.map(action => (
                  <Button
                    key={action.label} 
                    variant="secondary"
                    size="sm"
                  onClick={() => {
                    navigate(action.path);
                    setIsOpen(false);
                  }}
                  >
                    {action.label}
                  </Button>
              ))}
            </div>

            <div style={styles.inputArea}>
              <input 
                style={styles.input}
                placeholder="How can I help?"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <IconButton label="Send message" size="md" onClick={handleSend}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
                </svg>
              </IconButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
    verticalAlign: 'middle',
  },
  trigger: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-strong)',
    color: 'var(--primary)',
    boxShadow: 'none',
    transition: 'all 0.3s ease',
  },
  window: {
    position: 'fixed',
    bottom: '90px',
    left: '40px',
    width: '340px',
    height: '480px',
    background: 'var(--bg-popover)',
    border: '1px solid var(--border-strong)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    padding: '18px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-card)',
  },
  headerTitle: {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '3px',
    color: 'var(--text)',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  onlineDot: {
    width: '6px',
    height: '6px',
    background: '#00ffaa',
    borderRadius: '50%',
    boxShadow: 'none',
  },
  closeBtn: {
    cursor: 'pointer',
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.3)',
    transition: 'color 0.2s',
    lineHeight: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'var(--bg-popover)',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    maxWidth: '85%',
    lineHeight: '1.5',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontFamily: 'Inter, sans-serif',
  },
  quickActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '0 20px 20px',
  },
  actionBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '10px',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
  },
  inputArea: {
    padding: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    gap: '12px',
    background: 'rgba(0,0,0,0.2)',
  },
  input: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 15px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    background: '#00ffaa',
    border: 'none',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#000',
    transition: 'transform 0.2s',
  }
};

export default ChatBot;

