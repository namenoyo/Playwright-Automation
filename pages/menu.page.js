export class gotoMenu {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async menuAll(menu, submenu1, submenu2, submenu3, submenu4) {
        // รอรายการเมนูหลัก
        await this.expect(this.page.locator('td#mainmenu').locator(`text=${menu}`)).toBeVisible({ timeout: 120000 });
        // คลิกที่เมนูหลัก
        await this.page.locator('td#mainmenu').locator(`text=${menu}`).click({ timeout: 100000 });

        if (menu == 'ระบบงาน NBS Portal' && submenu1 == 'Home') {
            await this.page.keyboard.press('ArrowDown')
            await this.page.keyboard.press('Enter')
        } else {
            // รอให้เมนูย่อยปรากฏ
            await this.expect(this.page.getByRole('menuitem', { name: submenu1, exact: true })).toBeVisible({ timeout: 120000 });
            // คลิกที่เมนูย่อย
            await this.page.getByRole('menuitem', { name: submenu1, exact: true }).click({ timeout: 100000 });
        }

        // ตรวจสอบเมนูย่อยถัดไป
        if (submenu2 != undefined) {
            // รอให้เมนูย่อยถัดไปปรากฏ
            await this.expect(this.page.getByRole('menuitem', { name: submenu2, exact: true })).toBeVisible({ timeout: 120000 });
            // คลิกที่เมนูย่อยถัดไป
            await this.page.getByRole('menuitem', { name: submenu2, exact: true }).click({ timeout: 100000 });
            // ตรวจสอบเมนูย่อยถัดไปอีก
            if (submenu3 != undefined) {
                if (submenu3 == 'นำเข้าไฟล์การชำระเงิน') {
                    // รอให้เมนูย่อยถัดไปปรากฏ
                    await this.expect(this.page.locator('a[class="yui3-menuitem-content"]', { hasText: 'นำเข้าไฟล์การชำระเงิน' })).toBeVisible({ timeout: 120000 });
                    // คลิกที่เมนูย่อยถัดไป
                    await this.page.locator('a[class="yui3-menuitem-content"]', { hasText: 'นำเข้าไฟล์การชำระเงิน' }).click({ timeout: 100000 });
                } else {
                    // รอให้เมนูย่อยถัดไปปรากฏ
                    await this.expect(this.page.getByRole('menuitem', { name: submenu3, exact: true })).toBeVisible({ timeout: 120000 });
                    // คลิกที่เมนูย่อยถัดไป
                    await this.page.getByRole('menuitem', { name: submenu3, exact: true }).click({ timeout: 100000 });
                }
                // ตรวจสอบเมนูย่อยถัดไปอีก
                if (submenu4 != undefined) {
                    // รอให้เมนูย่อยถัดไปปรากฏ
                    await this.expect(this.page.getByRole('menuitem', { name: submenu4, exact: true })).toBeVisible({ timeout: 120000 });
                    // คลิกที่เมนูย่อยถัดไป
                    await this.page.getByRole('menuitem', { name: submenu4, exact: true }).click({ timeout: 100000 });
                } else { }
            }
        } else { }

        // รอโหลดหน้าเมนูเสร็จสิ้น
        await this.page.waitForLoadState('networkidle');
    }

    async menuProtal(menu) {
        // รอเมนู NBS Portal แสดง
        await this.expect(this.page.locator('#textSearch')).toBeVisible({ timeout: 120000 });
        // พิมพ์ ค้นหา เมนู
        await this.page.locator('#textSearch').type(menu)
        // เลือก เมนู ที่ค้นหา
        await this.page.getByText(`${menu}`).click({ timeout: 100000 })
        // รอเมนูที่เลือกแสดง
        await this.expect(this.page.getByText(`${menu}`)).toBeVisible({ timeout: 120000 });
    }
}

module.exports = { gotoMenu };