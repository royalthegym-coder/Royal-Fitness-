import React, { useState, useEffect } from 'react';
import { QrCode, ScanFace, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminQRCheckIn() {
    const [scanActive, setScanActive] = useState(true);
    const [lastScan, setLastScan] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    const handleManualScan = (mockPayload?: string) => {
        if (!scanActive) return;
        const payloadStr = mockPayload || `MEMBER_QR_V2#${Math.floor(Math.random() * 90) + 10}`;
        const newScan = {
            status: 'success',
            name: 'Check-in Recorded',
            time: new Date().toLocaleTimeString(),
            reason: `Membership Active (${payloadStr})`
        };
        setLastScan(newScan);
        setHistory(prev => [newScan, ...prev].slice(0, 10));
        setTimeout(() => setLastScan(null), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Access Terminal</h2>
                    <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono">RFID / QR Entry Node</p>
                </div>
                <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden p-1">
                    <button 
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${scanActive ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-gray-500'}`}
                        onClick={() => setScanActive(true)}
                    >
                        Active
                    </button>
                    <button 
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${!scanActive ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'text-gray-500'}`}
                        onClick={() => setScanActive(false)}
                    >
                        Offline
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-[3rem] p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black opacity-50"></div>
                    
                    {scanActive ? (
                        <>
                            <div className="relative z-10 w-64 h-64 border-2 border-cyan-500/50 rounded-3xl flex items-center justify-center p-4">
                                <div className="absolute inset-0 border-t-2 border-cyan-400 w-full animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
                                <QrCode className="w-32 h-32 text-cyan-500/30" />
                            </div>
                            <p className="mt-8 text-cyan-400 font-mono text-sm uppercase tracking-[0.4em] animate-pulse">Awaiting Signal...</p>
                        </>
                    ) : (
                        <div className="text-center z-10">
                            <ScanFace className="w-24 h-24 text-gray-700 mx-auto mb-4" />
                            <p className="text-red-500 font-black uppercase tracking-widest">Scanner Offline</p>
                        </div>
                    )}
                    
                    {scanActive && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                            <button 
                                onClick={() => handleManualScan('MEMBER_QR_V2#101')} 
                                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Test QR Scanner
                            </button>
                            <button 
                                onClick={() => handleManualScan()} 
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Process Scan
                            </button>
                        </div>
                    )}

                    <AnimatePresence>
                        {lastScan && (
                            <motion.div 
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`absolute inset-x-8 bottom-8 p-6 rounded-3xl backdrop-blur-2xl border ${lastScan.status === 'success' ? 'bg-green-900/30 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'bg-red-900/30 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]'}`}
                            >
                                <div className="flex items-center gap-4">
                                    {lastScan.status === 'success' ? <CheckCircle className="w-12 h-12 text-green-400" /> : <XCircle className="w-12 h-12 text-red-500" />}
                                    <div>
                                        <h3 className={`text-2xl font-black uppercase italic ${lastScan.status === 'success' ? 'text-green-400' : 'text-red-500'}`}>{lastScan.name}</h3>
                                        <p className="text-white text-xs uppercase tracking-widest font-mono mt-1">{lastScan.reason} • {lastScan.time}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="w-full md:w-80 bg-black/40 border border-white/10 rounded-[3rem] p-6 backdrop-blur-xl h-[400px] flex flex-col">
                    <h3 className="text-white font-black uppercase tracking-widest mb-6">Recent Entries</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {history.length === 0 && <p className="text-gray-500 text-xs italic">No entries yet.</p>}
                        {history.map((entry, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <p className="text-white font-bold text-sm">{entry.name}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-green-400 uppercase tracking-widest border border-green-500/30 px-2 py-0.5 rounded-full bg-green-500/10">Granted</span>
                                    <span className="text-[10px] text-gray-500 font-mono">{entry.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes scan {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(220px); }
                }
            `}</style>
        </div>
    );
}
