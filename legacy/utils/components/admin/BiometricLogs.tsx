import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Fingerprint,
    CheckCircle2,
    XCircle,
    Clock,
    Shield,
    ShieldAlert,
    Download,
    Trash2,
    Smartphone,
    MapPin,
    ExternalLink,
    Search,
    RefreshCw,
    Terminal,
    AlertTriangle,
    SlidersHorizontal,
    Globe,
    Zap,
    X,
    Filter,
    Calendar,
    RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { subscribeToCollection, db } from '../../../lib/firebase';
import { logFailedBiometricUnlock, SecurityAuditRecord } from '../../securityAuditLogger';
import { useToast } from '../../hooks/useToast';

interface LocalBioLog {
    id: string;
    timestamp: string;
    status: 'success' | 'failed';
    device: string;
    userType: string;
}

const SEED_SECURITY_AUDITS: SecurityAuditRecord[] = [
    {
        id: 'sec_audit_seed_01',
        eventType: 'FAILED_BIOMETRIC_UNLOCK',
        action: 'BIOMETRIC_UNLOCK_FAILED',
        status: 'DENIED',
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        timestampMs: Date.now() - 1000 * 60 * 14,
        localTime: new Date(Date.now() - 1000 * 60 * 14).toLocaleString(),
        device: 'Entrance Biometric Terminal Barrier (Android / TouchID)',
        method: 'WebAuthn Platform Authenticator',
        errorMessage: 'Biometric touch / facial fingerprint mismatch at turnstile terminal',
        targetView: 'gate_access_controller',
        targetUserEmail: 'unauthorized.guest@unknown.net',
        targetUserName: 'Unknown Visitor',
        clearanceLevel: 'LEVEL-1 ENTRANCE TURNSTILE',
        severity: 'CRITICAL',
        geolocation: {
            latitude: 27.6094,
            longitude: 75.1398,
            accuracy: 15,
            source: 'gps',
            city: 'Central Gym Entrance Turnstile',
            region: 'Sikar / Jaipur Corridor',
            country: 'India',
            mapsUrl: 'https://maps.google.com/?q=27.6094,75.1398'
        },
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 TurnstileKiosk/3.2'
    },
    {
        id: 'sec_audit_seed_02',
        eventType: 'FAILED_BIOMETRIC_UNLOCK',
        action: 'BIOMETRIC_UNLOCK_FAILED',
        status: 'DENIED',
        timestamp: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
        timestampMs: Date.now() - 1000 * 60 * 52,
        localTime: new Date(Date.now() - 1000 * 60 * 52).toLocaleString(),
        device: 'Admin Terminal (macOS / Safari / TouchID)',
        method: 'WebAuthn Platform Authenticator (FIDO2 Assertion)',
        errorMessage: 'NotAllowedError: Hardware verification timed out or user cancelled prompt',
        targetView: 'security',
        targetUserEmail: 'admin@fitnessfuture.os',
        targetUserName: 'Gym Administrator',
        clearanceLevel: 'LEVEL-5 ADMIN CLEARANCE',
        severity: 'HIGH',
        geolocation: {
            latitude: 26.9124,
            longitude: 75.7873,
            accuracy: 45,
            source: 'gps',
            city: 'HQ Main Executive Terminal',
            region: 'Jaipur',
            country: 'India',
            mapsUrl: 'https://maps.google.com/?q=26.9124,75.7873'
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
    }
];

const BiometricLogs: React.FC = () => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'security_audit' | 'local_trace'>('security_audit');
    const [securityAudits, setSecurityAudits] = useState<SecurityAuditRecord[]>([]);
    const [localLogs, setLocalLogs] = useState<LocalBioLog[]>([]);
    const [loadingFirestore, setLoadingFirestore] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [severityFilter, setSeverityFilter] = useState<'all' | 'CRITICAL' | 'HIGH'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [datePreset, setDatePreset] = useState<'all' | 'today' | '24h' | '7d' | '30d' | 'custom'>('all');
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [selectedAuditRecord, setSelectedAuditRecord] = useState<SecurityAuditRecord | null>(null);

    const applyDatePreset = (preset: 'all' | 'today' | '24h' | '7d' | '30d') => {
        setDatePreset(preset);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'today') {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === '24h') {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            setStartDate(yesterday.toISOString().split('T')[0]);
            setEndDate(todayStr);
        } else if (preset === '7d') {
            const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            setStartDate(past.toISOString().split('T')[0]);
            setEndDate(todayStr);
        } else if (preset === '30d') {
            const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            setStartDate(past.toISOString().split('T')[0]);
            setEndDate(todayStr);
        }
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setSeverityFilter('all');
        setStartDate('');
        setEndDate('');
        setDatePreset('all');
    };

    // 1. Subscribe in real time to Firestore collection 'security_audit'
    useEffect(() => {
        let isMounted = true;
        const unsubscribe = subscribeToCollection('security_audit', (docs) => {
            if (!isMounted) return;
            if (docs && docs.length > 0) {
                setSecurityAudits((prev) => {
                    const map = new Map<string, SecurityAuditRecord>();
                    // Put seed audits
                    SEED_SECURITY_AUDITS.forEach((s) => map.set(s.id, s));
                    // Put existing
                    prev.forEach((p) => map.set(p.id, p));
                    // Merge live Firestore docs
                    docs.forEach((d: any) => {
                        const rec: SecurityAuditRecord = {
                            id: d.id || `audit_${Date.now()}`,
                            eventType: d.eventType || 'FAILED_BIOMETRIC_UNLOCK',
                            action: d.action || 'BIOMETRIC_UNLOCK_FAILED',
                            status: d.status || 'DENIED',
                            timestamp: d.timestamp || new Date().toISOString(),
                            timestampMs: d.timestampMs || Date.now(),
                            localTime: d.localTime || new Date().toLocaleString(),
                            device: d.device || 'Biometric Scanner Device',
                            method: d.method || 'WebAuthn Assertion',
                            errorMessage: d.errorMessage || 'Biometric verification failed',
                            targetView: d.targetView || 'Restricted Vault',
                            targetUserEmail: d.targetUserEmail,
                            targetUserName: d.targetUserName,
                            clearanceLevel: d.clearanceLevel || 'LEVEL-5 ADMIN CLEARANCE',
                            severity: d.severity || 'HIGH',
                            geolocation: d.geolocation || {
                                latitude: 27.6094,
                                longitude: 75.1398,
                                source: 'gps',
                                city: 'Facility Perimeter',
                                country: 'India',
                                mapsUrl: 'https://maps.google.com/?q=27.6094,75.1398'
                            },
                            userAgent: d.userAgent || navigator.userAgent,
                            network: d.network
                        };
                        map.set(rec.id, rec);
                    });
                    return Array.from(map.values()).sort((a, b) => b.timestampMs - a.timestampMs);
                });
            } else {
                setSecurityAudits((prev) => (prev.length === 0 ? SEED_SECURITY_AUDITS : prev));
            }
            setLoadingFirestore(false);
        });

        // Sync local storage security audits as well
        const handleLocalAudit = () => {
            try {
                const storedSecAudits = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
                if (storedSecAudits && storedSecAudits.length > 0) {
                    setSecurityAudits((prev) => {
                        const map = new Map<string, SecurityAuditRecord>();
                        prev.forEach((p) => map.set(p.id, p));
                        storedSecAudits.forEach((s: SecurityAuditRecord) => map.set(s.id, s));
                        return Array.from(map.values()).sort((a, b) => b.timestampMs - a.timestampMs);
                    });
                }
            } catch (err) {
                console.warn('Error reading local security audits:', err);
            }
        };
        handleLocalAudit();
        window.addEventListener('security_audit_updated', handleLocalAudit);

        return () => {
            isMounted = false;
            window.removeEventListener('security_audit_updated', handleLocalAudit);
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    // 2. Load LocalStorage Trace Logs
    useEffect(() => {
        const storedLogs = JSON.parse(localStorage.getItem('biometric_logs') || '[]');
        setLocalLogs(storedLogs);

        const handleStorage = () => {
            const up = JSON.parse(localStorage.getItem('biometric_logs') || '[]');
            setLocalLogs(up);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Filtered Security Audits
    const filteredSecurityAudits = useMemo(() => {
        let list = [...securityAudits];
        const term = searchTerm.toLowerCase().trim();

        if (term) {
            list = list.filter((audit) => {
                const matchErr = (audit.errorMessage || '').toLowerCase().includes(term);
                const matchDevice = (audit.device || '').toLowerCase().includes(term);
                const matchUser = (audit.targetUserName || '').toLowerCase().includes(term);
                const matchEmail = (audit.targetUserEmail || '').toLowerCase().includes(term);
                const matchView = (audit.targetView || '').toLowerCase().includes(term);
                const matchCity = (audit.geolocation?.city || '').toLowerCase().includes(term);
                const matchMethod = (audit.method || '').toLowerCase().includes(term);
                const matchId = (audit.id || '').toLowerCase().includes(term);
                return (
                    matchErr ||
                    matchDevice ||
                    matchUser ||
                    matchEmail ||
                    matchView ||
                    matchCity ||
                    matchMethod ||
                    matchId
                );
            });
        }

        if (severityFilter !== 'all') {
            list = list.filter((audit) => audit.severity === severityFilter);
        }

        if (startDate) {
            const startMs = new Date(`${startDate}T00:00:00`).getTime();
            if (!isNaN(startMs)) {
                list = list.filter((audit) => {
                    const auditTime = audit.timestampMs || new Date(audit.timestamp).getTime();
                    return !isNaN(auditTime) && auditTime >= startMs;
                });
            }
        }

        if (endDate) {
            const endMs = new Date(`${endDate}T23:59:59.999`).getTime();
            if (!isNaN(endMs)) {
                list = list.filter((audit) => {
                    const auditTime = audit.timestampMs || new Date(audit.timestamp).getTime();
                    return !isNaN(auditTime) && auditTime <= endMs;
                });
            }
        }

        return list.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
    }, [securityAudits, searchTerm, severityFilter, startDate, endDate]);

    // Handle Manual Trigger: Simulate Failed Unlock with GPS and log to Firestore
    const handleSimulateFailedUnlock = async () => {
        setIsSimulating(true);
        try {
            const record = await logFailedBiometricUnlock({
                method: 'WebAuthn Platform Authenticator (Simulated Breach)',
                errorMessage: 'Biometric fingerprint mismatch detected during restricted gate passage',
                targetView: 'perimeter_security_barrier',
                targetUserEmail: 'intruder.test@breach.example.com',
                targetUserName: 'Simulated Unauthorized Operator',
                clearanceLevel: 'LEVEL-5 ADMIN CLEARANCE',
                deviceLabel: 'Turnstile Scanner Terminal 01 (Biometric Sensor)',
                severity: 'CRITICAL'
            });

            addToast(
                `Logged failed unlock attempt to Firestore 'security_audit' [Geo: ${record.geolocation.latitude}, ${record.geolocation.longitude}]!`,
                'error'
            );
        } catch (err: any) {
            console.error('Error logging simulated failed unlock:', err);
            addToast(`Failed to record security audit: ${err.message || err}`, 'error');
        } finally {
            setIsSimulating(false);
        }
    };

    // Export security audits to CSV
    const handleExportCsv = () => {
        if (filteredSecurityAudits.length === 0) {
            addToast('No security audit records to export.', 'info');
            return;
        }

        const headers = [
            'Audit ID',
            'Timestamp (ISO)',
            'Status',
            'Severity',
            'Error Reason',
            'Method',
            'Target User',
            'Target Email',
            'Clearance Level',
            'Target View',
            'Latitude',
            'Longitude',
            'GPS Accuracy (m)',
            'Location Source',
            'City / Perimeter',
            'Google Maps Link',
            'Device & OS',
            'User Agent'
        ];

        const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const rows = filteredSecurityAudits.map((a) => [
            escape(a.id),
            escape(a.timestamp),
            escape(a.status),
            escape(a.severity),
            escape(a.errorMessage),
            escape(a.method),
            escape(a.targetUserName || 'Unknown'),
            escape(a.targetUserEmail || 'N/A'),
            escape(a.clearanceLevel || 'LEVEL-5'),
            escape(a.targetView || 'Restricted'),
            escape(a.geolocation?.latitude),
            escape(a.geolocation?.longitude),
            escape(a.geolocation?.accuracy ?? 'N/A'),
            escape(a.geolocation?.source || 'gps'),
            escape(a.geolocation?.city || 'Facility Corridor'),
            escape(a.geolocation?.mapsUrl || ''),
            escape(a.device),
            escape(a.userAgent)
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const rangeSuffix = startDate || endDate ? `_${startDate || 'earliest'}_to_${endDate || 'latest'}` : '';
        a.download = `security_audit_failed_unlocks${rangeSuffix}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addToast(`Exported ${filteredSecurityAudits.length} security audit records with Geolocation!`, 'success');
    };

    const clearLocalLogs = () => {
        localStorage.removeItem('biometric_logs');
        setLocalLogs([]);
        addToast('Cleared local biometric trace logs.', 'info');
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen text-white space-y-6 pb-20">
            {/* 1. Header Banner */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-red-950/50 text-red-400 border border-red-500/30 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                                Firestore Security Audit Engine
                            </span>
                            <span className="px-3 py-1 bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono tracking-widest rounded-md flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-cyan-400" />
                                GPS GEOLOCATION
                            </span>
                            <span className="px-3 py-1 bg-amber-950/40 text-amber-400 border border-amber-500/30 text-[9px] font-mono tracking-widest rounded-md">
                                ISO TIMESTAMP
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 uppercase tracking-tight flex items-center gap-3">
                            Biometric Security Audit
                        </h1>
                        <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mt-1 max-w-2xl">
                            Automatic telemetry of failed biometric unlock attempts with latitude/longitude coordinates and UTC timestamps logged to Firestore collection <code className="text-red-400 font-mono">security_audit</code>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={handleSimulateFailedUnlock}
                            disabled={isSimulating}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-600/30 to-rose-600/30 hover:from-red-600/50 hover:to-rose-600/50 text-red-200 border border-red-500/40 px-4 py-3 rounded-2xl transition-all text-xs font-bold shadow-lg shadow-red-950/30 cursor-pointer disabled:opacity-50"
                            title="Simulate failed biometric unlock to verify geolocation capture & Firestore 'security_audit' write"
                        >
                            <Zap className={`w-4 h-4 text-red-400 ${isSimulating ? 'animate-bounce' : ''}`} />
                            <span>{isSimulating ? 'Logging GPS Fix...' : 'Simulate Failed Unlock'}</span>
                        </button>

                        <button
                            onClick={handleExportCsv}
                            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-4 py-3 rounded-2xl transition-colors text-xs font-bold cursor-pointer"
                            title="Download CSV archive including Geolocation & Timestamps"
                        >
                            <Download className="w-4 h-4 text-emerald-400" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Navigation Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/90 border border-zinc-800 p-2.5 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('security_audit')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'security_audit'
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/40'
                                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Firestore Security Audits</span>
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold text-red-200 border border-red-500/30">
                            {filteredSecurityAudits.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('local_trace')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'local_trace'
                                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40 font-black'
                                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                    >
                        <Fingerprint className="w-4 h-4" />
                        <span>Local Device Trace</span>
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold text-zinc-300 border border-zinc-700">
                            {localLogs.length}
                        </span>
                    </button>
                </div>

                <div className="text-[11px] font-mono text-zinc-400 hidden sm:flex items-center gap-2 px-3">
                    <Globe className="w-3.5 h-3.5 text-red-400" />
                    <span>Collection: <strong>security_audit</strong></span>
                </div>
            </div>

            {/* TAB 1: FIRESTORE SECURITY AUDIT TAB */}
            {activeTab === 'security_audit' && (
                <div className="space-y-4">
                    {/* Search & Date-Range Filters */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-md">
                        {/* Top Row: Search Input + Presets */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-red-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by Reason, Device, User, City, or Audit ID..."
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Date Presets */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">
                                    Quick Range:
                                </span>
                                {(
                                    [
                                        { id: 'all', label: 'All Time' },
                                        { id: 'today', label: 'Today' },
                                        { id: '24h', label: '24h' },
                                        { id: '7d', label: 'Last 7d' },
                                        { id: '30d', label: 'Last 30d' },
                                    ] as const
                                ).map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => applyDatePreset(preset.id)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                            datePreset === preset.id
                                                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm shadow-red-500/20'
                                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Row: Date Pickers + Severity + Counter + Reset */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900">
                            {/* Date Pickers */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs">
                                    <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    <span className="text-zinc-500 text-[10px] uppercase font-bold">From:</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setDatePreset('custom');
                                        }}
                                        className="bg-transparent text-white text-[11px] font-mono focus:outline-none cursor-pointer"
                                    />
                                    {startDate && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStartDate('');
                                                setDatePreset('custom');
                                            }}
                                            className="text-zinc-500 hover:text-white ml-0.5"
                                            title="Clear start date"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs">
                                    <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    <span className="text-zinc-500 text-[10px] uppercase font-bold">To:</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setDatePreset('custom');
                                        }}
                                        className="bg-transparent text-white text-[11px] font-mono focus:outline-none cursor-pointer"
                                    />
                                    {endDate && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEndDate('');
                                                setDatePreset('custom');
                                            }}
                                            className="text-zinc-500 hover:text-white ml-0.5"
                                            title="Clear end date"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {(startDate || endDate) && (
                                    <button
                                        type="button"
                                        onClick={() => applyDatePreset('all')}
                                        className="px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                        title="Reset date range"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Reset Range
                                    </button>
                                )}
                            </div>

                            {/* Severity Filter & Total Counter */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
                                    <Filter className="w-3.5 h-3.5 text-zinc-400" />
                                    <span className="text-zinc-500 text-[10px] uppercase font-bold">Severity:</span>
                                    <select
                                        value={severityFilter}
                                        onChange={(e) => setSeverityFilter(e.target.value as any)}
                                        className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                                    >
                                        <option value="all" className="bg-zinc-900">All Severities</option>
                                        <option value="CRITICAL" className="bg-zinc-900">Critical Breach</option>
                                        <option value="HIGH" className="bg-zinc-900">High</option>
                                    </select>
                                </div>

                                {(searchTerm || severityFilter !== 'all' || startDate || endDate) && (
                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                )}

                                <span className="text-[11px] font-mono text-zinc-300 px-2.5 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
                                    <strong className="text-red-400">{filteredSecurityAudits.length}</strong> / {securityAudits.length} Events
                                </span>
                            </div>
                        </div>

                        {/* Active Date Window Summary Badge */}
                        {(startDate || endDate) && (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-red-300 bg-red-950/20 border border-red-500/20 px-3 py-1.5 rounded-xl">
                                <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                <span>
                                    Filtered Window: <strong>{startDate || 'Earliest recorded'}</strong> to <strong>{endDate || 'Latest recorded'}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Audit Cards Grid */}
                    <div className="grid gap-4">
                        {loadingFirestore ? (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500">
                                <RefreshCw className="w-8 h-8 text-red-400 animate-spin mx-auto mb-3" />
                                <p className="text-sm font-semibold">Streaming real-time failed unlock audits from Firestore 'security_audit'...</p>
                            </div>
                        ) : filteredSecurityAudits.length === 0 ? (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500">
                                <Shield className="w-12 h-12 mx-auto mb-4 text-zinc-600 opacity-50" />
                                <h3 className="text-lg font-bold text-zinc-300">No Failed Unlock Audits Found</h3>
                                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                                    No security breaches or failed biometric assertions matching your filter. Click <strong>'Simulate Failed Unlock'</strong> above to test Firestore logging with GPS coordinates.
                                </p>
                            </div>
                        ) : (
                            filteredSecurityAudits.map((audit, index) => {
                                const lat = audit.geolocation?.latitude ?? 27.6094;
                                const lon = audit.geolocation?.longitude ?? 75.1398;
                                const mapsUrl = audit.geolocation?.mapsUrl || `https://maps.google.com/?q=${lat},${lon}`;
                                const isCritical = audit.severity === 'CRITICAL';

                                return (
                                    <motion.div
                                        key={audit.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="bg-zinc-950 border border-zinc-800/80 hover:border-red-500/40 p-5 rounded-3xl transition-all shadow-xl group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-red-500 to-rose-600" />

                                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                            {/* Left: Status & Reason */}
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                                                    isCritical
                                                        ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-lg shadow-red-950/50'
                                                        : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                                                }`}>
                                                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono text-xs font-black uppercase text-red-300 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-500/30">
                                                            {audit.action}
                                                        </span>
                                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300">
                                                            {audit.severity} SEVERITY
                                                        </span>
                                                        <span className="text-[10px] font-mono text-zinc-500">
                                                            ID: <code className="text-zinc-400">{audit.id}</code>
                                                        </span>
                                                    </div>

                                                    <h3 className="text-sm font-bold text-white group-hover:text-red-200 transition-colors">
                                                        {audit.errorMessage}
                                                    </h3>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                                                        <span className="flex items-center gap-1">
                                                            <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                                                            {audit.device}
                                                        </span>
                                                        {audit.targetUserName && (
                                                            <span className="text-zinc-300 font-semibold">
                                                                Subject: {audit.targetUserName}
                                                            </span>
                                                        )}
                                                        {audit.targetView && (
                                                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-cyan-300">
                                                                Target: {audit.targetView}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Geolocation & Timestamp */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-zinc-900 pt-3 lg:pt-0">
                                                {/* Geolocation Tag */}
                                                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 min-w-[200px]">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1 font-mono">
                                                            <MapPin className="w-3 h-3 text-cyan-400" /> Geolocation
                                                        </span>
                                                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                                                            {audit.geolocation?.source || 'GPS'}
                                                        </span>
                                                    </div>

                                                    <div className="font-mono text-xs font-bold text-zinc-200">
                                                        {lat.toFixed(4)}°, {lon.toFixed(4)}°
                                                    </div>

                                                    <div className="text-[10px] text-zinc-400 truncate max-w-[190px] mt-0.5">
                                                        {audit.geolocation?.city || 'Facility Corridor'}
                                                    </div>

                                                    <a
                                                        href={mapsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                                                    >
                                                        <span>Open Map Pin</span>
                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                </div>

                                                {/* Timestamp & Actions */}
                                                <div className="text-left sm:text-right space-y-1">
                                                    <div className="font-mono text-xs text-zinc-300 font-bold flex items-center sm:justify-end gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                                        {format(new Date(audit.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 font-mono">
                                                        UTC: {audit.timestamp.split('.')[0]}Z
                                                    </div>

                                                    <button
                                                        onClick={() => setSelectedAuditRecord(audit)}
                                                        className="mt-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                    >
                                                        <Terminal className="w-3 h-3 text-cyan-400" />
                                                        <span>Inspect JSON</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: LOCAL TRACE TAB */}
            {activeTab === 'local_trace' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                        <div>
                            <h3 className="text-sm font-bold text-white">Local Authenticator Trace Log</h3>
                            <p className="text-xs text-zinc-500">Diagnostic cache stored in local browser state.</p>
                        </div>
                        <button
                            onClick={clearLocalLogs}
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear Local Trace
                        </button>
                    </div>

                    <div className="grid gap-3">
                        {localLogs.length === 0 ? (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500">
                                <Fingerprint className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">No local biometric trace records.</p>
                            </div>
                        ) : (
                            localLogs.map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                            {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">
                                                    {log.status === 'success' ? 'Authentication Granted' : 'Authentication Denied'}
                                                </span>
                                                <span className={`text-[9px] uppercase font-mono font-black px-2 py-0.5 rounded-full ${
                                                    log.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-0.5">
                                                {log.device} • {log.userType}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs font-mono text-zinc-400">
                                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Inspect JSON Modal */}
            {selectedAuditRecord && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-red-400" />
                                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                                    Firestore <span className="text-red-400">security_audit</span> Payload
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedAuditRecord(null)}
                                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-black p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 custom-scrollbar">
                            <pre className="whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(selectedAuditRecord, null, 2)}
                            </pre>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                            <a
                                href={selectedAuditRecord.geolocation?.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                View Geolocation on Maps
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                            <button
                                onClick={() => setSelectedAuditRecord(null)}
                                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BiometricLogs;
