
export interface Package {
  id: number;
  name: string;
  price: number;
  duration: string; // e.g. "First Month", "3 Months"
  details?: string; // e.g. "then ₹1000/month"
  features: string[];
  category: 'Regular' | 'Cardio' | 'Personal Training';
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  packageId: number;
  status: 'Active' | 'Expired' | 'Inactive';
  avatar: string;
  whatsappConsent: boolean;
}

export interface Invoice {
  id: number;
  memberId: number;
  memberName: string;
  packageId: number;
  packageName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Staff {
    id: number;
    name: string;
    role: 'Trainer' | 'Manager' | 'Cleaner';
    phone: string;
    salary: number;
    joinDate: string;
}

export interface Expense {
    id: number;
    item: string;
    category: 'Equipment' | 'Utility' | 'Salary' | 'Maintenance' | 'Other';
    amount: number;
    date: string;
}

export interface WorkoutExercise {
    name: string;
    sets: string; // e.g., "3-4"
    reps: string; // e.g., "8-12"
}

export interface WorkoutSection {
    title: string;
    exercises: WorkoutExercise[];
}

export interface WorkoutTemplate {
    id: number;
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    exercises?: WorkoutExercise[];
    sections?: WorkoutSection[];
    content?: string; // For AI-generated content
    isNew?: boolean; // To highlight newly generated plans
}

export interface DailySchedule {
    templateId?: number;
    isRestDay?: boolean;
    customTitle?: string;
    exercises?: WorkoutExercise[];
}

export interface MemberSchedules {
    [memberId: number]: {
        [date: string]: DailySchedule; // YYYY-MM-DD
    };
}

export interface DietPlan {
    id: number;
    name: string;
    description: string;
    calories: number;
    category: 'Weight Gain' | 'Weight Loss' | 'Maintenance';
    assignedTo: number[]; // member ids
    isNew?: boolean; // To highlight newly generated plans
}

export type LeadSource = 'Facebook' | 'Instagram' | 'Website' | 'Walk-in' | 'Other';

export interface Lead {
    id: number;
    name: string;
    phone: string;
    email: string;
    inquiryDate: string;
    status: 'New' | 'Follow-up' | 'Converted' | 'Lost';
    source: LeadSource;
}

// Google Business Platform Integration Types
export interface GoogleReview {
    id: string;
    authorName: string;
    rating: number; // 1-5
    comment: string;
    timestamp: string;
    reply?: {
        comment: string;
        timestamp: string;
    };
}

export interface GoogleBusinessPost {
    id: string;
    content: string;
    imageUrl?: string;
    timestamp: string;
    state: 'LIVE' | 'PROCESSING';
}

export interface GoogleBusinessInsights {
    profileViews: number;
    searchViews: number;
    actions: number;
    averageRating: number;
    totalReviews: number;
}

export interface BroadcastMessage {
    id: number;
    message: string;
    audience: 'all' | 'active' | 'expired';
    recipientCount: number;
    sentAt: string;
}

export interface Transaction {
    id: string;
    memberName: string;
    amount: number;
    date: string;
    method: 'QR Code' | 'Cash';
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface ActivityEvent {
    id: number;
    type: 'check-in' | 'new-member' | 'payment' | 'ai-suggestion';
    message: string;
    timestamp: Date;
    memberId?: number;
    action?: {
        label: string;
        view: 'members' | 'whatsapp' | 'geminiHub';
    };
}

export interface HealthData {
  date: string;
  steps: number;
  heartRate: {
    avg: number;
    max: number;
    min: number;
    history: { time: string; value: number }[];
  };
  caloriesBurned: number;
  sleep: {
    totalHours: number;
    deepHours: number;
    remHours: number;
  };
}

export interface BodyMetric {
    date: string; // YYYY-MM-DD
    weight?: number; // in kg
    bodyFat?: number; // in %
    chest?: number; // in inches
    waist?: number; // in inches
    arms?: number; // in inches
}

export interface WorkoutPerformance {
    exercise: string;
    sets: { reps: number; weight: number }[];
}

export interface WorkoutLog {
    date: string; // YYYY-MM-DD
    templateName: string;
    completedExercises: WorkoutExercise[];
    performance?: WorkoutPerformance[];
}


export interface MemberFitnessData {
    [memberId: number]: {
        logs: WorkoutLog[];
        metrics: BodyMetric[];
    };
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
}

// Gamification Types
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji or Icon Name
    category: 'Consistency' | 'Strength' | 'Cardio' | 'Milestone';
    isEarned: boolean;
    earnedDate?: string;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    isCompleted: boolean;
    expiresAt?: string;
}
