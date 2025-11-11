export const menubar_InvestmentOrderOper = (page) => ({
    investmentorderoper_btnWaitingforCreateOrder: page.locator('a[role="tab"]', { hasText: 'รอสร้างคำสั่งขาย' }),
    investmentorderoper_btnVerifyInvestmentOrder: page.locator('a[role="tab"]', { hasText: 'ตรวจสอบและยืนยันคำสั่งขายประจำวัน' }),
});

export const search_verify_InvestmentOrderOper = (page) => ({
    verify_investmentorderoper_btnDatePicker: page.locator('#btnOrderDate'),
    verify_investmentorderoper_btnSearch: page.locator('#oSearch2'),
});

export const table_verify_InvestmentOrderOper = (page) => ({
    verify_investmentorderoper_btnconfirmorder: page.locator('#oConfirm2'),
    verify_investmentorderoper_tblCheckbox: (transactionno) => page.getByRole('row', { name: transactionno }),
});

export const dialog_verify_InvestmentOrderOper = (page) => ({
    verify_investmentorderoper_confirmorderinvestment: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ต้องการยืนยันคำสั่งขาย ใช่หรือไม่?หากกด "ใช่" รายการที่เลือกจะถูกยืนยันคำสั่งขายทันที' }),
    verify_investmentorderoper_comment_cutoff: page.locator('#cutoff_panel_dialog-content', { hasText: 'กรุณาระบุเหตุผลเพิ่มเติม เนื่องจากเกินช่วงเวลา Cut-Off Time ต้องการยืนยันคำสั่งขาย ใช่หรือไม่?' }),
    verify_investmentorderoper_comment_cutoff_txtreason: page.locator('#cutofftime-content'),
    verify_investmentorderoper_successpopup: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันรายการคำสั่งขาย เรียบร้อย' }),
});