export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}

export function exportToPDF(report: ReportData): void {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build HTML content for printing
  const tableHeaders = report.columns
    .map((col) => `<th style="padding:8px 12px;text-align:left;background:#0d9488;color:white;font-weight:600;font-size:12px;">${col.header}</th>`)
    .join('');

  const tableRows = report.rows
    .map((row, idx) => {
      const cells = report.columns
        .map((col) => `<td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #e5e7eb;">${row[col.key] ?? '-'}</td>`)
        .join('');
      return `<tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">${cells}</tr>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${report.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
        h1 { color: #0d9488; font-size: 22px; margin-bottom: 4px; }
        .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 4px; }
        .date { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { padding: 8px 12px; text-align: left; background: #0d9488; color: white; font-weight: 600; font-size: 12px; }
        td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb; }
        .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <h1>${report.title}</h1>
      ${report.subtitle ? `<div class="subtitle">${report.subtitle}</div>` : ''}
      <div class="date">Generated on: ${date}</div>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">Hospital Management System — Confidential Report</div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}
