const { test, expect } = require('@playwright/test');

// Database
const { Database } = require('../../database/database');
const { configdb } = require('../../database/database_env');

// Pages
const { ReceiveIssueRequestAlteration } = require('../../pages/Alteration/receive_issue_request_alteration.js');

// Locators
const { inquiryendorseformLocator } = require('../../locators/Alteration/alteration.locators.js');
const { detailinquiryformLocator } = require('../../locators/Alteration/alteration.locators.js');

// CIS
import { LoginPage } from '../../pages/login_t.page.js';
import { gotoMenu } from '../../pages/menu.page.js';
import { searchCustomerCIS } from "../../pages/CIS/customer_cis.page.js";
import { LogoutPage } from '../../pages/logout.page.js';

// Utils
const { mapsdataArray, mapsdataObject } = require('../../utils/maps-data.js');

// data 1:1
// const { data_matrix_save_endorse } = require('../../data/Alteration/data_save_endorse.data.js');
// const { data_matrix_save_endorse } = require('../../data/Alteration/data_endorse_doc_retest_v1.data.js'); // สำหรับ Retest Test Data 
// const { data_matrix_save_endorse } = require('../../data/Alteration/data_endorse_doc_v1.data.js'); // P'Name
const { inquiryformArraykey_receive_issue_label } = require('../../data/Alteration/inquiryform_form_data_mapping_request_issue.data.js'); // Test

// data package
// const { data_matrix_save_endorse } = require('../../data/Alteration/data_endorse_doc_package_v1.data.js'); // P'Name
// const { data_matrix_save_endorse } = require('../../data/Alteration/data_endorse_doc_package_v1_test.data.js'); // test

// data dictionary
const { contact_code_dictionary } = require('../../data/Alteration/contact_code_dict_v1.data.js');

// Google Sheet
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper.js');

test.describe.configure({ mode: 'parallel' }); // ให้เคสในไฟล์นี้รันขนานได้

