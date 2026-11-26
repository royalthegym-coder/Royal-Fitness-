import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, ShieldAlert, Zap, Crosshair, Volume2, VolumeX, User, Sparkles, Scale, Percent, Dumbbell, ShieldCheck, Heart, Info, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { useData } from '../context/DataProvider';
import { ai } from '../../lib/core_ai';

// 2D Glowing Biomechanical Custom Canvas Skeleton Viewer
const SkeletonViewer2D: React.FC<{
    isDeadlifting: boolean;
    isSquatting: boolean;
    backTilt: number;     // 0 to 90 degrees
    squatDepth: number;   // 0 to 120 degrees
    roundingFactor: number; // 0 to 10
    aclStress: number;
    l5s1Stress: number;
}> = ({ isDeadlifting, isSquatting, backTilt, squatDepth, roundingFactor, aclStress, l5s1Stress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let t = 0;

        const draw = () => {
            t += 0.05;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Tech digital target grid background
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.04)';
            ctx.lineWidth = 1;
            const gridSize = 16;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Radar radar sweep line
            const sweepY = (Math.sin(t * 1.5) + 1) * (canvas.height / 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, sweepY);
            ctx.lineTo(canvas.width, sweepY);
            ctx.stroke();

            // Scope safety target lines
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 75, 0, Math.PI * 2);
            ctx.stroke();

            // Interactive coordinate interpolation
            const centerX = canvas.width / 2;
            const baseY = canvas.height - 30; // Ground line (ankles level)

            // Dynamic hinge modeling depending on angles
            // Convert parameters flatly to radians
            const tiltRad = (backTilt * Math.PI) / 180;
            const depthFactor = squatDepth / 120; // 0 to 1

            // Ankles placement
            const ackX = centerX;
            const ackY = baseY;

            // Knee coordinates glide back and down during high squat squat depth
            let kneeX = centerX - 12 - (isSquatting ? depthFactor * 18 : 0);
            let kneeY = ackY - 55 + (isSquatting ? depthFactor * 14 : 0);

            // Hip position hinge
            // On Squat, hips move backwards. On Deadlift, hips hinge deeply backwards.
            let hipX = centerX - 8 - (isSquatting ? depthFactor * 22 : isDeadlifting ? tiltRad * 16 : 0);
            let hipY = kneeY - 50 + (isSquatting ? depthFactor * 22 : isDeadlifting ? tiltRad * 4 : 0);

            // Spine lumbar rounding curvature math (simulating flexed mechanical spine)
            let spineAngle = isDeadlifting ? tiltRad * 1.1 : isSquatting ? depthFactor * 0.45 : 0.05;
            let shoulderX = hipX + Math.sin(spineAngle) * 55;
            let shoulderY = hipY - Math.cos(spineAngle) * 55;

            // If lumbar spinal rounding factor is high, generate curvature displacement points in spine line
            const spineMidpointX = (hipX + shoulderX) / 2 - (roundingFactor * 0.95);
            const spineMidpointY = (hipY + shoulderY) / 2 - (roundingFactor * 0.4);

            // Shoulders to head line
            let headX = shoulderX + Math.sin(spineAngle) * 14;
            let headY = shoulderY - Math.cos(spineAngle) * 14;

            // Arms position holding barbell weight bar
            let handX = shoulderX + (isDeadlifting ? 12 : 8);
            let handY = shoulderY + 45;

            // Helper to draw clean cyber skeleton vectors with fluorescent glow
            const drawBoneSegment = (x1: number, y1: number, x2: number, y2: number, color: string, thickness = 3.5) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.strokeStyle = color;
                ctx.stroke();
            };

            // Dynamic joints color alerts
            const kneeGlow = aclStress > 60 ? 'rgba(239, 68, 68, 0.95)' : aclStress > 30 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(34, 211, 238, 0.7)';
            const spineGlow = l5s1Stress > 45 ? 'rgba(239, 68, 68, 0.95)' : l5s1Stress > 25 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.7)';
            const normalCyberGlow = 'rgba(115, 115, 115, 0.4)';

            // Draw limbs
            // Ground
            drawBoneSegment(ackX - 35, ackY, ackX + 35, ackY, 'rgba(255,255,255,0.1)', 2.5);
            // Shins (Ankle to Knee)
            drawBoneSegment(ackX, ackY, kneeX, kneeY, normalCyberGlow, 3);
            // Thighs (Knee to Hip)
            drawBoneSegment(kneeX, kneeY, hipX, hipY, normalCyberGlow, 3.5);

            // Spine (Hip to Shoulder, bends or curves based on L5 rounding setup)
            if (roundingFactor > 1.5) {
                // Curved Spine to represent risk of ruptured discs
                ctx.beginPath();
                ctx.moveTo(hipX, hipY);
                ctx.quadraticCurveTo(spineMidpointX, spineMidpointY, shoulderX, shoulderY);
                ctx.lineWidth = 4.5;
                ctx.lineCap = 'round';
                ctx.strokeStyle = spineGlow;
                ctx.stroke();
            } else {
                // Straight neutral biomechanical spine
                drawBoneSegment(hipX, hipY, shoulderX, shoulderY, spineGlow, 4.5);
            }

            // Head and Shoulder
            drawBoneSegment(shoulderX, shoulderY, headX, headY, normalCyberGlow, 2);
            drawBoneSegment(shoulderX, shoulderY, handX, handY, normalCyberGlow, 2.5);

            // Draw Joint Nodes
            const drawNode = (cx: number, cy: number, radius: number, glowColor: string, labelText?: string) => {
                ctx.shadowBlur = 12;
                ctx.shadowColor = glowColor;
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset

                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (labelText) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                    ctx.font = '7.5px monospace';
                    ctx.fillText(labelText, cx + radius + 6, cy + 3);
                }
            };

            // Head Core Node
            drawNode(headX, headY, 9, 'rgba(34, 211, 238, 0.85)');
            // Shoulder Core Node
            drawNode(shoulderX, shoulderY, 5, 'rgba(147, 51, 234, 0.8)');
            // Knee Joint Node (ACL)
            drawNode(kneeX, kneeY, 6, kneeGlow, 'ACL KNEE');
            // Hip Joint Node (L5-S1)
            drawNode(hipX, hipY, 6.5, spineGlow, 'L5-S1 SPINE');
            // Ankle Joint Node
            drawNode(ackX, ackY, 4.5, 'rgba(115, 115, 115, 0.7)');

            // Handle exercise weight visualizers
            if (isDeadlifting) {
                // Barbell through hands
                const barLength = 50;
                drawBoneSegment(handX - barLength / 2, handY, handX + barLength / 2, handY, '#f43f5e', 4);
                // Plates on Barbell
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#f43f5e';
                ctx.lineWidth = 1.5;
                // Left Plate
                ctx.fillRect(handX - barLength / 2, handY - 18, 9, 36);
                ctx.strokeRect(handX - barLength / 2, handY - 18, 9, 36);
                // Right Plate
                ctx.fillRect(handX + barLength / 2 - 9, handY - 18, 9, 36);
                ctx.strokeRect(handX + barLength / 2 - 9, handY - 18, 9, 36);
            } else if (isSquatting) {
                // Barbell on shoulders rest point
                const barY = shoulderY + 4;
                const barLength = 52;
                drawBoneSegment(shoulderX - barLength / 2, barY, shoulderX + barLength / 2, barY, '#a855f7', 4.2);
                // Plates on Barbell
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 1.5;
                // Left Plate
                ctx.fillRect(shoulderX - barLength / 2, barY - 16, 9, 32);
                ctx.strokeRect(shoulderX - barLength / 2, barY - 16, 9, 32);
                // Right Plate
                ctx.fillRect(shoulderX + barLength / 2 - 9, barY - 16, 9, 32);
                ctx.strokeRect(shoulderX + barLength / 2 - 9, barY - 16, 9, 32);
            }

            // Render curvature caution lines for bad spinal setup
            if (roundingFactor > 3) {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
                ctx.setLineDash([2, 3]);
                ctx.beginPath();
                ctx.moveTo(spineMidpointX, spineMidpointY);
                ctx.lineTo(spineMidpointX - 25, spineMidpointY);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
                ctx.font = '8px monospace';
                ctx.fillText("FLUID SPINAL ROUNDING - SHEAR FORCES ACTIVE", spineMidpointX - 100, spineMidpointY - 4);
            }

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
        };
    }, [isDeadlifting, isSquatting, backTilt, squatDepth, roundingFactor, aclStress, l5s1Stress]);

    return (
        <canvas
            ref={canvasRef}
            width={190}
            height={250}
            className="w-full h-full block bg-black/80 rounded-2xl border border-red-500/10 shadow-[inner_0_4px_12px_rgba(0,0,0,0.8)]"
        />
    );
};

