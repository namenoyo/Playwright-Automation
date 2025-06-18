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
// @ts-ignore
const { checkValueOnScreen } = require('../utils/check-value.helper');
const cisLocators = require('../locators/cis.locator');

const ENV = process.env.ENV || 'sit';

// ตัวอย่าง selector test (ควรปรับให้เหมาะกับระบบจริง)
const selectorsToCheck = [
  { label: 'Customer Name', locator: cisLocators.customerName },
  { label: 'Policy Number', locator: cisLocators.policyNumber },
  // เพิ่ม locator อื่นๆ ได้ที่นี่
];

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

test('TS_Test_CheckValueOnScreen', async ({ page }, testInfo) => {
  timestamp: testInfo.setTimeout(60000); // Set timeout for the test
  const loginPage = new LoginPage(page, ENV);
  const cisPage = new CISPage(page);
  let status = 'Passed';
  let errorMessage = '';
  let assertionLog = '';
  // ตัวอย่าง expected values (ควรดึงจาก data จริงหรือ mock data)
  const selectorsWithExpected = [
    { label: 'Policy Number', locator: cisLocators.policyNumber, expected: policyNo },
    { label: 'Policy Number', locator: cisLocators.customerNumber, expected: policyNo },
    { label: 'Customer Number', locator: cisLocators.customerNumber, expected: '25662157384' },
    { label: 'Customer Number', locator: cisLocators.customerNumber, expected: 'เลขข้อมูลลูกค้า   25662157384' },
    // เพิ่ม expected value อื่นๆ ได้ที่นี่
  ];
  try {
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);
    await cisPage.goToCustomerInfo();
    const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
    await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

    // เรียกใช้ฟังก์ชันใหม่ที่เพิ่มเข้ามา
    const { results, status: checkStatus, assertionLog: checkLog } = await require('../utils/check-value.helper').checkSelectorsWithExpected(page, selectorsWithExpected);
    assertionLog = checkLog;
    if (checkStatus === 'Failed') status = 'Failed';
    // Assertion แบบละเอียด (auto equal/contain)
    let failedAssertions = [];
    let assertionLogArr = [];
    for (const r of results) {
      let pass = false;
      let logLine = '';
      const actualStr = String(r.actual ?? '');
      const expectedStr = String(r.expected ?? '');
      if (actualStr === expectedStr) {
        pass = true;
        logLine = `✅ PASS (equal): [${r.label}] expected: "${expectedStr}", actual: "${actualStr}"`;
      } else if (actualStr.includes(expectedStr)) {
        pass = true;
        logLine = `⚠️  Pass with condition (contain): [${r.label}] expected: "${expectedStr}", actual: "${actualStr}"`;
      } else {
        pass = false;
        logLine = `❌ FAIL: [${r.label}] expected: "${expectedStr}", actual: "${actualStr}"`;
        failedAssertions.push(logLine);
        // log warning แต่ไม่ throw
        console.warn('Soft assertion failed:', r.label, expectedStr, actualStr);
      }
      assertionLogArr.push(logLine);
    }
    assertionLog = assertionLogArr.join('\n');
    // แสดง assertion log ทั้งตอนผ่านและ fail
    console.log('Assertion Results:', assertionLog);
    if (failedAssertions.length > 0) {
      throw new Error('Soft assertion(s) failed:\n' + failedAssertions.join('\n---\n'));
    }
  } catch (e) {
    status = 'Failed';
    errorMessage = e.message || String(e);
    throw e;
  }
  // } finally {
  //   // ส่งผลลัพธ์ไป Google Sheet พร้อม assertion log
  //   await sendTestResultToGoogleSheetGSAppScript({
  //     suite: 'CIS Suite',
  //     caseName: testInfo.title,
  //     assertionLog,
  //     status,
  //     testTime: new Date().toLocaleString(),
  //     tester: process.env.TESTER || 'Auto',
  //     duration: testInfo.duration,
  //     errorMessage
  //   });
  // }
});