import { test, expect } from '@playwright/test'

import { LoginPage } from '../pages/login_t.page'
import { LogoutPage } from '../pages/logout.page'
import { gotoMenu } from '../pages/menu.page'
import { menuAlteration } from '../pages/Alteration/menu_alteration'
import { searchAlterationAll } from '../pages/Alteration/search_alteration'

import { loginData } from '../data/login_t.data'
import { inquiryformArraykey_label } from '../data/Alteration/InquiryForm.data'

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

            const logindata = loginData;

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

            // // logout NBS Portal
            // await logoutpage.logoutNBSPortal();
        })

    }

})