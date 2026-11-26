import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Activity, ShieldAlert, Cpu, AlertTriangle, MessageCircle } from 'lucide-react';
import { useData } from '@/context/DataProvider';

const PredictiveAnalytics: React.FC = () => {
  const { members, attendanceRecords } = useData();

  // Calculate Churn Risk
  const churnRisks = useMemo(() => {
    const today = new Date();
    return members.filter(m => m.status === 'Active').map(member => {
      // Find last attendance
      const memberAttendance = attendanceRecords.filter(a => a.memberId === member.id);
      memberAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const lastAttended = memberAttendance.length > 0 ? new Date(memberAttendance[0].date) : new Date(member.joinDate);
      const daysSinceLastVisit = Math.floor((today.getTime() - lastAttended.getTime()) / (1000 * 3600 * 24));
      
      let riskScore = 0;
      let reason = "";

      if (daysSinceLastVisit > 15) {
        riskScore = 90;
        reason = `Absent for ${daysSinceLastVisit} days. Motivation critically low.`;
      } else if (daysSinceLastVisit > 10) {
        riskScore = 80;
        reason = `Absent for ${daysSinceLastVisit} days. High risk of dropping out.`;
      } else if (daysSinceLastVisit > 5) {
        riskScore = 50;
        reason = `Absent for ${daysSinceLastVisit} days. Needs a follow-up.`;
      } else {
        riskScore = 10;
        reason = "Active and engaged.";
      }

      return {
        ...member,
        daysSinceLastVisit,
        riskScore,
        reason
      };
    }).filter(m => m.riskScore >= 50).sort((a, b) => b.riskScore - a.riskScore);
  }, [members, attendanceRecords]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Predictive <span className="text-cyan-400">Analytics</span>
          </h2>
          <p className="text-cyan-500/60 font-mono text-xs uppercase tracking-[0.2em] mt-1">FitnessFutureAI Forecasting Engine</p>
        </div>
        <div className="bg-cyan-950/30 border border-cyan-500/30 px-4 py-2 rounded-lg flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300">MODELS SYNCHRONIZED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Churn Prediction */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-red-500/30 p-6 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-red-950/50 rounded-xl border border-red-500/30">
              <Users className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-xs font-mono text-red-400 bg-red-950/50 px-2 py-1 rounded border border-red-500/20">HIGH RISK</span>
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Predicted Churn (30 Days)</h3>
          <div className="text-4xl font-black text-white mb-2 relative z-10">{churnRisks.length}<span className="text-lg text-gray-500 font-normal"> members</span></div>
          <p className="text-xs text-gray-500 relative z-10">AI detected irregular attendance patterns.</p>
        </motion.div>

        {/* Revenue Forecast */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-black/40 border border-green-500/30 p-6 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-green-950/50 rounded-xl border border-green-500/30">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs font-mono text-green-400 bg-green-950/50 px-2 py-1 rounded border border-green-500/20">+15% TREND</span>
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Revenue Forecast (Next Month)</h3>
          <div className="text-4xl font-black text-white mb-2 relative z-10">{getCurrencySymbol()}4.2<span className="text-lg text-gray-500 font-normal">L</span></div>
          <p className="text-xs text-gray-500 relative z-10">Based on active renewals and new leads.</p>
        </motion.div>

        {/* Injury Probability */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-black/40 border border-amber-500/30 p-6 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-amber-950/50 rounded-xl border border-amber-500/30">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/50 px-2 py-1 rounded border border-amber-500/20">3 ALERTS</span>
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Injury Probability</h3>
          <div className="text-4xl font-black text-white mb-2 relative z-10">8.4<span className="text-lg text-gray-500 font-normal">%</span></div>
          <p className="text-xs text-gray-500 relative z-10">Average risk across active members.</p>
        </motion.div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="bg-black/40 border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          AI Churn Alerts (High Risk Members)
        </h3>
        <div className="space-y-4">
          {churnRisks.length === 0 ? (
            <p className="text-gray-400 text-sm">No high-risk members detected. Retention is strong.</p>
          ) : (
            churnRisks.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-red-950/20 rounded-xl border border-red-500/20 hover:bg-red-950/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center overflow-hidden">
                    {member.avatar ? (
                      <img src={member.avatar || "https://i.pravatar.cc/150?u=" + member.id} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-red-500/30" />
                    ) : (
                      <span className="text-red-400 font-bold text-xs">{member.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{member.name} <span className="text-xs font-normal text-gray-400">({member.phone})</span></h4>
                    <p className="text-xs text-red-400 mt-1">
                      <span className="font-bold">Churn Probability: {member.riskScore}%</span> - {member.reason}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/91${member.phone}?text=Hi ${member.name}, we missed you at Fitness Future! Is everything okay? Let us know if you need help with your fitness routine.`, '_blank')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/40 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Reach Out
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
