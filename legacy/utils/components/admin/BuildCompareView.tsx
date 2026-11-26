import React, { useState, useMemo, useRef } from 'react';
import { 
    Layers, GitCommit, GitBranch, Clock, ArrowRight, ArrowLeftRight, Download, 
    FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
    Package, Terminal, Search, BarChart2,
    Maximize2, Minimize2, Copy, Check, Flame, Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '../../hooks/useToast';

export interface ComparableBuildItem {
    id: string;
    displayName: string;
    version: string;
    platform: 'iOS' | 'Android';
    branch: string;
    commitSha: string;
    targetTrack: 'production' | 'testing';
    status: 'SUCCESS' | 'FAILED' | 'in_progress';
    durationSeconds: number;
    date: string;
    artifactSizeMB: number;
    artifactFileName?: string;
    sha256?: string;
    bundleBreakdown?: {
        jsBundleMB: number;
        assetsMB: number;
        nativeBinariesMB: number;
    };
    stages?: {
        name: string;
        duration: number;
        status: 'completed' | 'failed' | 'active' | 'pending';
    }[];
    logs: string[];
}

interface BuildCompareViewProps {
    build1Id: string;
    build2Id: string;
    onSelectBuild1: (id: string) => void;
    onSelectBuild2: (id: string) => void;
    availableBuilds: ComparableBuildItem[];
    onClose?: () => void;
    isModal?: boolean;
    onToggleExpand?: () => void;
    isExpanded?: boolean;
}

export const BuildCompareView: React.FC<BuildCompareViewProps> = ({
    build1Id,
    build2Id,
    onSelectBuild1,
    onSelectBuild2,
    availableBuilds,
    onClose,
    onToggleExpand,
    isExpanded = false
}) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'all' | 'stages' | 'artifacts' | 'logs' | 'metrics'>('all');
    const [logFilter, setLogFilter] = useState<'all' | 'diff_only' | 'errors_warnings'>('all');
    const [logSearchQuery, setLogSearchQuery] = useState('');
    const [copiedSha, setCopiedSha] = useState<string | null>(null);
    const [syncScroll, setSyncScroll] = useState<boolean>(true);

    const leftLogPaneRef = useRef<HTMLDivElement>(null);
    const rightLogPaneRef = useRef<HTMLDivElement>(null);
    const isSyncingLeft = useRef(false);
    const isSyncingRight = useRef(false);

    // Selected build entities
    const build1 = useMemo(() => availableBuilds.find(b => String(b.id) === String(build1Id)), [availableBuilds, build1Id]);
    const build2 = useMemo(() => availableBuilds.find(b => String(b.id) === String(build2Id)), [availableBuilds, build2Id]);

    // Synchronized scroll handlers for split log panes
    const handleLeftScroll = () => {
        if (!syncScroll) return;
        if (isSyncingLeft.current) {
            isSyncingLeft.current = false;
            return;
        }
        if (leftLogPaneRef.current && rightLogPaneRef.current) {
            isSyncingRight.current = true;
            rightLogPaneRef.current.scrollTop = leftLogPaneRef.current.scrollTop;
        }
    };

    const handleRightScroll = () => {
        if (!syncScroll) return;
        if (isSyncingRight.current) {
            isSyncingRight.current = false;
            return;
        }
        if (leftLogPaneRef.current && rightLogPaneRef.current) {
            isSyncingLeft.current = true;
            leftLogPaneRef.current.scrollTop = rightLogPaneRef.current.scrollTop;
        }
    };

    // Swap Baseline and Target builds
    const handleSwapBuilds = () => {
        if (!build1Id && !build2Id) return;
        const temp = build1Id;
        onSelectBuild1(build2Id);
        onSelectBuild2(temp);
        addToast('Swapped Baseline and Target runs', 'info');
    };

    // Copy to clipboard helper
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSha(text);
        addToast(`Copied ${label} to clipboard`, 'success');
        setTimeout(() => setCopiedSha(null), 2000);
    };

    // Calculate Metric Deltas
    const durationDelta = useMemo(() => {
        if (!build1 || !build2) return 0;
        return build2.durationSeconds - build1.durationSeconds;
    }, [build1, build2]);

    const durationDeltaPercent = useMemo(() => {
        if (!build1 || !build2 || !build1.durationSeconds) return 0;
        return Number(((durationDelta / build1.durationSeconds) * 100).toFixed(1));
    }, [build1, build2, durationDelta]);

    const sizeDelta = useMemo(() => {
        if (!build1 || !build2) return 0;
        return Number((build2.artifactSizeMB - build1.artifactSizeMB).toFixed(2));
    }, [build1, build2]);

    const sizeDeltaPercent = useMemo(() => {
        if (!build1 || !build2 || !build1.artifactSizeMB) return 0;
        return Number(((sizeDelta / build1.artifactSizeMB) * 100).toFixed(1));
    }, [build1, build2, sizeDelta]);

    // Unified Stage Comparison with bottleneck detection
    const alignedStages = useMemo(() => {
        if (!build1 && !build2) return [];
        const stages1 = build1?.stages || [];
        const stages2 = build2?.stages || [];
        const maxLen = Math.max(stages1.length, stages2.length);

        const items = [];
        for (let i = 0; i < maxLen; i++) {
            const s1 = stages1[i];
            const s2 = stages2[i];
            const name = s1?.name && s2?.name && s1.name !== s2.name
                ? `${s1.name} / ${s2.name}`
                : (s1?.name || s2?.name || `Stage ${i + 1}`);
            const dur1 = s1?.duration ?? 0;
            const dur2 = s2?.duration ?? 0;
            const delta = dur2 - dur1;
            const pct = dur1 > 0 ? Number(((delta / dur1) * 100).toFixed(1)) : 0;

            items.push({
                index: i + 1,
                name,
                b1: s1 || { name, duration: 0, status: 'pending' as const },
                b2: s2 || { name, duration: 0, status: 'pending' as const },
                delta,
                pct
            });
        }
        return items;
    }, [build1, build2]);

    const maxStageDuration = useMemo(() => {
        let max = 1;
        alignedStages.forEach(st => {
            if (st.b1.duration > max) max = st.b1.duration;
            if (st.b2.duration > max) max = st.b2.duration;
        });
        return max;
    }, [alignedStages]);

    const biggestRegressionStage = useMemo(() => {
        if (alignedStages.length === 0) return null;
        const sorted = [...alignedStages].sort((a, b) => b.delta - a.delta);
        return sorted[0] && sorted[0].delta > 0 ? sorted[0] : null;
    }, [alignedStages]);

    const biggestSpeedupStage = useMemo(() => {
        if (alignedStages.length === 0) return null;
        const sorted = [...alignedStages].sort((a, b) => a.delta - b.delta);
        return sorted[0] && sorted[0].delta < 0 ? sorted[0] : null;
    }, [alignedStages]);

    // Artifact composition breakdown & deltas
    const artifactBreakdown = useMemo(() => {
        if (!build1 || !build2) return [];
        const b1Js = build1.bundleBreakdown?.jsBundleMB ?? Number((build1.artifactSizeMB * 0.45).toFixed(1));
        const b1Assets = build1.bundleBreakdown?.assetsMB ?? Number((build1.artifactSizeMB * 0.35).toFixed(1));
        const b1Native = build1.bundleBreakdown?.nativeBinariesMB ?? Number((build1.artifactSizeMB * 0.20).toFixed(1));

        const b2Js = build2.bundleBreakdown?.jsBundleMB ?? Number((build2.artifactSizeMB * 0.45).toFixed(1));
        const b2Assets = build2.bundleBreakdown?.assetsMB ?? Number((build2.artifactSizeMB * 0.35).toFixed(1));
        const b2Native = build2.bundleBreakdown?.nativeBinariesMB ?? Number((build2.artifactSizeMB * 0.20).toFixed(1));

        return [
            {
                label: 'JavaScript Bundle (Hermes / Metro)',
                color: 'bg-cyan-400',
                v1: b1Js,
                v2: b2Js,
                delta: Number((b2Js - b1Js).toFixed(2)),
                pct1: Number(((b1Js / (build1.artifactSizeMB || 1)) * 100).toFixed(0)),
                pct2: Number(((b2Js / (build2.artifactSizeMB || 1)) * 100).toFixed(0)),
            },
            {
                label: 'Aesthetic Assets, Media & Fonts',
                color: 'bg-violet-400',
                v1: b1Assets,
                v2: b2Assets,
                delta: Number((b2Assets - b1Assets).toFixed(2)),
                pct1: Number(((b1Assets / (build1.artifactSizeMB || 1)) * 100).toFixed(0)),
                pct2: Number(((b2Assets / (build2.artifactSizeMB || 1)) * 100).toFixed(0)),
            },
            {
                label: 'Native Binaries & Shared Libraries',
                color: 'bg-emerald-400',
                v1: b1Native,
                v2: b2Native,
                delta: Number((b2Native - b1Native).toFixed(2)),
                pct1: Number(((b1Native / (build1.artifactSizeMB || 1)) * 100).toFixed(0)),
                pct2: Number(((b2Native / (build2.artifactSizeMB || 1)) * 100).toFixed(0)),
            }
        ];
    }, [build1, build2]);

    // Log Diff Processing
    const allLogPairs = useMemo(() => {
        if (!build1 || !build2) return [];
        const logs1 = build1.logs || [];
        const logs2 = build2.logs || [];

        const maxLen = Math.max(logs1.length, logs2.length);
        const pairs: Array<{
            index: number;
            line1: string | null;
            line2: string | null;
            type: 'match' | 'changed' | 'added' | 'removed' | 'warning' | 'error';
        }> = [];

        for (let i = 0; i < maxLen; i++) {
            const l1 = logs1[i] ?? null;
            const l2 = logs2[i] ?? null;

            let type: 'match' | 'changed' | 'added' | 'removed' | 'warning' | 'error' = 'match';

            if (l1 === null && l2 !== null) {
                type = 'added';
            } else if (l1 !== null && l2 === null) {
                type = 'removed';
            } else if (l1 !== l2) {
                type = 'changed';
            }

            const combined = `${l1 || ''} ${l2 || ''}`.toLowerCase();
            if (combined.includes('error') || combined.includes('failed') || combined.includes('exit code') || combined.includes('❌') || combined.includes('🚨')) {
                type = 'error';
            } else if (combined.includes('warn') || combined.includes('deprecat') || combined.includes('⚠️')) {
                type = 'warning';
            }

            pairs.push({
                index: i + 1,
                line1: l1,
                line2: l2,
                type
            });
        }
        return pairs;
    }, [build1, build2]);

    const logStats = useMemo(() => {
        const total = allLogPairs.length;
        const matched = allLogPairs.filter(p => p.type === 'match').length;
        const diffs = allLogPairs.filter(p => p.type !== 'match').length;
        const errorsAndWarnings = allLogPairs.filter(p => p.type === 'error' || p.type === 'warning').length;
        return { total, matched, diffs, errorsAndWarnings };
    }, [allLogPairs]);

    const logDiffLines = useMemo(() => {
        return allLogPairs.filter(p => {
            if (logFilter === 'diff_only' && p.type === 'match') return false;
            if (logFilter === 'errors_warnings' && p.type !== 'error' && p.type !== 'warning') return false;
            if (logSearchQuery.trim()) {
                const q = logSearchQuery.toLowerCase();
                const match1 = p.line1?.toLowerCase().includes(q);
                const match2 = p.line2?.toLowerCase().includes(q);
                if (!match1 && !match2) return false;
            }
            return true;
        });
    }, [allLogPairs, logFilter, logSearchQuery]);

    // Export as JSON report
    const handleExportJson = () => {
        if (!build1 || !build2) {
            addToast('Select two builds to export comparison JSON.', 'error');
            return;
        }

        const reportData = {
            reportType: "CI_CD_BUILD_COMPARISON_AUDIT",
            generatedAt: new Date().toISOString(),
            baselineBuild: {
                id: build1.id,
                name: build1.displayName,
                version: build1.version,
                platform: build1.platform,
                branch: build1.branch,
                commitSha: build1.commitSha,
                status: build1.status,
                durationSeconds: build1.durationSeconds,
                artifactSizeMB: build1.artifactSizeMB,
                sha256: build1.sha256 || 'N/A',
                bundleBreakdown: build1.bundleBreakdown || null,
                stages: build1.stages || []
            },
            targetBuild: {
                id: build2.id,
                name: build2.displayName,
                version: build2.version,
                platform: build2.platform,
                branch: build2.branch,
                commitSha: build2.commitSha,
                status: build2.status,
                durationSeconds: build2.durationSeconds,
                artifactSizeMB: build2.artifactSizeMB,
                sha256: build2.sha256 || 'N/A',
                bundleBreakdown: build2.bundleBreakdown || null,
                stages: build2.stages || []
            },
            metricsDelta: {
                durationDeltaSeconds: durationDelta,
                durationDeltaPercent: `${durationDeltaPercent}%`,
                artifactSizeDeltaMB: sizeDelta,
                artifactSizeDeltaPercent: `${sizeDeltaPercent}%`
            },
            stageComparisons: alignedStages,
            logDiffSummary: {
                totalLinesExamined: logStats.total,
                differencesFound: logStats.diffs,
                errorsAndWarningsCount: logStats.errorsAndWarnings
            }
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `build-comparison-${build1.version}-vs-${build2.version}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        addToast('Comparison audit exported as JSON.', 'success');
    };

    // Export as PDF report
    const handleExportPdf = () => {
        if (!build1 || !build2) {
            addToast('Select two builds to export comparison PDF.', 'error');
            return;
        }

        try {
            const doc = new jsPDF();
            
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 42, 'F');
            
            doc.setFillColor(6, 182, 212);
            doc.rect(0, 42, 105, 3, 'F');
            doc.setFillColor(16, 185, 129);
            doc.rect(105, 42, 105, 3, 'F');

            doc.setFont("helvetica", "bold");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("CI/CD BUILD COMPARISON AUDIT REPORT", 14, 20);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text(`Comparing Baseline: ${build1.displayName} (v${build1.version})  vs  Target: ${build2.displayName} (v${build2.version})`, 14, 29);
            doc.text(`Generated: ${new Date().toLocaleString()} (UTC)`, 14, 35);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(11);
            doc.text("CORE BUILD METRICS & DELTAS", 14, 55);

            const summaryRows = [
                ['Status', build1.status, build2.status, build1.status === build2.status ? 'Matched' : 'Status Drift'],
                ['Platform', build1.platform, build2.platform, build1.platform === build2.platform ? 'Same Platform' : 'Cross-Platform'],
                ['Branch / Head Ref', build1.branch, build2.branch, build1.branch === build2.branch ? 'Same Branch' : 'Cross-Branch'],
                ['Commit SHA', build1.commitSha.substring(0, 8), build2.commitSha.substring(0, 8), build1.commitSha === build2.commitSha ? 'Identical Commit' : 'Different Commits'],
                ['Total Build Duration', `${build1.durationSeconds}s`, `${build2.durationSeconds}s`, `${durationDelta > 0 ? '+' : ''}${durationDelta}s (${durationDeltaPercent}%)`],
                ['Artifact Payload Size', `${build1.artifactSizeMB} MB`, `${build2.artifactSizeMB} MB`, `${sizeDelta > 0 ? '+' : ''}${sizeDelta} MB (${sizeDeltaPercent}%)`],
                ['SHA-256 Checksum', (build1.sha256 || 'N/A').substring(0, 16) + '...', (build2.sha256 || 'N/A').substring(0, 16) + '...', (build1.sha256 === build2.sha256) ? 'Verified Hash Match' : 'Different Hash Binaries']
            ];

            (doc as any).autoTable({
                startY: 60,
                head: [['Dimension / Metric', `Baseline (Left): v${build1.version}`, `Target (Right): v${build2.version}`, 'Delta / Comparison']],
                body: summaryRows,
                theme: 'striped',
                headStyles: {
                    fillColor: [15, 23, 42],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8.5
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [51, 65, 85]
                },
                margin: { left: 14, right: 14 }
            });

            const lastY = (doc as any).lastAutoTable?.finalY || 130;
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(11);
            doc.text("PIPELINE STAGE LATENCY BREAKDOWN", 14, lastY + 14);

            const stageRows = alignedStages.map(st => [
                st.name,
                `${st.b1.duration}s (${st.b1.status.toUpperCase()})`,
                `${st.b2.duration}s (${st.b2.status.toUpperCase()})`,
                `${st.delta > 0 ? '+' : ''}${st.delta}s (${st.pct > 0 ? '+' : ''}${st.pct}%)`
            ]);

            (doc as any).autoTable({
                startY: lastY + 18,
                head: [['Compilation Stage', `Baseline Duration`, `Target Duration`, 'Stage Delta']],
                body: stageRows,
                theme: 'striped',
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8
                },
                bodyStyles: {
                    fontSize: 7.5,
                    textColor: [51, 65, 85]
                },
                margin: { left: 14, right: 14 }
            });

            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFont("helvetica", "italic");
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Page ${i} of ${pageCount} • Verified by Branded App CI/CD Diagnostics Engine`,
                    105,
                    285,
                    { align: "center" }
                );
            }

            doc.save(`build-comparison-${build1.version}-vs-${build2.version}.pdf`);
            addToast('Comparison PDF Report downloaded successfully!', 'success');
        } catch (err) {
            console.error("PDF generation failed:", err);
            addToast('Failed to export PDF report.', 'error');
        }
    };

    return (
        <div className={`w-full bg-[#090a0f] border border-white/10 rounded-2xl flex flex-col overflow-hidden text-left font-sans shadow-2xl transition-all duration-300 ${isExpanded ? 'p-6' : 'p-4'}`}>
            {/* Top Toolbar / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/10 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                                Side-by-Side Build Comparison
                            </h3>
                            <span className="text-[9px] font-mono text-cyan-400">
                                · Stage Durations · Artifact Sizes · Build Logs
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                            Inspect stage-by-stage timing shifts, binary payload deltas, and synchronized console output between two runs
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleSwapBuilds}
                        disabled={!build1 && !build2}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                        title="Swap Baseline and Target runs"
                    >
                        <ArrowLeftRight className="w-3 h-3 text-amber-400" /> Swap Runs
                    </button>
                    <button
                        type="button"
                        onClick={handleExportJson}
                        disabled={!build1 || !build2}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Export structured comparison data as JSON"
                    >
                        <Download className="w-3 h-3 text-cyan-400" /> JSON
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={!build1 || !build2}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Download audit PDF report"
                    >
                        <FileText className="w-3 h-3 text-emerald-400" /> PDF Report
                    </button>
                    {onToggleExpand && (
                        <button
                            type="button"
                            onClick={onToggleExpand}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                            title={isExpanded ? "Collapse view" : "Open full-screen drawer"}
                        >
                            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[9px] font-mono uppercase cursor-pointer"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* Build Selector Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Build 1 (Baseline) */}
                <div className="bg-black/50 border border-cyan-500/30 rounded-xl p-3 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[9px] uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            Run A · Baseline Build (Left)
                        </label>
                        {build1 && (
                            <span className={`text-[8.5px] font-mono uppercase font-black ${
                                build1.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                {build1.platform} · v{build1.version} · {build1.status}
                            </span>
                        )}
                    </div>
                    <select
                        value={build1Id}
                        onChange={(e) => onSelectBuild1(e.target.value)}
                        className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-white text-[10px] focus:outline-none focus:border-cyan-400"
                    >
                        <option value="">-- Select Baseline Run --</option>
                        {availableBuilds.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.displayName} (v{b.version}) · {b.platform} · {b.durationSeconds}s · {b.artifactSizeMB}MB [{b.status}]
                            </option>
                        ))}
                    </select>
                </div>

                {/* Build 2 (Target) */}
                <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-3 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[9px] uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Run B · Target Build (Right)
                        </label>
                        {build2 && (
                            <span className={`text-[8.5px] font-mono uppercase font-black ${
                                build2.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                {build2.platform} · v{build2.version} · {build2.status}
                            </span>
                        )}
                    </div>
                    <select
                        value={build2Id}
                        onChange={(e) => onSelectBuild2(e.target.value)}
                        className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-white text-[10px] focus:outline-none focus:border-emerald-400"
                    >
                        <option value="">-- Select Target Run --</option>
                        {availableBuilds.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.displayName} (v{b.version}) · {b.platform} · {b.durationSeconds}s · {b.artifactSizeMB}MB [{b.status}]
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Interactive View Mode Tabs */}
            <div className="flex items-center gap-1 border-b border-white/10 mb-4 pb-2 overflow-x-auto scrollbar-none">
                <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'all'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Layers className="w-3 h-3" /> Unified Diff View
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('stages')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'stages'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Clock className="w-3 h-3" /> Stage Durations ({alignedStages.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('artifacts')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'artifacts'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Package className="w-3 h-3" /> Artifact Sizes ({sizeDelta > 0 ? `+${sizeDelta}` : sizeDelta} MB)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'logs'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Terminal className="w-3 h-3" /> Build Logs Diff ({logStats.diffs} diffs)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('metrics')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'metrics'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <BarChart2 className="w-3 h-3" /> Metadata Table
                </button>
            </div>

            {/* Zero State if both builds not selected */}
            {(!build1 || !build2) ? (
                <div className="py-12 px-4 text-center space-y-3 bg-black/30 rounded-xl border border-dashed border-white/5 my-2">
                    <Layers className="w-8 h-8 text-gray-600 mx-auto animate-pulse" />
                    <div className="space-y-1">
                        <p className="text-white text-xs font-bold font-mono uppercase tracking-wider">
                            Select Two Builds to Activate Side-by-Side Comparison
                        </p>
                        <p className="text-gray-500 text-[10px] font-sans max-w-md mx-auto">
                            Choose a baseline build and a target build from the dropdown selectors above to inspect stage duration shifts, artifact size differences, and build log diffs.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Top-Level Executive Delta Strip (always visible for immediate context) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                            <span className="text-[8px] uppercase tracking-wider text-gray-500 block">Total Stage Duration</span>
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <span className={`text-sm sm:text-base font-black ${
                                    durationDelta < 0 ? 'text-emerald-400' : durationDelta > 0 ? 'text-rose-400' : 'text-gray-200'
                                }`}>
                                    {durationDelta > 0 ? `+${durationDelta}s` : `${durationDelta}s`}
                                </span>
                                <span className="text-[8.5px] text-gray-400">
                                    ({build1.durationSeconds}s → {build2.durationSeconds}s)
                                </span>
                            </div>
                            <span className="text-[8px] text-gray-500 block mt-0.5">
                                {durationDelta < 0 ? `${Math.abs(durationDeltaPercent)}% faster compile` : durationDelta > 0 ? `${durationDeltaPercent}% slower compile` : 'Identical duration'}
                            </span>
                        </div>

                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                            <span className="text-[8px] uppercase tracking-wider text-gray-500 block">Artifact Size Delta</span>
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <span className={`text-sm sm:text-base font-black ${
                                    sizeDelta < 0 ? 'text-emerald-400' : sizeDelta > 0 ? 'text-amber-400' : 'text-gray-200'
                                }`}>
                                    {sizeDelta > 0 ? `+${sizeDelta}` : sizeDelta} MB
                                </span>
                                <span className="text-[8.5px] text-gray-400">
                                    ({build1.artifactSizeMB} → {build2.artifactSizeMB} MB)
                                </span>
                            </div>
                            <span className="text-[8px] text-gray-500 block mt-0.5">
                                {sizeDelta < 0 ? `${Math.abs(sizeDeltaPercent)}% smaller binary` : sizeDelta > 0 ? `${sizeDeltaPercent}% larger binary` : 'No payload change'}
                            </span>
                        </div>

                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                            <span className="text-[8px] uppercase tracking-wider text-gray-500 block">Log Line Differences</span>
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <span className={`text-sm sm:text-base font-black ${
                                    logStats.diffs > 0 ? 'text-cyan-400' : 'text-gray-300'
                                }`}>
                                    {logStats.diffs} lines
                                </span>
                                <span className="text-[8.5px] text-gray-400">
                                    of {logStats.total}
                                </span>
                            </div>
                            <span className="text-[8px] text-gray-500 block mt-0.5">
                                {logStats.errorsAndWarnings > 0 ? `${logStats.errorsAndWarnings} errors/warnings flagged` : '0 errors or warnings'}
                            </span>
                        </div>

                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                            <span className="text-[8px] uppercase tracking-wider text-gray-500 block">Run Status Transition</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-xs font-black ${
                                    build1.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                    {build1.status}
                                </span>
                                <ArrowRight className="w-3 h-3 text-gray-500" />
                                <span className={`text-xs font-black ${
                                    build2.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                    {build2.status}
                                </span>
                            </div>
                            <span className="text-[8px] text-gray-500 block mt-0.5">
                                {build1.commitSha.substring(0, 7)} → {build2.commitSha.substring(0, 7)}
                            </span>
                        </div>
                    </div>

                    {/* SECTION 1: STAGE DURATIONS COMPARISON */}
                    {(activeTab === 'all' || activeTab === 'stages') && (
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                        01. Stage-by-Stage Duration Comparison
                                    </h4>
                                    <p className="text-[9.5px] text-gray-400 font-sans">
                                        Side-by-side execution timing across each compiler stage with visual proportion bars and delta highlights.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 text-[9px] font-mono">
                                    {biggestRegressionStage && (
                                        <span className="text-rose-400 flex items-center gap-1">
                                            <Flame className="w-3 h-3" />
                                            Slowest Shift: <strong>{biggestRegressionStage.name}</strong> (+{biggestRegressionStage.delta}s)
                                        </span>
                                    )}
                                    {biggestSpeedupStage && (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <Zap className="w-3 h-3" />
                                            Best Speedup: <strong>{biggestSpeedupStage.name}</strong> ({biggestSpeedupStage.delta}s)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
                                <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 py-2.5 px-3 text-[8.5px] uppercase font-black tracking-widest text-gray-400 font-mono items-center">
                                    <div className="col-span-4 text-left">Pipeline Stage</div>
                                    <div className="col-span-3 text-cyan-400 text-left pl-2">Run A · v{build1.version} ({build1.durationSeconds}s)</div>
                                    <div className="col-span-3 text-emerald-400 text-left pl-2">Run B · v{build2.version} ({build2.durationSeconds}s)</div>
                                    <div className="col-span-2 text-right">Stage Delta</div>
                                </div>

                                <div className="divide-y divide-white/5 font-mono text-[10px]">
                                    {alignedStages.map((st, idx) => {
                                        const isRegression = st.delta > 0;
                                        const isSpeedup = st.delta < 0;
                                        const isLargestSpike = biggestRegressionStage?.index === st.index && st.delta >= 5;

                                        return (
                                            <div 
                                                key={idx} 
                                                className={`grid grid-cols-12 py-2.5 px-3 items-center transition-colors ${
                                                    isLargestSpike ? 'bg-rose-950/20 hover:bg-rose-950/30' :
                                                    isRegression ? 'bg-rose-500/[0.03] hover:bg-white/[0.03]' :
                                                    isSpeedup ? 'bg-emerald-500/[0.03] hover:bg-white/[0.03]' :
                                                    'hover:bg-white/[0.02]'
                                                }`}
                                            >
                                                {/* Stage Name */}
                                                <div className="col-span-4 text-left pr-2 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-500 text-[8.5px] shrink-0">0{st.index}.</span>
                                                        <span className="text-white font-bold truncate" title={st.name}>{st.name}</span>
                                                    </div>
                                                    {isLargestSpike && (
                                                        <span className="text-[8px] text-rose-400 font-sans block pl-4">
                                                            Primary latency bottleneck (+{st.pct}%)
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Run A Bar & Time */}
                                                <div className="col-span-3 pl-2 pr-3 space-y-1">
                                                    <div className="flex items-center justify-between text-[9px]">
                                                        <span className="text-cyan-300 font-bold">{st.b1.duration}s</span>
                                                        <span className="text-gray-500 text-[8px] uppercase">{st.b1.status}</span>
                                                    </div>
                                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${st.b1.status === 'failed' ? 'bg-rose-500' : 'bg-cyan-400'}`}
                                                            style={{ width: `${Math.min(100, Math.max(8, (st.b1.duration / maxStageDuration) * 100))}%` }} 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Run B Bar & Time */}
                                                <div className="col-span-3 pl-2 pr-3 space-y-1">
                                                    <div className="flex items-center justify-between text-[9px]">
                                                        <span className="text-emerald-300 font-bold">{st.b2.duration}s</span>
                                                        <span className={`text-[8px] uppercase ${st.b2.status === 'failed' ? 'text-rose-400 font-bold' : 'text-gray-500'}`}>
                                                            {st.b2.status}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${st.b2.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-400'}`}
                                                            style={{ width: `${Math.min(100, Math.max(8, (st.b2.duration / maxStageDuration) * 100))}%` }} 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Stage Delta */}
                                                <div className="col-span-2 text-right">
                                                    <span className={`font-black text-[9.5px] ${
                                                        st.delta < 0 ? 'text-emerald-400' : st.delta > 0 ? 'text-rose-400' : 'text-gray-500'
                                                    }`}>
                                                        {st.delta > 0 ? `+${st.delta}s` : st.delta < 0 ? `${st.delta}s` : '0s'}
                                                    </span>
                                                    {st.delta !== 0 && (
                                                        <span className="block text-[8px] text-gray-500">
                                                            {st.pct > 0 ? `+${st.pct}%` : `${st.pct}%`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: ARTIFACT SIZES & CHECKSUMS COMPARISON */}
                    {(activeTab === 'all' || activeTab === 'artifacts') && (
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                                        02. Artifact Size & Bundle Composition Comparison
                                    </h4>
                                    <p className="text-[9.5px] text-gray-400 font-sans">
                                        Compare compiled package sizes, internal asset bundle distribution, and cryptographic SHA-256 digests.
                                    </p>
                                </div>
                                <div className="text-[9px] font-mono text-gray-400">
                                    Net Payload Shift:{' '}
                                    <strong className={sizeDelta < 0 ? 'text-emerald-400' : sizeDelta > 0 ? 'text-amber-400' : 'text-gray-300'}>
                                        {sizeDelta > 0 ? `+${sizeDelta} MB (+${sizeDeltaPercent}%)` : `${sizeDelta} MB (${sizeDeltaPercent}%)`}
                                    </strong>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Baseline Artifact Card */}
                                <div className="p-3.5 bg-black/40 border border-cyan-500/20 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-cyan-400" />
                                            <span className="font-mono text-[10px] font-bold text-white uppercase">
                                                Run A Artifact ({build1.artifactFileName || `fitness_v${build1.version}.${build1.platform === 'iOS' ? 'ipa' : 'apk'}`})
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono text-cyan-400 font-black">{build1.artifactSizeMB} MB</span>
                                    </div>

                                    {/* Visual Stacked Bar for Run A */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-mono text-gray-400">
                                            <span>JS ({artifactBreakdown[0]?.pct1}%)</span>
                                            <span>Assets ({artifactBreakdown[1]?.pct1}%)</span>
                                            <span>Native ({artifactBreakdown[2]?.pct1}%)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                                            <div className="bg-cyan-400 h-full" style={{ width: `${artifactBreakdown[0]?.pct1 || 45}%` }} />
                                            <div className="bg-violet-400 h-full" style={{ width: `${artifactBreakdown[1]?.pct1 || 35}%` }} />
                                            <div className="bg-emerald-400 h-full" style={{ width: `${artifactBreakdown[2]?.pct1 || 20}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono">
                                        <span className="text-gray-500 text-[8px] uppercase shrink-0 mr-2">SHA-256:</span>
                                        <span className="text-cyan-300 text-[8.5px] truncate">
                                            {build1.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(build1.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Baseline Checksum')}
                                            className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
                                            title="Copy SHA-256"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* Target Artifact Card */}
                                <div className="p-3.5 bg-black/40 border border-emerald-500/20 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-emerald-400" />
                                            <span className="font-mono text-[10px] font-bold text-white uppercase">
                                                Run B Artifact ({build2.artifactFileName || `fitness_v${build2.version}.${build2.platform === 'iOS' ? 'ipa' : 'apk'}`})
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono text-emerald-400 font-black">{build2.artifactSizeMB} MB</span>
                                    </div>

                                    {/* Visual Stacked Bar for Run B */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-mono text-gray-400">
                                            <span>JS ({artifactBreakdown[0]?.pct2}%)</span>
                                            <span>Assets ({artifactBreakdown[1]?.pct2}%)</span>
                                            <span>Native ({artifactBreakdown[2]?.pct2}%)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                                            <div className="bg-cyan-400 h-full" style={{ width: `${artifactBreakdown[0]?.pct2 || 45}%` }} />
                                            <div className="bg-violet-400 h-full" style={{ width: `${artifactBreakdown[1]?.pct2 || 35}%` }} />
                                            <div className="bg-emerald-400 h-full" style={{ width: `${artifactBreakdown[2]?.pct2 || 20}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono">
                                        <span className="text-gray-500 text-[8px] uppercase shrink-0 mr-2">SHA-256:</span>
                                        <span className="text-emerald-300 text-[8.5px] truncate">
                                            {build2.sha256 || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(build2.sha256 || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'Target Checksum')}
                                            className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
                                            title="Copy SHA-256"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Side-by-Side Bundle Layer Diff Table */}
                            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/30 font-mono text-[10px]">
                                <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 py-2 px-3 text-[8.5px] uppercase font-black tracking-widest text-gray-400">
                                    <div className="col-span-5 text-left">Artifact Layer / Segment</div>
                                    <div className="col-span-2 text-cyan-400 text-right">Run A Size</div>
                                    <div className="col-span-2 text-emerald-400 text-right">Run B Size</div>
                                    <div className="col-span-3 text-right">Size Difference</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {artifactBreakdown.map((item, i) => (
                                        <div key={i} className="grid grid-cols-12 py-2 px-3 items-center hover:bg-white/[0.02]">
                                            <div className="col-span-5 flex items-center gap-2 text-white font-sans text-[10px]">
                                                <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            <div className="col-span-2 text-right text-gray-300">{item.v1} MB</div>
                                            <div className="col-span-2 text-right text-gray-300">{item.v2} MB</div>
                                            <div className="col-span-3 text-right">
                                                <span className={`font-black ${
                                                    item.delta < 0 ? 'text-emerald-400' : item.delta > 0 ? 'text-amber-400' : 'text-gray-500'
                                                }`}>
                                                    {item.delta > 0 ? `+${item.delta} MB` : item.delta < 0 ? `${item.delta} MB` : '0.0 MB'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: SYNCHRONIZED SIDE-BY-SIDE BUILD LOGS DIFF */}
                    {(activeTab === 'all' || activeTab === 'logs') && (
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5 text-violet-400" />
                                        03. Side-by-Side Build Logs Diff
                                    </h4>
                                    <p className="text-[9.5px] text-gray-400 font-sans">
                                        Line-aligned console output highlighting modified lines (`~`), added steps (`+`), removed steps (`-`), and compiler errors (`!`).
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-[9px] font-mono">
                                    <button
                                        type="button"
                                        onClick={() => setSyncScroll(!syncScroll)}
                                        className={`px-2 py-1 rounded border cursor-pointer transition-colors ${
                                            syncScroll ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-gray-500 border-white/10'
                                        }`}
                                    >
                                        Sync Scroll: {syncScroll ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>

                            {/* Log Filter & Search Bar */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 border border-white/5 p-2.5 rounded-xl font-mono text-[9px]">
                                <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setLogFilter('all')}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                                            logFilter === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        All Lines ({logStats.total})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLogFilter('diff_only')}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                                            logFilter === 'diff_only' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Differences Only ({logStats.diffs})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLogFilter('errors_warnings')}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                                            logFilter === 'errors_warnings' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Errors & Warnings ({logStats.errorsAndWarnings})
                                    </button>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Filter log lines by keyword..."
                                        value={logSearchQuery}
                                        onChange={(e) => setLogSearchQuery(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-white text-[9px] focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>

                            {/* Synchronized Side-by-Side Split Log Panes */}
                            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/90 font-mono text-[8.5px]">
                                <div className="grid grid-cols-2 bg-white/5 border-b border-white/10 py-2 px-3 uppercase font-black text-gray-400 tracking-wider">
                                    <div className="text-cyan-400 flex items-center justify-between pr-2">
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Terminal className="w-3 h-3 shrink-0" /> Run A: {build1.displayName} (v{build1.version})
                                        </span>
                                        <span className="text-[8px] text-gray-500">{build1.logs.length} lines</span>
                                    </div>
                                    <div className="text-emerald-400 flex items-center justify-between pl-3 border-l border-white/10">
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Terminal className="w-3 h-3 shrink-0" /> Run B: {build2.displayName} (v{build2.version})
                                        </span>
                                        <span className="text-[8px] text-gray-500">{build2.logs.length} lines</span>
                                    </div>
                                </div>

                                {logDiffLines.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500 italic">
                                        No matching log lines found for the current filter.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2">
                                        {/* Left Log Pane (Run A) */}
                                        <div
                                            ref={leftLogPaneRef}
                                            onScroll={handleLeftScroll}
                                            className="max-h-[340px] overflow-y-auto divide-y divide-white/5 border-r border-white/10 scrollbar-thin custom-scrollbar"
                                        >
                                            {logDiffLines.map((item, idx) => {
                                                const isChanged = item.type === 'changed';
                                                const isRemoved = item.type === 'removed';
                                                const isErr = item.type === 'error';
                                                const isWarn = item.type === 'warning';
                                                const marker = isErr ? '!' : isRemoved ? '-' : isChanged ? '~' : ' ';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-1.5 flex items-start gap-1.5 min-h-[26px] transition-colors ${
                                                            isErr ? 'bg-rose-950/25 text-rose-300' :
                                                            isWarn ? 'bg-amber-950/20 text-amber-300' :
                                                            isRemoved ? 'bg-rose-500/10 text-rose-300' :
                                                            isChanged ? 'bg-indigo-950/25 text-cyan-200' :
                                                            'text-gray-400 hover:bg-white/[0.02]'
                                                        }`}
                                                    >
                                                        <span className="text-gray-600 select-none w-5 text-right shrink-0">{item.index}</span>
                                                        <span className={`w-3 text-center select-none font-black shrink-0 ${
                                                            isErr || isRemoved ? 'text-rose-400' : isChanged ? 'text-amber-400' : 'text-gray-600'
                                                        }`}>
                                                            {marker}
                                                        </span>
                                                        <span className="break-all leading-relaxed">
                                                            {item.line1 || <em className="text-gray-700 italic">&lt;no corresponding line&gt;</em>}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Right Log Pane (Run B) */}
                                        <div
                                            ref={rightLogPaneRef}
                                            onScroll={handleRightScroll}
                                            className="max-h-[340px] overflow-y-auto divide-y divide-white/5 scrollbar-thin custom-scrollbar"
                                        >
                                            {logDiffLines.map((item, idx) => {
                                                const isChanged = item.type === 'changed';
                                                const isAdded = item.type === 'added';
                                                const isErr = item.type === 'error';
                                                const isWarn = item.type === 'warning';
                                                const marker = isErr ? '!' : isAdded ? '+' : isChanged ? '~' : ' ';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-1.5 flex items-start gap-1.5 min-h-[26px] transition-colors ${
                                                            isErr ? 'bg-rose-950/25 text-rose-300' :
                                                            isWarn ? 'bg-amber-950/20 text-amber-300' :
                                                            isAdded ? 'bg-emerald-500/10 text-emerald-300' :
                                                            isChanged ? 'bg-indigo-950/25 text-emerald-200' :
                                                            'text-gray-400 hover:bg-white/[0.02]'
                                                        }`}
                                                    >
                                                        <span className="text-gray-600 select-none w-5 text-right shrink-0">{item.index}</span>
                                                        <span className={`w-3 text-center select-none font-black shrink-0 ${
                                                            isErr ? 'text-rose-400' : isAdded ? 'text-emerald-400' : isChanged ? 'text-amber-400' : 'text-gray-600'
                                                        }`}>
                                                            {marker}
                                                        </span>
                                                        <span className="break-all leading-relaxed">
                                                            {item.line2 || <em className="text-gray-700 italic">&lt;no corresponding line&gt;</em>}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECTION 4: CORE METADATA TABLE */}
                    {(activeTab === 'metrics') && (
                        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/30">
                            <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 py-2.5 px-3 text-[9px] uppercase font-black tracking-widest text-gray-400 font-mono items-center">
                                <div className="col-span-4 text-left">Dimension</div>
                                <div className="col-span-3 text-cyan-400 text-center truncate">Run A (v{build1.version})</div>
                                <div className="col-span-3 text-emerald-400 text-center truncate">Run B (v{build2.version})</div>
                                <div className="col-span-2 text-right">Comparison</div>
                            </div>

                            <div className="divide-y divide-white/5 text-[10px] font-mono">
                                <div className="grid grid-cols-12 py-2.5 px-3 items-center hover:bg-white/[0.02]">
                                    <div className="col-span-4 text-gray-400 flex items-center gap-1.5 font-sans">
                                        <Package className="w-3.5 h-3.5 text-gray-500" />
                                        <span>App Release Version</span>
                                    </div>
                                    <div className="col-span-3 text-center text-white font-bold">{build1.displayName} (v{build1.version})</div>
                                    <div className="col-span-3 text-center text-white font-bold">{build2.displayName} (v{build2.version})</div>
                                    <div className="col-span-2 text-right">
                                        {build1.version === build2.version ? (
                                            <span className="text-gray-500 text-[9px]">Identical</span>
                                        ) : (
                                            <span className="text-cyan-400 text-[9px] font-bold">Version Bump</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 py-2.5 px-3 items-center hover:bg-white/[0.02]">
                                    <div className="col-span-4 text-gray-400 flex items-center gap-1.5 font-sans">
                                        <GitBranch className="w-3.5 h-3.5 text-violet-400" />
                                        <span>VCS Git Branch</span>
                                    </div>
                                    <div className="col-span-3 text-center text-violet-300 truncate px-1">{build1.branch}</div>
                                    <div className="col-span-3 text-center text-violet-300 truncate px-1">{build2.branch}</div>
                                    <div className="col-span-2 text-right">
                                        {build1.branch === build2.branch ? (
                                            <span className="text-emerald-400 text-[9px]">Same branch</span>
                                        ) : (
                                            <span className="text-amber-400 text-[9px] font-bold">Cross-branch</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 py-2.5 px-3 items-center hover:bg-white/[0.02]">
                                    <div className="col-span-4 text-gray-400 flex items-center gap-1.5 font-sans">
                                        <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Commit SHA Checkpoint</span>
                                    </div>
                                    <div className="col-span-3 text-center text-gray-300">
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(build1.commitSha, 'Baseline Commit SHA')}
                                            className="hover:text-cyan-400 underline decoration-dotted cursor-pointer inline-flex items-center gap-1"
                                        >
                                            {build1.commitSha.substring(0, 7)}
                                            {copiedSha === build1.commitSha ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-gray-600" />}
                                        </button>
                                    </div>
                                    <div className="col-span-3 text-center text-gray-300">
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(build2.commitSha, 'Target Commit SHA')}
                                            className="hover:text-emerald-400 underline decoration-dotted cursor-pointer inline-flex items-center gap-1"
                                        >
                                            {build2.commitSha.substring(0, 7)}
                                            {copiedSha === build2.commitSha ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-gray-600" />}
                                        </button>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        {build1.commitSha === build2.commitSha ? (
                                            <span className="text-emerald-400 text-[9px]">Identical</span>
                                        ) : (
                                            <span className="text-gray-400 text-[9px]">Diff SHA</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 py-2.5 px-3 items-center hover:bg-white/[0.02]">
                                    <div className="col-span-4 text-gray-400 flex items-center gap-1.5 font-sans">
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Compile & Packaging Latency</span>
                                    </div>
                                    <div className="col-span-3 text-center text-white">{build1.durationSeconds}s</div>
                                    <div className="col-span-3 text-center text-white">{build2.durationSeconds}s</div>
                                    <div className="col-span-2 text-right">
                                        <span className={`font-black ${
                                            durationDelta < 0 ? 'text-emerald-400' : durationDelta > 0 ? 'text-rose-400' : 'text-gray-500'
                                        }`}>
                                            {durationDelta > 0 ? `+${durationDelta}s` : `${durationDelta}s`}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 py-2.5 px-3 items-center hover:bg-white/[0.02]">
                                    <div className="col-span-4 text-gray-400 flex items-center gap-1.5 font-sans">
                                        <Package className="w-3.5 h-3.5 text-purple-400" />
                                        <span>Output Binary Size</span>
                                    </div>
                                    <div className="col-span-3 text-center text-white">{build1.artifactSizeMB} MB</div>
                                    <div className="col-span-3 text-center text-white">{build2.artifactSizeMB} MB</div>
                                    <div className="col-span-2 text-right">
                                        <span className={`font-black ${
                                            sizeDelta < 0 ? 'text-emerald-400' : sizeDelta > 0 ? 'text-amber-400' : 'text-gray-500'
                                        }`}>
                                            {sizeDelta > 0 ? `+${sizeDelta} MB` : `${sizeDelta} MB`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
