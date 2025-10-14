export const search_DailyNavUpdate = (page) => ({
    dailynavupdate_btnDatePicker: page.locator('#btnOrderDate'),
    dailynavupdate_btnSearch: page.locator('#oProcessor'),
});

export const table_DailyNavUpdate = (page) => ({
    dailynavupdate_btnSave: (fundname) => page.getByRole('row', { name: fundname }).locator('input[title="บันทึก"]'),
    dailynavupdate_btnApprove: (fundname) => page.getByRole('row', { name: fundname }).locator('input[title="อนุมัติ"]'),
})

export const form_DailyNavUpdate = (page) => ({
    dailynavupdate_inputNetAssetValue: page.locator('#assetValue'),
    dailynavupdate_inputNAVValue: page.locator('#navPrice'),
    dailynavupdate_inputBidPriceValue: page.locator('#bidPrice'),
    dailynavupdate_inputOfferPriceValue: page.locator('#offerPrice'),
    dailynavupdate_btnFormSave: page.locator('#update-nav-content').getByText('ยืนยัน', { exact: true }),
    dailynavupdate_sslFromDailyNavUpdate: (option) => page.selectOption('select#selectListStatus', { label: option }),
})

export const dialog_DailyNavUpdate = (page) => ({
    dailynavupdate_dialogConfirmSave: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]').getByText('ยืนยัน อัพเดทราคา NAV ประจำวัน', { exact: true }),
    dailynavupdate_dialog_btnSave: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยัน อัพเดทราคา NAV ประจำวัน' }).getByText('ใช่', { exact: true }),
    dailynavupdate_dialogSuccess: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]').getByText('บันทึกอัพเดทราคา NAV ประจำวัน เรียบร้อยแล้ว', { exact: true }),
    dailynavupdate_dialog_btnSuccess: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'บันทึกอัพเดทราคา NAV ประจำวัน เรียบร้อยแล้ว' }).getByText('ตกลง', { exact: true }),
    datacataloglog_dialogConfirmApprove: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]').getByText('ยืนยันทำการอนุมัติ', { exact: true }),
    dailynavupdate_dialog_btnApprove: page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันทำการอนุมัติ' }).getByText('ใช่', { exact: true }),
    dailynavupdate_dialogSuccessApprove: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]').getByText('ทำการอนุมัติ อัพเดทราคา NAV ประจำวัน เรียบร้อยแล้ว', { exact: true }),
    dailynavupdate_dialog_btnSuccessApprove: page.locator('div[class="alert-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ทำการอนุมัติ อัพเดทราคา NAV ประจำวัน เรียบร้อยแล้ว' }).getByText('ตกลง', { exact: true }),

})