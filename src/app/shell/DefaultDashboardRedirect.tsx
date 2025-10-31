import { Navigate } from "react-router-dom";

import { useUserRole } from "../../modules/shared/hooks/useUserRole";
import { Spinner } from "../../components/ui/spinner";

export function DefaultDashboardRedirect() {
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

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "therapist") {
    return <Navigate to="/therapist" replace />;
  }

  if (role === "patient") {
    return <Navigate to="/patient" replace />;
  }

  return <Navigate to="/login" replace />;
}
