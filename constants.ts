
import { Package, Member, Invoice, Staff, Expense, DietPlan, Lead, GoogleReview, GoogleBusinessPost, GoogleBusinessInsights, BroadcastMessage, Transaction, ActivityEvent, HealthData, WorkoutTemplate, MemberSchedules, MemberFitnessData, Task } from './types';

export const GYM_INFO = {
  name: 'Royal The Gym',
  logo: 'https://i.ibb.co/6800735/Royal-The-Gym.png',
  contact: '+91 9785300123',
  email: 'royalthegym@gmail.com',
  address: '2nd floor, Vishwakarma Complex, Gandhi Chowk, Khemi Sati Road, Jhunjhunu, Rajasthan- 333001',
  website: 'https://royal-the-gym.grexa.site',
  // EXACT COORDINATES FOR GEOFENCING
  coordinates: {
    latitude: 28.1289, 
    longitude: 75.3995
  },
  upiIds: {
    gpay1: '9785300123@okbizaxis',
    gpay2: 'royalthegym@oksbi',
  },
  gpay: {
    email: 'royalthegym@gmail.com',
    mobile: '+91 9785300123'
  },
  whatsappNumber: '+919785300123',
  googleBusinessEmail: 'royalthegym@gmail.com',
  socials: {
    instagram: 'https://www.instagram.com/royalthegym/',
    facebook: 'https://www.facebook.com/royalthegym/',
    twitter: 'https://twitter.com/royalthegym',
    whatsapp: 'https://wa.me/919785300123',
  }
};

export const INITIAL_PACKAGES: Package[] = [
  // Regular Gym Workouts
  { 
    id: 1, 
    name: 'Temporary Membership', 
    category: 'Regular', 
    price: 1200, 
    duration: '1 Month', 
    details: 'Valid for just one month', 
    features: ['Gym Access Only'] 
  },
  { 
    id: 2, 
    name: 'Basic Gym Membership', 
    category: 'Regular', 
    price: 1500, 
    duration: '1 Month', 
    details: 'First month ₹1500, then ₹1000/month', 
    features: ['Gym Access Only'] 
  },
  { 
    id: 3, 
    name: 'Standard Gym Package', 
    category: 'Regular', 
    price: 3000, 
    duration: '3 Months', 
    features: ['Gym Access', 'Diet Plan'] 
  },
  { 
    id: 4, 
    name: 'Premium Gym Package', 
    category: 'Regular', 
    price: 5000, 
    duration: '6 Months', 
    features: ['Gym Access', 'Diet Plan', '10 Days Workout Training'] 
  },
  { 
    id: 5, 
    name: 'Diamond Gym Package', 
    category: 'Regular', 
    price: 9000, 
    duration: '12 Months', 
    details: 'Annual Plan (Save 20%)',
    features: ['Gym Access', 'Diet Plan', '15 Days Workout Training'] 
  },
  
  // Cardio Gym Workouts
  { 
    id: 6, 
    name: 'Basic Cardio Membership', 
    category: 'Cardio', 
    price: 2000, 
    duration: '1 Month', 
    features: ['Full Gym Access (Cardio + Weights)'] 
  },
  { 
    id: 7, 
    name: 'Standard Cardio Package', 
    category: 'Cardio', 
    price: 5000, 
    duration: '3 Months', 
    features: ['Full Gym Access', 'Diet Plan'] 
  },
  { 
    id: 8, 
    name: 'Premium Cardio Package', 
    category: 'Cardio', 
    price: 9000, 
    duration: '6 Months', 
    features: ['Full Gym Access', 'Diet Plan', '10 Days Workout Training'] 
  },
  { 
    id: 9, 
    name: 'Diamond Cardio Package', 
    category: 'Cardio', 
    price: 16000, 
    duration: '12 Months', 
    details: 'Annual Plan (Save 20%)',
    features: ['Full Gym Access', 'Diet Plan', '4 Weeks Workout Training'] 
  },

  // Personal Training
  { 
    id: 10, 
    name: 'Personal Training', 
    category: 'Personal Training', 
    price: 5000, 
    duration: '1 Month', 
    features: ['Personalized Training Sessions', 'Diet Plan', 'Exercise Plan'] 
  },
];

