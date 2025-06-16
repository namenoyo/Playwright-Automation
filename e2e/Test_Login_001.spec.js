const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');
const { validUser } = require('../data/login.data');


// อ่าน ENV จาก process.env.ENV (เช่น ENV=uat npx playwright test ...)
const ENV = process.env.ENV || 'sit';

test('Test_Login_001', async ({ page }) => {
  const loginPage = new LoginPage(page, ENV);
  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  // สามารถเพิ่ม expect ตรวจสอบหลัง login ได้ เช่น
  // await expect(page).toHaveURL(/dashboard|home|main/);
});

