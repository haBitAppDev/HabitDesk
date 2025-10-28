import {
  MediaKind,
  TaskType,
} from "../types/domain";
import type {
  GoalTaskConfig,
  ProgressTaskConfig,
  QuizTaskConfig,
  ScaleTaskConfig,
  StateLogTaskConfig,
  TaskConfig,
  TextInputConfig,
  TimerTaskConfig,
} from "../types/domain";

export const defaultTaskConfig = (type: TaskType): TaskConfig => {
  switch (type) {
    case TaskType.Timer:
      return {
        taskType: TaskType.Timer,
        seconds: 60,
        allowPause: false,
      } as TimerTaskConfig;
    case TaskType.TextInput:
      return {
        taskType: TaskType.TextInput,
        minLength: 0,
        maxLength: 500,
        showHistory: false,
      } as TextInputConfig;
    case TaskType.Quiz:
      return {
        taskType: TaskType.Quiz,
        singleChoice: true,
        options: [
          { label: "Option A", isCorrect: true },
          { label: "Option B", isCorrect: false },
        ],
        explanation: "",
      } as QuizTaskConfig;
    case TaskType.Progress:
      return {
        taskType: TaskType.Progress,
        target: 100,
        allowPartial: false,
        unit: "%",
      } as ProgressTaskConfig;
    case TaskType.Media:
      return {
        taskType: TaskType.Media,
        mediaUrl: "",
        kind: MediaKind.Audio,
      } as Extract<TaskConfig, { taskType: typeof TaskType.Media }>;
    case TaskType.Goal:
      return {
        taskType: TaskType.Goal,
        goalDescription: "",
      } as GoalTaskConfig;
    case TaskType.Scale:
      return {
        taskType: TaskType.Scale,
        min: 0,
        max: 10,
        step: 1,
        leftLabel: "",
        rightLabel: "",
      } as ScaleTaskConfig;
    case TaskType.StateLog:
      return {
        taskType: TaskType.StateLog,
        emojiKeys: ["🙂", "😐", "🙁"],
        showChart: false,
      } as StateLogTaskConfig;
    default:
      return {
        taskType: TaskType.Timer,
        seconds: 60,
        allowPause: false,
      } as TimerTaskConfig;
  }
};

export const ensureConfigMatchesType = (
  type: TaskType,
  config?: TaskConfig
): TaskConfig => {
  if (!config || config.taskType !== type) {
    return defaultTaskConfig(type);
  }
  return config;
};
