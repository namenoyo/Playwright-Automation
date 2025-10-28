// ================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================
// คำสั่ง Run Terminal >>  (if exist config\.finished del /f /q config\.finished) & (if exist config\.init_done del /f /q config\.init_done) & (if exist config\.phase1_next del /f /q config\.phase1_next) & (if exist config\.progress_writer del /f /q config\.progress_writer) & (if exist config\.report_writer del /f /q config\.report_writer) & (if exist config\.worker_count del /f /q config\.worker_count) & (if exist sync_ready.txt del /f /q sync_ready.txt) & (if exist config\.locks rmdir /s /q config\.locks) & (if exist config\.started rmdir /s /q config\.started) & (if exist config\results rmdir /s /q config\results) & npx playwright test e2e/OceanConnect/name_test-purchase-sms-otp-sync.spec.js --workers=6 --project=chromium
// ================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================

// name_test-purchase-sms-otp-sync.spec.js  (CommonJS)
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ==============================
// Config files
// ==============================
const workerCountFile = 'config/.worker_count';
const barrierFile = path.resolve(process.cwd(), 'sync_ready.txt');
const phase1NextFile = path.resolve(process.cwd(), 'config/.phase1_next');
const progressWriterFile = path.resolve(process.cwd(), 'config/.progress_writer');
const resultsDir = path.resolve(process.cwd(), 'config/results'); // ⬅️ เพิ่ม


function setProgressWriter(seq) {
  ensureDirOf(progressWriterFile);
  try { fs.writeFileSync(progressWriterFile, String(seq), 'utf8'); } catch {}
}
function isProgressWriter(seq) {
  try {
    const v = fs.readFileSync(progressWriterFile, 'utf8').trim();
    return v === String(seq);
  } catch {
    return false;
  }
}

// อ่านจำนวน worker ทั้งหมด (fallback = 1 ถ้าไฟล์ไม่มี)
// let totalWorkers = 1;
// try {
//   totalWorkers = parseInt(
//     (fs.existsSync(workerCountFile) ? fs.readFileSync(workerCountFile, 'utf8') : '1').trim() || '1',
//     10
//   );
// } catch {
//   totalWorkers = 1;
// }

// ==============================
// Helpers: time + sleep
// ==============================
function now() {
  const d = new Date();
  const date = d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory' // 👈 บังคับให้ใช้ปี ค.ศ.
  }).split('/').reverse().join('-'); // YYYY-MM-DD

  const time = d.toLocaleTimeString('th-TH', { hour12: false }); // HH:mm:ss

  return `${date} ${time}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function ensureDirOf(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- One-time init per whole run (กันล้างไฟล์ซ้ำเวลา retry) ---
const initFlag = path.resolve(process.cwd(), 'config/.init_done');

function initOnce() {
  if (fs.existsSync(initFlag)) return;
  try { fs.rmSync(path.resolve(process.cwd(), 'config/.locks'),   { recursive: true, force: true }); } catch {}
  try { fs.rmSync(path.resolve(process.cwd(), 'config/.started'), { recursive: true, force: true }); } catch {}
  try { fs.unlinkSync(barrierFile); } catch {}
  try { fs.unlinkSync(path.resolve(process.cwd(), 'config/.finished')); } catch {}
  try { fs.unlinkSync(path.resolve(process.cwd(), 'config/.report_writer')); } catch {}
  try { fs.unlinkSync(path.resolve(process.cwd(), 'config/.progress_writer')); } catch {}
  try { fs.rmSync(resultsDir, { recursive: true, force: true }); } catch {}
  try { setNextSeq(1); } catch {}
  fs.writeFileSync(initFlag, '1', 'utf8');
}

// วางใต้ Helpers: time + sleep
// แทนที่ฟังก์ชันเดิมทั้งก้อน
function raceWithPageClose(page, promise, label = 'wait') {
  if (page.isClosed()) throw new Error(`Page already closed before ${label}`);

  return new Promise((resolve, reject) => {
    const onClose = () => reject(new Error(`Page closed during ${label}`));
    page.once('close', onClose);

    Promise.resolve(promise).then(
      (v) => { page.off('close', onClose); resolve(v); },
      (e) => { page.off('close', onClose); reject(e); }
    );
  });
}


async function ensureModalReady(page) {
  const modal = page.locator('div.modal-content', { hasText: 'ยืนยันการซื้อประกัน' });
  await raceWithPageClose(page, modal.waitFor({ state: 'visible', timeout: 30_000 }), 'modal visible');
  await raceWithPageClose(page, page.waitForTimeout(400), 'modal settle');
  await modal.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'auto' }));
  return modal;
}


async function clickWithRetries(locator, {
  tries = 4,
  perTryTimeout = 10_000,
  beforeEachTry = async () => {},
  name = 'target',
  page // 👈 new: ส่ง page มาด้วย
} = {}) {
  let lastErr;
  for (let i = 1; i <= tries; i++) {
    try {
      if (page?.isClosed()) throw new Error('page closed');
      await beforeEachTry(i);

      await raceWithPageClose(page,
        locator.waitFor({ state: 'visible', timeout: perTryTimeout }),
        `wait ${name} visible`
      );

      const el = locator.first();
      await el.evaluate((btn) => {
        if (btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') {
          throw new Error('Button disabled');
        }
      });

      await el.scrollIntoViewIfNeeded();
      await raceWithPageClose(page, el.click({ timeout: perTryTimeout }), `click ${name}`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ click ${name} ${i}/${tries} ล้มเหลว: ${err.message || err}`);
      if (i < tries) await sleep(300 + i * 300);
    }
  }
  throw lastErr;
}



