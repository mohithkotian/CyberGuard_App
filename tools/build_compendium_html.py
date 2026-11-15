#!/usr/bin/env python3
"""
build_compendium_html.py
Generates the comprehensive, beautifully formatted HTML edition of the
CyberGuard AI Master Architecture, Technical Specification & Engineering Compendium,
complete with vector SVG diagrams, structured tables, code listings, and academic typography.
"""
import os
import sys

OUTPUT_HTML = "/Users/pruthvishetty/Desktop/cybercrime-system/tools/compendium.html"

# SVG Diagram 1: System Architecture Microservice Topology
SVG_ARCHITECTURE = """
<svg viewBox="0 0 950 560" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00d2b4"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Outer Frame -->
  <rect x="0" y="0" width="950" height="560" rx="12" fill="url(#bgGrad)" stroke="#334155" stroke-width="1.5"/>

  <!-- Title Badge -->
  <rect x="30" y="20" width="890" height="40" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <text x="50" y="45" font-size="14" font-weight="700" fill="#00d2b4" letter-spacing="1">CYBERGUARD AI — FULL-STACK MICROSERVICE TOPOLOGY</text>
  <text x="730" y="45" font-size="12" font-weight="500" fill="#94a3b8">Zero-Trust Enterprise Architecture</text>

  <!-- Layer 1: Client Layer -->
  <rect x="30" y="80" width="890" height="75" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" filter="url(#shadow)"/>
  <rect x="30" y="80" width="6" height="75" rx="3" fill="#00d2b4"/>
  <text x="50" y="102" font-size="12" font-weight="700" fill="#38bdf8">CLIENT APPLICATION LAYER</text>
  
  <!-- Web Client Box -->
  <rect x="50" y="112" width="400" height="32" rx="6" fill="#0f172a" stroke="#334155"/>
  <circle cx="65" cy="128" r="4" fill="#00d2b4"/>
  <text x="80" y="132" font-size="11" font-weight="600" fill="#f8fafc">React 18 SPA (Port 3000)</text>
  <text x="245" y="132" font-size="10" fill="#94a3b8">Framer Motion • Onee 3D Avatar • Leaflet Radar</text>

  <!-- Mobile Client Box -->
  <rect x="470" y="112" width="430" height="32" rx="6" fill="#0f172a" stroke="#334155"/>
  <circle cx="485" cy="128" r="4" fill="#38bdf8"/>
  <text x="500" y="132" font-size="11" font-weight="600" fill="#f8fafc">React Native Mobile (Expo SDK 54 / Port 8081)</text>
  <text x="750" y="132" font-size="10" fill="#94a3b8">iOS / Android</text>

  <!-- Communication Arrows -->
  <path d="M 250 155 L 250 185" stroke="#00d2b4" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#arrow)"/>
  <path d="M 680 155 L 680 185" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="360" y="175" font-size="10" font-weight="600" fill="#64748b">HTTP REST (Axios) + WebSockets (Socket.IO)</text>

  <!-- Layer 2: API Gateway & Security Shield -->
  <rect x="30" y="185" width="890" height="150" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" filter="url(#shadow)"/>
  <rect x="30" y="185" width="6" height="150" rx="3" fill="#38bdf8"/>
  <text x="50" y="207" font-size="12" font-weight="700" fill="#38bdf8">GATEWAY & MIDDLEWARE TIER — NODE.JS / EXPRESS (PORT 5002)</text>

  <rect x="50" y="220" width="160" height="100" rx="6" fill="#0f172a" stroke="#334155"/>
  <text x="60" y="240" font-size="11" font-weight="700" fill="#f8fafc">Security & Auth</text>
  <text x="60" y="260" font-size="9.5" fill="#94a3b8">• JWT + Refresh Tokens</text>
  <text x="60" y="278" font-size="9.5" fill="#94a3b8">• TTL Token Blacklist</text>
  <text x="60" y="296" font-size="9.5" fill="#94a3b8">• Express Rate Limit</text>
  <text x="60" y="312" font-size="9.5" fill="#94a3b8">• Helmet & MongoSanitize</text>

  <rect x="225" y="220" width="200" height="100" rx="6" fill="#0f172a" stroke="#00d2b4" stroke-width="1.2"/>
  <text x="235" y="240" font-size="11" font-weight="700" fill="#00d2b4">Privacy Shield (PII)</text>
  <text x="235" y="260" font-size="9.5" fill="#94a3b8">• 18 PII Regex Patterns</text>
  <text x="235" y="278" font-size="9.5" fill="#94a3b8">• Tokenized Anonymization</text>
  <text x="235" y="296" font-size="9.5" fill="#94a3b8">• Aadhaar, PAN, UPI, Phone</text>
  <text x="235" y="312" font-size="9.5" fill="#94a3b8">• Multi-Tier RBAC Filter</text>

  <rect x="440" y="220" width="220" height="100" rx="6" fill="#0f172a" stroke="#334155"/>
  <text x="450" y="240" font-size="11" font-weight="700" fill="#f8fafc">Evidence Vault & Forensics</text>
  <text x="450" y="260" font-size="9.5" fill="#94a3b8">• Binary Magic-Byte Checker</text>
  <text x="450" y="278" font-size="9.5" fill="#94a3b8">• SHA-256 Custody Digest</text>
  <text x="450" y="296" font-size="9.5" fill="#94a3b8">• Tesseract.js Financial OCR</text>
  <text x="450" y="312" font-size="9.5" fill="#94a3b8">• Section 65B/BSA Affidavit</text>

  <rect x="675" y="220" width="225" height="100" rx="6" fill="#0f172a" stroke="#334155"/>
  <text x="685" y="240" font-size="11" font-weight="700" fill="#f8fafc">Real-Time Event Engine</text>
  <text x="685" y="260" font-size="9.5" fill="#94a3b8">• Socket.IO WSS Engine</text>
  <text x="685" y="278" font-size="9.5" fill="#94a3b8">• Case Room Isolation</text>
  <text x="685" y="296" font-size="9.5" fill="#94a3b8">• Live Officer-Victim Chat</text>
  <text x="685" y="312" font-size="9.5" fill="#94a3b8">• Instant LEA Dispatch Alert</text>

  <!-- Connectors to Tier 3 & Tier 4 -->
  <path d="M 325 335 L 325 365" stroke="#f59e0b" stroke-width="2"/>
  <path d="M 550 335 L 550 365" stroke="#8b5cf6" stroke-width="2"/>
  <path d="M 780 335 L 780 365" stroke="#10b981" stroke-width="2"/>

  <!-- Layer 3: Python ML Microservice -->
  <rect x="30" y="365" width="430" height="165" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1" filter="url(#shadow)"/>
  <rect x="30" y="365" width="6" height="165" rx="3" fill="#f59e0b"/>
  <text x="50" y="388" font-size="12" font-weight="700" fill="#f59e0b">PYTHON FLASK ML MICROSERVICE (PORT 5003)</text>
  <text x="320" y="388" font-size="10" fill="#cbd5e1">X-ML-Secret Auth</text>

  <rect x="50" y="400" width="390" height="115" rx="6" fill="#0f172a" stroke="#334155"/>
  <text x="65" y="420" font-size="10.5" font-weight="600" fill="#f8fafc">1. Preprocessor: Entity Tokenization & Negation Preservation</text>
  <text x="65" y="438" font-size="10.5" font-weight="600" fill="#f8fafc">2. Vectorizer: TF-IDF (1-2 N-Grams, 10,000 features, Sublinear TF)</text>
  <text x="65" y="456" font-size="10.5" font-weight="600" fill="#f8fafc">3. Classifier: Multinomial Logistic Regression (C=2.0, balanced)</text>
  <text x="65" y="474" font-size="10.5" font-weight="600" fill="#f8fafc">4. OOD Rejection Filter (Confidence &lt; 0.20 or Tokens &lt; 3)</text>
  <text x="65" y="495" font-size="10" font-weight="700" fill="#00d2b4">Held-out Accuracy: 89.74% • Latency: &lt; 25 ms • 13 Classes</text>

  <!-- Layer 4: Persistence Layer & Forensic Quarantine -->
  <rect x="480" y="365" width="440" height="165" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1" filter="url(#shadow)"/>
  <rect x="480" y="365" width="6" height="165" rx="3" fill="#10b981"/>
  <text x="500" y="388" font-size="12" font-weight="700" fill="#10b981">DATA PERSISTENCE & FORENSIC QUARANTINE</text>

  <rect x="500" y="400" width="195" height="115" rx="6" fill="#0f172a" stroke="#334155"/>
  <text x="510" y="420" font-size="11" font-weight="700" fill="#f8fafc">MongoDB Atlas (27017)</text>
  <text x="510" y="440" font-size="9.5" fill="#94a3b8">• Master Complaint Schema</text>
  <text x="510" y="458" font-size="9.5" fill="#94a3b8">• Immutable Chain of Custody</text>
  <text x="510" y="476" font-size="9.5" fill="#94a3b8">• 2dsphere Geo Indices</text>
  <text x="510" y="494" font-size="9.5" fill="#94a3b8">• Face ID 128D Embeddings</text>

  <rect x="710" y="400" width="195" height="115" rx="6" fill="#0f172a" stroke="#334155"/>
  <text x="720" y="420" font-size="11" font-weight="700" fill="#f8fafc">Quarantine Sandbox</text>
  <text x="720" y="440" font-size="9.5" fill="#94a3b8">• Static Heuristic Inspection</text>
  <text x="720" y="458" font-size="9.5" fill="#94a3b8">• Shannon Entropy Calculation</text>
  <text x="720" y="476" font-size="9.5" fill="#94a3b8">• APK Android Permissions</text>
  <text x="720" y="494" font-size="9.5" fill="#94a3b8">• ISO/IEC 27037 Compliance</text>
</svg>
"""

