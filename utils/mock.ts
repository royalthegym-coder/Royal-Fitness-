// Comprehensive Mocks for heavyweight AI and 3D Libraries
// Used to keep bundler memory usage under the Sandbox container constraints

// Three.js Mocks
export const WebGLRenderer = class { setSize() {}; render() {}; dispose() {} };
export const Scene = class { add() {}; remove() {} };
export const PerspectiveCamera = class { position = { z: 0, set: () => {} }; aspect = 1; updateProjectionMatrix() {} };
export const Group = class { add() {}; remove() {} };
export const AmbientLight = class {};
export const DirectionalLight = class {};
export const PointLight = class {};
export const MeshStandardMaterial = class {};
export const MeshBasicMaterial = class {};
export const MeshPhysicalMaterial = class {};
export const LineBasicMaterial = class {};
export const BufferGeometry = class { setFromPoints() {} };
export const SphereGeometry = class {};
export const BoxGeometry = class {};
export const CylinderGeometry = class {};
export const IcosahedronGeometry = class {};
export const Mesh = class { rotation = { x: 0, y: 0 }; position = { set: () => {} } };
export const Line = class {};
export const GridHelper = class {};
export const Raycaster = class { setFromCamera() {}; intersectObjects() { return [] } };
export const Vector2 = class { x = 0; y = 0 };
export const Vector3 = class { constructor(x=0, y=0, z=0) {} };
export const Color = class { set() {}; setHex() {} };

export const Canvas = () => null;
export const useFrame = () => {};
export const OrbitControls = () => null;
export const Environment = () => null;
export const Float = () => null;
export const Sphere = () => null;
export const Box = () => null;
export const Cylinder = () => null;

// Recharts Mocks (in case any extra properties are needed)
export const PieChart = () => null;
export const Pie = () => null;
export const XAxis = () => null;
export const YAxis = () => null;
export const Cell = () => null;
export const Tooltip = () => null;
export const Legend = () => null;
export const ResponsiveContainer = ({ children }: any) => children || null;
export const LineChart = () => null;
export const AreaChart = () => null;
export const Area = () => null;
export const BarChart = () => null;
export const Bar = () => null;
export const CartesianGrid = () => null;
export const RadarChart = () => null;
export const PolarGrid = () => null;
export const PolarAngleAxis = () => null;
export const PolarRadiusAxis = () => null;
export const Radar = () => null;
export const ScatterChart = () => null;
export const Scatter = () => null;
export const ZAxis = () => null;
export const ComposedChart = () => null;
export const ReferenceLine = () => null;

// MediaPipe Pose & FaceMesh Mocks
export const Pose = class { setOptions() {}; onResults() {}; close() {}; send() { return Promise.resolve() } };
export const POSE_CONNECTIONS = [];
export const Results = class {};
export const FaceMesh = class { setOptions() {}; onResults() {}; close() {}; send() { return Promise.resolve() } };

// MediaPipe Camera & Drawing Mocks
export const Camera = class { setOptions() {}; onResults() {}; close() {}; send() { return Promise.resolve() } };
export const drawConnectors = () => {};
export const drawLandmarks = () => {};

// TensorFlow Core & Models Mocks
export const ready = () => Promise.resolve();
export const SupportedModels = { MoveNet: 'movenet' };
export const movenet = { modelType: { SINGLEPOSE_LIGHTNING: 'singlepose_lightning' } };
export const createDetector = () => Promise.resolve({ estimatePoses: () => Promise.resolve([]) });
export const util = { getAdjacentPairs: () => [] };

// Xenova/Transformers Mocks
export const pipeline = () => Promise.resolve(() => ({}));
export const env = { cacheDir: '', allowLocalModels: false };

// Google GenAI & jsPDF Mocks
export const GoogleGenAI = class { constructor() {} getGenerativeModel() { return { generateContentStream: async function*() { yield { text: () => '' } }, generateContent: async () => ({ text: () => '' }) } } };
export const Type = { STRING: 'text', BOOLEAN: 'boolean', ARRAY: 'array', OBJECT: 'object' };
export const Modality = { TEXT: 'text', IMAGE: 'image' };
export const ThinkingLevel = { LEVEL_0: 'level_0' };
export const jsPDF = class { constructor() {} save() {} text() {} addPage() {} };

export const Brain = () => null;
export const ScanFace = () => null;

export default function defaultMock() { return Promise.resolve(document.createElement('canvas')); };
