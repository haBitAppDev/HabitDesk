import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useEffect, useMemo, useState } from "react";

import type { TaskTemplate } from "../../shared/types/domain";
import { listTaskTemplates } from "../services/therapistApi";
import { useBuilderStore } from "./ProgramBuilder";

export function TaskLibrary() {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const addTask = useBuilderStore((state) => state.addTask);

  useEffect(() => {
    let active = true;
    listTaskTemplates()
      .then((templates) => {
        if (!active) return;
        setTasks(templates);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const lower = search.toLowerCase();
    return tasks.filter((task) => {
      if (!lower) return true;
      return (
        task.name.toLowerCase().includes(lower) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(lower))
      );
    });
  }, [search, tasks]);

  const handleAddToBuilder = (task: TaskTemplate) => {
    addTask(task);
    setSnackbarOpen(true);
  };

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
        Task Library
      </Typography>
      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Nach Namen oder Tag suchen"
        fullWidth
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton size="small">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Grid container spacing={3}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card
              sx={{ cursor: "pointer" }}
              onClick={() => handleAddToBuilder(task)}
            >
              <CardContent>
                <Typography variant="h6">{task.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {task.description ?? "Keine Beschreibung"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {task.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        message="Zum Program Builder hinzugefügt"
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
}
