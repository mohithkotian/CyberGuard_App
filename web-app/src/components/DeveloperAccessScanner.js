import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../hooks/useAuthStore';
import * as faceapi from '@vladmandic/face-api';
import { authAPI } from '../services/api';

const FaceIdIcon = ({ status }) => {
  return (
    <div style={{ width: 80, height: 80, position: 'relative', marginBottom: 30 }}>
      <motion.svg width="80" height="80" viewBox="0 0 80 80" 
        animate={{ 
          scale: status === 'scanning' ? [1, 1.05, 1] : 1,
          opacity: status === 'scanning' ? [0.8, 1, 0.8] : 1
        }}
        transition={{ repeat: status === 'scanning' ? Infinity : 0, duration: 1.5 }}
      >
        <rect x="4" y="4" width="72" height="72" rx="20" fill="none" stroke={status === 'success' ? '#3DF5C0' : status === 'failed' ? '#D96464' : '#2C2B28'} strokeWidth="2" />
        
        <AnimatePresence mode="wait">
          {(status === 'scanning' || status === 'idle') && (
            <motion.g 
              key="face"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              stroke="#EFEDE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
            >
              {/* Eyes */}
              <path d="M 28 32 L 28 34" />
              <path d="M 52 32 L 52 34" />
              {/* Nose */}
              <path d="M 40 38 L 40 46 L 36 46" />
              {/* Smile */}
              <path d="M 30 54 C 36 58 44 58 50 54" />
            </motion.g>
          )}

          {status === 'success' && (
            <motion.g 
              key="check"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              stroke="#3DF5C0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"
            >
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4 }}
                d="M 22 40 L 36 54 L 58 26" 
              />
            </motion.g>
          )}

          {status === 'failed' && (
            <motion.g 
              key="cross"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              stroke="#FF5252" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"
            >
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
                d="M 24 24 L 56 56 M 56 24 L 24 56" 
              />
            </motion.g>
          )}
        </AnimatePresence>
      </motion.svg>
    </div>
  );
};

