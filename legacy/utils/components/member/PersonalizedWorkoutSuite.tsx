import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dumbbell,
  TrendingUp,
  MessageSquare,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Download,
  Trash2,
  Heart,
  Send,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Save,
  Search,
  Languages,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAutomationStore, bi } from '../../store/useAutomationStore';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { persistFirestoreDocument } from '../../../src/backend/FitnessFutureService';

export type FitnessSuiteTab = 'planner' | 'progress' | 'community';

export interface PlannedExercise {
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string;
  restSeconds: number;
  equipment: string;
  coachNote: string;
}

export interface WorkoutDayPlan {
  day: string;
  focus: string;
  warmup: string;
  cooldown: string;
  exercises: PlannedExercise[];
}

export interface GeneratedWorkoutPlan {
  id: string;
  planTitle: string;
  summary: string;
  goal: string;
  experience: string;
  equipmentUsed: string[];
  daysPerWeek: number;
  durationMinutes: number;
  isSample?: boolean;
  weeklySchedule: WorkoutDayPlan[];
  progressionRules: string[];
  createdAt: string;
}

export interface DetailedWorkoutLog {
  id: string;
  date: string;
  exercise: string;
  weightKg: number;
  sets: number;
  reps: number;
  restSeconds: number;
  rpe?: number;
  notes?: string;
}

export type ForumCategory = 'पोषण' | 'कसरत युक्तियाँ' | 'प्रेरणा';

export interface ForumReply {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  category: ForumCategory;
  postType: 'question' | 'tip' | 'milestone';
  title: string;
  content: string;
  author: string;
  authorRole: string;
  photoDataUrl?: string;
  likes: number;
  likedByMe?: boolean;
  replies: ForumReply[];
  createdAt: string;
}

interface PersonalizedWorkoutSuiteProps {
  defaultTab?: FitnessSuiteTab;
  currentUser?: any;
  onBackToWebsite?: () => void;
  onOpenPortalLogin?: () => void;
}

const PLAN_STORAGE_KEY = 'ff_personalized_workout_plan_v2';
const LOGS_STORAGE_KEY = 'ff_detailed_workout_logs_v2';
const FORUM_STORAGE_KEY = 'ff_community_forum_posts_v2';

const GOAL_OPTIONS = [
  { id: 'Muscle Gain (Hypertrophy)', en: 'Muscle Gain (Hypertrophy)', hi: 'मसल बिल्डिंग (हाइपरट्रॉफी)' },
  { id: 'Fat Loss & Conditioning', en: 'Fat Loss & Conditioning', hi: 'वज़न और फैट घटाना' },
  { id: 'Pure Strength & Power', en: 'Pure Strength & Power', hi: 'प्योर स्ट्रेंथ और पावर' },
  { id: 'General Fitness & Mobility', en: 'General Fitness & Mobility', hi: 'जनरल फिटनेस व फ्लेक्सिबिलिटी' },
  { id: 'Athletic Endurance', en: 'Athletic Endurance', hi: 'एथलेटिक स्टैमिना व एंड्योरेंस' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'Beginner', en: 'Beginner (0–6 Months)', hi: 'शुरुआती (0–6 महीने)' },
  { id: 'Intermediate', en: 'Intermediate (6–24 Months)', hi: 'मध्यम (6–24 महीने)' },
  { id: 'Advanced', en: 'Advanced (2+ Years)', hi: 'उन्नत (2+ वर्ष)' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'Full Gym', en: 'Full Gym', hi: 'पूर्ण जिम' },
  { id: 'Dumbbells', en: 'Dumbbells', hi: 'डंबल' },
  { id: 'Barbell & Bench', en: 'Barbell & Bench', hi: 'बारबेल व बेंच' },
  { id: 'Cable Machine', en: 'Cable Machine', hi: 'केबल मशीन' },
  { id: 'Resistance Bands', en: 'Resistance Bands', hi: 'रेजिस्टेंस बैंड' },
  { id: 'Kettlebell', en: 'Kettlebell', hi: 'केटलबेल' },
  { id: 'Bodyweight Only', en: 'Bodyweight Only', hi: 'केवल बॉडीवेट' },
];

const EXERCISE_PRESETS = [
  'Bench Press',
  'Barbell Squat',
  'Deadlift',
  'Overhead Press',
  'Dumbbell Row',
  'Pull-Ups',
  'Romanian Deadlift',
  'Incline Dumbbell Press',
  'Lat Pulldown',
  'Bulgarian Split Squat',
];

