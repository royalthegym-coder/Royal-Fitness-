import {
  Package,
  Member,
  Invoice,
  Staff,
  Expense,
  Lead,
  Transaction,
  HealthData,
  WorkoutTemplate,
  DietPlan,
  MemberFitnessData,
  ActivityEvent,
  Task,
  MedicalTestMaster,
  InventoryItem,
  BroadcastMessage,
  AttendanceRecord,
  GymOffer,
  GymReview,
} from './types';

export const APP_METADATA = {
  version: '4.2.0',
  name: 'Fitness Future',
};

export const GYM_INFO = {
  name: 'Fitness Future',
  tagline: 'Complete Gym Operations & Fitness Management Platform',
  logo: '',
  paymentQr: '',
  contact: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  email: 'contact@fitnessfuture.in',
  address: '2nd Floor, Prime Arcade, Sector 14, Jaipur',
  website: 'https://fitnessfuture.in',
  coordinates: { latitude: 26.9124, longitude: 75.7873 },
  upiIds: { gpay1: 'fitnessfuture@upi', gpay2: '' },
  bankDetails: {
    accountName: 'Fitness Future',
    accountNumber: '',
    ifsc: '',
    bankName: '',
  },
};

export const MEDICAL_TEST_MASTER: MedicalTestMaster[] = [
  { test_id: 't1', test_name: 'Testosterone Panel (Total & Free)', category: 'Hormonal', description: 'Crucial for muscle growth potential and recovery speed.' },
  { test_id: 't2', test_name: 'Vitamin D3 & B12', category: 'Nutritional', description: 'Essential for bone density, energy levels, and nerve function.' },
  { test_id: 't3', test_name: 'Thyroid Profile (TSH, T3, T4)', category: 'Metabolic', description: 'Determines metabolic rate (Fat Loss vs Muscle Gain strategy).' },
  { test_id: 't4', test_name: 'Complete Blood Count (CBC)', category: 'General Health', description: 'Checks for infection, anemia, and overall immunity.' },
  { test_id: 't5', test_name: 'Lipid Profile & Glucose', category: 'Cardiovascular', description: 'Heart health and insulin sensitivity for diet planning.' },
];

const formatDateDaysAgo = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const formatDateDaysAhead = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const TODAY = formatDateDaysAgo(0);

// ============================================================================
// SEED DATA FOR ALL 8+ CORE GYM TABLES
// (members, packages, staff, billing/invoices, expenses, attendance, reviews, offers, leads)
// ============================================================================

export const INITIAL_PACKAGES: Package[] = [
  {
    id: 1,
    name: 'Monthly Fitness Pass',
    category: 'General',
    price: 1500,
    duration: '1 Month',
    billingMonths: 1,
    monthlyBaseRate: 1500,
    discountPercent: 0,
    features: ['Full Gym Floor Access', 'Cardio & Strength Zone', 'Locker Room Access', 'Initial BMI Assessment'],
    details: 'Flexible monthly plan with zero long-term commitment.',
  },
  {
    id: 2,
    name: 'Quarterly Transformation',
    category: 'General',
    price: 4050,
    duration: '3 Months',
    billingMonths: 3,
    monthlyBaseRate: 1500,
    discountPercent: 10,
    features: ['Full Gym & Cardio Access', 'Monthly Body Composition Check', 'Custom Workout Split', '10% Quarterly Discount'],
    details: 'Save ₹450 compared to monthly billing.',
  },
  {
    id: 3,
    name: 'Half-Yearly Pro',
    category: 'General',
    price: 7650,
    duration: '6 Months',
    billingMonths: 6,
    monthlyBaseRate: 1500,
    discountPercent: 15,
    features: ['All Equipment & Group Classes', 'Bi-Monthly Diet Consultation', '15 Days Membership Freeze', '15% Semi-Annual Savings'],
    details: 'Save ₹1,350 over 6 months.',
  },
  {
    id: 4,
    name: 'Annual Value Membership',
    category: 'Annual',
    price: 14400,
    duration: '12 Months',
    billingMonths: 12,
    monthlyBaseRate: 1500,
    discountPercent: 20,
    isPopular: true,
    features: ['Unlimited Gym + Steam + Classes', 'AI Workout & Diet Plan Updates', '2 Free Guest Passes / Quarter', '20% Annual Discount (Save ₹3,600)'],
    details: 'Most popular annual plan — effective cost just ₹1,200/month.',
  },
  {
    id: 5,
    name: 'Annual Personal Training Elite',
    category: 'Personal Training',
    price: 27000,
    duration: '12 Months',
    billingMonths: 12,
    monthlyBaseRate: 3000,
    discountPercent: 25,
    features: ['Dedicated Certified Trainer', 'Weekly Dietitian Reviews', 'Full Body Metrics Tracking', '25% Annual Discount (Save ₹9,000)'],
    details: 'Complete 1-on-1 coaching with maximum annual savings.',
  },
];

