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

  // Helper for current user ID
  const currentUserId = (user?._id || user?.id || '')?.toString();

  // Encryption logic for private chats
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
    // 1. Fetch Contact List
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

    // 2. Initialize Socket
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
      case 'admin': return '#FF5252';
      case 'officer': return '#FFD600';
      case 'education': return '#A855F7';
      default: return '#00B4FF';
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#030a0f' }}>
      <Navbar />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar */}
        <div style={{ 
          width: '350px', 
          background: 'rgba(10,15,30,0.8)', 
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#00B4FF', marginBottom: '16px' }}>NETWORK</h2>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Global Room */}
            <div 
              onClick={() => setSelectedChat({ id: 'global', name: 'Global Network', type: 'global' })}
              style={{
                padding: '16px 24px',
                cursor: 'pointer',
                background: selectedChat?.id === 'global' ? 'rgba(0,180,255,0.1)' : 'transparent',
                borderLeft: selectedChat?.id === 'global' ? '4px solid #00B4FF' : '4px solid transparent',
                transition: '0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#00B4FF', fontSize: '14px' }}>🌐 Global Network</div>
              <div style={{ fontSize: '11px', color: '#5A6480' }}>Internal broadcast channel</div>
            </div>

            <div style={{ padding: '16px 24px', fontSize: '10px', color: '#5A6480', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Direct Messages
            </div>

            {sortedUsers.map(u => (
              <div 
                key={u._id}
                onClick={() => {
                  setSelectedChat({ id: u._id, name: u.name || 'Officer', type: 'private', role: u.role || 'officer', avatar: u.avatar });
                  setUnreadCounts(prev => ({ ...prev, [u._id]: 0 }));
                }}
                style={{
                  padding: '16px 24px',
                  cursor: 'pointer',
                  background: selectedChat?.id === u._id ? 'rgba(255,255,255,0.03)' : 'transparent',
                  borderLeft: selectedChat?.id === u._id ? `4px solid ${getRoleColor(u.role)}` : '4px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: getAvatarGradient(u.role, u.email === 'pruthvishetty04@gmail.com'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', border: `1px solid ${getRoleColor(u.role)}33`,
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
                  <div style={{ fontWeight: '600', color: '#E0E8FF', fontSize: '14px' }}>{u.name}</div>
                  <div style={{ fontSize: '10px', color: getRoleColor(u.role), textTransform: 'uppercase' }}>{u.role}</div>
                </div>
                {unreadCounts[u._id] > 0 && (
                  <div style={{
                    background: '#FF5252',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {unreadCounts[u._id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
          {/* Header */}
          <div style={{ 
            padding: '20px 30px', 
            background: 'rgba(10,15,30,0.5)', 
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{ 
              width: '10px', height: '10px', borderRadius: '50%', 
              background: '#00ffaa', boxShadow: '0 0 10px #00ffaa' 
            }} />
            <div>
              <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>{selectedChat?.name || 'Comms Channel'}</div>
              <div style={{ fontSize: '11px', color: selectedChat?.type === 'global' ? '#5A6480' : getRoleColor(selectedChat?.role) }}>
                {selectedChat?.type === 'global' ? 'End-to-End Encrypted Node' : `${(selectedChat?.role || 'OFFICER').toUpperCase()} • Private Channel`}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ 
            flex: 1, 
            padding: '30px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px' 
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '100px', color: '#5A6480', fontSize: '12px' }}>DECRYPTING SECURE FEED...</div>
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
                  <motion.div
                    key={m._id || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '65%'
                    }}
                  >
                    {!isMe && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', marginLeft: '4px' }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: getAvatarGradient(senderRole, m.sender?.email === 'pruthvishetty04@gmail.com'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          overflow: 'hidden',
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          {getAvatarUrl(senderAvatar) ? (
                            <img 
                              src={getAvatarUrl(senderAvatar)} 
                              alt="" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                            />
                          ) : (
                            getAvatarFallback(senderName, m.sender?.email === 'pruthvishetty04@gmail.com')
                          )}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: getRoleColor(senderRole) }}>
                          {senderName}
                        </span>
                      </div>
                    )}
                    <div style={{
                      padding: '12px 18px',
                      borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0',
                      background: isMe ? 'linear-gradient(135deg, #0D47A1, #00B4FF)' : 'rgba(255,255,255,0.05)',
                      border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '14px',
                      boxShadow: isMe ? '0 4px 15px rgba(0,180,255,0.2)' : 'none'
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
                                color: isMe ? '#fff' : '#00ffff',
                                fontSize: '12px',
                                textDecoration: 'underline'
                              }}
                            >
                              📎 {att?.filename || 'Attachment'}
                            </a>
                          ))}
                        </div>
                      )}
                      {formattedTime && (
                        <div style={{ 
                          fontSize: '9px', 
                          color: isMe ? 'rgba(255,255,255,0.5)' : '#5A6480', 
                          textAlign: 'right', 
                          marginTop: '4px' 
                        }}>
                          {formattedTime}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ 
            padding: '24px 30px', 
            background: 'rgba(10,15,30,0.8)', 
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: '15px',
            position: 'relative'
          }}>
            {attachments.length > 0 && (
              <div style={{ position: 'absolute', bottom: '100%', left: '30px', display: 'flex', gap: '10px', padding: '10px', background: 'rgba(10,15,30,0.9)', borderRadius: '8px 8px 0 0', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>
                {attachments.map((file, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#fff' }}>{file.name}</span>
                    <span onClick={() => removeAttachment(i)} style={{ cursor: 'pointer', color: '#FF5252', fontWeight: 'bold' }}>×</span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                type="button"
                onClick={handleAttachClick}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#5A6480', cursor: 'pointer', fontSize: '18px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Add Attachment"
              >
                📎
              </button>
              
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                      position: 'absolute',
                      bottom: '60px',
                      left: '0',
                      background: '#1A233A',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      zIndex: 10,
                      width: '150px'
                    }}
                  >
                    <div onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }} style={{ cursor: 'pointer', padding: '8px 12px', color: '#fff', fontSize: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>📄 Document</div>
                    <div onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }} style={{ cursor: 'pointer', padding: '8px 12px', color: '#fff', fontSize: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>📷 Image / Video</div>
                    <div onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }} style={{ cursor: 'pointer', padding: '8px 12px', color: '#fff', fontSize: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>🎵 Voice Note</div>
                    <div onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }} style={{ cursor: 'pointer', padding: '8px 12px', color: '#fff', fontSize: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>👤 Contact</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
            <input 
              type="text" 
              placeholder={selectedChat?.type === 'global' ? "Broadcast to network..." : `Secure message to ${selectedChat?.name || 'Officer'}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '14px 20px',
                color: '#fff',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button 
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #00B4FF, #00C896)',
                border: 'none',
                borderRadius: '12px',
                padding: '0 24px',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'Orbitron, monospace',
                fontSize: '12px'
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
