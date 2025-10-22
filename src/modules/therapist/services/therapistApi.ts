import {
  addDoc,
  deleteDoc,
  getCollection,
  queryBy,
  updateDoc,
} from "../../shared/services/firestore";
import type {
  ProgramInstance,
  ProgramTemplate,
  TaskTemplate,
  TherapistType,
} from "../../shared/types/domain";

export async function listTaskTemplates() {
  return getCollection<TaskTemplate>("task_templates");
}

export async function listProgramTemplates() {
  return getCollection<ProgramTemplate>("program_templates");
}

export interface CreateProgramInstanceInput
  extends Omit<ProgramInstance, "id"> {
  title?: string;
  authorId: string;
}

export async function createProgramInstance(payload: CreateProgramInstanceInput) {
  const { authorId, ...rest } = payload;

  const id = await addDoc<
    Omit<ProgramInstance, "id"> & {
      authorId: string;
      title?: string;
      createdAt: number;
    }
  >("programs", {
    ...rest,
    authorId,
    createdAt: Date.now(),
  });

  return id;
}

export async function listProgramsByTherapist(therapistId: string) {
  return queryBy<ProgramInstance & { authorId: string }>("programs", [[
    "therapistId",
    "==",
    therapistId,
  ]]);
}

export async function listTherapistTypes() {
  return getCollection<TherapistType>("therapist_types");
}

export async function createTaskTemplate(data: Omit<TaskTemplate, "id">) {
  const id = await addDoc<Omit<TaskTemplate, "id">>("task_templates", data);
  return id;
}

export async function updateTaskTemplate(id: string, data: Partial<TaskTemplate>) {
  await updateDoc<TaskTemplate>("task_templates", id, data);
}

export async function removeTaskTemplate(id: string) {
  await deleteDoc("task_templates", id);
}

export async function createProgramTemplate(data: Omit<ProgramTemplate, "id">) {
  const id = await addDoc<Omit<ProgramTemplate, "id">>("program_templates", data);
  return id;
}

export async function updateProgramTemplate(
  id: string,
  data: Partial<ProgramTemplate>
) {
  await updateDoc<ProgramTemplate>("program_templates", id, data);
}

export async function removeProgramTemplate(id: string) {
  await deleteDoc("program_templates", id);
}