const createSeedMember = (
  id: number,
  name: string,
  email: string,
  phone: string,
  gender: 'Male' | 'Female',
  packageId: number,
  status: 'Active' | 'Pending' | 'Expired' | 'Inactive',
  joinDaysAgo: number,
  height: number,
  weight: number,
  goal: string,
  conditions: string[] = []
): Member => ({
  id,
  name,
  email,
  phone,
  gender,
  joinDate: formatDateDaysAgo(joinDaysAgo),
  packageId,
  status,
  avatar: '',
  loginId: `FF-${1000 + id}`,
  whatsappConsent: true,
  xp: 250 + id * 85,
  level: Math.min(10, 1 + Math.floor(id / 2)),
  achievements: ['Consistent Starter'],
  hrv: 64 + (id % 12),
  lbm: Math.round(weight * 0.78),
  health_score: 72 + (id % 20),
  bio_age: 24 + (id % 11),
  assigned_tests: [],
  fitnessGoal: goal,
  height,
  weight,
  bodyFat: gender === 'Male' ? 16 + (id % 8) : 22 + (id % 7),
  muscleMass: Math.round(weight * 0.44),
  medical_history: {
    conditions,
    pastInjuries: conditions.length ? 'Mild knee strain (recovered)' : 'None',
    medications: 'None',
    bloodGroup: ['O+', 'B+', 'A+', 'AB+'][id % 4],
    lifestyle: { sleepHours: 7, waterLiters: 3, smoking: false },
  },
  physical_metrics: {
    height,
    weight,
    body_fat: gender === 'Male' ? 16 + (id % 8) : 22 + (id % 7),
    muscle_mass: Math.round(weight * 0.44),
    target_weight: goal === 'Weight Loss' ? weight - 8 : goal === 'Muscle Gain' ? weight + 6 : weight,
    body_type: id % 3 === 0 ? 'Endomorph' : id % 2 === 0 ? 'Mesomorph' : 'Ectomorph',
    activity_level: 'Moderate',
  },
  automation_settings: {
    remind_12hrs_before: true,
    auto_renewal: status === 'Active',
    ai_coaching: true,
    sync_id: `SYNC-${1000 + id}`,
  },
  rpeHistory: [],
  anatomicalStatus: {},
  emergency_contact: { name: 'Family Contact', phone: '9829000111', relation: 'Family' },
  initial_assessment: {
    fitness_level: id % 2 === 0 ? 'Intermediate' : 'Beginner',
    pushup_count: 18 + (id % 15),
    plank_time: '60s',
    squat_count: 25 + (id % 15),
    comments: 'Cleared for full gym training.',
  },
});

