import "dotenv/config";

import { createRequire } from "module";
import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import type {
  ProgramTemplate,
  TaskTemplate,
} from "../src/modules/shared/types/domain";
import {
  ProgramType,
  TaskFrequency,
  TaskType,
  TaskVisibility,
  TemplateScope,
} from "../src/modules/shared/types/domain";

const require = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "serviceAccountKey.json");

const rawServiceAccount = await readFile(serviceAccountPath, "utf8");
const serviceAccount = JSON.parse(rawServiceAccount);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const toId = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

async function seedTherapistTypes(names: string[]) {
  if (!names.length) return;

  const batch = db.batch();

  names.forEach((name) => {
    const entry = { id: toId(name), name };
    const ref = db.collection("therapist_types").doc(entry.id);
    batch.set(ref, entry, { merge: true });
  });

  await batch.commit();
}

async function seedTaskTemplates(templates: TaskTemplate[]) {
  if (!templates.length) return;

  const batch = db.batch();

  templates.forEach((template) => {
    const { id, ...rest } = template;
    const docId = id ?? toId(template.title);
    const ref = db.collection("task_templates").doc(docId);
    batch.set(ref, rest, { merge: true });
  });

  await batch.commit();
}

async function seedProgramTemplates(templates: ProgramTemplate[]) {
  if (!templates.length) return;

  const batch = db.batch();

  templates.forEach((template) => {
    const { id, ...rest } = template;
    const docId = id ?? toId(template.title);
    const ref = db.collection("program_templates").doc(docId);
    batch.set(ref, rest, { merge: true });
  });

  await batch.commit();
}

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
      scope: TemplateScope.TherapistType,
      therapistTypes: ["physiotherapie"],
      ownerId: "",
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
      scope: TemplateScope.TherapistType,
      therapistTypes: ["ergotherapie", "psychotherapie"],
      ownerId: "",
      isPublished: true,
      createdAt: now,
      updatedAt: now,
      config: {
        taskType: TaskType.Quiz,
        singleChoice: true,
        explanation: "Select the correct coordination exercise.",
        options: [
          { label: "Bean bag toss", isCorrect: true },
          { label: "Strength squats", isCorrect: false },
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
      scope: TemplateScope.Global,
      therapistTypes: [],
      ownerId: "",
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
      scope: TemplateScope.TherapistType,
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
      scope: TemplateScope.TherapistType,
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
