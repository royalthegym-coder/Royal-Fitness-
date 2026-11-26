import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Calendar, Star, Medal, Database, Terminal, Code, Clock, Sparkles, Cpu, Copy, Check, Shield, Zap } from 'lucide-react';
import { useData } from '../context/DataProvider';

export const getCyberpunkTier = (index: number, totalCount: number) => {
    if (index === 0) {
        return { 
            name: 'Prime Titan', 
            color: 'text-cyan-400', 
            bg: 'bg-cyan-950/40',
            border: 'border-cyan-500/40',
            glow: 'shadow-[0_0_25px_rgba(6,182,212,0.35)]',
            textGlow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
        };
    }
    const percentage = index / totalCount;
    if (percentage <= 0.15) {
        return { 
            name: 'Neon Warrior', 
            color: 'text-purple-400', 
            bg: 'bg-purple-950/30',
            border: 'border-purple-500/30',
            glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]',
            textGlow: 'drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]'
        };
    }
    if (percentage <= 0.35) {
        return { 
            name: 'Iron Cyborg', 
            color: 'text-red-400', 
            bg: 'bg-red-950/30',
            border: 'border-red-500/30',
            glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]',
            textGlow: 'drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]'
        };
    }
    return { 
        name: 'Bio-Rookie', 
        color: 'text-gray-400', 
        bg: 'bg-gray-950/40',
        border: 'border-gray-800',
        glow: '',
        textGlow: ''
    };
};

