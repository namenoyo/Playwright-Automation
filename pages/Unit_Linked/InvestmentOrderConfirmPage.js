// utils
const { selectDate } = require('../../utils/calendarHelper.js');

const { search_InvestmentOrderConfirm, table_InvestmentOrderConfirm, dialog_InvestmentOrderConfirm } = require('../../locators/Unit_Linked/InvestmentOrderConfirm.locators.js');

class InvestmentOrderConfirmPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.search_investmentorderconfirm = search_InvestmentOrderConfirm(page);
        this.table_investmentorderconfirm = table_InvestmentOrderConfirm(page);
        this.dialog_investmentorderconfirm = dialog_InvestmentOrderConfirm(page);
    }

    async searchInvestmentOrderConfirm(data) {
        // เลือกวันที่ส้งคำสั่ง
        await selectDate(this.page, data.date, this.search_investmentorderconfirm.investmentorderconfirm_btnDatePicker);
        // กดปุ่ม ค้นหา
        await this.search_investmentorderconfirm.investmentorderconfirm_btnSearch.click({ timeout: 10000 });
    }

    async confirmInvestmentOrder(data) {
        // กดปุ่ม ยืนยัน ตาม invoice number
        await this.table_investmentorderconfirm.investmentorderconfirm_tblButtonConfirm(data.invoiceno).click();
        // รอ popup บันทึกการชำระเงินขึ้นมา
        await this.expect(this.dialog_investmentorderconfirm.investmentorderconfirm_popupConfirmOrder).toBeVisible({ timeout: 60000 });
        await this.dialog_investmentorderconfirm.investmentorderconfirm_popupConfirmOrder.getByText('ยืนยัน', { exact: true }).click({ timeout: 10000 });
        // รอ popup ยืนยันการชำระเงินขึ้นมา
        await this.expect(this.dialog_investmentorderconfirm.investmentorderconfirm_popupReConfirmOrder).toBeVisible({ timeout: 60000 });
        await this.dialog_investmentorderconfirm.investmentorderconfirm_popupReConfirmOrder.getByText('ใช่', { exact: true }).click({ timeout: 10000 });
        // รอ popup หายไป
        await this.expect(this.dialog_investmentorderconfirm.investmentorderconfirm_popupReConfirmOrder).not.toBeVisible({ timeout: 60000 });
        // รอ popup ขึ้นมาว่า "บันทึก ยืนยันการชำระเงิน เรียบร้อยแล้ว"
        await this.expect(this.dialog_investmentorderconfirm.investmentorderconfirm_popupSuccess).toBeVisible({ timeout: 60000 });
        await this.dialog_investmentorderconfirm.investmentorderconfirm_popupSuccess.getByText('ตกลง', { exact: true }).click({ timeout: 10000 });
        // รอ popup หายไป
        await this.expect(this.dialog_investmentorderconfirm.investmentorderconfirm_popupSuccess).not.toBeVisible({ timeout: 60000 });
        // รอ popup หายไป
        await this.expect(this.dialog_investmentorderconfirm.investmentorderconfirm_popupConfirmOrder).not.toBeVisible({ timeout: 60000 });
    }
}

module.exports = { InvestmentOrderConfirmPage };