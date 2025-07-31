const { test, expect } = require('@playwright/test');
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');
const { LoginPageSPLife } = require('../../pages/login_t.page');
const { menuSPLife } = require('../../pages/SP_Life/menu_splife');
const { mainSPLife } = require('../../pages/SP_Life/main_splife');
const { quotationSPLife } = require('../../pages/SP_Life/quotation_splife');
const { uploadGoogleSheet } = require('../../utils/uploadresult-google-sheet');
const { popupAlert } = require('../../utils/common');


test.describe.only('SP Life Insurance Premium Calculation Tests', () => {

    // กำหนดช่วงแถวที่ต้องการทดสอบ
    const ranges = [
        { start: 7, end: 2116 }, // ทดสอบแถวเดียว

        // // // 3 เครื่อง แบ่งเป็นช่วงละ 704 โดยเริ่มที่ 7
        // { start: 7, end: 710 }, // ช่วงแรก (704)
        // { start: 711, end: 1414 }, // ช่วงที่สอง (704)
        // { start: 1415, end: 2116 }, // ช่วงที่สาม (702)

        // // 5 เครื่อง แบ่งเป็นช่วงละ 422 โดยเริ่มที่ 7
        // { start: 7, end: 428 }, // ช่วงแรก (422)
        // { start: 429, end: 850 }, // ช่วงที่สอง (422)
        // { start: 851, end: 1272 }, // ช่วงที่สาม (422)
        // { start: 1273, end: 1694 }, // ช่วงที่สี่ (422)
        // { start: 1695, end: 2116 }, // ช่วงที่ห้า (422)

        // // 10 เครื่อง แบ่งเป็นช่วงละ 211 โดยเริ่มที่ 7
        // { start: 7, end: 218 }, // ช่วงแรก (211)
        // { start: 219, end: 430 }, // ช่วงที่สอง (211)
        // { start: 431, end: 642 }, // ช่วงที่สาม (211)
        // { start: 643, end: 854 }, // ช่วงที่สี่ (211)
        // { start: 855, end: 1066 }, // ช่วงที่ห้า (211)
        // { start: 1067, end: 1278 }, // ช่วงที่หก (211)
        // { start: 1279, end: 1490 }, // ช่วงที่เจ็ด (211)
        // { start: 1491, end: 1702 }, // ช่วงที่แปด (211)
        // { start: 1703, end: 1914 }, // ช่วงที่เก้า (211)
        // { start: 1915, end: 2116 }, // ช่วงที่สิบ (202)

        // // 6 เครื่อง แบ่งเป็นช่วงละ 100 โดยเริ่มที่ 7
        // { start: 7, end: 106 }, // ช่วงแรก (100)
        // { start: 107, end: 206 }, // ช่วงที่สอง (100)
        // { start: 207, end: 306 }, // ช่วงที่สาม (100)
        // { start: 307, end: 406 }, // ช่วงที่สี่ (100)
        // { start: 407, end: 506 }, // ช่วงที่ห้า (100)
        // { start: 507, end: 606 }, // ช่วงที่หก (100)
    ];

    // // ดึง worker index (0,1,2,...)
    // const workerIndex = parseInt(process.env.PLAYWRIGHT_WORKER_INDEX || '0');

    for (const [index, row] of ranges.entries()) {
        test(`Calculate Insurance Premium - Worker ${index + 1}`, async ({ page }) => {
            // กำหนดเวลา timeout สำหรับ test case นี้เป็น 24 ชั่วโมง (86400000 มิลลิวินาที)
            test.setTimeout(7200000);

            console.log(`Worker ${index + 1} processing rows from ${row.start} to ${row.end}`);

            const startTime = Date.now();  // เริ่มจับเวลา

            const googlesheet = new GoogleSheet();
            const loginpagesplife = new LoginPageSPLife(page);
            const menusplife = new menuSPLife(page, expect);
            const mainsplife = new mainSPLife(page, expect);
            const quotationsplife = new quotationSPLife(page, expect);
            const uploadgooglesheet = new uploadGoogleSheet(page, expect);

            const popupalert = new popupAlert(page);

            // เริ่มต้น Auth
            const auth = await googlesheet.initAuth();

            // ส่ง spreadsheetId และ range มาจากไฟล์ test (สำหรับ Read และ Update)
            const spreadsheetId = '1fWFSP2pmzV1QBVxoYbyxzb4XDQbcWflB7gLdW94jARY';
            const startrange = parseInt(row.start || process.env.ROW_START || '7');
            const endrange = parseInt(row.end || process.env.ROW_END || '14');
            const readrange = `Prepare_TestData_Playwright!A${startrange}:P${endrange}`;

            // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
            const spreadsheetId_write = '1sr4Rh_V67SK_eRJriqT5j4X03lzulifCfqE7Q5BV_wk';
            const range_write = `Log_Raw!A:E`;

            // อ่านข้อมูลสำหรับการเข้าสู่ระบบ
            const datalogin = await googlesheet.fetchSheetData(auth, spreadsheetId, 'Prepare_TestData_Playwright!B1:B2');

            // อ่านข้อมูลสำหรับ test data
            const data = await googlesheet.fetchSheetData(auth, spreadsheetId, readrange);
            // // console.table(data);
            // console.log('Fetched data:\n', data, '\n จำนวนแถว:', data.length, '\n จำนวนคอลัมน์:', data[0].length);

            // Navigate to the website
            await loginpagesplife.gotoSPLife();
            // กรอก username และ password
            await loginpagesplife.login(datalogin[0][0], datalogin[1][0]);
            // Wait for the page to load completely
            await page.waitForLoadState('networkidle');

            // รอให้ pop-up แจ้งเตือนปรากฏ
            await popupalert.popupAlertMessage();

            // // กดเมนูหลัก
            // await menusplife.menuSPLife('รายงานการทำประกันชีวิต');

            // กดปุ่ม สร้างใบเสนอราคา
            await mainsplife.clickcreateQuotation();

            // รอหน้า "สร้างใบเสนอราคา" โหลด
            await quotationsplife.waitforquotationPageLoad();

            // สร้าง array สำหรับเก็บผลลัพธ์
            let combined_result_array = []

            for (const row in data) {

                let popupmessagearray = []; // Array สำหรับเก็บข้อความ pop-up แจ้งเตือน

                const rowdata = data[row][0]; // ข้อมูลแถวปัจจุบัน
                const insurancegroup = data[row][1]; // กลุ่มแบบประกัน
                const insurancename = data[row][2]; // ชื่อแบบประกัน
                const unisex = data[row][3]; // เพศ
                const age = data[row][4]; // อายุ
                const idcard = data[row][13]; // เลขบัตรประชาชน
                const titlename = data[row][10]; // คำนำหน้า
                const name = data[row][11]; // ชื่อผู้เอาประกันภัย
                const surname = data[row][12]; // นามสกุลผู้เอาประกันภัย
                const birthdate = data[row][9]; // วันเกิดผู้เอาประกันภัย
                const insurancesum = data[row][14]; // จำนวนเงินทุนประกันภัย
                const coverageYear = data[row][5]; // ระยะเวลาคุ้มครอง
                const expectedinsurancesum = data[row][15]; // ค่าที่คาดหวังสำหรับจำนวนเงินเอาประกันภัย

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

                // เลือกแบบประกันตามข้อมูลในแถว
                const quotationspliferesult = await quotationsplife.selectInsurancePlan(insurancename);

                // กรอกข้อมูลผู้เอาประกันภัย
                const insuredInformationresult = await quotationsplife.insuredInformation(idcard, titlename, name, surname, birthdate, formattedExpireDate, mobileno);

                // คำนวณเบี้ยประกันภัยและวิธีการชำระเบี้ย
                const quotation_result = await quotationsplife.calculatepremiumandpaymentmode(insurancesum, coverageYear, expectedinsurancesum, datalogin[0][0], datalogin[1][0]); // กรอกจำนวนเงินเอาประกันภัย และระยะเวลาคุ้มครอง

                let result_format_array_quotationspliferesult = quotationspliferesult.popuparray
                    .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                    .join(' | ');

                let result_format_array_insuredInformationresult = insuredInformationresult.popuparray
                    .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                    .join(' | ');

                let result_format_array_quotation_result = quotation_result.popuparray
                    .filter(item => item) // กรองเฉพาะค่าที่ไม่เป็น falsy ('' / null / undefined / 0 / false)
                    .join(' | ');

                // เอา assertion result และ status มาเก็บใน array
                combined_result_array.push([rowdata, quotation_result.checkvalue.status_result, `${quotation_result.checkvalue.assertion_result} | ประเภท : ${insurancegroup} | ชื่อแบบประกัน : ${insurancename} | เพศ : ${unisex} | อายุ : ${age} | ทุน : ${insurancesum} | coverage : ${coverageYear} |`, getBangkokTimestamp(), `${result_format_array_quotationspliferesult} | ${result_format_array_insuredInformationresult} | ${result_format_array_quotation_result}`]);

                const endTime = Date.now();    // จบจับเวลา
                const duration = (endTime - startTime) / 1000; // วินาที
                console.log(`Test case รันไปทั้งหมด ${duration} วินาที`);
            }

            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ผ่าน range ที่กำหนด
            // await googlesheet.updateRows(auth, spreadsheetId, `Prepare_TestData_Playwright!R${startrange}:U${endrange}`, combined_result_array);

            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
            await googlesheet.appendRows(auth, spreadsheetId_write, range_write, combined_result_array);

            console.log(`Worker ${index + 1} completed processing rows from ${row.start} to ${row.end}`);

        });
    }

});

