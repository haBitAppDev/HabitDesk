import { PenLine, Trash } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import type {
  ProgramTemplate,
  TaskTemplate,
  TherapistType,
} from "../../shared/types/domain";
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

const taskTemplateSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  description: z.string().optional(),
  tags: z.string().optional(),
  inputs: z.string().optional(),
});

type TaskTemplateFormValues = z.infer<typeof taskTemplateSchema>;

const programTemplateSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  therapistTypes: z.array(z.string()).min(1, "Mindestens ein Therapeuten-Typ"),
  taskTemplateIds: z.array(z.string()).min(1, "Mindestens ein Task-Template"),
});

type ProgramTemplateFormValues = z.infer<typeof programTemplateSchema>;

export function TemplateManager() {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [programTemplates, setProgramTemplates] = useState<ProgramTemplate[]>([]);
  const [therapistTypes, setTherapistTypes] = useState<TherapistType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const taskForm = useForm<TaskTemplateFormValues>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: { name: "", description: "", tags: "", inputs: "" },
  });

  const programForm = useForm<ProgramTemplateFormValues>({
    resolver: zodResolver(programTemplateSchema),
    defaultValues: { name: "", therapistTypes: [], taskTemplateIds: [] },
  });

  const refreshTemplates = async () => {
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
    }
  };

  useEffect(() => {
    refreshTemplates().finally(() => setLoading(false));
  }, []);

  const resetTaskForm = () => {
    setEditingTaskId(null);
    taskForm.reset({ name: "", description: "", tags: "", inputs: "" });
  };

  const resetProgramForm = () => {
    setEditingProgramId(null);
    programForm.reset({ name: "", therapistTypes: [], taskTemplateIds: [] });
  };

  const onSubmitTaskTemplate = taskForm.handleSubmit(async (values) => {
    const tags = values.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    let inputs: Record<string, unknown> | undefined;
    if (values.inputs) {
      try {
        inputs = JSON.parse(values.inputs);
      } catch (err) {
        taskForm.setError("inputs", {
          type: "manual",
          message: "JSON konnte nicht geparst werden",
        });
        return;
      }
    }

    const payload = {
      name: values.name,
      description: values.description || undefined,
      tags,
      inputs,
    } satisfies Omit<TaskTemplate, "id">;

    try {
      if (editingTaskId) {
        await updateTaskTemplate(editingTaskId, payload);
      } else {
        await createTaskTemplate(payload);
      }
      await refreshTemplates();
      resetTaskForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  });

  const onSubmitProgramTemplate = programForm.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      therapistTypes: values.therapistTypes,
      taskTemplateIds: values.taskTemplateIds,
    } satisfies Omit<ProgramTemplate, "id">;

    try {
      if (editingProgramId) {
        await updateProgramTemplate(editingProgramId, payload);
      } else {
        await createProgramTemplate(payload);
      }
      await refreshTemplates();
      resetProgramForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  });

  const handleEditTask = (template: TaskTemplate) => {
    setEditingTaskId(template.id);
    taskForm.reset({
      name: template.name,
      description: template.description ?? "",
      tags: template.tags?.join(", ") ?? "",
      inputs: template.inputs ? JSON.stringify(template.inputs, null, 2) : "",
    });
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await removeTaskTemplate(id);
      await refreshTemplates();
      if (editingTaskId === id) {
        resetTaskForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEditProgram = (template: ProgramTemplate) => {
    setEditingProgramId(template.id);
    programForm.reset({
      name: template.name,
      therapistTypes: template.therapistTypes,
      taskTemplateIds: template.taskTemplateIds,
    });
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await removeProgramTemplate(id);
      await refreshTemplates();
      if (editingProgramId === id) {
        resetProgramForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const taskTemplateOptions = useMemo(
    () =>
      taskTemplates.map((template) => ({
        value: template.id,
        label: template.name,
      })),
    [taskTemplates]
  );

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
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">
          Templates verwalten
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Halte deine Task- und Programmvorlagen auf dem neuesten Stand, damit Therapie-Workflows
          reibungslos laufen.
        </p>
      </div>

      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-text">Task Templates</h2>
              <p className="text-sm text-brand-text-muted">
                Definiere wiederverwendbare therapeutische Aufgaben.
              </p>
            </div>
            <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
              {taskTemplates.length} aktiv
            </span>
          </div>
          <form onSubmit={onSubmitTaskTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Name</Label>
              <Controller
                name="name"
                control={taskForm.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input id="task-name" {...field} placeholder="Beispiel: Atemübung" />
                    {fieldState.error && (
                      <p className="text-xs text-red-600">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Beschreibung</Label>
              <Controller
                name="description"
                control={taskForm.control}
                render={({ field }) => (
                  <Textarea
                    id="task-description"
                    {...field}
                    rows={3}
                    placeholder="Was ist das Ziel der Aufgabe?"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-tags">Tags (kommagetrennt)</Label>
              <Controller
                name="tags"
                control={taskForm.control}
                render={({ field }) => (
                  <Input id="task-tags" {...field} placeholder="Mindfulness, Bewegung, ..." />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-inputs">Inputs (JSON)</Label>
              <Controller
                name="inputs"
                control={taskForm.control}
                render={({ field, fieldState }) => (
                  <>
                    <Textarea
                      id="task-inputs"
                      {...field}
                      rows={4}
                      placeholder='z.B. {"duration": 15}'
                    />
                    {fieldState.error && (
                      <p className="text-xs text-red-600">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">
                {editingTaskId ? "Task Template aktualisieren" : "Task Template anlegen"}
              </Button>
              {editingTaskId && (
                <Button type="button" variant="outline" onClick={resetTaskForm}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-3">
            {taskTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-start justify-between rounded-[14px] border border-brand-divider/70 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-brand-text">{template.name}</p>
                  {template.tags && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-brand-text-muted">
                      {template.tags.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditTask(template)}
                    className="rounded-full border border-brand-divider/60 p-2 text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary"
                  >
                    <PenLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(template.id)}
                    className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {taskTemplates.length === 0 && (
              <p className="rounded-[14px] border border-dashed border-brand-divider/70 px-4 py-6 text-center text-sm text-brand-text-muted">
                Noch keine Task Templates angelegt.
              </p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-text">Program Templates</h2>
              <p className="text-sm text-brand-text-muted">
                Kombiniere Tasks zu strukturierten Therapieprogrammen.
              </p>
            </div>
            <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
              {programTemplates.length} aktiv
            </span>
          </div>
          <form onSubmit={onSubmitProgramTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Name</Label>
              <Controller
                name="name"
                control={programForm.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input id="program-name" {...field} placeholder="Beispiel: Schmerzbewältigung" />
                    {fieldState.error && (
                      <p className="text-xs text-red-600">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-therapist-types">Therapeuten-Typen</Label>
              <Controller
                name="therapistTypes"
                control={programForm.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      id="program-therapist-types"
                      multiple
                      value={field.value}
                      onChange={(event) => {
                        const selected = Array.from(
                          event.target.selectedOptions
                        ).map((option) => option.value);
                        field.onChange(selected);
                      }}
                    >
                      {therapistTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Select>
                    {fieldState.error && (
                      <p className="text-xs text-red-600">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-task-templates">Task Templates</Label>
              <Controller
                name="taskTemplateIds"
                control={programForm.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      id="program-task-templates"
                      multiple
                      value={field.value}
                      onChange={(event) => {
                        const selected = Array.from(
                          event.target.selectedOptions
                        ).map((option) => option.value);
                        field.onChange(selected);
                      }}
                    >
                      {taskTemplateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    {fieldState.error && (
                      <p className="text-xs text-red-600">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">
                {editingProgramId
                  ? "Program Template aktualisieren"
                  : "Program Template anlegen"}
              </Button>
              {editingProgramId && (
                <Button type="button" variant="outline" onClick={resetProgramForm}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-3">
            {programTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-start justify-between rounded-[14px] border border-brand-divider/70 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-brand-text">{template.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px] uppercase tracking-wide text-brand-text-muted">
                    {template.taskTemplateIds
                      .map(
                        (id) =>
                          taskTemplateOptions.find((option) => option.value === id)?.label ?? id
                      )
                      .map((label) => (
                        <span key={label} className="rounded-full bg-brand-light px-2 py-1">
                          {label}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditProgram(template)}
                    className="rounded-full border border-brand-divider/60 p-2 text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary"
                  >
                    <PenLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProgram(template.id)}
                    className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {programTemplates.length === 0 && (
              <p className="rounded-[14px] border border-dashed border-brand-divider/70 px-4 py-6 text-center text-sm text-brand-text-muted">
                Noch keine Program Templates angelegt.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
