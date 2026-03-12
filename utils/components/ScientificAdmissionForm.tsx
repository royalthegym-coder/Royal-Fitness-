import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from './common/Card';
import { 
    User, Activity, HeartPulse, Coffee, Target, Brain, 
    ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Upload, RefreshCw, Wallet, Fingerprint, Nfc,
    Dumbbell, ShoppingBag, Apple, Pill, Minus, Plus, ShieldCheck, Smartphone,
    ExternalLink, Star, MessageCircle, Globe, Flame, Crown, Zap, Camera, FileText, X
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { GYM_INFO } from '../../constants';
import { sendPaymentRequest, sendWhatsAppWelcomeMessage, sendPaymentReceipt } from '../../lib/whatsapp';
import { Member, Invoice, Transaction } from '../../types';
import { analyzeMemberPhoto, generatePersonalizedHealthVision } from '../../lib/gemini';
import { triggerAutomation } from '../../lib/automation';

const ScientificAdmissionForm: React.FC = () => {
    const { members, packages, inventory, addMember, addInvoice, addTransaction, updateInventory, addMedicalReport } = useData();
    const { addToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [healthVision, setHealthVision] = useState<string>('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: '',
        profession: '',
        weight: '',
        height: '',
        bloodGroup: '',
        bodyFat: '',
        avatar: '',
        password: '', // Added
        injuries: '',
        conditions: [] as string[],
        allergies: '',
        dietType: '',
        waterIntake: '',
        mealFrequency: '',
        sleepTime: '',
        supplements: '',
        primaryGoal: '',
        experienceLevel: '',
        timeCommitment: '',
        stressLevel: '5',
        sleepQuality: '',
        metabolicRate: '',
        medicalReports: [] as { name: string; type: string; data: string }[], // Added for reports
        // Payment State
        packageId: '',
        includeRegFee: false,
        cart: [] as { itemId: string; name: string; price: number; qty: number; type: string }[],
        paymentMethod: 'UPI' as 'UPI' | 'Cash' | 'Card (NFC)',
        isPaid: false
    });

    const selectedPkg = packages.find(p => p.id === Number(formData.packageId));
    
    const pkgPrice = selectedPkg?.price || 0;
    const registrationFee = formData.includeRegFee ? 1000 : 0;
    const cartTotal = formData.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalAmount = pkgPrice + registrationFee + cartTotal;

    const addToCart = (item: any) => {
        setFormData(prev => {
            const existing = prev.cart.find(i => i.itemId === item.id);
            if (existing) {
                return { ...prev, cart: prev.cart.map(i => i.itemId === item.id ? { ...i, qty: i.qty + 1 } : i) };
            }
            return { ...prev, cart: [...prev.cart, { itemId: item.id, name: item.name, price: item.price || 0, qty: 1, type: item.category }] };
        });
    };

    const updateCartQty = (itemId: string, delta: number) => {
        setFormData(prev => ({
            ...prev,
            cart: prev.cart.map(i => i.itemId === itemId ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0)
        }));
    };

    const [manualItem, setManualItem] = useState({ name: '', price: '', category: 'Accessories' });

    const addManualItem = () => {
        if (!manualItem.name || !manualItem.price) return;
        addToCart({ 
            id: `manual-${Date.now()}`, 
            name: manualItem.name, 
            price: Number(manualItem.price), 
            category: manualItem.category 
        });
        setManualItem({ name: '', price: '', category: 'Accessories' });
    };

    const cartCategories = useMemo(() => {
        const cats = {
            'Accessories': 0,
            'Supplements': 0,
            'Apparel': 0,
            'Other': 0
        };
        formData.cart.forEach(item => {
            const cat = item.type || 'Other';
            if (cat in cats) {
                cats[cat as keyof typeof cats] += item.price * item.qty;
            } else {
                cats['Other'] += item.price * item.qty;
            }
        });
        return cats;
    }, [formData.cart]);

    const steps = [
        { id: 1, title: 'मूल जानकारी', icon: <User className="w-5 h-5" /> },
        { id: 2, title: 'बायोमेट्रिक्स', icon: <Activity className="w-5 h-5" /> },
        { id: 3, title: 'मेडिकल इतिहास', icon: <HeartPulse className="w-5 h-5" /> },
        { id: 4, title: 'जीवनशैली', icon: <Coffee className="w-5 h-5" /> },
        { id: 5, title: 'फिटनेस लक्ष्य', icon: <Target className="w-5 h-5" /> },
        { id: 6, title: 'Neural OS डेटा', icon: <Brain className="w-5 h-5" /> },
        { id: 7, title: 'Payment', icon: <Wallet className="w-5 h-5" /> }
    ];

    const handleNext = () => {
        if (currentStep < 7) setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleConditionToggle = (condition: string) => {
        setFormData(prev => {
            if (condition === 'कोई नहीं') {
                return { ...prev, conditions: ['कोई नहीं'] };
            }
            const newConditions = prev.conditions.filter(c => c !== 'कोई नहीं');
            if (newConditions.includes(condition)) {
                return { ...prev, conditions: newConditions.filter(c => c !== condition) };
            } else {
                return { ...prev, conditions: [...newConditions, condition] };
            }
        });
    };

    const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const files = Array.from(target.files || []) as File[];
        if (files.length === 0) return;

        const MAX_SIZE = 1 * 1024 * 1024; // 1MB limit per file
        const newReports: { name: string; type: string; data: string }[] = [];

        for (const file of files) {
            if (file.size > MAX_SIZE) {
                addToast(`Skipped ${file.name}: File too large (>1MB)`, "error");
                continue;
            }

            let mimeType = file.type;
            if (!mimeType) {
                if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
                else if (file.name.endsWith('.csv')) mimeType = 'text/csv';
                else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
                else mimeType = 'application/octet-stream';
            }

            try {
                const reader = new FileReader();
                await new Promise<void>((resolve, reject) => {
                    reader.onload = () => {
                        const res = reader.result?.toString();
                        if (res) {
                            newReports.push({ name: file.name, type: mimeType, data: res });
                        }
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            } catch (err) {
                console.error("Error reading file", err);
                addToast(`Failed to upload ${file.name}`, "error");
            }
        }

        if (newReports.length > 0) {
            setFormData(prev => ({ ...prev, medicalReports: [...prev.medicalReports, ...newReports] }));
            addToast(`${newReports.length} reports attached.`, "success");
        }
        
        try { if (target) target.value = ''; } catch(e) {}
    };

    const removeReport = (index: number) => {
        setFormData(prev => ({
            ...prev,
            medicalReports: prev.medicalReports.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        let aiResults = { health_score: 85, bio_age: Number(formData.age) || 25, body_fat: Number(formData.bodyFat) || 20, body_type: 'Mesomorph', analysis_summary: 'Standard analysis.' };
        
        // Generate Health Vision in parallel with photo analysis if possible
        const visionPromise = generatePersonalizedHealthVision(formData);

        if (formData.avatar) {
            try {
                const results = await analyzeMemberPhoto(formData.avatar);
                if (results && results.health_score) {
                    aiResults = { ...aiResults, ...results };
                }
            } catch (err) {
                console.error("AI Analysis failed, using defaults", err);
            }
        }

        const generatedVision = await visionPromise;
        setHealthVision(generatedVision);

        // Simulate AI Processing & Member Creation
        setTimeout(() => {
            const newId = Math.max(0, ...members.map(m => m.id)) + 1;
            
            const newMember: Member = {
                id: newId,
                name: formData.name,
                phone: formData.phone,
                email: formData.email || `${formData.phone}@royal.gym`,
                joinDate: new Date().toISOString().split('T')[0],
                status: 'Active',
                password: formData.password || 'royal123', // Default password
                packageId: Number(formData.packageId),
                avatar: formData.avatar || `https://i.pravatar.cc/150?u=${newId}`,
                gender: formData.gender,
                dob: '', // Calculate from age if needed
                aadhaar: '',
                address: '',
                achievements: [],
                xp: 0,
                level: 1,
                hrv: 0,
                lbm: 0,
                health_score: aiResults.health_score,
                bio_age: aiResults.bio_age,
                assigned_tests: [],
                automation_settings: { remind_12hrs_before: true, auto_renewal: false, ai_coaching: true, sync_id: '' },
                rpeHistory: [],
                anatomicalStatus: {},
                emergency_contact: { name: '', phone: '', relation: '' },
                whatsappConsent: true,
                physical_metrics: {
                    height: Number(formData.height) || 0,
                    weight: Number(formData.weight) || 0,
                    body_fat: aiResults.body_fat,
                    muscle_mass: 0,
                    target_weight: 0,
                    body_type: aiResults.body_type as any,
                    activity_level: 'Moderate'
                },
                medical_history: {
                    conditions: formData.conditions,
                    pastInjuries: formData.injuries,
                    medications: formData.supplements,
                    lifestyle: {
                        diet: formData.dietType,
                        sleep: formData.sleepTime,
                        stress: formData.stressLevel
                    }
                },
                initial_assessment: {
                    fitness_level: formData.experienceLevel || 'Beginner',
                    pushup_count: 0,
                    plank_time: '0s',
                    squat_count: 0,
                    comments: aiResults.analysis_summary
                }
            };

            // Save Medical Reports
            if (formData.medicalReports.length > 0) {
                formData.medicalReports.forEach(report => {
                    addMedicalReport({
                        report_id: `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        member_id: newId,
                        file_url: report.data,
                        ocr_data: {},
                        status: 'Pending',
                        upload_date: new Date().toISOString()
                    });
                });
            }

            addMember(newMember);

            // Trigger Neural Automation
            triggerAutomation({
                event: 'member_created',
                payload: { member: newMember, paymentMethod: formData.paymentMethod, totalAmount }
            });

            // Payment Processing
            if (formData.packageId) {
                const invoice: Invoice = {
                    id: Date.now(),
                    memberId: newId,
                    memberName: newMember.name,
                    packageId: newMember.packageId,
                    packageName: selectedPkg?.name || 'Custom',
                    amount: totalAmount,
                    date: new Date().toISOString().split('T')[0],
                    status: formData.isPaid ? 'Paid' : 'Pending', 
                    items: [
                        { description: `Membership: ${selectedPkg?.name}`, amount: pkgPrice, type: 'Membership' },
                        ...(registrationFee > 0 ? [{ description: 'Registration Fee', amount: registrationFee, type: 'Fee' }] : []),
                        ...formData.cart.map(c => ({ description: `${c.name} x${c.qty}`, amount: c.price * c.qty, type: c.type }))
                    ]
                };
                addInvoice(invoice);

                if (formData.isPaid) {
                    addTransaction({
                        id: `TXN-${Date.now()}`,
                        memberName: newMember.name,
                        amount: totalAmount,
                        date: invoice.date,
                        method: formData.paymentMethod
                    });

                    // Update Inventory
                    formData.cart.forEach(c => {
                        const item = inventory.find(i => i.id === c.itemId);
                        if (item) {
                            updateInventory({ ...item, stock: Math.max(0, item.stock - c.qty) });
                        }
                    });
                    
                    sendPaymentReceipt(newMember.name, newMember.phone, totalAmount, `TXN-${Date.now()}`, invoice.packageName);
                } else {
                    sendPaymentRequest(newMember, totalAmount, invoice.packageName);
                }
            }

            sendWhatsAppWelcomeMessage(newMember);
            addToast("AI Admission Complete. Member Onboarded.", "success");

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
                        <span className="font-medium">AI Personalized Health Vision:</span>
                    </div>
                    <p className="text-sm text-gray-300 italic leading-relaxed">
                        "{healthVision || 'Your journey to peak performance starts now. With our Neural OS, we will optimize every rep and every meal to ensure you reach your goals faster than ever.'}"
                    </p>
                    
                    <div className="h-px bg-gray-800 my-2"></div>

                    <div className="flex items-center gap-3 text-indigo-400">
                        <Star className="w-5 h-5 text-amber-400" />
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

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button 
                        onClick={() => { setIsSuccess(false); setCurrentStep(1); }}
                        className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> नया फॉर्म भरें
                    </button>
                    <a 
                        href={`${GYM_INFO.website}/reviews`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                        <Star className="w-4 h-4" /> Google Review
                    </a>
                </div>
                
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-4">
                    Google Business & WhatsApp Automation Active
                </p>
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
                    <AnimatePresence mode="wait">
                        {/* Step 1: Personal Profile */}
                        {currentStep === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                    <User className="w-5 h-5 text-indigo-400" />
                                    भाग 1: मूल जानकारी (Personal Profile)
                                </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">पूरा नाम</label>
                                    <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Rahul Kumar" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">मोबाइल नंबर (WhatsApp)</label>
                                    <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="+91 9876543210" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">आयु</label>
                                    <input type="number" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. 25" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">लिंग</label>
                                    <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="male">पुरुष (Male)</option>
                                        <option value="female">महिला (Female)</option>
                                        <option value="other">अन्य (Other)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">व्यवसाय (Profession)</label>
                                    <select value={formData.profession} onChange={(e) => handleInputChange('profession', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="desk">डेस्क जॉब (Sitting mostly)</option>
                                        <option value="active">भाग-दौड़ वाला काम (Active/Standing)</option>
                                        <option value="student">छात्र (Student)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">इससे AI को आपकी दैनिक कैलोरी बर्न का अंदाजा लगाने में मदद मिलेगी।</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">Password (पासवर्ड)</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Set a login password"
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">This password will be used for your Member Portal login.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Body Metrics */}
                    {currentStep === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                भाग 2: बायोमेट्रिक्स और शारीरिक माप
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">वजन (kg)</label>
                                    <input type="number" step="0.1" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. 75.5" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">लंबाई (cm)</label>
                                    <input type="number" value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. 175" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">ब्लड ग्रुप</label>
                                    <select value={formData.bloodGroup} onChange={(e) => handleInputChange('bloodGroup', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500">
                                        <option value="">चुनें (Optional)...</option>
                                        <option value="A+">A+</option><option value="A-">A-</option>
                                        <option value="B+">B+</option><option value="B-">B-</option>
                                        <option value="O+">O+</option><option value="O-">O-</option>
                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">बॉडी फैट प्रतिशत (अनुमानित)</label>
                                    <input type="number" value={formData.bodyFat} onChange={(e) => handleInputChange('bodyFat', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. 15" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">AI Visual Analysis के लिए फोटो (Optional)</label>
                                    <div 
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative min-h-[160px] ${
                                            formData.avatar 
                                                ? 'border-cyan-500/50 bg-cyan-500/5' 
                                                : 'border-gray-700 text-gray-500 hover:bg-gray-800/30 hover:border-cyan-500/50'
                                        }`}
                                    >
                                        <input 
                                            id="photo-upload"
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        handleInputChange('avatar', reader.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        {formData.avatar ? (
                                            <div className="relative w-full h-full flex flex-col items-center">
                                                <img src={formData.avatar} alt="Preview" className="max-h-32 rounded-lg object-cover mb-2" />
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleInputChange('avatar', '');
                                                    }}
                                                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                                                >
                                                    Remove Photo
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 mb-2" />
                                                <span className="text-sm">Click to upload or drag and drop</span>
                                                <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Medical History */}
                    {currentStep === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <HeartPulse className="w-5 h-5 text-rose-400" />
                                भाग 3: स्वास्थ्य और मेडिकल इतिहास
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300">पुरानी चोटें (Injuries)</label>
                                    <p className="text-xs text-gray-500">क्या आपको घुटने, पीठ या कंधों में कोई पुरानी चोट है?</p>
                                    <textarea value={formData.injuries} onChange={(e) => handleInputChange('injuries', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 min-h-[100px]" placeholder="यदि कोई चोट है तो यहाँ विवरण दें..."></textarea>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300">मेडिकल कंडीशंस</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['थायराइड', 'डायबिटीज', 'PCOD/PCOS', 'ब्लड प्रेशर', 'अस्थमा', 'हृदय रोग', 'कोई नहीं'].map(condition => (
                                            <label key={condition} className="flex items-center gap-2 p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50">
                                                <input type="checkbox" checked={formData.conditions.includes(condition)} onChange={() => handleConditionToggle(condition)} className="rounded border-gray-600 text-rose-500 focus:ring-rose-500 bg-gray-900" />
                                                <span className="text-sm text-gray-300">{condition}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300">एलर्जी (Allergies)</label>
                                    <input type="text" value={formData.allergies} onChange={(e) => handleInputChange('allergies', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500" placeholder="जैसे: दूध (Lactose), मूंगफली, ग्लूटेन..." />
                                </div>

                                {/* Medical Reports Upload Section */}
                                <div className="space-y-3 pt-4 border-t border-gray-800">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-rose-400" />
                                        मेडिकल रिपोर्ट्स (Medical Reports)
                                    </label>
                                    <p className="text-xs text-gray-500">पुरानी रिपोर्ट्स, ब्लड टेस्ट या डॉक्टर की पर्ची अपलोड करें।</p>
                                    
                                    <div className="flex gap-3">
                                        <label className="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-medium">
                                            <Upload className="w-4 h-4"/> Upload Files
                                            <input type="file" multiple className="hidden" onChange={handleReportUpload} accept="*/*" />
                                        </label>
                                        <label className="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-medium">
                                            <Camera className="w-4 h-4"/> Camera
                                            <input type="file" capture="environment" className="hidden" onChange={handleReportUpload} accept="image/*" />
                                        </label>
                                    </div>

                                    {/* Attached Files List */}
                                    {formData.medicalReports.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {formData.medicalReports.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                                        <span className="truncate">{file.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeReport(idx)} className="text-gray-500 hover:text-rose-400 p-1">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Lifestyle & Nutrition */}
                    {currentStep === 4 && (
                        <motion.div 
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Coffee className="w-5 h-5 text-amber-400" />
                                भाग 4: जीवनशैली और पोषण
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">डाइट का प्रकार</label>
                                    <select value={formData.dietType} onChange={(e) => handleInputChange('dietType', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="veg">शाकाहारी (Vegetarian)</option>
                                        <option value="nonveg">मांसाहारी (Non-Vegetarian)</option>
                                        <option value="egg">अंडाहारी (Eggitarian)</option>
                                        <option value="vegan">वीगन (Vegan)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">पानी का सेवन (प्रतिदिन)</label>
                                    <select value={formData.waterIntake} onChange={(e) => handleInputChange('waterIntake', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="low">1-2 लीटर</option>
                                        <option value="medium">2-3 लीटर</option>
                                        <option value="high">3-4 लीटर</option>
                                        <option value="veryhigh">4+ लीटर</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">भोजन की आवृत्ति</label>
                                    <select value={formData.mealFrequency} onChange={(e) => handleInputChange('mealFrequency', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required>
                                        <option value="">आप दिन में कितनी बार खाते हैं?</option>
                                        <option value="2">2 बार</option>
                                        <option value="3">3 बार</option>
                                        <option value="4">4 बार</option>
                                        <option value="5+">5+ बार</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">सोने का समय</label>
                                    <input type="time" value={formData.sleepTime} onChange={(e) => handleInputChange('sleepTime', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required />
                                    <p className="text-xs text-gray-500 mt-1">यह 'Chronos Mirror' बोट के लिए जरूरी है।</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">सप्लीमेंट का इतिहास</label>
                                    <input type="text" value={formData.supplements} onChange={(e) => handleInputChange('supplements', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" placeholder="क्या आप पहले से कोई प्रोटीन या मल्टीविटामिन ले रहे हैं?" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Fitness Goals */}
                    {currentStep === 5 && (
                        <motion.div 
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
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
                                            <label key={goal.id} className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${formData.primaryGoal === goal.id ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:bg-gray-800/50'}`}>
                                                <input type="radio" name="primaryGoal" value={goal.id} checked={formData.primaryGoal === goal.id} onChange={(e) => handleInputChange('primaryGoal', e.target.value)} className="sr-only" required />
                                                <span className="font-medium text-gray-200">{goal.label}</span>
                                                <span className="text-xs text-gray-500 mt-1">{goal.desc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">अनुभव का स्तर</label>
                                    <select value={formData.experienceLevel} onChange={(e) => handleInputChange('experienceLevel', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500" required>
                                        <option value="">चुनें...</option>
                                        <option value="beginner">बिगनर (Beginner)</option>
                                        <option value="intermediate">इंटरमीडिएट (Intermediate)</option>
                                        <option value="advanced">एडवांस (Advanced)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">समय की प्रतिबद्धता</label>
                                    <select value={formData.timeCommitment} onChange={(e) => handleInputChange('timeCommitment', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500" required>
                                        <option value="">सप्ताह में कितने दिन?</option>
                                        <option value="3">3 दिन / सप्ताह</option>
                                        <option value="4">4 दिन / सप्ताह</option>
                                        <option value="5">5 दिन / सप्ताह</option>
                                        <option value="6">6 दिन / सप्ताह</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 6: Neural OS Insights */}
                    {currentStep === 6 && (
                        <motion.div 
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Brain className="w-5 h-5 text-purple-400" />
                                भाग 6: 'Neural OS' के लिए विशेष डेटा
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-300 flex justify-between">
                                        <span>तनाव का स्तर (Stress Level)</span>
                                        <span className="text-purple-400">1 से 10 के पैमाने पर: {formData.stressLevel}</span>
                                    </label>
                                    <input type="range" min="1" max="10" value={formData.stressLevel} onChange={(e) => handleInputChange('stressLevel', e.target.value)} className="w-full accent-purple-500" />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>बिल्कुल नहीं (1)</span>
                                        <span>सामान्य (5)</span>
                                        <span>बहुत अधिक (10)</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">हाई स्ट्रेस में डाइट अलग तरह से काम करती है।</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">नींद की गुणवत्ता</label>
                                    <select value={formData.sleepQuality} onChange={(e) => handleInputChange('sleepQuality', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" required>
                                        <option value="">आप रोजाना कितने घंटे गहरी नींद लेते हैं?</option>
                                        <option value="<5">5 घंटे से कम</option>
                                        <option value="5-6">5-6 घंटे</option>
                                        <option value="7-8">7-8 घंटे (आदर्श)</option>
                                        <option value=">8">8 घंटे से अधिक</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">मेटाबॉलिक रेट फैक्टर्स</label>
                                    <select value={formData.metabolicRate} onChange={(e) => handleInputChange('metabolicRate', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500" required>
                                        <option value="">पसीना आने की प्रवृत्ति</option>
                                        <option value="high">बहुत जल्दी पसीना आता है</option>
                                        <option value="normal">सामान्य</option>
                                        <option value="low">बहुत कम पसीना आता है</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 7: Payment & Package */}
                    {currentStep === 7 && (
                        <motion.div 
                            key="step7"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                                <Wallet className="w-5 h-5 text-amber-500" />
                                भाग 7: पैकेज और भुगतान (Payment)
                            </h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">जिम पैकेज चुनें</label>
                                        <select value={formData.packageId} onChange={(e) => handleInputChange('packageId', e.target.value)} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500" required>
                                            <option value="">-- Select Gym Plan --</option>
                                            {packages.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-xl border border-white/5">
                                    <input type="checkbox" id="regFee" checked={formData.includeRegFee} onChange={e => handleInputChange('includeRegFee', e.target.checked)} className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
                                    <label htmlFor="regFee" className="text-sm font-bold text-gray-300 cursor-pointer">Include Registration Fee (₹1000)</label>
                                </div>

                                {/* Inventory / POS */}
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-cyan-400" /> अतिरिक्त आइटम (Accessories & Supplements)
                                    </label>
                                    
                                    {/* Manual Item Entry */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-gray-900/30 p-3 rounded-xl border border-white/5">
                                        <input 
                                            type="text" 
                                            placeholder="Item Name" 
                                            value={manualItem.name} 
                                            onChange={e => setManualItem({...manualItem, name: e.target.value})} 
                                            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 sm:col-span-2"
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Price" 
                                            value={manualItem.price} 
                                            onChange={e => setManualItem({...manualItem, price: e.target.value})} 
                                            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                        />
                                        <select 
                                            value={manualItem.category} 
                                            onChange={e => setManualItem({...manualItem, category: e.target.value})} 
                                            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="Accessories">Accessories</option>
                                            <option value="Supplements">Supplements</option>
                                            <option value="Apparel">Apparel</option>
                                        </select>
                                        <button 
                                            type="button" 
                                            onClick={addManualItem} 
                                            className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider sm:col-span-4"
                                        >
                                            + Add Manual Item
                                        </button>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {inventory.map(item => (
                                            <button 
                                                key={item.id} 
                                                type="button" 
                                                onClick={() => addToCart(item)} 
                                                className="bg-gray-800/50 text-xs px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-gray-700 transition-colors text-white border border-white/5 flex items-center gap-2"
                                            >
                                                {item.category === 'Supplements' ? <Apple className="w-3 h-3 text-green-400"/> : <ShoppingBag className="w-3 h-3 text-cyan-400"/>}
                                                {item.name} <span className="text-gray-500">₹{item.price}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {formData.cart.length > 0 && (
                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                                            {formData.cart.map(c => (
                                                <div key={c.itemId} className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-300">{c.name} <span className="text-gray-500">({c.type})</span> x{c.qty}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-amber-500 font-mono">₹{c.price * c.qty}</span>
                                                        <div className="flex items-center gap-1">
                                                            <button type="button" onClick={() => updateCartQty(c.itemId, -1)} className="p-1 bg-gray-800 rounded hover:bg-gray-700"><Minus className="w-3 h-3"/></button>
                                                            <button type="button" onClick={() => updateCartQty(c.itemId, 1)} className="p-1 bg-gray-800 rounded hover:bg-gray-700"><Plus className="w-3 h-3"/></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-900/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Gym Package</span>
                                        <span className="text-white">₹{pkgPrice}</span>
                                    </div>
                                    {registrationFee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Registration Fee</span>
                                            <span className="text-white">₹{registrationFee}</span>
                                        </div>
                                    )}
                                    
                                    {/* Breakdown of Cart Categories */}
                                    {cartCategories['Accessories'] > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-cyan-400">Accessories</span>
                                            <span className="text-white">₹{cartCategories['Accessories']}</span>
                                        </div>
                                    )}
                                    {cartCategories['Supplements'] > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-400">Supplements</span>
                                            <span className="text-white">₹{cartCategories['Supplements']}</span>
                                        </div>
                                    )}
                                    {cartCategories['Apparel'] > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-purple-400">Apparel</span>
                                            <span className="text-white">₹{cartCategories['Apparel']}</span>
                                        </div>
                                    )}
                                    {cartCategories['Other'] > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Other Items</span>
                                            <span className="text-white">₹{cartCategories['Other']}</span>
                                        </div>
                                    )}

                                    <div className="h-px bg-gray-800 my-1"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-2xl font-black text-white italic">₹{totalAmount}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Payment Method (भुगतान विधि)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['UPI', 'Google Pay', 'Cash', 'Card (NFC)'] as const).map(method => (
                                            <button 
                                                type="button" 
                                                key={method} 
                                                onClick={() => handleInputChange('paymentMethod', method)} 
                                                className={`p-4 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all ${formData.paymentMethod === method ? 'bg-white text-black border-white' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                            >
                                                {method === 'UPI' ? <Fingerprint className="w-5 h-5"/> : method === 'Google Pay' ? <Globe className="w-5 h-5"/> : method === 'Card (NFC)' ? <Nfc className="w-5 h-5"/> : <Wallet className="w-5 h-5"/>}
                                                <span className="text-[10px] font-bold uppercase text-center leading-tight">{method}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(formData.paymentMethod === 'UPI' || formData.paymentMethod === 'Google Pay') && (
                                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {formData.paymentMethod === 'Google Pay' ? 'Google Pay Business' : 'Secure UPI Gateway'}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-white p-4 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] border-[12px] border-gray-950 relative group">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${formData.paymentMethod === 'Google Pay' ? (localStorage.getItem('google_pay_upi') || GYM_INFO.upiIds.gpay1) : GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${totalAmount}&cu=INR`}
                                                alt="UPI QR" 
                                                className="w-40 h-40 object-contain mix-blend-multiply transition-transform group-hover:scale-105" 
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-3xl">
                                                <p className="text-black font-black text-[10px] uppercase tracking-tighter">Scan to Pay</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 w-full">
                                            <a 
                                                href={`upi://pay?pa=${formData.paymentMethod === 'Google Pay' ? (localStorage.getItem('google_pay_upi') || GYM_INFO.upiIds.gpay1) : GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${totalAmount}&cu=INR`}
                                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition-all active:scale-95"
                                            >
                                                <Smartphone className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase">G-Pay</span>
                                            </a>
                                            {formData.paymentMethod !== 'Google Pay' && (
                                                <a 
                                                    href={`upi://pay?pa=${GYM_INFO.upiIds.gpay2}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${totalAmount}&cu=INR`}
                                                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl transition-all active:scale-95"
                                                >
                                                    <Smartphone className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase">PhonePe</span>
                                                </a>
                                            )}
                                        </div>

                                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                                            Merchant ID: <span className="text-white">{formData.paymentMethod === 'Google Pay' ? (localStorage.getItem('google_pay_upi') || GYM_INFO.upiIds.gpay1) : GYM_INFO.upiIds.gpay1}</span>
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 cursor-pointer" onClick={() => handleInputChange('isPaid', !formData.isPaid)}>
                                    <input type="checkbox" checked={formData.isPaid} onChange={(e) => handleInputChange('isPaid', e.target.checked)} className="w-5 h-5 accent-amber-500 rounded cursor-pointer"/>
                                    <label className="ml-3 text-sm font-medium text-gray-300 cursor-pointer select-none">Mark as Paid (भुगतान हो गया)</label>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                        </motion.button>

                        {currentStep < 7 ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                अगला
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={isSubmitting || !formData.packageId}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Complete Admission
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ScientificAdmissionForm;
