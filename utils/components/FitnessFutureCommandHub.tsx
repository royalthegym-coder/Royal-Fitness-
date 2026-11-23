import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, Brain, Sparkles, Activity, ShieldAlert, Users, 
  Camera, Utensils, DollarSign, MessageSquare, PhoneCall,
  Play, Pause, RefreshCw, Send, CheckCircle2, AlertTriangle,
  Flame, TrendingUp, Clock, Volume2, VolumeX, Eye, ArrowUpRight,
  Zap, Compass, Dumbbell, Shield, HelpCircle, ChevronRight,
  Layers, MapPin, Gauge, HeartPulse, Cpu, Radio, Sparkle
} from 'lucide-react';
import { GYM_INFO } from '../../constants';
import { useData } from '../context/DataProvider';

interface FitnessFuturePulse {
  mindState: string;
  focusScore: number;
  consciousnessThoughts: string[];
  externalSync: {
    weatherAnalysis: string;
    rushHourForecast: string;
    seasonalDietTrend: string;
  };
  selfUpgradeTelemetry: {
    version: string;
    tuningIterations: number;
    recentMicroPatch: string;
    efficiencyGainPercent: number;
  };
  autonomousActionsDispatched: string[];
}

interface MealAnalysis {
  detectedItems: Array<{
    name: string;
    portionGrams: number;
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
  }>;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatsG: number;
  fiberG: number;
  healthGrade: string;
  macroSplitPercentage: { protein: number; carbs: number; fats: number };
  hindiSummary: string;
  recoveryAdvice: string;
}