export const INITIAL_MEMBERS: Member[] = [
  createSeedMember(101, 'Aarav Sharma', 'aarav.sharma@example.com', '9829101101', 'Male', 4, 'Active', 42, 176, 74, 'Muscle Gain'),
  createSeedMember(102, 'Priya Verma', 'priya.verma@example.com', '9829101102', 'Female', 5, 'Active', 28, 163, 62, 'Weight Loss'),
  createSeedMember(103, 'Rohan Choudhary', 'rohan.choudhary@example.com', '9829101103', 'Male', 2, 'Active', 65, 180, 84, 'Weight Loss', ['Lower Back Stiffness']),
  createSeedMember(104, 'Ananya Gupta', 'ananya.gupta@example.com', '9829101104', 'Female', 4, 'Active', 15, 160, 56, 'Fitness'),
  createSeedMember(105, 'Vikram Singh Rathore', 'vikram.rathore@example.com', '9829101105', 'Male', 3, 'Pending', 3, 178, 88, 'Weight Loss', ['Mild Hypertension']),
  createSeedMember(106, 'Neha Kapoor', 'neha.kapoor@example.com', '9829101106', 'Female', 1, 'Expired', 38, 165, 67, 'Weight Loss'),
  createSeedMember(107, 'Karan Malhotra', 'karan.malhotra@example.com', '9829101107', 'Male', 4, 'Active', 90, 174, 71, 'Muscle Gain'),
  createSeedMember(108, 'Meera Nair', 'meera.nair@example.com', '9829101108', 'Female', 2, 'Active', 21, 162, 58, 'Fitness'),
  createSeedMember(109, 'Siddharth Joshi', 'siddharth.joshi@example.com', '9829101109', 'Male', 1, 'Inactive', 75, 175, 79, 'Fitness'),
  createSeedMember(110, 'Devika Rajput', 'devika.rajput@example.com', '9829101110', 'Female', 5, 'Active', 12, 166, 60, 'Muscle Gain'),
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 1,
    name: 'Rajeshwari Shekhawat',
    role: 'Manager',
    phone: '9828011001',
    email: 'rajeshwari@fitnessfuture.in',
    joinDate: '2024-03-10',
    salary: 38000,
    shift: '07:00 AM - 04:00 PM',
    specialization: 'Gym Operations & Member Retention',
    status: 'Active',
    rating: 4.9,
    activeClients: 0,
  },
  {
    id: 2,
    name: 'Arjun Deshmukh',
    role: 'Trainer',
    phone: '9828011002',
    email: 'arjun.trainer@fitnessfuture.in',
    joinDate: '2024-05-15',
    salary: 32000,
    shift: '06:00 AM - 02:00 PM',
    specialization: 'Strength & Hypertrophy',
    status: 'Active',
    rating: 4.8,
    activeClients: 18,
  },
  {
    id: 3,
    name: 'Dr. Kavita Mehta',
    role: 'Dietitian',
    phone: '9828011003',
    email: 'kavita.nutrition@fitnessfuture.in',
    joinDate: '2024-07-01',
    salary: 35000,
    shift: '10:00 AM - 06:00 PM',
    specialization: 'Clinical Sports Nutrition & Fat Loss',
    status: 'Active',
    rating: 4.9,
    activeClients: 24,
  },
  {
    id: 4,
    name: 'Manish Yadav',
    role: 'Trainer',
    phone: '9828011004',
    email: 'manish.pt@fitnessfuture.in',
    joinDate: '2024-09-20',
    salary: 28000,
    shift: '02:00 PM - 10:00 PM',
    specialization: 'Functional HIIT & Fat Loss',
    status: 'Active',
    rating: 4.7,
    activeClients: 15,
  },
  {
    id: 5,
    name: 'Simran Kaur',
    role: 'Trainer',
    phone: '9828011005',
    email: 'simran.coach@fitnessfuture.in',
    joinDate: '2025-01-10',
    salary: 26000,
    shift: '06:00 AM - 02:00 PM',
    specialization: 'Mobility, Core & Women Fitness',
    status: 'Active',
    rating: 4.8,
    activeClients: 14,
  },
  {
    id: 6,
    name: 'Deepak Sharma',
    role: 'Dietitian',
    phone: '9828011006',
    email: 'deepak.diet@fitnessfuture.in',
    joinDate: '2025-02-05',
    salary: 30000,
    shift: '01:00 PM - 09:00 PM',
    specialization: 'Indian High-Protein Meal Planning',
    status: 'On Leave',
    rating: 4.6,
    activeClients: 11,
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: 5001, memberId: 101, memberName: 'Aarav Sharma', packageId: 4, packageName: 'Annual Value Membership', amount: 14400, date: formatDateDaysAgo(42), status: 'Paid', paymentMethod: 'UPI' },
  { id: 5002, memberId: 102, memberName: 'Priya Verma', packageId: 5, packageName: 'Annual Personal Training Elite', amount: 27000, date: formatDateDaysAgo(28), status: 'Paid', paymentMethod: 'Card' },
  { id: 5003, memberId: 103, memberName: 'Rohan Choudhary', packageId: 2, packageName: 'Quarterly Transformation', amount: 4050, date: formatDateDaysAgo(65), status: 'Paid', paymentMethod: 'UPI' },
  { id: 5004, memberId: 104, memberName: 'Ananya Gupta', packageId: 4, packageName: 'Annual Value Membership', amount: 14400, date: formatDateDaysAgo(15), status: 'Paid', paymentMethod: 'UPI' },
  { id: 5005, memberId: 105, memberName: 'Vikram Singh Rathore', packageId: 3, packageName: 'Half-Yearly Pro', amount: 7650, date: formatDateDaysAgo(3), status: 'Pending', paymentMethod: 'UPI' },
  { id: 5006, memberId: 106, memberName: 'Neha Kapoor', packageId: 1, packageName: 'Monthly Fitness Pass', amount: 1500, date: formatDateDaysAgo(10), status: 'Overdue', paymentMethod: 'Cash' },
  { id: 5007, memberId: 107, memberName: 'Karan Malhotra', packageId: 4, packageName: 'Annual Value Membership', amount: 14400, date: formatDateDaysAgo(90), status: 'Paid', paymentMethod: 'Card' },
  { id: 5008, memberId: 108, memberName: 'Meera Nair', packageId: 2, packageName: 'Quarterly Transformation', amount: 4050, date: formatDateDaysAgo(21), status: 'Paid', paymentMethod: 'Cash' },
  { id: 5009, memberId: 110, memberName: 'Devika Rajput', packageId: 5, packageName: 'Annual Personal Training Elite', amount: 27000, date: formatDateDaysAgo(12), status: 'Paid', paymentMethod: 'UPI' },
  { id: 5010, memberId: 109, memberName: 'Siddharth Joshi', packageId: 1, packageName: 'Monthly Fitness Pass', amount: 1500, date: formatDateDaysAgo(5), status: 'Overdue', paymentMethod: 'UPI' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-5001', memberName: 'Aarav Sharma', amount: 14400, date: formatDateDaysAgo(42), method: 'QR Code' },
  { id: 'TXN-5002', memberName: 'Priya Verma', amount: 27000, date: formatDateDaysAgo(28), method: 'Card' },
  { id: 'TXN-5003', memberName: 'Rohan Choudhary', amount: 4050, date: formatDateDaysAgo(65), method: 'QR Code' },
  { id: 'TXN-5004', memberName: 'Ananya Gupta', amount: 14400, date: formatDateDaysAgo(15), method: 'QR Code' },
  { id: 'TXN-5007', memberName: 'Karan Malhotra', amount: 14400, date: formatDateDaysAgo(90), method: 'Card' },
  { id: 'TXN-5008', memberName: 'Meera Nair', amount: 4050, date: formatDateDaysAgo(21), method: 'Cash' },
  { id: 'TXN-5009', memberName: 'Devika Rajput', amount: 27000, date: formatDateDaysAgo(12), method: 'QR Code' },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 1, item: 'Gym Floor Monthly Lease', category: 'Rent', amount: 45000, date: formatDateDaysAgo(2), paymentMethod: 'Bank Transfer', vendor: 'Prime Arcade Properties' },
  { id: 2, item: 'Commercial Electricity Bill', category: 'Utilities', amount: 14800, date: formatDateDaysAgo(5), paymentMethod: 'UPI', vendor: 'JVVNL Power' },
  { id: 3, item: 'Treadmill Belt & Lubrication Service', category: 'Maintenance', amount: 6500, date: formatDateDaysAgo(9), paymentMethod: 'UPI', vendor: 'FitTech Service Co.' },
  { id: 4, item: 'Instagram & Local Meta Ads', category: 'Marketing', amount: 8200, date: formatDateDaysAgo(11), paymentMethod: 'Card', vendor: 'Meta Ads' },
  { id: 5, item: 'Olympic Bumper Plates (120kg Set)', category: 'Equipment', amount: 22000, date: formatDateDaysAgo(18), paymentMethod: 'Bank Transfer', vendor: 'IronCore India' },
  { id: 6, item: 'Sanitization & Towel Supplies', category: 'Supplies', amount: 3400, date: formatDateDaysAgo(22), paymentMethod: 'Cash', vendor: 'CleanPro Distributors' },
  { id: 7, item: 'Staff Monthly Payroll Advance', category: 'Salaries', amount: 65000, date: formatDateDaysAgo(32), paymentMethod: 'Bank Transfer', vendor: 'Internal Payroll' },
  { id: 8, item: 'Previous Month Floor Lease', category: 'Rent', amount: 45000, date: formatDateDaysAgo(34), paymentMethod: 'Bank Transfer', vendor: 'Prime Arcade Properties' },
  { id: 9, item: 'HVAC AC Cooling Service', category: 'Maintenance', amount: 5200, date: formatDateDaysAgo(48), paymentMethod: 'UPI', vendor: 'CoolAir Services' },
  { id: 10, item: 'Water Dispenser & RO Filter AMC', category: 'Utilities', amount: 2800, date: formatDateDaysAgo(55), paymentMethod: 'UPI', vendor: 'AquaPure Systems' },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'ATT-101', memberId: 101, memberName: 'Aarav Sharma', date: TODAY, time: '06:30 AM', checkInTime: '06:30 AM', checkOutTime: '07:55 AM', durationMinutes: 85, zone: 'Strength', status: 'Checked Out', method: 'Geometric' },
  { id: 'ATT-102', memberId: 102, memberName: 'Priya Verma', date: TODAY, time: '07:15 AM', checkInTime: '07:15 AM', checkOutTime: '08:25 AM', durationMinutes: 70, zone: 'Cardio', status: 'Checked Out', method: 'QR' },
  { id: 'ATT-103', memberId: 104, memberName: 'Ananya Gupta', date: TODAY, time: '08:00 AM', checkInTime: '08:00 AM', checkOutTime: null, zone: 'Main Floor', status: 'Checked In', method: 'Geometric' },
  { id: 'ATT-104', memberId: 107, memberName: 'Karan Malhotra', date: TODAY, time: '08:20 AM', checkInTime: '08:20 AM', checkOutTime: null, zone: 'Strength', status: 'Checked In', method: 'QR' },
  { id: 'ATT-105', memberId: 110, memberName: 'Devika Rajput', date: TODAY, time: '08:40 AM', checkInTime: '08:40 AM', checkOutTime: null, zone: 'CrossFit', status: 'Checked In', method: 'Geometric' },
  { id: 'ATT-106', memberId: 103, memberName: 'Rohan Choudhary', date: formatDateDaysAgo(1), time: '06:10 PM', checkInTime: '06:10 PM', checkOutTime: '07:20 PM', durationMinutes: 70, zone: 'Strength', status: 'Checked Out', method: 'Manual' },
  { id: 'ATT-107', memberId: 108, memberName: 'Meera Nair', date: formatDateDaysAgo(1), time: '05:30 PM', checkInTime: '05:30 PM', checkOutTime: '06:35 PM', durationMinutes: 65, zone: 'Cardio', status: 'Checked Out', method: 'QR' },
  { id: 'ATT-108', memberId: 101, memberName: 'Aarav Sharma', date: formatDateDaysAgo(1), time: '06:45 AM', checkInTime: '06:45 AM', checkOutTime: '08:05 AM', durationMinutes: 80, zone: 'Strength', status: 'Checked Out', method: 'Geometric' },
];

