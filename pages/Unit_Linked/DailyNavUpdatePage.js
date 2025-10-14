// utils
const { selectDate } = require('../../utils/calendarHelper.js');

// Locators
const { search_DailyNavUpdate, table_DailyNavUpdate, form_DailyNavUpdate, dialog_DailyNavUpdate } = require('../../locators/Unit_Linked/DailyNavUpdate.locator.js');

export class DailyNavUpdatePage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.search_dailynavupdate = search_DailyNavUpdate(page);
        this.table_dailynavupdate = table_DailyNavUpdate(page);
        this.form_dailynavupdate = form_DailyNavUpdate(page);
        this.dialog_dailynavupdate = dialog_DailyNavUpdate(page);
    }

    async searchDailyNavUpdate({ date }) {
        // ค้นหาข้อมูล NAV ของกองทุน
        await selectDate(this.page, date, this.search_dailynavupdate.dailynavupdate_btnDatePicker);
        // กดุปุ่ม ค้นหา
        await this.search_dailynavupdate.dailynavupdate_btnSearch.click({ timeout: 10000 });
    }

    async saveDailyNavUpdate({ fundname, NetAssetValue, NAVValue, BidPriceValue, OfferPriceValue }) {
        // กดปุ่ม บันทึก
        await this.table_dailynavupdate.dailynavupdate_btnSave(fundname).click({ timeout: 10000 });
        // รอ popup หน้าบันทึก ปรากฏ
        await this.expect(this.page.locator('#update-nav-content')).toBeVisible({ timeout: 60000 });
        // กรอกข้อมูล
        await this.form_dailynavupdate.dailynavupdate_inputNetAssetValue.click();
        await this.form_dailynavupdate.dailynavupdate_inputNetAssetValue.press('Control+A');
        await this.form_dailynavupdate.dailynavupdate_inputNetAssetValue.press('Delete');
        await this.form_dailynavupdate.dailynavupdate_inputNetAssetValue.type(NetAssetValue, { delay: 100 });

        await this.form_dailynavupdate.dailynavupdate_inputNAVValue.click();
        await this.form_dailynavupdate.dailynavupdate_inputNAVValue.press('Control+A');
        await this.form_dailynavupdate.dailynavupdate_inputNAVValue.press('Delete');
        await this.form_dailynavupdate.dailynavupdate_inputNAVValue.type(NAVValue, { delay: 100 });

        await this.form_dailynavupdate.dailynavupdate_inputBidPriceValue.click();
        await this.form_dailynavupdate.dailynavupdate_inputBidPriceValue.press('Control+A');
        await this.form_dailynavupdate.dailynavupdate_inputBidPriceValue.press('Delete');
        await this.form_dailynavupdate.dailynavupdate_inputBidPriceValue.type(BidPriceValue, { delay: 100 });

        await this.form_dailynavupdate.dailynavupdate_inputOfferPriceValue.click();
        await this.form_dailynavupdate.dailynavupdate_inputOfferPriceValue.press('Control+A');
        await this.form_dailynavupdate.dailynavupdate_inputOfferPriceValue.press('Delete');
        await this.form_dailynavupdate.dailynavupdate_inputOfferPriceValue.type(OfferPriceValue, { delay: 100 });

        // กดปุ่ม บันทึก
        await this.form_dailynavupdate.dailynavupdate_btnFormSave.click({ timeout: 10000 });

        // รอ popup ยืนยันการบันทึก ปรากฏ
        await this.expect(this.dialog_dailynavupdate.dailynavupdate_dialogConfirmSave).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ใช่ เพื่อยืนยันการบันทึก
        await this.dialog_dailynavupdate.dailynavupdate_dialog_btnSave.click({ timeout: 10000 });
        // รอ popup บันทึกเสร็จ ปรากฏ
        await this.expect(this.dialog_dailynavupdate.dailynavupdate_dialogSuccess).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ตกลง เพื่อปิด popup
        await this.dialog_dailynavupdate.dailynavupdate_dialog_btnSuccess.click({ timeout: 10000 });
        // รอ popup บันทึกเสร็จ ปิด
        await this.expect(this.dialog_dailynavupdate.dailynavupdate_dialogSuccess).not.toBeVisible({ timeout: 60000 });
        // รอหน้าโหลดเสร็จ
        await this.page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
    }

    async approveDailyNavUpdate({ fundname }) {
        // กดปุ่ม อนุมัติ
        await this.table_dailynavupdate.dailynavupdate_btnApprove(fundname).click({ timeout: 10000 });
        // รอ popup ยืนยันการอนุมัติ ปรากฏ
        await this.expect(this.page.locator('#update-nav-content')).toBeVisible({ timeout: 60000 });
        // เลือก dropdown เป็น อนุมัติ
        await this.form_dailynavupdate.dailynavupdate_sslFromDailyNavUpdate('อนุมัติ');
        // กดปุ่ม บันทึก
        await this.form_dailynavupdate.dailynavupdate_btnFormSave.click({ timeout: 10000 });
        // รอ popup ยืนยันการอนุมัติ ปรากฏ
        await this.expect(this.dialog_dailynavupdate.datacataloglog_dialogConfirmApprove).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ใช่ เพื่อยืนยันการอนุมัติ
        await this.dialog_dailynavupdate.dailynavupdate_dialog_btnApprove.click({ timeout: 10000 });
        // รอ popup อนุมัติเสร็จ ปรากฏ
        await this.expect(this.dialog_dailynavupdate.dailynavupdate_dialogSuccessApprove).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ตกลง เพื่อปิด popup
        await this.dialog_dailynavupdate.dailynavupdate_dialog_btnSuccessApprove.click({ timeout: 10000 });
        // รอ popup อนุมัติเสร็จ ปิด
        await this.expect(this.dialog_dailynavupdate.dailynavupdate_dialogSuccessApprove).not.toBeVisible({ timeout: 60000 });
        // รอหน้าโหลดเสร็จ
        await this.page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
    }
}