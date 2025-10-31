import type {
  DocumentData,
  QueryConstraint,
  WhereFilterOp,
  WithFieldValue,
} from "firebase/firestore";
import {
  addDoc as addDocFirestore,
  collection,
  deleteDoc as deleteDocFirestore,
  doc,
  getDoc as getDocFirestore,
  getDocs,
  query,
  updateDoc as updateDocFirestore,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase";

type WhereClause<T> = [keyof T & string, WhereFilterOp, unknown];

type WithId<T> = T & { id: string };

export async function getCollection<T>(path: string): Promise<WithId<T>[]> {
  const snapshot = await getDocs(collection(db, path));
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as T),
  }));
}

export async function getDoc<T>(path: string, id: string): Promise<WithId<T> | null> {
  const snapshot = await getDocFirestore(doc(db, path, id));
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...(snapshot.data() as T) };
}

export async function addDoc<T>(
  path: string,
  data: WithFieldValue<T>
): Promise<string> {
  const reference = await addDocFirestore(collection(db, path), data as DocumentData);
  return reference.id;
}

export async function updateDoc<T>(
  path: string,
  id: string,
  data: Partial<T> | Record<string, unknown>
): Promise<void> {
  await updateDocFirestore(doc(db, path, id), data as DocumentData);
}

export async function deleteDoc(path: string, id: string): Promise<void> {
  await deleteDocFirestore(doc(db, path, id));
}

export async function queryBy<T>(
  path: string,
  clauses: WhereClause<T>[]
): Promise<WithId<T>[]> {
  const constraints: QueryConstraint[] = clauses.map(([field, opStr, value]) =>
    where(field, opStr, value)
  );
  const snapshot = await getDocs(query(collection(db, path), ...constraints));
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as T),
  }));
}
