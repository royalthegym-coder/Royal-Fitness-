import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {
  Camera,
  Upload,
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Save,
  Download,
  FlipHorizontal,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  X,
  Code2,
  Activity,
  BarChart3,
  Copy,
  Check,
  LogIn,
  Timer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  POSE_EXERCISE_SPECS,
  DEFAULT_POSE_RULES,
  PoseExerciseId,
  PoseRuleConfig,
  CoachLanguage,
  PoseRepStateMachine,
  PoseFrameEvaluation,
  RepTelemetryPoint,
  normalizeMoveNetKeypoints,
  generateCalibrationKeypoints,
  renderPoseOverlay,
} from '../../lib/poseEngine';
import { workoutRepo } from '../../lib/gymDatabase';
import { auth } from '../../lib/firebase';
import { WorkoutSessionLogRecord } from '../../types';
import { useToast } from '../hooks/useToast';

interface RealTimeFormAnalyzerProps {
  memberId?: string | number;
  onClose?: () => void;
  onOpenPortalLogin?: () => void;
  embedded?: boolean;
}

type InputMode = 'idle' | 'camera' | 'video' | 'kinematics';
type StudioTab = 'studio' | 'rules' | 'analytics';

const GUEST_SETS_STORAGE_KEY = 'ff_pose_studio_sets';

const INITIAL_EVAL: PoseFrameEvaluation = {
  primaryAngle: 0,
  secondaryAngle: null,
  symmetryScore: 100,
  postureScore: 100,
  phase: 'standby',
  repCount: 0,
  holdSeconds: 0,
  bottomHoldMs: 0,
  bottomHoldProgress: 0,
  isPaused: false,
  faultsDetected: [],
  feedbackEn: 'Select Camera, Video, or Kinematics Test to begin pose tracking.',
  feedbackHi: 'पोज़ ट्रैकिंग शुरू करने के लिए कैमरा, वीडियो या काइनेमैटिक्स टेस्ट चुनें।',
  severity: 'idle',
  completedRepJustNow: false,
  repTelemetry: null,
};

const EXERCISE_PRIMARY_PIVOT: Record<PoseExerciseId, string> = {
  squat: 'left_knee',
  pushup: 'left_elbow',
  deadlift: 'left_hip',
  bicep_curl: 'left_elbow',
  shoulder_press: 'left_elbow',
  plank: 'left_hip',
};

const PAUSE_TEMPO_PRESETS: Array<{ label: string; ms: number }> = [
  { label: '0s Instant', ms: 0 },
  { label: '1.5s Pause', ms: 1500 },
  { label: '2.0s Pause', ms: 2000 },
  { label: '3.0s Tempo', ms: 3000 },
];

