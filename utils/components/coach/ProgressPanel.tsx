import React, { useMemo, useState } from 'react';
import { Cloud, LineChart, Plus, Share2, Trash2 } from 'lucide-react';
import { addProgressLog, buildProgressLog, deleteProgressLog, ProgressInput, ProgressLog, useProgressLogs } from '../../../lib/coachData';
import { buildSummary, driveFileName, useDriveJson, usePersonalSettings, useProgressSummary, writeProgressSummary } from '../../../lib/personalData';
import { useSessionStore } from '../../../lib/session';
import { useToast } from '../../hooks/useToast';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Sheet, Spinner, Tabs, Textarea, fmtDate, localIsoDate } from '../ui';

type Metric = 'weightKg' | 'waistCm' | 'bodyFatPct' | 'chestCm' | 'armsCm';
const METRICS: Array<{ id: Metric; label: string; unit: string }> = [
  { id: 'weightKg', label: 'Weight', unit: 'kg' },
  { id: 'waistCm', label: 'Waist', unit: 'cm' },
  { id: 'bodyFatPct', label: 'Body fat', unit: '%' },
  { id: 'chestCm', label: 'Chest', unit: 'cm' },
  { id: 'armsCm', label: 'Arms', unit: 'cm' },
];

/** Tiny dependency-free SVG line chart (keeps the member bundle small). */
const TrendChart: React.FC<{ points: Array<{ x: string; y: number }>; unit: string }> = ({ points, unit }) => {
  if (points.length < 2) {
    return <p className="text-xs text-muted py-6 text-center">Add at least two entries to see your trend.</p>;
  }
  const W = 320;
  const H = 140;
  const P = 24;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const xy = points.map((p, i) => ({
    ...p,
    cx: P + (i * (W - 2 * P)) / (points.length - 1),
    cy: H - P - ((p.y - min) / span) * (H - 2 * P),
  }));
  const d = xy.map((p, i) => `${i ? 'L' : 'M'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
  const first = points[0].y;
  const last = points[points.length - 1].y;
  const delta = Math.round((last - first) * 10) / 10;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label={`Trend from ${first} to ${last} ${unit}`}>
        <line x1={P} x2={W - P} y1={H - P} y2={H - P} className="stroke-line" strokeWidth="1" />
        <path d={`${d} L${xy[xy.length - 1].cx},${H - P} L${xy[0].cx},${H - P} Z`} className="fill-brand/10" />
        <path d={d} fill="none" className="stroke-brand" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {xy.map((p) => (
          <circle key={p.x + p.cy} cx={p.cx} cy={p.cy} r="3.5" className="fill-surface stroke-brand" strokeWidth="2" />
        ))}
        <text x={P} y={14} className="fill-subtle" fontSize="10">{max} {unit}</text>
        <text x={P} y={H - 6} className="fill-subtle" fontSize="10">{fmtDate(points[0].x)}</text>
        <text x={W - P} y={H - 6} textAnchor="end" className="fill-subtle" fontSize="10">{fmtDate(points[points.length - 1].x)}</text>
      </svg>
      <figcaption className="text-xs text-muted text-center">
        {first} → <b className="text-fg">{last} {unit}</b> ({delta > 0 ? '+' : ''}{delta} {unit} over {points.length} entries)
      </figcaption>
    </figure>
  );
};

/** Banner shown when the member's personal data is in Google Drive but the session token is missing/expired. */
export const DriveConnectBanner: React.FC<{ onConnect: () => void; error?: string | null }> = ({ onConnect, error }) => (
  <Card className="border-sky-500/40">
    <div className="flex items-start gap-3">
      <Cloud className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Your personal data is in your Google Drive</p>
        <p className="text-xs text-muted">Showing the copy saved on this phone. Connect to load the latest and save changes.</p>
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>
      <Button size="sm" onClick={onConnect}>Connect</Button>
    </div>
  </Card>
);

/** Small read-only card: what the member chose to share with the trainer. */
export const SharedSummaryCard: React.FC<{ gymId: string; memberId: number }> = ({ gymId, memberId }) => {
  const s = useProgressSummary(gymId, memberId);
  if (!s) return null;
  return (
    <Card>
      <CardHeader title="Shared by the member" subtitle={`From their private Google Drive log · updated ${fmtDate(new Date(s.updatedAtMs).toISOString())}`} icon={<Share2 className="w-4 h-4" />} />
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface2 py-2"><div className="text-base font-bold">{s.latestWeightKg ?? '—'}</div><div className="text-[10px] text-subtle">Latest kg{s.latestDate ? ` · ${fmtDate(s.latestDate)}` : ''}</div></div>
        <div className="rounded-xl bg-surface2 py-2"><div className="text-base font-bold">{s.startWeightKg ?? '—'}</div><div className="text-[10px] text-subtle">Start kg</div></div>
        <div className="rounded-xl bg-surface2 py-2"><div className="text-base font-bold">{s.goalProgressPct != null ? `${s.goalProgressPct}%` : '—'}</div><div className="text-[10px] text-subtle">Goal{s.targetWeightKg ? ` (${s.targetWeightKg} kg)` : ''}</div></div>
      </div>
      <p className="text-[11px] text-subtle mt-2">{s.entries} entries in their private log.</p>
    </Card>
  );
};

/**
 * Progress log + chart for one member. Used by the Member portal (own progress, stored in their Google
 * Drive or Firestore) and by staff (Firestore entries + the summary the member chose to share).
 */
export const ProgressPanel: React.FC<{ gymId: string; memberId: number; readOnly?: boolean; targetWeightKg?: number | null }> = ({ gymId, memberId, readOnly, targetWeightKg }) => {
  const uid = useSessionStore((s) => s.user?.uid || '');
  const role = useSessionStore((s) => s.role || 'member');
  const { addToast } = useToast();
  const settings = usePersonalSettings();
  const ownMember = role === 'member' && !readOnly;
  const drive = ownMember && settings.mode === 'drive';
  const fs = useProgressLogs(gymId, memberId);
  const dd = useDriveJson<ProgressLog[]>(drive ? driveFileName(gymId, memberId, 'progress') : null, []);
  const rows = useMemo(
    () => (drive ? [...dd.data, ...fs.rows] : fs.rows).sort((a, b) => b.date.localeCompare(a.date) || b.createdAtMs - a.createdAtMs),
    [drive, dd.data, fs.rows]
  );
  const loading = drive ? dd.loading && dd.data.length === 0 : fs.loading;
  const error = drive ? dd.error : fs.error;
  const inDrive = (r: ProgressLog) => drive && dd.data.some((x) => x.id === r.id);
  const [metric, setMetric] = useState<Metric>('weightKg');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<ProgressInput>({ date: localIsoDate() });

  const series = useMemo(() => {
    return [...rows]
      .filter((r) => typeof r[metric] === 'number')
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAtMs - b.createdAtMs)
      .slice(-20)
      .map((r) => ({ x: r.date, y: r[metric] as number }));
  }, [rows, metric]);

  const save = async () => {
    setBusy(true);
    try {
      if (drive) {
        const log = buildProgressLog(gymId, memberId, uid, role, form);
        const next = [log, ...dd.data].slice(0, 1000);
        await dd.save(next);
        if (settings.shareProgress) {
          await writeProgressSummary(buildSummary(gymId, memberId, uid, [...next, ...fs.rows], targetWeightKg ?? null)).catch(() => undefined);
        }
      } else {
        await addProgressLog(gymId, memberId, uid, role, form);
      }
      addToast(drive ? 'Saved to your Google Drive.' : 'Progress saved.', 'success');
      setOpen(false);
      setForm({ date: localIsoDate() });
    } catch (e: any) {
      addToast(e?.message?.startsWith('Enter') ? e.message : `Could not save: ${e?.code || e?.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: ProgressLog) => {
    if (!window.confirm(`Delete the entry from ${fmtDate(r.date)}?`)) return;
    try {
      if (inDrive(r)) {
        const next = dd.data.filter((x) => x.id !== r.id);
        await dd.save(next);
        if (settings.shareProgress) await writeProgressSummary(buildSummary(gymId, memberId, uid, [...next, ...fs.rows], targetWeightKg ?? null)).catch(() => undefined);
      } else {
        await deleteProgressLog(gymId, r.id);
      }
    } catch (e: any) {
      addToast(`Could not delete: ${e?.code || e?.message}`, 'error');
    }
  };

  const metricInfo = METRICS.find((m) => m.id === metric)!;
  const setF = (k: keyof ProgressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      {drive && dd.needsConnect && <DriveConnectBanner onConnect={() => void dd.connect()} error={dd.error} />}
      {!ownMember && <SharedSummaryCard gymId={gymId} memberId={memberId} />}
      <Card>
        <CardHeader
          title="Progress"
          subtitle={drive ? 'Stored privately in your Google Drive' : 'Weight and body measurements over time'}
          icon={<LineChart className="w-4 h-4" />}
          action={!readOnly && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Add entry</Button>}
        />
        <Tabs value={metric} onChange={setMetric} items={METRICS.map((m) => ({ id: m.id, label: m.label }))} />
        <div className="mt-3">
          {loading ? <Spinner /> : error ? <p className="text-xs text-rose-500">Could not load progress ({error}).</p> : <TrendChart points={series} unit={metricInfo.unit} />}
        </div>
      </Card>

      <Card padded={false}>
        <div className="px-4 pt-4 pb-2 text-sm font-semibold">History</div>
        {!loading && rows.length === 0 ? (
          <EmptyState icon={<LineChart className="w-5 h-5" />} title="No entries yet">
            {readOnly ? 'No progress has been logged for this member yet.' : 'Log your weight and measurements every 1–2 weeks to see your progress here.'}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{fmtDate(r.date)}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {r.weightKg != null && <Badge tone="brand">{r.weightKg} kg</Badge>}
                    {r.bodyFatPct != null && <Badge>BF {r.bodyFatPct}%</Badge>}
                    {r.chestCm != null && <Badge>Chest {r.chestCm}</Badge>}
                    {r.waistCm != null && <Badge>Waist {r.waistCm}</Badge>}
                    {r.hipsCm != null && <Badge>Hips {r.hipsCm}</Badge>}
                    {r.armsCm != null && <Badge>Arms {r.armsCm}</Badge>}
                    {r.thighsCm != null && <Badge>Thighs {r.thighsCm}</Badge>}
                  </div>
                  {r.notes && <p className="text-xs text-muted mt-1 whitespace-pre-wrap">{r.notes}</p>}
                  <p className="text-[11px] text-subtle mt-0.5">by {r.createdBy === uid ? 'you' : r.createdByRole}{inDrive(r) ? ' · in your Drive' : ''}</p>
                </div>
                {!readOnly && r.createdBy === uid && (
                  <button type="button" onClick={() => void remove(r)} className="p-2 text-subtle hover:text-rose-500 cursor-pointer" aria-label={`Delete entry ${r.date}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add progress entry"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={() => void save()}>Save</Button>
          </>
        }
      >
        <Field label="Date">
          <Input type="date" value={form.date} max={localIsoDate()} onChange={setF('date')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weight (kg)"><Input inputMode="decimal" value={form.weightKg ?? ''} onChange={setF('weightKg')} placeholder="e.g. 72.5" /></Field>
          <Field label="Body fat (%)"><Input inputMode="decimal" value={form.bodyFatPct ?? ''} onChange={setF('bodyFatPct')} placeholder="optional" /></Field>
          <Field label="Chest (cm)"><Input inputMode="decimal" value={form.chestCm ?? ''} onChange={setF('chestCm')} /></Field>
          <Field label="Waist (cm)"><Input inputMode="decimal" value={form.waistCm ?? ''} onChange={setF('waistCm')} /></Field>
          <Field label="Hips (cm)"><Input inputMode="decimal" value={form.hipsCm ?? ''} onChange={setF('hipsCm')} /></Field>
          <Field label="Arms (cm)"><Input inputMode="decimal" value={form.armsCm ?? ''} onChange={setF('armsCm')} /></Field>
          <Field label="Thighs (cm)"><Input inputMode="decimal" value={form.thighsCm ?? ''} onChange={setF('thighsCm')} /></Field>
        </div>
        <Field label="Notes"><Textarea value={form.notes ?? ''} onChange={setF('notes')} maxLength={500} placeholder="How do you feel? Sleep, energy, soreness…" /></Field>
      </Sheet>
    </div>
  );
};

export default ProgressPanel;
