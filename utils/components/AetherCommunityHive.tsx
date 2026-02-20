
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from './common/Card';
import { useData } from '../../context/DataProvider';
import { 
    Network, Users, Trophy, Activity, ArrowUp, 
    Share2, Globe, Lock, Crown, Zap, 
    Fingerprint, BrainCircuit, RefreshCw, 
    ShieldCheck, Flame, Cpu, Star,
    Sparkles, Binary
} from 'lucide-react';
import { 
    ResponsiveContainer, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar, 
    Tooltip, AreaChart, Area 
} from 'recharts';
import * as THREE from 'three';
import { getComplexResponse } from '../../lib/gemini';
import { useToast } from '../../hooks/useToast';
import ConfirmationDialog from './common/ConfirmationDialog';

// --- CONSTANTS ---
const squads = [
    { id: 'iron', name: "Iron Titans", color: "text-red-500", bg: "bg-red-500", focus: "Strength & Powerlifting", members: 12 },
    { id: 'cardio', name: "Cardio Kings", color: "text-blue-500", bg: "bg-blue-500", focus: "Endurance & HIIT", members: 8 },
    { id: 'zen', name: "Zen Masters", color: "text-green-500", bg: "bg-green-500", focus: "Yoga & Flexibility", members: 15 },
    { id: 'beast', name: "Beast Mode", color: "text-amber-500", bg: "bg-amber-500", focus: "Bodybuilding", members: 20 }
];

