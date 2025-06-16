// Username.js
// สำหรับเก็บชุดข้อมูลทดสอบ (Test Data) ของการ login

module.exports = [
  {
    username: 'boss',
    password: '123',
    expectSuccess: true,
    expectText: require('./assertion').LOGIN_SUCCESS_TEXT,
    expectUser: 'boss',
    //only: true // จะ run เฉพาะเคสนี้
  },
  /*{
    username: 'pre1',
    password: '123',
    expectSuccess: true,
    expectText: require('./assertion').LOGIN_SUCCESS_TEXT,
    expectUser: 'pre1',
    //only: true // จะ run เฉพาะเคสนี้
    //skip: true // จะข้ามเคสนี้
  },
  {
    username: 'xxx',
    password: '123',
    expectSuccess: false,
    expectText: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', // หรือ 'Unknown' ตามจริง
    expectUser: null,
  },*/
];