export const INITIAL_MEMBERS: Member[] = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav.s@example.com', phone: '9876543210', joinDate: '2023-05-15', packageId: 3, trainerId: 2, status: 'Active', avatar: 'https://picsum.photos/seed/aarav/200', whatsappConsent: true },
  { id: 2, name: 'Priya Patel', email: 'priya.p@example.com', phone: '9876543211', joinDate: '2023-06-01', packageId: 2, status: 'Active', avatar: 'https://picsum.photos/seed/priya/200', whatsappConsent: true },
  { id: 3, name: 'Rohan Kumar', email: 'rohan.k@example.com', phone: '9876543212', joinDate: '2022-12-20', packageId: 1, status: 'Expired', avatar: 'https://picsum.photos/seed/rohan/200', whatsappConsent: true },
  { id: 4, name: 'Anika Singh', email: 'anika.s@example.com', phone: '9876543213', joinDate: '2024-07-05', packageId: 6, trainerId: 3, status: 'Active', avatar: 'https://picsum.photos/seed/anika/200', whatsappConsent: true },
  { id: 5, name: 'Vikram Mehta', email: 'vikram.m@example.com', phone: '9876543214', joinDate: '2023-02-11', packageId: 5, status: 'Inactive', avatar: 'https://picsum.photos/seed/vikram/200', whatsappConsent: false },
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: 1, memberId: 1, memberName: 'Aarav Sharma', packageId: 3, packageName: 'Standard Gym Package', amount: 3000, date: '2024-07-01', status: 'Paid' },
  { id: 2, memberId: 2, memberName: 'Priya Patel', packageId: 2, packageName: 'Basic Gym Membership', amount: 1500, date: '2024-07-05', status: 'Paid' },
  { id: 3, memberId: 4, memberName: 'Anika Singh', packageId: 6, packageName: 'Basic Cardio Membership', amount: 2000, date: '2024-07-10', status: 'Pending' },
  { id: 4, memberId: 3, memberName: 'Rohan Kumar', packageId: 1, packageName: 'Temporary Membership', amount: 1200, date: '2024-01-20', status: 'Overdue' },
];

export const INITIAL_STAFF: Staff[] = [
    { id: 1, name: 'Sanjay Verma', role: 'Manager', phone: '9123456780', salary: 30000, joinDate: '2022-01-10' },
    { id: 2, name: 'Kavita Reddy', role: 'Trainer', phone: '9123456781', salary: 22000, joinDate: '2022-08-01' },
    { id: 3, name: 'Rajesh Gupta', role: 'Trainer', phone: '9123456782', salary: 20000, joinDate: '2023-03-15' },
];

export const INITIAL_EXPENSES: Expense[] = [
    { id: 1, item: 'Dumbbells Set', category: 'Equipment', amount: 25000, date: '2024-06-15' },
    { id: 2, item: 'Electricity Bill', category: 'Utility', amount: 8500, date: '2024-07-05' },
    { id: 3, item: 'Staff Salaries', category: 'Salary', amount: 72000, date: '2024-07-01' },
    { id: 4, item: 'Treadmill Repair', category: 'Maintenance', amount: 5000, date: '2024-06-22' },
];

