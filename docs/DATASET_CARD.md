# CyberGuard Dataset Card (v3.0)

## 1. Dataset Summary

The **CyberGuard Incident Classification Corpus (v3.0 - Group-Aware De-Biased)** is an academically structured, multi-class cybercrime narrative dataset engineered for incident triage and natural language processing research. It resolves synthetic template leakage identified in earlier iterations by structuring 1,950 records into 130 independent scenario families (10 per category) with diverse narrative openings, sentence orderings, and technical modalities.

* **Repository:** `pruthvi0412/CyberGuard_App`
* **Version:** 3.0 (Group-Aware & De-Biased)
* **Dataset SHA-256:** `3426ec7b81cfec76845439e7138780df4b808811f68d184b4918aadb22ee84ac`
* **Preceding Iterations:**
  * Version 1.0 (257 synthetic single-sentence samples; archived at `ml-service/data/archive/dataset_v1_257.csv`)
  * Version 2.0 (1,950 samples with 4 template clusters per category; archived at `ml-service/data/archive/dataset_v2_1950.csv`)
* **Format:** Comma-Separated Values (`text`, `label`) with companion JSON manifest (`dataset-manifest.json`).
* **Target Classes:** 13 canonical snake_case classes aligned with operational law enforcement reporting and the CyberGuard application stack.
* **Total Records:** Exactly 1,950 records (balanced 150 per category).

---

## 2. Dataset Provenance & Synthetic Disclaimer

> [!IMPORTANT]
> **Synthetic Provenance Disclosure:**
> All records in this dataset are **100% synthetically generated** for academic evaluation, reproducible benchmarking, and algorithmic testing.
> - **No Real Citizen Data:** The dataset does **not** contain real-world complaints, actual police First Information Reports (FIRs), or personally identifiable information (PII).
> - **Redacted Entities:** Any phone numbers (e.g., standard Indian 9110255190 dummy sequences), names, email addresses, or transaction IDs are simulated dummy values.
> - **Academic Scope:** High performance on this benchmark indicates model capability on synthetic cybercrime incident narratives under controlled conditions; it does not substitute for empirical field validation on uncurated law-enforcement repositories.

---

## 3. Dataset Characteristics & Structural De-Biasing

### 3.1 Class Taxonomy (13 Canonical Classes)
1. `phishing`
2. `financial_fraud`
3. `identity_theft`
4. `cyberbullying`
5. `hacking`
6. `ransomware`
7. `data_breach`
8. `online_fraud`
9. `child_exploitation`
10. `women_child_safety`
11. `network_attacks`
12. `crypto_fraud`
13. `other`

### 3.2 Elimination of Template Leakage (v3.0 Architecture)
In Version 2.0, an independent audit revealed that 30 samples per class shared identical introductory and concluding boilerplate sentences, allowing models to achieve an artificially inflated 98.56% cross-validation score based on superficial template artifacts.

Version 3.0 completely restructures dataset generation:
* **130 Scenario Families:** Each category is authored across 10 distinct, realistic operational sub-scenarios (e.g., in `phishing`: bank KYC suspension, fake utility disconnection, corporate SSO impersonation, parcel delivery alert, tax refund lure, cloud storage renewal, lottery reward, hospital health records, airline booking, and HR payroll update).
* **Structural Asymmetry:** Variable narrative openings (first-person victim complaints, corporate incident triage reports, brief hotline intakes, and technical server logs), varied sentence lengths, and dynamic incident timelines.
* **Repetition Reduction:** Maximum repeated 5-gram frequency dropped from 30 (v2 boilerplate) to 15 (natural language idiomatic phrases like `"rupees was debited from my"`).
* **Group Identifiers:** Every record is tagged in `dataset-manifest.json` with `group_id` (0..129), `scenario_family`, `lineage_id`, `is_narrative`, `is_noisy`, and `word_count`.

### 3.3 Partitioning Protocol (Group-Disjoint 80/20)
* **Development Split (80%, N=1,560):** Comprises scenario families 0–7 across all 13 categories (104 scenario groups, 120 samples per class).
* **Held-Out Test Split (20%, N=390):** Comprises scenario families 8–9 across all 13 categories (26 scenario groups, 30 samples per class).
* **Zero Group Leakage:** No scenario family in the test set is ever exposed to the model during training or feature vectorization.

### 3.4 Controlled Noise Augmentation (~5%)
* **98 Noisy Records (5.03%):** Includes authentic mobile typos, phonetic spelling errors (`acnt`, `transfered`, `unauthorizd`), missing punctuation, and colloquial abbreviations, tagged explicitly in the manifest for isolated evaluation.

---

## 4. Intended Uses & Academic Evaluation

### 4.1 Intended Use
* Group-aware benchmarking of NLP classifiers on incident narrative categorization.
* Evaluating out-of-distribution (OOD) rejection and confidence calibration on incident reporting platforms.
* Academic research on domain-adapted feature extraction (TF-IDF vs. transformer embeddings).

### 4.2 Known Limitations
* **Synthetic Linguistic Uniformity:** Despite structural variation, synthetically generated narratives cannot fully replicate dialectal code-mixing (e.g., Hinglish or colloquial Dravidian-English phrasing).
* **Text-Only Modality:** The corpus does not incorporate image evidence (screenshots, QR codes, APK binaries), which are handled separately by the CyberGuard OCR and evidence hashing microservices.
