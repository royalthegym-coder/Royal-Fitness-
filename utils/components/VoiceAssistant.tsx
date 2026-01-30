
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { encode, decode, decodeAudioData } from '../audio';
import { ChatMessage } from '../../types';
import Card from './common/Card';
import { VoiceIcon } from './icons/VoiceIcon';
import { View } from '../../types';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { getComplexResponse } from '../../lib/gemini';

interface VoiceAssistantProps {
    setCurrentView: (view: View) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ setCurrentView }) => {
    const [mode, setMode] = useState<'assistant' | 'scribe'>('assistant');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
    
    // Assistant State
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');

    // Scribe State
    const [scribeText, setScribeText] = useState('');
    const [meetingSummary, setMeetingSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const sessionRef = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const navigateToFunctionDeclaration: FunctionDeclaration = {
        name: 'navigateTo',
        description: 'Navigates to a different section of the application.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                section: {
                    type: Type.STRING,
                    description: 'The section to navigate to.',
                    enum: ['dashboard', 'packages', 'members', 'billing', 'payment', 'memberships', 'leads', 'workouts', 'diet', 'staff', 'expenses', 'settings', 'notifications', 'geminiHub', 'health']
                },
            },
            required: ['section'],
        },
    };

    const connect = async () => {
        setStatus('connecting');
        
        try {
            // SAFE ENV ACCESS
            const apiKey = (window as any).process?.env?.API_KEY;
            if (!apiKey) throw new Error("API Key not found");
            
            const ai = new GoogleGenAI({ apiKey });
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        startMicrophone();
                    },
                    onmessage: handleMessage,
                    onerror: (e) => {
                        console.error('Live API Error:', e);
                        setStatus('error');
                    },
                    onclose: () => {
                        setStatus('disconnected');
                        stopMicrophone();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: mode === 'assistant' 
                        ? "You are a helpful gym management assistant. You can answer questions and navigate the application."
                        : "You are a silent meeting scribe. Listen carefully and transcribe. Do not speak back.",
                    tools: mode === 'assistant' ? [{ functionDeclarations: [navigateToFunctionDeclaration] }] : []
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (e) {
            console.error('Connection failed:', e);
            setStatus('error');
        }
    };

    const disconnect = () => {
        sessionRef.current?.close();
        stopMicrophone();
        sessionRef.current = null;
    };

    const startMicrophone = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }
        
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
            };
            sessionRef.current?.sendRealtimeInput({ media: pcmBlob });
        };
        
        source.connect(scriptProcessorRef.current);
        scriptProcessorRef.current.connect(audioContextRef.current.destination);
    };

    const stopMicrophone = () => {
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close().then(() => audioContextRef.current = null);
    };

    const handleMessage = async (message: LiveServerMessage) => {
        // Handle Transcription
        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            if (mode === 'assistant') {
                setCurrentInput(prev => prev + text);
            } else {
                setScribeText(prev => prev + " " + text);
            }
        }

        // Handle Audio Output (Assistant Mode Only)
        if (mode === 'assistant' && message.serverContent?.modelTurn?.parts[0]?.inlineData.data) {
             const audioBase64 = message.serverContent.modelTurn.parts[0].inlineData.data;
             playAudio(audioBase64);
        }

        // Handle Tool Calls (Assistant Mode Only)
        if (mode === 'assistant' && message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'navigateTo' && fc.args.section) {
                    const section = fc.args.section as View;
                    setCurrentView(section);
                    sessionRef.current?.sendToolResponse({
                        functionResponses: {
                            id : fc.id,
                            name: fc.name,
                            response: { result: `Successfully navigated to the ${section} page.` },
                        }
                    });
                }
            }
        }

        // Handle Turn Completion
        if (message.serverContent?.turnComplete) {
            if (mode === 'assistant') {
                setTranscript(prev => [...prev, { role: 'user', text: currentInput }, { role: 'model', text: currentOutput }]);
                setCurrentInput('');
                setCurrentOutput('');
            }
        }
        
        // Output Transcription
        if (mode === 'assistant' && message.serverContent?.outputTranscription) {
            setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
        }
    };

    const playAudio = async (base64: string) => {
         const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
         const audioBytes = decode(base64);
         const buffer = await decodeAudioData(audioBytes, outputAudioContext, 24000);
         const source = outputAudioContext.createBufferSource();
         source.buffer = buffer;
         source.connect(outputAudioContext.destination);
         source.start();
    };
    
    const handleGenerateSummary = async () => {
        if (!scribeText.trim()) return;
        setIsSummarizing(true);
        const prompt = `
            Act as a professional meeting secretary. Summarize the following meeting transcript.
            
            Transcript:
            ${scribeText}
            
            Output Format (HTML):
            <h3>Executive Summary</h3>
            <p>...</p>
            <h3>Key Discussion Points</h3>
            <ul>...</ul>
            <h3>Action Items</h3>
            <ul>...</ul>
        `;
        try {
            const result = await getComplexResponse(prompt);
            setMeetingSummary(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSummarizing(false);
        }
    };

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <VoiceIcon className="w-8 h-8 mr-3"/>
                    {mode === 'assistant' ? 'AI Voice Assistant' : 'AI Meeting Scribe'}
                </h1>
                
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => { setMode('assistant'); disconnect(); }}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'assistant' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        Assistant
                    </button>
                    <button 
                        onClick={() => { setMode('scribe'); disconnect(); }}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'scribe' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Scribe
                    </button>
                </div>
            </div>

            <Card className="mb-6">
                <div className="flex flex-col items-center">
                    <p className="text-gray-400 mb-4 text-center">
                        {mode === 'assistant' 
                            ? 'Have a real-time conversation. Ask to navigate or query data.' 
                            : 'Record meetings or consultations. AI will transcribe and summarize.'}
                    </p>
                    <div className="flex space-x-4">
                        <button 
                            onClick={connect} 
                            disabled={status === 'connecting' || status === 'connected'} 
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg disabled:bg-gray-600 transition-all transform hover:scale-105"
                        >
                            {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Listening...' : 'Start Session'}
                        </button>
                        <button 
                            onClick={disconnect} 
                            disabled={status !== 'connected'} 
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg disabled:bg-gray-600 transition-all"
                        >
                            Stop
                        </button>
                    </div>
                    <p className="mt-4 text-sm font-semibold capitalize flex items-center">
                        Status: <span className={`ml-2 ${status === 'connected' ? 'text-green-400 animate-pulse' : 'text-gray-500'}`}>{status}</span>
                    </p>
                </div>
            </Card>

            {mode === 'assistant' ? (
                <Card title="Conversation History">
                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-900/50 rounded-lg">
                        {transcript.map((msg, index) => (
                             <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                    <p className="text-xs font-bold capitalize mb-1 opacity-70">{msg.role}</p>
                                    <p>{msg.text}</p>
                                 </div>
                             </div>
                        ))}
                         {currentInput && <div className="text-right italic text-gray-500 animate-pulse">Listening: {currentInput}</div>}
                         {currentOutput && <div className="text-left italic text-amber-300">AI: {currentOutput}</div>}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Live Transcript" className="h-[500px] flex flex-col">
                        <div className="flex-1 bg-gray-900/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-y-auto mb-4 border border-gray-700">
                            {scribeText || <span className="text-gray-600 italic">No speech detected yet...</span>}
                        </div>
                        <button 
                            onClick={handleGenerateSummary}
                            disabled={!scribeText.trim() || isSummarizing}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <ClipboardListIcon className={`w-5 h-5 mr-2 ${isSummarizing ? 'animate-spin' : ''}`} />
                            {isSummarizing ? 'Generating Notes...' : 'Generate Meeting Minutes'}
                        </button>
                    </Card>

                    <Card title="AI Meeting Minutes" className="h-[500px] overflow-hidden flex flex-col">
                        {meetingSummary ? (
                            <div className="prose dark:prose-invert prose-sm max-w-none overflow-y-auto flex-1 p-2">
                                <div dangerouslySetInnerHTML={{ __html: meetingSummary.replace(/\n/g, '<br />') }} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <SparkleIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p>Summary will appear here.</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default VoiceAssistant;