export const INITIAL_LEADS: Lead[] = [
  { id: 1, name: 'Harshvardhan Soni', email: 'harsh.soni@example.com', phone: '9829551001', source: 'Instagram', status: 'New', inquiryDate: formatDateDaysAgo(1), followUpDate: TODAY, goal: 'Muscle Gain', notes: 'Interested in Annual Value plan + trainer trial', aiScore: 88 },
  { id: 2, name: 'Ritika Agarwal', email: 'ritika.a@example.com', phone: '9829551002', source: 'Walk-in', status: 'Trial', inquiryDate: formatDateDaysAgo(3), followUpDate: TODAY, goal: 'Weight Loss', notes: 'Completed tour, booked morning trial with Simran', aiScore: 92 },
  { id: 3, name: 'Mohit Bansal', email: 'mohit.b@example.com', phone: '9829551003', source: 'WhatsApp', status: 'Contacted', inquiryDate: formatDateDaysAgo(4), followUpDate: formatDateDaysAhead(1), goal: 'Fitness', notes: 'Asked about couple discount and parking availability', aiScore: 76 },
  { id: 4, name: 'Tanvi Saxena', email: 'tanvi.s@example.com', phone: '9829551004', source: 'Referral', status: 'Trial', inquiryDate: formatDateDaysAgo(2), followUpDate: TODAY, goal: 'Weight Loss', notes: 'Referred by Priya Verma — high conversion chance', aiScore: 95 },
  { id: 5, name: 'Nikhil Pareek', email: 'nikhil.p@example.com', phone: '9829551005', source: 'Website', status: 'New', inquiryDate: TODAY, followUpDate: formatDateDaysAhead(1), goal: 'Muscle Gain', notes: 'Looking for evening batch 7 PM - 9 PM', aiScore: 81 },
  { id: 6, name: 'Pooja Khandelwal', email: 'pooja.k@example.com', phone: '9829551006', source: 'Facebook', status: 'Converted', inquiryDate: formatDateDaysAgo(14), followUpDate: formatDateDaysAgo(12), goal: 'Fitness', notes: 'Joined Annual plan via UPI', aiScore: 98 },
  { id: 7, name: 'Gaurav Tiwari', email: 'gaurav.t@example.com', phone: '9829551007', source: 'Walk-in', status: 'Lost', inquiryDate: formatDateDaysAgo(19), followUpDate: formatDateDaysAgo(15), goal: 'Weight Loss', notes: 'Relocated to another city', aiScore: 24 },
];