# SVG Diagram 2: Incident Processing Sequence
SVG_SEQUENCE = """
<svg viewBox="0 0 950 480" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <rect x="0" y="0" width="950" height="480" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
  
  <!-- Header -->
  <text x="40" y="35" font-size="14" font-weight="700" fill="#38bdf8">END-TO-END INCIDENT LIFECYCLE & INVESTIGATIVE TRIAGE FLOW</text>
  <text x="700" y="35" font-size="11" fill="#94a3b8">Synchronous Triage &lt; 1 Second</text>
  <line x1="40" y1="50" x2="910" y2="50" stroke="#334155" stroke-width="1"/>

  <!-- Actors -->
  <g id="actors" transform="translate(0, 20)">
    <!-- Citizen -->
    <rect x="60" y="50" width="120" height="36" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="85" y="73" font-size="11" font-weight="700" fill="#f8fafc">Citizen / Victim</text>
    <line x1="120" y1="86" x2="120" y2="430" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>

    <!-- Gateway -->
    <rect x="240" y="50" width="140" height="36" rx="6" fill="#1e293b" stroke="#00d2b4" stroke-width="1.5"/>
    <text x="255" y="73" font-size="11" font-weight="700" fill="#f8fafc">Node.js API Gateway</text>
    <line x1="310" y1="86" x2="310" y2="430" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>

    <!-- Privacy Shield -->
    <rect x="430" y="50" width="130" height="36" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="445" y="73" font-size="11" font-weight="700" fill="#f8fafc">Privacy Shield</text>
    <line x1="495" y1="86" x2="495" y2="430" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>

    <!-- Flask ML -->
    <rect x="600" y="50" width="140" height="36" rx="6" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>
    <text x="618" y="73" font-size="11" font-weight="700" fill="#f8fafc">Flask ML Engine</text>
    <line x1="670" y1="86" x2="670" y2="430" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>

    <!-- LEA / Officer -->
    <rect x="780" y="50" width="130" height="36" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
    <text x="795" y="73" font-size="11" font-weight="700" fill="#f8fafc">Police Officer</text>
    <line x1="845" y1="86" x2="845" y2="430" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>
  </g>

  <!-- Step 1: Submit -->
  <line x1="120" y1="130" x2="310" y2="130" stroke="#38bdf8" stroke-width="1.5"/>
  <polygon points="305,126 315,130 305,134" fill="#38bdf8"/>
  <text x="135" y="122" font-size="10" font-weight="600" fill="#cbd5e1">1. POST /api/complaints (Narrative + Screenshots)</text>

  <!-- Step 2: Magic Byte + SHA-256 -->
  <rect x="290" y="145" width="40" height="20" rx="4" fill="#334155"/>
  <text x="340" y="158" font-size="9.5" fill="#94a3b8">2. Verify magic bytes &amp; compute SHA-256</text>

  <!-- Step 3: PII Masking -->
  <line x1="310" y1="180" x2="495" y2="180" stroke="#f59e0b" stroke-width="1.5"/>
  <polygon points="490,176 500,180 490,184" fill="#f59e0b"/>
  <text x="330" y="174" font-size="10" font-weight="600" fill="#cbd5e1">3. Pass text to maskPII()</text>

  <!-- Step 4: Masked returned -->
  <line x1="495" y1="210" x2="310" y2="210" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 3"/>
  <polygon points="315,206 305,210 315,214" fill="#f59e0b"/>
  <text x="340" y="204" font-size="9.5" fill="#94a3b8">4. Return tokenized text (PERSON_1, PHONE_1)</text>

  <!-- Step 5: Proxy to ML -->
  <line x1="310" y1="240" x2="670" y2="240" stroke="#8b5cf6" stroke-width="1.5"/>
  <polygon points="665,236 675,240 665,244" fill="#8b5cf6"/>
  <text x="340" y="234" font-size="10" font-weight="600" fill="#cbd5e1">5. POST /predict (X-ML-Secret header)</text>

  <!-- Step 6: ML Classification -->
  <rect x="650" y="255" width="40" height="20" rx="4" fill="#334155"/>
  <text x="700" y="268" font-size="9.5" fill="#a78bfa">6. TF-IDF + Logistic Reg inference (&lt; 25ms)</text>

  <!-- Step 7: Classification result -->
  <line x1="670" y1="290" x2="310" y2="290" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="3 3"/>
  <polygon points="315,286 305,290 315,294" fill="#8b5cf6"/>
  <text x="340" y="284" font-size="9.5" fill="#a78bfa">7. Return { category, severity: CRITICAL, confidence: 0.94 }</text>

  <!-- Step 8: Save to Mongo -->
  <rect x="290" y="305" width="40" height="20" rx="4" fill="#334155"/>
  <text x="340" y="318" font-size="9.5" fill="#94a3b8">8. Write Complaint &amp; Chain of Custody to MongoDB</text>

  <!-- Step 9: Socket Alert to Officer -->
  <line x1="310" y1="340" x2="845" y2="340" stroke="#ef4444" stroke-width="1.5"/>
  <polygon points="840,336 850,340 840,344" fill="#ef4444"/>
  <text x="450" y="334" font-size="10" font-weight="700" fill="#ef4444">9. WSS Event: new_complaint_filed (Priority LEA Broadcast)</text>

  <!-- Step 10: Docket ID to Citizen -->
  <line x1="310" y1="375" x2="120" y2="375" stroke="#00d2b4" stroke-width="1.5"/>
  <polygon points="125,371 115,375 125,379" fill="#00d2b4"/>
  <text x="140" y="369" font-size="10" font-weight="600" fill="#00d2b4">10. 201 Created: Docket #CG-2026-10492 + Tracking Link</text>

  <!-- Step 11: Real-time Chat & Sec 65B Notice -->
  <line x1="845" y1="410" x2="120" y2="410" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4"/>
  <polygon points="125,406 115,410 125,414" fill="#38bdf8"/>
  <text x="320" y="404" font-size="10" font-weight="600" fill="#38bdf8">11. Officer assigns case, generates Sec 65B Certificate, initiates live chat</text>
</svg>
"""

