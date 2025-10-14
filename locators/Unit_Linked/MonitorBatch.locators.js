export const search_runbatch = (page) => ({
    monitorbatch_btnSearch: page.locator('#oSearch'),
});

export const monitor_runbatch = (page) => ({
    monitorbatch_btnRunBatch: page.locator('#oBatch'),
});

export const table_runbatch = (page) => ({
    monitorbatch_labelState: page.getByRole('row', { name: 'JobBatchDaily' }).getByRole('cell').nth(2),
});

export const popup_runbatch = (page) => ({
    monitorbatch_btnJobBatchDaily_btnRun: page.getByRole('row', { name: 'JobBatchDaily RUN Batch' }).getByRole('button'),
    monitorbatch_btnJobBatchDaily_runFlag_selrunFlag: page.locator('#mbConditionFlag'),
    monitorbatch_btnJobBatchDaily_runFlag_txtPolicyNo: page.locator('#mbConditionPolicyNo'),
    monitorbatch_btnJobBatchDaily_runFlag_btnRun: page.locator('#panel-batch-condition-content').locator('button', { hasText: 'รัน' }),
});