// 6-Day Full Body Splits with Warm-up & Activation Theme
export const INITIAL_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
    { 
        id: 101, 
        name: 'Day 1: Strength & Power', 
        level: 'Intermediate', 
        sections: [
            { title: '🔥 Warm-up & Activation', exercises: [
                { name: 'Arm Circles & Swings', sets: '1', reps: '1 min' },
                { name: 'Cat-Cow Stretch', sets: '2', reps: '10' },
                { name: 'Band Pull-Aparts', sets: '2', reps: '15' },
                { name: 'Glute Bridges', sets: '2', reps: '12' }
            ]},
            { title: '💪 Main Workout', exercises: [
                { name: 'Barbell Squats', sets: '4', reps: '6-8' },
                { name: 'Bench Press', sets: '4', reps: '6-8' },
                { name: 'Bent Over Rows', sets: '3', reps: '8-10' },
                { name: 'Overhead Press', sets: '3', reps: '8-10' }
            ]},
            { title: '🧘 Cool Down', exercises: [
                { name: 'Static Hamstring Stretch', sets: '1', reps: '30s hold' },
                { name: 'Chest Opener Stretch', sets: '1', reps: '30s hold' }
            ]}
        ]
    },
    { 
        id: 102, 
        name: 'Day 2: Hypertrophy (Higher Reps)', 
        level: 'Intermediate', 
        sections: [
            { title: '🔥 Warm-up & Activation', exercises: [
                { name: 'Light Jog/Jump Rope', sets: '1', reps: '5 min' },
                { name: 'Thoracic Rotations', sets: '2', reps: '10/side' },
                { name: 'Bodyweight Squats', sets: '2', reps: '15' }
            ]},
            { title: '💪 Main Workout', exercises: [
                { name: 'Romanian Deadlifts', sets: '3', reps: '10-12' },
                { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12' },
                { name: 'Lat Pulldowns', sets: '3', reps: '12-15' },
                { name: 'Leg Press', sets: '3', reps: '12-15' },
                { name: 'Lateral Raises', sets: '3', reps: '15-20' }
            ]},
            { title: '🧘 Cool Down', exercises: [
                { name: 'Quad Stretch', sets: '1', reps: '30s/side' },
                { name: 'Child’s Pose', sets: '1', reps: '1 min' }
            ]}
        ]
    },
    { 
        id: 103, 
        name: 'Day 3: Functional & Core', 
        level: 'Advanced', 
        sections: [
            { title: '🔥 Warm-up & Activation', exercises: [
                { name: 'High Knees', sets: '2', reps: '30s' },
                { name: 'Bird-Dogs', sets: '2', reps: '10/side' },
                { name: 'Dead Bugs', sets: '2', reps: '10/side' }
            ]},
            { title: '💪 Main Workout', exercises: [
                { name: 'Kettlebell Swings', sets: '4', reps: '15' },
                { name: 'Pull-Ups (or Assisted)', sets: '3', reps: 'AMRAP' },
                { name: 'Walking Lunges', sets: '3', reps: '12/leg' },
                { name: 'Push-Ups', sets: '3', reps: 'AMRAP' },
                { name: 'Plank', sets: '3', reps: '60s' }
            ]},
            { title: '🧘 Cool Down', exercises: [
                { name: 'Hip Flexor Stretch', sets: '1', reps: '30s/side' },
                { name: 'Cobra Stretch', sets: '1', reps: '30s' }
            ]}
        ]
    },
    { 
        id: 104, 
        name: 'Day 4: Strength Endurance', 
        level: 'Beginner', 
        sections: [
            { title: '🔥 Warm-up & Activation', exercises: [
                { name: 'Jumping Jacks', sets: '1', reps: '2 min' },
                { name: 'World’s Greatest Stretch', sets: '2', reps: '5/side' },
                { name: 'Scapular Pushups', sets: '2', reps: '12' }
            ]},
            { title: '💪 Main Workout', exercises: [
                { name: 'Front Squats (or Goblet)', sets: '3', reps: '10' },
                { name: 'Dumbbell Rows', sets: '3', reps: '12/arm' },
                { name: 'Dumbbell Bench Press', sets: '3', reps: '12' },
                { name: 'Face Pulls', sets: '3', reps: '15' },
                { name: 'Bicep Curls', sets: '3', reps: '12-15' }
            ]},
            { title: '🧘 Cool Down', exercises: [
                { name: 'Tricep Stretch', sets: '1', reps: '30s/side' },
                { name: 'Doorway Pec Stretch', sets: '1', reps: '30s/side' }
            ]}
        ]
    },
    { 
        id: 105, 
        name: 'Day 5: Compound Focus', 
        level: 'Advanced', 
        sections: [
            { title: '🔥 Warm-up & Activation', exercises: [
                { name: 'Rower/Bike', sets: '1', reps: '5 min' },
                { name: 'Y-T-W Raises', sets: '2', reps: '10' },
                { name: 'Leg Swings', sets: '2', reps: '10/side' }
            ]},
            { title: '💪 Main Workout', exercises: [
                { name: 'Deadlifts', sets: '3', reps: '5' },
                { name: 'Standing Military Press', sets: '3', reps: '8' },
                { name: 'Weighted Dips', sets: '3', reps: '8-10' },
                { name: 'Bulgarian Split Squats', sets: '3', reps: '8/leg' }
            ]},
            { title: '🧘 Cool Down', exercises: [
                { name: 'Pigeon Pose', sets: '1', reps: '1 min/side' },
                { name: 'Downward Dog', sets: '1', reps: '1 min' }
            ]}
        ]
    },
    { 
        id: 106, 
        name: 'Day 6: Metabolic Conditioning', 
        level: 'Intermediate', 
        sections: [
            { title: '🔥 Warm-up & Activation', exercises: [
                { name: 'Box Jumps (Low)', sets: '2', reps: '10' },
                { name: 'Inchworms', sets: '2', reps: '8' },
                { name: 'Spiderman Lunges', sets: '2', reps: '6/side' }
            ]},
            { title: '💪 Main Workout', exercises: [
                { name: 'Thrusters', sets: '3', reps: '12' },
                { name: 'Renegade Rows', sets: '3', reps: '10/side' },
                { name: 'Mountain Climbers', sets: '3', reps: '30s' },
                { name: 'Burpees', sets: '3', reps: '10' },
                { name: 'Farmers Walk', sets: '3', reps: '40m' }
            ]},
            { title: '🧘 Cool Down', exercises: [
                { name: 'Full Body Foam Roll', sets: '1', reps: '5 min' },
                { name: 'Deep Breathing', sets: '1', reps: '2 min' }
            ]}
        ]
    },
];

