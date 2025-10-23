import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Spinner } from "../../../components/ui/spinner";
import { useI18n } from "../../../i18n/I18nProvider";
import type { TaskTemplate } from "../../shared/types/domain";
import { TaskFrequency, TaskVisibility } from "../../shared/types/domain";
import { listTaskTemplates } from "../services/therapistApi";
import { useBuilderStore } from "./ProgramBuilder";

export function TaskLibrary() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const addTask = useBuilderStore((state) => state.addTask);
  const titleText = t("therapist.taskLibrary.title", "Task Library");
  const subtitleText = t(
    "therapist.taskLibrary.subtitle",
    "Browse existing task templates and add them to your program."
  );
  const searchPlaceholder = t(
    "therapist.taskLibrary.search",
    "Search by title, description or role…"
  );
  const emptyText = t(
    "therapist.taskLibrary.empty",
    "No tasks found. Adjust your search or create a new template."
  );
  const rolesEmpty = t(
    "therapist.taskLibrary.rolesEmpty",
    "No role restriction"
  );
  const frequencyDaily = t("therapist.taskLibrary.frequency.daily", "Daily");
  const frequencyWeekly = t("therapist.taskLibrary.frequency.weekly", "Weekly");
  const visibilityVisible = t("therapist.taskLibrary.visibility.visible", "Visible");
  const visibilityHidden = t("therapist.taskLibrary.visibility.hidden", "Hidden");

  useEffect(() => {
    let active = true;
    listTaskTemplates()
      .then((templates) => {
        if (!active) return;
        setTasks(templates);
      })
      .catch((err) => {
        if (!active) return;
        setFeedback(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return tasks;
    return tasks.filter((task) => {
      const matchesTitle = task.title.toLowerCase().includes(lower);
      const matchesDescription =
        task.description?.toLowerCase().includes(lower) ?? false;
      const matchesRoles = task.roles.some((role) =>
        role.toLowerCase().includes(lower)
      );
      return matchesTitle || matchesDescription || matchesRoles;
    });
  }, [search, tasks]);

  const handleAdd = (task: TaskTemplate) => {
    addTask(task);
    setFeedback(
      t(
        "therapist.taskLibrary.feedback",
        "\"{title}\" added to builder.",
        { title: task.title }
      )
    );
    setTimeout(() => setFeedback(null), 2000);
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
{titleText}
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          {subtitleText}
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      {feedback && (
        <div className="rounded-card border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary shadow-soft">
          {feedback}
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <p className="rounded-card border border-dashed border-brand-divider/70 px-4 py-6 text-sm text-brand-text-muted">
{emptyText}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => {
            const isHidden = task.visibility === TaskVisibility.HiddenFromPatients;
            return (
              <Card
                key={task.id}
                className="flex cursor-pointer flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => handleAdd(task)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">
                      {task.title}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-brand-text-muted">
                      {t(`templates.taskTypes.${task.type}`, task.type)}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-light/60 px-2 py-0.5 text-[11px] uppercase text-brand-text-muted">
                    {task.frequency === TaskFrequency.Daily ? frequencyDaily : frequencyWeekly}
                  </span>
                </div>
                <p className="text-sm text-brand-text-muted line-clamp-3">
                  {task.description ?? t("therapist.taskLibrary.noDescription", "No description available.")}
                </p>
                <div className="mt-auto flex items-center justify-between text-[11px] uppercase text-brand-text-muted">
                  <span>{task.roles.length ? task.roles.join(", ") : rolesEmpty}</span>
                  {isHidden ? <span>{visibilityHidden}</span> : <span>{visibilityVisible}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
