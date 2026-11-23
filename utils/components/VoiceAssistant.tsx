import React, { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { View } from '../../types';
import { useToast } from '../hooks/useToast';

interface VoiceAssistantProps {
  setCurrentView: (view: View) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ setCurrentView }) => {
  const [isListening, setIsListening] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log('Voice command:', transcript);

      if (transcript.includes('dashboard') || transcript.includes('home')) {
        setCurrentView('dashboard');
        addToast('Navigating to FitnessFutureDashboard', 'success');
      } else if (transcript.includes('digital twin') || transcript.includes('hologram')) {
        setCurrentView('digitalTwin');
        addToast('Opening 3D Hologram', 'success');
      } else if (transcript.includes('wearable') || transcript.includes('watch')) {
        setCurrentView('wearableSync');
        addToast('Syncing Wearables', 'success');
      } else if (transcript.includes('predict') || transcript.includes('analytics')) {
        setCurrentView('predictiveAnalytics');
        addToast('Opening Predictive Analytics', 'success');
      } else if (transcript.includes('bot') || transcript.includes('agent')) {
        setCurrentView('agenticBots');
        addToast('Opening Automated Bots', 'success');
      } else if (transcript.includes('reward') || transcript.includes('metaverse')) {
        setCurrentView('metaverseRewards');
        addToast('Opening Metaverse Rewards', 'success');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    if (isListening) {
      recognition.start();
      addToast('FitnessFutureVoice Assistant Activated', 'success');
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening, setCurrentView, addToast]);

  if (!('webkitSpeechRecognition' in window)) {
    return null;
  }

  return (
    <button
      onClick={() => setIsListening(!isListening)}
      className={`fixed bottom-6 right-6 p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] z-50 transition-all duration-300 ${
        isListening ? 'bg-cyan-500 text-black animate-pulse' : 'bg-black border border-cyan-500 text-cyan-500 hover:bg-cyan-950'
      }`}
      title="Toggle Voice Assistant"
    >
      {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
    </button>
  );
};

export default VoiceAssistant;
