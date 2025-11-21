import clsx from "clsx";
import {
  AlarmClock,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare2,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Mic,
  PauseCircle,
  PlayCircle,
  QrCode,
  Radio,
  Sparkles,
  Target,
  Video,
  Waves,
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Textarea } from "../../../components/ui/textarea";
import type { TranslateFn } from "./TaskConfigEditor";
import {
  EvidenceType,
  MediaKind,
  TaskType,
} from "../types/domain";
import type {
  EvidenceRequirement,
  EvidenceTaskConfig,
  GoalTaskConfig,
  MediaTaskConfig,
  ProgressTaskConfig,
  QuizTaskConfig,
  ScaleTaskConfig,
  StateLogTaskConfig,
  TaskConfig,
  TextInputConfig,
  TimerTaskConfig,
} from "../types/domain";
import { ensureConfigMatchesType } from "../utils/taskConfig";

interface TaskPreviewProps {
  title?: string;
  description?: string;
  type: TaskType;
  config?: TaskConfig;
  evidenceConfig?: EvidenceTaskConfig;
  evidenceEnabled?: boolean;
  icon?: string;
  className?: string;
  t: TranslateFn;
}

const taskTypeInfo = (t: TranslateFn): Record<
  TaskType,
  { label: string; accent: string; pill: string; icon: typeof AlarmClock }
> => ({
  [TaskType.Timer]: {
    label: t("templates.taskTypes.timerTask", "Timer"),
    accent: "text-[#AD8501]",
    pill: "bg-[#FFF1D6] text-[#AD8501]",
    icon: AlarmClock,
  },
  [TaskType.TextInput]: {
    label: t("templates.taskTypes.textInput", "Freitext"),
    accent: "text-[#0F766E]",
    pill: "bg-[#E0F2F1] text-[#0F766E]",
    icon: MessageCircle,
  },
  [TaskType.Quiz]: {
    label: t("templates.taskTypes.quizTask", "Quiz"),
    accent: "text-[#7C2D12]",
    pill: "bg-[#FEF3C7] text-[#92400E]",
    icon: ClipboardList,
  },
  [TaskType.Progress]: {
    label: t("templates.taskTypes.progressTask", "Fortschritt"),
    accent: "text-[#1D4ED8]",
    pill: "bg-[#DBEAFE] text-[#1D4ED8]",
    icon: BarChart3,
  },
  [TaskType.Media]: {
    label: t("templates.taskTypes.mediaTask", "Media"),
    accent: "text-[#BE185D]",
    pill: "bg-[#FCE7F3] text-[#BE185D]",
    icon: FileText,
  },
  [TaskType.Evidence]: {
    label: t("templates.taskTypes.evidenceTask", "Evidence only"),
    accent: "text-[#6B21A8]",
    pill: "bg-[#F3E8FF] text-[#6B21A8]",
    icon: CheckCircle2,
  },
  [TaskType.Goal]: {
    label: t("templates.taskTypes.goalTask", "Zielsetzung"),
    accent: "text-[#0F172A]",
    pill: "bg-[#E2E8F0] text-[#0F172A]",
    icon: Target,
  },
  [TaskType.Scale]: {
    label: t("templates.taskTypes.scaleTask", "Skala"),
    accent: "text-[#B91C1C]",
    pill: "bg-[#FEE2E2] text-[#B91C1C]",
    icon: Waves,
  },
  [TaskType.StateLog]: {
    label: t("templates.taskTypes.stateLog", "Stimmungstagebuch"),
    accent: "text-[#0EA5E9]",
    pill: "bg-[#E0F2FE] text-[#0369A1]",
    icon: Sparkles,
  },
});

