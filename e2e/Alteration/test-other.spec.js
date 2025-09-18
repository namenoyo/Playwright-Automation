const { test, expect } = require('@playwright/test');
const { data_matrix_endorse } = require('../../data/Alteration/data_endorse.data');
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper.js');
const { changeobjecttoarray } = require('../../utils/common.js');

test('ตรวจสอบข้อมูลว่ามีซ้ำกันไหมในไฟล์ test data .js', async ({ page }) => {

    const seen = new Map();
    const duplicates = [];

    for (const item of data_matrix_endorse) {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
            seen.set(key, seen.get(key) + 1);
        } else {
            seen.set(key, 1);
        }
    }

    // หาค่าที่ซ้ำ (count > 1)
    for (const [key, count] of seen.entries()) {
        if (count > 1) {
            const obj = JSON.parse(key);
            obj.duplicate_count = count;
            duplicates.push(obj);
        }
    }

    console.log("ข้อมูลที่ซ้ำ:", duplicates);

    const changeobjecttoarray_result = changeobjecttoarray(duplicates);

    // นำข้อมูลเข้า google sheet (สรุปผล)
    const googlesheet = new GoogleSheet();

    // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
    const spreadsheetId_write = '1KHpF_qzfREFI4AwznWX9u6rEwNFPZ9niPm0kZ9Hb5Mg';
    const range_write = `Data Test Endorse file Duplicate!A:Z`;

    // เริ่มต้น Auth
    const auth = await googlesheet.initAuth();

    await googlesheet.appendRows(auth, spreadsheetId_write, range_write, changeobjecttoarray_result);
})