import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import UiIcon from '../components/UiIcon';
import useAuthStore from '../hooks/useAuthStore';
import useTranslationStore from '../hooks/useTranslationStore';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

// Interactive 1-Minute Visual Scenario Modules
const SCENARIOS = [
  {
    id: 'phishing_bank',
    title: 'Spot the Fake Bank Website',
    category: 'PHISHING & PUNYCODE',
    timeEstimate: '1 min',
    points: 100,
    icon: '⌕',
    difficulty: 'EASY',
    description: 'A customer received an urgent SMS claiming their net banking is locked. Inspect the browser mockup below and identify the critical security red flag.',
    mockupType: 'browser',
    url: 'https://sbi-secure-kyc-verify.xyz/retail/login.php',
    browserContent: {
      bankName: 'STATE TRUST BANK',
      lockStatus: 'insecure',
      headline: 'URGENT: Your NetBanking will be suspended in 04:59 minutes!',
      body: 'Due to new RBI guidelines, verify your 16-digit ATM Card Number, Expiry Date, ATM PIN, and NetBanking password immediately to prevent permanent account freezing.',
      actionButton: 'VERIFY & SUBMIT ATM PIN'
    },
    question: 'Which of the following proves this is a malicious phishing website?',
    options: [
      { id: 'a', text: 'The URL domain is "sbi-secure-kyc-verify.xyz" instead of the official bank domain (e.g., .sbi or official .com), and banks never ask for ATM PIN online.', isCorrect: true },
      { id: 'b', text: 'The page has a blue header banner matching the bank colors.', isCorrect: false },
      { id: 'c', text: 'The verification countdown timer is only 5 minutes long.', isCorrect: false },
      { id: 'd', text: 'The website uses English language text.', isCorrect: false }
    ],
    explanation: 'Legitimate banks NEVER use random TLDs (.xyz, .top, .club) and NEVER ask for your ATM PIN or CVV on a login page. High-urgency countdown timers are designed to panic victims into bypassing rational thought.'
  },
  {
    id: 'sms_electricity',
    title: 'SMS & UPI Electricity Bill Trap',
    category: 'SMISHING & UPI FRAUD',
    timeEstimate: '1 min',
    points: 100,
    icon: '⌕',
    difficulty: 'MEDIUM',
    description: 'You receive an urgent SMS at 8:15 PM regarding electricity disconnection. Analyze the message and choose the safe protocol.',
    mockupType: 'phone',
    phoneMessage: {
      sender: 'VK-PWRDIS',
      timestamp: 'Today, 8:15 PM',
      text: 'Dear Consumer, your electricity power will be DISCONNECTED tonight at 9:30 PM from the power office because your previous month bill was not updated. Please immediately contact our power officer at 98765-43210 or install Bijli_Pay_Update.apk to update bill.'
    },
    question: 'What is the most secure and correct action to take?',
    options: [
      { id: 'a', text: 'Call 98765-43210 immediately and share any screen-sharing code requested.', isCorrect: false },
      { id: 'b', text: 'Download and install the "Bijli_Pay_Update.apk" file onto your smartphone.', isCorrect: false },
      { id: 'c', text: 'Do NOT call the number or install the APK. Verify your bill status directly via the official State Electricity Board website/app or customer care.', isCorrect: true },
      { id: 'd', text: 'Forward the message to all WhatsApp family groups.', isCorrect: false }
    ],
    explanation: 'Scammers send mass fake electricity disconnect SMS with personal mobile numbers and malicious Android .APK files that install remote Trojans (stealing OTPs and banking credentials). Official electricity boards never use personal numbers or send APK links.'
  },
  {
    id: 'ransomware_email',
    title: 'Weaponized Email Attachment Defense',
    category: 'MALWARE & RANSOMWARE',
    timeEstimate: '1 min',
    points: 100,
    icon: '!',
    difficulty: 'MEDIUM',
    description: 'Your inbox received an unexpected email with a high-priority financial attachment. Examine the email headers and attachment filename.',
    mockupType: 'email',
    emailData: {
      from: 'accounts@company-payr0ll-dept.com',
      subject: 'URGENT: Overdue Invoice Remittance & Penalty Notice #9921',
      attachment: 'Outstanding_Invoice_Payment.pdf.exe',
      attachmentSize: '4.8 MB'
    },
    question: 'Why is this attachment extremely dangerous?',
    options: [
      { id: 'a', text: 'It has a hidden double extension (.pdf.exe) which is an executable program/malware pretending to be a PDF document.', isCorrect: true },
      { id: 'b', text: 'The attachment size is slightly larger than 4 MB.', isCorrect: false },
      { id: 'c', text: 'The word "Overdue" is written in the subject line.', isCorrect: false },
      { id: 'd', text: 'The email was received during working hours.', isCorrect: false }
    ],
    explanation: 'Attackers disguise executable Trojans, keyloggers, and ransomware using double extensions like .pdf.exe or .docx.exe to trick users into running malicious code on their computer.'
  },
  {
    id: 'telegram_task_scam',
    title: 'Part-Time "Like & Earn" Ponzi Scheme',
    category: 'INVESTMENT & TASK FRAUD',
    timeEstimate: '1 min',
    points: 100,
    icon: '▣',
    difficulty: 'EASY',
    description: 'A stranger contacts you on WhatsApp offering ₹3,000/day for liking YouTube videos and following Instagram influencers.',
    mockupType: 'chat',
    chatData: [
      { sender: 'Scammer (VIP HR)', text: 'Hello! I am HR from Global Media. Work 15 mins daily and earn ₹3,500. Just like 3 YouTube videos and send screenshots.' },
      { sender: 'Citizen', text: 'I liked the videos and sent screenshots.' },
      { sender: 'Scammer (VIP HR)', text: 'Great! You earned ₹150 trial bonus. To unlock daily ₹5,000 VIP tasks, deposit ₹2,000 into our cryptocurrency/merchant wallet now!' }
    ],
    question: 'What type of scam is being executed here?',
    options: [
      { id: 'a', text: 'A legitimate high-paying social media marketing job.', isCorrect: false },
      { id: 'b', text: 'A classic "Prepaid Task Scam" where small initial rewards are used as bait before demanding large non-refundable deposits.', isCorrect: true },
      { id: 'c', text: 'An official YouTube affiliate partnership program.', isCorrect: false },
      { id: 'd', text: 'A standard government-sponsored employment initiative.', isCorrect: false }
    ],
    explanation: 'Prepaid Task Fraud is one of India\'s fastest-growing cybercrimes. Victims are lured with ₹150-₹500 initial payouts, added to fake Telegram groups with paid actors, and then defrauded of lakhs through "recharge/investment tasks".'
  },
  {
    id: 'public_wifi_mitm',
    title: 'Rogue Public Wi-Fi & Evil Twin Attacks',
    category: 'NETWORK DEFENSE',
    timeEstimate: '1 min',
    points: 100,
    icon: '⌁',
    difficulty: 'HARD',
    description: 'While waiting at a busy airport terminal, your laptop detects two open Wi-Fi networks. Analyze the safest way to connect.',
    mockupType: 'wifi',
    wifiList: [
      { name: 'Airport_Official_Free_WiFi (Captive Portal with SMS OTP)', secure: true },
      { name: 'FREE_FAST_AIRPORT_WIFI_NO_PASSWORD', secure: false }
    ],
    question: 'How should you protect your sensitive banking and work credentials on public networks?',
    options: [
      { id: 'a', text: 'Connect to the unencrypted open network and immediately log into your bank accounts without HTTPS.', isCorrect: false },
      { id: 'b', text: 'Use cellular mobile hotspot or activate an encrypted Virtual Private Network (VPN) and ensure HTTPS encryption is active before accessing sensitive accounts.', isCorrect: true },
      { id: 'c', text: 'Turn off your laptop firewall to make the internet faster.', isCorrect: false },
      { id: 'd', text: 'Share your device files with all nearby network discoverable devices.', isCorrect: false }
    ],
    explanation: 'Cybercriminals deploy "Evil Twin" Wi-Fi hotspots in cafes and airports to execute Man-In-The-Middle (MITM) attacks and capture unencrypted packets. Always utilize mobile data or a secure VPN on public networks.'
  }
];

