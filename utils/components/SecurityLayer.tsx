
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { LockIcon } from './icons/LockIcon';
import { CubeIcon } from './icons/CubeIcon';
import { BanIcon } from './icons/BanIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { getComplexResponse } from '../../lib/gemini';

// --- DATA STRUCTURES ---

interface Vulnerability {
    id: string;
    tool: 'OWASP ZAP' | 'Trivy';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    title: string;
    description: string;
    remediation?: string;
}

interface BannedIP {
    ip: string;
    jail: string;
    timestamp: string;
    country: string;
}

interface SiemEvent {
    id: number;
    rule: string;
    level: number; // 1-15
    source: string;
    timestamp: string;
}

const SecurityLayer: React.FC = () => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'vuln' | 'defense'>('vuln');
    
    // OWASP ZAP & Trivy State
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [scanProgress, setScanProgress] = useState(0);
    const [currentScanTarget, setCurrentScanTarget] = useState('');

    // Active Defense State (Fail2Ban, Wazuh)
    const [bannedIps, setBannedIps] = useState<BannedIP[]>([]);
    const [siemEvents, setSiemEvents] = useState<SiemEvent[]>([]);
    const [defcon, setDefcon] = useState(5);
    
    // AI Analyst State
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

    // --- EFFECTS ---

    // Simulate Active Defense Stream (Fail2Ban & Wazuh)
    useEffect(() => {
        const interval = setInterval(() => {
            // Random Fail2Ban Event
            if (Math.random() > 0.8) {
                const ip = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
                const jails = ['sshd', 'nginx-http-auth', 'recidive'];
                const countries = ['CN', 'RU', 'US', 'BR', 'IN'];
                setBannedIps(prev => [{
                    ip,
                    jail: jails[Math.floor(Math.random() * jails.length)],
                    timestamp: new Date().toLocaleTimeString(),
                    country: countries[Math.floor(Math.random() * countries.length)]
                }, ...prev].slice(0, 10));
            }

            // Random Wazuh SIEM Event
            if (Math.random() > 0.7) {
                const rules = [
                    { msg: 'File integrity changed', level: 7, src: '/etc/passwd' },
                    { msg: 'SSH Brute Force attempt', level: 10, src: '192.168.1.50' },
                    { msg: 'Privilege escalation detected', level: 12, src: 'user: root' },
                    { msg: 'New port open', level: 5, src: 'tcp/8080' }
                ];
                const rule = rules[Math.floor(Math.random() * rules.length)];
                
                // Adjust DEFCON based on events
                if (rule.level >= 10) setDefcon(prev => Math.max(1, prev - 1));
                
                setSiemEvents(prev => [{
                    id: Date.now(),
                    rule: rule.msg,
                    level: rule.level,
                    source: rule.src,
                    timestamp: new Date().toLocaleTimeString()
                }, ...prev].slice(0, 15));
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // --- HANDLERS ---

    const handleStartScan = () => {
        setScanStatus('scanning');
        setScanProgress(0);
        setVulnerabilities([]);
        setAiAnalysis(null);
        setSelectedVuln(null);

        const targets = ['royal-gym-api:latest', 'postgres:14-alpine', 'frontend-react:build', 'https://royal-gym.com/api/login'];
        let progress = 0;

        const interval = setInterval(() => {
            progress += 10;
            setScanProgress(progress);
            setCurrentScanTarget(targets[Math.floor((progress / 100) * targets.length)] || 'Finalizing...');

            if (progress >= 100) {
                clearInterval(interval);
                setScanStatus('complete');
                setCurrentScanTarget('Scan Complete');
                
                // Mock Findings
                setVulnerabilities([
                    { id: 'v1', tool: 'Trivy', severity: 'Critical', title: 'CVE-2023-44487 (HTTP/2)', description: 'Rapid Reset vulnerability in base image.' },
                    { id: 'v2', tool: 'OWASP ZAP', severity: 'High', title: 'SQL Injection', description: 'Possible SQLi in /api/members?sort=' },
                    { id: 'v3', tool: 'OWASP ZAP', severity: 'Medium', title: 'Missing Security Headers', description: 'X-Frame-Options not set.' },
                    { id: 'v4', tool: 'Trivy', severity: 'High', title: 'CVE-2024-1002', description: 'Buffer overflow in libxml2.' },
                ]);
            }
        }, 800);
    };

    const handleAiAnalyze = async (vuln: Vulnerability) => {
        setSelectedVuln(vuln);
        setIsAnalyzing(true);
        setAiAnalysis(null);

        const prompt = `
            Act as a Senior Security Analyst. Analyze this vulnerability detected by ${vuln.tool}:
            Title: ${vuln.title}
            Severity: ${vuln.severity}
            Description: ${vuln.description}
            Context: Tech stack is Node.js, React, PostgreSQL, Docker.

            Provide:
            1. Brief explanation of the risk.
            2. 2-3 Concrete remediation steps (commands or code snippets).
            Format as HTML.
        `;

        try {
            const result = await getComplexResponse(prompt);
            setAiAnalysis(result);
        } catch (e) {
            console.error(e);
            setAiAnalysis("AI Analysis service currently unavailable.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSeverityColor = (level: string | number) => {
        if (typeof level === 'number') {
            if (level >= 12) return 'text-red-500';
            if (level >= 7) return 'text-orange-500';
            return 'text-blue-400';
        }
        switch (level) {
            case 'Critical': return 'text-red-600 bg-red-900/20 border-red-900';
            case 'High': return 'text-orange-500 bg-orange-900/20 border-orange-900';
            case 'Medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-900';
            default: return 'text-blue-400 bg-blue-900/20 border-blue-900';
        }
    };

    // --- RENDERERS ---

    const renderVulnManagement = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-t-4 border-blue-500">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <ShieldCheckIcon className="w-6 h-6 mr-2 text-blue-400" />
                                Full Stack Scanner
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Orchestrates OWASP ZAP (DAST) & Trivy (Container Security)</p>
                        </div>
                        <button 
                            onClick={handleStartScan}
                            disabled={scanStatus === 'scanning'}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center disabled:bg-gray-700"
                        >
                            {scanStatus === 'scanning' ? <AutoUpdateIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparkleIcon className="w-4 h-4 mr-2"/>}
                            {scanStatus === 'scanning' ? 'Scanning...' : 'Start Deep Scan'}
                        </button>
                    </div>

                    {scanStatus === 'scanning' && (
                        <div className="mb-6">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Target: {currentScanTarget}</span>
                                <span>{scanProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {vulnerabilities.length === 0 && scanStatus !== 'scanning' && (
                            <div className="text-center py-10 text-gray-500">
                                <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>System Clean. No vulnerabilities detected in last scan.</p>
                            </div>
                        )}
                        {vulnerabilities.map(vuln => (
                            <div 
                                key={vuln.id} 
                                className={`p-4 rounded-lg border flex justify-between items-center hover:bg-gray-700/50 transition-colors cursor-pointer ${selectedVuln?.id === vuln.id ? 'bg-gray-700 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
                                onClick={() => handleAiAnalyze(vuln)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="pt-1">
                                        {vuln.tool === 'Trivy' ? <CubeIcon className="w-5 h-5 text-green-400" /> : <LockIcon className="w-5 h-5 text-purple-400" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityColor(vuln.severity)}`}>
                                                {vuln.severity.toUpperCase()}
                                            </span>
                                            <h4 className="font-bold text-gray-200 text-sm">{vuln.title}</h4>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{vuln.description}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">Source: {vuln.tool}</p>
                                    </div>
                                </div>
                                <button className="text-xs bg-gray-700 hover:bg-gray-600 text-blue-300 px-3 py-1 rounded border border-gray-600">
                                    Analyze
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <Card title="AI Security Analyst" className="h-full bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700">
                    {!selectedVuln ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
                            <BotIcon className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-center text-sm">Select a vulnerability to generate a remediation plan.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="mb-4 pb-4 border-b border-gray-700">
                                <p className="text-xs text-gray-400 uppercase font-bold">Current Issue</p>
                                <p className="text-white font-bold">{selectedVuln.title}</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center h-40">
                                        <SparkleIcon className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                                        <p className="text-xs text-amber-400">Consulting Knowledge Base...</p>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div className="prose dark:prose-invert prose-sm text-xs" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                                ) : null}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );

    const renderActiveDefense = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Fail2Ban */}
            <Card title="Fail2Ban Jail Monitor" className="border-t-4 border-red-500">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-sm text-gray-400">Active Bans</p>
                        <p className="text-3xl font-bold text-white">{bannedIps.length + 142}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-xl font-black ${defcon === 1 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                            DEFCON {defcon}
                        </div>
                        <p className="text-xs text-gray-500">Threat Level</p>
                    </div>
                </div>
                <div className="bg-black/30 rounded-lg overflow-hidden border border-gray-700">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-800 text-gray-400">
                            <tr>
                                <th className="p-3">IP Address</th>
                                <th className="p-3">Jail</th>
                                <th className="p-3">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {bannedIps.map((ban, i) => (
                                <tr key={i} className="hover:bg-gray-800/50 animate-fade-in">
                                    <td className="p-3 font-mono text-red-300 flex items-center">
                                        <BanIcon className="w-3 h-3 mr-2" /> {ban.ip} <span className="ml-2 opacity-50 text-[10px]">{ban.country}</span>
                                    </td>
                                    <td className="p-3 text-gray-300">{ban.jail}</td>
                                    <td className="p-3 text-gray-500">{ban.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Wazuh SIEM */}
            <Card title="Wazuh SIEM Events" className="border-t-4 border-purple-500">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-sm text-gray-400">Security Events (Last Hour)</p>
                        <p className="text-3xl font-bold text-white">89</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Integrity Check</p>
                        <p className="text-green-400 font-bold text-sm">PASSED</p>
                    </div>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {siemEvents.map((event) => (
                        <div key={event.id} className="bg-gray-800 p-3 rounded border-l-2 border-gray-700 flex justify-between items-center animate-fade-in" style={{ borderLeftColor: event.level >= 10 ? '#ef4444' : event.level >= 7 ? '#f97316' : '#3b82f6' }}>
                            <div>
                                <p className="text-sm font-bold text-gray-200">{event.rule}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{event.source} • {event.timestamp}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded bg-gray-900 ${getSeverityColor(event.level)}`}>
                                Level {event.level}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 flex items-center">
                        <ShieldCheckIcon className="w-8 h-8 mr-3 text-red-400" />
                        Security Command Center
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Integrated Threat Management & Vulnerability Scanning.</p>
                </div>
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('vuln')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'vuln' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Vulnerability Mgmt
                    </button>
                    <button 
                        onClick={() => setActiveTab('defense')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'defense' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Active Defense
                    </button>
                </div>
            </div>

            <div className="min-h-[600px]">
                {activeTab === 'vuln' ? renderVulnManagement() : renderActiveDefense()}
            </div>
        </div>
    );
};

export default SecurityLayer;
