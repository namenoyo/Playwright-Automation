// Google Sheets helper for Playwright test result reporting
// Requires: npm install googleapis

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const SHEET_ID = '1kqtNcJh9Co5eS2jlaaLzYjYFVLiS3OMIJanJTN4-6Tg';
const SHEET_NAME = 'TEST_SUITE';
const CREDENTIALS_PATH = path.resolve(__dirname, '../credentials/playwright-463202-b34b88b0bcf3.json'); // You must provide this file


async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes,
  });
  return await auth.getClient();
}

async function updateTestStatus(testName, status) {
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  // Read all test case names from column A (from row 4)
  const getRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A4:A`,
  });
  const rows = getRes.data.values || [];
  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].trim() === testName.trim()) {
      rowIndex = i + 4; // Because A4 is row 4
      break;
    }
  }
  if (rowIndex === -1) throw new Error(`Test case '${testName}' not found in column A`);

  // Update status in column J (dropdown: Passed/Failed)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!J${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[status]] },
  });
}

/**
 * ส่งข้อมูล test result ไป Google Sheet ผ่าน Google Apps Script Web App
 * @param {Array<Array<any>>} dataRows - ตัวอย่าง: [[suite, case, log, status, ...], ...]
 * @returns {Promise<any>}
 */
async function sendTestResultToGoogleSheet(dataRows) {
  const url = 'https://script.google.com/macros/s/AKfycbyMpeNDkZotK3ebaPHskfUR6VdWSrT2T2E8CFqFlp4BkYbZIM-pv5DqTB4EL6N-9wHHrg/exec';
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(dataRows),
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Google Sheet API error: ' + res.status);
  return await res.json();
}

module.exports = { updateTestStatus, sendTestResultToGoogleSheet };

const CREDENTIALS_PATH_TOPPY = path.resolve(__dirname, '../credentials/playwright-463202-01ab1136a2c6.json'); // You must provide this file
export class googleSheet {
  async googlesheet_auth() {
    // โหลด Credentials
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH_TOPPY, // ใช้ไฟล์ credentials ที่คุณมี
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth
  }

  async getSheetData(spreadsheetId, sheetName, columns) {
    const auth = await this.googlesheet_auth();
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    // ดึงข้อมูลทั้งแถว
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`, // ดึงทั้งแถว (หรือระบุ range)
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('ไม่พบข้อมูล');
      return [];
    }

    // หาหัวข้อ column
    const headers = rows[0];
    const colIndexes = columns.map(col => headers.indexOf(col));

    // คืนค่าเฉพาะคอลัมน์ที่ต้องการ
    return rows.slice(1).map(row => colIndexes.map(i => row[i] || ''));

  }

  async fetchDataFromAPIGoogleSheet(apiUrl) {
    // ใช้ fetch global ถ้ามี ไม่งั้น fallback ไป node-fetch
    const fetchFn = typeof fetch === 'function'
      ? fetch
      : (await import('node-fetch')).default;

    const response = await fetchFn(apiUrl);
    
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    return await response.json();
  }
}

module.exports = { googleSheet };
