import os
import re
import subprocess
import markdown

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
MD_PATH = os.path.join(DOCS_DIR, "FINAL_PROJECT_REPORT_BIS786.md")
HTML_FULL_PATH = os.path.join(DOCS_DIR, "report_full.html")
PDF_FULL_PATH = os.path.join(DOCS_DIR, "FINAL_PROJECT_REPORT_BIS786.pdf")
HTML_PLAG_PATH = os.path.join(DOCS_DIR, "report_plagiarism_only.html")
PDF_PLAG_PATH = os.path.join(DOCS_DIR, "PLAGIARISM_CHECK_CHAPTERS_1_TO_7.pdf")

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

print(f"Using browser executable: {CHROME_PATH}")

with open(MD_PATH, "r", encoding="utf-8") as f:
    full_markdown_text = f.read()

# Custom CSS matching VTU and Sai Vidya Institute of Technology formatting
REPORT_CSS = """
@page {
    size: A4 portrait;
    margin-left: 31mm;
    margin-right: 25mm;
    margin-top: 20mm;
    margin-bottom: 20mm;
}

@page :left {
    margin-left: 31mm;
    margin-right: 25mm;
}

@page :right {
    margin-left: 31mm;
    margin-right: 25mm;
}

*, *:before, *:after {
    box-sizing: border-box;
}

body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111827;
    text-align: justify;
    text-justify: inter-word;
    margin: 0;
    padding: 0;
    background: #ffffff;
}

p {
    margin-top: 0;
    margin-bottom: 10pt;
    text-align: justify;
    text-justify: inter-word;
}

h1 {
    font-family: 'Times New Roman', Times, serif;
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin-top: 18pt;
    margin-bottom: 12pt;
    color: #0f172a;
    page-break-after: avoid;
}

h2 {
    font-family: 'Times New Roman', Times, serif;
    font-size: 14pt;
    font-weight: bold;
    margin-top: 16pt;
    margin-bottom: 8pt;
    color: #1e293b;
    page-break-after: avoid;
}

h3 {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12.5pt;
    font-weight: bold;
    margin-top: 12pt;
    margin-bottom: 6pt;
    color: #1e293b;
    page-break-after: avoid;
}

h4 {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    font-weight: bold;
    font-style: italic;
    margin-top: 10pt;
    margin-bottom: 4pt;
    page-break-after: avoid;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12pt;
    margin-bottom: 14pt;
    font-size: 10.5pt;
    line-height: 1.35;
    page-break-inside: avoid;
}

th, td {
    border: 1px solid #475569;
    padding: 6pt 8pt;
    vertical-align: top;
    text-align: left;
}

th {
    background-color: #f1f5f9;
    font-weight: bold;
    color: #0f172a;
    text-align: center;
}

pre, code {
    font-family: 'Courier New', Courier, monospace;
}

pre {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 10pt;
    font-size: 9.5pt;
    line-height: 1.3;
    overflow-x: auto;
    white-space: pre-wrap;
    margin-top: 10pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
}

code {
    background-color: #f1f5f9;
    padding: 1pt 3pt;
    border-radius: 3px;
    font-size: 10.5pt;
}

pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
    font-size: inherit;
}

blockquote {
    border-left: 3px solid #3b82f6;
    margin: 10pt 0;
    padding: 6pt 12pt;
    background-color: #f8fafc;
    font-style: italic;
}

ul, ol {
    margin-top: 0;
    margin-bottom: 10pt;
    padding-left: 22pt;
}

li {
    margin-bottom: 4pt;
    text-align: justify;
}

hr {
    border: 0;
    border-top: 1px solid #cbd5e1;
    margin: 16pt 0;
}

.page-break {
    page-break-after: always;
    break-after: page;
}

.center-text {
    text-align: center;
}

.right-text {
    text-align: right;
}

/* Front sheet certificate styling */
.front-title {
    font-size: 18pt;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    margin: 10pt 0;
    line-height: 1.3;
}

.front-subtitle {
    font-size: 13pt;
    font-weight: bold;
    text-align: center;
    margin: 6pt 0;
}

.front-college {
    font-size: 16pt;
    font-weight: bold;
    color: #1e3a8a;
    text-align: center;
    margin: 4pt 0;
}

.mermaid {
    text-align: center;
    margin: 14pt 0;
    page-break-inside: avoid;
}
"""

