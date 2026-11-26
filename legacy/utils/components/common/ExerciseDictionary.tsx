import React, { useState } from 'react';
import { Layers, CheckCircle, Info, ChevronRight, Activity, Zap } from 'lucide-react';
import { DumbbellIcon } from '../icons/DumbbellIcon';

interface EnglishExercise {
  id: string;
  name: string;
  englishName: string;
  description: string;
  benefits: string[];
  formInstructions: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  ytTag?: string;
}

interface MuscleGroup {
  id: string;
  name: string;
  englishName: string;
  exercises: EnglishExercise[];
}

export const EXERCISE_DB: MuscleGroup[] = [
  {
    id: "chest",
    name: "Chest",
    englishName: "Chest",
    exercises: [
      {
        id: "c1",
        name: "Barbell Bench Press",
        englishName: "Barbell Bench Press",
        description: "The ultimate foundational compound exercise for building raw upper body power and chest mass.",
        benefits: ["Increases pectoralis muscle size and density", "Strengthens triceps and anterior deltoid muscles", "Boosts maximum upper body pressing power"],
        formInstructions: [
          "Lie flat on the bench and align your eyes directly under the bar.",
          "Grip the bar slightly wider than shoulder-width.",
          "Lower the bar slowly under control to mid-chest level.",
          "Push the barbell upward with force while keeping a slight bend in your elbows at the top."
        ],
        difficulty: "Intermediate"
      },
      {
        id: "c2",
        name: "Push-Ups",
        englishName: "Push-Ups",
        description: "A classic bodyweight movement targeting the chest, shoulders, and tricep muscles.",
        benefits: ["Requires zero equipment, can be done anywhere", "Improves core stability and alignment", "Enhances muscle endurance across upper frame"],
        formInstructions: [
          "Set hands slightly wider than shoulder-width and enter a strong plank position.",
          "Lower your chest toward the floor while keeping your body in a straight line.",
          "Keep elbows tucked back at roughly a 45-degree angle.",
          "Press chest back up to lock out and return to the starting position."
        ],
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: "back",
    name: "Back",
    englishName: "Back",
    exercises: [
      {
        id: "b1",
        name: "Deadlift",
        englishName: "Deadlift",
        description: "A premier full-body compound pull targeting lower back, glute, and hamstring muscles.",
        benefits: ["Massive boost to full-body raw power", "Improves spine posture and lumbar stability", "Triggers healthy muscle-building hormones"],
        formInstructions: [
          "Stand with feet shoulder-width, bar aligned over your mid-foot.",
          "Bend hips and knees with a flat spine to grip the bar securely.",
          "Keep your shoulders back, stomach tight, and spine aligned.",
          "Drive heels through the floor to stand tall and lock out hips."
        ],
        difficulty: "Advanced"
      },
      {
        id: "b2",
        name: "Lat Pulldown",
        englishName: "Lat Pulldown",
        description: "A highly effective machine movement for developing the latissimus dorsi to widen the upper back.",
        benefits: ["Sculpts a beautifully wide V-tapered back profile", "Builds strict vertical pulling capacity", "Supports healthy shoulders and posture"],
        formInstructions: [
          "Sit at the station and secure thighs tightly under the support pads.",
          "Grip the bar wider than shoulder-width using an overhand grip.",
          "Pull the bar down to your upper chest while driving elbows downward and back.",
          "Allow the bar to return slowly to the peak of the movement."
        ],
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: "legs",
    name: "Legs",
    englishName: "Legs",
    exercises: [
      {
        id: "l1",
        name: "Squats",
        englishName: "Squats",
        description: "The undisputed king of leg exercises for packing muscle on thighs, hips, and glutes.",
        benefits: ["Total development of quadriceps, hamstrings, and glutes", "Builds systemic structural core strength", "Improves bone density and knee joint health"],
        formInstructions: [
          "Stand with feet shoulder-width apart, toes flared slightly outwards.",
          "Keep chest up, push hips back, and sit down as if on an invisible chair.",
          "Descend until thighs are at least parallel with the floor.",
          "Drive back up firmly through your heels to return to standing."
        ],
        difficulty: "Intermediate"
      },
      {
        id: "l2",
        name: "Lunges",
        englishName: "Lunges",
        description: "A unilateral leg movement critical for perfecting lower-body coordination, stability, and balance.",
        benefits: ["Improves walking gate, coordination, and posture", "Balances muscle strength between left and right legs", "Delivers targeted activation to glute muscles"],
        formInstructions: [
          "Stand up straight, then take a generous step forward with one leg.",
          "Lower hips until both front and back knees are bent at a 90-degree angle.",
          "Keep back knee hovering just off the floor without resting.",
          "Push off your front heel to stand back up to the start position."
        ],
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: "shoulders",
    name: "Shoulders",
    englishName: "Shoulders",
    exercises: [
      {
        id: "s1",
        name: "Overhead Dumbbell Press",
        englishName: "Overhead Dumbbell Press",
        description: "The foundational vertical press for layering size and definition on shoulder muscles.",
        benefits: ["Thorough development of anterior and lateral deltoids", "Increases overhead pushing power and stability", "Supports core structures to balance weights"],
        formInstructions: [
          "Sit on an upright barbell bench set at 90 degrees with back fully flushed.",
          "Raise dumbbells to shoulder level with palms facing away from you.",
          "Press weights straight overhead smoothly without banging dumbbells together.",
          "Lower back down slowly to shoulder level under strict control."
        ],
        difficulty: "Intermediate"
      },
      {
        id: "s2",
        name: "Lateral Raises",
        englishName: "Lateral Raises",
        description: "An isolation exercise focused entirely on side deltoids to create maximum shoulder wideness.",
        benefits: ["Builds excellent roundness on lateral deltoid caps", "Complements a sleek V-taper frame", "Improves shoulder joint movement range"],
        formInstructions: [
          "Hold light dumbbells by your sides with arms slightly hanging.",
          "With elbows slightly bent, raise arms out to the sides.",
          "Stop raising once dumbbells reach parallel to the floor.",
          "Slowly lower dumbbells back down to your sides."
        ],
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: "arms",
    name: "Arms",
    englishName: "Arms",
    exercises: [
      {
        id: "a1",
        name: "Barbell Bicep Curl",
        englishName: "Barbell Bicep Curl",
        description: "The gold-standard exercise for adding thick muscle mass to the upper arm biceps.",
        benefits: ["Superb developmental workload for bicep brachii heads", "Builds grip strength and wrist joint support", "Adds prominent athletic definition to arms"],
        formInstructions: [
          "Hold a barbell with an underhand grip shoulder-width apart.",
          "Keep elbows pinned tightly close to your torso sides.",
          "Curl the bar toward your chest using only arm bending muscles.",
          "Squeeze the biceps at peak height and descend under strict control."
        ],
        difficulty: "Beginner"
      },
      {
        id: "a2",
        name: "Triceps Pushdown",
        englishName: "Triceps Pushdown",
        description: "Excellent isolation pulley movement targeting the outer tricep muscle fibers.",
        benefits: ["Fills out arm thickness (triceps cover 60% of absolute arm size)", "Enhances elbow joint and lockout strength", "Excellent for building sleeve-fitting arm shapes"],
        formInstructions: [
          "Grip the cable rope or straight-bar attachment with thumbs up.",
          "Lock elbows tightly beside your ribs so they remain completely static.",
          "Press the attachment downward until arms are fully locked.",
          "Allow the attachment to travel back up slowly under control."
        ],
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: "core",
    name: "Core",
    englishName: "Core",
    exercises: [
      {
        id: "co1",
        name: "Plank",
        englishName: "Plank",
        description: "The premier isometric holds for strengthening deep abdominal tissues and spine balance.",
        benefits: ["Strengthens deep transverse abdominis muscles", "Protects lower back from posture-related strains", "Greatly improves core balance and full-body stability"],
        formInstructions: [
          "Lie face down and raise weight on your elbows and toes.",
          "Ensure your elbows are positioned directly underneath shoulder joints.",
          "Keep your head-to-heel posture locked as straight as a board.",
          "Squeeze abs and glute muscles hard throughout the duration."
        ],
        difficulty: "Beginner"
      },
      {
        id: "co2",
        name: "Crunches",
        englishName: "Crunches",
        description: "An isolated abdominal contraction focusing directly on rectus abdominis muscle fibers.",
        benefits: ["Perfects definition and blockiness in upper abs", "Incredibly simple and requires zero complex setups", "Builds foundational trunk control"],
        formInstructions: [
          "Lie on your back with knees bent and feet planted flat on the floor.",
          "Support your head lightly with your hands near your ears.",
          "Contract your abs to curl your chest and head slightly off the floor.",
          "Hold a brief peak squeeze at the top, then descend slowly."
        ],
        difficulty: "Beginner"
      }
    ]
  }
];

const EnglishExerciseDictionary: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<string>(EXERCISE_DB[0].id);

  const selectedGroup = EXERCISE_DB.find(g => g.id === activeGroup);

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <DumbbellIcon className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-black/30 rounded-2xl border border-white/10 backdrop-blur-md">
            <Activity className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-md">
              Exercise <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Dictionary</span>
            </h1>
            <p className="text-indigo-200 mt-2 text-sm font-medium">
              Detailed guide, benefits, and correct forms for major muscle groups.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
        {EXERCISE_DB.map(group => (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border ${
              activeGroup === group.id
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-gray-900 text-gray-400 border-white/5 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {group.name} 
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeGroup === group.id ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'}`}>
              {group.englishName}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {selectedGroup?.exercises.map((exercise) => (
          <div key={exercise.id} className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-amber-500/30 transition-all group relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black text-white">{exercise.name}</h3>
                  <h4 className="text-sm font-mono text-gray-400 uppercase tracking-widest">{exercise.englishName}</h4>
                </div>
                <div className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {exercise.difficulty}
                </div>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed mb-6 italic bg-black/20 p-4 rounded-xl border border-white/5">
                "{exercise.description}"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Instructions */}
                <div className="space-y-3">
                  <h5 className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest">
                    <CheckCircle className="w-4 h-4" /> Instructions
                  </h5>
                  <ul className="space-y-3">
                    {exercise.formInstructions.map((instruction, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] font-mono border border-white/10 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <h5 className="flex items-center gap-2 text-xs font-black text-green-500 uppercase tracking-widest">
                    <Zap className="w-4 h-4" /> Benefits
                  </h5>
                  <div className="bg-green-900/10 border border-green-500/10 rounded-xl p-4 space-y-3">
                    {exercise.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default EnglishExerciseDictionary;
