import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthState } from "../../shared/hooks/useAuthState";
import type { ProgramInstance } from "../../shared/types/domain";
import { listProgramsByTherapist } from "../services/therapistApi";

type ProgramRecord = ProgramInstance & { id: string; authorId: string };

export function TherapistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listProgramsByTherapist(user.uid).then((result) => {
      if (!active) return;
      setPrograms(result);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Willkommen zurück
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => navigate("/therapist/program-builder")}>
              <CardContent>
                <BuildIcon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="h6" gutterBottom>
                  Programm erstellen
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starte den Program Builder, um neue Programme für Patienten
                  zusammenzustellen.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => navigate("/therapist/tasks")}>
              <CardContent>
                <LibraryBooksIcon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="h6" gutterBottom>
                  Task Library
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Durchsuche und verwalte die verfügbaren Tasks für deine
                  Programme.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea>
              <CardContent>
                <AssignmentIcon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="h6" gutterBottom>
                  Aktive Programme
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Du hast derzeit {programs.length} aktive Programme.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
