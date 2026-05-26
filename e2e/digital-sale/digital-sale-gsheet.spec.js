/**
 * Digital Sale — Phase 1 with Google Sheet Integration
 *
 * ดึง test data จาก Google Sheet → รัน flow เหมือน digital-sale-phase1.spec.js
 * (ค้นหาแบบประกัน → กรอกข้อมูล → OTP → เงินสด → เลขใบคำขอ) → เขียนผลกลับ Sheet
 *
 * วิธีรัน:
 *   cd playwright
 *   npx playwright test digital-sale/digital-sale-phase1-gsheet.spec.js --headed --workers=1
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { fetchRunnableCases, claimCase, writeResult, fetchNbhqRunnableCases, claimNbhqCase, writeNbhqResult } = require('./data/write-result');
const {
  dismissPopups,
  setupAutoPopupDismiss,
  waitOptionalLoading,
  waitForReady,
  parseBirthDate,
  setFlatpickrDate,
  retryBirthDate,
  killDigitalSalesPopups,
  clickButtonByText,
  clickFirstFound,
  clickRadioLabel,
  normalizeTitle,
  acceptAllConsents,
  autoSelectSafeRadios,
  mandatoryFill,
  optionalFill,
} = require('./helpers/common_function');

// ─── Config ───────────────────────────────────────────────────────────────────

const ENV_MAP = {
  SIT: 'https://sit-oceanlife.ochi.link',
  UAT: 'https://uat2-oceanlife.ochi.link',
};

// แก้ไข RUN_CREATE_BY ให้ตรงกับ "Create By" ใน Google Sheet
const RUN_CREATE_BY = 'top';

// ─────────────────────────────────────────────────────────────────────────────

async function dismissOverlays(page) {
  // รอ 400ms ก่อน evaluate — ให้ OneSignal inject DOM ก่อนที่เราจะซ่อน
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const onesignal = document.getElementById('onesignal-slidedown-container');
    if (onesignal) onesignal.style.setProperty('display', 'none', 'important');
    const chat = document.getElementById('chat-widget-container');
    if (chat) chat.style.setProperty('display', 'none', 'important');
  }).catch(() => { });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2C2P Credit Card Form (UAT test data จาก Projects/Digital Sale/README.md)
// ─────────────────────────────────────────────────────────────────────────────
const CC_DATA = {
  number: '5555555555554444',
  name: 'test',
  expiry: '12/30',  // MM/YY
  cvv: '123',
  bank: 'Aeon',
};

/**
 * Find a locator in the main page first, then fall back to all child iframes.
 * Returns { loc, frame } where frame is null when found in the main page,
 * or the Frame object when found inside an iframe.
 * Returns null when the element is not visible in any frame.
 */
async function locatorInPageOrFrame(page, selector, timeout = 5000) {
  // Try main page first
  const mainLoc = page.locator(selector).first();
  if (await mainLoc.isVisible({ timeout }).catch(() => false)) {
    return { loc: mainLoc, frame: null };
  }
  // Try each child iframe
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    const frameLoc = frame.locator(selector).first();
    if (await frameLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`   🖼️ found in iframe: ${frame.url()}`);
      return { loc: frameLoc, frame };
    }
  }
  return null;
}