test(`Scenario | สร้างรับเรื่องสลักหลัง`, async ({ page }, testInfo) => {
    // setting เวลาให้เคสนี้รัน
    test.setTimeout(180000); // 3 นาที

    // ส่วนของการเข้าหน้า CIS
    // Page
    const loginPage = new LoginPage(page);
    const gotomenu = new gotoMenu(page, expect);
    const searchcustomercis = new searchCustomerCIS(page, expect);
    const logoutpage = new LogoutPage(page, expect);

    let testData = [];

    // console.log('\n เริ่มการดึงข้อมูลจาก Google Sheets \n');
    // // จับเวลาเริ่มต้น
    // const startTime_fetch_data = Date.now();

    // Fetch data from Google Sheets before all tests
    const googlesheet = new GoogleSheet();
    const auth = await googlesheet.initAuth();
    const spreadsheetId = '1anVVVH2lHAZ5VxqZZlp0XrIft5uW3SkfzxWSpSpqRjQ';
    const readrange = `Data_Mapping_Service!A6:ZZ1000000`;
    testData = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);

    // // จับเวลาสิ้นสุด
    // const endTime_fetch_data = Date.now();
    // const duration_fetch_data = (endTime_fetch_data - startTime_fetch_data) / 1000; // วินาที
    // console.log(`ใช้เวลาในการดึงข้อมูลจาก Google Sheets: ${duration_fetch_data} วินาที`);
    // console.log('ดึงข้อมูลจาก Google Sheets เรียบร้อย จำนวน ' + testData.length + ' รายการ \n');

    const sheetnamewrite = `Data_Mapping_Service`;
    const range_write = `A6:ZZ`;

    const db_name = 'alteration';
    const db_env = 'SIT_EDIT'; // SIT | SIT_EDIT / UAT | UAT_EDIT

    let db;

    db = new Database({
        user: configdb[db_name][db_env].DB_USER,
        host: configdb[db_name][db_env].DB_HOST,
        database: configdb[db_name][db_env].DB_NAME,
        password: configdb[db_name][db_env].DB_PASSWORD,
        port: configdb[db_name][db_env].DB_PORT,
    });

    // กรองเอาเฉพาะเคสที่สถานะไม่ใช่ Finish, Not Start, Error
    const denyStatus = ['Finish','Not Start','Error'];
    const result_new_array_status_not_finish = testData.filter(x => !denyStatus.includes(x.Process));

    // กรองเอาเฉพาะเคสที่ DATA USER BY ที่กำหนดเท่านั้น
    const allowUser = ['ท็อป'];
    const result_filter_user = result_new_array_status_not_finish.filter(x => allowUser.includes(x["DATA USER BY"]));

    for (const [index, data_save_endorse] of result_filter_user.entries()) {

        // เตรียมตัวแปรเก็บผลลัพธ์
        let data_create = [];

        // ชื่อ header key สำหรับการอ้างอิงข้อมูล
        const uniquekey = 'unique_key';
        const row_header = 6; // บวก 4 เพราะข้อมูลเริ่มที่แถวที่ 4 ใน Google Sheet

        const row_uniquekey = data_save_endorse['unique_key'];
        const username = data_save_endorse['Username']; // ชื่อผู้ใช้สำหรับทดสอบ
        const password = data_save_endorse['Password']; // รหัสผ่านสำหรับทดสอบ
        const process = data_save_endorse['Process']; // สถานะของการทำงาน

        const policyNo = data_save_endorse['Policy_No']; // กรมธรรม์ ตัวอย่างสำหรับทดสอบ
        const contact_code = data_save_endorse['contact_code']; // ประเภทติดต่อ (ผู้ติดต่อ) * ตัวอย่างสำหรับทดสอบ
        const endorse_code = data_save_endorse['Endorse_code']; // ข้อมูลสลักหลังที่ต้องการเลือก ตัวอย่างสำหรับทดสอบ
        // เอา endorse_code ที่เป็น string มาแปลงเป็น array
        const endorse_code_array = endorse_code.split(',').map(code => code.trim());
        const document_request_no = data_save_endorse['เลขที่รับเรื่อง']; // เลขที่เอกสารคำขอสลักหลัง
        const flag_request_issue = data_save_endorse['Flag_request_issue'];
        const flag_reverse_data = data_save_endorse['Flag_reverse_data'];

        // ECN01
        const ecn01_title = data_save_endorse['ECN01_01'];
        const ecn01_firstname = data_save_endorse['ECN01_02'];
        const ecn01_lastname = data_save_endorse['ECN01_03'];
        // ECN02
        const ecn02_housenumber = data_save_endorse['ECN02_01'];
        const ecn02_moo = data_save_endorse['ECN02_02'];
        const ecn02_village = data_save_endorse['ECN02_03'];
        const ecn02_soi = data_save_endorse['ECN02_04'];
        const ecn02_road = data_save_endorse['ECN02_05'];
        const ecn02_province = data_save_endorse['ECN02_06'];
        const ecn02_district = data_save_endorse['ECN02_07'];
        const ecn02_subdistrict = data_save_endorse['ECN02_08'];
        // ECN03
        const ecn03_mode = data_save_endorse['ECN03_00'];
        const ecn03_relationship = data_save_endorse['ECN03_01'];
        const ecn03_relationship_other = data_save_endorse['ECN03_02'];
        const ecn03_title = data_save_endorse['ECN03_03'];
        const ecn03_firstname = data_save_endorse['ECN03_04'];
        const ecn03_lastname = data_save_endorse['ECN03_05'];
        const ecn03_title_eng = data_save_endorse['ECN03_06'];
        const ecn03_firstname_eng = data_save_endorse['ECN03_07'];
        const ecn03_lastname_eng = data_save_endorse['ECN03_08'];
        const ecn03_sex = data_save_endorse['ECN03_09'];
        const ecn03_birthdate = data_save_endorse['ECN03_10'];
        const ecn03_idcardtype = data_save_endorse['ECN03_12'];
        const ecn03_idcardnumber = data_save_endorse['ECN03_13'];
        const ecn03_percentage = data_save_endorse['ECN03_14'];
        const ecn03_housenumber = data_save_endorse['ECN03_15'];
        const ecn03_moo = data_save_endorse['ECN03_16'];
        const ecn03_village = data_save_endorse['ECN03_17'];
        const ecn03_soi = data_save_endorse['ECN03_18'];
        const ecn03_road = data_save_endorse['ECN03_19'];
        const ecn03_province = data_save_endorse['ECN03_20'];
        const ecn03_district = data_save_endorse['ECN03_21'];
        const ecn03_subdistrict = data_save_endorse['ECN03_22'];
        const ecn03_mobilephone = data_save_endorse['ECN03_24'];
        const ecn03_housetelephone = data_save_endorse['ECN03_25'];
        const ecn03_email = data_save_endorse['ECN03_26'];

        // ECN04
        const ecn04_mode = data_save_endorse['ECN04_00'];
        const ecn04_relationship = data_save_endorse['ECN04_01'];
        const ecn04_relationship_other = data_save_endorse['ECN04_02'];
        const ecn04_title = data_save_endorse['ECN04_03'];
        const ecn04_firstname = data_save_endorse['ECN04_04'];
        const ecn04_lastname = data_save_endorse['ECN04_05'];
        const ecn04_title_eng = data_save_endorse['ECN04_06'];
        const ecn04_firstname_eng = data_save_endorse['ECN04_07'];
        const ecn04_lastname_eng = data_save_endorse['ECN04_08'];
        const ecn04_sex = data_save_endorse['ECN04_09'];
        const ecn04_birthdate = data_save_endorse['ECN04_10'];
        const ecn04_idcardtype = data_save_endorse['ECN04_12'];
        const ecn04_idcardnumber = data_save_endorse['ECN04_13'];
        const ecn04_percentage = data_save_endorse['ECN04_14'];
        const ecn04_housenumber = data_save_endorse['ECN04_15'];
        const ecn04_moo = data_save_endorse['ECN04_16'];
        const ecn04_village = data_save_endorse['ECN04_17'];
        const ecn04_soi = data_save_endorse['ECN04_18'];
        const ecn04_road = data_save_endorse['ECN04_19'];
        const ecn04_province = data_save_endorse['ECN04_20'];
        const ecn04_district = data_save_endorse['ECN04_21'];
        const ecn04_subdistrict = data_save_endorse['ECN04_22'];
        const ecn04_mobilephone = data_save_endorse['ECN04_24'];
        const ecn04_housetelephone = data_save_endorse['ECN04_25'];
        const ecn04_email = data_save_endorse['ECN04_26'];
        const ecn04_channelpayment = data_save_endorse['ECN04_27'];
        const ecn04_promptpay = data_save_endorse['ECN04_28_Promtpay_01'];
        const ecn04_title_promptpay = data_save_endorse['ECN04_28_Promtpay_02'];
        const ecn04_firstname_promptpay  = data_save_endorse['ECN04_28_Promtpay_03'];
        const ecn04_lastname_promptpay = data_save_endorse['ECN04_28_Promtpay_04'];
        const ecn04_bankname_bankaccount = data_save_endorse['ECN04_29_BankAccount_01'];
        const ecn04_bankno_bankaccount = data_save_endorse['ECN04_29_BankAccount_02'];
        const ecn04_bankbranch_bankaccount = data_save_endorse['ECN04_29_BankAccount_03'];
        const ecn04_remark_bankaccount = data_save_endorse['ECN04_29_BankAccount_04'];
        const ecn04_other_bankaccount = data_save_endorse['ECN04_29_BankAccount_05'];
        const ecn04_title_bankaccount = data_save_endorse['ECN04_29_BankAccount_06'];
        const ecn04_firstname_bankaccount = data_save_endorse['ECN04_29_BankAccount_07'];
        const ecn04_lastname_bankaccount = data_save_endorse['ECN04_29_BankAccount_08'];

        // // จับเวลาเริ่มต้นการทำงานของแต่ละเคส
        // const startTime_case = Date.now();

        if (process === 'Waiting for Create Data' || process === 'In Progress') {
            if ((process === 'Waiting for Create Data' || process === 'In Progress') && document_request_no === '') {
                try {
                    if (flag_request_issue === 'TRUE' || flag_request_issue === 'True' || flag_request_issue === 'true') {
                        console.log('\nเริ่มทำการบันทึก รับเรื่องสลักหลัง');

                        // อัพเดท Process เป็น 'In Progress'
                        data_create.push({ [uniquekey]: row_uniquekey, Process: 'In Progress', Remark: '', "เลขที่รับเรื่อง": "" });
                        // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                        await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                        // เคลียร์ array หลังอัพโหลด
                        data_create = [];

                        // ไปยังหน้า NBS
                        await loginPage.gotoNBS();
                        // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
                        await loginPage.login(username, password);

                        // ไปยังเมนู "ลูกค้าสัมพันธ์" > "ระบบ CIS" > "ข้อมูลลูกค้า"
                        await gotomenu.menuAll('ลูกค้าสัมพันธ์', 'ระบบ CIS', 'ข้อมูลลูกค้า');

                        // ค้นหาข้อมูลลูกค้า
                        await searchcustomercis.searchCustomer(policyNo);
                        // คลิกรายละเอียดลูกค้า
                        await searchcustomercis.clickdetailCustomer();

                        // จับบรรทัดที่มีเลขกรมธรรม์
                        const findpolicyno_button = page.locator('div#section-cust-policy').locator('tbody.MuiTableBody-root').locator('td', { hasText: `${policyNo}` });
                        // คลิ๊กปุ่ม เลือกธุรกรรม ของบรรทัดที่มีเลขกรมธรรม์ โดยใช้ xpath หา parent td แล้วไปหา sibling ที่เป็นปุ่ม
                        await findpolicyno_button.locator('xpath=preceding-sibling::td[4]').getByRole('button', { name: 'เลือกธุรกรรม' }).click({ timeout: 10000 });

                        // รอเมนู เลือกธุรกรรม ปรากฏ
                        await expect(page.locator('div[role="dialog"]', { hasText: `${policyNo}` })).toBeVisible();
                        // คลิ๊กเมนู สอบถามสลักหลัง (Alteration Inquiry)
                        await page.locator('div[role="dialog"]').getByText('รับเรื่องสลักหลัง').click();

                        // จับข้อความ popup inquiry form
                        const popup_inquiryform = page.locator('div[role="dialog"]').locator('p[class="MuiTypography-root MuiTypography-body1"]').nth(1);

                        // ตรวจสอบข้อความใน popup inquiry form
                        if (await popup_inquiryform.textContent() === 'กรุณาตรวจสอบข้อมูลผู้เอาประกันก่อนทำธุรกรรม') {
                            // คลิ๊กปุ่ม ตกลง
                            await page.locator('div[role="dialog"]').getByRole('button', { name: 'ตกลง' }).click({ timeout: 10000 });
                            // รอเมนู สอบถามสลักหลัง ปรากฏ
                            await expect(page.getByRole('button', { name: 'ยืนยันข้อมูล' })).toBeEnabled();
                            await page.getByRole('button', { name: 'ยืนยันข้อมูล' }).click({ timeout: 10000 });
                            // รอเมนู popup แสดง
                            await expect(page.locator('div[role="dialog"]', { hasText: 'ต้องการยืนยันข้อมูลทั้งหมดใช่หรือไม่' })).toBeVisible();
                            // คลิ๊กปุ่ม ยืนยัน
                            await page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน' }).click({ timeout: 10000 });
                            // รอเมนู popup ยืนยันแสดง
                            await expect(page.locator('div[role="dialog"]', { hasText: 'ยืนยันข้อมูลเรียบร้อย' })).toBeVisible();
                            // คลิ๊กปุ่ม ตกลง
                            await page.locator('div[role="dialog"]').getByRole('button', { name: 'ตกลง' }).click({ timeout: 10000 });

                            // จับบรรทัดที่มีเลขกรมธรรม์
                            const findpolicyno_button = page.locator('div#section-cust-policy').locator('tbody.MuiTableBody-root').locator('td', { hasText: `${policyNo}` });
                            // คลิ๊กปุ่ม เลือกธุรกรรม ของบรรทัดที่มีเลขกรมธรรม์ โดยใช้ xpath หา parent td แล้วไปหา sibling ที่เป็นปุ่ม
                            await findpolicyno_button.locator('xpath=preceding-sibling::td[4]').getByRole('button', { name: 'เลือกธุรกรรม' }).click({ timeout: 10000 });

                            // รอเมนู เลือกธุรกรรม ปรากฏ
                            await expect(page.locator('div[role="dialog"]', { hasText: `${policyNo}` })).toBeVisible();
                            // คลิ๊กเมนู สอบถามสลักหลัง (Alteration Inquiry)
                            await page.locator('div[role="dialog"]').getByText('รับเรื่องสลักหลัง').click();

                            await page.waitForTimeout(2000); // รอ 2 วินาที เพื่อให้ popup แสดง

                        } else { }

                        // สมมติว่าคุณมีปุ่มที่เปิด tab ใหม่
                        const [newPage] = await Promise.all([
                            page.context().waitForEvent('page'),  // รอให้มี tab ใหม่

                            // รอเมนู popup แสดง
                            expect(page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยันการทำรายการธุรกรรม' })).toBeVisible(),
                            // คลิ๊กปุ่ม ยืนยัน
                            page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน' }).click({ timeout: 10000 })
                        ]);

                        // รอให้ tab ใหม่โหลดเสร็จ
                        await newPage.waitForLoadState();
                        // รอเปิด tab ใหม่
                        await newPage.waitForTimeout(5000); // รอ 5 วินาทีเพื่อให้ tab เปิด

                        await expect(newPage.locator('text=รับเรื่องสลักหลัง')).toBeVisible({ timeout: 60000 }); // รอไม่เกิน 60 วินาที

                        // ดึงค่าจาก contact_code_dictionary
                        const contactcode_dict = contact_code_dictionary[contact_code];
                        // คลิ๊กที่ช่อง ประเภทติดต่อ (ผู้ติดต่อ) *
                        await newPage.locator('div[validates="required"]', { hasText: 'ประเภทติดต่อ (ผู้ติดต่อ) *' }).locator('div', { hasText: 'กรุณาเลือก' }).first().click({ timeout: 60000 });
                        // เลือกค่าจาก contactcode
                        await newPage.getByText(contactcode_dict, { exact: true }).click({ timeout: 60000 });

                        // กรณีเลือก ประเภทติดต่อ (ผู้ติดต่อ) * ที่มีเงื่อนไขพิเศษ
                        if (contact_code === 'AGT') { // เงื่อนไขพิเศษ กรณี contact_code = AGT (ตัวแทนยื่นคำขอแทนผู้เอาประกันภัย)
                            // คลิ๊กที่ช่อง ประเภทติดต่อ (ผู้ติดต่อ) *
                            await newPage.getByRole('textbox', { name: 'สาขาต้นสังกัด ของตัวแทน *' }).click({ force: true, timeout: 10000 });
                            // ดึงค่าจาก username มาใช้เป็นสาขาต้นสังกัด
                            // await newPage.locator('label', { hasText: username }).click({ timeout: 10000 });
                            await newPage.locator('label', { hasText: '0001' }).click({ timeout: 10000 });
                            // กรอกช่อง ตัวแทนบริษัท *
                            await newPage.locator('#agentCode').click({ timeout: 10000 });
                            await newPage.locator('#agentCode').type('3265258', { delay: 100 }); // พิมพ์ช้าๆ ทีละตัวอักษร
                            // เลือก ตัวแทนบริษัท
                            await expect(newPage.getByText('3265258')).toBeVisible({ timeout: 60000 });
                            await newPage.getByText('3265258').click({ timeout: 60000 });
                        } else if (contact_code === 'BRP') { // เงื่อนไขพิเศษ กรณี contact_code = BRP (เจ้าหน้าที่สาขา)
                            if (username === '1200' || username === 'hub1' || username === 'crm1') {
                                // คลิ๊กที่ช่อง เจ้าหน้าที่สาขา * และกรอกข้อมูล
                                await newPage.getByRole('textbox', { name: 'username' }).click({ force: true, timeout: 60000 });
                                await newPage.getByRole('textbox', { name: 'username' }).type('prasit.ku', { delay: 100 }); // พิมพ์ช้าๆ ทีละตัวอักษร
                            } else if (username === '0999') {
                                // คลิ๊กที่ช่อง เจ้าหน้าที่สาขา * และกรอกข้อมูล
                                await newPage.getByRole('textbox', { name: 'username' }).click({ force: true, timeout: 60000 });
                                await newPage.getByRole('textbox', { name: 'username' }).type('lalita.th', { delay: 100 }); // พิมพ์ช้าๆ ทีละตัวอักษร
                            }
                            // กดปุ่ม ค้นหา
                            await newPage.waitForTimeout(1000); // รอ 1 วินาที
                            await newPage.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'ข้อมูลการทำสลักหลัง' }).getByRole('button', { name: 'ค้นหา' }).click({ timeout: 10000 });
                            await newPage.waitForTimeout(1000); // รอ 1 วินาที
                        } else if (contact_code === 'BNF' || contact_code === 'PAY' || contact_code === 'LGS' || contact_code === 'ATN') { // เงื่อนไขพิเศษ กรณี contact_code = BNF (ผู้รับประโยชน์)
                            // คลิ๊กที่ช่อง ความสัมพันธ์ *
                            await newPage.getByRole('textbox', { name: 'คำนำหน้า *' }).click({ timeout: 10000 });
                            // เลือก ความสัมพันธ์ *
                            await newPage.getByText('คุณ', { exact: true }).click({ timeout: 10000 });

                            // คลิ๊กที่ช่อง ชื่อ * และกรอกข้อมูล
                            await newPage.getByRole('textbox', { name: 'ชื่อ *' }).click({ force: true, timeout: 60000 });
                            await newPage.getByRole('textbox', { name: 'ชื่อ *' }).type('ออโต้');

                            // คลิ๊กที่ช่อง นามสกุล  และกรอกข้อมูล
                            await newPage.getByRole('textbox', { name: 'นามสกุล' }).click({ force: true, timeout: 60000 });
                            await newPage.getByRole('textbox', { name: 'นามสกุล' }).type('เพลไร้');

                            if (contact_code !== 'ATN') { // เงื่อนไขพิเศษ กรณี contact_code = BNF (ผู้รับประโยชน์)
                                // คลิ๊กที่ช่อง ความสัมพันธ์ *
                                await newPage.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).click({ timeout: 10000 });
                                // เลือก ความสัมพันธ์ *
                                await newPage.getByText('บุตร', { exact: true }).click({ timeout: 10000 });
                            }
                        } else if (contact_code === 'BRN') { // เงื่อนไขพิเศษ กรณี contact_code = BRN (Branch สาขา)
                            // คลิ๊กที่ช่อง สาขา *
                            await newPage.getByRole('textbox', { name: 'สาขา *' }).click({ force: true, timeout: 60000 });
                            // ดึงค่าจาก username มาใช้เป็นสาขา
                            await newPage.locator('label', { hasText: '0001' }).click({ force: true, timeout: 60000 });
                        }

                        // สร้าง instance ของ inquiryendorseformLocator
                        const inquiryendorseformlocator = inquiryendorseformLocator(newPage);

                        // วนลูปเลือกสลักหลังตาม endorse_code
                        for (const code of endorse_code_array) {
                            // คลิ๊กเลือกสลักหลังตาม code
                            await inquiryendorseformlocator.endorse_checkbox_locator(code).click({ timeout: 10000 });
                            await newPage.waitForTimeout(500); // รอ 0.5 วินาที
                        }

                        // คลิ๊กปุ่ม บันทึก
                        await inquiryendorseformlocator.action_button.click({ timeout: 10000 });
                        // รอเมนู popup แสดง
                        await expect(inquiryendorseformlocator.confirm_popup).toBeVisible({ timeout: 60000 });

                        await Promise.all([
                            newPage.waitForResponse(response =>
                                response.url().includes('/thaisamut/rs/alter/v1/master/relations/O') && response.status() === 200
                            ),
                            // คลิ๊กปุ่ม ยืนยัน
                            await inquiryendorseformlocator.confirm_button.click({ timeout: 10000 }),
                        ], { timeout: 60000 }); // รอไม่เกิน 60 วินาที

                        // เช็คว่าสลับไปที่เมนู รับเรื่องสลักหลัง หรือไม่
                        await expect(newPage.locator('div#section-policy-save', { hasText: 'ข้อมูลผู้เอาประกันภัย' })).toBeVisible({ timeout: 60000 }); // รอไม่เกิน 60 วินาที

                        // ดึงค่ารายการสลักหลังที่แสดงบนหน้าจอ
                        const element = await newPage.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'สลักหลัง Non Finance' }).locator('[id*="section-endorsement-"]')
                        const count = await element.count();
                        const endorse_code_screen = [];
                        for (let i = 0; i < count; i++) {
                            const raw = await element.nth(i).getAttribute('id');   // เช่น test-E01
                            const idx = raw.indexOf('-E');                         // หาตำแหน่ง -E
                            const trimmed = idx >= 0 ? raw.substring(idx + 1) : raw; // เอาตั้งแต่ E เป็นต้นไป
                            endorse_code_screen.push(trimmed);                                     // เก็บผลลัพธ์
                        }

                        // เปรียบเทียบข้อมูลระหว่าง endorse_code_array กับ endorse_code_screen
                        const arr1 = endorse_code_array;
                        const arr2 = endorse_code_screen;
                        const sorted1 = [...arr1].sort();
                        const sorted2 = [...arr2].sort();
                        const same = sorted1.toString() === sorted2.toString();
                        // หาตัวที่ใน arr1 มี แต่ arr2 ไม่มี
                        const missing = arr1.filter(v => !arr2.includes(v));
                        // หาตัวที่ใน arr2 มี แต่ arr1 ไม่มี
                        const extra = arr2.filter(v => !arr1.includes(v));
                        // console.log({ same, missing, extra });

                        let requestno

                        // เงื่อนไข ตรวจสอบผลลัพธ์การเปรียบเทียบ
                        if (!same) {
                            // อัพเดท Remark เป็น error.message
                            data_create.push({ [uniquekey]: row_uniquekey, Process: 'Error', Remark: `ข้อมูลสลักหลังที่เลือกไม่ตรงกับที่แสดงบนหน้าจอ. Missing: ${missing.join(', ')}, Extra: ${extra.join(', ')}` });
                            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                            // เคลียร์ array หลังอัพโหลด
                            data_create = [];
                            throw new Error(`ข้อมูลสลักหลังที่เลือกไม่ตรงกับที่แสดงบนหน้าจอ`);
                        } else {
                            const receiveissuerequestalteration = new ReceiveIssueRequestAlteration(newPage, expect);
                            // กรอกข้อมูลสลักหลัง
                            await receiveissuerequestalteration.inputdataendorse_alteration({
                                endorse_code: endorse_code_screen,
                                // ECN01
                                ecn01_firstname: ecn01_firstname, ecn01_lastname: ecn01_lastname, ecn01_title: ecn01_title,
                                // ECN02
                                ecn02_housenumber: ecn02_housenumber, ecn02_moo: ecn02_moo, ecn02_village: ecn02_village, ecn02_soi: ecn02_soi, ecn02_road: ecn02_road, ecn02_province: ecn02_province, ecn02_district: ecn02_district, ecn02_subdistrict: ecn02_subdistrict,
                                // ECN03
                                ecn03_mode: ecn03_mode, ecn03_relationship: ecn03_relationship, ecn03_relationship_other: ecn03_relationship_other, ecn03_title: ecn03_title, ecn03_firstname: ecn03_firstname, ecn03_lastname: ecn03_lastname, ecn03_title_eng: ecn03_title_eng, ecn03_firstname_eng: ecn03_firstname_eng, ecn03_lastname_eng: ecn03_lastname_eng, ecn03_sex: ecn03_sex, ecn03_birthdate: ecn03_birthdate, ecn03_idcardtype: ecn03_idcardtype, ecn03_idcardnumber: ecn03_idcardnumber, ecn03_percentage: ecn03_percentage, ecn03_housenumber: ecn03_housenumber, ecn03_moo: ecn03_moo, ecn03_village: ecn03_village, ecn03_soi: ecn03_soi, ecn03_road: ecn03_road, ecn03_province: ecn03_province, ecn03_district: ecn03_district, ecn03_subdistrict: ecn03_subdistrict, ecn03_mobilephone: ecn03_mobilephone, ecn03_housetelephone: ecn03_housetelephone, ecn03_email: ecn03_email,
                                // ECN04
                                ecn04_mode: ecn04_mode, ecn04_relationship: ecn04_relationship, ecn04_relationship_other: ecn04_relationship_other, ecn04_title: ecn04_title, ecn04_firstname: ecn04_firstname, ecn04_lastname: ecn04_lastname, ecn04_title_eng: ecn04_title_eng, ecn04_firstname_eng: ecn04_firstname_eng, ecn04_lastname_eng: ecn04_lastname_eng, ecn04_sex: ecn04_sex, ecn04_birthdate: ecn04_birthdate, ecn04_idcardtype: ecn04_idcardtype, ecn04_idcardnumber: ecn04_idcardnumber, ecn04_percentage: ecn04_percentage, ecn04_housenumber: ecn04_housenumber, ecn04_moo: ecn04_moo, ecn04_village: ecn04_village, ecn04_soi: ecn04_soi, ecn04_road: ecn04_road, ecn04_province: ecn04_province, ecn04_district: ecn04_district, ecn04_subdistrict: ecn04_subdistrict, ecn04_mobilephone: ecn04_mobilephone, ecn04_housetelephone: ecn04_housetelephone, ecn04_email: ecn04_email, ecn04_channelpayment: ecn04_channelpayment, ecn04_promptpay: ecn04_promptpay, ecn04_title_promptpay: ecn04_title_promptpay, ecn04_firstname_promptpay: ecn04_firstname_promptpay, ecn04_lastname_promptpay: ecn04_lastname_promptpay, ecn04_bankname_bankaccount: ecn04_bankname_bankaccount, ecn04_bankno_bankaccount: ecn04_bankno_bankaccount, ecn04_bankbranch_bankaccount: ecn04_bankbranch_bankaccount, ecn04_remark_bankaccount: ecn04_remark_bankaccount, ecn04_other_bankaccount: ecn04_other_bankaccount, ecn04_title_bankaccount: ecn04_title_bankaccount, ecn04_firstname_bankaccount: ecn04_firstname_bankaccount, ecn04_lastname_bankaccount: ecn04_lastname_bankaccount,
                                // ECN05

                            });
                            // เลือก checkbox เอกสารที่มีการ require
                            await receiveissuerequestalteration.checkbox_document_required_alteration();

                            // หลังจากคลิกปุ่มบันทึก เก็บ response ของเลขที่รับเรื่อง
                            const [response] = await Promise.all([
                                newPage.waitForResponse(resp =>
                                    resp.url().includes('/thaisamut/rs/alter/v1/request') && resp.status() === 200
                                ),
                                // คลิกปุ่มบันทึก
                                await receiveissuerequestalteration.save_receive_issue_request_alteration(),
                            ]);
                            const responseBody = await response.json();
                            requestno = responseBody.requestNo; // หรือเปลี่ยนชื่อ key ตาม response จริง
                            console.log('เลขที่รับเรื่อง:', requestno);

                            // // บันทึก รับเรื่องสลักหลัง
                            // await receiveissuerequestalteration.save_receive_issue_request_alteration();
                        }

                        if (flag_reverse_data !== 'TRUE' && flag_reverse_data !== 'True' && flag_reverse_data !== 'true') {
                            // อัพเดท Process เป็น 'Finish'
                            data_create.push({ [uniquekey]: row_uniquekey, Process: 'Finish', Remark: '- ทำการบันทึก รับเรื่องสลักหลัง เสร็จเรียบร้อยแล้ว', 'เลขที่รับเรื่อง': `${requestno} (Create)` });
                            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                            // เคลียร์ array หลังอัพโหลด
                            data_create = [];
                        } else {
                            // อัพเดท Process เป็น 'Finish'
                            data_create.push({ [uniquekey]: row_uniquekey, Remark: '- ทำการบันทึก รับเรื่องสลักหลัง เสร็จเรียบร้อยแล้ว', 'เลขที่รับเรื่อง': `${requestno} (Create)` });
                            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                            // เคลียร์ array หลังอัพโหลด
                            data_create = [];
                        }

                        console.log('ทำการบันทึก รับเรื่องสลักหลัง เสร็จเรียบร้อยแล้ว');
                    }

                } catch (error) {
                    if (testInfo.retry === testInfo.project.retries) { // ถ้าเป็นการรันครั้งสุดท้าย (ไม่ว่าจะผ่านหรือไม่ผ่าน)

                        // อัพเดท Remark เป็น error.message
                        data_create.push({ [uniquekey]: row_uniquekey, Process: 'Error', Remark: error.message });
                        // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                        await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                        // เคลียร์ array หลังอัพโหลด
                        data_create = [];

                    }
                    throw error; // ต้องโยนออกไปให้ระบบนับว่า fail จะได้ retry
                }
            } else if ((process === 'Waiting for Create Data' || process === 'In Progress') && document_request_no !== '') {

                const only_document_request_no = document_request_no.split(' ')[0]; // เอาเฉพาะเลขที่รับเรื่อง โดยตัด (Create) หรือ (Skip) ออก

                if (flag_reverse_data !== 'TRUE' && flag_reverse_data !== 'True' && flag_reverse_data !== 'true') {
                    // อัพเดท Process เป็น 'Finish'
                    data_create.push({ [uniquekey]: row_uniquekey, Process: 'Finish', Remark: '- ข้ามการบันทึก รับเรื่องสลักหลัง เนื่องจาก ทำการบันทึก รับเรื่องสลักหลัง เรียบร้อยแล้ว', 'เลขที่รับเรื่อง': `${only_document_request_no} (Skip)` });
                    // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                    await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                    // เคลียร์ array หลังอัพโหลด
                    data_create = [];
                } else {
                    // อัพเดท ข้อมูล
                    data_create.push({ [uniquekey]: row_uniquekey, Remark: '- ข้ามการบันทึก รับเรื่องสลักหลัง เนื่องจาก ทำการบันทึก รับเรื่องสลักหลัง เรียบร้อยแล้ว', 'เลขที่รับเรื่อง': `${only_document_request_no} (Skip)` });
                    // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                    await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                    // เคลียร์ array หลังอัพโหลด
                    data_create = [];
                }

                console.log('\nข้ามการบันทึก รับเรื่องสลักหลัง เนื่องจาก ทำการบันทึก รับเรื่องสลักหลัง เรียบร้อยแล้ว');
            }

            // ดึงข้อมูลล่าสุด หลังจากบันทึก รับเรื่องสลักหลัง เสร็จ
            const data_present = await googlesheet.fetchSheetData_key_rows(auth, spreadsheetId, readrange, null, null, row => row.unique_key === row_uniquekey);
            const process_present = data_present[0]['Process'];
            const document_request_no_present = data_present[0]['เลขที่รับเรื่อง'];
            const remark_present = data_present[0]['Remark'];

            if ((process_present === 'Waiting for Create Data' || process_present === 'In Progress') && document_request_no_present !== '') {
                const only_document_request_no_present = document_request_no_present.split(' ')[0]; // เอาเฉพาะเลขที่รับเรื่อง โดยตัด (Create) หรือ (Skip) ออก

                try {
                    if (flag_reverse_data === 'TRUE' || flag_reverse_data === 'True' || flag_reverse_data === 'true') {
                        console.log('\nเริ่มทำการย้อนข้อมูล รับเรื่องสลักหลัง');
                        const query_reverse_data_alteration = `
                        WITH
                        u_a AS (
                        UPDATE tx_request_header
                        SET request_status = 'CAX'
                        WHERE policy_no = $1
                        and request_no = $2
                        RETURNING id
                        ),
                        u_b AS (
                        UPDATE tx_request_endorsement b
                        SET endorse_status = 'CAX'
                        FROM u_a
                        WHERE b.tx_request_header_id = u_a.id
                        RETURNING b.tx_request_header_id
                        ),
                        u_c AS (
                        UPDATE tx_request_endorsement_group c
                        SET endorse_group_status = 'CAX'
                        FROM u_a
                        WHERE c.tx_request_header_id = u_a.id
                        RETURNING c.tx_request_header_id
                        )
                        SELECT
                        (SELECT count(*) FROM u_a) AS updated_header_rows,
                        (SELECT count(*) FROM u_b) AS updated_endorsement_rows,
                        (SELECT count(*) FROM u_c) AS updated_endorsement_group_rows;
                    `;
                        const params = [policyNo, only_document_request_no_present];

                        const result_query_reverse_data_alteration = await db.query(query_reverse_data_alteration, params);
                        // console.log('ผลลัพธ์การย้อนข้อมูล รับเรื่องสลักหลัง');
                        // console.log('ผลลัพธ์การย้อนข้อมูล รับเรื่องสลักหลัง:', result_query_reverse_data_alteration.rows[0]);

                        if ((flag_reverse_data === 'TRUE' || flag_reverse_data === 'True' || flag_reverse_data === 'true') && (flag_request_issue === 'TRUE' || flag_request_issue === 'True' || flag_request_issue === 'true')) {
                            // อัพเดท Process เป็น 'Finish'
                            data_create.push({ [uniquekey]: row_uniquekey, Process: 'Finish', Remark: `${remark_present}\n- ทำการย้อนข้อมูล รับเรื่องสลักหลัง เสร็จเรียบร้อยแล้ว`, 'เลขที่รับเรื่อง': `${document_request_no_present}\n${only_document_request_no_present} (Reversed)` });
                            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                            // เคลียร์ array หลังอัพโหลด
                            data_create = [];

                            console.log('ทำการย้อนข้อมูล รับเรื่องสลักหลัง เสร็จเรียบร้อยแล้ว');
                        } else {
                            // อัพเดท Process เป็น 'Finish'
                            data_create.push({ [uniquekey]: row_uniquekey, Process: 'Finish', Remark: '- ทำการย้อนข้อมูล รับเรื่องสลักหลัง เสร็จเรียบร้อยแล้ว', 'เลขที่รับเรื่อง': `${only_document_request_no_present} (Reversed)` });
                            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                            // เคลียร์ array หลังอัพโหลด
                            data_create = [];

                            console.log('ทำการย้อนข้อมูล รับเรื่องสลักหลัง เสร็จเรียบร้อยแล้ว');
                        }

                    }

                } catch (error) {
                    if (testInfo.retry === testInfo.project.retries) { // ถ้าเป็นการรันครั้งสุดท้าย (ไม่ว่าจะผ่านหรือไม่ผ่าน)

                        // อัพเดท Remark เป็น error.message
                        data_create.push({ [uniquekey]: row_uniquekey, Process: 'Error', Remark: error.message });
                        // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                        await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                        // เคลียร์ array หลังอัพโหลด
                        data_create = [];

                    }
                    throw error; // ต้องโยนออกไปให้ระบบนับว่า fail จะได้ retry
                }
            }

            // // จับเวลา End to End ของแต่ละเคส
            // const endTime_case = Date.now();
            // const duration_case =  (endTime_case - startTime_case) / 1000;
            // console.log(`เวลาที่ใช้ในการทำงานของเคสนี้: ${duration_case} วินาที`);

            // ปิด tab ที่ไม่ใช้งาน เพื่อป้องกันการใช้ resource มากเกินไป
            const context = page.context();
            const pages = context.pages();
            for (let i = 1; i < pages.length; i++) {
                await pages[i].close();
            }

            // ปิด popup confirm
            await page.locator('div[aria-labelledby="confirmation-dialog-title"]').locator('button[aria-label="Close"]').click({ timeout: 10000 })
            await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).not.toBeVisible();

            // logout
            await logoutpage.logoutNBSPortal();
        }
    }

    // ปิด database
    await db.close();
})

