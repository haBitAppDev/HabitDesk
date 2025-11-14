import { MinusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { create } from "zustand";

import { useI18n } from "../../../i18n/I18nProvider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { ColorPicker } from "../../../components/ui/color-picker";
import { IconPicker } from "../../../components/ui/icon-picker";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import { useAuthState } from "../../shared/hooks/useAuthState";
import { useUserRole } from "../../shared/hooks/useUserRole";
import type {
  UserRole,
  Program,
  Task,
  EvidenceTaskConfig,
  ProgramTemplate,
  TaskTemplate,
  TaskConfig,
} from "../../shared/types/domain";
import {
  ProgramType,
  TaskVisibility,
  TaskType,
  TemplateScope,
  programTypeToCadence,
} from "../../shared/types/domain";
import {
  PROGRAM_COLOR_OPTIONS,
  PROGRAM_ICON_OPTIONS,
} from "../../shared/constants/iconOptions";
import {
  createProgram,
  createProgramTemplate,
  createTask,
  removeProgramTemplate,
  updateProgram,
  updateProgramTemplate,
  updateTask,
  removeProgram,
  removeTask as removeTaskFromApi,
  listProgramTemplates,
  listTaskTemplates,
  listAllPrograms,
  listProgramsByOwner,
  getProgram,
  getTasksByIds,
} from "../services/therapistApi";

interface BuilderTask {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  icon: string;
  visibility: TaskVisibility;
  config?: TaskConfig;
  roles: string[];
  isPublished: boolean;
  source: "template" | "existing";
  templateId?: string;
  taskId?: string;
  ownerId?: string;
  evidenceConfig?: EvidenceTaskConfig;
}

const createBuilderTaskFromTemplate = (template: TaskTemplate): BuilderTask => ({
  id: template.id,
  title: template.title,
  description: template.description,
  type: template.type,
  icon: template.icon,
  visibility: template.visibility,
  config: template.config,
  roles: template.roles,
  isPublished: template.isPublished,
  source: "template",
  templateId: template.id,
  evidenceConfig: template.evidenceConfig,
});

const createBuilderTaskFromExisting = (task: Task): BuilderTask => ({
  id: task.id,
  title: task.title,
  description: task.description,
  type: task.type,
  icon: task.icon,
  visibility: task.visibility,
  config: task.config,
  roles: task.roles,
  isPublished: task.isPublished,
  source: "existing",
  taskId: task.id,
  ownerId: task.ownerId,
  evidenceConfig: task.evidenceConfig,
});

interface BuilderState {
  title: string;
  selectedTasks: BuilderTask[];
  addTask: (task: TaskTemplate) => void;
  removeTask: (taskId: string) => void;
  clear: () => void;
  setTitle: (title: string) => void;
  setTasks: (tasks: BuilderTask[]) => void;
}

interface ProgramTemplateFormState {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  type: ProgramType;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  title: "",
  selectedTasks: [],
  addTask: (task) =>
    set((state) => {
      const builderTask = createBuilderTaskFromTemplate(task);
      if (state.selectedTasks.some((current) => current.id === builderTask.id)) {
        return state;
      }
      return { selectedTasks: [...state.selectedTasks, builderTask] };
    }),
  removeTask: (taskId) =>
    set((state) => ({
      selectedTasks: state.selectedTasks.filter((task) => task.id !== taskId),
    })),
  clear: () => set({ selectedTasks: [] }),
  setTitle: (title) => set({ title }),
  setTasks: (tasks) => set({ selectedTasks: tasks }),
}));

