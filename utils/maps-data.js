import { checkvalueExpected } from "./check-value";
const { Database } = require('../database/database');
const { configdb } = require('../database/database_env');
import { changeobjecttoarray } from "./common";
import { pulldataobjectfromkeys } from "./common";
import { Expected_inquiryformArraykey_label } from "../data/Alteration/inquiryform_expected_doc_v1.data";

export class mapsdataArray {
    constructor(page, expect) {
        this.page = page,
            this.expect = expect
    }

    async mapsdataarrayfile_checkdata(locatorarray, expectedarray) {

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);

        let status_result_array = []
        let assertion_result_array = []

        let result = ''

        // loop ตาม selector โดยเก็บ property ใน object มาไว้ใน key
        for (const key in locatorarray) {
            // ดึงข้อมูลจาก locator โดยหา property ที่ตรงกันมาแสดง
            const locator = locatorarray[key]
            // ดึงข้อมูลจาก expectedvalue โดยหา property ที่ตรงกันมาแสดง
            const expectedvalue = expectedarray[key]

            // เช็คเงื่อนไขกรณีที่ถ้า locator หรือ expectedvalue ไม่มี property ที่ตรงกันจะให้ข้ามการเช็คไป
            if (locator != undefined && expectedvalue != undefined) {
                // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid (กรณีเป็น array ซ้อน array)
                if (expectedvalue[0].data[0].length > 1) {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    // นำข้อมูลหัวที่เช็ค เข้า array
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ Data Grid td
                    // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                    for (let i = 0; i < expectedvalue[0].data.length; i++) {
                        // ดึงบรรทัดตามเลข loop
                        const row = locator.nth(i);
                        // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
                        const cells = row.locator('td');
                        // นับจำนวน tag td ที่อยู่ในบรรทัด
                        const cellcount = await cells.count();
                        // แสดงข้อมูลบรรทัด
                        console.log('ข้อมูล Row', i + 1)
                        // นำข้อมูลบรรทัด เข้า array
                        assertion_result_array.push(`ข้อมูล Row ${i + 1}`)

                        // ตรวจสอบ column แต่ละช่อง
                        for (let j = 1; j < cellcount; j += 2) {
                            // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
                            const cell = await cells.nth(j);
                            // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
                            let changeindexdata = (j / 2) - 0.5
                            // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                            result = await checkvalueexpected.checkvalueOnscreen(cell, expectedvalue[0].data[i][changeindexdata], expectedarray.policy_no);
                            // นำค่า status ที่ return เข้า array
                            status_result_array.push(result.status_result)
                            // นำค่า assertion ที่ return เข้า array
                            assertion_result_array.push(result.assertion_result)
                        }
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                } else {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
                    // loop ตามข้อมูล data ใน array
                    for (const [i, expectedarray] of expectedvalue.entries()) {
                        // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                        result = await checkvalueexpected.checkvalueOnscreen(locator, expectedarray.data[i][i], expectedarray.policy_no);
                        // นำค่า status ที่ return เข้า array
                        status_result_array.push(result.status_result)
                        // นำค่า assertion ที่ return เข้า array
                        assertion_result_array.push(result.assertion_result)
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                }
            } else { }
        }
        return { status_result_array, assertion_result_array }
    }

    async mapsdataarrayfile_checkdata_database(locatorarray, expectedarray) {

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);

        const dbConfig = configdb.letterreturn.SIT; // เปลี่ยนตามสภาพแวดล้อมที่ต้องการ
        const db = new Database({
            user: dbConfig.DB_USER,
            password: dbConfig.DB_PASSWORD,
            host: dbConfig.DB_HOST,
            database: dbConfig.DB_NAME
        });

        let status_result_array = []
        let assertion_result_array = []

        let result = ''

