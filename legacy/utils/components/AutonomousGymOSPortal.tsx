import React, { useState } from 'react';
import { useSaasNetworkStore, GymBranch } from '../store/saasNetworkStore';
import { analyzeChurnRisk, dispatchWhatsAppRecovery, MemberActivity } from '../retentionEngine';
import { safeSmartJsonParse, CoreDietOutput } from '../neuralParser';
import { FluidWorkoutLog } from './member/FluidWorkoutLog';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Layers, 
  MapPin, 
  Users, 
  AlertTriangle, 
  MessageSquare, 
  Code, 
  Shuffle, 
  Check, 
  TrendingUp, 
  Sparkles,
  Zap,
  CheckCircle,
  Plus,
  RefreshCw,
  Gauge
} from 'lucide-react';

export default function AutonomousGymOSPortal() {
  const { branches, activeBranchId, setActiveBranch, updateCrowdCount, addNewBranch } = useSaasNetworkStore();
  
  // Real-time crowd local Process states
  const [selectedSimBranch, setSelectedSimBranch] = useState<string>('branch-ff-hq');
  const [simCrowdInput, setSimCrowdInput] = useState<number>(0);

  // New branch states
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [newBranchCapacity, setNewBranchCapacity] = useState(60);

  // Churn Risk and CRM states
  const [members, setMembers] = useState<MemberActivity[]>([]);
  const [alertLogs, setAlertLogs] = useState<string[]>([
    `[${new Date().toTimeString().split(' ')[0]}] Fitness Future Gym OS Core initialized.`
  ]);
  const [crmExecutingId, setCrmExecutingId] = useState<string | null>(null);

  // Smart Parser Playground states
  const [messyJsonInput, setMessyJsonInput] = useState<string>(
    `\`\`\`json\n{\n  "status": "Generative Success",\n  "dietPlanName": "Supercharged High-Protein Bajra & Curd Diet",\n  "caloriesKcal": 2450,\n  "macros": {\n    "proteinG": 155,\n    "carbsG": 240,\n    "fatsG": 70\n  }\n}\n\`\`\``
  );
  const [parsedDiet, setParsedDiet] = useState<CoreDietOutput | null>(null);

  // Parse Action
  const handleParseInput = () => {
    const result = safeSmartJsonParse(messyJsonInput);
    setParsedDiet(result);
  };

  // Adaptive AI Coach States
  const [feedbackType, setFeedbackType] = useState<string>('too hard');
  const [customFeedback, setCustomFeedback] = useState<string>('');
  const [oneRepMax, setOneRepMax] = useState({
    squat: 225,
    benchPress: 135,
    deadlift: 315,
    overheadPress: 95
  });
  const [adaptivePlan, setAdaptivePlan] = useState<any>(null);
  const [loadingCoach, setLoadingCoach] = useState<boolean>(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const handleTriggerAdaptiveCoach = async () => {
    setLoadingCoach(true);
    setCoachError(null);
    try {
      const activeFeedback = feedbackType === 'custom' ? customFeedback : feedbackType;
      const response = await fetch('/api/adaptive-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feedback: activeFeedback || 'too hard',
          oneRepMax
        })
      });

      const data = await response.json();
      if (data.success) {
        setAdaptivePlan(data.plan);
        addAlertLog(`AI Coach: Regulated loads: ${data.plan.intensityAdjustment}`);
      } else {
        throw new Error(data.error || 'Server uplink processing failed.');
      }
    } catch (err: any) {
      console.error(err);
      setCoachError(err.message);
      addAlertLog(`AI Coach Error: ${err.message}. Initialized hard recovery fallback plan.`);
    } finally {
      setLoadingCoach(false);
    }
  };

  const handleUpdateCrowdCount = () => {
    updateCrowdCount(selectedSimBranch, simCrowdInput);
    addAlertLog(`Updated crowd count of branch [${selectedSimBranch}] to ${simCrowdInput}`);
  };

  const handleAddNewBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchLocation.trim()) return;
    addNewBranch(newBranchName, newBranchLocation, newBranchCapacity);
    setNewBranchName('');
    setNewBranchLocation('');
    setShowAddBranch(false);
    addAlertLog(`Provisioned new SaaS network branch: ${newBranchName}`);
  };

  const addAlertLog = (msg: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setAlertLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 10)]);
  };

  const handleTriggerWhatsApp = async (member: MemberActivity) => {
    setCrmExecutingId(member.id);
    addAlertLog(`Triggering Churn Prevention Hook for ${member.name}...`);
    const res = await dispatchWhatsAppRecovery(member.phone, member.name);
    if (res.success) {
      addAlertLog(`SUCCESS: ${res.details}`);
    } else {
      addAlertLog(`FAILURE: ${res.details}`);
    }
    setCrmExecutingId(null);
  };

  // Pre-process Churn Engine
  const analyzedMembers = analyzeChurnRisk(members);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-gray-100 p-4 sm:p-8 font-sans">
      {/* Header Overview banner */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-[#1A2333] pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase">
                Active System Status: Live
              </span>
              <span className="px-3 py-1 bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] text-xs font-mono font-bold tracking-widest rounded-full uppercase animate-pulse">
                Autonomous AI Core Enabled
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tight uppercase">
              Autonomous <span className="text-cyan-400">Gym OS</span> Control Center
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">
              Consolidating UPI autopay subscriptions, multi-tenant crowd density tracking, automated CRM WhatsApp trigger queues, and bulletproof safety layers.
            </p>
          </div>
          <div className="bg-[#111622] p-4 rounded-xl border border-[#1D2B44] flex items-center gap-3">
            <Cpu className="h-10 w-10 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <div>
              <div className="text-[10px] font-mono text-gray-500">SYSTEM STENCIL</div>
              <div className="text-sm font-bold text-white uppercase">V4 Autonomous-Suite</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ================= COLUMN 1: LEFT SIDEBAR SIMULATION (4 Columns) ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SaaS Location Crowds Tracking */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-400" />
                Multi-Tenant Network
              </h2>
              <button 
                onClick={() => setShowAddBranch(!showAddBranch)}
                className="p-1.5 bg-[#182030] hover:bg-cyan-500 hover:text-black rounded-lg text-xs font-semibold text-gray-400 transition-all flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Branch
              </button>
            </div>

            {/* Inline add branch form */}
            {showAddBranch && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddNewBranch}
                className="bg-[#182030] border border-[#222E45] p-3.5 rounded-xl mb-4 space-y-3"
              >
                <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase">Provision Raw Node:</div>
                <input
                  type="text"
                  required
                  placeholder="Branch Name (e.g. fitness Jaipur)"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full bg-[#0D121F] border border-[#222E45] px-2.5 py-1.5 rounded-lg text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Location / Address"
                  value={newBranchLocation}
                  onChange={(e) => setNewBranchLocation(e.target.value)}
                  className="w-full bg-[#0D121F] border border-[#222E45] px-2.5 py-1.5 rounded-lg text-xs text-white focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Max Capacity"
                    value={newBranchCapacity}
                    onChange={(e) => setNewBranchCapacity(Number(e.target.value))}
                    className="w-full bg-[#0D121F] border border-[#222E45] px-2.5 py-1.5 rounded-lg text-xs text-white focus:outline-none"
                  />
                  <button type="submit" className="bg-cyan-500 text-black text-xs font-bold rounded-lg uppercase">
                    Setup
                  </button>
                </div>
              </motion.form>
            )}

            {/* Branches list */}
            <div className="space-y-3">
              {branches.map(branch => (
                <div 
                  key={branch.id} 
                  onClick={() => setActiveBranch(branch.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeBranchId === branch.id 
                      ? 'bg-cyan-950/20 border-cyan-500/80 shadow-md shadow-cyan-500/5' 
                      : 'bg-[#182030]/50 border-transparent hover:border-[#222E45]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white block leading-tight">{branch.name}</span>
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                      branch.status === 'optimal' ? 'bg-[#30D158]/10 text-[#30D158]' :
                      branch.status === 'crowded' ? 'bg-[#FFD60A]/10 text-[#FFD60A]' :
                      'bg-[#FF453A]/10 text-[#FF453A]'
                    }`}>
                      {branch.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium mb-2.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {branch.location}
                  </div>

                  {/* Crowd Density progress bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                      <span>Live Occupancy:</span>
                      <span className="font-bold">{branch.currentCrowdCount} / {branch.maxCapacity}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0D121F] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          branch.status === 'optimal' ? 'bg-gradient-to-r from-cyan-400 to-[#30D158]' :
                          branch.status === 'crowded' ? 'bg-gradient-to-r from-[#FFD60A] to-orange-500' :
                          'bg-gradient-to-r from-[#FF453A] to-[#E60000]'
                        }`}
                        style={{ width: `${Math.min(100, (branch.currentCrowdCount / branch.maxCapacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Logs / Alert Web Feed console */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-rose-400" />
              SaaS Operational Event Feed
            </h3>
            <div className="bg-[#0D121F] rounded-xl border border-[#1A2333] p-4 h-[160px] overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5">
              {alertLogs.length === 0 ? (
                <div className="text-gray-600 italic">Logs are silent. Trigger an engine event action to feed logs...</div>
              ) : (
                alertLogs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2: RIGHT CONTENT SPACE (8 Columns) ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Churn Risk alert tables & CRM Triggering API */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 sm:p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-rose-400" />
              AI Activity Churn Risk & WhatsApp Engine
            </h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Analyzes absency rates. Members with more than 7 consecutive days active absence trigger a <span className="text-red-400 font-semibold uppercase">critical alert</span> automatically dispatching recovery kits with n8n hooks.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#222E45] text-gray-400 uppercase font-bold text-[10px] tracking-wider pb-3">
                    <th className="py-2.5">Member Name</th>
                    <th className="py-2.5">Days Absent</th>
                    <th className="py-2.5">Last Seen</th>
                    <th className="py-2.5 text-center">Threat Level</th>
                    <th className="py-2.5 text-right">Autonomous Recovery API</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedMembers.map(item => (
                    <tr key={item.id} className="border-b border-[#222E45]/40 hover:bg-[#182030]/20 transition-colors">
                      <td className="py-3 font-semibold text-white">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono font-normal">{item.phone}</div>
                      </td>
                      <td className="py-3 font-mono font-bold text-cyan-400">{item.daysAbsent} days</td>
                      <td className="py-3 text-gray-400">{item.lastActiveDate}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          item.riskLevel === 'low' ? 'bg-[#30D158]/10 text-[#30D158]' :
                          item.riskLevel === 'medium' ? 'bg-[#FFD60A]/10 text-[#FFD60A]' :
                          'bg-[#FF453A]/10 text-[#FF453A] animate-pulse'
                        }`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleTriggerWhatsApp(item)}
                          disabled={crmExecutingId !== null}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-end gap-1.5 ml-auto ${
                            item.riskLevel === 'critical'
                              ? 'bg-[#FF3B30] text-white hover:bg-red-500 shadow-md shadow-red-950/40'
                              : 'bg-[#182030] hover:bg-[#222E45] text-gray-300'
                          }`}
                        >
                          {crmExecutingId === item.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin text-white" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5" />
                          )}
                          WhatsApp Alert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Live Interactive Crowd modifiers */}
            <div className="mt-5 p-4 bg-[#182030]/40 border border-[#222E45] rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Shuffle className="h-4 w-4 text-cyan-400 animate-pulse" />
                  Real-time Crowd Modifiers
                </div>
                <p className="text-[11px] text-gray-400">Instantly update the Live headcounts of any branch on the SaaS list.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedSimBranch}
                  onChange={(e) => setSelectedSimBranch(e.target.value)}
                  className="bg-[#0D121F] border border-[#222E45] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simCrowdInput}
                  onChange={(e) => setSimCrowdInput(Number(e.target.value))}
                  className="w-16 bg-[#0D121F] border border-[#222E45] text-xs text-center text-white rounded-lg py-1.5 focus:outline-none"
                />
                <button
                  onClick={handleUpdateCrowdCount}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg px-4 py-1.5"
                >
                  Update Count
                </button>
              </div>
            </div>
          </div>

          {/* Section: Fluid Workout Logs Component Injection */}
          <FluidWorkoutLog />

          {/* Section: Core AI Safety Parser Playground */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Code className="h-5 w-5 text-indigo-400" />
              Core AI AI Output Safety Parser Playground
            </h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Vagaro and 1club safety standard. Pastes raw markdown text or messy JSON generated from an external LLM into our local regex parser. The code sanitizes the structure dynamically or invokes our <span className="text-indigo-400 font-semibold uppercase">Indigenous Diet Fallback Plans</span> in case of syntax crashes instead of throwing a white-screen fatal error.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Raw JSON input text area */}
              <div className="space-y-3">
                <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  📥 Raw Core AI Engine Output String:
                </span>
                <textarea
                  value={messyJsonInput}
                  onChange={(e) => setMessyJsonInput(e.target.value)}
                  className="w-full h-44 bg-[#070A10] border border-[#1D2B44] text-xs font-mono text-cyan-300 p-3.5 rounded-xl block focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Paste messy payload string here..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleParseInput}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Verify Smart Parse Guard
                  </button>
                  <button
                    onClick={() => {
                      setMessyJsonInput(`MALFORMED INPUT WRITTEN BY MISTAKE: INVALID JSON DATA STRING`);
                      addAlertLog("Injected deliberately broken non-JSON malformed values inside safety test block");
                    }}
                    className="py-2.5 px-3 bg-[#182030] border border-[#222E45] hover:bg-rose-950/20 hover:border-rose-800 text-xs text-gray-300 hover:text-rose-400 rounded-xl"
                  >
                    Force Malform Error
                  </button>
                </div>
              </div>

              {/* Rendered Safety Parser Outputs */}
              <div className="space-y-3 bg-[#0D121F] p-4 border border-[#222E45] rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-3 border-b border-[#222E45] pb-2">
                    🛡️ Output Sanitization State:
                  </span>

                  {parsedDiet ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] font-mono text-gray-500 uppercase">SANITY STATUS</div>
                        <div className="text-xs font-mono text-[#30D158] font-black uppercase flex items-center gap-1 mt-0.5">
                          <CheckCircle className="h-4 w-4 fill-none" />
                          {parsedDiet.status}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[10px] font-mono text-gray-500 uppercase">PLAN TITLE</div>
                        <div className="text-sm font-bold text-white mt-0.5">{parsedDiet.dietPlanName}</div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-[#182030]/60 p-2 rounded border border-[#222E45]/40 text-center">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">CALORIES</div>
                          <div className="text-xs font-black text-cyan-400 font-mono">{parsedDiet.caloriesKcal} kcal</div>
                        </div>
                        <div className="bg-[#182030]/60 p-2 rounded border border-[#222E45]/40 text-center">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">PROTEIN</div>
                          <div className="text-xs font-black text-[#FF375F] font-mono">{parsedDiet.macros.proteinG}g</div>
                        </div>
                        <div className="bg-[#182030]/60 p-2 rounded border border-[#222E45]/40 text-center">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">CARBS</div>
                          <div className="text-xs font-black text-[#FFD60A] font-mono">{parsedDiet.macros.carbsG}g</div>
                        </div>
                        <div className="bg-[#182030]/60 p-2 rounded border border-[#222E45]/40 text-center">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">FATS</div>
                          <div className="text-xs font-black text-[#30D158] font-mono">{parsedDiet.macros.fatsG}g</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-10 italic">
                      Click the verify button to process the live parser sandbox checks...
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-gray-500 leading-normal border-t border-[#1C202F] pt-2 italic">
                  *Uses deep regex substring extractions ensuring no white screens, preserving customer retention.
                </div>
              </div>
            </div>
          </div>

          {/* Section: Adaptive AI Coach Logic Playground */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400 animate-pulse" />
              Real-Time Adaptive AI Coach (AdaptiveCoachSync)
            </h2>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Combines subjective lifter feedback with biometric 1-Rep Max capability parameters. Recursively queries Core AI models to balance neural loads and prevent acute injuries, ensuring compliant biomechanical training plans.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Tweak Parameters */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#0D121F] p-4 rounded-xl border border-[#222E45]/80 space-y-3">
                  <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider border-b border-[#1C253D] pb-1.5 flex items-center justify-between">
                    <span>1-Rep Max Metrics (lbs)</span>
                    <span className="text-[9px] text-gray-500 uppercase">Input exact metrics</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-1 font-mono">SQUAT 1RM</label>
                      <input 
                        type="number"
                        value={oneRepMax.squat}
                        onChange={(e) => setOneRepMax({ ...oneRepMax, squat: Math.max(1, Number(e.target.value)) })}
                        className="w-full bg-[#121826] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-1 font-mono">BENCH PRESS 1RM</label>
                      <input 
                        type="number"
                        value={oneRepMax.benchPress}
                        onChange={(e) => setOneRepMax({ ...oneRepMax, benchPress: Math.max(1, Number(e.target.value)) })}
                        className="w-full bg-[#121826] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-1 font-mono">DEADLIFT 1RM</label>
                      <input 
                        type="number"
                        value={oneRepMax.deadlift}
                        onChange={(e) => setOneRepMax({ ...oneRepMax, deadlift: Math.max(1, Number(e.target.value)) })}
                        className="w-full bg-[#121826] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-1 font-mono">OH PRESS 1RM</label>
                      <input 
                        type="number"
                        value={oneRepMax.overheadPress}
                        onChange={(e) => setOneRepMax({ ...oneRepMax, overheadPress: Math.max(1, Number(e.target.value)) })}
                        className="w-full bg-[#121826] border border-[#222E45] rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback Selection Panel */}
                <div className="bg-[#0D121F] p-4 rounded-xl border border-[#222E45]/80 space-y-3">
                  <div className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider border-b border-[#1C253D] pb-1.5">
                    Subjective Training Feedback
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFeedbackType('too hard')}
                      className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 ${
                        feedbackType === 'too hard'
                          ? 'bg-rose-950/25 border-rose-500 text-rose-400 shadow-md shadow-rose-950/10'
                          : 'bg-[#121826] border-[#222E45] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Too Hard
                    </button>
                    <button
                      onClick={() => setFeedbackType('too easy')}
                      className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 ${
                        feedbackType === 'too easy'
                          ? 'bg-cyan-950/25 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-950/10'
                          : 'bg-[#121826] border-[#222E45] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      Too Easy
                    </button>
                    <button
                      onClick={() => setFeedbackType('joint pain')}
                      className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 ${
                        feedbackType === 'joint pain'
                          ? 'bg-amber-950/25 border-amber-500 text-amber-400 shadow-md shadow-amber-950/10'
                          : 'bg-[#121826] border-[#222E45] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Joint Pain
                    </button>
                  </div>

                  {/* Custom Input */}
                  <div className="pt-1 font-sans">
                    <label className="relative inline-flex items-center cursor-pointer mb-2">
                      <input 
                        type="checkbox" 
                        checked={feedbackType === 'custom'}
                        onChange={(e) => setFeedbackType(e.target.checked ? 'custom' : 'too hard')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#0D121F] border border-[#222E45] rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-600 after:border-gray-700 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600/20 peer-checked:border-indigo-505" />
                      <span className="ml-2 text-[10px] font-mono font-bold uppercase text-gray-400">Custom Complaint Prompt</span>
                    </label>

                    {feedbackType === 'custom' && (
                      <textarea
                        value={customFeedback}
                        onChange={(e) => setCustomFeedback(e.target.value)}
                        placeholder="e.g., Lower back feels highly stiff during overhead locks..."
                        className="w-full bg-[#121826] border border-indigo-500/40 text-xs font-sans text-indigo-300 p-2.5 rounded-lg focus:outline-none resize-none h-16"
                      />
                    )}
                  </div>
                </div>

                <button
                  onClick={handleTriggerAdaptiveCoach}
                  disabled={loadingCoach}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-mono"
                >
                  {loadingCoach ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-black" />
                      RE-MODULATING LOADS...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      SYNC ADAPTIVE COACH
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Rendering output adjusted plan */}
              <div className="lg:col-span-7 bg-[#0D121F] border border-[#222E45]/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-3 border-b border-[#222E45] pb-2 flex items-center justify-between">
                    <span>🛡️ AI Recalculated Strategy Output</span>
                    {adaptivePlan && (
                      <span className="text-[9px] font-bold text-[#FFD60A] uppercase px-1.5 py-0.5 bg-yellow-950/20 border border-yellow-500/30 rounded">
                        Active Profile
                      </span>
                    )}
                  </div>

                  {loadingCoach ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                      <div className="w-10 h-10 border border-dashed border-cyan-400 rounded-full animate-spin flex items-center justify-center">
                        <Cpu className="h-4 w-4 text-cyan-400 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white font-mono uppercase tracking-wider animate-pulse">Running Biomechanical Load Balancing</div>
                        <p className="text-[10px] text-gray-500 max-w-xs">Querying Core AI, applying safety thresholds, recalculating volume matrices...</p>
                      </div>
                    </div>
                  ) : coachError ? (
                    <div className="p-4 bg-rose-950/10 border border-rose-500/30 rounded-xl text-center space-y-2 col-span-1 border-dotted">
                      <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                      <div className="text-xs font-bold text-rose-400 font-mono uppercase">Smart Uplink Interrupted</div>
                      <p className="text-[10px] text-gray-400">{coachError}</p>
                    </div>
                  ) : adaptivePlan ? (
                    <div className="space-y-4 text-left">
                      {/* Reasoning callout */}
                      <div className="p-3 bg-indigo-950/15 border border-indigo-500/20 rounded-lg">
                        <div className="text-[9px] font-mono text-indigo-400 font-black uppercase tracking-wider mb-1">
                          COACH DIAGNOSTIC REASONING:
                        </div>
                        <p className="text-xs text-gray-300 italic leading-relaxed">
                          {adaptivePlan.coachReasoning}
                        </p>
                      </div>

                      {/* Factor parameters */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">INTENSITY OFFSET:</div>
                          <div className="text-xs font-bold text-cyan-400 mt-0.5 uppercase bg-cyan-950/25 px-2 py-1 rounded inline-block border border-cyan-500/20">
                            {adaptivePlan.intensityAdjustment}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">COMPLIANCE STATS:</div>
                          <div className="text-xs font-bold text-emerald-400 mt-0.5 uppercase bg-emerald-950/25 px-2 py-1 rounded inline-block border border-emerald-500/20 font-mono">
                            100% Secure
                          </div>
                        </div>
                      </div>

                      {/* Safety Guidelines */}
                      {adaptivePlan.safetyProtocols && adaptivePlan.safetyProtocols.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-bold">STRICT SAFETY CHECKLIST:</div>
                          <ul className="space-y-1">
                            {adaptivePlan.safetyProtocols.map((p: string, idx: number) => (
                              <li key={idx} className="text-[10px] text-orange-200 flex items-start gap-1">
                                <span className="text-orange-500 shrink-0 font-bold font-mono">▸</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Adaptive Exercise List */}
                      <div className="space-y-3 pt-2 border-t border-[#1C202F]">
                        <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-semibold">MODULATED EXERCISE DOSAGES:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {adaptivePlan.exercises && adaptivePlan.exercises.map((ex: any, idx: number) => (
                            <div key={idx} className="bg-[#121826] border border-[#222E45]/85 p-3 rounded-xl flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-white line-clamp-1">{ex.name}</h4>
                                <div className="flex items-baseline gap-1 mt-1 font-mono">
                                  <span className="text-[11px] font-extrabold text-cyan-400">{ex.targetWeightLbs} lbs</span>
                                  <span className="text-[9px] text-gray-500">({ex.percentageOf1RM}% 1RM)</span>
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-[#1C253D] space-y-1 text-left">
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-gray-500">DOSAGE:</span>
                                  <span className="text-white font-bold">{ex.sets}s × {ex.reps}r</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-gray-500">TEMPO:</span>
                                  <span className="text-indigo-400 font-bold">{ex.tempo}</span>
                                </div>
                                <p className="text-[9px] text-gray-400 leading-snug font-sans mt-1 bg-[#0D121F] p-1.5 rounded border border-[#1A2333]/60">
                                  {ex.notes}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-24 italic">
                      Click 'SYNC ADAPTIVE COACH' left panel button to compile real-time load adjustments...
                    </div>
                  )}
                </div>

                <div className="text-[9px] mt-4 text-gray-500 leading-normal border-t border-[#1C202F] pt-2 italic text-center">
                  *Adaptive coach calculates live 1RM percentages strictly corresponding to physical biomechanics telemetry.
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
