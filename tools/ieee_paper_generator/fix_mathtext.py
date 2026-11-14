import os

target_path = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\generate_figures_bw.py'

with open(target_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the mathtext in generate_fig4
bad_str1 = r'r"Threshold Gating ($\\tau=0.20$)"'
bad_str2 = r'r"P_max $\\geq$ 0.20: High Confidence"'

content = content.replace(r'r"Threshold Gating ($\\tau=0.20$)"', r"r'Threshold Gating ($\tau=0.20$)'")
content = content.replace(r'r"P_max $\\geq$ 0.20: High Confidence"', r"r'P_max $\geq$ 0.20: High Confidence'")

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed mathtext strings!')

