import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuthState } from "../../shared/hooks/useAuthState";
import { useUserRole } from "../../shared/hooks/useUserRole";
import type { UserRole } from "../../shared/types/domain";
import { getIdTokenResult, signInWithEmailPassword } from "../services/auth";

const loginSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail eingeben"),
  password: z.string().min(6, "Mindestens 6 Zeichen"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function resolveDashboardPath(role: UserRole | null) {
  if (role === "admin") return "/admin";
  if (role === "therapist") return "/therapist";
  return "/";
}

export function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthState();
  const { role } = useUserRole();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(resolveDashboardPath(role), { replace: true });
    }
  }, [authLoading, navigate, role, user]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signInWithEmailPassword(values.email, values.password);
      const tokenResult = await getIdTokenResult();
      const nextRole = (tokenResult.claims.role as UserRole | undefined) ?? null;
      navigate(resolveDashboardPath(nextRole), { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login fehlgeschlagen";
      setFormError(message);
    }
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
        </Box>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          HabitDesk Login
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Box component="form" noValidate onSubmit={onSubmit}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="email"
                margin="normal"
                fullWidth
                label="E-Mail"
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="password"
                margin="normal"
                fullWidth
                label="Passwort"
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
            )}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Anmelden..." : "Anmelden"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
