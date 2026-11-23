import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  UserCheck,
  Calendar,
  Fingerprint,
  QrCode,
  ScanFace,
  Camera,
  CameraOff,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { sendWhatsAppAttendanceMessage } from '../../../lib/whatsapp';
import MemberCheckIn from '../MemberCheckIn';
import { authenticateBiometricDetailed, registerBiometricDetailed } from '../../biometrics';
import { persistFirestoreDocument } from '../../../src/backend/FitnessFutureService';
import { useAutomationStore, bi } from '../../store/useAutomationStore';

type AttendanceTab = 'face_geometry' | 'qr_gate' | 'passkey' | 'manual_desk';

interface FaceGeometryProfile {
  memberId: number;
  memberName: string;
  vector: number[]; // Compact 8-value normalized geometric ratio vector
  enrolledAt: string;
}

const FACE_SIG_STORAGE_KEY = 'ff_face_geometry_profiles_v1';

function loadLocalFaceProfiles(): Record<number, FaceGeometryProfile> {
  try {
    const raw = localStorage.getItem(FACE_SIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage errors
  }
  return {};
}

function saveLocalFaceProfiles(profiles: Record<number, FaceGeometryProfile>) {
  try {
    localStorage.setItem(FACE_SIG_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // ignore quota errors
  }
}

/**
 * Extracts a compact, lighting-normalized 8-dimensional geometric ratio signature
 * from the central face ROI of a live HTMLVideoElement frame (zero raw images persisted).
 */
function extractGeometricSignatureFromVideo(video: HTMLVideoElement): number[] | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Crop centered square portrait region (60% of shortest side)
  const cropSide = Math.min(video.videoWidth, video.videoHeight) * 0.6;
  const sx = (video.videoWidth - cropSide) / 2;
  const sy = (video.videoHeight - cropSide) / 2;
  ctx.drawImage(video, sx, sy, cropSide, cropSide, 0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size).data;

  // Compute normalized mean luminance across 8 anatomical grid zones (forehead, eyes L/R, nose, cheeks L/R, mouth, jaw)
  const zones: [number, number, number, number][] = [
    [16, 4, 32, 12],   // forehead
    [10, 16, 20, 12],  // left eye region
    [34, 16, 20, 12],  // right eye region
    [24, 24, 16, 16],  // nose bridge
    [8, 30, 16, 14],   // left cheek
    [40, 30, 16, 14],  // right cheek
    [18, 42, 28, 10],  // mouth band
    [14, 52, 36, 10],  // chin/jawline
  ];

  const rawMeans = zones.map(([x0, y0, w, h]) => {
    let sum = 0;
    let count = 0;
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const idx = (y * size + x) * 4;
        const luma = 0.299 * img[idx] + 0.587 * img[idx + 1] + 0.114 * img[idx + 2];
        sum += luma;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  });

  // Check if camera frame is completely dark / covered
  const avg = rawMeans.reduce((a, b) => a + b, 0) / rawMeans.length;
  if (avg < 12) return null;

  // Normalize to zero-mean unit-variance ratio vector (lighting invariant)
  const variance =
    rawMeans.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / rawMeans.length;
  const std = Math.sqrt(variance) || 1;
  return rawMeans.map((v) => Number(((v - avg) / std).toFixed(4)));
}

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum / a.length);
}

