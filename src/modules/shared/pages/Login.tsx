import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Alert, Avatar, Box, Button, Paper, TextField, Typography } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuthState } from "../../shared/hooks/useAuthState";
import { useUserRole } from "../../shared/hooks/useUserRole";
import type { UserRole } from "../../shared/types/domain";
import { getIdTokenResult, signInWithEmailPassword } from "../services/auth";
import { useI18n } from "../../../i18n/I18nProvider";

type LoginFormValues = {
  email: string;
  password: string;
};

const PATIENT_PRIMARY = "#AD8501";

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
  const { t } = useI18n();

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .email(t("auth.validation.email", "Please enter a valid email address.")),
        password: z
          .string()
          .min(6, t("auth.validation.password", "At least 6 characters.")),
      }),
    [t]
  );

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
        error instanceof Error ? error.message : t("auth.errors.generic", "Login failed.");
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
      <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: "100%", textAlign: "left" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            {t("auth.title", "HabitDesk Login")}
          </Typography>
        </Box>
        <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 3 }}>
          {t("auth.subtitle", "Sign in to manage programs and tasks.")}
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError || t("auth.errors.generic", "Login failed.")}
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
                label={t("auth.fields.email", "Email")}
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "transparent",
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: PATIENT_PRIMARY,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: PATIENT_PRIMARY,
                    },
                    "& input": {
                      backgroundColor: "transparent !important",
                    },
                    "& input:-webkit-autofill": {
                      WebkitBoxShadow: "0 0 0 100px transparent inset",
                      WebkitTextFillColor: "inherit",
                    },
                  },
                }}
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
                label={t("auth.fields.password", "Password")}
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "transparent",
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: PATIENT_PRIMARY,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: PATIENT_PRIMARY,
                    },
                    "& input": {
                      backgroundColor: "transparent !important",
                    },
                    "& input:-webkit-autofill": {
                      WebkitBoxShadow: "0 0 0 100px transparent inset",
                      WebkitTextFillColor: "inherit",
                    },
                  },
                }}
              />
            )}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: PATIENT_PRIMARY,
              "&:hover": {
                backgroundColor: darken(PATIENT_PRIMARY, 0.15),
              },
              "&.Mui-disabled": {
                backgroundColor: alpha(PATIENT_PRIMARY, 0.4),
                color: "common.white",
              },
            }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("auth.actions.loggingIn", "Signing in…")
              : t("auth.actions.login", "Sign in")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
