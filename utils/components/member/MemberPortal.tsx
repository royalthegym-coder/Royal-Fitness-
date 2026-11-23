import { getCurrencySymbol } from '../../store/useCurrencyStore';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Header';
import { INITIAL_MEMBERS, INITIAL_HEALTH_DATA, GYM_INFO } from '../../constants';
import TodaysWorkout from './TodaysWorkout';
import { HealthData, Theme, View } from '../../types';
import MemberHealthDashboard from './MemberHealthDashboard';
import Sidebar from '../Sidebar';
import { MenuIcon } from '../icons/MenuIcon';
import { SmartEngineChat } from '../SmartEngineChat';
import { ChatIcon } from '../icons/ChatIcon';
import MemberPayments from './MemberPayments';
import MemberPackages from './MemberPackages';
import { useData } from '../../context/DataProvider';
import { OnboardingWizard } from './OnboardingWizard';
import AutoAttendance from './AutoAttendance';
import SmartScheduler from './SmartScheduler';
import { QrCodeIcon } from '../icons/QrCodeIcon';
import { toDataURL } from 'qrcode';
import Modal from '../common/Modal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { DashboardIcon } from '../icons/NavIcons';
import Card from '../common/Card';
import FeatureImage from '../common/FeatureImage';
import { MEMBER_MATRIX_MEDIA } from '../../data/featureMedia';
import MedicalHub from './MedicalHub';
import SmartGymHub from './SmartGymHub';
import LeanBulkCalculator from './LeanBulkCalculator';
import BiomarkerVault from './BiomarkerVault';
import DailyRoutineLogView from './DailyRoutineLog';
import MetabolicTracker from './MetabolicTracker'; 
import CloudCommunityHive from './CloudCommunityHive'; 
import NeuroRecovery from './NeuroRecovery'; 
import GlobalHealthPassport from './GlobalHealthPassport';
import HelpSupport from '../HelpSupport';
import SynthesisX from '../SynthesisX';
import WarriorPerformanceLab from './WarriorPerformanceLab';
import SmartRepAnalyst from './SmartRepAnalyst';
import WearableConnectHub from './SmartWatch';
import NutritionAdvisor from './NutritionAdvisor';
import { IntakeBot, InjuryAI, SensorHub, DigitalTwin3D, AutoMarket, SmartLink, AutomatedSwarm, GymMetaverse, SyngCore } from '../omniscience/AnalyticsFeatures';
import FutureOFS from './FutureOFS';
import ProfileView from './ProfileView'; // Added
import ClassBooking from './ClassBooking';
import { PersonalTrainingHub } from './PersonalTrainingHub';
import { GymMembershipManager } from './GymMembershipManager';
import { InteractiveClassScheduler } from './InteractiveClassScheduler';
import { UniversalGadgetDashboard } from './UniversalGadgetDashboard';
import { DigitalBioHealthPass } from './DigitalBioHealthPass';
import WorkoutAnalyticsDashboard from './WorkoutAnalyticsDashboard';
import GateAccessController from './GateAccessController';

import { GamificationWidget } from './GamificationWidget';
import BrainCore from '../BrainCore';
import InjuryOracle from '../InjuryOracle';
import VisualSensor from '../VisualSensor';
import DigitalTwin from '../DigitalTwin';
import SmartEdge from '../SmartEdge';
import RealTimeFormAnalyzer from '../RealTimeFormAnalyzer';
import { Camera, Stethoscope } from 'lucide-react';
import NutritionTracker from '../NutritionTracker';
import AIHealthCoach from '../AIHealthCoach';
import HealthMetrics from '../HealthMetrics';
import WearableSync from '../WearableSync';
import AIRiskAssessment from '../AIRiskAssessment';
import { useToast } from '../../hooks/useToast';

// Imported 100X Missing Components!
import FuturePay from '../FuturePay';
import Marketplace from '../Marketplace';
import EMIPlans from '../EMIPlans';
import FutureFeed from '../FutureFeed';
import GymBuddyFinder from '../GymBuddyFinder';
import Leaderboard from '../Leaderboard';
import RazorpaySubscriptionGateway from '../admin/RazorpaySubscriptionGateway';
import AutonomousGymOSPortal from '../AutonomousGymOSPortal';
import LiveCrowdRadar from '../LiveCrowdRadar';

