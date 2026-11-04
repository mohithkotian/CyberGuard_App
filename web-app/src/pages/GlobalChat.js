import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import { chatsAPI, userAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import useNotificationStore from '../hooks/useNotificationStore';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getAvatarUrl, getAvatarFallback, getAvatarGradient } from '../utils/avatar';
import { Paperclip, Send, Globe, Shield, User, X } from 'lucide-react';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5002');

export default function GlobalChat() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState({ id: 'global', name: 'Global Network', type: 'global' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef(null);
  const socketRef = useRef();
  const scrollRef = useRef();

  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessageTimes, setLastMessageTimes] = useState({});

  const currentUserId = (user?._id || user?.id || '')?.toString();

  const getEncryptionKey = (otherId) => {
    const myId = currentUserId || 'anon';
    const ids = [myId, String(otherId || '')].sort();
    return CryptoJS.SHA256(ids.join('-')).toString().slice(0, 32);
  };

  const decrypt = (encrypted, iv, key) => {
    try {
      if (!iv || !encrypted) return encrypted || '';
      const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      return result || encrypted;
    } catch (e) { 
      return encrypted || ''; 
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await userAPI.getAll();
        const userList = data?.data?.users || [];
        setUsers(userList);
      } catch (err) { 
        toast.error('Failed to load users'); 
      }
    };
    fetchUsers();

    socketRef.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('accessToken') },
      withCredentials: true,
      transports: ['websocket']
    });

    if (currentUserId) {
      socketRef.current.emit('join-user', currentUserId);
    }
    socketRef.current.emit('join-global');

    socketRef.current.on('new-global-message', (data) => {
      if (selectedChat?.id === 'global' && data) {
        setMessages(prev => [...prev, { ...data, createdAt: data.createdAt || new Date() }]);
      }
    });

    socketRef.current.on('new-private-message', (data) => {
      if (!data) return;
      const senderId = (data.sender?._id || (typeof data.sender === 'string' ? data.sender : null))?.toString();
      const recipientId = (data.recipientId || data.recipient?._id || (typeof data.recipient === 'string' ? data.recipient : null))?.toString();
      
      const isRelevant = (selectedChat?.id === senderId) || (selectedChat?.id === recipientId);
      const otherUserId = senderId === currentUserId ? recipientId : senderId;
      
      if (otherUserId) {
        setLastMessageTimes(prev => ({
          ...prev,
          [otherUserId]: new Date().getTime()
        }));
      }

      if (isRelevant && selectedChat?.id) {
        const key = getEncryptionKey(selectedChat.id);
        setMessages(prev => [...prev, { 
          ...data, 
          decryptedContent: data.iv ? decrypt(data.content, data.iv, key) : data.content,
          createdAt: data.createdAt || new Date() 
        }]);
      } else {
        if (senderId && senderId !== currentUserId) {
          setUnreadCounts(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }));
        }
        useNotificationStore.getState().addNotification({
          type: 'message',
          message: `Direct Message from ${data.sender?.name || 'Officer'}: ${data.content || ''}`
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [selectedChat?.id, currentUserId]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedChat) return;
      setLoading(true);
      try {
        if (selectedChat.type === 'global') {
          const { data } = await chatsAPI.getGlobal();
          const list = data?.data?.messages || [];
          setMessages(list.map(m => ({ ...m, decryptedContent: m?.content || '' })));
        } else if (selectedChat.id) {
          const { data } = await chatsAPI.getPrivate(selectedChat.id);
          const key = getEncryptionKey(selectedChat.id);
          const list = data?.data?.messages || [];
          setMessages(list.map(m => ({
            ...m,
            decryptedContent: m?.iv ? decrypt(m.content, m.iv, key) : (m?.content || '')
          })));
        }
      } catch (err) { 
        console.error('Chat history fetch error:', err);
        toast.error('History failed to load'); 
      }
      setLoading(false);
    };
    fetchHistory();
  }, [selectedChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAttachClick = () => {
    setShowAttachMenu(!showAttachMenu);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (attachments.length + newFiles.length > 5) {
        toast.error('Maximum 5 attachments allowed');
        return;
      }
      setAttachments(prev => [...prev, ...newFiles]);
    }
    setShowAttachMenu(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    const payload = {
      sender: { 
        _id: currentUserId, 
        name: user?.name || 'Officer', 
        role: user?.role || 'officer', 
        avatar: user?.avatar || null 
      },
      createdAt: new Date()
    };
    
    const messageObj = { ...payload };

    try {
      if (selectedChat?.type === 'global') {
        const formData = new FormData();
        if (input.trim()) formData.append('content', input);
        attachments.forEach(file => formData.append('attachments', file));
        
        messageObj.content = input;
        
        socketRef.current?.emit('global-message', messageObj);
        await chatsAPI.sendGlobal(formData);
      } else if (selectedChat?.id) {
        const key = getEncryptionKey(selectedChat.id);
        const iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
        const encrypted = input.trim() ? CryptoJS.AES.encrypt(input, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString() : '';

        const formData = new FormData();
        if (encrypted) formData.append('content', encrypted);
        formData.append('iv', iv);
        attachments.forEach(file => formData.append('attachments', file));

        messageObj.recipientId = selectedChat.id;
        messageObj.content = encrypted;
        messageObj.iv = iv;

        socketRef.current?.emit('private-message', messageObj);
        await chatsAPI.sendPrivate(selectedChat.id, formData);
        
        setLastMessageTimes(prev => ({
          ...prev,
          [selectedChat.id]: new Date().getTime()
        }));
      }
      setInput('');
      setAttachments([]);
    } catch (err) { 
      toast.error('Send failed'); 
    }
  };

  const filteredUsers = (users || []).filter(u => 
    u && 
    u._id?.toString() !== currentUserId && 
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const timeA = lastMessageTimes[a._id] || 0;
    const timeB = lastMessageTimes[b._id] || 0;
    return timeB - timeA;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#d96464';
      case 'officer': return '#FFB800';
      case 'education': return '#C7C4BC';
      default: return '#f2f0ea';
    }
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#070707', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <Navbar />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar */}
        <div style={{ 
          width: '320px', 
          background: '#0a0a0a', 
          borderRight: '1px solid #30302d',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #20201f' }}>
            <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#888880', margin: '0 0 12px 0', fontWeight: 700 }}>
              NETWORK COMMS
            </h2>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: '#141414',
                border: '1px solid #30302d',
                borderRadius: '8px',
                padding: '10px 18px',
                color: '#f2f0ea',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {/* Global Room */}
            <div 
              onClick={() => setSelectedChat({ id: 'global', name: 'Global Network', type: 'global' })}
              style={{
                margin: '0 12px 8px 12px',
                padding: '14px 18px',
                cursor: 'pointer',
                borderRadius: '12px',
                background: selectedChat?.id === 'global' ? '#1c1c1a' : '#141414',
                border: selectedChat?.id === 'global' ? '1px solid #f2f0ea' : '1px solid #30302d',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1f1f1d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2f0ea' }}>
                <Globe size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#f2f0ea', fontSize: '14px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.5px' }}>
                  Global Network
                </div>
                <div style={{ fontSize: '11px', color: '#777', fontFamily: "'IBM Plex Mono', monospace" }}>
                  Broadcast Channel
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px 8px 24px', fontSize: '10px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700 }}>
              DIRECT MESSAGES
            </div>

            {sortedUsers.map(u => {
              const isSelected = selectedChat?.id === u._id;
              return (
                <div 
                  key={u._id}
                  onClick={() => {
                    setSelectedChat({ id: u._id, name: u.name || 'Officer', type: 'private', role: u.role || 'officer', avatar: u.avatar });
                    setUnreadCounts(prev => ({ ...prev, [u._id]: 0 }));
                  }}
                  style={{
                    padding: '12px 24px',
                    cursor: 'pointer',
                    background: isSelected ? '#141414' : 'transparent',
                    borderLeft: isSelected ? '3px solid #f2f0ea' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    background: getAvatarGradient(u.role, u.email === 'pruthvishetty04@gmail.com'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', border: `1px solid #30302d`,
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {getAvatarUrl(u.avatar) ? (
                      <img 
                        src={getAvatarUrl(u.avatar)} 
                        alt={u.name} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      getAvatarFallback(u.name, u.email === 'pruthvishetty04@gmail.com')
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#f2f0ea', fontSize: '13px' }}>{u.name}</div>
                    <div style={{ fontSize: '10px', color: getRoleColor(u.role), textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>{u.role}</div>
                  </div>
                  {unreadCounts[u._id] > 0 && (
                    <div style={{
                      background: '#d96464',
                      color: '#070707',
                      fontSize: '10px',
                      fontWeight: 800,
                      borderRadius: '8px',
                      padding: '2px 8px',
                      textAlign: 'center',
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}>
                      {unreadCounts[u._id]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Chat Feed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#070707' }}>
          {/* Header */}
          <div style={{ 
            padding: '16px 28px', 
            background: '#0d0d0d', 
            borderBottom: '1px solid #30302d',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              background: '#3DF5C0'
            }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f2f0ea', fontSize: '15px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.5px' }}>
                {selectedChat?.name || 'Comms Channel'}
              </div>
              <div style={{ fontSize: '11px', color: '#777', fontFamily: "'IBM Plex Mono', monospace" }}>
                {selectedChat?.type === 'global' ? 'End-to-End Encrypted Node' : `${(selectedChat?.role || 'OFFICER').toUpperCase()} • Private Encrypted Channel`}
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div style={{ 
            flex: 1, 
            padding: '28px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '14px' 
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '80px', color: '#777', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
                DECRYPTING SECURE FEED...
              </div>
            ) : (
              messages.map((m, i) => {
                if (!m) return null;
                const senderId = (m.sender?._id || (typeof m.sender === 'string' ? m.sender : null))?.toString();
                const isMe = Boolean(senderId && currentUserId && senderId === currentUserId);
                const senderName = m.sender?.name || (isMe ? (user?.name || 'You') : 'Officer');
                const senderRole = m.sender?.role || (isMe ? (user?.role || 'officer') : 'officer');
                const senderAvatar = m.sender?.avatar || (isMe ? user?.avatar : null);

                let formattedTime = '';
                try {
                  if (m.createdAt) {
                    formattedTime = format(new Date(m.createdAt), 'HH:mm');
                  }
                } catch (e) {
                  formattedTime = '';
                }

                return (
                  <div
                    key={m._id || i}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '65%'
                    }}
                  >
                    {!isMe && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', marginLeft: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#888880', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          {senderName}
                        </span>
                        <span style={{ fontSize: '10px', color: getRoleColor(senderRole), fontFamily: "'IBM Plex Mono', monospace" }}>
                          ({senderRole})
                        </span>
                      </div>
                    )}
                    <div style={{
                      padding: '12px 18px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? '#1c1c1a' : '#141414',
                      border: isMe ? '1px solid #3e3e3b' : '1px solid #30302d',
                      color: '#f2f0ea',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {m.decryptedContent || m.content}
                      {m.attachments && m.attachments.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {m.attachments.map((att, idx) => (
                            <a 
                              key={idx} 
                              href={att?.url?.startsWith('http') ? att.url : `${SOCKET_URL}${att?.url || ''}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{
                                display: 'block',
                                color: '#f2f0ea',
                                fontSize: '12px',
                                textDecoration: 'underline',
                                fontFamily: "'IBM Plex Mono', monospace"
                              }}
                            >
                              📎 {att?.filename || 'Attachment'}
                            </a>
                          ))}
                        </div>
                      )}
                      {formattedTime && (
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#777', 
                          textAlign: 'right', 
                          marginTop: '4px',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}>
                          {formattedTime}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} style={{ 
            padding: '18px 24px', 
            background: '#0d0d0d', 
            borderTop: '1px solid #30302d',
            display: 'flex',
            gap: '12px',
            position: 'relative',
            alignItems: 'center'
          }}>
            {attachments.length > 0 && (
              <div style={{ position: 'absolute', bottom: '100%', left: '24px', display: 'flex', gap: '8px', padding: '8px 14px', background: '#141414', borderRadius: '12px 12px 0 0', border: '1px solid #30302d', borderBottom: 'none' }}>
                {attachments.map((file, i) => (
                  <div key={i} style={{ background: '#1f1f1d', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'IBM Plex Mono', monospace" }}>
                    <span style={{ color: '#f2f0ea' }}>{file.name}</span>
                    <span onClick={() => removeAttachment(i)} style={{ cursor: 'pointer', color: '#d96464', fontWeight: 'bold' }}>✕</span>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              type="button"
              onClick={handleAttachClick}
              style={{ 
                background: '#141414', 
                border: '1px solid #30302d', 
                borderRadius: '999px', 
                color: '#b8b8b0', 
                cursor: 'pointer', 
                width: '44px', 
                height: '44px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Add Attachment"
            >
              <Paperclip size={16} />
            </button>
            
            <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
            
            <input 
              type="text" 
              placeholder={selectedChat?.type === 'global' ? "Broadcast message to network..." : `Message ${selectedChat?.name || 'Officer'}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                background: '#141414',
                border: '1px solid #30302d',
                borderRadius: '8px',
                padding: '12px 22px',
                color: '#f2f0ea',
                outline: 'none',
                fontSize: '14px',
                fontFamily: "'IBM Plex Sans', sans-serif"
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#f2f0ea'}
              onBlur={e => e.currentTarget.style.borderColor = '#30302d'}
            />
            
            <button 
              type="submit"
              style={{
                background: '#f2f0ea',
                border: 'none',
                borderRadius: '999px',
                height: '44px',
                padding: '0 24px',
                color: '#070707',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '13px',
                letterSpacing: '1px',
                flexShrink: 0
              }}
            >
              SEND
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