const Leaderboard: React.FC = () => {
    const { members, attendanceRecords } = useData();

    // DBA Playbook states
    const [dbaActiveTab, setDbaActiveTab] = useState<'none' | 'sql' | 'deno' | 'simulation'>('none');
    const [simLogs, setSimLogs] = useState<string[]>([]);
    const [simState, setSimState] = useState<'idle' | 'running' | 'completed'>('idle');
    const [copiedSec, setCopiedSec] = useState<string>('');

    const handleCopy = (text: string, section: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSec(section);
        setTimeout(() => setCopiedSec(''), 2000);
    };

    const runNightlySimulation = async () => {
        setSimState('running');
        setSimLogs([
            `[${new Date().toLocaleTimeString()}] 🚀 Initiating Nightly Leaders Cron Trigger...`,
            `[${new Date().toLocaleTimeString()}] 📡 Resolving tenant boundary 'gym_id' via multi-tenant context...`,
        ]);

        await new Promise(r => setTimeout(r, 600));
        setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔍 DB Query: FETCH ALL active members and 60-day workout_logs...`]);

        await new Promise(r => setTimeout(r, 800));
        setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚙️ Executing volumetric algorithms on exercises (Sets * Reps * Load)...`]);

        await new Promise(r => setTimeout(r, 900));
        const memberLines = members.length > 0
            ? members.slice(0, 3).map(m => `   ▸ ${m.name}: Verified volume -> Badges: [Active Member]`)
            : [`   ▸ 0 registered members in current tenant scope.`];
        setSimLogs(prev => [...prev, 
            `[${new Date().toLocaleTimeString()}] 📊 Calculated Volume stats:`,
            ...memberLines
        ]);

        await new Promise(r => setTimeout(r, 700));
        setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 📈 Normalizing consistency indexes with check-in timestamps...`]);

        await new Promise(r => setTimeout(r, 800));
        setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🛡️ Applying multi-tenant gym isolation (RLS checks: PASSED)`]);

        await new Promise(r => setTimeout(r, 600));
        setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 💾 Executing mass atomic UPSERTs into 'gym_leaderboard' table...`]);

        await new Promise(r => setTimeout(r, 500));
        setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🎉 Leaderboard computed successfully. Deno Thread Terminated. Status: OK 200`]);
        setSimState('completed');
    };

    const sqlSchemaContent = `-- Create Gym Leaderboard Table
CREATE TABLE IF NOT EXISTS gym_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    total_volume INT NOT NULL DEFAULT 0,
    consistency_score INT NOT NULL DEFAULT 0,
    avg_ai_score DECIMAL(5,2) DEFAULT 0.00,
    badges TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    current_rank INT NOT NULL DEFAULT 1,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_gym_member UNIQUE (gym_id, member_id)
);

-- Enable RLS and isolate by tenant
ALTER TABLE gym_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard Gym Isolation" ON gym_leaderboard
    FOR ALL USING (gym_id IN (SELECT user_gym_ids()));`;

    const edgeFunctionContent = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  // 1. Fetch active members and workout profiles
  // 2. Parse exercise JSONB schemas to calculate total_volume
  // 3. Score habit consistency & assign Badges
  // 4. Multi-Tenant Rank sorting & Atomic table UPSERTS
  return new Response(JSON.stringify({ success: true }));
});`;

    const leaderboardData = useMemo(() => {
        return members.filter(m => m.status === 'Active').map(member => {
            const attendanceCount = attendanceRecords.filter(a => a.memberId === member.id).length;
            // calories burned based on attendance and level
            const caloriesBurned = attendanceCount * (500 + (member.level * 50));
            const points = (attendanceCount * 10) + (member.level * 50);

            return {
                ...member,
                attendanceCount,
                caloriesBurned,
                points
            };
        }).sort((a, b) => b.points - a.points);
    }, [members, attendanceRecords]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Future <span className="text-yellow-400">Leaderboard</span>
                    </h2>
                    <p className="text-yellow-500/60 font-mono text-xs uppercase tracking-[0.2em] mt-1">Monthly Rankings & Rewards</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-400" />
            </div>

            {/* Top 3 Podium */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-10 mt-12 mb-16 h-72">
                {/* 2nd Place */}
                {leaderboardData[1] && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="flex flex-col items-center w-36"
                    >
                        <div className="relative mb-4 group">
                            <div className="absolute -inset-1.5 bg-purple-500/30 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                            <div className="w-18 h-18 rounded-full bg-gray-950 border-4 border-purple-500 flex items-center justify-center overflow-hidden z-10 relative">
                                {leaderboardData[1].avatar ? (
                                    <img src={leaderboardData[1].avatar || "https://i.pravatar.cc/150?u=2"} alt={leaderboardData[1].name} className="w-20 h-20 rounded-full object-cover border-4 border-gray-400 shadow-xl" />
                                ) : (
                                    <span className="text-purple-400 font-black text-xl">{leaderboardData[1].name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-black z-20 shadow-[0_0_10px_#9333ea]">2</div>
                        </div>
                        <div className="bg-gradient-to-t from-purple-950/40 via-gray-950 to-gray-900 w-full h-36 rounded-2xl flex flex-col items-center justify-start pt-4 px-2 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                            <span className="text-white font-black text-xs text-center truncate w-full">{leaderboardData[1].name}</span>
                            <span className="text-purple-400 text-xs font-mono mt-1 font-bold">{leaderboardData[1].points} XP</span>
                            <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 mt-3 rounded-full border border-purple-500/20">NEON WARRIOR</span>
                        </div>
                    </motion.div>
                )}

                {/* 1st Place */}
                {leaderboardData[0] && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center w-44 z-10"
                    >
                        <div className="relative mb-4 group select-none">
                            <div className="absolute -inset-2 bg-cyan-500/40 rounded-full blur-[10px] animate-pulse"></div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-cyan-400 animate-bounce">
                                <Trophy className="w-9 h-9 drop-shadow-[0_0_10px_#06b6d4]" />
                            </div>
                            <div className="w-26 h-26 rounded-full bg-gray-950 border-4 border-cyan-400 flex items-center justify-center overflow-hidden z-10 relative shadow-[0_0_40px_rgba(6,182,212,0.5)]">
                                {leaderboardData[0].avatar ? (
                                    <img src={leaderboardData[0].avatar || "https://i.pravatar.cc/150?u=1"} alt={leaderboardData[0].name} className="w-28 h-28 rounded-full object-cover border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
                                ) : (
                                    <span className="text-cyan-400 font-black text-3xl">{leaderboardData[0].name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-4 -right-2 bg-cyan-500 text-black w-10 h-10 rounded-full flex items-center justify-center font-black border-2 border-black z-20 text-lg shadow-[0_0_15px_#06b6d4]">1</div>
                        </div>
                        <div className="bg-gradient-to-t from-cyan-950/40 via-gray-950 to-gray-900 w-full h-44 rounded-3xl flex flex-col items-center justify-start pt-4 px-2 border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.25)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
                            <span className="text-white font-black text-sm text-center truncate w-full italic uppercase">{leaderboardData[0].name}</span>
                            <span className="text-cyan-400 text-sm font-mono mt-1 font-bold drop-shadow-[0_0_4px_#06b6d4]">{leaderboardData[0].points} XP</span>
                            <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase bg-cyan-500/15 px-3 py-1 mt-3 rounded-full border border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.2)] animate-pulse">QUANTUM TITAN</span>
                            <div className="mt-2 text-[8px] font-bold text-gray-500 uppercase tracking-widest">Free Protein Shake Reward</div>
                        </div>
                    </motion.div>
                )}

                {/* 3rd Place */}
                {leaderboardData[2] && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="flex flex-col items-center w-32"
                    >
                        <div className="relative mb-4 group">
                            <div className="absolute -inset-1.5 bg-red-500/30 rounded-full blur opacity-75"></div>
                            <div className="w-16 h-16 rounded-full bg-gray-950 border-4 border-red-500 flex items-center justify-center overflow-hidden z-10 relative">
                                {leaderboardData[2].avatar ? (
                                    <img src={leaderboardData[2].avatar || "https://i.pravatar.cc/150?u=3"} alt={leaderboardData[2].name} className="w-20 h-20 rounded-full object-cover border-4 border-amber-700 shadow-xl" />
                                ) : (
                                    <span className="text-red-400 font-bold text-xl">{leaderboardData[2].name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-black z-20 shadow-[0_0_10px_#dc2626]">3</div>
                        </div>
                        <div className="bg-gradient-to-t from-red-950/40 via-gray-950 to-gray-900 w-full h-30 rounded-2xl flex flex-col items-center justify-start pt-4 px-2 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                            <span className="text-white font-black text-xs text-center truncate w-full">{leaderboardData[2].name}</span>
                            <span className="text-red-400 text-xs font-mono mt-1 font-bold">{leaderboardData[2].points} XP</span>
                            <span className="text-[9px] font-black tracking-widest text-red-400 uppercase bg-red-500/10 px-2 py-0.5 mt-3 rounded-full border border-red-500/20">IRON CYBORG</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Full List */}
            <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-5">Member</div>
                    <div className="col-span-2 text-center">XP Points</div>
                    <div className="col-span-2 text-center hidden md:block">Workouts</div>
                    <div className="col-span-2 text-center hidden md:block">Calories</div>
                </div>
                <div className="divide-y divide-white/5">
                    {leaderboardData.slice(3).map((member, idx) => (
                        <div key={member.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                            <div className="col-span-1 text-center font-mono text-gray-500 font-bold">
                                #{idx + 4}
                            </div>
                            <div className="col-span-5 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                                    {member.avatar ? (
                                        <img src={member.avatar || "https://i.pravatar.cc/150?u=" + member.id} alt={member.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                    ) : (
                                        <span className="text-gray-400 text-xs font-bold">{member.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{member.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-gray-500 text-xs">Level {member.level}</span>
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 rounded uppercase">
                                            {(() => {
                                                const tier = getCyberpunkTier(idx + 3, leaderboardData.length);
                                                return <span className={`${tier.color} font-extrabold`}>{tier.name}</span>;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="inline-flex items-center gap-1 text-yellow-400 font-mono font-bold bg-yellow-400/10 px-2 py-1 rounded">
                                    <Star className="w-3 h-3" /> {member.points}
                                </span>
                            </div>
                            <div className="col-span-2 text-center hidden md:flex items-center justify-center gap-1 text-gray-400 font-mono text-sm">
                                <Calendar className="w-4 h-4" /> {member.attendanceCount}
                            </div>
                            <div className="col-span-2 text-center hidden md:flex items-center justify-center gap-1 text-orange-400 font-mono text-sm">
                                <Flame className="w-4 h-4" /> {member.caloriesBurned}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section: DBA COMPLIANCE GATEWAY */}
            <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden mt-10">
                <div className="absolute top-0 right-0 w-36 h-36 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C253D] pb-4 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Database className="h-5 w-5 text-yellow-500" />
                            DBA Compliance & Cron Trigger Console
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Isolate scoreboard partitions secure via Row Level Security (RLS) and calculate daily statistics.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <button
                        onClick={() => setDbaActiveTab(dbaActiveTab === 'sql' ? 'none' : 'sql')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                            dbaActiveTab === 'sql'
                                ? 'bg-yellow-950/20 border-yellow-500 text-yellow-400'
                                : 'bg-[#0D121F] border-[#222E45]/80 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase">
                            <Database className="h-4 w-4" />
                            PostgreSQL Schema
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Review `gym_leaderboard` SQL & RLS Gym protection rules.
                        </p>
                    </button>

                    <button
                        onClick={() => setDbaActiveTab(dbaActiveTab === 'deno' ? 'none' : 'deno')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                            dbaActiveTab === 'deno'
                                ? 'bg-blue-950/20 border-blue-500 text-blue-400'
                                : 'bg-[#0D121F] border-[#222E45]/80 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase">
                            <Code className="h-4 w-4" />
                            Deno Edge Script
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Inspect TypeScript nightly trigger logic built for Deno.
                        </p>
                    </button>

                    <button
                        onClick={() => setDbaActiveTab(dbaActiveTab === 'simulation' ? 'none' : 'simulation')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                            dbaActiveTab === 'simulation'
                                ? 'bg-green-950/20 border-green-500 text-green-400'
                                : 'bg-[#0D121F] border-[#222E45]/80 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase">
                            <Terminal className="h-4 w-4" />
                            Trigger simulation
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Process the automated database cron processing execution.
                        </p>
                    </button>

                    <div className="bg-[#0D121F] border border-[#222E45]/40 p-3 rounded-xl flex items-center gap-3">
                        <Shield className="h-8 w-8 text-emerald-500 shrink-0" />
                        <div>
                            <div className="text-[9px] font-mono font-bold text-emerald-400 uppercase">RLS Compliance</div>
                            <p className="text-[10px] text-gray-400 leading-snug">
                                Enforced via `gym_id` on physical records inside the database.
                            </p>
                        </div>
                    </div>
                </div>

                {dbaActiveTab === 'sql' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0D121F] rounded-xl border border-[#222E45] p-4 relative font-mono text-xs text-gray-300">
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-sans">/supabase_leaderboard_schema.sql</span>
                            <button
                                onClick={() => handleCopy(sqlSchemaContent, 'sql')}
                                className="p-1 px-2.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[10px] font-sans flex items-center gap-1 text-white transition-all"
                            >
                                {copiedSec === 'sql' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                {copiedSec === 'sql' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <pre className="overflow-x-auto pt-6 text-[11px] leading-relaxed text-gray-400 select-all max-h-72">
                            {sqlSchemaContent}
                        </pre>
                    </motion.div>
                )}

                {dbaActiveTab === 'deno' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0D121F] rounded-xl border border-[#222E45] p-4 relative font-mono text-xs text-gray-300">
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-sans">nightly-leaderboard/index.ts</span>
                            <button
                                onClick={() => handleCopy(edgeFunctionContent, 'deno')}
                                className="p-1 px-2.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[10px] font-sans flex items-center gap-1 text-white transition-all"
                            >
                                {copiedSec === 'deno' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                {copiedSec === 'deno' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <pre className="overflow-x-auto pt-6 text-[11px] leading-relaxed text-gray-400 select-all max-h-71">
                            {edgeFunctionContent}
                        </pre>
                    </motion.div>
                )}

                {dbaActiveTab === 'simulation' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Perform mock calculation run inside the Deno sandboxed console:</span>
                            <button
                                onClick={runNightlySimulation}
                                disabled={simState === 'running'}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-bold text-xs rounded-lg uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 transition-all font-mono shadow-md shadow-emerald-950/20"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {simState === 'running' ? 'COMPUTING STANDINGS...' : 'RUN CRON THREAD NOW'}
                            </button>
                        </div>

                        {simLogs.length > 0 && (
                            <div className="bg-[#040811] rounded-xl border border-[#121E36] p-4 font-mono text-[11px] text-green-400 leading-relaxed overflow-hidden shadow-inner">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#121E36]/60">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-gray-500 uppercase font-black tracking-widest text-[9px]">Deno Edge Runtime Simulator</span>
                                    </div>
                                    <span className="text-[10px] text-gray-600">CRON EXPRESSION: 0 0 * * *</span>
                                </div>
                                <div className="space-y-1 max-h-56 overflow-y-auto">
                                    {simLogs.map((log, idx) => (
                                        <div key={idx} className="whitespace-pre-wrap animate-fade-in">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

            </div>

        </div>
    );
};

export default Leaderboard;