// ------------------------------
// Dedup & Lock helpers (กันเคสเดียวกันรันซ้อน + กัน append ซ้ำ)
// ------------------------------
const lockDir = path.resolve(process.cwd(), 'config/.locks');
function ensureLockDir() {
  if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir, { recursive: true });
}
// ล็อก exclusive ต่อ seq (เช่นเคส #8) เพื่อกันรันซ้อนระหว่าง retry/re-schedule
async function acquireSeqLock(seq) {
  ensureLockDir();
  const lockFile = path.join(lockDir, `seq-${seq}.lock`);
  while (true) {
    try {
      // 'wx' = สร้างใหม่เท่านั้น ถ้ามีอยู่แล้วจะ throw → ป้องกันซ้อน
      const fd = fs.openSync(lockFile, 'wx');
      fs.closeSync(fd);
      return () => { try { fs.unlinkSync(lockFile); } catch {} };
    } catch {
      // เคลียร์ล็อกค้างถ้าเกิน 20 นาที
      try {
        const st = fs.statSync(lockFile);
        const ageMs = Date.now() - st.mtimeMs;
        if (ageMs > 20 * 60_000) fs.unlinkSync(lockFile);
      } catch {}
      await sleep(500 + Math.floor(Math.random() * 500));
    }
  }
}
// บันทึก "ready-N" ลง barrier แบบกันซ้ำต่อ seq
function safeAppendReady(barrierPath, seq) {
  const line = `ready-${seq}`;
  let lines = [];
  if (fs.existsSync(barrierPath)) {
    lines = fs.readFileSync(barrierPath, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.includes(line)) return; // เคยบันทึกแล้ว → ไม่เพิ่มซ้ำ
  }
  fs.appendFileSync(barrierPath, line + '\n');
}

// ------------------------------
// Started flag (กันเริ่มซ้ำต่อ seq — เผื่อ race ก่อนล็อกจับทัน)
// ------------------------------
const startedDir = path.resolve(process.cwd(), 'config/.started');
function ensureStartedDir() {
  if (!fs.existsSync(startedDir)) fs.mkdirSync(startedDir, { recursive: true });
}
// function hasStarted(seq) {
//   ensureStartedDir();
//   const f = path.join(startedDir, `started-${seq}.flag`);
//   return fs.existsSync(f);
// }
// function markStarted(seq) {
//   ensureStartedDir();
//   const f = path.join(startedDir, `started-${seq}.flag`);
//   if (!fs.existsSync(f)) fs.writeFileSync(f, String(Date.now()), 'utf8');
// }

// ==============================
// Keep-Alive (กันหน้าเว็บ idle timeout)
// ==============================
// firstPing: 'immediate' = ยิงทันที (ดีฟอลต์, ปลอดภัยสุด)
// firstPing: 'delay'     = หน่วงตาม interval ก่อน ping ครั้งแรก
// firstPing: number(ms)  = ระบุ delay ครั้งแรกเอง (ms)

