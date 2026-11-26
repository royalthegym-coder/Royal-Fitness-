import React, { useState } from 'react';
import { AlertTriangle, Dumbbell, Utensils } from 'lucide-react';
import type { MemberPlanContent } from '../../../lib/apiClient';
import { Badge, Card, CardHeader, Tabs } from '../ui';

/** Read-only rendering of a structured workout + diet plan. */
export const PlanView: React.FC<{ plan: MemberPlanContent; meta?: React.ReactNode }> = ({ plan, meta }) => {
  const [tab, setTab] = useState<'workout' | 'diet'>('workout');
  const w = plan.workout || { daysPerWeek: 0, days: [] };
  const d = plan.diet || { dailyCalories: 0, proteinG: 0, carbsG: 0, fatsG: 0, meals: [] };
  return (
    <div className="space-y-3">
      <Card>
        <h3 className="text-lg font-bold leading-tight">{plan.title}</h3>
        {meta && <div className="mt-1 text-xs text-muted">{meta}</div>}
        {plan.summary && <p className="text-sm text-muted mt-2 whitespace-pre-wrap">{plan.summary}</p>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge tone="brand">{plan.durationWeeks} weeks</Badge>
          <Badge>{w.daysPerWeek} days / week</Badge>
          {d.dailyCalories > 0 && <Badge>{d.dailyCalories} kcal / day</Badge>}
          {d.proteinG > 0 && <Badge>Protein {d.proteinG} g</Badge>}
        </div>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'workout', label: 'Workout', count: w.days?.length || 0 },
          { id: 'diet', label: 'Diet', count: d.meals?.length || 0 },
        ]}
      />

      {tab === 'workout' ? (
        <div className="space-y-3">
          {(w.days || []).map((day, i) => (
            <Card key={`${day.day}-${i}`}>
              <CardHeader title={`${day.day} · ${day.focus}`} icon={<Dumbbell className="w-4 h-4" />} />
              {day.warmup && <p className="text-xs text-muted mb-2"><b className="text-fg">Warm-up:</b> {day.warmup}</p>}
              <ol className="space-y-2">
                {(day.exercises || []).map((ex, j) => (
                  <li key={`${ex.name}-${j}`} className="flex gap-3 items-start">
                    <span className="w-6 h-6 shrink-0 rounded-lg bg-fg/5 text-[11px] font-bold flex items-center justify-center text-muted">{j + 1}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{ex.name}</div>
                      <div className="text-xs text-muted">
                        {ex.sets} × {ex.reps} · rest {ex.restSeconds}s{ex.notes ? ` · ${ex.notes}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              {day.cooldown && <p className="text-xs text-muted mt-2"><b className="text-fg">Cool-down:</b> {day.cooldown}</p>}
            </Card>
          ))}
          {w.progression && (
            <Card>
              <p className="text-xs text-muted"><b className="text-fg">Progression:</b> {w.progression}</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Card>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ['kcal', d.dailyCalories],
                ['Protein g', d.proteinG],
                ['Carbs g', d.carbsG],
                ['Fats g', d.fatsG],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-surface2 py-2">
                  <div className="text-base font-bold">{v as number}</div>
                  <div className="text-[10px] text-subtle">{k}</div>
                </div>
              ))}
            </div>
            {d.hydration && <p className="text-xs text-muted mt-3"><b className="text-fg">Water:</b> {d.hydration}</p>}
          </Card>
          {(d.meals || []).map((m, i) => (
            <Card key={`${m.name}-${i}`}>
              <CardHeader title={m.name} subtitle={[m.time, `${m.calories} kcal`, m.proteinG ? `${m.proteinG} g protein` : ''].filter(Boolean).join(' · ')} icon={<Utensils className="w-4 h-4" />} />
              <ul className="list-disc pl-5 text-sm text-muted space-y-0.5">
                {(m.items || []).map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {plan.safetyNotes?.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader title="Safety notes" icon={<AlertTriangle className="w-4 h-4" />} />
          <ul className="list-disc pl-5 text-xs text-muted space-y-1">
            {plan.safetyNotes.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default PlanView;
