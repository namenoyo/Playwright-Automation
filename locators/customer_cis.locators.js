export const searchcustomerCISLocators = (page) => ({
    buttonSearch: page.getByRole('button', { name: 'ค้นหา', exact: true }),
    policyInput: page.getByLabel('เลขที่กรมธรรม์'),
    checkdatagridPolicy: (policy) => page.getByRole('gridcell', { name: policy, exact: true }),
    customerdetailButton: page.getByRole('gridcell', { name: '' })
})

export const detailcustomerCISLocatorsArraykey = (page) => ({
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_2_Detail_Panel: page.getByText('เลขข้อมูลลูกค้า'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(1).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_3_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(2).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_4_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(3).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_5_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(4).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_6_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(5).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_7_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(6).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_8_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(7).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_1_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(8).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_11_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(9).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_12_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(10).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_13_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(11).locator('tr'),
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_14_In_Page_1_Detail_Panel: page.locator('tbody.MuiTableBody-root').nth(12).locator('tr'),
})