
import { Package, Member, Invoice, Staff, Expense, Lead, Transaction, HealthData, WorkoutTemplate, MemberSchedules, DailyRoutineLog, AIRecommendation, MedicalReport, BroadcastMessage, GoogleReview, GoogleBusinessPost, DietPlan, MemberFitnessData, ActivityEvent, Task, MedicalTestMaster, InventoryItem } from './types';

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

export const INITIAL_PACKAGES: Package[] = [
  // --- STRENGTH CATEGORY ---
  { id: 1, name: 'Strength: Temperature Member', category: 'Strength', price: 1200, duration: '1 Month', features: ['Gym Access', 'Temporary Validity'] },
  { id: 2, name: 'Strength: New Member (1st Month)', category: 'Strength', price: 1500, duration: '1 Month', features: ['Registration Fee Included', 'Gym Access'] },
  { id: 3, name: 'Strength: Regular Monthly', category: 'Strength', price: 1000, duration: '1 Month', features: ['Gym Access', 'Standard Fee'] },
  { id: 4, name: 'Strength: Quarterly', category: 'Strength', price: 3000, duration: '3 Months', features: ['3 Month Access', 'Strength Area'] },
  { id: 5, name: 'Strength: Half-Yearly', category: 'Strength', price: 5000, duration: '6 Months', features: ['6 Month Access', 'Saver Pack'] },
  { id: 6, name: 'Strength: Yearly', category: 'Strength', price: 9000, duration: '12 Months', features: ['1 Year Access', 'Best Value'] },
  
  // --- CARDIO CATEGORY ---
  { id: 7, name: 'Cardio: Monthly', category: 'Cardio', price: 2000, duration: '1 Month', features: ['Treadmills', 'Ellipticals', 'Cycles'] },
  { id: 8, name: 'Cardio: Quarterly', category: 'Cardio', price: 5000, duration: '3 Months', features: ['Cardio Section', 'Weight Loss Focus'] },
  { id: 9, name: 'Cardio: Half-Yearly', category: 'Cardio', price: 9000, duration: '6 Months', features: ['Long Term Cardio', 'Fat Loss'] },
  { id: 10, name: 'Cardio: Yearly', category: 'Cardio', price: 16000, duration: '12 Months', features: ['Full Year Cardio', 'Ultimate Endurance'] },
  
  // --- AEROBICS CATEGORY ---
  { id: 11, name: 'Aerobics Workout', category: 'Aerobics', price: 2000, duration: '1 Month', features: ['Group Classes', 'Rhythmic Cardio'] },

  // --- AURA BOOST CATEGORY ---
  { id: 20, name: 'Aura Boost: Energy & Focus', category: 'Aura Boost', price: 1500, duration: '1 Month', features: ['Pre-workout Consultation', 'Energy Drink Access', 'Focus Training'] },
  { id: 21, name: 'Aura Boost: Recovery & Zen', category: 'Aura Boost', price: 2500, duration: '1 Month', features: ['Post-workout Massage', 'Yoga Sessions', 'Meditation Guide'] },

  // --- SUPPLEMENTS CATEGORY ---
  { id: 22, name: 'Whey Protein Isolate (2kg)', category: 'Supplements', price: 6500, duration: 'Item', features: ['High Quality Protein', 'Fast Absorption'] },
  { id: 23, name: 'Creatine Monohydrate (300g)', category: 'Supplements', price: 1200, duration: 'Item', features: ['Strength Gain', 'Muscle Volume'] },
  { id: 24, name: 'BCAA Energy (30 Servings)', category: 'Supplements', price: 1800, duration: 'Item', features: ['Intra-workout Recovery', 'Electrolytes'] },

  // --- ACCESSORIES CATEGORY ---
  { id: 25, name: 'Premium Lifting Belt', category: 'Accessories', price: 1500, duration: 'Item', features: ['Leather Core Support', 'Adjustable'] },
  { id: 26, name: 'Wrist Wraps (Pair)', category: 'Accessories', price: 500, duration: 'Item', features: ['Heavy Lifting Support', 'Durable'] },
  { id: 27, name: 'Gym Shaker Bottle (700ml)', category: 'Accessories', price: 300, duration: 'Item', features: ['BPA Free', 'Leak Proof'] },

  // --- APPAREL CATEGORY ---
  { id: 28, name: 'Royal Gym T-Shirt (Dry Fit)', category: 'Apparel', price: 800, duration: 'Item', features: ['Sweat Wicking', 'Athletic Fit'] },
  { id: 29, name: 'Compression Shorts', category: 'Apparel', price: 1000, duration: 'Item', features: ['Muscle Support', 'Breathable'] },
  { id: 30, name: 'Gym Towel (Microfiber)', category: 'Apparel', price: 250, duration: 'Item', features: ['Quick Dry', 'Soft Texture'] },

  // --- PERSONAL TRAINING CATEGORY ---
  { id: 12, name: 'PT: Weight Loss (Monthly)', category: 'PT: Weight Loss', price: 3000, duration: '1 Month', features: ['Fat Loss Focus', 'Custom Diet', 'Weekly Check-in'] },
  { id: 13, name: 'PT: Muscle Gain (Monthly)', category: 'PT: Muscle Gain', price: 5000, duration: '1 Month', features: ['Hypertrophy Focus', 'High Protein Diet', 'Form Correction'] },
  { id: 14, name: 'PT: Bodybuilding (Monthly)', category: 'PT: Bodybuilding', price: 8000, duration: '1 Month', features: ['Competition Prep', 'Advanced Supplementation', 'Posing'] },
  { id: 15, name: 'PT: Powerlifting (Monthly)', category: 'PT: Powerlifting', price: 5000, duration: '1 Month', features: ['Strength Focus', 'SBD Specialization', 'Meet Prep'] },
  { id: 16, name: 'PT: General Fitness (Monthly)', category: 'PT: General Fitness', price: 3000, duration: '1 Month', features: ['Overall Health', 'Mobility', 'Functional Training'] },
  { id: 17, name: 'Personal Training: Quarterly', category: 'Personal Training', price: 12000, duration: '3 Months', features: ['3 Month PT', 'Advanced Diet', 'Body Composition Analysis'] },
  { id: 18, name: 'Personal Training: Half-Yearly', category: 'Personal Training', price: 22000, duration: '6 Months', features: ['6 Month PT', 'Supplement Guide', 'Priority Support'] },
  { id: 19, name: 'Personal Training: Yearly', category: 'Personal Training', price: 40000, duration: '12 Months', features: ['Ultimate Transformation', 'All Access', '24/7 Coach Access'] },
];