const evidenceTypeMeta = (
  t: TranslateFn
): Record<EvidenceType, { label: string; icon: typeof Camera }> => ({
  [EvidenceType.Photo]: {
    label: t("templates.tasks.evidence.types.photo", "Foto"),
    icon: Camera,
  },
  [EvidenceType.Audio]: {
    label: t("templates.tasks.evidence.types.audio", "Audio"),
    icon: Mic,
  },
  [EvidenceType.Video]: {
    label: t("templates.tasks.evidence.types.video", "Video"),
    icon: Video,
  },
  [EvidenceType.Geolocation]: {
    label: t("templates.tasks.evidence.types.geolocation", "Ort"),
    icon: MapPin,
  },
  [EvidenceType.Checklist]: {
    label: t("templates.tasks.evidence.types.checklist", "Checkliste"),
    icon: ClipboardList,
  },
  [EvidenceType.QrCode]: {
    label: t("templates.tasks.evidence.types.qrCode", "QR-Code"),
    icon: QrCode,
  },
});

const formatSeconds = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const renderMaterialIcon = (glyph?: string) => {
  if (!glyph) {
    return <Sparkles className="h-6 w-6 text-patient-primary" />;
  }
  const isOutlined = glyph.endsWith("_outlined");
  const cleaned = glyph.replace(/_(rounded|outlined)$/i, "");
  return (
    <span
      className="material-symbols-rounded text-2xl text-[#AD8501]"
      style={{
        fontVariationSettings: `'FILL' ${isOutlined ? 0 : 1}, 'wght' 600, 'GRAD' 0, 'opsz' 32`,
      }}
    >
      {cleaned}
    </span>
  );
};

const renderEvidenceRequirement = (
  requirement: EvidenceRequirement,
  t: TranslateFn
) => {
  const meta = evidenceTypeMeta(t)[requirement.type];
  const Icon = meta.icon;
  const quantity =
    requirement.minAttachments === requirement.maxAttachments
      ? requirement.minAttachments
      : `${requirement.minAttachments}-${requirement.maxAttachments}`;

  return (
    <span
      key={`${requirement.type}-${requirement.minAttachments}-${requirement.maxAttachments}`}
      className="inline-flex items-center gap-2 rounded-full bg-brand-divider/60 px-3 py-1 text-xs font-semibold text-brand-text"
    >
      <Icon className="h-4 w-4 text-brand-text-muted" />
      <span>{meta.label}</span>
      <span className="text-brand-text-muted">
        {quantity}{" "}
        {requirement.isMandatory === false
          ? t("therapist.taskPreview.optional", "optional")
          : t("therapist.taskPreview.required", "erforderlich")}
      </span>
    </span>
  );
};

