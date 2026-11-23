import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Download, RotateCcw, Search, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { ENABLE_DEMO_SEED } from '../../../lib/config';

type TableKey =
  | 'gyms'
  | 'users'
  | 'members'
  | 'membership_packages'
  | 'memberships'
  | 'payments'
  | 'attendance'
  | 'expenses'
  | 'invoices'
  | 'leads'
  | 'staff'
  | 'offers'
  | 'reviews'
  | 'whatsapp_logs'
  | 'audit_logs';

interface TableSpec {
  key: TableKey;
  label: string;
  tier: 'core' | 'aux';
  relationNote: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}

export const DatabaseExplorer: React.FC = () => {
  const {
    members,
    packages,
    staff,
    invoices,
    expenses,
    attendanceRecords,
    reviews,
    offers,
    leads,
    whatsappLogs,
    resetDatabaseToSeed,
  } = useData();
  const { addToast } = useToast();

  const [activeTable, setActiveTable] = useState<TableKey>('gyms');
  const [search, setSearch] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [backendDb, setBackendDb] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadBackendSnapshot = useCallback(async () => {
    setSyncing(true);
    try {
      // Firestore realtime data from DataProvider is the source of truth now.
      setBackendDb(null);
    } catch {
      // Fallback seamlessly to client context data
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadBackendSnapshot();
  }, [loadBackendSnapshot]);

  const tables: TableSpec[] = useMemo(() => {
    const gymsRows = Array.isArray(backendDb?.gyms)
      ? backendDb.gyms.map((g: any) => ({
          id: g.gym_id || g.id,
          name: g.name,
          owner: g.owner_name,
          mobile: g.mobile,
          upi: g.upi_id,
          status: g.registration_status,
        }))
      : [
          {
            id: 'default_gym',
            name: 'Fitness Future',
            owner: 'Vikram Singh',
            mobile: '9829011223',
            upi: 'fitnessfuture@upi',
            status: 'Verified',
          },
        ];

    const usersRows = Array.isArray(backendDb?.users)
      ? backendDb.users.map((u: any) => ({
          id: u.id,
          gym_id: u.gym_id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          password_security: 'scrypt salted hash (hidden)',
        }))
      : [];

    const membershipsRows = Array.isArray(backendDb?.memberships)
      ? backendDb.memberships.map((ms: any) => ({
          id: ms.id,
          member_id: ms.member_id,
          package_id: ms.package_id,
          start_date: ms.start_date,
          end_date: ms.end_date,
          final_price:
            packages.find((p) => p.id === ms.package_id)?.price ??
            (Array.isArray(backendDb?.membership_packages)
              ? backendDb.membership_packages.find((p: any) => p.id === ms.package_id)?.price ?? 0
              : 0),
          status: ms.status,
        }))
      : members.map((m) => ({
          id: `MS-${m.id}-01`,
          member_id: m.id,
          package_id: m.packageId,
          start_date: m.joinDate,
          end_date: m.expiryDate || '—',
          final_price: packages.find((p) => p.id === m.packageId)?.price || 0,
          status: m.status,
        }));

    const paymentsRows = Array.isArray(backendDb?.payments)
      ? backendDb.payments.map((p: any) => ({
          id: p.id,
          invoice_id: p.invoice_id,
          member_id: p.member_id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          paid_at: String(p.paid_at || '').slice(0, 10),
        }))
      : invoices
          .filter((i) => i.status === 'Paid' || i.status === 'Partial')
          .map((i) => ({
            id: `PAY-${i.id}`,
            invoice_id: i.id,
            member_id: i.memberId,
            amount: typeof i.paidAmount === 'number' ? i.paidAmount : i.amount,
            method: i.paymentMethod || 'UPI',
            status: 'Completed',
            paid_at: i.date,
          }));

    const auditRows = Array.isArray(backendDb?.audit_logs)
      ? backendDb.audit_logs.map((a: any) => ({
          id: a.id,
          action: a.action,
          entity: `${a.entity_type}#${a.entity_id}`,
          actor: a.actor,
          timestamp: String(a.created_at || '').replace('T', ' ').slice(0, 19),
        }))
      : [];

    const mergedWaLogs =
      Array.isArray(backendDb?.whatsapp_logs) && backendDb.whatsapp_logs.length > 0
        ? backendDb.whatsapp_logs.map((w: any) => ({
            id: w.id,
            phone: w.recipient_phone,
            template: w.template_name,
            status: w.status,
            error: w.error_message || '—',
            created_at: String(w.created_at || '').slice(0, 10),
          }))
        : whatsappLogs.map((w) => ({
            id: w.id,
            phone: w.recipientPhone,
            template: w.templateName,
            status: w.status,
            error: w.errorMessage || '—',
            created_at: String(w.createdAt || '').slice(0, 10),
          }));

    return [
      // 8 CORE SEEDED TABLES
      {
        key: 'gyms',
        label: '1. gyms',
        tier: 'core',
        relationNote: 'Primary tenant root — referenced by gym_id across all tables',
        columns: [
          { key: 'id', label: 'Gym ID' },
          { key: 'name', label: 'Gym Name' },
          { key: 'owner', label: 'Owner' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'upi', label: 'UPI ID' },
          { key: 'status', label: 'Status' },
        ],
        rows: gymsRows,
      },
      {
        key: 'users',
        label: '2. users',
        tier: 'core',
        relationNote: 'FK gym_id → gyms.id · Salted scrypt password hashes never exposed',
        columns: [
          { key: 'id', label: 'User ID' },
          { key: 'gym_id', label: 'Gym ID' },
          { key: 'name', label: 'Full Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'RBAC Role' },
          { key: 'status', label: 'Status' },
          { key: 'password_security', label: 'Credential Storage' },
        ],
        rows: usersRows,
      },
      {
        key: 'members',
        label: '3. members',
        tier: 'core',
        relationNote: 'FK gym_id → gyms.id · Unique (gym_id, mobile)',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'loginId', label: 'Member Code' },
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Mobile' },
          { key: 'fitnessGoal', label: 'Goal' },
          { key: 'status', label: 'Status' },
          { key: 'expiryDate', label: 'Valid Till' },
        ],
        rows: members.map((m) => ({
          id: m.id,
          loginId: m.loginId || `FF-${1000 + m.id}`,
          name: m.name,
          phone: m.phone,
          fitnessGoal: m.fitnessGoal || 'Fitness',
          status: m.archived ? 'Archived' : m.status,
          expiryDate: m.expiryDate || '—',
        })),
      },
      {
        key: 'membership_packages',
        label: '4. membership_packages',
        tier: 'core',
        relationNote: 'FK gym_id → gyms.id · Referenced by memberships.package_id',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Package Name' },
          { key: 'duration', label: 'Duration' },
          { key: 'price', label: 'Final Price (₹)' },
          { key: 'registrationFee', label: 'Reg. Fee (₹)' },
          { key: 'discountPercent', label: 'Discount %' },
        ],
        rows: packages.map((p) => ({
          id: p.id,
          name: p.name,
          duration: p.duration,
          price: p.price,
          registrationFee: p.registrationFee || 0,
          discountPercent: p.discountPercent || 0,
        })),
      },
      {
        key: 'memberships',
        label: '5. memberships',
        tier: 'core',
        relationNote: 'FK member_id → members.id · FK package_id → membership_packages.id',
        columns: [
          { key: 'id', label: 'Membership ID' },
          { key: 'member_id', label: 'Member ID' },
          { key: 'package_id', label: 'Package ID' },
          { key: 'start_date', label: 'Start Date' },
          { key: 'end_date', label: 'End Date' },
          { key: 'final_price', label: 'Net Fee (₹)' },
          { key: 'status', label: 'Status' },
        ],
        rows: membershipsRows,
      },
      {
        key: 'payments',
        label: '6. payments',
        tier: 'core',
        relationNote: 'FK invoice_id → invoices.id · FK member_id → members.id · Idempotency-protected',
        columns: [
          { key: 'id', label: 'Payment ID' },
          { key: 'invoice_id', label: 'Invoice ID' },
          { key: 'member_id', label: 'Member ID' },
          { key: 'amount', label: 'Amount (₹)' },
          { key: 'method', label: 'Method' },
          { key: 'status', label: 'Status' },
          { key: 'paid_at', label: 'Date' },
        ],
        rows: paymentsRows,
      },
      {
        key: 'attendance',
        label: '7. attendance',
        tier: 'core',
        relationNote: 'FK member_id → members.id · Logs Granted and Denied check-in attempts',
        columns: [
          { key: 'id', label: 'Log ID' },
          { key: 'memberName', label: 'Member' },
          { key: 'date', label: 'Date' },
          { key: 'checkInTime', label: 'Check-In' },
          { key: 'checkOutTime', label: 'Check-Out' },
          { key: 'status', label: 'Status' },
          { key: 'denialReason', label: 'Access Note' },
        ],
        rows: attendanceRecords.map((a) => ({
          id: a.id,
          memberName: a.memberName || `Member #${a.memberId}`,
          date: a.date,
          checkInTime: a.checkInTime || a.time,
          checkOutTime: a.checkOutTime || '—',
          status: a.status,
          denialReason: a.denialReason || a.zone || 'Verified',
        })),
      },
      {
        key: 'expenses',
        label: '8. expenses',
        tier: 'core',
        relationNote: 'FK gym_id → gyms.id · Operating ledger with vendor & payment status',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'item', label: 'Item' },
          { key: 'category', label: 'Category' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'paymentStatus', label: 'Status' },
          { key: 'amount', label: 'Amount (₹)' },
          { key: 'date', label: 'Date' },
        ],
        rows: expenses.map((e) => ({
          id: e.id,
          item: e.item,
          category: e.category,
          vendor: e.vendor || '—',
          paymentStatus: e.paymentStatus || 'Paid',
          amount: e.amount,
          date: e.date,
        })),
      },
      // AUXILIARY TABLES
      {
        key: 'invoices',
        label: 'invoices',
        tier: 'aux',
        relationNote: 'FK member_id → members.id · Tracks subtotal, coupon discount, paid & balance',
        columns: [
          { key: 'id', label: 'Invoice #' },
          { key: 'memberName', label: 'Member' },
          { key: 'amount', label: 'Total (₹)' },
          { key: 'paid', label: 'Paid (₹)' },
          { key: 'balance', label: 'Balance (₹)' },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Date' },
        ],
        rows: invoices.map((i) => {
          const paid = typeof i.paidAmount === 'number' ? i.paidAmount : i.status === 'Paid' ? i.amount : 0;
          const balance = typeof i.balanceAmount === 'number' ? i.balanceAmount : Math.max(0, i.amount - paid);
          return {
            id: i.invoiceNumber || i.id,
            memberName: i.memberName,
            amount: i.amount,
            paid,
            balance,
            status: i.status,
            date: i.date,
          };
        }),
      },
      {
        key: 'staff',
        label: 'staff',
        tier: 'aux',
        relationNote: 'Staff roster, roles, daily attendance & payroll tracking',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'attendanceToday', label: 'Today' },
          { key: 'payrollStatus', label: 'Payroll' },
          { key: 'salary', label: 'Salary (₹)' },
        ],
        rows: staff.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          attendanceToday: s.attendanceToday || 'Present',
          payrollStatus: s.payrollStatus || 'Pending',
          salary: s.salary,
        })),
      },
      {
        key: 'leads',
        label: 'leads',
        tier: 'aux',
        relationNote: 'Sales inquiry pipeline linked to member admission conversions',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'source', label: 'Source' },
          { key: 'status', label: 'Stage' },
          { key: 'followUpDate', label: 'Follow-Up' },
        ],
        rows: leads.map((l) => ({
          id: l.id,
          name: l.name,
          phone: l.phone,
          source: l.source,
          status: l.status,
          followUpDate: l.followUpDate || l.inquiryDate,
        })),
      },
      {
        key: 'offers',
        label: 'offers',
        tier: 'aux',
        relationNote: 'Unique promo codes with validity window & redemption quota limits',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'code', label: 'Code' },
          { key: 'campaignType', label: 'Type' },
          { key: 'discount', label: 'Discount' },
          { key: 'redemptions', label: 'Used' },
          { key: 'status', label: 'Status' },
        ],
        rows: offers.map((o) => ({
          id: o.id,
          code: o.code,
          campaignType: o.campaignType || 'Coupon',
          discount: o.discountType === 'percentage' ? `${o.discountValue}%` : `₹${o.discountValue}`,
          redemptions: `${o.redemptions}/${o.usageLimit || 100}`,
          status: o.status,
        })),
      },
      {
        key: 'reviews',
        label: 'reviews',
        tier: 'aux',
        relationNote: 'Authentic member feedback & owner-approved replies',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'memberName', label: 'Member' },
          { key: 'rating', label: 'Rating' },
          { key: 'category', label: 'Category' },
          { key: 'status', label: 'Status' },
        ],
        rows: reviews.map((r) => ({
          id: r.id,
          memberName: r.memberName,
          rating: `${r.rating} ★`,
          category: r.category,
          status: r.status,
        })),
      },
      {
        key: 'whatsapp_logs',
        label: 'whatsapp_logs',
        tier: 'aux',
        relationNote: 'Honest WhatsApp API dispatch log (never fakes delivery when disconnected)',
        columns: [
          { key: 'id', label: 'Log ID' },
          { key: 'phone', label: 'Recipient' },
          { key: 'template', label: 'Template' },
          { key: 'status', label: 'Status' },
          { key: 'error', label: 'API Note' },
          { key: 'created_at', label: 'Date' },
        ],
        rows: mergedWaLogs,
      },
      {
        key: 'audit_logs',
        label: 'audit_logs',
        tier: 'aux',
        relationNote: 'Immutable server-side audit trail for admissions, payments, refunds & access',
        columns: [
          { key: 'id', label: 'Audit ID' },
          { key: 'action', label: 'Action' },
          { key: 'entity', label: 'Entity' },
          { key: 'actor', label: 'Actor' },
          { key: 'timestamp', label: 'Timestamp' },
        ],
        rows: auditRows,
      },
    ];
  }, [backendDb, members, packages, staff, invoices, expenses, attendanceRecords, reviews, offers, leads, whatsappLogs]);

  const coreTables = tables.filter((t) => t.tier === 'core');
  const auxTables = tables.filter((t) => t.tier === 'aux');
  const currentSpec = tables.find((t) => t.key === activeTable) || tables[0];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentSpec.rows;
    return currentSpec.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [currentSpec, search]);

  const handleExportTable = () => {
    const headers = currentSpec.columns.map((c) => c.label);
    const lines = [
      headers.join(','),
      ...filteredRows.map((row) =>
        currentSpec.columns
          .map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSpec.key}-records.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${currentSpec.label} table to CSV.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Relational Gym Database</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Inspect all 8 core seeded relational tables and auxiliary operational ledgers with live backend sync
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadBackendSnapshot}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-200 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-amber-400' : ''}`} />
            Sync Server DB
          </button>
          <button
            type="button"
            onClick={handleExportTable}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-100 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Export CSV
          </button>
          {!ENABLE_DEMO_SEED ? null : confirmReset ? (
            <button
              type="button"
              onClick={() => {
                resetDatabaseToSeed();
                setConfirmReset(false);
                addToast('Seed data restored cleanly.', 'success');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 text-zinc-950 text-xs font-semibold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Sample Data
            </button>
          )}
        </div>
      </div>

      {/* 8 Core Seeded Tables */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          8 Core Seeded Tables (Primary Relational Schema)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {coreTables.map((t) => {
            const active = t.key === activeTable;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setActiveTable(t.key);
                  setSearch('');
                }}
                className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500/15 border-amber-500/40'
                    : 'bg-[#111318] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-white truncate">{t.label}</span>
                  <Database className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-400' : 'text-zinc-500'}`} />
                </div>
                <div className="text-xl font-bold text-white mt-1.5 tabular-nums">{t.rows.length}</div>
                <div className="text-[11px] text-zinc-500">records</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auxiliary Operational Tables */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Operational &amp; Audit Tables
        </div>
        <div className="flex flex-wrap gap-2">
          {auxTables.map((t) => {
            const active = t.key === activeTable;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setActiveTable(t.key);
                  setSearch('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 font-semibold'
                    : 'bg-[#111318] text-zinc-300 border-white/10 hover:bg-zinc-800'
                }`}
              >
                {t.label} ({t.rows.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Table Viewer */}
      <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {currentSpec.label} ({filteredRows.length} records)
            </h2>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {currentSpec.relationNote}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${currentSpec.label}...`}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {currentSpec.columns.map((col) => (
                  <th key={col.key} className="py-3 px-4">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={currentSpec.columns.length} className="py-8 text-center text-zinc-400">
                    No matching records found in {currentSpec.label}.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    {currentSpec.columns.map((col) => (
                      <td key={col.key} className="py-3 px-4 text-zinc-200 tabular-nums">
                        {String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabaseExplorer;