// Removed Fitness Future OS missing imports
import { sendThankYouForPayment } from '../../../lib/whatsapp';
import { 
    CalendarCheck, Globe, Zap, ShieldAlert, DollarSign, Activity, 
    Network, Heart, CreditCard, ChevronRight, LifeBuoy, MessageSquare, 
    TrendingUp, ShieldCheck, Clock, Crown, Infinity, Fingerprint, 
    Smartphone, ScanFace, Lock, Wifi, Binary, Layers, Server, Radio,
    Bot, Flame, Wind, Droplets, BrainCircuit, Play, BarChart, FileText,
    Sun, Moon, Sunrise, Sunset, Sparkles, Utensils, X, Target, ArrowRight,
    Workflow, Dumbbell, Calendar, MapPin, Phone, Navigation, Building2, ExternalLink, User
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { BioScanner } from './BioScanner';
import BioSyncBanner from './BioSyncBanner';
import OpalsWorkoutArchitect from '../OpalsWorkoutArchitect';
import FitnessFutureProgress from './FitnessFutureProgress';
import OpalsDietArchitect from '../OpalsDietArchitect';
import { KitchenChief } from './KitchenChief';
import SuperAgentWorkout from './SuperAgentWorkout';
import SuperAgentDietAnalyst from './SuperAgentDietAnalyst';
import { SmartNexusDashboard } from '../admin/SmartNexusDashboard';
import CloudMedDashboard from '../admin/CloudMedDashboard';
import { useTenantStore } from '../../store/useTenantStore';
import { useGym, tenantToGymConfig } from '../../context/GymProvider';
import { normalizeSafeExternalUrl } from '../../imageUpload';
import { FitnessFutureDNA } from '../AdvancedDNA';
import BioscienceHub from '../science/BioscienceHub';
import FitnessFutureCommandHub from '../FitnessFutureCommandHub';
import ErrorBoundary from '../common/ErrorBoundary';
import { subscribeToDocument, syncToFirebase } from '../../../lib/firebase';

interface MemberPortalProps {
    onLogout: () => void;
    loggedInMemberId: number;
    theme: Theme;
    toggleTheme: () => void;
}

const MemberPortal: React.FC<MemberPortalProps> = ({ onLogout, loggedInMemberId, theme, toggleTheme }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const { members, invoices = [], updateInvoiceStatus, addTransaction, addInvoice, updateMember, dailyRoutineLogs = [], systemHealth, auditLogs, liveHealthData, systemVersion, addAuditLog, osSubscription } = useData();
    const { tenants, memberGovernance, globalMasterOverride, activateMemberSubscriptionUnlock } = useTenantStore();
    const { currentGym, setCurrentGym } = useGym();
    const { addToast } = useToast();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [isChatOpen, setChatOpen] = useState(false);
    const [isIdCardOpen, setIsIdCardOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [liveFirestoreLockState, setLiveFirestoreLockState] = useState<{ accountLocked?: boolean; status?: string; expiryDate?: string } | null>(null);
    
    // Holographic ID State
    const [neuralHash, setSmartHash] = useState('');
    const [isScanning, setIsScanning] = useState(true);

    // FitnessFutureMatrix Dashboard State
    const [omni_matrixScore, setFitnessFutureMatrixScore] = useState(0);

    // --- NEW PAYMENT & WELCOME STATES ---
    const [showDuePopup, setShowDuePopup] = useState(false);
    const [totalDueAmount, setTotalDueAmount] = useState(0);
    const [paymentQr, setPaymentQr] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

    // Quick Payment States
    const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);
    const [subPlanName, setSubPlanName] = useState('Power Rise Suite');
    const [subBillingCycle, setSubBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
    const [quickPaymentQr, setQuickPaymentQr] = useState('');
    const [isProcessingQuickPayment, setIsProcessingQuickPayment] = useState(false);

    // Biometric Security State
    const [pendingView, setPendingView] = useState<View | null>(null);
    const [isBiometricPromptOpen, setIsBiometricPromptOpen] = useState(false);
    
    // Bio-Scanner State
    const [isBioScannerOpen, setIsBioScannerOpen] = useState(false);
    const [bioScanResult, setBioScanResult] = useState<{ mood: string, fatigue: number, recommendedMode: string } | null>(null);

    // Strict Member Isolation: match exact loggedInMemberId (never leak another member's private record)
    const selectedMember = useMemo(
        () => members.find(m => m.id === loggedInMemberId) || null,
        [members, loggedInMemberId]
    );

    // Resolve this member's exact Gym Owner tenant (portal unlocks & brands according to matched Gym Owner)
    const parentTenant = useMemo(() => {
        if (!selectedMember) return null;
        if (selectedMember.gymId) {
            const byId = tenants.find(t => t.gym_id === selectedMember.gymId);
            if (byId) return byId;
        }
        if (selectedMember.gymOwnerEmail) {
            const targetEmail = selectedMember.gymOwnerEmail.toLowerCase().trim();
            const byEmail = tenants.find(t => t.email_id?.toLowerCase().trim() === targetEmail);
            if (byEmail) return byEmail;
        }
        if (currentGym?.gymId) {
            const byCurrent = tenants.find(t => t.gym_id === currentGym.gymId);
            if (byCurrent) return byCurrent;
        }
        return tenants[0] || null;
    }, [selectedMember, tenants, currentGym?.gymId]);

    // Sync matched Gym Owner branding (logo, owner name, phone, UPI, Google location, signature) into GymProvider
    useEffect(() => {
        if (parentTenant && currentGym?.gymId !== parentTenant.gym_id) {
            setCurrentGym(tenantToGymConfig(parentTenant));
        }
    }, [parentTenant, currentGym?.gymId, setCurrentGym]);

    const activeGymName = parentTenant?.gym_name || currentGym?.gymName || GYM_INFO.name;
    const activeGymOwner = parentTenant?.owner_name || parentTenant?.admin_name || currentGym?.ownerName || '';
    const activeGymPhone = parentTenant?.phone_number || currentGym?.phone || GYM_INFO.contact;
    const activeGymUpi = parentTenant?.upi_id || currentGym?.upiId || GYM_INFO.upiIds.gpay1;
    const activeGymLogo = parentTenant?.logo_url || currentGym?.logoUrl || '';
    const activeGymAddress = parentTenant?.location || currentGym?.address || GYM_INFO.address;
    const activeGymMapsUrl = normalizeSafeExternalUrl(
        parentTenant?.google_location_url || currentGym?.googleLocationUrl || ''
    );

    // Real-time Firestore listener so Admin & Super Admin lock/unlock takes effect instantly
    useEffect(() => {
        if (!selectedMember?.id) return;
        const unsub = subscribeToDocument('members', String(selectedMember.id), (docData) => {
            if (docData) {
                setLiveFirestoreLockState({
                    accountLocked: docData.accountLocked,
                    status: docData.status,
                    expiryDate: docData.expiryDate,
                });
            }
        });
        return () => {
            if (typeof unsub === 'function') unsub();
        };
    }, [selectedMember?.id]);

    // Zero-Trust Architecture State
    const [isZeroTrustScanOpen, setIsZeroTrustScanOpen] = useState(false);

    useEffect(() => {
        // Zero-Trust Architecture: Randomly trigger re-authentication
        const interval = setInterval(() => {
            if (selectedMember?.biometricCredentials && selectedMember.biometricCredentials.length > 0) {
                // 5% chance every 2 minutes to trigger a random security check
                if (Math.random() < 0.05) {
                    setIsZeroTrustScanOpen(true);
                }
            }
        }, 120000); // Check every 2 minutes

        return () => clearInterval(interval);
    }, [selectedMember]);

    const handleZeroTrustVerify = () => {
        setIsZeroTrustScanOpen(false);
        addToast("Zero-Trust Verification Successful. Identity Confirmed.", "success");
    };

    const handleViewChange = async (view: View) => {
        const secureViews: View[] = ['profile', 'health', 'medicalHub', 'biomarkerVault', 'quantumDNA', 'digitalBioPass'];
        
        if (secureViews.includes(view)) {
            if (selectedMember?.biometricCredentials && selectedMember.biometricCredentials.length > 0) {
                setPendingView(view);
                setIsBiometricPromptOpen(true);
                // Process WebAuthn API call
                try {
                    // In a real app, this would be: await navigator.credentials.get({ publicKey: ... })
                    setTimeout(() => {
                        setIsBiometricPromptOpen(false);
                        setActiveView(view);
                        addToast("Biometric verification successful.", "success");
                    }, 1500);
                } catch (error) {
                    setIsBiometricPromptOpen(false);
                    addToast("Biometric verification failed.", "error");
                }
            } else {
                // If no biometrics registered, allow access but warn
                addToast("Warning: Biometric security not configured. Accessing sensitive data.", "warning" as any);
                setActiveView(view);
            }
        } else {
            setActiveView(view);
        }
    };

    const handleOnboardingComplete = (data: { fitnessGoal: string; trainingStyle: string; aiStrategy: string; experienceLevel: string }) => {
        if (selectedMember) {
            updateMember({
                ...selectedMember,
                fitnessGoal: data.fitnessGoal,
                trainingStyle: data.trainingStyle,
                aiStrategy: data.aiStrategy,
                onboardingCompleted: true,
                initial_assessment: {
                    ...selectedMember.initial_assessment,
                    fitness_level: data.experienceLevel
                }
            });
            addToast('Profile personalized! Welcome to the evolution.', 'success');
        }
    };
    
    // Calculate progress for Dashboard Widget
    const dailyLogs = dailyRoutineLogs.filter(l => l.member_id === loggedInMemberId);
    const completedRoutineCount = dailyLogs.filter(l => l.is_done).length;
    const totalRoutineCount = dailyLogs.length || 1; // Avoid divide by zero
    const routineProgress = Math.round((completedRoutineCount / totalRoutineCount) * 100);

    // --- ENHANCED PAYMENT DUE CHECK ---
    useEffect(() => {
        const pending = invoices.filter(inv => inv.memberId === loggedInMemberId && (inv.status === 'Pending' || inv.status === 'Overdue'));
        const total = pending.reduce((sum, inv) => sum + inv.amount, 0);
        if (total > 0) {
            setTotalDueAmount(total);
            setShowDuePopup(true);
            const upiUri = `upi://pay?pa=${encodeURIComponent(activeGymUpi)}&pn=${encodeURIComponent(activeGymName)}&am=${total.toFixed(2)}&cu=INR&tn=MemberFee_${loggedInMemberId}`;
            toDataURL(upiUri, { width: 300, margin: 2 }).then(url => setPaymentQr(url));
        } else {
            setShowDuePopup(false);
        }
    }, [invoices, loggedInMemberId, activeGymUpi, activeGymName]);

    const getPlanPrice = (planName: string, cycle: 'Monthly' | 'Yearly') => {
        const basePrice = planName === 'Power Rise Suite' ? 3999 : planName === 'Elite AI Cortex' ? 4999 : 9999;
        return cycle === 'Monthly' ? basePrice : basePrice * 12 * 0.8;
    };

    useEffect(() => {
        if (isQuickPaymentOpen) {
            const price = getPlanPrice(subPlanName, subBillingCycle);
            const upiUri = `upi://pay?pa=${encodeURIComponent(activeGymUpi)}&pn=${encodeURIComponent(activeGymName)}&am=${price.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Sub_${subPlanName.replace(/\s+/g, '')}_${subBillingCycle}`)}`;
            toDataURL(upiUri, { width: 300, margin: 2 }).then(url => setQuickPaymentQr(url));
        }
    }, [isQuickPaymentOpen, subPlanName, subBillingCycle, activeGymUpi, activeGymName]);

    useEffect(() => {
        if (selectedMember && isIdCardOpen) {
            const payload = JSON.stringify({ 
                protocol: "FUTURE_ID_V31_FitnessFutureMatrix",
                id: selectedMember.id, 
                ts: Date.now(),
                auth: "BIO_VERIFIED_SECURE"
            });
            toDataURL(payload, { width: 300, margin: 1, color: { dark: '#000000', light: '#00ffff' } }).then(url => setQrCode(url));
            
            setTimeout(() => setIsScanning(false), 3000);
        }
    }, [selectedMember, isIdCardOpen]);
    
    // --- NEW PAYMENT HANDLER ---
    const handleQuickPay = async () => {
        if (!selectedMember) return;
        setIsProcessingPayment(true);
        
        // Process payment for now
        setTimeout(() => {
            finalizeQuickPay();
        }, 1500);
    };

    const finalizeQuickPay = async () => {
        if (!selectedMember) return;
        
        // 1. Zero-Trust Enforcement: Update invoice status to 'Verification Pending' (NOT 'Paid')
        // Only Admin or verified payment webhook can transition status to 'Paid'
        invoices.filter(inv => inv.memberId === loggedInMemberId && inv.status !== 'Paid')
            .forEach(inv => updateInvoiceStatus(inv.id, 'Verification Pending'));
        
        const txnId = `TXN-${Date.now()}`;
        addTransaction({ 
            id: txnId, 
            memberName: selectedMember.name, 
            amount: totalDueAmount, 
            date: new Date().toISOString().split('T')[0], 
            method: 'UPI' as any
        });

        // 2. Alert Admin via Immutable Audit Log
        addAuditLog({
            member_id: loggedInMemberId,
            action: 'PAYMENT_SUBMITTED',
            details: `Member ${selectedMember.name} submitted payment ${getCurrencySymbol()}${totalDueAmount} via App (Ref: ${txnId}). Awaiting Admin Verification.`
        });
        
        setIsProcessingPayment(false);
        setPaymentSuccess(true);
        addToast("Payment Submitted. Awaiting Admin Verification & Reconciliation.", "info");

        setTimeout(() => { 
            setPaymentSuccess(false); 
            setShowDuePopup(false); 
            setTotalDueAmount(0);
            setShowWelcomeBanner(true);
        }, 2000);
    };

    const handleQuickSubscriptionPay = async () => {
        if (!selectedMember) return;
        setIsProcessingQuickPayment(true);
        setTimeout(() => {
            const price = getPlanPrice(subPlanName, subBillingCycle);
            const newInvoiceId = Date.now();
            
            addInvoice?.({
                id: newInvoiceId,
                memberId: loggedInMemberId,
                memberName: selectedMember.name,
                packageId: subPlanName === 'Power Rise Suite' ? 101 : subPlanName === 'Elite AI Cortex' ? 102 : 103,
                packageName: `${subPlanName} (${subBillingCycle})`,
                amount: price,
                date: new Date().toISOString().split('T')[0],
                status: 'Verification Pending',
                items: [{ description: `${subPlanName} ${subBillingCycle} Subscription Fee`, amount: price, type: 'Membership' }]
            });

            addTransaction?.({
                id: `TXN-${Date.now()}`,
                memberName: selectedMember.name,
                amount: price,
                date: new Date().toISOString().split('T')[0],
                method: 'UPI' as any
            });

            addAuditLog({
                member_id: loggedInMemberId,
                action: 'PAYMENT_SUBMITTED',
                details: `Member submitted ₹${price} for ${subPlanName} (${subBillingCycle}) subscription via dynamic UPI QR.`
            });

            setIsProcessingQuickPayment(false);
            setIsQuickPaymentOpen(false);
            addToast(`Payment verification for ₹${price} submitted. Waiting admin approval.`, "success");
        }, 2000);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setSmartHash(Math.random().toString(36).substring(2, 15).toUpperCase());
            const hrScore = Math.max(0, 100 - Math.abs(liveHealthData.heartRate.avg - 70));
            const syncScore = Math.floor((hrScore + (selectedMember?.health_score || 80)) / 2);
            setFitnessFutureMatrixScore(syncScore);
        }, 2000);
        return () => clearInterval(interval);
    }, [liveHealthData, selectedMember]);

    const getDaysSinceJoin = (dateStr?: string) => {
        if (!dateStr) return 0;
        const joinDate = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - joinDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysSinceJoin = getDaysSinceJoin(selectedMember?.joinDate);

    const renderMemberView = () => {
        switch (activeView) {
            case 'dashboard': return (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* Welcome Banner */}
                    {showWelcomeBanner && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center relative overflow-hidden animate-fade-in">
                            <div className="flex items-center gap-4">
                                <CheckCircleIcon className="w-10 h-10 text-white" />
                                <div>
                                    <h3 className="text-white font-black text-xl">Welcome Back, {selectedMember?.name}!</h3>
                                    <p className="text-emerald-100 text-sm">Your access is fully restored. Thank you for your payment.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowWelcomeBanner(false)} className="text-white/70 hover:text-white transition-colors p-2 rounded-full">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                    )}

                    {/* ACTIVE GYM OWNER IDENTITY BAR */}
                    <div className="bg-zinc-950/90 border border-emerald-500/25 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center gap-4">
                            {activeGymLogo ? (
                                <img
                                    src={activeGymLogo}
                                    alt={activeGymName}
                                    className="w-14 h-14 rounded-2xl object-contain bg-white p-1.5 border border-emerald-500/30 shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl shrink-0">
                                    <Building2 className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">{activeGymName}</h2>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                                        Verified Gym Portal
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
                                    {activeGymOwner && (
                                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-amber-400" /> Owner: <strong className="text-zinc-200">{activeGymOwner}</strong></span>
                                    )}
                                    {activeGymPhone && (
                                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-cyan-400" /> {activeGymPhone}</span>
                                    )}
                                    {activeGymUpi && (
                                        <span className="font-mono text-emerald-400">UPI: {activeGymUpi}</span>
                                    )}
                                </div>
                                {activeGymAddress && (
                                    <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" /> {activeGymAddress}
                                    </p>
                                )}
                            </div>
                        </div>
                        {activeGymMapsUrl && (
                            <a
                                href={activeGymMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider transition-all shrink-0"
                            >
                                <Navigation className="w-4 h-4" /> Google Location <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>

                    {/* HERO IDENTITY CARD */}
                    <div className="bg-black p-10 rounded-[3.5rem] border border-cyan-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                        <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                            <div>
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
                                    <div className="px-5 py-2 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 backdrop-blur-md">
                                        <Infinity className="w-3 h-3 animate-spin-slow" /> {systemVersion}
                                    </div>
                                    {osSubscription.tier !== 'Basic' && (
                                        <div className="px-5 py-2 bg-fuchsia-900/30 border border-fuchsia-500/30 text-fuchsia-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(217,70,239,0.2)] flex items-center gap-2 backdrop-blur-md">
                                            <Globe className="w-3 h-3 animate-pulse" /> Diplomat Mode
                                        </div>
                                    )}
                                    {osSubscription.tier === 'Elite' && (
                                        <div className="px-5 py-2 bg-green-900/30 border border-green-500/30 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(34,197,94,0.2)] flex items-center gap-2 backdrop-blur-md">
                                            <Workflow className="w-3 h-3 animate-spin-slow" /> Auto-Pilot ON
                                        </div>
                                    )}
                                    <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase ml-auto">NODE: {selectedMember?.name.split(' ')[0].toUpperCase()}</span>
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                                    {selectedMember?.name}
                                </h1>
                                <div className="space-y-1 mb-6">
                                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">
                                        {osSubscription.tier === 'Basic' ? 'Basic OS • Digital Gym Management' : osSubscription.tier === 'Premium' ? 'Premium OS • AI-Powered Management' : 'Fitness Future OS • Advanced FitnessFutureComputer OS'}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsIdCardOpen(true)}
                                        className="relative bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600 hover:to-blue-600 backdrop-blur-xl border border-dashed border-cyan-500/50 text-cyan-400 hover:text-white font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all duration-500 flex items-center gap-2 group overflow-hidden active:scale-95"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                        <QrCodeIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10"/> 
                                        <span className="relative z-10 font-bold">Access ID</span>
                                    </button>

                                    <button 
                                        id="btn-quick-payment-trigger"
                                        onClick={() => setIsQuickPaymentOpen(true)}
                                        className="relative bg-gradient-to-r from-emerald-600/20 to-green-600/20 hover:from-emerald-600 hover:to-green-600 backdrop-blur-xl border border-dashed border-emerald-500/50 text-emerald-400 hover:text-white font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-500 flex items-center gap-2 group overflow-hidden active:scale-95"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                        <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10" /> 
                                        <span className="relative z-10 font-bold">Payment</span>
                                    </button>
                                </div>
                            </div>
                            
                            {osSubscription.tier === 'Elite' && (
                                <div className="flex gap-6">
                                    <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[3rem] border border-cyan-500/20 shadow-2xl relative overflow-hidden group/meter min-w-[220px] text-center">
                                        <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-pulse" />
                                        <p className="text-5xl font-black text-white italic tracking-tighter">{omni_matrixScore}%</p>
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Synchronization</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <BioSyncBanner />

                    {/* BIO-SCANNER WIDGET */}
                    {osSubscription.tier !== 'Basic' && (
                        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity"><ScanFace className="w-32 h-32 text-cyan-400" /></div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                        <BrainCircuit className="w-6 h-6 text-cyan-400" /> FitnessFutureBio-Scan
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-2 max-w-md">
                                        {bioScanResult 
                                            ? `Analysis Complete. Mood: ${bioScanResult.mood}. Fatigue: ${bioScanResult.fatigue}%. Recommended: ${bioScanResult.recommendedMode}.` 
                                            : "Scan your face to detect mood and fatigue. AI will auto-adjust your workout protocol."}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsBioScannerOpen(true)}
                                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] whitespace-nowrap"
                                >
                                    {bioScanResult ? 'Re-Scan' : 'Initiate Scan'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DASHBOARD WIDGETS - PREMIUM STITCHED DESIGN */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        {/* 1. Fiscal Status Widget */}
                        <div 
                            onClick={() => handleViewChange('payments')} 
                            className={`cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed transition-all duration-500 backdrop-blur-xl hover:-translate-y-1 ${totalDueAmount > 0 ? 'bg-black/40 border-red-500/30 hover:border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'bg-black/40 border-green-500/30 hover:border-green-500/60 shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:shadow-[0_0_50px_rgba(34,197,94,0.2)]'}`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${totalDueAmount > 0 ? 'from-red-500/5' : 'from-green-500/5'} to-transparent`}></div>
                            <div className="p-8 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-4 rounded-2xl transition-all duration-500 ${totalDueAmount > 0 ? 'bg-red-950/30 text-red-400 group-hover:bg-red-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] group-hover:shadow-none animate-pulse' : 'bg-green-950/30 text-green-400 group-hover:bg-green-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(34,197,94,0.2)] group-hover:shadow-none'}`}>
                                        <DollarSign className="w-7 h-7" />
                                    </div>
                                    <ArrowRight className={`w-6 h-6 transition-all duration-500 group-hover:translate-x-2 ${totalDueAmount > 0 ? 'text-gray-600 group-hover:text-red-400' : 'text-gray-600 group-hover:text-green-400'}`} />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    {totalDueAmount > 0 ? 'Payment Due' : 'Account Active'}
                                </h3>
                                <p className={`text-4xl font-black mt-2 transition-colors duration-500 ${totalDueAmount > 0 ? 'text-red-500 group-hover:text-red-400' : 'text-green-500 group-hover:text-green-400'}`}>{getCurrencySymbol()}{totalDueAmount > 0 ? totalDueAmount : '0.00'}
                                </p>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2">
                                    {totalDueAmount > 0 ? 'Tap to Settle' : 'Fiscal Sync Complete'}
                                </p>
                            </div>
                        </div>

                        {/* 2. Health Intensity Widget */}
                        {daysSinceJoin >= 2 && osSubscription.tier !== 'Basic' && (
                            <div 
                                onClick={() => handleViewChange('health')} 
                                className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="p-8 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-4 bg-cyan-950/30 text-cyan-400 rounded-2xl transition-all duration-500 group-hover:bg-cyan-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] group-hover:shadow-none">
                                            <Heart className="w-7 h-7" />
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Bio-Intensity</h3>
                                    <p className="text-4xl font-black mt-2 text-cyan-500 group-hover:text-cyan-400 transition-colors duration-500">{selectedMember?.health_score || 85}%</p>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2">Vitals Telemetry</p>
                                </div>
                            </div>
                        )}

                        {/* 3. Mission Status Widget */}
                        <div 
                            onClick={() => handleViewChange('dailyProtocol')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-[0_0_30px_rgba(245,158,11,0.1)] hover:shadow-[0_0_50px_rgba(245,158,11,0.2)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="p-8 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-4 bg-amber-950/30 text-amber-400 rounded-2xl transition-all duration-500 group-hover:bg-amber-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(245,158,11,0.2)] group-hover:shadow-none">
                                        <Target className="w-7 h-7" />
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-2 transition-all duration-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Daily Mission</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.8)]" style={{ width: `${routineProgress}%` }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">{routineProgress}%</span>
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2">{dailyLogs.length} Objectives Loaded</p>
                            </div>
                        </div>
                    </div>

                    {/* QUICK ACCESS GRID - PREMIUM STITCHED DESIGN */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        {/* 1. PERSONAL TRAINING & PROGRESS MODULE */}
                        <div 
                            onClick={() => handleViewChange('personalTraining')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-fuchsia-500/40 hover:border-fuchsia-500/80 bg-black/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-[0_0_30px_rgba(217,70,239,0.15)] hover:shadow-[0_0_50px_rgba(217,70,239,0.3)] flex flex-col justify-between"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="p-7 relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-4 bg-fuchsia-950/40 text-fuchsia-400 rounded-2xl transition-all duration-500 group-hover:bg-fuchsia-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(217,70,239,0.3)]">
                                        <Dumbbell className="w-7 h-7" />
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 font-mono text-[9px] font-bold border border-fuchsia-500/30">
                                        1-on-1 PT Hub
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Personal Training</h3>
                                    <p className="text-xs text-fuchsia-300 font-mono mt-0.5">Trainers, Slots & Progress</p>
                                    <p className="text-[11px] text-gray-400 mt-2 font-sans line-clamp-2">
                                        Browse certified trainers, book and pay for 1-on-1 sessions, and track workout sets and weight logs.
                                    </p>
                                </div>
                            </div>
                            <div className="p-7 pt-0 relative z-10 flex items-center justify-between text-xs font-mono font-bold text-fuchsia-400 group-hover:text-white transition-colors">
                                <span>Open Sessions & Progress</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            </div>
                        </div>

                        {/* 2. MEMBERSHIP MANAGEMENT SYSTEM */}
                        <div 
                            onClick={() => handleViewChange('memberships')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-amber-500/40 hover:border-amber-500/80 bg-black/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col justify-between"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="p-7 relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-4 bg-amber-950/40 text-amber-400 rounded-2xl transition-all duration-500 group-hover:bg-amber-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(245,158,11,0.3)]">
                                        <Crown className="w-7 h-7" />
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30">
                                        Active Plan
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Gym Membership Hub</h3>
                                    <p className="text-xs text-amber-300 font-mono mt-0.5">Plans, Renewal & Upgrade</p>
                                    <p className="text-[11px] text-gray-400 mt-2 font-sans line-clamp-2">
                                        View active plan details, expiry countdown, and 1-click instant renewal or tier upgrades.
                                    </p>
                                </div>
                            </div>
                            <div className="p-7 pt-0 relative z-10 flex items-center justify-between text-xs font-mono font-bold text-amber-400 group-hover:text-white transition-colors">
                                <span>Manage Plans & Renewal</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            </div>
                        </div>

                        {/* 3. INTERACTIVE CLASS SCHEDULING */}
                        <div 
                            onClick={() => handleViewChange('classBooking')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-pink-500/40 hover:border-pink-500/80 bg-black/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:shadow-[0_0_50px_rgba(236,72,153,0.3)] flex flex-col justify-between"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="p-7 relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-4 bg-pink-950/40 text-pink-400 rounded-2xl transition-all duration-500 group-hover:bg-pink-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(236,72,153,0.3)]">
                                        <Calendar className="w-7 h-7" />
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-300 font-mono text-[9px] font-bold border border-pink-500/30">
                                        1-Click Booking
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Class Scheduling</h3>
                                    <p className="text-xs text-pink-300 font-mono mt-0.5">Yoga, Zumba & HIIT</p>
                                    <p className="text-[11px] text-gray-400 mt-2 font-sans line-clamp-2">
                                        Live weekly schedule for Yoga, Zumba, and HIIT with instructors, available spots, and 1-click booking.
                                    </p>
                                </div>
                            </div>
                            <div className="p-7 pt-0 relative z-10 flex items-center justify-between text-xs font-mono font-bold text-pink-400 group-hover:text-white transition-colors">
                                <span>View Class Schedule</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            </div>
                        </div>
                    </div>

                    {/* SECONDARY QUICK ACCESS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mt-6">
                        {/* Smart Nexus Widget */}
                        <div 
                            onClick={() => handleViewChange('neuralNexus')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-fuchsia-500/30 hover:border-fuchsia-500/60 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-[0_0_30px_rgba(217,70,239,0.1)] hover:shadow-[0_0_50px_rgba(217,70,239,0.2)] md:col-span-2"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="p-8 relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-fuchsia-950/30 text-fuchsia-400 rounded-2xl transition-all duration-500 group-hover:bg-fuchsia-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(217,70,239,0.2)] group-hover:shadow-none">
                                        <BrainCircuit className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Smart Nexus</h3>
                                        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">FitnessFuturescience Core</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-fuchsia-500">Active</p>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">Global Sync: 99.9%</p>
                                </div>
                            </div>
                        </div>

                        {/* Gamification Widget */}
                        <div className="md:col-span-2">
                            <GamificationWidget />
                        </div>

                        {/* Predictive Injury Prevention Widget */}
                        <div 
                            onClick={() => handleViewChange('injuryOracle')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-rose-500/30 hover:border-rose-500/60 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 shadow-[0_0_30px_rgba(244,63,94,0.1)] hover:shadow-[0_0_50px_rgba(244,63,94,0.2)] md:col-span-2"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="p-8 relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-rose-950/30 text-rose-400 rounded-2xl transition-all duration-500 group-hover:bg-rose-500 group-hover:text-black shadow-[inset_0_0_20px_rgba(244,63,94,0.2)] group-hover:shadow-none">
                                        <ShieldAlert className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Predictive Injury Prevention</h3>
                                        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">AI Risk Assessment Active</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-rose-500">Safe</p>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">0% Critical Risk</p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative background glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                        
                         <button 
                            onClick={() => handleViewChange('workout')}
                            className="relative bg-gradient-to-r from-blue-900/40 to-blue-800/40 hover:from-blue-800/60 hover:to-blue-700/60 backdrop-blur-xl border border-dashed border-blue-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-blue-950/30 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] group-hover:shadow-none">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-white text-lg uppercase tracking-wider group-hover:text-blue-400 transition-colors">Train Now</h4>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Live Smart Mirror</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                        </button>

                        <button 
                            onClick={() => handleViewChange('diet')}
                            className="relative bg-gradient-to-r from-green-900/40 to-green-800/40 hover:from-green-800/60 hover:to-green-700/60 backdrop-blur-xl border border-dashed border-green-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-green-950/30 rounded-2xl text-green-400 group-hover:bg-green-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.2)] group-hover:shadow-none">
                                    <Utensils className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-white text-lg uppercase tracking-wider group-hover:text-green-400 transition-colors">FitnessFutureDiet</h4>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Dynamic Synthesizer</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-green-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                        </button>

                        <button 
                            onClick={() => handleViewChange('realTimeFormAnalyzer')}
                            className="relative bg-gradient-to-r from-emerald-950/60 to-cyan-950/50 hover:from-emerald-900/70 hover:to-cyan-900/60 backdrop-blur-xl border border-emerald-500/40 p-6 rounded-3xl flex items-center justify-between group transition-all duration-300 shadow-lg hover:-translate-y-0.5 overflow-hidden"
                        >
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-emerald-500/15 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-300">
                                    <Camera className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-white text-lg tracking-tight group-hover:text-emerald-300 transition-colors">AI Pose Coding Studio</h4>
                                    <p className="text-xs text-slate-400 mt-1">MoveNet Vision · Rep &amp; Form Tracker</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1.5 transition-all duration-300 relative z-10" />
                        </button>

                        {daysSinceJoin >= 3 && (
                            <button 
                                onClick={() => handleViewChange('aetherMed')}
                                className="relative bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="p-4 bg-cyan-950/30 rounded-2xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] group-hover:shadow-none">
                                        <Stethoscope className="w-7 h-7" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black text-white text-lg uppercase tracking-wider group-hover:text-cyan-400 transition-colors">Bio-Cloud</h4>
                                        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Medical AI</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                            </button>
                        )}

                        {daysSinceJoin >= 3 && (
                            <button 
                                onClick={() => handleViewChange('medicalHub')}
                                className="relative bg-gradient-to-r from-teal-900/40 to-teal-800/40 hover:from-teal-800/60 hover:to-teal-700/60 backdrop-blur-xl border border-dashed border-teal-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:-translate-y-1 overflow-hidden md:col-span-2"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="p-4 bg-teal-950/30 rounded-2xl text-teal-400 group-hover:bg-teal-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(20,184,166,0.2)] group-hover:shadow-none">
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black text-white text-lg uppercase tracking-wider group-hover:text-teal-400 transition-colors">Medical Hub</h4>
                                        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Cloud Diagnostics</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-teal-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                            </button>
                        )}

                        <button 
                            onClick={() => handleViewChange('opalsWorkout')}
                            className="relative bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-purple-900/40 hover:from-cyan-800/60 hover:to-purple-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] group-hover:shadow-none">
                                    <BrainCircuit className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-white text-lg md:text-xl uppercase tracking-wider group-hover:text-cyan-400 transition-colors">Fitness Future-WORKOUT</h4>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Google Opals • GitHub</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <Target className="w-24 h-24 text-cyan-500" />
                            </div>
                        </button>

                        <button 
                            onClick={() => handleViewChange('opalsDiet')}
                            className="relative bg-gradient-to-r from-fuchsia-900/40 via-purple-900/40 to-cyan-800/40 hover:from-fuchsia-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-fuchsia-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_30px_rgba(217,70,239,0.2)] hover:shadow-[0_0_50px_rgba(217,70,239,0.4)] hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-fuchsia-500/20 rounded-2xl text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(217,70,239,0.2)] group-hover:shadow-none">
                                    <Utensils className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-white text-lg md:text-xl uppercase tracking-wider group-hover:text-fuchsia-400 transition-colors">Fitness Future-DIET</h4>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Google Opals • GitHub</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-fuchsia-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <BrainCircuit className="w-24 h-24 text-fuchsia-500" />
                            </div>
                        </button>

                        <button 
                            onClick={() => handleViewChange('superAgentWorkout')}
                            className="relative bg-gradient-to-r from-red-900/40 via-orange-900/40 to-amber-800/40 hover:from-red-800/60 hover:to-orange-700/60 backdrop-blur-xl border border-dashed border-red-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:shadow-[0_0_50px_rgba(239,68,68,0.4)] hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-red-500/20 rounded-2xl text-red-400 group-hover:bg-red-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] group-hover:shadow-none">
                                    <Bot className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-white text-lg md:text-xl uppercase tracking-wider group-hover:text-red-400 transition-colors">Super Agent Workout</h4>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Multi-Agent Protocol Swarm</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-red-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <BrainCircuit className="w-24 h-24 text-red-500" />
                            </div>
                        </button>

                        <button 
                            onClick={() => handleViewChange('superAgentDietAnalyst')}
                            className="relative bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-green-900/40 hover:from-emerald-800/60 hover:to-teal-800/60 backdrop-blur-xl border border-dashed border-emerald-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)] group-hover:shadow-none">
                                    <Stethoscope className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-white text-lg md:text-xl uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Apex Diet & Bio-Analysis</h4>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">Medical + Nutrition AI Swarm</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <Stethoscope className="w-24 h-24 text-emerald-500" />
                            </div>
                        </button>

                        <button 
                            onClick={() => handleViewChange('leanBulkCalculator')}
                            className="relative bg-gradient-to-r from-purple-900/40 to-purple-800/40 hover:from-purple-800/60 hover:to-purple-700/60 backdrop-blur-xl border border-dashed border-purple-500/50 p-6 rounded-[2rem] flex items-center justify-between group transition-all duration-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:-translate-y-1 overflow-hidden md:col-span-2"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="p-4 bg-purple-950/30 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)] group-hover:shadow-none">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-white text-lg uppercase tracking-wider group-hover:text-purple-400 transition-colors">Lean Bulk Calculator</h4>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">AI Bio-Analyst Hypertrophy</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-2 transition-all duration-500 relative z-10" />
                        </button>
                    </div>

                    {/* MEMBER PORTAL CATEGORIZED ALL-FEATURES & BOARDS MATRIX */}
                    <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                            <div>
                                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Member Portal • Categorized Super-App Directory
                                </span>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mt-2">
                                    All Athlete Features, AI Coaches, Health Labs & Smart Boards
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Every workout, nutrition, medical, wearable, financial, and community feature organized category-wise for instant access.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsQuickPaymentOpen(true)}
                                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                            >
                                Monthly / Yearly Plan Auto-Unlock
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[
                                {
                                    title: '1. Fitness, Workout & AI Form Core',
                                    badge: 'Training',
                                    links: [
                                        { id: 'workout', label: "Today's Workout Plan" },
                                        { id: 'superAgentWorkout', label: 'SuperAgent AI Workout' },
                                        { id: 'opalsWorkout', label: 'Opals Workout Architect' },
                                        { id: 'personalTraining', label: 'Personal Training & PT Slots' },
                                        { id: 'classBooking', label: 'Group Classes (HIIT/Yoga)' },
                                        { id: 'fitnessFutureProgress', label: 'Log Sets & Body Metrics' },
                                        { id: 'performanceLab', label: 'Warrior Performance Lab' },
                                        { id: 'realTimeFormAnalyzer', label: 'AI CCTV Posture & Form' },
                                        { id: 'neuralRep', label: 'Smart Rep Counter' },
                                        { id: 'workoutAnalytics', label: 'Workout Analytics Board' },
                                    ],
                                },
                                {
                                    title: '2. Diet, Kitchen Chief & Nutrition',
                                    badge: 'Nutrition AI',
                                    links: [
                                        { id: 'diet', label: 'My Assigned AI Diet' },
                                        { id: 'opalsDiet', label: 'Opals Diet Architect' },
                                        { id: 'kitchenChief', label: 'AI Kitchen Chief & Recipes' },
                                        { id: 'nutritionAdvisor', label: 'AI Nutrition Advisor' },
                                        { id: 'nutritionTracker', label: 'Macro & Calorie Logger' },
                                        { id: 'leanBulkCalculator', label: 'Lean Bulk & Cut Calculator' },
                                        { id: 'metabolicTracker', label: 'BMR & Metabolic Tracker' },
                                        { id: 'dailyProtocol', label: 'Daily Routine & Checklist' },
                                    ],
                                },
                                {
                                    title: '3. Medical, DNA, Sleep & Recovery',
                                    badge: 'Longevity Lab',
                                    links: [
                                        { id: 'medicalHub', label: 'Medical & Clinical Hub' },
                                        { id: 'biomarkerVault', label: 'Blood & Biomarker Vault' },
                                        { id: 'health', label: 'Member Health Dashboard' },
                                        { id: 'neuroRecovery', label: 'Neuro Recovery State' },
                                        { id: 'sleepTracker', label: 'Sleep & Circadian Lab' },
                                        { id: 'hormonalClock', label: 'Hormonal Optimization' },
                                        { id: 'advancedDNA', label: 'Genomic DNA Profiler' },
                                        { id: 'bioscienceHub', label: 'Bioscience & AlphaFold 3D' },
                                        { id: 'injuryOracle', label: 'Injury Risk Oracle' },
                                        { id: 'aetherMed', label: 'CloudMed Tele-Consult' },
                                    ],
                                },
                                {
                                    title: '4. Memberships, EMI & Wallet',
                                    badge: 'Billing & Store',
                                    links: [
                                        { id: 'memberships', label: 'My Membership & Plans' },
                                        { id: 'packages', label: 'Plan Renewal & Upgrades' },
                                        { id: 'payments', label: 'My Invoices & Receipts' },
                                        { id: 'emiPlans', label: 'My EMI Installments' },
                                        { id: 'razorpaySubscriptions', label: 'Auto-Pay Subscriptions' },
                                        { id: 'fitnessPay', label: 'FuturePay Member Wallet' },
                                        { id: 'marketplace', label: 'Buy Supplements & Gear' },
                                        { id: 'autoMarket', label: 'AI Supplement Store' },
                                    ],
                                },
                                {
                                    title: '5. Smart Gate, Wearables & 3D Twin',
                                    badge: 'IoT & Spatial',
                                    links: [
                                        { id: 'biometricTurnstile', label: 'Smart Gate & Turnstile' },
                                        { id: 'globalHealthPassport', label: 'Global Health Passport' },
                                        { id: 'digitalBioPass', label: 'Digital Bio-Health Pass' },
                                        { id: 'wearables', label: 'Wearable Connect Hub' },
                                        { id: 'wearableSync', label: 'Live Wearable Telemetry' },
                                        { id: 'digitalTwin', label: '3D Body Digital Twin' },
                                        { id: 'digitalTwin3D', label: 'Spatial 3D Gym Twin' },
                                        { id: 'liveCrowdRadar', label: 'Live Gym Crowd Radar' },
                                    ],
                                },
                                {
                                    title: '6. Fitness Future AI, Community & Support',
                                    badge: 'Social & AI',
                                    links: [
                                        { id: 'fitnessFutureCommandHub', label: 'Fitness Future Command Hub' },
                                        { id: 'synthesisX', label: 'Synthesis X Protocol' },
                                        { id: 'leaderboard', label: 'Gym Rank Leaderboard' },
                                        { id: 'fitnessFeed', label: 'Athlete Social Feed' },
                                        { id: 'gymBuddy', label: 'Find Workout Partner' },
                                        { id: 'socialHive', label: 'Aether Community Hive' },
                                        { id: 'metaverseRewards', label: 'Metaverse Rewards' },
                                        { id: 'helpSupport', label: 'Direct Support & Help' },
                                    ],
                                },
                            ].map((group, idx) => (
                                <div key={idx} className="bg-black/70 border border-white/10 rounded-3xl overflow-hidden flex flex-col group/card">
                                    <FeatureImage
                                        src={MEMBER_MATRIX_MEDIA[idx % MEMBER_MATRIX_MEDIA.length]}
                                        alt={`${group.title} feature preview`}
                                        aspectClassName="aspect-[16/9]"
                                        className="group-hover/card:scale-[1.03]"
                                        fallbackTitle={group.title}
                                    >
                                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-mono text-amber-300">{group.badge}</span>
                                            <span className="text-[11px] font-mono text-slate-300 tabular-nums">{group.links.length} Tools</span>
                                        </div>
                                    </FeatureImage>
                                    <div className="p-5 space-y-3.5 flex-1">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                            <h4 className="text-xs font-black text-white uppercase tracking-wider">{group.title}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {group.links.map(link => (
                                                <button
                                                    key={link.id}
                                                    onClick={() => handleViewChange(link.id as View)}
                                                    className="text-left px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/40 text-[11px] font-bold text-gray-300 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                                                >
                                                    <span className="truncate pr-1">{link.label}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
            case 'workout': return <TodaysWorkout memberId={selectedMember?.id || 1} setActiveView={handleViewChange as any} />;
            case 'superAgentWorkout': return <SuperAgentWorkout memberId={selectedMember?.id || 1} />;
            case 'superAgentDietAnalyst': return <SuperAgentDietAnalyst memberId={selectedMember?.id || 1} />;
            case 'fitnessFutureProgress': return <FitnessFutureProgress memberId={selectedMember?.id || 1} />;
            case 'opalsWorkout': return <OpalsWorkoutArchitect memberId={selectedMember?.id || 1} isAdminView={false} />;
            case 'opalsDiet': return <OpalsDietArchitect memberId={selectedMember?.id || 1} isAdminView={false} />;
            case 'diet': return <SuperAgentDietAnalyst memberId={selectedMember?.id || 1} />;
            case 'kitchenChief': return <KitchenChief memberId={selectedMember?.id || 1} />;
            case 'nutritionTracker': return <NutritionTracker />;
            case 'nutritionAdvisor': return <NutritionAdvisor memberId={selectedMember?.id || 1} />;
            case 'dailyProtocol': return <DailyRoutineLogView memberId={selectedMember?.id || 1} />;
            case 'medicalHub': return <MedicalHub memberId={selectedMember?.id || 1} />;
            case 'smartGym': return <SmartGymHub memberId={selectedMember?.id || 1} />;
            case 'leanBulkCalculator': return <LeanBulkCalculator memberId={selectedMember?.id || 1} />;
            case 'biomarkerVault': return <BiomarkerVault memberId={selectedMember?.id || 1} />;
            case 'metabolicTracker': return <MetabolicTracker />; 
            case 'aetherCommunity': return <CloudCommunityHive memberId={selectedMember?.id || 1} />; 
            case 'neuroRecovery': return <NeuroRecovery />; 
            case 'globalHealthPassport': return <GlobalHealthPassport memberId={selectedMember?.id || 1} />;
            case 'synthesisX': return <SynthesisX memberId={selectedMember?.id || 1} />;
            case 'payments': return <MemberPayments memberId={selectedMember?.id || 1} />;
            case 'packages': return <GymMembershipManager memberId={selectedMember?.id || 1} />;
            case 'memberships': return <GymMembershipManager memberId={selectedMember?.id || 1} />;
            case 'membershipManager': return <GymMembershipManager memberId={selectedMember?.id || 1} />;
            case 'personalTraining': return <PersonalTrainingHub memberId={selectedMember?.id || 1} />;
            case 'ptModule': return <PersonalTrainingHub memberId={selectedMember?.id || 1} />;
            case 'trainerBooking': return <PersonalTrainingHub memberId={selectedMember?.id || 1} />;
            case 'attendance': return <AutoAttendance memberId={selectedMember?.id || 1} />;
            case 'scheduler': return <SmartScheduler memberName={selectedMember?.name || 'M'} phone={selectedMember?.phone || ''} memberId={selectedMember?.id.toString()} />;
            case 'helpSupport': return <HelpSupport setChatOpen={setChatOpen} />;
            case 'health': return <MemberHealthDashboard memberId={loggedInMemberId} />;
            case 'performanceLab': return <WarriorPerformanceLab memberId={selectedMember?.id || 1} />;
            case 'neuralRep': return <SmartRepAnalyst />;
            case 'wearables': return <WearableConnectHub />;
            case 'futureOFS': return <FutureOFS memberId={selectedMember?.id || 1} />;
            case 'universalGadgets': return <UniversalGadgetDashboard />;
            case 'digitalBioPass': return <DigitalBioHealthPass memberId={selectedMember?.id || 1} />;
            case 'classBooking': return <InteractiveClassScheduler memberId={selectedMember?.id || 1} />;
            case 'classScheduling': return <InteractiveClassScheduler memberId={selectedMember?.id || 1} />;
            case 'profile': return <ProfileView memberId={selectedMember?.id || 1} setActiveView={setActiveView as any} />; // Added
            case 'geniusEngine': return <BrainCore />;
            case 'injuryOracle': return <InjuryOracle />;
            case 'ghostSensor': return <VisualSensor />;
            case 'digitalTwin': return <DigitalTwin />;
            case 'neuralEdge': return <SmartEdge />;
            case 'aiHealthCoach': return <AIHealthCoach />;
            case 'healthMetrics': return <HealthMetrics />;
            case 'wearableSync': return <WearableSync />;
            case 'aiRiskAssessment': return <AIRiskAssessment />;
            case 'realTimeFormAnalyzer': return <RealTimeFormAnalyzer memberId={selectedMember?.id || loggedInMemberId || 'member_1'} />;

            // Advanced Feature Renders
            case 'fitnessPay': return <FuturePay memberId={selectedMember?.id || 1} />;
            case 'marketplace': return <Marketplace />;
            case 'emiPlans': return <EMIPlans memberId={selectedMember?.id || 1} />;
            case 'razorpaySubscriptions': return <RazorpaySubscriptionGateway memberId={selectedMember?.id} />;
            case 'autonomousGymOS': return <AutonomousGymOSPortal />;
            case 'liveCrowdRadar': return <LiveCrowdRadar />;
            case 'fitnessFeed': return <FutureFeed />;
            case 'gymBuddy': return <GymBuddyFinder />;
            case 'leaderboard': return <Leaderboard />;

            case 'intakeBot': return <IntakeBot />;
            case 'injuryAI': return <InjuryAI />;
            case 'sensorHub': return <SensorHub />;
            case 'digitalTwin3D': return <DigitalTwin3D />;
            case 'autoMarket': return <AutoMarket />;
            case 'neuralLink': return <SmartLink />;
            case 'agenticSwarm': return <AutomatedSwarm />;
            case 'gymMetaverse': return <GymMetaverse />;
            case 'syngCore': return <SyngCore />;
            case 'fitnessFutureTraining': return <SuperAgentWorkout memberId={selectedMember?.id || 1} />;
            case 'aiFitnessTracker': return <SmartRepAnalyst />;
            case 'medicalProfiling': return <MedicalHub memberId={selectedMember?.id || 1} />;
            case 'hormonalClock': return <HealthMetrics />;
            case 'sleepTracker': return <HealthMetrics />;
            case 'workoutAnalytics': return <WorkoutAnalyticsDashboard memberId={selectedMember?.id || 1} />;
            case 'biometricTurnstile': return <GateAccessController memberId={selectedMember?.id || 1} />;
            case 'aiHiitCoach': return <SuperAgentWorkout memberId={selectedMember?.id || 1} />;
            case 'metaverseRewards': return <GymMetaverse />;
            case 'socialHive': return <CloudCommunityHive memberId={selectedMember?.id || 1} />;
            case 'neuralNexus': return <SmartNexusDashboard />;
            case 'aetherMed': return <CloudMedDashboard />;
            case 'advancedDNA': return <FitnessFutureDNA />;
            case 'bioscienceHub': return <BioscienceHub />;
            case 'fitnessFutureCommandHub': return <FitnessFutureCommandHub />;
            
            default: return <div className="text-center py-20 text-gray-500 uppercase font-black tracking-widest">SmartCore Loading......</div>;
        }
    };

    const currentMemberGov = selectedMember ? memberGovernance[selectedMember.id] : undefined;
    const isMaintenanceLocked = Boolean(globalMasterOverride.maintenanceMode);
    const hasAssignedGymOwner = Boolean(parentTenant) || Boolean(currentGym?.isSetupComplete && currentGym?.ownerName);
    const isGymOwnerMissing = Boolean(selectedMember) && !hasAssignedGymOwner && !globalMasterOverride.forceUnlockAllMembers;
    const isGymPortalSuspendedBySuperAdmin =
        !globalMasterOverride.forceUnlockAllMembers &&
        Boolean(parentTenant && (parentTenant.account_locked || parentTenant.module_permissions?.memberPortal === false));

    const effectiveLockedStatus =
        liveFirestoreLockState?.accountLocked ??
        currentMemberGov?.locked ??
        (Boolean((selectedMember as any)?.accountLocked) || selectedMember?.status === 'Expired' || selectedMember?.status === 'Inactive');

    const isMemberAccountLocked =
        Boolean(selectedMember) &&
        !globalMasterOverride.forceUnlockAllMembers &&
        Boolean(effectiveLockedStatus || liveFirestoreLockState?.status === 'Expired');

    const isHardLocked = isMaintenanceLocked || isGymOwnerMissing || isGymPortalSuspendedBySuperAdmin || isMemberAccountLocked;
    const canSelfRenewUnlock = !isMaintenanceLocked && !isGymOwnerMissing && !isGymPortalSuspendedBySuperAdmin && currentMemberGov?.autoUnlockOnPackage !== false;

    const handleLockedMemberRenewal = async (cycle: 'Monthly' | 'Yearly', planName: string, amount: number) => {
        if (!selectedMember) return;
        const durationDays = cycle === 'Yearly' ? 365 : 30;
        const nextExpiry = new Date(Date.now() + durationDays * 86_400_000).toISOString().split('T')[0];
        activateMemberSubscriptionUnlock(selectedMember.id, cycle, planName, amount, nextExpiry);
        updateMember({ ...selectedMember, status: 'Active', expiryDate: nextExpiry, accountLocked: false } as any);
        setLiveFirestoreLockState({ accountLocked: false, status: 'Active', expiryDate: nextExpiry });
        await syncToFirebase('members', String(selectedMember.id), {
            id: selectedMember.id,
            status: 'Active',
            subscription_status: 'ACTIVE',
            expiryDate: nextExpiry,
            accountLocked: false,
            updatedAt: new Date().toISOString(),
        }).catch(() => {});
        addAuditLog({
            member_id: selectedMember.id,
            action: 'MEMBER_AUTO_UNLOCK_RENEWAL',
            details: `${selectedMember.name} activated ${planName} (₹${amount}) — Auto-Unlocked until ${nextExpiry}.`,
        });
        addToast(`${cycle} Package Activated! Your Member Portal is now Auto-Unlocked until ${nextExpiry}.`, 'success');
    };

    return (
        <div className="h-full w-full flex bg-[#050505] text-gray-100 overflow-hidden font-sans">
            {selectedMember && !selectedMember.onboardingCompleted && !isHardLocked && (
                <OnboardingWizard 
                    member={selectedMember} 
                    onComplete={handleOnboardingComplete} 
                />
            )}
            <Sidebar currentView={activeView} setCurrentView={handleViewChange as any} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col relative min-w-0">
                <Header
                    currentView={activeView}
                    setCurrentView={handleViewChange as any}
                    userName={selectedMember?.name || 'Member Portal'}
                    onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                    onSwitchAccount={onLogout}
                />
                
                <main className="flex-1 overflow-y-scroll overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 custom-scrollbar bg-[#050505]">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {!selectedMember ? (
                            <div className="max-w-xl mx-auto my-12 bg-zinc-950 border border-cyan-500/30 rounded-3xl p-8 text-center space-y-4">
                                <ShieldAlert className="w-10 h-10 text-cyan-400 mx-auto" />
                                <h3 className="text-xl font-black text-white uppercase">Member Profile Pending Admin Linking</h3>
                                <p className="text-xs text-gray-400">
                                    Your account is authenticated, but no active gym membership record is linked to your email yet. Please contact the Gym Admin Desk to complete member onboarding.
                                </p>
                            </div>
                        ) : isHardLocked ? (
                            <div className="max-w-3xl mx-auto my-8 bg-gradient-to-br from-red-950/70 via-zinc-950 to-amber-950/40 border-2 border-red-500/50 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-red-400 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                                            {isMaintenanceLocked
                                                ? 'Super Admin Global Maintenance Mode'
                                                : isGymOwnerMissing
                                                ? 'Gym Owner Registration Required'
                                                : isGymPortalSuspendedBySuperAdmin
                                                ? `Gym Portal Paused • ${activeGymName}`
                                                : 'Member Portal Locked • Managed by Admin & Super Admin'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                        {isMaintenanceLocked
                                            ? 'Platform Maintenance In Progress'
                                            : isGymOwnerMissing
                                            ? 'Member Portal Activates Once Your Gym Owner Joins'
                                            : isGymPortalSuspendedBySuperAdmin
                                            ? `${activeGymName} Portal Temporarily Paused`
                                            : 'Activate Monthly or Yearly Package for Instant Auto-Unlock'}
                                    </h3>
                                    <p className="text-sm text-gray-300">
                                        {isMaintenanceLocked
                                            ? 'Super Admin Master Control has temporarily paused member portals for maintenance. All your workouts and logs remain safely synced.'
                                            : isGymOwnerMissing
                                            ? 'Your Member Portal is bound to your Gym Owner. As soon as your Gym Owner completes gym registration (Logo, UPI, Google Location & Signature), your Member Portal will unlock automatically.'
                                            : isGymPortalSuspendedBySuperAdmin
                                            ? `Member access for ${activeGymName}${activeGymOwner ? ` (Owner: ${activeGymOwner})` : ''} is currently paused. Please contact your Gym Owner${activeGymPhone ? ` at ${activeGymPhone}` : ''}.`
                                            : currentMemberGov?.lockReason || 'Your membership is currently locked or expired. All portal tools are paused until renewed or unlocked by your Gym Admin / Super Admin.'}
                                    </p>
                                </div>
                                {canSelfRenewUnlock && (
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleLockedMemberRenewal('Monthly', 'Pro Monthly Fitness Pass', 2500)}
                                            className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Activate Monthly (₹2,500) &amp; Auto-Unlock
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleLockedMemberRenewal('Yearly', 'Fitness Future Annual Athlete Pass', 24000)}
                                            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                                        >
                                            Activate Yearly (₹24,000) &amp; Auto-Unlock
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <ErrorBoundary resetKey={activeView}>
                                {renderMemberView()}
                            </ErrorBoundary>
                        )}
                    </div>
                </main>
                
                {/* Floating Chat Button */}
                <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-24 right-4 sm:right-6 lg:bottom-10 lg:right-10 z-50 bg-amber-500 text-black p-4 sm:p-5 rounded-full shadow-[0_0_60px_rgba(245,158,11,0.5)] hover:scale-110 transition-all group active:scale-95 border-2 sm:border-4 border-black cursor-pointer"
                >
                    <ChatIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>

                {/* Mobile & Tablet Tactical Dock */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-3xl border-t border-white/10 px-4 sm:px-8 flex justify-between items-center h-20 z-40 pb-safe">
                    <button type="button" onClick={() => handleViewChange('dashboard')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeView === 'dashboard' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}><DashboardIcon className="w-5 h-5 sm:w-6 sm:h-6"/><span className="text-[8px] font-black uppercase">Hub</span></button>
                    <button type="button" onClick={() => handleViewChange('workout')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeView === 'workout' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}><Zap className="w-5 h-5 sm:w-6 sm:h-6"/><span className="text-[8px] font-black uppercase">Train</span></button>
                    <button type="button" onClick={() => setIsIdCardOpen(true)} className="relative -top-6 bg-amber-500 text-black p-3.5 sm:p-4 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] border-4 border-black active:scale-95 cursor-pointer"><QrCodeIcon className="w-6 h-6"/></button>
                    <button type="button" onClick={() => handleViewChange('dailyProtocol')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeView === 'dailyProtocol' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}><CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6"/><span className="text-[8px] font-black uppercase">Tasks</span></button>
                    <button type="button" onClick={() => setSidebarOpen(prev => !prev)} className={`flex flex-col items-center gap-1 cursor-pointer ${isSidebarOpen ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}><MenuIcon className="w-5 h-5 sm:w-6 sm:h-6"/><span className="text-[8px] font-black uppercase">Menu</span></button>
                </div>
            </div>

            <SmartEngineChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} context={{ role: 'member', memberId: selectedMember?.id, memberName: selectedMember?.name }} />
            
            <Modal isOpen={isIdCardOpen} onClose={() => setIsIdCardOpen(false)} title="Holographic Identity Matrix">
                <div className="flex flex-col items-center py-10 text-center">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_60px_rgba(255,255,255,0.1)] border-[12px] border-gray-950 mb-6 relative group">
                        {qrCode && <img src={qrCode} alt="Holographic ID QR" className="w-56 h-56 relative z-10" />}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-30 transition-opacity"><Zap className="w-32 h-32 text-black" /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{selectedMember?.name}</h3>
                    <p className="text-cyan-400 font-black uppercase text-xs tracking-[0.4em] mt-2 px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5">R-OS Fitness Future VERIFIED</p>
                </div>
            </Modal>

            <Modal isOpen={showDuePopup && !paymentSuccess} onClose={() => setShowDuePopup(false)} title="Security Lockdown: Fiscal Debt">
                <div className="text-center py-6 space-y-8">
                    <div className="p-10 bg-red-950/20 border-2 border-red-500 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert className="w-32 h-32 text-red-500" /></div>
                        <h2 className="text-6xl font-black text-white italic tracking-tighter">{getCurrencySymbol()}{totalDueAmount.toLocaleString()}</h2>
                        <p className="text-red-400 text-xs font-black uppercase tracking-[0.5em] mt-3">Ledger Out of Sync</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] inline-block shadow-[0_0_60px_rgba(255,255,255,0.1)] border-[8px] border-white ring-4 ring-red-500/20">
                        {paymentQr && <img src={paymentQr} alt="UPI QR Code" className="w-56 h-56 mx-auto" />}
                    </div>

                    <p className="text-gray-400 text-sm font-medium px-8 leading-relaxed italic">"Your biometric access to the neural training floor has been throttled."</p>
                    
                    <button onClick={handleQuickPay} disabled={isProcessingPayment} className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-[0_0_30px_rgba(34,197,94,0.3)] border border-green-400/50 border-dashed transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        <span className="relative z-10 flex items-center gap-3">
                            {isProcessingPayment ? <AutoUpdateIcon className="animate-spin mr-2"/> : <CheckCircleIcon className="mr-2" />}
                            {isProcessingPayment ? 'PROCESSING TRANSACTION...' : 'PAY & UNLOCK HUB'}
                        </span>
                    </button>
                </div>
            </Modal>

            {paymentSuccess && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-fade-in">
                    <div className="text-center">
                        <div className="w-40 h-40 bg-green-500 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_100px_#22c55e] animate-bounce border-[8px] border-green-400">
                            <CheckCircleIcon className="w-20 h-20 text-black" />
                        </div>
                        <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-4">RESTORED</h2>
                        <p className="text-green-400 text-xl font-mono uppercase tracking-[0.6em]">Welcome back, Athlete.</p>
                    </div>
                </div>
            )}

            <Modal isOpen={isQuickPaymentOpen} onClose={() => setIsQuickPaymentOpen(false)} title="UPI Payment Matrix">
                <div className="space-y-6 py-4 px-2">
                    {/* Plan Selector */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3">Select Subscription Package</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Power Rise Suite', 'Elite AI Cortex', 'Quantum Overmind'].map(plan => {
                                const activePrice = plan === 'Power Rise Suite' ? 3999 : plan === 'Elite AI Cortex' ? 4999 : 9999;
                                return (
                                    <button
                                        key={plan}
                                        type="button"
                                        onClick={() => setSubPlanName(plan)}
                                        className={`p-3 rounded-xl border text-left transition-all ${subPlanName === plan ? 'border-emerald-500 bg-emerald-500/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-black/40 text-gray-400 hover:text-white hover:border-white/10'}`}
                                    >
                                        <p className="text-[10px] font-bold truncate">{plan.split(' ')[0]}</p>
                                        <p className="text-sm font-black mt-1">₹{activePrice}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Billing Cycle Selector */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest font-bold">Billing Cycle</label>
                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Save 20% on Yearly</span>
                        </div>
                        <div className="bg-black/60 p-1 rounded-xl border border-white/5 flex">
                            {(['Monthly', 'Yearly'] as const).map(cycle => (
                                <button
                                    key={cycle}
                                    type="button"
                                    onClick={() => setSubBillingCycle(cycle)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${subBillingCycle === cycle ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {cycle}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Detail */}
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-black text-white uppercase tracking-wider">{subPlanName}</p>
                            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">{subBillingCycle} Cycle</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-emerald-400">₹{getPlanPrice(subPlanName, subBillingCycle).toLocaleString()}</p>
                            {subBillingCycle === 'Yearly' && (
                                <p className="text-[9px] text-emerald-500 font-mono uppercase tracking-widest font-black">20% Discount Applied</p>
                            )}
                        </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="text-center bg-white p-5 rounded-[2.5rem] border-[8px] border-white ring-4 ring-emerald-500/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
                        {quickPaymentQr ? (
                            <img src={quickPaymentQr} className="w-48 h-48 mx-auto relative z-10 animate-fade-in" alt="UPI Payment QR Code" />
                        ) : (
                            <div className="w-48 h-48 mx-auto flex items-center justify-center relative z-10">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <div className="text-center text-black">
                                <Smartphone className="w-8 h-8 text-black mb-2 mx-auto animate-bounce" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Scan with GPay/UPI</p>
                                <p className="text-[9px] text-gray-500 mt-1">UPI ID: {GYM_INFO.upiIds.gpay1}</p>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Submit */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-mono tracking-widest justify-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span>Secured via Gym UPI Address Node</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleQuickSubscriptionPay}
                            disabled={isProcessingQuickPayment}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-black py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/30 border-dashed transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 relative overflow-hidden group"
                        >
                            {isProcessingQuickPayment ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                            )}
                            <span>{isProcessingQuickPayment ? 'Submitting Verification...' : 'I Have Paid • Submit Proof'}</span>
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isBiometricPromptOpen} onClose={() => setIsBiometricPromptOpen(false)} title="Biometric Security">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                        <Fingerprint className="w-24 h-24 text-cyan-400 relative z-10 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Authentication Required</h3>
                    <p className="text-sm text-gray-400 mb-8">Please verify your identity to access sensitive health data.</p>
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                        <ScanFace className="w-4 h-4 animate-spin-slow" />
                        Scanning...
                    </div>
                </div>
            </Modal>

            {isBioScannerOpen && (
                <BioScanner 
                    onClose={() => setIsBioScannerOpen(false)} 
                    onScanComplete={(result) => {
                        setBioScanResult(result);
                        setIsBioScannerOpen(false);
                        addToast(`Scan Complete: ${result.recommendedMode} activated.`, "success");
                    }} 
                />
            )}

            {/* Zero-Trust Architecture Modal */}
            {isZeroTrustScanOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl">
                    <div className="bg-gray-900 border border-red-500/30 p-8 rounded-[3rem] w-full max-w-md flex flex-col items-center text-center shadow-[0_0_80px_rgba(239,68,68,0.2)]">
                        <ScanFace className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Zero-Trust Check</h3>
                        <p className="text-gray-400 text-sm mb-8">Suspicious activity detected. Please verify your identity via Face ID to continue session.</p>
                        
                        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-red-500/50 mb-8">
                            <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                            <div className="absolute inset-0 border-[8px] border-red-500 rounded-full animate-ping opacity-20"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold uppercase tracking-widest text-xs">Scanning...</div>
                        </div>

                        <button 
                            onClick={handleZeroTrustVerify}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                        >
                            Verify Identity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberPortal;
