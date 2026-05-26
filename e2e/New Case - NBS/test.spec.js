import { test, expect } from '@playwright/test';

const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');

test.use({
    ignoreHTTPSErrors: true
});

import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';

test(`บันทึกเคสใหม่แบบออกกรม์`, async ({ page }, testInfo) => {
    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    let system = 'UAT'

    if (system === 'UAT') {
        await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
    }
    else {
        await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
    }

    await test.step('Step 1 - Login เข้าสู่ระบบ', async () => {
        const check_logout = await page.locator('a', { hasText: 'ออกจากระบบ' }).isVisible()
        if (!check_logout) {

            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // Login
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            //login
            await page.locator('#username').click();
            await page.locator('#username').fill('0500'); //ใส่ username
            await page.locator('#password').click();
            await page.locator('#password').fill('1'); //ใส่ password
            await page.getByRole('button', { name: /login/i }).click();
            await page.waitForLoadState('networkidle'); // รอให้โหลดหน้าเสร็จสมบูรณ์

        }
    });

    await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
    await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่อุบัติเหตุ' }).click();
    await page.getByRole('menuitem', { name: 'พิมพ์ซ้ำเอกสาร' }).click();
    await page.getByRole('menuitem', { name: 'พิมพ์ซ้ำใบส่งเงิน' }).click();
    await page.waitForLoadState('networkidle')

    await page.locator('#oEnquiry').click();

    const context = page.context();

    let pdfUrl = '';

    // =========================
    // ดัก pdf response
    // =========================
    context.on('response', async response => {

        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('application/pdf')) {

            pdfUrl = response.url();

            // console.log('FOUND PDF URL:', pdfUrl);
        }
    });

    // =========================
    // click + รอ new tab
    // =========================
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('button[title="พิมพ์ซ้ำ"]').nth(0).click()
    ]);

    // =========================
    // รอโหลด
    // =========================
    await newPage.waitForLoadState('domcontentloaded');
    await newPage.waitForLoadState('load');
    await newPage.waitForLoadState('networkidle');

    // =========================
    // รอ generate pdf
    // =========================
    await newPage.waitForTimeout(5000);

    if (!pdfUrl) {
        throw new Error('PDF URL not found');
    }

    // =========================
    // โหลด pdf ใหม่
    // =========================
    const pdfResponse = await context.request.get(pdfUrl);

    const pdfBuffer = await pdfResponse.body();

    // debug header
    // console.log(
    //     pdfBuffer.slice(0, 20).toString()
    // );

    // =========================
    // save dir
    // =========================
    const saveDir = path.join(process.cwd(), 'temp');

    if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
    }

    // =========================
    // save pdf
    // =========================
    const pdfPath = path.join(
        saveDir,
        'pdf_ใบนำส่ง.pdf'
    );

    fs.writeFileSync(pdfPath, pdfBuffer);

    // console.log('Saved PDF:', pdfPath);

    // =========================
    // parse pdf
    // =========================
    const pdfData = await pdf(pdfBuffer);

    // console.log('======================');
    // console.log('PDF TEXT');
    // console.log('======================');

    // console.log(pdfData.text);

    // =========================
    // save text
    // =========================
    const textPath = path.join(
        saveDir,
        'pdf_ใบนำส่ง.txt'
    );

    fs.writeFileSync(textPath, pdfData.text, 'utf8');

    // console.log('Saved Text:', textPath);

    const fileText = fs.readFileSync(textPath, 'utf8');

    // ดึงข้อความหลัง 0500
    const match = fileText.match(/0500\s*(.+)/);

    if (match) {

        const result = match[1].trim();

        console.log('ข้อความหลัง 0500:', result);

    } else {

        console.log('ไม่พบ 0500');

    }

    // =========================
    // ปิด tab
    // =========================
    await newPage.close();

});

test(`ทดสอบการดึง เลขใบนำส่ง`, async ({ page }, testInfo) => {
    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    // Config ENV 
    const env = 'UAT' // SIT / UAT
    // connection database
    const db_name = 'nbs';
    const db_env = 'UAT'; // SIT | SIT_EDIT / UAT | UAT_EDIT

    let db;

    db = new Database({
        user: configdb[db_name][db_env].DB_USER,
        host: configdb[db_name][db_env].DB_HOST,
        database: configdb[db_name][db_env].DB_NAME,
        password: configdb[db_name][db_env].DB_PASSWORD,
        port: configdb[db_name][db_env].DB_PORT,
    });

    const query_check_receipt_no = 'select receipt_no from new_case_slip_trn ncst where request_no = $1;';
    const result_check_receipt_no = await db.query(query_check_receipt_no, ['1014000357']);

    console.log(result_check_receipt_no.rows[0].receipt_no);

});

