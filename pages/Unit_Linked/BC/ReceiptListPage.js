const { search_ReceiptList } = require("../../../locators/Unit_Linked/BC/ReceiptList.locator");

export class ReceiptListPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.search_ReceiptList = search_ReceiptList(page);
    }

    async SearchReceiptList(data) {
        // กรอกเลขคำขอในช่องค้นหา
        await this.search_ReceiptList.receiptlist_txtrequestcode(data.requestcode);
        // กรอกวันที่ในช่อง จากวันที่
        await this.search_ReceiptList.receiptlist_txtfromdate.fill('');
        // กรอกวันที่ในช่อง ถึงวันที่
        await this.search_ReceiptList.receiptlist_txttodate.fill('');
        // กดปุ่มค้นหา
        await this.search_ReceiptList.receiptlist_btnsearch().click({ timeout: 10000 });
        // รอโหลดข้อมูลในตาราง
        await this.expect(this.page.locator('div[class="yui3-widget-bd"]', { hasText: 'กำลังโหลดข้อมูลเข้าตาราง...', timeout: 10000 })).not.toBeVisible({ timeout: 20000 });
    }

    async CheckMatchProposalNo() {
        // วนลูปตรวจสอบข้อมูลในตารางโดยมีเงื่อนไขว่า สถานะ = จับคู่ได้ หรือ วนลูปครบตามจำนวนรอบที่กำหนด
        let matchFound = false;
        const maxRowsToCheck = 10; // กำหนดจำนวนรอบที่ต้องการตรวจสอบ
        // const rowCount = await this.page.locator('tbody[class="yui3-datatable-data"]').count();
        // console.log("จำนวนแถวในตาราง: " + rowCount);
        // // // วนลูปจนกว่าจะพบข้อมูลที่ตรงกับเงื่อนไขหรือครบจำนวนรอบที่กำหนด
        // if (rowCount > 0) {
        for (let i = 0; i < maxRowsToCheck; i++) {
            // กดปุ่มค้นหา
            await this.search_ReceiptList.receiptlist_btnsearch().click({ timeout: 10000 });
            const status = await this.page.locator(`tbody[class="yui3-datatable-data"] > tr > td`).nth(1).textContent();
            if (status === "จับคู่ได้") {
                matchFound = true;
                console.log(`สถานะการชำระเบี้ยเป็น "จับคู่ได้" เรียบร้อยแล้ว`);
                break; // ออกจากลูปทันทีเมื่อเจอข้อมูลที่ match
            }
            await this.page.waitForTimeout(10000); // รอ 10 วินาที กรณีสถานะยังไม่เปลี่ยนแปลง
        }

        if (!matchFound) {
            throw new Error("ไม่พบข้อมูลที่สถานะจับคู่ได้ภายในจำนวนรอบที่กำหนด");
        }
        // }
    }
}