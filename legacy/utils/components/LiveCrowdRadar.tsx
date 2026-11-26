import React, { useState, useEffect } from 'react';
import { useSmartStore } from '../store/useSmartStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Activity, 
  Users, 
  Wifi, 
  Shield, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  TrendingUp, 
  Scan, 
  Eye, 
  Maximize2,
  Lock
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const LiveCrowdRadar: React.FC = () => {
  const isOnline = useNetworkStatus();
  const { crowdMetrics, updateCrowd } = useSmartStore();
  const { currentHeadcount, maxCapacity, status, branchName } = crowdMetrics;

  // Animation state
  const [simulatMode, setSimulatMode] = useState<boolean>(true);
  const [radarSweeping, setRadarSweeping] = useState<boolean>(true);

  // Capacity calculation
  const occupancyPercentage = Math.round((currentHeadcount / maxCapacity) * 100);

  // Dynamic Neon Color Mapping based on capacity criteria:
  // - glows neon cyan (#00F0FF) when below 50% capacity
  // - glows golden/amber (#FFD700) when 50% to 80%
  // - glows neon orange/red (#FF5E00) when above 80%
  let neonColor = '#00F5FF'; // neon cyan default
  let neonShadow = 'rgba(0, 245, 255, 0.5)';
  let glowTailwind = 'shadow-[0_0_20px_rgba(0,245,255,0.4)] border-[#00F5FF]/50 text-[#00F5FF]';
  let badgeStyle = 'bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/30';

  if (occupancyPercentage >= 50 && occupancyPercentage <= 80) {
    neonColor = '#FFD60A'; // yellow
    neonShadow = 'rgba(255, 214, 10, 0.5)';
    glowTailwind = 'shadow-[0_0_20px_rgba(255,214,10,0.4)] border-[#FFD60A]/50 text-[#FFD60A]';
    badgeStyle = 'bg-[#FFD60A]/10 text-[#FFD60A] border-[#FFD60A]/30';
  } else if (occupancyPercentage > 80) {
    neonColor = '#FF5E00'; // neon orange
    neonShadow = 'rgba(255, 94, 0, 0.5)';
    glowTailwind = 'shadow-[0_0_20px_rgba(255,94,0,0.5)] border-[#FF5E00]/50 text-[#FF5E00]';
    badgeStyle = 'bg-[#FF5E00]/10 text-[#FF5E00] border-[#FF5E00]/30 animate-pulse';
  }

  // Auto scanning sweep line simulation (Replaced with Tailwind CSS animation in markup for extreme performance optimization)

  // Periodic simulated change helper
  useEffect(() => {
    if (!simulatMode || !isOnline) return;
    const interval = setInterval(() => {
      const delta = Math.random() > 0.5 ? 1 : -1;
      const nextCount = Math.max(2, Math.min(maxCapacity, currentHeadcount + delta));
      updateCrowd(nextCount);
    }, 4500);

    return () => clearInterval(interval);
  }, [simulatMode, isOnline, currentHeadcount, maxCapacity, updateCrowd]);

  // SVG parameters for circular gauge
  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (occupancyPercentage / 100) * circumference;

  return (
    <div id="live_crowd_radar_view" className="min-h-screen bg-[#060810] text-[#E4E6EB] p-4 sm:p-8 font-mono select-none relative overflow-hidden flex flex-col justify-between">
      
      {/* Cyber Grid Background Ambient Art */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,24,48,0.3),rgba(6,8,16,1))] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />

      {/* Cyber Header bar */}
      <div className="max-w-2xl mx-auto w-full z-10 border-b-2 border-dashed border-[#1B233D] pb-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00F5FF] rounded-full animate-ping shrink-0" />
            <span className="text-[10px] tracking-[0.25em] text-[#00F5FF] font-black uppercase">
              GRID PROTOCOL AX-29
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className={`hidden sm:inline ${isOnline ? 'text-gray-500' : 'text-red-500'}`}>SAT_CONN: {isOnline ? 'OK' : 'FAIL'}</span>
            <span className={`px-2 py-0.5 rounded ${isOnline ? 'bg-[#182033] text-[#00FF55]' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
              {isOnline ? 'CRYPTO SECURE' : 'OFFLINE MODE'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end mt-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter flex items-center gap-2">
              NEURAL <span className="text-[#00F5FF]">CROWD RADAR</span>
            </h1>
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
              Cyberpunk-Engineered Live Attendance Heatmap & Telemetry
            </p>
          </div>
          <div className="h-6 w-12 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center text-[10px] text-zinc-600 font-extrabold tracking-widest">
            V4
          </div>
        </div>
      </div>

      {/* MAIN RADAR PANEL (Max-w sized specifically for beautiful mobile aspect-ratio inside iframes) */}
      <div className="max-w-md mx-auto w-full z-10 space-y-6">
        
        {/* Main Hologram Pod Frame */}
        <div className="bg-[#0D1222] border-2 border-[#1E2943] rounded-3xl p-6 relative overflow-hidden shadow-2xl shadow-black/80">
          
          {/* Futuristic diagonal slant elements and glass glare */}
          <div className="absolute top-0 right-0 w-24 h-5 bg-[#1C2849] rounded-bl-xl border-l border-b border-[#2D3E6B]' pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Core Telemetry labels */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] text-gray-500 tracking-widest block uppercase font-bold">ACTIVE SCAN AREA</span>
              <h2 className="text-md sm:text-lg font-black text-white uppercase italic tracking-tight">{branchName}</h2>
            </div>
            
            <span className={`px-2.5 py-1 text-xs font-mono font-black uppercase rounded-lg border tracking-wider transition-all duration-300 ${badgeStyle}`}>
              {status}
            </span>
          </div>

          {/* SVG CYBERPUNK ROTATING GAUGE */}
          <div className="relative flex items-center justify-center my-6 py-4">
            
            {/* Ambient Background Pulse Circle */}
            <div 
              className="absolute w-[170px] h-[170px] rounded-full transition-all duration-700 pointer-events-none" 
              style={{ 
                boxShadow: `0 0 45px 5px ${neonColor}1a`, 
                border: `1px solid ${neonColor}15` 
              }}
            />

            {/* Radar Sweep Scanning Ring Line */}
            <div 
              className={`absolute w-[205px] h-[205px] rounded-full border border-dashed border-[#1E2943]/60 flex items-center justify-center pointer-events-none ${radarSweeping ? 'animate-[spin_4s_linear_infinite]' : ''}`}
            >
              <div 
                className="absolute top-0 left-1/2 -ml-1 w-2 h-2 rounded-full" 
                style={{ backgroundColor: neonColor, boxShadow: `0 0 10px ${neonColor}` }}
              />
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2D3E6B]/30 to-transparent" />
            </div>

            {/* SVG Progress Circle */}
            <svg className="w-52 h-52 transform -rotate-90 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200">
              <defs>
                <radialGradient id="cyberGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0B1020" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#060912" stopOpacity="0.9" />
                </radialGradient>
                <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={neonColor} />
                  <stop offset="100%" stopColor="#8A2BE2" />
                </linearGradient>
              </defs>

              {/* Outer Cyber ring ticks */}
              <circle cx="100" cy="100" r="92" stroke="#1A2238" strokeWidth="1" fill="none" strokeDasharray="3, 5" />

              {/* Inner container disc */}
              <circle cx="100" cy="100" r="88" fill="url(#cyberGlowGrad)" />

              {/* Progress Background Track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="#12182B"
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Interactive glowing Neon Progress Arc */}
              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                stroke="url(#neonGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: strokeDashoffset }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                strokeLinecap="round"
                fill="none"
              />

              {/* Micro Scale notches */}
              <circle cx="100" cy="100" r="70" stroke="#1A2238" strokeWidth="1.5" fill="none" strokeDasharray="1, 8" />
            </svg>

            {/* Inside Circle Digital Percentage Display */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">OCCUPANCY</span>
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-white select-none transition-all duration-300" style={{ textShadow: `0 0 15px ${neonColor}3a` }}>
                {occupancyPercentage}%
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-bold font-mono text-cyan-400">{currentHeadcount}</span>
                <span className="text-[10px] text-gray-500">/</span>
                <span className="text-[10px] text-gray-500 uppercase">{maxCapacity} MAX</span>
              </div>
            </div>
          </div>

          {/* Telemetry Multi-readouts */}
          <div className="grid grid-cols-2 gap-3.5 mt-2">
            <div className="bg-[#12182B]/60 p-3 rounded-xl border border-[#1E2943]/60 relative overflow-hidden">
              <span className="block text-[9px] text-[#00F5FF] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-[#00F5FF]" />
                RADAR REFRESH
              </span>
              <span className="text-sm font-bold text-white block">4.2 GHz Pulse</span>
              <span className="text-[8px] text-gray-500 uppercase">Handshake Frequency</span>
            </div>

            <div className="bg-[#12182B]/60 p-3 rounded-xl border border-[#1E2943]/60 relative overflow-hidden">
              <span className="block text-[9px] text-orange-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-orange-400" />
                CHURN VECTOR
              </span>
              <span className="text-sm font-bold text-white block">0.02 Churn%</span>
              <span className="text-[8px] text-gray-500 uppercase">AI Projected Today</span>
            </div>
          </div>

        </div>

        {/* CONTROLLER SECTION: Simulation, Scan Controls & Sliders */}
        <div className="bg-[#0D1222]/80 border border-[#1E2943]/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2943] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase text-white tracking-widest">Radar Controller Rig</h3>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={simulatMode} 
                onChange={() => {
                  setSimulatMode(!simulatMode);
                  setRadarSweeping(!simulatMode);
                }} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-900 border border-[#22335C] rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#1C2849] after:border-zinc-850 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00F5FF]/10 peer-checked:border-[#00F5FF]/40" />
              <span className="ml-2 text-[10px] font-bold uppercase font-mono tracking-wider text-gray-400">
                {simulatMode ? 'AI Auto Sim' : 'Live Manual'}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-[11px] mb-2">
                <span className="text-gray-400 uppercase font-semibold">Tweak Gym Count:</span>
                <span className="text-white font-mono font-black" style={{ color: neonColor }}>
                  {currentHeadcount} Members Inside
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={maxCapacity}
                value={currentHeadcount}
                onChange={(e) => {
                  setSimulatMode(false); // turn off auto-sim on drag
                  updateCrowd(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-[#070A10] border border-[#1E2943] rounded-lg appearance-none cursor-pointer accent-[#00F5FF] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSimulatMode(false);
                  updateCrowd(12); // Under 50%
                }}
                className="p-2 border border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase rounded-lg tracking-wider transition-all"
              >
                Set Free (30%)
              </button>
              <button
                onClick={() => {
                  setSimulatMode(false);
                  updateCrowd(26); // Middle (65%)
                }}
                className="p-2 border border-yellow-500/20 bg-yellow-950/10 hover:bg-yellow-500/20 text-[#FFF] text-[10px] font-bold uppercase rounded-lg tracking-wider transition-all"
              >
                Set Busy (65%)
              </button>
              <button
                onClick={() => {
                  setSimulatMode(false);
                  updateCrowd(38); // Over 80%
                }}
                className="p-2 border-red-500/20 border bg-rose-950/10 hover:bg-rose-500/20 text-[#FF5E00] text-[10px] font-bold uppercase rounded-lg tracking-wider transition-all"
              >
                Set Full (95%)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Futuristic status footer label */}
      <div className="max-w-md mx-auto w-full z-10 mt-4 text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.25em] leading-normal font-medium max-w-xs mx-auto">
          Securely managed via <span className="text-[#00F5FF] font-semibold">useSmartStore</span> decentralized matrix. Code compliant.
        </p>
      </div>

    </div>
  );
};

export default LiveCrowdRadar;