def markdown_to_styled_html(md_text, is_plagiarism_only=False):
    # Convert page breaks in markdown
    md_formatted = md_text.replace('<div style="page-break-after: always;"></div>', '<div class="page-break"></div>')
    
    # Pre-render mermaid code blocks as <pre class="mermaid">
    def replace_mermaid(match):
        code = match.group(1).strip()
        return f'<div class="mermaid">\n{code}\n</div>'
    
    md_formatted = re.sub(r'```mermaid\s*\n(.*?)\n```', replace_mermaid, md_formatted, flags=re.DOTALL)
    
    # Process with python-markdown
    md_extensions = ['tables', 'fenced_code', 'codehilite', 'sane_lists']
    html_body = markdown.markdown(md_formatted, extensions=md_extensions)
    
    # Add page breaks before each chapter
    for ch_num in range(1, 8):
        h1_tag = f"<h1>CHAPTER {ch_num}:"
        html_body = html_body.replace(h1_tag, f'<div class="page-break"></div>\n{h1_tag}')
        
    # Add page break before references and appendices
    html_body = html_body.replace("<h1>REFERENCES</h1>", '<div class="page-break"></div>\n<h1>REFERENCES</h1>')
    html_body = html_body.replace("<h1>APPENDIX A:", '<div class="page-break"></div>\n<h1>APPENDIX A:')
    html_body = html_body.replace("<h1>APPENDIX B:", '<div class="page-break"></div>\n<h1>APPENDIX B:')
    html_body = html_body.replace("<h1>PLAGIARISM VERIFICATION", '<div class="page-break"></div>\n<h1>PLAGIARISM VERIFICATION')

    doc_title = "Plagiarism Check Chapters 1-7 - TradeMind AI" if is_plagiarism_only else "Major Project Phase-II Final Report (BIS786) - TradeMind AI"

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{doc_title}</title>
    <style>
        {REPORT_CSS}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", function() {{
            mermaid.initialize({{
                startOnLoad: true,
                theme: 'neutral',
                securityLevel: 'loose',
                flowchart: {{ useMaxWidth: true, htmlLabels: true, curve: 'basis' }}
            }});
        }});
    </script>
</head>
<body>
{html_body}
</body>
</html>
"""
    return full_html

# 1. Build Full Report HTML
print("Converting Full Markdown Report to Styled HTML...")
full_html_content = markdown_to_styled_html(full_markdown_text, is_plagiarism_only=False)
with open(HTML_FULL_PATH, "w", encoding="utf-8") as f:
    f.write(full_html_content)
print(f"Full Report HTML written to: {HTML_FULL_PATH}")

# 2. Extract Chapters 1 to 7 for Plagiarism Check Document
print("Extracting Chapters 1 to 7 for Plagiarism Verification...")
# Find start of Chapter 1
ch1_start = full_markdown_text.find("# CHAPTER 1: INTRODUCTION")
# Find end of Chapter 7 / start of References
ref_start = full_markdown_text.find("# REFERENCES")

if ch1_start != -1 and ref_start != -1:
    plag_text = full_markdown_text[ch1_start:ref_start].strip()
    # Add a minimal clean header for the plagiarism submission
    plagiarism_header = """# TRADEMIND AI: EXPLAINABLE MACHINE LEARNING-BASED REAL-TIME MARKET ANALYTICS AND PAPER TRADING PLATFORM
### Project Phase-II (BIS786) Report — Chapters 1 to 7 (Plagiarism Verification File)
**Author(s):** Yashwanth Gowda H (1SV21IS058), Dept. of ISE, Sai Vidya Institute of Technology, Bengaluru  
**Academic Year:** 2026–2027 | Visvesvaraya Technological University (VTU)

---

"""
    plag_full_text = plagiarism_header + plag_text
    plag_html_content = markdown_to_styled_html(plag_full_text, is_plagiarism_only=True)
    with open(HTML_PLAG_PATH, "w", encoding="utf-8") as f:
        f.write(plag_html_content)
    print(f"Plagiarism HTML written to: {HTML_PLAG_PATH}")
else:
    print("WARNING: Could not delimit Chapters 1-7 cleanly.")

# 3. Compile PDFs using Headless Chrome
def print_html_to_pdf(html_file, pdf_file):
    html_uri = f"file:///{os.path.abspath(html_file).replace(os.sep, '/')}"
    pdf_abs = os.path.abspath(pdf_file)
    print(f"Compiling PDF from {html_uri} -> {pdf_abs} ...")
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=6000",
        f"--print-to-pdf={pdf_abs}",
        html_uri
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_abs) and os.path.getsize(pdf_abs) > 1000:
        print(f"SUCCESS: Generated {pdf_abs} ({os.path.getsize(pdf_abs):,} bytes)")
        return True
    else:
        print(f"ERROR generating PDF: {res.stderr}")
        return False

# Generate Full Report PDF
success_full = print_html_to_pdf(HTML_FULL_PATH, PDF_FULL_PATH)

# Generate Plagiarism Chapters 1-7 PDF
success_plag = print_html_to_pdf(HTML_PLAG_PATH, PDF_PLAG_PATH)

print("PDF Build Process Complete.")
