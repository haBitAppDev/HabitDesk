export type UserRole = "admin" | "therapist" | "patient";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface TherapistType {
  id: string;
  name: string;
}

export enum TaskFrequency {
  Daily = "daily",
  Weekly = "weekly",
}

export enum TaskVisibility {
  VisibleToPatients = "visibleToPatients",
  HiddenFromPatients = "hiddenFromPatients",
}

export enum TaskType {
  Timer = "timerTask",
  TextInput = "textInput",
  Quiz = "quizTask",
  Progress = "progressTask",
  Media = "mediaTask",
  Goal = "goalTask",
  Scale = "scaleTask",
  StateLog = "stateLog",
}

export enum MediaKind {
  Audio = "audio",
  Video = "video",
  Image = "image",
  Document = "document",
}

export interface TimerTaskConfig {
  taskType: TaskType.Timer;
  seconds: number;
  allowPause: boolean;
}

export interface TextInputConfig {
  taskType: TaskType.TextInput;
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
  taskType: TaskType.Quiz;
  singleChoice: boolean;
  options: QuizOption[];
  explanation?: string;
}

export interface ProgressTaskConfig {
  taskType: TaskType.Progress;
  target: number;
  allowPartial: boolean;
  unit: string;
}

export interface MediaTaskConfig {
  taskType: TaskType.Media;
  mediaUrl: string;
  kind: MediaKind;
  fileName?: string;
  fileSize?: number;
  storagePath?: string;
  contentType?: string;
}

export interface GoalTaskConfig {
  taskType: TaskType.Goal;
  goalDescription: string;
  dueDate?: string;
}

export interface ScaleTaskConfig {
  taskType: TaskType.Scale;
  min: number;
  max: number;
  step: number;
  leftLabel?: string;
  rightLabel?: string;
}

export interface StateLogTaskConfig {
  taskType: TaskType.StateLog;
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
  createdAt?: string;
  updatedAt?: string;
  isPublished: boolean;
}

export interface TaskInstance extends TaskTemplate {
  ownerId?: string;
  isTemplate: boolean;
}

export enum ProgramType {
  Challenge = "challenge",
  Sequential = "sequential",
  AdaptiveNormal = "adaptiveNormal",
}

export interface ProgramTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: ProgramType;
  taskIds: string[];
  icon: string;
  color: string;
  ownerId: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
  isPublished: boolean;
}

export interface ProgramInstanceTask {
  taskTemplateId: string;
  config?: TaskConfig;
}

export interface ProgramInstance {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: ProgramType;
  patientId: string;
  therapistId: string;
  ownerId: string;
  templateId?: string;
  tasks: ProgramInstanceTask[];
  taskIds: string[];
  icon: string;
  color: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  currentStreak?: number;
  bestStreak?: number;
  streakUpdatedAt?: string;
  isPublished: boolean;
}
