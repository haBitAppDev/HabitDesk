import { CircularProgress, Container } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { useAuthState } from "../../modules/shared/hooks/useAuthState";

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
