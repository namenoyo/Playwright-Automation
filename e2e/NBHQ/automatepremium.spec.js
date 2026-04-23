// @ts-check
import { test, expect } from '@playwright/test';
import { newCaseExample } from '../data/prototype1.js'; // ตรวจสอบ path ของไฟล์ data.js ให้ถูกต้อง

newCaseExample.forEach((data, idx) => {
test(`test config A17 ชุดที่ ${idx + 1} `, async ({ page }) => {
// Login NBS UAT
await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html');
await page.locator('#username').click();
await page.locator('#username').fill('0001'); 
await page.locator('#password').fill('12');  
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForTimeout(300);

await page.getByRole('menuitem', { name: 'ระบบงาน NBS Portal' }).click();
await page.getByText('Home').nth(1).click();
//await page.locator('#yui_3_9_0_2_1759458078134_599').click();
await page.getByText('New Business System').click();




// // เข้าใช้งานหน้า NBHQ
// await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
// await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
// await page.waitForTimeout(300);

// หน้า NBHQ
//await page.goto('https://uat-intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
await page.waitForTimeout(300);
await page.getByRole('button', { name: ' จัดการข้อมูลเคสใหม่' }).click();
await page.getByRole('button', { name: 'บันทึกข้อมูลเคสใหม่' }).click();
await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).click();

await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).fill(data.applicationNo);
await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).press('Tab');

await page.getByRole('textbox', { name: 'วันที่บันทึกใบคำขอ' }).click();
await page.getByRole('textbox', { name: 'วันที่บันทึกใบคำขอ' }).fill('25062568');
await page.getByRole('textbox', { name: 'วันที่บันทึกใบคำขอ' }).press('Tab');
await page.waitForTimeout(500);
await page.getByRole('textbox', { name: 'ถึงวันที่' }).click();
await page.getByRole('textbox', { name: 'ถึงวันที่' }).fill('25062568');
await page.getByRole('textbox', { name: 'ถึงวันที่' }).press('Tab');
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
await page.waitForTimeout(500);

await page.getByRole('button', { name: '' }).first().click();
await page.waitForTimeout(2000);

//ป้อนวันที่เขียนใบคำขอ
// Function to get the current date in Thai Buddhist year format
  function getThaiBuddhistDate(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543; // แปลงจากปีคริสต์ศักราชเป็นปีพุทธศักราช
  return `${day}/${month}/${year}`;
  }

//ดึงค่าวันที่จากข้างบน
await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();

  // สร้างวันที่ปัจจุบัน
  const currentDate = getThaiBuddhistDate();
  // นำวันที่ที่ได้ไปใช้ในคำสั่ง fill()
  await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
  await page.waitForTimeout(1500);

  //ยืนยันการเปลี่ยนแบบประกัน
await page.getByRole('button', { name: 'ยืนยัน' }).click();
await page.waitForTimeout(2000);

//ป้อนตัวแทน
await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
await page.getByRole('textbox', { name: 'ตัวแทนเจ้าของผลงาน *' }).fill(String(data.agentCode).trim());await page.waitForTimeout(500);
await page.getByRole('textbox', { name: 'ตัวแทนเจ้าของผลงาน *' }).press('Tab');
await page.waitForTimeout(1500);



//ป้อนช่องทาง
await page.getByLabel('รหัสสถาบัน/ คู่ค้า (Partner) *').click();
await page.getByRole('textbox', { name: 'รหัสสถาบัน/ คู่ค้า (Partner) *' }).fill(String(data.partner));await page.waitForTimeout(500);
await page.getByRole('textbox', { name: 'รหัสสถาบัน/ คู่ค้า (Partner) *' }).press('Tab');
await page.waitForTimeout(1500);


// คำนวณวันเกิดจากอายุ
function getBirthDateFromAge(age) {
  // ปีฐาน (พ.ศ.) = 2568
  const buddhistYearBase = 2568;
  const year = buddhistYearBase - age;

  // คืนค่าเป็น ddMMyyyy (ใช้ 01/01 เป็นวันเกิดสมมติ)
  const testBirthDate = `0101${year}`;
  return testBirthDate;
}

//const age = getAgeFromBirthDate(data.birthDate);
const testBirthDate = getBirthDateFromAge(data.age);

let ageInt = Number(data.age);

//แก้ไขวันเกิด และ คำนำหน้าชื่อ และเพศ
if(ageInt < 15){
  if(data.gender==='ชาย'){
    await page.locator('#section-insured div').filter({ hasText: /^นาย$/ }).nth(3).click();
    
    await page.locator('.css-2bhlbd-indicatorContainer > .css-19bqh2r > path').first().click();
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).press('Tab');

    await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
    await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(testBirthDate);
    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');
    await page.waitForTimeout(2000);

    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'นามสกุล *' }).first().press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.locator('#section-insured #insureName').first().press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).first().fill('ด.ช.');
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).first().press('Tab');
    await page.waitForTimeout(500);
  }
  else if(data.gender==='หญิง'){
        await page.locator('#section-insured div').filter({ hasText: /^นาย$/ }).nth(3).click();
    
    await page.locator('.css-2bhlbd-indicatorContainer > .css-19bqh2r > path').first().click();
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).press('Tab');

    await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
    await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(testBirthDate);
    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');
    await page.waitForTimeout(2000);

    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'นามสกุล *' }).first().press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.locator('#section-insured #insureName').first().press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).first().fill('ด.ญ.');
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).first().press('Tab');
    await page.waitForTimeout(500);
  }
}

