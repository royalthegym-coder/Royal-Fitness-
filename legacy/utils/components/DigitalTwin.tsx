import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Activity, Shield, Zap, Orbit } from 'lucide-react';

const DigitalTwin: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Simple placeholder for 3D rendering logic
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;

      // Draw "holographic" circles
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; // Cyan
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius, radius * 0.3, angle, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(217, 70, 239, 0.5)'; // Fuchsia
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 0.8, radius * 0.8 * 0.3, -angle * 1.5, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw center core
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      angle += 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Digital <span className="text-cyan-400">Twin</span>
          </h2>
          <p className="text-cyan-500/60 font-mono text-xs uppercase tracking-[0.2em] mt-1">3D Holographic Bio-Representation</p>
        </div>
        <div className="bg-cyan-950/30 border border-cyan-500/30 px-4 py-2 rounded-lg flex items-center gap-3">
          <Orbit className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <span className="text-xs font-mono text-cyan-300">MATRIX ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Canvas Area */}
        <div className="lg:col-span-2 bg-black/60 border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden min-h-[500px] flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]"></div>
          
          {/* Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,1)] animate-scan"></div>

          <canvas 
            ref={canvasRef} 
            width={400} 
            height={400} 
            className="relative z-10"
          />

          <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-mono text-cyan-500/50">
            <span>SYS.RENDER.V34</span>
            <span>REALTIME.SYNC</span>
          </div>
        </div>

        {/* Biometric Data Panel */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-black/40 border border-gray-800 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Vitals
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Heart Rate</span>
                  <span className="text-cyan-400 font-mono">72 BPM</span>
                </div>
                <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[60%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Muscle Tension</span>
                  <span className="text-fuchsia-400 font-mono">Low</span>
                </div>
                <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-500 w-[30%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Hydration</span>
                  <span className="text-blue-400 font-mono">Optimal</span>
                </div>
                <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[85%]"></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-black/40 border border-amber-500/20 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-amber-400" />
              Structural Integrity
            </h3>
            <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-200/70 leading-relaxed">
                Minor inflammation detected in left anterior deltoid. Recommend reducing load on overhead pressing movements by 15% for the next 48 hours.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
