
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiChatResponse } from '../lib/gemini';
import { ChatMessage } from '../types';
import { SparkleIcon } from './icons/SparkleIcon';

interface GeminiChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const GeminiChat: React.FC<GeminiChatProps> = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState<ChatMessage[]>([{ role: 'model', text: 'Hello! How can I help you manage your gym today?' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const responseText = await getGeminiChatResponse(history, input);
        const modelMessage: ChatMessage = { role: 'model', text: responseText };
        
        setHistory(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-6 z-50 w-full max-w-sm h-[60vh] flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-2xl">
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-amber-400 flex items-center">
                    <SparkleIcon className="w-5 h-5 mr-2"/>
                    AI Assistant
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-200'}`}>
                           <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-200 p-3 rounded-lg">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything..."
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-amber-500 text-gray-900 p-2 rounded-lg disabled:bg-gray-600">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeminiChat;
    