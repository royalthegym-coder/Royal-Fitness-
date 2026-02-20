
import React, { useState, useMemo } from 'react';
import { Lead, LeadSource, LeadStage } from '../../types';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { getComplexResponse, cleanAndParseJSON } from '../../lib/gemini';
import { 
    Target, Search, BrainCircuit, RefreshCw, 
    UserPlus, Edit3, Trash2, 
    MessageSquare, CheckCircle, ArrowRight, ChevronRight
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, WalkInIcon, WebIcon, OtherSourceIcon } from './icons/SocialIcons';
import { BotIcon } from './icons/BotIcon';

const SourceIcon: React.FC<{ source: LeadSource, className?: string }> = ({ source, className = "w-5 h-5" }) => {
    switch (source) {
        case 'Facebook': return <FacebookIcon className={className} />;
        case 'Instagram': return <InstagramIcon className={className} />;
        case 'Website': return <WebIcon className={className} />;
        case 'Walk-in': return <WalkInIcon className={className} />;
        default: return <OtherSourceIcon className={className} />;
    }
};

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500/50 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
    if (score >= 50) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    return 'text-red-400 border-red-500/50 bg-red-500/10';
};

const Leads: React.FC = () => {
    const { addToast } = useToast();
    const { leads = [], updateLead } = useData();
    const [isScoring, setIsScoring] = useState(false);

    const pipelineData = useMemo<Record<LeadStage, Lead[]>>(() => {
        const stages: LeadStage[] = ['New', 'Contacted', 'Trial', 'Converted', 'Lost'];
        const grouped = {} as Record<LeadStage, Lead[]>;
        stages.forEach(stage => grouped[stage] = []);
        leads.forEach(lead => {
            if (grouped[lead.status]) grouped[lead.status].push(lead);
        });
        return grouped;
    }, [leads]);

    const handleRunScoring = async () => {
        setIsScoring(true);
        addToast("Hunter Alpha: Analyzing lead vectors...", "info");
        
        const unscoredLeads = leads.filter(l => !l.aiScore);
        if(unscoredLeads.length === 0) {
            addToast("All leads are already scored.", "success");
            setIsScoring(false);
            return;
        }

        const prompt = `
            Analyze these gym leads: ${JSON.stringify(unscoredLeads.map(l => ({id: l.id, name: l.name, source: l.source})))}.
            Score each from 0-100 on conversion probability. Instagram/Website = high intent.
            Return ONLY a JSON array: [{"id": number, "score": number}].
        `;

        try {
            const res = await getComplexResponse(prompt);
            const scores = cleanAndParseJSON(res);
            
            scores.forEach((s: {id: number, score: number}) => {
                const lead = leads.find(l => l.id === s.id);
                if (lead) updateLead({ ...lead, aiScore: s.score });
            });
            addToast("Neural Scoring Complete.", "success");
        } catch (e) {
            addToast("Scoring failed.", "error");
        } finally {
            setIsScoring(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24 h-full flex flex-col">
            <div className="bg-black/80 p-8 rounded-[3.5rem] border border-amber-500/20 relative overflow-hidden shadow-2xl group">
                <div className="flex items-center gap-8">
                    <div className="p-8 bg-amber-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(245,158,11,0.5)] border border-amber-400">
                        <Target className="w-16 h-16" />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter">Future Streams</h1>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <BotIcon className="w-10 h-10 text-amber-500" />
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic">Hunter Alpha AI</h3>
                        <p className="text-xs text-gray-500">Predictive Lead Qualification Engine</p>
                    </div>
                </div>
                <button onClick={handleRunScoring} disabled={isScoring} className="bg-white text-black font-black px-10 py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg flex items-center gap-3 active:scale-95 disabled:opacity-50">
                    {isScoring ? <RefreshCw className="animate-spin w-4 h-4"/> : <BrainCircuit className="w-4 h-4"/>}
                    {isScoring ? 'SCORING...' : 'RUN AI SCORING'}
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-10 min-h-[650px] snap-x custom-scrollbar">
                {(Object.entries(pipelineData) as [LeadStage, Lead[]][]).map(([stage, leads]) => (
                    <div key={stage} className="min-w-[340px] w-[340px] flex flex-col bg-[#050505] rounded-[3rem] border border-white/5 backdrop-blur-sm relative overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gray-900/30">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">{stage}</h3>
                            <span className="bg-white/5 text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10">{leads.length}</span>
                        </div>
                        
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-black/20">
                            {leads.map((lead) => (
                                <div key={lead.id} className="bg-[#0c0c0c] p-6 rounded-[2.5rem] border border-white/5 hover:border-amber-500/50 transition-all group shadow-lg relative cursor-pointer hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-900 rounded-2xl border border-white/10 text-gray-400 group-hover:text-amber-500 transition-colors shadow-inner">
                                                <SourceIcon source={lead.source} className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-lg uppercase italic tracking-tight leading-none">{lead.name}</h4>
                                                <p className="text-[9px] text-gray-500 font-mono mt-1 tracking-wider">{lead.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getScoreColor(lead.aiScore || 0)}`}>
                                            {lead.aiScore ? `${lead.aiScore}% Prob.` : 'Unscored'}
                                        </div>
                                        <span className="text-[9px] text-gray-600 font-mono">{lead.inquiryDate}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leads;
