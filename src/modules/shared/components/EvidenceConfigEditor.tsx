import {
  Camera,
  CheckSquare,
  MapPin,
  Mic,
  QrCode,
  Video,
} from "lucide-react";
import { Fragment } from "react";

import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import type {
  EvidenceRequirement,
  EvidenceTaskConfig,
} from "../types/domain";
import { EvidenceType } from "../types/domain";
import { ALL_EVIDENCE_TYPES } from "../utils/evidenceConfig";
import type { TranslateFn } from "./TaskConfigEditor";

const EVIDENCE_ICONS: Record<EvidenceType, React.ComponentType<{ className?: string }>> = {
  [EvidenceType.Photo]: Camera,
  [EvidenceType.Audio]: Mic,
  [EvidenceType.Video]: Video,
  [EvidenceType.Geolocation]: MapPin,
  [EvidenceType.Checklist]: CheckSquare,
  [EvidenceType.QrCode]: QrCode,
};

interface EvidenceConfigEditorProps {
  enabled: boolean;
  config: EvidenceTaskConfig;
  onToggle: (enabled: boolean) => void;
  onChange: (config: EvidenceTaskConfig) => void;
  t: TranslateFn;
}

const ensureRequirement = (
  requirements: EvidenceRequirement[],
  type: EvidenceType
): EvidenceRequirement | undefined =>
  requirements.find((req) => req.type === type);

export function EvidenceConfigEditor({
  enabled,
  config,
  onToggle,
  onChange,
  t,
}: EvidenceConfigEditorProps) {
  const toggleRequirement = (type: EvidenceType, checked: boolean) => {
    if (checked) {
      const existing = ensureRequirement(config.requirements, type);
      const fallback: EvidenceRequirement = existing ?? {
        type,
        minAttachments: type === EvidenceType.Photo ? 1 : 0,
        maxAttachments: type === EvidenceType.Photo ? 3 : 1,
        isMandatory: true,
      };
      const nextRequirements = existing
        ? config.requirements
        : [...config.requirements, fallback];
      onChange({
        ...config,
        requirements: nextRequirements,
      });
    } else {
      onChange({
        ...config,
        requirements: config.requirements.filter((req) => req.type !== type),
      });
    }
  };

  const updateRequirement = (
    type: EvidenceType,
    patch: Partial<EvidenceRequirement>
  ) => {
    const existing = ensureRequirement(config.requirements, type);
    if (!existing) return;
    const merged = { ...existing, ...patch };
    const min = Math.max(0, Math.floor(merged.minAttachments ?? 0));
    const max = Math.max(min, Math.floor(merged.maxAttachments ?? 0));
    onChange({
      ...config,
      requirements: config.requirements.map((req) =>
        req.type === type ? { ...merged, minAttachments: min, maxAttachments: max } : req
      ),
    });
  };

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(event.target.checked);
  };

  return (
    <div className="space-y-4 rounded-card border border-brand-divider bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-text">
            {t("templates.tasks.evidence.title", "Evidence requirements")}
          </p>
          <p className="text-xs text-brand-text-muted">
            {t(
              "templates.tasks.evidence.subtitle",
              "Enable uploads to request proof (photos, audio, etc.) before completion."
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
          />
          {t("templates.tasks.evidence.enable", "Require evidence")}
        </label>
      </div>

      {!enabled ? (
        <p className="text-xs text-brand-text-muted">
          {t(
            "templates.tasks.evidence.disabledHint",
            "Patients can finish this task without uploading media."
          )}
        </p>
      ) : (
        <Fragment>
          <div className="grid gap-3 md:grid-cols-2">
            {ALL_EVIDENCE_TYPES.map((type) => {
              const requirement = ensureRequirement(config.requirements, type);
              const Icon = EVIDENCE_ICONS[type];
              return (
                <div
                  key={type}
                  className="rounded-card border border-brand-divider/70 p-3"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-brand-text">
                    <input
                      type="checkbox"
                      checked={Boolean(requirement)}
                      onChange={(event) =>
                        toggleRequirement(type, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
                    />
                    <Icon className="h-4 w-4 text-brand-primary" />
                    <span>
                      {t(`templates.tasks.evidence.types.${type}`, type)}
                    </span>
                  </label>
                  {requirement && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <Label className="text-xs text-brand-text-muted">
                          {t("templates.tasks.evidence.min", "Minimum")}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={requirement.minAttachments}
                          onChange={(event) =>
                            updateRequirement(type, {
                              minAttachments: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-brand-text-muted">
                          {t("templates.tasks.evidence.max", "Maximum")}
                        </Label>
                        <Input
                          type="number"
                          min={requirement.minAttachments}
                          value={requirement.maxAttachments}
                          onChange={(event) =>
                            updateRequirement(type, {
                              maxAttachments: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {config.requirements.length === 0 && (
            <p className="text-xs text-red-600">
              {t(
                "templates.tasks.evidence.validation.type",
                "Select at least one evidence type."
              )}
            </p>
          )}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-brand-text">
              <input
                type="checkbox"
                checked={config.notesEnabled}
                onChange={(event) =>
                  onChange({
                    ...config,
                    notesEnabled: event.target.checked,
                    commentRequired:
                      event.target.checked === false
                        ? false
                        : config.commentRequired,
                  })
                }
                className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary"
              />
              {t(
                "templates.tasks.evidence.notesEnabled",
                "Allow optional notes"
              )}
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-text">
              <input
                type="checkbox"
                checked={config.commentRequired}
                disabled={!config.notesEnabled}
                onChange={(event) =>
                  onChange({
                    ...config,
                    commentRequired: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-brand-divider text-brand-primary focus:ring-brand-primary disabled:opacity-50"
              />
              {t(
                "templates.tasks.evidence.commentRequired",
                "Note is mandatory"
              )}
            </label>
          </div>
        </Fragment>
      )}
    </div>
  );
}
