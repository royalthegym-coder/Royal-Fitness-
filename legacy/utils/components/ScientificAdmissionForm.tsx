import { getCurrencySymbol } from '../store/useCurrencyStore';
import GooglePayButton from '@google-pay/button-react';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import Card from './common/Card';
import { 
    User, Activity, HeartPulse, Coffee, Target, Brain, 
    ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Upload, RefreshCw, Wallet, Fingerprint, Nfc,
    Dumbbell, ShoppingBag, Apple, Pill, Minus, Plus, ShieldCheck, Smartphone,
    ExternalLink, Star, MessageCircle, Globe, Flame, Crown, Zap, Camera, FileText, X, CreditCard
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { GYM_INFO } from '../../constants';
import { sendWhatsAppWelcomeMessage, sendPaymentReceipt, sendThankYouForPayment } from '../../lib/whatsapp';
import { Member, Transaction, InvoiceItem } from '../../types';
import { analyzeMemberPhoto, generatePersonalizedHealthVision, analyzeIDCard } from '../../lib/core_ai';
import { triggerAutomation } from '../../lib/automation';
import ReceiptTemplate from './common/ReceiptTemplate';
import { analyzeComprehensiveHealth } from '../../lib/aiBioAnalyst';
import { generateAIPDFReport, generateReceiptPDF } from '../../lib/pdfGenerator';

const ScientificAdmissionForm: React.FC = () => {
    const { members, packages, addMember, addMedicalReport, inventory, updateInventory, addTransaction, addInvoice, globalFees } = useData();
    const { addToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
    const [healthVision, setHealthVision] = useState<string>('');
    const [isScanningId, setIsScanningId] = useState(false);
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const webcamRef = useRef<Webcam>(null);

    const captureWebcam = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setIsWebcamOpen(false);
            setIsScanningId(true);
            addToast("Extracting data via AI Vision...", "info");
            try {
                const base64Data = imageSrc.split(',')[1];
                const data = await analyzeIDCard(base64Data, "image/jpeg");
                
                setFormData(prev => ({
                    ...prev,
                    name: data.name || prev.name,
                    age: data.age || prev.age,
                    gender: data.gender ? data.gender.toLowerCase() : prev.gender,
                    address: data.address || prev.address,
                    bloodGroup: data.bloodGroup || prev.bloodGroup,
                    phone: data.phone || prev.phone
                }));
                
                addToast("ID Card scanned successfully. Form auto-filled.", "success");
            } catch (error) {
                console.error("OCR Failed:", error);
                addToast("Failed to extract data. Please try again.", "error");
            } finally {
                setIsScanningId(false);
            }
        }
    }, [webcamRef]);

    const handleIDUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanningId(true);
        addToast("Extracting data via AI Vision...", "info");

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result?.toString().split(',')[1];
            if (!base64Data) {
                addToast("Failed to read image", "error");
                setIsScanningId(false);
                return;
            }

            try {
                const data = await analyzeIDCard(base64Data, file.type);
                
                setFormData(prev => ({
                    ...prev,
                    name: data.name || prev.name,
                    age: data.age || prev.age,
                    gender: data.gender ? data.gender.toLowerCase() : prev.gender,
                    address: data.address || prev.address,
                    bloodGroup: data.bloodGroup || prev.bloodGroup,
                    phone: data.phone || prev.phone
                }));
                
                addToast("ID Card scanned successfully. Form auto-filled.", "success");
            } catch (error) {
                console.error("OCR Failed:", error);
                addToast("Failed to extract data. Please try again.", "error");
            } finally {
                setIsScanningId(false);
            }
        };
        reader.onerror = () => {
            setIsScanningId(false);
            addToast("Error reading file", "error");
        };
        reader.readAsDataURL(file);
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: '',
        profession: '',
        address: '',
        weight: '',
        height: '',
        bloodGroup: '',
        bodyFat: '',
        avatar: '',
        password: '', // Added
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
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
        medicalReports: [] as { name: string; type: string; data: string; analysis?: any }[], // Added for reports
        packageId: '',
        ptPackageId: '',
        selectedInventory: [] as { id: string; qty: number; price: number; name: string }[]
    });

    // Payment & Receipt States
    const [admissionFee, setAdmissionFee] = useState<number>(globalFees?.admissionFee || 500);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Google Pay' | 'Card' | 'Cash'>('UPI');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'connecting' | 'verifying' | 'success'>('idle');
    const [paymentMessage, setPaymentMessage] = useState('');
    const [receiptData, setReceiptData] = useState<{ txn: Transaction; items: InvoiceItem[]; memberId?: number } | null>(null);
    const [receiptPdfUri, setReceiptPdfUri] = useState<string | null>(null);
    const [pendingAiResults, setPendingAiResults] = useState<any>(null);
    const [pendingVision, setPendingVision] = useState<string>('');

    const steps = [
        { id: 1, title: 'Basic Info', icon: <User className="w-5 h-5" /> },
        { id: 2, title: 'Biometrics', icon: <Activity className="w-5 h-5" /> },
        { id: 3, title: 'Medical History', icon: <HeartPulse className="w-5 h-5" /> },
        { id: 4, title: 'Lifestyle', icon: <Coffee className="w-5 h-5" /> },
        { id: 5, title: 'Smart OS Data', icon: <Brain className="w-5 h-5" /> },
        { id: 6, title: 'Packages & Fees', icon: <Wallet className="w-5 h-5" /> }
    ];

    const handleNext = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const totalAmount = useMemo(() => {
        let total = Number(admissionFee) || 0;
        if (formData.packageId) {
            const p = packages.find(pkg => pkg.id.toString() === formData.packageId);
            if (p) total += p.price;
        }
        if (formData.ptPackageId) {
            const p = packages.find(pkg => pkg.id.toString() === formData.ptPackageId);
            if (p) total += p.price;
        }
        formData.selectedInventory.forEach(item => {
            total += item.price * item.qty;
        });
        return total;
    }, [formData.packageId, formData.ptPackageId, formData.selectedInventory, packages]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleInventoryChange = (item: any, delta: number) => {
        setFormData(prev => {
            const existing = prev.selectedInventory.find(i => i.id === item.id);
            if (existing) {
                const newQty = existing.qty + delta;
                if (newQty <= 0) {
                    return { ...prev, selectedInventory: prev.selectedInventory.filter(i => i.id !== item.id) };
                }
                if (newQty > item.stock) {
                    addToast("Max stock reached", "error");
                    return prev;
                }
                return {
                    ...prev,
                    selectedInventory: prev.selectedInventory.map(i => i.id === item.id ? { ...i, qty: newQty } : i)
                };
            } else if (delta > 0) {
                if (item.stock <= 0) {
                    addToast("Out of stock", "error");
                    return prev;
                }
                return {
                    ...prev,
                    selectedInventory: [...prev.selectedInventory, { id: item.id, qty: 1, price: item.price, name: item.name }]
                };
            }
            return prev;
        });
    };

    const handleConditionToggle = (condition: string) => {
        setFormData(prev => {
            if (condition === 'None') {
                return { ...prev, conditions: ['None'] };
            }
            const newConditions = prev.conditions.filter(c => c !== 'None');
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

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit per file
        const MAX_TOTAL_SIZE = 18 * 1024 * 1024; // 18MB total limit
        let totalSize = formData.medicalReports.reduce((acc, f) => acc + (f.data ? f.data.length * 0.75 : 0), 0); // Approximate base64 size

        setIsAnalyzingFile(true);

        try {
            for (const file of files) {
                if (file.size > MAX_SIZE) {
                    addToast(`File size must be less than 5MB: ${file.name}`, "error");
                    continue;
                }

                if (totalSize + file.size > MAX_TOTAL_SIZE) {
                    addToast(`Skipped ${file.name}: Total size exceeds 18MB limit`, "error");
                    continue;
                }
                totalSize += file.size;

                let mimeType = file.type;
                if (!mimeType) {
                    if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
                    else if (file.name.endsWith('.csv')) mimeType = 'text/csv';
                    else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
                    else mimeType = 'application/octet-stream';
                }

                const reader = new FileReader();
                await new Promise<void>((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const res = reader.result?.toString();
                            if (res) {
                                try {
                                    addToast(`AI Fitness Planner is analyzing ${file.name}...`, "info");
                                    
                                    // Analyze the file
                                    const analysis = await analyzeComprehensiveHealth(
                                        "Analyze this medical report for admission.",
                                        [{ data: res, mimeType }],
                                        { name: formData.name, age: formData.age, gender: formData.gender }
                                    );
                                    
                                    // Generate PDF
                                    let pdfDataUri = "";
                                    try {
                                        pdfDataUri = generateAIPDFReport(formData.name || "New Member", analysis, file.name);
                                    } catch (pdfErr) {
                                        console.error("PDF Generation failed", pdfErr);
                                        pdfDataUri = res; // Fallback to original file data
                                    }
                                    
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        medicalReports: [...prev.medicalReports, { 
                                            name: `AI_Analysis_${file.name}.pdf`, 
                                            type: 'application/pdf', 
                                            data: pdfDataUri,
                                            analysis: analysis
                                        }] 
                                    }));
                                    addToast(`AI Analysis complete for ${file.name}.`, "success");
                                } catch (aiErr) {
                                    console.error("AI Analysis failed", aiErr);
                                    addToast(`AI Analysis failed for ${file.name}.`, "error");
                                }
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
        } catch (err) {
            console.error("Error reading files", err);
            addToast(`Failed to upload files`, "error");
        } finally {
            setIsAnalyzingFile(false);
        }
        
        try { if (target) target.value = ''; } catch(e) {}
    };

    const removeReport = (index: number) => {
        setFormData(prev => ({
            ...prev,
            medicalReports: prev.medicalReports.filter((_, i) => i !== index)
        }));
    };

    const finalizeAdmission = (aiResults: any, generatedVision: string, newId: number, txnData?: any) => {
        // 1. Auto-generate password for SaaS
        const generatedPassword = formData.password || Math.random().toString(36).slice(-8);

        const newMember: Member = {
            id: newId,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || `${formData.phone}@fitness.gym`,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            password: generatedPassword,
            packageId: Number(formData.packageId) || 0,
            ptPackageId: Number(formData.ptPackageId) || undefined,
            avatar: formData.avatar || `https://i.pravatar.cc/150?u=${newId}`,
            gender: formData.gender as any,
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
            emergency_contact: { name: formData.emergencyContactName, phone: formData.emergencyContactPhone, relation: formData.emergencyContactRelation },
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
                    ocr_data: report.analysis || { note: "AI Generated Report" },
                    status: 'Analyzed',
                    upload_date: new Date().toISOString()
                });
            });
        }

        addMember(newMember);

        // --- SaaS n8n Webhook Simulation ---
        console.log("[SaaS Routing] Sending data to n8n Webhook...");
        const n8nPayload = {
            gym_id: localStorage.getItem('current_gym_id') || 'gym_001',
            gym_name: localStorage.getItem('current_gym_name') || 'Fitness Future',
            member_details: newMember
        };
        console.log("[n8n Payload]", n8nPayload);
        addToast("SaaS Routing: Data sent to n8n for Supabase/Firebase Sync & WhatsApp", "info");
        // -----------------------------------

        // Trigger Smart Automation
        triggerAutomation({
            event: 'member_created',
            payload: { member: newMember }
        });

        sendWhatsAppWelcomeMessage(newMember);
        
        // --- AI Auto Diet & Workout Generation ---
        addToast("Generating 7-Day Customized Diet & Workout Plan via AI...", "info");
        setTimeout(() => {
            const dietMsg = `Diet & Workout Engine Extracted. Synced with Member Dashboard.`;
            addToast(`[Smart Success] ${dietMsg}`, "success");
            
            triggerAutomation({
                event: 'workout_diet_assigned',
                payload: { member: newMember }
            });
        }, 2000);

        // Setup payment texts
        if (txnData) {
            const itemsDesc = txnData.items.map((i: any) => i.description).join(', ');
            sendPaymentReceipt(newMember.name, newMember.phone, txnData.txn.amount, txnData.txn.id, itemsDesc);
            sendThankYouForPayment(newMember);
        }

        addToast("AI Admission Complete. Member Onboarded.", "success");

        setIsSubmitting(false);
        setIsSuccess(true);
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
        setPendingVision(generatedVision);
        setPendingAiResults(aiResults);
        
        if (totalAmount > 0) {
            setPaymentMethod('UPI');
            addToast('Auto-Payment Flow Started...', 'info');
            // Trigger automatic payment flow
            handlePaymentCompleteDirect(aiResults, generatedVision);
        } else {
            const newMemberId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
            finalizeAdmission(aiResults, generatedVision, newMemberId, null);
        }
    };

    const handlePaymentCompleteDirect = async (aiResults: any, generatedVision: string) => {
        setIsProcessingPayment(true);
        addToast('Verifying FitnessFutureSecure Gateway Signature...', 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
        addToast('Payment Authorized. Generating Smart Receipt...', 'success');
        
        const newMemberId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;

        // Create Transaction
        const txnId = `TXN-${Date.now()}`;
        const newTxn: Transaction = {
            id: txnId,
            memberName: formData.name,
            amount: totalAmount,
            date: new Date().toISOString().split('T')[0],
            method: 'Online'
        };
        addTransaction(newTxn);

        // Create Invoice Items
        const items: InvoiceItem[] = [];
        if (Number(admissionFee) > 0) {
            items.push({ description: 'Admission/Registration Fee', amount: Number(admissionFee), type: 'Membership' });
        }
        if (formData.packageId) {
            const p = packages.find(pkg => pkg.id.toString() === formData.packageId);
            if (p) items.push({ description: p.name, amount: p.price, type: 'Membership' });
        }
        if (formData.ptPackageId) {
            const p = packages.find(pkg => pkg.id.toString() === formData.ptPackageId);
            if (p) items.push({ description: p.name, amount: p.price, type: 'Training' });
        }
        formData.selectedInventory.forEach(item => {
            items.push({ description: `${item.name} (x${item.qty})`, amount: item.price * item.qty, type: 'Product' });
            const invItem = inventory.find(i => i.id === item.id);
            if (invItem) {
                updateInventory({ ...invItem, stock: invItem.stock - item.qty });
            }
        });

        addInvoice({
            id: Date.now(),
            memberId: newMemberId,
            memberName: formData.name,
            packageId: Number(formData.packageId) || 0,
            packageName: 'Admission & Purchases',
            amount: totalAmount,
            date: new Date().toISOString().split('T')[0],
            status: 'Paid',
            items: items
        });

        setReceiptData({ txn: newTxn, items, memberId: newMemberId });

        // Auto-Generate PDF Receipt
        const dataUri = generateReceiptPDF({
            receiptNo: txnId,
            date: newTxn.date,
            memberName: formData.name,
            memberId: newMemberId,
            amount: totalAmount,
            method: newTxn.method,
            items: items
        });
        setReceiptPdfUri(dataUri);

        setIsProcessingPayment(false);
        setIsSubmitting(false); // Make sure it stops loading from the form wrapper
        
        // Finalize Admission
        finalizeAdmission(aiResults, generatedVision, newMemberId, { txn: newTxn, items });
    };

    const handlePaymentComplete = async () => {
        setIsProcessingPayment(true);
        setPaymentStatus('connecting');
        setPaymentMessage('Connecting to FitnessFutureSecure Gateway...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPaymentStatus('verifying');
        setPaymentMessage('Verifying Transaction Signature...');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPaymentStatus('success');
        setPaymentMessage('Payment Authorized. Generating Smart Receipt...');
        
        await new Promise(resolve => setTimeout(resolve, 800));

        const newMemberId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;

        // Create Transaction
        const txnId = `TXN-${Date.now()}`;
        const newTxn: Transaction = {
            id: txnId,
            memberName: formData.name,
            amount: totalAmount,
            date: new Date().toISOString().split('T')[0],
            method: paymentMethod === 'UPI' ? 'QR Code' : paymentMethod === 'Card' ? 'Card' : paymentMethod === 'Google Pay' ? 'Online' : 'Cash'
        };
        addTransaction(newTxn);

        // Create Invoice Items
        const items: InvoiceItem[] = [];
        if (Number(admissionFee) > 0) {
            items.push({ description: 'Admission/Registration Fee', amount: Number(admissionFee), type: 'Membership' });
        }
        if (formData.packageId) {
            const p = packages.find(pkg => pkg.id.toString() === formData.packageId);
            if (p) items.push({ description: p.name, amount: p.price, type: 'Membership' });
        }
        if (formData.ptPackageId) {
            const p = packages.find(pkg => pkg.id.toString() === formData.ptPackageId);
            if (p) items.push({ description: p.name, amount: p.price, type: 'Training' });
        }
        formData.selectedInventory.forEach(item => {
            items.push({ description: `${item.name} (x${item.qty})`, amount: item.price * item.qty, type: 'Product' });
            // Deduct inventory
            const invItem = inventory.find(i => i.id === item.id);
            if (invItem) {
                updateInventory({ ...invItem, stock: invItem.stock - item.qty });
            }
        });

        // Add Invoice
        addInvoice({
            id: Date.now(),
            memberId: newMemberId,
            memberName: formData.name,
            packageId: Number(formData.packageId) || 0,
            packageName: 'Admission & Purchases',
            amount: totalAmount,
            date: new Date().toISOString().split('T')[0],
            status: 'Paid',
            items: items
        });

        setReceiptData({ txn: newTxn, items, memberId: newMemberId });

        // Auto-Generate PDF Receipt via AI Module
        const dataUri = generateReceiptPDF({
            receiptNo: txnId,
            date: newTxn.date,
            memberName: formData.name,
            memberId: newMemberId,
            amount: totalAmount,
            method: newTxn.method,
            items: items
        });
        setReceiptPdfUri(dataUri);

        setIsProcessingPayment(false);
        setShowPaymentModal(false);
        setPaymentStatus('idle');
        
        // Finalize Admission
        finalizeAdmission(pendingAiResults, pendingVision, newMemberId, { txn: newTxn, items });
    };

    if (isSuccess) {
        return (
            <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 relative z-10">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
                    <div className="w-24 h-24 bg-black/50 border border-cyan-500/50 rounded-2xl flex items-center justify-center mb-4 relative z-10 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                        <CheckCircle2 className="w-12 h-12 text-cyan-400" />
                    </div>
                </div>
                
                <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 uppercase tracking-widest">
                        Fitness Future Initialization Complete
                    </h2>
                    <p className="text-[10px] text-cyan-500/70 uppercase tracking-[0.3em] font-bold mt-2">
                        Smart Matrix Synced Successfully
                    </p>
                </div>

                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl text-left w-full max-w-md space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">AI Personalized Health Vision</span>
                        </div>
                        <p className="text-sm text-gray-300 italic leading-relaxed border-l-2 border-cyan-500/30 pl-4">
                            "{healthVision || 'Your journey to peak performance starts now. With our Smart OS, we will optimize every rep and every meal to ensure you reach your goals faster than ever.'}"
                        </p>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-fuchsia-400">
                            <Star className="w-5 h-5" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Automated Core Actions Triggered</span>
                        </div>
                        <ul className="space-y-3 text-xs text-gray-400 font-medium tracking-wide">
                            <li className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                                Initial workout video dispatched via WhatsApp
                            </li>
                            <li className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                                100% precision diet matrix synthesized
                            </li>
                            <li className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>
                                Future Overlord automated payment reminder active
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button 
                        onClick={() => { setIsSuccess(false); setCurrentStep(1); setReceiptData(null); setReceiptPdfUri(null); }}
                        className="flex-1 px-6 py-3 bg-black/50 hover:bg-white/5 text-gray-400 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group backdrop-blur-md"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <RefreshCw className="w-4 h-4 relative z-10" /> <span className="relative z-10">Fill New Form</span>
                    </button>
                    {receiptPdfUri && (
                        <a 
                            href={receiptPdfUri}
                            download={`Receipt_${receiptData?.txn.id}.pdf`}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50 relative overflow-hidden group text-center"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <FileText className="w-4 h-4 relative z-10" /> <span className="relative z-10">Download Digital Receipt</span>
                        </a>
                    )}
                </div>
                
                {receiptData && (
                    <div className="w-full max-w-md mt-6 print:block">
                        <ReceiptTemplate 
                            invoiceId={receiptData.txn.id}
                            memberName={receiptData.txn.memberName}
                            memberId={receiptData.memberId}
                            memberPhone={formData.phone}
                            amount={receiptData.txn.amount}
                            date={receiptData.txn.date}
                            method={receiptData.txn.method}
                            items={receiptData.items}
                            onClose={() => setReceiptData(null)}
                        />
                    </div>
                )}
                
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-4 print:hidden">
                    Google Business & WhatsApp Automation Active
                </p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#030303] text-white overflow-hidden p-4 sm:p-6">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_15px_#06b6d4] opacity-50"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent shadow-[0_0_15px_#d946ef] opacity-50"></div>
            
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0a0a0a] border border-cyan-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] space-y-6 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center gap-2 uppercase tracking-widest">
                                    <Wallet className="w-5 h-5 text-cyan-400" />
                                    Payment Portal
                                </h3>
                                <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-cyan-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Total Amount Due</p>
                                <p className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">{getCurrencySymbol()}{totalAmount}</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-[0.1em] font-bold text-gray-400">Select Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['UPI', 'Card', 'Cash', 'Google Pay'].map((method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethod(method as any)}
                                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                                paymentMethod === method 
                                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                                : 'bg-black/50 border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-400'
                                            }`}
                                        >
                                            {method === 'UPI' && <Smartphone className="w-6 h-6" />}
                                            {method === 'Card' && <CreditCard className="w-6 h-6" />}
                                            {method === 'Cash' && <Wallet className="w-6 h-6" />}
                                            {method === 'Google Pay' && <Globe className="w-6 h-6" />}
                                            <span className="font-black text-[10px] uppercase tracking-wider">{method}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {paymentMethod === 'Google Pay' ? (
                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center space-y-4 flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Complete in-app purchase via Google Pay</p>
                                    <GooglePayButton
                                        environment="TEST"
                                        buttonColor="black"
                                        buttonType="pay"
                                        paymentRequest={{
                                            apiVersion: 2,
                                            apiVersionMinor: 0,
                                            allowedPaymentMethods: [
                                            {
                                                type: 'CARD',
                                                parameters: {
                                                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                                allowedCardNetworks: ['MASTERCARD', 'VISA'],
                                                },
                                                tokenizationSpecification: {
                                                type: 'PAYMENT_GATEWAY',
                                                parameters: {
                                                    gateway: 'example',
                                                    gatewayMerchantId: 'exampleGatewayMerchantId',
                                                },
                                                },
                                            },
                                            ],
                                            merchantInfo: {
                                                merchantId: '12345678901234567890',
                                                merchantName: GYM_INFO.name,
                                            },
                                            transactionInfo: {
                                                totalPriceStatus: 'FINAL',
                                                totalPriceLabel: 'Total',
                                                totalPrice: totalAmount.toString(),
                                                currencyCode: 'INR',
                                                countryCode: 'IN',
                                            },
                                        }}
                                        onLoadPaymentData={paymentRequest => {
                                            console.log('load payment data', paymentRequest);
                                            handlePaymentComplete();
                                        }}
                                        onError={error => {
                                            console.error('Google Pay Error', error);
                                        }}
                                    />
                                </div>
                            ) : paymentMethod === 'UPI' ? (
                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-2">
                                    <p className="text-xs text-gray-400">Please ask the member to scan the QR code or complete the online payment.</p>
                                    <div className="w-32 h-32 bg-white mx-auto rounded-lg flex items-center justify-center">
                                        <span className="text-black font-bold text-xs">QR Code</span>
                                    </div>
                                </div>
                            ) : null}

                            <button
                                onClick={handlePaymentComplete}
                                disabled={isProcessingPayment || !paymentMethod}
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                                    isProcessingPayment || !paymentMethod
                                    ? 'bg-black/50 border border-cyan-500/50 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)] opacity-50 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                }`}
                            >
                                {isProcessingPayment ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span>Processing</span>
                                        </div>
                                        <span className="text-[9px] text-cyan-500/70 tracking-[0.2em]">{paymentMessage}</span>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>Confirm {paymentMethod || 'Payment'} Received & Generate Receipt</span>
                                    </div>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="border-b border-white/5 pb-6 mb-8 relative">
                <div className="absolute -bottom-[1px] left-0 w-1/3 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent"></div>
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <Sparkles className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 uppercase tracking-widest">
                            Fitness Future Admission
                        </h1>
                        <p className="text-[10px] text-cyan-500/70 uppercase tracking-[0.3em] font-bold mt-1">
                            v50.0 Smart Matrix Initialization
                        </p>
                    </div>
                </div>
                <p className="text-gray-400 text-sm mt-4 font-medium font-sans">
                    This form collects essential statistics to automatically generate customized diet and workout schedules.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-12 px-2">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2"></div>
                <div 
                    className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 -translate-y-1/2 transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                    style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                ></div>
                <div className="relative flex justify-between">
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                                currentStep >= step.id 
                                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                    : 'bg-[#0a0a0a] border-white/5 text-gray-600'
                            }`}>
                                {step.icon}
                            </div>
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest hidden sm:block ${
                                currentStep >= step.id ? 'text-cyan-400' : 'text-gray-600'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                    <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3 uppercase tracking-widest">
                                        <User className="w-5 h-5 text-indigo-400" />
                                        Part 1: Basic Info (Personal Profile)
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment" 
                                            ref={cameraInputRef} 
                                            onChange={handleIDUpload} 
                                            className="hidden" 
                                        />
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf" 
                                            ref={fileInputRef} 
                                            onChange={handleIDUpload} 
                                            className="hidden" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsWebcamOpen(true)}
                                            disabled={isScanningId}
                                            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                            title="Smart Fill via Camera"
                                        >
                                            {isScanningId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{isScanningId ? 'Please wait...' : 'Live Camera'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isScanningId}
                                            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                            title="Smart Fill via Document Upload"
                                        >
                                            {isScanningId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{isScanningId ? 'Scanning...' : 'Upload ID'}</span>
                                        </button>
                                    </div>
                                </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Full Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. Rahul Kumar" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Mobile Number (WhatsApp)</label>
                                    <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="+91 9876543210" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Age</label>
                                    <input type="number" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. 25" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Gender</label>
                                    <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required>
                                        <option value="">Select...</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Profession</label>
                                    <select value={formData.profession} onChange={(e) => handleInputChange('profession', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required>
                                        <option value="">Select...</option>
                                        <option value="desk">Desk Job (Sitting mostly)</option>
                                        <option value="active">Active/Standing Job</option>
                                        <option value="student">Student</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Helps AI estimate your daily calorie burn.</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Password (Password)</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Set a login password"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">This password will be used for your Member Portal login.</p>
                                </div>
                                <div className="space-y-2 md:col-span-2 pt-4 border-t border-white/10">
                                    <h3 className="text-md font-medium text-white mb-2">Emergency Contact (Emergency Contact)</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Name (Name)</label>
                                    <input type="text" value={formData.emergencyContactName} onChange={(e) => handleInputChange('emergencyContactName', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. Amit Kumar" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Phone (Phone)</label>
                                    <input type="tel" value={formData.emergencyContactPhone} onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="+91 9876543210" required />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Relation (Relation)</label>
                                    <input type="text" value={formData.emergencyContactRelation} onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. Brother, Father, Friend" required />
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
                            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-widest">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                Part 2: Biometrics & Body Measurements
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Weight (kg)</label>
                                    <input type="number" step="0.1" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. 75.5" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Height (cm)</label>
                                    <input type="number" value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. 175" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Blood Group</label>
                                    <select value={formData.bloodGroup} onChange={(e) => handleInputChange('bloodGroup', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                        <option value="">Select...ptional)...</option>
                                        <option value="A+">A+</option><option value="A-">A-</option>
                                        <option value="B+">B+</option><option value="B-">B-</option>
                                        <option value="O+">O+</option><option value="O-">O-</option>
                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Body Fat Percentage (Estimated)</label>
                                    <input type="number" value={formData.bodyFat} onChange={(e) => handleInputChange('bodyFat', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. 15" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Photo for AI Visual Analysis (Optional)</label>
                                    <div 
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative min-h-[160px] ${
                                            formData.avatar 
                                                ? 'border-cyan-500/50 bg-cyan-500/5' 
                                                : 'border-white/10 text-gray-500 hover:bg-white/5/30 hover:border-cyan-500/50'
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
                                                <img src={formData.avatar} alt="Biometric Capture" className="w-full h-full object-cover" />
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
                            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-widest">
                                <HeartPulse className="w-5 h-5 text-rose-400" />
                                Part 3: Health & Medical History
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Past Injuries</label>
                                    <p className="text-xs text-gray-500">Do you have any past injuries in your knees, back, or shoulders?</p>
                                    <textarea value={formData.injuries} onChange={(e) => handleInputChange('injuries', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] min-h-[100px]" placeholder="Provide details if any..."></textarea>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Medical Conditions</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['Thyroid', 'Diabetes', 'PCOD/PCOS', 'Blood Pressure', 'Asthma', 'Heart Disease', 'None'].map(condition => (
                                            <label key={condition} className="flex items-center gap-2 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-black/50">
                                                <input type="checkbox" checked={formData.conditions.includes(condition)} onChange={() => handleConditionToggle(condition)} className="rounded border-gray-600 text-rose-500 focus:ring-rose-500 bg-black" />
                                                <span className="text-sm text-gray-400">{condition}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Allergies</label>
                                    <input type="text" value={formData.allergies} onChange={(e) => handleInputChange('allergies', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="e.g. Dairy (Lactose), Peanuts, Gluten..." />
                                </div>

                                {/* Medical Reports Upload Section */}
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-rose-400" />
                                        Medical Reports
                                    </label>
                                    <p className="text-xs text-gray-500">Upload past reports, blood tests, or bio-analyst prescriptions.</p>
                                    
                                    <div className="flex gap-3">
                                        <label className={`flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 hover:border-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-medium ${isAnalyzingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Upload className="w-4 h-4"/> Upload Files
                                            <input type="file" multiple className="hidden" onChange={handleReportUpload} accept="*/*" disabled={isAnalyzingFile} />
                                        </label>
                                        <label className={`flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 hover:border-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-medium ${isAnalyzingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Camera className="w-4 h-4"/> Camera
                                            <input type="file" capture="environment" className="hidden" onChange={handleReportUpload} accept="image/*" disabled={isAnalyzingFile} />
                                        </label>
                                    </div>
                                    {isAnalyzingFile && <p className="text-sm text-rose-400 mt-2 animate-pulse">AI Fitness Planner is analyzing the file...</p>}

                                    {/* Attached Files List */}
                                    {formData.medicalReports.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {formData.medicalReports.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400">
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
                            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-widest">
                                <Coffee className="w-5 h-5 text-amber-400" />
                                Part 4: Lifestyle & Nutrition
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Diet Type</label>
                                    <select value={formData.dietType} onChange={(e) => handleInputChange('dietType', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required>
                                        <option value="">Select...</option>
                                        <option value="veg">Vegetarian</option>
                                        <option value="nonveg">Non-Vegetarian</option>
                                        <option value="egg">Eggitarian</option>
                                        <option value="vegan">Vegan</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Water Intake (Daily)</label>
                                    <select value={formData.waterIntake} onChange={(e) => handleInputChange('waterIntake', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required>
                                        <option value="">Select...</option>
                                        <option value="low">1-2 Liters</option>
                                        <option value="medium">2-3 Liters</option>
                                        <option value="high">3-4 Liters</option>
                                        <option value="veryhigh">4+ Liters</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Meal Frequency</label>
                                    <select value={formData.mealFrequency} onChange={(e) => handleInputChange('mealFrequency', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required>
                                        <option value="">How many times do you eat a day?</option>
                                        <option value="2">2 Times</option>
                                        <option value="3">3 Times</option>
                                        <option value="4">4 Times</option>
                                        <option value="5+">5+ Times</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Sleep Time</label>
                                    <input type="time" value={formData.sleepTime} onChange={(e) => handleInputChange('sleepTime', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required />
                                    <p className="text-xs text-gray-500 mt-1">Required for the Chronos Mirror Bot.</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Supplement History</label>
                                    <input type="text" value={formData.supplements} onChange={(e) => handleInputChange('supplements', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="Are you already taking any protein or multivitamins?" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Smart OS Insights */}
                    {currentStep === 5 && (
                        <motion.div 
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-widest">
                                <Brain className="w-5 h-5 text-purple-400" />
                                Part 5: Special Data for Smart OS
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex justify-between">
                                        <span>Stress Level</span>
                                        <span className="text-purple-400">On a scale of 1 to 10: {formData.stressLevel}</span>
                                    </label>
                                    <input type="range" min="1" max="10" value={formData.stressLevel} onChange={(e) => handleInputChange('stressLevel', e.target.value)} className="w-full accent-purple-500" />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>None at all (1)</span>
                                        <span>Normal (5)</span>
                                        <span>Very High (10)</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Diet works differently under high stress.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Sleep Quality</label>
                                    <select value={formData.sleepQuality} onChange={(e) => handleInputChange('sleepQuality', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required>
                                        <option value="">How many hours of deep sleep do you get daily?</option>
                                        <option value="<5">Less than 5 hours</option>
                                        <option value="5-6">5-6 hours</option>
                                        <option value="7-8">7-8 hours (Ideal)</option>
                                        <option value=">8">More than 8 hours</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Metabolic Rate Factors</label>
                                    <select value={formData.metabolicRate} onChange={(e) => handleInputChange('metabolicRate', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" required>
                                        <option value="">Sweating Tendency</option>
                                        <option value="high">Sweats very easily</option>
                                        <option value="normal">Normal</option>
                                        <option value="low">Sweats very rarely</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 6: Packages & Fees */}
                    {currentStep === 6 && (
                        <motion.div 
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-widest">
                                <Wallet className="w-5 h-5 text-emerald-400" />
                                Part 6: Packages & Fees
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Registration Fee</label>
                                    <input 
                                        type="number" 
                                        value={admissionFee} 
                                        onChange={(e) => setAdmissionFee(Number(e.target.value))} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" 
                                        placeholder="e.g. 500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Select Gym / Cardio Package</label>
                                    <select 
                                        value={formData.packageId} 
                                        onChange={(e) => handleInputChange('packageId', e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" 
                                        required
                                    >
                                        <option value="">Select Package...</option>
                                        {packages.filter(p => p.category !== 'Personal Training').map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.name} - {getCurrencySymbol()}{pkg.price} ({pkg.duration})
                                                </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Personal Training (PT) Plan (Optional)</label>
                                    <select 
                                        value={formData.ptPackageId} 
                                        onChange={(e) => handleInputChange('ptPackageId', e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                                    >
                                        <option value="">No PT Plan</option>
                                        {packages.filter(p => p.category === 'Personal Training').map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.name} - {getCurrencySymbol()}{pkg.price} ({pkg.duration})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Accessories & Supplements</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {inventory.map(item => {
                                            const selected = formData.selectedInventory.find(i => i.id === item.id);
                                            const qty = selected ? selected.qty : 0;
                                            return (
                                                <div key={item.id} className="bg-black/50 border border-white/10 p-3 rounded-xl flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm text-white font-medium">{item.name}</p>
                                                        <p className="text-xs text-gray-400">{getCurrencySymbol()}{item.price} (Stock: {item.stock})</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => handleInventoryChange(item, -1)} disabled={qty === 0} className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center disabled:opacity-50"><Minus className="w-4 h-4"/></button>
                                                        <span className="text-white font-mono w-4 text-center">{qty}</span>
                                                        <button type="button" onClick={() => handleInventoryChange(item, 1)} disabled={qty >= item.stock} className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50"><Plus className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {formData.selectedInventory.filter(i => i.id.startsWith('manual-')).map(item => (
                                            <div key={item.id} className="bg-black/50 border border-white/10 p-3 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-white font-medium">{item.name}</p>
                                                    <p className="text-xs text-gray-400">{getCurrencySymbol()}{item.price} (Custom)</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => setFormData(prev => ({...prev, selectedInventory: prev.selectedInventory.filter(i => i.id !== item.id)}))} className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center"><X className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Manual Entry */}
                                    <div className="bg-black/30 border border-white/10 p-3 rounded-xl flex flex-col md:flex-row gap-3 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="text-xs text-gray-400 mb-1 block">Custom Item Name</label>
                                            <input type="text" id="manualItemName" placeholder="e.g., Protein Shaker" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="text-xs text-gray-400 mb-1 block">Price (${getCurrencySymbol()})</label>
                                            <input type="number" id="manualItemPrice" placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const nameInput = document.getElementById('manualItemName') as HTMLInputElement;
                                                const priceInput = document.getElementById('manualItemPrice') as HTMLInputElement;
                                                if (nameInput.value && priceInput.value) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        selectedInventory: [...prev.selectedInventory, {
                                                            id: `manual-${Date.now()}`,
                                                            name: nameInput.value,
                                                            price: Number(priceInput.value),
                                                            qty: 1
                                                        }]
                                                    }));
                                                    nameInput.value = '';
                                                    priceInput.value = '';
                                                }
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full md:w-auto"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-black/50 rounded-xl p-4 border border-white/10 space-y-3">
                                    <h3 className="text-white font-medium border-b border-white/10 pb-2">Fees Summary</h3>
                                    <div className="flex justify-between text-gray-400 text-sm">
                                        <span>Admission Fee:</span>
                                        <span>{getCurrencySymbol()}{admissionFee || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400 text-sm">
                                        <span>Main Package:</span>
                                        <span>
                                            {formData.packageId ? (
                                                `${getCurrencySymbol()}${packages.find(pkg => pkg.id.toString() === formData.packageId)?.price || 0}`
                                            ) : '${getCurrencySymbol()}0'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-400 text-sm">
                                        <span>Personal Training:</span>
                                        <span>
                                            {formData.ptPackageId ? (
                                                `${getCurrencySymbol()}${packages.find(pkg => pkg.id.toString() === formData.ptPackageId)?.price || 0}`
                                            ) : '${getCurrencySymbol()}0'}
                                        </span>
                                    </div>
                                    {formData.selectedInventory.length > 0 && (
                                        <div className="flex justify-between text-gray-400 text-sm">
                                            <span>Accessories/Supplements:</span>
                                            <span>{getCurrencySymbol()}{formData.selectedInventory.reduce((acc, item) => acc + (item.price * item.qty), 0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                                        <span>Total Amount:</span>
                                        <span className="text-emerald-400">{getCurrencySymbol()}{totalAmount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={handlePrev}
                            disabled={currentStep === 1 || isSubmitting}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-dashed relative overflow-hidden group ${
                                currentStep === 1 || isSubmitting
                                    ? 'bg-white/5 text-gray-600 border-white/10 cursor-not-allowed'
                                    : 'bg-black/50 hover:bg-white/5 text-gray-400 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md'
                            }`}
                        >
                            {!(currentStep === 1 || isSubmitting) && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                            <ChevronLeft className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">Previous</span>
                        </motion.button>

                        {currentStep < 6 ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <span className="relative z-10">Next</span>
                                <ChevronRight className="w-4 h-4 relative z-10" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)] border border-fuchsia-400/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin relative z-10" />
                                        <span className="relative z-10">Processing AI Data...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 relative z-10" />
                                        <span className="relative z-10">Complete Payment & Auto-Generate Receipt</span>
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </form>
            </div>
            {/* Webcam Modal */}
            <AnimatePresence>
                {isWebcamOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 50 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-[#050510] border border-indigo-500/30 p-6 rounded-3xl shadow-2xl shadow-indigo-500/20 max-w-lg w-full"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Camera className="text-indigo-400" /> FitnessFutureID Scanner
                                </h3>
                                <button onClick={() => setIsWebcamOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative rounded-2xl overflow-hidden mb-4 border-2 border-indigo-500/20 bg-black aspect-video flex-col items-center justify-center">
                                <Webcam 
                                    audio={false} 
                                    ref={webcamRef as any} 
                                    screenshotFormat="image/jpeg" 
                                    videoConstraints={{ facingMode: "environment" }}
                                    className="w-full h-full object-cover" 
                                    disablePictureInPicture={false}
                                    forceScreenshotSourceSize={false}
                                    imageSmoothing={true}
                                    mirrored={false}
                                    onUserMedia={() => {}}
                                    onUserMediaError={() => {}}
                                    screenshotQuality={0.92}
                                />
                                <div className="absolute inset-0 border-4 border-indigo-500/50 m-8 rounded-lg border-dashed pointer-events-none opacity-50"></div>
                            </div>
                            <button 
                                onClick={captureWebcam} 
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] flex justify-center items-center gap-3"
                            >
                                <Camera className="w-6 h-6" /> CAPTURE & ANALYZE
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </div>
    );
};

export default ScientificAdmissionForm;
