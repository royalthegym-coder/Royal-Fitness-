import React, { useState } from 'react';
import Card from '../common/Card';
import { 
    Smartphone, QrCode, Lock, Unlock, Music, 
    Play, ThumbsUp, Radio, ShieldCheck, Zap,
    Fingerprint, CheckCircle, Activity, Volume2
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const SmartGymHub: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'access' | 'locker' | 'music'>('access');
    
    // Access State
    const [accessStatus, setAccessStatus] = useState<'idle' | 'scanning' | 'granted'>('idle');
    
    // Locker State
    const [lockerState, setLockerState] = useState<'locked' | 'unlocked'>('locked');
    const lockerNumber = "42";
    
    // Music State
    const [songs, setSongs] = useState([
        { id: 1, title: "Eye of the Tiger", artist: "Survivor", votes: 24, isPlaying: true },
        { id: 2, title: "Till I Collapse", artist: "Eminem", votes: 18, isPlaying: false },
        { id: 3, title: "Can't Be Touched", artist: "Roy Jones Jr.", votes: 15, isPlaying: false },
        { id: 4, title: "Remember the Name", artist: "Fort Minor", votes: 12, isPlaying: false },
        { id: 5, title: "Stronger", artist: "Kanye West", votes: 8, isPlaying: false },
    ]);

    const handleNFCTap = () => {
        setAccessStatus('scanning');
        setTimeout(() => {
            setAccessStatus('granted');
            addToast("Access Granted. Welcome to Fitness Future!", "success");
            setTimeout(() => setAccessStatus('idle'), 3000);
        }, 1500);
    };

    const toggleLocker = () => {
        const newState = lockerState === 'locked' ? 'unlocked' : 'locked';
        setLockerState(newState);
        addToast(`Locker #${lockerNumber} ${newState}`, "success");
    };

    const handleVote = (id: number) => {
        setSongs(prev => {
            const newSongs = prev.map(song => 
                song.id === id ? { ...song, votes: song.votes + 1 } : song
            );
            return newSongs.sort((a, b) => b.votes - a.votes);
        });
        addToast("Vote cast successfully!", "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            {/* HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-20 -top-20 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-cyan-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <Radio className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> IoT Connected
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYSTEM: ONLINE</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Gym</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="flex bg-gray-950 p-2 rounded-[2rem] border border-white/5 w-fit mx-auto backdrop-blur-xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'access', label: 'Smart Access', icon: <Fingerprint className="w-4 h-4" /> },
                    { id: 'locker', label: 'Smart Locker', icon: <Lock className="w-4 h-4" /> },
                    { id: 'music', label: 'Music Voting', icon: <Music className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap overflow-hidden group ${
                            activeTab === tab.id 
                            ? 'bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 backdrop-blur-xl border border-dashed border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                            : 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 backdrop-blur-xl border border-dashed border-gray-600/50 hover:border-gray-500 text-gray-500 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]'
                        }`}
                    >
                        <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <div className="relative z-10 flex items-center gap-3 group-hover:scale-105 transition-transform duration-500">
                            {tab.icon} {tab.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* CONTENT VIEWS */}
            {activeTab === 'access' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
                    <Card className="bg-gradient-to-br from-gray-900 to-black border-white/5 p-8 rounded-[3rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><QrCode className="w-64 h-64 text-white" /></div>
                        <div className="relative z-10 text-center space-y-6">
                            <div className="bg-white p-4 rounded-3xl inline-block shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                                <QrCode className="w-48 h-48 text-black" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Scan to Enter</h3>
                                <p className="text-gray-400 text-sm mt-2">Hold this QR code near the turnstile scanner.</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-cyan-900/20 to-black border-cyan-500/20 p-8 rounded-[3rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Smartphone className="w-64 h-64 text-cyan-500" /></div>
                        <div className="relative z-10 text-center space-y-8 w-full max-w-xs mx-auto">
                            <div className="relative">
                                {accessStatus === 'scanning' && (
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
                                )}
                                <button 
                                    onClick={handleNFCTap}
                                    disabled={accessStatus !== 'idle'}
                                    className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${
                                        accessStatus === 'granted' 
                                        ? 'bg-green-500 text-black shadow-[0_0_40px_rgba(34,197,94,0.6)]' 
                                        : 'bg-cyan-600 text-black shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:scale-105'
                                    }`}
                                >
                                    {accessStatus === 'granted' ? <CheckCircle className="w-12 h-12" /> : <Smartphone className="w-12 h-12" />}
                                </button>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
                                    {accessStatus === 'idle' ? 'Tap Phone' : accessStatus === 'scanning' ? 'Scanning...' : 'Access Granted'}
                                </h3>
                                <p className="text-gray-400 text-sm mt-2">Use NFC to tap at the entrance gate.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'locker' && (
                <div className="max-w-2xl mx-auto animate-slide-up">
                    <Card className={`border-2 p-12 rounded-[3.5rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[500px] transition-all duration-700 ${
                        lockerState === 'locked' 
                        ? 'bg-gradient-to-br from-red-900/20 to-black border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]' 
                        : 'bg-gradient-to-br from-green-900/20 to-black border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)]'
                    }`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            {lockerState === 'locked' ? <Lock className="w-64 h-64 text-red-500" /> : <Unlock className="w-64 h-64 text-green-500" />}
                        </div>
                        
                        <div className="relative z-10 text-center space-y-10">
                            <div>
                                <p className="text-gray-400 text-sm uppercase tracking-[0.3em] font-bold mb-2">Assigned Locker</p>
                                <h2 className="text-7xl font-black text-white italic">#{lockerNumber}</h2>
                            </div>

                            <button 
                                onClick={toggleLocker}
                                className={`w-48 h-48 mx-auto rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 group ${
                                    lockerState === 'locked'
                                    ? 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black shadow-[inset_0_0_30px_rgba(239,68,68,0.2)]'
                                    : 'bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black shadow-[inset_0_0_30px_rgba(34,197,94,0.2)]'
                                }`}
                            >
                                {lockerState === 'locked' ? (
                                    <>
                                        <Lock className="w-12 h-12 group-hover:scale-110 transition-transform" />
                                        <span className="font-black uppercase tracking-widest text-xs">Tap to Unlock</span>
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-12 h-12 group-hover:scale-110 transition-transform" />
                                        <span className="font-black uppercase tracking-widest text-xs">Tap to Lock</span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-2">
                                <ShieldCheck className={`w-5 h-5 ${lockerState === 'locked' ? 'text-red-500' : 'text-green-500'}`} />
                                <span className="text-gray-400 text-sm font-mono uppercase">
                                    Status: <span className={lockerState === 'locked' ? 'text-red-500' : 'text-green-500'}>{lockerState}</span>
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'music' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-gradient-to-br from-purple-900/40 to-black border-purple-500/30 p-8 rounded-[3rem] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-purple-500/20 rounded-2xl"><Volume2 className="w-6 h-6 text-purple-400" /></div>
                                    <div>
                                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Now Playing in Gym</p>
                                        <h3 className="text-white font-bold">Gym Floor Speakers</h3>
                                    </div>
                                </div>

                                <div className="bg-black/50 p-6 rounded-3xl border border-white/10 text-center">
                                    <div className="w-32 h-32 mx-auto bg-purple-900/30 rounded-full flex items-center justify-center mb-4 relative">
                                        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-spin-slow"></div>
                                        <Music className="w-12 h-12 text-purple-400" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white italic">{songs[0].title}</h4>
                                    <p className="text-gray-400 text-sm">{songs[0].artist}</p>
                                    
                                    <div className="mt-6 flex items-center justify-center gap-2">
                                        <span className="flex h-3 w-3 relative">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                        </span>
                                        <span className="text-xs font-mono text-purple-400 uppercase">Live Broadcast</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-8">
                        <Card className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Up Next</h3>
                                    <p className="text-gray-400 text-sm">Vote for the next track to play on the gym floor.</p>
                                </div>
                                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-mono text-gray-400">
                                    Queue: {songs.length - 1} tracks
                                </div>
                            </div>

                            <div className="space-y-4">
                                {songs.slice(1).map((song, idx) => (
                                    <div key={song.id} className="bg-black/40 p-4 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 font-black italic">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{song.title}</h4>
                                                <p className="text-xs text-gray-400">{song.artist}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xl font-black text-purple-400">{song.votes}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Votes</p>
                                            </div>
                                            <button 
                                                onClick={() => handleVote(song.id)}
                                                className="w-12 h-12 bg-purple-500/10 hover:bg-purple-500 border border-purple-500/30 text-purple-400 hover:text-white rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                                            >
                                                <ThumbsUp className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartGymHub;
