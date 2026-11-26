import React, { useState, useMemo } from 'react';
import { 
    Dna, Search, Sparkles, Filter, Database, 
    Activity, ShieldCheck, Microscope, RefreshCw, 
    ArrowRight, Info, BookOpen, Layers, Award, 
    HeartPulse, Globe, ExternalLink
} from 'lucide-react';
import { BENCHMARK_TARGETS, BenchmarkTarget } from './scienceData';
import { MolecularViewer3D } from './MolecularViewer3D';
import { ProteinInspector } from './ProteinInspector';

export const BioscienceHub: React.FC = () => {
    const [selectedTarget, setSelectedTarget] = useState<BenchmarkTarget>(BENCHMARK_TARGETS[0]);
    const [sourceMode, setSourceMode] = useState<'alphafold' | 'pdb'>('alphafold');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [customSearchLoading, setCustomSearchLoading] = useState(false);
    const [customSearchError, setCustomSearchError] = useState<string | null>(null);
    const [hoveredResidue, setHoveredResidue] = useState<{ resn: string; resi: number; chain: string; b: number } | null>(null);

    // Filter targets based on search and category
    const filteredTargets = useMemo(() => {
        return BENCHMARK_TARGETS.filter(t => {
            const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
            const matchesSearch = 
                t.geneSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.proteinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.uniprotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.pdbId.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    // Handle custom UniProt/PDB Search via public APIs
    const handleCustomSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        // Check if query matches existing benchmark
        const existing = BENCHMARK_TARGETS.find(t => 
            t.geneSymbol.toLowerCase() === query.toLowerCase() ||
            t.uniprotId.toLowerCase() === query.toLowerCase() ||
            t.pdbId.toLowerCase() === query.toLowerCase()
        );

        if (existing) {
            setSelectedTarget(existing);
            return;
        }

        setCustomSearchLoading(true);
        setCustomSearchError(null);

        try {
            // If 4 characters, try as RCSB PDB ID
            if (/^[0-9][a-zA-Z0-9]{3}$/i.test(query)) {
                const pdbId = query.toUpperCase();
                const res = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
                if (res.ok) {
                    const data = await res.json();
                    const newTarget: BenchmarkTarget = {
                        geneSymbol: pdbId,
                        proteinName: data.struct?.title || `Macromolecular Structure ${pdbId}`,
                        uniprotId: 'CUSTOM',
                        pdbId,
                        category: 'Musculoskeletal',
                        organism: data.rcsb_entry_info?.polymer_composition || 'Synthetic / Biological',
                        sequenceLength: data.rcsb_entry_info?.deposited_polymer_monomer_count || 300,
                        molecularWeightKDa: Number((data.rcsb_entry_info?.molecular_weight || 35000) / 1000).toFixed(1) as any,
                        physiologicalImpact: `Experimental structure determined by ${data.exptl?.[0]?.method || 'X-Ray Diffraction'}.`,
                        athleticContext: 'Biomolecular structural coordinate fetched directly from RCSB Protein Data Bank.',
                        meanPlddt: 90.0,
                        keyDomains: [`PDB Experimental Resolution: ${data.rcsb_entry_info?.resolution_combined?.[0] || 'N/A'} Å`],
                        description: data.struct?.title || 'Experimentally solved macromolecular complex.'
                    };
                    setSelectedTarget(newTarget);
                    setSourceMode('pdb');
                    setCustomSearchLoading(false);
                    return;
                }
            }

            // Query UniProtKB Search API
            const uniRes = await fetch(`https://rest.uniprot.org/uniprotkb/search?query=gene:${encodeURIComponent(query)}+AND+organism_id:9606&format=json&size=1`);
            if (uniRes.ok) {
                const uniData = await uniRes.json();
                if (uniData.results && uniData.results.length > 0) {
                    const hit = uniData.results[0];
                    const accession = hit.primaryAccession;
                    const geneName = hit.genes?.[0]?.geneName?.value || query.toUpperCase();
                    const proteinName = hit.proteinDescription?.recommendedName?.fullName?.value || hit.proteinDescription?.submissionNames?.[0]?.fullName?.value || geneName;
                    const seqLength = hit.sequence?.length || 200;
                    const molWeight = hit.sequence?.molWeight ? (hit.sequence.molWeight / 1000).toFixed(1) : 25;

                    const newTarget: BenchmarkTarget = {
                        geneSymbol: geneName,
                        proteinName,
                        uniprotId: accession,
                        pdbId: hit.uniProtKBCrossReferences?.find((r: any) => r.database === 'PDB')?.id || '1TUP',
                        category: 'Metabolism & Anabolism',
                        organism: 'Homo sapiens (Human)',
                        sequenceLength: seqLength,
                        molecularWeightKDa: Number(molWeight),
                        physiologicalImpact: hit.comments?.find((c: any) => c.commentType === 'FUNCTION')?.texts?.[0]?.value || 'Human biochemical regulator.',
                        athleticContext: 'Human protein involved in cellular energetics, mechanical contraction, or stress adaptation.',
                        meanPlddt: 85.0,
                        keyDomains: [`UniProt Accession: ${accession}`, `Sequence: ${seqLength} aa`],
                        description: hit.comments?.find((c: any) => c.commentType === 'FUNCTION')?.texts?.[0]?.value || 'UniProtKB curated protein entry.'
                    };

                    setSelectedTarget(newTarget);
                    setSourceMode('alphafold');
                    setCustomSearchLoading(false);
                    return;
                }
            }

            throw new Error(`No human protein found matching "${query}". Try standard symbols like TP53, INS, ACTB, or PDB ID like 1TUP.`);
        } catch (err: any) {
            console.warn('Custom search fallback:', err);
            setCustomSearchError(err.message || 'Protein lookup failed.');
        } finally {
            setCustomSearchLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
            
            {/* Top Telemetry & Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0b0f17] to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-[11px] uppercase tracking-widest w-fit mb-3">
                            <Microscope className="w-3.5 h-3.5 animate-pulse" />
                            <span>Google DeepMind Science Engine &bull; AlphaFold DB v6</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white font-mono uppercase">
                            Bioscience <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">Intelligence Hub</span>
                        </h1>
                        <p className="text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
                            Empirical biomacromolecular workbench powered by real-time AlphaFold DB 3D predictions, RCSB PDB experimental coordinates, and UniProtKB physiological annotations.
                        </p>
                    </div>

                    {/* Scientific Badge Stats */}
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-center">
                            <span className="text-xs text-slate-400 uppercase">Confidence</span>
                            <span className="text-lg font-bold text-cyan-400 tabular-nums">pLDDT 0-100</span>
                        </div>
                        <div className="flex flex-col items-center px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-center">
                            <span className="text-xs text-slate-400 uppercase">Structures</span>
                            <span className="text-lg font-bold text-emerald-400 tabular-nums">200M+ AFDB</span>
                        </div>
                    </div>
                </div>

                {/* Quick-Try Benchmark Chips */}
                <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80">
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Preloaded Benchmark Biological Targets</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {BENCHMARK_TARGETS.map(t => {
                            const isSelected = selectedTarget.geneSymbol === t.geneSymbol;
                            return (
                                <button
                                    key={t.geneSymbol}
                                    type="button"
                                    onClick={() => {
                                        setSelectedTarget(t);
                                        setSearchQuery('');
                                    }}
                                    className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all flex items-center gap-2 cursor-pointer ${
                                        isSelected 
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold'
                                            : 'bg-slate-950/70 hover:bg-slate-800/90 text-slate-300 border border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.meanPlddt >= 90 ? '#0053D6' : t.meanPlddt >= 70 ? '#65CBF3' : '#FFDB13' }}></span>
                                    <span>{t.geneSymbol}</span>
                                    <span className="text-[10px] text-slate-500 font-normal">({t.uniprotId})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Query & Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
                
                {/* Search Input */}
                <form onSubmit={handleCustomSearchSubmit} className="flex-1 flex items-center gap-2 max-w-xl">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Query Gene (e.g. EGFR, MTOR), UniProt (P04637), or PDB ID (1TUP)..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={customSearchLoading}
                        className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/20"
                    >
                        {customSearchLoading ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Searching...</span>
                            </>
                        ) : (
                            <>
                                <span>Fetch</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-mono">
                    <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 hidden sm:block" />
                    {['All', 'Metabolism & Anabolism', 'Musculoskeletal', 'Longevity & DNA Repair', 'Cardiorespiratory'].map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

            </div>

            {/* Custom Search Error Alert */}
            {customSearchError && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{customSearchError}</span>
                </div>
            )}

            {/* Asymmetric Split Scientific Workbench */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left/Main Column: 3D WebGL Macromolecular Viewer (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                    <MolecularViewer3D
                        target={selectedTarget}
                        sourceMode={sourceMode}
                        onAtomHover={(atom) => setHoveredResidue(atom)}
                    />

                    {/* Scientific Knowledge Explainer Ribbon */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                                <Database className="w-3.5 h-3.5" />
                                <span>AlphaFold DB Coordinate Specs</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Predicted models stream directly from EMBL-EBI in modern mmCIF format. Confidence is calculated per-residue via Predicted Local Distance Difference Test (pLDDT).
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>RCSB PDB Experimental Parity</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Experimental atomic coordinates solved via X-ray crystallography and Cryo-Electron Microscopy (Cryo-EM) archived in the worldwide Protein Data Bank.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Synchronized Biomacromolecular Inspector (5 Cols) */}
                <div className="lg:col-span-5 h-[620px]">
                    <ProteinInspector
                        target={selectedTarget}
                        sourceMode={sourceMode}
                        onSelectSourceMode={(m) => setSourceMode(m)}
                        hoveredResidue={hoveredResidue}
                    />
                </div>

            </div>

        </div>
    );
};

export default BioscienceHub;
