"""
generate_figures_bw.py
======================
Generates all 6 strict black-and-white publication-quality IEEE figures for CyberGuard:
  Fig. 1: System architecture and service topology (Enlarged labels, clean non-overlapping routing)
  Fig. 2: Complaint processing workflow and triage flowchart (Horizontal 3-lane flowchart, enlarged text)
  Fig. 3: Class distribution of the 1,950-sample synthetic dataset
  Fig. 4: PrivacyShield model-input PII masking pipeline (Enlarged labels, clear separation)
  Fig. 5: Confusion matrix on the 390-sample held-out test partition (Reconciled 89.74%, 350/390)
  Fig. 6: Candidate classifier comparison across five-fold GroupKFold CV

Design: Strict IEEE monochrome, white backgrounds, black borders, black text,
clean lines and arrows, zero colors, zero gradients, zero shadows, ZERO OVERLAPPING TEXT.
"""

import os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Set global matplotlib font and styling for IEEE publications
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman', 'DejaVu Serif', 'Times', 'serif']
plt.rcParams['mathtext.fontset'] = 'cm'
plt.rcParams['text.color'] = 'black'
plt.rcParams['axes.labelcolor'] = 'black'
plt.rcParams['xtick.color'] = 'black'
plt.rcParams['ytick.color'] = 'black'

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'Figures')
os.makedirs(OUT_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# FIGURE 1: System Architecture and Service Topology (HIGH READABILITY & ZERO OVERLAP)
# -----------------------------------------------------------------------------
def generate_fig1():
    print("Generating Figure 1: System Architecture (High-Readability Non-Overlapping Layout)...")
    fig, ax = plt.subplots(figsize=(14.0, 8.4), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    def draw_box(x, y, w, h, title, subtitle='', style='solid', lw=1.2, fill='white'):
        rect = patches.Rectangle((x, y), w, h, linewidth=lw, edgecolor='black',
                                 facecolor=fill, linestyle=style, zorder=3)
        ax.add_patch(rect)
        if subtitle:
            ax.text(x + w/2, y + h/2 + 1.4, title, ha='center', va='center',
                    fontsize=9.0, fontweight='bold', color='black', zorder=4)
            ax.text(x + w/2, y + h/2 - 1.5, subtitle, ha='center', va='center',
                    fontsize=7.8, color='black', zorder=4)
        else:
            ax.text(x + w/2, y + h/2, title, ha='center', va='center',
                    fontsize=8.8, fontweight='bold', color='black', zorder=4)

    def draw_layer_frame(x, y, w, h, title, subtitle='', title_x=None, title_y=None, ha='center'):
        rect = patches.Rectangle((x, y), w, h, linewidth=1.1, edgecolor='black',
                                 facecolor='white', linestyle='--', zorder=1)
        ax.add_patch(rect)
        
        full_title = f"{title}\n{subtitle}" if subtitle else title
        ax.text(title_x, title_y, full_title, ha=ha, va='center',
                fontsize=8.2, fontweight='bold', color='black', zorder=4,
                bbox=dict(boxstyle='square,pad=0.35', facecolor='white', edgecolor='black', lw=0.9))

    # 1. Client Layer (y: 84 - 98)
    draw_layer_frame(3.5, 84, 93, 14, '1. CLIENT LAYER (WEB & MOBILE)', title_x=19, title_y=96.0)
    draw_box(5.5, 85.5, 27, 8.5, 'Citizen Web Application', 'React 18 / Tailwind CSS (Port 3000)')
    draw_box(36.5, 85.5, 27, 8.5, 'Mobile Application', 'React Native / Expo SDK 54')
    draw_box(67.5, 85.5, 27, 8.5, 'Officer & Admin Dashboard', 'React 18 / Role Triage Console')

    # 2. Backend & API Gateway Layer (y: 52 - 78)
    draw_layer_frame(3.5, 52, 93, 26, '2. BACKEND & API GATEWAY LAYER', 'Node.js / Express — Port 5002', title_x=12.5, title_y=75.6)
    draw_box(5.5, 63.5, 27, 9.0, 'Input Validation & Router', 'Express BodyParser / Sanitization')
    draw_box(36.5, 63.5, 27, 9.0, 'Authentication & RBAC', 'JWT Middleware / Role Verification')
    draw_box(67.5, 63.5, 27, 9.0, 'Status & Notification Dispatch', 'Timeline Engine / Room Emitter')

    draw_box(5.5, 53.5, 42, 7.8, 'PrivacyShield PII Masking Engine', 'Regex Detection & Tokenization (<EMAIL_1>, <PHONE_1>)')
    draw_box(54.5, 53.5, 42, 7.8, 'High-Availability Keyword Fallback', 'Deterministic Rule Engine (Invoked on ML Timeout)')

    # 3. Machine Learning Microservice Layer (y: 24 - 47, Left)
    draw_layer_frame(3.5, 24, 45, 23, '3. ML CLASSIFIER SERVICE', 'Flask Microservice — Port 5003', title_x=26.5, title_y=44.2)
    draw_box(5.5, 25.5, 13.5, 14.5, 'TF-IDF\nVectorizer', '1–2 N-grams\n10,000 Feat.')
    draw_box(21, 25.5, 13.5, 14.5, 'Logistic\nRegression', 'C=2.0\nSoftmax Vector')
    draw_box(36.5, 25.5, 10.5, 14.5, 'OOD\nGating', r'Threshold' + '\n' + r'$\tau=0.20$')

    # 4. Evidence Processing Layer (y: 24 - 47, Right)
    draw_layer_frame(51.5, 24, 45, 23, '4. EVIDENCE & OCR PIPELINE', 'Tesseract.js & Multer Ingestion', title_x=74.5, title_y=44.2)
    draw_box(53.5, 25.5, 13.5, 14.5, 'Evidence File\nIngestion', 'Multipart Multer\nDisk Buffer')
    draw_box(69, 25.5, 13.5, 14.5, 'Tesseract.js\nOCR Worker', 'English OCR\nWorker Thread')
    draw_box(84.5, 25.5, 10.5, 14.5, 'Entity\nParser', 'UPI / Phone\nRegex Extractor')

    # 5. Database & Persistence Layer (y: 3.5 - 20, Left)
    draw_layer_frame(3.5, 3.5, 45, 17.5, '5. DATABASE & PERSISTENCE', 'MongoDB / Mongoose ODM — Port 27017', title_x=26, title_y=18.5)
    draw_box(5.5, 4.8, 41, 11.2, 'MongoDB / Mongoose ODM',
             'Collections: Complaints (Raw Narrative), Users,\nTimelines, Extracted OCR Text, Audit Logs')

    # 6. Officer Triage & Realtime Gateway Layer (y: 3.5 - 20, Right)
    draw_layer_frame(51.5, 3.5, 45, 17.5, '6. OFFICER TRIAGE & REALTIME GATEWAY', 'Role-Based Triage & Event Broadcast', title_x=74, title_y=18.5)
    draw_box(53.5, 4.8, 20, 11.2, 'Officer Review Console',
             'Manual Desk Triage,\nCase Status Updates,\nInvestigation Escalation')
    draw_box(75.5, 4.8, 19, 11.2, 'Socket.IO Gateway',
             'Live Room Broadcast,\nRealtime Alerts,\nAudit Logging')

    def draw_arrow(x1, y1, x2, y2, label='', label_pos=(0, 0), ha='center', dashed=False, style='->'):
        ls = '--' if dashed else '-'
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle=style, color='black', lw=1.2, ls=ls), zorder=5)
        if label:
            lx = (x1 + x2)/2 + label_pos[0]
            ly = (y1 + y2)/2 + label_pos[1]
            ax.text(lx, ly, label, ha=ha, va='center',
                    fontsize=7.4, fontweight='bold', color='black',
                    bbox=dict(boxstyle='square,pad=0.25', facecolor='white', edgecolor='black', lw=0.6), zorder=6)

    # Clients -> Backend (Arrows placed at non-overlapping positions)
    draw_arrow(25, 85.5, 25, 72.5, 'Complaint Submission (JSON)', (0, 0))
    draw_arrow(50, 85.5, 50, 72.5, 'Mobile Intake', (0, 0))
    draw_arrow(81, 72.5, 81, 85.5, 'Telemetry / Live Status', (0, 0))

    # Internal Backend connections
    draw_arrow(19, 63.5, 19, 61.3)
    draw_arrow(81, 63.5, 81, 61.3)
    draw_arrow(32.5, 68.0, 36.5, 68.0)

    # Backend -> ML Layer (Vertical down into TF-IDF at x=11.5)
    draw_arrow(11.5, 53.5, 11.5, 40.0, 'Masked Text Payload', (-1.8, 0), ha='right')

    # ML Internal horizontal pipeline
    draw_arrow(19, 32.75, 21, 32.75)
    draw_arrow(34.5, 32.75, 36.5, 32.75)

    # ML Layer -> Backend (Vertical up from OOD Gating at x=41.5)
    draw_arrow(41.5, 40.0, 41.5, 53.5, 'Category + Softmax', (1.8, 0), ha='left')

    # Backend -> Evidence Layer (Vertical down into Ingestion at x=59.5)
    draw_arrow(59.5, 53.5, 59.5, 40.0, 'Evidence Files', (-1.8, 0), ha='right')

    # Evidence Internal horizontal pipeline
    draw_arrow(67, 32.75, 69, 32.75)
    draw_arrow(82.5, 32.75, 84.5, 32.75)

    # Evidence Layer -> Backend (Vertical up from Entity Parser at x=89.5)
    draw_arrow(89.5, 40.0, 89.5, 53.5, 'OCR Text & Entities', (1.8, 0), ha='left')

    # Left Margin: Backend -> MongoDB Persistence
    ax.plot([5.5, 1.6, 1.6, 5.5], [57.4, 57.4, 10.4, 10.4], color='black', lw=1.2, zorder=5)
    ax.annotate('', xy=(5.5, 10.4), xytext=(2.6, 10.4),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.2), zorder=5)
    ax.text(1.6, 33.5, 'Persist Raw Narrative & Case Records', ha='center', va='center',
            fontsize=7.2, fontweight='bold', color='black',
            bbox=dict(boxstyle='square,pad=0.25', facecolor='white', edgecolor='black', lw=0.6),
            rotation=90, zorder=6)

    # Right Margin: Socket.IO -> Backend
    ax.plot([94.5, 98.4, 98.4, 94.5], [10.4, 10.4, 57.4, 57.4], color='black', lw=1.2, zorder=5)
    ax.annotate('', xy=(94.5, 57.4), xytext=(97.4, 57.4),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.2), zorder=5)
    ax.text(98.4, 33.5, 'WebSocket Push / Event Dispatch', ha='center', va='center',
            fontsize=7.2, fontweight='bold', color='black',
            bbox=dict(boxstyle='square,pad=0.25', facecolor='white', edgecolor='black', lw=0.6),
            rotation=-90, zorder=6)

    # Central Gutter: MongoDB <-> Officer Review Console
    draw_arrow(46.5, 10.4, 53.5, 10.4, 'Query / Update', (0, 2.2), style='<->')

    # Officer Review Console -> Socket.IO Gateway
    draw_arrow(73.5, 10.4, 75.5, 10.4)

    plt.tight_layout()
    p = os.path.join(OUT_DIR, 'Figure1_System_Architecture.png')
    plt.savefig(p, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {p}")

def generate_fig2():
    print("Generating Figure 2: Complaint Processing Workflow (Enlarged Readability Layout)...")
    fig, ax = plt.subplots(figsize=(14.0, 5.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    def draw_proc(x, y, w, h, text, style='solid', lw=1.3, fill='white'):
        rect = patches.Rectangle((x, y), w, h, linewidth=lw, edgecolor='black',
                                 facecolor=fill, linestyle=style, zorder=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center',
                fontsize=8.2, fontweight='bold', color='black', zorder=3)

    def draw_decision(cx, cy, rx, ry, text, style='solid', lw=1.3):
        pts = np.array([[cx, cy + ry], [cx + rx, cy], [cx, cy - ry], [cx - rx, cy]])
        poly = patches.Polygon(pts, linewidth=lw, edgecolor='black',
                               facecolor='white', linestyle=style, zorder=2)
        ax.add_patch(poly)
        ax.text(cx, cy, text, ha='center', va='center',
                fontsize=7.8, fontweight='bold', color='black', zorder=3)

    def draw_term(x, y, w, h, text):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2,rounding_size=2.0",
                                      linewidth=1.4, edgecolor='black', facecolor='white', zorder=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center',
                fontsize=8.5, fontweight='bold', color='black', zorder=3)

    def draw_line(x1, y1, x2, y2, label="", dashed=False, arrow=True):
        ls = '--' if dashed else '-'
        astyle = '->' if arrow else '-'
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle=astyle, color='black', lw=1.2, ls=ls), zorder=4)
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my, f" {label} ", ha='center', va='center',
                    fontsize=7.4, fontweight='bold', color='black', backgroundcolor='white', zorder=5)

    # Horizontal 3-Lane Flow
    # Lane 1: Left to Right
    draw_term(1, 74, 15, 17, "Citizen Complaint\nSubmission\n(Narrative + Metadata)")
    draw_line(16, 82.5, 20, 82.5)

    draw_proc(20, 74, 15, 17, "Backend API\nValidation &\nJWT Auth Check")
    draw_line(35, 82.5, 39, 82.5)

    draw_decision(44, 82.5, 5, 8.5, "Evidence\nAttached?")
    draw_line(49, 82.5, 55, 82.5, label="No")

    # Evidence Branch (Above)
    draw_proc(36, 91, 16, 8.2, "Tesseract.js OCR &\nRegex Entity Parsing")
    draw_line(44, 89, 44, 91, label="Yes")
    draw_line(52, 95.1, 62, 95.1)
    draw_line(62, 95.1, 62, 91, arrow=True)

    draw_proc(55, 74, 16, 17, "PrivacyShield\nPII Masking Engine\n(<EMAIL_1>, <PHONE_1>)")
    draw_line(71, 82.5, 76, 82.5)

    # Separate Persistence Callout Box (Right Top)
    draw_proc(76, 74, 23, 17, "SEPARATE STORAGE PATH:\nRaw Complaint Narrative &\nEvidence Persisted in MongoDB\n(Original Text Stored Intact)", style='--')

    # Dropdown connector from Lane 1 to Lane 2
    draw_line(63, 74, 63, 66, arrow=False)
    draw_line(63, 66, 92, 66, arrow=False)
    draw_line(92, 66, 92, 59, arrow=True)

    # Lane 2: Right to Left
    draw_proc(82, 42, 17, 17, "REST Transmission\nMasked Narrative to\nFlask ML Service (5003)")
    draw_line(82, 50.5, 77, 50.5)

    draw_decision(72, 50.5, 5, 8.5, "Service\nAvailable?")
    draw_line(67, 50.5, 59, 50.5, label="Yes")

    # Keyword Fallback (Dashed, above)
    draw_proc(63, 33.5, 18, 8.0, "Deterministic Keyword Fallback\n(Heuristic Keyword Rules)", style='--')
    draw_line(72, 42, 72, 41.5, label="No", dashed=True)
    draw_line(63, 37.5, 34, 37.5, dashed=True, arrow=False)
    draw_line(34, 37.5, 34, 42, dashed=True, arrow=True)

    # TF-IDF & Logistic Regression
    draw_proc(41, 42, 18, 17, "TF-IDF (1–2 Grams) &\nLogistic Regression\nInference (C=2.0)")
    draw_line(41, 50.5, 35, 50.5)

    # OOD Decision
    draw_decision(29, 50.5, 6, 8.5, r"P_max $\geq$ 0.20?" + "\n(OOD Check)")
    draw_line(23, 50.5, 14, 50.5, label=r"Yes ($\geq \tau$)")

    # Low-Confidence Rejection Box (Left)
    draw_proc(1, 42, 11, 17, "OOD Rejection\n(Flagged: Human\nTriage Required)", style='--')
    draw_line(29, 42, 29, 35.5, dashed=True, arrow=False)
    draw_line(29, 35.5, 6, 35.5, dashed=True, arrow=False)
    draw_line(6, 35.5, 6, 42, dashed=True, arrow=True)

    # High-Confidence Suggestion Box
    draw_proc(14, 42, 9, 17, "Learned\nCategory\nSuggested")

    # Dropdown connector from Lane 2 to Lane 3
    draw_line(18.5, 42, 18.5, 28, arrow=False)
    draw_line(18.5, 28, 9, 28, arrow=False)
    draw_line(9, 28, 9, 23, arrow=True)

    # Lane 3: Left to Right
    draw_proc(1, 6, 16, 17, "Rule Overrides &\nPriority Evaluation\n(Immediate Action Flag)")
    draw_line(17, 14.5, 22, 14.5)

    draw_proc(22, 6, 20, 17, "Complaint Record Update\n& Database Persistence\n(MongoDB Collections)")
    draw_line(42, 14.5, 47, 14.5)

    draw_proc(47, 6, 21, 17, "Realtime Alert Dispatch\nvia Socket.IO Gateway\n(Officer Room Broadcast)")
    draw_line(68, 14.5, 73, 14.5)

    draw_term(73, 6, 26, 17, "Officer Review & Final Desk Triage\n(Case Investigation, Status Update,\nand Statutory Case Disposition)")

    plt.tight_layout()
    p = os.path.join(OUT_DIR, 'Figure2_Complaint_Workflow.png')
    plt.savefig(p, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {p}")

# -----------------------------------------------------------------------------
# FIGURE 3: Dataset Class Distribution (1,950 Samples)
# -----------------------------------------------------------------------------
def generate_fig3():
    print("Generating Figure 3: Dataset Class Distribution...")
    fig, ax = plt.subplots(figsize=(9.5, 5.0), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    categories = [
        "child_exploitation", "crypto_fraud", "cyberbullying", "data_breach",
        "financial_fraud", "hacking", "identity_theft", "network_attacks",
        "online_fraud", "other", "phishing", "ransomware", "women_child_safety"
    ]
    categories.reverse() # Top to bottom

    dev_counts = [120] * len(categories)
    test_counts = [30] * len(categories)

    y_pos = np.arange(len(categories))
    bar_height = 0.55

    p1 = ax.barh(y_pos, dev_counts, height=bar_height, color='white', edgecolor='black', linewidth=1.1, label='Development Partition (1,560 samples, 104 families)')
    p2 = ax.barh(y_pos, test_counts, height=bar_height, left=dev_counts, color='#D0D0D0', edgecolor='black', linewidth=1.1, hatch='//', label='Held-Out Test Partition (390 samples, 26 families)')

    for i in range(len(categories)):
        ax.text(153, y_pos[i], "150 (Dev: 120, Test: 30)", va='center', ha='left', fontsize=8.2, color='black', fontweight='bold')

    ax.set_yticks(y_pos)
    ax.set_yticklabels(categories, fontsize=8.8, fontfamily='serif')
    ax.set_xlabel('Sample Count', fontsize=9.8, fontweight='bold', fontfamily='serif')
    ax.set_title('Distribution of 1,950 Synthetic Incident Narratives Across 13 Canonical Classes', fontsize=10.5, fontweight='bold', pad=10, fontfamily='serif')
    ax.set_xlim(0, 205)

    ax.xaxis.grid(True, linestyle=':', alpha=0.6, color='black')
    ax.yaxis.grid(False)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('black')
    ax.spines['bottom'].set_color('black')

    ax.legend(loc='lower right', frameon=True, edgecolor='black', fontsize=8.2)

    plt.tight_layout()
    p = os.path.join(OUT_DIR, 'Figure3_Dataset_Distribution_1950.png')
    plt.savefig(p, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {p}")

# -----------------------------------------------------------------------------
# FIGURE 4: PrivacyShield Model-Input PII Masking Pipeline (ENLARGED LABELS)
# -----------------------------------------------------------------------------
def generate_fig4():
    print("Generating Figure 4: PrivacyShield Masking Pipeline (Enlarged Labels & Zero Overlap)...")
    fig, ax = plt.subplots(figsize=(12.0, 5.8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    def draw_box(x, y, w, h, title, subtitle="", style='solid', lw=1.3, fill='white'):
        rect = patches.Rectangle((x, y), w, h, linewidth=lw, edgecolor='black',
                                 facecolor=fill, linestyle=style, zorder=2)
        ax.add_patch(rect)
        if subtitle:
            ax.text(x + w/2, y + h/2 + 2.2, title, ha='center', va='center',
                    fontsize=9.0, fontweight='bold', color='black', zorder=3)
            ax.text(x + w/2, y + h/2 - 2.5, subtitle, ha='center', va='center',
                    fontsize=7.8, color='black', zorder=3)
        else:
            ax.text(x + w/2, y + h/2, title, ha='center', va='center',
                    fontsize=8.5, fontweight='bold', color='black', zorder=3)

    def draw_arrow(x1, y1, x2, y2, label=""):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', color='black', lw=1.2), zorder=4)
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my + 2.0, label, ha='center', va='center',
                    fontsize=7.8, fontweight='bold', color='black',
                    bbox=dict(boxstyle='square,pad=0.2', facecolor='white', edgecolor='black', lw=0.6), zorder=5)

    # Main Pipeline Row (y: 62 - 85)
    draw_box(2, 62, 16, 23, "Citizen Incident Narrative", "Contains PII (Aadhaar, PAN,\nPhone, Email, Accounts)")
    draw_arrow(18, 73.5, 24, 73.5)

    draw_box(24, 62, 15, 23, "Narrative Text\nExtraction", "Title + Description\nString Parsing")
    draw_arrow(39, 73.5, 45, 73.5)

    draw_box(45, 62, 16, 23, "Regex Pattern\nDetection Engine", "Matches Indian Phone, Aadhaar,\nPAN, Email, UPI Handles")
    draw_arrow(61, 73.5, 67, 73.5)

    draw_box(67, 62, 15, 23, "Token Substitution\n& Normalization", "Replaces with <EMAIL_1>,\n<PHONE_1>, <AADHAAR_1>")
    draw_arrow(82, 73.5, 88, 73.5)

    draw_box(88, 62, 10, 23, "Masked\nPayload", "Protected Text\nfor Inference")

    # Downward arrow to ML inference
    ax.annotate('', xy=(93, 45), xytext=(93, 62),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.2), zorder=4)
    ax.text(93, 53.5, "HTTP POST Payload", ha='center', va='center',
            fontsize=7.8, fontweight='bold', color='black',
            bbox=dict(boxstyle='square,pad=0.2', facecolor='white', edgecolor='black', lw=0.6), zorder=5)

    # Secondary Row: ML Inference Pipeline (y: 28 - 45)
    draw_box(65, 28, 33, 17, "Flask ML Inference Pipeline (Port 5003)",
             "TF-IDF Vectorizer (1-2 N-grams, 10k Features) →\nLogistic Regression (C=2.0) → Softmax Probabilities")
    
    draw_arrow(65, 36.5, 48, 36.5, "Softmax P_max")

    draw_box(28, 28, 20, 17, r'Threshold Gating (tau = 0.20)',
             r'P_max $\geq$ 0.20: High Confidence' + "\n" + r"P_max $<$ 0.20: Review Flag")

    draw_arrow(28, 36.5, 24, 36.5)
    # Positioned at x=13 to 24 so x in [0, 12] is completely free for persistence arrow!
    draw_box(13, 28, 11, 17, "Category\nSuggestion\n/ Triage", "Output")

    # Separate Database Persistence Box (y: 3 - 21)
    draw_box(2, 3, 96, 18, "SEPARATE PERSISTENCE PATH — BACKEND DATABASE STORAGE (MongoDB)",
             "Original citizen complaint narratives, structured fields, uploaded evidence images, and extracted OCR text remain stored unmasked\n"
             "within secure MongoDB collections for lawful law-enforcement investigation and evidentiary audit. PrivacyShield masks model-input\n"
             "text only during automated classification and does not imply system-wide database anonymization or disclosure prevention.",
             style='--', lw=1.3)

    # Persistence route: from Citizen Narrative at x=6 straight down to y=21
    ax.annotate('', xy=(6, 21), xytext=(6, 62),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.2, ls='--'), zorder=4)
    ax.text(6, 41.5, "Full Case Record Persisted Unaltered", ha='center', va='center',
            fontsize=7.4, fontweight='bold', color='black',
            bbox=dict(boxstyle='square,pad=0.2', facecolor='white', edgecolor='black', lw=0.6),
            rotation=90, zorder=5)

    plt.tight_layout()
    p = os.path.join(OUT_DIR, 'Figure4_Privacy_Pipeline.png')
    plt.savefig(p, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {p}")

def generate_fig5():
    print("Generating Figure 5: Held-Out Confusion Matrix (Reconciled 89.74%)...")
    fig, ax = plt.subplots(figsize=(9.2, 8.8), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    categories = [
        "child_exploitation", "crypto_fraud", "cyberbullying", "data_breach",
        "financial_fraud", "hacking", "identity_theft", "network_attacks",
        "online_fraud", "other", "phishing", "ransomware", "women_child_safety"
    ]

    # Exact verified confusion matrix from production model on 390 held-out test samples (350/390 = 89.74%)
    cm = np.array([
        [26,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4],
        [ 0, 29,  0,  0,  0,  1,  0,  0,  0,  0,  0,  0,  0],
        [ 0,  0, 22,  0,  0,  0,  0,  0,  0,  0,  0,  0,  8],
        [ 0,  0,  0, 29,  0,  0,  1,  0,  0,  0,  0,  0,  0],
        [ 0,  0,  0,  0, 28,  0,  0,  0,  2,  0,  0,  0,  0],
        [ 0,  0,  0,  8,  0, 21,  0,  1,  0,  0,  0,  0,  0],
        [ 1,  0,  0,  0,  0,  0, 29,  0,  0,  0,  0,  0,  0],
        [ 0,  0,  0,  0,  0,  0,  0, 30,  0,  0,  0,  0,  0],
        [ 0,  0,  0,  0,  4,  0,  0,  0, 26,  0,  0,  0,  0],
        [ 1,  0,  0,  1,  0,  5,  0,  0,  0, 21,  0,  0,  2],
        [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 30,  0,  0],
        [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 30,  0],
        [ 0,  0,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0, 29]
    ])

    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Greys, vmin=0, vmax=30)
    
    ax.set_xticks(np.arange(len(categories)))
    ax.set_yticks(np.arange(len(categories)))
    ax.set_xticklabels(categories, rotation=45, ha='right', fontsize=8.2, fontfamily='serif')
    ax.set_yticklabels(categories, fontsize=8.2, fontfamily='serif')

    ax.set_xlabel('Predicted Class', fontsize=9.8, fontweight='bold', labelpad=6, fontfamily='serif')
    ax.set_ylabel('Ground Truth Class', fontsize=9.8, fontweight='bold', labelpad=6, fontfamily='serif')
    ax.set_title('Confusion Matrix on 390-Sample Held-Out Test Set (Accuracy = 89.74%, 350 / 390)',
                 fontsize=10.5, fontweight='bold', pad=10, fontfamily='serif')

    for i in range(len(categories)):
        for j in range(len(categories)):
            val = cm[i, j]
            txt_color = "white" if val > 16 else "black"
            font_wt = 'bold' if val > 0 else 'normal'
            ax.text(j, i, str(val), ha="center", va="center",
                    color=txt_color, fontsize=8.0, fontweight=font_wt, fontfamily='serif')

    cbar = ax.figure.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.set_ylabel('Sample Count', rotation=-90, va="bottom", fontsize=8.2, fontfamily='serif')
    cbar.outline.set_edgecolor('black')

    plt.tight_layout()
    p = os.path.join(OUT_DIR, 'Figure5_Confusion_Matrix_390.png')
    plt.savefig(p, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {p}")

# -----------------------------------------------------------------------------
# FIGURE 6: Candidate Classifier Comparison (Five-Fold GroupKFold CV)
# -----------------------------------------------------------------------------
def generate_fig6():
    print("Generating Figure 6: Candidate Classifier Comparison (Annotation Outside Plotting Area)...")
    fig, ax = plt.subplots(figsize=(9.2, 5.2), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    models = [
        "LinearSVC\n(C=2.0)",
        "Logistic Regression\n(C=2.0, Selected)",
        "Multinomial Naive Bayes\n(alpha=0.1)"
    ]

    acc_means = [81.79, 79.88, 76.92]
    acc_stds  = [ 2.29,  3.15,  2.18]
    f1_macros = [78.69, 76.00, 73.17]

    x = np.arange(len(models))
    bar_width = 0.32

    r1 = ax.bar(x - bar_width/2 - 0.02, acc_means, bar_width, yerr=acc_stds,
                capsize=5, color='white', edgecolor='black', linewidth=1.2,
                label='Group CV Accuracy (%) ± Std Dev')

    r2 = ax.bar(x + bar_width/2 + 0.02, f1_macros, bar_width,
                color='#D8D8D8', edgecolor='black', linewidth=1.2, hatch='//',
                label='Macro-F1 Score (%)')

    for i in range(len(models)):
        ax.text(x[i] - bar_width/2 - 0.02, acc_means[i] + acc_stds[i] + 1.0,
                f"{acc_means[i]:.2f}%\n±{acc_stds[i]:.2f}%", ha='center', va='bottom',
                fontsize=8.0, fontweight='bold', color='black')
        ax.text(x[i] + bar_width/2 + 0.02, f1_macros[i] + 1.0,
                f"{f1_macros[i]:.2f}%", ha='center', va='bottom',
                fontsize=8.0, fontweight='bold', color='black')

    ax.set_ylabel('Performance Metric (%)', fontsize=9.8, fontweight='bold', fontfamily='serif')
    ax.set_title('Candidate Classifier Comparison Across Five-Fold GroupKFold Cross-Validation (N=1,560)',
                 fontsize=10.0, fontweight='bold', pad=10, fontfamily='serif')
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontsize=8.8, fontfamily='serif')
    ax.set_ylim(68, 92)

    ax.yaxis.grid(True, linestyle=':', alpha=0.6, color='black')
    ax.xaxis.grid(False)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(loc='upper right', frameon=True, edgecolor='black', fontsize=8.2)

    # Place explanatory annotation OUTSIDE the chart plotting area
    plt.subplots_adjust(bottom=0.24, top=0.92, left=0.10, right=0.95)
    fig.text(0.525, 0.03,
            "Selection Rationale: Logistic Regression was selected over LinearSVC because its multinomial softmax outputs\n"
            r"provide native posterior probabilities directly usable for threshold-based out-of-distribution rejection (tau = 0.20),"
            "\nwithout requiring an auxiliary probability calibration layer.",
            ha='center', va='bottom', fontsize=7.8, style='italic',
            bbox=dict(boxstyle='square,pad=0.4', facecolor='white', edgecolor='black', lw=0.8))

    p = os.path.join(OUT_DIR, 'Figure6_Model_Comparison.png')
    plt.savefig(p, dpi=300, facecolor='white')
    plt.close()
    print(f"Saved: {p}")

def main():
    generate_fig1()
    generate_fig2()
    generate_fig3()
    generate_fig4()
    generate_fig5()
    generate_fig6()
    print("\nAll 6 IEEE Monochrome Figures Regenerated Successfully!")

if __name__ == '__main__':
    main()
