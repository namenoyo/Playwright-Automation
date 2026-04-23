const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CREDENTIALS_PATH = path.resolve(
  __dirname,
  '../../../credentials/client_secret_418688769943-2g4fl50qfor1jfnej5cno09r52s0ni62.apps.googleusercontent.com.json'
);

const TOKEN_PATH = path.resolve(
  __dirname,
  '../../../credentials/token.json'
);

const SPREADSHEET_ID = '14IlzhsajB-dFsU1VyhqYJzIGehOL3V59GKV69tc7WZE';
const SHEET_NAME = 'NBHQ_newCase_data';
const DATA_RANGE = `${SHEET_NAME}!A:BA`;

let sheetsClient = null;
let appNoRowMap = null;

function loadCredentials() {
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
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
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function initAuth() {
  const credentials = loadCredentials();
  const oAuth2Client = createOAuth2Client(credentials);
  return loadToken(oAuth2Client);
}

function normalize(v) {
  return String(v || '').trim();
}

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const auth = await initAuth();
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function buildAppNoRowMap(forceRefresh = false) {
  if (appNoRowMap && !forceRefresh) return appNoRowMap;

  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: DATA_RANGE,
  });

  const rows = res.data.values || [];
  const dataRows = rows.slice(1);

  const map = new Map();

  dataRows.forEach((row, index) => {
    const applicationNo = normalize(row[9]);
    if (!applicationNo) return;

    if (map.has(applicationNo)) {
      throw new Error(`พบ applicationNo ซ้ำในชีต: ${applicationNo}`);
    }

    map.set(applicationNo, index + 2);
  });

  appNoRowMap = map;
  return appNoRowMap;
}

async function getRowNumber(applicationNo) {
  const map = await buildAppNoRowMap();
  const rowNumber = map.get(normalize(applicationNo));

  if (!rowNumber) {
    throw new Error(`หา applicationNo ไม่เจอ: ${applicationNo}`);
  }

  return rowNumber;
}

async function claimCase(applicationNo) {
  const sheets = await getSheetsClient();
  const rowNumber = await getRowNumber(applicationNo);

  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!AW${rowNumber}`,
  });


  const currentStatus = normalize(readRes.data.values?.[0]?.[0]).toLowerCase();

 if (
    currentStatus !== 'ready for test' &&
    currentStatus !== 'ready for retest'
  ) {
    console.log(`⏭️ Skip ${applicationNo} เพราะสถานะปัจจุบันคือ ${currentStatus || '(ว่าง)'}`);
    return false;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!AW${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['Inprogress']]
    }
  });

  console.log(`🏃‍➡️ กำลังเริ่มดำเนินการใบคำขอ ${applicationNo}`);
  return true;
}

async function writeResult({ applicationNo, status, remark, depositReceiptNo = '' }) {
  const sheets = await getSheetsClient();
  const rowNumber = await getRowNumber(applicationNo);

 const isDuplicateAppNo =
  String(remark || '').includes('เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว');

const nextTestStatus =
  status === 'PASS'
    ? 'Done'
    : isDuplicateAppNo
      ? 'Fail'
      : 'Ready for Retest';

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!AW${rowNumber}:BA${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
  nextTestStatus,
  status,
  remark,
  new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
  depositReceiptNo
]]
    }
  });

  console.log(`✅ Updated row ${rowNumber} (${applicationNo}) => ${status}`);
}

async function writeResultsBatch(items) {
  const sheets = await getSheetsClient();

  const data = [];
  for (const item of items) {
    const rowNumber = await getRowNumber(item.applicationNo);

    data.push({
      range: `${SHEET_NAME}!AW${rowNumber}:BA${rowNumber}`,
      values: [[
        item.status === 'PASS' ? 'Done' : 'Ready for Retest',
        item.status,
        item.remark,
        new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        item.depositReceiptNo || ''
      ]]
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data
    }
  });

  console.log(`✅ Batch updated ${items.length} rows`);
}

async function fetchRunnableCases() {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:BA`,
  });

  const rows = res.data.values || [];
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => {
      const status = normalize(row[48]).toLowerCase(); // AW

      return (
        status === 'ready for test' ||
        status === 'ready for retest'
      );
    })
    .map((row) => ({
      environment: normalize(row[0]),
      agentCode: normalize(row[1]),
      partner: normalize(row[2]),
      partnerNo: normalize(row[3]),
      cusTitlePrefix: normalize(row[4]),
      gender: normalize(row[5]),
      cusName: normalize(row[6]),
      cusSurname: normalize(row[7]),
      cardNo: normalize(row[8]),
      applicationNo: normalize(row[9]),
      tempReceiptNo: normalize(row[10]),
      age: normalize(row[11]),
      occClass: normalize(row[12]),
      occupation: normalize(row[13]),
      occupationCode: normalize(row[14]),
      policyName: normalize(row[15]),
      paymentPeriod: normalize(row[16]),
      insuredAmount: String(row[17] ?? '')
        .replace(/,/g, '')
        .replace(/\.00$/, '')
        .trim(),
      numRider: normalize(row[18]),
      name: normalize(row[27]),
      coverage: normalize(row[28]),
      numBene: normalize(row[29]),
      Valid: normalize(row[45]),
      paperOrElectronic: normalize(row[46]),
      email: normalize(row[47]),
      riders: [],
      // bene: [
      //   {
      //     beneRela: normalize(row[30]),
      //     benePrefix: normalize(row[31]),
      //     beneName: normalize(row[32]),
      //     beneSurname: normalize(row[33]),
      //     beneAge: normalize(row[34]),
      //   },
      // ],
     bene: [
  {
    beneRela: normalize(row[30]),
    benePrefix: normalize(row[31]),
    beneName: normalize(row[32]),
    beneSurname: normalize(row[33]),
    beneAge: normalize(row[34]),
  },
  {
    beneRela: normalize(row[35]),
    benePrefix: normalize(row[36]),
    beneName: normalize(row[37]),
    beneSurname: normalize(row[38]),
    beneAge: normalize(row[39]),
  },
   {
    beneRela: normalize(row[40]),
    benePrefix: normalize(row[41]),
    beneName: normalize(row[42]),
    beneSurname: normalize(row[43]),
    beneAge: normalize(row[44]),
  },
]
  .filter(b =>
    b.beneRela || b.benePrefix || b.beneName || b.beneSurname || b.beneAge
  )
  .slice(0, parseInt(normalize(row[29]), 10) || 0),
    }));
}

module.exports = {
  claimCase,
  writeResult,
  writeResultsBatch,
  fetchRunnableCases,
};