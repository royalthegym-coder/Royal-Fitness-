import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Activity, 
    AlertTriangle, 
    ShieldAlert, 
    Zap, 
    Crosshair, 
    Volume2, 
    VolumeX, 
    User, 
    Sparkles, 
    Scale, 
    Percent, 
    Dumbbell, 
    ShieldCheck, 
    Heart, 
    Info, 
    RefreshCw, 
    Trash2, 
    Plus, 
    FileText, 
    Calendar,
    ChevronDown,
    X,
    TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { useData } from '../../context/DataProvider';
import { useGym, ReportedInjury } from '../../context/GymProvider';
import { ai } from '../../../lib/core_ai';

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
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.03)';
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

            // Radar sweep line
            const sweepY = (Math.sin(t * 1.5) + 1) * (canvas.height / 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, sweepY);
            ctx.lineTo(canvas.width, sweepY);
            ctx.stroke();

            // Scope safety target lines
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 75, 0, Math.PI * 2);
            ctx.stroke();

            const centerX = canvas.width / 2;
            const baseY = canvas.height - 30; // Ground line (ankles level)

            const tiltRad = (backTilt * Math.PI) / 180;
            const depthFactor = squatDepth / 120; // 0 to 1

            const ackX = centerX;
            const ackY = baseY;

            let kneeX = centerX - 12 - (isSquatting ? depthFactor * 18 : 0);
            let kneeY = ackY - 55 + (isSquatting ? depthFactor * 14 : 0);

            let hipX = centerX - 8 - (isSquatting ? depthFactor * 22 : isDeadlifting ? tiltRad * 16 : 0);
            let hipY = kneeY - 50 + (isSquatting ? depthFactor * 22 : isDeadlifting ? tiltRad * 4 : 0);

            let spineAngle = isDeadlifting ? tiltRad * 1.1 : isSquatting ? depthFactor * 0.45 : 0.05;
            let shoulderX = hipX + Math.sin(spineAngle) * 55;
            let shoulderY = hipY - Math.cos(spineAngle) * 55;

            const spineMidpointX = (hipX + shoulderX) / 2 - (roundingFactor * 0.95);
            const spineMidpointY = (hipY + shoulderY) / 2 - (roundingFactor * 0.4);

            let headX = shoulderX + Math.sin(spineAngle) * 14;
            let headY = shoulderY - Math.cos(spineAngle) * 14;

            let handX = shoulderX + (isDeadlifting ? 12 : 8);
            let handY = shoulderY + 45;

            const drawBoneSegment = (x1: number, y1: number, x2: number, y2: number, color: string, thickness = 3.5) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.strokeStyle = color;
                ctx.stroke();
            };

            const kneeGlow = aclStress > 60 ? 'rgba(239, 68, 68, 0.95)' : aclStress > 30 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(34, 211, 238, 0.7)';
            const spineGlow = l5s1Stress > 45 ? 'rgba(239, 68, 68, 0.95)' : l5s1Stress > 25 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.7)';
            const normalCyberGlow = 'rgba(115, 115, 115, 0.4)';

            drawBoneSegment(ackX - 35, ackY, ackX + 35, ackY, 'rgba(255,255,255,0.1)', 2.5);
            drawBoneSegment(ackX, ackY, kneeX, kneeY, normalCyberGlow, 3);
            drawBoneSegment(kneeX, kneeY, hipX, hipY, normalCyberGlow, 3.5);

            if (roundingFactor > 1.5) {
                ctx.beginPath();
                ctx.moveTo(hipX, hipY);
                ctx.quadraticCurveTo(spineMidpointX, spineMidpointY, shoulderX, shoulderY);
                ctx.lineWidth = 4.5;
                ctx.lineCap = 'round';
                ctx.strokeStyle = spineGlow;
                ctx.stroke();
            } else {
                drawBoneSegment(hipX, hipY, shoulderX, shoulderY, spineGlow, 4.5);
            }

            drawBoneSegment(shoulderX, shoulderY, headX, headY, normalCyberGlow, 2);
            drawBoneSegment(shoulderX, shoulderY, handX, handY, normalCyberGlow, 2.5);

            const drawNode = (cx: number, cy: number, radius: number, glowColor: string, labelText?: string) => {
                ctx.shadowBlur = 12;
                ctx.shadowColor = glowColor;
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (labelText) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                    ctx.font = '7.5px monospace';
                    ctx.fillText(labelText, cx + radius + 6, cy + 3);
                }
            };

            drawNode(headX, headY, 9, 'rgba(34, 211, 238, 0.85)');
            drawNode(shoulderX, shoulderY, 5, 'rgba(147, 51, 234, 0.8)');
            drawNode(kneeX, kneeY, 6, kneeGlow, 'KNEE');
            drawNode(hipX, hipY, 6.5, spineGlow, 'L5-S1');
            drawNode(ackX, ackY, 4.5, 'rgba(115, 115, 115, 0.7)');

            if (isDeadlifting) {
                const barLength = 50;
                drawBoneSegment(handX - barLength / 2, handY, handX + barLength / 2, handY, '#f43f5e', 4);
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#f43f5e';
                ctx.lineWidth = 1.5;
                ctx.fillRect(handX - barLength / 2, handY - 18, 9, 36);
                ctx.strokeRect(handX - barLength / 2, handY - 18, 9, 36);
                ctx.fillRect(handX + barLength / 2 - 9, handY - 18, 9, 36);
                ctx.strokeRect(handX + barLength / 2 - 9, handY - 18, 9, 36);
            } else if (isSquatting) {
                const barY = shoulderY + 4;
                const barLength = 52;
                drawBoneSegment(shoulderX - barLength / 2, barY, shoulderX + barLength / 2, barY, '#a855f7', 4.2);
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 1.5;
                ctx.fillRect(shoulderX - barLength / 2, barY - 16, 9, 32);
                ctx.strokeRect(shoulderX - barLength / 2, barY - 16, 9, 32);
                ctx.fillRect(shoulderX + barLength / 2 - 9, barY - 16, 9, 32);
                ctx.strokeRect(shoulderX + barLength / 2 - 9, barY - 16, 9, 32);
            }

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
                ctx.fillText("SHEAR ACTIVE", spineMidpointX - 90, spineMidpointY - 4);
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
            className="w-full h-full block bg-zinc-950 rounded-2xl border border-red-500/10 shadow-[inner_0_4px_12px_rgba(0,0,0,0.8)]"
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

