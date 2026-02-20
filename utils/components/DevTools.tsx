
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface DevToolsProps {
    onSwitch: () => void;
    currentRole: 'admin' | 'member';
}

const DevTools: React.FC<DevToolsProps> = ({ onSwitch, currentRole }) => {
    return (
        <div className="fixed bottom-4 left-4 z-[9999] group">
            <button 
                onClick={onSwitch}
                className="bg-red-600 text-white p-3 rounded-full shadow-2xl border-4 border-white hover:scale-110 transition-all flex items-center gap-2"
                title="Switch Role (Dev Only)"
            >
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-xs font-bold uppercase">
                    Switch to {currentRole === 'admin' ? 'Member' : 'Admin'}
                </span>
            </button>
        </div>
    );
};

export default DevTools;
