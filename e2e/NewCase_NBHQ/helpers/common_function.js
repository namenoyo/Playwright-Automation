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




module.exports = {
  waitIfPaused,
  initPauseControl,
  getSelectDisplayText,
  waitSelectCommitted,
  optionalFill,
  optionalFillTab,
  mandatoryFill,
  mandatoryFillTab,
};
//============================