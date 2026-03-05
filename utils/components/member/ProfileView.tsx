
import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Shield, Camera, Save, Activity, Heart, Target, Calendar } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import Card from '../common/Card';

interface ProfileViewProps {
    memberId: number;
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

const ProfileView: React.FC<ProfileViewProps> = ({ memberId }) => {
    const { members, updateMember } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);

    const [formData, setFormData] = useState({
        name: member?.name || '',
        email: member?.email || '',
        phone: member?.phone || '',
        password: member?.password || '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    if (!member) return <div className="text-center py-20 text-gray-500">Member not found.</div>;

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

            updateMember(memberId, updatedData);
            addToast("Profile updated successfully", "success");
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '', password: updatedData.password || prev.password }));
        } catch (error) {
            addToast("Failed to update profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">My Neural Profile</h1>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">Manage your identity and security</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Stats */}
                <div className="space-y-6">
                    <Card className="bg-gray-900/50 border-white/5 p-8 rounded-[2.5rem] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
                        <div className="relative inline-block mb-6">
                            <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 p-1">
                                <img 
                                    src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`} 
                                    alt={member.name} 
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        </div>
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
                                    <p className="text-[8px] text-gray-500 uppercase font-bold">Neural XP</p>
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
                                <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-md text-[8px] font-black uppercase">Enabled</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Last Login</span>
                                <span className="text-[10px] text-gray-500 font-mono">Today, 10:45 AM</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-2">
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
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
