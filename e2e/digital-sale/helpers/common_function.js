const { expect } = require('@playwright/test');

// ===== GLOBAL PAUSE CONTROL สำหรับกด Pause และ Resume =====
let isPaused = false;

function pause() {
  console.log('⏸️ Pause...');
  isPaused = true;
}

function resume() {
  console.log('▶️ Resume...');
  isPaused = false;
}

async function waitIfPaused() {
  while (isPaused) {
    await new Promise(r => setTimeout(r, 500));
  }
}

// ===== INIT KEYBOARD LISTENER (ต้องเรียกครั้งเดียว) =====
function initPauseControl() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on('data', (key) => {
      const k = key.toString();

      if (k === 'p') pause();   // กด p = pause
      if (k === 'r') resume();  // กด r = resume
    });

    console.log('⌨️ Press "p" to pause, "r" to resume');
  } else {
    console.log('⚠️ stdin not TTY → pause control disabled');
  }
}
//============================
// ฟังก์ชั่นเช็คจาก display value แทน ไม่ใช่ inputValue().
//============================
async function getSelectDisplayText(inputLocator) {
  const container = inputLocator
    .locator('xpath=ancestor::div[contains(@class,"css-")][contains(@class,"container")]')
    .first();

  return await container
    .locator('div[class*="singleValue"]')
    .first()
    .innerText()
    .catch(() => '');
}

async function waitSelectCommitted(inputLocator, label = 'select', timeout = 10000) {
  await expect
    .poll(async () => {
      const text = await getSelectDisplayText(inputLocator);
      return String(text || '').trim();
    }, { timeout })
    .not.toBe('');

//   console.log(`✅ ${label} ถูกเลือกแล้ว`);
}
//============================
// ฟังก์ชั่นการระบุค่าแบบ Mandatory   (ถ้าไม่มีค่า จะ Fail)
// วิธีใช้คือ await mandatoryFill(page, payerDocument, '#section-payment #documentCode', 'ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง');
//============================
async function mandatoryFill(page, value, selector, label = '') {
  const val = String(value || '').trim();

  if (!val) {
    throw new Error(`❌ ${label || selector} ไม่มีค่า แต่เป็น Mandatory Field`);
  }

  const el = page.locator(selector).first();

  await el.waitFor({ state: 'visible', timeout: 5000 });
  await el.click();
  await el.fill(val);

  console.log(`✅ Mandatory Fill ${label || selector}: ${val}`);
  return true;
}

//============================
// ฟังก์ชั่นการระบุค่าแบบ Mandatory Fill Tab (ถ้าไม่มีค่า จะ Fail)
// วิธีใช้คือ await mandatoryFillTab(page, payerDocument, '#section-payment #documentCode', 'ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง');
//============================
async function mandatoryFillTab(page, value, selector, label = '') {
  const val = String(value || '').trim();

  if (!val) {
    throw new Error(`❌ ${label || selector} ไม่มีค่า แต่เป็น Mandatory Field`);
  }

  const el = page.locator(selector).first();

  await el.waitFor({ state: 'visible', timeout: 5000 });
  await el.click();
  await el.fill(val);
  await el.press('Tab');
  await page.waitForTimeout(500);

  console.log(`✅ Mandatory Fill+Tab ${label || selector}: ${val}`);
  return true;
}

//============================
// ฟังก์ชั่นการระบุค่าแบบ optional (ถ้าไม่มีค่า จะข้ามไปเลย ไม่ทำอะไร)
// วิธีใช้คือ await optionalFill(page, payerDocument, '#section-payment #documentCode', 'ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง');
//============================
async function optionalFill(page, value, selector, label = '') {
  const val = String(value || '').trim();

  if (!val) {
    console.log(`⏭️ skip ${label || selector}`);
    return false;
  }

  const el = page.locator(selector).first();

  await el.waitFor({ state: 'visible', timeout: 5000 });
  await el.click();
  await el.fill(val);

  console.log(`✅ Optional Fill ${label || selector}: ${val}`);
  return true;
}

