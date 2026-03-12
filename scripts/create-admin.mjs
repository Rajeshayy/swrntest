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

const auth = admin.auth();
const db = admin.firestore();

async function createAdmin(email, password, name) {
  try {
    const user = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection('profiles').doc(user.uid).set({
      name,
      email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully created admin user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const email = args[0] || 'admin@online.test';
const password = args[1] || 'AdminPassword123!';
const name = args[2] || 'System Admin';

createAdmin(email, password, name);
