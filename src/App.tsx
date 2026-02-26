import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Flame, Droplets, Pill, AlertCircle, ChevronRight, User, Scale, Target, HeartPulse } from 'lucide-react';
import { generateDietPlan, UserProfile, DietPlan } from './services/ai';

function App() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Rahul',
    age: 28,
    gender: 'Male',
    weight: 75,
    height: 175,
    activityLevel: 'Moderate',
    goal: 'Lean Bulk',
    dietType: 'Non-Veg',
    medicalHistory: 'None',
    stress: 5,
    sleepHours: 7,
  });

  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const plan = await generateDietPlan(profile);
      setDietPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate diet plan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'weight' || name === 'height' || name === 'stress' || name === 'sleepHours' ? Number(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#00FF00] selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 p-6 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00FF00] flex items-center justify-center">
            <Activity className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight uppercase">Neural OS</h1>
            <p className="text-xs text-white/50 font-mono tracking-widest uppercase">Royal The Gym</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-white/50 uppercase tracking-widest">
          <span>Aether Prime</span>
          <span className="w-1 h-1 rounded-full bg-[#00FF00] animate-pulse"></span>
          <span>Online</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold uppercase tracking-tight">Member Profile</h2>
            <p className="text-sm text-white/60">Enter data for scientific analysis.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Age</label>
                <input
                  type="number"
                  name="age"
                  value={profile.age}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Gender</label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Diet Type</label>
                <select
                  name="dietType"
                  value={profile.dietType}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors appearance-none"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={profile.weight}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={profile.height}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Goal</label>
              <select
                name="goal"
                value={profile.goal}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors appearance-none"
              >
                <option value="Lean Bulk">Lean Bulk</option>
                <option value="Fat Loss">Fat Loss</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Recomp">Recomp</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Activity Level</label>
              <select
                name="activityLevel"
                value={profile.activityLevel}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors appearance-none"
              >
                <option value="Sedentary">Sedentary (Little to no exercise)</option>
                <option value="Light">Light (1-3 days/week)</option>
                <option value="Moderate">Moderate (3-5 days/week)</option>
                <option value="Active">Active (6-7 days/week)</option>
                <option value="Very Active">Very Active (Twice a day)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Stress (1-10)</label>
                <input
                  type="number"
                  name="stress"
                  min="1"
                  max="10"
                  value={profile.stress}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Sleep (Hours)</label>
                <input
                  type="number"
                  name="sleepHours"
                  value={profile.sleepHours}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-white/60 tracking-wider">Medical History</label>
              <textarea
                name="medicalHistory"
                value={profile.medicalHistory}
                onChange={handleChange}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00FF00] transition-colors resize-none"
                placeholder="Any allergies, injuries, or conditions..."
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold uppercase tracking-widest py-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  Generate Protocol
                </>
              )}
            </button>
            {error && (
              <p className="text-red-500 text-sm text-center mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* Output Dashboard */}
        <div className="lg:col-span-8">
          {dietPlan ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Top Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00FF00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Flame className="w-6 h-6 text-[#00FF00] mb-3" />
                  <span className="text-3xl font-display font-bold">{dietPlan.targetCalories}</span>
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest mt-1">Kcal/Day</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest mb-2">Protein</span>
                  <span className="text-2xl font-display font-bold">{dietPlan.macros.protein}g</span>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-[#00FF00] w-[40%]"></div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest mb-2">Carbs</span>
                  <span className="text-2xl font-display font-bold">{dietPlan.macros.carbs}g</span>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-blue-400 w-[40%]"></div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-mono text-white/50 uppercase tracking-widest mb-2">Fats</span>
                  <span className="text-2xl font-display font-bold">{dietPlan.macros.fats}g</span>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-yellow-400 w-[20%]"></div>
                  </div>
                </div>
              </div>

              {/* Meals */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#00FF00]" />
                  Daily Protocol
                </h3>
                <div className="space-y-6">
                  {dietPlan.meals.map((meal, index) => (
                    <div key={index} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs font-mono group-hover:border-[#00FF00] group-hover:text-[#00FF00] transition-colors">
                          0{index + 1}
                        </div>
                        {index !== dietPlan.meals.length - 1 && (
                          <div className="w-[1px] h-full bg-white/10 my-2 group-hover:bg-[#00FF00]/30 transition-colors"></div>
                        )}
                      </div>
                      <div className="pb-6 flex-1">
                        <h4 className="text-lg font-bold mb-3">{meal.name}</h4>
                        <ul className="space-y-2">
                          {meal.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                              <ChevronRight className="w-4 h-4 text-[#00FF00] shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Supplements
                  </h3>
                  <ul className="space-y-3">
                    {dietPlan.supplements.map((supp, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00FF00]"></div>
                        {supp}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-1 flex items-center gap-2">
                        <Droplets className="w-4 h-4" />
                        Hydration
                      </h3>
                      <p className="text-2xl font-display font-bold">{dietPlan.waterGoal}L <span className="text-sm font-sans font-normal text-white/50">/ day</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 flex items-center justify-center relative">
                       <div className="absolute bottom-0 left-0 right-0 bg-blue-500/20 rounded-b-full h-1/2"></div>
                       <Droplets className="w-5 h-5 text-blue-400 relative z-10" />
                    </div>
                  </div>

                  <div className="bg-[#00FF00]/5 border border-[#00FF00]/20 rounded-2xl p-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-[#00FF00] mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Expert Notes
                    </h3>
                    <ul className="space-y-2">
                      {dietPlan.expertNotes.map((note, i) => (
                         <li key={i} className="text-sm text-white/80 leading-relaxed">
                           • {note}
                         </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[600px] border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <Activity className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-2xl font-display font-bold uppercase tracking-tight mb-2">Awaiting Data Input</h3>
              <p className="text-white/40 max-w-md">Enter member profile details and initialize the Neural OS to generate a highly-optimized, scientific nutrition protocol.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
