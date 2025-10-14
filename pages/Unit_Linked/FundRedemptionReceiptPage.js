// utils
const { selectDate } = require('../../utils/calendarHelper.js');

// Locators
const { table_FundRedemptionReceipt, formConfirm_FundRedemptionReceipt, dialog_FundRedemptionReceipt } = require('../../locators/Unit_Linked/FundRedemptionReceipt.locators.js');

export class FundRedemptionReceipt {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.table_fundredemptionreceipt = table_FundRedemptionReceipt(page);
        this.formconfirm_fundredemptionreceipt = formConfirm_FundRedemptionReceipt(page);
        this.dialog_fundredemptionreceipt = dialog_FundRedemptionReceipt(page);
    }

    async clickFundRedemptionReceiptConfirmButton(data) {
        // เลือก ยืนยัน ตาม invoice number
        await this.table_fundredemptionreceipt.fundredemptionreceipt_tblCheckbox(data.invoiceno).click();
        // รอหน้าจอ บันทึกรับเงิน แสดง
        await this.expect(this.formconfirm_fundredemptionreceipt.fundredemptionreceipt_frmConfirm).toBeVisible({ timeout: 60000 });
        // เลือกวันที่รับเงิน
        await selectDate(this.page, data.date, this.formconfirm_fundredemptionreceipt.fundredemptionreceipt_btnDatePicker);
        // กดปุ่ม บันทึกรับเงิน
        await this.formconfirm_fundredemptionreceipt.fundredemptionreceipt_frmConfirm_btnConfirm.click({ timeout: 10000 });
        // รอหน้าจอ ยืนยันการบันทึก ปรากฏ
        await this.expect(this.dialog_fundredemptionreceipt.fundredemptionreceipt_dialogConfirmSave).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ใช่ เพื่อปิด popup
        await this.dialog_fundredemptionreceipt.fundredemptionreceipt_dialogConfirmbtnSave.click({ timeout: 10000 });
        // รอหน้าจอ บันทึกรับเงินสำเร็จ ปรากฏ
        await this.expect(this.dialog_fundredemptionreceipt.fundredemptionreceipt_dialogSuccess).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ตกลง เพื่อปิด popup
        await this.dialog_fundredemptionreceipt.fundredemptionreceipt_dialogSuccess_btnOK.click({ timeout: 10000 });
        // รอหน้าจอ บันทึกรับเงิน สำเร็จ หายไป
        await this.expect(this.dialog_fundredemptionreceipt.fundredemptionreceipt_dialogSuccess).not.toBeVisible({ timeout: 60000 });
        // รอข้อมูลโหลดเสร็จ
        await this.page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
        await this.expect(this.page.locator('div[class="busy-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'กำลังค้นหาข้อมูล...' })).not.toBeVisible({ timeout: 60000 });
    }
}