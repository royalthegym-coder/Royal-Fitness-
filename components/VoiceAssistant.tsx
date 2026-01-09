import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { ChatMessage } from '../types';
import Card from './common/Card';
import { VoiceIcon } from './icons/VoiceIcon';
import { View } from '../App';

interface VoiceAssistantProps {
    setCurrentView: (view: View) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ setCurrentView }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');

    const sessionRef = useRef<LiveSession | null>(null);
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
        setTranscript([]);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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
                    systemInstruction: "You are a helpful gym management assistant. You can answer questions and navigate the application for the user. When the user asks to go to a specific page or section, use the `navigateTo` function. For example, if they say 'Show me the dashboard', call `navigateTo` with the section 'dashboard'.",
                    tools: [{ functionDeclarations: [navigateToFunctionDeclaration] }]
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
        if (message.serverContent?.inputTranscription) {
            setCurrentInput(prev => prev + message.serverContent!.inputTranscription.text);
        }
        if (message.serverContent?.outputTranscription) {
            setCurrentOutput(prev => prev + message.serverContent!.outputTranscription.text);
        }
        if (message.serverContent?.modelTurn?.parts[0]?.inlineData.data) {
             const audioBase64 = message.serverContent.modelTurn.parts[0].inlineData.data;
             const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
             const audioBytes = decode(audioBase64);
             const buffer = await decodeAudioData(audioBytes, outputAudioContext, 24000);
             const source = outputAudioContext.createBufferSource();
             source.buffer = buffer;
             source.connect(outputAudioContext.destination);
             source.start();
        }

        if (message.toolCall) {
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


        if (message.serverContent?.turnComplete) {
            setTranscript(prev => [...prev, { role: 'user', text: currentInput }, { role: 'model', text: currentOutput }]);
            setCurrentInput('');
            setCurrentOutput('');
        }
    };
    
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6 flex items-center"><VoiceIcon className="w-8 h-8 mr-3"/>AI Voice Assistant</h1>
            <Card>
                <div className="flex flex-col items-center">
                    <p className="text-gray-400 mb-4 text-center">Have a real-time conversation with the Gemini AI. <br/>You can also say <strong className="text-amber-300">"Go to billing"</strong> or <strong className="text-amber-300">"Show me the dashboard"</strong> to navigate.</p>
                    <div className="flex space-x-4">
                        <button onClick={connect} disabled={status === 'connecting' || status === 'connected'} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-400 disabled:bg-gray-600">Start Session</button>
                        <button onClick={disconnect} disabled={status !== 'connected'} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-400 disabled:bg-gray-600">End Session</button>
                    </div>
                    <p className="mt-4 text-sm font-semibold capitalize">Status: <span className="text-amber-400">{status}</span></p>
                </div>
            </Card>

            <Card className="mt-6">
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {transcript.map((msg, index) => (
                         <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm font-bold capitalize mb-1">{msg.role}</p>
                                <p>{msg.text}</p>
                             </div>
                         </div>
                    ))}
                     {currentInput && <div className="text-right italic text-gray-500">You: {currentInput}</div>}
                     {currentOutput && <div className="text-left italic text-amber-300">AI: {currentOutput}</div>}
                </div>
            </Card>
        </div>
    );
};

export default VoiceAssistant;