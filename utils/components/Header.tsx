
import React, { useState } from 'react';
import { Power, ShieldCheck, Wifi, Zap } from 'lucide-react';
import { Theme } from '../../types';
import ConfirmationDialog from './common/ConfirmationDialog';

interface HeaderProps {
    children?: React.ReactNode;
    onLogout?: () => void;
    userName: string;
    avatar: string;
    theme: Theme;
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ children, onLogout, userName, avatar }) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleSecureDisconnect = () => {
    if (onLogout) onLogout();
  };

  return (
    <header className="flex items-center justify-between h-20 px-8 bg-white/90 dark:bg-black/95 backdrop-blur-3xl border-b border-gray-200 dark:border-white/5 flex-shrink-0 z-40 transition-colors duration-300">
        <div className="flex items-center gap-6">
            {children}
            <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-full border border-gray-200 dark:border-white/5 shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">System Online</span>
            </div>
        </div>
        
        <div className="flex items-center">
            <div className="hidden sm:flex flex-col items-end mr-5">
                <span className="text-xs font-black text-gray-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
                    {userName} <Zap className="w-3 h-3 text-amber-500 dark:text-[#FFD700]" />
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-500 uppercase tracking-widest">Secure Connection</span>
                </div>
            </div>
            
            <div className="relative mr-2">
                <img className="w-10 h-10 rounded-2xl border border-gray-200 dark:border-white/10 object-cover shadow-xl dark:shadow-2xl" src={avatar} alt="Avatar" />
            </div>

            {onLogout && (
                <button 
                    onClick={() => setIsLogoutConfirmOpen(true)}
                    className="ml-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-all group relative"
                    title="Logout"
                >
                    <Power className="w-5 h-5 transition-transform duration-700" />
                </button>
            )}
        </div>

        <ConfirmationDialog 
            isOpen={isLogoutConfirmOpen} 
            onClose={() => setIsLogoutConfirmOpen(false)} 
            onConfirm={handleSecureDisconnect} 
            title="Confirm Logout?" 
            message="You will be securely logged out of the system." 
        />
    </header>
  );
};

export default Header;