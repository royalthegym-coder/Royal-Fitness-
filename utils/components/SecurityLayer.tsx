
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { LockIcon } from './icons/LockIcon';
import { CubeIcon } from './icons/CubeIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';

const SecurityLayer: React.FC = () => {
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [verificationStep, setVerificationStep] = useState(0);

    // Simulate Federated Learning
    useEffect(() => {
        const interval = setInterval(() => {
            setTrainingProgress(prev => (prev >= 100 ? 0 : prev + 5));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    // Simulate ZKP Verification
    useEffect(() => {
        const interval = setInterval(() => {
            setVerificationStep(prev => (prev + 1) % 4);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const steps = ["Hashing Biometrics...", "Generating ZK-Proof...", "Verifying on Hyperledger...", "Identity Confirmed"];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 flex items-center">
                        <ShieldCheckIcon className="w-8 h-8 mr-3 text-red-400" />
                        Privacy-First Data Hub
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Zero-Knowledge Architecture & Federated AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Federated Learning Node */}
                <Card className="border-t-4 border-blue-500 bg-gray-800/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <CubeIcon className="w-6 h-6 mr-2 text-blue-400" />
                            Federated Learning Node
                        </h3>
                        <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">DEVICE: ACTIVE</span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4">
                        Your health models are training <strong>locally on your phone</strong> (ONNX Runtime). Raw data never leaves this device. Only improved model weights are synced.
                    </p>

                    <div className="bg-black/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                            <span>Local Training Epoch: 42</span>
                            <span>{trainingProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${trainingProgress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center text-[10px] text-green-400">
                                <LockIcon className="w-3 h-3 mr-1" /> Data Encrypted
                            </div>
                            <div className="flex items-center text-[10px] text-gray-500">
                                <CloudArrowUpIcon className="w-3 h-3 mr-1" /> Syncing Weights (12KB)
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. Blockchain Identity (ZKP) */}
                <Card className="border-t-4 border-purple-500 bg-gray-800/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <ShieldCheckIcon className="w-6 h-6 mr-2 text-purple-400" />
                            Blockchain Identity (ZKP)
                        </h3>
                        <span className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">HYPERLEDGER</span>
                    </div>

                    <p className="text-sm text-gray-400 mb-4">
                        Access control uses <strong>Zero-Knowledge Proofs</strong>. The gym verifies you are a member without knowing *who* you are, preserving anonymity.
                    </p>

                    <div className="space-y-3">
                        {steps.map((step, i) => (
                            <div key={i} className={`flex items-center p-2 rounded transition-all ${i === verificationStep ? 'bg-purple-900/20 border border-purple-500/50' : 'opacity-30'}`}>
                                <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${i <= verificationStep ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                    {i < verificationStep && <span className="text-black text-[8px]">✓</span>}
                                </div>
                                <span className={`text-xs font-mono ${i === verificationStep ? 'text-white font-bold' : 'text-gray-400'}`}>
                                    {step} {i === verificationStep && <span className="animate-pulse">...</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SecurityLayer;
