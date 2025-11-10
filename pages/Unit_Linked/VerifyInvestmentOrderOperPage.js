// utils
const { selectDate } = require('../../utils/calendarHelper.js');

// locators
const { search_verify_InvestmentOrderOper, table_verify_InvestmentOrderOper, dialog_verify_InvestmentOrderOper } = require('../../locators/Unit_Linked/VerifyInvestmentOrderOper.locators.js');

class VerifyInvestmentOrderOperPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.search_verify_investmentorderoper = search_verify_InvestmentOrderOper(page);
        this.table_verify_investmentorderoper = table_verify_InvestmentOrderOper(page);
        this.dialog_verify_investmentorderoper = dialog_verify_InvestmentOrderOper(page);
    }

    async search_waiting_VerifyInvestmentOrderOper(data) {

    }

    async search_verify_VerifyInvestmentOrderOper(data) {
        // เลือกวันที่ส้งคำสั่ง
        await selectDate(this.page, data.date, this.search_verify_investmentorderoper.verify_investmentorderoper_btnDatePicker);
        // กดปุ่ม ค้นหา
        await this.search_verify_investmentorderoper.verify_investmentorderoper_btnSearch.click({ timeout: 10000 });
        // รอโหลดตาราง
        await this.page.waitForLoadState('networkidle');
    }

    async click_verify_VerifyInvestmentOrderOperCheckButton(data) {
        // รอให้ตารางแสดงผล
        await this.expect(this.table_verify_investmentorderoper.verify_investmentorderoper_tblCheckbox(data.transactionno).nth(0)).toBeVisible({ timeout: 60000 });
        // นับจำนวนบรรทัดในตาราง ที่มี transaction no ตรงกับที่ส่งมา
        const row = this.table_verify_investmentorderoper.verify_investmentorderoper_tblCheckbox(data.transactionno);
        const count = await row.count();

        for (let i = 0; i < count; i++) {
            // เลือก checkbox ตาม transaction no
            await row.nth(i).locator('input[type="checkbox"]').check({ timeout: 10000 });
        }
    }

    async confirm_verify_VerifyInvestmentOrderOper() {
        // กดปุ่ม ยืนยันคำสั่งขาย
        await this.table_verify_investmentorderoper.verify_investmentorderoper_btnconfirmorder.click({ timeout: 10000 });
        // รอ dialog ยืนยันคำสั่งขายขึ้นมา
        await this.expect(this.dialog_verify_investmentorderoper.verify_investmentorderoper_confirmorderinvestment).toBeVisible({ timeout: 60000 });
        await this.dialog_verify_investmentorderoper.verify_investmentorderoper_confirmorderinvestment.getByText('ใช่', { exact: true }).click({ timeout: 10000 });
        // รอ dialog หายไป
        await this.expect(this.dialog_verify_investmentorderoper.verify_investmentorderoper_confirmorderinvestment).not.toBeVisible({ timeout: 60000 });

        // รอ dialog กรอกเหตุผล cutoff ขึ้นมา
        await this.page.waitForTimeout(1000);

        const check_cutoff = await this.dialog_verify_investmentorderoper.verify_investmentorderoper_comment_cutoff.isVisible({ timeout: 10000 });
        if (check_cutoff) {
            // รอ dialog กรอกเหตุผล cutoff ขึ้นมา
            await this.expect(this.dialog_verify_investmentorderoper.verify_investmentorderoper_comment_cutoff).toBeVisible({ timeout: 60000 });
            // คลิ๊กช่อง เหตุผล cutoff
            await this.dialog_verify_investmentorderoper.verify_investmentorderoper_comment_cutoff.click({ timeout: 10000 });

            // กรอกเหตุผล cutoff
            await this.dialog_verify_investmentorderoper.verify_investmentorderoper_comment_cutoff_txtreason.evaluate((el, value) => {
                el.value = value; // ตั้งค่าข้อความใน textarea
                // ยิง event เหมือนผู้ใช้พิมพ์จริง
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('keyup', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }, 'ทดสอบ');

            // กดปุ่ม ส่งคำสั่งวันนี้
            await this.dialog_verify_investmentorderoper.verify_investmentorderoper_comment_cutoff.getByText('ส่งคำสั่งวันนี้', { exact: true }).click({ timeout: 10000 });
        }

        // รอ popup ยืนยันรายการคำสั่งขาย เรียบร้อย ขึ้นมา
        await this.expect(this.dialog_verify_investmentorderoper.verify_investmentorderoper_successpopup).toBeVisible({ timeout: 60000 });
        await this.dialog_verify_investmentorderoper.verify_investmentorderoper_successpopup.getByText('ตกลง', { exact: true }).click({ timeout: 10000 });
        // รอ popup หายไป
        await this.expect(this.dialog_verify_investmentorderoper.verify_investmentorderoper_successpopup).not.toBeVisible({ timeout: 60000 });
    }
}

module.exports = { VerifyInvestmentOrderOperPage };