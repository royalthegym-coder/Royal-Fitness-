
import React, { useState } from 'react';
import Modal from './Modal';
import { Member } from '../../types';
import { GYM_INFO } from '../../constants';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { generateTextToSpeech } from '../../lib/gemini';
import { decode, decodeAudioData } from '../../utils/audio';
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
        const audioBase64 = await generateTextToSpeech(`Say cheerfully: Hello ${member.name}, welcome to Royal The Gym! We're happy to have you.`);
        if (audioBase64) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBytes = decode(audioBase64);
            const decodedBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(audioContext.destination);
            source.start(0);
            source.onended = () => setIsPlaying(false);
        } else {
            throw new Error("Received empty audio data.");
        }
    } catch (error) {
        console.error("Error playing welcome message:", error);
        setAudioError("Couldn't play audio. Please try again.");
        setIsPlaying(false);
    }
  };

  const renderWhatsAppStatus = () => {
      if (welcomeStatus === 'sending') {
          return (
              <div className="flex flex-col items-center justify-center p-4 bg-green-900/10 border border-green-500/30 rounded-lg w-full mb-4 animate-pulse">
                  <div className="flex items-center space-x-2 text-green-400">
                      <svg className="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-semibold">Contacting WhatsApp Business API...</span>
                  </div>
                  <p className="text-xs text-green-300/70 mt-1">Sending automated welcome template...</p>
              </div>
          );
      }

      if (welcomeStatus === 'sent') {
          return (
              <div className="flex flex-col items-center justify-center p-4 bg-green-900/20 border border-green-500 rounded-lg w-full mb-4">
                  <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircleIcon className="w-6 h-6" />
                      <span className="font-bold text-lg">Business Message Sent</span>
                  </div>
                  <p className="text-xs text-green-300 mt-1">Successfully delivered via WhatsApp Business API.</p>
              </div>
          );
      }

      // Fallback for when not automated (manual)
      return (
          <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-400 transition-colors"
          >
              <WhatsAppIcon className="w-5 h-5 mr-2" />
              Send Welcome
          </a>
      );
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Member Added Successfully!">
      <div className="text-center">
        <img src={member.avatar} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-amber-400" />
        <h4 className="text-2xl font-bold">{member.name}</h4>
        <p className="text-gray-400 mb-6">has been successfully registered.</p>
        
        {renderWhatsAppStatus()}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <button
                onClick={handlePlayWelcome}
                disabled={isPlaying}
                className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600"
            >
                <SpeakerIcon className="w-5 h-5 mr-2" />
                {isPlaying ? 'Playing...' : 'Play Audio Welcome'}
            </button>
        </div>
        {audioError && <p className="text-red-400 text-sm mt-2">{audioError}</p>}
        
        <button 
          onClick={onClose}
          className="mt-6 text-gray-400 hover:text-white"
        >
            Done
        </button>
      </div>
    </Modal>
  );
};

export default WelcomeModal;
