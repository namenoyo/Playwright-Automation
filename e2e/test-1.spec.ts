import { test, expect } from '@playwright/test';
// @ts-ignore
const { LoginPage } = require('../pages/login.page');
// @ts-ignore
const { CISPage } = require('../pages/cis.page');
// @ts-ignore
const { validUser } = require('../data/login.data');
// @ts-ignore
const { policyNo } = require('../data/cis.data');
// @ts-ignore
const { sendTestResultToGoogleSheetGSAppScript } = require('../utils/google-sheet-gsappscript.helper');
// @ts-ignore
const { logSelectorsSoftAssert } = require('../Reuseable/log');
const Selector = require('../locators/Selector.locator');

const ENV = process.env.ENV || 'sit';

// ตัวอย่าง selector test (ควรปรับให้เหมาะกับระบบจริง)
const selectorsToCheck = [
  { label: 'Customer Name', locator: page => page.locator(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_1_Header_Panel) },
  { label: 'Policy Number', locator: page => Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_11_Detail_Panel(page) },
  // เพิ่ม locator อื่นๆ ได้ที่นี่
];

test('TS_Test_Google-Sheet', async ({ page }, testInfo) => {
  timestamp: testInfo.setTimeout(60000); // Set timeout for the test
  const loginPage = new LoginPage(page, ENV);
  const cisPage = new CISPage(page);
  let status = 'Passed';
  let errorMessage = '';
  let assertionLog = '';
  try {
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);
    await cisPage.goToCustomerInfo();
    const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
    await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

    // เรียกใช้ฟังก์ชันกลาง logSelectorsSoftAssert (แบบ locator function)
    const result = await logSelectorsSoftAssert(page, selectorsToCheck, true);
    assertionLog = result.assertionLog;
    if (result.status === 'Failed') status = 'Failed';
  } catch (e) {
    status = 'Failed';
    errorMessage = e.message || String(e);
    throw e;
  } finally {
    // ส่งผลลัพธ์ไป Google Sheet พร้อม assertion log
    await sendTestResultToGoogleSheetGSAppScript({
      suite: 'CIS Suite',
      caseName: testInfo.title,
      assertionLog,
      status,
      testTime: new Date().toLocaleString(),
      tester: process.env.TESTER || 'Auto',
      duration: testInfo.duration,
      errorMessage
    });
  }
});
