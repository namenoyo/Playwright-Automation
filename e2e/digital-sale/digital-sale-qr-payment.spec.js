/**
 * Digital Sale — QR Payment Flow (Phase 2)
 *
 * รัน flow ต่อจาก Phase 1 (ได้เลขใบคำขอ + Test Status QR = Ready for Test)
 * NBS: Gen QR → Swagger: ยิง Payment → NBS: Run Batch → NBHQ: ตรวจสอบ → ได้เลขกธ
 *
 * วิธีรัน:
 *   cd playwright
 *   npx playwright test digital-sale/digital-sale-qr-payment.spec.js --headed --workers=1
 */

const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { fetchQrRunnableCases, claimQrCase, writeQrResult } = require('./data/write-result');

// ─── Config ───────────────────────────────────────────────────────────────────

const RUN_CREATE_BY = 'เนม'; // แก้ให้ตรงกับ Create By ใน sheet

const NBS_URL = {
  SIT: 'http://sitnbs.thaisamut.co.th/nbsweb/secure/home.html',
  UAT: 'http://uatnbs.thaisamut.co.th/nbsweb/secure/home.html',
};

// NBS: User=Boss, Pass=อะไรก็ได้ (test env ไม่ตรวจรหัส)
const NBS_BOSS_USER = 'Boss';
const NBS_BOSS_PASS = '1234';

// NBHQ: User=MG0001 (ใช้ login NBS เดิม แต่ user ต่างกัน)
const NBS_NBHQ_USER = 'MG0001';
const NBS_NBHQ_PASS = '1234';

// Swagger Thai QR
const SWAGGER_API = {
  SIT: 'http://11.100.6.51/thaisamut/rs/thaiqr/v1',
  UAT: 'http://11.100.7.73/thaisamut/rs/thaiqr/v1',
};
const SWAGGER_USER = 'OliQR20Test';
const SWAGGER_PASS = '6FzHL}nmG)+8';
const SWAGGER_PROVIDER_ID = '1'; // TODO: ตรวจสอบค่าที่ถูกต้อง

const DUMMY_PHONE = '0000000000';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');

// ─────────────────────────────────────────────────────────────────────────────

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const todayISO  = () => new Date().toISOString().slice(0, 10);            // YYYY-MM-DD
const todaySlash = () => { const [y,m,d] = todayISO().split('-'); return `${d}/${m}/${y}`; };
const nowTime   = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; };

const ss = async (page, label) => {
  const p = path.join(SCREENSHOT_DIR, `qr-${label}-${Date.now()}.png`);
  await page.screenshot({ path: p, fullPage: true }).catch(() => {});
  console.log(`  📸 ${p}`);
};

// helper: คลิก element แรกที่ match text (ลองทุก tag ที่ clickable)
const clickText = async (page, text, timeout = 5000) => {
  const loc = page.locator(`a, button, input[type="button"], input[type="submit"], td, span, li`)
    .filter({ hasText: typeof text === 'string' ? new RegExp(text, 'i') : text })
    .first();
  if (await loc.isVisible({ timeout }).catch(() => false)) {
    await loc.click();
    return true;
  }
  return false;
};

// helper: ดึง main frame (NBS อาจใช้ frameset)
const mainFrame = (page) => {
  const frames = page.frames();
  if (frames.length > 1) {
    const content = frames.find(f => f.url().includes('/nbsweb') && !f.url().includes('menu'));
    return content || page.mainFrame();
  }
  return page.mainFrame();
};

// ─── Phase A: Login NBS ──────────────────────────────────────────────────────

