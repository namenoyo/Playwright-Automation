const { test, expect } = require('@playwright/test');

const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');
const { VerifyAssessor } = require('../../pages/CoPayment/verify_assessor.js');
const { ExpenseRecordAuditor } = require('../../pages/CoPayment/expense_record_auditor.js');

import { LoginPage } from '../../pages/login_t.page.js';
import { LogoutPage } from '../../pages/logout.page.js';
import { gotoMenu } from '../../pages/menu.page.js';
import { gotoMenu_NBS_Portal } from '../../pages/menu_nbs_portal.page.js';

import path from 'path';

test('Data Co-Payment', async ({ page }, testInfo) => {

    // เริ่มทำการทดสอบ
    const loginPage = new LoginPage(page);
    const logoutPage = new LogoutPage(page, expect);
    const gotomenu = new gotoMenu(page, expect);
    const gotomenu_nbs_portal = new gotoMenu_NBS_Portal(page, expect);
    const verify_assessor = new VerifyAssessor(page, expect);
    const expense_record_auditor = new ExpenseRecordAuditor(page, expect);

    let rows = [];

    // Fetch data from Google Sheets before all tests
    const googlesheet = new GoogleSheet();
    const auth = await googlesheet.initAuth();
    const spreadsheetId = '1OCNWPq2uMoiC-PRhA85Ewe-WSHqNpILFY4DR_hxUX9I';
    const readrange = `Test_Data!A4:BT1000000`;
    rows = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);

    const sheetnamewrite = `Test_Data`;
    const range_write = `A4:BT`;

    // console.log(`Total rows fetched: ${rows.length}`);
    // console.log(`Rows data:`, rows);

    // setting เวลาให้เคสนี้รัน
    test.setTimeout(36000000); // 10 ชั่วโมง

    for (const [index, row] of rows.entries()) {

        // ชื่อ header key สำหรับการอ้างอิง
        const uniquekey = 'Unique_running';
        const row_header = 4; // เนื่องจากมี header อยู่ที่แถวที่ 4

        // ดึงค่าต่างๆ มาใส่ตัวแปร
        const env = row.ENV_Test;
        const rowdata = row.Unique_running;
        const statusdata = row.status;
        const username = row.Assessor;
        const password = row.Password_Assessor;
        const policyno = row.Policy_No;
        const namehospital = `${row['ชื่อสถานพยาบาล *']}`;
        const datetimesentdocumenthospital = row['วันและเวลาที่สถานพยาบาลส่งเอกสาร *'];
        const datetimeincident = row['วันและเวลาที่เกิดเหตุ *'];
        const datetimetreatmentstart = row['วันและเวลาที่เข้ารับการรักษา *'];
        const datetimedischargehospital = row['วันและเวลาที่ออกจากสถานพยาบาล *'];
        const totalamountclaim = row['จำนวนเงินที่เรียกร้องทั้งหมด *'];
        const daysicuroom = row['จำนวนวันที่เรียกร้องห้อง ICU *'];
        const bloodpressure = row['Blood Pressure (BP) *'];
        const heartrate = row['Heart Rate / Pulse Rate (HR / PR)'];
        const temperature = row['Temperature (T) *'];
        const respirationrate = row['Respiration Rate (RR) *'];
        const claimtype = row['Claim Type *'];
        const causeofclaim = row['Cause of Claim *'];
        const treatmentresult = row['ผลการรักษา *'];
        const treatmentplan = row['Treatment Plan *'];
        const incidentcause = row['Incident Cause (สาเหตุการเคลม) *'];
        const rider = row['สัญญาเพิ่มเติม *'];
        const icd10 = row['icd10 code'];
        const servicetypecode = row['Service Type'];
        const chargeamount = row['Charge Amount'];
        const standardbilling = row['Standard Billing *'];
        const protectioncategory = row['หมวดความคุ้มครอง *'];
        const path_file = path.resolve(__dirname, '../../pic/ochi-thank@2x.png');
        const documentname = 'สำเนาบัตรประชาชน/ใบขับขี่ ผอป./สำเนาสูติบัตร/สำเนาบัตรประชาชนผู้ปกครอง';
        const documentothername = 'บัตรประกัน ผอป.';
        const surgery = row['ผ่าตัดใหญ่'];
        const remark_auditor = row['หมายเหตุ'];

        // สร้าง array สำหรับเก็บผลลัพธ์
        let data_create = [];

        // แสดงสถานะปัจจุบัน
        if (statusdata === 'Waiting for make data') {
            console.log(`\nเริ่มทำการสร้างข้อมูลสำหรับ ${uniquekey}: ${rowdata} | Policy No: ${policyno}`);
            // ไปยังหน้า NBS
            await loginPage.gotoNBSENV(env);
        } else if (statusdata === 'Process make data') {
            console.log(`\nดำเนินการต่อในการสร้างข้อมูลสำหรับ ${uniquekey}: ${rowdata} | Policy No: ${policyno}`);
            // ไปยังหน้า NBS
            await loginPage.gotoNBSENV(env);
        }

        // Process Assessor
        if ((statusdata === 'Waiting for make data' || statusdata === 'Process make data') && row.เลขที่รับเรื่องตรวจสอบสิทธิ์ === '' && row.เลขที่รับเรื่องบันทึกค่าใช้จ่าย === '') {

            // อัพเดท status เป็น 'Process make data'
            data_create.push({ [uniquekey]: rowdata, status: 'Process make data' });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

            // ----------------------------------------------------------------------------------------------------------------
            // เริ่มขั้นตอนการทดสอบด้วย Playwright
            // ----------------------------------------------------------------------------------------------------------------

            // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
            await loginPage.login(username, password);

            // ไปยังเมนู
            await gotomenu.menuAll('ระบบงาน NBS Portal', 'ระบบ Claim System');
            await page.waitForLoadState('networkidle');

            // ไปยังเมนู NBS Portal
            await gotomenu_nbs_portal.menuAll('Fax Claim', 'ตรวจสอบสิทธิ์และประเมินค่าใช้จ่าย (Assessor)');
            await page.waitForLoadState('networkidle');

            // กดเพิ่มรายการรับเรื่อง
            await verify_assessor.addReceiptVerifyAssessor();
            // ค้นหาและเพิ่มรายการรับเรื่อง
            await verify_assessor.searchaddReceiptVerifyAssessor({ policyno: policyno, env: env });
            // กรอกข้อมูลในหน้าจอ ตรวจสอบสิทธิ์และประเมินค่าใช้จ่าย (Assessor)
            await verify_assessor.informationVerifyAssessor({ namehospital: namehospital, datetimesentdocumenthospital: datetimesentdocumenthospital, datetimeincident: datetimeincident, datetimetreatmentstart: datetimetreatmentstart, datetimedischargehospital: datetimedischargehospital, daysicuroom: daysicuroom, bloodpressure: bloodpressure, heartrate: heartrate, temperature: temperature, respirationrate: respirationrate, claimtype: claimtype, causeofclaim: causeofclaim, treatmentresult: treatmentresult, treatmentplan: treatmentplan, incidentcause: incidentcause, rider: rider, servicetypecode: servicetypecode, policyno: policyno, chargeamount: chargeamount, path_file: path_file, documentname: documentname, documentothername: documentothername, standardbilling: standardbilling, protectioncategory: protectioncategory, totalamountclaim: totalamountclaim, icd10: icd10 });
            // save ข้อมูล ตรวจสอบสิทธิ์และประเมินค่าใช้จ่าย (Assessor)
            const value_success = await verify_assessor.saveinformationVerifyAssessor();
            const aboutauthenticationNovalue = value_success.aboutauthenticationNo;
            const expenseNovalue = value_success.expenseNo;
            const auditornamevalue = value_success.auditorname;

            // อัพเดท เลขที่รับเรื่อง และ เลขที่ค่าใช้จ่าย
            data_create.push({ [uniquekey]: rowdata, เลขที่รับเรื่องตรวจสอบสิทธิ์: aboutauthenticationNovalue, เลขที่รับเรื่องบันทึกค่าใช้จ่าย: expenseNovalue, ['Full Name']: auditornamevalue });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

            // ออกจากระบบ
            await logoutPage.logoutNBSPortal();
            await page.waitForLoadState('networkidle');

            await page.waitForTimeout(1000); // รอ 1 วินาที เพื่อรอให้ระบบอัพเดทข้อมูลเสร็จสมบูรณ์
        }

        let rows2 = [];
        let usernameauditor, passwordauditor, statusdataauditor, aboutauthenticationnoauditor, expensenoauditor, necessaryadmit;
        // เช็คจากสถานะก่อน เพื่อไม่ต้อง fetch ข้อมูลซ้ำ จากข้อมูลที่ไม่ได้พร้อมทำรายการ
        if (statusdata === 'Process make data' || statusdata === 'Waiting for make data') {

            const fields = ['Auditor', 'Password_Auditor', 'status', 'เลขที่รับเรื่องตรวจสอบสิทธิ์', 'เลขที่รับเรื่องบันทึกค่าใช้จ่าย', 'ความจำเป็นต้อง Admit'];
            // Fetch data from Google Sheets before all tests
            rows2 = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange, fields);

            usernameauditor = rows2[index].Auditor;
            passwordauditor = rows2[index].Password_Auditor;
            statusdataauditor = rows2[index].status;
            aboutauthenticationnoauditor = rows2[index].เลขที่รับเรื่องตรวจสอบสิทธิ์;
            expensenoauditor = rows2[index].เลขที่รับเรื่องบันทึกค่าใช้จ่าย;
            //    auditornameauditor = rows2[index]['Full Name'];
            necessaryadmit = rows2[index]['ความจำเป็นต้อง Admit'];
        }

        // Process Auditor
        if (statusdataauditor === 'Process make data' && aboutauthenticationnoauditor !== '' && expensenoauditor !== '') {

            // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
            await loginPage.login(usernameauditor, passwordauditor);

            // ไปยังเมนู
            await gotomenu.menuAll('ระบบงาน NBS Portal', 'ระบบ Claim System');
            await page.waitForLoadState('networkidle');

            // ไปยังเมนู NBS Portal
            await gotomenu_nbs_portal.menuAll('Fax Claim', 'บันทึกค่าใช้จ่าย (Auditor)');
            await page.waitForLoadState('networkidle');

            // ค้นหาข้อมูลในหน้าจอ บันทึกค่าใช้จ่าย (Auditor)
            await expense_record_auditor.searchExpenseRecordAuditor({ expenserecordreceiptno: expensenoauditor });
            // กรอกข้อมูลในหน้าจอ บันทึกค่าใช้จ่าย (Auditor)
            await expense_record_auditor.informationExpenseRecordAuditor({ necessaryadmit: necessaryadmit, surgery: surgery, remark_auditor: remark_auditor });
            // save ข้อมูล บันทึกค่าใช้จ่าย (Auditor)
            await expense_record_auditor.saveExpenseRecordAuditor();

            // ----------------------------------------------------------------------------------------------------------------
            // จบการทดสอบด้วย Playwright
            // ----------------------------------------------------------------------------------------------------------------

            // datetime finish time (yyyy-mm-dd hh:mm:ss)
            const now = new Date();
            const thTime = new Intl.DateTimeFormat('th-TH', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false, timeZone: 'Asia/Bangkok'
            }).format(now);
            // แปลงรูปแบบให้เป็น yyyy-mm-dd hh:mm:ss
            const [d, t] = thTime.split(' ');
            const [day, month, year] = d.split('/');
            const finishTime = `${year}-${month}-${day} ${t}`;

            // อัพเดท status เป็น 'Finish make data'
            data_create.push({ [uniquekey]: rowdata, status: 'Finish make data', ['Finish Time']: finishTime, ['Testing By']: 'Automate Playwright' });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

            // ออกจากระบบ
            await logoutPage.logoutNBSPortal();
            await page.waitForLoadState('networkidle');

            console.log(`\nเสร็จสิ้นการสร้างข้อมูลสำหรับ ${uniquekey}: ${rowdata} | Policy No: ${policyno}\n`);
            console.log(`----------------------------------------------`);
        }

    }
});