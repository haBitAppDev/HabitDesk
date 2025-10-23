import {
  addDoc,
  deleteDoc,
  getCollection,
  queryBy,
  updateDoc,
} from "../../shared/services/firestore";
import type {
  TherapistInvite,
  TherapistProfile,
} from "../../shared/types/domain";
import { auth } from "../../../firebase";

const INVITES_COLLECTION = "therapist_invites";
const USERS_COLLECTION = "users";

const DEFAULT_CODE_LENGTH = 8;
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type FirestoreValue = unknown;
type WithId<T> = T & { id: string };

const timestampToIso = (value: FirestoreValue): string | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds: number }).seconds === "number"
  ) {
    const seconds = (value as { seconds: number }).seconds * 1000;
    const nanos = ((value as { nanoseconds?: number }).nanoseconds ?? 0) / 1_000_000;
    return new Date(seconds + nanos).toISOString();
  }
  return undefined;
};

const isoToDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeStringArray = (value: FirestoreValue): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) =>
      typeof entry === "string" ? entry.trim() : String(entry ?? "")
    )
    .filter((entry) => entry.length > 0);
};

const parseInvite = (entry: WithId<Record<string, FirestoreValue>>): TherapistInvite => {
  return {
    id: entry.id,
    code: typeof entry.code === "string" ? entry.code : entry.id,
    status: (entry.status as TherapistInvite["status"]) ?? "pending",
    therapistTypes: normalizeStringArray(entry.therapistTypes),
    email: typeof entry.email === "string" ? entry.email : undefined,
    assignedUid:
      typeof entry.assignedUid === "string" ? entry.assignedUid : undefined,
    licenseValidUntil: timestampToIso(entry.licenseValidUntil),
    contractReference:
      typeof entry.contractReference === "string"
        ? entry.contractReference
        : undefined,
    notes: typeof entry.notes === "string" ? entry.notes : undefined,
    createdBy:
      typeof entry.createdBy === "string" ? entry.createdBy : "unknown",
    createdAt: timestampToIso(entry.createdAt) ?? new Date().toISOString(),
    updatedAt: timestampToIso(entry.updatedAt) ?? new Date().toISOString(),
  };
};

const parseProfile = (
  entry: WithId<Record<string, FirestoreValue>>
): TherapistProfile => {
  return {
    uid: entry.id,
    email: typeof entry.email === "string" ? entry.email : "",
    displayName:
      typeof entry.displayName === "string" ? entry.displayName : "",
    therapistTypes: normalizeStringArray(entry.therapistTypes),
    inviteId:
      typeof entry.inviteId === "string" ? entry.inviteId : undefined,
    licenseValidUntil: timestampToIso(entry.licenseValidUntil),
    contractReference:
      typeof entry.contractReference === "string"
        ? entry.contractReference
        : undefined,
    createdAt: timestampToIso(entry.createdAt),
    updatedAt: timestampToIso(entry.updatedAt),
  };
};

const getCurrentUserId = () => auth.currentUser?.uid ?? "unknown";

const generateRandomCode = (length = DEFAULT_CODE_LENGTH): string => {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues)
      .map((value) => INVITE_CODE_ALPHABET[value % INVITE_CODE_ALPHABET.length])
      .join("");
  }

  let result = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length);
    result += INVITE_CODE_ALPHABET[randomIndex];
  }
  return result;
};

async function ensureUniqueCode(length = DEFAULT_CODE_LENGTH, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const code = generateRandomCode(length);
    const existing = await queryBy<Record<string, FirestoreValue>>(INVITES_COLLECTION, [
      ["code", "==", code],
    ]);
    if (!existing.length) {
      return code;
    }
  }
  throw new Error("Failed to generate unique invite code");
}

export interface CreateTherapistInviteInput {
  therapistTypes: string[];
  email?: string;
  licenseValidUntil?: string;
  contractReference?: string;
  notes?: string;
  code?: string;
}

export async function listTherapistInvites(): Promise<TherapistInvite[]> {
  const raw = await getCollection<Record<string, FirestoreValue>>(INVITES_COLLECTION);
  return raw.map(parseInvite).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTherapistProfiles(): Promise<TherapistProfile[]> {
  const raw = await queryBy<Record<string, FirestoreValue>>(USERS_COLLECTION, [
    ["role", "==", "therapist"],
  ]);
  return raw
    .map(parseProfile)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function createTherapistInvite(
  input: CreateTherapistInviteInput
): Promise<TherapistInvite> {
  const now = new Date().toISOString();
  const therapistTypes = input.therapistTypes.map((type) => type.trim()).filter(Boolean);
  const code = input.code?.trim() || (await ensureUniqueCode());
  const createdBy = getCurrentUserId();

  const payload: Record<string, unknown> = {
    code,
    status: "pending",
    therapistTypes,
    email: input.email?.trim() || null,
    licenseValidUntil: isoToDate(input.licenseValidUntil) ?? null,
    contractReference: input.contractReference?.trim() || null,
    notes: input.notes?.trim() || null,
    createdBy,
    createdAt: isoToDate(now) ?? new Date(),
    updatedAt: isoToDate(now) ?? new Date(),
  };

  const docId = await addDoc(INVITES_COLLECTION, payload);
  return parseInvite({ id: docId, ...(payload as Record<string, FirestoreValue>) });
}

export async function updateTherapistInvite(
  id: string,
  updates: Partial<CreateTherapistInviteInput> & { status?: TherapistInvite["status"]; notes?: string }
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...("therapistTypes" in updates
      ? {
          therapistTypes:
            updates.therapistTypes?.map((type) => type.trim()).filter(Boolean) ?? [],
        }
      : {}),
    ...("email" in updates ? { email: updates.email?.trim() || null } : {}),
    ...("licenseValidUntil" in updates
      ? { licenseValidUntil: isoToDate(updates.licenseValidUntil) ?? null }
      : {}),
    ...("contractReference" in updates
      ? { contractReference: updates.contractReference?.trim() || null }
      : {}),
    ...("notes" in updates ? { notes: updates.notes?.trim() || null } : {}),
    ...("status" in updates ? { status: updates.status } : {}),
    updatedAt: new Date(),
  };

  if ("code" in updates && updates.code) {
    payload.code = updates.code.trim();
  }

  await updateDoc(INVITES_COLLECTION, id, payload);
}

export async function revokeTherapistInvite(id: string): Promise<void> {
  await updateDoc(INVITES_COLLECTION, id, {
    status: "revoked",
    updatedAt: new Date(),
  });
}

export async function deleteTherapistInvite(id: string): Promise<void> {
  await deleteDoc(INVITES_COLLECTION, id);
}
