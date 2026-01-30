// utils
const { selectDate } = require('../../utils/calendarHelper.js');

// Database
const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');

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

        let db;
        if (data.update_data_error_helpdesk_support === true) {
            db = new Database({
                user: configdb[data.db_name][data.db_env].DB_USER,
                host: configdb[data.db_name][data.db_env].DB_HOST,
                database: configdb[data.db_name][data.db_env].DB_NAME,
                password: configdb[data.db_name][data.db_env].DB_PASSWORD,
                port: configdb[data.db_name][data.db_env].DB_PORT,
            });
        }

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
        // เช็คว่ามี popup กำลังค้นหาข้อมูล แสดงหรือไม่
        await this.expect(this.page.locator('div[class="busy-dialog yui3-panel-content yui3-widget-stdmod"]'), { hasText: 'กำลังค้นหาข้อมูล...' ,timeout: 60000 }).toBeVisible({ timeout: 60000 });
        await this.expect(this.page.locator('div[class="busy-dialog yui3-panel-content yui3-widget-stdmod"]'), { hasText: 'กำลังค้นหาข้อมูล...' ,timeout: 60000 }).not.toBeVisible({ timeout: 60000 });
        // เช็คว่ามี popup error helpdesk แสดงหรือไม่
        const isHelpdeskErrorVisible = await this.dialog_investmentorderresult.investmentorderresult_dialog_popuperror_helpdesk.isVisible({ timeout: 60000 });
        console.log('isHelpdeskErrorVisible:', isHelpdeskErrorVisible);
        if (isHelpdeskErrorVisible) {
            console.log('เกิดข้อผิดพลาดในระบบ กรุณาติดต่อ Helpdesk Support');
            // กดปุ่ม ตกลง เพื่อปิด popup
            await this.dialog_investmentorderresult.investmentorderresult_dialog_popuperror_helpdesk.locator('button', { hasText: 'ตกลง' }).click({ timeout: 10000 });
            // รอหน้าจอ helpdesk popup หายไป
            await this.expect(this.dialog_investmentorderresult.investmentorderresult_dialog_popuperror_helpdesk).not.toBeVisible({ timeout: 60000 });

            if (data.update_data_error_helpdesk_support === true) {
                // ปรับสถานะคำสั่งซื้อขายหน่วยลงทุน เป็น IR03 (ยกเลิกคำสั่งซื้อขายหน่วยลงทุน สำเร็จ)
                const query_get_invoid = 'select invoid from tivinv01 t where invovc = $1';
                const result_get_invoid = await db.query(query_get_invoid, [data.invoiceno]);
                const query_update_status_order = "update tivreq01 set irstvc = 'IR03' where invoid = $1 and irstvc = 'IR01' and polnvc = $2";
                const result_update_status_order = await db.query(query_update_status_order, [result_get_invoid.rows[0].invoid, data.policyno]);
                console.log(`ปรับสถานะคำสั่งซื้อขายหน่วยลงทุน เลขที่อ้างอิง ${data.invoiceno} เป็น IR03 เรียบร้อยแล้ว`);
            }
        } else {
            // รอหน้าจอ บันทึกเสร็จ แสดง
            await this.expect(this.dialog_investmentorderresult.investmentorderresult_dialog_popupSuccess).toBeVisible({ timeout: 60000 });
            // กดปุ่ม ตกลง เพื่อปิด popup
            await this.dialog_investmentorderresult.investmentorderresult_dialog_btnPopupSuccess.click({ timeout: 10000 });
            // รอหน้าจอ บันทึกเสร็จ แสดง
            await this.expect(this.dialog_investmentorderresult.investmentorderresult_dialog_popupSuccess).not.toBeVisible({ timeout: 60000 });
        }

        if (data.update_data_error_helpdesk_support === true) {
            db.close();
        }
        
    }

    
}