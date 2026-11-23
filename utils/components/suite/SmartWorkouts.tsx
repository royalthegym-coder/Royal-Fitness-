import React, { useMemo, useState } from 'react';
import {
  Dumbbell,
  Sparkles,
  Trash2,
  UserCheck,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';
import { WorkoutTemplate } from '../../../types';

const GOALS = ['Weight Loss', 'Muscle Gain', 'Fitness'] as const;
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

interface ExerciseLibraryItem {
  id: string;
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio';
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  cues: string;
  videoUrl: string;
}

const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    equipment: 'Barbell & Flat Bench',
    difficulty: 'Intermediate',
    cues: 'Retract scapulae, lower bar to mid-chest with 45° elbow tuck, drive feet firmly.',
    videoUrl: 'https://www.youtube.com/results?search_query=proper+barbell+bench+press+form',
  },
  {
    id: 'ex-2',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    equipment: 'Dumbbells & 30° Bench',
    difficulty: 'Beginner',
    cues: 'Control 2-second eccentric, press smoothly without clanking weights at top.',
    videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+press+form',
  },
  {
    id: 'ex-3',
    name: 'Lat Pulldown (Wide Grip)',
    muscleGroup: 'Back',
    equipment: 'Cable Pulldown Machine',
    difficulty: 'Beginner',
    cues: 'Pull elbows down toward ribs, keep chest proud, avoid excessive torso swing.',
    videoUrl: 'https://www.youtube.com/results?search_query=lat+pulldown+proper+form',
  },
  {
    id: 'ex-4',
    name: 'Romanian Deadlift (RDL)',
    muscleGroup: 'Legs',
    equipment: 'Barbell or Dumbbells',
    difficulty: 'Intermediate',
    cues: 'Hinge hips backward with soft knees, keep bar close to shins, squeeze glutes up.',
    videoUrl: 'https://www.youtube.com/results?search_query=romanian+deadlift+form+tutorial',
  },
  {
    id: 'ex-5',
    name: 'Goblet Squat',
    muscleGroup: 'Legs',
    equipment: 'Dumbbell or Kettlebell',
    difficulty: 'Beginner',
    cues: 'Brace core, sit hips between knees, maintain upright torso and flat heels.',
    videoUrl: 'https://www.youtube.com/results?search_query=goblet+squat+proper+form',
  },
  {
    id: 'ex-6',
    name: 'Overhead Dumbbell Shoulder Press',
    muscleGroup: 'Shoulders',
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    cues: 'Ribcage stacked over pelvis, press straight overhead without arching lower back.',
    videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+shoulder+press+form',
  },
  {
    id: 'ex-7',
    name: 'Cable Rope Face Pull',
    muscleGroup: 'Shoulders',
    equipment: 'Cable Machine + Rope',
    difficulty: 'Beginner',
    cues: 'Pull rope toward forehead with external rotation for rear delts and shoulder health.',
    videoUrl: 'https://www.youtube.com/results?search_query=cable+face+pull+proper+form',
  },
  {
    id: 'ex-8',
    name: 'Cable Triceps Pushdown',
    muscleGroup: 'Arms',
    equipment: 'Cable Machine',
    difficulty: 'Beginner',
    cues: 'Pin elbows to sides, extend forearms fully and control the return.',
    videoUrl: 'https://www.youtube.com/results?search_query=cable+triceps+pushdown+form',
  },
  {
    id: 'ex-9',
    name: 'Dead Bug Core Brace',
    muscleGroup: 'Core',
    equipment: 'Bodyweight / Mat',
    difficulty: 'Beginner',
    cues: 'Press lower back flat into floor, extend opposite arm and leg slowly while exhaling.',
    videoUrl: 'https://www.youtube.com/results?search_query=dead+bug+core+exercise+form',
  },
  {
    id: 'ex-10',
    name: 'Incline Treadmill HIIT Walk/Sprint',
    muscleGroup: 'Cardio',
    equipment: 'Treadmill',
    difficulty: 'Beginner',
    cues: 'Alternate 1 min brisk incline (8–10%) with 1 min steady recovery pace for 20 mins.',
    videoUrl: 'https://www.youtube.com/results?search_query=incline+treadmill+fat+loss+workout',
  },
];

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'] as const;

