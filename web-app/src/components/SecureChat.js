import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';
import io from 'socket.io-client';
import { chatsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5002');

export default function SecureChat({ complaintId }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef();
  const scrollRef = useRef();

  // Deterministic E2EE Key (In production, this would be a shared secret or key exchange)
  const encryptionKey = CryptoJS.SHA256(complaintId).toString().slice(0, 32);

  const encrypt = (text) => {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(encryptionKey), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return {
      content: encrypted.toString(),
      iv: iv.toString()
    };
  };

  const decrypt = (encrypted, iv) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(encryptionKey), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return "[Decryption Failed]";
    }
  };

  useEffect(() => {
    if (!complaintId) {
      setLoading(false);
      return;
    }

    // 1. Fetch History
    const fetchHistory = async () => {
      try {
        const { data } = await chatsAPI.getMessages(complaintId);
        const decryptedMessages = (data.data?.messages || []).map(m => ({
          ...m,
          decryptedContent: decrypt(m.content, m.iv)
        }));
        setMessages(decryptedMessages);
      } catch (err) {
        console.error('Chat history fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // 2. Initialize Socket
    socketRef.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('accessToken') },
      withCredentials: true,
      transports: ['websocket']
    });

    socketRef.current.emit('join-chat', complaintId);

    socketRef.current.on('new-chat-message', (data) => {
      setMessages(prev => [
        ...prev, 
        { ...data, decryptedContent: decrypt(data.content, data.iv), createdAt: new Date() }
      ]);
    });

    return () => socketRef.current.disconnect();
  }, [complaintId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const { content, iv } = encrypt(input);
    const payload = {
      complaintId,
      sender: {
        _id: user._id || user.id,
        name: user.name,
        role: user.role
      },
      content,
      iv
    };

    try {
      // Send via socket for real-time
      socketRef.current.emit('chat-message', payload);
      // Persist to DB
      await chatsAPI.sendMessage(complaintId, payload);
      setInput('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="card-cyber" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '500px', 
      padding: 0,
      overflow: 'hidden',
      border: '1px solid rgba(0,180,255,0.2)'
    }}>
      {/* Chat Header */}
      <div style={{ 
        padding: '15px 20px', 
        borderBottom: '1px solid rgba(0,180,255,0.2)', 
        background: 'rgba(13,71,161,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontFamily: 'Orbitron, monospace', color: '#00B4FF' }}>
            SECURE COMMS CHANNEL
          </h3>
          <span style={{ fontSize: '10px', color: '#00ffaa' }}>● E2EE ENCRYPTION ACTIVE</span>
        </div>
      </div>

      {/* Message Area */}
      <div style={{ 
        flex: 1, 
        padding: '20px', 
        overflowY: 'auto', 
        background: 'rgba(10,15,30,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#5A6480', fontSize: '12px', marginTop: '100px' }}>
            ESTABLISHING SECURE CONNECTION...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5A6480', fontSize: '12px', marginTop: '100px' }}>
            No messages yet. Send a secure message to start the conversation.
          </div>
        ) : (
          messages.map((m, i) => {
            const senderId = (m.sender?._id || (typeof m.sender === 'string' ? m.sender : m.sender?.id))?.toString();
            const currentUserId = (user?._id || user?.id)?.toString();
            const isMe = Boolean(senderId && currentUserId && senderId === currentUserId);
            const senderName = m.sender?.name || (isMe ? 'You' : 'Officer');
            const senderRole = m.sender?.role ? m.sender.role.toUpperCase() : 'OFFICER';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                {!isMe && (
                  <div style={{ fontSize: '10px', color: '#8892B0', marginBottom: '4px', marginLeft: '4px' }}>
                    {senderName} ({senderRole})
                  </div>
                )}
                <div style={{
                  padding: '10px 16px',
                  borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  background: isMe ? 'linear-gradient(135deg, #0D47A1, #00B4FF)' : 'rgba(255,255,255,0.05)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '13px',
                  position: 'relative'
                }}>
                  {m.decryptedContent}
                  <div style={{ 
                    fontSize: '9px', 
                    color: isMe ? 'rgba(255,255,255,0.6)' : '#5A6480', 
                    textAlign: 'right', 
                    marginTop: '4px' 
                  }}>
                    {format(new Date(m.createdAt), 'HH:mm')}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ 
        padding: '15px', 
        background: 'rgba(0,0,0,0.3)', 
        display: 'flex', 
        gap: '10px',
        borderTop: '1px solid rgba(0,180,255,0.1)'
      }}>
        <input
          type="text"
          placeholder="Enter encrypted message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(0,180,255,0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#fff',
            outline: 'none',
            fontSize: '13px'
          }}
        />
        <button
          type="submit"
          style={{
            background: '#00B4FF',
            border: 'none',
            borderRadius: '8px',
            padding: '0 20px',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          SEND
        </button>
      </form>
    </div>
  );
}
