import React, { useState, useEffect } from 'react';
import { ActivityEvent } from '../types';
import { INITIAL_ACTIVITY_EVENTS, INITIAL_MEMBERS } from '../constants';
import { View } from '../App';
import { SparkleIcon } from './icons/SparkleIcon';
import { BellIcon } from './icons/BellIcon';
import { UserIcon } from './icons/UserIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CheckInIcon } from './icons/CheckInIcon';
import Card from './common/Card';

interface LiveActivityProps {
    setCurrentView: (view: View) => void;
}

const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const EventIcon: React.FC<{ type: ActivityEvent['type'] }> = ({ type }) => {
    const className = "w-5 h-5";
    switch (type) {
        case 'check-in': return <CheckInIcon className={className} />;
        case 'new-member': return <UserIcon className={className} />;
        case 'payment': return <DollarSignIcon className={className} />;
        case 'ai-suggestion': return <SparkleIcon className={className} />;
        default: return <BellIcon className={className} />;
    }
};

const LiveActivity: React.FC<LiveActivityProps> = ({ setCurrentView }) => {
    const [events, setEvents] = useState<ActivityEvent[]>(INITIAL_ACTIVITY_EVENTS);
    const [_, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000 * 30); // Update timestamps every 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const activityInterval = setInterval(() => {
            const randomMember = INITIAL_MEMBERS[Math.floor(Math.random() * INITIAL_MEMBERS.length)];
            const newEvent: ActivityEvent = {
                id: Date.now(),
                type: 'check-in',
                message: `${randomMember.name} just checked in for a workout.`,
                timestamp: new Date(),
                memberId: randomMember.id,
            };
            setEvents(prev => [newEvent, ...prev].slice(0, 20)); // Keep the list to a max of 20 items
        }, 1000 * 15); // Add a new check-in every 15 seconds

        return () => clearInterval(activityInterval);
    }, []);

    return (
        <Card>
            <div className="flex items-center border-b border-gray-700 pb-4 mb-4">
                <BellIcon className="w-6 h-6 mr-3 text-amber-400"/>
                <h3 className="text-lg font-semibold text-amber-400">Live Gym Insights</h3>
            </div>
            <div className="space-y-4 h-64 overflow-y-auto pr-2">
                {events.map(event => (
                    <div key={event.id} className="flex items-start">
                        <div className="mr-3 mt-1 flex-shrink-0 h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                           <EventIcon type={event.type} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm">{event.message}</p>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">{formatTimeAgo(event.timestamp)}</p>
                                {event.action && (
                                    <button
                                        onClick={() => setCurrentView(event.action!.view)}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded-md transition-colors"
                                    >
                                        {event.action.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default LiveActivity;