# SVG Diagram 3: Suspect Relationship Link Analysis Graph
SVG_LINK_ANALYSIS = """
<svg viewBox="0 0 950 420" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <rect x="0" y="0" width="950" height="420" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
  
  <text x="40" y="35" font-size="14" font-weight="700" fill="#00d2b4">FORENSIC SUSPECT LINK-ANALYSIS & SYNDICATE CLUSTERING ENGINE</text>
  <text x="680" y="35" font-size="11" fill="#94a3b8">Automated Multi-Case Correlation</text>
  <line x1="40" y1="50" x2="910" y2="50" stroke="#334155" stroke-width="1"/>

  <!-- Edges -->
  <line x1="160" y1="120" x2="380" y2="120" stroke="#38bdf8" stroke-width="2"/>
  <line x1="160" y1="220" x2="380" y2="120" stroke="#38bdf8" stroke-width="2"/>
  <line x1="160" y1="220" x2="380" y2="280" stroke="#f59e0b" stroke-width="2"/>
  <line x1="160" y1="340" x2="380" y2="280" stroke="#f59e0b" stroke-width="2"/>
  <line x1="380" y1="120" x2="620" y2="200" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4 2"/>
  <line x1="380" y1="280" x2="620" y2="200" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4 2"/>
  <line x1="620" y1="200" x2="820" y2="200" stroke="#ef4444" stroke-width="3"/>

  <!-- Victim Nodes -->
  <g transform="translate(100, 100)">
    <circle cx="60" cy="20" r="28" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="35" y="24" font-size="10" font-weight="700" fill="#f8fafc">Victim A</text>
    <text x="25" y="60" font-size="9" fill="#94a3b8">Case #CG-101</text>
  </g>

  <g transform="translate(100, 200)">
    <circle cx="60" cy="20" r="28" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="35" y="24" font-size="10" font-weight="700" fill="#f8fafc">Victim B</text>
    <text x="25" y="60" font-size="9" fill="#94a3b8">Case #CG-102</text>
  </g>

  <g transform="translate(100, 320)">
    <circle cx="60" cy="20" r="28" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="35" y="24" font-size="10" font-weight="700" fill="#f8fafc">Victim C</text>
    <text x="25" y="60" font-size="9" fill="#94a3b8">Case #CG-103</text>
  </g>

  <!-- Entity Nodes -->
  <g transform="translate(320, 95)">
    <rect x="60" y="0" width="160" height="50" rx="8" fill="#1e293b" stroke="#00d2b4" stroke-width="2"/>
    <text x="75" y="22" font-size="10" font-weight="700" fill="#00d2b4">SUSPECT UPI VPA</text>
    <text x="75" y="38" font-size="9.5" fill="#f8fafc">loot.refund@okaxis</text>
  </g>

  <g transform="translate(320, 255)">
    <rect x="60" y="0" width="160" height="50" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <text x="75" y="22" font-size="10" font-weight="700" fill="#f59e0b">SUSPECT PHONE</text>
    <text x="75" y="38" font-size="9.5" fill="#f8fafc">+91 98450 12345</text>
  </g>

  <!-- Mule Bank Account Node -->
  <g transform="translate(560, 165)">
    <rect x="60" y="0" width="180" height="70" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2.5"/>
    <text x="75" y="24" font-size="11" font-weight="700" fill="#ef4444">BENEFICIARY MULE A/C</text>
    <text x="75" y="42" font-size="9.5" fill="#f8fafc">SBI A/C: 30981249581</text>
    <text x="75" y="58" font-size="9" fill="#94a3b8">IFSC: SBIN0001234</text>
  </g>

  <!-- Syndicate Identified Node -->
  <g transform="translate(760, 165)">
    <rect x="60" y="0" width="110" height="70" rx="8" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-width="2"/>
    <text x="75" y="28" font-size="11" font-weight="700" fill="#ef4444">SYNDICATE</text>
    <text x="75" y="44" font-size="10" font-weight="700" fill="#f8fafc">JAMTHARA-04</text>
    <text x="75" y="60" font-size="8.5" fill="#fca5a5">Automated Freeze</text>
  </g>
</svg>
"""

