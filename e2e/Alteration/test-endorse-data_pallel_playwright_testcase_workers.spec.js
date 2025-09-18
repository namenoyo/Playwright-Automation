const { test, expect } = require('@playwright/test');
const { popupAlert, getMaxWorkers } = require('../../utils/common.js');
const { chunkRange } = require('../../utils/common.js');

const { datadict_endorse_checkbox } = require('../../data/Alteration/inquiryform_datadict_endorse_checkbox.data.js');
const { datadict_endorse_checkbox_sub_status } = require('../../data/Alteration/inquiryform_datadict_endorse_checkbox_2_Sub_Status.data.js');
const { raw_data_alteration } = require('../../data/Alteration/raw_data_alteration.data.js');
const { data_matrix_endorse } = require('../../data/Alteration/data_endorse.data.js');
const { inquiryendorseformLocator } = require('../../locators/Alteration/alteration.locators.js');
const { mapsdataObject } = require('../../utils/maps-data.js');
const { uploadGoogleSheet } = require('../../utils/uploadresult-google-sheet.js');
const { contact_code_dictionary } = require('../../data/Alteration/contact_code_dict.data.js');
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper.js');


// CIS
import { LoginPage } from '../../pages/login_t.page.js';
import { gotoMenu } from '../../pages/menu.page.js';
import { searchCustomerCIS } from "../../pages/CIS/customer_cis.page.js";
import { LogoutPage } from '../../pages/logout.page.js';

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
const endIdx = 100;
const testData = data_matrix_endorse.slice(startIdx, endIdx); // ตัดข้อมูลตามช่วงที่กำหนด

