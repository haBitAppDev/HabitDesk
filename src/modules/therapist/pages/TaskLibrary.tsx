import type { ComponentType } from "react";
import {
  BarChart,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  HelpCircle,
  PlayCircle,
  Rocket,
  Search,
  Target,
  Timer,
  TrendingUp,
  Type,
  UserCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { IconPicker } from "../../../components/ui/icon-picker";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import { useI18n } from "../../../i18n/I18nProvider";
import { useAuthState } from "../../shared/hooks/useAuthState";
import { TaskConfigEditor } from "../../shared/components/TaskConfigEditor";
import type { MediaTaskConfig, TaskConfig, TaskTemplate } from "../../shared/types/domain";
import { MediaKind, TaskType, TaskVisibility, TemplateScope } from "../../shared/types/domain";
import {
  defaultTaskConfig,
  ensureConfigMatchesType,
} from "../../shared/utils/taskConfig";
import {
  createTask,
  createTaskTemplate,
  listTaskTemplates,
} from "../services/therapistApi";
import { useBuilderStore } from "./ProgramBuilder";
import { TASK_ICON_OPTIONS } from "../../shared/constants/iconOptions";
import { useUserRole } from "../../shared/hooks/useUserRole";

type Notification = { type: "success" | "error"; text: string };

interface TaskTemplateDraft {
  title: string;
  description: string;
  icon: string;
  type: TaskType;
  visibility: TaskVisibility;
  rolesText: string;
  config: TaskConfig;
}

const SUPPORTED_TASK_TYPES: TaskType[] = [
  TaskType.Timer,
  TaskType.TextInput,
  TaskType.Quiz,
  TaskType.Progress,
  TaskType.Media,
  TaskType.Goal,
  TaskType.Scale,
  TaskType.StateLog,
];

const createEmptyDraft = (): TaskTemplateDraft => ({
  title: "",
  description: "",
  icon: "assignment",
  type: TaskType.Timer,
  visibility: TaskVisibility.VisibleToPatients,
  rolesText: "",
  config: defaultTaskConfig(TaskType.Timer),
});

export function TaskLibrary() {
  const { t } = useI18n();
  const { user } = useAuthState();
  const { role } = useUserRole();
  const addTask = useBuilderStore((state) => state.addTask);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<TaskTemplateDraft>(() =>
    createEmptyDraft()
  );
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const titleText = t("therapist.taskLibrary.title", "Task Library");
  const subtitleText = t(
    "therapist.taskLibrary.subtitle",
    "Browse existing task templates and add them to your program."
  );
  const cadenceInfo = t(
    "therapist.taskLibrary.cadenceInfo",
    "Cadence is defined by the program type."
  );
  const searchPlaceholder = t(
    "therapist.taskLibrary.search",
    "Search by title, description or role…"
  );
  const emptyText = t(
    "therapist.taskLibrary.empty",
    "No tasks found. Adjust your search or create a new template."
  );
  const rolesEmpty = t(
    "therapist.taskLibrary.rolesEmpty",
    "No role restriction"
  );
  const visibilityVisible = t(
    "therapist.taskLibrary.visibility.visible",
    "Visible"
  );
  const visibilityHidden = t(
    "therapist.taskLibrary.visibility.hidden",
    "Hidden"
  );
  const createTitle = t(
    "therapist.taskLibrary.create.title",
    "Create task template"
  );
  const createButtonLabel = t(
    "therapist.taskLibrary.create.button",
    "Create task template"
  );
  const createCancelLabel = t(
    "therapist.taskLibrary.create.cancel",
    "Cancel"
  );
  const createTitleLabel = t(
    "therapist.taskLibrary.create.titleLabel",
    "Title"
  );
  const createIconLabel = t(
    "therapist.taskLibrary.create.iconLabel",
    "Icon"
  );
  const createDescriptionLabel = t(
    "therapist.taskLibrary.create.descriptionLabel",
    "Description"
  );
  const createRolesLabel = t(
    "therapist.taskLibrary.create.rolesLabel",
    "Roles (comma separated)"
  );
  const createTypeLabel = t(
    "therapist.taskLibrary.create.typeLabel",
    "Task type"
  );
  const createTypeHelp = t(
    "therapist.taskLibrary.create.typeHelp",
    "Select a task type to configure task-specific settings."
  );
  const createVisibilityLabel = t(
    "therapist.taskLibrary.create.visibilityLabel",
    "Visibility"
  );
  const createSubmitLabel = t(
    "therapist.taskLibrary.create.submit",
    "Save template"
  );
  const createResetLabel = t(
    "therapist.taskLibrary.create.reset",
    "Reset"
  );
  const createLoginRequired = t(
    "therapist.taskLibrary.create.loginRequired",
    "You need to be signed in to create task templates."
  );
  const createTitleRequired = t(
    "therapist.taskLibrary.create.titleRequired",
    "Please add a title before saving."
  );
  const createUnsupportedType = t(
    "therapist.taskLibrary.create.unsupportedType",
    "This task type is not supported yet."
  );
  const createGenericError = t(
    "therapist.taskLibrary.create.error",
    "Saving the task template failed."
  );
  const createMediaRequired = t(
    "therapist.taskLibrary.create.mediaRequired",
    "Please upload a file or provide a link for media tasks."
  );
  const addToAppLabel = t("therapist.taskLibrary.actions.addToApp", "Add to app");
  const addToAppPending = t("therapist.taskLibrary.actions.adding", "Adding...");
  const addToAppSuccess = (title: string) =>
    t("therapist.taskLibrary.actions.addToAppSuccess", "\"{title}\" added to the app.", {
      title,
    });
  const addToAppOwnerMissing = t(
    "therapist.taskLibrary.actions.addToAppOwnerMissing",
    "Unable to determine a task owner. Please sign in and try again."
  );
  const addToAppError = t(
    "therapist.taskLibrary.actions.addToAppError",
    "Failed to add the task to the app."
  );
  const addToAppTherapistOnly = t(
    "therapist.taskLibrary.actions.addToAppTherapistOnly",
    "Only therapists can add tasks to the app."
  );
  const taskTypeLabels: Record<
    TaskType,
    { label: string; color: string; icon: ComponentType<{ className?: string }> }
  > = {
    [TaskType.Timer]: { label: t("templates.taskTypes.timerTask", "Timer"), color: "text-[#2563EB]", icon: Timer },
    [TaskType.TextInput]: { label: t("templates.taskTypes.textInput", "Freitext"), color: "text-[#10B981]", icon: Type },
    [TaskType.Quiz]: { label: t("templates.taskTypes.quizTask", "Quiz"), color: "text-[#F59E0B]", icon: HelpCircle },
    [TaskType.Progress]: {
      label: t("templates.taskTypes.progressTask", "Fortschritt"),
      color: "text-[#8B5CF6]",
      icon: TrendingUp,
    },
    [TaskType.Media]: { label: t("templates.taskTypes.mediaTask", "Media"), color: "text-[#EC4899]", icon: PlayCircle },
    [TaskType.Goal]: {
      label: t("templates.taskTypes.goalTask", "Zielsetzung"),
      color: "text-[#6366F1]",
      icon: Target,
    },
    [TaskType.Scale]: { label: t("templates.taskTypes.scaleTask", "Skala"), color: "text-[#F43F5E]", icon: BarChart },
    [TaskType.StateLog]: {
      label: t("templates.taskTypes.stateLog", "Stimmungstagebuch"),
      color: "text-[#14B8A6]",
      icon: HeartPulse,
    },
  };

  const showNotification = useCallback(
    (payload: Notification, duration = 3000) => {
      setNotification(payload);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (duration > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setNotification(null);
          timeoutRef.current = null;
        }, duration);
      } else {
        timeoutRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const refreshTemplates = useCallback(async () => {
    const templates = await listTaskTemplates();
    setTasks(templates);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refreshTemplates()
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        showNotification({ type: "error", text: message }, 5000);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTemplates, showNotification]);

  const filteredTasks = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return tasks;
    return tasks.filter((task) => {
      const matchesTitle = task.title.toLowerCase().includes(lower);
      const matchesDescription =
        task.description?.toLowerCase().includes(lower) ?? false;
      const matchesRoles = task.roles.some((role) =>
        role.toLowerCase().includes(lower)
      );
      return matchesTitle || matchesDescription || matchesRoles;
    });
  }, [search, tasks]);

  const handleAdd = (task: TaskTemplate) => {
    addTask(task);
    const message = t(
      "therapist.taskLibrary.feedback",
      "\"{title}\" added to builder.",
      { title: task.title }
    );
    showNotification({ type: "success", text: message });
  };

  const handlePublishToApp = async (template: TaskTemplate) => {
    if (role !== "therapist") {
      showNotification({ type: "error", text: addToAppTherapistOnly }, 5000);
      return;
    }

    const ownerId = user?.uid ?? template.ownerId ?? "";
    if (!ownerId) {
      showNotification({ type: "error", text: addToAppOwnerMissing }, 5000);
      return;
    }

    setPublishingId(template.id);
    try {
      await createTask({
        title: template.title,
        description: template.description,
        type: template.type,
        icon: template.icon,
        visibility: template.visibility,
        config: template.config,
        ownerId,
        roles: template.roles,
        isPublished: template.isPublished,
        isTemplate: false,
      });
      showNotification({
        type: "success",
        text: addToAppSuccess(template.title),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : addToAppError;
      showNotification({ type: "error", text: message }, 5000);
    } finally {
      setPublishingId(null);
    }
  };

  const resetCreateForm = () => {
    setCreateForm(createEmptyDraft());
    setCreateError(null);
  };

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      showNotification({ type: "error", text: createLoginRequired }, 4000);
      return;
    }
    if (!createForm.title.trim()) {
      setCreateError(createTitleRequired);
      return;
    }
    if (!SUPPORTED_TASK_TYPES.includes(createForm.type)) {
      setCreateError(createUnsupportedType);
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    const now = new Date().toISOString();
    const payload: Omit<TaskTemplate, "id"> = {
      title: createForm.title.trim(),
      description: createForm.description.trim() || undefined,
      icon: createForm.icon.trim() || "assignment",
      type: createForm.type,
      visibility: createForm.visibility,
      roles: createForm.rolesText
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean),
      scope: TemplateScope.Private,
      therapistTypes: [],
      ownerId: user.uid,
      isPublished: true,
      config: ensureConfigMatchesType(createForm.type, createForm.config),
      createdAt: now,
      updatedAt: now,
    };

    if (payload.type === TaskType.Media) {
      const mediaConfig = payload.config as MediaTaskConfig | undefined;
      const trimmedUrl = mediaConfig?.mediaUrl?.trim() ?? "";
      if (!mediaConfig) {
        setCreateError(createMediaRequired);
        setCreateLoading(false);
        return;
      }
      if (mediaConfig.kind === MediaKind.Video) {
        if (mediaConfig.storagePath) {
          payload.config = {
            ...mediaConfig,
            mediaUrl: trimmedUrl || mediaConfig.mediaUrl,
          };
        } else {
          if (!trimmedUrl) {
            setCreateError(createMediaRequired);
            setCreateLoading(false);
            return;
          }
          payload.config = {
            ...mediaConfig,
            mediaUrl: trimmedUrl,
            storagePath: undefined,
            fileName: undefined,
            fileSize: undefined,
            contentType: undefined,
          };
        }
      } else {
        if (!mediaConfig.storagePath || !trimmedUrl) {
          setCreateError(createMediaRequired);
          setCreateLoading(false);
          return;
        }
        payload.config = {
          ...mediaConfig,
          mediaUrl: trimmedUrl,
        };
      }
    }

    try {
      await createTaskTemplate(payload);
      await refreshTemplates();
      const successMessage = t(
        "therapist.taskLibrary.create.success",
        "\"{title}\" created.",
        { title: payload.title }
      );
      showNotification({ type: "success", text: successMessage });
      setIsCreating(false);
      resetCreateForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : createGenericError;
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">
            {titleText}
          </h1>
          <p className="mt-2 text-sm text-brand-text-muted">
            {subtitleText}
          </p>
          <p className="text-xs text-brand-text-muted">{cadenceInfo}</p>
        </div>
        <div className="flex gap-2">
          {isCreating ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                resetCreateForm();
              }}
            >
              {createCancelLabel}
            </Button>
          ) : (
            <Button type="button" onClick={() => setIsCreating(true)}>
              {createButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {isCreating && (
        <Card className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">
              {createTitle}
            </h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              {createTypeHelp}
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-title">{createTitleLabel}</Label>
                <Input
                  id="task-title"
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{createIconLabel}</Label>
                <IconPicker
                  icons={TASK_ICON_OPTIONS}
                  value={createForm.icon}
                  onChange={(icon) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      icon,
                    }))
                  }
                  preview={
                    <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                      {createForm.icon}
                    </p>
                  }
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-type">{createTypeLabel}</Label>
                <Select
                  id="task-type"
                  value={createForm.type}
                  onChange={(event) => {
                    const nextType = event.target.value as TaskType;
                    setCreateForm((prev) => ({
                      ...prev,
                      type: nextType,
                      config: defaultTaskConfig(nextType),
                    }));
                  }}
                  disabled={createLoading}
                >
                  {SUPPORTED_TASK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`templates.taskTypes.${type}`, type)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-visibility">
                  {createVisibilityLabel}
                </Label>
                <Select
                  id="task-visibility"
                  value={createForm.visibility}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      visibility: event.target.value as TaskVisibility,
                    }))
                  }
                  disabled={createLoading}
                >
                  <option value={TaskVisibility.VisibleToPatients}>
                    {visibilityVisible}
                  </option>
                  <option value={TaskVisibility.HiddenFromPatients}>
                    {visibilityHidden}
                  </option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-roles">{createRolesLabel}</Label>
                <Input
                  id="task-roles"
                  value={createForm.rolesText}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      rolesText: event.target.value,
                    }))
                  }
                  disabled={createLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">{createDescriptionLabel}</Label>
              <Textarea
                id="task-description"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                disabled={createLoading}
                rows={3}
              />
            </div>

            <TaskConfigEditor
              type={createForm.type}
              value={ensureConfigMatchesType(createForm.type, createForm.config)}
              onChange={(config) =>
                setCreateForm((prev) => ({
                  ...prev,
                  config,
                }))
              }
              t={t}
            />

            {createError && (
              <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "..." : createSubmitLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetCreateForm}
                disabled={createLoading}
              >
                {createResetLabel}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      {notification && (
        <div
          className={`rounded-card border px-4 py-3 text-sm shadow-soft ${notification.type === "success"
              ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
              : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
          {notification.text}
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <p className="rounded-card border border-dashed border-brand-divider/70 px-4 py-6 text-sm text-brand-text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => {
            const isHidden =
              task.visibility === TaskVisibility.HiddenFromPatients;
            const fallback = {
              label: task.type,
              color: "text-brand-text-muted",
              icon: Rocket,
            };
            const labelInfo = taskTypeLabels[task.type] ?? fallback;
            const Icon = labelInfo.icon ?? Rocket;
            const rolesLabel = task.roles.length ? task.roles.join(", ") : rolesEmpty;
            return (
              <Card
                key={task.id}
                className="relative flex h-full cursor-pointer flex-col justify-between border border-brand-divider p-6 transition hover:-translate-y-1 hover:shadow-lg"
                onClick={() => handleAdd(task)}
              >
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-primary" />
                        <h2 className="text-lg font-semibold text-brand-text">
                          {task.title}
                        </h2>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs uppercase tracking-wide ${labelInfo.color}`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{labelInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-brand-text-muted line-clamp-3">
                    {task.description ??
                      t(
                        "therapist.taskLibrary.noDescription",
                        "No description available."
                      )}
                  </p>
                </div>
                <div className="mt-auto flex flex-col gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-brand-primary text-brand-primary transition-all duration-200 hover:bg-brand-primary hover:text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handlePublishToApp(task);
                    }}
                    disabled={publishingId === task.id}
                  >
                    {publishingId === task.id ? addToAppPending : addToAppLabel}
                  </Button>
                  <div className="flex items-center justify-between text-[11px] uppercase text-brand-text-muted">
                    <div className="flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      <span>{rolesLabel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isHidden ? (
                        <>
                          <EyeOff className="h-3 w-3 text-brand-primary" />
                          <span>{visibilityHidden}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 text-brand-accent" />
                          <span>{visibilityVisible}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

            );
          })}
        </div>
      )}
    </div>
  );
}