async function loginNBS(page, user, pass, url) {
  console.log(`\n🔐 Login NBS: ${user} @ ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await ss(page, `login-before-${user}`);

  const frame = mainFrame(page);

  // username
  const userInput = frame.locator([
    'input[name="j_username"]',
    'input[name="username"]',
    'input[id*="username" i]',
    'input[type="text"]',
  ].join(', ')).first();
  await userInput.waitFor({ state: 'visible', timeout: 10000 });
  await userInput.fill(user);

  // password
  const passInput = frame.locator('input[type="password"]').first();
  if (await passInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passInput.fill(pass);
  }

  // submit
  const loginBtn = frame.locator([
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("เข้าสู่ระบบ")',
    'a:has-text("เข้าสู่ระบบ")',
  ].join(', ')).first();
  await loginBtn.waitFor({ state: 'visible', timeout: 5000 });
  await loginBtn.click();

  await page.waitForTimeout(3000);
  await ss(page, `login-after-${user}`);
  console.log(`  ✅ Login สำเร็จ | URL: ${page.url()}`);
}

// ─── Phase A: NBS Centralized SMS → Gen QR ───────────────────────────────────

async function genQRAndGetData(page, applicationNo) {
  console.log(`\n📌 Phase A: Centralized SMS → Gen QR | เลขใบคำขอ: ${applicationNo}`);
  const frame = mainFrame(page);

  // Step A-1: เมนู Back Office
  console.log('  → คลิก Back Office');
  await clickText(page, 'Back Office');
  await page.waitForTimeout(1000);
  await ss(page, 'menu-backoffice');

  // Step A-2: Centralized SMS
  console.log('  → คลิก Centralized SMS');
  if (!await clickText(page, 'Centralized SMS')) {
    await ss(page, 'menu-no-sms');
    throw new Error('❌ ไม่พบเมนู Centralized SMS');
  }
  await page.waitForTimeout(800);

  // Step A-3: ส่ง SMS แจ้งเตือนชำระเบี้ย (Barcode)
  console.log('  → คลิก ส่ง SMS Barcode');
  const smsClicked = await clickText(page, 'Barcode')
    || await clickText(page, 'ส่ง SMS แจ้งเตือนชำระเบี้ย')
    || await clickText(page, 'Centralized SMS ลูกค้า');

  if (!smsClicked) {
    await ss(page, 'menu-no-barcode');
    throw new Error('❌ ไม่พบเมนู ส่ง SMS Barcode');
  }
  await page.waitForTimeout(1500);
  await ss(page, 'sms-barcode-page');

  // Step A-4: กรอกเลขกธ/เลขใบคำขอ
  console.log(`  → กรอก: ${applicationNo}`);
  const refInput = frame.locator('input[type="text"]').first();
  await refInput.waitFor({ state: 'visible', timeout: 10000 });
  await refInput.fill(String(applicationNo));

  await clickText(page, 'ค้นหา') || await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await ss(page, 'sms-search-result');

  // log หน้าจอหลังค้นหา
  const searchText = await frame.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`  📄 Search result (300 chars): ${searchText.substring(0, 300)}`);

  // Step A-5: แก้เบอร์โทรเป็น Dummy ⚠️ สำคัญมาก
  const allTextInputs = frame.locator('input[type="text"]');
  const inputCount = await allTextInputs.count().catch(() => 0);
  for (let i = 0; i < inputCount; i++) {
    const inp = allTextInputs.nth(i);
    const val = (await inp.inputValue().catch(() => '')).replace(/\D/g, '');
    if (/^0\d{8,9}$/.test(val)) {
      await inp.triple_click?.() ;
      await inp.fill(DUMMY_PHONE);
      console.log(`  ✅ เปลี่ยนเบอร์ ${val} → ${DUMMY_PHONE}`);
      break;
    }
  }

  // Step A-6: กด ตกลง
  await clickText(page, 'ตกลง') || await clickText(page, 'Submit') || await clickText(page, 'บันทึก');
  await page.waitForTimeout(2000);
  await ss(page, 'sms-after-ok');

  // Step A-7: หา link ที่ปรากฏ → คลิกไปหน้า QR
  const bodyAfterOk = await frame.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`  📄 After ตกลง (300 chars): ${bodyAfterOk.substring(0, 300)}`);

  // หา link ทุกอัน
  const allLinks = await page.locator('a[href]').all();
  console.log(`  🔎 พบ links: ${allLinks.length}`);
  for (const link of allLinks) {
    const href = await link.getAttribute('href').catch(() => '');
    const txt  = await link.innerText().catch(() => '');
    if (href || txt) console.log(`    - [${txt.substring(0,30)}] ${href.substring(0,80)}`);
  }

  // คลิก link แรกที่ดูเหมือน QR link
  let qrPageOpened = false;
  for (const link of allLinks) {
    const href = await link.getAttribute('href').catch(() => '');
    if (/qr|barcode|sms|payment|pay/i.test(href)) {
      await link.click();
      qrPageOpened = true;
      console.log(`  🔗 คลิก QR link: ${href}`);
      break;
    }
  }
  if (!qrPageOpened && allLinks.length > 0) {
    // คลิก link แรกที่ไม่ใช่ menu
    for (const link of allLinks) {
      const href = await link.getAttribute('href').catch(() => '');
      if (href && !href.includes('#') && !href.includes('javascript')) {
        await link.click();
        qrPageOpened = true;
        console.log(`  🔗 คลิก link แรก: ${href}`);
        break;
      }
    }
  }

  await page.waitForTimeout(2000);
  await ss(page, 'qr-page');

  // Step A-8: อ่านข้อมูลจาก QR page
  const qrPageText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  const qrPageUrl  = page.url();
  console.log(`\n  📄 QR Page URL: ${qrPageUrl}`);
  console.log(`  📄 QR Page content (600 chars):\n${qrPageText.substring(0, 600)}`);

  // PromptPay QR string (เริ่ม 000201)
  const qrStringMatch = (qrPageText + ' ' + qrPageUrl).match(/000201[0-9A-F]{30,}/i);
  const qrString = qrStringMatch ? qrStringMatch[0] : '';
  if (qrString) console.log(`  ✅ QR String: ${qrString.substring(0, 60)}...`);

  // ref numbers (16-20 หลัก)
  const longNums = [...new Set((qrPageText + ' ' + qrPageUrl).match(/\b\d{16,20}\b/g) || [])];
  console.log(`  🔎 Reference candidates (16-20 digits): [${longNums.join(', ')}]`);

  // biller id (9-15 หลัก ที่อาจมี leading zero)
  const midNums = [...new Set(qrPageText.match(/\b\d{9,15}\b/g) || [])];
  console.log(`  🔎 BillerID candidates (9-15 digits): [${midNums.join(', ')}]`);

  // amount
  const amtMatch = qrPageText.match(/(?:ยอด|amount|เบี้ย|ชำระ)[^\d]*(\d{1,6}(?:\.\d{2})?)/i);
  const amount = amtMatch ? amtMatch[1] : '';
  if (amount) console.log(`  🔎 Amount: ${amount}`);

  // หาข้อมูลจาก URL params ด้วย
  const urlParams = new URL(qrPageUrl.startsWith('http') ? qrPageUrl : `http://x${qrPageUrl}`).searchParams;
  const paramEntries = [...urlParams.entries()];
  if (paramEntries.length) console.log(`  🔎 URL params: ${JSON.stringify(Object.fromEntries(paramEntries))}`);

  return { qrString, longNums, midNums, amount, qrPageUrl, pageText: qrPageText };
}

// ─── Phase B: Swagger — ยิง Payment Notification ─────────────────────────────

async function fireSwaggerPayment(context, env, applicationNo, qrData) {
  console.log('\n📌 Phase B: Swagger ยิง receivePaymentInfo');

  const [ref1 = '', ref2 = ''] = qrData.longNums || [];
  // billerId: ควรเป็น substring pos 5+ ของ merchant_identifier_biller_id
  // ถ้าไม่พบจาก page ใช้ mid number แรกที่มี 9+ หลัก หรือ fallback hardcode
  const billerId = qrData.billerId
    || (qrData.midNums?.find(n => n.length >= 9) || '');
  const amount = qrData.amount || '0.00';

  console.log(`  billerId   : ${billerId || '(ไม่พบ)'}`);
  console.log(`  amount     : ${amount}`);
  console.log(`  reference1 : ${ref1 || '(ไม่พบ)'}`);
  console.log(`  reference2 : ${ref2 || '(ไม่พบ)'}`);

  if (!billerId || !ref1) {
    throw new Error(
      `❌ ข้อมูลไม่ครบสำหรับ Swagger:\n` +
      `  billerId="${billerId}", ref1="${ref1}", ref2="${ref2}"\n` +
      `  → ดู screenshot qr-page-*.png เพื่อหาค่าที่ถูกต้อง\n` +
      `  → QR Page content (200):\n${(qrData.pageText || '').substring(0, 200)}`
    );
  }

  const requestBody = {
    billerId,
    transDate:    todayISO(),
    transTime:    nowTime(),
    termType:     '10',
    amount:       String(amount),
    reference1:   ref1,
    reference2:   ref2,
    reference3:   '',
    fromBank:     '002',
    fromName:     'Ocean Thaisamut',
    bankRef:      'string',
    approvalCode: '12',
    retryFlag:    'N',
  };

  console.log('  📤 Request Body:', JSON.stringify(requestBody));

  const base = SWAGGER_API[env] || SWAGGER_API.UAT;
  const endpoint = `${base}/pymtnoti/providerId/${SWAGGER_PROVIDER_ID}`;
  console.log(`  🌐 POST ${endpoint}`);

  const res = await context.request.post(endpoint, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${SWAGGER_USER}:${SWAGGER_PASS}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    data: requestBody,
    timeout: 30000,
  });

  const statusCode = res.status();
  let resBody = '';
  try { resBody = JSON.stringify(await res.json()); } catch { resBody = await res.text().catch(() => ''); }
  console.log(`  📥 Swagger Response: ${statusCode} | ${resBody.substring(0, 300)}`);

  if (statusCode !== 200) {
    throw new Error(`❌ Swagger receivePaymentInfo: HTTP ${statusCode} | ${resBody}`);
  }

  // ดึง tqp_tx_payment_completed_id จาก response (ถ้ามี)
  let completedId = '';
  try {
    const parsed = JSON.parse(resBody);
    completedId = String(parsed.tqpTxPaymentCompletedId || parsed.completedId || parsed.id || '');
  } catch {}
  console.log(`  completedId: ${completedId || '(ไม่ได้ใน response)'}`);

  return { statusCode, resBody, completedId };
}

