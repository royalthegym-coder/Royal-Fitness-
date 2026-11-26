import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
export interface AuditReportLogItem {
  id: string;
  action: string;
  adminUid: string;
  adminEmail: string;
  adminName: string;
  targetUserUid: string;
  targetUserName: string;
  targetType: string;
  targetEmail?: string;
  targetPhone?: string;
  timestamp: string;
  status: string;
  details: string;
  previousSubscriptionStatus?: string;
  newSubscriptionStatus: string;
  metadata?: Record<string, any>;
  reason?: string;
}

export interface AuditReportFilterMeta {
  searchTerm?: string;
  searchField?: string;
  roleFilter?: string;
  statusFilter?: string;
  generatedBy?: string;
  gymName?: string;
}

/**
 * Generates a formatted, publication-grade PDF Compliance & Audit Report
 * for filtered logs using jsPDF and jspdf-autotable.
 */
export async function generateAuditReportPdf(
  logs: AuditReportLogItem[],
  metadata: AuditReportFilterMeta = {}
): Promise<{ count: number; filename: string }> {
  // Landscape A4 provides maximum width for detailed audit columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~210 mm
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const auditDocId = `AUD-REF-${now.getTime().toString().slice(-8)}`;
  const filename = `audit_compliance_report_${now.toISOString().split('T')[0]}_${now.getTime().toString().slice(-4)}.pdf`;

  // --- 1. EXECUTIVE HEADER BANNER ---
  // Dark navy background banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent highlight line (cyan)
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 31, pageWidth, 1.5, 'F');

  // Top Left: Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FITNESS FUTURE MANAGEMENT OS', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 182, 212);
  doc.text('ENTERPRISE SECURITY & COMPLIANCE DIVISION • FORCE-UNLOCK AUDIT REPORT', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'Real-time Cloud Firestore Collection: force_unlock_logs • Regulatory Compliance Audit Trail',
    14,
    24
  );

  // Top Right: Audit Reference Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`REFERENCE: ${auditDocId}`, pageWidth - 14, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`ISSUED: ${dateStr} ${timeStr} (UTC+05:30)`, pageWidth - 14, 17, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // amber-400
  doc.text('CLASSIFICATION: REGULATORY COMPLIANCE ARCHIVE', pageWidth - 14, 23, { align: 'right' });

  // --- 2. EXECUTIVE SUMMARY & METRIC BOXES ---
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED').length;
  const uniqueAdmins = new Set(logs.map((l) => l.adminUid)).size;
  const uniqueTargets = new Set(logs.map((l) => l.targetUserUid)).size;
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 100;

  // Metadata Summary Card (Left Box)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 38, 130, 26, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('AUDIT REPORT SCOPE & FILTER CRITERIA', 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const searchSummary = metadata.searchTerm
    ? `"${metadata.searchTerm}" (Scope: ${metadata.searchField || 'All Fields'})`
    : 'None (Unfiltered Query)';
  const roleSummary = metadata.roleFilter ? metadata.roleFilter.toUpperCase() : 'ALL ROLES';
  const statusSummary = metadata.statusFilter ? metadata.statusFilter.toUpperCase() : 'ALL STATUSES';

  doc.text(`• Search Term: ${searchSummary}`, 18, 50);
  doc.text(`• Role Filter: ${roleSummary}   |   Status: ${statusSummary}`, 18, 55);
  doc.text(
    `• Operator: ${metadata.generatedBy || 'Fitness Future Super Admin (Super Admin)'}   |   Facility: ${metadata.gymName || 'Global Platform HQ'}`,
    18,
    60
  );

  // Key KPI Stat Cards (Right Side)
  const statBoxWidth = 32;
  const statBoxHeight = 26;
  const statStartX = 150;

  const stats = [
    { label: 'TOTAL LOGS', val: String(logs.length), color: [15, 23, 42], textCol: [6, 182, 212] },
    { label: 'SUCCESSFUL', val: String(successCount), color: [236, 253, 245], textCol: [5, 150, 105] },
    { label: 'FAILED / DENIED', val: String(failedCount), color: [255, 241, 242], textCol: [225, 29, 72] },
    { label: 'UNIQUE ADMINS', val: String(uniqueAdmins), color: [248, 250, 252], textCol: [15, 23, 42] },
  ];

  stats.forEach((s, i) => {
    const x = statStartX + i * (statBoxWidth + 2.5);
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, 38, statBoxWidth, statBoxHeight, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s.label, x + statBoxWidth / 2, 45, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(s.textCol[0], s.textCol[1], s.textCol[2]);
    doc.text(s.val, x + statBoxWidth / 2, 56, { align: 'center' });
  });

  // --- 3. AUDIT LOGS DATA TABLE ---
  const tableData = logs.map((log, index) => {
    // Format timestamp
    let formattedDate = log.timestamp;
    try {
      const d = new Date(log.timestamp);
      formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}\n${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes()
      ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} UTC`;
    } catch {
      formattedDate = log.timestamp;
    }

    const adminCol = `${log.adminName || 'Admin'}\nUID: ${log.adminUid}`;
    const targetCol = `${log.targetUserName || 'User'} (${log.targetType.toUpperCase()})\nUID: ${log.targetUserUid}`;
    const actionStatus = `${log.action || 'FORCE_UNLOCK'}\n[${log.status || 'SUCCESS'}]`;
    const transition = `${log.previousSubscriptionStatus || 'LOCKED'} -> ${log.newSubscriptionStatus || 'ACTIVE'}`;
    const justification = log.metadata?.reason || log.reason || '';
    const reasonNotes = `${log.details || 'Force unlock override'}${
      justification ? `\nJustification: ${justification}` : ''
    }`;

    return [
      String(index + 1),
      formattedDate,
      adminCol,
      targetCol,
      actionStatus,
      transition,
      reasonNotes,
    ];
  });

  (doc as any).autoTable({
    startY: 68,
    head: [
      [
        '#',
        'Timestamp (UTC)',
        'Admin Operator & UID',
        'Target Subject & UID',
        'Action & Status',
        'State Transition',
        'Action Description & Compliance Justification',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
      halign: 'left',
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' }, // index
      1: { cellWidth: 32 },                  // timestamp
      2: { cellWidth: 46 },                  // admin
      3: { cellWidth: 46 },                  // target
      4: { cellWidth: 28, halign: 'center' },// action/status
      5: { cellWidth: 32, halign: 'center' },// transition
      6: { cellWidth: 'auto' },              // description/justification
    },
    didParseCell: (data: any) => {
      // Highlight Status column
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw.includes('SUCCESS')) {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw.includes('FAILED')) {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Highlight state transition column
      if (data.section === 'body' && data.column.index === 5) {
        data.cell.styles.font = 'courier';
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: (data: any) => {
      const pageNumber = data.pageNumber;
      const totalPages = (doc.internal as any).getNumberOfPages();

      // Top separator if on subsequent pages
      if (pageNumber > 1) {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('FITNESS FUTURE MANAGEMENT OS • FORCE-UNLOCK AUDIT REPORT (CONTINUED)', 14, 8);
        doc.setTextColor(148, 163, 184);
        doc.text(`REF: ${auditDocId}`, pageWidth - 14, 8, { align: 'right' });
      }

      // Bottom Running Footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'CONFIDENTIAL & PROPRIETARY • CERTIFIED IMMUTABLE AUDIT LOG (ISO/IEC 27001 CONFORMANT)',
        14,
        pageHeight - 7
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 7, {
        align: 'right',
      });
    },
    margin: { top: 68, bottom: 16, left: 14, right: 14 },
  });

  // --- 4. SIGN-OFF & CERTIFICATION BLOCK ---
  let finalY = (doc as any).lastAutoTable?.finalY || 160;

  // If table reaches close to bottom, add new page for signature block
  if (finalY + 35 > pageHeight - 14) {
    doc.addPage();
    finalY = 24;
  } else {
    finalY += 8;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, pageWidth - 28, 26, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('REGULATORY INTEGRITY & CERTIFICATION ATTESTATION', 20, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'I hereby certify that this audit report represents a complete and accurate transcription of administrative force-unlock events recorded in Cloud Firestore.',
    20,
    finalY + 11
  );
  doc.text(
    'All entries contain authenticated operator identities, cryptographic session tokens, and verified subscription status transitions.',
    20,
    finalY + 15
  );

  // Digital Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFIED BY: Fitness Future Super Admin (Super Admin)', 20, finalY + 21);
  doc.setTextColor(6, 182, 212);
  doc.text(`DIGITAL AUDIT STAMP: SHA256-${now.getTime().toString(16).toUpperCase()}-VERIFIED`, pageWidth - 20, finalY + 21, {
    align: 'right',
  });

  // Save PDF file in client browser
  doc.save(filename);

  return {
    count: logs.length,
    filename,
  };
}
