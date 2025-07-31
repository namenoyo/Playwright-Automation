import { normalizeText } from "./common";
import { split_total_unit } from "./common";

export class checkvalueExpected {
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

        await this.expect(formatlocator).toBeVisible({ timeout: 60000 });
        const actualvalue = await formatlocator.textContent();
        const cleanactualvalue = normalizeText(actualvalue)
        const matchactual = cleanactualvalue?.trim();
        const cleanexpectedvalue = normalizeText(expectedvalue)
        if(matchactual === cleanexpectedvalue) {
            console.log(`✅ Match: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
            status_result = 'Passed'
            assertion_result = `✅ Match: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
        } else if(matchactual.includes(cleanexpectedvalue)) {
            console.log(`⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
            status_result = 'Passed'
            assertion_result = `⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
        } else {
            console.log(`❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`)
            status_result = 'Failed'
            assertion_result = `❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual   = ${matchactual}`
        }
        return { status_result, assertion_result }
    }

    async checkvalueOndatabase (locators, valuedatabase, policyno) {
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
        if(matchactual === cleanvaluedatabase) {
            console.log(`✅ Match: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`)
            status_result = 'Passed'
            assertion_result = `✅ Match: Expected in database = ${cleanvaluedatabase} : Actual on screen = ${matchactual}`
        } else if(matchactual.includes(cleanvaluedatabase)) {
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

    async checkvalueOnscreen_GoogleSheet_calSPlife(locators, expectedvalue, policyno) {
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
        if(split_total === cleanexpectedvalue) {
            console.log(`✅ Match: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`)
            status_result = 'Passed'
            assertion_result = `✅ Match: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`
        } else if(split_total.includes(cleanexpectedvalue)) {
            console.log(`⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`)
            status_result = 'Passed'
            assertion_result = `⚠️  Contains: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`
        } else {
            console.log(`❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`)
            status_result = 'Failed'
            assertion_result = `❌ Mismatch: Expected = ${cleanexpectedvalue} : Actual = ${split_total}`
        }
        return { status_result, assertion_result }
    }
}

module.exports = { checkvalueExpected }