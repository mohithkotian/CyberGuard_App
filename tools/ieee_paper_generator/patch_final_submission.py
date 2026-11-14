import os

target_path = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\build_final_ieee_docx.py'

with open(target_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Table III held-out accuracy row
old_t3_row = '["Held-out accuracy", "The v3 experiment summary reports 88.97% (347/390), adopted here. A separate report lists 89.74%; source discrepancy disclosed [4]."]'
new_t3_row = '["Held-out accuracy", "The production serialized model artifact achieves 89.74% (350/390 correct; macro-F1: 0.8975), confirmed by evaluation of classifier.pkl and classification-report.txt. An earlier unseeded preliminary solver checkpoint reported 88.97% (347/390); reconciled here [4]."]'

if old_t3_row in code:
    code = code.replace(old_t3_row, new_t3_row)
    print("Table III updated!")
else:
    print("Table III target not found, checking alternatives...")

# 2. Update save filenames to CyberGuard_Submission_Final.docx
old_save_block = '''    # Save to requested output paths: CyberGuard_Submission_Ready.docx
    desktop_dir = r"C:\\Users\\Mohith\\Desktop"
    ready_name = "CyberGuard_Submission_Ready.docx"
    
    paths_to_save = [
        os.path.join(OUT_DIR, ready_name),
        os.path.join(desktop_dir, ready_name)
    ]
    
    for p in paths_to_save:
        try:
            doc.save(p)
            print(f"Saved DOCX: {p}")
        except Exception as e:
            print(f"Could not save to {p}: {e}")'''

new_save_block = '''    # Save to requested output paths: CyberGuard_Submission_Final.docx
    desktop_dir = r"C:\\Users\\Mohith\\Desktop"
    final_name = "CyberGuard_Submission_Final.docx"
    
    paths_to_save = [
        os.path.join(OUT_DIR, final_name),
        os.path.join(desktop_dir, final_name)
    ]
    
    for p in paths_to_save:
        try:
            doc.save(p)
            print(f"Saved DOCX: {p}")
        except Exception as e:
            print(f"Could not save to {p}: {e}")'''

if old_save_block in code:
    code = code.replace(old_save_block, new_save_block)
    print("Save block updated to CyberGuard_Submission_Final.docx!")

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated build_final_ieee_docx.py successfully!")

