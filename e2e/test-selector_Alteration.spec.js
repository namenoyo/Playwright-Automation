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

test('TS_Test_Element_Alteration', async ({ page }, testInfo) => {
  testInfo.setTimeout(60 * 60 * 1000); // เพิ่ม timeout รวมเป็น 1 ชั่วโมง (3600000 ms)
  const loginPage = new LoginPage(page, ENV);
  const cisPage = new CISPage(page);
  let status = 'Passed';
  let errorMessage = '';
  let assertionLog = '';
  try {
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);
    // await cisPage.goToCustomerInfo();
    // const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
    // await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

// คลิกเมนู "ระบบงาน NBS Portal"
    const nbsMenu = await page.getByRole('menuitem', { name: 'ระบบงาน NBS Portal' });
    await nbsMenu.click();
    
    // กดปุ่มลูกศรลง 1 ครั้ง แล้วคลิกที่ element ที่ถูก Hilight (focused)
    await nbsMenu.press('ArrowDown');
    const focused = await page.locator(':focus');
    await focused.click({ force: true });

  // พิมพ์ "Automatic Alteration" ในช่องค้นหาเมนู
    const textSearchInput = await page.locator('#textSearch');
    await textSearchInput.waitFor({ state: 'visible' });
    await textSearchInput.fill('Automatic Alteration');
    // คลิกที่ div ที่มี label "Automatic Alteration"
    const alterationDiv = await page.locator('p.MuiTypography-root', { hasText: 'Automatic Alteration' });
    await alterationDiv.waitFor({ state: 'visible' });
    // คลิก parent div ที่เป็นปุ่มเมนู
    const clickableDiv = await alterationDiv.locator('xpath=ancestor::div[contains(@class, "jss74")]');
    await clickableDiv.click();

    // คลิกเมนู "ค้นหาใบสอบถาม"
    const searchMenu = await page.locator('span.MuiButton-label', { hasText: 'ค้นหาใบสอบถาม' });
    await searchMenu.waitFor({ state: 'visible' });
    await searchMenu.click();

    // ระบุวันที่ name="inquiryDateFrom" เป็น 01/07/2568
    const dateFromInput = await page.locator('input[name="inquiryDateFrom"]');
    await dateFromInput.waitFor({ state: 'visible' });
    await dateFromInput.fill('01/07/2568');

    // คลิก input และพิมพ์เลข policyNo
    const policyInput = await page.locator('div:nth-child(9) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input')
    await policyInput.click();
    await policyInput.fill(policyNo);

    // รอ 1 วินาที
    await page.waitForTimeout(1000);

    // กดปุ่มค้นหา id="searchBtn"
    const searchBtn = await page.locator('#searchBtn');
    await searchBtn.waitFor({ state: 'visible' });
    await searchBtn.click();

    // คลิกไอคอนดูรายละเอียดการสอบถามสลักหลัง
    const detailIcon = await page.locator('i.mdi.mdi-file-document[title="ดูรายละเอียดการสอบถามสลักหลัง"]');
    await detailIcon.waitFor({ state: 'visible' });
    await detailIcon.click();

    // รอจนกว่า API alteration จะโหลดเสร็จ (เช่นรอ network idle หรือรอ response เฉพาะ)
    // รอจนกว่า element หลักของ alteration panel จะปรากฏ (DOM พร้อมใช้งานจริง)
    await page.waitForSelector('#section-policy-view p', { state: 'visible', timeout: 10000 });




    // ตรวจสอบ locator จาก Alteration_1.locator.js
    const AlterationLocators = require('../locators/Alteration_1.locator.js');
    const allAlterationSelectors = Object.entries(AlterationLocators).map(([key, selector]) => {
      if (typeof selector === 'function') {
        return { label: key, locator: selector };
      }
      return { label: key, locator: page => page.locator(selector) };
    });
    const selectorChunks = chunkArray(allAlterationSelectors, 10);
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

