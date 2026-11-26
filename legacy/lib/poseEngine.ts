import type { Keypoint } from '@tensorflow-models/pose-detection';

export type PoseExerciseId =
  | 'squat'
  | 'pushup'
  | 'deadlift'
  | 'bicep_curl'
  | 'shoulder_press'
  | 'plank';

export type CoachLanguage = 'en' | 'hi';

export interface NormalizedLandmark {
  name: string;
  x: number; // pixel x
  y: number; // pixel y
  score: number;
}

export interface ExerciseSpec {
  id: PoseExerciseId;
  label: string;
  hindiLabel: string;
  targetMuscle: string;
  primaryJointLabel: string;
  startAngle: number;
  targetAngle: number;
  description: string;
}

export interface PoseRuleConfig {
  startAngle: number;
  targetAngle: number;
  pauseHoldMs: number;
  symmetryTolerance: number;
}

export interface RepTelemetryPoint {
  repNumber: number;
  peakDepthAngle: number;
  holdMs: number;
  score: number;
  timestamp: string;
}

export const POSE_EXERCISE_SPECS: Record<PoseExerciseId, ExerciseSpec> = {
  squat: {
    id: 'squat',
    label: 'Barbell / Air Squat',
    hindiLabel: 'स्क्वाट (Squat)',
    targetMuscle: 'Quadriceps & Glutes',
    primaryJointLabel: 'Knee Flexion',
    startAngle: 155,
    targetAngle: 105,
    description: 'Tracks hip-knee-ankle depth, knee alignment, bottom pause holds, and torso symmetry.',
  },
  pushup: {
    id: 'pushup',
    label: 'Push-Up',
    hindiLabel: 'पुश-अप (Push-Up)',
    targetMuscle: 'Pectoralis & Triceps',
    primaryJointLabel: 'Elbow Flexion',
    startAngle: 152,
    targetAngle: 98,
    description: 'Tracks elbow lockout depth, bottom chest pause, and core hip alignment across reps.',
  },
  deadlift: {
    id: 'deadlift',
    label: 'Deadlift Hinge',
    hindiLabel: 'डेडलिफ्ट (Deadlift)',
    targetMuscle: 'Posterior Chain',
    primaryJointLabel: 'Hip Hinge',
    startAngle: 158,
    targetAngle: 112,
    description: 'Monitors hip hinge flexion, lumbar neutrality, pause-at-shin tension, and lockout.',
  },
  bicep_curl: {
    id: 'bicep_curl',
    label: 'Bicep Curl',
    hindiLabel: 'बाइसेप कर्ल (Bicep Curl)',
    targetMuscle: 'Biceps Brachii',
    primaryJointLabel: 'Elbow Curl Angle',
    startAngle: 148,
    targetAngle: 55,
    description: 'Measures full elbow extension to peak curl squeeze hold without shoulder swing.',
  },
  shoulder_press: {
    id: 'shoulder_press',
    label: 'Overhead Shoulder Press',
    hindiLabel: 'शोल्डर प्रेस (Overhead Press)',
    targetMuscle: 'Anterior Deltoids',
    primaryJointLabel: 'Press Lockout',
    startAngle: 95,
    targetAngle: 156,
    description: 'Tracks vertical drive from rack position to verified overhead lockout hold.',
  },
  plank: {
    id: 'plank',
    label: 'Isometric Plank Hold',
    hindiLabel: 'प्लैंक होल्ड (Plank)',
    targetMuscle: 'Core & Stabilizers',
    primaryJointLabel: 'Spine Alignment',
    startAngle: 158,
    targetAngle: 180,
    description: 'Audits shoulder-hip-ankle spinal alignment and accumulates clean hold time.',
  },
};

export const DEFAULT_POSE_RULES: Record<PoseExerciseId, PoseRuleConfig> = {
  squat: { startAngle: 155, targetAngle: 105, pauseHoldMs: 1500, symmetryTolerance: 18 },
  pushup: { startAngle: 152, targetAngle: 98, pauseHoldMs: 1000, symmetryTolerance: 18 },
  deadlift: { startAngle: 158, targetAngle: 112, pauseHoldMs: 1000, symmetryTolerance: 18 },
  bicep_curl: { startAngle: 148, targetAngle: 55, pauseHoldMs: 1000, symmetryTolerance: 18 },
  shoulder_press: { startAngle: 95, targetAngle: 156, pauseHoldMs: 1000, symmetryTolerance: 18 },
  plank: { startAngle: 158, targetAngle: 180, pauseHoldMs: 0, symmetryTolerance: 18 },
};

export interface PoseFrameEvaluation {
  primaryAngle: number;
  secondaryAngle: number | null;
  symmetryScore: number; // 0-100
  postureScore: number; // 0-100
  phase: 'standby' | 'eccentric' | 'pause_hold' | 'peak' | 'concentric' | 'hold' | 'paused';
  repCount: number;
  holdSeconds: number;
  bottomHoldMs: number;
  bottomHoldProgress: number; // 0-100
  isPaused: boolean;
  faultsDetected: string[];
  feedbackEn: string;
  feedbackHi: string;
  severity: 'good' | 'warning' | 'fault' | 'idle';
  completedRepJustNow: boolean;
  repTelemetry: RepTelemetryPoint | null;
}

