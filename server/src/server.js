import { createApp } from './app.js';
import { verifyDatabaseConnection } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  try {
    await verifyDatabaseConnection();
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    console.error(
      '[db] set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in server/.env and ' +
        'apply server/supabase/schema.sql to your project.',
    );
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] DevScore API listening on http://localhost:${env.port}`);
  });
}

start();
