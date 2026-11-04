import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

const faqData = [
  { question: "What is the purpose of National Cyber Crime Reporting Portal?", answer: "This portal is an initiative of the Government of India to facilitate victims/complainants to report cyber crime complaints online. This portal caters to complaints pertaining to cyber crimes only with special focus on cyber crimes against women and children." },
  { question: "What is CSEAM - Child Sexual Exploitative and Abuse Material?", answer: "CSEAM refers to any digital content that depicts the sexual exploitation or abuse of children. It is illegal to possess, distribute, or view such material." },
  { question: "Apart from this portal, are there any alternative ways to remove objectionable content from social media websites?", answer: "Yes, you can directly report the content to the respective social media platform using their in-built reporting mechanisms. Most platforms have strict policies against objectionable content." },
  { question: "Which type of cybercrimes I can report on the portal?", answer: "You can report all types of cybercrimes on this portal, including cyber fraud, identity theft, cyber bullying, cyber stalking, and crimes against women and children." },
  { question: "What kind of information, should I provide to report complaint?", answer: "Please provide complete details of the incident, supporting digital evidence (screenshots, bank statements, emails, URLs), and your contact information." },
  { question: "Which State/ UT shall I select while reporting a complaint?", answer: "Select the State/UT where you currently reside or where the incident occurred. If you are unsure, select your current state of residence." },
  { question: "How can I file the complaints about other cybercrimes?", answer: "You can use the 'Report Other Cybercrimes' section on the portal to file complaints for crimes not specifically listed under the Women and Children section." },
  { question: "What type of information would be considered as evidence while filing my complaint related to cybercrime?", answer: "Evidence can include screenshots, emails, chat transcripts, bank transaction receipts, URLs, and any other digital footprints left by the attacker." },
  { question: "What action will be taken if complainant reports any false complaint/information?", answer: "Filing a false complaint is a punishable offense under the law, and strict legal action will be taken against individuals providing false information." },
  { question: "Can I report a complaint without uploading any information?", answer: "While you can submit a complaint, providing evidence significantly helps law enforcement in the investigation process and increases the chances of resolution." },
  { question: "What happens once I report a complaint?", answer: "Your complaint is assigned to the respective police station/cyber cell for further investigation. You will receive an acknowledgment number for tracking." },
  { question: "Will I be informed that my complaint has been submitted successfully?", answer: "Yes, you will receive an acknowledgment number via SMS and email once your complaint is successfully submitted." },
  { question: "Can I check the status of my complaint?", answer: "Yes, you can track your complaint status using the acknowledgment number on the portal's tracking section." },
  { question: "Can I withdraw my complaint from the portal?", answer: "Withdrawal procedures depend on the jurisdiction and the stage of the investigation. You generally need to contact your local police station to request a withdrawal." },
  { question: "What is Hash value and what is its purpose?", answer: "A hash value is a unique digital fingerprint of a file. It helps ensure the integrity of digital evidence by proving the file has not been altered." },
  { question: "Can I file a complaint if I am an Indian citizen but have been victimized online/ in cyberspace by a foreign national or company?", answer: "Yes, you can file a complaint on the portal. The Indian cyber cell will coordinate with international agencies if necessary." },
  { question: "Can I file a complaint if I have been victimized online/ in cyberspace by an individual or company in India, but I am not a citizen of India?", answer: "Yes, you can report the incident on the portal regardless of your citizenship, provided the crime falls under Indian jurisdiction." }
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="page-shell">
      <Navbar />
      
      <main className="report-layout">
        {/* Subheader / Aside Row */}
        <aside className="report-aside">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back</span>
          </button>
          <div className="aside-copy">
            <p className="eyebrow">SUPPORT & KNOWLEDGE BASE</p>
            <h1>FREQUENTLY ASKED QUESTIONS</h1>
            <p>Official procedural guidance regarding complaint submission, evidence handling, and legal workflows.</p>
          </div>
          <div className="help-note">
            <p>Need urgent help?</p>
            <span>Dial 1930 for the National Cyber Crime Citizen Helpline.</span>
          </div>
        </aside>

        {/* Content Workspace */}
        <div className="form-workspace">
          <div className="report-form" style={{ padding: 0 }}>
            {/* Form Intro Header */}
            <div className="form-intro">
              <div>
                <p className="step-label">OFFICIAL DIRECTORY</p>
                <h2>Incident Resolution & Procedural Inquiries</h2>
              </div>
              <p className="required-note">
                {faqData.length} Verified Solutions
              </p>
            </div>

            {/* Accordion Questions List */}
            <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {faqData.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div 
                    key={index} 
                    style={{
                      background: isOpen ? '#141414' : '#0d0d0d',
                      border: isOpen ? '1px solid #f2f0ea' : '1px solid #30302d',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      style={{
                        width: '100%',
                        padding: '22px 28px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        outline: 'none'
                      }}
                    >
                      <span style={{ 
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: '17px', 
                        color: isOpen ? '#f2f0ea' : '#b8b8b0', 
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        lineHeight: '1.4',
                        paddingRight: '16px'
                      }}>
                        {faq.question}
                      </span>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isOpen ? '#f2f0ea' : '#1a1a18',
                        color: isOpen ? '#070707' : '#888880',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ 
                            padding: '0 28px 24px 28px', 
                            color: '#b8b8b0',
                            fontSize: '14px',
                            lineHeight: '1.7',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            borderTop: '1px solid #222220',
                            paddingTop: '18px'
                          }}>
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
