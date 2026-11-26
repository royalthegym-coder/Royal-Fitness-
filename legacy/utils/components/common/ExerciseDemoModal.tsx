
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { SparkleIcon } from '../icons/SparkleIcon';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { generateTextToSpeech } from '../../../lib/core_ai';
import { decode, decodeAudioData } from '../../audio';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BotIcon } from '../icons/BotIcon';
import { AlertTriangle, WifiOff, Youtube, Lock } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export interface ExerciseData {
    id: string;
    name: string;
    category: string;
    youtubeId: string; // Changed back to YouTube ID for reliability
    thumbnailUrl: string;
    setup: string[];
    execution: string[];
    mistakes: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
    muscles: string[];
}

// --- YOUTUBE-BASED EXERCISE DATABASE (VERIFIED HIGH-QUALITY IDs) ---
export const EXERCISE_DB: Record<string, ExerciseData> = {
    'dynamic arm circles': { id: 'w1', name: 'Dynamic Arm Circles', category: 'Warmup', youtubeId: '140RTMSahQI', thumbnailUrl: 'https://img.youtube.com/vi/140RTMSahQI/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['shoulders','arms'] },
    'forward leg swings': { id: 'w2', name: 'Forward Leg Swings', category: 'Warmup', youtubeId: 'F12Y7Y3aGq0', thumbnailUrl: 'https://img.youtube.com/vi/F12Y7Y3aGq0/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['legs','core'] },
    'jumping jacks': { id: 'w3', name: 'Jumping Jacks', category: 'Warmup', youtubeId: 'iSSAk4XCsRA', thumbnailUrl: 'https://img.youtube.com/vi/iSSAk4XCsRA/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['legs','arms','core'] },
    'cat cow stretch': { id: 'w4', name: 'Cat Cow Stretch', category: 'Warmup', youtubeId: 'kqnua4rHVVA', thumbnailUrl: 'https://img.youtube.com/vi/kqnua4rHVVA/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['back','core'] },
    'world greatest stretch': { id: 'w5', name: 'World Greatest Stretch', category: 'Warmup', youtubeId: '-C5_8b05e50', thumbnailUrl: 'https://img.youtube.com/vi/-C5_8b05e50/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['legs','core','back'] },
    'high knees': { id: 'w6', name: 'High Knees', category: 'Warmup', youtubeId: 'ZZhBJCgXNqg', thumbnailUrl: 'https://img.youtube.com/vi/ZZhBJCgXNqg/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['legs','core','cardio'] },
    'mountain climbers': { id: 'w7', name: 'Mountain Climbers', category: 'Warmup', youtubeId: 'nmwgirgXLYM', thumbnailUrl: 'https://img.youtube.com/vi/nmwgirgXLYM/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['core','shoulders','cardio'] },
    'arm circles': { id: 'w8', name: 'Arm Circles', category: 'Warmup', youtubeId: '140RTMSahQI', thumbnailUrl: 'https://img.youtube.com/vi/140RTMSahQI/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['shoulders','arms'] },
    'cat cow': { id: 'w9', name: 'Cat Cow', category: 'Warmup', youtubeId: 'kqnua4rHVVA', thumbnailUrl: 'https://img.youtube.com/vi/kqnua4rHVVA/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['back','core'] },
    'leg swings': { id: 'w10', name: 'Leg Swings', category: 'Warmup', youtubeId: 'F12Y7Y3aGq0', thumbnailUrl: 'https://img.youtube.com/vi/F12Y7Y3aGq0/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['legs','core'] },
    'barbell bench press': { id: 'c1', name: 'Barbell Bench Press', category: 'Chest', youtubeId: 'rT7DgCr-3pg', thumbnailUrl: 'https://img.youtube.com/vi/rT7DgCr-3pg/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest','arms','shoulders'] },
    'incline dumbbell press': { id: 'c2', name: 'Incline Dumbbell Press', category: 'Chest', youtubeId: '8iPEnn-ltbc', thumbnailUrl: 'https://img.youtube.com/vi/8iPEnn-ltbc/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest','shoulders','arms'] },
    'cable chest fly': { id: 'c3', name: 'Cable Chest Fly', category: 'Chest', youtubeId: 'Iwe6AmxVf7o', thumbnailUrl: 'https://img.youtube.com/vi/Iwe6AmxVf7o/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest'] },
    'push up': { id: 'c4', name: 'Push Up', category: 'Chest', youtubeId: 'IODxDxX7oi4', thumbnailUrl: 'https://img.youtube.com/vi/IODxDxX7oi4/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['chest','arms','core'] },
    'decline bench press': { id: 'c5', name: 'Decline Bench Press', category: 'Chest', youtubeId: 'LfyQBUKR8SE', thumbnailUrl: 'https://img.youtube.com/vi/LfyQBUKR8SE/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest','triceps','shoulders'] },
    'dumbbell pullover': { id: 'c6', name: 'Dumbbell Pullover', category: 'Chest', youtubeId: 'jDwoBqC0yFU', thumbnailUrl: 'https://img.youtube.com/vi/jDwoBqC0yFU/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest','lats'] },
    'dumbbell chest fly': { id: 'c7', name: 'Dumbbell Chest Fly', category: 'Chest', youtubeId: 'eozdVDA78K0', thumbnailUrl: 'https://img.youtube.com/vi/eozdVDA78K0/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest'] },
    'pec deck machine': { id: 'c8', name: 'Pec Deck Machine', category: 'Chest', youtubeId: 'eGjt4jcEA_Q', thumbnailUrl: 'https://img.youtube.com/vi/eGjt4jcEA_Q/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['chest'] },
    'bench press': { id: 'c9', name: 'Bench Press', category: 'Chest', youtubeId: 'rT7DgCr-3pg', thumbnailUrl: 'https://img.youtube.com/vi/rT7DgCr-3pg/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest','arms','shoulders'] },
    'cable fly': { id: 'c10', name: 'Cable Fly', category: 'Chest', youtubeId: 'Iwe6AmxVf7o', thumbnailUrl: 'https://img.youtube.com/vi/Iwe6AmxVf7o/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['chest'] },
    'lat pulldown': { id: 'b1', name: 'Lat Pulldown', category: 'Back', youtubeId: 'CAwf7n6Luuc', thumbnailUrl: 'https://img.youtube.com/vi/CAwf7n6Luuc/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['back','arms'] },
    'barbell row': { id: 'b2', name: 'Barbell Row', category: 'Back', youtubeId: 'G8l_8chR540', thumbnailUrl: 'https://img.youtube.com/vi/G8l_8chR540/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['back','biceps','core'] },
    'pull up': { id: 'b3', name: 'Pull Up', category: 'Back', youtubeId: 'eGo4IYb0KMI', thumbnailUrl: 'https://img.youtube.com/vi/eGo4IYb0KMI/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Advanced', muscles: ['back','biceps'] },
    'seated cable row': { id: 'b4', name: 'Seated Cable Row', category: 'Back', youtubeId: 'GZbfZ033f74', thumbnailUrl: 'https://img.youtube.com/vi/GZbfZ033f74/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['back','biceps'] },
    'dumbbell row': { id: 'b5', name: 'Dumbbell Row', category: 'Back', youtubeId: 'roCP6wCLLZA', thumbnailUrl: 'https://img.youtube.com/vi/roCP6wCLLZA/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['back','biceps'] },
    't-bar row': { id: 'b6', name: 'T-Bar Row', category: 'Back', youtubeId: 'j3Igk5nyZE4', thumbnailUrl: 'https://img.youtube.com/vi/j3Igk5nyZE4/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['back','biceps'] },
    'straight arm pulldown': { id: 'b7', name: 'Straight Arm Pulldown', category: 'Back', youtubeId: 'Gj2A7wOatWk', thumbnailUrl: 'https://img.youtube.com/vi/Gj2A7wOatWk/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['lats'] },
    'barbell squat': { id: 'l1', name: 'Barbell Squat', category: 'Legs', youtubeId: 'bEv6CCg2BC8', thumbnailUrl: 'https://img.youtube.com/vi/bEv6CCg2BC8/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Advanced', muscles: ['legs','core','glutes'] },
    'deadlift': { id: 'l2', name: 'Deadlift', category: 'Legs', youtubeId: 'op9kVnSso6Q', thumbnailUrl: 'https://img.youtube.com/vi/op9kVnSso6Q/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Advanced', muscles: ['back','legs','core'] },
    'goblet squat': { id: 'l3', name: 'Goblet Squat', category: 'Legs', youtubeId: '2-SLv_I_B1g', thumbnailUrl: 'https://img.youtube.com/vi/2-SLv_I_B1g/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['legs','core'] },
    'leg press': { id: 'l4', name: 'Leg Press', category: 'Legs', youtubeId: 'IZxyjW7OSvc', thumbnailUrl: 'https://img.youtube.com/vi/IZxyjW7OSvc/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['quads','glutes'] },
    'lunges': { id: 'l5', name: 'Lunges', category: 'Legs', youtubeId: 'QOVaHwm-Q6U', thumbnailUrl: 'https://img.youtube.com/vi/QOVaHwm-Q6U/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['quads','glutes'] },
    'romanian deadlift': { id: 'l6', name: 'Romanian Deadlift', category: 'Legs', youtubeId: 'JCXUYuzwNrM', thumbnailUrl: 'https://img.youtube.com/vi/JCXUYuzwNrM/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['hamstrings','glutes','lower back'] },
    'leg extension': { id: 'l7', name: 'Leg Extension', category: 'Legs', youtubeId: 'YyvSfVjQeL0', thumbnailUrl: 'https://img.youtube.com/vi/YyvSfVjQeL0/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['quads'] },
    'bulgarian split squat': { id: 'l8', name: 'Bulgarian Split Squat', category: 'Legs', youtubeId: '2C-uNgKwPLE', thumbnailUrl: 'https://img.youtube.com/vi/2C-uNgKwPLE/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Advanced', muscles: ['quads','glutes'] },
    'overhead press': { id: 's1', name: 'Overhead Press', category: 'Shoulders', youtubeId: 'QAQ64BKYzjI', thumbnailUrl: 'https://img.youtube.com/vi/QAQ64BKYzjI/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['shoulders','triceps','core'] },
    'lateral raise': { id: 's2', name: 'Lateral Raise', category: 'Shoulders', youtubeId: '3VcKaXpzqRo', thumbnailUrl: 'https://img.youtube.com/vi/3VcKaXpzqRo/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['shoulders'] },
    'front raise': { id: 's3', name: 'Front Raise', category: 'Shoulders', youtubeId: '-t7fuZ0KhDA', thumbnailUrl: 'https://img.youtube.com/vi/-t7fuZ0KhDA/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['shoulders'] },
    'face pull': { id: 's4', name: 'Face Pull', category: 'Shoulders', youtubeId: 'rep-qVOkqgk', thumbnailUrl: 'https://img.youtube.com/vi/rep-qVOkqgk/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['shoulders','upper back'] },
    'dumbbell shoulder press': { id: 's5', name: 'Dumbbell Shoulder Press', category: 'Shoulders', youtubeId: 'qEwKCR5JCog', thumbnailUrl: 'https://img.youtube.com/vi/qEwKCR5JCog/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['shoulders','triceps'] },
    'bicep curl': { id: 'a1', name: 'Bicep Curl', category: 'Arms', youtubeId: 'ykJmrZ5v0Oo', thumbnailUrl: 'https://img.youtube.com/vi/ykJmrZ5v0Oo/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['biceps'] },
    'tricep extension': { id: 'a2', name: 'Tricep Extension', category: 'Arms', youtubeId: 'nRiJVZDpdL0', thumbnailUrl: 'https://img.youtube.com/vi/nRiJVZDpdL0/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['triceps'] },
    'hammer curl': { id: 'a3', name: 'Hammer Curl', category: 'Arms', youtubeId: 'zC3nLlEvin4', thumbnailUrl: 'https://img.youtube.com/vi/zC3nLlEvin4/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['biceps','forearms'] },
    'skull crusher': { id: 'a4', name: 'Skull Crusher', category: 'Arms', youtubeId: 'd_KZxkY_0cM', thumbnailUrl: 'https://img.youtube.com/vi/d_KZxkY_0cM/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['triceps'] },
    'tricep dips': { id: 'a5', name: 'Tricep Dips', category: 'Arms', youtubeId: '2z8JmcrW-As', thumbnailUrl: 'https://img.youtube.com/vi/2z8JmcrW-As/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['triceps','chest'] },
    'standard plank': { id: 'ab1', name: 'Standard Plank', category: 'Core', youtubeId: 'ASdvN_XEl_c', thumbnailUrl: 'https://img.youtube.com/vi/ASdvN_XEl_c/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['core'] },
    'crunch': { id: 'ab2', name: 'Crunch', category: 'Core', youtubeId: 'Xyd_fa5zoEU', thumbnailUrl: 'https://img.youtube.com/vi/Xyd_fa5zoEU/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['core'] },
    'russian twist': { id: 'ab3', name: 'Russian Twist', category: 'Core', youtubeId: 'wkD8rjkodUI', thumbnailUrl: 'https://img.youtube.com/vi/wkD8rjkodUI/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['core','obliques'] },
    'leg raises': { id: 'ab4', name: 'Leg Raises', category: 'Core', youtubeId: 'JB2oyawG9KI', thumbnailUrl: 'https://img.youtube.com/vi/JB2oyawG9KI/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['core','lower abs'] },
    'bicycle crunches': { id: 'ab5', name: 'Bicycle Crunches', category: 'Core', youtubeId: '9FGilxCbdz8', thumbnailUrl: 'https://img.youtube.com/vi/9FGilxCbdz8/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['core','obliques'] },
    'plank': { id: 'ab6', name: 'Plank', category: 'Core', youtubeId: 'ASdvN_XEl_c', thumbnailUrl: 'https://img.youtube.com/vi/ASdvN_XEl_c/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Beginner', muscles: ['core'] },
    'burpees': { id: 'f1', name: 'Burpees', category: 'Finisher', youtubeId: 'dZgVxmf6jkA', thumbnailUrl: 'https://img.youtube.com/vi/dZgVxmf6jkA/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Advanced', muscles: ['legs','chest','core','arms'] },
    'kettlebell swing': { id: 'f2', name: 'Kettlebell Swing', category: 'Finisher', youtubeId: 'YSxHifyI6s8', thumbnailUrl: 'https://img.youtube.com/vi/YSxHifyI6s8/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Intermediate', muscles: ['glutes','hamstrings','core'] },
    'box jumps': { id: 'f3', name: 'Box Jumps', category: 'Finisher', youtubeId: '52r_Ul5k03g', thumbnailUrl: 'https://img.youtube.com/vi/52r_Ul5k03g/maxresdefault.jpg', setup: ['Assume starting position', 'Keep core tight'], execution: ['Perform movement with control', 'Breathe rhythmically'], mistakes: ['Rushing the rep', 'Poor posture'], difficulty: 'Advanced', muscles: ['legs','cardio'] },
    'lying leg curl': { id: 'l9', name: 'Lying Leg Curl', category: 'Legs', youtubeId: '9N-7_Nn0OnM', thumbnailUrl: 'https://img.youtube.com/vi/9N-7_Nn0OnM/maxresdefault.jpg', setup: ['Adjust machine roller to upper ankles', 'Lie down face-first on bench'], execution: ['Curl the legs upward dynamically', 'Lower under complete control'], mistakes: ['Hips raising off the pad', 'Rushing down phase'], difficulty: 'Beginner', muscles: ['hamstrings','glutes'] },
    'calf raise': { id: 'l10', name: 'Calf Raise', category: 'Legs', youtubeId: '7PNo9YAtX7k', thumbnailUrl: 'https://img.youtube.com/vi/7PNo9YAtX7k/maxresdefault.jpg', setup: ['Stand tall with heels hanging off platformEdge', 'Hold supportive bar'], execution: ['Thrust ankles up high into tip-toes', 'Drop heels fully down below baseline'], mistakes: ['Short range of motion', 'Bending the knees excessively'], difficulty: 'Beginner', muscles: ['calves'] },
    'preacher curl': { id: 'a6', name: 'Preacher Curl', category: 'Arms', youtubeId: 'fIWP-FRFNU0', thumbnailUrl: 'https://img.youtube.com/vi/fIWP-FRFNU0/maxresdefault.jpg', setup: ['Rest arms securely on angled preacher bench pad', 'Hold barbell or dumbbells'], execution: ['Curl weight upwards toward forehead', 'Lower slowly, retaining slight joint flexion'], mistakes: ['Fully hyper-extending the elbows', 'Leaning back to lift'], difficulty: 'Intermediate', muscles: ['biceps','forearms'] },
    'barbell shrug': { id: 's6', name: 'Barbell Shrug', category: 'Shoulders', youtubeId: 'A8L8wNuh9mQ', thumbnailUrl: 'https://img.youtube.com/vi/A8L8wNuh9mQ/maxresdefault.jpg', setup: ['Hold barbell in front with overhand grip', 'Stand straight with wide posture'], execution: ['Raise shoulders towards ears dynamically', 'Squeeze briefly, then lower with control'], mistakes: ['Rolling shoulders backward', 'Using neck/head bobbing'], difficulty: 'Beginner', muscles: ['shoulders','upper back'] },
    'tricep pushdown': { id: 'a7', name: 'Tricep Pushdown', category: 'Arms', youtubeId: '2-LAMgAOk80', thumbnailUrl: 'https://img.youtube.com/vi/2-LAMgAOk80/maxresdefault.jpg', setup: ['Attach rope or bar to high pulley cable', 'Pin elbows firmly against ribcage'], execution: ['Extend elbows straight downward completely', 'Return upward slowly under full tension'], mistakes: ['Elbows flaring outward', 'Using upper body weight leverage'], difficulty: 'Beginner', muscles: ['triceps'] },
    'squat': { id: 'l11', name: 'Squat', category: 'Legs', youtubeId: 'bEv6CCg2BC8', thumbnailUrl: 'https://img.youtube.com/vi/bEv6CCg2BC8/maxresdefault.jpg', setup: ['Keep feet shoulder-width apart', 'Keep chest high and core engaged'], execution: ['Descend by pushing hips back and bending knees', 'Drive through mid-foot back to starting stance'], mistakes: ['Knees caving inwards', 'Heels lifting off ground'], difficulty: 'Beginner', muscles: ['legs','glutes','core'] }
};

const DEFAULT_EXERCISE: ExerciseData = { 
    id: 'def', 
    name: 'Protocol Guide', 
    category: 'General', 
    youtubeId: 'Wv-S8InmXbM', 
    thumbnailUrl: 'https://img.youtube.com/vi/Wv-S8InmXbM/maxresdefault.jpg', 
    setup: ['Assume starting position carefully', 'Prioritize solid core bracing posture'], 
    execution: ['Execute movement under full concentric and eccentric control', 'Breathe out on peak exertion'], 
    mistakes: ['Sacrificing execution form for weight load', 'Consult certified trainer on floor for assistance'], 
    difficulty: 'Beginner', 
    muscles: [] 
};

export const getExerciseByName = (name: string): ExerciseData => {
    if (!name) return DEFAULT_EXERCISE;
    
    // Lowcase string matching with normalization of plurals, spaces, and hyphens
    const originalLower = name.toLowerCase();
    
    const normalize = (str: string) => {
        return str
            .toLowerCase()
            .replace(/[^a-z0-5\s]/g, '') // Keep alphanumeric and spaces
            .replace(/\b(s|es)\b/g, '')  // Strip plural 's' or 'es' on boundaries (e.g. squats -> squat)
            .replace(/\bpushups\b/g, 'push up')
            .replace(/\bpullups\b/g, 'pull up')
            .replace(/\bsitups\b/g, 'crunch')
            .replace(/\bcurls\b/g, 'curl')
            .replace(/\braises\b/g, 'raise')
            .replace(/\blunges\b/g, 'lunge')
            .replace(/\bplanks\b/g, 'plank')
            .replace(/\bshrugs\b/g, 'shrug')
            .replace(/\bpresses\b/g, 'press')
            .trim();
    };

    const normName = normalize(name);

    // 1. Precise match (exact sanitized key matching)
    const keys = Object.keys(EXERCISE_DB);
    let matchedKey = keys.find(k => normalize(k) === normName);
    if (matchedKey) return EXERCISE_DB[matchedKey];

    // 2. Exact substring match in either direction: e.g. "squat" vs "barbell squat"
    matchedKey = keys.find(k => {
        const normK = normalize(k);
        return normName.includes(normK) || normK.includes(normName);
    });
    if (matchedKey) return EXERCISE_DB[matchedKey];

    // 3. Synonym dictionary matching for other standard terms
    const synonyms: Record<string, string> = {
        'calf': 'calf raise',
        'shrug': 'barbell shrug',
        'curl': 'bicep curl',
        'dips': 'tricep dips',
        'shoulder': 'overhead press',
        'overhead': 'overhead press',
        'press': 'barbell bench press',
        'squat': 'squat',
        'leg curl': 'lying leg curl',
        'pushup': 'push up',
        'pullup': 'pull up',
        'lat pull': 'lat pulldown',
        'plank': 'standard plank',
        'crunch': 'crunch',
        'pushdown': 'tricep pushdown',
        'row': 'barbell row'
    };

    for (const [kw, targetKey] of Object.entries(synonyms)) {
        if (normName.includes(kw)) {
            if (EXERCISE_DB[targetKey]) {
                return EXERCISE_DB[targetKey];
            }
        }
    }

    // 4. Overlap-based token matching (highest number of shared words)
    const nameTokens = normName.split(/\s+/).filter(t => t.length > 2);
    if (nameTokens.length > 0) {
        let bestKey: string | null = null;
        let maxOverlap = 0;
        
        for (const k of keys) {
            const kTokens = normalize(k).split(/\s+/).filter(t => t.length > 2);
            const overlap = nameTokens.filter(t => kTokens.includes(t)).length;
            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                bestKey = k;
            }
        }
        if (bestKey && maxOverlap > 0) {
            return EXERCISE_DB[bestKey];
        }
    }

    // Fallback: If no match at all, generate a dynamic one with fallback video!
    return { 
        ...DEFAULT_EXERCISE, 
        name: name,
        thumbnailUrl: `https://img.youtube.com/vi/${DEFAULT_EXERCISE.youtubeId}/hqdefault.jpg`
    };
};

export const getMediaForExercise = (name: string): string => {
    const ex = getExerciseByName(name);
    return ex.thumbnailUrl || `https://img.youtube.com/vi/${ex.youtubeId}/hqdefault.jpg`;
};

const getEmbedUrl = (urlOrId?: string, fallbackId?: string): string => {
    const defaultId = 'Wv-S8InmXbM';
    const rawValue = (urlOrId || fallbackId || defaultId).trim();
    
    if (rawValue.includes('youtube.com/') || rawValue.includes('youtu.be/')) {
        let id = '';
        if (rawValue.includes('watch?v=')) {
            id = rawValue.split('watch?v=')[1]?.split('&')[0] || '';
        } else if (rawValue.includes('youtu.be/')) {
            id = rawValue.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (rawValue.includes('youtube.com/embed/')) {
            id = rawValue.split('youtube.com/embed/')[1]?.split('?')[0] || '';
        }
        if (id) {
            return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0&controls=1&disablekb=1`;
        }
    }
    
    let cleanId = rawValue;
    if (cleanId.includes('v=')) {
        cleanId = cleanId.split('v=')[1]?.split('&')[0] || cleanId;
    }
    cleanId = cleanId.split('?')[0];

    return `https://www.youtube.com/embed/${cleanId}?autoplay=1&modestbranding=1&rel=0&controls=1&disablekb=1`;
};

import MuscleModel3D from './MuscleModel3D';

interface ExerciseDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    aiMetadata?: { analysis: string; proTips: string[] };
    videoUrl?: string;
}

const ExerciseDemoModal: React.FC<ExerciseDemoModalProps> = ({ isOpen, onClose, exerciseName, aiMetadata, videoUrl }) => {
    const data = getExerciseByName(exerciseName);
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Exhale'>('Inhale');
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setHasError(false);
            // Process buffer time for cinematic effect
            setTimeout(() => setIsLoading(false), 800);
        }
    }, [isOpen, data.youtubeId, videoUrl]);
    
    // Breathing Animation Loop
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setBreathingPhase(prev => prev === 'Inhale' ? 'Exhale' : 'Inhale');
        }, 3000);
        return () => clearInterval(interval);
    }, [isOpen]);

    // Tip rotation
    useEffect(() => {
        if (!isOpen) return;
        const tips = aiMetadata?.proTips || data.mistakes;
        const interval = setInterval(() => {
            setCurrentTipIndex(prev => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isOpen, aiMetadata, data.mistakes]);

    const handlePlayVoice = async () => {
        setIsVoicePlaying(true);
        const script = `Protocol for ${data.name}. Setup: ${data.setup.join('. ')}. Execution: ${data.execution.join('. ')}. Avoid: ${data.mistakes.join('. ')}`;
        try {
            const audio = await generateTextToSpeech(script);
            if (audio) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const buffer = await decodeAudioData(decode(audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => setIsVoicePlaying(false);
                source.start();
            }
        } catch (e) { setIsVoicePlaying(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-6xl w-full">
            <div className="flex flex-col lg:flex-row h-[85vh] bg-black text-white rounded-2xl overflow-hidden relative border border-white/10">
                
                {/* LEFT COLUMN: 3D Muscle Model (Zone) */}
                <div className="w-full lg:w-1/3 bg-gray-900/50 border-r border-white/10 flex flex-col relative">
                    <div className="p-4 bg-black/80 border-b border-white/10 z-10">
                        <h3 className="text-lg font-black italic uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                            <SparkleIcon className="w-4 h-4" /> Zone
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Target Muscle Activation</p>
                    </div>
                    <div className="flex-grow relative">
                        {isOpen && <MuscleModel3D targetMuscles={data.muscles} />}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">Primary Targets:</p>
                            <div className="flex flex-wrap gap-2">
                                {data.muscles.length > 0 ? data.muscles.map(m => (
                                    <span key={m} className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-bold uppercase tracking-widest">
                                        {m}
                                    </span>
                                )) : (
                                    <span className="text-xs text-gray-500">Full Body / Compound</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Video & Info */}
                <div className="w-full lg:w-2/3 flex flex-col relative">
                    {/* Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start pointer-events-none">
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-md flex items-center gap-2">
                                {data.name}
                            </h2>
                            <span className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest inline-flex items-center mt-1 shadow-lg">
                                {data.category} • {data.difficulty}
                            </span>
                        </div>
                    </div>

                    {/* Main Video Area */}
                    <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black">
                                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Establishing Smart Uplink...</p>
                            </div>
                        )}

                        {!hasError && (
                             <div className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center relative group">
                                 {(videoUrl || data.youtubeId) ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getEmbedUrl(videoUrl, data.youtubeId)}
                                        title={data.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full object-cover"
                                    ></iframe>
                                 ) : (
                                     <>
                                        <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 flex items-center justify-center relative animate-pulse">
                                            <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin"></div>
                                            <VideoCameraIcon className="w-12 h-12 text-cyan-400" />
                                        </div>
                                        <p className="mt-6 text-cyan-400 font-mono uppercase tracking-widest text-sm font-bold">Smart Simulation Active</p>
                                     </>
                                 )}
                                 
                                 {/* Security Overlay (Transparent) */}
                                 <div className="absolute inset-0 z-10 pointer-events-none bg-transparent"></div>

                                 {/* Watermark */}
                                 <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-red-500/30 flex items-center gap-2 pointer-events-none">
                                    <Lock className="w-4 h-4 text-red-500" />
                                    <span className="text-[10px] text-white font-mono uppercase tracking-widest">
                                        CONFIDENTIAL • ID: {Date.now().toString().slice(-6)}
                                    </span>
                                 </div>
                             </div>
                        )}
                        
                        {hasError && (
                             <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-center p-6">
                                 <WifiOff className="w-16 h-16 text-red-500 mb-4" />
                                 <h3 className="text-xl font-bold text-white mb-2">Signal Lost</h3>
                                 <p className="text-gray-400 text-sm">Unable to load protocol simulation. Please consult floor trainer.</p>
                             </div>
                        )}

                    </div>

                    {/* Info Panel */}
                    <div className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-6 z-20 max-h-[40%] overflow-y-auto custom-scrollbar relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-center mb-4 sticky top-0">
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full"></div>
                        </div>
                        
                        {aiMetadata && (
                            <div className="mb-6 bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <BotIcon className="w-3 h-3"/> Smart Analysis
                                </p>
                                <p className="text-sm text-indigo-100 italic">"{aiMetadata.analysis}"</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircleIcon className="w-3 h-3" /> 
                                    {aiMetadata ? 'Pro Tips (AI)' : 'Key Execution Points'}
                                </h4>
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                    <p className="text-sm text-gray-200 font-medium transition-all duration-500 min-h-[40px] flex items-center">
                                        {aiMetadata ? aiMetadata.proTips[currentTipIndex] : data.execution[currentTipIndex % data.execution.length]}
                                    </p>
                                    <div className="flex gap-1 mt-3 justify-center">
                                        {(aiMetadata?.proTips || data.execution).map((_, i) => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentTipIndex ? 'bg-green-500 w-3' : 'bg-gray-700'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> Common Errors
                                </h4>
                                <ul className="text-sm text-gray-400 space-y-2">
                                    {data.mistakes.map((m, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-red-500 mt-1">×</span> {m}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors border border-white/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </Modal>
    );
};

export default ExerciseDemoModal;
