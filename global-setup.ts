import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  try {
    const barrierPath = path.resolve('.pw-barrier');
    fs.rmSync(barrierPath, { recursive: true, force: true });
    console.log('🧹 [globalSetup] Cleared .pw-barrier folder');
  } catch (e) {
    console.warn('⚠️ [globalSetup] Failed to clear .pw-barrier', e);
  }

  // ถ้ามีโค้ด setup เดิมอยู่ เช่น login token, env setup อะไรพวกนั้น
  // อย่าลืมคงไว้ข้างล่างนี้ เช่น:
  // await prepareLoginToken();
  // await setupEnv();
}
