import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "../../../firebase";
import { MediaKind } from "../types/domain";

const MEDIA_FOLDER = "media";

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

export interface UploadMediaResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType?: string;
}

export async function uploadMediaFile(
  file: File,
  kind: MediaKind
): Promise<UploadMediaResult> {
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeName = sanitizeFileName(file.name);
  const storagePath = `${MEDIA_FOLDER}/${kind}/${uniqueId}-${safeName}`;
  const fileRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type || undefined,
  });
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return {
    downloadUrl,
    storagePath: snapshot.ref.fullPath,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type || undefined,
  };
}

export async function deleteMediaFile(storagePath: string): Promise<void> {
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
}
