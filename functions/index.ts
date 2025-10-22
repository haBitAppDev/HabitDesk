import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const allowedRoles = new Set(["admin", "therapist", "patient"]);

export const setUserRole = onCall(async (request) => {
  const caller = request.auth;
  if (!caller) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (caller.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin privileges required");
  }

  const { uid, role } = request.data as { uid?: string; role?: string };

  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required");
  }

  if (!role || typeof role !== "string" || !allowedRoles.has(role)) {
    throw new HttpsError("invalid-argument", "role is invalid");
  }

  const auth = getAuth();
  await auth.setCustomUserClaims(uid, { role });
  await auth.revokeRefreshTokens(uid);

  return { success: true };
});
