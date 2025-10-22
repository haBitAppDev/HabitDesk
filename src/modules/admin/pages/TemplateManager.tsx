import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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

    let inputs: Record<string, any> | undefined;
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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Templates verwalten
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Templates
              </Typography>
              <Box
                component="form"
                onSubmit={onSubmitTaskTemplate}
                sx={{ display: "grid", gap: 2 }}
              >
                <Controller
                  name="name"
                  control={taskForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Name"
                      error={fieldState.invalid}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={taskForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Beschreibung"
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  )}
                />
                <Controller
                  name="tags"
                  control={taskForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tags (kommagetrennt)"
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="inputs"
                  control={taskForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Inputs (JSON)"
                      fullWidth
                      multiline
                      minRows={3}
                      error={fieldState.invalid}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained">
                    {editingTaskId ? "Task Template aktualisieren" : "Task Template anlegen"}
                  </Button>
                  {editingTaskId && (
                    <Button variant="outlined" onClick={resetTaskForm}>
                      Abbrechen
                    </Button>
                  )}
                </Stack>
              </Box>
            </CardContent>
            <CardActions>
              <Typography variant="subtitle2">
                {taskTemplates.length} Task Templates vorhanden
              </Typography>
            </CardActions>
          </Card>
          <List dense>
            {taskTemplates.map((template) => (
              <ListItem
                key={template.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton edge="end" onClick={() => handleEditTask(template)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteTask(template.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={template.name}
                  secondary={template.tags?.join(", ")}
                />
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Program Templates
              </Typography>
              <Box component="form" onSubmit={onSubmitProgramTemplate} sx={{ display: "grid", gap: 2 }}>
                <Controller
                  name="name"
                  control={programForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Name"
                      fullWidth
                      error={fieldState.invalid}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="therapistTypes"
                  control={programForm.control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={fieldState.invalid}>
                      <InputLabel>Therapeuten-Typen</InputLabel>
                      <Select
                        {...field}
                        multiple
                        input={<OutlinedInput label="Therapeuten-Typen" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} />
                            ))}
                          </Box>
                        )}
                      >
                        {therapistTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="taskTemplateIds"
                  control={programForm.control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={fieldState.invalid}>
                      <InputLabel>Task Templates</InputLabel>
                      <Select
                        {...field}
                        multiple
                        input={<OutlinedInput label="Task Templates" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip
                                key={value}
                                label={
                                  taskTemplateOptions.find((option) => option.value === value)?.label ??
                                  value
                                }
                              />
                            ))}
                          </Box>
                        )}
                      >
                        {taskTemplateOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained">
                    {editingProgramId
                      ? "Program Template aktualisieren"
                      : "Program Template anlegen"}
                  </Button>
                  {editingProgramId && (
                    <Button variant="outlined" onClick={resetProgramForm}>
                      Abbrechen
                    </Button>
                  )}
                </Stack>
              </Box>
            </CardContent>
            <CardActions>
              <Typography variant="subtitle2">
                {programTemplates.length} Program Templates vorhanden
              </Typography>
            </CardActions>
          </Card>
          <List dense>
            {programTemplates.map((template) => (
              <ListItem
                key={template.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton edge="end" onClick={() => handleEditProgram(template)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteProgram(template.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={template.name}
                  secondary={
                    template.taskTemplateIds
                      .map(
                        (id) =>
                          taskTemplateOptions.find((option) => option.value === id)?.label ?? id
                      )
                      .join(", ")
                  }
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Box>
  );
}