// SCIENTIFIC WORKOUT MATRIX
export const INITIAL_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  { 
    id: 101, name: 'Beginner: Full Body Genesis (15-20 Workouts)', level: 'Beginner', category: 'Foundation',
    description: 'Neural adaptation phase. 15-20 exercises. Focus on compound movements to build CNS efficiency. (Available in PDF & Video format)',
    exercises: [], 
    sections: [
        { name: 'Pre-Workout Plan', exercises: [
            { name: 'Jumping Jacks', sets: '2', reps: '1 min' }, 
            { name: 'Arm Circles', sets: '2', reps: '30s each way' },
            { name: 'High Knees', sets: '2', reps: '30s' },
            { name: 'Dynamic Lunges', sets: '2', reps: '10 per leg' },
            { name: 'Cat-Cow Stretch', sets: '2', reps: '10 reps' },
            { name: 'Thoracic Rotations', sets: '2', reps: '10 per side' }
        ] },
        { name: 'Real-Time Routine Workout Plan', exercises: [
            { name: 'Goblet Squat', sets: '3', reps: '12-15' }, 
            { name: 'Push Up (or Knee Push-up)', sets: '3', reps: 'Failure' }, 
            { name: 'Lat Pulldown', sets: '3', reps: '12' }, 
            { name: 'Dumbbell Shoulder Press', sets: '3', reps: '10' },
            { name: 'Leg Press', sets: '3', reps: '15' },
            { name: 'Dumbbell Row', sets: '3', reps: '12 per arm' },
            { name: 'Dumbbell Bicep Curl', sets: '3', reps: '12' },
            { name: 'Tricep Rope Pushdown', sets: '3', reps: '15' },
            { name: 'Lying Leg Curl', sets: '3', reps: '15' },
            { name: 'Dumbbell Lateral Raise', sets: '3', reps: '15' }
        ] },
        { name: 'Finisher Workout Plan', exercises: [
            { name: 'Plank', sets: '3', reps: '45s' },
            { name: 'Mountain Climbers', sets: '3', reps: '20 per leg' },
            { name: 'Bicycle Crunches', sets: '3', reps: '20 reps' },
            { name: 'Child\'s Pose (Cooldown)', sets: '1', reps: '1 min' },
            { name: 'Cobra Stretch (Cooldown)', sets: '1', reps: '1 min' }
        ] }
    ]
  },
  { 
    id: 201, name: 'Intermediate: Hypertrophy Matrix (20+ Workouts)', level: 'Intermediate', category: 'Hypertrophy',
    description: 'Volume-centric session targeting muscle growth. 20+ exercises. (Available in PDF & Video format)',
    sections: [
        { name: 'Pre-Workout Plan', exercises: [
            { name: 'Jump Rope', sets: '1', reps: '3 mins' }, 
            { name: 'Band Pull-Aparts', sets: '2', reps: '20' },
            { name: 'Inchworms', sets: '2', reps: '10 reps' },
            { name: 'Spiderman Lunges', sets: '2', reps: '10 per leg' },
            { name: 'Shoulder Dislocates', sets: '2', reps: '15 reps' },
            { name: 'Glute Bridges', sets: '2', reps: '15 reps' }
        ] },
        { name: 'Real-Time Routine Workout Plan', exercises: [
            { name: 'Barbell Back Squat', sets: '4', reps: '8-10' }, 
            { name: 'Barbell Bench Press', sets: '4', reps: '8-10' }, 
            { name: 'Pull-ups / Assisted Pull-ups', sets: '4', reps: '8-12' },
            { name: 'Seated Cable Row', sets: '4', reps: '12' },
            { name: 'Overhead Barbell Press', sets: '4', reps: '10' },
            { name: 'Romanian Deadlift', sets: '4', reps: '10-12' },
            { name: 'Leg Extension', sets: '3', reps: '15' },
            { name: 'Seated Leg Curl', sets: '3', reps: '15' },
            { name: 'Incline Dumbbell Press', sets: '3', reps: '12' },
            { name: 'Cable Lateral Raise', sets: '4', reps: '15' },
            { name: 'EZ Bar Bicep Curl', sets: '3', reps: '12' },
            { name: 'Overhead Tricep Extension', sets: '3', reps: '12' },
            { name: 'Dumbbell Flyes', sets: '3', reps: '12' },
            { name: 'Standing Calf Raises', sets: '4', reps: '20' }
        ] },
        { name: 'Finisher Workout Plan', exercises: [
            { name: 'Hanging Knee Raise', sets: '3', reps: '15' }, 
            { name: 'Russian Twist', sets: '3', reps: '20 per side' },
            { name: 'Kettlebell Swings', sets: '3', reps: '20' },
            { name: 'Burpees', sets: '3', reps: '15' },
            { name: 'Foam Rolling (Cooldown)', sets: '1', reps: '5 mins' }
        ] }
    ]
  },
  { 
    id: 301, name: 'Advanced: Titan Evolution (22-25 Workouts)', level: 'Advanced', category: 'Pro Split',
    description: 'High volume destruction. Time under tension focus. 22-25 Exercises. (Available in PDF & Video format)',
    sections: [
        { name: 'Pre-Workout Plan', exercises: [
            { name: 'Assault Bike', sets: '1', reps: '5 mins' }, 
            { name: 'Dynamic Stretching', sets: '1', reps: '5 mins' },
            { name: 'Scapular Pull-ups', sets: '3', reps: '10' },
            { name: 'Cossack Squats', sets: '3', reps: '8 per leg' },
            { name: 'Medicine Ball Slams', sets: '3', reps: '15' },
            { name: 'Box Jumps', sets: '3', reps: '10' },
            { name: 'Kettlebell Halos', sets: '2', reps: '10 per side' }
        ] },
        { name: 'Real-Time Routine Workout Plan', exercises: [
            { name: 'Deadlift (Conventional/Sumo)', sets: '5', reps: '5-8' }, 
            { name: 'Front Squat', sets: '4', reps: '8-10' }, 
            { name: 'Incline Barbell Press', sets: '4', reps: '8-10' },
            { name: 'Weighted Pull-ups', sets: '4', reps: '8' },
            { name: 'T-Bar Row', sets: '4', reps: '10-12' },
            { name: 'Dumbbell Arnold Press', sets: '4', reps: '10-12' },
            { name: 'Bulgarian Split Squat', sets: '4', reps: '10 per leg' },
            { name: 'Hack Squat', sets: '3', reps: '12' },
            { name: 'Cable Crossover', sets: '4', reps: '15' },
            { name: 'Face Pulls', sets: '4', reps: '15' },
            { name: 'Preacher Curl', sets: '4', reps: '12' },
            { name: 'Skull Crusher', sets: '4', reps: '12' },
            { name: 'Standing Calf Raise', sets: '5', reps: '20' },
            { name: 'Seated Calf Raise', sets: '4', reps: '15' }
        ] },
        { name: 'Finisher Workout Plan', exercises: [
            { name: 'Toes to Bar', sets: '4', reps: '12' }, 
            { name: 'Cable Woodchopper', sets: '4', reps: '15 per side' },
            { name: 'Battle Ropes', sets: '4', reps: '45s' },
            { name: 'Sled Push', sets: '4', reps: '20 meters' },
            { name: 'Static Stretching (Cooldown)', sets: '1', reps: '5 mins' }
        ] }
    ]
  },
  { 
    id: 401, name: 'Pro Advanced: God Tier Structure (25-30 Workouts)', level: 'Advanced', category: 'Elite',
    description: 'Elite level scientific routine designed to completely change body structure. 25-30 Exercises. (Available in PDF & Video format)',
    sections: [
        { name: 'Pre-Workout Plan', exercises: [
            { name: 'Rowing Machine', sets: '1', reps: '5 mins' }, 
            { name: 'Plyometric Push-ups', sets: '3', reps: '10' },
            { name: 'Broad Jumps', sets: '3', reps: '8' },
            { name: 'Banded Good Mornings', sets: '3', reps: '15' },
            { name: 'Turkish Get-Ups', sets: '2', reps: '5 per side' },
            { name: 'Overhead Squat (Empty Bar)', sets: '3', reps: '10' },
            { name: 'Bear Crawls', sets: '2', reps: '20 meters' },
            { name: 'Medicine Ball Throws', sets: '3', reps: '15' }
        ] },
        { name: 'Real-Time Routine Workout Plan', exercises: [
            { name: 'Snatch / Clean & Jerk', sets: '5', reps: '3-5' }, 
            { name: 'Zercher Squats', sets: '5', reps: '8' }, 
            { name: 'Deficit Deadlifts', sets: '5', reps: '6-8' },
            { name: 'Weighted Dips', sets: '5', reps: '8-10' },
            { name: 'Pendlay Rows', sets: '5', reps: '8-10' },
            { name: 'Z-Press', sets: '4', reps: '10' },
            { name: 'Pistol Squats', sets: '4', reps: '8 per leg' },
            { name: 'Glute Ham Raise (GHR)', sets: '4', reps: '10-12' },
            { name: 'Guillotine Press', sets: '4', reps: '10-12' },
            { name: 'Meadows Row', sets: '4', reps: '10 per arm' },
            { name: 'Spider Curls', sets: '4', reps: '12' },
            { name: 'JM Press', sets: '4', reps: '12' },
            { name: 'Sissy Squats', sets: '4', reps: '15' },
            { name: 'Donkey Calf Raises', sets: '5', reps: '20' },
            { name: 'Tibialis Raises', sets: '4', reps: '20' },
            { name: 'Neck Harness Extensions', sets: '3', reps: '15' },
            { name: 'Farmers Walk', sets: '4', reps: '40 meters' }
        ] },
        { name: 'Finisher Workout Plan', exercises: [
            { name: 'Dragon Flags', sets: '4', reps: '10' }, 
            { name: 'Ab Wheel Rollouts', sets: '4', reps: '15' },
            { name: 'Heavy Sled Pulls', sets: '4', reps: '20 meters' },
            { name: 'Assault Bike Sprint', sets: '5', reps: '20s on / 10s off' },
            { name: 'Advanced Mobility Flow', sets: '1', reps: '10 mins' }
        ] }
    ]
  }
];

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_HEALTH_DATA: HealthData = {
  date: new Date().toISOString().split('T')[0],
  steps: 0,
  heartRate: { avg: 0, hrv: 0, max: 0, min: 0, history: [] },
  caloriesBurned: 0,
  glucose: { current: 0, trend: 'stable', history: [] },
  circadian: { phase: 'Neutral', efficiency: 0 },
  sleep: { totalHours: 0, deepHours: 0, remHours: 0 }
};

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_STAFF: Staff[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_BROADCASTS: BroadcastMessage[] = [];

export const INITIAL_GOOGLE_REVIEWS: GoogleReview[] = [];

export const INITIAL_GOOGLE_POSTS: GoogleBusinessPost[] = [];

export const INITIAL_GOOGLE_INSIGHTS = {
  searchViews: 0,
  profileViews: 0,
  actions: 0,
  averageRating: 0,
  totalReviews: 0
};

export const INITIAL_DIETS: DietPlan[] = [];

export const INITIAL_MEMBER_SCHEDULES: MemberSchedules = {};

export const INITIAL_MEMBER_FITNESS_DATA: MemberFitnessData = {};

export const INITIAL_ACTIVITY_EVENTS: ActivityEvent[] = [];

export const INITIAL_TASKS: Task[] = [];

// Initial Inventory with new Medicine Category
export const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'inv_1', name: 'Whey Protein Isolate (2kg)', category: 'Supplement', stock: 25, price: 6500, threshold: 10, maxCapacity: 50, status: 'In Stock' },
    { id: 'inv_2', name: 'Creatine Monohydrate (300g)', category: 'Supplement', stock: 15, price: 1200, threshold: 8, maxCapacity: 30, status: 'In Stock' },
    { id: 'inv_3', name: 'BCAA Energy (30 Servings)', category: 'Supplement', stock: 10, price: 1800, threshold: 5, maxCapacity: 20, status: 'In Stock' },
    { id: 'inv_4', name: 'Premium Lifting Belt', category: 'Accessory', stock: 5, price: 1500, threshold: 3, maxCapacity: 10, status: 'Low Stock' },
    { id: 'inv_5', name: 'Gym Shaker Bottle (700ml)', category: 'Accessory', stock: 40, price: 300, threshold: 15, maxCapacity: 100, status: 'In Stock' },
    { id: 'inv_6', name: 'Wrist Wraps (Pair)', category: 'Accessory', stock: 12, price: 500, threshold: 5, maxCapacity: 20, status: 'In Stock' },
    { id: 'inv_7', name: 'Royal Gym T-Shirt (Dry Fit)', category: 'Apparel', stock: 20, price: 800, threshold: 8, maxCapacity: 50, status: 'In Stock' },
    { id: 'inv_8', name: 'Compression Shorts', category: 'Apparel', stock: 15, price: 1000, threshold: 4, maxCapacity: 30, status: 'In Stock' },
    { id: 'inv_9', name: 'Gym Towel (Microfiber)', category: 'Apparel', stock: 50, price: 250, threshold: 10, maxCapacity: 100, status: 'In Stock' },
    // New Medicine Items
    { id: 'inv_10', name: 'Multivitamin Complex', category: 'Medicine', stock: 50, price: 800, threshold: 10, maxCapacity: 100, status: 'In Stock' },
    { id: 'inv_11', name: 'Pain Relief Spray', category: 'Medicine', stock: 20, price: 300, threshold: 5, maxCapacity: 50, status: 'In Stock' },
    { id: 'inv_12', name: 'Omega-3 Fish Oil', category: 'Medicine', stock: 30, price: 1100, threshold: 8, maxCapacity: 60, status: 'In Stock' },
];
