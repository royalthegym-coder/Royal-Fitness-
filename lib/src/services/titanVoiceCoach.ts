export class TitanVoiceCoach {
    private synth: SpeechSynthesis;
    private voice: SpeechSynthesisVoice | null = null;
    private isReady: boolean = false;

    constructor() {
        this.synth = window.speechSynthesis;
        this.initVoices();
    }

    private initVoices() {
        // Voices load asynchronously in some browsers
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            // Try to find a Hindi voice, fallback to any available voice
            this.voice = voices.find(v => v.lang.includes('hi-IN')) || voices[0] || null;
            this.isReady = true;
        };

        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    public speak(text: string, personality: 'drill_sergeant' | 'zen_master' | 'motivator' = 'motivator') {
        if (!this.isReady || this.synth.speaking) {
            // Low Latency: Stop current speech to issue new critical correction
            this.synth.cancel(); 
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.voice) {
            utterance.voice = this.voice;
        }

        // Adjust pitch and rate based on personality
        switch (personality) {
            case 'drill_sergeant':
                utterance.pitch = 0.8;
                utterance.rate = 1.2;
                utterance.volume = 1.0;
                break;
            case 'zen_master':
                utterance.pitch = 1.0;
                utterance.rate = 0.8;
                utterance.volume = 0.7;
                break;
            case 'motivator':
            default:
                utterance.pitch = 1.2;
                utterance.rate = 1.0;
                utterance.volume = 0.9;
                break;
        }

        this.synth.speak(utterance);
    }

    public stop() {
        this.synth.cancel();
    }
}

// Singleton instance for global use
export const voiceCoach = new TitanVoiceCoach();
