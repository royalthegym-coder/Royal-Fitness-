import { useCurrencyStore } from '../store/useCurrencyStore';
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataProvider';
import { Package, Member, Invoice } from '../../types';
import Modal from './common/Modal';
import { 
    CheckCircle2, Plus, Edit, Trash2, Crown, Zap, Shield, 
    Sparkles, Layers, ArrowRight, Eye, HelpCircle, Check, X,
    Star, Award, TrendingUp, Users, DollarSign, Calendar, Clock,
    Dumbbell, Flame, HeartHandshake, Loader2, Search, Filter,
    AlertTriangle, RefreshCw, CreditCard, UserPlus, CheckCircle, AlertCircle
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { calculateExpiryDate } from '../../lib/whatsapp';

// Helper to compute exact expiry date and days remaining
const computeMembershipExpiry = (joinDateStr: string, durationStr: string) => {
    const start = joinDateStr ? new Date(joinDateStr) : new Date();
    const validStart = isNaN(start.getTime()) ? new Date() : new Date(start);
    const expiry = new Date(validStart);
    const lower = (durationStr || '1 Month').toLowerCase();

    if (lower.includes('year') || lower.includes('annual') || lower.includes('12 month')) {
        expiry.setFullYear(expiry.getFullYear() + 1);
    } else if (lower.includes('6 month') || lower.includes('half')) {
        expiry.setMonth(expiry.getMonth() + 6);
    } else if (lower.includes('3 month') || lower.includes('quarter')) {
        expiry.setMonth(expiry.getMonth() + 3);
    } else if (lower.includes('week')) {
        const weeks = parseInt(lower) || 1;
        expiry.setDate(expiry.getDate() + weeks * 7);
    } else if (lower.includes('day') || lower.includes('session')) {
        const days = parseInt(lower) || 30;
        expiry.setDate(expiry.getDate() + days);
    } else {
        const months = parseInt(lower) || 1;
        expiry.setMonth(expiry.getMonth() + months);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expCopy = new Date(expiry);
    expCopy.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expCopy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedExpiry = expiry.toISOString().split('T')[0];

    let lifecycleStatus: 'Active' | 'Expiring Soon' | 'Expired' = 'Active';
    if (diffDays < 0) {
        lifecycleStatus = 'Expired';
    } else if (diffDays <= 7) {
        lifecycleStatus = 'Expiring Soon';
    }

    return {
        expiryDate: formattedExpiry,
        daysRemaining: diffDays,
        lifecycleStatus
    };
};

const inferTierLabel = (durationStr: string): 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Custom' => {
    const lower = (durationStr || '').toLowerCase();
    if (lower.includes('year') || lower.includes('annual') || lower.includes('12 month')) return 'Annual';
    if (lower.includes('6 month') || lower.includes('half')) return 'Half-Yearly';
    if (lower.includes('3 month') || lower.includes('quarter')) return 'Quarterly';
    if (lower.includes('1 month') || lower.includes('month')) return 'Monthly';
    return 'Custom';
};

// --- VISUAL ASSETS & THEMES ---
const getCategoryTheme = (category: string) => {
    switch (category) {
        case 'General':
            return {
                gradient: 'from-amber-900/40 via-gray-900 to-black',
                border: 'border-amber-500/30',
                accent: 'text-amber-400',
                badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                button: 'bg-amber-500 hover:bg-amber-400 text-black',
                icon: Shield
            };
        case 'Personal Training':
            return {
                gradient: 'from-red-900/40 via-gray-900 to-black',
                border: 'border-red-500/30',
                accent: 'text-red-500',
                badge: 'bg-red-500/20 text-red-300 border-red-500/40',
                button: 'bg-red-600 hover:bg-red-500 text-white',
                icon: Flame
            };
        case 'Group Classes':
            return {
                gradient: 'from-purple-900/40 via-gray-900 to-black',
                border: 'border-purple-500/30',
                accent: 'text-purple-400',
                badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                button: 'bg-purple-600 hover:bg-purple-500 text-white',
                icon: Users
            };
        case 'Corporate':
        case 'Couple/Family':
            return {
                gradient: 'from-emerald-900/40 via-gray-900 to-black',
                border: 'border-emerald-500/30',
                accent: 'text-emerald-400',
                badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                button: 'bg-emerald-500 hover:bg-emerald-400 text-black',
                icon: HeartHandshake
            };
        default:
            return {
                gradient: 'from-blue-900/40 via-gray-900 to-black',
                border: 'border-blue-500/30',
                accent: 'text-blue-400',
                badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                button: 'bg-blue-500 hover:bg-blue-400 text-black',
                icon: Zap
            };
    }
};

// --- SUB-COMPONENTS ---

const PackageCard: React.FC<{ 
    pkg: Package; 
    memberCount: number;
    onEdit: (pkg: Package) => void; 
    onDelete: (id: number) => void;
    onSelect: (pkg: Package) => void;
    onEnrollMember: (pkg: Package) => void;
}> = ({ pkg, memberCount, onEdit, onDelete, onSelect, onEnrollMember }) => {
    const { formatCurrency: formatPrice } = useCurrencyStore();
    const theme = getCategoryTheme(pkg.category);
    const Icon = theme.icon;
    const tierBadge = inferTierLabel(pkg.duration);

    return (
        <div 
            onClick={() => onSelect(pkg)}
            className={`group relative rounded-[2.5rem] p-1 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer flex flex-col h-full bg-gradient-to-b ${theme.border} from-white/10 to-transparent`}
        >
            <div className={`relative h-full w-full rounded-[2.3rem] bg-[#0a0a0a] overflow-hidden flex flex-col justify-between p-6 md:p-8 border border-white/5`}>
                
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${theme.gradient} opacity-20 blur-[80px] rounded-full pointer-events-none group-hover:opacity-40 transition-opacity`} />
                
                {pkg.image && (
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover grayscale contrast-125" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                    </div>
                )}

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6 gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${theme.badge} flex items-center gap-2 shadow-lg`}>
                                <Icon className="w-3 h-3" /> {pkg.category}
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/15">
                                {tierBadge} Tier
                            </span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onEdit(pkg)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors" title="Edit Plan">
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDelete(pkg.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-full text-red-400 backdrop-blur-md transition-colors" title="Delete Plan">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                        {pkg.name}
                    </h3>
                    
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className={`text-4xl font-black tracking-tight ${theme.accent}`}>
                            {formatPrice(pkg.price)}
                        </span>
                        <span className="text-xs text-gray-500 font-mono uppercase">/ {pkg.duration}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-5 text-[11px] font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 w-fit">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span><strong className="text-white">{memberCount}</strong> Enrolled Members</span>
                    </div>

                    {pkg.details && (
                        <p className="text-xs text-gray-400 leading-relaxed mb-6 border-l-2 border-white/10 pl-3 line-clamp-2">
                            {pkg.details}
                        </p>
                    )}

                    <div className="w-full h-px bg-white/5 mb-6" />

                    <ul className="space-y-3 mb-8">
                        {pkg.features.slice(0, 5).map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 text-xs text-gray-300">
                                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${theme.accent}`} />
                                <span className="leading-snug">{feat}</span>
                            </li>
                        ))}
                        {pkg.features.length > 5 && (
                            <li className="text-[10px] text-gray-500 font-mono pl-7 uppercase tracking-wider">
                                + {pkg.features.length - 5} More Features...
                            </li>
                        )}
                    </ul>
                </div>

                <div className="relative z-10 mt-auto grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => onSelect(pkg)}
                        className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 transition-all bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    <button 
                        onClick={() => onEnrollMember(pkg)}
                        className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-lg ${theme.button} cursor-pointer`}
                    >
                        <UserPlus className="w-3.5 h-3.5" /> Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPARISON MATRIX ---
const ComparisonView: React.FC<{ packages: Package[]; onEnrollMember: (pkg: Package) => void }> = ({ packages, onEnrollMember }) => {
    const { formatCurrency: formatPrice } = useCurrencyStore();
    const allFeatures = useMemo(() => {
        const set = new Set<string>();
        packages.forEach(p => p.features.forEach(f => set.add(f)));
        return Array.from(set);
    }, [packages]);

    return (
        <div className="overflow-x-auto pb-6 custom-scrollbar animate-fade-in">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="p-4 bg-[#0a0a0a] sticky left-0 z-20 border-b border-r border-white/10 min-w-[200px]">
                            <span className="text-xs font-black uppercase text-gray-500 tracking-widest">Features Matrix</span>
                        </th>
                        {packages.map(pkg => (
                            <th key={pkg.id} className="p-4 bg-gray-900/40 border-b border-white/10 min-w-[220px] text-center">
                                <p className="text-[10px] font-mono uppercase text-cyan-400 mb-1">{inferTierLabel(pkg.duration)} Tier</p>
                                <p className="text-sm font-black text-white uppercase">{pkg.name}</p>
                                <p className="text-lg font-bold text-amber-400 mt-1">{formatPrice(pkg.price)}</p>
                                <span className="text-[9px] text-gray-500 font-mono uppercase block mb-3">{pkg.duration}</span>
                                <button
                                    onClick={() => onEnrollMember(pkg)}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    + Sign Up Member
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                    {allFeatures.map((feat, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="p-4 bg-[#0a0a0a] sticky left-0 z-10 border-r border-white/10 font-medium text-gray-300">
                                {feat}
                            </td>
                            {packages.map(pkg => {
                                const hasFeature = pkg.features.includes(feat);
                                return (
                                    <td key={pkg.id} className="p-4 text-center">
                                        {hasFeature ? (
                                            <div className="inline-flex p-1 rounded-full bg-green-500/20 text-green-400">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <span className="text-gray-700">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const Packages: React.FC = () => {
    const { formatCurrency: formatPrice } = useCurrencyStore();
    const { 
        packages, addPackage, updatePackage, deletePackage, 
        members, addMember, updateMember, 
        invoices, addInvoice, updateInvoiceStatus, addTransaction 
    } = useData();
    const { addToast } = useToast();
    
    const [viewMode, setViewMode] = useState<'grid' | 'tracking' | 'comparison'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPkgForDetail, setSelectedPkgForDetail] = useState<Package | null>(null);
    const [editingPkg, setEditingPkg] = useState<Package | null>(null);

    // Member Sign-Up / Tier Assignment Modal State
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [enrollMode, setEnrollMode] = useState<'new' | 'existing'>('new');
    const [selectedMemberIdForEnroll, setSelectedMemberIdForEnroll] = useState<number>(members[0]?.id || 0);
    const [enrollPackageId, setEnrollPackageId] = useState<number>(packages[0]?.id || 1);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [enrollJoinDate, setEnrollJoinDate] = useState(new Date().toISOString().split('T')[0]);
    const [enrollPaymentStatus, setEnrollPaymentStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Paid');
    const [enrollPaymentMethod, setEnrollPaymentMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Online'>('UPI');

    // Tracking Tab Filters
    const [trackingSearch, setTrackingSearch] = useState('');
    const [lifecycleFilter, setLifecycleFilter] = useState<'All' | 'Active' | 'Expiring Soon' | 'Expired'>('All');
    const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
    const [tierFilter, setTierFilter] = useState<'All' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual'>('All');

    // Form State for Package Creator
    const [formData, setFormData] = useState<Partial<Package>>({
        name: '', category: 'General', price: 0, duration: '1 Month', features: [], details: '', image: ''
    });
    const [featureInput, setFeatureInput] = useState('');
    const [isGeneratingTier, setIsGeneratingTier] = useState(false);

    // Dynamic Categories
    const categories = ['All', 'General', 'Personal Training', 'Group Classes', 'Corporate', 'Couple/Family'];

    const filteredPackages = useMemo(() => {
        if (selectedCategory === 'All') return packages;
        return packages.filter(p => p.category === selectedCategory);
    }, [packages, selectedCategory]);

    // Enriched Member Subscription Tracking Records
    const memberSubscriptionRecords = useMemo(() => {
        return members.map(member => {
            const pkg = packages.find(p => p.id === member.packageId) || packages[0] || {
                id: 1,
                name: 'Monthly Standard Tier',
                category: 'General',
                price: 2500,
                duration: '1 Month',
                features: ['Full Gym Access']
            };
            const { expiryDate, daysRemaining, lifecycleStatus } = computeMembershipExpiry(member.joinDate, pkg.duration);
            const tierLabel = inferTierLabel(pkg.duration);

            // Find latest invoice for this member
            const memberInvoices = invoices
                .filter(inv => inv.memberId === member.id || inv.memberName.toLowerCase() === member.name.toLowerCase())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const latestInvoice = memberInvoices[0];
            let paymentStatus: 'Paid' | 'Pending' | 'Overdue' = 'Paid';
            if (latestInvoice) {
                if (latestInvoice.status === 'Overdue' || latestInvoice.status === 'Rejected') {
                    paymentStatus = 'Overdue';
                } else if (latestInvoice.status === 'Pending' || latestInvoice.status === 'Verification Pending') {
                    paymentStatus = 'Pending';
                } else {
                    paymentStatus = 'Paid';
                }
            } else if (member.status === 'Pending') {
                paymentStatus = 'Pending';
            } else if (lifecycleStatus === 'Expired') {
                paymentStatus = 'Overdue';
            }

            return {
                member,
                pkg,
                tierLabel,
                joinDate: member.joinDate,
                expiryDate,
                daysRemaining,
                lifecycleStatus,
                paymentStatus,
                latestInvoice
            };
        });
    }, [members, packages, invoices]);

    const filteredSubscriptionRecords = useMemo(() => {
        return memberSubscriptionRecords.filter(rec => {
            const q = trackingSearch.toLowerCase().trim();
            const matchesSearch = !q ||
                rec.member.name.toLowerCase().includes(q) ||
                rec.member.email.toLowerCase().includes(q) ||
                rec.member.phone.toLowerCase().includes(q) ||
                rec.pkg.name.toLowerCase().includes(q);
            const matchesLifecycle = lifecycleFilter === 'All' || rec.lifecycleStatus === lifecycleFilter;
            const matchesPayment = paymentFilter === 'All' || rec.paymentStatus === paymentFilter;
            const matchesTier = tierFilter === 'All' || rec.tierLabel === tierFilter;
            return matchesSearch && matchesLifecycle && matchesPayment && matchesTier;
        });
    }, [memberSubscriptionRecords, trackingSearch, lifecycleFilter, paymentFilter, tierFilter]);

    // Stats Calculation
    const stats = useMemo(() => {
        const total = packages.length;
        const avgPrice = total > 0 ? Math.round(packages.reduce((acc, p) => acc + p.price, 0) / total) : 0;
        const activeCount = memberSubscriptionRecords.filter(r => r.lifecycleStatus === 'Active').length;
        const expiringSoonCount = memberSubscriptionRecords.filter(r => r.lifecycleStatus === 'Expiring Soon').length;
        const expiredCount = memberSubscriptionRecords.filter(r => r.lifecycleStatus === 'Expired').length;
        const paidRevenue = memberSubscriptionRecords
            .filter(r => r.paymentStatus === 'Paid')
            .reduce((sum, r) => sum + r.pkg.price, 0);
        const pendingDues = memberSubscriptionRecords
            .filter(r => r.paymentStatus !== 'Paid')
            .reduce((sum, r) => sum + r.pkg.price, 0);

        return { total, avgPrice, activeCount, expiringSoonCount, expiredCount, paidRevenue, pendingDues };
    }, [packages, memberSubscriptionRecords]);

    // Handlers
    const handleOpenModal = (pkg?: Package) => {
        if (pkg) {
            setEditingPkg(pkg);
            setFormData(pkg);
        } else {
            setEditingPkg(null);
            setFormData({
                name: '', category: 'General', price: 2999, duration: '1 Month', 
                features: ['Full Gym Access', 'Smart Locker Access', 'General Trainer Support'], 
                details: 'Comprehensive fitness membership package designed for consistent progression.',
                image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
            });
        }
        setIsEditModalOpen(true);
    };

    const handleOpenEnrollModal = (pkg?: Package, existingMember?: Member) => {
        if (pkg) {
            setEnrollPackageId(pkg.id);
        } else if (packages[0]) {
            setEnrollPackageId(packages[0].id);
        }
        if (existingMember) {
            setEnrollMode('existing');
            setSelectedMemberIdForEnroll(existingMember.id);
        } else {
            setEnrollMode('new');
            setNewMemberName('');
            setNewMemberEmail('');
            setNewMemberPhone('');
        }
        setEnrollJoinDate(new Date().toISOString().split('T')[0]);
        setEnrollPaymentStatus('Paid');
        setIsEnrollModalOpen(true);
    };

    const handleEnrollSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const targetPkg = packages.find(p => p.id === Number(enrollPackageId)) || packages[0];
        if (!targetPkg) {
            addToast("Please create or select a valid membership tier first.", "error");
            return;
        }

        const { lifecycleStatus, expiryDate } = computeMembershipExpiry(enrollJoinDate, targetPkg.duration);
        const computedMemberStatus: Member['status'] =
            lifecycleStatus === 'Expired' ? 'Expired' : enrollPaymentStatus === 'Paid' ? 'Active' : 'Pending';

        let targetMemberId = selectedMemberIdForEnroll;
        let targetMemberName = '';

        if (enrollMode === 'new') {
            if (!newMemberName.trim()) {
                addToast("Member name is required for sign-up.", "error");
                return;
            }
            targetMemberId = Date.now();
            targetMemberName = newMemberName.trim();

            const createdMember: Member = {
                id: targetMemberId,
                loginId: `FF-${Math.floor(1000 + Math.random() * 9000)}`,
                name: targetMemberName,
                email: newMemberEmail.trim() || `${targetMemberName.toLowerCase().replace(/\s+/g, '.')}@fitnessfuture.in`,
                phone: newMemberPhone.trim() || '+91 9876543210',
                joinDate: enrollJoinDate,
                packageId: targetPkg.id,
                status: computedMemberStatus,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(targetMemberName)}&background=0D8ABC&color=fff`,
                whatsappConsent: true,
                xp: 100,
                level: 1,
                achievements: ['New Enrollment'],
                hrv: 68,
                lbm: 60,
                health_score: 85,
                bio_age: 26,
                assigned_tests: [],
                medical_history: { conditions: [], pastInjuries: 'None', medications: 'None', lifestyle: {} },
                physical_metrics: { height: 172, weight: 70, body_fat: 18, muscle_mass: 32, target_weight: 68, body_type: 'Mesomorph', activity_level: 'Moderate' },
                automation_settings: { remind_12hrs_before: true, auto_renewal: true, ai_coaching: true, sync_id: `SYNC-${targetMemberId}` },
                rpeHistory: [],
                anatomicalStatus: {},
                emergency_contact: { name: 'Emergency Contact', phone: newMemberPhone.trim() || '+91 9876543210', relation: 'Family' },
                initial_assessment: { fitness_level: 'Intermediate', pushup_count: 20, plank_time: '60s', squat_count: 30, comments: 'Enrolled via Membership Tier Sign-Up' }
            };
            addMember(createdMember);
        } else {
            const existing = members.find(m => m.id === Number(selectedMemberIdForEnroll));
            if (!existing) {
                addToast("Selected member not found.", "error");
                return;
            }
            targetMemberId = existing.id;
            targetMemberName = existing.name;
            updateMember({
                ...existing,
                packageId: targetPkg.id,
                joinDate: enrollJoinDate,
                status: computedMemberStatus
            });
        }

        const newInvoice: Invoice = {
            id: Date.now() + 1,
            memberId: targetMemberId,
            memberName: targetMemberName,
            packageId: targetPkg.id,
            packageName: `${targetPkg.name} (${targetPkg.duration})`,
            amount: targetPkg.price,
            date: enrollJoinDate,
            status: enrollPaymentStatus,
            paymentMethod: enrollPaymentMethod,
            items: [{ description: `${targetPkg.name} - ${targetPkg.duration} Membership (Valid until ${expiryDate})`, amount: targetPkg.price, type: 'Membership' }]
        };
        addInvoice(newInvoice);

        if (enrollPaymentStatus === 'Paid') {
            addTransaction({
                id: `TXN-${Date.now()}`,
                memberName: targetMemberName,
                amount: targetPkg.price,
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                method: enrollPaymentMethod.startsWith('UPI') ? 'QR Code' : enrollPaymentMethod === 'Cash' ? 'Cash' : enrollPaymentMethod === 'Card' ? 'Card' : 'Online'
            });
        }

        addToast(`${targetMemberName} enrolled in ${targetPkg.name} (Expires: ${expiryDate})`, "success");
        setIsEnrollModalOpen(false);
        setViewMode('tracking');
    };

    const handlePaymentStatusChange = (member: Member, pkg: Package, latestInvoice: Invoice | undefined, newStatus: 'Paid' | 'Pending' | 'Overdue') => {
        if (latestInvoice) {
            updateInvoiceStatus(latestInvoice.id, newStatus, pkg.price);
        } else {
            addInvoice({
                id: Date.now(),
                memberId: member.id,
                memberName: member.name,
                packageId: pkg.id,
                packageName: pkg.name,
                amount: pkg.price,
                date: new Date().toISOString().split('T')[0],
                status: newStatus,
                paymentMethod: 'UPI'
            });
        }

        const { lifecycleStatus } = computeMembershipExpiry(member.joinDate, pkg.duration);
        updateMember({
            ...member,
            status: lifecycleStatus === 'Expired' ? 'Expired' : newStatus === 'Paid' ? 'Active' : 'Pending'
        });

        addToast(`${member.name}'s payment status updated to ${newStatus}.`, newStatus === 'Paid' ? 'success' : 'info');
    };

    const handleQuickRenewMember = (member: Member, pkg: Package) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const { expiryDate } = computeMembershipExpiry(todayStr, pkg.duration);
        updateMember({
            ...member,
            joinDate: todayStr,
            status: 'Active'
        });
        addInvoice({
            id: Date.now(),
            memberId: member.id,
            memberName: member.name,
            packageId: pkg.id,
            packageName: `${pkg.name} Renewal`,
            amount: pkg.price,
            date: todayStr,
            status: 'Paid',
            paymentMethod: 'UPI',
            items: [{ description: `Membership Renewal: ${pkg.name} (${pkg.duration})`, amount: pkg.price, type: 'Membership' }]
        });
        addToast(`Renewed ${member.name}'s ${pkg.name} plan! New expiry: ${expiryDate}`, 'success');
    };

    const handleSeedStandardTiers = () => {
        const standardTiers: Omit<Package, 'id'>[] = [
            {
                name: 'Monthly Kickstart Pass',
                category: 'General',
                price: 2499,
                duration: '1 Month',
                features: ['Full Gym Floor & Cardio Access', 'Smart Locker & Shower Access', '1 Complimentary InBody Scan', 'Mobile Workout Tracker Access'],
                details: 'Flexible month-to-month membership tier ideal for new members starting their fitness journey.',
                image: '/icon.svg'
            },
            {
                name: 'Quarterly Transformation Pro',
                category: 'General',
                price: 6499,
                duration: '3 Months',
                features: ['Full Gym & Functional Zone Access', '2 Group HIIT/Yoga Classes Weekly', 'Monthly Body Composition Tracking', 'Custom Diet & Workout Routine'],
                details: '90-day structured progression tier with diet customization and group class access.',
                image: '/icon.svg'
            },
            {
                name: 'Annual Titan All-Access',
                category: 'General',
                price: 19999,
                duration: '12 Months',
                features: ['Unlimited 365-Day Gym & Spa Access', 'Unlimited Group Classes & Booking Priority', '4 Personal Training Sessions Included', 'Quarterly Blood & Metabolic Assessment', 'Freeze Membership up to 30 Days'],
                details: 'Best-value yearly membership tier with full priority class booking and transformation support.',
                image: '/icon.svg'
            }
        ];

        let added = 0;
        standardTiers.forEach((tier, idx) => {
            const exists = packages.some(p => p.name.toLowerCase() === tier.name.toLowerCase());
            if (!exists) {
                addPackage({ ...tier, id: Date.now() + idx });
                added++;
            }
        });

        if (added > 0) {
            addToast(`Added ${added} standard membership tiers (Monthly, Quarterly, Annual).`, 'success');
        } else {
            addToast('Standard Monthly, Quarterly, and Annual tiers are already active.', 'info');
        }
    };

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setFormData(prev => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] }));
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (idx: number) => {
        setFormData(prev => ({ ...prev, features: prev.features?.filter((_, i) => i !== idx) }));
    };

    const handleAIGenerateTier = async () => {
        setIsGeneratingTier(true);
        addToast("Synthesizing High-Converting Tier...", "info");
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-3-flash-preview',
                    prompt: `Generate a high-converting, luxury futuristic gym membership package for the category: "${formData.category || 'General'}".
                    Return ONLY a valid JSON object with the following exact keys:
                    - "name": A cool, futuristic package name (e.g., "Quantum Hypertrophy Pass", "Cybernetic Transformation").
                    - "price": A realistic price in INR (number only, e.g., 4999, 14999, 29999).
                    - "duration": Duration string (e.g., "1 Month", "3 Months", "6 Months", "12 Months").
                    - "details": A compelling 1-2 sentence pitch explaining why this tier is the ultimate choice.
                    - "features": An array of 5-6 exclusive, high-value features (strings).`
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to generate tier');
            
            let cleanJson = data.text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            
            setFormData(prev => ({
                ...prev,
                name: parsed.name || prev.name,
                price: Number(parsed.price) || prev.price,
                duration: parsed.duration || prev.duration,
                details: parsed.details || prev.details,
                features: Array.isArray(parsed.features) ? parsed.features : prev.features
            }));
            addToast("Tier synthesized successfully!", "success");
        } catch (err: any) {
            console.error(err);
            addToast("Synthesis failed: " + err.message, "error");
        } finally {
            setIsGeneratingTier(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;

        if (editingPkg) {
            updatePackage({ ...editingPkg, ...formData } as Package);
            addToast("Membership tier updated successfully", "success");
        } else {
            addPackage({ ...formData, id: Date.now() } as Package);
            addToast("New membership tier launched", "success");
        }
        setIsEditModalOpen(false);
    };

    const handleDelete = (id: number) => {
        deletePackage(id);
        addToast("Package removed from catalog", "info");
    };

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            
            {/* 1. HERO & STATS BAR */}
            <div className="relative rounded-[3rem] bg-gradient-to-r from-gray-900 via-[#0a0a0a] to-black border border-white/10 p-6 md:p-10 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
                            <Crown className="w-3 h-3" /> Membership Tiers & Subscription Tracker
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                            Membership <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Plans & Tracking</span>
                        </h1>
                        <p className="text-xs md:text-sm text-gray-400 max-w-2xl mt-2">
                            Configure Monthly, Quarterly, Half-Yearly, and Annual membership tiers, enroll members, and track real-time expiration countdowns and payment statuses.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Active Plans</p>
                            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                            <p className="text-[10px] text-amber-400 font-mono mt-0.5">Avg {formatPrice(stats.avgPrice)}</p>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-2xl">
                            <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider">Active Members</p>
                            <p className="text-2xl font-black text-white mt-1">{stats.activeCount}</p>
                            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Valid Subscriptions</p>
                        </div>
                        <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 p-4 rounded-2xl">
                            <p className="text-[9px] text-amber-400 uppercase font-bold tracking-wider">Expiring / Expired</p>
                            <p className="text-2xl font-black text-white mt-1">{stats.expiringSoonCount} / {stats.expiredCount}</p>
                            <p className="text-[10px] text-amber-300 font-mono mt-0.5">Needs Renewal</p>
                        </div>
                        <div className="bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 p-4 rounded-2xl">
                            <p className="text-[9px] text-cyan-400 uppercase font-bold tracking-wider">Paid Revenue</p>
                            <p className="text-2xl font-black text-white mt-1">{formatPrice(stats.paidRevenue)}</p>
                            <p className="text-[10px] text-rose-400 font-mono mt-0.5">Dues: {formatPrice(stats.pendingDues)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CONTROLS & NAVIGATION */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[#0a0a0a] p-3 rounded-3xl border border-white/10 sticky top-4 z-30 shadow-xl backdrop-blur-xl">
                
                {/* Main View Switcher */}
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                            viewMode === 'grid' 
                            ? 'bg-amber-500 text-black shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Layers className="w-4 h-4" /> Membership Tiers ({packages.length})
                    </button>
                    <button 
                        onClick={() => setViewMode('tracking')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                            viewMode === 'tracking' 
                            ? 'bg-cyan-500 text-black shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Users className="w-4 h-4" /> Sign-Up, Expiry & Payment Tracker ({members.length})
                    </button>
                    <button 
                        onClick={() => setViewMode('comparison')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                            viewMode === 'comparison' 
                            ? 'bg-white text-black shadow-lg' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4" /> Compare Tiers
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={handleSeedStandardTiers}
                        className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Load Standard Tiers
                    </button>
                    <button 
                        onClick={() => handleOpenEnrollModal()}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" /> Sign Up Member
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Create Tier
                    </button>
                </div>
            </div>

            {/* Category sub-filter when in grid mode */}
            {viewMode === 'grid' && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                                selectedCategory === cat 
                                ? 'bg-white text-black shadow-md' 
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* 3. CONTENT AREA */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPackages.map(pkg => {
                        const enrolledCount = members.filter(m => m.packageId === pkg.id).length;
                        return (
                            <PackageCard 
                                key={pkg.id} 
                                pkg={pkg} 
                                memberCount={enrolledCount}
                                onEdit={handleOpenModal} 
                                onDelete={handleDelete}
                                onSelect={setSelectedPkgForDetail}
                                onEnrollMember={(selectedPkg) => handleOpenEnrollModal(selectedPkg)}
                            />
                        );
                    })}
                    
                    <button 
                        onClick={() => handleOpenModal()}
                        className="group relative rounded-[2.5rem] border-2 border-dashed border-white/10 hover:border-amber-500/50 flex flex-col items-center justify-center p-12 transition-all hover:bg-white/[0.02] min-h-[450px] cursor-pointer"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/5 group-hover:bg-amber-500/20 flex items-center justify-center mb-6 transition-colors">
                            <Plus className="w-8 h-8 text-gray-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                        <h3 className="text-lg font-black text-gray-400 group-hover:text-white uppercase tracking-widest">Create Custom Tier</h3>
                        <p className="text-xs text-gray-600 mt-2 font-mono">Monthly • Quarterly • Half-Yearly • Annual</p>
                    </button>
                </div>
            )}

            {viewMode === 'tracking' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Filter Bar */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={trackingSearch}
                                onChange={e => setTrackingSearch(e.target.value)}
                                placeholder="Search member name, email, phone, or membership plan..."
                                className="w-full bg-black border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:border-cyan-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={tierFilter}
                                onChange={e => setTierFilter(e.target.value as any)}
                                className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                            >
                                <option value="All">All Tiers</option>
                                <option value="Monthly">Monthly Tier</option>
                                <option value="Quarterly">Quarterly Tier</option>
                                <option value="Half-Yearly">Half-Yearly Tier</option>
                                <option value="Annual">Annual Tier</option>
                            </select>

                            <select
                                value={lifecycleFilter}
                                onChange={e => setLifecycleFilter(e.target.value as any)}
                                className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                            >
                                <option value="All">All Expiration States</option>
                                <option value="Active">Active (&gt; 7 Days)</option>
                                <option value="Expiring Soon">Expiring Soon (&le; 7 Days)</option>
                                <option value="Expired">Expired</option>
                            </select>

                            <select
                                value={paymentFilter}
                                onChange={e => setPaymentFilter(e.target.value as any)}
                                className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                            >
                                <option value="All">All Payment Statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    {/* Member Subscription & Payment Tracking Table */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.03] border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <th className="p-4">Member</th>
                                        <th className="p-4">Membership Plan & Tier</th>
                                        <th className="p-4">Sign-Up Date</th>
                                        <th className="p-4">Expiration & Countdown</th>
                                        <th className="p-4">Payment Status</th>
                                        <th className="p-4 text-right">Quick Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {filteredSubscriptionRecords.map(({ member, pkg, tierLabel, joinDate, expiryDate, daysRemaining, lifecycleStatus, paymentStatus, latestInvoice }) => (
                                        <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D8ABC&color=fff`}
                                                        alt={member.name}
                                                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                                                    />
                                                    <div>
                                                        <p className="font-black text-white text-sm">{member.name}</p>
                                                        <p className="text-[11px] text-gray-500 font-mono">{member.phone || member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                                                        {tierLabel}
                                                    </span>
                                                    <span className="font-bold text-white">{pkg.name}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-mono mt-1">
                                                    {formatPrice(pkg.price)} • {pkg.duration}
                                                </p>
                                            </td>
                                            <td className="p-4 font-mono text-gray-300">
                                                {joinDate}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-white font-bold">{expiryDate}</span>
                                                    {lifecycleStatus === 'Active' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                                                            <CheckCircle className="w-3 h-3" /> {daysRemaining} Days Remaining
                                                        </span>
                                                    )}
                                                    {lifecycleStatus === 'Expiring Soon' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full w-fit">
                                                            <AlertTriangle className="w-3 h-3" /> Expiring in {daysRemaining}d
                                                        </span>
                                                    )}
                                                    {lifecycleStatus === 'Expired' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full w-fit">
                                                            <AlertCircle className="w-3 h-3" /> Expired ({Math.abs(daysRemaining)}d ago)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={paymentStatus}
                                                        onChange={e => handlePaymentStatusChange(member, pkg, latestInvoice, e.target.value as 'Paid' | 'Pending' | 'Overdue')}
                                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border outline-none cursor-pointer ${
                                                            paymentStatus === 'Paid'
                                                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                                : paymentStatus === 'Pending'
                                                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                                        }`}
                                                    >
                                                        <option value="Paid" className="bg-gray-900 text-emerald-400">Paid</option>
                                                        <option value="Pending" className="bg-gray-900 text-amber-400">Pending</option>
                                                        <option value="Overdue" className="bg-gray-900 text-rose-400">Overdue</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {paymentStatus !== 'Paid' && (
                                                        <button
                                                            onClick={() => handlePaymentStatusChange(member, pkg, latestInvoice, 'Paid')}
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleQuickRenewMember(member, pkg)}
                                                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                                        title="Renew membership from today"
                                                    >
                                                        <RefreshCw className="w-3 h-3" /> Renew
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEnrollModal(pkg, member)}
                                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                                                    >
                                                        Change Tier
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSubscriptionRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-10 text-center text-gray-500 font-mono">
                                                No member subscriptions match your current filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'comparison' && (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                    <ComparisonView packages={filteredPackages} onEnrollMember={(pkg) => handleOpenEnrollModal(pkg)} />
                </div>
            )}

            {/* 4. PACKAGE DETAIL MODAL */}
            {selectedPkgForDetail && (
                <Modal isOpen={!!selectedPkgForDetail} onClose={() => setSelectedPkgForDetail(null)} title="Tier Specifications">
                    <div className="space-y-6">
                        <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-900 border border-white/10">
                            {selectedPkgForDetail.image ? (
                                <img src={selectedPkgForDetail.image} className="w-full h-full object-cover opacity-60" alt={selectedPkgForDetail.name} />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                    <Dumbbell className="w-16 h-16 text-white/10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <div>
                                    <span className="px-2 py-1 rounded bg-amber-500 text-black font-black text-[9px] uppercase tracking-widest mb-2 inline-block">
                                        {selectedPkgForDetail.category} • {inferTierLabel(selectedPkgForDetail.duration)}
                                    </span>
                                    <h2 className="text-3xl font-black text-white uppercase italic">{selectedPkgForDetail.name}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-amber-400">{formatPrice(selectedPkgForDetail.price)}</p>
                                    <p className="text-[10px] text-gray-400 font-mono uppercase">{selectedPkgForDetail.duration}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                            <p className="text-sm text-gray-200 leading-relaxed">
                                {selectedPkgForDetail.details || "Standard membership access including gym floor, locker rooms, and basic consultation."}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Included Privileges</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedPkgForDetail.features.map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black border border-white/10">
                                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                        <span className="text-xs text-white font-medium">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <button 
                                onClick={() => {
                                    const pkg = selectedPkgForDetail;
                                    setSelectedPkgForDetail(null);
                                    handleOpenEnrollModal(pkg);
                                }} 
                                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                Sign Up Member to This Tier
                            </button>
                            <button 
                                onClick={() => { setSelectedPkgForDetail(null); handleOpenModal(selectedPkgForDetail); }} 
                                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                Edit Tier
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* 5. MEMBER SIGN-UP / TIER ASSIGNMENT MODAL */}
            <Modal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title="Member Membership Sign-Up & Payment">
                <form onSubmit={handleEnrollSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-black rounded-xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => setEnrollMode('new')}
                            className={`py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                enrollMode === 'new' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            + New Member Sign-Up
                        </button>
                        <button
                            type="button"
                            onClick={() => setEnrollMode('existing')}
                            className={`py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                enrollMode === 'existing' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Assign Existing Member
                        </button>
                    </div>

                    {enrollMode === 'new' ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newMemberName}
                                    onChange={e => setNewMemberName(e.target.value)}
                                    placeholder="e.g. Aarav Sharma"
                                    className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={newMemberPhone}
                                        onChange={e => setNewMemberPhone(e.target.value)}
                                        placeholder="+91 9876543210"
                                        className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={newMemberEmail}
                                        onChange={e => setNewMemberEmail(e.target.value)}
                                        placeholder="aarav@example.com"
                                        className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Select Existing Member</label>
                            <select
                                value={selectedMemberIdForEnroll}
                                onChange={e => setSelectedMemberIdForEnroll(Number(e.target.value))}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-cyan-500"
                            >
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.phone || m.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Select Membership Plan</label>
                            <select
                                value={enrollPackageId}
                                onChange={e => setEnrollPackageId(Number(e.target.value))}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-amber-500"
                            >
                                {packages.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — {formatPrice(p.price)} ({p.duration})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Start / Sign-Up Date</label>
                            <input
                                type="date"
                                value={enrollJoinDate}
                                onChange={e => setEnrollJoinDate(e.target.value)}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Payment Status</label>
                            <select
                                value={enrollPaymentStatus}
                                onChange={e => setEnrollPaymentStatus(e.target.value as any)}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-amber-500"
                            >
                                <option value="Paid">Paid (Active Immediately)</option>
                                <option value="Pending">Pending (Invoice Due)</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Payment Method</label>
                            <select
                                value={enrollPaymentMethod}
                                onChange={e => setEnrollPaymentMethod(e.target.value as any)}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-amber-500"
                            >
                                <option value="UPI">UPI</option>
                                <option value="Cash">Cash Counter</option>
                                <option value="Card">Credit / Debit Card</option>
                                <option value="Online">NetBanking / Online</option>
                            </select>
                        </div>
                    </div>

                    {(() => {
                        const selectedPkg = packages.find(p => p.id === Number(enrollPackageId)) || packages[0];
                        if (!selectedPkg) return null;
                        const { expiryDate, daysRemaining } = computeMembershipExpiry(enrollJoinDate, selectedPkg.duration);
                        return (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Calculated Expiration</p>
                                    <p className="text-sm font-bold text-white mt-0.5">{expiryDate} ({daysRemaining} days validity)</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Payable</p>
                                    <p className="text-xl font-black text-amber-400">{formatPrice(selectedPkg.price)}</p>
                                </div>
                            </div>
                        );
                    })()}

                    <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-widest text-xs shadow-lg transition-all cursor-pointer"
                    >
                        Complete Enrollment & Log Subscription
                    </button>
                </form>
            </Modal>

            {/* 6. CREATE / EDIT PACKAGE MODAL */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={editingPkg ? "Modify Membership Tier" : "Architect New Tier"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleAIGenerateTier}
                            disabled={isGeneratingTier}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {isGeneratingTier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {isGeneratingTier ? 'Synthesizing...' : 'Auto-Generate Tier'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tier Name</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:border-amber-500 outline-none font-bold"
                                placeholder="e.g. Annual Titan Pass"
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Category</label>
                            <select 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})} 
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:border-amber-500 outline-none font-bold"
                            >
                                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Price (INR)</label>
                            <input 
                                type="number" 
                                value={formData.price} 
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-amber-400 font-mono text-sm focus:border-amber-500 outline-none font-bold"
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Duration Cycle</label>
                            <select 
                                value={formData.duration} 
                                onChange={e => setFormData({...formData, duration: e.target.value})} 
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:border-amber-500 outline-none font-bold"
                            >
                                <option value="1 Month">1 Month (Monthly Tier)</option>
                                <option value="3 Months">3 Months (Quarterly Tier)</option>
                                <option value="6 Months">6 Months (Half-Yearly Tier)</option>
                                <option value="12 Months">12 Months (Annual Tier)</option>
                                <option value="10 Sessions">10 Sessions (PT Pack)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cover Image URL (Optional)</label>
                        <input 
                            type="text" 
                            value={formData.image || ''} 
                            onChange={e => setFormData({...formData, image: e.target.value})} 
                            className="w-full p-3 bg-black border border-white/10 rounded-xl text-gray-300 text-xs focus:border-amber-500 outline-none font-mono"
                            placeholder="https://images.unsplash.com/..."
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Marketing Pitch / Details</label>
                        <textarea 
                            value={formData.details || ''} 
                            onChange={e => setFormData({...formData, details: e.target.value})} 
                            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none h-20 resize-none"
                            placeholder="Explain why this tier is the best choice..."
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Features List</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                value={featureInput} 
                                onChange={e => setFeatureInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                className="flex-1 p-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:border-amber-500 outline-none"
                                placeholder="Add a privilege (e.g. 'Free Sauna Access')"
                            />
                            <button type="button" onClick={handleAddFeature} className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase">Add</button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-black/50 rounded-xl border border-white/5">
                            {formData.features?.map((feat, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg">
                                    <span>{feat}</span>
                                    <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-red-400 hover:text-red-300"><X className="w-3 h-3"/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all mt-4 cursor-pointer">
                        {editingPkg ? "Save Changes" : "Launch Tier"}
                    </button>
                </form>
            </Modal>

        </div>
    );
};

export default Packages;
