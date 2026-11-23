import React, { useMemo, useState } from 'react';
import {
  Utensils,
  Sparkles,
  Trash2,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';
import { DietPlan } from '../../../types';

const DIET_DISCLAIMER =
  'AI-generated diet recommendations are nutritional estimates only and do not replace professional medical, clinical, or licensed dietitian advice.';

const INDIAN_FOOD_DB = [
  { food: 'Low-Fat Paneer (100g)', type: 'Vegetarian', kcal: 210, p: 18, c: 4, f: 13 },
  { food: 'Moong Dal Chilla (2 pcs)', type: 'Vegetarian', kcal: 240, p: 14, c: 34, f: 5 },
  { food: 'Roasted Chana Sattu (50g)', type: 'Vegetarian', kcal: 195, p: 11, c: 31, f: 3 },
  { food: 'Sprouted Moong Salad (150g)', type: 'Vegetarian', kcal: 155, p: 11, c: 25, f: 1 },
  { food: 'Whole Wheat Roti (2 medium)', type: 'Vegetarian', kcal: 210, p: 7, c: 42, f: 1.5 },
  { food: 'Greek / Hung Curd (150g)', type: 'Vegetarian', kcal: 135, p: 14, c: 6, f: 6 },
  { food: 'Tofu Bhurji (150g)', type: 'Vegetarian', kcal: 190, p: 18, c: 5, f: 11 },
  { food: 'Boiled Egg Whites (4) + 1 Whole Egg', type: 'Eggetarian', kcal: 145, p: 20, c: 1, f: 5 },
  { food: 'Grilled Chicken Breast (150g)', type: 'Non-Vegetarian', kcal: 248, p: 46, c: 0, f: 5.5 },
  { food: 'Tandoori Fish Tikka (150g)', type: 'Non-Vegetarian', kcal: 225, p: 34, c: 3, f: 8 },
];

export const SmartDietPlans: React.FC = () => {
  const { dietPlans, members, staff, addDietPlan, updateDietPlan, deleteDietPlan, updateMember } = useData();
  const { addToast } = useToast();

  const [goal, setGoal] = useState<'Weight Loss' | 'Muscle Gain' | 'Fitness'>('Weight Loss');
  const [dietType, setDietType] = useState<'Vegetarian' | 'Eggetarian' | 'Non-Vegetarian'>('Vegetarian');
  const [calories, setCalories] = useState(1850);
  const [weight, setWeight] = useState(72);
  const [allergies, setAllergies] = useState('');
  const [selectedId, setSelectedId] = useState<number>(dietPlans[0]?.id || 1);
  const [assignMemberId, setAssignMemberId] = useState<number>(members[0]?.id || 0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFoodDb, setShowFoodDb] = useState(false);
  const [foodFilter, setFoodFilter] = useState<'All' | 'Vegetarian' | 'Eggetarian' | 'Non-Vegetarian'>('All');

  const selectedPlan = dietPlans.find((d) => d.id === selectedId) || dietPlans[0];
  const nutritionistName = useMemo(
    () => staff.find((s) => s.role === 'Dietitian' || s.role === 'Trainer')?.name || 'Certified Gym Nutritionist',
    [staff]
  );

  const filteredFoods = useMemo(
    () => (foodFilter === 'All' ? INDIAN_FOOD_DB : INDIAN_FOOD_DB.filter((f) => f.type === foodFilter)),
    [foodFilter]
  );

  const handleGenerateDiet = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await requestGymAI<any>('diet_plan', {
      goal,
      dietType,
      calories,
      weight,
      allergies: allergies.trim() || 'None',
    });
    setLoading(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error || 'Could not generate AI nutrition plan.');
      return;
    }

    const d = res.data;
    const nextId = Math.max(0, ...dietPlans.map((p) => p.id)) + 1;
    const created: DietPlan = {
      id: nextId,
      name: d.name || `${dietType} ${goal} Nutrition Plan`,
      level: 'Intermediate',
      goal: d.goal || goal,
      dietType,
      calories: Number(d.calories) || calories,
      macros: d.macros || { protein: 130, carbs: 180, fats: 55 },
      allergies: allergies.trim() || 'None',
      approvedBy: null,
      approvedAt: null,
      disclaimer: d.disclaimer || DIET_DISCLAIMER,
      description: d.description || `Personalized ${dietType} meal plan for ${goal}.`,
      duration: '8 Weeks',
      meals: Array.isArray(d.meals) ? d.meals : [],
      scientificNote: d.scientificNote || '',
      aiGenerated: true,
    };

    addDietPlan(created);
    setSelectedId(created.id);
    addToast(`AI diet estimate "${created.name}" created. Review & approve before assigning.`, 'success');
  };

  const handleToggleApproval = () => {
    if (!selectedPlan) return;
    const alreadyApproved = Boolean(selectedPlan.approvedBy);
    updateDietPlan({
      ...selectedPlan,
      approvedBy: alreadyApproved ? null : nutritionistName,
      approvedAt: alreadyApproved ? null : new Date().toISOString().split('T')[0],
    });
    addToast(
      alreadyApproved
        ? `Approval removed from "${selectedPlan.name}".`
        : `"${selectedPlan.name}" approved by ${nutritionistName}.`,
      'success'
    );
  };

  const handleAssignDiet = () => {
    if (!selectedPlan || !assignMemberId) return;
    const member = members.find((m) => m.id === Number(assignMemberId));
    if (!member) return;
    updateMember({
      ...member,
      approvedDietPlan: {
        id: selectedPlan.id,
        goal: selectedPlan.goal,
        caloriesTarget: selectedPlan.calories,
        macrosTarget: selectedPlan.macros,
        meals: selectedPlan.meals.map((m) => ({
          name: m.name,
          time: m.time,
          items: m.items.map((it) => ({ food: it.food, portion: it.portion })),
          totalCalories: m.totalCalories,
          macros: m.macros,
        })),
        scientificNote: `${selectedPlan.scientificNote || ''} | ${DIET_DISCLAIMER}`.trim(),
        aiGenerated: Boolean(selectedPlan.aiGenerated),
      },
    });
    addToast(`Assigned "${selectedPlan.name}" to ${member.name}.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Diet Plans</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Indian food nutrition database, allergy-aware AI meal plans, macro calculations, and trainer/nutritionist approval
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFoodDb((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-100 text-xs font-semibold cursor-pointer self-start"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          {showFoodDb ? 'Hide Indian Food Database' : 'Indian Food Database'}
        </button>
      </div>

      {/* Mandatory Medical & Estimate Safety Disclaimer */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Nutritional Estimate Notice: </span>
          {DIET_DISCLAIMER}
        </div>
      </div>

      {/* Indian Food Database Drawer */}
      {showFoodDb && (
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Indian Fitness Food Reference (Macros per Serving)</h2>
            <div className="flex gap-1.5">
              {(['All', 'Vegetarian', 'Eggetarian', 'Non-Vegetarian'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFoodFilter(t)}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                    foodFilter === t ? 'bg-emerald-500 text-zinc-950 font-semibold' : 'bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {filteredFoods.map((item) => (
              <div key={item.food} className="p-3 rounded-lg bg-zinc-900 border border-white/10 text-xs">
                <div className="font-semibold text-white">{item.food}</div>
                <div className="text-[11px] text-emerald-400 mt-1 tabular-nums">{item.kcal} kcal</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 tabular-nums">
                  P {item.p}g · C {item.c}g · F {item.f}g
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Diet Builder */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Nutrition Plan Estimator
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Fitness">Balanced Fitness</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Diet Preference</label>
            <select
              value={dietType}
              onChange={(e) => setDietType(e.target.value as any)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Target Calories</label>
            <input
              type="number"
              min={1200}
              max={4200}
              step={50}
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Weight (kg)</label>
            <input
              type="number"
              min={40}
              max={180}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Allergies / Avoid</label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Lactose, Peanuts"
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateDiet}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Creating...' : 'Generate Plan'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Plans Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Saved Diet Plans ({dietPlans.length})
          </h2>
          {dietPlans.map((plan) => {
            const active = selectedPlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedId(plan.id)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-[#111318] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-emerald-400">
                        {plan.goal}
                      </span>
                      {plan.approvedBy && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                          Approved
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-2">{plan.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                      {plan.calories} kcal · P {plan.macros.protein}g · C {plan.macros.carbs}g · F {plan.macros.fats}g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDietPlan(plan.id);
                      addToast(`Removed "${plan.name}".`, 'info');
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete diet plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2 bg-[#111318] border border-white/10 rounded-xl p-5 space-y-5">
          {selectedPlan ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-400" />
                    {selectedPlan.name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">{selectedPlan.description}</p>
                  {selectedPlan.allergies && selectedPlan.allergies !== 'None' && (
                    <p className="text-[11px] text-amber-300 mt-1">Allergies excluded: {selectedPlan.allergies}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleApproval}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      selectedPlan.approvedBy
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedPlan.approvedBy ? `Approved by ${selectedPlan.approvedBy}` : 'Approve Plan'}
                  </button>
                  <select
                    value={assignMemberId}
                    onChange={(e) => setAssignMemberId(Number(e.target.value))}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignDiet}
                    className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assign
                  </button>
                </div>
              </div>

              {/* Daily Macros Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-zinc-900 border border-white/10">
                  <div className="text-[11px] text-zinc-400">Daily Calories (Est.)</div>
                  <div className="text-xl font-bold text-white tabular-nums">{selectedPlan.calories} kcal</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-white/10">
                  <div className="text-[11px] text-zinc-400">Protein</div>
                  <div className="text-xl font-bold text-emerald-400 tabular-nums">{selectedPlan.macros.protein}g</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-white/10">
                  <div className="text-[11px] text-zinc-400">Carbohydrates</div>
                  <div className="text-xl font-bold text-amber-400 tabular-nums">{selectedPlan.macros.carbs}g</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-white/10">
                  <div className="text-[11px] text-zinc-400">Healthy Fats</div>
                  <div className="text-xl font-bold text-sky-400 tabular-nums">{selectedPlan.macros.fats}g</div>
                </div>
              </div>

              {/* Meal-by-Meal Breakdown */}
              <div className="space-y-3">
                {(selectedPlan.meals || []).map((meal, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{meal.name}</span>
                        <span className="text-xs text-zinc-400 inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" /> {meal.time}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300 tabular-nums">
                        <span className="font-semibold text-amber-400">{meal.totalCalories} kcal</span>
                        {' · '}P {meal.macros?.protein || 0}g · C {meal.macros?.carbs || 0}g · F {meal.macros?.fats || 0}g
                      </div>
                    </div>
                    <ul className="mt-2.5 space-y-1.5">
                      {(meal.items || []).map((item, iIdx) => (
                        <li key={iIdx} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-zinc-100 font-medium">{item.food}</span>
                          <span className="text-zinc-400 tabular-nums">
                            {item.portion} ({item.calories} kcal)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-zinc-400">
              Select or generate a nutrition plan to view meal-by-meal breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartDietPlans;