export const GymInjuryOracle: React.FC = () => {
    const { members, updateMember } = useData();
    const { currentGym, reportedInjuries, reportInjury, deleteReportedInjury } = useGym();

    // Intake reporting form state
    const [selectedMemberId, setSelectedMemberId] = useState<number>(0);
    const [injuryDate, setInjuryDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [description, setDescription] = useState<string>('');
    const [recoveryProtocol, setRecoveryProtocol] = useState<string>('');
    
    // Symptom Checklist States
    const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>(['Knee']);
    const [selectedPainTypes, setSelectedPainTypes] = useState<string[]>([]);

    const toggleBodyPart = (part: string) => {
        setSelectedBodyParts(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]);
    };

    const togglePainType = (type: string) => {
        setSelectedPainTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };
    
    // UI flow controllers
    const [activeTab, setActiveTab] = useState<'report' | 'log' | 'simulator'>('report');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [selectedDbInjury, setSelectedDbInjury] = useState<ReportedInjury | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    // Audio/Voice settings
    const [voiceActive, setVoiceActive] = useState<boolean>(false);
    const lastSpeakTimeRef = useRef<number>(0);

    // Simulator input parameters
    const [simWeight, setSimWeight] = useState<number>(100);
    const [simBackTilt, setSimBackTilt] = useState<number>(15);
    const [simSquatDepth, setSimSquatDepth] = useState<number>(45);
    const [simSpineRounding, setSimSpineRounding] = useState<number>(0);
    const [simKneeValgus, setSimKneeValgus] = useState<boolean>(false);
    const [simIsSquatting, setSimIsSquatting] = useState<boolean>(false);
    const [simIsDeadlifting, setSimIsDeadlifting] = useState<boolean>(false);

    // Telemetry output structures
    const [aclStress, setAclStress] = useState<number>(0);
    const [l5s1Stress, setL5s1Stress] = useState<number>(0);
    const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);

    const activeMemberObject = useMemo(() => {
        return members.find(m => m.id === selectedMemberId) || null;
    }, [members, selectedMemberId]);

    const injuryArea = selectedBodyParts.length > 0 ? selectedBodyParts.join(', ') : 'Unspecified Target Area';

    // Initialize default selection
    useEffect(() => {
        if (members && members.length > 0 && selectedMemberId === 0) {
            setSelectedMemberId(members[0].id);
        }
    }, [members, selectedMemberId]);

    // Watch member change to preload medical constraints
    const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        setSelectedMemberId(id);
        const m = members.find(mem => mem.id === id);
        if (m) {
            // Adapt simulator values automatically
            const conditions = JSON.stringify(m.medical_history?.conditions || []).toLowerCase();
            const past = (m.medical_history?.pastInjuries || '').toLowerCase();
            if (conditions.includes('spine') || past.includes('back') || past.includes('l5')) {
                setSimSpineRounding(5);
                setSimBackTilt(40);
            } else {
                setSimSpineRounding(0);
                setSimBackTilt(15);
            }
            if (conditions.includes('knee') || past.includes('acl')) {
                setSimKneeValgus(true);
                setSimSquatDepth(85);
            } else {
                setSimKneeValgus(false);
                setSimSquatDepth(45);
            }
        }
    };

    // Calculate real-time simulator physics stresses
    useEffect(() => {
        let kneeMultiplier = 1.0;
        let backMultiplier = 1.0;

        if (activeMemberObject) {
            const condStr = JSON.stringify(activeMemberObject.medical_history?.conditions || []).toLowerCase();
            const pastInjStr = (activeMemberObject.medical_history?.pastInjuries || '').toLowerCase();
            if (condStr.includes('knee') || pastInjStr.includes('knee') || pastInjStr.includes('acl')) {
                kneeMultiplier = 1.8;
            }
            if (condStr.includes('spine') || condStr.includes('back') || pastInjStr.includes('disc')) {
                backMultiplier = 2.1;
            }
        }

        const baselineVal = simIsSquatting ? 1.35 : simIsDeadlifting ? 1.75 : 0.45;
        const gravity = 9.81;
        const totalForce = Math.round(simWeight * gravity * baselineVal);

        // ACL Stress
        const rawAclRatio = ((simWeight / 220) * 14) + ((simSquatDepth / 120) * 44) + (simKneeValgus ? 35 : 0);
        const finalAcl = Math.min(100, Math.round(rawAclRatio * kneeMultiplier));
        setAclStress(finalAcl);

        // Spine Stress
        const rawL5 = ((simWeight / 180) * 11) + ((simBackTilt / 90) * 35) + (simSpineRounding * 6.5);
        const finalL5 = Math.min(100, Math.round(rawL5 * backMultiplier));
        setL5s1Stress(finalL5);

        // Stream telemetry feed to history log
        const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTelemetryHistory(prev => {
            const next = [...prev, {
                time: nowStr,
                force: totalForce,
                acl: finalAcl,
                l5s1: finalL5
            }];
            if (next.length > 20) next.shift();
            return next;
        });

        // Safe guarded TTS warning alarms
        if (voiceActive) {
            const now = Date.now();
            if (now - lastSpeakTimeRef.current > 7000) {
                if (finalL5 > 65) {
                    speakText("Spinal risk critical! Extreme disk compression simulated. Restore pelvic alignment.");
                    lastSpeakTimeRef.current = now;
                } else if (finalAcl > 70) {
                    speakText("Vastus and ligaments strain exceeds limit. Reduce rotation knee pressure.");
                    lastSpeakTimeRef.current = now;
                }
            }
        }

    }, [simWeight, simBackTilt, simSquatDepth, simSpineRounding, simKneeValgus, simIsSquatting, simIsDeadlifting, activeMemberObject, voiceActive]);

    const speakText = (txt: string) => {
        try {
            window.speechSynthesis.cancel();
            const voiceSegment = new SpeechSynthesisUtterance(txt);
            voiceSegment.rate = 1.05;
            voiceSegment.pitch = 1.0;
            window.speechSynthesis.speak(voiceSegment);
        } catch (e) {
            console.error("Audio trigger failed", e);
        }
    };

    // Call Gemini API to generate clinical recovery protocol
    const handleGenerateAIProtocol = async () => {
        if (!activeMemberObject) {
            showNotification("Please select a valid gym member first.");
            return;
        }

        setIsGenerating(true);
        setRecoveryProtocol('');

        const promptText = `
        You are an elite, certified Sports Medicine Physician, Physical Therapist, and Athletic Biomechanist.
        Produce a comprehensive clinical rehabilitation and exercise recovery protocol for:
        
        - Gym Member: ${activeMemberObject.name} (Goal: ${activeMemberObject.fitnessGoal || 'Strength Maintenance'})
        - Injury Reported/Focus Area: ${injuryArea} (Severity Level: ${severity.toUpperCase()})
        - Specific Pain Symptoms: ${selectedPainTypes.length > 0 ? selectedPainTypes.join(', ') : 'Unspecified'}
        - Incident Details/Notes: ${description || 'No direct symptoms configured.'}
        - Biological Baseline: HRV: ${activeMemberObject.hrv || '70'}, Age: ${activeMemberObject.bio_age || 'N/A'}.

        Provide a clean, encouraging response structured in the following clear sections:
        1. **Biomechanical Ingestion Diagnostic**: Summary of local physical stress, mechanical vectors involved (e.g. shear, joint leverage), and immediate restriction requirements.
        2. **First Aid & Rest Phase** (Days 1 to 5): Target therapies (RICE, compression, passive work).
        3. **Active Mobilization & Rehab Drills** (Weeks 2 to 4): Specifically outline low-impact exercises, isometric patterns, or therapeutic stretches for the ${injuryArea}.
        4. **Strictly Forbidden Movements**: Lift variations that are highly compressed/hazardous for ${injuryArea} and must be completely avoided.
        5. **Safe Return to Loading Timeline**: Gradual build-up progression steps in percentage weights.

        Keep wording professional, actionable, highly readable for trainers, and structured in straightforward bullet notes. Do not output raw JSON or code segments.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-4-hydrogen',
                contents: promptText
            });

            setRecoveryProtocol(response.text || 'Unable to finalize recovery protocols. Bypassed.');
        } catch (err: any) {
            console.error("Gemini protocol generation failed:", err);
            setRecoveryProtocol("The live AI intelligence line was interrupted. Try again or check your environment credentials.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Commit injury log to GymProvider state for deep data persistence!
    const handleCommitInjuryReport = () => {
        if (!activeMemberObject) {
            showNotification("Select a member first.");
            return;
        }

        if (!recoveryProtocol) {
            showNotification("Please generate the AI Recovery Protocol before saving.");
            return;
        }

        // Commit via GymProvider hook
        reportInjury({
            gymId: currentGym.gymId || 'fitness_future_01',
            memberId: activeMemberObject.id,
            memberName: activeMemberObject.name,
            injuryDate: injuryDate,
            injuryArea: injuryArea,
            severity: severity,
            description: description,
            recoveryProtocol: recoveryProtocol
        });

        // Parse member conditions & update medical metadata dynamically as well!
        const updatedConditions = [...(activeMemberObject.medical_history?.conditions || [])];
        if (!updatedConditions.includes(`${injuryArea} Injury`)) {
            updatedConditions.push(`${injuryArea} Injury`);
        }

        const existingPast = activeMemberObject.medical_history?.pastInjuries || '';
        const newPastSection = `${injuryArea} (${severity} reported on ${injuryDate})`;
        const updatedPast = existingPast 
            ? `${existingPast}; ${newPastSection}` 
            : newPastSection;

        const updatedMem = {
            ...activeMemberObject,
            medical_history: {
                ...activeMemberObject.medical_history,
                conditions: updatedConditions,
                pastInjuries: updatedPast,
                riskLevel: severity === 'critical' || severity === 'high' ? 'High' : 'Medium'
            }
        };

        updateMember(updatedMem as any);

        showNotification(`Injury record for ${activeMemberObject.name} successfully registered & persistent!`);
        
        // Reset local reporting form
        setDescription('');
        setRecoveryProtocol('');
        setActiveTab('log'); // Jump to logs tab
    };

    const handleRemoveLog = (id: string, memberId: number, area: string) => {
        deleteReportedInjury(id);
        
        // Optionally revert condition from member to represent resolution!
        const targetMember = members.find(m => m.id === memberId);
        if (targetMember) {
            const cleanConditions = (targetMember.medical_history?.conditions || [])
                .filter(c => c !== `${area} Injury`);

            updateMember({
                ...targetMember,
                medical_history: {
                    ...targetMember.medical_history,
                    conditions: cleanConditions
                }
            } as any);
        }

        showNotification("Injury report resolved and cleared from records.");
        if (selectedDbInjury?.id === id) {
            setSelectedDbInjury(null);
        }
    };

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
    };

    // Filter injuries to current gym ID to respect Multi-tenant data segregation
    const filteredLogs = useMemo(() => {
        return reportedInjuries.filter(log => log.gymId === currentGym.gymId);
    }, [reportedInjuries, currentGym]);

    return (
        <div className="min-h-screen bg-black/5 text-white p-6 space-y-6">
            
            {/* Top Notifications Banner */}
            {notification && (
                <div className="fixed top-6 right-6 z-50 bg-amber-500 text-black px-6 py-3.5 rounded-2xl shadow-2xl font-bold font-mono text-xs flex items-center gap-3 animate-bounce border border-white/20">
                    <Zap className="w-5 h-5 text-black animate-pulse" />
                    <span>{notification}</span>
                    <button onClick={() => setNotification(null)} className="hover:opacity-80 ml-2">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Main Header Widget */}
            <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-red-500/20 to-red-950 border border-red-500/30 rounded-2xl">
                        <Activity className="w-8 h-8 text-red-500 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider flex items-center gap-3">
                            Gym Injury <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Oracle</span>
                        </h1>
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
                            Active Tenant: <span className="text-red-400 font-bold">{currentGym.gymName}</span> | Skeletal Recovery Engine
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => {
                            const nextState = !voiceActive;
                            setVoiceActive(nextState);
                            speakText(nextState ? "Biomechanical voice warning protocol enabled." : "Voice mode disabled.");
                        }}
                        className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs uppercase font-black tracking-wider transition-colors ${voiceActive ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                    >
                        {voiceActive ? <Volume2 className="w-4 h-4 text-red-400 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
                        {voiceActive ? 'Alarms Engaged' : 'Mute Telemetry'}
                    </button>

                    <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <button 
                            onClick={() => setActiveTab('report')}
                            className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'report' ? 'bg-red-650 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Report Incident
                        </button>
                        <button 
                            onClick={() => setActiveTab('log')}
                            className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all relative ${activeTab === 'log' ? 'bg-red-650 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            History Log
                            {filteredLogs.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black animate-pulse">
                                    {filteredLogs.length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('simulator')}
                            className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'simulator' ? 'bg-red-650 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Load Simulator
                        </button>
                    </div>
                </div>
            </div>

            {/* Primary Tab Contents */}
            {activeTab === 'report' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                    {/* Left side Form inputs */}
                    <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800/60 p-6 rounded-[2rem] shadow-2xl space-y-6">
                        <div className="border-b border-zinc-800/60 pb-3 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-red-400">Physiology Intake Form</h3>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Register trauma vectors to formulate recovery steps</p>
                            </div>
                            <User className="w-5 h-5 text-red-500" />
                        </div>

                        {/* Member Picker */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-red-500" /> Select Member
                            </label>
                            <select 
                                value={selectedMemberId}
                                onChange={handleMemberSelect}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value={0} disabled>Choose active member...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.phone || m.email || 'No Contact'})</option>
                                ))}
                            </select>
                        </div>

                        {/* Interactive Body Map & Symptom Checklist */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-zinc-400" /> Target Area & Symptoms Check
                            </h4>
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-6">
                                <div className="flex-none bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 w-[160px] flex items-center justify-center">
                                    <InteractiveBodyMap selectedParts={selectedBodyParts} onPartClick={toggleBodyPart} />
                                </div>
                                <div className="flex-1 space-y-4">
                                     <div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase mb-2 flex justify-between">
                                            <span>Affected Parts</span>
                                            <span className="text-cyan-500">{selectedBodyParts.length} Selected</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {BODY_PARTS.map(part => (
                                                <button
                                                    type="button"
                                                    key={part}
                                                    onClick={() => toggleBodyPart(part)}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${selectedBodyParts.includes(part) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                                >
                                                    {part}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-[9px] text-zinc-600 mt-2 italic">Select from list or click interactive map directly.</div>
                                     </div>
                                     <div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase mb-2 flex justify-between">
                                            <span>Pain Characterization</span>
                                            <span className="text-amber-500">{selectedPainTypes.length} Selected</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {PAIN_TYPES.map(type => (
                                                <button
                                                    type="button"
                                                    key={type}
                                                    onClick={() => togglePainType(type)}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${selectedPainTypes.includes(type) ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Injury Date
                            </label>
                            <input 
                                type="date"
                                value={injuryDate}
                                onChange={(e) => setInjuryDate(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        {/* Injury Severity selection cards */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                                Severity Tier
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['low', 'medium', 'high', 'critical'] as const).map(lev => (
                                    <button
                                        type="button"
                                        key={lev}
                                        onClick={() => setSeverity(lev)}
                                        className={`py-2 text-[10px] uppercase font-black rounded-lg border transition-all ${
                                            severity === lev 
                                                ? lev === 'critical' ? 'bg-red-600 border-red-500 text-white shadow-lg'
                                                : lev === 'high' ? 'bg-orange-500 border-orange-400 text-white shadow-lg'
                                                : lev === 'medium' ? 'bg-amber-500 border-amber-400 text-black shadow-lg font-bold'
                                                : 'bg-emerald-500 border-emerald-400 text-white shadow-lg'
                                                : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:bg-zinc-800'
                                        }`}
                                    >
                                        {lev}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Symptoms Text */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                                Symptom Details / Incident Mechanism
                            </label>
                            <textarea
                                placeholder="Describe precisely how the trauma happened, range of motion limitations, acute pain thresholds, etc."
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-zinc-650"
                            />
                        </div>

                        {/* Action buttons */}
                        <button
                            onClick={handleGenerateAIProtocol}
                            disabled={isGenerating || !selectedMemberId}
                            className="w-full py-4 bg-gradient-to-r from-red-650 to-rose-500 hover:from-red-600 hover:to-rose-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg disabled:opacity-40"
                        >
                            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white animate-pulse" />}
                            Generate AI Protocols
                        </button>
                    </div>

                    {/* Right side generated interactive clinical protocol */}
                    <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800/60 p-6 rounded-[2rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                        
                        <div className="absolute top-4 right-6 flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase">
                            <Plus className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                            Kinematic Prescription
                        </div>

                        {/* Inside block */}
                        <div className="h-full flex flex-col justify-between min-h-[350px]">
                            {isGenerating ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 animate-pulse">
                                    <RefreshCw className="w-12 h-12 text-red-500 animate-spin" />
                                    <div>
                                        <h4 className="text-sm font-black uppercase text-white tracking-widest">Routing AI Sports Physio Directive</h4>
                                        <p className="text-[10px] text-zinc-400 font-mono mt-1">Analyzing pre-existing member vulnerabilities and calculating bio-reconditioning loops...</p>
                                    </div>
                                </div>
                            ) : recoveryProtocol ? (
                                <div className="space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400 border-b border-zinc-800/60 pb-2">
                                            <ShieldCheck className="w-4 h-4" /> AI Diagnostics successfully compiled
                                        </div>
                                        <div className="bg-black/60 border border-zinc-850 p-4 rounded-xl text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-line overflow-y-auto max-h-[380px]">
                                            {recoveryProtocol}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-xs font-black text-white">Commit Injury Recovery Protocol?</h4>
                                            <p className="text-[9.5px] text-zinc-400 mt-0.5">Saves directly to {activeMemberObject?.name}'s medical ledger permanently.</p>
                                        </div>
                                        <button
                                            onClick={handleCommitInjuryReport}
                                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Save Record
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 text-zinc-550 border-2 border-dashed border-zinc-800 rounded-2xl">
                                    <FileText className="w-12 h-12 text-zinc-700" />
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">No Prescribed Protocol Compiled</h4>
                                        <p className="text-[10px] mt-1 leading-normal max-w-sm mx-auto">
                                            Complete the left physiology form and trigger Gemini to receive clinical mobilization stages, restricted moves, and expected loading timeline.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'log' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                    {/* Left side list of injuries registered */}
                    <div className="lg:col-span-4 bg-zinc-950 border border-zinc-800/60 p-6 rounded-[2rem] shadow-2xl flex flex-col space-y-4">
                        <div className="border-b border-zinc-800/65 pb-3">
                            <h3 className="text-sm font-black uppercase text-zinc-400 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-red-500 animate-pulse" /> Active Injury Ledger ({filteredLogs.length})
                            </h3>
                            <p className="text-[9.5px] text-zinc-500 font-mono mt-0.5">Multi-tenant isolation active matching current gym ID</p>
                        </div>

                        {filteredLogs.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2 border border-dashed border-zinc-850 rounded-xl min-h-[300px]">
                                <ShieldCheck className="w-10 h-10 text-zinc-600" />
                                <div className="text-xs font-bold font-mono">ALL SYSTEMS CLEAN</div>
                                <p className="text-[9px] text-zinc-500">Zero active skeletal injuries registered for this gym.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1">
                                {filteredLogs.map(log => (
                                    <div 
                                        key={log.id} 
                                        onClick={() => setSelectedDbInjury(log)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                            selectedDbInjury?.id === log.id 
                                                ? 'bg-red-500/10 border-red-500/40' 
                                                : 'bg-zinc-900/60 border-zinc-850 hover:bg-zinc-900 hover:border-zinc-800'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h4 className="text-xs font-black text-white">{log.memberName}</h4>
                                                <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">{log.injuryArea} • {log.injuryDate}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                                log.severity === 'critical' ? 'bg-red-600 text-white'
                                                : log.severity === 'high' ? 'bg-orange-500 text-white'
                                                : log.severity === 'medium' ? 'bg-amber-500 text-black font-bold'
                                                : 'bg-emerald-500 text-white'
                                            }`}>
                                                {log.severity}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-2 line-clamp-1 italic">
                                            "{log.description || 'No notes added.'}"
                                        </p>
                                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-zinc-800/50">
                                            <span className="text-[8px] font-mono text-zinc-500 uppercase">View AI Protocol</span>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveLog(log.id, log.memberId, log.injuryArea);
                                                }}
                                                className="p-1 hover:text-red-500 text-zinc-500 transition-colors"
                                                title="Resolve Injury Record"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right side Detail lookup */}
                    <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800/60 p-6 rounded-[2rem] shadow-2xl">
                        {selectedDbInjury ? (
                            <div className="space-y-5 text-left h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-4">
                                        <div>
                                            <h2 className="text-xl font-bold uppercase">{selectedDbInjury.memberName}</h2>
                                            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-zinc-500" /> Reported Date: <span className="text-zinc-200 font-semibold">{selectedDbInjury.injuryDate}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-zinc-90% border border-zinc-800 text-zinc-300 text-xs font-mono rounded-lg">
                                                Area/Joint: {selectedDbInjury.injuryArea}
                                            </span>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                                                selectedDbInjury.severity === 'critical' ? 'bg-red-650 text-white'
                                                : selectedDbInjury.severity === 'high' ? 'bg-orange-500 text-white'
                                                : selectedDbInjury.severity === 'medium' ? 'bg-amber-500 text-black font-bold'
                                                : 'bg-emerald-500 text-white'
                                            }`}>
                                                Severity: {selectedDbInjury.severity}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Incident Symptoms notes */}
                                    <div className="mt-4 p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Physiological Symptom Log</h4>
                                        <p className="text-xs text-zinc-300 leading-normal italic">
                                            "{selectedDbInjury.description || 'No specific description logged during first evaluation.'}"
                                        </p>
                                    </div>

                                    {/* Calculated Protocol and details */}
                                    <div className="mt-5 space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5" /> REHAB PROTOCOL DIRECTIVE
                                        </h4>
                                        <div className="bg-black/60 border border-zinc-850 p-5 rounded-2xl text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line overflow-y-auto max-h-[300px]">
                                            {selectedDbInjury.recoveryProtocol}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between bg-zinc-900 p-4 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                        <div>
                                            <h4 className="text-xs font-black text-white">Mark Injury as RESOLVED?</h4>
                                            <p className="text-[9.5px] text-zinc-400">Removes the stress alert constraints from the active member's medical profile.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveLog(selectedDbInjury.id, selectedDbInjury.memberId, selectedDbInjury.injuryArea)}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black uppercase text-xs rounded-lg shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                                    >
                                        Resolve & Close Case
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 text-center text-zinc-550 border border-dashed border-zinc-800 rounded-3xl">
                                <FileText className="w-14 h-14 text-zinc-700 animate-pulse" />
                                <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mt-3">Select reported record for full review</h3>
                                <p className="text-[10px] text-zinc-500 max-w-xs mx-auto mt-1 leading-normal">
                                    Browse the left ledger history of previously submitted cases and restore AI protocols, active restrictions, and therapist prescriptions immediately.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'simulator' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                    {/* Visualizer card */}
                    <div className="lg:col-span-4 bg-zinc-950 border border-zinc-800/60 p-6 rounded-[2.5rem] flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-4 left-6 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                            <Crosshair className="w-3.5 h-3.5 text-red-500 animate-spin-slow" />
                            KINEMATIC FEED SPECTROMETER
                        </div>

                        {/* Glowing 2D skeletal body */}
                        <div className="relative w-48 h-64 my-6">
                            <SkeletonViewer2D 
                                isDeadlifting={simIsDeadlifting} 
                                isSquatting={simIsSquatting}
                                backTilt={simBackTilt}
                                squatDepth={simSquatDepth}
                                roundingFactor={simSpineRounding}
                                aclStress={aclStress}
                                l5s1Stress={l5s1Stress}
                            />
                        </div>

                        {/* Interactive Lift selectors */}
                        <div className="w-full space-y-3">
                            <div className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider text-center">Simulate Active Lift</div>
                            <div className="flex gap-3">
                                <button
                                    onMouseDown={() => { setSimIsSquatting(true); setSimIsDeadlifting(false); }}
                                    onMouseUp={() => setSimIsSquatting(false)}
                                    onMouseLeave={() => setSimIsSquatting(false)}
                                    onTouchStart={() => { setSimIsSquatting(true); setSimIsDeadlifting(false); }}
                                    onTouchEnd={() => setSimIsSquatting(false)}
                                    className={`flex-1 py-3 text-center uppercase tracking-widest font-black text-[10px] rounded-xl border transition-all ${simIsSquatting ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 scale-95 shadow-lg' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300'}`}
                                >
                                    <Dumbbell className="w-3.5 h-3.5 inline mr-1" />
                                    Hold Squat
                                </button>
                                <button
                                    onMouseDown={() => { setSimIsDeadlifting(true); setSimIsSquatting(false); }}
                                    onMouseUp={() => setSimIsDeadlifting(false)}
                                    onMouseLeave={() => setSimIsDeadlifting(false)}
                                    onTouchStart={() => { setSimIsDeadlifting(true); setSimIsSquatting(false); }}
                                    onTouchEnd={() => setSimIsDeadlifting(false)}
                                    className={`flex-1 py-3 text-center uppercase tracking-widest font-black text-[10px] rounded-xl border transition-all ${simIsDeadlifting ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 scale-95 shadow-lg' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300'}`}
                                >
                                    <Dumbbell className="w-3.5 h-3.5 inline mr-1" />
                                    Hold Deadlift
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Inputs panel */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        
                        {/* Member lookup details */}
                        {activeMemberObject && (
                            <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl flex items-center justify-between gap-4 shadow-xl">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-widest">Active Biometric Profiler Input</h4>
                                    <div className="text-base font-bold text-white">{activeMemberObject.name}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono">
                                        Goal: {activeMemberObject.fitnessGoal || 'Overall Fitness'} | Base HRV: <span className="text-cyan-400 font-bold">{activeMemberObject.hrv || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-805 rounded-xl text-center text-xs text-zinc-400 font-mono">
                                    Age Risk Base: <span className="text-rose-400 font-bold">{activeMemberObject.bio_age || 'N/A'} yrs</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950 border border-zinc-800/60 p-6 rounded-3xl shadow-2xl">
                            
                            {/* Knee mechanics group */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-cyan-400 border-b border-zinc-850 pb-2 flex items-center gap-1.5">
                                    <Scale className="w-4 h-4 text-cyan-400" /> Lower Extremity Joint Factors
                                </h3>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                                        <span>Barbell Mass Load:</span>
                                        <span className="font-bold text-white">{simWeight} kg</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="20" 
                                        max="300"
                                        step="5"
                                        value={simWeight} 
                                        onChange={(e) => setSimWeight(Number(e.target.value))}
                                        className="w-full accent-cyan-500 h-1.5 bg-zinc-850 rounded-lg"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                                        <span>Knee Hinge Flexion:</span>
                                        <span className="font-bold text-white">{simSquatDepth}°</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="120"
                                        step="5"
                                        value={simSquatDepth} 
                                        onChange={(e) => setSimSquatDepth(Number(e.target.value))}
                                        className="w-full accent-cyan-500 h-1.5 bg-zinc-850 rounded-lg"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3.5 bg-zinc-900/65 border border-zinc-850 rounded-xl">
                                    <div>
                                        <div className="text-xs font-black uppercase text-zinc-300">Knee Valgus (Inward collapse)</div>
                                        <div className="text-[9.5px] text-zinc-500 mt-0.5">Toggle knee adduction compression</div>
                                    </div>
                                    <button 
                                        onClick={() => setSimKneeValgus(!simKneeValgus)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${simKneeValgus ? 'bg-red-500 flex justify-end shadow-md shadow-red-500/20' : 'bg-zinc-800 flex justify-start'}`}
                                    >
                                        <span className="w-4 h-4 bg-white rounded-full block"></span>
                                    </button>
                                </div>
                            </div>

                            {/* Spinal mechanics group */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-rose-400 border-b border-zinc-850 pb-2 flex items-center gap-1.5">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Spinal & Axial Shear Vectors
                                </h3>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                                        <span>Spinous Pelvic Tilt:</span>
                                        <span className="font-bold text-white">{simBackTilt}°</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="90"
                                        step="5"
                                        value={simBackTilt} 
                                        onChange={(e) => setSimBackTilt(Number(e.target.value))}
                                        className="w-full accent-rose-500 h-1.5 bg-zinc-850 rounded-lg"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                                        <span>Lumbar Spine Flexion Rounding:</span>
                                        <span className="font-bold text-orange-400">{simSpineRounding === 0 ? 'Ideal Flat Spinal posture' : `${simSpineRounding}/10 Flexed Spinal Curve`}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="10"
                                        step="1"
                                        value={simSpineRounding} 
                                        onChange={(e) => setSimSpineRounding(Number(e.target.value))}
                                        className="w-full accent-rose-500 h-1.5 bg-zinc-850 rounded-lg"
                                    />
                                </div>

                                {activeMemberObject && (activeMemberObject.medical_history?.pastInjuries || activeMemberObject.medical_history?.conditions?.length > 0) && (
                                    <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-left leading-normal">
                                        <div className="text-[9.5px] font-black uppercase text-red-400 flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Biomechanic Alert Engaged
                                        </div>
                                        <ul className="text-[9px] text-zinc-400 mt-1 space-y-0.5">
                                            <li>• Conditions: <span className="text-zinc-200">{activeMemberObject.medical_history?.conditions?.join(', ') || 'N/A'}</span></li>
                                            <li>• Trauma Baseline: <span className="text-zinc-200 font-semibold">{activeMemberObject.medical_history?.pastInjuries || 'None logged.'}</span></li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Realtime percentage meters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${aclStress > 60 ? 'bg-red-950/20 border-red-500/40' : 'bg-zinc-950 border-zinc-800/60'}`}>
                                <div>
                                    <h4 className="text-[9.5px] font-mono text-zinc-500 uppercase">ACL Knee Joint Strain</h4>
                                    <div className={`text-3xl font-black italic mt-1 flex items-baseline gap-1.5 ${aclStress > 60 ? 'text-red-400' : 'text-cyan-400'}`}>
                                        {aclStress}%
                                        <span className="text-[10px] font-normal uppercase text-zinc-500">{aclStress > 60 ? 'Critical hazard' : aclStress > 30 ? 'Loaded warning' : 'Optimal'}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-cyan-400 font-black font-mono">
                                    <Percent className="w-5 h-5" />
                                </div>
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${l5s1Stress > 45 ? 'bg-red-950/20 border-red-500/40' : 'bg-zinc-950 border-zinc-800/60'}`}>
                                <div>
                                    <h4 className="text-[9.5px] font-mono text-zinc-500 uppercase">L5-S1 Spine Shear Torque</h4>
                                    <div className={`text-3xl font-black italic mt-1 flex items-baseline gap-1.5 ${l5s1Stress > 45 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {l5s1Stress}%
                                        <span className="text-[10px] font-normal uppercase text-zinc-500">{l5s1Stress > 45 ? 'Critical spine' : l5s1Stress > 25 ? 'Moderate load' : 'Optimal'}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-emerald-400 font-black font-mono">
                                    <Percent className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Line trace graph */}
                        <div className="bg-zinc-950 border border-zinc-800/60 p-6 rounded-[2rem] shadow-2xl h-[230px]">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-emerald-400" /> Vector Stress Telemetry Timeline Trace
                            </h3>
                            {telemetryHistory.length === 0 ? (
                                <div className="h-full w-full flex items-center justify-center text-zinc-600 text-xs font-mono">Stream inactive. Hold squat/deadlift button above to load dynamic vectors.</div>
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
                                        <Line type="monotone" dataKey="acl" stroke="#22d3ee" strokeWidth={2.5} name="ACL Joint Load %" dot={false} />
                                        <Line type="monotone" dataKey="l5s1" stroke="#10b981" strokeWidth={2.5} name="L5-S1 Spinal Shear %" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GymInjuryOracle;
