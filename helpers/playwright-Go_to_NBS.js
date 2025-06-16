// playwright-Go_to_NBS.js
// ฟังก์ชัน Login สำหรับ Playwright
const Selector = require('../fixtures/Selector');
const Data_Username = require('../fixtures/Data_Username');

async function login(page, username, password, url) {
  await page.goto(url);
  await page.fill(Selector.usernameInput, username);
  await page.fill(Selector.passwordInput, password);
  await page.click(Selector.loginButton);
  await page.waitForTimeout(1000);
}

async function Go_to_NBS(page, { url, userIndex = 0 } = {}) {
  if (!url) throw new Error('ต้องระบุ url สำหรับ Go_to_NBS');
  const testUser = Data_Username[userIndex];
  if (!testUser) throw new Error('ไม่พบ user index ที่ระบุใน Data_Username.js');
  await login(page, testUser.username, testUser.password, url);
  await page.waitForTimeout(2000);
}

module.exports = { Go_to_NBS, login };
