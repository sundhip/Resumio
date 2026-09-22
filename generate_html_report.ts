import fs from 'fs';
import path from 'path';

const mdPath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\80d201a1-8a7a-4c03-b94c-1edb849d6d69\\Resumio_SQLite_DBMS_Report.md';
const mdContent = fs.readFileSync(mdPath, 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Resumio - SQLite DBMS Technical Specification & Viva Guide</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            background: #fff;
        }

        .page-break {
            page-break-before: always;
            margin-top: 40px;
            border-top: 2px dashed #cbd5e1;
            padding-top: 30px;
        }

        h1 {
            color: #0f172a;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            font-size: 26px;
        }

        h2 {
            color: #1e40af;
            margin-top: 30px;
            font-size: 20px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
        }

        h3 {
            color: #0369a1;
            font-size: 16px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
        }

        th {
            background-color: #f1f5f9;
            color: #0f172a;
            text-align: left;
            padding: 10px;
            border: 1px solid #cbd5e1;
            font-weight: 600;
        }

        td {
            padding: 9px 10px;
            border: 1px solid #cbd5e1;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        pre {
            background: #0f172a;
            color: #f8fafc;
            padding: 14px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Fira Code', monospace;
            font-size: 12px;
        }

        code {
            font-family: 'Fira Code', monospace;
            background: #f1f5f9;
            color: #0284c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
        }

        pre code {
            background: transparent;
            color: inherit;
            padding: 0;
        }

        blockquote {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            margin: 16px 0;
            padding: 12px 16px;
            border-radius: 0 6px 6px 0;
        }

        .alert-important {
            background: #fffbebfb;
            border-left: 4px solid #d97706;
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 4px;
        }

        @media print {
            body { padding: 0; }
            .page-break { page-break-before: always; border: none; padding-top: 0; }
            .no-print { display: none; }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
    <div class="no-print" style="background: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; padding: 12px; border-radius: 6px; margin-bottom: 20px; text-align: center;">
        💡 <strong>How to save as PDF:</strong> Press <strong>Ctrl + P</strong> (or Cmd + P) in your browser -> Choose <strong>"Save as PDF"</strong> as destination -> Click <strong>Save</strong>!
    </div>
    <div id="content"></div>
    <script>
        document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(mdContent)});
    </script>
</body>
</html>`;

fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\Resumio\\Resumio_SQLite_DBMS_Report.html', htmlContent);
console.log('✅ HTML Report generated successfully!');
