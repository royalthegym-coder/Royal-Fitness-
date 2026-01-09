import React, { useState } from 'react';
import { GYM_INFO } from '../constants';

interface LoginScreenProps {
    onLogin: (email: string, pass: string, role: 'admin' | 'member') => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (role: 'admin' | 'member') => {
        setError('');
        const success = onLogin(email, password, role);
        if (!success) {
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-amber-500 dark:text-amber-400 tracking-wider">{GYM_INFO.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">Management & Member Portal</p>
            </div>
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => handleSubmit('admin')}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                        >
                            Admin Login
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit('member')}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500"
                        >
                            Member Login
                        </button>
                    </div>
                    <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                        <p>Admin: admin@royal.com / admin123</p>
                        <p>Member: aarav.s@example.com / aarav123</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;