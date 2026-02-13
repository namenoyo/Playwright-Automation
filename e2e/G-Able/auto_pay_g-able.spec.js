const { test, expect } = require('@playwright/test');

const pdfParse = require('pdf-parse');

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

                    if (data['เลขที่ Stock'] === '') {
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
                                response.url().includes('/receipt-combine/UI/CustomerPay') && response.status() === 200
                            ),
                            // กดปุ่ม ค้นหา
                            await page.locator('#ctl00_ContentPlaceHolder1_brnSearchCust').click()
                        ], { timeout: 500000 }); // รอไม่เกิน 500 วินาที
                        await expect(page.locator('#ctl00_ContentPlaceHolder1_dgCustomerPay')).toBeVisible({ timeout: 500000 });

                        // เลือก checkbox รายการทั้งหมด
                        const countcheckbox = await page.locator('#ctl00_ContentPlaceHolder1_dgCustomerPay > tbody > tr').count();
                        // console.log(`จำนวนแถวที่พบ: ${countcheckbox - 2} แถว`);
                        const processcount = countcheckbox - 2; // ลบ 2 ออกเพราะ 2 แถวเป็น header
                        for (let i = 0; i < processcount; i++) {
                            const context = page.context();

                            const newPagePromise = context.waitForEvent('page', { timeout: 10000 }).catch(() => null);

                            const responsePromise = page.waitForResponse(response =>
                                response.url().includes('/receipt-combine/UI/CustomerPay') &&
                                response.status() === 200
                            );

                            await Promise.all([
                                responsePromise,
                                newPagePromise,
                                page.locator('#ctl00_ContentPlaceHolder1_dgCustomerPay > tbody > tr')
                                    .nth(i + 2)
                                    .locator('td > input[type="checkbox"]')
                                    .check({ timeout: 5000 })
                            ], { timeout: 500000 });

                            const newPage = await newPagePromise;
                            if (newPage) {
                                // console.log('>> New tab detected:', newPage.url());
                                await newPage.waitForLoadState('networkidle');
                                // กดปุ่ม ยืนยัน ใน tab ใหม่
                                await newPage.locator('#btnconfirm').click({ timeout: 5000 });
                                // รอให้ tab ใหม่ ปิดตัวเอง
                                await newPage.waitForEvent('close', { timeout: 10000 });
                            }
                        }

                        // เลือก dropdown stock ใบเสร็จ และรอโหลดข้อมูล
                        await Promise.all([
                            page.waitForResponse(response =>
                                response.url().includes('/receipt-combine/UI/CustomerPay') && response.status() === 200
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

                        // จัดการ dialog ยืนยัน
                        page.once('dialog', async dialog => {
                            await dialog.accept();
                        });

                        // สมมติว่าคุณมีปุ่มที่เปิด tab ใหม่
                        const [tab1] = await Promise.all([
                            page.context().waitForEvent('page'),  // รอให้มี tab ใหม่

                            // กดปุ่ม ทำรายการ
                            await page.locator('#ctl00_ContentPlaceHolder1_btnPrint').click()
                        ]);

                        // รอให้หน้าใหม่โหลดเสร็จ   
                        await tab1.waitForLoadState('networkidle');

                        // สมมติว่าคุณมีปุ่มที่เปิด tab ใหม่
                        const [tab2] = await Promise.all([
                            tab1.context().waitForEvent('page'),  // รอให้มี tab ใหม่
                            // กดปุ่ม ตกลง
                            tab1.locator('#btnconfirm').click({ timeout: 5000 })
                        ]);

                        // รอให้หน้าใหม่โหลดเสร็จ
                        await tab2.waitForLoadState('networkidle');

                        // // กดปุ่ม ยกเลิก
                        // await tab1.locator('#btnCancel').click();
                        // await tab1.waitForEvent('close');
                        // console.log('Tab has been closed');

                        // บางระบบจะ redirect ไป PDF อีกที รอให้ URL เป็น .pdf
                        await tab2.waitForURL(/\.pdf/i);

                        const pdfUrl = tab2.url();
                        console.log('PDF URL:', pdfUrl);

                        // ใช้ context เดิม (session + cookie เดิม)
                        const response = await tab2.context().request.get(pdfUrl, {
                            ignoreHTTPSErrors: true
                        });

                        const buffer = await response.body();

                        // อ่าน PDF
                        const data = await pdfParse(buffer);

                        console.log('----- PDF TEXT -----');
                        const text = data.text;
                        // const match = text.match(/เลขที่\s*[\r\n]+\s*(\d+)/);
                        // const documentNo = match ? match[1] : null;
                        // console.log('เลขที่:', documentNo);

                        // หาเลขที่อยู่หลังคำว่า "เลขที่"
                        const matches = [...text.matchAll(/เลขที่\s*[\r\n\s]*?(\d{6,})/g)];
                        // ดึงเฉพาะตัวเลข (group ที่ 1)
                        const numbers = matches.map(m => m[1]);
                        // ตัดค่าซ้ำ
                        const uniqueNumbers = [...new Set(numbers)];
                        // รวมด้วย ,
                        const documentNo = uniqueNumbers.join('\n');
                        console.log('เลขที่:', documentNo);

                        // ปิด tab2
                        await tab2.close();

                        // อัพเดท Status เป็น In Progress
                        data_create.push({ [uniquekey]: row_uniquekey, ['เลขที่ใบเสร็จ']: documentNo });
                        // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                        await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                        // เคลียร์ array หลังอัพโหลด
                        data_create = [];

                    }

                    // --------------------------------------------------------------------------------------------- //

                    // Process รับชำระเงินจากลูกค้า

                    // ดึงค่า เลขที่ Stock จาก Google Sheet ตาม Unique No
                    const data_present = await googlesheet.fetchSheetData_key_rows(
                        auth,
                        spreadsheetId,
                        readrange,
                        null,
                        null,
                        row => {
                            return (row['Unique No'] || '').trim() === (row_uniquekey || '').trim();
                        }
                    );
                    const present_stock_receipt_no = data_present[0]['เลขที่ Stock'];
                    const present_receipt_no = data_present[0]['เลขที่ใบเสร็จ'];

                    if (present_stock_receipt_no || present_receipt_no) {
                        // เลือกเมนู ลูกค้าชำระเอง
                        await expect(page.getByText('ลูกค้าชำระเอง')).toBeVisible();
                        await page.getByText('ลูกค้าชำระเอง').click();
                        // เลือก รับชำระเงินจากลูกค้า
                        await expect(page.getByRole('link', { name: 'รับชำระเงินจากลูกค้า' })).toBeVisible();
                        await page.getByRole('link', { name: 'รับชำระเงินจากลูกค้า' }).click();
                        await page.waitForLoadState('networkidle');

                        // เลือก checkbox รายการทั้งหมด ที่เลข stock ตรงกัน
                        const countcheckbox_stock = await page.locator('#ctl00_ContentPlaceHolder1_dgReceipt > tbody > tr').count();
                        // console.log(`จำนวนแถวที่พบ: ${countcheckbox_stock - 2} แถว`);
                        const processcount_stock = countcheckbox_stock - 2; // ลบ 2 ออกเพราะ 2 แถวเป็น header
                        for (let i = 0; i < processcount_stock; i++) {
                            const policyno_in_table = await page.locator('#ctl00_ContentPlaceHolder1_dgReceipt > tbody > tr').nth(i + 2).locator('td').nth(1).innerText();
                            if (policyno_in_table === policyno) {
                                // เลือก checkbox แต่ละแถว
                                await Promise.all([
                                    page.waitForResponse(response =>
                                        response.url().includes('/receipt-combine/UI/ConfirmReceiptCustomer.aspx') && response.status() === 200
                                    ),
                                    // กดปุ่ม เลือก checkbox
                                    page.locator('#ctl00_ContentPlaceHolder1_dgReceipt > tbody > tr').nth(i + 2).locator('td > input[type="checkbox"]').check({ timeout: 5000 })
                                ], { timeout: 500000 }); // รอไม่เกิน 500 วินาที
                            }
                        }

                        // สมมติว่าคุณมีปุ่มที่เปิด tab ใหม่
                        const [tab3] = await Promise.all([
                            page.context().waitForEvent('page'),  // รอให้มี tab ใหม่
                            // กดปุ่ม ทำรายการ
                            page.locator('#ctl00_ContentPlaceHolder1_btnfirm').click({ timeout: 5000 })
                        ]);

                        // รอให้หน้าใหม่โหลดเสร็จ   
                        await tab3.waitForLoadState('networkidle');

                        // สมมติว่าคุณมีปุ่มที่เปิด tab ใหม่
                        const [tab4] = await Promise.all([
                            tab3.context().waitForEvent('page'),  // รอให้มี tab ใหม่
                            // กดปุ่ม ทำรายการ
                            tab3.locator('#btnconfirm').click({ timeout: 5000 })
                        ]);

                        // รอให้หน้าใหม่โหลดเสร็จ
                        await tab4.waitForLoadState('networkidle');

                        // กดปุ่ม เพิ่มรายการ
                        await Promise.all([
                            tab4.waitForResponse(response =>
                                response.url().includes('/receipt-combine/UI/ConfirmReceipt.aspx?SCase=C&FromPage=CusPay') && response.status() === 200
                            ),
                            // กดปุ่ม เพิ่มรายการ
                            tab4.locator('#btnAddtolist').click()
                        ], { timeout: 500000 }); // รอไม่เกิน 500 วินาที

                        const context = tab4.context();
                        // หา tab หลัก (ตัวที่ต้องการเก็บไว้)
                        const mainPage = context.pages().find(p => p !== tab4);
                        // dialog
                        tab4.once('dialog', async dialog => {
                            await dialog.accept();
                        });

                        // // debug
                        // tab4.on('close', () => {
                        //     console.log('tab4 closed');
                        // });

                        // click → เปิด PDF + tab4 จะปิด
                        await tab4.locator('#btSave').click();
                        // รอให้ tab4 ปิดก่อน
                        await tab4.waitForEvent('close').catch(() => { });
                        // รอให้ browser เปิด PDF ครบ (ใช้ page แทน context)
                        await mainPage.waitForTimeout(1500);
                        // ดู tab ทั้งหมด
                        const pages = context.pages();

                        let documentNo_t;

                        // console.log('Total tabs:', pages.length);
                        // ปิดทุก tab ที่ไม่ใช่ mainPage
                        for (const p of pages) {
                            if (p !== mainPage && !p.isClosed()) {
                                try {
                                    // บางระบบจะ redirect ไป PDF อีกที รอให้ URL เป็น .pdf
                                    await p.waitForURL(/\.pdf/i);

                                    const pdfUrl = p.url();
                                    console.log('PDF URL:', pdfUrl);

                                    // ใช้ context เดิม (session + cookie เดิม)
                                    const response = await p.context().request.get(pdfUrl, {
                                        ignoreHTTPSErrors: true
                                    });

                                    const buffer = await response.body();

                                    // อ่าน PDF
                                    const data = await pdfParse(buffer);

                                    console.log('----- PDF TEXT -----');
                                    const text = data.text;
                                    // แยกตามบรรทัด
                                    const lines = text.split(/\r?\n/);
                                    // เอาบรรทัดที่ 4 (index เริ่มที่ 0)
                                    documentNo_t = lines[10].trim();
                                    console.log('เลขที่:', documentNo_t);

                                    await p.close();
                                    // console.log('Closed extra tab:', p.url());
                                } catch { }
                            }
                        }
                        // กลับ tab หลัก
                        await mainPage.bringToFront();
                        // console.log('Back to main tab:', await mainPage.url());

                        // datetime finish time (yyyy-mm-dd hh:mm:ss)
                        const now = new Date();
                        const thTime = new Intl.DateTimeFormat('th-TH', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                            hour12: false, timeZone: 'Asia/Bangkok'
                        }).format(now);
                        // แปลงรูปแบบให้เป็น yyyy-mm-dd hh:mm:ss
                        const [d, t] = thTime.split(' ');
                        const [day, month, year] = d.split('/');
                        const FinishTimestamp = `${year}-${month}-${day} ${t}`;

                        // อัพเดท Status เป็น In Progress
                        data_create.push({ [uniquekey]: row_uniquekey, Status: 'Finish', ['เลขที่ใบนำส่ง']: documentNo_t, Remark: '', 'Finish Timestamp': FinishTimestamp });
                        // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
                        await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
                        // เคลียร์ array หลังอัพโหลด
                        data_create = [];

                    }

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
});