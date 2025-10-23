import { useEffect, useMemo, useState } from "react";

import { Card } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/spinner";
import { useI18n } from "../../../i18n/I18nProvider";
import type { UserProfile, UserRole } from "../../shared/types/domain";
import { listUsers, setUserRole } from "../services/adminApi";

const ROLES: UserRole[] = ["admin", "therapist", "patient"];
type UserRecord = UserProfile & { id: string };

export function RolesManager() {
  const { t } = useI18n();
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

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.email.localeCompare(b.email)),
    [users]
  );

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setUpdating(uid);
    try {
      await setUserRole(uid, role);
      setUsers((prev) =>
        prev.map((user) => (user.uid === uid ? { ...user, role } : user))
      );
      const roleLabel = t(`roles.options.${role}`, role);
      setSnackbar(
        t("roles.manager.messages.roleUpdated", "Rolle erfolgreich aktualisiert.", {
          role: roleLabel,
        })
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdating(null);
      setTimeout(() => setSnackbar(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">
          {t("roles.manager.title", "Manage Roles")}
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          {t(
            "roles.manager.subtitle",
            "Assign roles to control access to admin and therapist features."
          )}
        </p>
      </div>

      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      )}

      {snackbar && (
        <div className="rounded-card border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary shadow-soft">
          {snackbar}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-divider/70 text-sm">
            <thead className="bg-brand-light/40 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              <tr>
                <th className="px-6 py-3">{t("roles.manager.table.email", "Email")}</th>
                <th className="px-6 py-3">{t("roles.manager.table.name", "Name")}</th>
                <th className="px-6 py-3">{t("roles.manager.table.role", "Role")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-divider/60 bg-white">
              {sortedUsers.map((user) => (
                <tr key={user.uid} className="transition hover:bg-brand-light/40">
                  <td className="px-6 py-4 font-medium text-brand-text">{user.email}</td>
                  <td className="px-6 py-4 text-brand-text-muted">
                    {user.displayName || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`role-${user.uid}`} className="text-xs text-brand-text-muted">
                        {t("roles.manager.table.role", "Role")}
                      </Label>
                      <Select
                        id={`role-${user.uid}`}
                        value={user.role}
                        onChange={(event) =>
                          handleRoleChange(user.uid, event.target.value as UserRole)
                        }
                        disabled={updating === user.uid}
                      >
                        {ROLES.map((roleValue) => (
                          <option key={roleValue} value={roleValue}>
                            {t(`roles.options.${roleValue}`, roleValue)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