const renderTimerPreview = (config: TimerTaskConfig, t: TranslateFn) => {
  const startLabel = t("therapist.taskPreview.timer.start", "Starten");
  const pauseLabel = t("therapist.taskPreview.timer.pause", "Pause");
  const helpText = t(
    "therapist.taskPreview.timer.help",
    "Patienten starten den Timer und markieren die Übung als abgeschlossen."
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-16 w-24 items-center justify-center rounded-2xl bg-[#FFF7E6] font-mono text-3xl font-semibold text-[#AD8501] ring-1 ring-[#F3D9A4]">
          {formatSeconds(config.seconds)}
        </div>
        <div className="text-sm text-brand-text-muted">{helpText}</div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled
          className="bg-[#AD8501] text-white hover:bg-[#AD8501]"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {startLabel}
        </Button>
        {config.allowPause && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            className="border-[#AD8501] text-[#AD8501] hover:bg-[#FFF7E6]"
          >
            <PauseCircle className="mr-2 h-4 w-4" />
            {pauseLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

const renderTextInputPreview = (config: TextInputConfig, t: TranslateFn) => {
  const placeholder = t(
    "therapist.taskPreview.text.placeholder",
    "Patient antwortet hier…"
  );
  const minMaxLabel = t(
    "therapist.taskPreview.text.length",
    "Zwischen {min} und {max} Zeichen",
    { min: config.minLength, max: config.maxLength }
  );
  return (
    <div className="space-y-2">
      <Textarea
        disabled
        placeholder={placeholder}
        rows={4}
        className="resize-none bg-white/70"
      />
      <div className="flex items-center justify-between text-xs text-brand-text-muted">
        <span>{minMaxLabel}</span>
        {config.showHistory && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-divider/80 px-2 py-1 font-semibold">
            <Check className="h-3 w-3" />
            {t("therapist.taskPreview.text.history", "Verlauf sichtbar")}
          </span>
        )}
      </div>
    </div>
  );
};

const renderQuizPreview = (config: QuizTaskConfig, t: TranslateFn) => {
  const InputIcon = config.singleChoice ? Radio : CheckSquare2;
  const options = config.options?.length ? config.options : [];
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-text-muted">
        {config.singleChoice
          ? t("therapist.taskPreview.quiz.singleChoice", "Eine Antwort möglich")
          : t("therapist.taskPreview.quiz.multiChoice", "Mehrere Antworten möglich")}
      </p>
      <div className="space-y-2">
        {options.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-divider/70 bg-brand-light/50 px-3 py-2 text-sm text-brand-text-muted">
            {t("therapist.taskPreview.quiz.empty", "Füge Antwortoptionen hinzu.")}
          </p>
        ) : (
          options.map((option, index) => (
            <label
              key={`${option.label}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-brand-divider/80 bg-white px-3 py-2 text-sm text-brand-text"
            >
              <InputIcon className="h-4 w-4 text-brand-text-muted" />
              <span className="flex-1">
                {option.label ||
                  t("therapist.taskPreview.quiz.untitled", "Option {index}", {
                    index: index + 1,
                  })}
              </span>
              {option.isCorrect && (
                <span className="rounded-full bg-[#DCFCE7] px-2 py-1 text-xs font-semibold text-[#166534]">
                  {t("therapist.taskPreview.quiz.correct", "Richtig")}
                </span>
              )}
            </label>
          ))
        )}
      </div>
      {config.explanation && (
        <div className="rounded-xl bg-brand-light/60 px-3 py-2 text-xs text-brand-text">
          <strong className="font-semibold">
            {t("therapist.taskPreview.quiz.explanation", "Erklärung:")}
          </strong>{" "}
          {config.explanation}
        </div>
      )}
    </div>
  );
};

const renderProgressPreview = (config: ProgressTaskConfig, t: TranslateFn) => {
  const target = Math.max(1, config.target || 0);
  const sample = config.allowPartial
    ? Math.max(1, Math.min(target, Math.round(target * 0.35)))
    : target;
  const percent = Math.min(100, Math.round((sample / target) * 100));
  const unit = config.unit || "";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-brand-text-muted">
        <span>
          {t("therapist.taskPreview.progress.target", "Ziel")} {target}
          {unit && ` ${unit}`}
        </span>
        <span className="font-semibold text-brand-text">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-brand-divider/80">
        <div
          className="h-full rounded-full bg-[#AD8501]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-brand-text-muted">
        {config.allowPartial
          ? t(
              "therapist.taskPreview.progress.partial",
              "Patienten können Zwischenschritte eintragen."
            )
          : t(
              "therapist.taskPreview.progress.fullOnly",
              "Markiert sich erst als erledigt, wenn das Ziel erreicht ist."
            )}
      </p>
    </div>
  );
};

const renderMediaPreview = (config: MediaTaskConfig, t: TranslateFn) => {
  const kindLabel = {
    [MediaKind.Audio]: t("therapist.taskPreview.media.audio", "Audio"),
    [MediaKind.Video]: t("therapist.taskPreview.media.video", "Video"),
    [MediaKind.Image]: t("therapist.taskPreview.media.image", "Bild"),
    [MediaKind.Document]: t("therapist.taskPreview.media.document", "Dokument"),
  }[config.kind];
  const iconByKind = {
    [MediaKind.Audio]: Mic,
    [MediaKind.Video]: Video,
    [MediaKind.Image]: ImageIcon,
    [MediaKind.Document]: FileText,
  }[config.kind];
  const Icon = iconByKind;
  const actionLabel = config.mediaUrl
    ? t("therapist.taskPreview.media.view", "Datei ansehen")
    : t("therapist.taskPreview.media.upload", "Patient lädt Datei hoch");
  const fileName =
    config.fileName ||
    (config.mediaUrl
      ? config.mediaUrl.split("/").pop()
      : t("therapist.taskPreview.media.placeholder", "Noch kein Anhang"));

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-divider/70 bg-white px-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light/70">
        <Icon className="h-5 w-5 text-brand-text" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-brand-text">{kindLabel}</p>
        <p className="text-xs text-brand-text-muted">{fileName}</p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled>
        {actionLabel}
      </Button>
    </div>
  );
};

const renderEvidencePreview = (config: EvidenceTaskConfig, t: TranslateFn) => {
  const noteLabel = config.notesEnabled
    ? config.commentRequired
      ? t(
          "therapist.taskPreview.evidence.commentRequired",
          "Kommentar ist erforderlich."
        )
      : t(
          "therapist.taskPreview.evidence.commentOptional",
          "Kommentar ist optional."
        )
    : t(
        "therapist.taskPreview.evidence.noNotes",
        "Notizen sind für diese Aufgabe deaktiviert."
      );
  const commentLabel =
    config.commentLabelKey ||
    t(
      "therapist.taskPreview.evidence.commentPlaceholder",
      "Kurzer Kommentar"
    );

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-brand-divider/70 bg-brand-light/50 p-3">
      <div className="flex flex-wrap gap-2">
        {config.requirements.map((req) => renderEvidenceRequirement(req, t))}
      </div>
      {config.notesEnabled && (
        <Textarea
          disabled
          placeholder={commentLabel}
          rows={2}
          className="resize-none bg-white text-sm"
        />
      )}
      <p className="text-xs text-brand-text-muted">{noteLabel}</p>
    </div>
  );
};

const renderGoalPreview = (config: GoalTaskConfig, t: TranslateFn) => {
  const goal = config.goalDescription?.trim()
    ? config.goalDescription
    : t("therapist.taskPreview.goal.placeholder", "Formuliere das Ziel für Patienten.");
  let dueDateLabel: string | null = null;
  if (config.dueDate) {
    const parsed = new Date(config.dueDate);
    const formatted = Number.isNaN(parsed.getTime())
      ? config.dueDate
      : parsed.toLocaleDateString();
    dueDateLabel = t(
      "therapist.taskPreview.goal.due",
      "Fällig bis {date}",
      { date: formatted }
    );
  }
  return (
    <div className="space-y-2">
      <p className="rounded-xl bg-white px-3 py-2 text-sm text-brand-text">
        {goal}
      </p>
      {dueDateLabel && (
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-light/70 px-3 py-1 text-xs font-semibold text-brand-text">
          <AlarmClock className="h-4 w-4 text-brand-text-muted" />
          {dueDateLabel}
        </span>
      )}
    </div>
  );
};

const renderScalePreview = (config: ScaleTaskConfig, t: TranslateFn) => {
  const value = Math.min(config.max, Math.max(config.min, config.min + config.step));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-brand-text-muted">
        <span>{config.leftLabel || t("therapist.taskPreview.scale.left", "Niedrig")}</span>
        <span>{config.rightLabel || t("therapist.taskPreview.scale.right", "Hoch")}</span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        readOnly
        className="w-full accent-[#AD8501]"
      />
      <div className="text-xs font-semibold text-brand-text">
        {t("therapist.taskPreview.scale.current", "Beispielwert: {value}", {
          value,
        })}
      </div>
    </div>
  );
};

const renderStateLogPreview = (config: StateLogTaskConfig, t: TranslateFn) => {
  const chartHint = t(
    "therapist.taskPreview.stateLog.chart",
    "Ein Mini-Chart wird für Patienten sichtbar sein."
  );
  const emojis = config.emojiKeys?.length ? config.emojiKeys : ["🙂", "😐", "🙁"];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled
            className="rounded-full border border-brand-divider/70 bg-white px-3 py-1 text-sm"
          >
            {emoji}
          </button>
        ))}
      </div>
      {config.showChart && (
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-brand-light/60 p-3">
          {emojis.slice(0, 4).map((emoji, index) => (
            <div key={`${emoji}-${index}`} className="flex h-16 items-end gap-1 rounded-md bg-white px-2 py-1">
              <div
                className="w-full rounded-sm bg-[#AD8501]"
                style={{ height: `${40 + index * 10}%` }}
              />
              <span className="text-xs">{emoji}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-brand-text-muted">{chartHint}</p>
    </div>
  );
};

const renderTaskContent = (
  type: TaskType,
  config: TaskConfig,
  t: TranslateFn
) => {
  switch (type) {
    case TaskType.Timer:
      return renderTimerPreview(config as TimerTaskConfig, t);
    case TaskType.TextInput:
      return renderTextInputPreview(config as TextInputConfig, t);
    case TaskType.Quiz:
      return renderQuizPreview(config as QuizTaskConfig, t);
    case TaskType.Progress:
      return renderProgressPreview(config as ProgressTaskConfig, t);
    case TaskType.Media:
      return renderMediaPreview(config as MediaTaskConfig, t);
    case TaskType.Evidence:
      return renderEvidencePreview(config as EvidenceTaskConfig, t);
    case TaskType.Goal:
      return renderGoalPreview(config as GoalTaskConfig, t);
    case TaskType.Scale:
      return renderScalePreview(config as ScaleTaskConfig, t);
    case TaskType.StateLog:
      return renderStateLogPreview(config as StateLogTaskConfig, t);
    default:
      return null;
  }
};

export function TaskPreview({
  title,
  description,
  type,
  config,
  evidenceConfig,
  evidenceEnabled = false,
  icon,
  className,
  t,
}: TaskPreviewProps) {
  const ensuredConfig = ensureConfigMatchesType(type, config);
  const previewTitle =
    title?.trim() ||
    t("therapist.taskPreview.emptyTitle", "Unbenannte Aufgabe");
  const previewDescription =
    description?.trim() ||
    t(
      "therapist.taskPreview.emptyDescription",
      "Kurzer Text für Patienten. Dieser Bereich zeigt, was sie lesen werden."
    );
  const typeMeta = taskTypeInfo(t)[type];
  const TypeIcon = typeMeta.icon;
  const previewEvidenceConfig =
    type === TaskType.Evidence
      ? (ensuredConfig as EvidenceTaskConfig)
      : evidenceConfig;
  const showExtraEvidence =
    type !== TaskType.Evidence &&
    evidenceEnabled &&
    Boolean(previewEvidenceConfig);

  return (
    <Card
      className={clsx(
        "h-full border border-brand-divider/80 bg-gradient-to-b from-white to-brand-light/60 shadow-soft",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-brand-divider/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF7E6]">
            {renderMaterialIcon(icon)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              {t(
                "therapist.taskPreview.patientLabel",
                "Patienten-Vorschau"
              )}
            </p>
            <p className="text-lg font-semibold text-brand-text">{previewTitle}</p>
          </div>
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
            typeMeta.pill
          )}
        >
          <TypeIcon className="h-4 w-4" />
          {typeMeta.label}
        </span>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-sm text-brand-text-muted">{previewDescription}</p>
        <div className="rounded-[14px] border border-brand-divider/70 bg-white/90 p-4">
          {renderTaskContent(type, ensuredConfig, t)}
        </div>
        {showExtraEvidence && previewEvidenceConfig && (
          <div className="space-y-2 rounded-[14px] border border-brand-divider/70 bg-white/95 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-text">
              <CheckCircle2 className="h-4 w-4 text-brand-primary" />
              {t("therapist.taskPreview.evidence.title", "Nachweise für Patienten")}
            </div>
            {renderEvidencePreview(previewEvidenceConfig, t)}
          </div>
        )}
        <p className="text-xs text-brand-text-muted">
          {t(
            "therapist.taskPreview.hint",
            "Diese Vorschau simuliert die Patientenansicht und reagiert auf deine Einstellungen in Echtzeit."
          )}
        </p>
      </div>
    </Card>
  );
}