        // loop ตาม selector โดยเก็บ property ใน object มาไว้ใน key
        for (const key in locatorarray) {
            // ดึงข้อมูลจาก locator โดยหา property ที่ตรงกันมาแสดง
            const locator = locatorarray[key]
            // ดึงข้อมูลจาก expectedvalue โดยหา property ที่ตรงกันมาแสดง
            const expectedvalue = expectedarray[key]

            // เช็คเงื่อนไขกรณีที่ถ้า locator หรือ expectedvalue ไม่มี property ที่ตรงกันจะให้ข้ามการเช็คไป
            if (locator != undefined && expectedvalue != undefined) {

                // ดึงข้อมูลจาก database
                const resultvariable = await db.query(expectedvalue[0].query, expectedvalue[0].wherefield)
                // เรียกใช้ function แปลง object เป็น array
                const resultchangeobj = changeobjecttoarray(resultvariable);

                // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid
                if (resultchangeobj[0].length > 1) {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    // นำข้อมูลหัวที่เช็ค เข้า array
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ Data Grid td
                    // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                    for (let i = 0; i < resultchangeobj.length; i++) {
                        // ดึงบรรทัดตามเลข loop
                        const row = locator.nth(i);
                        // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
                        const cells = row.locator('td');
                        // นับจำนวน tag td ที่อยู่ในบรรทัด
                        const cellcount = await cells.count();
                        // แสดงข้อมูลบรรทัด
                        console.log('ข้อมูล Row', i + 1)
                        // นำข้อมูลบรรทัด เข้า array
                        assertion_result_array.push(`ข้อมูล Row ${i + 1}`)

                        // ตรวจสอบ column แต่ละช่อง
                        for (let j = 1; j < cellcount; j += 2) {
                            // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
                            const cell = await cells.nth(j);
                            // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
                            let changeindexdata = (j / 2) - 0.5
                            // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                            result = await checkvalueexpected.checkvalueOndatabase(cell, resultchangeobj[0][changeindexdata], expectedarray.policy_no);
                            // นำค่า status ที่ return เข้า array
                            status_result_array.push(result.status_result)
                            // นำค่า assertion ที่ return เข้า array
                            assertion_result_array.push(result.assertion_result)
                        }
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                } else {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
                    // loop ตามข้อมูล data ใน array
                    for (const [i, expectedarray] of resultchangeobj.entries()) {
                        // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                        result = await checkvalueexpected.checkvalueOndatabase(locator, expectedarray[i], expectedarray.policy_no);
                        // นำค่า status ที่ return เข้า array
                        status_result_array.push(result.status_result)
                        // นำค่า assertion ที่ return เข้า array
                        assertion_result_array.push(result.assertion_result)
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                }
            } else { }
        }
        return { status_result_array, assertion_result_array }
    }

    async mapsdataarrayfile_checkdata_database_keys(locatorarray, expectedarray) {

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);

        const dbConfig = configdb.letterreturn.SIT; // เปลี่ยนตามสภาพแวดล้อมที่ต้องการ
        const db = new Database({
            user: dbConfig.DB_USER,
            password: dbConfig.DB_PASSWORD,
            host: dbConfig.DB_HOST,
            database: dbConfig.DB_NAME
        });

        let status_result_array = []
        let assertion_result_array = []

        let result = ''

