const { test, expect } = require('@playwright/test');

import { chromium } from '@playwright/test';

import { LoginPage } from '../../pages/login_t.page.js';
import { gotoMenu } from '../../pages/menu.page.js';
import { LogoutPage } from '../../pages/logout.page.js';

// ดึงข้อมูล json จากไฟล์ 4200_2026-03-04.json
const data = require('../../data/data_newcase_confirm.json');

test('ยืนยันใบคำขอผ่าน สาขา', async ({ page }) => {

    // test('Daily Buy-Sell Investment Order - Unit Linked', async ({ }) => {
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
    test.setTimeout(7200000); // 2 ชั่วโมง

    // Login
    const loginPage = new LoginPage(page, expect);
    const logoutPage = new LogoutPage(page, expect);
    // Menu
    const gotomenu = new gotoMenu(page, expect);

    for (const group of data) {
        // ไปยังหน้า NBS
        await loginPage.gotoNBSENV('UAT');
        // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
        await loginPage.login(group.branch, '000');

        await gotomenu.menuAll('ระบบงาน Back Office', 'ระบบ E-Application');

        // loop ข้อมูลจาก json
        for (const item of group.applications) {

            console.log('เลขที่ใบคำขอล่าสุด:', item);

            await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).click();
            await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).fill('');
            await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).fill(item);
            await page.waitForTimeout(500);
            await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
            await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
            await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
            await page.waitForTimeout(1000);
            // เช็ตว่าปุ่มเป็น ตรวจสอบเอกสาร หรือไม่
            const checkButton = await page.getByRole('button', { name: 'ตรวจสอบเอกสาร' });
            if (await checkButton.isVisible()) {
                await page.getByRole('button', { name: 'ตรวจสอบเอกสาร' }).click({ timeout: 60000 });
                await expect(page.getByLabel('Breadcrumb').getByText('ตรวจสอบเอกสาร')).toBeVisible({ timeout: 60000 });
                await page.waitForTimeout(2000);
                await page.getByRole('button', { name: 'ยืนยันข้อมูลทางโทรศัพท์' }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).toBeVisible({ timeout: 60000 });
                await page.setInputFiles('input[type="file"]', 'pic/ochi-thank@2x.png');
                await page.waitForTimeout(500);
                await page.getByRole('button', { name: 'ยืนยัน' }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).not.toBeVisible({ timeout: 60000 });
                await page.getByRole('button', { name: 'ยืนยันข้อมูล', exact: true }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).toBeVisible({ timeout: 60000 });
                await page.getByRole('button', { name: 'ยืนยัน' }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).not.toBeVisible({ timeout: 60000 });
                let confirmationText = await page.locator('div[aria-labelledby="confirmation-dialog-title"]').textContent();
                if (confirmationText.includes('ระบบส่งข้อมูลเข้ากระบวนการพิจารณารับประกันแล้ว')) {
                    await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]', { hasText: 'ระบบส่งข้อมูลเข้ากระบวนการพิจารณารับประกันแล้ว' })).toBeVisible({ timeout: 60000 });
                    await page.getByRole('button', { name: 'ตกลง' }).click();
                    await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]', { hasText: 'ระบบส่งข้อมูลเข้ากระบวนการพิจารณารับประกันแล้ว' })).not.toBeVisible({ timeout: 60000 });
                    await expect(page.getByLabel('Breadcrumb').getByText('ตรวจสอบเอกสาร')).not.toBeVisible({ timeout: 60000 });
                } else {
                    await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).toBeVisible({ timeout: 60000 });
                    await page.getByRole('button', { name: 'ตกลง' }).click();
                    await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).not.toBeVisible({ timeout: 60000 });
                    await expect(page.getByLabel('Breadcrumb').getByText('ตรวจสอบเอกสาร')).not.toBeVisible({ timeout: 60000 });
                }
                
                
            }
        }

        await logoutPage.logoutNBSPortal();
    }
});

