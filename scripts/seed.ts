import "dotenv/config";

import {
  seedProgramTemplates,
  seedTaskTemplates,
  seedTherapistTypes,
} from "../src/modules/shared/services/seed";

async function run() {
  console.log("🚀 Starting HabitDesk seed script...\n");

  await seedTherapistTypes(["Physiotherapie", "Ergotherapie", "Psychotherapie"]);
  console.log("✔️ Therapist types seeded");

  await seedTaskTemplates([
    {
      id: "balance-training",
      name: "Balance Training",
      description: "Improve patient balance with progressive stability exercises.",
      tags: ["balance", "mobility"],
      inputs: {
        durationMinutes: 20,
        equipment: ["balance board", "foam pad"],
      },
    },
    {
      id: "fine-motor-drill",
      name: "Fine Motor Drill",
      description: "Enhance hand-eye coordination and dexterity.",
      tags: ["motor skills", "upper body"],
      inputs: {
        repetitions: 15,
        tools: ["therapy putty", "peg board"],
      },
    },
    {
      id: "breathing-coaching",
      name: "Breathing Coaching",
      description: "Guided breathing exercises to reduce stress and improve focus.",
      tags: ["mindfulness", "respiration"],
      inputs: {
        durationMinutes: 10,
        tempo: "4-7-8",
      },
    },
  ]);
  console.log("✔️ Task templates seeded");

  await seedProgramTemplates([
    {
      id: "post-op-rehab",
      name: "Post-Op Rehab Phase 1",
      therapistTypes: ["physiotherapie"],
      taskTemplateIds: ["balance-training", "breathing-coaching"],
    },
    {
      id: "neuro-flex",
      name: "Neuro-Flex Routine",
      therapistTypes: ["ergotherapie", "psychotherapie"],
      taskTemplateIds: ["fine-motor-drill", "breathing-coaching"],
    },
  ]);
  console.log("✔️ Program templates seeded");

  console.log("\n✅ Seeding complete. You can now use the demo data in HabitDesk.");
}

run().catch((error) => {
  console.error("❌ Seed process failed:", error);
  process.exitCode = 1;
});
