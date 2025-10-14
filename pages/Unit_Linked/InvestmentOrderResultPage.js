// utils
const { selectDate } = require('../../utils/calendarHelper.js');

// Locators
const { search_InvestmentOrderResult, table_InvestmentOrderResult, formConfirm_InvestmentOrderResult, dialog_InvestmentOrderResult } = require('../../locators/Unit_Linked/InvestmentOrderResult.locators.js');

export class InvestmentOrderResultPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.search_investmentorderresult = search_InvestmentOrderResult(page);
        this.table_investmentorderresult = table_InvestmentOrderResult(page);
        this.formconfirm_investmentorderresult = formConfirm_InvestmentOrderResult(page);
        this.dialog_investmentorderresult = dialog_InvestmentOrderResult(page);
    }

    async searchInvestmentOrderResult(data) {
        // เลือกวันที่ส้งคำสั่ง
        await selectDate(this.page, data.date, this.search_investmentorderresult.investmentorderresult_btnDatePicker);
        // กดปุ่ม ค้นหา
        await this.search_investmentorderresult.investmentorderresult_btnSearch.click({ timeout: 10000 });
    }

    async clickInvestmentOrderResultConfirmButton(data) {
        // เลือก checkbox ตาม invoice number
        await this.table_investmentorderresult.investmentorderresult_tblCheckbox(data.invoiceno).click({ timeout: 10000 });
        // รอหน้าจอ confirm ปรากฏ
        await this.expect(this.formconfirm_investmentorderresult.investmentorderresult_frmConfirm).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ยืนยัน
        await this.formconfirm_investmentorderresult.investmentorderresult_frmConfirm_btnConfirm.click({ timeout: 10000 });
        // รอหน้าจอ ยืนยันการบันทึก ปรากฏ
        await this.expect(this.dialog_investmentorderresult.investmentorderresult_dialogSuccess).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ใช่ เพื่อปิด popup
        await this.dialog_investmentorderresult.investmentorderresult_dialog_btnSuccess.click({ timeout: 10000 });
        // รอหน้าจอ บันทึกเสร็จ แสดง
        await this.expect(this.dialog_investmentorderresult.investmentorderresult_dialog_popupSuccess).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ตกลง เพื่อปิด popup
        await this.dialog_investmentorderresult.investmentorderresult_dialog_btnPopupSuccess.click({ timeout: 10000 });
        // รอหน้าจอ บันทึกเสร็จ แสดง
        await this.expect(this.dialog_investmentorderresult.investmentorderresult_dialog_popupSuccess).not.toBeVisible({ timeout: 60000 });
    }
}