//============================
// ฟังก์ชั่นการระบุค่าแบบ optional Fill Tab(ถ้าไม่มีค่า จะข้ามไปเลย ไม่ทำอะไร)
// วิธีใช้คือ await optionalFillTab(page, payerDocument, '#section-payment #documentCode', 'ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง');
//============================
async function optionalFillTab(page, value, selector, label = '') {
  const val = String(value || '').trim();

  if (!val) {
    console.log(`⏭️ skip ${label || selector}`);
    return false;
  }

  const el = page.locator(selector).first();

  await el.waitFor({ state: 'visible', timeout: 5000 });
  await el.click();
  await el.fill(val);
  await el.press('Tab');
  await page.waitForTimeout(500);

  console.log(`✅ Optional Fill+Tab ${label || selector}: ${val}`);
  return true;
}

// ===================================================
// Helper: รอ loading ถ้ามี
// ===================================================
async function waitOptionalLoading(page, text = 'กรุณารอสักครู่...') {
  const loading = page.getByText(text);

  try {
    await loading.waitFor({ state: 'visible', timeout: 2000 });
    await loading.waitFor({ state: 'hidden', timeout: 60000 });
  } catch {}
}

// ===================================================
// Helper: รอ signal ใดๆ ใน array — เจอตัวแรกก็ proceed
// ===================================================
async function waitForReady(page, signals, timeout = 10000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    for (const sig of signals) {
      const loc = typeof sig === 'string' ? page.locator(sig) : sig;

      if (await loc.first().isVisible({ timeout: 100 }).catch(() => false)) {
        return true;
      }
    }

    await page.waitForTimeout(80);
  }

  throw new Error(`❌ รอ ready signal ไม่เจอใน ${timeout}ms`);
}

// ===================================================
// Helper: parse birthDate "DD/MM/YYYY" (ค.ศ. หรือ พ.ศ.)
//   คืน { day, monthInt, yearAD, yearBE }
// ===================================================
function parseBirthDate(birthDateStr) {
  const parts = String(birthDateStr || '').split('/');

  if (parts.length < 3) {
    throw new Error(`❌ birthDate parse ไม่ได้: "${birthDateStr}"`);
  }

  const day = parseInt(parts[0].trim(), 10);
  const monthInt = parseInt(parts[1].trim(), 10);
  const year = parseInt(parts[2].trim(), 10);

  const yearAD = year < 2400 ? year : year - 543;
  const yearBE = year < 2400 ? year + 543 : year;

  return { day, monthInt, yearAD, yearBE };
}

// ===================================================
// Helper: เลือกวันที่ใน flatpickr
//   — open() + jumpToDate() → คลิกวันด้วย aria-label ชื่อเดือนภาษาไทย
//   — jumpToDate ไม่ set ค่า ไม่ bypass Livewire — คลิกวันผ่าน UI trigger onChange → wire:model
// ===================================================
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

async function setFlatpickrDate(page, selector, dateAD) {
  const input = page.locator(selector).first();

  const day = dateAD.getDate();
  const monthIndex = dateAD.getMonth();
  const yearAD = dateAD.getFullYear();

  const dd = String(day).padStart(2, '0');
  const mm = String(monthIndex + 1).padStart(2, '0');
  const yyyyBE = yearAD + 543;
  const expectedTH = `${dd}/${mm}/${yyyyBE}`;

  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.scrollIntoViewIfNeeded();

  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`🔁 setFlatpickrDate attempt ${attempt}/5 expected=${expectedTH}`);

    try {
      await killDigitalSalesPopups(page);
      await page.waitForTimeout(300);

      const actual = await Promise.race([
        (async () => {
          await input.evaluate((el, ts) => {
            if (!el._flatpickr) {
              throw new Error('flatpickr instance not found');
            }

            el._flatpickr.open();
            el._flatpickr.jumpToDate(new Date(ts), true);
          }, dateAD.getTime());

          await page.waitForSelector('.flatpickr-calendar.open', { timeout: 3000 });

          const labelPrefix = `${THAI_MONTHS[monthIndex]} ${day},`;
          const dayBtn = page.getByLabel(labelPrefix, { exact: false }).first();

          await dayBtn.waitFor({ state: 'visible', timeout: 3000 });
          await dayBtn.click({ force: true });

          await page.waitForTimeout(500);

          return await input.inputValue();
        })(),

        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('เลือกวันเกิดเกิน 5 วิ → retry')), 5000)
        ),
      ]);

      console.log(`🔎 actual=${actual} expected=${expectedTH}`);

      if (actual) {
        console.log(`✅ setFlatpickrDate สำเร็จ: ${actual}`);
        return actual;
      }

      throw new Error('date input ยังว่าง');
    } catch (err) {
      console.log(`⚠️ setFlatpickrDate fail: ${err.message}`);

      await killDigitalSalesPopups(page);
      await page.waitForTimeout(700);

      if (attempt === 5) {
        const finalActual = await input.inputValue().catch(() => '');
        throw new Error(
          `❌ setFlatpickrDate ไม่สำเร็จ expected=${expectedTH} actual=${finalActual} reason=${err.message}`
        );
      }
    }
  }
}

