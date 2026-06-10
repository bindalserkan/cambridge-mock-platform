import { PrintTemplateProps } from '@/types/print';

// Cambridge Standard Door List HTML Generator
export const generateDoorListHTML = ({ examName, students }: PrintTemplateProps): string => {
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));
  
  const rows = sortedStudents.map((s, index) => `
    <tr>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; font-weight: 600; width: 60px;">${String(index + 1).padStart(3, '0')}</td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 15px; text-transform: uppercase; font-weight: 700; color: #0f172a; letter-spacing: 0.02em;">${s.name}</td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; text-align: right; color: ${s.status === 'Absent' ? '#e11d48' : '#059669'};">
        ${s.status === 'Absent' ? 'ABSENT / NOT IN ROOM' : 'CONFIRMED ENTRY'}
      </td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>Door List - ${examName}</title>
        <style>
          @media print { @page { margin: 20mm; } }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #0f172a; }
          .badge { display: inline-block; background: #0f172a; color: white; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.05em; margin-bottom: 8px; }
          .header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 900; tracking-tight; text-transform: uppercase; }
          .header p { margin: 6px 0 0 0; font-size: 14px; color: #64748b; font-weight: 600; letter-spacing: 0.1em; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; padding: 12px 16px; background: #f8fafc; border-bottom: 2px solid #0f172a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; font-weight: 800; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="badge">SCALEFLOW ASSESSMENT SYSTEMS</div>
        <div class="header">
          <h1>${examName}</h1>
          <p>CANDIDATE DOOR LIST • KAPISI GİRİŞ LİSTESİ</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Index</th>
              <th>Candidate Full Name</th>
              <th style="text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">ScaleFlow Mock Platform Workspace Assessment Services • Total Registered Candidates: ${students.length}</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
};

// Cambridge Official Invigilator Attendance Ledger HTML Generator
export const generateAttendanceListHTML = ({ examName, students }: PrintTemplateProps): string => {
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));
  
  const rows = sortedStudents.map((s, index) => `
    <tr>
      <td style="padding: 16px 12px; border-bottom: 1px solid #cbd5e1; font-size: 13px; font-weight: bold; color: #475569;">${String(index + 1).padStart(3, '0')}</td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #cbd5e1; font-size: 14px; text-transform: uppercase; font-weight: 700; color: #0f172a;">${s.name}</td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #cbd5e1; text-align: center; width: 140px;">
        <div style="display: inline-block; width: 16px; height: 16px; border: 2px solid #0f172a; border-radius: 3px; margin-right: 15px; vertical-align: middle;"></div>
        <div style="display: inline-block; width: 16px; height: 16px; border: 2px solid #64748b; border-radius: 3px; vertical-align: middle; background: ${s.status === 'Absent' ? '#f1f5f9' : 'transparent'};"></div>
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #cbd5e1; width: 180px;"></td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>Attendance Sign-In Ledger - ${examName}</title>
        <style>
          @media print { @page { margin: 15mm; } }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 15px; color: #0f172a; }
          .top-meta { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 14px; margin-bottom: 25px; }
          .title-area h1 { margin: 0; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; }
          .title-area p { margin: 4px 0 0 0; font-size: 12px; color: #475569; font-weight: 700; letter-spacing: 0.05em; }
          .signing-boxes { font-size: 11px; font-weight: 700; color: #1e293b; line-height: 1.8; text-align: right; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 10px 12px; background: #f1f5f9; border-bottom: 2px solid #0f172a; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; font-weight: 800; }
          .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="top-meta">
          <div class="title-area">
            <h1>${examName}</h1>
            <p>EXAMINATION ATTENDANCE & SIGN-IN SHEET • YOKLAMA VE İMZA ÇİZELGESİ</p>
          </div>
          <div class="signing-boxes">
            <div><strong>Exam Date:</strong> ____________________</div>
            <div><strong>Invigilator Name:</strong> ____________________</div>
            <div><strong>Invigilator Sign:</strong> ____________________</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">Index</th>
              <th>Candidate Full Name</th>
              <th style="text-align: center; width: 140px;">P (🗹) / A (☐)</th>
              <th style="width: 180px;">Candidate Signature</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">ScaleFlow Security Protocol Document • Present Ledger Count: _____ / Total Allocated: ${students.length}</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
};

// Cambridge Format Official Final Performance Student Report Card
export const generateFinalReportHTML = (studentName: string, examName: string, result: any): string => {
  const activeSections = Object.entries(result.sections);

  const rows = activeSections.map(([name, data]: [string, any]) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
      <span style="text-transform: capitalize; font-weight: 700; color: #1e293b; font-size: 14px;">${name === 'useOfEnglish' ? 'Use of English' : name}</span>
      <div style="text-align: right;">
        <span style="font-weight: 800; color: #4f46e5; font-size: 14px; margin-right: 15px;">Scale Score: ${data.cambridgeScaleScore}</span>
        <span style="display: inline-block; background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${data.cefrLevel}</span>
      </div>
    </div>
  `).join('');

  return `
    <html>
      <head>
        <title>Statement of Results - ${studentName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; bg: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; padding: 30px; border-radius: 16px; }
          .badge { display: inline-block; background: #0f172a; color: white; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.05em; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; }
          .student-info { margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 13px; line-height: 1.6; }
          .score-box { background: #4f46e5; color: white; padding: 20px; border-radius: 12px; text-center; margin: 30px 0; text-align: center; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">SCALEFLOW OFFICIAL ASSESSMENT REPORT</div>
          <div class="header">
            <h1>Statement of Results</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">CAMBRIDGE MOCK EVALUATION FRAMEWORK</p>
          </div>
          
          <div class="student-info">
            <div><strong>Candidate Name:</strong> ${studentName.toUpperCase()}</div>
            <div><strong>Assessment Session:</strong> ${examName.toUpperCase()}</div>
            <div><strong>Verification Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">Component Performance</h3>
          <div>${rows}</div>

          <div class="score-box">
            <p style="margin: 0; font-size: 11px; font-weight: 700; uppercase; tracking-wider; opacity: 0.9;">OVERALL CAMBRIDGE SCALE SCORE</p>
            <h2 style="margin: 5px 0; font-size: 42px; font-weight: 900;">${result.overallScaleScore}</h2>
            <p style="margin: 0; font-size: 13px; font-weight: 700;">Validated Level: ${result.overallCEFR} • Grade: ${result.overallGrade}</p>
          </div>

          <div class="footer">
            This workspace ledger statement confirms mock results executed via ScaleFlow Engine protocols.<br/>
            Secure Document ID: SF-${Math.random().toString(36).substr(2, 9).toUpperCase()}
          </div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `;
};