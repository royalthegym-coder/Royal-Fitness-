import { GoogleGenAI, Type } from "@google/genai";
import { cleanAndParseJSON } from "./core_ai.ts";

// Initialize the Google Core AI API client on the server side lazily
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please add GEMINI_API_KEY in the environment or Settings menu.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * TypeScript Interfaces for user's 1-Rep Max metrics
 */
export interface OneRepMaxData {
  benchPress: number;
  squat: number;
  deadlift: number;
  overheadPress?: number;
  [key: string]: number | undefined;
}

/**
 * Expected real-time workout feedback values
 */
export type WorkoutFeedbackType = 'too hard' | 'too easy' | 'joint pain' | string;

/**
 * Expected interface for an individual customized exercise in the workout plan
 */
export interface AdaptiveWorkoutExercise {
  name: string;
  targetWeightLbs: number;
  percentageOf1RM: number;
  sets: number;
  reps: string;
  tempo: string;
  notes: string;
}

/**
 * Structured response interface for the modified workout plan returned by the AI Coach
 */
export interface AdjustedWorkoutPlan {
  coachReasoning: string;
  intensityAdjustment: string;
  safetyProtocols: string[];
  exercises: AdaptiveWorkoutExercise[];
}

/**
 * Safe fallback plan used when the LLM outputs malformed results or is offline
 */
export const getFallbackWorkoutPlan = (feedback: WorkoutFeedbackType, oneRepMax: OneRepMaxData): AdjustedWorkoutPlan => {
  const bench = oneRepMax.benchPress || 135;
  const squat = oneRepMax.squat || 185;
  const deadlift = oneRepMax.deadlift || 225;

  if (feedback === 'joint pain') {
    return {
      coachReasoning: "Fallback Mode: User reported joint pain/discomfort. Swapped high-shear lifts with joint-friendly high-repetition tempo movements to maintain blood flow and joint health.",
      intensityAdjustment: "De-escalated barbell loads to 45% of 1-Rep Max with high control.",
      safetyProtocols: [
        "Avoid any joint locking or hyper-extensions.",
        "Perform exercises with continuous controlled concentric contraction.",
        "Discontinue any set immediately upon neurological pinches or sharp pain."
      ],
      exercises: [
        {
          name: "Temponed Goblet squat (Subbed for heavy squat)",
          targetWeightLbs: Math.round(squat * 0.35),
          percentageOf1RM: 35,
          sets: 3,
          reps: "15",
          tempo: "4-2-2-0",
          notes: "Focus heavily on hips, glutes, and quadriceps alignment; avoid parallel depth limits if knee alignment suffers."
        },
        {
          name: "Dumbbell Floor Press (Subbed for Bench Press)",
          targetWeightLbs: Math.round(bench * 0.45),
          percentageOf1RM: 45,
          sets: 3,
          reps: "12-15",
          tempo: "3-1-2-0",
          notes: "Limits range of motion at bottom of chest plane protecting shoulder joints and anterior deltoids."
        }
      ]
    };
  } else if (feedback === 'too hard') {
    return {
      coachReasoning: "Fallback Mode: Current routine felt excessively exhausting or compromised safe lifting mechanics. Reduced relative loading percentages of 1-Rep Max and adjusted rep ranges.",
      intensityAdjustment: "Scaled load down by 15-20% into absolute hypertrophic volume zone.",
      safetyProtocols: [
        "Take a complete 120-second rest period between main work sets.",
        "Maintain deep diaphragmatic breathing cycles throughout repetition blocks."
      ],
      exercises: [
        {
          name: "Back Squat (Moderate Intensity)",
          targetWeightLbs: Math.round(squat * 0.60),
          percentageOf1RM: 60,
          sets: 3,
          reps: "8-10",
          tempo: "3-0-1-0",
          notes: "Focus on rigid abdominal intra-pressure brace before descending."
        },
        {
          name: "Bench Press (Volume Adjust)",
          targetWeightLbs: Math.round(bench * 0.65),
          percentageOf1RM: 65,
          sets: 3,
          reps: "8",
          tempo: "2-0-1-0",
          notes: "Slam scapulas flat and keep heels pinned to the platform."
        }
      ]
    };
  } else {
    // defaults to progressive overload or general optimal output (for 'too easy' or other)
    return {
      coachReasoning: "Fallback Mode: Stimulus was rated too mild. Applying progressive overload using precise percentages of 1-Rep max to spike adaptive mechanical tension safely.",
      intensityAdjustment: "Increased training weight loads to 82.5% of absolute peak strength.",
      safetyProtocols: [
        "Spotter highly recommended for final performance reps.",
        "Ensure weight belts or security measures are buckled before axial loads."
      ],
      exercises: [
        {
          name: "Back Squat (Heavy Overload Work)",
          targetWeightLbs: Math.round(squat * 0.80),
          percentageOf1RM: 80,
          sets: 4,
          reps: "5",
          tempo: "3-1-1-0",
          notes: "Aggressive core activation. Burst out of the bottom hole with chest lead."
        },
        {
          name: "Bench Press (Heavy Strength Series)",
          targetWeightLbs: Math.round(bench * 0.85),
          percentageOf1RM: 85,
          sets: 4,
          reps: "4-5",
          tempo: "2-1-1-0",
          notes: "Focus on absolute leg drive pushing back towards the barbell trajectory."
        }
      ]
    };
  }
};

/**
 * Instantly recalculate a personalized workout plan using Core AI Pro AI
 * based on user's real-time physical feedback and 1-Rep Max figures.
 * 
 * @param feedback User feedback string (e.g. 'too hard', 'too easy', 'joint pain')
 * @param oneRepMax Metrics representing the peak capabilities of the lifter in question
 * @returns A structured workout JSON plan designed to be executed safely
 */