export const SmartWorkouts: React.FC = () => {
  const { workoutTemplates, members, staff, addWorkoutTemplate, deleteWorkoutTemplate, updateMember } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'plans' | 'library'>('plans');
  const [goal, setGoal] = useState<(typeof GOALS)[number]>('Weight Loss');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('Beginner');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [notes, setNotes] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(workoutTemplates[0]?.id || 1);
  const [assignMemberId, setAssignMemberId] = useState<number>(members[0]?.id || 0);
  const [assignTrainerId, setAssignTrainerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [muscleFilter, setMuscleFilter] = useState<(typeof MUSCLE_GROUPS)[number]>('All');
  const [librarySearch, setLibrarySearch] = useState('');

  const trainers = useMemo(
    () => staff.filter((s) => s.role.toLowerCase().includes('trainer')),
    [staff]
  );

  const selectedPlan =
    workoutTemplates.find((t) => t.id === selectedTemplateId) || workoutTemplates[0];

  const filteredExercises = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((ex) => {
      if (muscleFilter !== 'All' && ex.muscleGroup !== muscleFilter) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q)
      );
    });
  }, [muscleFilter, librarySearch]);

  const handleGenerateWorkout = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await requestGymAI<any>('workout_plan', {
      goal,
      level,
      daysPerWeek,
      notes,
    });
    setLoading(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error || 'Could not generate AI workout plan.');
      return;
    }

    const d = res.data;
    const nextId = Math.max(0, ...workoutTemplates.map((t) => t.id)) + 1;
    const created: WorkoutTemplate = {
      id: nextId,
      name: d.name || `${goal} (${level}) AI Plan`,
      category: d.category || goal,
      level: (['Beginner', 'Intermediate', 'Advanced'].includes(d.level) ? d.level : level) as any,
      duration: d.duration || '8 Weeks',
      frequency: d.frequency || `${daysPerWeek} Days/Week`,
      description: d.description || `AI-designed ${goal} program.`,
      scientificNote: d.scientificNote || '',
      aiGenerated: true,
      mainWorkout: Array.isArray(d.days)
        ? d.days.map((day: any) => ({
            name: day.name || 'Training Day',
            duration: day.duration || '45 mins',
            intensity: day.intensity || 'Medium',
            exercises: Array.isArray(day.exercises) ? day.exercises : [],
          }))
        : [],
    };

    addWorkoutTemplate(created);
    setSelectedTemplateId(created.id);
    setActiveTab('plans');
    addToast(`AI workout "${created.name}" created and saved.`, 'success');
  };

  const handleAssignToMember = () => {
    if (!selectedPlan || !assignMemberId) return;
    const member = members.find((m) => m.id === Number(assignMemberId));
    if (!member) return;
    const trainerObj = assignTrainerId ? trainers.find((t) => t.id === Number(assignTrainerId)) : undefined;
    updateMember({
      ...member,
      approvedAiPlan: selectedPlan.name,
      assignedTrainerId: trainerObj ? trainerObj.id : member.assignedTrainerId,
    });
    addToast(
      `Assigned "${selectedPlan.name}" to ${member.name}${trainerObj ? ` (Coach: ${trainerObj.name})` : ''}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Workout Plans</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            AI-generated weekly schedules, muscle-group exercise library with video guides, and trainer assignments
          </p>
        </div>
        <div className="inline-flex bg-[#111318] border border-white/10 rounded-lg p-1 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'plans' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Workout Plans ({workoutTemplates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'library' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Exercise Library ({EXERCISE_LIBRARY.length})
          </button>
        </div>
      </div>

      {/* AI Generator Bar */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Workout Plan Generator
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Training Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
            >
              {GOALS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Experience Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Days / Week</label>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
            >
              {[3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{d} Days / Week</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Focus / Equipment Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Knee-friendly, dumbbells"
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateWorkout}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generating...' : 'Generate Plan'}
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

      {activeTab === 'library' ? (
        /* Exercise Library Categorized by Muscle Group */
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search exercise, muscle group, or equipment..."
                className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setMuscleFilter(mg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    muscleFilter === mg
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-900 text-zinc-300 border border-white/10 hover:bg-zinc-800'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredExercises.map((ex) => (
              <div key={ex.id} className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                      {ex.muscleGroup}
                    </span>
                    <span className="text-[11px] text-zinc-400">{ex.difficulty}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-2">{ex.name}</h3>
                  <div className="text-xs text-zinc-500 mt-0.5">Equipment: {ex.equipment}</div>
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{ex.cues}</p>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">Instructional Guide</span>
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
                  >
                    Watch Form Demo
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Saved Plans + Viewer */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Library List */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Workout Plan Library ({workoutTemplates.length})
            </h2>
            {workoutTemplates.map((plan) => {
              const active = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedTemplateId(plan.id)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-[#111318] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                          {plan.category}
                        </span>
                        <span className="text-[11px] text-zinc-400">{plan.level}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-2">{plan.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkoutTemplate(plan.id);
                        addToast(`Removed "${plan.name}".`, 'info');
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Plan Details */}
          <div className="lg:col-span-2 bg-[#111318] border border-white/10 rounded-xl p-5 space-y-5">
            {selectedPlan ? (
              <>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-amber-400" />
                      {selectedPlan.name}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      {selectedPlan.category} · {selectedPlan.level} · {selectedPlan.frequency || '4 Days/Week'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Select member"
                      value={assignMemberId}
                      onChange={(e) => setAssignMemberId(Number(e.target.value))}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      {members.filter((m) => !m.archived).map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Select supervising trainer"
                      value={assignTrainerId}
                      onChange={(e) => setAssignTrainerId(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                    >
                      <option value="">Assign Trainer (Optional)</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAssignToMember}
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assign Plan
                    </button>
                  </div>
                </div>

                {selectedPlan.scientificNote && (
                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-white/10 text-xs text-zinc-300">
                    <span className="font-semibold text-amber-400">Coach Note: </span>
                    {selectedPlan.scientificNote}
                  </div>
                )}

                <div className="space-y-4">
                  {(selectedPlan.mainWorkout || []).map((section, idx) => (
                    <div key={idx} className="rounded-lg border border-white/10 overflow-hidden">
                      <div className="px-4 py-2.5 bg-zinc-900/80 flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{section.name}</span>
                        <span className="text-xs text-zinc-400">
                          {section.duration || '45 mins'} · {section.intensity || 'Medium'} Intensity
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/5 text-zinc-500">
                              <th className="py-2 px-4">Exercise</th>
                              <th className="py-2 px-3">Sets</th>
                              <th className="py-2 px-3">Reps</th>
                              <th className="py-2 px-3">Rest</th>
                              <th className="py-2 px-4">Form Cue &amp; Demo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {(section.exercises || []).map((ex, eIdx) => (
                              <tr key={eIdx}>
                                <td className="py-2.5 px-4 font-medium text-zinc-100">{ex.name}</td>
                                <td className="py-2.5 px-3 text-amber-400 font-semibold tabular-nums">{ex.sets}</td>
                                <td className="py-2.5 px-3 text-zinc-200 tabular-nums">{ex.reps}</td>
                                <td className="py-2.5 px-3 text-zinc-400 tabular-nums">{ex.rest || '60s'}</td>
                                <td className="py-2.5 px-4 text-zinc-400">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{ex.notes || 'Controlled tempo'}</span>
                                    <a
                                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} proper form`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-400 hover:underline shrink-0 inline-flex items-center gap-0.5"
                                    >
                                      Video <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-zinc-400">
                Select or generate a workout plan to view its schedule.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartWorkouts;
