export async function generateTempReceipt(page, finalData) {
  const url =
    finalData.environment === 'SIT'
      ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
      : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html';

  await page.goto(url);

  await page.locator('#username').fill('0001');
  await page.locator('#password').fill('12');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.waitForTimeout(500);

  await page.getByRole('menuitem', { name: 'ใบรับเงินชั่วคราว' }).click();
  await page.getByRole('menuitem', { name: 'เบิกใบรับเงินชั่วคราว' }).click();

  await page.waitForTimeout(500);

  const agencyInput = page.locator('#agency');

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

  await page.waitForResponse(
    res =>
      res.url().includes('/combine2/receipt/borrow/v3-borrow-listAgent.html') &&
      res.status() === 200,
    { timeout: 30000 }
  );

  console.log('✅ listAgent โหลดเสร็จแล้ว');

  await agencyInput.fill('');
  await agencyInput.type(finalData.agentCode, { delay: 100 });

  await page.waitForTimeout(1000);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await agencyInput.press('Tab');

  console.log('✅ Generate Temp Receipt Flow Done');
}