export const logoutLocators = (page) => ({
    logoutNBSWebButton: page.getByText('ออกจากระบบ'),
    logoutNBSPortalButton: 'i[title="ออกจากระบบ"]',
    logoutNBSPortalConfirm: page.locator('div[aria-labelledby="confirmation-dialog-title"]').getByText('ตกลง')
})