const BODY_PARTS = [
    'Knee', 'Lower Back', 'Upper Back', 'Shoulder', 'Elbow', 'Wrist', 'Hip', 'Ankle', 'Neck', 'Hamstring', 'Quad', 'Calf'
];

const PAIN_TYPES = [
    'Sharp Pain', 'Dull Ache', 'Throbbing', 'Burning', 'Numbness/Tingling', 'Clicking/Popping', 'Stiffness', 'Weakness'
];

const InteractiveBodyMap: React.FC<{
    selectedParts: string[];
    onPartClick: (part: string) => void;
}> = ({ selectedParts, onPartClick }) => {
    // Helper to determine if a part is selected
    const isSelected = (part: string) => selectedParts.includes(part);
    // Dynamic styles
    const getFill = (part: string) => isSelected(part) ? 'rgba(34, 211, 238, 0.4)' : 'transparent';
    const getStroke = (part: string) => isSelected(part) ? '#22d3ee' : '#52525b';
    
    // Abstracted clickable region with hover effect using group
    const ClickableRegion = ({ part, d, cx, cy, r }: { part: string; d?: string; cx?: number; cy?: number; r?: number }) => (
        <g 
            onClick={() => onPartClick(part)}
            className="cursor-pointer transition-all duration-200"
            style={{ transition: 'all 0.2s' }}
        >
            {d ? (
                <path 
                    d={d} 
                    fill={getFill(part)} 
                    stroke={getStroke(part)} 
                    strokeWidth="2" 
                    className="hover:stroke-cyan-300 hover:fill-cyan-500/20"
                />
            ) : cx !== undefined && cy !== undefined && r !== undefined ? (
                <circle 
                    cx={cx} 
                    cy={cy} 
                    r={r} 
                    fill={getFill(part)} 
                    stroke={getStroke(part)} 
                    strokeWidth="2" 
                    className="hover:stroke-cyan-300 hover:fill-cyan-500/20"
                />
            ) : null}
        </g>
    );

    return (
        <div className="relative w-full max-w-[200px] mx-auto svg-container text-zinc-400 select-none">
            <svg viewBox="0 0 200 400" className="w-full h-auto drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                {/* Background generic body silhouette to give context, non-clickable */}
                <path d="M100 20 C115 20, 115 45, 100 45 C85 45, 85 20, 100 20 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/> 
                <path d="M100 45 C130 50, 145 60, 145 80 L135 150 L115 150 L115 200 C120 250, 120 300, 115 380 L85 380 C80 300, 80 250, 85 200 L65 150 L55 150 L55 80 C55 60, 70 50, 100 45 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

                {/* Neck */}
                <ClickableRegion part="Neck" d="M90 40 L110 40 L115 50 L85 50 Z" />
                
                {/* Shoulders */}
                <ClickableRegion part="Shoulder" d="M55 55 C70 50, 90 50, 100 50 L100 70 L55 80 Z" />
                <ClickableRegion part="Shoulder" d="M145 55 C130 50, 110 50, 100 50 L100 70 L145 80 Z" />

                {/* Upper Back / Chest Area Context */}
                <ClickableRegion part="Upper Back" d="M70 70 L130 70 L125 110 L75 110 Z" />
                
                {/* Lower Back / Core */}
                <ClickableRegion part="Lower Back" d="M75 110 L125 110 L120 150 L80 150 Z" />

                {/* Hips */}
                <ClickableRegion part="Hip" d="M70 150 L130 150 L125 200 L75 200 Z" />

                {/* Elbows */}
                <ClickableRegion part="Elbow" cx={50} cy={110} r={8} />
                <ClickableRegion part="Elbow" cx={150} cy={110} r={8} />

                {/* Wrists */}
                <ClickableRegion part="Wrist" cx={45} cy={160} r={6} />
                <ClickableRegion part="Wrist" cx={155} cy={160} r={6} />

                {/* Quads */}
                <ClickableRegion part="Quad" d="M75 200 L95 200 L90 280 L70 280 Z" />
                <ClickableRegion part="Quad" d="M105 200 L125 200 L130 280 L110 280 Z" />
                
                {/* Hamstrings (We can map the same shape, but let's say hovering the lower box is quad/hamstring) */}
                {/* Due to 2D limitation, we'll overlap hamstring trigger slightly smaller or rely on list for specifics if they prefer, or just map them close */}

                {/* Knees */}
                <ClickableRegion part="Knee" cx={80} cy={290} r={10} />
                <ClickableRegion part="Knee" cx={120} cy={290} r={10} />

                {/* Calves */}
                <ClickableRegion part="Calf" d="M75 300 L85 300 L85 360 L75 360 Z" />
                <ClickableRegion part="Calf" d="M115 300 L125 300 L125 360 L115 360 Z" />

                {/* Ankles */}
                <ClickableRegion part="Ankle" cx={80} cy={375} r={7} />
                <ClickableRegion part="Ankle" cx={120} cy={375} r={7} />

            </svg>
        </div>
    );
};

