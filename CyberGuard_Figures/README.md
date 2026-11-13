# CyberGuard: Official Research Paper & Report Figures

This directory contains publication-ready figures, evaluation charts, formatted tables, and live application screenshots for the **CyberGuard** cybercrime reporting and triage research paper and project report.

---

## 1. System Architecture & ML Evaluation Figures

| Figure | Description | File Link |
|---|---|---|
| **Fig. 1** | System Architecture and End-to-End Data Paths | [Figures/Figure1_System_Architecture.png](Figures/Figure1_System_Architecture.png) |
| **Fig. 2** | Complaint Processing & Triage Flowchart | [Figures/Figure2_Complaint_Workflow.png](Figures/Figure2_Complaint_Workflow.png) |
| **Fig. 3** | Class Distribution across 1,950 Balanced Narratives (150/class) | [Figures/Figure3_Dataset_Distribution_1950.png](Figures/Figure3_Dataset_Distribution_1950.png) |
| **Fig. 4** | PrivacyShield Model-Input PII Masking Pipeline | [Figures/Figure4_Privacy_Pipeline.png](Figures/Figure4_Privacy_Pipeline.png) |
| **Fig. 5** | Baseline Confusion Matrix (293 Holdout Test Samples) | [Figures/Figure5_Confusion_Matrix_293.png](Figures/Figure5_Confusion_Matrix_293.png) |
| **Fig. 6** | Multi-Classifier Performance Comparison (5 Models) | [Figures/Figure6_Model_Comparison_Bar_Chart.png](Figures/Figure6_Model_Comparison_Bar_Chart.png) |

---

## 2. Live Application Screenshots (Captured from localhost:3000)

All screenshots reflect the live CyberGuard React client integrated with Express backend (Port 5002), Flask ML service (Port 5003), and MongoDB.

| Figure | Screen / View | Description | File Link |
|---|---|---|---|
| **Fig. 7** | Citizen Complaint Intake Portal | Cyber incident report form with real-time PrivacyShield PII masking disclaimer and structured fields. | [App_Screenshots/Figure7_Citizen_Complaint_Form.png](App_Screenshots/Figure7_Citizen_Complaint_Form.png) |
| **Fig. 8** | Citizen Incident Verification & Tracking | Live tracking view for #CMP-873967 with 5-phase statutory milestones and chain-of-custody audit log. | [App_Screenshots/Figure8_Citizen_Tracking_View.png](App_Screenshots/Figure8_Citizen_Tracking_View.png) |
| **Fig. 9** | Officer Incident Triage Dashboard | Law enforcement console sorting active incident queues by statutory urgency, priority, and ML classification. | [App_Screenshots/Figure9_Officer_Dashboard.png](App_Screenshots/Figure9_Officer_Dashboard.png) |
| **Fig. 10** | Official Incident Forensic Dossier | Case forensic record displaying AI category, complainant data, suspect intelligence, and 1930 dispute actions. | [App_Screenshots/Figure10_Complaint_AI_Dossier.png](App_Screenshots/Figure10_Complaint_AI_Dossier.png) |
| **Fig. 11** | Administrative Threat Radar | Neural intelligence console displaying intake velocity, category distributions, and regional impact clusters. | [App_Screenshots/Figure11_Admin_Threat_Radar.png](App_Screenshots/Figure11_Admin_Threat_Radar.png) |
| **Fig. 12** | Admin ML Engine Configuration | Neural inference telemetry (Cluster Operational, Model v3.0.0-PRO) and interactive testing playground. | [App_Screenshots/Figure12_Admin_ML_Management.png](App_Screenshots/Figure12_Admin_ML_Management.png) |

---

## 3. Publication Tables (High-Resolution Renders)

| Table | Title | File Link |
|---|---|---|
| **Table I** | Implemented Components and Feature Boundaries | [Tables/Table1_Implemented_Components.png](Tables/Table1_Implemented_Components.png) |
| **Table II** | Repository Technology Stack and Service Topology | [Tables/Table2_Technology_Stack.png](Tables/Table2_Technology_Stack.png) |
| **Table III** | Reconciliation of Document and Repository Claims | [Tables/Table3_Reconciliation_Claims.png](Tables/Table3_Reconciliation_Claims.png) |
| **Table IV** | Candidate Classifiers & Evaluation Metrics (293 Holdout Samples) | [Tables/Table4_Model_Comparison.png](Tables/Table4_Model_Comparison.png) |
| **Table V** | Limitations and Required Validation | [Tables/Table5_Limitations_Validation.png](Tables/Table5_Limitations_Validation.png) |

---

## 4. Evaluated Ground Truth Metrics (1,950 Samples, 13 Classes)

- **Corpus**: 1,950 synthetic cybercrime narratives, 150 samples per class across all 13 categories.
- **Holdout Split**: Stratified 15% (seed 42) = 1,657 training / 293 testing records.
- **Baseline Model (Word TF-IDF + Logistic Regression, C=4)**:
  - Accuracy: **0.959** (95.9%)
  - Macro Precision: **0.962**
  - Macro Recall: **0.959**
  - Macro F1: **0.960**
- **Best Model (Combined Word + Character TF-IDF + Logistic Regression)**:
  - Accuracy: **0.976** (97.6%)
  - Macro Precision: **0.977**
  - Macro Recall: **0.976**
  - Macro F1: **0.976**
