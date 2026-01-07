const { test, expect } = require('@playwright/test');

import { LoginPage } from '../../pages/login_t.page.js';
import { LogoutPage } from '../../pages/logout.page.js';
import { gotoMenu } from '../../pages/menu.page.js';

// Google Sheet
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper.js');

test('Generate Thai QR Code', async ({ page }, testInfo) => {
     // เริ่มทำการทดสอบ
    const loginPage = new LoginPage(page);
    const logoutPage = new LogoutPage(page, expect);
    const gotomenu = new gotoMenu(page, expect);

    let data_generate_thaiqr = [];

    // Fetch data from Google Sheets before all tests
    const googlesheet = new GoogleSheet();
    const auth = await googlesheet.initAuth();
    const spreadsheetId = '1wgKxAGcbS8V4gKY-n0A_Qi3QGe2IVusJQ56F3vYbtPU';
    const readrange = `Data Generate Thai QR!A1:ZZ1000000`;
    data_generate_thaiqr = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);

    const sheetnamewrite = `Data Generate Thai QR`;
    const range_write = `A1:ZZ`;

    const username = 'boss'
    const password = '0'

    // ไปยังหน้า NBS
    await loginPage.gotoNBS();
    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
    await loginPage.login(username, password);

    // ไปยังเมนู "ลูกค้าสัมพันธ์" > "ระบบ CIS" > "ข้อมูลลูกค้า"
    await gotomenu.menuAll('ระบบงาน Back Office', 'ระบบ Centralized SMS', 'Centralized SMS ลูกค้า', 'ส่ง SMS แจ้งเตือนชำระเบี้ย (Barcode)');
    // รอให้หน้าโหลดเสร็จสมบูรณ์
    await page.waitForLoadState('networkidle');

    for (const [index, data] of data_generate_thaiqr.entries()) {
        // เตรียมตัวแปรเก็บผลลัพธ์
        let data_create = [];

        // ชื่อ header key สำหรับการอ้างอิงข้อมูล
        const uniquekey = 'No';
        const row_header = 1; // บวก 4 เพราะข้อมูลเริ่มที่แถวที่ 4 ใน Google Sheet

        const row_uniquekey = data['No'];
        const policyNo = data['Policy No'];
        const status_generate_thai_qr = data['Status Generate Thai QR'];

        if (status_generate_thai_qr === 'Waiting for Generate' || status_generate_thai_qr === 'In Progress') {
            try {
                // อัพเดท Process เป็น 'In Progress'
                data_create.push({ [uniquekey]: row_uniquekey, "Status Generate Thai QR": 'In Progress', Remark: '' });
                // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                // เคลียร์ array หลังอัพโหลด
                data_create = [];

                // กรอกเลขกรมธรรม์
                await page.locator('input[name="criteria.policyNo"]').fill(policyNo);
                await page.waitForTimeout(500);
                // รอให้ api โหลดเสร็จ
                await Promise.all([
                    page.waitForResponse(response =>
                        response.url().includes('/nbsweb/secure/remoteaction/epirusapp/barcode-premium-notice/search.html') && response.status() === 200
                    ),
                    // คลิกปุ่มค้นหา
                    await page.locator('button:has-text("ค้นหา")').click(),
                ], { timeout: 60000 }); // รอไม่เกิน 60 วินาที

                const find_popupmobile = page.locator('#mobilephone-panel');
                if (await find_popupmobile.isVisible()) {
                    // กรอก หมายเลขโทรศัพท์มือถือ
                    await page.locator('#mobilephone-panel').locator('#mobilephone').fill('0812345678');
                    await page.waitForTimeout(500);
                    // กดปุ่ม ตกลง
                    await page.locator('#mobilephone-panel').locator('button:has-text("ตกลง")').click();
                    await expect(find_popupmobile).not.toBeVisible();
                }

                // อัพเดท Process เป็น 'Finish'
                data_create.push({ [uniquekey]: row_uniquekey, "Status Generate Thai QR": 'Finish', Remark: 'ทำการ Generate Thai QR สำเร็จ' });
                // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                // เคลียร์ array หลังอัพโหลด
                data_create = [];

            } catch (error) {
                if (testInfo.retry === testInfo.project.retries) { // ถ้าเป็นการรันครั้งสุดท้าย (ไม่ว่าจะผ่านหรือไม่ผ่าน)
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // อัพเดท Remark เป็น error.message
                    data_create.push({ [uniquekey]: row_uniquekey, "Status Generate Thai QR": 'Error', Remark: error.message });
                    // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                    await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                    // เคลียร์ array หลังอัพโหลด
                    data_create = [];
                }
                throw error; // ต้องโยนออกไปให้ระบบนับว่า fail จะได้ retry
            }
        }

    }
});