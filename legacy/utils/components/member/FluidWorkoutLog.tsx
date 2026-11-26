import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Zap, Dumbbell, Clock, Gauge, TrendingUp } from 'lucide-react';

interface MetricLog {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  durationMinutes: number;
  intensityRPE: number;
}

export const FluidWorkoutLog: React.FC = () => {
  const [logs, setLogs] = useState<MetricLog[]>([
    { id: '1', exercise: 'HIIT Kettlebell Circuit', weight: 16, reps: 15, durationMinutes: 20, intensityRPE: 9 },
    { id: '2', exercise: 'Deadlift (Velocity Focus)', weight: 120, reps: 5, durationMinutes: 10, intensityRPE: 8 },
    { id: '3', exercise: 'Assisted Medicine Ball Throws', weight: 8, reps: 20, durationMinutes: 15, intensityRPE: 7 }
  ]);

  const [newExercise, setNewExercise] = useState('');
  const [newWeight, setNewWeight] = useState(20);
  const [newReps, setNewReps] = useState(10);
  const [newDuration, setNewDuration] = useState(15);
  const [newRPE, setNewRPE] = useState(8);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.trim()) return;

    const newLog: MetricLog = {
      id: String(Date.now()),
      exercise: newExercise.trim(),
      weight: newWeight,
      reps: newReps,
      durationMinutes: newDuration,
      intensityRPE: newRPE
    };

    setLogs([newLog, ...logs]);
    setNewExercise('');
  };

  const handleDelete = (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
  };

  return (
    <div className="w-full bg-[#111622] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222E45]/80 pb-4 mb-4">
        <div>
          <h3 className="text-xl text-cyan-400 font-bold tracking-wider uppercase flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Dynamic Workout Tracker
          </h3>
          <p className="text-xs text-gray-400 mt-1">Freeletics-inspired high-fidelity responsive layout</p>
        </div>
        <span className="px-3 py-1 bg-cyan-950/50 text-cyan-400 text-xs rounded-full border border-cyan-500/30 font-semibold self-start sm:self-center">
          {logs.length} Exercises Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column */}
        <div className="lg:col-span-4 bg-[#182030]/60 p-4 rounded-xl border border-[#222E45]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1">
            <Plus className="h-4 w-4 text-cyan-400" /> Log Custom Routine
          </h4>
          
          <form onSubmit={handleAddLog} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 pb-1">Exercise Title</label>
              <input
                type="text"
                required
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                placeholder="e.g. Plyometric Push-ups"
                className="w-full bg-[#0D121F] border border-[#222E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 pb-1">Weight (Kg)</label>
                <input
                  type="number"
                  min="0"
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                  className="w-full bg-[#0D121F] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 pb-1">Reps Count</label>
                <input
                  type="number"
                  min="1"
                  value={newReps}
                  onChange={(e) => setNewReps(Number(e.target.value))}
                  className="w-full bg-[#0D121F] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 pb-1">Duration (Min)</label>
                <input
                  type="number"
                  min="1"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full bg-[#0D121F] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 pb-1">Intensity RPE</label>
                <select
                  value={newRPE}
                  onChange={(e) => setNewRPE(Number(e.target.value))}
                  className="w-full bg-[#0D121F] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-[#FFD60A] font-bold focus:outline-none focus:border-cyan-400"
                >
                  {[5, 6, 7, 8, 9, 10].map(rpe => (
                    <option key={rpe} value={rpe}>RPE {rpe}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Zap className="h-3 w-3 fill-black" />
              Commit Log
            </button>
          </form>
        </div>

        {/* Dynamic Display Fluid Grid */}
        <div className="lg:col-span-8">
          <div className="text-xs text-gray-400 mb-3">Logs Rendered via Flexible Auto-Grid</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[310px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-[#0D121F] border border-[#222E45] hover:border-cyan-500/40 rounded-xl transition-all relative group flex flex-col justify-between"
                >
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="absolute top-2.5 right-2.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-950/20 rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-sm font-bold text-white truncate max-w-[140px] block">{log.exercise}</span>
                      <span className="px-1.5 py-0.5 bg-[#FFD60A]/10 text-[#FFD60A] text-[9px] font-mono rounded">
                        RPE {log.intensityRPE}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs mt-1">
                      <div className="bg-[#182030]/60 p-1.5 rounded border border-[#222E45]/40">
                        <p className="text-gray-500 text-[8px] font-semibold">WEIGHT</p>
                        <p className="text-cyan-400 font-bold">{log.weight} kg</p>
                      </div>
                      <div className="bg-[#182030]/60 p-1.5 rounded border border-[#222E45]/40">
                        <p className="text-gray-500 text-[8px] font-semibold">REPS</p>
                        <p className="text-cyan-400 font-bold">{log.reps}</p>
                      </div>
                      <div className="bg-[#182030]/60 p-1.5 rounded border border-[#222E45]/40">
                        <p className="text-gray-500 text-[8px] font-semibold">TIME</p>
                        <p className="text-cyan-400 font-bold">{log.durationMinutes}m</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
