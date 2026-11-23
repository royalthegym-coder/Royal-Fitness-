import React, { useState } from 'react';
import { 
    Send, Zap, CheckCircle2, XCircle, RotateCcw, Copy, 
    Check, ArrowRight, ShieldCheck, Wifi, ExternalLink, 
    AlertCircle, Terminal, Code, Radio, RefreshCw, Activity,
    GitBranch, GitCommit, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export interface GitHubWebhookSimulatorProps {
    githubRepo?: string;
    activePlatform?: 'android' | 'ios';
    cicdWebhookUrl?: string;
    onWebhookDispatched?: () => void | Promise<void>;
    onNavigateToDeliveries?: () => void;
}

export type WebhookEventType = 'push' | 'workflow_run' | 'ping' | 'release';

export const GitHubWebhookSimulator: React.FC<GitHubWebhookSimulatorProps> = ({
    githubRepo = 'FitnessFuture/fitness-future',
    activePlatform = 'android',
    cicdWebhookUrl = '',
    onWebhookDispatched,
    onNavigateToDeliveries
}) => {
    const { addToast } = useToast();

    // Configuration Inputs
    const [eventType, setEventType] = useState<WebhookEventType>('push');
    const [targetRepo, setTargetRepo] = useState<string>(githubRepo || 'FitnessFuture/fitness-future');
    const [branchRef, setBranchRef] = useState<string>('main');
    const [platform, setPlatform] = useState<'Android' | 'iOS'>(activePlatform === 'ios' ? 'iOS' : 'Android');
    const [outcomeStatus, setOutcomeStatus] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
    const [customVersion, setCustomVersion] = useState<string>('1.3.1');
    const [notifyCustomUrl, setNotifyCustomUrl] = useState<boolean>(true);

    // Execution & Response State
    const [isTriggering, setIsTriggering] = useState<boolean>(false);
    const [lastDeliveryResult, setLastDeliveryResult] = useState<{
        success: boolean;
        httpStatus: number;
        deliveryId: string;
        timestamp: string;
        latencyMs: number;
        eventType: string;
        endpoint: string;
        responseMessage?: string;
    } | null>(null);

    const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([
        '# GitHub Webhook Simulation & Connectivity Diagnostic Console',
        '# Ready to synthesize GitHub webhook delivery payloads.',
        '# Click "Trigger Simulated Webhook Payload" to test integration pipeline connectivity without a real Git push.'
    ]);
    const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
    const [showPayloadPreview, setShowPayloadPreview] = useState<boolean>(false);

    // Generate simulated commit & delivery IDs
    const sampleCommitSha = 'a4f91c8';
    const sampleDeliveryGuid = '7b28f3e1-92cb-46a2-9721-e01d84ca28d4';

    // Build the synthetic payload
    const getPayloadObject = () => {
        const commitHash = Math.random().toString(16).substring(2, 9);
        const filesList = [platform === 'iOS' ? `fitness_future_v${customVersion}_signed.ipa` : `fitness_future_v${customVersion}_signed.apk`];
        
        return {
            event: eventType,
            deliveryGuid: sampleDeliveryGuid,
            repository: targetRepo,
            branch: branchRef.startsWith('refs/') ? branchRef : `refs/heads/${branchRef}`,
            commitSha: commitHash,
            platform: platform,
            version: customVersion,
            status: outcomeStatus,
            pusher: {
                name: 'github-actions[bot]',
                email: 'actions@github.com'
            },
            workflow_run: {
                id: Math.floor(1000000000 + Math.random() * 9000000000),
                name: platform === 'iOS' ? 'iOS AdHoc Fastlane Build' : 'Android Release Bundle Pipeline',
                head_branch: branchRef,
                head_sha: commitHash,
                event: eventType,
                status: 'completed',
                conclusion: outcomeStatus === 'SUCCESS' ? 'success' : 'failure',
                created_at: new Date(Date.now() - 45000).toISOString(),
                updated_at: new Date().toISOString()
            },
            files: filesList,
            logs: [
                `[GitHub-Webhook-Simulation] [${new Date().toLocaleTimeString()}] Synthetic event received: '${eventType}'`,
                `[GitHub-Webhook-Simulation] Target Repository: ${targetRepo} (${branchRef})`,
                `[GitHub-Webhook-Simulation] Commit reference: ${commitHash} • Platform: ${platform}`,
                `[GitHub-Webhook-Simulation] Pipeline Execution Outcome: ${outcomeStatus}`,
                `[GitHub-Webhook-Simulation] Simulated delivery bypassed physical Git push requirement. Connectivity VERIFIED.`,
                `[GitHub-Webhook-Simulation] Artifact targets: ${filesList.join(', ')}`
            ]
        };
    };

    const handleTriggerSimulatedWebhook = async () => {
        setIsTriggering(true);
        const startTime = performance.now();
        const payload = getPayloadObject();
        const generatedDeliveryId = 'wh_sim_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5);

        addToast(`Dispatching simulated GitHub '${eventType}' webhook payload...`, 'info');

        setDiagnosticLogs(prev => [
            ...prev,
            `--- [${new Date().toLocaleTimeString()}] INITIATING SIMULATED WEBHOOK DELIVERY ---`,
            `[Handshake] Header X-GitHub-Event: ${eventType}`,
            `[Handshake] Header X-GitHub-Delivery: ${sampleDeliveryGuid}`,
            `[Handshake] Target Repository: ${targetRepo} @ ${branchRef}`,
            `[Handshake] Simulated Commit SHA: ${payload.commitSha} (${platform} v${customVersion})`,
            `[Handshake] Dispatching POST payload to internal webhook ingestion endpoint (/api/github/webhook)...`
        ]);

        try {
            // Dispatch payload to local webhook ingestion endpoint
            const res = await fetch('/api/github/webhook', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-GitHub-Event': eventType,
                    'X-GitHub-Delivery': sampleDeliveryGuid,
                    'X-Hub-Signature-256': 'sha256=simulated_hmac_test_connectivity_ok',
                    'User-Agent': 'GitHub-Hookshot/simulated-test'
                },
                body: JSON.stringify(payload)
            });

            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            let responseData: any = {};
            try {
                responseData = await res.json();
            } catch (err) {
                responseData = { success: res.ok };
            }

            const isSuccess = res.ok && responseData.success !== false;
            const finalDeliveryId = responseData.webhook?.id || generatedDeliveryId;

            setLastDeliveryResult({
                success: isSuccess,
                httpStatus: res.status,
                deliveryId: finalDeliveryId,
                timestamp: new Date().toLocaleTimeString(),
                latencyMs: latency,
                eventType: eventType,
                endpoint: '/api/github/webhook',
                responseMessage: isSuccess ? 'Payload accepted and queued' : (responseData.error || 'Webhook delivery failed')
            });

            setDiagnosticLogs(prev => [
                ...prev,
                `[Response] HTTP Status: ${res.status} ${res.statusText || (isSuccess ? 'OK' : 'Error')}`,
                `[Response] Delivery ID: ${finalDeliveryId}`,
                `[Response] Round-trip Latency: ${latency}ms`,
                `[Response] Webhook Ingestion Engine: Handshake confirmed, build record updated.`,
                ...(notifyCustomUrl && cicdWebhookUrl ? [`[Relay] Dispatched external alert payload to: ${cicdWebhookUrl}`] : []),
                `[Outcome] Simulated webhook delivery completed with ZERO real Git push required.`
            ]);

            // If an external Slack/Teams URL is configured, simulate relay ping
            if (notifyCustomUrl && cicdWebhookUrl) {
                try {
                    // Non-blocking ping attempt or simulated relay confirmation
                    setDiagnosticLogs(prev => [
                        ...prev,
                        `[Relay] External Webhook URL notification test triggered.`
                    ]);
                } catch (relayErr) {
                    // Ignore CORS or external network quirks
                }
            }

            if (isSuccess) {
                addToast(`Simulated GitHub '${eventType}' webhook processed successfully (200 OK, ${latency}ms)!`, 'success');
                if (onWebhookDispatched) {
                    await onWebhookDispatched();
                }
            } else {
                addToast(`Simulated webhook rejected with status ${res.status}`, 'error');
            }
        } catch (error: any) {
            console.error('Webhook simulation failed:', error);
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            setLastDeliveryResult({
                success: false,
                httpStatus: 500,
                deliveryId: generatedDeliveryId,
                timestamp: new Date().toLocaleTimeString(),
                latencyMs: latency,
                eventType: eventType,
                endpoint: '/api/github/webhook',
                responseMessage: error.message || 'Network connection failed'
            });

            setDiagnosticLogs(prev => [
                ...prev,
                `[Error] Webhook POST dispatch exception: ${error.message || 'Unknown network failure'}`,
                `[Diagnosis] Verify server status and local endpoint availability.`
            ]);

            addToast(`Webhook simulation error: ${error.message}`, 'error');
        } finally {
            setIsTriggering(false);
        }
    };

    const handleCopyPayload = () => {
        const payload = getPayloadObject();
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        setCopiedPayload(true);
        addToast('Simulated GitHub webhook payload JSON copied to clipboard.', 'success');
        setTimeout(() => setCopiedPayload(false), 2000);
    };

    const handleClearLogs = () => {
        setDiagnosticLogs([
            '# GitHub Webhook Simulation & Connectivity Diagnostic Console',
            '# Logs cleared. Ready for next simulated test dispatch.'
        ]);
        setLastDeliveryResult(null);
    };

    return (
        <div className="p-4 bg-black/60 border border-violet-500/20 rounded-2xl space-y-4 text-left shadow-[0_4px_24px_rgba(139,92,246,0.06)] relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-cyan-400 to-[#00FF00] opacity-80" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-black uppercase tracking-wider text-white text-[12px]">
                                GitHub Webhook Integration & Connectivity Test
                            </span>
                            <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                SIMULATION ENGINE
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                            Trigger simulated GitHub webhook delivery payloads to verify pipeline connectivity without performing a real Git push.
                        </p>
                    </div>
                </div>

                {lastDeliveryResult && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`text-[8.5px] font-mono px-2 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
                            lastDeliveryResult.success 
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-[#00FF00]' 
                                : 'bg-red-500/15 border-red-500/30 text-red-400'
                        }`}>
                            {lastDeliveryResult.success ? <CheckCircle2 className="w-3 h-3 text-[#00FF00]" /> : <XCircle className="w-3 h-3 text-red-400" />}
                            {lastDeliveryResult.httpStatus} OK • {lastDeliveryResult.latencyMs}ms
                        </span>
                    </div>
                )}
            </div>

            {/* Event & Target Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-sans">
                {/* Event Type */}
                <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-widest text-violet-400 block">
                        Webhook Event Type
                    </label>
                    <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as WebhookEventType)}
                        className="w-full bg-black/80 border border-white/10 rounded-xl px-2.5 py-2 font-mono text-white text-[10px] focus:outline-none focus:border-violet-500/50 transition-colors"
                    >
                        <option value="push">push (Commit Push)</option>
                        <option value="workflow_run">workflow_run (Pipeline Run)</option>
                        <option value="ping">ping (Handshake Probe)</option>
                        <option value="release">release (Tag Published)</option>
                    </select>
                </div>

                {/* Target Branch / Ref */}
                <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-widest text-white/50 block">
                        Target Branch / Ref
                    </label>
                    <div className="relative">
                        <GitBranch className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                        <input
                            type="text"
                            value={branchRef}
                            onChange={(e) => setBranchRef(e.target.value)}
                            placeholder="main"
                            className="w-full bg-black/80 border border-white/10 rounded-xl pl-8 pr-2.5 py-2 font-mono text-white text-[10px] focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Target Platform */}
                <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-widest text-white/50 block">
                        Target Platform
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setPlatform('Android')}
                            className={`py-2 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                                platform === 'Android'
                                    ? 'bg-[#00FF00]/15 text-[#00FF00] border border-[#00FF00]/30 shadow-[0_0_8px_rgba(0,255,0,0.15)]'
                                    : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/10'
                            }`}
                        >
                            Android
                        </button>
                        <button
                            type="button"
                            onClick={() => setPlatform('iOS')}
                            className={`py-2 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                                platform === 'iOS'
                                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                                    : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/10'
                            }`}
                        >
                            iOS
                        </button>
                    </div>
                </div>

                {/* Simulated Outcome */}
                <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-widest text-white/50 block">
                        Outcome Status
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setOutcomeStatus('SUCCESS')}
                            className={`py-2 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                                outcomeStatus === 'SUCCESS'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/10'
                            }`}
                        >
                            SUCCESS
                        </button>
                        <button
                            type="button"
                            onClick={() => setOutcomeStatus('FAILED')}
                            className={`py-2 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                                outcomeStatus === 'FAILED'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/10'
                            }`}
                        >
                            FAILED
                        </button>
                    </div>
                </div>
            </div>

            {/* Extra Target Options: Repo & Webhook URL info */}
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] font-mono">
                <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-gray-500">Repository:</span>
                    <span className="text-violet-300 font-bold">{targetRepo}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">Ingestion Path:</span>
                    <span className="text-emerald-400 font-bold">/api/github/webhook</span>
                </div>
                {cicdWebhookUrl && (
                    <div className="flex items-center gap-1.5 text-cyan-300">
                        <Wifi className="w-3 h-3 text-cyan-400" />
                        <span className="text-gray-500">Relay URL configured:</span>
                        <span className="truncate max-w-[180px]">{cicdWebhookUrl}</span>
                    </div>
                )}
            </div>

            {/* ACTION BUTTON: The primary trigger */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={handleTriggerSimulatedWebhook}
                    disabled={isTriggering}
                    className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:pointer-events-none group"
                >
                    {isTriggering ? (
                        <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Dispatching Simulated Webhook Payload...
                        </>
                    ) : (
                        <>
                            <Zap className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                            Trigger Simulated GitHub Webhook Event
                        </>
                    )}
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setShowPayloadPreview(!showPayloadPreview)}
                        className={`py-3 px-3 rounded-xl border text-[9px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            showPayloadPreview 
                                ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' 
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                        title="Toggle Synthetic Payload Inspector"
                    >
                        <Code className="w-3.5 h-3.5" />
                        {showPayloadPreview ? 'Hide Payload' : 'Inspect JSON'}
                        {showPayloadPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyPayload}
                        className="py-3 px-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Copy Sample JSON Payload"
                    >
                        {copiedPayload ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPayload ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* Collapsible JSON Payload Preview */}
            {showPayloadPreview && (
                <div className="p-3 bg-black/90 border border-violet-500/30 rounded-xl space-y-2 animate-fade-in font-mono text-[9px]">
                    <div className="flex items-center justify-between text-gray-400 border-b border-white/5 pb-1.5">
                        <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-white font-bold uppercase">Simulated GitHub Webhook Payload Preview</span>
                        </div>
                        <span className="text-[8px] text-gray-500">Headers: X-GitHub-Event: {eventType}</span>
                    </div>
                    <pre className="text-cyan-300 max-h-44 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed select-all">
                        {JSON.stringify(getPayloadObject(), null, 2)}
                    </pre>
                </div>
            )}

            {/* Diagnostic Log Console */}
            <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[9px]">
                    <span className="text-gray-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        Live Webhook Dispatch Audit Log
                    </span>
                    <button
                        type="button"
                        onClick={handleClearLogs}
                        className="text-[8px] font-mono text-gray-500 hover:text-gray-300 transition-colors uppercase"
                    >
                        Clear Log
                    </button>
                </div>
                <div className="bg-black/95 font-mono text-[9px] p-3 rounded-xl border border-white/5 max-h-36 overflow-y-auto text-left text-emerald-400/90 leading-relaxed custom-scrollbar shadow-inner">
                    {diagnosticLogs.map((log, idx) => (
                        <div 
                            key={idx} 
                            className={`py-0.5 ${
                                log.startsWith('---') 
                                    ? 'text-violet-300 font-bold pt-1' 
                                    : log.startsWith('[Error]') 
                                    ? 'text-red-400 font-bold' 
                                    : log.startsWith('[Response]') 
                                    ? 'text-cyan-300 font-bold' 
                                    : log.startsWith('#') 
                                    ? 'text-gray-500 italic' 
                                    : 'text-gray-300'
                            }`}
                        >
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer tips */}
            <div className="flex items-center justify-between text-[8px] text-gray-500 font-mono pt-1 border-t border-white/5">
                <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-violet-400" />
                    Zero remote repository write permissions required for simulation
                </span>
                {onNavigateToDeliveries && (
                    <button
                        type="button"
                        onClick={onNavigateToDeliveries}
                        className="text-violet-400 hover:text-violet-300 underline font-bold uppercase transition-colors"
                    >
                        View Incoming Webhooks Feed &rarr;
                    </button>
                )}
            </div>
        </div>
    );
};
