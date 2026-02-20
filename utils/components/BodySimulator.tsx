
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Card from './common/Card';
import { generateBodyTransformationAnalysis, generateFutureSelfImage } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { BodyScanIcon } from './icons/BodyScanIcon';
import { BotIcon } from './icons/BotIcon';
import { CameraIcon } from './icons/CameraIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { ScanFace, Activity, X, Crosshair, Zap, Cpu, Maximize, RotateCcw, BrainCircuit, ImageIcon, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataProvider';

interface BodyStats {
    weight: number;
    bodyFat: number;
    muscleMass: number;
    definition: number;
}

type Mode = 'scanner' | 'hologram' | 'analysis' | 'vision';

const BodySimulator: React.FC = () => {
    const { liveHealthData } = useData();
    const [mode, setMode] = useState<Mode>('hologram'); 
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    // User Stats State
    const [currentStats, setCurrentStats] = useState({ weight: 75, bodyFat: 18 });
    const [targetStats, setTargetStats] = useState<BodyStats>({ 
        weight: 75, 
        bodyFat: 12, 
        muscleMass: 45, 
        definition: 80 
    });
    
    // AI Analysis State
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    // AI Visual Generation State (Future Self Original Feature)
    const [futureImage, setFutureImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const [logs, setLogs] = useState<string[]>([]);

    const mountRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const mannequinRef = useRef<THREE.Group | null>(null);
    const frameIdRef = useRef<number>(0);

    const addLog = (msg: string) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 5));
    };

    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
            setMode('scanner');
            addLog("BIO-SENSORS ONLINE.");
        } catch (err) {
            setCameraError("Camera Access Denied. Using Synthetic Simulation.");
            setMode('hologram');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        setIsScanning(false);
    };

    const performBioScan = () => {
        if (!isCameraActive) return;
        setIsScanning(true);
        setScanProgress(0);
        addLog("DEEP TISSUE AUDIT INITIATED...");

        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    completeScan();
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    const completeScan = () => {
        setIsScanning(false);
        stopCamera();
        addLog("RECONSTRUCTION COMPLETE.");
        setMode('hologram');
    };

    // --- THREE.JS ENGINE ---
    useEffect(() => {
        if (mode !== 'hologram' || !mountRef.current) return;

        if (rendererRef.current) {
            rendererRef.current.dispose();
            mountRef.current.innerHTML = '';
        }

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 1.2, 5);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const group = new THREE.Group();
        
        // Holographic Material
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.5,
            roughness: 0,
            metalness: 1,
            transmission: 0.8,
            transparent: true,
            opacity: 0.4,
            wireframe: false
        });

        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });

        const createPart = (geo: THREE.BufferGeometry, y: number, name: string) => {
            const mesh = new THREE.Mesh(geo, material);
            const wire = new THREE.Mesh(geo, wireMaterial);
            mesh.add(wire);
            mesh.position.y = y;
            mesh.name = name;
            return mesh;
        };

        const head = createPart(new THREE.IcosahedronGeometry(0.25, 2), 1.8, 'head');
        const torso = createPart(new THREE.CylinderGeometry(0.4, 0.3, 1.0, 12), 1.0, 'torso');
        const shoulders = createPart(new THREE.BoxGeometry(1.3, 0.2, 0.4), 1.4, 'shoulders');
        
        const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.8, 8);
        const lArm = createPart(armGeo, 0, 'lArm'); lArm.position.set(-0.65, 1.0, 0); lArm.rotation.z = 0.2;
        const rArm = createPart(armGeo, 0, 'rArm'); rArm.position.set(0.65, 1.0, 0); rArm.rotation.z = -0.2;

        const legGeo = new THREE.CylinderGeometry(0.15, 0.1, 1.2, 8);
        const lLeg = createPart(legGeo, 0, 'lLeg'); lLeg.position.set(-0.25, 0.4, 0);
        const rLeg = createPart(legGeo, 0, 'rLeg'); rLeg.position.set(0.25, 0.4, 0);

        group.add(head, torso, shoulders, lArm, rArm, lLeg, rLeg);
        
        // Floor Grid
        const grid = new THREE.GridHelper(10, 20, 0x06b6d4, 0x111111);
        grid.position.y = -0.2;
        scene.add(grid);

        scene.add(group);
        mannequinRef.current = group;

        const animate = () => {
            const time = Date.now() * 0.001;
            group.rotation.y = Math.sin(time * 0.2) * 0.2; 
            renderer.render(scene, camera);
            frameIdRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            renderer.dispose();
        };
    }, [mode]);

    useEffect(() => {
        if (!mannequinRef.current) return;
        const muscleFactor = 1 + ((targetStats.muscleMass - 30) / 100);
        const torso = mannequinRef.current.getObjectByName('torso');
        if (torso) {
            torso.scale.x = muscleFactor;
            torso.scale.z = muscleFactor * 0.8;
        }
        const shoulders = mannequinRef.current.getObjectByName('shoulders');
        if (shoulders) shoulders.scale.x = muscleFactor * 1.1;
    }, [targetStats, mode]);

    // --- AI HANDLERS ---

    const handleAiAnalysis = async () => {
        setIsAiLoading(true);
        setAiReport(null);
        setMode('analysis');
        try {
            const report = await generateBodyTransformationAnalysis(currentStats, targetStats, "Optimal Hypertrophy");
            setAiReport(report);
        } catch (e) {
            setAiReport("<h3>Neural Connection Lost</h3>");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleGenerateVisual = async () => {
        setIsGeneratingImage(true);
        setFutureImage(null);
        setMode('vision');
        addLog("GENERATING VISUAL PREDICTION...");
        
        try {
            const prompt = `A cinematic, hyper-realistic fitness portrait of a person with: ${targetStats.weight}kg bodyweight, ${targetStats.bodyFat}% body fat, ${targetStats.muscleMass}kg muscle mass. High definition, dramatic gym lighting, 8k resolution.`;
            const image = await generateFutureSelfImage("Current: Average", prompt);
            setFutureImage(image);
            addLog("VISUAL RENDERING COMPLETE.");
        } catch (e) {
            addLog("VISUAL GENERATION FAILED.");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] min-h-[600px] relative rounded-[3rem] overflow-hidden">
            <div className="absolute top-8 left-8 z-30 flex flex-col gap-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-cyan-500/30 shadow-lg pointer-events-auto">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3 animate-pulse" /> BIO-LOGIC SYNC
                    </p>
                    <p className="text-white font-black text-lg italic mt-1">
                        {mode === 'scanner' ? 'SENSING...' : mode === 'hologram' ? 'MODELING' : mode === 'vision' ? 'RENDERING' : 'ANALYZING'}
                    </p>
                </div>
            </div>

            {/* SCANNER MODE */}
            {mode === 'scanner' && (
                <div className="absolute inset-0 bg-black z-20 flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 border-[20px] border-black/80"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[550px] border-2 border-cyan-500/40 rounded-[3rem]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_30px_cyan] animate-scan"></div>
                        {isScanning && <div className="absolute bottom-[-40px] left-0 right-0 text-center text-cyan-400 font-mono text-xs">{scanProgress}% COMPLETE</div>}
                    </div>
                    <div className="absolute bottom-10 flex gap-6 z-30">
                        <button onClick={stopCamera} className="bg-gray-800 p-6 rounded-full text-white"><X/></button>
                        <button onClick={performBioScan} disabled={isScanning} className="bg-cyan-500 text-black font-black px-12 py-5 rounded-2xl uppercase tracking-widest shadow-[0_0_40px_cyan] active:scale-95">
                            {isScanning ? 'SCANNING...' : 'START BIOMETRIC SCAN'}
                        </button>
                    </div>
                </div>
            )}

            {/* VISION MODE (GEN AI IMAGE) */}
            {mode === 'vision' && (
                <div className="absolute inset-0 bg-black z-20 flex items-center justify-center p-8">
                     {isGeneratingImage ? (
                         <div className="text-center">
                             <div className="relative w-32 h-32 mx-auto mb-8">
                                 <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
                                 <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin"></div>
                                 <SparkleIcon className="absolute inset-0 m-auto w-12 h-12 text-cyan-400" />
                             </div>
                             <h3 className="text-3xl font-black text-white italic uppercase tracking-widest animate-pulse">Synthesizing Future Self</h3>
                             <p className="text-cyan-500 font-mono text-xs mt-4">Rendering {targetStats.muscleMass}kg Lean Mass Projection...</p>
                         </div>
                     ) : futureImage ? (
                         <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 group">
                             <img src={futureImage} alt="Future Self" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                             <div className="absolute bottom-10 left-10">
                                 <p className="text-cyan-400 font-black uppercase text-xs tracking-[0.5em] mb-2">AI Projection</p>
                                 <h2 className="text-4xl font-black text-white italic uppercase">Target Physique</h2>
                             </div>
                             <button onClick={() => setMode('hologram')} className="absolute top-10 right-10 p-4 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                                 <X className="w-6 h-6" />
                             </button>
                         </div>
                     ) : (
                         <div className="text-center text-gray-500">
                             <p>Generation Failed. Return to Hologram.</p>
                             <button onClick={() => setMode('hologram')} className="mt-4 text-cyan-400 underline">Back</button>
                         </div>
                     )}
                </div>
            )}

            {/* HOLOGRAM MODE */}
            <div ref={mountRef} className={`absolute inset-0 z-0 bg-black transition-opacity duration-1000 ${mode === 'hologram' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
            
            {mode === 'hologram' && (
                <div className="absolute bottom-0 left-0 w-full z-20 flex flex-col items-center">
                    <div className="w-full max-w-4xl px-6 pb-6 flex flex-col md:flex-row items-end gap-6">
                        <Card className="bg-black/80 border-white/10 p-6 rounded-[2.5rem] w-full backdrop-blur-xl shadow-2xl">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] font-black text-cyan-400 uppercase mb-3">
                                        <span>Target Muscle Mass</span>
                                        <span>{targetStats.muscleMass}kg</span>
                                    </div>
                                    <input type="range" min="30" max="60" value={targetStats.muscleMass} onChange={(e) => setTargetStats({...targetStats, muscleMass: Number(e.target.value)})} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-black text-cyan-400 uppercase mb-3">
                                        <span>Target Body Fat</span>
                                        <span>{targetStats.bodyFat}%</span>
                                    </div>
                                    <input type="range" min="5" max="30" value={targetStats.bodyFat} onChange={(e) => setTargetStats({...targetStats, bodyFat: Number(e.target.value)})} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={handleAiAnalysis} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-white/5">
                                        <BotIcon className="w-4 h-4"/> Text Analysis
                                    </button>
                                    <button onClick={handleGenerateVisual} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                        <ImageIcon className="w-4 h-4"/> Generate Photo
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* ANALYSIS TEXT MODE */}
            {mode === 'analysis' && aiReport && (
                <div className="absolute inset-0 bg-[#050505] z-30 p-12 overflow-y-auto animate-fade-in custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-12">
                         <div className="flex justify-between items-center border-b border-white/5 pb-8">
                             <h3 className="text-4xl font-black text-white italic uppercase tracking-widest">Neural Forecast</h3>
                             <button onClick={() => setMode('hologram')} className="p-4 bg-gray-900 rounded-2xl hover:bg-gray-800 transition-all text-cyan-400"><RotateCcw/></button>
                         </div>
                         <div className="prose prose-invert prose-lg text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiReport }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BodySimulator;
