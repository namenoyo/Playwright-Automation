const { test, expect } = require('@playwright/test');

// database
const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');

// Data Dictionary
const { fund_code_dictionary } = require('../../data/Unit_Linked/fund_code_dict.data.js');

// Locators
const { menubar_InvestmentOrderCheck, table_InvestmentOrderCheck } = require('../../locators/Unit_Linked/InvestmentOrderCheck.locators.js');
const { menubar_InvestmentOrderResult, table_InvestmentOrderResult } = require('../../locators/Unit_Linked/InvestmentOrderResult.locators.js');
const { table_DailyNavUpdate } = require('../../locators/Unit_Linked/DailyNavUpdate.locator.js');
const { menubar_InvestmentOrderOper } = require('../../locators/Unit_Linked/VerifyInvestmentOrderOper.locators.js');

// Page
const { MonitorBatchPage } = require('../../pages/Unit_Linked/MonitorBatchPage.js');
const { InvestmentOrderCheckPage } = require('../../pages/Unit_Linked/InvestmentOrderCheckPage.js');
const { InvestmentOrderResultPage } = require('../../pages/Unit_Linked/InvestmentOrderResultPage.js');
const { DailyNavUpdatePage } = require('../../pages/Unit_Linked/DailyNavUpdatePage.js');
const { FundRedemptionReceipt } = require('../../pages/Unit_Linked/FundRedemptionReceiptPage.js');
const { BatchManualSupportPage } = require('../../pages/Unit_Linked/BatchManualSupportPage.js');
const { VerifyInvestmentOrderOperPage } = require('../../pages/Unit_Linked/VerifyInvestmentOrderOperPage.js');

// Login, menu
import { LoginPage } from '../../pages/login_t.page.js';
import { gotoMenu } from '../../pages/menu.page.js';

// utils
const adjustDate = require('../../utils/dateAdjuster.js');
const { toDashed, toPlain } = require('../../utils/formatDate.js');


