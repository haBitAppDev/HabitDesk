import { BookOpenCheck, ClipboardList, Hammer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useAuthState } from "../../shared/hooks/useAuthState";
import type { ProgramInstance } from "../../shared/types/domain";
import { listProgramsByTherapist } from "../services/therapistApi";

type ProgramRecord = ProgramInstance & { id: string; authorId: string };

export function TherapistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listProgramsByTherapist(user.uid).then((result) => {
      if (!active) return;
      setPrograms(result);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">
          Willkommen zurück{user?.displayName ? `, ${user.displayName}` : ""}
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Behalte deine Programme im Blick und erstelle neue Inhalte für deine Patient:innen.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-primary-dark" />
          <div className="flex h-full flex-col gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary">
              <Hammer className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-brand-text">Programm erstellen</h2>
              <p className="text-sm text-brand-text-muted">
                Starte den Builder, um individuelle Therapieprogramme zusammenzustellen.
              </p>
            </div>
            <div className="mt-auto">
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate("/therapist/program-builder")}
                className="group-hover:translate-x-1 transition"
              >
                Zum Builder
              </Button>
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary/70 to-brand-accent" />
          <div className="flex h-full flex-col gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-brand-text">Task Library</h2>
              <p className="text-sm text-brand-text-muted">
                Verwalte vorhandene Tasks und erweitere dein therapeutisches Repertoire.
              </p>
            </div>
            <div className="mt-auto">
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate("/therapist/tasks")}
                className="group-hover:translate-x-1 transition"
              >
                Zur Bibliothek
              </Button>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-light" />
          <div className="flex h-full flex-col gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-brand-text">Aktive Programme</h2>
              <p className="text-sm text-brand-text-muted">
                Du betreust derzeit <span className="font-semibold text-brand-primary">{programs.length}</span>{" "}
                aktive Programme.
              </p>
            </div>
            <div className="mt-auto">
              <p className="text-xs text-brand-text-muted">
                Tipp: nutze Templates, um neue Programme schneller zu starten.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
