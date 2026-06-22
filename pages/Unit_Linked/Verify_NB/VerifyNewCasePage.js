const { form_Search, VerifyNewCaseData } = require('../../../locators/Unit_Linked/Verify_NB/VerifyNewCase.locator');

class VerifyNewCasePage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.verifyNewCaseData = VerifyNewCaseData(page);
        this.formSearch = form_Search(page);
    }

    async searchVerifyNewCase(data) {
        // กรอกข้อมูลในฟอร์มค้นหา
        // กรอกข้อมูลหมายเลขคำขอ
        await this.formSearch.verifynewcase_formsearch_requestno.fill(data.requestNo);
        // คลิกปุ่มค้นหา
        await this.formSearch.verifynewcase_formsearch_searchbtn.click();
    }

    async verifyNewCaseData() {
        // คลิกปุ่มตรวจสอบข้อมูล
        await this.verifyNewCaseData.verifynewcase_verifynewcasedata_btnverify.click();
        // รอให้ dialog แสดงขึ้น
        await this.expect(this.verifyNewCaseData.verifynewcase_verifynewcasedata_dialog).toBeVisible();
        // กดปุ่ม ยืนยันความถูกต้องของข้อมูลใบคำขอและพิจารณา
        await this.verifyNewCaseData.verifynewcase_verifynewcasedata_dialog_btnverify.click();
    }
}

module.exports = { VerifyNewCasePage };