export const INITIAL_MEMBER_SCHEDULES: MemberSchedules = {
    1: { // Aarav Sharma
        // Schedules are now dynamically calculated in the component based on Day of Week
        [new Date().toISOString().split('T')[0]]: { templateId: 101 }, 
    },
    2: { // Priya Patel
       [new Date().toISOString().split('T')[0]]: { templateId: 102 },
    }
};


export const INITIAL_DIETS: DietPlan[] = [
    { id: 1, name: 'High Protein Bulking Plan', description: 'A diet plan focused on muscle gain with high protein and calorie intake.', calories: 3000, category: 'Weight Gain', assignedTo: [1] },
    { id: 2, name: 'Weight Loss Plan', description: 'A balanced diet plan with a calorie deficit to promote fat loss.', calories: 1800, category: 'Weight Loss', assignedTo: [4, 5] },
    { id: 3, name: 'Balanced Maintenance Plan', description: 'A plan to maintain current weight while supporting an active lifestyle.', calories: 2200, category: 'Maintenance', assignedTo: [2] },
];

export const INITIAL_MEMBER_FITNESS_DATA: MemberFitnessData = {
    1: { // Aarav Sharma
        logs: [
            { 
                date: '2024-07-01', 
                templateName: 'Push Day', 
                completedExercises: INITIAL_WORKOUT_TEMPLATES[0].sections![1].exercises,
                performance: [
                    { exercise: 'Bench Press', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 65 }, { reps: 6, weight: 70 }] },
                    { exercise: 'Squats', sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 85 }, { reps: 8, weight: 85 }] },
                ]
            }
        ],
        metrics: [
            { date: '2024-07-01', weight: 80, bodyFat: 15.2 },
            { date: '2024-07-15', weight: 81, bodyFat: 15.0 },
            { date: '2024-08-01', weight: 82.5, bodyFat: 14.8 },
        ]
    },
    2: { // Priya Patel
        logs: [],
        metrics: [
            { date: '2024-07-01', weight: 65 },
            { date: '2024-08-01', weight: 64 },
        ]
    }
};


export const INITIAL_LEADS: Lead[] = [
    { id: 1, name: 'Amit Desai', phone: '9988776655', email: 'amit.d@example.com', inquiryDate: '2024-07-20', status: 'New', source: 'Facebook' },
    { id: 2, name: 'Sunita Joshi', phone: '9988776654', email: 'sunita.j@example.com', inquiryDate: '2024-07-18', status: 'Contacted', source: 'Instagram' },
    { id: 3, name: 'Karan Malhotra', phone: '9988776653', email: 'karan.m@example.com', inquiryDate: '2024-07-22', status: 'New', source: 'Website' },
    { id: 4, name: 'Neha Reddy', phone: '9988776652', email: 'neha.r@example.com', inquiryDate: '2024-07-21', status: 'Converted', source: 'Walk-in' },
    { id: 5, name: 'Raj Singh', phone: '9988776651', email: 'raj.s@example.com', inquiryDate: '2024-07-19', status: 'Lost', source: 'Facebook' },
];

