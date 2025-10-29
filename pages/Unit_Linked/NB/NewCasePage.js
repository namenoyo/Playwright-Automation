const { search_NewCase, table_NewCase } = require('../../../locators/Unit_Linked/NB/NewCase.locators.js');

class NewCasePage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.searchnewcase = search_NewCase(page);
        this.tablenewcase = table_NewCase(page);
    }

    async searchNewCase(data) {
        // กรอกข้อมูล สาขาต้นสังกัด
        await this.searchnewcase.newcase_inputBranchCode.fill(data.branchcode);
        await this.expect(this.searchnewcase.newcase_listBranchCode(data.branchcode)).toBeVisible({ timeout: 60000 });
        await this.searchnewcase.newcase_listBranchCode(data.branchcode).click({ timeout: 10000 });

        // กรอกข้อมูล รหัสตัวแทน
        await this.searchnewcase.newcase_inputAgentCode.fill(data.agentcode);
        await this.expect(this.searchnewcase.newcase_listAgentCode(data.agentcode)).toBeVisible({ timeout: 60000 });
        await this.searchnewcase.newcase_listAgentCode(data.agentcode).click({ timeout: 10000 });

        // รอ API โหลดข้อมูล เคสใหม่ เสร็จ
        if (data.env === 'SIT') {
            await this.page.waitForResponse(response =>
                response.url().includes(`https://sitnbs.thaisamut.co.th/nbsweb/secure/remoteaction/ulnbapp/newcase/submit/application/v2/list.html`) &&
                response.status() === 200, { timeout: 60000 }
            );
        } else if (data.env === 'UAT') {
            await this.page.waitForResponse(response =>
                response.url().includes(`https://uatnbs.thaisamut.co.th/nbsweb/secure/remoteaction/ulnbapp/newcase/submit/application/v2/list.html`) &&
                response.status() === 200, { timeout: 60000 }
            );
        }
    }

    async checkRequestCodeInTable(data) {
        // ตรวจสอบว่ามีข้อมูล รหัสคำขอ ในตารางหรือไม่
        return await this.tablenewcase.newcase_tblCaseRow(data.requestcode).isVisible({ timeout: 60000 });
    }
}

module.exports = { NewCasePage };