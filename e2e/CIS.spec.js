import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login_t.page.js';
import { gotoMenu } from '../pages/menu.page.js';
import { searchCustomerCIS, detailCustomerCIS } from "../pages/customer_cis.page.js";
import { loginData } from '../data/login_t.data.js';
import { customerCISData, customerCISDataArraykey, customerCISDataArraykey_label } from '../data/customer_cis.data.js'
import { detailcustomerCISLocatorsArraykey } from "../locators/customer_cis.locators";
import { LogoutPage } from '../pages/logout.page.js';
import { sendTestResultToGoogleSheetGSAppScript } from '../utils/google-sheet-gsappscript.helper.js';

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

            let status_result_array = []
            let assertion_result_array = []

            let result = ''

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
                    // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid
                    if (expectedvalue[0].data[0].length > 1) {
                        // แสดงข้อมูลหัวที่เช็ค
                        console.log(expectedvalue[0].label)
                        // นำข้อมูลหัวที่เช็ค เข้า array
                        assertion_result_array.push(expectedvalue[0].label)
                        // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ Data Grid td
                        // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                        for (let i = 0; i < expectedvalue[0].data.length; i++) {
                            // ดึงบรรทัดตามเลข loop
                            const row = locator.nth(i);
                            // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
                            const cells = row.locator('td');
                            // นับจำนวน tag td ที่อยู่ในบรรทัด
                            const cellcount = await cells.count();
                            // แสดงข้อมูลบรรทัด
                            console.log('ข้อมูล Row', i + 1)
                            // นำข้อมูลบรรทัด เข้า array
                            assertion_result_array.push(`ข้อมูล Row ${i + 1}`)

                            // ตรวจสอบ column แต่ละช่อง
                            for (let j = 1; j < cellcount; j += 2) {
                                // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
                                const cell = await cells.nth(j);
                                // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
                                let changeindexdata = (j / 2) - 0.5
                                // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                                result = await detailcustomercis.checkdatadetailCIS(cell, expectedvalue[0].data[i][changeindexdata]);
                                // นำค่า status ที่ return เข้า array
                                status_result_array.push(result.status_result)
                                // นำค่า assertion ที่ return เข้า array
                                assertion_result_array.push(result.assertion_result)
                            }
                        }
                        console.log('')
                        // นำค่าว่างเข้า array
                        status_result_array.push('')
                        assertion_result_array.push('')
                    } else {
                        // แสดงข้อมูลหัวที่เช็ค
                        console.log(expectedvalue[0].label)
                        assertion_result_array.push(expectedvalue[0].label)
                        // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
                        // loop ตามข้อมูล data ใน array
                        for (const [i, expectedarray] of expectedvalue.entries()) {
                            // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                            result = await detailcustomercis.checkdatadetailCIS(locator, expectedarray.data[i][i]);
                            // นำค่า status ที่ return เข้า array
                            status_result_array.push(result.status_result)
                            // นำค่า assertion ที่ return เข้า array
                            assertion_result_array.push(result.assertion_result)
                        }
                        console.log('')
                        // นำค่าว่างเข้า array
                        status_result_array.push('')
                        assertion_result_array.push('')
                    }
                } else { }
            }

            // ออกจากระบบ
            await logoutpage.logoutNBSPortal();

            // //////////////////////////////////////////////////////////// กรณี Row เดียว ////////////////////////////////////////////////////////
            // // ค้นหาสถานะการทดสอบ failed หรือไม่ และลงผลลัพธ์
            // let status_result_array_check = ''
            // if (status_result_array.includes('Failed') === true) {
            //     status_result_array_check = 'Failed'
            // } else {
            //     status_result_array_check = 'Passed'
            // }

            // // เก็บผลลัพธ์ทั้งหมดไว้ในตัวแปร เพื่อเอาไปใส่ผลใน google sheet
            // let assertion_result_format = ''
            // for (const resultlog of assertion_result_array) {
            //     assertion_result_format += resultlog + '\n'
            // }

            // // เก็บผลลัพธ์ที่ google sheet
            // await sendTestResultToGoogleSheetGSAppScript({
            //     suite: 'Test Suite',
            //     caseName: testinfo.title,
            //     assertionLog: assertion_result_format,
            //     status: status_result_array_check,
            //     tester: 'Toppy',
            //     duration: 'Test duration',
            //     errorMessage: 'Test Error'
            // })
            // //////////////////////////////////////////////////////////// กรณี Row เดียว ////////////////////////////////////////////////////////


            //////////////////////////////////////////////////////////// กรณีหลาย row ตาม label ////////////////////////////////////////////////////////
            let assertion_result_format = ''
            let status_result_format = ''
            let status_result_array_check = []

            // loop เพื่อเก็บสถานะของแต่ละ label
            for (const split_status_log of status_result_array) {
                if (split_status_log == '') {
                    if (status_result_format.includes('Failed') === true) {
                        status_result_array_check.push('Failed')
                    } else {
                        status_result_array_check.push('Passed')
                    }
                    status_result_format = ''
                } else {
                    status_result_format += split_status_log
                }
            }

            // loop เพื่อลงผลใน google sheet แต่ละ label
            let number_loop = 0
            for (const split_assertion_log of assertion_result_array) {
                if (split_assertion_log == '') {
                    // เก็บผลลัพธ์ที่ google sheet
                    await sendTestResultToGoogleSheetGSAppScript({
                        suite: 'Test Suite',
                        caseName: testinfo.title,
                        assertionLog: assertion_result_format,
                        status: status_result_array_check[number_loop],
                        tester: 'Toppy',
                        duration: 'Test duration',
                        errorMessage: 'Test Error'
                    })
                    assertion_result_format = ''
                    number_loop = number_loop + 1
                } else {
                    assertion_result_format += split_assertion_log + '\n'
                }
            }
            //////////////////////////////////////////////////////////// กรณีหลาย row ตาม label ////////////////////////////////////////////////////////

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