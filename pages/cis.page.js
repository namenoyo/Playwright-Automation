// CISPage class for Playwright
const { expect } = require('@playwright/test');
const { waitForLoadingDialogGone, waitForLoadingDialogVisible } = require('../utils/loading.helper');
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
    await waitForLoadingDialogVisible(this.page);
    await waitForLoadingDialogGone(this.page);
  }

  // ค้นหา policy และดัก response เพื่อดึง customerId
  async searchPolicyAndGetCustomerId(policyNo) {
    const policyInput = this.page.getByRole(locators.policyInput.role, { name: locators.policyInput.name, exact: locators.policyInput.exact });
    await policyInput.click();
    await policyInput.type(policyNo, { delay: 200 });
    await expect(policyInput).toHaveValue(policyNo, { timeout: 5000 });

    // ดัก response หลังคลิกค้นหา
    let customerId = null;
    const [response] = await Promise.all([
      this.page.waitForResponse(resp =>
        resp.url().includes('customerInfoList.html') && resp.status() === 200
      ),
      this.page.getByRole(locators.searchButton.role, { name: locators.searchButton.name, exact: locators.searchButton.exact }).click(),
    ]);
    try {
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data.data) && data.data.data[0] && data.data.data[0].customerId) {
        customerId = data.data.data[0].customerId;
      }
    } catch (e) {
      throw new Error('ไม่สามารถอ่าน customerId จาก response ได้');
    }
    if (!customerId) throw new Error('ไม่พบ customerId ใน response');
    await waitForLoadingDialogGone(this.page);
    return customerId;
  }

  // คลิกปุ่ม diamond และรอ API findNewClaimHistory.html โหลดเสร็จ
  async clickDiamondButtonAndWaitClaimHistory(customerId) {
    const claimHistoryUrl = `findNewClaimHistory.html?params.customerId=${customerId}`;
    const [apiResponse] = await Promise.all([
      this.page.waitForResponse(resp =>
        resp.url().includes(claimHistoryUrl) && resp.status() === 200
      ),
      this.page.getByRole(locators.diamondButton.role, { name: locators.diamondButton.name }).click(),
    ]);
    return apiResponse;
  }
}

module.exports = { CISPage };
