// utils
const { selectDate } = require('../../utils/calendarHelper.js');

// Locators
const { search_InvestmentOrderCheck, table_InvestmentOrderCheck, dialog_InvestmentOrderCheck } = require('../../locators/Unit_Linked/InvestmentOrderCheck.locators.js');

export class InvestmentOrderCheckPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.search_investmentordercheck = search_InvestmentOrderCheck(page);
        this.table_investmentordercheck = table_InvestmentOrderCheck(page);
        this.dialog_investmentordercheck = dialog_InvestmentOrderCheck(page);
    }

    async searchInvestmentOrderCheck(data) {
        // เลือกวันที่ส้งคำสั่ง
        await selectDate(this.page, data.date, this.search_investmentordercheck.investmentordercheck_btnDatePicker);
        // กดปุ่ม ค้นหา
        await this.search_investmentordercheck.investmentordercheck_btnSearch.click({ timeout: 10000 });
    }

    async clickInvestmentOrderCheckButton(data) {
        // เลือก checkbox ตาม invoice number
        await this.table_investmentordercheck.investmentordercheck_tblCheckbox(data.invoiceno).check();
    }

    async confirmSellInvestmentOrderCheck() {
        // กดปุ่ม ยืนยันคำสั่งขาย
        await this.table_investmentordercheck.investmentordercheck_btnConfirmSell.click({ timeout: 10000 });
        // รอ dialog มีรายการรอการพิจารณา AML/CFT-WMD ขึ้นมา
        const visible_dialog = await this.dialog_investmentordercheck.investmentordercheck_dialogConfirmSell.isVisible();
        // console.log('visible_dialog:', visible_dialog);
        if (visible_dialog) {
            await this.expect(this.dialog_investmentordercheck.investmentordercheck_dialogConfirmSell).toBeVisible({ timeout: 60000 });
            await this.dialog_investmentordercheck.investmentordercheck_dialogConfirmSell.getByText('ใช่', { exact: true }).click({ timeout: 10000 });
        }
        // รอ dialog ยืนยันคำสั่งขายขึ้นมา
        await this.expect(this.dialog_investmentordercheck.investmentordercheck_next_dialogConfirmSell).toBeVisible({ timeout: 60000 });
        await this.dialog_investmentordercheck.investmentordercheck_next_dialogConfirmSell.getByText('ใช่', { exact: true }).click({ timeout: 10000 });
        // รอ dialog ขึ้นมาว่า "บันทึก ยืนยันคำสั่งขาย เรียบร้อยแล้ว"
        await this.expect(this.dialog_investmentordercheck.investmentordercheck_popupSellSuccess).toBeVisible({ timeout: 60000 });
        await this.dialog_investmentordercheck.investmentordercheck_popupSellSuccess.getByText('ปิด', { exact: true }).click({ timeout: 10000 });
        // รอ dialog หายไป
        await this.expect(this.dialog_investmentordercheck.investmentordercheck_popupSellSuccess).not.toBeVisible({ timeout: 60000 });
    }

    async confirmBuyInvestmentOrderCheck() {
        // กดปุ่ม ยืนยันคำสั่งขาย
        await this.table_investmentordercheck.investmentordercheck_btnConfirmBuy.click({ timeout: 10000 });
        // รอ dialog ยืนยันคำสั่งขายขึ้นมา
        await this.expect(this.dialog_investmentordercheck.investmentordercheck_next_dialogConfirmSell).toBeVisible({ timeout: 60000 });
        await this.dialog_investmentordercheck.investmentordercheck_next_dialogConfirmSell.getByText('ใช่', { exact: true }).click({ timeout: 10000 });
        // รอ dialog ขึ้นมาว่า "บันทึก ยืนยันคำสั่งขาย เรียบร้อยแล้ว"
        await this.expect(this.dialog_investmentordercheck.investmentordercheck_popupBuySuccess).toBeVisible({ timeout: 60000 });
        await this.dialog_investmentordercheck.investmentordercheck_popupBuySuccess.getByText('ปิด', { exact: true }).click({ timeout: 10000 });
        // รอ dialog หายไป
        await this.expect(this.dialog_investmentordercheck.investmentordercheck_popupBuySuccess).not.toBeVisible({ timeout: 60000 });
    }
}

module.exports = { InvestmentOrderCheckPage };
