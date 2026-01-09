import React from 'react';
import { LogoutIcon } from './icons/LogoutIcon';
import { Theme } from '../App';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface HeaderProps {
    children?: React.ReactNode;
    onLogout: () => void;
    userName: string;
    avatar: string;
    theme: Theme;
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ children, onLogout, userName, avatar, theme, toggleTheme }) => {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center">
            {children}
        </div>
        
        <div className="flex items-center">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mx-4 hidden sm:inline">{userName}</span>
            <img className="w-8 h-8 rounded-full" src={avatar} alt="Avatar" />
            <button 
                onClick={onLogout}
                className="ml-4 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Logout"
            >
                <LogoutIcon />
            </button>
        </div>
    </header>
  );
};

export default Header;