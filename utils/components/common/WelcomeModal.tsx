
import React, { useState } from 'react';
import Modal from './Modal';
import { Member } from '../../../types';
import { GYM_INFO } from '../../../constants';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { generateTextToSpeech } from '../../../lib/gemini';
import { decode, decodeAudioData } from '../../audio';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  welcomeStatus?: 'idle' | 'sending' | 'sent';
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, member, welcomeStatus = 'idle' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  if (!member) return null;

  const welcomeMessage = `Hello ${member.name}, welcome to ${GYM_INFO.name}! We're thrilled to have you join our fitness community. Your membership is now active. For more details, visit our website: ${GYM_INFO.website}. See you at the gym!`;
  const sanitizedPhone = `91${member.phone.replace(/\D/g, '')}`;
  const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(welcomeMessage)}`;

  const handlePlayWelcome = async () => {
    setIsPlaying(true);
    setAudioError(null);
    try {
        const audioBase64 = await generateTextToSpeech(welcomeMessage);
        if (audioBase64) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBytes = decode(audioBase64);
            const buffer = await decodeAudioData(audioBytes, ctx, 24000);
            
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setIsPlaying(false);
            source.start();
        } else {
            throw new Error("No audio generated");
        }
    } catch (e) {
        console.error(e);
        setAudioError("Could not play audio.");
        setIsPlaying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome New Member!">
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-amber-500 shadow-lg">
                    <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                </div>
            </div>
            
            <div>
                <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-gray-300">Membership ID: <span className="font-mono text-amber-400 font-bold">#{member.id}</span></p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-500/30">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Account Active
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-left">
                <p className="text-gray-400 text-sm mb-2">Automated Welcome Message:</p>
                <p className="text-white italic text-sm border-l-2 border-amber-500 pl-3 py-1">
                    "{welcomeMessage}"
                </p>
                
                <div className="flex gap-3 mt-4">
                    <button 
                        onClick={handlePlayWelcome} 
                        disabled={isPlaying}
                        className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg font-bold text-sm transition-colors ${isPlaying ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                    >
                        {isPlaying ? (
                            <span className="flex items-center">
                                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 mr-2"></span>
                                Playing...
                            </span>
                        ) : (
                            <>
                                <SpeakerIcon className="w-4 h-4 mr-2" /> Play Audio
                            </>
                        )}
                    </button>
                    
                    {member.whatsappConsent && (
                        <a 
                            href={whatsappUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center text-sm transition-colors"
                        >
                            <WhatsAppIcon className="w-4 h-4 mr-2" /> 
                            {welcomeStatus === 'sent' ? 'Sent!' : 'Send WhatsApp'}
                        </a>
                    )}
                </div>
                {audioError && <p className="text-red-400 text-xs mt-2 text-center">{audioError}</p>}
                
                {welcomeStatus === 'sending' && (
                    <p className="text-center text-gray-400 text-xs mt-3 animate-pulse">Sending automated welcome message...</p>
                )}
                {welcomeStatus === 'sent' && (
                    <p className="text-center text-green-400 text-xs mt-3 flex items-center justify-center">
                        <CheckCircleIcon className="w-3 h-3 mr-1" /> Automated message sent via API.
                    </p>
                )}
            </div>

            <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white text-sm underline"
            >
                Close
            </button>
        </div>
    </Modal>
  );
};

export default WelcomeModal;
