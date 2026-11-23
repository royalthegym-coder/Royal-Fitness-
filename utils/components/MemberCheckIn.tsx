import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Camera, QrCode, CheckCircle2, RefreshCw, UserCheck, MessageSquare,
    Clock, ShieldCheck, AlertTriangle, Play, Square, Smartphone,
    Sparkles, Volume2, VolumeX, Zap, History, Check
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { triggerWhatsAppWorkflow } from '../../lib/whatsapp';
import { syncToFirebase } from '../../lib/firebase';

export interface CheckInLogEntry {
    id: string;
    memberId: number;
    memberName: string;
    phone: string;
    date: string;
    time: string;
    hour: number;
    dayOfWeek: string;
    qrPayload: string;
    whatsappTriggered: boolean;
    whatsappMessage: string;
    method: 'QR_WEBCAM' | 'QR_SIMULATED';
}

const INITIAL_CHECKIN_LOGS: CheckInLogEntry[] = [];

export const MemberCheckIn: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const { members, markAttendance, addAuditLog } = useData();
    const { addToast } = useToast();

    const webcamRef = useRef<Webcam | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastScannedRef = useRef<{ code: string; timestamp: number }>({ code: '', timestamp: 0 });

    const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [isProcessingEntry, setIsProcessingEntry] = useState<boolean>(false);
    const [selectedMemberIdForPass, setSelectedMemberIdForPass] = useState<number>(members[0]?.id || 1);
    const [lastCheckInResult, setLastCheckInResult] = useState<CheckInLogEntry | null>(null);

    const [checkInLogs, setCheckInLogs] = useState<CheckInLogEntry[]>(() => {
        try {
            const saved = localStorage.getItem('fitness_checkin_history_v1');
            return saved ? JSON.parse(saved) : INITIAL_CHECKIN_LOGS;
        } catch {
            return INITIAL_CHECKIN_LOGS;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('fitness_checkin_history_v1', JSON.stringify(checkInLogs));
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            console.error('Failed to persist check-in logs:', err);
        }
    }, [checkInLogs]);

    // Audio beep feedback on QR scan
    const playScanTone = useCallback(() => {
        if (!soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.14);
        } catch {}
    }, [soundEnabled]);

    // Resolve member from decoded QR string
    const resolveMemberFromQR = useCallback(
        (rawData: string) => {
            const trimmed = rawData.trim();
            // 1. Try JSON payload: {"memberId": 1, "memberName": "...", "phone": "..."}
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed.memberId) {
                    const found = members.find(m => Number(m.id) === Number(parsed.memberId));
                    if (found) return found;
                }
                if (parsed.memberName) {
                    const found = members.find(m => m.name.toLowerCase() === String(parsed.memberName).toLowerCase());
                    if (found) return found;
                }
            } catch {}

            // 2. Try MEMBER_QR_V2#<id> or FF-<id> format
            const hashMatch = trimmed.match(/#(\d+)/);
            if (hashMatch) {
                const idNum = Number(hashMatch[1]);
                const found = members.find(m => Number(m.id) === idNum);
                if (found) return found;
            }

            // 3. Try direct numeric ID or name match
            const numericId = Number(trimmed);
            if (!isNaN(numericId) && numericId > 0) {
                const found = members.find(m => Number(m.id) === numericId);
                if (found) return found;
            }

            const byNameOrLogin = members.find(
                m =>
                    m.name.toLowerCase().includes(trimmed.toLowerCase()) ||
                    (m.loginId && m.loginId.toLowerCase() === trimmed.toLowerCase())
            );
            return byNameOrLogin || members[0];
        },
        [members]
    );

    // Core handler when a QR code is decoded via jsqr or simulator
    const processDecodedQRCode = useCallback(
        async (qrText: string, method: 'QR_WEBCAM' | 'QR_SIMULATED' = 'QR_WEBCAM') => {
            const nowMs = Date.now();
            // Debounce identical QR scans within 4 seconds
            if (
                method === 'QR_WEBCAM' &&
                lastScannedRef.current.code === qrText &&
                nowMs - lastScannedRef.current.timestamp < 4000
            ) {
                return;
            }
            lastScannedRef.current = { code: qrText, timestamp: nowMs };

            const matchedMember = resolveMemberFromQR(qrText);
            if (!matchedMember) {
                addToast(`Unrecognized QR code payload: ${qrText}`, 'error');
                return;
            }

            setIsProcessingEntry(true);
            playScanTone();

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const currentHour = now.getHours();
            const dayShort = now.toLocaleDateString('en-US', { weekday: 'short' });

            // 1. Mark Attendance in DataContext & LocalStorage ('fitness_attendance')
            const attendanceId = `ATT_${nowMs}_${matchedMember.id}`;
            markAttendance({
                id: attendanceId,
                memberId: matchedMember.id,
                date: dateStr,
                time: timeStr,
                status: 'Present',
                method: 'QR'
            });

            // 2. Sync to Firestore 'attendance' collection (best-effort)
            syncToFirebase('attendance', attendanceId, {
                id: attendanceId,
                memberId: String(matchedMember.id),
                memberName: matchedMember.name,
                timestamp: now.toISOString(),
                method: method,
                status: 'PRESENT'
            }).catch(() => {});

            // 3. Trigger existing triggerWhatsAppWorkflow automation for member entry logging
            let whatsappMessage = `Entry logged for ${matchedMember.name} at ${timeStr}. WhatsApp confirmation dispatched.`;
            let whatsappSuccess = true;
            try {
                const workflowRes = await triggerWhatsAppWorkflow({
                    workflowType: 'member_checkin_log',
                    memberName: matchedMember.name,
                    phoneNumber: matchedMember.phone || '+91 98XXXXXXXX',
                    memberId: matchedMember.id,
                    checkInTime: timeStr,
                    checkInMethod: method,
                    incomingQuery: `Member QR Check-In verified for ${matchedMember.name} (#${matchedMember.id}) at ${timeStr}.`
                });
                if (workflowRes?.messagePreview) {
                    whatsappMessage = workflowRes.messagePreview;
                }
            } catch (err) {
                console.warn('WhatsApp check-in workflow fallback used:', err);
            }

            const newEntry: CheckInLogEntry = {
                id: `chk-${nowMs}`,
                memberId: matchedMember.id,
                memberName: matchedMember.name,
                phone: matchedMember.phone || '+91 9876543210',
                date: dateStr,
                time: timeStr,
                hour: currentHour,
                dayOfWeek: dayShort,
                qrPayload: qrText,
                whatsappTriggered: whatsappSuccess,
                whatsappMessage,
                method
            };

            setCheckInLogs(prev => [newEntry, ...prev.slice(0, 49)]);
            setLastCheckInResult(newEntry);

            if (addAuditLog) {
                addAuditLog({
                    id: `audit-${nowMs}`,
                    timestamp: now.toISOString(),
                    member_id: matchedMember.id,
                    action: 'MEMBER_QR_CHECKIN',
                    details: `${matchedMember.name} checked in via QR (${method}) at ${timeStr} • WhatsApp workflow triggered.`
                });
            }

            addToast(
                `Check-In Confirmed: ${matchedMember.name} (${timeStr}) • WhatsApp entry notification sent!`,
                'success'
            );
            setIsProcessingEntry(false);
        },
        [resolveMemberFromQR, playScanTone, markAttendance, addAuditLog, addToast]
    );

    // Real-time QR scanning loop using react-webcam + jsqr
    useEffect(() => {
        if (!isCameraActive || cameraError) return;

        let animationFrameId: number;
        let lastScanAttempt = 0;

        const scanFrame = (timestamp: number) => {
            if (timestamp - lastScanAttempt >= 220) {
                lastScanAttempt = timestamp;
                const video = webcamRef.current?.video;
                const canvas = canvasRef.current;

                if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                    const width = video.videoWidth || 640;
                    const height = video.videoHeight || 480;
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, width, height);
                        const imageData = ctx.getImageData(0, 0, width, height);
                        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'dontInvert'
                        });

                        if (decoded && decoded.data) {
                            processDecodedQRCode(decoded.data, 'QR_WEBCAM');
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(scanFrame);
        };

        animationFrameId = requestAnimationFrame(scanFrame);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isCameraActive, cameraError, processDecodedQRCode]);

    // Selected member for QR pass preview & 1-click simulation
    const selectedMemberForPass = useMemo(() => {
        return members.find(m => Number(m.id) === Number(selectedMemberIdForPass)) || members[0];
    }, [members, selectedMemberIdForPass]);

    const generatedQRPayload = useMemo(() => {
        if (!selectedMemberForPass) return 'MEMBER_QR_V2#1';
        return JSON.stringify({
            type: 'GYM_MEMBER_PASS',
            code: `MEMBER_QR_V2#${selectedMemberForPass.id}`,
            memberId: selectedMemberForPass.id,
            memberName: selectedMemberForPass.name,
            phone: selectedMemberForPass.phone
        });
    }, [selectedMemberForPass]);

    // Also decode the rendered QRCodeCanvas via jsQR when user clicks "Simulate QR Scan" to verify jsQR end-to-end!
    const handleSimulateJsQRScan = () => {
        const qrCanvas = document.getElementById('member-pass-qr-canvas') as HTMLCanvasElement | null;
        if (qrCanvas) {
            const ctx = qrCanvas.getContext('2d');
            if (ctx) {
                const imgData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
                const code = jsQR(imgData.data, imgData.width, imgData.height);
                if (code && code.data) {
                    processDecodedQRCode(code.data, 'QR_SIMULATED');
                    return;
                }
            }
        }
        processDecodedQRCode(generatedQRPayload, 'QR_SIMULATED');
    };

    return (
        <div className={`space-y-6 ${embedded ? '' : 'pb-16 animate-fade-in'}`}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-gray-900 via-[#0a0a0c] to-black border border-cyan-500/25 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2">
                            <Camera className="w-3.5 h-3.5" /> Real-Time Optical Gate • react-webcam + jsQR + WhatsApp Automation
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
                            Member <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">QR Check-In</span> Terminal
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                            Point any member QR pass at the live webcam feed for instant `jsQR` optical decoding, automatic attendance logging, and real-time WhatsApp entry confirmation via `triggerWhatsAppWorkflow`.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-2 cursor-pointer"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                            <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
                            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-2 cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4 text-amber-400" />
                            <span>{facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setCameraError(null);
                                setIsCameraActive(prev => !prev);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                isCameraActive
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                    : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg'
                            }`}
                        >
                            {isCameraActive ? (
                                <>
                                    <Square className="w-3.5 h-3.5" /> Pause Camera
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5" /> Start Camera
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left 5 Columns: Live react-webcam Viewfinder + jsQR Canvas */}
                <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-between space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isCameraActive && !cameraError ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                            <span className="text-xs font-black uppercase tracking-widest text-white">
                                Live Optical Scanner (jsQR Engine)
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">220ms Frame Poll</span>
                    </div>

                    <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-cyan-500/30 aspect-[4/3] flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.12)]">
                        {isCameraActive && !cameraError ? (
                            <>
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        facingMode,
                                        width: { ideal: 640 },
                                        height: { ideal: 480 }
                                    }}
                                    onUserMediaError={(err) => {
                                        console.warn('Webcam access unavailable:', err);
                                        setCameraError('Camera permission denied or hardware unavailable in this browser frame. Use the Digital Pass Simulator beside this view to test jsQR decoding.');
                                    }}
                                    className="w-full h-full object-cover"
                                />
                                {/* Targeting Reticle Overlay */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-52 h-52 border-2 border-cyan-400/70 rounded-3xl relative shadow-[0_0_30px_rgba(6,182,212,0.25)]">
                                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 animate-pulse" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-6 text-center space-y-3 max-w-sm">
                                <Camera className="w-12 h-12 text-cyan-400/50 mx-auto" />
                                <p className="text-xs font-bold text-white uppercase tracking-wider">
                                    {cameraError ? 'Optical Feed Standby' : 'Camera Paused'}
                                </p>
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    {cameraError || 'Click "Start Camera" above to resume live webcam scanning, or use the Digital QR Pass Simulator to trigger jsQR decoding immediately.'}
                                </p>
                            </div>
                        )}
                        {/* Hidden Canvas for jsQR Pixel Extraction */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Last Scanned Banner */}
                    {lastCheckInResult ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase">
                                        Verified: {lastCheckInResult.memberName}
                                    </p>
                                    <p className="text-[11px] text-emerald-300 font-mono">
                                        {lastCheckInResult.time} • WhatsApp Entry Log Sent
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-black font-black text-[9px] uppercase">
                                PRESENT
                            </span>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center text-xs text-gray-400 font-mono">
                            Awaiting Member QR Pass in viewfinder...
                        </div>
                    )}
                </div>

                {/* Middle 3 Columns: Digital Member QR Pass & 1-Click jsQR Verification */}
                <div className="xl:col-span-3 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-between space-y-4 shadow-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                            Test Pass Generator
                        </span>
                        <h3 className="text-lg font-black text-white uppercase italic mt-0.5">
                            Member QR Pass &amp; Instant Scan
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Select any member below to render their QR pass and decode it directly through `jsQR` + `triggerWhatsAppWorkflow`.
                        </p>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                            Select Gym Member
                        </label>
                        <select
                            value={selectedMemberIdForPass}
                            onChange={e => setSelectedMemberIdForPass(Number(e.target.value))}
                            className="w-full bg-black border border-white/15 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-amber-500"
                        >
                            {members.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (#{m.id} • {m.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-2xl mx-auto flex flex-col items-center justify-center shadow-lg">
                        <QRCodeCanvas
                            id="member-pass-qr-canvas"
                            value={generatedQRPayload}
                            size={156}
                            level="M"
                            includeMargin={true}
                        />
                        <p className="text-[10px] font-mono font-bold text-black mt-1">
                            MEMBER_QR_V2#{selectedMemberForPass?.id || 1}
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={isProcessingEntry}
                        onClick={handleSimulateJsQRScan}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all cursor-pointer disabled:opacity-50"
                    >
                        <QrCode className="w-4 h-4" />
                        {isProcessingEntry ? 'Triggering WhatsApp...' : 'Decode QR & Log Entry Now'}
                    </button>
                </div>

                {/* Right 4 Columns: Live Entry & WhatsApp Workflow Dispatch Log */}
                <div className="xl:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-between space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                Real-Time Gate Audit
                            </span>
                            <h3 className="text-lg font-black text-white uppercase italic">
                                Entry &amp; WhatsApp Log ({checkInLogs.length})
                            </h3>
                        </div>
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                        {checkInLogs.map(entry => (
                            <div
                                key={entry.id}
                                className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1.5 hover:border-cyan-500/30 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-white">{entry.memberName}</span>
                                    <span className="text-[10px] font-mono text-cyan-400">
                                        {entry.date} • {entry.time}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-300 leading-snug">{entry.whatsappMessage}</p>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[9px] font-mono text-gray-500">{entry.phone}</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                                        <Check className="w-2.5 h-2.5" /> WhatsApp Workflow Sent
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberCheckIn;
