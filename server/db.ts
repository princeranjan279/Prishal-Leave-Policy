import 'dotenv/config';
import { createClient } from '@libsql/client/http';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error('Database credentials missing. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
}

export const db = createClient({ url, authToken });