// ─── Phase C: Bypass Batch → sendPayCompToHydra ───────────────────────────────

async function bypassBatch(context, env, completedId) {
  if (!completedId) {
    console.log('\n📌 Phase C: ไม่มี completedId → รอ Batch อัตโนมัติ ~10 นาที');
    return false;
  }

  console.log(`\n📌 Phase C: Bypass Batch | completedId=${completedId}`);

  const base = SWAGGER_API[env] || SWAGGER_API.UAT;
  const endpoint = `${base}/sendPayCompToHydra/compId/${completedId}`;
  console.log(`  🌐 POST ${endpoint}`);

  const res = await context.request.post(endpoint, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${SWAGGER_USER}:${SWAGGER_PASS}`).toString('base64'),
    },
    timeout: 30000,
  });

  const statusCode = res.status();
  const resBody = await res.text().catch(() => '');
  console.log(`  📥 Bypass Response: ${statusCode} | ${resBody.substring(0, 200)}`);
  return statusCode === 200;
}

// ─── Phase D: NBS Run Batch Thai QR ──────────────────────────────────────────

async function runNBSBatch(page) {
  console.log('\n📌 Phase D: NBS Run Batch Thai QR');

  // เมนู: ดูแลระบบ → ระบบใบเสร็จส่วนกลาง → Auto Generate ใบเสร็จ
  if (!await clickText(page, 'ดูแลระบบ', 5000)) {
    await ss(page, 'batch-no-menu');
    throw new Error('❌ ไม่พบเมนู ดูแลระบบ');
  }
  await page.waitForTimeout(800);

  await clickText(page, 'ใบเสร็จส่วนกลาง') || await clickText(page, 'Auto Generate');
  await page.waitForTimeout(800);

  await clickText(page, 'Auto Generate ใบเสร็จ') || await clickText(page, 'Auto Generate');
  await page.waitForTimeout(1500);
  await ss(page, 'batch-page');

  const frame = mainFrame(page);

  // หาส่วน Thai QR Data
  const batchText = await frame.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`  📄 Batch page (400 chars): ${batchText.substring(0, 400)}`);

  // ระบุวันที่ชำระ
  const dateInput = frame.locator('input[type="text"], input[type="date"]').first();
  if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    const currentVal = await dateInput.inputValue().catch(() => '');
    if (!currentVal) {
      await dateInput.fill(todaySlash());
      console.log(`  กรอกวันที่: ${todaySlash()}`);
    }
  }

  // กด Run Batch (หาปุ่มที่เกี่ยวกับ Thai QR)
  const runBtns = frame.locator('button, input[type="button"], input[type="submit"]')
    .filter({ hasText: /Run|Batch|รัน|ประมวล/i });
  const runCount = await runBtns.count().catch(() => 0);
  console.log(`  🔎 พบ Run Batch buttons: ${runCount}`);

  if (runCount > 0) {
    // ลองหาปุ่มที่อยู่ใกล้ข้อความ Thai QR ก่อน
    let clicked = false;
    for (let i = 0; i < runCount; i++) {
      const btn = runBtns.nth(i);
      const txt = await btn.innerText().catch(() => '');
      const closestText = await btn.locator('xpath=ancestor::tr[1] | ancestor::div[1]').first()
        .innerText().catch(() => '');
      if (/thai.?qr|qr/i.test(closestText)) {
        await btn.click();
        clicked = true;
        console.log(`  ✅ กด Run Batch (Thai QR): "${txt}"`);
        break;
      }
    }
    if (!clicked) {
      // กดปุ่มแรก
      await runBtns.first().click();
      console.log('  ✅ กด Run Batch (ปุ่มแรก)');
    }

    await page.waitForTimeout(3000);
    await ss(page, 'batch-after-run');

    // ยืนยัน dialog ถ้ามี
    await clickText(page, 'ตกลง') || await clickText(page, 'OK');
    await page.waitForTimeout(2000);
  } else {
    await ss(page, 'batch-no-btn');
    console.warn('  ⚠️ ไม่พบปุ่ม Run Batch');
  }
}

// ─── Phase E: NBHQ Verification ──────────────────────────────────────────────

async function verifyNBHQ(page, applicationNo) {
  console.log(`\n📌 Phase E: NBHQ ตรวจสอบเคส | เลขใบคำขอ: ${applicationNo}`);

  // เมนู: ระบบงานให้บริการ → NBHQ → ตรวจสอบข้อมูลเคสใหม่
  if (!await clickText(page, 'ระบบงานให้บริการ', 5000)) {
    await ss(page, 'nbhq-no-menu');
    throw new Error('❌ ไม่พบเมนู ระบบงานให้บริการ');
  }
  await page.waitForTimeout(800);

  await clickText(page, 'NBHQ') || await clickText(page, 'จัดการข้อมูลเคสใหม่');
  await page.waitForTimeout(800);

  await clickText(page, 'ตรวจสอบข้อมูลเคสใหม่');
  await page.waitForTimeout(1500);
  await ss(page, 'nbhq-search-page');

  const frame = mainFrame(page);

  // กรอกเลขใบคำขอ
  const searchInput = frame.locator('input[type="text"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  await searchInput.fill(String(applicationNo));

  await clickText(page, 'ค้นหา');
  await page.waitForTimeout(2500);
  await ss(page, 'nbhq-search-result');

  const searchResult = await frame.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`  📄 Search result (400 chars): ${searchResult.substring(0, 400)}`);

  // ตรวจสอบสถานะ ชำระครบ
  if (!searchResult.includes('ชำระครบ')) {
    console.warn('  ⚠️ ยังไม่เจอ "ชำระครบ" — Batch อาจยังไม่เสร็จ');
    console.warn('  💡 ลองรอเพิ่ม หรือ ตรวจสอบ Swagger response อีกครั้ง');
  } else {
    console.log('  ✅ สถานะ: ชำระครบ');
  }

  // กดปุ่ม ตรวจสอบข้อมูลเคสใหม่ (จากผลการค้นหา)
  await clickText(page, 'ตรวจสอบข้อมูลเคสใหม่') || await clickText(page, 'ตรวจสอบ');
  await page.waitForTimeout(2000);
  await ss(page, 'nbhq-check-detail');

  // เลื่อนลงล่างสุดเพื่อกด ยืนยัน
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);

  await clickText(page, 'ยืนยันตรวจสอบข้อมูล') || await clickText(page, 'ยืนยัน');
  await page.waitForTimeout(3000);
  await ss(page, 'nbhq-after-confirm');

  // ค้นหาอีกครั้งเพื่อดูเลขกธ
  await clickText(page, 'ค้นหา');
  await page.waitForTimeout(2000);
  await ss(page, 'nbhq-final-result');

  const finalText = await frame.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`  📄 Final result (400 chars): ${finalText.substring(0, 400)}`);

  // หาเลขกรมธรรม์ (PA/LE/EN/LA + 8 หลัก หรือ ตัวเลข 8+ หลัก)
  const policyMatch = finalText.match(/\b((?:PA|LE|EN|LA|LI)\d{8,12})\b/i)
    || finalText.match(/(?:เลขกรมธรรม์|กรมธรรม์|Policy\s*No\.?)[:\s]*([A-Z0-9]{6,12})/i);
  const policyNo = policyMatch ? policyMatch[1] : '';

  if (policyNo) console.log(`  ✅ เลขกรมธรรม์: ${policyNo}`);
  else          console.warn('  ⚠️ ไม่พบเลขกรมธรรม์ในหน้า NBHQ');

  return policyNo;
}

// ─── Main Test ────────────────────────────────────────────────────────────────

test('Digital Sale QR Payment — Phase 2', async ({ browser }) => {
  test.setTimeout(0);

  const cases = await fetchQrRunnableCases(RUN_CREATE_BY);
  if (!cases.length) {
    console.log('🎉 ไม่มีเคส QR ให้รัน (Test Status QR = Ready for Test/Retest)');
    return;
  }

  console.log(`📋 พบ ${cases.length} เคส QR`);

  const processedNos = new Set();

  for (const caseData of cases) {
    const { no, environment, applicationNo, cusName } = caseData;
    if (processedNos.has(no)) { console.log(`🛑 ข้ามซ้ำ No ${no}`); break; }
    processedNos.add(no);

    const env    = environment || 'UAT';
    const nbsUrl = NBS_URL[env] || NBS_URL.UAT;

    const claimed = await claimQrCase(no, RUN_CREATE_BY);
    if (!claimed) continue;

    const ctx  = await browser.newContext({ timezoneId: 'Asia/Bangkok' });
    const page = await ctx.newPage();

    let status    = 'FAIL';
    let remark    = '';
    let policyNo  = '';
    let receiptNo = '';
    const startTime = Date.now();

    console.log(`\n${'━'.repeat(55)}`);
    console.log(`🚀 QR No ${no} | ${applicationNo} | ${cusName} | ${env}`);
    console.log('━'.repeat(55));

    try {
      // ── Phase A: NBS (Boss) — Centralized SMS → Gen QR ──────────────────
      await loginNBS(page, NBS_BOSS_USER, NBS_BOSS_PASS, nbsUrl);
      const qrData = await genQRAndGetData(page, applicationNo);

      // ── Phase B: Swagger — ยิง Payment Notification ──────────────────────
      const { completedId } = await fireSwaggerPayment(ctx, env, applicationNo, qrData);

      // ── Phase C: Bypass Batch ─────────────────────────────────────────────
      const bypassed = await bypassBatch(ctx, env, completedId);
      if (!bypassed) {
        // รอ batch อัตโนมัติ (ครั้งแรกรอ 3 นาที แล้วลอง verify เลย)
        console.log('  ⏳ รอ Batch อัตโนมัติ 3 นาที...');
        await page.waitForTimeout(180000);
      }

      // ── Phase D: NBS Run Batch Thai QR ───────────────────────────────────
      await runNBSBatch(page);
      await page.waitForTimeout(30000); // รอ batch ประมวลผล

      // ── Phase E: Logout Boss → Login MG0001 → NBHQ ───────────────────────
      console.log('\n📌 Logout Boss → Login MG0001 (NBHQ)');
      await clickText(page, 'ออกจากระบบ') || await clickText(page, 'Logout') || await clickText(page, 'Sign out');
      await page.waitForTimeout(1000);

      await loginNBS(page, NBS_NBHQ_USER, NBS_NBHQ_PASS, nbsUrl);
      policyNo = await verifyNBHQ(page, applicationNo);

      status = 'PASS';
      remark = `QR Payment สำเร็จ | เลขกธ: ${policyNo || 'ไม่พบ'}`;
      console.log(`\n✅ PASS: No ${no} | ${applicationNo} | policy: ${policyNo}`);

    } catch (err) {
      status = 'FAIL';
      remark = String(err?.message || err);
      console.error(`\n❌ FAIL: No ${no}:`, remark.substring(0, 200));
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `qr-fail-${no}-${Date.now()}.png`),
        fullPage: true,
      }).catch(() => {});
    } finally {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      try {
        await writeQrResult({
          no,
          status,
          remark: `[${elapsed}s] ${remark}`.slice(0, 500),
          receiptNo,
          policyNo,
        });
      } catch (writeErr) {
        console.error(`❌ writeQrResult failed No ${no}:`, writeErr.message);
      }
      await ctx.close().catch(() => {});
    }
  }
});

/*
 * SETUP & DEBUG:
 * ──────────────────────────────────────────────────────
 * 1. แก้ RUN_CREATE_BY ให้ตรงกับ Create By ใน sheet
 * 2. ตรวจสอบ NBS_BOSS_PASS, NBS_NBHQ_PASS
 *    (UAT อาจรับ password "อะไรก็ได้" — ลอง '1234' หรือค่าจริงจาก admin)
 * 3. ตรวจสอบ SWAGGER_PROVIDER_ID = '1' — ปรับถ้าไม่ถูกต้อง
 * 4. เคส QR ต้องมี Test Status QR = "Ready for Test" ใน sheet
 *
 * DEBUG TIP:
 *   - ดู screenshots ใน playwright/digital-sale/screenshots/qr-*.png ทุก step
 *   - ถ้า Swagger fail เพราะ billerId/ref ไม่ถูก ให้ดู:
 *       qr-qr-page-*.png → หาข้อมูล reference ที่ถูกต้อง
 *     แล้ว update logic ใน genQRAndGetData()
 *   - ถ้า NBS menu ไม่พบ ให้ดู:
 *       qr-menu-backoffice-*.png → ชื่อเมนูจริงในระบบ
 *
 * วิธีรัน:
 *   cd playwright
 *   npx playwright test digital-sale/digital-sale-qr-payment.spec.js --headed --workers=1
 * ──────────────────────────────────────────────────────
 */
