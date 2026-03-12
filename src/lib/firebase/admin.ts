import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!admin.apps.length) {
  const serviceAccountPath = join(process.cwd(), 'service-account.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };
