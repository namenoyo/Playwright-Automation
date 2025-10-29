export const search_NewCase = (page) => ({
    newcase_inputBranchCode: page.locator('#searchCriteria_branchCode'),
    newcase_listBranchCode: (branchcode) => page.getByRole('option', { name: branchcode }),
    newcase_inputAgentCode: page.locator('#searchCriteria_agentCode'),
    newcase_listAgentCode: (agentcode) => page.getByRole('option', { name: agentcode }),
});

export const table_NewCase = (page) => ({
    newcase_tblCaseRow: (requestcode) => page.locator('#main-body').getByRole('row', { name: requestcode }),
});