const { test, expect } = require('@playwright/test');
const { data_matrix_endorse } = require('../../data/Alteration/data_endorse.data');
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper.js');
const { changeobjecttoarray } = require('../../utils/common.js');

const { datadict_endorse_checkbox_sub_status } = require('../../data/Alteration/inquiryform_datadict_endorse_checkbox_2_Sub_Status.data.js');

const { raw_data_alteration } = require('../../data/Alteration/raw_data_alteration.data.js');

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

test('ตรวจสอบข้อมูลว่ามีซ้ำกันไหมในไฟล์ test data .js - only key', async ({ page }) => {

    // กำหนดว่าจะใช้ key ไหนเช็คซ้ำ
    function makeKey(item) {
        // ตัวอย่าง: เช็คซ้ำจาก id + name
        return `${item.channel_code}-${item.policy_type}-${item.policy_status}-${item.contact_code}-${item.policy_line}`;

        // หรือถ้าอยากหลาย field:
        // return `${item.first_name}-${item.last_name}-${item.email}`;
    }

    const seen = new Map();
    const duplicates = [];

    for (const item of data_matrix_endorse) {
        const key = makeKey(item);
        if (seen.has(key)) {
            seen.set(key, seen.get(key) + 1);
        } else {
            seen.set(key, 1);
        }
    }

    // หาค่าที่ซ้ำ
    for (const [key, count] of seen.entries()) {
        if (count > 1) {
            // ดึง object ตัวอย่างที่ซ้ำ
            const obj = data_matrix_endorse.find(i => makeKey(i) === key);
            obj.duplicate_count = count;
            obj.duplicate_key = key; // เพิ่มบอกว่าซ้ำตาม key อะไร
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
});

test.only('แจง Scenario data dict', async ({ page }) => {

    let scenarioIndex = 1;

    function extractScenarios(obj, prefix = []) {
        let results = [];
        for (const [key, value] of Object.entries(obj)) {
            const newPrefix = [...prefix, key];
            if (Array.isArray(value)) {
                // Leaf -> บันทึกเป็น Scenario
                results.push([`Scenario ${scenarioIndex++}`, newPrefix.join("")]);
            } else if (typeof value === "object" && value !== null) {
                results = results.concat(extractScenarios(value, newPrefix));
            }
        }
        return results;
    }

    const scenarios = extractScenarios(datadict_endorse_checkbox_sub_status);
    console.log(JSON.stringify(scenarios, null, 2));


    // นำข้อมูลเข้า google sheet (สรุปผล)
    const googlesheet = new GoogleSheet();

    // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
    const spreadsheetId_write = '1KHpF_qzfREFI4AwznWX9u6rEwNFPZ9niPm0kZ9Hb5Mg';
    const range_write = `Scenario Data Dictionary!A:Z`;

    // เริ่มต้น Auth
    const auth = await googlesheet.initAuth();

    await googlesheet.appendRows(auth, spreadsheetId_write, range_write, scenarios);
})
