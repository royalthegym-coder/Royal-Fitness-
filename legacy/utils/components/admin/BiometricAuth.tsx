import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Fingerprint,
    ShieldCheck,
    ShieldAlert,
    Lock,
    Cpu,
    ScanFace,
    KeyRound,
    RefreshCw,
    X,
    CheckCircle2,
    Terminal,
    Smartphone,
    Sparkles,
    ArrowLeft,
    MapPin
} from 'lucide-react';
import {
    authenticateBiometricDetailed,
    registerBiometricDetailed,
    inspectWebAuthnCapabilities,
    generateWebAuthnChallenge,
    BiometricCapability,
    BiometricAuthResult
} from '../../biometrics';
import { logFailedBiometricUnlock } from '../../securityAuditLogger';

export interface BiometricAuthProps {
    onAuthenticated: (result?: BiometricAuthResult) => void;
    onCancel?: () => void;
    title?: string;
    targetView?: string;
    clearanceLevel?: string;
    userEmail?: string;
    userName?: string;
    mode?: 'modal' | 'inline';
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({
    onAuthenticated,
    onCancel,
    title = 'Restricted Administrative Area',
    targetView,
    clearanceLevel = 'LEVEL-5 ADMIN CLEARANCE',
    userEmail = 'admin@fitnessfuture.os',
    userName = 'Gym Administrator',
    mode = 'modal'
}) => {
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'REGISTERING' | 'SUCCESS' | 'FAILED'>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [capabilities, setCapabilities] = useState<BiometricCapability | null>(null);
    const [challengeHex, setChallengeHex] = useState<string>('');
    const [challengeSource, setChallengeSource] = useState<'server' | 'webcrypto'>('webcrypto');
    const [consoleLogs, setConsoleLogs] = useState<string[]>([
        '[SYSTEM] WebAuthn FIDO2 Security Gate initialized.',
        '[READY] Awaiting administrator biometric assertion...'
    ]);
    const [lastResult, setLastResult] = useState<BiometricAuthResult | null>(null);

    const refreshDiagnostics = useCallback(async () => {
        const [cap, chal] = await Promise.all([
            inspectWebAuthnCapabilities(),
            generateWebAuthnChallenge()
        ]);
        setCapabilities(cap);
        setChallengeHex(chal.challengeHex);
        setChallengeSource(chal.source);
        setConsoleLogs((prev) => [
            ...prev.slice(-8),
            `[CHALLENGE] 256-bit nonce ready (${chal.source.toUpperCase()}): 0x${chal.challengeHex.slice(0, 16)}...`
        ]);
    }, []);

    useEffect(() => {
        refreshDiagnostics();
    }, [refreshDiagnostics]);

    // Handle Escape key to cancel modal
    useEffect(() => {
        if (!onCancel) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && status !== 'SCANNING' && status !== 'REGISTERING') {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel, status]);

    const recordBiometricAuditLog = (
        logStatus: 'success' | 'failed',
        deviceLabel: string,
        actionLabel: string,
        credentialId?: string
    ) => {
        try {
            const existingLogs = JSON.parse(localStorage.getItem('biometric_logs') || '[]');
            const newLog = {
                id: `BIO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                timestamp: new Date().toISOString(),
                status: logStatus,
                device: deviceLabel,
                userType: `${actionLabel}${targetView ? ` • ${targetView}` : ''}${credentialId ? ` (${credentialId.slice(0, 10)}...)` : ''}`
            };
            localStorage.setItem('biometric_logs', JSON.stringify([newLog, ...existingLogs].slice(0, 100)));
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            console.error('Failed to log biometric event:', err);
        }
    };

    const handleVerifyWebAuthn = async (simulateHardware = false) => {
        if (status === 'SCANNING' || status === 'REGISTERING' || status === 'SUCCESS') return;

        setStatus('SCANNING');
        setErrorMessage('');
        setConsoleLogs((prev) => [
            ...prev.slice(-6),
            simulateHardware
                ? '[ACTION] Initiating WebCrypto ECDSA P-256 Hardware Enclave Assertion...'
                : '[ACTION] Calling navigator.credentials.get({ publicKey })...'
        ]);

        const result = await authenticateBiometricDetailed({ simulateHardware });
        setLastResult(result);
        setConsoleLogs((prev) => [...prev.slice(-4), ...result.logs]);

        if (result.success) {
            recordBiometricAuditLog(
                'success',
                result.method === 'webauthn_assertion'
                    ? 'WebAuthn Platform Authenticator (TouchID / FaceID / Hello)'
                    : 'WebAuthn ECDSA P-256 Hardware Enclave',
                title,
                result.credentialId
            );
            setStatus('SUCCESS');
            const updatedCap = await inspectWebAuthnCapabilities();
            setCapabilities(updatedCap);
            setTimeout(() => {
                onAuthenticated(result);
            }, 900);
        } else {
            recordBiometricAuditLog(
                'failed',
                'WebAuthn Platform Authenticator',
                title
            );
            setStatus('FAILED');
            const failureReason = result.errorMessage ||
                'Biometric verification failed or was cancelled. You can enroll a passkey or use Hardware Enclave Verify.';
            setErrorMessage(failureReason);

            // Automatically log failed unlock attempt to Firestore 'security_audit' with Geolocation and Timestamp
            logFailedBiometricUnlock({
                method: result.method === 'webauthn_assertion'
                    ? 'WebAuthn Platform Authenticator'
                    : 'WebCrypto ECDSA Enclave',
                errorMessage: failureReason,
                targetView,
                targetUserEmail: userEmail,
                targetUserName: userName,
                clearanceLevel,
                deviceLabel: 'WebAuthn Platform Authenticator'
            }).then((auditRec) => {
                setConsoleLogs((prev) => [
                    ...prev.slice(-4),
                    `[SECURITY_AUDIT] Logged failed unlock to Firestore 'security_audit' [${auditRec.id}]`,
                    `[GEOLOCATION] Lat: ${auditRec.geolocation.latitude}, Lon: ${auditRec.geolocation.longitude} (${auditRec.geolocation.source.toUpperCase()})`
                ]);
            }).catch((err) => {
                console.error('[BiometricAuth] Failed to write security audit log:', err);
            });

            setTimeout(() => {
                setStatus('IDLE');
            }, 3000);
        }
    };

    const handleRegisterPasskey = async () => {
        if (status === 'SCANNING' || status === 'REGISTERING' || status === 'SUCCESS') return;

        setStatus('REGISTERING');
        setErrorMessage('');
        setConsoleLogs((prev) => [
            ...prev.slice(-6),
            `[ENROLL] Calling navigator.credentials.create({ publicKey }) for ${userName}...`
        ]);

        const result = await registerBiometricDetailed(userEmail, userName);
        setLastResult(result);
        setConsoleLogs((prev) => [...prev.slice(-4), ...result.logs]);

        if (result.success) {
            recordBiometricAuditLog(
                'success',
                'WebAuthn Passkey Enrollment (FIDO2 Create)',
                `Passkey Enrolled • ${title}`,
                result.credentialId
            );
            const updatedCap = await inspectWebAuthnCapabilities();
            setCapabilities(updatedCap);
            setStatus('SUCCESS');
            setTimeout(() => {
                onAuthenticated(result);
            }, 900);
        } else {
            recordBiometricAuditLog(
                'failed',
                'WebAuthn Passkey Enrollment',
                `Enrollment Failed • ${title}`
            );
            setStatus('FAILED');
            const failureReason = result.errorMessage || 'Could not enroll hardware passkey. Try Hardware Enclave Verify below.';
            setErrorMessage(failureReason);

            // Automatically log failed enrollment attempt to Firestore 'security_audit'
            logFailedBiometricUnlock({
                method: 'WebAuthn Passkey Registration',
                errorMessage: failureReason,
                targetView,
                targetUserEmail: userEmail,
                targetUserName: userName,
                clearanceLevel,
                deviceLabel: 'WebAuthn Passkey Enrollment'
            }).then((auditRec) => {
                setConsoleLogs((prev) => [
                    ...prev.slice(-4),
                    `[SECURITY_AUDIT] Logged failed enrollment to Firestore 'security_audit' [${auditRec.id}]`,
                    `[GEOLOCATION] Lat: ${auditRec.geolocation.latitude}, Lon: ${auditRec.geolocation.longitude}`
                ]);
            }).catch(console.error);

            setTimeout(() => {
                setStatus('IDLE');
            }, 3000);
        }
    };

    const handleSimulateFailedUnlock = async () => {
        setStatus('FAILED');
        const reason = 'Simulated unauthorized biometric touch / facial mismatch';
        setErrorMessage(reason);
        setConsoleLogs((prev) => [
            ...prev.slice(-4),
            '[SIMULATION] Triggering failed biometric unlock...',
            '[GEO] Acquiring device GPS coordinates...'
        ]);

        recordBiometricAuditLog('failed', 'Simulated Biometric Sensor', `${title} • Test Failure`);

        try {
            const auditRec = await logFailedBiometricUnlock({
                method: 'Biometric Touch/Facial Scanner (Simulated Failure)',
                errorMessage: reason,
                targetView,
                targetUserEmail: userEmail,
                targetUserName: userName,
                clearanceLevel,
                deviceLabel: 'Entrance Biometric Terminal Barrier',
                severity: 'CRITICAL'
            });

            setConsoleLogs((prev) => [
                ...prev.slice(-4),
                `[SECURITY_AUDIT] Logged to Firestore 'security_audit' [${auditRec.id}]`,
                `[GEOLOCATION] Lat: ${auditRec.geolocation.latitude}, Lon: ${auditRec.geolocation.longitude} (${auditRec.geolocation.city})`
            ]);
        } catch (err) {
            console.error('Failed to log simulated audit:', err);
        }

        setTimeout(() => setStatus('IDLE'), 3500);
    };

    const modalCard = (
        <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-[#06070a]/95 border border-cyan-500/30 p-6 sm:p-8 rounded-[2.5rem] max-w-xl w-full text-center relative overflow-hidden shadow-[0_0_90px_rgba(6,182,212,0.22)] backdrop-blur-2xl"
        >
            {/* Ambient cyber glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

            {/* Top Security Bar */}
            <div className="relative z-10 flex items-center justify-between gap-2 mb-5 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        <Lock className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
                                WebAuthn FIDO2 Gate
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {clearanceLevel}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono truncate max-w-[260px] sm:max-w-xs">
                            RP ID: {capabilities?.rpId || window.location.hostname || 'localhost'}
                        </p>
                    </div>
                </div>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                        title="Cancel and return to safe area (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Target Admin Area Title */}
            <div className="relative z-10 mb-5">
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {title}
                </h2>
                <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">
                    Biometric Hardware Verification Required to Unlock Administrative Controls
                </p>
            </div>

            {/* WebAuthn Capability Diagnostics Strip */}
            <div className="relative z-10 grid grid-cols-3 gap-2 mb-6 text-left">
                <div className="bg-black/60 border border-white/10 rounded-2xl p-2.5">
                    <div className="text-[9px] font-mono uppercase text-gray-500 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-cyan-400" /> WebAuthn API
                    </div>
                    <div className="text-xs font-black text-white mt-0.5 flex items-center gap-1.5">
                        <span
                            className={`w-2 h-2 rounded-full ${
                                capabilities?.webAuthnSupported ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                            }`}
                        />
                        {capabilities?.webAuthnSupported ? 'PUBLICKEY READY' : 'ENCLAVE MODE'}
                    </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-2.5">
                    <div className="text-[9px] font-mono uppercase text-gray-500 flex items-center gap-1">
                        <ScanFace className="w-3 h-3 text-indigo-400" /> Authenticator
                    </div>
                    <div className="text-xs font-black text-white mt-0.5 truncate">
                        {capabilities?.platformAuthenticatorAvailable
                            ? 'Platform Sensor'
                            : 'FIDO2 / Enclave'}
                    </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-2.5">
                    <div className="text-[9px] font-mono uppercase text-gray-500 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-emerald-400" /> Passkey State
                    </div>
                    <div className="text-xs font-black text-white mt-0.5 truncate">
                        {capabilities?.hasRegisteredCredential ? 'Enrolled' : 'Ready to Pair'}
                    </div>
                </div>
            </div>

            {/* Interactive Biometric Scanner Core */}
            <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                {/* Outer Rotating Ring */}
                <div
                    className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-700 ${
                        status === 'SCANNING' || status === 'REGISTERING'
                            ? 'border-cyan-400 animate-[spin_5s_linear_infinite] scale-110'
                            : status === 'SUCCESS'
                            ? 'border-emerald-400 scale-105'
                            : status === 'FAILED'
                            ? 'border-red-500 scale-95'
                            : 'border-white/15'
                    }`}
                />

                {/* Inner Pulse Ring */}
                <div
                    className={`absolute inset-3 rounded-full border transition-all duration-500 ${
                        status === 'SCANNING' || status === 'REGISTERING'
                            ? 'border-indigo-500/60 animate-ping'
                            : status === 'SUCCESS'
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : status === 'FAILED'
                            ? 'border-red-500/50 bg-red-500/10'
                            : 'border-cyan-500/20 bg-cyan-500/5'
                    }`}
                />

                {/* Center Trigger Button */}
                <button
                    type="button"
                    onClick={() => handleVerifyWebAuthn(false)}
                    disabled={status === 'SCANNING' || status === 'REGISTERING' || status === 'SUCCESS'}
                    className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                        status === 'SCANNING' || status === 'REGISTERING'
                            ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.5)]'
                            : status === 'SUCCESS'
                            ? 'bg-emerald-500 text-black shadow-[0_0_45px_rgba(16,185,129,0.7)]'
                            : status === 'FAILED'
                            ? 'bg-red-500 text-white shadow-[0_0_45px_rgba(239,68,68,0.7)]'
                            : 'bg-white/5 hover:bg-cyan-500/20 text-gray-200 hover:text-cyan-300 border border-white/15 hover:border-cyan-400/50 hover:scale-105 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
                    }`}
                    title="Click to trigger WebAuthn Biometric Scan"
                >
                    {status === 'SUCCESS' ? (
                        <ShieldCheck className="w-11 h-11 animate-bounce" />
                    ) : status === 'FAILED' ? (
                        <ShieldAlert className="w-11 h-11 animate-pulse" />
                    ) : (
                        <>
                            <Fingerprint
                                className={`w-11 h-11 ${
                                    status === 'SCANNING' || status === 'REGISTERING' ? 'animate-pulse text-cyan-300' : ''
                                }`}
                            />
                            <span className="text-[8px] font-mono uppercase tracking-widest mt-1 opacity-80">
                                {status === 'SCANNING'
                                    ? 'Scanning'
                                    : status === 'REGISTERING'
                                    ? 'Pairing'
                                    : 'Touch Sensor'}
                            </span>
                        </>
                    )}
                </button>

                {/* Laser Scan Line */}
                {(status === 'SCANNING' || status === 'REGISTERING') && (
                    <div className="absolute inset-x-4 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scan_1.6s_ease-in-out_infinite] pointer-events-none" />
                )}
            </div>

            {/* Status & Error Banner */}
            <div className="min-h-[44px] flex flex-col items-center justify-center mb-4 relative z-10">
                {status === 'IDLE' && (
                    <p className="text-xs text-gray-300">
                        Click the sensor or choose a verification method below to authenticate via{' '}
                        <span className="text-cyan-400 font-bold">WebAuthn API</span>.
                    </p>
                )}
                {status === 'SCANNING' && (
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest animate-pulse">
                        <Cpu className="w-4 h-4 animate-spin" />
                        Awaiting Platform Authenticator Response...
                    </div>
                )}
                {status === 'REGISTERING' && (
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-widest animate-pulse">
                        <KeyRound className="w-4 h-4 animate-spin" />
                        Creating FIDO2 Resident Passkey Credential...
                    </div>
                )}
                {status === 'SUCCESS' && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" />
                        Biometric Assertion Verified — Unlocking Area...
                    </div>
                )}
                {status === 'FAILED' && (
                    <p className="text-xs text-red-400 font-semibold max-w-md">
                        {errorMessage}
                    </p>
                )}
            </div>

            {/* Primary & Secondary WebAuthn Action Buttons */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                    type="button"
                    onClick={() => handleVerifyWebAuthn(false)}
                    disabled={status === 'SCANNING' || status === 'REGISTERING' || status === 'SUCCESS'}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50"
                >
                    <Fingerprint className="w-4 h-4" />
                    Verify WebAuthn Passkey
                </button>

                <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    disabled={status === 'SCANNING' || status === 'REGISTERING' || status === 'SUCCESS'}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:border-indigo-400 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                    <KeyRound className="w-4 h-4" />
                    {capabilities?.hasRegisteredCredential ? 'Re-Enroll Passkey' : 'Enroll New Passkey'}
                </button>
            </div>

            {/* Hardware Enclave / Test Assertion & Cancel Row */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-5">
                <button
                    type="button"
                    onClick={() => handleVerifyWebAuthn(true)}
                    disabled={status === 'SCANNING' || status === 'REGISTERING' || status === 'SUCCESS'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    title="Execute real WebCrypto ECDSA P-256 signature verification over the 256-bit WebAuthn challenge"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Verify via WebCrypto Enclave
                </button>

                <button
                    type="button"
                    onClick={handleSimulateFailedUnlock}
                    disabled={status === 'SCANNING' || status === 'REGISTERING'}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    title="Simulate failed unlock to log geolocation and timestamp to Firestore 'security_audit'"
                >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Simulate Failed Unlock (Log GPS)
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Safe Area
                    </button>
                )}
            </div>

            {/* Cryptographic Challenge & Live Telemetry Terminal */}
            <div className="relative z-10 bg-black/80 border border-white/10 rounded-2xl p-3.5 text-left font-mono">
                <div className="flex items-center justify-between text-[10px] text-gray-400 pb-2 mb-2 border-b border-white/10">
                    <span className="flex items-center gap-1.5 font-bold text-cyan-400 uppercase">
                        <Terminal className="w-3.5 h-3.5" />
                        WebAuthn Handshake Telemetry ({challengeSource.toUpperCase()})
                    </span>
                    <button
                        type="button"
                        onClick={refreshDiagnostics}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="Generate fresh 256-bit challenge"
                    >
                        <RefreshCw className="w-3 h-3" /> Rotate Challenge
                    </button>
                </div>

                <div className="text-[10px] text-gray-500 mb-2 truncate">
                    CHALLENGE: <span className="text-gray-300">0x{challengeHex || 'initializing...'}</span>
                </div>

                {lastResult?.credentialId && lastResult.credentialId !== 'none' && (
                    <div className="text-[10px] text-emerald-400 mb-1.5 truncate">
                        CREDENTIAL ID: {lastResult.credentialId}
                    </div>
                )}

                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar text-[10px]">
                    {consoleLogs.map((line, i) => (
                        <div
                            key={i}
                            className={`leading-relaxed ${
                                line.includes('[OK]')
                                    ? 'text-emerald-400'
                                    : line.includes('[ERROR]') || line.includes('[WEBAUTHN_EVENT]')
                                    ? 'text-amber-400'
                                    : 'text-gray-400'
                            }`}
                        >
                            {line}
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 8%; opacity: 0; }
                    50% { top: 92%; opacity: 1; }
                }
            `}</style>
        </motion.div>
    );

    if (mode === 'inline') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">
                {modalCard}
            </div>
        );
    }

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Biometric Authentication Required"
            >
                {modalCard}
            </div>
        </AnimatePresence>
    );
};

export { BiometricAuth };
export default BiometricAuth;

