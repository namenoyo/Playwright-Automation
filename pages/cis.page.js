// CISPage class for Playwright
const { expect } = require('@playwright/test');
const { waitForLoadingDialogGone } = require('../utils/loading.helper');
const locators = require('../locators/cis.locator');

class CISPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }


  async goToCustomerInfo() {
    await this.page.getByRole(locators.menuCustomerRelation.role, { name: locators.menuCustomerRelation.name }).click();
    await this.page.getByRole(locators.menuCIS.role, { name: locators.menuCIS.name }).click();
    await this.page.getByRole(locators.menuCustomerInfo.role, { name: locators.menuCustomerInfo.name, exact: locators.menuCustomerInfo.exact }).click();
    await waitForLoadingDialogGone(this.page);
  }

  async searchPolicy(policyNo) {
    const policyInput = this.page.getByRole(locators.policyInput.role, { name: locators.policyInput.name, exact: locators.policyInput.exact });
    await policyInput.click();
    await policyInput.type(policyNo,{delay: 200}); // ใช้ delay เพื่อให้แน่ใจว่าค่าถูกกรอกอย่างถูกต้อง
    
    // เช็คให้แน่ใจว่าค่าใน textbox ถูกต้องก่อนคลิกค้นหา
     await expect(policyInput).toHaveValue(policyNo, { timeout: 5000 });
  
    // คลิกปุ่มค้นหา
    await this.page.getByRole(locators.searchButton.role, { name: locators.searchButton.name, exact: locators.searchButton.exact }).click();
    await waitForLoadingDialogGone(this.page);
  }

  async clickDiamondButton() {
    await this.page.getByRole(locators.diamondButton.role, { name: locators.diamondButton.name }).click();
    await waitForLoadingDialogGone(this.page);
  }
}

module.exports = { CISPage };
