import { test, expect } from '@playwright/test';
// @ts-ignore
const { LoginPage } = require('../pages/login.page');
// @ts-ignore
const { CISPage } = require('../pages/cis.page');
// @ts-ignore
const { validUser } = require('../data/login.data');
// @ts-ignore
const { policyNo } = require('../data/cis.data');
// @ts-ignore
const { sendTestResultToGoogleSheetGSAppScript } = require('../utils/google-sheet-gsappscript.helper');
// @ts-ignore
const { logSelectorsSoftAssert } = require('../Reuseable/log');
// @ts-ignore
const { checkValueOnScreen } = require('../utils/check-value.helper');
const cisLocators = require('../locators/cis.locator');
const { queryPg } = require('../utils/db.helper');
const { getDbConfig, getExpectedTable, getExpectedTableNormalized } = require('../utils/db.helper');

const ENV = process.env.ENV || 'sit';

// ตัวอย่าง selector test (ควรปรับให้เหมาะกับระบบจริง)
const selectorsToCheck = [
  { label: 'Customer Name', locator: cisLocators.customerName },
  { label: 'Policy Number', locator: cisLocators.policyNumber },
  // เพิ่ม locator อื่นๆ ได้ที่นี่
];

// test('TS_Test_Element', async ({ page }, testInfo) => {
//   timestamp: testInfo.setTimeout(60000); // Set timeout for the test
//   const loginPage = new LoginPage(page, ENV);
//   const cisPage = new CISPage(page);
//   let status = 'Passed';
//   let errorMessage = '';
//   let assertionLog = '';
//   try {
//     await loginPage.goto();
//     await loginPage.login(validUser.username, validUser.password);
//     await cisPage.goToCustomerInfo();
//     const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
//     await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

//     // เรียกใช้ฟังก์ชันกลาง logSelectorsSoftAssert (แบบ locator function)
//     const result = await logSelectorsSoftAssert(page, selectorsToCheck, true);
//     assertionLog = result.assertionLog;
//     if (result.status === 'Failed') status = 'Failed';
//   } catch (e) {
//     status = 'Failed';
//     errorMessage = e.message || String(e);
//     throw e;
//   } finally {
//     // ส่งผลลัพธ์ไป Google Sheet พร้อม assertion log
//     await sendTestResultToGoogleSheetGSAppScript({
//       suite: 'CIS Suite',
//       caseName: testInfo.title,
//       assertionLog,
//       status,
//       testTime: new Date().toLocaleString(),
//       tester: process.env.TESTER || 'Auto',
//       duration: testInfo.duration,
//       errorMessage
//     });
//   }
// });

test('TS_Test_CheckValueOnScreen', async ({ page }, testInfo) => {
  timestamp: testInfo.setTimeout(60000); // Set timeout for the test
  const loginPage = new LoginPage(page, ENV);
  const cisPage = new CISPage(page);
  let status = 'Passed';
  let errorMessage = '';
  let assertionLog = '';
  // ตัวอย่าง expected values (ควรดึงจาก data จริงหรือ mock data)
  const selectorsWithExpected = [
    { label: 'Policy Number', locator: cisLocators.policyNumber, expected: policyNo },
    // { label: 'Policy Number', locator: cisLocators.customerNumber, expected: policyNo }, // ไม่ผ่านเพราะค่าไม่ตรงกัน
    // { label: 'Customer Number', locator: cisLocators.customerNumber, expected: '' }, // ไม่่ผ่านเพราะ expected เป็นค่าว่าง แต่ actual มีค่า
    { label: 'Customer Number', locator: cisLocators.customerNumber, expected: '25662157384' },
    { label: 'Customer Number', locator: cisLocators.customerNumber, expected: 'เลขข้อมูลลูกค้า   25662157384' },
    // เพิ่ม expected value อื่นๆ ได้ที่นี่
  ];
  try {
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);
    await cisPage.goToCustomerInfo();
    const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
    await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

    // เรียกใช้ฟังก์ชันใหม่ที่เพิ่มเข้ามา
    const { results, status: checkStatus, assertionLog: checkLog } = await require('../utils/check-value.helper').checkSelectorsWithExpected(page, selectorsWithExpected);
    assertionLog = checkLog;
    if (checkStatus === 'Failed') status = 'Failed';
    // Assertion แบบละเอียด (auto equal/contain)
    let failedAssertions = [];
    let assertionLogArr = [];
    for (const r of results) {
      let pass = false;
      let logLine = '';
      const actualStr = String(r.actual ?? '');
      const expectedStr = String(r.expected ?? '');
      // ถ้า expected ว่างแต่ actual มีค่า ให้ fail
      if (expectedStr === '' && actualStr !== '') {
        pass = false;
        logLine = `❌ FAIL (expected empty): [${r.label}] expected: "", actual: "${actualStr}"`;
        failedAssertions.push(logLine);
        console.warn('Soft assertion failed (expected empty):', r.label, expectedStr, actualStr);
      } else if (actualStr === expectedStr) {
        pass = true;
        logLine = `✅ PASS (equal): [${r.label}] expected: "${expectedStr}", actual: "${actualStr}"`;
      } else if (actualStr.includes(expectedStr)) {
        pass = true;
        logLine = `⚠️  Pass with condition (contain): [${r.label}] expected: "${expectedStr}", actual: "${actualStr}"`;
      } else {
        pass = false;
        logLine = `❌ FAIL: [${r.label}] expected: "${expectedStr}", actual: "${actualStr}"`;
        failedAssertions.push(logLine);
        // log warning แต่ไม่ throw
        console.warn('Soft assertion failed:', r.label, expectedStr, actualStr);
      }
      assertionLogArr.push(logLine);
    }
    assertionLog = assertionLogArr.join('\n');
    // แสดง assertion log ทั้งตอนผ่านและ fail
    console.log('Assertion Results:', assertionLog);
    if (failedAssertions.length > 0) {
      throw new Error('Soft assertion(s) failed:\n' + failedAssertions.join('\n---\n'));
    }
  } catch (e) {
    status = 'Failed';
    errorMessage = e.message || String(e);
    throw e;
  }
  // } finally {
  //   // ส่งผลลัพธ์ไป Google Sheet พร้อม assertion log
  //   await sendTestResultToGoogleSheetGSAppScript({
  //     suite: 'CIS Suite',
  //     caseName: testInfo.title,
  //     assertionLog,
  //     status,
  //     testTime: new Date().toLocaleString(),
  //     tester: process.env.TESTER || 'Auto',
  //     duration: testInfo.duration,
  //     errorMessage
  //   });
  // }
});

