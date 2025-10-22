import { Navigate, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { useAuthState } from "../../modules/shared/hooks/useAuthState";
import { Spinner } from "../../components/ui/spinner";

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
