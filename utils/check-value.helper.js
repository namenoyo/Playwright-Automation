/**
 * เช็คค่าบนหน้าจอเทียบกับ expected values (auto equal/contain)
 * @param {import('@playwright/test').Page} page - Playwright Page object
 * @param {Array<{label: string, locator: any, expected: string|number}>} selectorsWithExpected - array ของ object ที่มี label, locator, expected
 * @returns {Promise<{results: Array<{label: string, expected: string, actual: string, pass: boolean, matchType: string}>, status: 'Passed'|'Failed', assertionLog: string}>}
 */
async function checkSelectorsWithExpected(page, selectorsWithExpected) {
  const results = [];
  let status = 'Passed';
  let assertionLog = '';
  for (const { label, locator, expected } of selectorsWithExpected) {
    let actual = '';
    let pass = false;
    let matchType = '';
    try {
      // รองรับ locator เป็น string หรือ locator function
      const el = typeof locator === 'string' ? page.locator(locator) : locator(page);
      actual = (await el.textContent())?.trim() || '';
      const actualStr = String(actual ?? '');
      const expectedStr = String(expected ?? '');
      if (actualStr === expectedStr) {
        pass = true;
        matchType = 'equal';
      } else if (actualStr.includes(expectedStr)) {
        pass = true;
        matchType = 'contain';
      } else {
        pass = false;
        matchType = 'none';
      }
    } catch (e) {
      actual = '[ERROR: ' + (e.message || String(e)) + ']';
      pass = false;
      matchType = 'error';
    }
    results.push({ label, expected: String(expected), actual, pass, matchType });
    let logResult = '';
    if (pass && matchType === 'equal') {
      logResult = '✅ (equal)';
    } else if (pass && matchType === 'contain') {
      logResult = '⚠️  (contain)';
    } else {
      logResult = '❌';
    }
    assertionLog += `\n[${label}] expected: "${expected}", actual: "${actual}" => ${logResult}`;
    if (!pass) status = 'Failed';
  }
  return { results, status, assertionLog };
}

module.exports = {
  checkSelectorsWithExpected,
};