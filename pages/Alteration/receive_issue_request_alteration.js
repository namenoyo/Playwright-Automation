const { time } = require('console');
const { requestissueformLocator } = require('../../locators/Alteration/alteration.locators.js');

class ReceiveIssueRequestAlteration {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.requestissueformlocators = requestissueformLocator(page);
    }

    async inputdataendorse_alteration(data) {
        // กรอกข้อมูลสลักหลัง
        // แบ่งเงื่อนไขตาม endorse_code
        const endorse_code = data.endorse_code;
        for (const code of endorse_code) {
            if (code === 'ECN01') {
                // กรอกข้อมูลสลักหลัง ECN01
                // เลือก คำนำหน้า
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Title(code).click({ timeout: 10000 });
                await this.page.locator('div[class="css-vkv8p7-menu"]').getByText(data.ecn01_title, { exact: true }).click({ timeout: 10000 });
                // กรอก ชื่อ
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Name(code).fill(data.ecn01_firstname);
                // กรอก นามสกุล
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Surname(code).fill(data.ecn01_lastname);
            }
        }

    }
}

module.exports = { ReceiveIssueRequestAlteration };