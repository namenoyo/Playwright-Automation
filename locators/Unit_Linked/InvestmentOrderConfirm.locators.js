export const search_InvestmentOrderConfirm = (page) => ({
    investmentorderconfirm_btnDatePicker: page.locator('#btnOrderDate'),
    investmentorderconfirm_btnSearch: page.locator('#oProcessor'),
});

export const table_InvestmentOrderConfirm = (page) => ({
    investmentorderconfirm_tblButtonConfirm: (invoiceno) => page.getByRole('row', { name: invoiceno }).locator('a', { hasText: 'ยืนยัน' }),
})

export const dialog_InvestmentOrderConfirm = (page) => ({
    investmentorderconfirm_popupConfirmOrder: page.locator('#confirm-payment-content'),
    investmentorderconfirm_popupReConfirmOrder: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการชำระเงิน ใช่หรือไม่?' }),
    investmentorderconfirm_popupSuccess: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'บันทึก ยืนยันการชำระเงิน เรียบร้อยแล้ว' }),
});