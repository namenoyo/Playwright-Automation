import { logoutLocators } from "../locators/logout.locators";

export class LogoutPage {
    constructor (page, expect) {
        this.page = page,
        this.expect = expect
        this.logoutlocators = logoutLocators(page);
    }

    async logoutNBSWeb() {
        await this.expect(this.logoutlocators.logoutNBSWebButton).toBeVisible();
        this.page.on('dialog', async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`)
            await dialog.accept(); // หรือ dialog.dismiss() ถ้าต้องการยกเลิก
        });
        await this.logoutlocators.logoutNBSWebButton.click();
    }

    async logoutNBSPortal() {
        await this.expect(this.page.locator(this.logoutlocators.logoutNBSPortalButton)).toBeVisible();
        await this.page.locator(this.logoutlocators.logoutNBSPortalButton).click();
        await this.expect(this.logoutlocators.logoutNBSPortalConfirm).toBeVisible({ timeout: 10000 });
        await this.logoutlocators.logoutNBSPortalConfirm.click();
    }
}

module.exports = { LogoutPage }