async function fill2C2PForm(page) {
  console.log('💳 กรอกข้อมูลบัตรเครดิต 2C2P...');
  const [expMonth, expYear] = CC_DATA.expiry.split('/'); // "12", "25"

  await page.waitForLoadState('domcontentloaded').catch(() => { });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
  await page.waitForTimeout(5000);

  // ── Diagnostic: dump page/iframe state so we can identify correct selectors ─
  try {
    // Screenshot — visual snapshot of page state at entry to fill2C2PForm
    const screenshotDir = path.resolve(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const ssPath = path.join(screenshotDir, `cc-form-${Date.now()}.png`);
    await page.screenshot({ path: ssPath, fullPage: true }).catch(() => { });
    console.log(`   📸 screenshot: ${ssPath}`);

    // Collect all frame URLs
    const frameUrls = page.frames().map(f => f.url());
    console.log('🔍 fill2C2PForm diagnostic:');
    console.log(`   frames: ${JSON.stringify(frameUrls)}`);

    // Dump inputs in main page
    const mainInputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input')).map(el => ({
        id: el.id || '',
        name: el.name || '',
        type: el.type || '',
        placeholder: el.placeholder || '',
      }))
    ).catch(() => []);
    console.log(`   main page inputs: ${JSON.stringify(mainInputs)}`);

    // Dump inputs in each iframe
    for (let fi = 0; fi < page.frames().length; fi++) {
      const frame = page.frames()[fi];
      if (frame === page.mainFrame()) continue;
      const frameInputs = await frame.evaluate(() =>
        Array.from(document.querySelectorAll('input')).map(el => ({
          id: el.id || '',
          name: el.name || '',
          type: el.type || '',
          placeholder: el.placeholder || '',
        }))
      ).catch(() => []);
      console.log(`   frame[${fi}] (${frame.url()}) inputs: ${JSON.stringify(frameInputs)}`);
    }
  } catch (diagErr) {
    console.warn(`   ⚠️ diagnostic dump error: ${diagErr.message}`);
  }
  // ── End Diagnostic ────────────────────────────────────────────────────────

  // ── Step 1: Card Number ───────────────────────────────────────────────────
  const cardNumResult = await locatorInPageOrFrame(
    page,
    '#tel-cardNumber, input[placeholder="0000-0000-0000-0000"]',
    5000
  );
  if (cardNumResult) {
    await cardNumResult.loc.click();
    await cardNumResult.loc.fill(CC_DATA.number);
    console.log(`   ✅ card number: ${CC_DATA.number}`);
  } else {
    console.log('   ⚠️ ไม่พบ card number input');
  }

  // รอ form expand หลังกรอก card number (card type detected → expiry/CVV ปรากฏ)
  await page.waitForTimeout(2000);

  // ── Step 2: Expiry Date ──────────────────────────────────────────────────
  // ลอง combined "MM / YY" ก่อน
  const expiryResult = await locatorInPageOrFrame(page, 'input[placeholder="MM / YY"]', 5000);
  if (expiryResult) {
    await expiryResult.loc.click();
    // ใช้ pressSequentially แทน fill เพราะ masked input
    await expiryResult.loc.pressSequentially(`${expMonth}${expYear}`, { delay: 50 });
    console.log(`   ✅ expiry: ${expMonth}/${expYear}`);
  } else {
    // fallback: separate MM + YY/YYYY
    const mmResult = await locatorInPageOrFrame(page, 'input[placeholder="MM"]', 2000);
    const yyResult = await locatorInPageOrFrame(page, 'input[placeholder="YY"], input[placeholder="YYYY"]', 2000);
    if (mmResult) {
      await mmResult.loc.click();
      await mmResult.loc.pressSequentially(expMonth, { delay: 50 });
      console.log(`   ✅ expiry MM: ${expMonth}`);
    } else {
      console.log('   ⚠️ ไม่พบ expiry input');
    }
    if (yyResult) {
      await yyResult.loc.click();
      await yyResult.loc.pressSequentially(expYear, { delay: 50 });
      console.log(`   ✅ expiry YY: ${expYear}`);
    }
  }

  // รอ CVV field ปรากฏหลัง expiry ถูกกรอก
  await page.waitForTimeout(1000);

  // ── Step 3: CVV — id="tel-cvv" (same pattern as tel-cardNumber) ──────────
  const cvvResult = await locatorInPageOrFrame(page, '#tel-cvv', 5000);
  if (cvvResult) {
    const cvvEl = cvvResult.loc;
    await cvvEl.waitFor({ state: 'attached', timeout: 5000 }).catch(() => { });
    await cvvEl.click({ force: true }).catch(() => { });
    await cvvEl.fill(CC_DATA.cvv, { force: true }).catch(async () => {
      await cvvEl.pressSequentially(CC_DATA.cvv, { delay: 50 }).catch(() => { });
    });
    const cvvVal = await cvvEl.inputValue().catch(() => '');
    console.log(cvvVal ? `   ✅ CVV: ${cvvVal}` : '   ⚠️ CVV ไม่ถูก set');
  } else {
    console.log('   ⚠️ ไม่พบ CVV input');
  }

  // ── Step 4: Cardholder Name — หาจาก label "CARDHOLDER NAME" ─────────────
  // Inline evaluate logic shared between page and frame contexts
  const cardholderEvalFn = (name) => {
    const allEls = Array.from(document.querySelectorAll('label, span, div, p'));
    const label = allEls.find(
      el => /cardholder\s*name/i.test(el.textContent.trim()) && el.textContent.trim().length < 30
    );
    if (label) {
      let container = label.parentElement;
      for (let i = 0; i < 4; i++) {
        const inp = container?.querySelector('input[type="text"], input:not([type])');
        if (inp && inp.offsetParent !== null) {
          inp.focus();
          inp.value = name;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        container = container?.parentElement;
      }
    }
    return false;
  };

  // Try main page first, then each iframe
  let cardholderFilled = await page.evaluate(cardholderEvalFn, CC_DATA.name).catch(() => false);
  if (!cardholderFilled) {
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      cardholderFilled = await frame.evaluate(cardholderEvalFn, CC_DATA.name).catch(() => false);
      if (cardholderFilled) break;
    }
  }
  console.log(cardholderFilled ? `   ✅ cardholder name: ${CC_DATA.name}` : '   ⚠️ ไม่พบ cardholder name input');

  // ── Step 5: Continue Payment ──────────────────────────────────────────────
  const continueBtnResult = await locatorInPageOrFrame(
    page,
    'button.btn-primary[type="submit"], button[type="submit"]',
    5000
  );
  if (continueBtnResult) {
    await continueBtnResult.loc.click();
    console.log('   ✅ กด Continue payment');
  } else {
    console.log('   ⚠️ ไม่พบ Continue payment button');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PA Product Helpers
// ─────────────────────────────────────────────────────────────────────────────

// URL segments that appear AFTER /quotation/ in the purchase flow.
// Used to detect race conditions where Livewire navigates past /quotation/ before waitForURL catches it.
function isPastQuotation(url) {
  return (
    url.includes('/identity') ||
    url.includes('/health') ||
    url.includes('/fatca') ||
    url.includes('/applicant') ||
    url.includes('/beneficiary') ||
    url.includes('/tax') ||
    url.includes('/document') ||
    url.includes('/policy') ||
    url.includes('/confirm') ||
    url.includes('/payment') ||
    url.includes('/success')
  );
}

function isPaProduct(data, productSlug) {
  return (
    String(data.policyType || '').toUpperCase() === 'PA' ||
    String(productSlug || '').toLowerCase().includes('-pa') ||
    String(productSlug || '').toLowerCase().startsWith('pa-') ||
    String(productSlug || '').toLowerCase().includes('easy-pa') ||
    String(productSlug || '').toLowerCase().includes('personal-accident')
  );
}

async function runPaCalculator(page, data) {
  // A1: Click "คำนวณเบี้ย/ซื้อออนไลน์" (scrolls to #purchase section)
  console.log('📌 PA Step A1: กดปุ่ม คำนวณเบี้ย/ซื้อออนไลน์');
  const calcLink = page
    .getByRole('link', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ })
    .or(page.getByRole('button', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ }))
    .first();
  await calcLink.waitFor({ state: 'visible', timeout: 10000 });
  await calcLink.click();
  await page.waitForTimeout(1000);
  await dismissPopups(page);

  // A2: เลือก age range button ที่ตรงกับอายุลูกค้า
  console.log('📌 PA Step A2: เลือก age range');
  const bd = parseBirthDate(data.birthDate);
  const ageNow = new Date().getFullYear() - bd.yearAD;
  console.log(`   อายุลูกค้า: ${ageNow} ปี`);

  const ageRangeBtns = page.locator('[wire\\:click*="setSample"]');
  await page.waitForTimeout(800);
  const ageCount = await ageRangeBtns.count().catch(() => 0);
  console.log(`   พบ age range buttons: ${ageCount}`);

  let ageClicked = false;
  for (let i = 0; i < ageCount; i++) {
    const btn = ageRangeBtns.nth(i);
    const txt = (await btn.textContent().catch(() => '')).trim();
    const m = txt.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m && ageNow >= parseInt(m[1]) && ageNow <= parseInt(m[2])) {
      await btn.click({ force: true });
      console.log(`   ✅ เลือก age range: "${txt}"`);
      ageClicked = true;
      break;
    }
  }
  if (!ageClicked && ageCount > 0) {
    // ดึงข้อความ range ที่มีเพื่อแสดงใน error message
    const availableRanges = [];
    for (let i = 0; i < ageCount; i++) {
      availableRanges.push((await ageRangeBtns.nth(i).textContent().catch(() => '')).trim());
    }
    const failMsg = `[PA age range]: อายุ ${ageNow} ปี ไม่ตรงกับช่วงอายุใดบนหน้าจอ (ตัวเลือกที่มี: ${availableRanges.join(', ')})`;
    console.error(failMsg);
    throw new Error(failMsg);
  }

  // A2.5: ติ๊ก checkbox "topup" ที่ปรากฏใต้ age range เพื่อให้ plan cards โหลด
  console.log('📌 PA Step A2.5: ติ๊ก checkbox topup');
  await page.waitForTimeout(800);
  const topupLabel = page.locator('label:has(input[name="topup"])').first();
  if (await topupLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
    await topupLabel.click({ force: true });
    console.log('   ✅ ติ๊ก checkbox topup แล้ว');
    await page.waitForTimeout(2500);
  } else {
    console.log('   ⚠️ ไม่พบ checkbox topup — ข้ามขั้นตอน');
    await page.waitForTimeout(2500);
  }

  // A3: เลือก plan card — เลือก plan ที่มีเบี้ยประกันสูงสุดไม่เกิน data.premium
  console.log('📌 PA Step A3: เลือก plan card (premium-based)');

  const planBtns = page.locator('[wire\\:click*="showCalculator"]');
  const planCount = await planBtns.count().catch(() => 0);
  console.log(`   พบ plan buttons: ${planCount}`);

  if (planCount > 0) {
    const premiumStr = String(data.premium || '').replace(/,/g, '').trim();
    const maxPremium = parseFloat(premiumStr) || 0;

    // ดึง premium จากแต่ละ card (pattern: "เบี้ยประกันภัย X,XXX.XX บาท")
    const planPremiums = [];
    for (let i = 0; i < planCount; i++) {
      const cardText = await planBtns.nth(i)
        .evaluate(el => {
          const card = el.closest('.swiper-slide, .plan-card, .card') || el.parentElement?.parentElement;
          return (card?.innerText || el.parentElement?.innerText || '').trim();
        }).catch(() => '');
      const m = cardText.match(/เบี้ยประกันภัย\s*[\n\r]*\s*([\d,]+\.?\d*)\s*บาท/);
      const premVal = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
      planPremiums.push({ index: i, premium: premVal });
      console.log(`   แผน ${i + 1}: เบี้ย ${premVal}`);
    }

    // เลือก plan ที่มีเบี้ยสูงสุดโดยไม่เกิน maxPremium
    let bestIdx = -1;
    let bestPremium = -1;
    for (const p of planPremiums) {
      if (p.premium <= maxPremium && p.premium > bestPremium) {
        bestPremium = p.premium;
        bestIdx = p.index;
      }
    }
    if (bestIdx === -1) {
      bestIdx = 0;
      console.log(`   ⚠️ ไม่มี plan ที่เบี้ย ≤ ${maxPremium} — เลือก plan แรก`);
    } else {
      console.log(`   ✅ เลือก plan index ${bestIdx}: เบี้ย ${bestPremium} (≤ ${maxPremium})`);
    }
    // ใช้ evaluate JS click เพื่อให้ Livewire event delegation รับ event
    // (force:true ใน Playwright อาจไม่ fire wire:click ใน Swiper slide)
    await page.evaluate((idx) => {
      const btns = Array.from(document.querySelectorAll('[wire\\:click*="showCalculator"]'));
      if (btns[idx]) btns[idx].click();
    }, bestIdx);
  } else {
    // Try to extract plan ID from Livewire component state
    console.log('   ⚠️ ไม่พบ plan cards ใน Swiper — ลองดึง plan ID จาก Livewire component');
    const planId = await page.evaluate(() => {
      if (!window.Livewire) return null;
      const comps = window.Livewire.components?.componentsById
        || (window.Livewire.all ? Object.fromEntries(window.Livewire.all().map(c => [c.id, c])) : {});
      for (const comp of Object.values(comps)) {
        try {
          const plans = comp.get?.('plans') || comp.getData?.()?.plans || comp.data?.plans;
          if (Array.isArray(plans) && plans.length > 0) return plans[0].id ?? plans[0];
        } catch { }
      }
      return null;
    }).catch(() => null);

    if (planId !== null) {
      console.log(`   🔁 emit showCalculator(${planId})`);
      await page.evaluate((id) => { if (window.Livewire) window.Livewire.emit('showCalculator', id); }, planId);
    } else {
      throw new Error(`❌ PA product ไม่มี plan cards ใน UAT — กรุณาตั้งค่า plan data สำหรับ product นี้ก่อน`);
    }
  }
  // รอ .product__calculator ปรากฏ (x-show="show" ถูก Alpine toggle หลัง Livewire respond)
  console.log('📌 PA Step A4: รอ calculator section โหลด');
  const calcSection = page.locator('.product__calculator');
  const calcAppeared = await calcSection.waitFor({ state: 'visible', timeout: 12000 })
    .then(() => true).catch(() => false);
  console.log(`   calculator section: ${calcAppeared ? 'ปรากฏแล้ว' : 'ไม่ปรากฏ'}`);

  // A4: Health screening — รอ label "ไม่เคย" visible จริง → คลิก → กด ต่อไป
  console.log('📌 PA Step A4: Health screening');
  const screeningLbl = page.locator('.product__calculator label').filter({ hasText: /^ไม่เคย$/ }).first();
  const screeningVisible = await screeningLbl.waitFor({ state: 'visible', timeout: 6000 })
    .then(() => true).catch(() => false);
  if (screeningVisible) {
    await screeningLbl.click({ force: true });
    console.log('   ✅ เลือก ไม่เคย');
    // กด ต่อไป (wire:click="nextScreen()") ภายใน calculator
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.product__calculator button[wire\\:click="nextScreen()"]'));
      const vis = btns.find(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      if (vis) vis.click();
    });
    await page.waitForTimeout(800);
    await dismissPopups(page);
    console.log('   ✅ กด ต่อไป (screen 0 → 1)');
  } else {
    console.log('   ⚠️ ไม่พบ health screening — ข้ามขั้นตอน');
  }

  // A5: Gender (screen == 1 ใน .product__calculator)
  console.log('📌 PA Step A5: เลือกเพศ');
  await waitForReady(page, ['label[for="gender-m"]', 'label[for="gender-f"]'], 8000);
  const genderVal = String(data.gender || '').trim();
  const isMale = /^(M|male)$/i.test(genderVal) || (genderVal.includes('ชาย') && !genderVal.includes('หญิง'));
  await clickRadioLabel(page, isMale ? 'gender-m' : 'gender-f');
  console.log(`   ✅ เลือก: ${isMale ? 'ผู้ชาย' : 'ผู้หญิง'}`);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.product__calculator button[wire\\:click="nextScreen()"]'));
    const vis = btns.find(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    if (vis) vis.click();
  });
  await page.waitForTimeout(800);

  // A6: DOB
  console.log(`📌 PA Step A6: กรอกวันเกิด = ${data.birthDate}`);
  await waitForReady(page, ['input[name="birthdate"]'], 8000);
  const isoDate = `${bd.yearAD}-${String(bd.monthInt).padStart(2, '0')}-${String(bd.day).padStart(2, '0')}`;
  await page.evaluate((d) => {
    const inp = document.querySelector('input[name="birthdate"]');
    if (inp?._flatpickr) inp._flatpickr.setDate(d, true);
  }, isoDate);
  await page.waitForTimeout(800);
  console.log(`   ✅ ตั้งวันเกิด: ${isoDate}`);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.product__calculator button[wire\\:click="nextScreen()"]'));
    const vis = btns.find(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    if (vis) vis.click();
  });
  await page.waitForTimeout(1000);

  // A7: Occupation (screen == 3)
  console.log('📌 PA Step A7: เลือกอาชีพ');
  const paOccGrp = page.locator('.product__calculator select[name="occupation_group_id"]');
  const paOccGrpVisible = await paOccGrp.waitFor({ state: 'visible', timeout: 6000 })
    .then(() => true).catch(() => false);
  const occGrpVal = String(data.occupation || '').trim();
  if (paOccGrpVisible) {
    // Gap 1 fix: fuzzy match must throw if no option found
    const grpResult = await paOccGrp.selectOption({ label: occGrpVal })
      .then(() => ({ found: true, chosen: occGrpVal }))
      .catch(async () => {
        return await paOccGrp.evaluate((sel, val) => {
          const opt = Array.from(sel.options).find(o => o.text.includes(val));
          if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); return { found: true, chosen: opt.text }; }
          return { found: false, available: Array.from(sel.options).filter(o => o.value).map(o => o.text) };
        }, val);
      });
    if (!grpResult.found) {
      const failMsg = `[PA occupation group]: ไม่พบ "${occGrpVal}" ในตัวเลือกที่มีบนหน้าจอ (${grpResult.available.join(', ')})`;
      console.error(failMsg);
      throw new Error(failMsg);
    }
    console.log(`   ✅ กลุ่มอาชีพ: ${grpResult.chosen}`);
    await page.waitForTimeout(2000);

    // Gap 3 fix: throw when occupation_id select not visible but data is set
    const paOcc = page.locator('.product__calculator select[name="occupation_id"]');
    const occIdVisible = await paOcc.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
    const occVal = String(data.jobDescription || '').trim();
    if (occIdVisible) {
      const paOccResult = await paOcc.evaluate((sel, val) => {
        const opts = Array.from(sel.options);
        const available = opts.map(o => o.text.trim()).filter(t => t);
        const opt = opts.find(o => o.text.includes(val));
        if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); return { found: true, available }; }
        return { found: false, available };
      }, occVal);
      if (!paOccResult.found) {
        const failMsg = `[PA occupation_id]: ไม่พบ "${occVal}" ในตัวเลือกที่มีบนหน้าจอ (${paOccResult.available.join(', ')})`;
        console.error(failMsg);
        throw new Error(failMsg);
      }
      console.log(`   ✅ อาชีพ: ${occVal}`);
      await page.waitForTimeout(500);
    } else {
      if (occVal) {
        const failMsg = `[PA occupation_id]: ต้องการ "${occVal}" แต่ไม่พบ select element บนหน้าจอ`;
        console.error(failMsg);
        throw new Error(failMsg);
      } else {
        console.log('   ℹ️ ไม่มีข้อมูล jobDescription ใน sheet — ข้ามขั้นตอน');
      }
    }
  } else {
    // Gap 2 fix: throw when occupation group not visible but data is set
    if (occGrpVal) {
      const failMsg = `[PA occupation group]: ต้องการ "${occGrpVal}" แต่ไม่พบ select element บนหน้าจอ`;
      console.error(failMsg);
      throw new Error(failMsg);
    } else {
      console.log('   ℹ️ ไม่มีข้อมูล occupation ใน sheet — ข้ามขั้นตอน');
    }
  }

  // A8: คำนวณเบี้ยประกันภัย (wire:click="store()") → รอ /quotation/
  console.log('📌 PA Step A8: คำนวณเบี้ยประกันภัย');
  await dismissOverlays(page);
  await page.evaluate(() => {
    // ใช้ wire:click="store()" ซึ่งเป็น button เดียวใน calculator
    const storeBtn = document.querySelector('.product__calculator button[wire\\:click="store()"]');
    if (storeBtn) { storeBtn.click(); return; }
    // fallback: หาจากข้อความ
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => /คำนวณเบี้ยประกันภัย/.test(b.textContent.trim()));
    if (btn) btn.click();
  });
  await page.waitForURL(/\/quotation\//, { timeout: 20000 }).catch(() => { });
  await waitOptionalLoading(page);
  await dismissPopups(page);
  console.log('✅ PA calculator เสร็จสิ้น — อยู่ที่ quotation');
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow หลัก — Phase 1 (ใช้ logic จาก digital-sale-phase1.spec.js)
// รับ data จาก Google Sheet แทน TEST_DATA
// คืนค่า referenceNumber ที่ได้จากหน้า success
// ─────────────────────────────────────────────────────────────────────────────
async function runPhase1Flow(page, data, productSlug) {
  const phone = String(data.mobilePhone || '').replace(/\D/g, '');

  // ── A. Calculator (หน้า product) ─────────────────────────────────────────

  if (isPaProduct(data, productSlug)) {
    // PA products ใช้ flow แยก (age range → plan card → health screening → gender → DOB → occupation)
    await runPaCalculator(page, data);
  } else {
    // Savings products (first-love1810, save-and-protect888)
    console.log('📌 Step A1: กดปุ่ม คำนวณเบี้ย/ซื้อออนไลน์');
    const calcBtn = page
      .getByRole('link', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ })
      .or(page.getByRole('button', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ }))
      .first();
    await calcBtn.waitFor({ state: 'visible', timeout: 10000 });
    await calcBtn.click();
    await dismissPopups(page);

    // Step A2: เลือกเพศ
    console.log('📌 Step A2: เลือกเพศ');
    await waitForReady(page, ['label[for="gender-m"]', 'label[for="gender-f"]'], 15000);
    const genderVal = String(data.gender || '').trim();
    const isMale = /^(M|male)$/i.test(genderVal) || genderVal.includes('ชาย');
    const isFemale = /^(F|female)$/i.test(genderVal) || genderVal.includes('หญิง');
    if (isMale) {
      await clickRadioLabel(page, 'gender-m');
      console.log('✅ เลือก: ผู้ชาย');
    } else if (isFemale) {
      await clickRadioLabel(page, 'gender-f');
      console.log('✅ เลือก: ผู้หญิง');
    } else {
      throw new Error(`❌ ไม่รู้จักค่าเพศ: "${genderVal}"`);
    }

    // first-love1810 ต้องกด ต่อไป หลังเลือกเพศ
    if (productSlug === 'first-love1810') {
      await clickButtonByText(page, 'ต่อไป');
      await dismissPopups(page);
    }

    // Step A3: กรอกวันเกิด
    console.log(`📌 Step A3: กรอกวันเกิด = ${data.birthDate}`);
    await waitForReady(page, ['input[name="birthdate"]'], 12000);
    await dismissPopups(page);
    await page.waitForTimeout(800);

    const bd = parseBirthDate(data.birthDate);
    const bdDate = new Date(bd.yearAD, bd.monthInt - 1, bd.day);

    if (productSlug === 'first-love1810') {
      await retryBirthDate(page, 'input[name="birthdate"]', bdDate);
      await clickButtonByText(page, 'ต่อไป');
      await dismissPopups(page);
    } else {
      const bdValue = await setFlatpickrDate(page, 'input[name="birthdate"]', bdDate);
      console.log(`✅ ตั้งวันเกิด: ${bdValue}`);
      await dismissPopups(page);
    }

    // Step A4: กรอกเบี้ย/ทุน → คำนวณ → quotation
    if (productSlug === 'save-and-protect888') {
      console.log(`📌 Step A4: กรอกจำนวนเงินเอาประกัน = ${data.insuredAmount}`);
      await waitForReady(page, ['input[name="insured_amount"]'], 12000);
      const insuredRaw = String(data.insuredAmount || '').replace(/,/g, '').trim();
      if (!insuredRaw || insuredRaw === '-') throw new Error('❌ ไม่มีค่า insuredAmount');
      const insuredInput = page.locator('input[name="insured_amount"]');
      await insuredInput.click();
      await insuredInput.fill('');
      await insuredInput.pressSequentially(insuredRaw, { delay: 30 });
      await page.keyboard.press('Tab');
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });
      console.log(`✅ กรอก insured_amount: ${insuredRaw}`);

      await clickButtonByText(page, 'ต่อไป');
      await waitOptionalLoading(page);
      await dismissPopups(page);

      const payPeriodVal = String(data.paymentPeriod || 'รายปี').trim();
      console.log(`🔎 โหมดชำระจาก sheet = "${payPeriodVal}"`);

      const allIntervalLabels = page.locator('label[for^="interval-"]');
      const intervalCount = await allIntervalLabels.count().catch(() => 0);
      console.log(`🔎 พบ interval labels: ${intervalCount}`);

      if (intervalCount > 0) {
        const intervalTexts = await allIntervalLabels.allTextContents().catch(() => []);
        console.log(`🔎 interval options: ${intervalTexts.map(t => t.trim()).join(' | ')}`);

        let selectedLabel = null;
        let selectedText = '';
        for (let i = 0; i < intervalCount; i++) {
          const lbl = allIntervalLabels.nth(i);
          const txt = (await lbl.textContent().catch(() => '')).trim();
          if (txt === payPeriodVal || txt.includes(payPeriodVal) || payPeriodVal.includes(txt)) {
            selectedLabel = lbl;
            selectedText = txt;
            break;
          }
        }

        if (selectedLabel) {
          await selectedLabel.click({ force: true });
          console.log(`✅ เลือกโหมดชำระ: "${selectedText}" (จาก "${payPeriodVal}")`);
          // รอ Livewire settle หลังเลือก interval — ป้องกัน OneSignal ยิงในช่วง re-render
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });
        } else {
          const failMsg = `[paymentPeriod]: ไม่พบ "${payPeriodVal}" ในตัวเลือกที่มีบนหน้าจอ (${intervalTexts.map(t => t.trim()).join(', ')})`;
          console.error(failMsg);
          throw new Error(failMsg);
        }
      } else {
        const failMsg = `[paymentPeriod]: ไม่พบ interval labels บนหน้านี้เลย — ไม่สามารถเลือกโหมดชำระ "${payPeriodVal}"`;
        console.error(failMsg);
        throw new Error(failMsg);
      }

      // รอ Livewire re-render หลังเลือก interval ให้เสร็จก่อนกด ปุ่มคำนวณ/ซื้อ
      // เหตุผล: interval click triggers server roundtrip → OneSignal timer ยิงพอดีกับช่วง re-render
      //   → addLocatorHandler จะ interrupt click ระหว่าง Livewire ยัง re-render
      //   → ทำให้ปุ่มหายชั่วคราว และ timeout 30s หมดก่อนที่ปุ่มจะกลับมา
      // Fix: drain networkidle (8s) → kill popups → dismissOverlays → clickFirstFound (retry-loop)
      //   Fallback: บาง product ไม่มี "คำนวณเบี้ยประกันภัย" → ใช้ "ซื้อประกันออนไลน์" แทน
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { });
      await killDigitalSalesPopups(page);
      await dismissOverlays(page);
      const clickedBtn = await clickFirstFound(
        page,
        ['คำนวณเบี้ยประกันภัย', 'ซื้อประกันออนไลน์'],
        45000
      );
      if (clickedBtn !== 'คำนวณเบี้ยประกันภัย') {
        console.log(`⚠️ ไม่พบ "คำนวณเบี้ยประกันภัย" → ใช้ "${clickedBtn}" แทน`);
      }
      await waitOptionalLoading(page);
      await dismissPopups(page);

      // URL guard: ถ้ากด "คำนวณเบี้ยประกันภัย" แล้ว URL ยังไม่ใช่ /quotation/ → กด "ซื้อประกันออนไลน์" ต่อ
      // ถ้า fallback "ซื้อประกันออนไลน์" ถูกกดไปแล้ว → navigation กำลังดำเนินอยู่ ไม่ต้องกดซ้ำ
      if (clickedBtn === 'คำนวณเบี้ยประกันภัย' && !page.url().includes('/quotation/')) {
        await killDigitalSalesPopups(page);
        await dismissOverlays(page);
        await clickButtonByText(page, 'ซื้อประกันออนไลน์');
        // Race guard: navigation อาจผ่าน /quotation/ ไปแล้วก่อน wait จะเริ่ม — ยอมรับ URL ใด ๆ ที่อยู่หลัง quotation ด้วย
        if (!page.url().includes('/quotation/') && !isPastQuotation(page.url())) {
          await page.waitForURL(url => url.includes('/quotation/') || isPastQuotation(url), { timeout: 30000 }).catch(() => { });
        }
        await waitOptionalLoading(page);
        await dismissPopups(page);
      } else if (clickedBtn !== 'คำนวณเบี้ยประกันภัย') {
        // Fallback path: ซื้อประกันออนไลน์ ถูกกดไปแล้ว — รอ navigation เสร็จ
        // Race guard: page อาจวิ่งผ่าน /quotation/ ไปแล้วตอน wait เริ่ม
        if (!page.url().includes('/quotation/') && !isPastQuotation(page.url())) {
          await page.waitForURL(url => url.includes('/quotation/') || isPastQuotation(url), { timeout: 30000 }).catch(() => { });
        }
        await waitOptionalLoading(page);
        await dismissPopups(page);
      }
    } else {
      console.log(`📌 Step A4: กรอกเบี้ย = ${data.premium}`);
      await waitForReady(page, ['input[name="premium_amount"]'], 8000);
      const premium = String(data.premium || '').replace(/,/g, '').trim();
      if (!premium || premium === '-') throw new Error('❌ ไม่มีค่า premium');
      const premiumInput = page.locator('input[name="premium_amount"]');
      await premiumInput.click();
      await premiumInput.fill(premium);
      console.log(`✅ กรอกเบี้ย: ${premium}`);
      await clickButtonByText(page, 'คำนวณจำนวนเงินเอาประกันภัย');
      // Race guard: page อาจผ่าน /quotation/ ไปแล้วก่อน wait เริ่ม
      if (!page.url().includes('/quotation/') && !isPastQuotation(page.url())) {
        await page.waitForURL(url => url.includes('/quotation/') || isPastQuotation(url), { timeout: 30000 }).catch(() => { });
      }
      await waitOptionalLoading(page);
      await dismissPopups(page);
    }
  }

  // ── B. Quotation → Identity ───────────────────────────────────────────────

  console.log('📌 Step B: กด ซื้อประกันออนไลน์ (quotation → identity)');
  // Race guard: ถ้า navigation จาก step A วิ่งผ่าน /quotation/ ไปแล้ว ข้าม wait นี้ได้เลย
  if (!page.url().includes('/quotation/') && !isPastQuotation(page.url())) {
    await page.waitForURL(url => url.includes('/quotation/') || isPastQuotation(url), { timeout: 30000 }).catch(() => { });
  }
  // ถ้าอยู่ที่ /quotation/ แล้ว → กด "ซื้อประกันออนไลน์" ปกติ; ถ้าผ่านไปแล้ว → ข้ามการกด
  if (page.url().includes('/quotation/')) {
    await clickButtonByText(page, 'ซื้อประกันออนไลน์');
    await page.waitForURL('**/identity**', { timeout: 30000, waitUntil: 'domcontentloaded' });
  } else {
    console.log('   ⚡ Step B: navigation ผ่าน /quotation/ ไปแล้ว — ข้ามการกดปุ่ม');
  }
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ── C. Identity (ยืนยันตัวตน) ────────────────────────────────────────────

  console.log('📌 Step C: กรอกข้อมูลยืนยันตัวตน');

  // C1: เลือกสัญชาติ
  const nationalityRaw = String(data.nationality || '').trim();
  const isThai = nationalityRaw === 'ไทย' || nationalityRaw === '';
  console.log(`   สัญชาติ: ${isThai ? 'ชาวไทย' : 'ชาวต่างชาติ'}`);
  await waitForReady(page, ['label[for="id_type_idcard"]', 'label[for="id_type_passport"]'], 10000);
  await clickRadioLabel(page, isThai ? 'id_type_idcard' : 'id_type_passport');

  // C2: เลขบัตรประชาชน
  console.log(`   เลขบัตร: ${data.cardNo}`);
  await waitForReady(page, ['input[name="applicant[id_card_no]"]'], 8000);
  const idCard = String(data.cardNo || '').replace(/\D/g, '').trim();
  if (!idCard) throw new Error('❌ ไม่มีค่า cardNo');
  const idCardInput = page.locator('input[name="applicant[id_card_no]"]');
  await idCardInput.click();
  await idCardInput.fill(idCard);

  // C3: วันบัตรหมดอายุ
  console.log(`   วันบัตรหมดอายุ: ${data.expirecardNo}`);
  if (!data.expirecardNo) throw new Error('❌ ไม่มีค่า expirecardNo');
  const ed = parseBirthDate(data.expirecardNo);
  await setFlatpickrDate(
    page,
    'input[name="applicant[id_expired_date]"]',
    new Date(ed.yearAD, ed.monthInt - 1, ed.day)
  );

  // C4: คำนำหน้าชื่อ
  console.log(`   คำนำหน้า: ${data.cusTitlePrefix}`);
  const title = normalizeTitle(data.cusTitlePrefix);
  if (!title) throw new Error('❌ ไม่มีค่า cusTitlePrefix');
  await page.locator('select[name="applicant[title_id]"]').first().selectOption({ label: title });
  await page.waitForTimeout(800);

  // C5: ชื่อ
  console.log(`   ชื่อ: ${data.cusName}`);
  if (!data.cusName) throw new Error('❌ ไม่มีค่า cusName');
  await page.locator('input[name="applicant[first_name]"]').fill(data.cusName);

  // C6: นามสกุล
  console.log(`   นามสกุล: ${data.cusSurname}`);
  if (!data.cusSurname) throw new Error('❌ ไม่มีค่า cusSurname');
  await page.locator('input[name="applicant[last_name]"]').fill(data.cusSurname);

  // C7: อีเมล
  console.log(`   อีเมล: ${data.email}`);
  if (!data.email) throw new Error('❌ ไม่มีค่า email');
  await page.locator('input[type="email"]').fill(data.email);

  // C8: โทรศัพท์
  console.log(`   โทร: ${phone}`);
  if (!phone) throw new Error('❌ ไม่มีค่า mobilePhone');
  await page.locator('input[type="text"][maxlength="10"]').first().fill(phone);

  // C9: ยืนยันข้อมูล → consent → ถัดไป → health
  await clickButtonByText(page, 'ยืนยันข้อมูล');
  await acceptAllConsents(page);
  await page.getByRole('button', { name: 'ถัดไป' }).click();

  // ── D. Health (สุขภาพ) ───────────────────────────────────────────────────

  console.log('📌 Step D: /health/');
  await page.waitForURL('**/health**', { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => { });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  await autoSelectSafeRadios(page);

  // กรอกส่วนสูง/น้ำหนัก
  const heightVal = String(data.height || '170').trim();
  const weightVal = String(data.weight || '65').trim();
  console.log(`📌 Step D2: ส่วนสูง=${heightVal} น้ำหนัก=${weightVal}`);

  const heightSpecific = page.locator('input[name="question[233][7]"]').first();
  const weightSpecific = page.locator('input[name="question[234][8]"]').first();

  const fillWithRetry = async (locator, fallbackNth, value, label) => {
    let target = locator;
    if (!(await locator.isVisible({ timeout: 3000 }).catch(() => false))) {
      target = page.locator('input[type="number"]').nth(fallbackNth);
    }
    for (let i = 1; i <= 3; i++) {
      await target.scrollIntoViewIfNeeded().catch(() => { });
      await target.click({ force: true });
      await target.fill('');
      await target.type(value, { delay: 80 });
      await page.waitForTimeout(400);
      const actual = await target.inputValue().catch(() => '');
      if (actual === value) { console.log(`✅ ${label} = ${actual}`); return; }
      if (i === 3) console.warn(`⚠️ ${label} ไม่สำเร็จ actual=${actual}`);
      await page.waitForTimeout(300);
    }
  };

  await fillWithRetry(heightSpecific, 0, heightVal, 'height');
  await fillWithRetry(weightSpecific, 1, weightVal, 'weight');

  await clickButtonByText(page, 'ถัดไป');
  const onFatca = await page.waitForURL('**/fatca**', { timeout: 20000, waitUntil: 'domcontentloaded' })
    .then(() => true).catch(() => false);
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ── E. FATCA (CRS + FATCA) — เฉพาะผลิตภัณฑ์ที่มีขั้นตอน FATCA ────────────

  if (!onFatca) {
    console.log(`📌 Step E: ข้าม FATCA — URL ปัจจุบัน: ${page.url()}`);
    if (!page.url().includes('/applicant')) {
      await page.waitForURL('**/applicant**', { timeout: 20000, waitUntil: 'domcontentloaded' }).catch(() => { });
    }
  } else {

    console.log('📌 Step E: /fatca/');

    // CRS: อยู่อาศัยในไทยเท่านั้น
    const crsRadio = page.locator('input[name="crs[thai_residence_only]"][value="Y"]').first();
    if (await crsRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      const lblId = await crsRadio.getAttribute('id');
      const lbl = page.locator(`label[for="${lblId}"]`).first();
      if (await lbl.isVisible({ timeout: 1000 }).catch(() => false)) {
        await lbl.click({ force: true });
      } else {
        await crsRadio.check({ force: true });
      }
      console.log('✅ CRS: อยู่อาศัยในไทยเท่านั้น');
    }

    // กรอกสถานที่เกิด
    const birthPlaceVal = String(data.registerProvince || '').trim();
    if (birthPlaceVal) {
      const birthPlaceInput = page.locator('input[name="crs[city_name]"]').first();
      await birthPlaceInput.waitFor({ state: 'visible', timeout: 10000 });
      await birthPlaceInput.scrollIntoViewIfNeeded();
      await birthPlaceInput.click({ force: true });
      await birthPlaceInput.fill(birthPlaceVal);
      await birthPlaceInput.press('Tab');
      const actualBirthPlace = await birthPlaceInput.inputValue();
      if (actualBirthPlace !== birthPlaceVal) {
        throw new Error(`❌ กรอกสถานที่เกิดไม่สำเร็จ expected=${birthPlaceVal} actual=${actualBirthPlace}`);
      }
      console.log(`✅ สถานที่เกิด = ${birthPlaceVal}`);
    }

    // FATCA safe defaults
    for (const radioId of ['ans-145-2', 'ans-146-6', 'ans-147-24']) {
      const lbl = page.locator(`label[for="${radioId}"]`);
      if (await lbl.isVisible({ timeout: 1500 }).catch(() => false)) {
        await lbl.click({ force: true });
        console.log(`✅ FATCA คลิก ${radioId}`);
      }
      await page.waitForTimeout(100);
    }

    // JS fallback — ตอบ "ไม่" ทุก radio ที่ยังไม่ได้ตอบ
    await page.evaluate(() => {
      const safeTexts = ['ไม่ใช่', 'ไม่', 'ไม่มี'];
      const groups = {};
      document.querySelectorAll('input[type="radio"]').forEach(el => {
        if (!el.name) return;
        if (!groups[el.name]) groups[el.name] = [];
        groups[el.name].push(el);
      });
      for (const [, radios] of Object.entries(groups)) {
        if (radios.some(r => r.checked)) continue;
        const safe = radios.find(r => {
          const lbl = document.querySelector(`label[for="${r.id}"]`);
          const txt = (lbl?.innerText || r.value || '').trim();
          return safeTexts.some(s => txt.includes(s));
        });
        if (safe) {
          const lbl = document.querySelector(`label[for="${safe.id}"]`);
          if (lbl) lbl.click(); else safe.click();
        }
      }
    });
    await page.waitForTimeout(500);

    await clickButtonByText(page, 'ถัดไป');
    await page.waitForTimeout(2000);
    console.log(`🔎 URL หลัง fatca ถัดไป = ${page.url()}`);

    if (!page.url().includes('/applicant')) {
      const firstError = await page.locator('.invalid-feedback, .text-danger, [class*="error"]')
        .filter({ hasText: /.+/ }).first().innerText().catch(() => '');
      throw new Error(`❌ ไม่ไป /applicant หลังกด ถัดไป (url=${page.url()}) error="${firstError}"`);
    }

  } // end if (onFatca)

  // ── F. Applicant (ข้อมูลส่วนบุคคล) ─────────────────────────────────────

  console.log('📌 Step F: /applicant/');

  // ชื่อไม่เคยเปลี่ยน
  const changeNameNo = page.locator('label[for="change_name-n"]');
  if (await changeNameNo.isVisible({ timeout: 3000 }).catch(() => false)) {
    await changeNameNo.click({ force: true });
    console.log('✅ คลิก change_name-n');
  }

  // รอ applicant form โหลด + log URL
  await waitOptionalLoading(page);
  console.log(`🔎 Step F URL = ${page.url()}`);

  // สถานภาพสมรส (optional — บางผลิตภัณฑ์อาจไม่มีฟิลด์นี้)
  const maritalVal = String(data.maritalStatus || '').trim();
  const maritalSel = page.locator('select[name="applicant[marital_status_id]"]').first();
  const maritalVisible = await maritalSel.waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true).catch(() => false);
  if (maritalVisible) {
    if (maritalVal) {
      await maritalSel.selectOption({ label: maritalVal }, { timeout: 3000 }).catch(err => {
        console.warn(`⚠️ selectOption maritalStatus failed: ${err.message}`);
      });
      console.log(`✅ maritalStatus = ${maritalVal}`);
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️ maritalStatus: ไม่มีค่าจาก sheet — ข้ามขั้นตอน');
    }
  } else {
    console.log('   ⚠️ ไม่พบ marital status select — ข้ามขั้นตอน');
  }

  // สัญชาติ (optional — PA products อาจไม่มีฟิลด์นี้)
  const natSel = page.locator('select[name="applicant[nationality_id]"]', { timeout: 3000 }).first();
  const natVisible = await natSel.waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true).catch(() => false);
  if (natVisible) {
    const natOptions = await natSel.locator('option').all();
    // หา option แรกที่มี value จริง (ข้าม placeholder ที่ value ว่าง)
    let natVal = null;
    for (const opt of natOptions) {
      const v = await opt.getAttribute('value');
      if (v && v.trim() !== '') { natVal = v; break; }
    }
    if (natVal) {
      await natSel.selectOption(natVal, { timeout: 3000 }).catch(err => {
        console.warn(`⚠️ selectOption nationality failed: ${err.message}`);
      });
      console.log(`✅ nationality selected = ${natVal}`);
    } else {
      console.log('   ⚠️ nationality: ไม่มี option ที่มี value — ข้ามขั้นตอน');
    }
    await page.waitForTimeout(1500); // รอ Livewire re-render หลังเลือก nationality
  } else {
    console.log('   ⚠️ ไม่พบ nationality select — ข้ามขั้นตอน');
  }

  // กลุ่มอาชีพ
  const occGroupVal = String(data.occupation || '').trim();
  console.log(`🔎 occupation (group) value from sheet = "${occGroupVal}"`);
  const occGroupSel = page.locator('select[name="applicant[main_occupation_group_id]"]');
  const occGroupVisible = await occGroupSel.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`🔎 occupation group element visible = ${occGroupVisible}`);
  if (occGroupVisible) {
    // log ทุก option ที่มีใน dropdown
    const occGroupOptions = await occGroupSel.locator('option').allTextContents().catch(() => []);
    console.log(`🔎 occupation group options (${occGroupOptions.length}): ${occGroupOptions.join(' | ')}`);
  }
  if (occGroupVal && occGroupVisible) {
    // ลอง label-match ก่อน ถ้าไม่ได้ → value-match → ถ้ายังไม่ได้ → FAIL
    const occGroupOpts = await occGroupSel.locator('option').allTextContents().catch(() => []);
    const occGroupSelected = await occGroupSel.selectOption({ label: occGroupVal })
      .then(() => true)
      .catch(() => occGroupSel.selectOption(occGroupVal).then(() => true).catch(() => false));
    if (!occGroupSelected) {
      const failMsg = `[occupation group]: ไม่พบ "${occGroupVal}" ในตัวเลือกที่มีบนหน้าจอ (${occGroupOpts.map(t => t.trim()).join(', ')})`;
      console.error(failMsg);
      throw new Error(failMsg);
    }
    console.log(`✅ occupation group = "${occGroupVal}"`);
    await page.waitForTimeout(2500); // รอ Livewire โหลด occupation options
  } else {
    console.log(`⚠️ ข้าม occupation group (visible=${occGroupVisible}, val="${occGroupVal}")`);
  }

  // อาชีพ
  const occVal = String(data.jobDescription || '').trim();
  console.log(`🔎 jobDescription (occupation) value from sheet = "${occVal}"`);
  const occSel = page.locator('select[name="applicant[main_occupation_id]"]');
  const occVisible = await occSel.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`🔎 occupation element visible = ${occVisible}`);
  if (occVisible) {
    const occOptions = await occSel.locator('option').allTextContents().catch(() => []);
    console.log(`🔎 occupation options (${occOptions.length}): ${occOptions.join(' | ')}`);
  }
  if (occVal && occVisible) {
    const occResult = await occSel.evaluate((sel, val) => {
      const opts = Array.from(sel.options);
      const available = opts.map(o => o.text.trim()).filter(t => t);
      const opt = opts.find(o =>
        o.text.trim() === val || o.value === val || o.text.trim().includes(val) || val.includes(o.text.trim())
      );
      // ไม่มี fallback find(o => o.value !== '') — ถ้าไม่พบ return found:false
      if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); return { found: true, chosen: opt.text.trim(), available }; }
      return { found: false, chosen: null, available };
    }, occVal);
    if (!occResult.found) {
      const failMsg = `[occupation]: ไม่พบ "${occVal}" ในตัวเลือกที่มีบนหน้าจอ (${occResult.available.join(', ')})`;
      console.error(failMsg);
      throw new Error(failMsg);
    }
    console.log(`✅ occupation = "${occResult.chosen}" (จาก "${occVal}")`);
    await page.waitForTimeout(500);
  } else {
    console.log(`⚠️ ข้าม occupation (visible=${occVisible}, val="${occVal}")`);
  }

  // ตำแหน่ง / ลักษณะธุรกิจ (optional)
  await optionalFill(page, data.occupationPosition, 'input[name="applicant[main_occupation_position]"]', 'occupationPosition');
  await optionalFill(page, data.businessType, 'input[name="applicant[main_occupation_business_desc]"]', 'businessType');

  // รายได้ต่อปี
  await mandatoryFill(
    page,
    String(data.annualIncome || '').replace(/,/g, ''),
    'input[name="applicant[main_occupation_salary]"]',
    'annualIncome'
  );

  // ── ที่อยู่ตามทะเบียนบ้าน ──
  await mandatoryFill(page, data.registerHouseNo, 'input[name="applicant[address_registered][address_no]"]', 'registerHouseNo');
  await optionalFill(page, data.registerVillage, 'input[name="applicant[address_registered][village_name]"]', 'registerVillage');
  await optionalFill(page, data.registerMoo, 'input[name="applicant[address_registered][moo]"]', 'registerMoo');
  await optionalFill(page, data.registerSoi, 'input[name="applicant[address_registered][soi]"]', 'registerSoi');
  await optionalFill(page, data.registerRoad, 'input[name="applicant[address_registered][street]"]', 'registerRoad');

  await page.locator('select[name="applicant[address_registered][province_id]"]').first()
    .selectOption({ label: String(data.registerProvince || '').trim() });
  console.log(`✅ registerProvince = ${data.registerProvince}`);
  await page.waitForTimeout(1500);

  await page.locator('select[name="applicant[address_registered][district_id]"]').first()
    .selectOption({ label: String(data.registerDistrict || '').trim() });
  console.log(`✅ registerDistrict = ${data.registerDistrict}`);
  await page.waitForTimeout(1500);

  await page.locator('select[name="applicant[address_registered][subdistrict_id]"]').first()
    .selectOption({ label: String(data.registerSubDistrict || '').trim() });
  console.log(`✅ registerSubDistrict = ${data.registerSubDistrict}`);

  // รอ postal code auto-fill
  await expect.poll(async () => {
    return await page.locator('input[name="applicant[address_registered][postal_code]"]')
      .inputValue().catch(() => '');
  }, { timeout: 15000 }).not.toBe('');
  console.log('✅ postal code loaded');

  // ── ที่อยู่ปัจจุบัน ──
  const currentUseType = String(data.currentUseAddressType || '').trim();
  if (currentUseType.includes('ทะเบียนบ้าน')) {
    await clickRadioLabel(page, 'current_address_type_registered');
    console.log('✅ ใช้ที่อยู่ทะเบียนบ้าน');
  } else {
    await clickRadioLabel(page, 'current_address_type_other');
    console.log('✅ ใช้ที่อยู่ส่งเอกสาร');
    await mandatoryFill(page, data.currentHouseNo, 'input[name="applicant[address_current][address_no]"]', 'currentHouseNo');
    await optionalFill(page, data.currentVillage, 'input[name="applicant[address_current][village_name]"]', 'currentVillage');
    await optionalFill(page, data.currentMoo, 'input[name="applicant[address_current][moo]"]', 'currentMoo');
    await optionalFill(page, data.currentSoi, 'input[name="applicant[address_current][soi]"]', 'currentSoi');
    await optionalFill(page, data.currentRoad, 'input[name="applicant[address_current][street]"]', 'currentRoad');
    await page.locator('select[name="applicant[address_current][province_id]"]').first()
      .selectOption({ label: String(data.currentProvince || '').trim() });
    await page.waitForTimeout(1500);
    await page.locator('select[name="applicant[address_current][district_id]"]').first()
      .selectOption({ label: String(data.currentDistrict || '').trim() });
    await page.waitForTimeout(1500);
    await page.locator('select[name="applicant[address_current][subdistrict_id]"]').first()
      .selectOption({ label: String(data.currentSubDistrict || '').trim() });
    await expect.poll(async () => {
      return await page.locator('input[name="applicant[address_current][postal_code]"]')
        .inputValue().catch(() => '');
    }, { timeout: 15000 }).not.toBe('');
    console.log('✅ current postal code loaded');
  }

  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/beneficiary**', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ── G. Beneficiary (ผู้รับผลประโยชน์) ──────────────────────────────────

  console.log('📌 Step G: /beneficiary/');

  const benefitAutoLbl = page.locator('label[for="benefit_method_auto"]');
  if (await benefitAutoLbl.isVisible({ timeout: 3000 }).catch(() => false)) {
    await benefitAutoLbl.click({ force: true });
    console.log('✅ เลือก benefit_method_auto');
  }

  const beneList = data.bene?.length ? data.bene : [{
    benePrefix: '', beneName: data.cusName || '', beneSurname: data.cusSurname || '',
    beneRela: '', beneAge: '',
  }];
  console.log(`📋 จำนวนผู้รับผลประโยชน์: ${beneList.length} คน`);

  for (let i = 0; i < beneList.length; i++) {
    // กด "เพิ่มผู้รับผลประโยชน์" สำหรับคนที่ 2 เป็นต้นไป
    if (i > 0) {
      // log ทุกปุ่มที่มองเห็นได้ก่อนกด เพื่อ debug กรณี selector ไม่ตรง
      const visibleBtnTexts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button'))
          .filter(b => b.offsetParent !== null)
          .map(b => b.textContent.trim()).filter(t => t)
      ).catch(() => []);
      console.log(`   🔎 visible buttons before add beneficiary ${i + 1}:`, JSON.stringify(visibleBtnTexts));

      const addBenBtn = page.getByRole('button', { name: /เพิ่มผู้รับผลประโยชน์/i })
        .or(page.locator('button').filter({ hasText: /เพิ่ม.*ผู้รับ/i }))
        .or(page.locator('button').filter({ hasText: /เพิ่ม/i }))
        .first();
      if (await addBenBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBenBtn.click();
        console.log(`   ➕ กด "เพิ่มผู้รับผลประโยชน์" (คนที่ ${i + 1})`);
        // รอ Livewire append new beneficiary row (3s minimum + networkidle fallback)
        // หลีกเลี่ยง toHaveCount เพราะ dynamic name scheme แตกต่างกันตาม product
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { });
      } else {
        console.warn(`   ⚠️ ไม่พบปุ่ม "เพิ่มผู้รับผลประโยชน์" สำหรับคนที่ ${i + 1} — ข้ามรายการนี้`);
        continue; // ไม่มี row ใหม่ ไม่พยายามกรอก
      }
    }

    const benData = beneList[i];
    const benPrefix = String(benData.benePrefix || '').trim();
    const benFirstName = String(benData.beneName || '').trim();
    const benLastName = String(benData.beneSurname || '').trim();
    const benRela = String(benData.beneRela || '').trim();
    const benAge = String(benData.beneAge || '').trim();

    console.log(`📌 ผู้รับผลประโยชน์ที่ ${i + 1}: ${benPrefix} ${benFirstName} ${benLastName} | ${benRela} | อายุ ${benAge}`);

    // คำนำหน้า
    if (benPrefix) {
      const prefixSel = page.locator('select[name*="beneficiary"][name*="title_id"]').nth(i);
      if (await prefixSel.isVisible({ timeout: 3000 }).catch(() => false)) {
        const normalizedPrefix = normalizeTitle(benPrefix);
        const prefixSelected = await prefixSel.selectOption({ label: normalizedPrefix })
          .then(() => true)
          .catch(() => prefixSel.selectOption(benPrefix).then(() => true).catch(() => false));
        if (!prefixSelected) {
          const prefixOpts = await prefixSel.locator('option').allTextContents().catch(() => []);
          const failMsg = `[beneficiary[${i}] prefix]: ไม่พบ "${benPrefix}" ในตัวเลือกที่มีบนหน้าจอ (${prefixOpts.map(t => t.trim()).join(', ')})`;
          console.error(failMsg);
          throw new Error(failMsg);
        }
        console.log(`   ✅ คำนำหน้า: ${benPrefix}`);
      } else {
        const failMsg = `[beneficiary[${i}] prefix]: ไม่พบ select คำนำหน้าบนหน้าจอ (ค่าจาก sheet: "${benPrefix}")`;
        console.error(failMsg);
        throw new Error(failMsg);
      }
    }

    // ชื่อ
    if (benFirstName) {
      const fnInput = page.locator('input[name*="beneficiary"][name*="first_name"]').nth(i);
      if (await fnInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fnInput.fill(benFirstName);
        console.log(`   ✅ ชื่อ: ${benFirstName}`);
      } else {
        const failMsg = `[beneficiary[${i}] first_name]: ไม่พบ input ชื่อบนหน้าจอ (ค่าจาก sheet: "${benFirstName}")`;
        console.error(failMsg);
        throw new Error(failMsg);
      }
    }

    // นามสกุล
    if (benLastName) {
      const lnInput = page.locator('input[name*="beneficiary"][name*="last_name"]').nth(i);
      if (await lnInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lnInput.fill(benLastName);
        console.log(`   ✅ นามสกุล: ${benLastName}`);
      } else {
        const failMsg = `[beneficiary[${i}] last_name]: ไม่พบ input นามสกุลบนหน้าจอ (ค่าจาก sheet: "${benLastName}")`;
        console.error(failMsg);
        throw new Error(failMsg);
      }
    }

    // ความสัมพันธ์
    if (benRela) {
      const relaSel = page.locator('select[name*="beneficiary"][name*="relation_id"]').nth(i);
      if (await relaSel.isVisible({ timeout: 3000 }).catch(() => false)) {
        const relaSelected = await relaSel.selectOption({ label: benRela })
          .then(() => true)
          .catch(() => relaSel.selectOption(benRela).then(() => true).catch(() => false));
        if (!relaSelected) {
          const relaOpts = await relaSel.locator('option').allTextContents().catch(() => []);
          const failMsg = `[beneficiary[${i}] relation]: ไม่พบ "${benRela}" ในตัวเลือกที่มีบนหน้าจอ (${relaOpts.map(t => t.trim()).join(', ')})`;
          console.error(failMsg);
          throw new Error(failMsg);
        }
        console.log(`   ✅ ความสัมพันธ์: ${benRela}`);
      } else {
        const failMsg = `[beneficiary[${i}] relation]: ไม่พบ select ความสัมพันธ์บนหน้าจอ (ค่าจาก sheet: "${benRela}")`;
        console.error(failMsg);
        throw new Error(failMsg);
      }
    }

    // อายุ
    if (benAge) {
      const ageSel = page.locator('input[name$="[age]"]').nth(i);
      if (await ageSel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await ageSel.fill(benAge);
        console.log(`   ✅ อายุ: ${benAge}`);
      } else {
        const failMsg = `[beneficiary[${i}] age]: ไม่พบ input อายุบนหน้าจอ (ค่าจาก sheet: "${benAge}")`;
        console.error(failMsg);
        throw new Error(failMsg);
      }
    }
  }

  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/tax**', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ── H. Tax (ภาษี) ────────────────────────────────────────────────────────

  console.log('📌 Step H: /tax/');
  await page.waitForURL('**/tax**', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // เลือก radio: index 0 = ไม่มีความประสงค์ขอยกเว้นภาษี
  await page.evaluate(() => {
    const radios = document.querySelectorAll('input[type="radio"]');
    const r = radios[0];
    if (r) { const lbl = r.nextElementSibling; if (lbl) lbl.click(); else r.click(); }
  });
  await page.waitForTimeout(300);
  console.log('✅ เลือก: ไม่มีความประสงค์ขอยกเว้นภาษี');

  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/document**', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ── I. Document (แนบเอกสาร) ─────────────────────────────────────────────

  console.log('📌 Step I: /document/ — อัปโหลดเอกสาร');
  await dismissOverlays(page);
  await page.waitForTimeout(1000);

  const idCardImagePath = path.resolve(__dirname, 'fixtures', 'id_card.jpg');

  if (fs.existsSync(idCardImagePath)) {
    await page.locator('input[name="idcard_front"]')
      .setInputFiles(idCardImagePath).catch(() => { });
    await page.waitForTimeout(1000);
    console.log('   ✅ อัปโหลดภาพหน้าบัตรแล้ว');
  } else {
    console.warn(`   ⚠️ ไม่พบไฟล์: ${idCardImagePath} — ข้ามอัปโหลด`);
  }

  if (fs.existsSync(idCardImagePath)) {
    await page.locator('input[name="idcard_selfie"]')
      .setInputFiles(idCardImagePath).catch(() => { });
    await page.waitForTimeout(1000);
    console.log('   ✅ อัปโหลดภาพถ่ายคู่บัตรแล้ว');
  }

  await dismissOverlays(page);
  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/policy/, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => { });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  console.log('✅ อัปโหลดเอกสารเสร็จสิ้น');

  // ── J. Policy delivery (วิธีรับกรมธรรม์) ───────────────────────────────

  await page.waitForURL(/\/(policy|confirm)/, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => { });

  if (page.url().includes('/policy')) {
    console.log('📌 Step J: /policy/ — เลือกวิธีรับกรมธรรม์');
    await page.waitForTimeout(1000);

    // strict: ถ้า sheet ไม่มีค่า หรือค่าไม่รู้จัก → throw ทันที ห้าม fallback
    const policyChoice = String(data.paperOrElectronic || '').trim();
    if (!policyChoice) {
      throw new Error('[paperOrElectronic]: ไม่มีค่าใน sheet — ต้องระบุ "e-policy" หรือ "ไปรษณีย์"');
    }
    const deliveryMap = {
      'e-policy': 'email',
      'email': 'email',       // alias: sheet value "Email"
      'ไปรษณีย์': 'postal',
      'paper': 'postal',      // alias: sheet value "Paper"
    };
    const deliveryVal = deliveryMap[policyChoice.toLowerCase()] ?? deliveryMap[policyChoice];
    if (!deliveryVal) {
      throw new Error(`[paperOrElectronic]: ไม่รู้จักค่า "${policyChoice}" — ค่าที่ยอมรับ: "e-policy", "Email", "ไปรษณีย์", "Paper"`);
    }

    // mandatory click: ถ้าไม่พบ label → throw (ไม่ silent skip)
    const clickDeliveryLabel = async (fieldName) => {
      const lbl = page.locator(`label[for="${fieldName}_${deliveryVal}"]`);
      const visible = await lbl.isVisible({ timeout: 3000 }).catch(() => false);
      if (!visible) {
        throw new Error(`[${fieldName}]: ไม่พบ label[for="${fieldName}_${deliveryVal}"] บนหน้าจอ`);
      }
      await lbl.click();
      await page.waitForTimeout(300);
      const openModal = page.locator('.modal.show')
        .filter({ has: page.locator('[data-dismiss="modal"]') });
      if (await openModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await openModal.locator('[data-dismiss="modal"]').click();
        await page.waitForTimeout(500);
        console.log('   ปิด popup แจ้งเตือน');
      }
    };

    await clickDeliveryLabel('policy_format');
    console.log(`✅ รับกรมธรรม์แบบ: ${policyChoice}`);
    await clickDeliveryLabel('document_delivery_format');
    console.log(`✅ รับใบเสร็จแบบ: ${policyChoice}`);

    await clickButtonByText(page, 'ถัดไป');
    await page.waitForURL(/\/confirm/, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => { });
    await waitOptionalLoading(page);
    await dismissPopups(page);
  }

  // ── K. Confirm (ยืนยันคำสั่งซื้อ) ──────────────────────────────────────

  console.log('📌 Step K: /confirm/ — ยืนยันคำสั่งซื้อ');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await dismissOverlays(page);

  const confirmOrderBtn = page.locator('button[wire\\:click*="confirmed"]');
  await confirmOrderBtn.waitFor({ state: 'visible', timeout: 10000 });
  await confirmOrderBtn.click();
  await page.waitForTimeout(2000);

  // force close quotationOutdatedModal ถ้ามี
  const outdatedModal = page.locator('#quotationOutdatedModal');
  if (await outdatedModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log('   ⚠️ พบ quotationOutdatedModal — force close');
    await page.evaluate(() => {
      const m = document.querySelector('#quotationOutdatedModal');
      if (m) { m.classList.remove('show'); m.style.display = 'none'; }
      document.querySelector('.modal-backdrop')?.remove();
      document.body.classList.remove('modal-open');
    });
    await page.waitForTimeout(500);
  }
  console.log('✅ กดยืนยันคำสั่งซื้อแล้ว');

  // ── L. OTP ───────────────────────────────────────────────────────────────

  console.log('📌 Step L: OTP');
  const otpModal = page.locator('#confirmOtpModal');
  await otpModal.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });

  if (await otpModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    // กรอกเบอร์โทร (ถ้ายังไม่มีค่า)
    const phoneOtpInput = otpModal.locator(
      'input[wire\\:model="phone_number"], input[wire\\:model\\.defer="phone_number"]'
    );
    if (await phoneOtpInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const currentVal = await phoneOtpInput.inputValue().catch(() => '');
      if (!currentVal) {
        await phoneOtpInput.fill(phone);
        console.log(`   กรอกเบอร์โทร ${phone} ใน OTP modal`);
      }
    }

    // กด ขอรหัส
    const sendOtpBtn = otpModal.locator('button[wire\\:click="send"]');
    if (await sendOtpBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendOtpBtn.click();
      await page.waitForTimeout(2000);
      console.log('   กด "ขอรหัส" แล้ว — รอ OTP...');
    }

    // ดึง OTP จาก Debug OTP (UAT แสดง "Debug OTP: XXXXXX")
    // รอ Livewire render ก่อน innerText() — 2s อาจไม่พอ, ให้รอสูงสุด 15s
    const otpDebugEl = otpModal.locator('p').filter({ hasText: /Debug OTP/i });
    await otpDebugEl.waitFor({ state: 'visible', timeout: 15000 }).catch(() => { });
    const otpDebugText = await otpDebugEl.innerText({ timeout: 5000 }).catch(() => '');
    const otpCode = otpDebugText.match(/Debug OTP[:\s]+(\d+)/i)?.[1] || '';

    if (otpCode) {
      console.log(`   OTP: ${otpCode}`);

      // กรอก OTP ทีละ digit ผ่าน evaluate
      const filledCount = await page.evaluate(({ otp }) => {
        const modal = document.querySelector('#confirmOtpModal');
        const inputs = modal
          ? Array.from(modal.querySelectorAll('input')).filter(el => el.offsetParent !== null)
          : [];
        inputs.forEach((inp, i) => {
          if (i < otp.length) {
            inp.value = otp[i];
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
          }
        });
        return inputs.length;
      }, { otp: otpCode });
      console.log(`   กรอก OTP ใน ${filledCount} ช่อง`);
      await page.waitForTimeout(500);

      // กด ยืนยัน
      const confirmed = await page.evaluate(() => {
        const modal = document.querySelector('#confirmOtpModal');
        const btn = modal && Array.from(modal.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'ยืนยัน');
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (confirmed) {
        await page.waitForTimeout(3000);
        console.log('   ✅ ยืนยัน OTP สำเร็จ');
      } else {
        console.warn('   ⚠️ ไม่พบปุ่ม "ยืนยัน" ใน OTP modal');
      }
    } else {
      console.warn('   ⚠️ ไม่พบ Debug OTP — รอ manual 30 วิ...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱  กรุณากรอก OTP บนหน้าจอแล้วกดยืนยันด้วยตัวเอง');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await page.waitForTimeout(30000);
    }
  }

  // ── M. Payment (unified: QR / Credit Card / Cash — ทุก product type) ────────

  // referenceNumber hoist ไว้ที่นี่ — QR block จะ assign ก่อน step N
  // step N จะ re-read จาก success page body ถ้า referenceNumber ยังว่าง (non-QR flow)
  let referenceNumber = '';

  const paymentMethodVal = String(data.paymentMethod || '').trim();
  console.log(`📌 Step M: /payment/ — ${paymentMethodVal}`);
  await page.waitForURL(/\/payment/, { timeout: 20000, waitUntil: 'domcontentloaded' }).catch(() => { });
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });
  await dismissOverlays(page);
  await page.waitForTimeout(1000);
  console.log(`🔎 URL ที่ Step M = ${page.url()}`);

  // ── PA-only pre-step: summary page → กด "ถัดไป" เพื่อเปิดหน้าเลือก payment method ──
  // PA มี summary page พิเศษก่อนที่ payment method options จะปรากฏ
  // Savings ข้ามขั้นตอนนี้ไปเลย — payment options พร้อมทันทีที่ /payment โหลด
  if (isPaProduct(data, productSlug)) {
    console.log('📌 PA product: กด "ถัดไป" บน summary page เพื่อเปิด payment method selection');

    const paNextClicked = await page.evaluate(() => {
      const candidates = [
        document.querySelector('button[type="submit"].btn--submit'),
        document.querySelector('button[wire\\:click*="submit"]'),
        document.querySelector('button[wire\\:click*="next"]'),
        Array.from(document.querySelectorAll('button')).find(b => /ถัดไป|ต่อไป/i.test(b.textContent)),
      ].filter(Boolean);
      if (candidates[0]) { candidates[0].click(); return candidates[0].textContent.trim(); }
      return null;
    });
    if (paNextClicked) {
      console.log(`✅ PA pre-step: กดปุ่ม "${paNextClicked}"`);
    } else {
      const paNextBtn = page.getByRole('button', { name: /ถัดไป|ต่อไป/i }).first();
      if (await paNextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await paNextBtn.click();
        console.log('✅ PA pre-step: กดปุ่ม getByRole ถัดไป');
      }
    }
    await page.waitForTimeout(2000);

    // ถ้า redirect ไป /success ทันทีหลังกด "ถัดไป" (UAT bypass) — ข้าม payment selection
    if (/\/success/.test(page.url())) {
      console.log('⏭️ PA: redirect ไป /success ทันทีหลัง pre-step — ข้าม payment selection');
    } else {
      // รอให้ Livewire re-render payment method options หลัง pre-step click
      await page.waitForTimeout(3000);
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });
    }
  }

  // ── Unified payment method selection (PA + Savings) ─────────────────────
  // ทำเฉพาะเมื่อยังไม่ได้ redirect ไป /success จาก PA pre-step
  if (!/\/success/.test(page.url())) {
    // รวม options จากทั้ง button (offsetParent!==null) และ label.payment__item
    // ยกเว้น navigation buttons ด้วย navTexts Set
    const domDump = await page.evaluate(() => {
      const navTexts = new Set(['ถัดไป', 'ต่อไป', 'ย้อนกลับ', 'ยกเลิก', 'กลับ']);
      const btns = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null)
        .map(b => b.textContent.trim())
        .filter(t => t && !navTexts.has(t));
      const labels = Array.from(document.querySelectorAll('label.payment__item, label[class*="payment"]'))
        .map(l => l.textContent.trim()).filter(t => t);
      return [...new Set([...btns, ...labels])];
    });
    console.log('🔎 payment options บนหน้า:', JSON.stringify(domDump));

    // Match: exact → partial → cash alias — strict policy: ไม่พบ → throw ทันที
    const isCashMethod = /เงินสด|สด/i.test(paymentMethodVal);
    const matchedOptionText = domDump.find(t => t === paymentMethodVal)                           // 1. exact
      || domDump.find(t => t.includes(paymentMethodVal) || paymentMethodVal.includes(t))          // 2. partial
      || (isCashMethod ? domDump.find(t => /เงินสด|ชำระเงินสด/i.test(t)) : undefined)           // 3. cash alias
      || null;

    if (!matchedOptionText) {
      const failMsg = `ไม่พบวิธีชำระ "${paymentMethodVal}" บนหน้า payment\n   วิธีชำระที่มีบนหน้าจอ: [${domDump.join(', ')}]`;
      console.error(failMsg);
      throw new Error(failMsg);
    }

    // คลิก payment option — รองรับทั้ง button และ label.payment__item (Alpine @click)
    // ใช้ attached + visible + js-click fallback เพื่อรองรับ Alpine x-show และ display:none
    const matchedLoc = page.locator(`button:has-text("${matchedOptionText}"), label:has-text("${matchedOptionText}")`).first();
    const matchedAttached = await matchedLoc.waitFor({ state: 'attached', timeout: 2000 }).then(() => true).catch(() => false);
    if (matchedAttached) {
      await matchedLoc.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => { });
      await page.waitForTimeout(300);
      if (await matchedLoc.isVisible({ timeout: 1500 }).catch(() => false)) {
        await matchedLoc.click();
      } else {
        // Alpine @click labels (label.payment__item) require dispatchEvent — el.click() silently fails
        await matchedLoc.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
        console.log(`⚡ js-click "${matchedOptionText}" (dispatchEvent)`);
      }
    }
    console.log(`✅ เลือกวิธีชำระ: "${matchedOptionText}"`);

    // กด btn--submit ถ้ามีบนหน้า — Savings ต้องการขั้นตอนนี้, PA อาจมีหรือไม่มีก็ได้
    // Alpine x-show controls visibility — ใช้ evaluate เพื่อหลีกเลี่ยง strict mode จาก hidden duplicates
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"].btn--submit');
      if (btn) btn.click();
    });

    // ── Branch on payment type (unified — ทำงานเหมือนกันทุก product) ─────────────────
    const isQrMethod = /qr|คิวอาร์|ใช้รหัส/i.test(paymentMethodVal);
    const isCreditCard = /บัตรเครดิต/i.test(paymentMethodVal);

    if (isQrMethod) {
      // ── QR Code flow (7 steps — identical for PA and Savings) ──────────────────────
      // Step 1: กด "ถัดไป"/"ต่อไป" ด้วย dispatchEvent MouseEvent (trigger Alpine @click handler)
      // ใช้ .replace(/\s+/g,'').includes() ไม่ใช้ .trim() === เพราะ Alpine icon child spans เพิ่ม whitespace
      console.log('📌 QR: กด "ถัดไป" เพื่อเปิด QR popup...');
      const qrNextResult = await page.evaluate(() => {
        const allBtns = Array.from(document.querySelectorAll('button'));
        const dumpAll = allBtns.map(b =>
          `offsetParent=${b.offsetParent !== null} normalized="${b.textContent.replace(/\s+/g, '')}" innerText="${(b.innerText || '').trim()}"`
        );
        const nextBtn =
          allBtns.find(b => b.offsetParent !== null && b.textContent.replace(/\s+/g, '').includes('ถัดไป')) ||
          allBtns.find(b => b.offsetParent !== null && b.textContent.replace(/\s+/g, '').includes('ต่อไป'));
        if (!nextBtn) return { clicked: false, dumpAll };
        const label = nextBtn.textContent.replace(/\s+/g, '');
        nextBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return { clicked: true, label, dumpAll };
      });
      console.log('🔎 QR ถัดไป — all buttons:', JSON.stringify(qrNextResult.dumpAll));
      if (!qrNextResult.clicked) {
        throw new Error('❌ QR: ไม่พบปุ่ม "ถัดไป"/"ต่อไป" หลังเลือก QR payment method — QR popup ไม่เปิด');
      }
      console.log(`✅ QR: กดปุ่ม "${qrNextResult.label}" (dispatchEvent MouseEvent)`);

      // Step 2: รอ 1 วินาที — ป้องกัน false-positive จาก "ต่อไป" button ที่มีอยู่ก่อน popup เปิด
      await page.waitForTimeout(1000);

      // Step 3: waitForFunction — รอ QR section render (QR image หรือ เลขใบคำขอ)
      // หมายเหตุ: ห้ามใช้ 'canvas' เป็น signal — false-positive กับ canvas อื่นๆ บนหน้า
      //           (chart, animation, ฯลฯ) ทำให้ resolve ก่อน QR panel เปิด → body ยังเป็น navbar
      // ใช้ img[src*="qr"/"QR"/"promptpay"] หรือ เลขใบคำขอ ที่ปรากฏใน QR panel เท่านั้น
      console.log('⏳ QR: รอ QR section โหลด...');
      const qrSectionReady = await page.waitForFunction(() => {
        // ตรวจ QR image เฉพาะ path ที่มี qr/QR/promptpay — ไม่ใช้ canvas (false-positive)
        const hasQrImg = !!document.querySelector(
          'img[src*="qr"], img[src*="QR"], img[src*="promptpay"], img[src*="PromptPay"], img[alt*="qr" i]'
        );
        const bodyText = document.body.innerText || '';
        const hasAppNo = /(?:ใบคำขอ|เลขที่|อ้างอิง|เลขอ้างอิง)[^\d]*\d{6,12}/.test(bodyText)
          || /ตามเลขที่อ้างอิง\s+\d+/.test(bodyText);
        return hasQrImg || hasAppNo;
      }, { timeout: 20000 }).then(() => true).catch(() => false);

      if (!qrSectionReady) {
        console.warn('⚠️ QR: waitForFunction timeout — fallback รอ 3s');
        await page.waitForTimeout(3000);
      } else {
        // รอให้ Alpine render เนื้อหาใน QR panel ครบ (เลขใบคำขออาจ render ช้ากว่า img เล็กน้อย)
        console.log('✅ QR: QR section ready — รอ Alpine render เนื้อหา QR panel...');
        await page.waitForTimeout(1000);
      }

      // Step 4: ดึง referenceNumber จาก QR section — strict policy: ไม่พบ → throw ทันที
      // ห้ามใช้ \b(\d{7,12})\b fallback — จะ match เบอร์โทร / UUID fragment / timestamp
      const qrPageBody = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
      const qrRefMatch =
        qrPageBody.match(/ตามเลขที่อ้างอิง\s+(\d+)/i) ||
        qrPageBody.match(/(?:ใบคำขอ|เลขที่|อ้างอิง|เลขอ้างอิง)[^\d]*(\d{6,12})/i);
      if (qrRefMatch) {
        referenceNumber = qrRefMatch[1];
        console.log(`✅ QR: ดึงเลขใบคำขอจาก QR section: ${referenceNumber}`);
      } else {
        throw new Error(
          `❌ QR: ไม่พบเลขใบคำขอใน QR section (URL: ${page.url()})\n` +
          `   Body text (200 chars): ${qrPageBody.substring(0, 200)}`
        );
      }

      // Step 6: POST referenceNumber ไปยัง n8n webhook
      console.log(`📌 QR step 6: ส่งเลขใบคำขอ ${referenceNumber} ไปยัง n8n...`);
      const qrRes = await fetch('https://workflow.ochi.link/webhook/thaiqr-notifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: data.environment, caseType: 'new', referenceNo: referenceNumber }),
      }).catch(err => { console.error(`❌ QR step 6: fetch error: ${err.message}`); return null; });
      if (qrRes && qrRes.ok) {
        console.log(`✅ QR step 6: ส่งข้อมูลไปยัง n8n สำเร็จ (status ${qrRes.status})`);
      } else {
        console.warn(`⚠️ QR step 6: n8n ตอบกลับ status ${qrRes?.status ?? 'ไม่ได้รับ response'}`);
      }

      // Step 7: รอ QR popup หายไปเอง (backend dismiss) — ตรวจ QR image หายหรือ redirect /success
      console.log('⏳ QR step 7: รอ QR popup หายไปเอง...');
      const qrPopupGone = await page.waitForFunction(() => {
        const qrImg = document.querySelector('img[src*="qr"], img[src*="QR"]');
        const isSuccess = /\/success/.test(window.location.href);
        return !qrImg || isSuccess;
      }, { timeout: 60000 }).then(() => true).catch(() => false);
      if (qrPopupGone) {
        console.log('✅ QR step 7: QR popup หายไปแล้ว (หรือ redirect ไป /success)');
      } else {
        console.warn('⚠️ QR step 7: รอ 60s แล้ว QR popup ยังไม่หาย — เดินต่อ');
      }

    } else if (isCreditCard) {
      // ── Credit Card flow (2C2P + 3DS — identical for PA and Savings) ─────────────────
      await page.waitForTimeout(4000);
      if (!/\/success/.test(page.url())) {
        console.log(`💳 URL หลัง submit: ${page.url()} — กรอก 2C2P form`);
        await fill2C2PForm(page);
        // รอ redirect หลัง Continue Payment (อาจผ่าน 3DS ก่อน)
        await page.waitForTimeout(4000);
        // ตรวจ 3DS challenge ถ้ายังไม่ถึง /success
        if (!/\/success/.test(page.url())) {
          const url3ds = page.url();
          console.log(`🔒 URL หลัง Continue Payment: ${url3ds}`);
          // รอจนกว่า 3DS page จะโหลดเนื้อหา OTP หรือ input field ปรากฏ
          // (แทน waitForLoadState + waitForTimeout ที่อาจเร็วเกินไป)
          await page.waitForFunction(
            () => {
              const bodyText = document.body ? document.body.innerText : '';
              if (/(?:default|debug|otp)/i.test(bodyText)) return true;
              const inputs = document.querySelectorAll(
                'input[type="text"], input[type="tel"], input[type="number"], input[type="password"]'
              );
              if (inputs.length > 0) return true;
              if (/\/success/.test(window.location.href)) return true;
              return false;
            },
            { timeout: 30000 }
          ).catch(() => {
            console.log('   ⚠️ waitForFunction 3DS หมดเวลา — ลองต่อด้วยข้อมูลที่มี');
          });
          const ss3ds = path.join(__dirname, 'screenshots', `3ds-${Date.now()}.png`);
          await page.screenshot({ path: ss3ds, fullPage: true }).catch(() => { });
          console.log(`📸 screenshot 3DS: ${ss3ds}`);

          // ดึง Default OTP จาก 3DS page — ลองทั้ง page และ iframe
          let otpCode3ds = '';
          // ดึง body text จาก main frame ก่อน — ถ้าว่าง ให้ loop iframe เก็บข้อความรวมกัน
          let bodyText3ds = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
          if (!bodyText3ds.trim()) {
            for (const frame of page.frames()) {
              const ftxtEarly = await frame.locator('body').innerText({ timeout: 3000 }).catch(() => '');
              if (ftxtEarly.trim()) { bodyText3ds = ftxtEarly; break; }
            }
          }
          const otpMatch = bodyText3ds.match(/(?:default|debug|otp)[^\d]*(\d{4,8})/i);
          if (otpMatch) {
            otpCode3ds = otpMatch[1];
            console.log(`🔑 Default OTP (page): ${otpCode3ds}`);
          }
          if (!otpCode3ds) {
            for (const frame of page.frames()) {
              const ftxt = await frame.locator('body').innerText({ timeout: 3000 }).catch(() => '');
              const fm = ftxt.match(/(?:default|debug|otp)[^\d]*(\d{4,8})/i);
              if (fm) { otpCode3ds = fm[1]; console.log(`🔑 Default OTP (iframe ${frame.url()}): ${otpCode3ds}`); break; }
            }
          }

          if (otpCode3ds) {
            let otpFilled = false;
            const otpInputPage = page.locator('input[type="text"], input[type="tel"], input[type="number"], input[type="password"]').first();
            if (await otpInputPage.isVisible({ timeout: 3000 }).catch(() => false)) {
              await otpInputPage.fill(otpCode3ds);
              otpFilled = true;
              console.log(`   ✅ กรอก OTP ใน page: ${otpCode3ds}`);
            }
            if (!otpFilled) {
              for (const frame of page.frames()) {
                const inp = frame.locator('input[type="text"], input[type="tel"], input[type="number"], input[type="password"]').first();
                if (await inp.isVisible({ timeout: 2000 }).catch(() => false)) {
                  await inp.fill(otpCode3ds);
                  otpFilled = true;
                  console.log(`   ✅ กรอก OTP ใน iframe (${frame.url()}): ${otpCode3ds}`);
                  break;
                }
              }
            }
            if (otpFilled) {
              let submitted = false;
              const submitBtn3ds = page.locator('button[type="submit"], input[type="submit"], button').filter({ hasText: /submit|confirm|ยืนยัน|ok|continue/i }).first();
              if (await submitBtn3ds.isVisible({ timeout: 3000 }).catch(() => false)) {
                await submitBtn3ds.click();
                submitted = true;
                console.log('   ✅ กด Submit 3DS OTP (page)');
              }
              if (!submitted) {
                for (const frame of page.frames()) {
                  const fbtn = frame.locator('button[type="submit"], input[type="submit"], button').filter({ hasText: /submit|confirm|ยืนยัน|ok|continue/i }).first();
                  if (await fbtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await fbtn.click();
                    submitted = true;
                    console.log(`   ✅ กด Submit 3DS OTP (iframe ${frame.url()})`);
                    break;
                  }
                }
              }
              if (!submitted) {
                await page.keyboard.press('Enter');
                console.log('   ✅ กด Enter เป็น fallback');
              }
            } else {
              console.log('   ⚠️ ไม่พบ OTP input field');
            }
          } else {
            console.log('   ⚠️ ไม่พบ Default OTP text บนหน้า 3DS');
          }

          console.log('   ⏳ รอ redirect ไป /success หลัง 3DS...');
          await page.waitForURL(/\/success/, { timeout: 60000, waitUntil: 'domcontentloaded' }).catch(() => { });
        }
      } else {
        console.log('✅ ผ่าน payment (UAT bypass ไม่ต้องกรอก 2C2P)');
      }

    } else {
      // ── Cash / other (everything else) — รอ redirect ไป /success ────────────────────
      await page.waitForURL(/\/success/, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => { });
    }

    // ── ตรวจ /success URL หลัง payment (throw ถ้าไม่ใช่ — ทุก product type) ──
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });
    await page.waitForTimeout(1500);
    const paymentFinalUrl = page.url();
    console.log(`🔎 URL หลัง payment = ${paymentFinalUrl}`);
    if (!/\/success/.test(paymentFinalUrl)) {
      throw new Error(
        `❌ ไม่เจอหน้า /success หลังชำระเงิน (URL จริง: ${paymentFinalUrl}) — กรุณาตรวจสอบขั้นตอน payment`
      );
    }
    console.log('✅ ชำระเงินเสร็จสิ้น');
  } // end unified payment selection + channel block

  // ── N. Success — ดึงเลขที่อ้างอิง ────────────────────────────────────────

  console.log('📌 Step N: /success/ — ดึงเลขอ้างอิง');
  await page.waitForURL(/\/success/, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => { });
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });
  await page.waitForTimeout(1000);

  const stepNUrl = page.url();
  console.log(`🔎 URL ที่ Step N = ${stepNUrl}`);

  // QR payment: referenceNumber ถูก assign ไว้แล้วจาก QR section (PA QR หรือ Savings QR blocks)
  // ถ้ายังว่างอยู่ตรงนี้ → อ่านจาก success page body (non-QR flow หรือ QR ที่ redirect ไป /success)
  // ห้าม fallback เป็น UUID หรือ 'QR-pending' — strict data policy
  const isQrPayment = /qr/i.test(paymentMethodVal) || paymentMethodVal.includes('คิวอาร์');
  const isStillOnPayment = /\/payment/.test(stepNUrl) && !/\/success/.test(stepNUrl);

  if (isStillOnPayment && !isQrPayment) {
    throw new Error(`❌ ไม่ได้อยู่บนหน้า /success (URL: ${stepNUrl})`);
  }

  // isStillOnPayment + isQrPayment: QR blocks ด้านบนควร assign referenceNumber ไว้แล้ว
  // ถ้ายังว่าง → แสดงว่า QR blocks throw ก่อนมาถึงนี้ (เลขไม่เจอ) → ไม่ต้อง fallback
  if (!referenceNumber && /\/success/.test(stepNUrl)) {
    // success page: อ่าน referenceNumber จาก body (สำหรับ non-QR flow หรือ QR ที่ redirect สำเร็จ)
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const refMatch =
      bodyText.match(/ตามเลขที่อ้างอิง\s+(\d+)/i) ||
      bodyText.match(/(?:ใบคำขอ|เลขที่|อ้างอิง|Ref)[^\d]*(\d{6,12})/i) ||
      bodyText.match(/\b(\d{7,12})\b/);
    referenceNumber = refMatch ? refMatch[1] : '';
  }
  // ไม่มี else-fallback UUID/'QR-pending' — ถ้าหาไม่เจอจาก QR section และไม่ได้อยู่ /success
  // test จะ FAIL ที่ caller (`if (!referenceNumber) throw new Error(...)`) อยู่แล้ว
  console.log(`✅ เลขอ้างอิง: ${referenceNumber || '(ไม่พบ)'}`);

  // กด เสร็จสิ้น
  const finishBtn = page.getByRole('button', { name: /เสร็จสิ้น/i })
    .or(page.locator('a').filter({ hasText: /เสร็จสิ้น/i }));
  if (await finishBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await finishBtn.first().click();
    await page.waitForTimeout(1000);
    console.log('✅ กด "เสร็จสิ้น" แล้ว');
  }

  return referenceNumber;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Test — Loop ดึงเคสจาก Google Sheet แล้วรัน Phase 1 Flow
