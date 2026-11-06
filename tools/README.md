# CyberGuard ML Tooling & Evaluation Harnesses

This directory contains standalone utility scripts for dataset assembly, model benchmarking, calibration sweeps, and independent challenge-set evaluation.

## Scripts Overview

| Script | Purpose | Execution Command | Output Artifact |
| :--- | :--- | :--- | :--- |
| `evaluate_challenge_set.py` | Evaluates trained classifier on the 215-item independent challenge set. | `python tools/evaluate_challenge_set.py` | `research-evidence/ml-evaluation/challenge-set-results.txt` |
| `investigate_ood_calibration.py` | Sweeps confidence thresholds ($\tau$) to analyze In-Domain FRR vs OOD FAR tradeoffs. | `python tools/investigate_ood_calibration.py` | `research-evidence/ml-evaluation/ood-calibration-sweep.csv` |
| `compare_models_v3.py` | Benchmarks Multinomial Logistic Regression against LinearSVC and ComplementNB. | `python tools/compare_models_v3.py` | Standard output comparison table |
| `assemble_v3_dataset.py` | Generates 1,950 group-aware training narratives across 130 scenario families. | `python tools/assemble_v3_dataset.py` | `ml-service/data/dataset.csv` |
| `challenge_set_v3_200.py` | 215-sample independent challenge evaluation set data definition. | Imported as Python module | `CHALLENGE_DATA_V3` array |

## Reproducing Challenge Benchmark

To run the challenge evaluation:
```bash
python tools/evaluate_challenge_set.py
```
See detailed methodology, provenance, and per-class reports in [docs/challenge-set-reproducibility.md](../docs/challenge-set-reproducibility.md).
