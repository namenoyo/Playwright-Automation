const https = require('https');

/**
 * ส่งผลลัพธ์ selector check ไปยัง Google Sheet (ระบุ sheetName, selectorResults)
 * @param {Object} options
 * @param {string} options.sheetName - ชื่อ tab/Sheet ที่จะอัปเดต เช่น 'selector_check'
 * @param {Array<{selectorId: string, testResult: string, logRemark: string}>} options.selectorResults
 * @returns {Promise<any>}
 */
async function sendSelectorCheckToGoogleSheetGSAppScript({ sheetName, selectorResults }) {
  const url = 'https://script.google.com/macros/s/AKfycbxv_9oJpiQsuzJRKUumIBplAwFMmTGy_srZpWBrJ6KdBj_0gOF3fShx86qHbDDMsPFcYw/exec';

  const payload = {
    sheetName,
    selectorResults
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`❌ Unexpected status code: ${res.statusCode}, body: ${body}`));
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ status: 'not-json', body });
        }
      });
    });

    req.on('error', err => {
      reject(new Error(`❌ Request error: ${err.message}`));
    });

    // ⏱ เพิ่ม timeout ป้องกันการค้าง
    req.setTimeout(10000, () => {
      req.destroy(new Error('⏰ Request timeout'));
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

module.exports = { sendSelectorCheckToGoogleSheetGSAppScript };
