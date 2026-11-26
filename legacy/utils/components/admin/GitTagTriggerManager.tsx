import React, { useState, useMemo } from 'react';
import { 
    Tag, GitBranch, Play, CheckCircle2, XCircle, AlertCircle, 
    Copy, Check, RotateCcw, Sparkles, Clock, Cpu, 
    Layers, Settings, Terminal, ArrowRight, Shield, Zap, Send, Filter, CheckCircle
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export interface TagTriggerEvent {
    id: string;
    tagName: string;
    commitSha: string;
    matched: boolean;
    timestamp: string;
    workflowRunId?: number | string;
    workflowName: string;
    extractedVersion: string;
    status: 'SUCCESS' | 'TRIGGERED' | 'FAILED' | 'IGNORED';
    pusher: string;
    environment: string;
}

export interface TagTriggerConfig {
    enabled: boolean;
    pattern: string;
    workflowId: string;
    environment: 'production' | 'staging';
    autoExtractVersion: boolean;
    skipTests: boolean;
    autoDeploy: boolean;
    notifyWebhook: boolean;
}

interface GitTagTriggerManagerProps {
    config: TagTriggerConfig;
    onChangeConfig: (newConfig: TagTriggerConfig) => void;
    triggerHistory: TagTriggerEvent[];
    onClearHistory: () => void;
    onTriggerTagBuild: (params: {
        tagName: string;
        commitSha: string;
        workflowId: string;
        version: string;
        environment: 'staging' | 'production';
        skipTests: boolean;
    }) => Promise<void> | void;
    githubRepo?: string;
    githubConnected?: boolean;
    onSelectWorkflowRun?: (runId: string | number) => void;
    embedded?: boolean;
}

export const matchesTagPattern = (tag: string, pattern: string): boolean => {
    if (!tag || !pattern) return false;
    const cleanTag = tag.trim().replace(/^refs\/tags\//, '');
    const patterns = pattern.split(',').map(p => p.trim()).filter(Boolean);
    
    return patterns.some(pat => {
        // Simple exact match
        if (pat === cleanTag) return true;
        // Escape special regex chars except * and ?
        const regexStr = '^' + pat
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.') + '$';
        try {
            const regex = new RegExp(regexStr);
            return regex.test(cleanTag);
        } catch {
            return cleanTag.startsWith(pat.replace(/\*/g, ''));
        }
    });
};

export const extractVersionFromTag = (tag: string): string => {
    if (!tag) return '1.3.0';
    const cleanTag = tag.trim().replace(/^refs\/tags\//, '');
    // Try to match semantic version like v1.2.3, 1.2.3, release/v2.4.1, etc.
    const match = cleanTag.match(/v?(\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)/i);
    if (match && match[1]) {
        return match[1];
    }
    // Fallback if tag is something like release/summer-prod
    return '1.3.0';
};

export const GitTagTriggerManager: React.FC<GitTagTriggerManagerProps> = ({
    config,
    onChangeConfig,
    triggerHistory,
    onClearHistory,
    onTriggerTagBuild,
    githubRepo = 'FitnessFuture/fitness-future',
    githubConnected = false,
    onSelectWorkflowRun,
    embedded = false
}) => {
    const { addToast } = useToast();

    // Simulation Form State
    const [simTagName, setSimTagName] = useState('release/v2.4.0');
    const [simCommitSha, setSimCommitSha] = useState('7fa19c2');
    const [simPusher, setSimPusher] = useState('lead-dev-singularity');
    const [isSimulating, setIsSimulating] = useState(false);
    const [copiedSnippet, setCopiedSnippet] = useState(false);
    const [testQueryTag, setTestQueryTag] = useState('release/v2.5.1');

    // Preset tag options for quick simulation
    const tagPresets = [
        'release/v2.4.0',
        'release/v2.4.1-hotfix',
        'v1.3.9',
        'release/android-prod',
        'feature/beta-tag',
        'nightly/2026-10-23'
    ];

    const isMatch = useMemo(() => {
        return matchesTagPattern(simTagName, config.pattern);
    }, [simTagName, config.pattern]);

    const testMatchResult = useMemo(() => {
        return matchesTagPattern(testQueryTag, config.pattern);
    }, [testQueryTag, config.pattern]);

    const extractedVersion = useMemo(() => {
        return extractVersionFromTag(simTagName);
    }, [simTagName]);

    const handleCopyYaml = () => {
        const yaml = `name: Automated Release Pipeline on Git Tag
on:
  push:
    tags:
      - '${config.pattern}'

jobs:
  build-and-release:
    name: Build & Release Package
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Extract Tag Version
        id: get_version
        run: |
          TAG_NAME="\${GITHUB_REF#refs/tags/}"
          echo "tag_name=$TAG_NAME" >> $GITHUB_OUTPUT
          # Extract semantic version
          VERSION=$(echo "$TAG_NAME" | sed -E 's/.*v?([0-9]+\\.[0-9]+\\.[0-9]+).*/\\1/')
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Triggered release pipeline for version $VERSION from tag $TAG_NAME"

      - name: Setup Node & Toolchain
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Typings & Verification
        run: npm run lint

      - name: Compile Application Release
        run: npm run build
        env:
          APP_VERSION: \${{ steps.get_version.outputs.version }}
          DEPLOY_ENV: '${config.environment}'

      - name: Notify Fitness Future CI/CD Webhook
        if: always()
        run: |
          curl -X POST https://api.fitnessfuture.com/api/github/webhook \\
            -H "Content-Type: application/json" \\
            -d '{
              "repository": "\${{ github.repository }}",
              "branch": "\${{ github.ref }}",
              "tag": "\${{ steps.get_version.outputs.tag_name }}",
              "commitSha": "\${{ github.sha }}",
              "version": "\${{ steps.get_version.outputs.version }}",
              "status": "\${{ job.status == 'success' && 'SUCCESS' || 'FAILED' }}"
            }'`;

        navigator.clipboard.writeText(yaml);
        setCopiedSnippet(true);
        addToast('GitHub Actions Tag Workflow YAML copied to clipboard!', 'success');
        setTimeout(() => setCopiedSnippet(false), 2500);
    };

    const handleSimulateTagPush = async () => {
        if (!simTagName.trim()) {
            addToast('Please enter a Git tag name.', 'error');
            return;
        }

        setIsSimulating(true);

        const versionToUse = config.autoExtractVersion ? extractedVersion : '1.3.0';

        if (!config.enabled) {
            addToast(`Git tag '${simTagName}' pushed, but Automated Tag Triggers are currently PAUSED.`, 'info');
            setIsSimulating(false);
            return;
        }

        if (!isMatch) {
            addToast(`Git tag '${simTagName}' pushed, but did not match active pattern '${config.pattern}'. Build skipped.`, 'info');
            setIsSimulating(false);
            return;
        }

        try {
            await onTriggerTagBuild({
                tagName: simTagName.trim(),
                commitSha: simCommitSha.trim() || Math.random().toString(16).substring(2, 9),
                workflowId: config.workflowId,
                version: versionToUse,
                environment: config.environment,
                skipTests: config.skipTests
            });
            addToast(`Git tag '${simTagName}' verified! Auto-started build for v${versionToUse}.`, 'success');
        } catch (err: any) {
            addToast(`Tag trigger failed: ${err.message || 'Unknown error'}`, 'error');
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className={`space-y-6 text-left ${embedded ? '' : 'p-4 bg-white/[0.02] border border-white/5 rounded-2xl'}`}>
            {/* Header & Status Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-amber-400" />
                        <h3 className="font-black uppercase tracking-wider text-white text-xs sm:text-sm flex items-center gap-2">
                            Automated Git Tag Trigger Engine
                        </h3>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase border ${config.enabled ? 'bg-emerald-500/10 text-[#00FF00] border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                            {config.enabled ? 'ACTIVE & LISTENING' : 'TRIGGER DISABLED'}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-sans max-w-2xl">
                        Automatically boots a full release pipeline build whenever a Git tag matching your pattern (e.g. <code className="text-amber-400 font-mono">release/*</code>) is pushed to <strong className="text-white font-mono">{githubRepo}</strong>.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopyYaml}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[9px] font-black uppercase font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Copy GitHub Actions YAML workflow snippet"
                    >
                        {copiedSnippet ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
                        {copiedSnippet ? 'Copied YAML' : 'Export Actions YAML'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const newEnabled = !config.enabled;
                            onChangeConfig({ ...config, enabled: newEnabled });
                            addToast(newEnabled ? 'Automated Git Tag Trigger enabled!' : 'Automated Git Tag Trigger disabled.', newEnabled ? 'success' : 'info');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${config.enabled ? 'bg-emerald-500/20 text-[#00FF00] border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                    >
                        <Zap className="w-3 h-3" />
                        {config.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            </div>

            {/* Rules Configuration Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Tag Pattern Filter & Rule Settings */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[9px] uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5">
                            <Filter className="w-3 h-3" /> Tag Pattern Matching Filter
                        </span>
                        <span className="text-[8px] font-mono text-gray-400">Glob / Regex Match</span>
                    </div>

                    <div className="space-y-3 font-sans">
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black tracking-widest text-gray-300 block">
                                Target Tag Pattern Filter
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.pattern}
                                    onChange={(e) => onChangeConfig({ ...config, pattern: e.target.value })}
                                    placeholder="e.g. release/* or v*, release/v*"
                                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 font-mono text-amber-300 text-xs focus:outline-none focus:border-amber-500/50"
                                />
                            </div>
                            <p className="text-[8.5px] text-gray-500 font-mono">
                                Comma-separated wildcards supported: e.g. <code className="text-gray-400">release/*</code>, <code className="text-gray-400">v*</code>, <code className="text-gray-400">release/v*</code>, <code className="text-gray-400">prod-*</code>
                            </p>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-1">
                            <span className="text-[8px] uppercase font-bold text-gray-500 block">Quick Pattern Presets:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {['release/*', 'v*', 'release/v*', 'prod-*', 'v*.*.*'].map((pat) => (
                                    <button
                                        key={pat}
                                        type="button"
                                        onClick={() => {
                                            onChangeConfig({ ...config, pattern: pat });
                                            addToast(`Pattern set to '${pat}'`, 'info');
                                        }}
                                        className={`px-2 py-0.5 rounded text-[8px] font-mono border transition-all cursor-pointer ${config.pattern === pat ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                                    >
                                        {pat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Pipeline & Environment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1 font-sans">
                                <label className="text-[9px] uppercase font-black tracking-widest text-[#00FF00] block">Target Build Pipeline</label>
                                <select
                                    value={config.workflowId}
                                    onChange={(e) => onChangeConfig({ ...config, workflowId: e.target.value })}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 font-mono text-white text-[10px] focus:outline-none focus:border-violet-500/50 h-9"
                                >
                                    <option value="android_production">Android Production Bundle (Release)</option>
                                    <option value="ios_adhoc">iOS Ad-Hoc Core Compiler (IPA)</option>
                                    <option value="android_full_automation">Android App with Full AI Automations</option>
                                    <option value="linter_typing_check">Full CI Suite (Lint & Typings check)</option>
                                    <option value="self_healing_security">Antigravity Self-Healing Scanner</option>
                                </select>
                            </div>

                            <div className="space-y-1 font-sans">
                                <label className="text-[9px] uppercase font-black tracking-widest text-[#00FF00] block">Target Environment</label>
                                <select
                                    value={config.environment}
                                    onChange={(e) => onChangeConfig({ ...config, environment: e.target.value as any })}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 font-mono text-white text-[10px] focus:outline-none focus:border-violet-500/50 h-9"
                                >
                                    <option value="production">Production Track (Play Console / TestFlight)</option>
                                    <option value="staging">Staging / Sandbox Internal Testing</option>
                                </select>
                            </div>
                        </div>

                        {/* Automation Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10">
                                <span className="text-[8.5px] font-bold text-gray-300">Auto-Extract SemVer</span>
                                <input
                                    type="checkbox"
                                    checked={config.autoExtractVersion}
                                    onChange={(e) => onChangeConfig({ ...config, autoExtractVersion: e.target.checked })}
                                    className="accent-[#00FF00] w-3.5 h-3.5"
                                />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10">
                                <span className="text-[8.5px] font-bold text-gray-300">Auto-Deploy Binaries</span>
                                <input
                                    type="checkbox"
                                    checked={config.autoDeploy}
                                    onChange={(e) => onChangeConfig({ ...config, autoDeploy: e.target.checked })}
                                    className="accent-cyan-400 w-3.5 h-3.5"
                                />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10">
                                <span className="text-[8.5px] font-bold text-gray-300">Fast Mode (Skip Unit Tests)</span>
                                <input
                                    type="checkbox"
                                    checked={config.skipTests}
                                    onChange={(e) => onChangeConfig({ ...config, skipTests: e.target.checked })}
                                    className="accent-violet-400 w-3.5 h-3.5"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* 2. Interactive Pattern Test Sandbox */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[9px] uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" /> Live Pattern Tester
                            </span>
                            <span className="text-[8px] font-mono text-gray-400">Sandbox</span>
                        </div>
                        <p className="text-[8.5px] text-gray-400">
                            Test any hypothetical tag against your active filter <code className="text-amber-400 font-mono">'{config.pattern}'</code>:
                        </p>

                        <div className="space-y-1">
                            <input
                                type="text"
                                value={testQueryTag}
                                onChange={(e) => setTestQueryTag(e.target.value)}
                                placeholder="Enter test tag e.g. release/v2.1"
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 font-mono text-white text-[10px] focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>

                        <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-[9px] ${testMatchResult ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            <div className="flex items-center gap-1.5 truncate">
                                {testMatchResult ? <CheckCircle className="w-3.5 h-3.5 text-[#00FF00] shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                <span className="font-bold truncate">{testMatchResult ? 'MATCHES RULE' : 'IGNORED / MISMATCH'}</span>
                            </div>
                            <span className="text-[8px] bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                                v{extractVersionFromTag(testQueryTag)}
                            </span>
                        </div>
                    </div>

                    <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-[8px] font-mono text-gray-400 space-y-1">
                        <div className="flex justify-between">
                            <span>Repository:</span>
                            <span className="text-white truncate max-w-[130px]">{githubRepo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>VCS Connection:</span>
                            <span className={githubConnected ? 'text-[#00FF00]' : 'text-amber-400'}>{githubConnected ? 'Linked' : 'Local Sandbox'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Poll Interval:</span>
                            <span className="text-cyan-400">30s Active Loop</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Git Tag Push Simulator Box */}
            <div className="p-4 bg-gradient-to-r from-violet-950/20 via-black/40 to-cyan-950/20 border border-violet-500/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-violet-400" />
                        <span className="font-black uppercase tracking-wider text-white text-xs">Simulate Remote Git Tag Push</span>
                    </div>
                    <span className="text-[8px] font-mono text-violet-300 font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                        VCS TRIGGER SIMULATOR
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black tracking-widest text-violet-300 block">Pushed Git Tag Name</label>
                        <input
                            type="text"
                            value={simTagName}
                            onChange={(e) => setSimTagName(e.target.value)}
                            placeholder="e.g. release/v2.4.0"
                            className="w-full bg-black/70 border border-white/10 rounded-xl px-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 block">Head Commit SHA</label>
                        <div className="flex gap-1.5">
                            <input
                                type="text"
                                value={simCommitSha}
                                onChange={(e) => setSimCommitSha(e.target.value)}
                                placeholder="e.g. 7fa19c2"
                                className="flex-1 bg-black/70 border border-white/10 rounded-xl px-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-violet-500/50"
                            />
                            <button
                                type="button"
                                onClick={() => setSimCommitSha(Math.random().toString(16).substring(2, 9))}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 text-[9px] font-mono"
                                title="Generate random commit hash"
                            >
                                🎲
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 block">Pusher / Committer</label>
                        <input
                            type="text"
                            value={simPusher}
                            onChange={(e) => setSimPusher(e.target.value)}
                            placeholder="e.g. fitness-future-bot"
                            className="w-full bg-black/70 border border-white/10 rounded-xl px-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                </div>

                {/* Quick Presets row */}
                <div className="flex items-center gap-2 flex-wrap text-[8px] font-mono">
                    <span className="text-gray-500 uppercase font-bold">Quick Tag Presets:</span>
                    {tagPresets.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => setSimTagName(tag)}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-colors cursor-pointer"
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Status Bar & Trigger Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span className="text-gray-400">Trigger Verdict:</span>
                        {isMatch ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-[#00FF00] border border-emerald-500/30 font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Matches pattern '{config.pattern}' → Will trigger automated v{extractedVersion} build
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                                <AlertCircle className="w-3 h-3" />
                                Tag does NOT match '{config.pattern}' → Trigger will be skipped
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        disabled={isSimulating}
                        onClick={handleSimulateTagPush}
                        className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSimulating ? (
                            <>
                                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                                Executing Tag Dispatch...
                            </>
                        ) : (
                            <>
                                <Tag className="w-3.5 h-3.5" />
                                Push Git Tag & Auto-Trigger Pipeline
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tag Trigger Audit History */}
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-black uppercase tracking-wider text-white text-xs">Recent Tag Trigger Executions</span>
                        <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                            {triggerHistory.length} Recorded
                        </span>
                    </div>

                    {triggerHistory.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearHistory}
                            className="text-[8px] font-mono text-red-400 hover:underline uppercase cursor-pointer"
                        >
                            Clear History
                        </button>
                    )}
                </div>

                {triggerHistory.length === 0 ? (
                    <div className="text-gray-500 italic py-8 text-center font-mono uppercase tracking-widest text-[9px]">
                        No tag push events recorded yet. Push a tag above to test the automated pipeline trigger.
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin custom-scrollbar pr-1">
                        {triggerHistory.map((item) => (
                            <div
                                key={item.id}
                                className={`p-2.5 rounded-xl border text-left font-mono text-[9px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${item.status === 'SUCCESS' ? 'bg-emerald-500/5 border-emerald-500/20' : item.status === 'TRIGGERED' ? 'bg-cyan-500/5 border-cyan-500/20' : item.status === 'IGNORED' ? 'bg-white/[0.02] border-white/5 text-gray-400' : 'bg-red-500/5 border-red-500/20'}`}
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                                        <span className="font-bold text-white text-[10px]">{item.tagName}</span>
                                        <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase ${item.status === 'SUCCESS' ? 'bg-emerald-500/20 text-[#00FF00]' : item.status === 'TRIGGERED' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' : item.status === 'IGNORED' ? 'bg-white/5 text-gray-500' : 'bg-red-500/20 text-red-400'}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-gray-500 text-[8px]">v{item.extractedVersion}</span>
                                        <span className="text-violet-400 text-[8px]">[{item.environment}]</span>
                                    </div>
                                    <div className="text-[8px] text-gray-500 flex items-center gap-2">
                                        <span>Commit: <code className="text-gray-400">{item.commitSha}</code></span>
                                        <span>•</span>
                                        <span>Pusher: {item.pusher}</span>
                                        <span>•</span>
                                        <span>Target: {item.workflowName}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <span className="text-[7.5px] text-gray-500">{item.timestamp}</span>
                                    {item.workflowRunId && onSelectWorkflowRun && (
                                        <button
                                            type="button"
                                            onClick={() => onSelectWorkflowRun(item.workflowRunId!)}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-cyan-400 text-[8px] font-black uppercase cursor-pointer"
                                        >
                                            View Run ↗
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
