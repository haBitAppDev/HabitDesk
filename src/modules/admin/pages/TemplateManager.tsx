import { PenLine, PlusCircle, Trash } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import {
  createProgramTemplate,
  createTaskTemplate,
  listProgramTemplates,
  listTaskTemplates,
  listTherapistTypes,
  removeProgramTemplate,
  removeTaskTemplate,
  updateProgramTemplate,
  updateTaskTemplate,
} from "../../therapist/services/therapistApi";
import type {
  GoalTaskConfig,
  ProgramTemplate,
  QuizTaskConfig,
  ScaleTaskConfig,
  StateLogTaskConfig,
  TaskConfig,
  TaskTemplate,
  TherapistType,
  TextInputConfig,
  TimerTaskConfig,
  ProgressTaskConfig,
} from "../../shared/types/domain";
import {
  MediaKind,
  ProgramType,
  TaskFrequency,
  TaskType,
  TaskVisibility,
} from "../../shared/types/domain";
import { useI18n } from "../../../i18n/I18nProvider";

type TemplateTab = "tasks" | "programs";

type TranslateFn = (key: string, fallback?: string) => string;

const TASK_ICON_OPTIONS = [
  "assignment",
  "favorite_rounded",
  "task_alt_rounded",
  "self_improvement",
  "self_improvement_outlined",
  "menu_book_rounded",
  "directions_walk_rounded",
  "spa_rounded",
  "edit_note_rounded",
  "insights_rounded",
  "air_rounded",
  "hotel_rounded",
  "health_and_safety_rounded",
  "psychology_rounded",
  "groups_rounded",
  "auto_awesome_motion",
  "emoji_events_rounded",
  "run_circle_rounded",
  "accessibility_new_rounded",
  "nature_people_rounded",
  "sentiment_satisfied_alt_rounded",
  "volunteer_activism_rounded",
  "nightlight_rounded",
  "fitness_center_rounded",
  "waves_rounded",
  "mood_rounded",
  "mediation_rounded",
  "emoji_nature_rounded",
  "timer_rounded",
  "short_text_rounded",
  "quiz_rounded",
  "trending_up_rounded",
  "play_circle_fill_rounded",
  "flag_circle_rounded",
  "straighten_rounded",
  "emoji_emotions_rounded",
  "visibility_rounded",
  "visibility_off_rounded",
  "repeat_rounded",
  "category_rounded",
];

const PROGRAM_ICON_OPTIONS = [
  "favorite_rounded",
  "self_improvement",
  "health_and_safety_rounded",
  "spa_rounded",
  "psychology_rounded",
  "groups_rounded",
  "flag_circle_rounded",
  "auto_awesome_motion",
  "emoji_events_rounded",
  "run_circle_rounded",
  "accessibility_new_rounded",
  "nature_people_rounded",
  "sentiment_satisfied_alt_rounded",
  "volunteer_activism_rounded",
  "nightlight_rounded",
  "fitness_center_rounded",
  "waves_rounded",
  "mood_rounded",
  "mediation_rounded",
  "emoji_nature_rounded",
];

const PROGRAM_COLOR_OPTIONS = [
  "#1F6FEB",
  "#2563EB",
  "#10B981",
  "#AD8501",
  "#8BC34A",
  "#FF7043",
  "#9C27B0",
  "#FFC107",
  "#26C6DA",
  "#EF4444",
  "#6366F1",
];

const roleStringToArray = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const roleArrayToString = (value: string[]) => value.join(", ");

interface TaskTemplateFormState {
  title: string;
  description: string;
  icon: string;
  type: TaskType;
  frequency: TaskFrequency;
  visibility: TaskVisibility;
  rolesText: string;
  isPublished: boolean;
  config: TaskConfig;
  createdAt?: string;
  updatedAt?: string;
}

