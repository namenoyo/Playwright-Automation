export const search_NewCase = (page) => ({
    newcase_inputBranchCode: page.locator('#searchCriteria_branchCode'),
    newcase_listBranchCode: (branchcode) => page.getByRole('option', { name: branchcode }),
    newcase_inputAgentCode: page.locator('#searchCriteria_agentCode'),
    newcase_listAgentCode: (agentcode) => page.getByRole('option', { name: agentcode }),
    newcase_btnAddNewCase: page.locator('#searchCriteria_addNewCaseBtn'),
});

export const table_NewCase = (page) => ({
    newcase_tblCaseRow: (requestcode) => page.locator('#main-body').getByRole('row', { name: requestcode }),
});

export const popup_NewCase_CustomerInfo = (page) => ({
    newcase_popupCustomerInfo_btnAddCustomer: page.locator('#addCisCustomer'),
    newcase_popupCustomerInfo_optionCustomerType: (typecard) => page.locator('#cisCustomerType').selectOption({ label: typecard }),
});