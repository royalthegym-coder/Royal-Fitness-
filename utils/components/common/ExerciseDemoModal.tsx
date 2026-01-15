
import React from 'react';
import Modal from './Modal';

interface ExerciseDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
}

const ExerciseDemoModal: React.FC<ExerciseDemoModalProps> = ({ isOpen, onClose, exerciseName }) => {
    // In a real app, this would map names to specific asset URLs.
    // We simulate this with a dynamic placeholder that represents the exercise GIF.
    const mediaUrl = `https://placehold.co/600x400/111827/4ade80?text=${encodeURIComponent(exerciseName)}+Form+Demo`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${exerciseName} Demo`}>
            <div className="flex flex-col items-center">
                <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-700">
                    <img 
                        src={mediaUrl} 
                        alt={`${exerciseName} demonstration`} 
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm">
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono">
                        GIF PREVIEW
                    </div>
                </div>
                <p className="mt-4 text-sm text-gray-400 text-center">
                    Correct form is crucial for safety and results. Keep your core tight and control the movement.
                </p>
                <button 
                    onClick={onClose}
                    className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors"
                >
                    Close Demo
                </button>
            </div>
        </Modal>
    );
};

export default ExerciseDemoModal;
