export const form_Search = (page) => ({
    verifynewcase_formsearch_startdate: page.locator('#startDate'),
    verifynewcase_formsearch_enddate: page.locator('#endDate'),
    verifynewcase_formsearch_requestno: page.locator('#requestNo'),
    verifynewcase_formsearch_searchbtn: page.locator('#searchVerifyApp'),
})

export const VerifyNewCaseData = (page) => ({
    verifynewcase_verifynewcasedata_dialog: page.locator('#panel_dialog-content'),
    verifynewcase_verifynewcasedata_btnverify: page.locator('button', { hasText: 'ตรวจสอบข้อมูล' }),
    verifynewcase_verifynewcasedata_dialog_btnverify: page.locator('#panel_dialog-content').locator('button', { hasText: 'ยืนยันความถูกต้องของข้อมูลใบคำขอและพิจารณา' }),
    verifynewcase_verifynewcasedata_confirm_dialog: page.locator('#alert-dialog-model-id'),
    verifynewcase_verifynewcasedata_confirm_dialog_yes: page.locator('#alert-dialog-model-id').locator('button', { hasText: 'ใช่' }),
})