function buildSamplePlan(lang: 'en' | 'hi'): GeneratedWorkoutPlan {
  if (lang === 'hi') {
    return {
      id: 'SAMPLE_HYPERTROPHY_4DAY_HI',
      planTitle: '4-दिवसीय अपर / लोअर मसल बिल्डिंग नमूना योजना',
      summary:
        'यह वैज्ञानिक नमूना योजना मध्यम स्तर (Intermediate) के अभ्यासियों के लिए मसल हाइपरट्रॉफी और संतुलित शक्ति विकास हेतु डंबल, बारबेल और बेंच के साथ तैयार की गई है। हर सप्ताह 2.5 किग्रा या 1-2 रेप्स बढ़ाने का लक्ष्य रखें।',
      goal: 'मसल बिल्डिंग (हाइपरट्रॉफी)',
      experience: 'मध्यम (6–24 महीने)',
      equipmentUsed: ['डंबल', 'बारबेल व बेंच', 'केबल मशीन'],
      daysPerWeek: 4,
      durationMinutes: 60,
      isSample: true,
      createdAt: new Date().toISOString(),
      weeklySchedule: [
        {
          day: 'दिन 1 — सोमवार',
          focus: 'अपर बॉडी पुश (छाती, कंधे, ट्राइसेप्स)',
          warmup: '5 मिनट आर्म सर्कल, बैंड पुल-अपार्ट और हल्के वजन से बेंच प्रेस के 2 वार्म-अप सेट।',
          cooldown: '5 मिनट चेस्ट डोरवे स्ट्रेच और शोल्डर क्रॉस-बॉडी स्ट्रेच।',
          exercises: [
            {
              name: 'Flat Barbell Bench Press',
              targetMuscle: 'Chest (छाती)',
              sets: 4,
              reps: '8-10',
              restSeconds: 120,
              equipment: 'Barbell & Bench',
              coachNote: 'बार को नियंत्रित गति (2 सेकंड नीचे) से लाएँ और 1 सेकंड रुककर ऊपर पुश करें।',
            },
            {
              name: 'Incline Dumbbell Press',
              targetMuscle: 'Upper Chest (अपर चेस्ट)',
              sets: 3,
              reps: '10-12',
              restSeconds: 90,
              equipment: 'Dumbbells',
              coachNote: 'बेंच को 30 डिग्री पर रखें, कोहनी को 45° कोण में नियंत्रित करें।',
            },
            {
              name: 'Seated Dumbbell Overhead Press',
              targetMuscle: 'Shoulders (कंधे)',
              sets: 3,
              reps: '8-10',
              restSeconds: 90,
              equipment: 'Dumbbells',
              coachNote: 'कोर को टाइट रखें और कमर को पीछे ज्यादा न झुकाएँ।',
            },
            {
              name: 'Cable Triceps Rope Pushdown',
              targetMuscle: 'Triceps (ट्राइसेप्स)',
              sets: 3,
              reps: '12-15',
              restSeconds: 60,
              equipment: 'Cable Machine',
              coachNote: 'नीचे पूरी तरह रस्सी खोलकर 1 सेकंड स्क्वीज़ करें।',
            },
          ],
        },
        {
          day: 'दिन 2 — मंगलवार',
          focus: 'लोअर बॉडी स्ट्रेंथ (क्वाड्स, हैमस्ट्रिंग्स, कोर)',
          warmup: '6 मिनट हिप ओपनर, लेग स्विंग्स और बॉडीवेट स्क्वाट के 2 सेट।',
          cooldown: '5 मिनट हैमस्ट्रिंग और क्वाड स्ट्रेचिंग।',
          exercises: [
            {
              name: 'Barbell Back Squat',
              targetMuscle: 'Quads & Glutes (पैर)',
              sets: 4,
              reps: '6-8',
              restSeconds: 150,
              equipment: 'Barbell & Bench',
              coachNote: 'गहरी सांस भरकर कोर ब्रेस करें और जांघों को समानांतर से नीचे ले जाएँ।',
            },
            {
              name: 'Romanian Deadlift',
              targetMuscle: 'Hamstrings (हैमस्ट्रिंग्स)',
              sets: 3,
              reps: '8-10',
              restSeconds: 120,
              equipment: 'Barbell & Bench',
              coachNote: 'कूल्हों को पीछे धकेलें, पीठ सीधी रखें और हैमस्ट्रिंग में खिंचाव महसूस करें।',
            },
            {
              name: 'Bulgarian Split Squat',
              targetMuscle: 'Single-Leg Stability',
              sets: 3,
              reps: '10 / leg',
              restSeconds: 90,
              equipment: 'Dumbbells',
              coachNote: 'आगे वाले पैर के संतुलन पर ध्यान दें, घुटना अंदर न झुकने दें।',
            },
            {
              name: 'Weighted Plank Hold',
              targetMuscle: 'Core (कोर)',
              sets: 3,
              reps: '45-60s',
              restSeconds: 60,
              equipment: 'Bodyweight Only',
              coachNote: 'सिर से एड़ी तक शरीर एक सीधी रेखा में रखें।',
            },
          ],
        },
        {
          day: 'दिन 3 — गुरुवार',
          focus: 'अपर बॉडी पुल (पीठ, रियर डेल्ट्स, बाइसेप्स)',
          warmup: '5 मिनट स्कैपुलर पुल-अप्स और हल्के केबल फेस-पुल।',
          cooldown: '5 मिनट लैट स्ट्रेच और फोरआर्म रिलैक्स।',
          exercises: [
            {
              name: 'Single-Arm Dumbbell Row',
              targetMuscle: 'Lats & Upper Back (पीठ)',
              sets: 4,
              reps: '8-10',
              restSeconds: 90,
              equipment: 'Dumbbells',
              coachNote: 'डंबल को कमर की ओर खींचें और पीठ की मांसपेशियों को सिकोड़ें।',
            },
            {
              name: 'Wide-Grip Lat Pulldown',
              targetMuscle: 'Back Width (लैट्स)',
              sets: 3,
              reps: '10-12',
              restSeconds: 90,
              equipment: 'Cable Machine',
              coachNote: 'कोहनियों को नीचे की तरफ खींचें, शरीर को झटका न दें।',
            },
            {
              name: 'Cable Face Pull',
              targetMuscle: 'Rear Delts & Posture',
              sets: 3,
              reps: '12-15',
              restSeconds: 60,
              equipment: 'Cable Machine',
              coachNote: 'रस्सी को माथे की ऊँचाई तक खींचें और कंधे बाहर घुमाएँ।',
            },
            {
              name: 'Incline Dumbbell Curl',
              targetMuscle: 'Biceps (बाइसेप्स)',
              sets: 3,
              reps: '10-12',
              restSeconds: 60,
              equipment: 'Dumbbells',
              coachNote: 'पूरी रेंज ऑफ मोशन रखें और कोहनियों को स्थिर रखें।',
            },
          ],
        },
        {
          day: 'दिन 4 — शनिवार',
          focus: 'फुल बॉडी कंडीशनिंग और पावर',
          warmup: '6 मिनट जंपिंग जैक्स, वर्ल्ड्स ग्रेटेस्ट स्ट्रेच और हल्का डेडलिफ्ट।',
          cooldown: '6 मिनट डीप ब्रीदिंग और लोअर बैक स्ट्रेच।',
          exercises: [
            {
              name: 'Conventional Deadlift',
              targetMuscle: 'Posterior Chain (फुल बैक व लेग्स)',
              sets: 4,
              reps: '5-6',
              restSeconds: 180,
              equipment: 'Barbell & Bench',
              coachNote: 'बार को पिंडलियों के करीब रखें और पैरों से जमीन को पुश करें।',
            },
            {
              name: 'Dumbbell Walking Lunges',
              targetMuscle: 'Quads & Glutes',
              sets: 3,
              reps: '12 / leg',
              restSeconds: 90,
              equipment: 'Dumbbells',
              coachNote: 'लंबे और संतुलित कदम रखें, छाती ऊपर रखें।',
            },
            {
              name: 'Dumbbell Lateral Raise',
              targetMuscle: 'Side Delts (कंधे)',
              sets: 3,
              reps: '12-15',
              restSeconds: 60,
              equipment: 'Dumbbells',
              coachNote: 'हल्के वजन से कंधों के स्तर तक नियंत्रित उठाव करें।',
            },
          ],
        },
      ],
      progressionRules: [
        'प्रोग्रेसिव ओवरलोड: जब किसी व्यायाम के सभी सेटों में अधिकतम रेप्स आसानी से पूरे हों, तो अगले सत्र में 2.5 किग्रा वजन बढ़ाएँ।',
        'आराम का अनुशासन: कंपाउंड लिफ्ट्स में 120–180 सेकंड और आइसोलेशन व्यायाम में 60–90 सेकंड आराम लें।',
        'रिकवरी व प्रोटीन: प्रतिदिन शरीर के वजन के अनुसार 1.6–2.0 ग्राम/किग्रा प्रोटीन और 7.5+ घंटे की नींद सुनिश्चित करें।',
      ],
    };
  }

  return {
    id: 'SAMPLE_HYPERTROPHY_4DAY_EN',
    planTitle: '4-Day Upper / Lower Hypertrophy Sample Plan',
    summary:
      'A balanced 4-day strength and muscle-building protocol built for Intermediate lifters using Dumbbells, Barbell & Bench, and Cable Machine. Structured around progressive overload and disciplined rest intervals.',
    goal: 'Muscle Gain (Hypertrophy)',
    experience: 'Intermediate',
    equipmentUsed: ['Dumbbells', 'Barbell & Bench', 'Cable Machine'],
    daysPerWeek: 4,
    durationMinutes: 60,
    isSample: true,
    createdAt: new Date().toISOString(),
    weeklySchedule: [
      {
        day: 'Day 1 — Monday',
        focus: 'Upper Body Push (Chest, Shoulders, Triceps)',
        warmup: '5 min arm circles, band pull-aparts, and 2 light ramp-up sets on bench press.',
        cooldown: '5 min doorway pec stretch and overhead triceps mobility.',
        exercises: [
          {
            name: 'Flat Barbell Bench Press',
            targetMuscle: 'Chest',
            sets: 4,
            reps: '8-10',
            restSeconds: 120,
            equipment: 'Barbell & Bench',
            coachNote: 'Control the descent for 2 seconds, brief pause on chest, drive smoothly.',
          },
          {
            name: 'Incline Dumbbell Press',
            targetMuscle: 'Upper Chest',
            sets: 3,
            reps: '10-12',
            restSeconds: 90,
            equipment: 'Dumbbells',
            coachNote: '30-degree bench angle, keep elbows tucked at 45 degrees.',
          },
          {
            name: 'Seated Dumbbell Overhead Press',
            targetMuscle: 'Shoulders',
            sets: 3,
            reps: '8-10',
            restSeconds: 90,
            equipment: 'Dumbbells',
            coachNote: 'Brace core tight and avoid excessive lower-back arch.',
          },
          {
            name: 'Cable Triceps Rope Pushdown',
            targetMuscle: 'Triceps',
            sets: 3,
            reps: '12-15',
            restSeconds: 60,
            equipment: 'Cable Machine',
            coachNote: 'Flare rope ends cleanly at full elbow extension with 1s squeeze.',
          },
        ],
      },
      {
        day: 'Day 2 — Tuesday',
        focus: 'Lower Body Strength (Quads, Hamstrings, Core)',
        warmup: '6 min hip openers, leg swings, and 2 bodyweight squat sets.',
        cooldown: '5 min standing quad and hamstring static stretching.',
        exercises: [
          {
            name: 'Barbell Back Squat',
            targetMuscle: 'Quads & Glutes',
            sets: 4,
            reps: '6-8',
            restSeconds: 150,
            equipment: 'Barbell & Bench',
            coachNote: 'Brace 360 degrees around the waist and hit parallel depth cleanly.',
          },
          {
            name: 'Romanian Deadlift',
            targetMuscle: 'Hamstrings',
            sets: 3,
            reps: '8-10',
            restSeconds: 120,
            equipment: 'Barbell & Bench',
            coachNote: 'Hinge hips back with neutral spine until deep hamstring stretch.',
          },
          {
            name: 'Bulgarian Split Squat',
            targetMuscle: 'Unilateral Quads & Glutes',
            sets: 3,
            reps: '10 / leg',
            restSeconds: 90,
            equipment: 'Dumbbells',
            coachNote: 'Keep front knee tracking over toes with upright torso.',
          },
          {
            name: 'Weighted Plank Hold',
            targetMuscle: 'Core',
            sets: 3,
            reps: '45-60s',
            restSeconds: 60,
            equipment: 'Bodyweight Only',
            coachNote: 'Squeeze glutes and maintain straight line from shoulders to heels.',
          },
        ],
      },
      {
        day: 'Day 3 — Thursday',
        focus: 'Upper Body Pull (Back, Rear Delts, Biceps)',
        warmup: '5 min scapular pull-ups and light cable face pulls.',
        cooldown: '5 min lat stretch and thoracic rotation.',
        exercises: [
          {
            name: 'Single-Arm Dumbbell Row',
            targetMuscle: 'Lats & Upper Back',
            sets: 4,
            reps: '8-10',
            restSeconds: 90,
            equipment: 'Dumbbells',
            coachNote: 'Pull dumbbell toward hip pocket and pause briefly at peak contraction.',
          },
          {
            name: 'Wide-Grip Lat Pulldown',
            targetMuscle: 'Lats',
            sets: 3,
            reps: '10-12',
            restSeconds: 90,
            equipment: 'Cable Machine',
            coachNote: 'Drive elbows straight down without swinging torso.',
          },
          {
            name: 'Cable Face Pull',
            targetMuscle: 'Rear Delts',
            sets: 3,
            reps: '12-15',
            restSeconds: 60,
            equipment: 'Cable Machine',
            coachNote: 'Pull rope toward forehead and externally rotate shoulders.',
          },
          {
            name: 'Incline Dumbbell Curl',
            targetMuscle: 'Biceps',
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
            equipment: 'Dumbbells',
            coachNote: 'Full stretch at bottom, keep elbows fixed behind torso.',
          },
        ],
      },
      {
        day: 'Day 4 — Saturday',
        focus: 'Full Body Power & Conditioning',
        warmup: '6 min dynamic hip hinge drills and progressive deadlift ramp-ups.',
        cooldown: '6 min box breathing and lower-back decompression.',
        exercises: [
          {
            name: 'Conventional Deadlift',
            targetMuscle: 'Posterior Chain',
            sets: 4,
            reps: '5-6',
            restSeconds: 180,
            equipment: 'Barbell & Bench',
            coachNote: 'Pull slack out of the bar and drive feet through the floor.',
          },
          {
            name: 'Dumbbell Walking Lunges',
            targetMuscle: 'Quads & Glutes',
            sets: 3,
            reps: '12 / leg',
            restSeconds: 90,
            equipment: 'Dumbbells',
            coachNote: 'Controlled stride length with tall posture.',
          },
          {
            name: 'Dumbbell Lateral Raise',
            targetMuscle: 'Side Delts',
            sets: 3,
            reps: '12-15',
            restSeconds: 60,
            equipment: 'Dumbbells',
            coachNote: 'Lead slightly with elbows to shoulder height; avoid momentum.',
          },
        ],
      },
    ],
    progressionRules: [
      'Double Progression: Once you complete the top rep target across all sets with clean form, add 2.5 kg next week.',
      'Rest Discipline: Take 120–180s on heavy compound lifts and 60–90s on accessory movements.',
      'Recovery Baseline: Target 1.6–2.0 g/kg daily protein and 7.5+ hours of consistent sleep.',
    ],
  };
}