export const INITIAL_OFFERS: GymOffer[] = [
  {
    id: 'OFF-101',
    title: 'Annual Super Saver 20%',
    code: 'ANNUAL20',
    discountType: 'percentage',
    discountValue: 20,
    applicablePlan: 'Annual Value Membership',
    validFrom: formatDateDaysAgo(10),
    validUntil: formatDateDaysAhead(45),
    status: 'Active',
    description: 'Lock in a full year of unlimited training, steam, and guided nutrition updates with a flat 20% discount — save ₹3,600 instantly.',
    redemptions: 14,
  },
  {
    id: 'OFF-102',
    title: 'Summer Shred ₹1,000 Off',
    code: 'SHRED1000',
    discountType: 'flat',
    discountValue: 1000,
    applicablePlan: 'Half-Yearly Pro',
    validFrom: formatDateDaysAgo(5),
    validUntil: formatDateDaysAhead(25),
    status: 'Active',
    description: 'Kickstart your 6-month transformation with ₹1,000 instant savings plus a complimentary body composition assessment.',
    redemptions: 9,
  },
  {
    id: 'OFF-103',
    title: 'Bring-a-Buddy Referral Bonus',
    code: 'BUDDY15',
    discountType: 'percentage',
    discountValue: 15,
    applicablePlan: 'All Membership Plans',
    validFrom: formatDateDaysAgo(20),
    validUntil: formatDateDaysAhead(60),
    status: 'Active',
    description: 'Train together and save 15% on both memberships when you enroll with a workout partner.',
    redemptions: 11,
  },
  {
    id: 'OFF-104',
    title: 'Student Morning Pass',
    code: 'CAMPUS25',
    discountType: 'percentage',
    discountValue: 25,
    applicablePlan: 'Quarterly Transformation',
    validFrom: formatDateDaysAhead(5),
    validUntil: formatDateDaysAhead(90),
    status: 'Scheduled',
    description: 'Exclusive 25% off for college students training during off-peak hours (10 AM - 4 PM). Valid student ID required.',
    redemptions: 0,
  },
];

