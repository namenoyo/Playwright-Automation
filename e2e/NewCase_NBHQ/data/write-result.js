const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CREDENTIALS_PATH = path.resolve(
  __dirname,
  '../../../credentials/client_secret_418688769943-2g4fl50qfor1jfnej5cno09r52s0ni62.apps.googleusercontent.com.json'
);

const TOKEN_PATH = path.resolve(__dirname, '../../../credentials/token.json');

const SPREADSHEET_ID = '1lmIoKDqXzw922U3F6FIYWdBxchsPbQNW4hQ_Vh812pM';
const SHEET_NAME = 'Prepare_Test_Data_NBHQ';
const DATA_RANGE = `${SHEET_NAME}!A:EF`;
const HEADER_ROW = 4;


const RUN_CREATE_BY = '';

let sheetsClient = null;
let sheetCache = null;
let noRowMap = null;

function normalize(v) {
  return String(v ?? '').trim();
}

function loadCredentials() {
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
}

function createOAuth2Client(credentials) {
  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web;

  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function loadToken(oAuth2Client) {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

// ถ้าในคอลัมน์ "ประเภทเพศ" มีการระบุไว้ จะใช้ค่านั้นเป็นหลัก แต่ถ้าไม่ระบุ จะใช้ค่าจากคอลัมน์ "เพศ" แทน
function resolveGender(genderType, gender) {
  const gt = normalize(genderType);
  const g = normalize(gender);

  if (!gt || gt.includes('กรุณาระบุ')) {
    return g;
  }

  return gt;
}

async function initAuth() {
  const credentials = loadCredentials();
  const oAuth2Client = createOAuth2Client(credentials);
  return loadToken(oAuth2Client);
}

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const auth = await initAuth();
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function columnToLetter(colNum) {
  let letter = '';
  while (colNum > 0) {
    const mod = (colNum - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colNum = Math.floor((colNum - mod) / 26);
  }
  return letter;
}

async function loadSheet(forceRefresh = false) {
  if (sheetCache && !forceRefresh) return sheetCache;

  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: DATA_RANGE,
  });

  const rows = res.data.values || [];
  const headers = rows[HEADER_ROW - 1] || [];

  const headerMap = new Map();
  headers.forEach((h, idx) => {
    const key = normalize(h);
    if (key) headerMap.set(key, idx);
  });

  sheetCache = {
    rows,
    dataRows: rows.slice(HEADER_ROW),
    headers,
    headerMap,
  };

  return sheetCache;
}

function getColIndex(headerMap, columnName, required = true) {
  const idx = headerMap.get(columnName);

  if (idx === undefined && required) {
    throw new Error(`ไม่พบ Column ในชีต: ${columnName}`);
  }

  return idx;
}

function getValue(row, headerMap, columnName, fallback = '') {
  const idx = getColIndex(headerMap, columnName, false);
  if (idx === undefined) return fallback;
  return normalize(row[idx]);
}

function getRawValue(row, headerMap, columnName, fallback = '') {
  const idx = getColIndex(headerMap, columnName, false);
  if (idx === undefined) return fallback;
  return row[idx] ?? fallback;
}

function isRunnableRow(row, headerMap, createByFilter = RUN_CREATE_BY) {
  const no = getValue(row, headerMap, 'No');
  const valid = getValue(row, headerMap, 'Valid').toUpperCase();
  const createBy = getValue(row, headerMap, 'Create By');
  const status = getValue(row, headerMap, 'Test Status').toLowerCase();

  return (
    no !== '' &&
    valid === 'TRUE' &&
    createBy === createByFilter &&
     (
      status === 'ready for test' ||
      status === 'ready for retest'
    )
  );
}

function splitPipeline(value) {
  return String(value ?? '')
    .split('|')
    .map((v) => normalize(v));
}

function buildRiders(row, headerMap) {
  const riderCodes = splitPipeline(getRawValue(row, headerMap, 'รหัส Rider'));
  const riderNames = splitPipeline(getRawValue(row, headerMap, 'ชื่อ Rider'));
  const riderCoverages = splitPipeline(getRawValue(row, headerMap, 'ทุน Rider'));
  const riderPremiums = splitPipeline(getRawValue(row, headerMap, 'เบี้ย Rider'));

  const firstRiderCoverage = riderCoverages.find(
    (v) => normalize(v) && normalize(v) !== '-' && normalize(v).toLowerCase() !== 'any'
  ) || '';

  const maxLen = Math.max(
    riderCodes.length,
    riderNames.length,
    riderCoverages.length,
    riderPremiums.length
  );

  const riders = [];

  for (let i = 0; i < maxLen; i++) {
    const riderCode = riderCodes[i] || '';
    const riderName = riderNames[i] || '';
    let riderCoverage = riderCoverages[i] || '';
    const riderPremium = riderPremiums[i] || '';

    if (normalize(riderCoverage).toLowerCase() === 'any') {
      riderCoverage = firstRiderCoverage;
    }

    if (!riderCode && !riderName && !riderCoverage && !riderPremium) continue;

    riders.push({
      riderCode,
      riderName,
      riderCoverage:
  riderCoverage === '-'
    ? ''
    : normalize(riderCoverage).toLowerCase() === 'any'
    ? 'Any'
    : riderCoverage,
      riderPremium: riderPremium === '-' ? '' : riderPremium,
    });
  }

  return riders;
}

function getA1Cell(rowNumber, headerMap, columnName) {
  const idx = getColIndex(headerMap, columnName, true);
  return `${SHEET_NAME}!${columnToLetter(idx + 1)}${rowNumber}`;
}

async function buildNoRowMap(forceRefresh = false) {
  if (noRowMap && !forceRefresh) return noRowMap;

  const { dataRows, headerMap } = await loadSheet(forceRefresh);
  const map = new Map();

  dataRows.forEach((row, index) => {
    const no = getValue(row, headerMap, 'No');
    if (!no) return;

    if (map.has(no)) {
      throw new Error(`พบ No ซ้ำในชีต: ${no}`);
    }

    map.set(no, index + HEADER_ROW + 1);
  });

  noRowMap = map;
  return noRowMap;
}

async function getRowNumberByNo(no) {
  const map = await buildNoRowMap();
  const rowNumber = map.get(normalize(no));

  if (!rowNumber) {
    throw new Error(`หา No ไม่เจอ: ${no}`);
  }

  return rowNumber;
}

async function claimCase(no, createByFilter) {
  const sheets = await getSheetsClient();

  const { dataRows, headerMap } = await loadSheet(true);
  const rowNumber = await getRowNumberByNo(no);

  const row = dataRows[rowNumber - HEADER_ROW - 1];

 if (!isRunnableRow(row, headerMap, createByFilter)) {
    console.log(`⏭️ Skip No ${no} เพราะไม่ผ่านเงื่อนไข No/Valid/Create By/Test Status`);
    return false;
  }

  const statusCell = getA1Cell(rowNumber, headerMap, 'Test Status');

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: statusCell,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['Inprogress']],
    },
  });

  const applicationNo = getValue(row, headerMap, 'เลขใบคำขอ');
  console.log(`🏃‍➡️ กำลังเริ่มดำเนินการ No ${no} / ใบคำขอ ${applicationNo}`);
  return true;
}

