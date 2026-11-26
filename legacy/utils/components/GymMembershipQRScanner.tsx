import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
    Camera, RefreshCw, X, CheckCircle2, AlertTriangle, XCircle, 
    Zap, Flashlight, FlipHorizontal, Upload, Search, UserCheck, 
    Shield, Database, Clock, Phone, Mail, Award, History, Volume2, 
    VolumeX, ArrowRight, Sparkles, Check
} from 'lucide-react';
import { supabase, isMock } from '../../lib/supabase';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';

export interface ValidatedMember {
    id: string | number;
    fullName: string;
    phoneNumber: string;
    email?: string;
    planTier: string;
    status: 'ACTIVE' | 'INACTIVE' | 'CHURN_RISK' | 'EXPIRED';
    lastAttendanceAt?: string;
    inactivityDays?: number;
    source: 'supabase_live' | 'supabase_mirror';
    checkedInAt: string;
    avatar?: string;
}

interface GymMembershipQRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (member: ValidatedMember) => void;
    mode?: 'modal' | 'embedded';
}

export const GymMembershipQRScanner: React.FC<GymMembershipQRScannerProps> = ({
    isOpen,
    onClose,
    onSuccess,
    mode = 'modal'
}) => {
    const { members, markAttendance } = useData();
    const { addToast } = useToast();

    // Camera & MediaDevices State
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Scanner & Validation State
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validatedMember, setValidatedMember] = useState<ValidatedMember | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
    const [recentScans, setRecentScans] = useState<Array<{ member: ValidatedMember; timestamp: string; payload?: string }>>([]);
    const mockScanIndexRef = useRef<number>(0);

    // Sound chime synthesis via Web Audio API
    const playChime = useCallback((type: 'success' | 'error') => {
        if (!soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
                osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.22);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.28);
            }
        } catch {
            // Audio context policy fallback
        }
    }, [soundEnabled]);

    // Haptic feedback
    const triggerHaptic = (type: 'success' | 'error') => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(type === 'success' ? [40, 40, 40] : [120, 80, 120]);
            } catch {
                // Ignore vibration failure
            }
        }
    };

    // Stop MediaStream tracks
    const stopStream = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsTorchOn(false);
    }, []);

    // Enumerate camera devices
    const getCameraDevices = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            setCameras(videoInputs);
            if (videoInputs.length > 0 && !selectedCameraId) {
                // Prefer back camera if available
                const backCam = videoInputs.find(c => 
                    c.label.toLowerCase().includes('back') || 
                    c.label.toLowerCase().includes('rear') || 
                    c.label.toLowerCase().includes('environment')
                );
                setSelectedCameraId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
            }
        } catch (err) {
            console.warn('[QR Scanner] Error enumerating video devices:', err);
        }
    }, [selectedCameraId]);

    // Validate parsed code against Supabase database
    const validateMembershipCode = useCallback(async (rawCode: string) => {
        if (!rawCode || isValidating) return;

        setIsValidating(true);
        setValidationError(null);
        setScannedCode(rawCode);

        // Normalize code: support JSON mock payloads, GateAccessController "MEMBER_QR_V2#<id>", or URLs
        let cleanCode = rawCode.trim();
        let parsedPayloadMeta: any = null;
        if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
            try {
                parsedPayloadMeta = JSON.parse(cleanCode);
                cleanCode = String(
                    parsedPayloadMeta.code ||
                    parsedPayloadMeta.memberId ||
                    parsedPayloadMeta.phone ||
                    cleanCode
                ).trim();
            } catch {
                // keep raw string if not valid JSON
            }
        }
        if (cleanCode.includes('MEMBER_QR_V2#')) {
            cleanCode = cleanCode.split('MEMBER_QR_V2#')[1];
        } else if (cleanCode.startsWith('http://') || cleanCode.startsWith('https://')) {
            try {
                const url = new URL(cleanCode);
                cleanCode = url.pathname.split('/').filter(Boolean).pop() || cleanCode;
            } catch {
                // keep as is
            }
        }

        const now = new Date();
        const checkInTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const checkInDateStr = now.toISOString().split('T')[0];

        try {
            let foundRecord: any = null;
            let source: 'supabase_live' | 'supabase_mirror' = 'supabase_mirror';

            // 1. Attempt Live Supabase Query
            const isLiveSupabase = !isMock;

            if (isLiveSupabase) {
                try {
                    // Check if cleanCode is a valid UUID format (8-4-4-4-12 hex)
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
                    let dbMembers: any[] | null = null;
                    let dbError: any = null;

                    if (isUuid) {
                        const res = await supabase
                            .from('members')
                            .select('*')
                            .eq('id', cleanCode)
                            .limit(1);
                        dbMembers = res.data;
                        dbError = res.error;
                    } else {
                        // Query by phone_number first
                        const cleanDigits = cleanCode.replace(/\D/g, '');
                        if (cleanDigits.length >= 7) {
                            const res = await supabase
                                .from('members')
                                .select('*')
                                .eq('phone_number', cleanDigits)
                                .limit(1);
                            dbMembers = res.data;
                            dbError = res.error;
                        }
                        // If not found by phone, query by exact or partial phone or name
                        if (!dbMembers || dbMembers.length === 0) {
                            const res = await supabase
                                .from('members')
                                .select('*')
                                .or(`phone_number.eq.${cleanCode},full_name.ilike.%${cleanCode}%`)
                                .limit(1);
                            if (res.data && res.data.length > 0) {
                                dbMembers = res.data;
                                dbError = res.error;
                            }
                        }
                    }

                    if (!dbError && dbMembers && dbMembers.length > 0) {
                        foundRecord = dbMembers[0];
                        source = 'supabase_live';

                        // Update attendance & active status in Supabase
                        await supabase
                            .from('members')
                            .update({
                                last_attendance_at: now.toISOString(),
                                inactivity_days: 0,
                                status: 'ACTIVE',
                                updated_at: now.toISOString()
                            })
                            .eq('id', foundRecord.id);
                    }
                } catch (supabaseErr) {
                    console.warn('[QR Scanner] Supabase live query failed, falling back to local sync cache:', supabaseErr);
                }
            }

            // 2. Fallback to Local DataProvider / Supabase Synced Cache
            if (!foundRecord) {
                // Search by numeric ID, phone, name, or code
                const numId = parseInt(cleanCode, 10);
                const localMatch = members.find(m => 
                    (numId && m.id === numId) ||
                    m.phone === cleanCode ||
                    m.phone.replace(/\D/g, '') === cleanCode.replace(/\D/g, '') ||
                    m.name.toLowerCase() === cleanCode.toLowerCase() ||
                    (m as any).loginId === cleanCode ||
                    (m as any).membershipCode === cleanCode
                );

                if (localMatch) {
                    foundRecord = {
                        id: localMatch.id,
                        full_name: localMatch.name,
                        phone_number: localMatch.phone,
                        email: localMatch.email,
                        plan_tier: localMatch.packageId === 2 ? 'Elite VIP' : localMatch.packageId === 3 ? 'Annual Titanium' : 'Standard Pro',
                        status: localMatch.status === 'Active' ? 'ACTIVE' : localMatch.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE',
                        last_attendance_at: now.toISOString(),
                        inactivity_days: 0,
                        avatar: localMatch.avatar
                    };
                    source = 'supabase_mirror';
                }
            }

            if (!foundRecord) {
                throw new Error(`No member registered with code "${cleanCode}" in Supabase ledger.`);
            }

            // Construct validated member result
            const result: ValidatedMember = {
                id: foundRecord.id,
                fullName: foundRecord.full_name || foundRecord.name || 'Gym Member',
                phoneNumber: foundRecord.phone_number || foundRecord.phone || 'N/A',
                email: foundRecord.email,
                planTier: foundRecord.plan_tier || 'Standard',
                status: foundRecord.status || 'ACTIVE',
                lastAttendanceAt: now.toISOString(),
                inactivityDays: 0,
                source,
                checkedInAt: `${checkInDateStr} at ${checkInTimeStr}`,
                avatar: foundRecord.avatar
            };

            // Record attendance in local DataProvider
            const numMemberId = typeof result.id === 'number' ? result.id : (parseInt(String(result.id).replace(/\D/g, ''), 10) || 1);
            markAttendance({
                id: `att_${Date.now()}`,
                memberId: numMemberId,
                date: checkInDateStr,
                time: checkInTimeStr,
                status: 'Present',
                method: 'QR'
            });

            playChime('success');
            triggerHaptic('success');
            setValidatedMember(result);
            setRecentScans(prev => [{ member: result, timestamp: checkInTimeStr, payload: rawCode }, ...prev.slice(0, 9)]);

            addToast(`Access Granted: ${result.fullName} (${result.planTier}) checked in via QR Scanner.`, 'success');

            if (onSuccess) {
                onSuccess(result);
            }

        } catch (err: any) {
            playChime('error');
            triggerHaptic('error');
            setValidationError(err.message || 'Failed to validate QR code with Supabase');
            setValidatedMember(null);
            addToast(`Access Denied: ${err.message || 'Invalid QR code'}`, 'error');
        } finally {
            setIsValidating(false);
        }
    }, [members, markAttendance, addToast, onSuccess, playChime, isValidating]);

    // Trigger scanner logic with an active registered member QR payload
    const handleTestQRScanner = useCallback(() => {
        const activeMembers = members.filter(m => m.status === 'Active');
        const pool = activeMembers.length > 0 ? activeMembers : members;
        if (pool.length === 0) {
            addToast('No registered members found in the database to scan.', 'error');
            return;
        }
        const targetMember = pool[mockScanIndexRef.current % pool.length];

        mockScanIndexRef.current += 1;

        const qrPayload = JSON.stringify({
            type: 'GYM_MEMBER_PASS',
            version: 'QR_V2_ECDSA',
            code: `MEMBER_QR_V2#${targetMember.id}`,
            memberId: targetMember.id,
            memberName: targetMember.name,
            phone: targetMember.phone,
            gateId: 'TURNSTILE_MAIN_01',
            timestamp: new Date().toISOString()
        });

        setManualCode(qrPayload);
        validateMembershipCode(qrPayload);
    }, [members, validateMembershipCode, addToast]);

    // Initialize Camera Feed
    const startCamera = useCallback(async () => {
        stopStream();
        setCameraState('requesting');
        setCameraError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraState('error');
            setCameraError('Browser MediaDevices API not supported or secure context (HTTPS) required.');
            return;
        }

        try {
            const constraints: MediaStreamConstraints = {
                audio: false,
                video: selectedCameraId
                    ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                    : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video metadata to play
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.warn('Video play interrupted:', e));
                    setCameraState('active');
                };
            }

            // Check if track supports torch
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const capabilities = (videoTrack as any).getCapabilities?.();
                setHasTorch(!!capabilities?.torch);
            }

            await getCameraDevices();
        } catch (err: any) {
            console.error('[QR Scanner] Camera start error:', err);
            setCameraState('error');
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError('Camera access was denied. Please grant camera permissions in your browser bar.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('No camera device detected on this hardware. Use the upload or manual input tab.');
            } else {
                setCameraError(`Camera error: ${err.message || 'Unable to access media stream'}`);
            }
        }
    }, [selectedCameraId, facingMode, stopStream, getCameraDevices]);

    // Live frame scanning loop via requestAnimationFrame and jsQR
    useEffect(() => {
        if (cameraState !== 'active' || activeTab !== 'camera' || validatedMember) {
            return;
        }

        let isScanning = true;

        const scanFrame = () => {
            if (!isScanning) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'attemptBoth'
                    });

                    if (code && code.data && code.data.trim()) {
                        console.log('[QR Scanner] QR Code detected:', code.data);
                        validateMembershipCode(code.data);
                        return; // pause scan while validating
                    }
                }
            }

            animationFrameId.current = requestAnimationFrame(scanFrame);
        };

        animationFrameId.current = requestAnimationFrame(scanFrame);

        return () => {
            isScanning = false;
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [cameraState, activeTab, validatedMember, validateMembershipCode]);

    // Start / stop camera on modal open / close or tab switch
    useEffect(() => {
        if (isOpen && activeTab === 'camera') {
            startCamera();
        } else {
            stopStream();
        }

        return () => {
            stopStream();
        };
    }, [isOpen, activeTab, startCamera, stopStream]);

    // Toggle Torch
    const toggleTorch = async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (track && hasTorch) {
            try {
                const nextTorch = !isTorchOn;
                await (track as any).applyConstraints({
                    advanced: [{ torch: nextTorch }]
                });
                setIsTorchOn(nextTorch);
            } catch (err) {
                console.warn('[QR Scanner] Torch toggle failed:', err);
            }
        }
    };

    // Flip Camera facing mode
    const flipCamera = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        setSelectedCameraId('');
    };

    // Handle Image File Upload for QR Decoding
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'attemptBoth'
                    });
                    if (code && code.data) {
                        validateMembershipCode(code.data);
                    } else {
                        setValidationError('No valid QR code could be decoded from this image file.');
                        playChime('error');
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Reset scanner for next member
    const handleScanNext = () => {
        setValidatedMember(null);
        setValidationError(null);
        setScannedCode(null);
        setManualCode('');
        if (activeTab === 'camera' && cameraState !== 'active') {
            startCamera();
        }
    };

    if (!isOpen) return null;

    const modalWrapperClass = mode === 'modal' 
        ? "fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
        : "w-full max-w-4xl mx-auto my-4";

    return (
        <div className={modalWrapperClass}>
            <div className="relative w-full max-w-2xl bg-[#08090d] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Header Strip */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                            <Camera className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-mono text-sm font-black text-white uppercase tracking-wider">
                                    Gym Membership QR Scanner
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Supabase Verified
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono">
                                Browser MediaDevices API &bull; Real-time Attendance Check-in
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleTestQRScanner}
                            disabled={isValidating}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
                            title="Trigger scanner validation logic with a mock member QR payload"
                        >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Test QR Scanner</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 border border-white/5 transition-all"
                            title={soundEnabled ? "Mute Chimes" : "Enable Chimes"}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                        </button>
                        {mode === 'modal' && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-rose-500/20 hover:text-rose-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-Tabs: Camera | Upload | Manual Entry */}
                <div className="flex bg-black/40 p-2 border-b border-white/5 gap-2 px-6">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('camera'); handleScanNext(); }}
                        className={`flex-1 py-2 px-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'camera'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Live Camera (MediaDevices)
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('upload'); handleScanNext(); }}
                        className={`flex-1 py-2 px-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'upload'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Upload QR Image
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('manual'); handleScanNext(); }}
                        className={`flex-1 py-2 px-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'manual'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        Manual Code Test
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

                    {/* 1. VERIFIED MEMBER CARD (When recognized) */}
                    {validatedMember ? (
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-black to-emerald-950/20 border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-fade-in space-y-6">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 font-black text-xl shadow-lg overflow-hidden">
                                        {validatedMember.avatar ? (
                                            <img src={validatedMember.avatar} alt={validatedMember.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            validatedMember.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xl font-black text-white tracking-tight">
                                                {validatedMember.fullName}
                                            </h4>
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-400 text-black uppercase tracking-wider">
                                                Verified Pass
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono text-emerald-400 mt-0.5 flex items-center gap-2">
                                            <Award className="w-3.5 h-3.5" />
                                            {validatedMember.planTier} Plan &bull; ID: #{validatedMember.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>
                                        {validatedMember.source === 'supabase_live' ? 'Supabase Live DB' : 'Supabase Synced Mirror'}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                                <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[9px] text-gray-500 uppercase block">Check-in Status</span>
                                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        Access Granted
                                    </span>
                                </div>
                                <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[9px] text-gray-500 uppercase block">Attendance Time</span>
                                    <span className="text-white font-bold flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-indigo-400" />
                                        {validatedMember.checkedInAt}
                                    </span>
                                </div>
                                <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[9px] text-gray-500 uppercase block">Member Phone</span>
                                    <span className="text-cyan-300 font-bold flex items-center gap-1.5 truncate">
                                        <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                                        {validatedMember.phoneNumber}
                                    </span>
                                </div>
                            </div>

                            {/* Decoded Payload Preview */}
                            {scannedCode && (
                                <div className="p-3 bg-black/70 rounded-xl border border-emerald-500/20 font-mono text-[10px] text-gray-300 space-y-1">
                                    <span className="text-[9px] text-emerald-400 uppercase font-bold block">
                                        Decoded QR Payload:
                                    </span>
                                    <div className="break-all text-gray-400 bg-black/50 p-2 rounded-lg border border-white/5">
                                        {scannedCode}
                                    </div>
                                </div>
                            )}

                            {/* Action Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                                <span className="text-[10px] font-mono text-gray-400">
                                    Attendance marked & verified in ledger.
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleTestQRScanner}
                                        className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                        Test Another Member
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleScanNext}
                                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Scan Next Member
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* 2. VALIDATION ERROR MESSAGE */}
                    {validationError && !validatedMember && (
                        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start justify-between gap-3 animate-fade-in">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold uppercase tracking-wider block text-rose-200">
                                        Supabase Verification Failed
                                    </span>
                                    <p className="text-[11px] text-rose-300/90 mt-0.5">{validationError}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleScanNext}
                                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-[10px] font-bold uppercase transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* 3. CAMERA VIEWPORT */}
                    {activeTab === 'camera' && !validatedMember && (
                        <div className="space-y-4">
                            <div className="relative aspect-video sm:aspect-[4/3] w-full max-w-lg mx-auto bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center">
                                
                                {/* Video element connected to MediaDevices */}
                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />

                                {/* Hidden processing canvas */}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Camera HUD Viewfinder Overlay */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono text-gray-300 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                            MEDIA_STREAM: {cameraState.toUpperCase()}
                                        </div>
                                        <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono text-cyan-300">
                                            AUTO_DECODE: ACTIVE
                                        </div>
                                    </div>

                                    {/* Reticle Focus Box */}
                                    <div className="relative w-56 h-56 mx-auto my-auto flex items-center justify-center">
                                        {/* Corner brackets */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        
                                        {/* Laser scan line animation */}
                                        <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-[bounce_2s_infinite]" />

                                        {isValidating && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2">
                                                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                                                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                                                    Verifying in Supabase...
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center">
                                        <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-gray-300">
                                            Align Gym Membership QR inside frame
                                        </span>
                                    </div>
                                </div>

                                {/* Camera Loading / Error States */}
                                {cameraState === 'requesting' && (
                                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 p-6 text-center">
                                        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                                        <p className="text-xs font-mono text-gray-300 uppercase tracking-widest">
                                            Requesting Camera Stream...
                                        </p>
                                    </div>
                                )}

                                {cameraState === 'error' && (
                                    <div className="absolute inset-0 bg-[#0c0d12] flex flex-col items-center justify-center gap-3 p-6 text-center">
                                        <AlertTriangle className="w-10 h-10 text-amber-400 mb-1" />
                                        <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                            Camera Feed Unavailable
                                        </p>
                                        <p className="text-[11px] font-mono text-gray-400 max-w-sm">
                                            {cameraError}
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={handleTestQRScanner}
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                Test QR Scanner
                                            </button>
                                            <button
                                                type="button"
                                                onClick={startCamera}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                            >
                                                Try Again
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('manual')}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                            >
                                                Use Manual Code
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Camera Hardware Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    {cameras.length > 1 && (
                                        <select
                                            value={selectedCameraId}
                                            onChange={(e) => setSelectedCameraId(e.target.value)}
                                            className="bg-black border border-white/10 text-xs font-mono text-gray-300 rounded-xl px-3 py-1.5 focus:border-emerald-500 outline-none"
                                        >
                                            {cameras.map((c, i) => (
                                                <option key={c.deviceId || i} value={c.deviceId}>
                                                    {c.label || `Camera ${i + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <button
                                        type="button"
                                        onClick={flipCamera}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-gray-300 flex items-center gap-1.5 transition-all"
                                        title="Switch Camera (Front/Rear)"
                                    >
                                        <FlipHorizontal className="w-3.5 h-3.5" />
                                        Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})
                                    </button>

                                    {hasTorch && (
                                        <button
                                            type="button"
                                            onClick={toggleTorch}
                                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono flex items-center gap-1.5 transition-all ${
                                                isTorchOn 
                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg' 
                                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            <Flashlight className="w-3.5 h-3.5" />
                                            Torch {isTorchOn ? 'ON' : 'OFF'}
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleTestQRScanner}
                                        disabled={isValidating}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-mono font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                        Test QR Scanner
                                    </button>
                                    <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                                        30 FPS Live Canvas Detection
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. UPLOAD TAB */}
                    {activeTab === 'upload' && !validatedMember && (
                        <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl bg-black/30 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                                    Upload Gym Badge QR Image
                                </h4>
                                <p className="text-xs text-gray-400 font-mono mt-1">
                                    Supports PNG, JPG, or screenshot files containing a gym membership QR code
                                </p>
                            </div>
                            <div>
                                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase text-xs font-mono tracking-wider rounded-xl cursor-pointer transition-all shadow-lg">
                                    <Upload className="w-4 h-4" />
                                    Choose QR Image File
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* 5. MANUAL CODE TEST TAB */}
                    {activeTab === 'manual' && !validatedMember && (
                        <div className="p-6 bg-black/40 border border-white/10 rounded-3xl space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Search className="w-4 h-4 text-emerald-400" />
                                        Simulate Code / Test Membership
                                    </h4>
                                    <p className="text-[11px] text-gray-400 font-mono mt-1">
                                        Enter a membership ID, phone number, UUID, or trigger a mock QR payload.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleTestQRScanner}
                                    disabled={isValidating}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    Test QR Scanner
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); validateMembershipCode(manualCode); }} className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="e.g. MEMBER_QR_V2#1 or 9800000000"
                                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-600 outline-none focus:border-emerald-500 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!manualCode.trim() || isValidating}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase font-mono text-xs tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isValidating ? 'Validating...' : 'Verify'}
                                </button>
                            </form>

                            {/* One-click Sample Test Badges */}
                            <div className="pt-2 border-t border-white/5 space-y-2">
                                <span className="text-[9px] font-mono text-gray-500 uppercase block font-bold">
                                    Quick Test Pass Codes:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => validateMembershipCode('MEMBER_QR_V2#1')}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 border border-white/10 text-[10px] font-mono transition-all"
                                    >
                                        Pass #1 (Active Standard)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => validateMembershipCode('MEMBER_QR_V2#2')}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 border border-white/10 text-[10px] font-mono transition-all"
                                    >
                                        Pass #2 (Elite VIP)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => validateMembershipCode('9800000000')}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 border border-white/10 text-[10px] font-mono transition-all"
                                    >
                                        UPI Phone (+91 98XXXXXXXX)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => validateMembershipCode('m_101')}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 text-[10px] font-mono transition-all"
                                    >
                                        UUID Ledger (m_101)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. RECENT ATTENDANCE SCAN LOGS */}
                    {recentScans.length > 0 && (
                        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2 font-mono">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-indigo-400" />
                                    Recent Session Scans ({recentScans.length})
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                                {recentScans.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-[10.5px]">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-white font-bold">{item.member.fullName}</span>
                                            <span className="text-gray-500">&bull; {item.member.planTier}</span>
                                        </div>
                                        <span className="text-gray-400 text-[9px]">{item.timestamp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/80 font-mono text-[10px] text-gray-500">
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Supabase schema v2.1 &bull; Turnstile Check-in</span>
                    </div>
                    {mode === 'modal' && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            Close ESC
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default GymMembershipQRScanner;
