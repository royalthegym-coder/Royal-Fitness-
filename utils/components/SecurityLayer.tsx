
import React, { useState } from 'react';
import Card from './common/Card';
import { 
    ShieldAlert, Lock, Unlock, Eye, Activity, 
    AlertTriangle, Video, Fingerprint, History, Siren 
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';

const SecurityLayer: React.FC = () => {
    const { auditLogs } = useData();
    const { addToast } = useToast();
    const [doorStatus, setDoorStatus] = useState<'LOCKED' | 'UNLOCKED'>('LOCKED');
    const [alarmActive, setAlarmActive] = useState(false);
    
    // Mock Cams
    const cams = [
        { id: 1, name: 'Main Entrance', status: 'Online' },
        { id: 2, name: 'Weight Floor', status: 'Online' },
        { id: 3, name: 'Cardio Deck', status: 'Recording' },
        { id: 4, name: 'Back Exit', status: 'Online' },
    ];

    const toggleLock = () => {
        const newStatus = doorStatus === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
        setDoorStatus(newStatus);
        addToast(`Main Gate: ${newStatus}`, newStatus === 'LOCKED' ? 'error' : 'success');
    };

    const toggleAlarm = () => {
        setAlarmActive(!alarmActive);
        if(!alarmActive) addToast("EMERGENCY PROTOCOL INITIATED.", "error");
        else addToast("Alarm Silenced.", "info");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            <div className={`p-10 rounded-[3.5rem] border transition-all duration-500 shadow-2xl relative overflow-hidden ${alarmActive ? 'bg-red-950 border-red-500 animate-pulse' : 'bg-[#050505] border-red-500/20'}`}>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            <ShieldAlert className={`w-12 h-12 ${alarmActive ? 'text-white' : 'text-red-500'}`} />
                            Security <span className={alarmActive ? 'text-white' : 'text-red-500'}>Grid</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-mono mt-2 tracking-widest">PERIMETER CONTROL v31.0</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={toggleLock}
                            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all ${doorStatus === 'LOCKED' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                        >
                            {doorStatus === 'LOCKED' ? <Lock className="w-4 h-4"/> : <Unlock className="w-4 h-4"/>}
                            {doorStatus === 'LOCKED' ? 'UNLOCK GATE' : 'LOCK GATE'}
                        </button>
                        <button 
                            onClick={toggleAlarm}
                            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all ${alarmActive ? 'bg-white text-red-600' : 'bg-red-900/20 border border-red-500 text-red-500 hover:bg-red-600 hover:text-white'}`}
                        >
                            <Siren className="w-4 h-4"/>
                            {alarmActive ? 'DISARM SYSTEM' : 'PANIC ALERT'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cameras */}
                <Card title="Visual Surveillance" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                    <div className="grid grid-cols-2 gap-4">
                        {cams.map(cam => (
                            <div key={cam.id} className="bg-black aspect-video rounded-xl border border-white/10 relative overflow-hidden group">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Video className="w-8 h-8 text-gray-700" />
                                </div>
                                <div className="absolute top-2 left-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-[9px] font-black uppercase text-red-500 tracking-widest">REC</span>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                    <span className="text-xs font-bold text-white">{cam.name}</span>
                                </div>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Access Logs */}
                <Card title="Access Ledger" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] h-[500px] flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {auditLogs.filter(l => l.action.includes('ACCESS') || l.action.includes('LOCK')).map((log, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                                <div className={`p-3 rounded-xl ${log.action.includes('DENIED') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    <Fingerprint className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{log.action}</p>
                                    <p className="text-gray-500 text-[10px] font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                                    <p className="text-gray-400 text-xs mt-1">{log.details}</p>
                                </div>
                            </div>
                        ))}
                        {auditLogs.length === 0 && (
                            <p className="text-gray-600 text-center py-10 uppercase tracking-widest text-xs">No recent security events.</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SecurityLayer;
