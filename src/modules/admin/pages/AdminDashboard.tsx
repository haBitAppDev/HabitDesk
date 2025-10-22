import { useEffect, useState } from "react";

import { listUsers } from "../services/adminApi";
import {
  listProgramTemplates,
  listTaskTemplates,
} from "../../therapist/services/therapistApi";
import { Card } from "../../../components/ui/card";
import { Spinner } from "../../../components/ui/spinner";

interface DashboardStats {
  users: number;
  programTemplates: number;
  taskTemplates: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    programTemplates: 0,
    taskTemplates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([listUsers(), listProgramTemplates(), listTaskTemplates()])
      .then(([users, programs, tasks]) => {
        if (!active) return;
        setStats({
          users: users.length,
          programTemplates: programs.length,
          taskTemplates: tasks.length,
        });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">Admin Übersicht</h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Schneller Überblick über Nutzer und verfügbare Vorlagen.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm font-medium text-brand-text-muted">Nutzer gesamt</p>
          <p className="mt-4 text-4xl font-semibold text-brand-text">{stats.users}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-brand-text-muted">Programm-Vorlagen</p>
          <p className="mt-4 text-4xl font-semibold text-brand-text">{stats.programTemplates}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-brand-text-muted">Task-Vorlagen</p>
          <p className="mt-4 text-4xl font-semibold text-brand-text">{stats.taskTemplates}</p>
        </Card>
      </div>
    </div>
  );
}
