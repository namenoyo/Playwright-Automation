const { test, expect } = require('@playwright/test');
const { chunkRange } = require('../../utils/common');
const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');
const { LoginPageSPLife } = require('../../pages/login_t.page');
const { mainSPLife } = require('../../pages/SP_Life/main_splife');
const { quotationSPLife } = require('../../pages/SP_Life/quotation_splife');
const { LogoutPage } = require('../../pages/logout.page');
const { popupAlert, getMaxWorkers } = require('../../utils/common');
const { sendresultn8nbot } = require('../../utils/common');
const { applicationformSPLife } = require('../../pages/SP_Life/applicationform_splife');

const MAX_POSSIBLE_WORKERS = getMaxWorkers();

test.describe.configure({ mode: 'parallel' }); // ให้เคสในไฟล์นี้รันขนานได้

let db;
let array_result_query;

// config query และ database
test.beforeAll(async () => {
    const db_name = 'splife';
    const db_env = 'SIT';

    db = new Database({
        user: configdb[db_name][db_env].DB_USER,
        host: configdb[db_name][db_env].DB_HOST,
        database: configdb[db_name][db_env].DB_NAME,
        password: configdb[db_name][db_env].DB_PASSWORD,
        port: configdb[db_name][db_env].DB_PORT,
    });

    const suminsure = 1599999;
    const planid = 2;

    const query = "select case csp.plan_group when 'MRTA' then 'B51' when 'MLTA' then 'D61' end || csppr.insure_sex || csppr.insure_age || $1::int || csppr.cover_period  AS row_unique, csp.plan_group , csp.plan_name, case csppr.insure_sex when 1 then 'ชาย' when 2 then 'หญิง' end as sex_name, csppr.insure_age, csppr.cover_period, csppr.total_premium_rate, csppr.life_premium_rate, csppr.rider_premium_rate, to_char( ((now() AT TIME ZONE 'Asia/Bangkok')::date - make_interval(years => insure_age))::date, 'DD/MM/' ) || (extract(year from ((now() AT TIME ZONE 'Asia/Bangkok')::date - make_interval(years => insure_age)))::int + 543)::text AS birthdate, case csppr.insure_sex when 1 then 'นาย' when 2 then 'นาง' end as title, 'เทส' as name, 'นามสกุล' as lastname, '1445533518848' as idcard, $1::int as sumInsure, TO_CHAR(ROUND(((csppr.total_premium_rate * $1::int)/1000)::numeric,0), 'FM9,999,999,990.00') as Expected from cf_sp_plan_premium_rate csppr join cf_sp_plan csp on csppr.cf_sp_plan_id = csp.id where cf_sp_plan_id = $2 and insure_age >= (select min_insure_age from cf_sp_plan_detail cspd where cf_sp_plan_id = $2 limit 1) and insure_age <= (select max(max_insure_age) from cf_sp_plan_detail cspd2 where cf_sp_plan_id = $2) and insure_age + cover_period <= (select max(cover_period+max_insure_age) from cf_sp_plan_detail cspd2 where cf_sp_plan_id = $2) order by csppr.insure_sex ,csppr.insure_age, csppr.cover_period";
    const params = [suminsure, planid];

    const result_query = await db.query(query, params);
    array_result_query = result_query.rows;
});

test.afterAll(async () => {
    await db.close();
});

