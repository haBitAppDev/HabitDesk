import { BookOpenCheck, ClipboardList, Hammer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useAuthState } from "../../shared/hooks/useAuthState";
import type { Program } from "../../shared/types/domain";
import { listProgramsByOwner } from "../services/therapistApi";
import { useI18n } from "../../../i18n/I18nProvider";

export function TherapistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [programs, setPrograms] = useState<Program[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    if (!user) return;
    let active = true;
    listProgramsByOwner(user.uid).then((result) => {
      if (!active) return;
      setPrograms(result);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const greeting = user?.displayName
    ? t("therapist.dashboard.titleWithName", "Welcome back, {name}", {
        name: user.displayName,
      })
    : t("therapist.dashboard.title", "Welcome back");
  const subtitle = t(
    "therapist.dashboard.subtitle",
    "Keep an eye on your programs and build new content for patients."
  );
  const builderTitle = t(
    "therapist.dashboard.cards.builder.title",
    "Create program"
  );
  const builderDescription = t(
    "therapist.dashboard.cards.builder.description",
    "Launch the builder to assemble individual therapy programs."
  );
  const builderCta = t(
    "therapist.dashboard.cards.builder.cta",
    "Open builder"
  );
  const libraryTitle = t(
    "therapist.dashboard.cards.library.title",
    "Task library"
  );
  const libraryDescription = t(
    "therapist.dashboard.cards.library.description",
    "Manage available tasks and extend your therapy toolkit."
  );
  const libraryCta = t(
    "therapist.dashboard.cards.library.cta",
    "Open library"
  );
  const activeProgramsTitle = t(
    "therapist.dashboard.cards.activePrograms.title",
    "Active programs"
  );
  const activeProgramsDescription = t(
    "therapist.dashboard.cards.activePrograms.description",
    "You currently manage {count} active programs.",
    { count: programs.length }
  );
  const activeProgramsTip = t(
    "therapist.dashboard.cards.activePrograms.tip",
    "Tip: use templates to launch programs faster."
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">{greeting}</h1>
        <p className="mt-2 text-sm text-brand-text-muted">{subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-primary-dark" />
          <div className="flex h-full flex-col gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary">
              <Hammer className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-brand-text">{builderTitle}</h2>
              <p className="text-sm text-brand-text-muted">{builderDescription}</p>
            </div>
            <div className="mt-auto">
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate("/therapist/program-builder")}
                className="group-hover:translate-x-1 transition"
              >
                {builderCta}
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
              <h2 className="text-lg font-semibold text-brand-text">{libraryTitle}</h2>
              <p className="text-sm text-brand-text-muted">{libraryDescription}</p>
            </div>
            <div className="mt-auto">
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate("/therapist/tasks")}
                className="group-hover:translate-x-1 transition"
              >
                {libraryCta}
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
              <h2 className="text-lg font-semibold text-brand-text">{activeProgramsTitle}</h2>
              <p className="text-sm text-brand-text-muted">
                {activeProgramsDescription}
              </p>
            </div>
            <div className="mt-auto">
              <p className="text-xs text-brand-text-muted">{activeProgramsTip}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
