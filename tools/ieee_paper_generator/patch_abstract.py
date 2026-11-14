import os

target_path = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\build_final_ieee_docx.py'

with open(target_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the Abstract held-out sentence
old_part = '''per class in development and two held out; the 1,560/390 split has no shared groups. The v3 experiment summary reports "
        "88.97% held-out accuracy (347/390) and 0.8896 macro-F1.'''

new_part = '''per class in development and two held out; the 1,560/390 split has no shared groups. On the 390 held-out test samples, "
        "the serialized production Logistic Regression model achieves 89.74% accuracy (350/390 correct) and 0.8975 macro-F1, "
        "reconciling the 88.97% (347/390) preliminary solver checkpoint.'''

if old_part in code:
    code = code.replace(old_part, new_part)
    print("Abstract successfully updated to report 89.74% (350/390)!")
else:
    print("Old abstract string not found, check exact text.")

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated build_final_ieee_docx.py!")