// test('Calculate Insurance Premium', async ({ page }) => {
//     // กำหนดเวลา timeout สำหรับ test case นี้เป็น 24 ชั่วโมง (86400000 มิลลิวินาที)
//     test.setTimeout(86400000);

//     // เลือกช่วง row สำหรับ worker นี้ (ถ้า worker มากกว่าช่วงที่กำหนด จะใช้ช่วงแรกเป็น default)
//     const { start, end } = ranges[workerIndex] || ranges[0];

//     console.log(`Worker ${workerIndex} processing rows from ${start} to ${end}`);

//     const startTime = Date.now();  // เริ่มจับเวลา

//     const googlesheet = new GoogleSheet();
//     const loginpagesplife = new LoginPageSPLife(page);
//     const menusplife = new menuSPLife(page, expect);
//     const mainsplife = new mainSPLife(page, expect);
//     const quotationsplife = new quotationSPLife(page, expect);
//     const uploadgooglesheet = new uploadGoogleSheet(page, expect);

//     // เริ่มต้น Auth
//     const auth = await googlesheet.initAuth();

//     // ส่ง spreadsheetId และ range มาจากไฟล์ test (สำหรับ Read และ Update)
//     const spreadsheetId = '1fWFSP2pmzV1QBVxoYbyxzb4XDQbcWflB7gLdW94jARY';
//     const startrange = parseInt(start || process.env.ROW_START || '7');
//     const endrange = parseInt(end || process.env.ROW_END || '14');
//     const readrange = `Prepare_TestData_Playwright!B${startrange}:P${endrange}`;