export default function DeveloperAccessScanner({ onClose, onVerified }) {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('Initializing Vision Models...');
  const [progress, setProgress] = useState(0);
  const [faceIdStatus, setFaceIdStatus] = useState('idle');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const loadModelsAndStartCamera = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        
        setModelsLoaded(true);
        setStatus('Ready for Biometric Scan.');
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Automate scan after video buffers
          setTimeout(() => executeScan(), 1500);
        }
      } catch (err) {
        setStatus('Camera access denied or models failed to load.');
        setFaceIdStatus('failed');
      }
    };

    loadModelsAndStartCamera();

    return () => {
      closeCamera();
      clearInterval(intervalRef.current);
    };
  }, []);

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const executeScan = async () => {
    if (!videoRef.current) return;
    
    setFaceIdStatus('scanning');
    setStatus('Scanning Facial Features...');
    setProgress(0);
    
    // Simulate progress bar while doing real AI processing
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += 5;
      if (currentProgress <= 80) setProgress(currentProgress);
    }, 50);

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      clearInterval(intervalRef.current);
      setProgress(100);

      if (!detection) {
        setFaceIdStatus('failed');
        setStatus('No owner face detected');
        setTimeout(handleAbort, 2000);
        return;
      }

      setStatus('Verifying 128-D Biometric Hash...');
      const descriptorArray = Array.from(detection.descriptor);
      
      const res = await authAPI.verifyFace(descriptorArray);
      
      if (res.data.status === 'success') {
        setFaceIdStatus('success');
        setStatus('Access Granted. Welcome Developer.');
        
        const startupAudio = new Audio('/voices/face_id_success.mp3');
        startupAudio.volume = 0.8;
        startupAudio.play().catch(e => console.log('Audio blocked:', e));
        
        setTimeout(() => {
          closeCamera();
          onVerified();
        }, 1500);
      }
    } catch (err) {
      clearInterval(intervalRef.current);
      setProgress(100);
      setFaceIdStatus('failed');
      setStatus('Rejected: Biometric Mismatch');
      setTimeout(handleAbort, 2000);
    }
  };

  const handleAbort = () => {
    closeCamera();
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(3, 10, 15, 0.95)', zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'none',
        userSelect: 'none'
      }}
    >
      <div style={{
        position: 'absolute', top: 40, right: 40, color: '#FF5252', cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', fontWeight: 'bold', letterSpacing: '2px',
        padding: '10px 20px', border: '1px solid rgba(255,82,82,0.4)', borderRadius: '8px',
        background: 'rgba(255,82,82,0.1)',
      }} onClick={handleAbort}>
        ABORT
      </div>

      <FaceIdIcon status={faceIdStatus} />

      <div style={{ position: 'relative', width: 300, height: 300, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${faceIdStatus === 'success' ? '#3DF5C0' : faceIdStatus === 'failed' ? '#D96464' : '#2C2B28'}`, boxShadow: 'none' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', filter: faceIdStatus === 'failed' ? 'grayscale(1) sepia(1) hue-rotate(-50deg) saturate(3)' : 'contrast(1.1) brightness(1.1)' }} 
        />
        
        {faceIdStatus === 'scanning' && (
          <motion.div 
            initial={{ y: 0 }} animate={{ y: [0, 280, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '8px', 
              background: '#3DF5C0',
              boxShadow: 'none',
              opacity: 0.9
            }}
          />
        )}
      </div>
      
      <div style={{ marginTop: 40, width: 350 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ 
            color: faceIdStatus === 'success' ? '#3DF5C0' : faceIdStatus === 'failed' ? '#D96464' : '#8E8B85', 
            fontFamily: 'Inter, sans-serif', fontSize: '16px', letterSpacing: '1px',
            transition: 'color 0.3s', fontWeight: 'bold'
          }}>
            {status}
          </span>
          <span style={{ 
            color: faceIdStatus === 'success' ? '#3DF5C0' : faceIdStatus === 'failed' ? '#FF5252' : '#EFEDE8', 
            fontFamily: 'Inter, sans-serif', fontSize: '14px',
            transition: 'color 0.3s'
          }}>
            {progress}%
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#1C1C1A', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progress}%`, height: '100%', 
            background: faceIdStatus === 'success' ? '#3DF5C0' : faceIdStatus === 'failed' ? '#FF5252' : '#EFEDE8', 
            boxShadow: 'none', 
            transition: 'background-color 0.3s' 
          }} />
        </div>
      </div>      <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', opacity: 0.6 }}>
        <div style={{ color: faceIdStatus === 'success' ? '#3DF5C0' : faceIdStatus === 'failed' ? '#FF5252' : '#EFEDE8', fontSize: '12px', fontFamily: 'monospace', transition: 'color 0.3s' }}>
          <div>[SYS] BIOMETRIC HASH: {faceIdStatus === 'success' ? 'VERIFIED' : 'AWAITING'}</div>
          <div>[SYS] NEURAL NET: {faceIdStatus === 'failed' ? 'HALTED' : 'ACTIVE'}</div>
          <div>[SYS] CLEARANCE: LEVEL 9</div>
        </div>
        <div style={{ color: faceIdStatus === 'success' ? '#3DF5C0' : faceIdStatus === 'failed' ? '#FF5252' : '#EFEDE8', fontSize: '12px', fontFamily: 'monospace', transition: 'color 0.3s' }}>
          <div>[NET] SECURE TUNNEL ESTABLISHED</div>
          <div>[NET] ENCRYPTION: AES-256-GCM</div>
          <div>[NET] HANDSHAKE: {faceIdStatus === 'failed' ? 'FAILED' : faceIdStatus === 'success' ? 'SUCCESS' : 'PENDING'}</div>
        </div>
      </div>
    </motion.div>
  );
}

