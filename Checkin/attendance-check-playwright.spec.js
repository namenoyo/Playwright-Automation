//attendance-check-playwright.js
const { test, expect } = require('@playwright/test');

// ฟังก์ชัน sniperClickByRole สำหรับคลิก element เป้าหมายทันทีที่ปรากฏ
async function sniperClickByRole(page, role, name) {
  await page.getByRole(role, { name }).waitFor({ state: 'visible' });
  await page.getByRole(role, { name }).click();
}

test('check attendance table', async ({ page }) => {
  // STEP 1: ไปหน้า Login
  await page.goto('https://intranet-api.ochi.link/thaisamut/pub/nbsportal/login.html');

  // STEP 2: กรอก username/password
  await page.fill('#username', 'rangsiman.ph');
  await page.fill('#password', 'Ocean@202506');

  // STEP 2.5: คลิกปุ่ม "เข้าสู่ระบบ" (ใช้ sniperClickByRole หรือ getByRole ตรง ๆ ก็ได้)
  await sniperClickByRole(page, 'button', 'เข้าสู่ระบบ');

  // STEP 3: รอให้ form login หายไป (หรือ selector ใหม่ปรากฏ)
  await page.waitForSelector('#root > div > div > div:nth-child(1) > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-true > div > div:nth-child(2) > div > form', { state: 'detached', timeout: 60000 });

  // STEP 4: ไปหน้า Dashboard
  await page.goto('https://intranet-api.ochi.link/thaisamut/web/sonar/index.html#dashboard', { waitUntil: 'networkidle' });

  // STEP 5: ไปหน้า manage-attendance
  await page.goto('https://intranet-api.ochi.link/thaisamut/web/sonar/index.html#management/manage-attendance', { waitUntil: 'networkidle' });

  // STEP 6: รอให้ form โหลด
  await page.waitForSelector('#tab\\/management\\/manage-attendance > div > div > div:nth-child(1) button');

  // STEP 7: คลิกปุ่ม "ค้นหา"
  await page.click('#tab\\/management\\/manage-attendance > div > div > div:nth-child(1) > div > div.MuiCollapse-container.MuiCollapse-entered > div > div > div > div > form > div > div > div > div > div > div > div > div > div.MuiGrid-root.jss1126.basicActionComponent.MuiGrid-item.MuiGrid-grid-xs-auto.MuiGrid-grid-sm-12 > div > div > div > div:nth-child(2) > button');

  // STEP 8: รอข้อมูลโหลด แล้วดึงข้อมูล DOM
  await page.waitForTimeout(2000);
  const data = await page.$$eval('table tbody tr', rows => {
    return rows.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText));
  });
  console.log('ข้อมูลในตาราง:', data);

  // Assertion ตัวอย่าง: ต้องมีข้อมูลในตารางอย่างน้อย 1 แถว
  expect(data.length).toBeGreaterThan(0);
});

// หมายเหตุ: ควรใช้ environment variables หรือ config file เพื่อเก็บข้อมูล login แทนการ hardcode
