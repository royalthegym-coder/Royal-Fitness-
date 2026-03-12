
import { Package, Member, Invoice, Staff, Expense, Lead, Transaction, HealthData, WorkoutTemplate, DietPlan, MemberFitnessData, ActivityEvent, Task, MedicalTestMaster, InventoryItem, BroadcastMessage } from './types';

export const APP_METADATA = {
    version: "1.0.0", // Stable Origin Release
    name: "Royal Origin OS"
};

export const GYM_INFO = {
  name: 'Royal The Gym',
  logo: 'https://i.ibb.co/6800735/Royal-The-Gym.png',
  paymentQr: '/assets/payment_qr.png', 
  contact: '+91 9785300123',
  whatsappNumber: '+91 9785300123',
  email: 'royalthegym@gmail.com',
  address: '2nd floor, Vishwakarma Complex, Gandhi Chowk, Khemi Sati Road, Jhunjhunu, Rajasthan- 333001',
  website: 'https://royal-the-gym.grexa.site',
  coordinates: { latitude: 28.1289, longitude: 75.3995 },
  upiIds: { gpay1: '9785300123@okbizaxis', gpay2: 'royalthegym@oksbi' },
  bankDetails: {
      accountName: 'Royal The Gym',
      accountNumber: '9785300123',
      ifsc: 'OKBIZ000AXIS',
      bankName: 'Ok Biz Axis Bank'
  }
};

