import { MinusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";

import { useI18n } from "../../../i18n/I18nProvider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { useAuthState } from "../../shared/hooks/useAuthState";
import type { ProgramTemplate, TaskTemplate } from "../../shared/types/domain";
import { ProgramType, TaskVisibility } from "../../shared/types/domain";
import {
  createProgramInstance,
  listProgramTemplates,
  listTaskTemplates,
} from "../services/therapistApi";

interface BuilderState {
  title: string;
  selectedTasks: TaskTemplate[];
  addTask: (task: TaskTemplate) => void;
  removeTask: (taskId: string) => void;
  clear: () => void;
  setTitle: (title: string) => void;
  setTasks: (tasks: TaskTemplate[]) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  title: "",
  selectedTasks: [],
  addTask: (task) =>
    set((state) =>
      state.selectedTasks.some((current) => current.id === task.id)
        ? state
        : { selectedTasks: [...state.selectedTasks, task] }
    ),
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
  const { t } = useI18n();
  const { title, selectedTasks, addTask, removeTask, clear, setTitle, setTasks } =
    useBuilderStore();
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [programTemplates, setProgramTemplates] = useState<ProgramTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [patientId, setPatientId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const heading = t("therapist.programBuilder.title", "Program Builder");
  const subheading = t(
    "therapist.programBuilder.subtitle",
    "Assemble programs by combining tasks or using templates."
  );
  const templateLabel = t("therapist.programBuilder.fields.template", "Base template");
  const noneOptionLabel = t("therapist.programBuilder.fields.none", "None");
  const titleLabel = t("therapist.programBuilder.fields.title", "Program title");
  const patientLabel = t("therapist.programBuilder.fields.patientId", "Patient ID");
  const saveLabel = t("therapist.programBuilder.actions.save", "Save program");
  const savingLabel = t("therapist.programBuilder.actions.saving", "Saving…");
  const resetLabel = t("therapist.programBuilder.actions.reset", "Reset selection");
  const loginRequiredMsg = t(
    "therapist.programBuilder.messages.loginRequired",
    "Please sign in first."
  );
  const patientRequiredMsg = t(
    "therapist.programBuilder.messages.patientRequired",
    "Patient ID is required."
  );
  const tasksRequiredMsg = t(
    "therapist.programBuilder.messages.tasksRequired",
    "Select at least one task."
  );
  const successMsg = t(
    "therapist.programBuilder.messages.success",
    "Program saved successfully."
  );
  const genericErrorMsg = t("therapist.programBuilder.messages.error", "Saving failed.");
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

  useEffect(() => {
    let active = true;
    Promise.all([listTaskTemplates(), listProgramTemplates()])
      .then(([tasks, programs]) => {
        if (!active) return;
        setTaskTemplates(tasks);
        setProgramTemplates(programs);
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
  }, [genericErrorMsg]);

  const programTemplateOptions = useMemo(
    () =>
      programTemplates.map((program) => ({
        value: program.id,
        label: program.title,
      })),
    [programTemplates]
  );

  const handleTemplateSelect = (value: string) => {
    setTemplateId(value);
    if (!value) {
      clear();
      return;
    }
    const template = programTemplates.find((item) => item.id === value);
    if (!template) return;
    const tasks = template.taskIds
      .map((taskId) => taskTemplates.find((task) => task.id === taskId))
      .filter((task): task is TaskTemplate => Boolean(task));
    setTasks(tasks);
    setTitle(template.title);
  };

  const handleSave = async () => {
    if (!user) {
      setMessage({ type: "error", text: loginRequiredMsg });
      return;
    }
    if (!patientId.trim()) {
      setMessage({ type: "error", text: patientRequiredMsg });
      return;
    }
    if (!selectedTasks.length) {
      setMessage({ type: "error", text: tasksRequiredMsg });
      return;
    }

    setSaving(true);
    const activeTemplate = programTemplates.find((template) => template.id === templateId);
    try {
      await createProgramInstance({
        authorId: user.uid,
        patientId: patientId.trim(),
        therapistId: user.uid,
        templateId: templateId || undefined,
        ownerId: user.uid,
        title: title || t("therapist.programBuilder.defaultTitle", "New program"),
        subtitle: activeTemplate?.subtitle ?? "",
        description: activeTemplate?.description ?? "",
        type: activeTemplate?.type ?? ProgramType.AdaptiveNormal,
        taskIds: selectedTasks.map((task) => task.id),
        tasks: selectedTasks.map((task) => ({
          taskTemplateId: task.id,
          config: task.config,
        })),
        icon: activeTemplate?.icon ?? selectedTasks[0]?.icon ?? "favorite_rounded",
        color: activeTemplate?.color ?? "#1F6FEB",
        roles: activeTemplate?.roles ?? [],
        isPublished: true,
      });
      setMessage({ type: "success", text: successMsg });
      clear();
      setTemplateId("");
      setPatientId("");
      setTitle("");
    } catch (err) {
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
                <Input
                  id="patient-id"
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  placeholder={t("therapist.programBuilder.placeholders.patientId", "patient_123")}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? savingLabel : saveLabel}
              </Button>
              <Button type="button" variant="outline" onClick={() => clear()}>
                {resetLabel}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-brand-text">{selectedTasksTitle}</h2>
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
                      onClick={() => removeTask(task.id)}
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
