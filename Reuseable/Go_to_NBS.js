// Go_to_NBS.js (รวม Login)
const Selector = require('../fixtures/Selector');
const Env_NBS_URL = require('../fixtures/Env_NBS_URL');
const Data_Username = require('../fixtures/Data_Username');

// ฟังก์ชัน Login (reusable)
function login(username, password, url) {
  cy.visit(url);
  cy.wait(100);
  cy.get(Selector.usernameInput).type(username, { delay: 50 });
  cy.wait(100);
  cy.get(Selector.passwordInput).type(password, { delay: 50 });
  cy.wait(100);
  cy.get(Selector.loginButton).click();
  cy.wait(1000);
}

// ฟังก์ชันกลางสำหรับ login เข้า NBS Portal (เลือก env, user)
function Go_to_NBS({ url, userIndex = 0 } = {}) {
  if (!url) throw new Error('ต้องระบุ url สำหรับ Go_to_NBS');
  // 2. เลือก user จาก Data_Username.js
  const testUser = Data_Username[userIndex];
  if (!testUser) throw new Error('ไม่พบ user index ที่ระบุใน Data_Username.js');
  login(testUser.username, testUser.password, url);
  cy.wait(2000);
}

module.exports = { Go_to_NBS, login };
