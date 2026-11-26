import React, { useState } from 'react';
import { 
    ExternalLink, Dna, Activity, Shield, Award, 
    BookOpen, Layers, CheckCircle2, Copy, Check,
    Sparkles, ArrowUpRight, Database, HeartPulse
} from 'lucide-react';
import { BenchmarkTarget, PLDDT_BANDS } from './scienceData';

interface ProteinInspectorProps {
    target: BenchmarkTarget;
    sourceMode: 'alphafold' | 'pdb';
    onSelectSourceMode: (mode: 'alphafold' | 'pdb') => void;
    hoveredResidue?: { resn: string; resi: number; chain: string; b: number } | null;
}

export const ProteinInspector: React.FC<ProteinInspectorProps> = ({
    target,
    sourceMode,
    onSelectSourceMode,
    hoveredResidue
}) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'physiology' | 'domains' | 'literature'>('physiology');

    const handleCopy = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Calculate pLDDT color category
    const getPlddtCategory = (score: number) => {
        if (score >= 90) return { label: 'Very High Confidence', color: '#0053D6', bg: 'bg-blue-900/30 text-blue-300 border-blue-500/40' };
        if (score >= 70) return { label: 'Confident Backbone', color: '#65CBF3', bg: 'bg-sky-900/30 text-sky-300 border-sky-500/40' };
        if (score >= 50) return { label: 'Low / Flexible Loop', color: '#FFDB13', bg: 'bg-yellow-900/30 text-yellow-300 border-yellow-500/40' };
        return { label: 'Intrinsically Disordered', color: '#FF7D45', bg: 'bg-orange-900/30 text-orange-300 border-orange-500/40' };
    };

    const plddtCategory = getPlddtCategory(target.meanPlddt);

    return (
        <div className="flex flex-col h-full bg-[#0b0f17] border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-200">
            
            {/* Header: Identity & Accession Coordinates */}
            <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#0b0f17]">
                
                {/* Source Coordinate Toggle */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Macromolecular Target</span>
                    </span>

                    <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
                        <button
                            type="button"
                            onClick={() => onSelectSourceMode('alphafold')}
                            className={`px-2.5 py-1 rounded-md transition-all ${sourceMode === 'alphafold' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                            AlphaFold v6
                        </button>
                        <button
                            type="button"
                            onClick={() => onSelectSourceMode('pdb')}
                            className={`px-2.5 py-1 rounded-md transition-all ${sourceMode === 'pdb' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                            RCSB PDB
                        </button>
                    </div>
                </div>

                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                            {target.geneSymbol}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-normal">
                                {target.category}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-300 mt-0.5 font-medium">
                            {target.proteinName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {target.organism}
                        </p>
                    </div>
                </div>

                {/* Primary Identifiers Bar */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase">UniProtKB</span>
                            <span className="font-bold text-white">{target.uniprotId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleCopy(target.uniprotId, 'uniprot')}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                title="Copy Accession"
                            >
                                {copiedField === 'uniprot' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                                href={`https://www.uniprot.org/uniprotkb/${target.uniprotId}/entry`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                                title="Open UniProtKB"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase">PDB Entry</span>
                            <span className="font-bold text-white">{target.pdbId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleCopy(target.pdbId, 'pdb')}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                title="Copy PDB ID"
                            >
                                {copiedField === 'pdb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                                href={`https://www.rcsb.org/structure/${target.pdbId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                                title="Open RCSB PDB"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* AlphaFold Confidence Strip */}
                <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 uppercase text-[10px] tracking-wider">AlphaFold pLDDT Score</span>
                        <span className="font-bold tabular-nums text-white">{target.meanPlddt} / 100</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.min(100, Math.max(5, target.meanPlddt))}%`,
                                backgroundColor: plddtCategory.color
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${plddtCategory.bg}`}>
                            {plddtCategory.label}
                        </span>
                        <a
                            href={`https://alphafold.ebi.ac.uk/entry/${target.uniprotId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                            <span>AlphaFold DB</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                    </div>
                </div>

            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/50 text-xs font-mono px-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('physiology')}
                    className={`py-2.5 px-3 border-b-2 font-medium transition-all ${activeTab === 'physiology' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Athletic & Physiology
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('domains')}
                    className={`py-2.5 px-3 border-b-2 font-medium transition-all ${activeTab === 'domains' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Domains & Sites ({target.keyDomains.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('literature')}
                    className={`py-2.5 px-3 border-b-2 font-medium transition-all ${activeTab === 'literature' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Biometrics & Literature
                </button>
            </div>

            {/* Tab Contents Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs font-sans">
                
                {activeTab === 'physiology' && (
                    <div className="space-y-4">
                        {/* Physiological Mechanism */}
                        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider">
                                <Activity className="w-3.5 h-3.5" />
                                <span>Physiological Mechanism</span>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                {target.physiologicalImpact}
                            </p>
                        </div>

                        {/* Athletic & Training Context */}
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider">
                                <HeartPulse className="w-3.5 h-3.5" />
                                <span>Gym & Hypertrophic Translation</span>
                            </div>
                            <p className="text-emerald-100/90 text-xs leading-relaxed">
                                {target.athleticContext}
                            </p>
                        </div>

                        {/* Biochemical Metrics Card */}
                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-slate-500 uppercase text-[9px] block">Sequence Length</span>
                                <span className="text-white font-bold">{target.sequenceLength} Amino Acids</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-slate-500 uppercase text-[9px] block">Molecular Weight</span>
                                <span className="text-white font-bold">{target.molecularWeightKDa} kDa</span>
                            </div>
                        </div>

                        {/* General Description */}
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block mb-1">
                                Functional Abstract
                            </span>
                            <p className="text-slate-300 text-xs leading-relaxed font-sans">
                                {target.description}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'domains' && (
                    <div className="space-y-4">
                        {/* Structural Domains */}
                        <div className="space-y-2">
                            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
                                Annotated Structural Domains
                            </span>
                            <div className="space-y-1.5">
                                {target.keyDomains.map((domain, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                                        <Layers className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                        <span className="text-slate-200">{domain}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Catalytic & Active Sites */}
                        {target.catalyticSites && target.catalyticSites.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
                                    Binding Interfaces & Catalytic Coordinates
                                </span>
                                <div className="space-y-1.5">
                                    {target.catalyticSites.map((site, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs font-mono text-amber-200">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                            <span>{site}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'literature' && (
                    <div className="space-y-4 font-mono text-xs">
                        {/* Peer-Reviewed Scientific Evidence */}
                        <div className="space-y-2">
                            <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                                PubMed & Europe PMC Direct Grounding
                            </span>
                            
                            <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(target.geneSymbol + ' exercise muscle hypertrophy')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <BookOpen className="w-4 h-4 text-cyan-400" />
                                    <div>
                                        <div className="font-bold text-white group-hover:text-cyan-300">
                                            {target.geneSymbol} in Exercise Adaptation
                                        </div>
                                        <div className="text-[10px] text-slate-400">NCBI PubMed Central Index</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                            </a>

                            <a
                                href={`https://www.ebi.ac.uk/pdbe/entry/pdb/${target.pdbId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Dna className="w-4 h-4 text-emerald-400" />
                                    <div>
                                        <div className="font-bold text-white group-hover:text-emerald-300">
                                            PDBe Validation Metrics ({target.pdbId})
                                        </div>
                                        <div className="text-[10px] text-slate-400">EMBL-EBI Macromolecular Structure</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                            </a>

                            <a
                                href={`https://alphafold.ebi.ac.uk/entry/${target.uniprotId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <div>
                                        <div className="font-bold text-white group-hover:text-blue-300">
                                            AlphaFold PAE Error Matrix & pLDDT
                                        </div>
                                        <div className="text-[10px] text-slate-400">Google DeepMind & EMBL-EBI</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                            </a>
                        </div>
                    </div>
                )}

            </div>

            {/* Bottom Citation & Epistemic Badges */}
            <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 font-mono text-[10px] text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>DeepMind Science Suite v2.4</span>
                </div>
                <span>Curated & Validated</span>
            </div>

        </div>
    );
};
