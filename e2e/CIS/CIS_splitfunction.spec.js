import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/login_t.page.js';
import { gotoMenu } from '../../pages/menu.page.js';
import { searchCustomerCIS, detailCustomerCIS } from "../../pages/CIS/customer_cis.page.js";
import { loginData } from '../../data/login_t.data.js';
import { customerCISData, customerCISDataArraykey } from '../data/CIS/customer_cis.data.js'
import { customerCISDataArraykey_label } from '../data/cis_array_full.data.js'
import { detailcustomerCISLocatorsArraykey } from "../../locators/CIS/CIS_Search_Master.locator.js";
import { LogoutPage } from '../../pages/logout.page.js';
import { sendTestResultToGoogleSheetGSAppScript, sendBatchTestResultToGoogleSheetGSAppScript } from '../../utils/google-sheet-gsappscript.helper.js';
import { mapsdataArray } from '../../utils/maps-data.js';
import { uploadGoogleSheet } from '../../utils/uploadresult-google-sheet.js';

test.describe('Loop at data - ไม่มีหัว', () => {

    const customercisdataarraykey = customerCISDataArraykey;

    // loop ตามข้อมูล data เป็นหลัก
    for (const row of customercisdataarraykey) {

        test(`CIS test check data (เลขกรมธรรม์ : ${row.policy_no})`, async ({ page }) => {
            // ตั้งค่า timeout สำหรับการทดสอบ
            test.setTimeout(120000); // 120 วินาที

            // Page
            const loginPage = new LoginPage(page);
            const gotomenu = new gotoMenu(page, expect);
            const searchcustomercis = new searchCustomerCIS(page, expect);
            const detailcustomercis = new detailCustomerCIS(page, expect);
            const logoutpage = new LogoutPage(page, expect);

            // Data
            const logindata = loginData;
            const customercisdata = customerCISData;
            const detailcustomercislocatorsarraykey = detailcustomerCISLocatorsArraykey(page);

            // ไปยังหน้า NBS
            await loginPage.gotoNBS();
            // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
            await loginPage.login(logindata.username, logindata.password);

            // ไปยังเมนู "ลูกค้าสัมพันธ์" > "ระบบ CIS" > "ข้อมูลลูกค้า"
            await gotomenu.menuAll('ลูกค้าสัมพันธ์', 'ระบบ CIS', 'ข้อมูลลูกค้า');

            // ค้นหาข้อมูลลูกค้า
            await searchcustomercis.searchCustomer(row.policy_no);
            // คลิกรายละเอียดลูกค้า
            await searchcustomercis.clickdetailCustomer();

            // Process map key ระหว่างไฟล์ และเช็คข้อมูล expected และ ข้อมูลบนหน้าจอ
            console.log('เลขกรมธรรม์ :', row.policy_no)
            // loop ตาม selector โดยเก็บ property ใน object มาไว้ใน key
            for (const key in detailcustomercislocatorsarraykey) {
                // ดึงข้อมูลจาก locator โดยหา property ที่ตรงกันมาแสดง
                const locator = detailcustomercislocatorsarraykey[key]
                // ดึงข้อมูลจาก expectedvalue โดยหา property ที่ตรงกันมาแสดง
                const expectedvalue = row[key]
                // เช็คเงื่อนไขกรณีที่ถ้า locator หรือ expectedvalue ไม่มี property ที่ตรงกันจะให้ข้ามการเช็คไป
                if (locator != undefined && expectedvalue != undefined) {
                    // เช็คเงื่อนไข ถ้ามีข้อมูลมากกว่า 1 แสดงว่าเป็นข้อมูล data grid
                    if (expectedvalue.length > 1) {
                        // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ Data Grid td
                        // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                        for (let i = 0; i < expectedvalue.length; i++) {
                            // ดึงบรรทัดตามเลข loop
                            const row = locator.nth(i);
                            // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
                            const cells = row.locator('td');
                            // นับจำนวน tag td ที่อยู่ในบรรทัด
                            const cellcount = await cells.count();
                            console.log('ข้อมูล Row', i + 1)

                            // ตรวจสอบ column แต่ละช่อง
                            for (let j = 1; j < cellcount; j += 2) {
                                // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
                                const cell = await cells.nth(j);
                                // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
                                let changeindexdata = (j / 2) - 0.5
                                // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                                await detailcustomercis.checkdatadetailCIS(cell, expectedvalue[i][changeindexdata]);
                            }
                            console.log('')
                        }
                    } else {
                        // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
                        // loop ตามข้อมูล data ใน array
                        for (const expectedarray of expectedvalue) {
                            // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                            await detailcustomercis.checkdatadetailCIS(locator, expectedarray);
                        }
                        console.log('')
                    }
                } else { }
            }

            await logoutpage.logoutNBSPortal();

            // // ดึง row ทั้งหมดใน tbody
            // const rows = page.locator('tbody.MuiTableBody-root').nth(12).locator('tr')
            // // นับจำนวน row ที่ดึงมา
            // const rowcount = await rows.count()
            // // แสดงจำนวน row ที่ดึงมา
            // console.log(rowcount)

            // // loop ตรวจสอบแต่ละ cell ในแต่ละ row
            // for (let i = 0; i < dataarray.length; i++) {
            //     // ดึงบรรทัดตามเลข loop
            //     const row = rows.nth(i);
            //     // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
            //     const cells = row.locator('td');
            //     // นับจำนวน tag td ที่อยู่ในบรรทัด
            //     const cellcount = await cells.count();

            //     // ตรวจสอบ column แต่ละช่อง
            //     for (let j = 1; j < cellcount; j += 2) {
            //         // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
            //         const cell = await cells.nth(j).textContent();
            //         console.log(j)
            //         // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
            //         let changeindexdata = (j/2)-0.5
            //         console.log(changeindexdata)
            //         console.log(cell)
            //         console.log(dataarray[i][changeindexdata])
            //     }
            // }

        });
    }
})

