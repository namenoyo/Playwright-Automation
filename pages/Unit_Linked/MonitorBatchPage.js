// Locators
const { search_runbatch, monitor_runbatch, table_runbatch, popup_runbatch } = require('../../locators/Unit_Linked/MonitorBatch.locators.js');

export class MonitorBatchPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.locator_search_runbatch = search_runbatch(page);
        this.locator_monitor_runbatch = monitor_runbatch(page);
        this.locator_table_runbatch = table_runbatch(page);
        this.locator_popup_runbatch = popup_runbatch(page);
    }

    async checkStatusBeforeRunBatch() {
        // เช็คสถานะ batch ก่อนรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
        let status_before_run = '';
        while (status_before_run !== 'NO PROCESS' && status_before_run !== 'DONE') {
            await this.page.waitForTimeout(5000);
            await this.locator_search_runbatch.monitorbatch_btnSearch.click({ force: true, timeout: 10000 });
            status_before_run = await this.locator_table_runbatch.monitorbatch_labelState.textContent();
        }
    }

    async checkStatusAfterRunBatch() {
        // เช็คสถานะ batch หลังรันว่าเป็น "NO PROCESS" หรือ "DONE" หรือไม่
        let status_after_run = '';
        while (status_after_run !== 'NO PROCESS' && status_after_run !== 'DONE') {
            await this.page.waitForTimeout(5000);
            await this.locator_search_runbatch.monitorbatch_btnSearch.click({ force: true, timeout: 10000 });
            status_after_run = await this.locator_table_runbatch.monitorbatch_labelState.textContent();
        }
    }

    async runJobBatchDailyPolicy(data) {
        // คลิ๊กปุ่ม เลือกรัน Batch
        await this.locator_monitor_runbatch.monitorbatch_btnRunBatch.click({ timeout: 10000 });
        // รอ popup แสดง
        await this.expect(this.page.locator('#panel-batch-content')).toBeVisible({ timeout: 60000 });
        // เลือก JobBatchDaily
        await this.locator_popup_runbatch.monitorbatch_btnJobBatchDaily_btnRun.click({ force: true, timeout: 10000 });
        // รอ popup เลือก JobBatchDaily แสดง
        await this.expect(this.page.locator('#panel-batch-condition-content')).toBeVisible({ timeout: 60000 });
        // เลือก flag ของการ run เป็น policy
        await this.locator_popup_runbatch.monitorbatch_btnJobBatchDaily_runFlag_selrunFlag.click({ force: true, timeout: 10000 });
        // เลือก policy
        await this.locator_popup_runbatch.monitorbatch_btnJobBatchDaily_runFlag_selrunFlag.selectOption('2');
        // กรอก policy no
        await this.locator_popup_runbatch.monitorbatch_btnJobBatchDaily_runFlag_txtPolicyNo.type(data.policyno, { delay: 100 });
        // กดปุ่ม Run
        await this.locator_popup_runbatch.monitorbatch_btnJobBatchDaily_runFlag_btnRun.click({ force: true, timeout: 10000 });
    }
}

module.exports = { MonitorBatchPage };