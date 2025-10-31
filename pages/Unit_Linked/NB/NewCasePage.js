const { search_NewCase, table_NewCase, popup_NewCase_CustomerInfo, form_AddNewCase } = require('../../../locators/Unit_Linked/NB/NewCase.locators.js');

class NewCasePage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.searchnewcase = search_NewCase(page);
        this.tablenewcase = table_NewCase(page);
        this.popupnewcase_customerinfo = popup_NewCase_CustomerInfo(page);
        this.formaddnewcase = form_AddNewCase(page);
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

    async clickAddNewCase() {
        // กดปุ่ม เพิ่มเคสใหม่
        await this.searchnewcase.newcase_btnAddNewCase.click({ timeout: 10000 });
        // รอ popup เลือกข้อมูลลูกค้า ปรากฏ
        await this.expect(this.page.locator('#show-cis-customer-select-content')).toBeVisible({ timeout: 60000 });
    }

    async clickAddNewCustomerPopupCustomerInfo(data) {
        // กดปุ่ม เพิ่มลูกค้า ใน popup
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_btnAddCustomer.click({ timeout: 10000 });
        // รอ popup เพิ่มข้อมูลลูกค้า ปรากฏ
        await this.expect(this.page.locator('#show-cis-confirm-content')).toBeVisible({ timeout: 60000 });
        // เลือก ประเภทบัตร
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_optionCustomerType(data.typecard);
        // กรอก หมายเลขบัตร
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtCardNo.fill(data.cardno);
        // กรอก คำนำหน้า
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtTitle.fill(data.title);
        await this.expect(this.popupnewcase_customerinfo.newcase_popupCustomerInfo_listTitle(data.title)).toBeVisible({ timeout: 60000 });
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_listTitle(data.title).click({ timeout: 10000 });
        // กรอก ชื่อ
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtName.fill(data.name);
        // กรอก นามสกุล
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtSurname.fill(data.surname);
        // กรอก วันเกิด
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtBirthday.fill(data.birthday);
        await this.page.waitForTimeout(300); // เพิ่ม delay 300 มิลลิวินาที เพื่อรอข้อมูลโหลด
        // กดปุ่ม ยืนยัน ใน popup เพิ่มข้อมูลลูกค้า
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_btnConfirmAddCustomer.click({ timeout: 10000 });

        // รอ popup ไม่พบข้อมูลลูกค้า ปรากฏ
        await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ไม่พบลูกค้าอยู่ในระบบ CIS ยืนยันการใช้ข้อมูลใช่หรือไม่' })).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ใช่ ใน popup ไม่พบข้อมูลลูกค้า
        await this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ไม่พบลูกค้าอยู่ในระบบ CIS ยืนยันการใช้ข้อมูลใช่หรือไม่' }).getByText('ใช่', { exact: true }).click({ timeout: 10000 });
        // รอ popup ไม่พบข้อมูลลูกค้า ปิด
        await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ไม่พบลูกค้าอยู่ในระบบ CIS ยืนยันการใช้ข้อมูลใช่หรือไม่' })).not.toBeVisible({ timeout: 60000 });

        // รอ popup เพิ่มข้อมูลลูกค้า ปิด
        await this.expect(this.page.locator('#show-cis-confirm-content')).not.toBeVisible({ timeout: 60000 });
        // รอ popup บันทึกข้อมูลเคสใหม่ ปรากฏ
        await this.expect(this.page.locator('#dialog-content')).toBeVisible({ timeout: 60000 });
    }

    async formAddNewCase(data) {
        // Tab 1: ผู้เอาประกัน/ตัวแทน/แบบประกัน
        // Section: 1. ชื่อและนามสกุลของผู้เอาประกันภัย
        await this.formaddnewcase.newcase_formAddNewCase_tab1_txtRequestCode.fill(data.requestcode);
        // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลถูกบันทึก
        await this.formaddnewcase.newcase_formAddNewCase_tab1_txtDateRequestCode.click();
        await this.page.waitForTimeout(300); // เพิ่ม delay 300 มิลลิวินาที เพื่อรอข้อมูลโหลด
        // รอ popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง ปรากฏ
        await this.expect(this.page.locator('#alert-dialog-model-id', { hasText: 'เนื่องจากไม่พบข้อมูลแบบประเมินความเสี่ยง กรุณาระบุข้อมูล' })).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ตกลง ใน popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง
        await this.page.locator('#alert-dialog-model-id', { hasText: 'เนื่องจากไม่พบข้อมูลแบบประเมินความเสี่ยง กรุณาระบุข้อมูล' }).getByText('ตกลง', { exact: true }).click({ timeout: 10000 });
        // รอ popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง ปิด
        await this.expect(this.page.locator('#alert-dialog-model-id', { hasText: 'เนื่องจากไม่พบข้อมูลแบบประเมินความเสี่ยง กรุณาระบุข้อมูล' })).not.toBeVisible({ timeout: 60000 });
        // กรอก วันที่เขียนใบคำขอ โดยใช้วันที่ปัจจุบัน
        await this.formaddnewcase.newcase_formAddNewCase_tab1_txtDateRequestCode.fill(data.todaydate);

        // Tab 2: ผู้รับผลประโยชน์/คำแถลองสุขภาพ


        // Tab 3: เอกสารประกอบการเอาประกัน
    }

}

module.exports = { NewCasePage };