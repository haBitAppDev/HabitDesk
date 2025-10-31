import "dotenv/config";

import { createRequire } from "module";
import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import type {
  ProgramTemplate,
  TaskTemplate,
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



async function run() {
  console.log("🚀 Starting HabitDesk seed script...\n");
  const taskPayload = JSON.parse(
    await readFile(join(__dirname, "..", "public", "task-library", "tasks.json"), "utf8"),
  );

  await seedTherapistTypes([
    "Ergotherapie",
    "Logotherapie",
    "Physiotherapie",
    "Psychotherapie",
  ]);

  await seedTaskTemplates(taskPayload.tasks);
}
run().catch((error) => {
  console.error("❌ Seed process failed:", error);
  process.exitCode = 1;
});
