import { searchinquiryformLocator } from "../../locators/Alteration/alteration.locators";

export class searchAlterationAll {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.searchinquiryformlocator = searchinquiryformLocator(page)
    }

    async searchInquiryForm(policyno) {

        // เคลียร์ค่า วันที่เริ่มต้น
        await this.searchinquiryformlocator.dateform.fill('');
        await this.page.waitForTimeout(500)
        // เคลียร์ค่า วันที่สิ้นสุด
        await this.searchinquiryformlocator.dateto.fill('');
        await this.page.waitForTimeout(500)
        // เคลียร์ค่า หน่วยงานรับเรื่อง
        await this.searchinquiryformlocator.complaintreceivingagency_delete.click();
        await this.page.waitForTimeout(500)
        // กรอกเลขกรมธรรม์
        await this.searchinquiryformlocator.policyInput.click();
        await this.page.keyboard.type(policyno, { delay: 300 });
        await this.page.waitForTimeout(500)
        // กดปุ่มค้นหา
        await this.searchinquiryformlocator.buttonSearch.click();
        // รอข้อมูลในตารางแสดง
        await this.expect(this.searchinquiryformlocator.checkdatagridPolicy(policyno)).toBeVisible({ timeout: 120000 });
    }

    async clickdetailInquiryForm (policyno) {
        // คลิ๊กปุ่ม รายละเอียด
        await this.searchinquiryformlocator.inquiryformdetailButton.click();
        // รอโหลดหน้าจอโดยตรวจว่าเจอ เลขกรมธรรม์ในหน้าจอหรือไหม
        await this.expect(this.page.locator(`text=${policyno}`)).toBeVisible();
    }
}

module.exports = { searchAlterationAll }