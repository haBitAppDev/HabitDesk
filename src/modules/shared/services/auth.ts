import {
  getIdTokenResult as firebaseGetIdTokenResult,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../../../firebase";

export async function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  await signOut(auth);
}

export async function getIdTokenResult() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user");
  }

  return firebaseGetIdTokenResult(user, true);
}