export async function AdaptiveCoachSync(
  feedback: WorkoutFeedbackType,
  oneRepMax: OneRepMaxData
): Promise<AdjustedWorkoutPlan> {
  
  try {
    const squat1RM = oneRepMax.squat || 185;
    const bench1RM = oneRepMax.benchPress || 135;
    const deadlift1RM = oneRepMax.deadlift || 225;
    const overhead1RM = oneRepMax.overheadPress || 95;

    // Build the system prompt
    const systemPrompt = `You are "AI Omni-Coach Future-Pro", an advanced cyberpunk conditioning engine.
Your single objective is to take lifter feedback and their absolute 1-Rep Max figures to output a highly personalized, biomechanically correct adjusted workout plan in STRICT JSON layout.

FEEDBACK DEFINED ACTION PROTOCOLS:
1. If feedback is "joint pain":
   - Swap traditional axial barbell lifts with highly stabilized dumbbell/cable or machine alternatives.
   - Drastically reduce load percentages (not exceeding 45-50% of 1RM).
   - Increase structural control with specialized slower tempos (e.g., 4-1-2-0) to focus on structural strength without joint shearing.

2. If feedback is "too hard":
   - Maintain the standard compound exercises but lower the volume and loads.
   - Adjust target weights to exactly 60% to 65% of their respective 1-Rep Max.
   - Require longer rest blocks to preserve optimal neurological recuperation.

3. If feedback is "too easy":
   - Push for smart progressive overload.
   - Increase working set intensities to 80-85% of 1-Rep Max.
   - Prescribe a lower repetition scheme (e.g., 3-5 reps) with intense full-body stiffness cues.

4. If feedback is anything else:
   - Carefully interpret the qualitative sentiment and scale coordinates appropriately.

OUTPUT FORMAT STANDARD:
You must reply with a single JSON object. Use EXACTLY the keys of the requested schema with no markdown block wrappers or trailing commas.

EXPECTED SCHEMA:
{
  "coachReasoning": "Detailed breakdown explaining the scientific reasoning behind swapping movements or modifying loading profiles based on their 1-Rep Max",
  "intensityAdjustment": "Clear metric stating exactly how much intensity was adjusted (e.g., 'Load slashed by 25% due to joint issues')",
  "safetyProtocols": [
    "A list of 3 strict safety/breathing/biomechanical checklist directives specifically matching the feedback given"
  ],
  "exercises": [
    {
      "name": "Correct Exercise Name",
      "targetWeightLbs": 120, // calculated precisely by applying the percent to the specific 1RM value (benchPress for bench, squat for squat, deadlift for deadlift, overheadPress for shoulder exercises)
      "percentageOf1RM": 65, // the percentage used (as an integer)
      "sets": 3,
      "reps": "8-10",
      "tempo": "3-1-1-0",
      "notes": "Targeted execution tip reinforcing safe mechanics under specific user feedback constraints"
    }
  ]
}`;

    const userPrompt = `
LIFTER CAPABILITY METRICS (1-Rep Maxes):
- Squat: ${squat1RM} lbs
- Bench Press: ${bench1RM} lbs
- Deadlift: ${deadlift1RM} lbs
- Overhead Press: ${overhead1RM} lbs

LIFTER REAL-TIME WORKOUT FEEDBACK:
"${feedback}"

Instantly run calculation protocols. Output the modified json plan according to rules.`;

    // Execute the request using gemini-4-hydrogen
    const response = await getAI().models.generateContent({
      model: "gemini-4-hydrogen",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coachReasoning: { type: Type.STRING },
            intensityAdjustment: { type: Type.STRING },
            safetyProtocols: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  targetWeightLbs: { type: Type.INTEGER },
                  percentageOf1RM: { type: Type.INTEGER },
                  sets: { type: Type.INTEGER },
                  reps: { type: Type.STRING },
                  tempo: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["name", "targetWeightLbs", "percentageOf1RM", "sets", "reps", "tempo", "notes"]
              }
            }
          },
          required: ["coachReasoning", "intensityAdjustment", "safetyProtocols", "exercises"]
        }
      }
    });

    const textOutput = response.text || "";
    if (!textOutput.trim()) {
      throw new Error("Received empty token output from Core AI models.");
    }

    const parsedResult = cleanAndParseJSON(textOutput) as AdjustedWorkoutPlan;

    // Validate structured layout keys to ensure absolutely zero malformed execution
    if (
      !parsedResult.coachReasoning ||
      !parsedResult.intensityAdjustment ||
      !Array.isArray(parsedResult.safetyProtocols) ||
      !Array.isArray(parsedResult.exercises)
    ) {
      throw new Error("Missing structural response keys in AI parsed schema.");
    }

    // Secondary safety lock: assure numbers are cleanly resolved
    const sanitizedExercises = parsedResult.exercises.map(ex => ({
      name: ex.name || "Custom Exercise",
      targetWeightLbs: Number(ex.targetWeightLbs) || 100,
      percentageOf1RM: Number(ex.percentageOf1RM) || 50,
      sets: Number(ex.sets) || 3,
      reps: ex.reps || "8",
      tempo: ex.tempo || "2-0-2-0",
      notes: ex.notes || "Maintain ideal spinal bracing."
    }));

    return {
      coachReasoning: parsedResult.coachReasoning,
      intensityAdjustment: parsedResult.intensityAdjustment,
      safetyProtocols: parsedResult.safetyProtocols,
      exercises: sanitizedExercises
    };

  } catch (error) {
    console.error("AdaptiveCoachSync API process failure:", error);
    // Bulletproof try-catch error boundary returns complete fallback plan to prevent application crash
    return getFallbackWorkoutPlan(feedback, oneRepMax);
  }
}
