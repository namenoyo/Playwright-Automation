const { normalizeText, split_total_unit } = require('../utils/common');

class checkvalueExpected {
    constructor(page, expect) {
        this.page = page
        this.expect = expect
    }

    async checkvalueOnscreen(locators, expectedvalue, policyno) {
        let status_result = ''
        let assertion_result = ''

        // เช็คว่า locators ที่ดึงมาเป็นประเภทอะไร และใช้ตามปะรเภท
        let formatlocator = ''
        if (typeof locators === 'string') {
            formatlocator = await this.page.locator(locators);
        } else if (typeof locators === 'object') {
            formatlocator = await locators;
        } else if (typeof locators === 'function') {
            formatlocator = await this.page.locator(locators(policyno));
        } else { }

        // ตรวจสอบจำนวน locator ที่พบ
        const locator_count = await formatlocator.count();
        if (locator_count === 0) {
            console.log(`❌ Locator not found: ${locators}`);
            status_result = 'Failed'
            assertion_result = `❌ Locator not found: ${locators}`
        } else {
            await this.expect(formatlocator).toBeVisible({ timeout: 60000 });
            const actualvalue = await formatlocator.textContent();
            const cleanactualvalue = normalizeText(actualvalue)
            const matchactual = cleanactualvalue?.trim();
            const cleanexpectedvalue = normalizeText(expectedvalue)
            if (matchactual === cleanexpectedvalue) {
                console.log(`✅ Match: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
                status_result = 'Passed'
                assertion_result = `✅ Match: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
            } else if (matchactual.includes(cleanexpectedvalue)) {
                console.log(`⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
                status_result = 'Passed'
                assertion_result = `⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
            } else {
                console.log(`❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
                status_result = 'Failed'
                assertion_result = `❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
            }
        }

        // await this.expect(formatlocator).toBeVisible({ timeout: 60000 });
        // const actualvalue = await formatlocator.textContent();
        // const cleanactualvalue = normalizeText(actualvalue)
        // const matchactual = cleanactualvalue?.trim();
        // const cleanexpectedvalue = normalizeText(expectedvalue)
        // if(matchactual === cleanexpectedvalue) {
        //     console.log(`✅ Match: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
        //     status_result = 'Passed'
        //     assertion_result = `✅ Match: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
        // } else if(matchactual.includes(cleanexpectedvalue)) {
        //     console.log(`⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
        //     status_result = 'Passed'
        //     assertion_result = `⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
        // } else {
        //     console.log(`❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
        //     status_result = 'Failed'
        //     assertion_result = `❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
        // }
        return { status_result, assertion_result }
    }

    async checkvalueOndatabase(locators, valuedatabase, policyno) {
        let status_result = ''
        let assertion_result = ''

        // เช็คว่า locators ที่ดึงมาเป็นประเภทอะไร และใช้ตามปะรเภท
        let formatlocator = ''
        if (typeof locators === 'string') {
            formatlocator = await this.page.locator(locators);
        } else if (typeof locators === 'object') {
            formatlocator = await locators;
        } else if (typeof locators === 'function') {
            formatlocator = await this.page.locator(locators(policyno));
        } else { }

        await this.expect(formatlocator).toBeVisible({ timeout: 60000 });
        const actualvalue = await formatlocator.textContent();
        const cleanactualvalue = normalizeText(actualvalue)
        const matchactual = cleanactualvalue?.trim();
        const cleanvaluedatabase = normalizeText(valuedatabase)
        if (matchactual === cleanvaluedatabase) {
            console.log(`✅ Match: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`)
            status_result = 'Passed'
            assertion_result = `✅ Match: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`
        } else if (matchactual.includes(cleanvaluedatabase)) {
            console.log(`⚠️  Contains: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`)
            status_result = 'Passed'
            assertion_result = `⚠️  Contains: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`
        } else {
            console.log(`❌ Mismatch: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`)
            status_result = 'Failed'
            assertion_result = `❌ Mismatch: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`
        }
        return { status_result, assertion_result }
    }

    async checkvalueOnscreen_GoogleSheet_calSPlife(locators, expectedvalue, policyno, rowdata) {
        let status_result = ''
        let assertion_result = ''

        // เช็คว่า locators ที่ดึงมาเป็นประเภทอะไร และใช้ตามปะรเภท
        let formatlocator = ''
        if (typeof locators === 'string') {
            formatlocator = await this.page.locator(locators);
        } else if (typeof locators === 'object') {
            formatlocator = await locators;
        } else if (typeof locators === 'function') {
            formatlocator = await this.page.locator(locators(policyno));
        } else { }

        await this.expect(formatlocator).toBeVisible({ timeout: 60000 });
        const actualvalue = await formatlocator.textContent();
        const cleanactualvalue = normalizeText(actualvalue)
        const matchactual = cleanactualvalue?.trim();
        const split_total = split_total_unit(matchactual); // แยกตัวเลขออกจากหน่วย "บาท"
        const cleanexpectedvalue = normalizeText(expectedvalue)
        if (split_total === cleanexpectedvalue) {
            console.log(`✅ Match: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`)
            status_result = 'Passed'
            assertion_result = `✅ Match: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`
        } else if (split_total.includes(cleanexpectedvalue)) {
            console.log(`⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`)
            status_result = 'Passed'
            assertion_result = `⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`
        } else {
            console.log(`❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`)
            status_result = 'Failed'
            assertion_result = `❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`
            // await this.page.waitForTimeout(150); // รอ 150 ms
            // await this.page.screenshot({ path: `screenshots/SPLife/row_unique-${rowdata}_failed.png`, fullPage: true });
        }
        return { status_result, assertion_result }
    }

    async checkbox_enable_disable_Onscreen(locators, expectedvalue) {
        let status_result = ''
        let assertion_result = ''

        // ตรวจสอบจำนวน locator ที่พบ
        const locator_count = await locators.count();
        // ถ้าไม่พบ locators ให้แจ้งว่าไม่พบ
        if (locator_count === 0) {
            console.log(`❌ Locator not found: ${locators}`);
            status_result = 'Failed'
            assertion_result = `❌ Locator not found: ${locators}`
        } else {
            // ตรวจสอบสถานะจริง
            const isEnabled = await locators.isEnabled();

            // แปลง boolean เป็น string 'enable' / 'disable'
            const actualStatus = isEnabled ? 'enable' : 'disable';

            if (expectedvalue === actualStatus) {
                console.log(`✅ Match: Expected = ${expectedvalue} : Actual = ${actualStatus}`)
                status_result = 'Passed'
                assertion_result = `✅ Match: Expected = ${expectedvalue} : Actual = ${actualStatus}`
            } else {
                console.log(`❌ Mismatch: Expected = ${expectedvalue} : Actual = ${actualStatus}`)
                status_result = 'Failed'
                assertion_result = `❌ Mismatch: Expected = ${expectedvalue} : Actual = ${actualStatus}`
            }
        }

        // // ตรวจสอบสถานะจริง
        // const isEnabled = await locators.isEnabled();

        // // แปลง boolean เป็น string 'enable' / 'disable'
        // const actualStatus = isEnabled ? 'enable' : 'disable';

        // if (expectedvalue === actualStatus) {
        //     console.log(`✅ Match: Expected = ${expectedvalue} : Actual = ${actualStatus}`)
        //     status_result = 'Passed'
        //     assertion_result = `✅ Match: Expected = ${expectedvalue} : Actual = ${actualStatus}`
        // } else {
        //     console.log(`❌ Mismatch: Expected = ${expectedvalue} : Actual = ${actualStatus}`)
        //     status_result = 'Failed'
        //     assertion_result = `❌ Mismatch: Expected = ${expectedvalue} : Actual = ${actualStatus}`
        // }
        return { status_result, assertion_result }
    }
}

module.exports = { checkvalueExpected }