// ===================================================
// Helper Retry: เลือกวันที่ใน flatpickr
// ===================================================
async function retryBirthDate(page, selector, dateAD, maxRetry = 5) {
  for (let i = 1; i <= maxRetry; i++) {
    console.log(`🔁 retryBirthDate attempt ${i}/${maxRetry}`);

    try {
      const result = await Promise.race([
        setFlatpickrDate(page, selector, dateAD),

        new Promise((_, reject) =>
          setTimeout(() => {
            reject(new Error('⏱️ กรอกวันเกิดเกิน 5 วิ → retry'));
          }, 5000)
        ),
      ]);

      const actual = await page
        .locator(selector)
        .first()
        .inputValue()
        .catch(() => '');

      if (actual) {
        console.log(`✅ retryBirthDate สำเร็จ actual=${actual}`);
        return result;
      }

      throw new Error('วันเกิดยังว่าง');
    } catch (err) {
      console.log(`⚠️ retryBirthDate fail: ${err.message}`);

      await page.keyboard.press('Escape').catch(() => {});

      await page.evaluate(() => {
        document.querySelectorAll('iframe, div, section').forEach(el => {
          const raw = `${el.id || ''} ${el.className || ''} ${el.getAttribute('title') || ''}`;

          if (/chat|tawk|tidio|intercom|crisp|livechat|support|onesignal/i.test(raw)) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
          }
        });

        document.querySelectorAll('button').forEach(btn => {
          const txt = (btn.innerText || btn.textContent || '').trim();

          if (txt === '×' || txt === 'x' || txt === 'X' || txt === '−') {
            btn.click();
          }
        });
      }).catch(() => {});

      await page.waitForTimeout(700);

      if (i === maxRetry) {
        throw new Error(
          `❌ retryBirthDate ไม่สำเร็จหลัง ${maxRetry} รอบ: ${err.message}`
        );
      }
    }
  }
}


// ===================================================
// เพิ่ม helper ปิด popup/chat ที่อาจโผล่มาขัดตอนทำงาน
// ===================================================
async function killDigitalSalesPopups(page) {
  // ปิด OneSignal / popup ปุ่ม X
  await page.keyboard.press('Escape').catch(() => {});

  const closeButtons = [
    'button:has-text("×")',
    'button:has-text("x")',
    'button:has-text("X")',
    '[aria-label="Close"]',
    '[aria-label="close"]',
  ];

  for (const sel of closeButtons) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  // ซ่อน live chat iframe/widget
  await page.evaluate(() => {
    document.querySelectorAll('iframe, div, section').forEach(el => {
      const txt = `${el.id || ''} ${el.className || ''} ${el.getAttribute('title') || ''}`;
      if (/chat|tawk|tidio|intercom|crisp|livechat|support/i.test(txt)) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      }
    });
  }).catch(() => {});
}
// ===================================================
// Helper: คลิกปุ่มจาก text (รอ visible 10s)
// ===================================================
async function clickButtonByText(page, text, timeout = 10000) {
  const loc = page.locator(`button:has-text("${text}")`).first();

  await loc.waitFor({ state: 'attached', timeout });

  if (await loc.isVisible({ timeout: 1500 }).catch(() => false)) {
    await loc.click();
  } else {
    // display:none → force:true ยังไม่พอ (ไม่มี bounding box) → ใช้ JS click แทน
    await loc.evaluate(el => el.click());
    console.log(`⚡ js-click "${text}" (display:none)`);
  }

  console.log(`✅ กดปุ่ม "${text}"`);
}

// ===================================================
// Helper: คลิก label radio (input ถูก CSS hide)
// ===================================================
async function clickRadioLabel(page, inputId) {
  const label = page.locator(`label[for="${inputId}"]`).first();

  if (await label.isVisible({ timeout: 1500 }).catch(() => false)) {
    await label.click();
    return;
  }

  await page.locator('#' + inputId).check({ force: true });
}

