import { PlusCircle, Trash } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import {
  MediaKind,
  TaskType,
} from "../types/domain";
import type {
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
import { deleteMediaFile, uploadMediaFile } from "../services/storage";
import { defaultTaskConfig } from "../utils/taskConfig";

export type TranslateFn = (
  key: string,
  fallback?: string,
  values?: Record<string, string | number>
) => string;

export interface FieldProps {
  label: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Field({ label, children, fullWidth = false }: FieldProps) {
  return (
    <div className={fullWidth ? "md:col-span-2" : undefined}>
      <Label className="mb-1 block text-sm font-semibold text-brand-text">{label}</Label>
      {children}
    </div>
  );
}

const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  [MediaKind.Audio]: "audio/*, .mp4, .mp3",
  [MediaKind.Video]: "video/*",
  [MediaKind.Image]: "image/*",
  [MediaKind.Document]:
    ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.odt,.odp,.ods",
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type VideoSource = "upload" | "link";

export interface TaskConfigEditorProps {
  type: TaskType;
  value: TaskConfig;
  onChange: (config: TaskConfig) => void;
  t: TranslateFn;
}

export function TaskConfigEditor({ type, value, onChange, t }: TaskConfigEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<VideoSource>("upload");

  useEffect(() => {
    if (type !== TaskType.Media) {
      if (mediaError) setMediaError(null);
      if (videoSource !== "upload") setVideoSource("upload");
      return;
    }
    const mediaConfig =
      value.taskType === TaskType.Media
        ? (value as MediaTaskConfig)
        : (defaultTaskConfig(TaskType.Media) as MediaTaskConfig);
    if (mediaConfig.kind === MediaKind.Video) {
      if (mediaConfig.storagePath) {
        if (videoSource !== "upload") {
          setVideoSource("upload");
        }
      } else if (mediaConfig.mediaUrl) {
        if (videoSource !== "link") {
          setVideoSource("link");
        }
      }
    } else if (videoSource !== "upload") {
      setVideoSource("upload");
    }
    if (mediaError && !uploadingMedia) {
      setMediaError(null);
    }
  }, [type, value, mediaError, videoSource, uploadingMedia]);

  switch (type) {
    case TaskType.Timer: {
      const current =
        value.taskType === TaskType.Timer
          ? (value as TimerTaskConfig)
          : (defaultTaskConfig(TaskType.Timer) as TimerTaskConfig);
      return (
        <div className="space-y-4">
          <Field label={t("templates.tasks.config.timer.duration", "Dauer (Sekunden)")}>
            <Input
              type="number"
              min={5}
              value={current.seconds}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Timer,
                  seconds: Number(event.target.value) || 0,
                })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.allowPause}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Timer,
                  allowPause: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {t("templates.tasks.config.timer.allowPause", "Pause erlauben")}
          </label>
        </div>
      );
    }
    case TaskType.TextInput: {
      const current =
        value.taskType === TaskType.TextInput
          ? (value as TextInputConfig)
          : (defaultTaskConfig(TaskType.TextInput) as TextInputConfig);
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("templates.tasks.config.text.min", "Minimale Zeichen")}>
              <Input
                type="number"
                min={0}
                value={current.minLength}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.TextInput,
                    minLength: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
            <Field label={t("templates.tasks.config.text.max", "Maximale Zeichen")}>
              <Input
                type="number"
                min={10}
                value={current.maxLength}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.TextInput,
                    maxLength: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.showHistory}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.TextInput,
                  showHistory: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {t("templates.tasks.config.text.showHistory", "Verlauf für Patienten anzeigen")}
          </label>
        </div>
      );
    }
    case TaskType.Quiz: {
      const current =
        value.taskType === TaskType.Quiz
          ? (value as QuizTaskConfig)
          : (defaultTaskConfig(TaskType.Quiz) as QuizTaskConfig);

      const handleOptionChange = <Key extends keyof QuizTaskConfig["options"][number]>(
        index: number,
        key: Key,
        newValue: QuizTaskConfig["options"][number][Key]
      ) => {
        const updated = current.options.map((option, optionIndex) =>
          optionIndex === index ? { ...option, [key]: newValue } : option
        );
        onChange({
          ...current,
          taskType: TaskType.Quiz,
          options: updated,
        });
      };

      const addOption = () => {
        onChange({
          ...current,
          taskType: TaskType.Quiz,
          options: [
            ...current.options,
            { label: t("templates.tasks.config.quiz.option", "Neue Option"), isCorrect: false },
          ],
        });
      };

      const removeOption = (index: number) => {
        const updated = current.options.filter((_, optionIndex) => optionIndex !== index);
        onChange({
          ...current,
          taskType: TaskType.Quiz,
          options: updated,
        });
      };

      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.singleChoice}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Quiz,
                  singleChoice: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {t("templates.tasks.config.quiz.singleChoice", "Nur eine Antwort erlauben")}
          </label>

          <Field label={t("templates.tasks.config.quiz.prompt", "Beispielfrage / Prompt")}>
            <Textarea
              rows={3}
              value={current.explanation ?? ""}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Quiz,
                  explanation: event.target.value,
                })
              }
              placeholder={t(
                "templates.tasks.config.quiz.promptPlaceholder",
                "Optionale Zusatzinformationen"
              )}
            />
          </Field>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-text">
              {t("templates.tasks.config.quiz.answers", "Antwortmöglichkeiten")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={addOption}
            >
              <PlusCircle className="h-4 w-4" />
              {t("templates.tasks.config.quiz.add", "Option hinzufügen")}
            </Button>
          </div>
          <div className="space-y-3">
            {current.options.map((option, index) => (
              <div
                key={`quiz-option-${index}`}
                className="rounded-[12px] border border-brand-divider/60 bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={(event) =>
                      handleOptionChange(index, "isCorrect", event.target.checked)
                    }
                    className="mt-2 h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
                  />
                  <Input
                    value={option.label}
                    onChange={(event) => handleOptionChange(index, "label", event.target.value)}
                    placeholder={`${t("templates.tasks.config.quiz.answer", "Antwort")} ${
                      index + 1
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case TaskType.Progress: {
      const current =
        value.taskType === TaskType.Progress
          ? (value as ProgressTaskConfig)
          : (defaultTaskConfig(TaskType.Progress) as ProgressTaskConfig);
      return (
        <div className="space-y-4">
          <Field label={t("templates.tasks.config.progress.target", "Zielwert")}>
            <Input
              type="number"
              value={current.target}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Progress,
                  target: Number(event.target.value) || 0,
                })
              }
            />
          </Field>
          <Field
            label={t("templates.tasks.config.progress.unit", "Einheit (z. B. Min, Schritte)")}
          >
            <Input
              value={current.unit}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Progress,
                  unit: event.target.value,
                })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.allowPartial}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Progress,
                  allowPartial: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {t("templates.tasks.config.progress.allowPartial", "Teilfortschritt erlauben")}
          </label>
        </div>
      );
    }
    case TaskType.Media: {
      const current =
        value.taskType === TaskType.Media
          ? (value as MediaTaskConfig)
          : (defaultTaskConfig(TaskType.Media) as MediaTaskConfig);

      const applyMediaChanges = (changes: Partial<MediaTaskConfig>) => {
        const base =
          value.taskType === TaskType.Media
            ? (value as MediaTaskConfig)
            : (defaultTaskConfig(TaskType.Media) as MediaTaskConfig);
        onChange({
          ...base,
          ...changes,
          taskType: TaskType.Media,
        });
      };

      const uploadErrorFallback = t(
        "templates.tasks.config.media.uploadError",
        "Upload fehlgeschlagen. Bitte versuche es erneut."
      );
      const removeErrorFallback = t(
        "templates.tasks.config.media.removeError",
        "Die bestehende Datei konnte nicht entfernt werden."
      );

      const handleKindChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextKind = event.target.value as MediaKind;
        if (nextKind === current.kind || uploadingMedia) return;
        setMediaError(null);
        if (current.storagePath) {
          setUploadingMedia(true);
          try {
            await deleteMediaFile(current.storagePath);
          } catch (error) {
            setMediaError(
              error instanceof Error && error.message ? error.message : removeErrorFallback
            );
            setUploadingMedia(false);
            return;
          }
          setUploadingMedia(false);
        }
        setVideoSource("upload");
        applyMediaChanges({
          kind: nextKind,
          mediaUrl: "",
          fileName: undefined,
          fileSize: undefined,
          storagePath: undefined,
          contentType: undefined,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setMediaError(null);
        setUploadingMedia(true);
        try {
          if (current.storagePath) {
            try {
              await deleteMediaFile(current.storagePath);
            } catch (error) {
              setMediaError(
                error instanceof Error && error.message
                  ? error.message
                  : removeErrorFallback
              );
              return;
            }
          }
          const uploaded = await uploadMediaFile(file, current.kind);
          applyMediaChanges({
            mediaUrl: uploaded.downloadUrl,
            fileName: uploaded.fileName,
            fileSize: uploaded.fileSize,
            storagePath: uploaded.storagePath,
            contentType: uploaded.contentType,
          });
          setVideoSource("upload");
        } catch (error) {
          setMediaError(
            error instanceof Error && error.message ? error.message : uploadErrorFallback
          );
        } finally {
          setUploadingMedia(false);
          if (event.target) {
            event.target.value = "";
          }
        }
      };

      const handleRemoveFile = async () => {
        if (!current.storagePath && !current.mediaUrl) return;
        setMediaError(null);
        if (current.storagePath) {
          setUploadingMedia(true);
          try {
            await deleteMediaFile(current.storagePath);
          } catch (error) {
            setMediaError(
              error instanceof Error && error.message ? error.message : removeErrorFallback
            );
            setUploadingMedia(false);
            return;
          }
          setUploadingMedia(false);
        }
        applyMediaChanges({
          mediaUrl: "",
          fileName: undefined,
          fileSize: undefined,
          storagePath: undefined,
          contentType: undefined,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      const handleVideoSourceChange = async (
        event: React.ChangeEvent<HTMLSelectElement>
      ) => {
        const nextSource = event.target.value as VideoSource;
        if (nextSource === videoSource) return;
        setMediaError(null);
        setVideoSource(nextSource);
        if (nextSource === "link" && current.storagePath) {
          setUploadingMedia(true);
          try {
            await deleteMediaFile(current.storagePath);
          } catch (error) {
            setMediaError(
              error instanceof Error && error.message ? error.message : removeErrorFallback
            );
            setUploadingMedia(false);
            return;
          }
          setUploadingMedia(false);
        }
        applyMediaChanges({
          mediaUrl: "",
          fileName: undefined,
          fileSize: undefined,
          storagePath: undefined,
          contentType: undefined,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      const handleVideoUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        applyMediaChanges({
          mediaUrl: event.target.value,
          fileName: undefined,
          fileSize: undefined,
          storagePath: undefined,
          contentType: undefined,
        });
      };

      const renderUploadSection = () => {
        const hasUploadedFile = Boolean(current.storagePath && current.mediaUrl);
        const sizeLabel = formatFileSize(current.fileSize);
        return (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-brand-text">
              {t("templates.tasks.config.media.uploadLabel", "Datei hochladen")}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_BY_KIND[current.kind] ?? "*/*"}
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
              >
                {hasUploadedFile
                  ? t("templates.tasks.config.media.replaceFile", "Datei ersetzen")
                  : t("templates.tasks.config.media.selectFile", "Datei auswählen")}
              </Button>
              {hasUploadedFile && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveFile}
                  disabled={uploadingMedia}
                >
                  {t("templates.tasks.config.media.removeFile", "Datei entfernen")}
                </Button>
              )}
            </div>
            {uploadingMedia && (
              <p className="text-xs text-brand-text-muted">
                {t("templates.tasks.config.media.uploading", "Upload läuft…")}
              </p>
            )}
            {!uploadingMedia && mediaError && (
              <div className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {mediaError}
              </div>
            )}
            {!uploadingMedia && !mediaError && hasUploadedFile && current.fileName && (
              <p className="text-xs text-brand-text-muted">
                {t(
                  "templates.tasks.config.media.fileInfo",
                  "Aktuelle Datei: {name} {size}",
                  {
                    name: current.fileName,
                    size: sizeLabel ? `(${sizeLabel})` : "",
                  }
                )}
              </p>
            )}
            <p className="text-xs text-brand-text-muted">
              {t(
                "templates.tasks.config.media.uploadHint",
                "Unterstützte Formate entsprechend der Auswahl."
              )}
            </p>
          </div>
        );
      };

      return (
        <div className="space-y-4">
          <Field label={t("templates.tasks.config.media.kind", "Medientyp")}>
            <Select
              value={current.kind}
              onChange={handleKindChange}
              disabled={uploadingMedia}
            >
              <option value={MediaKind.Audio}>{t("templates.media.audio", "Audio")}</option>
              <option value={MediaKind.Video}>{t("templates.media.video", "Video")}</option>
              <option value={MediaKind.Image}>{t("templates.media.image", "Bild")}</option>
              <option value={MediaKind.Document}>
                {t("templates.media.document", "Dokument")}
              </option>
            </Select>
          </Field>

          {current.kind === MediaKind.Video ? (
            <div className="space-y-4">
              <Field label={t("templates.tasks.config.media.source", "Videoquelle")}>
                <Select
                  value={videoSource}
                  onChange={handleVideoSourceChange}
                  disabled={uploadingMedia}
                >
                  <option value="upload">
                    {t("templates.tasks.config.media.sourceUpload", "Datei hochladen")}
                  </option>
                  <option value="link">
                    {t("templates.tasks.config.media.sourceLink", "Link verwenden")}
                  </option>
                </Select>
              </Field>

              {videoSource === "link" ? (
                <div className="space-y-2">
                  <Field label={t("templates.tasks.config.media.videoUrl", "Video-Link")}>
                    <Input
                      value={current.mediaUrl}
                      onChange={handleVideoUrlChange}
                      placeholder={t(
                        "templates.tasks.config.media.videoUrlPlaceholder",
                        "https://beispiel.de/video"
                      )}
                      disabled={uploadingMedia}
                    />
                  </Field>
                  {!uploadingMedia && mediaError && (
                    <div className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {mediaError}
                    </div>
                  )}
                  {current.mediaUrl && (
                    <p className="text-xs text-brand-text-muted">
                      {t(
                        "templates.tasks.config.media.linkInfo",
                        "Aktueller Link: {url}",
                        { url: current.mediaUrl }
                      )}
                    </p>
                  )}
                  <p className="text-xs text-brand-text-muted">
                    {t(
                      "templates.tasks.config.media.videoUrlHint",
                      "Unterstützt z. B. YouTube, Vimeo oder gespeicherte Streaming-Links."
                    )}
                  </p>
                </div>
              ) : (
                renderUploadSection()
              )}
            </div>
          ) : (
            renderUploadSection()
          )}
        </div>
      );
    }
    case TaskType.Goal: {
      const current =
        value.taskType === TaskType.Goal
          ? (value as GoalTaskConfig)
          : (defaultTaskConfig(TaskType.Goal) as GoalTaskConfig);
      return (
        <div className="space-y-4">
          <Field label={t("templates.tasks.config.goal.description", "Zielbeschreibung")}>
            <Textarea
              rows={3}
              value={current.goalDescription}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Goal,
                  goalDescription: event.target.value,
                })
              }
            />
          </Field>
          <Field
            label={t("templates.tasks.config.goal.dueDate", "Fälligkeitsdatum (optional)")}
          >
            <Input
              type="date"
              value={current.dueDate ?? ""}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Goal,
                  dueDate: event.target.value || undefined,
                })
              }
            />
          </Field>
        </div>
      );
    }
    case TaskType.Scale: {
      const current =
        value.taskType === TaskType.Scale
          ? (value as ScaleTaskConfig)
          : (defaultTaskConfig(TaskType.Scale) as ScaleTaskConfig);
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("templates.tasks.config.scale.min", "Minimum")}>
              <Input
                type="number"
                value={current.min}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    min: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
            <Field label={t("templates.tasks.config.scale.max", "Maximum")}>
              <Input
                type="number"
                value={current.max}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    max: Number(event.target.value) || 0,
                  })
                }
              />
            </Field>
          </div>
          <Field label={t("templates.tasks.config.scale.step", "Schritte")}>
            <Input
              type="number"
              min={1}
              value={current.step}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.Scale,
                  step: Number(event.target.value) || 1,
                })
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("templates.tasks.config.scale.leftLabel", "Linke Beschriftung")}>
              <Input
                value={current.leftLabel ?? ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    leftLabel: event.target.value || undefined,
                  })
                }
              />
            </Field>
            <Field label={t("templates.tasks.config.scale.rightLabel", "Rechte Beschriftung")}>
              <Input
                value={current.rightLabel ?? ""}
                onChange={(event) =>
                  onChange({
                    ...current,
                    taskType: TaskType.Scale,
                    rightLabel: event.target.value || undefined,
                  })
                }
              />
            </Field>
          </div>
        </div>
      );
    }
    case TaskType.StateLog: {
      const current =
        value.taskType === TaskType.StateLog
          ? (value as StateLogTaskConfig)
          : (defaultTaskConfig(TaskType.StateLog) as StateLogTaskConfig);

      const handleEmojiChange = (value: string) => {
        const parts = value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
        onChange({
          ...current,
          taskType: TaskType.StateLog,
          emojiKeys: parts,
        });
      };

      return (
        <div className="space-y-4">
          <Field label={t("templates.tasks.config.stateLog.emojis", "Emojis (durch Komma trennen)")}>
            <Input
              value={current.emojiKeys.join(", ")}
              onChange={(event) => handleEmojiChange(event.target.value)}
              placeholder="🙂, 😐, 🙁"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-brand-text">
            <input
              type="checkbox"
              checked={current.showChart}
              onChange={(event) =>
                onChange({
                  ...current,
                  taskType: TaskType.StateLog,
                  showChart: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
            />
            {t("templates.tasks.config.stateLog.showChart", "Verlaufsgrafik anzeigen")}
          </label>
        </div>
      );
    }
    default:
      return null;
  }
}
