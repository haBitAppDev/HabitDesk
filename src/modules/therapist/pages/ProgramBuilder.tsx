import { MinusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { create } from "zustand";

import { useI18n } from "../../../i18n/I18nProvider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { useAuthState } from "../../shared/hooks/useAuthState";
import { useUserRole } from "../../shared/hooks/useUserRole";
import type {
  Patient,
  Program,
  ProgramAssignment,
  Task,
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
  assignProgramToUser,
  createProgram,
  createTask,
  updateProgram,
  updateTask,
  removeProgram,
  removeTask as removeTaskFromApi,
  removeProgramAssignment,
  listProgramTemplates,
  listTaskTemplates,
  listAllPatients,
  listPatientsByTherapist,
  listAllPrograms,
  listProgramsByOwner,
  getProgram,
  getTasksByIds,
  listAssignmentsForProgram,
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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [patientId, setPatientId] = useState<string>("");
  const [programType, setProgramType] = useState<ProgramType>(ProgramType.AdaptiveNormal);
  const [originalProgram, setOriginalProgram] = useState<Program | null>(null);
  const [originalTasks, setOriginalTasks] = useState<Task[]>([]);
  const [originalAssignments, setOriginalAssignments] = useState<ProgramAssignment[]>([]);
  const [initialPatientId, setInitialPatientId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [programLoading, setProgramLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const activeTemplate = useMemo(() => {
    if (!templateId) return null;
    return programTemplates.find((template) => template.id === templateId) ?? null;
  }, [programTemplates, templateId]);

  const isEditing = Boolean(programId);

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
  const titleLabel = t("therapist.programBuilder.fields.title", "Program title");
  const patientLabel = t("therapist.programBuilder.fields.patientId", "Patient");
  const programTypeLabel = t("therapist.programBuilder.fields.programType", "Program type");
  const patientPlaceholder = t(
    "therapist.programBuilder.placeholders.patientId",
    "Select patient"
  );
  const noPatientsLabel = t(
    "therapist.programBuilder.fields.noPatients",
    "No patients available"
  );
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
  const patientRequiredMsg = t(
    "therapist.programBuilder.messages.patientRequired",
    "Please select a patient."
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
    "Assign a therapist to this patient before saving."
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

  useEffect(() => {
    if (roleLoading) return;

    let active = true;
    setLoading(true);
    const loadPatients =
      role === "admin"
        ? listAllPatients()
        : listPatientsByTherapist(user?.uid ?? "");
    const loadPrograms =
      role === "admin"
        ? listAllPrograms()
        : listProgramsByOwner(user?.uid ?? "");

    Promise.all([
      listTaskTemplates(),
      listProgramTemplates(),
      loadPatients,
      loadPrograms,
    ])
      .then(([tasks, programs, loadedPatients, loadedPrograms]) => {
        if (!active) return;
        setTaskTemplates(tasks);
        setProgramTemplates(programs);
        setPatients(loadedPatients);
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

  useEffect(() => {
    if (!patientId) return;
    if (!patients.some((patient) => patient.id === patientId)) {
      setPatientId("");
    }
  }, [patients, patientId]);

  const resetBuilder = useCallback(() => {
    clear();
    setTemplateId("");
    setProgramId("");
    setOriginalProgram(null);
    setOriginalTasks([]);
    setOriginalAssignments([]);
    setInitialPatientId("");
    setPatientId("");
    setTitle("");
    setProgramType(ProgramType.AdaptiveNormal);
  }, [
    clear,
    setInitialPatientId,
    setOriginalAssignments,
    setOriginalProgram,
    setOriginalTasks,
    setPatientId,
    setProgramId,
    setTemplateId,
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
        const assignments = await listAssignmentsForProgram(id);
        setOriginalAssignments(assignments);
        const primaryAssignment =
          assignments.find((assignment) => assignment.isActive !== false)?.userId ??
          program.assignedUserIds?.[0] ??
          "";
        setPatientId(primaryAssignment ?? "");
        setInitialPatientId(primaryAssignment ?? "");
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
      setInitialPatientId,
      setMessage,
      setOriginalAssignments,
      setOriginalProgram,
      setOriginalTasks,
      setPatientId,
      setProgramType,
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

  const patientOptions = useMemo(
    () =>
      patients
        .map((patient) => {
          const fullName = [patient.firstname, patient.lastname].filter(Boolean).join(" ").trim();
          return {
            value: patient.id,
            label: fullName.length > 0 ? fullName : patient.id,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [patients]
  );

  const handleTemplateSelect = (value: string) => {
    setTemplateId(value);
    if (!value) {
      clear();
      setTitle("");
      setProgramType(ProgramType.AdaptiveNormal);
      return;
    }
    setProgramId("");
    setOriginalProgram(null);
    setOriginalTasks([]);
    setOriginalAssignments([]);
    setInitialPatientId("");
    setPatientId("");
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
      setPatientId(initialPatientId);
      return;
    }
    resetBuilder();
  };

  const handleSave = async () => {
    if (!user && role !== "admin") {
      setMessage({ type: "error", text: loginRequiredMsg });
      return;
    }

    const trimmedPatientId = patientId.trim();

    if (!trimmedPatientId) {
      setMessage({ type: "error", text: patientRequiredMsg });
      return;
    }

    if (!selectedTasks.length) {
      setMessage({ type: "error", text: tasksRequiredMsg });
      return;
    }

    const therapistForPatient =
      patients.find((patient) => patient.id === trimmedPatientId)?.therapistId ?? "";
    const ownerId =
      role === "admin"
        ? therapistForPatient || originalProgram?.ownerId || user?.uid || ""
        : user?.uid ?? originalProgram?.ownerId ?? "";

    if (!ownerId) {
      setMessage({ type: "error", text: ownerMissingMsg });
      return;
    }

    setSaving(true);
    const createdTaskIds: string[] = [];
    let createdProgramId: string | null = null;

    try {
      if (isEditing && programId) {
        const newTaskIdMap: Record<string, string> = {};

        for (const task of selectedTasks) {
          if (task.source !== "template") continue;
          const created = await createTask({
            title: task.title,
            description: task.description,
            type: task.type,
            icon: task.icon,
            visibility: task.visibility,
            config: task.config,
            ownerId,
            roles: task.roles,
            isPublished: task.isPublished,
            isTemplate: false,
          });
          newTaskIdMap[task.id] = created.id;
          createdTaskIds.push(created.id);
        }

        await Promise.all(
          selectedTasks
            .filter(
              (task) =>
                task.source === "existing" &&
                task.taskId &&
                task.ownerId !== ownerId
            )
            .map((task) =>
              updateTask(task.taskId as string, { ownerId }).catch(() => undefined)
            )
        );

        const finalTaskIds = selectedTasks
          .map((task) => {
            if (task.source === "existing" && task.taskId) {
              return task.taskId;
            }
            return newTaskIdMap[task.id];
          })
          .filter((id): id is string => Boolean(id));

        const updatedProgram = await updateProgram(programId, {
          title:
            title.trim() ||
            originalProgram?.title ||
            t("therapist.programBuilder.defaultTitle", "New program"),
          subtitle: originalProgram?.subtitle ?? "",
          description: originalProgram?.description ?? "",
          type: currentProgramType,
          taskIds: finalTaskIds,
          icon:
            originalProgram?.icon ??
            selectedTasks[0]?.icon ??
            "favorite_rounded",
          color: originalProgram?.color ?? "#1F6FEB",
          ownerId,
          roles: originalProgram?.roles ?? [],
          scope: originalProgram?.scope ?? TemplateScope.Private,
          therapistTypes: originalProgram?.therapistTypes ?? [],
          assignedUserIds: trimmedPatientId
            ? [trimmedPatientId]
            : originalProgram?.assignedUserIds ?? [],
          isPublished: originalProgram?.isPublished ?? true,
        });

        if (!updatedProgram) {
          throw new Error(genericErrorMsg);
        }

        const assignmentsToRemove = originalAssignments.filter(
          (assignment) => assignment.userId !== trimmedPatientId
        );
        await Promise.all(
          assignmentsToRemove.map((assignment) =>
            removeProgramAssignment(assignment.id).catch(() => undefined)
          )
        );

        const alreadyAssigned = originalAssignments.some(
          (assignment) => assignment.userId === trimmedPatientId
        );
        if (!alreadyAssigned && trimmedPatientId) {
          await assignProgramToUser({
            programId,
            userId: trimmedPatientId,
          });
        }

        const refreshedPrograms =
          role === "admin"
            ? await listAllPrograms()
            : await listProgramsByOwner(user?.uid ?? "");
        setPrograms(refreshedPrograms);
        await loadProgramDetails(programId);

        const tasksToRemove = originalTasks.filter(
          (task) => !finalTaskIds.includes(task.id)
        );
        await Promise.all(
          tasksToRemove.map((task) => removeTaskFromApi(task.id).catch(() => undefined))
        );
      } else {
        const createdTasks: Task[] = [];
        for (const task of selectedTasks) {
          const created = await createTask({
            title: task.title,
            description: task.description,
            type: task.type,
            icon: task.icon,
            visibility: task.visibility,
            config: task.config,
            ownerId,
            roles: task.roles,
            isPublished: task.isPublished,
            isTemplate: false,
          });
          createdTasks.push(created);
          createdTaskIds.push(created.id);
        }

        const program = await createProgram({
          title:
            title.trim() ||
            activeTemplate?.title ||
            t("therapist.programBuilder.defaultTitle", "New program"),
          subtitle: activeTemplate?.subtitle ?? "",
          description: activeTemplate?.description ?? "",
          type: currentProgramType,
          taskIds: createdTasks.map((task) => task.id),
          icon:
            activeTemplate?.icon ??
            selectedTasks[0]?.icon ??
            "favorite_rounded",
          color: activeTemplate?.color ?? "#1F6FEB",
          ownerId,
          roles: activeTemplate?.roles ?? [],
          scope: TemplateScope.Private,
          therapistTypes: [],
          assignedUserIds: trimmedPatientId ? [trimmedPatientId] : [],
          isPublished: true,
        });

        createdProgramId = program.id;

        await assignProgramToUser({
          programId: program.id,
          userId: trimmedPatientId,
        });

        const refreshedPrograms =
          role === "admin"
            ? await listAllPrograms()
            : await listProgramsByOwner(user?.uid ?? "");
        setPrograms(refreshedPrograms);
        setProgramId(program.id);
        await loadProgramDetails(program.id);
      }

      setMessage({ type: "success", text: successMsg });
    } catch (err) {
      if (createdProgramId) {
        await removeProgram(createdProgramId).catch(() => undefined);
      }
      if (createdTaskIds.length) {
        await Promise.all(
          createdTaskIds.map((id) =>
            removeTaskFromApi(id).catch(() => undefined)
          )
        );
      }
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
                <Label htmlFor="template">{templateLabel}</Label>
                <Select
                  id="template"
                  value={templateId}
                  onChange={(event) => handleTemplateSelect(event.target.value)}
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
              <div className="space-y-2">
                <Label htmlFor="patient-id">{patientLabel}</Label>
                <Select
                  id="patient-id"
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  disabled={!patientOptions.length}
                >
                  <option value="">
                    {patientOptions.length ? patientPlaceholder : noPatientsLabel}
                  </option>
                  {patientOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
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
    </div>
  );
}