        // loop ตาม selector โดยเก็บ property ใน object มาไว้ใน key
        for (const key in locatorarray) {
            // ดึงข้อมูลจาก locator โดยหา property ที่ตรงกันมาแสดง
            const locator = locatorarray[key]
            // ดึงข้อมูลจาก expectedvalue โดยหา property ที่ตรงกันมาแสดง
            const expectedvalue = expectedarray[key]

            // เช็คเงื่อนไขกรณีที่ถ้า locator หรือ expectedvalue ไม่มี property ที่ตรงกันจะให้ข้ามการเช็คไป
            if (locator != undefined && expectedvalue != undefined) {

                // ดึงข้อมูลจาก database
                const resultvariable = await db.query(expectedvalue[0].query, expectedvalue[0].wherefield)
                // เรียกใช้ function ดึงข้อมูลเฉพาะ keys ที่ต้องการ ผ่าน object
                const resultdatabasekeys = pulldataobjectfromkeys(resultvariable, expectedvalue[0].fieldneeds);

                // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid
                if (resultdatabasekeys[0].length > 1) {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    // นำข้อมูลหัวที่เช็ค เข้า array
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ Data Grid td
                    // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                    for (let i = 0; i < resultdatabasekeys.length; i++) {
                        // ดึงบรรทัดตามเลข loop
                        const row = locator.nth(i);
                        // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
                        const cells = row.locator('td');
                        // นับจำนวน tag td ที่อยู่ในบรรทัด
                        const cellcount = await cells.count();
                        // แสดงข้อมูลบรรทัด
                        console.log('ข้อมูล Row', i + 1)
                        // นำข้อมูลบรรทัด เข้า array
                        assertion_result_array.push(`ข้อมูล Row ${i + 1}`)

                        // ตรวจสอบ column แต่ละช่อง
                        for (let j = 1; j < cellcount; j += 2) {
                            // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
                            const cell = await cells.nth(j);
                            // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
                            let changeindexdata = (j / 2) - 0.5
                            // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                            result = await checkvalueexpected.checkvalueOndatabase(cell, resultdatabasekeys[0][changeindexdata], expectedarray.policy_no);
                            // นำค่า status ที่ return เข้า array
                            status_result_array.push(result.status_result)
                            // นำค่า assertion ที่ return เข้า array
                            assertion_result_array.push(result.assertion_result)
                        }
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                } else {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
                    // loop ตามข้อมูล data ใน array
                    for (const [i, expectedarray] of resultdatabasekeys.entries()) {
                        // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                        result = await checkvalueexpected.checkvalueOndatabase(locator, expectedarray[i], expectedarray.policy_no);
                        // นำค่า status ที่ return เข้า array
                        status_result_array.push(result.status_result)
                        // นำค่า assertion ที่ return เข้า array
                        assertion_result_array.push(result.assertion_result)
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                }
            } else { }
        }
        return { status_result_array, assertion_result_array }
    }
}

export class mapsdataObject {
    constructor(page, expect) {
        this.page = page,
            this.expect = expect
    }

    async mapsdataarrayfile_checkdata_alteration(locatorarray, expectedarray) {

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);

        let status_result_array = []
        let assertion_result_array = []

        let result = ''

        // loop ตาม selector โดยเก็บ property ใน object มาไว้ใน key
        for (const key in locatorarray) {
            // ดึงข้อมูลจาก locator โดยหา property ที่ตรงกันมาแสดง
            const locator = locatorarray[key]
            // ดึงข้อมูลจาก expectedvalue โดยหา property ที่ตรงกันมาแสดง
            const expectedvalue = expectedarray[key]

            // เช็คเงื่อนไขกรณีที่ถ้า locator หรือ expectedvalue ไม่มี property ที่ตรงกันจะให้ข้ามการเช็คไป
            if (locator != undefined && expectedvalue != undefined) {
                // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid (กรณีเป็น array ซ้อน object)
                if (expectedvalue[0].data.length > 1 && expectedvalue[0].type !== '' && expectedvalue[0].type === undefined) {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    // นำข้อมูลหัวที่เช็ค เข้า array
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ Data Grid td
                    // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                    for (let i = 0; i < expectedvalue[0].data.length; i++) {
                        // ดึงบรรทัดตามเลข loop
                        const row = locator.nth(i);
                        // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
                        const cells = row.locator('td');
                        // นับจำนวน tag td ที่อยู่ในบรรทัด
                        const cellcount = await cells.count();
                        // แสดงข้อมูลบรรทัด
                        console.log('ข้อมูล Row', i + 1)
                        // นำข้อมูลบรรทัด เข้า array
                        assertion_result_array.push(`ข้อมูล Row ${i + 1}`);

                        // เช็คว่ามี column หรือไม่
                        if (cellcount <= 2) {
                            // จับ tag td ตัวที่ 2
                            const celldata = cells.nth(1);
                            // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                            result = await checkvalueexpected.checkvalueOnscreen(celldata, expectedvalue[0].data[i], expectedarray.policy_no);
                            // นำค่า status ที่ return เข้า array
                            status_result_array.push(result.status_result)
                            // นำค่า assertion ที่ return เข้า array
                            assertion_result_array.push(result.assertion_result)
                        } else {
                            // ตรวจสอบ column แต่ละช่อง
                            for (let j = 1; j < cellcount; j += 2) {
                                // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
                                const cell = await cells.nth(j);
                                // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
                                let changeindexdata = (j / 2) - 0.5
                                // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                                result = await checkvalueexpected.checkvalueOnscreen(cell, expectedvalue[0].data[i][changeindexdata], expectedarray.policy_no);
                                // นำค่า status ที่ return เข้า array
                                status_result_array.push(result.status_result)
                                // นำค่า assertion ที่ return เข้า array
                                assertion_result_array.push(result.assertion_result)
                            }
                        }
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                } else if (expectedvalue[0].data.length === 1 && expectedvalue[0].type !== '' && expectedvalue[0].type === undefined) {
                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    assertion_result_array.push(expectedvalue[0].label)
                    // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
                    // loop ตามข้อมูล data ใน array
                    for (const [i, expectedarray] of expectedvalue.entries()) {
                        // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                        result = await checkvalueexpected.checkvalueOnscreen(locator, expectedarray.data[i][i], expectedarray.policy_no);
                        // นำค่า status ที่ return เข้า array
                        status_result_array.push(result.status_result)
                        // นำค่า assertion ที่ return เข้า array
                        assertion_result_array.push(result.assertion_result)
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                }
            } else { }
        }
        return { status_result_array, assertion_result_array }
    }

