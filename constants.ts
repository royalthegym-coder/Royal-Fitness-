
import { Package, Member, Invoice, Staff, Expense, Lead, Transaction, HealthData, WorkoutTemplate, MemberSchedules, DailyRoutineLog, AIRecommendation, MedicalReport, BroadcastMessage, GoogleReview, GoogleBusinessPost, DietPlan, MemberFitnessData, ActivityEvent, Task, MedicalTestMaster } from './types';

export const APP_METADATA = {
    version: "31.0.0", // Scientific Singularity Update
    name: "Royal Singularity OS"
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
  { id: 1, name: 'Strength: Temperature Member', category: 'Strength', price: 1200, duration: '1 Month', features: ['Gym Access', 'Temporary Validity'] },
  { id: 2, name: 'Strength: New Member (1st Month)', category: 'Strength', price: 1500, duration: '1 Month', features: ['Registration Fee Included', 'Gym Access'] },
  { id: 3, name: 'Strength: Regular Monthly', category: 'Strength', price: 1000, duration: '1 Month', features: ['Gym Access', 'Standard Fee'] },
  { id: 4, name: 'Strength: Quarterly', category: 'Strength', price: 3000, duration: '3 Months', features: ['3 Month Access', 'Strength Area'] },
  { id: 5, name: 'Strength: Half-Yearly', category: 'Strength', price: 5000, duration: '6 Months', features: ['6 Month Access', 'Saver Pack'] },
  { id: 6, name: 'Strength: Yearly', category: 'Strength', price: 9000, duration: '12 Months', features: ['1 Year Access', 'Best Value'] },
  { id: 7, name: 'Cardio: Monthly', category: 'Cardio', price: 2000, duration: '1 Month', features: ['Treadmills', 'Ellipticals', 'Cycles'] },
  { id: 8, name: 'Cardio: Quarterly', category: 'Cardio', price: 5000, duration: '3 Months', features: ['Cardio Section', 'Weight Loss Focus'] },
  { id: 9, name: 'Cardio: Half-Yearly', category: 'Cardio', price: 9000, duration: '6 Months', features: ['Long Term Cardio', 'Fat Loss'] },
  { id: 10, name: 'Cardio: Yearly', category: 'Cardio', price: 16000, duration: '12 Months', features: ['Full Year Cardio', 'Ultimate Endurance'] },
  { id: 11, name: 'Aerobics Workout', category: 'Aerobics', price: 2000, duration: '1 Month', features: ['Group Classes', 'Rhythmic Cardio'] },
];

// SCIENTIFIC WORKOUT MATRIX
export const INITIAL_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  { 
    id: 101, name: 'Full Body Genesis', level: 'Beginner', category: 'Foundation',
    description: 'Neural adaptation phase. Focus on compound movements to build CNS efficiency.',
    exercises: [], 
    sections: [
        { exercises: [{ name: 'Arm Circles', sets: '1', reps: '1 min' }, { name: 'Jumping Jacks', sets: '1', reps: '30 reps' }] },
        { exercises: [{ name: 'Goblet Squat', sets: '3', reps: '12-15' }, { name: 'Push Up', sets: '3', reps: 'Failure' }, { name: 'Lat Pulldown', sets: '3', reps: '12' }, { name: 'Dumbbell Press', sets: '3', reps: '10' }] },
        { exercises: [{ name: 'Plank', sets: '3', reps: '30s' }] },
        { exercises: [{ name: 'Calf Raise', sets: '3', reps: '15' }] }
    ]
  },
  { 
    id: 201, name: 'Hypertrophy: Push A', level: 'Intermediate', category: 'Hypertrophy',
    description: 'Volume-centric push session targeting chest, delts, and triceps.',
    sections: [
        { exercises: [{ name: 'Arm Circles', sets: '2', reps: '30s' }, { name: 'Cat Cow', sets: '1', reps: '1 min' }] },
        { exercises: [{ name: 'Bench Press', sets: '4', reps: '8-10' }, { name: 'Incline Dumbbell Press', sets: '3', reps: '12' }, { name: 'Overhead Press', sets: '3', reps: '10' }, { name: 'Lateral Raise', sets: '4', reps: '15' }, { name: 'Tricep Pushdown', sets: '3', reps: '12' }, { name: 'Skull Crusher', sets: '3', reps: '12' }] },
        { exercises: [{ name: 'Cable Crunch', sets: '3', reps: '15' }] }, 
        { exercises: [{ name: 'Wrist Curl', sets: '3', reps: '20' }] }
    ]
  },
  { 
    id: 301, name: 'Titan Legs (Pro)', level: 'Advanced', category: 'Pro Split',
    description: 'High volume leg destruction. Time under tension focus. 12+ Exercises.',
    sections: [
        { exercises: [{ name: 'Leg Swings', sets: '2', reps: '1 min' }, { name: 'Bodyweight Squat', sets: '2', reps: '20' }] },
        { exercises: [{ name: 'Barbell Squat', sets: '4', reps: '8' }, { name: 'Leg Press', sets: '4', reps: '12' }, { name: 'Hack Squat', sets: '3', reps: '12' }, { name: 'Walking Lunge', sets: '3', reps: '20 steps' }, { name: 'Romanian Deadlift', sets: '4', reps: '10' }, { name: 'Leg Extension', sets: '3', reps: '15 (Drop set)' }, { name: 'Leg Curl', sets: '3', reps: '15' }, { name: 'Goblet Squat', sets: '3', reps: '15' }, { name: 'Calf Raise', sets: '5', reps: '20' }, { name: 'Seated Calf', sets: '4', reps: '15' }] },
        { exercises: [{ name: 'Hanging Leg Raise', sets: '4', reps: 'Failure' }, { name: 'Russian Twist', sets: '3', reps: '20' }] },
        { exercises: [] } 
    ]
  }
];

