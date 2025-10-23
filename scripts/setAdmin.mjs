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

const uid = process.env.ADMIN_UID;
if (!uid) {
  throw new Error("Set ADMIN_UID env var to the user's uid before running this script.");
}

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

const userRecord = await auth.getUser(uid);
const existingClaims = userRecord.customClaims ?? {};

await auth.setCustomUserClaims(uid, { ...existingClaims, role: "admin" });
await auth.revokeRefreshTokens(uid);

await db
  .collection("users")
  .doc(uid)
  .set(
    {
      uid,
      email: userRecord.email ?? "",
      displayName: userRecord.displayName ?? "",
      role: "admin",
      updatedAt: new Date(),
    },
    { merge: true }
  );

console.log(`Admin claim gesetzt für ${uid}`);
