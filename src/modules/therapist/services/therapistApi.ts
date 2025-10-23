import {
  addDoc,
  deleteDoc,
  getCollection,
  getDoc,
  queryBy,
  updateDoc,
} from "../../shared/services/firestore";
import type {
  ProgramInstance,
  ProgramInstanceTask,
  ProgramTemplate,
  TaskConfig,
  TaskTemplate,
  TherapistType,
} from "../../shared/types/domain";
import {
  MediaKind,
  ProgramType,
  TaskFrequency,
  TaskType,
  TaskVisibility,
  TemplateScope,
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
        exampleResponse:
          typeof config.exampleResponse === "string"
            ? config.exampleResponse
            : undefined,
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
    frequency:
      (raw.frequency as TaskFrequency) ?? TaskFrequency.Daily,
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

const serializeTaskConfig = (config?: TaskConfig) => {
  if (!config) return undefined;
  return { ...config };
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
    frequency: template.frequency,
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

const parseProgramTasks = (
  raw: FirestoreValue
): ProgramInstanceTask[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => entry as FirestoreDocument)
    .map((entry) => ({
      taskTemplateId:
        typeof entry.taskTemplateId === "string" ? entry.taskTemplateId : "",
      config: entry.config
        ? parseTaskConfig(
            (entry.config as { taskType?: TaskType }).taskType ??
              TaskType.Timer,
            entry.config
          )
        : undefined,
    }));
};

const parseProgramTemplate = (raw: FirestoreDocument): ProgramTemplate => ({
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
});

const programTemplateToFirestore = (
  template: Omit<ProgramTemplate, "id">
): Record<string, unknown> => {
  const now = new Date();
  return {
    title: template.title,
    subtitle: template.subtitle,
    description: template.description,
    type: template.type,
    taskIds: template.taskIds,
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

const parseProgramInstance = (
  raw: FirestoreDocument
): ProgramInstance => ({
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
  patientId:
    typeof raw.patientId === "string" ? raw.patientId : "",
  therapistId:
    typeof raw.therapistId === "string" ? raw.therapistId : "",
  ownerId:
    typeof raw.ownerId === "string" ? raw.ownerId : "",
  templateId:
    typeof raw.templateId === "string" ? raw.templateId : undefined,
  tasks: parseProgramTasks(raw.tasks),
  taskIds: coerceStringArray(raw.taskIds),
  icon:
    typeof raw.icon === "string" ? raw.icon : DEFAULT_TASK_ICON,
  color: typeof raw.color === "string" ? raw.color : "#1F6FEB",
  roles: coerceStringArray(raw.roles),
  scope:
    typeof raw.scope === "string" &&
    (Object.values(TemplateScope) as string[]).includes(raw.scope as string)
      ? (raw.scope as TemplateScope)
      : undefined,
  createdAt: timestampToIso(raw.createdAt),
  updatedAt: timestampToIso(raw.updatedAt),
  startDate: timestampToIso(raw.startDate),
  endDate: timestampToIso(raw.endDate),
  currentStreak: parseOptionalNumber(raw.currentStreak),
  bestStreak: parseOptionalNumber(raw.bestStreak),
  streakUpdatedAt: timestampToIso(raw.streakUpdatedAt),
  isPublished:
    typeof raw.isPublished === "boolean" ? raw.isPublished : true,
});

const programInstanceToFirestore = (
  instance: Omit<ProgramInstance, "id">
): Record<string, unknown> => {
  const now = new Date();
  return {
    title: instance.title,
    subtitle: instance.subtitle,
    description: instance.description,
    type: instance.type,
    patientId: instance.patientId,
    therapistId: instance.therapistId,
    ownerId: instance.ownerId,
    templateId: instance.templateId ?? null,
    tasks: instance.tasks.map((task) => ({
      taskTemplateId: task.taskTemplateId,
      config: serializeTaskConfig(task.config),
    })),
    taskIds: instance.taskIds,
    icon: instance.icon,
    color: instance.color,
    roles: instance.roles,
    scope: instance.scope ?? null,
    createdAt: isoToDate(instance.createdAt) ?? now,
    updatedAt: isoToDate(instance.updatedAt) ?? now,
    startDate: isoToDate(instance.startDate) ?? null,
    endDate: isoToDate(instance.endDate) ?? null,
    currentStreak: instance.currentStreak ?? null,
    bestStreak: instance.bestStreak ?? null,
    streakUpdatedAt: isoToDate(instance.streakUpdatedAt) ?? null,
    isPublished: instance.isPublished,
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

export interface CreateProgramInstanceInput
  extends Omit<
    ProgramInstance,
    "id" | "createdAt" | "updatedAt" | "startDate" | "endDate"
  > {
  authorId: string;
}

export async function createProgramInstance(
  payload: CreateProgramInstanceInput
) {
  const { authorId, ...rest } = payload;
  const nowIso = new Date().toISOString();
  const id = await addDoc("programs", {
    ...programInstanceToFirestore({
      ...rest,
      ownerId: authorId,
      createdAt: nowIso,
      updatedAt: nowIso,
    }),
  });
  return id;
}

export async function listProgramsByTherapist(therapistId: string) {
  const raw = await queryBy<FirestoreDocument>("programs", [
    ["therapistId", "==", therapistId],
  ]);
  return raw.map(parseProgramInstance);
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
