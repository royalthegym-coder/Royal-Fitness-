
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { INITIAL_GOOGLE_REVIEWS, INITIAL_GOOGLE_POSTS, GYM_INFO } from '../../constants';
import { GoogleReview, GoogleBusinessPost } from '../../types';
import { StarIcon } from './icons/StarIcon';
import { 
    getComplexResponse, 
    getGoogleMapsResponse, 
    generateMarketingImage, 
    generateAutonomousMarketingStrategy,
    optimizeBusinessDescription,
    analyzeCompetitorGap
} from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import Modal from './common/Modal';
import { BotIcon } from './icons/BotIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

const GoogleBusiness: React.FC = () => {
    const [isAccountLinked, setIsAccountLinked] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [reviews, setReviews] = useState<GoogleReview[]>(INITIAL_GOOGLE_REVIEWS);
    const [posts, setPosts] = useState<GoogleBusinessPost[]>(INITIAL_GOOGLE_POSTS);
    const [replyingTo, setReplyingTo] = useState<GoogleReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNewPostModalOpen, setNewPostModalOpen] = useState(false);
    
    // Map State
    const [isLocating, setIsLocating] = useState(false);
    const [mapData, setMapData] = useState<{text: string} | null>(null);

    // Genius Automation State
    const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
    const [autoPilotStatus, setAutoPilotStatus] = useState('');
    
    // Autonomous SEO State
    const [isAutonomousActive, setIsAutonomousActive] = useState(false);
    const [autonomousLogs, setAutonomousLogs] = useState<string[]>([]);
    const [optimizationReport, setOptimizationReport] = useState<string | null>(null);

    const handleLinkAccount = () => {
        setIsLinking(true);
        // Simulate OAuth Handshake
        setTimeout(() => {
            setIsAccountLinked(true);
            setIsLinking(false);
        }, 2000);
    };

    const handleGenerateReply = async (review: GoogleReview) => {
        setReplyingTo(review);
        setIsGenerating(true);
        const prompt = `Generate a professional and friendly reply to the following customer review for a gym named "Royal The Gym". Keep it concise.
        
        Reviewer: ${review.authorName}
        Rating: ${review.rating}/5
        Comment: "${review.comment}"
        `;
        const generatedReply = await getComplexResponse(prompt);
        setReplyText(generatedReply);
        setIsGenerating(false);
    };
    
    const handleSendReply = () => {
        if (!replyingTo) return;
        const updatedReviews = reviews.map(r => 
            r.id === replyingTo.id 
            ? { ...r, reply: { comment: replyText, timestamp: new Date().toISOString().split('T')[0] } } 
            : r
        );
        setReviews(updatedReviews);
        setReplyingTo(null);
        setReplyText('');
    };

    // --- AUTONOMOUS OPTIMIZATION LOOP ---
    useEffect(() => {
        if (!isAutonomousActive || !isAccountLinked) return;

        const runOptimizationCycle = async () => {
            const timestamp = new Date().toLocaleTimeString();
            setAutonomousLogs(prev => [`[${timestamp}] AI Agent: Scanning Profile Performance...`, ...prev]);
            
            // 1. Analyze Sentiment & Trends (Simulated)
            await new Promise(r => setTimeout(r, 2000));
            setAutonomousLogs(prev => [`[${new Date().toLocaleTimeString()}] AI Agent: Sentiment Analysis 85% Positive.`, ...prev]);

            // 2. SEO Check
            if (Math.random() > 0.5) {
                setAutonomousLogs(prev => [`[${new Date().toLocaleTimeString()}] AI Agent: Detecting low visibility on keyword "Crossfit". Optimizing description...`, ...prev]);
                // Simulate SEO update
                await new Promise(r => setTimeout(r, 1500));
                setAutonomousLogs(prev => [`[${new Date().toLocaleTimeString()}] AI Agent: Profile Description Updated (v2.4).`, ...prev]);
            }

            // 3. Competitor Check
            setAutonomousLogs(prev => [`[${new Date().toLocaleTimeString()}] AI Agent: Scanning local competitors on Maps...`, ...prev]);
        };

        const interval = setInterval(runOptimizationCycle, 10000); // Run every 10s for demo
        runOptimizationCycle(); // Run immediately on start

        return () => clearInterval(interval);
    }, [isAutonomousActive, isAccountLinked]);

    const handleRunFullOptimization = async () => {
        if (!isAccountLinked) return;
        setOptimizationReport(null);
        setIsGenerating(true);
        
        try {
            const strategy = await generateAutonomousMarketingStrategy(reviews, posts, GYM_INFO);
            setOptimizationReport(strategy);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRunGeniusAutoPilot = async () => {
        if (!isAccountLinked) {
            alert("Please connect your Google Business Profile first.");
            return;
        }
        setIsAutoPilotRunning(true);
        const unrepliedReviews = reviews.filter(r => !r.reply);
        
        if (unrepliedReviews.length === 0) {
            setAutoPilotStatus("All reviews already have replies! Great job.");
            setTimeout(() => { setIsAutoPilotRunning(false); setAutoPilotStatus(''); }, 3000);
            return;
        }

        setAutoPilotStatus(`Found ${unrepliedReviews.length} pending reviews. Initializing Genius Agent...`);

        // Process sequentially to simulate "thinking"
        for (let i = 0; i < unrepliedReviews.length; i++) {
            const review = unrepliedReviews[i];
            setAutoPilotStatus(`Analyzing sentiment for ${review.authorName}'s review...`);
            
            // Artificial delay for UX
            await new Promise(r => setTimeout(r, 1000));

            const prompt = `
                Act as the owner of "Royal The Gym". Write a reply to this Google Review.
                
                **Review Details:**
                User: ${review.authorName}
                Rating: ${review.rating}/5 stars
                Comment: "${review.comment}"

                **Logic:**
                - If 5 stars: Be enthusiastic, thank them by name, invite them to bring a friend.
                - If 3-4 stars: Thank them, acknowledge the feedback, mention we are improving.
                - If 1-2 stars: Apologize professionally, ask them to contact ${GYM_INFO.contact} to resolve it.
                
                Keep it under 40 words. Professional but warm tone.
            `;

            try {
                const aiReply = await getComplexResponse(prompt);
                
                setReviews(prevReviews => prevReviews.map(r => 
                    r.id === review.id 
                    ? { ...r, reply: { comment: aiReply, timestamp: new Date().toISOString().split('T')[0] } } 
                    : r
                ));
                
                setAutoPilotStatus(`Reply published for ${review.authorName}.`);
            } catch (e) {
                console.error(e);
            }
        }

        setAutoPilotStatus("Genius Cycle Complete. All reviews handled.");
        setTimeout(() => { setIsAutoPilotRunning(false); setAutoPilotStatus(''); }, 3000);
    };

    const handleLocateGym = async () => {
        setIsLocating(true);
        try {
            // Using Gemini to simulate a rich map data fetch for the specific business
            const response = await getGoogleMapsResponse(`Show details and location for ${GYM_INFO.name} in Jhunjhunu, Rajasthan. Include rating and address.`);
            setMapData(response);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLocating(false);
        }
    };

    const handlePublishPost = (post: Omit<GoogleBusinessPost, 'id'>) => {
        // Simulate immediate API reflection
        const newPost: GoogleBusinessPost = {
            ...post,
            id: `post_${Date.now()}`,
            timestamp: 'Just now',
            state: 'LIVE'
        };
        setPosts([newPost, ...posts]);
        setNewPostModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Account Connection Header */}
            {!isAccountLinked ? (
                <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-dashed border-gray-600">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="bg-white p-4 rounded-full mb-4 shadow-lg">
                            <GoogleIcon className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connect Google Business Profile</h2>
                        <p className="text-gray-400 mb-6 max-w-lg">
                            Link your Google account to enable <strong>Real-time Posting</strong>, <strong>Review Management</strong>, and <strong>AI Auto-Replies</strong> for Royal The Gym.
                        </p>
                        <button 
                            onClick={handleLinkAccount}
                            disabled={isLinking}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all flex items-center"
                        >
                            {isLinking ? (
                                <>
                                    <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin" /> Authenticating...
                                </>
                            ) : (
                                <>
                                    Connect Account
                                </>
                            )}
                        </button>
                        <p className="text-xs text-gray-500 mt-4 flex items-center">
                            <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500" /> Secure OAuth 2.0 Connection
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-green-500/30 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                    <div className="flex items-center">
                        <div className="p-3 bg-white rounded-full shadow-md mr-4 relative">
                            <GoogleIcon className="w-8 h-8" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                {GYM_INFO.name}
                                <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900">Verified</span>
                            </h2>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="flex items-center mr-4">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                                    Synced with Google
                                </span>
                                <span>{GYM_INFO.googleBusinessEmail}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Views</p>
                            <p className="text-lg font-bold text-blue-500">12.5k <span className="text-green-500 text-xs">↑ 12%</span></p>
                        </div>
                        <div className="h-10 w-px bg-gray-700 mx-2 hidden md:block"></div>
                        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            Settings
                        </button>
                    </div>
                </div>
            )}

            {isAccountLinked && (
            <>
                {/* --- NEW: AUTONOMOUS OPTIMIZER HUB --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-r from-gray-900 to-indigo-900 border-l-4 border-indigo-500 relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BotIcon />
                        </div>
                        <div className="flex flex-col h-full justify-between relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <SparkleIcon className="w-6 h-6 text-indigo-300" />
                                    <h3 className="text-lg font-bold text-white">Autonomous Profile Optimizer</h3>
                                </div>
                                <p className="text-indigo-200 text-sm mb-4">
                                    Enables Gemini 2.0 Agent to autonomously update keywords, monitor competitor gaps, and adjust business descriptions for max visibility.
                                </p>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-sm font-bold ${!isAutonomousActive ? 'text-gray-400' : 'text-green-400'}`}>
                                        {isAutonomousActive ? '● SYSTEM ACTIVE' : '○ SYSTEM IDLE'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isAutonomousActive} onChange={() => setIsAutonomousActive(!isAutonomousActive)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="bg-black/30 rounded-lg p-2 font-mono text-[10px] text-green-400 h-24 overflow-y-auto border border-indigo-500/20 custom-scrollbar">
                                {autonomousLogs.length === 0 && <span className="text-gray-500">Waiting for activation...</span>}
                                {autonomousLogs.map((log, i) => (
                                    <div key={i} className="mb-1">{log}</div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gray-800 border border-gray-700 h-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-white">Deep Strategic Analysis</h3>
                            <button 
                                onClick={handleRunFullOptimization}
                                disabled={isGenerating}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-1.5 px-3 rounded flex items-center transition-colors disabled:opacity-50"
                            >
                                {isGenerating ? <AutoUpdateIcon className="w-3 h-3 animate-spin mr-1"/> : <SparkleIcon className="w-3 h-3 mr-1"/>}
                                Run Deep Scan
                            </button>
                        </div>
                        {optimizationReport ? (
                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 h-48 overflow-y-auto custom-scrollbar">
                                <div className="prose dark:prose-invert prose-sm text-xs" dangerouslySetInnerHTML={{ __html: optimizationReport.replace(/\n/g, '<br />') }} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center text-sm">
                                <TrendingUpIcon className="w-8 h-8 mb-2 opacity-30" />
                                <p>Click "Run Deep Scan" to generate a comprehensive SEO & Marketing strategy report based on current data.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Genius AI Automation Card (Review Reply) */}
                <Card className="bg-gradient-to-r from-gray-900 to-green-900/40 border-l-4 border-green-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BotIcon />
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center relative z-10">
                        <div className="flex items-start gap-4 mb-4 md:mb-0">
                            <div className="p-3 bg-green-500/20 rounded-full text-green-300">
                                <SparkleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Auto-Reply Agent</h3>
                                <p className="text-green-200 text-sm max-w-lg">
                                    The Genius Agent reads new reviews, detects sentiment, and posts intelligent, optimized replies instantly.
                                </p>
                                {autoPilotStatus && (
                                    <p className="text-green-400 text-xs font-mono mt-2 flex items-center animate-pulse">
                                        <AutoUpdateIcon className="w-3 h-3 mr-1" />
                                        {autoPilotStatus}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={handleRunGeniusAutoPilot}
                            disabled={isAutoPilotRunning}
                            className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center ${isAutoPilotRunning ? 'bg-green-700 cursor-wait' : 'bg-green-600 hover:bg-green-500 hover:scale-105'}`}
                        >
                            {isAutoPilotRunning ? (
                                <>
                                    <AutoUpdateIcon className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                </>
                            ) : (
                                <>
                                    <BotIcon /> <span className="ml-2">Run Reply Agent</span>
                                </>
                            )}
                        </button>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Reviews & Posts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Latest Updates & Offers */}
                        <Card title="Latest Updates & Offers" className="border-t-4 border-amber-500">
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-sm text-gray-400">Manage posts visible on Google Search & Maps.</p>
                                    <p className="text-xs text-green-500 mt-1 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>Real-time Sync Active</p>
                                </div>
                                <button onClick={() => setNewPostModalOpen(true)} className="bg-amber-500 text-gray-900 text-sm font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors shadow-lg flex items-center">
                                    <UploadIcon className="w-4 h-4 mr-2" /> Create Update
                                </button>
                             </div>
                            <div className="space-y-4">
                                {posts.length === 0 && <p className="text-center text-gray-500 py-8">No active offers. Create one to engage customers!</p>}
                                {posts.map(post => (
                                    <div key={post.id} className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all animate-fade-in">
                                       {post.imageUrl ? (
                                            <img src={post.imageUrl} alt="Post" className="w-24 h-24 object-cover rounded-md shadow-sm" />
                                       ) : (
                                            <div className="w-24 h-24 bg-gray-700 rounded-md flex items-center justify-center text-gray-500">
                                                <GoogleIcon className="w-8 h-8 opacity-20" />
                                            </div>
                                       )}
                                       <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <p className="text-gray-900 dark:text-white font-medium text-sm line-clamp-2">{post.content}</p>
                                                    <button className="text-gray-400 hover:text-white">•••</button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-bold flex items-center">
                                                        <GoogleIcon className="w-3 h-3 mr-1" /> Live on Search
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center">
                                                        <span className="w-1 h-1 bg-gray-500 rounded-full mx-2"></span>
                                                        {post.timestamp}
                                                    </span>
                                                </div>
                                                <button className="text-xs text-blue-400 hover:underline">View</button>
                                            </div>
                                       </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Reviews Management */}
                        <Card title="Manage Reviews">
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {reviews.map(review => (
                                    <div key={review.id} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 transition-all duration-500">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{review.authorName}</p>
                                                <div className="flex items-center mt-1">
                                                    {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500">{review.timestamp}</span>
                                        </div>
                                        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">{review.comment}</p>
                                        
                                        {review.reply ? (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md animate-fade-in">
                                                <div className="flex items-center mb-1">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mr-2">Owner Response</span>
                                                    <span className="text-[10px] text-gray-400">{review.reply.timestamp}</span>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{review.reply.comment}"</p>
                                            </div>
                                        ) : replyingTo?.id === review.id ? (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <textarea 
                                                    value={replyText} 
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    rows={3}
                                                    placeholder="Write your reply..."
                                                    disabled={isGenerating}
                                                />
                                                <div className="flex justify-end space-x-2 mt-2">
                                                    <button onClick={() => setReplyingTo(null)} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium px-3 py-1">Cancel</button>
                                                    <button onClick={handleSendReply} className="text-xs bg-blue-600 text-white font-bold py-1.5 px-4 rounded-md hover:bg-blue-500 shadow-sm">Post Reply</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleGenerateReply(review)} 
                                                    disabled={isGenerating && replyingTo?.id === review.id} 
                                                    className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded text-gray-700 dark:text-gray-300 font-medium flex items-center disabled:opacity-50"
                                                >
                                                    <SparkleIcon className="w-3 h-3 mr-1" />
                                                    {isGenerating && replyingTo?.id === review.id ? 'Thinking...' : 'AI Suggestion'}
                                                </button>
                                                <button 
                                                    onClick={() => { setReplyingTo(review); setReplyText(''); }} 
                                                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                                >
                                                    Manual Reply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Maps & Info */}
                    <div className="space-y-6">
                        <Card className="p-0 overflow-hidden border-2 border-blue-500/20">
                            <div className="h-48 bg-gray-200 dark:bg-gray-700 relative group cursor-pointer" onClick={handleLocateGym}>
                                {/* Simulated Map Visual */}
                                <div className="absolute inset-0 opacity-50 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/75.8,28.1,15,0/400x300?access_token=pk.eyJ1IjoiZGVtbyIsImEiOiJja2VkbmxsY3YwNHRmMnlxZ2pwdXhuYnZ4In0.2jL7_yQ5Q-x_x_x_x')] bg-cover bg-center"></div>
                                
                                {!isLocating && !mapData && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                                        <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center transform group-hover:scale-105 transition-transform">
                                            <GoogleIcon className="w-5 h-5 mr-2" />
                                            Locate My Gym
                                        </button>
                                    </div>
                                )}
                                
                                {isLocating && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                        <SparkleIcon className="w-8 h-8 text-amber-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 bg-white dark:bg-gray-800">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Royal The Gym</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{GYM_INFO.address}</p>
                                
                                {mapData ? (
                                    <div className="prose prose-invert text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mb-3 max-h-40 overflow-y-auto">
                                        <div dangerouslySetInnerHTML={{ __html: mapData.text.replace(/\n/g, '<br />') }} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                                            <p className="text-xs text-gray-500">Rating</p>
                                            <p className="font-bold text-amber-500">4.7 ★</p>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                                            <p className="text-xs text-gray-500">Views</p>
                                            <p className="font-bold text-blue-500">1.2k</p>
                                        </div>
                                    </div>
                                )}

                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(GYM_INFO.name + ' ' + GYM_INFO.address)}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                                >
                                    Open in Google Maps
                                </a>
                            </div>
                        </Card>

                        {/* Inbuilt Google Business Settings (Synced) */}
                        <Card title="Synced Business Info">
                            <div className="space-y-3 text-sm">
                                <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300 mb-2">
                                    These settings are synced directly from your Google Business Profile.
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500">Category</span>
                                    <span className="font-medium text-gray-900 dark:text-white">Fitness Center</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500">Hours</span>
                                    <span className="font-medium text-gray-900 dark:text-white">05:00 AM - 10:00 PM</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{GYM_INFO.contact}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500">Website</span>
                                    <a href={GYM_INFO.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 truncate max-w-[150px]">
                                        royal-the-gym...
                                    </a>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500">Status</span>
                                    <span className="font-bold text-green-500">Open Now</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </>
            )}
            
            {isNewPostModalOpen && 
                <NewPostModal 
                    isOpen={isNewPostModalOpen} 
                    onClose={() => setNewPostModalOpen(false)}
                    onSave={handlePublishPost}
                />
            }
        </div>
    );
};

interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (post: Omit<GoogleBusinessPost, 'id'>) => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [imageUrl, setImageUrl] = useState('https://picsum.photos/seed/gympost/400/300');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerateContent = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        // Using the Google Search Tool to get inspiration or context if needed, effectively "grounding" the post generation
        const prompt = `Act as a Senior Marketing Copywriter for "Royal The Gym". Write a high-converting Google Business offer post about: "${topic}". 
        Include:
        - Catchy Headline
        - Persuasive Body
        - Clear Call to Action (Contact: ${GYM_INFO.contact})
        - Use appropriate Emojis.
        Keep it under 150 words.`;
        const result = await getComplexResponse(prompt); 
        setContent(result);
        setIsLoading(false);
    };

    const handleGenerateImage = async () => {
        if (!topic.trim() && !content.trim()) {
            alert("Please enter a topic or draft content first to generate a relevant image.");
            return;
        }
        setIsGeneratingImage(true);
        const promptText = topic || content.slice(0, 100);
        const generatedImageBase64 = await generateMarketingImage(promptText);
        if (generatedImageBase64) {
            setImageUrl(generatedImageBase64);
        } else {
            alert("Failed to generate image. Please try again.");
        }
        setIsGeneratingImage(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImageUrl(event.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        setIsPublishing(true);
        // Simulate API latency to Google Servers
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        onSave({
            content,
            imageUrl,
            timestamp: new Date().toISOString(),
            state: 'LIVE',
        });
        setIsPublishing(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Update on Google">
            <div className="space-y-4">
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center">
                    <GoogleIcon className="w-6 h-6 mr-3" />
                    <div>
                        <p className="text-sm font-bold text-white">Posting to: {GYM_INFO.name}</p>
                        <p className="text-xs text-gray-400">Publicly visible on Search and Maps</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300">Topic / Offer</label>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Summer Sale, New Treadmills"
                            className="flex-1 mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 text-white"
                        />
                        <button onClick={handleGenerateContent} disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-500 flex items-center mt-1 whitespace-nowrap">
                            <SparkleIcon className="w-4 h-4 mr-1" />
                            {isLoading ? '...' : 'Auto-Write'}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Update Description</label>
                    <textarea 
                        rows={5}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 text-white font-sans text-sm leading-relaxed"
                        placeholder="What's new at the gym?"
                    />
                </div>
                
                {/* Image Preview & Generation */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Media</label>
                    <div className="relative w-full h-48 bg-gray-700 rounded-lg overflow-hidden group border border-gray-600">
                        {isGeneratingImage ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-300">
                                <SparkleIcon className="w-8 h-8 animate-spin text-amber-400 mb-2"/>
                                <span className="text-xs font-mono animate-pulse">Rendering 4K Visual...</span>
                            </div>
                        ) : (
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                        )}
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                            <button 
                                onClick={handleGenerateImage}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:shadow-lg flex items-center"
                            >
                                <SparkleIcon className="w-4 h-4 mr-1" /> Auto-Generate
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-700 flex items-center"
                            >
                                <UploadIcon className="w-4 h-4 mr-1" /> Upload Manual
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 text-right">Supports JPG, PNG (Max 5MB) • Auto-Gen uses Gemini Pro Vision</p>
                </div>

                 <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 mr-2">Cancel</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!content.trim() || isPublishing} 
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 disabled:bg-gray-500 flex items-center shadow-lg"
                    >
                        {isPublishing ? (
                            <>
                                <AutoUpdateIcon className="w-4 h-4 mr-2 animate-spin" /> Publishing...
                            </>
                        ) : (
                            <>
                                Publish to Google
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GoogleBusiness;
