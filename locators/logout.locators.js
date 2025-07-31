export const logoutLocators = (page) => ({
    logoutNBSWebButton: page.getByText('ออกจากระบบ'),
    logoutNBSPortalButton: 'i[title="ออกจากระบบ"]',
    logoutNBSPortalConfirm: page.locator('div[aria-labelledby="confirmation-dialog-title"]').getByText('ตกลง'),
    // arrow down button for options
    arrowDownButton: page.locator('button[class="MuiButtonBase-root MuiIconButton-root"] > span[class="MuiIconButton-label"] > i'), // ปุ่มลูกศรลงสำหรับตัวเลือก
    logoutButton: page.locator('span', { hasText: 'ออกจากระบบ' }), // ปุ่มออกจากระบบ
})