async function writeResult({
  no,
  applicationNo,
  status,
  remark,
  depositReceiptNo = '',
  policyNo = '',
  receiptNo = '',
  submitNo = '',
}) {
  const sheets = await getSheetsClient();
  const { headerMap } = await loadSheet();
  const rowNumber = await getRowNumberByNo(no);

  const nextTestStatus =
    status === 'PASS'
      ? 'Done'
      : 'Ready for Retest';

  const testDate = `'${new Date().toLocaleString('sv-SE', {
  timeZone: 'Asia/Bangkok',
  hour12: false
}).replace('T', ' ')}`;

  const data = [
    {
      range: getA1Cell(rowNumber, headerMap, 'Test Status'),
      values: [[nextTestStatus]],
    },
    {
      range: getA1Cell(rowNumber, headerMap, 'Result'),
      values: [[status]],
    },
    {
      range: getA1Cell(rowNumber, headerMap, 'Remark'),
      values: [[remark]],
    },
    {
      range: getA1Cell(rowNumber, headerMap, 'Test Date'),
      values: [[testDate]],
    },
    {
      range: getA1Cell(rowNumber, headerMap, 'เลขรับฝาก'),
      values: [[depositReceiptNo]],
    },
  ];

  if (policyNo) {
    data.push({
      range: getA1Cell(rowNumber, headerMap, 'เลขกรมธรรม์'),
      values: [[policyNo]],
    });
  }

  if (receiptNo) {
    data.push({
      range: getA1Cell(rowNumber, headerMap, 'เลขใบเสร็จ'),
      values: [[receiptNo]],
    });
  }

  if (submitNo) {
    data.push({
      range: getA1Cell(rowNumber, headerMap, 'เลขใบนำส่ง'),
      values: [[submitNo]],
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });

  console.log(`✅ Updated row ${rowNumber} / No ${no} (${applicationNo || '-'}) => ${status}`);
}

async function writeResultsBatch(items) {
  const sheets = await getSheetsClient();
  const { headerMap } = await loadSheet();

  const data = [];

  for (const item of items) {
    const rowNumber = await getRowNumberByNo(item.no);

    const nextTestStatus =
      item.status === 'PASS'
        ? 'Done'
        : 'Ready for Retest';

    const now = new Date();

const testDate = `'${new Date().toLocaleString('sv-SE', {
  timeZone: 'Asia/Bangkok',
  hour12: false
}).replace('T', ' ')}`;

    data.push(
      {
        range: getA1Cell(rowNumber, headerMap, 'Test Status'),
        values: [[nextTestStatus]],
      },
      {
        range: getA1Cell(rowNumber, headerMap, 'Result'),
        values: [[item.status]],
      },
      {
        range: getA1Cell(rowNumber, headerMap, 'Remark'),
        values: [[item.remark]],
      },
      {
        range: getA1Cell(rowNumber, headerMap, 'Test Date'),
        values: [[testDate]],
      },
      {
        range: getA1Cell(rowNumber, headerMap, 'เลขรับฝาก'),
        values: [[item.depositReceiptNo || '']],
      }
    );

    if (item.policyNo) {
      data.push({
        range: getA1Cell(rowNumber, headerMap, 'เลขกรมธรรม์'),
        values: [[item.policyNo]],
      });
    }

    if (item.receiptNo) {
      data.push({
        range: getA1Cell(rowNumber, headerMap, 'เลขใบเสร็จ'),
        values: [[item.receiptNo]],
      });
    }

    if (item.submitNo) {
      data.push({
        range: getA1Cell(rowNumber, headerMap, 'เลขใบนำส่ง'),
        values: [[item.submitNo]],
      });
    }
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });

  console.log(`✅ Batch updated ${items.length} rows`);
}