export function calculateJointAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export function normalizeMoveNetKeypoints(keypoints: Keypoint[]): Record<string, NormalizedLandmark> {
  const map: Record<string, NormalizedLandmark> = {};
  for (const kp of keypoints) {
    if (kp.name) {
      map[kp.name] = {
        name: kp.name,
        x: kp.x,
        y: kp.y,
        score: kp.score ?? 0,
      };
    }
  }
  return map;
}

export function normalizeMediaPipeLandmarks(
  landmarks: Array<{ x: number; y: number; visibility?: number }>,
  width: number,
  height: number
): Record<string, NormalizedLandmark> {
  const indexToName: Record<number, string> = {
    0: 'nose',
    5: 'left_eye',
    2: 'right_eye',
    11: 'left_shoulder',
    12: 'right_shoulder',
    13: 'left_elbow',
    14: 'right_elbow',
    15: 'left_wrist',
    16: 'right_wrist',
    23: 'left_hip',
    24: 'right_hip',
    25: 'left_knee',
    26: 'right_knee',
    27: 'left_ankle',
    28: 'right_ankle',
  };
  const map: Record<string, NormalizedLandmark> = {};
  Object.entries(indexToName).forEach(([idxStr, name]) => {
    const lm = landmarks[Number(idxStr)];
    if (lm) {
      map[name] = {
        name,
        x: lm.x * width,
        y: lm.y * height,
        score: lm.visibility ?? 0.9,
      };
    }
  });
  return map;
}

function hasVisible(landmarks: Record<string, NormalizedLandmark>, names: string[], minScore = 0.25): boolean {
  return names.every((n) => landmarks[n] && landmarks[n].score >= minScore);
}

/**
 * Generates deterministic calibration kinematics keypoints on canvas coordinates
 * with an authentic bottom isometric pause plateau matching the configured pauseHoldMs.
 */
export function generateCalibrationKeypoints(
  exercise: PoseExerciseId,
  elapsedSec: number,
  width: number,
  height: number,
  pauseHoldMs = 0
): Keypoint[] {
  const cx = width * 0.5;
  const cy = height * 0.48;

  const holdDur = Math.max(0, pauseHoldMs / 1000) + (pauseHoldMs > 0 ? 0.35 : 0.15);
  const eccentricDur = 0.95;
  const concentricDur = 0.95;
  const topRestDur = 0.45;
  const totalCycle = eccentricDur + holdDur + concentricDur + topRestDur;
  const phaseTime = elapsedSec % totalCycle;

  let cycle = 0;
  if (phaseTime < eccentricDur) {
    const u = phaseTime / eccentricDur;
    cycle = 0.5 - 0.5 * Math.cos(Math.PI * u);
  } else if (phaseTime < eccentricDur + holdDur) {
    cycle = 1;
  } else if (phaseTime < eccentricDur + holdDur + concentricDur) {
    const u = (phaseTime - eccentricDur - holdDur) / concentricDur;
    cycle = 0.5 + 0.5 * Math.cos(Math.PI * u);
  } else {
    cycle = 0;
  }

  let headY = cy - 135;
  let shoulderY = cy - 95;
  let hipY = cy + 5;
  let kneeY = cy + 85;
  let ankleY = cy + 165;
  let elbowOffsetX = 68;
  let elbowY = shoulderY + 45;
  let wristOffsetX = 82;
  let wristY = shoulderY + 95;
  let kneeOffsetX = 34;

  if (exercise === 'squat') {
    const drop = cycle * 74;
    headY += drop * 0.85;
    shoulderY += drop * 0.9;
    hipY += drop;
    kneeOffsetX = 34 + cycle * 26;
    elbowY = shoulderY + 15;
    wristY = shoulderY - 10;
  } else if (exercise === 'pushup') {
    const dip = cycle * 48;
    headY = cy - 45 + dip;
    shoulderY = cy - 25 + dip;
    hipY = cy + 10 + dip * 0.55;
    kneeY = cy + 55;
    ankleY = cy + 105;
    elbowOffsetX = 56 + cycle * 28;
    elbowY = shoulderY + 35 - dip * 0.3;
    wristOffsetX = 52;
    wristY = cy + 45;
  } else if (exercise === 'deadlift') {
    const hinge = cycle * 58;
    headY = cy - 125 + hinge * 0.7;
    shoulderY = cy - 85 + hinge * 0.85;
    hipY = cy + 10 + hinge * 0.25;
    elbowY = shoulderY + 65;
    wristY = elbowY + 55;
  } else if (exercise === 'bicep_curl') {
    elbowOffsetX = 52;
    elbowY = shoulderY + 55;
    wristOffsetX = 58 - cycle * 10;
    wristY = elbowY + 58 - cycle * 114;
  } else if (exercise === 'shoulder_press') {
    elbowOffsetX = 64;
    elbowY = shoulderY + 12 - cycle * 52;
    wristOffsetX = 62 - cycle * 12;
    wristY = shoulderY - 22 - cycle * 92;
  } else if (exercise === 'plank') {
    const micro = Math.sin(elapsedSec * 1.4) * 4;
    headY = cy - 30 + micro;
    shoulderY = cy - 15 + micro;
    hipY = cy + 5 + micro * 0.6;
    kneeY = cy + 25;
    ankleY = cy + 45;
    elbowOffsetX = 48;
    elbowY = cy + 35;
    wristOffsetX = 56;
    wristY = cy + 42;
  }

  const pts: Array<[string, number, number]> = [
    ['nose', cx, headY],
    ['left_eye', cx - 10, headY - 6],
    ['right_eye', cx + 10, headY - 6],
    ['left_ear', cx - 18, headY],
    ['right_ear', cx + 18, headY],
    ['left_shoulder', cx - 44, shoulderY],
    ['right_shoulder', cx + 44, shoulderY],
    ['left_elbow', cx - elbowOffsetX, elbowY],
    ['right_elbow', cx + elbowOffsetX, elbowY],
    ['left_wrist', cx - wristOffsetX, wristY],
    ['right_wrist', cx + wristOffsetX, wristY],
    ['left_hip', cx - 28, hipY],
    ['right_hip', cx + 28, hipY],
    ['left_knee', cx - kneeOffsetX, kneeY],
    ['right_knee', cx + kneeOffsetX, kneeY],
    ['left_ankle', cx - 32, ankleY],
    ['right_ankle', cx + 32, ankleY],
  ];

  return pts.map(([name, x, y]) => ({ name, x, y, score: 0.96 }));
}