// ─────────────────────────────────────────────────────────────────────────────
test('Digital Sales — Google Sheet Runner', async ({ browser }) => {
  test.setTimeout(0);
  let idx = 0;

  // ── Fetch all runnable cases ONCE ──────────────────────────────────────────
  const allCases = await fetchRunnableCases(RUN_CREATE_BY);
  if (!allCases.length) {
    console.log('🎉 ไม่มีเคสให้รันแล้ว');
    return;
  }
  console.log(`📋 พบ ${allCases.length} เคสที่ต้องรัน: ${allCases.map(c => `No ${c.no}`).join(', ')}`);

  // ── Process each case ───────────────────────────────────────────────────────
  for (const finalData of allCases) {
    idx++;
    const { no, environment, linkProduct } = finalData;
    const productSlug = String(linkProduct).split('/').pop();

    const claimed = await claimCase(no, RUN_CREATE_BY);
    if (!claimed) {
      console.log(`⏭️ ข้าม No ${no} — ไม่สามารถ claim ได้`);
      continue;
    }

    const context = await browser.newContext({ timezoneId: 'Asia/Bangkok' });
    const page = await context.newPage();
    await setupAutoPopupDismiss(page);

    let status = 'FAIL';
    let remark = '';
    let referenceNumber = '';
    let qrReady = false;
    const startTime = Date.now();

    try {
      const baseUrl = ENV_MAP[environment];
      if (!baseUrl) throw new Error(`❌ ไม่รู้จัก Env: "${environment}"`);
      if (!linkProduct || String(linkProduct).trim() === '') {
        throw new Error(`❌ Link_Product ว่างเปล่า — ตรวจสอบ Var_DigitalSales lookup หรือรหัสแบบประกัน "${finalData.policyCode}" ในชีต`);
      }
      // รองรับทั้ง path (/our-products/...) และ full URL (https://...)
      const fullUrl = String(linkProduct).startsWith('http')
        ? String(linkProduct)
        : `${baseUrl}${linkProduct}`;

      console.log(`\n${'━'.repeat(50)}`);
      console.log(`🚀 [${idx}] No ${no} | ${productSlug} | ${environment}`);
      console.log(`🌐 เปิด: ${fullUrl}`);
      console.log('━'.repeat(50));

      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await dismissPopups(page);

      referenceNumber = await runPhase1Flow(page, finalData, productSlug);

      if (!referenceNumber) throw new Error('❌ ไม่พบเลขอ้างอิงบนหน้า success');
      status = 'PASS';
      remark = `เลขอ้างอิง: ${referenceNumber}`;
      console.log(`\n✅ PASS: No ${no} | ${productSlug} | เลขอ้างอิง: ${referenceNumber}`);

      // ถ้า payment method เป็น QR Code → mark Test Status QR = Ready for Test เพื่อรัน flow ถัดไป
      const pmVal = String(finalData.paymentMethod || '').trim();
      if (/qr/i.test(pmVal) || pmVal.includes('คิวอาร์')) {
        qrReady = true;
        console.log('📌 QR Code payment — จะ set Test Status QR = Ready for Test');
      }
    } catch (err) {
      const errorMessage = String(err?.message || err);
      const isRunnerStopped =
        page.isClosed?.() ||
        /Target page, context or browser has been closed/i.test(errorMessage) ||
        /Test ended/i.test(errorMessage);
      if (isRunnerStopped) {
        console.log(`🛑 Runner stopped: No ${no}`);
        throw err;
      }
      status = 'FAIL';
      remark = errorMessage;
      console.error(`\n❌ FAIL: No ${no} | ${productSlug}:`, err);
      try {
        const screenshotPath = `reports/qa/screenshots/phase1_gsheet_fail_${no}_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot: ${screenshotPath}`);
      } catch { }
    } finally {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      try {
        // QR PASS → Result = 'Waiting Policy No' (ลูกค้าชำระแล้ว แต่ยังไม่มีเลขกรมธรรม์)
        //           + skipTestStatus=true → ไม่เขียน Test Status และ Test Status QR (คงค่าเดิม)
        // QR FAIL / non-QR → ใช้ status ตามปกติ ('PASS' หรือ 'FAIL')
        const isQrPass = qrReady && status === 'PASS';
        const resultOverride = isQrPass ? 'Waiting Policy No' : '';

        await writeResult({
          no,
          status,
          remark: `[${elapsed}s] ${remark}`.slice(0, 500),
          applicationNo: referenceNumber,
          result: resultOverride,
          // QR+PASS: ไม่เขียน Test Status — ปล่อยให้คงค่าเดิมใน sheet
          skipTestStatus: isQrPass,
        });
        console.log(`📝 Write result: No ${no} => ${status}${resultOverride ? ` | Result: ${resultOverride}` : ''} [${elapsed}s]`);
      } catch (writeErr) {
        console.error(`❌ Write Sheet failed: No ${no}`, writeErr);
      }
      await context.close().catch(() => { });
    }
  }

  console.log('🎉 รันครบทุกเคสแล้ว');
});

