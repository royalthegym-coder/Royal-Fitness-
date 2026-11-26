import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Activity, Globe, Zap, Cpu, ScanFace, CheckCircle, Database } from 'lucide-react';

export default function OmnipresenceCore() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState("CALIBRATING SPATIAL DIMENSIONS");
    
    // A canvas to generate a cool infinite space / size effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;

        const handleResize = () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', handleResize);

        class Node {
            x: number;
            y: number;
            z: number;
            vx: number;
            vy: number;
            
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.z = Math.random() * 200 + 1; // Used for scale and parallax to give deep space effect
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
            }

            update() {
                this.x += this.vx * (200 / this.z);
                this.y += this.vy * (200 / this.z);
                
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
                this.z -= 0.1;
                if(this.z <= 0) {
                    this.z = 200;
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                }
            }

            draw() {
                if(!ctx) return;
                const scale = 200 / this.z;
                const alpha = Math.min(1, scale * 0.3);
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, scale * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
                ctx.fill();
            }
        }

        const nodes = Array.from({ length: 150 }, () => new Node());

        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trailing effect
            ctx.fillRect(0, 0, width, height);
            
            nodes.forEach(node => {
                node.update();
                node.draw();
            });

            // Connect lines
            ctx.beginPath();
            for(let i=0; i<nodes.length; i++) {
                for(let j=i+1; j<nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if(dist < 100) {
                        const alpha = 1 - (dist/100);
                        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.3})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                    }
                }
            }
            ctx.stroke();

            requestAnimationFrame(animate);
        };
        
        animate();
        
        const textTimers = [
            setTimeout(() => setStatus("SPATIAL MATRIX EXPANDED 10,000%"), 2000),
            setTimeout(() => setStatus("INFINITE Fitness Future CANVAS ACTIVE"), 4000),
            setTimeout(() => setStatus("Fitness Future OMNIPRESENCE ONLINE"), 6000),
        ];

        return () => {
            window.removeEventListener('resize', handleResize);
            textTimers.forEach(clearTimeout);
        };
    }, []);

    return (
        <div className="w-full h-full min-h-[calc(100vh-100px)] relative overflow-hidden bg-black text-white font-mono animate-fade-in flex flex-col p-10">
            {/* The infinite canvas background */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" />
            
            <div className="relative z-10 flex flex-col h-full space-y-12 w-full max-w-[1920px] mx-auto">
                <div className="flex justify-between items-start">
                    <div className="space-y-4">
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 via-purple-500 to-cyan-500 tracking-[0.2em] uppercase italic drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                            Omnipresence Core
                        </h1>
                        <p className="text-sm tracking-[0.5em] text-cyan-400 uppercase font-bold flex items-center gap-4">
                            <Activity className="w-4 h-4 animate-pulse" />
                            {status}
                        </p>
                    </div>
                    <div className="bg-black/60 border border-cyan-500/30 p-6 rounded-3xl backdrop-blur-xl flex gap-10 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Spatial Bandwidth</p>
                            <p className="text-3xl font-bold text-white">4.8 Pb/s</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Node Horizons</p>
                            <p className="text-3xl font-bold text-fuchsia-400">∞ Infinite</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 w-full flex-grow">
                    <div className="bg-black/40 border border-white/5 hover:border-cyan-500/50 transition-all p-8 rounded-[3rem] backdrop-blur-md flex flex-col justify-between group relative overflow-hidden h-[400px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Globe className="w-16 h-16 text-cyan-400 mb-6" />
                        <div>
                            <h3 className="text-2xl font-bold mb-3 tracking-widest uppercase">Global Gym Network</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">Manage spatial footprints across infinite geographic coordinates. Expand capacity beyond physical limits.</p>
                            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-widest uppercase">
                                <CheckCircle className="w-4 h-4" /> Dimension Sync Active
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 hover:border-fuchsia-500/50 transition-all p-8 rounded-[3rem] backdrop-blur-md flex flex-col justify-between group relative overflow-hidden h-[400px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Database className="w-16 h-16 text-fuchsia-400 mb-6" />
                        <div>
                            <h3 className="text-2xl font-bold mb-3 tracking-widest uppercase">Exa-Scale Storage</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">Fitness Future uses molecular DNA-based data encoding to provide limitless application space and memory.</p>
                            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold tracking-widest uppercase">
                                <Zap className="w-4 h-4" /> Capacity: Unlimited
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 hover:border-emerald-500/50 transition-all p-8 rounded-[3rem] backdrop-blur-md flex flex-col justify-between group relative overflow-hidden h-[400px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Network className="w-16 h-16 text-emerald-400 mb-6" />
                        <div>
                            <h3 className="text-2xl font-bold mb-3 tracking-widest uppercase">Multi-Verse Topology</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">Create infinite parallel digital instances of your gym for metaverse, AR, and VR simulations.</p>
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                                <Activity className="w-4 h-4" /> Topology Expanded
                            </div>
                        </div>
                    </div>

                     <div className="bg-black/40 border border-white/5 hover:border-amber-500/50 transition-all p-8 rounded-[3rem] backdrop-blur-md flex flex-col justify-between group relative overflow-hidden h-[400px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Cpu className="w-16 h-16 text-amber-400 mb-6" />
                        <div>
                            <h3 className="text-2xl font-bold mb-3 tracking-widest uppercase">God-Tier Compute</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">Distribute AI processing overhead across the universal Fitness Future computational grid.</p>
                            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-widest uppercase">
                                <ScanFace className="w-4 h-4" /> Compute Maximum
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border-t border-white/10 pt-8 mt-auto flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest">
                    <span>Fitness Future </span>
                    <span>Application Dimension Limits: Removed</span>
                    <span>System Status: Omnipresent</span>
                </div>
            </div>
        </div>
    );
}
