export const menualterationLocator = (page, mainmenu, submenu) => ({
    mainmenu: page.locator(`text = ${mainmenu}`),
    submenu: page.locator(`text = ${submenu}`),
    checkmainmenu: page.locator('li[class="MuiBreadcrumbs-li"]').locator(`text = ${mainmenu}`),
    checksubmenu: page.locator('li[class="MuiBreadcrumbs-li"]').locator(`text = ${submenu}`),
})

export const searchinquiryformLocator = (page) => ({
    dateform: page.locator('input[name="inquiryDateFrom"]'),
    dateto: page.locator('input[name="inquiryDateTo"]'),
    complaintreceivingagency_delete: page.locator('div[class="css-p6nyma-control"]').nth(1).locator('div[class="css-1pseabs-indicatorContainer"]').nth(0),
    policyInput: page.locator('input[class="MuiInputBase-input MuiInput-input"]').nth(1),
    buttonSearch: page.getByRole('button', { name: 'ค้นหา', exact: true }),
    checkdatagridPolicy: (policy) => page.getByRole('gridcell', { name: policy, exact: true }),
    inquiryformdetailButton: page.getByRole('gridcell', { name: '' })
})