    async mapsdataarrayfile_checkdata_alteration_detaildocument(locatorarray, expectedarray) {

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);

        let status_result_array = []
        let assertion_result_array = []

        let result = ''
        let result_detail = ''

        // loop ตาม selector โดยเก็บ property ใน object มาไว้ใน key
        for (const key in locatorarray) {
            // ดึงข้อมูลจาก locator โดยหา property ที่ตรงกันมาแสดง
            const locator = locatorarray[key]
            // ดึงข้อมูลจาก expectedvalue โดยหา property ที่ตรงกันมาแสดง
            const expectedvalue = expectedarray[key]

            // เช็คเงื่อนไขกรณีที่ถ้า locator หรือ expectedvalue ไม่มี property ที่ตรงกันจะให้ข้ามการเช็คไป
            if (locator != undefined && expectedvalue != undefined) {
                // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid (กรณีเป็น array ซ้อน object)
                if (expectedvalue[0].data.length > 1 && expectedvalue[0].type === 'detail_document') {

                    // แสดงข้อมูลหัวที่เช็ค
                    console.log(expectedvalue[0].label)
                    // นำข้อมูลหัวที่เช็ค เข้า array
                    assertion_result_array.push(expectedvalue[0].label)
                    // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                    for (let i = 0; i < expectedvalue[0].data.length; i++) {

                        // แสดงข้อมูลบรรทัด
                        console.log('ข้อมูลรายละเอียด Row', i + 1)
                        // นำข้อมูลบรรทัด เข้า array
                        assertion_result_array.push(`ข้อมูลรายละเอียด Row ${i + 1}`);

                        // ข้อมูล header detail document
                        const headerText = expectedvalue[0].data[i];
                        // แปลงให้เป็น string ป้องกัน error ถ้าไม่ใช่ข้อความ
                        const text = (headerText ?? "").toString().trim();
                        // ลบ * ทั้งหมดออก
                        const cleaned = text.replace(/\*/g, "");
                        // ลบ ... ทั้งหมด
                        const cleaned_all = cleaned.replace(/\.\.\./g, "");
                        // ตัดคำแรกออกแล้วต่อข้อความใหม่
                        const words = cleaned_all.trim().split(/\s+/);
                        const remaining = words.slice(1).join(" "); // ตัดคำแรกทิ้ง
                        // สร้างข้อความใหม่
                        const formattedText_detaildoc = "หมายเหตุเอกสารแนบ : " + remaining;

                        // หา object ที่ document_name ตรงกับ header detail document
                        const found = Expected_inquiryformArraykey_label.find(item => item.document_name === remaining);

                        if (found.document_detail === 'NULL') {
                            // console.log('ไม่มีรายละเอียดเอกสารแนบ');
                            // // นำข้อมูลบรรทัด เข้า array
                            // assertion_result_array.push('ไม่มีรายละเอียดเอกสารแนบ');
                            if (await this.page.locator('div.MuiCollapse-wrapper').last().locator('tbody.MuiTableBody-root > tr').nth(i).locator('button[class="MuiButtonBase-root MuiIconButton-root"]').isVisible()) {
                                console.log('❌ Mismatch: Expected = ไม่มีรายละเอียดเอกสารแนบ : Actual   = มีปุ่ม ... แสดงว่ามีรายละเอียดเอกสารแนบ');
                                assertion_result_array.push(`❌ Mismatch: Expected = ไม่มีรายละเอียดเอกสารแนบ : Actual   = มีปุ่ม ... แสดงว่ามีรายละเอียดเอกสารแนบ`);
                            } else {
                                console.log('✅ Match: Expected = ไม่มีรายละเอียดเอกสารแนบ : Actual   = ไม่มีปุ่ม ... แสดงว่าไม่มีรายละเอียดเอกสารแนบ');
                                assertion_result_array.push(`✅ Match: Expected = ไม่มีรายละเอียดเอกสารแนบ : Actual   = ไม่มีปุ่ม ... แสดงว่าไม่มีรายละเอียดเอกสารแนบ`);
                            }
                        } else {
                            // Click ... ตามบรรทัด เพื่อดูรายละเอียด
                            await this.page.locator('div.MuiCollapse-wrapper').last().locator('tbody.MuiTableBody-root > tr').nth(i).locator('button[class="MuiButtonBase-root MuiIconButton-root"]').click();

                            // ใช้ function เช็คข้อมูล expected กับ header หน้าจอ
                            result = await checkvalueexpected.checkvalueOnscreen(locator.nth(0), formattedText_detaildoc, expectedarray.policy_no);
                            // ใช้ function เช็คข้อมูล expected กับ detail หน้าจอ
                            result_detail = await checkvalueexpected.checkvalueOnscreen(locator.nth(1), found.document_detail, expectedarray.policy_no);

                            // นำค่า status ที่ return เข้า array
                            status_result_array.push(result.status_result)
                            // นำค่า assertion ที่ return เข้า array
                            assertion_result_array.push(result.assertion_result)

                            // นำค่า status ที่ return เข้า array
                            status_result_array.push(result_detail.status_result)
                            // นำค่า assertion ที่ return เข้า array
                            assertion_result_array.push(result_detail.assertion_result)

                            // กดปิด popup detail
                            await this.page.getByRole('dialog').locator('span[class="MuiIconButton-label"]').click();
                        }
                    }
                    console.log('')
                    // นำค่าว่างเข้า array
                    status_result_array.push('')
                    assertion_result_array.push('')
                } else { }
            } else { }
        }
        return { status_result_array, assertion_result_array }
    }

    async endorsecheckdata_alteration(endorsename, endorsecheckbox) {

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);

        let status_result_array = []
        let assertion_result_array = []

        let result = ''
        let result_checkbox = ''

        // loop ตาม จำนวนข้อมูล endorse
        for (let i = 0; i < endorsecheckbox[0].endorse_checkbox_locator[0].code.length; i++) {

            // แสดงข้อมูล label ที่เช็ค
            console.log(`สลักหลัง: ${endorsename[0].endorse_name_locator[0].label[i]}`)
            // นำข้อมูล label ที่เช็ค เข้า array
            assertion_result_array.push(`สลักหลัง: ${endorsename[0].endorse_name_locator[0].label[i]}`);

            // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
            result = await checkvalueexpected.checkvalueOnscreen(endorsename[0].endorse_name_locator[0].locator[i], endorsename[0].endorse_name_locator[0].data[i]);
            // นำค่า status ที่ return เข้า array
            status_result_array.push(result.status_result)
            // นำค่า assertion ที่ return เข้า array
            assertion_result_array.push(result.assertion_result)

            // เช็คข้อมูล checkbox บนหน้าจอ กับ Expected แบบ 1:1
            result_checkbox = await checkvalueexpected.checkbox_enable_disable_Onscreen(endorsecheckbox[0].endorse_checkbox_locator[0].locator[i], endorsecheckbox[0].endorse_checkbox_locator[0].data[i]);
            // นำค่า status ที่ return เข้า array
            status_result_array.push(result_checkbox.status_result)
            // นำค่า assertion ที่ return เข้า array
            assertion_result_array.push(result_checkbox.assertion_result)

            console.log('')
            // นำค่าว่างเข้า array
            status_result_array.push('')
            assertion_result_array.push('')
        }

        return { status_result_array, assertion_result_array }
    }
}