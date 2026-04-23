import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.resolve(
  __dirname,
  '../../../credentials/client_secret_418688769943-2g4fl50qfor1jfnej5cno09r52s0ni62.apps.googleusercontent.com.json'
);

const TOKEN_PATH = path.resolve(
  __dirname,
  '../../../credentials/token.json'
);

const OUTPUT_PATH = path.resolve(__dirname, './newCase.data.js');

const SPREADSHEET_ID = '14IlzhsajB-dFsU1VyhqYJzIGehOL3V59GKV69tc7WZE';
const SHEET_NAME = 'NBHQ_newCase_data';
const RANGE = `${SHEET_NAME}!A:AR`;

function loadCredentials() {
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  return JSON.parse(content);
}

function createOAuth2Client(credentials) {
  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
}

function loadToken(oAuth2Client) {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`ไม่พบ token.json ที่ ${TOKEN_PATH}`);
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function initAuth() {
  const credentials = loadCredentials();
  const oAuth2Client = createOAuth2Client(credentials);
  return loadToken(oAuth2Client);
}

async function fetchSheetRows() {
  const auth = await initAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  return res.data.values || [];
}

function normalizeCell(value) {
  return String(value ?? '').trim();
}

function cleanAmount(value) {
  return String(value ?? '')
    .replace(/,/g, '')
    .replace(/\.00$/, '')
    .trim();
}

function rowToCaseData(row) {
  return {
    environment: normalizeCell(row[0]),
    agentCode: normalizeCell(row[1]),
    partner: normalizeCell(row[2]),
    partnerNo: normalizeCell(row[3]),
    cusTitlePrefix: normalizeCell(row[4]),
    gender: normalizeCell(row[5]),
    cusName: normalizeCell(row[6]),
    cusSurname: normalizeCell(row[7]),
    cardNo: normalizeCell(row[8]),
    applicationNo: normalizeCell(row[9]),
    tempReceiptNo: normalizeCell(row[10]),
    age: normalizeCell(row[11]),
    occClass: normalizeCell(row[12]),
    occupation: normalizeCell(row[13]),
    occupationCode: normalizeCell(row[14]),
    policyName: normalizeCell(row[15]),
    paymentPeriod: normalizeCell(row[16]),
    insuredAmount: cleanAmount(row[17]),
    numRider: normalizeCell(row[18]),
    name: normalizeCell(row[27]),
    coverage: normalizeCell(row[28]),
    numBene: normalizeCell(row[29]),
    Valid: normalizeCell(row[40]),
    paperOrElectronic: normalizeCell(row[41]),
    email: '',
    riders: [],
    bene: [
      {
        beneRela: normalizeCell(row[30]),
        benePrefix: normalizeCell(row[31]),
        beneName: normalizeCell(row[32]),
        beneSurname: normalizeCell(row[33]),
        beneAge: normalizeCell(row[34]),
      }
    ],
  };
}

async function loadCaseDatas() {
  const rows = await fetchSheetRows();

  if (!rows.length) {
    console.warn('ไม่พบข้อมูลใน Google Sheet');
    return [];
  }

  const header = rows[0];
  const dataRows = rows.slice(1);

  const testStatusIndex = header.findIndex(
    (col) => normalizeCell(col).toLowerCase() === 'test status'
  );

  if (testStatusIndex === -1) {
    throw new Error('ไม่พบ column ชื่อ "Test Status"');
  }

 const readyRows = dataRows.filter((row) => {
  const status = normalizeCell(row[testStatusIndex]).toLowerCase();

  return (
    status === 'ready for test' ||
    status === 'ready for retest'
  );
});

for (const row of readyRows) {
  const applicationNo = normalizeCell(row[9]);
  if (!applicationNo) {
    throw new Error('พบแถว Ready for Test ที่ไม่มี applicationNo');
  }
}

  console.log(`พบ Ready for Test  / Ready for Retest ทั้งหมด ${readyRows.length} แถว`);

  return readyRows.map(rowToCaseData);
}

async function main() {
  const caseDatas = await loadCaseDatas();

  const fileContent =
    `export const caseDatas = ${JSON.stringify(caseDatas, null, 2)};\n`;

  fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf8');

  console.log(`เขียนไฟล์สำเร็จ: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

