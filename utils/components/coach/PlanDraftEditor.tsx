import React, { useState } from 'react';
import { Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { aiTrainerPlan, MemberPlanContent, PlanDay } from '../../../lib/apiClient';
import { MemberPlan, saveMemberPlan } from '../../../lib/coachData';
import { useSessionStore } from '../../../lib/session';
import { WORKER_URL } from '../../../lib/config';
import { useToast } from '../../hooks/useToast';
import { Member } from '../../../types';
import { Button, Card, CardHeader, Field, Input, Select, Textarea } from '../ui';

const blankPlan = (): MemberPlanContent => ({
  title: 'Training plan',
  summary: '',
  durationWeeks: 4,
  workout: { daysPerWeek: 3, progression: '', days: [{ day: 'Day 1', focus: 'Full body', exercises: [{ name: '', sets: 3, reps: '10-12', restSeconds: 60 }] }] },
  diet: { dailyCalories: 2000, proteinG: 100, carbsG: 250, fatsG: 60, hydration: '', meals: [{ name: 'Breakfast', time: '8:00 AM', items: [''], calories: 400 }] },
  safetyNotes: [],
});

/**
 * Trainer flow: (1) ask the AI for a draft (or start blank), (2) review and edit every line,
 * (3) approve -> saved as the member's active plan in Firestore `plans` (old active plan archived).
 */
export const PlanDraftEditor: React.FC<{ gymId: string; member: Member; existing: MemberPlan[]; onSaved: () => void }> = ({ gymId, member, existing, onSaved }) => {
  const uid = useSessionStore((s) => s.user?.uid || '');
  const name = useSessionStore((s) => s.profile?.displayName || s.user?.displayName || s.user?.email || '');
  const role = useSessionStore((s) => s.role);
  const { addToast } = useToast();
  const [req, setReq] = useState({
    goal: member.fitnessGoal || '',
    level: member.trainingExperience || 'Beginner',
    daysPerWeek: '4',
    sessionMinutes: '60',
    dietType: 'Vegetarian',
    calories: '',
    allergies: '',
    equipment: '',
    notes: '',
    language: 'English',
  });
  const [draft, setDraft] = useState<MemberPlanContent | null>(null);
  const [source, setSource] = useState<'ai' | 'manual'>('ai');
  const [busy, setBusy] = useState<'gen' | 'save' | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const generate = async () => {
    setBusy('gen');
    const r = await aiTrainerPlan({
      memberId: member.id,
      gymId: role === 'super_admin' ? gymId : undefined,
      goal: req.goal,
      level: req.level,
      daysPerWeek: Number(req.daysPerWeek),
      sessionMinutes: Number(req.sessionMinutes),
      dietType: req.dietType,
      calories: req.calories ? Number(req.calories) : undefined,
      allergies: req.allergies,
      equipment: req.equipment,
      notes: req.notes,
      language: req.language,
    });
    setBusy(null);
    if (!r.ok || !r.data?.plan) {
      addToast(r.error || 'AI could not create a plan.', 'error');
      return;
    }
    setDraft(r.data.plan);
    setSource('ai');
    setRemaining(r.data.remaining);
    addToast('Draft ready — review every exercise and meal before approving.', 'success');
  };

  const save = async () => {
    if (!draft) return;
    const bad = draft.workout.days.some((d) => d.exercises.some((e) => !e.name.trim()));
    if (bad || !draft.title.trim()) {
      addToast('Every exercise needs a name, and the plan needs a title.', 'error');
      return;
    }
    setBusy('save');
    try {
      const clean: MemberPlanContent = {
        ...draft,
        workout: { ...draft.workout, daysPerWeek: draft.workout.days.length },
        diet: { ...draft.diet, meals: draft.diet.meals.map((m) => ({ ...m, items: m.items.map((i) => i.trim()).filter(Boolean) })) },
        safetyNotes: draft.safetyNotes.map((s) => s.trim()).filter(Boolean),
      };
      await saveMemberPlan(gymId, member.id, { uid, name }, clean, source, existing, member.name);
      addToast(`Plan assigned to ${member.name}.`, 'success');
      setDraft(null);
      onSaved();
    } catch (e: any) {
      addToast(`Could not save: ${e?.code || e?.message}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  // --- editing helpers
  const upd = (fn: (p: MemberPlanContent) => void) =>
    setDraft((p) => {
      if (!p) return p;
      const copy: MemberPlanContent = JSON.parse(JSON.stringify(p));
      fn(copy);
      return copy;
    });
  const setReqF = (k: keyof typeof req) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReq((r) => ({ ...r, [k]: e.target.value }));

  if (!draft) {
    return (
      <Card>
        <CardHeader title="New plan" subtitle="AI drafts it from the member’s goal, progress and your notes. You approve before the member sees it." icon={<Sparkles className="w-4 h-4" />} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Goal" className="col-span-2"><Input value={req.goal} onChange={setReqF('goal')} placeholder="e.g. Fat loss, muscle gain, strength" /></Field>
          <Field label="Level">
            <Select value={req.level} onChange={setReqF('level')}>
              {['Beginner', 'Intermediate', 'Advanced'].map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Days / week">
            <Select value={req.daysPerWeek} onChange={setReqF('daysPerWeek')}>
              {[2, 3, 4, 5, 6].map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Minutes / session"><Input inputMode="numeric" value={req.sessionMinutes} onChange={setReqF('sessionMinutes')} /></Field>
          <Field label="Diet">
            <Select value={req.dietType} onChange={setReqF('dietType')}>
              {['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan', 'Jain'].map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Calories (optional)"><Input inputMode="numeric" value={req.calories} onChange={setReqF('calories')} placeholder="auto" /></Field>
          <Field label="Language">
            <Select value={req.language} onChange={setReqF('language')}>
              {['English', 'Hindi', 'Hinglish'].map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Allergies / avoid" className="col-span-2"><Input value={req.allergies} onChange={setReqF('allergies')} placeholder="e.g. peanuts, lactose" /></Field>
          <Field label="Equipment" className="col-span-2"><Input value={req.equipment} onChange={setReqF('equipment')} placeholder="standard gym (default)" /></Field>
          <Field label="Notes for the AI" className="col-span-2"><Textarea value={req.notes} onChange={setReqF('notes')} maxLength={500} placeholder="Injuries, schedule, preferences…" /></Field>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button icon={<Wand2 className="w-4 h-4" />} loading={busy === 'gen'} disabled={!WORKER_URL} onClick={() => void generate()}>
            {busy === 'gen' ? 'Creating draft (up to 30s)…' : 'Generate with AI'}
          </Button>
          <Button variant="secondary" onClick={() => { setDraft(blankPlan()); setSource('manual'); }}>Write by hand</Button>
        </div>
        {!WORKER_URL && <p className="text-[11px] text-subtle mt-2">AI server not configured — you can still write plans by hand.</p>}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader
          title={source === 'ai' ? 'Review AI draft' : 'Write plan'}
          subtitle={source === 'ai' ? `Check every line — you are responsible for what the member receives.${remaining != null ? ` ${remaining} AI drafts left today.` : ''}` : 'Fill in the workout and diet.'}
          icon={<Sparkles className="w-4 h-4" />}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" className="col-span-2"><Input value={draft.title} maxLength={120} onChange={(e) => upd((p) => { p.title = e.target.value; })} /></Field>
          <Field label="Summary" className="col-span-2"><Textarea value={draft.summary} maxLength={1000} onChange={(e) => upd((p) => { p.summary = e.target.value; })} /></Field>
          <Field label="Duration (weeks)"><Input inputMode="numeric" value={draft.durationWeeks} onChange={(e) => upd((p) => { p.durationWeeks = Math.max(1, Math.min(52, Number(e.target.value) || 1)); })} /></Field>
          <Field label="Progression"><Input value={draft.workout.progression || ''} onChange={(e) => upd((p) => { p.workout.progression = e.target.value; })} /></Field>
        </div>
      </Card>

      {draft.workout.days.map((day: PlanDay, di) => (
        <Card key={di}>
          <div className="flex gap-2 mb-3">
            <Input aria-label="Day" value={day.day} onChange={(e) => upd((p) => { p.workout.days[di].day = e.target.value; })} className="w-28" />
            <Input aria-label="Focus" value={day.focus} onChange={(e) => upd((p) => { p.workout.days[di].focus = e.target.value; })} />
            <Button variant="ghost" aria-label="Remove day" onClick={() => upd((p) => { p.workout.days.splice(di, 1); })} icon={<Trash2 className="w-4 h-4" />} />
          </div>
          <div className="space-y-2">
            {day.exercises.map((ex, ei) => (
              <div key={ei} className="grid grid-cols-[1fr_52px_72px_64px_40px] gap-1.5 items-center">
                <Input aria-label="Exercise" placeholder="Exercise" value={ex.name} onChange={(e) => upd((p) => { p.workout.days[di].exercises[ei].name = e.target.value; })} className="h-10 text-xs" />
                <Input aria-label="Sets" inputMode="numeric" value={ex.sets} onChange={(e) => upd((p) => { p.workout.days[di].exercises[ei].sets = Math.max(1, Math.min(10, Number(e.target.value) || 1)); })} className="h-10 text-xs px-2" />
                <Input aria-label="Reps" value={ex.reps} onChange={(e) => upd((p) => { p.workout.days[di].exercises[ei].reps = e.target.value; })} className="h-10 text-xs px-2" />
                <Input aria-label="Rest seconds" inputMode="numeric" value={ex.restSeconds} onChange={(e) => upd((p) => { p.workout.days[di].exercises[ei].restSeconds = Math.max(0, Math.min(600, Number(e.target.value) || 0)); })} className="h-10 text-xs px-2" />
                <button type="button" aria-label="Remove exercise" className="h-10 flex items-center justify-center text-subtle hover:text-rose-500 cursor-pointer" onClick={() => upd((p) => { p.workout.days[di].exercises.splice(ei, 1); })}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="text-[10px] text-subtle grid grid-cols-[1fr_52px_72px_64px_40px] gap-1.5 px-1"><span>name</span><span>sets</span><span>reps</span><span>rest s</span><span /></div>
          </div>
          <Button size="sm" variant="secondary" className="mt-2" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => upd((p) => { p.workout.days[di].exercises.push({ name: '', sets: 3, reps: '10', restSeconds: 60 }); })}>
            Exercise
          </Button>
        </Card>
      ))}
      {draft.workout.days.length < 7 && (
        <Button variant="secondary" icon={<Plus className="w-4 h-4" />} onClick={() => upd((p) => { p.workout.days.push({ day: `Day ${p.workout.days.length + 1}`, focus: '', exercises: [{ name: '', sets: 3, reps: '10', restSeconds: 60 }] }); })}>
          Add training day
        </Button>
      )}

      <Card>
        <CardHeader title="Diet" subtitle="One food per line" />
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['dailyCalories', 'proteinG', 'carbsG', 'fatsG'] as const).map((k) => (
            <Field key={k} label={k === 'dailyCalories' ? 'kcal' : k.replace('G', ' g')}>
              <Input inputMode="numeric" value={draft.diet[k]} onChange={(e) => upd((p) => { p.diet[k] = Math.max(0, Number(e.target.value) || 0); })} className="px-2" />
            </Field>
          ))}
        </div>
        <div className="space-y-3">
          {draft.diet.meals.map((m, mi) => (
            <div key={mi} className="rounded-xl border border-line p-3 space-y-2">
              <div className="flex gap-2">
                <Input aria-label="Meal" value={m.name} onChange={(e) => upd((p) => { p.diet.meals[mi].name = e.target.value; })} />
                <Input aria-label="Time" value={m.time || ''} onChange={(e) => upd((p) => { p.diet.meals[mi].time = e.target.value; })} className="w-28" />
                <Input aria-label="Calories" inputMode="numeric" value={m.calories} onChange={(e) => upd((p) => { p.diet.meals[mi].calories = Math.max(0, Number(e.target.value) || 0); })} className="w-20 px-2" />
                <Button variant="ghost" aria-label="Remove meal" onClick={() => upd((p) => { p.diet.meals.splice(mi, 1); })} icon={<Trash2 className="w-4 h-4" />} />
              </div>
              <Textarea aria-label="Foods" value={m.items.join('\n')} onChange={(e) => upd((p) => { p.diet.meals[mi].items = e.target.value.split('\n'); })} className="min-h-[72px]" />
            </div>
          ))}
        </div>
        <Button size="sm" variant="secondary" className="mt-2" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => upd((p) => { p.diet.meals.push({ name: 'Meal', time: '', items: [''], calories: 0 }); })}>
          Meal
        </Button>
      </Card>

      <Card>
        <Field label="Safety notes (one per line)">
          <Textarea value={draft.safetyNotes.join('\n')} onChange={(e) => upd((p) => { p.safetyNotes = e.target.value.split('\n'); })} />
        </Field>
      </Card>

      <div className="sticky bottom-20 md:bottom-4 z-10 flex gap-2 justify-end bg-canvas/80 backdrop-blur rounded-2xl p-2 border border-line">
        <Button variant="secondary" onClick={() => setDraft(null)}>Discard</Button>
        <Button variant="success" loading={busy === 'save'} onClick={() => void save()}>Approve & assign</Button>
      </div>
    </div>
  );
};

export default PlanDraftEditor;
