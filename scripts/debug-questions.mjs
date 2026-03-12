import admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkDatabase() {
  try {
    const serviceAccount = JSON.parse(await fs.readFile(path.join(__dirname, '../service-account.json'), 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const adminDb = admin.firestore();
    const testsSnapshot = await adminDb.collection('tests').get();
    
    console.log(`\n🔍 Found ${testsSnapshot.size} Tests Total:`);

    for (const testDoc of testsSnapshot.docs) {
       const testData = testDoc.data();
       const questionsSnapshot = await adminDb.collection('tests').doc(testDoc.id).collection('questions').get();
       console.log(`\n- Test: ${testData.title || "Untitled"} (ID: ${testDoc.id})`);
       console.log(`  Reported Total Questions: ${testData.total_questions || 0}`);
       console.log(`  Actual Question Count: ${questionsSnapshot.size}`);
       
       if (questionsSnapshot.size > 0) {
          questionsSnapshot.docs.forEach((qDoc, index) => {
             const qData = qDoc.data();
             const hasCreatedAt = !!qData.createdAt;
             const createdAtInfo = hasCreatedAt ? (qData.createdAt.toDate ? qData.createdAt.toDate().toISOString() : "Present (unknown format)") : "MISSING";
             console.log(`    [${index + 1}] Text: "${qData.question_text}" | CreatedAt: ${createdAtInfo}`);
          });
       } else {
          console.log(`    ⚠️  NO QUESTIONS IN SUBCOLLECTION`);
       }
    }
    
    console.log("\n✅ Assessment Check Complete\n");
    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
