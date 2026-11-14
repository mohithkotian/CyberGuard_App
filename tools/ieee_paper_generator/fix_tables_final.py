import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import docx2pdf
import shutil

src_path = r'C:\Users\Mohith\Desktop\CyberGuard_Submission_Ready.docx'
out_docx = r'C:\Users\Mohith\Desktop\CyberGuard_Submission_Final_Fixed.docx'
out_pdf = r'C:\Users\Mohith\Desktop\CyberGuard_Submission_Final_Fixed.pdf'

ws_docx = r'C:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\CyberGuard_Submission_Final_Fixed.docx'
ws_pdf = r'C:\Users\Mohith\CyberGuard_App\CyberGuard_IEEE_Black_White_Final\CyberGuard_Submission_Final_Fixed.pdf'

doc = docx.Document(src_path)
print(f"Loaded document: {src_path}")
print(f"Total tables found: {len(doc.tables)}")

def apply_bulletproof_table_borders(table, col_widths):
    tblPr = table._tbl.tblPr
    
    # 1. Remove existing tblBorders
    for b in tblPr.xpath('./w:tblBorders'):
        tblPr.remove(b)
        
    # Apply complete solid black borders to tblBorders
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)
    
    # Alignment: center
    for jc in tblPr.xpath('./w:jc'):
        tblPr.remove(jc)
    tblPr.append(parse_xml(f'<w:jc {nsdecls("w")} w:val="center"/>'))
    
    # Table width: explicit dxa
    total_w_dxa = int(sum(col_widths) * 1440)
    for tw in tblPr.xpath('./w:tblW'):
        tblPr.remove(tw)
    tblPr.append(parse_xml(f'<w:tblW {nsdecls("w")} w:w="{total_w_dxa}" w:type="dxa"/>'))
    
    num_rows = len(table.rows)
    
    # 2. Iterate each row and cell
    for r_idx, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        
        # cantSplit on all rows
        if not trPr.xpath('./w:cantSplit'):
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            
        # tblHeader on row 0
        if r_idx == 0 and not trPr.xpath('./w:tblHeader'):
            trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
            
        for c_idx, cell in enumerate(row.cells):
            tcPr = cell._tc.get_or_add_tcPr()
            
            # Explicit cell width in dxa
            if col_widths and c_idx < len(col_widths):
                w_dxa = int(col_widths[c_idx] * 1440)
                for w in tcPr.xpath('./w:tcW'):
                    tcPr.remove(w)
                tcPr.append(parse_xml(f'<w:tcW {nsdecls("w")} w:w="{w_dxa}" w:type="dxa"/>'))
                
            # Cell padding: compact and clean
            for m in tcPr.xpath('./w:tcMar'):
                tcPr.remove(m)
            tcPr.append(parse_xml(f'''
                <w:tcMar {nsdecls("w")}>
                    <w:top w:w="70" w:type="dxa"/>
                    <w:bottom w:w="70" w:type="dxa"/>
                    <w:left w:w="90" w:type="dxa"/>
                    <w:right w:w="90" w:type="dxa"/>
                </w:tcMar>
            '''))
            
            # Remove any existing cell borders
            for b in tcPr.xpath('./w:tcBorders'):
                tcPr.remove(b)
                
            # Border sizes: top border & bottom border
            top_sz = "6" if r_idx == 0 else "4"
            bottom_sz = "6" if (r_idx == 0 or r_idx == num_rows - 1) else "4"
            
            # Explicit cell-level borders on every single cell
            cell_borders = parse_xml(f'''
                <w:tcBorders {nsdecls("w")}>
                    <w:top w:val="single" w:sz="{top_sz}" w:space="0" w:color="000000"/>
                    <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    <w:bottom w:val="single" w:sz="{bottom_sz}" w:space="0" w:color="000000"/>
                    <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                </w:tcBorders>
            ''')
            tcPr.append(cell_borders)

# Apply borders to Tables 1 to 5 (Table 0 is the borderless 5-author block)
# Single-column tables: width 3.35 in (Column 1: 1.20 in, Column 2: 2.15 in)
# Fits strictly within 3.50 in column without disappearing into margin!
single_col_widths = [1.20, 2.15]

# Full-width table (Table V): width 6.70 in (Column 1: 1.80 in, Column 2: 4.90 in)
full_width_widths = [1.80, 4.90]

print("Applying rock-solid borders to Table 1 (Table I: Implemented Components)...")
apply_bulletproof_table_borders(doc.tables[1], single_col_widths)

print("Applying rock-solid borders to Table 2 (Table II: Tech Stack)...")
apply_bulletproof_table_borders(doc.tables[2], single_col_widths)

print("Applying rock-solid borders to Table 3 (Table III: Claims Reconciliation)...")
apply_bulletproof_table_borders(doc.tables[3], single_col_widths)

print("Applying rock-solid borders to Table 4 (Table IV: Evaluation Output)...")
apply_bulletproof_table_borders(doc.tables[4], single_col_widths)

print("Applying rock-solid borders to Table 5 (Table V: Limitations)...")
apply_bulletproof_table_borders(doc.tables[5], full_width_widths)

# Verify Author table (Table 0) remains borderless
tblPr0 = doc.tables[0]._tbl.tblPr
for b in tblPr0.xpath('./w:tblBorders'):
    tblPr0.remove(b)
borders0 = parse_xml(f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="none"/>
        <w:bottom w:val="none"/>
        <w:insideH w:val="none"/>
        <w:left w:val="none"/>
        <w:right w:val="none"/>
        <w:insideV w:val="none"/>
    </w:tblBorders>
''')
tblPr0.append(borders0)

# Also ensure Abstract has normal weight body and reconciled 350/390 (89.74%) text
# Let's check paragraph 0 or early paragraphs for Abstract
for p in doc.paragraphs[:15]:
    if p.text.startswith("Abstract—"):
        for r in p.runs:
            if "Abstract—" in r.text:
                r.font.bold = True
                r.font.italic = True
            else:
                r.font.bold = False

# Save to destination paths
doc.save(out_docx)
print(f"Saved: {out_docx}")

doc.save(ws_docx)
print(f"Saved: {ws_docx}")

# Convert to PDF
print("Converting to PDF...")
docx2pdf.convert(out_docx, out_pdf)
print(f"Saved: {out_pdf}")

shutil.copy2(out_pdf, ws_pdf)
print(f"Saved: {ws_pdf}")
print("All tables formatted and documents compiled successfully!")

