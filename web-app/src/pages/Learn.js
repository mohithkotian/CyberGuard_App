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
    if (xp >= 350) return { title: 'Sentinel Cyber Guard', badge: '◈', color: '#00B4FF' };
    if (xp >= 200) return { title: 'Cyber Intelligence Scout', badge: '»', color: '#FFD600' };
    return { title: 'Cadet Cyber Defender', badge: '◈', color: '#8892B0' };
  };

  const rank = getRank();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#02060A',
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Liquid Atmospheric Accents */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 180, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0, 255, 209, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '60px 24px 100px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 40
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(0, 180, 255, 0.1)',
              border: '1px solid rgba(0, 180, 255, 0.3)',
              color: '#00B4FF',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 12
            }}>
              <span>▶</span> {t('LEARN.TITLE', 'Gamified Cyber Awareness Hub')}
            </div>
            <h1 style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              margin: '0 0 10px 0',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #00B4FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Interactive Defense Arena
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 15, maxWidth: 650 }}>
              {t('LEARN.SUBTITLE', 'Master modern cyber defense in 1-minute interactive scenario quizzes and claim your official Cyber Defender Certificate.')}
            </p>
          </div>

          {/* Gamification Stats Card */}
          <div style={{
            display: 'flex',
            gap: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '16px 24px',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center', paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <UiIcon name="shield" size={24} label={`${rank.title} badge`} />
              <div style={{ fontSize: 11, fontWeight: 700, color: rank.color, textTransform: 'uppercase', marginTop: 4 }}>
                {rank.title}
              </div>
            </div>
            <div style={{ textAlign: 'center', paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#00FFD1', fontFamily: 'Orbitron, monospace' }}>{xp}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{t('LEARN.XP_POINTS', 'Total XP')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFD600', fontFamily: 'Orbitron, monospace' }}>
                {completedScenarios.size}/{SCENARIOS.length}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{t('LEARN.BADGES_EARNED', 'Completed')}</div>
            </div>
          </div>
        </div>

        {/* Level Track / Scenario Selector Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SCENARIOS.length}, 1fr)`,
          gap: 12,
          marginBottom: 36,
          overflowX: 'auto',
          paddingBottom: 6
        }}>
          {SCENARIOS.map((sc, idx) => {
            const isDone = completedScenarios.has(sc.id);
            const isActive = idx === activeScenarioIndex;
            return (
              <motion.div
                key={sc.id}
                onClick={() => handleSelectScenarioDirect(idx)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: isActive
                    ? 'rgba(0, 180, 255, 0.15)'
                    : isDone
                      ? 'rgba(0, 255, 209, 0.05)'
                      : 'rgba(255, 255, 255, 0.02)',
                  border: isActive
                    ? '1px solid #00B4FF'
                    : isDone
                      ? '1px solid rgba(0, 255, 209, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: isActive ? '0 0 20px rgba(0, 180, 255, 0.2)' : 'none',
                  transition: '0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: isDone ? '#00FFD1' : isActive ? '#00B4FF' : 'rgba(255,255,255,0.1)',
                  color: isDone || isActive ? '#02060A' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800
                }}>
                  {isDone ? 'v' : idx + 1}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 10, color: '#00B4FF', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                    {sc.category}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sc.title}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Interactive Scenario Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 28,
          alignItems: 'start'
        }}>
          {/* Left Column: Visual Mockup Sandbox */}
          <div style={{
            background: 'rgba(3, 10, 15, 0.95)',
            border: '1px solid rgba(0, 180, 255, 0.25)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Mockup Header Toolbar */}
            <div style={{
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#FF6B6B',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <span>! Insecure:</span> {currentScenario.url || 'sms://vk-pwrdis/thread'}
              </div>
            </div>

            {/* Mockup Content Body */}
            <div style={{ padding: 24, minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {currentScenario.mockupType === 'browser' && (
                <div style={{
                  background: '#FFFFFF',
                  color: '#1A1A1A',
                  borderRadius: '12px',
                  padding: 24,
                  border: '2px dashed #FF3B30'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0056B3', paddingBottom: 12, marginBottom: 16 }}>
                    <div style={{ fontWeight: 900, color: '#0056B3', fontSize: 18 }}>{currentScenario.browserContent.bankName}</div>
                    <div style={{ fontSize: 11, background: '#FFEBEB', color: '#D32F2F', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>
                      ! VERIFY SESSION
                    </div>
                  </div>
                  <div style={{ background: '#FFF3CD', borderLeft: '4px solid #FFC107', padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#856404', marginBottom: 16 }}>
                    {currentScenario.browserContent.headline}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: '#495057', margin: '0 0 20px 0' }}>
                    {currentScenario.browserContent.body}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <input type="text" placeholder="Enter 16-Digit ATM Card Number" disabled style={{ padding: 10, borderRadius: 6, border: '1px solid #CED4DA', fontSize: 12 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input type="text" placeholder="MM/YY" disabled style={{ padding: 10, borderRadius: 6, border: '1px solid #CED4DA', fontSize: 12 }} />
                      <input type="password" placeholder="ATM 4-Digit PIN" disabled style={{ padding: 10, borderRadius: 6, border: '1px solid #CED4DA', fontSize: 12, background: '#FFF5F5' }} />
                    </div>
                  </div>
                  <button style={{ width: '100%', padding: '12px', background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'not-allowed' }}>
                    {currentScenario.browserContent.actionButton}
                  </button>
                </div>
              )}

              {currentScenario.mockupType === 'phone' && (
                <div style={{
                  maxWidth: 340,
                  margin: '0 auto',
                  background: '#1C1C1E',
                  borderRadius: '24px',
                  padding: '20px 16px',
                  border: '3px solid #3A3A3C',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#8E8E93', marginBottom: 14 }}>
                    {currentScenario.phoneMessage.sender} • {currentScenario.phoneMessage.timestamp}
                  </div>
                  <div style={{
                    background: '#2C2C2E',
                    borderRadius: '16px',
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: '#fff',
                    borderLeft: '4px solid #FF453A'
                  }}>
                    {currentScenario.phoneMessage.text}
                  </div>
                  <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#FF453A', fontWeight: 600 }}>
                    ! Sender unverified. Contains executable link.
                  </div>
                </div>
              )}

              {currentScenario.mockupType === 'email' && (
                <div style={{
                  background: '#1E1E24',
                  borderRadius: '12px',
                  padding: 20,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                    <strong style={{ color: '#fff' }}>From:</strong> {currentScenario.emailData.from}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                    <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Subject:</strong> {currentScenario.emailData.subject}
                  </div>
                  <div style={{
                    background: 'rgba(255, 59, 48, 0.1)',
                    border: '1px solid rgba(255, 59, 48, 0.4)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>▤</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FF453A', fontFamily: 'monospace' }}>
                          {currentScenario.emailData.attachment}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{currentScenario.emailData.attachmentSize} • Executable Application</div>
                      </div>
                    </div>
                    <div style={{ background: '#FF453A', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 4 }}>
                      BLOCKED
                    </div>
                  </div>
                </div>
              )}

              {currentScenario.mockupType === 'chat' && (
                <div style={{
                  background: '#0F1A24',
                  borderRadius: '16px',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  {currentScenario.chatData.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: msg.sender.includes('Citizen') ? 'flex-end' : 'flex-start',
                        background: msg.sender.includes('Citizen') ? '#007AFF' : '#243447',
                        color: '#fff',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        maxWidth: '85%',
                        fontSize: 12,
                        lineHeight: 1.4
                      }}
                    >
                      <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 2, fontWeight: 700 }}>{msg.sender}</div>
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}

              {currentScenario.mockupType === 'wifi' && (
                <div style={{
                  background: '#151C24',
                  borderRadius: '16px',
                  padding: 20
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#00B4FF' }}>Available Wi-Fi Networks</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {currentScenario.wifiList.map((net, i) => (
                      <div key={i} style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: net.secure ? 'rgba(0, 255, 209, 0.05)' : 'rgba(255, 59, 48, 0.1)',
                        border: net.secure ? '1px solid rgba(0, 255, 209, 0.3)' : '1px solid rgba(255, 59, 48, 0.4)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{net.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: net.secure ? '#00FFD1' : '#FF453A' }}>
                          {net.secure ? '◇ Authenticated' : '! Open / No Password'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quiz Questions & Explanations */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(30px)',
            borderRadius: '20px',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#00B4FF', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('LEARN.SCORE_LABEL', 'Scenario')} {activeScenarioIndex + 1} of {SCENARIOS.length}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(0, 255, 209, 0.1)', color: '#00FFD1' }}>
                  +{currentScenario.points} XP
                </span>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 16px 0', lineHeight: 1.3 }}>
                {currentScenario.question}
              </h2>

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
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    transition: '0.2s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  };

                  if (isSelected && !isAnswerSubmitted) {
                    optStyle.background = 'rgba(0, 180, 255, 0.15)';
                    optStyle.border = '1px solid #00B4FF';
                  }

                  if (isAnswerSubmitted) {
                    if (opt.isCorrect) {
                      optStyle.background = 'rgba(0, 255, 209, 0.15)';
                      optStyle.border = '1px solid #00FFD1';
                      optStyle.color = '#00FFD1';
                    } else if (isSelected && !opt.isCorrect) {
                      optStyle.background = 'rgba(255, 59, 48, 0.15)';
                      optStyle.border = '1px solid #FF453A';
                      optStyle.color = '#FF453A';
                    }
                  }

                  return (
                    <motion.div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      whileHover={!isAnswerSubmitted ? { scale: 1.01 } : {}}
                      whileTap={!isAnswerSubmitted ? { scale: 0.99 } : {}}
                      style={optStyle}
                    >
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
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
                    background: 'rgba(0, 180, 255, 0.08)',
                    border: '1px solid rgba(0, 180, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 20
                  }}
                >
                  <strong style={{ color: '#00B4FF', display: 'block', marginBottom: 4 }}>
                    <UiIcon name="investigator-protocol" size={16} /> Forensic Security Insight:
                  </strong>
                  {currentScenario.explanation}
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00B4FF 0%, #007AFF 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    fontFamily: 'Orbitron, monospace',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(0, 180, 255, 0.4)'
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
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #00FFD1 0%, #00B4FF 100%)',
                        color: '#02060A',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: 'Orbitron, monospace',
                        letterSpacing: '1px',
                        cursor: 'pointer'
                      }}
                    >
                      {t('LEARN.NEXT_QUESTION', 'NEXT SCENARIO')} ->
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCertModal(true)}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #FFD600 0%, #FF6B35 100%)',
                        color: '#02060A',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: 'Orbitron, monospace',
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        boxShadow: '0 0 30px rgba(255, 214, 0, 0.4)'
                      }}
                    >
                      <UiIcon name="personnel-directory" size={18} /> {t('LEARN.CLAIM_BADGE', 'CLAIM CYBER DEFENDER CERTIFICATE')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Defender Certification Showcase Banner */}
        <div style={{
          marginTop: 60,
          background: 'radial-gradient(ellipse at center, rgba(0, 180, 255, 0.15) 0%, rgba(2, 6, 10, 0.8) 100%)',
          border: '1px solid rgba(0, 180, 255, 0.3)',
          borderRadius: '24px',
          padding: '36px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#FFD600', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              <UiIcon name="personnel-directory" size={16} /> OFFICIAL CREDENTIAL VERIFICATION
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0' }}>
              Cyber Defender National Certification
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 14, maxWidth: 600 }}>
              Complete the security scenario modules with an 80%+ accuracy rating to generate your cryptographically verified Cyber Awareness Certificate with serial tracking.
            </p>
          </div>

          <button
            onClick={() => setShowCertModal(true)}
            style={{
              padding: '16px 32px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00FFD1 0%, #007AFF 100%)',
              color: '#02060A',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(0, 255, 209, 0.3)'
            }}
          >
            <UiIcon name="document" size={18} /> {t('LEARN.VIEW_CERTIFICATE', 'VIEW DEFENDER CERTIFICATE')}
          </button>
        </div>
      </div>

      {/* Official Certificate Modal */}
      <AnimatePresence>
        {showCertModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 10, 0.96)',
            backdropFilter: 'blur(40px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '50px 20px 60px 20px',
            overflowY: 'auto'
          }}>
            {/* Prominent Floating Close Button (Top Right of Screen) */}
            <button
              onClick={() => setShowCertModal(false)}
              aria-label="Close certificate"
              style={{
                position: 'fixed',
                top: 24,
                right: 28,
                background: 'rgba(255, 59, 48, 0.25)',
                border: '2px solid rgba(255, 59, 48, 0.8)',
                color: '#FF3B30',
                borderRadius: '12px',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 800,
                zIndex: 100002,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 0 25px rgba(255, 59, 48, 0.4), 0 4px 12px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.2s ease',
                fontFamily: 'Orbitron, monospace',
                letterSpacing: '1px'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#FF3B30';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 59, 48, 0.25)';
                e.currentTarget.style.color = '#FF3B30';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>x</span>
              <span>CLOSE</span>
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              style={{
                width: '100%',
                maxWidth: 900,
                position: 'relative',
                margin: 'auto 0'
              }}
            >
              {/* Secondary Corner Close Button */}
              <button
                onClick={() => setShowCertModal(false)}
                className="cert-close-btn"
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'rgba(255,59,48,0.2)',
                  border: '1.5px solid rgba(255,59,48,0.6)',
                  color: '#FF3B30',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 800,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,59,48,0.8)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,59,48,0.2)';
                  e.currentTarget.style.color = '#FF3B30';
                }}
              >
                x
              </button>

              {/* ====== CERTIFICATE DESIGN ====== */}
              <div id="certificate-content" ref={certRef} style={{
                background: 'linear-gradient(145deg, #030B14 0%, #0A1628 30%, #071020 70%, #030B14 100%)',
                borderRadius: '20px',
                padding: '6px',
                boxShadow: '0 0 100px rgba(0, 180, 255, 0.15), 0 40px 80px rgba(0,0,0,0.7)'
              }}>
                {/* Ornate outer border */}
                <div style={{
                  border: '2px solid rgba(0, 180, 255, 0.35)',
                  borderRadius: '16px',
                  padding: '4px'
                }}>
                  {/* Inner ornate border */}
                  <div style={{
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '14px',
                    padding: '40px 50px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 180, 255, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, rgba(255, 215, 0, 0.04) 0%, transparent 50%)'
                  }}>
                    {/* Decorative corner ornaments */}
                    <div style={{ position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderTop: '2px solid rgba(255, 215, 0, 0.4)', borderLeft: '2px solid rgba(255, 215, 0, 0.4)', borderTopLeftRadius: '8px' }} />
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderTop: '2px solid rgba(255, 215, 0, 0.4)', borderRight: '2px solid rgba(255, 215, 0, 0.4)', borderTopRightRadius: '8px' }} />
                    <div style={{ position: 'absolute', bottom: 12, left: 12, width: 40, height: 40, borderBottom: '2px solid rgba(255, 215, 0, 0.4)', borderLeft: '2px solid rgba(255, 215, 0, 0.4)', borderBottomLeftRadius: '8px' }} />
                    <div style={{ position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderBottom: '2px solid rgba(255, 215, 0, 0.4)', borderRight: '2px solid rgba(255, 215, 0, 0.4)', borderBottomRightRadius: '8px' }} />

                    {/* Watermark shield background */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '280px',
                      opacity: 0.03,
                      pointerEvents: 'none',
                      lineHeight: 1
                    }}>◈</div>

                    {/* Header Section */}
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      {/* Shield Emblem */}
                      <div style={{
                        width: 70,
                        height: 70,
                        margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, rgba(0, 180, 255, 0.2) 0%, rgba(255, 215, 0, 0.15) 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.15), inset 0 0 20px rgba(0, 180, 255, 0.1)'
                      }}>
                        ◈
                      </div>

                      {/* Organization */}
                      <div style={{
                        fontFamily: 'Orbitron, monospace',
                        fontSize: 11,
                        letterSpacing: '5px',
                        color: '#FFD700',
                        fontWeight: 700,
                        marginBottom: 4,
                        textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                      }}>
                        CYBERGUARD FORENSIC & CITIZEN SAFETY INITIATIVE
                      </div>
                      <div style={{
                        fontSize: 10,
                        letterSpacing: '3px',
                        color: 'rgba(255,255,255,0.35)',
                        fontWeight: 600,
                        marginBottom: 20
                      }}>
                        MINISTRY OF HOME AFFAIRS • NATIONAL CYBER COORDINATION CENTRE
                      </div>

                      {/* Horizontal Gold Line */}
                      <div style={{
                        width: 200,
                        height: 1,
                        background: 'linear-gradient(to right, transparent, rgba(255, 215, 0, 0.6), transparent)',
                        margin: '0 auto 18px'
                      }} />

                      {/* Title */}
                      <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        fontFamily: 'Orbitron, monospace',
                        letterSpacing: '3px',
                        margin: '0 0 6px 0',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFD700 50%, #FFA500 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: 'none'
                      }}>
                        {t('LEARN.CERTIFICATE_TITLE', 'OFFICIAL CYBER DEFENDER CERTIFICATE')}
                      </h2>
                      <div style={{
                        fontSize: 11,
                        letterSpacing: '2px',
                        color: 'rgba(255,255,255,0.4)',
                        fontWeight: 600,
                        marginBottom: 28
                      }}>
                        CERTIFICATE OF PROFICIENCY IN DIGITAL THREAT AWARENESS
                      </div>

                      {/* Divider */}
                      <div style={{
                        width: 300,
                        height: 1,
                        background: 'linear-gradient(to right, transparent, rgba(0, 180, 255, 0.4), transparent)',
                        margin: '0 auto 28px'
                      }} />

                      {/* Certification Text */}
                      <p style={{
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: 14,
                        margin: '0 0 8px 0',
                        fontStyle: 'italic',
                        letterSpacing: '1px'
                      }}>
                        This credential proudly certifies that
                      </p>

                      {/* Name */}
                      <h3 style={{
                        fontSize: '2.6rem',
                        fontWeight: 900,
                        margin: '0 0 10px 0',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #00FFD1 50%, #00B4FF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '1px',
                        lineHeight: 1.2
                      }}>
                        {(user?.name || 'Citizen Defender').toUpperCase()}
                      </h3>

                      {/* Description */}
                      <p style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 13,
                        maxWidth: 580,
                        margin: '0 auto 30px',
                        lineHeight: 1.7,
                        letterSpacing: '0.3px'
                      }}>
                        has demonstrated exceptional vigilance and proficiency in identifying phishing vectors,
                        smishing triggers, malware double-extension exploits, social engineering tactics,
                        and public network vulnerabilities with distinction.
                      </p>

                      {/* Metrics Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1,
                        background: 'rgba(255, 215, 0, 0.15)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: 28,
                        maxWidth: 680,
                        margin: '0 auto 28px'
                      }}>
                        {[
                          { label: 'CERTIFICATE SERIAL', value: certId, color: '#FFD700' },
                          { label: 'PROFICIENCY XP', value: `${xp} XP`, color: '#00FFD1' },
                          { label: 'THREAT LEVEL CLEARED', value: xp >= 400 ? 'ADVANCED' : xp >= 200 ? 'INTERMEDIATE' : 'FOUNDATION', color: '#00B4FF' },
                          { label: 'ISSUE DATE', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), color: '#FFFFFF' }
                        ].map((m, idx) => (
                          <div key={idx} style={{
                            background: 'rgba(2, 6, 10, 0.9)',
                            padding: '16px 12px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '1.5px', marginBottom: 6 }}>{m.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: m.color, fontFamily: 'monospace', letterSpacing: '0.5px' }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Signature + Seal Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        padding: '0 30px',
                        marginBottom: 20
                      }}>
                        {/* Digital Signature Left */}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{
                            fontFamily: 'cursive, Georgia, serif',
                            fontSize: 22,
                            color: 'rgba(255, 215, 0, 0.7)',
                            marginBottom: 4,
                            fontStyle: 'italic'
                          }}>
                            CyberGuard AI
                          </div>
                          <div style={{
                            width: 120,
                            height: 1,
                            background: 'rgba(255,255,255,0.3)',
                            margin: '0 auto 6px'
                          }} />
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                            AUTOMATED VERIFICATION
                          </div>
                        </div>

                        {/* Holographic Seal Center */}
                        <div style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'conic-gradient(from 0deg, #FFD700, #00FFD1, #00B4FF, #A78BFA, #FF6B8B, #FFD700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
                          margin: '0 30px'
                        }}>
                          <div style={{
                            width: 68,
                            height: 68,
                            borderRadius: '50%',
                            background: '#0A1628',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}>
                            <div style={{ fontSize: 10, color: '#FFD700', fontWeight: 900, letterSpacing: '1px', lineHeight: 1.3, textAlign: 'center' }}>
                              VERIFIED<br/>AUTHENTIC
                            </div>
                          </div>
                        </div>

                        {/* Authority Right */}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{
                            fontFamily: 'cursive, Georgia, serif',
                            fontSize: 22,
                            color: 'rgba(0, 180, 255, 0.7)',
                            marginBottom: 4,
                            fontStyle: 'italic'
                          }}>
                            I4C Authority
                          </div>
                          <div style={{
                            width: 120,
                            height: 1,
                            background: 'rgba(255,255,255,0.3)',
                            margin: '0 auto 6px'
                          }} />
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                            ISSUING AUTHORITY
                          </div>
                        </div>
                      </div>

                      {/* Verification QR-like block */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        padding: '12px 20px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        maxWidth: 500,
                        margin: '0 auto'
                      }}>
                        {/* QR Placeholder Grid */}
                        <div style={{
                          width: 44,
                          height: 44,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(6, 1fr)',
                          gap: 1,
                          flexShrink: 0
                        }}>
                          {Array.from({length: 36}).map((_, i) => (
                            <div key={i} style={{
                              background: Math.random() > 0.4 ? 'rgba(0, 180, 255, 0.6)' : 'rgba(255,255,255,0.06)',
                              borderRadius: 1
                            }} />
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', fontWeight: 700 }}>
                            DIGITAL VERIFICATION CODE
                          </div>
                          <div style={{ fontSize: 11, color: '#00B4FF', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>
                            {certId} • SHA-256 HASH VERIFIED
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cert-actions" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 14,
                marginTop: 24
              }}>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={downloading}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    background: downloading ? 'rgba(255,215,0,0.4)' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#02060A',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: downloading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => !downloading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={e => !downloading && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {downloading ? '… Rendering...' : '▤ Download Certificate'}
                </button>
                <button
                  onClick={handleShareBadge}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  ↗ Share Badge
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    background: 'rgba(255,59,48,0.12)',
                    border: '1px solid rgba(255,59,48,0.4)',
                    color: '#FF3B30',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  x Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
