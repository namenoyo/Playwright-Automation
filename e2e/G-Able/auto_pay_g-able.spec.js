const { test, expect} = require('@playwright/test');

const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');

test('G-Able Auto Pay', async ({ page }, testInfo) => {
    // ตั้งค่า timeout สำหรับการทดสอบ
    test.setTimeout(7200000); // 2 ชั่วโมง

    let testData = [];

    const googlesheet = new GoogleSheet();
    const auth = await googlesheet.initAuth();
    const spreadsheetId = '1N1syAS-2IoWYwV3Wtd8rnKz1XBv9Z6zJ9V2N01nKcfQ';
    const sheetname = `Data_Auto_G-able`;
    const readrange = `${sheetname}!A1:AZ1000000`;
    testData = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);
    const sheetnamewrite = sheetname;
    const range_write = `A1:AZ`;

    // กรองเอาเฉพาะเคสที่สถานะไม่ใช่ Finish, Not Start, Error
    const denyStatus = ['Finish','Not Start','Error'];
    const result_new_array_status_not_finish = testData.filter(x => !denyStatus.includes(x.Status));

    // กรองเอาเฉพาะเคสที่ DATA USER BY ที่กำหนดเท่านั้น
    const allowUser = ['Top'];
    const result_filter_user = result_new_array_status_not_finish.filter(x => allowUser.includes(x["Create By"]));

    for (const [index, data] of result_filter_user.entries()) {

        // เตรียมตัวแปรเก็บผลลัพธ์
        let data_create = [];

        // ชื่อ header key สำหรับการอ้างอิงข้อมูล
        const uniquekey = 'Unique No';
        const row_header = 1; // บวก 4 เพราะข้อมูลเริ่มที่แถวที่ 4 ใน Google Sheet
        const row_uniquekey = data['Unique No'];

        const username = data['Username'];
        const password = data['Password'];
        const env = data['ENV'];
        const policyno = data['Policy No'];
        const modepayment = data['Mode Payment'];
        const paymenttype = data['ประเภทการชำระ'];
        const process = data['Status'];

        if (process === 'Waiting for Pay Auto' || process === 'In Progress') {
            try {
                // เริ่มทำการ Pay G-Able Auto Pay
                console.log(`\nเริ่มทำการ Pay G-Able Auto Pay for Unique No: ${row_uniquekey}`);

                // อัพเดท Status เป็น In Progress
                data_create.push({ [uniquekey]: row_uniquekey, Status: 'In Progress', Remark: '' });
                // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                // เคลียร์ array หลังอัพโหลด
                data_create = [];

                // --------------------------------------------------------------------------------------------- //

                // เข้า้สู่ระบบ G-Able
                if (env === 'SIT') {
                    await page.goto('http://sitreceipt-combine.thaisamut.co.th:2552/stock-combine_sit/index.aspx');
                    await page.waitForLoadState('networkidle');
                } else if (env === 'UAT') {
                    await page.goto('http://uatreceipt-combine.thaisamut.co.th:2552/stock-combine_uat/index.aspx');
                    await page.waitForLoadState('networkidle');
                }
                // กรอก Username Password
                await page.fill('#p_username', username);
                await page.fill('#p_password', password);
                // กดปุ่ม login
                await page.click('#LinkButton1');
                await page.waitForLoadState('networkidle');

                // --------------------------------------------------------------------------------------------- //

                // เข้าเมนูหลัก ระบบใบเสร็จรับเงิน
                // กดปุ่ม ระบบใบเสร็จรับเงิน
                await page.click('a:has-text("ระบบใบเสร็จรับเงิน")');
                await page.waitForLoadState('networkidle');

                // --------------------------------------------------------------------------------------------- //

                // Process พิมพ์ใบเสร็จให้ลูกค้า

                if (paymenttype === 'ลูกค้าชำระเอง') {
                    // เลือกเมนู ลูกค้าชำระเอง
                    await expect(page.getByText('ลูกค้าชำระเอง')).toBeVisible();
                    await page.getByText('ลูกค้าชำระเอง').click();
                    // เลือก พิมพ์ใบเสร็จให้ลูกค้า
                    await expect(page.getByRole('link', { name: 'พิมพ์ใบเสร็จให้ลูกค้า' })).toBeVisible();
                    await page.getByRole('link', { name: 'พิมพ์ใบเสร็จให้ลูกค้า' }).click();
                    await page.waitForLoadState('networkidle');

                    // กรอก เลขที่กรมธรรม์
                    await page.locator('#ctl00_ContentPlaceHolder1_txtPolicyNo').fill(policyno);
                    // กรอก โหมดชำระ
                    await page.locator('#ctl00_ContentPlaceHolder1_txtAmountPeriod').fill(modepayment);

                    // กดปุ่ม ค้นหา และรอโหลดข้อมูล
                    await Promise.all([
                        page.waitForResponse(response =>
                            response.url().includes('/receipt-combine/UI/CustomerPay.aspx?Flag=1') && response.status() === 200
                        ),
                        // กดปุ่ม ค้นหา
                        await page.locator('#ctl00_ContentPlaceHolder1_brnSearchCust').click()
                    ], { timeout: 500000 }); // รอไม่เกิน 500 วินาที
                    
                    // เลือก checkbox รายการทั้งหมด
                    const countcheckbox = await page.locator('#ctl00_ContentPlaceHolder1_dgCustomerPay > tbody > tr').count();
                    // console.log(`จำนวนแถวที่พบ: ${countcheckbox - 2} แถว`);
                    const processcount = countcheckbox - 2; // ลบ 2 ออกเพราะ 2 แถวเป็น header
                    for (let i = 0; i < processcount; i++) {
                        // เลือก checkbox แต่ละแถว
                        await Promise.all([
                            page.waitForResponse(response =>
                                response.url().includes('/receipt-combine/UI/CustomerPay.aspx?Flag=1') && response.status() === 200
                            ),
                            // กดปุ่ม เลือก checkbox
                            page.locator('#ctl00_ContentPlaceHolder1_dgCustomerPay > tbody > tr').nth(i + 2).locator('td > input[type="checkbox"]').check()
                        ], { timeout: 500000 }); // รอไม่เกิน 500 วินาที
                        
                    }

                    // เลือก dropdown stock ใบเสร็จ และรอโหลดข้อมูล
                    await Promise.all([
                        page.waitForResponse(response =>
                            response.url().includes('/receipt-combine/UI/CustomerPay.aspx?Flag=1') && response.status() === 200
                        ),
                        // เลือก dropdown stock ใบเสร็จ
                        await page.locator('#ctl00_ContentPlaceHolder1_ddlStock').selectOption('0')
                    ], { timeout: 500000 }); // รอไม่เกิน 500 วินาที


                    // เช็คว่ามีเลข stock แสดงแล้วหรือยัง จากคำว่า - จนแสดงเปลี่ยนเป็นเลข stock จริง
                    await expect(page.locator('#ctl00_ContentPlaceHolder1_lblStockReceiptNo')).not.toHaveText('-', { timeout: 500000 }); // รอไม่เกิน 500 วินาที
                    // ดึงค่าเลข stock ใบเสร็จ
                    const stock_receipt_no = await page.locator('#ctl00_ContentPlaceHolder1_lblStockReceiptNo').innerText();

                    // อัพเดท เลขที่ Stock
                    data_create.push({ [uniquekey]: row_uniquekey, ["เลขที่ Stock"]: stock_receipt_no });
                    // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                    await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                    // เคลียร์ array หลังอัพโหลด
                    data_create = [];

                    // กรอก เลขที่ Stock ใบเสร็จ
                    await page.locator('#ctl00_ContentPlaceHolder1_txtStockMaxReceiptNo').fill(stock_receipt_no);
                    await page.waitForTimeout(500);

                    // สมมติว่าคุณมีปุ่มที่เปิด tab ใหม่
                    const [tab1] = await Promise.all([
                        page.context().waitForEvent('page'),  // รอให้มี tab ใหม่

                        // จัดการ dialog ยืนยัน
                        page.on('dialog', async dialog => {
                            await dialog.accept();
                        }),
                        // กดปุ่ม ทำรายการ
                        await page.locator('#ctl00_ContentPlaceHolder1_btnPrint').click()
                    ]);

                    // รอให้หน้าใหม่โหลดเสร็จ
                    await tab1.waitForLoadState('networkidle');
                    // กดปุ่ม ยกเลิก
                    await tab1.locator('#btnCancel').click();
                    await tab1.waitForEvent('close');
                    console.log('Tab has been closed');

                }

            } catch (error) {
                if (testInfo.retry === testInfo.project.retries) { // ถ้าเป็นการรันครั้งสุดท้าย (ไม่ว่าจะผ่านหรือไม่ผ่าน)

                    // อัพเดท Remark เป็น error.message
                    data_create.push({ [uniquekey]: row_uniquekey, Status: 'Error', Remark: error.message });
                    // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                    await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                    // เคลียร์ array หลังอัพโหลด
                    data_create = [];

                }
                throw error; // ต้องโยนออกไปให้ระบบนับว่า fail จะได้ retry
            }
        }
    }

    const gable_sit = 'http://sitreceipt-combine.thaisamut.co.th:2552/stock-combine_sit/index.aspx';
    const gable_uat = 'http://uatreceipt-combine.thaisamut.co.th:2552/stock-combine_uat/index.aspx';
});