export function ProgramBuilder() {
  const { user } = useAuthState();
  const { role, loading: roleLoading } = useUserRole();
  const { t } = useI18n();
  const {
    title,
    selectedTasks,
    addTask,
    removeTask: removeTaskFromSelection,
    clear,
    setTitle,
    setTasks,
  } = useBuilderStore();
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [programTemplates, setProgramTemplates] = useState<ProgramTemplate[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [useTemplateSelection, setUseTemplateSelection] = useState(false);
  const [programType, setProgramType] = useState<ProgramType>(ProgramType.AdaptiveNormal);
  const [originalProgram, setOriginalProgram] = useState<Program | null>(null);
  const [originalTasks, setOriginalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [programLoading, setProgramLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<ProgramTemplateFormState>({
    title: "",
    subtitle: "",
    description: "",
    icon: PROGRAM_ICON_OPTIONS[0],
    color: PROGRAM_COLOR_OPTIONS[0],
    type: ProgramType.AdaptiveNormal,
  });
  const [templateFormError, setTemplateFormError] = useState<string | null>(null);
  const [templateFormLoading, setTemplateFormLoading] = useState(false);

  const activeTemplate = useMemo(() => {
    if (!templateId) return null;
    return programTemplates.find((template) => template.id === templateId) ?? null;
  }, [programTemplates, templateId]);

  const isEditing = Boolean(programId);
  const isAdmin = role === "admin";

  const heading = t("therapist.programBuilder.title", "Program Builder");
  const subheading = t(
    "therapist.programBuilder.subtitle",
    "Assemble programs by combining tasks or using templates."
  );
  const programLabel = t("therapist.programBuilder.fields.program", "Existing program");
  const programPlaceholder = t(
    "therapist.programBuilder.placeholders.program",
    "Select program"
  );
  const templateLabel = t("therapist.programBuilder.fields.template", "Base template");
  const noneOptionLabel = t("therapist.programBuilder.fields.none", "None");
  const templateToggleLabel = t(
    "therapist.programBuilder.fields.useTemplate",
    "Use template"
  );
  const templateToggleHelp = t(
    "therapist.programBuilder.fields.useTemplateHelp",
    "Enable to load a predefined program template."
  );
  const titleLabel = t("therapist.programBuilder.fields.title", "Program title");
  const programTypeLabel = t("therapist.programBuilder.fields.programType", "Program type");
  const saveLabel = isEditing
    ? t("therapist.programBuilder.actions.update", "Update program")
    : t("therapist.programBuilder.actions.save", "Save program");
  const savingLabel = isEditing
    ? t("therapist.programBuilder.actions.updating", "Updating…")
    : t("therapist.programBuilder.actions.saving", "Saving…");
  const resetLabel = t("therapist.programBuilder.actions.reset", "Reset selection");
  const loginRequiredMsg = t(
    "therapist.programBuilder.messages.loginRequired",
    "Please sign in first."
  );
  const tasksRequiredMsg = t(
    "therapist.programBuilder.messages.tasksRequired",
    "Select at least one task."
  );
  const successMsg = isEditing
    ? t("therapist.programBuilder.messages.updated", "Program updated successfully.")
    : t("therapist.programBuilder.messages.success", "Program saved successfully.");
  const genericErrorMsg = t("therapist.programBuilder.messages.error", "Saving failed.");
  const programLoadErrorMsg = t(
    "therapist.programBuilder.messages.programLoadError",
    "Unable to load program."
  );
  const ownerMissingMsg = t(
    "therapist.programBuilder.messages.ownerMissing",
    "Unable to determine a program owner. Please sign in again."
  );
  const adminTemplateBlockedMsg = t(
    "therapist.programBuilder.messages.adminTemplateBlocked",
    "Only therapists can create new tasks from templates. Ask a therapist to create the program or remove template-based tasks."
  );
  const selectedTasksTitle = t(
    "therapist.programBuilder.selectedTasks.title",
    "Selected tasks"
  );
  const selectedTasksEmpty = t(
    "therapist.programBuilder.selectedTasks.empty",
    "No tasks selected yet. Add tasks from the library."
  );
  const libraryTitle = t("therapist.programBuilder.library.title", "Task library");
  const librarySubtitle = t(
    "therapist.programBuilder.library.subtitle",
    "Add tasks with one click. Duplicate entries are prevented."
  );
  const libraryAdd = t("therapist.programBuilder.library.add", "Add");
  const libraryAdded = t("therapist.programBuilder.library.added", "Added");
  const libraryConfig = t("therapist.programBuilder.library.config", "Show configuration");
  const libraryVisibilityVisible = t("therapist.taskLibrary.visibility.visible", "Visible");
  const libraryVisibilityHidden = t("therapist.taskLibrary.visibility.hidden", "Hidden");
  const frequencyDaily = t("templates.frequency.daily", "Daily");
  const frequencyWeekly = t("templates.frequency.weekly", "Weekly");
  const currentProgramType = programType;
  const cadenceKey = programTypeToCadence(currentProgramType);
  const cadenceLabel = cadenceKey === "daily" ? frequencyDaily : frequencyWeekly;
  const templateManagerTitle = t(
    "therapist.programBuilder.templates.title",
    "Program templates"
  );
  const templateManagerSubtitle = t(
    "therapist.programBuilder.templates.subtitle",
    "Create reusable blueprints and manage existing ones directly here."
  );
  const templateCreateButton = t(
    "therapist.programBuilder.templates.createButton",
    "Save current selection as template"
  );
  const templateFormCreateTitle = t(
    "therapist.programBuilder.templates.form.createTitle",
    "New program template"
  );
  const templateFormEditTitle = t(
    "therapist.programBuilder.templates.form.editTitle",
    "Edit program template"
  );
  const templateFormSubmitCreate = t(
    "therapist.programBuilder.templates.form.submitCreate",
    "Save template"
  );
  const templateFormSubmitUpdate = t(
    "therapist.programBuilder.templates.form.submitUpdate",
    "Update template"
  );
  const templateFormCancel = t(
    "therapist.programBuilder.templates.form.cancel",
    "Cancel"
  );
  const templateFormTitleLabel = t(
    "therapist.programBuilder.templates.form.titleLabel",
    "Title"
  );
  const templateFormSubtitleLabel = t(
    "therapist.programBuilder.templates.form.subtitleLabel",
    "Subtitle"
  );
  const templateFormDescriptionLabel = t(
    "therapist.programBuilder.templates.form.descriptionLabel",
    "Description"
  );
  const templateFormIconLabel = t(
    "therapist.programBuilder.templates.form.iconLabel",
    "Icon"
  );
  const templateFormColorLabel = t(
    "therapist.programBuilder.templates.form.colorLabel",
    "Accent color"
  );
  const templateFormTypeLabel = t(
    "therapist.programBuilder.templates.form.typeLabel",
    "Program type"
  );
  const templateFormTasksMissingMsg = t(
    "therapist.programBuilder.templates.errors.noTasks",
    "Select at least one task before saving the template."
  );
  const templateFormRequiresTemplatesMsg = t(
    "therapist.programBuilder.templates.errors.requiresTemplates",
    "Only tasks based on templates can be saved as a program template."
  );
  const templateFormTitleRequired = t(
    "therapist.programBuilder.templates.errors.titleRequired",
    "Please provide a template title."
  );
  const templateFormOwnerMissing = t(
    "therapist.programBuilder.templates.errors.ownerMissing",
    "Unable to determine a template owner."
  );
  const templateSavedMsg = t(
    "therapist.programBuilder.templates.messages.created",
    "Template saved."
  );
  const templateUpdatedMsg = t(
    "therapist.programBuilder.templates.messages.updated",
    "Template updated."
  );
  const templateDeletedMsg = t(
    "therapist.programBuilder.templates.messages.deleted",
    "Template deleted."
  );
  const templateDeleteConfirm = (templateTitle: string) =>
    t(
      "therapist.programBuilder.templates.confirmDelete",
      "Delete \"{title}\"? This action cannot be undone.",
      { title: templateTitle }
    );
  const templateListEmpty = t(
    "therapist.programBuilder.templates.empty",
    "No templates yet."
  );
  const templateTaskCountLabel = (count: number) =>
    t("therapist.programBuilder.templates.taskCount", "{count} tasks", {
      count,
    });
  const templateEditLabel = t("therapist.programBuilder.templates.edit", "Edit");
  const templateDeleteLabel = t("therapist.programBuilder.templates.delete", "Delete");

  useEffect(() => {
    if (roleLoading) return;

    let active = true;
    setLoading(true);
    const loadPrograms =
      role === "admin"
        ? listAllPrograms()
        : listProgramsByOwner(user?.uid ?? "");

    Promise.all([
      listTaskTemplates(),
      listProgramTemplates(),
      loadPrograms,
    ])
      .then(([tasks, programs, loadedPrograms]) => {
        if (!active) return;
        setTaskTemplates(tasks);
        setProgramTemplates(programs);
        setPrograms(loadedPrograms);
      })
      .catch((err) => {
        if (!active) return;
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : genericErrorMsg,
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [genericErrorMsg, role, roleLoading, user?.uid]);

  const resetTemplateFormState = useCallback(() => {
    setTemplateForm({
      title: "",
      subtitle: "",
      description: "",
      icon: PROGRAM_ICON_OPTIONS[0],
      color: PROGRAM_COLOR_OPTIONS[0],
      type: programType,
    });
    setTemplateFormError(null);
    setEditingTemplateId(null);
    setIsTemplateFormOpen(false);
  }, [programType]);

  const resetBuilder = useCallback(() => {
    clear();
    setTemplateId("");
    setUseTemplateSelection(false);
    setProgramId("");
    setOriginalProgram(null);
    setOriginalTasks([]);
    setTitle("");
    setProgramType(ProgramType.AdaptiveNormal);
    resetTemplateFormState();
  }, [
    clear,
    setOriginalProgram,
    setOriginalTasks,
    setProgramId,
    setTemplateId,
    resetTemplateFormState,
    setUseTemplateSelection,
    setTitle,
    setProgramType,
  ]);

  const loadProgramDetails = useCallback(
    async (id: string) => {
      setProgramLoading(true);
      try {
        const program = await getProgram(id);
        if (!program) {
          setMessage({ type: "error", text: programLoadErrorMsg });
          resetBuilder();
          return;
        }
        setOriginalProgram(program);
        setTitle(program.title);
        setProgramType(program.type);
        const tasks = await getTasksByIds(program.taskIds);
        setOriginalTasks(tasks);
        const orderedTasks = program.taskIds
          .map((taskId) => tasks.find((task) => task.id === taskId))
          .filter((task): task is Task => Boolean(task))
          .map(createBuilderTaskFromExisting);
        setTasks(orderedTasks);
        setUseTemplateSelection(false);
        setTemplateId("");
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : genericErrorMsg,
        });
      } finally {
        setProgramLoading(false);
      }
    },
    [
      genericErrorMsg,
      programLoadErrorMsg,
      resetBuilder,
      setMessage,
      setOriginalProgram,
      setOriginalTasks,
      setProgramType,
      setUseTemplateSelection,
      setTasks,
      setTemplateId,
      setTitle,
    ]
  );

  const programTemplateOptions = useMemo(
    () =>
      programTemplates.map((program) => ({
        value: program.id,
        label: program.title,
      })),
    [programTemplates]
  );

  const refreshProgramTemplates = useCallback(async () => {
    const templates = await listProgramTemplates();
    setProgramTemplates(templates);
  }, []);

  const programOptions = useMemo(
    () =>
      programs
        .map((program) => ({
          value: program.id,
          label:
            program.title ||
            t("therapist.programBuilder.labels.untitledProgram", "Untitled program"),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [programs, t]
  );

  const programTypeOptions = useMemo(
    () => [
      {
        value: ProgramType.Challenge,
        label: t("therapist.programBuilder.programTypes.challenge", "Challenge"),
      },
      {
        value: ProgramType.Sequential,
        label: t("therapist.programBuilder.programTypes.sequential", "Sequential"),
      },
      {
        value: ProgramType.AdaptiveNormal,
        label: t(
          "therapist.programBuilder.programTypes.adaptiveNormal",
          "Adaptive / Normal"
        ),
      },
    ],
    [t]
  );

  const handleTemplateSelect = (value: string) => {
    setTemplateId(value);
    if (!value) {
      clear();
      setTitle("");
      setProgramType(ProgramType.AdaptiveNormal);
      return;
    }
    setUseTemplateSelection(true);
    setProgramId("");
    setOriginalProgram(null);
    setOriginalTasks([]);
    const template = programTemplates.find((item) => item.id === value);
    if (!template) return;
    const tasks = template.taskIds
      .map((taskId) => taskTemplates.find((task) => task.id === taskId))
      .filter((task): task is TaskTemplate => Boolean(task))
      .map(createBuilderTaskFromTemplate);
    setTasks(tasks);
    setTitle(template.title);
    setProgramType(template.type);
  };

  const handleTemplateToggle = (enabled: boolean) => {
    setUseTemplateSelection(enabled);
    if (!enabled) {
      setTemplateId("");
    }
  };

  const startCreateTemplate = () => {
    setTemplateForm({
      title: title.trim() || "",
      subtitle: "",
      description: "",
      icon: selectedTasks[0]?.icon ?? PROGRAM_ICON_OPTIONS[3],
      color: activeTemplate?.color ?? PROGRAM_COLOR_OPTIONS[0],
      type: programType,
    });
    setEditingTemplateId(null);
    setTemplateFormError(null);
    setIsTemplateFormOpen(true);
  };

  const startEditTemplate = (template: ProgramTemplate) => {
    setTemplateForm({
      title: template.title,
      subtitle: template.subtitle ?? "",
      description: template.description ?? "",
      icon: template.icon,
      color: template.color,
      type: template.type,
    });
    setEditingTemplateId(template.id);
    setTemplateFormError(null);
    setIsTemplateFormOpen(true);
  };

  const cancelTemplateForm = () => {
    resetTemplateFormState();
  };

  const handleTemplateFormSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!user && role !== "admin") {
      setTemplateFormError(loginRequiredMsg);
      return;
    }

    const trimmedTitle = templateForm.title.trim();
    if (!trimmedTitle) {
      setTemplateFormError(templateFormTitleRequired);
      return;
    }

    if (!selectedTasks.length) {
      setTemplateFormError(templateFormTasksMissingMsg);
      return;
    }

    const templateTaskIds = selectedTasks
      .map((task) => task.templateId)
      .filter((id): id is string => Boolean(id));

    if (templateTaskIds.length !== selectedTasks.length) {
      setTemplateFormError(templateFormRequiresTemplatesMsg);
      return;
    }

    const existingTemplate = editingTemplateId
      ? programTemplates.find((template) => template.id === editingTemplateId)
      : null;

    const ownerId =
      existingTemplate?.ownerId ?? user?.uid ?? originalProgram?.ownerId ?? "";
    if (!ownerId) {
      setTemplateFormError(templateFormOwnerMissing);
      return;
    }

    const timestamp = new Date().toISOString();
    const payload: Omit<ProgramTemplate, "id"> = {
      title: trimmedTitle,
      subtitle: templateForm.subtitle.trim(),
      description: templateForm.description.trim(),
      icon: templateForm.icon,
      color: templateForm.color,
      type: templateForm.type,
      taskIds: templateTaskIds,
      therapistTypes: existingTemplate?.therapistTypes ?? [],
      ownerId,
      roles: existingTemplate?.roles ?? [],
      scope: existingTemplate?.scope ?? TemplateScope.Private,
      isPublished: existingTemplate?.isPublished ?? true,
      createdAt: existingTemplate?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    setTemplateFormLoading(true);
    setTemplateFormError(null);

    try {
      if (editingTemplateId) {
        await updateProgramTemplate(editingTemplateId, payload);
        setMessage({ type: "success", text: templateUpdatedMsg });
      } else {
        await createProgramTemplate(payload);
        setMessage({ type: "success", text: templateSavedMsg });
      }
      await refreshProgramTemplates();
      resetTemplateFormState();
    } catch (err) {
      setTemplateFormError(
        err instanceof Error ? err.message : genericErrorMsg
      );
    } finally {
      setTemplateFormLoading(false);
    }
  };

  const handleDeleteTemplate = async (template: ProgramTemplate) => {
    const confirmed = window.confirm(templateDeleteConfirm(template.title));
    if (!confirmed) return;
    try {
      await removeProgramTemplate(template.id);
      if (editingTemplateId === template.id) {
        resetTemplateFormState();
      }
      await refreshProgramTemplates();
      setMessage({ type: "success", text: templateDeletedMsg });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : genericErrorMsg,
      });
    }
  };

  const handleProgramSelect = (value: string) => {
    if (!value) {
      resetBuilder();
      return;
    }
    setProgramId(value);
    loadProgramDetails(value);
  };

  const handleReset = () => {
    if (programId && originalProgram) {
      setTitle(originalProgram.title);
      setProgramType(originalProgram.type);
      const restoredTasks = originalProgram.taskIds
        .map((taskId) => originalTasks.find((task) => task.id === taskId))
        .filter((task): task is Task => Boolean(task))
        .map(createBuilderTaskFromExisting);
      setTasks(restoredTasks);
      return;
    }
    resetBuilder();
  };

// ---- Typisierte Helper-Funktionen ---- //

/**
 * Erstellt oder aktualisiert Tasks für das Programm.
 * Gibt ein Array aller finalen Task-IDs zurück.
 */
async function createOrUpdateTasks(
  selectedTasks: BuilderTask[],
  ownerId: string,
  createdTaskIds: string[]
): Promise<string[]> {
  const newTaskIdMap: Record<string, string> = {};

  for (const task of selectedTasks) {
    // Neue Tasks aus Template klonen
      if (task.source === "template") {
        const created = await createTask({
          title: task.title,
          description: task.description,
          type: task.type,
          icon: task.icon,
          visibility: task.visibility,
          config: task.config,
          evidenceConfig: task.evidenceConfig,
          ownerId,
          roles: task.roles,
          isPublished: task.isPublished,
          isTemplate: false,
        });
      newTaskIdMap[task.id] = created.id;
      createdTaskIds.push(created.id);
    }

    // Bestehende Tasks übernehmen, falls anderer Owner
    if (task.source === "existing" && task.taskId && task.ownerId !== ownerId) {
      await updateTask(task.taskId, { ownerId }).catch(() => undefined);
    }
  }

  return selectedTasks
    .map((t) => (t.source === "existing" ? t.taskId : newTaskIdMap[t.id]))
    .filter((id): id is string => Boolean(id));
}

/**
 * Erstellt den Payload für createProgram oder updateProgram
 */
function buildProgramPayload({
  title,
  ownerId,
  taskIds,
  currentProgramType,
  selectedTasks,
  activeTemplate,
  originalProgram,
}: {
  title: string;
  ownerId: string;
  taskIds: string[];
  currentProgramType: ProgramType;
  selectedTasks: BuilderTask[];
  activeTemplate: ProgramTemplate | null;
  originalProgram: Program | null;
}): Omit<Program, "id"> {
  return {
    title:
      title.trim() ||
      activeTemplate?.title ||
      originalProgram?.title ||
      "New program",
    subtitle: activeTemplate?.subtitle ?? originalProgram?.subtitle ?? "",
    description: activeTemplate?.description ?? originalProgram?.description ?? "",
    type: currentProgramType,
    taskIds,
    icon:
      activeTemplate?.icon ??
      originalProgram?.icon ??
      selectedTasks[0]?.icon ??
      "favorite_rounded",
    color: activeTemplate?.color ?? originalProgram?.color ?? "#1F6FEB",
    ownerId,
    roles: activeTemplate?.roles ?? originalProgram?.roles ?? [],
    scope: TemplateScope.Private,
    therapistTypes: [],
    assignedUserIds: [],
    isPublished: true,
  };
}

/**
 * Rollback bei Fehler: löscht erstellte Programme & Tasks
 */
async function rollback(programId: string | null, createdTaskIds: string[]): Promise<void> {
  if (programId) await removeProgram(programId).catch(() => undefined);
  await Promise.all(
    createdTaskIds.map((id) => removeTaskFromApi(id).catch(() => undefined))
  );
}

/**
 * Aktualisiert Programmliste basierend auf Rolle
 */
async function refreshPrograms(
  role: UserRole | null,
  userId: string | undefined,
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>
): Promise<void> {
  const refreshedPrograms =
    role === "admin"
      ? await listAllPrograms()
      : await listProgramsByOwner(userId ?? "");
  setPrograms(refreshedPrograms);
}

// ---- Optimierte handleSave-Funktion ---- //

const handleSave = async (): Promise<void> => {
    if (!user && role !== "admin") {
      setMessage({ type: "error", text: loginRequiredMsg });
      return;
    }

    if (role === "admin") {
      const hasTemplateTasks = selectedTasks.some((task) => task.source === "template");
      if (hasTemplateTasks || !isEditing) {
        setMessage({ type: "error", text: adminTemplateBlockedMsg });
        return;
      }
    }

    if (!selectedTasks.length) {
      setMessage({ type: "error", text: tasksRequiredMsg });
      return;
    }

  const ownerId =
    role === "admin"
      ? originalProgram?.ownerId || user?.uid || ""
      : user?.uid ?? originalProgram?.ownerId ?? "";

  if (!ownerId) {
    setMessage({ type: "error", text: ownerMissingMsg });
    return;
  }

  setSaving(true);
  const createdTaskIds: string[] = [];
  let createdProgramId: string | null = null;

  try {
    // Tasks erstellen / übernehmen
    const finalTaskIds = await createOrUpdateTasks(selectedTasks, ownerId, createdTaskIds);

    // Programm-Daten generieren
    const programPayload = buildProgramPayload({
      title,
      ownerId,
      taskIds: finalTaskIds,
      currentProgramType,
      selectedTasks,
      activeTemplate,
      originalProgram,
    });

    // Programm speichern (Create oder Update)
    const program = (isEditing && programId
      ? await updateProgram(programId, programPayload)
      : await createProgram(programPayload)) as Program | null;

    if (!program) {
      throw new Error(genericErrorMsg);
    }

    createdProgramId = program.id;

    // UI aktualisieren
    await refreshPrograms(role, user?.uid, setPrograms);
    await loadProgramDetails(program.id);

    setMessage({ type: "success", text: successMsg });
  } catch (err) {
    await rollback(createdProgramId, createdTaskIds);
    setMessage({
      type: "error",
      text: err instanceof Error ? err.message : genericErrorMsg,
    });
  } finally {
    setSaving(false);
    setTimeout(() => setMessage(null), 5000);
  }
};

  const programsEmpty = !selectedTasks.length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">{heading}</h1>
        <p className="mt-2 text-sm text-brand-text-muted">{subheading}</p>
      </div>

      {message && (
        <div
          className={`rounded-card border px-4 py-3 text-sm shadow-soft ${
            message.type === "success"
              ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        <Card className="flex flex-col gap-6 p-6 lg:col-span-2">
          {isAdmin ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-brand-text">
                {t("therapist.programBuilder.admin.title", "Program templates")}
              </h2>
              <p className="text-sm text-brand-text-muted">
                {t(
                  "therapist.programBuilder.admin.description",
                  "Admins can combine existing task templates and save them as program templates. To assign programs to patients, ask a therapist to publish the template."
                )}
              </p>
              <p className="text-xs text-brand-text-muted">
                {t(
                  "therapist.programBuilder.admin.hint",
                  "Add tasks from the library on the right, then use the template section below to save your blueprint."
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="program-select">{programLabel}</Label>
                  <Select
                    id="program-select"
                    value={programId}
                    onChange={(event) => handleProgramSelect(event.target.value)}
                    disabled={programLoading || !programOptions.length}
                  >
                    <option value="">{programPlaceholder}</option>
                    {programOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="use-template"
                      type="checkbox"
                      className="h-4 w-4 rounded border-brand-divider/70 text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      checked={useTemplateSelection}
                      onChange={(event) => handleTemplateToggle(event.target.checked)}
                    />
                    <Label htmlFor="use-template" className="cursor-pointer text-sm font-medium text-brand-text">
                      {templateToggleLabel}
                    </Label>
                  </div>
                  {!useTemplateSelection && (
                    <p className="text-xs text-brand-text-muted">{templateToggleHelp}</p>
                  )}
                  <Label htmlFor="template" className="text-sm font-medium text-brand-text">
                    {templateLabel}
                  </Label>
                  <Select
                    id="template"
                    value={templateId}
                    onChange={(event) => handleTemplateSelect(event.target.value)}
                    disabled={!useTemplateSelection}
                  >
                    <option value="">{noneOptionLabel}</option>
                    {programTemplateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program-type">{programTypeLabel}</Label>
                  <Select
                    id="program-type"
                    value={programType}
                    onChange={(event) => setProgramType(event.target.value as ProgramType)}
                  >
                    {programTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program-title">{titleLabel}</Label>
                  <Input
                    id="program-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("therapist.programBuilder.placeholders.title", "e.g. Phase 1")}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? savingLabel : saveLabel}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  {resetLabel}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-brand-text">{selectedTasksTitle}</h2>
            <p className="text-xs text-brand-text-muted">
              {t("therapist.programBuilder.frequencyHint", "Cadence")}: {cadenceLabel}
            </p>
            {programsEmpty ? (
              <div className="rounded-[14px] border border-dashed border-brand-divider/70 px-4 py-6 text-center text-sm text-brand-text-muted">
                {selectedTasksEmpty}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between rounded-[14px] border border-brand-divider/70 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                        {t("therapist.programBuilder.selectedTasks.step", "Step {index}", {
                          index: index + 1,
                        })}
                      </p>
                      <p className="text-sm font-semibold text-brand-text">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-brand-text-muted">{task.description}</p>
                      )}
                      <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                        {t(`templates.taskTypes.${task.type}`, task.type)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTaskFromSelection(task.id)}
                      className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="flex h-full flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">{libraryTitle}</h2>
            <p className="mt-1 text-xs text-brand-text-muted">{librarySubtitle}</p>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1">
            {taskTemplates.map((task) => {
              const alreadySelected = selectedTasks.some((item) => item.id === task.id);
              const visibilityLabel =
                task.visibility === TaskVisibility.HiddenFromPatients
                  ? libraryVisibilityHidden
                  : libraryVisibilityVisible;

              return (
                <div
                  key={task.id}
                  className="rounded-[14px] border border-brand-divider/60 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-brand-text">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 text-sm text-brand-text-muted">{task.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addTask(task)}
                      disabled={alreadySelected}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        alreadySelected
                          ? "cursor-not-allowed border-brand-divider/60 text-brand-text-muted"
                          : "border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                      }`}
                    >
                      {alreadySelected ? libraryAdded : libraryAdd}
                    </button>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-brand-text-muted">
                    {t(`templates.taskTypes.${task.type}`, task.type)} • {visibilityLabel}
                  </p>
                  {task.config && (
                    <details className="mt-2 rounded-[12px] border border-brand-divider/60 bg-brand-light/40 p-3 text-xs text-brand-text-muted">
                      <summary className="cursor-pointer select-none text-brand-primary">
                        {libraryConfig}
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">
                        {JSON.stringify(task.config, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
            {taskTemplates.length === 0 && (
              <p className="rounded-[14px] border border-dashed border-brand-divider/70 px-4 py-6 text-center text-sm text-brand-text-muted">
                {t("therapist.taskLibrary.empty", "No tasks found.")}
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="space-y-5 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">{templateManagerTitle}</h2>
            <p className="text-xs text-brand-text-muted">{templateManagerSubtitle}</p>
          </div>
          <Button type="button" variant="outline" onClick={startCreateTemplate}>
            {templateCreateButton}
          </Button>
        </div>

        {isTemplateFormOpen && (
          <form
            className="space-y-4 rounded-[14px] border border-brand-divider/60 bg-brand-light/40 p-4"
            onSubmit={handleTemplateFormSubmit}
          >
            <div>
              <h3 className="text-sm font-semibold text-brand-text">
                {editingTemplateId ? templateFormEditTitle : templateFormCreateTitle}
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="program-template-title">{templateFormTitleLabel}</Label>
                <Input
                  id="program-template-title"
                  value={templateForm.title}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  disabled={templateFormLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-template-subtitle">{templateFormSubtitleLabel}</Label>
                <Input
                  id="program-template-subtitle"
                  value={templateForm.subtitle}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      subtitle: event.target.value,
                    }))
                  }
                  disabled={templateFormLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-template-description">{templateFormDescriptionLabel}</Label>
              <Textarea
                id="program-template-description"
                value={templateForm.description}
                onChange={(event) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
                disabled={templateFormLoading}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{templateFormIconLabel}</Label>
                <IconPicker
                  icons={PROGRAM_ICON_OPTIONS}
                  value={templateForm.icon}
                  onChange={(icon) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      icon,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{templateFormColorLabel}</Label>
                <ColorPicker
                  colors={PROGRAM_COLOR_OPTIONS}
                  value={templateForm.color}
                  onChange={(color) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      color,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-template-type">{templateFormTypeLabel}</Label>
              <Select
                id="program-template-type"
                value={templateForm.type}
                onChange={(event) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    type: event.target.value as ProgramType,
                  }))
                }
                disabled={templateFormLoading}
              >
                {programTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            {templateFormError && (
              <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {templateFormError}
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={templateFormLoading}>
                {templateFormLoading
                  ? "..."
                  : editingTemplateId
                  ? templateFormSubmitUpdate
                  : templateFormSubmitCreate}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelTemplateForm}
                disabled={templateFormLoading}
              >
                {templateFormCancel}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {programTemplates.map((template) => {
            const typeLabel =
              programTypeOptions.find((option) => option.value === template.type)?.label ??
              template.type;
            return (
              <div
                key={template.id}
                className="flex flex-col gap-3 rounded-[12px] border border-brand-divider/60 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${template.color}1A` }}
                  >
                    <span
                      className="material-symbols-rounded text-2xl"
                      style={{ color: template.color }}
                    >
                      {template.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{template.title}</p>
                    <p className="text-xs text-brand-text-muted">
                      {templateTaskCountLabel(template.taskIds.length)} • {typeLabel}
                    </p>
                    {template.description && (
                      <p className="mt-1 text-xs text-brand-text-muted line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEditTemplate(template)}
                  >
                    {templateEditLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDeleteTemplate(template)}
                  >
                    {templateDeleteLabel}
                  </Button>
                </div>
              </div>
            );
          })}
          {programTemplates.length === 0 && (
            <p className="rounded-[12px] border border-dashed border-brand-divider/70 px-4 py-6 text-center text-sm text-brand-text-muted">
              {templateListEmpty}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
