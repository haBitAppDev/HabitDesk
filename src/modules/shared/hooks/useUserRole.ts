import { useEffect, useState } from "react";

import { getIdTokenResult } from "../services/auth";
import { useAuthState } from "./useAuthState";
import type { UserRole } from "../types/domain";

interface UseUserRoleResult {
  role: UserRole | null;
  loading: boolean;
  error: Error | null;
}

export function useUserRole(): UseUserRoleResult {
  const { user, loading: authLoading, error: authError } = useAuthState();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authError) {
      setError(authError);
      setLoading(false);
      return;
    }

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    getIdTokenResult()
      .then((tokenResult) => {
        if (!active) return;

        const claimRole = tokenResult.claims.role as UserRole | undefined;

        if (!claimRole) {
          setRole(null);
          setError(
            new Error(
              "Missing role claim on authenticated user; contact an administrator."
            )
          );
          return;
        }

        setRole(claimRole);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setRole(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authError, authLoading, user]);

  return { role, loading, error };
}
