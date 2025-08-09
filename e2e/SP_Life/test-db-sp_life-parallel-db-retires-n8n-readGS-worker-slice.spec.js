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

const MAX_POSSIBLE_WORKERS = getMaxWorkers();

test.describe.configure({ mode: 'parallel' }); // ให้เคสในไฟล์นี้รันขนานได้

let db;
let array_result_query;

// config query และ database
test.beforeAll(async () => {

    // อ่านข้อมูลจาก data.json แทนการ query DB
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.resolve(__dirname, '../../data/n8n_data_google_sheet/data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    array_result_query = JSON.parse(rawData);
    
});

//     const db_name = 'splife';
//     const db_env = 'SIT';

//     db = new Database({
//         user: configdb[db_name][db_env].DB_USER,
//         host: configdb[db_name][db_env].DB_HOST,
//         database: configdb[db_name][db_env].DB_NAME,
//         password: configdb[db_name][db_env].DB_PASSWORD,
//         port: configdb[db_name][db_env].DB_PORT,
//     });

//     const suminsure = 50000;
//     const planid = 2;

//     const query = "select case csp.plan_group when 'MRTA' then 'B51' when 'MLTA' then 'D61' end || csppr.insure_sex || csppr.insure_age || $1::int || csppr.cover_period  AS row_unique, csp.plan_group , csp.plan_name, case csppr.insure_sex when 1 then 'ชาย' when 2 then 'หญิง' end as sex_name, csppr.insure_age, csppr.cover_period, csppr.total_premium_rate, csppr.life_premium_rate, csppr.rider_premium_rate, to_char( ((now() AT TIME ZONE 'Asia/Bangkok')::date - make_interval(years => insure_age))::date, 'DD/MM/' ) || (extract(year from ((now() AT TIME ZONE 'Asia/Bangkok')::date - make_interval(years => insure_age)))::int + 543)::text AS birthdate, case csppr.insure_sex when 1 then 'นาย' when 2 then 'นาง' end as title, 'เทส' as name, 'นามสกุล' as lastname, '1445533518848' as idcard, $1::int as sumInsure, TO_CHAR(ROUND(((csppr.total_premium_rate * $1::int)/1000)::numeric,0), 'FM9,999,999,990.00') as Expected from cf_sp_plan_premium_rate csppr join cf_sp_plan csp on csppr.cf_sp_plan_id = csp.id where cf_sp_plan_id = $2 and insure_age >= (select min_insure_age from cf_sp_plan_detail cspd where cf_sp_plan_id = $2 limit 1) and insure_age <= (select max(max_insure_age) from cf_sp_plan_detail cspd2 where cf_sp_plan_id = $2) and insure_age + cover_period <= (select max(cover_period+max_insure_age) from cf_sp_plan_detail cspd2 where cf_sp_plan_id = $2) order by csppr.insure_sex ,csppr.insure_age, csppr.cover_period";
//     const params = [suminsure, planid];

//     const result_query = await db.query(query, params);
//     array_result_query = result_query.rows;
// });

// test.afterAll(async () => {
//     await db.close();
// });


for (let i = 0; i < 3; i++) {
    test.describe(`SP Life parallel worker slice ${i + 1}`, () => {
        test(`worker slice ${i + 1}`, async ({ page }, testInfo) => {
            // ...existing code...
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
        const startformatter = new Intl.DateTimeFormat('th-TH', options);
        const startparts = startformatter.formatToParts(startdate);
        const startdateformat = `${startparts.find(p => p.type === 'day')?.value}/${startparts.find(p => p.type === 'month')?.value}/${startparts.find(p => p.type === 'year')?.value} ${startparts.find(p => p.type === 'hour')?.value}:${startparts.find(p => p.type === 'minute')?.value}:${startparts.find(p => p.type === 'second')?.value}`;
        const testcase = 'เช็คเบี้ยประกัน ของ โครงการ SP Life';
        const rows = array_result_query;
        const { start, end } = chunkRange(i, 3, rows.length);
        const mySlice = rows.slice(start, end);
        test.setTimeout(86400000);
        const startTime = Date.now();
    // ใช้ temp dir แยกแต่ละ worker
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        // ใช้ temp dir และ credential file แยกแต่ละ worker
        const workerId = `${i + 1}_${process.pid}`;
        const tempDir = path.join(os.tmpdir(), `splife_worker_${workerId}`);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        // ใช้ GoogleSheet instance และ credential file แยกแต่ละ worker
        const credentialFile = path.resolve(__dirname, `../../credentials/client_secret_worker_${workerId}.json`);
        // ถ้าไม่มี credential file เฉพาะ worker ให้ copy มาจากไฟล์หลัก
        const mainCredential = path.resolve(__dirname, '../../credentials/client_secret_478587092772-4bkr7ctr9gki3f8uq7p7r1lh9emorkh7.apps.googleusercontent.com.json');
        if (!fs.existsSync(credentialFile)) {
            fs.copyFileSync(mainCredential, credentialFile);
        }
        const googlesheet = new GoogleSheet({ tempDir, credentialFile });
        const loginpagesplife = new LoginPageSPLife(page);
        const mainsplife = new mainSPLife(page, expect);
        const quotationsplife = new quotationSPLife(page, expect);
        const logout = new LogoutPage(page, expect);
        const popupalert = new popupAlert(page);
    // เพิ่ม delay เพื่อ queue Google API
    await new Promise(res => setTimeout(res, i * 2000));
    const auth = await googlesheet.initAuth();
        const spreadsheetId = '1fWFSP2pmzV1QBVxoYbyxzb4XDQbcWflB7gLdW94jARY';
        const spreadsheetId_write = '1sr4Rh_V67SK_eRJriqT5j4X03lzulifCfqE7Q5BV_wk';
        const range_write = `Log_Raw!A:E`;
        const datalogin = await googlesheet.fetchSheetData(auth, spreadsheetId, 'Prepare_TestData_Playwright!B1:B2');
        let combined_result_array = [];
        let status_result = [];
                // Resume logic: อ่าน row ล่าสุดที่สำเร็จจากไฟล์ resume
                const resumeFile = path.join(tempDir, 'resume.txt');
                let lastCompletedRow = null;
                if (fs.existsSync(resumeFile)) {
                    try {
                        lastCompletedRow = fs.readFileSync(resumeFile, 'utf8').trim();
                    } catch (e) { lastCompletedRow = null; }
                }
                let resumeFound = !lastCompletedRow;
                for (const row of mySlice) {
                        // ถ้ายังไม่ถึง row ล่าสุดที่สำเร็จ ให้ข้าม
                        if (!resumeFound && lastCompletedRow && row.row_unique !== lastCompletedRow) {
                            continue;
                        }
                        // เจอ row ล่าสุดที่สำเร็จแล้ว ให้เริ่มทำงานต่อ
                        if (!resumeFound && lastCompletedRow && row.row_unique === lastCompletedRow) {
                            resumeFound = true;
                            continue; // ข้าม row ที่สำเร็จล่าสุด
                        }
                        // log uncaught error ในแต่ละ row
                        let retryCount = 0;
                        const maxRetries = 3;
                        const timeout = 60000;
            const rowdata = row.row_unique;
            const insurancegroup = row.plan_group;
            const insurancename = row.plan_name;
            const unisex = row.sex_name;
            const age = row.insure_age;
            const idcard = row.idcard;
            const titlename = row.title;
            const name = row.name;
            const surname = row.lastname;
            const birthdate = row.birthdate;
            const insurancesum = row.suminsure;
            const coverageYear = row.cover_period;
            const expectedinsurancesum = row.expected;
            const today = new Date();
            const expireDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
            const day = String(expireDate.getDate()).padStart(2, '0');
            const month = String(expireDate.getMonth() + 1).padStart(2, '0');
            const year = expireDate.getFullYear() + 543;
            const formattedExpireDate = `${day}/${month}/${year}`;
            const mobileno = '0987654321';
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
                            console.log(`▶️  เริ่มการทดสอบ row_unique : ${row.row_unique}`);
                            await loginpagesplife.gotoSPLife();
                            await loginpagesplife.login(datalogin[0][0], datalogin[1][0]);
                            await page.waitForLoadState('networkidle');
                            await popupalert.popupAlertMessage();
                            await mainsplife.clickcreateQuotation();
                            await quotationsplife.waitforquotationPageLoad();
                            const quotationspliferesult = await quotationsplife.selectInsurancePlan(insurancename);
                            const insuredInformationresult = await quotationsplife.insuredInformation(idcard, titlename, name, surname, birthdate, formattedExpireDate, mobileno);
                            const quotation_result = await quotationsplife.calculatepremiumandpaymentmode(String(insurancesum), String(coverageYear), expectedinsurancesum);
                            status_result.push(quotation_result.checkvalue.status_result);
                            let result_format_array_quotationspliferesult = quotationspliferesult.popuparray.filter(item => item).join(' | ');
                            let result_format_array_insuredInformationresult = insuredInformationresult.popuparray.filter(item => item).join(' | ');
                            let result_format_array_quotation_result = quotation_result.popuparray.filter(item => item).join(' | ');
                            const values = [result_format_array_quotationspliferesult, result_format_array_insuredInformationresult, result_format_array_quotation_result].filter(v => v && v.trim() !== '');
                            const combined_final_result_popup = values.join(' | ');
                            combined_result_array.push([rowdata, quotation_result.checkvalue.status_result, `${quotation_result.checkvalue.assertion_result} | ประเภท : ${insurancegroup} | ชื่อแบบประกัน : ${insurancename} | เพศ : ${unisex} | อายุ : ${age} | ทุน : ${insurancesum} | coverage : ${coverageYear} |`, getBangkokTimestamp(), `${combined_final_result_popup}`]);
                            const endTime = Date.now();
                            const duration = (endTime - startTime) / 1000;
                            console.log(`Test case รันไปทั้งหมด ${duration} วินาที`);
                                                        await logout.logoutSPLife();
                                                        // update resume file หลังสำเร็จ
                                                        try {
                                                            fs.writeFileSync(resumeFile, row.row_unique + '\n', { flag: 'w' });
                                                        } catch (e) {}
                                                        console.log(`🏁  จบการทดสอบ row_unique : ${row.row_unique}\n`);
                        })(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('⏰ Loop timeout (40s)')), timeout))
                    ]);
                    break;
                } catch (err) {
                    // log uncaught error
                    try {
                        fs.appendFileSync(path.join(tempDir, 'worker_error.log'), `[${new Date().toISOString()}] row_unique: ${rowdata}, error: ${err.stack || err.message}\n`);
                    } catch (e) {}
                    retryCount++;
                    console.warn(`❌ การทดสอบ row_unique ${rowdata} ล้มเหลวในครั้งที่ ${retryCount} : ${err.message}`);
                    if (retryCount >= maxRetries) {
                        console.error(`🛑 การทดสอบล้มเหลวเกินกำหนดใน row_unique ${rowdata}, ข้ามไปยังชุดถัดไป\n`);
                        await page.screenshot({ path: `screenshots/SPLife/row_unique-${rowdata}.png`, fullPage: true });
                        status_result.push('Error');
                        combined_result_array.push([rowdata, 'Error Test', `⛔ Error : Expected = ${expectedinsurancesum} : Actual = 0.00 | ประเภท : ${insurancegroup} | ชื่อแบบประกัน : ${insurancename} | เพศ : ${unisex} | อายุ : ${age} | ทุน : ${insurancesum} | coverage : ${coverageYear} |`, getBangkokTimestamp(), `เกิดข้อผิดพลาดในการทดสอบ row_unique ${rowdata} : ${err.message}`]);
                    } else {
                        console.log(`🔄 กำลังเริ่มทดสอบ row_unique ${rowdata} รอบที่ ${retryCount + 1}`);
                    }
                }
            }
        }
        await googlesheet.appendRows(auth, spreadsheetId_write, range_write, combined_result_array);
        // log process exit/memory
        try {
            fs.appendFileSync(path.join(tempDir, 'worker_exit.log'), `[${new Date().toISOString()}] Worker ${i + 1} finished, memory: ${Math.round(process.memoryUsage().rss/1024/1024)}MB\n`);
        } catch (e) {}
        const passCount = status_result.filter(item => item === 'Passed').length;
        const failCount = status_result.filter(item => item === 'Failed').length;
        const errorCount = status_result.filter(item => item === 'Error').length;
        const finishdate = new Date();
        const finishformatter = new Intl.DateTimeFormat('th-TH', options);
        const finishparts = finishformatter.formatToParts(finishdate);
        const finishdateformat = `${finishparts.find(p => p.type === 'day')?.value}/${finishparts.find(p => p.type === 'month')?.value}/${finishparts.find(p => p.type === 'year')?.value} ${finishparts.find(p => p.type === 'hour')?.value}:${finishparts.find(p => p.type === 'minute')?.value}:${finishparts.find(p => p.type === 'second')?.value}`;
        await sendresultn8nbot(testcase, mySlice[0]?.plan_group, mySlice[0]?.suminsure, mySlice.length, passCount, failCount, startdateformat, finishdateformat, `${i + 1}`, errorCount);
        });
    });
}