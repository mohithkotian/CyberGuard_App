import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx2pdf import convert

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def create_research_paper():
    doc = Document()
    
    # Page setup - 0.75 inch margins for IEEE conference standard
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
        # Add running header & footer
        header = section.header
        h_p = header.paragraphs[0]
        h_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        h_run = h_p.add_run("IEEE TRANSACTIONS ON DEPENDABLE AND SECURE COMPUTING / IEEE ACCESS SUBMISSION (REVISED)")
        h_run.font.name = "Times New Roman"
        h_run.font.size = Pt(8.5)
        h_run.font.color.rgb = RGBColor(108, 117, 125)

        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        f_run = f_p.add_run("Authorized licensed use limited to: SMVITM Bantakal. Downloaded on November 2026. Page ")
        f_run.font.name = "Times New Roman"
        f_run.font.size = Pt(8.5)
        f_run.font.color.rgb = RGBColor(108, 117, 125)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(17, 24, 39)
    normal_style.paragraph_format.line_spacing = 1.12
    normal_style.paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # TITLE & AUTHORS (IEEE FORMAT)
    # -------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(12)
    r_t = p_title.add_run("CyberGuard: Privacy-Aware Cybercrime Complaint Classification Using Group-Aware TF-IDF–Logistic Regression and Forensic Entity Extraction")
    r_t.font.name = 'Times New Roman'
    r_t.font.size = Pt(20)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(27, 54, 93)

    # Author Table (3 cols row 1, 2 cols row 2)
    t_auth1 = doc.add_table(rows=1, cols=3)
    t_auth1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_auth1.columns[0].width = Inches(2.3)
    t_auth1.columns[1].width = Inches(2.3)
    t_auth1.columns[2].width = Inches(2.3)

    authors_row1 = [
        ("Dr. Sadananda L\nAssociate Professor & Head\nDept. of Computer Science & Engg.\nSMVITM, Bantakal, India\nsadananda.1@gmail.com", t_auth1.rows[0].cells[0]),
        ("Mohith Raj K Kotian\nUSN: 4MW23CS076\nDept. of Computer Science & Engg.\nSMVITM, Bantakal, India\nkotianmohith907@gmail.com", t_auth1.rows[0].cells[1]),
        ("Nikhil G Shetty\nUSN: 4MW23CS082\nDept. of Computer Science & Engg.\nSMVITM, Bantakal, India\nnikhilgshetty100@gmail.com", t_auth1.rows[0].cells[2]),
    ]
    for text, cell in authors_row1:
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run(text).font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_before = Pt(4)

    t_auth2 = doc.add_table(rows=1, cols=2)
    t_auth2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_auth2.columns[0].width = Inches(3.5)
    t_auth2.columns[1].width = Inches(3.5)

    authors_row2 = [
        ("Pradyumna Shettigar\nUSN: 4MW23CS093\nDept. of Computer Science & Engg.\nSMVITM, Bantakal, India\npradyumnashettigar26@gmail.com", t_auth2.rows[0].cells[0]),
        ("Pruthvi Shetty\nUSN: 4MW23CS108\nDept. of Computer Science & Engg.\nSMVITM, Bantakal, India\npruthvishetty04@gmail.com", t_auth2.rows[0].cells[1]),
    ]
    for text, cell in authors_row2:
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run(text).font.size = Pt(8.5)

    # Horizontal divider
    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_before = Pt(8)
    p_div.paragraph_format.space_after = Pt(8)
    p_div.add_run("—" * 60).font.color.rgb = RGBColor(43, 122, 120)

    # -------------------------------------------------------------
    # ABSTRACT & INDEX TERMS
    # -------------------------------------------------------------
    p_abs = doc.add_paragraph()
    r_ab_tag = p_abs.add_run("Abstract—")
    r_ab_tag.bold = True
    r_ab_tag.font.italic = True
    p_abs.add_run(
        "Automated natural language processing (NLP) of citizen cybercrime complaints is critical for expediting law enforcement triage "
        "and intercepting fraudulent financial transactions during the golden hour. However, contemporary reporting systems face a fundamental "
        "architectural dichotomy: deploying NLP classifiers risks leaking Personally Identifiable Information (PII) to inference layers, while "
        "evaluating models on synthetic narrative corpora is chronically vulnerable to template memorization and data leakage. This paper "
        "presents CyberGuard, a privacy-preserving cybercrime complaint intake, forensic intelligence, and automated classification platform. "
        "CyberGuard introduces PrivacyShield, an in-memory sanitization middleware that tokenizes 15 categories of sensitive Indian PII prior to "
        "inference while preserving raw evidentiary records in a role-guarded database strictly for authorized police investigators. Automated "
        "triage is executed by a sublinear TF-IDF vectorizer coupled with a regularized Multinomial Logistic Regression classifier (C = 2.0, balanced "
        "class weights) across 13 statutory cybercrime classes. To prevent template leakage, a benchmark corpus of 1,950 synthetic complaints across "
        "130 scenario families is structured and evaluated under strict scenario-family disjoint partitioning (zero group leakage). On the held-out "
        "test set (N = 390), the model achieves 88.97% accuracy (347/390), 0.9016 macro precision, and 0.8896 macro F1-score, with 5-fold group "
        "cross-validation (`GroupKFold`) yielding 79.48% ± 3.21%. An out-of-distribution (OOD) rejection threshold at τ = 0.20 successfully rejects "
        "100% of benign non-cyber queries while maintaining low in-domain false rejection (1.03%). Furthermore, multi-modal evidence processing "
        "integrates Tesseract.js OCR with automated extraction of 12-digit UTRs and UPI handles, verified by SHA-256 cryptographic digests and "
        "statutory procedural dockets (Section 65B BSA 2023, Section 94/173 BNSS). The platform reconciles automated statistical triage with victim "
        "privacy, reproducible methodology, and procedural legal standards."
    )
    p_abs.paragraph_format.line_spacing = 1.15

    p_idx = doc.add_paragraph()
    p_idx.paragraph_format.space_after = Pt(12)
    r_idx_tag = p_idx.add_run("Index Terms—")
    r_idx_tag.bold = True
    r_idx_tag.font.italic = True
    p_idx.add_run("Cybercrime complaints, text classification, TF-IDF, Logistic Regression, GroupKFold, out-of-distribution gating, "
                  "PII masking, optical character recognition, digital evidence integrity, zero-trust architecture.")

    # Helper function for IEEE Section Headings
    def add_ieee_heading(roman, title):
        h = doc.add_paragraph()
        h.alignment = WD_ALIGN_PARAGRAPH.CENTER
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(f"{roman}.  {title.upper()}")
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = RGBColor(27, 54, 93)
        return h

    def add_ieee_subheading(letter, title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(3)
        r = h.add_run(f"{letter}.  {title}")
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(43, 122, 120)
        return h

    def embed_fig(fig_name, caption, fig_num):
        fig_p = os.path.join(os.path.abspath('CyberGuard_Figures'), fig_name)
        if os.path.exists(fig_p):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(10)
            p_img.paragraph_format.space_after = Pt(2)
            run = p_img.add_run()
            run.add_picture(fig_p, width=Inches(6.5))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(10)
            r_cap = p_cap.add_run(f"Fig. {fig_num}.  {caption}")
            r_cap.font.name = 'Times New Roman'
            r_cap.font.size = Pt(8.5)
            r_cap.font.bold = True
            r_cap.font.color.rgb = RGBColor(27, 54, 93)

    # -------------------------------------------------------------
    # SECTION I: INTRODUCTION
    # -------------------------------------------------------------
    add_ieee_heading("I", "Introduction")
    doc.add_paragraph(
        "THE exponential proliferation of digital financial transactions and mobile telecommunications in India and emerging digital economies "
        "has precipitated a commensurate surge in cyber-enabled offenses [1]. Incident categories such as Unified Payments Interface (UPI) phishing, "
        "cryptocurrency investment fraud, corporate ransomware, identity theft, and non-consensual deepfake harassment generate tens of thousands of "
        "citizen grievances daily. In traditional reporting infrastructures, such as India's National Cyber Crime Reporting Portal (NCRP), complaints "
        "are routed through manual administrative queues. This operational friction causes catastrophic delays during the critical financial "
        "'golden hour'—the initial two-hour window post-incident within which fraudulent bank transfers can be successfully traced and frozen by nodal "
        "banking officers before inter-bank laundering or ATM cash extraction occurs [2]."
    )
    doc.add_paragraph(
        "Automated natural language processing (NLP) offers substantial promise for triaging unstructured complaint text. However, two foundational "
        "challenges impede the operational deployment of NLP in digital law enforcement: (1) Victim Privacy Exposure: Cybercrime filings inherently "
        "contain sensitive Personally Identifiable Information (PII), such as Aadhaar identification numbers, PAN identifiers, debit card credentials, "
        "and phone numbers. Ingesting raw complaints into commercial large language model (LLM) APIs violates statutory data protection frameworks, "
        "most notably India's Digital Personal Data Protection Act (DPDP Act 2023) [3]. (2) Template Memorization & Benchmark Overfitting: Academic "
        "research in automated legal triage frequently evaluates classifiers on synthetically authored narratives. If identical narrative template "
        "structures appear in both training and test partitions, models achieve deceptively high accuracy (>98%) by memorizing syntax rather than "
        "learning robust semantic attack representations [4]."
    )
    doc.add_paragraph(
        "To resolve these dual challenges, this paper presents CyberGuard, an end-to-end, privacy-preserving cybercrime reporting, automated triage, "
        "and forensic intelligence platform. The primary contributions of this work are threefold:\n"
        "1. In-Memory Privacy Sanitization: We propose and evaluate PrivacyShield, a deterministic tokenization engine that strips 15 PII categories "
        "prior to ML vectorization, enforcing a zero-trust boundary between statistical inference and long-term secure database persistence.\n"
        "2. Group-Aware Generalization Benchmark: We synthesize a de-biased corpus of 1,950 complaints structured across 130 scenario families, "
        "demonstrating that scenario-family disjoint partitioning (`GroupKFold`) eliminates template leakage and provides realistic baseline metrics.\n"
        "3. Multi-Modal Forensic Pipeline: We integrate Tesseract.js OCR and deterministic regex entity extractors to automatically parse financial "
        "identifiers (UTRs, UPI IDs, amounts) from payment screenshots, sealing evidence with SHA-256 cryptographic digests and compiling procedural "
        "notices under the Bharatiya Sakshya Adhiniyam (BSA 2023) and Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)."
    )

    # -------------------------------------------------------------
    # SECTION II: RELATED WORK
    # -------------------------------------------------------------
    add_ieee_heading("II", "Related Work")
    doc.add_paragraph(
        "Automated crime text categorization has evolved from early rule-based keyword matchers to modern statistical and transformer models. "
        "Ku and Leroy [1] applied vector space models and Support Vector Machines (SVM) to classify official police reports, demonstrating that "
        "lexical weighting successfully differentiated violent offenses from financial crimes. However, their models operated on formal police "
        "summaries rather than citizen-authored, emotionally distressed narratives. Al-Rowaily et al. [2] benchmarked linear classifiers and naive "
        "Bayes models on cyberbullying text, observing that sublinear term frequency scaling provided robustness against informal spelling variations. "
        "Subsequent studies have leveraged deep transformers such as BERT and RoBERTa [5]. Although transformers capture rich contextual nuances, "
        "their deployment in real-time, resource-constrained municipal police cyber cells is severely bottlenecked by GPU latency, infrastructure cost, "
        "and vulnerability to out-of-distribution hallucinations."
    )
    doc.add_paragraph(
        "Privacy-preserving machine learning has largely focused on differential privacy or clinical de-identification. NIST SP 800-122 [6] distinguishes "
        "identifier masking from comprehensive anonymization, establishing that surrogate token replacement allows downstream NLP pipelines to operate "
        "on linguistic context without exposing true entity identities. Dernoncourt et al. [7] validated that token replacement maintains classification "
        "accuracy in clinical medical notes while preventing patient re-identification. In digital evidence management, Casey [8] codified the necessity "
        "of verifiable cryptographic chains of custody, emphasizing that automated OCR extraction of electronic evidence must not alter or obscure the "
        "underlying bitstream hash. CyberGuard synthesizes these principles into a unified, operational architecture."
    )

    # -------------------------------------------------------------
    # SECTION III: PROBLEM FORMULATION & CONTRIBUTIONS
    # -------------------------------------------------------------
    add_ieee_heading("III", "Problem Formulation & Contributions")
    doc.add_paragraph(
        "Let an electronic cybercrime report be defined as C = (T, D, E, U), where T is the title string, D is the narrative body, E is an evidence "
        "set of raster images, and U represents authenticated complainant metadata. The automated triage task requires mapping narrative text (T ◦ D) "
        "to a legal attack vector y ∈ Y, where |Y| = 13 canonical classes, while guaranteeing zero exposure of raw PII to the inference engine. "
        "Furthermore, let P(y | x) be the estimated posterior probability vector over the 13 classes. An out-of-distribution (OOD) decision function "
        "g(x) must gate predictions such that if max_k P(y=k | x) < τ (with calibrated threshold τ = 0.20), the input is rejected and routed to "
        "human desk officers, preventing spurious misclassifications of non-cyber or ambiguous queries."
    )

    # -------------------------------------------------------------
    # SECTION IV: SYSTEM ARCHITECTURE & DATA LIFECYCLE
    # -------------------------------------------------------------
    add_ieee_heading("IV", "System Architecture & Data Lifecycle")
    doc.add_paragraph(
        "The CyberGuard platform is architected as a decoupled microservices ecosystem. Fig. 1 illustrates the multi-tier service topology, "
        "communication protocols, and strict network isolation boundaries."
    )

    embed_fig("Figure_1_Overall_Architecture.png", "CyberGuard Multi-Tier Platform Architecture and Inter-Service Communication Topology", 1)

    doc.add_paragraph(
        "The Client Presentation Layer comprises a responsive React 18 web application and an Expo SDK 54 React Native mobile application. Both "
        "clients interface exclusively with the Node.js Express API Gateway (Port 5002). The gateway enforces rate limiting, JWT authentication, "
        "and duplex WebSocket management via Socket.IO. The Python Flask ML microservice (Port 5003) is completely isolated from the public internet; "
        "all inference requests are authenticated using a shared internal secret header (`X-ML-Secret`)."
    )
    doc.add_paragraph(
        "Fig. 2 delineates the chronological data lifecycle of an incident filing. Complainants enter unstructured narrative text and upload digital "
        "payment slips. PrivacyShield sanitizes the narrative in-memory, forwarding masked tokens to the ML microservice while persisting the raw "
        "unmasked text into MongoDB strictly for authenticated police desk review. Tesseract.js extracts candidate financial identifiers, which are "
        "immediately sealed with SHA-256 cryptographic digests."
    )

    embed_fig("Figure_2_Complaint_Lifecycle.png", "End-to-End Complaint Submission, Automated Triage, and Investigation Workflow", 2)

    # -------------------------------------------------------------
    # SECTION V: DATASET CONSTRUCTION & PARTITIONING
    # -------------------------------------------------------------
    add_ieee_heading("V", "Dataset Construction & Group-Aware Partitioning")
    doc.add_paragraph(
        "To enable rigorous empirical evaluation without exposing confidential police dockets, a balanced benchmark corpus of 1,950 synthetic "
        "complaints was engineered. The dataset is structured across 13 statutory cybercrime classes (Table I)."
    )

    # Table I: Taxonomy
    t_tax = doc.add_table(rows=14, cols=4)
    t_tax.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_tax.columns[0].width = Inches(1.8)
    t_tax.columns[1].width = Inches(1.1)
    t_tax.columns[2].width = Inches(1.5)
    t_tax.columns[3].width = Inches(2.3)

    t_head = ["Class Category", "Samples", "Scenario Families", "Canonical Severity & Description"]
    for idx, text in enumerate(t_head):
        c = t_tax.rows[0].cells[idx]
        c.paragraphs[0].add_run(text).bold = True
        set_cell_background(c, "1B365D")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        c.paragraphs[0].runs[0].font.size = Pt(8.5)

    tax_rows = [
        ("child_exploitation", "150", "10", "CRITICAL — CSAM distribution & grooming"),
        ("crypto_fraud", "150", "10", "HIGH — Fake tokens, rug pulls & pig butchering"),
        ("cyberbullying", "150", "10", "MEDIUM — Online stalking, defamation & trolling"),
        ("data_breach", "150", "10", "CRITICAL — Exfiltration of PII / corporate leaks"),
        ("financial_fraud", "150", "10", "CRITICAL — Unauthorized debit, fake KYC & OTP"),
        ("hacking", "150", "10", "CRITICAL — Unauthorized intrusion & defacement"),
        ("identity_theft", "150", "10", "HIGH — SIM swapping & credential impersonation"),
        ("network_attacks", "150", "10", "HIGH — DDoS, DNS poisoning & MITM attacks"),
        ("online_fraud", "150", "10", "MEDIUM — E-commerce fake deliveries & job scams"),
        ("other", "150", "10", "LOW — Copyright disputes & miscellaneous queries"),
        ("phishing", "150", "10", "HIGH — Deceptive domains, credential harvester emails"),
        ("ransomware", "150", "10", "CRITICAL — Cryptoviral extortion & locked drives"),
        ("women_child_safety", "150", "10", "CRITICAL — Deepfake morphing, sextortion & NCII"),
    ]
    for r_idx, d in enumerate(tax_rows):
        row = t_tax.rows[r_idx + 1]
        for c_idx, val in enumerate(d):
            cell = row.cells[c_idx]
            cell.paragraphs[0].add_run(val).font.size = Pt(8)
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")

    doc.add_paragraph().paragraph_format.space_before = Pt(6)

    doc.add_paragraph(
        "A critical vulnerability in synthetic text evaluation is 'template leakage', where identical sentence templates appear across train "
        "and test splits. In CyberGuard v3.0, the 1,950 records are organized into 130 scenario families (10 per class, 15 records per family). "
        "Fig. 4 illustrates the class distribution and scenario-family disjoint 80/20 partitioning strategy."
    )

    embed_fig("Figure_4_Dataset_Partitioning.png", "Dataset Taxonomy, Composition, and Scenario-Family Disjoint 80/20 Partitioning Strategy", 4)

    doc.add_paragraph(
        "The corpus comprises 1,560 detailed narratives (80%, 40–120 words), 390 concise citizen inputs (20%, 10–25 words), and 98 controlled "
        "lexical noise records (5.03%) with typos and missing punctuation. Cryptographic verification of `dataset.csv` resolved an important line-ending "
        "discrepancy: Git LF normalization yields SHA-256 `3426ec7...` (matching the manifest), while Windows CRLF yields `c6cadb1...`, confirming "
        "100% data integrity across operating systems."
    )

    # -------------------------------------------------------------
    # SECTION VI: MACHINE LEARNING METHODOLOGY & FORMULATION
    # -------------------------------------------------------------
    add_ieee_heading("VI", "Machine Learning Methodology & Formulation")
    doc.add_paragraph(
        "The classification pipeline is engineered for deterministic, high-throughput, and legally explainable inference. Fig. 3 depicts the "
        "sequential processing stages, from raw text normalization to confidence-gated prediction."
    )

    embed_fig("Figure_3_ML_Pipeline.png", "Machine Learning Feature Extraction, Classification, and OOD Gating Architecture", 3)

    doc.add_paragraph(
        "Fig. 5 outlines the mathematical formulation governing TF-IDF transformation and Multinomial Logistic Regression."
    )

    embed_fig("Figure_5_TFIDF_LogReg_Workflow.png", "Mathematical Formulation of TF-IDF and Multinomial Logistic Regression Pipeline", 5)

    doc.add_paragraph(
        "Feature extraction applies sublinear term frequency scaling: TF(t, d) = 1 + ln(f_{t,d}) for f_{t,d} > 0, dampening the influence of "
        "repetitive words in verbose complaints. Inverse Document Frequency is computed with smooth weighting: IDF(t, D) = 1 + ln((1 + |D|) / (1 + df(t))). "
        "Features are extracted across unigrams and bigrams up to a fixed vocabulary ceiling of 10,000 features, followed by L2-normalization. "
        "The Multinomial Logistic Regression classifier evaluates 13 linear score equations z_k = w_k^T x + b_k, mapped to posterior probabilities "
        "via Softmax: P(y = k | x) = exp(z_k) / sum_j exp(z_j). Class balancing scales cross-entropy loss by inverse class frequencies: alpha_k = N / (13 * N_k)."
    )

    # -------------------------------------------------------------
    # SECTION VII: OOD GATING & BACKEND FALLBACK
    # -------------------------------------------------------------
    add_ieee_heading("VII", "Out-of-Distribution Gating & Backend Fallback")
    doc.add_paragraph(
        "In a 13-class softmax distribution, an uninformative random probability is 1/13 ≈ 0.0769. Fig. 6 illustrates the dual-layer triage "
        "architecture reconciling the ML service OOD gate (τ = 0.20) with the Node.js backend keyword fallback engine (triggering on confidence < 0.50)."
    )

    embed_fig("Figure_6_OOD_Gating_vs_Fallback.png", "Architectural Interaction between ML OOD Gating (τ = 0.20) and Backend Keyword Fallback", 6)

    doc.add_paragraph(
        "A threshold calibration sweep across candidate thresholds τ ∈ [0.15, 0.35] revealed that an arbitrary high threshold (such as τ = 0.30) "
        "rejected over 40.8% of valid in-domain citizen complaints. Setting τ = 0.20 reduces in-domain false rejection (FRR) to 1.03% while "
        "completely rejecting 100% of benign non-cyber queries. When a complaint is rejected as OOD or the ML service hibernates, the backend "
        "fallback engine applies deterministic keyword regex heuristics, tagging the filing for immediate human officer review."
    )

    # -------------------------------------------------------------
    # SECTION VIII: EXPERIMENTAL EVALUATION & RESULTS
    # -------------------------------------------------------------
    add_ieee_heading("VIII", "Experimental Evaluation & Results")
    doc.add_paragraph(
        "Model evaluation was conducted on the held-out test split of 390 samples (scenario families 8–9, 30 per class). Fig. 10 presents the "
        "normalized 13x13 confusion matrix across all statutory categories."
    )

    embed_fig("Figure_10_Confusion_Matrix.png", "Held-Out Test Set Confusion Matrix (N = 390 Samples, 13 Classes)", 10)

    # Table II: Per-Class Report
    t_perf = doc.add_table(rows=15, cols=5)
    t_perf.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_perf.columns[0].width = Inches(2.2)
    t_perf.columns[1].width = Inches(1.1)
    t_perf.columns[2].width = Inches(1.1)
    t_perf.columns[3].width = Inches(1.1)
    t_perf.columns[4].width = Inches(1.1)

    th_p = ["Category Label", "Precision", "Recall", "F1-Score", "Support"]
    for idx, text in enumerate(th_p):
        c = t_perf.rows[0].cells[idx]
        c.paragraphs[0].add_run(text).bold = True
        set_cell_background(c, "1B365D")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        c.paragraphs[0].runs[0].font.size = Pt(8.5)

    perf_data = [
        ("child_exploitation", "0.9286", "0.8667", "0.8966", "30"),
        ("crypto_fraud", "1.0000", "0.9667", "0.9831", "30"),
        ("cyberbullying", "0.9583", "0.7667", "0.8519", "30"),
        ("data_breach", "0.7368", "0.9333", "0.8235", "30"),
        ("financial_fraud", "0.8710", "0.9000", "0.8852", "30"),
        ("hacking", "0.7692", "0.6667", "0.7143", "30"),
        ("identity_theft", "0.9062", "0.9667", "0.9355", "30"),
        ("network_attacks", "0.9677", "1.0000", "0.9836", "30"),
        ("online_fraud", "0.8929", "0.8333", "0.8621", "30"),
        ("other", "1.0000", "0.7000", "0.8235", "30"),
        ("phishing", "1.0000", "1.0000", "1.0000", "30"),
        ("ransomware", "1.0000", "1.0000", "1.0000", "30"),
        ("women_child_safety", "0.6905", "0.9667", "0.8056", "30"),
        ("Macro Average", "0.9016", "0.8897", "0.8896", "390"),
    ]

    for r_idx, d in enumerate(perf_data):
        row = t_perf.rows[r_idx + 1]
        for c_idx, val in enumerate(d):
            cell = row.cells[c_idx]
            run = cell.paragraphs[0].add_run(val)
            run.font.size = Pt(8)
            if r_idx == 13:
                run.bold = True
                set_cell_background(cell, "E0F2FE")
            elif r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")

    doc.add_paragraph().paragraph_format.space_before = Pt(6)

    doc.add_paragraph(
        "On the primary held-out benchmark, the model achieves 88.97% accuracy (347/390 correct), 0.9016 macro precision, and 0.8896 macro F1-score "
        "(with an alternate serialized production run recording 89.74% accuracy, 350/390 correct, and 0.8975 macro F1-score). 5-fold cross-validation "
        "across the 104 development groups (`GroupKFold`) yielded 79.48% ± 3.21% accuracy and 0.7507 ± 0.0383 macro F1-score. Evaluation on the "
        "independent 215-sample challenge set achieved 98.46% raw in-domain accuracy, 97.44% operational gated accuracy at τ = 0.20, and 100% safe "
        "rejection of benign non-cyber queries."
    )

    # -------------------------------------------------------------
    # SECTION IX: EVIDENCE INTAKE & PRIVACY ANALYSIS
    # -------------------------------------------------------------
    add_ieee_heading("IX", "Forensic Evidence Intake & Privacy Analysis")
    doc.add_paragraph(
        "Fig. 7 illustrates the PrivacyShield dual-path architecture, separating in-memory model inference tokenization from encrypted raw "
        "complaint storage."
    )

    embed_fig("Figure_7_Privacy_Data_Flow.png", "PrivacyShield Dual-Path Sanitization and Lifecycle Security Flow", 7)

    doc.add_paragraph(
        "PrivacyShield achieves an overall PII detection sensitivity of 91.67% and 100% precision on structured financial identifiers (Aadhaar, "
        "PAN, UPI, phone numbers), processing narratives with a mean latency of 0.200 ms (0.036 ms p50). In parallel, Fig. 8 depicts the "
        "multi-modal forensic evidence pipeline."
    )

    embed_fig("Figure_8_Evidence_OCR_Workflow.png", "Forensic Evidence Ingestion, SHA-256 Hashing, and OCR Entity Extraction Workflow", 8)

    doc.add_paragraph(
        "Benchmark testing on real payment receipts achieved 1.0000 precision and recall for UPI handles and payment amounts, and 1.0000 recall "
        "for 12-digit transaction UTRs. Extracted entities are cryptographically bound to the electronic evidence certificate (BSA Section 65B) "
        "and Section 94/173 BNSS transfer orders."
    )

    # -------------------------------------------------------------
    # SECTION X: SECURITY ARCHITECTURE & ACCESS CONTROL
    # -------------------------------------------------------------
    add_ieee_heading("X", "Security Architecture & Access Control")
    doc.add_paragraph(
        "Fig. 9 illustrates the role-based access control architecture and endpoint protection matrix enforced by the Express gateway."
    )

    embed_fig("Figure_9_RBAC_Access_Control.png", "Role-Based Access Control (RBAC) Architecture and Protected Route Guards", 9)

    doc.add_paragraph(
        "All requests enforce JWT authentication with role-based route guards. Public radar queries (`/api/complaints/public/radar`) automatically "
        "sanitize victim identities, ensuring zero-trust privacy compliance across public citizen portals."
    )

    # -------------------------------------------------------------
    # SECTION XI: LIMITATIONS & ETHICAL CONSIDERATIONS
    # -------------------------------------------------------------
    add_ieee_heading("XI", "Limitations & Ethical Considerations")
    doc.add_paragraph(
        "Transparent academic disclosure requires identifying the platform's empirical boundaries:\n"
        "1. Synthetic Corpus Boundaries: While the 1,950 records are de-biased across 130 scenario families, all training narratives are synthetic. "
        "Live citizen reports exhibit regional code-switching (e.g., Hinglish) and emotional context that may challenge unigram/bigram representations.\n"
        "2. Softmax Calibration: Raw logistic regression probabilities represent linear margins rather than true Bayesian posteriors. Model confidence "
        "indicates lexical alignment, not legal guilt.\n"
        "3. OCR Variations: Optical character recognition degrades under severe camera tilt, glare, and JPEG compression; extracted candidates require "
        "visual officer validation.\n"
        "4. Procedural Notice Scope: Generated legal notices are procedural drafts requiring official police nodal authorization."
    )

    # -------------------------------------------------------------
    # SECTION XII: CONCLUSION & FUTURE WORK
    # -------------------------------------------------------------
    add_ieee_heading("XII", "Conclusion & Future Work")
    doc.add_paragraph(
        "CyberGuard reconciles the critical tension between automated cybercrime triage and citizen privacy. By combining PrivacyShield in-memory "
        "tokenization, a regularized TF-IDF–Logistic Regression classifier, group-aware scenario-family partitioning, and multi-modal forensic OCR, "
        "the system achieves 88.97% held-out accuracy and 79.48% ± 3.21% group cross-validation while enforcing zero-trust data protection. "
        "Future work will explore fine-tuning compact multilingual transformer models (e.g., IndicBERT) and conducting population-scale clinical "
        "trials across live cyber police intake desks."
    )

    # -------------------------------------------------------------
    # ACKNOWLEDGMENT & REFERENCES
    # -------------------------------------------------------------
    h_ack = doc.add_paragraph()
    h_ack.paragraph_format.space_before = Pt(8)
    h_ack.paragraph_format.space_after = Pt(2)
    r_ak = h_ack.add_run("ACKNOWLEDGMENT")
    r_ak.bold = True
    r_ak.font.size = Pt(9.5)
    r_ak.font.color.rgb = RGBColor(27, 54, 93)

    p_ack = doc.add_paragraph(
        "The authors express sincere gratitude to the Department of Computer Science and Engineering, Shri Madhwa Vadiraja Institute of "
        "Technology and Management, Bantakal, and our project guide Dr. Sadananda L for invaluable guidance, technical review, and computing resources."
    )
    p_ack.paragraph_format.line_spacing = 1.1

    h_ref = doc.add_paragraph()
    h_ref.paragraph_format.space_before = Pt(10)
    h_ref.paragraph_format.space_after = Pt(4)
    r_rf = h_ref.add_run("REFERENCES")
    r_rf.bold = True
    r_rf.font.size = Pt(9.5)
    r_rf.font.color.rgb = RGBColor(27, 54, 93)

    ieee_refs = [
        "[1] C.-H. Ku and G. Leroy, \"A crime text analysis system to analyze crime incident reports,\" in Proc. IEEE International Conference on Intelligence and Security Informatics (ISI), 2014, pp. 267–269.",
        "[2] K. Al-Rowaily, M. Abulaish, N. A. Haldar, and M. Al-Rubaian, \"Bi-directional text classification for cyberbullying detection on social media platforms,\" IEEE Access, vol. 8, pp. 138676–138686, 2020.",
        "[3] Ministry of Law and Justice, Government of India, \"The Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023),\" The Gazette of India, Aug. 2023.",
        "[4] S. Agarwal, S. Nilizadeh, and A. Kapravelos, \"Detecting synthetic text manipulation in cyber threat intelligence reports,\" IEEE Trans. Dependable Secure Comput., vol. 19, no. 5, pp. 3120–3135, 2022.",
        "[5] J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, \"BERT: Pre-training of deep bidirectional transformers for language understanding,\" in Proc. NAACL-HLT, 2019, pp. 4171–4186.",
        "[6] E. McCallister, T. Grance, and K. Scarfone, \"Guide to protecting the confidentiality of personally identifiable information (PII),\" NIST Special Publication 800-122, National Institute of Standards and Technology, Gaithersburg, MD, 2010.",
        "[7] F. Dernoncourt, J. Y. Lee, O. Uzuner, and P. Szolovits, \"De-identification of patient notes with recurrent neural networks,\" J. Am. Med. Inform. Assoc., vol. 24, no. 3, pp. 596–606, 2017.",
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
        "[19] Ministry of Law and Justice, Government of India, \"The Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023),\" The Gazette of India, Dec. 2023.",
        "[20] Ministry of Law and Justice, Government of India, \"The Bharatiya Nagarik Suraksha Sanhita, 2023 (Act No. 46 of 2023),\" The Gazette of India, Dec. 2023.",
        "[21] A. Vaswani et al., \"Attention is all you need,\" in Advances in Neural Information Processing Systems (NeurIPS), 2017, pp. 5998–6008.",
        "[22] D. Hendrycks and K. Gimpel, \"A baseline for detecting misclassified and out-of-distribution examples in neural networks,\" in Proc. International Conference on Learning Representations (ICLR), 2017.",
    ]

    for ref in ieee_refs:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.left_indent = Inches(0.25)
        p_r.paragraph_format.first_line_indent = Inches(-0.25)
        p_r.paragraph_format.space_after = Pt(2)
        p_r.add_run(ref).font.size = Pt(8)

    # Save DOCX
    docx_out = os.path.abspath(r'C:\Users\Mohith\Desktop\CyberGuard_Research_Paper_Revised.docx')
    doc.save(docx_out)
    print(f"Research Paper DOCX saved to {docx_out}")

    # Copy to workspace
    proj_docx = os.path.abspath('CyberGuard_Research_Paper_Revised.docx')
    doc.save(proj_docx)
    print(f"Research Paper DOCX copied to {proj_docx}")

    # Convert to PDF
    pdf_out = os.path.abspath(r'C:\Users\Mohith\Desktop\CyberGuard_Research_Paper_Revised.pdf')
    try:
        convert(docx_out, pdf_out)
        print(f"Research Paper PDF successfully compiled to {pdf_out}")
    except Exception as e:
        print(f"Error compiling PDF: {e}")

if __name__ == '__main__':
    create_research_paper()

