/**
 * ฟังก์ชันกลางสำหรับส่งผลลัพธ์ test ไป Google Sheet (Playwright)
 * @param {Object} params - พารามิเตอร์ที่รับจาก test context
 * @param {import('@playwright/test').TestInfo} params.testInfo
 * @param {string} params.assertionLog
 * @param {string} params.status
 * @param {string} [params.errorMessage]
 * @param {string} [params.suite]
 * @returns {Promise<void>}
 */
async function uploadTestResultToGoogleSheet({ testInfo, assertionLog, status, errorMessage = '', suite = 'CIS Suite' }) {
  const { sendTestResultToGoogleSheetGSAppScript } = require('./google-sheet-gsappscript.helper');
  await sendTestResultToGoogleSheetGSAppScript({
    suite,
    caseName: testInfo.title,
    assertionLog,
    status,
    testTime: new Date().toLocaleString(),
    tester: process.env.TESTER || 'Auto',
    duration: testInfo.duration,
    errorMessage
  });
}

module.exports = { uploadTestResultToGoogleSheet };
