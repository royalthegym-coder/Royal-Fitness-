import React, { useState } from 'react';
import Card from '../common/Card';
import { SmartWatchIcon } from '../icons/SmartWatchIcon';
import { WatchOSIcon } from '../icons/WatchOSIcon';
import { WearOSIcon } from '../icons/WearOSIcon';
import { HealthSyncIcon, HapticFeedbackIcon, LiveWorkoutIcon, WatchNotificationIcon, WatchQrCodeIcon } from '../icons/SmartwatchFeatureIcons';
import { CheckIcon } from '../icons/CheckIcon';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg">
        <div className="p-2 bg-gray-300 dark:bg-gray-800 rounded-full mr-4">{icon}</div>
        <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    </div>
);

const SmartwatchConnect: React.FC = () => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');

    const handleConnect = () => {
        setStatus('connecting');
        setTimeout(() => {
            setStatus('connected');
        }, 2500);
    };

    const handleDisconnect = () => {
        setStatus('disconnected');
    };

    const renderContent = () => {
        switch (status) {
            case 'disconnected':
                return (
                    <div className="text-center">
                        <div className="flex justify-center items-center gap-8 mb-6">
                            <WatchOSIcon className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                            <WearOSIcon className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Connect Your Smartwatch</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                            Bring your workouts to the next level by syncing your Apple Watch or Wear OS device for live tracking, notifications, and more.
                        </p>
                        <button
                            onClick={handleConnect}
                            className="mt-6 bg-amber-500 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center mx-auto"
                        >
                            <SmartWatchIcon />
                            <span className="ml-2">Connect Now</span>
                        </button>
                    </div>
                );
            case 'connecting':
                return (
                     <div className="text-center">
                        <div className="relative inline-flex">
                            <div className="w-24 h-24 bg-amber-500 rounded-full"></div>
                            <div className="w-24 h-24 bg-amber-500 rounded-full absolute top-0 left-0 animate-ping"></div>
                            <div className="w-24 h-24 bg-amber-500 rounded-full absolute top-0 left-0 animate-pulse"></div>
                        </div>
                        <h2 className="text-2xl font-bold mt-6 animate-pulse">Connecting...</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Searching for your device. Please ensure it's nearby and Bluetooth is enabled.</p>
                    </div>
                );
            case 'connected':
                return (
                    <div>
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center text-2xl font-bold text-green-500 dark:text-green-400">
                                <CheckIcon className="w-8 h-8 mr-2" />
                                <span>Your Smartwatch is Connected!</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Your device is now synced. Here are the features available on your watch:</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Feature icon={<LiveWorkoutIcon />} title="Live Workout Tracking" description="Start, pause, and log your sets directly from your wrist. See real-time heart rate and calorie burn." />
                            <Feature icon={<HapticFeedbackIcon />} title="Haptic Feedback" description="Get vibration alerts for rest timers, set completions, and new personal records (PRs)." />
                            <Feature icon={<WatchQrCodeIcon />} title="Gym QR Code Access" description="Check-in at the gym by simply scanning the QR code displayed on your watch." />
                            <Feature icon={<WatchNotificationIcon />} title="Notifications & Reminders" description="Receive reminders for your scheduled workouts and motivational messages to keep you on track." />
                             <Feature icon={<HealthSyncIcon />} title="Health Metric Sync" description="Automatically sync heart rate, steps, and workout data with the main app's health tracker." />
                        </div>
                         <div className="text-center mt-8">
                            <button
                                onClick={handleDisconnect}
                                className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-500 transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Card>
            <div className="p-4 sm:p-6 min-h-[400px] flex items-center justify-center">
                {renderContent()}
            </div>
        </Card>
    );
};

export default SmartwatchConnect;
