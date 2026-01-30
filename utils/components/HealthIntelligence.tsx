
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_HEALTH_DATA, INITIAL_MEMBER_FITNESS_DATA } from '../../constants';
import { analyzeMedicalRecord, getHealthAssistantResponse, getComplexResponse, getGoogleSearchResponse } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { ChatIcon } from './icons/ChatIcon';
import { LockIcon } from './icons/LockIcon';
import { UploadIcon } from './icons/UploadIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';

// --- ICONS ---
const MedicalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21v-1m0-16a1 1 0 011 1v2.069a8.956 8.956 0 015.931 5.931H20a1 1 0 110 2h-2.069a8.956 8.956 0 01-5.931 5.931V20a1 1 0 11-2 0v-2.069a8.956 8.956 0 01-5.931-5.931H4a1 1 0 110-2h2.069a8.956 8.956 0 015.931-5.931V4a1 1 0 011-1z" />
    </svg>
);

const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const DnaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

// --- TYPES & HELPERS ---
interface Biomarker {
    name: string;
    value: number;
    unit: string;
    range: [number, number]; // [min, max]
    category: 'Hormone' | 'Vitamin' | 'General';
    lastUpdated: string;
}

const HealthIntelligence: React.FC = () => {
    const [activeMemberId, setActiveMemberId] = useState<number>(INITIAL_MEMBERS[0].id);
    const [activeTab, setActiveTab] = useState<'vault' | 'chat' | 'research' | 'logic' | 'records'>('vault');
    
    // Member Data
    const healthData = INITIAL_HEALTH_DATA; 
    const fitnessData = INITIAL_MEMBER_FITNESS_DATA[activeMemberId] || { metrics: [], logs: [] };

    // --- BIOMARKER VAULT STATE ---
    const [biomarkers, setBiomarkers] = useState<Biomarker[]>([
        { name: 'Testosterone (Total)', value: 650, unit: 'ng/dL', range: [300, 1000], category: 'Hormone', lastUpdated: '2024-07-15' },
        { name: 'Cortisol', value: 22, unit: 'ug/dL', range: [5, 20], category: 'Hormone', lastUpdated: '2024-07-15' }, // Deliberately High for Demo
        { name: 'Vitamin D3', value: 25, unit: 'ng/mL', range: [30, 100], category: 'Vitamin', lastUpdated: '2024-07-15' }, // Deliberately Low
        { name: 'Vitamin B12', value: 400, unit: 'pg/mL', range: [200, 900], category: 'Vitamin', lastUpdated: '2024-07-15' },
    ]);
    const [isScanningVault, setIsScanningVault] = useState(false);

    // Chat State (ChatGPT Style)
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
        { role: 'model', text: "Hello! I am your secured Health Assistant. I have access to your vitals and logs. How can I support your wellness today?" }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatThinking, setIsChatThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Research State (Perplexity Style)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{text: string, sources: any[]} | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Logic State (DeepSeek Style)
    const [logicQuery, setLogicQuery] = useState('');
    const [logicResult, setLogicResult] = useState<string | null>(null);
    const [isReasoning, setIsReasoning] = useState(false);

    // Records State
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // HANDLERS

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsChatThinking(true);

        try {
            const response = await getHealthAssistantResponse(
                chatHistory, 
                userMsg, 
                { metrics: fitnessData.metrics, vitals: healthData, logs: fitnessData.logs }
            );
            setChatHistory(prev => [...prev, { role: 'model', text: response }]);
        } catch (e) {
            setChatHistory(prev => [...prev, { role: 'model', text: "I'm having trouble accessing the health engine right now." }]);
        } finally {
            setIsChatThinking(false);
        }
    };

    const handleResearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults(null);
        try {
            const response = await getGoogleSearchResponse(searchQuery);
            setSearchResults(response);
        } catch(e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLogicReasoning = async () => {
        if (!logicQuery.trim()) return;
        setIsReasoning(true);
        setLogicResult(null);
        try {
            // Use Complex Response (Gemini 3 Pro) for reasoning
            const response = await getComplexResponse(`
                You are DeepSeek R1, a sophisticated biomechanics and physiology reasoning engine.
                Solve this complex health problem: "${logicQuery}".
                
                Think step-by-step using Chain-of-Thought reasoning. Break down the variables. Provide a reasoned conclusion.
            `);
            setLogicResult(response);
        } catch(e) {
            console.error(e);
        } finally {
            setIsReasoning(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                setIsAnalyzing(true);
                try {
                    const result = await analyzeMedicalRecord(base64);
                    setAnalysisResult(result);
                } catch (err) {
                    setAnalysisResult("Failed to analyze the document. Please ensure it is a clear image.");
                } finally {
                    setIsAnalyzing(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // --- BIOMARKER VAULT LOGIC ---
    const updateBiomarkersFromScan = () => {
        setIsScanningVault(true);
        // Simulate Scan Delay
        setTimeout(() => {
            // Randomize slightly for demo
            setBiomarkers(prev => prev.map(b => ({
                ...b,
                value: b.name === 'Cortisol' ? 22 : b.value, // Force High Cortisol for demo
                lastUpdated: new Date().toISOString().split('T')[0]
            })));
            setIsScanningVault(false);
        }, 1500);
    };

    const getStatusColor = (val: number, range: [number, number], name: string) => {
        // Special case for Cortisol (Lower is better generally, but not too low)
        if (name === 'Cortisol') {
            if (val > range[1]) return 'text-red-500'; // High Stress
            return 'text-green-400';
        }
        if (val < range[0]) return 'text-amber-500'; // Low
        if (val > range[1]) return 'text-amber-500'; // High
        return 'text-green-400'; // Optimal
    };

    const getRecommendation = () => {
        const cortisol = biomarkers.find(b => b.name === 'Cortisol');
        const vitD = biomarkers.find(b => b.name === 'Vitamin D3');
        const recs = [];

        if (cortisol && cortisol.value > cortisol.range[1]) {
            recs.push({
                type: 'Load', 
                title: 'Predictive Loading Alert', 
                desc: `Cortisol (${cortisol.value}) is elevated. Switching to "De-load Week" to prevent burnout.`,
                action: 'Reduce Volume 40%',
                urgent: true
            });
        }
        if (vitD && vitD.value < vitD.range[0]) {
            recs.push({
                type: 'Supp', 
                title: 'Supplement Optimization', 
                desc: `Vitamin D3 (${vitD.value}) is suboptimal.`,
                action: 'Add 5000IU D3 + K2',
                urgent: false
            });
        }
        return recs;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-teal-900/20 p-6 rounded-xl border border-teal-500/30">
                <div>
                    <h1 className="text-3xl font-bold text-teal-400 flex items-center">
                        <MedicalIcon />
                        <span className="ml-3">Royal Health Intelligence</span>
                    </h1>
                    <p className="text-teal-200/70 mt-1 flex items-center text-sm">
                        <LockIcon className="w-3 h-3 mr-1" />
                        Secure Multi-Model AI Engine (Gemini, DeepSeek, Perplexity)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <button 
                        onClick={() => setActiveTab('vault')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${activeTab === 'vault' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 border border-red-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <span className="flex items-center"><ShieldCheckIcon className="w-5 h-5 mr-3"/> Biomarker Vault</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${activeTab === 'chat' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <span className="flex items-center"><ChatIcon className="w-5 h-5 mr-3"/> Assistant (Gemini)</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('research')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${activeTab === 'research' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <span className="flex items-center"><SearchIcon /> <span className="ml-3">Perplexity Research</span></span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('logic')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${activeTab === 'logic' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <span className="flex items-center"><BrainIcon /> <span className="ml-3">DeepSeek Logic</span></span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('records')}
                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${activeTab === 'records' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <span className="flex items-center"><DocumentIcon /> <span className="ml-3">Lab Analyzer</span></span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    
                    {/* MODE 0: BIOMARKER VAULT */}
                    {activeTab === 'vault' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Actionable Insights */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {getRecommendation().map((rec, idx) => (
                                    <Card key={idx} className={`border-l-4 ${rec.urgent ? 'border-red-500 bg-red-900/20' : 'border-blue-500 bg-blue-900/20'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className={`text-sm font-bold uppercase tracking-wider ${rec.urgent ? 'text-red-400' : 'text-blue-400'}`}>{rec.title}</h4>
                                                <p className="text-white font-medium mt-1">{rec.desc}</p>
                                            </div>
                                            <div className={`p-2 rounded-lg ${rec.urgent ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                <span className="text-xs font-black">{rec.action}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Biomarker Grid */}
                            <Card title="Internal Blood Chemistry">
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-sm text-gray-400">Synced from recent Lab Corp report.</p>
                                    <button 
                                        onClick={updateBiomarkersFromScan}
                                        className="text-xs flex items-center bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors text-white"
                                    >
                                        {isScanningVault ? <AutoUpdateIcon className="w-3 h-3 mr-1 animate-spin"/> : <UploadIcon className="w-3 h-3 mr-1"/>}
                                        {isScanningVault ? 'Analyzing Report...' : 'Scan New Report'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {biomarkers.map((b, i) => {
                                        // Calculate percentage for bar position
                                        // Normalize value within range padded by 20%
                                        const min = b.range[0] * 0.8;
                                        const max = b.range[1] * 1.2;
                                        const percent = Math.min(100, Math.max(0, ((b.value - min) / (max - min)) * 100));
                                        const color = getStatusColor(b.value, b.range, b.name);

                                        return (
                                            <div key={i} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <DnaIcon />
                                                        <span className="font-bold text-white text-sm">{b.name}</span>
                                                    </div>
                                                    <span className={`text-lg font-black ${color}`}>{b.value} <span className="text-xs font-normal text-gray-500">{b.unit}</span></span>
                                                </div>
                                                
                                                {/* Range Bar */}
                                                <div className="relative h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                                                    {/* Optimal Zone Marker (Green area) */}
                                                    <div 
                                                        className="absolute top-0 bottom-0 bg-green-900/50"
                                                        style={{
                                                            left: `${((b.range[0] - min) / (max - min)) * 100}%`,
                                                            width: `${((b.range[1] - b.range[0]) / (max - min)) * 100}%`
                                                        }}
                                                    ></div>
                                                    {/* Value Marker */}
                                                    <div 
                                                        className={`absolute top-0 bottom-0 w-2 rounded-full ${color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`}
                                                        style={{ left: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                                                    <span>{b.range[0]}</span>
                                                    <span className="text-green-500/50">OPTIMAL ZONE</span>
                                                    <span>{b.range[1]}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* MODE 1: CHAT ASSISTANT */}
                    {activeTab === 'chat' && (
                        <Card className="h-[600px] flex flex-col border-teal-500/30">
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
                                            <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                        </div>
                                    </div>
                                ))}
                                {isChatThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-700 p-4 rounded-xl rounded-bl-none flex items-center gap-2">
                                            <SparkleIcon className="w-4 h-4 text-teal-400 animate-spin" />
                                            <span className="text-xs text-gray-400">Gemini is thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask about your vitals, workouts, or general health..."
                                    className="w-full bg-gray-900 border border-gray-700 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
                                />
                                <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatThinking} className="absolute right-2 top-2 p-2 bg-teal-500 hover:bg-teal-400 text-gray-900 rounded-full transition-colors disabled:opacity-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* MODE 2: DEEP RESEARCH (Perplexity) */}
                    {activeTab === 'research' && (
                        <Card className="h-[600px] flex flex-col border-blue-500/30">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-blue-400">Perplexity Research Engine</h2>
                                <p className="text-gray-400 text-sm">Grounded in real-time medical journals and fitness studies.</p>
                            </div>
                            
                            <div className="relative mb-6">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                                    placeholder="e.g. 'Latest studies on creatine for women over 40'..."
                                    className="w-full bg-gray-900 border border-blue-500/50 rounded-xl py-4 pl-6 pr-32 focus:outline-none focus:border-blue-400 text-white placeholder-gray-500"
                                />
                                <button onClick={handleResearch} disabled={isSearching} className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">
                                    {isSearching ? 'Searching...' : 'Research'}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2">
                                {searchResults ? (
                                    <div className="space-y-6 animate-fade-in">
                                        {/* Sources Section */}
                                        {searchResults.sources.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {searchResults.sources.slice(0, 4).map((src: any, i: number) => (
                                                    <a key={i} href={src.web?.uri} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg border border-gray-600 max-w-[200px] transition-colors">
                                                        <p className="text-xs text-blue-400 truncate font-bold">{src.web?.title}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{src.web?.uri}</p>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Answer Section */}
                                        <div className="prose prose-invert max-w-none">
                                            <div dangerouslySetInnerHTML={{ __html: searchResults.text.replace(/\n/g, '<br/>') }} />
                                        </div>
                                    </div>
                                ) : (
                                    !isSearching && <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <SearchIcon />
                                        <p className="mt-2">Enter a query to search grounded medical knowledge.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* MODE 3: LOGIC ENGINE (DeepSeek) */}
                    {activeTab === 'logic' && (
                        <Card className="h-[600px] flex flex-col border-purple-500/30">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-purple-400">DeepSeek R1 Logic Engine</h2>
                                <p className="text-gray-400 text-sm">Complex problem solving using Chain-of-Thought reasoning.</p>
                            </div>

                            <textarea 
                                value={logicQuery}
                                onChange={(e) => setLogicQuery(e.target.value)}
                                placeholder="Describe a complex scenario. E.g., 'My left knee hurts at the bottom of a squat, but only with high bar position. I have long femurs. Re-design my leg day.'"
                                className="w-full bg-gray-900 border border-purple-500/50 rounded-xl p-4 focus:outline-none focus:border-purple-400 text-white placeholder-gray-500 min-h-[100px] mb-4"
                            />
                            
                            <button onClick={handleLogicReasoning} disabled={isReasoning} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors mb-6 flex justify-center items-center">
                                {isReasoning ? <><SparkleIcon className="w-5 h-5 mr-2 animate-spin"/> Reasoning...</> : 'Analyze Logic'}
                            </button>

                            <div className="flex-1 overflow-y-auto pr-2 bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                {isReasoning && (
                                    <div className="text-purple-400 animate-pulse text-sm font-mono">
                                        &gt; DeepSeek R1 Thinking...<br/>
                                        &gt; Analyzing biomechanical variables...<br/>
                                        &gt; Checking leverage factors...<br/>
                                        &gt; Formulating corrective strategy...
                                    </div>
                                )}
                                {logicResult && (
                                    <div className="prose prose-invert prose-sm max-w-none animate-fade-in">
                                        <div dangerouslySetInnerHTML={{ __html: logicResult.replace(/\n/g, '<br/>') }} />
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* MODE 4: MEDICAL RECORDS */}
                    {activeTab === 'records' && (
                        <Card title="Medical Record Analyzer (Vision)" className="border-amber-500/30">
                            <p className="text-gray-400 mb-6">
                                Upload a photo of your blood test results, clinical notes, or prescription. 
                                Our AI will digitize the data, identify key biomarkers, and explain them in plain English.
                            </p>
                            
                            {!analysisResult && !isAnalyzing && (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-600 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-gray-800/50 transition-all"
                                >
                                    <UploadIcon className="w-12 h-12 text-gray-500 mb-4" />
                                    <span className="text-lg font-semibold text-gray-300">Click to Upload Lab Report</span>
                                    <span className="text-sm text-gray-500 mt-2">Supports JPG, PNG (Max 5MB)</span>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="py-20 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-xl font-bold text-white">Analyzing Document...</h3>
                                    <p className="text-gray-400 mt-2">Extracting biomarkers and comparing reference ranges.</p>
                                </div>
                            )}

                            {analysisResult && (
                                <div className="animate-fade-in">
                                    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-6">
                                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br/>') }} />
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => { setAnalysisResult(null); setIsAnalyzing(false); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">Analyze Another</button>
                                        <button onClick={() => { setActiveTab('chat'); setChatInput("Help me understand these results better."); }} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-white font-bold">Discuss with Assistant</button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthIntelligence;
