export class gotoMenu_NBS_Portal {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async menuAll(menu, submenu1) {
        // รอรายการเมนูหลัก
        await this.expect(this.page.getByRole('button', { name: menu })).toBeVisible({ timeout: 120000 });
        // await this.expect(this.page.locator(`text=${menu}`)).toBeVisible({ timeout: 120000 });
        // คลิกที่เมนูหลัก
        await this.page.getByRole('button', { name: menu }).click()
        // await this.page.click(`text=${menu}`);

        if (submenu1 != undefined) {
            // รอให้เมนูย่อยปรากฏ
            await this.expect(this.page.getByRole('button', { name: submenu1, exact: true })).toBeVisible({ timeout: 120000 });
            // คลิกที่เมนูย่อย
            await this.page.getByRole('button', { name: submenu1, exact: true }).click();
        }
    }
}