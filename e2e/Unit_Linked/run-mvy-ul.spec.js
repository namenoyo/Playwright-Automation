const { test, expect } = require('@playwright/test');

// database
const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');

// Utils
const { calculateYearsOnly } = require('../../utils/common.js');

// Data Dictionary
const { fund_code_dictionary } = require('../../data/Unit_Linked/fund_code_dict.data.js');

// Locators
const { menubar_InvestmentOrderCheck, table_InvestmentOrderCheck } = require('../../locators/Unit_Linked/InvestmentOrderCheck.locators.js');
const { menubar_InvestmentOrderResult, table_InvestmentOrderResult } = require('../../locators/Unit_Linked/InvestmentOrderResult.locators.js');
const { table_DailyNavUpdate } = require('../../locators/Unit_Linked/DailyNavUpdate.locator.js');
const { table_InvestmentOrderConfirm } = require('../../locators/Unit_Linked/InvestmentOrderConfirm.locators.js');
const { menubar_InvestmentOrderOper } = require('../../locators/Unit_Linked/VerifyInvestmentOrderSellOper.locators.js');
const { menubar_InvestmentBuyOrderOper } = require('../../locators/Unit_Linked/VerifyInvestmentOrderBuyOper.locators.js');

// Page
const { MonitorBatchPage } = require('../../pages/Unit_Linked/MonitorBatchPage.js');
const { InvestmentOrderCheckPage } = require('../../pages/Unit_Linked/InvestmentOrderCheckPage.js');
const { InvestmentOrderResultPage } = require('../../pages/Unit_Linked/InvestmentOrderResultPage.js');
const { DailyNavUpdatePage } = require('../../pages/Unit_Linked/DailyNavUpdatePage.js');
const { FundRedemptionReceipt } = require('../../pages/Unit_Linked/FundRedemptionReceiptPage.js');
const { BatchManualSupportPage } = require('../../pages/Unit_Linked/BatchManualSupportPage.js');
const { VerifyInvestmentOrderSellOperPage } = require('../../pages/Unit_Linked/VerifyInvestmentOrderSellOperPage.js');
const { VerifyInvestmentOrderBuyOperPage } = require('../../pages/Unit_Linked/VerifyInvestmentOrderBuyOperPage.js');
const { InvestmentOrderConfirmPage } = require('../../pages/Unit_Linked/InvestmentOrderConfirmPage.js');
const { ImportPayBillsPage } = require('../../pages/Unit_Linked/BackOffice/ImportPayBillsPage.js');

// Login, menu
import { LoginPage } from '../../pages/login_t.page.js';
import { LogoutPage } from '../../pages/logout.page.js';
import { gotoMenu } from '../../pages/menu.page.js';
import path from 'path';
import fs from 'fs';

// utils
const adjustDate = require('../../utils/dateAdjuster.js');
const { toDashed, toPlain } = require('../../utils/formatDate.js');


