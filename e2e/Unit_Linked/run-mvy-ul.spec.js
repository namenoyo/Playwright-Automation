const { test, expect } = require('@playwright/test');

// database
const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');

// Locators
const { searchbatch } = require('../../locators/Unit_Linked/Monitor_batch.locator.js');

// Login, menu
import { LoginPage } from '../../pages/login_t.page.js';
import { gotoMenu } from '../../pages/menu.page.js';

// utils
const adjustDate = require('../../utils/dateAdjuster.js');
const { toDashed, toPlain } = require('../../utils/formatDate.js');


test('Run MVY UL', async ({ page }) => {

    const username = 'boss';
    const password = '1234';

    // Login
    const loginPage = new LoginPage(page);
    // menu
    const gotomenu = new gotoMenu(page, expect);


    // ไปยังหน้า NBS
    await loginPage.gotoNBS();
    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
    await loginPage.login(username, password);

    // ไปยังเมนู "ลูกค้าสัมพันธ์" > "ระบบ CIS" > "ข้อมูลลูกค้า"
    await gotomenu.menuAll('ระบบงานให้บริการ', 'ระบบ Unit Linked', 'IT Support', 'Monitor batch');


    let endloop;
    while (endloop !== 'Y' && endloop !== '1') { // หลังจากเสร็จแล้วต้องเอา endloop !== '1' ออก เพราะจะแค่ทดสอบ 1 รอบ

        let db;
        const policyno = 'UL00002505'; // เลขกรมธรรม์ที่ต้องการทดสอบ

        // เช็คข้อมูลใน database ก่อน
        // connection database
        const db_name = 'coreul';
        const db_env = 'SIT_EDIT';

        db = new Database({
            user: configdb[db_name][db_env].DB_USER,
            host: configdb[db_name][db_env].DB_HOST,
            database: configdb[db_name][db_env].DB_NAME,
            password: configdb[db_name][db_env].DB_PASSWORD,
            port: configdb[db_name][db_env].DB_PORT,
        });

        const query_next_due = 'select p.PMNDDT from tpsplc01 p where p.polnvc = $1;';
        const query_mvy = 'select p.NMFDDT from tpsplc01 p where p.polnvc = $1;';
        const params = [policyno];

        const result_next_due = await db.query(query_next_due, params);
        const result_mvy = await db.query(query_mvy, params);

        const next_due_date = result_next_due.rows[0].pmnddt;
        const mvy_date = result_mvy.rows[0].nmfddt;

        const cutText_next_due_date = next_due_date.substring(0, 8);

        console.log('Next due date: ' + cutText_next_due_date);
        console.log('MVY date: ' + mvy_date);

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

        // แปลงเป็น Date object
        const nextDueDate = parseDate(cutText_next_due_date);
        const mvyDateObj = parseDate(mvy_date);

        const business_process_date = formatDateMinusOne(mvyDateObj);

        console.log('Business process date (mvy date - 1 day): ' + business_process_date);

        // เปรียบเทียบ
        if (nextDueDate < mvyDateObj) {
            console.log("หยุดทำงาน: next due date < mvy date");
            return endloop = 'Y';
        } else {
            console.log("ทำงานต่อ: next due date >= mvy date");
            // เขียน step ต่อได้เลย

            // ปรับวัน mvy date
            const dashed = toDashed(mvy_date); // แปลงเป็น yyyy-MM-dd
            const adjustedDate_mvy = adjustDate.adjustDate(dashed);
            const process_date = toPlain(adjustedDate_mvy); // แปลงเป็น yyyyMMdd

            console.log('business and process date: ' + business_process_date + ' process date: ' + process_date);

            // update database
            const query_update_all_date_policy = 'update tpsplc01 set busndt = $2, crpcdt = $2, pctddt = $3 where polnvc = $1;';
            const result_update_all_date_policy = await db.query(query_update_all_date_policy, [policyno, business_process_date, process_date]);

            console.log('Update all date policy result: ' + result_update_all_date_policy.rowCount);

            // ทำการรัน batch manual ที่หน้าเว็บ


            
            endloop = '1';

        }

        // ปิด database
        await db.close();

    }

});