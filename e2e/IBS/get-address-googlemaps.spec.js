import { test, expect } from '@playwright/test';

const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');

test('should get address from Google Maps', async ({ page }) => {

    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    // let testData = [];

    // const googlesheet = new GoogleSheet();
    // const auth = await googlesheet.initAuth();
    // const spreadsheetId = '1N1syAS-2IoWYwV3Wtd8rnKz1XBv9Z6zJ9V2N01nKcfQ';
    // const sheetname = `Data_Auto_G-able`;
    // const readrange = `${sheetname}!A1:AZ1000000`;
    // testData = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);
    // const sheetnamewrite = sheetname;
    // const range_write = `A1:AZ`;

    // Navigate to the Google Maps page
    await page.goto('https://www.google.com/maps');
    // รอให้หน้าโหลดเสร็จสมบูรณ์
    await page.waitForTimeout(5000); // รอ 5 วินาทีเพื่อให้หน้าโหลดเสร็จสมบูรณ์

    // Search for a specific location
    const searchBox = await page.locator('div[role="search"]').locator('input');
    await searchBox.fill('โรงพยาบาล 50 พรรษา มหาวชิราลงกรณ์');
    await page.waitForTimeout(500); // รอ 5 วินาทีเพื่อให้ผลการค้นหาแสดงขึ้นมา
    await searchBox.press('Enter'); // <<< ใช้ตรงนี้

    // ดึง text ช่องของ input ของผลการค้นหา
    const searchResult = await page.locator('div[role="main"]').locator('div[style="padding-bottom: 4px;"] > div').nth(0).textContent();
    console.log('Search Result:', searchResult);

    await page.locator(`div[aria-label="ข้อมูลสำหรับ ${searchResult}"]`).waitFor({ state: 'visible' });
    const result_address = await page.locator(`button[data-item-id="address"]`).getAttribute('aria-label');
    console.log('Address:', result_address);

});