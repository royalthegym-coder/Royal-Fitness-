import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import { 
    User, Activity, HeartPulse, Coffee, Target, Brain, 
    ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Upload, RefreshCw, Wallet, Fingerprint, Nfc
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { GYM_INFO } from '../../constants';
import { sendPaymentRequest, sendWhatsAppWelcomeMessage, sendPaymentReceipt } from '../../lib/whatsapp';
import { Member, Invoice, Transaction } from '../../types';

const ScientificAdmissionForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const steps = [
        { id: 1, title: 'मूल जानकारी', icon: <User className="w-5 h-5" /> },
        { id: 2, title: 'बायोमेट्रिक्स', icon: <Activity className="w-5 h-5" /> },
        { id: 3, title: 'मेडिकल इतिहास', icon: <HeartPulse className="w-5 h-5" /> },
        { id: 4, title: 'जीवनशैली', icon: <Coffee className="w-5 h-5" /> },
        { id: 5, title: 'फिटनेस लक्ष्य', icon: <Target className="w-5 h-5" /> },
        { id: 6, title: 'Neural OS डेटा', icon: <Brain className="w-5 h-5" /> }
    ];

    const handleNext = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call to n8n -> Gemini 1.5 Pro
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 2500);
    };

    if (isSuccess) {
        return (
            <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Scientific Grade Report Generated!</h2>
                <p className="text-gray-400 max-w-lg">
                    आपका डेटा सफलतापूर्वक 'Neural OS' को भेज दिया गया है। Gemini 1.5 Pro ने आपकी प्रोफाइल का विश्लेषण कर लिया है।
                </p>
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl text-left w-full max-w-md space-y-4">
                    <div className="flex items-center gap-3 text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-medium">Aether Prime Core Actions:</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            WhatsApp पर पहला वर्कआउट वीडियो भेजा गया
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            100% सटीक डाइट चार्ट तैयार किया गया
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                            Royal Overlord द्वारा पेमेंट रिमाइंडर सेट किया गया
                        </li>
                    </ul>
                </div>
                <button 
                    onClick={() => { setIsSuccess(false); setCurrentStep(1); }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                    नया फॉर्म भरें
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                    Scientific AI Admission Form
                </h1>
                <p className="text-gray-400 mt-2">
                    यह फॉर्म 'Neural OS' को 100% सटीक डाइट और वर्कआउट प्लान तैयार करने के लिए डेटा प्रदान करता है।
                </p>
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -translate-y-1/2 rounded-full"></div>
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 -translate-y-1/2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                ></div>
                <div className="relative flex justify-between">
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                currentStep >= step.id 
                                    ? 'bg-gray-900 border-indigo-500 text-indigo-400' 
                                    : 'bg-gray-900 border-gray-700 text-gray-500'
                            }`}>
                                {step.icon}
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${
                                currentStep >= step.id ? 'text-indigo-300' : 'text-gray-500'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <Card className="bg-gray-900/50 border-gray-800">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Step 1: Personal Profile */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <User className="w-5 h-5 text-indigo-400" />
                                भाग 1: मूल जानकारी (Personal Profile)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">पूरा नाम</label>
                                    <input type="text" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Rahul Kumar" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">मोबाइल नंबर (WhatsApp)</label>
                                    <input type="tel" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="+91 9876543210" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">आयु</label>
                                    <input type="number" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. 25" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">लिंग</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="male">पुरुष (Male)</option>
                                        <option value="female">महिला (Female)</option>
                                        <option value="other">अन्य (Other)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">व्यवसाय (Profession)</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="desk">डेस्क जॉब (Sitting mostly)</option>
                                        <option value="active">भाग-दौड़ वाला काम (Active/Standing)</option>
                                        <option value="student">छात्र (Student)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">इससे AI को आपकी दैनिक कैलोरी बर्न का अंदाजा लगाने में मदद मिलेगी।</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Body Metrics */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                भाग 2: बायोमेट्रिक्स और शारीरिक माप
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">वजन (kg)</label>
                                    <input type="number" step="0.1" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. 75.5" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">लंबाई (cm)</label>
                                    <input type="number" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. 175" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">ब्लड ग्रुप</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500">
                                        <option value="">चुनें (Optional)...</option>
                                        <option value="A+">A+</option><option value="A-">A-</option>
                                        <option value="B+">B+</option><option value="B-">B-</option>
                                        <option value="O+">O+</option><option value="O-">O-</option>
                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">बॉडी फैट प्रतिशत (अनुमानित)</label>
                                    <input type="number" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. 15" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">AI Visual Analysis के लिए फोटो (Optional)</label>
                                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-800/30 hover:border-cyan-500/50 transition-colors cursor-pointer">
                                        <Upload className="w-8 h-8 mb-2" />
                                        <span className="text-sm">Click to upload or drag and drop</span>
                                        <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Medical History */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <HeartPulse className="w-5 h-5 text-rose-400" />
                                भाग 3: स्वास्थ्य और मेडिकल इतिहास
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300">पुरानी चोटें (Injuries)</label>
                                    <p className="text-xs text-gray-500">क्या आपको घुटने, पीठ या कंधों में कोई पुरानी चोट है?</p>
                                    <textarea className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 min-h-[100px]" placeholder="यदि कोई चोट है तो यहाँ विवरण दें..."></textarea>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300">मेडिकल कंडीशंस</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['थायराइड', 'डायबिटीज', 'PCOD/PCOS', 'ब्लड प्रेशर', 'अस्थमा', 'हृदय रोग', 'कोई नहीं'].map(condition => (
                                            <label key={condition} className="flex items-center gap-2 p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50">
                                                <input type="checkbox" className="rounded border-gray-600 text-rose-500 focus:ring-rose-500 bg-gray-900" />
                                                <span className="text-sm text-gray-300">{condition}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300">एलर्जी (Allergies)</label>
                                    <input type="text" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500" placeholder="जैसे: दूध (Lactose), मूंगफली, ग्लूटेन..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Lifestyle & Nutrition */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Coffee className="w-5 h-5 text-amber-400" />
                                भाग 4: जीवनशैली और पोषण
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">डाइट का प्रकार</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="veg">शाकाहारी (Vegetarian)</option>
                                        <option value="nonveg">मांसाहारी (Non-Vegetarian)</option>
                                        <option value="egg">अंडाहारी (Eggitarian)</option>
                                        <option value="vegan">वीगन (Vegan)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">पानी का सेवन (प्रतिदिन)</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="low">1-2 लीटर</option>
                                        <option value="medium">2-3 लीटर</option>
                                        <option value="high">3-4 लीटर</option>
                                        <option value="veryhigh">4+ लीटर</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">भोजन की आवृत्ति</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required>
                                        <option value="">आप दिन में कितनी बार खाते हैं?</option>
                                        <option value="2">2 बार</option>
                                        <option value="3">3 बार</option>
                                        <option value="4">4 बार</option>
                                        <option value="5+">5+ बार</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">सोने का समय</label>
                                    <input type="time" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required />
                                    <p className="text-xs text-gray-500 mt-1">यह 'Chronos Mirror' बोट के लिए जरूरी है।</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">सप्लीमेंट का इतिहास</label>
                                    <input type="text" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" placeholder="क्या आप पहले से कोई प्रोटीन या मल्टीविटामिन ले रहे हैं?" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Fitness Goals */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Target className="w-5 h-5 text-green-400" />
                                भाग 5: फिटनेस लक्ष्य
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">प्राइमरी गोल</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { id: 'wl', label: 'वजन घटाना', desc: 'Weight Loss' },
                                            { id: 'mg', label: 'मसल्स गेन', desc: 'Muscle Gain' },
                                            { id: 'st', label: 'स्ट्रेंथ ट्रेनिंग', desc: 'Strength' },
                                            { id: 'gf', label: 'सामान्य फिटनेस', desc: 'General Fitness' }
                                        ].map(goal => (
                                            <label key={goal.id} className="flex flex-col p-4 border border-gray-700 rounded-xl cursor-pointer hover:bg-gray-800/50 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
                                                <input type="radio" name="primaryGoal" className="sr-only" required />
                                                <span className="font-medium text-gray-200">{goal.label}</span>
                                                <span className="text-xs text-gray-500 mt-1">{goal.desc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">अनुभव का स्तर</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="beginner">बिगनर (Beginner)</option>
                                        <option value="intermediate">इंटरमीडिएट (Intermediate)</option>
                                        <option value="advanced">एडवांस (Advanced)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">समय की प्रतिबद्धता</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500" required>
                                        <option value="">सप्ताह में कितने दिन?</option>
                                        <option value="3">3 दिन / सप्ताह</option>
                                        <option value="4">4 दिन / सप्ताह</option>
                                        <option value="5">5 दिन / सप्ताह</option>
                                        <option value="6">6 दिन / सप्ताह</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Neural OS Insights */}
                    {currentStep === 6 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Brain className="w-5 h-5 text-purple-400" />
                                भाग 6: 'Neural OS' के लिए विशेष डेटा
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300 flex justify-between">
                                        <span>तनाव का स्तर (Stress Level)</span>
                                        <span className="text-purple-400">1 से 10 के पैमाने पर</span>
                                    </label>
                                    <input type="range" min="1" max="10" defaultValue="5" className="w-full accent-purple-500" />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>बिल्कुल नहीं (1)</span>
                                        <span>सामान्य (5)</span>
                                        <span>बहुत अधिक (10)</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">हाई स्ट्रेस में डाइट अलग तरह से काम करती है।</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">नींद की गुणवत्ता</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" required>
                                        <option value="">आप रोजाना कितने घंटे गहरी नींद लेते हैं?</option>
                                        <option value="<5">5 घंटे से कम</option>
                                        <option value="5-6">5-6 घंटे</option>
                                        <option value="7-8">7-8 घंटे (आदर्श)</option>
                                        <option value=">8">8 घंटे से अधिक</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">मेटाबॉलिक रेट फैक्टर्स</label>
                                    <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" required>
                                        <option value="">पसीना आने की प्रवृत्ति</option>
                                        <option value="high">बहुत जल्दी पसीना आता है</option>
                                        <option value="normal">सामान्य</option>
                                        <option value="low">बहुत कम पसीना आता है</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={currentStep === 1 || isSubmitting}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                currentStep === 1 || isSubmitting
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-300 hover:bg-gray-800'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            पिछला
                        </button>

                        {currentStep < 6 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                अगला
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Analyzing Data...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Submit to Neural OS
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ScientificAdmissionForm;