export const INITIAL_MEMBERS: Member[] = [
  { id: 1, name: 'Rahul Saini', email: 'rahul@example.com', phone: '9785300123', joinDate: '2024-01-01', packageId: 6, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=rahul', whatsappConsent: true, xp: 1250, level: 42, achievements: ["Warrior Prime"], hrv: 65, lbm: 70, health_score: 92, bio_age: 24, assigned_tests: ['t1', 't3'], medical_history: { conditions: [], pastInjuries: 'None', medications: 'Vitamin D3', lifestyle: {} }, physical_metrics: { height: 175, weight: 75, body_fat: 18, muscle_mass: 42, target_weight: 72, body_type: 'Mesomorph', activity_level: 'Moderate' }, automation_settings: { remind_12hrs_before: true, auto_renewal: false, ai_coaching: true, sync_id: 'SYN_101' }, rpeHistory: [], anatomicalStatus: {}, emergency_contact: { name: 'Mahesh Saini', phone: '9785300123', relation: 'Relative' }, initial_assessment: { fitness_level: 'Advanced', pushup_count: 45, plank_time: '120s', squat_count: 50, comments: 'Very active' } },
  { id: 2, name: 'Priya Sharma', email: 'priya.s@example.com', phone: '9876543210', joinDate: '2024-02-15', packageId: 10, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=priya', whatsappConsent: true, xp: 3400, level: 15, achievements: ["Cardio Queen"], hrv: 72, lbm: 48, health_score: 88, bio_age: 26, assigned_tests: [], medical_history: { conditions: [], pastInjuries: 'ACL Tear (2020)', medications: '', lifestyle: {} }, physical_metrics: { height: 165, weight: 58, body_fat: 22, muscle_mass: 24, target_weight: 55, body_type: 'Ectomorph', activity_level: 'High' }, automation_settings: { remind_12hrs_before: true, auto_renewal: true, ai_coaching: true, sync_id: 'SYN_202' }, rpeHistory: [], anatomicalStatus: {}, emergency_contact: { name: 'Raj Sharma', phone: '9876543211', relation: 'Father' }, initial_assessment: { fitness_level: 'Intermediate', pushup_count: 20, plank_time: '60s', squat_count: 30, comments: 'Good endurance' } },
];

export const INITIAL_HEALTH_DATA: HealthData = {
  date: new Date().toISOString().split('T')[0],
  steps: 8500,
  heartRate: { avg: 72, hrv: 65, max: 160, min: 58, history: [] },
  caloriesBurned: 450,
  glucose: { current: 95, trend: 'stable', history: [] },
  circadian: { phase: 'Peak Alertness', efficiency: 92 },
  sleep: { totalHours: 7.5, deepHours: 2, remHours: 1.5 }
};

export const INITIAL_INVOICES: Invoice[] = [
  { id: 1, memberId: 1, memberName: 'Rahul Saini', packageId: 6, packageName: 'Strength Yearly', amount: 9000, date: '2024-01-01', status: 'Paid' },
  { id: 2, memberId: 2, memberName: 'Priya Sharma', packageId: 10, packageName: 'Cardio Yearly', amount: 16000, date: '2024-02-15', status: 'Paid' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'TXN1001', memberName: 'Rahul Saini', amount: 9000, date: '2024-01-01', method: 'QR Code' },
];

export const INITIAL_STAFF: Staff[] = [
  { id: 1, name: 'Mahesh Saini', role: 'Manager', phone: '9785300123', joinDate: '2023-01-01', salary: 45000 },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 1, item: 'Electricity Bill', category: 'Utilities', amount: 12000, date: '2024-07-15' },
];

export const INITIAL_LEADS: Lead[] = [
  { id: 1, name: 'Amit Singh', email: 'amit@example.com', phone: '9999999999', source: 'Instagram', status: 'New', inquiryDate: '2024-08-01', aiScore: 85 },
  { id: 2, name: 'Sunita Devi', email: 'sunita@example.com', phone: '9898989898', source: 'Walk-in', status: 'New', inquiryDate: '2024-08-02', aiScore: 92 },
  { id: 3, name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '9797979797', source: 'Facebook', status: 'Contacted', inquiryDate: '2024-07-28', aiScore: 65 },
  { id: 4, name: 'Kavita Verma', email: 'kavita@example.com', phone: '9696969696', source: 'Website', status: 'Trial', inquiryDate: '2024-07-25', aiScore: 78 },
  { id: 5, name: 'Vikas Meena', email: 'vikas@example.com', phone: '9595959595', source: 'Other', status: 'Lost', inquiryDate: '2024-07-20', aiScore: 32 },
  { id: 6, name: 'Anjali Sharma', email: 'anjali@example.com', phone: '9494949494', source: 'Instagram', status: 'Contacted', inquiryDate: '2024-08-03', aiScore: 88 },
];

export const INITIAL_BROADCASTS: BroadcastMessage[] = [
  { id: 1, message: 'Welcome to Royal!', audience: 'all', recipientCount: 500, sentAt: '2024-01-01' }
];

export const INITIAL_GOOGLE_REVIEWS: GoogleReview[] = [
  { id: 'rev1', authorName: 'Suresh Kumar', rating: 5, comment: 'Best gym in Jhunjhunu! Advanced equipment and great trainers.', timestamp: '2 days ago' },
];

export const INITIAL_GOOGLE_POSTS: GoogleBusinessPost[] = [
  { id: 'post1', content: 'New equipment arriving soon! Get ready to level up your gains. #RoyalTheGym #Fitness', timestamp: 'Just now', state: 'LIVE', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600' },
];

export const INITIAL_GOOGLE_INSIGHTS = {
  searchViews: 1542,
  profileViews: 890,
  actions: 215,
  averageRating: 4.8,
  totalReviews: 87
};

export const INITIAL_DIETS: DietPlan[] = [
  { id: 1, name: 'Warrior Shred', category: 'Fat Loss', calories: 2200, description: 'Cutting phase protocol.', assignedTo: [1] }
];

export const INITIAL_MEMBER_SCHEDULES: MemberSchedules = {
  1: {
    '2024-08-05': { isRestDay: false, templateId: 101 }
  }
};

export const INITIAL_MEMBER_FITNESS_DATA: MemberFitnessData = {
  1: {
    metrics: [
      { date: '2024-07-01', weight: 82, bodyFat: 21 },
    ],
    logs: [
      { date: '2024-08-01', exercise: 'Deadlift', sets: 3, reps: 5, weight: 140 }
    ]
  }
};

export const INITIAL_ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: 1, type: 'check-in', message: 'Rahul Saini joined the session.', timestamp: new Date() }
];

export const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Check water level', priority: 'Medium', dueDate: '2024-08-05', completed: false }
];