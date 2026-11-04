import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useNotificationStore from '../hooks/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={styles.container} ref={containerRef}>
      {/* Bell Icon */}
      <div style={styles.bellWrapper} onClick={() => setIsOpen(!isOpen)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={styles.badge}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </div>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={styles.popover}
          >
            <div style={styles.header}>
              <div style={styles.title}>System Alerts</div>
              <div style={styles.actions}>
                <span style={styles.actionLink} onClick={markAllAsRead}>Mark all read</span>
                <span style={styles.actionLink} onClick={clearNotifications}>Clear</span>
              </div>
            </div>

            <div style={styles.list}>
              {notifications.length === 0 ? (
                <div style={styles.emptyState}>No recent alerts</div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    style={{
                      ...styles.item,
                      background: n.read ? 'transparent' : 'rgba(0, 180, 255, 0.05)'
                    }}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div style={styles.itemHeader}>
                      <span style={{
                        ...styles.typeTag,
                        color: n.type === 'alert' ? '#FF4D4D' : '#00FFD1'
                      }}>
                        {n.type === 'alert' ? 'CRITICAL' : 'UPDATE'}
                      </span>
                      <span style={styles.time}>
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div style={styles.message}>{n.message}</div>
                    {!n.read && <div style={styles.unreadDot} />}
                  </div>
                ))
              )}
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
  },
  bellWrapper: {
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    color: '#8892B0',
    transition: 'all 0.2s',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    '&:hover': {
      color: '#EFEDE8',
      background: 'rgba(255, 255, 255, 0.06)',
    }
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: '#FF4D4D',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #0A0F1E',
  },
  popover: {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '12px',
    width: '320px',
    maxHeight: '400px',
    background: '#111827',
    border: '1px solid rgba(0, 180, 255, 0.15)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  title: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#EFEDE8',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  actionLink: {
    fontSize: '10px',
    color: '#5A6480',
    cursor: 'pointer',
    '&:hover': { color: '#8892B0' }
  },
  list: {
    overflowY: 'auto',
    flex: 1,
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#5A6480',
  },
  item: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.02)',
    }
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  typeTag: {
    fontSize: '9px',
    fontWeight: '800',
    letterSpacing: '0.5px',
  },
  time: {
    fontSize: '10px',
    color: '#5A6480',
  },
  message: {
    fontSize: '12px',
    color: '#D1D5DB',
    lineHeight: '1.4',
  },
  unreadDot: {
    position: 'absolute',
    top: '12px',
    right: '8px',
    width: '6px',
    height: '6px',
    background: '#3DF5C0',
    borderRadius: '50%',
  }
};

export default NotificationCenter;

