import { arrayRemove, arrayUnion } from "firebase/firestore";

import {
  addDoc,
  deleteDoc,
  getCollection,
  getDoc,
  queryBy,
  updateDoc,
} from "../../shared/services/firestore";
import type {
  Program,
  ProgramAssignment,
  ProgramTemplate,
  Task,
  TaskConfig,
  TaskTemplate,
  TherapistType,
} from "../../shared/types/domain";
import { Patient } from "../../shared/types/domain";
import {
  MediaKind,
  ProgramType,
  TaskType,
  TaskVisibility,
  TemplateScope,
  programTypeToCadence,
} from "../../shared/types/domain";

type FirestoreValue = unknown;
type FirestoreDocument = Record<string, FirestoreValue> & { id: string };

const DEFAULT_TASK_ICON = "assignment";

const timestampToIso = (value: FirestoreValue): string | undefined => {
  if (!value) return undefined;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds: number }).seconds === "number"
  ) {
    const seconds =
      (value as { seconds: number; nanoseconds?: number }).seconds * 1000;
    const nanos =
      ((value as { nanoseconds?: number }).nanoseconds ?? 0) / 1_000_000;
    return new Date(seconds + nanos).toISOString();
  }

  return undefined;
};

const isoToDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const coerceStringArray = (value: FirestoreValue): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const parseNumber = (
  value: FirestoreValue,
  fallback = 0
): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const parseOptionalNumber = (value: FirestoreValue): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const parseTaskConfig = (
  type: TaskType,
  raw: FirestoreValue
): TaskConfig | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const config = raw as Record<string, FirestoreValue>;

  switch (type) {
    case TaskType.Timer:
      return {
        taskType: TaskType.Timer,
        seconds: parseNumber(config.seconds, 0),
        allowPause: Boolean(config.allowPause),
      };
    case TaskType.TextInput:
      return {
        taskType: TaskType.TextInput,
        minLength: parseNumber(config.minLength, 0),
        maxLength: parseNumber(config.maxLength, 500),
        showHistory: Boolean(config.showHistory),
      };
    case TaskType.Quiz: {
      const optionsRaw = Array.isArray(config.options)
        ? (config.options as FirestoreValue[])
        : [];
      return {
        taskType: TaskType.Quiz,
        singleChoice: Boolean(config.singleChoice ?? true),
        options: optionsRaw.map((entry) => {
          const option = entry as Record<string, FirestoreValue>;
          return {
            label: typeof option.label === "string" ? option.label : "",
            isCorrect: Boolean(option.isCorrect),
          };
        }),
        explanation:
          typeof config.explanation === "string"
            ? config.explanation
            : undefined,
      };
    }
    case TaskType.Progress:
      return {
        taskType: TaskType.Progress,
        target: parseNumber(config.target, 0) ?? 0,
        allowPartial: Boolean(config.allowPartial),
        unit: typeof config.unit === "string" ? config.unit : "",
      };
    case TaskType.Media: {
      const kindValue =
        typeof config.kind === "string" &&
        (Object.values(MediaKind) as string[]).includes(config.kind as string)
          ? (config.kind as MediaKind)
          : MediaKind.Audio;
      return {
        taskType: TaskType.Media,
        mediaUrl: typeof config.mediaUrl === "string" ? config.mediaUrl : "",
        kind: kindValue,
        fileName:
          typeof config.fileName === "string" ? config.fileName : undefined,
        fileSize: parseOptionalNumber(config.fileSize),
        storagePath:
          typeof config.storagePath === "string"
            ? config.storagePath
            : undefined,
        contentType:
          typeof config.contentType === "string"
            ? config.contentType
            : undefined,
      };
    }
    case TaskType.Goal:
      return {
        taskType: TaskType.Goal,
        goalDescription:
          typeof config.goalDescription === "string"
            ? config.goalDescription
            : "",
        dueDate: timestampToIso(config.dueDate),
      };
    case TaskType.Scale:
      return {
        taskType: TaskType.Scale,
        min: parseNumber(config.min, 0) ?? 0,
        max: parseNumber(config.max, 10) ?? 10,
        step: parseNumber(config.step, 1) ?? 1,
        leftLabel:
          typeof config.leftLabel === "string" ? config.leftLabel : undefined,
        rightLabel:
          typeof config.rightLabel === "string"
            ? config.rightLabel
            : undefined,
      };
    case TaskType.StateLog:
      return {
        taskType: TaskType.StateLog,
        emojiKeys: coerceStringArray(config.emojiKeys),
        showChart: Boolean(config.showChart),
      };
    default:
      return undefined;
  }
};

