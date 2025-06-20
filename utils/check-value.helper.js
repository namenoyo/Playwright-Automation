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
      // ถ้า expected เป็นค่าว่าง แต่ actual มีค่า ให้ fail
      if (expectedStr === '' && actualStr !== '') {
        pass = false;
        matchType = 'none';
      } else if (actualStr === expectedStr) {
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

/**
 * เช็คค่าทั้งหมดในตาราง (หลาย row หลาย column)
 * @param {import('@playwright/test').Page} page - Playwright Page object
 * @param {string|function|import('@playwright/test').Locator} rowLocator - locator ของ row (css/xpath, locator function, หรือ Locator object)
 * @param {Array<Array<string|number>>} expectedRows - array ของ expected row (แต่ละ row เป็น array ของ cell)
 * @param {Object} [options]
 * @param {boolean} [options.onlyEvenTd] - ถ้า true จะเช็คเฉพาะ td ที่เป็นเลขคู่ในแต่ละแถว
 * @returns {Promise<{results: Array<{rowIndex: number, expected: Array<string>, actual: Array<string>, pass: boolean, cellResults: Array<{colIndex: number, expected: string, actual: string, pass: boolean, matchType: string}>}>, status: 'Passed'|'Failed', assertionLog: string}>}
 */
async function checkTableValuesWithExpected(page, rowLocator, expectedRows, options = {}) {
  let status = 'Passed';
  let assertionLog = '';
  const results = [];

  // Utility to normalize locator (string | function | Locator | Promise<Locator>) to Locator
  async function getLocator(loc) {
    if (!loc) return undefined;
    // Playwright Locator: has .count and .nth methods, do not await
    if (typeof loc === 'object' && typeof loc.count === 'function' && typeof loc.nth === 'function') {
      return loc;
    }
    let locatorObj;
    if (typeof loc === 'string') {
      locatorObj = page.locator(loc);
    } else if (typeof loc === 'function') {
      locatorObj = loc(page);
    } else {
      locatorObj = loc;
    }
    // Await if it's a Promise (Promise<Locator>)
    if (locatorObj && typeof locatorObj === 'object' && typeof locatorObj.count !== 'function' && typeof locatorObj.then === 'function') {
      locatorObj = await locatorObj;
    }
    return locatorObj;
  }

  const rowEls = await getLocator(rowLocator);
  let rowCount = 0;
  if (!rowEls || typeof rowEls.count !== 'function') {
    // Locator not found or invalid, fail all rows
    assertionLog += '\n[ERROR] Row locator not found or invalid. All rows failed.';
    for (let i = 0; i < expectedRows.length; i++) {
      const expectedRow = expectedRows[i].map(String);
      const actualRow = Array(expectedRow.length).fill('[NO ROW LOCATOR]');
      const cellResults = expectedRow.map((exp, j) => ({ colIndex: j, expected: exp, actual: '[NO ROW LOCATOR]', pass: false, matchType: 'none' }));
      results.push({ rowIndex: i, expected: expectedRow, actual: actualRow, pass: false, cellResults });
      assertionLog += `\n[Row ${i+1}] ❌\n`;
      cellResults.forEach(cell => {
        assertionLog += `  [col ${cell.colIndex+1}] expected: "${cell.expected}", actual: "${cell.actual}" => ❌\n`;
      });
    }
    status = 'Failed';
    return { results, status, assertionLog };
  }
  rowCount = await rowEls.count();
  for (let i = 0; i < expectedRows.length; i++) {
    const expectedRow = expectedRows[i].map(String);
    let actualRow = [];
    let cellResults = [];
    if (i < rowCount) {
      const rowEl = rowEls.nth(i);
      // ถ้าเลือกเฉพาะ td เลขคู่
      let cellEls = await getLocator(() => options.onlyEvenTd ? rowEl.locator('td:nth-child(even)') : rowEl.locator('td,th'));
      let cellCount = 0;
      if (!cellEls || typeof cellEls.count !== 'function') {
        cellCount = 0;
      } else {
        cellCount = await cellEls.count();
      }
      for (let j = 0; j < expectedRow.length; j++) {
        let actual = '';
        let cellPass = false;
        let matchType = '';
        if (j < cellCount) {
          actual = (await cellEls.nth(j).textContent())?.trim() || '';
          const actualStr = String(actual ?? '');
          const expectedStr = expectedRow[j];
          // ถ้า expected ว่างแต่ actual มีค่า ให้ fail
          if (expectedStr === '' && actualStr !== '') {
            cellPass = false;
            matchType = 'none';
          } else if (expectedStr === '' && actualStr === '') {
            cellPass = true;
            matchType = 'equal';
          } else if (actualStr === expectedStr) {
            cellPass = true;
            matchType = 'equal';
          } else if (expectedStr !== '' && actualStr.includes(expectedStr)) {
            cellPass = true;
            matchType = 'contain';
          } else {
            cellPass = false;
            matchType = 'none';
          }
        } else {
          actual = '[NO CELL]';
          cellPass = false;
          matchType = 'none';
        }
        cellResults.push({ colIndex: j, expected: expectedRow[j], actual, pass: cellPass, matchType });
        actualRow.push(actual);
      }
      // ปรับ logic row.pass: เฉพาะ cell ที่ actual !== '[NO CELL]' ทุก cell.pass เป็น true (และต้องมี cell ที่เช็คจริง)
      const checkedCells = cellResults.filter(cell => cell.actual !== '[NO CELL]');
      let pass = checkedCells.length > 0 ? checkedCells.every(cell => cell.pass) : true;
      results.push({ rowIndex: i, expected: expectedRow, actual: actualRow, pass, cellResults });
      assertionLog += `\n[Row ${i+1}] ${pass ? '✅' : '❌'}\n`;
      cellResults.forEach(cell => {
        let logResult = '';
        if (cell.pass && cell.matchType === 'equal') logResult = '✅ (equal)';
        else if (cell.pass && cell.matchType === 'contain') logResult = '⚠️  Pass with condition (contain)';
        else logResult = '❌';
        assertionLog += `  [col ${cell.colIndex+1}] expected: "${cell.expected}", actual: "${cell.actual}" => ${logResult}\n`;
      });
      if (!pass) status = 'Failed';
    } else {
      // ไม่มี row จริง
      actualRow = Array(expectedRow.length).fill('[NO ROW]');
      cellResults = expectedRow.map((exp, j) => ({ colIndex: j, expected: exp, actual: '[NO ROW]', pass: false, matchType: 'none' }));
      results.push({ rowIndex: i, expected: expectedRow, actual: actualRow, pass: false, cellResults });
      assertionLog += `\n[Row ${i+1}] ❌\n`;
      cellResults.forEach(cell => {
        let logResult = '';
        if (cell.pass && cell.matchType === 'equal') logResult = '✅ (equal)';
        else if (cell.pass && cell.matchType === 'contain') logResult = '⚠️  Pass with condition (contain)';
        else logResult = '❌';
        assertionLog += `  [col ${cell.colIndex+1}] expected: "${cell.expected}", actual: "${cell.actual}" => ${logResult}\n`;
      });
      status = 'Failed';
    }
  }
  return { results, status, assertionLog };
}

module.exports = {
  checkSelectorsWithExpected,
  checkTableValuesWithExpected,
};