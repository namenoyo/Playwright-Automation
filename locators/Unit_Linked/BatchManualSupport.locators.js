export const search_runbatch_manual_support = (page) => ({
    batchmanualsupport_selModule: page.locator('select[id="criteria.module"]'),
    batchmanualsupport_selBatch: page.locator('select[id="criteria.batch"]'),
    batchmanualsupport_txtpolicyno: page.locator('input[id="criteria.policyNo"]'),
    batchmanualsupport_btnProcess: page.locator('#processBtnId'),
});