test('Run MVY UL', async ({ page }) => {

    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    // ข้อมูลสำหรับทดสอบ
    const username = 'boss';
    const password = '1234';
    const policyno = 'UL00003034'; // เลขกรมธรรม์ที่ต้องการทดสอบ
    const env = 'SIT' // SIT / UAT
    const fix_endloop = ''; // กำหนดจำนวนรอบที่ต้องการให้ทำงาน (ถ้าไม่ต้องการให้ทำงานแบบวนซ้ำ ให้กำหนดเป็นค่าว่าง '')
    const auto_buyorder_Loyalty_Bonus = true; // กำหนดให้สร้างคำสั่งซื้ออัตโนมัติ สำหรับ กรณีเงินปันผลสะสม (Loyalty Bonus) เท่านั้น (true / false)
    const auto_pay_bills = true; // กำหนดให้ชำระบิลอัตโนมัติ (true / false)
    const skip_create_update_rv = false; // ข้ามการสร้าง/อัพเดท RV (true / false)
    const skip_auto_pay_bills = false; // ข้ามการชำระบิลอัตโนมัติ (true / false)
    const auto_pay_bills_count = 1; // จำนวนครั้งที่ต้องการจ่ายบิลอัตโนมัติ (กรณีทดสอบหลายรอบ)
    // connection database
    const db_name = 'coreul';
    const db_env = 'SIT_EDIT'; // SIT | SIT_EDIT / UAT | UAT_EDIT

    // Login
    const loginPage = new LoginPage(page);
    const logoutPage = new LogoutPage(page, expect);
    // menu
    const gotomenu = new gotoMenu(page, expect);
    // Page
    const monitorBatchPage = new MonitorBatchPage(page, expect);
    const investmentOrderCheckPage = new InvestmentOrderCheckPage(page, expect);
    const investmentOrderResultPage = new InvestmentOrderResultPage(page, expect);
    const dailyNavUpdatePage = new DailyNavUpdatePage(page, expect);
    const fundRedemptionReceipt = new FundRedemptionReceipt(page, expect);
    const batchManualSupportPage = new BatchManualSupportPage(page, expect);
    const verifyInvestmentOrderSellOperPage = new VerifyInvestmentOrderSellOperPage(page, expect);
    const verifyInvestmentOrderBuyOperPage = new VerifyInvestmentOrderBuyOperPage(page, expect);
    const investmentOrderConfirmPage = new InvestmentOrderConfirmPage(page, expect);
    const importPayBillsPage = new ImportPayBillsPage(page, expect);


    // ไปยังหน้า NBS
    await loginPage.gotoNBSENV(env);
    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
    await loginPage.login(username, password);

    let check_genbill = false; // ตัวแปรเช็คว่ามีการสร้างบิลหรือยัง
    let check_genbill_after = false; // ตัวแปรเช็คว่ามีการสร้างบิลหรือยัง หลังจากรัน batch

    let endloop;
    let loopCount = 0;
    const maxLoop = fix_endloop !== '' ? Number(fix_endloop) : Infinity;

    let stop_auto_pay_bills = 0;

    while (endloop !== 'Y' && loopCount < maxLoop) { // หลังจากเสร็จแล้วต้องเอา endloop !== '1' ออก เพราะจะแค่ทดสอบ 1 รอบ

        console.log('\n-------------------------------------------- Start of Process --------------------------------------------');

        let db;

        db = new Database({
            user: configdb[db_name][db_env].DB_USER,
            host: configdb[db_name][db_env].DB_HOST,
            database: configdb[db_name][db_env].DB_NAME,
            password: configdb[db_name][db_env].DB_PASSWORD,
            port: configdb[db_name][db_env].DB_PORT,
        });

        const query_next_due = 'select p.PMNDDT from tpsplc01 p where p.polnvc = $1;';
        const query_mvy = 'select p.NMFDDT from tpsplc01 p where p.polnvc = $1;';
        const query_check_policy_year = 'select p.CTSTDT,p.NMFDDT from tpsplc01 p where p.polnvc = $1;';
        const params = [policyno];

        const result_next_due = await db.query(query_next_due, params);
        const result_mvy = await db.query(query_mvy, params);
        const result_check_policy_year = await db.query(query_check_policy_year, params);

        const next_due_date = result_next_due.rows[0].pmnddt;
        const mvy_date = result_mvy.rows[0].nmfddt;
        const start_policy_date = result_check_policy_year.rows[0].ctstdt;
        const mvy_date_policy = result_check_policy_year.rows[0].nmfddt;
        const year_calculate = calculateYearsOnly(start_policy_date, mvy_date_policy);
        // + 1 เพื่อให้ตรงกับปีกรมธรรม์ที่แสดงในระบบ (ปีกรมธรรม์นับจากวันครบรอบปีกรมธรรม์ครั้งถัดไป)
        const policy_year = year_calculate + 1;
        // const policy_year = 5; // test กรณี ปีกรมธรรม์ >= 5

        const cutText_next_due_date = next_due_date.substring(0, 8);

        console.log('\nวันที่กำหนดชำระถัดไป (Next Due): ' + cutText_next_due_date);
        console.log('วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY): ' + mvy_date);
        console.log('ปีกรมธรรม์: ' + policy_year);

        // ฟังก์ชันแปลง yyyyMMdd → Date
        function parseDate(yyyymmdd) {
            const year = yyyymmdd.substring(0, 4);
            const month = yyyymmdd.substring(4, 6);
            const day = yyyymmdd.substring(6, 8);
            return new Date(`${year}-${month}-${day}`);
        }
        // ฟังก์ชันแปลง Date → yyyyMMdd ลบ 1 วันก่อน
        function formatDateMinusOne(date) {
            const d = new Date(date); // clone เพื่อไม่กระทบ date ต้นฉบับ
            d.setDate(d.getDate() - 1); // ลบ 1 วัน

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}${month}${day}`;
        }
        // ฟังก์ชันแปลง Date → yyyyMMdd บวก 1 วันก่อน
        function formatDatePlusOne(date) {
            const d = new Date(date); // clone เพื่อไม่กระทบ date ต้นฉบับ
            d.setDate(d.getDate() + 1); // บวก 1 วัน

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}${month}${day}`;
        }
        // ฟังก์ชันแปลง Date → yyyyMMdd ลบ 30 วันก่อน
        function formatDateMinus30(date) {
            const d = new Date(date); // clone เพื่อไม่กระทบ date ต้นฉบับ
            d.setDate(d.getDate() - 30); // ลบ 30 วัน

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}${month}${day}`;
        }
        // ฟังก์ชันแปลง yyyyMMdd → Date object → ddMMyyyy (ปี พ.ศ.)
        function convertToThaiDate(yyyymmdd) {
            const year = parseInt(yyyymmdd.substring(0, 4), 10);
            const month = yyyymmdd.substring(4, 6);
            const day = yyyymmdd.substring(6, 8);

            const thaiYear = year + 543;
            return `${day}${month}${thaiYear}`;
        }

        // แปลงเป็น Date object
        const nextDueDate = parseDate(cutText_next_due_date);
        const mvyDateObj = parseDate(mvy_date);

        const business_process_date = formatDateMinusOne(mvyDateObj);
        const gen_bill_date = formatDateMinus30(nextDueDate); // วันตัดรอบบิล

        const genbillDate = parseDate(gen_bill_date);
        const businessProcessDate_genbill = formatDateMinusOne(genbillDate);

        console.log('\nBusiness process date (วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY) - 1 day): ' + business_process_date);
        console.log('วันที่ทำการสร้างบิล (Bill) (วันที่กำหนดชำระถัดไป (Next Due) - 30 days): ' + gen_bill_date);

        // เช็คคำสั่งขายคงค้าง ก่อนสร้างบิลและ ชำระบิล
        const query_first_check_invoice = "select distinct ordrdt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and irstvc = 'IR01'"
        const result_first_check_invoice = await db.query(query_first_check_invoice, [policyno]);
        const first_invoice_count = result_first_check_invoice.rows.length;

        // เปรียบเทียบ
        if (mvyDateObj >= genbillDate && check_genbill === false && first_invoice_count === 0) {
            if (check_genbill_after === false) {
                // Check ว่า Gen bill สำเร็จหรือไม่
                const query_check_date_ref2 = 'select p.egrpdt from tpsplc01 p where p.polnvc = $1;';
                const query_check_genbill = 'select count(*) as countgenbill from tbcbil01 where polnvc = $1 and ref2vc = $2;';

                // ดึงข้อมูลจาก database มาเช็ค
                const params_check_date_ref2 = await db.query(query_check_date_ref2, [policyno]);
                const cutText_end_grace_period = params_check_date_ref2.rows[0].egrpdt.substring(0, 8);
                const convert_cutText_end_grace_period = convertToThaiDate(cutText_end_grace_period);

                // เช็คว่ามีการสร้างบิลหรือไม่
                const params_check_genbill = await db.query(query_check_genbill, [policyno, convert_cutText_end_grace_period]);
                console.log('\nจำนวนบิลที่เจอ: ' + params_check_genbill.rows[0].countgenbill);

                if (params_check_genbill.rows[0].countgenbill > 0) {
                    check_genbill = true;
                    console.log('สร้างบิลเรียบร้อยแล้ว');
                } else {
                    check_genbill_after = true;
                    console.log('ยังไม่มีการสร้างบิล ต้องไปรัน batch เพื่อสร้างบิล');
                }
            } else {
                console.log("\nไป Generate Bill: วันที่กำหนดชำระถัดไป (Next Due) < วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY) and วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY) >= วันที่ทำการสร้างบิล (Bill)");

                console.log('business and current process date: ' + businessProcessDate_genbill + ' process date: ' + gen_bill_date);

                // update database
                const query_update_all_date_policy = 'update tpsplc01 set busndt = $2, crpcdt = $2, pctddt = $3 where polnvc = $1;';
                const result_update_all_date_policy = await db.query(query_update_all_date_policy, [policyno, businessProcessDate_genbill, gen_bill_date]);

                console.log('Update all date policy result: ' + result_update_all_date_policy.rowCount);

                /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
                // รอหน้าโหลดเสร็จ
                await page.waitForLoadState('networkidle');
                await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });

                // ทำการรัน batch manual ที่หน้าเว็บ
                // เช็คสถานะ batch ก่อนรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
                await monitorBatchPage.checkStatusBeforeRunBatch();

                // รัน batch MVY UL
                await monitorBatchPage.runJobBatchDailyPolicy({ policyno: policyno });

                // เช็คสถานะ batch หลังรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
                await monitorBatchPage.checkStatusAfterRunBatch();

                /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                // Check ว่า Gen bill สำเร็จหรือไม่
                const query_check_date_ref2 = 'select p.egrpdt from tpsplc01 p where p.polnvc = $1;';
                const query_check_genbill = 'select count(*) as countgenbill from tbcbil01 where polnvc = $1 and ref2vc = $2;';

                // ดึงข้อมูลจาก database มาเช็ค
                const params_check_date_ref2 = await db.query(query_check_date_ref2, [policyno]);
                const cutText_end_grace_period = params_check_date_ref2.rows[0].egrpdt.substring(0, 8);
                const convert_cutText_end_grace_period = convertToThaiDate(cutText_end_grace_period);

                // เช็คว่ามีการสร้างบิลหรือไม่
                const params_check_genbill = await db.query(query_check_genbill, [policyno, convert_cutText_end_grace_period]);
                console.log('\nจำนวนบิลที่เจอ: ' + params_check_genbill.rows[0].countgenbill);

                if (params_check_genbill.rows[0].countgenbill > 0) {
                    check_genbill = true;
                    console.log('สร้างบิลเรียบร้อยแล้ว');
                }
            }
        } else if (nextDueDate <= mvyDateObj && skip_auto_pay_bills === false && first_invoice_count === 0) {
            if (auto_pay_bills === true) {
                // logout NBS
                await logoutPage.logoutNBSWeb();
                await page.waitForTimeout(1000); // รอหน้า logout เสร็จ

                // ทำการตรวจสอบก่อนว่ามีการชำระบิลอัตโนมัติหรือยัง
                // เช็ค ref2vc ล่าสุด
                const query_check_ref2_after_genbill = 'select ref1vc, ref2vc from tbcbil01 where polnvc = $1 order by blpmid desc limit 1'
                const params_check_ref2_after_genbill = await db.query(query_check_ref2_after_genbill, [policyno]);

                const ref2vc_after_bill_latest = params_check_ref2_after_genbill.rows[0].ref2vc;

                // เช็คว่ามีการ match bill หรือไม่ใน database
                const query_check_have_bill = 'select mcstvc,depovc,polnvc,ref2vc from tbcpym01 where polnvc = $1 and ref2vc = $2;';
                const result_check_have_bill = await db.query(query_check_have_bill, [policyno, ref2vc_after_bill_latest]);

                if (result_check_have_bill.rows.length > 0) {
                    console.log("\nหยุดทำงาน: มีการชำระบิลอัตโนมัติไปแล้ว");

                    console.log(result_check_have_bill.rows[0].mcstvc, result_check_have_bill.rows[0].depovc, result_check_have_bill.rows[0].polnvc, result_check_have_bill.rows[0].ref2vc);

                    // ไปยังหน้า NBS
                    await loginPage.gotoNBSENV(env);
                    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
                    await loginPage.login(username, password);

                    return endloop = 'Y';
                } else {
                    // ดึงข้อมูล Bill
                    const query_check_date_ref2 = 'select p.egrpdt, p.pmnddt from tpsplc01 p where p.polnvc = $1;';
                    const query_check_genbill = 'select ref1vc, ref2vc , spambd from tbcbil01 where polnvc = $1 and ref2vc = $2;';

                    // ดึงข้อมูลจาก database มาเช็ค
                    const params_check_date_ref2 = await db.query(query_check_date_ref2, [policyno]);

                    const cutText_end_grace_period = params_check_date_ref2.rows[0].egrpdt.substring(0, 8);
                    const convert_cutText_end_grace_period = convertToThaiDate(cutText_end_grace_period);
                    // const year_grace_period = cutText_end_grace_period.substring(0, 4); // ปี ค.ศ.
                    // const month_grace_period = cutText_end_grace_period.substring(4, 6); // เดือน
                    // const day_grace_period = cutText_end_grace_period.substring(6, 8); // วัน

                    const cutText_due_period = params_check_date_ref2.rows[0].pmnddt.substring(0, 8);
                    const year_due_period = cutText_due_period.substring(0, 4); // ปี ค.ศ.
                    const month_due_period = cutText_due_period.substring(4, 6); // เดือน
                    const day_due_period = cutText_due_period.substring(6, 8); // วัน

                    // เช็คว่ามีการสร้างบิลหรือไม่
                    const params_check_genbill = await db.query(query_check_genbill, [policyno, convert_cutText_end_grace_period]);

                    console.log("\nทำการชำระบิลอัตโนมัติ");

                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // ไปที่ เว็ปไซต์ QA generate file ชำระบิลอัตโนมัติ
                    await page.goto('https://qatool.ochi.link/#');
                    // รอหน้าโหลดเสร็จ
                    await page.waitForLoadState('networkidle');
                    // กดเมนู Gen Text File Counter Bank
                    await page.locator("a[onclick=\"switchTab('dline')\"]").click({ timeout: 10000 });
                    // รอหน้าโหลดเสร็จ
                    await expect(page.locator('text=📄  Generator Text File - Counter Bank V.1')).toBeVisible({ timeout: 60000 });
                    // เลือก dropdown 002 BBL
                    await page.locator('select#bankCommon').selectOption('002', { timeout: 10000 });
                    // คลิ๊กช่องวันที่
                    await page.locator('input#txnDate').click({ timeout: 10000 });
                    // กรอกวันที่
                    // await page.locator('input#txnDate').type(`${month_due_period}${day_due_period}${year_due_period}`, { delay: 200 });
                    // await page.waitForTimeout(500); // รอให้ระบบประมวลผล
                    // เคลียร์ค่าช่อง Effective Date
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(0).fill('');
                    // กรอก Effective Date
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(0).type(`${day_due_period}${month_due_period}${year_due_period}`, { delay: 100 });
                    // เคลียร์ค่าช่อง Payment Date
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(1).fill('');
                    // กรอก Payment Date
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(1).type(`${day_due_period}${month_due_period}${year_due_period}`, { delay: 100 });
                    // เคลียร์ค่าช่อง Ref1
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(3).fill('');
                    // กรอก Ref1 (เลขที่บิล)
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(3).type(params_check_genbill.rows[0].ref1vc, { delay: 100 });
                    // เคลียร์ค่าช่อง Ref2
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(4).fill('');
                    // กรอก Ref2 (วันสิ้นสุดระยะเวลาผ่อนผัน)
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(4).type(params_check_genbill.rows[0].ref2vc, { delay: 100 });
                    // เคลียร์ค่าช่อง Amount
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(5).fill('');
                    // กรอก Amount (จำนวนเงินบิล)
                    const amount = `${params_check_genbill.rows[0].spambd.replace(',', '')}`;
                    // ลบ หลัง . ให้เหลือแค่ 2 ตำแหน่ง
                    const decimalIndex = amount.indexOf('.');
                    let formattedAmount = amount;
                    if (decimalIndex !== -1) {
                        formattedAmount = amount.substring(0, decimalIndex + 3);
                    }
                    console.log('จำนวนเงินบิลที่ต้องชำระ: ' + formattedAmount);
                    await page.locator('table#detailTable').locator('tbody > tr > td > input').nth(5).type(formattedAmount, { delay: 100 });
                    // กดปุ่ม Generate
                    await page.locator('button[onclick="generateText()"]').click({ timeout: 10000 });
                    // เช็คว่ามีข้อมูลขึ้นใน textarea หรือไม่
                    await expect(page.locator('textarea#outputArea')).toHaveText(/./, { timeout: 60000 });

                    // 🧭 สร้าง path ของโฟลเดอร์ปลายทาง (อยู่ในโฟลเดอร์ Playwright)
                    const downloadDir = path.resolve(__dirname, '../../generate_file_bill_counter_bank');

                    // 🧹 เคลียร์ไฟล์เก่าทั้งหมดในโฟลเดอร์ก่อนดาวน์โหลดใหม่
                    const files = fs.readdirSync(downloadDir);
                    for (const file of files) {
                        const filePath = path.join(downloadDir, file);
                        if (fs.lstatSync(filePath).isFile()) {
                            fs.unlinkSync(filePath);
                        }
                    }
                    console.log(`🧹 เคลียร์ไฟล์เก่าในโฟลเดอร์: ${downloadDir}`);

                    // 🕹️ คลิกปุ่มที่ทำให้เกิดการดาวน์โหลด
                    const [download] = await Promise.all([
                        page.waitForEvent('download'),
                        // กดปุ่ม Export
                        await page.locator('button[onclick="downloadTxt()"]').click({ timeout: 10000 }), // 👈 เปลี่ยน selector ตามจริง
                    ]);
                    const now = new Date();
                    const thaiTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // บวก 7 ชั่วโมง
                    const datetime = thaiTime
                        .toISOString()
                        .replace(/[-:]/g, '')
                        .replace('T', '_')
                        .split('.')[0]; // เช่น 20251110_162045

                    const customFilename = `BBL_${datetime}.txt`; // 👈 เปลี่ยนนามสกุลตามไฟล์จริง (csv, xlsx, etc.)

                    // 💾 เซฟไฟล์ตามชื่อที่เรากำหนด
                    const savePath = path.join(downloadDir, customFilename);
                    await download.saveAs(savePath);

                    console.log('✅ บันทึกไฟล์แล้วที่:', savePath);

                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // ไปยังหน้า NBS
                    await loginPage.gotoNBSENV(env);
                    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
                    await loginPage.login(username, password);

                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "Batch Manual Support"
                    await gotomenu.menuAll('ระบบงาน Back Office', 'ใบเสร็จส่วนกลาง', 'นำเข้าไฟล์การชำระเงิน', 'นำเข้าไฟล์การชำระเงิน');

                    // นำเข้าไฟล์ชำระบิล
                    await importPayBillsPage.importfilePayBills({ filename: customFilename });

                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // เช็ค ref2vc ล่าสุด
                    const query_check_ref2_genbill = 'select ref1vc, ref2vc from tbcbil01 where polnvc = $1 order by blpmid desc limit 1'
                    const params_check_ref2_genbill = await db.query(query_check_ref2_genbill, [policyno]);

                    const ref2vc_latest = params_check_ref2_genbill.rows[0].ref2vc;

                    // เช็คว่ามีการ match bill หรือไม่ใน database
                    const query_check_match_bill = 'select mcstvc,depovc,polnvc,ref2vc from tbcpym01 where polnvc = $1 and ref2vc = $2;';
                    const result_check_match_bill = await db.query(query_check_match_bill, [policyno, ref2vc_latest]);

                    const retry_loop_count = 12;
                    let retry_loopcount = 0;
                    let status_match_bill = '';
                    let check_loop_count = 0;

                    // เช็คว่ามีข้อมูลในตาราง tbcpym01 หรือไม่ ถ้ายังไม่มีให้ loop เช็คจนกว่าจะเจอหรือครบจำนวนรอบที่กำหนด
                    if (result_check_match_bill.rows.length === 0) {

                        let result_check_match_bill_count = result_check_match_bill.rows.length;

                        while (result_check_match_bill_count === 0 && check_loop_count < retry_loop_count) {
                            console.log('\nยังไม่มีข้อมูลในตาราง tbcpym01 รอ 10 วินาที แล้วเช็คใหม่อีกครั้ง');
                            await page.waitForTimeout(10000);
                            check_loop_count++;

                            // เช็คว่ามีการ match bill หรือไม่ใน database
                            const try_result_check_match_bill_count = await db.query(query_check_match_bill, [policyno, ref2vc_latest]);
                            result_check_match_bill_count = try_result_check_match_bill_count.rows.length;
                        }

                        if (result_check_match_bill_count === 0) {
                            console.log('\nไม่มีข้อมูลในตาราง tbcpym01 ');
                            console.log('\nหยุดทำงาน: เนื่องจากไม่มีข้อมูลการชำระบิลในตาราง tbcpym01');
                            return endloop = 'Y';
                        } else {
                            console.log('\nพบข้อมูลในตาราง tbcpym01 แล้ว');
                        }
                    }

                    // recheck ข้อมูลในตาราง tbcpym01 อีกครั้ง
                    const result_check_match_bill_retry = await db.query(query_check_match_bill, [policyno, ref2vc_latest]);

                    // เช็คว่า สถานะการแมทช์บิล (mcstvc) เป็น Match (M) หรือไม่
                    if (result_check_match_bill_retry.rows.length === 0) {
                        console.log('\nไม่มีข้อมูลในตาราง tbcpym01 ');
                    } else {
                        status_match_bill = result_check_match_bill_retry.rows[0].mcstvc;
                        // เช็คว่ามีการ match bill โดยสถานะเป็น mcstvc = 'M' หรือไม่ หรือไม่เกินจำนวนรอบที่กำหนด
                        while (status_match_bill !== 'M' && retry_loopcount < retry_loop_count) {
                            console.log('\nยังไม่มีการแมทช์บิล รอ 10 วินาที แล้วเช็คใหม่อีกครั้ง');
                            await page.waitForTimeout(10000); // รอ 10 วินาที
                            retry_loopcount++;

                            // เช็คว่ามีการ match bill หรือไม่ใน database
                            const try_result_check_match_bill = await db.query(query_check_match_bill, [policyno, ref2vc_latest]);
                            status_match_bill = try_result_check_match_bill.rows[0].mcstvc;
                        }

                        if (status_match_bill === 'M') {
                            console.log('\nทำการ matching สำเร็จโดยสถานะการแมทช์บิล (mcstvc): ' + status_match_bill);
                        } else {
                            console.log('\nทำการ matching ไม่สำเร็จโดยสถานะการแมทช์บิล (mcstvc): ' + status_match_bill);
                            console.log('\nหยุดทำงาน: ไม่สามารถทำการ matching บิลได้');
                            return endloop = 'Y';
                        }
                    }

                    stop_auto_pay_bills++;

                    console.log('\nจำนวนครั้งที่ชำระบิลอัตโนมัติ: ' + stop_auto_pay_bills + ' ครั้ง');

                    // ตรวจสอบจำนวนครั้งที่ชำระบิลอัตโนมัติ ถ้าถึงจำนวนที่กำหนดให้หยุดทำงาน
                    if (stop_auto_pay_bills >= auto_pay_bills_count) {
                        console.log("\nหยุดทำงาน: ชำระบิลอัตโนมัติครบตามจำนวนครั้งที่กำหนด");
                        return endloop = 'Y';
                    }

                    // check_genbill = false; // รีเซ็ตตัวแปรเพื่อให้กลับไปเช็คการสร้างบิลใหม่ในรอบถัดไป
                    // check_genbill_after = false; // รีเซ็ตตัวแปรเพื่อให้กลับไปเช็คการสร้างบิลใหม่ในรอบถัดไป
                }
            } else {
                // logout NBS
                await logoutPage.logoutNBSWeb();

                console.log("\nหยุดทำงาน: วันที่กำหนดชำระถัดไป (Next Due) <= วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY)");
                console.log('\n-------------------------------------------- End of Process --------------------------------------------');
                return endloop = 'Y';
            }  
        } else {

            console.log("\nทำงานต่อ: วันที่กำหนดชำระถัดไป (Next Due) >= วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY)");

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // Create RV
            if (skip_create_update_rv === false) {
                // Create RV if policy year >= 5
                if (policy_year >= 5) {
                    // เช็คว่ามีคำสั่งขายคงค้าง
                    const query_check_invoice_create_rv = "select distinct ordrdt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and irstvc = 'IR01'"
                    const result_check_invoice_create_rv = await db.query(query_check_invoice_create_rv, [policyno]);

                    if (result_check_invoice_create_rv.rows.length > 0) {
                        console.log('\nมีคำสั่งขายคงค้างอยู่ ข้าม step รัน Create RV');
                    } else {

                        console.log("\nทำการรันสร้าง RV เนื่องจาก ปีกรมธรรม์ >= 5");

                        let check_create_rv_success = false;

                        while (!check_create_rv_success) {
                            // ตรวจสอบว่ามีการทำ Create RV หรือยัง
                            const query_check_create_rv = "SELECT * FROM TIVSRV01 WHERE polnvc IN ($1) and trstdt = $2 ORDER BY rvbdid asc ;";
                            const result_check_create_rv = await db.query(query_check_create_rv, [policyno, mvy_date]);
                            if (result_check_create_rv.rows.length > 0) {
                                console.log('มีการสร้าง RV ไปแล้ว ข้ามการรันสร้าง RV');

                                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
                                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
                                // รอหน้าโหลดเสร็จ
                                await page.waitForLoadState('networkidle');
                                await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });

                                check_create_rv_success = true;
                            } else {
                                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "Batch Manual Support"
                                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'Batch Manual Support');
                                // รอหน้าโหลดเสร็จ
                                await page.waitForLoadState('networkidle');
                                await expect(page.locator('div[class="layout-m-hd"]'), { hasText: 'Batch Manual Support' }).toBeVisible({ timeout: 60000 });

                                // รัน batch สร้าง RV UL
                                await batchManualSupportPage.runBatchINV({ batch: 'CreateRV', policyno: policyno, date: mvy_date });

                                // เช็คว่ามีการสร้าง RV สำเร็จหรือไม่
                                const result_check_create_rv_after = await db.query(query_check_create_rv, [policyno, mvy_date]);
                                if (result_check_create_rv_after.rows.length === 0) {
                                    // แสดง error
                                    throw new Error('สร้าง RV ไม่สำเร็จ');
                                } else {
                                    console.log('\nสร้าง RV สำเร็จ');
                                    // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
                                    // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
                                    // // รอหน้าโหลดเสร็จ
                                    // await page.waitForLoadState('networkidle');
                                    // await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });

                                    check_create_rv_success = true;
                                }
                            }
                        }
                    }
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // เช็คคำสั่งขายคงค้าง
            // const query_check_invoice = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'R'"
            const query_check_invoice = "select distinct ordrdt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and irstvc = 'IR01'"
            const result_check_invoice = await db.query(query_check_invoice, [policyno]);

            // เช็คว่ามีคำสั่งขายคงค้างอยู่หรือไม่ ถ้าไม่มีให้รัน Batch Daily
            if (result_check_invoice.rows.length === 0) {

                console.log('\nไม่มีคำสั่งซื้อ-ขายคงค้างอยู่ ไปต่อเพื่อรัน Batch Daily');

                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
                // รอหน้าโหลดเสร็จ
                await page.waitForLoadState('networkidle');
                await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });

                let check_batch_daily_success = false;
                // เช็คว่ามีการรัน Batch Daily สำเร็จจริงไหม
                while (!check_batch_daily_success) {
                    // ปรับวัน วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY)
                    const dashed = toDashed(mvy_date); // แปลงเป็น yyyy-MM-dd
                    const adjustedDate_mvy = adjustDate.adjustDate(dashed);
                    const process_date = toPlain(adjustedDate_mvy); // แปลงเป็น yyyyMMdd

                    console.log('\nbusiness and current process date: ' + business_process_date + ' process date: ' + process_date);

                    // update database
                    const query_update_all_date_policy = 'update tpsplc01 set busndt = $2, crpcdt = $2, pctddt = $3 where polnvc = $1;';
                    const result_update_all_date_policy = await db.query(query_update_all_date_policy, [policyno, business_process_date, process_date]);

                    console.log('Update all date policy result: ' + result_update_all_date_policy.rowCount);

                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // ทำการรัน batch manual ที่หน้าเว็บ
                    // เช็คสถานะ batch ก่อนรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
                    await monitorBatchPage.checkStatusBeforeRunBatch();

                    // รัน batch MVY UL
                    await monitorBatchPage.runJobBatchDailyPolicy({ policyno: policyno });

                    // เช็คสถานะ batch หลังรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
                    await monitorBatchPage.checkStatusAfterRunBatch();

                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // query ตรวจสอบวันที่ของกรมธรรม์
                    const query_check_date_policy = 'select p.busndt from tpsplc01 p where p.polnvc = $1;';
                    const result_check_date_policy = await db.query(query_check_date_policy, [policyno]);

                    // บวก 1 วัน เพื่อเทียบว่าวันที่ business date ของกรมธรรม์ มีการรัน batch แล้วหรือยัง
                    const business_date_policy_plus1 = formatDatePlusOne(parseDate(process_date));
                    if (result_check_date_policy.rows[0].busndt === business_date_policy_plus1) {
                        check_batch_daily_success = true;
                        console.log('\nรัน Batch Daily สำเร็จ');
                    } else {
                        console.log('\nรัน Batch Daily ไม่สำเร็จ ต้องรันใหม่');
                    }
                }

            } else {
                console.log('\nมีคำสั่งซื้อ-ขายคงค้างอยู่ ข้าม step รัน Batch Daily');
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // Update RV
            if (skip_create_update_rv === false) {
                // Update RV if policy year >= 5
                if (policy_year >= 5) {

                    // ตรวจสอบว่ามีการทำ update RV หรือยัง
                    const query_check_update_rv = "SELECT trstdt,rvbdid,mnrvbd,tprvbd,torvbd,smrvbd FROM TIVSRV01 where polnvc in ($1) ORDER BY rvbdid DESC limit 1;";
                    const result_check_update_rv = await db.query(query_check_update_rv, [policyno]);

                    // if (result_check_update_rv.rows[0].mnrvbd !== '0.0000' && result_check_update_rv.rows[0].tprvbd !== '0.0000' && result_check_update_rv.rows[0].torvbd !== '0.0000' && result_check_update_rv.rows[0].smrvbd !== '0.0000') {

                    // ตัด field tprvbd ออก เพราะบางกรณีอาจจะไม่มีค่า
                    if (result_check_update_rv.rows[0].mnrvbd !== '0.0000' && result_check_update_rv.rows[0].torvbd !== '0.0000' && result_check_update_rv.rows[0].smrvbd !== '0.0000') {
                        console.log('\nมีคำสั่งขายคงค้างอยู่ ข้าม step รัน Update RV');
                    } else {
                        // ดึงข้อมูลหลังจาก create rv เสร็จ
                        const query_pull_create_rv_2 = "select * from tivsrv02 where rvbdid = $1;";
                        const result_pull_create_rv_2 = await db.query(query_pull_create_rv_2, [result_check_update_rv.rows[0].rvbdid]);

                        // ทำการอัพเดท NAV ของกองทุนที่เกี่ยวข้องกับคำสั่งซื้อขาย ก่อนรันอัพเดท RV ใน database
                        // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
                        for (const row_pull_create_rv of result_pull_create_rv_2.rows) {

                            const fund_name_updatenav = fund_code_dictionary[row_pull_create_rv.fundnm] || 'Unknown Fund';
                            console.log(`\nอัพเดทราคา NAV ประจำวัน วันที่สั่งซื้อขาย: ${row_pull_create_rv.boprdt}, กองทุน: ${fund_name_updatenav.code}`);

                            const NetAssetValue = fund_name_updatenav.NetAssetValue;
                            const NAVValue = fund_name_updatenav.NAVValue;
                            const BidPriceValue = fund_name_updatenav.BidPriceValue;
                            const OfferPriceValue = fund_name_updatenav.OfferPriceValue;

                            const dateupdate_sell_nav = `${row_pull_create_rv.boprdt}000000000`;
                            // แปลง dateupdate_nav string เป็น numeric
                            const numeric_dateupdate_sell_nav = Number(dateupdate_sell_nav);

                            // ค้นหา ข้อมูล NAV ของกองทุน ใน database ว่ามีการอัพเดท NAV หรือยัง
                            const query_check_nav_update_rv = "select * from tivnav01 t where fundnm = $1 and upnvdt = $2";
                            const result_check_nav_update_rv = await db.query(query_check_nav_update_rv, [row_pull_create_rv.fundnm, numeric_dateupdate_sell_nav]);

                            if (result_check_nav_update_rv.rows.length === 0) {
                                console.log(`\nทำการอัพเดท NAV ของกองทุน ${fund_name_updatenav.code} สำหรับคำสั่งซื้อขาย วันที่ ${row_pull_create_rv.boprdt}`);

                                // insert ราคา NAV ลงในตาราง tivnav01
                                const query_insert_nav_update_sell = `INSERT INTO public.tivnav01 (nav0id, fundnm, upnvdt, navpbd, bidpbd, offebd, cretdt, crbyvc, updadt, upbyvc, assvbd, remkvc, consdt, cobyvc, nvscnm) VALUES (nextval('seq_tivnav01_id'), $1, $2, $3, $4, $5, $2, 'kornkanok.pr', $2, 'saowanee.na', $6, '', $2, 'saowanee.na', 3);`;
                                const result_insert_nav_update_sell = await db.query(query_insert_nav_update_sell, [row_pull_create_rv.fundnm, numeric_dateupdate_sell_nav, NAVValue, BidPriceValue, OfferPriceValue, NetAssetValue]);
                                // จำนวนแถวที่ถูก insert
                                console.log(`Insert NAV update result: ${result_insert_nav_update_sell.rowCount}`);
                            } else {
                                console.log(`\nมีการอัพเดท NAV ของกองทุน ${fund_name_updatenav.code} สำหรับคำสั่งซื้อขาย วันที่ ${row_pull_create_rv.boprdt}`);
                            }
                        }

                        // // เช็คราคา NAV ของกองทุน
                        // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "อัพเดทราคา NAV ประจำวัน"
                        // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'อัพเดทราคา NAV ประจำวัน');
                        // // รอหน้าโหลดเสร็จ
                        // await page.waitForLoadState('networkidle');
                        // await expect(page.locator('div[class="layout-m-hd"]').locator('text = อัพเดทราคา NAV ประจำวัน')).toBeVisible({ timeout: 60000 });

                        // // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
                        // for (const row_pull_create_rv of result_pull_create_rv_2.rows) {
                        //     const fund_name_updatenav = fund_code_dictionary[row_pull_create_rv.fundnm] || 'Unknown Fund';
                        //     console.log(`\nอัพเดทราคา NAV ประจำวัน วันที่สั่งซื้อขาย: ${row_pull_create_rv.boprdt}, กองทุน: ${fund_name_updatenav.code}`);

                        //     const NetAssetValue = fund_name_updatenav.NetAssetValue;
                        //     const NAVValue = fund_name_updatenav.NAVValue;
                        //     const BidPriceValue = fund_name_updatenav.BidPriceValue;
                        //     const OfferPriceValue = fund_name_updatenav.OfferPriceValue;

                        //     // ค้นหา ข้อมูล NAV ของกองทุน
                        //     await dailyNavUpdatePage.searchDailyNavUpdate({ date: row_pull_create_rv.boprdt });
                        //     await page.waitForTimeout(2000); // เพิ่ม delay 2 วินาที เพื่อรอข้อมูลโหลด
                        //     // เช็คว่ากองทุนมีการอัพเดท NAV หรือยัง ถ้ายังให้ทำการอัพเดท
                        //     if (await table_DailyNavUpdate(page).dailynavupdate_btnSave(fund_name_updatenav.code).isVisible()) {
                        //         await dailyNavUpdatePage.saveDailyNavUpdate({ fundname: fund_name_updatenav.code, NetAssetValue, NAVValue, BidPriceValue, OfferPriceValue });
                        //     } else {
                        //         console.log(`กองทุน ${fund_name_updatenav.code} มีการอัพเดท NAV แล้ว`);
                        //     }
                        //     // เช็คว่ากองทุนมีการอนุมัติ NAV หรือยัง ถ้ายังให้ทำการอนุมัติ
                        //     if (await table_DailyNavUpdate(page).dailynavupdate_btnApprove(fund_name_updatenav.code).isVisible()) {
                        //         await dailyNavUpdatePage.approveDailyNavUpdate({ fundname: fund_name_updatenav.code });
                        //     } else {
                        //         console.log(`กองทุน ${fund_name_updatenav.code} มีการอนุมัติ NAV แล้ว`);
                        //     }
                        // }

                        console.log("\nทำการรันอัพเดท RV เนื่องจาก ปีกรมธรรม์ >= 5");

                        // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "Batch Manual Support"
                        await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'Batch Manual Support');
                        // รอหน้าโหลดเสร็จ
                        await page.waitForLoadState('networkidle');
                        await expect(page.locator('div[class="layout-m-hd"]'), { hasText: 'Batch Manual Support' }).toBeVisible({ timeout: 60000 });

                        // รัน batch สร้าง RV UL
                        await batchManualSupportPage.runBatchINV({ batch: 'UpdateRV', policyno: policyno, date: result_check_update_rv.rows[0].trstdt });

                        // เช็คว่ามีการอัพเดท RV สำเร็จหรือไม่
                        const result_check_update_rv_after = await db.query(query_check_update_rv, [policyno]);
                        if (result_check_update_rv_after.rows[0].mnrvbd === '0.0000' && result_check_update_rv_after.rows[0].torvbd === '0.0000' && result_check_update_rv_after.rows[0].smrvbd === '0.0000') {
                            // แสดง error
                            throw new Error('อัพเดท RV ไม่สำเร็จ');
                        } else {
                            console.log('\nอัพเดท RV สำเร็จ');
                        }
                    }
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ (คำสั่งขาย)
            const query_check_transactionstatus = "select distinct ordrdt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and irstvc = 'IR01' and iotcvc = 'R'"
            const result_check_transactionstatus = await db.query(query_check_transactionstatus, [policyno]);
            
            if (result_check_transactionstatus.rows.length === 0) {
                console.log('\nไม่มีคำสั่งขายที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
            } else {
                // เช็คว่ามีคำสั่งขายที่ต้องตรวจสอบจากฝ่ายปฏิบัติการหรือไม่
                if (result_check_transactionstatus.rows[0].invoid != 0) {
                    console.log('\nไม่มีคำสั่งขายที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
                } else {

                    // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "ตรวจสอบคำสั่งขายประจำวัน"
                    await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'ตรวจสอบคำสั่งขายประจำวัน');

                    let status_transaction = result_check_transactionstatus.rows[0].vrstvc;
                    let invoiceid_transaction = result_check_transactionstatus.rows[0].invoid;

                    while ((status_transaction === 'VR01' || status_transaction === 'VR02') && invoiceid_transaction === '0') {

                        // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ
                        if (status_transaction === 'VR01' && invoiceid_transaction === '0') {


                        } else if (status_transaction === 'VR02' && invoiceid_transaction === '0') {

                            console.log(`\nตรวจสอบคำสั่งขาย oper เลขที่อ้างอิง: ${result_check_transactionstatus.rows[0].invoid}, วันที่สั่งซื้อขาย: ${result_check_transactionstatus.rows[0].ordrdt}, Transaction No: ${result_check_transactionstatus.rows[0].altnvc}`);

                            // กด tab "ตรวจสอบและยืนยันคำสั่งขายประจำวัน"
                            await menubar_InvestmentOrderOper(page).investmentorderoper_btnVerifyInvestmentOrder.click({ timeout: 10000 });
                            // ค้นหาข้อมูลคำสั่งขาย
                            await verifyInvestmentOrderSellOperPage.search_verify_VerifyInvestmentOrderOper({ date: result_check_transactionstatus.rows[0].ordrdt });
                            // เลือก checkbox ตาม transaction no
                            await verifyInvestmentOrderSellOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: result_check_transactionstatus.rows[0].altnvc });
                            // ยืนยันคำสั่งขาย จากฝ่าย ปฏิบัติการ
                            await verifyInvestmentOrderSellOperPage.confirm_verify_VerifyInvestmentOrderOper();
                        }

                        // ดึงข้อมูลใหม่อีกครั้ง
                        const result_check_transactionstatus_new = await db.query(query_check_transactionstatus, [policyno]);
                        status_transaction = result_check_transactionstatus_new.rows[0].vrstvc;
                        invoiceid_transaction = result_check_transactionstatus_new.rows[0].invoid;
                    }
                }
            }
            
            //////////////////////////////////////////////////////

            // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ (คำสั่งซื้อ)
            const query_check_transactionstatus_orderbuy = "select distinct ordrdt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and irstvc = 'IR01' and iotcvc = 'P'"
            const result_check_transactionstatus_orderbuy = await db.query(query_check_transactionstatus_orderbuy, [policyno]);

            // เช็คว่ามีคำสั่งซื้อที่ต้องตรวจสอบจากฝ่ายปฏิบัติการหรือไม่
            if (result_check_transactionstatus_orderbuy.rows.length === 0) {
                console.log('\nไม่มีคำสั่งซื้อที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
            } else {
                if (result_check_transactionstatus_orderbuy.rows[0].invoid != 0) {
                    console.log('\nไม่มีคำสั่งซื้อที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
                } else {

                    // ตรวจสอบก่อนว่าวันที่ order กับวันที่ business process date ตรงกันหรือ business process date มากกว่าหรือไม่
                    const order_date = result_check_transactionstatus_orderbuy.rows[0].ordrdt;
                    const query_bussiness_date = 'select p.busndt from tpsplc01 p where p.polnvc = $1;';
                    const result_business_date = await db.query(query_bussiness_date, [policyno]);

                    const order_date_obj = parseDate(order_date);
                    const business_process_date_obj = parseDate(result_business_date.rows[0].busndt);

                    // ตรวจสอบก่อนว่าวันที่ order กับวันที่ business process date ตรงกันหรือไม่
                    if (order_date_obj > business_process_date_obj) {

                        console.log('\nวันที่สั่งซื้อไม่ตรงกับวันที่ business date ทำการอัพเดทวันที่ให้ตรงกัน');

                        // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
                        await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
                        // รอหน้าโหลดเสร็จ
                        await page.waitForLoadState('networkidle');
                        await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });

                        let check_order_batch_daily_success = false;
                        // เช็คว่ามีการรัน Batch Daily สำเร็จจริงไหม
                        while (!check_order_batch_daily_success) {
                            // ปรับวันที่ ให้เกิดคำสั่งซื้อ
                            const new_business_process_date = formatDatePlusOne(order_date_obj);

                            console.log('\nbusiness and current process date: ' + result_business_date.rows[0].busndt + ' process date: ' + order_date);

                            // update database
                            const query_order_update_all_date_policy = 'update tpsplc01 set busndt = $2, crpcdt = $2, pctddt = $3 where polnvc = $1;';
                            const result_order_update_all_date_policy = await db.query(query_order_update_all_date_policy, [policyno, result_business_date.rows[0].busndt, order_date]);

                            console.log('Update all date policy result: ' + result_order_update_all_date_policy.rowCount);

                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                            // ทำการรัน batch manual ที่หน้าเว็บ
                            // เช็คสถานะ batch ก่อนรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
                            await monitorBatchPage.checkStatusBeforeRunBatch();

                            // รัน batch MVY UL
                            await monitorBatchPage.runJobBatchDailyPolicy({ policyno: policyno });

                            // เช็คสถานะ batch หลังรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
                            await monitorBatchPage.checkStatusAfterRunBatch();

                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

                            // query ตรวจสอบวันที่ของกรมธรรม์
                            const query_order_check_date_policy = 'select p.busndt from tpsplc01 p where p.polnvc = $1;';
                            const result_order_check_date_policy = await db.query(query_order_check_date_policy, [policyno]);

                            // บวก 1 วัน เพื่อเทียบว่าวันที่ business date ของกรมธรรม์ มีการรัน batch แล้วหรือยัง
                            if (result_order_check_date_policy.rows[0].busndt === new_business_process_date) {
                                check_order_batch_daily_success = true;
                                console.log('\nรัน Batch Daily สำเร็จ');
                            } else {
                                console.log('\nรัน Batch Daily ไม่สำเร็จ ต้องรันใหม่');
                            }
                        }

                    } else {
                        console.log('\nวันที่สั่งซื้อตรงกัน หรือ มากกว่าวันที่ business process date');
                    }

                    const recheck_result_check_transactionstatus_orderbuy = await db.query(query_check_transactionstatus_orderbuy, [policyno]);

                    if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {

                        // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "ตรวจสอบคำสั่งซื้อประจำวัน"
                        await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'ตรวจสอบคำสั่งซื้อประจำวัน');

                        let status_transaction = recheck_result_check_transactionstatus_orderbuy.rows[0].vrstvc;
                        let invoiceid_transaction = recheck_result_check_transactionstatus_orderbuy.rows[0].invoid;

                        while ((status_transaction === 'VR01' || status_transaction === 'VR02') && invoiceid_transaction === '0') {

                            // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ
                            if (status_transaction === 'VR01' && invoiceid_transaction === '0') {

                                console.log(`\nสร้างคำสั่งซื้อ oper เลขที่อ้างอิง: ${recheck_result_check_transactionstatus_orderbuy.rows[0].invoid}, วันที่สั่งซื้อขาย: ${recheck_result_check_transactionstatus_orderbuy.rows[0].ordrdt}, Transaction No: ${recheck_result_check_transactionstatus_orderbuy.rows[0].altnvc}`);

                                // กด tab "รอสร้างคำสั่งซื้อ"
                                await menubar_InvestmentBuyOrderOper(page).investmentorderoper_btnWaitingforCreateOrder.click({ timeout: 10000 });
                                // ค้นหาข้อมูลคำสั่งซื้อ
                                await verifyInvestmentOrderBuyOperPage.search_verify_VerifyInvestmentOrderOper_Tab1({ date: recheck_result_check_transactionstatus_orderbuy.rows[0].ordrdt });
                                // เลือก checkbox ตาม transaction no
                                await verifyInvestmentOrderBuyOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: recheck_result_check_transactionstatus_orderbuy.rows[0].altnvc });

                                // สร้างคำสั่งซื้อ จากฝ่าย ปฏิบัติการ
                                await verifyInvestmentOrderBuyOperPage.confirm_verify_VerifyInvestmentOrderOper_Tab1();

                            } else if (status_transaction === 'VR02' && invoiceid_transaction === '0') {

                                console.log(`\nตรวจสอบคำสั่งซื้อ oper เลขที่อ้างอิง: ${recheck_result_check_transactionstatus_orderbuy.rows[0].invoid}, วันที่สั่งซื้อขาย: ${recheck_result_check_transactionstatus_orderbuy.rows[0].ordrdt}, Transaction No: ${recheck_result_check_transactionstatus_orderbuy.rows[0].altnvc}`);

                                // กด tab "ตรวจสอบและยืนยันคำสั่งซื้อประจำวัน"
                                await menubar_InvestmentBuyOrderOper(page).investmentorderoper_btnVerifyInvestmentOrder.click({ timeout: 10000 });
                                // ค้นหาข้อมูลคำสั่งซื้อ
                                await verifyInvestmentOrderBuyOperPage.search_verify_VerifyInvestmentOrderOper({ date: recheck_result_check_transactionstatus_orderbuy.rows[0].ordrdt });
                                // เลือก checkbox ตาม transaction no
                                await verifyInvestmentOrderBuyOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: recheck_result_check_transactionstatus_orderbuy.rows[0].altnvc });
                                // ยืนยันคำสั่งซื้อ จากฝ่าย ปฏิบัติการ
                                await verifyInvestmentOrderBuyOperPage.confirm_verify_VerifyInvestmentOrderOper();

                            }

                            // ดึงข้อมูลใหม่อีกครั้ง
                            const recheck_result_check_transactionstatus_orderbuy_new = await db.query(query_check_transactionstatus_orderbuy, [policyno]);
                            status_transaction = recheck_result_check_transactionstatus_orderbuy_new.rows[0].vrstvc;
                            invoiceid_transaction = recheck_result_check_transactionstatus_orderbuy_new.rows[0].invoid;
                        }
                    }

                }
            }
            
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////

            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "ตรวจสอบคำสั่ง ซื้อ-ขาย V2"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'ตรวจสอบคำสั่ง ซื้อ-ขาย V2');
            // รอหน้าโหลดเสร็จ
            await page.waitForLoadState('networkidle');
            await expect(page.locator('text = ตรวจสอบคำสั่งซื้อขาย')).toBeVisible({ timeout: 60000 });

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งขาย)
            const query_check_invoice_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'R'"
            const result_check_invoice_ul = await db.query(query_check_invoice_ul, [policyno]);

            // ตรวจคำสั่ง ซื้อขายที่สร้างขึ้น
            // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งขาย)
            for (const row_invoice_ul_ordercheck of result_check_invoice_ul.rows) {
                const fund_name_ordercheck = fund_code_dictionary[row_invoice_ul_ordercheck.fundnm] || 'Unknown Fund';
                console.log(`\nตรวจสอบคำสั่งขาย เลขที่อ้างอิง: ${row_invoice_ul_ordercheck.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_ordercheck.ordrdt}, กองทุน: ${fund_name_ordercheck.code}`);

                // ค้นหา ข้อมูลคำสั่งขาย
                await investmentOrderCheckPage.searchInvestmentOrderCheck({ date: row_invoice_ul_ordercheck.ordrdt });
                // เลือกเมนู คำสั่งขาย
                await menubar_InvestmentOrderCheck(page).investmentordercheck_btnSell.click({ timeout: 10000 });

                // เช็คว่า ปุ่มยืนยันคำสั่งขาย ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันคำสั่งขาย)
                if (await table_InvestmentOrderCheck(page).investmentordercheck_tblCheckbox(row_invoice_ul_ordercheck.invovc).isVisible()) {
                    // เลือก checkbox ตามเลขที่อ้างอิง จาก database
                    await investmentOrderCheckPage.clickInvestmentOrderCheckButton({ invoiceno: row_invoice_ul_ordercheck.invovc });
                    // ยืนยันคำสั่งขาย
                    await investmentOrderCheckPage.confirmSellInvestmentOrderCheck({ invoiceno: row_invoice_ul_ordercheck.invovc });
                } else {
                    console.log(`คำสั่งขาย เลขที่อ้างอิง ${row_invoice_ul_ordercheck.invovc} ยืนยันคำสั่งขายแล้ว`);
                }
            }

            //////////////////////////////////////////////////////

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งซื้อ)
            const query_check_invoice_buy_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'P'"
            const result_check_invoice_buy_ul = await db.query(query_check_invoice_buy_ul, [policyno]);

            if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
                // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
                for (const row_invoice_buy_ul_ordercheck of result_check_invoice_buy_ul.rows) {
                    const fund_name_ordercheck = fund_code_dictionary[row_invoice_buy_ul_ordercheck.fundnm] || 'Unknown Fund';
                    console.log(`\nตรวจสอบคำสั่งซื้อ เลขที่อ้างอิง: ${row_invoice_buy_ul_ordercheck.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_buy_ul_ordercheck.ordrdt}, กองทุน: ${fund_name_ordercheck.code}`);

                    // ค้นหา ข้อมูลคำสั่งขาย
                    await investmentOrderCheckPage.searchInvestmentOrderCheck({ date: row_invoice_buy_ul_ordercheck.ordrdt });
                    // เลือกเมนู คำสั่งขาย
                    await menubar_InvestmentOrderCheck(page).investmentordercheck_btnBuy.click({ timeout: 10000 });

                    // เช็คว่า ปุ่มยืนยันคำสั่งขาย ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันคำสั่งขาย)
                    if (await table_InvestmentOrderCheck(page).investmentordercheck_tblCheckbox(row_invoice_buy_ul_ordercheck.invovc).isVisible()) {
                        // เลือก checkbox ตามเลขที่อ้างอิง จาก database
                        await investmentOrderCheckPage.clickInvestmentOrderCheckButton({ invoiceno: row_invoice_buy_ul_ordercheck.invovc });
                        // ยืนยันคำสั่งขาย
                        await investmentOrderCheckPage.confirmBuyInvestmentOrderCheck({ invoiceno: row_invoice_buy_ul_ordercheck.invovc });
                    } else {
                        console.log(`คำสั่งซื้อ เลขที่อ้างอิง ${row_invoice_buy_ul_ordercheck.invovc} ยืนยันคำสั่งซื้อแล้ว`);
                    }
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // อัพเดท NAV ของกองทุนที่เกี่ยวข้องกับคำสั่งซื้อขาย ใน database
            // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งขาย)
            for (const row_invoice_ul_updatenav of result_check_invoice_ul.rows) {
                const fund_name_updatenav = fund_code_dictionary[row_invoice_ul_updatenav.fundnm] || 'Unknown Fund';
                console.log(`\nอัพเดทราคา NAV ประจำวัน เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_updatenav.ordrdt}, กองทุน: ${fund_name_updatenav.code}`);

                const NetAssetValue = fund_name_updatenav.NetAssetValue;
                const NAVValue = fund_name_updatenav.NAVValue;
                const BidPriceValue = fund_name_updatenav.BidPriceValue;
                const OfferPriceValue = fund_name_updatenav.OfferPriceValue;

                const dateupdate_sell_nav = `${row_invoice_ul_updatenav.ordrdt}000000000`;
                // แปลง dateupdate_nav string เป็น numeric
                const numeric_dateupdate_sell_nav = Number(dateupdate_sell_nav);

                // ค้นหา ข้อมูล NAV ของกองทุน ใน database ว่ามีการอัพเดท NAV หรือยัง
                const query_check_nav_update_sell = "select * from tivnav01 t where fundnm = $1 and upnvdt = $2";
                const result_check_nav_update_sell = await db.query(query_check_nav_update_sell, [row_invoice_ul_updatenav.fundnm, numeric_dateupdate_sell_nav]);

                if (result_check_nav_update_sell.rows.length === 0) {
                    console.log(`\nทำการอัพเดท NAV ของกองทุน ${fund_name_updatenav.code} สำหรับคำสั่งซื้อ เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc} วันที่ ${row_invoice_ul_updatenav.ordrdt}`);

                    // insert ราคา NAV ลงในตาราง tivnav01
                    const query_insert_nav_update_sell = `INSERT INTO public.tivnav01 (nav0id, fundnm, upnvdt, navpbd, bidpbd, offebd, cretdt, crbyvc, updadt, upbyvc, assvbd, remkvc, consdt, cobyvc, nvscnm) VALUES (nextval('seq_tivnav01_id'), $1, $2, $3, $4, $5, $2, 'kornkanok.pr', $2, 'saowanee.na', $6, '', $2, 'saowanee.na', 3);`;
                    const result_insert_nav_update_sell = await db.query(query_insert_nav_update_sell, [row_invoice_ul_updatenav.fundnm, numeric_dateupdate_sell_nav, NAVValue, BidPriceValue, OfferPriceValue, NetAssetValue]);
                    // จำนวนแถวที่ถูก insert
                    console.log(`Insert NAV update result: ${result_insert_nav_update_sell.rowCount}`);
                } else {
                    console.log(`\nมีการอัพเดท NAV ของกองทุน ${fund_name_updatenav.code} สำหรับคำสั่งซื้อ เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc} วันที่ ${row_invoice_ul_updatenav.ordrdt} เรียบร้อยแล้ว`);
                }
            }

            // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
            if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
                for (const row_invoice_ul_updatenav of result_check_invoice_buy_ul.rows) {
                    const fund_name_updatenav = fund_code_dictionary[row_invoice_ul_updatenav.fundnm] || 'Unknown Fund';
                    console.log(`\nอัพเดทราคา NAV ประจำวัน เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_updatenav.ordrdt}, กองทุน: ${fund_name_updatenav.code}`);

                    const NetAssetValue = fund_name_updatenav.NetAssetValue;
                    const NAVValue = fund_name_updatenav.NAVValue;
                    const BidPriceValue = fund_name_updatenav.BidPriceValue;
                    const OfferPriceValue = fund_name_updatenav.OfferPriceValue;

                    const dateupdate_buy_nav = `${row_invoice_ul_updatenav.ordrdt}000000000`;
                    // แปลง dateupdate_nav string เป็น numeric
                    const numeric_dateupdate_buy_nav = Number(dateupdate_buy_nav);

                    // ค้นหา ข้อมูล NAV ของกองทุน ใน database ว่ามีการอัพเดท NAV หรือยัง
                    const query_check_nav_update_buy = "select * from tivnav01 t where fundnm = $1 and upnvdt = $2";
                    const result_check_nav_update_buy = await db.query(query_check_nav_update_buy, [row_invoice_ul_updatenav.fundnm, numeric_dateupdate_buy_nav]);
                    
                    if (result_check_nav_update_buy.rows.length === 0) {
                        console.log(`\nทำการอัพเดท NAV ของกองทุน ${fund_name_updatenav.code} สำหรับคำสั่งซื้อ เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc} วันที่ ${row_invoice_ul_updatenav.ordrdt}`);
                        // insert ราคา NAV ลงในตาราง tivnav01
                        const query_insert_nav_update_buy = `INSERT INTO public.tivnav01 (nav0id, fundnm, upnvdt, navpbd, bidpbd, offebd, cretdt, crbyvc, updadt, upbyvc, assvbd, remkvc, consdt, cobyvc, nvscnm) VALUES (nextval('seq_tivnav01_id'), $1, $2, $3, $4, $5, $2, 'kornkanok.pr', $2, 'saowanee.na', $6, '', $2, 'saowanee.na', 3);`;
                        const result_insert_nav_update_buy = await db.query(query_insert_nav_update_buy, [row_invoice_ul_updatenav.fundnm,numeric_dateupdate_buy_nav,NAVValue,BidPriceValue,OfferPriceValue,NetAssetValue]);
                        // จำนวนแถวที่ถูก insert
                        console.log(`Insert NAV update result: ${result_insert_nav_update_buy.rowCount}`);
                    } else {
                        console.log(`\nมีการอัพเดท NAV ของกองทุน ${fund_name_updatenav.code} สำหรับคำสั่งซื้อ เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc} วันที่ ${row_invoice_ul_updatenav.ordrdt} เรียบร้อยแล้ว`);
                    }

                }
            }

            //////////////////////////////////////////////////////

            // // เช็คราคา NAV ของกองทุน
            // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "อัพเดทราคา NAV ประจำวัน"
            // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'อัพเดทราคา NAV ประจำวัน');
            // // รอหน้าโหลดเสร็จ
            // await page.waitForLoadState('networkidle');
            // await expect(page.locator('div[class="layout-m-hd"]').locator('text = อัพเดทราคา NAV ประจำวัน')).toBeVisible({ timeout: 60000 });

            // // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งขาย)
            // for (const row_invoice_ul_updatenav of result_check_invoice_ul.rows) {
            //     const fund_name_updatenav = fund_code_dictionary[row_invoice_ul_updatenav.fundnm] || 'Unknown Fund';
            //     console.log(`\nอัพเดทราคา NAV ประจำวัน เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_updatenav.ordrdt}, กองทุน: ${fund_name_updatenav.code}`);

            //     const NetAssetValue = fund_name_updatenav.NetAssetValue;
            //     const NAVValue = fund_name_updatenav.NAVValue;
            //     const BidPriceValue = fund_name_updatenav.BidPriceValue;
            //     const OfferPriceValue = fund_name_updatenav.OfferPriceValue;

            //     // ค้นหา ข้อมูล NAV ของกองทุน
            //     await dailyNavUpdatePage.searchDailyNavUpdate({ date: row_invoice_ul_updatenav.ordrdt });
            //     await page.waitForTimeout(2000); // เพิ่ม delay 2 วินาที เพื่อรอข้อมูลโหลด
            //     // เช็คว่ากองทุนมีการอัพเดท NAV หรือยัง ถ้ายังให้ทำการอัพเดท
            //     if (await table_DailyNavUpdate(page).dailynavupdate_btnSave(fund_name_updatenav.code).isVisible()) {
            //         await dailyNavUpdatePage.saveDailyNavUpdate({ fundname: fund_name_updatenav.code, NetAssetValue, NAVValue, BidPriceValue, OfferPriceValue });
            //     } else {
            //         console.log(`กองทุน ${fund_name_updatenav.code} มีการอัพเดท NAV แล้ว`);
            //     }
            //     // เช็คว่ากองทุนมีการอนุมัติ NAV หรือยัง ถ้ายังให้ทำการอนุมัติ
            //     if (await table_DailyNavUpdate(page).dailynavupdate_btnApprove(fund_name_updatenav.code).isVisible()) {
            //         await dailyNavUpdatePage.approveDailyNavUpdate({ fundname: fund_name_updatenav.code });
            //     } else {
            //         console.log(`กองทุน ${fund_name_updatenav.code} มีการอนุมัติ NAV แล้ว`);
            //     }
            // }

            // //////////////////////////////////////////////////////

            //     // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
            // if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
            //     for (const row_invoice_ul_updatenav of result_check_invoice_buy_ul.rows) {
            //         const fund_name_updatenav = fund_code_dictionary[row_invoice_ul_updatenav.fundnm] || 'Unknown Fund';
            //         console.log(`\nอัพเดทราคา NAV ประจำวัน เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_updatenav.ordrdt}, กองทุน: ${fund_name_updatenav.code}`);

            //         const NetAssetValue = fund_name_updatenav.NetAssetValue;
            //         const NAVValue = fund_name_updatenav.NAVValue;
            //         const BidPriceValue = fund_name_updatenav.BidPriceValue;
            //         const OfferPriceValue = fund_name_updatenav.OfferPriceValue;

            //         // ค้นหา ข้อมูล NAV ของกองทุน
            //         await dailyNavUpdatePage.searchDailyNavUpdate({ date: row_invoice_ul_updatenav.ordrdt });
            //         await page.waitForTimeout(2000); // เพิ่ม delay 2 วินาที เพื่อรอข้อมูลโหลด
            //         // เช็คว่ากองทุนมีการอัพเดท NAV หรือยัง ถ้ายังให้ทำการอัพเดท
            //         if (await table_DailyNavUpdate(page).dailynavupdate_btnSave(fund_name_updatenav.code).isVisible()) {
            //             await dailyNavUpdatePage.saveDailyNavUpdate({ fundname: fund_name_updatenav.code, NetAssetValue, NAVValue, BidPriceValue, OfferPriceValue });
            //         } else {
            //             console.log(`กองทุน ${fund_name_updatenav.code} มีการอัพเดท NAV แล้ว`);
            //         }
            //         // เช็คว่ากองทุนมีการอนุมัติ NAV หรือยัง ถ้ายังให้ทำการอนุมัติ
            //         if (await table_DailyNavUpdate(page).dailynavupdate_btnApprove(fund_name_updatenav.code).isVisible()) {
            //             await dailyNavUpdatePage.approveDailyNavUpdate({ fundname: fund_name_updatenav.code });
            //         } else {
            //             console.log(`กองทุน ${fund_name_updatenav.code} มีการอนุมัติ NAV แล้ว`);
            //         }
            //     }
            // }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)
            if (result_check_invoice_buy_ul.rows.length === 0) {
                console.log('\nไม่มีคำสั่งซื้อหน่วยลงทุน ข้ามขั้นตอนยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)');
            } else {
                // ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)
                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)"
                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)');

                if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
                    // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
                    for (const row_invoice_ul_confirmorder of result_check_invoice_buy_ul.rows) {
                        const fund_name_confirmorder = fund_code_dictionary[row_invoice_ul_confirmorder.fundnm] || 'Unknown Fund';
                        console.log(`\nยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ) เลขที่อ้างอิง: ${row_invoice_ul_confirmorder.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_confirmorder.ordrdt}, กองทุน: ${fund_name_confirmorder.code}`);

                        // ค้นหา ข้อมูลคำสั่งขาย
                        await investmentOrderConfirmPage.searchInvestmentOrderConfirm({ date: row_invoice_ul_confirmorder.ordrdt });

                        await page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด

                        // เช็คว่า ปุ่มยืนยันคำสั่งขาย ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันคำสั่งขาย)
                        if (await table_InvestmentOrderConfirm(page).investmentorderconfirm_tblButtonConfirm(row_invoice_ul_confirmorder.invovc).isVisible()) {
                            // ยืนยันคำสั่งขาย
                            await investmentOrderConfirmPage.confirmInvestmentOrder({ invoiceno: row_invoice_ul_confirmorder.invovc });
                        } else {
                            console.log(`คำสั่งซื้อ เลขที่อ้างอิง ${row_invoice_ul_confirmorder.invovc} ยืนยันการชำระเงินให้กับ บลจ. แล้ว`);
                        }

                    }
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // รับผลการซื้อขาย หน่วยลงทุน
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "รับผลการซื้อ-ขายหน่วยลงทุน"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'รับผลการซื้อ-ขายหน่วยลงทุน');
            // รอหน้าโหลดเสร็จ
            await page.waitForLoadState('networkidle');
            await expect(page.locator('text = ยืนยันผลคำสั่งซื้อ-ขาย')).toBeVisible({ timeout: 60000 });

            // เช็คว่ามีการ update ค่า upnvdt ในตาราง tivreq01 หรือยัง
            const query_check_upnvdt_tivreq01 = "select distinct ALTYNM,ordrdt,invoid,vrstvc,altnvc, upnvdt, altrid from tivreq01 t where t.polnvc = $1 and irstvc in ('IR01');"
            const result_check_upnvdt_tivreq01 = await db.query(query_check_upnvdt_tivreq01, [policyno]);

            for (const row_check_upnvdt of result_check_upnvdt_tivreq01.rows) {
                const orderdate_tivreq01 = `${row_check_upnvdt.ordrdt}000000000`;
                const upnvdt_tivreq01 = row_check_upnvdt.upnvdt;
                const altrid_tivreq01 = row_check_upnvdt.altrid;

                if (upnvdt_tivreq01 === '0') {
                    console.log(`\nไม่มีค่า upnvdt ในตาราง tivreq01 สำหรับกรมธรรม์ ${policyno} วันที่สั่งซื้อขาย: ${orderdate_tivreq01}`);
                    // update ค่า upnvdt ในตาราง tivreq01
                    const query_update_upnvdt_tivreq01 = "UPDATE tivreq01 SET upnvdt= $2 where altrid = $1;"
                    const result_update_upnvdt_tivreq01 = await db.query(query_update_upnvdt_tivreq01, [altrid_tivreq01, Number(orderdate_tivreq01)]);
                    console.log(`อัพเดทค่า upnvdt ในตาราง tivreq01 สำเร็จ จำนวนแถวที่ถูกอัพเดท: ${result_update_upnvdt_tivreq01.rowCount}`);
                }
            }

            
            // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งขาย)
            for (const row_invoice_ul_orderresult of result_check_invoice_ul.rows) {
                const fund_name_orderresult = fund_code_dictionary[row_invoice_ul_orderresult.fundnm] || 'Unknown Fund';
                console.log(`\nรับผลการขายหน่วยลงทุน เลขที่อ้างอิง: ${row_invoice_ul_orderresult.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_orderresult.ordrdt}, กองทุน: ${fund_name_orderresult.code}`);

                // ค้นหา ข้อมูลคำสั่งซื้อขาย
                await investmentOrderResultPage.searchInvestmentOrderResult({ date: row_invoice_ul_orderresult.ordrdt });
                // เลือกเมนู คำสั่งขาย
                await menubar_InvestmentOrderResult(page).investmentorderresult_btnSell.click({ timeout: 10000 });

                // เช็คว่า ยืนยันคำสั่งซื้อขาย ปุ่มสีฟ้า ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันผลการขาย)
                if (await table_InvestmentOrderResult(page).investmentorderresult_tblCheckbox(row_invoice_ul_orderresult.invovc).isVisible()) {
                    // ยืนยันผลการขาย หน่วยลงทุน ตามเลขที่อ้างอิง จาก database
                    await investmentOrderResultPage.clickInvestmentOrderResultConfirmButton({ invoiceno: row_invoice_ul_orderresult.invovc });
                } else {
                    console.log(`คำสั่งขาย เลขที่อ้างอิง ${row_invoice_ul_orderresult.invovc} ได้รับผลการขายหน่วยลงทุนแล้ว`);
                }
            }

            //////////////////////////////////////////////////////

            // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
            if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
                for (const row_invoice_buy_ul_orderresult of result_check_invoice_buy_ul.rows) {
                    const fund_name_orderresult = fund_code_dictionary[row_invoice_buy_ul_orderresult.fundnm] || 'Unknown Fund';
                    console.log(`\nรับผลการซื้อหน่วยลงทุน เลขที่อ้างอิง: ${row_invoice_buy_ul_orderresult.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_buy_ul_orderresult.ordrdt}, กองทุน: ${fund_name_orderresult.code}`);

                    // ค้นหา ข้อมูลคำสั่งซื้อขาย
                    await investmentOrderResultPage.searchInvestmentOrderResult({ date: row_invoice_buy_ul_orderresult.ordrdt });
                    // เลือกเมนู คำสั่งขาย
                    await menubar_InvestmentOrderResult(page).investmentorderresult_btnBuy.click({ timeout: 10000 });

                    // เช็คว่า ยืนยันคำสั่งซื้อขาย ปุ่มสีฟ้า ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันผลการขาย)
                    if (await table_InvestmentOrderResult(page).investmentorderresult_tblCheckbox(row_invoice_buy_ul_orderresult.invovc).isVisible()) {
                        // ยืนยันผลการขาย หน่วยลงทุน ตามเลขที่อ้างอิง จาก database
                        await investmentOrderResultPage.clickInvestmentOrderResultConfirmButton({ invoiceno: row_invoice_buy_ul_orderresult.invovc });
                    } else {
                        console.log(`คำสั่งซื้อ เลขที่อ้างอิง ${row_invoice_buy_ul_orderresult.invovc} ได้รับผลการซื้อหน่วยลงทุนแล้ว`);
                    }
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่
            const query_check_fundredemptionreceipt = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVINV01.iostvc = 'IO05'"
            const result_check_fundredemptionreceipt = await db.query(query_check_fundredemptionreceipt, [policyno]);

            if (result_check_fundredemptionreceipt.rows.length === 0) {
                console.log('\nไม่มีรายการรอรับชำระเงินจาก บลจ.');
            } else {
                // บันทึกรับเงินจากบลจ. (คำสั่งขาย)
                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "บันทึกรับเงินจากบลจ. (คำสั่งขาย) V2"
                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'บันทึกรับเงินจากบลจ. (คำสั่งขาย) V2');
                // รอหน้าโหลดเสร็จ
                await page.waitForLoadState('networkidle');
                await expect(page.locator('a[role="tab"]').getByText('รายการรอรับชำระเงินจาก บลจ.'), { exact: true }).toBeVisible({ timeout: 60000 });
                // รอข้อมูลโหลดเสร็จ
                await page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
                await expect(page.locator('div[class="busy-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'กำลังค้นหาข้อมูล...' })).not.toBeVisible({ timeout: 60000 });

                // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
                for (const row_fundredemptionreceipt of result_check_fundredemptionreceipt.rows) {
                    const fund_name_fundredemptionreceipt = fund_code_dictionary[row_fundredemptionreceipt.fundnm] || 'Unknown Fund';
                    console.log(`\nบันทึกรับเงินจากบลจ. เลขที่อ้างอิง: ${row_fundredemptionreceipt.invovc}, วันที่สั่งซื้อขาย: ${row_fundredemptionreceipt.ordrdt}, กองทุน: ${fund_name_fundredemptionreceipt.code}`);

                    // ยืนยัน บันทึกรับเงินจากบลจ. (คำสั่งขาย) ตามเลขที่อ้างอิง จาก database
                    await page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
                    await fundRedemptionReceipt.clickFundRedemptionReceiptConfirmButton({ invoiceno: row_fundredemptionreceipt.invovc, date: row_fundredemptionreceipt.ordrdt });

                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

        }

        // ปิด database
        await db.close();

        loopCount++;

        console.log('\n-------------------------------------------- End of Process --------------------------------------------');
    }

});