else if(ageInt>=15 && ageInt<46){
  if(data.gender==='ชาย'){
    await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
    await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(testBirthDate);
    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');
    await page.waitForTimeout(2000);
  }
  else if(data.gender==='หญิง'){
    await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
    await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(testBirthDate);
    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');
    await page.waitForTimeout(2000);

    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'นามสกุล *' }).first().press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.locator('#section-insured #insureName').first().press('Shift+Tab');
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).first().fill('น.ส.');
    await page.getByRole('textbox', { name: 'คำนำหน้า *' }).first().press('Tab');
    await page.waitForTimeout(500);

  }

}

//ป้อนแบบประกัน (A17)
await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(data.policyName);
await page.waitForTimeout(1500);
await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
await page.waitForTimeout(4000);

//ป้อนจำนวนเงินเอาประกัน (6000-48000)
await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).click();
await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).fill(String(data.capital));
await page.waitForTimeout(2000);
await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');
await page.waitForTimeout(6000);

//งวดการชำระ
await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
await page.getByRole('textbox', { name: 'งวดการชำระ *' }).fill(data.sMode);
await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
await page.waitForTimeout(5000);

//สูตรดึงเรทเบี้ยต่างๆ
const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();
await page.waitForTimeout(1000);

//เอาไว้ตรวจสอบ index ของข้อมูล
// console.log(draftPremium3);


let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
let insuLastPremiumIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของเบี้ยประกันภัยหลัก

// หา index แก้ไขตามแบบประกันที่เลือก
insuMainIndex = draftPremium3.findIndex(text => text.trim().includes(data.policyName));
//insuLastPremiumIndex = draftPremium3.findIndex(text => text.trim().includes('เบี้ยประกันภัยหลัก'));

if (insuMainIndex !== -1) {
  const insuMain = draftPremium3[insuMainIndex];
  const lastPremiumMain = draftPremium3[insuMainIndex+6];
  const insuMoney = draftPremium3[insuMainIndex + 4];

  console.log(`แบบประกันหลัก: ${insuMain}`);
  console.log('   อายุ: '+ data.age+' ปี   วันเกิดที่ถูกคีย์: '+ testBirthDate);
  console.log(`   จำนวนเงินเอาประกันภัย (ทุน): ${insuMoney}`);
  console.log('   Expect Premium: ' + data.expectedPremium);
  console.log(`   Actual Premium: ${lastPremiumMain}`);

  const finishTime = new Date();
  console.log(`Test ชุดที่ ${idx + 1} finished at: ${finishTime.toLocaleString('th-TH', { hour12: false })}`);

  if (lastPremiumMain === data.expectedPremium) {
    console.log(`log ชุดที่ ${idx + 1} `, 'PASS')
    console.log('----------------------------------------------');
    console.log('                                              ');
    
  } else {
    console.log(`log ชุดที่ ${idx + 1} `, 'FAIL')
    console.log('----------------------------------------------');
    console.log('                                              ');
    
    
  }
}
});
});