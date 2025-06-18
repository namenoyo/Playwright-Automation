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
const { logSelectorsSoftAssert } = require('../Reuseable/log_selector');
// @ts-ignore
const { checkValueOnScreen } = require('../utils/check-value.helper');

const CIS_Search = require('../locators/CIS_Search.locator.js');
const ENV = process.env.ENV || 'sit';

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
    //await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

    // ใช้ logSelectorsSoftAssert จาก log_selector.js
    const result = await logSelectorsSoftAssert(page, selectorsToCheck, true);
    assertionLog = result.assertionLog;
    if (result.status === 'Failed') status = 'Failed';
  } catch (e) {
    status = 'Failed';
    errorMessage = e.message || String(e);
    throw e;
  } finally {
    // ส่งผลลัพธ์ไป Google Sheet ด้วยฟังก์ชันกลาง
    // เว้นบรรทัด log แบบมีบรรทัดว่างระหว่างแต่ละรายการ (\r\n)
    await require('../utils/upload-result.helper').uploadTestResultToGoogleSheet({
      testInfo,
      assertionLog: assertionLog.replace(/\n/g, '\r\n'),
      status,
      errorMessage
    });
  }
});

// test('TS_Test_CheckValueOnScreen', async ({ page }, testInfo) => {
//   timestamp: testInfo.setTimeout(60000); // Set timeout for the test
//   const loginPage = new LoginPage(page, ENV);
//   const cisPage = new CISPage(page);
//   let status = 'Passed';
//   let errorMessage = '';
//   let assertionLog = '';
//   // ตัวอย่าง expected values (ควรดึงจาก data จริงหรือ mock data)
//   const selectorsWithExpected = [
//     { label: 'Policy Number', locator: page => Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_11_Detail_Panel(page), expected: policyNo },
//     { label: 'Customer Number', locator: page => page.locator(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_2_Detail_Panel), expected: 2157384, matchType: 'contain' },
    
//     // เพิ่ม expected value อื่นๆ ได้ที่นี่
//   ];
//   try {
//     await loginPage.goto();
//     await loginPage.login(validUser.username, validUser.password);
//     await cisPage.goToCustomerInfo();
//     const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
//     await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

//     // เรียกใช้ฟังก์ชันใหม่ที่เพิ่มเข้ามา
//     const { results, status: checkStatus, assertionLog: checkLog } = await require('../utils/check-value.helper').checkSelectorsWithExpected(page, selectorsWithExpected);
//     assertionLog = checkLog;
//     if (checkStatus === 'Failed') status = 'Failed';
//     // Assertion แบบละเอียด (soft assert)
//     let failedAssertions = [];
//     let assertionLogArr = [];
//     for (const r of results) {
//       let pass = false;
//       let logLine = '';
//       try {
//         if (r.matchType === 'contain') {
//           expect(r.actual).toContain(String(r.expected));
//           pass = true;
//         } else {
//           expect(r.actual).toBe(String(r.expected));
//           pass = true;
//         }
//       } catch (err) {
//         pass = false;
//         failedAssertions.push(`[${r.label}] expected: "${r.expected}" (${r.matchType}), actual: "${r.actual}"`);
//         // log warning แต่ไม่ throw
//         console.warn('Soft assertion failed:', r.label, r.expected, r.actual);
//       }
//       if (pass) {
//         logLine = `✅ PASS: [${r.label}] expected: "${r.expected}" (${r.matchType}), actual: "${r.actual}"`;
//       } else {
//         logLine = `❌ FAIL: [${r.label}] expected: "${r.expected}" (${r.matchType}), actual: "${r.actual}"`;
//       }
//       assertionLogArr.push(logLine);
//     }
//     assertionLog = assertionLogArr.join('\n');
//     // แสดง assertion log ทั้งตอนผ่านและ fail
//     console.log('Assertion Results:', assertionLog);
//     if (failedAssertions.length > 0) {
//       throw new Error('Soft assertion(s) failed:\n' + failedAssertions.join('\n---\n'));
//     }
//   } catch (e) {
//     status = 'Failed';
//     errorMessage = e.message || String(e);
//     throw e;
//   } finally {
//     // ส่งผลลัพธ์ไป Google Sheet ด้วยฟังก์ชันกลาง
//     await require('../utils/upload-result.helper').uploadTestResultToGoogleSheet({
//       testInfo,
//       assertionLog,
//       status,
//       errorMessage
//     });
//   }
// });