// global-setup.js
import fs from 'fs';
import path from 'path';

export default async () => {
  const arg = process.argv.find(arg => arg.startsWith('--workers='));
  const workers = arg ? parseInt(arg.split('=')[1], 10) : 1;

  const filePath = path.resolve(__dirname, '.worker_count');
  fs.writeFileSync(filePath, String(workers));

  console.log('[globalSetup] workers =', workers);
};
