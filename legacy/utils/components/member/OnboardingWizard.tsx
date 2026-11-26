import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Member } from '../../../types';
import { ai } from '../../../lib/core_ai';
import { 
  Target, 
  Dumbbell, 
  Zap, 
  Flame, 
  Heart, 
  Trophy, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Sparkles,
  Timer,
  Activity,
  User,
  BrainCircuit,
  UserCircle,
  Wind
} from 'lucide-react';

interface OnboardingWizardProps {
  member: Member;
  onComplete: (data: { fitnessGoal: string; trainingStyle: string; aiStrategy: string; experienceLevel: string }) => void;
}

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: User, description: 'New to fitness or returning after a long break' },
  { id: 'intermediate', label: 'Intermediate', icon: Activity, description: 'Consistent training for 6-12 months' },
  { id: 'advanced', label: 'Advanced', icon: Trophy, description: 'Years of consistent, high-intensity training' },
];

const FITNESS_GOALS = [
  { id: 'weight-loss', label: 'Fat Incineration', icon: Flame, description: 'Aggressive metabolic conditioning and fat loss' },
  { id: 'muscle-gain', label: 'Hypertrophy Protocol', icon: Dumbbell, description: 'Maximize lean mass and structural strength' },
  { id: 'endurance', label: 'Stamina Overdrive', icon: Zap, description: 'Elite cardiovascular capacity and endurance' },
  { id: 'flexibility', label: 'Smart Mobility', icon: Heart, description: 'Advanced range of motion and recovery' },
  { id: 'athletic', label: 'Warrior Performance', icon: Trophy, description: 'Peak explosive power and agility' },
  { id: 'longevity', label: 'Bio-Longevity', icon: Activity, description: 'Optimizing healthspan and vital metrics' },
];

