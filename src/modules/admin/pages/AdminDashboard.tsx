import { useEffect, useState } from "react";
import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import Grid from "@mui/material/GridLegacy";

import { listUsers } from "../services/adminApi";
import {
  listProgramTemplates,
  listTaskTemplates,
} from "../../therapist/services/therapistApi";

interface DashboardStats {
  users: number;
  programTemplates: number;
  taskTemplates: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    programTemplates: 0,
    taskTemplates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([listUsers(), listProgramTemplates(), listTaskTemplates()])
      .then(([users, programs, tasks]) => {
        if (!active) return;
        setStats({
          users: users.length,
          programTemplates: programs.length,
          taskTemplates: tasks.length,
        });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Nutzer gesamt</Typography>
              <Typography variant="h3">{stats.users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Program Templates</Typography>
              <Typography variant="h3">{stats.programTemplates}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Task Templates</Typography>
              <Typography variant="h3">{stats.taskTemplates}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