HTML_TEMPLATE = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CyberGuard AI — Master Architecture, Technical Specification & Engineering Compendium</title>
<style>
  @page {{
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.55;
    color: #1e293b;
    background-color: #ffffff;
    font-size: 13.5px;
    margin: 0;
    padding: 30px;
  }}
  
  /* Headings */
  h1.doc-title {{
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }}
  .doc-subtitle {{
    font-size: 14.5px;
    font-weight: 600;
    color: #0284c7;
    margin-bottom: 20px;
  }}
  h2 {{
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 36px;
    margin-bottom: 14px;
    page-break-after: avoid;
  }}
  h3 {{
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-top: 20px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }}
  h4 {{
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 6px;
  }}

  /* Metadata Card */
  .meta-card {{
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 28px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }}
  .meta-item {{
    font-size: 11px;
    color: #64748b;
  }}
  .meta-item strong {{
    display: block;
    font-size: 12.5px;
    color: #0f172a;
    margin-top: 2px;
  }}

  /* Callouts & Badges */
  .badge {{
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }}
  .badge-primary {{ background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }}
  .badge-critical {{ background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }}
  .badge-high {{ background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }}
  .badge-success {{ background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }}

  .callout {{
    background: #f1f5f9;
    border-left: 4px solid #0284c7;
    padding: 12px 16px;
    border-radius: 0 6px 6px 0;
    margin: 16px 0;
    font-size: 12.5px;
  }}
  .callout-title {{
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
    page-break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  /* Code & Monospace */
  code, pre {{
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 11.5px;
  }}
  code {{
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }}
  pre {{
    background: #0f172a;
    color: #f8fafc;
    padding: 14px 18px;
    border-radius: 8px;
    overflow-x: auto;
    line-height: 1.45;
    margin: 14px 0;
    page-break-inside: avoid;
  }}

  /* Diagram Wrapper */
  .diagram-container {{
    margin: 22px 0;
    background: #0f172a;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #334155;
    page-break-inside: avoid;
  }}
  .diagram-caption {{
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-align: center;
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}

  /* Math Block */
  .math-block {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    margin: 14px 0;
    text-align: center;
    font-family: "Cambria Math", "Times New Roman", serif;
    font-size: 14px;
    color: #0f172a;
  }}

  /* Lists */
  ul, ol {{
    margin: 8px 0 16px 24px;
    padding: 0;
  }}
  li {{
    margin-bottom: 4px;
  }}

  .footer-note {{
    margin-top: 40px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }}
</style>
</head>
<body>

  <!-- Cover Header -->
  <div style="border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px;">
    <span class="badge badge-primary" style="margin-bottom: 8px;">ACADEMIC &amp; LAW ENFORCEMENT TECHNICAL MANUAL</span>
    <h1 class="doc-title">CyberGuard AI — Master Architecture, Technical Specification &amp; Engineering Compendium</h1>
    <div class="doc-subtitle">Next-Generation AI-Driven Cybercrime Reporting, Forensic Intelligence &amp; Statutory Incident Management Platform</div>
    <div style="font-size: 12px; color: #475569;">
      <strong>Project Track:</strong> United Nations SDG 16 (Peace, Justice &amp; Strong Institutions) &bull;
      <strong>Platform Release:</strong> Version 3.0.0-PRO (Production Benchmark) &bull;
      <strong>System Host:</strong> macOS / Node.js 18+ / Python 3.11+ / MongoDB 7.0+
    </div>
  </div>

  <!-- Metadata Grid -->
  <div class="meta-card">
    <div class="meta-item">
      ENGINEERING LEAD:
      <strong>Pruthvi Shetty</strong>
    </div>
    <div class="meta-item">
      NLP CLASSIFIER ACCURACY:
      <strong>89.74% (Held-Out Test)</strong>
    </div>
    <div class="meta-item">
      INFERENCE LATENCY:
      <strong>&lt; 25 ms (Local / Sub-Second E2E)</strong>
    </div>
    <div class="meta-item">
      LEGAL STANDARDS:
      <strong>Sec 65B IEA / Sec 63 BSA / Sec 91 CrPC</strong>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="callout" style="background: #f8fafc; border-left: 4px solid #64748b;">
    <div class="callout-title">COMPENDIUM TABLE OF CONTENTS</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11.5px; color: #334155; margin-top: 6px;">
      <div>1. Executive Summary &amp; Core Value Proposition</div>
      <div>9. Real-Time WebSockets Engine (Socket.IO)</div>
      <div>2. High-Level Platform Architecture &amp; Diagrams</div>
      <div>10. Database Schema &amp; MongoDB Atlas Design</div>
      <div>3. Complete Codebase Directory &amp; File Structure</div>
      <div>11. Complete REST API Reference (Axios/Postman)</div>
      <div>4. Machine Learning Pipeline &amp; Data Science</div>
      <div>12. Frontend Web Application (React 18 Architecture)</div>
      <div>5. Zero-Trust Privacy Shield &amp; PII Masking Engine</div>
      <div>13. Mobile Application (React Native Expo SDK 54)</div>
      <div>6. Biometric Face ID &amp; Authentication Architecture</div>
      <div>14. Deployment Architecture &amp; Service Port Map</div>
      <div>7. Evidence Vault, OCR &amp; Statutory Legal Tooling</div>
      <div>15. Demo Walkthrough Script &amp; Examiner Q&amp;A Defense</div>
      <div>8. Threat Intelligence, Forensics &amp; Graph Analytics</div>
      <div>&nbsp;</div>
    </div>
  </div>

  <!-- SECTION 1 -->
  <h2>1. Executive Summary &amp; Core Value Proposition</h2>
  <p>
    <strong>CyberGuard AI</strong> is a production-grade, enterprise-scale cybercrime incident intake, forensic intelligence, and law enforcement case management platform. Built to fulfill <strong>United Nations Sustainable Development Goal 16 (Peace, Justice &amp; Strong Institutions)</strong>, CyberGuard solves the critical challenges facing modern cyber defense: reporting friction, delayed victim relief during the financial fraud "golden hour", data privacy violations, and the inadmissibility of unverified digital evidence in court.
  </p>
  <ul>
    <li><strong>Sub-Second NLP Categorization &amp; Statutory Prioritization:</strong> Classifies unstructured, emotionally fraught citizen incident narratives into <strong>13 standardized cybercrime classes</strong> with dynamic severity ratings (Critical, High, Medium, Low) in under 25 milliseconds locally (&lt; 1 second end-to-end).</li>
    <li><strong>Zero-Trust Multi-Tier Privacy Shield:</strong> Deterministically scrubs <strong>18 distinct PII categories</strong> (Aadhaar, PAN, phone numbers, bank accounts, UPI VPAs, credit cards, full names, locations) using tokenized masking (<code>PERSON_1</code>, <code>PHONE_1</code>) prior to machine learning inference or public community browsing.</li>
    <li><strong>Automated Statutory Legal Evidence Generation:</strong> Generates court-admissible electronic evidence certificates under <strong>Section 65B(4) of the Indian Evidence Act, 1872</strong> / <strong>Section 63(4) of the Bharatiya Sakshya Adhiniyam (BSA), 2023</strong>, <strong>Section 91 CrPC / Section 94 BNSS Bank Nodal Freeze Requisitions</strong> across 60+ verified Indian banks, and <strong>Telecom CDR Requisition Notices</strong>.</li>
    <li><strong>Biometric Face ID Multi-Factor Authentication:</strong> Employs client-side deep neural networks (SSD MobileNet v1 + 68 Landmarks + FaceRecognitionNet via <code>@vladmandic/face-api</code>) extracting <strong>128-dimensional facial vector descriptors</strong> verified on the server via Euclidean distance math (threshold: \(d &lt; 0.50\)).</li>
    <li><strong>Real-Time Cross-Platform Coordination:</strong> Delivers instant state synchronization across a <strong>React 18 Web App</strong>, an <strong>Expo SDK 54 React Native Mobile App</strong>, a <strong>Node.js Express API Gateway</strong>, a <strong>Python Flask ML Microservice</strong>, and a <strong>MongoDB Atlas Cluster</strong> via <strong>Socket.IO WebSockets</strong>.</li>
  </ul>

  <!-- SECTION 2 -->
  <h2>2. High-Level Platform Architecture &amp; System Topology</h2>
  <p>
    The platform employs a decoupled, multi-tier microservice architecture designed for zero-trust security and horizontal scalability. Browsers and mobile apps never communicate with internal ML models or database instances directly; all transactions pass through an authenticated API Gateway.
  </p>

  <div class="diagram-container">
    {SVG_ARCHITECTURE}
    <div class="diagram-caption">Figure 2.1: CyberGuard AI Microservice Architecture &amp; System Topology</div>
  </div>

  <div class="diagram-container">
    {SVG_SEQUENCE}
    <div class="diagram-caption">Figure 2.2: End-to-End Incident Ingestion, Triage, and Dispatch Sequence Flow</div>
  </div>

  <!-- SECTION 3 -->
  <h2>3. Complete Codebase Directory &amp; File Structure</h2>
  <p>The CyberGuard repository is organized into four modular subsystems:</p>
  <pre><code>cybercrime-system/
├── backend/                     # Node.js + Express REST API Gateway &amp; WebSocket Server (Port 5002)
│   ├── src/
│   │   ├── server.js            # Express app, HTTP listener, Socket.IO orchestration, graceful shutdown
│   │   ├── config/db.js         # Mongoose connection with MongoDB Atlas fallback
│   │   ├── controllers/         # adminController, analyticsController, authController, chatController, complaintController
│   │   ├── middleware/          # auth.js (JWT &amp; RBAC), errorHandler.js, rateLimiter.js
│   │   ├── models/              # Complaint.js, User.js, Message.js, GlobalMessage.js, Report.js, TokenBlacklist.js
│   │   ├── routes/              # admin.js, analytics.js, auth.js, chats.js, complaints.js, security.js, users.js
│   │   ├── services/            # breachService.js, emailAgentService.js, mlService.js, ocrService.js, smsService.js
│   │   └── utils/               # privacyShield.js (18 PII rules), section65bGenerator.js, bankNodalDirectory.js,
│   │                            # evidenceSecurity.js (Magic Bytes &amp; SHA-256), artifactForensics.js, syndicateConsolidator.js
│
├── ml-service/                  # Python Flask Machine Learning Microservice (Port 5003)
│   ├── src/
│   │   ├── app.py               # Flask app with HMAC X-ML-Secret verification and Flask-Limiter
│   │   ├── classifier.py        # CybercrimeClassifier inference class, severity mapping &amp; OOD guards
│   │   └── preprocessor.py      # TextPreprocessor regex normalizer and negation-preserving filter
│   ├── models/                  # classifier.pkl, vectorizer.pkl, model_meta.json
│   ├── data/                    # dataset.csv (1,950 records), dataset-manifest.json (130 scenario families)
│   ├── train_model.py           # Group-aware training pipeline (Families 0-7 Dev / Families 8-9 Test)
│   ├── evaluate_and_export.py   # Held-out evaluation and confusion matrix generator
│   └── evaluate_cv.py           # 5-fold GroupKFold cross-validation benchmark
│
├── web-app/                     # React 18 Single Page Application (Port 3000)
│   ├── src/
│   │   ├── components/          # Navbar, Footer, CyberReport (wizard), VoiceAssistant, DeveloperAccessScanner
│   │   │   └── onee/            # OneeGuide, avatar-runtime.js (3D procedural SVG avatar), avatar-spec.json
│   │   ├── pages/               # Home, Dashboard, ComplaintDetails, OfficerDashboard, AdminDashboard,
│   │   │                        # AdminLinkAnalysis (Graph), ForensicScanner, ScamSearch, LeakMonitor, PublicMap
│   │   ├── services/            # api.js (Axios client with JWT interceptor), socket.js (Socket.IO client)
│   │   └── hooks/               # useAuth.js, useSocket.js
│
└── mobile-app/                  # React Native Cross-Platform Application (Expo SDK 54 / Port 8081)
    └── src/
        ├── navigation/          # Native stack and bottom tab navigators
        ├── screens/             # HomeScreen, SubmitComplaintScreen, TrackScreen, ThreatRadarScreen, ScamSearchScreen
        └── services/            # api.js (Axios mobile client with secure token storage)</code></pre>

  <!-- SECTION 4 -->
  <h2>4. Machine Learning Pipeline &amp; Data Science Architecture</h2>

  <h3>4.1 Dataset Evolution &amp; Zero-Leakage Group-Aware Splitting</h3>
  <p>
    A critical flaw in standard NLP classification models is synthetic paraphrase leakage, where paraphrases of the same incident scenario appear in both train and test splits, artificially inflating reported test scores. CyberGuard overcomes this by introducing <strong>Version 3.0-group-aware</strong>:
  </p>
  <ul>
    <li><strong>Dataset Scaling:</strong> Evolved from an initial 257-record prototype (<code>v1_257.csv</code>) to a fully balanced <strong>1,950-record dataset</strong> (<code>v2_1950.csv</code>), standardized into <strong>130 Scenario Families</strong> (10 distinct narrative families per crime class).</li>
    <li><strong>Narrative Diversity:</strong> Comprises <strong>1,560 detailed narratives</strong> (mean: 28.22 words, range: 14–86 words) and <strong>390 concise inputs</strong> (mean: 15.07 words, range: 11–20 words).</li>
    <li><strong>Injected Noise Robustness:</strong> Injected <strong>98 realistic noisy citizen inputs</strong> featuring typos, phonetic spelling, SMS shorthand, and missing punctuation (e.g. <em>"sir money cut frm acnt via otp call plz help"</em>).</li>
    <li><strong>Group-Aware 80/20 Disjoint Splitting:</strong> Families 0 through 7 are reserved strictly for the Development/Train set (1,560 samples, 104 groups), while Families 8 and 9 form the untouched Held-Out Test set (390 samples, 26 groups). <strong>Group Leakage Overlap is strictly 0.0%</strong>.</li>
  </ul>

  <h3>4.2 The 13 Standardized Crime Classes &amp; Severity Matrix</h3>
  <table>
    <thead>
      <tr>
        <th>Class Identifier</th>
        <th>Canonical Display Name</th>
        <th>Severity Level</th>
        <th>Statutory Subcategory &amp; Primary Attack Vector</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>phishing</code></td><td>Phishing Attacks</td><td><span class="badge badge-high">HIGH</span></td><td>Email / SSO Phishing &amp; Spoofed URLs</td></tr>
      <tr><td><code>financial_fraud</code></td><td>Financial Fraud</td><td><span class="badge badge-critical">CRITICAL</span></td><td>UPI / Banking &amp; Credit Card Fraud</td></tr>
      <tr><td><code>identity_theft</code></td><td>Identity Theft</td><td><span class="badge badge-high">HIGH</span></td><td>Aadhaar / SIM Swap &amp; Impersonation</td></tr>
      <tr><td><code>cyberbullying</code></td><td>Cyberbullying &amp; Harassment</td><td><span class="badge badge-primary">MEDIUM</span></td><td>Online Harassment &amp; Doxxing</td></tr>
      <tr><td><code>hacking</code></td><td>System Hacking</td><td><span class="badge badge-critical">CRITICAL</span></td><td>Unauthorized Intrusion &amp; Account Takeover</td></tr>
      <tr><td><code>ransomware</code></td><td>Ransomware Extortion</td><td><span class="badge badge-critical">CRITICAL</span></td><td>Ransomware Extortion &amp; Malicious Encryption</td></tr>
      <tr><td><code>data_breach</code></td><td>Data Breach</td><td><span class="badge badge-critical">CRITICAL</span></td><td>Corporate Database Leak &amp; PII Exfiltration</td></tr>
      <tr><td><code>online_fraud</code></td><td>Online Scams</td><td><span class="badge badge-primary">MEDIUM</span></td><td>E-Commerce &amp; Marketplace Counterfeiting</td></tr>
      <tr><td><code>child_exploitation</code></td><td>Child Exploitation</td><td><span class="badge badge-critical">CRITICAL</span></td><td>CSAM &amp; Minor Protection</td></tr>
      <tr><td><code>women_child_safety</code></td><td>Women &amp; Child Safety</td><td><span class="badge badge-critical">CRITICAL</span></td><td>Emergency Distress &amp; Cyberstalking</td></tr>
      <tr><td><code>network_attacks</code></td><td>Network Attacks</td><td><span class="badge badge-high">HIGH</span></td><td>DDoS &amp; Infrastructure Flooding</td></tr>
      <tr><td><code>crypto_fraud</code></td><td>Cryptocurrency Fraud</td><td><span class="badge badge-high">HIGH</span></td><td>Web3 Wallet Drainers &amp; Token Scams</td></tr>
      <tr><td><code>other</code></td><td>General Inquiry</td><td><span class="badge badge-primary">LOW</span></td><td>General Questions &amp; Non-Actionable Reports</td></tr>
    </tbody>
  </table>

  <h3>4.3 Feature Engineering &amp; Model Hyperparameters</h3>
  <ul>
    <li><strong>TextPreprocessor (<code>preprocessor.py</code>):</strong> Normalizes URLs (<code>url_link</code>), emails (<code>email_addr</code>), 10-digit Indian phones (<code>phone_num</code>), and bank accounts (<code>bank_account</code>). Retains critical criminal negations (<code>no</code>, <code>not</code>, <code>never</code>, <code>against</code>) while filtering standard English stopwords.</li>
    <li><strong>TF-IDF Vectorizer (<code>vectorizer.pkl</code>):</strong> <code>ngram_range=(1, 2)</code>, <code>max_features=10000</code>, <code>sublinear_tf=True</code> (applies \(1 + \log(\text{tf})\)), <code>strip_accents='unicode'</code>, <code>min_df=1</code>.</li>
    <li><strong>Logistic Regression (<code>classifier.pkl</code>):</strong> Multinomial <code>solver='lbfgs'</code>, <code>C=2.0</code>, <code>class_weight='balanced'</code>, <code>max_iter=2000</code>, <code>random_state=42</code>.</li>
  </ul>

  <h3>4.4 Benchmark Evaluation Metrics (Held-Out Test Set: 390 Samples)</h3>
  <table>
    <thead>
      <tr>
        <th>Evaluation Metric</th>
        <th>Held-Out Overall (390)</th>
        <th>Clean Subset (351)</th>
        <th>Noisy Citizen Subset (39)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>Accuracy</strong></td><td><strong>89.74%</strong></td><td>89.66%</td><td><strong>92.31%</strong></td></tr>
      <tr><td><strong>Macro Precision</strong></td><td><strong>91.06%</strong></td><td>91.02%</td><td>93.50%</td></tr>
      <tr><td><strong>Macro Recall</strong></td><td><strong>89.74%</strong></td><td>89.66%</td><td>92.31%</td></tr>
      <tr><td><strong>Macro F1-Score</strong></td><td><strong>89.75%</strong></td><td>89.66%</td><td><strong>94.05%</strong></td></tr>
      <tr><td><strong>Weighted F1-Score</strong></td><td><strong>89.75%</strong></td><td>89.67%</td><td>94.10%</td></tr>
      <tr><td><strong>Inference Latency</strong></td><td><strong>&lt; 25 ms</strong></td><td>&lt; 25 ms</td><td>&lt; 25 ms</td></tr>
    </tbody>
  </table>

  <h3>4.5 Out-Of-Distribution (OOD) Rejection &amp; Safety Guards</h3>
  <p>To prevent arbitrary or hallucinated classifications on nonsense, adversarial, or out-of-domain text:</p>
  <ol>
    <li><strong>Input Token Guard:</strong> Inputs with fewer than 3 meaningful tokens automatically yield <code>uncertain: true</code>, category <code>other</code>, severity <code>LOW</code>.</li>
    <li><strong>Confidence Thresholding:</strong> If maximum class probability is below <strong>0.20</strong> (<code>CONFIDENCE_THRESHOLD</code>), the inference returns <code>uncertain: true</code>, flags <code>review_recommended: true</code>, and routes to human police triage.</li>
  </ol>

  <!-- SECTION 5 -->
  <h2>5. Zero-Trust Privacy Shield &amp; PII Masking Engine</h2>
  <p>
    Located in <code>backend/src/utils/privacyShield.js</code>, the Privacy Shield scans raw text and deterministically replaces Personally Identifiable Information with structured tokens (e.g. <code>PERSON_1</code>, <code>PHONE_1</code>, <code>AADHAAR_1</code>). The masking is completely decoupled from database persistence, ensuring the original filing is safely preserved for law enforcement while external AI services and community feeds receive only sanitized text.
  </p>

  <div class="diagram-container">
    {SVG_LINK_ANALYSIS}
    <div class="diagram-caption">Figure 5.1: Multi-Complaint Suspect Link Analysis &amp; Syndicate Consolidation</div>
  </div>

  <h3>5.1 The 18 Regex-Based PII Categories</h3>
  <table>
    <thead>
      <tr>
        <th>Priority</th>
        <th>PII Category</th>
        <th>Regex Pattern / Matching Strategy</th>
        <th>Sample Masked Token</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>URL</td><td><code>https?://\S+|www\.\S+</code></td><td><code>URL_1</code></td></tr>
      <tr><td>1b</td><td>UPI_ID</td><td><code>[a-zA-Z0-9.\-_]{{2,256}}@[a-zA-Z]{{2,64}}</code></td><td><code>UPI_ID_1</code></td></tr>
      <tr><td>2</td><td>EMAIL</td><td><code>[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{{2,}}</code></td><td><code>EMAIL_1</code></td></tr>
      <tr><td>3</td><td>IPV6</td><td>8-block hex or compressed <code>::</code> format</td><td><code>IPV6_1</code></td></tr>
      <tr><td>4</td><td>IPV4</td><td>Standard 4-octet dot-decimal IP range</td><td><code>IPV4_1</code></td></tr>
      <tr><td>5</td><td>CREDIT_CARD</td><td>13–19 digit card numbers (Luhn candidate regex)</td><td><code>CREDIT_CARD_1</code></td></tr>
      <tr><td>6</td><td>BANK_ACCOUNT</td><td>9–18 digit account numbers with context keywords</td><td><code>BANK_ACCOUNT_1</code></td></tr>
      <tr><td>7</td><td>DRIVING_LICENSE</td><td>Indian DL format (e.g. <code>KA0120230001234</code>)</td><td><code>DRIVING_LICENSE_1</code></td></tr>
      <tr><td>8</td><td>PASSPORT</td><td>Indian passport format (1 letter + 7 digits)</td><td><code>PASSPORT_1</code></td></tr>
      <tr><td>9</td><td>AADHAAR</td><td>12-digit UIDAI numbers starting with 2–9</td><td><code>AADHAAR_1</code></td></tr>
      <tr><td>10</td><td>PAN</td><td>Indian Income Tax PAN (<code>[A-Z]{{5}}[0-9]{{4}}[A-Z]</code>)</td><td><code>PAN_1</code></td></tr>
      <tr><td>11</td><td>IFSC</td><td>11-character Indian financial code (<code>[A-Z]{{4}}0[A-Z0-9]{{6}}</code>)</td><td><code>IFSC_1</code></td></tr>
      <tr><td>12</td><td>PHONE</td><td>Indian 10-digit mobile (+91/0 prefix, 3+3+4, 5+5)</td><td><code>PHONE_1</code></td></tr>
      <tr><td>13</td><td>PERSON</td><td>Context-introduced names (<em>"My name is...", Complainant:</em>)</td><td><code>PERSON_1</code></td></tr>
      <tr><td>14</td><td>ORGANIZATION</td><td>Title-cased words + legal suffixes (Ltd, Pvt, Corp, Bank)</td><td><code>ORGANIZATION_1</code></td></tr>
      <tr><td>15</td><td>ADDRESS</td><td>Door/flat/street/colony/nagar lines</td><td><code>ADDRESS_1</code></td></tr>
      <tr><td>16</td><td>PINCODE</td><td>Indian 6-digit postal codes (<code>[1-9][0-9]{{5}}</code>)</td><td><code>PINCODE_1</code></td></tr>
      <tr><td>17</td><td>SOCIAL_HANDLE</td><td>@username and Telegram/Instagram tags</td><td><code>SOCIAL_HANDLE_1</code></td></tr>
      <tr><td>18</td><td>CITY</td><td>Closed gazetteer of Indian &amp; global metro cities</td><td><code>CITY_1</code></td></tr>
    </tbody>
  </table>

  <h3>5.2 Multi-Tier Role-Based Visibility Matrix</h3>
  <table>
    <thead>
      <tr>
        <th>Viewer Role / Context</th>
        <th>Narrative &amp; Title</th>
        <th>Suspect Details</th>
        <th>Complainant PII</th>
        <th>Chain of Custody</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>Complainant (Owner)</strong></td><td>Raw / Unmasked</td><td>Full Visibility</td><td>Full Visibility</td><td>Visible</td></tr>
      <tr><td><strong>Investigating Officer</strong></td><td>Raw / Unmasked</td><td>Full Visibility</td><td>Full Visibility</td><td>Full Forensic Ledger</td></tr>
      <tr><td><strong>Super Admin</strong></td><td>Raw / Unmasked</td><td>Full Visibility</td><td>Full Visibility</td><td>Full Forensic Ledger</td></tr>
      <tr><td><strong>Community Browser</strong></td><td><strong>Strictly Masked</strong></td><td>Redacted</td><td>Redacted</td><td>Hidden</td></tr>
      <tr><td><strong>Unauthenticated Guest</strong></td><td>Aggregated Stats</td><td>Hidden</td><td>Hidden</td><td>Hidden</td></tr>
    </tbody>
  </table>

  <!-- SECTION 6 -->
  <h2>6. Biometric Face ID &amp; Authentication Architecture</h2>

  <h3>6.1 Client-Side Neural Network Pipeline (<code>@vladmandic/face-api</code>)</h3>
  <p>
    CyberGuard implements client-side biometric authentication for privileged administrative and developer console operations. Using <code>@vladmandic/face-api</code>, the browser loads pre-trained neural models locally:
  </p>
  <ol>
    <li><code>ssdMobilenetv1</code>: Detects faces in live webcam video frames.</li>
    <li><code>faceLandmark68Net</code>: Identifies 68 facial landmarks (eyes, nose, jawline, lips).</li>
    <li><code>faceRecognitionNet</code>: Extracts a <strong>128-dimensional floating point vector embedding</strong> representing unique facial geometry.</li>
  </ol>

  <h3>6.2 Server-Side Verification Mathematics (<code>authController.js</code>)</h3>
  <p>
    During biometric enrollment (<code>POST /api/auth/enroll-face</code>), the 128D array is stored securely in the user's MongoDB record (<code>select: false</code>). During verification (<code>POST /api/auth/verify-face</code>), the server computes the <strong>Euclidean Distance (\(L_2\) Norm\)</strong> between enrolled descriptor \(\mathbf{p}\) and live scan \(\mathbf{q}\):
  </p>

  <div class="math-block">
    \[ d(\mathbf{p}, \mathbf{q}) = \sqrt{ \sum_{{i=1}}^{{128}} (p_i - q_i)^2 } \]
  </div>

  <div class="callout">
    <div class="callout-title">Decision Threshold</div>
    If \(d(\mathbf{p}, \mathbf{q}) &lt; 0.50\), biometric identity is verified (\(200\text{ OK}\)). If \(d \ge 0.50\), access is rejected (\(401\text{ Unauthorized}\)).
  </div>

  <!-- SECTION 7 -->
  <h2>7. Evidence Vault, OCR &amp; Statutory Legal Tooling</h2>

  <h3>7.1 Binary Magic-Byte Inspection (<code>evidenceSecurity.js</code>)</h3>
  <p>To eliminate malware masquerading as harmless images (e.g. <code>trojan.exe</code> renamed to <code>screenshot.png</code>), the Multer ingestion pipeline checks the initial 12 bytes of every file buffer against true magic signatures:</p>
  <table>
    <thead>
      <tr><th>MIME Type</th><th>Extension</th><th>Magic Byte Signature (Hexadecimal)</th></tr>
    </thead>
    <tbody>
      <tr><td><code>image/jpeg</code></td><td><code>.jpg, .jpeg</code></td><td><code>FF D8 FF</code></td></tr>
      <tr><td><code>image/png</code></td><td><code>.png</code></td><td><code>89 50 4E 47 0D 0A 1A 0A</code></td></tr>
      <tr><td><code>image/gif</code></td><td><code>.gif</code></td><td><code>47 49 46 38 (GIF87a / GIF89a)</code></td></tr>
      <tr><td><code>image/webp</code></td><td><code>.webp</code></td><td><code>RIFF....WEBP</code> (Offset 0: <code>52 49 46 46</code>, Offset 8: <code>57 45 42 50</code>)</td></tr>
      <tr><td><code>application/pdf</code></td><td><code>.pdf</code></td><td><code>25 50 44 46 (%PDF)</code></td></tr>
      <tr><td><code>video/mp4</code></td><td><code>.mp4</code></td><td><code>66 74 79 70 (ftyp)</code> at offset 4</td></tr>
    </tbody>
  </table>

  <h3>7.2 Tesseract.js Financial Indicator Extraction (<code>ocrService.js</code>)</h3>
  <p>Uploaded screenshots of bank debits, WhatsApp chats, or payment confirmations are parsed to automatically extract:</p>
  <ul>
    <li><strong>12-digit NPCI Transaction UTRs / RRNs:</strong> <code>/(?:UPI Ref|UTR|RRN|Txn ID)[:\s#]*([A-Za-z0-9]{{10,22}})/i</code></li>
    <li><strong>UPI Virtual Payment Addresses:</strong> <code>/[a-zA-Z0-9.\-_]{{2,256}}@[a-zA-Z]{{2,64}}/</code></li>
    <li><strong>Indian Phone Numbers:</strong> <code>/(?:\+91|0)?[6-9]\d{{9}}/</code></li>
    <li><strong>Digital Forgery Alerts:</strong> Mismatched fonts, altered pixel canvas dimensions, or missing payment gateway watermarks.</li>
  </ul>

  <h3>7.3 Statutory Legal Generators</h3>
  <ul>
    <li><strong>Section 65B(4) IEA / Section 63(4) BSA Electronic Evidence Certificate (<code>section65bGenerator.js</code>):</strong> Generates an official court-ready certificate certifying digital evidence authenticity, specifying device make/model, OS version, lawful custody statement, and exhibit schedule with SHA-256 hashes.</li>
    <li><strong>Section 91 CrPC / Section 94 BNSS Bank Nodal Freeze Requisition (<code>bankNodalDirectory.js</code>):</strong> Queries an embedded directory of 60+ verified Indian commercial banks (SBI, HDFC, ICICI, Razorpay, PhonePe) and drafts immediate debit-freeze notices.</li>
    <li><strong>Telecom CDR / SDR / IPDR Requisition Notice (<code>telecomRequisition.js</code>):</strong> Formulates statutory notices commanding telecom operators (Airtel, Jio, Vi, BSNL) to preserve Call Detail Records and Subscriber Detail Records.</li>
  </ul>

  <!-- SECTION 8 -->
  <h2>8. Threat Intelligence, Forensics &amp; Graph Analytics</h2>
  <ul>
    <li><strong>Suspect Relationship Link Analysis (<code>AdminLinkAnalysis.js</code>):</strong> Clusters distinct citizen complaints sharing identical UPI VPAs, phone numbers, or bank accounts to expose multi-state fraud rings.</li>
    <li><strong>Scam Search Engine (<code>ScamSearch.js</code>):</strong> Allows instant public verification of suspicious phone numbers, UPI IDs, or domains against verified threat feeds.</li>
    <li><strong>Evidence Quarantine Sandbox (<code>artifactForensics.js</code>):</strong> Computes Shannon Entropy (\(H = -\sum p_i \log_2 p_i\)) to detect encrypted/packed malware binaries and scans Android APK manifests for excessive permissions.</li>
    <li><strong>Zero-Knowledge Breach Surveillance (<code>breachService.js</code>):</strong> Implements k-anonymity SHA-1 prefix matching against breach databases without disclosing victim credentials.</li>
  </ul>

  <!-- SECTION 9 -->
  <h2>9. Real-Time WebSockets Engine (Socket.IO)</h2>
  <table>
    <thead>
      <tr>
        <th>Event Name</th>
        <th>Direction</th>
        <th>Payload Schema</th>
        <th>System Responsibility</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>join_complaint_room</code></td><td>Client &rarr; Server</td><td><code>{{ complaintId }}</code></td><td>Subscribes client socket to private case channel</td></tr>
      <tr><td><code>new_message</code></td><td>Client &rarr; Server</td><td><code>{{ complaintId, message, senderId }}</code></td><td>Transmits chat message between officer and victim</td></tr>
      <tr><td><code>receive_message</code></td><td>Server &rarr; Client</td><td><code>{{ complaintId, message, createdAt }}</code></td><td>Renders chat bubble in real time on active views</td></tr>
      <tr><td><code>new_complaint_filed</code></td><td>Server &rarr; Client</td><td><code>{{ complaintId, category, severity }}</code></td><td>Broadcasts priority audio-visual alert to LEA dashboards</td></tr>
      <tr><td><code>complaint_status_changed</code></td><td>Server &rarr; Client</td><td><code>{{ complaintId, newStatus, updatedAt }}</code></td><td>Synchronizes case timeline across all active clients</td></tr>
    </tbody>
  </table>

  <!-- SECTION 10 -->
  <h2>10. Database Schema &amp; MongoDB Atlas Design</h2>
  <pre><code>// Primary Complaint Schema (backend/src/models/Complaint.js)
const ComplaintSchema = new mongoose.Schema({{
  complaintId:      {{ type: String, unique: true, index: true }}, // e.g. "CG-2026-10492"
  userId:           {{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }},
  title:            {{ type: String, required: true, trim: true }},
  description:      {{ type: String, required: true }},
  category:         {{ type: String, required: true, enum: CATEGORIES }},
  subcategory:      {{ type: String }},
  severity:         {{ type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' }},
  status:           {{ type: String, enum: ['Submitted', 'Pending_Review', 'Under_Review', 'Investigating', 'Resolved', 'Rejected'], default: 'Submitted' }},
  assignedTo:       {{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }},
  location: {{
    state:          {{ type: String }},
    city:           {{ type: String }},
    pincode:        {{ type: String }},
    coordinates:    {{ type: [Number], index: '2dsphere' }} // [longitude, latitude]
  }},
  evidence: [{{
    filename:       {{ type: String }},
    originalName:   {{ type: String }},
    mimeType:       {{ type: String }},
    size:           {{ type: Number }},
    sha256:         {{ type: String }}, // Immutable cryptographic digest
    uploadedAt:     {{ type: Date, default: Date.now }}
  }}],
  chainOfCustody: [{{
    action:         {{ type: String }},
    performedBy:    {{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }},
    role:           {{ type: String }},
    targetFile:     {{ type: String }},
    sha256:         {{ type: String }},
    notes:          {{ type: String }},
    timestamp:      {{ type: Date, default: Date.now }}
  }}],
  affidavits65B:    [{{ certificateNumber: String, sha256Digest: String, generatedAt: Date }}],
  telecomNotices:   [{{ noticeNumber: String, targetPhone: String, sha256Digest: String }}]
}}, {{ timestamps: true }});</code></pre>

  <!-- SECTION 11 -->
  <h2>11. Complete REST API Reference (Axios &amp; Postman)</h2>
  <table>
    <thead>
      <tr>
        <th>Method &amp; Path</th>
        <th>Auth Level</th>
        <th>Request Body Summary</th>
        <th>Response Payload / Action</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>POST /api/auth/register</code></td><td>Public</td><td><code>{{ name, email, password, phone }}</code></td><td>201 Created &bull; JWT access &amp; refresh tokens</td></tr>
      <tr><td><code>POST /api/auth/login</code></td><td>Public</td><td><code>{{ email, password }}</code></td><td>200 OK &bull; User profile &amp; JWT tokens</td></tr>
      <tr><td><code>POST /api/auth/enroll-face</code></td><td>JWT (Admin)</td><td><code>{{ descriptor: [128 floats] }}</code></td><td>200 OK &bull; Biometric descriptor persisted</td></tr>
      <tr><td><code>POST /api/auth/verify-face</code></td><td>JWT</td><td><code>{{ descriptor: [128 floats] }}</code></td><td>200 OK &bull; Euclidean distance verification</td></tr>
      <tr><td><code>POST /api/complaints</code></td><td>JWT</td><td>Multipart: fields + evidence files</td><td>201 Created &bull; Auto-masked, classified, docket assigned</td></tr>
      <tr><td><code>GET /api/complaints</code></td><td>JWT / Optional</td><td>Query params (scope, status, category)</td><td>200 OK &bull; List masked according to viewer RBAC</td></tr>
      <tr><td><code>GET /api/complaints/:id</code></td><td>JWT</td><td>URL param: complaintId or _id</td><td>200 OK &bull; Single case record + chain of custody</td></tr>
      <tr><td><code>PATCH /api/complaints/:id/status</code></td><td>Officer / Admin</td><td><code>{{ status, notes }}</code></td><td>200 OK &bull; Status updated, WSS event triggered</td></tr>
      <tr><td><code>POST /api/complaints/:id/affidavit-65b</code></td><td>Officer / Admin</td><td><code>{{ deponentName, deviceDetails }}</code></td><td>200 OK &bull; Generated Sec 65B/BSA affidavit draft</td></tr>
      <tr><td><code>POST /api/security/breach-check</code></td><td>Public</td><td><code>{{ email }}</code></td><td>200 OK &bull; Zero-knowledge credential breach audit</td></tr>
      <tr><td><code>GET /api/security/nodal-directory</code></td><td>Public / LEA</td><td><code>?q=bank_name&amp;category=bank</code></td><td>200 OK &bull; Verified nodal officer emails &amp; phone</td></tr>
      <tr><td><code>POST /api/security/detonate-artifact</code></td><td>JWT / Optional</td><td><code>{{ content, filename, mimeType }}</code></td><td>200 OK &bull; Shannon entropy &amp; heuristic malware score</td></tr>
      <tr><td><code>GET /api/analytics/overview</code></td><td>Officer / Admin</td><td>None</td><td>200 OK &bull; Case resolution metrics, triage SLA</td></tr>
      <tr><td><code>GET /api/complaints/public/radar</code></td><td>Public</td><td>None</td><td>200 OK &bull; Anonymized geospatial fraud hotspots</td></tr>
    </tbody>
  </table>

  <!-- SECTION 12 & 13 -->
  <h2>12. Frontend &amp; Mobile Client Architecture</h2>
  <ul>
    <li><strong>React 18 Web App:</strong> Implements CyberGuard's strict styling system (graphite/slate backgrounds, teal accents, IBM Plex typography). Framer Motion coordinates route transitions. Features <strong>Onee</strong> (<code>OneeGuide.js</code>, <code>avatar-runtime.js</code>), a procedural SVG 3D animated avatar that provides step-by-step assistance during complaint submission.</li>
    <li><strong>React Native Mobile App (Expo SDK 54):</strong> Built with React Navigation (Native Stack + Bottom Tabs) and Axios. Provides on-the-go reporting, quick 1930 emergency calling, live threat radar, and offline draft storage.</li>
  </ul>

  <!-- SECTION 14 -->
  <h2>14. Deployment Architecture &amp; Service Port Map</h2>
  <table>
    <thead>
      <tr>
        <th>Service Name</th>
        <th>Local Port</th>
        <th>Environment / Technology</th>
        <th>Production Endpoint / Render Service</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>MongoDB</strong></td><td><code>27017</code></td><td>MongoDB 7.0 Community / Atlas</td><td><code>mongodb+srv://cluster.mongodb.net/cybercrime_db</code></td></tr>
      <tr><td><strong>Python ML Service</strong></td><td><code>5003</code></td><td>Python 3.11 / Flask / Gunicorn</td><td><code>https://cybercrime-ml-service-buzn.onrender.com</code></td></tr>
      <tr><td><strong>Node.js Backend</strong></td><td><code>5002</code></td><td>Node.js 18+ / Express / Socket.IO</td><td><code>https://cybercrime-backend-buzn.onrender.com/api</code></td></tr>
      <tr><td><strong>React Web App</strong></td><td><code>3000</code></td><td>React 18 / Craco / Static Site</td><td><code>https://cybercrime-web-buzn.onrender.com</code></td></tr>
      <tr><td><strong>Mobile App (Expo)</strong></td><td><code>8081</code></td><td>React Native / Metro Bundler</td><td>Expo Go Dev Client / Standalone APK</td></tr>
    </tbody>
  </table>

  <!-- SECTION 15 -->
  <h2>15. Demo Walkthrough Script &amp; Examiner Q&amp;A Defense</h2>

  <div class="callout">
    <div class="callout-title">Q1: How do you mathematically guarantee that your ML model did not overfit on synthetic training data?</div>
    <p>
      <em>Answer:</em> We adopted a Group-Aware 80/20 train/test partition based on 130 scenario families. Families 0–7 formed the development split, while Families 8–9 were strictly held out. This ensures <strong>0.0% group leakage</strong>: the model was evaluated exclusively on narrative structures it had never encountered during training. Furthermore, testing against an injected realistic citizen noise subset (typos, phonetic spelling, SMS shorthand) yielded <strong>92.31% accuracy</strong>, demonstrating authentic real-world generalization.
    </p>
  </div>

  <div class="callout">
    <div class="callout-title">Q2: Why use TF-IDF and Logistic Regression rather than a large Transformer model like BERT or an LLM?</div>
    <p>
      <em>Answer:</em> In emergency cybercrime intake, inference latency, cost, and reliability are paramount. TF-IDF with sublinear scaling combined with L-BFGS Logistic Regression achieves <strong>89.74% accuracy</strong> in <strong>under 25 milliseconds</strong> on lightweight CPU hardware, with zero external cloud API dependencies. This guarantees uninterrupted operation even during major cyber disasters or network outages.
    </p>
  </div>

  <div class="callout">
    <div class="callout-title">Q3: How does CyberGuard satisfy the legal standards for electronic evidence in Indian courts?</div>
    <p>
      <em>Answer:</em> Electronic evidence is admissible only if accompanied by a certificate under Section 65B(4) of the Indian Evidence Act / Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023. CyberGuard automates this compliance by verifying binary magic bytes, generating immutable SHA-256 cryptographic hashes upon upload, recording all access in a tamper-evident Chain of Custody ledger, and generating structured Section 65B affidavits and Section 91 CrPC bank freeze notices.
    </p>
  </div>

  <div class="footer-note">
    <span>CYBERGUARD AI &bull; MASTER TECHNICAL SPECIFICATION</span>
    <span>CONFIDENTIAL &amp; PROPRIETARY &bull; LAW ENFORCEMENT REFERENCE</span>
  </div>

</body>
</html>
"""

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(HTML_TEMPLATE)

print(f"Successfully generated master HTML at: {OUTPUT_HTML} ({len(HTML_TEMPLATE)} bytes)")
