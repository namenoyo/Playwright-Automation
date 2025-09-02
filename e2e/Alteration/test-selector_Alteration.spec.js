import { test, expect } from '@playwright/test';
// @ts-ignore
const { LoginPage } = require('../../pages/login.page.js');
// @ts-ignore
const { CISPage } = require('../../pages/CIS/cis.page.js');
// @ts-ignore
const { validUser } = require('../../data/login.data.js');
// @ts-ignore
const { policyNumbers } = require('../../data/CIS/cis.data.js');
// @ts-ignore
const { sendTestResultToGoogleSheetGSAppScript } = require('../../utils/google-sheet-gsappscript.helper.js');
const { logSelectorsSoftAssert } = require('../../Reuseable/log_selector.js');
const CIS_Search = require('../../locators/CIS/CIS_Search.locator.js');
const ENV = process.env.ENV || 'sit';
const SHEET_NAME = 'Selector_check';


// สำหรับตรวจสอบเฉพาะ Selector เท่านั้น ว่าใช้งานได้ปกติหรือไม่ 
// และวางผลใน Google Sheet Tab upload-to-sheet_Playwright ไฟล์ https://docs.google.com/spreadsheets/d/1kqtNcJh9Co5eS2jlaaLzYjYFVLiS3OMIJanJTN4-6Tg/edit?gid=1685498397#gid=1685498397

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

// วนลูปทุก policyNo
for (const { policyNo } of policyNumbers) {
  test(`TS_Test_Element_Alteration - ${policyNo}`, async ({ page }, testInfo) => {
    testInfo.setTimeout(60 * 60 * 1000); // เพิ่ม timeout รวมเป็น 1 ชั่วโมง (3600000 ms)
    const loginPage = new LoginPage(page, ENV);
    const cisPage = new CISPage(page);
    let status = 'Passed';
    let errorMessage = '';
    let assertionLog = '';
    try {
      await loginPage.goto();
      await loginPage.login(validUser.username, validUser.password);

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
      await dateFromInput.clear();
      await dateFromInput.type('01072568', { delay: 200 }); /// delay 100 ms ต่อ key
    
      
      // await dateFromInput.isVisible();
   
      // ระบุวันที่ name="inquiryDateTo" เป็น 31/07/2568
      const dateToInput = await page.locator('input[id="inquiryDateTo"]');
      await dateToInput.waitFor({ state: 'visible' });
      await dateToInput.clear();
      await dateToInput.type('31072568', { delay: 200 });
      // await dateToInput.isVisible();


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

      // รอ icon ดูรายละเอียด ถ้าไม่เจอภายใน 10 วินาที ให้ fail และข้าม
      const detailIcon = await page.locator('i.mdi.mdi-file-document[title="ดูรายละเอียดการสอบถามสลักหลัง"]');
      let foundDetailIcon = true;
      try {
        await detailIcon.waitFor({ state: 'visible', timeout: 10000 });
      } catch (e) {
        foundDetailIcon = false;
      }
      if (!foundDetailIcon) {
        status = 'Failed';
        errorMessage = 'ค้นหาไม่พบรายละเอียดการสอบถามสลักหลัง';
        console.error(`Test failed for policyNo ${policyNo}:`, errorMessage);
        await sendTestResultToGoogleSheetGSAppScript({
          suite: SHEET_NAME,
          caseName: `TS_Test_Element_Alteration - ${policyNo} (ERROR)` ,
          assertionLog: 'ค้นหาไม่พบรายละเอียดการสอบถามสลักหลัง',
          status: 'Failed',
          testTime: new Date().toLocaleString(),
          tester: process.env.TESTER || 'Auto',
          duration: '',
          errorMessage
        });
        return; // ข้ามไป test ถัดไป
      }
      await detailIcon.click();

      // รอจนกว่า API alteration จะโหลดเสร็จ (เช่นรอ network idle หรือรอ response เฉพาะ)
      // รอจนกว่า element หลักของ alteration panel จะปรากฏ (DOM พร้อมใช้งานจริง)
      await page.waitForSelector('#section-policy-view p', { state: 'visible', timeout: 10000 });

      const doc_detailButton = await page.locator('div.MuiCollapse-wrapper').last().locator('tbody.MuiTableBody-root button').nth(0);
      const doc_detailButton1 = await page.locator('div.MuiCollapse-wrapper').last().locator('tbody.MuiTableBody-root button').nth(1);
      // ตรวจสอบ locator จาก Alteration_1.locator.js
      const AlterationLocators = require('../../locators/Alteration/Alteration_1.locator.js');
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
      console.error(`Test failed for policyNo ${policyNo}:`, errorMessage);
      // อัปโหลด log fail ไป Google Sheet ด้วย
      await sendTestResultToGoogleSheetGSAppScript({
        suite: SHEET_NAME,
        caseName: `TS_Test_Element_Alteration - ${policyNo} (ERROR)`,
        assertionLog: '',
        status: 'Failed',
        testTime: new Date().toLocaleString(),
        tester: process.env.TESTER || 'Auto',
        duration: '',
        errorMessage
      });
      // ไม่ throw error ออกไป จะได้ข้ามไป test data ถัดไป
    }
  });
}

