import { test, expect } from '@playwright/test';
// @ts-ignore
const { LoginPage } = require('../pages/login.page.js');
// @ts-ignore
const { CISPage } = require('../pages/cis.page.js');
// @ts-ignore
const { validUser } = require('../data/login.data.js');
// @ts-ignore
const { policyNo } = require('../data/cis.data.js');
// @ts-ignore
const { sendTestResultToGoogleSheetGSAppScript } = require('../utils/google-sheet-gsappscript.helper.js');
const { logSelectorsSoftAssert } = require('../Reuseable/log_selector.js');
const CIS_Search = require('../locators/CIS_Search.locator.js');
const ENV = process.env.ENV || 'sit';
const SHEET_NAME = 'Selector_check';

// สร้าง selectorsToCheck อัตโนมัติจาก CIS_Search.locator.js
const selectorsToCheck = Object.entries(CIS_Search).map(([key, selector]) => {
  // ถ้าเป็น function (locator function)
  if (typeof selector === 'function') {
    return { label: key, locator: selector };
  }
  // ถ้าเป็น string selector
  return { label: key, locator: page => page.locator(selector) };
});

test('TS_Test_Element', async ({ page }, testInfo) => {
  testInfo.setTimeout(60000); // Set timeout for the test
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
    // ใช้ logSelectorsSoftAssert จาก log_selector.js
    const result = await logSelectorsSoftAssert(page, selectorsToCheck, true);
    assertionLog = result.assertionLog;
    if (result.status === 'Failed') status = 'Failed';

    // อัปโหลดผลลัพธ์ไปยัง Google Sheet tab Selector_check (แบบ assertion log รวม)
    await sendTestResultToGoogleSheetGSAppScript({
      suite: SHEET_NAME,
      caseName: testInfo.title,
      assertionLog,
      status,
      testTime: new Date().toLocaleString(),
      tester: process.env.TESTER || 'Auto',
      duration: testInfo.duration,
      errorMessage
    });
  } catch (e) {
    status = 'Failed';
    errorMessage = e.message || String(e);
    throw e;
  }
});

