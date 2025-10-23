import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { auth } from "firebase-functions/v1";

initializeApp();
const db = getFirestore();

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
  const userRecord = await auth.getUser(uid);
  const existingClaims = { ...(userRecord.customClaims ?? {}) };
  if (role !== "therapist") {
    delete (existingClaims as Record<string, unknown>).therapistTypes;
  }
  await auth.setCustomUserClaims(uid, { ...existingClaims, role });
  await auth.revokeRefreshTokens(uid);

  return { success: true };
});

export const createUserProfile = auth.user().onCreate(async (user) => {
  const userProfile = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    role: (user.customClaims?.role as string | undefined) ?? "patient",
  };

  await db.collection("users").doc(user.uid).set(userProfile, { merge: true });
});

interface ClaimInviteRequest {
  code?: unknown;
  displayName?: unknown;
}

export const claimTherapistInvite = onCall(async (request) => {
  const caller = request.auth;
  if (!caller) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const data = request.data as ClaimInviteRequest;
  const rawCode = typeof data.code === "string" ? data.code.trim() : "";

  if (!rawCode) {
    throw new HttpsError("invalid-argument", "Invite code is required");
  }

  const invitesSnapshot = await db
    .collection("therapist_invites")
    .where("code", "==", rawCode)
    .limit(1)
    .get();

  if (invitesSnapshot.empty) {
    throw new HttpsError("not-found", "Invite code not found");
  }

  const inviteDoc = invitesSnapshot.docs[0];
  const inviteData = inviteDoc.data();

  const status = (inviteData.status as string | undefined) ?? "pending";
  if (status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      status === "used"
        ? "Invite code already used"
        : "Invite code is no longer valid"
    );
  }

  const expectedEmail = (inviteData.email as string | undefined)?.toLowerCase();
  const callerEmail = (caller.token.email as string | undefined)?.toLowerCase();

  if (expectedEmail && callerEmail && expectedEmail !== callerEmail) {
    throw new HttpsError(
      "permission-denied",
      "Invite code is restricted to another email address"
    );
  }

  const therapistTypesRaw = inviteData.therapistTypes;
  const therapistTypes = Array.isArray(therapistTypesRaw)
    ? therapistTypesRaw
        .map((entry) =>
          typeof entry === "string" ? entry.trim() : String(entry ?? "")
        )
        .filter((entry) => entry.length > 0)
    : [];

  const authAdmin = getAuth();
  const userRecord = await authAdmin.getUser(caller.uid);

  const now = new Date();
  await inviteDoc.ref.set(
    {
      status: "used",
      assignedUid: caller.uid,
      assignedEmail: userRecord.email ?? callerEmail ?? expectedEmail ?? null,
      usedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  const currentClaims = userRecord.customClaims ?? {};

  await authAdmin.setCustomUserClaims(caller.uid, {
    ...currentClaims,
    role: "therapist",
    therapistTypes,
  });
  await authAdmin.revokeRefreshTokens(caller.uid);

  const displayName =
    typeof data.displayName === "string" && data.displayName.trim().length > 0
      ? data.displayName.trim()
      : userRecord.displayName ?? "";

  await db
    .collection("users")
    .doc(caller.uid)
    .set(
      {
        uid: caller.uid,
        email: userRecord.email ?? callerEmail ?? expectedEmail ?? "",
        displayName,
        role: "therapist",
        therapistTypes,
        inviteId: inviteDoc.id,
        licenseValidUntil:
          inviteData.licenseValidUntil instanceof Date
            ? inviteData.licenseValidUntil
            : inviteData.licenseValidUntil ?? null,
        contractReference: inviteData.contractReference ?? null,
        updatedAt: now,
        createdAt: inviteData.createdAt ?? now,
      },
      { merge: true }
    );

  return {
    therapistTypes,
    inviteId: inviteDoc.id,
    licenseValidUntil: inviteData.licenseValidUntil ?? null,
    contractReference: inviteData.contractReference ?? null,
  };
});
