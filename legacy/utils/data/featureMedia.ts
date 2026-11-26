export interface FeatureMediaItem {
  num: string;
  lane: 'operations' | 'members' | 'training' | 'finance';
  en: string;
  hi: string;
  captionEn: string;
  captionHi: string;
  image: string;
  alt: string;
  objectPosition?: string;
}

export const FEATURE_IMAGES = {
  // 1. Dark luxury tablet dashboard (Total Revenue, Active Members, Check-In Activity)
  executiveDashboard: '/icon.svg',
  // 2. Reports & Expense Analytics (Total Income, Expense, Target Gauge, Tier Chart)
  reportsAnalytics: '/icon.svg',
  // 3. Athlete + 3 dark mobile workout/progress/coach screens
  workoutEngine: '/icon.svg',
  // 4. Monochrome obsidian business management + All Members directory + Gym Capacity
  membersDirectory: '/icon.svg',
  // 5. Warm amber 3D anatomy biomechanics, muscle engagement & body metrics
  biomechanicsIntake: '/icon.svg',
  // 6. Staff & trainers collaborating around emerald live operations & schedule board
  staffOperations: '/icon.svg',
  // 7. Gym manager commanding translucent glass HUD (Engagement, Schedule, Revenue)
  autoOperationsHud: '/icon.svg',
  // 8. Emerald 3-phone mobile app (Activity Overview, Daily Workouts, Nutrition Plans)
  nutritionMobile: '/icon.svg',
  // 9. Luxury dark-gold iPhone (Today's Workout, Coach Assessment, Hypertrophy, Steps)
  onboardingAssessment: '/icon.svg',
  // 10. 3-phone adaptive concierge chat, daily summary & dynamic schedule timeline
  whatsappConcierge: '/icon.svg',
  // 11. Cyan gym reception desk with biometric turnstile gates & fingerprint pad
  biometricGate: '/icon.svg',
  // 12. Personal Trainer hub (Active Sessions, Clients Coached, Services & Earnings)
  personalTrainerHub: '/icon.svg',
  // 13. Glass Billing & Payments display (Automated Invoicing, Razorpay, Stripe, Trends)
  billingPayments: '/icon.svg',
  // 14. Luxury gym office desk with Laptop & Tablet Future-Proof Gym Management suite
  clubManagementSuite: '/icon.svg',
  // 15. 4-screen mobile app (Heart Rate, Activity Rings, Workout Videos, Profile/Settings)
  memberMobileSuite: '/icon.svg',
  // 16. Panoramic live gym floor with floating member cards, timetable & analytics
  liveFloorShowcase: '/icon.svg',
  // 17. Multi-device Membership Management desk (Desktop, Tablets, Phones & Scanners)
  membershipMultiDevice: '/icon.svg',
} as const;

