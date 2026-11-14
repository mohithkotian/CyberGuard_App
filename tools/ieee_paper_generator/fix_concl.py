import os

target_path = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\build_final_ieee_docx.py'

with open(target_path, 'r', encoding='utf-8') as f:
    code = f.read()

old_concl = "The v3 benchmark establishes an 88.97% held-out test accuracy (347/390) and 0.8896 macro-F1 on group-disjoint scenario families, alongside a 79.88% ± 3.15% five-fold GroupKFold cross-validation accuracy (macro-F1: 0.7600) on the development partition."
new_concl = "The v3 benchmark establishes an 89.74% held-out test accuracy (350/390) and 0.8975 macro-F1 on group-disjoint scenario families (reconciling the 88.97% / 347-of-390 preliminary solver checkpoint), alongside a 79.88% ± 3.15% five-fold GroupKFold cross-validation accuracy (macro-F1: 0.7600) on the development partition."

if old_concl in code:
    code = code.replace(old_concl, new_concl)
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Conclusion reconciled successfully!")
else:
    print("Conclusion string not found or already replaced.")

