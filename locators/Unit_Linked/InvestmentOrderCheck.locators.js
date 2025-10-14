export const search_InvestmentOrderCheck = (page) => ({
    investmentordercheck_btnDatePicker: page.locator('#btnOrderDate'),
    investmentordercheck_btnSearch: page.locator('#oProcessor'),
});

export const menubar_InvestmentOrderCheck = (page) => ({
    investmentordercheck_btnBuy: page.locator('a[role="tab"]', { hasText: 'คำสั่งซื้อ' }),
    investmentordercheck_btnSell: page.locator('a[role="tab"]', { hasText: 'คำสั่งขาย' }),
})

export const table_InvestmentOrderCheck = (page) => ({
    investmentordercheck_btnConfirmSell: page.locator('input[value="ยืนยันคำสั่งขาย"]'),
    investmentordercheck_tblCheckbox: (invoiceno) => page.getByRole('row', { name: invoiceno }).locator('#selectFund'),
})

export const dialog_InvestmentOrderCheck = (page) => ({
    investmentordercheck_dialogConfirmSell: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'มีรายการรอการพิจารณา AML/CFT-WMD' }),
    investmentordercheck_next_dialogConfirmSell: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันคำสั่งซื้อขาย ใช่หรือไม่?'}),
    investmentordercheck_popupSellSuccess: page.locator('#trading-form-content', { hasText: 'บันทึก ยืนยันคำสั่งขาย เรียบร้อยแล้ว' }),
})