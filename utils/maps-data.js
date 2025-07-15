import { checkvalueExpected } from "./check-value";
const db = require('../database/database');

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
                // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid
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
                // แปลง object เป็น array
                const resultchangeobj = resultvariable.rows.map(obj => Object.values(obj));
                console.log(resultchangeobj);

                if (resultchangeobj.length > 1) {
                    console.log('มีข้อมูลมากกว่า 1')
                } else {
                    console.log('มีข้อมูล = 1')
                }

                // // เช็คเงื่อนไข ถ้ามีข้อมูลใน key data มากกว่า 1 แสดงว่าเป็นข้อมูล data grid
                // if (expectedvalue[0].data[0].length > 1) {
                //     // แสดงข้อมูลหัวที่เช็ค
                //     console.log(expectedvalue[0].label)
                //     // นำข้อมูลหัวที่เช็ค เข้า array
                //     assertion_result_array.push(expectedvalue[0].label)
                //     // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ Data Grid td
                //     // loop ตรวจสอบแต่ละ cell ในแต่ละ row
                //     for (let i = 0; i < expectedvalue[0].data.length; i++) {
                //         // ดึงบรรทัดตามเลข loop
                //         const row = locator.nth(i);
                //         // นำบรรทัดที่ loop ไปดึงข้อมูลใน tag td
                //         const cells = row.locator('td');
                //         // นับจำนวน tag td ที่อยู่ในบรรทัด
                //         const cellcount = await cells.count();
                //         // แสดงข้อมูลบรรทัด
                //         console.log('ข้อมูล Row', i + 1)
                //         // นำข้อมูลบรรทัด เข้า array
                //         assertion_result_array.push(`ข้อมูล Row ${i + 1}`)

                //         // ตรวจสอบ column แต่ละช่อง
                //         for (let j = 1; j < cellcount; j += 2) {
                //             // ดึง column ตามเลข loop พร้อมดึงข้อความบนหน้าจอมาเก็บไว้ในตัวแปร
                //             const cell = await cells.nth(j);
                //             // เปลี่นเลข index สำหรับดึงข้อมูลจาก data ที่เราเตรียมไว้
                //             let changeindexdata = (j / 2) - 0.5
                //             // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                //             result = await checkvalueexpected.checkvalueOndatabase(cell, expectedvalue[0].data[i][changeindexdata], expectedarray.policy_no);
                //             // นำค่า status ที่ return เข้า array
                //             status_result_array.push(result.status_result)
                //             // นำค่า assertion ที่ return เข้า array
                //             assertion_result_array.push(result.assertion_result)
                //         }
                //     }
                //     console.log('')
                //     // นำค่าว่างเข้า array
                //     status_result_array.push('')
                //     assertion_result_array.push('')
                // } else {
                //     // แสดงข้อมูลหัวที่เช็ค
                //     console.log(expectedvalue[0].label)
                //     assertion_result_array.push(expectedvalue[0].label)
                //     // เช็คข้อมูลบนหน้าจอ กับ Expected แบบ 1:1
                //     // loop ตามข้อมูล data ใน array
                //     for (const [i, expectedarray] of expectedvalue.entries()) {
                //         // ใช้ function เช็คข้อมูล expected กับ หน้าจอ
                //         result = await checkvalueexpected.checkvalueOndatabase(locator, expectedarray.data[i][i], expectedarray.policy_no);
                //         // นำค่า status ที่ return เข้า array
                //         status_result_array.push(result.status_result)
                //         // นำค่า assertion ที่ return เข้า array
                //         assertion_result_array.push(result.assertion_result)
                //     }
                //     console.log('')
                //     // นำค่าว่างเข้า array
                //     status_result_array.push('')
                //     assertion_result_array.push('')
                // }
            } else { }
        }
        return { status_result_array, assertion_result_array }
    }
}