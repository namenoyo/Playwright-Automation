/**
 * POC Digital Sale — Google Sheet Result Writer
 * Sheet config loaded from Projects/Digital Sale/gsheet-config.json
 * Headers (row 2): ลำดับ | รหัส TC | ... | Actual Result (J) | Pass/Fail (K) | หมายเหตุ (L)
 */

const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const credDir = path.resolve(__dirname, '../../credentials');
const secretFile = fs.readdirSync(credDir).find(f => f.startsWith('client_secret'));
const CREDENTIALS_PATH = path.join(credDir, secretFile);
const TOKEN_PATH = path.join(credDir, 'token.json');

const gsheetConfig = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../../Projects/Digital Sale/gsheet-config.json'), 'utf8'
));
const SPREADSHEET_ID = gsheetConfig.sheet_id;
const SHEET_NAME = gsheetConfig.sheet_name;

// คอลัมน์ (0-indexed จาก A) — 13-column layout: A|B|C|D|E|F|G|H|I|J|K|L|M
// A=ลำดับ B=รหัสTC C=ระบบ D=Scenario E=Priority F=ประเภท G=Pre-cond H=Steps I=TestData J=Expected K=Actual L=Pass/Fail M=หมายเหตุ
const COL_TC_ID       = 1;   // B — รหัส TC
const COL_ACTUAL      = 10;  // K — Actual Result
const COL_PASS_FAIL   = 11;  // L — Pass/Fail
const COL_REMARK      = 12;  // M — หมายเหตุ

let _auth = null;

function getAuth() {
  if (_auth) return _auth;
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));
  _auth = auth;
  return auth;
}

// แปลง column index → A1 notation (0=A, 9=J, 10=K ...)
function colLetter(idx) {
  let letter = '';
  let n = idx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/**
 * เขียนผล PASS/FAIL กลับ Google Sheet
 * @param {string} tcId   - เช่น "TC_DS_001"
 * @param {string} status - "Pass" | "Fail"
 * @param {string} actual - ข้อความ Actual Result (ต้องกรอกถ้า Pass)
 * @param {string} remark - หมายเหตุเพิ่มเติม (optional)
 */
async function writeSheetResult(tcId, status, actual = '', remark = '') {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });

  // ดึงข้อมูลทุก row เพื่อหา row ของ tcId
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:M`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(row => (row[COL_TC_ID] || '').trim() === tcId);
  if (rowIndex === -1) {
    console.warn(`⚠️ ไม่พบ ${tcId} ใน Google Sheet — ข้ามการ write`);
    return;
  }

  const sheetRow = rowIndex + 1; // Google Sheets เริ่มนับจาก 1
  const JCol = colLetter(COL_ACTUAL);
  const KCol = colLetter(COL_PASS_FAIL);
  const LCol = colLetter(COL_REMARK);

  const data = [
    { range: `'${SHEET_NAME}'!${JCol}${sheetRow}`, values: [[actual]] },
    { range: `'${SHEET_NAME}'!${KCol}${sheetRow}`, values: [[status]] },
  ];
  if (remark) {
    data.push({ range: `'${SHEET_NAME}'!${LCol}${sheetRow}`, values: [[remark]] });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: { valueInputOption: 'USER_ENTERED', data },
  });

  console.log(`📝 Sheet updated: ${tcId} → ${status} (row ${sheetRow})`);
}

module.exports = { writeSheetResult };
