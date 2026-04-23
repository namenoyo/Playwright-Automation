import { test } from '@playwright/test';

test('test แก้ไขบันทึกเคสใหม่', async ({ page }) => {
  page.on('dialog', async dialog => {
    console.log('Dialog message:', dialog.message());
    await dialog.accept();  // กด OK popup
  });
  await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');

  //login
  await page.locator('#username').click();
  await page.locator('#username').fill('3107');
  await page.locator('#password').click();
  await page.locator('#password').fill('1');
  await page.getByRole('button', { name: 'Login' }).click();

  //เข้าเมนู
  await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
  await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click();
  await page.getByRole('menuitem', { name: 'บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)' }).click();

  //ใส่ตัวแทน
  await page.locator('#agent-code-name').fill('6100908');
  await page.getByRole('option', { name: ': น.ส.เจดีเอส ไอเทสบีซี' }).click();

  //เมนูแก้ไข
  await page.getByRole('link', { name: 'แก้ไข' }).click();
  await page.locator('#plan').selectOption({ label: '188 วางใจคุ้มค่า' });
  await page.getByRole('button', { name: 'ป้อนทุนประกัน' }).click();
  await page.locator('#popUpCapital').fill('');
  await page.locator('#popUpCapital').fill('1400000');
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await page.locator('#sMode').selectOption({ label: 'รายปี' });
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
});