const parseTaskTemplate = (raw: FirestoreDocument): TaskTemplate => {
  const type = (raw.type ?? raw.taskType ?? TaskType.Timer) as TaskType;
  const therapistTypes = coerceStringArray(raw.therapistTypes);
  const scopeValue =
    typeof raw.scope === "string" &&
    (Object.values(TemplateScope) as string[]).includes(raw.scope as string)
      ? (raw.scope as TemplateScope)
      : therapistTypes.length > 0
      ? TemplateScope.TherapistType
      : TemplateScope.Global;
  return {
    id: raw.id,
    title:
      typeof raw.title === "string"
        ? raw.title
        : typeof raw.name === "string"
        ? raw.name
        : "",
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    type,
    icon:
      typeof raw.icon === "string"
        ? raw.icon
        : typeof raw.iconKey === "string"
        ? raw.iconKey
        : DEFAULT_TASK_ICON,
    visibility:
      (raw.visibility as TaskVisibility) ??
      TaskVisibility.VisibleToPatients,
    config: parseTaskConfig(type, raw.config),
    roles: coerceStringArray(raw.roles),
    therapistTypes,
    scope: scopeValue,
    ownerId:
      typeof raw.ownerId === "string"
        ? raw.ownerId
        : typeof raw.createdBy === "string"
        ? raw.createdBy
        : undefined,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
    isPublished:
      typeof raw.isPublished === "boolean" ? raw.isPublished : true,
  };
};

const sanitizeForFirestore = (input: unknown): unknown => {
  if (input === undefined) return undefined;
  if (Array.isArray(input)) {
    return input
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined);
  }
  if (input && typeof input === "object") {
    if (input instanceof Date) {
      return input;
    }
    const sanitized: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      const cleaned = sanitizeForFirestore(value);
      if (cleaned !== undefined) {
        sanitized[key] = cleaned;
      }
    });
    return sanitized;
  }
  return input;
};

const serializeTaskConfig = (
  config?: TaskConfig
): Record<string, unknown> | undefined => {
  if (!config) return undefined;
  return sanitizeForFirestore({ ...config }) as Record<string, unknown>;
};

const taskTemplateToFirestore = (
  template: Omit<TaskTemplate, "id">
): Record<string, unknown> => {
  const now = new Date();
  return {
    title: template.title,
    description: template.description ?? null,
    type: template.type,
    icon: template.icon ?? DEFAULT_TASK_ICON,
    visibility: template.visibility,
    config: serializeTaskConfig(template.config),
    roles: template.roles,
    therapistTypes: template.therapistTypes,
    scope: template.scope,
    ownerId: template.ownerId ?? null,
    createdAt: isoToDate(template.createdAt) ?? now,
    updatedAt: isoToDate(template.updatedAt) ?? now,
    isPublished: template.isPublished,
  };
};

const parseProgramTemplate = (raw: FirestoreDocument): ProgramTemplate => {
  return {
    id: raw.id,
    title:
      typeof raw.title === "string"
        ? raw.title
        : typeof raw.name === "string"
        ? raw.name
        : "",
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
    description:
      typeof raw.description === "string" ? raw.description : "",
    type:
      (raw.type as ProgramType) ?? ProgramType.AdaptiveNormal,
    taskIds: coerceStringArray(raw.taskIds),
    assignedUserIds: coerceStringArray(raw.assignedUserIds),
    therapistTypes: coerceStringArray(raw.therapistTypes),
    icon:
      typeof raw.icon === "string" ? raw.icon : DEFAULT_TASK_ICON,
    color: typeof raw.color === "string" ? raw.color : "#1F6FEB",
    ownerId:
      typeof raw.ownerId === "string" ? raw.ownerId : "",
    roles: coerceStringArray(raw.roles),
    scope:
      typeof raw.scope === "string" &&
      (Object.values(TemplateScope) as string[]).includes(raw.scope as string)
        ? (raw.scope as TemplateScope)
        : coerceStringArray(raw.therapistTypes).length > 0
        ? TemplateScope.TherapistType
        : TemplateScope.Global,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
    isPublished:
      typeof raw.isPublished === "boolean" ? raw.isPublished : true,
  };
};

