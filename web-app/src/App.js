import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useTranslationStore from './hooks/useTranslationStore';
import { applyLanguage } from './services/languageService';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './hooks/useAuthStore';
import useThemeStore from './hooks/useThemeStore';
import { connectSocket, onStatusUpdate, onNewComplaint, onComplaintSubmitted } from './services/socket';
import useNotificationStore from './hooks/useNotificationStore';
import useSettingsStore from './hooks/useSettingsStore';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TrackComplaint from './pages/TrackComplaint';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminML from './pages/AdminML';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminDatabase from './pages/AdminDatabase';
import AdminMap from './pages/AdminMap';
import AdminMails from './pages/AdminMails';
import ScamSearch from './pages/ScamSearch';
import LeakMonitor from './pages/LeakMonitor';
import PublicMap from './pages/PublicMap';
import GlobalChat from './pages/GlobalChat';
import AdminLinkAnalysis from './pages/AdminLinkAnalysis';
import RegisterChoice from './pages/RegisterChoice';
import Settings from './pages/Settings';
import SuspectSearch from './pages/SuspectSearch';
import Feedback from './pages/Feedback';
import FAQ from './pages/FAQ';
import AdminSafety from './pages/AdminSafety';
import Learn from './pages/Learn';
import ForensicScanner from './pages/ForensicScanner';

import OfficerDashboard from './pages/OfficerDashboard';
import ComplaintDetails from './pages/ComplaintDetails';
import CommunityComplaints from './pages/CommunityComplaints';

// Components
import CyberReport from './components/CyberReport';
import ProtectedRoute from './components/ProtectedRoute';
import DeveloperPage from './pages/DeveloperPage';
import CitizenAssistant from './components/CitizenAssistant';

function LanguageSynchronizer() {
  const location = useLocation();
  const { currentLanguage } = useTranslationStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      applyLanguage(currentLanguage);
    }, 60);
    return () => clearTimeout(timer);
  }, [location.pathname, currentLanguage]);

  return null;
}

export default function App() {
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();
  const { initTheme } = useThemeStore();
  const { accentGlow } = useSettingsStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // J.A.R.V.I.S. Global Battery Monitoring Engine
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        let wasCharging = battery.charging;
        let playedLowBattery = false;
        
        battery.addEventListener('chargingchange', () => {
          if (battery.charging && !wasCharging) {
            const audio = new Audio('/voices/battery_charging.m4a');
            audio.volume = 0.8;
            audio.play().catch(e => console.log('Battery audio blocked:', e));
          }
          wasCharging = battery.charging;
          if (battery.charging) playedLowBattery = false; // Reset low battery warning
        });

        battery.addEventListener('levelchange', () => {
          if (battery.level <= 0.20 && !battery.charging && !playedLowBattery) {
            playedLowBattery = true;
            const audio = new Audio('/voices/battery_low.m4a');
            audio.volume = 0.8;
            audio.play().catch(e => console.log('Battery audio blocked:', e));
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      const socket = connectSocket(user.id, user.role === 'admin' || user.role === 'officer');

      // Global Listeners
      const handleStatusUpdate = (data) => {
        addNotification({
          type: 'update',
          message: `Complaint #${data.complaintId} status updated to: ${data.status.toUpperCase()}`
        });
      };

      const handleNewComplaint = (data) => {
        addNotification({
          type: 'alert',
          message: `NEW INCIDENT: ${data.category.toUpperCase()} - ${data.title}`
        });
      };

      const handleSubmission = (data) => {
        addNotification({
          type: 'update',
          message: `Your complaint #${data.complaintId} has been successfully submitted.`
        });
      };

      onStatusUpdate(handleStatusUpdate);
      onNewComplaint(handleNewComplaint);
      onComplaintSubmitted(handleSubmission);

      return () => {
        // Cleanup would ideally use 'off' methods but connectSocket manages a singleton
      };
    }
  }, [user, addNotification]);

  return (
    <div className={accentGlow ? 'atmospheric-glow' : ''}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LanguageSynchronizer />
        {/* ── Global Styles ── */}
        <style>
          {`
            body { 
              margin: 0; 
              font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              -webkit-font-smoothing: antialiased;
              transition: background-color 0.3s ease;
            }
            #root {
              min-height: 100vh;
              min-height: 100dvh;
            }
            .atmospheric-glow {
              position: relative;
            }
            .atmospheric-glow::before {
              content: '';
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              display: none;
              pointer-events: none;
              z-index: 9999;
              mix-blend-mode: screen;
            }
            
            [data-theme='light'] body {
               color: #111;
            }
            [data-theme='dark'] body,
            [data-theme='system'] body {
               color: #ffffff;
            }
            
            /* Custom scrollbar for the dark theme */
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(128, 128, 128, 0.3);
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(128, 128, 128, 0.5);
            }
          `}
        </style>

      {/* ── Notifications ── */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#FFFFFF',
            border: '1px solid #333333',
            borderRadius: '4px',
            fontSize: '14px'
          },
        }}
      />

      {/* ── Routing Logic ── */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-choice" element={<RegisterChoice />} />
        <Route path="/register" element={<Register />} />

        {/* Protected or Specific Feature Routes */}
        <Route path="/submit" element={<ProtectedRoute><CyberReport /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/officer" element={<ProtectedRoute requiredRole="officer"><OfficerDashboard /></ProtectedRoute>} />
        <Route path="/complaint/:complaintId" element={<ProtectedRoute><ComplaintDetails /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityComplaints /></ProtectedRoute>} />
        <Route path="/track/:complaintId?" element={<TrackComplaint />} />
        <Route path="/scam-search" element={<ScamSearch />} />
        <Route path="/leak-monitor" element={<LeakMonitor />} />
        <Route path="/threat-map" element={<PublicMap />} />
        <Route path="/chat" element={<ProtectedRoute><GlobalChat /></ProtectedRoute>} />
        
        {/* Admin Specific Routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute requiredRole="admin"><AdminComplaints /></ProtectedRoute>} />
        <Route path="/admin/ml" element={<ProtectedRoute requiredRole="admin"><AdminML /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/info" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/database" element={<ProtectedRoute requiredRole="admin"><AdminDatabase /></ProtectedRoute>} />
        <Route path="/admin/link-analysis" element={<ProtectedRoute requiredRole="admin"><AdminLinkAnalysis /></ProtectedRoute>} />
        <Route path="/admin/map" element={<ProtectedRoute requiredRole="admin"><AdminMap /></ProtectedRoute>} />
        <Route path="/admin/mails" element={<ProtectedRoute requiredRole="admin"><AdminMails /></ProtectedRoute>} />
        <Route path="/admin/safety" element={<ProtectedRoute requiredRole="officer"><AdminSafety /></ProtectedRoute>} />
        
        {/* Developer Override Route */}
        <Route path="/developer" element={<ProtectedRoute><DeveloperPage /></ProtectedRoute>} />
        
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
        <Route path="/forensic-scanner" element={<ProtectedRoute><ForensicScanner /></ProtectedRoute>} />
        <Route path="/suspect-search" element={<ProtectedRoute><SuspectSearch /></ProtectedRoute>} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/faq" element={<FAQ />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <CitizenAssistant />
    </BrowserRouter>
    </div>
  );
}