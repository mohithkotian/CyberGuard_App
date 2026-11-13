import docx

doc = docx.Document(r'c:\Users\Mohith\Desktop\CyberGuard_report.docx')
for i, p in enumerate(doc.paragraphs):
    if 'drawing' in p._p.xml:
        next_txt = doc.paragraphs[i+1].text if i+1 < len(doc.paragraphs) else ""
        prev_txt = doc.paragraphs[i-1].text if i > 0 else ""
        print(f"P{i} [Image]")
        print(f"  Prev: {prev_txt[:80]}")
        print(f"  Curr: {p.text[:80]}")
        print(f"  Next: {next_txt[:80]}")

print("\n--- RESEARCH DOCX ---")
doc2 = docx.Document(r'c:\Users\Mohith\Desktop\CyberGuard_research.docx')
for i, p in enumerate(doc2.paragraphs):
    if 'drawing' in p._p.xml:
        next_txt = doc2.paragraphs[i+1].text if i+1 < len(doc2.paragraphs) else ""
        prev_txt = doc2.paragraphs[i-1].text if i > 0 else ""
        print(f"P{i} [Image]")
        print(f"  Prev: {prev_txt[:80]}")
        print(f"  Curr: {p.text[:80]}")
        print(f"  Next: {next_txt[:80]}")

