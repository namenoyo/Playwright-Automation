const { search_runbatch_manual_support } = require('../../locators/Unit_Linked/BatchManualSupport.locators.js');

class BatchManualSupportPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async runBatchINV(data) {
        const locator_search_runbatch_manual_support = search_runbatch_manual_support(this.page);
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
        // // กดปุ่ม Process
        // await locator_search_runbatch_manual_support.batchmanualsupport_btnProcess.click({ force: true, timeout: 10000 });
    }
}

module.exports = { BatchManualSupportPage };