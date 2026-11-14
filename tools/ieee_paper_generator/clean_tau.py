import os

target_path = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\generate_figures_bw.py'

with open(target_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the tau mathtext with clean tau
code = code.replace(r'($\\tau=0.20$)', '(tau = 0.20)')
code = code.replace(r'($\tau=0.20$)', '(tau = 0.20)')

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("generate_figures_bw.py updated with clean tau notation!")

