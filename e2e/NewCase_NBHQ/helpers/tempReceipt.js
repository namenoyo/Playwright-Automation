export async function generateTempReceipt(page, finalData) {
  const env = String(finalData.environment || '').trim();
  const branch = String(finalData.branch || '0001').trim();
  const agentCode = String(finalData.agentCode || '').trim();

  if (!agentCode) {
    throw new Error('❌ generateTempReceipt: finalData.agentCode ไม่มีค่า');
  }

  const homeUrl =
    env === 'SIT'
      ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
      : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html';

  const borrowUrl =
    env === 'SIT'
      ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/combine2/receipt/borrow/borrow-index3.html'
      : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/combine2/receipt/borrow/borrow-index3.html';

  console.log(`🚀 Generate Temp Receipt | env=${env} branch=${branch} agent=${agentCode}`);

  await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });

  await page.locator('#username').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#username').fill(branch);
  await page.locator('#password').fill('12');
  await page.getByRole('button', { name: 'Login' }).click();

 await page.waitForTimeout(800);

// =========================
// 🔍 เช็ค temp receipt เดิมก่อน
// =========================

const enquiryUrl =
  env === 'SIT'
    ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/receipt/enquiry/enquiry-index.html'
    : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/receipt/enquiry/enquiry-index.html';

console.log('🔍 เข้า enquiry เพื่อตรวจสอบใบรับเงินชั่วคราวเดิม');

await page.goto(enquiryUrl, {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});

await page.waitForTimeout(1000);


const enquiryAgentInput = page.locator('#agent-code-name');

await enquiryAgentInput.waitFor({
  state: 'attached',
  timeout: 15000,
});

console.log(`⌨️ กรอก agent ใน enquiry ด้วย native event: ${agentCode}`);

await page.evaluate(async (agentCode) => {
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const el = document.querySelector('#agent-code-name');

  if (!el) {
    throw new Error('ไม่พบ input #agent-code-name');
  }

  // ✅ เหมือน Tampermonkey: ปลด disabled ชั่วคราว
  el.disabled = false;
  el.removeAttribute('disabled');

  el.focus();
  el.click();

  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  await sleep(100);

  for (const ch of String(agentCode || '')) {
    el.value += ch;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(80);
  }

  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', bubbles: true }));
}, agentCode);

await page.waitForTimeout(800);



console.log('🔍 กดค้นหา enquiry');

const enquiryPromise = page.waitForResponse(
  res =>
    res.url().includes('/receipt/enquiry/enquiry-list.html') &&
    res.status() === 200,
  { timeout: 15000 }
).catch(() => null);

await page.locator('#oEnquiry').click();

await enquiryPromise;

await page.waitForTimeout(1500);

console.log('🔍 ตรวจสอบใบรับเงินชั่วคราวเดิม...');

console.log('↕️ sort คอลัมน์สถานะ เพื่อหาใบสถานะเบิก');

const statusSortBtn = page
  .locator('.yui3-datatable-sort-liner')
  .filter({ hasText: 'สถานะ' })
  .first();

await statusSortBtn.waitFor({
  state: 'visible',
  timeout: 10000,
});

let foundBorrowBySort = false;

for (let round = 1; round <= 4; round++) {
  console.log(`↕️ sort สถานะ รอบที่ ${round}`);

  await statusSortBtn.click();
  await page.waitForTimeout(700);

  const hasBorrow = await page
    .locator('.yui3-datatable-data tr')
    .filter({ hasText: 'เบิก' })
    .first()
    .isVisible()
    .catch(() => false);

  if (hasBorrow) {
    foundBorrowBySort = true;
    break;
  }
}

if (!foundBorrowBySort) {
  console.log('⚠️ sort แล้ว ยังไม่เจอสถานะเบิก');
}

const enquiryRows = page.locator('.yui3-datatable-data tr');

const enquiryRowCount = await enquiryRows.count();

for (let i = 0; i < enquiryRowCount; i++) {

  const row = enquiryRows.nth(i);

  const status = String(
    await row
      .locator('.yui3-datatable-col-status')
      .innerText()
      .catch(() => '')
  ).trim();

  console.log(`📄 row ${i + 1} status = ${status}`);

  if (status === 'เบิก') {

    const receiptNo = String(
      await row
        .locator('.yui3-datatable-col-receiptNo')
        .innerText()
        .catch(() => '')
    ).trim();

    if (receiptNo) {

      console.log(`✅ พบ tempReceiptNo เดิม = ${receiptNo}`);

      return receiptNo;
    }
  }
}