//     // spreadsheetId สำหรับการอัพโหลดผลลัพธ์ (สำหรับ write)
//     const spreadsheetId_write = '1sr4Rh_V67SK_eRJriqT5j4X03lzulifCfqE7Q5BV_wk';
//     const range_write = `Log_Raw!A:D`;

//     // อ่านข้อมูลสำหรับการเข้าสู่ระบบ
//     const datalogin = await googlesheet.fetchSheetData(auth, spreadsheetId, 'Prepare_TestData_Playwright!B1:B2');

//     // อ่านข้อมูลสำหรับ test data
//     const data = await googlesheet.fetchSheetData(auth, spreadsheetId, readrange);
//     // // console.table(data);
//     // console.log('Fetched data:\n', data, '\n จำนวนแถว:', data.length, '\n จำนวนคอลัมน์:', data[0].length);

//     // Navigate to the website
//     await loginpagesplife.gotoSPLife();
//     // กรอก username และ password
//     await loginpagesplife.login(datalogin[0][0], datalogin[1][0]);
//     // Wait for the page to load completely
//     await page.waitForLoadState('networkidle');

//     // // กดเมนูหลัก
//     // await menusplife.menuSPLife('รายงานการทำประกันชีวิต');

//     // กดปุ่ม สร้างใบเสนอราคา
//     await mainsplife.clickcreateQuotation();

