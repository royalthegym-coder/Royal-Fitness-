
import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { 
    Play, Pause, Wind, Thermometer, Lightbulb, Settings, 
    Volume2, Radio, Zap, Activity, Waves, X, 
    Moon, Sun, Headphones, BrainCircuit, CheckCircle,
    RefreshCw, ShieldCheck, Infinity, Signal, Speaker,
    Fan, Disc, Power
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { getComplexResponse, generateTextToSpeech, generateNeuroProtocol } from '../../../lib/core_ai';
import { decode, decodeAudioData } from '../../audio';
import { BotIcon } from '../icons/BotIcon';
import { useData } from '../../context/DataProvider';

interface TherapyMode {
    id: string;
    name: string;
    wave: string;
    freqLeft: number;
    freqRight: number;
    colorFrom: string;
    colorTo: string;
    description: string;
    icon: React.ReactNode;
    mantra?: string;
    isoPulse?: number; // Isochronic Pulse Rate (Hz)
}

const MODES: TherapyMode[] = [
    { 
        id: 'deep_repair', 
        name: 'Deep Tissue Repair', 
        wave: 'Delta (2Hz)', 
        freqLeft: 100, 
        freqRight: 102, 
        isoPulse: 2,
        colorFrom: '#020617', 
        colorTo: '#1e3a8a',   
        description: 'Slowest waves for deep sleep and HGH release.',
        icon: <Moon className="w-5 h-5 text-blue-400" />,
        mantra: "Every cell in my body is healing. My strength returns deeper than before. I am whole."
    },
    { 
        id: 'cns_reset', 
        name: 'CNS System Reset', 
        wave: 'Theta (6Hz)', 
        freqLeft: 200, 
        freqRight: 206, 
        isoPulse: 6,
        colorFrom: '#312e81', 
        colorTo: '#581c87',   
        description: 'Reduces cortisol. Best for post-heavy lifting.',
        icon: <Wind className="w-5 h-5 text-purple-400" />,
        mantra: "I am releasing the burden of effort. My mind is drifting into complete safety. I am calm."
    },
    { 
        id: 'focus_flow', 
        name: 'Zen Focus', 
        wave: 'Alpha (10Hz)', 
        freqLeft: 300, 
        freqRight: 310, 
        isoPulse: 10,
        colorFrom: '#451a03', 
        colorTo: '#b45309',   
        description: 'Calm alertness. Ideal for Yoga and Flow zones.',
        icon: <Sun className="w-5 h-5 text-amber-400" />,
        mantra: "Focus is sharp. Movement is fluid. We are in flow."
    },
    { 
        id: 'power_surge', 
        name: 'Gamma Overdrive', 
        wave: 'Gamma (40Hz)', 
        freqLeft: 400, 
        freqRight: 440, 
        isoPulse: 40,
        colorFrom: '#7f1d1d', 
        colorTo: '#ef4444',   
        description: 'Peak mental state. High intensity output.',
        icon: <Zap className="w-5 h-5 text-red-500" />,
        mantra: "Power is limitless. Energy is boundless. Dominate the lift."
    }
];

const SonicFrequencyTuner: React.FC = () => {
    const { addToast } = useToast();
    const { liveHealthData, addRoutineLog, members } = useData();
    
    // Member context
    const memberId = members[0]?.id;

    // Advanced Sound Engine Parameters
    const [solfeggioAlign, setSolfeggioAlign] = useState(true);
    const [waveType, setWaveType] = useState<'sine' | 'triangle' | 'sine-harmonic'>('sine-harmonic');
    const [ambientSurf, setAmbientSurf] = useState<'none' | 'ocean' | 'pink-cosmic' | 'brown-deep'>('ocean');

    // State
    const [activeMode, setActiveMode] = useState<TherapyMode>(MODES[1]); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.4);
    const [isIsochronic, setIsIsochronic] = useState(true); 
    const [bioSync, setBioSync] = useState(false); 
    const [timer, setTimer] = useState(900); 
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [userStateInput, setUserStateInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // IoT Simulation State
    const [activeColor, setActiveColor] = useState('#581c87'); // Chromatherapy
    const [oxygenLevel, setOxygenLevel] = useState(21); // 21% is normal
    const [hapticIntensity, setHapticIntensity] = useState(0); // 0-3
    const [podTemp, setPodTemp] = useState(22.0);

    // Audio Context Refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const isoGainRef = useRef<GainNode | null>(null);
    const lfoRef = useRef<OscillatorNode | null>(null);
    const oLfoRef = useRef<OscillatorNode | null>(null);
    const noiseSrcRef = useRef<AudioBufferSourceNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);
    const pulseRef = useRef<HTMLDivElement>(null);

    // --- BIO-SYNC AUTO-ADJUSTMENT ---
    useEffect(() => {
        if (bioSync && liveHealthData.heartRate.hrv) {
            const hrv = liveHealthData.heartRate.hrv;
            // If HRV is low (<50 indicates stress), switch to Deep Repair
            if (hrv < 50 && activeMode.id !== 'deep_repair') {
                setActiveMode(MODES[0]);
                addToast("Bio-Sync: High Stress Detected. Switching to Delta Waves.", "info");
            } 
            // If HRV is optimal (>70), switch to Alpha for focus
            else if (hrv > 70 && activeMode.id !== 'focus_flow') {
                setActiveMode(MODES[2]);
                addToast("Bio-Sync: Recovery Optimal. Switching to Alpha Waves.", "success");
            }
        }
    }, [bioSync, liveHealthData.heartRate.hrv]);

    // Update active color when mode changes
    useEffect(() => {
        setActiveColor(activeMode.colorTo);
    }, [activeMode]);

    const createNoiseBuffer = (ctx: AudioContext, type: 'pink' | 'brown' | 'white') => {
        const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'pink') {
            let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; // compensate gain
                b6 = white * 0.115926;
            }
        } else if (type === 'brown') {
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; 
            }
        }
        return buffer;
    };

    const initAudio = async () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 48000,
                latencyHint: 'playback'
            });
            audioCtxRef.current = ctx;

            // --- 0. ADVANCED MASTERING CHAIN ---
            // Master Compressor for pristine dynamic range and zero clipping
            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-24, ctx.currentTime);
            compressor.knee.setValueAtTime(30, ctx.currentTime);
            compressor.ratio.setValueAtTime(12, ctx.currentTime);
            compressor.attack.setValueAtTime(0.003, ctx.currentTime);
            compressor.release.setValueAtTime(0.25, ctx.currentTime);
            
            // Sub-Bass Exciter / Multiband EQ
            const subEq = ctx.createBiquadFilter();
            subEq.type = 'lowshelf';
            subEq.frequency.setValueAtTime(80, ctx.currentTime);
            subEq.gain.setValueAtTime(4.5, ctx.currentTime);

            const airEq = ctx.createBiquadFilter();
            airEq.type = 'highshelf';
            airEq.frequency.setValueAtTime(8000, ctx.currentTime);
            airEq.gain.setValueAtTime(2.0, ctx.currentTime);

            // Master Output Node with exponential ramp for ultra-smooth fade in
            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
            masterGain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 2.5);
            
            // Routing: Nodes -> Air EQ -> Sub EQ -> Compressor -> Master Gain -> Destination
            airEq.connect(subEq);
            subEq.connect(compressor);
            compressor.connect(masterGain);
            masterGain.connect(ctx.destination);
            masterGainRef.current = masterGain;

            // Analyser for Visuals (high res)
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 4096;
            analyser.smoothingTimeConstant = 0.88;
            masterGain.connect(analyser); // Connect master to analyser
            analyserRef.current = analyser;

            // Helper for 3D Panner (Advanced Spatial Audio HRTF mapping)
            const createPanner = (panValue: number) => {
                const panner = ctx.createPanner();
                panner.panningModel = 'HRTF';
                panner.distanceModel = 'inverse';
                panner.refDistance = 1;
                panner.maxDistance = 10000;
                panner.rolloffFactor = 1;
                
                // Position calculation for absolute lateral spread (spatial width)
                // Left = -1, Right = +1
                panner.setPosition(panValue * 3.5, Math.abs(panValue) * -0.5, panValue === 0 ? 0 : 2);
                return panner;
            };

            // Solfeggio Scale Alignment Carrier math
            let freqL = activeMode.freqLeft;
            let freqR = activeMode.freqRight;

            if (solfeggioAlign) {
                let solfeggioBase = 432; // Standard ambient
                if (activeMode.id === 'deep_repair') solfeggioBase = 174; // Pain relief and deep physical repair
                else if (activeMode.id === 'cns_reset') solfeggioBase = 417; // Undoing negative emotions / facilitation
                else if (activeMode.id === 'focus_flow') solfeggioBase = 528; // Miracle tone, cellular renewal and focus
                else if (activeMode.id === 'power_surge') solfeggioBase = 852; // Cognitive awakening and spiritual focus
                
                const gap = Math.abs(activeMode.freqRight - activeMode.freqLeft);
                freqL = solfeggioBase;
                freqR = solfeggioBase + gap;
            }

            // --- 1. BINAURAL BEATS ENGINE WITH NEXT-GEN HARMONICS ---
            const createAcousticCarrier = (frequency: number, panVal: number) => {
                const subGain = ctx.createGain();
                subGain.gain.value = 0.55; // relative mix proportion

                const oscBase = ctx.createOscillator();
                oscBase.frequency.value = frequency;
                
                if (waveType === 'triangle') {
                    oscBase.type = 'triangle';
                } else {
                    oscBase.type = 'sine';
                }
                oscBase.connect(subGain);
                oscBase.start();

                if (waveType === 'sine-harmonic') {
                    // Inject warm, perfectly mathematically aligned pythagorean overtones
                    // Second Harmonic (1 Octave up - Air/Breath)
                    const oscOct = ctx.createOscillator();
                    oscOct.frequency.value = frequency * 2;
                    oscOct.type = 'sine';
                    const gainOct = ctx.createGain();
                    gainOct.gain.value = 0.12; 
                    oscOct.connect(gainOct);
                    gainOct.connect(subGain);
                    oscOct.start();

                    // Perfect Fifth Overtone (Cerebral Harmony - Warmth/Presence)
                    const oscFifth = ctx.createOscillator();
                    oscFifth.frequency.value = frequency * 1.5;
                    oscFifth.type = 'sine';
                    const gainFifth = ctx.createGain();
                    gainFifth.gain.value = 0.08;
                    oscFifth.connect(gainFifth);
                    gainFifth.connect(subGain);
                    oscFifth.start();

                    // Third Harmonic (Bright, clear projection - Crystal Clear Resonance)
                    const oscThird = ctx.createOscillator();
                    oscThird.frequency.value = frequency * 3;
                    oscThird.type = 'sine';
                    const gainThird = ctx.createGain();
                    gainThird.gain.value = 0.04;
                    oscThird.connect(gainThird);
                    gainThird.connect(subGain);
                    oscThird.start();
                }

                const panner = createPanner(panVal);
                subGain.connect(panner);
                return { panner, oscBase };
            };

            const { panner: nodeL, oscBase: oscL } = createAcousticCarrier(freqL, -1);
            const { panner: nodeR, oscBase: oscR } = createAcousticCarrier(freqR, 1);

            // --- 2. ISOCHRONIC MODULATOR (POP-FREE, ZERO-CROSSING TRIANGLE + LPF WARMER) ---
            const isoGain = ctx.createGain();
            isoGain.gain.setValueAtTime(0.65, ctx.currentTime);
            isoGainRef.current = isoGain;
            
            nodeL.connect(isoGain);
            nodeR.connect(isoGain);
            isoGain.connect(airEq); // Connect to advanced mastering chain

            if (isIsochronic && activeMode.isoPulse) {
                const lfo = ctx.createOscillator();
                lfo.type = 'sine'; // Super smooth sine sweep for liquid isochronic pulses
                lfo.frequency.value = activeMode.isoPulse;
                
                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 0.40; // Amplitude tracking depth
                
                lfo.connect(lfoGain);
                lfoGain.connect(isoGain.gain); // waves isoGain.gain 
                lfo.start();
                lfoRef.current = lfo;

                // Modulate filter cutoff organically with isochronic pulse for fluid sound
                const pulseWarmFilter = ctx.createBiquadFilter();
                pulseWarmFilter.type = 'lowpass';
                pulseWarmFilter.frequency.setValueAtTime(2000, ctx.currentTime);
                isoGain.disconnect();
                isoGain.connect(pulseWarmFilter);
                pulseWarmFilter.connect(airEq);

                const filterLfoGain = ctx.createGain();
                filterLfoGain.gain.value = 500;
                lfo.connect(filterLfoGain);
                filterLfoGain.connect(pulseWarmFilter.frequency);
            }

            // --- 3. DYNAMIC ATMOSPHERIC OCEAN/COSMIC GENERATORS (Pristine Stochastic Noise) ---
            if (ambientSurf !== 'none') {
                const nType = ambientSurf === 'pink-cosmic' ? 'pink' : 'brown';
                const nBuffer = createNoiseBuffer(ctx, nType);
                const nSrc = ctx.createBufferSource();
                nSrc.buffer = nBuffer;
                nSrc.loop = true;

                // Create a beautiful Biquad Resonant Filter with cascading curves
                const resonantFilter = ctx.createBiquadFilter();
                resonantFilter.type = ambientSurf === 'pink-cosmic' ? 'bandpass' : 'lowpass';
                resonantFilter.Q.value = ambientSurf === 'pink-cosmic' ? 5.5 : 2.5;
                resonantFilter.frequency.setValueAtTime(320, ctx.currentTime);

                // Immersive Phase Shifter FX for Space Engine
                const phaserFreq = ctx.createBiquadFilter();
                phaserFreq.type = 'allpass';
                phaserFreq.frequency.setValueAtTime(1000, ctx.currentTime);

                // Ocean Waves slow filter swept oscillator (0.015 Hz = ~66 seconds macro cycle)
                const sweepLfo = ctx.createOscillator();
                sweepLfo.type = 'sine';
                sweepLfo.frequency.value = ambientSurf === 'brown-deep' ? 0.02 : 0.04;

                const sweepLfoGain = ctx.createGain();
                // Sweep width: lush dynamic breathing of the wave
                sweepLfoGain.gain.value = ambientSurf === 'pink-cosmic' ? 420 : 300;

                const sweepLfoPhaser = ctx.createGain();
                sweepLfoPhaser.gain.value = 800; // Phaser sweep

                sweepLfo.connect(sweepLfoGain);
                sweepLfo.connect(sweepLfoPhaser);
                
                sweepLfoGain.connect(resonantFilter.frequency);
                sweepLfoPhaser.connect(phaserFreq.frequency);

                const noiseGain = ctx.createGain();
                noiseGain.gain.value = ambientSurf === 'brown-deep' ? 0.16 : 0.10;

                const spacePanner = createPanner(0); 

                nSrc.connect(resonantFilter);
                resonantFilter.connect(phaserFreq);
                phaserFreq.connect(noiseGain);
                noiseGain.connect(spacePanner);
                spacePanner.connect(airEq);

                sweepLfo.start();
                nSrc.start();

                oLfoRef.current = sweepLfo;
                noiseSrcRef.current = nSrc;
            }

            // --- 4. SUBLIMINAL MANTRA LAYER (High-Fidelity Whispers) ---
            if (activeMode.mantra) {
                try {
                    const audioBase64 = await generateTextToSpeech(activeMode.mantra);
                    if (audioBase64) {
                        const buffer = await decodeAudioData(decode(audioBase64), ctx, 48000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.loop = true;
                        
                        const whisperGain = ctx.createGain();
                        whisperGain.gain.value = 0.09; // Psycho-acoustic whisper threshold
                        
                        // Ethereal Reverb Simulator (Delay-based Comb Filtering)
                        const delay1 = ctx.createDelay(); delay1.delayTime.value = 0.15;
                        const delay2 = ctx.createDelay(); delay2.delayTime.value = 0.25;
                        const fback = ctx.createGain(); fback.gain.value = 0.3;
                        delay1.connect(delay2); delay2.connect(fback); fback.connect(delay1);

                        // Resonant acoustic bandpass filter for mysterious subliminal effect
                        const bwFilter = ctx.createBiquadFilter();
                        bwFilter.type = 'bandpass';
                        bwFilter.frequency.value = 800;
                        bwFilter.Q.value = 1.0;

                        const whisperPanner = createPanner(0);

                        source.connect(bwFilter);
                        bwFilter.connect(delay1);
                        bwFilter.connect(whisperGain);
                        delay1.connect(whisperGain);
                        
                        whisperGain.connect(whisperPanner);
                        whisperPanner.connect(airEq); // Route through mastering
                        source.start();
                    }
                } catch (speechErr) {
                    console.warn("TTS generation failed, continuing without mantra layer.", speechErr);
                }
            }
            
            setIsPlaying(true);
        } catch (e) {
            console.error(e);
            setIsPlaying(false);
            addToast("Audio Hardware Error. Please try another browser.", "error");
        }
    };

    const stopAudio = () => {
        if (oLfoRef.current) {
            try { oLfoRef.current.stop(); } catch (e) {}
            oLfoRef.current = null;
        }
        if (noiseSrcRef.current) {
            try { noiseSrcRef.current.stop(); } catch (e) {}
            noiseSrcRef.current = null;
        }
        
        if (masterGainRef.current && audioCtxRef.current) {
            const ctx = audioCtxRef.current;
            try {
                // Smooth professional volume ramp down to eliminate speaker clipping/popping
                masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, ctx.currentTime);
                masterGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
                const ctxToClose = audioCtxRef.current;
                setTimeout(() => {
                    try {
                        ctxToClose.close();
                    } catch (err) {}
                }, 180);
            } catch (err) {
                try { audioCtxRef.current.close(); } catch (e) {}
            }
        } else if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch (e) {}
        }
        audioCtxRef.current = null;
        
        // Log Session
        if (memberId) {
            addRoutineLog({
                log_id: `NEURO_${Date.now()}`,
                member_id: memberId,
                task_type: 'Bio-Hack',
                task_desc: `${activeMode.name} Session (15m)`,
                task_time: new Date().toLocaleTimeString(),
                is_done: true
            });
        }
    };

    const toggleSession = () => {
        if (isPlaying) {
            stopAudio();
            setIsPlaying(false);
            setIsFullScreen(false);
            cancelAnimationFrame(animationFrameRef.current);
        } else {
            addToast("Sovereign Link: Audio Context Armed.", "info");
            initAudio();
            setIsPlaying(true);
            setIsFullScreen(true);
        }
    };

    // Breathing Logic (4-4-4-4)
    useEffect(() => {
        if (!isPlaying) return;
        let t = 0;
        const interval = setInterval(() => {
            t++;
            const cycle = t % 12;
            if (cycle < 4) setBreathPhase('Inhale');
            else if (cycle < 8) setBreathPhase('Hold');
            else setBreathPhase('Exhale');
            setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Volume Control Live Update
    useEffect(() => {
        if (masterGainRef.current) masterGainRef.current.gain.value = volume;
    }, [volume]);

    // Restart audio if mode or setting changes while playing
    useEffect(() => {
        if (isPlaying) {
            stopAudio();
            const delayTimer = setTimeout(() => {
                initAudio();
            }, 180);
            return () => clearTimeout(delayTimer);
        }
    }, [activeMode, isIsochronic, solfeggioAlign, waveType, ambientSurf]);

    // --- VISUALIZER LOOP ---
    useEffect(() => {
        if (!isPlaying || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let rotationAngle = 0;

        const render = () => {
            animationFrameRef.current = requestAnimationFrame(render);
            if (!analyserRef.current) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray); // Frequency data for mandala

            const w = canvasRef.current!.width;
            const h = canvasRef.current!.height;
            const cx = w / 2;
            const cy = h / 2;
            const radius = Math.min(w, h) / 3.2;

            // Deep cosmic canvas trail effect
            const energy = dataArray[15] / 255.0 || 0.1;
            ctx.fillStyle = `rgba(3, 3, 7, ${0.12 - energy * 0.05})`; 
            ctx.fillRect(0, 0, w, h);

            // Draw glowing background grids representing neural synaptic pathways
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.01 + energy * 0.03})`;
            ctx.lineWidth = 0.5;
            for (let r = radius * 0.3; r < radius * 2; r += radius * 0.45) {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Spirograph Sacred Geometry parameters
            rotationAngle += 0.006 + (energy * 0.01);
            const petPoints = activeMode.id === 'deep_repair' ? 6 : activeMode.id === 'cns_reset' ? 8 : activeMode.id === 'focus_flow' ? 12 : 16;
            
            // Draw Sacred Spirograph Petals
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = activeColor;
            ctx.shadowBlur = 10 + (energy * 25);
            ctx.shadowColor = activeColor;

            for (let petal = 0; petal < petPoints; petal++) {
                const baseAngle = (petal * Math.PI * 2) / petPoints + rotationAngle;
                ctx.beginPath();
                
                // Construct beautiful responsive nodes
                const subAmp = dataArray[Math.floor(petal * (bufferLength / petPoints))] / 255.0 || 0.5;
                const dynamicRad = radius * (0.65 + subAmp * 0.5);

                const xStart = cx + Math.cos(baseAngle) * (radius * 0.35);
                const yStart = cy + Math.sin(baseAngle) * (radius * 0.35);

                // Control points to bend the curve gracefully
                const cpAngle = baseAngle + Math.PI / petPoints;
                const cpX = cx + Math.cos(cpAngle) * dynamicRad * 1.5;
                const cpY = cy + Math.sin(cpAngle) * dynamicRad * 1.5;

                const xEnd = cx + Math.cos(baseAngle + (Math.PI * 2) / petPoints) * (radius * 0.35);
                const yEnd = cy + Math.sin(baseAngle + (Math.PI * 2) / petPoints) * (radius * 0.35);

                ctx.moveTo(xStart, yStart);
                ctx.quadraticCurveTo(cpX, cpY, xEnd, yEnd);
                ctx.stroke();
            }

            // Draw Radial Audio Bars as sparkling outer corona
            ctx.shadowBlur = 0; // turn off shadow for raw speed
            ctx.lineWidth = 1.0;
            const coronaBars = 90;
            const step = (Math.PI * 2) / coronaBars;
            for (let i = 0; i < coronaBars; i++) {
                const val = dataArray[i * 4] / 255.0 || 0;
                const barH = val * radius * 0.45;
                const angle = i * step - (rotationAngle * 0.5);
                
                const startX = cx + Math.cos(angle) * (radius * 0.95);
                const startY = cy + Math.sin(angle) * (radius * 0.95);
                const endX = cx + Math.cos(angle) * (radius * 0.95 + barH);
                const endY = cy + Math.sin(angle) * (radius * 0.95 + barH);

                ctx.beginPath();
                ctx.strokeStyle = `rgba(${parseInt(activeColor.substring(1,3), 16) || 120}, ${parseInt(activeColor.substring(3,5), 16) || 100}, 255, ${0.45 + val * 0.55})`;
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // Center Nucleus representing pure state of consciousness
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.28 + (energy * 18), 0, Math.PI * 2);
            ctx.fillStyle = `${activeColor}22`;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();

            // VISUAL ENTRAINMENT (Strobe Effect)
            if (isIsochronic && activeMode.isoPulse && pulseRef.current) {
                const now = Date.now() / 1000;
                // Soft triangular strobe to match smooth audio
                const cyclePos = (now * activeMode.isoPulse) % 1.0;
                const strobe = cyclePos < 0.5 ? cyclePos * 2 * 0.08 : (1 - cyclePos) * 2 * 0.08;
                pulseRef.current.style.opacity = strobe.toFixed(4);
            }
        };
        render();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying, activeMode, isIsochronic, activeColor, waveType, solfeggioAlign]);

    // AI Generator
    const handleGenerateCustom = async () => {
        if (!userStateInput.trim()) return;
        setIsThinking(true);
        try {
            const jsonStr = await generateNeuroProtocol(userStateInput);
            const data = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
            const customMode: TherapyMode = {
                id: `ai_${Date.now()}`,
                name: data.name || "Custom Neuro",
                wave: data.wave || "Alpha",
                freqLeft: data.freqLeft || 300,
                freqRight: data.freqRight || 310,
                colorFrom: data.colorFrom || "#000",
                colorTo: data.colorTo || "#fff",
                description: data.description || "AI Generated Protocol",
                icon: <Zap className="w-5 h-5 text-indigo-400" />,
                mantra: data.mantra,
                isoPulse: data.isoPulse || 4 
            };
            setActiveMode(customMode);
            setActiveColor(data.colorTo || '#fff');
            addToast("Smart Architect: Protocol Generated.", "success");
        } catch (e) {
            addToast("Logic Drift Detected. Using defaults.", "error");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {isFullScreen && (
                <div 
                    className="fixed inset-0 z-[300] flex flex-col items-center justify-center transition-all duration-[4000ms] ease-in-out overflow-hidden"
                    style={{ background: `linear-gradient(to bottom right, ${activeMode.colorFrom}, ${activeMode.colorTo})` }}
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>
                    
                    {/* Visual Entrainment Pulse Layer */}
                    <div ref={pulseRef} className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-75" style={{ opacity: 0 }}></div>

                    {/* Visualizer Background Layer */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                         <canvas ref={canvasRef} width={1200} height={1200} className="w-full h-full max-w-[1200px] max-h-[1200px]" />
                    </div>

                    <div className="relative z-10 text-center space-y-12">
                        <div className="animate-pulse">
                            <Headphones className="w-20 h-20 text-white/40 mx-auto mb-6" />
                            <h2 className="text-6xl font-black text-white uppercase italic tracking-widest">{activeMode.name}</h2>
                            <p className="text-white/60 font-mono mt-4 uppercase tracking-[0.5em]">{activeMode.wave}</p>
                        </div>
                        <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
                            <div className={`absolute rounded-full border-4 border-white/20 transition-all duration-[4000ms] ease-in-out ${breathPhase === 'Inhale' ? 'w-full h-full opacity-60' : breathPhase === 'Hold' ? 'w-full h-full opacity-100' : 'w-20 h-20 opacity-20'}`}></div>
                            <div className="text-center">
                                <p className="text-4xl font-black text-white uppercase italic tracking-widest">{breathPhase}</p>
                                <p className="text-6xl font-mono text-white/40 mt-4">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-6 bg-black/40 px-10 py-4 rounded-full border border-white/10 backdrop-blur-md">
                                <Volume2 className="w-5 h-5 text-white/50" />
                                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-64 h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer" />
                            </div>
                            
                            <button onClick={toggleSession} className="relative bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 backdrop-blur-xl text-white p-6 rounded-full border border-dashed border-white/10 hover:border-white/30 transition-all active:scale-95 group overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]">
                                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <X className="w-10 h-10 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="lg:col-span-8">
                <Card className="bg-black/60 border-white/5 p-10 rounded-[3.5rem] relative overflow-hidden flex flex-col justify-center h-full shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Waves className="w-64 h-64 text-indigo-400" /></div>
                    <div className="relative z-10 w-full max-w-xl mx-auto space-y-10">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-indigo-600/20 border-2 border-indigo-500/50 flex items-center justify-center">
                                {activeMode.icon}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{activeMode.name}</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-indigo-400 font-mono text-sm tracking-widest">{activeMode.wave}</p>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                        <input type="checkbox" checked={isIsochronic} onChange={e => setIsIsochronic(e.target.checked)} className="accent-indigo-500" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Isochronic Pulse</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <BotIcon className="w-6 h-6 text-amber-500" />
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Smart Architect Fitness Future</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                     <span className={`text-[10px] font-black uppercase tracking-widest ${bioSync ? 'text-green-400' : 'text-gray-600'}`}>Bio-Sync (HRV)</span>
                                     <input type="checkbox" checked={bioSync} onChange={e => setBioSync(e.target.checked)} className="accent-green-500" />
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                   type="text" 
                                   placeholder="How do you feel? (e.g. Brain Fog, Muscle Soreness)" 
                                   value={userStateInput}
                                   onChange={(e) => setUserStateInput(e.target.value)}
                                   onKeyPress={(e) => e.key === 'Enter' && handleGenerateCustom()}
                                   className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-indigo-500"
                                />
                                <button 
                                   onClick={handleGenerateCustom}
                                   disabled={isThinking}
                                   className="relative bg-gradient-to-r from-indigo-900/40 to-indigo-800/40 hover:from-indigo-800/60 hover:to-indigo-700/60 backdrop-blur-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 text-indigo-400 p-4 rounded-2xl disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                    <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">
                                        {isThinking ? <RefreshCw className="animate-spin w-5 h-5"/> : <Zap className="w-5 h-5" />}
                                    </div>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-4 italic leading-relaxed">"{activeMode.description}"</p>
                        </div>

                        {/* Next-Gen Acoustic Tuning Panel */}
                        <div className="bg-black/40 border border-white/5 p-6 rounded-3xl space-y-6">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <Radio className="w-4 h-4 animate-pulse" /> Advanced NeuroAcoustic Synthesiser
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Solfeggio Scale */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex justify-between">
                                        <span>Solfeggio Scale Resonator</span>
                                        <span className={solfeggioAlign ? "text-green-400" : "text-gray-500"}>
                                            {solfeggioAlign ? "Enabled" : "Disabled"}
                                        </span>
                                    </label>
                                    <button 
                                        onClick={() => setSolfeggioAlign(!solfeggioAlign)}
                                        className={`w-full py-3 px-4 rounded-xl text-left border text-xs transition-all ${
                                            solfeggioAlign 
                                                ? "bg-indigo-900/20 border-indigo-500/50 text-indigo-200" 
                                                : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="font-extrabold flex items-center justify-between">
                                            <span>{solfeggioAlign ? "✨ Sacred Tones Active" : "🧬 Lab Standards Only"}</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-300">
                                                {solfeggioAlign ? "432 / 528Hz" : "Raw"}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {solfeggioAlign 
                                                ? "Harmonically offsets base carrier waves using organic, DNA-repaired Solfeggio scale structures."
                                                : "Uses direct clinical brainwave differentials based purely on direct lab targets (e.g. Delta/Beta)."}
                                        </p>
                                    </button>
                                </div>

                                {/* Waveforms */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Carrier Tone Harmonics</label>
                                    <div className="flex flex-col gap-2">
                                        {([
                                            { id: 'sine', label: ' Pure Sine Wave', desc: 'Clinical, ultra-pure focused signal.' },
                                            { id: 'triangle', label: '▲ Soothing Triangle', desc: 'Pre-filtered, naturally smooth roll-off.' },
                                            { id: 'sine-harmonic', label: '🎻 Pythagorean Harmonics', desc: 'Golden Ratio overtones (Pipe/Singing Bowl).' }
                                        ] as const).map(w => (
                                            <button
                                                key={w.id}
                                                onClick={() => setWaveType(w.id)}
                                                className={`py-2 px-3 rounded-xl border text-left text-xs transition-all ${
                                                    waveType === w.id
                                                        ? "bg-purple-900/20 border-purple-500/50 text-purple-200"
                                                        : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10"
                                                }`}
                                            >
                                                <div className="font-bold">{w.label}</div>
                                                <div className="text-[9px] text-gray-500">{w.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ambient Sound Scape Layer */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex justify-between">
                                    <span>Atmospheric Sound Generator Backdrop</span>
                                    <span className="text-zinc-400 text-[10px] font-mono">
                                        {ambientSurf === 'none' ? "Off" : ambientSurf === 'ocean' ? "LUSH OCEAN SURF" : ambientSurf === 'pink-cosmic' ? "STELLAR SPACE WIND" : "GROUNDING SUB-BASS BROWN"}
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {([
                                        { id: 'none', label: 'Off' },
                                        { id: 'ocean', label: '🌊 Ocean Surf' },
                                        { id: 'pink-cosmic', label: '🌌 Cosmic Wind' },
                                        { id: 'brown-deep', label: '🧘 Sub Ground' }
                                    ] as const).map(amb => (
                                        <button
                                            key={amb.id}
                                            onClick={() => setAmbientSurf(amb.id)}
                                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                                                ambientSurf === amb.id 
                                                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-950/40 font-black' 
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                                            }`}
                                        >
                                            {amb.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-zinc-500 italic leading-relaxed">
                                    All backdrops are synthesized procedurally in-browser using pure mathematical noise filter sweeps. No audio lag, no heavy streams, entirely clear and pristine.
                                </p>
                            </div>
                        </div>

                        <button 
                           onClick={toggleSession}
                           className="relative w-full bg-gradient-to-r from-gray-900/40 to-gray-800/40 hover:from-gray-800/60 hover:to-gray-700/60 backdrop-blur-xl border border-dashed border-white/10 hover:border-white/30 text-white font-black py-6 rounded-[2.5rem] shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all uppercase tracking-widest text-xs italic flex items-center justify-center gap-4 group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="relative z-10 flex items-center gap-4 group-hover:scale-105 transition-transform duration-500">
                                <Headphones className="w-5 h-5" /> <span>Initiate Recovery Sequence</span>
                            </div>
                        </button>
                    </div>
                </Card>
            </div>

            {/* IoT Control Panel */}
            <div className="lg:col-span-4 space-y-6">
                <Card title="Pod IoT Terminal" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                    <div className="space-y-8">
                        <div className="p-6 bg-black rounded-3xl border border-white/5 relative overflow-hidden">
                             <div className="absolute inset-0 opacity-10 bg-indigo-500 animate-pulse"></div>
                             <div className="relative z-10">
                                 <div className="flex justify-between items-center mb-4">
                                     <div>
                                         <p className="text-[10px] text-gray-500 uppercase font-bold">Atmosphere</p>
                                         <p className="text-2xl font-black text-white italic">{podTemp.toFixed(1)}°C</p>
                                     </div>
                                     <Thermometer className="w-8 h-8 text-indigo-400" />
                                 </div>
                                 <input 
                                    type="range" min="16" max="30" step="0.5" 
                                    value={podTemp} onChange={(e) => setPodTemp(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                             </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Lightbulb className="w-4 h-4"/> Chromatherapy
                            </p>
                            <div className="flex gap-4">
                                {['#312e81', '#581c87', '#b45309', '#064e3b', '#ef4444'].map(color => (
                                    <div 
                                        key={color} 
                                        onClick={() => setActiveColor(color)}
                                        className={`w-12 h-12 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform shadow-lg ${activeColor === color ? 'border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : 'border-white/10'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-300 flex items-center gap-2"><Wind className="w-4 h-4 text-cyan-400"/> Smart Oxygen</span>
                                    <span className="text-[10px] font-black text-cyan-500">{oxygenLevel}%</span>
                                </div>
                                <input 
                                    type="range" min="18" max="25" step="1" 
                                    value={oxygenLevel} onChange={(e) => setOxygenLevel(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-300 flex items-center gap-2"><Disc className="w-4 h-4 text-purple-400"/> Haptics</span>
                                    <span className="text-[10px] font-black text-purple-500">{['OFF', 'LOW', 'MED', 'HIGH'][hapticIntensity]}</span>
                                </div>
                                <div className="flex gap-2">
                                    {[0, 1, 2, 3].map(lvl => (
                                        <button 
                                            key={lvl}
                                            onClick={() => setHapticIntensity(lvl)}
                                            className={`relative flex-1 h-8 rounded-lg transition-all group overflow-hidden ${hapticIntensity === lvl ? 'bg-gradient-to-r from-purple-900/40 to-purple-800/40 backdrop-blur-xl border border-dashed border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-transparent border border-transparent hover:border-gray-600/50 hover:bg-gray-800/40'}`}
                                        >
                                            <div className={`absolute inset-0 bg-white/5 translate-y-full transition-transform duration-300 ease-in-out ${hapticIntensity !== lvl ? 'group-hover:translate-y-0' : ''}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-[2.5rem] flex items-start gap-4 shadow-xl">
                    <BrainCircuit className="w-10 h-10 text-indigo-400 animate-pulse shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">CNS Insight</p>
                        <p className="text-gray-400 text-xs italic leading-relaxed">
                            "Fitness Future Protocol utilizes Isochronic pulsing for faster entrainment. Combined with Bio-Sync, expect 20% faster sympathetic withdrawal."
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-12 space-y-4">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] pl-4">Standard Presets</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MODES.map(mode => (
                        <div 
                            key={mode.id} 
                            onClick={() => !isPlaying && setActiveMode(mode)}
                            className={`p-6 rounded-3xl border cursor-pointer transition-all ${activeMode.id === mode.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-950 border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-black rounded-2xl">{mode.icon}</div>
                                <div>
                                    <p className="text-white font-bold">{mode.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{mode.wave} {mode.isoPulse ? `• ${mode.isoPulse}Hz Pulse` : ''}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const NeuroSyncHubWrapper: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="bg-[#05050a] p-8 rounded-[3rem] border border-indigo-500/30 relative overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-5 py-2 bg-indigo-500 text-white rounded-full flex items-center gap-3 shadow-lg font-black uppercase tracking-[0.2em] text-[10px]">
                                <Infinity className="w-3 h-3 animate-spin-slow" /> Synaptic Core Fitness Future
                            </div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-2">Cerebral Cortex Online</p>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Neuro <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Recovery</span>
                        </h1>
                    </div>
                </div>
            </div>
            <SonicFrequencyTuner />
        </div>
    );
};

export default NeuroSyncHubWrapper;
