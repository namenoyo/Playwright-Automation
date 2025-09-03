
import { searchcustomerCISLocators } from "../../locators/CIS/customer_cis.locators";
import { checkvalueExpected } from "../../utils/check-value";

export class searchCustomerCIS {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.customerId = null;
        this.searchcustomercislocators = searchcustomerCISLocators(page);
    }

    async searchCustomer(policy) {
        // คลิ๊กที่ช่องเลขที่กรมธรรม์
        await this.searchcustomercislocators.policyInput.click();
        // กรอกเลขที่กรมธรรม์
        await this.page.keyboard.type(policy, { delay: 200 });

        // รอให้มีการตอบสนองจากเซิร์ฟเวอร์หลังจากกรอกข้อมูล
        const [response] = await Promise.all([
            this.page.waitForResponse(response =>
                response.url().includes('/customerSearch/customerInfoList.html') && response.status() === 200
            ),
            // กดปุ่มค้นหา
            await this.searchcustomercislocators.buttonSearch.click()
        ]);
        // เก็บ response JSON
        const jsonResponse = await response.json();
        this.customerId = jsonResponse.data.data[0].customerId

        // รอให้ผลลัพธ์การค้นหาปรากฏ
        await this.expect(this.searchcustomercislocators.checkdatagridPolicy(policy)).toBeVisible({ timeout: 120000 });
    }

    async clickdetailCustomer() {
        // เก็บค่า response customerId ไว้ในตัวแปร value_customerId
        const value_customerId = this.customerId
        // รอให้มีการทำงาน api จนเสร็จได้ response code = 200
        await Promise.all([
            this.page.waitForResponse(response =>
                response.url().includes(`findNewClaimHistory.html?params.customerId=${value_customerId}`) && response.status() === 200
            ),
            // กดปุ่ม รายละเอียด ข้อมูลลูกค้า
            await this.searchcustomercislocators.customerdetailButton.click()
        ]);
    }
}

export class detailCustomerCIS {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async checkdatadetailCIS(locators, expectedarray, policyno) {
        const checkvalueexpected = new checkvalueExpected(this.page, this.expect)

        let result = await checkvalueexpected.checkvalueOnscreen(locators, expectedarray, policyno);

        return result
    }
}

module.exports = { searchCustomerCIS, detailCustomerCIS }