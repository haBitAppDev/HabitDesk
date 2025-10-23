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
    const { uid, role } = request.data;
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
export const createUserProfile = auth.user().onCreate(async (user) => {
    const userProfile = {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        role: user.customClaims?.role ?? "patient",
    };
    await db.collection("users").doc(user.uid).set(userProfile, { merge: true });
});
//# sourceMappingURL=index.js.map