const parsePatient = (raw: FirestoreDocument): Patient =>
  Patient.fromFirestore(raw);

const programTemplateToFirestore = (
  template: Omit<ProgramTemplate, "id">
): Record<string, unknown> => {
  const now = new Date();
  return {
    title: template.title,
    subtitle: template.subtitle,
    description: template.description,
    type: template.type,
    frequency: programTypeToCadence(template.type),
    taskIds: template.taskIds,
    assignedUserIds: template.assignedUserIds ?? [],
    therapistTypes: template.therapistTypes ?? [],
    icon: template.icon,
    color: template.color,
    ownerId: template.ownerId,
    roles: template.roles,
    scope: template.scope,
    createdAt: isoToDate(template.createdAt) ?? now,
    updatedAt: isoToDate(template.updatedAt) ?? now,
    isPublished: template.isPublished,
  };
};

const parseTask = (raw: FirestoreDocument): Task => {
  const type = (raw.type ?? raw.taskType ?? TaskType.Timer) as TaskType;
  return {
    id: raw.id,
    title:
      typeof raw.title === "string"
        ? raw.title
        : typeof raw.name === "string"
        ? raw.name
        : "",
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    type,
    icon:
      typeof raw.icon === "string"
        ? raw.icon
        : typeof raw.iconKey === "string"
        ? raw.iconKey
        : DEFAULT_TASK_ICON,
    visibility:
      (raw.visibility as TaskVisibility) ??
      TaskVisibility.VisibleToPatients,
    config: parseTaskConfig(type, raw.config),
    ownerId:
      typeof raw.ownerId === "string" && raw.ownerId.length > 0
        ? raw.ownerId
        : undefined,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
    roles: coerceStringArray(raw.roles),
    isPublished:
      typeof raw.isPublished === "boolean" ? raw.isPublished : true,
    isTemplate: Boolean(raw.isTemplate),
  };
};

const taskToFirestore = (
  task: Task,
  {
    setCreatedAt,
    timestamp,
  }: { setCreatedAt?: boolean; timestamp?: Date } = {}
): Record<string, unknown> => {
  const now = timestamp ?? new Date();
  const payload: Record<string, unknown> = {
    title: task.title,
    description: task.description ?? null,
    type: task.type,
    icon: task.icon ?? DEFAULT_TASK_ICON,
    visibility: task.visibility,
    config: serializeTaskConfig(task.config),
    ownerId: task.ownerId ?? null,
    isTemplate: task.isTemplate,
    roles: task.roles,
    isPublished: task.isPublished,
  };

  if (setCreatedAt) {
    payload.createdAt = isoToDate(task.createdAt) ?? now;
  } else if (task.createdAt) {
    const created = isoToDate(task.createdAt);
    if (created) {
      payload.createdAt = created;
    }
  }

  payload.updatedAt = isoToDate(task.updatedAt) ?? now;

  return payload;
};

const parseProgram = (raw: FirestoreDocument): Program => {
  const therapistTypes = coerceStringArray(raw.therapistTypes);
  const scopeValue =
    typeof raw.scope === "string" &&
    (Object.values(TemplateScope) as string[]).includes(raw.scope as string)
      ? (raw.scope as TemplateScope)
      : therapistTypes.length > 0
      ? TemplateScope.TherapistType
      : TemplateScope.Global;
  const resolvedTasks: Task[] = Array.isArray(raw.tasks)
    ? (raw.tasks as FirestoreDocument[])
        .map((entry) => ({
          ...entry,
          id: typeof entry.id === "string" ? entry.id : "",
        }))
        .map(parseTask)
    : [];
  return {
    id: raw.id,
    title:
      typeof raw.title === "string"
        ? raw.title
        : typeof raw.name === "string"
        ? raw.name
        : "",
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
    description:
      typeof raw.description === "string" ? raw.description : "",
    type:
      (raw.type as ProgramType) ?? ProgramType.AdaptiveNormal,
    taskIds: coerceStringArray(raw.taskIds),
    tasks: resolvedTasks.length > 0 ? resolvedTasks : undefined,
    assignedUserIds: coerceStringArray(raw.assignedUserIds),
    therapistTypes,
    icon:
      typeof raw.icon === "string" ? raw.icon : DEFAULT_TASK_ICON,
    color: typeof raw.color === "string" ? raw.color : "#1F6FEB",
    ownerId:
      typeof raw.ownerId === "string" ? raw.ownerId : "",
    roles: coerceStringArray(raw.roles),
    scope: scopeValue,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
    startDate: timestampToIso(raw.startDate),
    endDate: timestampToIso(raw.endDate),
    currentStreak: parseOptionalNumber(raw.currentStreak),
    bestStreak: parseOptionalNumber(raw.bestStreak),
    streakUpdatedAt: timestampToIso(raw.streakUpdatedAt),
    isPublished:
      typeof raw.isPublished === "boolean" ? raw.isPublished : true,
  };
};