// --- 3D NEXUS VISUALIZATION COMPONENT ---
const NexusVisualization: React.FC<{ members: any[] }> = ({ members }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
        camera.position.z = 25;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        mountRef.current.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        const memberNodes: THREE.Mesh[] = [];

        // Create nodes based on member count (clamped for visuals)
        const nodeCount = Math.max(20, Math.min(members.length, 100));
        
        for (let i = 0; i < nodeCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / nodeCount);
            const theta = Math.sqrt(nodeCount * Math.PI) * phi;
            const pos = new THREE.Vector3();
            pos.setFromSphericalCoords(12, phi, theta);

            const geometry = new THREE.SphereGeometry(0.3, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: i % 5 === 0 ? 0xf59e0b : 0x6366f1, // Gold for elites, Indigo for regulars
                emissive: i % 5 === 0 ? 0xf59e0b : 0x312e81,
                emissiveIntensity: 0.8,
                roughness: 0.2,
                metalness: 0.8
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(pos);
            sphere.userData = { id: i, name: members[i]?.name || `Node-${i}` };
            
            group.add(sphere);
            memberNodes.push(sphere);
        }

        // Connections
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.15 });
        const lines = new THREE.Group();
        
        for (let i = 0; i < memberNodes.length; i++) {
            for (let j = i + 1; j < memberNodes.length; j++) {
                if (memberNodes[i].position.distanceTo(memberNodes[j].position) < 6) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([memberNodes[i].position, memberNodes[j].position]);
                    const line = new THREE.Line(geometry, lineMaterial);
                    lines.add(line);
                }
            }
        }
        group.add(lines);

        // Lights
        const light1 = new THREE.PointLight(0xffffff, 1, 100);
        light1.position.set(10, 10, 10);
        scene.add(light1);
        const light2 = new THREE.PointLight(0x6366f1, 2, 100);
        light2.position.set(-10, -10, -10);
        scene.add(light2);

        // Interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event: MouseEvent) => {
            if (!mountRef.current) return;
            const rect = mountRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(memberNodes);

            if (intersects.length > 0) {
                document.body.style.cursor = 'pointer';
                const obj = intersects[0].object;
                obj.scale.set(2, 2, 2);
                setTooltip({
                    content: `${obj.userData.name}`,
                    x: event.clientX + 10,
                    y: event.clientY - 20
                });
            } else {
                document.body.style.cursor = 'default';
                memberNodes.forEach(n => n.scale.set(1, 1, 1));
                setTooltip(null);
            }
        };

        mountRef.current.addEventListener('mousemove', onMouseMove);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);
            group.rotation.y += 0.002;
            group.rotation.x += 0.001;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (mountRef.current) {
                mountRef.current.removeEventListener('mousemove', onMouseMove);
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [members]);

    return (
        <div ref={mountRef} className="w-full h-full relative">
            {tooltip && (
                <div 
                    className="fixed z-[9999] bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};

const AetherCommunityHive: React.FC<{ memberId?: number }> = ({ memberId }) => {
    const { members, auditLogs } = useData();
    const { addToast } = useToast();
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'squads' | 'nexus'>('leaderboard');
    const [activeNodes, setActiveNodes] = useState(members.length + 15);
    const [hiveEnergy, setHiveEnergy] = useState(88);
    const [aiSquadSuggestion, setAiSquadSuggestion] = useState<{ squad: string, reason: string } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [joiningSquad, setJoiningSquad] = useState<string | null>(null);

    const currentUser = members.find(m => m.id === memberId);

    // --- 1. SOVEREIGN XP LEADERBOARD ---
    const leaderboard = useMemo(() => {
        return [...members]
            .sort((a, b) => (b.xp || 0) - (a.xp || 0)) 
            .slice(0, 5)
            .map((m, idx) => ({
                rank: idx + 1,
                name: m.id === memberId ? "YOU (PRIME)" : m.name,
                title: m.level > 50 ? "Apex Titan" : m.level > 20 ? "Elite Knight" : "Vanguard",
                xp: m.xp || 0,
                score: m.health_score || 90,
                avatar: m.avatar
            }));
    }, [members, memberId]);

    // --- 2. HIVE RADAR DATA ---
    const radarData = useMemo(() => {
        const userH = currentUser?.health_score || 85;
        return [
            { subject: 'Symmetry', A: userH - 5, B: 80, fullMark: 100 },
            { subject: 'Neural Drive', A: userH + 2, B: 85, fullMark: 100 },
            { subject: 'Recovery', A: userH - 10, B: 75, fullMark: 100 },
            { subject: 'Volume', A: userH + 5, B: 90, fullMark: 100 },
            { subject: 'Consistency', A: userH, B: 82, fullMark: 100 },
        ];
    }, [currentUser]);

    // Live Pulse Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveNodes(prev => prev + (Math.random() > 0.5 ? 1 : -1));
            setHiveEnergy(prev => Math.min(100, Math.max(70, prev + (Math.random() * 4 - 2))));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // --- 3. NEURAL MATCHMAKING ---
    const handleFindSquad = async () => {
        setIsAnalyzing(true);
        addToast("Hive Mind: Analyzing Biological Compatibility...", "info");
        
        const prompt = `
            ACT AS HIVE INTELLIGENCE. ANALYZE ATHLETE: ${currentUser?.name}.
            LEVEL: ${currentUser?.level}, XP: ${currentUser?.xp}, HEALTH: ${currentUser?.health_score}.
            MATCH TO ONE SQUAD: [IRON TITANS, CARDIO KINGS, ZEN MASTERS, BEAST MODE].
            RETURN JSON: {"squad": "NAME", "reason": "1 PUNCHY SENTENCE"}.
        `;

        try {
            const res = await getComplexResponse(prompt);
            setAiSquadSuggestion(JSON.parse(res.replace(/```json|```/g, '').trim()));
            addToast("Match Found: Protocol Synced.", "success");
        } catch (e) {
            setAiSquadSuggestion({ squad: "Iron Titans", reason: "Your power output aligns with the elite heavy-lifters." });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const confirmJoin = () => {
        addToast(`Sovereign Handshake Complete. Welcome to ${joiningSquad}.`, "success");
        setJoiningSquad(null);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            {/* OLYMPUS HIVE HEADER */}
            <div className="bg-[#020308] p-12 rounded-[4rem] border border-indigo-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(79,70,229,0.2)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-indigo-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(99,102,241,0.5)] border border-indigo-400 group-hover:rotate-12 transition-transform duration-700">
                            <Network className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-indigo-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                    Sovereign Hive v27.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">STATUS: COLLECTIVE_SYNC_ACTIVE</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Aether <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">Hive</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                        <div className="px-10 py-5 text-center border-r border-white/5">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Live Nodes</p>
                             <p className="text-4xl font-black text-indigo-400 italic">{activeNodes}</p>
                        </div>
                        <div className="px-10 py-5 text-center">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Hive Energy</p>
                             <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                                <p className="text-4xl font-black text-white italic">{hiveEnergy}%</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="flex bg-gray-950 p-2 rounded-[2rem] border border-white/5 w-fit mx-auto backdrop-blur-xl">
                {[
                    { id: 'leaderboard', label: 'Titan Rankings', icon: <Trophy className="w-4 h-4" /> },
                    { id: 'squads', label: 'Neural Squads', icon: <Users className="w-4 h-4" /> },
                    { id: 'nexus', label: 'The Nexus', icon: <Globe className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: MAIN CONTENT */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {activeTab === 'leaderboard' && (
                         <div className="space-y-6 animate-slide-up">
                            {leaderboard[0] && (
                                <div className="bg-gradient-to-br from-indigo-500/20 to-black p-10 rounded-[4rem] border-2 border-indigo-500 relative overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.2)] group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Crown className="w-48 h-48" /></div>
                                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                        <div className="relative">
                                            <div className="w-40 h-40 rounded-full border-4 border-indigo-500 p-1 bg-black shadow-[0_0_40px_#6366f1]">
                                                <img src={leaderboard[0].avatar} className="w-full h-full rounded-full object-cover" alt="Prime" />
                                            </div>
                                            <div className="absolute -top-4 -right-4 bg-indigo-500 text-white p-3 rounded-2xl shadow-xl animate-bounce">
                                                <Crown className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <p className="text-indigo-500 font-black uppercase text-xs tracking-[0.5em] mb-2">APEX TITAN // RANK #1</p>
                                            <h3 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-4">{leaderboard[0].name}</h3>
                                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                                <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-md">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Current XP</p>
                                                    <p className="text-2xl font-black text-white italic">{(leaderboard[0].xp || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-md">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Global Tier</p>
                                                    <p className="text-2xl font-black text-indigo-400 italic">SOVEREIGN</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-4">
                                {leaderboard.slice(1).map((user, idx) => (
                                    <div key={user.rank} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-xl">
                                        <div className="flex items-center gap-8">
                                            <div className="text-4xl font-black italic text-gray-800 w-12">0{user.rank}</div>
                                            <img src={user.avatar} className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg grayscale group-hover:grayscale-0 transition-all" alt="runner" />
                                            <div>
                                                <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">{user.name}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">RANKED: VANGUARD ELITE</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white italic">{(user.xp || 0).toLocaleString()}</p>
                                            <p className="text-[9px] text-indigo-500 font-black uppercase">EXPERIENCE POINTS</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'squads' && (
                        <div className="space-y-8 animate-slide-up">
                            {/* AI Matchmaker Card */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-black p-10 rounded-[3.5rem] border border-indigo-500/30 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-10 opacity-10"><BrainCircuit className="w-48 h-48 text-indigo-400" /></div>
                                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                    <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)]">
                                        <Zap className="w-12 h-12 text-white fill-current" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2">Neural Squad Finder</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed italic mb-6">
                                            "Our AI scans your recent workout velocity, volume, and recovery biometrics to match you with the optimal squad node."
                                        </p>
                                        <button 
                                            onClick={handleFindSquad}
                                            disabled={isAnalyzing}
                                            className="bg-white text-black font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all flex items-center gap-3 mx-auto md:mx-0 shadow-2xl disabled:opacity-50"
                                        >
                                            {isAnalyzing ? <RefreshCw className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                            {isAnalyzing ? 'SYNCHRONIZING...' : 'SCAN MY BIO-DATA'}
                                        </button>
                                    </div>
                                </div>

                                {aiSquadSuggestion && (
                                    <div className="mt-10 p-8 bg-black/40 rounded-[2.5rem] border border-indigo-500/30 animate-scale-in">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="px-3 py-1 bg-green-500 text-black text-[9px] font-black uppercase rounded">Optimal Match Found</div>
                                        </div>
                                        <h4 className="text-3xl font-black text-white italic uppercase mb-2">{aiSquadSuggestion.squad}</h4>
                                        <p className="text-indigo-200 italic">"{aiSquadSuggestion.reason}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {squads.map(s => (
                                    <Card key={s.id} className="bg-[#080808] border-white/5 p-8 rounded-[3rem] hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className={`p-4 rounded-2xl bg-white/5 ${s.color}`}>
                                                <Flame className="w-8 h-8" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-gray-500 uppercase font-black">Active Units</p>
                                                <p className="text-2xl font-black text-white italic">{s.members}</p>
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tight">{s.name}</h4>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-8">{s.focus}</p>
                                        <button 
                                            onClick={() => setJoiningSquad(s.name)}
                                            className="w-full mt-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:bg-white group-hover:text-black transition-all"
                                        >
                                            Initiate Handshake
                                        </button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'nexus' && (
                        <Card className="bg-black border-white/10 h-[700px] rounded-[3.5rem] p-0 relative overflow-hidden shadow-2xl">
                           <NexusVisualization members={members} />
                           <div className="absolute top-8 left-8 z-20 pointer-events-none">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">The Nexus</h3>
                                <p className="text-xs text-gray-500 font-mono tracking-widest mt-1 uppercase">Live Node Visualization (WebGL)</p>
                           </div>
                        </Card>
                    )}
                </div>

                {/* RIGHT: TELEMETRY & ANALYTICS */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="Hive Metric" className="bg-gray-950 border-white/10 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Binary className="w-32 h-32 text-indigo-400" /></div>
                        <div className="h-64 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                                    <Radar name="You" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.5} />
                                    <Radar name="Elite Avg" dataKey="B" stroke="#444" strokeWidth={1} fill="transparent" strokeDasharray="4 4" />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-8 flex justify-center gap-6">
                             <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div><span className="text-[9px] font-black text-gray-500 uppercase">You</span></div>
                             <div className="flex items-center gap-2"><div className="w-2 h-2 border border-gray-600 border-dashed rounded-full"></div><span className="text-[9px] font-black text-gray-600 uppercase">Hive Avg</span></div>
                        </div>
                    </Card>

                    <Card title="Live Activity Stream" className="bg-[#050505] border-white/10 p-8 rounded-[3.5rem] h-[360px] flex flex-col justify-between">
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                            {auditLogs.slice(0, 5).map((log, idx) => (
                                <div key={log.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                                        <div className="w-px h-full bg-white/5 my-1"></div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-600 font-mono mb-1">{log.timestamp}</p>
                                        <p className="text-xs text-gray-300 font-medium group-hover:text-indigo-300 transition-colors">{log.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-6 border-t border-white/5">
                            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">
                                View Full Nexus Log
                            </button>
                        </div>
                    </Card>

                    <div className="p-8 bg-green-900/10 border border-green-500/20 rounded-[3rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><ShieldCheck className="w-12 h-12 text-green-500" /></div>
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Contribution Status</p>
                        <p className="text-white text-sm italic font-medium leading-relaxed">
                            "Your high stability score on Bench Press has contributed <strong className="text-green-400">+0.2%</strong> to the Hive's collective power index."
                        </p>
                    </div>
                </div>
            </div>

            {joiningSquad && (
                <ConfirmationDialog 
                    isOpen={!!joiningSquad}
                    onClose={() => setJoiningSquad(null)}
                    onConfirm={confirmJoin}
                    title="Initialize Handshake?"
                    message={`This will link your bio-data to the [${joiningSquad.toUpperCase()}] network. All performance shards will be shared within the squad.`}
                />
            )}
        </div>
    );
};

export default AetherCommunityHive;