export const ALL_18_MODULE_MEDIA: FeatureMediaItem[] = [
  {
    num: '01',
    lane: 'operations',
    en: 'Auto Operations Hub',
    hi: 'ऑटो ऑपरेशंस हब',
    captionEn: 'Live club command console uniting member engagement, class schedules, and revenue telemetry.',
    captionHi: 'मेंबर एंगेजमेंट, क्लास शेड्यूल और रेवेन्यू विश्लेषण का लाइव कमांड कंसोल।',
    image: FEATURE_IMAGES.autoOperationsHud,
    alt: 'Fitness Future Auto Operations Command Console',
  },
  {
    num: '02',
    lane: 'operations',
    en: 'Smart App Settings',
    hi: 'स्मार्ट ऐप सेटिंग्स',
    captionEn: 'Unified member preferences, dark mode controls, push alerts, data export, and privacy locks.',
    captionHi: 'यूज़र प्रेफरेंस, डार्क मोड, नोटिफिकेशन, डेटा एक्सपोर्ट और प्राइवेसी नियंत्रण।',
    image: FEATURE_IMAGES.memberMobileSuite,
    alt: 'Fitness Future Smart App Settings and Mobile Profile',
  },
  {
    num: '03',
    lane: 'operations',
    en: 'Full Automation Dashboard',
    hi: 'फुल ऑटोमेशन डैशबोर्ड',
    captionEn: 'Real-time KPI tracking for revenue, active members, 7-day check-in trends, and renewals.',
    captionHi: 'रेवेन्यू, सक्रिय मेंबर्स, 7-दिन के चेक-इन और रिन्यूअल का रियल-टाइम डैशबोर्ड।',
    image: FEATURE_IMAGES.executiveDashboard,
    alt: 'Fitness Future Full Automation Executive Dashboard',
  },
  {
    num: '04',
    lane: 'members',
    en: 'Membership Packages',
    hi: 'मेंबरशिप पैकेज',
    captionEn: 'Multi-device tier management synchronized across desktop reception, tablets, and member phones.',
    captionHi: 'डेस्कटॉप, टैबलेट और मोबाइल पर सिंक होने वाला मल्टी-डिवाइस पैकेज प्रबंधन।',
    image: FEATURE_IMAGES.membershipMultiDevice,
    alt: 'Fitness Future Multi-Device Membership Packages Management',
  },
  {
    num: '05',
    lane: 'members',
    en: 'Members Directory',
    hi: 'मेंबर्स डायरेक्टरी',
    captionEn: 'Complete member roster with live floor capacity tracking, expiry sorting, and instant search.',
    captionHi: 'लाइव फ्लोर कैपेसिटी, एक्सपायरी सॉर्टिंग और त्वरित खोज के साथ मेंबर्स डायरेक्टरी।',
    image: FEATURE_IMAGES.membersDirectory,
    alt: 'Fitness Future Members Directory and Floor Capacity Dashboard',
  },
  {
    num: '06',
    lane: 'finance',
    en: 'Smart Billing & GST UPI',
    hi: 'स्मार्ट बिलिंग व GST UPI',
    captionEn: 'Automated GST invoicing, Razorpay and UPI checkout flows, overdue alerts, and revenue curves.',
    captionHi: 'ऑटोमेटेड GST इनवॉइसिंग, Razorpay व UPI पेमेंट और रेवेन्यू ट्रेंड ट्रैकिंग।',
    image: FEATURE_IMAGES.billingPayments,
    alt: 'Fitness Future Smart Billing and Automated Invoicing System',
  },
  {
    num: '07',
    lane: 'members',
    en: 'Active Memberships & PT Hub',
    hi: 'सक्रिय मेंबरशिप व PT हब',
    captionEn: 'Manage 1-on-1 coaching, group strength packages, active sessions, and trainer earnings in one ledger.',
    captionHi: '1-ऑन-1 कोचिंग, ग्रुप स्ट्रेंथ पैकेज, सक्रिय सेशन और ट्रेनर अर्निंग्स का पूरा लेजर।',
    image: FEATURE_IMAGES.personalTrainerHub,
    alt: 'Fitness Future Personal Training and Active Memberships Hub',
  },
  {
    num: '08',
    lane: 'members',
    en: 'Smart Leads Pipeline',
    hi: 'स्मार्ट लीड्स पाइपलाइन',
    captionEn: 'Guided fitness assessments, automated onboarding milestones, and instant trial conversion tracking.',
    captionHi: 'गाइडेड फिटनेस असेसमेंट, ऑटोमेटेड ऑनबोर्डिंग और ट्रायल कन्वर्ज़न ट्रैकिंग।',
    image: FEATURE_IMAGES.onboardingAssessment,
    alt: 'Fitness Future Smart Leads and Onboarding Assessment Mobile View',
  },
  {
    num: '09',
    lane: 'training',
    en: 'Pro Workout Engine',
    hi: 'प्रो वर्कआउट इंजन',
    captionEn: 'Structured strength routines, rest timers, set/rep overload logging, and daily progress rings.',
    captionHi: 'स्ट्रेंथ रूटीन, रेस्ट टाइमर, सेट-रेप ओवरलोड लॉगिंग और डेली प्रोग्रेस रिंग्स।',
    image: FEATURE_IMAGES.workoutEngine,
    alt: 'Fitness Future Pro Workout Engine and Progress Tracking App',
  },
  {
    num: '10',
    lane: 'training',
    en: 'Regional Indian Nutrition Plans',
    hi: 'भारतीय क्षेत्रीय डाइट प्लान्स',
    captionEn: 'Personalized daily nutrition protocols, calorie tracking, cardio schedules, and recovery plans.',
    captionHi: 'व्यक्तिगत भारतीय डाइट प्रोटोकॉल, कैलोरी ट्रैकिंग और दैनिक एक्टिविटी प्लान्स।',
    image: FEATURE_IMAGES.nutritionMobile,
    alt: 'Fitness Future Regional Indian Nutrition and Activity Mobile App',
  },
  {
    num: '11',
    lane: 'training',
    en: 'Staff & Shift Management',
    hi: 'स्टाफ व शिफ्ट मैनेजमेंट',
    captionEn: 'Coordinate coaches, class bookings, shift schedules, injury logs, and daily floor duties.',
    captionHi: 'कोच शेड्यूल, क्लास बुकिंग, शिफ्ट मैनेजमेंट और दैनिक फ्लोर संचालन का समन्वय।',
    image: FEATURE_IMAGES.staffOperations,
    alt: 'Fitness Future Staff and Shift Operations Board',
  },
  {
    num: '12',
    lane: 'finance',
    en: 'Smart Expense Auditor',
    hi: 'स्मार्ट खर्च प्रबंधन',
    captionEn: 'Real-time income vs. expense comparisons, monthly burn controls, and profit margin monitoring.',
    captionHi: 'रियल-टाइम आय बनाम खर्च तुलना, मासिक बजट नियंत्रण और प्रॉफिट मार्जिन ऑडिट।',
    image: FEATURE_IMAGES.reportsAnalytics,
    alt: 'Fitness Future Smart Expense and Income Audit Console',
  },
  {
    num: '13',
    lane: 'operations',
    en: 'Executive Performance Reports',
    hi: 'एग्जीक्यूटिव परफॉर्मेंस रिपोर्ट्स',
    captionEn: 'Target achievement gauges, Gold/Silver/Platinum retention curves, and attendance audit exports.',
    captionHi: 'टारगेट अचीवमेंट गेज, मेंबरशिप रिटेंशन चार्ट और अटेंडेंस रिपोर्ट एक्सपोर्ट।',
    image: FEATURE_IMAGES.reportsAnalytics,
    alt: 'Fitness Future Executive Performance Reports Dashboard',
  },
  {
    num: '14',
    lane: 'training',
    en: 'Hybrid Geometric Attendance',
    hi: 'हाइब्रिड ज्योमेट्रिक अटेंडेंस',
    captionEn: 'Turnstile biometric entry combining face geometry, QR passes, and fingerprint verification.',
    captionHi: 'फेस ज्योमेट्री, QR पास और बायोमेट्रिक स्कैनर के साथ स्मार्ट टर्नस्टाइल एंट्री।',
    image: FEATURE_IMAGES.biometricGate,
    alt: 'Fitness Future Hybrid Biometric Turnstile Gate and Reception Desk',
  },
  {
    num: '15',
    lane: 'operations',
    en: 'Complete Club Management',
    hi: 'संपूर्ण क्लब मैनेजमेंट',
    captionEn: 'Future-proof desktop and tablet workspace synchronizing members, bookings, and equipment status.',
    captionHi: 'लैपटॉप और टैबलेट पर मेंबर्स, बुकिंग और उपकरण स्थिति का संपूर्ण नियंत्रण।',
    image: FEATURE_IMAGES.clubManagementSuite,
    alt: 'Fitness Future Complete Multi-Device Club Management Suite',
  },
  {
    num: '16',
    lane: 'members',
    en: 'Scientific Admission Form',
    hi: 'साइंटिफिक एडमिशन फॉर्म',
    captionEn: '3D anatomical muscle profiling, stability indexing, and baseline anthropometric health intake.',
    captionHi: '3D एनाटॉमी प्रोफाइलिंग, मसल एंगेजमेंट और वैज्ञानिक शारीरिक मूल्यांकन एडमिशन।',
    image: FEATURE_IMAGES.biomechanicsIntake,
    alt: 'Fitness Future Scientific Biomechanical Body Analysis Admission',
  },
  {
    num: '17',
    lane: 'finance',
    en: 'WhatsApp Business Automation',
    hi: 'व्हाट्सएप बिजनेस ऑटोमेशन',
    captionEn: 'Automated daily workout/nutrition reminders, adaptive plan adjustments, and instant member replies.',
    captionHi: 'ऑटोमेटेड दैनिक वर्कआउट-डाइट रिमाइंडर, एडैप्टिव प्लान अपडेट और त्वरित सदस्य संदेश।',
    image: FEATURE_IMAGES.whatsappConcierge,
    alt: 'Fitness Future Automated WhatsApp Concierge and Adaptive Coaching',
  },
  {
    num: '18',
    lane: 'finance',
    en: 'Google Business Full Automation',
    hi: 'गूगल बिजनेस फुल ऑटोमेशन',
    captionEn: 'Live club showcase, real-time floor schedules, review automation, and local discovery analytics.',
    captionHi: 'लाइव क्लब शोकेस, रियल-टाइम फ्लोर शेड्यूल, रिव्यू ऑटोमेशन और लोकल ग्रोथ एनालिटिक्स।',
    image: FEATURE_IMAGES.liveFloorShowcase,
    alt: 'Fitness Future Live Club Floor Showcase and Local Growth Automation',
  },
];

