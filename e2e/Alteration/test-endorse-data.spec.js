const { test, expect } = require('@playwright/test');
const { datadict_endorse_checkbox } = require('../../data/Alteration/inquiryform_datadict_endorse_checkbox.data');
const { datadict_endorse_checkbox_sub_status } = require('../../data/Alteration/inquiryform_datadict_endorse_checkbox_2_Sub_Status.data.js');
const { raw_data_alteration } = require('../../data/Alteration/raw_data_alteration.data');
const { data_matrix_endorse } = require('../../data/Alteration/data_endorse.data');
const { inquiryendorseformLocator } = require('../../locators/Alteration/alteration.locators.js');
const { mapsdataObject } = require('../../utils/maps-data.js');
const { uploadGoogleSheet } = require('../../utils/uploadresult-google-sheet.js');
const { contact_code_dictionary } = require('../../data/Alteration/contact_code_dict.data.js');

// CIS
import { LoginPage } from '../../pages/login_t.page.js';
import { gotoMenu } from '../../pages/menu.page.js';
import { searchCustomerCIS } from "../../pages/CIS/customer_cis.page.js";
import { LogoutPage } from '../../pages/logout.page.js';

test.describe('Alteration - endorse check', () => {

    // loop ตามข้อมูล data_matrix_endorse เป็นหลัก
    for (const data_endorse of data_matrix_endorse) {

        test(`Scenario: กรมธรรม์ ${data_endorse.policy_no} | ${data_endorse.channel_code}_${data_endorse.policy_type}_${data_endorse.policy_line}_${data_endorse.policy_status}_${data_endorse.contact_code}`, async ({ page }, testinfo) => {
            // ตั้งค่า timeout สำหรับการทดสอบ
            test.setTimeout(60000); // 60 วินาที

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

                // // รอเมนู popup แสดง
                // await expect(page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยันการทำรายการธุรกรรม' })).toBeVisible();
                // // คลิ๊กปุ่ม ยืนยัน
                // await page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน' }).click();

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
            await expect(newPage.locator('text=สอบถามสลักหลัง')).toBeVisible();

            // ดึงค่าจาก contact_code_dictionary
            const data_dict_contact_code = contact_code_dictionary[data_endorse.contact_code];
            // คลิ๊กที่ช่อง ประเภทติดต่อ (ผู้ติดต่อ) *
            await newPage.getByRole('textbox', { name: 'ประเภทติดต่อ (ผู้ติดต่อ) *' }).click();
            // เลือกค่าจาก contact_code_dictionary
            await newPage.getByText(data_dict_contact_code, { exact: true }).click();

            // เงื่อนไขพิเศษ กรณี contact_code = AGT (ตัวแทนยื่นคำขอแทนผู้เอาประกันภัย)
            if (data_endorse.contact_code === 'AGT') {
                // คลิ๊กที่ช่อง ประเภทติดต่อ (ผู้ติดต่อ) *
                await newPage.getByRole('textbox', { name: 'สาขาต้นสังกัด *' }).click();
                // ดึงค่าจาก username มาใช้เป็นสาขาต้นสังกัด
                await newPage.locator('label', { hasText: data_endorse.username }).click();
            }

            // // สร้าง instance ของ inquiryendorseformLocator
            // const inquiryendorseformlocator = inquiryendorseformLocator(newPage);

            // // ส่วนของการทำข้อมูล
            // // นำข้อมูลจาก data_matrix_endorse ไปใช้ในการดึงข้อมูลจาก datadict raw_data_alteration
            // const result = raw_data_alteration[data_endorse.channel_code][data_endorse.policy_type][data_endorse.policy_line][data_endorse.policy_status][data_endorse.contact_code];

            // // ประกาศตัวแปรเก็บข้อมูล endorse ทั้งหมด
            // let data_endorse_name = [{ endorse_name_locator: [] }];
            // let data_endorse_checkbox = [{ endorse_checkbox_locator: [] }];

            // // loop ข้อมูลใน result เพื่อดึงข้อมูล endorse_code และ endorse_name และ endorse_code จาก data dict
            // for (const endorse_data of result) {
            //     // ก่อนใช้งาน .data ต้องแน่ใจว่ามี object ใน index 0 data_endorse_name
            //     if (data_endorse_name[0]?.endorse_name_locator?.length === 0) {
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
            //         data_endorse_name[0].endorse_name_locator.push(
            //             {
            //                 locator: [inquiryendorseformlocator.endorse_name_locator(endorse_data.endorse_code)],
            //                 code: [endorse_data.endorse_code],
            //                 label: [endorse_data.endorse_name],
            //                 data: [endorse_data.endorse_name],
            //             }
            //         );
            //     } else {
            //         // เก็บข้อมูล locator ลงในตัวแปร data_endorse_code
            //         data_endorse_name[0].endorse_name_locator[0].locator.push(inquiryendorseformlocator.endorse_name_locator(endorse_data.endorse_code));
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_code
            //         data_endorse_name[0].endorse_name_locator[0].code.push(endorse_data.endorse_code);
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
            //         data_endorse_name[0].endorse_name_locator[0].label.push(endorse_data.endorse_name);
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
            //         data_endorse_name[0].endorse_name_locator[0].data.push(endorse_data.endorse_name);
            //     }

            //     // ก่อนใช้งาน .data ต้องแน่ใจว่ามี object ใน index 0 data_endorse_checkbox
            //     if (data_endorse_checkbox[0]?.endorse_checkbox_locator?.length === 0) {
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
            //         data_endorse_checkbox[0].endorse_checkbox_locator.push(
            //             {
            //                 locator: [inquiryendorseformlocator.endorse_checkbox_locator(endorse_data.endorse_code)],
            //                 code: [endorse_data.endorse_code],
            //                 label: [endorse_data.endorse_name],
            //                 data: [endorse_data.endorse_checkbox],
            //                 type: 'checkbox',
            //             }
            //         );
            //     } else {
            //         // เก็บข้อมูล locator ลงในตัวแปร data_endorse_code
            //         data_endorse_checkbox[0].endorse_checkbox_locator[0].locator.push(inquiryendorseformlocator.endorse_checkbox_locator(endorse_data.endorse_code));
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_code
            //         data_endorse_checkbox[0].endorse_checkbox_locator[0].code.push(endorse_data.endorse_code);
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร data_endorse_name
            //         data_endorse_checkbox[0].endorse_checkbox_locator[0].label.push(endorse_data.endorse_name);
            //         // เก็บข้อมูล endorse_name ลงในตัวแปร endorse_checkbox
            //         data_endorse_checkbox[0].endorse_checkbox_locator[0].data.push(endorse_data.endorse_checkbox);
            //     }
            // }

            // // ตรวจสอบการแสดง endorse name และ endorse checkbox
            // const result_endorsecheckdata_alteration = await mapsdataobject.endorsecheckdata_alteration(data_endorse_name, data_endorse_checkbox);

            // // นำข้อมูลขึ้น google sheet (รายละเอียดเอกสาร)
            // await uploadgooglesheet.uploadResultTestDataToGoogleSheet_all(result_endorsecheckdata_alteration.status_result_array, result_endorsecheckdata_alteration.assertion_result_array, testinfo);
        });
    }

});