test('อนุมัติ UW', async ({ page }) => {
    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    // Login
    const loginPage = new LoginPage(page, expect);
    const logoutPage = new LogoutPage(page, expect);
    // Menu
    const gotomenu = new gotoMenu(page, expect);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // ไปยังหน้า NBS
    await loginPage.gotoNBSENV('UAT');
    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
    await loginPage.login('uw3', '000');

    await gotomenu.menuAll('ระบบงาน Back Office', 'ระบบงานพิจารณารับประกัน');

    await page.getByRole('button', { name: ' พิจารณารับประกัน' }).click({ timeout: 60000 });
    await page.getByRole('button', { name: 'ค้นหาและแสดงรายการพิจารณารับประกัน' }).click({ timeout: 60000 });

    await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

    // loop ข้อมูลจาก json
    for (const [index, item] of data.applications.entries()) {
        await page.locator('div[class="MuiFormControl-root MuiTextField-root MuiFormControl-fullWidth"]', { hasText: 'เลขที่ใบคำขอ' }).locator('input').fill('');
        await page.locator('div[class="MuiFormControl-root MuiTextField-root MuiFormControl-fullWidth"]', { hasText: 'เลขที่ใบคำขอ' }).locator('input').fill(item);
        await page.waitForTimeout(500);
        if (index === 0) {
            await page.getByRole('textbox', { name: 'จากวันที่' }).click();
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(500);
            await page.getByRole('textbox', { name: 'ถึงวันที่' }).click();
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(500);
            await page.locator('div[class="makeStyles-root-631"]', { hasText: 'ผู้พิจารณารับประกัน' }).locator('svg').nth(0).click();
            await page.waitForTimeout(500);
        }
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'ค้นหา', exact: true }).click({ timeout: 60000 });
        await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
        await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
        // await page.waitForTimeout(1000);
        // เช็คว่าปุ่มแสดงไหม
        const isCheckButtonVisible = await page.getByRole('button', { name: '', exact: true }).isVisible({ timeout: 60000 });
        if (isCheckButtonVisible) {
            // เช็คว่าปุ่มเปิดไหม
            const isButtonEnabled = await page.getByRole('button', { name: '' }).isEnabled({ timeout: 60000 });
            // console.log('isButtonEnabled:', isButtonEnabled);
            if (isButtonEnabled) {
                await page.getByRole('button', { name: '' }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).toBeVisible({ timeout: 60000 });
                // ตรวจสอบคำ popup โดยดึงออกมาเช็คว่ามีคำว่า Re-Assign หรือไม่
                const dialogText = await page.locator('div[aria-labelledby="confirmation-dialog-title"]').innerText();
                if (dialogText.includes('ต้องการทำการ Re-Assign กรุณากดปุ่ม ยืนยัน')) {
                    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
                }
                await page.getByRole('textbox', { name: 'กรุณาระบุ' }).click();
                await page.getByRole('textbox', { name: 'กรุณาระบุ' }).fill('test');
                await page.locator('div[validates="required|กรุณาระบุผู้พิจารณารับประกัน"]').locator('input').click();
                await page.getByText('Bbbboss : คพปปต.', { exact: true }).click();
                await page.waitForTimeout(500);
                await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
                await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
                await page.getByRole('button', { name: 'ตกลง', exact: true }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).not.toBeVisible({ timeout: 60000 });
                await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
                await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
            }
        }
    }

    await logoutPage.logoutNBSPortal();

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // ไปยังหน้า NBS
    await loginPage.gotoNBSENV('SIT');
    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
    await loginPage.login('boss', '000');
    await gotomenu.menuAll('ระบบงาน Back Office', 'ระบบงานพิจารณารับประกัน');

    await page.getByRole('button', { name: ' พิจารณารับประกัน' }).click({ timeout: 60000 });
    await page.getByRole('button', { name: 'ค้นหาและแสดงรายการพิจารณารับประกัน' }).click({ timeout: 60000 });

    await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

    // loop ข้อมูลจาก json
    for (const [index, item] of data.applications.entries()) {
        await page.locator('div[class="MuiFormControl-root MuiTextField-root MuiFormControl-fullWidth"]', { hasText: 'เลขที่ใบคำขอ' }).locator('input').fill('');
        await page.locator('div[class="MuiFormControl-root MuiTextField-root MuiFormControl-fullWidth"]', { hasText: 'เลขที่ใบคำขอ' }).locator('input').fill(item);
        await page.waitForTimeout(500);
        if (index === 0) {
            await page.getByRole('textbox', { name: 'จากวันที่' }).click();
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(500);
            await page.getByRole('textbox', { name: 'ถึงวันที่' }).click();
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(500);
        }
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'ค้นหา', exact: true }).click({ timeout: 60000 });
        await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
        await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

        // เช็คว่าปุ่มแสดงไหม
        const isCheckButtonVisible = await page.getByRole('button', { name: '', exact: true }).isVisible({ timeout: 60000 });
        if (isCheckButtonVisible) {
            const isButtonEnabled = await page.getByRole('button', { name: '', exact: true }).isEnabled();
            if (isButtonEnabled) {
                await page.getByRole('button', { name: '', exact: true }).click();
                await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
                await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
                await page.getByRole('button', { name: ' อนุมัติรับประกัน' }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).toBeVisible({ timeout: 60000 });
                await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
                await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
                await page.getByRole('button', { name: 'ตกลง', exact: true }).click();
                await expect(page.locator('div[aria-labelledby="confirmation-dialog-title"]')).not.toBeVisible({ timeout: 60000 });
                await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
                await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
            }
        }
    }

    await logoutPage.logoutNBSPortal();
});