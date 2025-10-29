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
    newcase_popupCustomerInfo_optionCustomerType: (typecard) => page.locator('#cusCardTypeTarget > select').selectOption({ label: typecard }),
    newcase_popupCustomerInfo_txtCardNo: page.locator('#customerCardNo'),
    newcase_popupCustomerInfo_txtTitle: page.locator('#customerTitle'),
    newcase_popupCustomerInfo_listTitle: (title) => page.locator('#show-cis-confirm-content').getByRole('option', { name: title }),
    newcase_popupCustomerInfo_txtName: page.locator('#customerName'),
    newcase_popupCustomerInfo_txtSurname: page.locator('#customerSurname'),
    newcase_popupCustomerInfo_txtBirthday: page.locator('#customerBirthdate'),
    newcase_popupCustomerInfo_btnConfirmAddCustomer: page.locator('#show-cis-confirm-content').getByRole('button', { name: 'ยืนยัน' }),
});

export const form_AddNewCase = (page) => ({
    
});