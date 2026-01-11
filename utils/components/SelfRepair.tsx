
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { BugFixIcon } from './icons/BugFixIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { BotIcon } from './icons/BotIcon';
import { getComplexResponse } from '../../lib/gemini';

interface BugReport {
    id: string;
    code: string;
    location: string;
    description: string;
    severity: 'Low' | 'Medium' | 'Critical';
    status: 'Detected' | 'Analyzing' | 'Patching' | 'Resolved';
    aiAnalysis?: string;
    patchCode?: string;
}

const POTENTIAL_ISSUES: BugReport[] = [
    { id: '1', code: 'SEC-001', location: 'auth/Middleware.ts', description: 'Potential JWT token leakage in error logs.', severity: 'Critical', status: 'Detected' },
    { id: '2', code: 'PERF-099', location: 'components/Tracker.tsx', description: 'Unoptimized re-renders on scroll event.', severity: 'Medium', status: 'Detected' },
    { id: '3', code: 'MEM-102', location: 'utils/three-renderer.ts', description: 'WebGL Context not disposed properly.', severity: 'Critical', status: 'Detected' },
];

const SelfRepair: React.FC = () => {
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [currentScanFile, setCurrentScanFile] = useState('');
    const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);

    const handleScan = () => {
        setIsScanning(true);
        setBugs([]);
        setScanProgress(0);

        const fakeFiles = [
            'src/App.tsx', 'src/lib/gemini.ts', 'src/auth/AuthContext.tsx', 
            'src/components/Dashboard.tsx', 'src/utils/helpers.ts', 'server/api/routes.ts'
        ];

        let step = 0;
        const interval = setInterval(() => {
            step++;
            const progress = (step / fakeFiles.length) * 100;
            setScanProgress(progress);
            setCurrentScanFile(fakeFiles[step % fakeFiles.length]);

            if (progress >= 100) {
                clearInterval(interval);
                setIsScanning(false);
                setBugs(POTENTIAL_ISSUES); // In a real app, this would be the result of static analysis
                setCurrentScanFile('Scan Complete');
            }
        }, 600);
    };

    const handleAnalyze = async (bug: BugReport) => {
        setSelectedBug({ ...bug, status: 'Analyzing' });
        try {
            const prompt = `
                Act as a Senior DevOps Engineer. Analyze this bug report:
                Error Code: ${bug.code}
                Location: ${bug.location}
                Description: ${bug.description}
                
                1. Explain the root cause briefly.
                2. Write the specific Typescript/React code block to fix this.
                Format the response with HTML for bolding and <pre><code> for the code block.
            `;
            const response = await getComplexResponse(prompt);
            
            setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'Patching' } : b));
            setSelectedBug(prev => prev ? { ...prev, status: 'Patching', aiAnalysis: response } : null);
        } catch (e) { console.error(e); }
    };

    const handleFix = () => {
        if (!selectedBug) return;
        // Simulate patch application
        setTimeout(() => {
            setBugs(prev => prev.map(b => b.id === selectedBug.id ? { ...b, status: 'Resolved' } : b));
            setSelectedBug(null);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-red-900/30">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 flex items-center">
                        <BugFixIcon className="w-8 h-8 mr-3 text-red-400" />
                        System Immunity
                    </h1>
                    <p className="text-gray-400 text-xs mt-1 font-mono">
                        {isScanning ? `SCANNING: ${currentScanFile}` : 'SYSTEM INTEGRITY MONITOR: ONLINE'}
                    </p>
                </div>
                <button onClick={handleScan} disabled={isScanning} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold flex items-center shadow-lg shadow-red-900/20 transition-all">
                    {isScanning ? <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin"/> : <ShieldCheckIcon className="w-5 h-5 mr-2"/>}
                    {isScanning ? `${Math.round(scanProgress)}%` : 'Deep System Scan'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Detected Anomalies">
                    {isScanning ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-red-400 animate-pulse font-mono">Analyzing codebase structure...</p>
                        </div>
                    ) : bugs.length === 0 ? (
                        <div className="text-center py-12">
                            <ShieldCheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                            <p className="text-gray-500">System Secure. No threats detected.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bugs.map(bug => (
                                <div 
                                    key={bug.id} 
                                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                        bug.status === 'Resolved' ? 'bg-green-900/10 border-green-500/30' : 
                                        selectedBug?.id === bug.id ? 'bg-gray-700 border-red-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                    }`}
                                    onClick={() => bug.status !== 'Resolved' && handleAnalyze(bug)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                    bug.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'
                                                }`}>{bug.severity}</span>
                                                <p className="font-bold text-white text-sm font-mono">{bug.code}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{bug.description}</p>
                                            <p className="text-[10px] text-gray-500 mt-1 font-mono">{bug.location}</p>
                                        </div>
                                        {bug.status === 'Resolved' ? (
                                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                        ) : bug.status === 'Analyzing' || bug.status === 'Patching' ? (
                                            <AutoUpdateIcon className="w-5 h-5 text-amber-400 animate-spin" />
                                        ) : (
                                            <button className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-500 font-bold">
                                                Fix
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Patch Studio" className="relative overflow-hidden">
                    {selectedBug ? (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="p-3 bg-gray-900 rounded border border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Target File</p>
                                    <p className="text-white font-mono text-sm">{selectedBug.location}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">Status</p>
                                    <p className="text-amber-400 font-bold text-sm">{selectedBug.status}</p>
                                </div>
                            </div>
                            
                            <div className="flex-grow bg-black/50 rounded-lg p-4 border border-gray-700 overflow-y-auto max-h-[400px]">
                                {selectedBug.aiAnalysis ? (
                                    <div className="prose dark:prose-invert prose-sm max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: selectedBug.aiAnalysis }} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-amber-400 gap-3">
                                        <BotIcon className="w-8 h-8 animate-bounce"/> 
                                        <p className="animate-pulse">Generating Hotfix Solution...</p>
                                    </div>
                                )}
                            </div>

                            {selectedBug.aiAnalysis && selectedBug.status !== 'Resolved' && (
                                <button onClick={handleFix} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    Deploy Hotfix to Production
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 opacity-30">
                            <BotIcon className="w-16 h-16 mb-4" />
                            <p>Select a bug to analyze and patch.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default SelfRepair;
