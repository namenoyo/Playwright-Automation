export class gotoMenu {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async menuAll (menu, submenu1, submenu2, submenu3, submenu4) {
        // รอรายการเมนูหลัก
        await this.expect(this.page.locator(`text=${menu}`)).toBeVisible();
        // คลิกที่เมนูหลัก
        await this.page.click(`text=${menu}`);
        // รอให้เมนูย่อยปรากฏ
        await this.expect(this.page.getByRole('menuitem', { name: submenu1 , exact: true })).toBeVisible();
        // คลิกที่เมนูย่อย
        await this.page.getByRole('menuitem', { name: submenu1 , exact: true }).click();
        // ตรวจสอบเมนูย่อยถัดไป
        if (submenu2 != undefined) {
            // รอให้เมนูย่อยถัดไปปรากฏ
            await this.expect(this.page.getByRole('menuitem', { name: submenu2 , exact: true })).toBeVisible();
            // คลิกที่เมนูย่อยถัดไป
            await this.page.getByRole('menuitem', { name: submenu2 , exact: true }).click();
            // ตรวจสอบเมนูย่อยถัดไปอีก
            if (submenu3 != undefined) {
                // รอให้เมนูย่อยถัดไปปรากฏ
                await this.expect(this.page.getByRole('menuitem', { name: submenu3 , exact: true })).toBeVisible();
                // คลิกที่เมนูย่อยถัดไป
                await this.page.getByRole('menuitem', { name: submenu3 , exact: true }).click();
                // ตรวจสอบเมนูย่อยถัดไปอีก
                if (submenu4 != undefined) {
                    // รอให้เมนูย่อยถัดไปปรากฏ
                    await this.expect(this.page.getByRole('menuitem', { name: submenu4 , exact: true })).toBeVisible();
                    // คลิกที่เมนูย่อยถัดไป
                    await this.page.getByRole('menuitem', { name: submenu4 , exact: true }).click();
                } else {}
            }
        } else {}
    }
}

module.exports = { gotoMenu };