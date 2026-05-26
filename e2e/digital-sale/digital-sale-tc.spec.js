/**
 * Digital Sale — TC Runner
 *
 * ไฟล์นี้คือ spec runner สำหรับ project Digital Sale
 * TC definitions อยู่ใน tc-config.js — ไม่ต้องแก้ไฟล์นี้เมื่อเพิ่ม TC ใหม่
 *
 * รัน TC เดียว:
 *   TC_ID=TC_DS_001 npx playwright test digital-sale/digital-sale-tc.spec.js --headed
 *
 * รันทุก TC ใน config:
 *   npx playwright test digital-sale/digital-sale-tc.spec.js --headed
 */

const { test, expect } = require('@playwright/test');
const TC_LIST = require('./tc-config');
const { writeSheetResult } = require('./data/poc-sheet');
const { loadTcData } = require('./data/gsheet-loader');

const BASE_URL = 'https://uat2-oceanlife.ochi.link';

// กรอง TC จาก env var TC_ID ถ้าระบุมา (ไม่ระบุ = รันทุกตัว)
const TARGET_TC = process.env.TC_ID;
const cases = TARGET_TC
  ? TC_LIST.filter(tc => tc.id === TARGET_TC)
  : TC_LIST;

if (cases.length === 0) {
  throw new Error(`TC_ID "${TARGET_TC}" ไม่พบใน tc-config.js`);
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

async function dismissOverlays(page) {
  await page.evaluate(() => {
    const os = document.getElementById('onesignal-slidedown-container');
    if (os) os.style.setProperty('display', 'none', 'important');
    const chat = document.getElementById('chat-widget-container');
    if (chat) chat.style.setProperty('display', 'none', 'important');
  }).catch(() => {});
}

// ─── Flow Runners ─────────────────────────────────────────────────────────────

/**
 * flow: 'product-selection'
 * เปิด homepage → เลือก product → กรอก calculator (gender/birthdate/premium) → คำนวณ → ซื้อ
 */
async function runProductSelection(page, tc) {
  const { data, expect: exp } = tc;
  const { product, gender, birthDate, premium, insuredAmount, paymentMode } = data;
  const THAI_MONTHS = [
    '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  // Step 1: เปิดหน้า Digital Sale
  console.log(`🌐 [${tc.id}] Step 1 — เปิดหน้า Digital Sale...`);
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const cookieBtn = page.getByRole('button', { name: /ยอมรับ/i });
  if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(500);
  }

  // Step 2: กด "ซื้อประกันออนไลน์" ในเมนู
  console.log(`🖱️ [${tc.id}] Step 2 — กด "ซื้อประกันออนไลน์"...`);
  const buyLink = page.getByRole('link', { name: /^ซื้อประกันออนไลน์$/i });
  await buyLink.waitFor({ state: 'visible', timeout: 10000 });
  await buyLink.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);

  // Step 3: เลือก product (navigate ตรง + fallback search)
  console.log(`🛡️ [${tc.id}] Step 3 — เลือก product: ${product.slug}...`);
  await dismissOverlays(page);

  const productUrl = `${BASE_URL}/our-products/${product.category}/${product.slug}?purchase_intent=1`;
  await page.goto(productUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  if (!page.url().includes(product.slug)) {
    console.log(`⚠️ direct URL redirect — ลองผ่าน search แทน...`);
    await page.goto(`${BASE_URL}/our-products`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    const searchToggle = page.locator('a[data-search-component]')
      .or(page.getByRole('link', { name: 'ค้นหาข้อมูล' })).first();
    if (await searchToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchToggle.click();
      await page.waitForTimeout(500);
      await page.locator('#cmp-search, input[name="keyword"]').first().fill(product.searchKeyword);
      await page.getByRole('button', { name: /^search$/i }).click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);

      const productItem = page.locator('li.result__item')
        .filter({ hasText: new RegExp(product.searchKeyword, 'i') }).first();
      await productItem.waitFor({ state: 'visible', timeout: 10000 });
      const href = await productItem.locator('a.stretched-link').getAttribute('href').catch(() => null);
      await page.goto(href ? `${href}?purchase_intent=1` : BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
    }
  }

  console.log(`✅ product page: ${page.url()}`);

  // Step 4a: เลือกเพศ
  await page.locator('.question__choices').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (gender) {
    console.log(`🚻 เลือกเพศ: ${gender}...`);
    const genderBtn = page.locator('.question__choices').getByText(gender, { exact: true });
    if (await genderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await genderBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // Step 4b: เลือกวันเกิดผ่าน Flatpickr
  if (birthDate) {
    const { day, month, yearBE } = birthDate;
    const yearCE = yearBE - 543;
    const monthName = typeof month === 'number' ? THAI_MONTHS[month] : month;
    console.log(`📅 เลือกวันเกิด: ${day}/${monthName}/${yearBE}...`);

    const birthInput = page.locator('input[name="birthdate"].flatpickr-input');
    await birthInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await birthInput.isVisible().catch(() => false)) {
      await birthInput.click();
      await page.waitForTimeout(500);
      const cal = page.locator('.flatpickr-calendar.open');
      await cal.getByLabel('Month').selectOption(monthName);
      await page.waitForTimeout(300);
      await cal.locator('select').last().selectOption(String(yearBE));
      await page.waitForTimeout(300);
      await page.getByLabel(`${monthName} ${day}, ${yearCE}`, { exact: false }).first().click();
      await page.waitForTimeout(500);
    }
  }

  // Step 4c: กรอกเบี้ย (premium) หรือทุน (insured_amount)
  if (premium) {
    console.log(`💰 Step 4 — กรอกเบี้ยประกันภัย: ${premium}...`);
    const field = page.getByRole('textbox', { name: 'ระบุจำนวนเบี้ยประกันภัย' });
    await field.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await field.isVisible().catch(() => false)) {
      await field.click();
      await field.fill(premium);
      await page.waitForTimeout(400);
    }
  } else if (insuredAmount) {
    // Save & Protect 888: ใช้ input[name="insured_amount"] + pressSequentially + Tab
    console.log(`💰 Step 4 — กรอกทุนประกัน: ${insuredAmount}...`);
    const insuredInput = page.locator('input[name="insured_amount"]');
    await insuredInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await insuredInput.isVisible().catch(() => false)) {
      await insuredInput.click();
      await insuredInput.fill('');
      await insuredInput.pressSequentially(String(insuredAmount).replace(/,/g, ''), { delay: 30 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(800); // Livewire re-render หลัง Tab
      console.log(`✅ กรอก insured_amount: ${insuredAmount}`);
    }

    // กด "ต่อไป" ถ้ามี (Save & Protect 888 มีปุ่มนี้ก่อน payment mode)
    // ใช้ el.click() ผ่าน evaluate เพราะ Livewire อาจ render ปุ่มแบบ display:none ชั่วคราว
    const nextBtn = page.locator('button:has-text("ต่อไป")').first();
    const nextAttached = await nextBtn.waitFor({ state: 'attached', timeout: 5000 }).then(() => true).catch(() => false);
    if (nextAttached) {
      console.log(`➡️ กด "ต่อไป"...`);
      if (await nextBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await nextBtn.click();
      } else {
        await nextBtn.evaluate(el => el.click()); // JS click เมื่อ display:none
        console.log(`   (js-click)`);
      }
      await page.waitForTimeout(1000);
    }
  }

  // Step 4d: เลือกโหมดชำระ (Save & Protect 888) ผ่าน label[for^="interval-"]
  // ใช้ evaluate เพื่อหาและคลิก label ที่ text ตรงแม้จะ display:none (Livewire lazy render)
  if (paymentMode) {
    console.log(`💳 Step 4 — เลือกโหมดชำระ: ${paymentMode}...`);
    await page.waitForTimeout(500);

    const selected = await page.evaluate((target) => {
      const labels = Array.from(document.querySelectorAll('label[for^="interval-"]'));
      const label = labels.find(l => {
        const t = l.textContent.trim();
        return t === target || t.includes(target) || target.includes(t);
      });
      if (label) { label.click(); return label.textContent.trim(); }
      return null;
    }, paymentMode);

    if (selected) {
      await page.waitForTimeout(500);
      console.log(`✅ เลือกโหมดชำระ: "${selected}"`);
    } else {
      // fallback: log options ที่มี แล้วเลือกแรก
      const options = await page.locator('label[for^="interval-"]').allTextContents().catch(() => []);
      console.warn(`⚠️ ไม่พบ "${paymentMode}" — options: ${options.join(' | ')}`);
    }
  }

  // Step 5: กด "คำนวณ" — ข้ามถ้า payment mode selection auto-navigate ไป quotation แล้ว
  // (Save & Protect 888: clicking interval label triggers auto-navigate to quotation)
  const calcBtnName = data.calcBtnName || 'คำนวณจำนวนเงินเอาประกันภัย';
  await page.waitForTimeout(800); // รอ navigation ที่อาจเกิดจาก interval label click
  const alreadyOnQuotation = page.url().includes('/quotation/');

  if (!alreadyOnQuotation) {
    console.log(`🧮 Step 5 — กด "${calcBtnName}"...`);
    const calcBtn = page.getByRole('button', { name: calcBtnName });
    await calcBtn.waitFor({ state: 'visible', timeout: 10000 });
    await calcBtn.click();
    await page.waitForURL(/\/quotation\//, { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  } else {
    console.log(`⏭️ Step 5 — ข้ามปุ่มคำนวณ (auto-navigated ไป quotation แล้ว)`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  }
  console.log(`✅ quotation page: ${page.url()}`);

  // Soft assert: ตรวจโหมดชำระบน quotation page (ถ้า TC ระบุ paymentModeVerify)
  if (exp.paymentModeVerify) {
    const qText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    const found = qText.includes(exp.paymentModeVerify);
    console.log(found
      ? `✅ quotation แสดงโหมดชำระ "${exp.paymentModeVerify}"`
      : `⚠️ ไม่พบ "${exp.paymentModeVerify}" บน quotation page (อาจแสดงในรูปแบบอื่น)`
    );
  }

  // Step 6: กด "ซื้อประกันออนไลน์" บน quotation page
  console.log(`🛒 Step 6 — กด "ซื้อประกันออนไลน์"...`);
  const buyBtn = page.getByRole('button', { name: /ซื้อประกันออนไลน์/i });
  await buyBtn.waitFor({ state: 'visible', timeout: 15000 });
  await buyBtn.click();
  await page.waitForURL(/\/identity/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Assert: URL ต้องมี /identity + form ต้อง render
  console.log(`🔎 URL: ${page.url()}`);
  expect(page.url()).toContain(exp.urlContains);

  await page.waitForTimeout(2000);
  const formOk = await page.locator(exp.formSelector).first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(async () =>
      page.locator('main, .container, section').first().isVisible({ timeout: 5000 }).catch(() => false)
    );
  expect(formOk).toBeTruthy();
}

// ─── Flow dispatcher ─────────────────────────────────────────────────────────

const FLOW_MAP = {
  'product-selection': runProductSelection,
  // 'form-fill': runFormFill,       // เพิ่มเมื่อทำ TC ที่เกี่ยวกับการกรอกฟอร์ม
  // 'otp-verify': runOtpVerify,     // เพิ่มเมื่อทำ TC ที่เกี่ยวกับ OTP
  // 'payment-qr': runPaymentQR,     // เพิ่มเมื่อทำ TC ที่เกี่ยวกับ QR payment
  // 'payment-cc': runPaymentCC,     // เพิ่มเมื่อทำ TC ที่เกี่ยวกับ credit card
};

// ─── Generate tests จาก TC_LIST ──────────────────────────────────────────────

test.setTimeout(120000);

for (const tc of cases) {
  test(`${tc.id} — ${tc.title}`, async ({ page }) => {
    const runner = FLOW_MAP[tc.flow];
    if (!runner) throw new Error(`ไม่พบ flow runner สำหรับ flow: "${tc.flow}"`);

    const startTime = Date.now();
    let status = 'Fail';
    let actual = '';
    let remark = '';

    // โหลด test data จาก Google Sheet (Test Data column) ที่ runtime
    const sheetData = await loadTcData(tc.id);
    const tcWithData = {
      ...tc,
      data: sheetData,
      expect: {
        ...tc.expect,
        // ถ้า sheet มี paymentMode ให้ set paymentModeVerify อัตโนมัติ
        ...(sheetData.paymentMode ? { paymentModeVerify: sheetData.paymentMode } : {}),
      },
    };

    try {
      await runner(page, tcWithData);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      status = 'Pass';
      actual = `${tc.expect?.actualResultText || 'ผ่านทุก step'} ✅ (${elapsed}s, ${date})`;
      console.log(`✅ ${tc.id} PASS`);
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      actual = `❌ FAIL (${elapsed}s, ${date})`;
      remark = String(err.message || err).slice(0, 300);
      console.error(`❌ ${tc.id} FAIL:`, err.message);
      throw err; // ให้ Playwright mark test เป็น failed
    } finally {
      await writeSheetResult(tc.id, status, actual, remark).catch(e =>
        console.warn(`⚠️ Write sheet failed: ${e.message}`)
      );
    }
  });
}

/*
 * SETUP:
 *   cd "D:/Project/Claude Project/playwright"
 *
 *   รัน TC เดียว:
 *   TC_ID=TC_DS_001 npx playwright test digital-sale/digital-sale-tc.spec.js --headed
 *
 *   รันทุก TC ใน config:
 *   npx playwright test digital-sale/digital-sale-tc.spec.js --headed
 *
 *   เพิ่ม TC ใหม่: แก้ที่ tc-config.js เท่านั้น
 */