const TRAINING_STYLES = [
  { id: 'hiit', label: 'Smart HIIT', icon: Timer, description: 'High-intensity intervals for rapid adaptation' },
  { id: 'strength', label: 'Titan Strength', icon: Activity, description: 'Heavy resistance and power development' },
  { id: 'yoga', label: 'Zen Flow', icon: Wind, description: 'Mind-body synchronization and core stability' },
  { id: 'crossfit', label: 'Hybrid Combat', icon: Target, description: 'Functional variety and real-world utility' },
  { id: 'calisthenics', label: 'Aero-Bodyweight', icon: Sparkles, description: 'Mastery of movement and body control' },
  { id: 'powerlifting', label: 'Iron Mastery', icon: Dumbbell, description: 'Focus on the big three lifts' },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ member, onComplete }) => {
  const [step, setStep] = useState(1);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [trainingStyle, setTrainingStyle] = useState('');
  const [aiStrategy, setAiStrategy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const generateAIStrategy = async () => {
    setIsGenerating(true);
    try {
      const goalLabel = FITNESS_GOALS.find(g => g.id === fitnessGoal)?.label;
      const styleLabel = TRAINING_STYLES.find(s => s.id === trainingStyle)?.label;
      const expLabel = EXPERIENCE_LEVELS.find(e => e.id === experienceLevel)?.label;

      const prompt = `As a world-class AI Fitness Coach, generate a personalized "Evolution Strategy" for a member named ${member.name}. 
      Experience Level: ${expLabel}
      Goal: ${goalLabel}
      Preferred Style: ${styleLabel}
      
      Structure your response as follows:
      1. A futuristic "WARRIOR PROTOCOL" name (e.g., PROTOCOL: NEURAL_SHRED_V1).
      2. A high-impact motivation statement (1 sentence).
      3. A key technical tip for this specific combination (1 sentence).
      4. A concluding "Evolution Directive" (1 sentence).
      
      Use a bold, professional, and futuristic tone. Total length max 100 words.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
      });

      setAiStrategy(response.text || 'Your evolution protocol is ready. Focus on consistency and precision.');
    } catch (error) {
      console.error('AI Generation Error:', error);
      setAiStrategy('Your personalized evolution protocol has been initialized. Focus on the core principles of your chosen goal and style.');
    } finally {
      setIsGenerating(false);
      setStep(5);
    }
  };

  const handleNext = () => {
    if (step === 4) {
      generateAIStrategy();
    } else if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1 && !isGenerating) setStep(step - 1);
  };

  const handleFinish = () => {
    onComplete({ fitnessGoal, trainingStyle, aiStrategy, experienceLevel, avatar: profilePicture } as any);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicture(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-800">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Welcome, {member.name.split(' ')[0]}!</h2>
                  <p className="text-zinc-400">Let's personalize your journey. What is your current fitness experience level?</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setExperienceLevel(level.id)}
                      className={`relative flex items-center gap-6 p-6 rounded-2xl border border-dashed transition-all text-left group overflow-hidden ${
                        experienceLevel === level.id 
                          ? 'bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 backdrop-blur-xl border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-500/50 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-white/5 translate-y-full transition-transform duration-300 ease-in-out ${experienceLevel !== level.id ? 'group-hover:translate-y-0' : ''}`}></div>
                      <div className={`relative z-10 p-4 rounded-xl transition-colors duration-300 ${experienceLevel === level.id ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}>
                        <level.icon size={24} />
                      </div>
                      <div className="flex-1 relative z-10">
                        <div className={`font-bold text-lg transition-colors duration-300 ${experienceLevel === level.id ? 'text-emerald-400' : 'text-white'}`}>{level.label}</div>
                        <div className="text-sm text-zinc-500">{level.description}</div>
                      </div>
                      {experienceLevel === level.id && (
                        <CheckCircle2 className="text-emerald-500 relative z-10" size={24} />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Primary Goal</h2>
                  <p className="text-zinc-400">What do you want to achieve most?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FITNESS_GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setFitnessGoal(goal.id)}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border border-dashed transition-all text-left group overflow-hidden ${
                        fitnessGoal === goal.id 
                          ? 'bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 backdrop-blur-xl border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-500/50 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-white/5 translate-y-full transition-transform duration-300 ease-in-out ${fitnessGoal !== goal.id ? 'group-hover:translate-y-0' : ''}`}></div>
                      <div className={`relative z-10 p-2 rounded-xl transition-colors duration-300 ${fitnessGoal === goal.id ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}>
                        <goal.icon size={20} />
                      </div>
                      <div className="relative z-10">
                        <div className={`font-semibold transition-colors duration-300 ${fitnessGoal === goal.id ? 'text-emerald-400' : 'text-white'}`}>{goal.label}</div>
                        <div className="text-xs text-zinc-500">{goal.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Training Style</h2>
                  <p className="text-zinc-400">How do you prefer to train?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TRAINING_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setTrainingStyle(style.id)}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border border-dashed transition-all text-left group overflow-hidden ${
                        trainingStyle === style.id 
                          ? 'bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 backdrop-blur-xl border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-500/50 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-white/5 translate-y-full transition-transform duration-300 ease-in-out ${trainingStyle !== style.id ? 'group-hover:translate-y-0' : ''}`}></div>
                      <div className={`relative z-10 p-2 rounded-xl transition-colors duration-300 ${trainingStyle === style.id ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}>
                        <style.icon size={20} />
                      </div>
                      <div className="relative z-10">
                        <div className={`font-semibold transition-colors duration-300 ${trainingStyle === style.id ? 'text-emerald-400' : 'text-white'}`}>{style.label}</div>
                        <div className="text-xs text-zinc-500">{style.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Profile Picture</h2>
                  <p className="text-zinc-400">Upload a photo to personalize your profile.</p>
                </div>

                <div className="flex flex-col items-center justify-center gap-6 py-8">
                  <div className="relative w-40 h-40 rounded-full border-4 border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={64} className="text-zinc-700" />
                    )}
                  </div>
                  
                  <label className="cursor-pointer px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors">
                    <span>Choose Photo</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="text-xs text-zinc-500">You can also skip this and do it later.</p>
                </div>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
                  />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" size={24} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white">Synthesizing Evolution Protocol...</h3>
                  <p className="text-zinc-500 text-sm">Our AI is analyzing your profile to create the perfect strategy.</p>
                </div>
              </motion.div>
            )}

            {step === 5 && !isGenerating && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <BrainCircuit className="text-emerald-500" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Smart Protocol Synthesis</h2>
                  </div>
                  <div className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    AI Core v4.0
                  </div>
                </div>
 
                <div className="relative group">
                  {/* Decorative corner accents */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-md" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-md" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-md" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br-md" />

                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-2xl p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Sparkles size={120} className="text-emerald-500" />
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                      <div className="prose prose-invert max-w-none">
                        <div className="text-zinc-300 leading-relaxed whitespace-pre-line font-mono text-sm">
                          {aiStrategy}
                        </div>
                      </div>
                    </div>

                    {/* Scanning line effect */}
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-px bg-emerald-500/30 blur-sm pointer-events-none"
                    />
                  </div>
                </div>
 
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 group hover:border-emerald-500/30 transition-colors">
                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Level</div>
                    <div className="text-white font-medium text-sm">{EXPERIENCE_LEVELS.find(e => e.id === experienceLevel)?.label}</div>
                  </div>
                  <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 group hover:border-emerald-500/30 transition-colors">
                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Goal</div>
                    <div className="text-white font-medium text-sm">{FITNESS_GOALS.find(g => g.id === fitnessGoal)?.label}</div>
                  </div>
                  <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 group hover:border-emerald-500/30 transition-colors">
                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Method</div>
                    <div className="text-white font-medium text-sm">{TRAINING_STYLES.find(s => s.id === trainingStyle)?.label}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-8"
              >
                <div className="flex justify-center">
                  <div className="relative">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={48} />
                    </motion.div>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -inset-4 bg-emerald-500/20 rounded-full -z-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Initialization Complete</h2>
                  <p className="text-zinc-400 max-w-sm mx-auto">
                    Your profile has been synchronized with the AI core. Welcome to the elite tier of fitness.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between">
            {step < 6 ? (
              <>
                <button
                  onClick={handleBack}
                  disabled={step === 1 || isGenerating}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all border border-dashed group overflow-hidden ${
                    step === 1 || isGenerating ? 'opacity-0 pointer-events-none' : 'bg-gradient-to-r from-zinc-900/40 to-zinc-800/40 hover:from-zinc-800/60 hover:to-zinc-700/60 backdrop-blur-xl border-zinc-700/50 hover:border-zinc-500/50 text-zinc-400 hover:text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <div className="relative z-10 flex items-center gap-2 group-hover:-translate-x-1 transition-transform duration-300">
                      <ChevronLeft size={20} />
                      Back
                  </div>
                </button>

                {!isGenerating && (
                  <button
                    onClick={handleNext}
                    disabled={(step === 1 && !experienceLevel) || (step === 2 && !fitnessGoal) || (step === 3 && !trainingStyle)}
                    className="relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500/90 hover:to-emerald-400/90 backdrop-blur-xl border border-dashed border-emerald-400/50 hover:border-emerald-300 disabled:opacity-50 disabled:hover:from-emerald-600/80 disabled:hover:to-emerald-500/80 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                    <div className="relative z-10 flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                        {step === 4 ? 'Generate AI Strategy' : 'Next'}
                        <ChevronRight size={20} />
                    </div>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleFinish}
                className="relative w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500/90 hover:to-emerald-400/90 backdrop-blur-xl border border-dashed border-emerald-400/50 hover:border-emerald-300 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <div className="relative z-10 flex items-center gap-2 group-hover:scale-105 transition-transform duration-500">
                    Enter Dashboard
                    <Sparkles size={20} />
                </div>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
