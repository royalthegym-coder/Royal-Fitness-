
import React, { useState } from 'react';
import { LogoutIcon } from './icons/LogoutIcon';
import { Theme } from '../../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import ConfirmationDialog from './common/ConfirmationDialog';

interface HeaderProps {
    children?: React.ReactNode;
    onLogout: () => void;
    userName: string;
    avatar: string;
    theme: Theme;
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ children, onLogout, userName, avatar, theme, toggleTheme }) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    onLogout();
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md border-b border-white/10 dark:border-gray-700/30 flex-shrink-0 z-20">
        <div className="flex items-center">
            {children}
        </div>
        
        <div className="flex items-center">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 mx-4 hidden sm:inline drop-shadow-sm">{userName}</span>
            <div className="relative">
                <img className="w-9 h-9 rounded-full border-2 border-amber-500 shadow-md" src={avatar} alt="Avatar" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            <button 
                onClick={handleLogoutClick}
                className="ml-4 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                title="Logout"
            >
                <LogoutIcon />
            </button>
        </div>

        <ConfirmationDialog 
            isOpen={isLogoutConfirmOpen} 
            onClose={() => setIsLogoutConfirmOpen(false)} 
            onConfirm={handleConfirmLogout} 
            title="Secure Logout" 
            message="Are you sure you want to terminate your session? Any unsaved changes in active forms may be lost." 
        />
    </header>
  );
};

export default Header;
