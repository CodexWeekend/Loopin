import { ensureDatabase, ensureDemoData } from '../lib/local-db';

ensureDatabase();

if (process.argv.includes('--seed')) {
  ensureDemoData();
}