// ===================================================
// Helper: ปิด popup (newsletter / cookie / modal)
// ===================================================
async function dismissPopups(page) {
  const popupButtons = [
    /ไว้.*หลัง/i,
    /^ยอมรับ$/,
    /^ปิด$/,
    /^close$/i,
    /^×$/,
  ];

  for (const name of popupButtons) {
    try {
      const btn = page.getByRole('button', { name }).first();

      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        console.log(`⚠️ พบ popup → ปิด: ${name}`);
        await btn.click({ force: true });
        await page.waitForTimeout(500);
      }
    } catch {}
  }

  try {
    const modalClose = page
      .locator('[role="dialog"]')
      .locator('button')
      .filter({ hasText: /^(×|close|ปิด)$/i })
      .first();

    if (await modalClose.isVisible({ timeout: 800 }).catch(() => false)) {
      console.log('⚠️ พบ dialog popup → ปิด');
      await modalClose.click({ force: true });
      await page.waitForTimeout(500);
    }
  } catch {}
}

// ===================================================
// Title alias mapping — ของย่อ → ค่าจริงใน dropdown
// ===================================================
const TITLE_ALIASES = {
  'น.ส.': 'นางสาว',
  'น.ส': 'นางสาว',
  'นางสาว': 'นางสาว',
  'นาง': 'นาง',
  'นาย': 'นาย',
  'ด.ช.': 'เด็กชาย',
  'ด.ญ.': 'เด็กหญิง',
};

function normalizeTitle(t) {
  const v = String(t || '').trim();
  return TITLE_ALIASES[v] || v;
}

// ===================================================
// setupAutoPopupDismiss — ตั้งค่า background auto-dismiss 1 ครั้งหลัง page สร้าง
//   ครอบคลุม: OneSignal popup + live chat widget (สุ่มจังหวะแสดง)
//   ไม่ต้องเรียก dismissPopups ที่ step ไหนอีก
// ===================================================
async function setupAutoPopupDismiss(page) {
  // 1. OneSignal "ไว้ภายหลัง" — addLocatorHandler ทำงาน background ตลอด flow
  await page.addLocatorHandler(
    page.getByRole('button', { name: /ไว้.*หลัง/i }),
    async (btn) => {
      await btn.click({ force: true }).catch(() => {});
      console.log('🔕 auto-dismiss: OneSignal popup');
    }
  );

  // 2. Live chat widget — MutationObserver ใน page ซ่อน/minimize อัตโนมัติ
  await page.evaluate(() => {
    const tryHideChat = () => {
      // คลิกปุ่ม minimize (−) ของ live chat
      document.querySelectorAll('button').forEach(btn => {
        const txt = (btn.textContent || btn.innerText || '').trim();
        if (txt === '−' || txt === '_' || txt === '–') {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) btn.click();
        }
      });
      // ซ่อน iframe chat widget (Tawk, Tidio, Intercom, Crisp, ฯลฯ)
      document.querySelectorAll('iframe').forEach(iframe => {
        if (/chat|support|widget|tawk|tidio|intercom|crisp|livechat/i.test(iframe.src || '')) {
          iframe.style.cssText += 'display:none!important;pointer-events:none!important';
        }
      });
    };

    tryHideChat();
    new MutationObserver(tryHideChat).observe(document.body, { childList: true, subtree: true });
  });
}

