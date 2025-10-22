import { doc, writeBatch } from "firebase/firestore";

import { db } from "../../../firebase";
import type {
  ProgramTemplate,
  TaskTemplate,
  TherapistType,
} from "../types/domain";

const toId = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

export async function seedTherapistTypes(names: string[]) {
  if (!names.length) return;

  const batch = writeBatch(db);

  names.forEach((name) => {
    const entry: TherapistType = { id: toId(name), name };
    const ref = doc(db, "therapist_types", entry.id);
    batch.set(ref, entry);
  });

  await batch.commit();
}

export async function seedTaskTemplates(templates: TaskTemplate[]) {
  if (!templates.length) return;

  const batch = writeBatch(db);

  templates.forEach((template) => {
    const ref = doc(db, "task_templates", template.id || toId(template.name));
    batch.set(ref, { ...template, id: undefined });
  });

  await batch.commit();
}

export async function seedProgramTemplates(templates: ProgramTemplate[]) {
  if (!templates.length) return;

  const batch = writeBatch(db);

  templates.forEach((template) => {
    const ref = doc(db, "program_templates", template.id || toId(template.name));
    batch.set(ref, { ...template, id: undefined });
  });

  await batch.commit();
}
