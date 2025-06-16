// playwright-Go_to_CIS.js
// ฟังก์ชันไปหน้า CIS สำหรับ Playwright
const Selector = require('../fixtures/Selector');

async function Go_to_CIS(page) {
  // Assume already logged in before calling this function
  await page.click(Selector.SELECTOR_CIS_MENU_SUB_1_Navigate_1_Menu_Bar_Label, { force: true });
  await page.waitForTimeout(500);
  await page.click(Selector.SELECTOR_CIS_MENU_SUB_1_Navigate_2_Menu_Bar_Label, { force: true });
  await page.waitForTimeout(1000);
  await page.click(Selector.SELECTOR_CIS_MENU_SUB_1_Navigate_3_Menu_Bar_Label, { force: true });
  await page.waitForTimeout(1000);
}

module.exports = { Go_to_CIS };
