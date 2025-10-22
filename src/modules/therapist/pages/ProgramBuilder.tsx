import { MinusCircle, PlusCircle } from "lucide-react";
import { create } from "zustand";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { useAuthState } from "../../shared/hooks/useAuthState";
import type { ProgramTemplate, TaskTemplate } from "../../shared/types/domain";
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
          text: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const programTemplateOptions = useMemo(
    () =>
      programTemplates.map((program) => ({
        value: program.id,
        label: program.name,
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
    const tasks = template.taskTemplateIds
      .map((taskId) => taskTemplates.find((task) => task.id === taskId))
      .filter((task): task is TaskTemplate => Boolean(task));
    setTasks(tasks);
    setTitle(template.name);
  };

  const handleSave = async () => {
    if (!user) {
      setMessage({ type: "error", text: "Bitte zuerst einloggen." });
      return;
    }
    if (!patientId.trim()) {
      setMessage({ type: "error", text: "Patient-ID ist erforderlich." });
      return;
    }
    if (!selectedTasks.length) {
      setMessage({ type: "error", text: "Mindestens ein Task muss ausgewählt sein." });
      return;
    }

    setSaving(true);
    try {
      await createProgramInstance({
        authorId: user.uid,
        patientId: patientId.trim(),
        therapistId: user.uid,
        templateId: templateId || undefined,
        tasks: selectedTasks.map((task) => ({
          taskTemplateId: task.id,
          config: task.inputs ?? undefined,
        })),
        title: title || undefined,
      });
      setMessage({ type: "success", text: "Programm erfolgreich gespeichert." });
      clear();
      setTemplateId("");
      setPatientId("");
      setTitle("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : String(err),
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
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">Program Builder</h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Stelle Programme zusammen, indem du Tasks kombinierst oder bestehende Templates nutzt.
        </p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-6 p-6 lg:col-span-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template">Basis-Template</Label>
                <Select
                  id="template"
                  value={templateId}
                  onChange={(event) => handleTemplateSelect(event.target.value)}
                >
                  <option value="">Keines</option>
                  {programTemplateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-title">Programmtitel</Label>
                <Input
                  id="program-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="z. B. Aufbauprogramm Phase 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-id">Patient-ID</Label>
                <Input
                  id="patient-id"
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  placeholder="patient_123"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Speichern..." : "Programm speichern"}
              </Button>
              <Button type="button" variant="outline" onClick={() => clear()}>
                Auswahl zurücksetzen
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-brand-text">Ausgewählte Tasks</h2>
            {programsEmpty ? (
              <div className="rounded-[14px] border border-dashed border-brand-divider/70 px-4 py-6 text-center text-sm text-brand-text-muted">
                Noch keine Tasks ausgewählt. Füge über die Bibliothek rechts Tasks hinzu.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between rounded-[14px] border border-brand-divider/70 bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                        Schritt {index + 1}
                      </p>
                      <p className="text-sm font-semibold text-brand-text">{task.name}</p>
                      {task.description && (
                        <p className="mt-1 text-sm text-brand-text-muted">{task.description}</p>
                      )}
                      {task.tags && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
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
            <h2 className="text-lg font-semibold text-brand-text">Task Bibliothek</h2>
            <p className="mt-1 text-xs text-brand-text-muted">
              Füge Tasks per Klick hinzu. Duplizierte Einträge werden automatisch verhindert.
            </p>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1">
            {taskTemplates.map((task) => {
              const alreadySelected = selectedTasks.some((item) => item.id === task.id);
              return (
                <div
                  key={task.id}
                  className="rounded-[14px] border border-brand-divider/60 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-brand-text">{task.name}</p>
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
                      {alreadySelected ? "Hinzugefügt" : "Hinzufügen"}
                    </button>
                  </div>
                  {task.tags && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-light px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-brand-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {task.inputs && (
                    <details className="mt-2 rounded-[12px] border border-brand-divider/60 bg-brand-light/40 p-3 text-xs text-brand-text-muted">
                      <summary className="cursor-pointer select-none text-brand-primary">
                        Konfiguration anzeigen
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">
                        {JSON.stringify(task.inputs, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
            {taskTemplates.length === 0 && (
              <p className="rounded-[14px] border border-dashed border-brand-divider/70 px-4 py-6 text-center text-sm text-brand-text-muted">
                Keine Task Templates vorhanden.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
