import { createRequire } from "module";
import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, "serviceAccountKey.json");
const rawServiceAccount = await readFile(serviceAccountPath, "utf8");
const serviceAccount = JSON.parse(rawServiceAccount);

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

async function main() {
  const usersResult = await auth.listUsers();
  const { users } = usersResult;

  if (!users.length) {
    console.log("No users in Firebase Auth, nothing to sync.");
    return;
  }

  const batch = db.batch();
  users.forEach((user) => {
    const docRef = db.collection("users").doc(user.uid);
    batch.set(docRef, {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      role: (user.customClaims?.role) ?? "patient",
    });
  });

  await batch.commit();
  console.log(`Synchronized ${users.length} users to Firestore collection 'users'.`);
}

await main();