export const INITIAL_REVIEWS: GymReview[] = [
  {
    id: 'REV-1',
    memberName: 'Aarav Sharma',
    memberId: 101,
    rating: 5,
    category: 'Equipment',
    comment: 'Cleanest gym floor in the area with well-maintained squat racks and calibrated dumbbells. Trainer Arjun helped fix my deadlift posture in week one.',
    date: formatDateDaysAgo(2),
    reply: 'Thank you so much, Aarav! We are proud of our strength zone and glad Coach Arjun could help sharpen your deadlift form. Keep crushing your PRs!',
    repliedAt: formatDateDaysAgo(1),
    status: 'Replied',
  },
  {
    id: 'REV-2',
    memberName: 'Priya Verma',
    memberId: 102,
    rating: 5,
    category: 'Trainers',
    comment: 'Lost 6 kg in 2 months with Dr. Kavita’s realistic Indian meal plan and morning PT sessions. Very supportive and professional environment.',
    date: formatDateDaysAgo(4),
    status: 'Pending',
  },
  {
    id: 'REV-3',
    memberName: 'Rohan Choudhary',
    memberId: 103,
    rating: 4,
    category: 'Facility',
    comment: 'Great equipment and air conditioning, though the evening rush between 6:30 PM and 7:30 PM gets busy around the cable machines.',
    date: formatDateDaysAgo(6),
    status: 'Pending',
  },
  {
    id: 'REV-4',
    memberName: 'Neha Kapoor',
    memberId: 106,
    rating: 2,
    category: 'Cleanliness',
    comment: 'Locker room towels ran out twice during evening peak hours last week and AC in the cardio section felt warm on Tuesday.',
    date: formatDateDaysAgo(8),
    status: 'Pending',
  },
  {
    id: 'REV-5',
    memberName: 'Ananya Gupta',
    memberId: 104,
    rating: 5,
    category: 'Value',
    comment: 'The annual plan discount made it super affordable and the digital receipt + attendance check-in is effortless.',
    date: formatDateDaysAgo(11),
    reply: 'We appreciate your kind words, Ananya! Thrilled to hear you love the annual value plan and seamless check-in experience.',
    repliedAt: formatDateDaysAgo(10),
    status: 'Replied',
  },
  {
    id: 'REV-6',
    memberName: 'Karan Malhotra',
    memberId: 107,
    rating: 3,
    category: 'Equipment',
    comment: 'Solid strength training area, would love to see one more incline bench added for Monday chest workouts.',
    date: formatDateDaysAgo(14),
    status: 'Pending',
  },
];

