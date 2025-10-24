const { searchExpenseRecordAuditor, informationExpenseRecordAuditor } = require('../../locators/CoPayment/expense_record_auditor.locator');

export class ExpenseRecordAuditor {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async searchExpenseRecordAuditor(data) {
        const locator = searchExpenseRecordAuditor(this.page);

        // กรอก เลขที่รับเรื่องตรวจสอบสิทธิ์/เลขที่รับเรื่องบันทึกค่าใช้จ่าย
        if (data.expenserecordreceiptno) {
            await locator.expenserecordreceiptno.type(data.expenserecordreceiptno, { delay: 200 });
        }
        // คลิกปุ่ม ค้นหา
        await locator.searchExpenseRecordAuditorbutton.click({ timeout: 10000 });
        // รอให้ปุ่ม action ปรากฏขึ้น
        await this.expect(locator.actionexpenserecordbutton(data.expenserecordreceiptno)).toBeVisible({ timeout: 60000 });
        // คลิกปุ่ม ดำเนินการ
        await locator.actionexpenserecordbutton(data.expenserecordreceiptno).click({ timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
    }

    async informationExpenseRecordAuditor(data) {
        const locator = informationExpenseRecordAuditor(this.page);

        // Section ข้อมูลความจำเป็นทางการแพทย์ (เก็บสถิติสำหรับ CoPayment)
        // เลือก มีความจำเป็นต้อง Admit หรือไม่
        if (data.necessaryadmit) {
            // เลือก ไม่มี
            if (data.necessaryadmit === 'N') {
                await locator.necessaryadmit.nth(0).click({ timeout: 10000 });
                // เลือก มี
            } else if (data.necessaryadmit === 'Y') {
                await locator.necessaryadmit.nth(1).click({ timeout: 10000 });
            }
        }
        // เลือก ผ่าตัดใหญ่
        if (data.surgery) {
            // เลือก ไม่มี
            if (data.surgery === 'N') {
                await locator.surgery.nth(0).click({ timeout: 10000 });
                // เลือก มี
            } else if (data.surgery === 'Y') {
                await locator.surgery.nth(1).click({ timeout: 10000 });
            }
        }

        // Section ข้อมูลประกอบการพิจารณา
        // กรอก เหตุผลสำหรับออกจดหมายให้สถานพยาบาลและลูกค้า
        await locator.reasonslettershospital.type(data.remark_auditor, { delay: 200 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
    }

    async saveExpenseRecordAuditor() {
        const locator = informationExpenseRecordAuditor(this.page);

        // คลิกปุ่ม บันทึกและส่งพิจารณา
        await locator.savebutton.click({ timeout: 10000 });
        // ตรวจสอบว่ามี popup ผลรวมค่าใช้จ่ายที่ทำรายการ ไม่ตรงกับจำนวนเงินเรียกร้อง(ตั้งต้น) หรือไม่
        const popupText = await locator.popupform.textContent();
        if (popupText.includes('ผลรวมค่าใช้จ่ายที่ทำรายการ ไม่ตรงกับจำนวนเงินเรียกร้อง(ตั้งต้น)')) {
            // กดปุ่ม ปิด เพื่อปิด popup
            await locator.popupform.getByRole('button', { name: 'ปิด', exact: true }).click({ timeout: 10000 });
        }

        // ตรวจสอบว่ามี popup วันที่เกิดเหตุที่ระบุ เป็นเคลมย้อนหลังในปีกรมธรรม์ หรือไม่
        const popupText_before = await locator.popupform.textContent();
        if (popupText_before.includes('วันที่เกิดเหตุที่ระบุ เป็นเคลมย้อนหลังในปีกรมธรรม์')) {
            // กดปุ่ม ยืนยัน เพื่อปิด popup
            await locator.popupform.getByRole('button', { name: 'ยืนยัน', exact: true }).click({ timeout: 10000 });
        }

        // Section popup บันทึกสภาวะ
        // รอให้ popup บันทึกสภาวะ แสดง
        await this.expect(locator.popupformrecordcondition).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ไม่บันทึก
        await locator.notsaverecordconditionbutton.click({ timeout: 10000 });

        // Section popup บันทึกผลพิจารณา
        // รอให้ popup บันทึกผลการพิจารณา แสดง
        await this.expect(locator.popupformrecordconsideration).toBeVisible({ timeout: 60000 });
        // กดปุ่ม แก้ไข
        await locator.editactionbutton.click({ timeout: 10000 });
        // รอ popup บันทึกผลพิจารณา แสดง
        await this.expect(locator.subpopupformrecordconsideration).toBeVisible({ timeout: 60000 });
        // กรอก ผลการพิจารณา
        await locator.decisionconsideration.fill('อนุมัติ');
        // เลือก ผลการพิจารณา เป็น อนุมัติ
        await this.page.getByText('อนุมัติ', { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(700); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กรอก เหตุผลการพิจารณา
        await locator.reasonsconsideration.fill('อนุมัติสินไหม');
        // กดปุ่ม บันทึกและส่งพิจารณา
        await this.page.getByText('อนุมัติสินไหม', { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(700); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กรอก ความคิดเห็น
        await locator.commentsconsideration.fill('-', { delay: 200 });
        await this.page.waitForTimeout(700); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กดปุ่ม ยืนยัน บันทึกผลพิจารณา
        await locator.confirmrsubecordconsiderationbutton.click({ timeout: 10000 });
        // รอให้ popup บันทึกผลพิจารณา หายไป
        await this.expect(locator.subpopupformrecordconsideration).not.toBeVisible({ timeout: 60000 });
        // รอให้ popup บันทึกผลการพิจารณา แสดง
        await this.expect(locator.popupformrecordconsideration).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ยืนยัน บันทึกผลการพิจารณา
        await locator.confirmrecordconsiderationbutton.click({ timeout: 10000 });
        // รอให้ popup ยืนยันการทำรายการ แสดง
        await this.expect(locator.popupformconfirm).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ยืนยัน
        await locator.saveconfirmbutton.click({ timeout: 10000 });

        // ตรวจสอบว่ามีการเปิดหน้า popup ใหม่หรือไม่
        const [newPage] = await Promise.all([
            this.page.waitForEvent('popup'),
            // Section popup บันทึกข้อมูลสำเร็จ
            // รอหน้าจอ popup บันทึกข้อมูลสำเร็จ แสดง
            await this.expect(locator.savesuccessdialog).toBeVisible({ timeout: 60000 }),
            // กดปุ่ม ปิด
            await locator.closesavesuccessbutton.click({ timeout: 10000 }),
            // รอให้ popup บันทึกข้อมูลสำเร็จ หายไป
            await this.expect(locator.savesuccessdialog).not.toBeVisible({ timeout: 60000 }),
            // // รอ popup กรุณารอสักครู่... หายไป
            // await this.expect(this.page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 }),
            // await this.expect(this.page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 }),
        ]);
        // รอให้หน้าใหม่โหลดเสร็จ
        await newPage.waitForLoadState();
        // ปิดหน้า popup ใหม่
        await newPage.close({ timeout: 10000 });

    }
}

module.exports = { ExpenseRecordAuditor };