// Reuseable/API_Wait.js

/**
 * Intercept customerInfoList, wait for response, extract customerId, intercept claimHistory, trigger UI, and wait for claimHistory API.
 * @param {string} panelHeaderSelector - Selector for the header panel to trigger claimHistory API (e.g. Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_1_Header_Panel)
 * @returns Cypress.Chainable<{customerId: string}>
 */
function waitForCustomerInfoAndClaimHistory(panelHeaderSelector) {
  // รอ response customerInfoList
  return cy.wait('@getCustomerInfoList', { timeout: 60000 }).then(({ response }) => {
    const customerId = response.body?.data?.data?.[0]?.customerId;
    expect(customerId, 'customerId from API').to.exist;
    // Intercept claimHistory API ด้วย customerId
    cy.intercept('GET', `**/customerInfo/findNewClaimHistory.html?params.customerId=${customerId}`).as('getClaimHistory');
    // trigger UI ที่จะเรียก claimHistory (panel header)
    cy.get(panelHeaderSelector, { timeout: 60000 })
      .scrollIntoView()
      .should('be.visible');
    // รอ claimHistory API
    return cy.wait('@getClaimHistory', { timeout: 60000 }).then(() => ({ customerId }));
  });
}

module.exports = { waitForCustomerInfoAndClaimHistory };
