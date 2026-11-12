import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
from docx2pdf import convert

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_project_report():
    doc = Document()
    
    # Page setup - 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
        # Add page numbering to footer
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("CyberGuard Project Report | Page ")
        f_run.font.name = "Times New Roman"
        f_run.font.size = Pt(9)
        f_run.font.color.rgb = RGBColor(108, 117, 125)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11.5)
    normal_style.font.color.rgb = RGBColor(30, 41, 59) # Slate-800
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # TITLE PAGE
    # -------------------------------------------------------------
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("SHRI MADHWA VADIRAJA INSTITUTE OF TECHNOLOGY AND MANAGEMENT\n(A Unit of Shri Sode Vadiraja Mutt Education Trust, Udupi)\nVishwaothama Nagar, Bantakal - 574 115, Udupi District, Karnataka, India\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n")
    r_inst.font.name = 'Times New Roman'
    r_inst.font.size = Pt(11)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(27, 54, 93) # Navy

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_div = p_div.add_run("—" * 45)
    r_div.font.color.rgb = RGBColor(43, 122, 120)

    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_before = Pt(36)
    p_proj.paragraph_format.space_after = Pt(18)
    r_proj = p_proj.add_run("CYBERGUARD: PRIVACY-AWARE CYBERCRIME REPORTING, FORENSIC INTELLIGENCE, AND AUTOMATED COMPLAINT CLASSIFICATION SYSTEM")
    r_proj.font.name = 'Times New Roman'
    r_proj.font.size = Pt(18)
    r_proj.font.bold = True
    r_proj.font.color.rgb = RGBColor(27, 54, 93)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("A Project Report submitted in partial fulfillment of the requirements for the award of the degree of\nBachelor of Engineering in Computer Science and Engineering")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True

    # Authors & Guide Table
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(36)

    t_meta = doc.add_table(rows=1, cols=2)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_meta.autofit = False
    t_meta.columns[0].width = Inches(3.2)
    t_meta.columns[1].width = Inches(3.2)

    c0 = t_meta.rows[0].cells[0]
    p_c0 = c0.paragraphs[0]
    p_c0.add_run("Submitted by:\n").bold = True
    p_c0.add_run("Mohith Raj K Kotian (4MW23CS076)\n"
                 "Nikhil G Shetty (4MW23CS082)\n"
                 "Pradyumna Shettigar (4MW23CS093)\n"
                 "Pruthvi Shetty (4MW23CS108)\n")
    p_c0.runs[0].font.name = 'Times New Roman'
    p_c0.runs[0].font.size = Pt(11)

    c1 = t_meta.rows[0].cells[1]
    p_c1 = c1.paragraphs[0]
    p_c1.add_run("Under the Guidance of:\n").bold = True
    p_c1.add_run("Dr. Sadananda L\n"
                 "Associate Professor & Head\n"
                 "Department of Computer Science & Engg.\n"
                 "SMVITM, Bantakal\n")
    p_c1.runs[0].font.name = 'Times New Roman'
    p_c1.runs[0].font.size = Pt(11)

    p_year = doc.add_paragraph()
    p_year.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_year.paragraph_format.space_before = Pt(72)
    r_yr = p_year.add_run("ACADEMIC YEAR 2025–2026")
    r_yr.font.name = 'Times New Roman'
    r_yr.font.size = Pt(12)
    r_yr.font.bold = True
    r_yr.font.color.rgb = RGBColor(27, 54, 93)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CERTIFICATE & DECLARATION
    # -------------------------------------------------------------
    h_cert = doc.add_heading(level=1)
    r_hc = h_cert.add_run("CERTIFICATE")
    r_hc.font.name = 'Times New Roman'
    r_hc.font.size = Pt(16)
    r_hc.font.bold = True
    r_hc.font.color.rgb = RGBColor(27, 54, 93)

    p_cert = doc.add_paragraph(
        "Certified that the project work entitled \"CYBERGUARD: PRIVACY-AWARE CYBERCRIME REPORTING, "
        "FORENSIC INTELLIGENCE, AND AUTOMATED COMPLAINT CLASSIFICATION SYSTEM\" is a bona fide work carried out by "
        "Mohith Raj K Kotian (4MW23CS076), Nikhil G Shetty (4MW23CS082), Pradyumna Shettigar (4MW23CS093), and "
        "Pruthvi Shetty (4MW23CS108), students of Shri Madhwa Vadiraja Institute of Technology and Management, Bantakal, "
        "in partial fulfillment for the award of Bachelor of Engineering in Computer Science and Engineering under "
        "Visvesvaraya Technological University, Belagavi during the academic year 2025–2026. It is certified that all "
        "corrections and suggestions indicated during internal reviews have been incorporated into this report."
    )
    p_cert.paragraph_format.line_spacing = 1.25

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(72)
    t_sig = doc.add_table(rows=1, cols=3)
    t_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sig.columns[0].width = Inches(2.1)
    t_sig.columns[1].width = Inches(2.1)
    t_sig.columns[2].width = Inches(2.1)
    
    t_sig.rows[0].cells[0].paragraphs[0].add_run("Dr. Sadananda L\nGuide & HOD, Dept. of CSE").bold = True
    t_sig.rows[0].cells[1].paragraphs[0].add_run("Dr. Sadananda L\nHead of the Department").bold = True
    t_sig.rows[0].cells[2].paragraphs[0].add_run("Dr. Thirumaleshwara Bhat\nPrincipal, SMVITM").bold = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # TABLE OF CONTENTS
    # -------------------------------------------------------------
    h_toc = doc.add_heading(level=1)
    r_ht = h_toc.add_run("TABLE OF CONTENTS")
    r_ht.font.name = 'Times New Roman'
    r_ht.font.size = Pt(16)
    r_ht.font.bold = True
    r_ht.font.color.rgb = RGBColor(27, 54, 93)

    toc_items = [
        ("Abstract & Executive Summary", "iv"),
        ("List of Figures", "v"),
        ("List of Tables", "vi"),
        ("Chapter 1: Introduction and Research Motivation", "1"),
        ("Chapter 2: Literature Review and Related Work", "4"),
        ("Chapter 3: Problem Definition, Scope, and Objectives", "7"),
        ("Chapter 4: Existing Systems vs. Proposed CyberGuard Architecture", "10"),
        ("Chapter 5: Software Requirements Specification (SRS)", "13"),
        ("Chapter 6: System Architecture and Detailed Design", "16"),
        ("Chapter 7: Technology Stack and Module Implementation", "21"),
        ("Chapter 8: Database Design and Mongoose Document Schemas", "26"),
        ("Chapter 9: Machine Learning Methodology & Mathematical Formulation", "30"),
        ("Chapter 10: Dataset Engineering, Scenario Families & Label Taxonomy", "35"),
        ("Chapter 11: Experimental Benchmarking, Evaluation & Model Verification", "40"),
        ("Chapter 12: PrivacyShield Dual-Path Sanitization Architecture", "46"),
        ("Chapter 13: Multi-Modal Forensic OCR & Statutory Automation", "50"),
        ("Chapter 14: Security Architecture, Threat Modeling & Access Control", "54"),
        ("Chapter 15: Limitations, Boundary Conditions & Ethical Considerations", "58"),
        ("Chapter 16: Prioritized Future Work and Engineering Roadmap", "62"),
        ("Chapter 17: Conclusion", "65"),
        ("References", "67"),
        ("Appendix A: Comprehensive API Endpoint Specifications", "71"),
        ("Appendix B: Mathematical Derivations of ML Formulations", "74"),
        ("Appendix C: Canonical v3 Dataset Manifest & Metadata", "77"),
    ]

    t_toc = doc.add_table(rows=len(toc_items), cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_toc.columns[0].width = Inches(5.5)
    t_toc.columns[1].width = Inches(1.0)
    for idx, (title, page) in enumerate(toc_items):
        r = t_toc.rows[idx]
        r.cells[0].paragraphs[0].add_run(title).font.size = Pt(10.5)
        p_p = r.cells[1].paragraphs[0]
        p_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_p.add_run(page).font.size = Pt(10.5)

    doc.add_page_break()

    # -------------------------------------------------------------
    # LIST OF FIGURES & TABLES
    # -------------------------------------------------------------
    h_lof = doc.add_heading(level=1)
    r_hlf = h_lof.add_run("LIST OF FIGURES")
    r_hlf.font.name = 'Times New Roman'
    r_hlf.font.size = Pt(15)
    r_hlf.font.bold = True
    r_hlf.font.color.rgb = RGBColor(27, 54, 93)

    fig_items = [
        ("Figure 1", "CyberGuard Multi-Tier Platform Architecture", "17"),
        ("Figure 2", "End-to-End Complaint Lifecycle & Processing Workflow", "19"),
        ("Figure 3", "CyberGuard Machine Learning Inference & Gating Architecture", "31"),
        ("Figure 4", "Dataset Taxonomy, Composition & Group-Aware Partitioning Strategy", "36"),
        ("Figure 5", "Mathematical Formulation of TF-IDF & Multinomial Logistic Regression", "33"),
        ("Figure 6", "Dual-Layer Triage: ML OOD Gating (τ = 0.20) vs. Backend Fallback (τ = 0.50)", "34"),
        ("Figure 7", "PrivacyShield Dual-Path Sanitization & Data Lifecycle Architecture", "47"),
        ("Figure 8", "Multi-Modal Forensic Evidence Processing & Entity Extraction Workflow", "51"),
        ("Figure 9", "Role-Based Access Control (RBAC) & Endpoint Authorization Matrix", "55"),
        ("Figure 10", "Held-Out Test Confusion Matrix (N = 390 Samples, 13 Classes)", "42"),
        ("Figure 11", "MongoDB Document Schema & Entity Relationship Architecture", "27"),
    ]

    t_lof = doc.add_table(rows=len(fig_items), cols=3)
    t_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_lof.columns[0].width = Inches(1.2)
    t_lof.columns[1].width = Inches(4.5)
    t_lof.columns[2].width = Inches(0.8)
    for idx, (fnum, ftitle, page) in enumerate(fig_items):
        r = t_lof.rows[idx]
        r.cells[0].paragraphs[0].add_run(fnum).bold = True
        r.cells[1].paragraphs[0].add_run(ftitle)
        p_p = r.cells[2].paragraphs[0]
        p_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_p.add_run(page)

    doc.add_paragraph().paragraph_format.space_before = Pt(18)
    h_lot = doc.add_heading(level=1)
    r_hlt = h_lot.add_run("LIST OF TABLES")
    r_hlt.font.name = 'Times New Roman'
    r_hlt.font.size = Pt(15)
    r_hlt.font.bold = True
    r_hlt.font.color.rgb = RGBColor(27, 54, 93)

    tab_items = [
        ("Table 1", "Comparison of Existing Cybercrime Portals vs. CyberGuard", "11"),
        ("Table 2", "Software & Hardware Technology Stack Specifications", "14"),
        ("Table 3", "System Service Endpoints and Communication Port Map", "18"),
        ("Table 4", "Canonical 13-Class Cybercrime Taxonomy & Severity Mapping", "37"),
        ("Table 5", "Scenario-Family Disjoint Dataset Partitioning Summary", "38"),
        ("Table 6", "Model Architecture Comparison Benchmark (5-Fold GroupKFold)", "41"),
        ("Table 7", "Held-Out Test Set Per-Class Classification Report (N = 390)", "43"),
        ("Table 8", "5-Fold Group Cross-Validation (`GroupKFold`) Summary", "44"),
        ("Table 9", "Out-of-Distribution Threshold Calibration Sweep (τ ∈ [0.15, 0.35])", "45"),
        ("Table 10", "Independent Non-Synthetic Challenge Set Performance (N = 215)", "46"),
        ("Table 11", "PrivacyShield Regex Pattern Benchmark & Recall Breakdown", "49"),
        ("Table 12", "Optical Character Recognition (OCR) Entity Extraction Metrics", "52"),
    ]

    t_lot = doc.add_table(rows=len(tab_items), cols=3)
    t_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_lot.columns[0].width = Inches(1.2)
    t_lot.columns[1].width = Inches(4.5)
    t_lot.columns[2].width = Inches(0.8)
    for idx, (tnum, ttitle, page) in enumerate(tab_items):
        r = t_lot.rows[idx]
        r.cells[0].paragraphs[0].add_run(tnum).bold = True
        r.cells[1].paragraphs[0].add_run(ttitle)
        p_p = r.cells[2].paragraphs[0]
        p_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_p.add_run(page)

    doc.add_page_break()

    # -------------------------------------------------------------
    # ABSTRACT
    # -------------------------------------------------------------
    h_abs = doc.add_heading(level=1)
    r_ha = h_abs.add_run("ABSTRACT")
    r_ha.font.name = 'Times New Roman'
    r_ha.font.size = Pt(16)
    r_ha.font.bold = True
    r_ha.font.color.rgb = RGBColor(27, 54, 93)

    p_abs1 = doc.add_paragraph(
        "Cybercrime reporting systems face severe operational bottlenecks worldwide due to escalating complaint volumes, "
        "unstructured natural language narratives, acute exposure of victim Personally Identifiable Information (PII), "
        "and lack of automated forensic triage. In traditional national intake portals, manual case inspection causes golden-hour "
        "lapses during financial cyber fraud, delayed victim assistance, and severe privacy vulnerabilities when incident data "
        "is shared across investigative tiers. This project presents CyberGuard, an end-to-end, privacy-preserving cybercrime reporting, "
        "forensic intelligence, and statutory complaint management system. CyberGuard integrates a responsive React 18 web application "
        "and a cross-platform React Native (Expo SDK 54) mobile client connected to an Express.js API gateway, a MongoDB document database, "
        "and a dedicated Python Flask machine learning microservice."
    )
    p_abs1.paragraph_format.line_spacing = 1.25

    p_abs2 = doc.add_paragraph(
        "To reconcile the conflicting demands of automated NLP classification and victim confidentiality, CyberGuard implements "
        "PrivacyShield, an in-memory tokenization engine that redacts 15 categories of sensitive PII (including Indian Aadhaar numbers, "
        "PAN identifiers, phone numbers, UPI handles, and bank accounts) prior to model inference, while safely retaining the raw data "
        "in an access-controlled database strictly for authorized law enforcement investigation. Automated triage is performed by a "
        "sublinear TF-IDF vectorizer (1–2 n-grams, 10,000 max features) coupled with an L2-regularized Multinomial Logistic Regression "
        "classifier (C = 2.0, balanced class weights) categorizing incidents into 13 statutory attack classes. To evaluate the classifier "
        "without template-leakage bias, a benchmark corpus of 1,950 synthetic complaints structured across 130 scenario families was "
        "engineered and evaluated under strict scenario-family disjoint partitioning (zero group leakage)."
    )
    p_abs2.paragraph_format.line_spacing = 1.25

    p_abs3 = doc.add_paragraph(
        "Empirical evaluation establishes 88.97% accuracy (347/390 correct), 0.9016 macro precision, and 0.8896 macro F1-score on the "
        "held-out test split, with 5-fold group cross-validation (`GroupKFold`) yielding 79.48% ± 3.21% accuracy. An out-of-distribution (OOD) "
        "rejection gate operating at threshold τ = 0.20 eliminates false acceptances on benign non-cyber queries while maintaining low "
        "in-domain rejection (1.03%). Furthermore, multi-modal evidence processing incorporates Tesseract.js Optical Character Recognition "
        "with automated extraction of 12-digit bank UTR numbers, suspect UPI IDs, and transaction amounts, integrated with cryptographic "
        "SHA-256 evidence hashing and procedural statutory document generation (Section 65B Bharatiya Sakshya Adhiniyam, Section 94/173 BNSS). "
        "CyberGuard demonstrates that combining lightweight regularized linear classifiers, group-aware evaluation protocols, and in-memory "
        "PII sanitization provides a scalable, auditable, and privacy-respecting foundation for modern digital law enforcement."
    )
    p_abs3.paragraph_format.line_spacing = 1.25

    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.space_before = Pt(12)
    r_kw_title = p_kw.add_run("Keywords: ")
    r_kw_title.bold = True
    p_kw.add_run("Cybercrime Complaints, Automated Incident Triage, TF-IDF, Multinomial Logistic Regression, GroupKFold Cross-Validation, "
                 "Personally Identifiable Information (PII) Masking, Optical Character Recognition, Digital Evidence Integrity, Zero-Trust Architecture.")

    doc.add_page_break()

    # Function to add standard chapter headings
    def add_chapter_heading(number, title):
        h = doc.add_heading(level=1)
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(12)
        r = h.add_run(f"CHAPTER {number}\n{title.upper()}")
        r.font.name = 'Times New Roman'
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = RGBColor(27, 54, 93)
        return h

    # Function to add section headings
    def add_section_heading(num_str, title):
        h = doc.add_heading(level=2)
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(f"{num_str} {title}")
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(43, 122, 120)
        return h

    # Function to add subsection headings
    def add_subsection_heading(num_str, title):
        h = doc.add_heading(level=3)
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(f"{num_str} {title}")
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(23, 37, 42)
        return h

    # Function to embed figure
    def embed_figure(fig_filename, caption, fig_num):
        fig_path = os.path.join(os.path.abspath('CyberGuard_Figures'), fig_filename)
        if os.path.exists(fig_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(12)
            p_img.paragraph_format.space_after = Pt(4)
            run = p_img.add_run()
            run.add_picture(fig_path, width=Inches(6.2))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(14)
            r_cap = p_cap.add_run(f"Figure {fig_num}: {caption}")
            r_cap.font.name = 'Times New Roman'
            r_cap.font.size = Pt(10)
            r_cap.font.bold = True
            r_cap.font.color.rgb = RGBColor(27, 54, 93)

    # -------------------------------------------------------------
    # CHAPTER 1: INTRODUCTION AND RESEARCH MOTIVATION
    # -------------------------------------------------------------
    add_chapter_heading(1, "Introduction and Research Motivation")

    add_section_heading("1.1", "Background and Context")
    doc.add_paragraph(
        "The hyper-acceleration of digital payments, cloud infrastructure, and mobile internet connectivity across India and the Global "
        "South has fundamentally transformed economic interactions. While platforms such as the Unified Payments Interface (UPI) process "
        "over 14 billion transactions monthly, this rapid digital onboarding has catalyzed an exponential surge in cyber-enabled fraud, "
        "identity theft, ransomware extortion, phishing, and gender-based harassment. According to data released by the Indian Cyber Crime "
        "Coordination Centre (I4C), national cybercrime complaint portals log tens of thousands of citizen reports daily. However, the existing "
        "infrastructure relies almost exclusively on manual administrative triage, resulting in severe investigation backlogs, delayed freezing "
        "of fraudulent beneficiary bank accounts during the critical financial 'golden hour', and low conviction rates."
    )
    doc.add_paragraph(
        "When victims file cybercrime reports, their initial narratives are inherently unstructured, emotionally distressed, and laden with "
        "disparate details—ranging from bank transaction identifiers and fake call-center phone numbers to intimate conversational exchanges. "
        "Law enforcement cyber cells must rapidly answer three critical questions upon receiving a docket: (1) What specific legal attack "
        "vector was executed? (2) What is the severity tier and asset-recovery urgency of the incident? and (3) What actionable financial "
        "or technical indicators (e.g., UPI handles, 12-digit UTR numbers, suspect phone numbers) can be immediately requisitioned from banks "
        "or telecom service providers?"
    )

    add_section_heading("1.2", "The Privacy Dilemma in Incident Reporting")
    doc.add_paragraph(
        "A profound architectural tension exists in digital complaint management between natural language processing (NLP) automation "
        "and data privacy. Cybercrime complaints inherently contain highly sensitive Personally Identifiable Information (PII), including "
        "Aadhaar numbers, Permanent Account Numbers (PAN), credit card digits, personal bank account numbers, residential addresses, and phone "
        "numbers. Transmitting raw, unmasked citizen narratives to third-party commercial AI APIs (such as OpenAI GPT-4 or Anthropic Claude) "
        "constitutes an unmitigated breach of statutory data protection mandates, specifically India's Digital Personal Data Protection Act "
        "(DPDP Act 2023) and ISO/IEC 27701 privacy guidelines. Once victim identities enter cloud training sets or third-party inference "
        "logs, confidentiality is irreversibly compromised."
    )
    doc.add_paragraph(
        "Conversely, if PII is permanently stripped from the primary reporting database, law enforcement officers cannot contact the victim, "
        "banks cannot locate the targeted account, and courts cannot accept the electronic filing. Therefore, an operational cybercrime "
        "architecture requires a robust dual-path data lifecycle: in-memory PII sanitization for automated statistical inference, coupled "
        "with access-controlled, cryptographically protected persistence for authorized judicial investigations."
    )

    add_section_heading("1.3", "Research Objectives and Scope")
    doc.add_paragraph(
        "CyberGuard was conceived and engineered to resolve these operational and architectural bottlenecks. The primary objectives of "
        "this project are:"
    )
    obj_list = [
        ("Automated Multi-Class Incident Triage", "Design and evaluate a lightweight, interpretable NLP classification engine capable of categorizing unstructured complaint narratives into 13 statutory attack classes with high macro-precision and low latency."),
        ("In-Memory Privacy-Preserving Architecture", "Develop PrivacyShield, an automated regex-based redaction engine that masks 15 PII entity types prior to model inference while preserving raw data integrity for authorized police desks."),
        ("Group-Aware Empirical Methodology", "Synthesize a de-biased benchmark corpus of 1,950 complaints across 130 scenario families, enforcing scenario-family-disjoint partitioning (`GroupKFold`) to eliminate template-memorization artifacts."),
        ("Multi-Modal Forensic Evidence Intake", "Incorporate Optical Character Recognition (OCR) and regex extraction algorithms to automatically parse bank UTRs, UPI handles, and amounts from payment screenshots, sealed with SHA-256 cryptographic digests."),
        ("Statutory Procedural Automation", "Generate procedural legal documentation, including Section 65B Electronic Evidence Certificates (BSA 2023) and Section 94/173 BNSS requisition drafts, streamlining law enforcement dispatch."),
        ("Zero-Trust Cross-Platform Delivery", "Deploy a responsive React 18 web SPA and React Native (Expo SDK 54) mobile application backed by role-based access control (RBAC) and real-time Socket.IO communication."),
    ]
    for title, desc in obj_list:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.add_run(f"• {title}: ").bold = True
        p.add_run(desc)

    # -------------------------------------------------------------
    # CHAPTER 2: LITERATURE REVIEW AND RELATED WORK
    # -------------------------------------------------------------
    add_chapter_heading(2, "Literature Review and Related Work")

    add_section_heading("2.1", "Cybercrime Text Classification & NLP Triage")
    doc.add_paragraph(
        "Automated categorization of cyber incident text has been investigated across varied criminological and computational contexts. "
        "Early research by Ku and Leroy [1] explored text mining techniques to classify crime incident reports, demonstrating that lexical "
        "features and term weighting could distinguish property offenses from interpersonal crimes. However, their models operated on "
        "structured police narrative summaries rather than informal, citizen-authored web submissions. Al-Rowaily et al. [2] benchmarked "
        "Support Vector Machines (SVM), Naive Bayes, and Logistic Regression on cyberbullying and online harassment corpora, noting that "
        "character n-grams and sublinear term frequency scaling provided resilience against deliberate obfuscation and lexical misspellings."
    )
    doc.add_paragraph(
        "Recent trends have heavily emphasized deep transformer-based architectures, such as BERT, RoBERTa, and fine-tuned Large Language "
        "Models (LLMs) [3]. While transformer models achieve high raw accuracy on standardized benchmarks, their operational deployment in "
        "public sector law enforcement portals is severely constrained by massive computational overhead, GPU latency requirements (often "
        "exceeding 800 ms per inference), and susceptibility to catastrophic 'hallucinations' on out-of-distribution inputs. Furthermore, "
        "as established by Agarwal et al. [4], deep models trained on synthetic incident datasets frequently memorize recurring template "
        "syntax rather than learning true semantic attack indicators, leading to catastrophic performance degradation when evaluated on "
        "unseen scenario structures."
    )

    add_section_heading("2.2", "Privacy-Preserving NLP and PII Redaction")
    doc.add_paragraph(
        "Protecting citizen confidentiality during text analysis has historically centered on Named Entity Recognition (NER) and regex-driven "
        "tokenization. The National Institute of Standards and Technology (NIST) Special Publication 800-122 [5] establishes that PII "
        "redaction requires domain-specific contextual boundaries. Replacing structured identifiers (e.g., 10-digit mobile numbers, 12-digit "
        "Aadhaar numbers) with standardized surrogate tokens (e.g., `PHONE_1`, `AADHAAR_1`) allows downstream statistical classifiers to "
        "process text syntax without retaining access to individual identities. Dernoncourt et al. [6] validated that token replacement "
        "maintains classifier accuracy in clinical narratives while eliminating re-identification risk. CyberGuard builds upon this paradigm "
        "by operationalizing PrivacyShield directly in the Node.js middleware layer, guaranteeing that no plaintext identity tokens ever "
        "reach the Python ML microservice."
    )

    add_section_heading("2.3", "Forensic Evidence Integrity and Computer Vision")
    doc.add_paragraph(
        "In digital forensics, the admissibility of electronic evidence is strictly governed by procedural law. In India, Section 65B of "
        "the Indian Evidence Act (now codified under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023) mandates that electronic records "
        "must be accompanied by a verifiable certificate detailing device custody, hash integrity, and unmanipulated extraction processes [7]. "
        "Casey et al. [8] formalized digital forensic triage pipelines, establishing that optical character recognition (OCR) applied to "
        "mobile screenshots must preserve the original cryptographic hash of the image file. Tesseract OCR, developed by Hewlett-Packard "
        "and maintained by Google, has emerged as the industry benchmark for client-side and server-side text extraction from rasterized "
        "documents [9]. However, raw OCR text is notoriously noisy; parsing financial identifiers requires rigorous regular expression "
        "filtering and entity reconciliation."
    )

    # -------------------------------------------------------------
    # CHAPTER 3: PROBLEM DEFINITION, SCOPE, AND OBJECTIVES
    # -------------------------------------------------------------
    add_chapter_heading(3, "Problem Definition, Scope, and Objectives")

    add_section_heading("3.1", "Formal Problem Statement")
    doc.add_paragraph(
        "Let a citizen cybercrime complaint be formally defined as a tuple C = (T, D, E, U, t), where T is the brief incident title, "
        "D is the unstructured textual narrative, E = {e_1, e_2, ..., e_m} is a set of multi-modal evidence attachments (images or PDFs), "
        "U is the authenticated complainant identity, and t is the filing timestamp. The analytical objective is to map the textual narrative "
        "(T, D) into a discrete statutory cybercrime category y ∈ Y, where |Y| = 13 canonical categories, and assign an ordinal severity tier "
        "s ∈ {LOW, MEDIUM, HIGH, CRITICAL}, subject to three mandatory operational constraints:"
    )
    doc.add_paragraph(
        "1. Privacy Invariant: Let S(x) be the PII sanitization mapping. For all model inference requests, the classifier input x_masked = S(T ◦ D) "
        "must not contain any true plaintext values of Aadhaar, PAN, UPI, phone numbers, or bank accounts.\n"
        "2. Epistemic Uncertainty Invariant: Let P(y | x_masked) be the classifier probability distribution. If max_k P(y=k | x_masked) < τ "
        "(where τ = 0.20 is the calibrated confidence threshold), the system must reject the prediction as Out-of-Distribution (OOD), "
        "activating deterministic fallback heuristics and queuing the docket for human desk review.\n"
        "3. Evidentiary Integrity Invariant: For every evidence attachment e_i, the system must compute a cryptographic digest H(e_i) = SHA256(e_i) "
        "at ingestion, guaranteeing non-repudiation and chain of custody."
    )

    add_section_heading("3.2", "System Scope and Boundary Conditions")
    doc.add_paragraph(
        "The functional scope of CyberGuard encompasses public complaint intake, citizen status tracking, automated NLP classification, "
        "OCR evidence parsing, link analysis visualization, encrypted officer communication, and procedural statutory document drafting. "
        "However, to preserve academic and legal integrity, the explicit non-goals and system boundaries must be delineated:"
    )
    doc.add_paragraph(
        "• Human-in-the-Loop Triage: CyberGuard is an investigatory triage tool, NOT an automated judicial decision-maker. No citizen complaint "
        "is legally dismissed, convicted, or closed without explicit officer review and authorization.\n"
        "• Statutory Notice Status: Generated notices (BNSS 94/173, BSA 65B) are procedural drafts. CyberGuard does not possess direct API access "
        "to core banking networks (NPCI) or telecom gateways; drafts must be reviewed and signed by designated nodal officers.\n"
        "• Corpus Boundaries: The classifier is trained on an engineered synthetic corpus of 1,950 narratives. While de-biased across 130 scenario "
        "families, it is not an independently certified police clinical trial."
    )

    # -------------------------------------------------------------
    # CHAPTER 4: EXISTING SYSTEMS VS. PROPOSED ARCHITECTURE
    # -------------------------------------------------------------
    add_chapter_heading(4, "Existing Systems vs. Proposed Architecture")

    add_section_heading("4.1", "Shortcomings of Contemporary Portals")
    doc.add_paragraph(
        "Contemporary cybercrime intake mechanisms, such as India's National Cyber Crime Reporting Portal (cybercrime.gov.in) and regional "
        "police web portals, suffer from critical design deficiencies:"
    )
    doc.add_paragraph(
        "1. Rigid, Complex Category Selection: Citizens are forced to navigate hundreds of technical sub-categories (e.g., distinguishing "
        "'Ransomware' from 'Malware' or 'SIM Swap' from 'Vishing'). Confused victims frequently select 'Other' or misclassify their filings, "
        "delaying specialized police routing.\n"
        "2. PII Leakage Across Dashboards: Investigative dashboards routinely display full unmasked phone numbers and residential addresses "
        "to administrative clerical staff, violating zero-trust principles.\n"
        "3. Manual Evidence Inspection: Bank transaction slips and payment screenshots must be manually opened, rotated, and transcribed by desk "
        "officers, consuming hours during the financial fraud golden hour.\n"
        "4. Absence of Automated Threat Linkage: Contemporary portals store complaints as isolated relational rows, failing to link suspect UPI "
        "handles or phone numbers shared across multiple victim filings in real time."
    )

    add_section_heading("4.2", "Comparative Feature Matrix")
    
    t_comp = doc.add_table(rows=7, cols=3)
    t_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_comp.columns[0].width = Inches(2.2)
    t_comp.columns[1].width = Inches(2.1)
    t_comp.columns[2].width = Inches(2.2)

    headers = ["Functional Capability", "Traditional Portal (e.g., NCRP)", "CyberGuard AI Platform"]
    for idx, text in enumerate(headers):
        cell = t_comp.rows[0].cells[idx]
        cell.paragraphs[0].add_run(text).bold = True
        set_cell_background(cell, "1B365D")
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    comp_data = [
        ("Complaint Intake Method", "Complex multi-tier dropdown menus", "Conversational AI Guide (Onee) + Free text"),
        ("Incident Classification", "Manual police clerical review", "Automated TF-IDF + LogReg (13 classes)"),
        ("Victim PII Handling", "Stored and displayed unmasked", "PrivacyShield in-memory tokenization"),
        ("Evidence Processing", "Manual file attachments (no OCR)", "Tesseract.js OCR + Regex entity extraction"),
        ("Evidence Integrity", "Basic database storage", "Cryptographic SHA-256 fingerprinting"),
        ("Cross-Case Linkage", "Manual database queries", "Real-time Scam Radar & threat indicators"),
    ]

    for row_idx, data in enumerate(comp_data):
        row = t_comp.rows[row_idx + 1]
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            cell.paragraphs[0].add_run(text)
            if row_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")

    doc.add_paragraph().paragraph_format.space_before = Pt(6)

    # -------------------------------------------------------------
    # CHAPTER 5: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
    # -------------------------------------------------------------
    add_chapter_heading(5, "Software Requirements Specification")

    add_section_heading("5.1", "Functional Requirements")
    doc.add_paragraph(
        "• FR-01: Incident Narrative Submission: Complainants must be able to submit detailed complaint narratives and structured metadata via "
        "web and mobile interfaces.\n"
        "• FR-02: Automated Category & Severity Prediction: The system must classify narratives into one of 13 attack classes and assign severity.\n"
        "• FR-03: In-Memory PII Masking: The API gateway must identify and tokenize 15 categories of PII prior to model inference.\n"
        "• FR-04: Optical Character Recognition: Uploaded evidence screenshots must be preprocessed and parsed for 12-digit UTRs, UPI handles, and amounts.\n"
        "• FR-05: Real-Time Docket Telemetry: Citizens must be able to track complaint milestones via a secure docket tracking code (e.g., `CMP-628504`).\n"
        "• FR-06: Investigation Desk: Officers must have access to link-analysis graphs, full raw evidence, and status progression controls.\n"
        "• FR-07: Statutory Document Generation: The system must compile Section 65B evidence certificates and Section 94/173 BNSS transfer orders."
    )

    add_section_heading("5.2", "Non-Functional Requirements")
    doc.add_paragraph(
        "• NFR-01: Performance & Latency: PII masking latency must not exceed 1.0 ms p50; ML classification inference must not exceed 5.0 ms.\n"
        "• NFR-02: Security & Authentication: All API endpoints must enforce JWT Bearer authentication with distinct role guards (`user`, `officer`, `admin`).\n"
        "• NFR-03: High Availability: The system must maintain fallback keyword heuristics in the event of ML microservice unavailability.\n"
        "• NFR-04: Usability & Accessibility: The web application must achieve WCAG-AA contrast compliance and responsive performance across mobile (320px) to desktop (1440px) viewports."
    )

    # -------------------------------------------------------------
    # CHAPTER 6: SYSTEM ARCHITECTURE AND DETAILED DESIGN
    # -------------------------------------------------------------
    add_chapter_heading(6, "System Architecture and Detailed Design")

    add_section_heading("6.1", "Multi-Tier Service Architecture")
    doc.add_paragraph(
        "CyberGuard is organized as a decoupled, multi-tier distributed architecture comprising four synchronized execution layers: "
        "the Client Presentation Layer, the Gateway & Middleware Services Layer, the AI/ML Microservice Layer, and the Data Persistence Layer. "
        "Figure 1 illustrates the comprehensive service boundaries, communication protocols, and port allocations across the platform."
    )

    embed_figure("Figure_1_Overall_Architecture.png", "CyberGuard Multi-Tier Platform Architecture and Inter-Service Communication Topology", 1)

    doc.add_paragraph(
        "The Presentation Layer encompasses a React 18 single-page web application and an Expo SDK 54 React Native mobile application. "
        "Both clients communicate exclusively with the Node.js Express Gateway (Port 5002) over TLS-encrypted HTTPS REST endpoints and "
        "duplex WebSockets powered by Socket.IO. The gateway encapsulates rate limiting (100 req/15 min), Helmet security headers, CORS origin "
        "validation, and JSON Web Token (JWT) identity resolution. Crucially, client applications never communicate directly with the Python "
        "ML microservice (Port 5003); all inference traffic is mediated by the backend using a shared server-to-server cryptographic header "
        "(`X-ML-Secret`), enforcing strict network isolation."
    )

    add_section_heading("6.2", "End-to-End Complaint Lifecycle")
    doc.add_paragraph(
        "Figure 2 illustrates the chronological lifecycle of a cybercrime complaint, tracking data transformations from initial citizen "
        "intake through automated PII sanitization, ML classification, forensic OCR extraction, officer investigation, and case resolution."
    )

    embed_figure("Figure_2_Complaint_Lifecycle.png", "End-to-End Complaint Submission, Automated Triage, and Investigation Workflow", 2)

    doc.add_paragraph(
        "When an incident report is submitted, PrivacyShield immediately scans the narrative. Sanitized text is dispatched to the Python ML "
        "microservice, while original narrative fields are stored in MongoDB with an initial status of 'Pending Triage'. If the ML confidence "
        "falls below τ = 0.20, the backend keyword fallback assigns an initial baseline and tags the record for urgent human review. Concurrently, "
        "uploaded screenshots are processed by Tesseract.js, populating the docket with candidate financial identifiers. The assigned officer "
        "reviews the consolidated evidence, updates the complaint timeline, dispatches statutory notices, and notifies the victim in real time."
    )

    # -------------------------------------------------------------
    # CHAPTER 7: TECHNOLOGY STACK AND MODULE IMPLEMENTATION
    # -------------------------------------------------------------
    add_chapter_heading(7, "Technology Stack and Module Implementation")

    add_section_heading("7.1", "Core Technology Specifications")
    
    t_tech = doc.add_table(rows=8, cols=3)
    t_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_tech.columns[0].width = Inches(1.8)
    t_tech.columns[1].width = Inches(2.2)
    t_tech.columns[2].width = Inches(2.5)

    th = ["Architecture Tier", "Technology / Library", "Operational Role & Runtime Configuration"]
    for idx, text in enumerate(th):
        c = t_tech.rows[0].cells[idx]
        c.paragraphs[0].add_run(text).bold = True
        set_cell_background(c, "1B365D")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    tech_data = [
        ("Frontend Web", "React 18, Tailwind CSS, Framer Motion", "Single Page Application (Port 3000), Chart telemetries"),
        ("Frontend Mobile", "React Native, Expo SDK 54", "Native iOS & Android mobile client (Metro Port 8081)"),
        ("Backend Gateway", "Node.js, Express.js 4.x", "API Gateway (Port 5002), JWT Auth, Socket.IO, Helmet"),
        ("Machine Learning", "Python 3.11+, Flask, scikit-learn", "ML Microservice (Port 5003), TF-IDF + Logistic Regression"),
        ("Forensic OCR", "Tesseract.js, Sharp", "Image pre-processing & regex entity extraction"),
        ("Data Persistence", "MongoDB 7.0, Mongoose ODM", "Document database (Port 27017), Schema validation"),
        ("Infrastructure", "Render, Railway, Docker", "PaaS cloud deployment, render.yaml multi-service IaC"),
    ]

    for r_idx, d in enumerate(tech_data):
        row = t_tech.rows[r_idx + 1]
        for c_idx, val in enumerate(d):
            cell = row.cells[c_idx]
            cell.paragraphs[0].add_run(val)
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")

    doc.add_paragraph().paragraph_format.space_before = Pt(6)

    # -------------------------------------------------------------
    # CHAPTER 8: DATABASE DESIGN AND DOCUMENT SCHEMAS
    # -------------------------------------------------------------
    add_chapter_heading(8, "Database Design and Document Schemas")

    add_section_heading("8.1", "Schema Modeling and Entity Relationships")
    doc.add_paragraph(
        "CyberGuard utilizes MongoDB for data persistence, leveraging a document-oriented structure that accommodates nested timelines, "
        "variable evidence arrays, and polymorphic threat indicators. Figure 11 illustrates the entity relationship model and Mongoose "
        "schemas across the primary collections: Users, Complaints, Evidence, ThreatRecords, and ChatMessages."
    )

    embed_figure("Figure_11_Database_Schema.png", "MongoDB Document Schemas and Entity Relationship Diagram", 11)

    doc.add_paragraph(
        "The Complaint document acts as the central aggregate root. It maintains references to the filing citizen (`userId`), the assigned "
        "investigating officer (`assignedOfficer`), an array of linked evidence records (`evidence`), and an append-only subdocument array "
        "of timeline transitions (`timeline`). Each timeline entry records the status transition, the authenticated updater's ObjectId, "
        "an administrative action note, and an immutable timestamp. Critical indexes are established on `trackingId` (unique), `userId`, "
        "`status`, `category`, and `createdAt` to ensure sub-millisecond query performance during high-volume dashboard filtering."
    )

    # -------------------------------------------------------------
    # CHAPTER 9: MACHINE LEARNING METHODOLOGY & MATHEMATICS
    # -------------------------------------------------------------
    add_chapter_heading(9, "Machine Learning Methodology & Formulation")

    add_section_heading("9.1", "Feature Representation & Classification Pipeline")
    doc.add_paragraph(
        "The machine learning classification pipeline is engineered for deterministic, high-throughput, and legally explainable inference. "
        "Figure 3 illustrates the sequential stages from raw complaint ingestion to confidence-gated prediction."
    )

    embed_figure("Figure_3_ML_Pipeline.png", "Machine Learning Feature Extraction, Classification, and OOD Gating Architecture", 3)

    add_section_heading("9.2", "Mathematical Formulation")
    doc.add_paragraph(
        "Figure 5 presents the formal mathematical foundations governing the TF-IDF feature space transformation, logit scoring, softmax "
        "probability estimation, and class-weighted regularized loss minimization."
    )

    embed_figure("Figure_5_TFIDF_LogReg_Workflow.png", "Mathematical Formulation of TF-IDF and Logistic Regression Classification Pipeline", 5)

    doc.add_paragraph(
        "Feature extraction applies sublinear term frequency scaling: TF(t, d) = 1 + ln(f_{t,d}) for f_{t,d} > 0, which dampens the impact "
        "of repeated words in lengthy narratives. Inverse Document Frequency is computed with smooth weighting: IDF(t, D) = 1 + ln((1 + |D|) / (1 + df(t))), "
        "where df(t) is the document frequency of term t across training corpus D. Extracted n-grams encompass unigrams and bigrams within a "
        "fixed vocabulary cap of 10,000 features. The resulting feature vector x is L2-normalized. The Multinomial Logistic Regression model "
        "evaluates 13 linear score equations z_k = w_k^T x + b_k, mapped to posterior class probabilities via the Softmax activation function. "
        "To mitigate class distribution imbalances, class-weight balancing multiplies the cross-entropy loss by inverse class frequencies: "
        "alpha_k = N / (13 * N_k)."
    )

    add_section_heading("9.3", "Dual-Layer OOD Rejection & Fallback Dynamics")
    doc.add_paragraph(
        "Figure 6 illustrates the operational interaction between the Python ML service out-of-distribution (OOD) rejection gate and the "
        "Node.js backend keyword fallback engine."
    )

    embed_figure("Figure_6_OOD_Gating_vs_Fallback.png", "Architectural Interaction between ML OOD Gating (τ = 0.20) and Backend Keyword Fallback", 6)

    doc.add_paragraph(
        "In a 13-class softmax distribution, an uninformative random probability is 1/13 ≈ 0.0769. An empirical threshold calibration sweep "
        "(Table 9) revealed that a naive threshold (such as τ = 0.30 or τ = 0.50) rejected over 40.8% of valid in-domain citizen complaints. "
        "Operating at τ = 0.20 achieves an optimal balance, reducing in-domain false rejection (FRR) to 1.03% while completely rejecting 100% "
        "of benign everyday non-cyber queries. When a sample is rejected or the ML service encounters a network fault, the Node.js backend "
        "activates deterministic regex heuristics, ensuring uninterrupted platform availability."
    )

    # -------------------------------------------------------------
    # CHAPTER 10: DATASET ENGINEERING & SCENARIO FAMILIES
    # -------------------------------------------------------------
    add_chapter_heading(10, "Dataset Engineering & Scenario Families")

    add_section_heading("10.1", "Corpus Synthesis and De-Biasing Protocol")
    doc.add_paragraph(
        "To overcome the privacy restrictions preventing the release of real-world police FIR dockets, a balanced synthetic benchmark "
        "corpus of 1,950 complaints was authored. Figure 4 illustrates the class balance, length composition, and scenario-family disjoint "
        "partitioning strategy."
    )

    embed_figure("Figure_4_Dataset_Partitioning.png", "Dataset Composition, Taxonomy, and Scenario-Family Disjoint 80/20 Partitioning", 4)

    doc.add_paragraph(
        "A critical vulnerability identified in prior academic datasets (such as CyberGuard v2.0) was 'template leakage', where synthetic "
        "narratives shared identical boilerplate carrier sentences across training and test splits, artificially inflating holdout accuracy "
        "to >97%. In v3.0, the 1,950 records are systematically organized into 130 scenario families (10 per class, 15 records per family). "
        "Each scenario family introduces distinct technical attack vectors, narrative structures, and terminology. The corpus comprises 1,560 "
        "detailed narratives (80%, 40–120 words), 390 concise citizen inputs (20%, 10–25 words), and 98 controlled lexical noise records "
        "(5.03%) with typos, phonetic spellings, and missing punctuation."
    )

    add_section_heading("10.2", "Cryptographic Checksum and Line-Ending Analysis")
    doc.add_paragraph(
        "A rigorous cryptographic audit of `ml-service/data/dataset.csv` resolved a critical verification discrepancy. The official dataset "
        "manifest (`dataset-manifest.json`) records SHA-256: `3426ec7b81cfec76845439e7138780df4b808811f68d184b4918aadb22ee84ac`. However, "
        "when computed on the Windows filesystem, `model_meta.json` recorded SHA-256: `c6cadb177119a48481a81bffa72685140cdc8df459334b9775e760f466aa2a22`. "
        "Investigative analysis confirmed that this variance is caused exclusively by Git line-ending normalization: normalizing CRLF line "
        "breaks to LF yields the exact manifest hash (`3426ec...`), confirming 100% bitwise data integrity across platforms."
    )

    # -------------------------------------------------------------
    # CHAPTER 11: EXPERIMENTAL BENCHMARKING & EVALUATION
    # -------------------------------------------------------------
    add_chapter_heading(11, "Experimental Benchmarking & Evaluation")

    add_section_heading("11.1", "Held-Out Test Set Performance")
    doc.add_paragraph(
        "The model was evaluated on the held-out test split of 390 samples (scenario families 8–9, 30 per class). Figure 10 presents the "
        "normalized 13x13 confusion matrix across all statutory categories."
    )

    embed_figure("Figure_10_Confusion_Matrix.png", "Held-Out Test Set Confusion Matrix (N = 390 Samples, 13 Classes)", 10)

    doc.add_paragraph(
        "On the primary held-out benchmark, the champion Logistic Regression classifier achieved 88.97% accuracy (347 / 390 correct), "
        "0.9016 macro-precision, 0.8897 macro-recall, and 0.8896 macro-F1. Perfect 100% precision and recall were attained on `phishing` "
        "and `ransomware`. Minor classification confusion arose between `cyberbullying` and `women_child_safety` (6 samples), and between "
        "`hacking` and `data_breach` (4 samples). This overlap reflects genuine semantic intersections in legal cyber statutes: unauthorized "
        "server intrusion (`hacking`) frequently serves as the predicate offense for corporate exfiltration (`data_breach`)."
    )

    add_section_heading("11.2", "GroupKFold Cross-Validation Verification")
    doc.add_paragraph(
        "To verify generalization across varying narrative styles, 5-fold cross-validation was conducted across the 104 development "
        "scenario families using scikit-learn's `GroupKFold`. This evaluation achieved a mean accuracy of 79.48% ± 3.21% and macro-F1 of "
        "0.7507 ± 0.0383 (with an alternate serialized production run recording 80.80% ± 8.76% and macro-F1 of 0.7887). The strict scenario-disjoint "
        "boundary guarantees that these scores represent true out-of-template lexical generalization rather than memorized syntactical artifacts."
    )

    add_section_heading("11.3", "Independent Challenge Set Benchmark")
    doc.add_paragraph(
        "To test generalization against independently phrased complaints, an external challenge corpus of 215 items was evaluated (195 in-domain "
        "complaints + 20 benign non-cyber queries). In-domain accuracy reached 98.46% (raw) and 97.44% (operational gated at τ = 0.20), with "
        "an average prediction confidence of 0.5868. On the 20 benign everyday queries (e.g., 'Where can I buy fresh groceries?'), the average "
        "confidence was 0.1673, resulting in 100% safe rejection (0.0% False Acceptance Rate)."
    )

    # -------------------------------------------------------------
    # CHAPTER 12: PRIVACYSHIELD DUAL-PATH SANITIZATION
    # -------------------------------------------------------------
    add_chapter_heading(12, "PrivacyShield Sanitization Architecture")

    add_section_heading("12.1", "In-Memory Dual-Path Workflow")
    doc.add_paragraph(
        "Figure 7 illustrates the architectural design of PrivacyShield, contrasting the in-memory tokenization path used for machine learning "
        "inference with the encrypted persistence path maintained for legal case follow-up."
    )

    embed_figure("Figure_7_Privacy_Data_Flow.png", "PrivacyShield Dual-Path Sanitization and Lifecycle Security Flow", 7)

    doc.add_paragraph(
        "PrivacyShield utilizes highly optimized deterministic regular expressions to detect and substitute 15 PII categories, including "
        "12-digit Indian Aadhaar numbers (`\\b[2-9]\\d{3}\\s?\\d{4}\\s?\\d{4}\\b`), 10-character alphanumeric PAN cards (`\\b[A-Z]{5}[0-9]{4}[A-Z]\\b`), "
        "Indian mobile numbers, UPI virtual payment addresses, bank account numbers, IPv4 addresses, and person names. Benchmark evaluation "
        "demonstrated an overall PII detection sensitivity of 91.67% and 100% precision on structured financial identifiers, operating with "
        "an average processing latency of just 0.200 ms (0.036 ms p50)."
    )

    # -------------------------------------------------------------
    # CHAPTER 13: MULTI-MODAL FORENSIC OCR & STATUTORY AUTOMATION
    # -------------------------------------------------------------
    add_chapter_heading(13, "Forensic OCR & Statutory Notice Automation")

    add_section_heading("13.1", "OCR Pipeline and Entity Extraction")
    doc.add_paragraph(
        "Figure 8 delineates the multi-modal evidence processing pipeline, from file upload and SHA-256 cryptographic hashing to Sharp "
        "image pre-processing, Tesseract.js optical character recognition, and regex entity parsing."
    )

    embed_figure("Figure_8_Evidence_OCR_Workflow.png", "Forensic Evidence Ingestion, SHA-256 Hashing, and OCR Entity Extraction Workflow", 8)

    doc.add_paragraph(
        "Benchmark testing on real-world mobile payment screenshots (Google Pay, PhonePe, Paytm) achieved 1.0000 precision and recall on UPI "
        "handles and extracted monetary amounts. Transaction UTR parsing achieved 1.0000 recall and 0.5000 precision (reflecting conservative "
        "regex extraction that captures 12-digit order numbers alongside bank UTRs). All extracted candidates are linked to the case docket for "
        "instant verification by the investigating officer."
    )

    add_section_heading("13.2", "Automated Statutory Notice Dispatch")
    doc.add_paragraph(
        "To accelerate procedural law enforcement action, CyberGuard compiles standardized statutory notices:\n"
        "1. Section 65B Electronic Evidence Certificate (Bharatiya Sakshya Adhiniyam, 2023): Validates the cryptographic SHA-256 hash, "
        "server ingestion timestamp, device headers, and custody trail of uploaded digital evidence for judicial submission.\n"
        "2. Section 94 BNSS Bank Account Freeze Requisition: Automatically populates extracted UTRs, beneficiary accounts, and stolen amounts "
        "into formal requisition dockets dispatched to nodal bank officers during the golden hour.\n"
        "3. Section 173 BNSS Zero-FIR Transfer Order: Compiles jurisdictional transfer documentation when incidents originate outside the "
        "receiving police station's territorial boundary."
    )

    # -------------------------------------------------------------
    # CHAPTER 14: SECURITY ARCHITECTURE & ACCESS CONTROL
    # -------------------------------------------------------------
    add_chapter_heading(14, "Security Architecture and Access Control")

    add_section_heading("14.1", "Role-Based Access Control (RBAC)")
    doc.add_paragraph(
        "Figure 9 illustrates the role-based access control architecture and endpoint protection matrix enforced by the Express gateway."
    )

    embed_figure("Figure_9_RBAC_Access_Control.png", "Role-Based Access Control (RBAC) Architecture and Protected Route Guards", 9)

    doc.add_paragraph(
        "Every incoming HTTP request is authenticated via JSON Web Tokens (JWT) signed with HMAC-SHA256. Route guards restrict sensitive "
        "endpoints based on user claims: citizen users (`user`) can submit reports and view their own filings; police officers (`officer`) "
        "access unmasked PII, forensic dossiers, and case progression controls; and administrators (`admin`) manage system users and audit logs. "
        "Public endpoints, such as the Threat Radar (`/api/complaints/public/radar`), enforce strict anonymization filters, ensuring that no "
        "complainant PII is exposed to unauthenticated community visitors."
    )

    # -------------------------------------------------------------
    # CHAPTER 15: LIMITATIONS AND ETHICAL CONSIDERATIONS
    # -------------------------------------------------------------
    add_chapter_heading(15, "Limitations and Ethical Considerations")
    doc.add_paragraph(
        "Academic and engineering rigor requires transparent disclosure of the system's operational constraints:\n"
        "1. Synthetic Corpus Boundaries: While the v3.0 dataset eliminates template repetition across 130 scenario families, all 1,950 records "
        "are synthetically generated. Real-world citizen reports contain multilingual code-switching (e.g., Hinglish, Kannada-English), colloquial "
        "slang, and extraneous emotional context that may impact classification accuracy.\n"
        "2. Uncalibrated Softmax Probabilities: Logistic Regression probability scores reflect linear margin distance rather than exact Bayesian "
        "posterior probabilities. A model confidence score of 0.85 indicates strong lexical alignment, not legal certainty of criminal guilt.\n"
        "3. OCR Quality Variations: OCR parsing accuracy is vulnerable to low-resolution camera angles, severe JPEG compression, and optical screen "
        "glare. Extracted entities must always be treated as preliminary leads requiring officer visual confirmation.\n"
        "4. Statutory Notice Drafting: Generated BNSS notices are procedural drafts requiring official authorization; CyberGuard does not possess "
        "direct autonomous authority to seize assets or freeze banking accounts."
    )

    # -------------------------------------------------------------
    # CHAPTER 16: PRIORITIZED FUTURE ENHANCEMENTS
    # -------------------------------------------------------------
    add_chapter_heading(16, "Prioritized Future Enhancements")
    doc.add_paragraph(
        "The following prioritized roadmap outlines key engineering avenues for subsequent iterations of the platform:\n"
        "• High Priority: Multilingual & Code-Mixed NLP: Fine-tune compact multilingual models (such as IndicBERT or MuRIL) to natively "
        "comprehend mixed vernacular dialects and regional phonetic complaint text.\n"
        "• High Priority: Population-Scale Empirical Validation: Partner with legal aid clinics and state cyber police cells to evaluate model "
        "generalization on a curated benchmark of 5,000+ anonymized real-world citizen filings.\n"
        "• Medium Priority: Contextual Token-Level NER: Complement regex patterns with fine-tuned token-classification transformers (e.g., "
        "spaCy RoBERTa) to recognize complex rural addresses, unusual foreign names, and emerging cryptocurrency transaction hashes.\n"
        "• Medium Priority: Computer Vision Tampering Detection: Supplement OCR with Error Level Analysis (ELA) and Convolutional Neural Networks "
        "(CNNs) to detect digitally manipulated font glyphs and fabricated payment confirmations.\n"
        "• Statutory Integration Priority: National Portal Interoperability: Establish authenticated programmatic API integrations with "
        "India's Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS / 1930) under institutional memorandum of understanding."
    )

    # -------------------------------------------------------------
    # CHAPTER 17: CONCLUSION
    # -------------------------------------------------------------
    add_chapter_heading(17, "Conclusion")
    doc.add_paragraph(
        "CyberGuard addresses one of the most pressing challenges in contemporary cyber law enforcement: the acute conflict between automated "
        "incident triage, forensic intelligence extraction, and victim data privacy. By implementing PrivacyShield, this project demonstrates "
        "that in-memory PII tokenization can effectively decouple statistical text classification from sensitive citizen identity storage. "
        "The champion TF-IDF and Multinomial Logistic Regression pipeline attains 88.97% accuracy on a held-out test split and 79.48% ± 3.21% "
        "under rigorous group-aware cross-validation across 130 scenario families, successfully eliminating template-leakage bias."
    )
    doc.add_paragraph(
        "Furthermore, integrating Tesseract.js OCR, cryptographic SHA-256 evidence hashing, and automated statutory notice generation delivers "
        "a comprehensive incident-response ecosystem. The resulting architecture empowers desk officers to intercept financial fraud during the "
        "critical golden hour, respects international and national privacy mandates (DPDP Act 2023), and provides an auditable, transparent, "
        "and reproducible framework for the next generation of digital crime management infrastructure."
    )

    # -------------------------------------------------------------
    # REFERENCES
    # -------------------------------------------------------------
    add_chapter_heading(18, "References")
    
    refs = [
        "[1] C.-H. Ku and G. Leroy, \"A crime text analysis system to analyze crime incident reports,\" in Proc. IEEE International Conference on Intelligence and Security Informatics (ISI), 2014, pp. 267–269.",
        "[2] K. Al-Rowaily, M. Abulaish, N. A. Haldar, and M. Al-Rubaian, \"Bi-directional text classification for cyberbullying detection on social media platforms,\" IEEE Access, vol. 8, pp. 138676–138686, 2020.",
        "[3] J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, \"BERT: Pre-training of deep bidirectional transformers for language understanding,\" in Proc. NAACL-HLT, 2019, pp. 4171–4186.",
        "[4] S. Agarwal, S. Nilizadeh, and A. Kapravelos, \"Detecting synthetic text manipulation in cyber threat intelligence reports,\" IEEE Trans. Dependable Secure Comput., vol. 19, no. 5, pp. 3120–3135, 2022.",
        "[5] E. McCallister, T. Grance, and K. Scarfone, \"Guide to protecting the confidentiality of personally identifiable information (PII),\" NIST Special Publication 800-122, National Institute of Standards and Technology, Gaithersburg, MD, 2010.",
        "[6] F. Dernoncourt, J. Y. Lee, O. Uzuner, and P. Szolovits, \"De-identification of patient notes with recurrent neural networks,\" J. Am. Med. Inform. Assoc., vol. 24, no. 3, pp. 596–606, 2017.",
        "[7] Ministry of Law and Justice, Government of India, \"The Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023),\" The Gazette of India, Dec. 2023.",
        "[8] E. Casey, Digital Evidence and Computer Crime: Forensic Science, Computers, and the Internet, 3rd ed. London, U.K.: Academic Press, 2011.",
        "[9] R. Smith, \"An overview of the Tesseract OCR engine,\" in Proc. Ninth International Conference on Document Analysis and Recognition (ICDAR), 2007, pp. 629–633.",
        "[10] F. Pedregosa et al., \"Scikit-learn: Machine learning in Python,\" J. Mach. Learn. Res., vol. 12, pp. 2825–2830, 2011.",
        "[11] T. Cover and P. Hart, \"Nearest neighbor pattern classification,\" IEEE Trans. Inform. Theory, vol. 13, no. 1, pp. 21–27, 1967.",
        "[12] J. C. Platt, \"Probabilistic outputs for support vector machines and comparisons to regularized likelihood methods,\" Advances in Large Margin Classifiers, vol. 10, no. 3, pp. 61–74, 1999.",
        "[13] C. Guo, G. Pleiss, Y. Sun, and K. Q. Weinberger, \"On calibration of modern neural networks,\" in Proc. 34th International Conference on Machine Learning (ICML), 2017, pp. 1321–1330.",
        "[14] Indian Cyber Crime Coordination Centre (I4C), \"Annual Compendium on Cybercrime Trends in India,\" Ministry of Home Affairs, New Delhi, India, 2024.",
        "[15] National Crime Records Bureau (NCRB), \"Crime in India 2023 - Cyber Crimes Statistics,\" Ministry of Home Affairs, New Delhi, India, 2024.",
        "[16] Reserve Bank of India, \"Enhancing Security of Digital Payment Transactions - Master Direction,\" RBI/2021-22/123, Mumbai, India, 2021.",
        "[17] Unique Identification Authority of India (UIDAI), \"Aadhaar Authentication Security and Privacy Guidelines,\" New Delhi, India, 2023.",
        "[18] National Payments Corporation of India (NPCI), \"Unified Payments Interface (UPI) Procedural Guidelines v1.9,\" Mumbai, India, 2023.",
        "[19] Visvesvaraya Technological University (VTU), \"Guidelines for Project Work in Bachelor of Engineering,\" Belagavi, Karnataka, India, 2024.",
        "[20] A. Vaswani et al., \"Attention is all you need,\" in Advances in Neural Information Processing Systems (NeurIPS), 2017, pp. 5998–6008.",
    ]

    for ref in refs:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.left_indent = Inches(0.3)
        p_r.paragraph_format.first_line_indent = Inches(-0.3)
        p_r.add_run(ref)

    # Save DOCX
    docx_out = os.path.abspath(r'C:\Users\Mohith\Desktop\CyberGuard_Project_Report_Revised.docx')
    doc.save(docx_out)
    print(f"Report DOCX saved to {docx_out}")

    # Also save to project root / docs
    proj_docx = os.path.abspath('CyberGuard_Project_Report_Revised.docx')
    doc.save(proj_docx)
    print(f"Report DOCX copied to {proj_docx}")

    # Convert to PDF
    pdf_out = os.path.abspath(r'C:\Users\Mohith\Desktop\CyberGuard_Project_Report_Revised.pdf')
    try:
        convert(docx_out, pdf_out)
        print(f"Report PDF successfully compiled to {pdf_out}")
    except Exception as e:
        print(f"Error compiling PDF: {e}")

if __name__ == '__main__':
    create_project_report()

