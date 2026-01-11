
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Card from './common/Card';
import { generateBodyTransformationAnalysis } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { BodyScanIcon } from './icons/BodyScanIcon';

interface BodyStats {
    weight: number;
    bodyFat: number;
    muscleMass: number;
}

const BodySimulator: React.FC = () => {
    const [currentStats, setCurrentStats] = useState<BodyStats>({ weight: 80, bodyFat: 20, muscleMass: 50 });
    const [targetStats, setTargetStats] = useState<BodyStats>({ weight: 75, bodyFat: 12, muscleMass: 55 });
    const [focusAreas, setFocusAreas] = useState('Upper Body');
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [viewMode, setViewMode] = useState<'current' | 'target'>('current');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const mannequinRef = useRef<THREE.Group | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const frameIdRef = useRef<number>(0);

    // --- THREE.JS INIT ---
    useEffect(() => {
        if (!canvasRef.current) return;

        // 1. Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111827); // Dark gray bg
        // Add subtle grid
        const grid = new THREE.GridHelper(20, 20, 0x4b5563, 0x1f2937);
        scene.add(grid);
        sceneRef.current = scene;

        // 2. Camera
        const camera = new THREE.PerspectiveCamera(50, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
        camera.position.set(0, 1.5, 4);
        camera.lookAt(0, 1, 0);

        // 3. Renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
        rendererRef.current = renderer;

        // 4. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0x3b82f6, 1); // Blue-ish tech light
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);
        const rimLight = new THREE.PointLight(0xf59e0b, 0.8); // Amber rim light
        rimLight.position.set(-5, 3, -5);
        scene.add(rimLight);

        // 5. Procedural Mannequin Construction
        const mannequinGroup = new THREE.Group();
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x60a5fa, // Light blue
            metalness: 0.2,
            roughness: 0.1,
            transmission: 0.6, // Glass-like
            thickness: 0.5,
            wireframe: false
        });
        const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, wireframe: true, opacity: 0.3, transparent: true });

        // Helper to create body part
        const createPart = (geo: THREE.BufferGeometry, y: number, name: string) => {
            const mesh = new THREE.Mesh(geo, material);
            const wire = new THREE.Mesh(geo, wireframeMat);
            mesh.add(wire);
            mesh.position.y = y;
            mesh.name = name;
            mesh.castShadow = true;
            return mesh;
        };

        // Torso (Box/Cylinder hybrid feel)
        const torsoGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.7, 16);
        const torso = createPart(torsoGeo, 1.2, 'torso');
        mannequinGroup.add(torso);

        // Head
        const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const head = createPart(headGeo, 1.75, 'head');
        mannequinGroup.add(head);

        // Shoulders
        const shoulderGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const lShoulder = createPart(shoulderGeo, 1.45, 'lShoulder');
        lShoulder.position.x = -0.4;
        mannequinGroup.add(lShoulder);
        const rShoulder = createPart(shoulderGeo, 1.45, 'rShoulder');
        rShoulder.position.x = 0.4;
        mannequinGroup.add(rShoulder);

        // Arms (Upper)
        const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.4, 12);
        const lArm = createPart(armGeo, 1.25, 'lArm');
        lArm.position.x = -0.45; lArm.rotation.z = 0.2;
        mannequinGroup.add(lArm);
        const rArm = createPart(armGeo, 1.25, 'rArm');
        rArm.position.x = 0.45; rArm.rotation.z = -0.2;
        mannequinGroup.add(rArm);

        // Legs (Upper)
        const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 12);
        const lLeg = createPart(legGeo, 0.6, 'lLeg');
        lLeg.position.x = -0.15;
        mannequinGroup.add(lLeg);
        const rLeg = createPart(legGeo, 0.6, 'rLeg');
        rLeg.position.x = 0.15;
        mannequinGroup.add(rLeg);

        scene.add(mannequinGroup);
        mannequinRef.current = mannequinGroup;

        // 6. Animation Loop
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            if (mannequinRef.current) {
                mannequinRef.current.rotation.y += 0.005; // Slow rotation
            }
            if (rendererRef.current && sceneRef.current) {
                rendererRef.current.render(sceneRef.current, camera);
            }
        };
        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(frameIdRef.current);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                const canvas = canvasRef.current;
                if(canvas) {
                    const gl = canvas.getContext('webgl');
                    gl && gl.getExtension('WEBGL_lose_context')?.loseContext();
                }
            }
            if (mannequinGroup) {
                mannequinGroup.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        object.geometry.dispose();
                        if (object.material instanceof THREE.Material) {
                            object.material.dispose();
                        }
                    }
                });
            }
        };
    }, []);

    // --- MORPHING LOGIC ---
    useEffect(() => {
        if (!mannequinRef.current) return;

        const stats = viewMode === 'current' ? currentStats : targetStats;
        
        // Base scales
        const weightFactor = stats.weight / 80; // normalized base 80kg
        const fatFactor = stats.bodyFat / 20;   // normalized base 20%
        
        // Muscle Morphing Logic
        // Less fat = slimmer waist (Torso X/Z)
        // More weight = generally wider
        
        const torso = mannequinRef.current.getObjectByName('torso');
        if (torso) {
            // Fat affects torso width significantly
            const width = 1 + (fatFactor * 0.3) + ((weightFactor - 1) * 0.2); 
            torso.scale.set(width, 1, width * 0.8);
        }

        const arms = [mannequinRef.current.getObjectByName('lArm'), mannequinRef.current.getObjectByName('rArm')];
        arms.forEach(arm => {
            if (arm) {
                // Arms rely more on "Weight" (assuming muscle gain) if fat is low
                const armBulk = 1 + ((weightFactor - 1) * 0.5) - (fatFactor * 0.1); 
                arm.scale.set(armBulk, 1, armBulk);
            }
        });

        const legs = [mannequinRef.current.getObjectByName('lLeg'), mannequinRef.current.getObjectByName('rLeg')];
        legs.forEach(leg => {
            if (leg) {
                const legBulk = 1 + ((weightFactor - 1) * 0.4);
                leg.scale.set(legBulk, 1, legBulk);
            }
        });

    }, [currentStats, targetStats, viewMode]);

    const handleRunSimulation = async () => {
        setIsSimulating(true);
        setAiAnalysis(null);
        
        // Toggle view mode to visualize change
        let toggleCount = 0;
        const interval = setInterval(() => {
            setViewMode(prev => prev === 'current' ? 'target' : 'current');
            toggleCount++;
            if (toggleCount > 5) {
                clearInterval(interval);
                setViewMode('target'); // End on target
            }
        }, 600);

        try {
            const analysis = await generateBodyTransformationAnalysis(currentStats, targetStats, focusAreas);
            setAiAnalysis(analysis);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <BodyScanIcon className="w-8 h-8 mr-3 text-cyan-400" />
                    3D Body Simulator
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                {/* Controls */}
                <div className="space-y-6">
                    <Card title="Current Metrics">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Weight (kg)</label>
                                <input type="number" value={currentStats.weight} onChange={e => setCurrentStats({...currentStats, weight: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Body Fat (%)</label>
                                <input type="range" min="5" max="40" value={currentStats.bodyFat} onChange={e => setCurrentStats({...currentStats, bodyFat: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                                <div className="text-right text-sm text-cyan-400">{currentStats.bodyFat}%</div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Target Goals">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Target Weight (kg)</label>
                                <input type="number" value={targetStats.weight} onChange={e => setTargetStats({...targetStats, weight: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Target Body Fat (%)</label>
                                <input type="range" min="5" max="40" value={targetStats.bodyFat} onChange={e => setTargetStats({...targetStats, bodyFat: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500" />
                                <div className="text-right text-sm text-green-400">{targetStats.bodyFat}%</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Focus Area</label>
                                <select value={focusAreas} onChange={e => setFocusAreas(e.target.value)} className="w-full bg-gray-700 rounded p-2 text-white">
                                    <option>Upper Body</option>
                                    <option>Lower Body</option>
                                    <option>Core</option>
                                    <option>Full Body</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <button 
                        onClick={handleRunSimulation}
                        disabled={isSimulating}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/50 flex items-center justify-center transition-all disabled:opacity-50"
                    >
                        {isSimulating ? <SparkleIcon className="w-5 h-5 mr-2 animate-spin"/> : <SparkleIcon className="w-5 h-5 mr-2"/>}
                        {isSimulating ? 'Processing Morphology...' : 'Simulate Transformation'}
                    </button>
                </div>

                {/* 3D Viewport */}
                <div className="lg:col-span-2 flex flex-col h-[600px] lg:h-auto relative">
                    <Card className="flex-grow border-2 border-cyan-500/20 bg-gray-900 overflow-hidden relative p-0">
                        <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded backdrop-blur-sm border border-gray-600">
                            <p className="text-xs text-gray-400 uppercase font-bold">Visual Mode</p>
                            <div className="flex gap-2 mt-1">
                                <button onClick={() => setViewMode('current')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'current' ? 'bg-gray-600 text-white' : 'bg-transparent text-gray-500'}`}>Current</button>
                                <button onClick={() => setViewMode('target')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${viewMode === 'target' ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-transparent text-gray-500'}`}>Target</button>
                            </div>
                        </div>
                        
                        <canvas ref={canvasRef} className="w-full h-full" />
                        
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                    </Card>

                    {/* AI Report Overlay */}
                    {aiAnalysis && (
                        <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 border border-cyan-500/50 p-4 rounded-xl backdrop-blur-md animate-fade-in shadow-2xl">
                            <h3 className="text-cyan-400 font-bold mb-2 flex items-center">
                                <BodyScanIcon className="w-5 h-5 mr-2" /> Evolution Report
                            </h3>
                            <div className="prose dark:prose-invert prose-sm max-w-none text-gray-300 max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BodySimulator;