//     // รอหน้า "สร้างใบเสนอราคา" โหลด
//     await quotationsplife.waitforquotationPageLoad();

//     // สร้าง array สำหรับเก็บผลลัพธ์
//     let combined_result_array = []

//     for (const row in data) {

//         const insurancegroup = data[row][0]; // กลุ่มแบบประกัน
//         const insurancename = data[row][1]; // ชื่อแบบประกัน
//         const unisex = data[row][2]; // เพศ
//         const age = data[row][3]; // อายุ
//         const idcard = data[row][12]; // เลขบัตรประชาชน
//         const titlename = data[row][9]; // คำนำหน้า
//         const name = data[row][10]; // ชื่อผู้เอาประกันภัย
//         const surname = data[row][11]; // นามสกุลผู้เอาประกันภัย
//         const birthdate = data[row][8]; // วันเกิดผู้เอาประกันภัย
//         const insurancesum = data[row][13]; // จำนวนเงินทุนประกันภัย
//         const coverageYear = data[row][4]; // ระยะเวลาคุ้มครอง
//         const expectedinsurancesum = data[row][14]; // ค่าที่คาดหวังสำหรับจำนวนเงินเอาประกันภัย

//         const today = new Date();
//         // เพิ่ม 1 ปีจากวันนี้
//         const expireDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
//         // แปลงเป็นวัน/เดือน/ปี (พ.ศ.)
//         const day = String(expireDate.getDate()).padStart(2, '0');
//         const month = String(expireDate.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
//         const year = expireDate.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
//         const formattedExpireDate = `${day}/${month}/${year}`;

//         const mobileno = '0987654321'; // เบอร์โทรศัพท์

//         function getBangkokTimestamp() {
//             const now = new Date();
//             const bangkokTime = now.toLocaleString("sv-SE", {
//                 timeZone: "Asia/Bangkok",
//                 hour12: false
//             });

//             return bangkokTime;
//         }

//         // เลือกแบบประกันตามข้อมูลในแถว
//         await quotationsplife.selectInsurancePlan(insurancename);

//         // กรอกข้อมูลผู้เอาประกันภัย
//         await quotationsplife.insuredInformation(idcard, titlename, name, surname, birthdate, formattedExpireDate, mobileno);

//         // คำนวณเบี้ยประกันภัยและวิธีการชำระเบี้ย
//         const quotation_result = await quotationsplife.calculatepremiumandpaymentmode(insurancesum, coverageYear, expectedinsurancesum); // กรอกจำนวนเงินเอาประกันภัย และระยะเวลาคุ้มครอง

//         // เอา assertion result และ status มาเก็บใน array
//         combined_result_array.push([quotation_result.checkvalue.status_result, `${quotation_result.checkvalue.assertion_result} | ประเภท : ${insurancegroup} | ชื่อแบบประกัน : ${insurancename} | เพศ : ${unisex} | อายุ : ${age} | ทุน : ${insurancesum} | coverage : ${coverageYear} |`, getBangkokTimestamp(), quotation_result.popupmessage]);

//         const endTime = Date.now();    // จบจับเวลา
//         const duration = (endTime - startTime) / 1000; // วินาที
//         console.log(`Test case รันไปทั้งหมด ${duration} วินาที`);
//     }

//     // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ผ่าน range ที่กำหนด
//     // await googlesheet.updateRows(auth, spreadsheetId, `Prepare_TestData_Playwright!R${startrange}:U${endrange}`, combined_result_array);

//     // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ append ที่ range ที่กำหนด แบบต่อท้าย โดยจะไม่ลบข้อมูลเก่าใน Google Sheet
//     await googlesheet.appendRows(auth, spreadsheetId_write, range_write, combined_result_array);

// });