export const INITIAL_GOOGLE_REVIEWS: GoogleReview[] = [
    { id: 'review1', authorName: 'Priya Sharma', rating: 5, comment: 'Excellent gym with great equipment and friendly trainers. Highly recommend!', timestamp: '2024-07-28', reply: { comment: 'Thank you Priya! We are so glad you are enjoying your experience.', timestamp: '2024-07-29' } },
    { id: 'review2', authorName: 'Rajesh Kumar', rating: 4, comment: 'Good facilities, but can get crowded during peak hours. Overall a positive experience.', timestamp: '2024-07-25' },
    { id: 'review3', authorName: 'Anjali Verma', rating: 5, comment: 'The personal training sessions are fantastic. My trainer is very knowledgeable.', timestamp: '2024-07-22', reply: { comment: 'Thanks Anjali! We are proud of our trainers.', timestamp: '2024-07-23' } },
    { id: 'review4', authorName: 'Suresh Singh', rating: 3, comment: 'The cardio machines could use an upgrade. Everything else is fine.', timestamp: '2024-07-20' },
];

export const INITIAL_GOOGLE_POSTS: GoogleBusinessPost[] = [
    { id: 'post1', content: 'New Year, New You! Get 20% off on all annual memberships. Offer valid until Jan 31st. Visit us today!', imageUrl: 'https://picsum.photos/seed/offer/400/300', timestamp: '2024-07-15', state: 'LIVE' },
    { id: 'post2', content: 'We are now open 24/7! Workout anytime you want. Your fitness journey on your schedule.', timestamp: '2024-07-10', state: 'LIVE' },
];

export const INITIAL_GOOGLE_INSIGHTS: GoogleBusinessInsights = {
    profileViews: 1254,
    searchViews: 876,
    actions: 132, // (e.g., website clicks, calls)
    averageRating: 4.7,
    totalReviews: 28,
};

export const INITIAL_BROADCASTS: BroadcastMessage[] = [
    { id: 1, message: 'Special offer this month! Bring a friend and get 50% off on your next renewal.', audience: 'active', recipientCount: 2, sentAt: '2024-07-25' },
    { id: 2, message: 'Your membership has expired. Renew now to continue your fitness journey with us and get a 10% discount!', audience: 'expired', recipientCount: 1, sentAt: '2024-07-22' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: 'TXN72834', memberName: 'Aarav Sharma', amount: 5000, date: '2024-07-28', method: 'QR Code' },
    { id: 'TXN91031', memberName: 'Anika Singh', amount: 2000, date: '2024-07-27', method: 'QR Code' },
    { id: 'TXN12345', memberName: 'Priya Patel', amount: 3000, date: '2024-07-26', method: 'Cash' },
];

export const INITIAL_ACTIVITY_EVENTS: ActivityEvent[] = [
    { id: 1, type: 'check-in', message: 'Aarav Sharma just checked in for a workout.', timestamp: new Date(Date.now() - 1000 * 60 * 5), memberId: 1 },
    { id: 2, type: 'payment', message: 'Payment of ₹2000 received from Anika Singh.', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
    { id: 3, type: 'ai-suggestion', message: 'Morning attendance is lower than average. Consider sending a motivational broadcast.', timestamp: new Date(Date.now() - 1000 * 60 * 30), action: { label: 'Compose Message', view: 'whatsapp' } },
];

export const INITIAL_HEALTH_DATA: HealthData = {
  date: '2024-07-29',
  steps: 8500,
  heartRate: {
    avg: 75,
    max: 160,
    min: 55,
    history: [
        { time: '6am', value: 60 },
        { time: '9am', value: 75 },
        { time: '12pm', value: 80 },
        { time: '3pm', value: 78 },
        { time: '6pm', value: 120 },
        { time: '9pm', value: 70 },
    ]
  },
  caloriesBurned: 2300,
  sleep: {
    totalHours: 7.5,
    deepHours: 2.1,
    remHours: 1.8,
  },
};

export const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Follow up with new leads', priority: 'High', dueDate: '2024-08-10', completed: false },
  { id: 2, title: 'Order new yoga mats', description: 'Need 10 new mats from the usual supplier.', priority: 'Medium', dueDate: '2024-08-15', completed: false },
  { id: 3, title: 'Plan September social media content', priority: 'Low', dueDate: '2024-08-25', completed: false },
  { id: 4, title: 'Process monthly staff payroll', priority: 'High', dueDate: '2024-07-30', completed: true },
  { id: 5, title: 'Service the main treadmill', description: 'It\'s making a squeaking noise.', priority: 'High', dueDate: '2024-08-05', completed: false },
  { id: 6, title: 'Update the welcome email template', priority: 'Low', dueDate: '2024-09-01', completed: false },
];