// ประกาศ expectedTableLabel แยกไว้ด้านบน
// สามารถใส่ string เดียว หรือ array ของ label ได้ เช่น ['Payment History', 'Other Label']
// ถ้าเป็นค่าว่าง หรือ array ที่มีแต่ค่าว่าง จะค้นหาทั้งหมด
const expectedTableLabel = ['']; // หรือ ['Payment History', 'Other Label'] ค้นหาหลาย label ได้
// const expectedTableLabel = 'Payment History'; // หรือ 'Payment History' ค้นหา label เดียว
// const expectedTableLabel = ''; // ค้นหาทั้งหมด ถ้าเป็นค่าว่าง หรือ array ที่มีแต่ค่าว่าง
// const expectedTableLabel = []; // ค้นหาทั้งหมด ถ้าเป็นค่าว่าง หรือ array ที่มีแต่ค่าว่าง
// const expectedTableLabel = ['']; // ค้นหาทั้งหมด ถ้าเป็นค่าว่าง หรือ array ที่มีแต่ค่าว่าง
// const expectedTableLabel = ['Payment History', 'Other Label']; // ค้นหาหลาย label ได้

test('TS_Test_CheckTableValuesOnScreen', async ({ page }, testInfo) => {
  testInfo.setTimeout(60000);
  const loginPage = new LoginPage(page, ENV);
  const cisPage = new CISPage(page);
  let status = 'Passed';
  let errorMessage = '';
  let assertionLog = '';


  // ดึง expectedTable จาก database แบบ normalized
  const dbConfig = getDbConfig();
  // เช็ค connection database ก่อน
  try {
    console.log('--- [DEBUG] Checking database connection...');
    await queryPg(dbConfig, 'SELECT 1');
    console.log('✅ Database connection successful.');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message || err);
    throw new Error('Database connection failed.');
  }
  // ถ้า expectedTableLabel เป็นค่าว่าง หรือ array ที่มีแต่ค่าว่าง จะดึงข้อมูลทั้งหมด ไม่ใส่ where
  let expectedTable;
  if (Array.isArray(expectedTableLabel)) {
    // trim ทุกตัว ถ้าเหลือแต่ค่าว่าง หรือ array ว่าง ให้ค้นหาทั้งหมด
    const filtered = expectedTableLabel.map(l => (l || '').trim()).filter(l => l !== '');
    if (filtered.length > 0) {
      expectedTable = await getExpectedTableNormalized(dbConfig, filtered);
    } else {
      expectedTable = await getExpectedTableNormalized(dbConfig);
    }
  } else if (typeof expectedTableLabel === 'string' && expectedTableLabel.trim() !== '') {
    expectedTable = await getExpectedTableNormalized(dbConfig, expectedTableLabel.trim());
  } else {
    expectedTable = await getExpectedTableNormalized(dbConfig);
  }
  // แสดงผล expectedTable ที่ดึงมาจาก database
  console.log('--- [DEBUG] expectedTable from database ---');
  if (expectedTable && expectedTable.length > 0) {
    expectedTable.forEach((item, i) => {
      if (item.label) {
        console.log(`[Row ${i + 1}] [label: ${item.label}]`, item.row);
      } else if (Array.isArray(expectedTableLabel) && expectedTableLabel.length === 1) {
        console.log(`[Row ${i + 1}] [label: ${expectedTableLabel[0]}]`, item.row);
      } else if (typeof expectedTableLabel === 'string' && expectedTableLabel.trim() !== '') {
        console.log(`[Row ${i + 1}] [label: ${expectedTableLabel}]`, item.row);
      } else {
        console.log(`[Row ${i + 1}]`, item.row);
      }
    });
  } else {
    console.log('expectedTable is empty');
  }

  // --- Group expectedTable by label ---
  const groupByLabel = expectedTable.reduce((acc, item) => {
    const label = item.label || 'NO_LABEL';
    if (!acc[label]) acc[label] = [];
    acc[label].push(item.row);
    return acc;
  }, {});

  console.log('========== [START] TS_Test_CheckTableValuesOnScreen =========');
  try {
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);
    await cisPage.goToCustomerInfo();
    const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
    await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

    let totalRows = 0;
    let totalCells = 0;
    let passedCells = 0;
    let failedCells = 0;
    let allResults = [];
    let assertionLogArrWithLabel = [];

    for (const [label, rows] of Object.entries(groupByLabel)) {
      // เช็คทีละกลุ่ม label โดยเริ่ม row index ที่ 1 ใหม่
      const { results, status: checkStatus, assertionLog: checkLog } = await require('../utils/check-value.helper').checkTableValuesWithExpected(
        page,
        cisLocators.gridpaymentHistory, // locator เดียวกัน (ถ้า UI มีหลาย grid ต้องปรับ)
        rows,
        { onlyEvenTd: true }
      );
      assertionLog = checkLog;
      if (checkStatus === 'Failed') status = 'Failed';
      allResults.push({ label, results });
      // log assertion สำหรับแต่ละ label (ใช้ row.pass ที่ได้จาก helper โดยตรง)
      for (let i = 0; i < results.length; i++) {
        assertionLogArrWithLabel.push(`[Row ${i + 1}]${label !== 'NO_LABEL' ? ` [label: ${label}]` : ''} ${results[i].pass ? '✅' : '❌'}`);
      }
      totalRows += results.length;
      results.forEach(row => {
        row.cellResults.forEach(cell => {
          if (String(cell.actual ?? '') !== '[NO CELL]') {
            totalCells++;
            if (cell.pass) passedCells++;
            else failedCells++;
          }
        });
      });
    }

    // log assertion summary
    if (assertionLogArrWithLabel.length > 0) {
      console.log('Table Assertion Results:\n' + assertionLogArrWithLabel.join('\n') + '\n');
    } else {
      console.log('Table Assertion Results:\n' + assertionLog + '\n');
    }

    // log รายละเอียดแต่ละ row
    allResults.forEach(({ label, results }) => {
      results.forEach((row, i) => {
        console.log(`Row ${i + 1}${label !== 'NO_LABEL' ? ` [label: ${label}]` : ''}`);
        row.cellResults.forEach(cell => {
          const actualStr = String(cell.actual ?? '');
          if (actualStr === '[NO CELL]') return; // ข้าม cell ที่ไม่เช็คจริง
          let resultText = '';
          const expectedStr = String(cell.expected ?? '');
          if (expectedStr === '' && actualStr !== '') {
            resultText = '❌ (expected empty)';
          } else if (cell.pass && cell.matchType === 'equal') {
            resultText = '✅ (equal)';
          } else if (cell.pass && cell.matchType === 'contain') {
            resultText = '⚠️ (contain)';
          } else {
            resultText = '❌';
          }
          const log = `[Col ${cell.colIndex + 1}] expected: "${cell.expected}", actual: "${cell.actual}" => ${resultText}`;
          console.log(log);
        });
        console.log('');
      });
    });

    // Summary output
    console.log('--- Table Assertion Summary ---');
    console.log(`Total Rows: ${totalRows}`);
    console.log(`Total Cells: ${totalCells}`);
    console.log(`Passed Cells: ${passedCells}`);
    console.log(`Failed Cells: ${failedCells}`);
    if (failedCells === 0) {
      console.log('✅ All table values matched expected results.');
    } else {
      console.log('❌ Some table values did not match expected results.');
    }
    // ถ้ามี row ไหน fail ให้ throw error
    const failedRows = allResults.flatMap(({ results }) => results.filter(r => !r.pass));
    if (failedRows.length > 0) {
      throw new Error(`Table assertion(s) failed for grid: ${expectedTableLabel || 'N/A'}. See log above.`);
    }
    console.log('========== [END] TS_Test_CheckTableValuesOnScreen (Status:', status,') =========');
  } catch (e) {
    status = 'Failed';
    errorMessage = e.message || String(e);
    console.log('========== [END] TS_Test_CheckTableValuesOnScreen (Status:', status,') =========');
    throw e;
  }
  // สามารถเพิ่ม logic ส่งผลลัพธ์ไป Google Sheet ได้เหมือนเดิม
});

