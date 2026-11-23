import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React, { useState } from 'react';
import { User, Star, Calendar, Clock, DollarSign, CheckCircle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import { FEATURE_IMAGES } from '../../data/featureMedia';

type Trainer = {
    id: string;
    name: string;
    specialty: string;
    experience: string;
    rating: number;
    price: number;
    image: string;
    bio: string;
};

const trainers: Trainer[] = [
    {
        id: 't1',
        name: 'Arjun Singh',
        specialty: 'Strength & Conditioning',
        experience: '8 Years',
        rating: 4.9,
        price: 1500,
        image: FEATURE_IMAGES.personalTrainerHub,
        bio: 'Former national powerlifter. Specializes in building functional strength and muscle mass.'
    },
    {
        id: 't2',
        name: 'Priya Sharma',
        specialty: 'Yoga & Mobility',
        experience: '5 Years',
        rating: 5.0,
        price: 1200,
        image: FEATURE_IMAGES.staffOperations,
        bio: 'Certified Ashtanga Yoga instructor focusing on flexibility, injury prevention, and core stability.'
    },
    {
        id: 't3',
        name: 'Vikram Das',
        specialty: 'HIIT & Fat Loss',
        experience: '6 Years',
        rating: 4.8,
        price: 1300,
        image: FEATURE_IMAGES.onboardingAssessment,
        bio: 'High-energy trainer specialized in extreme fat loss protocols and cardiovascular endurance.'
    }
];

export default function FitnessFutureTraining() {
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const handleBook = (trainer: Trainer) => {
        setSelectedTrainer(trainer);
        setIsBookingModalOpen(true);
        setBookingSuccess(false);
    };

    const confirmBooking = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingSuccess(true);
        setTimeout(() => {
            setIsBookingModalOpen(false);
            setBookingSuccess(false);
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            <div className="bg-black border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Personal Training</h1>
                <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">Connect with elite coaches</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((trainer) => (
                    <div key={trainer.id} className="bg-black/60 border border-white/10 rounded-[2.5rem] overflow-hidden group hover:border-cyan-500/50 transition-all shadow-xl">
                        <div className="h-48 overflow-hidden relative">
                            <img src={(trainer as any).image || "https://i.pravatar.cc/300?u=" + trainer.id} alt={trainer.name} className="w-full h-48 object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{trainer.name}</h3>
                                    <p className="text-[10px] bg-cyan-600 text-white px-2 py-1 rounded inline-block uppercase tracking-widest font-bold mt-1">
                                        {trainer.specialty}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-yellow-400">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-bold">{trainer.rating}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">{trainer.bio}</p>
                            
                            <div className="flex justify-between items-center mb-6 text-sm font-mono text-gray-300">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                    <span>{trainer.experience} Exp</span>
                                </div>
                                <div className="flex items-center gap-1 font-bold text-white">
                                    <DollarSign className="w-4 h-4 text-cyan-400" />
                                    <span>{trainer.price} <span className="text-[10px] text-gray-500 uppercase">/ Session</span></span>
                                </div>
                            </div>

                            <button onClick={() => handleBook(trainer)} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity">
                                Book Session
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Confirm Session">
                {bookingSuccess ? (
                     <div className="text-center py-10 animate-scale-in">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-2">
                            Session Confirmed
                        </h3>
                        <p className="text-gray-400 text-sm">Your booking with {selectedTrainer?.name} is complete.</p>
                    </div>
                ) : (
                    <form onSubmit={confirmBooking} className="space-y-6">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <img src={(selectedTrainer as any)?.image || "https://i.pravatar.cc/150?u=" + selectedTrainer?.id} alt={selectedTrainer?.name || "Trainer"} className="w-16 h-16 object-cover rounded-2xl border border-cyan-500/30" />
                            <div>
                                <h4 className="text-white font-bold">{selectedTrainer?.name}</h4>
                                <p className="text-xs text-cyan-400">{selectedTrainer?.specialty}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Select Date</label>
                                <input type="date" required className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Select Time</label>
                                <input type="time" required className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 font-mono uppercase">Total Fee</p>
                                <p className="text-2xl font-black text-white italic">{getCurrencySymbol()}{selectedTrainer?.price}</p>
                                <p className="text-[9px] text-cyan-400 font-mono uppercase mt-1">Direct UPI Route Active</p>
                            </div>
                            <button type="submit" className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 flex flex-col items-center">
                                <span>Pay via UPI</span>
                                <span className="text-[8px] font-mono opacity-80 mt-1">your-upi@bank</span>
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
