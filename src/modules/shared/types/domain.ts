export type UserRole = "admin" | "therapist" | "patient";

export const AccountType = {
  Patient: "patient",
  Psychologe: "psychologe",
  Logopaede: "logopaede",
  Physio: "physio",
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

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

export const EvidenceType = {
  Photo: "photo",
  Audio: "audio",
  Video: "video",
  Geolocation: "geolocation",
  Checklist: "checklist",
  QrCode: "qrCode",
} as const;
export type EvidenceType = (typeof EvidenceType)[keyof typeof EvidenceType];

export interface EvidenceRequirement {
  type: EvidenceType;
  minAttachments: number;
  maxAttachments: number;
  isMandatory?: boolean;
}

export interface EvidenceTaskConfig {
  requirements: EvidenceRequirement[];
  notesEnabled: boolean;
  commentRequired: boolean;
  commentLabelKey?: string;
}

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
  visibility: TaskVisibility;
  config?: TaskConfig;
  evidenceConfig?: EvidenceTaskConfig;
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
  visibility: TaskVisibility;
  config?: TaskConfig;
  evidenceConfig?: EvidenceTaskConfig;
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
  assignedUserIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  currentStreak?: number;
  bestStreak?: number;
  streakUpdatedAt?: string;
  isPublished: boolean;
}

export type ProgramCadence = "daily" | "weekly";

const programCadenceByType: Record<ProgramType, ProgramCadence> = {
  [ProgramType.Challenge]: "daily",
  [ProgramType.Sequential]: "weekly",
  [ProgramType.AdaptiveNormal]: "daily",
};

export const programTypeToCadence = (
  type: ProgramType
): ProgramCadence => programCadenceByType[type] ?? "daily";

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

export type TherapistRole = Exclude<AccountType, typeof AccountType.Patient>;
export type PatientRole = typeof AccountType.Patient;

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

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (typeof entry === "number" || typeof entry === "boolean") {
        return String(entry).trim();
      }
      if (entry && typeof entry === "object" && "toString" in entry) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(entry).trim();
      }
      return "";
    })
    .filter(Boolean);
};

const timestampToIsoString = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds: number }).seconds === "number"
  ) {
    const seconds = (value as { seconds: number; nanoseconds?: number }).seconds * 1000;
    const nanos =
      ((value as { nanoseconds?: number }).nanoseconds ?? 0) / 1_000_000;
    const date = new Date(seconds + nanos);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
};

const toTherapistRole = (value: string): TherapistRole => {
  const normalized = value.toLowerCase();
  if (normalized === AccountType.Psychologe) return AccountType.Psychologe;
  if (normalized === AccountType.Logopaede) return AccountType.Logopaede;
  if (normalized === AccountType.Physio) return AccountType.Physio;
  return AccountType.Psychologe;
};

const toPatientRole = (value: string): PatientRole =>
  value.toLowerCase() === AccountType.Patient ? AccountType.Patient : AccountType.Patient;

export interface TherapistInit {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  image: string;
  inviteCode?: string;
  therapistTypes?: string[];
  inviteId?: string;
  licenseValidUntil?: string;
  contractReference?: string;
  role?: TherapistRole;
}

export interface TherapistSnapshot extends TherapistInit {
  inviteCode: string;
  therapistTypes: string[];
  role: TherapistRole;
}

export class Therapist {
  readonly id: string;
  readonly firstname: string;
  readonly lastname: string;
  readonly email: string;
  readonly phone: string;
  readonly image: string;
  readonly inviteCode: string;
  readonly therapistTypes: string[];
  readonly inviteId?: string;
  readonly licenseValidUntil?: string;
  readonly contractReference?: string;
  readonly role: TherapistRole;

  constructor({
    id,
    firstname,
    lastname,
    email,
    phone,
    image,
    inviteCode = "",
    therapistTypes = [],
    inviteId,
    licenseValidUntil,
    contractReference,
    role = "psychologe",
  }: TherapistInit) {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.phone = phone;
    this.image = image;
    this.inviteCode = inviteCode;
    this.therapistTypes = therapistTypes;
    this.inviteId = inviteId;
    this.licenseValidUntil = licenseValidUntil;
    this.contractReference = contractReference;
    this.role = role;
  }

  static fromFirestore(firestore: FirestoreRecord): Therapist {
    const therapistTypes = toStringArray(firestore["therapistTypes"]);
    const licenseValidUntil = timestampToIsoString(
      coalesce(firestore["licenseValidUntil"], firestore["licenseUntil"])
    );
    const contractReferenceRaw = toStringSafe(
      coalesce(firestore["contractReference"], "")
    ).trim();
    const contractReference =
      contractReferenceRaw.length > 0 ? contractReferenceRaw : undefined;

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
      image: toStringSafe(coalesce(firestore["image"], "")),
      inviteCode: toStringSafe(coalesce(firestore["inviteCode"], "")),
      therapistTypes,
      inviteId: toStringSafe(
        coalesce(firestore["inviteId"], firestore["inviteRef"], "")
      ).trim() || undefined,
      licenseValidUntil,
      contractReference,
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
      image: this.image,
      inviteCode: this.inviteCode,
      therapistTypes: this.therapistTypes,
      inviteId: this.inviteId,
      licenseValidUntil: this.licenseValidUntil,
      contractReference: this.contractReference,
      role: this.role,
    };
  }

  toFirestore(): Record<string, unknown> {
    const base = this.toObject();
    const payload: Record<string, unknown> = {
      ...base,
      name: this.fullName,
      role: this.role,
    };
    if (!this.inviteId) delete payload.inviteId;
    if (!this.licenseValidUntil) delete payload.licenseValidUntil;
    if (!this.contractReference) delete payload.contractReference;
    return payload;
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
