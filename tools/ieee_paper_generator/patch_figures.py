import os

target_path = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\generate_figures_bw.py'

with open(target_path, 'r', encoding='utf-8') as f:
    content = f.read()

idx1 = content.find('def generate_fig1():')
idx2 = content.find('def generate_fig2():')
idx4 = content.find('def generate_fig4():')
idx5 = content.find('def generate_fig5():')

print('Indices:', idx1, idx2, idx4, idx5)

new_fig1 = '''def generate_fig1():
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
        
        full_title = f"{title}\\n{subtitle}" if subtitle else title
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
    draw_box(5.5, 25.5, 13.5, 14.5, 'TF-IDF\\nVectorizer', '1–2 N-grams\\n10,000 Feat.')
    draw_box(21, 25.5, 13.5, 14.5, 'Logistic\\nRegression', 'C=2.0\\nSoftmax Vector')
    draw_box(36.5, 25.5, 10.5, 14.5, 'OOD\\nGating', r'Threshold' + '\\n' + r'$\\tau=0.20$')

    # 4. Evidence Processing Layer (y: 24 - 47, Right)
    draw_layer_frame(51.5, 24, 45, 23, '4. EVIDENCE & OCR PIPELINE', 'Tesseract.js & Multer Ingestion', title_x=74.5, title_y=44.2)
    draw_box(53.5, 25.5, 13.5, 14.5, 'Evidence File\\nIngestion', 'Multipart Multer\\nDisk Buffer')
    draw_box(69, 25.5, 13.5, 14.5, 'Tesseract.js\\nOCR Worker', 'English OCR\\nWorker Thread')
    draw_box(84.5, 25.5, 10.5, 14.5, 'Entity\\nParser', 'UPI / Phone\\nRegex Extractor')

    # 5. Database & Persistence Layer (y: 3.5 - 20, Left)
    draw_layer_frame(3.5, 3.5, 45, 17.5, '5. DATABASE & PERSISTENCE', 'MongoDB / Mongoose ODM — Port 27017', title_x=26, title_y=18.5)
    draw_box(5.5, 4.8, 41, 11.2, 'MongoDB / Mongoose ODM',
             'Collections: Complaints (Raw Narrative), Users,\\nTimelines, Extracted OCR Text, Audit Logs')

    # 6. Officer Triage & Realtime Gateway Layer (y: 3.5 - 20, Right)
    draw_layer_frame(51.5, 3.5, 45, 17.5, '6. OFFICER TRIAGE & REALTIME GATEWAY', 'Role-Based Triage & Event Broadcast', title_x=74, title_y=18.5)
    draw_box(53.5, 4.8, 20, 11.2, 'Officer Review Console',
             'Manual Desk Triage,\\nCase Status Updates,\\nInvestigation Escalation')
    draw_box(75.5, 4.8, 19, 11.2, 'Socket.IO Gateway',
             'Live Room Broadcast,\\nRealtime Alerts,\\nAudit Logging')

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

'''

new_fig4 = '''def generate_fig4():
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
    draw_box(2, 62, 16, 23, "Citizen Incident Narrative", "Contains PII (Aadhaar, PAN,\\nPhone, Email, Accounts)")
    draw_arrow(18, 73.5, 24, 73.5)

    draw_box(24, 62, 15, 23, "Narrative Text\\nExtraction", "Title + Description\\nString Parsing")
    draw_arrow(39, 73.5, 45, 73.5)

    draw_box(45, 62, 16, 23, "Regex Pattern\\nDetection Engine", "Matches Indian Phone, Aadhaar,\\nPAN, Email, UPI Handles")
    draw_arrow(61, 73.5, 67, 73.5)

    draw_box(67, 62, 15, 23, "Token Substitution\\n& Normalization", "Replaces with <EMAIL_1>,\\n<PHONE_1>, <AADHAAR_1>")
    draw_arrow(82, 73.5, 88, 73.5)

    draw_box(88, 62, 10, 23, "Masked\\nPayload", "Protected Text\\nfor Inference")

    # Downward arrow to ML inference
    ax.annotate('', xy=(93, 45), xytext=(93, 62),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.2), zorder=4)
    ax.text(93, 53.5, "HTTP POST Payload", ha='center', va='center',
            fontsize=7.8, fontweight='bold', color='black',
            bbox=dict(boxstyle='square,pad=0.2', facecolor='white', edgecolor='black', lw=0.6), zorder=5)

    # Secondary Row: ML Inference Pipeline (y: 28 - 45)
    draw_box(65, 28, 33, 17, "Flask ML Inference Pipeline (Port 5003)",
             "TF-IDF Vectorizer (1-2 N-grams, 10k Features) →\\nLogistic Regression (C=2.0) → Softmax Probabilities")
    
    draw_arrow(65, 36.5, 48, 36.5, "Softmax P_max")

    draw_box(28, 28, 20, 17, r"Threshold Gating ($\\\\tau=0.20$)",
             r"P_max $\\\\geq$ 0.20: High Confidence" + "\\n" + r"P_max $<$ 0.20: Review Flag")

    draw_arrow(28, 36.5, 24, 36.5)
    # Positioned at x=13 to 24 so x in [0, 12] is completely free for persistence arrow!
    draw_box(13, 28, 11, 17, "Category\\nSuggestion\\n/ Triage", "Output")

    # Separate Database Persistence Box (y: 3 - 21)
    draw_box(2, 3, 96, 18, "SEPARATE PERSISTENCE PATH — BACKEND DATABASE STORAGE (MongoDB)",
             "Original citizen complaint narratives, structured fields, uploaded evidence images, and extracted OCR text remain stored unmasked\\n"
             "within secure MongoDB collections for lawful law-enforcement investigation and evidentiary audit. PrivacyShield masks model-input\\n"
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

'''

updated_content = content[:idx1] + new_fig1 + content[idx2:idx4] + new_fig4 + content[idx5:]

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print('Successfully patched generate_figures_bw.py!')