/*
 * SETUP:
 * ──────────────────────────────────────────────────────
 * 1. แก้ไข RUN_CREATE_BY บรรทัดด้านบนให้ตรงกับคอลัมน์ "Create By" ใน Google Sheet
 *
 * 2. ตรวจสอบว่า credentials/token.json พร้อมใช้งาน
 *    (ถ้า token หมดอายุ ให้รัน node refresh-token.js ก่อน)
 *
 * 3. ใน Google Sheet ตั้งค่า Test Status เป็น "Ready for Test" หรือ "Ready for Retest"
 *    และ Valid = TRUE, Create By = ค่าที่กำหนดใน RUN_CREATE_BY
 *
 * 4. รันคำสั่ง:
 *    cd playwright
 *    npx playwright test digital-sale/digital-sale-phase1-gsheet.spec.js --headed --workers=1
 *
 * Product ที่รองรับ (จาก linkProduct ใน Sheet):
 *   - /our-products/savings/first-love1810      → flow เลือกเพศ + กด ต่อไป + กรอกเบี้ย
 *   - /our-products/savings/save-and-protect888 → flow เลือกเพศ + กรอกทุน + เลือกโหมดชำระ
 *
 * Column ใน Google Sheet ที่จำเป็น:
 *   No, Env, Link_Product, Valid, Create By, Test Status
 *   เพศ/ประเภทเพศ, วันเดือนปีเกิด, เบี้ย/ทุนชดเชย, ทุน
 *   สัญชาติ, เลขบัตร, วันที่บัตรหมดอายุ
 *   คำนำหน้าลูกค้า, ชื่อลูกค้า, นามสกุลลูกค้า
 *   อีเมล, โทรศัพท์มือถือ, ส่วนสูง, น้ำหนัก
 *   สถานภาพ, อาชีพ, ลักษณะงานที่ทำ, รายได้ต่อปี
 *   ที่อยู่ตามทะเบียนบ้าน-เลขที่/จังหวัด/อำเภอ/ตำบล
 *   ที่อยู่ตามทะเบียนบ้าน-จังหวัด (ใช้เป็น birthPlace ใน FATCA ด้วย)
 * ──────────────────────────────────────────────────────
 */

