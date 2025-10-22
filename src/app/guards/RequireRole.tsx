import { CircularProgress, Container, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { useUserRole } from "../../modules/shared/hooks/useUserRole";
import type { UserRole } from "../../modules/shared/types/domain";

interface RequireRoleProps extends PropsWithChildren {
  allowed: UserRole[];
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { role, loading, error } = useUserRole();

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 8 }}>
        <Typography color="error">{error.message}</Typography>
      </Container>
    );
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
