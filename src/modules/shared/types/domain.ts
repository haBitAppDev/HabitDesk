export type UserRole = "admin" | "therapist" | "patient";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  therapistTypes?: string[];
  inviteId?: string;
  licenseValidUntil?: string;
  contractReference?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface TherapistType {
  id: string;
  name: string;
}

export const TemplateScope = {
  Global: "global",
  TherapistType: "therapistType",
  Private: "private",
} as const;
export type TemplateScope =
  (typeof TemplateScope)[keyof typeof TemplateScope];

export const TaskFrequency = {
  Daily: "daily",
  Weekly: "weekly",
} as const;
export type TaskFrequency = (typeof TaskFrequency)[keyof typeof TaskFrequency];

export const TaskVisibility = {
  VisibleToPatients: "visibleToPatients",
  HiddenFromPatients: "hiddenFromPatients",
} as const;
export type TaskVisibility =
  (typeof TaskVisibility)[keyof typeof TaskVisibility];

export const TaskType = {
  Timer: "timerTask",
  TextInput: "textInput",
  Quiz: "quizTask",
  Progress: "progressTask",
  Media: "mediaTask",
  Goal: "goalTask",
  Scale: "scaleTask",
  StateLog: "stateLog",
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const MediaKind = {
  Audio: "audio",
  Video: "video",
  Image: "image",
  Document: "document",
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

export interface TimerTaskConfig {
  taskType: typeof TaskType.Timer;
  seconds: number;
  allowPause: boolean;
}

export interface TextInputConfig {
  taskType: typeof TaskType.TextInput;
  minLength: number;
  maxLength: number;
  showHistory: boolean;
  exampleResponse?: string;
}

export interface QuizOption {
  label: string;
  isCorrect: boolean;
}

export interface QuizTaskConfig {
  taskType: typeof TaskType.Quiz;
  singleChoice: boolean;
  options: QuizOption[];
  explanation?: string;
}

export interface ProgressTaskConfig {
  taskType: typeof TaskType.Progress;
  target: number;
  allowPartial: boolean;
  unit: string;
}

export interface MediaTaskConfig {
  taskType: typeof TaskType.Media;
  mediaUrl: string;
  kind: MediaKind;
  fileName?: string;
  fileSize?: number;
  storagePath?: string;
  contentType?: string;
}

export interface GoalTaskConfig {
  taskType: typeof TaskType.Goal;
  goalDescription: string;
  dueDate?: string;
}

export interface ScaleTaskConfig {
  taskType: typeof TaskType.Scale;
  min: number;
  max: number;
  step: number;
  leftLabel?: string;
  rightLabel?: string;
}

export interface StateLogTaskConfig {
  taskType: typeof TaskType.StateLog;
  emojiKeys: string[];
  showChart: boolean;
}

export type TaskConfig =
  | TimerTaskConfig
  | TextInputConfig
  | QuizTaskConfig
  | ProgressTaskConfig
  | MediaTaskConfig
  | GoalTaskConfig
  | ScaleTaskConfig
  | StateLogTaskConfig;

export interface TaskTemplate {
  id: string;
  title: string;
  type: TaskType;
  icon: string;
  description?: string;
  frequency: TaskFrequency;
  visibility: TaskVisibility;
  config?: TaskConfig;
  roles: string[];
  therapistTypes: string[];
  scope: TemplateScope;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublished: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  icon: string;
  description?: string;
  frequency: TaskFrequency;
  visibility: TaskVisibility;
  config?: TaskConfig;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  roles: string[];
  isPublished: boolean;
  isTemplate: boolean;
}

export const ProgramType = {
  Challenge: "challenge",
  Sequential: "sequential",
  AdaptiveNormal: "adaptiveNormal",
} as const;
export type ProgramType = (typeof ProgramType)[keyof typeof ProgramType];

export interface Program {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: ProgramType;
  taskIds: string[];
  tasks?: Task[];
  therapistTypes: string[];
  icon: string;
  color: string;
  ownerId: string;
  roles: string[];
  scope: TemplateScope;
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  currentStreak?: number;
  bestStreak?: number;
  streakUpdatedAt?: string;
  isPublished: boolean;
}

export type ProgramTemplate = Program;

export interface ProgramAssignment {
  id: string;
  programId: string;
  userId: string;
  assignedAt: string;
  completedAt?: string;
  isActive: boolean;
  progress: number;
  currentTaskIndex: number;
  unlockedTaskIds: string[];
  streakCount: number;
  bestStreak: number;
  lastCompletionDate?: string;
}

export type TherapistInviteStatus = "pending" | "used" | "revoked";

export interface TherapistInvite {
  id: string;
  code: string;
  status: TherapistInviteStatus;
  therapistTypes: string[];
  email?: string;
  assignedUid?: string;
  licenseValidUntil?: string;
  contractReference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TherapistProfile {
  uid: string;
  email: string;
  displayName: string;
  therapistTypes: string[];
  inviteId?: string;
  licenseValidUntil?: string;
  contractReference?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TherapistRole = Extract<UserRole, "therapist"> | "psychologe";
export type PatientRole = Extract<UserRole, "patient">;

type FirestoreRecord = Record<string, unknown>;

const toStringSafe = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const coalesce = (...values: unknown[]): unknown => {
  for (const entry of values) {
    if (entry !== undefined && entry !== null) {
      return entry;
    }
  }
  return "";
};

const toTherapistRole = (value: string): TherapistRole => {
  const normalized = value.toLowerCase();
  if (normalized === "therapist") return "therapist";
  if (normalized === "psychologe") return "psychologe";
  return "psychologe";
};

const toPatientRole = (value: string): PatientRole =>
  value.toLowerCase() === "patient" ? "patient" : "patient";

export interface TherapistInit {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  specialization: string;
  image: string;
  inviteCode?: string;
  role?: TherapistRole;
}

export interface TherapistSnapshot extends TherapistInit {
  inviteCode: string;
  role: TherapistRole;
}

export class Therapist {
  readonly id: string;
  readonly firstname: string;
  readonly lastname: string;
  readonly email: string;
  readonly phone: string;
  readonly specialization: string;
  readonly image: string;
  readonly inviteCode: string;
  readonly role: TherapistRole;

  constructor({
    id,
    firstname,
    lastname,
    email,
    phone,
    specialization,
    image,
    inviteCode = "",
    role = "psychologe",
  }: TherapistInit) {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.phone = phone;
    this.specialization = specialization;
    this.image = image;
    this.inviteCode = inviteCode;
    this.role = role;
  }

  static fromFirestore(firestore: FirestoreRecord): Therapist {
    return new Therapist({
      id: toStringSafe(coalesce(firestore["id"], "")),
      firstname: toStringSafe(
        coalesce(firestore["firstname"], firestore["firstName"], "")
      ),
      lastname: toStringSafe(
        coalesce(firestore["lastname"], firestore["lastName"], "")
      ),
      email: toStringSafe(coalesce(firestore["email"], "")),
      phone: toStringSafe(coalesce(firestore["phone"], "")),
      specialization: toStringSafe(coalesce(firestore["specialization"], "")),
      image: toStringSafe(coalesce(firestore["image"], "")),
      inviteCode: toStringSafe(coalesce(firestore["inviteCode"], "")),
      role: toTherapistRole(
        toStringSafe(coalesce(firestore["role"], "psychologe"))
      ),
    });
  }

  get fullName(): string {
    return `${this.firstname} ${this.lastname}`.trim();
  }

  toObject(): TherapistSnapshot {
    return {
      id: this.id,
      firstname: this.firstname,
      lastname: this.lastname,
      email: this.email,
      phone: this.phone,
      specialization: this.specialization,
      image: this.image,
      inviteCode: this.inviteCode,
      role: this.role,
    };
  }

  toFirestore(): Record<string, unknown> {
    const base = this.toObject();
    return {
      ...base,
      name: this.fullName,
    } as Record<string, unknown>;
  }

  copyWith(update: Partial<TherapistInit>): Therapist {
    return new Therapist({
      ...this.toObject(),
      ...update,
    });
  }
}

export interface PatientInit {
  id: string;
  firstname: string;
  lastname: string;
  therapistId?: string;
  diagnosis?: string;
  nextAppointment?: string;
  image: string;
  role?: PatientRole;
}

export interface PatientSnapshot extends PatientInit {
  therapistId: string;
  diagnosis: string;
  nextAppointment: string;
  role: PatientRole;
}

export class Patient {
  readonly id: string;
  readonly therapistId: string;
  readonly firstname: string;
  readonly lastname: string;
  readonly diagnosis: string;
  readonly nextAppointment: string;
  readonly image: string;
  readonly role: PatientRole;

  constructor({
    id,
    firstname,
    lastname,
    therapistId = "",
    diagnosis = "",
    nextAppointment = "",
    image,
    role = "patient",
  }: PatientInit) {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.therapistId = therapistId;
    this.diagnosis = diagnosis;
    this.nextAppointment = nextAppointment;
    this.image = image;
    this.role = role;
  }

  static fromFirestore(firestore: FirestoreRecord): Patient {
    return new Patient({
      id: toStringSafe(coalesce(firestore["id"], "")),
      therapistId: toStringSafe(coalesce(firestore["therapistId"], "")),
      firstname: toStringSafe(coalesce(firestore["firstname"], "")),
      lastname: toStringSafe(coalesce(firestore["lastname"], "")),
      diagnosis: toStringSafe(coalesce(firestore["diagnosis"], "")),
      nextAppointment: toStringSafe(coalesce(firestore["nextAppointment"], "")),
      image: toStringSafe(coalesce(firestore["image"], "")),
      role: toPatientRole(toStringSafe(coalesce(firestore["role"], "patient"))),
    });
  }

  toObject(): PatientSnapshot {
    return {
      id: this.id,
      therapistId: this.therapistId,
      firstname: this.firstname,
      lastname: this.lastname,
      diagnosis: this.diagnosis,
      nextAppointment: this.nextAppointment,
      image: this.image,
      role: this.role,
    };
  }

  toFirestore(): Record<string, unknown> {
    return {
      ...this.toObject(),
    } as Record<string, unknown>;
  }

  copyWith(update: Partial<PatientInit>): Patient {
    return new Patient({
      ...this.toObject(),
      ...update,
    });
  }
}