function startKeepAlive(page, {
  intervalMs = 8 * 60_000,
  jitterMs = 30_000,
  logPrefix = '⏳ keep-alive',
  firstPing = 8 * 60_000 // 'immediate' | 'delay' | number
} = {}) {
  let stopped = false;
  const stop = () => { stopped = true; };
  const rand = (a,b)=>Math.floor(a + Math.random()*(b-a+1));
  const nextDelay = () => Math.max(5_000, intervalMs + rand(-jitterMs, jitterMs));

  // ถ้า page ปิด → หยุดทันที
  page.once('close', stop);

  (async () => {
    let first = true;
    // ⬇⬇⬇ วาง “ลูปนี้” แทนของเดิมตั้งแต่ตรงนี้ ⬇⬇⬇
    while (!stopped) {
      let wait = nextDelay();
      if (first) {
        if (firstPing === 'immediate') wait = 0;
        else if (firstPing === 'delay') { /* keep */ }
        else if (typeof firstPing === 'number') wait = firstPing;
      }

      try {
        // รอเวลาหรือรอ page ปิด อย่างใดอย่างหนึ่ง
        await Promise.race([
          page.waitForTimeout(wait),
          page.waitForEvent('close', { timeout: 0 })
        ]);
        if (stopped || page.isClosed()) break;

        // ping เบา ๆ
        const x = 5 + Math.floor(Math.random()*10);
        const y = 5 + Math.floor(Math.random()*10);
        await page.mouse.move(x, y);
        await page.mouse.move(x+1, y+1);
        await page.keyboard.down('Shift'); await page.keyboard.up('Shift');
        await page.evaluate(() => {
          const e = new MouseEvent('mousemove', { bubbles:true, clientX:2, clientY:2 });
          document.dispatchEvent(e); window.dispatchEvent(new Event('focus'));
        });
        console.log(`${logPrefix}: ping`);
      } catch (e) {
        console.warn(`${logPrefix}: stop (${e?.message || e})`);
        break;
      }
      first = false;
    }
  })();

  return stop;
}



// ==============================
// Phase-1 Queue (ทีละ worker จนถึงจุดนัดพบ)
// ==============================
function initPhase1Next() {
  ensureDirOf(phase1NextFile);
  if (!fs.existsSync(phase1NextFile)) {
    fs.writeFileSync(phase1NextFile, '1', 'utf8');
    console.log(`[init] phase1_next = 1`);
  }
}
function readNextSeq() {
  try {
    const v = fs.readFileSync(phase1NextFile, 'utf8').trim();
    return parseInt(v || '1', 10);
  } catch {
    return 1;
  }
}
function setNextSeq(n) {
  ensureDirOf(phase1NextFile);
  fs.writeFileSync(phase1NextFile, String(n), 'utf8');
}
async function waitForTurn(mySeq) {
  initPhase1Next();
  while (true) {
    const next = readNextSeq();
    if (next === mySeq) {
      console.log(`[${now()}] 👷 Worker#${mySeq} ได้คิวเริ่ม Phase-1`);
      return;
    }
    await sleep(50 + Math.floor(Math.random() * 100)); // anti-thundering herd
  }
}
function advanceTurn(mySeq) {
  const next = readNextSeq();
  if (next === mySeq) {
    setNextSeq(mySeq + 1);
    console.log(`[${now()}] ⏭️ ปล่อยคิว → phase1_next = ${mySeq + 1}`);
  } else {
    console.log(`[${now()}] (info) phase1_next=${next} ไม่เท่ากับ mySeq=${mySeq}, ข้ามการปล่อยคิว`);
  }
}

