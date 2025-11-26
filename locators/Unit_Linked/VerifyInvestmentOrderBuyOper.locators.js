export const menubar_InvestmentBuyOrderOper = (page) => ({
    investmentorderoper_btnWaitingforCreateOrder: page.locator('a[role="tab"]', { hasText: 'รอสร้างคำสั่งซื้อ' }),
    investmentorderoper_btnVerifyInvestmentOrder: page.locator('a[role="tab"]', { hasText: 'ตรวจสอบและยืนยันคำสั่งซื้อประจำวัน' }),
});

export const search_verify_InvestmentOrderOper = (page) => ({
    verify_investmentorderoper_btnDatePicker: page.locator('#btnOrderDate'),
    verify_investmentorderoper_btnSearch: page.locator('#oSearch2'),
    verify_investmentorderoper_btnSearch_Tab1: page.locator('#oSearch1'),
    verify_investmentorderoper_btnDatePicker_Tab1: page.locator('#btnApproveDate'),
});

export const table_verify_InvestmentOrderOper = (page) => ({
    verify_investmentorderoper_btnconfirmorder: page.locator('#oConfirm2'),
    verify_investmentorderoper_tblCheckbox: (transactionno) => page.getByRole('row', { name: transactionno }),
    verify_investmentorderoper_btnconfirmorder_Tab1: page.locator('#oConfirm1'),
});

export const dialog_verify_InvestmentOrderOper = (page) => ({
    verify_investmentorderoper_confirmorderinvestment: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ต้องการยืนยันคำสั่งซื้อ ใช่หรือไม่?หากกด "ใช่" รายการที่เลือกจะถูกยืนยันคำสั่งซื้อทันที' }),
    verify_investmentorderoper_comment_cutoff: page.locator('#cutoff_panel_dialog-content', { hasText: 'กรุณาระบุเหตุผลเพิ่มเติม เนื่องจากเกินช่วงเวลา Cut-Off Time ต้องการยืนยันคำสั่งซื้อ ใช่หรือไม่?' }),
    verify_investmentorderoper_comment_cutoff_tab1: page.locator('#cutoff_panel_dialog-content', { hasText: 'กรุณาระบุเหตุผลเพิ่มเติม เนื่องจากเกินช่วงเวลา Cut-Off Time ต้องการสร้างคำสั่งซื้อ ใช่หรือไม่?' }),
    verify_investmentorderoper_comment_cutoff_txtreason: page.locator('#cutofftime-content'),
    verify_investmentorderoper_successpopup: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันรายการคำสั่งซื้อ เรียบร้อย' }),
    verify_investmentorderoper_confirmorderinvestment_Tab1: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ต้องการสร้างคำสั่งซื้อ ใช่หรือไม่?หากกด "ใช่" รายการที่เลือกจะถูกสร้างคำสั่งซื้อทันที' }),
    verify_investmentorderoper_successpopup_Tab1: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันสร้างรายการคำสั่งซื้อ เรียบร้อย' }),
    verify_investmentorderoper_confirm_cutoff: page.locator('#cutoff_panel_dialog-content', { hasText: 'เนื่องจากมีรายการเกินเวลา Cut-Off Time ต้องการยืนยันคำสั่งซื้อ ใช่หรือไม่?' })
});