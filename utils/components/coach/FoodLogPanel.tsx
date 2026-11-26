import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Utensils } from 'lucide-react';
import { newId } from '../../../lib/coachData';
import { addFirestoreFoodLog, deleteFirestoreFoodLog, driveFileName, FoodLog, useDriveJson, useFirestoreFoodLogs, usePersonalSettings } from '../../../lib/personalData';
import { useSessionStore } from '../../../lib/session';
import { useToast } from '../../hooks/useToast';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Select, Sheet, Spinner, Textarea, fmtDate, localIsoDate } from '../ui';
import { DriveConnectBanner } from './ProgressPanel';

const MEALS = ['Breakfast', 'Mid-morning', 'Lunch', 'Evening snack', 'Pre-workout', 'Post-workout', 'Dinner', 'Other'];
const numOrNull = (v: string, hi: number) => {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) && n >= 0 && n <= hi ? Math.round(n) : null;
};

/** Member's personal food diary — Google Drive (if enabled) or Firestore fallback. Only the member sees it. */
export const FoodLogPanel: React.FC<{ gymId: string; memberId: number; preview?: boolean }> = ({ gymId, memberId, preview }) => {
  const uid = useSessionStore((s) => s.user?.uid || '');
  const { addToast } = useToast();
  const settings = usePersonalSettings();
  const drive = !preview && settings.mode === 'drive';
  const dd = useDriveJson<FoodLog[]>(drive ? driveFileName(gymId, memberId, 'food') : null, []);
  const fs = useFirestoreFoodLogs(gymId, memberId, !drive && !preview);
  const rows = drive ? dd.data : fs.rows;
  const loading = drive ? dd.loading && dd.data.length === 0 : fs.loading;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ date: localIsoDate(), meal: 'Breakfast', text: '', calories: '', proteinG: '' });

  const byDay = useMemo(() => {
    const m = new Map<string, FoodLog[]>();
    [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.createdAtMs - a.createdAtMs).forEach((r) => m.set(r.date, [...(m.get(r.date) || []), r]));
    return [...m.entries()].slice(0, 30);
  }, [rows]);

  if (preview) {
    return (
      <Card>
        <EmptyState icon={<Utensils className="w-5 h-5" />} title="Private to the member">The food diary is personal data and is not shown to the gym.</EmptyState>
      </Card>
    );
  }

  const save = async () => {
    if (!form.text.trim()) {
      addToast('Write what you ate.', 'error');
      return;
    }
    setBusy(true);
    const entry: FoodLog = {
      id: newId('FOOD'),
      date: form.date.slice(0, 10),
      meal: form.meal,
      text: form.text.trim().slice(0, 500),
      calories: numOrNull(form.calories, 5000),
      proteinG: numOrNull(form.proteinG, 500),
      createdAtMs: Date.now(),
    };
    try {
      if (drive) await dd.save([entry, ...dd.data].slice(0, 2000));
      else await addFirestoreFoodLog(gymId, memberId, uid, entry);
      setOpen(false);
      setForm((f) => ({ ...f, text: '', calories: '', proteinG: '' }));
    } catch (e: any) {
      addToast(`Could not save: ${e?.code || e?.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: FoodLog) => {
    try {
      if (drive) await dd.save(dd.data.filter((x) => x.id !== r.id));
      else await deleteFirestoreFoodLog(gymId, r.id);
    } catch (e: any) {
      addToast(`Could not delete: ${e?.code || e?.message}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {drive && dd.needsConnect && <DriveConnectBanner onConnect={() => void dd.connect()} error={dd.error} />}
      <Card padded={false}>
        <div className="px-4 pt-4">
          <CardHeader
            title="Food diary"
            subtitle={drive ? 'Stored privately in your Google Drive' : 'Only you can see this'}
            icon={<Utensils className="w-4 h-4" />}
            action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Add</Button>}
          />
        </div>
        {loading ? (
          <Spinner />
        ) : byDay.length === 0 ? (
          <EmptyState icon={<Utensils className="w-5 h-5" />} title="Nothing logged yet">Log your meals to spot habits — the AI Coach can help you plan better meals.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {byDay.map(([date, items]) => {
              const kcal = items.reduce((s, i) => s + (i.calories || 0), 0);
              const prot = items.reduce((s, i) => s + (i.proteinG || 0), 0);
              return (
                <div key={date} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{fmtDate(date)}</span>
                    <span className="flex gap-1.5">{kcal > 0 && <Badge>{kcal} kcal</Badge>}{prot > 0 && <Badge tone="brand">{prot} g protein</Badge>}</span>
                  </div>
                  <ul className="space-y-1">
                    {items.map((i) => (
                      <li key={i.id} className="flex items-start gap-2 text-sm">
                        <span className="text-xs text-subtle w-24 shrink-0 pt-0.5">{i.meal}</span>
                        <span className="flex-1 min-w-0 text-muted whitespace-pre-wrap">{i.text}{i.calories ? ` · ${i.calories} kcal` : ''}</span>
                        <button type="button" aria-label="Delete entry" className="p-1 text-subtle hover:text-rose-500 cursor-pointer" onClick={() => void remove(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Log food"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={() => void save()}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={form.date} max={localIsoDate()} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Meal">
            <Select value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })}>{MEALS.map((m) => <option key={m}>{m}</option>)}</Select>
          </Field>
        </div>
        <Field label="What did you eat?"><Textarea value={form.text} maxLength={500} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="e.g. 2 roti, dal, salad, 1 bowl curd" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calories (optional)"><Input inputMode="numeric" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></Field>
          <Field label="Protein g (optional)"><Input inputMode="numeric" value={form.proteinG} onChange={(e) => setForm({ ...form, proteinG: e.target.value })} /></Field>
        </div>
      </Sheet>
    </div>
  );
};

export default FoodLogPanel;
