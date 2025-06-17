const https = require('https');

/**
 * ส่งข้อมูล test result ไป Google Sheet ผ่าน Google Apps Script Web App (Node.js native)
 * @param {Object} options
 * @param {string} options.suite - ชื่อ Test Suite
 * @param {string} options.caseName - ชื่อ Test Case
 * @param {string} [options.assertionLog] - Assertion Log (optional)
 * @param {string} options.status - Status (Passed/Failed)
 * @param {string} [options.testTime] - Test Time (optional, default: now)
 * @param {string} [options.tester] - Tester (optional)
 * @param {number} [options.duration] - Duration (ms, optional)
 * @param {string} [options.errorMessage] - Error Message (optional)
 * @returns {Promise<any>}
 */
async function sendTestResultToGoogleSheetGSAppScript({
  suite,
  caseName,
  assertionLog = '',
  status,
  testTime = new Date().toLocaleString(),
  tester = 'Auto',
  duration = '',
  errorMessage = ''
}) {
  const url = 'https://script.google.com/macros/s/AKfycbyMpeNDkZotK3ebaPHskfUR6VdWSrT2T2E8CFqFlp4BkYbZIM-pv5DqTB4EL6N-9wHHrg/exec';
  const data = [[
    suite,
    caseName,
    assertionLog,
    status,
    testTime,
    tester,
    duration,
    errorMessage
  ]];
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          // ถ้า response ไม่ใช่ JSON (เช่น HTML) ให้ resolve เฉยๆ ไม่ throw error
          resolve({ status: 'not-json', body });
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

module.exports = { sendTestResultToGoogleSheetGSAppScript };
