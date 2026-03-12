import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

const serviceAccountPath = join(process.cwd(), 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function listAdmins() {
  const snapshot = await db.collection('profiles').where('role', '==', 'admin').get();
  if (snapshot.empty) {
    console.log('No admins found.');
  } else {
    snapshot.forEach(doc => {
      console.log(`Admin user: ${doc.data().email}`);
    });
  }
}

listAdmins().catch(console.error);
