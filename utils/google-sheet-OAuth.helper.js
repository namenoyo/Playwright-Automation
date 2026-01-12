const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { google } = require('googleapis');

class GoogleSheet {
  constructor() {
    this.SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    this.TOKEN_PATH = path.resolve(__dirname, '../credentials/token.json');
    this.CREDENTIALS_PATH = path.resolve(__dirname, '../credentials/client_secret_418688769943-2g4fl50qfor1jfnej5cno09r52s0ni62.apps.googleusercontent.com.json');
    // this.CREDENTIALS_PATH = path.resolve(__dirname, '../credentials/client_secret_484402800987-2hlrd7m1rbh4lbrq1bupbjr898b4mrn1.apps.googleusercontent.com.json');
  }

  // โหลดไฟล์ credentials.json
  loadCredentials() {
    const content = fs.readFileSync(this.CREDENTIALS_PATH, 'utf8');
    return JSON.parse(content);
  }

  // สร้าง OAuth2 Client
  createOAuth2Client(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  }

  // ขอ Token ใหม่แบบ Interactive
  async getNewTokenInteractive(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });
    console.log('Authorize this app by visiting this URL:\n', authUrl);

    try {
      exec(`start "" "${authUrl}"`);
    } catch (err) {
      console.warn('ไม่สามารถเปิด browser อัตโนมัติได้ กรุณา copy URL ไปเปิดเอง.');
    }

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return reject(err);
          oAuth2Client.setCredentials(token);
          fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(token, null, 2));
          console.log('Token stored to', this.TOKEN_PATH);
          resolve(oAuth2Client);
        });
      });
    });
  }

  // โหลด Token ถ้ามีอยู่แล้ว
  loadToken(oAuth2Client) {
    if (fs.existsSync(this.TOKEN_PATH)) {
      const token = fs.readFileSync(this.TOKEN_PATH, 'utf8');
      oAuth2Client.setCredentials(JSON.parse(token));
      return Promise.resolve(oAuth2Client);
    }
    return Promise.resolve(null);
  }

  // สร้าง Auth Client
  async initAuth() {
    const credentials = this.loadCredentials();
    const oAuth2Client = this.createOAuth2Client(credentials);
    let authClient = await this.loadToken(oAuth2Client);
    if (!authClient) {
      authClient = await this.getNewTokenInteractive(oAuth2Client);
    }
    return authClient;
  }

  // // อ่านข้อมูลจาก Google Sheet โดยรับ spreadsheetId และ range
  // async fetchSheetData(auth, spreadsheetId, range) {
  //   const sheets = google.sheets({ version: 'v4', auth });
  //   const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  //   return res.data.values || [];
  // }

  async fetchSheetData(auth, spreadsheetId, range) {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const values = res.data.values || [];

    // หาจำนวน column ตาม range ที่กำหนด (เช่น A1:D10 → columns = 4)
    const columnCount = range.match(/([A-Z]+):([A-Z]+)/);
    let maxCols = 0;
    if (columnCount) {
      const colStart = columnCount[1];
      const colEnd = columnCount[2];
      const colToNumber = col => {
        let num = 0;
        for (let i = 0; i < col.length; i++) {
          num *= 26;
          num += col.charCodeAt(i) - 64; // 'A' = 65
        }
        return num;
      };
      maxCols = colToNumber(colEnd) - colToNumber(colStart) + 1;
    }

    // เติมช่องว่างถ้าข้อมูลไม่ครบ column
    const normalized = values.map(row => {
      while (row.length < maxCols) {
        row.push('');
      }
      return row;
    });

    return normalized;
  }

  async fetchSheetData_key(auth, spreadsheetId, range, fields = null) {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const values = res.data.values || [];
    if (values.length === 0) return [];

    // Extract header
    const header = values[0];

    // หาจำนวน column จาก range (เช่น A1:D10)
    const columnCount = range.match(/([A-Z]+):([A-Z]+)/);
    let maxCols = 0;
    if (columnCount) {
      const colStart = columnCount[1];
      const colEnd = columnCount[2];
      const colToNumber = col => {
        let num = 0;
        for (let i = 0; i < col.length; i++) {
          num *= 26;
          num += col.charCodeAt(i) - 64;
        }
        return num;
      };
      maxCols = colToNumber(colEnd) - colToNumber(colStart) + 1;
    }

    // เติมช่องว่างถ้า row ไม่ครบ column และ map เป็น object
    const data = values.slice(1).map(row => {
      while (row.length < maxCols) {
        row.push('');
      }
      const obj = {};
      header.forEach((key, index) => {
        obj[key] = row[index] || '';
      });
      // ถ้า fields ถูกกำหนด ให้เลือกเฉพาะ field ที่ต้องการ
      if (fields && Array.isArray(fields)) {
        const filtered = {};
        for (const f of fields) {
          filtered[f] = obj[f];
        }
        return filtered;
      }
      return obj;
    });

    return data;
  }

  async fetchSheetData_key_rows(auth, spreadsheetId, range, fields = null, rowIndexes = null, filterFn = null) {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const values = res.data.values || [];
    if (values.length === 0) return [];

    const header = values[0];

    // หาจำนวน column จาก range (เช่น A1:D10)
    const columnCount = range.match(/([A-Z]+):([A-Z]+)/);
    let maxCols = 0;
    if (columnCount) {
      const colStart = columnCount[1];
      const colEnd = columnCount[2];
      const colToNumber = col => {
        let num = 0;
        for (let i = 0; i < col.length; i++) {
          num *= 26;
          num += col.charCodeAt(i) - 64;
        }
        return num;
      };
      maxCols = colToNumber(colEnd) - colToNumber(colStart) + 1;
    }

    let data = values.slice(1).map(row => {
      while (row.length < maxCols) {
        row.push('');
      }
      const obj = {};
      header.forEach((key, index) => {
        obj[key] = row[index] || '';
      });
      if (fields && Array.isArray(fields)) {
        const filtered = {};
        for (const f of fields) {
          filtered[f] = obj[f];
        }
        return filtered;
      }
      return obj;
    });

    // เลือกเฉพาะบรรทัดที่ต้องการ
    if (Array.isArray(rowIndexes)) {
      data = rowIndexes.map(i => data[i]).filter(Boolean);
    }
    // หรือ filter ด้วยฟังก์ชัน
    if (typeof filterFn === 'function') {
      data = data.filter(filterFn);
    }

    return data;
  }

  // บันทึกข้อมูลลง Google Sheet โดยรับ spreadsheetId และ range และ rows (ข้อมูลที่เป็น array 2D)
  async updateRows(auth, spreadsheetId, range, rows) {
    const sheets = google.sheets({ version: 'v4', auth });
    // const res = await sheets.spreadsheets.values.append({
    //   spreadsheetId,
    //   range,
    //   valueInputOption: 'RAW',
    //   insertDataOption: 'INSERT_ROWS',
    //   requestBody: {
    //     values: rows,  // rows ต้องเป็น 2D array เช่น [['A1', 'B1'], ['A2', 'B2']]
    //   },
    // });

    const res = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: rows }  // rows ต้องเป็น 2D array เช่น [['A1', 'B1'], ['A2', 'B2']]
    });
    return res.data;
  }

  // อัปเดตข้อมูลในแถวที่มีอยู่แล้ว ตาม row ที่ข้อมูลทำ
  // async updateDynamicRows(auth, spreadsheetId, sheetName, rangeheader, data, startRow = 5) {
  //   const sheets = google.sheets({ version: 'v4', auth });

  //   // STEP 1: ดึงข้อมูลตั้งแต่ header (เช่นแถว startRow)
  //   const allDataRes = await sheets.spreadsheets.values.get({
  //     spreadsheetId,
  //     range: `${sheetName}!${rangeheader}`
  //   });

  //   const rows = allDataRes.data.values || [];
  //   if (rows.length === 0) throw new Error('ไม่พบข้อมูลในช่วงที่กำหนด');

  //   const headers = rows[0];
  //   const rowColIndex = headers.indexOf("Row");
  //   if (rowColIndex === -1) {
  //     throw new Error("ไม่พบคอลัมน์ชื่อ 'Row'");
  //   }

  //   function getColLetter(index) {
  //     let col = '';
  //     while (index >= 0) {
  //       col = String.fromCharCode((index % 26) + 65) + col;
  //       index = Math.floor(index / 26) - 1;
  //     }
  //     return col;
  //   }

  //   const updates = [];

  //   // STEP 2: หาและอัปเดต
  //   for (const updateItem of data) {
  //     const matchRow = rows.findIndex(r => r[rowColIndex] == updateItem.Row);
  //     if (matchRow === -1) continue;

  //     // ใช้ startRow แทน 5 เพื่อให้ยืดหยุ่น
  //     const sheetRowIndex = matchRow + startRow;

  //     for (const key in updateItem) {
  //       if (key === 'Row') continue;

  //       const colIndex = headers.indexOf(key);
  //       if (colIndex === -1) continue;

  //       const colLetter = getColLetter(colIndex);
  //       const cellRange = `${sheetName}!${colLetter}${sheetRowIndex}`;

  //       updates.push({
  //         range: cellRange,
  //         values: [[updateItem[key]]]
  //       });
  //     }
  //   }

  //   if (updates.length === 0) return { message: 'No updates' };

  //   // STEP 3: Batch update
  //   const res = await sheets.spreadsheets.values.batchUpdate({
  //     spreadsheetId,
  //     requestBody: {
  //       valueInputOption: 'RAW',
  //       data: updates
  //     }
  //   });

  //   return res.data;
  // }
  async updateDynamicRows(auth, spreadsheetId, sheetName, rangeheader, data, startRow = 5, keyColumn = "Row") {
    const sheets = google.sheets({ version: 'v4', auth });

    // STEP 1: ดึงข้อมูลตั้งแต่ header (เช่นแถว startRow)
    const allDataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${rangeheader}`
    });

    const rows = allDataRes.data.values || [];
    if (rows.length === 0) throw new Error('ไม่พบข้อมูลในช่วงที่กำหนด');

    const headers = rows[0];
    const rowColIndex = headers.indexOf(keyColumn);
    if (rowColIndex === -1) {
      throw new Error(`ไม่พบคอลัมน์ชื่อ '${keyColumn}'`);
    }

    function getColLetter(index) {
      let col = '';
      while (index >= 0) {
        col = String.fromCharCode((index % 26) + 65) + col;
        index = Math.floor(index / 26) - 1;
      }
      return col;
    }

    const updates = [];

    // STEP 2: หาและอัปเดต
    for (const updateItem of data) {
      const matchRow = rows.findIndex(r => r[rowColIndex] == updateItem[keyColumn]);
      if (matchRow === -1) continue;

      // ใช้ startRow แทน 5 เพื่อให้ยืดหยุ่น
      const sheetRowIndex = matchRow + startRow;

      for (const key in updateItem) {
        if (key === keyColumn) continue;

        const colIndex = headers.indexOf(key);
        if (colIndex === -1) continue;

        const colLetter = getColLetter(colIndex);
        const cellRange = `${sheetName}!${colLetter}${sheetRowIndex}`;

        updates.push({
          range: cellRange,
          values: [[updateItem[key]]]
        });
      }
    }

    if (updates.length === 0) return { message: 'No updates' };

    // STEP 3: Batch update
    const res = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });

    return res.data;
  }


  // เพิ่มแถวใหม่ที่ range ที่กำหนด โดยไม่ลบข้อมูลเก่า ใช้สำหรับ append ข้อมูลใหม่ต่อท้ายข้อมูลเก่า
  async appendRows(auth, spreadsheetId, range, rows) {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range, // เช่น 'Sheet1!C:D'
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows, // rows ต้องเป็น 2D array เช่น [['A1', 'B1'], ['A2', 'B2']]
      },
    });
    return res.data;
  }

  async getSheetDataTestCase(spreadsheetId, sheetName, auth) {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return [];

    // header อยู่ที่แถว A3 (index 2)
    const headerRow = rows[2];
    const dataRows = rows.slice(3);

    // แปลง array -> object
    const objects = dataRows.map(row => {
      const obj = {};
      headerRow.forEach((key, i) => {
        obj[key] = row[i] || ""; // ถ้าไม่มีค่าให้เป็น empty string
      });
      return obj;
    });

    return objects;

  }


}

module.exports = { GoogleSheet };

// ถ้ารันไฟล์นี้ตรง ๆ
// วิธีเรียกใช้: node utils/google-sheet-OAuth.helper.js
// 1. login google account ของ บรืษัท
// 2. copy code ที่ได้จาก browser ซึ่งอยู่ใน url มาใส่ใน terminal
// 3. จะได้ token.json มาเก็บไว้ที่ credentials/token.json
// 4. เอา token.json ไปใช้กับ project อื่นได้เลย
if (require.main === module) {
  (async () => {
    const gs = new GoogleSheet();
    const auth = await gs.initAuth();
    const spreadsheetId = '1HTN4nBwcEt2Uff4Al2vaa49db-kbc_LTe0G_99lB3FY';
    const range = 'ดึงจาก API_Data_swagger.spec.js!I2:I7';
    const rows = await gs.fetchSheetData(auth, spreadsheetId, range);
    console.log('Data:', rows);
  })().catch(console.error);
}
