import { processSelfLearningEngine } from '../../lib/core_ai';

export interface AppFitnessFutureMatrixConfig {
    themeMode: 'light' | 'dark' | 'synthwave';
    aiStrictness: number; // 1-10
    defaultWorkoutDurationMinutes: number;
    activeModules: string[];
    learningLevel: number;
}

export class SelfLearningEngine {
    private static instance: SelfLearningEngine;
    private eventLogs: Array<{timestamp: number, event: string, data: any}> = [];
    private currentConfig: AppFitnessFutureMatrixConfig = {
        themeMode: 'synthwave',
        aiStrictness: 8,
        defaultWorkoutDurationMinutes: 60,
        activeModules: ['ai_coach', 'diet_tracker', 'quantum_dna', 'omniscience', 'biomarker_vault'],
        learningLevel: 1.0
    };
    
    private constructor() {
        this.loadConfig();
    }
    
    public static getInstance() {
        if (!SelfLearningEngine.instance) {
            SelfLearningEngine.instance = new SelfLearningEngine();
        }
        return SelfLearningEngine.instance;
    }

    private loadConfig() {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('omni_matrix_config');
            if (stored) {
                try {
                    this.currentConfig = { ...this.currentConfig, ...JSON.parse(stored) };
                } catch(e) {}
            }
        }
    }

    public getConfig() {
        return this.currentConfig;
    }

    public getLogs() {
        return this.eventLogs;
    }

    public logEvent(eventName: string, data: any) {
        this.eventLogs.push({
            timestamp: Date.now(),
            event: eventName,
            data
        });
        
        // Keep memory bounded to last 500 events
        if (this.eventLogs.length > 500) {
            this.eventLogs.shift();
        }
    }
    
    public async triggerEvolution(): Promise<{ updates: Partial<AppFitnessFutureMatrixConfig>; insights: string[]; learningLevel: number } | null> {
        if (this.eventLogs.length < 5) {
             return null; // Not enough data
        }
        
        console.log("[FitnessFutureMatrix] Initiating neural evolution... analyzing logs.");
        try {
            const aiMutation = await processSelfLearningEngine({logs: this.eventLogs, config: this.currentConfig});
            if (aiMutation && aiMutation.updates) {
                this.currentConfig = { 
                    ...this.currentConfig, 
                    ...aiMutation.updates, 
                    learningLevel: aiMutation.learningLevel || (this.currentConfig.learningLevel + 0.1)
                };
                
                if (typeof window !== 'undefined') {
                    localStorage.setItem('omni_matrix_config', JSON.stringify(this.currentConfig));
                }
                
                // Keep the most recent 10 logs for context, clear the rest
                this.eventLogs = this.eventLogs.slice(-10); 
                
                console.log("[FitnessFutureMatrix] Evolution successful. New insights:", aiMutation.insights);
                return aiMutation;
            }
        } catch (e) {
            console.error("Evolution failed:", e);
        }
        return null;
    }
}

export const omniEngine100x = SelfLearningEngine.getInstance();
