const { test, expect } = require('@playwright/test');

const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');
const { NewCasePage } = require('../../pages/Unit_Linked/NB/NewCasePage.js');

const { table_NewCase } = require('../../locators/Unit_Linked/NB/NewCase.locators.js');

// Login, menu
import { LoginPage } from '../../pages/login_t.page.js';
import { LogoutPage } from '../../pages/logout.page.js';
import { gotoMenu } from '../../pages/menu.page.js';

test('บันทึกข้อมูลเคสใหม่', async ({ page }) => {
    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    // Login
    const loginPage = new LoginPage(page, expect);
    const logoutPage = new LogoutPage(page, expect);
    // Menu
    const gotomenu = new gotoMenu(page, expect);
    // New Case Page
    const newcasePage = new NewCasePage(page, expect);

    // locator
    const table_newcase = table_NewCase(page);

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

        // ดึงวันที่ปัจจุบัน โดยใช้ format dd/mm/yyyy เป็น พ.ศ.
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = String(currentDate.getFullYear() + 543).padStart(4, '0');
        const todaydate = `${day}/${month}/${year}`;

        // ดึงวันที่ปัจจุบัน โดยใช้ format dd/mm/yyyy เป็น พ.ศ. แล้ว +1 ปี
        const nextYearDate = new Date(currentDate);
        nextYearDate.setFullYear(currentDate.getFullYear() + 1);
        const nextDay = String(nextYearDate.getDate()).padStart(2, '0');
        const nextMonth = String(nextYearDate.getMonth() + 1).padStart(2, '0');
        const nextYear = String(nextYearDate.getFullYear() + 543).padStart(4, '0');
        const nexttodaydate = `${nextDay}/${nextMonth}/${nextYear}`;

        // กำหนดค่าตัวแปรสำหรับการทดสอบ
        const uniquekey = row['Keys row'];
        const statuscreatedata = row['Status Create Data'];
        const ulmenu = row['UL Menu'];
        const env = row['env']; // สภาพแวดล้อมการทดสอบ
        const username = row['username']; // ชื่อผู้ใช้
        const password = row['password']; // รหัสผ่าน
        const branchcode = row['branchcode']; // สาขาต้นสังกัด
        const agentcode = row['agentcode']; // รหัสตัวแทน
        const requestcode = row['requestcode']; // รหัสคำขอ
        const typecard = row['typecard']; // ประเภทบัตร
        const cardno = row['cardno']; // หมายเลขบัตร
        const title = row['title']; // คำนำหน้า
        const name = row['name']; // ชื่อ
        const surname = row['surname']; // นามสกุล
        const birthday = row['birthday']; // วันเกิด
        const occupation = row['jobtype']; // อาชีพ
        const annualIncome = row['jobincome']; // รายได้ต่อปี
        const motorcycle = row['motorcycle']; // ใช้มอเตอร์ไซค์หรือไม่
        const product = row['product']; // ผลิตภัณฑ์
        const paymentperiod = row['paymentperoid']; // ระยะเวลาชำระเบี้ย
        const regularpremium = row['mainpremiumamount']; // เบี้ยประกันภัยรายปี
        const topuppremium = row['specialpremiumamount']; // เบี้ยประกันภัยเพิ่มเติม
        const criteriasuitability = row['suitability']; // เกณฑ์ความเหมาะสม
        const fundname = row['investmentname']; // ชื่อกองทุน
        const insureamountfund = row['investmentpercent']; // จำนวนเงินเอาประกันกองทุน
        const fundname_topup = row['investmentname_topup']; // ชื่อกองทุน เบี้ยเพิ่มเติม
        const fundpercent_topup = row['investmentpercent_topup']; // จำนวนเงินเอาประกันกองทุน เบี้ยเพิ่มเติม
        const firstpaymenttempreceiptno = row['firstpaymenttempreceiptno']; // เลขที่ใบรับเงินชั่วคราว
        const receivetype = row['receivetype']; // ช่องทางรับเอกสาร
        const bankname_creditcard = row['bankname']; // ธนาคารบัตรเครดิต
        const accountno = row['accountno']; // เลขที่บัญชี
        const bankbranch = row['bankbranch']; // สาขาธนาคาร
        const height = row['height']; // ส่วนสูง
        const weight = row['weight']; // น้ำหนัก

        if ((statuscreatedata === 'Waiting for Create Data' || statuscreatedata === 'Process for Create Data') && ulmenu === 'CRS') {

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // ไปยังหน้า NBS
            await loginPage.gotoNBSENV(env);
            // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
            await loginPage.login(username, password);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // บันทึกข้อมูลเคสใหม่ (บันทึกร่าง)
            // ไปยังเมนู Unit Linked บันทึกเคสใหม่ (CRS)
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'จัดการข้อมูลเคสใหม่', 'บันทึกรายการเคสใหม่(CRS)');

            // ค้นหาข้อมูลเคสใหม่
            await newcasePage.searchNewCase({ env: env, branchcode: branchcode, agentcode: agentcode });
            // ตรวจสอบว่ามีข้อมูล รหัสคำขอ ในตารางหรือไม่
            const checkrequestcodeintable = await newcasePage.checkRequestCodeInTable({ requestcode: requestcode });
            // ถ้าไม่พบข้อมูล รหัสคำขอ ในตาราง ให้แสดงทำก่ารบันทึกข้อมูลเคสใหม่
            if (!checkrequestcodeintable) {
                console.log(`\nไม่พบข้อมูล รหัสคำขอ ${requestcode} ในตาราง กำลังทำการบันทึกข้อมูลเคสใหม่`);
                // พิ่มข้อมูลใหม่
                await newcasePage.clickAddNewCase();
                // เพิ่มข้อมูลลูกค้า
                await newcasePage.clickAddNewCustomerPopupCustomerInfo({ typecard: typecard, cardno: cardno, title: title, name: name, surname: surname, birthday: birthday });
                // กรอกข้อมูล Tab 1: ผู้เอาประกัน/ตัวแทน/แบบประกัน
                await newcasePage.formAddNewCase_Tab1({ requestcode: requestcode, todaydate: todaydate, nexttodaydate: nexttodaydate, occupation: occupation, annualIncome: annualIncome, motorcycle: motorcycle, product: product, paymentperiod: paymentperiod, regularpremium: regularpremium, topuppremium: topuppremium, criteriasuitability: criteriasuitability, criteriaevaluatedate: todaydate, fundname: fundname, insureamountfund: insureamountfund, fundname_topup: fundname_topup, fundpercent_topup: fundpercent_topup, firstpaymenttempreceiptno: firstpaymenttempreceiptno, bankname_creditcard: bankname_creditcard, receivetype: receivetype, accountno: accountno, bankbranch: bankbranch });
                // กรอกข้อมูล Tab 2: ผู้รับผลประโยชน์/คำแถลงสุขภาพ
                await newcasePage.formAddNewCase_Tab2({ height: height, weight: weight });
                // กรอกข้อมูล Tab 3: เอกสารประกอบการเอาประกัน
                await newcasePage.formAddNewCase_Tab3({ branchcode: branchcode });
                // บันทึกแบบร่าง
                await newcasePage.formAddNewCase_SaveDraft();
                console.log(`บันทึกข้อมูลเคสใหม่ รหัสคำขอ ${requestcode} เสร็จสิ้น`);
            } else {
                console.log(`พบข้อมูล รหัสคำขอ ${requestcode} ในตาราง ข้ามการบันทึกข้อมูลเคสใหม่`);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // เช็คข้อมูล Investment ของบันทึกข้อมูลเคสใหม่ (บันทึกร่าง)
            // เช็คว่า checkbox ของ รหัสคำขอ enabled หรือไม่
            const isCheckBoxEnabled = await table_newcase.newcase_tbl_chkSelectCase(requestcode).isEnabled();
            if (!isCheckBoxEnabled) {
                console.log(`\nทำการตรวจสอบข้อมูล Investment ของ รหัสคำขอ ${requestcode}`);
                // ค้นหาข้อมูลเคสใหม่
                await newcasePage.searchNewCase({ env: env, branchcode: branchcode, agentcode: agentcode });
                // รอ request api โหลดเสร็จ
                await Promise.all([
                    page.waitForResponse(res =>
                        res.url().includes('/nbsweb/secure/remoteaction/ulnbapp/newcase/submit/application/v2/getSalesTool.html') && res.status() === 200
                    ),
                    // กด แก้ไข ข้อมูลเคสใหม่
                    await newcasePage.clickEditNewCase(requestcode)
                ]);
                // ตรวจสอบข้อมูล Investment ใน Tab 1: การจัดสรรสัดส่วนการลงทุน
                await newcasePage.formEditNewCase_Tab1_Investment({ criteriasuitability: criteriasuitability, criteriaevaluatedate: todaydate, fundname: fundname, insureamountfund: insureamountfund, fundname_topup: fundname_topup, fundpercent_topup: fundpercent_topup });
                // บันทึกแบบร่าง
                await newcasePage.formAddNewCase_SaveDraft();
                console.log(`ตรวจสอบข้อมูล Investment ของ รหัสคำขอ ${requestcode} เสร็จสิ้น`);
            } else {
                console.log(`\nข้อมูล Investment ของ รหัสคำขอ ${requestcode} ทำเรียบร้อยแล้ว ข้ามการตรวจสอบข้อมูล Investment`);
            }
            
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // // logout
            // await logoutPage.logoutNBSWeb();

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        }
    }
});