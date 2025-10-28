import { logoutLocators, logoutnbsportal_newpage } from "../locators/logout.locators";

export class LogoutPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.logoutlocators = logoutLocators(page);
    }

    async logoutNBSWeb() {
        await this.expect(this.logoutlocators.logoutNBSWebButton).toBeVisible({ timeout: 60000 });
        this.page.on('dialog', async (dialog) => {
            // console.log(`Dialog message: ${dialog.message()}`)
            await dialog.accept(); // หรือ dialog.dismiss() ถ้าต้องการยกเลิก
        });
        await this.logoutlocators.logoutNBSWebButton.click({ timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
    }

    async logoutNBSPortal() {
        await this.expect(this.page.locator(this.logoutlocators.logoutNBSPortalButton)).toBeVisible({ timeout: 60000 });
        await this.page.locator(this.logoutlocators.logoutNBSPortalButton).click({ timeout: 10000 });
        await this.expect(this.logoutlocators.logoutNBSPortalConfirm).toBeVisible({ timeout: 60000 });
        await this.logoutlocators.logoutNBSPortalConfirm.click({ timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
    }

    async logoutNBSPortal_newPage(newPage) {
        const confirmButton = logoutnbsportal_newpage.logoutNBSPortalConfirm(newPage);
        const logoutButton = logoutnbsportal_newpage.logoutNBSPortalButton(newPage);

        await this.expect(logoutButton).toBeVisible({ timeout: 60000 });
        await logoutButton.click({ timeout: 10000 });

        await this.expect(confirmButton).toBeVisible({ timeout: 60000 });
        await confirmButton.click({ timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
    }

    async logoutSPLife() {
        await this.expect(this.logoutlocators.arrowDownButton).toBeVisible({ timeout: 60000 });
        await this.logoutlocators.arrowDownButton.click({ timeout: 10000 });
        await this.expect(this.logoutlocators.logoutButton).toBeVisible({ timeout: 60000 });
        await this.logoutlocators.logoutButton.click({ timeout: 10000 });
        // await this.expect(this.page.locator('p', { hasText: "เข้าสู่ระบบใช้งาน SP Life" })).toBeVisible({ timeout: 60000 });
        await this.page.waitForLoadState('networkidle');
    }
}

module.exports = { LogoutPage }