export const MODULE_MEDIA_BY_NUM: Record<string, FeatureMediaItem> = Object.fromEntries(
  ALL_18_MODULE_MEDIA.map((item) => [item.num, item])
);

export const ADMIN_MATRIX_MEDIA: string[] = [
  FEATURE_IMAGES.staffOperations,       // 1. Operations, Staff & Attendance
  FEATURE_IMAGES.membersDirectory,      // 2. Member & Lead CRM Suite
  FEATURE_IMAGES.workoutEngine,         // 3. Fitness, Workout & Form Lab
  FEATURE_IMAGES.biomechanicsIntake,    // 4. Diet, Medical & Genomic Station
  FEATURE_IMAGES.billingPayments,       // 5. Billing, POS, EMI & FinTech
  FEATURE_IMAGES.biometricGate,         // 6. Automation, IoT, 3D Twin & Security
];

export const MEMBER_MATRIX_MEDIA: string[] = [
  FEATURE_IMAGES.workoutEngine,         // 1. Fitness, Workout & Form Core
  FEATURE_IMAGES.nutritionMobile,       // 2. Diet, Kitchen Chief & Nutrition
  FEATURE_IMAGES.biomechanicsIntake,    // 3. Medical, DNA, Sleep & Recovery
  FEATURE_IMAGES.billingPayments,       // 4. Memberships, EMI & Wallet
  FEATURE_IMAGES.biometricGate,         // 5. Smart Gate, Wearables & 3D Twin
  FEATURE_IMAGES.memberMobileSuite,     // 6. Community, Coaching & Support
];

export const PACKAGE_TIER_MEDIA: string[] = [
  FEATURE_IMAGES.onboardingAssessment,  // Foundation Monthly
  FEATURE_IMAGES.workoutEngine,         // Transformation Quarterly
  FEATURE_IMAGES.clubManagementSuite,   // Apex Performance Yearly
];
