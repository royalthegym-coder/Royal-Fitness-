
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import { StorkIcon } from './icons/StorkIcon';
import { VoiceIcon } from './icons/VoiceIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { UserIcon } from './icons/UserIcon';
import { getComplexResponse } from '../../lib/gemini';

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface Channel {
    id: string;
    name: string;
    type: 'public' | 'private';
}

interface Message {
    id: number;
    sender: string;
    avatar: string;
    type: 'text' | 'voice' | 'video';
    content: string; // text content or transcript
    mediaUrl?: string;
    timestamp: string;
}

const INITIAL_CHANNELS: Channel[] = [
    { id: 'gen', name: 'General', type: 'public' },
    { id: 'tr', name: 'Trainers', type: 'private' },
    { id: 'maint', name: 'Maintenance', type: 'public' },
    { id: 'leads', name: 'Sales & Leads', type: 'private' },
];

const INITIAL_MESSAGES: Message[] = [
    { id: 1, sender: 'Sanjay Verma', avatar: 'https://i.pravatar.cc/150?u=sanjay', type: 'text', content: 'Hey team, welcome to Team Stork! We can use this for async updates.', timestamp: '09:00 AM' },
    { id: 2, sender: 'Kavita Reddy', avatar: 'https://i.pravatar.cc/150?u=kavita', type: 'voice', content: 'Just finished the morning batch. AC in the cardio section needs checking, it was making noise.', mediaUrl: 'mock_audio', timestamp: '10:15 AM' },
    { id: 3, sender: 'Rajesh Gupta', avatar: 'https://i.pravatar.cc/150?u=rajesh', type: 'text', content: 'Noted Kavita. I will log a ticket.', timestamp: '10:18 AM' },
];

const StorkCollaboration: React.FC = () => {
    const [activeChannel, setActiveChannel] = useState<string>('gen');
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Mock Recording
    const handleRecordToggle = () => {
        if (isRecording) {
            // Stop & Send
            setIsRecording(false);
            const newMsg: Message = {
                id: Date.now(),
                sender: 'You',
                avatar: 'https://i.pravatar.cc/150?u=me',
                type: 'voice',
                content: 'Transcribing...',
                mediaUrl: 'mock_audio',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, newMsg]);
            
            // Simulate Transcription
            setTimeout(async () => {
                const transcript = "I've updated the workout schedule for next week. Please check the files section.";
                setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, content: transcript } : m));
            }, 2000);

        } else {
            setIsRecording(true);
        }
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;
        const newMsg: Message = {
            id: Date.now(),
            sender: 'You',
            avatar: 'https://i.pravatar.cc/150?u=me',
            type: 'text',
            content: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
    };

    const handleSummarize = async () => {
        setIsSummarizing(true);
        setAiSummary(null);
        
        const conversation = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
        const prompt = `
            Summarize this team chat conversation for the "${INITIAL_CHANNELS.find(c => c.id === activeChannel)?.name}" channel.
            Highlight key action items and decisions.
            
            Conversation:
            ${conversation}
        `;
        
        try {
            const summary = await getComplexResponse(prompt);
            setAiSummary(summary);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSummarizing(false);
        }
    };

    const filteredMessages = messages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.sender.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
            
            {/* Sidebar: Channels */}
            <Card className="w-full md:w-64 flex flex-col bg-gray-900 border-r border-gray-800 p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="font-bold text-white flex items-center">
                        <StorkIcon className="text-blue-400 mr-2" /> Team Stork
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <p className="px-3 text-xs font-bold text-gray-500 uppercase mt-4 mb-2">Channels</p>
                    {INITIAL_CHANNELS.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => setActiveChannel(channel.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeChannel === channel.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                        >
                            # {channel.name}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col p-0 bg-gray-900 border-gray-800 relative overflow-hidden">
                
                {/* Search Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <div className="font-bold text-white"># {INITIAL_CHANNELS.find(c => c.id === activeChannel)?.name}</div>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search in channel..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-full py-1 px-4 text-sm text-white focus:outline-none focus:border-blue-500 w-48 transition-all focus:w-64"
                        />
                        <div className="absolute right-3 top-1.5 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-900">
                    {filteredMessages.map(msg => (
                        <div key={msg.id} className="flex gap-4 group">
                            <img src={msg.avatar} alt={msg.sender} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-white text-sm">{msg.sender}</span>
                                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                                </div>
                                
                                {msg.type === 'voice' ? (
                                    <div className="mt-1">
                                        <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-xl border border-gray-700 w-fit">
                                            <button className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-colors">
                                                <PlayIcon />
                                            </button>
                                            {/* Waveform Visualization */}
                                            <div className="flex items-center gap-1 h-6">
                                                {[...Array(15)].map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="w-1 bg-blue-400 rounded-full animate-pulse" 
                                                        style={{ 
                                                            height: `${Math.random() * 16 + 4}px`, 
                                                            animationDelay: `${i * 0.1}s`,
                                                            opacity: 0.7 
                                                        }}
                                                    ></div>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono">0:24</span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-300 pl-1 border-l-2 border-blue-500/30">
                                            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block mb-1">Transcript</span>
                                            {msg.content === 'Transcribing...' ? (
                                                <span className="italic text-gray-500 animate-pulse">Transcribing audio...</span>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-300 text-sm mt-1 leading-relaxed">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                    <div className="flex items-center gap-3 bg-gray-900 p-2 rounded-xl border border-gray-700 focus-within:border-blue-500 transition-colors">
                        <button 
                            onClick={handleRecordToggle}
                            className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-gray-800 text-gray-400'}`}
                            title="Record Voice Note"
                        >
                            {isRecording ? <div className="w-3 h-3 bg-red-500 rounded-full"></div> : <MicIcon />}
                        </button>
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent text-white focus:outline-none text-sm placeholder-gray-500"
                            placeholder={isRecording ? "Recording... Click mic to send" : "Type a message..."}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isRecording}
                        />
                        <button onClick={handleSendMessage} className="p-2 text-blue-500 hover:text-blue-400 transition-colors">
                            <SendIcon />
                        </button>
                    </div>
                    {isRecording && <p className="text-[10px] text-red-400 mt-2 text-center animate-pulse">Recording... Click mic again to send.</p>}
                </div>
            </Card>

            {/* AI Side Panel */}
            <Card className="w-full md:w-80 flex flex-col bg-gray-900 border-l border-gray-800 p-4">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white flex items-center">
                        <SparkleIcon className="text-amber-400 mr-2" /> Stork Intelligence
                    </h3>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                        <p className="text-sm text-gray-400 mb-3">Missed the discussion? Get a quick summary.</p>
                        <button 
                            onClick={handleSummarize}
                            disabled={isSummarizing}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
                        >
                            {isSummarizing ? 'Analyzing...' : 'Catch Up'}
                        </button>
                    </div>

                    {aiSummary && (
                        <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 animate-fade-in">
                            <h4 className="text-xs font-bold text-gray-300 uppercase mb-2">Channel Summary</h4>
                            <div className="prose dark:prose-invert prose-sm text-xs text-gray-400" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />
                        </div>
                    )}

                    <div className="border-t border-gray-800 pt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Knowledge Base</h4>
                        <div className="space-y-2">
                            {['Gym Policy.pdf', 'Q3 Goals.docx', 'Diet_Templates_v2.xlsx'].map((file, i) => (
                                <div key={i} className="flex items-center p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors">
                                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center mr-3 text-xs font-bold text-gray-400">DOC</div>
                                    <span className="text-sm text-gray-300">{file}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default StorkCollaboration;
