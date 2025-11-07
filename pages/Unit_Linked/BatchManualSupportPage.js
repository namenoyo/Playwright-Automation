const { batch } = require('googleapis/build/src/apis/batch/index.js');
const { search_runbatch_manual_support, table_runbatch_manual_support } = require('../../locators/Unit_Linked/BatchManualSupport.locators.js');

// utils
const { selectDate } = require('../../utils/calendarHelper.js');

class BatchManualSupportPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async runBatchINV(data) {
        const locator_search_runbatch_manual_support = search_runbatch_manual_support(this.page);
        const locator_table_runbatch_manual_support = table_runbatch_manual_support(this.page);
        // เลือก Module
        await locator_search_runbatch_manual_support.batchmanualsupport_selModule.selectOption('INV');
        if (data.batch === 'CreateRV') {
            // เลือก Batch
            await locator_search_runbatch_manual_support.batchmanualsupport_selBatch.selectOption('BatchCreateSnapshotRedemptionvalue');
        } else if (data.batch === 'UpdateRV') {
            // เลือก Batch
            await locator_search_runbatch_manual_support.batchmanualsupport_selBatch.selectOption('BatchUpdateSnapshotRedemptionvalue');
        }
        // กรอก Policy No
        await locator_search_runbatch_manual_support.batchmanualsupport_txtpolicyno.type(data.policyno, { delay: 100 });
        await this.page.waitForTimeout(500); // รอให้กรอกข้อมูลครบ
        // เลือกวันที่ End Date
        await selectDate(this.page, data.date, locator_search_runbatch_manual_support.batchmanualsupport_datepickerEndDate, 'RV');
        // เลือกวันที่ Start Date
        await selectDate(this.page, data.date, locator_search_runbatch_manual_support.batchmanualsupport_datepickerStartDate, 'RV');
        // กดปุ่ม Process
        await locator_search_runbatch_manual_support.batchmanualsupport_btnProcess.click({ force: true, timeout: 10000 });

        let batchStatus = '';
        while (batchStatus !== 'Complete') {
            await this.page.waitForTimeout(5000); // รอ 5 วินาที ก่อนตรวจสอบสถานะอีกครั้ง
            // ตรวจสอบสถานะผลลัพธ์
            batchStatus = await locator_table_runbatch_manual_support.batchmanualsupport_tableResultStatus.textContent();
            batchStatus = batchStatus.trim();
            console.log(`Current Batch Status: ${batchStatus}`);
        }
        
    }
}

module.exports = { BatchManualSupportPage };