const DEFAULT_WORKOUT_LOGS: DetailedWorkoutLog[] = [
  { id: 'wl_1', date: '2026-10-18', exercise: 'Bench Press', weightKg: 70, sets: 4, reps: 8, restSeconds: 120, rpe: 7.5, notes: 'Clean bar speed' },
  { id: 'wl_2', date: '2026-10-22', exercise: 'Barbell Squat', weightKg: 90, sets: 4, reps: 8, restSeconds: 150, rpe: 8, notes: 'Full parallel depth' },
  { id: 'wl_3', date: '2026-10-26', exercise: 'Bench Press', weightKg: 75, sets: 4, reps: 8, restSeconds: 120, rpe: 8, notes: 'Strong pause reps' },
  { id: 'wl_4', date: '2026-10-30', exercise: 'Deadlift', weightKg: 115, sets: 4, reps: 5, restSeconds: 180, rpe: 8.5, notes: 'Beltless PR' },
  { id: 'wl_5', date: '2026-11-04', exercise: 'Bench Press', weightKg: 80, sets: 4, reps: 9, restSeconds: 110, rpe: 8.5, notes: 'Rep PR + faster rest recovery' },
  { id: 'wl_6', date: '2026-11-09', exercise: 'Barbell Squat', weightKg: 100, sets: 4, reps: 8, restSeconds: 135, rpe: 8.5, notes: 'New 100kg working set' },
  { id: 'wl_7', date: '2026-11-15', exercise: 'Bench Press', weightKg: 85, sets: 4, reps: 8, restSeconds: 120, rpe: 9, notes: 'Solid progression' },
];

const DEFAULT_FORUM_POSTS: ForumPost[] = [
  {
    id: 'fp_1',
    category: 'पोषण',
    postType: 'question',
    title: 'शाकाहारी आहार में प्रतिदिन 120g प्रोटीन कैसे पूरा करें?',
    content:
      'मैं सप्ताह में 4 दिन स्ट्रेंथ ट्रेनिंग कर रहा हूँ। सत्तू, पनीर और सोया चंक्स के अलावा कम कैलोरी में सबसे अच्छे शाकाहारी प्रोटीन विकल्प कौन से हैं?',
    author: 'रोहित वर्मा',
    authorRole: 'Member · 8 Months',
    likes: 18,
    likedByMe: false,
    createdAt: '2026-11-17T08:30:00Z',
    replies: [
      {
        id: 'rep_1',
        author: 'कोच आदित्य',
        role: 'Head Nutrition Coach',
        content:
          '200g लो-फैट पनीर (36g), 60g सोया चंक्स (31g), 1 स्कूप व्हे प्रोटीन (25g), और 150g ग्रीक दही + मूंग दाल चीला (28g) से आप आराम से 120g शुद्ध प्रोटीन पूरा कर सकते हैं।',
        createdAt: '2026-11-17T09:15:00Z',
      },
    ],
  },
  {
    id: 'fp_2',
    category: 'कसरत युक्तियाँ',
    postType: 'tip',
    title: 'बेंच प्रेस में कंधे के दर्द से बचने के लिए 45° एल्बो एंगल तकनीक',
    content:
      'बेंच प्रेस करते समय कोहनियों को 90 डिग्री बाहर फैलाने के बजाय लगभग 45 डिग्री अंदर की ओर रखें और शोल्डर ब्लेड्स को बेंच में लॉक करें। इससे छाती पर लोड बढ़ता है और रोटेटर कफ सुरक्षित रहता है।',
    author: 'प्रिया राठौड़',
    authorRole: 'Strength Trainer',
    likes: 29,
    likedByMe: false,
    createdAt: '2026-11-18T06:45:00Z',
    replies: [
      {
        id: 'rep_2',
        author: 'अमित सैनी',
        role: 'Member',
        content:
          'आज यही तकनीक अपनाई और 80kg पर बिल्कुल कंधे में खिंचाव महसूस नहीं हुआ। शानदार टिप!',
        createdAt: '2026-11-18T11:20:00Z',
      },
    ],
  },
  {
    id: 'fp_3',
    category: 'प्रेरणा',
    postType: 'milestone',
    title: '16 सप्ताह की निरंतरता: पहली बार 100kg स्क्वाट और 9kg फैट लॉस!',
    content:
      'शुरुआत में 40kg से भी डर लगता था, लेकिन हर सत्र को प्रगति ट्रैकर में लॉग करने और आराम का समय मापने से बहुत बड़ा अंतर आया। सभी नए सदस्यों से यही कहूँगा—बस हर हफ्ते थोड़ा बेहतर बनें।',
    author: 'विक्रम सिंह',
    authorRole: 'Fitness Future Athlete',
    likes: 42,
    likedByMe: false,
    createdAt: '2026-11-18T17:10:00Z',
    replies: [
      {
        id: 'rep_3',
        author: 'नेहा शर्मा',
        role: 'Member',
        content: 'बहुत-बहुत बधाई विक्रम! आपकी निरंतरता हम सभी के लिए बड़ी प्रेरणा है।',
        createdAt: '2026-11-18T18:05:00Z',
      },
    ],
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore storage errors
  }
  return fallback;
}

