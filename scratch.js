const { createClient } = require('@libsql/client/http');
require('dotenv').config();
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
async function run() {
  const res = await db.execute('SELECT sql FROM sqlite_master WHERE type="table"');
  console.log(res.rows);
}
run();