test('Run MVY UL', async ({ page }) => {

    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    // ข้อมูลสำหรับทดสอบ
    const username = 'boss';
    const password = '1234';
    const policyno = 'UL00003021'; // เลขกรมธรรม์ที่ต้องการทดสอบ
    const env = 'SIT' // SIT / UAT
    const fix_endloop = '1'; // กำหนดจำนวนรอบที่ต้องการให้ทำงาน (ถ้าไม่ต้องการให้ทำงานแบบวนซ้ำ ให้กำหนดเป็นค่าว่าง '')
    // connection database
    const db_name = 'coreul';
    const db_env = 'SIT_EDIT'; // SIT | SIT_EDIT / UAT | UAT_EDIT

    // Login
    const loginPage = new LoginPage(page);
    // menu
    const gotomenu = new gotoMenu(page, expect);
    // Page
    const monitorBatchPage = new MonitorBatchPage(page, expect);
    const investmentOrderCheckPage = new InvestmentOrderCheckPage(page, expect);
    const investmentOrderResultPage = new InvestmentOrderResultPage(page, expect);
    const dailyNavUpdatePage = new DailyNavUpdatePage(page, expect);
    const fundRedemptionReceipt = new FundRedemptionReceipt(page, expect);
    const batchManualSupportPage = new BatchManualSupportPage(page, expect);
    const verifyInvestmentOrderOperPage = new VerifyInvestmentOrderOperPage(page, expect);

    // ไปยังหน้า NBS
    await loginPage.gotoNBSENV(env);
    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
    await loginPage.login(username, password);

    let check_genbill = false; // ตัวแปรเช็คว่ามีการสร้างบิลหรือยัง
    let check_genbill_after = false; // ตัวแปรเช็คว่ามีการสร้างบิลหรือยัง หลังจากรัน batch

    let endloop;

    while (endloop !== 'Y' && endloop !== fix_endloop) { // หลังจากเสร็จแล้วต้องเอา endloop !== '1' ออก เพราะจะแค่ทดสอบ 1 รอบ

        console.log('\n-------------------------------------------- Start of Process --------------------------------------------');

        // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
        await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
        // รอหน้าโหลดเสร็จ
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });

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
        const query_policy_year = 'select p.polynm from tpsplc01 p where p.polnvc = $1;';
        const params = [policyno];

        const result_next_due = await db.query(query_next_due, params);
        const result_mvy = await db.query(query_mvy, params);
        const result_policy_year = await db.query(query_policy_year, params);

        const next_due_date = result_next_due.rows[0].pmnddt;
        const mvy_date = result_mvy.rows[0].nmfddt;
        const policy_year = parseInt(result_policy_year.rows[0].polynm);
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

        // เปรียบเทียบ
        if (nextDueDate <= mvyDateObj) {
            console.log("\nหยุดทำงาน: วันที่กำหนดชำระถัดไป (Next Due) <= วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY)");
            console.log('\n-------------------------------------------- End of Process --------------------------------------------');
            return endloop = 'Y';
        } else if (mvyDateObj >= genbillDate && check_genbill === false) {
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
        } else {

            // Create RV if policy year >= 5
            if (policy_year >= 5) {
                console.log("\nทำการรันสร้าง RV เนื่องจาก ปีกรมธรรม์ >= 5");

                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Batch Manual Support"
                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Batch Manual Support');
                // รอหน้าโหลดเสร็จ
                await page.waitForLoadState('networkidle');
                await expect(page.locator('div[class="layout-m-hd"]'), { hasText: 'Batch Manual Support' }).toBeVisible({ timeout: 60000 });

                // รัน batch สร้าง RV UL
                await batchManualSupportPage.runBatchINV({ batch: 'CreateRV', policyno: policyno });

                // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
                await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
                // รอหน้าโหลดเสร็จ
                await page.waitForLoadState('networkidle');
                await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });
            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            console.log("\nทำงานต่อ: วันที่กำหนดชำระถัดไป (Next Due) >= วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY)");

            // // เช็คคำสั่งขายคงค้าง
            // const query_check_invoice = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'R'"
            // const result_check_invoice = await db.query(query_check_invoice, [policyno]);

            // // เช็คว่ามีคำสั่งขายคงค้างอยู่หรือไม่ ถ้าไม่มีให้รัน Batch Daily
            // if (result_check_invoice.rows.length === 0) {

            //     console.log('\nไม่มีคำสั่งขายคงค้างอยู่ ไปต่อเพื่อรัน Batch Daily');

            //     let check_batch_daily_success = false;
            //     // เช็คว่ามีการรัน Batch Daily สำเร็จจริงไหม
            //     while (!check_batch_daily_success) {
            //         // ปรับวัน วันที่หักค่าธรรมเนียมรายเดือนงวดถัดไป (MVY)
            //         const dashed = toDashed(mvy_date); // แปลงเป็น yyyy-MM-dd
            //         const adjustedDate_mvy = adjustDate.adjustDate(dashed);
            //         const process_date = toPlain(adjustedDate_mvy); // แปลงเป็น yyyyMMdd

            //         console.log('\nbusiness and current process date: ' + business_process_date + ' process date: ' + process_date);

            //         // update database
            //         const query_update_all_date_policy = 'update tpsplc01 set busndt = $2, crpcdt = $2, pctddt = $3 where polnvc = $1;';
            //         const result_update_all_date_policy = await db.query(query_update_all_date_policy, [policyno, business_process_date, process_date]);

            //         console.log('Update all date policy result: ' + result_update_all_date_policy.rowCount);

            //         /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            //         // ทำการรัน batch manual ที่หน้าเว็บ
            //         // เช็คสถานะ batch ก่อนรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
            //         await monitorBatchPage.checkStatusBeforeRunBatch();

            //         // รัน batch MVY UL
            //         await monitorBatchPage.runJobBatchDailyPolicy({ policyno: policyno });

            //         // เช็คสถานะ batch หลังรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
            //         await monitorBatchPage.checkStatusAfterRunBatch();

            //         /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            //         // query ตรวจสอบวันที่ของกรมธรรม์
            //         const query_check_date_policy = 'select p.busndt from tpsplc01 p where p.polnvc = $1;';
            //         const result_check_date_policy = await db.query(query_check_date_policy, [policyno]);

            //         // บวก 1 วัน เพื่อเทียบว่าวันที่ business date ของกรมธรรม์ มีการรัน batch แล้วหรือยัง
            //         const business_date_policy_plus1 = formatDatePlusOne(parseDate(process_date));
            //         if (result_check_date_policy.rows[0].busndt === business_date_policy_plus1) {
            //             check_batch_daily_success = true;
            //             console.log('\nรัน Batch Daily สำเร็จ');
            //         } else {
            //             console.log('\nรัน Batch Daily ไม่สำเร็จ ต้องรันใหม่');
            //         }
            //     }

            // } else {
            //     console.log('\nมีคำสั่งขายคงค้างอยู่ ข้าม step รัน Batch Daily');
            // }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            let status_transaction = '';
            let invoiceid_transaction = '';
            let endloop_transaction = '';

            while (((status_transaction !== 'VR01' || status_transaction !== 'VR02') && invoiceid_transaction !== '0') && endloop_transaction !== '1') {
                // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ
                const query_check_transactionstatus = "select distinct ordrdt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and irstvc = 'IR01'"
                const result_check_transactionstatus = await db.query(query_check_transactionstatus, [policyno]);

                if (result_check_transactionstatus.rows[0].vrstvc === 'VR01' && result_check_transactionstatus.rows[0].invoid === '0') {
                    // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "ตรวจสอบคำสั่งขายประจำวัน"
                    await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'ตรวจสอบคำสั่งขายประจำวัน');
                    // ค้นหาข้อมูลคำสั่งขาย
                    await verifyInvestmentOrderOperPage.search_waiting_VerifyInvestmentOrderOper({ date: result_check_transactionstatus.rows[0].ordrdt });

                } else if (result_check_transactionstatus.rows[0].vrstvc === 'VR02' && result_check_transactionstatus.rows[0].invoid === '0') {
                    // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "ตรวจสอบคำสั่งขายประจำวัน"
                    await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'ตรวจสอบคำสั่งขายประจำวัน');
                    // กด tab "ตรวจสอบและยืนยันคำสั่งขายประจำวัน"
                    await menubar_InvestmentOrderOper(page).investmentorderoper_btnVerifyInvestmentOrder.click({ timeout: 10000 });
                    // ค้นหาข้อมูลคำสั่งขาย
                    await verifyInvestmentOrderOperPage.search_verify_VerifyInvestmentOrderOper({ date: result_check_transactionstatus.rows[0].ordrdt });
                    // เลือก checkbox ตาม transaction no
                    await verifyInvestmentOrderOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: result_check_transactionstatus.rows[0].altnvc });
                    // ยืนยันคำสั่งขาย จากฝ่าย ปฏิบัติการ
                    await verifyInvestmentOrderOperPage.confirm_verify_VerifyInvestmentOrderOper();
                }

                endloop_transaction = '1';
            }


            /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่
            // const query_check_invoice_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'R'"
            // const result_check_invoice_ul = await db.query(query_check_invoice_ul, [policyno]);

            // // ตรวจคำสั่ง ซื้อขายที่สร้างขึ้น
            // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "ตรวจสอบคำสั่ง ซื้อ-ขาย V2"
            // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'ตรวจสอบคำสั่ง ซื้อ-ขาย V2');
            // // รอหน้าโหลดเสร็จ
            // await page.waitForLoadState('networkidle');
            // await expect(page.locator('text = ตรวจสอบคำสั่งซื้อขาย')).toBeVisible({ timeout: 60000 });

            // // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
            // for (const row_invoice_ul_ordercheck of result_check_invoice_ul.rows) {
            //     const fund_name_ordercheck = fund_code_dictionary[row_invoice_ul_ordercheck.fundnm] || 'Unknown Fund';
            //     console.log(`\nตรวจสอบคำสั่งขาย เลขที่อ้างอิง: ${row_invoice_ul_ordercheck.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_ordercheck.ordrdt}, กองทุน: ${fund_name_ordercheck.code}`);

            //     // ค้นหา ข้อมูลคำสั่งขาย
            //     await investmentOrderCheckPage.searchInvestmentOrderCheck({ date: row_invoice_ul_ordercheck.ordrdt });
            //     // เลือกเมนู คำสั่งขาย
            //     await menubar_InvestmentOrderCheck(page).investmentordercheck_btnSell.click({ timeout: 10000 });

            //     // เช็คว่า ปุ่มยืนยันคำสั่งขาย ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันคำสั่งขาย)
            //     if (await table_InvestmentOrderCheck(page).investmentordercheck_tblCheckbox(row_invoice_ul_ordercheck.invovc).isVisible()) {
            //         // เลือก checkbox ตามเลขที่อ้างอิง จาก database
            //         await investmentOrderCheckPage.clickInvestmentOrderCheckButton({ invoiceno: row_invoice_ul_ordercheck.invovc });
            //         // ยืนยันคำสั่งขาย
            //         await investmentOrderCheckPage.confirmSellInvestmentOrderCheck({ invoiceno: row_invoice_ul_ordercheck.invovc });
            //     } else {
            //         console.log(`คำสั่งขาย เลขที่อ้างอิง ${row_invoice_ul_ordercheck.invovc} ยืนยันคำสั่งขายแล้ว`);
            //     }
            // }

            // /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // // เช็คราคา NAV ของกองทุน
            // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "อัพเดทราคา NAV ประจำวัน"
            // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'อัพเดทราคา NAV ประจำวัน');
            // // รอหน้าโหลดเสร็จ
            // await page.waitForLoadState('networkidle');
            // await expect(page.locator('div[class="layout-m-hd"]').locator('text = อัพเดทราคา NAV ประจำวัน')).toBeVisible({ timeout: 60000 });

            // // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
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

            // /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // // รับผลการซื้อขาย หน่วยลงทุน
            // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "รับผลการซื้อ-ขายหน่วยลงทุน"
            // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'รับผลการซื้อ-ขายหน่วยลงทุน');
            // // รอหน้าโหลดเสร็จ
            // await page.waitForLoadState('networkidle');
            // await expect(page.locator('text = ยืนยันผลคำสั่งซื้อ-ขาย')).toBeVisible({ timeout: 60000 });

            // // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
            // for (const row_invoice_ul_orderresult of result_check_invoice_ul.rows) {
            //     const fund_name_orderresult = fund_code_dictionary[row_invoice_ul_orderresult.fundnm] || 'Unknown Fund';
            //     console.log(`\nรับผลการขายหน่วยลงทุน เลขที่อ้างอิง: ${row_invoice_ul_orderresult.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_orderresult.ordrdt}, กองทุน: ${fund_name_orderresult.code}`);

            //     // ค้นหา ข้อมูลคำสั่งซื้อขาย
            //     await investmentOrderResultPage.searchInvestmentOrderResult({ date: row_invoice_ul_orderresult.ordrdt });
            //     // เลือกเมนู คำสั่งขาย
            //     await menubar_InvestmentOrderResult(page).investmentorderresult_btnSell.click({ timeout: 10000 });

            //     // เช็คว่า ยืนยันคำสั่งซื้อขาย ปุ่มสีฟ้า ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันผลการขาย)
            //     if (await table_InvestmentOrderResult(page).investmentorderresult_tblCheckbox(row_invoice_ul_orderresult.invovc).isVisible()) {
            //         // ยืนยันผลการขาย หน่วยลงทุน ตามเลขที่อ้างอิง จาก database
            //         await investmentOrderResultPage.clickInvestmentOrderResultConfirmButton({ invoiceno: row_invoice_ul_orderresult.invovc });
            //     } else {
            //         console.log(`คำสั่งขาย เลขที่อ้างอิง ${row_invoice_ul_orderresult.invovc} ได้รับผลการขายหน่วยลงทุนแล้ว`);
            //     }
            // }

            // /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่
            // const query_check_fundredemptionreceipt = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVINV01.iostvc = 'IO05'"
            // const result_check_fundredemptionreceipt = await db.query(query_check_fundredemptionreceipt, [policyno]);

            // // บันทึกรับเงินจากบลจ. (คำสั่งขาย)
            // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "บันทึกรับเงินจากบลจ. (คำสั่งขาย) V2"
            // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'บันทึกรับเงินจากบลจ. (คำสั่งขาย) V2');
            // // รอหน้าโหลดเสร็จ
            // await page.waitForLoadState('networkidle');
            // await expect(page.locator('a[role="tab"]').getByText('รายการรอรับชำระเงินจาก บลจ.'), { exact: true }).toBeVisible({ timeout: 60000 });
            // // รอข้อมูลโหลดเสร็จ
            // await page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
            // await expect(page.locator('div[class="busy-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'กำลังค้นหาข้อมูล...' })).not.toBeVisible({ timeout: 60000 });

            // // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
            // for (const row_fundredemptionreceipt of result_check_fundredemptionreceipt.rows) {
            //     const fund_name_fundredemptionreceipt = fund_code_dictionary[row_fundredemptionreceipt.fundnm] || 'Unknown Fund';
            //     console.log(`\nบันทึกรับเงินจากบลจ. เลขที่อ้างอิง: ${row_fundredemptionreceipt.invovc}, วันที่สั่งซื้อขาย: ${row_fundredemptionreceipt.ordrdt}, กองทุน: ${fund_name_fundredemptionreceipt.code}`);

            //     // ยืนยัน บันทึกรับเงินจากบลจ. (คำสั่งขาย) ตามเลขที่อ้างอิง จาก database
            //     await page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
            //     await fundRedemptionReceipt.clickFundRedemptionReceiptConfirmButton({ invoiceno: row_fundredemptionreceipt.invovc, date: row_fundredemptionreceipt.ordrdt });

            // }

            // /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // // Update RV if policy year >= 5
            // if (policy_year >= 5) {
            //     console.log("\nทำการรันอัพเดท RV เนื่องจาก ปีกรมธรรม์ >= 5");

            //     // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Batch Manual Support"
            //     await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Batch Manual Support');
            //     // รอหน้าโหลดเสร็จ
            //     await page.waitForLoadState('networkidle');
            //     await expect(page.locator('div[class="layout-m-hd"]'), { hasText: 'Batch Manual Support' }).toBeVisible({ timeout: 60000 });

            //     // รัน batch สร้าง RV UL
            //     await batchManualSupportPage.runBatchINV({ batch: 'UpdateRV', policyno: policyno });
            // }

            // /////////////////////////////////////////////////////////////////////////////////////////////////////////////

            if (fix_endloop !== '') {
                endloop = fix_endloop;
            }
        }

        // ปิด database
        await db.close();

        console.log('\n-------------------------------------------- End of Process --------------------------------------------');
    }

});