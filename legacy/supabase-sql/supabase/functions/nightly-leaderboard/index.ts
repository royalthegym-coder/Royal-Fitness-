// ==============================================================================
// THE SINGULARITY: FUTURE-OS SUPABASE EDGE FUNCTION
// DESIGNATION: nightly-leaderboard
// TYPE: Deno-compatible Cron Edge Task (runs nightly)
// DESCRIPTION: Pulls workout logs, calculates volumetric load & consistency,
//              issues digital achievement badges, and ranks multi-tenant users.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Establish database connection using Service Role key to bypass RLS for aggregate calculations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing database server authorization environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[INFO] Commencing Nightly Leaders recalculation sequence...");

    // 2. Query all Gym instances (multi-tenancy)
    const { data: gyms, error: gymErr } = await supabase
      .from("gyms")
      .select("id, name");

    if (gymErr) throw gymErr;
    if (!gyms || gyms.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No gym assets discovered present." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const logsSummary: any[] = [];

    // 3. Process each multi-tenant gym individually to isolate leaderboard bounds
    for (const gym of gyms) {
      console.log(`[INFO] Re-calculating leaderboard matrices for Gym: ${gym.name} (${gym.id})`);

      // Fetch all members belonging to this gym
      const { data: members, error: memErr } = await supabase
        .from("members")
        .select("id, first_name, last_name, status")
        .eq("gym_id", gym.id)
        .eq("status", "Active");

      if (memErr) throw memErr;
      if (!members || members.length === 0) {
        continue;
      }

      const gymResults: any[] = [];

      // Fetch all workout logs of the past 60 days of this gym to evaluate volumes
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: workoutLogs, error: workErr } = await supabase
        .from("workout_logs")
        .select("id, member_id, exercises, ai_score, created_at")
        .eq("gym_id", gym.id)
        .gte("created_at", sixtyDaysAgo.toISOString());

      if (workErr) throw workErr;

      // 4. Compute statistics for each active member
      for (const member of members) {
        const memberLogs = (workoutLogs || []).filter(log => log.member_id === member.id);
        
        let totalVolume = 0;
        let consistencyScore = 0;
        let aiScoreWeightedSum = 0;
        let countWithAiScore = 0;
        let weeklyFrequency = 0;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Track unique days worked out to prevent double-logging farming
        const uniqueDays = new Set<string>();

        for (const log of memberLogs) {
          const logDateStr = new Date(log.created_at).toDateString();
          uniqueDays.add(logDateStr);

          // Calculate rolling weekly frequency
          if (new Date(log.created_at) >= oneWeekAgo) {
            weeklyFrequency++;
          }

          if (log.ai_score) {
            aiScoreWeightedSum += log.ai_score;
            countWithAiScore++;
          }

          // Parse JSONB exercises payload for complete lifting tonnage
          // Format expected: Array of exercises: [ { name: "Bench", sets: [ { reps: 8, weight: 135 } ] } ]
          try {
            const exercises = typeof log.exercises === "string" 
              ? JSON.parse(log.exercises) 
              : log.exercises;

            if (Array.isArray(exercises)) {
              for (const exercise of exercises) {
                if (exercise.sets && Array.isArray(exercise.sets)) {
                  for (const set of exercise.sets) {
                    const reps = Number(set.reps || set.repetition_count) || 0;
                    const weight = Number(set.weight || set.weight_lbs || set.load) || 0;
                    totalVolume += (reps * weight);
                  }
                }
              }
            }
          } catch (err) {
            console.error(`[WARN] Failed to parse exercise payload for member ${member.id}:`, err);
          }
        }

        // Consistency calculation: 15 points per unique day, plus 50-point modifier for high frequency
        consistencyScore = (uniqueDays.size * 15) + (memberLogs.length >= 12 ? 50 : 0);
        const avgAiScore = countWithAiScore > 0 ? Number((aiScoreWeightedSum / countWithAiScore).toFixed(2)) : 0.00;

        // 5. Digital Achievement Badges assignment
        const badges: string[] = [];
        if (totalVolume >= 100000) {
          badges.push("Titanium Lifter");
        } else if (totalVolume >= 4000) {
          badges.push("Iron Warrior");
        }

        if (uniqueDays.size >= 12) {
          badges.push("Unstoppable Streak");
        } else if (uniqueDays.size >= 4) {
          badges.push("Iron Habit");
        }

        if (avgAiScore >= 92 && countWithAiScore >= 3) {
          badges.push("Apex Specimen");
        }

        // Rank points composite equation
        const rankPower = (totalVolume * 0.1) + (consistencyScore * 8.0);

        gymResults.push({
          gym_id: gym.id,
          member_id: member.id,
          total_volume: totalVolume,
          consistency_score: consistencyScore,
          avg_ai_score: avgAiScore,
          weekly_frequency: weeklyFrequency,
          badges,
          rankPower,
          current_rank: 1 // provisional placeholders
        });
      }

      // 6. Rank sorting within the local gym population
      gymResults.sort((a, b) => b.rankPower - a.rankPower);

      // Assign actual sorted ranks rank power ordinal index
      gymResults.forEach((val, idx) => {
        val.current_rank = idx + 1;
      });

      // 7. Upsert results into gym_leaderboard
      for (const res of gymResults) {
        const { error: upsertErr } = await supabase
          .from("gym_leaderboard")
          .upsert({
            gym_id: res.gym_id,
            member_id: res.member_id,
            total_volume: res.total_volume,
            consistency_score: res.consistency_score,
            avg_ai_score: res.avg_ai_score,
            weekly_frequency: res.weekly_frequency,
            badges: res.badges,
            current_rank: res.current_rank,
            last_calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: "gym_id,member_id"
          });

        if (upsertErr) {
          console.error(`[ERROR] Failed to upsert leaderboard stats for member ${res.member_id}:`, upsertErr);
        }
      }

      logsSummary.push({
        gymId: gym.id,
        gymName: gym.name,
        recalculatedMembers: gymResults.length
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Automated ranking computation sequences successfully completed.",
        summary: logsSummary
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (err: any) {
    console.error("[FATAL ERROR] Nightly Leaderboard cron task crash:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal Server Thread Execution Failure",
        details: err.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