interface ProgramTemplateFormState {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  type: ProgramType;
  taskIds: string[];
  therapistTypes: string[];
  ownerId: string;
  rolesText: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const createEmptyTaskForm = (): TaskTemplateFormState => ({
  title: "",
  description: "",
  icon: TASK_ICON_OPTIONS[0],
  type: TaskType.Timer,
  frequency: TaskFrequency.Daily,
  visibility: TaskVisibility.VisibleToPatients,
  rolesText: "",
  isPublished: true,
  config: defaultTaskConfig(TaskType.Timer),
});

const createEmptyProgramForm = (): ProgramTemplateFormState => ({
  title: "",
  subtitle: "",
  description: "",
  icon: PROGRAM_ICON_OPTIONS[0],
  color: PROGRAM_COLOR_OPTIONS[0],
  type: ProgramType.AdaptiveNormal,
  taskIds: [],
  therapistTypes: [],
  ownerId: "",
  rolesText: "",
  isPublished: true,
});

const defaultTaskConfig = (type: TaskType): TaskConfig => {
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
        exampleResponse: "",
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

const ensureConfigMatchesType = (
  type: TaskType,
  config?: TaskConfig
): TaskConfig => {
  if (!config || config.taskType !== type) {
    return defaultTaskConfig(type);
  }
  return config;
};

interface TaskTemplatePaneProps {
  form: TaskTemplateFormState;
  setForm: Dispatch<SetStateAction<TaskTemplateFormState>>;
  editingId: string | null;
  templates: TaskTemplate[];
  onSubmit: () => void;
  onReset: () => void;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (id: string) => void;
  t: TranslateFn;
}

interface ProgramTemplatePaneProps {
  form: ProgramTemplateFormState;
  setForm: Dispatch<SetStateAction<ProgramTemplateFormState>>;
  editingId: string | null;
  templates: ProgramTemplate[];
  onSubmit: () => void;
  onReset: () => void;
  onEdit: (template: ProgramTemplate) => void;
  onDelete: (id: string) => void;
  therapistTypeOptions: Array<{ value: string; label: string }>;
  taskOptions: Array<{ value: string; label: string }>;
  t: TranslateFn;
}

interface TaskConfigEditorProps {
  type: TaskType;
  value: TaskConfig;
  onChange: (config: TaskConfig) => void;
  t: TranslateFn;
}

export function TemplateManager() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TemplateTab>("tasks");
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [programTemplates, setProgramTemplates] = useState<ProgramTemplate[]>([]);
  const [therapistTypes, setTherapistTypes] = useState<TherapistType[]>([]);
  const [taskForm, setTaskForm] = useState<TaskTemplateFormState>(createEmptyTaskForm());
  const [programForm, setProgramForm] = useState<ProgramTemplateFormState>(createEmptyProgramForm());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const tabs = useMemo(
    () => [
      {
        id: "tasks" as const,
        title: t("templates.tabs.tasks.title", "Task Templates"),
        description: t(
          "templates.tabs.tasks.description",
          "Konfiguriere wiederverwendbare Aufgaben inklusive Typ-spezifischer Einstellungen."
        ),
      },
      {
        id: "programs" as const,
        title: t("templates.tabs.programs.title", "Program Templates"),
        description: t(
          "templates.tabs.programs.description",
          "Kombiniere Tasks zu kompletten Programmen und steuere Rollenzugriff sowie Sichtbarkeit."
        ),
      },
    ],
    [t]
  );

  const refreshData = async () => {
    try {
      const [tasks, programs, therapists] = await Promise.all([
        listTaskTemplates(),
        listProgramTemplates(),
        listTherapistTypes(),
      ]);
      setTaskTemplates(tasks);
      setProgramTemplates(programs);
      setTherapistTypes(therapists);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const resetTaskForm = () => {
    setTaskForm(createEmptyTaskForm());
    setEditingTaskId(null);
  };

  const resetProgramForm = () => {
    setProgramForm(createEmptyProgramForm());
    setEditingProgramId(null);
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) {
      setError(
        t(
          "templates.errors.taskTitleRequired",
          "Bitte gib einen Titel für das Task Template an."
        )
      );
      return;
    }

    const config = ensureConfigMatchesType(taskForm.type, taskForm.config);
    const payload: Omit<TaskTemplate, "id"> = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      icon: taskForm.icon,
      type: taskForm.type,
      frequency: taskForm.frequency,
      visibility: taskForm.visibility,
      roles: roleStringToArray(taskForm.rolesText),
      isPublished: taskForm.isPublished,
      config,
      createdAt: taskForm.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingTaskId) {
        await updateTaskTemplate(editingTaskId, payload);
        setInfo(t("templates.messages.taskUpdated", "Task Template aktualisiert."));
      } else {
        await createTaskTemplate(payload);
        setInfo(t("templates.messages.taskCreated", "Task Template erstellt."));
      }
      await refreshData();
      resetTaskForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleProgramSubmit = async () => {
    if (!programForm.title.trim()) {
      setError(
        t(
          "templates.errors.programTitleRequired",
          "Bitte gib einen Titel für das Programm an."
        )
      );
      return;
    }
    if (!programForm.taskIds.length) {
      setError(
        t(
          "templates.errors.programTasksRequired",
          "Bitte wähle mindestens einen Task für das Programm aus."
        )
      );
      return;
    }

    const payload: Omit<ProgramTemplate, "id"> = {
      title: programForm.title.trim(),
      subtitle: programForm.subtitle.trim(),
      description: programForm.description.trim(),
      icon: programForm.icon,
      color: programForm.color,
      type: programForm.type,
      taskIds: programForm.taskIds,
      therapistTypes: programForm.therapistTypes,
      ownerId: programForm.ownerId.trim(),
      roles: roleStringToArray(programForm.rolesText),
      isPublished: programForm.isPublished,
      createdAt: programForm.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingProgramId) {
        await updateProgramTemplate(editingProgramId, payload);
        setInfo(t("templates.messages.programUpdated", "Program Template aktualisiert."));
      } else {
        await createProgramTemplate(payload);
        setInfo(t("templates.messages.programCreated", "Program Template erstellt."));
      }
      await refreshData();
      resetProgramForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const startEditTask = (template: TaskTemplate) => {
    setTaskForm({
      title: template.title,
      description: template.description ?? "",
      icon: template.icon,
      type: template.type,
      frequency: template.frequency,
      visibility: template.visibility,
      rolesText: roleArrayToString(template.roles),
      isPublished: template.isPublished,
      config: ensureConfigMatchesType(template.type, template.config),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
    setEditingTaskId(template.id);
    setActiveTab("tasks");
  };

  const startEditProgram = (template: ProgramTemplate) => {
    setProgramForm({
      title: template.title,
      subtitle: template.subtitle,
      description: template.description,
      icon: template.icon,
      color: template.color,
      type: template.type,
      taskIds: template.taskIds,
      therapistTypes: template.therapistTypes ?? [],
      ownerId: template.ownerId,
      rolesText: roleArrayToString(template.roles),
      isPublished: template.isPublished,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
    setEditingProgramId(template.id);
    setActiveTab("programs");
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await removeTaskTemplate(id);
      if (editingTaskId === id) {
        resetTaskForm();
      }
      await refreshData();
      setInfo(t("templates.messages.taskDeleted", "Task Template gelöscht."));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await removeProgramTemplate(id);
      if (editingProgramId === id) {
        resetProgramForm();
      }
      await refreshData();
      setInfo(t("templates.messages.programDeleted", "Program Template gelöscht."));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const therapistTypeOptions = useMemo(
    () => therapistTypes.map((type) => ({ value: type.id, label: type.name })),
    [therapistTypes]
  );

  const taskOptions = useMemo(
    () =>
      taskTemplates.map((template) => ({
        value: template.id,
        label: template.title,
      })),
    [taskTemplates]
  );

  const stats = {
    tasks: taskTemplates.length,
    programs: programTemplates.length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">
          {t("templates.header.title", "Templates verwalten")}
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          {t(
            "templates.header.subtitle",
            "Steuere Aufgaben- und Programmvorlagen zentral und gib sie für dein Team frei."
          )}
        </p>
      </div>

      <TabHeader
        tabs={tabs}
        activeTab={activeTab}
        stats={stats}
        onChange={setActiveTab}
      />

      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      )}

      {info && (
        <div className="rounded-card border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary shadow-soft">
          {info}
        </div>
      )}

      {activeTab === "tasks" ? (
        <TaskTemplatePane
          form={taskForm}
          setForm={setTaskForm}
          editingId={editingTaskId}
          templates={taskTemplates}
          onSubmit={handleTaskSubmit}
          onReset={resetTaskForm}
          onEdit={startEditTask}
          onDelete={handleDeleteTask}
          t={t}
        />
      ) : (
        <ProgramTemplatePane
          form={programForm}
          setForm={setProgramForm}
          editingId={editingProgramId}
          templates={programTemplates}
          onSubmit={handleProgramSubmit}
          onReset={resetProgramForm}
          onEdit={startEditProgram}
          onDelete={handleDeleteProgram}
          therapistTypeOptions={therapistTypeOptions}
          taskOptions={taskOptions}
          t={t}
        />
      )}
    </div>
  );
}

function TabHeader({
  tabs,
  activeTab,
  stats,
  onChange,
}: {
  tabs: Array<{ id: TemplateTab; title: string; description: string }>;
  activeTab: TemplateTab;
  stats: { tasks: number; programs: number };
  onChange: (tab: TemplateTab) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-brand-divider/60 bg-white p-1 shadow-soft">
      {tabs.map((tab) => {
        const selected = tab.id === activeTab;
        const count = tab.id === "tasks" ? stats.tasks : stats.programs;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 min-w-[180px] flex-col rounded-[12px] px-4 py-3 text-left transition ${
              selected
                ? "bg-brand-primary text-white shadow-soft"
                : "bg-transparent text-brand-text hover:bg-brand-light/60"
            }`}
          >
            <span className="flex items-center justify-between text-sm font-semibold">
              {tab.title}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  selected ? "bg-white/20" : "bg-brand-light/70 text-brand-text-muted"
                }`}
              >
                {count}
              </span>
            </span>
            <span
              className={`mt-1 text-xs ${
                selected ? "text-white/80" : "text-brand-text-muted"
              }`}
            >
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TaskTemplatePane({
  form,
  setForm,
  editingId,
  templates,
  onSubmit,
  onReset,
  onEdit,
  onDelete,
  t,
}: TaskTemplatePaneProps) {
  const formTitle = editingId
    ? t("templates.tasks.form.editTitle", "Task Template bearbeiten")
    : t("templates.tasks.form.newTitle", "Neues Task Template");
  const formSubtitle = t(
    "templates.tasks.form.subtitle",
    "Wähle den passenden Aufgabentyp und passe die Konfiguration an."
  );
  const resetLabel = t("templates.actions.resetForm", "Formular zurücksetzen");
  const saveLabel = editingId
    ? t("templates.actions.updateTask", "Task Template aktualisieren")
    : t("templates.actions.saveTask", "Task Template speichern");
  const publishedLabel = t("templates.actions.published", "Veröffentlicht");
  const rolePlaceholder = t(
    "templates.fields.rolesPlaceholder",
    "therapist, supervisor"
  );
  const configurationLabel = t(
    "templates.tasks.form.configTitle",
    "Konfiguration"
  );
  const frequencyDaily = t("templates.frequency.daily", "Täglich");
  const frequencyWeekly = t("templates.frequency.weekly", "Wöchentlich");
  const visibilityPatient = t(
    "templates.visibility.visibleToPatients",
    "Für Patienten sichtbar"
  );
  const visibilityHidden = t(
    "templates.visibility.hiddenFromPatients",
    "Für Patienten verborgen"
  );
  const startNewLabel = t("templates.actions.startNew", "Neu beginnen");
  const listTitle = t("templates.tasks.list.title", "Task Templates");
  const listEmptyText = t(
    "templates.tasks.list.empty",
    "Noch keine Task Templates vorhanden."
  );
  const rolesEmptyText = t(
    "templates.tasks.list.rolesEmpty",
    "Keine Rollenbindung"
  );
  const visibilityVisibleLabel = t(
    "templates.tasks.list.visibility.visible",
    "Sichtbar"
  );
  const visibilityHiddenLabel = t(
    "templates.tasks.list.visibility.hidden",
    "Versteckt"
  );
  const publishedBadge = t("templates.tasks.list.published", "Veröffentlicht");
  const draftBadge = t("templates.tasks.list.draft", "Entwurf");
  const taskTypeOptions = [
    { value: TaskType.Timer, label: t("templates.taskTypes.timerTask", "Timer") },
    { value: TaskType.TextInput, label: t("templates.taskTypes.textInput", "Freitext") },
    { value: TaskType.Quiz, label: t("templates.taskTypes.quizTask", "Quiz") },
    { value: TaskType.Progress, label: t("templates.taskTypes.progressTask", "Fortschritt") },
    { value: TaskType.Media, label: t("templates.taskTypes.mediaTask", "Media") },
    { value: TaskType.Goal, label: t("templates.taskTypes.goalTask", "Zielsetzung") },
    { value: TaskType.Scale, label: t("templates.taskTypes.scaleTask", "Skala") },
    { value: TaskType.StateLog, label: t("templates.taskTypes.stateLog", "Stimmungstagebuch") }
  ];
  return (
    <div className="space-y-6 xl:grid xl:grid-cols-3 xl:gap-6 xl:space-y-0">
      <Card className="space-y-6 p-6 xl:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">
              {formTitle}
            </h2>
            <p className="text-sm text-brand-text-muted">
              {formSubtitle}
            </p>
          </div>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              {resetLabel}
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("templates.fields.title", "Titel")}>
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </Field>
          <Field label={t("templates.fields.icon", "Icon")}>
            <Select
              value={form.icon}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, icon: event.target.value }))
              }
            >
              {TASK_ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t("templates.fields.description", "Beschreibung")}>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("templates.fields.taskType", "Aufgabentyp")}>
            <Select
              value={form.type}
              onChange={(event) => {
                const nextType = event.target.value as TaskType;
                setForm((prev) => ({
                  ...prev,
                  type: nextType,
                  config: ensureConfigMatchesType(nextType, prev.config),
                }));
              }}
            >
              {taskTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("templates.fields.frequency", "Frequenz")}>
            <Select
              value={form.frequency}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  frequency: event.target.value as TaskFrequency,
                }))
              }
            >
              <option value={TaskFrequency.Daily}>{frequencyDaily}</option>
              <option value={TaskFrequency.Weekly}>{frequencyWeekly}</option>
            </Select>
          </Field>
          <Field label={t("templates.fields.visibility", "Sichtbarkeit")}>
            <Select
              value={form.visibility}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  visibility: event.target.value as TaskVisibility,
                }))
              }
            >
              <option value={TaskVisibility.VisibleToPatients}>
                {visibilityPatient}
              </option>
              <option value={TaskVisibility.HiddenFromPatients}>
                {visibilityHidden}
              </option>
            </Select>
          </Field>
          <Field label={t("templates.fields.roles", "Rollen (kommagetrennt, optional)")}>
            <Input
              placeholder={rolePlaceholder}
              value={form.rolesText}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, rolesText: event.target.value }))
              }
            />
          </Field>
        </div>

        <div className="space-y-3 rounded-card border border-brand-divider/60 bg-brand-light/40 p-4">
          <Label className="text-sm font-semibold text-brand-text">
            {configurationLabel}
          </Label>
          <TaskConfigEditor
            type={form.type}
            value={ensureConfigMatchesType(form.type, form.config)}
            onChange={(config) => setForm((prev) => ({ ...prev, config }))}
            t={t}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={onSubmit}>
            {saveLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            {resetLabel}
          </Button>
          <label className="flex items-center gap-2 text-sm text-brand-text-muted">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isPublished: event.target.checked }))
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {publishedLabel}
          </label>
        </div>
      </Card>

      <Card className="flex h-full flex-col p-6 xl:col-span-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
            {listTitle} ({templates.length})
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={onReset}
          >
            <PlusCircle className="h-4 w-4" />
            {startNewLabel}
          </Button>
        </div>
        <div className="mt-4 space-y-4 overflow-y-auto pr-1">
          {templates.length === 0 && (
            <p className="rounded-[12px] border border-dashed border-brand-divider/70 px-4 py-6 text-sm text-brand-text-muted">
              {listEmptyText}
            </p>
          )}
          {templates.map((template) => {
            const isEditing = editingId === template.id;
            return (
              <div
                key={template.id}
                className={`rounded-[14px] border px-4 py-3 shadow-sm transition ${
                  isEditing
                    ? "border-brand-primary/70 bg-brand-primary/5"
                    : "border-brand-divider/60 bg-white hover:border-brand-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">
                      {template.title}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                      {t(`templates.taskTypes.${template.type}`, template.type)} •{" "}
                      {template.frequency === TaskFrequency.Daily ? frequencyDaily : frequencyWeekly}
                    </p>
                    {template.description && (
                      <p className="mt-1 text-xs text-brand-text-muted">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(template)}
                      className="rounded-full border border-brand-divider/60 p-2 text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary"
                    >
                      <PenLine className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(template.id)}
                      className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase text-brand-text-muted">
                  <span>
                    {template.visibility === TaskVisibility.HiddenFromPatients
                      ? visibilityHiddenLabel
                      : visibilityVisibleLabel}
                  </span>
                  <span>{template.roles.length ? template.roles.join(", ") : rolesEmptyText}</span>
                  <span>{template.isPublished ? publishedBadge : draftBadge}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ProgramTemplatePane({
  form,
  setForm,
  editingId,
  templates,
  onSubmit,
  onReset,
  onEdit,
  onDelete,
  therapistTypeOptions,
  taskOptions,
  t,
}: ProgramTemplatePaneProps) {
  const formTitle = editingId
    ? t("templates.programs.form.editTitle", "Program Template bearbeiten")
    : t("templates.programs.form.newTitle", "Neues Program Template");
  const formSubtitle = t(
    "templates.programs.form.subtitle",
    "Kombiniere Tasks zu strukturierten Programmen und definiere den Zugriff."
  );
  const tasksSelectedLabel = t(
    "templates.programs.form.tasksSelected",
    "Tasks ausgewählt"
  );
  const therapistTypesLabel = t(
    "templates.programs.form.therapistTypes",
    "Therapeuten-Typen"
  );
  const tasksLabel = t("templates.programs.form.tasks", "Task Templates");
  const resetLabel = t("templates.actions.resetForm", "Formular zurücksetzen");
  const saveLabel = editingId
    ? t("templates.actions.updateProgram", "Program Template aktualisieren")
    : t("templates.actions.saveProgram", "Program Template speichern");
  const publishedLabel = t("templates.actions.published", "Veröffentlicht");
  const listTitle = t("templates.programs.list.title", "Program Templates");
  const programListEmptyText = t(
    "templates.programs.list.empty",
    "Noch keine Program Templates vorhanden."
  );
  const availableTasksEmptyText = t(
    "templates.tasks.list.empty",
    "Noch keine Task Templates vorhanden."
  );
  const rolesEmptyText = t(
    "templates.programs.list.rolesEmpty",
    "Keine Rollenbindung"
  );
  const therapistsEmptyText = t(
    "templates.programs.list.therapistsEmpty",
    "Alle Therapeuten"
  );
  const publishedBadge = t(
    "templates.programs.list.published",
    "Veröffentlicht"
  );
  const draftBadge = t("templates.programs.list.draft", "Entwurf");
  return (
    <div className="space-y-6 xl:grid xl:grid-cols-3 xl:gap-6 xl:space-y-0">
      <Card className="space-y-6 p-6 xl:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">
              {formTitle}
            </h2>
            <p className="text-sm text-brand-text-muted">
              {formSubtitle}
            </p>
          </div>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              {resetLabel}
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("templates.fields.title", "Titel")}>
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </Field>
          <Field label={t("templates.programs.form.subtitleLabel", "Untertitel")}>
            <Input
              value={form.subtitle}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subtitle: event.target.value }))
              }
            />
          </Field>
          <Field
            label={t("templates.fields.description", "Beschreibung")}
            fullWidth
          >
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("templates.programs.form.typeLabel", "Programmart")}>
            <Select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  type: event.target.value as ProgramType,
                }))
              }
            >
              <option value={ProgramType.Challenge}>Challenge</option>
              <option value={ProgramType.Sequential}>Sequenziell</option>
              <option value={ProgramType.AdaptiveNormal}>Adaptiv / Normal</option>
            </Select>
          </Field>
          <Field label={t("templates.fields.icon", "Icon")}>
            <Select
              value={form.icon}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, icon: event.target.value }))
              }
            >
              {PROGRAM_ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("templates.programs.form.owner", "Owner-ID (optional)")}>
            <Input
              value={form.ownerId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ownerId: event.target.value }))
              }
            />
          </Field>
          <Field label={t("templates.fields.roles", "Rollen (kommagetrennt, optional)")}>
            <Input
              value={form.rolesText}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, rolesText: event.target.value }))
              }
            />
          </Field>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-brand-text">
            {t("templates.programs.form.color", "Farbe")}
          </Label>
          <div className="flex flex-wrap gap-3">
            {PROGRAM_COLOR_OPTIONS.map((color) => {
              const isSelected = form.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      color,
                    }))
                  }
                  className={`h-9 w-9 rounded-full border ${
                    isSelected ? "border-brand-primary ring-2 ring-brand-primary/60" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <span className="sr-only">{color}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-card border border-brand-divider/60 bg-brand-light/40 p-4">
          <Label className="text-sm font-semibold text-brand-text">
            {therapistTypesLabel}
          </Label>
          <div className="flex flex-wrap gap-2">
            {therapistTypeOptions.length === 0 && (
              <span className="text-xs text-brand-text-muted">
                {t("templates.programs.form.noTherapistTypes", "Keine Typen hinterlegt.")}
              </span>
            )}
            {therapistTypeOptions.map((option) => {
              const isSelected = form.therapistTypes.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      therapistTypes: isSelected
                        ? prev.therapistTypes.filter((item) => item !== option.value)
                        : [...prev.therapistTypes, option.value],
                    }))
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isSelected
                      ? "bg-brand-primary text-white"
                      : "bg-white text-brand-text hover:bg-brand-light/60"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-card border border-brand-divider/60 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-brand-text">
              {tasksLabel}
            </Label>
            <span className="text-xs text-brand-text-muted">
              {form.taskIds.length} {tasksSelectedLabel}
            </span>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {taskOptions.length === 0 && (
              <p className="rounded-[12px] border border-dashed border-brand-divider/70 px-4 py-4 text-sm text-brand-text-muted">
                {availableTasksEmptyText}
              </p>
            )}
            {taskOptions.map((option) => {
              const checked = form.taskIds.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center justify-between rounded-[12px] border border-brand-divider/60 bg-brand-light/30 px-3 py-2 text-sm text-brand-text"
                >
                  <span>{option.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const nextChecked = event.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        taskIds: nextChecked
                          ? [...prev.taskIds, option.value]
                          : prev.taskIds.filter((id) => id !== option.value),
                      }));
                    }}
                    className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={onSubmit}>
            {saveLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            {resetLabel}
          </Button>
          <label className="flex items-center gap-2 text-sm text-brand-text-muted">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isPublished: event.target.checked }))
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {publishedLabel}
          </label>
        </div>
      </Card>

      <Card className="flex h-full flex-col p-6 xl:col-span-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
            {listTitle} ({templates.length})
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={onReset}
          >
            <PlusCircle className="h-4 w-4" />
            {t("templates.actions.startNew", "Neu beginnen")}
          </Button>
        </div>
        <div className="mt-4 space-y-4 overflow-y-auto pr-1">
          {templates.length === 0 && (
            <p className="rounded-[12px] border border-dashed border-brand-divider/70 px-4 py-6 text-sm text-brand-text-muted">
              {programListEmptyText}
            </p>
          )}
          {templates.map((template) => {
            const isEditing = editingId === template.id;
            return (
              <div
                key={template.id}
                className={`rounded-[14px] border px-4 py-3 shadow-sm transition ${
                  isEditing
                    ? "border-brand-primary/70 bg-brand-primary/5"
                    : "border-brand-divider/60 bg-white hover:border-brand-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">
                      {template.title}
                    </p>
                    <p className="text-xs text-brand-text-muted">{template.subtitle}</p>
                    <p className="text-xs text-brand-text-muted">
                      {template.taskIds.length} {tasksLabel} • {t(
                        `templates.taskTypes.${template.type}`,
                        template.type
                      )}
                    </p>
                  </div>
                  <span
                    className="h-6 w-6 rounded-full ring-2 ring-brand-divider/40"
                    style={{ backgroundColor: template.color }}
                  />
                </div>
                <p className="mt-2 text-xs text-brand-text-muted line-clamp-3">
                  {template.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase text-brand-text-muted">
                  <span>{template.roles.length ? template.roles.join(", ") : rolesEmptyText}</span>
                  <span>
                    {template.therapistTypes?.length
                      ? template.therapistTypes.join(", ")
                      : therapistsEmptyText}
                  </span>
                  <span>{template.isPublished ? publishedBadge : draftBadge}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(template)}
                    className="rounded-full border border-brand-divider/60 p-2 text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary"
                  >
                    <PenLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(template.id)}
                    className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "md:col-span-2" : undefined}>
      <Label className="mb-1 block text-sm font-semibold text-brand-text">
        {label}
      </Label>
      {children}
    </div>
  );
}

function TaskConfigEditor({ type, value, onChange, t }: TaskConfigEditorProps) {
  switch (type) {
    case TaskType.Timer: {
      const current =
        value.taskType === TaskType.Timer
          ? (value as TimerTaskConfig)
          : (defaultTaskConfig(TaskType.Timer) as TimerTaskConfig);
      return (
        <div className="space-y-4">
          <Field label={t("templates.tasks.config.timer.duration", "Dauer (Sekunden)")}>
            <Input
              type="number"
              min={5}
              value={current.seconds}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Timer,
                  seconds: Number(event.target.value) || 0,
                })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.allowPause}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Timer,
                  allowPause: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {t("templates.tasks.config.timer.allowPause", "Pause erlauben")}
          </label>
        </div>
      );
    }
    case TaskType.TextInput: {
      const current =
        value.taskType === TaskType.TextInput
          ? (value as TextInputConfig)
          : (defaultTaskConfig(TaskType.TextInput) as TextInputConfig);
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Minimale Zeichen">
              <Input
                type="number"
                min={0}
                value={current.minLength}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.TextInput,
                    minLength: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
            <Field label="Maximale Zeichen">
              <Input
                type="number"
                min={10}
                value={current.maxLength}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.TextInput,
                    maxLength: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.showHistory}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.TextInput,
                  showHistory: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            Verlauf anzeigen
          </label>
          <Field label="Beispielfrage / Prompt">
            <Textarea
              rows={3}
              value={current.exampleResponse ?? ""}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.TextInput,
                  exampleResponse: event.target.value,
                })
              }
            />
          </Field>
        </div>
      );
    }
    case TaskType.Quiz: {
      const current =
        value.taskType === TaskType.Quiz
          ? (value as QuizTaskConfig)
          : (defaultTaskConfig(TaskType.Quiz) as QuizTaskConfig);

      const handleOptionChange = (
        index: number,
        field: "label" | "isCorrect",
        fieldValue: string | boolean
      ) => {
        const options = current.options.map((option, idx) =>
          idx === index ? { ...option, [field]: fieldValue } : option
        );
        onChange({ ...current, taskType: TaskType.Quiz, options });
      };

      const addOption = () => {
        onChange({
          ...current,
          taskType: TaskType.Quiz,
          options: [
            ...current.options,
            { label: `Option ${current.options.length + 1}`, isCorrect: false },
          ],
        });
      };

      const removeOption = (index: number) => {
        const options = current.options.filter((_, idx) => idx !== index);
        onChange({ ...current, taskType: TaskType.Quiz, options });
      };

      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.singleChoice}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Quiz,
                  singleChoice: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            Nur eine Antwort erlaubt
          </label>
          <Field label="Erklärung / Feedback">
            <Textarea
              rows={3}
              value={current.explanation ?? ""}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Quiz,
                  explanation: event.target.value,
                })
              }
            />
          </Field>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-text">Antwortoptionen</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={addOption}
              >
                <PlusCircle className="h-4 w-4" />
                Option hinzufügen
              </Button>
            </div>
            <div className="space-y-3">
              {current.options.map((option, index) => (
                <div
                  key={`quiz-option-${index}`}
                  className="rounded-[12px] border border-brand-divider/60 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(event) =>
                        handleOptionChange(index, "isCorrect", event.target.checked)
                      }
                      className="mt-2 h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
                    />
                    <Input
                      value={option.label}
                      onChange={(event) =>
                        handleOptionChange(index, "label", event.target.value)
                      }
                      placeholder={`Antwort ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case TaskType.Progress: {
      const current =
        value.taskType === TaskType.Progress
          ? (value as ProgressTaskConfig)
          : (defaultTaskConfig(TaskType.Progress) as ProgressTaskConfig);
      return (
        <div className="space-y-4">
          <Field label="Zielwert">
            <Input
              type="number"
              value={current.target}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Progress,
                  target: Number(event.target.value) || 0,
                })
              }
            />
          </Field>
          <Field label="Einheit (z. B. Min, Schritte)">
            <Input
              value={current.unit}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Progress,
                  unit: event.target.value,
                })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.allowPartial}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Progress,
                  allowPartial: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            Teilfortschritt erlauben
          </label>
        </div>
      );
    }
    case TaskType.Media: {
      const current =
        value.taskType === TaskType.Media
          ? (value as Extract<TaskConfig, { taskType: typeof TaskType.Media }>)
          : (defaultTaskConfig(TaskType.Media) as Extract<
              TaskConfig,
              { taskType: typeof TaskType.Media }
            >);
      return (
        <div className="space-y-4">
          <Field label="Medientyp">
            <Select
              value={current.kind}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Media,
                  kind: event.target.value as MediaKind,
                })
              }
            >
              <option value={MediaKind.Audio}>Audio</option>
              <option value={MediaKind.Video}>Video</option>
              <option value={MediaKind.Image}>Bild</option>
              <option value={MediaKind.Document}>Dokument</option>
            </Select>
          </Field>
          <Field label="Media-URL">
            <Input
              placeholder="https://..."
              value={current.mediaUrl}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Media,
                  mediaUrl: event.target.value,
                })
              }
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Dateiname">
              <Input
                value={current.fileName ?? ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Media,
                    fileName: event.target.value || undefined,
                  })
                }
              />
            </Field>
            <Field label="Content-Type">
              <Input
                value={current.contentType ?? ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Media,
                    contentType: event.target.value || undefined,
                  })
                }
              />
            </Field>
          </div>
        </div>
      );
    }
    case TaskType.Goal: {
      const current =
        value.taskType === TaskType.Goal
          ? (value as GoalTaskConfig)
          : (defaultTaskConfig(TaskType.Goal) as GoalTaskConfig);
      return (
        <div className="space-y-4">
          <Field label="Zielbeschreibung">
            <Textarea
              rows={3}
              value={current.goalDescription}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Goal,
                  goalDescription: event.target.value,
                })
              }
            />
          </Field>
          <Field label="Fälligkeitsdatum (optional)">
            <Input
              type="date"
              value={current.dueDate ? current.dueDate.substring(0, 10) : ""}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Goal,
                  dueDate: event.target.value
                    ? new Date(event.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </Field>
        </div>
      );
    }
    case TaskType.Scale: {
      const current =
        value.taskType === TaskType.Scale
          ? (value as ScaleTaskConfig)
          : (defaultTaskConfig(TaskType.Scale) as ScaleTaskConfig);
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Minimum">
              <Input
                type="number"
                value={current.min}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    min: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
            <Field label="Maximum">
              <Input
                type="number"
                value={current.max}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    max: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
            <Field label="Schritte">
              <Input
                type="number"
                min={1}
                value={current.step}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    step: Number(event.target.value) || 1,
                  })
                }
              />
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Linke Beschriftung">
              <Input
                value={current.leftLabel ?? ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    leftLabel: event.target.value || undefined,
                  })
                }
              />
            </Field>
            <Field label="Rechte Beschriftung">
              <Input
                value={current.rightLabel ?? ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    rightLabel: event.target.value || undefined,
                  })
                }
              />
            </Field>
          </div>
        </div>
      );
    }
    case TaskType.StateLog: {
      const current =
        value.taskType === TaskType.StateLog
          ? (value as StateLogTaskConfig)
          : (defaultTaskConfig(TaskType.StateLog) as StateLogTaskConfig);
      return (
        <div className="space-y-4">
          <Field label="Emojis (durch Komma trennen)">
            <Input
              value={current.emojiKeys.join(", ")}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.StateLog,
                  emojiKeys: roleStringToArray(event.target.value),
                })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.showChart}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.StateLog,
                  showChart: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            Verlaufsgrafik anzeigen
          </label>
        </div>
      );
    }
    default:
      return null;
  }
}