const programToFirestore = (
  program: Program,
  {
    setCreatedAt,
    timestamp,
  }: { setCreatedAt?: boolean; timestamp?: Date } = {}
): Record<string, unknown> => {
  const now = timestamp ?? new Date();
  const payload: Record<string, unknown> = {
    title: program.title,
    subtitle: program.subtitle,
    description: program.description,
    type: program.type,
    frequency: programTypeToCadence(program.type),
    taskIds: program.taskIds,
    icon: program.icon,
    color: program.color,
    ownerId: program.ownerId,
    roles: program.roles,
    scope: program.scope,
    therapistTypes: program.therapistTypes,
    assignedUserIds: program.assignedUserIds ?? [],
    isPublished: program.isPublished,
  };

  if (setCreatedAt) {
    payload.createdAt = isoToDate(program.createdAt) ?? now;
  } else if (program.createdAt) {
    const created = isoToDate(program.createdAt);
    if (created) {
      payload.createdAt = created;
    }
  }

  payload.updatedAt = isoToDate(program.updatedAt) ?? now;

  if (program.startDate) {
    const start = isoToDate(program.startDate);
    if (start) {
      payload.startDate = start;
    }
  }

  if (program.endDate) {
    const end = isoToDate(program.endDate);
    if (end) {
      payload.endDate = end;
    }
  }

  if (typeof program.currentStreak === "number") {
    payload.currentStreak = program.currentStreak;
  }

  if (typeof program.bestStreak === "number") {
    payload.bestStreak = program.bestStreak;
  }

  if (program.streakUpdatedAt) {
    const streak = isoToDate(program.streakUpdatedAt);
    if (streak) {
      payload.streakUpdatedAt = streak;
    }
  }

  return payload;
};

const parseProgramAssignment = (
  raw: FirestoreDocument
): ProgramAssignment => ({
  id: raw.id,
  programId:
    typeof raw.programId === "string" ? raw.programId : "",
  userId:
    typeof raw.userId === "string" ? raw.userId : "",
  assignedAt:
    timestampToIso(raw.assignedAt) ?? new Date().toISOString(),
  completedAt: timestampToIso(raw.completedAt),
  isActive:
    typeof raw.isActive === "boolean" ? raw.isActive : true,
  progress:
    typeof raw.progress === "number"
      ? raw.progress
      : parseNumber(raw.progress, 0),
  currentTaskIndex: parseNumber(raw.currentTaskIndex, 0),
  unlockedTaskIds: coerceStringArray(raw.unlockedTaskIds),
  streakCount: parseNumber(raw.streakCount, 0),
  bestStreak: parseNumber(raw.bestStreak, 0),
  lastCompletionDate: timestampToIso(raw.lastCompletionDate),
});

const programAssignmentToFirestore = (
  assignment: ProgramAssignment,
  {
    timestamp,
  }: { timestamp?: Date } = {}
): Record<string, unknown> => {
  const now = timestamp ?? new Date();
  return {
    programId: assignment.programId,
    userId: assignment.userId,
    assignedAt: isoToDate(assignment.assignedAt) ?? now,
    completedAt: isoToDate(assignment.completedAt) ?? null,
    isActive: assignment.isActive,
    progress: assignment.progress,
    currentTaskIndex: assignment.currentTaskIndex,
    unlockedTaskIds: assignment.unlockedTaskIds,
    streakCount: assignment.streakCount,
    bestStreak: assignment.bestStreak,
    lastCompletionDate:
      isoToDate(assignment.lastCompletionDate) ?? null,
  };
};