async function writeTempReceiptNo(no, tempReceiptNo) {
  const sheets = await getSheetsClient();
  const { headerMap } = await loadSheet();
  const rowNumber = await getRowNumberByNo(no);

  const value = normalize(tempReceiptNo);

  if (!value) {
    throw new Error(`❌ writeTempReceiptNo: tempReceiptNo ว่าง no=${no}`);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: getA1Cell(rowNumber, headerMap, 'เลขใบรับเงินชั่วคราว'),
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });

  console.log(`✅ Updated เลขใบรับเงินชั่วคราว row ${rowNumber} / No ${no} => ${value}`);

  sheetCache = null;
}



async function fetchRunnableCases(createByFilter) {
  if (!createByFilter) {
    throw new Error('❌ ต้องส่งค่า RUN_CREATE_BY เข้ามาใน fetchRunnableCases(createByFilter)');
  }
  const { dataRows, headerMap } = await loadSheet(true);

  return dataRows
    .filter((row) => isRunnableRow(row, headerMap, createByFilter))
    .map((row) => {
      const numBene = parseInt(
        getValue(row, headerMap, 'จำนวนผู้รับผลประโยชน์'),
        10
      ) || 0;

      return {
        no: getValue(row, headerMap, 'No'),
        environment: getValue(row, headerMap, 'Env'),
        caseType: getValue(row, headerMap, 'ลักษณะเคส'),
        applicationNo: getValue(row, headerMap, 'เลขใบคำขอ'),
        tempReceiptNo: getValue(row, headerMap, 'เลขใบรับเงินชั่วคราว'),
        
        //-------- Section: สาขาตัวแทน --------
        branch: getValue(row, headerMap, 'สาขา'),
        branchName: getValue(row, headerMap, 'ชื่อสาขา'),

        agentCode: getValue(row, headerMap, 'รหัสตัวแทน'),
        agentName: getValue(row, headerMap, 'ชื่อตัวแทน'),

        partner: getValue(row, headerMap, 'Partner'),
        partnerNo: getValue(row, headerMap, 'Partner Code'),

        //-------- Section: ข้อมูลลูกค้าผู้เอาประกัน --------
        cardType: getValue(row, headerMap, 'ประเภทบัตร'),
        cardNo: getValue(row, headerMap, 'เลขบัตร'),
        expirecardNo: getValue(row, headerMap, 'วันที่บัตรหมดอายุ'),
        nationality: getValue(row, headerMap, 'สัญชาติ'),
        documentidentify: getValue(row, headerMap, 'เอกสารที่ใช้แสดง'),
        
        cusType: getValue(row, headerMap, 'ลูกค้า'), //ประเภทลูกค้า เก่า / ใหม่
        cusTitlePrefix: getValue(row, headerMap, 'คำนำหน้าลูกค้า'),

        genderType: getValue(row, headerMap, 'ประเภทเพศ'),

        gender: resolveGender(
          getValue(row, headerMap, 'ประเภทเพศ'),
          getValue(row, headerMap, 'เพศ')
        ),
        
        cusName: getValue(row, headerMap, 'ชื่อลูกค้า'),
        cusSurname: getValue(row, headerMap, 'นามสกุลลูกค้า'),
        birthDate: getValue(row, headerMap, 'วันเดือนปีเกิด'),
        age: getValue(row, headerMap, 'อายุ (ปี)'),
        maritalStatus: getValue(row, headerMap, 'สถานภาพ'),

        spousePrefix: getValue(row, headerMap, 'คำนำหน้าคู่สมรส'),
        spouseName: getValue(row, headerMap, 'ชื่อคู่สมรส'),
        spouseSurname: getValue(row, headerMap, 'นามสกุลคู่สมรส'),

        //-------- Section: ที่อยู่ตามทะเบียนบ้าน ของผู้เอาประกัน --------
        registerHouseNo: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-เลขที่'),
        registerMoo: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่'),
        registerVillage: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร'),
        registerSoi: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย'),
        registerRoad: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-ถนน'),
        registerProvince: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด'),
        registerDistrict: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต'),
        registerSubDistrict: getValue(row, headerMap, 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง'),

        // -------- Section: ที่อยู่ปัจจุบัน ของผู้เอาประกัน --------
        currentUseAddressType: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่'),
        currentHouseNo: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-เลขที่'),
        currentMoo: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-หมู่ที่'),
        currentVillage: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร'),
        currentSoi: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-ตรอก/ซอย'),
        currentRoad: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-ถนน'),
        currentProvince: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-จังหวัด'),
        currentDistrict: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-อำเภอ/เขต'),
        currentSubDistrict: getValue(row, headerMap, 'ที่อยู่ปัจจุบัน-ตำบล/แขวง'),

        // -------- Section: สถานที่ทำงาน ของผู้เอาประกัน --------
        workUseAddressType: getValue(row, headerMap, 'สถานที่ทำงาน-ใช้ตามที่อยู่'),
        workPlaceName: getValue(row, headerMap, 'สถานที่ทำงาน-ชื่อสถานที่ทำงาน'),
        workHouseNo: getValue(row, headerMap, 'สถานที่ทำงาน-เลขที่'),
        workMoo: getValue(row, headerMap, 'สถานที่ทำงาน-หมู่ที่'),
        workVillage: getValue(row, headerMap, 'สถานที่ทำงาน-หมู่บ้าน/อาคาร'),
        workSoi: getValue(row, headerMap, 'สถานที่ทำงาน-ตรอก/ซอย'),
        workRoad: getValue(row, headerMap, 'สถานที่ทำงาน-ถนน'),
        workProvince: getValue(row, headerMap, 'สถานที่ทำงาน-จังหวัด'),
        workDistrict: getValue(row, headerMap, 'สถานที่ทำงาน-อำเภอ/เขต'),
        workSubDistrict: getValue(row, headerMap, 'สถานที่ทำงาน-ตำบล/แขวง'),

        // -------- Section: ข้อมูลติดต่อ --------
        contactPlaceType: getValue(row, headerMap, 'สถานที่สะดวกในการติดต่อและส่งเอกสาร'),
        mobilePhone: getValue(row, headerMap, 'โทรศัพท์มือถือ'),
        homePhone: getValue(row, headerMap, 'โทรศัพท์บ้าน'),
        workPhone: getValue(row, headerMap, 'โทรศัพท์ที่ทำงาน'),
        workPhoneExt: getValue(row, headerMap, 'ต่อ'),
        email: getValue(row, headerMap, 'อีเมล'),
        paperOrElectronic: getValue(row, headerMap, 'ช่องทางรับเอกสาร'),
        policyDeliveryLocation: getValue(row, headerMap, 'ส่งเอกสารกรมธรรม์ที่'),

        // -------- Section: อาชีพ --------
        occupation: getValue(row, headerMap, 'อาชีพ'),
        occupationCode: getValue(row, headerMap, 'รหัสอาชีพ'),
        occClass: getValue(row, headerMap, 'ขั้นอาชีพ'),
        occupationPosition: getValue(row, headerMap, 'ตำแหน่ง'),
        jobDescription: getValue(row, headerMap, 'ลักษณะงานที่ทำ'),
        businessType: getValue(row, headerMap, 'ลักษณะธุรกิจ'),
        annualIncome: getValue(row, headerMap, 'รายได้ต่อปี'),
        useMotorcycle: getValue(row, headerMap, 'ท่านใช้รถจักรยานยนต์หรือไม่'),

        // -------- Section: แบบประกัน --------
        policyType: getValue(row, headerMap, 'ประเภทแบบประกัน'),
        policyCode: getValue(row, headerMap, 'รหัสแบบประกัน'),
        policyName: getValue(row, headerMap, 'ชื่อแบบประกัน'),
        packageType: getValue(row, headerMap, 'ประเภท Package'),
        applicationFormCode: getValue(row, headerMap, 'รหัสฟอร์มใบคำขอ'),
        paymentPeriod: getValue(row, headerMap, 'โหมดชำระ'),

        insuredAmount: String(getRawValue(row, headerMap, 'ทุน'))
          .replace(/,/g, '')
          .replace(/\.00$/, '')
          .trim(),

        premium: String(getRawValue(row, headerMap, 'เบี้ย/ทุนชดเชย'))
          .replace(/,/g, '')
          .replace(/\.00$/, '')
          .trim(),

        // -------- Section: Rider --------  
        numRider: getValue(row, headerMap, 'จำนวน Rider'),
        riders: buildRiders(row, headerMap),

        // -------- Section: รายละเอียดผู้ชำระเบี้ย --------
        payerType: getValue(row, headerMap, 'การชำระเบี้ยประกันภัย'),      
        payerPrefix: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-คำนำหน้า'),
        payerName: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-ชื่อ'),
        payerSurname: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-นามสกุล'),
        payerAge: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-อายุ'),
        payerUseAddressType: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-ใช้ตามที่อยู่'),
        payerHouseNo: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-เลขที่'),
        payerMoo: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-หมู่ที่'),
        payerVillage: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-หมู่บ้าน/อาคาร'),
        payerSoi: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-ตรอก/ซอย'),
        payerRoad: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-ถนน'),
        payerProvince: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-จังหวัด'),
        payerDistrict: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-อำเภอ/เขต'),
        payerSubDistrict: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-ตำบล/แขวง'),
        payerMobile: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-โทรศัพท์มือถือ'),
        payerRelation: getValue(row, headerMap, 'ความสัมพันธ์กับผู้ขอเอาประกัน'),
        payerDocument: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง'),
        payerCardNo: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-เลขที่บัตร'),
        payerOccupation: getValue(row, headerMap, 'ผู้ชำระเบี้ยประกันภัย-อาชีพ'),


        // -------- Section: วิธีชำระ --------
        paymentMethod: getValue(row, headerMap, 'วิธีชำระ'),

        // -------- Section: BMI ส่วนสูง น้ำหนัก --------
        height: getValue(row, headerMap, 'ส่วนสูง'),
        weight: getValue(row, headerMap, 'น้ำหนัก'),
        birthWeight: getValue(row, headerMap, 'น้ำหนักแรกเกิด'),
        weightChange6Months: getValue(row, headerMap, 'น้ำหนักเปลี่ยนแปลงในรอบ 6 เดือน'),

        // -------- Section: BMI ส่วนสูง น้ำหนัก --------
        Valid: getValue(row, headerMap, 'Valid'),
        
       
        // -------- Section: Info Result --------
        createBy: getValue(row, headerMap, 'Create By'),
        uwApprove: getValue(row, headerMap, 'UW Approve'),

        // -------- Section: ผู้รับประโยชน์ --------
        numBene,

        bene: [
          {
            beneRela: getValue(row, headerMap, 'ความสัมพันธ์ผรป_1'),
            benePrefix: getValue(row, headerMap, 'คำนำหน้าผรป_1'),
            beneName: getValue(row, headerMap, 'ชื่อผรป_1'),
            beneSurname: getValue(row, headerMap, 'นามสกุลผรป_1'),
            beneAge: getValue(row, headerMap, 'อายุผรป_1'),
          },
          {
            beneRela: getValue(row, headerMap, 'ความสัมพันธ์ผรป_2'),
            benePrefix: getValue(row, headerMap, 'คำนำหน้าผรป_2'),
            beneName: getValue(row, headerMap, 'ชื่อผรป_2'),
            beneSurname: getValue(row, headerMap, 'นามสกุลผรป_2'),
            beneAge: getValue(row, headerMap, 'อายุผรป_2'),
          },
          {
            beneRela: getValue(row, headerMap, 'ความสัมพันธ์ผรป_3'),
            benePrefix: getValue(row, headerMap, 'คำนำหน้าผรป_3'),
            beneName: getValue(row, headerMap, 'ชื่อผรป_3'),
            beneSurname: getValue(row, headerMap, 'นามสกุลผรป_3'),
            beneAge: getValue(row, headerMap, 'อายุผรป_3'),
          },
        ]
          .filter(
            (b) =>
              b.beneRela ||
              b.benePrefix ||
              b.beneName ||
              b.beneSurname ||
              b.beneAge
          )
          .slice(0, numBene),
      };
    });
}

module.exports = {
  claimCase,
  writeResult,
  writeResultsBatch,
  fetchRunnableCases,
  writeTempReceiptNo,
};