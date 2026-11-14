import os

target_path = r'c:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\Diagram_Source\build_final_ieee_docx.py'

with open(target_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update save logic to save to both requested filenames and Desktop
save_old = '''    # Save
    doc.save(DOCX_PATH)
    print(f"Saved DOCX: {DOCX_PATH}")'''

save_new = '''    # Save to requested output paths
    desktop_dir = r"C:\\Users\\Mohith\\Desktop"
    submission_name = "CyberGuard_IEEE_Submission_Final.docx"
    blackwhite_name = "CyberGuard_IEEE_Final_Black_White.docx"
    
    paths_to_save = [
        os.path.join(OUT_DIR, submission_name),
        os.path.join(OUT_DIR, blackwhite_name),
        os.path.join(desktop_dir, submission_name),
        os.path.join(desktop_dir, blackwhite_name)
    ]
    
    for p in paths_to_save:
        try:
            doc.save(p)
            print(f"Saved DOCX: {p}")
        except Exception as e:
            print(f"Could not save to {p}: {e}")'''

if save_old in content:
    content = content.replace(save_old, save_new)
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated save paths in build_final_ieee_docx.py!")
else:
    print("Save string not found, check build_final_ieee_docx.py")