// ═════════════════════════════════════════════════════════════════════════════
// Phase 5 — NBHQ QR Code Runner
// Automates NBS Steps 23–27 after QR payment has been confirmed externally.
//
// Prerequisite:
//   - Phase 1 (QR+PASS) wrote: Test Status = Inprogress, Result = 'Waiting Policy No',
//     เลขใบคำขอ = reference number
//   - Someone manually completed Steps 12–22 (receipt upload to NBS)
//   - Case status in NBHQ is now "ชำระครบ"
//
// Steps automated per case:
//   23 — search by เลขใบคำขอ → verify status = "ชำระครบ" (FAIL if not)
//   24 — click "ตรวจสอบข้อมูลเคสใหม่"
//   25 — scroll to bottom → click "ยืนยันตรวจสอบข้อมูล"
//   26 — verify success message
//   27 — navigate back → search again → extract เลขที่ กธ (policy number)
// ═════════════════════════════════════════════════════════════════════════════

// ─── Phase 5 Constants ────────────────────────────────────────────────────────

const NBS_URL = 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html';
const NBS_USER = 'MG0001';
const NBS_PASS = '1234';

// NBHQ navigation path:
// ระบบงานให้บริการ > ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่ (NBHQ) > จัดการข้อมูลเคสใหม่ > ตรวจสอบข้อมูลเคสใหม่
const MENU_PATH = [
  'ระบบงานให้บริการ',
  'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่',  // partial — ตรงกับ substring
  'จัดการข้อมูลเคสใหม่',
  'ตรวจสอบข้อมูลเคสใหม่',
];

// Policy number regex: เลขที่ กธ เช่น PA20000157, LS20000001
const POLICY_NO_REGEX = /[A-Z]{2,3}\d{7,10}/;

// ─── NBS Helpers ─────────────────────────────────────────────────────────────

/**
 * Login to NBS system
 * ใช้ Basic Auth ผ่าน httpCredentials (กัน browser auth dialog)
 * + กรอก form ถ้า NBS มี login form แยก
 *
 * Popup layers handled:
 *   1. page.on('dialog') — browser-native auth/confirm/alert dialogs (must register BEFORE goto)
 *   2. Captive portal / in-page proxy portal — detected by URL host mismatch after navigation
 *   3. httpCredentials (context-level) — handles WWW-Authenticate Basic/Digest (401)
 *   Note: httpCredentials does NOT cover NTLM/Kerberos/Proxy-Auth (407);
 *         those require the dialog handler + credentials-in-URL fallback below.
 */
