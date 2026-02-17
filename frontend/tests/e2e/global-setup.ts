import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });

  const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sellit40';
  const testUri = baseUri + '_test';

  const client = new MongoClient(testUri);
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.collection(col.name).drop();
    }
  } finally {
    await client.close();
  }
}

export default globalSetup;
