const { test, expect } = require('@playwright/test');

const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');

// Login, menu
import { LoginPage } from '../../pages/login_t.page.js';
import { LogoutPage } from '../../pages/logout.page.js';
import { gotoMenu } from '../../pages/menu.page.js';

test('บันทึกข้อมูลเคสใหม่ (บันทึกร่าง)', async ({ page }) => {
    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    // Login
    const loginPage = new LoginPage(page, expect);
    const logoutPage = new LogoutPage(page, expect);
    // Menu
    const gotomenu = new gotoMenu(page, expect);

    let rows = [];

    // Fetch data from Google Sheets before all tests
    const googlesheet = new GoogleSheet();
    const auth = await googlesheet.initAuth();
    const spreadsheetId = '1xbBjTr6Qsg3gbBjSoUporW_5ZuKvjcMe8f2t8dJ9jak';
    const readrange = `Create New Case UL!A2:BT1000000`;
    rows = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);

    const sheetnamewrite = `Create New Case UL`;
    const range_write = `A2:BT`;

    // console.log(rows);

    for (const row of rows) {

        // กำหนดค่าตัวแปรสำหรับการทดสอบ
        const uniquekey = row['Keys row'];
        const statuscreatedata = row['Status Create Data'];
        const ulmenu = row['UL Menu'];
        const env = row['env']; // สภาพแวดล้อมการทดสอบ
        const username = row['username']; // ชื่อผู้ใช้
        const password = row['password']; // รหัสผ่าน

        if ((statuscreatedata === 'Waiting for Create Data' || statuscreatedata === 'Process for Create Data') && ulmenu === 'CRS') {

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // ไปยังหน้า NBS
            await loginPage.gotoNBSENV(env);
            // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
            await loginPage.login(username, password);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // ไปยังเมนู Unit Linked บันทึกเคสใหม่ (CRS)
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'จัดการข้อมูลเคสใหม่', 'บันทึกรายการเคสใหม่(CRS)');

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // ค้นหาข้อมูลเคสใหม่

            

            // แบ่งคอลัมน์ addreward ออกเป็น array โดยใช้ '|' เป็นตัวคั่น
            const addreward_array = row.addreward.split('|').map(r => r.trim());
            console.log(addreward_array);


            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // logout
            await logoutPage.logoutNBSWeb();

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        }
    }
});