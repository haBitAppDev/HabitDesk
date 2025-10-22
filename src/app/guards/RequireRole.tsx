import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { useUserRole } from "../../modules/shared/hooks/useUserRole";
import type { UserRole } from "../../modules/shared/types/domain";
import { Spinner } from "../../components/ui/spinner";

interface RequireRoleProps extends PropsWithChildren {
  allowed: UserRole[];
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { role, loading, error } = useUserRole();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-card bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-semibold text-red-600">Fehler</p>
        <p className="mt-2 text-sm text-brand-text-muted">{error.message}</p>
      </div>
    );
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