async function loginNbs(page) {
  console.log(`🔐 NBS: กำลัง login ${NBS_URL}`);

  // ── Layer 1: register dialog handler BEFORE goto ──────────────────────────
  // Browser-native auth dialogs (Basic Auth challenge, proxy auth, confirm, alert)
  // fire synchronously during navigation — must be registered before page.goto()
  // so Playwright can intercept them instead of blocking the navigation indefinitely.
  page.on('dialog', async (dialog) => {
    const dialogType = dialog.type(); // 'alert' | 'confirm' | 'prompt' | 'beforeunload'
    const dialogMsg = dialog.message();
    console.log(`   🔔 Dialog intercepted — type: ${dialogType}, message: "${dialogMsg.substring(0, 120)}"`);
    try {
      if (dialogType === 'prompt') {
        // Network auth prompts sometimes appear as 'prompt' — try accepting with empty string
        // (credentials are already sent via httpCredentials context option)
        await dialog.accept('');
      } else {
        await dialog.accept();
      }
      console.log('   ✅ Dialog accepted');
    } catch (e) {
      console.warn(`   ⚠️ Dialog accept failed: ${e.message}`);
    }
  });

  await page.goto(NBS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
  await page.waitForTimeout(1500);

  // ── Layer 2: captive portal / proxy portal detection ─────────────────────
  // Corporate proxies / firewalls redirect to an in-page portal (different host)
  // before allowing access. Detect by checking if the current URL host differs
  // from the target NBS host — if so, look for and click an "allow" button.
  const currentUrl = page.url();
  const nbsHostname = 'uatnbs.thaisamut.co.th';
  try {
    const currentHostname = new URL(currentUrl).hostname;
    if (currentHostname !== nbsHostname && currentUrl !== 'about:blank') {
      console.warn(`   ⚠️ Redirected to proxy/captive portal: ${currentUrl}`);
      console.log('   🔍 กำลังมองหาปุ่ม "Allow" / "อนุญาต" / "ยืนยัน"...');

      // Try common Thai/English "allow network" button text patterns
      const allowPatterns = [
        /อนุญาต/i, /ยืนยัน/i, /allow/i, /proceed/i, /continue/i,
        /ตกลง/i, /ok$/i, /accept/i, /เข้าสู่ระบบ/i,
      ];
      let portalHandled = false;
      for (const pattern of allowPatterns) {
        const btn = page.getByRole('button', { name: pattern }).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click();
          console.log(`   ✅ คลิกปุ่ม portal: "${pattern}"`);
          await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
          await page.waitForTimeout(1500);
          portalHandled = true;
          break;
        }
        // Also check <a> and <input type="submit"> links
        const linkOrInput = page.locator(`a, input[type="submit"]`).filter({ hasText: pattern }).first();
        if (await linkOrInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await linkOrInput.click();
          console.log(`   ✅ คลิก link/input portal: "${pattern}"`);
          await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
          await page.waitForTimeout(1500);
          portalHandled = true;
          break;
        }
      }

      if (!portalHandled) {
        // Last resort: navigate directly to NBS with credentials embedded in URL
        // This bypasses some proxy auth challenges that httpCredentials misses (NTLM-lite)
        console.warn('   ⚠️ ไม่พบปุ่ม portal — ลอง navigate ตรงไป NBS อีกครั้ง');
        const nbsUrlWithCreds = NBS_URL.replace('https://', `https://${NBS_USER}:${NBS_PASS}@`);
        await page.goto(nbsUrlWithCreds, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(1500);
      }
    }
  } catch (urlParseErr) {
    console.warn(`   ⚠️ URL parse error: ${urlParseErr.message}`);
  }

  console.log(`   🌐 URL หลัง navigate: ${page.url()}`);

  // ตรวจว่ามี login form หรือไม่ (บางระบบ redirect ไป login page แยก)
  const usernameInput = page.locator('input[name="username"], input[name="name"], input[id="name"], input[type="text"][name*="user"], input[id*="user"], input[placeholder*="user" i]').first();
  const hasLoginForm = await usernameInput.isVisible({ timeout: 10000 }).catch(() => false);

  if (hasLoginForm) {
    await usernameInput.fill(NBS_USER);
    console.log(`   ✅ กรอก username: ${NBS_USER}`);

    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.fill(NBS_PASS);
    console.log('   ✅ กรอก password');

    // กด submit/login
    const loginBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("login"), button:has-text("เข้าสู่ระบบ"), button:has-text("Login")').first();
    if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginBtn.click();
      console.log('   ✅ กด Login button');
    } else {
      await page.keyboard.press('Enter');
      console.log('   ✅ กด Enter (fallback)');
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(2000);

    // รอ spinner หายหลัง login — ใช้ shared helper (เดียวกับที่ใช้หลัง menu click)
    await waitForNbsSpinner(page);

    console.log(`   ✅ Login สำเร็จ — URL: ${page.url()}`);
  } else {
    console.log('   ℹ️ ไม่พบ login form — อาจใช้ Basic Auth หรือ session ที่มีอยู่แล้ว');
  }
}

/**
 * รอให้ NBS spinner "กรุณารอสักครู่" หายไปจากหน้าจอ
 * ใช้หลัง login และหลังคลิกทุก menu item — spinner ปรากฏทุกครั้งที่มี page transition
 * timeout: 30s (เผื่อ NBS UAT ช้า)
 */
async function waitForNbsSpinner(page) {
  await page.waitForFunction(() => {
    const overlays = document.querySelectorAll('*');
    for (const el of overlays) {
      if (el.offsetParent !== null && (el.innerText || '').includes('กรุณารอสักครู่')) return false;
    }
    return true;
  }, { timeout: 30000 }).catch(() => {
    console.warn('   ⚠️ waitForNbsSpinner timeout 30s — เดินต่อ');
  });
}

/**
 * Navigate ผ่าน NBS sidebar/menu ตาม MENU_PATH
 * ใช้ text-matching แบบ partial (substring) เพื่อรองรับ whitespace และ line breaks
 * หลังคลิกทุก step: รอ spinner "กรุณารอสักครู่" หายก่อน — NBS fires spinner บน page transition
 */
async function navigateNbhqMenu(page) {
  console.log('📌 NBHQ: นำทางผ่านเมนู...');

  for (let i = 0; i < MENU_PATH.length; i++) {
    const menuText = MENU_PATH[i];
    console.log(`   Step ${i + 1}/${MENU_PATH.length}: คลิก "${menuText}"`);

    // ลองหาด้วยหลาย selector pattern — NBS อาจใช้ <a>, <li>, <span>, หรือ <div> เป็น menu item
    const candidates = [
      page.locator(`a:has-text("${menuText}")`).first(),
      page.locator(`li:has-text("${menuText}")`).first(),
      page.locator(`span:has-text("${menuText}")`).first(),
      page.locator(`div[role="menuitem"]:has-text("${menuText}")`).first(),
    ];

    // Steps 1–2 (i=0, i=1): menu items live inside a dropdown that must open first.
    // waitForSelector(state:'visible') can resolve on a hidden/pre-rendered <a> before the
    // dropdown actually opens → false-positive → click fires on invisible element → nothing happens.
    // Fix: waitForFunction polling <a> bounding box (width > 0 && height > 0) — guarantees the
    // element is truly painted and interactive before we attempt to click it.
    //
    // Steps 3–4 (i=2, i=3): already on a stable loaded page; combinedSelector race is fine.
    const visibilityTimeout = i === 0 ? 15000 : i === 2 ? 15000 : i === 3 ? 20000 : 8000;

    if (i < 2) {
      // Bounding-box wait — ensures <a> is visible AND has real layout dimensions
      await page.waitForFunction((text) => {
        return [...document.querySelectorAll('a')].some(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 &&
            (el.textContent || '').replace(/\s+/g, ' ').trim().includes(text);
        });
      }, menuText, { timeout: visibilityTimeout }).catch(() => { });
    } else {
      // Race ALL selector candidates in parallel — waitForSelector resolves as soon as ANY matches.
      const combinedSelector = [
        `a:has-text("${menuText}")`,
        `li:has-text("${menuText}")`,
        `span:has-text("${menuText}")`,
        `div[role="menuitem"]:has-text("${menuText}")`,
      ].join(', ');
      await page.waitForSelector(combinedSelector, { state: 'visible', timeout: visibilityTimeout })
        .catch(() => { }); // graceful — candidates loop below handles the "not found" case
    }

    let clicked = false;
    for (const loc of candidates) {
      if (i < 2) {
        // Steps 1–2: isVisible() can return true on pre-rendered hidden elements (CSS visible but
        // zero dimensions). Verify THIS specific loc instance has real pixel dimensions so we don't
        // fire a click on an off-screen/collapsed element.
        const hasRealSize = await loc.evaluate(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).catch(() => false);
        if (!hasRealSize) continue; // skip — not truly painted/interactive
      } else {
        // Steps 3–4: standard visibility check is sufficient (page is fully loaded)
        if (!await loc.isVisible({ timeout: 1000 }).catch(() => false)) continue;
      }
      await loc.scrollIntoViewIfNeeded().catch(() => { });
      await loc.click();
      clicked = true;
      console.log(`   ✅ คลิก "${menuText}" สำเร็จ`);
      break;
    }

    if (!clicked) {
      // Fallback: ใช้ evaluate เพื่อหา element ที่มี text ตรงกัน
      const evalClicked = await page.evaluate((text) => {
        const els = Array.from(document.querySelectorAll('a, li, span, button, div[role="menuitem"]'));
        const el = els.find(e =>
          e.offsetParent !== null &&
          (e.textContent || '').replace(/\s+/g, ' ').trim().includes(text)
        );
        if (el) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
        return false;
      }, menuText);

      if (evalClicked) {
        console.log(`   ✅ คลิก "${menuText}" ด้วย evaluate fallback`);
        clicked = true;
      } else {
        throw new Error(`❌ NBHQ menu: ไม่พบ menu item "${menuText}" บนหน้าจอ`);
      }
    }

    // รอ spinner หายหลังทุก menu click — NBS แสดง "กรุณารอสักครู่" บน page transition
    // Skip for i=2/i=3: NBS ไม่แสดง spinner หลัง sub-menu click; spinner ถูก drain แล้วหลัง i=1
    if (i !== 2 && i !== 3) {
      await waitForNbsSpinner(page);
    }

    // i=1 (Step 2): "ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่" — triggers full page navigation
    // Use waitForLoadState (not waitForNavigation) — navigation may already be complete by the
    // time waitForNavigation is registered, causing a race condition that hangs indefinitely.
    // waitForLoadState is idempotent: if page is already in the target state, it resolves immediately.
    if (i === 1) {
      console.log(`   ⏳ รอ page navigation หลัง Step 2 click (domcontentloaded, max 30s)...`);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {
        console.warn('   ⚠️ waitForLoadState timeout — เดินต่อ');
      });
      await waitForNbsSpinner(page);
    }

    // i=2 (Step 3): "จัดการข้อมูลเคสใหม่" — already on new page from Step 2; no navigation needed
    // Use state:'visible' (not 'attached') so next iteration's race-wait resolves immediately
    // when element is already on screen, avoiding a full visibilityTimeout burn.
    if (i === 2) {
      const nextMenuText = MENU_PATH[i + 1]; // "ตรวจสอบข้อมูลเคสใหม่"
      if (nextMenuText) {
        console.log(`   ⏳ รอ "${nextMenuText}" ปรากฏใน DOM (content-driven, max 60s)...`);
        // NBS ไม่มี iframe ใน Phase 5 navigation — ตรวจ page หลักเพียงอย่างเดียว
        await page.waitForSelector(
          `a:has-text("${nextMenuText}"), li:has-text("${nextMenuText}"), span:has-text("${nextMenuText}")`,
          { state: 'visible', timeout: 60000 }
        ).catch(() => {
          console.warn(`   ⚠️ content-driven wait timeout — "${nextMenuText}" ยังไม่ปรากฏ; เดินต่อแล้วให้ candidates loop จัดการ`);
        });
      }
    }
  }

  console.log('✅ นำทางเมนู NBHQ ครบแล้ว');
}

/**
 * Step 23: กรอกเลขใบคำขอในช่องค้นหา และกดค้นหา
 * คืน true ถ้าพบผลลัพธ์
 */
async function searchByApplicationNo(page, applicationNo) {
  console.log(`📌 Step 23: ค้นหา เลขใบคำขอ "${applicationNo}"`);

  // ── Step 23a: Clear "วันที่บันทึกใบคำขอ" from/to date fields ──────────────
  // ตรวจสอบจาก DOM จริง (uat-intranet-api.ochi.link/thaisamut/web/nbentry):
  //   date-from field: id="applicationStartDate", name="applicationStartDate", placeholder="จากวันที่"
  //   date-to   field: id="applicationEndDate",   name="applicationEndDate",   placeholder="ถึงวันที่"
  // ทั้งสอง field เป็น type="text" (ไม่ใช่ type="date") และมีค่า pre-filled (เช่น "08/04/2569")
  // ต้อง clear ก่อนกรอก applicationNo เพราะ date range จำกัดผลลัพธ์

  const clearDateField = async (loc, label) => {
    const visible = await loc.isVisible({ timeout: 2000 }).catch(() => false);
    if (!visible) { console.log(`   ⚠️ ${label}: ไม่พบหรือ hidden — ข้าม`); return; }
    try {
      // React MUI date picker: ต้อง click → Ctrl+A → Delete (repeat สำหรับ multi-segment)
      // ห้ามใช้ fill('') — React controlled input ไม่รับรู้ DOM change จาก fill
      await loc.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);
      // repeat สำหรับ multi-segment field (day/month/year แยก segment)
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);
      console.log(`   ✅ Clear ${label}`);
    } catch (err) {
      console.warn(`   ⚠️ clearDateField ${label} error: ${err.message}`);
    }
  };

  // date-from: id="applicationStartDate" (ยืนยันจาก DOM inspection)
  await clearDateField(
    page.locator('#applicationStartDate'),
    'วันที่บันทึกใบคำขอ (จากวันที่)'
  );

  // date-to: id="applicationEndDate" (ยืนยันจาก DOM inspection)
  await clearDateField(
    page.locator('#applicationEndDate'),
    'วันที่บันทึกใบคำขอ (ถึงวันที่)'
  );

  await page.waitForTimeout(500);

  // ── Step 23b: กรอก "เลขที่ใบคำขอ" ────────────────────────────────────────
  // ตรวจสอบจาก DOM จริง:
  //   id="applicationNo", name="" (empty — ทำให้ name*= selector ไม่ทำงาน!), type="text"
  //   placeholder="" (ว่าง), aria-label=null
  //   CSS class: MuiInputBase-input (React MUI component)
  // ต้องใช้ id="applicationNo" เท่านั้น — name selector และ placeholder selector ใช้ไม่ได้

  const searchInput = page.locator('#applicationNo');
  const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
  if (!searchVisible) {
    throw new Error(`❌ Step 23: ไม่พบ input#applicationNo บนหน้า ตรวจสอบข้อมูลเคสใหม่`);
  }

  await searchInput.clear().catch(() => { });
  await searchInput.fill(applicationNo);
  await page.waitForTimeout(500); // รอให้ React/MUI state sync หลัง fill ก่อนกดค้นหา
  console.log(`   ✅ กรอก เลขใบคำขอ: ${applicationNo} (selector: #applicationNo)`);

  // ── Step 23c: กดปุ่ม "ค้นหา" ─────────────────────────────────────────────
  // DOM inspection: button "ค้นหา" มี text content "ค้นหา" พร้อม inner generic element
  const searchBtn = page.locator('button:has-text("ค้นหา")').first();
  const btnVisible = await searchBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (btnVisible) {
    await searchBtn.click();
    console.log('   ✅ กดปุ่มค้นหา');
  } else {
    // fallback: Enter key ถ้าปุ่มหาไม่เจอ
    await page.keyboard.press('Enter');
    console.log('   ✅ กด Enter (fallback)');
  }

  // Phase 1: รอให้ spinner ปรากฏก่อน (popup อาจใช้เวลาสักครู่หลัง click)
  // ถ้า server ตอบเร็วและ spinner ไม่ปรากฏเลยก็ ok — catch ทิ้ง
  await page.waitForFunction(() => {
    return [...document.querySelectorAll('*')].some(
      el => el.offsetParent !== null && (el.innerText || '').includes('กรุณารอสักครู่')
    );
  }, { timeout: 3000 }).catch(() => { });

  // Phase 2: รอให้ spinner หายไปจากหน้าจอ (max 30s)
  await waitForNbsSpinner(page);

  // Phase 3: รอให้ตารางผลลัพธ์ render ก่อนอ่านค่า
  await page.waitForSelector('table tbody tr, .result-row, tr[data-id]', {
    state: 'attached',
    timeout: 15000,
  }).catch(() => { });
  await page.waitForTimeout(500); // buffer สำหรับ React render cycle

  return true;
}

/**
 * Step 23 (ต่อ): ตรวจสอบ status = "ชำระครบ" ในผลลัพธ์
 * throw Error ถ้าไม่พบหรือ status ไม่ใช่ "ชำระครบ"
 */
async function verifyStatusChampraKhrop(page, applicationNo) {
  const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`   🔎 body (500 chars): ${bodyText.substring(0, 500)}`);

  // ตรวจว่าพบเลขใบคำขอในผลลัพธ์หรือไม่
  if (!bodyText.includes(applicationNo)) {
    throw new Error(`❌ Step 23: ไม่พบเลขใบคำขอ "${applicationNo}" ในผลลัพธ์ค้นหา`);
  }

  // ตรวจ status ต้องเป็น "ชำระครบ"
  if (!bodyText.includes('ชำระครบ')) {
    // ดึง status จริงที่แสดงในหน้า
    const statusMatch = bodyText.match(/(?:สถานะ|Status)[^\n:]*[:：]?\s*([^\n]{1,50})/i);
    const actualStatus = statusMatch ? statusMatch[1].trim() : '(ไม่พบ status ในผลลัพธ์)';
    throw new Error(
      `❌ Step 23: สถานะไม่ใช่ "ชำระครบ" — สถานะจริง: "${actualStatus}"\n` +
      `   เลขใบคำขอ: ${applicationNo}\n` +
      `   กรุณารอให้ผู้รับผิดชอบทำ Steps 12–22 ให้ครบก่อน`
    );
  }

  console.log(`   ✅ Step 23: สถานะ = "ชำระครบ" ✓`);
}

/**
 * Step 24: คลิกปุ่ม "ตรวจสอบข้อมูลเคสใหม่"
 */
async function clickCheckNewCase(page) {
  console.log('📌 Step 24: คลิก "ตรวจสอบข้อมูลเคสใหม่"');

  const btnCandidates = [
    // title attribute — icon-only buttons carry no text; title is the stable identifier
    page.locator('[title="ตรวจสอบข้อมูลเคสใหม่"]').first(),
    // text-based fallbacks for buttons that DO render visible text
    page.locator('a:has-text("ตรวจสอบข้อมูลเคสใหม่"), button:has-text("ตรวจสอบข้อมูลเคสใหม่")').first(),
    page.locator('input[value*="ตรวจสอบข้อมูลเคสใหม่"]').first(),
  ];

  for (const loc of btnCandidates) {
    if (await loc.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loc.click();
      console.log('   ✅ คลิก "ตรวจสอบข้อมูลเคสใหม่" สำเร็จ');
      // Phase 1: wait for "กรุณารอสักครู่" spinner to appear (up to 3s)
      await page.waitForFunction(() =>
        [...document.querySelectorAll('*')].some(
          el => el.offsetParent !== null && (el.innerText || '').includes('กรุณารอสักครู่')
        ), { timeout: 3000 }
      ).catch(() => { });
      // Phase 2: wait for spinner to disappear
      await waitForNbsSpinner(page);
      return;
    }
  }

  // Fallback: evaluate text match
  const evalClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"]'));
    const el = els.find(e =>
      e.offsetParent !== null &&
      (
        (e.textContent || e.value || '').replace(/\s+/g, ' ').trim().includes('ตรวจสอบข้อมูลเคสใหม่') ||
        (e.getAttribute('title') || '').includes('ตรวจสอบข้อมูลเคสใหม่')
      )
    );
    if (el) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    return false;
  });

  if (!evalClicked) {
    throw new Error(`❌ Step 24: ไม่พบปุ่ม "ตรวจสอบข้อมูลเคสใหม่" บนหน้าจอ`);
  }

  console.log('   ✅ คลิก "ตรวจสอบข้อมูลเคสใหม่" ด้วย evaluate fallback');
  // Phase 1: wait for "กรุณารอสักครู่" spinner to appear (up to 3s)
  await page.waitForFunction(() =>
    [...document.querySelectorAll('*')].some(
      el => el.offsetParent !== null && (el.innerText || '').includes('กรุณารอสักครู่')
    ), { timeout: 3000 }
  ).catch(() => { });
  // Phase 2: wait for spinner to disappear
  await waitForNbsSpinner(page);
}

/**
 * Step 25: Scroll to bottom → คลิก "ยืนยันตรวจสอบข้อมูล"
 */
async function scrollAndConfirmCheck(page) {
  console.log('📌 Step 25: Scroll to bottom → คลิก "ยืนยันตรวจสอบข้อมูล"');

  // Scroll ไปที่ล่างสุดของหน้า
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  console.log('   ✅ Scroll to bottom');

  const btnCandidates = [
    page.locator('a:has-text("ยืนยันตรวจสอบข้อมูล"), button:has-text("ยืนยันตรวจสอบข้อมูล")').first(),
    page.locator('input[value*="ยืนยันตรวจสอบข้อมูล"]').first(),
  ];

  for (const loc of btnCandidates) {
    if (await loc.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loc.scrollIntoViewIfNeeded().catch(() => { });
      await loc.click();
      console.log('   ✅ คลิก "ยืนยันตรวจสอบข้อมูล" สำเร็จ');
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
      await page.waitForTimeout(2000);
      return;
    }
  }

  // Fallback: evaluate text match
  const evalClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"]'));
    const el = els.find(e =>
      e.offsetParent !== null &&
      (e.textContent || e.value || '').replace(/\s+/g, ' ').trim().includes('ยืนยันตรวจสอบข้อมูล')
    );
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    return false;
  });

  if (!evalClicked) {
    throw new Error(`❌ Step 25: ไม่พบปุ่ม "ยืนยันตรวจสอบข้อมูล" บนหน้าจอ`);
  }

  console.log('   ✅ คลิก "ยืนยันตรวจสอบข้อมูล" ด้วย evaluate fallback');
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
  await page.waitForTimeout(2000);
}

/**
 * logoutNbs: Logout จาก NBS ไม่ว่าจะ login เป็น user ใด
 * รองรับทั้ง link text "ออกจากระบบ" และ href*="logout"
 */
async function logoutNbs(page) {
  console.log('🔓 NBS: Logout...');

  // DOM inspection (2026-05-22): logout element is
  //   <a class="user-action" href="javascript:APP.commands.logout('/nbsweb/secure/logout.html')">ออกจากระบบ</a>
  // APP.commands.logout calls confirm('ต้องการออกจากระบบ?') synchronously before navigating.
  //
  // Use page.on() (persistent) not page.once() — the confirm fires synchronously inside the
  // javascript: href execution, which can race with once() de-registration during locator checks.
  const confirmHandler = async (dialog) => {
    try {
      if (dialog.type() === 'confirm' || dialog.type() === 'alert') {
        await dialog.accept();
      }
    } catch (_) { }
  };
  page.on('dialog', confirmHandler);

  // Primary: a.user-action (confirmed class from DOM inspection) — most specific
  // Fallback chain: href*=logout (javascript: href contains "logout"), then text-based
  const logoutCandidates = [
    page.locator('a.user-action:has-text("ออกจากระบบ")').first(),
    page.locator('a[href*="logout"]').first(),
    page.locator('a:has-text("ออกจากระบบ")').first(),
    page.locator('button:has-text("ออกจากระบบ")').first(),
    page.locator('i[title="ออกจากระบบ"]').first(),
  ];

  for (const loc of logoutCandidates) {
    const isVis = await loc.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVis) {
      await loc.click();
      await page.locator('div[aria-labelledby="confirmation-dialog-title"]').locator('button:has-text("ตกลง")').click().catch(() => { });
      console.log('   ✅ คลิก logout link/button');
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
      await page.waitForTimeout(1500);
      page.off('dialog', confirmHandler);
      return;
    }
  }

  // Fallback: evaluate — dispatchEvent to bypass offsetParent visibility requirement
  const evalLoggedOut = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('a, button')).find(e =>
      (e.textContent || '').replace(/\s+/g, ' ').trim().includes('ออกจากระบบ') ||
      (e.getAttribute('href') || '').toLowerCase().includes('logout')
    );
    if (el) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    return false;
  });

  if (evalLoggedOut) {
    console.log('   ✅ Logout ด้วย evaluate fallback');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(1500);
  } else {
    console.warn('   ⚠️ ไม่พบปุ่ม logout — navigate ไป home แล้วล็อก session ใหม่');
    // Navigate back to NBS home — session จะถูก re-set เมื่อ loginNbs ถูกเรียก
    await page.goto(NBS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
    await page.waitForTimeout(1500);
  }

  page.off('dialog', confirmHandler);
}

/**
 * loginNbsAs: Login NBS ด้วย credentials ที่กำหนด (generic — ใช้ร่วมกันได้กับทุก account)
 * ต่างจาก loginNbs ตรงที่รับ user/pass เป็น parameter แทนการใช้ NBS_USER/NBS_PASS โดยตรง
 */
