import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "../../../firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        setError(null);
      },
      (nextError) => {
        setError(nextError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}