console.log('⚠️ ไม่พบใบสถานะเบิกเดิม → ไปหน้า borrow เพื่อเบิกใหม่');

// =========================
// 🚀 เข้า borrow flow
// =========================

await page.goto(borrowUrl, {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});

  const agencyInput = page.locator('#agency');
  await agencyInput.waitFor({ state: 'visible', timeout: 15000 });

  const creditLoadingPopup = page.locator('div.yui3-widget-bd', {
    hasText: 'กำลังปรับปรุงข้อมูลเครดิตตัวแทน...'
  });

  try {
    await creditLoadingPopup.waitFor({ state: 'visible', timeout: 3000 });
    console.log('⏳ พบ popup กำลังปรับปรุงข้อมูลเครดิตตัวแทน...');
    await creditLoadingPopup.waitFor({ state: 'hidden', timeout: 30000 });
    console.log('✅ popup หายแล้ว');
  } catch {
    console.log('ℹ️ ไม่พบ popup กำลังปรับปรุงข้อมูลเครดิตตัวแทน...');
  }

  await agencyInput.click();
  await agencyInput.fill('');
  await agencyInput.type(agentCode, { delay: 120 });

  await page.waitForTimeout(1000);

  const agentOption = page
    .locator('.ui-autocomplete li, .ui-menu-item, [role="option"], .autocomplete-item')
    .filter({ hasText: agentCode })
    .first();

  if (await agentOption.isVisible().catch(() => false)) {
    await agentOption.click();
  } else {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }

  await agencyInput.press('Tab');

  await page.waitForResponse(
    res =>
      res.url().includes('/combine2/receipt/borrow/v3-borrow-listAgent.html') &&
      res.status() === 200,
    { timeout: 30000 }
  ).catch(() => null);

  await page.waitForTimeout(1000);

  const totalQuota = Number(
    String(await page.locator('#sp2').innerText().catch(() => '0')).replace(/,/g, '').trim()
  );

  const remainQuota = Number(
    String(await page.locator('#sp1').innerText().catch(() => '0')).replace(/,/g, '').trim()
  );

  const availableQuota = Math.max(0, totalQuota - remainQuota);

  console.log(`📊 quota total=${totalQuota} remain=${remainQuota} available=${availableQuota}`);

  if (availableQuota <= 0) {
    throw new Error(`❌ generateTempReceipt: quota เต็มแล้ว ไม่สามารถเบิกใบรับเงินชั่วคราวได้ agent=${agentCode}`);
  }

  const addBtn = page.locator('#btAdd');
  await addBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addBtn.click();

  await page.waitForTimeout(1000);

  const receiptNos = await page
    .locator('.yui3-datatable-data .yui3-datatable-col-receiptNo')
    .allInnerTexts();

  const tempReceiptNo = receiptNos
    .map(v => String(v || '').trim())
    .find(Boolean);

  if (!tempReceiptNo) {
    throw new Error(`❌ generateTempReceipt: ไม่พบเลขใบรับเงินชั่วคราวสำหรับเบิก agent=${agentCode}`);
  }

  console.log(`📦 tempReceiptNo ที่จะเบิก = ${tempReceiptNo}`);

  const scanInput = page.locator('#spInput');
  await scanInput.waitFor({ state: 'visible', timeout: 15000 });

  await scanInput.click();
  await scanInput.fill(tempReceiptNo);

  // รอข้อมูล
  const [enter_temp_receipt] = await Promise.all([
    page.waitForResponse(res =>
      res.url().includes('/nbsweb/secure/receipt/borrow/v3-borrow-list2.html') && res.status() === 200
    ),
    await scanInput.press('Enter')
  ]);

  await page.waitForTimeout(800);

  // const okBtn = await page.locator('#btok');
  // await okBtn.waitFor({ state: 'visible', timeout: 15000 });
  // await okBtn.click();
  await page.on('dialog', async dialog => {
    console.log('Dialog message:', dialog.message());

    await dialog.accept();
  });
  await page.locator('#btok').click();

  const savePromise = page.waitForResponse(
    res =>
      res.url().includes('/secure/receipt/borrow/v3-borrow-save2.html') &&
      res.status() === 200,
    { timeout: 30000 }
  ).catch(() => null);

  
  await savePromise;

  await page.waitForTimeout(1000);

  console.log(`✅ Generate Temp Receipt สำเร็จ: ${tempReceiptNo}`);

  return tempReceiptNo;
}