async function loginNbsAs(page, username, password) {
  console.log(`🔐 NBS: Login เป็น "${username}"...`);

  // register dialog handler BEFORE goto (เหมือน loginNbs)
  // ถ้า handler ลงทะเบียนแล้ว (เช่น เรียก loginNbs ก่อน) จะซ้อนทับกันโดยไม่มีปัญหา
  page.on('dialog', async (dialog) => {
    try {
      await dialog.type() === 'prompt' ? dialog.accept('') : dialog.accept();
    } catch (_) { }
  });

  await page.goto(NBS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
  await page.waitForTimeout(1500);

  const usernameInput = page.locator(
    'input[name="username"], input[name="name"], input[id="name"], input[type="text"][name*="user"], input[id*="user"], input[placeholder*="user" i]'
  ).first();
  const hasLoginForm = await usernameInput.isVisible({ timeout: 10000 }).catch(() => false);

  if (hasLoginForm) {
    await usernameInput.fill(username);
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.fill(password);

    const loginBtn = page.locator(
      'button[type="submit"], input[type="submit"], button:has-text("login"), button:has-text("เข้าสู่ระบบ"), button:has-text("Login")'
    ).first();
    if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(2000);
    await waitForNbsSpinner(page);
    console.log(`   ✅ Login เป็น "${username}" สำเร็จ`);
  } else {
    console.log(`   ℹ️ ไม่พบ login form — อาจใช้ session/Basic Auth อยู่แล้ว`);
  }
}

/**
 * unlockApplicationCase: ปลดล็อค เลขใบคำขอ ที่ถูก lock โดยผู้ใช้อื่น
 *
 * สาเหตุที่ต้องใช้: หลัง click "ยืนยันตรวจสอบข้อมูล" ระบบแสดง popup
 * "รายการเลขใบคำขอนี้กำลังถูกใช้งานโดยผู้ใช้งานท่านอื่น กรุณาทำรายการใหม่ภายหลัง"
 *
 * ขั้นตอน:
 *   1. ปิด popup
 *   2. Logout
 *   3. Login ด้วย boss account (boss/0)
 *   4. ไปเมนู ระบบงานให้บริการ → ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่
 *   5. คลิก "ดูแลระบบ"
 *   6. คลิก "Manual Batch Process"
 *   7. กรอก applicationNo ในช่อง "Manual : ปลดล็อคใบคำขอ (Concurrent)"
 *   8. คลิกปุ่มปลดล็อค
 *   9. Logout boss → Login กลับเป็น MG0001
 */
async function unlockApplicationCase(page, applicationNo) {
  console.log(`🔓 unlockApplicationCase: ปลดล็อค เลขใบคำขอ "${applicationNo}"...`);

  // ── Step 1: ปิด locked popup ──────────────────────────────────────────────
  // popup แสดงข้อความ "กำลังถูกใช้งานโดยผู้ใช้งานท่านอื่น" — ปิดด้วยปุ่ม OK/ปิด/ยืนยัน
  await page.waitForTimeout(500);
  const closeCandidates = [
    page.locator('button:has-text("ตกลง"), button:has-text("OK"), button:has-text("ปิด"), button:has-text("ยืนยัน")').first(),
    page.locator('.modal button, .dialog button, [role="dialog"] button').first(),
    page.locator('[data-dismiss="modal"], [aria-label="Close"], button.close').first(),
  ];
  let popupClosed = false;
  for (const loc of closeCandidates) {
    if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loc.click();
      console.log('   ✅ ปิด locked popup แล้ว');
      await page.waitForTimeout(800);
      popupClosed = true;
      break;
    }
  }
  if (!popupClosed) {
    // Fallback: evaluate — หาปุ่มที่ visible ในทุก modal/dialog
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [data-dismiss]'));
      const dismissBtn = btns.find(b =>
        b.offsetParent !== null &&
        /ตกลง|OK|ปิด|ยืนยัน|Close|close/i.test((b.textContent || b.getAttribute('aria-label') || '').trim())
      );
      if (dismissBtn) dismissBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }).catch(() => { });
    await page.waitForTimeout(800);
    console.log('   ℹ️ ใช้ evaluate fallback ปิด popup');
  }
  await waitForNbsSpinner(page);

  // ── Step 2: Logout ────────────────────────────────────────────────────────
  await logoutNbs(page);

  // ── Step 3: Login ด้วย boss account ──────────────────────────────────────
  const BOSS_USER = 'boss';
  const BOSS_PASS = '0';
  await loginNbsAs(page, BOSS_USER, BOSS_PASS);

  // ── Steps 4a–4b: ระบบงานให้บริการ → ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่ ─
  // ใช้ bounding-box wait pattern เดียวกับ navigateNbhqMenu (i < 2)
  const BOSS_MENU_STEPS = [
    'ระบบงานให้บริการ',
    'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่',
    'ดูแลระบบ',
    'Manual Batch Process',
  ];

  for (let i = 0; i < BOSS_MENU_STEPS.length; i++) {
    const menuText = BOSS_MENU_STEPS[i];
    console.log(`   Step ${i + 1}/${BOSS_MENU_STEPS.length}: คลิก "${menuText}"`);

    // ลองหาด้วยหลาย selector pattern — NBS อาจใช้ <a>, <li>, <span>, หรือ <div> เป็น menu item
    const candidates = [
      page.locator(`a:has-text("${menuText}")`).first(),
      page.locator(`li:has-text("${menuText}")`).first(),
      page.locator(`span:has-text("${menuText}")`).first(),
      page.locator(`div[role="menuitem"]:has-text("${menuText}")`).first(),
    ];

    // Steps 1–2 (i=0, i=1): menu items live inside a dropdown that must open first.
    // waitForSelector(state:'visible') can resolve on a hidden/pre-rendered <a> before the
    // dropdown actually opens → false-positive → click fires on invisible element → nothing happens.
    // Fix: waitForFunction polling <a> bounding box (width > 0 && height > 0) — guarantees the
    // element is truly painted and interactive before we attempt to click it.
    //
    // Steps 3–4 (i=2, i=3): already on a stable loaded page; combinedSelector race is fine.
    const visibilityTimeout = i === 0 ? 15000 : i === 2 ? 15000 : i === 3 ? 20000 : 8000;

    if (i < 2) {
      // Bounding-box wait — ensures <a> is visible AND has real layout dimensions
      await page.waitForFunction((text) => {
        return [...document.querySelectorAll('a')].some(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 &&
            (el.textContent || '').replace(/\s+/g, ' ').trim().includes(text);
        });
      }, menuText, { timeout: visibilityTimeout }).catch(() => { });
    } else {
      // Race ALL selector candidates in parallel — waitForSelector resolves as soon as ANY matches.
      const combinedSelector = [
        `a:has-text("${menuText}")`,
        `li:has-text("${menuText}")`,
        `span:has-text("${menuText}")`,
        `div[role="menuitem"]:has-text("${menuText}")`,
      ].join(', ');
      await page.waitForSelector(combinedSelector, { state: 'visible', timeout: visibilityTimeout })
        .catch(() => { }); // graceful — candidates loop below handles the "not found" case
    }

    let clicked = false;
    for (const loc of candidates) {
      if (i < 2) {
        // Steps 1–2: isVisible() can return true on pre-rendered hidden elements (CSS visible but
        // zero dimensions). Verify THIS specific loc instance has real pixel dimensions so we don't
        // fire a click on an off-screen/collapsed element.
        const hasRealSize = await loc.evaluate(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).catch(() => false);
        if (!hasRealSize) continue; // skip — not truly painted/interactive
      } else {
        // Steps 3–4: standard visibility check is sufficient (page is fully loaded)
        if (!await loc.isVisible({ timeout: 1000 }).catch(() => false)) continue;
      }
      await loc.scrollIntoViewIfNeeded().catch(() => { });
      await loc.click();
      clicked = true;
      console.log(`   ✅ คลิก "${menuText}" สำเร็จ`);
      break;
    }

    if (!clicked) {
      // Fallback: ใช้ evaluate เพื่อหา element ที่มี text ตรงกัน
      const evalClicked = await page.evaluate((text) => {
        const els = Array.from(document.querySelectorAll('a, li, span, button, div[role="menuitem"]'));
        const el = els.find(e =>
          e.offsetParent !== null &&
          (e.textContent || '').replace(/\s+/g, ' ').trim().includes(text)
        );
        if (el) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
        return false;
      }, menuText);

      if (evalClicked) {
        console.log(`   ✅ คลิก "${menuText}" ด้วย evaluate fallback`);
        clicked = true;
      } else {
        throw new Error(`❌ NBHQ menu: ไม่พบ menu item "${menuText}" บนหน้าจอ`);
      }
    }

    // รอ spinner หายหลังทุก menu click — NBS แสดง "กรุณารอสักครู่" บน page transition
    // Skip for i=2/i=3: NBS ไม่แสดง spinner หลัง sub-menu click; spinner ถูก drain แล้วหลัง i=1
    if (i !== 2 && i !== 3) {
      await waitForNbsSpinner(page);
    }

    // i=1 (Step 2): "ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่" — triggers full page navigation
    // Use waitForLoadState (not waitForNavigation) — navigation may already be complete by the
    // time waitForNavigation is registered, causing a race condition that hangs indefinitely.
    // waitForLoadState is idempotent: if page is already in the target state, it resolves immediately.
    if (i === 1) {
      console.log(`   ⏳ รอ page navigation หลัง Step 2 click (domcontentloaded, max 30s)...`);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {
        console.warn('   ⚠️ waitForLoadState timeout — เดินต่อ');
      });
      await waitForNbsSpinner(page);
    }

    // i=2 (Step 3): "จัดการข้อมูลเคสใหม่" — already on new page from Step 2; no navigation needed
    // Use state:'visible' (not 'attached') so next iteration's race-wait resolves immediately
    // when element is already on screen, avoiding a full visibilityTimeout burn.
    if (i === 2) {
      const nextMenuText = BOSS_MENU_STEPS[i + 1]; // "ตรวจสอบข้อมูลเคสใหม่"
      if (nextMenuText) {
        console.log(`   ⏳ รอ "${nextMenuText}" ปรากฏใน DOM (content-driven, max 60s)...`);
        // NBS ไม่มี iframe ใน Phase 5 navigation — ตรวจ page หลักเพียงอย่างเดียว
        await page.waitForSelector(
          `a:has-text("${nextMenuText}"), li:has-text("${nextMenuText}"), span:has-text("${nextMenuText}")`,
          { state: 'visible', timeout: 60000 }
        ).catch(() => {
          console.warn(`   ⚠️ content-driven wait timeout — "${nextMenuText}" ยังไม่ปรากฏ; เดินต่อแล้วให้ candidates loop จัดการ`);
        });
      }
    }
  }

  // ── Step 7: กรอก applicationNo ในช่อง "ปลดล็อคใบคำขอ (Concurrent)" ───────
  // หน้า Manual Batch Process มีหลาย section — ต้องหา section ที่มีข้อความ
  // "Manual : ปลดล็อคใบคำขอ (Concurrent)" แล้วหา input ภายใน section นั้น
  console.log(`   📌 Boss Step 7: กรอก เลขใบคำขอ "${applicationNo}" ในช่อง ปลดล็อค`);

  // รอ section "ปลดล็อคใบคำขอ" ปรากฏก่อน
  await page.waitForFunction(() => {
    return document.body.innerText.includes('ปลดล็อคใบคำขอ');
  }, { timeout: 15000 }).catch(() => {
    console.warn('   ⚠️ ไม่พบ section "ปลดล็อคใบคำขอ" ใน Manual Batch Process');
  });

  // หา input ใน section ปลดล็อค — ลอง selector หลายแบบตามลำดับ
  // Best-effort: หา input ที่อยู่ใน section มีข้อความ "ปลดล็อค"
  let unlockInputFilled = false;

  // Pattern 1: หา section element ก่อน แล้ว scope input ภายใน
  const unlockSectionLoc = page.locator(
    'div:has-text("ปลดล็อคใบคำขอ"), fieldset:has-text("ปลดล็อคใบคำขอ"), section:has-text("ปลดล็อคใบคำขอ"), tr:has-text("ปลดล็อคใบคำขอ"), td:has-text("ปลดล็อคใบคำขอ")'
  ).last(); // ใช้ last() เพื่อจับ section ที่ลึกที่สุด (ใกล้ input มากสุด)

  const sectionVisible = await unlockSectionLoc.isVisible({ timeout: 5000 }).catch(() => false);
  if (sectionVisible) {
    const inputInSection = unlockSectionLoc.locator('input[type="text"], input:not([type]), input[type="number"]').first();
    if (await inputInSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      // React MUI pattern: click → fill → dispatchEvent
      await inputInSection.click();
      await inputInSection.fill('');
      await inputInSection.pressSequentially(applicationNo, { delay: 30 });
      await inputInSection.dispatchEvent('change');
      unlockInputFilled = true;
      console.log(`   ✅ กรอก "${applicationNo}" ใน input ของ section ปลดล็อค`);
    }
  }

  if (!unlockInputFilled) {
    // Pattern 2: evaluate — หา input ที่อยู่ใกล้ label "ปลดล็อค" ใน DOM
    unlockInputFilled = await page.evaluate((appNo) => {
      // หา label/cell ที่มีข้อความ "ปลดล็อค" หรือ "Concurrent"
      const allEls = Array.from(document.querySelectorAll('*'));
      const labelEl = allEls.find(el =>
        el.children.length === 0 &&  // leaf node
        (el.textContent || '').includes('ปลดล็อค') &&
        el.offsetParent !== null
      );
      if (!labelEl) return false;
      // หา input ใน parent chain (สูงสุด 5 ระดับ)
      let container = labelEl.parentElement;
      for (let depth = 0; depth < 5; depth++) {
        if (!container) break;
        const inp = container.querySelector('input[type="text"], input:not([type]), input[type="number"]');
        if (inp && inp.offsetParent !== null) {
          inp.focus();
          inp.value = appNo;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
          return true;
        }
        container = container.parentElement;
      }
      return false;
    }, applicationNo);
    if (unlockInputFilled) {
      console.log(`   ✅ กรอก "${applicationNo}" ด้วย evaluate (label-proximity pattern)`);
    } else {
      console.warn(`   ⚠️ ไม่พบ input field สำหรับปลดล็อค — อาจต้องตรวจสอบ selector`);
    }
  }

  // ── Step 8: คลิกปุ่มปลดล็อค ──────────────────────────────────────────────
  console.log('   📌 Boss Step 8: คลิกปุ่มปลดล็อค');
  await page.waitForTimeout(500);

  // ลอง selector ตามลำดับ: "ปลดล็อค", "Submit", "Execute", "ดำเนินการ"
  const unlockBtnCandidates = [
    page.locator('button:has-text("ปลดล็อค"), input[value*="ปลดล็อค"]').first(),
    page.locator('button:has-text("Submit"), input[value="Submit"]').first(),
    page.locator('button:has-text("Execute"), input[value="Execute"]').first(),
    page.locator('button:has-text("ดำเนินการ")').first(),
    page.locator('button[type="submit"]').first(),
  ];

  let unlockBtnClicked = false;
  for (const btnLoc of unlockBtnCandidates) {
    if (await btnLoc.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnLoc.scrollIntoViewIfNeeded().catch(() => { });
      await btnLoc.click();
      unlockBtnClicked = true;
      console.log('   ✅ คลิกปุ่มปลดล็อค สำเร็จ');
      break;
    }
  }

  if (!unlockBtnClicked) {
    // Evaluate fallback: หาปุ่มใน section ปลดล็อคที่ใกล้กับ input ที่เพิ่งกรอก
    await page.evaluate((appNo) => {
      const allBtns = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      // ลอง match text ก่อน
      const byText = allBtns.find(b =>
        b.offsetParent !== null &&
        /ปลดล็อค|Submit|Execute|ดำเนินการ/i.test((b.textContent || b.value || '').trim())
      );
      if (byText) { byText.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      // fallback: หา submit button ใน section "ปลดล็อค"
      const labelEl = Array.from(document.querySelectorAll('*')).find(el =>
        el.children.length === 0 && (el.textContent || '').includes('ปลดล็อค') && el.offsetParent !== null
      );
      if (labelEl) {
        let container = labelEl.parentElement;
        for (let d = 0; d < 6; d++) {
          if (!container) break;
          const btn = container.querySelector('button, input[type="submit"]');
          if (btn && btn.offsetParent !== null) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return true;
          }
          container = container.parentElement;
        }
      }
      return false;
    }, applicationNo);
    console.log('   ℹ️ คลิกปุ่มปลดล็อคด้วย evaluate fallback');
  }

  await waitForNbsSpinner(page);
  await page.waitForTimeout(1000);

  // ตรวจว่าปลดล็อคสำเร็จ (optional — แค่ log ไม่ throw เพราะ success message ต่างกันตาม NBS version)
  const unlockBodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`   🔎 Unlock result (200 chars): ${unlockBodyText.substring(0, 200)}`);

  // ── Step 9a: Logout boss ──────────────────────────────────────────────────
  await logoutNbs(page);

  // ── Step 9b: Login กลับเป็น MG0001 ───────────────────────────────────────
  await loginNbsAs(page, NBS_USER, NBS_PASS);
  console.log(`✅ unlockApplicationCase เสร็จสิ้น — กลับมาเป็น ${NBS_USER} แล้ว`);
}

/**
 * Step 26: ตรวจสอบ success message หลัง "ยืนยันตรวจสอบข้อมูล"
 * ถ้าพบ locked popup ("กำลังถูกใช้งานโดยผู้ใช้งานท่านอื่น") → ปลดล็อคแล้ว retry Steps 4–26
 * throw Error ถ้าไม่พบ success message ใด ๆ
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} applicationNo - เลขใบคำขอ (ใช้สำหรับ unlock flow)
 */
async function verifySuccessMessage(page, applicationNo = '') {
  console.log('📌 Step 26: ตรวจสอบ success message');

  await page.waitForTimeout(500);

  // Step 1: Read body text FIRST before touching any buttons
  const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
  console.log(`   🔎 body (300 chars): ${bodyText.substring(0, 300)}`);

  // Step 2: Check for locked case IMMEDIATELY
  if (bodyText.includes('กำลังถูกใช้งานโดยผู้ใช้งานท่านอื่น')) {
    console.warn(`   ⚠️ Step 26: Case locked — กด ตกลง เพื่อปิด popup`);
    if (!applicationNo) {
      throw new Error(
        `❌ Step 26: Case ถูก lock — ไม่มี applicationNo สำหรับ unlock flow\n` +
        `   Body: ${bodyText.substring(0, 300)}`
      );
    }
    // Click ตกลง to dismiss the locked popup
    // DOM inspection confirmed: MUI v4 Dialog renders in a React Portal at document.body root.
    // The ตกลง button is inside .MuiDialogActions-root > div > button (MuiButton-contained, no id).
    // Selector strategy: target the button inside MuiDialogActions specifically to avoid
    // matching other ตกลง buttons elsewhere; use { force: true } to bypass MuiBackdrop overlay.
    const okBtn = page.locator('.MuiDialogActions-root button').first();
    await okBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
    await okBtn.click({ force: true }).catch(async () => {
      // Fallback: JS click via evaluate in case Playwright cannot pierce the backdrop
      await page.evaluate(() => {
        const actions = document.querySelector('.MuiDialogActions-root');
        const btn = actions && actions.querySelector('button');
        if (btn) btn.click();
      }).catch(() => { });
    });
    // 2-phase spinner wait: รอ "กรุณารอสักครู่" ปรากฏ (max 3s) แล้วรอ spinner หาย
    await page.waitForFunction(() =>
      [...document.querySelectorAll('*')].some(
        el => el.offsetParent !== null && (el.innerText || '').includes('กรุณารอสักครู่')
      ), { timeout: 3000 }
    ).catch(() => { });
    await waitForNbsSpinner(page);
    // Proceed to unlock flow
    await unlockApplicationCase(page, applicationNo);

    // Retry Steps 4–26: navigate ไปหน้า NBHQ ใหม่แล้ว ค้นหา → click → confirm → verify
    console.log('   🔁 Retry: กลับ Steps 4–26 หลัง unlock...');
    await navigateNbhqMenu(page);
    await searchByApplicationNo(page, applicationNo);
    await verifyStatusChampraKhrop(page, applicationNo);
    await clickCheckNewCase(page);
    await scrollAndConfirmCheck(page);

    // Verify รอบที่ 2 — ถ้า lock ซ้ำอีกรอบ = throw ทันที (ป้องกัน infinite loop)
    const retryBodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    console.log(`   🔎 Retry body (300 chars): ${retryBodyText.substring(0, 300)}`);

    if (retryBodyText.includes('กำลังถูกใช้งานโดยผู้ใช้งานท่านอื่น')) {
      throw new Error(
        `❌ Step 26: Case "${applicationNo}" ยังถูก lock หลัง unlock flow — หยุดรัน\n` +
        `   Body: ${retryBodyText.substring(0, 300)}`
      );
    }

    // ตรวจ success บน retry body
    const successPatterns = [
      /บันทึก.*สำเร็จ/i,
      /ดำเนินการ.*สำเร็จ/i,
      /ยืนยัน.*สำเร็จ/i,
      /success/i,
      /เรียบร้อย/i,
      /ตรวจสอบ.*เรียบร้อย/i,
    ];
    if (successPatterns.some(p => p.test(retryBodyText))) {
      const matchedPattern = successPatterns.find(p => p.test(retryBodyText));
      console.log(`   ✅ Step 26 (retry): พบ success message (pattern: ${matchedPattern})`);
      return;
    }
    throw new Error(
      `❌ Step 26 (retry): ไม่พบ success message หลัง unlock + retry\n` +
      `   Body: ${retryBodyText.substring(0, 300)}`
    );
  }

  // Step 3: Normal confirmation popup (not locked) — click ยืนยัน if visible
  const confirmBtn = page.locator('button:has-text("ยืนยัน"), [title="ยืนยัน"], button:has-text("ตกลง"), button:has-text("OK")').first();
  const hasConfirm = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (hasConfirm) {
    console.log('   ℹ️ Step 26: พบ confirmation popup → คลิกยืนยัน');
    await confirmBtn.click();
    // Wait for spinner if it appears after confirm
    await page.waitForFunction(() =>
      [...document.querySelectorAll('*')].some(
        el => el.offsetParent !== null && (el.innerText || '').includes('กรุณารอสักครู่')
      ), { timeout: 3000 }
    ).catch(() => { });
    await waitForNbsSpinner(page);
  }

  // Step 4: NBS success indicators — ขึ้นอยู่กับ system ที่ใช้
  const successPatterns = [
    /บันทึก.*สำเร็จ/i,
    /ดำเนินการ.*สำเร็จ/i,
    /ยืนยัน.*สำเร็จ/i,
    /success/i,
    /เรียบร้อย/i,
    /ตรวจสอบ.*เรียบร้อย/i,
  ];

  const hasSuccess = successPatterns.some(p => p.test(bodyText));

  // ตรวจ alert/dialog ด้วย (บางระบบแสดงผลผ่าน alert box)
  if (!hasSuccess) {
    // ลองดูจาก visible alert/notification elements
    const alertText = await page.locator('.alert, .success, [class*="success"], [class*="alert"], .modal').first()
      .innerText({ timeout: 2000 }).catch(() => '');
    if (alertText) {
      const alertHasSuccess = successPatterns.some(p => p.test(alertText));
      if (alertHasSuccess) {
        console.log(`   ✅ Step 26: พบ success message ใน alert element: "${alertText.substring(0, 100)}"`);
        return;
      }
    }

    throw new Error(
      `❌ Step 26: ไม่พบ success message หลัง "ยืนยันตรวจสอบข้อมูล"\n` +
      `   Body (300 chars): ${bodyText.substring(0, 300)}`
    );
  }

  const matchedPattern = successPatterns.find(p => p.test(bodyText));
  console.log(`   ✅ Step 26: พบ success message (pattern: ${matchedPattern})`);
}

