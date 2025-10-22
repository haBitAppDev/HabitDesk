import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import type { UserProfile, UserRole } from "../../shared/types/domain";
import { listUsers, setUserRole } from "../services/adminApi";

const ROLES: UserRole[] = ["admin", "therapist", "patient"];
type UserRecord = UserProfile & { id: string };

export function RolesManager() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listUsers()
      .then((results) => {
        if (!active) return;
        setUsers(results);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setUpdating(uid);
    try {
      await setUserRole(uid, role);
      setUsers((prev) =>
        prev.map((user) => (user.uid === uid ? { ...user, role } : user))
      );
      setSnackbar(`Rolle erfolgreich auf ${role} gesetzt`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdating(null);
    }
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
        Rollen verwalten
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>E-Mail</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Rolle</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid} hover>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id={`role-${user.uid}`}>Rolle</InputLabel>
                    <Select
                      labelId={`role-${user.uid}`}
                      label="Rolle"
                      value={user.role}
                      onChange={(event) =>
                        handleRoleChange(user.uid, event.target.value as UserRole)
                      }
                      disabled={updating === user.uid}
                    >
                      {ROLES.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar ?? undefined}
      />
    </Box>
  );
}