export async function listTaskTemplates(): Promise<TaskTemplate[]> {
  const raw = await getCollection<FirestoreDocument>("task_templates");
  return raw.map(parseTaskTemplate);
}

export async function getTaskTemplate(id: string): Promise<TaskTemplate | null> {
  const doc = await getDoc<FirestoreDocument>("task_templates", id);
  return doc ? parseTaskTemplate(doc) : null;
}

export async function listProgramTemplates(): Promise<ProgramTemplate[]> {
  const raw = await getCollection<FirestoreDocument>("program_templates");
  return raw.map(parseProgramTemplate);
}

export async function listPatientsByTherapist(
  therapistId: string
): Promise<Patient[]> {
  if (!therapistId) return [];
  const raw = await queryBy<FirestoreDocument>("Patient", [
    ["therapistId", "==", therapistId],
  ]);
  return raw.map(parsePatient);
}

export async function getPatient(id: string): Promise<Patient | null> {
  if (!id) return null;
  const doc = await getDoc<FirestoreDocument>("Patient", id);
  return doc ? parsePatient(doc) : null;
}

export async function listTasksByOwner(ownerId: string): Promise<Task[]> {
  if (!ownerId) return [];
  const raw = await queryBy<FirestoreDocument>("tasks", [
    ["ownerId", "==", ownerId],
  ]);
  return raw.map(parseTask);
}

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<Task> {
  const now = new Date();
  const record: Task = {
    ...data,
    id: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const payload = taskToFirestore(record, {
    setCreatedAt: true,
    timestamp: now,
  });
  const id = await addDoc("tasks", payload);
  const created = await getDoc<FirestoreDocument>("tasks", id);
  return created ? parseTask(created) : { ...record, id };
}

export async function updateTask(
  id: string,
  changes: Partial<Task>
): Promise<Task | null> {
  const existingDoc = await getDoc<FirestoreDocument>("tasks", id);
  if (!existingDoc) {
    return null;
  }
  const existing = parseTask(existingDoc);
  const now = new Date();
  const merged: Task = {
    ...existing,
    ...changes,
    id,
    updatedAt: now.toISOString(),
  };
  const payload = taskToFirestore(merged, { timestamp: now });
  await updateDoc("tasks", id, payload);
  const updatedDoc = await getDoc<FirestoreDocument>("tasks", id);
  return updatedDoc ? parseTask(updatedDoc) : merged;
}

export async function removeTask(id: string): Promise<void> {
  await deleteDoc("tasks", id);
}

export async function listProgramsByOwner(ownerId: string): Promise<Program[]> {
  if (!ownerId) return [];
  const raw = await queryBy<FirestoreDocument>("programs", [
    ["ownerId", "==", ownerId],
  ]);
  return raw.map(parseProgram);
}

export async function getProgram(id: string): Promise<Program | null> {
  const doc = await getDoc<FirestoreDocument>("programs", id);
  return doc ? parseProgram(doc) : null;
}

export async function createProgram(
  data: Omit<Program, "id" | "createdAt" | "updatedAt">
): Promise<Program> {
  const now = new Date();
  const record: Program = {
    ...data,
    id: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const payload = programToFirestore(record, {
    setCreatedAt: true,
    timestamp: now,
  });
  const id = await addDoc("programs", payload);
  const created = await getDoc<FirestoreDocument>("programs", id);
  return created ? parseProgram(created) : { ...record, id };
}

export async function updateProgram(
  id: string,
  changes: Partial<Program>
): Promise<Program | null> {
  const existingDoc = await getDoc<FirestoreDocument>("programs", id);
  if (!existingDoc) {
    return null;
  }
  const existing = parseProgram(existingDoc);
  const now = new Date();
  const merged: Program = {
    ...existing,
    ...changes,
    id,
    updatedAt: now.toISOString(),
  };
  const payload = programToFirestore(merged, { timestamp: now });
  await updateDoc("programs", id, payload);
  const updatedDoc = await getDoc<FirestoreDocument>("programs", id);
  return updatedDoc ? parseProgram(updatedDoc) : merged;
}

export async function removeProgram(id: string): Promise<void> {
  await deleteDoc("programs", id);
}

export interface AssignProgramInput {
  programId: string;
  userId: string;
  assignedAt?: string;
  isActive?: boolean;
}

export async function assignProgramToUser(
  input: AssignProgramInput
): Promise<ProgramAssignment> {
  const now = new Date();
  const assignment: ProgramAssignment = {
    id: "",
    programId: input.programId,
    userId: input.userId,
    assignedAt: input.assignedAt ?? now.toISOString(),
    completedAt: undefined,
    isActive: input.isActive ?? true,
    progress: 0,
    currentTaskIndex: 0,
    unlockedTaskIds: [],
    streakCount: 0,
    bestStreak: 0,
    lastCompletionDate: undefined,
  };
  const payload = programAssignmentToFirestore(assignment, {
    timestamp: now,
  });
  const id = await addDoc("program_assignments", payload);
  const created = await getDoc<FirestoreDocument>(
    "program_assignments",
    id
  );
  await updateDoc("programs", input.programId, {
    assignedUserIds: arrayUnion(input.userId),
  }).catch(() => undefined);
  return created ? parseProgramAssignment(created) : { ...assignment, id };
}

export async function updateProgramAssignment(
  id: string,
  changes: Partial<ProgramAssignment>
): Promise<ProgramAssignment | null> {
  const existingDoc = await getDoc<FirestoreDocument>(
    "program_assignments",
    id
  );
  if (!existingDoc) {
    return null;
  }
  const existing = parseProgramAssignment(existingDoc);
  const now = new Date();
  const merged: ProgramAssignment = {
    ...existing,
    ...changes,
    id,
    assignedAt: changes.assignedAt ?? existing.assignedAt,
  };
  const payload = programAssignmentToFirestore(merged, { timestamp: now });
  await updateDoc("program_assignments", id, payload);
  const updatedDoc = await getDoc<FirestoreDocument>(
    "program_assignments",
    id
  );
  return updatedDoc ? parseProgramAssignment(updatedDoc) : merged;
}

export async function removeProgramAssignment(id: string): Promise<void> {
  const existing = await getDoc<FirestoreDocument>(
    "program_assignments",
    id
  );
  await deleteDoc("program_assignments", id);
  if (existing) {
    const programId = typeof existing.programId === "string" ? existing.programId : undefined;
    const userId = typeof existing.userId === "string" ? existing.userId : undefined;
    if (programId && userId) {
      await updateDoc("programs", programId, {
        assignedUserIds: arrayRemove(userId),
      }).catch(() => undefined);
    }
  }
}

export async function listAssignmentsByUser(
  userId: string
): Promise<ProgramAssignment[]> {
  if (!userId) return [];
  const raw = await queryBy<FirestoreDocument>("program_assignments", [
    ["userId", "==", userId],
  ]);
  return raw.map(parseProgramAssignment);
}

export async function listAssignmentsForProgram(
  programId: string
): Promise<ProgramAssignment[]> {
  if (!programId) return [];
  const raw = await queryBy<FirestoreDocument>("program_assignments", [
    ["programId", "==", programId],
  ]);
  return raw.map(parseProgramAssignment);
}

export async function listTherapistTypes() {
  return getCollection<TherapistType>("therapist_types");
}

export async function createTaskTemplate(data: Omit<TaskTemplate, "id">) {
  const payload = taskTemplateToFirestore(data);
  const id = await addDoc("task_templates", payload);
  return id;
}

export async function updateTaskTemplate(
  id: string,
  data: Partial<TaskTemplate>
) {
  const existing = await getTaskTemplate(id);
  if (!existing) return;

  const merged: TaskTemplate = {
    ...existing,
    ...data,
    config: data.config ?? existing.config,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc("task_templates", id, taskTemplateToFirestore(merged));
}

export async function removeTaskTemplate(id: string) {
  await deleteDoc("task_templates", id);
}

export async function createProgramTemplate(data: Omit<ProgramTemplate, "id">) {
  const payload = programTemplateToFirestore(data);
  const id = await addDoc("program_templates", payload);
  return id;
}

export async function updateProgramTemplate(
  id: string,
  data: Partial<ProgramTemplate>
) {
  const existing = await getDoc<FirestoreDocument>("program_templates", id);
  if (!existing) return;

  const merged: ProgramTemplate = {
    ...parseProgramTemplate(existing),
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc("program_templates", id, programTemplateToFirestore(merged));
}

export async function removeProgramTemplate(id: string) {
  await deleteDoc("program_templates", id);
}
