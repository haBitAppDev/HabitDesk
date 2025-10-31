import { AlertCircle, ClipboardList } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card } from "../../../components/ui/card";
import { Spinner } from "../../../components/ui/spinner";
import { useI18n } from "../../../i18n/I18nProvider";
import { useAuthState } from "../../shared/hooks/useAuthState";
import type { PatientProgramRecord } from "../services/patientApi";
import { listPatientPrograms } from "../services/patientApi";

export function PatientDashboard() {
  const { user } = useAuthState();
  const { t } = useI18n();
  const [records, setRecords] = useState<PatientProgramRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    listPatientPrograms(user.uid)
      .then((data) => {
        if (!active) return;
        setRecords(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const accessibleRecords = useMemo(
    () => records.filter((record) => record.program),
    [records]
  );
  const restrictedCount = records.filter((record) => record.restricted && !record.program)
    .length;

  const greeting = user?.displayName
    ? t("patient.dashboard.greetingNamed", "Hi {name}", {
        name: user.displayName,
      })
    : t("patient.dashboard.greeting", "Hi there");
  const subtitle = t(
    "patient.dashboard.subtitle",
    "Here you can find your assigned therapy programmes and track your progress."
  );
  const loadingLabel = t(
    "patient.dashboard.loading",
    "Loading programmes…"
  );
  const errorTitle = t("patient.dashboard.errorTitle", "Unable to load programmes");
  const errorMessage = error?.message ?? t(
    "patient.dashboard.errorFallback",
    "Something went wrong. Please try again."
  );
  const emptyTitle = t(
    "patient.dashboard.emptyTitle",
    "No programmes yet"
  );
  const emptySubtitle = t(
    "patient.dashboard.emptySubtitle",
    "Once your therapy team assigns a programme, it will show up here."
  );
  const restrictedTitle = t(
    "patient.dashboard.restrictedTitle",
    "Programme unavailable"
  );
  const restrictedBody = t(
    "patient.dashboard.restrictedBody",
    "At least one programme could not be loaded. Please ask your therapy team to refresh your access."
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text md:text-3xl">{greeting}</h1>
        <p className="mt-2 text-sm text-brand-text-muted">{subtitle}</p>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-brand-text-muted">
          <Spinner className="h-6 w-6" />
          <span>{loadingLabel}</span>
        </div>
      ) : error ? (
        <Card className="border border-red-200 bg-red-50/60 p-5 text-sm text-red-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{errorTitle}</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </div>
        </Card>
      ) : accessibleRecords.length === 0 ? (
        <Card className="border border-brand-divider/80 bg-white p-6 text-sm text-brand-text-muted">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
            <div>
              <p className="font-semibold text-brand-text">{emptyTitle}</p>
              <p className="mt-1">{emptySubtitle}</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {accessibleRecords.map(({ assignment, program }) => {
            if (!program) return null;

            const title =
              program.title ||
              t("patient.dashboard.untitledProgram", "Untitled programme");
            const programSubtitle = program.subtitle ?? "";
            const description = program.description ?? "";
            const taskIds = program.taskIds ?? [];

            const totalTasks = taskIds.length;
            const completedSteps = Math.max(
              0,
              Math.min(assignment.currentTaskIndex, totalTasks)
            );
            const normalizedProgress =
              assignment.progress <= 1
                ? assignment.progress * 100
                : assignment.progress;
            const progressPercent = Math.round(
              Math.max(0, Math.min(normalizedProgress, 100))
            );

            return (
              <Card key={assignment.id} className="flex flex-col gap-4 border border-brand-divider/60 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-text">{title}</h2>
                    {programSubtitle && (
                      <p className="mt-1 text-sm text-brand-text-muted">{programSubtitle}</p>
                    )}
                  </div>
                </div>
                {description && (
                  <p className="text-sm text-brand-text-muted">{description}</p>
                )}
                <div className="rounded-[10px] border border-brand-divider/60 bg-brand-light/40 p-4 text-sm text-brand-text">
                  <p className="font-semibold">
                    {t("patient.dashboard.progressLabel", "Progress")}
                  </p>
                  <p className="mt-1">
                    {t(
                      "patient.dashboard.progressValue",
                      "{percent}% completed",
                      { percent: progressPercent }
                    )}
                  </p>
                  {totalTasks > 0 && (
                    <p className="mt-1 text-xs text-brand-text-muted">
                      {t(
                        "patient.dashboard.stepValue",
                        "Current task: {current} of {total}",
                        {
                          current: Math.min(completedSteps + 1, totalTasks),
                          total: totalTasks,
                        }
                      )}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {restrictedCount > 0 && !loading && (
        <Card className="border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{restrictedTitle}</p>
              <p className="mt-1">{restrictedBody}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
