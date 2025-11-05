import { PenLine, PlusCircle, Trash } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { IconPicker } from "../../../components/ui/icon-picker";
import { TASK_ICON_OPTIONS } from "../../shared/constants/iconOptions";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import {
  createTaskTemplate,
  listTaskTemplates,
  listTherapistTypes,
  removeTaskTemplate,
  updateTaskTemplate,
} from "../../therapist/services/therapistApi";
import type {
  TaskConfig,
  TaskTemplate,
  TemplateScope as TemplateScopeType,
  TherapistType,
} from "../../shared/types/domain";
import { TaskType, TaskVisibility, TemplateScope } from "../../shared/types/domain";
import {
  Field,
  TaskConfigEditor,
  type TranslateFn,
} from "../../shared/components/TaskConfigEditor";
import {
  defaultTaskConfig,
  ensureConfigMatchesType,
} from "../../shared/utils/taskConfig";
import { useI18n } from "../../../i18n/I18nProvider";

 

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
  visibility: TaskVisibility;
  rolesText: string;
  scope: TemplateScopeType;
  therapistTypes: string[];
  isPublished: boolean;
  config: TaskConfig;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const createEmptyTaskForm = (): TaskTemplateFormState => ({
  title: "",
  description: "",
  icon: TASK_ICON_OPTIONS[0],
  type: TaskType.Timer,
  visibility: TaskVisibility.VisibleToPatients,
  rolesText: "",
  scope: TemplateScope.Global,
  therapistTypes: [],
  isPublished: true,
  config: defaultTaskConfig(TaskType.Timer),
  ownerId: "",
  createdAt: undefined,
  updatedAt: undefined,
});

interface TaskTemplatePaneProps {
  form: TaskTemplateFormState;
  setForm: Dispatch<SetStateAction<TaskTemplateFormState>>;
  editingId: string | null;
  templates: TaskTemplate[];
  onSubmit: () => void;
  onReset: () => void;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (id: string) => void;
  therapistTypeOptions: Array<{ value: string; label: string }>;
  t: TranslateFn;
}

export function TemplateManager() {
  const { t } = useI18n();
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [therapistTypes, setTherapistTypes] = useState<TherapistType[]>([]);
  const [taskForm, setTaskForm] = useState<TaskTemplateFormState>(createEmptyTaskForm());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const [tasks, therapists] = await Promise.all([
        listTaskTemplates(),
        listTherapistTypes(),
      ]);
      setTaskTemplates(tasks);
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
    const therapistTypes =
      taskForm.scope === TemplateScope.TherapistType
        ? Array.from(
            new Set(
              taskForm.therapistTypes
                .map((type) => type.trim())
                .filter((type) => type.length > 0)
            )
          )
        : [];
    const scope: TemplateScopeType =
      taskForm.scope === TemplateScope.TherapistType && therapistTypes.length === 0
        ? TemplateScope.Global
        : taskForm.scope;
    const payload: Omit<TaskTemplate, "id"> = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      icon: taskForm.icon,
      type: taskForm.type,
      visibility: taskForm.visibility,
      roles: roleStringToArray(taskForm.rolesText),
      scope,
      therapistTypes,
      ownerId: taskForm.ownerId?.trim() || undefined,
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

  const startEditTask = (template: TaskTemplate) => {
    setTaskForm({
      title: template.title,
      description: template.description ?? "",
      icon: template.icon,
      type: template.type,
      visibility: template.visibility,
      rolesText: roleArrayToString(template.roles),
      scope:
        template.scope ??
        (template.therapistTypes?.length ? TemplateScope.TherapistType : TemplateScope.Global),
      therapistTypes: template.therapistTypes ?? [],
      isPublished: template.isPublished,
      config: ensureConfigMatchesType(template.type, template.config),
      ownerId: template.ownerId ?? "",
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
    setEditingTaskId(template.id);
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

  const therapistTypeOptions = useMemo(
    () => therapistTypes.map((type) => ({ value: type.id, label: type.name })),
    [therapistTypes]
  );

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
            "Verwalte deine Aufgaben-Vorlagen zentral und teile sie mit deinem Team."
          )}
        </p>
      </div>

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

      <TaskTemplatePane
        form={taskForm}
        setForm={setTaskForm}
        editingId={editingTaskId}
        templates={taskTemplates}
        onSubmit={handleTaskSubmit}
        onReset={resetTaskForm}
        onEdit={startEditTask}
        onDelete={handleDeleteTask}
        therapistTypeOptions={therapistTypeOptions}
        t={t}
      />
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
  therapistTypeOptions,
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
  const scopeLabel = t("templates.tasks.form.scope.label", "Availability");
  const scopeAllLabel = t("templates.tasks.form.scope.global", "All therapists");
  const scopeTypesLabel = t(
    "templates.tasks.form.scope.types",
    "Specific therapist types"
  );
  const scopePrivateLabel = t(
    "templates.tasks.form.scope.private",
    "Private (owner only)"
  );
  const therapistTypesLabel = t(
    "templates.tasks.form.scope.typeList",
    "Select therapist types"
  );
  const therapistTypesEmpty = t(
    "templates.tasks.form.scope.noTypes",
    "No therapist types available."
  );
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
            <IconPicker
              icons={TASK_ICON_OPTIONS}
              value={form.icon}
              onChange={(icon) => setForm((prev) => ({ ...prev, icon }))}
              preview={
                <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                  {form.icon}
                </p>
              }
            />
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
          <Field label={scopeLabel}>
            <Select
              value={form.scope}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  scope: event.target.value as TemplateScopeType,
                  therapistTypes:
                    event.target.value === TemplateScope.TherapistType
                      ? prev.therapistTypes
                      : [],
                }))
              }
            >
              <option value={TemplateScope.Global}>{scopeAllLabel}</option>
              <option value={TemplateScope.TherapistType}>{scopeTypesLabel}</option>
              <option value={TemplateScope.Private}>{scopePrivateLabel}</option>
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

        {form.scope === TemplateScope.TherapistType && (
          <Field label={therapistTypesLabel} fullWidth>
            {therapistTypeOptions.length === 0 ? (
              <p className="text-sm text-brand-text-muted">{therapistTypesEmpty}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {therapistTypeOptions.map((option) => {
                  const selected = form.therapistTypes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          therapistTypes: selected
                            ? prev.therapistTypes.filter((value) => value !== option.value)
                            : [...prev.therapistTypes, option.value],
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        selected
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                          : "border-brand-divider/70 text-brand-text hover:bg-brand-light/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
        )}

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
                      {t(`templates.taskTypes.${template.type}`, template.type)}
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
