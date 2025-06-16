// playwright-cis_Policy_Detail.js
// ฟังก์ชันค้นหาและเปิดรายละเอียดกรมธรรม์ในหน้า CIS สำหรับ Playwright
const Selector = require('../fixtures/Selector');

async function searchAndOpenCisPolicyDetail(page, policyNo) {
  if (!policyNo) throw new Error('ต้องระบุเลขกรมธรรม์ (policyNo)');
  await page.waitForSelector(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_1_Menu_Bar_Label, { timeout: 10000 });
  await page.locator(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_1_Menu_Bar_Label).waitFor({ state: 'visible', timeout: 10000 });
  await page.locator(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_1_Menu_Bar_Label).click();
  await page.fill(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_6_Input_Text, policyNo);
  await page.waitForTimeout(1000);
  await page.locator(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_16_Button).first().click();
  await page.waitForTimeout(3000);
  await page.locator(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_19_Button).first().click();
  await page.waitForTimeout(2000);
}

module.exports = { searchAndOpenCisPolicyDetail };
