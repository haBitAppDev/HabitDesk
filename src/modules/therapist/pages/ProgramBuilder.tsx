import DeleteIcon from "@mui/icons-material/Delete";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { create } from "zustand";
import { useEffect, useMemo, useState } from "react";

import { useAuthState } from "../../shared/hooks/useAuthState";
import type {
  ProgramTemplate,
  TaskTemplate,
} from "../../shared/types/domain";
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
  const { title, selectedTasks, removeTask, clear, setTitle, setTasks } = useBuilderStore();
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
      setMessage({ type: "error", text: "Bitte zuerst einloggen" });
      return;
    }
    if (!patientId) {
      setMessage({ type: "error", text: "Patient-ID ist erforderlich" });
      return;
    }
    if (!selectedTasks.length) {
      setMessage({ type: "error", text: "Mindestens ein Task muss ausgewählt sein" });
      return;
    }

    setSaving(true);
    try {
      await createProgramInstance({
        authorId: user.uid,
        patientId,
        therapistId: user.uid,
        templateId: templateId || undefined,
        tasks: selectedTasks.map((task) => ({
          taskTemplateId: task.id,
          config: task.inputs ?? undefined,
        })),
        title: title || undefined,
      });
      setMessage({ type: "success", text: "Programm erfolgreich gespeichert" });
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
    }
  };

  const programsEmpty = !selectedTasks.length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Program Builder
      </Typography>
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "grid", gap: 2 }}>
          <Typography variant="h6">Programmdetails</Typography>
          <FormControl fullWidth>
            <InputLabel>Basis-Template</InputLabel>
            <Select
              value={templateId}
              label="Basis-Template"
              onChange={(event) => handleTemplateSelect(event.target.value)}
            >
              <MenuItem value="">
                <em>Keines</em>
              </MenuItem>
              {programTemplateOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Programmtitel"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="z. B. Aufbauprogramm Phase 1"
          />
          <TextField
            label="Patient-ID"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            placeholder="patient-123"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Ausgewählte Tasks</Typography>
            <Button variant="outlined" onClick={() => clear()} disabled={programsEmpty}>
              Auswahl leeren
            </Button>
          </Stack>
          {programsEmpty ? (
            <Box sx={{ textAlign: "center", color: "text.secondary", py: 6 }}>
              <PlaylistAddIcon sx={{ fontSize: 48, mb: 1 }} color="disabled" />
              <Typography>Nutze die Task Library, um Tasks hinzuzufügen.</Typography>
            </Box>
          ) : (
            <List>
              {selectedTasks.map((task) => (
                <ListItem
                  key={task.id}
                  secondaryAction={
                    <Button
                      color="secondary"
                      variant="text"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeTask(task.id)}
                    >
                      Entfernen
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Chip label={task.tags?.[0] ?? "Task"} color="primary" />
                  </ListItemAvatar>
                  <ListItemText
                    primary={task.name}
                    secondary={task.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Stack direction="row" justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              disabled={programsEmpty || saving}
              onClick={handleSave}
            >
              {saving ? "Speichern..." : "Programm speichern"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
