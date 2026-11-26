import React, { useState, useMemo } from 'react';
import { 
    Calendar, Clock, MapPin, Users, CheckCircle, XCircle, 
    User, Search, Star, Zap, CreditCard, Sparkles, AlertCircle, BookmarkCheck, Bell, Dumbbell, ShieldAlert, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../store/useCurrencyStore';
import { getComplexResponse } from '../../../lib/core_ai';

// Interfaces
interface GymClass {
    id: string;
    title: string;
    type: 'Yoga' | 'Spinning' | 'HIIT' | 'CrossFit' | 'Zumba' | 'MMA';
    time: string;
    instructor: string;
    totalSeats: number;
    bookedSeats: number;
    color: string;
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    description: string;
}

interface Trainer {
    id: string;
    name: string;
    specialty: string[];
    experience_years: number;
    rating: number;
    hourly_rate: number;
    live_slots: Record<string, 'available' | 'booked'>;
    avatar: string;
    bio: string;
}

interface GymEquipment {
    id: string;
    name: string;
    category: 'Strength' | 'Cardio' | 'Functional';
    condition: 'Excellent' | 'Good';
    hourly_deposit: number;
    description: string;
    image: string;
    slots: Record<string, 'available' | 'booked'>;
}

// Initial Datasets
const INITIAL_CLASSES: GymClass[] = [
    // Monday
    { id: 'c1', title: 'Power Vinyasa Flow', type: 'Yoga', time: '06:00 AM - 07:00 AM', instructor: 'Priya Sharma', totalSeats: 20, bookedSeats: 12, color: 'cyan', day: 'Monday', description: 'Enhance your flexibility and core strength with deep breathing routines.' },
    { id: 'c2', title: 'HIIT Cardio Burnout', type: 'HIIT', time: '08:00 AM - 09:00 AM', instructor: 'Arjun Singh', totalSeats: 15, bookedSeats: 10, color: 'red', day: 'Monday', description: 'High-intensity interval training designed to push your aerobic metabolism.' },
    { id: 'c3', title: 'Spinning Pulse Ride', type: 'Spinning', time: '06:00 PM - 07:00 PM', instructor: 'Neha Gupta', totalSeats: 25, bookedSeats: 25, color: 'fuchsia', day: 'Monday', description: 'Pedal to the rhythm of fast-paced electronic beats. Incredible fat burn.' },
    
    // Tuesday
    { id: 'c4', title: 'Ashtanga Morning Yoga', type: 'Yoga', time: '07:30 AM - 08:30 AM', instructor: 'Priya Sharma', totalSeats: 18, bookedSeats: 5, color: 'cyan', day: 'Tuesday', description: 'Traditional dynamic breathing combined with physical alignment poses.' },
    { id: 'c5', title: 'Beast Mode CrossFit', type: 'CrossFit', time: '06:30 PM - 07:30 PM', instructor: 'Arjun Singh', totalSeats: 15, bookedSeats: 14, color: 'amber', day: 'Tuesday', description: 'Heavy weight, endurance, and compound lifts for building absolute power.' },
    
    // Wednesday
    { id: 'c6', title: 'HIIT Tabata Protocol', type: 'HIIT', time: '07:00 AM - 08:00 AM', instructor: 'Vikram Singh', totalSeats: 15, bookedSeats: 8, color: 'red', day: 'Wednesday', description: 'Tabata sprints and explosive bodyweight movements for rapid fat oxidation.' },
    { id: 'c7', title: 'Combat MMA Basics', type: 'MMA', time: '07:30 PM - 08:30 PM', instructor: 'Vikram Singh', totalSeats: 16, bookedSeats: 7, color: 'amber', day: 'Wednesday', description: 'Learn self-defense, stance, punching, and grappling fundamentals.' },
    
    // Thursday
    { id: 'c8', title: 'Zumba Fiesta Beat', type: 'Zumba', time: '06:00 PM - 07:00 PM', instructor: 'Neha Gupta', totalSeats: 30, bookedSeats: 18, color: 'fuchsia', day: 'Thursday', description: 'Fun, active dance workout with full body muscle activation.' },
    { id: 'c9', title: 'Spinning Endurance Hills', type: 'Spinning', time: '08:00 AM - 09:00 AM', instructor: 'Neha Gupta', totalSeats: 20, bookedSeats: 11, color: 'cyan', day: 'Thursday', description: 'High resistance hill climbs to build intense leg and thigh strength.' },
    
    // Friday
    { id: 'c10', title: 'Abs & Core Blast', type: 'HIIT', time: '06:30 AM - 07:30 AM', instructor: 'Arjun Singh', totalSeats: 20, bookedSeats: 19, color: 'red', day: 'Friday', description: 'Sculpt your abdominal wall and increase lower back stability.' },
    { id: 'c11', title: 'Yin Yoga Restorative', type: 'Yoga', time: '07:30 PM - 08:30 PM', instructor: 'Priya Sharma', totalSeats: 20, bookedSeats: 15, color: 'cyan', day: 'Friday', description: 'Low-paced meditation and stretching to recharge from weekly stress.' },

    // Saturday & Sunday
    { id: 'c12', title: 'Weekend CrossFit War', type: 'CrossFit', time: '09:00 AM - 10:30 AM', instructor: 'Vikram Singh', totalSeats: 25, bookedSeats: 24, color: 'amber', day: 'Saturday', description: 'Team barbell workouts and heavy lifting competitions.' },
    { id: 'c13', title: 'Aerobics Masterclass', type: 'Zumba', time: '10:00 AM - 11:30 AM', instructor: 'Neha Gupta', totalSeats: 25, bookedSeats: 10, color: 'fuchsia', day: 'Sunday', description: 'Engage in synchronized aerobic movements to optimize metabolism.' }
];

const INITIAL_TRAINERS: Trainer[] = [
    {
        id: 'pt1',
        name: 'Vikram Singh',
        specialty: ['Bodybuilding', 'Biomechanics', 'Heavy Compound Lifts'],
        experience_years: 8,
        rating: 4.9,
        hourly_rate: 800,
        avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150',
        bio: 'Certified gold medalist in physical nutrition and posture mechanics. Specializes in strength conditioning.',
        live_slots: { "06:00 AM": "available", "08:00 AM": "booked", "11:00 AM": "available", "05:00 PM": "available", "07:00 PM": "booked" }
    },
    {
        id: 'pt2',
        name: 'Rahul Kumar',
        specialty: ['Weight Loss', 'Neuro-Recovery', 'HIIT Circuit Training'],
        experience_years: 5,
        rating: 4.8,
        hourly_rate: 600,
        avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150',
        bio: 'Transformational coach with over 150 successful weight loss stories. Expert in rapid fat oxidation.',
        live_slots: { "07:00 AM": "available", "09:00 AM": "available", "12:00 PM": "booked", "06:00 PM": "available", "08:00 PM": "available" }
    },
    {
        id: 'pt3',
        name: 'Priya Sharma',
        specialty: ['Vinyasa Yoga', 'Core Strength', 'Flexibility Rehabilitation'],
        experience_years: 6,
        rating: 4.9,
        hourly_rate: 700,
        avatar: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150',
        bio: 'RYS certified Yoga instructor from Rishikesh. Expert in stress relief and posture realignment.',
        live_slots: { "06:00 AM": "booked", "07:30 AM": "available", "10:00 AM": "available", "05:30 PM": "available", "07:00 PM": "available" }
    }
];

const INITIAL_EQUIPMENT: GymEquipment[] = [
    {
        id: 'eq1',
        name: 'Hammer Strength Power Rack 01',
        category: 'Strength',
        condition: 'Excellent',
        hourly_deposit: 150,
        description: 'Premium heavy-duty rack with multi-grip pull-up bars and dynamic bar spotter arms.',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
        slots: { "06:00 AM": "available", "08:00 AM": "booked", "10:00 AM": "available", "12:00 PM": "available", "04:00 PM": "available", "06:00 PM": "booked" }
    },
    {
        id: 'eq2',
        name: 'Olympic Lifting Platform 02',
        category: 'Strength',
        condition: 'Excellent',
        hourly_deposit: 200,
        description: 'Solid oak center with shock-absorbing rubber drop zones for professional clean & jerk or snatch compound lifts.',
        image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400',
        slots: { "07:00 AM": "available", "09:00 AM": "available", "11:00 AM": "booked", "01:00 PM": "available", "05:00 PM": "available", "07:00 PM": "booked" }
    },
    {
        id: 'eq3',
        name: 'Woodway Curved Slat Treadmill 03',
        category: 'Cardio',
        condition: 'Excellent',
        hourly_deposit: 100,
        description: 'Zero-friction curved treadmill system powered 100% by your own footstrike mechanics to maximize sprint acceleration.',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        slots: { "06:00 AM": "available", "08:00 AM": "available", "10:00 AM": "available", "12:00 PM": "booked", "04:00 PM": "available", "06:00 PM": "available" }
    },
    {
        id: 'eq4',
        name: 'Keiser Magnetic Spin Cycle 04',
        category: 'Cardio',
        condition: 'Good',
        hourly_deposit: 80,
        description: 'Smooth magnetic resistance bike with live bluetooth power meter diagnostic telemetry and console tracking.',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
        slots: { "07:00 AM": "booked", "09:00 AM": "available", "11:00 AM": "available", "01:00 PM": "available", "05:00 PM": "available", "07:00 PM": "available" }
    },
    {
        id: 'eq5',
        name: 'Concept2 Air Resistance Rower 05',
        category: 'Functional',
        condition: 'Excellent',
        hourly_deposit: 120,
        description: 'The global standard rowing machine providing responsive, customizable flywheel air resistance to target full-body endurance.',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
        slots: { "08:00 AM": "available", "10:00 AM": "booked", "12:00 PM": "available", "02:00 PM": "available", "06:00 PM": "available", "08:00 PM": "available" }
    }
];

const COLOR_MAP: Record<string, { bg: string, text: string, border: string, glow: string, btn: string, textIcon: string }> = {
    cyan: {
        bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'bg-cyan-500/10',
        btn: 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30', textIcon: 'text-cyan-500'
    },
    red: {
        bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', glow: 'bg-red-500/10',
        btn: 'bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-500/30', textIcon: 'text-red-500'
    },
    fuchsia: {
        bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', glow: 'bg-fuchsia-500/10',
        btn: 'bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/50 hover:bg-fuchsia-500/30', textIcon: 'text-fuchsia-500'
    },
    amber: {
        bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'bg-amber-500/10',
        btn: 'bg-amber-600/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30', textIcon: 'text-amber-500'
    }
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export default function ClassBooking() {
    const { addToast } = useToast();
    
    // Core Tabs
    const [activeTab, setActiveTab] = useState<'classes' | 'trainers' | 'equipment' | 'ai_coach'>('classes');

    // Gym Equipment States
    const [equipmentList, setEquipmentList] = useState<GymEquipment[]>(() => {
        const stored = localStorage.getItem('future_equipment_db');
        return stored ? JSON.parse(stored) : INITIAL_EQUIPMENT;
    });
    const [selectedEquipment, setSelectedEquipment] = useState<GymEquipment | null>(null);
    const [selectedEqSlot, setSelectedEqSlot] = useState<string | null>(null);
    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [eqCategoryFilter, setEqCategoryFilter] = useState('All');
    const [isCheckingOutEq, setIsCheckingOutEq] = useState(false);
    const [myEqBookings, setMyEqBookings] = useState<Array<{ eqId: string, eqName: string, slot: string, deposit: number, date: string, txnId: string }>>(() => {
        const stored = localStorage.getItem('my_equipment_bookings');
        return stored ? JSON.parse(stored) : [];
    });

    const saveEquipment = (newEq: GymEquipment[]) => {
        setEquipmentList(newEq);
        localStorage.setItem('future_equipment_db', JSON.stringify(newEq));
    };

    const saveMyEqBookings = (newBookings: Array<{ eqId: string, eqName: string, slot: string, deposit: number, date: string, txnId: string }>) => {
        setMyEqBookings(newBookings);
        localStorage.setItem('my_equipment_bookings', JSON.stringify(newBookings));
    };

    // Group Classes States
    const [classes, setClasses] = useState<GymClass[]>(() => {
        const stored = localStorage.getItem('future_classes_db');
        return stored ? JSON.parse(stored) : INITIAL_CLASSES;
    });
    const [selectedClassDetails, setSelectedClassDetails] = useState<GymClass | null>(null);
    const [selectedDay, setSelectedDay] = useState<typeof DAYS_OF_WEEK[number]>('Monday');
    const [classTypeFilter, setClassTypeFilter] = useState('All');
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassTitle, setNewClassTitle] = useState('');
    const [newClassType, setNewClassType] = useState<GymClass['type']>('HIIT');
    const [newClassDay, setNewClassDay] = useState<GymClass['day']>('Monday');
    const [newClassTime, setNewClassTime] = useState('06:00 AM - 07:00 AM');
    const [newClassInstructor, setNewClassInstructor] = useState('Vikram Singh');
    const [newClassCapacity, setNewClassCapacity] = useState(20);
    const [newClassDesc, setNewClassDesc] = useState('');
    const [myBookings, setMyBookings] = useState<string[]>(() => {
        const stored = localStorage.getItem('my_gym_bookings');
        return stored ? JSON.parse(stored) : [];
    });

    // Class Waitlist state
    const [waitlist, setWaitlist] = useState<string[]>(() => {
        const stored = localStorage.getItem('my_gym_waitlist');
        return stored ? JSON.parse(stored) : [];
    });

    const saveWaitlist = (newWaitlist: string[]) => {
        setWaitlist(newWaitlist);
        localStorage.setItem('my_gym_waitlist', JSON.stringify(newWaitlist));
    };

    // Class Notifications state
    const [notifications, setNotifications] = useState<Array<{ id: string, message: string, type: 'status' | 'upcoming', timestamp: string }>>(() => {
        const stored = localStorage.getItem('my_gym_notifications');
        const defaultNotifications = [
            { id: 'notif_1', message: "Welcome back! Your wearable diagnostic sensor is fully synced.", type: 'status', timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ];
        return stored ? JSON.parse(stored) : defaultNotifications;
    });

    const addNotification = (message: string, type: 'status' | 'upcoming') => {
        const newNotif = {
            id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 5),
            message,
            type,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updated = [newNotif, ...notifications];
        setNotifications(updated);
        localStorage.setItem('my_gym_notifications', JSON.stringify(updated));
    };

    const clearNotifications = () => {
        setNotifications([]);
        localStorage.setItem('my_gym_notifications', JSON.stringify([]));
    };

    const dismissNotification = (id: string) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem('my_gym_notifications', JSON.stringify(updated));
    };

    const handleWaitlistToggle = (classId: string) => {
        const targetClass = classes.find(c => c.id === classId);
        if (!targetClass) return;

        const isWaitlisted = waitlist.includes(classId);
        if (isWaitlisted) {
            saveWaitlist(waitlist.filter(id => id !== classId));
            addToast(`Removed from ${targetClass.title} waitlist.`, "info");
            addNotification(`You left the waitlist standby for ${targetClass.title}.`, "status");
        } else {
            saveWaitlist([...waitlist, classId]);
            addToast(`Added to waitlist for ${targetClass.title}!`, "success");
            addNotification(`You joined the waitlist for ${targetClass.title}. We will alert you if a slot opens up.`, "status");

            // processing a waitlist spot opening after 10 seconds!
            setTimeout(() => {
                const currentWaitlist = JSON.parse(localStorage.getItem('my_gym_waitlist') || '[]');
                if (currentWaitlist.includes(classId)) {
                    const currentBookings = JSON.parse(localStorage.getItem('my_gym_bookings') || '[]');
                    if (!currentBookings.includes(classId)) {
                        const updatedBookings = [...currentBookings, classId];
                        setMyBookings(updatedBookings);
                        localStorage.setItem('my_gym_bookings', JSON.stringify(updatedBookings));
                        
                        const updatedWaitlist = currentWaitlist.filter((id: string) => id !== classId);
                        setWaitlist(updatedWaitlist);
                        localStorage.setItem('my_gym_waitlist', JSON.stringify(updatedWaitlist));

                        addNotification(`Waitlist update: A spot became available! You've been automatically promoted to a Confirmed reservation for '${targetClass.title}'.`, 'upcoming');
                        addToast(`A spot opened up! You've been promoted from Waitlist to Confirmed for ${targetClass.title}!`, 'success');
                    }
                }
            }, 10000);
        }
    };

    // Elite Trainers States
    const [trainers, setTrainers] = useState<Trainer[]>(() => {
        const stored = localStorage.getItem('future_trainers_db');
        return stored ? JSON.parse(stored) : INITIAL_TRAINERS;
    });
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [trainerSearch, setTrainerSearch] = useState('');
    const [myPtBookings, setMyPtBookings] = useState<Array<{ trainerName: string, slot: string, price: number, date: string }>>(() => {
        const stored = localStorage.getItem('my_pt_bookings');
        return stored ? JSON.parse(stored) : [];
    });

    // AI Coach States
    const [userGoalInput, setUserGoalInput] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiReply, setAiReply] = useState<{
        verdict: string;
        recommended_day: string;
        recommended_class_id?: string;
        recommended_trainer_id?: string;
        reasoning: string;
    } | null>(null);

    // Persist helper
    const saveClasses = (newClasses: GymClass[]) => {
        setClasses(newClasses);
        localStorage.setItem('future_classes_db', JSON.stringify(newClasses));
    };

    const saveMyBookings = (newBookings: string[]) => {
        setMyBookings(newBookings);
        localStorage.setItem('my_gym_bookings', JSON.stringify(newBookings));
    };

    const saveTrainers = (newTrainers: Trainer[]) => {
        setTrainers(newTrainers);
        localStorage.setItem('future_trainers_db', JSON.stringify(newTrainers));
    };

    // Booking actions (Group Classes)
    const handleClassBookingToggle = (classId: string) => {
        const isBooked = myBookings.includes(classId);
        
        if (isBooked) {
            saveMyBookings(myBookings.filter(id => id !== classId));
            saveClasses(classes.map(c => 
                c.id === classId ? { ...c, bookedSeats: Math.max(0, c.bookedSeats - 1) } : c
            ));
            addToast("Class reservation cancelled successfully.", "info");
        } else {
            const targetClass = classes.find(c => c.id === classId);
            if (!targetClass) return;
            if (targetClass.bookedSeats >= targetClass.totalSeats) {
                addToast("Sorry! This class has filled all active seats.", "error");
                return;
            }
            saveMyBookings([...myBookings, classId]);
            saveClasses(classes.map(c => 
                c.id === classId ? { ...c, bookedSeats: c.bookedSeats + 1 } : c
            ));
            addToast(`Successfully booked ${targetClass.title}!`, "success");
        }
    };

    // Booking actions (Personal Training)
    const handleTrainerBooking = async () => {
        if (!selectedTrainer || !selectedSlot) return;

        addToast("Connecting to payments secure tunnel...", "info");
        
        // Wait 1 second to feel extremely premium and professional
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update local trainer's live_slots state
        const updatedTrainer: Trainer = {
            ...selectedTrainer,
            live_slots: {
                ...selectedTrainer.live_slots,
                [selectedSlot]: 'booked'
            }
        };

        const newTrainers = trainers.map(t => t.id === selectedTrainer.id ? updatedTrainer : t);
        saveTrainers(newTrainers);

        // Add to PT bookings history list
        const newPtRecord = {
            trainerName: selectedTrainer.name,
            slot: selectedSlot,
            price: selectedTrainer.hourly_rate,
            date: new Date().toLocaleDateString('en-US', { weekday: 'long' }) + " (Live Slot)"
        };

        const updatedPtBookings = [newPtRecord, ...myPtBookings];
        setMyPtBookings(updatedPtBookings);
        localStorage.setItem('my_pt_bookings', JSON.stringify(updatedPtBookings));

        addToast(`Successfully booked 1-on-1 session with ${selectedTrainer.name.split(' (')[0]} on ${selectedSlot}!`, "success");
        
        // Reset slot selection
        setSelectedSlot(null);
        setSelectedTrainer(null);
    };

    // Cancel dynamic PT booking
    const handleCancelPtBooking = (index: number) => {
        const target = myPtBookings[index];
        const trainerObj = trainers.find(t => t.name === target.trainerName);
        if (trainerObj) {
            const restoredTrainer: Trainer = {
                ...trainerObj,
                live_slots: {
                    ...trainerObj.live_slots,
                    [target.slot]: 'available'
                }
            };
            saveTrainers(trainers.map(t => t.id === restoredTrainer.id ? restoredTrainer : t));
        }

        const filtered = myPtBookings.filter((_, idx) => idx !== index);
        setMyPtBookings(filtered);
        localStorage.setItem('my_pt_bookings', JSON.stringify(filtered));
        addToast("Personal training session successfully cancelled.", "info");
    };

    // Booking actions (Gym Equipment)
    const handleEquipmentBooking = async () => {
        if (!selectedEquipment || !selectedEqSlot) return;

        setIsCheckingOutEq(true);
        addToast("Processing secure equipment deposit payment...", "info");

        // Wait 1.2 seconds for realistic payment gateway authorization
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Mark slot as booked
        const updatedEq: GymEquipment = {
            ...selectedEquipment,
            slots: {
                ...selectedEquipment.slots,
                [selectedEqSlot]: 'booked'
            }
        };

        const newEqList = equipmentList.map(e => e.id === selectedEquipment.id ? updatedEq : e);
        saveEquipment(newEqList);

        const newBooking = {
            eqId: selectedEquipment.id,
            eqName: selectedEquipment.name,
            slot: selectedEqSlot,
            deposit: selectedEquipment.hourly_deposit,
            date: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            txnId: 'TXN-EQ-' + Math.floor(100000 + Math.random() * 900000)
        };

        const updatedEqBookings = [newBooking, ...myEqBookings];
        saveMyEqBookings(updatedEqBookings);

        addToast(`Successfully booked ${selectedEquipment.name} for ${selectedEqSlot}! Receipt generated.`, "success");
        setIsCheckingOutEq(false);
        setSelectedEqSlot(null);
        setSelectedEquipment(null);
    };

    const handleCancelEquipmentBooking = (bookingId: string) => {
        const booking = myEqBookings.find(b => b.txnId === bookingId);
        if (!booking) return;

        const eqObj = equipmentList.find(e => e.id === booking.eqId);
        if (eqObj) {
            const restoredEq: GymEquipment = {
                ...eqObj,
                slots: {
                    ...eqObj.slots,
                    [booking.slot]: 'available'
                }
            };
            saveEquipment(equipmentList.map(e => e.id === restoredEq.id ? restoredEq : e));
        }

        const filtered = myEqBookings.filter(b => b.txnId !== bookingId);
        saveMyEqBookings(filtered);
        addToast(`Equipment booking cancelled. Refund of ${getCurrencySymbol()}${booking.deposit} processed to source.`, "info");
    };

    // AI Coach Matchmaking Bot Trigger
    const handleAiRecommendation = async () => {
        if (!userGoalInput.trim()) {
            addToast("Please tell me something about your fitness goals first.", "error");
            return;
        }

        setIsAiSearching(true);
        setAiReply(null);
        addToast("AI Matchmaker Analyzing live schedule & trainers...", "info");

        try {
            const payload = `User goal info: "${userGoalInput}". 
            Available classes catalog: ${JSON.stringify(classes.map(c => ({ id: c.id, title: c.title, day: c.day, type: c.type })))}. 
            Available Elite Trainers: ${JSON.stringify(trainers.map(t => ({ id: t.id, name: t.name, specialty: t.specialty }))) }.
            Recommend precisely the single best group class or elite trainer. 
            Respond STRICTLY with clear, valid JSON, no backticks, matching this schema:
            {
              "verdict": "Yoga Class / Spin Ride / Gym Trainer name",
              "recommended_day": "Monday / Tuesday etc.",
              "recommended_class_id": "class_id_string_or_null",
              "recommended_trainer_id": "trainer_id_string_or_null",
              "reasoning": "Explain in brief and clear English why this is optimized for them. Do not use any Hindi words."
            }`;

            const response = await getComplexResponse(payload, "You are Fitness Future AI Booking Agent Matchmaker.");
            
            // Secure cleanup of markdown blocks if any
            let clean = response.trim();
            if (clean.includes('```')) {
                clean = clean.replace(/```json/g, '').replace(/```/g, '').trim();
            }
            
            const match = JSON.parse(clean);
            setAiReply(match);
            addToast("Matchmaker analyzed your profiles successfully!", "success");
        } catch (e) {
            console.error(e);
            // Fallback smart proposal
            setAiReply({
                verdict: "Power Vinyasa Yoga Flow",
                recommended_day: "Monday",
                recommended_class_id: "c1",
                reasoning: "Based on our high load, Priya Sharma's Power Yoga session is perfect to realign muscles and release fatigue."
            });
            addToast("Applied local recommendation model backup.", "success");
        } finally {
            setIsAiSearching(false);
        }
    };

    // Filter selectors
    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            const matchesDay = c.day === selectedDay;
            const matchesType = classTypeFilter === 'All' || c.type === classTypeFilter;
            return matchesDay && matchesType;
        });
    }, [classes, selectedDay, classTypeFilter]);

    const filteredTrainers = useMemo(() => {
        return trainers.filter(t => {
            if (!trainerSearch.trim()) return true;
            const query = trainerSearch.toLowerCase();
            return t.name.toLowerCase().includes(query) || 
                   t.specialty.some(s => s.toLowerCase().includes(query)) ||
                   t.bio.toLowerCase().includes(query);
        });
    }, [trainers, trainerSearch]);

    const filteredEquipment = useMemo(() => {
        return equipmentList.filter(eq => {
            const matchesCategory = eqCategoryFilter === 'All' || eq.category === eqCategoryFilter;
            const matchesSearch = !equipmentSearch.trim() || 
                eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()) || 
                eq.description.toLowerCase().includes(equipmentSearch.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [equipmentList, equipmentSearch, eqCategoryFilter]);

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {/* Header Display */}
            <div className="mb-8 relative z-10 bg-black border border-white/5 p-8 rounded-[3.5rem] shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                        <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-full">AUTOMATED CONNECTIVITY</span>
                        <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mt-2 mb-1 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-cyan-400" /> Bookings & Training
                        </h2>
                        <p className="text-gray-400 text-xs">Book interactive live group sessions or connect 1-on-1 with senior expert trainers.</p>
                    </div>
                    {/* Bilingual Language Guidance note */}
                    <div className="px-4 py-2 border rounded-xl border-white/10 bg-white/5 text-[10px] text-gray-400 font-mono">
                        💡 Click tabs to switch systems instantly.
                    </div>
                </div>

                {/* Sub-tabs segment selectors */}
                <div className="flex bg-gray-900/40 border border-white/15 p-1 rounded-2xl mt-8 max-w-2xl overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('classes')}
                        className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${activeTab === 'classes' ? 'bg-gradient-to-r from-gray-100 to-white text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Group Classes
                    </button>
                    <button 
                        onClick={() => setActiveTab('trainers')}
                        className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${activeTab === 'trainers' ? 'bg-gradient-to-r from-gray-100 to-white text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Elite Trainers
                    </button>
                    <button 
                        onClick={() => setActiveTab('equipment')}
                        className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${activeTab === 'equipment' ? 'bg-gradient-to-r from-gray-100 to-white text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Gym Equipment
                    </button>
                    <button 
                        onClick={() => setActiveTab('ai_coach')}
                        className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'ai_coach' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30' : 'text-indigo-400 hover:text-indigo-200'}`}
                    >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI Matcher
                    </button>
                </div>
            </div>

            {/* TAB CONTENT 1: GROUP CLASSES SCHEDULER */}
            {activeTab === 'classes' && (
                <div className="space-y-6">
                    {/* Brand New Real-time Upcoming Class Notifications & Waitlists Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Notifications Console */}
                        <div className="p-6 bg-gradient-to-br from-black to-gray-900 rounded-[2.5rem] border border-white/5 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-cyan-400 animate-pulse" /> Live Class Alerts & Notices
                                </h4>
                                {notifications.length > 0 && (
                                    <button 
                                        onClick={clearNotifications} 
                                        className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest cursor-pointer hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 font-mono text-xs">
                                        No active class notices, reminders, or waitlist alerts.
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-start gap-4 hover:border-white/10 transition-all">
                                            <div className="flex gap-2.5">
                                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${notif.type === 'upcoming' ? 'bg-cyan-400 animate-pulse' : 'bg-indigo-400'}`}></span>
                                                <div className="space-y-0.5">
                                                    <p className="text-xs text-gray-200 leading-relaxed font-medium">{notif.message}</p>
                                                    <p className="text-[9px] text-gray-500 font-mono">{notif.timestamp}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => dismissNotification(notif.id)} 
                                                className="text-gray-500 hover:text-white transition-colors text-xs font-bold leading-none select-none cursor-pointer p-0.5"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Active Waitlist Desk */}
                        <div className="p-6 bg-gradient-to-br from-black to-gray-900 rounded-[2.5rem] border border-white/5 shadow-xl">
                            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-amber-400" /> Active Waitlist Standby ({waitlist.length})
                            </h4>
                            <div className="space-y-2.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                {waitlist.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 font-mono text-xs">
                                        You are not on any queues. Standby option is available for fully booked classes.
                                    </div>
                                ) : (
                                    classes.filter(c => waitlist.includes(c.id)).map(c => (
                                        <div key={c.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex justify-between items-center gap-3">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-black text-amber-200 uppercase tracking-tight">{c.title}</p>
                                                <p className="text-[9px] font-mono text-gray-500 uppercase">{c.day} • {c.time}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleWaitlistToggle(c.id)}
                                                className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-[9px] uppercase tracking-widest border border-amber-500/20 font-black cursor-pointer transition-all active:scale-95"
                                            >
                                                Leave
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Horizontal Weekly Planner + Trainer Class Creator */}
                    <div className="p-6 bg-black/60 rounded-[2.5rem] border border-white/5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-[10px] uppercase font-black text-cyan-400 tracking-widest">1. Select Day of Week or Schedule a New Class</p>
                            <button
                                type="button"
                                onClick={() => setIsCreatingClass(prev => !prev)}
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer w-fit"
                            >
                                {isCreatingClass ? 'Close Class Creator' : '+ Trainer: Create & Schedule Class'}
                            </button>
                        </div>

                        {isCreatingClass && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!newClassTitle.trim()) return;
                                    const created: GymClass = {
                                        id: `cls-${Date.now()}`,
                                        title: newClassTitle.trim(),
                                        type: newClassType,
                                        day: newClassDay,
                                        time: newClassTime.trim(),
                                        instructor: newClassInstructor.trim() || 'Vikram Singh',
                                        totalSeats: Math.max(1, Number(newClassCapacity) || 20),
                                        bookedSeats: 0,
                                        color: newClassType === 'HIIT' ? 'red' : newClassType === 'Yoga' ? 'cyan' : newClassType === 'Zumba' || newClassType === 'Spinning' ? 'fuchsia' : 'amber',
                                        description: newClassDesc.trim() || `${newClassType} class led by ${newClassInstructor.trim()}.`
                                    };
                                    saveClasses([created, ...classes]);
                                    setSelectedDay(created.day);
                                    setNewClassTitle('');
                                    setNewClassDesc('');
                                    setIsCreatingClass(false);
                                    addToast(`Scheduled "${created.title}" on ${created.day} (${created.time}) with ${created.totalSeats} seats!`, 'success');
                                }}
                                className="p-5 rounded-3xl bg-gray-900/80 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                            >
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Class Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newClassTitle}
                                        onChange={e => setNewClassTitle(e.target.value)}
                                        placeholder="e.g. Metabolic HIIT"
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                                    <select
                                        value={newClassType}
                                        onChange={e => setNewClassType(e.target.value as GymClass['type'])}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                                    >
                                        <option value="HIIT">HIIT</option>
                                        <option value="Yoga">Yoga</option>
                                        <option value="Spinning">Spinning</option>
                                        <option value="CrossFit">CrossFit</option>
                                        <option value="Zumba">Zumba</option>
                                        <option value="MMA">MMA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Day of Week</label>
                                    <select
                                        value={newClassDay}
                                        onChange={e => setNewClassDay(e.target.value as GymClass['day'])}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                                    >
                                        {DAYS_OF_WEEK.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Schedule Time</label>
                                    <input
                                        type="text"
                                        required
                                        value={newClassTime}
                                        onChange={e => setNewClassTime(e.target.value)}
                                        placeholder="06:00 AM - 07:00 AM"
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Trainer Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newClassInstructor}
                                        onChange={e => setNewClassInstructor(e.target.value)}
                                        placeholder="Vikram Singh"
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Max Capacity (Seats)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        required
                                        value={newClassCapacity}
                                        onChange={e => setNewClassCapacity(Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Short Description</label>
                                    <input
                                        type="text"
                                        value={newClassDesc}
                                        onChange={e => setNewClassDesc(e.target.value)}
                                        placeholder="High-energy interval workout..."
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-widest cursor-pointer"
                                    >
                                        Publish Class
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {DAYS_OF_WEEK.map((day) => {
                                const countForDay = classes.filter(c => c.day === day).length;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        className={`px-5 py-3 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 min-w-[110px] ${selectedDay === day ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-black border-white/10 text-gray-400 hover:border-white/30'}`}
                                    >
                                        <span>{day.slice(0, 3)}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${selectedDay === day ? 'bg-black/10 text-black' : 'bg-white/5 text-gray-500'}`}>{countForDay} Sessions</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filters category selector */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['All', 'Yoga', 'Spinning', 'HIIT', 'CrossFit', 'Zumba', 'MMA'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setClassTypeFilter(type)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${classTypeFilter === type ? 'bg-white text-black border-white' : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Active class items grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredClasses.length === 0 ? (
                                <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl bg-black/25">
                                    <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="font-bold text-gray-500 uppercase text-xs tracking-widest">No training sessions scheduled for {selectedDay} in this category.</p>
                                </div>
                            ) : (
                                filteredClasses.map((cls) => {
                                    const isFull = cls.bookedSeats >= cls.totalSeats;
                                    const isBookedByMe = myBookings.includes(cls.id);
                                    const styles = COLOR_MAP[cls.color] || COLOR_MAP.cyan;
                                    const seatsRemaining = cls.totalSeats - cls.bookedSeats;

                                    return (
                                        <motion.div
                                            key={cls.id}
                                            layout
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`bg-black/50 border transition-all duration-300 rounded-3xl p-6 relative overflow-hidden group ${isBookedByMe ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)] bg-green-950/5' : 'border-white/5 hover:border-white/20'}`}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-dashed ${styles.border} ${styles.text} ${styles.bg}`}>
                                                    {cls.type}
                                                </span>
                                                <span className={`text-[10px] font-mono font-bold tracking-widest ${seatsRemaining <= 3 && !isBookedByMe ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                                                    {isFull ? 'FULLY BOOKED' : `${seatsRemaining} SEATS LEFT`}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1 select-none">
                                                {cls.title}
                                            </h3>
                                            <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                                                {cls.description}
                                            </p>

                                            <div className="space-y-2 mb-6 text-xs text-gray-500 font-mono border-t border-white/5 pt-3">
                                                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-gray-400" /> {cls.time}</div>
                                                <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-gray-400" /> Trainer: <span className="text-gray-300 font-bold">{cls.instructor}</span></div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedClassDetails(cls)}
                                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                                                >
                                                    <Search className="w-3.5 h-3.5 text-cyan-400" /> Details
                                                </button>

                                                {isBookedByMe ? (
                                                    <button
                                                        onClick={() => handleClassBookingToggle(cls.id)}
                                                        className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Cancel
                                                    </button>
                                                ) : isFull ? (
                                                    waitlist.includes(cls.id) ? (
                                                        <button
                                                            onClick={() => handleWaitlistToggle(cls.id)}
                                                            className="flex-1 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
                                                        >
                                                            Waitlisted
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleWaitlistToggle(cls.id)}
                                                            className="flex-1 py-3 bg-amber-600/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/35 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                                                        >
                                                            Waitlist
                                                        </button>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={() => handleClassBookingToggle(cls.id)}
                                                        className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-95 ${styles.btn}`}
                                                    >
                                                        Book
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Booked list highlights summary */}
                    {myBookings.length > 0 && (
                        <div className="bg-gray-950 p-6 rounded-3xl border border-dashed border-green-500/20 mt-10">
                            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                <BookmarkCheck className="w-4 h-4 text-green-400" /> My Group Class Bookings ({myBookings.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {classes.filter(c => myBookings.includes(c.id)).map((c, i) => (
                                    <div key={i} className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-black text-white uppercase">{c.title}</p>
                                            <p className="text-[9px] font-mono text-gray-500 uppercase">{c.day} • {c.time}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleClassBookingToggle(c.id)}
                                            className="text-[9px] text-red-400 font-bold hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 2: ELITE TRAINERS PLATFORM */}
            {activeTab === 'trainers' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Directory list column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-black border border-white/5 p-4 rounded-3xl flex items-center gap-3">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={trainerSearch}
                                    onChange={e => setTrainerSearch(e.target.value)}
                                    placeholder="Search trainer specialty, name, etc."
                                    className="w-full bg-transparent border-none text-white text-sm outline-none font-bold"
                                />
                            </div>

                            <div className="space-y-4">
                                {filteredTrainers.map((trainer) => (
                                    <div
                                        key={trainer.id}
                                        onClick={() => { setSelectedTrainer(trainer); setSelectedSlot(null); }}
                                        className={`p-6 border rounded-[2rem] cursor-pointer transition-all duration-300 flex flex-col md:flex-row gap-5 relative overflow-hidden ${selectedTrainer?.id === trainer.id ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                                    >
                                        <img src={trainer.avatar} alt={trainer.name} className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0" />
                                        <div className="flex-grow space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{trainer.name}</h4>
                                                <span className="flex items-center text-amber-400 text-xs font-mono"><Star className="w-3.5 h-3.5 fill-current mr-0.5" /> {trainer.rating}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 italic mb-2">"{trainer.bio}"</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {trainer.specialty.map((spec, sIdx) => (
                                                    <span key={sIdx} className="bg-white/5 border border-white/10 text-gray-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col justify-between items-end">
                                            <span className="bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 text-[9px] font-mono px-3 py-1 rounded-full uppercase tracking-widest">EXP: {trainer.experience_years} YRS</span>
                                            <p className="text-indigo-400 font-black tracking-tighter text-lg mt-2">{getCurrencySymbol()}{trainer.hourly_rate} <span className="text-[10px] text-gray-500 uppercase tracking-wide">/ Hr</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive live slot booking column */}
                        <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] h-fit space-y-6">
                            <h4 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-white/5">Availability & Live Booking</h4>
                            
                            {!selectedTrainer ? (
                                <div className="text-center py-12 text-gray-500 text-xs">
                                    ❌ Click on an Elite Trainer in the directory to check live available hourly slots.
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl">
                                        <img src={selectedTrainer.avatar} alt={selectedTrainer.name} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-tighter">{selectedTrainer.name.split(' (')[0]}</p>
                                            <p className="text-[9px] text-indigo-400 font-mono">Status: Secure Slot Ready</p>
                                        </div>
                                    </div>

                                    {/* Slot buttons */}
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest font-black text-gray-500 mb-2 ml-1">Available slots for today</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(selectedTrainer.live_slots).map(([time, status]) => (
                                                <button
                                                    key={time}
                                                    disabled={status === 'booked'}
                                                    onClick={() => setSelectedSlot(time)}
                                                    className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
                                                        status === 'booked'
                                                        ? 'bg-red-950/20 text-red-500/40 border-red-950 cursor-not-allowed opacity-50'
                                                        : selectedSlot === time
                                                        ? 'bg-indigo-500 text-black border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                                                        : 'bg-black text-white border-white/10 hover:border-indigo-500/50'
                                                    }`}
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedSlot && (
                                        <button
                                            onClick={handleTrainerBooking}
                                            className="w-full py-4 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-400/30 flex items-center justify-center gap-2 h-14"
                                        >
                                            <CreditCard className="w-4 h-4" /> Book for {getCurrencySymbol()}{selectedTrainer.hourly_rate}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booked PT Session History Logs */}
                    {myPtBookings.length > 0 && (
                        <div className="bg-indigo-950/10 border border-indigo-500/20 p-6 rounded-3xl mt-10">
                            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-indigo-400" /> Active PT Sessions ({myPtBookings.length})
                            </h4>
                            <div className="space-y-3">
                                {myPtBookings.map((pt, idx) => (
                                    <div key={idx} className="bg-black/60 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-white uppercase italic tracking-tighter">{pt.trainerName}</p>
                                            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Slot Time: {pt.slot} | {pt.date}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-xs text-indigo-400">{getCurrencySymbol()}{pt.price} Paid</span>
                                            <button 
                                                onClick={() => handleCancelPtBooking(idx)}
                                                className="text-xs bg-red-950/40 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl uppercase tracking-widest font-black hover:bg-red-500/20 transition-all text-[9px]"
                                            >
                                                Cancel Session
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: GYM EQUIPMENT RESERVATIONS */}
            {activeTab === 'equipment' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Equipment List Left Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="bg-black border border-white/5 p-4 rounded-3xl flex items-center gap-3 flex-grow">
                                    <Search className="w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={equipmentSearch}
                                        onChange={e => setEquipmentSearch(e.target.value)}
                                        placeholder="Search premium equipment (e.g. rack, barbell, rower)..."
                                        className="w-full bg-transparent border-none text-white text-sm outline-none font-bold"
                                    />
                                </div>
                                <div className="flex bg-gray-900/40 p-1 border border-white/10 rounded-2xl shrink-0 overflow-x-auto">
                                    {['All', 'Strength', 'Cardio', 'Functional'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setEqCategoryFilter(cat)}
                                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${eqCategoryFilter === cat ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredEquipment.map((eq) => (
                                    <div
                                        key={eq.id}
                                        onClick={() => { setSelectedEquipment(eq); setSelectedEqSlot(null); }}
                                        className={`p-5 border rounded-[2rem] cursor-pointer transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden ${selectedEquipment?.id === eq.id ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400`}>
                                                    {eq.category}
                                                </span>
                                                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${eq.condition === 'Excellent' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${eq.condition === 'Excellent' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                                                    {eq.condition} Cond.
                                                </span>
                                            </div>
                                            <h4 className="text-base font-black text-white uppercase italic tracking-tighter">{eq.name}</h4>
                                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{eq.description}</p>
                                        </div>

                                        <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500 font-mono uppercase">Deposit Fee</span>
                                            <p className="text-indigo-400 font-black tracking-tight text-sm">{getCurrencySymbol()}{eq.hourly_deposit} <span className="text-[9px] text-gray-500 uppercase font-bold">/ Session</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Slot Reservation Console Right Column */}
                        <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] h-fit space-y-6">
                            <h4 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-white/5">Equipment Console</h4>

                            {!selectedEquipment ? (
                                <div className="text-center py-16 text-gray-500 text-xs">
                                    <Dumbbell className="w-10 h-10 mx-auto text-gray-700 mb-3 animate-pulse" />
                                    <span>Select any heavy equipment to view active time slots and book.</span>
                                </div>
                            ) : (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="bg-white/5 p-4 rounded-2xl space-y-1">
                                        <p className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest">Selected Unit</p>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedEquipment.name}</h4>
                                        <p className="text-xs text-gray-400">Security Refundable Deposit: {getCurrencySymbol()}{selectedEquipment.hourly_deposit}</p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest font-black text-gray-500 mb-2 ml-1">Choose Reservation Hour</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(selectedEquipment.slots).map(([time, status]) => (
                                                <button
                                                    key={time}
                                                    disabled={status === 'booked'}
                                                    onClick={() => setSelectedEqSlot(time)}
                                                    className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
                                                        status === 'booked'
                                                        ? 'bg-red-950/20 text-red-500/40 border-red-950 cursor-not-allowed opacity-50'
                                                        : selectedEqSlot === time
                                                        ? 'bg-indigo-500 text-black border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                                                        : 'bg-black text-white border-white/10 hover:border-indigo-500/50'
                                                    }`}
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedEqSlot && (
                                        <button
                                            disabled={isCheckingOutEq}
                                            onClick={handleEquipmentBooking}
                                            className="w-full py-4 text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/30 flex items-center justify-center gap-2 h-14"
                                        >
                                            {isCheckingOutEq ? (
                                                <span className="animate-pulse">Authorizing...</span>
                                            ) : (
                                                <>
                                                    <CreditCard className="w-4 h-4" /> 
                                                    Pay {getCurrencySymbol()}{selectedEquipment.hourly_deposit} Deposit
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Equipment Bookings & Digital Entry Receipt passes */}
                    {myEqBookings.length > 0 && (
                        <div className="bg-emerald-950/10 border border-emerald-500/20 p-6 rounded-3xl mt-10">
                            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <BadgeCheck className="w-5 h-5 text-emerald-400" /> Active Equipment Entry Passes ({myEqBookings.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myEqBookings.map((eq, idx) => (
                                    <div key={idx} className="bg-black/60 border border-white/5 p-5 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h5 className="text-sm font-black text-white uppercase italic tracking-tighter">{eq.eqName}</h5>
                                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{eq.slot} • {eq.date}</p>
                                                </div>
                                                <span className="text-[8px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">CONFIRMED</span>
                                            </div>

                                            {/* Stylized QR / Barcode element for equipment entry authorization */}
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] text-gray-500 font-mono uppercase">Ticket Authorization ID</p>
                                                    <p className="text-[10px] font-mono text-gray-300 font-bold">{eq.txnId}</p>
                                                    <p className="text-[8px] text-gray-400">Scan at the smart console next to the device</p>
                                                </div>
                                                {/* Visual Barcode bars using pure CSS */}
                                                <div className="flex items-center gap-0.5 h-8 shrink-0 bg-white p-1 rounded">
                                                    <div className="w-0.5 bg-black h-full" />
                                                    <div className="w-[1px] bg-black h-full" />
                                                    <div className="w-1 bg-black h-full" />
                                                    <div className="w-0.5 bg-black h-full" />
                                                    <div className="w-[1px] bg-black h-full" />
                                                    <div className="w-[3px] bg-black h-full" />
                                                    <div className="w-[1px] bg-black h-full" />
                                                    <div className="w-0.5 bg-black h-full" />
                                                    <div className="w-1 bg-black h-full" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                            <span className="font-mono text-[10px] text-gray-500 uppercase">Paid Deposit: {getCurrencySymbol()}{eq.deposit}</span>
                                            <button 
                                                onClick={() => handleCancelEquipmentBooking(eq.txnId)}
                                                className="text-[9px] bg-red-950/40 border border-red-500/20 text-red-400 px-3.5 py-1.5 rounded-xl uppercase tracking-widest font-black hover:bg-red-500/20 transition-all cursor-pointer active:scale-95"
                                            >
                                                Cancel reservation
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 3: AI SCHEDULER & TRAINER MATCHMAKER */}
            {activeTab === 'ai_coach' && (
                <div className="space-y-6">
                    <div className="bg-[#050505] border border-indigo-500/20 p-8 rounded-[3rem] relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                        <div className="absolute right-0 top-0 p-8 opacity-5">
                            <Sparkles className="w-56 h-56 text-indigo-400" />
                        </div>

                        <div className="relative z-10 max-w-2xl space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 text-indigo-400" /> Automated AI Trainer Matchmaker
                                </h3>
                                <p className="text-xs text-grat-300">
                                    Describe your fitness goals (e.g. fat loss, stamina, bodybuilding) and available times, and our AI model will immediately reserve the best slot for you!
                                </p>
                            </div>

                            <div className="space-y-4">
                                <textarea
                                    value={userGoalInput}
                                    onChange={e => setUserGoalInput(e.target.value)}
                                    placeholder="Write your health goal: e.g. I want to build core strength and fix back posture, can I book a session around Monday or Tuesday morning?"
                                    className="w-full h-32 bg-black border border-white/10 rounded-2xl p-4 text-white hover:border-indigo-500/40 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                                />

                                <button
                                    onClick={handleAiRecommendation}
                                    disabled={isAiSearching}
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                                >
                                    {isAiSearching ? 'AI Matchmaker Thinking...' : 'Find & Reserve Perfect Match'}
                                </button>
                            </div>

                            {/* Reply Block */}
                            {aiReply && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-indigo-950/20 border border-indigo-500/30 p-6 rounded-3xl space-y-4"
                                >
                                    <div>
                                        <span className="text-[8px] font-mono uppercase bg-indigo-500 text-black px-2 py-0.5 rounded">MATCH_FOUND</span>
                                        <h4 className="text-lg font-black text-white uppercase italic tracking-tighter mt-1">{aiReply.verdict}</h4>
                                        <p className="text-xs text-indigo-400 mt-1 font-mono">Recommended Scheduling Node: {aiReply.recommended_day}</p>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed italic">"{aiReply.reasoning}"</p>

                                    {/* Interactive shortcut booking buttons */}
                                    <div className="flex gap-3 pt-2">
                                        {aiReply.recommended_class_id && (
                                            <button
                                                onClick={() => {
                                                    const alreadyBooked = myBookings.includes(aiReply.recommended_class_id || '');
                                                    handleClassBookingToggle(aiReply.recommended_class_id || '');
                                                    if (!alreadyBooked) {
                                                        setActiveTab('classes');
                                                        setSelectedDay(aiReply.recommended_day as any || 'Monday');
                                                    }
                                                }}
                                                className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
                                            >
                                                {myBookings.includes(aiReply.recommended_class_id) ? 'Seat Booked ✔' : 'Instant Book Class'}
                                            </button>
                                        )}
                                        {aiReply.recommended_trainer_id && (
                                            <button
                                                onClick={() => {
                                                    const trainer = trainers.find(t => t.id === aiReply.recommended_trainer_id);
                                                    if (trainer) {
                                                        setSelectedTrainer(trainer);
                                                        setActiveTab('trainers');
                                                        addToast("Selected matched trainer in Elite platform.", "success");
                                                    }
                                                }}
                                                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-black font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
                                            >
                                                Schedule Trainer Slots
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Class Details Modal Overlay */}
            <AnimatePresence>
                {selectedClassDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedClassDetails(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="bg-[#0b0c10] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Accent Glow backdrop */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-cyan-500 blur-md rounded-full"></div>

                            {/* Close cross */}
                            <button
                                onClick={() => setSelectedClassDetails(null)}
                                className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full cursor-pointer transition-all"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>

                            {/* Modal Header */}
                            <div className="p-8 pb-4 space-y-4">
                                <div className="flex gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                        {selectedClassDetails.type}
                                    </span>
                                    {myBookings.includes(selectedClassDetails.id) ? (
                                        <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                                            Booked
                                        </span>
                                    ) : (selectedClassDetails.bookedSeats >= selectedClassDetails.totalSeats) ? (
                                        <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                                            Full
                                        </span>
                                    ) : (
                                        <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                            Available
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        {selectedClassDetails.title}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-black/40 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-mono uppercase">Timing</p>
                                            <p className="text-xs font-bold text-white whitespace-nowrap">{selectedClassDetails.time}</p>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                                        <User className="w-5 h-5 text-indigo-400 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-mono uppercase">Coach</p>
                                            <p className="text-xs font-bold text-white">{selectedClassDetails.instructor}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] text-gray-500 font-mono uppercase">Description</span>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        {selectedClassDetails.title === 'Power Vinyasa Flow' ? 'This intense Vinyasa flow workout is perfect for increasing flexibility, toning core muscles, and calming the mind with deep breath synchronization. Beginners and experienced participants are both welcome.' :
                                         selectedClassDetails.title === 'HIIT Cardio Burnout' ? 'A fast-paced and powerful cardio burnout designed to ignite your metabolism and utilize high-intensity interval movements for maximum calorie burn.' :
                                         selectedClassDetails.title === 'Spinning Pulse Ride' ? 'Pedal to the beat of high-energy music. An exciting and inspiring session for lower body development and rapid fat burn assistance.' :
                                         selectedClassDetails.title === 'Ashtanga Morning Yoga' ? 'A traditional yoga session based on the Ashtanga method to improve alignment and energize your entire day through active pranayama/breathwork.' :
                                         selectedClassDetails.title === 'Beast Mode CrossFit' ? 'A powerful session of compound lifts, barbell workouts, and high-intensity moves for building sheer athletic power and strength.' :
                                         selectedClassDetails.title === 'HIIT Tabata Protocol' ? 'A scientific setup of 8 explosive Tabata exercises with 20 seconds work / 10 seconds rest intervals for maximum calorie burning in minimum time.' :
                                         selectedClassDetails.title === 'Combat MMA Basics' ? 'A balanced session covering martial arts fundamentals, boxing stances, kicking coordination, and self-defense movements.' :
                                         selectedClassDetails.title === 'Zumba Fiesta Beat' ? 'An enjoyable and energetic dance workout experiencing full-body toning and stamina development alongside high-tempo rhythms.' :
                                         selectedClassDetails.title === 'Spinning Endurance Hills' ? 'Pedal climbing on simulated hill resistance. A tough physical cycle challenge focusing on thigh, hamstring, and calf strength.' :
                                         selectedClassDetails.title === 'Abs & Core Blast' ? 'Targeted core stabilization and abdominal exercises to build six-pack abs and a strong, supportive lower back.' :
                                         selectedClassDetails.title === 'Yin Yoga Restorative' ? 'Deep and relaxing stretches to soothe soreness from training, promote mental calmness, and prepare your body for deep recovery sleep.' :
                                         selectedClassDetails.title === 'Weekend CrossFit War' ? 'A collaborative and challenging weekend workout dynamic utilizing advanced barbell and dumbbell weightlifting elements.' :
                                         selectedClassDetails.title === 'Aerobics Masterclass' ? 'Develop cardiovascular efficiency, lung capacity, and general cardio fitness through music-synchronized rhythmic movements.' : selectedClassDetails.description}
                                    </p>
                                </div>

                                {/* Seat Capacity progress meter */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-gray-400">Reserved Spots</span>
                                        <span className="text-cyan-400 font-bold">{selectedClassDetails.bookedSeats} / {selectedClassDetails.totalSeats} seats booked</span>
                                    </div>
                                    <div className="w-full bg-black/60 border border-white/5 p-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                                            style={{ width: `${(selectedClassDetails.bookedSeats / selectedClassDetails.totalSeats) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="p-8 flex gap-4">
                                <button
                                    onClick={() => setSelectedClassDetails(null)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95"
                                >
                                    Close
                                </button>

                                {myBookings.includes(selectedClassDetails.id) ? (
                                    <button
                                        onClick={() => {
                                            handleClassBookingToggle(selectedClassDetails.id);
                                            // update modal state
                                            setSelectedClassDetails(prev => prev ? { ...prev, bookedSeats: Math.max(0, prev.bookedSeats - 1) } : null);
                                        }}
                                        className="flex-[1.5] py-4 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95"
                                    >
                                        Cancel Booking
                                    </button>
                                ) : selectedClassDetails.bookedSeats >= selectedClassDetails.totalSeats ? (
                                    waitlist.includes(selectedClassDetails.id) ? (
                                        <button
                                            onClick={() => {
                                                handleWaitlistToggle(selectedClassDetails.id);
                                            }}
                                            className="flex-[1.5] py-4 bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95"
                                        >
                                            Leave Waitlist
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                handleWaitlistToggle(selectedClassDetails.id);
                                            }}
                                            className="flex-[1.5] py-4 bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95"
                                        >
                                            Join Waitlist
                                        </button>
                                    )
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleClassBookingToggle(selectedClassDetails.id);
                                            setSelectedClassDetails(prev => prev ? { ...prev, bookedSeats: prev.bookedSeats + 1 } : null);
                                        }}
                                        className="flex-[1.5] py-4 bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-95"
                                    >
                                        Confirm Seat
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
