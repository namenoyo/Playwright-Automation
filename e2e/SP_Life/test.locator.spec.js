const { test, expect } = require('@playwright/test');

test('SP Life Login - Username and Password', async ({ page }) => {
	// 1. เข้าเว็บไซต์
	await page.goto('https://sp-life-sit.ochi.link/thaisamut/pub/splife/login.html');

    // สามารถระบุ กรอบตั้งต้นได้ก่อน แล้วค่อยระบุข้อความที่ต้องการค้นหา
    await page.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'ชื่อผู้ใช้' }).getByRole('textbox').fill('your_username');

    await page.locator('div', { hasText: "ชื่อผู้ใช้​"}).getByPlaceholder("กรุณาใส่ชื่อผู้ใช้")

	// // 2. กรอก username โดยใช้ placeholder
	// await page.getByPlaceholder('กรุณาใส่ชื่อผู้ใช้').fill('your_username');

	// 3. กรอก password โดยใช้ placeholder
	await page.getByPlaceholder('กรุณาใส่รหัสผ่าน').fill('your_password');

    // สามารถระบุ กรอบตั้งต้นได้ก่อน แล้วค่อยระบุข้อความที่ต้องการค้นหา
    await page.locator('div[class="MuiBox-root css-1bjyopm"]', { hasText: 'หน้าหลัก'}).getByRole('button', { name: 'สร้างใบเสนอราคา'}).click();

    await page.getByRole('button', { name: 'สร้างใบเสนอราคา' }).click();

    await page.getByRole('radio', { name: 'ใบสรุปการทำประกันชีวิต' }).click();

	// ถ้าต้องการคลิกปุ่มเข้าสู่ระบบ ให้ uncomment บรรทัดนี้
	// await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

	// สามารถเพิ่ม assertion ตรวจสอบผลลัพธ์ได้ที่นี่
});
