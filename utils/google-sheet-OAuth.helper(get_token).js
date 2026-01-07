const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { google } = require('googleapis');

class GoogleSheet {
  constructor() {
    this.SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    this.TOKEN_PATH = path.resolve(__dirname, '../credentials/token.json');
    this.CREDENTIALS_PATH = path.resolve(__dirname, '../credentials/credentials.json');
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
    const spreadsheetId = 'id_ของ_google_sheet_ที่ต้องการดึงข้อมูล';
    const range = 'range_ที่ต้องการดึงข้อมูล!A1:E10'; // ตัวอย่างเช่น 'Sheet1!A1:E10'
    const rows = await gs.fetchSheetData(auth, spreadsheetId, range);
    console.log('Data:', rows);
  })().catch(console.error);
}