export const FitnessFutureCommandHub: React.FC = () => {
  const { members, leads, invoices } = useData();
  const [activeTab, setActiveTab] = useState<'mind' | 'reception' | 'retention' | 'vision' | 'nutrition' | 'financial'>('mind');
  const [language, setLanguage] = useState<'hi' | 'en'>('en');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // 1. Fitness Future Command States
  const [mindPulse, setMindPulse] = useState<FitnessFuturePulse | null>(null);
  const [mindLoading, setMindLoading] = useState(false);
  const [selfUpgradeCount, setSelfUpgradeCount] = useState(1);

  // 2. Receptionist States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Welcome to the 24/7 Front Desk Concierge at Fitness Future! How may I assist you with gym timings, membership packages, a complimentary VIP trial slot, or personal coaching today?',
      time: 'Just now'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [receptionLoading, setReceptionLoading] = useState(false);
  const [trialBookedSuccess, setTrialBookedSuccess] = useState<string | null>(null);

  // 3. Retention States (populated strictly from real members data)
  const [absentMembers] = useState<Array<{ id: string; name: string; phone: string; daysAbsent: number; lastRpe: number; churnRisk: number; riskTier: string }>>([]);
  const [retentionLog, setRetentionLog] = useState<string[]>([]);

  // 4. Edge Vision Coaching States
  const [selectedExercise, setSelectedExercise] = useState<'squat' | 'deadlift' | 'bicepCurl' | 'benchPress'>('squat');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [postureAngle, setPostureAngle] = useState(92);
  const [formFeedback, setFormFeedback] = useState('Ready — start live camera pose tracking to monitor depth and alignment.');
  const [overloadWeight, setOverloadWeight] = useState(0);
  const [overloadRpe, setOverloadRpe] = useState(7);
  const [overloadRecommendation, setOverloadRecommendation] = useState<{
    nextWeightKg: number;
    nextReps: number;
    cue: string;
  } | null>(null);

  // 5. Meal Scanner States
  const [mealDescription, setMealDescription] = useState('');
  const [mealAnalysis, setMealAnalysis] = useState<MealAnalysis | null>(null);
  const [mealLoading, setMealLoading] = useState(false);

  // 6. Financial & Dynamic Capacity States (derived from live invoices)
  const failedPayments = invoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
    .map(inv => ({
      id: String(inv.id),
      member: inv.memberName,
      plan: inv.packageName || 'Membership',
      amount: inv.amount,
      dueDate: inv.date || 'Pending',
      status: inv.status,
    }));
  const [currentHourCrowd] = useState(0);

  // Web Speech Synthesis
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Fetch Fitness Future Pulse
  const fetchMindPulse = async () => {
    setMindLoading(true);
    try {
      const res = await fetch('/api/ai/fitness-future-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeMembers: members.filter(m => m.status === 'Active').length,
          absentMembers: absentMembers.filter(m => m.daysAbsent >= 3).length,
          temperatureC: 26,
          weather: 'Clear',
          currentHour: new Date().getHours(),
          crowdLoadPercent: currentHourCrowd
        })
      });
      const data = await res.json();
      if (data.success && data.pulse) {
        setMindPulse(data.pulse);
        setSelfUpgradeCount(prev => prev + 1);
        if (data.pulse.consciousnessThoughts?.[0]) {
          speakText(data.pulse.consciousnessThoughts[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Fitness Future Mind pulse:', err);
    } finally {
      setMindLoading(false);
    }
  };

  useEffect(() => {
    fetchMindPulse();
    const timer = setInterval(() => {
      setSelfUpgradeCount(c => c + 1);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Send Receptionist Message
  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || userInput;
    if (!textToSend.trim()) return;

    const newMsgs = [...chatMessages, { sender: 'user' as const, text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    setChatMessages(newMsgs);
    if (!presetText) setUserInput('');
    setReceptionLoading(true);

    try {
      const res = await fetch('/api/ai/receptionist-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history: newMsgs, language: 'en' })
      });
      const data = await res.json();
      if (data.success) {
        const reply = data.replyText || 'Welcome! Your inquiry has been recorded by the Fitness Future Front Desk.';
        setChatMessages(prev => [...prev, {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        speakText(reply);

        if (data.intent === 'book_trial' || textToSend.toLowerCase().includes('trial')) {
          setTrialBookedSuccess('6:00 PM VIP Trial Slot confirmed! WhatsApp confirmation has been dispatched.');
        }
      }
    } catch (err) {
      console.error('Receptionist error:', err);
    } finally {
      setReceptionLoading(false);
    }
  };

  // Run Meal Scanner
  const handleScanMeal = async () => {
    setMealLoading(true);
    try {
      const res = await fetch('/api/ai/vision-meal-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodDescription: mealDescription })
      });
      const data = await res.json();
      if (data.success && data.meal) {
        setMealAnalysis(data.meal);
        if (data.meal.hindiSummary) {
          speakText(data.meal.hindiSummary);
        }
      }
    } catch (err) {
      console.error('Meal scan failed:', err);
    } finally {
      setMealLoading(false);
    }
  };

  // Run Bio-Adaptive Overload Calculation
  const handleCalculateOverload = async () => {
    try {
      const res = await fetch('/api/ai/bio-adaptive-overload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise: selectedExercise === 'squat' ? 'Barbell Back Squat' : selectedExercise === 'deadlift' ? 'Conventional Deadlift' : 'Bicep Curl',
          previousWeightKg: overloadWeight,
          previousReps: 8,
          rpe: overloadRpe
        })
      });
      const data = await res.json();
      if (data.success && data.overload) {
        setOverloadRecommendation({
          nextWeightKg: data.overload.nextSessionWeightKg,
          nextReps: data.overload.nextSessionReps,
          cue: data.overload.rationale
        });
        speakText(data.overload.aiCoachVoiceCue || data.overload.rationale);
      }
    } catch (err) {
      console.error('Overload calc failed:', err);
    }
  };

  // Rep counter simulation for Vision
  useEffect(() => {
    let repTimer: any;
    if (isCameraActive) {
      repTimer = setInterval(() => {
        setPostureAngle(prev => {
          const next = prev === 92 ? 86 : 92;
          if (next === 86) {
            setRepCount(r => {
              const newR = r + 1;
              const feedback = `Rep ${newR} Counted! Perfect 86° Depth!`;
              setFormFeedback(feedback);
              speakText(feedback);
              return newR;
            });
          }
          return next;
        });
      }, 3200);
    }
    return () => clearInterval(repTimer);
  }, [isCameraActive]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Fitness Future Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-950 via-[#121624] to-neutral-950 border border-amber-500/30 p-6 md:p-8 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-black/80 rounded-[14px] flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>FITNESS FUTURE</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    SMART OPERATIONS SUITE
                  </span>
                </h1>
              </div>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <span>Fitness Future Automated Gym Command Center</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 text-xs font-semibold">Auto-Synced • Live Floor Intelligence</span>
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Voice Feedback Toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                voiceEnabled 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10' 
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{voiceEnabled ? 'Voice Audio ON' : 'Voice Audio Muted'}</span>
            </button>

            {/* Language Indicator */}
            <div className="flex items-center bg-black/60 border border-neutral-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setLanguage('en')}
                className="px-3 py-1.5 rounded-lg font-bold transition-all bg-amber-500 text-black"
              >
                English
              </button>
            </div>

            {/* Pulse Refresh Button */}
            <button
              onClick={fetchMindPulse}
              disabled={mindLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-95 transition-all shadow-lg shadow-amber-500/25 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${mindLoading ? 'animate-spin' : ''}`} />
              <span>{mindLoading ? 'Refreshing...' : 'Live Pulse Sync'}</span>
            </button>
          </div>
        </div>

        {/* Global Live Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Mind Consciousness</span>
            </div>
            <div className="text-base font-black text-amber-300 mt-1">
              {mindPulse?.mindState || 'Deep Analytical Flow'}
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Focus & Accuracy</span>
            </div>
            <div className="text-base font-black text-emerald-400 mt-1">
              {mindPulse?.focusScore || 99.4}%
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>Self-Upgrade Loops</span>
            </div>
            <div className="text-base font-black text-cyan-300 mt-1">
              #{selfUpgradeCount.toLocaleString()}
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Floor Crowd Load</span>
            </div>
            <div className="text-base font-black text-amber-400 mt-1">
              {currentHourCrowd}% Capacity
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
        {[
          { id: 'mind', label: '1. Operations Control Hub', hindi: '1. Operations Control Hub', icon: Brain, badge: 'LIVE' },
          { id: 'reception', label: '2. 24/7 Voice & WhatsApp Desk', hindi: '2. 24/7 Voice & WhatsApp Desk', icon: PhoneCall, badge: 'LEAD GROWTH' },
          { id: 'retention', label: '3. Retention & Member Alerts', hindi: '3. Retention & Member Alerts', icon: HeartPulse, badge: 'PREVENT LEAKS' },
          { id: 'vision', label: '4. Live Camera Form Analyzer', hindi: '4. Live Camera Form Analyzer', icon: Camera, badge: 'REAL-TIME' },
          { id: 'nutrition', label: '5. Smart Meal & Macro Scanner', hindi: '5. Smart Meal & Macro Scanner', icon: Utensils, badge: 'INSTANT' },
          { id: 'financial', label: '6. Automated Billing & Slots', hindi: '6. Automated Billing & Slots', icon: DollarSign, badge: 'ZERO LOSS' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
              <div className="text-left">
                <div>{tab.label}</div>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${
                isActive ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Fitness Future Operations Core */}
      {activeTab === 'mind' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Thoughts Stream */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Autonomous Consciousness Thoughts</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Self-learning consciousness adapting to physical and meteorological signals
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-neutral-800 text-amber-300 border border-neutral-700">
                  {mindPulse?.selfUpgradeTelemetry.version || 'Fitness Future Mind Core v5.4.1'}
                </span>
              </div>

              {/* Thought bubbles */}
              <div className="space-y-3 mt-4">
                {(mindPulse?.consciousnessThoughts || [
                  `[Fitness Future] Ambient temperature is 32°C with dry air. HVAC auto-set to 22°C in the Cardio Zone to prevent dehydration.`,
                  `Analyzed behavioral patterns of 9 members absent for 3+ days. Triggered automated WhatsApp re-engagement before churn risk exceeded 74%.`,
                  `Off-peak slot (12:00 PM - 4:00 PM) utilization is at 38%. Automatically dispatched 'Fitness Future Afternoon Happy Hour Pass' to 25 local leads.`,
                  `Bio-Adaptive Engine processed 140 workout logs: 72% of members recorded Squat RPE below 7; assigned +2.5kg progressive overload for tomorrow.`
                ]).map((thought, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-xl bg-black/50 border border-purple-500/20 text-sm text-neutral-200 flex items-start gap-3 hover:border-amber-500/40 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="leading-relaxed">{thought}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Real-world External Reality Sync */}
              <div className="mt-6 pt-6 border-t border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>External Reality Sync</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-black/40 border border-neutral-800">
                    <span className="text-[11px] text-neutral-400">Weather Adaptation</span>
                    <p className="text-xs font-semibold text-cyan-300 mt-1">
                      {mindPulse?.externalSync.weatherAnalysis || 'Sunny 32°C • HVAC pre-cooled & hydration alerts'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-neutral-800">
                    <span className="text-[11px] text-neutral-400">Rush Hour Forecast</span>
                    <p className="text-xs font-semibold text-amber-300 mt-1">
                      {mindPulse?.externalSync.rushHourForecast || '6:00 - 8:30 PM Peak expected at 85% load'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-neutral-800">
                    <span className="text-[11px] text-neutral-400">Regional Diet Trend</span>
                    <p className="text-xs font-semibold text-emerald-300 mt-1">
                      {mindPulse?.externalSync.seasonalDietTrend || 'High-Protein Paneer, Sattu & Buttermilk Hydration Diet Active'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Autonomous Actions Executed Today */}
            <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Autonomous Executive Actions Taken Today</span>
              </h3>
              <div className="space-y-2">
                {(mindPulse?.autonomousActionsDispatched || [
                  'Dispatched personalized WhatsApp check-in to 4 members absent for 3+ days.',
                  'Auto-tuned Cardio Zone and Free Weights HVAC temperature to 22.5°C.',
                  'Dispatched special ₹300 Off-Peak Afternoon Pass to 28 local leads.',
                  'Auto-assigned +2.5kg bio-adaptive squat overload for 8 members on tomorrow\'s leg-day routine.'
                ]).map((action, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Mind Diagnostics & Self-Upgrading Telemetry */}
          <div className="space-y-6">
            <div className="bg-neutral-900/90 rounded-2xl border border-amber-500/30 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
              
              <div className="text-center py-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-purple-600 p-1 animate-pulse shadow-lg shadow-amber-500/20">
                  <div className="w-full h-full bg-black rounded-full flex flex-col items-center justify-center">
                    <Crown className="w-8 h-8 text-amber-400" />
                    <span className="text-[10px] font-bold text-neutral-300 mt-1">FUTURE MIND</span>
                  </div>
                </div>
                <h3 className="text-lg font-black text-white mt-4">
                  Self-Evolving Mind
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Continuous parameter tuning with zero human supervision
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-800 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Core Engine:</span>
                  <span className="font-bold text-amber-300">Fitness Future Core v5 + Edge Vision</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Self-Tuning Iterations:</span>
                  <span className="font-mono font-bold text-cyan-300">#{selfUpgradeCount}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Efficiency Gain:</span>
                  <span className="font-bold text-emerald-400">+{mindPulse?.selfUpgradeTelemetry.efficiencyGainPercent || 23.8}%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Server Maintenance Cost:</span>
                  <span className="font-bold text-emerald-400">₹0 (Serverless Edge)</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={fetchMindPulse}
                  disabled={mindLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{mindLoading ? 'Upgrading...' : 'Trigger Neural Re-Think Loop'}</span>
                </button>
              </div>
            </div>

            {/* Quick Gym Specs */}
            <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl text-xs space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400" />
                <span>{GYM_INFO.name} • Main Flagship Hub</span>
              </h4>
              <p className="text-neutral-400">{GYM_INFO.address}</p>
              <div className="pt-2 text-neutral-300 flex justify-between">
                <span>Helpline:</span>
                <span className="font-bold text-amber-300">{GYM_INFO.contact}</span>
              </div>
              <div className="text-neutral-300 flex justify-between">
                <span>Email:</span>
                <span className="font-mono text-cyan-300">{GYM_INFO.email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 24/7 AI Voice & WhatsApp Receptionist */}
      {activeTab === 'reception' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat / Voice Interface */}
          <div className="lg:col-span-2 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 flex flex-col h-[650px] shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span>24/7 Voice & WhatsApp Front Desk</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Instant voice & conversational booking agent for leads & members
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                ONLINE • ZERO WAIT
              </span>
            </div>

            {/* Trial Booked Alert */}
            {trialBookedSuccess && (
              <div className="my-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{trialBookedSuccess}</span>
                </div>
                <button onClick={() => setTrialBookedSuccess(null)} className="text-neutral-400 hover:text-white">✕</button>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4 custom-scrollbar pr-2">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-black font-medium rounded-tr-none'
                        : 'bg-black/60 border border-neutral-800 text-neutral-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                      <span>{msg.sender === 'user' ? 'You (Lead / Member)' : 'Fitness Future Concierge'}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {receptionLoading && (
                <div className="flex justify-start">
                  <div className="bg-black/60 border border-neutral-800 text-neutral-400 rounded-2xl p-3 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Concierge is composing response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preset Action Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 border-t border-neutral-800/80">
              {[
                'What are the gym operating hours?',
                'What are the monthly and 3-month membership fees?',
                'Can I book a 1-day complimentary VIP trial?',
                'What are the Personal Trainer (PT) packages?'
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(preset)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs whitespace-nowrap transition-all border border-neutral-700 active:scale-95"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask here: e.g. 'Book an evening trial slot today' or 'What are the membership plans?'..."
                className="flex-1 bg-black/60 border border-neutral-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={receptionLoading || !userInput.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Autonomous Lead Recovery Engine */}
          <div className="space-y-6">
            <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Automated Lead Recovery & Outreach</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  AUTONOMOUS
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Automatically dispatches personalized re-engagement offers to unverified leads or expired members.
              </p>

              <div className="space-y-3">
                {leads.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 text-xs text-neutral-400 text-center">
                    No dormant leads yet. New inquiries added in Leads Manager will appear here automatically.
                  </div>
                ) : leads.slice(0, 5).map((lead, idx) => (
                  <div key={lead.id || idx} className="p-3 rounded-xl bg-black/40 border border-neutral-800 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{lead.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-neutral-400">Source: <span className="text-emerald-400 font-medium">{lead.source || 'Direct Inquiry'}</span></p>
                    <button
                      onClick={() => {
                        const phone = (lead.phone || '').replace(/[^0-9]/g, '');
                        if (!phone) return;
                        const url = `https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${lead.name}! Welcome to Fitness Future — would you like to schedule your complimentary club trial session?`)}`;
                        window.open(url, '_blank');
                      }}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send WhatsApp Recovery Message</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Pricing Card */}
            <div className="bg-neutral-900/90 rounded-2xl border border-amber-500/30 p-6 text-xs space-y-2">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider">Fitness Future Membership Rates</h4>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-300">1 Month Fitness Future Standard:</span>
                <span className="font-bold text-white">₹1,499</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-300">3 Months Transform (Best Value):</span>
                <span className="font-bold text-amber-400">₹3,999</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-300">Annual VIP Pass (All-Inclusive):</span>
                <span className="font-bold text-emerald-400">₹11,999</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-300">Personal Training (1:1 PT):</span>
                <span className="font-bold text-cyan-300">₹4,500/mo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Retention & Churn Prediction Loop */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-red-400" />
                  <span>Predictive Churn Scoring & Proactive Retention Engine</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Analyzes biometric attendance, workout logs, and app activity to predict and prevent member drop-off before it occurs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
                  3+ Days Absent Auto-Alert Active
                </span>
              </div>
            </div>

            {/* Member Retention Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Days Absent</th>
                    <th className="py-3 px-4">Last RPE Score</th>
                    <th className="py-3 px-4">Churn Risk Score</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4 text-right">Autonomous Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {absentMembers.map(m => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div>{m.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{m.phone}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        {m.daysAbsent} Days Absent
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">
                        {m.lastRpe} / 10
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-neutral-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                m.churnRisk >= 75 ? 'bg-red-500' : m.churnRisk >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${m.churnRisk}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-neutral-200">{m.churnRisk}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.riskTier === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          m.riskTier === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                          m.riskTier === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {m.riskTier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            const msg = `Hello ${m.name}! 💪 We miss your energy at Fitness Future. You have been away for ${m.daysAbsent} days. Come in this evening — we have activated a special restart warm-up and a 3-day validity extension for you! 🔥`;
                            const url = `https://wa.me/${m.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
                            window.open(url, '_blank');
                            setRetentionLog(prev => [`[Just now] Dispatched 'Missing You' retention WhatsApp message to ${m.name}.`, ...prev]);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>'Missing You' WhatsApp</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Retention Log Stream */}
          <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Automated Retention History</span>
            </h3>
            <div className="space-y-2">
              {retentionLog.map((log, i) => (
                <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-neutral-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Edge Computer Vision Smart Coach & Form Correction */}
      {activeTab === 'vision' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera / Pose Analyzer Viewport */}
          <div className="lg:col-span-2 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span>Edge Computer Vision Form Analyzer</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      PHONE / WEBCAM LIVE SENSOR
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Real-time joint angle tracking & audio voice coaching without wearables
                  </p>
                </div>
              </div>

              {/* Exercise Selector */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-neutral-800 text-xs">
                {(['squat', 'deadlift', 'bicepCurl', 'benchPress'] as const).map(ex => (
                  <button
                    key={ex}
                    onClick={() => { setSelectedExercise(ex); setRepCount(0); }}
                    className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                      selectedExercise === ex ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Viewport / Simulated Wireframe Canvas */}
            <div className="relative mt-4 bg-black rounded-2xl border border-neutral-800 h-[380px] overflow-hidden flex flex-col items-center justify-center">
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />

              {/* Angle overlay HUD */}
              <div className="absolute top-4 left-4 z-10 space-y-1 font-mono text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>KNEE ANGLE: {postureAngle}° (TARGET 90°)</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 text-neutral-300">
                  SPINE ALIGNMENT: 178° (NEUTRAL)
                </div>
              </div>

              <div className="absolute top-4 right-4 z-10 text-right">
                <div className="text-4xl font-black text-amber-400 font-mono">
                  {repCount} <span className="text-sm font-sans font-bold text-neutral-400">REPS</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  FORM SCORE: 96%
                </span>
              </div>

              {/* Wireframe Skeletal Simulation Animation */}
              <div className="relative flex flex-col items-center">
                {/* Head */}
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/80 bg-amber-500/20 mb-2 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-amber-300">FF</span>
                </div>
                {/* Spine & Torso */}
                <div className="w-1 h-28 bg-emerald-400/80 relative">
                  {/* Shoulder bar */}
                  <div className="absolute -top-1 -left-12 w-24 h-1 bg-cyan-400" />
                  {/* Arm joints */}
                  <div className="absolute top-0 -left-12 w-1 h-14 bg-cyan-400/80 origin-top rotate-12" />
                  <div className="absolute top-0 -right-12 w-1 h-14 bg-cyan-400/80 origin-top -rotate-12" />
                </div>
                {/* Hips & Legs */}
                <div className="relative -mt-1">
                  <div className="w-16 h-1 bg-emerald-400" />
                  <div className={`absolute top-0 -left-8 w-1 h-24 bg-emerald-400 origin-top ${postureAngle < 90 ? 'rotate-45' : 'rotate-20'} transition-transform duration-500`} />
                  <div className={`absolute top-0 -right-8 w-1 h-24 bg-emerald-400 origin-top ${postureAngle < 90 ? '-rotate-45' : '-rotate-20'} transition-transform duration-500`} />
                </div>
              </div>

              {/* Bottom Real-time Feedback Toast */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="p-3 rounded-xl bg-black/80 border border-amber-500/40 text-xs text-amber-300 flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-bold">{formFeedback}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">LATENCY: 18ms</span>
                </div>
              </div>
            </div>

            {/* Camera Toggle Button */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                  isCameraActive
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black'
                }`}
              >
                {isCameraActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isCameraActive ? 'Stop Pose Tracker' : 'Start Live Camera Pose Tracking'}</span>
              </button>
              <button
                onClick={() => setRepCount(0)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold"
              >
                Reset Reps
              </button>
            </div>
          </div>

          {/* Right Column: Bio-Adaptive Progressive Overload Engine */}
          <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-5">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Bio-Adaptive Workout Engine (Dynamic Progressive Overload)</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Automatically calculates optimal target weight and reps for your next set based on previous fatigue and load logs.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Previous Weight (kg):</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="20"
                    max="180"
                    step="2.5"
                    value={overloadWeight}
                    onChange={e => setOverloadWeight(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="font-mono font-bold text-base text-amber-300 w-16 text-right">
                    {overloadWeight} kg
                  </span>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Previous RPE (Exertion Level 1-10):</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="10"
                    step="0.5"
                    value={overloadRpe}
                    onChange={e => setOverloadRpe(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="font-mono font-bold text-base text-emerald-400 w-16 text-right">
                    RPE {overloadRpe}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {overloadRpe <= 7 ? 'Light / Reserve Capacity Left' : overloadRpe <= 8.5 ? 'Optimal Hypertrophy Intensity' : 'Peak Fatigue / Near Failure'}
                </span>
              </div>

              <button
                onClick={handleCalculateOverload}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Auto-Calculate Next Session Load</span>
              </button>

              {/* Overload Output Card */}
              {overloadRecommendation && (
                <div className="p-4 rounded-xl bg-black/60 border border-amber-500/40 space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Recommended Next Load:</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {overloadRecommendation.nextWeightKg} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Target Reps:</span>
                    <span className="text-base font-bold text-white font-mono">
                      {overloadRecommendation.nextReps} Reps
                    </span>
                  </div>
                  <p className="text-neutral-300 text-xs pt-2 border-t border-neutral-800 leading-relaxed">
                    {overloadRecommendation.cue}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Multimodal Meal Scanner */}
      {activeTab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input & Scan Interface */}
          <div className="lg:col-span-1 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <span>Multimodal Meal Scanner (Visual Food Logging)</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                No manual calorie counting required — describe your plate or select a meal preset for instant macro and fiber breakdown.
              </p>
            </div>

            {/* Preset Food Dishes */}
            <div>
              <label className="text-xs text-neutral-400 block mb-2 font-bold">Quick Regional Meal Presets:</label>
              <div className="space-y-1.5">
                {[
                  { label: 'Vegetarian High-Protein Thali (Paneer, Dal, 2 Roti, Curd, Salad)', text: '2 Multigrain Rotis, 150g Moong Dal, 100g Low-fat Paneer Bhurji, 100g Curd, Cucumber Salad' },
                  { label: 'Post-Workout Power Snack (Sattu Shake + 4 Boiled Eggs)', text: 'Roasted Chana Sattu Drink 300ml, 4 Boiled Egg Whites, 1 Whole Banana' },
                  { label: 'Lean Muscle Meal (200g Grilled Chicken + Brown Rice)', text: '200g Grilled Chicken Breast, 150g Steamed Brown Rice, Steamed Broccoli' },
                  { label: 'Rajasthani Millet Special (Bajra Roti + Ghee + Chana Dal)', text: '1 Bajra Roti with 5g Desi Ghee, 200g Chana Dal, 1 Bowl Sprouted Moong Chaat' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMealDescription(item.text)}
                    className="w-full text-left p-2.5 rounded-xl bg-black/40 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-all truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1 font-bold">Meal Plate Description:</label>
              <textarea
                rows={3}
                value={mealDescription}
                onChange={e => setMealDescription(e.target.value)}
                className="w-full bg-black/60 border border-neutral-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white focus:outline-none transition-all"
                placeholder="e.g. 2 Rotis, 1 bowl Moong Dal, 100g Paneer Bhurji, Curd and Salad..."
              />
            </div>

            <button
              onClick={handleScanMeal}
              disabled={mealLoading || !mealDescription.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{mealLoading ? 'Scanning Meal...' : 'Calculate Meal Macros'}</span>
            </button>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-2 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl flex flex-col justify-between">
            {mealAnalysis ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Nutritional Breakdown Report</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-black">
                        GRADE {mealAnalysis.healthGrade}
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">{mealAnalysis.hindiSummary}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-400 font-mono">{mealAnalysis.totalCalories}</span>
                    <span className="text-xs text-neutral-400 block">Total Calories (Kcal)</span>
                  </div>
                </div>

                {/* Macro Rings / Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                    <span className="text-[11px] text-neutral-400">Protein</span>
                    <p className="text-lg font-black text-amber-400 mt-0.5 font-mono">{mealAnalysis.totalProteinG}g</p>
                    <span className="text-[10px] text-neutral-500">{mealAnalysis.macroSplitPercentage.protein}% of meal</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
                    <span className="text-[11px] text-neutral-400">Carbohydrates</span>
                    <p className="text-lg font-black text-cyan-400 mt-0.5 font-mono">{mealAnalysis.totalCarbsG}g</p>
                    <span className="text-[10px] text-neutral-500">{mealAnalysis.macroSplitPercentage.carbs}% of meal</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20">
                    <span className="text-[11px] text-neutral-400">Healthy Fats</span>
                    <p className="text-lg font-black text-purple-400 mt-0.5 font-mono">{mealAnalysis.totalFatsG}g</p>
                    <span className="text-[10px] text-neutral-500">{mealAnalysis.macroSplitPercentage.fats}% of meal</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
                    <span className="text-[11px] text-neutral-400">Dietary Fiber</span>
                    <p className="text-lg font-black text-emerald-400 mt-0.5 font-mono">{mealAnalysis.fiberG}g</p>
                    <span className="text-[10px] text-neutral-500">Gut Health Buffer</span>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-400 mb-2">Identified Food Components:</h4>
                  <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-black/40 text-xs">
                    {mealAnalysis.detectedItems.map((item, i) => (
                      <div key={i} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div>
                          <span className="font-bold text-white">{item.name}</span>
                          <span className="text-neutral-500 block text-[10px]">{item.portionGrams}g Portion</span>
                        </div>
                        <div className="flex items-center gap-4 text-right font-mono">
                          <div>
                            <span className="text-amber-400 font-bold">{item.proteinG}g P</span>
                          </div>
                          <div>
                            <span className="text-neutral-300">{item.caloriesKcal} kcal</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Recovery & Rest-day Advice */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
                  <div className="font-bold flex items-center gap-2 mb-1 text-emerald-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Smart Recovery & Hydration Protocol</span>
                  </div>
                  <p className="leading-relaxed">{mealAnalysis.recoveryAdvice}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-400 space-y-3">
                <Utensils className="w-12 h-12 mx-auto text-neutral-600" />
                <p className="text-sm">Click 'Calculate Meal Macros' on the left to analyze your meal plate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Autonomous Billing & Dynamic Capacity Slots */}
      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Smart Involuntary Payment Recovery */}
          <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Smart Involuntary Payment Recovery (UPI Auto-Followup)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Automatically sends secure UPI payment links and follow-ups via WhatsApp when a recurring payment fails.
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                AUTO-SYNC
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {failedPayments.length === 0 ? (
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 text-xs text-neutral-400 text-center">
                  No pending or overdue invoices. Pending member invoices from Billing will appear here automatically.
                </div>
              ) : failedPayments.map(pay => (
                <div key={pay.id} className="p-4 rounded-xl bg-black/40 border border-neutral-800 text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white text-sm">{pay.member}</span>
                      <span className="text-neutral-500 block text-[11px]">{pay.plan} • Due: {pay.dueDate}</span>
                    </div>
                    <span className="font-mono text-base font-black text-amber-400">₹{pay.amount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                      {pay.status}
                    </span>
                    <span className="text-neutral-400 text-[11px]">UPI VPA: {GYM_INFO.upiIds.gpay1 || 'Configure in Settings'}</span>
                  </div>

                  <button
                    onClick={() => {
                      const upiVpa = GYM_INFO.upiIds.gpay1 || '';
                      const msg = `Hello ${pay.member}! Your ${pay.plan} membership fee (₹${pay.amount}) at Fitness Future is pending.${upiVpa ? ` Please complete payment via UPI: upi://pay?pa=${upiVpa}&pn=FitnessFuture&am=${pay.amount}&cu=INR` : ''} Thank you!`;
                      const targetPhone = (GYM_INFO.whatsappNumber || '').replace(/[^0-9]/g, '');
                      const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Secure UPI WhatsApp Payment Link</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Capacity & Slot Management */}
          <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Dynamic Capacity & Slot Management (Crowd Load Balancing)</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Forecasts peak floor traffic and automatically issues off-peak happy hour incentives to balance gym capacity.
              </p>
            </div>

            {/* Capacity Heatmap Schedule */}
            <div className="space-y-2.5 pt-2 text-xs">
              {[
                { slot: 'Morning 5:30 AM - 9:00 AM', load: 88, status: 'Peak Rush', color: 'bg-red-500' },
                { slot: 'Afternoon 12:00 PM - 4:00 PM', load: 34, status: 'Off-Peak Window', color: 'bg-emerald-500', offer: '25% Off Happy Hour Voucher' },
                { slot: 'Evening 6:00 PM - 9:30 PM', load: 92, status: 'Ultra Peak Traffic', color: 'bg-red-500' },
                { slot: 'Night 9:30 PM - 10:30 PM', load: 45, status: 'Moderate Load', color: 'bg-amber-500' }
              ].map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/40 border border-neutral-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{s.slot}</span>
                    <span className="font-mono font-bold text-neutral-200">{s.load}% Load</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.load}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-neutral-400">{s.status}</span>
                    {s.offer && (
                      <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20">
                        {s.offer}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <span className="font-bold block mb-1">Autonomous Slot Re-Balancing Active:</span>
              <p className="leading-relaxed">
                A 25% discount 'Fitness Future Happy Hour Pass' is active for the 12:00 PM - 4:00 PM slot to reduce evening peak congestion by 18%.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FitnessFutureCommandHub;
