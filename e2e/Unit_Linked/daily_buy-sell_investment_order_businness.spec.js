import { test, expect } from '@playwright/test';

import { chromium } from '@playwright/test';

// database
const { configdb } = require('../../database/database_env.js');
const { Database } = require('../../database/database.js');

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
const { menubar_InvestmentBuyOrderOper, menubar_InvestmentSellOrderOper } = require('../../locators/Unit_Linked/VerifyInvestmentOrderBuyOper.locators.js');

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

test('Daily Buy-Sell Investment Order - Unit Linked', async ({ page }) => {

    // test('Daily Buy-Sell Investment Order - Unit Linked', async ({}) => {
    //     const browser = await chromium.launch({
    //         channel: 'chrome',   // 👈 ใช้ Chrome ในเครื่อง
    //         headless: false,      // เปิด browser ให้เห็น
    //         args: [
    //             '--start-maximized',   // 👈 เปิดเต็มจอ
    //             '--disable-web-security',
    //             '--disable-site-isolation-trials',
    //             '--disable-features=IsolateOrigins,site-per-process,NetworkService'
    //         ]
    //     });
    //     // 👇 ต้องมีตรงนี้
    //     const context = await browser.newContext({
    //         viewport: null
    //     });
    //     const page = await context.newPage();

    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(86400000); // 24 ชั่วโมง

    // const browser = await chromium.launchPersistentContext(
    //     'C:/Users/thanakrit.ph/AppData/Local/Google/Chrome/User Data/Profile 2',
    //     {
    //         channel: 'chrome',
    //         headless: false,
    //         args: [
    //             '--disable-web-security',
    //             '--disable-site-isolation-trials',
    //             '--disable-features=IsolateOrigins,site-per-process,NetworkService'
    //         ]
    //     }
    // );

    // ข้อมูลสำหรับทดสอบ
    // Config Username และ Password สำหรับเข้าสู่ระบบ NBS
    const username = 'boss';
    const password = '1234';
    // const policyno = 'UL00003036'; // เลขกรมธรรม์ที่ต้องการทดสอบ

    // Config ENV 
    const env = 'SIT' // SIT / UAT
    // connection database
    const db_name = 'coreul';
    const db_env = 'SIT_EDIT'; // SIT | SIT_EDIT / UAT | UAT_EDIT

    // Config Loyalty Bonus
    const auto_buyorder_Loyalty_Bonus = true; // กำหนดให้สร้างคำสั่งซื้ออัตโนมัติ สำหรับ กรณีเงินปันผลสะสม (Loyalty Bonus) เท่านั้น (true / false)

    const remarkcutoff_oper = 'ทดสอบรันอัตโนมัติ Daily Buy-Sell Investment Order';

    const update_data_error_helpdesk_support = true; // กำหนดให้ อัพเดทข้อมูลกรณีเกิดข้อผิดพลาด helpdesk support (true / false)

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

    console.log('\n-------------------------------------------- Start of Process ------------------------------------------');

    let db;

    db = new Database({
        user: configdb[db_name][db_env].DB_USER,
        host: configdb[db_name][db_env].DB_HOST,
        database: configdb[db_name][db_env].DB_NAME,
        password: configdb[db_name][db_env].DB_PASSWORD,
        port: configdb[db_name][db_env].DB_PORT,
    });

    console.log("\nเริ่มทำงาน Daily Buy-Sell Investment Order");

    // ดึงวันที่ปัจจุบันจากระบบ แล้วแปลงเป็น yyyyMMdd
    const currentDate = new Date();
    const yyyy = currentDate.getFullYear().toString();
    const mm = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = currentDate.getDate().toString().padStart(2, '0');
    const currentdate = yyyy + mm + dd;

    console.log(`\nวันที่ปัจจุบันของระบบ: ${toDashed(currentdate)}`);

    // ดึงเลขที่กรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่
    const query_check_all_order_policy = `select distinct TIVREQ01.polnvc 
                                            from TIVREQ01,tivinv01 
                                            where 
                                            TIVREQ01.ordrdt <= '${currentdate}'
                                            and TIVREQ01.invoid = tivinv01.invoid
                                            AND (
                                                (TIVREQ01.irstvc NOT IN ('IR03','IR05') and tivinv01.iostvc not in ('IO07','IO08','IO06') AND TIVREQ01.iotcvc = 'R')
                                                OR 
                                                (TIVREQ01.irstvc NOT IN ('IR03','IR04','IR05') AND TIVREQ01.iotcvc = 'P')
                                            )
                                            
                                            order by TIVREQ01.polnvc asc
                                            limit 1`; // limit 1
    const result_check_all_order_policy = await db.query(query_check_all_order_policy);

    for (const policyno_investment_order of result_check_all_order_policy.rows) {
        console.log(policyno_investment_order.polnvc);

        // เช็คปีที่กรมธรรม์
        const query_check_policy_year = 'select p.CTSTDT,p.NMFDDT, p.busndt from tpsplc01 p where p.polnvc = $1;';
        const result_check_policy_year = await db.query(query_check_policy_year, [policyno_investment_order.polnvc]);
        const start_policy_date = result_check_policy_year.rows[0].ctstdt;
        const mvy_date_policy = result_check_policy_year.rows[0].nmfddt;
        const business_date_policy = result_check_policy_year.rows[0].busndt;
        const year_calculate = calculateYearsOnly(start_policy_date, mvy_date_policy);
        // + 1 เพื่อให้ตรงกับปีกรมธรรม์ที่แสดงในระบบ (ปีกรมธรรม์นับจากวันครบรอบปีกรมธรรม์ครั้งถัดไป)
        const policy_year = year_calculate + 1;

        console.log(`ปีกรมธรรม์: ${policy_year} ปี`);

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Process Create RV
        // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process สร้าง RV
        // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "Batch Manual Support"
        await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'Batch Manual Support');
        // Create RV
        if (policy_year >= 5) {
            if (business_date_policy === mvy_date_policy) {
                // เช็คว่ามีคำสั่งขายคงค้าง
                const query_check_invoice_create_rv = "select distinct ordrdt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and irstvc = 'IR01'"
                const result_check_invoice_create_rv = await db.query(query_check_invoice_create_rv, [policyno_investment_order_create_rv.polnvc]);

                if (result_check_invoice_create_rv.rows.length > 0) {
                    console.log('\nมีคำสั่งขายคงค้างอยู่ ข้าม step รัน Create RV');
                } else {
                    console.log("\nทำการรันสร้าง RV เนื่องจาก ปีกรมธรรม์ >= 5");

                    let check_create_rv_success = false;

                    while (!check_create_rv_success) {
                        // ตรวจสอบว่ามีการทำ Create RV หรือยัง
                        const query_check_create_rv = "SELECT * FROM TIVSRV01 WHERE polnvc IN ($1) and trstdt = $2 ORDER BY rvbdid asc ;";
                        const result_check_create_rv = await db.query(query_check_create_rv, [policyno_investment_order_create_rv.polnvc, mvy_date_policy]);
                        console.log(result_check_create_rv.rows);
                        if (result_check_create_rv.rows.length > 0) {
                            // console.log('มีการสร้าง RV ไปแล้ว ข้ามการรันสร้าง RV');

                            // // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "IT Support" > "Monitor batch"
                            // await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');
                            // // รอหน้าโหลดเสร็จ
                            // await page.waitForLoadState('networkidle');
                            // await expect(page.locator('text = Monitor / Run batch')).toBeVisible({ timeout: 60000 });

                            check_create_rv_success = true;
                        } else {
                            // รอหน้าโหลดเสร็จ
                            await page.waitForLoadState('networkidle');
                            await expect(page.locator('div[class="layout-m-hd"]'), { hasText: 'Batch Manual Support' }).toBeVisible({ timeout: 60000 });

                            // รัน batch สร้าง RV UL
                            await batchManualSupportPage.runBatchINV({ batch: 'CreateRV', policyno: policyno_investment_order_create_rv.polnvc, date: mvy_date_policy });

                            // // เช็คว่ามีการสร้าง RV สำเร็จหรือไม่
                            // const result_check_create_rv_after = await db.query(query_check_create_rv, [policyno_investment_order_create_rv.polnvc, mvy_date_policy]);
                            // if (result_check_create_rv_after.rows.length === 0) {
                            //     // แสดง error
                            //     throw new Error('สร้าง RV ไม่สำเร็จ');
                            // } else {
                            //     console.log('\nสร้าง RV สำเร็จ');
                            //     check_create_rv_success = true;
                            // }
                        }
                    }
                }
            }
        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // ซื้อหน่วยลงทุน
        // query order คำสั่งซื้อ ทั้งหมด โดยดึงข้อมูล invoid และ order ตาม ordrdt
        const query_order_buy_investment = `select distinct tivinv01.ordrdt ,TIVREQ01.polnvc
                                            from TIVREQ01,tivinv01 
                                            WHERE 
                                                TIVREQ01.invoid = tivinv01.invoid
                                                AND (TIVREQ01.irstvc NOT IN ('IR03','IR04','IR05') AND TIVREQ01.iotcvc = 'P')
                                            and polnvc = $1
                                            order by tivinv01.ordrdt asc
                                            `; // limit 1
        const result_order_buy_investment = await db.query(query_order_buy_investment, [policyno_investment_order.polnvc]);
        for (const order_all_policy_buy_investment of result_order_buy_investment.rows) {

            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process ตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ (คำสั่งซื้อ)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "ตรวจสอบคำสั่งซื้อประจำวัน"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'ตรวจสอบคำสั่งซื้อประจำวัน');

            // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ (คำสั่งซื้อ)
            const query_check_transactionstatus_orderbuy = "select distinct ordrdt,trandt,vrstvc,altnvc,invoid from tivreq01 t where t.polnvc in ($1) and ordrdt = $2 and irstvc = 'IR01' and iotcvc = 'P'"
            const result_check_transactionstatus_orderbuy = await db.query(query_check_transactionstatus_orderbuy, [order_all_policy_buy_investment.polnvc, order_all_policy_buy_investment.ordrdt]);

            // เช็คว่ามีคำสั่งซื้อที่ต้องตรวจสอบจากฝ่ายปฏิบัติการหรือไม่
            if (result_check_transactionstatus_orderbuy.rows.length === 0) {
                // console.log('\nไม่มีคำสั่งซื้อที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
            } else {
                for (const row_oper_buy of result_check_transactionstatus_orderbuy.rows) {
                    if (row_oper_buy.invoid != 0) {
                        // console.log('\nไม่มีคำสั่งซื้อที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
                    } else {
                        if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {

                            let status_transaction = row_oper_buy.vrstvc;
                            let invoiceid_transaction = row_oper_buy.invoid;

                            while ((status_transaction === 'VR01' || status_transaction === 'VR02') && invoiceid_transaction === '0') {

                                // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ
                                if (status_transaction === 'VR01' && invoiceid_transaction === '0') {

                                    //ตัด string เอาแค่ วันที่ 8 ตัวแรก
                                    const transaction_date = row_oper_buy.trandt.toString().substring(0, 8);

                                    console.log(`\nสร้างคำสั่งซื้อ oper เลขที่อ้างอิง: ${row_oper_buy.invoid}, วันที่สั่งซื้อขาย: ${transaction_date}, Transaction No: ${row_oper_buy.altnvc}`);

                                    // กด tab "รอสร้างคำสั่งซื้อ"
                                    await menubar_InvestmentBuyOrderOper(page).investmentorderoper_btnWaitingforCreateOrder.click({ timeout: 10000 });
                                    // ค้นหาข้อมูลคำสั่งซื้อ
                                    await verifyInvestmentOrderBuyOperPage.search_verify_VerifyInvestmentOrderOper_Tab1({ date: transaction_date });
                                    // เลือก checkbox ตาม transaction no
                                    await verifyInvestmentOrderBuyOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: row_oper_buy.altnvc });

                                    // สร้างคำสั่งซื้อ จากฝ่าย ปฏิบัติการ
                                    await verifyInvestmentOrderBuyOperPage.confirm_verify_VerifyInvestmentOrderOper_Tab1({ remarkcutoff_oper: remarkcutoff_oper });

                                } else if (status_transaction === 'VR02' && invoiceid_transaction === '0') {

                                    console.log(`\nตรวจสอบคำสั่งซื้อ oper เลขที่อ้างอิง: ${row_oper_buy.invoid}, วันที่สั่งซื้อขาย: ${row_oper_buy.ordrdt}, Transaction No: ${row_oper_buy.altnvc}`);

                                    // กด tab "ตรวจสอบและยืนยันคำสั่งซื้อประจำวัน"
                                    await menubar_InvestmentBuyOrderOper(page).investmentorderoper_btnVerifyInvestmentOrder.click({ timeout: 10000 });
                                    // ค้นหาข้อมูลคำสั่งซื้อ
                                    await verifyInvestmentOrderBuyOperPage.search_verify_VerifyInvestmentOrderOper({ date: row_oper_buy.ordrdt });
                                    // เลือก checkbox ตาม transaction no
                                    await verifyInvestmentOrderBuyOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: row_oper_buy.altnvc });
                                    // ยืนยันคำสั่งซื้อ จากฝ่าย ปฏิบัติการ
                                    await verifyInvestmentOrderBuyOperPage.confirm_verify_VerifyInvestmentOrderOper({ remarkcutoff_oper: remarkcutoff_oper });

                                }

                                // ดึงข้อมูลใหม่อีกครั้ง
                                const recheck_result_check_transactionstatus_orderbuy_new = await db.query(query_check_transactionstatus_orderbuy, [order_all_policy_buy_investment.polnvc, order_all_policy_buy_investment.ordrdt]);
                                status_transaction = recheck_result_check_transactionstatus_orderbuy_new.rows[0].vrstvc;
                                invoiceid_transaction = recheck_result_check_transactionstatus_orderbuy_new.rows[0].invoid;
                            }
                        }

                    }
                }
            }

            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process ตรวจสอบคำสั่ง ซื้อ-ขาย (คำสั่งซื้อ)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "ตรวจสอบคำสั่ง ซื้อ-ขาย V2"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'ตรวจสอบคำสั่ง ซื้อ-ขาย V2');

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งซื้อ)
            const query_check_invoice_buy_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'P'"
            const result_check_invoice_buy_ul = await db.query(query_check_invoice_buy_ul, [order_all_policy_buy_investment.polnvc, order_all_policy_buy_investment.ordrdt]);

            if (result_check_invoice_buy_ul.rows.length > 0) {
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
            }
            
            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process อัพเดทราคา NAV (คำสั่งซื้อ)
            // อัพเดท NAV ของกองทุนที่เกี่ยวข้องกับคำสั่งซื้อขาย ใน database

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งซื้อ)
            const query_check_nav_invoice_buy_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'P'"
            const result_check_nav_invoice_buy_ul = await db.query(query_check_nav_invoice_buy_ul, [order_all_policy_buy_investment.polnvc, order_all_policy_buy_investment.ordrdt]);

            if (result_check_nav_invoice_buy_ul.rows.length > 0) {
                // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
                if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
                    for (const row_invoice_ul_updatenav of result_check_nav_invoice_buy_ul.rows) {
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
                            const result_insert_nav_update_buy = await db.query(query_insert_nav_update_buy, [row_invoice_ul_updatenav.fundnm, numeric_dateupdate_buy_nav, NAVValue, BidPriceValue, OfferPriceValue, NetAssetValue]);
                            // จำนวนแถวที่ถูก insert
                            console.log(`Insert NAV update result: ${result_insert_nav_update_buy.rowCount}`);
                        } else {
                            console.log(`\nมีการอัพเดท NAV ของกองทุน ${fund_name_updatenav.code} สำหรับคำสั่งซื้อ เลขที่อ้างอิง: ${row_invoice_ul_updatenav.invovc} วันที่ ${row_invoice_ul_updatenav.ordrdt} เรียบร้อยแล้ว`);
                        }
                    }
                }
            }

            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)');

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งซื้อ)
            const query_check_confirm_invoice_buy_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'P'"
            const result_check_confirm_invoice_buy_ul = await db.query(query_check_confirm_invoice_buy_ul, [order_all_policy_buy_investment.polnvc, order_all_policy_buy_investment.ordrdt]);

            if (result_check_confirm_invoice_buy_ul.rows.length > 0) {
                // ยืนยันการชำระเงินให้กับ บลจ.(คำสั่งซื้อ)
                if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
                    // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
                    for (const row_invoice_ul_confirmorder of result_check_confirm_invoice_buy_ul.rows) {
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

            // ----------------------------------------------------------------------------------------- //

            // // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process รับผลการซื้อขาย หน่วยลงทุน (คำสั่งซื้อ)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "รับผลการซื้อ-ขายหน่วยลงทุน"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'รับผลการซื้อ-ขายหน่วยลงทุน');

            // เช็คว่ามีการ update ค่า upnvdt ในตาราง tivreq01 หรือยัง
            const query_check_upnvdt_tivreq01 = "select distinct ALTYNM,ordrdt,invoid,vrstvc,altnvc, upnvdt, altrid from tivreq01 t where t.polnvc = $1 and t.ordrdt = $2 and t.irstvc in ('IR01');"
            const result_check_upnvdt_tivreq01 = await db.query(query_check_upnvdt_tivreq01, [order_all_policy_buy_investment.polnvc, order_all_policy_buy_investment.ordrdt]);
            for (const row_check_upnvdt of result_check_upnvdt_tivreq01.rows) {
                const orderdate_tivreq01 = `${row_check_upnvdt.ordrdt}000000000`;
                const upnvdt_tivreq01 = row_check_upnvdt.upnvdt;
                const altrid_tivreq01 = row_check_upnvdt.altrid;

                if (upnvdt_tivreq01 === '0') {
                    console.log(`\nไม่มีค่า upnvdt ในตาราง tivreq01 สำหรับกรมธรรม์ ${order_all_policy_buy_investment.polnvc} วันที่สั่งซื้อขาย: ${orderdate_tivreq01}`);
                    // update ค่า upnvdt ในตาราง tivreq01
                    const query_update_upnvdt_tivreq01 = "UPDATE tivreq01 SET upnvdt= $2 where altrid = $1;"
                    const result_update_upnvdt_tivreq01 = await db.query(query_update_upnvdt_tivreq01, [altrid_tivreq01, Number(orderdate_tivreq01)]);
                    console.log(`อัพเดทค่า upnvdt ในตาราง tivreq01 สำเร็จ จำนวนแถวที่ถูกอัพเดท: ${result_update_upnvdt_tivreq01.rowCount}`);
                }
            }

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งซื้อ)
            const query_check_menu3_invoice_buy_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'P'"
            const result_check_menu3_invoice_buy_ul = await db.query(query_check_menu3_invoice_buy_ul, [order_all_policy_buy_investment.polnvc, order_all_policy_buy_investment.ordrdt]);

            if (result_check_menu3_invoice_buy_ul.rows.length > 0) {
                // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งซื้อ)
                if (policy_year < 5 || (policy_year >= 5 && auto_buyorder_Loyalty_Bonus === true)) {
                    for (const row_invoice_buy_ul_orderresult of result_check_menu3_invoice_buy_ul.rows) {
                        const fund_name_orderresult = fund_code_dictionary[row_invoice_buy_ul_orderresult.fundnm] || 'Unknown Fund';
                        console.log(`\nรับผลการซื้อหน่วยลงทุน เลขที่อ้างอิง: ${row_invoice_buy_ul_orderresult.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_buy_ul_orderresult.ordrdt}, กองทุน: ${fund_name_orderresult.code}`);

                        // ค้นหา ข้อมูลคำสั่งซื้อขาย
                        await investmentOrderResultPage.searchInvestmentOrderResult({ date: row_invoice_buy_ul_orderresult.ordrdt });
                        // เลือกเมนู คำสั่งขาย
                        await menubar_InvestmentOrderResult(page).investmentorderresult_btnBuy.click({ timeout: 10000 });

                        // เช็คว่า ยืนยันคำสั่งซื้อขาย ปุ่มสีฟ้า ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันผลการขาย)
                        if (await table_InvestmentOrderResult(page).investmentorderresult_tblCheckbox(row_invoice_buy_ul_orderresult.invovc).isVisible()) {
                            // ยืนยันผลการขาย หน่วยลงทุน ตามเลขที่อ้างอิง จาก database
                            await investmentOrderResultPage.clickInvestmentOrderResultConfirmButton({ invoiceno: row_invoice_buy_ul_orderresult.invovc, db_env: db_env, db_name: db_name, policyno: order_all_policy_buy_investment.polnvc, update_data_error_helpdesk_support: update_data_error_helpdesk_support });
                        } else {
                            console.log(`คำสั่งซื้อ เลขที่อ้างอิง ${row_invoice_buy_ul_orderresult.invovc} ได้รับผลการซื้อหน่วยลงทุนแล้ว`);
                        }
                    }
                }
            }

            // ----------------------------------------------------------------------------------------- //

        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // ขายหน่วยลงทุน

        // query order คำสั่งขาย ทั้งหมด โดยดึงข้อมูล invoid และ order ตาม ordrdt
        const query_order_sell_investment = `select distinct tivinv01.ordrdt ,TIVREQ01.polnvc
                                            from TIVREQ01,tivinv01 
                                            WHERE 
                                                TIVREQ01.invoid = tivinv01.invoid
                                                AND (TIVREQ01.irstvc NOT IN ('IR03','IR05') and tivinv01.iostvc not in ('IO07','IO08','IO06') AND TIVREQ01.iotcvc = 'R')
                                            and polnvc = $1
                                            order by tivinv01.ordrdt asc
                                            `; // limit 1
        const result_order_sell_investment = await db.query(query_order_sell_investment, [policyno_investment_order.polnvc]);
        for (const order_all_policy_sell_investment of result_order_sell_investment.rows) {

            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process ตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ (คำสั่งขาย)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "ตรวจสอบคำสั่งขายประจำวัน"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'ตรวจสอบคำสั่งขายประจำวัน');

            const query_check_transactionstatus = "select distinct ordrdt,trandt,vrstvc,altnvc,invoid from tivreq01 t where t.ordrdt = $2 and t.polnvc in ($1) and irstvc = 'IR01' and iotcvc = 'R'"
            const result_check_transactionstatus = await db.query(query_check_transactionstatus, [order_all_policy_sell_investment.polnvc, order_all_policy_sell_investment.ordrdt]);
            if (result_check_transactionstatus.rows.length === 0) {
                // console.log('\nไม่มีคำสั่งขายที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
            } else {
                for (const row_oper_sell of result_check_transactionstatus.rows) {
                    // เช็คว่ามีคำสั่งขายที่ต้องตรวจสอบจากฝ่ายปฏิบัติการหรือไม่
                    if (row_oper_sell.invoid != 0) {
                        // console.log('\nไม่มีคำสั่งขายที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');
                    } else {
                        // console.log('\nมีคำสั่งขายที่ต้องตรวจสอบจากฝ่ายปฏิบัติการ');

                        let status_transaction = row_oper_sell.vrstvc;
                        let invoiceid_transaction = row_oper_sell.invoid;

                        while ((status_transaction === 'VR01' || status_transaction === 'VR02') && invoiceid_transaction === '0') {

                            // เช็คเลขธุรกรรม และ สถานะตรวจสอบคำสั่งซื้อ-ขาย สำหรับฝ่ายปฏิบัติการ
                            if (status_transaction === 'VR01' && invoiceid_transaction === '0') {

                                //ตัด string เอาแค่ วันที่ 8 ตัวแรก
                                const transaction_date = row_oper_sell.trandt.toString().substring(0, 8);

                                console.log(`\nสร้างคำสั่งขาย oper เลขที่อ้างอิง: ${row_oper_sell.invoid}, วันที่สั่งซื้อขาย: ${transaction_date}, Transaction No: ${row_oper_sell.altnvc}`);

                                // กด tab "รอสร้างคำสั่งขาย"
                                await menubar_InvestmentOrderOper(page).investmentorderoper_btnWaitingforCreateOrder.click({ timeout: 60000 });
                                // ค้นหาข้อมูลคำสั่งขาย
                                await verifyInvestmentOrderBuyOperPage.search_verify_VerifyInvestmentOrderOper_Tab1({ date: transaction_date });
                                // เลือก checkbox ตาม transaction no
                                await verifyInvestmentOrderBuyOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: row_oper_sell.altnvc });

                                // สร้างคำสั่งขาย จากฝ่าย ปฏิบัติการ
                                await verifyInvestmentOrderBuyOperPage.confirm_verify_VerifyInvestmentOrderOper_Tab1({ remarkcutoff_oper: remarkcutoff_oper });

                            } else if (status_transaction === 'VR02' && invoiceid_transaction === '0') {

                                console.log(`\nตรวจสอบคำสั่งขาย oper เลขที่อ้างอิง: ${row_oper_sell.invoid}, วันที่สั่งซื้อขาย: ${row_oper_sell.ordrdt}, Transaction No: ${row_oper_sell.altnvc}`);

                                // กด tab "ตรวจสอบและยืนยันคำสั่งขายประจำวัน"
                                await menubar_InvestmentOrderOper(page).investmentorderoper_btnVerifyInvestmentOrder.click({ timeout: 60000 });
                                // ค้นหาข้อมูลคำสั่งขาย
                                await verifyInvestmentOrderSellOperPage.search_verify_VerifyInvestmentOrderOper({ date: row_oper_sell.ordrdt });
                                // เลือก checkbox ตาม transaction no
                                await verifyInvestmentOrderSellOperPage.click_verify_VerifyInvestmentOrderOperCheckButton({ transactionno: row_oper_sell.altnvc });
                                // ยืนยันคำสั่งขาย จากฝ่าย ปฏิบัติการ
                                await verifyInvestmentOrderSellOperPage.confirm_verify_VerifyInvestmentOrderOper({ remarkcutoff_oper: remarkcutoff_oper });
                            }

                            // ดึงข้อมูลใหม่อีกครั้ง
                            const result_check_transactionstatus_new = await db.query(query_check_transactionstatus, [order_all_policy_sell_investment.polnvc, order_all_policy_sell_investment.ordrdt]);
                            status_transaction = result_check_transactionstatus_new.rows[0].vrstvc;
                            invoiceid_transaction = result_check_transactionstatus_new.rows[0].invoid;
                        }
                    }
                }
            }

            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process ตรวจสอบคำสั่ง ซื้อ-ขาย (คำสั่งขาย)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "ตรวจสอบคำสั่ง ซื้อ-ขาย V2"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'ตรวจสอบคำสั่ง ซื้อ-ขาย V2');
            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งขาย)
            const query_check_invoice_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'R';";
            const result_check_invoice_ul = await db.query(query_check_invoice_ul, [order_all_policy_sell_investment.polnvc, order_all_policy_sell_investment.ordrdt]);

            if (result_check_invoice_ul.rows.length > 0) {
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
            }


            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process อัพเดทราคา NAV (คำสั่งขาย)
            // อัพเดท NAV ของกองทุนที่เกี่ยวข้องกับคำสั่งซื้อขาย ใน database
            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งขาย)
            const query_check_nav_invoice_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'R'";
            const result_check_nav_invoice_ul = await db.query(query_check_nav_invoice_ul, [order_all_policy_sell_investment.polnvc, order_all_policy_sell_investment.ordrdt]);

            if (result_check_nav_invoice_ul.rows.length > 0) {
                for (const row_invoice_ul_updatenav of result_check_nav_invoice_ul.rows) {
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
            }

            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process รับผลการซื้อขาย หน่วยลงทุน (คำสั่งขาย)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "รับผลการซื้อ-ขายหน่วยลงทุน"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'รับผลการซื้อ-ขายหน่วยลงทุน');
            // เช็คว่ามีการ update ค่า upnvdt ในตาราง tivreq01 หรือยัง
            const query_check_upnvdt_tivreq01 = "select distinct ALTYNM,ordrdt,invoid,vrstvc,altnvc, upnvdt, altrid from tivreq01 t where t.polnvc = $1 and t.ordrdt = $2 and irstvc in ('IR01')";
            const result_check_upnvdt_tivreq01 = await db.query(query_check_upnvdt_tivreq01, [order_all_policy_sell_investment.polnvc, order_all_policy_sell_investment.ordrdt]);

            if (result_check_upnvdt_tivreq01.rows.length > 0) {
                for (const row_check_upnvdt of result_check_upnvdt_tivreq01.rows) {
                    const orderdate_tivreq01 = `${row_check_upnvdt.ordrdt}000000000`;
                    const upnvdt_tivreq01 = row_check_upnvdt.upnvdt;
                    const altrid_tivreq01 = row_check_upnvdt.altrid;

                    if (upnvdt_tivreq01 === '0') {
                        console.log(`\nไม่มีค่า upnvdt ในตาราง tivreq01 สำหรับกรมธรรม์ ${order_all_policy_sell_investment.polnvc} วันที่สั่งซื้อขาย: ${orderdate_tivreq01}`);
                        // update ค่า upnvdt ในตาราง tivreq01
                        const query_update_upnvdt_tivreq01 = "UPDATE tivreq01 SET upnvdt= $2 where altrid = $1;"
                        const result_update_upnvdt_tivreq01 = await db.query(query_update_upnvdt_tivreq01, [altrid_tivreq01, Number(orderdate_tivreq01)]);
                        console.log(`อัพเดทค่า upnvdt ในตาราง tivreq01 สำเร็จ จำนวนแถวที่ถูกอัพเดท: ${result_update_upnvdt_tivreq01.rowCount}`);
                    }
                }

                // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่ (คำสั่งขาย)
                const query_check_menu2_invoice_ul = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVREQ01.irstvc = 'IR01' and TIVREQ01.iotcvc = 'R'";
                const result_check_menu2_invoice_ul = await db.query(query_check_menu2_invoice_ul, [order_all_policy_sell_investment.polnvc, order_all_policy_sell_investment.ordrdt]);

                // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database (คำสั่งขาย)
                for (const row_invoice_ul_orderresult of result_check_menu2_invoice_ul.rows) {
                    const fund_name_orderresult = fund_code_dictionary[row_invoice_ul_orderresult.fundnm] || 'Unknown Fund';
                    console.log(`\nรับผลการขายหน่วยลงทุน เลขที่อ้างอิง: ${row_invoice_ul_orderresult.invovc}, วันที่สั่งซื้อขาย: ${row_invoice_ul_orderresult.ordrdt}, กองทุน: ${fund_name_orderresult.code}`);

                    // ค้นหา ข้อมูลคำสั่งซื้อขาย
                    await investmentOrderResultPage.searchInvestmentOrderResult({ date: row_invoice_ul_orderresult.ordrdt });
                    // เลือกเมนู คำสั่งขาย
                    await menubar_InvestmentOrderResult(page).investmentorderresult_btnSell.click({ timeout: 10000 });

                    // เช็คว่า ยืนยันคำสั่งซื้อขาย ปุ่มสีฟ้า ยังแสดงอยู่หรือไม่ (ถ้าแสดงอยู่แสดงว่ายังไม่ได้ยืนยันผลการขาย)
                    if (await table_InvestmentOrderResult(page).investmentorderresult_tblCheckbox(row_invoice_ul_orderresult.invovc).isVisible()) {
                        // ยืนยันผลการขาย หน่วยลงทุน ตามเลขที่อ้างอิง จาก database
                        await investmentOrderResultPage.clickInvestmentOrderResultConfirmButton({ invoiceno: row_invoice_ul_orderresult.invovc, db_env: db_env, db_name: db_name, policyno: order_all_policy_sell_investment.polnvc, update_data_error_helpdesk_support: update_data_error_helpdesk_support });
                    } else {
                        console.log(`คำสั่งขาย เลขที่อ้างอิง ${row_invoice_ul_orderresult.invovc} ได้รับผลการขายหน่วยลงทุนแล้ว`);
                    }
                }
            }

            // ----------------------------------------------------------------------------------------- //

            // วนลูปตรวจสอบกรมธรรม์ที่มีคำสั่งซื้อขายหน่วยลงทุนค้างอยู่ เพื่อทำ Process บันทึกรับเงิน บลจ. (คำสั่งขาย)
            // บันทึกรับเงินจากบลจ. (คำสั่งขาย)
            // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Investment" > "บันทึกรับเงินจากบลจ. (คำสั่งขาย) V2"
            await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Investment', 'บันทึกรับเงินจากบลจ. (คำสั่งขาย) V2');
            // รอหน้าโหลดเสร็จ
            await page.waitForLoadState('networkidle');
            await expect(page.locator('a[role="tab"]').getByText('รายการรอรับชำระเงินจาก บลจ.'), { exact: true }).toBeVisible({ timeout: 60000 });
            // รอข้อมูลโหลดเสร็จ
            await page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
            await expect(page.locator('div[class="busy-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'กำลังค้นหาข้อมูล...' })).not.toBeVisible({ timeout: 60000 });

            // คำสั่งเช็คข้อมูลในตาราง TIVREQ01 และ TIVINV01 ว่ามีการสร้างรายการคำสั่งซื้อขายหรือไม่
            const query_check_fundredemptionreceipt = "SELECT distinct tivinv01.invovc,TIVREQ01.ordrdt,TIVREQ01.fundnm from TIVREQ01,tivinv01 where TIVREQ01.invoid = tivinv01.invoid and TIVREQ01.polnvc in ($1) and TIVREQ01.ordrdt = $2 and TIVINV01.iostvc = 'IO05'"
            const result_check_fundredemptionreceipt = await db.query(query_check_fundredemptionreceipt, [order_all_policy_sell_investment.polnvc, order_all_policy_sell_investment.ordrdt]);

            if (result_check_fundredemptionreceipt.rows.length > 0) {
                // loop ตามจำนวนคำสั่งซื้อขายที่เจอใน database
                for (const row_fundredemptionreceipt of result_check_fundredemptionreceipt.rows) {
                    const fund_name_fundredemptionreceipt = fund_code_dictionary[row_fundredemptionreceipt.fundnm] || 'Unknown Fund';
                    console.log(`\nบันทึกรับเงินจากบลจ. เลขที่อ้างอิง: ${row_fundredemptionreceipt.invovc}, วันที่สั่งซื้อขาย: ${row_fundredemptionreceipt.ordrdt}, กองทุน: ${fund_name_fundredemptionreceipt.code}`);

                    // ยืนยัน บันทึกรับเงินจากบลจ. (คำสั่งขาย) ตามเลขที่อ้างอิง จาก database
                    await page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
                    await fundRedemptionReceipt.clickFundRedemptionReceiptConfirmButton({ invoiceno: row_fundredemptionreceipt.invovc, date: row_fundredemptionreceipt.ordrdt });
                }
            }

        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Update RV
        // Update RV if policy year >= 5
        if (policy_year >= 5) {
            if (business_date_policy === mvy_date_policy) {
                // ตรวจสอบว่ามีการทำ update RV หรือยัง
                const query_check_update_rv = "SELECT trstdt,rvbdid,mnrvbd,tprvbd,torvbd,smrvbd FROM TIVSRV01 where polnvc in ($1) ORDER BY rvbdid DESC limit 1;";
                const result_check_update_rv = await db.query(query_check_update_rv, [policyno_investment_order_update_rv.polnvc]);

                // if (result_check_update_rv.rows[0].mnrvbd !== '0.0000' && result_check_update_rv.rows[0].tprvbd !== '0.0000' && result_check_update_rv.rows[0].torvbd !== '0.0000' && result_check_update_rv.rows[0].smrvbd !== '0.0000') {

                if (result_check_update_rv.rows.length === 0) {
                    console.log('\มีคำสั่งขายคงค้างอยู่ ข้าม step รัน Update RV');
                } else {
                    // ตัด field tprvbd ออก เพราะบางกรณีอาจจะไม่มีค่า
                    if (result_check_update_rv.rows[0].mnrvbd !== '0.0000' && result_check_update_rv.rows[0].torvbd !== '0.0000' && result_check_update_rv.rows[0].smrvbd !== '0.0000') {
                        console.log('\nยังไม่มีการทำ Update RV มาก่อน');
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

                        console.log("\nทำการรันอัพเดท RV เนื่องจาก ปีกรมธรรม์ >= 5");

                        // ไปยังเมนู "ระบบงานให้บริการ" > "ระบบ Unit Linked" > "Policy Service" > "Batch Manual Support"
                        await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'Policy Service', 'Batch Manual Support');
                        // รอหน้าโหลดเสร็จ
                        await page.waitForLoadState('networkidle');
                        await expect(page.locator('div[class="layout-m-hd"]'), { hasText: 'Batch Manual Support' }).toBeVisible({ timeout: 60000 });

                        // รัน batch สร้าง RV UL
                        await batchManualSupportPage.runBatchINV({ batch: 'UpdateRV', policyno: policyno_investment_order_update_rv.polnvc, date: result_check_update_rv.rows[0].trstdt });

                        // เช็คว่ามีการอัพเดท RV สำเร็จหรือไม่
                        const result_check_update_rv_after = await db.query(query_check_update_rv, [policyno_investment_order_update_rv.polnvc]);
                        if (result_check_update_rv_after.rows[0].mnrvbd === '0.0000' && result_check_update_rv_after.rows[0].torvbd === '0.0000' && result_check_update_rv_after.rows[0].smrvbd === '0.0000') {
                            // // แสดง error
                            // throw new Error('อัพเดท RV ไม่สำเร็จ');
                        } else {
                            console.log('\nอัพเดท RV สำเร็จ');
                        }
                    }
                }
            }
        }
    }

    console.log("\nทำงาน Daily Buy-Sell Investment Order เสร็จสิ้น");
    console.log("\n-------------------------------------------- End of Process -------------------------------------------\n");

    db.close();

    // await page.pause();
});