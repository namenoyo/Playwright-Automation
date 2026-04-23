import { test, expect } from '@playwright/test';
import { caseDatas } from '../data/uwcheck.js';
import { totalmem } from 'os';

test('NBHQ Automation Fast Mode', async ({ page }) => {
  const env = caseDatas[0].environment;

  // === LOGIN แค่ครั้งเดียว ===
  console.log('🟢 กำลัง Login เข้าระบบ...');
  if (env === 'SIT') {
    await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');
  } else {
    await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html');
  }

  await page.locator('#username').fill('0001');
  await page.locator('#password').fill('12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForTimeout(800);

  await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
  await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
  await page.waitForTimeout(500);

  if (env === 'SIT') {
    await page.goto('https://intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
  } else {
    await page.goto('https://uat-intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
  }

  console.log('✅ Login สำเร็จ! เริ่มตรวจสอบเคส...\n');

  // === LOOP ทุกเคส ===
  for (let i = 0; i < caseDatas.length; i++) {
    const finalData = caseDatas[i];
    console.log(`=== เคสที่ ${i + 1} | Application No: ${finalData.applicationNo} ===`);

    try {
      // --- กลับมาหน้าแรกทุกครั้ง เพื่อเริ่มใหม่ ---
      await page.waitForTimeout(1000);
      await page.goto('https://uat-intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
      await page.getByRole('button', { name: 'จัดการข้อมูลเคสใหม่' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'แสดงรายการเคสใหม่' }).click();
await page.waitForTimeout(1000);
      // --- ค้นหา Application ---
      await page.locator('#applicationNo').fill(finalData.applicationNo);
      await page.locator('#applicationNo').press('Tab');
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'ค้นหา' }).nth(1).click();
      await page.waitForTimeout(1000);

      // --- ดึงข้อมูลในตารางหลัก ---
      const rows = await page.locator('tbody tr').all();
      const tempData = [];
      for (const row of rows) {
        const cells = await row.locator('td').allTextContents();
        tempData.push(cells.map((item) => item.trim()));
      }

      // --- Extract fields ---
      const displayedApplicationNo = tempData[0][3];
      const displayedPolicyNo = tempData[0][5];
      const displayedCauseOfLoss = tempData[0][51];

      // --- แสดงผล ---
      console.log(`Application No: ${displayedApplicationNo}`);
      console.log(`Status: ${displayedCauseOfLoss}`);

      // === เคส "ผ่าน" ===
      if (displayedCauseOfLoss === 'ผ่าน') {
        console.log(`Policy Number: ${displayedPolicyNo}`);
      }

      // === เคส "ไม่ผ่าน" ===
      else if (displayedCauseOfLoss === 'ไม่ผ่าน') {
        await page.getByRole('button', { name: 'ไม่ผ่าน' }).click();
        await page.waitForTimeout(800);

        const causeCells = await page
          .locator('.MuiTableCell-root.MuiTableCell-body.MuiTableCell-alignLeft')
          .allTextContents();

        const trimmedCauses = causeCells.map((x) => x.trim()).filter((x) => x !== '');
        const causeStartIndex = 16;
        const selectedCauses = trimmedCauses.slice(causeStartIndex);

        console.log('สาเหตุที่ส่งขออนุมัติ:');
        selectedCauses.forEach((value, j) => {
          console.log(`${j + 1}. ${value}`);
        });

        // ปิด popup หลังดูสาเหตุ
        await page.getByText('ปิด').click();
      }

      console.log('----------------------------------------\n');
    } catch (err) {
      console.log(`❌ เคส ${finalData.applicationNo} ล้มเหลว: ${err.message}`);
      console.log('----------------------------------------\n');
      // กลับหน้าหลักก่อนทำเคสต่อไป
      await page.goto('https://uat-intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
      continue;
    }
  }

  console.log('✅ ทำครบทุกเคสแล้ว!');
});
