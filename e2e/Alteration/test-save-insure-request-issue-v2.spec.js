const { test, expect } = require('@playwright/test');

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

    // Fetch data from Google Sheets before all tests
    const googlesheet = new GoogleSheet();
    const auth = await googlesheet.initAuth();
    const spreadsheetId = '1anVVVH2lHAZ5VxqZZlp0XrIft5uW3SkfzxWSpSpqRjQ';
    const readrange = `Data_Mapping_Service!A6:ZZ1000000`;
    testData = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);

    const sheetnamewrite = `Data_Mapping_Service`;
    const range_write = `A6:ZZ`;

    for (const [index, data_save_endorse] of testData.entries()) {

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

        if (process === 'Waiting for Create Data' || process === 'In Progress') {
            try {

                // อัพเดท Process เป็น 'In Progress'
                data_create.push({ [uniquekey]: row_uniquekey, Process: 'In Progress' });
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
                // คลิ๊กปุ่ม ยืนยัน
                await inquiryendorseformlocator.confirm_button.click({ timeout: 10000 });
                // เช็คว่าสลับไปที่เมนู สอบถามสลักหลัง หรือไม่
                await expect(newPage.locator('div#section-policy-save', { hasText: 'ข้อมูลผู้เอาประกันภัย' })).toBeVisible({ timeout: 60000 }); // รอไม่เกิน 60 วินาที

                await newPage.waitForTimeout(2000); // รอ 2 วินาที เพื่อให้ข้อมูลโหลด

                const receiveissuerequestalteration = new ReceiveIssueRequestAlteration(newPage, expect);
                // กรอกข้อมูลสลักหลัง
                await receiveissuerequestalteration.inputdataendorse_alteration({ 
                    endorse_code: endorse_code_array,
                    ecn01_firstname: ecn01_firstname, ecn01_lastname: ecn01_lastname, ecn01_title: ecn01_title,
                    ecn02_housenumber: ecn02_housenumber, ecn02_moo: ecn02_moo, ecn02_village: ecn02_village, ecn02_soi: ecn02_soi, ecn02_road: ecn02_road, ecn02_province: ecn02_province, ecn02_district: ecn02_district, ecn02_subdistrict: ecn02_subdistrict,
                    ecn03_mode: ecn03_mode, ecn03_relationship: ecn03_relationship, ecn03_relationship_other: ecn03_relationship_other, ecn03_title: ecn03_title, ecn03_firstname: ecn03_firstname, ecn03_lastname: ecn03_lastname, ecn03_title_eng: ecn03_title_eng, ecn03_firstname_eng: ecn03_firstname_eng, ecn03_lastname_eng: ecn03_lastname_eng, ecn03_sex: ecn03_sex, ecn03_birthdate: ecn03_birthdate, ecn03_idcardtype: ecn03_idcardtype, ecn03_idcardnumber: ecn03_idcardnumber, ecn03_percentage: ecn03_percentage, ecn03_housenumber: ecn03_housenumber, ecn03_moo: ecn03_moo, ecn03_village: ecn03_village, ecn03_soi: ecn03_soi, ecn03_road: ecn03_road, ecn03_province: ecn03_province, ecn03_district: ecn03_district, ecn03_subdistrict: ecn03_subdistrict, ecn03_mobilephone: ecn03_mobilephone, ecn03_housetelephone: ecn03_housetelephone, ecn03_email: ecn03_email,

                });
                // เลือก checkbox เอกสารที่มีการ require
                // await receiveissuerequestalteration.checkbox_document_required_alteration();
            } catch (error) {
                if (testInfo.retry === testInfo.project.retries) { // ถ้าเป็นการรันครั้งสุดท้าย (ไม่ว่าจะผ่านหรือไม่ผ่าน)
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////

                    throw error;

                    // เตรียมข้อมูลสำหรับอัพโหลดไปยัง Google Sheet


                    // // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
                    // await googlesheet.appendRows(auth, sheetnamewrite, range_write, googleDataBatch);
                }
                throw error; // ต้องโยนออกไปให้ระบบนับว่า fail จะได้ retry
            }
        }
    }
})

