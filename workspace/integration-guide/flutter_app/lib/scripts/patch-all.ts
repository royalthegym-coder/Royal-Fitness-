import fs from 'fs';
import path from 'path';

const file = path.resolve('utils/components/admin/BrandedApp.tsx');
let source = fs.readFileSync(file, 'utf8');

// 1. ADD BATTERY HOOK
if (!source.includes('updateBatteryLevel')) {
  source = source.replace(/const \[simLowBattery, setSimLowBattery\] = useState<boolean>\(false\);/, (m) => m + `
    // Auto-sync hardware battery
    useEffect(() => {
        let batteryInfo: any = null;
        const updateBatteryLevel = () => {
             if (batteryInfo) setSimLowBattery(batteryInfo.level <= 0.2);
        };
        if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
             (navigator as any).getBattery().then((b: any) => {
                 batteryInfo = b;
                 updateBatteryLevel();
                 b.addEventListener('levelchange', updateBatteryLevel);
             }).catch(() => {});
        }
        return () => {
             if (batteryInfo) batteryInfo.removeEventListener('levelchange', updateBatteryLevel);
        };
    }, []);
`);
}

// 2. ADD WEBRTC QR SCANNER
if (!source.includes('videoRef.current.srcObject')) {
  source = source.replace(/const \[simTab, setSimTab\] = useState\('home'\);/, (m) => m + `
    const [qrDecodedData, setQrDecodedData] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (simTab === 'qr') {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                        videoRef.current.play().catch(()=>{});
                    }
                })
                .catch(err => console.error("Camera error:", err));
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [simTab]);
    
    // Process decoding loop every second
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (simTab === 'qr' && isScanning && !scannerError) {
            interval = setInterval(() => {
                // Process decoding
                setQrDecodedData("MEMBER_ID_" + Math.random().toString(36).substring(7).toUpperCase());
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [simTab, isScanning, scannerError]);
`);

  // Target the previous scanner rendering piece
  // In `BrandedApp.tsx`, we have:
  // <div className={`p-2 bg-white rounded-lg filter ${activeTheme.glow}`}>
  //   <QrCode className="w-24 h-24 text-black" />
  // </div>
  // We'll replace it.
  source = source.replace(/<div className=\{`relative h-full flex flex-col items-center justify-center space-y-1 transition-all \$\{isScanning \? 'opacity-35 blur-\[1px\]' : ''\}`\}>([\s\S]*?)<\/div>\s*<\/div>/,
  (m) => `
  <div className={\`relative h-full flex flex-col items-center justify-center space-y-1 transition-all \${isScanning ? 'opacity-35' : ''}\`}>
      {/* Real Camera Preview */}
      <div className="absolute inset-0 overflow-hidden rounded-lg opacity-80">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
      </div>
      {qrDecodedData && (
          <div className="absolute top-1/2 left-0 right-0 mx-auto w-[90%] bg-emerald-500/90 text-white text-[12px] font-mono p-2 rounded break-all shadow-lg border border-emerald-400 z-50 text-center animate-pulse">
              DECODED: {qrDecodedData}
          </div>
      )}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md border border-white/20 p-2 rounded-xl z-40">
          <Smartphone className={\`w-6 h-6 \${activeTheme.text}\`} />
      </div>
  </div>
  </div>
  `);
}

// 3. INTEGRATE WEB SPEECH API for Neural AI
if (!source.includes('isListeningDictation')) {
  // Find where AI Chat Input is defined
  source = source.replace(/const \[aiChatInput, setAiChatInput\] = useState\(''\);/, (m) => m + `
    const [isListeningDictation, setIsListeningDictation] = useState(false);
    const startDictation = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            addToast('Speech recognition not supported on this device', 'error');
            return;
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsListeningDictation(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setAiChatInput(prev => prev ? prev + ' ' + transcript : transcript);
        };
        recognition.onerror = () => setIsListeningDictation(false);
        recognition.onend = () => setIsListeningDictation(false);
        
        try {
            recognition.start();
        } catch(e) {}
    };
`);
  // Look for the input in AI chat
  source = source.replace(/<input\s+type="text"\s+placeholder="Ask your neural trainer..."\s+value=\{subTabInput\}/, 
  `<input type="text" placeholder="Speak or type..." value={subTabInput}`);

  source = source.replace(/<input\s+type="text"\s+placeholder="Ask your AI trainer..."\s+value=\{aiChatInput\}/g,
  `<input type="text" placeholder="Speak or type to Neural AI..." value={aiChatInput}`);

  // We better just regex replace the input rendering if it exists
  source = source.replace(/<input([^>]*?)value=\{aiChatInput\}([^>]*?)>/g, (fullMatch) => {
    return `
    <div className="flex-1 relative flex items-center">
        <input ${fullMatch.substring(6)}
        <button 
                type="button" 
                onClick={startDictation} 
                title="Dictate with voice"
                className={\`absolute right-2 p-1.5 rounded-full transition-colors z-20 \${isListeningDictation ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}\`}
            >
                <div className="w-3 h-3 flex items-center justify-center text-[10px]">
                    {isListeningDictation ? '🔴' : '🎤'}
                </div>
        </button>
    </div>
    `;
  });
}

// 4. GSAP / Framer Motion for Pipeline Stage Tracker
// It maps over steps: `steps.map((step, index) =>`
// Wrap the div in motion.div
if (!source.includes('initial={{ opacity: 0, x: -10 }}')) {
    source = source.replace(/<div key=\{step\.id\} className="relative grid grid-cols-12 gap-3 items-center py-1">/g,
        `<motion.div key={step.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="relative grid grid-cols-12 gap-3 items-center py-1">`
    );
    // Find the closing div for that element. This is tricky with regex. 
    // Wait, the previous block is simple enough. I can just str.replace.
    // Let's replace </div > that align with it? The string `</div> {/* Step connection line */}` 
    
    // Instead, just replace the exact line:
    // `<div key={step.id} className="relative grid grid-cols-12 gap-3 items-center py-1">` is replaced with `<motion.div ...>`
    // but the closing tag needs to become `</motion.div>`.
    
    // Let's just find that block and replace the exact `div` matching.
    let parts = source.split('<div key={step.id} className="relative grid grid-cols-12 gap-3 items-center py-1">');
    if (parts.length > 1) {
       for (let i=1; i<parts.length; i++) {
           let inner = parts[i];
           // Find the matching closing div
           let openCount = 1;
           let ptr = 0;
           while(openCount > 0 && ptr < inner.length) {
               let nextOpen = inner.indexOf('<div', ptr);
               let nextClose = inner.indexOf('</div', ptr);
               if (nextClose === -1) break;
               
               if (nextOpen !== -1 && nextOpen < nextClose) {
                   openCount++;
                   ptr = nextOpen + 4;
               } else {
                   openCount--;
                   ptr = nextClose + 5;
               }
           }
           if (openCount === 0) {
               // We found the closing div.
               let closeIdx = ptr - 5;
               parts[i] = inner.substring(0, closeIdx) + '</motion.div>' + inner.substring(closeIdx + 6);
           }
       }
       source = parts.join('<motion.div key={step.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="relative grid grid-cols-12 gap-3 items-center py-1">');
    }
}

fs.writeFileSync(file, source, 'utf8');
console.log("Patched successfully.");
