const { test, expect } = require('@playwright/test');

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

// startIdx คือ index เริ่มต้น (รวม index นี้)
// endIdx คือ index สุดท้าย (แต่ "ไม่รวม" index นี้)

// ตัวอย่าง:
// ถ้า startIdx = 0, endIdx = 3 → ได้ข้อมูล index 0, 1, 2 (3 ตัวแรก)
// ถ้า startIdx = 3, endIdx = 6 → ได้ข้อมูล index 3, 4, 5 (3 ตัวถัดไป)
// ถ้า startIdx = 4, endIdx = 5 → ได้ข้อมูล index 4 (แค่ตัวเดียว)

// สรุป:
// startIdx = จุดเริ่มต้น (รวม)
// endIdx = จุดสิ้นสุด (ไม่รวม)
// จำนวนข้อมูลที่ได้ = endIdx - startIdx

const startIdx = 0;
const endIdx = 1; // ทั้งหมด 6681 เคส 
const testData = inquiryformArraykey_receive_issue_label.slice(startIdx, endIdx); // ตัดข้อมูลตามช่วงที่กำหนด

for (const data_save_endorse of testData) {

    const username = data_save_endorse.username; // ชื่อผู้ใช้สำหรับทดสอบ
    const password = '123'; // รหัสผ่านสำหรับทดสอบ

    const policyNo = data_save_endorse.policy_no; // กรมธรรม์ ตัวอย่างสำหรับทดสอบ
    const contact_code = data_save_endorse.contact_code; // ประเภทติดต่อ (ผู้ติดต่อ) * ตัวอย่างสำหรับทดสอบ
    // const endorse_code = data_save_endorse.endorse_code; // สลักหลังที่ต้องการเลือก ตัวอย่างสำหรับทดสอบ
    const endorse_code = data_save_endorse.endorse; // สลักหลังที่ต้องการเลือก ตัวอย่างสำหรับทดสอบ

    test(`Scenario | ${data_save_endorse.channel_code}_${data_save_endorse.policy_type}_${data_save_endorse.policy_line}_${data_save_endorse.policy_status}_${data_save_endorse.contact_code} | ${endorse_code.join(',')}`, async ({ page }, testInfo) => {
        // setting เวลาให้เคสนี้รัน
        test.setTimeout(180000); // 3 นาที

        // ส่วนของการเข้าหน้า CIS
        // Page
        const loginPage = new LoginPage(page);
        const gotomenu = new gotoMenu(page, expect);
        const searchcustomercis = new searchCustomerCIS(page, expect);
        const logoutpage = new LogoutPage(page, expect);

        // นำข้อมูลเข้า google sheet (สรุปผล)
        const googlesheet = new GoogleSheet();
        // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
        const spreadsheetId_write = '1KHpF_qzfREFI4AwznWX9u6rEwNFPZ9niPm0kZ9Hb5Mg';
        const range_write = `Playwright_Raw_Result_Save_Endorse!A:Z`;
        // เริ่มต้น Auth
        const auth = await googlesheet.initAuth();

        // กำหนดวันที่ปัจจุบัน
        const today = new Date();

        // function ดึงวันที่และเวลาปัจจุบัน time stamp ในรูปแบบ dd/mm/yyyy hh:mm:ss แบบ พ.ศ.
        const getTimestamp = () => {
            const now = new Date();

            const dd = String(now.getDate()).padStart(2, "0");
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const yyyy = now.getFullYear() + 543; // แปลงเป็น พ.ศ.

            const hh = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");
            const ss = String(now.getSeconds()).padStart(2, "0");

            return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
        };

        const starttimestamp = getTimestamp(); // เวลาที่เริ่มต้น

        if (policyNo === 'NO_POLICY_FOR_TEST') {
            const endtimestamp = getTimestamp(); // เวลาสิ้นสุด
            const endTime = Date.now();    // จบจับเวลา
            const duration = (endTime - today) / 1000; // วินาที

            ////////////////////////////////////////////////////////////////////////////////////////////////////////

            // เตรียมข้อมูลในรูปแบบ array 2 มิติ สำหรับ Google Sheet
            const googleDataBatch = [
                [
                    starttimestamp,
                    'Test Automate',
                    testInfo.title,
                    policyNo,
                    'ไม่มีข้อมูลเลขที่กรมธรรม์สำหรับทดสอบ',
                    'Cancel',
                    endtimestamp,
                    'Testing by Automate Playwright',
                    `${duration} วินาที`,
                    'Test Error'
                ]
            ];

            // console.log(googleDataBatch);

            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
            await googlesheet.appendRows(auth, spreadsheetId_write, range_write, googleDataBatch);

        } else {
            try {
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

                // // วนลูปเลือกสลักหลังตาม endorse_code
                // for (const code of endorse_code) {
                //     // คลิ๊กเลือกสลักหลังตาม code
                //     await inquiryendorseformlocator.endorse_checkbox_locator(code).click({ timeout: 10000 });
                //     await newPage.waitForTimeout(500); // รอ 0.5 วินาที
                // }

                 // วนลูปเลือกสลักหลังตาม endorse_code
                for (const code of endorse_code) {
                    // คลิ๊กเลือกสลักหลังตาม code
                    await inquiryendorseformlocator.endorse_checkbox_locator(code.endorse_code).click({ timeout: 10000 });
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

                // // นับจำนวนเอกสารใน expecteddata
                // const documentCount = data_save_endorse.expecteddata.SELECTOR_Alteration_MENU_SUB_7_In_Page_1_Detail_Panel_Data[0].data.length;
                // // นับจำนวน tr ในตาราง รายการเอกสาร
                // const documentRows = newPage.locator('table > tbody', { hasText: 'รายการเอกสาร' }).locator('tr');
                // const actualDocumentCount = await documentRows.count();

                // let result_function_maps;
                // let result_function_maps_detail_document;

                // // เช็คจำนวนเอกสาร ตรงกันหรือไม่
                // if (documentCount !== actualDocumentCount) {
                //     console.log('จำนวนเอกสารใน expecteddata ไม่ตรงกับจำนวนเอกสารในตาราง บนหน้าเว็บ');
                // } else {
                //     // สร้าง instance ของ detailinquiryformLocator
                //     const detailinquiryformlocator = detailinquiryformLocator(newPage);
                //     // Utils
                //     const mapsdataobject = new mapsdataObject(newPage, expect);
                //     // เช็คข้อมูลบนหน้าจอกับ expected - Static Data
                //     result_function_maps = await mapsdataobject.mapsdataarrayfile_checkdata_request_alteration(detailinquiryformlocator, data_save_endorse.expecteddata);
                //     // เช็คข้อมูลบนหน้าจอกับ expected รายละเอียดเอกสาร ... (จากการ mapping ข้อมูล)
                //     result_function_maps_detail_document = await mapsdataobject.mapsdataarrayfile_checkdata_alteration_detaildocument(detailinquiryformlocator, data_save_endorse.expecteddata);
                // }

                // // logout ออกจากระบบ
                // await logoutpage.logoutNBSPortal_newPage(newPage);

                // const endtimestamp = getTimestamp(); // เวลาสิ้นสุด
                // const endTime = Date.now();    // จบจับเวลา
                // const duration = (endTime - today) / 1000; // วินาที

                // ////////////////////////////////////////////////////////////////////////////////////////////////////////

                // let merge_result_status
                // let merge_result_assertion

                // // เช็คจำนวนเอกสาร ตรงกันหรือไม่
                // if (documentCount !== actualDocumentCount) {
                //     merge_result_status = ['Failed'];
                //     merge_result_assertion = ['จำนวนเอกสารใน expecteddata ไม่ตรงกับจำนวนเอกสารในตาราง บนหน้าเว็บ'];
                // } else {
                //     // อันนี้อัพโหลดขึ้น google แบบรวมอันเดียว
                //     merge_result_status = result_function_maps.status_result_array.concat(result_function_maps_detail_document.status_result_array);
                //     merge_result_assertion = result_function_maps.assertion_result_array.concat(result_function_maps_detail_document.assertion_result_array);
                // }

                // // ตรวจสอบสถานะการทดสอบ แบบง่ายๆ ว่ามี Failed หรือไม่
                // const statusResult = merge_result_status.includes('Failed') ? 'Failed' : 'Passed';
                // // รวมทุกค่า assertion เป็น string เดียว
                // const assertionResult = merge_result_assertion.join('\n');
                // // เตรียมข้อมูลในรูปแบบ array 2 มิติ สำหรับ Google Sheet
                // const googleDataBatch = [
                //     [
                //         starttimestamp,
                //         'Test Automate',
                //         testInfo.title,
                //         policyNo,
                //         assertionResult,
                //         statusResult,
                //         endtimestamp,
                //         'Testing by Automate Playwright',
                //         `${duration} วินาที`,
                //         ''
                //     ]
                // ];

                // // console.log(googleDataBatch);

                // // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
                // await googlesheet.appendRows(auth, spreadsheetId_write, range_write, googleDataBatch);

                // ////////////////////////////////////////////////////////////////////////////////////////////////////////

            } catch (error) {
                const endtimestamp = getTimestamp(); // เวลาสิ้นสุด
                const endTime = Date.now();    // จบจับเวลา
                const duration = (endTime - today) / 1000; // วินาที

                if (testInfo.retry === testInfo.project.retries) { // ถ้าเป็นการรันครั้งสุดท้าย (ไม่ว่าจะผ่านหรือไม่ผ่าน)
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // เตรียมข้อมูลในรูปแบบ array 2 มิติ สำหรับ Google Sheet
                    const googleDataBatch = [
                        [
                            starttimestamp,
                            'Test Automate',
                            testInfo.title,
                            policyNo,
                            'เนื่องจากเกิดข้อผิดพลาด',
                            'Error',
                            endtimestamp,
                            'Testing by Automate Playwright',
                            `${duration} วินาที`,
                            error.message
                        ]
                    ];

                    // console.log(googleDataBatch);

                    // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
                    await googlesheet.appendRows(auth, spreadsheetId_write, range_write, googleDataBatch);
                }

                throw error; // ต้องโยนออกไปให้ระบบนับว่า fail จะได้ retry
            }
        }

    })
}