test.describe('Loop at data - มีหัว', () => {

    const customercisdataarraykey = customerCISDataArraykey_label;

    // loop ตามข้อมูล data เป็นหลัก และเพิ่มเลข index เข้ามา
    for (const [index, row] of customercisdataarraykey.entries()) {

        test(`CIS test check data (เลขกรมธรรม์ : ${row.policy_no})`, async ({ page }, testinfo) => {
            // ตั้งค่า timeout สำหรับการทดสอบ
            test.setTimeout(120000); // 120 วินาที

            // Page
            const loginPage = new LoginPage(page);
            const gotomenu = new gotoMenu(page, expect);
            const searchcustomercis = new searchCustomerCIS(page, expect);
            const logoutpage = new LogoutPage(page, expect);
            const mapsdataarray = new mapsdataArray(page, expect);
            const uploadgooglesheet = new uploadGoogleSheet(page, expect);

            // Data
            const logindata = loginData;
            const detailcustomercislocatorsarraykey = detailcustomerCISLocatorsArraykey(page);

            // ไปยังหน้า NBS
            await loginPage.gotoNBS();
            // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
            await loginPage.login(logindata.username, logindata.password);

            // ไปยังเมนู "ลูกค้าสัมพันธ์" > "ระบบ CIS" > "ข้อมูลลูกค้า"
            await gotomenu.menuAll('ลูกค้าสัมพันธ์', 'ระบบ CIS', 'ข้อมูลลูกค้า');

            // ค้นหาข้อมูลลูกค้า
            await searchcustomercis.searchCustomer(row.policy_no);
            // คลิกรายละเอียดลูกค้า
            await searchcustomercis.clickdetailCustomer();

            // Process map key ระหว่างไฟล์ และเช็คข้อมูล expected และ ข้อมูลบนหน้าจอ
            console.log('เลขกรมธรรม์ :', row.policy_no)

            // loop ตาม selector โดยเก็บ property ใน object มาไว้ใน key (function)
            const result_function_maps = await mapsdataarray.mapsdataarrayfile_checkdata(detailcustomercislocatorsarraykey, row);

            // ออกจากระบบ
            await logoutpage.logoutNBSPortal();

            // upload data ขึ้น google sheet (function)
            await uploadgooglesheet.uploaddatatoGoogleSheet(result_function_maps.status_result_array, result_function_maps.assertion_result_array, testinfo);

        });
    }
})