// ===================================================
// Helper: accept consent checkbox ทั้งหมด
//   ใช้กับหน้า consent ที่ checkbox readonly
//   flow = click label -> open modal -> กด "ยอมรับ"
// ===================================================
async function acceptAllConsents(page) {
  const consentIds = [150, 151, 152];

  for (const id of consentIds) {
    console.log(`☑️ เริ่มยอมรับ consent-${id}`);

    const label = page.locator(
      `label[data-target="#consent-${id}"]`
    ).first();

    await label.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await label.click();

    const modal = page.locator(`#consent-${id}`);

    await modal.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    // consent-152 มี pdpa checkbox ซ้อน
    const pdpaCheckbox = modal.locator('#pdpa_consent').first();

if (await pdpaCheckbox.count()) {
  const checkedBefore = await pdpaCheckbox.isChecked().catch(() => false);

  if (!checkedBefore) {
    console.log(`☑️ พบ pdpa_consent ใน consent-${id} → ติ๊กแบบ robust`);

    const pdpaId = await pdpaCheckbox.getAttribute('id');

    const pdpaLabel = pdpaId
      ? modal.locator(`label[for="${pdpaId}"]`).first()
      : modal.locator('label').filter({ hasText: /ยินยอม|รับทราบ|ตกลง|ข้าพเจ้า/i }).first();

    if (await pdpaLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
      await pdpaLabel.click({ force: true }).catch(() => {});
    } else {
      await pdpaCheckbox.click({ force: true }).catch(() => {});
    }

    await page.waitForTimeout(300);

    let checkedAfter = await pdpaCheckbox.isChecked().catch(() => false);

    if (!checkedAfter) {
      console.log('⚠️ click แล้วยังไม่ checked → set checked ผ่าน JS + dispatch event');

      await pdpaCheckbox.evaluate(el => {
        el.checked = true;
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForTimeout(500);
      checkedAfter = await pdpaCheckbox.isChecked().catch(() => false);
    }

    console.log(`✅ pdpa_consent checked=${checkedAfter}`);
  }
}

    // กดปุ่ม ยอมรับ
    const acceptBtn = modal
      .getByRole('button', {
        name: 'ยอมรับ',
      })
      .first();

    await acceptBtn.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await acceptBtn.click();

    await modal
      .waitFor({
        state: 'hidden',
        timeout: 10000,
      })
      .catch(async () => {
        await page.waitForTimeout(1000);
      });

    console.log(`✅ ยอมรับ consent-${id} สำเร็จ`);
  }

  // verify checkbox หลัก
  for (const id of consentIds) {
    await expect
      .poll(async () => {
        return await page
          .locator(`#accepted_${id}`)
          .isChecked()
          .catch(() => false);
      }, { timeout: 10000 })
      .toBeTruthy();

    console.log(`✅ accepted_${id} checked แล้ว`);
  }
}

// ===================================================
// Helper: auto select safe radio by label text
// ===================================================
async function autoSelectSafeRadios(page) {
  console.log('📌 auto select safe radio');

  const safeTexts = [
    'ไม่เคย/ไม่มี',
    'ไม่เคยดื่ม',
    'ไม่เปลี่ยน',
    'ไม่สูบ/ ไม่เคยสูบ',
    'ไม่ดื่ม/ ไม่เคยดื่ม',
    'ไม่สูบ',
    'ไม่ดื่ม',
    'ไม่เคย',
    'ไม่มี',
    'ปกติ',
    'ไม่',
  ];

  for (let round = 1; round <= 4; round++) {
    console.log(`🔁 safe radio round ${round}`);

    const labels = page.locator('label[for]');
    const count = await labels.count();

    for (let i = 0; i < count; i++) {
      const lbl = labels.nth(i);

      if (!(await lbl.isVisible().catch(() => false))) continue;

      const text = (await lbl.innerText().catch(() => '')).trim();
      if (!safeTexts.some(t => text.includes(t))) continue;

      const forId = await lbl.getAttribute('for');
      if (!forId) continue;

      const radio = page.locator(`#${forId}`).first();

      if ((await radio.getAttribute('type').catch(() => '')) !== 'radio') {
        continue;
      }

      if (await radio.isChecked().catch(() => false)) {
        console.log(`✅ already checked ${forId} text="${text}"`);
        continue;
      }

      console.log(`☑️ click safe radio ${forId} text="${text}"`);

      await lbl.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(150);

      await lbl.click({ force: true });
      await page.waitForTimeout(300);

      let checked = await radio.isChecked().catch(() => false);

      if (!checked) {
        await radio.check({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
        checked = await radio.isChecked().catch(() => false);
      }

      if (!checked) {
        await radio.evaluate((el) => {
          el.checked = true;
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });

        await page.waitForTimeout(300);
        checked = await radio.isChecked().catch(() => false);
      }

      console.log(`✅ checked=${checked} id=${forId}`);
    }

    await page.waitForTimeout(700);
  }
}


module.exports = {
  waitIfPaused,
  initPauseControl,
  getSelectDisplayText,
  waitSelectCommitted,
  optionalFill,
  optionalFillTab,
  mandatoryFill,
  mandatoryFillTab,

  killDigitalSalesPopups,
  normalizeTitle,
  dismissPopups,
  setupAutoPopupDismiss,
  waitOptionalLoading,
  waitForReady,
  parseBirthDate,
  setFlatpickrDate,
  retryBirthDate,
  clickButtonByText,
  clickRadioLabel,
  acceptAllConsents,
  autoSelectSafeRadios,
};
//============================