for (const data_endorse of testData) {

    test(`Scenario | ${data_endorse.channel_code}_${data_endorse.policy_type}_${data_endorse.policy_line}_${data_endorse.policy_status}_${data_endorse.contact_code} | ${data_endorse.policy_no}`, async ({ page }, testInfo) => {
        let policyno = `${data_endorse.policy_no}`
        // ตั้งค่า timeout สำหรับการทดสอบ
        test.setTimeout(180000); // 3 นาที

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

        const mapsdataobject = new mapsdataObject(page, expect);
        const uploadgooglesheet = new uploadGoogleSheet(page, expect);

        // ส่วนของการเข้าหน้า CIS
        // Page
        const loginPage = new LoginPage(page);
        const gotomenu = new gotoMenu(page, expect);
        const searchcustomercis = new searchCustomerCIS(page, expect);
        const logoutpage = new LogoutPage(page, expect);

        // ไปยังหน้า NBS
        await loginPage.gotoNBS();
        // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
        await loginPage.login(data_endorse.username, data_endorse.password);

        // ไปยังเมนู "ลูกค้าสัมพันธ์" > "ระบบ CIS" > "ข้อมูลลูกค้า"
        await gotomenu.menuAll('ลูกค้าสัมพันธ์', 'ระบบ CIS', 'ข้อมูลลูกค้า');

        // ค้นหาข้อมูลลูกค้า
        await searchcustomercis.searchCustomer(data_endorse.policy_no);
        // คลิกรายละเอียดลูกค้า
        await searchcustomercis.clickdetailCustomer();

        // จับบรรทัดที่มีเลขกรมธรรม์
        const findpolicyno_button = page.locator('div#section-cust-policy').locator('tbody.MuiTableBody-root').locator('td', { hasText: `${data_endorse.policy_no}` });
        // คลิ๊กปุ่ม เลือกธุรกรรม ของบรรทัดที่มีเลขกรมธรรม์ โดยใช้ xpath หา parent td แล้วไปหา sibling ที่เป็นปุ่ม
        await findpolicyno_button.locator('xpath=preceding-sibling::td[4]').getByRole('button', { name: 'เลือกธุรกรรม' }).click();

        // รอเมนู เลือกธุรกรรม ปรากฏ
        await expect(page.locator('div[role="dialog"]', { hasText: `${data_endorse.policy_no}` })).toBeVisible();
        // คลิ๊กเมนู สอบถามสลักหลัง (Alteration Inquiry)
        await page.locator('div[role="dialog"]').getByText('สอบถามสลักหลัง').click();

        // จับข้อความ popup inquiry form
        const popup_inquiryform = page.locator('div[role="dialog"]').locator('p[class="MuiTypography-root MuiTypography-body1"]').nth(1);

        // ตรวจสอบข้อความใน popup inquiry form
        if (await popup_inquiryform.textContent() === 'กรุณาตรวจสอบข้อมูลผู้เอาประกันก่อนทำธุรกรรม') {
            // คลิ๊กปุ่ม ตกลง
            await page.locator('div[role="dialog"]').getByRole('button', { name: 'ตกลง' }).click();
            // รอเมนู สอบถามสลักหลัง ปรากฏ
            await expect(page.getByRole('button', { name: 'ยืนยันข้อมูล' })).toBeEnabled();
            await page.getByRole('button', { name: 'ยืนยันข้อมูล' }).click();
            // รอเมนู popup แสดง
            await expect(page.locator('div[role="dialog"]', { hasText: 'ต้องการยืนยันข้อมูลทั้งหมดใช่หรือไม่' })).toBeVisible();
            // คลิ๊กปุ่ม ยืนยัน
            await page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน' }).click();
            // รอเมนู popup ยืนยันแสดง
            await expect(page.locator('div[role="dialog"]', { hasText: 'ยืนยันข้อมูลเรียบร้อย' })).toBeVisible();
            // คลิ๊กปุ่ม ตกลง
            await page.locator('div[role="dialog"]').getByRole('button', { name: 'ตกลง' }).click();

            // จับบรรทัดที่มีเลขกรมธรรม์
            const findpolicyno_button = page.locator('div#section-cust-policy').locator('tbody.MuiTableBody-root').locator('td', { hasText: `${data_endorse.policy_no}` });
            // คลิ๊กปุ่ม เลือกธุรกรรม ของบรรทัดที่มีเลขกรมธรรม์ โดยใช้ xpath หา parent td แล้วไปหา sibling ที่เป็นปุ่ม
            await findpolicyno_button.locator('xpath=preceding-sibling::td[4]').getByRole('button', { name: 'เลือกธุรกรรม' }).click();

            // รอเมนู เลือกธุรกรรม ปรากฏ
            await expect(page.locator('div[role="dialog"]', { hasText: `${data_endorse.policy_no}` })).toBeVisible();
            // คลิ๊กเมนู สอบถามสลักหลัง (Alteration Inquiry)
            await page.locator('div[role="dialog"]').getByText('สอบถามสลักหลัง').click();

            await page.waitForTimeout(2000); // รอ 2 วินาที เพื่อให้ popup แสดง

        } else { }

        // สมมติว่าคุณมีปุ่มที่เปิด tab ใหม่
        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),  // รอให้มี tab ใหม่

            // รอเมนู popup แสดง
            expect(page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยันการทำรายการธุรกรรม' })).toBeVisible(),
            // คลิ๊กปุ่ม ยืนยัน
            page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน' }).click()
        ]);

        // รอให้ tab ใหม่โหลดเสร็จ
        await newPage.waitForLoadState();
        // รอเปิด tab ใหม่
        await newPage.waitForTimeout(5000); // รอ 5 วินาทีเพื่อให้ tab เปิด
        await expect(newPage.locator('text=สอบถามสลักหลัง')).toBeVisible({ timeout: 60000 }); // รอไม่เกิน 60 วินาที

        // ดึงค่าจาก contact_code_dictionary
        const data_dict_contact_code = contact_code_dictionary[data_endorse.contact_code];
        // คลิ๊กที่ช่อง ประเภทติดต่อ (ผู้ติดต่อ) *
        await newPage.getByRole('textbox', { name: 'ประเภทติดต่อ (ผู้ติดต่อ) *' }).click();
        // เลือกค่าจาก contact_code_dictionary
        await newPage.getByText(data_dict_contact_code, { exact: true }).click();

        // // กรณีเลือก ประเภทติดต่อ (ผู้ติดต่อ) * ที่มีเงื่อนไขพิเศษ
        // if (data_endorse.contact_code === 'AGT') { // เงื่อนไขพิเศษ กรณี contact_code = AGT (ตัวแทนยื่นคำขอแทนผู้เอาประกันภัย)
        //     // คลิ๊กที่ช่อง ประเภทติดต่อ (ผู้ติดต่อ) *
        //     await newPage.getByRole('textbox', { name: 'สาขาต้นสังกัด *' }).click();
        //     // ดึงค่าจาก username มาใช้เป็นสาขาต้นสังกัด
        //     await newPage.locator('label', { hasText: data_endorse.username }).click();
        //     // กรอกช่อง ตัวแทนบริษัท *

        //     // เลือก ตัวแทนบริษัท

        // } else if (data_dict_contact_code === 'BRP') { // เงื่อนไขพิเศษ กรณี contact_code = BRP (เจ้าหน้าที่สาขา)
        //     // คลิ๊กที่ช่อง เจ้าหน้าที่สาขา * และกรอกข้อมูล
        //     await newPage.getByRole('textbox', { name: 'เจ้าหน้าที่สาขา' }).click().type('กรุณาระบุเจ้าหน้าที่สาขา');
        // } else if (data_dict_contact_code === 'BNF') { // เงื่อนไขพิเศษ กรณี contact_code = BNF (ผู้รับประโยชน์)
        //     // คลิ๊กที่ช่อง ชื่อ - นามสกุล *
        //     await newPage.getByRole('textbox', { name: 'ชื่อ - นามสกุล *' }).click();
        //     // กรอก ชื่อ - นามสกุล *
        //     await newPage.getByRole('textbox', { name: 'ชื่อ - นามสกุล *' }).type('กรุณาระบุชื่อ - นามสกุล');
        //     // คลิ๊กที่ช่อง ความสัมพันธ์ *
        //     await newPage.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).click();
        //     // เลือก ความสัมพันธ์ *
        //     await newPage.getByText('บุตร', { exact: true }).click();
        // }

        // สร้าง instance ของ inquiryendorseformLocator
        const inquiryendorseformlocator = inquiryendorseformLocator(newPage);

        // ส่วนของการทำข้อมูล
        // นำข้อมูลจาก data_matrix_endorse ไปใช้ในการดึงข้อมูลจาก datadict raw_data_alteration
        const result = datadict_endorse_checkbox_sub_status[data_endorse.channel_code][data_endorse.policy_type][data_endorse.policy_line][data_endorse.policy_status][data_endorse.contact_code];

        // ประกาศตัวแปรเก็บข้อมูล endorse ทั้งหมด
        let data_endorse_name = [{ endorse_name_locator: [] }];
        let data_endorse_checkbox = [{ endorse_checkbox_locator: [] }];

        // loop ข้อมูลใน result เพื่อดึงข้อมูล endorse_code และ endorse_name และ endorse_code จาก data dict
        for (const endorse_data of result) {

            // ก่อนใช้งาน .data ต้องแน่ใจว่ามี object ใน index 0 data_endorse_name
            if (data_endorse_name[0]?.endorse_name_locator?.length === 0) {
                // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
                data_endorse_name[0].endorse_name_locator.push(
                    {
                        locator: [inquiryendorseformlocator.endorse_name_locator(endorse_data.endorse_code, endorse_data.endorse_name)],
                        code: [endorse_data.endorse_code],
                        label: [endorse_data.endorse_name],
                        data: [endorse_data.endorse_name],
                    }
                );
            } else {
                // เก็บข้อมูล locator ลงในตัวแปร data_endorse_code
                data_endorse_name[0].endorse_name_locator[0].locator.push(inquiryendorseformlocator.endorse_name_locator(endorse_data.endorse_code, endorse_data.endorse_name));
                // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_code
                data_endorse_name[0].endorse_name_locator[0].code.push(endorse_data.endorse_code);
                // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
                data_endorse_name[0].endorse_name_locator[0].label.push(endorse_data.endorse_name);
                // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
                data_endorse_name[0].endorse_name_locator[0].data.push(endorse_data.endorse_name);
            }

            // ก่อนใช้งาน .data ต้องแน่ใจว่ามี object ใน index 0 data_endorse_checkbox
            if (data_endorse_checkbox[0]?.endorse_checkbox_locator?.length === 0) {
                // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
                data_endorse_checkbox[0].endorse_checkbox_locator.push(
                    {
                        locator: [inquiryendorseformlocator.endorse_checkbox_locator(endorse_data.endorse_code)],
                        code: [endorse_data.endorse_code],
                        label: [endorse_data.endorse_name],
                        data: [endorse_data.endorse_checkbox],
                        type: 'checkbox',
                    }
                );
            } else {
                // เก็บข้อมูล locator ลงในตัวแปร data_endorse_code
                data_endorse_checkbox[0].endorse_checkbox_locator[0].locator.push(inquiryendorseformlocator.endorse_checkbox_locator(endorse_data.endorse_code));
                // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_code
                data_endorse_checkbox[0].endorse_checkbox_locator[0].code.push(endorse_data.endorse_code);
                // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
                data_endorse_checkbox[0].endorse_checkbox_locator[0].label.push(endorse_data.endorse_name);
                // เก็บข้อมูล endorse_name ลงในตัวแปร endorse_checkbox
                data_endorse_checkbox[0].endorse_checkbox_locator[0].data.push(endorse_data.endorse_checkbox);
            }
        }

        // ตรวจสอบการแสดง endorse name และ endorse checkbox
        const result_endorsecheckdata_alteration = await mapsdataobject.endorsecheckdata_alteration(data_endorse_name, data_endorse_checkbox);

        // logout ออกจากระบบ
        await logoutpage.logoutNBSPortal_newPage(newPage);

        const endtimestamp = getTimestamp(); // เวลาสิ้นสุด
        const endTime = Date.now();    // จบจับเวลา
        const duration = (endTime - today) / 1000; // วินาที

        ////////////////////////////////////////////////////////////////////////////////////////////////////////

        // // นำข้อมูลขึ้น google sheet (รายละเอียดเอกสาร)
        // await uploadgooglesheet.uploadResultTestDataToGoogleSheet_all(result_endorsecheckdata_alteration.status_result_array, result_endorsecheckdata_alteration.assertion_result_array, testinfo);

        ////////////////////////////////////////////////////////////////////////////////////////////////////////

        // นำข้อมูลเข้า google sheet (สรุปผล)
        const googlesheet = new GoogleSheet();

        // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
        const spreadsheetId_write = '1KHpF_qzfREFI4AwznWX9u6rEwNFPZ9niPm0kZ9Hb5Mg';
        const range_write = `upload-to-sheet_Playwright!A:I`;

        // เริ่มต้น Auth
        const auth = await googlesheet.initAuth();

        // ตรวจสอบสถานะการทดสอบ แบบง่ายๆ ว่ามี Failed หรือไม่
        const statusResult = result_endorsecheckdata_alteration.status_result_array.includes('Failed') ? 'Failed' : 'Passed';
        // รวมทุกค่า assertion เป็น string เดียว
        const assertionResult = result_endorsecheckdata_alteration.assertion_result_array.join('\n');
        // เตรียมข้อมูลในรูปแบบ array 2 มิติ สำหรับ Google Sheet
        const googleDataBatch = [
            [
                starttimestamp,
                'Test Automate',
                testInfo.title,
                policyno,
                assertionResult,
                statusResult,
                endtimestamp,
                'Testing by Automate Playwright',
                `${duration} วินาที`,
                'Test Error'
            ]
        ];

        // console.log(googleDataBatch);

        // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
        await googlesheet.appendRows(auth, spreadsheetId_write, range_write, googleDataBatch);

        ////////////////////////////////////////////////////////////////////////////////////////////////////////

        // });
    });
};
