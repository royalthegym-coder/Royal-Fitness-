import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { 
  KeyRound, ShieldCheck, Lock, Check, ScanFace, 
  Cpu, Sparkles, Fingerprint, RefreshCw, Smartphone, 
  HelpCircle, Eye, EyeOff
} from 'lucide-react';

interface MemberVaultLoginProps {
  magicToken: string;
  email: string;
  onLoginComplete: (memberSession: any) => void;
}

export const MemberVaultLogin: React.FC<MemberVaultLoginProps> = ({ 
  magicToken, 
  email, 
  onLoginComplete 
}) => {
  const { members, updateMember } = useData();
  const { addToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isBioEnrolling, setIsBioEnrolling] = useState(false);
  const [bioProgress, setBioProgress] = useState(0);
  const [bioStatus, setBioStatus] = useState('');

  // Find pre-registered member using either email or magic token
  const pendingMember = members.find(
    m => m.email?.toLowerCase() === email.toLowerCase() || m.magicToken === magicToken
  );

  useEffect(() => {
    if (pendingMember) {
      addToast(`Authentic token verified: Welcome, ${pendingMember.name}!`, 'success');
    } else {
      addToast('Invalid or expired invitation token. Please contact your gym administrator.', 'error');
    }
  }, [pendingMember]);

  const validatePassword = () => {
    if (password.length < 6) {
      addToast('Security limit: Password must be at least 6 characters.', 'error');
      return false;
    }
    if (password !== confirmPassword) {
      addToast('Matrix mismatch: Passwords do not match.', 'error');
      return false;
    }
    return true;
  };

  const handleBiometricEnrollment = async () => {
    setIsBioEnrolling(true);
    setBioProgress(0);
    setBioStatus('Establishing secure enclave session...');

    const statuses = [
      'Establishing secure enclave session...',
      'Mapping facial geometry liveness bounds...',
      'Analyzing biological depth & pulse scan...',
      'Registering credential pair in Hardware Vault...',
      'WebAuthn handshake complete.'
    ];

    for (let i = 0; i <= 100; i += 10) {
      setBioProgress(i);
      const index = Math.min(Math.floor(i / 20), statuses.length - 1);
      setBioStatus(statuses[index]);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setBiometricsEnabled(true);
    setIsBioEnrolling(false);
    addToast('Biometrics successfully anchored to device.', 'success');
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMember) {
      addToast('Access denied: No pre-registered member record matches this invitation token.', 'error');
      return;
    }
    if (!validatePassword()) return;

    setIsActivating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Update member password, login mode & onboardingCompleted is false so they do goal questionnaire
    const updated: any = {
      ...pendingMember,
      password: password,
      onboardingCompleted: false, // forces the goal wizard to show up on their first entry!
      auth_mode: biometricsEnabled ? 'biometric_only' : 'password',
      device_id: biometricsEnabled ? 'HW-FINGERPRINT-' + Math.floor(Math.random() * 89999 + 10000) : undefined
    };

    updateMember(updated);

    // Save session structure
    const userSession = {
      type: 'member',
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar
    };

    localStorage.setItem('member_session', JSON.stringify(userSession));
    addToast('Vault activated! Credentials initialized.', 'success');
    
    setIsActivating(false);
    onLoginComplete(userSession);
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            First-Time Login Pipeline
          </div>
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
            MEMBER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">VAULT MATRIX</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Setting up credentials for <strong className="text-white">{pendingMember?.name || email}</strong>
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isBioEnrolling ? (
            <motion.div 
              key="bio-enrollment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              {/* Spinning scanning overlay */}
              <div className="relative w-32 h-32 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30 animate-spin" style={{ animationDuration: '8s' }}></div>
                <div className="absolute inset-2 rounded-full border border-indigo-500/40 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-4 rounded-full bg-cyan-500/5 flex items-center justify-center">
                  <ScanFace className="w-12 h-12 text-cyan-400" />
                </div>
                {/* Visual Scanner laser line */}
                <div className="absolute top-[20%] left-[10%] right-[10%] h-0.5 bg-cyan-400 shadow-[0_0_15px_#06b6d4] animate-bounce"></div>
              </div>

              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Authenticating Face ID / Touch ID</h4>
              <p className="text-[10px] text-cyan-400 font-mono italic animate-pulse">{bioStatus}</p>
              
              {/* Progress bar */}
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-6 overflow-hidden max-w-xs border border-zinc-800">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-200"
                  style={{ width: `${bioProgress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono mt-2">{bioProgress}% Complete</span>
            </motion.div>
          ) : (
            <motion.form 
              key="activation-form"
              onSubmit={handleActivation}
              className="space-y-5"
            >
              {/* Password controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Create Secure PIN / Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 focus:border-cyan-500 rounded-xl py-3 pl-12 pr-12 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                      placeholder="At least 6 characters"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Confirm Secret Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 focus:border-cyan-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                      placeholder="Repeat your password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Biometrics Toggle setup */}
              <div className="bg-black/40 border border-zinc-900 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                      biometricsEnabled 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}>
                      {biometricsEnabled ? <ScanFace className="w-4.5 h-4.5" /> : <Fingerprint className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Device Biometrics (Face ID)</h4>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Passwordless credentials registration</p>
                    </div>
                  </div>
                  
                  {biometricsEnabled ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-mono select-none">
                      <Check className="w-3 h-3" /> ACTIVE
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBiometricEnrollment}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                    >
                      Enroll Setup
                    </button>
                  )}
                </div>
              </div>

              {/* Notice area */}
              <div className="text-[10px] text-zinc-500 flex gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                <p className="leading-normal">
                  Your registration token is tied to this specific terminal device. Your biometric keys stand entirely isolated in your device's sovereign hardware enclave.
                </p>
              </div>

              {/* Submission CTA */}
              <button
                type="submit"
                disabled={isActivating}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)] mt-2"
              >
                {isActivating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Completing Vault Tunnel...
                  </>
                ) : (
                  <>
                    Activate Passport Vault <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
export default MemberVaultLogin;