// Main Injury Oracle Admin Component
const InjuryOracle: React.FC = () => {
    const { members } = useData();
    const [selectedMemberId, setSelectedMemberId] = useState<number>(0);
    const [selectedMember, setSelectedMember] = useState<any>(null);

    // Symptom Checklist States
    const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
    const [selectedPainTypes, setSelectedPainTypes] = useState<string[]>([]);

    const toggleBodyPart = (part: string) => {
        setSelectedBodyParts(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]);
    };

    const togglePainType = (type: string) => {
        setSelectedPainTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    // Dynamic Physics parameters for biomechanics simulation
    const [barbellWeight, setBarbellWeight] = useState<number>(100); // in kg
    const [backTilt, setBackTilt] = useState<number>(15);           // spine forward angle in degrees
    const [squatDepth, setSquatDepth] = useState<number>(45);       // knee range in degrees
    const [roundingFactor, setRoundingFactor] = useState<number>(0); // back curving index (0-10)
    const [kneeValgus, setKneeValgus] = useState<boolean>(false);   // knee collapse parameter

    const [isSquatting, setIsSquatting] = useState<boolean>(false);
    const [isDeadlifting, setIsDeadlifting] = useState<boolean>(false);
    
    // Telemetry output states
    const [aclStress, setAclStress] = useState<number>(0);
    const [l5s1Stress, setL5s1Stress] = useState<number>(0);
    const [simulatedForce, setSimulatedForce] = useState<number>(0);
    const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
    
    // Voice state
    const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
    const lastSpokenRef = useRef<number>(0);

    // AI suggestion response
    const [geminiAnalysis, setGeminiAnalysis] = useState<string>('');
    const [loadingGemini, setLoadingGemini] = useState<boolean>(false);

    // Initial load member selection setup
    useEffect(() => {
        if (members && members.length > 0) {
            const defaultId = members[0].id;
            setSelectedMemberId(defaultId);
            setSelectedMember(members[0]);
        }
    }, [members]);

    // Update selected member profile details
    const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        setSelectedMemberId(id);
        const match = members.find(m => m.id === id);
        if (match) {
            setSelectedMember(match);
            
            // Auto default simulation parameters based on selected member vulnerability
            const conditionsStr = JSON.stringify(match.medical_history?.conditions || []).toLowerCase();
            const injuriesStr = (match.medical_history?.pastInjuries || '').toLowerCase();
            
            if (conditionsStr.includes('knee') || injuriesStr.includes('knee') || injuriesStr.includes('acl')) {
                setKneeValgus(true);
                setSquatDepth(90);
            } else {
                setKneeValgus(false);
                setSquatDepth(45);
            }

            if (conditionsStr.includes('spine') || conditionsStr.includes('back') || injuriesStr.includes('disc') || injuriesStr.includes('back')) {
                setRoundingFactor(6);
                setBackTilt(45);
            } else {
                setRoundingFactor(0);
                setBackTilt(15);
            }
        }
    };

    // Calculate interactive real estate biomechanical physics
    useEffect(() => {
        const match = selectedMember;
        let injuryKneeMultiplier = 1.0;
        let injuryBackMultiplier = 1.0;

        if (match) {
            const conditionsStr = JSON.stringify(match.medical_history?.conditions || []).toLowerCase();
            const injuriesStr = (match.medical_history?.pastInjuries || '').toLowerCase();
            
            if (conditionsStr.includes('knee') || injuriesStr.includes('knee') || injuriesStr.includes('acl')) {
                injuryKneeMultiplier = 1.75; // Pre-existing knee injury raises baseline ACL stress significantly
            }
            if (conditionsStr.includes('spine') || conditionsStr.includes('back') || injuriesStr.includes('disc') || injuriesStr.includes('back')) {
                injuryBackMultiplier = 2.10; // Spinal vulnerability herniation risk scales pressure
            }
        }

        // Biomechanical Force formula (Mass * Gravity * mechanical vectors)
        const gravitationalConstant = 9.81;
        const baselineStanceMultiplier = isSquatting ? 1.3 : isDeadlifting ? 1.7 : 0.4;
        let baseForce = barbellWeight * gravitationalConstant * baselineStanceMultiplier;
        
        setSimulatedForce(Math.round(baseForce));

        // ACL Knee Stress calculations
        // Higher knee depth + presence of knee valgus angle collapse + high weight = extreme stress
        const depthStressRatio = (squatDepth / 120) * 45;
        const valgusPenalty = kneeValgus ? 35 : 0;
        const rawAclStress = ((barbellWeight / 220) * 15) + depthStressRatio + valgusPenalty;
        const finalizedAclRatio = Math.min(100, Math.round(rawAclStress * injuryKneeMultiplier));
        setAclStress(finalizedAclRatio);

        // L5-S1 Vertebral Shear calculations
        // Heavy back tilt + back rounding curvature + high weight = extreme spinal disc shear force
        const tiltStressRatio = (backTilt / 90) * 35;
        const roundingPenalty = roundingFactor * 6;
        const rawL5s1Stress = ((barbellWeight / 180) * 12) + tiltStressRatio + roundingPenalty;
        const finalizedLumbarRatio = Math.min(100, Math.round(rawL5s1Stress * injuryBackMultiplier));
        setL5s1Stress(finalizedLumbarRatio);

        // Maintain continuous realtime timeline history for Recharts telemetry chart
        const timeLabel = new Date().toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' });
        setTelemetryHistory(prev => {
            const nextHistory = [...prev, {
                time: timeLabel,
                force: Math.round(baseForce),
                aclStress: finalizedAclRatio,
                l5s1Stress: finalizedLumbarRatio
            }];
            if (nextHistory.length > 25) {
                nextHistory.shift();
            }
            return nextHistory;
        });

        // Safe guarded TTS alert triggers 
        const warnSpeech = (text: string) => {
            if (!voiceEnabled) return;
            const now = Date.now();
            if (now - lastSpokenRef.current > 6000) {
                try {
                    window.speechSynthesis.cancel();
                    const audioSegment = new SpeechSynthesisUtterance(text);
                    audioSegment.rate = 1.05;
                    audioSegment.pitch = 0.95;
                    window.speechSynthesis.speak(audioSegment);
                    lastSpokenRef.current = now;
                } catch (e) {
                    console.error("Speech Synthesis failed:", e);
                }
            }
        };

        if (finalizedAclRatio > 65) {
            warnSpeech(`Alert! Patellofemoral and ACL strain exceeds threshold. High risk of joint failure.`);
        } else if (finalizedLumbarRatio > 55) {
            warnSpeech(`Caution! L5 S1 shear pressure indicates elevated risk of disc protrusion. Adjust spinal alignment.`);
        }

    }, [barbellWeight, backTilt, squatDepth, roundingFactor, kneeValgus, isSquatting, isDeadlifting, selectedMember, voiceEnabled]);

    // Live query to generative model for custom joint recovery prescription
    const handleConsultAI = async () => {
        if (!selectedMember) return;
        setLoadingGemini(true);
        setGeminiAnalysis('');

        const prompt = `
            Consult as a Doctor and Gym biomechanist to prevent injuries.
            Active Member: ${selectedMember.name} (Goal: ${selectedMember.fitnessGoal || 'Overall strength training'})
            Demographics: HRV ${selectedMember.hrv || 'unknown'}, Bio-Age: ${selectedMember.bio_age || 'N/A'}.
            Medical History: ${selectedMember.medical_history?.pastInjuries || 'None'}, conditions: ${JSON.stringify(selectedMember.medical_history?.conditions || [])}.
            Current Biomechanics Active parameters:
            - Barbell Weight simulated: ${barbellWeight}kg
            - Back Tilt Degree: ${backTilt}° 
            - Knee Squat depth Degree: ${squatDepth}°
            - Curvature Spinal Rounding: ${roundingFactor}/10
            - Knee Valgus (Collapse): ${kneeValgus ? 'TRUE' : 'FALSE'}.

            Reported Symptoms (Manual Checklist):
            - Affected Body Parts: ${selectedBodyParts.length > 0 ? selectedBodyParts.join(', ') : 'None specified'}
            - Pain Types: ${selectedPainTypes.length > 0 ? selectedPainTypes.join(', ') : 'None specified'}
            
            Calculated Joint Stresses in simulator:
            - ACL Joint Stress: ${aclStress}%
            - L5-S1 Vertebrae shear: ${l5s1Stress}%

            Generate a concise, clinical biomechanical review in simple, encouraging terms.
            Include:
            1. Risk rating (Minimal, Critical, or Moderate) based on selected parameters.
            2. 3 concrete physical recommendations (alternative modifications, warmups, or orthopedic rules) to keep them lifting safely.
            Keep formatting clean using brief bullet points. Avoid clinical jargon, keep it straightforward for a gym trainer.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-4-hydrogen',
                contents: prompt,
            });
            
            const txt = response.text || '';
            setGeminiAnalysis(txt);
        } catch (err: any) {
            console.error("Gemini failed:", err);
            setGeminiAnalysis("Error generating telemetry review. Live pipeline server bypassed. Please try again.");
        } finally {
            setLoadingGemini(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 text-white min-h-screen bg-black/5">
            {/* Header section with telemetry alerts */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-zinc-950/80 border border-zinc-800/40 p-6 rounded-[2rem] shadow-2xl backdrop-blur-md gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-red-600/30 to-rose-950 border border-red-500/30 rounded-2xl shadow-[0_0_20px_rgba(239, 68, 68, 0.15)]">
                        <Activity className="w-8 h-8 text-red-500 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider flex items-center gap-3">
                            Gym Injury <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Oracle</span>
                        </h1>
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">Skeletal Integrity Biomechanical Simulator</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors text-xs uppercase font-extrabold tracking-wider ${voiceEnabled ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                        {voiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
                        {voiceEnabled ? 'Voice Alarms Active' : 'Voice Restrained'}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        Physiological Node active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visualizer & Static Kinematic details */}
                <div className="lg:col-span-4 bg-zinc-950/80 border border-zinc-800/40 p-6 rounded-[2.5rem] flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-4 left-6 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                        <Crosshair className="w-3.5 h-3.5 animate-spin-slow text-red-500" />
                        KINEMATIC SPECTROMETER
                    </div>

                    {/* Glowing Biomechanical model */}
                    <div className="relative w-48 h-64 my-6">
                        <SkeletonViewer2D 
                            isDeadlifting={isDeadlifting} 
                            isSquatting={isSquatting}
                            backTilt={backTilt}
                            squatDepth={squatDepth}
                            roundingFactor={roundingFactor}
                            aclStress={aclStress}
                            l5s1Stress={l5s1Stress}
                        />
                    </div>

                    {/* Preset Simulated exercises selectors */}
                    <div className="w-full space-y-3">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider text-center">Simulate Active Lift</div>
                        <div className="flex gap-3">
                            <button
                                onMouseDown={() => { setIsSquatting(true); setIsDeadlifting(false); }}
                                onMouseUp={() => setIsSquatting(false)}
                                onMouseLeave={() => setIsSquatting(false)}
                                onTouchStart={() => { setIsSquatting(true); setIsDeadlifting(false); }}
                                onTouchEnd={() => setIsSquatting(false)}
                                className={`flex-1 py-3 text-center uppercase tracking-widest font-black text-[10px] rounded-xl border transition-all ${isSquatting ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 scale-95 shadow-lg' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300'}`}
                            >
                                <Dumbbell className="w-3.5 h-3.5 inline mr-1" />
                                Hold Squat
                            </button>
                            <button
                                onMouseDown={() => { setIsDeadlifting(true); setIsSquatting(false); }}
                                onMouseUp={() => setIsDeadlifting(false)}
                                onMouseLeave={() => setIsDeadlifting(false)}
                                onTouchStart={() => { setIsDeadlifting(true); setIsSquatting(false); }}
                                onTouchEnd={() => setIsDeadlifting(false)}
                                className={`flex-1 py-3 text-center uppercase tracking-widest font-black text-[10px] rounded-xl border transition-all ${isDeadlifting ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 scale-95 shadow-lg' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300'}`}
                            >
                                <Dumbbell className="w-3.5 h-3.5 inline mr-1" />
                                Hold Deadlift
                            </button>
                        </div>
                    </div>
                </div>

                {/* Control Panel: Members, sliders, diagnostics */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Member selection and history card */}
                    <div className="bg-zinc-950/80 border border-zinc-800/40 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-black uppercase text-zinc-400 font-mono flex items-center gap-1.5"><User className="w-4 h-4 text-red-500" /> Select Active Member</label>
                            <select 
                                value={selectedMemberId}
                                onChange={handleMemberChange}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value={0} disabled>Choose a member for simulation...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.email || m.phone})</option>
                                ))}
                            </select>
                        </div>

                        {selectedMember && (
                            <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl flex-1 md:max-w-xs justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase">System Biometric Baseline</h4>
                                    <div className="text-sm font-black text-white">{selectedMember.name}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono">HRV: <span className="text-cyan-400">{selectedMember.hrv || 'N/A'}</span> | Goal: {selectedMember.fitnessGoal || 'Strength'}</div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-400 flex items-center justify-center font-black text-sm text-white">
                                    {selectedMember.name.charAt(0)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Kinetic sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/80 border border-zinc-800/40 p-6 rounded-3xl shadow-2xl">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2 mb-2">
                                <Scale className="w-3.5 h-3.5 text-cyan-400" /> Load & Valgus Inputs
                            </h3>
                            
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-mono text-zinc-400">
                                    <span>Simulated Weight:</span>
                                    <span className="font-bold text-white">{barbellWeight} kg</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="300"
                                    step="5"
                                    value={barbellWeight} 
                                    onChange={(e) => setBarbellWeight(Number(e.target.value))}
                                    className="w-full accent-cyan-500 h-1.5 bg-zinc-800 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-mono text-zinc-400">
                                    <span>Knee Flexion (Angle):</span>
                                    <span className="font-bold text-white">{squatDepth}°</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="120"
                                    step="5"
                                    value={squatDepth} 
                                    onChange={(e) => setSquatDepth(Number(e.target.value))}
                                    className="w-full accent-cyan-500 h-1.5 bg-zinc-800 rounded-lg"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl mt-2">
                                <div>
                                    <div className="text-xs font-black uppercase text-zinc-300">Knee Valgus (Collapse)</div>
                                    <div className="text-[9px] text-zinc-500">Simulate knees tilting inwards under heavy load</div>
                                </div>
                                <button 
                                    onClick={() => setKneeValgus(!kneeValgus)}
                                    className={`w-12 h-6 rounded-full p-1 transition-all ${kneeValgus ? 'bg-red-500 flex justify-end shadow-lg shadow-red-500/20' : 'bg-zinc-800 flex justify-start'}`}
                                >
                                    <span className="w-4 h-4 bg-white rounded-full block"></span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2 mb-2">
                                <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Lumbar & Spine Inputs
                            </h3>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-mono text-zinc-400">
                                    <span>Posterior Back Tilt:</span>
                                    <span className="font-bold text-white">{backTilt}°</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="90"
                                    step="5"
                                    value={backTilt} 
                                    onChange={(e) => setBackTilt(Number(e.target.value))}
                                    className="w-full accent-red-500 h-1.5 bg-zinc-800 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-mono text-zinc-400">
                                    <span>Lumbar Spinal Rounding:</span>
                                    <span className="font-bold text-red-400">{roundingFactor === 0 ? 'Optimal Neutral' : `${roundingFactor} / 10 Flexed`}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="10"
                                    step="1"
                                    value={roundingFactor} 
                                    onChange={(e) => setRoundingFactor(Number(e.target.value))}
                                    className="w-full accent-red-500 h-1.5 bg-zinc-800 rounded-lg"
                                />
                            </div>

                            {selectedMember && (selectedMember.medical_history?.pastInjuries || selectedMember.medical_history?.conditions?.length > 0) && (
                                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl mt-2">
                                    <div className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Medical Integrity Warn Index
                                    </div>
                                    <p className="text-[9px] text-zinc-400 mt-1 leading-normal">
                                        Injuries: <span className="text-white text-semibold">{selectedMember.medical_history?.pastInjuries || 'None'}</span>. Conditions: <span className="text-white text-semibold">{selectedMember.medical_history?.conditions?.join(', ') || 'None'}</span>. Vulnerability triggers active. Take cautions.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Symptom Checklist */}
                    <div className="bg-zinc-950/80 border border-zinc-800/40 p-6 rounded-3xl shadow-2xl">
                        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2 mb-4">
                            <Activity className="w-3.5 h-3.5 text-rose-400" /> Manual Symptom Check
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Interactive SVG Body Map */}
                            <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-center">
                                <InteractiveBodyMap 
                                    selectedParts={selectedBodyParts}
                                    onPartClick={toggleBodyPart}
                                />
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <h4 className="text-[10px] text-zinc-500 uppercase font-black mb-2 flex items-center justify-between">
                                        Affected Body Parts
                                        <span className="text-cyan-500 font-mono text-[9px]">{selectedBodyParts.length} Selected</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {BODY_PARTS.map(part => (
                                            <button
                                                key={part}
                                                onClick={() => toggleBodyPart(part)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedBodyParts.includes(part) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'}`}
                                            >
                                                {part}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-2 italic">Select from list or tap interactive map directly.</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] text-zinc-500 uppercase font-black mb-2 flex items-center justify-between">
                                        Pain Characterization
                                        <span className="text-amber-500 font-mono text-[9px]">{selectedPainTypes.length} Selected</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {PAIN_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => togglePainType(type)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedPainTypes.includes(type) ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Raw telemetry stats readout metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-zinc-950/80 border border-zinc-800/40 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                            <div>
                                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Simulated Foot Reaction Force</div>
                                <div className="text-3xl font-black italic text-zinc-100 mt-1">{simulatedForce} <span className="text-xs font-normal text-zinc-500">N</span></div>
                            </div>
                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 text-zinc-400 text-xs font-bold">F = ma</div>
                        </div>

                        <div className={`p-5 rounded-2xl shadow-xl flex items-center justify-between border transition-all ${aclStress > 60 ? 'bg-red-950/20 border-red-500/40' : 'bg-zinc-950/80 border-zinc-800/40'}`}>
                            <div>
                                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">ACL Tendon Strain Rating</div>
                                <div className={`text-3xl font-black italic mt-1 flex items-baseline gap-1 ${aclStress > 60 ? 'text-red-400' : 'text-cyan-400'}`}>
                                    {aclStress}% 
                                    <span className="text-[9px] font-normal uppercase text-zinc-500">{aclStress > 60 ? 'Hazard' : aclStress > 30 ? 'Load warning' : 'Safe'}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 text-cyan-400">
                                <Percent className="w-5 h-5" />
                            </div>
                        </div>

                        <div className={`p-5 rounded-2xl shadow-xl flex items-center justify-between border transition-all ${l5s1Stress > 45 ? 'bg-red-950/20 border-red-500/40' : 'bg-zinc-950/80 border-zinc-800/40'}`}>
                            <div>
                                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">L5-S1 Vertebral Pressure</div>
                                <div className={`text-3xl font-black italic mt-1 flex items-baseline gap-1 ${l5s1Stress > 45 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {l5s1Stress}%
                                    <span className="text-[9px] font-normal uppercase text-zinc-500">{l5s1Stress > 45 ? 'Critical spine' : l5s1Stress > 25 ? 'High torque' : 'Safe'}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 text-emerald-400">
                                <Percent className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Recharts live kinematic telemetry history */}
                    <div className="bg-zinc-950/80 border border-zinc-800/40 p-6 rounded-[2.5rem] shadow-2xl h-[220px]">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Real-time Kinematic Telemetry Trace
                        </h3>
                        {telemetryHistory.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center text-zinc-600 font-mono text-xs">Simulating telemetry feed streams...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={telemetryHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis dataKey="time" stroke="#444" fontSize={9} tickMargin={6} />
                                    <YAxis stroke="#444" fontSize={9} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#222', borderRadius: '12px' }}
                                        labelStyle={{ color: '#71717a', fontSize: '10px' }}
                                        itemStyle={{ fontSize: '11px', color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="aclStress" stroke="#22d3ee" strokeWidth={2.5} name="ACL Knee Strain %" dot={false} />
                                    <Line type="monotone" dataKey="l5s1Stress" stroke="#10b981" strokeWidth={2.5} name="Lumbar L5-S1 %" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Custom Medicine / Routine recommendation clinical box via Gemini */}
                    <div className="bg-gradient-to-r from-red-950/30 to-rose-950/10 border border-zinc-800 p-6 rounded-3xl shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-rose-400" /> Ask Gemini Joint Mobility Oracle
                                </h3>
                                <p className="text-[11px] text-zinc-500">Evaluate specific joint vulnerabilities and compute recovery routines instantly.</p>
                            </div>
                            <button
                                onClick={handleConsultAI}
                                disabled={loadingGemini || !selectedMember}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-650 to-rose-500 hover:from-red-600 hover:to-rose-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-red-500/20 active:scale-95 transition-all cursor-pointer shadow-lg shadow-red-950/30 disabled:opacity-50"
                            >
                                {loadingGemini ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Compute Recovery Directive
                            </button>
                        </div>

                        {loadingGemini && (
                            <div className="bg-zinc-900/60 p-4 rounded-xl flex items-center justify-center text-zinc-400 font-mono text-xs gap-3">
                                <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                                Quantum bio-mechanical vectors routing. Please wait...
                            </div>
                        )}

                        {!loadingGemini && geminiAnalysis && (
                            <div className="bg-black/60 border border-zinc-850 p-5 rounded-2xl space-y-2 text-left animate-fade-in">
                                <div className="text-[10px] font-black uppercase text-red-400 font-mono tracking-widest flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> CLINICAL VERDICT DEPLOYED
                                </div>
                                <div className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-line prose-invert">
                                    {geminiAnalysis}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InjuryOracle;
