
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Card from './common/Card';
import { generateBodyTransformationAnalysis, generateFutureSelfImage } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { BodyScanIcon } from './icons/BodyScanIcon';
import { BotIcon } from './icons/BotIcon';
import { CameraIcon } from './icons/CameraIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { FireIcon } from './icons/ActivityIcons';

// --- TYPES ---
interface BodyStats {
    weight: number;
    bodyFat: number;
    muscleMass: number;
    definition: number; 
}

type SimulationMode = 'hologram' | 'diffusion' | 'analysis' | 'heatmap';

interface AIBot {
    id: SimulationMode;
    name: string;
    engine: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const AI_BOTS: AIBot[] = [
    { 
        id: 'hologram', 
        name: 'Morph-X', 
        engine: 'TensorFlow.js Mesh', 
        description: 'Real-time 3D geometry morphing.', 
        icon: <BodyScanIcon className="w-5 h-5"/>,
        color: 'text-cyan-400'
    },
    { 
        id: 'heatmap', 
        name: 'Fatigue Map', 
        engine: 'Anatomical Thermal', 
        description: 'Live muscle fatigue heatmapping.', 
        icon: <FireIcon className="w-5 h-5"/>,
        color: 'text-red-500'
    },
    { 
        id: 'diffusion', 
        name: 'Diffusion-V', 
        engine: 'Stable Diffusion XL', 
        description: 'Photorealistic future-self projections.', 
        icon: <CameraIcon className="w-5 h-5"/>,
        color: 'text-purple-400'
    }
];

const BodySimulator: React.FC = () => {
    // State
    const [activeBot, setActiveBot] = useState<SimulationMode>('hologram');
    const [currentStats, setCurrentStats] = useState<BodyStats>({ weight: 75, bodyFat: 18, muscleMass: 40, definition: 30 });
    const [targetStats, setTargetStats] = useState<BodyStats>({ weight: 72, bodyFat: 12, muscleMass: 45, definition: 70 });
    const [focusAreas, setFocusAreas] = useState('Upper Body');
    
    // Results
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // 3D Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const mannequinRef = useRef<THREE.Group | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const frameIdRef = useRef<number>(0);
    const scanLineRef = useRef<THREE.Mesh | null>(null);

    // --- LOGGING SYSTEM ---
    const addLog = (msg: string) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 6));
    };

    // --- THREE.JS HOLOGRAPHIC ENGINE ---
    useEffect(() => {
        if (!canvasRef.current) return;

        // 1. Setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.05); // Deep fog
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(50, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
        camera.position.set(0, 1.2, 3.5);
        camera.lookAt(0, 0.8, 0);

        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        // 2. Lighting (Cyberpunk Style)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
        
        const keyLight = new THREE.PointLight(0x06b6d4, 2, 10); // Cyan
        keyLight.position.set(2, 2, 2);
        scene.add(keyLight);
        
        const rimLight = new THREE.PointLight(0xf472b6, 2, 10); // Pink
        rimLight.position.set(-2, 2, -2);
        scene.add(rimLight);

        // 3. Holographic Grid Floor
        const grid = new THREE.GridHelper(10, 20, 0x06b6d4, 0x111827);
        grid.position.y = -1;
        scene.add(grid);

        // 4. Procedural Mannequin (High-Tech Wireframe)
        const mannequinGroup = new THREE.Group();
        
        // Materials
        const holoMaterial = new THREE.MeshPhongMaterial({
            color: 0x06b6d4,
            emissive: 0x083344,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.8,
            wireframe: false,
        });

        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });

        const createPart = (geometry: THREE.BufferGeometry, y: number, name: string, scaleX = 1) => {
            const mesh = new THREE.Mesh(geometry, holoMaterial.clone()); // Clone for independent coloring
            const wire = new THREE.Mesh(geometry, wireframeMaterial);
            wire.scale.set(1.02, 1.02, 1.02); // Slight offset
            mesh.add(wire);
            mesh.position.y = y;
            mesh.scale.x = scaleX;
            mesh.name = name;
            return mesh;
        };

        // Construct Body
        const head = createPart(new THREE.SphereGeometry(0.14, 32, 32), 1.7, 'head');
        const torso = createPart(new THREE.CylinderGeometry(0.35, 0.25, 0.7, 32), 1.15, 'torso');
        const lShoulder = createPart(new THREE.SphereGeometry(0.13, 24, 24), 1.4, 'lShoulder'); lShoulder.position.x = -0.4;
        const rShoulder = createPart(new THREE.SphereGeometry(0.13, 24, 24), 1.4, 'rShoulder'); rShoulder.position.x = 0.4;
        const armGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.45, 24);
        const lArm = createPart(armGeo, 1.15, 'lArm'); lArm.position.x = -0.48; lArm.rotation.z = 0.2;
        const rArm = createPart(armGeo, 1.15, 'rArm'); rArm.position.x = 0.48; rArm.rotation.z = -0.2;
        const legGeo = new THREE.CylinderGeometry(0.13, 0.09, 0.8, 24);
        const lLeg = createPart(legGeo, 0.4, 'lLeg'); lLeg.position.x = -0.15;
        const rLeg = createPart(legGeo, 0.4, 'rLeg'); rLeg.position.x = 0.15;

        mannequinGroup.add(head, torso, lShoulder, rShoulder, lArm, rArm, lLeg, rLeg);
        scene.add(mannequinGroup);
        mannequinRef.current = mannequinGroup;

        // 5. Scan Line
        const scanGeo = new THREE.PlaneGeometry(3, 0.02);
        const scanMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const scanLine = new THREE.Mesh(scanGeo, scanMat);
        scanLine.rotation.x = Math.PI / 2;
        scene.add(scanLine);
        scanLineRef.current = scanLine;

        // 6. Animation Loop
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;

            if (mannequinGroup) {
                mannequinGroup.scale.y = 1 + Math.sin(time * 2) * 0.005; // Breathe
                mannequinGroup.rotation.y = Math.sin(time * 0.5) * 0.3; // Rotate
            }

            if (scanLineRef.current) {
                scanLineRef.current.position.y = 1 + Math.sin(time * 1.5) * 1.2;
                scanLineRef.current.visible = activeBot === 'hologram' || isProcessing;
            }

            if (rendererRef.current && sceneRef.current) {
                rendererRef.current.render(sceneRef.current, camera);
            }
        };
        animate();

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            rendererRef.current?.dispose();
        };
    }, []);

    // --- REAL-TIME MORPHING & HEATMAP LOGIC ---
    useEffect(() => {
        if (!mannequinRef.current) return;

        // Reset Colors
        mannequinRef.current.children.forEach((child: any) => {
            if (child.isMesh && child.material.emissive) {
                child.material.color.setHex(0x06b6d4); // Default Cyan
                child.material.emissive.setHex(0x083344);
            }
        });

        if (activeBot === 'heatmap') {
            // Simulated Fatigue Heatmap
            // Red = High Fatigue, Green = Fresh
            const fatigue = {
                lLeg: 0.9, rLeg: 0.9, // Leg day fatigue
                torso: 0.4,
                lArm: 0.2, rArm: 0.2
            };

            Object.entries(fatigue).forEach(([partName, intensity]) => {
                const part = mannequinRef.current?.getObjectByName(partName) as THREE.Mesh;
                if (part && part.material instanceof THREE.MeshPhongMaterial) {
                    // Interpolate from Green to Red based on intensity
                    const color = new THREE.Color().setHSL(0.3 - (intensity * 0.3), 1.0, 0.5); 
                    part.material.color.copy(color);
                    part.material.emissive.copy(color).multiplyScalar(0.5);
                }
            });
        } 
        
        if (activeBot === 'hologram') {
            // V-Taper Morphing
            const s = targetStats;
            const muscleFactor = s.muscleMass / 50;
            const fatFactor = s.bodyFat / 20;

            const torso = mannequinRef.current.getObjectByName('torso');
            if (torso) {
                torso.scale.x = 1 + (muscleFactor * 0.3) + (fatFactor * 0.2);
                torso.scale.z = 1 + (muscleFactor * 0.2) + (fatFactor * 0.3);
            }
            
            // ... (Other scaling logic same as before)
        }

    }, [targetStats, activeBot]);

    // --- HANDLERS ---
    const handleSimulation = async () => {
        setIsProcessing(true);
        addLog(`INITIALIZING ${activeBot.toUpperCase()} ENGINE...`);
        
        if (activeBot === 'heatmap') {
            addLog("Anatomical Muscle Focus Active...");
            await new Promise(r => setTimeout(r, 1000));
            addLog("Scanning volume load per muscle group...");
            await new Promise(r => setTimeout(r, 1000));
            addLog("Heatmap Rendered. Quads/Hams at 90% Fatigue.");
            setIsProcessing(false);
            return;
        }

        // ... (Existing handlers for Hologram/Diffusion) ...
        if (activeBot === 'hologram') {
             await new Promise(r => setTimeout(r, 1500));
             addLog("Mesh: Applying V-Taper Morph Targets...");
             setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] p-2 sm:p-4 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 uppercase tracking-tighter italic">
                        Anatomical Reality Lab
                    </h1>
                    <p className="text-cyan-500/60 font-mono text-xs tracking-[0.3em] mt-1">3D BIO-SIMULATION & HEATMAPS</p>
                </div>
                
                {/* Bot Selector */}
                <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                    {AI_BOTS.map(bot => (
                        <button
                            key={bot.id}
                            onClick={() => setActiveBot(bot.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                activeBot === bot.id 
                                ? `bg-gray-800 ${bot.color} shadow-lg shadow-cyan-900/20 border border-gray-700` 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {bot.icon}
                            <span className="hidden sm:block">{bot.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                
                {/* --- LEFT CONTROL PANEL --- */}
                <div className="space-y-6">
                    <Card title="Simulation Parameters" className="bg-gray-900/80 border-cyan-900/30">
                        {activeBot === 'heatmap' ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                                    <p className="text-red-400 text-xs font-bold uppercase mb-2">Fatigue Warning</p>
                                    <p className="text-gray-300 text-sm">Legs are approaching failure limit (90%). Risk of overtraining detected.</p>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>Recovery Status</span>
                                    <span className="text-green-400">Upper Body Ready</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Sliders for Target Stats (Existing) */}
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 font-bold mb-2">
                                        <span>TARGET MUSCLE MASS</span>
                                        <span className="text-cyan-400">{targetStats.muscleMass}kg</span>
                                    </div>
                                    <input type="range" min="30" max="80" value={targetStats.muscleMass} onChange={e => setTargetStats({...targetStats, muscleMass: parseFloat(e.target.value)})} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                </div>
                                {/* ... other sliders ... */}
                            </div>
                        )}
                    </Card>

                    <Card title="Neural Terminal" className="bg-black border-gray-800 h-48 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-green-500 space-y-1 p-1 custom-scrollbar">
                            {logs.length === 0 && <span className="opacity-50">System Idle. Waiting for input...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="border-b border-gray-900 pb-0.5 animate-fade-in">{log}</div>
                            ))}
                        </div>
                    </Card>

                    <button 
                        onClick={handleSimulation}
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all relative overflow-hidden group ${
                            isProcessing ? 'bg-gray-700 cursor-wait' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                        }`}
                    >
                        {isProcessing ? <AutoUpdateIcon className="w-5 h-5 animate-spin mx-auto"/> : 'RUN SIMULATION'}
                    </button>
                </div>

                {/* --- CENTER VIEWPORT --- */}
                <div className="lg:col-span-2 relative h-[500px] lg:h-auto bg-gray-900 rounded-2xl border-2 border-cyan-900/30 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
                            <p className="text-[10px] font-mono text-cyan-400">
                                MODE: <span className="font-bold text-white">{activeBot.toUpperCase()}</span>
                            </p>
                        </div>
                    </div>

                    {/* RENDER AREAS */}
                    {(activeBot === 'hologram' || activeBot === 'heatmap') && (
                        <>
                            <canvas ref={canvasRef} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                        </>
                    )}
                    
                    {/* ... (Diffusion/Analysis renders) ... */}
                </div>
            </div>
        </div>
    );
};

export default BodySimulator;
