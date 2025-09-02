import { test, expect } from '@playwright/test'

import { LoginPage } from '../../pages/login_t.page'
import { LogoutPage } from '../../pages/logout.page'
import { gotoMenu } from '../../pages/menu.page'
import { menuAlteration } from '../../pages/Alteration/menu_alteration'
import { searchAlterationAll } from '../../pages/Alteration/search_alteration'
import { mapsdataArray } from '../../utils/maps-data'
import { uploadGoogleSheet } from '../../utils/uploadresult-google-sheet'

import { loginData } from '../../data/login_t.data'
import { inquiryformArraykey_label } from '../../data/Alteration/inquiryform.data'
import { detailinquiryformLocator } from '../../locators/Alteration/alteration.locators'
// import { inquiryformArraykey_label } from '../data/Alteration/inquiryform_from_Data_Mapping.data'


/**
 * Utility สำหรับตรวจสอบ expected และแสดงผลสถานะ Match/Mismatch
 * รองรับทั้ง Locator และ string
 * @param {import('@playwright/test').Locator|string} locatorOrString - Playwright locator หรือ string
 * @param {string} expectedText - ข้อความที่คาดหวัง
 * @param {string} label - ชื่อ field สำหรับ log
 */
async function assertWithStatus(locatorOrString, expectedText, label) {
  let match = false;
  let actualText;
  let found = true;
  try {
    if (typeof locatorOrString === 'string') {
      actualText = locatorOrString;
      await expect(actualText).toBe(expectedText);
      match = true;
    } else {
      // ตรวจสอบว่ามี element จริงหรือไม่
      const count = await locatorOrString.count();
      if (count === 0) {
        found = false;
        actualText = 'Not Found';
        match = false;
      } else {
        await expect(locatorOrString).toHaveText(expectedText, { timeout: 3000 });
        actualText = await locatorOrString.textContent();
        match = true;
      }
    }
  } catch (e) {
    if (!found) {
      actualText = 'Not Found';
      match = false;
    } else {
      actualText = typeof locatorOrString === 'string' ? locatorOrString : await locatorOrString.textContent();
      match = false;
    }
  }
  const status = !found ? '⚠️ Not Found' : (match ? '✅ Match' : '❌ Mismatch');
  console.log(`${status} | ${label} | ${actualText}`);
  return match;
}


test.describe('Test_UI_DOM', () => {

    const inquiryformarraykey_label = inquiryformArraykey_label;

    const testCases = [
      {
        name: 'TC_01',
        nth: 0,
        labelExpected: 'วันที่สอบถาม',
        placeholderExpected: 'เริ่มต้น',
        alertExpected: 'กรุณาระบุวันที่เริ่มต้น'
      },
      {
        name: 'TC_02',
        nth: 1,
        labelExpected: 'วันที่สอบถาม',
        placeholderExpected: 'สิ้นสุด',
        alertExpected: 'กรุณาระบุวันที่ถึง'
      },
      {
        name: 'TC_03',
        nth: 4,
        labelExpected: 'เลขที่สอบถาม',
        placeholderExpected: 'สิ้นสุด',
        alertExpected: 'กรุณาระบุวันที่ถึง'
      },
      {
        name: 'TC_04',
        nth: 5,
        labelExpected: 'สาขาต้นสังกัด',
        placeholderExpected: 'สิ้นสุด',
        alertExpected: 'กรุณาระบุวันที่ถึง'
      }
    ];

    for (const inquiryformarray of inquiryformarraykey_label) {
        let policyno = inquiryformarray.policy_no;

        for (const tc of testCases) {
            test(`testfield_page_inquiry : ${policyno} | ${tc.name}`, async ({ page }, testinfo) => {
                test.setTimeout(120000); // 120 วินาที

                const loginpage = new LoginPage(page);
                const gotomenu = new gotoMenu(page, expect);
                const logoutpage = new LogoutPage(page, expect);
                const menualteration = new menuAlteration(page, expect);
                const searchalterationall = new searchAlterationAll(page, expect);
                const mapsdataarray = new mapsdataArray(page, expect);
                const uploadgooglesheet = new uploadGoogleSheet(page, expect);

                const logindata = loginData;
                const detailinquiryformlocator = detailinquiryformLocator(page);

                try {
                    // ไปยังหน้า NBS
                    await loginpage.gotoNBS();
                    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
                    await loginpage.login(logindata.username, logindata.password);
                    // ไปยังเมนู "ระบบงาน NBS Protal" > "Home"
                    await gotomenu.menuAll('ระบบงาน NBS Portal', 'Home');
                    // ไปเมนู ที่ทำการเลือกใน NBS Portal
                    await gotomenu.menuProtal('alteration');
                    // เลือกเมนูของ alteration
                    await menualteration.menuallAlteration('ค้นหาใบสอบถาม');

                    // ปรับให้รองรับ griditem โดยตรง
                    const gridItems = page.locator('.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.MuiGrid-grid-sm-3');
                    const dom_parent = gridItems.nth(tc.nth);
                    const label_dom_parent = dom_parent.locator('label');
                    const textbox_dom_parent = dom_parent.locator('input[type="text"]');

                    // รอให้ input ปรากฏ (timeout 10s)
                    await textbox_dom_parent.waitFor({ timeout: 10000 });
                    await textbox_dom_parent.clear();
                    await textbox_dom_parent.type('Test');
                    //await textbox_dom_parent.clear();
                    // รอให้ alert ปรากฏ (timeout 10s)
                    await dom_parent.locator('p.MuiFormHelperText-root.Mui-error').waitFor({ timeout: 10000 });

                    const placeholder = await textbox_dom_parent.getAttribute('placeholder');
                    const alert_dom_parent = dom_parent.locator('p.MuiFormHelperText-root.Mui-error');

                    await assertWithStatus(label_dom_parent, tc.labelExpected, `${tc.name} | Label`);
                    await assertWithStatus(placeholder, tc.placeholderExpected, `${tc.name} | Placeholder`);
                    await assertWithStatus(alert_dom_parent, tc.alertExpected, `${tc.name} | AlertText`);
                } catch (error) {
                    // ถ้า waitFor timeout หรือ error ให้ fail และข้าม TC
                    testinfo.fail(`TC ${tc.name} failed: ${error.message}`);
                    console.log(`❌ Fail | ${tc.name} | ${error.message}`);
                } finally {
                    // logout NBS Portal หลังจบแต่ละ TC
                    await logoutpage.logoutNBSPortal();
                }
            });
        }
    }   
});

// const main_parent = page.getByRole('dialog').locator('P').nth(0);
    
