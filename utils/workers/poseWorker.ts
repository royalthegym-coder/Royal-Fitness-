export type PoseWorkerInput = {
    landmarks: any[];
    time: number;
};

export type PoseWorkerOutput = {
    neuralDrive: number;
    symmetry: number;
    velocity: number;
    formScore: number;
    smoothedLandmarks: any[];
};

// Helper to calculate angle between 3 points (e.g., Shoulder, Elbow, Wrist)
function calculateAngle(a: any, b: any, c: any) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

// --- SKELETON DRIFT FIX: EMA FILTER (Low-Pass Filter) ---
class PoseSmoother {
    alpha: number;
    prevLandmarks: any[] | null;

    constructor(alpha = 0.5) {
        this.alpha = alpha;
        this.prevLandmarks = null;
    }

    smooth(currentLandmarks: any[]) {
        if (!this.prevLandmarks || this.prevLandmarks.length !== currentLandmarks.length) {
            this.prevLandmarks = currentLandmarks;
            return currentLandmarks;
        }

        const smoothed = currentLandmarks.map((point, index) => {
            const prevPoint = this.prevLandmarks![index];
            return {
                ...point,
                x: (this.alpha * point.x) + ((1 - this.alpha) * prevPoint.x),
                y: (this.alpha * point.y) + ((1 - this.alpha) * prevPoint.y),
                z: (this.alpha * point.z) + ((1 - this.alpha) * prevPoint.z),
            };
        });

        this.prevLandmarks = smoothed;
        return smoothed;
    }
}

const smoother = new PoseSmoother(0.5); // alpha = 0.5 for balance between responsiveness and smoothness

// यह Web Worker अलग थ्रेड (Isolate) पर काम करेगा
self.onmessage = (e: MessageEvent<PoseWorkerInput>) => {
    const { landmarks, time } = e.data;
    
    if (!landmarks || landmarks.length < 33) {
        return;
    }

    // Apply Low-Pass Filter to smooth out jitter/drift
    const smoothedLandmarks = smoother.smooth(landmarks);

    // --- HEAVY MATH / POSE PROCESSING ---
    // यहाँ MediaPipe के लैंडमार्क्स की भारी गणितीय गणना (Complex Math) हो रही है
    
    // 1. Calculate elbow angles for symmetry using SMOOTHED landmarks
    const leftShoulder = smoothedLandmarks[11];
    const leftElbow = smoothedLandmarks[13];
    const leftWrist = smoothedLandmarks[15];
    const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    const rightShoulder = smoothedLandmarks[12];
    const rightElbow = smoothedLandmarks[14];
    const rightWrist = smoothedLandmarks[16];
    const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

    // 2. Calculate Symmetry (0 to 100, 50 is perfect balance)
    const diff = Math.abs(leftAngle - rightAngle);
    // If left angle is greater, it leans one way, else the other
    const symmetry = Math.max(0, Math.min(100, 50 + (leftAngle > rightAngle ? diff : -diff) * 0.3));

    // 3. Form Score based on stability and symmetry
    const formScore = Math.max(0, Math.min(100, 100 - diff * 0.5));

    // 4. Neural Drive & Velocity (Simulated based on time and movement for now)
    const driveNoise = Math.sin(time / 1000) * 8;
    const currentDrive = Math.max(0, Math.min(100, 92 + driveNoise));

    const vCycle = Math.abs(Math.cos(time / 500));
    const velocity = parseFloat(vCycle.toFixed(2));

    // Send results back to main thread (UI)
    self.postMessage({
        neuralDrive: Math.floor(currentDrive),
        symmetry,
        velocity,
        formScore: Math.floor(formScore),
        smoothedLandmarks
    });
};
