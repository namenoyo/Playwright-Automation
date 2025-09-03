import { test, expect } from '@playwright/test';
// @ts-ignore
const { LoginPage } = require('../pages/login.page.js');
// @ts-ignore
const { CISPage } = require('../pages/CIS/cis.page.js');
// @ts-ignore
const { validUser } = require('../data/login.data.js');
// @ts-ignore
const { policyNo } = require('../data/CIS/cis.data.js');
// @ts-ignore
const { sendTestResultToGoogleSheetGSAppScript } = require('../utils/google-sheet-gsappscript.helper.js');
const { logSelectorsSoftAssert } = require('../Reuseable/log_selector.js');
const CIS_Search = require('../locators/CIS/CIS_Search.locator.js');
const ENV = process.env.ENV || 'sit';
const SHEET_NAME = 'Selector_check';

// เตรียม selectors ทั้งหมด
const allSelectors = Object.entries(CIS_Search).map(([key, selector]) => {
  if (typeof selector === 'function') {
    return { label: key, locator: selector };
  }
  return { label: key, locator: page => page.locator(selector) };
});

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

test('TS_Test_Element_CIS', async ({ page }, testInfo) => {
  testInfo.setTimeout(60 * 60 * 1000); // เพิ่ม timeout รวมเป็น 1 ชั่วโมง (3600000 ms)
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

    // คลิก Header Panel ก่อนตรวจสอบ selector
    const selectors = require('../locators/CIS_Search.locator.js');
    const headerPanel = selectors.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_4_In_Page_1_Header_Panel;
    if (typeof headerPanel === 'function') {
      await headerPanel(page).click();
    } else {
      await page.locator(headerPanel).click();
    }

    // แบ่ง selector เป็นกลุ่มละ 10
    const selectorChunks = chunkArray(allSelectors, 10);
    for (let i = 0; i < selectorChunks.length; i++) {
      const chunk = selectorChunks[i];
      console.log(`\n--- Checking selectors ${i * 10 + 1} - ${i * 10 + chunk.length} ---`);
      const result = await logSelectorsSoftAssert(page, chunk, true);
      assertionLog += `\n--- Batch ${i + 1} ---\n` + result.assertionLog;
      if (result.status === 'Failed') status = 'Failed';
      // อัปโหลดผลลัพธ์ไปยัง Google Sheet หลังจบแต่ละ batch
      await sendTestResultToGoogleSheetGSAppScript({
        suite: SHEET_NAME,
        caseName: `${testInfo.title} (Batch ${i + 1})`,
        assertionLog: result.assertionLog,
        status: result.status,
        testTime: new Date().toLocaleString(),
        tester: process.env.TESTER || 'Auto',
        duration: testInfo.duration,
        errorMessage
      });
    }
  } catch (e) {
    status = 'Failed';
    errorMessage = e.message || String(e);
    throw e;
  }
});

