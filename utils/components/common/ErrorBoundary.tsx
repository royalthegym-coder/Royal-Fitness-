import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';
import {
  clearStaleServiceWorkersAndCaches,
  isDynamicImportError,
} from '../../lazyWithRetry';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  variant?: 'full' | 'compact' | 'inline';
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  confirmingReset: boolean;
  isRecovering: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    confirmingReset: false,
    isRecovering: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, confirmingReset: false, isRecovering: false };
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, confirmingReset: false, isRecovering: false });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.sendErrorToSentry(error.toString(), errorInfo.componentStack);
  }

  private sendErrorToSentry = async (errorMsg: string, stackTrace: string | null | undefined) => {
    let batteryLevel = 'Unknown';
    let netSpeed = 'Unknown';
    try {
      if ((navigator as any).getBattery) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = `${Math.round(battery.level * 100)}%`;
      }
      if ((navigator as any).connection) {
        netSpeed = (navigator as any).connection.downlink + ' Mbps';
      }
    } catch {
      // Ignore device metric errors
    }

    const crashReport = {
      error_log: errorMsg,
      stack_trace: stackTrace,
      battery_level: batteryLevel,
      net_speed: netSpeed,
      timestamp: new Date().toISOString()
    };
    console.log("Diagnostic Report:", crashReport);
  };

  private handleRetry = async () => {
    // Once a React.lazy promise rejects, React caches that rejected promise;
    // for dynamic-import/chunk failures we must clear stale SW/caches and reload cleanly.
    if (isDynamicImportError(this.state.error)) {
      this.setState({ isRecovering: true });
      await clearStaleServiceWorkersAndCaches();
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, confirmingReset: false, isRecovering: false });
  };

  private handleHardReset = async () => {
    if (!this.state.confirmingReset) {
      this.setState({ confirmingReset: true });
      return;
    }
    this.setState({ isRecovering: true });
    await clearStaleServiceWorkersAndCaches();
    try {
      sessionStorage.clear();
      // Preserve registered gyms fallback while clearing volatile runtime state
      const preservedGyms = localStorage.getItem('ff_registered_gyms_fallback_v1');
      const preservedGymList = localStorage.getItem('gyms_list_evolution');
      const preservedTenantConfig = localStorage.getItem('tenant_gym_config');
      localStorage.clear();
      localStorage.setItem('app_reset_fresh_v2', 'true');
      localStorage.setItem('fitness_future_fresh_reset_v2', 'true');
      if (preservedGyms) localStorage.setItem('ff_registered_gyms_fallback_v1', preservedGyms);
      if (preservedGymList) localStorage.setItem('gyms_list_evolution', preservedGymList);
      if (preservedTenantConfig) localStorage.setItem('tenant_gym_config', preservedTenantConfig);
    } catch {
      // Ignore storage access errors
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const { variant = 'full', fallbackMessage } = this.props;
      const isChunkError = isDynamicImportError(this.state.error);
      const message =
        fallbackMessage ||
        (isChunkError
          ? "A module update was detected. Reload to refresh safely."
          : "Component recovered from a runtime interruption.");
      const errorMsg = this.state.error?.message || "Unknown Error";

      if (variant === 'inline') {
        return (
          <div className="flex items-center gap-2 text-red-400 text-xs py-1 px-2 bg-red-500/10 rounded w-full">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate">{message}</span>
            <button
              onClick={this.handleRetry}
              disabled={this.state.isRecovering}
              className="ml-auto underline text-[10px] text-white shrink-0 cursor-pointer disabled:opacity-50"
            >
              {this.state.isRecovering ? 'Reloading...' : 'Retry'}
            </button>
          </div>
        );
      }

      if (variant === 'compact') {
        return (
          <div className="p-3 my-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex flex-col items-center justify-center text-center w-full h-full min-h-[100px]">
            <AlertTriangle className="w-6 h-6 mb-2 text-red-500 opacity-80" />
            <h3 className="text-xs font-bold text-white mb-1">{message}</h3>
            <button
              onClick={this.handleRetry}
              disabled={this.state.isRecovering}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] mt-2 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw className={`w-3 h-3 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
              {this.state.isRecovering ? 'Refreshing...' : 'Retry Component'}
            </button>
          </div>
        );
      }

      return (
        <div className="p-4 sm:p-6 m-2 sm:m-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-md min-h-[260px]">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 mb-4 text-red-500 opacity-80" />
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">{message}</h3>
          <p className="text-xs sm:text-sm text-red-300/80 mb-6 font-mono max-w-md break-words">
            {errorMsg}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleRetry}
              disabled={this.state.isRecovering}
              className="px-5 py-2 bg-red-500/20 hover:bg-red-500/30 text-rose-300 border border-red-500/50 rounded-full font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${this.state.isRecovering ? 'animate-spin' : ''}`} />
              {this.state.isRecovering ? 'Refreshing Module...' : isChunkError ? 'Reload Module' : 'Retry Module'}
            </button>
            <button
              onClick={this.handleHardReset}
              disabled={this.state.isRecovering}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {this.state.confirmingReset ? 'Confirm Cache Reset' : 'Reset Cache'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
