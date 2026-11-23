import React, { useEffect } from 'react';
import { AppContent } from './AppContent';
import { ToastProvider } from '@/context/ToastProvider';
import { DataProvider } from '@/context/DataProvider';
import { GymProvider } from '@/context/GymProvider';
import { AuthProvider } from '@/context/AuthProvider';
import ErrorBoundary from './common/ErrorBoundary';
import { OfflineIndicator } from './common/OfflineIndicator';

const App: React.FC = () => {
    useEffect(() => {
        const isLight = localStorage.getItem('fitness_global_theme') === 'light';
        if (isLight) {
            document.documentElement.classList.add('high-contrast-light');
        } else {
            document.documentElement.classList.remove('high-contrast-light');
        }
    }, []);

    return (
        <ToastProvider>
          <AuthProvider>
            <GymProvider>
                <DataProvider>
                    <ErrorBoundary>
                        <OfflineIndicator />
                        <AppContent />
                    </ErrorBoundary>
                </DataProvider>
            </GymProvider>
          </AuthProvider>
        </ToastProvider>
    );
};

export default App;
