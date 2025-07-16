import { test, expect } from '@playwright/test'

import { LoginPage } from '../pages/login_t.page'
import { LogoutPage } from '../pages/logout.page'
import { gotoMenu } from '../pages/menu.page'
import { menuAlteration } from '../pages/Alteration/menu_alteration'
import { searchAlterationAll } from '../pages/Alteration/search_alteration'
import { mapsdataArray } from '../utils/maps-data'
import { uploadGoogleSheet } from '../utils/uploadresult-google-sheet'

import { loginData } from '../data/login_t.data'
import { inquiryformArraykey_label } from '../data/Alteration/inquiryform.data'
import { detailinquiryformLocator } from '../locators/Alteration/alteration.locators'

test.describe('loop data', () => {

    const inquiryformarraykey_label = inquiryformArraykey_label;

    for (const inquiryformarray of inquiryformarraykey_label) {

        test(`test alteration check data เลขกรมธรรม์ : ${inquiryformarray.policyno}`, async ({ page }, testinfo) => {

            // ตั้งค่า timeout สำหรับการทดสอบ
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
            // ค้นหาข้อมูล เมนู ค้นหาใบสอบถาม
            await searchalterationall.searchInquiryForm(inquiryformarray.policyno);
            // กดดู รายละเอียด ใบสอบถาม
            await searchalterationall.clickdetailInquiryForm(inquiryformarray.policyno);

            // เช็คข้อมูลบนหน้าจอกับ expected
            const result_function_maps = await mapsdataarray.mapsdataarrayfile_checkdata(detailinquiryformlocator, inquiryformarray);

            // logout NBS Portal
            await logoutpage.logoutNBSPortal();

            // นำข้อมูลขึ้น google sheet
            await uploadgooglesheet.uploaddatatoGoogleSheet(result_function_maps.status_result_array, result_function_maps.assertion_result_array, testinfo);
        })

        test.only(`test alteration check data in database เลขกรมธรรม์ : ${inquiryformarray.policyno}`, async ({ page }, testinfo) => {

            // ตั้งค่า timeout สำหรับการทดสอบ
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
            // ค้นหาข้อมูล เมนู ค้นหาใบสอบถาม
            await searchalterationall.searchInquiryForm(inquiryformarray.policyno);
            // กดดู รายละเอียด ใบสอบถาม
            await searchalterationall.clickdetailInquiryForm(inquiryformarray.policyno);

            // เช็คข้อมูลบนหน้าจอกับ expected
            const result_function_maps = await mapsdataarray.mapsdataarrayfile_checkdata_database(detailinquiryformlocator, inquiryformarray);

            // logout NBS Portal
            await logoutpage.logoutNBSPortal();

            // นำข้อมูลขึ้น google sheet
            await uploadgooglesheet.uploaddatatoGoogleSheet(result_function_maps.status_result_array, result_function_maps.assertion_result_array, testinfo);
        })

    }

})