import { normalizeText } from "./common";

export class checkvalueExpected {
    constructor(page, expect) {
        this.page = page
        this.expect = expect
    }

    async checkvalueOnscreen(locators, expectedvalue) {
        let status_result = ''
        let assertion_result = ''
        const actualvalue = await locators.textContent();
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
}

module.exports = { checkvalueExpected }