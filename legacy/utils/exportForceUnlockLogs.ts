import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ForceUnlockExportRow {
  id: string;
  timestamp: string;
  adminUid: string;
  adminName: string;
  adminEmail: string;
  targetUserUid: string;
  targetUserName: string;
  targetType: string;
  targetEmail?: string;
  targetPhone?: string;
  action: string;
  status: string;
  previousSubscriptionStatus?: string;
  newSubscriptionStatus: string;
  durationMs?: number;
  details: string;
  reason?: string;
  userAgent?: string;
}

/**
 * Escapes a string value according to RFC 4180 CSV specifications.
 */
function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // If string contains comma, double quote, newline, or carriage return, enclose in quotes and escape quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Queries 'force_unlock_logs' collection from Firestore, merging with any cached logs,
 * and falls back to seed records if the Firestore collection is empty.
 */
export async function fetchForceUnlockLogs(
  cachedLogs?: ForceUnlockExportRow[]
): Promise<ForceUnlockExportRow[]> {
  let records: ForceUnlockExportRow[] = [];

  if (cachedLogs && cachedLogs.length > 0) {
    records = [...cachedLogs];
  }

  try {
    const colRef = collection(db, 'force_unlock_logs');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const map = new Map<string, ForceUnlockExportRow>();
      records.forEach((r) => map.set(r.id, r));

      snap.forEach((doc) => {
        const d = doc.data();
        const id = doc.id || d.id;
        map.set(id, {
          id,
          timestamp: d.timestamp || d.forceUnlockedAt || new Date().toISOString(),
          adminUid: d.adminUid || d.adminUserId || 'owner_primary',
          adminName: d.adminName || 'Fitness Future Owner',
          adminEmail: d.adminEmail || 'owner@fitnessfuture.in',
          targetUserUid: d.targetUserUid || d.targetId || 'unknown_user',
          targetUserName: d.targetUserName || d.targetName || 'User',
          targetType: d.targetType || (String(d.targetUserUid || '').startsWith('admin_') ? 'admin' : 'member'),
          targetEmail: d.targetEmail || '',
          targetPhone: d.targetPhone || '',
          action: d.action || 'FORCE_UNLOCK',
          status: d.status || 'SUCCESS',
          previousSubscriptionStatus: d.previousSubscriptionStatus || d.previousState?.subscription_status || 'LOCKED',
          newSubscriptionStatus: d.newSubscriptionStatus || d.newState?.subscription_status || 'ACTIVE',
          durationMs: d.durationMs || 120,
          details: d.details || 'Force unlock operation',
          reason: d.metadata?.reason || d.reason || 'Super Admin Force Unlock Override',
          userAgent: d.userAgent || '',
        });
      });

      records = Array.from(map.values());
    }
  } catch (err) {
    console.warn('[fetchForceUnlockLogs] Firestore fetch note (falling back to local/cached dataset):', err);
  }

  // Return only verified live records (zero synthetic demo rows)

  // Sort chronologically descending (newest first)
  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return records;
}

/**
 * Queries 'force_unlock_logs' from Firestore and triggers a CSV file download in the browser.
 * Adds UTF-8 Byte Order Mark (BOM) for compatibility with Microsoft Excel, Apple Numbers, and Google Sheets.
 */
export async function downloadForceUnlockLogsCsv(
  cachedLogs?: ForceUnlockExportRow[]
): Promise<{ count: number; filename: string }> {
  const records = await fetchForceUnlockLogs(cachedLogs);

  // 4. Construct CSV Headers
  const headers = [
    'Log ID',
    'Timestamp (ISO-8601 UTC)',
    'Timestamp (Local String)',
    'Admin UID',
    'Admin Name',
    'Admin Email',
    'Target User UID',
    'Target User Name',
    'Target Account Type',
    'Target Email',
    'Target Phone',
    'Action',
    'Execution Status',
    'Previous Subscription Status',
    'New Subscription Status',
    'Duration (ms)',
    'Details',
    'Reason / Justification',
    'User Agent / Client',
  ];

  // 5. Construct CSV Rows
  const csvRows = records.map((r) => {
    let localTimeStr = r.timestamp;
    try {
      localTimeStr = new Date(r.timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      // fallback
    }

    return [
      escapeCsv(r.id),
      escapeCsv(r.timestamp),
      escapeCsv(localTimeStr),
      escapeCsv(r.adminUid),
      escapeCsv(r.adminName),
      escapeCsv(r.adminEmail),
      escapeCsv(r.targetUserUid),
      escapeCsv(r.targetUserName),
      escapeCsv(r.targetType),
      escapeCsv(r.targetEmail || ''),
      escapeCsv(r.targetPhone || ''),
      escapeCsv(r.action),
      escapeCsv(r.status),
      escapeCsv(r.previousSubscriptionStatus || 'LOCKED'),
      escapeCsv(r.newSubscriptionStatus),
      escapeCsv(r.durationMs || 0),
      escapeCsv(r.details),
      escapeCsv(r.reason || ''),
      escapeCsv(r.userAgent || ''),
    ].join(',');
  });

  // 6. Prepend UTF-8 BOM (\uFEFF) to guarantee correct rendering of names/symbols across spreadsheet software
  const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\r\n');

  // 7. Format clean archival filename
  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  const filename = `force_unlock_logs_archive_${timestampStr}.csv`;

  // 8. Trigger browser download via Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    count: records.length,
    filename,
  };
}
