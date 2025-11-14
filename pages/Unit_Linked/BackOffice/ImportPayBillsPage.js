const { ImportPayBillsLocators } = require('../../../locators/Unit_Linked/BackOffice/ImportPayBills.locators');

class ImportPayBillsPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.locators = ImportPayBillsLocators(page);
    }

    async importfilePayBills(data) {
        // คลิกปุ่ม "นำเข้าไฟล์"
        await this.locators.importpaybills_btnimportfile.click({ timeout: 10000 });
        // รอให้ป๊อปอัพอัปโหลดปรากฏขึ้น
        await this.expect(this.locators.importpaybills_popupupload).toBeVisible({ timeout: 10000 });
        // เลือกประเภทการอัปโหลด
        await this.locators.importpaybills_seluploadtype.selectOption('CB');
        // อัปโหลดไฟล์
        const filePath = `./generate_file_bill_counter_bank/${data.filename}`;
        await this.locators.importpaybills_btnselectfile.setInputFiles(filePath);
        // คลิกปุ่ม "นำเข้า"
        await this.locators.importpaybills_btnupload.click({ timeout: 10000 });
        // รอผลการนำเข้าสำเร็จ โดยดึงข้อความสถานะ
        await this.expect(this.locators.importpaybills_labelsuccess).toBeVisible({ timeout: 20000 });
        const statusImport = await this.locators.importpaybills_labelsuccess.textContent();
        if (statusImport === 'สำเร็จ') {
            console.log(`\nImport Pay Bills File: ${data.filename} - Status: ${statusImport}`);
            // ปิดป๊อปอัพอัปโหลด
            await this.locators.importpaybills_btnclosepopup.click({ timeout: 10000 });
            // รอให้ป๊อปอัพอัปโหลดหายไป
            await this.expect(this.locators.importpaybills_popupupload).not.toBeVisible({ timeout: 10000 });
        } else {
            throw new Error(`Import Pay Bills File Failed: ${data.filename} - Status: ${statusImport}`);
        }
    }
}

module.exports = { ImportPayBillsPage };