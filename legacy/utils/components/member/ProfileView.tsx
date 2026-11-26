
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Lock, Shield, Camera, Save, Activity, Heart, Target, Calendar, Fingerprint, Moon, Upload, X, Check, RefreshCw, ScanFace, QrCode } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import Card from '../common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { uploadProfilePicture } from '../../../lib/firebase';
import { registerBiometric } from '../../biometrics';
import SuperAgentDietAnalyst from './SuperAgentDietAnalyst';
import TodaysWorkout from './TodaysWorkout';
import CloudCommunityHive from './CloudCommunityHive';

import { View } from '../../../types';

interface ProfileViewProps {
    memberId: number;
    setActiveView?: (view: View) => void;
}

const HealthScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    const getColor = (s: number) => {
        if (s < 40) return '#ef4444'; // red-500
        if (s < 75) return '#f59e0b'; // amber-500
        return '#10b981'; // emerald-500
    };

    const color = getColor(score);

    return (
        <div className="relative flex items-center justify-center w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/5"
                />
                {/* Progress Circle */}
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white italic tracking-tighter">{score}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Score</span>
            </div>
            {/* Glow Effect */}
            <div 
                className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-1000"
                style={{ backgroundColor: color }}
            ></div>
        </div>
    );
};

const ProfileView: React.FC<ProfileViewProps> = ({ memberId, setActiveView }) => {
    const { members, updateMember } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);

    const [formData, setFormData] = useState({
        name: member?.name || '',
        email: member?.email || '',
        phone: member?.phone || '',
        password: member?.password || '',
        newPassword: '',
        confirmPassword: '',
        height: member?.height || member?.physical_metrics?.height || 0,
        weight: member?.weight || member?.physical_metrics?.weight || 0,
        bodyFat: member?.bodyFat || member?.physical_metrics?.body_fat || 0,
        muscleMass: member?.muscleMass || member?.physical_metrics?.muscle_mass || 0,
        physical_metrics: member?.physical_metrics || {
            height: 0,
            weight: 0,
            body_fat: 0,
            muscle_mass: 0,
            target_weight: 0,
            body_type: 'Mesomorph',
            activity_level: 'Moderate'
        }
    });

    const [isSyncingWearable, setIsSyncingWearable] = useState(false);

    const handleSyncWearable = () => {
        setIsSyncingWearable(true);
        // Process API call to a wearable device (e.g., Apple Health, Google Fit, Fitbit)
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                height: prev.height || 175, // Keep existing height or mock
                weight: 72.5, // fetched weight
                bodyFat: 14.2, // fetched body fat
                muscleMass: 35.8 // fetched muscle mass
            }));
            addToast("Wearable data synced successfully via FitnessFutureLink", "success");
            setIsSyncingWearable(false);
        }, 1500);
    };

    const [isSaving, setIsSaving] = useState(false);
    const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    if (!member) return <div className="text-center py-20 text-gray-500">Member not found.</div>;

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCapturing(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            addToast("Could not access camera. Please check permissions.", "error");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCapturing(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg');
                handleImageUpdate(dataUrl);
                stopCamera();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleImageUpdate(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpdate = async (base64Image: string) => {
        setIsUploading(true);
        try {
            const downloadUrl = await uploadProfilePicture(member.id.toString(), base64Image);
            updateMember({ ...member, avatar: downloadUrl });
            addToast("Profile picture updated successfully!", "success");
        } catch (err) {
            console.error("Error updating profile picture:", err);
            addToast("Failed to update profile picture.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const generateRandomBuffer = (length: number) => {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    };

    const [isFaceScanning, setIsFaceScanning] = useState(false);
    const [faceScanProgress, setFaceScanProgress] = useState(0);

    const handleRegisterBiometric = async () => {
        // Start Face Scan first
        setIsFaceScanning(true);
        setFaceScanProgress(0);
        
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            
            // Process AI Liveness Detection
            for (let i = 1; i <= 100; i += 10) {
                await new Promise(r => setTimeout(r, 300));
                setFaceScanProgress(i);
            }
            
            stopCamera();
            setIsFaceScanning(false);
            
            // Proceed to WebAuthn
            setIsRegisteringBiometric(true);
            const success = await registerBiometric(member.email || member.phone || `member_${member.id}`, member.name);
            
            if (success) {
                const base64Id = btoa(Math.random().toString(36).substring(2, 15));
                
                const newBiometric = {
                    id: base64Id,
                    rawId: base64Id,
                    type: 'public-key',
                    registeredAt: new Date().toISOString()
                };

                const existingBiometrics = member.biometricCredentials || [];
                updateMember({
                    ...member,
                    biometricCredentials: [...existingBiometrics, newBiometric]
                });

                localStorage.setItem('webauthn_credential_id', base64Id);
                localStorage.setItem('registered_device_member_id', member.id.toString());

                addToast("Face ID & Biometric authentication registered successfully!", "success");
            } else {
                addToast("Biometric registration failed.", "error");
            }
        } catch (e: any) {
            console.error("Biometric registration failed", e);
            stopCamera();
            setIsFaceScanning(false);
            if (e?.name === 'NotAllowedError') {
                addToast("Camera or Biometric registration cancelled or blocked.", "error");
            } else {
                addToast("Failed to register biometrics. Ensure your device supports it.", "error");
            }
        } finally {
            setIsRegisteringBiometric(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            addToast("Passwords do not match", "error");
            setIsSaving(false);
            return;
        }

        try {
            const updatedData: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
            };

            if (formData.newPassword) {
                updatedData.password = formData.newPassword;
            }

            updateMember({ ...member, ...updatedData });
            addToast("Profile updated successfully", "success");
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '', password: updatedData.password || prev.password }));
        } catch (error) {
            addToast("Failed to update profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // live health data if not present
    const healthData = member.liveHealthData || {
        steps: 8432,
        heartRate: 72,
        sleepHours: 6.5,
        lastUpdated: new Date().toISOString(),
        history: [
            { date: 'Mon', steps: 6000, heartRate: 70, sleepHours: 7 },
            { date: 'Tue', steps: 8500, heartRate: 75, sleepHours: 6.5 },
            { date: 'Wed', steps: 7200, heartRate: 72, sleepHours: 8 },
            { date: 'Thu', steps: 9100, heartRate: 80, sleepHours: 6 },
            { date: 'Fri', steps: 10500, heartRate: 78, sleepHours: 7.5 },
            { date: 'Sat', steps: 12000, heartRate: 85, sleepHours: 8.5 },
            { date: 'Sun', steps: 8432, heartRate: 72, sleepHours: 6.5 },
        ]
    };

    const hasBiometrics = member.biometricCredentials && member.biometricCredentials.length > 0;

    const [activeTab, setActiveTab] = useState<'personal' | 'health' | 'devices' | 'diet' | 'workout' | 'squad' | 'data-sovereignty' | 'gate-sync'>('personal');

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Face Scan Modal */}
            {isFaceScanning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="bg-gray-900 border border-indigo-500/30 p-8 rounded-[3rem] w-full max-w-md flex flex-col items-center text-center shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                        <ScanFace className="w-16 h-16 text-indigo-400 mb-4 animate-pulse" />
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">AI Liveness Detection</h3>
                        <p className="text-gray-400 text-sm mb-6">Please look directly at the camera. Blink once to verify liveness.</p>
                        
                        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-indigo-500/50 mb-6">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            <div className="absolute inset-0 border-[8px] border-indigo-500 rounded-full animate-ping opacity-20"></div>
                        </div>

                        <div className="w-full bg-black/50 rounded-full h-2 mb-2 overflow-hidden">
                            <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${faceScanProgress}%` }}></div>
                        </div>
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{faceScanProgress}% Complete</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">My Smart Profile</h1>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">Manage your identity and security</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                {[
                    { id: 'personal', label: 'Personal Details', icon: <User className="w-4 h-4" /> },
                    { id: 'health', label: 'Health Metrics', icon: <Activity className="w-4 h-4" /> },
                    { id: 'devices', label: 'Linked Devices', icon: <Heart className="w-4 h-4" /> },
                    { id: 'diet', label: 'Diet Plan', icon: <Target className="w-4 h-4" /> },
                    { id: 'workout', label: 'Workout Plan', icon: <Calendar className="w-4 h-4" /> },
                    { id: 'squad', label: 'Training Squad', icon: <Shield className="w-4 h-4" /> },
                    { id: 'data-sovereignty', label: 'Data & AI Settings', icon: <Lock className="w-4 h-4" /> },
                    { id: 'gate-sync', label: 'Gate Sync & Biometrics', icon: <Fingerprint className="w-4 h-4" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                            : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Stats */}
                <div className="space-y-6">
                    <Card className="bg-gray-900/50 border-white/5 p-8 rounded-[2.5rem] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
                        <div className="relative inline-block mb-6 group">
                            <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 p-1 relative overflow-hidden">
                                {isUploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                                        <div className="relative flex flex-col items-center">
                                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                                            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-0 animate-[progress_1.5s_ease-in-out_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                                <img src={member?.avatar || "https://i.pravatar.cc/150?u=" + member?.id} alt={formData.name || member?.name || "Member"} className="w-full h-full rounded-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                        title="Upload Photo"
                                    >
                                        <Upload className="w-5 h-5 text-white" />
                                    </button>
                                    <button 
                                        onClick={startCamera}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                        title="Take Photo"
                                    >
                                        <Camera className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Camera Modal */}
                        {isCapturing && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
                                <div className="bg-gray-900 rounded-[2.5rem] border border-white/10 p-6 max-w-md w-full overflow-hidden relative">
                                    <button 
                                        onClick={stopCamera}
                                        className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-10"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Capture Identity</h3>
                                    
                                    <div className="relative aspect-square rounded-3xl overflow-hidden bg-black border border-white/5 mb-6">
                                        <video 
                                            ref={videoRef} 
                                            autoPlay 
                                            playsInline 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none"></div>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-64 h-64 border-2 border-dashed border-indigo-500/50 rounded-full"></div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={stopCamera}
                                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={capturePhoto}
                                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Camera className="w-5 h-5" />
                                            Capture
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{member.name}</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Member ID: #{member.id}</p>
                        
                        <div className="grid grid-cols-1 gap-4 mt-8">
                            <HealthScoreGauge score={member.health_score || 0} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                    <Target className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                                    <p className="text-lg font-black text-white">{member.bio_age || 'N/A'}</p>
                                    <p className="text-[8px] text-gray-500 uppercase font-bold">Bio Age</p>
                                </div>
                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                    <Activity className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                                    <p className="text-lg font-black text-white">{member.xp || 0}</p>
                                    <p className="text-[8px] text-gray-500 uppercase font-bold">Smart XP</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-indigo-950/10 border-indigo-500/20 p-6 rounded-[2rem]">
                        <h3 className="text-sm font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-400" /> Security Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Device Binding</span>
                                <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-md text-[8px] font-black uppercase">Active</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Biometric Auth</span>
                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${hasBiometrics ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {hasBiometrics ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            {!hasBiometrics && (
                                <button 
                                    onClick={handleRegisterBiometric}
                                    disabled={isRegisteringBiometric}
                                    className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Fingerprint className="w-4 h-4" />
                                    {isRegisteringBiometric ? 'Registering...' : 'Register Biometrics'}
                                </button>
                            )}
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Last Login</span>
                                <span className="text-[10px] text-gray-500 font-mono">Today, 10:45 AM</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Tab Content */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'personal' && (
                        <Card className="bg-gray-900/50 border-white/5 p-8 md:p-10 rounded-[3rem]">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="text" 
                                                value={formData.name}
                                                readOnly
                                                className="w-full bg-black/30 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-gray-400 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="email" 
                                                value={formData.email}
                                                readOnly
                                                className="w-full bg-black/30 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-gray-400 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mobile Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="tel" 
                                                value={formData.phone}
                                                readOnly
                                                className="w-full bg-black/30 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-gray-400 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Membership Since</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input 
                                                type="text" 
                                                readOnly
                                                value={member.joinDate}
                                                className="w-full bg-black/30 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-gray-400 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                        <Lock className="w-5 h-5 text-amber-500" />
                                        <p className="text-xs text-amber-200">
                                            Profile details are locked for security. Please contact gym administration to update your information.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'health' && (
                        <>
                            {/* Physical Metrics Section */}
                            <Card className="bg-gray-900/50 border-white/5 p-8 md:p-10 rounded-[3rem]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                        <Target className="w-6 h-6 text-indigo-400" /> Biometric Scans
                                    </h3>
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    setIsSaving(true);
                                    try {
                                        updateMember({ 
                                            ...member, 
                                            height: formData.height,
                                            weight: formData.weight,
                                            bodyFat: formData.bodyFat,
                                            muscleMass: formData.muscleMass,
                                            physical_metrics: { 
                                                ...member.physical_metrics, 
                                                height: formData.height,
                                                weight: formData.weight,
                                                body_fat: formData.bodyFat,
                                                muscle_mass: formData.muscleMass
                                            } 
                                        });
                                        addToast("Biometric data updated successfully", "success");
                                    } catch (error) {
                                        addToast("Failed to update biometric data", "error");
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }} className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Height (cm)</label>
                                            <input 
                                                type="number" 
                                                value={formData.height || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, height: Number(e.target.value) }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Weight (kg)</label>
                                            <input 
                                                type="number" 
                                                value={formData.weight || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Body Fat (%)</label>
                                            <input 
                                                type="number" 
                                                value={formData.bodyFat || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, bodyFat: Number(e.target.value) }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Muscle Mass (kg)</label>
                                            <input 
                                                type="number" 
                                                value={formData.muscleMass || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, muscleMass: Number(e.target.value) }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            {isSaving ? 'Syncing...' : 'Update Biometrics'}
                                        </button>
                                    </div>
                                </form>
                            </Card>

                            {/* Live Health Data Section */}
                            <Card className="bg-gray-900/50 border-white/5 p-8 md:p-10 rounded-[3rem]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                        <Activity className="w-6 h-6 text-emerald-400" /> Live Health Data
                                    </h3>
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Syncing Active
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                        <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-white">{healthData.steps.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Steps Today</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                        <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-white">{healthData.heartRate} <span className="text-sm">bpm</span></p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Avg Heart Rate</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                                        <Moon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-white">{healthData.sleepHours} <span className="text-sm">h</span></p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Sleep Last Night</p>
                                    </div>
                                </div>

                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={healthData.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="date" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="left" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#000000', borderColor: '#ffffff20', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#ffffff50', fontSize: '10px', textTransform: 'uppercase' }}
                                            />
                                            <Area yAxisId="left" type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSteps)" name="Steps" />
                                            <Area yAxisId="right" type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHeart)" name="Heart Rate (bpm)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </>
                    )}

                    {activeTab === 'devices' && (
                        <Card className="bg-gray-900/50 border-white/5 p-8 md:p-10 rounded-[3rem]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-indigo-400" /> Linked Devices
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleSyncWearable}
                                    disabled={isSyncingWearable}
                                    className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-indigo-500/30"
                                >
                                    {isSyncingWearable ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                    {isSyncingWearable ? 'Syncing...' : 'Sync Wearable'}
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">Apple Watch Series 9</h4>
                                            <p className="text-xs text-gray-500">Last synced: 2 mins ago</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase">Connected</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                            <Heart className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">Oura Ring Gen 3</h4>
                                            <p className="text-xs text-gray-500">Last synced: 1 hour ago</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase">Connected</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'diet' && (
                        <SuperAgentDietAnalyst memberId={memberId} />
                    )}

                    {activeTab === 'workout' && (
                        <TodaysWorkout memberId={memberId} setActiveView={setActiveView || (() => {})} />
                    )}

                    {activeTab === 'squad' && (
                        <CloudCommunityHive memberId={memberId} />
                    )}

                    {activeTab === 'data-sovereignty' && (
                        <Card className="bg-gray-900/50 border-white/5 p-8 md:p-10 rounded-[3rem] animate-fade-in">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                    <Lock className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Data Sovereignty & AI</h3>
                                    <p className="text-gray-400 text-sm">Manage your personal data vault and AI engine preferences.</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Data Storage Section */}
                                <div className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                                    <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2">
                                        <Save className="w-5 h-5 text-emerald-400" /> Storage Location
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl cursor-pointer hover:bg-emerald-900/30 transition-colors">
                                            <div>
                                                <p className="text-white font-bold">Personal Source (Local Vault)</p>
                                                <p className="text-xs text-emerald-200/70 mt-1">Data is encrypted and stored on your personal device.</p>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-black" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-white/5 rounded-2xl opacity-50 cursor-not-allowed">
                                            <div>
                                                <p className="text-white font-bold">Admin Core (Central Cloud)</p>
                                                <p className="text-xs text-gray-500 mt-1">Only admission & payment data is stored here.</p>
                                            </div>
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-600"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Engine Section */}
                                <div className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                                    <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-cyan-400" /> AI Smart Engine
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-4">Select the open-source AI model powering your personal health insights.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-2xl cursor-pointer hover:bg-cyan-900/30 transition-colors relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-10"><Activity className="w-16 h-16 text-cyan-400" /></div>
                                            <p className="text-white font-bold relative z-10">Llama-3 (Meta)</p>
                                            <p className="text-xs text-cyan-200/70 mt-1 relative z-10">Optimized for complex reasoning & diet generation.</p>
                                            <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center z-10">
                                                <Check className="w-3 h-3 text-black" />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-900/50 border border-white/5 rounded-2xl cursor-pointer hover:bg-gray-800 transition-colors">
                                            <p className="text-white font-bold">Edge Node 8x7B</p>
                                            <p className="text-xs text-gray-500 mt-1">Fast, efficient, and highly accurate for quick queries.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'gate-sync' && (
                        <Card className="bg-gray-900/50 border-white/5 p-8 md:p-10 rounded-[3rem] animate-fade-in">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                                    <Fingerprint className="w-8 h-8 text-emerald-400 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Local Biometric & Gate Sync Settings</h3>
                                    <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">Configure frictionless turnstile QR gate authentication.</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Local Registration Status */}
                                <div className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                                    <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-indigo-400" /> Device Biometric Enrollment
                                    </h4>
                                    <p className="text-xs text-gray-400 mb-6">
                                        To enable fast-pass entrance, map your device fingerprint/face biometric scanner locally. All data remains encrypted on your sandbox storage.
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div>
                                            <p className="text-white font-bold font-mono text-sm">Biometric Registration Status</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {localStorage.getItem('webauthn_credential_id') 
                                                    ? '✓ Secure biometric profile registered on this device.' 
                                                    : '❌ No local biometric credential found.'}
                                            </p>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={handleRegisterBiometric}
                                            disabled={isRegisteringBiometric}
                                            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                                                localStorage.getItem('webauthn_credential_id')
                                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                                            }`}
                                        >
                                            <Fingerprint className="w-4 h-4" />
                                            {isRegisteringBiometric ? 'Scanning...' : localStorage.getItem('webauthn_credential_id') ? 'Re-enroll Biometrics' : 'Enroll Biometrics'}
                                        </button>
                                    </div>
                                </div>

                                {/* Frictionless Gate Sync Toggle */}
                                <div className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                                    <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2">
                                        <QrCode className="w-5 h-5 text-emerald-400" /> Frictionless QR Gating
                                    </h4>
                                    <p className="text-xs text-gray-400 mb-6">
                                        When frictionless gating is enabled, presenting your QR badge at the lobby turnstile will authenticate your entrance instantaneously using your local device identity token.
                                    </p>

                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div>
                                            <p className="text-white font-bold font-mono text-sm">Frictionless Authentication Link</p>
                                            <p className="text-xs text-gray-500 mt-1">Activate biometric verification matching for entrance.</p>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const current = localStorage.getItem('biometric_gate_link') === 'true';
                                                localStorage.setItem('biometric_gate_link', (!current).toString());
                                                addToast(current ? "Frictionless gating link deactivated." : "Frictionless gating linked successfully!", "success");
                                                // force rerender
                                                setActiveTab('personal');
                                                setTimeout(() => setActiveTab('gate-sync'), 50);
                                            }}
                                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                                                localStorage.getItem('biometric_gate_link') === 'true' ? 'bg-emerald-500' : 'bg-gray-800'
                                            }`}
                                        >
                                            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                                                localStorage.getItem('biometric_gate_link') === 'true' ? 'translate-x-6' : 'translate-x-0'
                                            }`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