/**
 * Step 27: navigate กลับไปหน้า NBHQ search → ค้นหา เลขใบคำขอ อีกครั้ง
 * → extract เลขที่ กธ (policy number)
 */
async function extractPolicyNo(page, applicationNo) {
  console.log(`📌 Step 27: กลับหน้า NBHQ search → ดึง เลขที่ กธ`);

  // navigate back ไปหน้าค้นหา NBHQ
  // ลอง browser back ก่อน — ถ้าไม่ได้ ให้ navigate ผ่านเมนูใหม่
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(async () => {
    console.log('   ⚠️ goBack ไม่ได้ — navigate ผ่านเมนูใหม่');
    await navigateNbhqMenu(page);
  });

  await page.waitForTimeout(1500);

  // ค้นหาด้วย applicationNo อีกครั้ง
  await searchByApplicationNo(page, applicationNo);

  // ดึง policy number จากผลลัพธ์
  const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  console.log(`   🔎 body (500 chars): ${bodyText.substring(0, 500)}`);

  // ลอง POLICY_NO_REGEX ก่อน (เช่น PA20000157, LS20000001)
  const policyMatch = bodyText.match(POLICY_NO_REGEX);
  if (policyMatch) {
    const policyNo = policyMatch[0];
    console.log(`   ✅ Step 27: เลขที่ กธ = "${policyNo}"`);
    return policyNo;
  }

  // Fallback: หา label "กธ" หรือ "กรมธรรม์" แล้วอ่านค่าถัดไป
  const policyLabelMatch = bodyText.match(/(?:เลขที่\s*กธ|กรมธรรม์)[^\d]*(\S{5,20})/i);
  if (policyLabelMatch) {
    const policyNo = policyLabelMatch[1].trim();
    console.log(`   ✅ Step 27: เลขที่ กธ (label match) = "${policyNo}"`);
    return policyNo;
  }

  // ถ้าหาไม่เจอ — log warning แต่ไม่ throw (อาจระบบยังไม่ออกเลขกรมธรรม์)
  console.warn(`   ⚠️ Step 27: ไม่พบ เลขที่ กธ ในผลลัพธ์ — จะเขียน sheet โดยไม่มี เลขกรมธรรม์`);
  return '';
}

// ─── Phase 5 Flow (per case) ──────────────────────────────────────────────────

/**
 * runNbhqFlow: รัน Steps 23–27 สำหรับ 1 case
 * คืน { policyNo } ถ้าสำเร็จ, throw Error ถ้า FAIL
 */
async function runNbhqFlow(page, applicationNo) {
  // Login
  await loginNbs(page);

  // Navigate ไปหน้า NBHQ
  await navigateNbhqMenu(page);

  // Step 23: ค้นหา + ตรวจสถานะ
  await searchByApplicationNo(page, applicationNo);
  await verifyStatusChampraKhrop(page, applicationNo);

  // Step 24: คลิก "ตรวจสอบข้อมูลเคสใหม่"
  await clickCheckNewCase(page);

  // Step 25: Scroll → คลิก "ยืนยันตรวจสอบข้อมูล"
  await scrollAndConfirmCheck(page);

  // Step 26: ตรวจ success message (ส่ง applicationNo เพื่อรองรับ unlock flow ถ้า case ถูก lock)
  await verifySuccessMessage(page, applicationNo);

  // Step 27: กลับ → ค้นหา → ดึง เลขที่ กธ
  const policyNo = await extractPolicyNo(page, applicationNo);

  return { policyNo };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 Test — NBHQ QR Code Runner (runs independently from Phase 1)
// ─────────────────────────────────────────────────────────────────────────────

test('NBHQ — QR Code Runner', async ({ browser }) => {
  test.setTimeout(0);

  // ── Fetch cases (Condition B: crash recovery / standalone run) ────────────
  const allCases = await fetchNbhqRunnableCases(RUN_CREATE_BY);

  if (!allCases.length) {
    console.log('🎉 ไม่มีเคสให้รัน Phase 5 NBHQ');
    console.log(`   (ตรวจสอบ: Valid=TRUE, Create By="${RUN_CREATE_BY}", Test Status=Inprogress, Result=Waiting Policy No, เลขใบคำขอ ไม่ว่าง)`);
    return;
  }

  console.log(`📋 พบ ${allCases.length} เคสสำหรับ Phase 5 NBHQ: ${allCases.map(c => `No ${c.no} (${c.applicationNo})`).join(', ')}`);

  // ── Process each case ──────────────────────────────────────────────────────
  let idx = 0;
  for (const caseData of allCases) {
    idx++;
    const { no, applicationNo, cusName } = caseData;

    console.log(`\n${'━'.repeat(55)}`);
    console.log(`🚀 [${idx}/${allCases.length}] No ${no} | เลขใบคำขอ ${applicationNo} | ${cusName}`);
    console.log('━'.repeat(55));

    // Confirm case ยังตรงเงื่อนไข (ป้องกัน runner อื่นประมวลผลไปแล้ว)
    const claimed = await claimNbhqCase(no, RUN_CREATE_BY);
    if (!claimed) {
      console.log(`⏭️ ข้าม No ${no} — ไม่สามารถ claim ได้ (case อาจถูกประมวลผลไปแล้ว)`);
      continue;
    }

    // เปิด browser context ใหม่ต่อ case — แยก session / cookies
    // ใช้ httpCredentials เพื่อ handle browser Basic Auth dialog ของ NBS อัตโนมัติ
    // ignoreHTTPSErrors: true — ข้าม SSL certificate interstitial ของ UAT intranet site
    //   (หน้า "allow network" / "Your connection is not private" ที่ block อัตโนมัติ)
    const context = await browser.newContext({
      httpCredentials: { username: NBS_USER, password: NBS_PASS },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    let status = 'FAIL';
    let remark = '';
    let policyNo = '';
    const startTime = Date.now();

    try {
      const result = await runNbhqFlow(page, applicationNo);
      policyNo = result.policyNo;

      status = 'PASS';
      remark = policyNo
        ? `เลขที่ กธ: ${policyNo}`
        : 'ดำเนินการครบ Steps 23–27 (ยังไม่มีเลขกรมธรรม์)';

      console.log(`\n✅ PASS: No ${no} | เลขใบคำขอ ${applicationNo}` + (policyNo ? ` | เลขกรมธรรม์ ${policyNo}` : ''));

    } catch (err) {
      const errorMessage = String(err?.message || err);

      // ตรวจว่า runner ถูก stop (browser/context ถูกปิด)
      const isRunnerStopped =
        page.isClosed?.() ||
        /Target page, context or browser has been closed/i.test(errorMessage) ||
        /Test ended/i.test(errorMessage);

      if (isRunnerStopped) {
        console.log(`🛑 Runner stopped: No ${no}`);
        await context.close().catch(() => { });
        throw err;
      }

      status = 'FAIL';
      remark = errorMessage;
      console.error(`\n❌ FAIL: No ${no} | เลขใบคำขอ ${applicationNo}:`, err);

      // Screenshot เมื่อ FAIL
      try {
        const screenshotDir = path.resolve(__dirname, '../../reports/qa/screenshots');
        if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
        const screenshotPath = path.join(screenshotDir, `phase5_nbhq_fail_${no}_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot: ${screenshotPath}`);
        remark = `${errorMessage} | screenshot: ${path.basename(screenshotPath)}`;
      } catch { }

    } finally {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      try {
        await writeNbhqResult({
          no,
          status,
          remark: `[${elapsed}s] ${remark}`.slice(0, 500),
          policyNo,
        });
        console.log(`📝 Write result: No ${no} => ${status}${policyNo ? ` | กธ: ${policyNo}` : ''} [${elapsed}s]`);
      } catch (writeErr) {
        console.error(`❌ Write Sheet failed: No ${no}`, writeErr);
      }
      await context.close().catch(() => { });
    }
  }

  console.log('\n🎉 Phase 5 NBHQ รันครบทุกเคสแล้ว');
});

/*
 * SETUP (Phase 5):
 * ──────────────────────────────────────────────────────
 * 1. แก้ RUN_CREATE_BY ให้ตรงกับ "Create By" ใน Google Sheet
 *
 * 2. ตรวจสอบว่า credentials/token.json พร้อมใช้งาน
 *
 * 3. เงื่อนไข sheet ที่ Phase 5 ดึงมารัน:
 *    - Valid = TRUE
 *    - Create By = RUN_CREATE_BY
 *    - Test Status = Inprogress
 *    - Result = 'Waiting Policy No'
 *    - เลขใบคำขอ ไม่ว่าง
 *
 * 4. รันคำสั่ง:
 *    cd playwright
 *    npx playwright test digital-sale/digital-sale-phase1-gsheet.spec.js --headed --workers=1
 *
 * Column ใน Google Sheet ที่จำเป็น:
 *   No, Valid, Create By, Test Status, Result, เลขใบคำขอ
 *   Env, ชื่อลูกค้า, นามสกุลลูกค้า
 *   (เขียนกลับ: Test Status, Result, Test Date, Remark, เลขกรมธรรม์)
 * ──────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// Auto Runner — รัน Phase 1 ก่อน แล้วดึง Phase 5 ใหม่หลัง Phase 1 เสร็จ
// (Phase 5 fetch ต้องทำหลัง Phase 1 เพื่อให้รับ QR+PASS cases ที่เพิ่งสร้าง)
// ─────────────────────────────────────────────────────────────────────────────

test('Digital Sale — Auto Runner', async ({ browser }) => {
  test.setTimeout(0);

  // ── Step 1: ดึง Phase 1 cases ─────────────────────────────────────────────
  // หมายเหตุ: Phase 5 cases จะถูก fetch ใหม่หลัง Phase 1 เสร็จ
  // เพื่อให้ครอบคลุม QR+PASS cases ที่ Phase 1 เพิ่งเขียนลง sheet ในรอบนี้
  const phase1Cases = await fetchRunnableCases(RUN_CREATE_BY);

  console.log(`\n${'═'.repeat(55)}`);
  console.log('🤖 Digital Sale — Auto Runner');
  console.log('═'.repeat(55));
  console.log(`📊 Phase 1 (New):  ${phase1Cases.length} เคส`);
  console.log('   Phase 5 (NBHQ): จะดึงใหม่หลัง Phase 1 เสร็จ');
  console.log('═'.repeat(55));

  // ── Step 2: ถ้า Phase 1 ว่าง ────────────────────────────────────────────
  if (!phase1Cases.length) {
    console.log('ℹ️  Phase 1 ไม่มีเคสใหม่ — ข้ามไป Phase 5 โดยตรง');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Phase 1 loop — New case (Ready for Test / Ready for Retest)
  // ══════════════════════════════════════════════════════════════════════════
  if (phase1Cases.length) {
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`▶ เริ่ม Phase 1 New Cases (${phase1Cases.length} เคส)`);
    console.log(`   ${phase1Cases.map(c => `No ${c.no}`).join(', ')}`);
    console.log('─'.repeat(55));

    let p1idx = 0;
    for (const finalData of phase1Cases) {
      p1idx++;
      const { no, environment, linkProduct } = finalData;
      const productSlug = String(linkProduct).split('/').pop();

      const claimed = await claimCase(no, RUN_CREATE_BY);
      if (!claimed) {
        console.log(`⏭️ ข้าม No ${no} — ไม่สามารถ claim ได้`);
        continue;
      }

      const context = await browser.newContext({ timezoneId: 'Asia/Bangkok' });
      const page = await context.newPage();
      await setupAutoPopupDismiss(page);

      let status = 'FAIL';
      let remark = '';
      let referenceNumber = '';
      let qrReady = false;
      const startTime = Date.now();

      try {
        const baseUrl = ENV_MAP[environment];
        if (!baseUrl) throw new Error(`❌ ไม่รู้จัก Env: "${environment}"`);
        if (!linkProduct || String(linkProduct).trim() === '') {
          throw new Error(`❌ Link_Product ว่างเปล่า — ตรวจสอบ Var_DigitalSales lookup หรือรหัสแบบประกัน "${finalData.policyCode}" ในชีต`);
        }
        const fullUrl = String(linkProduct).startsWith('http')
          ? String(linkProduct)
          : `${baseUrl}${linkProduct}`;

        console.log(`\n${'━'.repeat(50)}`);
        console.log(`🚀 [P1 ${p1idx}/${phase1Cases.length}] No ${no} | ${productSlug} | ${environment}`);
        console.log(`🌐 เปิด: ${fullUrl}`);
        console.log('━'.repeat(50));

        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await dismissPopups(page);

        referenceNumber = await runPhase1Flow(page, finalData, productSlug);

        if (!referenceNumber) throw new Error('❌ ไม่พบเลขอ้างอิงบนหน้า success');
        status = 'PASS';
        remark = `เลขอ้างอิง: ${referenceNumber}`;
        console.log(`\n✅ PASS: No ${no} | ${productSlug} | เลขอ้างอิง: ${referenceNumber}`);

        const pmVal = String(finalData.paymentMethod || '').trim();
        if (/qr/i.test(pmVal) || pmVal.includes('คิวอาร์')) {
          qrReady = true;
          console.log('📌 QR Code payment — จะ set Test Status QR = Ready for Test');
        }
      } catch (err) {
        const errorMessage = String(err?.message || err);
        const isRunnerStopped =
          page.isClosed?.() ||
          /Target page, context or browser has been closed/i.test(errorMessage) ||
          /Test ended/i.test(errorMessage);
        if (isRunnerStopped) {
          console.log(`🛑 Runner stopped: No ${no}`);
          throw err;
        }
        status = 'FAIL';
        remark = errorMessage;
        console.error(`\n❌ FAIL: No ${no} | ${productSlug}:`, err);
        try {
          const screenshotPath = `reports/qa/screenshots/auto_phase1_fail_${no}_${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`📸 Screenshot: ${screenshotPath}`);
        } catch { }
      } finally {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        try {
          const isQrPass = qrReady && status === 'PASS';
          const resultOverride = isQrPass ? 'Waiting Policy No' : '';
          await writeResult({
            no,
            status,
            remark: `[${elapsed}s] ${remark}`.slice(0, 500),
            applicationNo: referenceNumber,
            result: resultOverride,
            skipTestStatus: isQrPass,
          });
          console.log(`📝 Write result: No ${no} => ${status}${resultOverride ? ` | Result: ${resultOverride}` : ''} [${elapsed}s]`);
        } catch (writeErr) {
          console.error(`❌ Write Sheet failed: No ${no}`, writeErr);
        }
        await context.close().catch(() => { });
      }
    }

    console.log(`\n🎉 Phase 1 รันครบ ${phase1Cases.length} เคสแล้ว`);
  }

  // ── Fetch Phase 5 cases หลัง Phase 1 เสร็จ ────────────────────────────────
  // ดึงใหม่ ณ จุดนี้เพื่อให้ได้ทั้ง:
  //   (1) cases เก่าที่ค้างอยู่จากรอบก่อน (Inprogress + Waiting Policy No)
  //   (2) QR+PASS cases ที่ Phase 1 เพิ่งเขียน "Waiting Policy No" ลง sheet รอบนี้
  const phase5Cases = await fetchNbhqRunnableCases(RUN_CREATE_BY);
  console.log(`\n📊 Phase 5 (NBHQ): ${phase5Cases.length} เคส (fetch ล่าสุดหลัง Phase 1)`);

  if (!phase5Cases.length && !phase1Cases.length) {
    console.log('🎉 ไม่มีเคสให้รัน (Phase 5 และ Phase 1 ว่างทั้งคู่)');
    console.log('   Phase 5 conditions: Valid=TRUE, Create By=RUN_CREATE_BY, Test Status=Inprogress, Result=Waiting Policy No');
    console.log('   Phase 1 conditions: Valid=TRUE, Create By=RUN_CREATE_BY, Test Status=Ready for Test/Retest');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Phase 5 loop — NBHQ QR Code (Inprogress + Waiting Policy No)
  // ══════════════════════════════════════════════════════════════════════════
  if (phase5Cases.length) {
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`▶ เริ่ม Phase 5 NBHQ (${phase5Cases.length} เคส)`);
    console.log(`   ${phase5Cases.map(c => `No ${c.no} (${c.applicationNo})`).join(', ')}`);
    console.log('─'.repeat(55));

    let p5idx = 0;
    for (const caseData of phase5Cases) {
      p5idx++;
      const { no, applicationNo, cusName } = caseData;

      console.log(`\n${'━'.repeat(55)}`);
      console.log(`🚀 [P5 ${p5idx}/${phase5Cases.length}] No ${no} | เลขใบคำขอ ${applicationNo} | ${cusName}`);
      console.log('━'.repeat(55));

      // Claim ป้องกัน runner อื่น overlap
      const claimed = await claimNbhqCase(no, RUN_CREATE_BY);
      if (!claimed) {
        console.log(`⏭️ ข้าม No ${no} — ไม่สามารถ claim ได้ (ถูกประมวลผลไปแล้ว)`);
        continue;
      }

      // เปิด context ใหม่ต่อ case (Basic Auth สำหรับ NBS)
      // ignoreHTTPSErrors: true — ข้าม SSL certificate interstitial ของ UAT intranet site
      //   (หน้า "allow network" / "Your connection is not private" ที่ block อัตโนมัติ)
      const context = await browser.newContext({
        httpCredentials: { username: NBS_USER, password: NBS_PASS },
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();

      let status = 'FAIL';
      let remark = '';
      let policyNo = '';
      const startTime = Date.now();

      try {
        const result = await runNbhqFlow(page, applicationNo);
        policyNo = result.policyNo;

        status = 'PASS';
        remark = policyNo
          ? `เลขที่ กธ: ${policyNo}`
          : 'ดำเนินการครบ Steps 23–27 (ยังไม่มีเลขกรมธรรม์)';

        console.log(`\n✅ PASS: No ${no} | เลขใบคำขอ ${applicationNo}` + (policyNo ? ` | เลขกรมธรรม์ ${policyNo}` : ''));

      } catch (err) {
        const errorMessage = String(err?.message || err);

        const isRunnerStopped =
          page.isClosed?.() ||
          /Target page, context or browser has been closed/i.test(errorMessage) ||
          /Test ended/i.test(errorMessage);

        if (isRunnerStopped) {
          console.log(`🛑 Runner stopped: No ${no}`);
          await context.close().catch(() => { });
          throw err;
        }

        status = 'FAIL';
        remark = errorMessage;
        console.error(`\n❌ FAIL: No ${no} | เลขใบคำขอ ${applicationNo}:`, err);

        try {
          const screenshotDir = path.resolve(__dirname, '../../reports/qa/screenshots');
          if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
          const screenshotPath = path.join(screenshotDir, `auto_phase5_fail_${no}_${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`📸 Screenshot: ${screenshotPath}`);
          remark = `${errorMessage} | screenshot: ${path.basename(screenshotPath)}`;
        } catch { }

      } finally {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        try {
          await writeNbhqResult({
            no,
            status,
            remark: `[${elapsed}s] ${remark}`.slice(0, 500),
            policyNo,
          });
          console.log(`📝 Write result: No ${no} => ${status}${policyNo ? ` | กธ: ${policyNo}` : ''} [${elapsed}s]`);
        } catch (writeErr) {
          console.error(`❌ Write Sheet failed: No ${no}`, writeErr);
        }
        await context.close().catch(() => { });
      }
    }

    console.log(`\n🎉 Phase 5 NBHQ รันครบ ${phase5Cases.length} เคสแล้ว`);
  }

  console.log(`\n${'═'.repeat(55)}`);
  console.log('🤖 Auto Runner เสร็จสิ้น');
  console.log('═'.repeat(55));
});