export default function Learn() {
  const { user } = useAuthStore();
  const { t } = useTranslationStore();

  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [xp, setXp] = useState(150);
  const [completedScenarios, setCompletedScenarios] = useState(new Set());
  const [showCertModal, setShowCertModal] = useState(false);
  const [certId, setCertId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  useEffect(() => {
    // Generate deterministic certificate ID based on user
    const userName = user?.name || 'Citizen';
    const userId = user?._id || user?.id || 'guest';
    // Create a simple hash from the user info for a stable cert ID
    let hash = 0;
    const seed = userName + userId;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const suffix = Math.abs(hash).toString(36).toUpperCase().slice(0, 6).padEnd(6, 'X');
    setCertId(`CG-DEF-${new Date().getFullYear()}-${suffix}`);
  }, [user]);

  // Download certificate as high-quality PNG image
  const handleDownloadCertificate = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        backgroundColor: '#030B14',
        scale: 2,
        useCORS: true,
        logging: false,
        width: certRef.current.scrollWidth,
        height: certRef.current.scrollHeight,
        windowWidth: certRef.current.scrollWidth,
        windowHeight: certRef.current.scrollHeight
      });
      const link = document.createElement('a');
      const userName = (user?.name || 'CyberDefender').replace(/\s+/g, '_');
      link.download = `CyberGuard_Certificate_${userName}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed. Please try screenshot instead.');
    } finally {
      setDownloading(false);
    }
  };

  // Share badge via Web Share API or clipboard fallback
  const handleShareBadge = async () => {
    const shareUrl = window.location.origin + '/learn?cert=' + certId;
    const shareText = `I just earned my Official Cyber Defender Certificate from CyberGuard! Verified ID: ${certId}. Take the challenge yourself!`;
    
    if (navigator.share) {
      try {
        // If certificate is rendered, try to share as image
        if (certRef.current) {
          try {
            const canvas = await html2canvas(certRef.current, {
              backgroundColor: '#030B14',
              scale: 1.5,
              useCORS: true,
              logging: false
            });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'CyberGuard_Certificate.png', { type: 'image/png' });
            await navigator.share({
              title: 'CyberGuard Cyber Defender Certificate',
              text: shareText,
              url: shareUrl,
              files: [file]
            });
            toast.success('Certificate shared!');
            return;
          } catch (imgErr) {
            // Fall through to text-only share
          }
        }
        await navigator.share({
          title: 'CyberGuard Cyber Defender Certificate',
          text: shareText,
          url: shareUrl
        });
        toast.success('Certificate shared!');
      } catch (shareErr) {
        if (shareErr.name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard?.writeText(shareText + ' ' + shareUrl);
          toast.success('Certificate link copied to clipboard!');
        }
      }
    } else {
      // No Web Share API - copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        toast.success('Certificate link & message copied to clipboard!');
      } catch {
        toast.error('Could not copy. Please share the URL manually.');
      }
    }
  };

  const currentScenario = SCENARIOS[activeScenarioIndex];
  const isAllCompleted = completedScenarios.size === SCENARIOS.length;

  const handleSelectOption = (optId) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) {
      toast.error('Please select an option before submitting');
      return;
    }

    const isCorrect = currentScenario.options.find(o => o.id === selectedOption)?.isCorrect;
    setIsAnswerSubmitted(true);

    setUserAnswers(prev => ({
      ...prev,
      [currentScenario.id]: { selected: selectedOption, isCorrect }
    }));

    if (isCorrect) {
      toast.success(t('LEARN.CORRECT', 'Correct Identification! Threat Neutralized. +100 XP'));
      setXp(prev => prev + currentScenario.points);
    } else {
      toast.error(t('LEARN.INCORRECT', 'Warning! Vulnerability Detected. Review the explanation.'));
      setXp(prev => prev + 25); // Participation XP
    }

    setCompletedScenarios(prev => new Set([...prev, currentScenario.id]));
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    if (activeScenarioIndex < SCENARIOS.length - 1) {
      setActiveScenarioIndex(prev => prev + 1);
    }
  };

  const handleSelectScenarioDirect = (idx) => {
    setActiveScenarioIndex(idx);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
  };

  const getRank = () => {
    if (xp >= 550) return { title: 'Master Cyber Defender', badge: '◆', color: '#00FFD1' };
    if (xp >= 350) return { title: 'Sentinel Cyber Guard', badge: '◈', color: '#EFEDE8' };
    if (xp >= 200) return { title: 'Cyber Intelligence Scout', badge: '»', color: '#FFD600' };
    return { title: 'Cadet Cyber Defender', badge: '◈', color: '#8892B0' };
  };

  const rank = getRank();

  return (
    <div className="page-shell" style={{
      minHeight: '100dvh',
      background: '#070707',
      color: '#f2f0ea',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: "'IBM Plex Sans', sans-serif"
    }}>
      <Navbar />

      <main className="report-layout" style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '44px 24px 100px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Strip */}
        <aside className="report-aside" style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div className="aside-copy">
            <p className="eyebrow" style={{ color: '#8e8b84', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 10px' }}>
              GAMIFIED CYBER AWARENESS
            </p>
            <h1 style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 'clamp(2.2rem, 3vw, 2.75rem)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#f2f0ea',
              margin: '0 0 10px'
            }}>
              Interactive Defense Arena
            </h1>
            <p style={{ color: '#8e8b84', margin: 0, fontSize: '14px', maxWidth: 640 }}>
              {t('LEARN.SUBTITLE', 'Master modern cyber defense in 1-minute interactive scenario quizzes and claim your official Cyber Defender Certificate.')}
            </p>
          </div>

          {/* Gamification Stats Pill (matches Home / Report status pill) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#0d0d0d',
            border: '1px solid #30302d',
            borderRadius: '8px',
            padding: '12px 24px',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#8e8b84', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, marginBottom: 2 }}>
                RANK
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em' }}>
                {rank.title}
              </div>
            </div>

            <div style={{ width: 1, height: 26, background: '#262522' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#8e8b84', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, marginBottom: 2 }}>
                TOTAL XP
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                {xp}
              </div>
            </div>

            <div style={{ width: 1, height: 26, background: '#262522' }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#8e8b84', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, marginBottom: 2 }}>
                COMPLETED
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f2f0ea', fontFamily: "'IBM Plex Mono', monospace" }}>
                {completedScenarios.size}/{SCENARIOS.length}
              </div>
            </div>
          </div>
        </aside>

        {/* Level Track / Scenario Selector Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SCENARIOS.length}, 1fr)`,
          gap: 12,
          marginBottom: 32,
          overflowX: 'auto',
          paddingBottom: 4
        }}>
          {SCENARIOS.map((sc, idx) => {
            const isDone = completedScenarios.has(sc.id);
            const isActive = idx === activeScenarioIndex;
            return (
              <motion.div
                key={sc.id}
                onClick={() => handleSelectScenarioDirect(idx)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  background: isActive ? '#141414' : '#0d0d0d',
                  border: isActive
                    ? '1px solid #f2f0ea'
                    : isDone
                      ? '1px solid #3DF5C0'
                      : '1px solid #30302d',
                  transition: 'all 0.16s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '999px',
                  background: isDone ? '#3DF5C0' : isActive ? '#f2f0ea' : '#1a1a1a',
                  color: isDone || isActive ? '#070707' : '#8e8b84',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'IBM Plex Sans', sans-serif"
                }}>
                  {isDone ? 'OK' : idx + 1}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '10px',
                    color: isDone ? '#3DF5C0' : isActive ? '#f2f0ea' : '#8e8b84',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                    fontFamily: "'IBM Plex Sans', sans-serif"
                  }}>
                    {sc.category}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    color: isActive ? '#f2f0ea' : '#d8d5ce'
                  }}>
                    {sc.title}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Interactive Scenario Card */}
        <div className="report-form" style={{
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Header Intro Bar */}
          <div className="form-intro" style={{
            padding: '28px 36px',
            borderBottom: '1px solid #292927',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <p className="step-label" style={{
                margin: '0 0 6px',
                color: '#8e8b84',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}>
                SCENARIO {activeScenarioIndex + 1} OF {SCENARIOS.length}
              </p>
              <h2 style={{
                margin: 0,
                fontSize: '1.6rem',
                fontWeight: 700,
                fontFamily: "'IBM Plex Sans', sans-serif",
                color: '#f2f0ea',
                letterSpacing: '0.02em'
              }}>
                {currentScenario.title}
              </h2>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#141414',
              border: '1px solid #30302d',
              color: '#EFEDE8',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              <span>+{currentScenario.points} XP</span>
              <span style={{ color: '#8e8b84' }}>·</span>
              <span style={{ color: '#d8d5ce' }}>{currentScenario.difficulty}</span>
            </div>
          </div>

          {/* Card Body: 2 Columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
            gap: 32,
            padding: '36px',
            alignItems: 'start'
          }}>
            {/* Left Column: Visual Mockup Sandbox */}
            <div style={{
              background: '#141414',
              border: '1px solid #30302d',
              borderRadius: '20px',
              overflow: 'hidden'
            }}>
              {/* Mockup Header Toolbar */}
              <div style={{
                padding: '12px 18px',
                background: '#0d0d0d',
                borderBottom: '1px solid #292927',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d96464' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d8a43a' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DF5C0' }} />
                </div>
                <div style={{
                  flex: 1,
                  background: '#141414',
                  borderRadius: '8px',
                  padding: '5px 14px',
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: '#d96464',
                  border: '1px solid #3b3b38',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <span style={{ fontWeight: 700 }}>! INSECURE:</span> {currentScenario.url || 'sms://vk-pwrdis/thread'}
                </div>
              </div>

              {/* Mockup Content Body */}
              <div style={{ padding: 24, minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {currentScenario.mockupType === 'browser' && (
                  <div style={{
                    background: '#1a1a1a',
                    color: '#f2f0ea',
                    borderRadius: '14px',
                    padding: 24,
                    border: '1px solid #3b3b38'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #292927', paddingBottom: 12, marginBottom: 16 }}>
                      <div style={{ fontWeight: 800, color: '#f2f0ea', fontSize: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {currentScenario.browserContent.bankName}
                      </div>
                      <div style={{ fontSize: 10, background: 'rgba(217, 100, 100, 0.15)', color: '#d96464', padding: '4px 8px', borderRadius: 4, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        ! VERIFY SESSION
                      </div>
                    </div>
                    <div style={{ background: '#141414', border: '1px solid #d8a43a', borderRadius: '8px', padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#d8a43a', marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {currentScenario.browserContent.headline}
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: '#a6a39b', margin: '0 0 20px 0' }}>
                      {currentScenario.browserContent.body}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      <input type="text" placeholder="Enter 16-Digit ATM Card Number" disabled style={{ padding: 10, borderRadius: 8, border: '1px solid #30302d', background: '#0d0d0d', color: '#8e8b84', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input type="text" placeholder="MM/YY" disabled style={{ padding: 10, borderRadius: 8, border: '1px solid #30302d', background: '#0d0d0d', color: '#8e8b84', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <input type="password" placeholder="ATM 4-Digit PIN" disabled style={{ padding: 10, borderRadius: 8, border: '1px solid #30302d', background: '#0d0d0d', color: '#8e8b84', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }} />
                      </div>
                    </div>
                    <button style={{ width: '100%', padding: '12px', background: '#d96464', color: '#070707', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", cursor: 'not-allowed' }}>
                      {currentScenario.browserContent.actionButton}
                    </button>
                  </div>
                )}

                {currentScenario.mockupType === 'phone' && (
                  <div style={{
                    maxWidth: 340,
                    margin: '0 auto',
                    background: '#0d0d0d',
                    borderRadius: '24px',
                    padding: '20px 16px',
                    border: '1px solid #3b3b38',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#8e8b84', marginBottom: 14, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {currentScenario.phoneMessage.sender} • {currentScenario.phoneMessage.timestamp}
                    </div>
                    <div style={{
                      background: '#141414',
                      borderRadius: '16px',
                      padding: 16,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: '#f2f0ea',
                      border: '1px solid #30302d'
                    }}>
                      {currentScenario.phoneMessage.text}
                    </div>
                    <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#d96464', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      ! Sender unverified. Contains executable payload link.
                    </div>
                  </div>
                )}

                {currentScenario.mockupType === 'email' && (
                  <div style={{
                    background: '#0d0d0d',
                    borderRadius: '14px',
                    padding: 20,
                    border: '1px solid #30302d'
                  }}>
                    <div style={{ fontSize: 12, color: '#8e8b84', marginBottom: 6 }}>
                      <strong style={{ color: '#d8d5ce' }}>From:</strong> {currentScenario.emailData.from}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f2f0ea', marginBottom: 16 }}>
                      <strong style={{ color: '#8e8b84' }}>Subject:</strong> {currentScenario.emailData.subject}
                    </div>
                    <div style={{
                      background: '#141414',
                      border: '1px solid #d96464',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>FILE</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#d96464', fontFamily: "'IBM Plex Mono', monospace" }}>
                            {currentScenario.emailData.attachment}
                          </div>
                          <div style={{ fontSize: 11, color: '#8e8b84' }}>{currentScenario.emailData.attachmentSize} • Executable Application</div>
                        </div>
                      </div>
                      <div style={{ background: '#d96464', color: '#070707', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: '8px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        BLOCKED
                      </div>
                    </div>
                  </div>
                )}

                {currentScenario.mockupType === 'chat' && (
                  <div style={{
                    background: '#0d0d0d',
                    borderRadius: '16px',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    border: '1px solid #30302d'
                  }}>
                    {currentScenario.chatData.map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          alignSelf: msg.sender.includes('Citizen') ? 'flex-end' : 'flex-start',
                          background: msg.sender.includes('Citizen') ? '#141414' : '#1c1b18',
                          color: '#f2f0ea',
                          borderRadius: '14px',
                          padding: '10px 14px',
                          maxWidth: '85%',
                          fontSize: 12,
                          lineHeight: 1.4,
                          border: '1px solid #30302d'
                        }}
                      >
                        <div style={{ fontSize: 9, color: '#8e8b84', marginBottom: 2, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>{msg.sender}</div>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                )}

                {currentScenario.mockupType === 'wifi' && (
                  <div style={{
                    background: '#0d0d0d',
                    borderRadius: '14px',
                    padding: 20,
                    border: '1px solid #30302d',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8b84', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      DETECTED WIRELESS INTERFACES
                    </div>
                    {currentScenario.wifiList?.map((w, idx) => (
                      <div key={idx} style={{
                        padding: '12px 14px',
                        background: '#141414',
                        border: w.secure ? '1px solid #30302d' : '1px solid #d96464',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12
                      }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: w.secure ? '#f2f0ea' : '#d96464' }}>{w.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: w.secure ? '#3DF5C0' : '#d96464', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          {w.secure ? 'PROTECTED' : 'UNENCRYPTED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quiz Questions & Answers */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}>
              <div>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8e8b84',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  margin: '0 0 10px'
                }}>
                  CRITICAL INSPECTION QUERY
                </p>

                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0 0 20px 0',
                  lineHeight: 1.35,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  color: '#f2f0ea'
                }}>
                  {currentScenario.question}
                </h3>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {currentScenario.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    let optStyle = {
                      padding: '14px 16px',
                      borderRadius: '12px',
                      fontSize: 13,
                      lineHeight: 1.4,
                      cursor: isAnswerSubmitted ? 'default' : 'pointer',
                      background: '#141414',
                      border: '1px solid #30302d',
                      color: '#d8d5ce',
                      transition: 'all 0.16s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12
                    };

                    if (isSelected && !isAnswerSubmitted) {
                      optStyle.background = '#1a1917';
                      optStyle.border = '1px solid #f2f0ea';
                      optStyle.color = '#f2f0ea';
                    }

                    if (isAnswerSubmitted) {
                      if (opt.isCorrect) {
                        optStyle.background = 'rgba(0, 245, 160, 0.08)';
                        optStyle.border = '1px solid #3DF5C0';
                        optStyle.color = '#3DF5C0';
                      } else if (isSelected && !opt.isCorrect) {
                        optStyle.background = 'rgba(217, 100, 100, 0.08)';
                        optStyle.border = '1px solid #d96464';
                        optStyle.color = '#d96464';
                      }
                    }

                    return (
                      <motion.div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        whileHover={!isAnswerSubmitted ? { x: 2 } : {}}
                        whileTap={!isAnswerSubmitted ? { scale: 0.99 } : {}}
                        style={optStyle}
                      >
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #f2f0ea' : '1px solid #3b3b38',
                          background: isSelected ? '#f2f0ea' : '#0d0d0d',
                          color: isSelected ? '#070707' : '#8e8b84',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          flexShrink: 0
                        }}>
                          {opt.id.toUpperCase()}
                        </div>
                        <div>{opt.text}</div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Forensic Explanation Panel */}
                {isAnswerSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: '#141414',
                      border: '1px solid #3b3b38',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: '#d8d5ce',
                      marginBottom: 20
                    }}
                  >
                    <strong style={{ color: '#EFEDE8', display: 'block', marginBottom: 4, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px' }}>
                      FORENSIC SECURITY INSIGHT:
                    </strong>
                    {currentScenario.explanation}
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #292927' }}>
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '8px',
                      background: '#f2f0ea',
                      color: '#070707',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 14,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      letterSpacing: '0.06em',
                      cursor: 'pointer'
                    }}
                  >
                    {t('LEARN.START_CHALLENGE', 'LOCK IN ANSWER & ANALYZE')}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    {activeScenarioIndex < SCENARIOS.length - 1 ? (
                      <button
                        onClick={handleNext}
                        style={{
                          flex: 1,
                          padding: '14px',
                          borderRadius: '8px',
                          background: '#f2f0ea',
                          color: '#070707',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 14,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          letterSpacing: '0.06em',
                          cursor: 'pointer'
                        }}
                      >
                        {t('LEARN.NEXT_QUESTION', 'NEXT SCENARIO')} →
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCertModal(true)}
                        style={{
                          flex: 1,
                          padding: '14px',
                          borderRadius: '8px',
                          background: '#f2f0ea',
                          color: '#070707',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 14,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          letterSpacing: '0.06em',
                          cursor: 'pointer'
                        }}
                      >
                        {t('LEARN.CLAIM_BADGE', 'CLAIM CYBER DEFENDER CERTIFICATE')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Defender Certification Showcase Banner */}
        <div style={{
          marginTop: 48,
          background: '#0d0d0d',
          border: '1px solid #30302d',
          borderRadius: '16px',
          padding: '36px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#8e8b84', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              OFFICIAL CREDENTIAL VERIFICATION
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 8px 0', fontFamily: "'IBM Plex Sans', sans-serif", color: '#f2f0ea' }}>
              Cyber Defender National Certification
            </h3>
            <p style={{ color: '#8e8b84', margin: 0, fontSize: 14, maxWidth: 600 }}>
              Complete the security scenario modules with an 80%+ accuracy rating to generate your cryptographically verified Cyber Awareness Certificate with serial tracking.
            </p>
          </div>

          <button
            onClick={() => setShowCertModal(true)}
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              background: '#f2f0ea',
              color: '#070707',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'IBM Plex Sans', sans-serif",
              letterSpacing: '0.06em',
              cursor: 'pointer'
            }}
          >
            {t('LEARN.VIEW_CERTIFICATE', 'VIEW DEFENDER CERTIFICATE')}
          </button>
        </div>
      </main>

      {/* Official Certificate Modal */}
      <AnimatePresence>
        {showCertModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 7, 7, 0.95)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 20px',
            overflowY: 'auto'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                maxWidth: 880,
                position: 'relative'
              }}
            >
              {/* ====== CERTIFICATE DESIGN ====== */}
              <div id="certificate-content" ref={certRef} style={{
                background: '#0d0d0d',
                borderRadius: '16px',
                border: '1px solid #30302d',
                padding: '48px 56px',
                boxShadow: '0 24px 70px rgba(0, 0, 0, 0.7)'
              }}>
                {/* Header Section */}
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    margin: '0 auto 16px',
                    borderRadius: '50%',
                    background: '#141414',
                    border: '1px solid #3b3b38',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: '#EFEDE8'
                  }}>
                    ◈
                  </div>

                  <div style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 11,
                    letterSpacing: '0.16em',
                    color: '#8e8b84',
                    fontWeight: 700,
                    marginBottom: 4,
                    textTransform: 'uppercase'
                  }}>
                    CYBERGUARD FORENSIC & CITIZEN SAFETY INITIATIVE
                  </div>
                  <div style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: '#65635e',
                    fontWeight: 600,
                    marginBottom: 20,
                    textTransform: 'uppercase'
                  }}>
                    NATIONAL CYBER COORDINATION CENTRE
                  </div>

                  <div style={{
                    width: 140,
                    height: 1,
                    background: '#30302d',
                    margin: '0 auto 18px'
                  }} />

                  <h2 style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    letterSpacing: '0.06em',
                    margin: '0 0 6px 0',
                    color: '#f2f0ea'
                  }}>
                    {t('LEARN.CERTIFICATE_TITLE', 'OFFICIAL CYBER DEFENDER CERTIFICATE')}
                  </h2>
                  <div style={{
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    color: '#8e8b84',
                    fontWeight: 600,
                    marginBottom: 24,
                    fontFamily: "'IBM Plex Sans', sans-serif"
                  }}>
                    CERTIFICATE OF PROFICIENCY IN DIGITAL THREAT AWARENESS
                  </div>

                  <p style={{
                    color: '#8e8b84',
                    fontSize: 13,
                    margin: '0 0 8px 0',
                    fontStyle: 'italic'
                  }}>
                    This credential certifies that
                  </p>

                  <h3 style={{
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    margin: '0 0 10px 0',
                    color: '#f2f0ea',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    letterSpacing: '0.04em'
                  }}>
                    {(user?.name || 'Citizen Defender').toUpperCase()}
                  </h3>

                  <p style={{
                    color: '#a6a39b',
                    fontSize: 13,
                    maxWidth: 580,
                    margin: '0 auto 28px',
                    lineHeight: 1.6
                  }}>
                    has demonstrated exceptional vigilance and proficiency in identifying phishing vectors,
                    smishing triggers, malware double-extension exploits, social engineering tactics,
                    and public network vulnerabilities with distinction.
                  </p>

                  {/* Metrics Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                    marginBottom: 28,
                    maxWidth: 680,
                    margin: '0 auto 28px'
                  }}>
                    {[
                      { label: 'SERIAL HASH', value: certId || 'CG-CERT-99824', color: '#EFEDE8' },
                      { label: 'PROFICIENCY', value: `${xp} XP`, color: '#f2f0ea' },
                      { label: 'THREAT LEVEL', value: xp >= 400 ? 'ADVANCED' : xp >= 200 ? 'INTERMEDIATE' : 'FOUNDATION', color: '#f2f0ea' },
                      { label: 'ISSUE DATE', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), color: '#f2f0ea' }
                    ].map((m, idx) => (
                      <div key={idx} style={{
                        background: '#141414',
                        border: '1px solid #30302d',
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 9, color: '#8e8b84', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>{m.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: m.color, fontFamily: "'IBM Plex Mono', monospace" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Verification QR-like block */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    padding: '10px 18px',
                    background: '#141414',
                    borderRadius: '8px',
                    border: '1px solid #30302d',
                    maxWidth: 420,
                    margin: '0 auto'
                  }}>
                    <div style={{ fontSize: 10, color: '#8e8b84', letterSpacing: '0.08em', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      DIGITAL SIGNATURE:
                    </div>
                    <div style={{ fontSize: 11, color: '#EFEDE8', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                      {certId || 'SHA-256'} · CRYPTOGRAPHICALLY SECURED
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cert-actions" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 14,
                marginTop: 20
              }}>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={downloading}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    background: '#f2f0ea',
                    color: '#070707',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: downloading ? 'wait' : 'pointer'
                  }}
                >
                  {downloading ? 'Rendering...' : 'Download Certificate'}
                </button>
                <button
                  onClick={handleShareBadge}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    background: '#141414',
                    border: '1px solid #3b3b38',
                    color: '#f2f0ea',
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: 'pointer'
                  }}
                >
                  Share Badge
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: '#141414',
                    border: '1px solid #30302d',
                    color: '#8e8b84',
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