export const MEDICAL_TEST_MASTER: MedicalTestMaster[] = [
    { test_id: 't1', test_name: 'Testosterone Panel (Total & Free)', category: 'Hormonal', description: 'Crucial for muscle growth potential and recovery speed.' },
    { test_id: 't2', test_name: 'Vitamin D3 & B12', category: 'Nutritional', description: 'Essential for bone density, energy levels, and nerve function.' },
    { test_id: 't3', test_name: 'Thyroid Profile (TSH, T3, T4)', category: 'Metabolic', description: 'Determines metabolic rate (Fat Loss vs Muscle Gain strategy).' },
    { test_id: 't4', test_name: 'Complete Blood Count (CBC)', category: 'General Health', description: 'Checks for infection, anemia, and overall immunity.' },
    { test_id: 't5', test_name: 'Lipid Profile & Glucose', category: 'Cardiovascular', description: 'Heart health and insulin sensitivity for diet planning.' },
];

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_STAFF: Staff[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_HEALTH_DATA: HealthData = {
    date: new Date().toISOString().split('T')[0],
    steps: 0,
    heartRate: { avg: 0, hrv: 0, max: 0, min: 0, history: [] },
    caloriesBurned: 0,
    glucose: { current: 0, trend: 'stable', history: [] },
    circadian: { phase: 'Awake', efficiency: 0 },
    sleep: { totalHours: 0, deepHours: 0, remHours: 0 }
};

export const INITIAL_GOOGLE_REVIEWS: any[] = [];

export const INITIAL_GOOGLE_POSTS: any[] = [];

export const INITIAL_GOOGLE_INSIGHTS = {
    views: 1200,
    searches: 450,
    actions: 85,
    calls: 25,
    directions: 40,
    websiteClicks: 20
};

export const INITIAL_PACKAGES: Package[] = [
    {
        id: 1,
        name: "Quantum Starter",
        category: "Basic",
        price: 1500,
        duration: "1 Month",
        features: ["Access to Gym Floor", "Basic Diet Plan", "1 AI Body Scan/Month", "Standard Support"]
    },
    {
        id: 2,
        name: "Neural Pro",
        category: "Pro",
        price: 4000,
        duration: "3 Months",
        features: ["Access to Gym Floor", "Advanced Diet Plan", "Weekly AI Body Scans", "Priority Support"]
    },
    {
        id: 3,
        name: "Singularity Elite",
        category: "Elite",
        price: 7500,
        duration: "6 Months",
        features: ["24/7 Access", "Hyper-Personalized Diet", "Daily AI Vitals Tracking", "Dedicated AI Coach", "Free Supplements Starter Kit"]
    },
    {
        id: 4,
        name: "Royal Overmind",
        category: "VIP",
        price: 12000,
        duration: "1 Year",
        features: ["Unlimited 24/7 Access", "Quantum DNA Analysis", "Full Medical Profiling", "Unlimited AI Coaching", "VIP Locker", "Free Merchandise"]
    }
];

const generateWorkouts = (): WorkoutTemplate[] => {
    const templates: WorkoutTemplate[] = [];
    let idCounter = 1;

    const levels = [
        { name: 'Beginner', count: 18, prefix: 'Foundation Phase' },
        { name: 'Intermediate', count: 20, prefix: 'Hypertrophy Protocol' },
        { name: 'Advanced', count: 24, prefix: 'Elite Strength Matrix' },
        { name: 'Pro Advance', count: 28, prefix: 'Singularity CNS Overdrive' }
    ];

    levels.forEach(level => {
        for (let i = 1; i <= level.count; i++) {
            templates.push({
                id: idCounter++,
                name: `${level.prefix} v${i}.0`,
                level: level.name as any,
                category: 'Scientific Periodization',
                description: `Advanced AI-generated ${level.name} protocol utilizing N8N workflow automation and GitHub version control for optimal neuromuscular adaptation. Phase ${i}.`,
                duration: '4 Weeks',
                frequency: '4 Days/Week',
                preWorkout: {
                    name: 'Neural Activation',
                    exercises: [
                        { name: 'Dynamic CNS Warmup', sets: '2', reps: '60s' },
                        { name: 'Mobility Flow', sets: '2', reps: '10' }
                    ]
                },
                mainWorkout: [
                    {
                        name: 'Primary Load Vector',
                        exercises: [
                            { name: 'Compound Movement A', sets: '4', reps: '8-10' },
                            { name: 'Compound Movement B', sets: '4', reps: '8-10' },
                            { name: 'Isolation Matrix C', sets: '3', reps: '12-15' }
                        ]
                    }
                ],
                finisher: {
                    name: 'Metabolic Flush',
                    exercises: [
                        { name: 'HIIT Protocol Alpha', sets: '3', reps: 'Failure' }
                    ]
                }
            });
        }
    });
    return templates;
};

export const INITIAL_WORKOUT_TEMPLATES: WorkoutTemplate[] = generateWorkouts();

const generateDiets = (): DietPlan[] => {
    const diets: DietPlan[] = [];
    let idCounter = 1;
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Pro Advance'];
    
    levels.forEach(level => {
        for(let i=1; i<=20; i++) {
            diets.push({
                id: idCounter++,
                name: `Nutritional Matrix ${level} v${i}.0`,
                level: level as any,
                goal: 'Metabolic Optimization',
                calories: 2000 + (i * 50),
                macros: { protein: 150 + i*2, carbs: 200 + i*5, fats: 60 + i },
                description: `AI-optimized macronutrient partitioning protocol. Synced via N8N data pipelines. Phase ${i}.`,
                duration: '4 Weeks',
                meals: [
                    {
                        name: 'Pre-Training Fuel',
                        time: '08:00 AM',
                        totalCalories: 400,
                        macros: { protein: 30, carbs: 50, fats: 10 },
                        items: [{ food: 'Engineered Oats', portion: '100g', calories: 350, protein: 15, carbs: 60, fats: 5 }]
                    },
                    {
                        name: 'Post-Training Recovery',
                        time: '01:00 PM',
                        totalCalories: 600,
                        macros: { protein: 50, carbs: 80, fats: 10 },
                        items: [{ food: 'Lean Protein Synthesis Bowl', portion: '1 serving', calories: 600, protein: 50, carbs: 80, fats: 10 }]
                    }
                ]
            });
        }
    });
    return diets;
};

export const INITIAL_DIETS: DietPlan[] = generateDiets();

export const INITIAL_MEMBER_SCHEDULES: any = {};

export const INITIAL_MEMBER_FITNESS_DATA: MemberFitnessData = {};

export const INITIAL_ACTIVITY_EVENTS: ActivityEvent[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_BROADCASTS: BroadcastMessage[] = [];

// Initial Inventory with new Medicine Category
export const INITIAL_INVENTORY: InventoryItem[] = [];
