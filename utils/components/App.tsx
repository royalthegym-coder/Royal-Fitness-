import React from 'react';
import '../theme';
import { AppContent } from './AppContent';
import { ToastProvider } from '@/context/ToastProvider';
import { DataProvider } from '@/context/DataProvider';
import { GymProvider } from '@/context/GymProvider';
import { AuthProvider } from '@/context/AuthProvider';
import ErrorBoundary from './common/ErrorBoundary';
import { OfflineIndicator } from './common/OfflineIndicator';

const App: React.FC = () => {

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