for (let chunkIndex = 0; chunkIndex < MAX_POSSIBLE_WORKERS; chunkIndex++) {
    test(`worker ${chunkIndex + 1}`, async ({ page }, testInfo) => {

        // แปลงเป็นเวลาประเทศไทย
        const options = {
            timeZone: 'Asia/Bangkok',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const startdate = new Date();
        // ใช้ Intl.DateTimeFormat แล้วแปลงให้เป็นรูปแบบที่ต้องการ
        const startformatter = new Intl.DateTimeFormat('th-TH', options);
        const startparts = startformatter.formatToParts(startdate);
        // แปลง parts ให้เป็น string แบบ dd/mm/yyyy hh:mm:ss
        const startdateformat = `${startparts.find(p => p.type === 'day')?.value}/${startparts.find(p => p.type === 'month')?.value}/${startparts.find(p => p.type === 'year')?.value} ${startparts.find(p => p.type === 'hour')?.value}:${startparts.find(p => p.type === 'minute')?.value}:${startparts.find(p => p.type === 'second')?.value}`;

        const testcase = 'เช็คเบี้ยประกัน ของ โครงการ SP Life';

        const configured = testInfo.config.workers;
        const workers =
            typeof configured === 'number' ? configured : 1; // เผื่อกรณีตั้งแบบเปอร์เซ็นต์

        // ถ้า chunkIndex เกินจำนวน workers จริง ให้ข้ามเคสนี้
        test.skip(chunkIndex >= workers, `Only ${workers} workers are active`);

        // ดึงข้อมูลจาก DB
        const rows = array_result_query; // ได้ array กลับมาแล้ว

        const { start, end } = chunkRange(chunkIndex, workers, rows.length);
        const mySlice = rows.slice(start, end);

        // กำหนดเวลา timeout สำหรับ test case นี้เป็น 24 ชั่วโมง
        test.setTimeout(86400000);

        // console.log(start, end);
        // console.log(mySlice);

        const startTime = Date.now();  // เริ่มจับเวลา

        const googlesheet = new GoogleSheet();
        const loginpagesplife = new LoginPageSPLife(page);
        const mainsplife = new mainSPLife(page, expect);
        const quotationsplife = new quotationSPLife(page, expect);
        const logout = new LogoutPage(page, expect);
        const popupalert = new popupAlert(page);

        // เริ่มต้น Auth
        const auth = await googlesheet.initAuth();
        // ส่ง spreadsheetId และ range มาจากไฟล์ test (สำหรับ Read และ Update)
        const spreadsheetId = '1fWFSP2pmzV1QBVxoYbyxzb4XDQbcWflB7gLdW94jARY';
        // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
        const spreadsheetId_write = '1sr4Rh_V67SK_eRJriqT5j4X03lzulifCfqE7Q5BV_wk';
        const range_write = `Log_Raw!A:E`;

        // อ่านข้อมูลสำหรับการเข้าสู่ระบบ
        const datalogin = await googlesheet.fetchSheetData(auth, spreadsheetId, 'Prepare_TestData_Playwright!B1:B2');

        // สร้าง array สำหรับเก็บผลลัพธ์
        let combined_result_array = [];

        let status_result = [];

        for (const row of mySlice) {
            // for (let i = 0; i < mySlice.length; i++) {
            let retryCount = 0;
            const maxRetries = 3;
            const timeout = 60000;

            const rowdata = row.row_unique; // ข้อมูลแถวปัจจุบัน
            const insurancegroup = row.plan_group; // กลุ่มแบบประกัน
            const insurancename = row.plan_name; // ชื่อแบบประกัน
            const unisex = row.sex_name; // เพศ
            const age = row.insure_age; // อายุ
            const idcard = row.idcard; // เลขบัตรประชาชน
            const titlename = row.title; // คำนำหน้า
            const name = row.name; // ชื่อผู้เอาประกันภัย
            const surname = row.lastname; // นามสกุลผู้เอาประกันภัย
            const birthdate = row.birthdate; // วันเกิดผู้เอาประกันภัย
            const insurancesum = row.suminsure; // จำนวนเงินทุนประกันภัย
            const coverageYear = row.cover_period; // ระยะเวลาคุ้มครอง
            const expectedinsurancesum = row.expected; // ค่าที่คาดหวังสำหรับจำนวนเงินเอาประกันภัย

            const today = new Date();
            // เพิ่ม 1 ปีจากวันนี้
            const expireDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
            // แปลงเป็นวัน/เดือน/ปี (พ.ศ.)
            const day = String(expireDate.getDate()).padStart(2, '0');
            const month = String(expireDate.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
            const year = expireDate.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
            const formattedExpireDate = `${day}/${month}/${year}`;

            const mobileno = '0987654321'; // เบอร์โทรศัพท์

            function getBangkokTimestamp() {
                const now = new Date();
                const bangkokTime = now.toLocaleString("sv-SE", {
                    timeZone: "Asia/Bangkok",
                    hour12: false
                });

                return bangkokTime;
            }

            while (retryCount < maxRetries) {
                try {
                    await Promise.race([

                        (async () => {
                            // for (const row of mySlice) {
                            // เริ่มการทดสอบ
                            console.log(`▶️  เริ่มการทดสอบ row_unique : ${row.row_unique}`);

                            // Navigate to the website
                            await loginpagesplife.gotoSPLife();
                            // กรอก username และ password
                            await loginpagesplife.login(datalogin[0][0], datalogin[1][0]);
                            // Wait for the page to load completely
                            await page.waitForLoadState('networkidle');

                            // รอให้ pop-up แจ้งเตือนปรากฏ
                            await popupalert.popupAlertMessage();

                            // กดปุ่ม สร้างใบเสนอราคา
                            await mainsplife.clickcreateQuotation();

                            // รอหน้า "สร้างใบเสนอราคา" โหลด
                            await quotationsplife.waitforquotationPageLoad();

                            // เลือกแบบประกันตามข้อมูลในแถว
                            const quotationspliferesult = await quotationsplife.selectInsurancePlan(insurancename);

                            // กรอกข้อมูลผู้เอาประกันภัย
                            const insuredInformationresult = await quotationsplife.insuredInformation(idcard, titlename, name, surname, birthdate, formattedExpireDate, mobileno);

                            // คำนวณเบี้ยประกันภัยและวิธีการชำระเบี้ย
                            const quotation_result = await quotationsplife.calculatepremiumandpaymentmode(String(insurancesum), String(coverageYear), expectedinsurancesum, rowdata); // กรอกจำนวนเงินเอาประกันภัย และระยะเวลาคุ้มครอง

                            // บันทึกผลการทดสอบ
                            status_result.push(quotation_result.checkvalue.status_result);

                            // ใส่ | คั่นระหว่างข้อมูลย่อย
                            let result_format_array_quotationspliferesult = quotationspliferesult.popuparray
                                .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                                .join(' | ');

                            let result_format_array_insuredInformationresult = insuredInformationresult.popuparray
                                .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                                .join(' | ');

                            let result_format_array_quotation_result = quotation_result.popuparray
                                .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                                .join(' | ');

                            // ใส่ | คั่นระหว่างข้อมูลหลัก
                            const values = [result_format_array_quotationspliferesult, result_format_array_insuredInformationresult, result_format_array_quotation_result].filter(v => v && v.trim() !== '');
                            const combined_final_result_popup = values.join(' | ');

                            // เอา assertion result และ status มาเก็บใน array
                            combined_result_array.push([rowdata, quotation_result.checkvalue.status_result, `${quotation_result.checkvalue.assertion_result} | ประเภท : ${insurancegroup} | ชื่อแบบประกัน : ${insurancename} | เพศ : ${unisex} | อายุ : ${age} | ทุน : ${insurancesum} | coverage : ${coverageYear} |`, getBangkokTimestamp(), `${combined_final_result_popup}`]);

                            const endTime = Date.now();    // จบจับเวลา
                            const duration = (endTime - startTime) / 1000; // วินาที
                            console.log(`Test case รันไปทั้งหมด ${duration} วินาที`);

                            await logout.logoutSPLife(); // ออกจากระบบ

                            // จบการทดสอบ
                            console.log(`🏁  จบการทดสอบ row_unique : ${row.row_unique}\n`);
                            // }
                        })(),

                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('⏰ Loop timeout (60s)')), timeout)
                        )
                    ]);

                    break; // สำเร็จแล้ว → ออกจาก while retry

                } catch (err) {
                    retryCount++;
                    console.warn(`❌ การทดสอบ row_unique ${rowdata} ล้มเหลวในครั้งที่ ${retryCount} : ${err.message}`);

                    if (retryCount >= maxRetries) {
                        console.error(`🛑 การทดสอบล้มเหลวเกินกำหนดใน row_unique ${rowdata}, ข้ามไปยังชุดถัดไป\n`);
                        await page.waitForTimeout(150); // รอ 150 ms
                        await page.screenshot({ path: `screenshots/SPLife/row_unique-${rowdata}_error.png`, fullPage: true });

                        // บันทึกผลการทดสอบ
                        status_result.push('Error');

                        // เอา assertion result และ status มาเก็บใน array
                        combined_result_array.push([rowdata, 'Error Test', `⛔ Error : Expected = ${expectedinsurancesum} : Actual = 0.00 | ประเภท : ${insurancegroup} | ชื่อแบบประกัน : ${insurancename} | เพศ : ${unisex} | อายุ : ${age} | ทุน : ${insurancesum} | coverage : ${coverageYear} |`, getBangkokTimestamp(), `เกิดข้อผิดพลาดในการทดสอบ row_unique ${rowdata} : ${err.message}`]);

                    } else {
                        console.log(`🔄 กำลังเริ่มทดสอบ row_unique ${rowdata} รอบที่ ${retryCount + 1}`);
                    }
                }
            }
        }

        // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
        await googlesheet.appendRows(auth, spreadsheetId_write, range_write, combined_result_array);

        // สรุปผลการทดสอบ
        const passCount = status_result.filter(item => item === 'Passed').length;
        const failCount = status_result.filter(item => item === 'Failed').length;
        const errorCount = status_result.filter(item => item === 'Error').length;

        const finishdate = new Date();
        // ใช้ Intl.DateTimeFormat แล้วแปลงให้เป็นรูปแบบที่ต้องการ
        const finishformatter = new Intl.DateTimeFormat('th-TH', options);
        const finishparts = finishformatter.formatToParts(finishdate);

        // แปลง parts ให้เป็น string แบบ dd/mm/yyyy hh:mm:ss
        const finishdateformat = `${finishparts.find(p => p.type === 'day')?.value}/${finishparts.find(p => p.type === 'month')?.value}/${finishparts.find(p => p.type === 'year')?.value} ${finishparts.find(p => p.type === 'hour')?.value}:${finishparts.find(p => p.type === 'minute')?.value}:${finishparts.find(p => p.type === 'second')?.value}`;

        // ส่งผลลัพธ์ไปยัง n8n
        await sendresultn8nbot(testcase, mySlice[0].plan_group, mySlice[0].suminsure, mySlice.length, passCount, failCount, startdateformat, finishdateformat, `${chunkIndex + 1}`, errorCount, MAX_POSSIBLE_WORKERS);

    })

    test.only(`สร้างใบคำขอ SP Life - worker ${chunkIndex + 1}`, async ({ page }, testInfo) => {

        const googlesheet = new GoogleSheet();
        // เริ่มต้น Auth
        const auth = await googlesheet.initAuth();
        // ส่ง spreadsheetId และ range มาจากไฟล์ test (สำหรับ Read และ Update)
        const spreadsheetId = '1sr4Rh_V67SK_eRJriqT5j4X03lzulifCfqE7Q5BV_wk';
        const range_read = 'Prepare_TestData_Playwright_Create!A5:N6';

        // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
        const spreadsheetId_write = '1sr4Rh_V67SK_eRJriqT5j4X03lzulifCfqE7Q5BV_wk';
        const range_write = `Log_Raw!A:E`;

        // แปลงเป็นเวลาประเทศไทย
        const options = {
            timeZone: 'Asia/Bangkok',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const startdate = new Date();
        // ใช้ Intl.DateTimeFormat แล้วแปลงให้เป็นรูปแบบที่ต้องการ
        const startformatter = new Intl.DateTimeFormat('th-TH', options);
        const startparts = startformatter.formatToParts(startdate);
        // แปลง parts ให้เป็น string แบบ dd/mm/yyyy hh:mm:ss
        const startdateformat = `${startparts.find(p => p.type === 'day')?.value}/${startparts.find(p => p.type === 'month')?.value}/${startparts.find(p => p.type === 'year')?.value} ${startparts.find(p => p.type === 'hour')?.value}:${startparts.find(p => p.type === 'minute')?.value}:${startparts.find(p => p.type === 'second')?.value}`;

        const testcase = 'สร้างใบคำขอ SP Life';

        const configured = testInfo.config.workers;
        const workers =
            typeof configured === 'number' ? configured : 1; // เผื่อกรณีตั้งแบบเปอร์เซ็นต์

        // ถ้า chunkIndex เกินจำนวน workers จริง ให้ข้ามเคสนี้
        test.skip(chunkIndex >= workers, `Only ${workers} workers are active`);

        // อ่านข้อมูลสำหรับ test data
        const data = await googlesheet.fetchSheetData_key(auth, spreadsheetId, range_read);

        const { start, end } = chunkRange(chunkIndex, workers, data.length);
        const mySlice = data.slice(start, end);

        // กำหนดเวลา timeout สำหรับ test case นี้เป็น 24 ชั่วโมง
        test.setTimeout(86400000);

        // console.log(start, end);
        // console.log(mySlice);

        const startTime = Date.now();  // เริ่มจับเวลา

        const loginpagesplife = new LoginPageSPLife(page);
        const mainsplife = new mainSPLife(page, expect);
        const quotationsplife = new quotationSPLife(page, expect);
        const logout = new LogoutPage(page, expect);
        const popupalert = new popupAlert(page);
        const applicationform = new applicationformSPLife(page, expect);

        // อ่านข้อมูลสำหรับการเข้าสู่ระบบ
        const datalogin = await googlesheet.fetchSheetData(auth, spreadsheetId, 'Prepare_TestData_Playwright_Create!B1:B2');

        // สร้าง array สำหรับเก็บผลลัพธ์
        let data_create = [];

        for (const row of mySlice) {
            let retryCount = 0;
            const maxRetries = 3;
            const timeout = 60000;

            const rowdata = row.Row; // ข้อมูลแถวปัจจุบัน
            const insurancegroup = row.plan_group; // กลุ่มแบบประกัน
            const insurancename = row.plan_name; // ชื่อแบบประกัน
            const unisex = row.insure_sex_name; // เพศ
            const age = row.insure_age; // อายุ
            const idcard = row.id_card; // เลขบัตรประชาชน
            const titlename = row.title; // คำนำหน้า
            const name = row.name; // ชื่อผู้เอาประกันภัย
            const surname = row.lastname; // นามสกุลผู้เอาประกันภัย
            const birthdate = row.birth_date; // วันเกิดผู้เอาประกันภัย
            const insurancesum = row.insuresum; // จำนวนเงินทุนประกันภัย
            const coverageYear = row.cover_period; // ระยะเวลาคุ้มครอง
            const paypremium = row.pay_premium; // วิธีการชำระเบี้ย
            const statuspeople = row.status_people; // สถานะผู้เอาประกันภัย

            const today = new Date();
            // เพิ่ม 1 ปีจากวันนี้
            const expireDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
            // แปลงเป็นวัน/เดือน/ปี (พ.ศ.)
            const day = String(expireDate.getDate()).padStart(2, '0');
            const month = String(expireDate.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
            const year = expireDate.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
            const formattedExpireDate = `${day}/${month}/${year}`;

            const mobileno = '0987654321'; // เบอร์โทรศัพท์

            // function getBangkokTimestamp() {
            //     const now = new Date();
            //     const bangkokTime = now.toLocaleString("sv-SE", {
            //         timeZone: "Asia/Bangkok",
            //         hour12: false
            //     });

            //     return bangkokTime;
            // }

            while (retryCount < maxRetries) {
                try {
                    await Promise.race([
                        (async () => {
                            // เริ่มการทดสอบ
                            console.log(`▶️  เริ่มทำ ใบคำขอ row : ${row.Row}`);

                            // Navigate to the website
                            await loginpagesplife.gotoSPLife();
                            // กรอก username และ password
                            await loginpagesplife.login(datalogin[0][0], datalogin[1][0]);
                            // Wait for the page to load completely
                            await page.waitForLoadState('networkidle');

                            // รอให้ pop-up แจ้งเตือนปรากฏ
                            await popupalert.popupAlertMessage();

                            // กดปุ่ม สร้างใบเสนอราคา
                            await mainsplife.clickcreateQuotation();

                            // รอหน้า "สร้างใบเสนอราคา" โหลด
                            await quotationsplife.waitforquotationPageLoad();

                            // เลือกแบบประกันตามข้อมูลในแถว
                            const quotationspliferesult = await quotationsplife.selectInsurancePlan(insurancename);
                            // ใส่ | คั่นระหว่างข้อมูลย่อย
                            let result_format_array_quotationspliferesult = quotationspliferesult.popuparray
                                .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                                .join(' | ');

                            // กรอกข้อมูลผู้เอาประกันภัย
                            const insuredInformationresult = await quotationsplife.insuredInformation(idcard, titlename, name, surname, birthdate, formattedExpireDate, mobileno);
                            let result_format_array_insuredInformationresult = insuredInformationresult.popuparray
                                .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                                .join(' | ');

                            // คำนวณเบี้ยประกันภัยและวิธีการชำระเบี้ย
                            const premiumpaymentmoderesult = await quotationsplife.premiumandpaymentmode(String(insurancesum), String(coverageYear)); // กรอกจำนวนเงินเอาประกันภัย และระยะเวลาคุ้มครอง
                            let result_format_array_premium_payment_mode_result = premiumpaymentmoderesult.popuparray
                                .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                                .join(' | ');

                            // วิธีการชำระเบี้ย
                            const paypremiumresult = await quotationsplife.paypremium(paypremium);
                            let result_format_array_pay_premium_result = paypremiumresult.popuparray
                                .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                                .join(' | ');

                            // ยืนยันการสร้างใบเสนอราคา
                            await quotationsplife.confirmsavequotation();

                            // กรอกข้อมูลหน้าในคำขอ
                            await applicationform.insuredinformation(statuspeople);
                            // กรอกข้อมูลที่อยู่
                            await applicationform.homeaddress();
                            // กรอกข้อมูลที่อยู่ปัจจุบัน
                            await applicationform.currentaddress();

                            await page.locator('#currentUseAddressTypeCode').click();
                            await page.locator('#currentUseAddressTypeCode').click();

                            // ยืนยันการสร้างคำขอ
                            await applicationform.confirmsaveapplicationform();
                            // รอให้ pop-up หมายเลขอ้างอิงใบคำขอปรากฏ
                            const refno = await applicationform.getrefnoapplicationform();

                            console.log(`หมายเลขอ้างอิงใบคำขอ: ${refno}`);

                            // ใส่ | คั่นระหว่างข้อมูลหลัก
                            const values = [result_format_array_quotationspliferesult, result_format_array_insuredInformationresult, result_format_array_premium_payment_mode_result, result_format_array_pay_premium_result].filter(v => v && v.trim() !== '');
                            const combined_final_result_popup = values.join(' | ');

                            const endTime = Date.now();    // จบจับเวลา
                            const duration = (endTime - startTime) / 1000; // วินาที
                            console.log(`Test case รันไปทั้งหมด ${duration} วินาที`);

                            // await logout.logoutSPLife(); // ออกจากระบบ

                        })(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('⏰ Loop timeout (60s)')), timeout)
                        )
                    ])

                    break; // สำเร็จแล้ว → ออกจาก while retry

                } catch (err) {

                    retryCount++;
                    console.warn(`❌ การทดสอบ row ${rowdata} ล้มเหลวในครั้งที่ ${retryCount} : ${err.message}`);

                    if (retryCount >= maxRetries) {
                        console.error(`🛑 การทดสอบล้มเหลวเกินกำหนดใน row ${rowdata}, ข้ามไปยังชุดถัดไป\n`);
                        await page.screenshot({ path: `screenshots/SPLife/row-${rowdata}.png`, fullPage: true });

                        // // บันทึกผลการทดสอบ
                        // status_result.push('Error');

                        // // เอา assertion result และ status มาเก็บใน array
                        // combined_result_array.push([rowdata, 'Error Test', `⛔ Error : Expected = ${expectedinsurancesum} : Actual = 0.00 | ประเภท : ${insurancegroup} | ชื่อแบบประกัน : ${insurancename} | เพศ : ${unisex} | อายุ : ${age} | ทุน : ${insurancesum} | coverage : ${coverageYear} |`, getBangkokTimestamp(), `เกิดข้อผิดพลาดในการทดสอบ row_unique ${rowdata} : ${err.message}`]);

                    } else {
                        console.log(`🔄 กำลังเริ่มทดสอบ row ${rowdata} รอบที่ ${retryCount + 1}`);
                    }

                }
            }
        }



    })
}