export const INITIAL_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 1,
    name: 'Lean Fat-Burn Circuit (Weight Loss)',
    level: 'Beginner',
    category: 'Weight Loss',
    description: 'High-expenditure full-body resistance + metabolic conditioning split designed to burn fat while preserving lean muscle.',
    duration: '8 Weeks',
    frequency: '5 Days/Week',
    mainWorkout: [
      {
        name: 'Day 1 — Full Body Metabolic Strength',
        duration: '45 mins',
        intensity: 'High',
        exercises: [
          { name: 'Goblet Squats', sets: '4', reps: '15', rest: '45s', notes: 'Keep chest tall, full depth' },
          { name: 'Incline Dumbbell Press', sets: '3', reps: '12', rest: '45s', notes: 'Controlled 2s lowering' },
          { name: 'Lat Pulldown', sets: '3', reps: '14', rest: '45s', notes: 'Pull to upper chest' },
          { name: 'Kettlebell Swings', sets: '4', reps: '20', rest: '40s', notes: 'Explosive hip hinge' },
          { name: 'Incline Treadmill Brisk Walk', sets: '1', reps: '15 min', rest: '0s', notes: 'Incline 8%, speed 5.5 km/h' },
        ],
      },
      {
        name: 'Day 2 — Core & HIIT Conditioning',
        duration: '40 mins',
        intensity: 'High',
        exercises: [
          { name: 'Walking Lunges', sets: '3', reps: '12/leg', rest: '45s', notes: 'Stable knee alignment' },
          { name: 'Seated Cable Row', sets: '3', reps: '14', rest: '45s', notes: 'Squeeze shoulder blades' },
          { name: 'Mountain Climbers', sets: '4', reps: '40s', rest: '20s', notes: 'Fast, tight core' },
          { name: 'Forearm Plank', sets: '3', reps: '60s', rest: '30s', notes: 'Neutral spine' },
        ],
      },
    ],
    scientificNote: 'Pairs compound resistance lifts with Zone-2/HIIT conditioning for optimal caloric deficit adherence.',
  },
  {
    id: 2,
    name: 'Progressive Hypertrophy Push/Pull/Legs (Muscle Gain)',
    level: 'Intermediate',
    category: 'Muscle Gain',
    description: 'Structured 6-day hypertrophy split focused on progressive overload, mechanical tension, and optimal recovery.',
    duration: '12 Weeks',
    frequency: '6 Days/Week',
    mainWorkout: [
      {
        name: 'Push Day (Chest, Shoulders, Triceps)',
        duration: '55 mins',
        intensity: 'High',
        exercises: [
          { name: 'Barbell Bench Press', sets: '4', reps: '6-8', rest: '120s', notes: 'Progressive overload target' },
          { name: 'Incline Dumbbell Press', sets: '3', reps: '8-10', rest: '90s', notes: 'Full stretch at bottom' },
          { name: 'Seated Overhead Dumbbell Press', sets: '3', reps: '8-10', rest: '90s', notes: 'Brace core' },
          { name: 'Cable Lateral Raises', sets: '4', reps: '12-15', rest: '60s', notes: 'Lead with elbows' },
          { name: 'Rope Triceps Pushdown', sets: '3', reps: '12-15', rest: '60s', notes: 'Lock elbows at sides' },
        ],
      },
      {
        name: 'Pull Day (Back, Rear Delts, Biceps)',
        duration: '55 mins',
        intensity: 'High',
        exercises: [
          { name: 'Weighted Pull-Ups / Lat Pulldown', sets: '4', reps: '8-10', rest: '120s', notes: 'Full lat stretch' },
          { name: 'Barbell Bent-Over Row', sets: '4', reps: '8-10', rest: '90s', notes: '45-degree torso angle' },
          { name: 'Face Pulls', sets: '3', reps: '15', rest: '60s', notes: 'External rotation at peak' },
          { name: 'EZ-Bar Bicep Curl', sets: '3', reps: '10-12', rest: '60s', notes: 'No torso swing' },
        ],
      },
    ],
    scientificNote: 'Hits every major muscle group twice weekly at 12–16 weekly working sets for maximum hypertrophy.',
  },
  {
    id: 3,
    name: 'Balanced Strength & Mobility (Fitness)',
    level: 'Beginner',
    category: 'Fitness',
    description: 'Sustainable 4-day functional fitness routine improving cardiovascular stamina, posture, and daily strength.',
    duration: '8 Weeks',
    frequency: '4 Days/Week',
    mainWorkout: [
      {
        name: 'Upper Strength & Posture',
        duration: '45 mins',
        intensity: 'Medium',
        exercises: [
          { name: 'Push-Ups / Dumbbell Floor Press', sets: '3', reps: '12', rest: '60s', notes: 'Smooth tempo' },
          { name: 'Single-Arm Dumbbell Row', sets: '3', reps: '12/side', rest: '60s', notes: 'Flat back' },
          { name: 'Dumbbell Arnold Press', sets: '3', reps: '10', rest: '60s', notes: 'Controlled rotation' },
          { name: 'Dead Bug Core Drill', sets: '3', reps: '12/side', rest: '45s', notes: 'Lower back pressed flat' },
        ],
      },
    ],
    scientificNote: 'Balances anterior/posterior chain strength with joint mobility for long-term everyday health.',
  },
];