// ==============================
// Phase-2 Barrier (รอครบทุก worker ก่อนกด "ขอรหัส")
// ==============================
async function waitForBarrierProgress(
  page,
  { seq, expected, settleMs = null, maxWaitMs = 30 * 60_000, render = true } = {}
) {
  const start = Date.now();
  let lastCount = -1;

  while (true) {
    if (page.isClosed()) throw new Error('Page closed during barrier wait');

    const lines = fs.existsSync(barrierFile)
      ? fs.readFileSync(barrierFile, 'utf8').trim().split('\n').filter(Boolean)
      : [];
    const count = new Set(lines).size;

    // พิมพ์เฉพาะ: count เปลี่ยน + เราคือ "ผู้ประกาศล่าสุด" + เปิด render
    if (count !== lastCount && render && isProgressWriter(seq)) {
      lastCount = count;
      const percent = (count / expected) * 100;
      const barLength = 20;
      const filledLength = Math.round((count / expected) * barLength);
      const bar = '🟩'.repeat(filledLength) + '⬜'.repeat(barLength - filledLength);
      process.stdout.write(`\r🔄 Barrier Progress: ${bar} ${count}/${expected} (${percent.toFixed(1)}%)`);
    }

    if (count >= expected) {
      if (render && isProgressWriter(seq)) console.log(); // ขึ้นบรรทัดใหม่เฉพาะผู้ประกาศ
      if (settleMs) {
        await Promise.race([
          page.waitForTimeout(settleMs),
          page.waitForEvent('close', { timeout: 0 })
        ]);
      }
      break;
    }

    if (Date.now() - start >= maxWaitMs) {
      throw new Error(`[barrier] timeout with ${count}/${expected}`);
    }

    await Promise.race([
      page.waitForTimeout(500),
      page.waitForEvent('close', { timeout: 0 })
    ]);
  }



  console.log(); // ขึ้นบรรทัดใหม่เมื่อครบ
}


// 🕐 จับเวลาเริ่มต้น
const RUN = { startedAt: Date.now() };

function formatDuration(msTotal) {
  const ms = msTotal % 1000;
  const totalSec = Math.floor(msTotal / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);
  if (ms > 0) parts.push(`${ms}ms`);

  return parts.join(' ');
}


function fmt(dt) {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dt);
  const time = dt.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour12: false
  });
  return `${iso} ${time}`;
}


// 🧠 เก็บผลแต่ละ worker
const summaryMap = new Map();
function addResult(workerId, phone, refCode) {
  const rec = { workerId, phone, refCode };
  summaryMap.set(workerId, rec); // เก็บในหน่วยความจำ (เผื่อดีบัก)

  // ⬇️ เขียนลงไฟล์ เพื่อให้ process อื่นอ่านได้
  try {
    fs.mkdirSync(resultsDir, { recursive: true });
    const f = path.join(resultsDir, `worker-${String(workerId).padStart(2,'0')}.json`);
    fs.writeFileSync(f, JSON.stringify(rec), 'utf8');
  } catch {}
}

// ==============================
// Finish barrier + Report writer (กันสรุปก่อนเวลา)
// ==============================
const finishedFile = path.resolve(process.cwd(), 'config/.finished');
const reportWriterFile = path.resolve(process.cwd(), 'config/.report_writer');

function safeAppendDone(finishedPath, seq) {
  const line = `done-${seq}`;
  let lines = [];
  if (fs.existsSync(finishedPath)) {
    lines = fs.readFileSync(finishedPath, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.includes(line)) return;
  }
  ensureDirOf(finishedPath);
  fs.appendFileSync(finishedPath, line + '\n');
}

// จองสิทธิ์เป็น "ผู้พิมพ์รายงาน" (มีได้แค่ 1 คน ด้วย 'wx')
function tryBecomeReportWriter() {
  ensureDirOf(reportWriterFile);
  try {
    const fd = fs.openSync(reportWriterFile, 'wx'); // สร้างได้แค่คนแรก
    fs.closeSync(fd); // ปิดเลย ไม่ต้องเขียนอะไรเพิ่มก็ได้
    return true;
  } catch {
    return false;
  }
}

// รอจน done ครบ expected (poll แบบเบาๆ)
async function waitForAllFinished(expected, { timeoutMs = 30 * 60_000, pollMs = 300 } = {}) {
  const start = Date.now();
  let last = -1;
  while (true) {
    const lines = fs.existsSync(finishedFile)
      ? fs.readFileSync(finishedFile, 'utf8').trim().split('\n').filter(Boolean)
      : [];
    const count = new Set(lines).size;
    if (count !== last) {
      last = count;
      process.stdout.write(`\r✅ Completed workers: ${count}/${expected}`);
    }
    if (count >= expected) { console.log(); return; }
    if (Date.now() - start > timeoutMs) throw new Error(`waitForAllFinished timeout: ${count}/${expected}`);
    await new Promise(r => setTimeout(r, pollMs));
  }
}


