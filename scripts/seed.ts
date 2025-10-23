import "dotenv/config";

import {
  seedProgramTemplates,
  seedTaskTemplates,
  seedTherapistTypes,
} from "../src/modules/shared/services/seed";
import {
  ProgramType,
  TaskFrequency,
  TaskType,
  TaskVisibility,
} from "../src/modules/shared/types/domain";

async function run() {
  console.log("🚀 Starting HabitDesk seed script...\n");

  await seedTherapistTypes(["Physiotherapie", "Ergotherapie", "Psychotherapie"]);
  console.log("✔️ Therapist types seeded");

  const now = new Date().toISOString();

  await seedTaskTemplates([
    {
      id: "balance-training",
      title: "Balance Training",
      description: "Improve patient balance with progressive stability exercises.",
      icon: "directions_walk_rounded",
      type: TaskType.Progress,
      frequency: TaskFrequency.Daily,
      visibility: TaskVisibility.VisibleToPatients,
      roles: ["therapist"],
      isPublished: true,
      createdAt: now,
      updatedAt: now,
      config: {
        taskType: TaskType.Progress,
        target: 10,
        allowPartial: true,
        unit: "reps",
      },
    },
    {
      id: "fine-motor-drill",
      title: "Fine Motor Drill",
      description: "Enhance hand-eye coordination and dexterity.",
      icon: "auto_awesome_motion",
      type: TaskType.Quiz,
      frequency: TaskFrequency.Weekly,
      visibility: TaskVisibility.VisibleToPatients,
      roles: ["therapist"],
      isPublished: true,
      createdAt: now,
      updatedAt: now,
      config: {
        taskType: TaskType.Quiz,
        singleChoice: true,
        explanation: "Select the correct coordination exercise.",
        options: [
          { label: "Bean bag toss", isCorrect: true },
          { label: "Strength squats", isCorrect: false }
        ],
      },
    },
    {
      id: "breathing-coaching",
      title: "Breathing Coaching",
      description: "Guided breathing exercises to reduce stress and improve focus.",
      icon: "favorite_rounded",
      type: TaskType.Timer,
      frequency: TaskFrequency.Daily,
      visibility: TaskVisibility.VisibleToPatients,
      roles: ["therapist"],
      isPublished: true,
      createdAt: now,
      updatedAt: now,
      config: {
        taskType: TaskType.Timer,
        seconds: 600,
        allowPause: false,
      },
    },
  ]);
  console.log("✔️ Task templates seeded");

  await seedProgramTemplates([
    {
      id: "post-op-rehab",
      title: "Post-Op Rehab Phase 1",
      subtitle: "Stabilisation & confidence",
      description: "A gentle routine to rebuild balance and breathing control after surgery.",
      type: ProgramType.Sequential,
      taskIds: ["balance-training", "breathing-coaching"],
      therapistTypes: ["physiotherapie"],
      icon: "run_circle_rounded",
      color: "#1F6FEB",
      ownerId: "",
      roles: ["therapist"],
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "neuro-flex",
      title: "Neuro-Flex Routine",
      subtitle: "Cognition and dexterity",
      description: "Cognitive and fine-motor stimulation routine for neurological patients.",
      type: ProgramType.AdaptiveNormal,
      taskIds: ["fine-motor-drill", "breathing-coaching"],
      therapistTypes: ["ergotherapie", "psychotherapie"],
      icon: "psychology_rounded",
      color: "#10B981",
      ownerId: "",
      roles: ["therapist"],
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log("✔️ Program templates seeded");

  console.log("\n✅ Seeding complete. You can now use the demo data in HabitDesk.");
}

run().catch((error) => {
  console.error("❌ Seed process failed:", error);
  process.exitCode = 1;
});