export const INITIAL_DIETS: DietPlan[] = [
  {
    id: 1,
    name: 'High-Protein Indian Fat Loss Plan',
    level: 'Beginner',
    goal: 'Weight Loss',
    calories: 1750,
    macros: { protein: 135, carbs: 165, fats: 52 },
    description: 'Calorie-controlled Indian vegetarian/eggetarian meal structure engineered for steady 0.5–0.7 kg/week fat loss.',
    duration: '8 Weeks',
    meals: [
      {
        name: 'Early Morning',
        time: '06:30 AM',
        items: [{ food: 'Warm Lemon Water + 5 Soaked Almonds', portion: '1 glass + 5 pcs', calories: 60, protein: 2, carbs: 4, fats: 4 }],
        totalCalories: 60,
        macros: { protein: 2, carbs: 4, fats: 4 },
      },
      {
        name: 'Breakfast',
        time: '08:30 AM',
        items: [
          { food: 'Moong Dal Chilla with Paneer Stuffing', portion: '2 medium chillas (100g paneer)', calories: 420, protein: 30, carbs: 38, fats: 16 },
          { food: 'Mint Coriander Chutney', portion: '2 tbsp', calories: 25, protein: 1, carbs: 4, fats: 0 },
        ],
        totalCalories: 445,
        macros: { protein: 31, carbs: 42, fats: 16 },
      },
      {
        name: 'Lunch',
        time: '01:30 PM',
        items: [
          { food: 'Multigrain Roti + Soya/Paneer Bhurji + Cucumber Salad', portion: '2 rotis + 150g bhurji + 1 bowl salad', calories: 520, protein: 38, carbs: 56, fats: 14 },
          { food: 'Low-Fat Curd', portion: '100g', calories: 65, protein: 4, carbs: 5, fats: 3 },
        ],
        totalCalories: 585,
        macros: { protein: 42, carbs: 61, fats: 17 },
      },
      {
        name: 'Post-Workout',
        time: '06:30 PM',
        items: [
          { food: 'Whey Protein Isolate in Water + 1 Apple', portion: '1 scoop (30g) + 1 medium apple', calories: 215, protein: 26, carbs: 24, fats: 1 },
        ],
        totalCalories: 215,
        macros: { protein: 26, carbs: 24, fats: 1 },
      },
      {
        name: 'Dinner',
        time: '08:30 PM',
        items: [
          { food: 'Grilled Tofu / Paneer Tikka + Stir-Fried Vegetables + Clear Soup', portion: '150g protein + 1 bowl veggies', calories: 445, protein: 34, carbs: 34, fats: 14 },
        ],
        totalCalories: 445,
        macros: { protein: 34, carbs: 34, fats: 14 },
      },
    ],
    scientificNote: 'High satiety protein (~1.8g/kg lean mass) prevents muscle loss while staying comfortably in a 400 kcal deficit.',
  },
  {
    id: 2,
    name: 'Lean Muscle Gain Nutrition Plan',
    level: 'Intermediate',
    goal: 'Muscle Gain',
    calories: 2650,
    macros: { protein: 165, carbs: 330, fats: 72 },
    description: 'Clean caloric surplus plan with timed peri-workout carbohydrates and complete protein distribution across 5 meals.',
    duration: '12 Weeks',
    meals: [
      {
        name: 'Breakfast',
        time: '08:00 AM',
        items: [
          { food: 'Oats cooked in Milk + Whey Scoop + Banana + Peanut Butter', portion: '80g oats + 250ml milk + 1 scoop + 1 tbsp PB', calories: 680, protein: 42, carbs: 84, fats: 18 },
        ],
        totalCalories: 680,
        macros: { protein: 42, carbs: 84, fats: 18 },
      },
      {
        name: 'Lunch',
        time: '01:00 PM',
        items: [
          { food: 'Steamed Rice + Chicken Breast / Soya Curry + Dal + Salad', portion: '200g cooked rice + 180g chicken/soya + 1 bowl dal', calories: 740, protein: 52, carbs: 94, fats: 16 },
        ],
        totalCalories: 740,
        macros: { protein: 52, carbs: 94, fats: 16 },
      },
      {
        name: 'Pre-Workout',
        time: '04:45 PM',
        items: [
          { food: 'Whole Wheat Toast + Honey + Black Coffee', portion: '2 slices + 1 tbsp honey', calories: 250, protein: 6, carbs: 50, fats: 2 },
        ],
        totalCalories: 250,
        macros: { protein: 6, carbs: 50, fats: 2 },
      },
      {
        name: 'Post-Workout',
        time: '06:45 PM',
        items: [
          { food: 'Whey Protein Shake + 4 Boiled Egg Whites / Roasted Chana', portion: '1 scoop + 4 whites', calories: 260, protein: 40, carbs: 14, fats: 3 },
        ],
        totalCalories: 260,
        macros: { protein: 40, carbs: 14, fats: 3 },
      },
      {
        name: 'Dinner',
        time: '08:45 PM',
        items: [
          { food: '3 Phulkas + Grilled Paneer / Fish + Sautéed Broccoli & Beans', portion: '3 rotis + 150g protein + veggies', calories: 720, protein: 25, carbs: 88, fats: 33 },
        ],
        totalCalories: 720,
        macros: { protein: 25, carbs: 88, fats: 33 },
      },
    ],
    scientificNote: 'Delivers ~30–40g leucine-rich protein per meal to maximize muscle protein synthesis.',
  },
];

export const INITIAL_HEALTH_DATA: HealthData = {
  date: TODAY,
  steps: 7850,
  heartRate: { avg: 72, hrv: 68, max: 146, min: 56, history: [] },
  caloriesBurned: 540,
  glucose: { current: 94, trend: 'stable', history: [] },
  circadian: { phase: 'Optimal', efficiency: 91 },
  sleep: { totalHours: 7.5, deepHours: 2.1, remHours: 1.8 },
};

export const INITIAL_GOOGLE_REVIEWS: any[] = [];
export const INITIAL_GOOGLE_POSTS: any[] = [];

export const INITIAL_GOOGLE_INSIGHTS = {
  views: 0,
  searches: 0,
  actions: 0,
  calls: 0,
  directions: 0,
  websiteClicks: 0,
};

export const INITIAL_MEMBER_SCHEDULES: any = {};
export const INITIAL_MEMBER_FITNESS_DATA: MemberFitnessData = {};
export const INITIAL_ACTIVITY_EVENTS: ActivityEvent[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_BROADCASTS: BroadcastMessage[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_STORE_PRODUCTS: any[] = [];
