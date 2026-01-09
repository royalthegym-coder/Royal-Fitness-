import React, { useState } from 'react';
import Reports from './Reports';
import GoogleBusiness from './GoogleBusiness';
import Card from './common/Card';
import Modal from './common/Modal';
import { getGoogleMapsResponse } from '../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import MemberAutomation from './MemberAutomation';
import { BotIcon } from './icons/BotIcon';

const MarketResearch: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<{ text: string; places: any[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSearch = () => {
        setIsLoading(true);
        setError(null);
        setResults(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await getGoogleMapsResponse("Find other gyms near me", latitude, longitude);
                    setResults(response);
                    setIsModalOpen(true);
                } catch (err) {
                    setError("Failed to get data from Gemini. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            },
            (geoError) => {
                setError(`Geolocation error: ${geoError.message}. Please enable location services.`);
                setIsLoading(false);
            }
        );
    };

    return (
        <div>
            <Card title="Local Market Research">
                <p className="text-gray-400 mb-4">
                    Use Google Maps to find and analyze other gyms in your immediate area. This helps you understand the local competition and market landscape.
                </p>
                {error && <p className="text-red-400 mb-4">{error}</p>}
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600 w-full flex items-center justify-center"
                >
                    <SparkleIcon className="w-5 h-5 mr-2" />
                    {isLoading ? 'Analyzing...' : 'Find Nearby Competitors'}
                </button>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Local Competitor Analysis">
                {results ? (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: results.text.replace(/\n/g, '<br />') }}></div>
                        
                        {results.places.length > 0 && (
                            <div>
                                <h4 className="font-bold mt-6 mb-2 text-amber-400">Data Sources (from Google Maps):</h4>
                                <ul className="space-y-2">
                                    {results.places.map((place, index) => (
                                        <li key={index} className="bg-gray-700/50 p-2 rounded-md">
                                            <a href={place.maps.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                {place.maps.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>No results found.</p>
                )}
            </Modal>
        </div>
    );
};


const GeminiHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'reports' | 'google' | 'market' | 'automation'>('reports');

    const renderContent = () => {
        switch (activeTab) {
            case 'reports':
                return <Reports />;
            case 'google':
                return <GoogleBusiness />;
            case 'market':
                return <MarketResearch />;
            case 'automation':
                return <MemberAutomation />;
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-bold text-amber-400 flex items-center"><SparkleIcon className="w-8 h-8 mr-3"/>Gemini Hub</h1>
            </div>

            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('reports')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Reports & Analysis
                    </button>
                    <button onClick={() => setActiveTab('google')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'google' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Google Business
                    </button>
                     <button onClick={() => setActiveTab('market')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'market' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Market Research
                    </button>
                    <button onClick={() => setActiveTab('automation')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'automation' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        <div className="flex items-center">
                            <BotIcon />
                            <span className="ml-2">Member Automation</span>
                        </div>
                    </button>
                </nav>
            </div>
            
            {renderContent()}
        </div>
    );
};

export default GeminiHub;