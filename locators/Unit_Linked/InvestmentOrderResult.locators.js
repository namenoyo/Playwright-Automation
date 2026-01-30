export const search_InvestmentOrderResult = (page) => ({
    investmentorderresult_btnDatePicker: page.locator('#btnOrderDate'),
    investmentorderresult_btnSearch: page.locator('#oProcessor'),
});

export const menubar_InvestmentOrderResult = (page) => ({
    investmentorderresult_btnBuy: page.locator('a[role="tab"]', { hasText: 'คำสั่งซื้อ' }),
    investmentorderresult_btnSell: page.locator('a[role="tab"]', { hasText: 'คำสั่งขาย' }),
});

export const table_InvestmentOrderResult = (page) => ({
    investmentorderresult_tblCheckbox: (invoiceno) => page.getByRole('row', { name: invoiceno }).locator('a', { hasText: 'ยืนยัน' }),
});

export const formConfirm_InvestmentOrderResult = (page) => ({
    investmentorderresult_frmConfirm: page.locator('#confirm-payment-content'),
    investmentorderresult_frmConfirm_btnConfirm: page.locator('#confirm-payment-content').locator('button', { hasText: 'ยืนยัน' }),
});

export const dialog_InvestmentOrderResult = (page) => ({
    investmentorderresult_dialogSuccess: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]').getByText('ยืนยันผลคำสั่งซื้อ-ขาย', { exact: true }),
    investmentorderresult_dialog_btnSuccess: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันผลคำสั่งซื้อ-ขาย' }).getByText('ใช่', { exact: true }),
    investmentorderresult_dialog_popuperror_helpdesk: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'เกิดข้อผิดพลาดในระบบ กรุณาติดต่อ Helpdesk Support' }),
    investmentorderresult_dialog_popupSuccess: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'บันทึก ยืนยันผลคำสั่งซื้อ-ขาย เรียบร้อยแล้ว' }),
    investmentorderresult_dialog_btnPopupSuccess: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'บันทึก ยืนยันผลคำสั่งซื้อ-ขาย เรียบร้อยแล้ว' }).getByText('ตกลง', { exact: true }),
});