export class PoseRepStateMachine {
  private exercise: PoseExerciseId;
  private ruleConfig: PoseRuleConfig;
  private stage: 'start' | 'bottom' = 'start';
  private pauseSatisfied = false;
  private bottomHoldMs = 0;
  private peakDepthAngle: number | null = null;
  private repCount = 0;
  private holdSeconds = 0;
  private lastTickMs = 0;
  private smoothedAngle: number | null = null;
  private scoreSamples: number[] = [];
  private faultSet: Set<string> = new Set();
  private paused = false;
  private lastPrimaryAngle = 0;
  private lastSymmetryScore = 100;

  constructor(exercise: PoseExerciseId = 'squat', customRules?: Partial<PoseRuleConfig>) {
    this.exercise = exercise;
    this.ruleConfig = { ...DEFAULT_POSE_RULES[exercise], ...customRules };
  }

  public setExercise(exercise: PoseExerciseId) {
    if (this.exercise !== exercise) {
      this.exercise = exercise;
      this.ruleConfig = { ...DEFAULT_POSE_RULES[exercise] };
      this.reset();
    }
  }

  public getRuleConfig(): PoseRuleConfig {
    return { ...this.ruleConfig };
  }

  public setRuleConfig(partial: Partial<PoseRuleConfig>) {
    this.ruleConfig = {
      ...this.ruleConfig,
      ...partial,
      pauseHoldMs: Math.max(0, Math.min(5000, partial.pauseHoldMs ?? this.ruleConfig.pauseHoldMs)),
      symmetryTolerance: Math.max(5, Math.min(45, partial.symmetryTolerance ?? this.ruleConfig.symmetryTolerance)),
    };
  }

