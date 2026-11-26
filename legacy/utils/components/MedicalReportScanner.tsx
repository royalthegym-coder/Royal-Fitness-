import React, { useState, useRef } from 'react';
import { Camera, FileText, Upload, Sparkles, AlertTriangle, CheckCircle, Activity, BrainCircuit, X, MessageSquare, Send, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../hooks/useToast';
import { useData } from '../../utils/context/DataProvider';
import { ai, generateClinicalFitnessProtocol, cleanAndParseJSON } from '../../lib/core_ai';
import { sendGeniusProtocol } from '../../lib/whatsapp';

const MedicalReportScanner: React.FC = () => {
    const { addToast } = useToast();
    const { members } = useData();
    const [activeMemberId, setActiveMemberId] = useState<number>(members.length > 0 ? members[0].id : 0);
    const member = members.find(m => m.id === activeMemberId);
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setResults(null); 
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendProtocol = async () => {
        if (!member || !results) return;
        
        setIsSending(true);
        try {
            const reportText = `🩺 *CLINICAL DIAGNOSIS*\n${results.diagnosis?.modern}\n\n🥗 *DIET PROTOCOL* (${results.diet_protocol?.type})\n✅ Eat: ${results.diet_protocol?.foods_to_eat?.join(', ')}\n❌ Avoid: ${results.diet_protocol?.foods_to_avoid?.join(', ')}\n\n🏋️ *SAFE WORKOUT*\n${results.workout_prescription?.focus}\n⚠️ Contraindications: ${results.workout_prescription?.contraindications?.join(', ')}`;
            
            const success = await sendGeniusProtocol(member, reportText);
            if (success) {
                addToast('Protocol successfully sent to Member via WhatsApp Business API', 'success');
            } else {
                addToast('Failed to send protocol. Check WhatsApp API configuration.', 'error');
            }
        } catch (error) {
            console.error('Send Error:', error);
            addToast('FitnessFutureuplink to N8N/WhatsApp failed.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const scanReport = async () => {
        if (!imagePreview || !member) return;
        
        setIsScanning(true);
        try {
            const base64Data = imagePreview.replace(/^data:(image\/\w+);base64,/, "");
            const mimeType = imagePreview.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
            
            const prompt = `Analyze this clinical/medical report for Member: ${member.name} (Age: ${member.bio_age || 30}). 
             Extract key blood markers, deficiencies, or physical conditions.
             Return ONLY a JSON object with this exact structure:
             {
                 "diagnosis": { "modern": "string", "root_cause": "string" },
                 "diet_protocol": { "type": "string", "foods_to_eat": ["string"], "foods_to_avoid": ["string"] },
                 "supplement_stack": [ { "name": "string", "dosage": "string", "reason": "string" } ],
                 "workout_prescription": { "focus": "string", "contraindications": ["string"] }
             }`;

            const response = await ai.models.generateContent({
                 model: 'gemini-4-hydrogen',
                 contents: {
                     parts: [
                         { inlineData: { data: base64Data, mimeType } },
                         { text: prompt }
                     ]
                 }
             });

            const parsedData = cleanAndParseJSON(response.text || "{}");
            setResults(parsedData);
            addToast('Clinical scan complete. Protocols generated.', 'success');
        } catch (error) {
            console.error('Scan Error:', error);
            addToast('Failed to analyze the medical report. Ensure image is clear.', 'error');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="bg-black/40 border border-fuchsia-500/20 backdrop-blur-xl rounded-[2rem] p-8 max-w-4xl mx-auto shadow-[0_0_50px_rgba(217,70,239,0.05)]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-widest flex items-center gap-3">
                        <BrainCircuit className="text-fuchsia-500 w-8 h-8" />
                        Clinical Report Scanner
                    </h2>
                    <p className="text-fuchsia-500/70 text-xs font-mono uppercase tracking-widest mt-1">
                        Multimodal AI Vision & Diagnostics
                    </p>
                </div>
            </div>

            {!member ? (
                <div className="text-center p-10 border border-yellow-500/20 rounded-2xl bg-yellow-900/10 text-yellow-500 font-mono tracking-widest uppercase">
                    Select a member from the top right to enable clinical scanning.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: Upload Area */}
                    <div className="flex flex-col gap-6">
                        <div className="relative group w-full aspect-[3/4] border-2 border-dashed border-fuchsia-500/30 rounded-2xl overflow-hidden hover:border-fuchsia-400 transition-colors bg-black/50 flex flex-col items-center justify-center cursor-pointer"
                             onClick={() => !imagePreview && fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageUpload} 
                            />
                            
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Medical Report Preview" className="w-full h-full object-contain" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                        className="absolute top-4 right-4 bg-red-500/20 p-2 rounded-full text-red-400 hover:bg-red-500/40 z-10 font-bold backdrop-blur-md"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-6 flex flex-col items-center">
                                    <Upload className="w-12 h-12 text-fuchsia-500 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-fuchsia-400 font-mono text-sm uppercase tracking-widest mb-2">Upload Blood Report</p>
                                    <p className="text-gray-500 text-[10px] font-mono">JPG, PNG OR PDF SCREENSHOT</p>
                                </div>
                            )}

                            {/* Scanning Overlay */}
                            {isScanning && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                    <div className="w-full h-1 bg-fuchsia-500/20 absolute top-0 -translate-y-full animate-[scan_2s_linear_infinite] shadow-[0_0_20px_#d946ef]"></div>
                                    <Activity className="w-12 h-12 text-fuchsia-400 animate-pulse mb-4" />
                                    <p className="text-fuchsia-400 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Running Clinical Vision Model...</p>
                                </div>
                            )}
                        </div>

                        <button 
                            disabled={!imagePreview || isScanning}
                            onClick={scanReport}
                            className="bg-fuchsia-600/20 border border-fuchsia-500 hover:bg-fuchsia-600/40 text-fuchsia-100 p-4 rounded-xl font-bold uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isScanning ? <RefreshCw className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                            {isScanning ? 'Analyzing OCR Data...' : 'Generate Auto-Trainer Protocol'}
                        </button>
                    </div>

                    {/* RIGHT: Results Area */}
                    <div className="bg-gray-900/50 rounded-2xl border border-white/5 p-6 h-full min-h-[400px] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {!results && !isScanning && (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-gray-500"
                                >
                                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="font-mono text-xs uppercase tracking-widest text-center">Awaiting medical report<br/>for quantum analysis</p>
                                </motion.div>
                            )}

                            {results && !isScanning && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Diagnosis block */}
                                    <div className="p-4 bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-xl">
                                        <h3 className="text-fuchsia-400 text-xs font-mono uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Clinical Diagnosis
                                        </h3>
                                        <p className="text-white text-sm leading-relaxed mb-2">{results.diagnosis?.modern}</p>
                                        <div className="bg-black/50 p-2 rounded text-xs text-gray-400 font-mono border border-white/5">
                                            <span className="text-fuchsia-500">Root Cause:</span> {results.diagnosis?.root_cause}
                                        </div>
                                    </div>

                                    {/* Diet block */}
                                    <div className="p-4 bg-green-950/20 border border-green-500/30 rounded-xl">
                                        <h3 className="text-green-400 text-xs font-mono uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Prescribed Diet ({results.diet_protocol?.type})
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <p className="text-green-500 text-[10px] uppercase mb-1">Increase Intake</p>
                                                <ul className="list-disc pl-4 text-xs text-green-100 flex flex-col gap-1">
                                                    {(results.diet_protocol?.foods_to_eat || []).map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-red-500 text-[10px] uppercase mb-1">Strict Avoid</p>
                                                <ul className="list-disc pl-4 text-xs text-red-100 flex flex-col gap-1">
                                                    {(results.diet_protocol?.foods_to_avoid || []).map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Workout block */}
                                    <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-xl">
                                        <h3 className="text-blue-400 text-xs font-mono uppercase tracking-[0.2em] mb-2">Safe-Mode Workout Protocol</h3>
                                        <p className="text-white text-sm mb-2">{results.workout_prescription?.focus}</p>
                                        {results.workout_prescription?.contraindications?.length > 0 && (
                                            <div className="text-xs text-blue-200 mt-2 p-2 bg-blue-900/20 rounded">
                                                <span className="font-bold text-red-400">Avoid: </span> 
                                                {results.workout_prescription.contraindications.join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-white/10 flex justify-end">
                                        <button
                                            onClick={handleSendProtocol}
                                            disabled={isSending}
                                            className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                            {isSending ? 'Sending to Member...' : 'Send via WhatsApp'}
                                        </button>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalReportScanner;
