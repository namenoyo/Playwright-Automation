export const ImportPayBillsLocators = (page) => ({
    importpaybills_btnimportfile: page.locator('button#btnUploadPop'),
    importpaybills_popupupload: page.locator('div#upload-panel'),
    importpaybills_seluploadtype: page.locator('select#uploadType'),
    importpaybills_btnselectfile: page.locator('div#upload-panel').locator('input[type="file"]'),
    importpaybills_btnupload: page.locator('div#upload-panel').locator('button#btnUpload'),
    importpaybills_labelsuccess: page.locator('div#upload-panel').locator('label#detailImportStatus'),
    importpaybills_btnclosepopup: page.locator('div#upload-panel').locator('button', { hasText: 'ปิด' }),
});