  public setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) {
      this.lastTickMs = 0;
    }
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public reset() {
    this.stage = 'start';
    this.pauseSatisfied = false;
    this.bottomHoldMs = 0;
    this.peakDepthAngle = null;
    this.repCount = 0;
    this.holdSeconds = 0;
    this.lastTickMs = 0;
    this.smoothedAngle = null;
    this.scoreSamples = [];
    this.faultSet.clear();
    this.paused = false;
    this.lastPrimaryAngle = 0;
    this.lastSymmetryScore = 100;
  }

  public getAverageScore(): number {
    if (this.scoreSamples.length === 0) return 100;
    const sum = this.scoreSamples.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / this.scoreSamples.length);
  }

  public getUniqueFaults(): string[] {
    return Array.from(this.faultSet);
  }

  public evaluate(landmarks: Record<string, NormalizedLandmark>, nowMs = Date.now()): PoseFrameEvaluation {
    if (this.paused) {
      this.lastTickMs = 0;
      const reqPause = Math.max(1, this.ruleConfig.pauseHoldMs);
      return {
        primaryAngle: this.lastPrimaryAngle,
        secondaryAngle: null,
        symmetryScore: this.lastSymmetryScore,
        postureScore: this.getAverageScore(),
        phase: 'paused',
        repCount: this.repCount,
        holdSeconds: Math.round(this.holdSeconds),
        bottomHoldMs: Math.round(this.bottomHoldMs),
        bottomHoldProgress:
          this.ruleConfig.pauseHoldMs <= 0
            ? 100
            : Math.min(100, Math.round((this.bottomHoldMs / reqPause) * 100)),
        isPaused: true,
        faultsDetected: [],
        feedbackEn: 'Tracking paused. Press Resume or Spacebar to continue.',
        feedbackHi: 'ट्रैकिंग पॉज़ है। जारी रखने के लिए Resume या Space दबाएं।',
        severity: 'idle',
        completedRepJustNow: false,
        repTelemetry: null,
      };
    }

    const dtSec = this.lastTickMs > 0 ? Math.min(0.25, Math.max(0, (nowMs - this.lastTickMs) / 1000)) : 0;
    this.lastTickMs = nowMs;

    const frameFaults: string[] = [];
    let primaryAngle = 0;
    let secondaryAngle: number | null = null;
    let symmetryScore = 100;
    let framePostureScore = 95;
    let phase: PoseFrameEvaluation['phase'] = 'standby';
    let feedbackEn = 'Step into full view so joints are visible.';
    let feedbackHi = 'कैमरे के फ्रेम में पूरा शरीर दिखाएं।';
    let severity: PoseFrameEvaluation['severity'] = 'idle';
    let completedRepJustNow = false;
    let repTelemetry: RepTelemetryPoint | null = null;

    const lShoulder = landmarks.left_shoulder;
    const rShoulder = landmarks.right_shoulder;
    const lElbow = landmarks.left_elbow;
    const rElbow = landmarks.right_elbow;
    const lWrist = landmarks.left_wrist;
    const rWrist = landmarks.right_wrist;
    const lHip = landmarks.left_hip;
    const rHip = landmarks.right_hip;
    const lKnee = landmarks.left_knee;
    const rKnee = landmarks.right_knee;
    const lAnkle = landmarks.left_ankle;
    const rAnkle = landmarks.right_ankle;

    const smooth = (raw: number) => {
      this.smoothedAngle = this.smoothedAngle === null ? raw : this.smoothedAngle * 0.62 + raw * 0.38;
      return Math.round(this.smoothedAngle);
    };

    const rule = this.ruleConfig;

    const handleDepthHold = (
      currentAngle: number,
      isLowerBetter: boolean,
      faultMessageEn: string,
      faultMessageHi: string,
      cleanReadyEn: string,
      cleanReadyHi: string,
      faultScore: number,
      cleanScore: number
    ) => {
      this.bottomHoldMs += dtSec * 1000;
      this.peakDepthAngle =
        this.peakDepthAngle === null
          ? currentAngle
          : isLowerBetter
            ? Math.min(this.peakDepthAngle, currentAngle)
            : Math.max(this.peakDepthAngle, currentAngle);

      if (rule.pauseHoldMs > 0 && this.bottomHoldMs < rule.pauseHoldMs) {
        phase = 'pause_hold';
        const remainingSec = Math.max(0.1, (rule.pauseHoldMs - this.bottomHoldMs) / 1000).toFixed(1);
        feedbackEn = `Pause depth locked — hold ${remainingSec}s`;
        feedbackHi = `बॉटम पॉज़ होल्ड करें — ${remainingSec} सेकंड और`;
        severity = frameFaults.length ? 'fault' : 'warning';
        framePostureScore = frameFaults.length ? faultScore : Math.max(85, cleanScore - 4);
      } else {
        this.pauseSatisfied = true;
        phase = 'peak';
        if (frameFaults.length) {
          feedbackEn = faultMessageEn;
          feedbackHi = faultMessageHi;
          severity = 'fault';
          framePostureScore = faultScore;
        } else {
          feedbackEn = cleanReadyEn;
          feedbackHi = cleanReadyHi;
          severity = 'good';
          framePostureScore = cleanScore;
        }
      }
    };

    if (this.exercise === 'squat') {
      const leftOk = hasVisible(landmarks, ['left_hip', 'left_knee', 'left_ankle']);
      const rightOk = hasVisible(landmarks, ['right_hip', 'right_knee', 'right_ankle']);
      if (leftOk || rightOk) {
        const leftAng = leftOk ? calculateJointAngle(lHip, lKnee, lAnkle) : null;
        const rightAng = rightOk ? calculateJointAngle(rHip, rKnee, rAnkle) : null;
        const raw = leftAng !== null && rightAng !== null ? (leftAng + rightAng) / 2 : (leftAng ?? rightAng ?? 170);
        primaryAngle = smooth(raw);

        if (leftAng !== null && rightAng !== null) {
          secondaryAngle = Math.round(rightAng);
          const diff = Math.abs(leftAng - rightAng);
          symmetryScore = Math.max(40, Math.round(100 - diff * 1.6));
          if (diff > rule.symmetryTolerance) {
            frameFaults.push('asymmetric_drive');
          }
        }

        if (hasVisible(landmarks, ['left_knee', 'right_knee', 'left_ankle', 'right_ankle'])) {
          const kneeSpan = Math.abs(lKnee.x - rKnee.x);
          const ankleSpan = Math.abs(lAnkle.x - rAnkle.x);
          if (ankleSpan > 12 && kneeSpan < ankleSpan * 0.72 && primaryAngle < 130) {
            frameFaults.push('knee_valgus');
          }
        }

        if (primaryAngle > rule.startAngle) {
          if (this.stage === 'bottom' && this.pauseSatisfied) {
            this.repCount += 1;
            completedRepJustNow = true;
            const recordedScore = this.getAverageScore();
            repTelemetry = {
              repNumber: this.repCount,
              peakDepthAngle: this.peakDepthAngle ?? rule.targetAngle,
              holdMs: Math.round(this.bottomHoldMs),
              score: recordedScore,
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            feedbackEn = rule.pauseHoldMs > 0 ? 'Pause Squat verified! Rep counted.' : 'Clean lockout. Rep counted.';
            feedbackHi = rule.pauseHoldMs > 0 ? 'पॉज़ स्क्वाट पूरा! रैप दर्ज हुआ।' : 'शानदार लॉकआउट! रैप पूरा हुआ।';
          } else {
            feedbackEn =
              rule.pauseHoldMs > 0
                ? `Ready stance. Descend and hold ${(rule.pauseHoldMs / 1000).toFixed(1)}s at depth.`
                : 'Ready stance. Lower hips slowly.';
            feedbackHi =
              rule.pauseHoldMs > 0
                ? `तैयार स्थिति। नीचे बैठकर ${(rule.pauseHoldMs / 1000).toFixed(1)}s पॉज़ होल्ड करें।`
                : 'तैयार स्थिति। धीरे-धीरे नीचे बैठें।';
          }
          this.stage = 'start';
          this.pauseSatisfied = false;
          this.bottomHoldMs = 0;
          this.peakDepthAngle = null;
          phase = completedRepJustNow ? 'concentric' : 'standby';
          severity = 'good';
        } else if (primaryAngle <= rule.targetAngle) {
          this.stage = 'bottom';
          handleDepthHold(
            primaryAngle,
            true,
            'Push knees outward to fix knee valgus.',
            'घुटनों को अंदर न आने दें, बाहर की ओर रखें।',
            rule.pauseHoldMs > 0 ? 'Pause hold verified! Drive up through heels.' : 'Optimal squat depth. Drive up through heels.',
            rule.pauseHoldMs > 0 ? 'पॉज़ होल्ड पूरा! अब एड़ियों से ऊपर उठें।' : 'बढ़िया गहराई! एड़ियों से ऊपर उठें।',
            68,
            97
          );
        } else {
          phase = this.stage === 'bottom' ? 'concentric' : 'eccentric';
          feedbackEn = this.stage === 'bottom' ? 'Keep driving upward.' : 'Go slightly deeper to reach pause zone.';
          feedbackHi = this.stage === 'bottom' ? 'ऊपर उठना जारी रखें।' : 'पॉज़ ज़ोन तक थोड़ा और नीचे जाएं।';
          severity = frameFaults.length ? 'fault' : 'warning';
          framePostureScore = frameFaults.length ? 72 : 86;
        }
      }
    } else if (this.exercise === 'pushup') {
      const leftOk = hasVisible(landmarks, ['left_shoulder', 'left_elbow', 'left_wrist']);
      const rightOk = hasVisible(landmarks, ['right_shoulder', 'right_elbow', 'right_wrist']);
      if (leftOk || rightOk) {
        const leftAng = leftOk ? calculateJointAngle(lShoulder, lElbow, lWrist) : null;
        const rightAng = rightOk ? calculateJointAngle(rShoulder, rElbow, rWrist) : null;
        const raw = leftAng !== null && rightAng !== null ? (leftAng + rightAng) / 2 : (leftAng ?? rightAng ?? 165);
        primaryAngle = smooth(raw);

        if (hasVisible(landmarks, ['left_shoulder', 'left_hip', 'left_ankle'])) {
          const plankAng = calculateJointAngle(lShoulder, lHip, lAnkle);
          secondaryAngle = Math.round(plankAng);
          if (plankAng < 145) {
            frameFaults.push('hip_sag');
          }
        }

        if (primaryAngle > rule.startAngle) {
          if (this.stage === 'bottom' && this.pauseSatisfied) {
            this.repCount += 1;
            completedRepJustNow = true;
            repTelemetry = {
              repNumber: this.repCount,
              peakDepthAngle: this.peakDepthAngle ?? rule.targetAngle,
              holdMs: Math.round(this.bottomHoldMs),
              score: this.getAverageScore(),
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            feedbackEn = 'Full push-up lockout. Rep counted.';
            feedbackHi = 'पूरा लॉकआउट! पुश-अप रैप दर्ज हुआ।';
            severity = 'good';
          } else {
            feedbackEn = 'High plank aligned. Lower chest under control.';
            feedbackHi = 'प्लैंक सीधा रखें और छाती नीचे ले जाएं।';
            severity = frameFaults.includes('hip_sag') ? 'fault' : 'good';
          }
          this.stage = 'start';
          this.pauseSatisfied = false;
          this.bottomHoldMs = 0;
          this.peakDepthAngle = null;
          phase = completedRepJustNow ? 'concentric' : 'standby';
        } else if (primaryAngle <= rule.targetAngle) {
          this.stage = 'bottom';
          handleDepthHold(
            primaryAngle,
            true,
            'Tighten glutes and core to prevent hip sag.',
            'कमर को नीचे न झुकने दें, कोर टाइट रखें।',
            'Pause verified! Press up explosively.',
            'पॉज़ पूरा! अब ऊपर पुश करें।',
            70,
            96
          );
        } else {
          phase = this.stage === 'bottom' ? 'concentric' : 'eccentric';
          feedbackEn = `Lower chest toward ${rule.targetAngle}° elbow pause zone.`;
          feedbackHi = `कोहनी को ${rule.targetAngle}° तक मोड़ें।`;
          severity = frameFaults.length ? 'fault' : 'warning';
          framePostureScore = frameFaults.length ? 74 : 88;
        }
      }
    } else if (this.exercise === 'deadlift') {
      const leftOk = hasVisible(landmarks, ['left_shoulder', 'left_hip', 'left_knee']);
      const rightOk = hasVisible(landmarks, ['right_shoulder', 'right_hip', 'right_knee']);
      if (leftOk || rightOk) {
        const leftAng = leftOk ? calculateJointAngle(lShoulder, lHip, lKnee) : null;
        const rightAng = rightOk ? calculateJointAngle(rShoulder, rHip, rKnee) : null;
        const raw = leftAng !== null && rightAng !== null ? (leftAng + rightAng) / 2 : (leftAng ?? rightAng ?? 168);
        primaryAngle = smooth(raw);

        if (primaryAngle > rule.startAngle) {
          if (this.stage === 'bottom' && this.pauseSatisfied) {
            this.repCount += 1;
            completedRepJustNow = true;
            repTelemetry = {
              repNumber: this.repCount,
              peakDepthAngle: this.peakDepthAngle ?? rule.targetAngle,
              holdMs: Math.round(this.bottomHoldMs),
              score: this.getAverageScore(),
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            feedbackEn = 'Clean hip lockout without hyperextension.';
            feedbackHi = 'बढ़िया हिप लॉकआउट! रैप पूरा हुआ।';
          } else {
            feedbackEn = 'Brace core, hinge hips back smoothly.';
            feedbackHi = 'कोर टाइट करें और हिप्स को पीछे मोड़ें।';
          }
          this.stage = 'start';
          this.pauseSatisfied = false;
          this.bottomHoldMs = 0;
          this.peakDepthAngle = null;
          phase = completedRepJustNow ? 'concentric' : 'standby';
          severity = 'good';
        } else if (primaryAngle <= rule.targetAngle) {
          this.stage = 'bottom';
          if (primaryAngle < 78) {
            frameFaults.push('rounded_back');
          }
          handleDepthHold(
            primaryAngle,
            true,
            'Keep chest proud—avoid lower back rounding.',
            'कमर सीधी रखें, पीठ को झुकने न दें।',
            'Strong hip hinge pause verified. Stand up tall.',
            'सही हिप हिंज पॉज़! अब ऊपर खड़े हों।',
            66,
            95
          );
        } else {
          phase = this.stage === 'bottom' ? 'concentric' : 'eccentric';
          feedbackEn = 'Maintain neutral spine through the pull.';
          feedbackHi = 'पूरी लिफ्ट में रीढ़ की हड्डी सीधी रखें।';
          severity = 'warning';
          framePostureScore = 88;
        }
      }
    } else if (this.exercise === 'bicep_curl') {
      const leftOk = hasVisible(landmarks, ['left_shoulder', 'left_elbow', 'left_wrist']);
      const rightOk = hasVisible(landmarks, ['right_shoulder', 'right_elbow', 'right_wrist']);
      if (leftOk || rightOk) {
        const leftAng = leftOk ? calculateJointAngle(lShoulder, lElbow, lWrist) : null;
        const rightAng = rightOk ? calculateJointAngle(rShoulder, rElbow, rWrist) : null;
        const raw = leftAng !== null && rightAng !== null ? (leftAng + rightAng) / 2 : (leftAng ?? rightAng ?? 155);
        primaryAngle = smooth(raw);

        if (leftAng !== null && rightAng !== null) {
          secondaryAngle = Math.round(rightAng);
          const diff = Math.abs(leftAng - rightAng);
          symmetryScore = Math.max(45, Math.round(100 - diff * 1.4));
          if (diff > rule.symmetryTolerance) {
            frameFaults.push('asymmetric_drive');
          }
        }

        if (hasVisible(landmarks, ['left_shoulder', 'left_elbow', 'left_hip'])) {
          const swingAng = calculateJointAngle(lHip, lShoulder, lElbow);
          if (swingAng > 32) {
            frameFaults.push('elbow_swing');
          }
        }

        if (primaryAngle > rule.startAngle) {
          if (this.stage === 'bottom' && this.pauseSatisfied) {
            this.repCount += 1;
            completedRepJustNow = true;
            repTelemetry = {
              repNumber: this.repCount,
              peakDepthAngle: this.peakDepthAngle ?? rule.targetAngle,
              holdMs: Math.round(this.bottomHoldMs),
              score: this.getAverageScore(),
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            feedbackEn = 'Full curl tempo verified. Rep counted.';
            feedbackHi = 'पूरा बाइसेप रैप दर्ज हुआ।';
          } else {
            feedbackEn = 'Full extension at bottom. Curl with control.';
            feedbackHi = 'हाथ पूरा सीधा। अब धीरे से ऊपर कर्ल करें।';
          }
          this.stage = 'start';
          this.pauseSatisfied = false;
          this.bottomHoldMs = 0;
          this.peakDepthAngle = null;
          phase = 'standby';
          severity = frameFaults.length ? 'warning' : 'good';
        } else if (primaryAngle <= rule.targetAngle) {
          this.stage = 'bottom';
          handleDepthHold(
            primaryAngle,
            true,
            'Pin elbows to ribs—avoid swinging shoulder.',
            'कोहनी को शरीर के पास स्थिर रखें।',
            'Peak bicep squeeze hold verified! Lower slowly.',
            'बढ़िया पीक होल्ड! अब धीरे नीचे लाएं।',
            72,
            97
          );
        } else {
          phase = this.stage === 'start' ? 'eccentric' : 'concentric';
          feedbackEn = 'Control the tempo without momentum.';
          feedbackHi = 'बिना झटके के कंट्रोल में कर्ल करें।';
          severity = frameFaults.length ? 'fault' : 'good';
        }
      }
    } else if (this.exercise === 'shoulder_press') {
      const leftOk = hasVisible(landmarks, ['left_shoulder', 'left_elbow', 'left_wrist']);
      const rightOk = hasVisible(landmarks, ['right_shoulder', 'right_elbow', 'right_wrist']);
      if (leftOk || rightOk) {
        const leftAng = leftOk ? calculateJointAngle(lShoulder, lElbow, lWrist) : null;
        const rightAng = rightOk ? calculateJointAngle(rShoulder, rElbow, rWrist) : null;
        const raw = leftAng !== null && rightAng !== null ? (leftAng + rightAng) / 2 : (leftAng ?? rightAng ?? 85);
        primaryAngle = smooth(raw);

        if (primaryAngle < rule.startAngle) {
          if (this.stage === 'bottom' && this.pauseSatisfied) {
            this.repCount += 1;
            completedRepJustNow = true;
            repTelemetry = {
              repNumber: this.repCount,
              peakDepthAngle: this.peakDepthAngle ?? rule.targetAngle,
              holdMs: Math.round(this.bottomHoldMs),
              score: this.getAverageScore(),
              timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            feedbackEn = 'Overhead lockout rep counted.';
            feedbackHi = 'ओवरहेड प्रेस रैप पूरा हुआ।';
          } else {
            feedbackEn = 'Rack position locked. Press straight overhead.';
            feedbackHi = 'रैक पोजिशन तैयार। सीधा ऊपर प्रेस करें।';
          }
          this.stage = 'start';
          this.pauseSatisfied = false;
          this.bottomHoldMs = 0;
          this.peakDepthAngle = null;
          phase = 'standby';
          severity = 'good';
        } else if (primaryAngle >= rule.targetAngle) {
          this.stage = 'bottom';
          handleDepthHold(
            primaryAngle,
            false,
            'Align ribs over hips at overhead lockout.',
            'लॉकआउट पर कमर को सीधा रखें।',
            'Overhead lockout hold verified! Lower smoothly.',
            'पूरा लॉकआउट होल्ड! धीरे नीचे लाएं।',
            78,
            96
          );
        } else {
          phase = 'concentric';
          feedbackEn = 'Keep wrists stacked directly over elbows.';
          feedbackHi = 'कलाई को कोहनी के ठीक ऊपर रखें।';
          severity = 'warning';
          framePostureScore = 89;
        }
      }
    } else if (this.exercise === 'plank') {
      const leftOk = hasVisible(landmarks, ['left_shoulder', 'left_hip', 'left_ankle']);
      const rightOk = hasVisible(landmarks, ['right_shoulder', 'right_hip', 'right_ankle']);
      if (leftOk || rightOk) {
        const leftAng = leftOk ? calculateJointAngle(lShoulder, lHip, lAnkle) : null;
        const rightAng = rightOk ? calculateJointAngle(rShoulder, rHip, rAnkle) : null;
        const raw = leftAng !== null && rightAng !== null ? (leftAng + rightAng) / 2 : (leftAng ?? rightAng ?? 175);
        primaryAngle = smooth(raw);
        phase = 'hold';

        if (primaryAngle >= rule.startAngle && primaryAngle <= 190) {
          this.holdSeconds += dtSec;
          this.bottomHoldMs = this.holdSeconds * 1000;
          feedbackEn = `Clean spinal plank alignment (${Math.floor(this.holdSeconds)}s).`;
          feedbackHi = `सही प्लैंक लाइन (${Math.floor(this.holdSeconds)} सेकंड)।`;
          severity = 'good';
          framePostureScore = 98;
        } else {
          frameFaults.push('hip_sag');
          feedbackEn = 'Align hips straight between shoulders and ankles.';
          feedbackHi = 'कमर को कंधे और टखनों की सीध में रखें।';
          severity = 'fault';
          framePostureScore = 65;
        }
      }
    }

    if (severity !== 'idle') {
      this.scoreSamples.push(framePostureScore);
      if (this.scoreSamples.length > 180) this.scoreSamples.shift();
      frameFaults.forEach((f) => this.faultSet.add(f));
      this.lastPrimaryAngle = primaryAngle;
      this.lastSymmetryScore = symmetryScore;
    }

    const reqHold = Math.max(1, rule.pauseHoldMs);
    const bottomHoldProgress =
      this.exercise === 'plank'
        ? 100
        : rule.pauseHoldMs <= 0
          ? this.stage === 'bottom'
            ? 100
            : 0
          : Math.min(100, Math.round((this.bottomHoldMs / reqHold) * 100));

    return {
      primaryAngle,
      secondaryAngle,
      symmetryScore,
      postureScore: severity === 'idle' ? this.getAverageScore() : framePostureScore,
      phase,
      repCount: this.repCount,
      holdSeconds: Math.round(this.holdSeconds),
      bottomHoldMs: Math.round(this.bottomHoldMs),
      bottomHoldProgress,
      isPaused: false,
      faultsDetected: frameFaults,
      feedbackEn,
      feedbackHi,
      severity,
      completedRepJustNow,
      repTelemetry,
    };
  }
}

const SKELETON_EDGES: Array<[string, string]> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

const EXERCISE_ANGLE_TRIPLETS: Record<PoseExerciseId, [string, string, string]> = {
  squat: ['left_hip', 'left_knee', 'left_ankle'],
  pushup: ['left_shoulder', 'left_elbow', 'left_wrist'],
  deadlift: ['left_shoulder', 'left_hip', 'left_knee'],
  bicep_curl: ['left_shoulder', 'left_elbow', 'left_wrist'],
  shoulder_press: ['left_shoulder', 'left_elbow', 'left_wrist'],
  plank: ['left_shoulder', 'left_hip', 'left_ankle'],
};

export function renderPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: Record<string, NormalizedLandmark>,
  evaluation: PoseFrameEvaluation,
  width: number,
  height: number,
  options?: { isSynthetic?: boolean; primaryJoint?: string; exercise?: PoseExerciseId }
) {
  const accentColor =
    evaluation.phase === 'paused'
      ? '#94A3B8'
      : evaluation.phase === 'pause_hold'
        ? '#06B6D4'
        : evaluation.severity === 'fault'
          ? '#EF4444'
          : evaluation.severity === 'warning'
            ? '#F59E0B'
            : '#10B981';

  if (options?.isSynthetic) {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Bone segments
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = accentColor;

  for (const [aName, bName] of SKELETON_EDGES) {
    const a = landmarks[aName];
    const b = landmarks[bName];
    if (a && b && a.score >= 0.25 && b.score >= 0.25) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // Geometric joint angle wedge around active triplet
  const triplet = EXERCISE_ANGLE_TRIPLETS[options?.exercise || 'squat'];
  const jointA = landmarks[triplet[0]];
  const jointB = landmarks[triplet[1]];
  const jointC = landmarks[triplet[2]];
  if (jointA && jointB && jointC && jointA.score >= 0.25 && jointB.score >= 0.25 && jointC.score >= 0.25) {
    const ang1 = Math.atan2(jointA.y - jointB.y, jointA.x - jointB.x);
    const ang2 = Math.atan2(jointC.y - jointB.y, jointC.x - jointB.x);
    let diff = ang2 - ang1;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(jointB.x, jointB.y);
    ctx.arc(jointB.x, jointB.y, 28, ang1, ang1 + diff, diff < 0);
    ctx.closePath();
    ctx.fillStyle = evaluation.phase === 'pause_hold' ? 'rgba(6, 182, 212, 0.22)' : 'rgba(16, 185, 129, 0.16)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = accentColor;
    ctx.stroke();

    // Pause hold radial arc outside the angle wedge when pausing at depth
    if (evaluation.bottomHoldProgress > 0 && (evaluation.phase === 'pause_hold' || evaluation.phase === 'peak')) {
      ctx.beginPath();
      ctx.arc(
        jointB.x,
        jointB.y,
        36,
        -Math.PI / 2,
        -Math.PI / 2 + (Math.PI * 2 * Math.min(100, evaluation.bottomHoldProgress)) / 100
      );
      ctx.strokeStyle = evaluation.bottomHoldProgress >= 100 ? '#10B981' : '#22D3EE';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Joints
  Object.values(landmarks).forEach((lm) => {
    if (lm.score < 0.25) return;
    ctx.beginPath();
    ctx.arc(lm.x, lm.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = accentColor;
    ctx.stroke();
  });

  // Head ring
  const nose = landmarks.nose;
  if (nose && nose.score >= 0.25) {
    ctx.beginPath();
    ctx.arc(nose.x, nose.y - 6, 18, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Joint angle telemetry tag directly at primary pivot joint
  const pivot =
    landmarks[options?.primaryJoint || 'left_knee'] ||
    landmarks.left_elbow ||
    landmarks.left_hip;
  if (pivot && pivot.score >= 0.25 && evaluation.primaryAngle > 0) {
    const pauseTag =
      evaluation.phase === 'pause_hold'
        ? ` · HOLD ${evaluation.bottomHoldProgress}%`
        : evaluation.phase === 'peak' && evaluation.bottomHoldMs > 0
          ? ` · LOCKED`
          : '';
    const label = `${evaluation.primaryAngle}°${pauseTag}`;
    ctx.font = '600 14px "JetBrains Mono", monospace';
    const textW = ctx.measureText(label).width;
    const tx = Math.min(width - textW - 22, pivot.x + 14);
    const ty = Math.max(28, pivot.y - 12);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(tx - 6, ty - 16, textW + 12, 22);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx - 6, ty - 16, textW + 12, 22);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(label, tx, ty);
  }

  if (evaluation.isPaused) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRACKING PAUSED', width / 2, height / 2 - 8);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillText('PRESS RESUME OR SPACEBAR TO CONTINUE', width / 2, height / 2 + 18);
    ctx.textAlign = 'start';
  }
}