function readGuestSets(): WorkoutSessionLogRecord[] {
  try {
    const raw = localStorage.getItem(GUEST_SETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestSet(record: WorkoutSessionLogRecord) {
  try {
    const existing = readGuestSets();
    localStorage.setItem(GUEST_SETS_STORAGE_KEY, JSON.stringify([record, ...existing].slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
}

const RealTimeFormAnalyzer: React.FC<RealTimeFormAnalyzerProps> = ({
  memberId = 'studio_session',
  onClose,
  onOpenPortalLogin,
}) => {
  const { addToast } = useToast();
  const normalizedMemberId = String(memberId || 'studio_session');
  const isCloudSignedIn = Boolean(auth?.currentUser);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const fsmRef = useRef<PoseRepStateMachine>(new PoseRepStateMachine('squat'));

  // Synthetic kinematics clock handles pause smoothly without time jumps
  const syntheticElapsedRef = useRef<number>(0);
  const lastPerfRef = useRef<number>(0);
  const lastSpokenMsRef = useRef<number>(0);
  const lastSpokenTextRef = useRef<string>('');
  const setStartMsRef = useRef<number>(Date.now());

  const [activeTab, setActiveTab] = useState<StudioTab>('studio');
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<PoseExerciseId>('squat');
  const [ruleConfig, setRuleConfig] = useState<PoseRuleConfig>(() => ({ ...DEFAULT_POSE_RULES.squat }));
  const [language, setLanguage] = useState<CoachLanguage>('hi');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Biomechanics Telemetry
  const [evaluation, setEvaluation] = useState<PoseFrameEvaluation>(INITIAL_EVAL);
  const [repHistory, setRepHistory] = useState<RepTelemetryPoint[]>([]);
  const [fps, setFps] = useState<number>(0);
  const frameTimesRef = useRef<number[]>([]);

  // Set Persistence Fields
  const [weightKg, setWeightKg] = useState<number>(40);
  const [rpeScore, setRpeScore] = useState<number>(7);
  const [isSavingSet, setIsSavingSet] = useState(false);
  const [savedSets, setSavedSets] = useState<WorkoutSessionLogRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const exerciseSpec = POSE_EXERCISE_SPECS[selectedExercise];

  // Load MoveNet Lightning pose model
  useEffect(() => {
    let mounted = true;
    const initDetector = async () => {
      try {
        await tf.ready();
        const instance = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        });
        if (mounted) {
          setDetector(instance);
          setModelStatus('ready');
        }
      } catch (err) {
        console.warn('[PoseEngine] MoveNet fallback to kinematics:', err);
        if (mounted) {
          setModelStatus('fallback');
        }
      }
    };
    initDetector();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load persisted workout sets (Cloud Firestore when signed in, Local Guest Storage otherwise)
  const refreshSavedSets = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      if (auth?.currentUser) {
        const logs = await workoutRepo.listSetLogs(normalizedMemberId, 16);
        setSavedSets(logs);
      } else {
        setSavedSets(readGuestSets());
      }
    } catch {
      setSavedSets(readGuestSets());
    } finally {
      setIsLoadingHistory(false);
    }
  }, [normalizedMemberId]);

  useEffect(() => {
    refreshSavedSets();
  }, [refreshSavedSets]);

  // Sync exercise selection with FSM & default rule config
  useEffect(() => {
    const nextRule = { ...DEFAULT_POSE_RULES[selectedExercise] };
    fsmRef.current.setExercise(selectedExercise);
    fsmRef.current.setRuleConfig(nextRule);
    setRuleConfig(nextRule);
    setIsPaused(false);
    setRepHistory([]);
    syntheticElapsedRef.current = 0;
    setEvaluation({
      ...INITIAL_EVAL,
      feedbackEn: `${POSE_EXERCISE_SPECS[selectedExercise].label} armed. Start tracking.`,
      feedbackHi: `${POSE_EXERCISE_SPECS[selectedExercise].hindiLabel} तैयार है। ट्रैकिंग शुरू करें।`,
    });
    setStartMsRef.current = Date.now();
  }, [selectedExercise]);

  const updateRule = useCallback((patch: Partial<PoseRuleConfig>) => {
    setRuleConfig((prev) => {
      const updated = { ...prev, ...patch };
      fsmRef.current.setRuleConfig(updated);
      return updated;
    });
  }, []);

  const speakCue = useCallback(
    (text: string) => {
      if (!audioEnabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const now = Date.now();
      if (now - lastSpokenMsRef.current < 2600 && lastSpokenTextRef.current === text) return;
      if (now - lastSpokenMsRef.current < 1500) return;

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utter.rate = 1.05;
      window.speechSynthesis.speak(utter);
      lastSpokenMsRef.current = now;
      lastSpokenTextRef.current = text;
    },
    [audioEnabled, language]
  );

  const togglePause = useCallback(() => {
    if (inputMode === 'idle') return;
    setIsPaused((prev) => {
      const next = !prev;
      fsmRef.current.setPaused(next);
      if (inputMode === 'video' && videoRef.current) {
        if (next) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(() => {});
        }
      }
      return next;
    });
  }, [inputMode]);

  // Spacebar shortcut to Pause / Resume active session cleanly
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' && inputMode !== 'idle') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inputMode, togglePause]);

  const stopActiveStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      if (videoRef.current.src) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    }
    fsmRef.current.setPaused(false);
    setIsPaused(false);
    setInputMode('idle');
    setFps(0);
  }, []);

  const handleResetSession = () => {
    fsmRef.current.reset();
    fsmRef.current.setRuleConfig(ruleConfig);
    setIsPaused(false);
    setRepHistory([]);
    syntheticElapsedRef.current = 0;
    setStartMsRef.current = Date.now();
    setEvaluation({
      ...INITIAL_EVAL,
      feedbackEn: 'Counters reset. Ready for next set.',
      feedbackHi: 'काउंटर रीसेट हो गया। अगले सेट के लिए तैयार।',
    });
  };

  const startKinematicsTest = useCallback(() => {
    stopActiveStream();
    syntheticElapsedRef.current = 0;
    lastPerfRef.current = performance.now();
    setStartMsRef.current = Date.now();
    setIsPaused(false);
    fsmRef.current.setPaused(false);
    setActiveTab('studio');
    setInputMode('kinematics');
  }, [stopActiveStream]);

  const startLiveCamera = async () => {
    stopActiveStream();
    setActiveTab('studio');
    if (!navigator.mediaDevices?.getUserMedia) {
      addToast('Camera API unavailable in this browser. Running Kinematics Test instead.', 'info');
      startKinematicsTest();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setStartMsRef.current = Date.now();
          setIsPaused(false);
          fsmRef.current.setPaused(false);
          setInputMode('camera');
        };
      }
    } catch {
      addToast('Camera permission blocked or missing. Switched to Kinematics Test.', 'info');
      startKinematicsTest();
    }
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopActiveStream();
    setActiveTab('studio');
    const url = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {});
        setStartMsRef.current = Date.now();
        setIsPaused(false);
        fsmRef.current.setPaused(false);
        setInputMode('video');
      };
    }
    e.target.value = '';
  };

  // Core 60 FPS Pose Evaluation Loop (pauses smoothly when isPaused === true)
  useEffect(() => {
    if (inputMode === 'idle') return;
    let cancelled = false;
    lastPerfRef.current = performance.now();

    const runLoop = async (nowPerf: number) => {
      if (cancelled) return;

      const deltaSec = Math.min(0.1, Math.max(0, (nowPerf - lastPerfRef.current) / 1000));
      lastPerfRef.current = nowPerf;
      if (!isPaused) {
        syntheticElapsedRef.current += deltaSec;
      }

      frameTimesRef.current.push(nowPerf);
      frameTimesRef.current = frameTimesRef.current.filter((t) => nowPerf - t <= 1000);
      setFps(frameTimesRef.current.length);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && ctx) {
        if (inputMode === 'kinematics') {
          canvas.width = 960;
          canvas.height = 540;
          const synthetic = generateCalibrationKeypoints(
            selectedExercise,
            syntheticElapsedRef.current,
            canvas.width,
            canvas.height,
            ruleConfig.pauseHoldMs
          );
          const landmarks = normalizeMoveNetKeypoints(synthetic);
          const nextEval = fsmRef.current.evaluate(landmarks, Date.now());
          renderPoseOverlay(ctx, landmarks, nextEval, canvas.width, canvas.height, {
            isSynthetic: true,
            primaryJoint: EXERCISE_PRIMARY_PIVOT[selectedExercise],
            exercise: selectedExercise,
          });
          setEvaluation(nextEval);

          if (nextEval.repTelemetry) {
            const point = nextEval.repTelemetry;
            setRepHistory((prev) => [...prev.slice(-24), point]);
          }
          if (!isPaused) {
            if (nextEval.completedRepJustNow) {
              speakCue(language === 'hi' ? `रैप ${nextEval.repCount}` : `Rep ${nextEval.repCount}`);
            } else if (nextEval.severity === 'fault') {
              speakCue(language === 'hi' ? nextEval.feedbackHi : nextEval.feedbackEn);
            }
          }
        } else if (video && video.readyState >= 2) {
          const vw = video.videoWidth || 960;
          const vh = video.videoHeight || 540;
          if (canvas.width !== vw || canvas.height !== vh) {
            canvas.width = vw;
            canvas.height = vh;
          }

          ctx.save();
          ctx.clearRect(0, 0, vw, vh);
          if (mirrorCamera && inputMode === 'camera') {
            ctx.translate(vw, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, vw, vh);
          ctx.restore();

          if (detector) {
            try {
              const poses = await detector.estimatePoses(video, {
                flipHorizontal: mirrorCamera && inputMode === 'camera',
              });
              if (poses.length > 0) {
                const landmarks = normalizeMoveNetKeypoints(poses[0].keypoints);
                const nextEval = fsmRef.current.evaluate(landmarks, Date.now());
                if (showSkeleton) {
                  renderPoseOverlay(ctx, landmarks, nextEval, vw, vh, {
                    isSynthetic: false,
                    primaryJoint: EXERCISE_PRIMARY_PIVOT[selectedExercise],
                    exercise: selectedExercise,
                  });
                }
                setEvaluation(nextEval);
                if (nextEval.repTelemetry) {
                  const point = nextEval.repTelemetry;
                  setRepHistory((prev) => [...prev.slice(-24), point]);
                }
                if (!isPaused) {
                  if (nextEval.completedRepJustNow) {
                    speakCue(language === 'hi' ? `रैप ${nextEval.repCount}` : `Rep ${nextEval.repCount}`);
                  } else if (nextEval.severity === 'fault') {
                    speakCue(language === 'hi' ? nextEval.feedbackHi : nextEval.feedbackEn);
                  }
                }
              }
            } catch {
              // Skip transient inference frame error
            }
          }
        }
      }

      if (!cancelled) {
        rafRef.current = requestAnimationFrame(runLoop);
      }
    };

    rafRef.current = requestAnimationFrame(runLoop);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    inputMode,
    isPaused,
    detector,
    selectedExercise,
    ruleConfig.pauseHoldMs,
    mirrorCamera,
    showSkeleton,
    language,
    speakCue,
  ]);

  const handleSaveSet = async () => {
    const repsOrSeconds =
      selectedExercise === 'plank' ? Math.max(1, evaluation.holdSeconds) : evaluation.repCount;
    if (repsOrSeconds <= 0) {
      addToast('Complete at least 1 rep (or run Kinematics Test) before saving.', 'info');
      return;
    }

    setIsSavingSet(true);
    try {
      const durationSeconds = Math.max(1, Math.round((Date.now() - setStartMsRef.current) / 1000));
      const setNum = savedSets.length + 1;
      const newRecord: WorkoutSessionLogRecord = {
        id: `wsl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        member_id: normalizedMemberId,
        exercise_id: selectedExercise,
        workout_date: new Date().toISOString().split('T')[0],
        set_number: setNum,
        weight_kg: Number(weightKg) || 0,
        reps_completed: repsOrSeconds,
        rpe_score: Number(rpeScore) || 7,
        ai_posture_score: fsmRef.current.getAverageScore(),
        form_faults_detected: fsmRef.current.getUniqueFaults(),
        duration_seconds: durationSeconds,
        synced_from_offline: !navigator.onLine || !auth?.currentUser,
        created_at: new Date().toISOString(),
      };

      let saved = newRecord;
      if (auth?.currentUser) {
        saved = await workoutRepo.logSet(newRecord);
      } else {
        writeGuestSet(newRecord);
      }

      setSavedSets((prev) => [saved, ...prev]);
      addToast(
        auth?.currentUser
          ? `Set #${setNum} synced to Cloud (${repsOrSeconds} ${selectedExercise === 'plank' ? 'sec' : 'reps'} · Score ${saved.ai_posture_score}%).`
          : `Set #${setNum} saved locally (${repsOrSeconds} ${selectedExercise === 'plank' ? 'sec' : 'reps'}). Sign in for Cloud Sync.`,
        'success'
      );
      handleResetSession();
    } catch (err) {
      console.error('[PoseStudio] Failed to save set:', err);
      addToast('Unable to save set right now.', 'error');
    } finally {
      setIsSavingSet(false);
    }
  };

  const handleExportSession = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      memberId: normalizedMemberId,
      exercise: exerciseSpec,
      activePauseAndPoseRules: ruleConfig,
      liveTelemetry: evaluation,
      repHistory,
      averagePostureScore: fsmRef.current.getAverageScore(),
      faultsDetected: fsmRef.current.getUniqueFaults(),
      savedSets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pose-pause-session-${selectedExercise}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatedPoseRuleCode = useMemo(() => {
    return JSON.stringify(
      {
        engine: 'FitnessFuture.PoseRepFSM@v2',
        exercise: selectedExercise,
        primaryJoint: exerciseSpec.primaryJointLabel,
        rules: {
          startLockoutAngleDeg: ruleConfig.startAngle,
          targetDepthAngleDeg: ruleConfig.targetAngle,
          isometricPauseHoldMs: ruleConfig.pauseHoldMs,
          maxAsymmetryToleranceDeg: ruleConfig.symmetryTolerance,
        },
        pauseBehavior: {
          freezeClockOnUserPause: true,
          hotkey: 'Space',
          requireBottomHoldBeforeRepArming: ruleConfig.pauseHoldMs > 0,
        },
      },
      null,
      2
    );
  }, [selectedExercise, exerciseSpec.primaryJointLabel, ruleConfig]);

  const handleCopyRulesCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedPoseRuleCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
      addToast('Pose & Pause Rule config copied to clipboard.', 'success');
    } catch {
      addToast('Clipboard permission unavailable.', 'info');
    }
  };

  const activeFeedback = language === 'hi' ? evaluation.feedbackHi : evaluation.feedbackEn;
  const avgScore = fsmRef.current.getAverageScore();
  const uniqueFaults = fsmRef.current.getUniqueFaults();

  return (
    <div className="min-h-screen w-full bg-[#060911] text-slate-100">
      {/* 3-Zone Start-Screen Top Navigation Bar (when acting as app launch workspace) */}
      {onOpenPortalLogin && (
        <nav className="sticky top-0 z-30 border-b border-slate-800 bg-[#060911]/95 backdrop-blur-md">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                Fitness Future
              </span>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto">
              {[
                { id: 'studio' as const, label: 'Pose Studio' },
                { id: 'rules' as const, label: 'Pause Rules' },
                { id: 'analytics' as const, label: 'Workout Log' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                stopActiveStream();
                onOpenPortalLogin();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Portal Sign In</span>
            </button>
          </div>
        </nav>
      )}

      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Workspace Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
              <span>Pause &amp; Pose Coding Studio</span>
              <span aria-hidden="true">·</span>
              <span>
                {modelStatus === 'ready'
                  ? 'MoveNet WebGL Ready'
                  : modelStatus === 'loading'
                    ? 'Loading MoveNet Model'
                    : 'Kinematics Engine'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{fps} FPS</span>
              <span aria-hidden="true">·</span>
              <span>{isCloudSignedIn ? 'Cloud Sync Active' : 'Local Studio Mode'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Pose &amp; Pause Tempo Trainer
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!onOpenPortalLogin && (
              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {[
                  { id: 'studio' as const, label: 'Studio', icon: Activity },
                  { id: 'rules' as const, label: 'Pause Code', icon: Code2 },
                  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  language === 'hi' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hinglish Coach
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English Coach
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAudioEnabled((v) => !v)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{audioEnabled ? 'Voice On' : 'Voice Muted'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportSession}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={() => {
                  stopActiveStream();
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close Studio</span>
              </button>
            )}
          </div>
        </header>

        {/* Primary View: Live Studio */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Pose Canvas Viewport & Transport Controls */}
            <div className="lg:col-span-8 space-y-4">
              <div className="relative rounded-xl border border-slate-800 bg-[#090D16] overflow-hidden aspect-video flex items-center justify-center">
                <video ref={videoRef} className="hidden" playsInline muted />
                <canvas ref={canvasRef} className="w-full h-full object-contain" />

                {inputMode === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#090D16]/95">
                    <p className="text-base font-semibold text-white mb-1">
                      {exerciseSpec.label} ({exerciseSpec.hindiLabel})
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mb-6">
                      {exerciseSpec.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={startLiveCamera}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Start Live Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={startKinematicsTest}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-cyan-400" />
                        <span>Run Kinematics Test (No Camera)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Video</span>
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoFile}
                    />
                  </div>
                )}

                {/* Top Scrim Telemetry Overlay */}
                {inputMode !== 'idle' && (
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-none">
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-200 font-mono tabular-nums">
                      {inputMode === 'kinematics' ? 'KINEMATICS' : inputMode === 'camera' ? 'CAMERA' : 'VIDEO'} · {evaluation.phase.toUpperCase()}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-200 font-mono tabular-nums">
                      {exerciseSpec.primaryJointLabel}: {evaluation.primaryAngle}°
                      {ruleConfig.pauseHoldMs > 0 && ` · HOLD ${(ruleConfig.pauseHoldMs / 1000).toFixed(1)}s`}
                    </div>
                  </div>
                )}
              </div>

              {/* Viewport Action Toolbar with Pause / Resume Control */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex flex-wrap items-center gap-2">
                  {inputMode === 'idle' ? (
                    <>
                      <button
                        type="button"
                        onClick={startLiveCamera}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Start Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={startKinematicsTest}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Kinematics Test</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={togglePause}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isPaused
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        <span>{isPaused ? 'Resume (Space)' : 'Pause (Space)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopActiveStream}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleResetSession}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Counter</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMirrorCamera((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      mirrorCamera
                        ? 'border-slate-700 bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Mirror</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSkeleton((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      showSkeleton
                        ? 'border-slate-700 bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {showSkeleton ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>Skeleton Overlay</span>
                  </button>
                </div>
              </div>

              {/* Pause Hold Progress & Live Coaching Cue */}
              <div
                className={`p-4 rounded-xl border space-y-3 transition-colors ${
                  evaluation.isPaused
                    ? 'border-slate-700 bg-slate-900/70 text-slate-200'
                    : evaluation.severity === 'fault'
                      ? 'border-red-500/40 bg-red-950/30 text-red-200'
                      : evaluation.severity === 'warning'
                        ? 'border-amber-500/40 bg-amber-950/25 text-amber-100'
                        : evaluation.severity === 'good'
                          ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-100'
                          : 'border-slate-800 bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {evaluation.severity === 'fault' || evaluation.severity === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 mb-0.5">Live Biomechanical Cue</p>
                    <p className="text-base font-semibold leading-snug">{activeFeedback}</p>
                  </div>
                  {ruleConfig.pauseHoldMs > 0 && selectedExercise !== 'plank' && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">Pause Depth</p>
                      <p className="text-sm font-mono tabular-nums text-cyan-400 font-semibold">
                        {(evaluation.bottomHoldMs / 1000).toFixed(1)}s / {(ruleConfig.pauseHoldMs / 1000).toFixed(1)}s
                      </p>
                    </div>
                  )}
                </div>

                {ruleConfig.pauseHoldMs > 0 && selectedExercise !== 'plank' && (
                  <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        evaluation.bottomHoldProgress >= 100 ? 'bg-emerald-500' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${evaluation.bottomHoldProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Columns: Metrics, Pause Tempo Presets, Target Exercise, Save Set */}
            <div className="lg:col-span-4 space-y-4">
              {/* 4 KPI Strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <p className="text-xs text-slate-400">
                    {selectedExercise === 'plank' ? 'Hold Time' : 'Completed Reps'}
                  </p>
                  <p className="text-3xl font-bold text-white font-mono tabular-nums mt-1">
                    {selectedExercise === 'plank' ? `${evaluation.holdSeconds}s` : evaluation.repCount}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <p className="text-xs text-slate-400">Form Score</p>
                  <p
                    className={`text-3xl font-bold font-mono tabular-nums mt-1 ${
                      avgScore >= 85 ? 'text-emerald-400' : avgScore >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}
                  >
                    {avgScore}%
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <p className="text-xs text-slate-400">Primary Angle</p>
                  <p className="text-2xl font-bold text-cyan-400 font-mono tabular-nums mt-1">
                    {evaluation.primaryAngle}°
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <p className="text-xs text-slate-400">L/R Symmetry</p>
                  <p className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                    {evaluation.symmetryScore}%
                  </p>
                </div>
              </div>

              {/* Exercise & Pause Tempo Config */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="pose-exercise-select" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Exercise</span>
                  </label>
                  <span className="text-xs text-slate-500">{exerciseSpec.targetMuscle}</span>
                </div>

                <select
                  id="pose-exercise-select"
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value as PoseExerciseId)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.values(POSE_EXERCISE_SPECS).map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.label} · {spec.hindiLabel}
                    </option>
                  ))}
                </select>

                {selectedExercise !== 'plank' && (
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Isometric Pause Tempo</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('rules')}
                        className="text-emerald-400 hover:underline cursor-pointer"
                      >
                        Edit Rules
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {PAUSE_TEMPO_PRESETS.map((preset) => (
                        <button
                          key={preset.ms}
                          type="button"
                          onClick={() => updateRule({ pauseHoldMs: preset.ms })}
                          className={`px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer ${
                            ruleConfig.pauseHoldMs === preset.ms
                              ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>
                    Start: <strong className="font-mono tabular-nums text-slate-200">{ruleConfig.startAngle}°</strong>
                  </span>
                  <span>
                    Target: <strong className="font-mono tabular-nums text-emerald-400">{ruleConfig.targetAngle}°</strong>
                  </span>
                </div>
              </div>

              {/* Persist Set to Database */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Save Set to Workout Log</h2>
                  <span className="text-xs text-slate-500">{isCloudSignedIn ? 'Cloud Sync' : 'Local Save'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Load (kg)</label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      step={2.5}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">RPE (1–10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={rpeScore}
                      onChange={(e) => setRpeScore(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {uniqueFaults.length > 0 && (
                  <div className="text-xs text-amber-300">
                    Faults detected: {uniqueFaults.join(', ')}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveSet}
                  disabled={isSavingSet}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSet ? 'Saving Set...' : 'Save Completed Set'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Secondary View: Pause Rules & Programmable Pose Code */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 p-6 rounded-xl border border-slate-800 bg-slate-950 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Pause &amp; Pose Rule Parameters</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tune joint angle thresholds and isometric pause holds for {exerciseSpec.label}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const def = { ...DEFAULT_POSE_RULES[selectedExercise] };
                    setRuleConfig(def);
                    fsmRef.current.setRuleConfig(def);
                    addToast('Restored default biomechanics thresholds.', 'info');
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Isometric Pause Hold Duration</span>
                    <span className="font-mono tabular-nums text-cyan-400 font-semibold">
                      {(ruleConfig.pauseHoldMs / 1000).toFixed(1)}s ({ruleConfig.pauseHoldMs} ms)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4000}
                    step={250}
                    value={ruleConfig.pauseHoldMs}
                    onChange={(e) => updateRule({ pauseHoldMs: Number(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Target Peak Depth Angle</span>
                    <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                      {ruleConfig.targetAngle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={35}
                    max={175}
                    step={1}
                    value={ruleConfig.targetAngle}
                    onChange={(e) => updateRule({ targetAngle: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Start Lockout Angle Threshold</span>
                    <span className="font-mono tabular-nums text-slate-200 font-semibold">
                      {ruleConfig.startAngle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={180}
                    step={1}
                    value={ruleConfig.startAngle}
                    onChange={(e) => updateRule({ startAngle: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">L/R Symmetry Fault Tolerance</span>
                    <span className="font-mono tabular-nums text-amber-400 font-semibold">
                      ±{ruleConfig.symmetryTolerance}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={35}
                    step={1}
                    value={ruleConfig.symmetryTolerance}
                    onChange={(e) => updateRule({ symmetryTolerance: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('studio')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Apply &amp; Return to Studio</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 rounded-xl border border-slate-800 bg-slate-950 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-white">Live Pose &amp; Pause Rule Program</h2>
                <button
                  type="button"
                  onClick={handleCopyRulesCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-[#090D16] border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {generatedPoseRuleCode}
              </pre>
            </div>
          </div>
        )}

        {/* Secondary View: Rep Telemetry Chart & Saved History */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-950 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Live Rep Posture &amp; Depth Telemetry</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tracks posture accuracy (%) and lowest joint flexion angle (°) across each completed rep.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {repHistory.length} reps tracked this session
                </span>
              </div>

              {repHistory.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#090D16] text-center p-6">
                  <p className="text-sm font-medium text-slate-300">No completed reps plotted yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Run Kinematics Test or Start Live Camera in Studio to stream rep curves here.
                  </p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={repHistory} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="postureGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="repNumber" stroke="#64748B" tickFormatter={(v) => `R${v}`} fontSize={12} />
                      <YAxis domain={[0, 180]} stroke="#64748B" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090D16',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        name="Posture Score (%)"
                        stroke="#10B981"
                        fill="url(#postureGrad)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="peakDepthAngle"
                        name="Peak Depth Angle (°)"
                        stroke="#06B6D4"
                        fill="transparent"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Pose Set History Table (Visible below studio & analytics) */}
        <section className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-white">Recent AI Form &amp; Set History</h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {savedSets.length} logged sets
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-9 rounded bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : savedSets.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm text-slate-300 font-medium">No pose sets saved yet for this session.</p>
              <p className="text-xs text-slate-500">
                Start Camera or Run Kinematics Test, complete reps, and click Save Completed Set.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-4 font-medium">Exercise</th>
                    <th className="py-2.5 px-4 font-medium text-right">Load</th>
                    <th className="py-2.5 px-4 font-medium text-right">Reps</th>
                    <th className="py-2.5 px-4 font-medium text-right">RPE</th>
                    <th className="py-2.5 px-4 font-medium text-right">Posture Score</th>
                    <th className="py-2.5 px-4 font-medium">Faults</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {savedSets.map((setRow) => (
                    <tr key={setRow.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                        {setRow.workout_date}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-200 capitalize">
                        {(setRow.exercise_id || 'squat').replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {setRow.weight_kg} kg
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-white font-semibold">
                        {setRow.reps_completed}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {setRow.rpe_score ?? '-'}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold ${
                          (setRow.ai_posture_score ?? 0) >= 85
                            ? 'text-emerald-400'
                            : (setRow.ai_posture_score ?? 0) >= 70
                              ? 'text-amber-400'
                              : 'text-red-400'
                        }`}
                      >
                        {setRow.ai_posture_score ?? 0}%
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {setRow.form_faults_detected && setRow.form_faults_detected.length > 0
                          ? setRow.form_faults_detected.join(', ')
                          : 'Clean form'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RealTimeFormAnalyzer;