// ==============================
// Test data
// ==============================
const phonenos = ['0933995001','0933995002','0933995003','0933995004','0933995005','0933995006']; //,'0933995007','0933995008','0933995009','0933995010','0933995011','0933995012','0933995013','0933995014','0933995015','0933995016','0933995017']; //,'0933995018','0933995019','0933995020'
// หลังประกาศ phonenos เสร็จ
let totalWorkers;
try {
  totalWorkers = parseInt(
    (fs.existsSync(workerCountFile) ? fs.readFileSync(workerCountFile, 'utf8') : String(phonenos.length)).trim() || String(phonenos.length),
    10
  );
} catch {
  totalWorkers = phonenos.length; // fallback ที่ถูกต้อง
}
console.log(`[init] totalWorkers = ${totalWorkers}`);


// ==============================
// Tests
// ==============================
for (const [index, no] of phonenos.entries()) {
  test(`Purchase SMS OTP - ${index + 1}`, async ({ page }) => {
    const seq = index + 1; // ลำดับคิวตาม array
    const phoneno = no;
    test.setTimeout(30 * 60_000); // 30 นาที

    // 🔎 ใส่บรรทัดพวกนี้ "ตรงนี้" เลย (ก่อนใช้งาน page อื่นๆ)
    page.on('close', () => console.warn(`[${now()}] [W${seq}] page.close()`));
    page.context().on('close', () => console.warn(`[${now()}] [W${seq}] context.close()`));
    page.context().browser()?.on('disconnected', () => console.warn(`[${now()}] [W${seq}] browser.disconnected`));
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(60_000);

    initOnce();
    
    // (ทางเลือก) เคลียร์ state ครั้งแรกของรอบ เพื่อกันค้างจากรันก่อนหน้า
   if (seq === 1) {
    try { fs.rmSync(path.resolve(process.cwd(), 'config/.locks'), { recursive: true, force: true }); } catch {}
    try { fs.rmSync(path.resolve(process.cwd(), 'config/.started'), { recursive: true, force: true }); } catch {}
    try { fs.unlinkSync(barrierFile); } catch {}
    try { setNextSeq(1); } catch {}
    try { fs.rmSync(resultsDir, { recursive: true, force: true }); } catch {}
  }

    // 🔒 ป้องกันเคสเดียวกันรันซ้อน (เช่น #8) ระหว่าง retry/re-schedule
    const releaseLock = await acquireSeqLock(seq);
  let stopKA;
  try {
    await waitForTurn(seq);

      // ---------- Phase-1: รอคิวเริ่ม ----------
      // await waitForTurn(seq);

      const idcard = '4727713711739';
      const name = 'ทดสอบ';
      const username = 'เทส';
      
      const email = 'thanakrit.ph@ocean.co.th';

      // ====== Flow เดิมจนถึง "ยืนยันคำสั่งซื้อ" ======
      await page.goto('https://uat2-oceanlife.ochi.link/');
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ


      if (await page.locator('div[class="cookie-warning"]').isVisible({ timeout: 5000 })) {
        await page.locator('div[class="cookie-warning"]').getByRole('button', { name: 'ยอมรับ' }).click({ timeout: 10000 });
      }

      await page.getByRole('link', { name: 'ซื้อประกันออนไลน์' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.locator('div:nth-child(4) > input').check();
      await page.locator('a[href="https://uat2-oceanlife.ochi.link/our-products/personal-accident/oceanlife-pa-easy?purchase_intent=1#purchase"]').click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByLabel('1 / 5').getByRole('button', { name: 'เลือกแผนนี้' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByText('ไม่เคย').click({ timeout: 10000 });
      await page.getByRole('button', { name: 'ต่อไป  ' }).click({ timeout: 10000 }); // ระวัง NBSP
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByText('ผู้ชาย').click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.locator('input[name="birthdate"]').click({ timeout: 10000 });
      await page.getByRole('combobox').nth(3).selectOption('1996');
      await page.getByLabel('ตุลาคม 1,').click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByText('เลือกกลุ่มอาชีพ').nth(2).click({ timeout: 10000 });
      await page.locator('div').filter({ hasText: /^พนักงานบริษัท$/ }).click({ timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.getByText('อาชีพ', { exact: true }).nth(2).click({ timeout: 10000 });
      await page.locator('div').filter({ hasText: /^พนักงานธนาคาร$/ }).click({ timeout: 10000 });
      await page.getByRole('button', { name: ' คำนวณเบี้ยประกันภัย' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByRole('button', { name: ' ซื้อประกันออนไลน์' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.locator('input[name="applicant[id_card_no]"]').click({ timeout: 10000 });
      await page.locator('input[name="applicant[id_card_no]"]').type(idcard, { delay: 100 });
      await page.locator('#applicant-identity div').filter({ hasText: 'เลขบัตรประชาชนของผู้ขอเอาประกัน วันบัตรหมดอายุ ตลอดชีพ วันบัตรหมดอายุ' }).locator('input[name="applicant[id_expired_date]"]').click({ timeout: 10000 });
      await page.getByRole('combobox').nth(2).selectOption('2026');
      await page.getByLabel('ตุลาคม 8,').first().click({ timeout: 10000 });
      await page.locator('.selectbox__label').first().click({ timeout: 10000 });
      await page.locator('#applicant-profile div').filter({ hasText: /^นาย$/ }).click({ timeout: 10000 });
      await page.locator('input[name="applicant[first_name]"]').click({ timeout: 10000 });
      await page.locator('input[name="applicant[first_name]"]').type(name, { delay: 100 });
      await page.locator('input[name="applicant[last_name]"]').click({ timeout: 10000 });
      await page.locator('input[name="applicant[last_name]"]').type(username, { delay: 100 });
      await page.locator('input[type="email"]').click({ timeout: 10000 });
      await page.locator('input[type="email"]').type(email, { delay: 100 });
      await page.locator('#applicant-profile div').filter({ hasText: 'อีเมล หมายเลขโทรศัพท์มือถือ' }).locator('input[type="text"]').click({ timeout: 10000 });
      await page.locator('#applicant-profile div').filter({ hasText: 'อีเมล หมายเลขโทรศัพท์มือถือ' }).locator('input[type="text"]').type(phoneno, { delay: 100 });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: ' ยืนยันข้อมูล' }).click({ timeout: 10000 });

      await page.locator('label').filter({ hasText: 'ข้าพเจ้าได้อ่าน และทำความเข้าใจข้อกำหนดและเงื่อนไขการใช้บริการเว็บไซต์ และนโยบาย' }).click({ timeout: 10000 });
      await expect(page.locator('div[class="modal-content"]').getByText('ข้อกำหนดและเงื่อนไขการใช้บริการเว็บไซต์ www.ocean.co.th')).toBeVisible({ timeout: 30000 });
      await page.locator('div[class="modal-content"]', { hasText: 'กรุณาอ่านรายละเอียดและยอมรับเงื่อนไขการใช้งาน' }).getByRole('button', { name: 'ยอมรับ', exact: true }).click({ timeout: 10000 });
      await expect(page.locator('div[class="modal-content"]').getByText('ข้อกำหนดและเงื่อนไขการใช้บริการเว็บไซต์ www.ocean.co.th')).not.toBeVisible({ timeout: 30000 });

      await page.locator('label').filter({ hasText: 'ข้าพเจ้าได้รับทราบเงื่อนไขการสมัครขอเอาประกันภัยทางอิเล็กทรอนิกส์และเข้าใจข้อควา' }).click({ timeout: 10000 });
      await expect(page.locator('div[class="modal-content"]').getByText('ข้าพเจ้าผู้ขอเอาประกันภัย/ผู้แทนโดยชอบธรรม ขอยืนยันรับทราบและเข้าใจผลิตภัณฑ์ประกันภัย ดังนี้')).toBeVisible({ timeout: 30000 });
      await page.locator('div[class="modal-content"]', { hasText: 'กรุณาอ่านรายละเอียดและยอมรับเงื่อนไขการใช้งาน' }).getByRole('button', { name: 'ยอมรับ', exact: true }).click({ timeout: 10000 });
      await expect(page.locator('div[class="modal-content"]').getByText('ข้าพเจ้าผู้ขอเอาประกันภัย/ผู้แทนโดยชอบธรรม ขอยืนยันรับทราบและเข้าใจผลิตภัณฑ์ประกันภัย ดังนี้')).not.toBeVisible({ timeout: 30000 });

      await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.locator('input[name="question[138][7]"]').click({ timeout: 10000 });
      await page.locator('input[name="question[138][7]"]').type('175');
      await page.locator('input[name="question[139][8]"]').click({ timeout: 10000 });
      await page.locator('input[name="question[139][8]"]').type('90');
      await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByText('สัญชาติ').nth(2).click({ timeout: 10000 });
      await page.getByText('ไทย', { exact: true }).nth(1).click({ timeout: 10000 });
      await page.locator('input[name="applicant[main_occupation_position]"]').click({ timeout: 10000 });
      await page.locator('input[name="applicant[main_occupation_position]"]').type('ทดสอบ', { delay: 100 });
      await page.getByRole('textbox', { name: 'รายได้ (ต่อปี)' }).click({ timeout: 10000 });
      await page.getByRole('textbox', { name: 'รายได้ (ต่อปี)' }).type('20,0000', { delay: 100 });
      await page.getByRole('textbox', { name: 'บ้านเลขที่' }).click({ timeout: 10000 });
      await page.getByRole('textbox', { name: 'บ้านเลขที่' }).type('111', { delay: 100 });
      await page.locator('input[name="applicant[address_registered][postal_code]"]').click({ timeout: 10000 });
      await page.locator('input[name="applicant[address_registered][postal_code]"]').type('10600', { delay: 100 });
      await page.getByText('- วัดท่าพระ บางกอกใหญ่ กรุงเทพมหานคร').click({ timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByText('คำนำหน้าชื่อ').nth(2).click({ timeout: 10000 });
      await page.locator('div').filter({ hasText: /^นาย$/ }).click({ timeout: 10000 });
      await page.getByRole('textbox').nth(4).click({ timeout: 10000 });
      await page.getByRole('textbox').nth(4).type('ทดสอบ', { delay: 100 });
      await page.getByRole('textbox').nth(5).click({ timeout: 10000 });
      await page.getByRole('textbox').nth(5).type('เทส', { delay: 100 });
      await page.getByText('เลือกความสัมพันธ์').nth(2).click({ timeout: 10000 });
      await page.locator('div').filter({ hasText: /^บิดา$/ }).click({ timeout: 10000 });
      await page.getByRole('spinbutton').nth(1).click({ timeout: 10000 });
      await page.getByRole('spinbutton').nth(1).type('30', { delay: 100 });
      await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.getByText('ไม่มีความประสงค์').click({ timeout: 10000 });
      await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      const fileInput_idcard_front = page.locator('input[name="idcard_front"]');
      await fileInput_idcard_front.setInputFiles('C:/Users/rangsiman.ph/Documents/GitHub/Playwright-Automation/pic/ochi-thank@2x.png');
      const fileInput_selfie = page.locator('input[name="selfie"]');
      await fileInput_selfie.setInputFiles('C:/Users/rangsiman.ph/Documents/GitHub/Playwright-Automation/pic/ochi-thank@2x.png');
      const fileInput_idcard = page.locator('input[name="idcard_selfie"]');
      await fileInput_idcard.setInputFiles('C:/Users/rangsiman.ph/Documents/GitHub/Playwright-Automation/pic/ochi-thank@2x.png');
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
      await raceWithPageClose(page, page.waitForLoadState('networkidle'), 'networkidle');
// แทนทุกๆ จุดที่เรียก waitForLoadState แบบตรงๆ

      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' }).click({ timeout: 10000 });
      await expect(page.locator('div[class="modal-content "]', { hasText: 'ยืนยันการซื้อประกัน' })).toBeVisible({ timeout: 30000 });

      console.log(`[${now()}] 🚀 Worker ${seq}: reached meeting point (ก่อน "ขอรหัส")`);

      // ---------- สิ้นสุด Phase-1 ของ worker นี้: ปล่อยคิวให้คนถัดไป ----------
      advanceTurn(seq);

     // ---------- แจ้งพร้อมเข้า barrier (กัน append ซ้ำ) ----------
safeAppendReady(barrierFile, seq);
setProgressWriter(seq); // ประกาศตัวเองเป็น progress writer

// ✅ เริ่ม keep-alive "ระหว่างรอ barrier" (ห้ามหยุดก่อน)
stopKA = startKeepAlive(page, {
  intervalMs: 5 * 60_000,
  jitterMs: 30_000,
  logPrefix: `⏳ keep-alive [W${seq}]`,
  firstPing: 'immediate'
});

// ✅ รอให้ครบทุก worker ที่จะเข้าร่วมจริง ๆ
const expectedReady = Math.min(totalWorkers || phonenos.length, phonenos.length);


// ✅ เรียก progress bar ตรงนี้
await waitForBarrierProgress(page, {
  seq,// ส่ง seq ตัวเองไปด้วย
  expected: expectedReady,
  settleMs: 1000,
  maxWaitMs: 10 * 60_000,
  render: true
});

console.log(`[${now()}] 🚀 Worker ${seq}: starting Phase-2`);

// (ทางเลือก) ลดโอกาส UI สะดุดพร้อมกันมากเกินไป แต่ยังแทบพร้อมกันอยู่
// const jitter = (seq % 7) * 120; // สูงสุด ~720ms
// await page.waitForTimeout(jitter);

// ให้ modal พร้อมนิ่งก่อน
const modal = await ensureModalReady(page);
const btnRequest = modal.getByRole('button', { name: 'ขอรหัส' });


 

// กดด้วย retry ที่ทนต่อ re-render/disabled/เลื่อนจอ
await clickWithRetries(btnRequest, {
  tries: 4,
  perTryTimeout: 10_000,
  name: 'ขอรหัส',
  page,
  beforeEachTry: async () => {
    if (!(await modal.isVisible().catch(()=>false))) await ensureModalReady(page);
  }
});


// อ่านรหัสอ้างอิงหลังคลิก
const refText = await page
  .locator('div.modal-content', { hasText: 'ยืนยันการซื้อประกัน' })
  .locator('p')
  .nth(2)
  .textContent({ timeout: 15_000 });

// ดึงเฉพาะ “รหัสอ้างอิง” ออกมา (กันข้อความอื่นพ่วง)
const refCode = (refText || '').trim().match(/[A-Z0-9]{4,}/)?.[0] || (refText || '').trim();

// เก็บผลสรุปให้ worker นี้ (ใช้ seq/phoneno ของเทส)
addResult(seq, phoneno, refCode);

console.log(`Worker ${seq} : ${refCode}`);


// console.log(`Worker ${seq} : ${refcode ? refcode.trim() : ''}`);

    } finally {
       try { safeAppendDone(finishedFile, seq); } catch {}   // ✅ บันทึกว่า worker นี้ “จบแล้ว”
      // 🗝️ ปล่อยล็อกเคสนี้ (กันล็อกค้าง)
      try { stopKA?.(); } catch { stopKA = null; }
      try { releaseLock(); } catch {}
    }
    
  });
}
test.afterAll(async () => {
  const expectedReady = Math.min(totalWorkers || phonenos.length, phonenos.length);

  if (!tryBecomeReportWriter()) return;   // ✅ กันซ้ำด้วยไฟล์ล็อก

  await waitForAllFinished(expectedReady, { timeoutMs: 30 * 60_000, pollMs: 500 });

  // อ่านผลจากไฟล์ทุก worker
  let summaryResults = [];
  try {
    if (fs.existsSync(resultsDir)) {
      const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
      summaryResults = files.map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf8')); }
        catch { return null; }
      }).filter(Boolean).sort((a,b) => a.workerId - b.workerId);
    }
  } catch {}

  const endedAt = Date.now();
  const started = new Date(RUN.startedAt);
  const ended   = new Date(endedAt);
  const spentMs = endedAt - RUN.startedAt;

  console.log('\n🧪━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FINAL OTP TEST REPORT');
  console.log(`🕐 Started:   ${fmt(started)}`);
  console.log(`🕛 Finished:  ${fmt(ended)}`);
  console.log(`🕛 Duration:  ${formatDuration(spentMs)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  summaryResults.forEach(r => {
    console.log(`👷 Worker #${String(r.workerId).padStart(2,' ')} │ 📞 ${r.phone.padEnd(12)} │ 📌 ${r.refCode}`);
  });

  console.log(`\n✅ Total Workers: ${summaryResults.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
