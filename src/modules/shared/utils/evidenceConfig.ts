import type { EvidenceTaskConfig, EvidenceRequirement } from "../types/domain";
import { EvidenceType } from "../types/domain";

export const ALL_EVIDENCE_TYPES: EvidenceType[] = [
  EvidenceType.Photo,
  EvidenceType.Audio,
  EvidenceType.Video,
  EvidenceType.Geolocation,
  EvidenceType.Checklist,
  EvidenceType.QrCode,
];

export const createDefaultEvidenceConfig = (): EvidenceTaskConfig => ({
  requirements: [
    {
      type: EvidenceType.Photo,
      minAttachments: 1,
      maxAttachments: 3,
      isMandatory: true,
    },
  ],
  notesEnabled: true,
  commentRequired: false,
});

export const normalizeEvidenceRequirement = (
  requirement: EvidenceRequirement
): EvidenceRequirement => {
  const min = Math.max(0, Math.floor(requirement.minAttachments ?? 0));
  const max = Math.max(min, Math.floor(requirement.maxAttachments ?? min));
  return {
    type: requirement.type,
    minAttachments: min,
    maxAttachments: max,
    isMandatory:
      requirement.isMandatory === undefined ? true : requirement.isMandatory,
  };
};

export const normalizeEvidenceConfig = (
  config: EvidenceTaskConfig
): EvidenceTaskConfig => ({
  requirements: config.requirements.map((req) =>
    normalizeEvidenceRequirement(req)
  ),
  notesEnabled: Boolean(config.notesEnabled),
  commentRequired: Boolean(config.commentRequired),
  commentLabelKey: config.commentLabelKey || undefined,
});
