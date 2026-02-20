
import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, ShieldAlert, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // In production, log to Sentry/LogRocket here
  }

  private handleHardReset = () => {
      if (confirm("This will clear all local data and reset the app. Are you sure?")) {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
      }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-6 font-sans text-white">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/30 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-10">
                 <ShieldAlert className="w-32 h-32 text-red-500" />
             </div>
             
             <div className="relative z-10 flex flex-col items-center">
                 <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                     <AlertTriangle className="w-10 h-10 text-red-500" />
                 </div>
                 
                 <h1 className="text-2xl font-black italic uppercase tracking-tight mb-2">System Interrupted</h1>
                 <p className="text-gray-400 text-xs font-mono mb-6">
                    A critical rendering anomaly was detected. The Neural Core has paused to protect data integrity.
                 </p>
                 
                 <div className="bg-black/50 p-4 rounded-xl border border-white/5 w-full mb-6 text-left overflow-hidden">
                     <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Error Trace:</p>
                     <p className="text-xs text-gray-500 font-mono break-all line-clamp-3">
                         {this.state.error?.message || "Unknown Error"}
                     </p>
                 </div>

                 <div className="flex flex-col gap-3 w-full">
                     <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-white text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                     >
                         <RefreshCcw className="w-4 h-4" /> Reboot UI
                     </button>
                     <button 
                        onClick={this.handleHardReset}
                        className="w-full bg-red-900/20 text-red-400 border border-red-500/30 font-bold py-3 rounded-xl uppercase tracking-widest text-xs hover:bg-red-900/40 transition-all flex items-center justify-center gap-2"
                     >
                         <Trash2 className="w-4 h-4" /> Factory Reset (Clear Data)
                     </button>
                 </div>
             </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
