"""
ml-service/generate_dataset.py — Standalone reproducible dataset generator wrapper for CyberGuard ML v3.
Delegates to tools/assemble_v3_dataset.py to reproduce dataset.csv and dataset-manifest.json.
"""
import subprocess
import sys
import os

if __name__ == '__main__':
    script = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tools', 'assemble_v3_dataset.py')
    res = subprocess.run([sys.executable, script])
    sys.exit(res.returncode)
