import { getFunctions, httpsCallable } from "firebase/functions";

import { app } from "../../../firebase";
import { getCollection } from "../../shared/services/firestore";
import type { UserProfile, UserRole } from "../../shared/types/domain";

const functions = getFunctions(app);

const setUserRoleCallable = httpsCallable<{ uid: string; role: UserRole }, void>(
  functions,
  "setUserRole"
);

export async function listUsers() {
  return getCollection<UserProfile>("users");
}

export async function setUserRole(uid: string, role: UserRole) {
  await setUserRoleCallable({ uid, role });
}