function estimate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg);
  return Math.round(weightKg * (1 + reps / 30));
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const maxDim = 720;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const PersonalizedWorkoutSuite: React.FC<PersonalizedWorkoutSuiteProps> = ({
  defaultTab = 'planner',
  currentUser,
  onBackToWebsite,
  onOpenPortalLogin,
}) => {
  const { language, toggleLanguage } = useAutomationStore();
  const { members } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<FitnessSuiteTab>(defaultTab);
  const activeActorName = currentUser?.name || members[0]?.name || (language === 'hi' ? 'क्लब सदस्य' : 'Club Member');
  const activeActorId = String(currentUser?.uid || currentUser?.id || members[0]?.id || 'guest_athlete');

  // =========================================================================
  // FEATURE 1: PERSONALIZED WORKOUT PLANNER STATE
  // =========================================================================
  const [goal, setGoal] = useState<string>('Muscle Gain (Hypertrophy)');
  const [experience, setExperience] = useState<string>('Intermediate');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Dumbbells',
    'Barbell & Bench',
    'Cable Machine',
  ]);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [injuries, setInjuries] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<GeneratedWorkoutPlan>(() =>
    loadFromStorage<GeneratedWorkoutPlan>(PLAN_STORAGE_KEY, buildSamplePlan('hi'))
  );
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);

  // Keep sample plan aligned with language switch if user hasn't generated a custom plan yet
  useEffect(() => {
    if (activePlan?.isSample) {
      setActivePlan(buildSamplePlan(language));
    }
  }, [language]);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) => {
      if (item === 'Bodyweight Only') {
        return prev.includes(item) ? [] : ['Bodyweight Only'];
      }
      const withoutBw = prev.filter((x) => x !== 'Bodyweight Only');
      return withoutBw.includes(item)
        ? withoutBw.filter((x) => x !== item)
        : [...withoutBw, item];
    });
  };

  const handleLoadSamplePlan = () => {
    const sample = buildSamplePlan(language);
    setActivePlan(sample);
    setActiveDayIndex(0);
    setPlanError(null);
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(sample));
    addToast(
      bi(language, '4-Day Sample Workout Plan loaded.', '4-दिवसीय नमूना व्यायाम योजना लोड हो गई।'),
      'success'
    );
  };

  const handleGenerateAIPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);
    const equipToUse = selectedEquipment.length > 0 ? selectedEquipment : ['Bodyweight Only'];
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/ai/personalized-workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          experience,
          equipment: equipToUse,
          daysPerWeek,
          durationMinutes,
          injuries: injuries.trim() || 'None',
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.plan) {
        throw new Error(data.error || 'Could not generate personalized workout plan.');
      }

      const nextPlan: GeneratedWorkoutPlan = {
        ...data.plan,
        id: `PLAN_${Date.now()}`,
        isSample: false,
        createdAt: new Date().toISOString(),
      };
      setActivePlan(nextPlan);
      setActiveDayIndex(0);
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(nextPlan));
      await persistFirestoreDocument('ai_workout_plans', nextPlan.id, {
        ...nextPlan,
        member_id: activeActorId,
      } as Record<string, unknown>);
      addToast(
        bi(
          language,
          'Personalized Workout Plan generated & saved!',
          'आपकी व्यक्तिगत व्यायाम योजना तैयार और सुरक्षित हो गई!'
        ),
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Workout plan generation failed.';
      setPlanError(msg);
      addToast(msg, 'error');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSaveCurrentPlan = async () => {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(activePlan));
    await persistFirestoreDocument('ai_workout_plans', activePlan.id, {
      ...activePlan,
      member_id: activeActorId,
    } as Record<string, unknown>);
    addToast(
      bi(language, 'Workout plan saved to your profile.', 'व्यायाम योजना आपकी प्रोफ़ाइल में सहेजी गई।'),
      'success'
    );
  };

  // =========================================================================
  // FEATURE 2: WORKOUT PROGRESS TRACKING & VISUALIZATION STATE
  // =========================================================================
  const [workoutLogs, setWorkoutLogs] = useState<DetailedWorkoutLog[]>(() =>
    loadFromStorage<DetailedWorkoutLog[]>(LOGS_STORAGE_KEY, DEFAULT_WORKOUT_LOGS)
  );
  const [logExercise, setLogExercise] = useState<string>('Bench Press');
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [logWeight, setLogWeight] = useState<string>('80');
  const [logSets, setLogSets] = useState<string>('4');
  const [logReps, setLogReps] = useState<string>('8');
  const [logRestSeconds, setLogRestSeconds] = useState<string>('90');
  const [logRpe, setLogRpe] = useState<string>('8');
  const [logNotes, setLogNotes] = useState<string>('');
  const [logFormError, setLogFormError] = useState<string | null>(null);
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('ALL');

  // Interactive Rest Countdown Timer
  const [restPreset, setRestPreset] = useState<number>(90);
  const [restRemaining, setRestRemaining] = useState<number>(90);
  const [restRunning, setRestRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!restRunning) return;
    if (restRemaining <= 0) {
      setRestRunning(false);
      addToast(
        bi(language, 'Rest complete — time for your next set!', 'आराम पूरा हुआ — अगले सेट के लिए तैयार हों!'),
        'info'
      );
      return;
    }
    const timer = window.setInterval(() => {
      setRestRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRunning, restRemaining, addToast, language]);

  const startRestPreset = (seconds: number) => {
    setRestPreset(seconds);
    setRestRemaining(seconds);
    setLogRestSeconds(String(seconds));
    setRestRunning(true);
  };

  const handleLogFromPlan = (ex: PlannedExercise) => {
    setLogExercise(ex.name);
    setLogSets(String(ex.sets || 3));
    const parsedRep = parseInt(String(ex.reps).split('-')[0], 10);
    setLogReps(Number.isFinite(parsedRep) ? String(parsedRep) : '10');
    setLogRestSeconds(String(ex.restSeconds || 90));
    setRestPreset(ex.restSeconds || 90);
    setRestRemaining(ex.restSeconds || 90);
    setActiveTab('progress');
    addToast(
      bi(
        language,
        `Loaded "${ex.name}" into Progress Logger.`,
        `"${ex.name}" प्रगति ट्रैकर में भर दिया गया है।`
      ),
      'info'
    );
  };

  const handleAddWorkoutLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogFormError(null);

    const trimmedEx = logExercise.trim();
    const weightNum = Number(logWeight);
    const setsNum = Number(logSets);
    const repsNum = Number(logReps);
    const restNum = Number(logRestSeconds);
    const rpeNum = logRpe ? Number(logRpe) : undefined;

    if (trimmedEx.length < 2) {
      setLogFormError(bi(language, 'Enter a valid exercise name.', 'कृपया व्यायाम का सही नाम दर्ज करें।'));
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum < 0 || weightNum > 1000) {
      setLogFormError(bi(language, 'Weight must be between 0 and 1000 kg.', 'वजन 0 से 1000 किग्रा के बीच होना चाहिए।'));
      return;
    }
    if (!Number.isFinite(setsNum) || setsNum < 1 || setsNum > 50) {
      setLogFormError(bi(language, 'Sets must be between 1 and 50.', 'सेट की संख्या 1 से 50 के बीच होनी चाहिए।'));
      return;
    }
    if (!Number.isFinite(repsNum) || repsNum < 1 || repsNum > 300) {
      setLogFormError(bi(language, 'Reps must be between 1 and 300.', 'दोहराव (Reps) 1 से 300 के बीच होने चाहिए।'));
      return;
    }
    if (!Number.isFinite(restNum) || restNum < 0 || restNum > 900) {
      setLogFormError(bi(language, 'Rest time must be between 0 and 900 seconds.', 'आराम का समय 0 से 900 सेकंड के बीच होना चाहिए।'));
      return;
    }

    const entry: DetailedWorkoutLog = {
      id: `WLOG_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: logDate || new Date().toISOString().slice(0, 10),
      exercise: trimmedEx,
      weightKg: weightNum,
      sets: setsNum,
      reps: repsNum,
      restSeconds: restNum,
      rpe: rpeNum && Number.isFinite(rpeNum) ? Math.min(10, Math.max(1, rpeNum)) : undefined,
      notes: logNotes.trim() || undefined,
    };

    const updated = [entry, ...workoutLogs].sort((a, b) => b.date.localeCompare(a.date));
    setWorkoutLogs(updated);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
    setLogNotes('');

    await persistFirestoreDocument('workout_logs', entry.id, {
      ...entry,
      userId: activeActorId,
      memberId: activeActorId,
      volumeKg: entry.weightKg * entry.sets * entry.reps,
      estimated1RM: estimate1RM(entry.weightKg, entry.reps),
    } as Record<string, unknown>);

    addToast(
      bi(
        language,
        `Logged ${entry.exercise}: ${entry.sets}×${entry.reps} @ ${entry.weightKg}kg (${entry.restSeconds}s rest)`,
        `लॉग सेव हुआ: ${entry.exercise} · ${entry.sets}×${entry.reps} @ ${entry.weightKg}kg (${entry.restSeconds}s आराम)`
      ),
      'success'
    );
  };

  const handleDeleteLog = (id: string) => {
    const next = workoutLogs.filter((l) => l.id !== id);
    setWorkoutLogs(next);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(next));
    addToast(bi(language, 'Workout log removed.', 'वर्कआउट लॉग हटा दिया गया।'), 'info');
  };

  const uniqueExercises = useMemo(() => {
    const names = Array.from(new Set(workoutLogs.map((l) => l.exercise)));
    return names.sort();
  }, [workoutLogs]);

  const filteredLogs = useMemo(() => {
    const base =
      selectedExerciseFilter === 'ALL'
        ? workoutLogs
        : workoutLogs.filter((l) => l.exercise === selectedExerciseFilter);
    return [...base].sort((a, b) => a.date.localeCompare(b.date));
  }, [workoutLogs, selectedExerciseFilter]);

  const chartSeries = useMemo(() => {
    return filteredLogs.map((l) => ({
      date: l.date.slice(5), // MM-DD
      fullDate: l.date,
      exercise: l.exercise,
      weightKg: l.weightKg,
      estimated1RM: estimate1RM(l.weightKg, l.reps),
      volumeKg: Math.round(l.weightKg * l.sets * l.reps),
      restSeconds: l.restSeconds,
      setsReps: `${l.sets}×${l.reps}`,
    }));
  }, [filteredLogs]);

  const progressKpis = useMemo(() => {
    const totalVolume = filteredLogs.reduce(
      (sum, l) => sum + l.weightKg * l.sets * l.reps,
      0
    );
    const best1RM = filteredLogs.reduce(
      (max, l) => Math.max(max, estimate1RM(l.weightKg, l.reps)),
      0
    );
    const avgRest =
      filteredLogs.length > 0
        ? Math.round(
            filteredLogs.reduce((sum, l) => sum + l.restSeconds, 0) / filteredLogs.length
          )
        : 0;
    const maxWeight = filteredLogs.reduce((max, l) => Math.max(max, l.weightKg), 0);
    return {
      sessions: filteredLogs.length,
      totalVolume: Math.round(totalVolume),
      best1RM,
      avgRest,
      maxWeight,
    };
  }, [filteredLogs]);

  const handleExportLogsCsv = () => {
    const rows = [
      ['Date', 'Exercise', 'Weight (kg)', 'Sets', 'Reps', 'Rest (sec)', 'Volume (kg)', 'Est 1RM (kg)', 'Notes'],
      ...workoutLogs.map((l) => [
        l.date,
        l.exercise,
        String(l.weightKg),
        String(l.sets),
        String(l.reps),
        String(l.restSeconds),
        String(Math.round(l.weightKg * l.sets * l.reps)),
        String(estimate1RM(l.weightKg, l.reps)),
        l.notes || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // FEATURE 3: COMMUNITY FORUM STATE ('पोषण', 'कसरत युक्तियाँ', 'प्रेरणा')
  // =========================================================================
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() =>
    loadFromStorage<ForumPost[]>(FORUM_STORAGE_KEY, DEFAULT_FORUM_POSTS)
  );
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ForumCategory>('ALL');
  const [forumSearch, setForumSearch] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<ForumCategory>('पोषण');
  const [newPostType, setNewPostType] = useState<'question' | 'tip' | 'milestone'>('question');
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostPhoto, setNewPostPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState<boolean>(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openRepliesId, setOpenRepliesId] = useState<string | null>('fp_1');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPostError(bi(language, 'Please upload a valid image file (JPG/PNG/WebP).', 'कृपया एक मान्य फ़ोटो फ़ाइल (JPG/PNG) चुनें।'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPostError(bi(language, 'Image size must be under 10 MB.', 'फ़ोटो का आकार 10 MB से कम होना चाहिए।'));
      return;
    }
    setPostError(null);
    setPhotoBusy(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      setNewPostPhoto(compressed);
    } catch (err: any) {
      setPostError(err?.message || 'Failed to process photo');
    } finally {
      setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateForumPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    const title = newPostTitle.trim();
    const content = newPostContent.trim();
    if (title.length < 4) {
      setPostError(bi(language, 'Please enter a clear title (at least 4 characters).', 'कृपया कम से कम 4 अक्षरों का स्पष्ट शीर्षक लिखें।'));
      return;
    }
    if (content.length < 8) {
      setPostError(bi(language, 'Please add details for your question or post.', 'कृपया अपने प्रश्न या पोस्ट का विवरण लिखें।'));
      return;
    }

    const post: ForumPost = {
      id: `POST_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: newPostCategory,
      postType: newPostType,
      title,
      content,
      author: activeActorName,
      authorRole: currentUser?.type === 'admin' || currentUser?.type === 'super_admin' ? 'Club Coach / Admin' : 'Club Member',
      photoDataUrl: newPostPhoto || undefined,
      likes: 1,
      likedByMe: true,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const next = [post, ...forumPosts];
    setForumPosts(next);
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(next));
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostPhoto(null);
    setOpenRepliesId(post.id);

    await persistFirestoreDocument('community_posts', post.id, {
      ...post,
      authorId: activeActorId,
    } as Record<string, unknown>);

    addToast(
      bi(language, 'Published to Community Forum!', 'सामुदायिक मंच पर पोस्ट प्रकाशित हो गई!'),
      'success'
    );
  };

  const handleToggleLike = async (postId: string) => {
    const next = forumPosts.map((p) => {
      if (p.id !== postId) return p;
      const liked = !p.likedByMe;
      return {
        ...p,
        likedByMe: liked,
        likes: Math.max(0, p.likes + (liked ? 1 : -1)),
      };
    });
    setForumPosts(next);
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(next));
    const target = next.find((p) => p.id === postId);
    if (target) {
      await persistFirestoreDocument('community_posts', target.id, {
        ...target,
        authorId: activeActorId,
      } as Record<string, unknown>);
    }
  };

  const handleSubmitReply = async (postId: string) => {
    const text = (replyDrafts[postId] || '').trim();
    if (text.length < 2) return;

    const reply: ForumReply = {
      id: `REP_${Date.now()}`,
      author: activeActorName,
      role: currentUser?.type === 'admin' || currentUser?.type === 'super_admin' ? 'Coach' : 'Member',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const next = forumPosts.map((p) =>
      p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
    );
    setForumPosts(next);
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(next));
    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));

    const target = next.find((p) => p.id === postId);
    if (target) {
      await persistFirestoreDocument('community_posts', target.id, {
        ...target,
        authorId: activeActorId,
      } as Record<string, unknown>);
    }
    addToast(bi(language, 'Reply posted.', 'आपका उत्तर प्रकाशित हो गया।'), 'success');
  };

  const filteredForumPosts = useMemo(() => {
    const q = forumSearch.trim().toLowerCase();
    return forumPosts.filter((p) => {
      const catOk = selectedCategory === 'ALL' || p.category === selectedCategory;
      const searchOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [forumPosts, selectedCategory, forumSearch]);

  const categoryCounts = useMemo(
    () => ({
      ALL: forumPosts.length,
      पोषण: forumPosts.filter((p) => p.category === 'पोषण').length,
      'कसरत युक्तियाँ': forumPosts.filter((p) => p.category === 'कसरत युक्तियाँ').length,
      प्रेरणा: forumPosts.filter((p) => p.category === 'प्रेरणा').length,
    }),
    [forumPosts]
  );

  const selectedDay = activePlan.weeklySchedule[activeDayIndex] || activePlan.weeklySchedule[0];

  return (
    <div
      className="min-h-full w-full bg-[#09090B] text-[#F8FAFC] pb-20"
      style={{
        fontFamily:
          "'Plus Jakarta Sans', 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* STANDALONE TOP NAVIGATION WHEN LAUNCHED FROM PUBLIC WEBSITE */}
        {(onBackToWebsite || onOpenPortalLogin) && (
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              {onBackToWebsite && (
                <button
                  type="button"
                  onClick={onBackToWebsite}
                  className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                  <span>{bi(language, 'Back to Website', 'वेबसाइट पर लौटें')}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 border border-white/[0.12] rounded-md hover:border-amber-400/60 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
              </button>
              {onOpenPortalLogin && (
                <button
                  type="button"
                  onClick={onOpenPortalLogin}
                  className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs whitespace-nowrap cursor-pointer"
                >
                  {bi(language, 'Portal Login', 'पोर्टल लॉगिन')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* HEADER + 3-PILLAR TAB BAR */}
        <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-mono text-amber-400">
              {bi(
                language,
                'Fitness Future · Personalized Training, Analytics & Community',
                'फिटनेस फ्यूचर · व्यक्तिगत व्यायाम, प्रगति ट्रैकिंग व सामुदायिक मंच'
              )}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1"
              style={{
                fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif",
                textWrap: 'balance',
              }}
            >
              {bi(
                language,
                'Workout Planner, Progress Analytics & Member Forum',
                'व्यक्तिगत व्यायाम योजना, प्रगति ट्रैकर और सामुदायिक मंच'
              )}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                {
                  id: 'planner' as const,
                  icon: Dumbbell,
                  en: 'Workout Planner',
                  hi: 'व्यायाम योजना',
                },
                {
                  id: 'progress' as const,
                  icon: TrendingUp,
                  en: 'Progress Tracker',
                  hi: 'प्रगति ट्रैकर',
                },
                {
                  id: 'community' as const,
                  icon: MessageSquare,
                  en: 'Community Forum',
                  hi: 'सामुदायिक मंच',
                },
              ]
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-[#09090B] text-slate-300 border border-white/[0.1] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{bi(language, tab.en, tab.hi)}</span>
                </button>
              );
            })}
            {!onBackToWebsite && (
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md bg-[#09090B] border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer whitespace-nowrap"
              >
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? 'EN' : 'हिंदी'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: PERSONALIZED WORKOUT PLANNER + SAMPLE PLAN                     */}
        {/* ===================================================================== */}
        {activeTab === 'planner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: PARAMETERS FORM */}
            <form
              onSubmit={handleGenerateAIPlan}
              className="lg:col-span-4 bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-white">
                  {bi(language, 'Personalize Your Plan', 'अपनी व्यायाम योजना बनाएँ')}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {bi(
                    language,
                    'Select your fitness goal, experience level, and available equipment.',
                    'अपने फिटनेस लक्ष्य, अनुभव स्तर और उपलब्ध उपकरण चुनें।'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {bi(language, 'Fitness Goal', 'फिटनेस लक्ष्य')}
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {bi(language, g.en, g.hi)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {bi(language, 'Experience Level', 'अनुभव स्तर')}
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {bi(language, exp.en, exp.hi)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  {bi(language, 'Available Equipment', 'उपलब्ध उपकरण')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const active = selectedEquipment.includes(eq.id);
                    return (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => toggleEquipment(eq.id)}
                        className={`px-3 py-2 rounded-md text-xs font-medium text-left transition-colors cursor-pointer border ${
                          active
                            ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                            : 'bg-[#09090B] border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        {bi(language, eq.en, eq.hi)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {bi(language, 'Days / Week', 'दिन / सप्ताह')}
                  </label>
                  <select
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                    className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono"
                  >
                    {[2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>
                        {d} {bi(language, 'Days', 'दिन')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {bi(language, 'Duration (min)', 'अवधि (मिनट)')}
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono"
                  >
                    {[30, 45, 60, 75, 90].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {bi(language, 'Injuries or Notes (Optional)', 'चोट या विशेष नोट्स (वैकल्पिक)')}
                </label>
                <input
                  type="text"
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder={bi(language, 'e.g. Knee discomfort, lower back sensitivity', 'जैसे: घुटने या कमर में हल्का दर्द')}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {planError && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{planError}</span>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isGeneratingPlan}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-bold text-sm transition-colors cursor-pointer"
                >
                  {isGeneratingPlan ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {isGeneratingPlan
                      ? bi(language, 'Generating Custom Plan...', 'योजना तैयार हो रही है...')
                      : bi(language, 'Generate Custom Workout Plan', 'व्यक्तिगत व्यायाम योजना बनाएँ')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSamplePlan}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#09090B] hover:bg-white/[0.06] border border-white/[0.12] text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>{bi(language, 'Load 4-Day Sample Plan', '4-दिवसीय नमूना योजना देखें')}</span>
                </button>
              </div>
            </form>

            {/* RIGHT: ACTIVE / SAMPLE PLAN DISPLAY */}
            <div className="lg:col-span-8 bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="text-amber-400 font-semibold">
                      {activePlan.isSample
                        ? bi(language, 'Sample Plan', 'नमूना योजना')
                        : bi(language, 'Custom Plan', 'व्यक्तिगत योजना')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activePlan.goal}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activePlan.experience}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{activePlan.daysPerWeek}d / {activePlan.durationMinutes}m</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{activePlan.planTitle}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{activePlan.summary}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleSaveCurrentPlan()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#09090B] hover:bg-white/[0.06] border border-white/[0.12] text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>{bi(language, 'Save', 'सेव')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#09090B] hover:bg-white/[0.06] border border-white/[0.12] text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>{bi(language, 'Print', 'प्रिंट')}</span>
                  </button>
                </div>
              </div>

              {/* DAY SELECTOR TABS */}
              <div className="flex flex-wrap gap-2">
                {activePlan.weeklySchedule.map((dayItem, idx) => (
                  <button
                    key={dayItem.day + idx}
                    type="button"
                    onClick={() => setActiveDayIndex(idx)}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeDayIndex === idx
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-[#09090B] text-slate-300 border border-white/[0.08] hover:text-white'
                    }`}
                  >
                    {dayItem.day}
                  </button>
                ))}
              </div>

              {/* SELECTED DAY EXERCISES TABLE */}
              {selectedDay && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedDay.focus}</h3>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {selectedDay.exercises.length} {bi(language, 'Exercises', 'व्यायाम')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-[#09090B] border border-white/[0.06] rounded-lg px-4 py-3">
                    <span className="font-semibold text-amber-400">
                      {bi(language, 'Warm-up: ', 'वार्म-अप: ')}
                    </span>
                    {selectedDay.warmup}
                  </p>

                  <div className="overflow-x-auto border border-white/[0.08] rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#09090B] border-b border-white/[0.08] text-xs font-mono text-slate-400">
                        <tr>
                          <th className="py-3 px-4">{bi(language, 'Exercise', 'व्यायाम')}</th>
                          <th className="py-3 px-3 text-right">{bi(language, 'Sets', 'सेट')}</th>
                          <th className="py-3 px-3 text-right">{bi(language, 'Reps', 'रेप्स')}</th>
                          <th className="py-3 px-3 text-right">{bi(language, 'Rest', 'आराम')}</th>
                          <th className="py-3 px-4 text-right">{bi(language, 'Action', 'एक्शन')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {selectedDay.exercises.map((ex, i) => (
                          <tr key={`${ex.name}_${i}`} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-white">{ex.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {ex.targetMuscle} · {ex.equipment}
                              </p>
                              <p className="text-xs text-slate-300 mt-1">{ex.coachNote}</p>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono tabular-nums text-white font-semibold">
                              {ex.sets}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-200">
                              {ex.reps}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono tabular-nums text-amber-400">
                              {ex.restSeconds}s
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleLogFromPlan(ex)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white/[0.06] hover:bg-amber-500 hover:text-zinc-950 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{bi(language, 'Log', 'लॉग करें')}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-slate-300 bg-[#09090B] border border-white/[0.06] rounded-lg px-4 py-3">
                    <span className="font-semibold text-emerald-400">
                      {bi(language, 'Cool-down: ', 'कूल-डाउन: ')}
                    </span>
                    {selectedDay.cooldown}
                  </p>
                </div>
              )}

              {/* PROGRESSION RULES */}
              {Array.isArray(activePlan.progressionRules) && activePlan.progressionRules.length > 0 && (
                <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400">
                    {bi(language, 'Progressive Overload & Recovery Rules', 'प्रोग्रेसिव ओवरलोड और रिकवरी नियम')}
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activePlan.progressionRules.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: WORKOUT PROGRESS TRACKING + REST TIMER + CHARTS                */}
        {/* ===================================================================== */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* KPI STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: bi(language, 'Logged Workouts', 'कुल लॉग सत्र'), val: String(progressKpis.sessions), cls: 'text-white' },
                { label: bi(language, 'Total Volume Lifted', 'कुल उठाया गया वॉल्यूम'), val: `${progressKpis.totalVolume.toLocaleString('en-IN')} kg`, cls: 'text-amber-400' },
                { label: bi(language, 'Max Weight Lifted', 'अधिकतम वजन'), val: `${progressKpis.maxWeight} kg`, cls: 'text-white' },
                { label: bi(language, 'Best Est. 1RM', 'अनुमानित 1RM रिकॉर्ड'), val: `${progressKpis.best1RM} kg`, cls: 'text-emerald-400' },
                { label: bi(language, 'Avg Rest Time', 'औसत आराम समय'), val: `${progressKpis.avgRest}s`, cls: 'text-slate-200' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-[#111114] border border-white/[0.08] rounded-xl p-4">
                  <p className="text-xs text-slate-400">{kpi.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1 ${kpi.cls}`}>
                    {kpi.val}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: WORKOUT LOGGER FORM + LIVE REST TIMER */}
              <div className="lg:col-span-4 space-y-6">
                <form
                  onSubmit={handleAddWorkoutLog}
                  className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4"
                >
                  <h2 className="text-lg font-bold text-white">
                    {bi(language, 'Log Workout Set', 'नया वर्कआउट लॉग करें')}
                  </h2>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {bi(language, 'Exercise Name', 'व्यायाम का नाम')}
                    </label>
                    <input
                      type="text"
                      list="exercise-preset-list"
                      required
                      value={logExercise}
                      onChange={(e) => setLogExercise(e.target.value)}
                      placeholder="e.g. Bench Press"
                      className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                    <datalist id="exercise-preset-list">
                      {EXERCISE_PRESETS.map((ex) => (
                        <option key={ex} value={ex} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {bi(language, 'Date', 'दिनांक')}
                      </label>
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {bi(language, 'Weight (kg)', 'वजन (kg)')}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        max={1000}
                        required
                        value={logWeight}
                        onChange={(e) => setLogWeight(e.target.value)}
                        className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {bi(language, 'Sets', 'सेट')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={logSets}
                        onChange={(e) => setLogSets(e.target.value)}
                        className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {bi(language, 'Reps', 'दोहराव')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        required
                        value={logReps}
                        onChange={(e) => setLogReps(e.target.value)}
                        className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {bi(language, 'Rest (sec)', 'आराम (से.)')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={900}
                        required
                        value={logRestSeconds}
                        onChange={(e) => setLogRestSeconds(e.target.value)}
                        className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        RPE (1–10)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min={1}
                        max={10}
                        value={logRpe}
                        onChange={(e) => setLogRpe(e.target.value)}
                        className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white font-mono tabular-nums"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {bi(language, 'Session Notes', 'नोट्स (वैकल्पिक)')}
                      </label>
                      <input
                        type="text"
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        placeholder={bi(language, 'Tempo, grip, or PR note', 'टेम्पो या अनुभव नोट')}
                        className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {logFormError && (
                    <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{logFormError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{bi(language, 'Save Workout Log', 'वर्कआउट लॉग सेव करें')}</span>
                  </button>
                </form>

                {/* LIVE REST TIMER */}
                <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Timer className="w-4 h-4 text-amber-400" />
                      <span>{bi(language, 'Live Rest Timer', 'लाइव आराम टाइमर')}</span>
                    </h3>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      Target: {restPreset}s
                    </span>
                  </div>

                  <div className="text-center py-4 bg-[#09090B] border border-white/[0.08] rounded-lg">
                    <p className="text-4xl font-bold font-mono tabular-nums text-amber-400">
                      {Math.floor(restRemaining / 60)}:
                      {String(restRemaining % 60).padStart(2, '0')}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[60, 90, 120, 180].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => startRestPreset(sec)}
                        className={`py-2 rounded-md text-xs font-mono font-semibold cursor-pointer border ${
                          restPreset === sec
                            ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                            : 'bg-[#09090B] border-white/[0.08] text-slate-300 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRestRunning((r) => !r)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white cursor-pointer"
                    >
                      {restRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{restRunning ? bi(language, 'Pause', 'रोकें') : bi(language, 'Start', 'शुरू करें')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRestRunning(false);
                        setRestRemaining(restPreset);
                      }}
                      className="px-4 py-2.5 rounded-md bg-[#09090B] border border-white/[0.1] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: PERFORMANCE VISUALIZATIONS + HISTORY LEDGER */}
              <div className="lg:col-span-8 space-y-6">
                {/* FILTER & EXPORT BAR */}
                <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-mono text-slate-400 whitespace-nowrap">
                      {bi(language, 'Filter Exercise:', 'व्यायाम फ़िल्टर:')}
                    </label>
                    <select
                      value={selectedExerciseFilter}
                      onChange={(e) => setSelectedExerciseFilter(e.target.value)}
                      className="rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2 text-xs text-white"
                    >
                      <option value="ALL">
                        {bi(language, 'All Exercises', 'सभी व्यायाम')} ({workoutLogs.length})
                      </option>
                      {uniqueExercises.map((ex) => (
                        <option key={ex} value={ex}>
                          {ex}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportLogsCsv}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#09090B] hover:bg-white/[0.06] border border-white/[0.12] text-xs font-semibold text-slate-200 cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>{bi(language, 'Export CSV', 'CSV डाउनलोड')}</span>
                  </button>
                </div>

                {/* CHART 1: STRENGTH & ESTIMATED 1RM OVER TIME */}
                <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {bi(
                        language,
                        'Strength Progression Over Time (Weight Lifted & Est. 1RM)',
                        'समय के साथ शक्ति प्रगति (उठाया गया वजन और अनुमानित 1RM)'
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {bi(
                        language,
                        'Tracks working weight (kg) and calculated 1-Rep Max across logged dates.',
                        'प्रत्येक सत्र में उठाए गए वजन (kg) और 1RM की तुलना।'
                      )}
                    </p>
                  </div>

                  {chartSeries.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-slate-400 border border-white/[0.06] rounded-lg bg-[#09090B]">
                      {bi(language, 'Log your first workout to visualize performance.', 'चार्ट देखने के लिए अपना पहला वर्कआउट लॉग करें।')}
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="amberWeightFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="emerald1RmFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                          <YAxis stroke="#94A3B8" fontSize={12} unit="kg" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#09090B',
                              border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#F8FAFC',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Area
                            type="monotone"
                            dataKey="estimated1RM"
                            name={bi(language, 'Est. 1RM (kg)', 'अनुमानित 1RM (kg)')}
                            stroke="#10B981"
                            strokeWidth={2}
                            fill="url(#emerald1RmFill)"
                          />
                          <Area
                            type="monotone"
                            dataKey="weightKg"
                            name={bi(language, 'Weight Lifted (kg)', 'उठाया गया वजन (kg)')}
                            stroke="#F59E0B"
                            strokeWidth={2.5}
                            fill="url(#amberWeightFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* CHART 2: TOTAL VOLUME VS REST TIME */}
                <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {bi(
                        language,
                        'Training Volume (kg) & Rest Time (sec) Correlation',
                        'कुल वर्कआउट वॉल्यूम (kg) बनाम आराम समय (सेकंड)'
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {bi(
                        language,
                        'Volume = Weight × Sets × Reps plotted alongside rest recovery duration.',
                        'वॉल्यूम (वजन × सेट × रेप्स) और प्रति सेट आराम समय का विश्लेषण।'
                      )}
                    </p>
                  </div>

                  {chartSeries.length > 0 && (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                          <YAxis yAxisId="left" stroke="#94A3B8" fontSize={12} />
                          <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={12} unit="s" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#09090B',
                              border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#F8FAFC',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar
                            yAxisId="left"
                            dataKey="volumeKg"
                            name={bi(language, 'Total Volume (kg)', 'कुल वॉल्यूम (kg)')}
                            fill="#334155"
                            radius={[4, 4, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="restSeconds"
                            name={bi(language, 'Rest Time (sec)', 'आराम समय (सेकंड)')}
                            stroke="#F59E0B"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#F59E0B' }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* FULL WORKOUT HISTORY TABLE */}
                <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white">
                    {bi(language, 'Workout Log History', 'वर्कआउट लॉग इतिहास')}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-white/[0.08] text-xs font-mono text-slate-400">
                        <tr>
                          <th className="py-2.5 pr-3">{bi(language, 'Date', 'दिनांक')}</th>
                          <th className="py-2.5 px-3">{bi(language, 'Exercise', 'व्यायाम')}</th>
                          <th className="py-2.5 px-3 text-right">{bi(language, 'Weight', 'वजन')}</th>
                          <th className="py-2.5 px-3 text-right">{bi(language, 'Sets × Reps', 'सेट × रेप्स')}</th>
                          <th className="py-2.5 px-3 text-right">{bi(language, 'Rest', 'आराम')}</th>
                          <th className="py-2.5 px-3 text-right">{bi(language, 'Volume', 'वॉल्यूम')}</th>
                          <th className="py-2.5 pl-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] font-mono text-xs">
                        {[...filteredLogs].reverse().map((l) => (
                          <tr key={l.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 pr-3 text-slate-400 tabular-nums whitespace-nowrap">{l.date}</td>
                            <td className="py-3 px-3 font-sans font-semibold text-white">
                              {l.exercise}
                              {l.notes && (
                                <span className="block text-[11px] font-normal text-slate-400">
                                  {l.notes}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right text-amber-400 font-bold tabular-nums">
                              {l.weightKg} kg
                            </td>
                            <td className="py-3 px-3 text-right text-slate-200 tabular-nums">
                              {l.sets} × {l.reps}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                              {l.restSeconds}s
                            </td>
                            <td className="py-3 px-3 text-right text-emerald-400 tabular-nums">
                              {Math.round(l.weightKg * l.sets * l.reps).toLocaleString('en-IN')} kg
                            </td>
                            <td className="py-3 pl-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(l.id)}
                                aria-label="Delete log"
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: COMMUNITY FORUM ('पोषण', 'कसरत युक्तियाँ', 'प्रेरणा')              */}
        {/* ===================================================================== */}
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: CREATE POST / ASK QUESTION / SHARE PHOTO */}
            <form
              onSubmit={handleCreateForumPost}
              className="lg:col-span-4 bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-white">
                  {bi(language, 'Post to Community Forum', 'सामुदायिक मंच पर पोस्ट करें')}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {bi(
                    language,
                    'Ask a question, share a workout photo, or inspire fellow members.',
                    'प्रश्न पूछें, कसरत या भोजन की फ़ोटो साझा करें और अन्य सदस्यों को प्रेरित करें।'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {bi(language, 'Category', 'श्रेणी')}
                  </label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value as ForumCategory)}
                    className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-xs text-white"
                  >
                    <option value="पोषण">पोषण (Nutrition)</option>
                    <option value="कसरत युक्तियाँ">कसरत युक्तियाँ (Workout Tips)</option>
                    <option value="प्रेरणा">प्रेरणा (Motivation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {bi(language, 'Post Type', 'पोस्ट प्रकार')}
                  </label>
                  <select
                    value={newPostType}
                    onChange={(e) => setNewPostType(e.target.value as 'question' | 'tip' | 'milestone')}
                    className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3 py-2.5 text-xs text-white"
                  >
                    <option value="question">{bi(language, 'Question', 'प्रश्न पूछें')}</option>
                    <option value="tip">{bi(language, 'Tip / Advice', 'युक्ति साझा करें')}</option>
                    <option value="milestone">{bi(language, 'Milestone / Story', 'प्रगति / प्रेरणा')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {bi(language, 'Title', 'शीर्षक')}
                </label>
                <input
                  type="text"
                  required
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder={bi(language, 'e.g. Best pre-workout meal for morning lifters?', 'जैसे: सुबह के वर्कआउट से पहले क्या खाएँ?')}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {bi(language, 'Details', 'विवरण')}
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={bi(
                    language,
                    'Share context, routine details, or encouragement...',
                    'अपना प्रश्न, अनुभव या सुझाव विस्तार से लिखें...'
                  )}
                  className="w-full rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* PHOTO UPLOAD */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoBusy}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-[#09090B] hover:bg-white/[0.06] border border-white/[0.12] text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  {photoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-amber-400" />}
                  <span>{bi(language, 'Attach Photo (Meal / Progress)', 'फ़ोटो जोड़ें (मील / प्रगति)')}</span>
                </button>

                {newPostPhoto && (
                  <div className="relative rounded-lg overflow-hidden border border-white/[0.12]">
                    <img
                      src={newPostPhoto}
                      alt="Uploaded preview"
                      referrerPolicy="no-referrer"
                      className="w-full max-h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPostPhoto(null)}
                      aria-label="Remove photo"
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/75 text-white hover:bg-red-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {postError && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{postError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{bi(language, 'Publish Post', 'पोस्ट प्रकाशित करें')}</span>
              </button>
            </form>

            {/* RIGHT: CATEGORY FILTERS & DISCUSSION THREADS */}
            <div className="lg:col-span-8 space-y-5">
              {/* CATEGORY TABS + SEARCH */}
              <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'ALL' as const, label: bi(language, 'All Topics', 'सभी श्रेणियाँ'), count: categoryCounts.ALL },
                        { id: 'पोषण' as const, label: 'पोषण · Nutrition', count: categoryCounts['पोषण'] },
                        { id: 'कसरत युक्तियाँ' as const, label: 'कसरत युक्तियाँ · Tips', count: categoryCounts['कसरत युक्तियाँ'] },
                        { id: 'प्रेरणा' as const, label: 'प्रेरणा · Motivation', count: categoryCounts['प्रेरणा'] },
                      ]
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-amber-500 text-zinc-950 font-bold'
                            : 'bg-[#09090B] text-slate-300 border border-white/[0.08] hover:text-white'
                        }`}
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={forumSearch}
                      onChange={(e) => setForumSearch(e.target.value)}
                      placeholder={bi(language, 'Search discussions...', 'चर्चा खोजें...')}
                      className="w-full rounded-md bg-[#09090B] border border-white/[0.12] pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* FEED LIST */}
              {filteredForumPosts.length === 0 ? (
                <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-10 text-center text-sm text-slate-400">
                  {bi(
                    language,
                    'No posts match this category yet. Start the conversation on the left!',
                    'इस श्रेणी में अभी कोई पोस्ट नहीं है। बाईं ओर से पहला प्रश्न या अनुभव साझा करें!'
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredForumPosts.map((post) => {
                    const isRepliesOpen = openRepliesId === post.id;
                    return (
                      <article
                        key={post.id}
                        className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4"
                      >
                        {/* UNBOXED CLEAN METADATA */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-amber-400">{post.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-slate-200">{post.author}</span>
                            <span aria-hidden="true">·</span>
                            <span>{post.authorRole}</span>
                          </div>
                          <span className="font-mono tabular-nums text-[11px]">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-white">{post.title}</h3>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {post.content}
                          </p>
                        </div>

                        {post.photoDataUrl && (
                          <div className="rounded-lg overflow-hidden border border-white/[0.08] bg-[#09090B]">
                            <img
                              src={post.photoDataUrl}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className="w-full max-h-80 object-cover"
                            />
                          </div>
                        )}

                        {/* ACTIONS BAR */}
                        <div className="flex items-center gap-4 pt-3 border-t border-white/[0.08]">
                          <button
                            type="button"
                            onClick={() => void handleToggleLike(post.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              post.likedByMe
                                ? 'text-amber-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-amber-400' : ''}`} />
                            <span className="font-mono tabular-nums">{post.likes}</span>
                            <span>{bi(language, 'Motivate', 'प्रेरित करें')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOpenRepliesId(isRepliesOpen ? null : post.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-mono tabular-nums">{post.replies.length}</span>
                            <span>{bi(language, 'Answers / Replies', 'उत्तर / टिप्पणियाँ')}</span>
                          </button>
                        </div>

                        {/* THREADED REPLIES */}
                        {isRepliesOpen && (
                          <div className="pt-3 border-t border-white/[0.06] space-y-3">
                            {post.replies.map((rep) => (
                              <div
                                key={rep.id}
                                className="rounded-lg bg-[#09090B] border border-white/[0.06] p-3.5 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span>
                                    <strong className="text-slate-200">{rep.author}</strong> · {rep.role}
                                  </span>
                                  <span className="font-mono tabular-nums">
                                    {new Date(rep.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">{rep.content}</p>
                              </div>
                            ))}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={replyDrafts[post.id] || ''}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void handleSubmitReply(post.id);
                                  }
                                }}
                                placeholder={bi(
                                  language,
                                  'Write a helpful answer or encouraging reply...',
                                  'अपना उत्तर या प्रेरणादायक संदेश लिखें...'
                                )}
                                className="flex-1 rounded-md bg-[#09090B] border border-white/[0.12] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => void handleSubmitReply(post.id)}
                                className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer whitespace-nowrap"
                              >
                                {bi(language, 'Reply', 'उत्तर दें')}
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedWorkoutSuite;
