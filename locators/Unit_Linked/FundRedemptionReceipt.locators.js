export const table_FundRedemptionReceipt = (page) => ({
    fundredemptionreceipt_tblCheckbox: (invoiceno) => page.getByRole('row', { name: invoiceno }).locator('a', { hasText: 'ยืนยัน' }),
});

export const formConfirm_FundRedemptionReceipt = (page) => ({
    fundredemptionreceipt_frmConfirm: page.locator('#confirm-payment-content').getByText('บันทึกรับเงิน'),
    fundredemptionreceipt_btnDatePicker: page.locator('#btnPaymentDate'),
    fundredemptionreceipt_frmConfirm_btnConfirm: page.locator('#confirm-payment-content').locator('button', { hasText: 'ยืนยัน' }),
});

export const dialog_FundRedemptionReceipt = (page) => ({
    fundredemptionreceipt_dialogConfirmSave: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]').getByText('ยืนยัน บันทึกรับเงินจาก บลจ. (คำสั่งขาย)', { exact: true }),
    fundredemptionreceipt_dialogConfirmbtnSave: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยัน บันทึกรับเงินจาก บลจ. (คำสั่งขาย)' }).getByText('ใช่', { exact: true }),
    fundredemptionreceipt_dialogSuccess: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'บันทึกรับเงินจาก บลจ. เรียบร้อยแล้ว' }),
    fundredemptionreceipt_dialogSuccess_btnOK: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'บันทึกรับเงินจาก บลจ. เรียบร้อยแล้ว' }).getByText('ตกลง', { exact: true }),
});