const AdminAttendance: React.FC = () => {
  const { members, attendanceRecords, markAttendance } = useData();
  const { addToast } = useToast();
  const { language, addLog, settings, pausedChannels } = useAutomationStore();

  const [activeTab, setActiveTab] = useState<AttendanceTab>('face_geometry');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Face Geometry Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedEnrollMemberId, setSelectedEnrollMemberId] = useState<number>(
    members[0]?.id || 0
  );
  const [faceProfiles, setFaceProfiles] = useState<Record<number, FaceGeometryProfile>>(
    loadLocalFaceProfiles
  );
  const [scanStatus, setScanStatus] = useState<string>('');
  const [isScanningFace, setIsScanningFace] = useState(false);

  // WebAuthn Passkey Check-In State
  const [passkeyMemberId, setPasskeyMemberId] = useState<number>(members[0]?.id || 0);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState<string>('');

  useEffect(() => {
    if (members.length > 0 && !selectedEnrollMemberId) {
      setSelectedEnrollMemberId(members[0].id);
      setPasskeyMemberId(members[0].id);
    }
  }, [members, selectedEnrollMemberId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (activeTab !== 'face_geometry') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        bi(
          language,
          'Camera API unavailable in this browser. Use Live QR Gate or WebAuthn Passkey tab.',
          'इस ब्राउज़र में कैमरा उपलब्ध नहीं है। कृपया QR गेट या पासकी टैब का उपयोग करें।'
        )
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanStatus(
        bi(
          language,
          'Live optical geometry feed active. Position face inside frame.',
          'लाइव फेस ज्योमेट्री कैमरा सक्रिय है। चेहरा फ्रेम के बीच में रखें।'
        )
      );
    } catch (err: any) {
      setCameraError(
        bi(
          language,
          `Camera access denied or unavailable (${err?.name || 'Error'}). Switch to QR Gate or Passkey.`,
          `कैमरा अनुमति नहीं मिली (${err?.name || 'Error'})। QR गेट या पासकी का उपयोग करें।`
        )
      );
    }
  };

  const handleMarkAttendance = useCallback(
    async (
      memberId: number,
      status: 'Present' | 'Absent' | 'Late',
      methodLabel: 'FACE_GEOMETRY' | 'QR_GATE' | 'WEBAUTHN_PASSKEY' | 'MANUAL'
    ) => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const mappedMethod: 'Manual' | 'QR' | 'Auto' =
        methodLabel === 'MANUAL' ? 'Manual' : methodLabel === 'QR_GATE' ? 'QR' : 'Auto';

      markAttendance({
        id: `ATT_${Date.now()}_${memberId}`,
        memberId,
        date: selectedDate,
        time,
        status,
        method: mappedMethod,
      });

      const member = members.find((m) => m.id === memberId);
      if (member && status === 'Present') {
        if (settings.whatsappAutoSend && !pausedChannels.WHATSAPP) {
          sendWhatsAppAttendanceMessage(member, time);
        }
        await addLog({
          channel: 'ATTENDANCE',
          target: `${member.name} (${member.phone})`,
          summary: `Attendance ${status} via ${methodLabel} at ${time}`,
          messageBody: `Checked in ${member.name} on ${selectedDate} (${time}) using ${methodLabel}.`,
          status: 'AUTO_SENT',
          providerStatus: methodLabel,
        });
      }

      addToast(
        `${member?.name || 'Member'} marked ${status} (${methodLabel})`,
        'success'
      );
    },
    [
      markAttendance,
      selectedDate,
      members,
      settings.whatsappAutoSend,
      pausedChannels.WHATSAPP,
      addLog,
      addToast,
    ]
  );

  // Enroll Member Face Geometry Signature (stored cleanly in Firestore & local mirror)
  const handleEnrollFaceGeometry = async () => {
    if (!cameraActive || !videoRef.current) {
      addToast(bi(language, 'Start the camera first to enroll geometry.', 'पहले कैमरा शुरू करें।'), 'error');
      return;
    }
    const targetMember = members.find((m) => m.id === selectedEnrollMemberId);
    if (!targetMember) {
      addToast(bi(language, 'Select a member to enroll.', 'कृपया मेंबर चुनें।'), 'error');
      return;
    }

    const vector = extractGeometricSignatureFromVideo(videoRef.current);
    if (!vector) {
      addToast(
        bi(
          language,
          'Frame too dark or face not aligned. Ensure good lighting and retry.',
          'रोशनी कम है या चेहरा स्पष्ट नहीं है। कृपया दोबारा प्रयास करें।'
        ),
        'error'
      );
      return;
    }

    const profile: FaceGeometryProfile = {
      memberId: targetMember.id,
      memberName: targetMember.name,
      vector,
      enrolledAt: new Date().toISOString(),
    };

    const nextProfiles = { ...faceProfiles, [targetMember.id]: profile };
    setFaceProfiles(nextProfiles);
    saveLocalFaceProfiles(nextProfiles);

    // Persist compact geometric signature to Firestore member document (never raw video/image)
    await persistFirestoreDocument('members', String(targetMember.id), {
      faceGeometrySignature: vector,
      faceGeometryEnrolledAt: profile.enrolledAt,
    });

    setScanStatus(
      bi(
        language,
        `Face geometry enrolled for ${targetMember.name} (8-point normalized ratio signature saved).`,
        `${targetMember.name} का फेस ज्योमेट्री सिग्नेचर सुरक्षित हो गया है।`
      )
    );
    addToast(
      bi(language, `Enrolled Face Geometry for ${targetMember.name}`, `${targetMember.name} एनरोल हो गए।`),
      'success'
    );
  };

  // Scan Live Camera Frame & Match Against Enrolled Member Signatures
  const handleVerifyFaceGeometry = async () => {
    if (!cameraActive || !videoRef.current) {
      addToast(bi(language, 'Start camera before scanning.', 'स्कैन करने से पहले कैमरा शुरू करें।'), 'error');
      return;
    }
    const enrolledList = Object.values(faceProfiles);
    if (enrolledList.length === 0) {
      setScanStatus(
        bi(
          language,
          'No members enrolled yet. Select a member and click "Enroll Face Geometry" first.',
          'अभी कोई मेंबर एनरोल नहीं है। पहले किसी मेंबर का फेस ज्योमेट्री एनरोल करें।'
        )
      );
      addToast(bi(language, 'Enroll at least one member first.', 'पहले एक मेंबर एनरोल करें।'), 'info');
      return;
    }

    setIsScanningFace(true);
    try {
      const liveVector = extractGeometricSignatureFromVideo(videoRef.current);
      if (!liveVector) {
        setScanStatus(
          bi(language, 'Unable to read clear geometry—check lighting and face position.', 'चेहरा स्पष्ट नहीं है—रोशनी जांचें।')
        );
        return;
      }

      let bestMatch: FaceGeometryProfile | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const prof of enrolledList) {
        const dist = euclideanDistance(liveVector, prof.vector);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestMatch = prof;
        }
      }

      const MATCH_THRESHOLD = 0.85;
      if (bestMatch && bestDistance <= MATCH_THRESHOLD) {
        const confidence = Math.max(60, Math.min(99, Math.round((1 - bestDistance / 1.6) * 100)));
        setScanStatus(
          bi(
            language,
            `Verified: ${bestMatch.memberName} · Geometric Match ${confidence}% (d=${bestDistance.toFixed(2)})`,
            `सत्यापित: ${bestMatch.memberName} · ज्योमेट्रिक मैच ${confidence}%`
          )
        );
        await handleMarkAttendance(bestMatch.memberId, 'Present', 'FACE_GEOMETRY');
      } else {
        setScanStatus(
          bi(
            language,
            `No enrolled match within threshold (nearest d=${bestDistance.toFixed(2)}). Re-align or use QR / Passkey.`,
            `कोई मैच नहीं मिला। कृपया दोबारा प्रयास करें या QR / पासकी उपयोग करें।`
          )
        );
        addToast(bi(language, 'Face geometry did not match an enrolled member.', 'चेहरा किसी एनरोल मेंबर से मैच नहीं हुआ।'), 'error');
      }
    } finally {
      setIsScanningFace(false);
    }
  };

  // Real WebAuthn Device Passkey Verification Check-In
  const handlePasskeyCheckIn = async (mode: 'verify' | 'enroll') => {
    const member = members.find((m) => m.id === passkeyMemberId);
    if (!member) {
      addToast(bi(language, 'Select a member first.', 'कृपया मेंबर चुनें।'), 'error');
      return;
    }
    setPasskeyBusy(true);
    setPasskeyStatus('');
    try {
      const result =
        mode === 'enroll'
          ? await registerBiometricDetailed(member.email || `member_${member.id}@fitnessfuture.in`, member.name)
          : await authenticateBiometricDetailed();

      if (result.success) {
        setPasskeyStatus(
          `${mode === 'enroll' ? 'Passkey Enrolled' : 'Passkey Verified'} · ${result.method} · ${result.credentialId.slice(0, 14)}...`
        );
        if (mode === 'verify') {
          await handleMarkAttendance(member.id, 'Present', 'WEBAUTHN_PASSKEY');
        } else {
          addToast(`Device Passkey registered for ${member.name}`, 'success');
        }
      } else {
        setPasskeyStatus(result.errorMessage || 'Biometric verification cancelled.');
        addToast(result.errorMessage || 'Passkey verification failed', 'error');
      }
    } catch (err: any) {
      setPasskeyStatus(err?.message || 'Passkey error');
      addToast(err?.message || 'Passkey error', 'error');
    } finally {
      setPasskeyBusy(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || String(m.phone || '').includes(q)
    );
  }, [members, searchTerm]);

  const getAttendanceStatus = (memberId: number) =>
    attendanceRecords.find((r) => r.memberId === memberId && r.date === selectedDate);

  const stats = useMemo(() => {
    const todayRecords = attendanceRecords.filter((r) => r.date === selectedDate);
    return {
      present: todayRecords.filter((r) => r.status === 'Present').length,
      absent: todayRecords.filter((r) => r.status === 'Absent').length,
      late: todayRecords.filter((r) => r.status === 'Late').length,
      enrolledFaces: Object.keys(faceProfiles).length,
      total: members.length,
    };
  }, [attendanceRecords, selectedDate, members, faceProfiles]);

  return (
    <div className="space-y-6 pb-24 text-[#F8FAFC]">
      {/* HEADER */}
      <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400">
            {bi(
              language,
              'MODULE #14 · HYBRID GEOMETRIC ATTENDANCE DESK',
              'मॉड्यूल #14 · हाइब्रिड ज्योमेट्रिक अटेंडेंस डेस्क'
            )}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1"
            style={{ fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif" }}
          >
            {bi(
              language,
              'Face Geometry · QR Gate · WebAuthn Passkey',
              'फेस ज्योमेट्री · QR गेट · बायोमेट्रिक पासकी'
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 w-4 h-4" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#09090B] border border-white/[0.12] rounded-md pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: bi(language, 'Total Members', 'कुल मेंबर्स'), val: stats.total, color: 'text-white' },
          { label: bi(language, 'Present', 'उपस्थित'), val: stats.present, color: 'text-emerald-400' },
          { label: bi(language, 'Late', 'विलंबित'), val: stats.late, color: 'text-amber-400' },
          { label: bi(language, 'Absent', 'अनुपस्थित'), val: stats.absent, color: 'text-red-400' },
          {
            label: bi(language, 'Face Geometry Enrolled', 'फेस ज्योमेट्री एनरोल्ड'),
            val: stats.enrolledFaces,
            color: 'text-amber-300',
          },
        ].map((item) => (
          <div key={item.label} className="bg-[#111114] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${item.color}`}>
              {item.val}
            </p>
          </div>
        ))}
      </div>

      {/* HYBRID MODE TABS */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
        {(
          [
            { id: 'face_geometry', icon: ScanFace, en: 'Face Geometry Camera', hi: 'फेस ज्योमेट्री कैमरा' },
            { id: 'qr_gate', icon: QrCode, en: 'Live QR Gate Scan', hi: 'लाइव QR गेट स्कैन' },
            { id: 'passkey', icon: Fingerprint, en: 'WebAuthn Passkey', hi: 'बायोमेट्रिक पासकी' },
            { id: 'manual_desk', icon: UserCheck, en: 'Manual Desk Register', hi: 'मैनुअल रजिस्टर' },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-[#111114] text-slate-300 border border-white/[0.08] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{bi(language, tab.en, tab.hi)}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FACE GEOMETRY CAMERA */}
      {activeTab === 'face_geometry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-amber-400" />
                <span>{bi(language, 'Optical Face Geometry Gate', 'ऑप्टिकल फेस ज्योमेट्री गेट')}</span>
              </h2>
              {cameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-semibold cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>{bi(language, 'Stop Camera', 'कैमरा बंद करें')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{bi(language, 'Start Camera', 'कैमरा शुरू करें')}</span>
                </button>
              )}
            </div>

            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#09090B] border border-white/[0.08] flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              {cameraActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-56 rounded-2xl border-2 border-amber-400/70" />
                </div>
              )}
              {!cameraActive && (
                <div className="text-center p-6 space-y-2">
                  <ScanFace className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">
                    {bi(
                      language,
                      'Click "Start Camera" to activate live face geometry capture & attendance matching.',
                      'लाइव फेस ज्योमेट्री स्कैन शुरू करने के लिए "कैमरा शुरू करें" पर क्लिक करें।'
                    )}
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {scanStatus && (
              <div className="p-3.5 rounded-md bg-[#09090B] border border-amber-500/30 text-xs font-mono text-amber-300">
                {scanStatus}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-amber-400">
                {bi(language, 'Enroll & Match Controls', 'एनरोलमेंट और वेरिफिकेशन')}
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  {bi(language, 'Select Member for Enrollment', 'एनरोलमेंट के लिए मेंबर चुनें')}
                </label>
                <select
                  value={selectedEnrollMemberId}
                  onChange={(e) => setSelectedEnrollMemberId(Number(e.target.value))}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white"
                >
                  {members.length === 0 ? (
                    <option value={0}>No registered members yet</option>
                  ) : (
                    members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {faceProfiles[m.id] ? '✓ Enrolled' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  disabled={!cameraActive || members.length === 0}
                  onClick={() => void handleEnrollFaceGeometry()}
                  className="w-full py-3 px-4 rounded-md bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-50 border border-white/[0.12] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {bi(language, '1. Enroll Member Face Geometry', '1. मेंबर फेस ज्योमेट्री एनरोल करें')}
                </button>
                <button
                  type="button"
                  disabled={!cameraActive || isScanningFace}
                  onClick={() => void handleVerifyFaceGeometry()}
                  className="w-full py-3.5 px-4 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isScanningFace ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>
                    {bi(
                      language,
                      '2. Scan Face & Mark Attendance',
                      '2. चेहरा स्कैन कर अटेंडेंस लगाएँ'
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] text-xs text-slate-400 space-y-1">
              <p className="font-mono text-slate-300">
                Privacy Architecture · Zero Raw Photos Stored
              </p>
              <p>
                Only an 8-point lighting-normalized geometric ratio signature is saved to Firestore{' '}
                <code className="text-amber-300">members/{'{id}'}</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE QR GATE SCAN */}
      {activeTab === 'qr_gate' && <MemberCheckIn embedded={true} />}

      {/* TAB 3: WEBAUTHN DEVICE PASSKEY */}
      {activeTab === 'passkey' && (
        <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-amber-400" />
              <span>
                {bi(
                  language,
                  'WebAuthn Biometric Passkey Check-In',
                  'WebAuthn बायोमेट्रिक पासकी चेक-इन'
                )}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {bi(
                language,
                'Verifies cryptographic device biometrics (FaceID / TouchID / Fingerprint) with server challenge.',
                'डिवाइस के फिंगरप्रिंट या फेस आईडी से सुरक्षित क्रिप्टोग्राफिक चेक-इन।'
              )}
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">
              {bi(language, 'Select Member', 'मेंबर चुनें')}
            </label>
            <select
              value={passkeyMemberId}
              onChange={(e) => setPasskeyMemberId(Number(e.target.value))}
              className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white"
            >
              {members.length === 0 ? (
                <option value={0}>No registered members yet</option>
              ) : (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phone})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={passkeyBusy || members.length === 0}
              onClick={() => void handlePasskeyCheckIn('verify')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{bi(language, 'Verify Passkey & Check-In', 'पासकी सत्यापित कर चेक-इन करें')}</span>
            </button>
            <button
              type="button"
              disabled={passkeyBusy || members.length === 0}
              onClick={() => void handlePasskeyCheckIn('enroll')}
              className="px-4 py-3 rounded-md bg-[#09090B] border border-white/[0.12] hover:border-amber-400/50 disabled:opacity-50 text-slate-200 font-semibold text-xs uppercase tracking-wider cursor-pointer"
            >
              {bi(language, 'Register Device Passkey', 'नया पासकी रजिस्टर करें')}
            </button>
          </div>

          {passkeyStatus && (
            <div className="p-3.5 rounded-md bg-[#09090B] border border-white/[0.1] text-xs font-mono text-emerald-300">
              {passkeyStatus}
            </div>
          )}
        </div>
      )}

      {/* MANUAL REGISTER TABLE (ALWAYS VISIBLE IN MANUAL TAB OR BELOW AS LIVE LOG) */}
      <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-white">
            {bi(language, `Attendance Register · ${selectedDate}`, `अटेंडेंस रजिस्टर · ${selectedDate}`)}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder={bi(language, 'Search member name or phone...', 'नाम या मोबाइल खोजें...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#09090B] border border-white/[0.12] rounded-md pl-10 pr-4 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            {bi(
              language,
              'No members match your search. Add members via Scientific AI Admission first.',
              'कोई मेंबर नहीं मिला। पहले साइंटिफिक AI एडमिशन से मेंबर जोड़ें।'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs font-mono uppercase text-slate-400">
                  <th className="py-3 pr-4">{bi(language, 'Member', 'मेंबर')}</th>
                  <th className="py-3 px-4">{bi(language, 'Phone', 'मोबाइल')}</th>
                  <th className="py-3 px-4">{bi(language, 'Geometry', 'ज्योमेट्री')}</th>
                  <th className="py-3 px-4">{bi(language, 'Status', 'स्थिति')}</th>
                  <th className="py-3 pl-4 text-right">{bi(language, 'Actions', 'एक्शन')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredMembers.map((member) => {
                  const record = getAttendanceStatus(member.id);
                  const isEnrolled = Boolean(faceProfiles[member.id]);
                  return (
                    <tr key={member.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 pr-4 font-semibold text-white">{member.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{member.phone}</td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className={isEnrolled ? 'text-emerald-400' : 'text-slate-500'}>
                          {isEnrolled ? 'ENROLLED' : 'NOT ENROLLED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {record ? (
                          <span
                            className={
                              record.status === 'Present'
                                ? 'text-emerald-400 font-bold'
                                : record.status === 'Late'
                                  ? 'text-amber-400 font-bold'
                                  : 'text-red-400 font-bold'
                            }
                          >
                            {record.status} · {record.time} ({record.method})
                          </span>
                        ) : (
                          <span className="text-slate-500">Not Marked</span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleMarkAttendance(member.id, 'Present', 'MANUAL')}
                            className="p-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-pointer"
                            title="Mark Present"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleMarkAttendance(member.id, 'Late', 'MANUAL')}
                            className="p-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 cursor-pointer"
                            title="Mark Late"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleMarkAttendance(member.id, 'Absent', 'MANUAL')}
                            className="p-2 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 cursor-pointer"
                            title="Mark Absent"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;
