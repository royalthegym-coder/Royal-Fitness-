
import React, { useState } from 'react';
import Modal from '../common/Modal';
import { analyzeReadinessAndModify, ReadinessOutput } from '../../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import { SleepIcon, HeartRateIcon } from '../icons/HealthIcons';

interface SmartReadinessModalProps {
    isOpen: boolean;
    onClose: () => void;
    plannedWorkoutName: string;
    onAnalysisComplete: (result: ReadinessOutput) => void;
}

const SmartReadinessModal: React.FC<SmartReadinessModalProps> = ({ isOpen, onClose, plannedWorkoutName, onAnalysisComplete }) => {
    const [mood, setMood] = useState('');
    const [sleepHours, setSleepHours] = useState(7);
    const [sleepQuality, setSleepQuality] = useState<'Good' | 'Average' | 'Poor'>('Average');
    const [soreness, setSoreness] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Simulated heart rate (in a real app, fetch from HealthConnect)
    const [simulatedHR, setSimulatedHR] = useState<number | null>(null);

    const handleSyncVitals = () => {
        // Simulate fetching from wearable
        const randomHR = Math.floor(Math.random() * (75 - 55 + 1) + 55); // 55-75 bpm
        setSimulatedHR(randomHR);
    };

    const handleSubmit = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeReadinessAndModify({
                mood,
                sleepHours,
                sleepQuality,
                soreness,
                restingHeartRate: simulatedHR || undefined,
                plannedWorkoutName
            });
            onAnalysisComplete(result);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Daily Readiness Check-in">
            <div className="space-y-6">
                <p className="text-gray-400 text-sm">
                    Before you start <strong>{plannedWorkoutName}</strong>, let's calibrate your session based on your recovery.
                </p>

                {/* 1. Mood / Sentiment */}
                <div>
                    <label className="block text-sm font-medium text-amber-400 mb-2">How are you feeling today?</label>
                    <textarea
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        placeholder="e.g. Stressed from work, but excited to lift..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        rows={2}
                    />
                </div>

                {/* 2. Sleep Data */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-3">
                        <SleepIcon className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="font-semibold text-gray-300">Last Night's Sleep</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Duration</label>
                            <div className="flex items-center">
                                <input 
                                    type="number" 
                                    value={sleepHours} 
                                    onChange={(e) => setSleepHours(Number(e.target.value))} 
                                    className="w-16 bg-gray-900 border border-gray-600 rounded p-1 text-center"
                                />
                                <span className="ml-2 text-sm text-gray-400">hours</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Quality</label>
                            <div className="flex gap-1">
                                {(['Good', 'Average', 'Poor'] as const).map(q => (
                                    <button 
                                        key={q} 
                                        onClick={() => setSleepQuality(q)}
                                        className={`px-2 py-1 text-xs rounded border ${sleepQuality === q ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400'}`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Soreness & Vitals */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <label className="block text-xs font-bold text-gray-300 mb-2">Muscle Soreness</label>
                        <div className="flex justify-between gap-1">
                            {(['Low', 'Medium', 'High'] as const).map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => setSoreness(s)}
                                    className={`flex-1 py-1 text-xs rounded border ${soreness === s ? 'bg-red-600 border-red-600 text-white' : 'border-gray-600 text-gray-400'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col justify-between">
                        <label className="block text-xs font-bold text-gray-300 mb-1">Resting Heart Rate</label>
                        {simulatedHR ? (
                            <div className="flex items-center text-green-400 font-bold">
                                <HeartRateIcon className="w-4 h-4 mr-2" />
                                {simulatedHR} bpm
                            </div>
                        ) : (
                            <button 
                                onClick={handleSyncVitals}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded flex items-center justify-center transition-colors"
                            >
                                Sync Wearable
                            </button>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={isAnalyzing || !mood}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
                >
                    <SparkleIcon className="w-5 h-5 mr-2" />
                    {isAnalyzing ? 'Analyzing Biometrics...' : 'Generate Dynamic Plan'}
                </button>
            </div>
        </Modal>
    );
};

export default SmartReadinessModal;
