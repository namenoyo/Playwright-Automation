/**
 * เช็คค่าบนหน้าจอเทียบกับ expected values
 * @param {import('@playwright/test').Page} page - Playwright Page object
 * @param {Array<{label: string, locator: any, expected: string, matchType?: 'equal'|'contain'}>} selectorsWithExpected - array ของ object ที่มี label, locator, expected, matchType
 * @returns {Promise<{results: Array<{label: string, expected: string, actual: string, pass: boolean, matchType: string}>, status: 'Passed'|'Failed', assertionLog: string}>}
 */
async function checkSelectorsWithExpected(page, selectorsWithExpected) {
  const results = [];
  let status = 'Passed';
  let assertionLog = '';
  for (const { label, locator, expected, matchType = 'equal' } of selectorsWithExpected) {
    let actual = '';
    let pass = false;
    try {
      // รองรับ locator เป็น string หรือ locator function
      const el = typeof locator === 'string' ? page.locator(locator) : locator(page);
      actual = (await el.textContent())?.trim() || '';
      if (matchType === 'contain') {
        pass = actual.includes(expected);
      } else {
        pass = actual === expected;
      }
    } catch (e) {
      actual = '[ERROR: ' + (e.message || String(e)) + ']';
      pass = false;
    }
    results.push({ label, expected, actual, pass, matchType });
    assertionLog += `\n[${label}] expected: "${expected}" (${matchType}), actual: "${actual}" => ${pass ? '✅' : '❌'}`;
    if (!pass) status = 'Failed';
  }
  return { results, status, assertionLog };
}

module.exports = {
  checkSelectorsWithExpected,
};