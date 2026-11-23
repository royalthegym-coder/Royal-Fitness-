import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataProvider';
import { QrCode, Wifi, Shield, RefreshCw, Key, UserCheck, AlertCircle, ScanFace, Volume2, History, Disc } from 'lucide-react';
import Card from '../common/Card';
import { useToast } from '../../hooks/useToast';
import { QRCodeSVG } from 'qrcode.react';
import { logFailedBiometricUnlock } from '../../securityAuditLogger';

export default function GateAccessController({ memberId }: { memberId: number }) {
  const { members } = useData();
  const { addToast } = useToast();
  
  const currentMember = members.find(m => m.id === memberId) || members[0];

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [gateState, setGateState] = useState<'locked' | 'unlocking' | 'open'>('locked');
  const [activeTab, setActiveTab] = useState<'terminal' | 'badge'>('terminal');
  const [scannedName, setScannedName] = useState<string | null>(null);
  
  // Simulated hardware telemetry logs
  const [logs, setLogs] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warning' }[]>([
    { id: '1', msg: 'Gate Terminal initialized. Secure handshake pending.', type: 'info' },
  ]);

  // Handle local biometrics
  const isBiometricRegistered = localStorage.getItem('webauthn_credential_id');
  const isBiometricGateLinked = localStorage.getItem('biometric_gate_link') === 'true';

  // Speech Synthesis for Audio Feedback
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Add system telemetry logs
  const addLog = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [
      { id: Date.now().toString(), msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type },
      ...prev.slice(0, 19)
    ]);
  };

  // Establish live WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    addLog(`Initiating live WebSocket handshake on ${wsUrl}...`, 'info');
    setWsStatus('connecting');

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWsStatus('connected');
      addLog('Secure WebSocket connection established with Entrance Gate hardware.', 'success');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket Client] Incoming Broadcast:', data);

        if (data.event === 'OPEN_GATE') {
          handleOpenGate(data.memberName);
        } else if (data.event === 'GATE_DENIED') {
          addLog(`Access denied: ${data.reason}`, 'warning');
          addToast(data.reason, 'error');
          speak(`Access Denied. ${data.reason}`);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
      addLog('WebSocket link severed. Hardware offline mode activated.', 'warning');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  // Physically rotate/open the turnstile gate
  const handleOpenGate = (name: string) => {
    setGateState('unlocking');
    setScannedName(name);
    addLog(`WebSocket command received: OPEN_GATE for ${name}`, 'success');
    addLog(`Unlocking electromagnetic deadbolts...`, 'info');
    
    setTimeout(() => {
      setGateState('open');
      addLog(`Turnstile barrier released. Access granted.`, 'success');
      speak(`Welcome back ${name}. Access granted.`);
      addToast(`Gate Opened! Welcome back, ${name}.`, 'success');
      
      // Auto close the gate after 5 seconds
      setTimeout(() => {
        setGateState('locked');
        setScannedName(null);
        addLog(`Barrier rotation completed. Electromagnetic deadbolts locked.`, 'info');
      }, 5000);

    }, 1200);
  };

  // Simulate scanning member QR code
  const triggerQrPresentation = (memberIdToScan: number) => {
    const memberObj = members.find(m => m.id === memberIdToScan);
    if (!memberObj) {
      addLog('Presented code invalid or expired.', 'warning');
      return;
    }

    addLog(`QR code payload scanned: "MEMBER_QR_V2#${memberObj.id}"`, 'info');
    
    // Check if biometric link is required and local biometrics match
    if (isBiometricGateLinked && !isBiometricRegistered) {
      addLog('QR Code rejected: Local Biometric Verification Required but not registered on this device.', 'warning');
      logFailedBiometricUnlock({
        method: 'Gate Turnstile Biometric Link QR Check',
        errorMessage: 'Biometric verification required on device but not registered',
        targetView: 'gate_access_controller',
        targetUserName: memberObj.name,
        deviceLabel: 'Entrance Gate Turnstile 01 Barrier',
        severity: 'HIGH'
      }).catch(console.error);

      if (ws) {
        ws.send(JSON.stringify({ event: 'GATE_DENIED', reason: 'Biometric verification required.' }));
      }
      return;
    }

    // Send scanner transaction via WebSocket to the server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'OPEN_GATE',
        memberId: memberObj.id,
        memberName: memberObj.name
      }));
    } else {
      // Fallback if WebSocket is offline
      addLog('WebSocket link offline. Activating edge routing protocols.', 'warning');
      handleOpenGate(memberObj.name);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="gate-access-root">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Shield className="text-indigo-400 w-10 h-10" /> 
            Smart Gate Controller
          </h1>
          <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">
            Real-time WebSocket Turnstile Gating & QR Verification
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-black/40 border border-white/5 p-1 rounded-2xl flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('terminal')} 
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'terminal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Gate Terminal
          </button>
          <button 
            onClick={() => setActiveTab('badge')} 
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'badge' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            My QR Badge
          </button>
        </div>
      </div>

      {/* Connection Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
        wsStatus === 'connected' 
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
          : wsStatus === 'connecting'
          ? 'bg-amber-950/20 border-amber-500/30 text-amber-400'
          : 'bg-red-950/20 border-red-500/30 text-red-400'
      }`}>
        <div className="flex items-center gap-3">
          <Wifi className={`w-5 h-5 ${wsStatus === 'connected' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">
            WebSocket Status: <strong className="underline">{wsStatus.toUpperCase()}</strong>
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
          Port 3000 Ingress
        </span>
      </div>

      {activeTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Turnstile Physical Simulation Card */}
          <Card className="lg:col-span-7 bg-black/40 border-white/5 p-8 rounded-[3.5rem] flex flex-col justify-between h-[450px] relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Turnstile 01 Barrier</h3>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">Secure Gym Entrance Portal</p>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${
                gateState === 'open' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : gateState === 'unlocking'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <Disc className={`w-3.5 h-3.5 ${gateState === 'unlocking' ? 'animate-spin' : ''}`} />
                {gateState}
              </div>
            </div>

            {/* Visual Gate Simulator */}
            <div className="flex flex-col items-center justify-center my-6 relative flex-1">
              {/* LED Ring Glow */}
              <div className={`absolute w-52 h-52 rounded-full border-4 border-dashed blur-sm transition-all duration-1000 ${
                gateState === 'open' 
                  ? 'border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]' 
                  : gateState === 'unlocking'
                  ? 'border-amber-500/40 animate-spin-slow'
                  : 'border-red-500/40'
              }`}></div>

              {/* Gate Turnstile Post */}
              <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black border border-white/10 rounded-full flex items-center justify-center z-10 relative">
                <div className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-colors duration-500 ${
                  gateState === 'open' ? 'border-emerald-400 text-emerald-400' : 'border-red-400 text-red-400'
                }`}>
                  <Shield className="w-8 h-8" />
                </div>

                {/* Left Metallic Turnstile arm */}
                <div className={`absolute top-1/2 left-12 w-32 h-3 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full origin-left transition-all duration-1000 ${
                  gateState === 'open' ? 'rotate-90 -translate-y-8 opacity-0' : 'rotate-0'
                }`}></div>

                {/* Right Metallic Turnstile arm */}
                <div className={`absolute top-1/2 right-12 w-32 h-3 bg-gradient-to-l from-gray-400 to-gray-600 rounded-full origin-right transition-all duration-1000 ${
                  gateState === 'open' ? '-rotate-90 -translate-y-8 opacity-0' : 'rotate-0'
                }`}></div>
              </div>

              {gateState === 'open' && scannedName && (
                <div className="absolute bottom-4 text-center animate-fade-in z-10">
                  <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest animate-pulse">Access Granted</p>
                  <p className="text-xl font-black text-white italic uppercase tracking-tighter mt-1">{scannedName}</p>
                </div>
              )}
            </div>

            {/* Trigger Simulation Scanner Button */}
            <div className="flex flex-wrap gap-3 z-10">
              <button 
                onClick={() => triggerQrPresentation(memberId)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-4 rounded-2xl uppercase tracking-widest text-xs transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] cursor-pointer"
              >
                <QrCode className="w-4 h-4" /> Present My QR Badge
              </button>
              <button 
                onClick={() => triggerQrPresentation(currentMember?.id || members[0]?.id || 1)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black py-4 px-5 rounded-2xl uppercase tracking-widest text-xs transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
              >
                <QrCode className="w-4 h-4" /> Test QR Scanner
              </button>
            </div>
          </Card>

          {/* Telemetry Hardware Log Terminal */}
          <Card className="lg:col-span-5 bg-black border border-white/5 p-6 rounded-[2.5rem] h-[450px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-gray-400 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" /> Gate Telemetry Logs
              </h3>
              <p className="text-[9px] text-gray-500 uppercase font-mono mt-1 tracking-widest border-b border-white/5 pb-2">Active scanner events and WebSocket streams</p>
            </div>

            {/* Logs Area */}
            <div className="flex-1 my-4 overflow-y-auto font-mono text-[10px] space-y-2 pr-2 custom-scrollbar text-left">
              {logs.map((log) => (
                <div key={log.id} className={`p-2 rounded-lg border leading-relaxed ${
                  log.type === 'success' 
                    ? 'bg-emerald-950/20 border-emerald-500/10 text-emerald-400' 
                    : log.type === 'warning'
                    ? 'bg-red-950/20 border-red-500/10 text-red-400'
                    : 'bg-white/5 border-white/5 text-gray-400'
                }`}>
                  {log.msg}
                </div>
              ))}
            </div>

            {/* Quick simulator scan dropdown */}
            <div className="pt-4 border-t border-white/5">
              <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2 font-bold">Simulate Scanning Other Members</label>
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    triggerQrPresentation(Number(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 uppercase font-mono font-bold"
              >
                <option value="">-- Choose Member Profile --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} (#{m.id})</option>
                ))}
              </select>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'badge' && (
        <Card className="bg-black/40 border-white/5 p-8 max-w-md mx-auto rounded-[3.5rem] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
          
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">My Secure Entrance Code</h3>
          <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">Present this QR code to the entrance lobby camera</p>

          {/* Secure QR Code container */}
          <div className="bg-white p-6 rounded-[2.5rem] inline-block my-8 relative group border-4 border-indigo-500/20">
            <QRCodeSVG 
              value={`MEMBER_QR_V2#${currentMember.id}`} 
              size={180} 
              fgColor="#000000" 
              bgColor="#ffffff"
              level="H"
            />
          </div>

          <div className="space-y-4 text-left font-mono text-xs bg-black/60 border border-white/5 p-5 rounded-2xl">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500 uppercase font-bold text-[10px]">Holder Name</span>
              <span className="text-white font-bold">{currentMember.name}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500 uppercase font-bold text-[10px]">Credential Version</span>
              <span className="text-white font-bold">QR_V2_ECDSA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase font-bold text-[10px]">Biometric Security</span>
              <span className={`font-black uppercase text-[10px] ${isBiometricGateLinked ? 'text-emerald-400' : 'text-amber-500'}`}>
                {isBiometricGateLinked ? 'Linked & Enabled' : 'Not Linked'}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
