import { test, expect } from '@playwright/test';

const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');

const { generateTempReceipt } = require('../../e2e/NewCase_NBHQ/helpers/tempReceipt');

const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');

const Result = [];

test(`บันทึกเคสใหม่แบบออกกรม์`, async ({ page }, testInfo) => {
  // ตั้งค่า timeout สำหรับการทดสอบ
  test.setTimeout(7200000); // 2 ชั่วโมง

  let testData = [];

  const googlesheet = new GoogleSheet();
  const auth = await googlesheet.initAuth();
  const spreadsheetId = '1lmIoKDqXzw922U3F6FIYWdBxchsPbQNW4hQ_Vh812pM';
  const sheetname = `Prepare_Test_Data_NBS`;
  const row_header = 4;
  const readrange = `${sheetname}!A${row_header}:ZZ1000000`;
  testData = await googlesheet.fetchSheetData_key(auth, spreadsheetId, readrange);
  const sheetnamewrite = sheetname;
  const range_write = `A${row_header}:ZZ`;

  // กรองเอาเฉพาะเคสที่สถานะไม่ใช่ Done, Skip, Fail
  const denyStatus = ['Done', 'Skip', 'Fail'];
  const result_new_array_status_not_finish = testData.filter(x => !denyStatus.includes(x["Test Status"]));
  // กรองเอาเฉพาะเคสที่ Valid เป็น TRUE
  const validStatus = ['TRUE', 'true', 'True'];
  const result_filter_valid = result_new_array_status_not_finish.filter(x => validStatus.includes(x["Valid"]));
  // กรองเอาเฉพาะเคสที่ DATA USER BY ที่กำหนดเท่านั้น
  const allowUser = ['top'];
  const result_filter_user = result_filter_valid.filter(x => allowUser.includes(x["Create By"]));

  // console.log('จำนวนเคสที่ผ่านการกรอง:', result_filter_user.length);

  // วนลูปทดสอบเคสที่ผ่านการกรอง
  for (const [index, data] of result_filter_user.entries()) {
    console.log(`เริ่มทำการสร้างข้อมูลที่ ${index + 1} จากทั้งหมด ${result_filter_user.length}`);

    // เตรียมตัวแปรเก็บผลลัพธ์
    let data_create = [];

    // ชื่อ header key สำหรับการอ้างอิงข้อมูล
    const uniquekey = 'No';
    const row_header = 4; // บวก 4 เพราะข้อมูลเริ่มที่แถวที่ 4 ใน Google Sheet
    const row_uniquekey = data['No'];

    const teststatus = data['Test Status']; // ดึงสถานะการทดสอบจาก Google Sheet
    const customertype = data['ลูกค้า']; // ดึงข้อมูลประเภทลูกค้าจาก Google Sheet
    const system = data['Env']; // ดึงข้อมูลระบบที่ต้องการทดสอบจาก Google Sheet
    const username = data['สาขา']; // ดึงข้อมูล username จาก Google Sheet
    const agentCode = data['รหัสตัวแทน']; // ดึงข้อมูลรหัสตัวแทนจาก Google Sheet
    const agentName = data['ชื่อตัวแทน']; // ดึงข้อมูลชื่อตัวแทนจาก Google Sheet
    const cardNumber = data['เลขบัตร']; // ดึงข้อมูลเลขบัตรจาก Google Sheet
    const title = data['คำนำหน้าลูกค้า']; // ดึงข้อมูลคำนำหน้าลูกค้าจาก Google Sheet
    const name = data['ชื่อลูกค้า']; // ดึงข้อมูลชื่อลูกค้าจาก Google Sheet
    const surname = data['นามสกุลลูกค้า']; // ดึงข้อมูลนามสกุลลูกค้าจาก Google Sheet
    const expiredate_card = data['วันที่บัตรหมดอายุ']; // ดึงข้อมูลวันหมดอายุบัตรจาก Google Sheet
    const birthdate = data['วันเดือนปีเกิด']; // ดึงข้อมูลวันเกิดลูกค้าจาก Google Sheet
    const age = data['อายุ (ปี)']; // ดึงข้อมูลอายุลูกค้าจาก Google Sheet
    const gender_type = data['ประเภทเพศ']; // ดึงข้อมูลเพศลูกค้าจาก Google Sheet
    const gender = data['เพศ']; // ดึงข้อมูลเพศลูกค้าจาก Google Sheet
    const requestId = data['เลขใบคำขอ']; // ดึงข้อมูลเลขใบคำขอ จาก Google Sheet
    let temporaryReceipt = data['เลขใบรับเงินชั่วคราว']; // ดึงข้อมูลเลขที่ใบรับเงินชั่วคราว จาก Google Sheet
    const cardtype = data['ประเภทบัตร']; // ดึงข้อมูลประเภทบัตร จาก Google Sheet
    const documenttype = data['เอกสารที่ใช้แสดง']; // ดึงข้อมูลประเภทเอกสาร จาก Google Sheet
    const mobile = data['โทรศัพท์มือถือ *']; // ดึงข้อมูลเบอร์มือถือ จาก Google Sheet
    const homeno_customer = data['ที่อยู่ตามทะเบียนบ้าน-เลขที่']; // ดึงข้อมูลบ้านเลขที่ จาก Google Sheet
    const moo_customer = data['ที่อยู่ตามทะเบียนบ้าน-หมู่ที่']; // ดึงข้อมูลหมู่ที่ จาก Google Sheet
    const village_customer = data['ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร']; // ดึงข้อมูลหมู่บ้าน จาก Google Sheet
    const soi_customer = data['ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย']; // ดึงข้อมูลซอย จาก Google Sheet
    const road_customer = data['ที่อยู่ตามทะเบียนบ้าน-ถนน']; // ดึงข้อมูลถนน จาก Google Sheet
    const district_customer = data['ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต']; // ดึงข้อมูลอำเภอ จาก Google Sheet
    const subdistrict_customer = data['ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง']; // ดึงข้อมูลตำบล จาก Google Sheet
    const province_customer = data['ที่อยู่ตามทะเบียนบ้าน-จังหวัด']; // ดึงข้อมูลจังหวัด จาก Google Sheet
    const codeoccupation = data['รหัสอาชีพ']; // ดึงข้อมูลอาชีพ จาก Google Sheet
    const nameoccupation = data['อาชีพ']; // ดึงข้อมูลชื่ออาชีพ จาก Google Sheet
    let typeplan = data['ประเภทแบบประกัน']; // ดึงข้อมูลแบบประกัน จาก Google Sheet
    const codeplan = data['รหัสแบบประกัน']; // ดึงข้อมูลแบบประกัน จาก Google Sheet
    const nameplan = data['ชื่อแบบประกัน']; // ดึงข้อมูลแบบประกัน จาก Google Sheet
    const capital = data['ทุน']; // ดึงข้อมูลทุนประกัน จาก Google Sheet
    const sMode = data['โหมดชำระ']; // ดึงข้อมูลวิธีชำระเบี้ย จาก Google Sheet
    const NumOfRider = data['จำนวน Rider']; // ดึงข้อมูลจำนวนไรเดอร์ จาก Google Sheet
    const namerider = data['ชื่อ Rider']; // ดึงข้อมูลชื่อไรเดอร์ จาก Google Sheet
    const capitalrider = data['ทุน Rider']; // ดึงข้อมูลทุนประกันของไรเดอร์ จาก Google Sheet
    const ownpay = data['การชำระเบี้ยประกันภัย']; // ดึงข้อมูลชำระเองหรือไม่ จาก Google Sheet
    const ownpay_title = data['ผู้ชำระเบี้ยประกันภัย-คำนำหน้า']; // ดึงข้อมูลคำนำหน้าผู้ชำระเบี้ยประกันภัย จาก Google Sheet
    const ownpay_name = data['ผู้ชำระเบี้ยประกันภัย-ชื่อ']; // ดึงข้อมูลชื่อผู้ชำระเบี้ยประกันภัย จาก Google Sheet
    const ownpay_surname = data['ผู้ชำระเบี้ยประกันภัย-นามสกุล']; // ดึงข้อมูลนามสกุลผู้ชำระเบี้ยประกันภัย จาก Google Sheet
    const ownpay_age = data['ผู้ชำระเบี้ยประกันภัย-อายุ']; // ดึงข้อมูลอายุผู้ชำระเบี้ยประกันภัย จาก Google Sheet
    const ownpay_relation = data['ผู้ชำระเบี้ยประกันภัย-ความสัมพันธ์']; // ดึงข้อมูลความสัมพันธ์ของผู้ชำระเบี้ยประกันภัยกับผู้เอาประกัน จาก Google Sheet
    const ownpay_cardtype = data['ผู้ชำระเบี้ยประกันภัย-ประเภทบัตร']; // ดึงข้อมูลประเภทบัตรของผู้ชำระเบี้ยประกันภัย จาก Google Sheet
    const ownpay_cardnumber = data['ผู้ชำระเบี้ยประกันภัย-เลขบัตร']; // ดึงข้อมูลเลขบัตรของผู้ชำระเบี้ยประกันภัย จาก Google Sheet
    const NumOfbenef = data['จำนวนผู้รับผลประโยชน์']; // ดึงข้อมูลจำนวนผู้รับผลประโยชน์ จาก Google Sheet
    const height = data['ส่วนสูง']; // ดึงข้อมูลส่วนสูง จาก Google Sheet
    const weight = data['น้ำหนัก']; // ดึงข้อมูลน้ำหนัก จาก Google Sheet
    const change_weight_6_month = data['น้ำหนักเปลี่ยนแปลงในรอบ 6 เดือน']; // ดึงข้อมูลน้ำหนักเปลี่ยนแปลงในรอบ 6 เดือน จาก Google Sheet
    const marital_status = data['สถานภาพ']; // ดึงข้อมูลสถานภาพ จาก Google Sheet
    const marital_title = data['คำนำหน้าคู่สมรส']; // ดึงข้อมูลคำนำหน้าสถานภาพ จาก Google Sheet
    const marital_name = data['ชื่อคู่สมรส']; // ดึงข้อมูลชื่อสถานภาพ จาก Google Sheet
    const marital_surname = data['นามสกุลคู่สมรส']; // ดึงข้อมูลนามสกุลสถานภาพ จาก Google Sheet
    const send_document_address_type = data['ที่อยู่ที่ต้องการจัดส่งเอกสาร']; // ดึงข้อมูลส่งเอกสารไปที่ จาก Google Sheet
    const send_document_current_address_type = data['ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่']; // ดึงข้อมูลที่อยู่ปัจจุบัน-ใช้ตามที่อยู่ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_home_no = data['ที่อยู่ปัจจุบัน-เลขที่']; // ดึงข้อมูลที่อยู่ปัจจุบัน-บ้านเลขที่ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_moo = data['ที่อยู่ปัจจุบัน-หมู่ที่']; // ดึงข้อมูลที่อยู่ปัจจุบัน-หมู่ที่ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_village = data['ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร']; // ดึงข้อมูลที่อยู่ปัจจุบัน-หมู่บ้าน สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_soi = data['ที่อยู่ปัจจุบัน-ตรอก/ซอย']; // ดึงข้อมูลที่อยู่ปัจจุบัน-ซอย สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_road = data['ที่อยู่ปัจจุบัน-ถนน']; // ดึงข้อมูลที่อยู่ปัจจุบัน-ถนน สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_district = data['ที่อยู่ปัจจุบัน-อำเภอ/เขต']; // ดึงข้อมูลที่อยู่ปัจจุบัน-อำเภอ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_subdistrict = data['ที่อยู่ปัจจุบัน-ตำบล/แขวง']; // ดึงข้อมูลที่อยู่ปัจจุบัน-ตำบล สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_current_address_province = data['ที่อยู่ปัจจุบัน-จังหวัด']; // ดึงข้อมูลที่อยู่ปัจจุบัน-จังหวัด สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_type = data['สถานที่ทำงาน-ใช้ตามที่อยู่']; // ดึงข้อมูลสถานที่ทำงาน-ใช้ตามที่อยู่ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_name = data['สถานที่ทำงาน-ชื่อสถานที่ทำงาน']; // ดึงข้อมูลชื่อสถานที่ทำงาน สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_home_no = data['สถานที่ทำงาน-เลขที่']; // ดึงข้อมูลสถานที่ทำงาน-บ้านเลขที่ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_moo = data['สถานที่ทำงาน-หมู่ที่']; // ดึงข้อมูลสถานที่ทำงาน-หมู่ที่ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_village = data['สถานที่ทำงาน-หมู่บ้าน/อาคาร']; // ดึงข้อมูลสถานที่ทำงาน-หมู่บ้าน สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_soi = data['สถานที่ทำงาน-ตรอก/ซอย']; // ดึงข้อมูลสถานที่ทำงาน-ซอย สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_road = data['สถานที่ทำงาน-ถนน']; // ดึงข้อมูลสถานที่ทำงาน-ถนน สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_district = data['สถานที่ทำงาน-อำเภอ/เขต']; // ดึงข้อมูลสถานที่ทำงาน-อำเภอ สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_subdistrict = data['สถานที่ทำงาน-ตำบล/แขวง']; // ดึงข้อมูลสถานที่ทำงาน-ตำบล สำหรับส่งเอกสาร จาก Google Sheet
    const send_document_work_address_province = data['สถานที่ทำงาน-จังหวัด']; // ดึงข้อมูลสถานที่ทำงาน-จังหวัด สำหรับส่งเอกสาร จาก Google Sheet
    const salaryPerYear = data['รายได้ต่อปี']; // ดึงข้อมูลรายได้ต่อปี จาก Google Sheet
    const payTypeBank = data['วิธีชำระ']; // ดึงข้อมูลช่องทางการชำระเงิน-ธนาคาร จาก Google Sheet
    const receive_document_type = data['ช่องทางรับเอกสาร'] // ดึงข้อมูล ช่องทางรับเอกสาร จาก Google Sheet

    if (teststatus === 'Ready for Test' || teststatus === 'Ready for Retest' || teststatus === 'Inprogress') {
      try {

        if (typeplan === 'ORD') {
          // เช็คว่ามีใบรับเงินชั่วคราวหรือยัง ถ้ายังไม่มีให้ทำ process ขอใบขอรับเงินชั่วคราว
          if (temporaryReceipt === '') {
            const tempno = await generateTempReceipt(page, {
              environment: system,
              branch: username,
              agentCode: agentCode
            });

            // อัพเดท Status เป็น In Progress
            data_create.push({ [uniquekey]: row_uniquekey, ["เลขใบรับเงินชั่วคราว"]: tempno });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

          }

          // อัพเดท Status เป็น In Progress
          data_create.push({ [uniquekey]: row_uniquekey, ["Test Status"]: 'Inprogress', Remark: '' });
          // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
          await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
          // เคลียร์ array หลังอัพโหลด
          data_create = [];

          // จับ event ของ dialog และกด accept อัตโนมัติ ของ Network
          page.once('dialog', async dialog => {
            try {
              console.log('Dialog message:', dialog.message());

              await dialog.accept();
            } catch (err) {
              console.log('Dialog already handled');
            }
          });

          if (system === 'UAT') {
            await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
          }
          else {
            await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
          }

          await test.step('Step 1 - Login เข้าสู่ระบบ', async () => {
            const check_logout = await page.locator('a', { hasText: 'ออกจากระบบ' }).isVisible()
            if (!check_logout) {

              // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
              // Login
              // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

              //login
              await page.locator('#username').click();
              await page.locator('#username').fill(username); //ใส่ username
              await page.locator('#password').click();
              await page.locator('#password').fill('1'); //ใส่ password
              await page.getByRole('button', { name: /login/i }).click();
              await page.waitForLoadState('networkidle'); // รอให้โหลดหน้าเสร็จสมบูรณ์

            }
          });

          await test.step('Step 2 - บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            console.log('\nเริ่มทำการคีย์ข้อมูลเคสใหม่แบบย่อ ต่างสาขา (สามัญ) ที่ No:', row_uniquekey);

            //เข้าเมนู
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click();
            await page.getByRole('menuitem', { name: 'บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)' }).click();
            await page.waitForLoadState('networkidle');

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_newcase] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/combine2/newcaseshortly/ord/record/list.html') && res.status() === 200
              ),
              //ใส่ตัวแทน
              await page.locator('#agent-code-name').fill(agentCode), //ใส่ agent code
              await page.getByRole('option', { name: agentName }).click() //เลือก agent name
            ]);

            if (customertype === 'ใหม่') {
              //เข้าเมนูเพิ่มเคสใหม่
              await page.locator('#bAddNew').click();
              await page.locator('#addCus').click();
            } else {

            }

            //เพิ่มข้อมูลลูกค้า
            if (cardtype === 'เลขประจำตัว 13 หลัก') {
              await page.selectOption('#cardCusType', { label: 'เลขประจำตัว 13 หลัก' }); //เลือกประเภทบัตร
            } else {
              await page.selectOption('#cardCusType', { label: 'หนังสือเดินทาง (passport)' }); //เลือกประเภทบัตร
            }
            await page.locator('#cardCusNumberAdd').click();
            await page.locator('#cardCusNumberAdd').fill(cardNumber); //ใส่เลขบัตรประจำตัวประชาชน
            await page.locator('#prefixCus').click();
            await page.locator('#prefixCus').fill(title); //ใส่คำนำหน้าชื่อ
            await page.waitForSelector(`li.yui3-aclist-item[data-text="${title}"]`);
            await page.locator(`li.yui3-aclist-item[data-text="${title}"]`).click();
            await page.locator('#nameCusAdd').click();
            await page.locator('#nameCusAdd').fill(name); //ใส่ชื่อ
            await page.locator('#surnameCusAdd').click();
            await page.locator('#surnameCusAdd').fill(surname); //ใส่นามสกุล
            await page.locator('#birthDateCus').click();
            const changeformatbirthdate = birthdate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$1$2$3'); //แปลงรูปแบบวันเกิดจาก dd/mm/yyyy เป็น ddmmyyyy
            await page.locator('#birthDateCus').fill(changeformatbirthdate); //วันเกิด ddmmyyyy

            if (gender_type === 'กรุณาระบุเพศ') {
              // เลือกเพศ
              if (gender === 'ชาย') {
                try {
                  const maleBtn = page.locator('#genderCusM');
                  await Promise.race([
                    maleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              } else if (gender === 'หญิง') {
                try {
                  const femaleBtn = page.locator('#genderCusF');
                  await Promise.race([
                    femaleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              }
            } else {
              // เลือกเพศ
              if (gender_type === 'ชาย') {
                try {
                  const maleBtn = page.locator('#genderCusM');
                  await Promise.race([
                    maleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              } else if (gender_type === 'หญิง') {
                try {
                  const femaleBtn = page.locator('#genderCusF');
                  await Promise.race([
                    femaleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              }
            }


            await page.locator('#surnameCusAdd').click();
            await page.locator('#confirmSelfie').click();
            await expect(page.getByRole('button', { name: 'ยืนยัน' })).toBeEnabled(); //ติ๊กถูกที่ช่องยืนยันข้อมูลถูกต้อง
            await page.getByRole('button', { name: 'ยืนยัน' }).click();

            console.log('เริ่มกรอกข้อมูลเคสใหม่')

            //ข้อมูลผู้เอาประกัน
            await page.locator('#requestId').click();
            await page.locator('#requestId').fill(requestId); //เลขที่คำขอ

            const today = new Date();
            const day = ("0" + today.getDate()).slice(-2);
            const month = ("0" + (today.getMonth() + 1)).slice(-2); // เดือนต้อง +1
            const yearBE = today.getFullYear() + 543;
            const DateFill = `${day}${month}${yearBE}`;
            const ExpireCardDate = DateFill + 5;

            await page.locator('#requestDatePdpa').click();
            await page.locator('#requestDatePdpa').fill(DateFill); //วันเขียนใบคำขอ
            await page.waitForTimeout(300);
            await page.locator('#expireDate').click();
            const changeformatexpiredate_card = expiredate_card.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$1$2$3'); //แปลงรูปแบบวันเกิดจาก dd/mm/yyyy เป็น ddmmyyyy
            await page.locator('#expireDate').fill(changeformatexpiredate_card); //วันบัตรหมดอายุ
            await page.waitForTimeout(300);

            // // if (cardtype === 'บัตรประชาชน' || cardtype === 'บัตรประชาชน ต่างด้าว') {
            // //   await page.selectOption('#checkCard', { label: 'บัตรประจำตัวประชาชน' }); //เลือกประเภทบัตร
            // // } else {
            // //   await page.selectOption('#checkCard', { label: 'หนังสือเดินทาง (passport)' }); //เลือกประเภทบัตร
            // // }

            await page.selectOption('#checkCard', { label: documenttype }); //เลือกประเภทเอกสาร

            // const allowedPrefixes = ['06', '08', '09'];
            // function generateRandomPhoneNumber() {
            //   const prefix = allowedPrefixes[Math.floor(Math.random() * allowedPrefixes.length)];
            //   const randomDigits = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
            //   return prefix + randomDigits;
            // }
            // let randomPhoneNumber;
            // let currentNumber = '';
            // while (!currentNumber) {
            //   randomPhoneNumber = generateRandomPhoneNumber();
            //   await page.locator('#phoneMobile').click();
            //   await page.locator('#phoneMobile').fill(randomPhoneNumber);
            //   // await page.waitForTimeout(5000);

            //   // await page
            //   //   .locator('#newcaseshortly-duplicate-mobile-panel button:has-text("ยกเลิก")')
            //   //   .click({ timeout: 2000 })
            //   //   .catch(() => { });
            //   // await page.waitForTimeout(1000);
            //   currentNumber = await page.locator('#phoneMobile').inputValue();
            // }
            await page.locator('#phoneMobile').click();
            await page.locator('#phoneMobile').fill(mobile); //เบอร์มือถือ
            await page.waitForTimeout(300);

            //ที่อยู่
            // const randomHomenum = Math.floor(100000 + Math.random() * 900000);
            await page.locator('#homeNo').click();
            await page.locator('#homeNo').fill(homeno_customer); //บ้านเลขที่
            await page.waitForTimeout(300);
            const check_popup_mobile_dup = await page.locator('#newcaseshortly-duplicate-mobile-panel').isVisible();
            if (check_popup_mobile_dup) {
              await page.locator('#newcaseshortly-duplicate-mobile-panel').locator('button', { hasText: 'ตกลง' }).click()
              await page.locator('#duplicateMobileCustomer').fill('ทดสอบ').then(await page.waitForTimeout(500));
              await page.locator('#newcaseshortly-duplicate-mobile-panel').locator('button', { hasText: 'บันทึก' }).click();
              await expect(page.locator('#newcaseshortly-duplicate-mobile-panel')).not.toBeVisible();
            }
            await page.locator('#building').click();
            await page.locator('#building').fill(village_customer); //หมู่บ้าน/อาคาร
            await page.waitForTimeout(300);
            await page.locator('#moo').click();
            await page.locator('#moo').fill(moo_customer); //หมู่ที่
            await page.waitForTimeout(300);
            await page.locator('#soi').click();
            await page.locator('#soi').fill(soi_customer); //ซอย
            await page.waitForTimeout(300);
            await page.locator('#street').click();
            await page.locator('#street').fill(road_customer); //ถนน
            await page.waitForTimeout(300);
            await page.selectOption('#province', { label: province_customer }); //เลือกจังหวัด
            await page.selectOption('#district', { label: district_customer }); //เลือกอำเภอ
            // await page.selectOption('#subdistrict', { label: subdistrict_customer }); //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
            const option = page.locator('#subdistrict option', {
              hasText: subdistrict_customer
            }).first();
            const value = await option.getAttribute('value');
            await page.selectOption('#subdistrict', value);

            //อาชีพ
            const occupation = `${codeoccupation}:${nameoccupation}`;
            await page.selectOption('#occupationList', { label: occupation }); //เลือกอาชีพ
            await page.locator('#rMotorcycleNotuse').click();

            //แบบประกัน
            await page.locator('#tempRecieptDate').fill(DateFill); // วันที่ใบรับเงินชั่วคราว
            await page.waitForTimeout(300);

            // เช็คว่ามีการเลือกแบบประกันสำเร็จหรือไม่ ถ้ายังให้ทำการเลือกแบบประกันซ้ำจนกว่าจะสำเร็จ
            let check_select_plan = await page.locator('#plan option:checked').textContent();
            let plan;
            while (check_select_plan.includes('โปรดระบุ')) {
              // bug //
              plan = `${codeplan} ${nameplan}`;
              await page.locator('#plan').click().then(() => page.waitForTimeout(600));
              await page.getByText('ชื่อแบบประกัน').click();
              await page.locator('#plan').click().then(() => page.waitForTimeout(600));
              await page.getByText('ชื่อแบบประกัน').click();
              await page.locator('#plan').click().then(() => page.waitForTimeout(600));
              // await page.getByText('ชื่อแบบประกัน').click();
              // await page.locator('#plan').click().then(() => page.waitForTimeout(500));
              // await page.selectOption('#plan', { label: plan });
              // await page.selectOption('#sMode', { label: 'รายปี' }); //เลือกวิธีชำระเบี้ยประกัน
              // // bug //

              // //กรอกรายละเอียดประกัน
              // await page.locator('#plan').click();
              // await page.locator('#plan').click();
              // // await page.locator('#plan').click().then(() => page.waitForTimeout(5000));

              // รอข้อมูลแบบประกันโหลดเสร็จ
              const [response_select_plan] = await Promise.all([
                page.waitForResponse(res =>
                  res.url().includes('/nbsweb/secure/combine2/newcaseshortly/ord/record/checkPlanWarningMessage.html') && res.status() === 200
                ),
                //ใส่ตัวแทน
                await page.selectOption('#plan', { label: plan })
              ]);

              // await page.waitForTimeout(2000); //รอให้ข้อมูลแบบประกันโหลดเสร็จสมบูรณ์
              await page.getByRole('button', { name: 'ป้อนทุนประกัน' }).click();
              await page.locator('#popUpCapital').fill('');
              await page.locator('#popUpCapital').fill(capital).then(() => page.waitForTimeout(600)); //ใส่ทุนประกัน
              // await page.pause();
              await page.getByRole('button', { name: 'ยืนยัน' }).click();

              check_select_plan = await page.locator('#plan option:checked').textContent();

              // console.log('check_select_plan :', check_select_plan);
            }
            await page.selectOption('#sMode', { label: sMode }); //เลือกวิธีชำระเบี้ยประกัน

            // กรอกข้อมูล Rider
            const numOfRider = parseInt(NumOfRider);
            // แยกข้อมูลชื่อ Rider และ ทุนประกันของ Rider ออกมาเป็น array โดยใช้เครื่องหมาย | เป็นตัวคั่น
            const arr_namerider = namerider.split("|").map(s => s.trim()).filter(s => s !== "");;
            // แยกข้อมูลทุนประกันของ Rider ออกมาเป็น array โดยใช้เครื่องหมาย | เป็นตัวคั่น
            const arr_capitalrider = capitalrider.split("|").map(s => s.trim()).filter(s => s !== "");;
            if (numOfRider > 0) {
              for (let i = 0; i < numOfRider; i++) {
                await page.locator('#bAdditionalContract').click();
                await page.selectOption('#additionalContract', { label: arr_namerider[i] });
                await page.selectOption('#additionalSumAssure', { value: arr_capitalrider[i] });
                await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
              }
            }

            // วิธีการชำระ
            if (ownpay === 'ชำระเอง') {
              await page.locator('#benefOwnPay1').click();
            } else {
              await page.locator('#benefOwnPay3').click();
              await page.selectOption('#benefPayTitle', { label: ownpay_title }); //เลือกคำนำหน้าผู้ชำระเบี้ยประกันภัย
              await page.locator('#benefPayName').click();
              await page.locator('#benefPayName').fill(ownpay_name).then(() => page.waitForTimeout(300)); //ใส่ชื่อผู้ชำระเบี้ยประกันภัย
              await page.locator('#benefPaySurname').click();
              await page.locator('#benefPaySurname').fill(ownpay_surname).then(() => page.waitForTimeout(300)); //ใส่นามสกุลผู้ชำระเบี้ยประกันภัย
              await page.locator('#benefPayAge').click();
              await page.locator('#benefPayAge').fill(ownpay_age.toString()).then(() => page.waitForTimeout(300)); //ใส่อายุผู้ชำระเบี้ยประกันภัย
              console.log('ownpay_relation :', ownpay_relation);
              await page.selectOption('#benefPayRelation', { label: ownpay_relation }); //เลือกความสัมพันธ์ของผู้ชำระเบี้ยประกันภัยกับผู้เอาประกัน
              await page.selectOption('#benefPayCardType', { label: ownpay_cardtype }); //เลือกประเภทบัตรของผู้ชำระเบี้ยประกันภัย
              await page.locator('#benefPayCardNumber').click();
              await page.locator('#benefPayCardNumber').fill(ownpay_cardnumber).then(() => page.waitForTimeout(300)); //ใส่เลขบัตรของผู้ชำระเบี้ยประกันภัย
            }

            //ผู้รับผลประโยชน์
            await page.locator('#i06Yes').click();

            const NumOfBenef = parseInt(NumOfbenef);
            for (let i = 0; i < NumOfBenef; i++) {
              await page.selectOption('#titleBeneficiary', { label: data[`คำนำหน้าผรป_${i + 1}`] }); //เลือกคำนำหน้าชื่อ
              await page.locator('#nameBeneficiary').click();
              await page.locator('#nameBeneficiary').fill(data[`ชื่อผรป_${i + 1}`]); //ใส่ชื่อผู้รับผลประโยชน์
              await page.locator('#surnameBeneficiary').click();
              await page.locator('#surnameBeneficiary').fill(data[`นามสกุลผรป_${i + 1}`]); //ใส่นามสกุลผู้รับผลประโยชน์
              await page.selectOption('#relationBeneficiary', { label: data[`ความสัมพันธ์ผรป_${i + 1}`] }); //เลือกความสัมพันธ์
              await page.locator('#ageBeneficiary').click();
              await page.locator('#ageBeneficiary').fill(data[`อายุผรป_${i + 1}`]); //ใส่อายุผู้รับผลประโยชน์
              await page.locator('#avgBeneficiary').click();
              await page.selectOption('#listBenefAddress', { label: 'ที่อยู่เดียวกันกับ ที่อยู่ที่ติดต่อผู้เอาประกัน' }); //เลือกที่อยู่ผู้รับผลประโยชน์
              await page.locator('#bAddBenef').click();
              // await page.pause();
            }

            //อื่นๆ
            try {
              const ladyBtn = page.locator('#flagHealthLadyNo');
              await Promise.race([
                ladyBtn.click({ timeout: 1000 }),
                page.waitForTimeout(1000) // กันกรณีปุ่มไม่โผล่
              ]);
            } catch (e) {
              // console.log(`Exception while doing something: ${e}`);
            }

            await page.locator('#i7No').click();
            await page.locator('#i8No').click();

            await page.locator('#height').click();
            await page.locator('#height').fill(height.toString()); //ใส่ส่วนสูง
            await page.locator('#weight').click();
            await page.locator('#weight').fill(weight.toString()); //ใส่น้ำหนัก
            if (change_weight_6_month === 'ไม่เปลี่ยน') {
              await page.locator('#i9No').click();
            } else {
              await page.locator('#i9Yes').click();
            }
            await page.locator('#i10No').click();
            await page.locator('#i1113No').click();
            await page.locator('#i13No').click();
            await page.locator('#flagHealthDoctorNo').click();
            await page.locator('#flagHealthSymptomNo').click();
            await page.locator('#i17No').click();
            await page.locator('#i18No').click();
            await page.locator('#fatcaNo').click();

            if (age < 21) {
              await page.locator('#marketingConsentTitleName').click();
              await page.selectOption('#marketingConsentTitleName', { label: 'นาย' });
              await page.locator('#marketingConsentName').click();
              await page.locator('#marketingConsentName').fill('ปั้มเคส');
              await page.locator('#marketingConsentSname').click();
              await page.locator('#marketingConsentSname').fill('โดยออโต้เมท');
              await page.locator('#marketingConsentNo').click();
            }
            else {
              await page.locator('#marketingConsentNo').click();
            }
            await page.locator('#taxDiscloseStatusNo').click();
            await page.locator('#crsTaxResidenceFlagY').click();
            await page.waitForTimeout(2000);
            await page.getByRole('button', { name: 'บันทึก' }).click();

            //---------------------------------------------- เชคUW --------------------------------------------------
            await Promise.race([
              page.waitForSelector('#fullSummary-panel #oMainInfo', { timeout: 120000 }),
              page.waitForSelector('#summary-panel #oMainInfo', { timeout: 120000 })
            ]);

            // console.log('oMainInfo visible:', await page.locator('#fullSummary-panel #oMainInfo').isVisible());
            // console.log('summary-pane visible:', await page.locator('#summary-panel #oMainInfo').isVisible());

            let allText = '';

            if (await page.locator('#fullSummary-panel #oMainInfo').isVisible()) {
              const divLocator = page.locator('#fullSummary-panel #oMainInfo div').filter({
                hasText: /^ใบคำขอฯเลขที่/
              });
              const divText = await divLocator.first().innerText();

              const tableTextArr = await page.locator('#fullSummary-panel #oMainInfo .summary-content table td').allTextContents();
              const tableText = tableTextArr.join('\n');
              allText = `${divText}\n${tableText}`;

              const page1Promise = page.waitForEvent('popup');
              await page.getByRole('button', { name: 'ยืนยัน' }).click();
              await page.pause();
              const page1 = await page1Promise;

              const pages = page.context().pages();

              // รอทุก tab (ยกเว้น tab หลัก) โหลดเสร็จ
              await Promise.all(
                pages
                  .filter(p => p !== page)
                  .map(p => p.waitForLoadState('networkidle'))
              );
              // แล้วค่อยปิด
              await Promise.all(
                pages
                  .filter(p => p !== page && !p.isClosed())
                  .map(p => p.close())
              );

            } else if (await page.locator('#summary-panel #oMainInfo').isVisible()) {
              const divText = await page.locator('#summary-panel #oMainInfo div').first().innerText();
              const tableTextArr = await page.locator('#summary-panel #oMainInfo .summary-content table td').allTextContents();
              const tableText = tableTextArr.join('\n');
              allText = `${divText}\n${tableText}`;
              await page.getByRole('button', { name: 'ยืนยัน' }).click();
              await page.pause();
            }

            console.log('All summary text:', allText);
            data.program_output = allText;
            //------------------------------------------------------------------------------------------------------

            //---------------------------- เชคแบบประกัน == ใบคำขอ ---------------------------------------------------
            try {
              const closeButton = await page.locator('button', { hasText: 'ปิด' }).first().waitFor({ timeout: 5000 });
              await closeButton.click();
            } catch (error) {
              // console.log(error);
            }

            await page.waitForTimeout(1000);
            const expectedRequestId = requestId;
            const expectedCell6 = plan;

            // ดึง rows ทั้งหมดใน table
            const rows = await page.locator('#newcaseshortly-list-bd table tr').all();

            let found = false;

            for (const row of rows) {
              const cells = await row.locator('td').allTextContents();
              if (cells[0] === expectedRequestId) {
                const normalizedCellText = cells[5].replace(/[:\s]/g, '');
                const normalizedExpected = expectedCell6.replace(/[:\s]/g, '');
                // console.log('normalizedCellText :', normalizedCellText)
                // console.log('normalizedExpected :', normalizedExpected)
                expect(normalizedCellText).toContain(normalizedExpected);
                found = true;
                // console.log('Matched row:', cells);
                break;
              }
            }

            if (!found) {
              throw new Error(`ไม่พบ row ที่มีเลขใบคำขอ ${expectedRequestId}`);
            }
            //------------------------------------------------------------------------------------------------------

            console.log('ทำการกรอกข้อมูลเคสใหม่ เรียบร้อยแล้ว');
          });

          // จะได้เลข รับฝากเคส จาก Step 3
          await test.step('Step 3 - บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ) - ปริ้นใบรับฝากเคส', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ) - ปริ้นใบรับฝากเคส
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            if (system === 'UAT') {
              await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
            }
            else {
              await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
            }

            //เข้าเมนู
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)' }).click().then(await page.waitForTimeout(1000));
            await page.waitForLoadState('networkidle');

            console.log('\nเริ่มทำการพิมพ์ใบรับฝากเคส ที่ No:', row_uniquekey);

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_newcase_1] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/combine2/newcaseshortly/ord/record/list.html') && res.status() === 200
              ),
              //ใส่ตัวแทน
              await page.locator('#agent-code-name').fill(agentCode), //ใส่ agent code
              await page.getByRole('option', { name: agentName }).click() //เลือก agent name
            ]);

            // ปิด tab ใหม่ที่เปิดขึ้นมา
            const [newPage] = await Promise.all([
              page.context().waitForEvent('page'),  // รอให้มี tab ใหม่
              //พิมพ์ใบรับฝากเคส
              page.locator('#bPrint').click()
            ]);
            // รอให้โหลดเสร็จ
            if (system === 'UAT') {
              await newPage.waitForURL('**://uatnbs.thaisamut.co.th/**');
            } else {
              await newPage.waitForURL('**://sitnbs.thaisamut.co.th/**');
            }

            // // รอให้โหลดเสร็จ
            // await newPage.waitForLoadState('networkidle');

            // // รอ URL เป็น .html (หรือจะเอาออกก็ได้)
            // await newPage.waitForURL(/\.html/i);

            // const url = newPage.url();
            // console.log('HTML URL:', url);

            // // 👉 ดึง text ทั้งหน้า
            // const text = await newPage.locator('body').innerText();

            // console.log('----- PAGE TEXT -----');
            // console.log(text);

            // // หาเลขที่
            // const matches = [...text.matchAll(/เลขที่ใบรับฝากเคส\s*[\r\n\s]*?(\d{6,})/g)];
            // const numbers = matches.map(m => m[1]);

            // const uniqueNumbers = [...new Set(numbers)];
            // const documentNo = uniqueNumbers.join('\n');

            // console.log('เลขที่:', documentNo);

            // ==============================
            // รอ URL เป็น .html
            // ==============================
            await newPage.waitForURL(/\.html/i, {
              timeout: 15000
            });

            // ==============================
            // ดึง URL
            // ==============================
            const currentUrl = newPage.url();

            console.log('HTML URL:', currentUrl);

            // ==============================
            // ดึง depositNo
            // ==============================
            const urlObj = new URL(currentUrl);

            let documentNo = urlObj.searchParams.get('params.depositIds');

            // เติม 0 ด้านหน้าให้ครบ 8 หลัก
            documentNo = documentNo.padStart(8, '0');

            console.log('เลขที่:', documentNo);

            // ปิด tab
            await newPage.close();

            // อัพเดท Status เป็น Done
            data_create.push({ [uniquekey]: row_uniquekey, ["เลขรับฝาก"]: documentNo });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

            console.log('ทำการพิมพ์ใบรับฝากเคส ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          await test.step('Step 4 - ส่งข้อมูลใบคำขอ', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // ส่งข้อมูลใบคำขอ
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            // //ส่งข้อมูลใบคำขอ
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'ส่งข้อมูลใบคำขอฯ' }).click().then(await page.waitForTimeout(1000));
            await page.waitForLoadState('networkidle');
            await page.selectOption('#pdGroupCode', { label: '1 : สามัญ' });
            await page.waitForLoadState('networkidle');
            await page.locator('#requestNo').fill(requestId);
            await page.waitForTimeout(1000);

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_requestno_otherbranch_new] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/combine2/newcaseshortly/data/transmission/list.html') && res.status() === 200
              ),
              await page.locator('#oSearch').click()
            ]);

            console.log('\nเริ่มทำการส่งข้อมูลใบคำขอ ที่ No:', row_uniquekey);

            await page.locator('div.yui3-datatable-scroll-liner', { hasText: 'ทั้งหมด' }).locator('input[type="checkbox"]').click();
            await page.locator('#oSendData').click();
            await page.waitForTimeout(2000);
            await page.locator('.yui3-widget-buttons').getByRole('button', { name: 'ส่ง' }).click();
            await page.pause();
            await page.getByRole('button', { name: 'ปิดหน้าจอ' }).click();

            console.log('ทำการส่งข้อมูลใบคำขอ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          await test.step('Step 5 - จัดการข้อมูลเคสใหม่สามัญ', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // จัดการข้อมูลเคสใหม่สามัญ
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            // //จัดการข้อมูลเคสใหม่สามัญ
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่สามัญ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการรายการเคสใหม่ ต่างสาขา' }).click();
            await page.waitForLoadState('networkidle');
            await page.locator('#requestIdCriteria').fill(requestId);

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_newcase_otherbranch_new] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/combine2/newcaseord/record/list.html') && res.status() === 200
              ),
              await page.locator('#bSearch').click()
            ]);

            console.log('\nเริ่มทำการกรอกข้อมูลเคสใหม่สามัญ ที่ No:', row_uniquekey);

            await page.locator(`td:has-text("${requestId}")`).click();
            // กรอกข้อมูลสถานภาพสมรส
            await page.selectOption('#marryStatus', { label: marital_status });
            if (marital_status === 'สมรส') {
              await page.selectOption('#titleMate', { label: marital_title }); //เลือกสถานภาพสมรส
              await page.locator('#nameMate').fill(marital_name).then(() => page.waitForTimeout(600)); // ใส่ชื่อคู่สมรส
              await page.locator('#surnameMate').fill(marital_surname).then(() => page.waitForTimeout(600)); // ใส่นามสกุลคู่สมรส
            }
            // กรอกข้อมูลที่อยู่สำหรับส่งเอกสาร
            if (send_document_address_type === 'ที่อยู่ตามทะเบียนบ้าน') {
              await page.locator('#rAddress').click();

              // กรอก ที่อยู่ปัจจุบัน
              if (send_document_current_address_type === 'โปรดระบุ') {
                await page.locator('#listCusCurrentAddress').click();
                await page.selectOption('#listCusCurrentAddress', { label: send_document_current_address_type }); //เลือกที่อยู่ที่ต้องการให้ส่งเอกสารไป
                await page.locator('#curHomeNo').click();
                await page.locator('#curHomeNo').fill(send_document_current_address_home_no).then(() => page.waitForTimeout(300)); //บ้านเลขที่
                await page.locator('#curBuilding').click();
                await page.locator('#curBuilding').fill(send_document_current_address_village).then(() => page.waitForTimeout(300)); //หมู่บ้าน/อาคาร
                await page.locator('#curMoo').click();
                await page.locator('#curMoo').fill(send_document_current_address_moo).then(() => page.waitForTimeout(300)); //หมู่ที่
                await page.locator('#curSoi').click();
                await page.locator('#curSoi').fill(send_document_current_address_soi).then(() => page.waitForTimeout(300)); //ซอย
                await page.locator('#curStreet').click();
                await page.locator('#curStreet').fill(send_document_current_address_road).then(() => page.waitForTimeout(300)); //ถนน
                await page.selectOption('#curProvince', { label: send_document_current_address_province }); //เลือกจังหวัด
                await page.selectOption('#curDistrict', { label: send_document_current_address_district }); //เลือกอำเภอ
                //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
                const option = page.locator('#curSubdistrict option', {
                  hasText: send_document_current_address_subdistrict
                }).first();
                const value = await option.getAttribute('value');
                await page.selectOption('#curSubdistrict', value);
              } else {
                await page.locator('#listCusCurrentAddress').click();
                await page.selectOption('#listCusCurrentAddress', { label: send_document_current_address_type }); //เลือกที่อยู่ที่ต้องการให้ส่งเอกสารไป
              }
            } else if (send_document_address_type === 'ที่อยู่ปัจจุบัน') {
              await page.locator('#rAddressCur').click();

              // กรอก ที่อยู่ทะเบียนบ้าน
              await page.locator('#homeNo').click();
              await page.locator('#homeNo').fill(homeno_customer); //บ้านเลขที่
              await page.waitForTimeout(300);
              await page.locator('#building').click();
              await page.locator('#building').fill(village_customer); //หมู่บ้าน/อาคาร
              await page.waitForTimeout(300);
              await page.locator('#moo').click();
              await page.locator('#moo').fill(moo_customer); //หมู่ที่
              await page.waitForTimeout(300);
              await page.locator('#soi').click();
              await page.locator('#soi').fill(soi_customer); //ซอย
              await page.waitForTimeout(300);
              await page.locator('#street').click();
              await page.locator('#street').fill(road_customer); //ถนน
              await page.waitForTimeout(300);
              await page.selectOption('#province', { label: province_customer }); //เลือกจังหวัด
              await page.selectOption('#district', { label: district_customer }); //เลือกอำเภอ
              //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
              const option = page.locator('#subdistrict option', {
                hasText: subdistrict_customer
              }).first();
              const value = await option.getAttribute('value');
              await page.selectOption('#subdistrict', value);
            } else if (send_document_address_type === 'สถานที่ทำงาน/สถานศึกษา') {
              await page.locator('#rAddressWork').click();

              // กรอก ที่อยู่ทะเบียนบ้าน
              await page.locator('#homeNo').click();
              await page.locator('#homeNo').fill(homeno_customer); //บ้านเลขที่
              await page.waitForTimeout(300);
              await page.locator('#building').click();
              await page.locator('#building').fill(village_customer); //หมู่บ้าน/อาคาร
              await page.waitForTimeout(300);
              await page.locator('#moo').click();
              await page.locator('#moo').fill(moo_customer); //หมู่ที่
              await page.waitForTimeout(300);
              await page.locator('#soi').click();
              await page.locator('#soi').fill(soi_customer); //ซอย
              await page.waitForTimeout(300);
              await page.locator('#street').click();
              await page.locator('#street').fill(road_customer); //ถนน
              await page.waitForTimeout(300);
              await page.selectOption('#province', { label: province_customer }); //เลือกจังหวัด
              await page.selectOption('#district', { label: district_customer }); //เลือกอำเภอ
              //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
              const option = page.locator('#subdistrict option', {
                hasText: subdistrict_customer
              }).first();
              const value = await option.getAttribute('value');
              await page.selectOption('#subdistrict', value);

              // กรอก ที่อยู่ปัจจุบัน
              if (send_document_current_address_type === 'โปรดระบุ') {
                await page.locator('#listCusCurrentAddress').click();
                await page.selectOption('#listCusCurrentAddress', { label: send_document_current_address_type }); //เลือกที่อยู่ที่ต้องการให้ส่งเอกสารไป
                await page.locator('#curHomeNo').click();
                await page.locator('#curHomeNo').fill(send_document_current_address_home_no).then(() => page.waitForTimeout(300)); //บ้านเลขที่
                await page.locator('#curBuilding').click();
                await page.locator('#curBuilding').fill(send_document_current_address_village).then(() => page.waitForTimeout(300)); //หมู่บ้าน/อาคาร
                await page.locator('#curMoo').click();
                await page.locator('#curMoo').fill(send_document_current_address_moo).then(() => page.waitForTimeout(300)); //หมู่ที่
                await page.locator('#curSoi').click();
                await page.locator('#curSoi').fill(send_document_current_address_soi).then(() => page.waitForTimeout(300)); //ซอย
                await page.locator('#curStreet').click();
                await page.locator('#curStreet').fill(send_document_current_address_road).then(() => page.waitForTimeout(300)); //ถนน
                await page.selectOption('#curProvince', { label: send_document_current_address_province }); //เลือกจังหวัด
                await page.selectOption('#curDistrict', { label: send_document_current_address_district }); //เลือกอำเภอ
                //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
                const option = page.locator('#curSubdistrict option', {
                  hasText: send_document_current_address_subdistrict
                }).first();
                const value = await option.getAttribute('value');
                await page.selectOption('#curSubdistrict', value);
              } else {
                await page.locator('#listCusCurrentAddress').click();
                await page.selectOption('#listCusCurrentAddress', { label: send_document_current_address_type }); //เลือกที่อยู่ที่ต้องการให้ส่งเอกสารไป
              }

              const select_type_work_address_enabled = await page.locator('#listCusWorkAddress').isEnabled();
              if (select_type_work_address_enabled) {
                await page.selectOption('#listCusWorkAddress', { label: send_document_work_address_type }); //เลือกประเภทที่อยู่สถานที่ทำงาน/สถานศึกษา
                // กรอก ที่อยู่สถานที่ทำงาน/สถานศึกษา
                await page.locator('#workName').click();
                await page.locator('#workName').fill(send_document_work_address_name).then(() => page.waitForTimeout(300)); //ใส่ชื่อสถานที่ทำงาน/สถานศึกษา
                await page.locator('#workNo').click();
                await page.locator('#workNo').fill(send_document_work_address_home_no).then(() => page.waitForTimeout(300)); //บ้านเลขที่
                await page.locator('#workBuilding').click();
                await page.locator('#workBuilding').fill(send_document_work_address_village).then(() => page.waitForTimeout(300)); //หมู่บ้าน/อาคาร
                await page.locator('#workMoo').click();
                await page.locator('#workMoo').fill(send_document_work_address_moo).then(() => page.waitForTimeout(300)); //หมู่ที่
                await page.locator('#workSoi').click();
                await page.locator('#workSoi').fill(send_document_work_address_soi).then(() => page.waitForTimeout(300)); //ซอย
                await page.locator('#workStreet').click();
                await page.locator('#workStreet').fill(send_document_work_address_road).then(() => page.waitForTimeout(300)); //ถนน
                await page.selectOption('#workProvince', { label: send_document_work_address_province }); //เลือกจังหวัด
                await page.selectOption('#workDistrict', { label: send_document_work_address_district }); //เลือกอำเภอ
                //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
                const option = page.locator('#workSubdistrict option', {
                  hasText: send_document_work_address_subdistrict
                }).first();
                const value = await option.getAttribute('value');
                await page.selectOption('#workSubdistrict', value);
              } else {
                // กรอก ที่อยู่สถานที่ทำงาน/สถานศึกษา
                await page.locator('#workName').click();
                await page.locator('#workName').fill(send_document_work_address_name).then(() => page.waitForTimeout(300)); //ใส่ชื่อสถานที่ทำงาน/สถานศึกษา
              }

            }

            // กรอกตำแหน่ง
            await page.locator('#position').fill('พนักงานทั่วไป').then(() => page.waitForTimeout(300));
            // กรอกข้อมูลรายได้ต่อปี
            await page.locator('#salaryPerYear').fill(salaryPerYear).then(() => page.waitForTimeout(300)); //ใส่รายได้ต่อปี

            await page.getByRole('tab', { name: 'แบบประกัน' }).click();
            const totalPremiumText = await page.locator('#totalPremium').innerText();

            await page.locator('td', { hasText: '5.2 ช่องทางการชำระเงิน' }).locator('td', { hasText: payTypeBank }).locator('input[type="radio"]').check();
            // await page.locator('#payTypeBank').click();

            await page.locator('#cReturnPost').click();
            await page.locator('#receivePolicyMethodPaper').click();
            await page.selectOption('#receivePolicyCodePdpa', { label: 'ส่งตรงลูกค้า' });
            await page.locator('#receiveDocumentMethodPaper').click();

            await page.getByRole('tab', { name: 'คำแถลงสุขภาพ' }).click();
            await page.locator('#crsCityOfBirth').fill('กทม.');

            //เลือกเอกสารประกอบการขอเอาประกัน
            await page.getByRole('tab', { name: 'เอกสารประกอบการขอเอาประกัน' }).click();
            const redSpans = page.locator('span.text-red');
            const count = await redSpans.count();

            for (let i = 0; i < count; i++) {
              const span = redSpans.nth(i);
              const checkbox = span.locator('xpath=preceding-sibling::input[@type="checkbox"][1]');

              if (await checkbox.isVisible()) {
                await checkbox.check();
              }
            }
            //เลือกเอกสารประกอบการขอเอาประกัน

            await page.getByRole('tab', { name: 'ใบรับเงินชั่วคราว' }).click();
            // //xpath ของ ใบรับเงินชั่วคราว
            // const inputXpathTr = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[1]/td[2]/input';
            // const inputFieldTr = page.locator(`xpath=${inputXpathTr}`);
            // await inputFieldTr.fill(temporaryReceipt); //ใส่เลขที่ใบรับเงินชั่วคราว
            await page.locator('tr', { hasText: 'เลขที่ใบรับเงินชั่วคราว' }).locator('td > input[type="text"]').fill(temporaryReceipt);  //ใส่เลขที่ใบรับเงินชั่วคราว

            // const inputNameBank = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[16]/td[2]/select';
            // const inputFieldBank = page.locator(`xpath=${inputNameBank}`);
            // await inputFieldBank.selectOption({ label: '002 BBL : ธนาคารกรุงเทพ จำกัด (มหาชน)' });
            await page.locator('tr', { hasText: 'ธนาคาร:' }).locator('td > select').nth(1).selectOption({ label: '002 BBL : ธนาคารกรุงเทพ จำกัด (มหาชน)' });  // เลือกธนาคารที่ใช้ชำระเงิน

            // const inputBranch = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[16]/td[2]/input';
            // const inputFieldBranch = page.locator(`xpath=${inputBranch}`);
            // await inputFieldBranch.fill('สนง.');
            await page.locator('tr', { hasText: 'สาขา:' }).locator('td > input[type="text"]').nth(1).fill('สนง.');  // ใส่สาขาธนาคารที่ใช้ชำระเงิน

            // const inputCusNameBank = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[17]/td[2]/input[1]';
            // const inputFieldCusNameBank = page.locator(`xpath=${inputCusNameBank}`);
            // await inputFieldCusNameBank.fill('เทสเทสโดยออโต้เมท'); //ใส่ชื่อผู้ฝากเงิน
            await page.locator('#newcase-panel').locator('tr', { hasText: 'ชื่อบัญชี' }).locator('td[style="result-nowrap"] > input[type="text"]').nth(0).fill('เทสเทสโดยออโต้เมท'); //ใส่ชื่อผู้ฝากเงิน

            const allowedStartDigits = ['5', '6', '8'];
            const startDigit = allowedStartDigits[Math.floor(Math.random() * allowedStartDigits.length)];
            const remainingDigits = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
            const bankAccountNumber = startDigit + remainingDigits;

            // const inputBankNum = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[17]/td[2]/input[2]';
            // const inputFieldBankNum = page.locator(`xpath=${inputBankNum}`);
            // await inputFieldBankNum.fill(bankAccountNumber); //ใส่เลขบัญชีธนาคาร
            await page.locator('#newcase-panel').locator('tr', { hasText: 'ชื่อบัญชี' }).locator('td[style="result-nowrap"] > input[type="text"]').nth(1).fill(bankAccountNumber); //ใส่เลขบัญชีธนาคาร

            // const inputPremium = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[18]/td[2]/input';
            // const inputFieldPremium = page.locator(`xpath=${inputPremium}`);
            // await inputFieldPremium.click();
            // await inputFieldPremium.fill('');
            // await inputFieldPremium.fill(totalPremiumText);
            await page.locator('#newcase-panel').locator('tr', { hasText: 'จำนวน:' }).locator('td[style="result-nowrap"] > input[type="text"]').nth(4).fill(totalPremiumText); //ใส่เลขบัญชีธนาคาร

            await page.pause();
            await page.getByRole('button', { name: 'บันทึก' }).click();
            await page.getByRole('button', { name: 'ยืนยัน' }).click();

            // ปิด tab ใหม่ที่เปิดขึ้นมา
            const [newPage_1] = await Promise.all([
              page.context().waitForEvent('page'),  // รอให้มี tab ใหม่
              //พิมพ์ใบสรุป
              await page.locator(`td:has-text("พิมพ์ใบสรุป")`).click()
            ]);
            // รอให้โหลดเสร็จ
            if (system === 'UAT') {
              await newPage_1.waitForURL('**://uatnbs.thaisamut.co.th/**');
            } else {
              await newPage_1.waitForURL('**://sitnbs.thaisamut.co.th/**');
            }
            await newPage_1.waitForLoadState('networkidle');
            // ปิด tab
            await newPage_1.close();

            await page.waitForTimeout(5000);
            await page.getByRole('link', { name: 'พิจารณา' }).click();
            await page.getByRole('button', { name: 'ตกลง' }).click();
            await page.getByRole('button', { name: 'ปิด' }).click();

            console.log('ทำการกรอกข้อมูลเคสใหม่สามัญ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          let policyNo;

          await test.step('Step 6 - แสดงสถานะใบคำขอ/กรมธรรม์ ต่างสาขา', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // แสดงสถานะใบคำขอ/กรมธรรม์ ต่างสาขา
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่สามัญ' }).click();
            await page.getByRole('menuitem', { name: 'แสดงสถานะใบคำขอ/กรมธรรม์ ต่างสาขา' }).click();
            await page.selectOption('#criteriaType', { label: 'ใบคำขอ' });

            console.log('\nเริ่มทำการตรวจสอบสถานะใบคำขอ/กรมธรรม์ ที่ No:', row_uniquekey);

            await page.locator('#requestNoCriteria').fill(requestId);
            await page.waitForTimeout(1000);
            await page.locator('#bSearchSearch').click();
            policyNo = await page.locator('td.yui3-datatable-col-policyNo').first().innerText(); //เอาเลขกรมธรรม์จากตาราง
            console.log('เลขกรมธรรม์:', policyNo);

            console.log('ทำการตรวจสอบสถานะใบคำขอ/กรมธรรม์ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          })

          // รอแก้ดึงเลขที่ใบเสร็จ
          await test.step('Step 7 - ตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์ ต่างสาขา', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // ตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์ ต่างสาขา
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่สามัญ' }).click();
            await page.getByRole('menuitem', { name: 'ตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์ ต่างสาขา' }).click();

            console.log('\nเริ่มทำการตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์ ที่ No:', row_uniquekey);

            await page.locator('#policyNoCriteria').fill(policyNo);
            await page.waitForTimeout(1000);
            await page.locator('#bSearchPrintPolicy').click();
            await page.getByRole('link', { name: 'เลือก' }).click();
            await page.getByRole('button', { name: 'ตรวจสอบกรมธรรม์' }).click();
            await page.getByRole('button', { name: 'บันทึกข้อมูลผู้ตรวจสอบความถูกต้องของกรมธรรม์' }).click();
            await page.selectOption('#approveBySel', { label: username });
            await page.selectOption('#approveBySameRemarkValue', { label: 'ประชุม' });
            await page.getByRole('button', { name: 'ยืนยันข้อมูลกรมธรรม์และข้อมูลใบเสร็จ' }).click();
            await expect(page.locator('#stockSlipNoPanel')).toBeVisible();
            const slipno = await page.locator('#oSlipNo').inputValue();
            // console.log(slipno)

            // อัพเดท Status เป็น Done
            data_create.push({ [uniquekey]: row_uniquekey, ["เลขใบเสร็จ"]: slipno });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

            await page.getByRole('button', { name: 'ปิด' }).click();

            const printButtons = page.locator('#print-datatable button:has-text("พิมพ์")');
            const countprint = await printButtons.count();


            // for (let i = 0; i < countprint; i++) {
            //   await printButtons.nth(i).click();
            //   await page.waitForTimeout(1000);
            // }

            for (let i = 0; i < countprint; i++) {
              const [newPage_policy] = await Promise.all([
                page.context().waitForEvent('page'),      // รอ tab ใหม่
                printButtons.nth(i).click()               // 👈 ใช้ตัวที่เปิด tab
              ]);

              // รอให้โหลดเสร็จ
              if (system === 'UAT') {
                await newPage_policy.waitForURL('**://uatnbs.thaisamut.co.th/**');
              } else {
                await newPage_policy.waitForURL('**://sitnbs.thaisamut.co.th/**');
              }

              await newPage_policy.waitForLoadState('networkidle'); // รอให้โหลดเสร็จ

              console.log(`tab ${i}:`, newPage_policy.url());

              await newPage_policy.close();
            }

            try {
              const closeButton = await page.waitForSelector('#newcaseord-complete-print button', { timeout: 5000 });
              await closeButton.click();
              //console.log("คลิกปุ่ม 'ปิด' แล้ว");
            } catch (error) {
              //console.log("ไม่พบปุ่ม 'ปิด' ภายใน 5 วิ:", error);
            }

            console.log('ทำการตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          let documentNo_t;

          // สามารถเก็บเลขที่ใบนำส่งได้ และ เลขที่ใบเสร็จได้
          await test.step('Step 8 - พิมพ์ใบนำส่งเบี้ยประกัน ต่างสาขา', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // พิมพ์ใบนำส่งเบี้ยประกัน ต่างสาขา
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่สามัญ' }).click();
            await page.getByRole('menuitem', { name: 'พิมพ์ใบนำส่งเบี้ยประกัน ต่างสาขา' }).click();
            await page.waitForLoadState('networkidle');
            await page.selectOption('#branchListOwner', { value: username });

            console.log('\nเริ่มทำการพิมพ์ใบนำส่งเบี้ยประกัน ที่ No:', row_uniquekey);

            const agentInfo = `${agentCode}: ${agentName}`;
            await page.locator('#agentOwnerCase').fill(agentInfo).then(await page.waitForTimeout(1000)); //ใส่ข้อมูลตัวแทน
            await page.getByRole('option', { name: agentInfo }).click();
            await page.locator('#btShowPanelSummary').click();
            await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
            await page.waitForTimeout(10000);
            await page.getByRole('button', { name: 'ปิดหน้าจอ' }).waitFor({ state: 'visible' });

            const pages = page.context().pages();

            // // รอทุก tab (ยกเว้น tab หลัก) โหลดเสร็จ
            // await Promise.all(
            //   pages
            //     .filter(p => p !== page)
            //     .map(p => p.waitForLoadState('networkidle'))
            // );

            // // แล้วค่อยปิด
            // await Promise.all(
            //   pages
            //     .filter(p => p !== page && !p.isClosed())
            //     .map(p => p.close())
            // );

            const context = page.context();
            const mainPage = page; // ✅ ใช้ตัวเดียวไปเลย

            // รอ tab อื่นโหลดระดับหนึ่ง
            await Promise.all(
              context.pages()
                .filter(p => p !== mainPage)
                .map(p => p.waitForLoadState('domcontentloaded'))
            );

            // loop แบบไม่ใช้ snapshot เก่า
            for (const p of context.pages()) {
              if (p === mainPage || p.isClosed()) continue;

              try {
                // รอ redirect เป็น PDF
                await p.waitForURL(/\.pdf/i, { timeout: 10000 });

                const pdfUrl = p.url();
                console.log('PDF URL:', pdfUrl);

                const response = await context.request.get(pdfUrl, {
                  ignoreHTTPSErrors: true
                });

                const buffer = await response.body();
                const data = await pdfParse(buffer);

                const lines = data.text.split(/\r?\n/);
                documentNo_t = lines[10]?.trim();

                console.log('เลขที่:', documentNo_t);

                await p.close();

              } catch (e) {
                console.log('skip tab:', e.message);
              }
            }

            //ตารางว่าเข้า AS400 ไหม
            const totalItems = await page.locator('#resultAllDataAmount').textContent();
            const successCount = await page.locator('#resultSuccessAmount').textContent();
            const failCount = await page.locator('#resultFailAmount').textContent();
            const as400SuccessCount = await page.locator('#resultAs400SuccessAmount').textContent();
            const as400FailCount = await page.locator('#resultAs400FailAmount').textContent();
            const allFailCount = await page.locator('#resultAllFailDataAmount').textContent();

            console.log(`
                      ============================================
                                    สรุปผลการนำส่งเบี้ยประกัน
                      ============================================
                      รายการทั้งหมดที่พิมพ์ใบนำส่ง: ${totalItems} รายการ

                      --------------------------------------------
                      สถานะการพิมพ์ใบนำส่ง:
                        ✓ สำเร็จ: ${successCount} รายการ
                        ✗ ไม่สำเร็จ: ${failCount} รายการ

                      --------------------------------------------
                      สถานะการส่งเข้า AS/400:
                        ✓ สำเร็จ: ${as400SuccessCount} รายการ
                        ✗ ไม่สำเร็จ: ${as400FailCount} รายการ

                      ============================================
                      รวมรายการไม่สำเร็จทั้งหมด: ${allFailCount} รายการ
                      ============================================
          `);
            await page.screenshot({ path: 'test-results/Test.png', fullPage: true });
            const failedAS400 = parseInt(as400FailCount);
            const failedPrint = parseInt(failCount);

            if (failedAS400 > 0) {
              await page.screenshot({ path: 'test-results/FailedAS400.png', fullPage: true });
            }

            if (failedPrint > 0) {
              await page.screenshot({ path: 'test-results/FailedPrint.png', fullPage: true });
            }
            await page.getByRole('button', { name: 'ปิดหน้าจอ' }).click();  // แล้วค่อยคลิก

            const status = (parseInt(allFailCount) === 0) ? 'ผ่าน✅' : 'ไม่ผ่าน❌';
            console.log(`ใบคำขอ : ${requestId},เลขกธ. : ${policyNo} ==> สถานะ ${status}`);
            Result.push(`ใบคำขอ : ${requestId},เลขกธ. : ${policyNo} ==> สถานะ ${status}`);
            console.log('Result Array:\n', Result);

            console.log('ทำการพิมพ์ใบนำส่งเบี้ยประกัน ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          await test.step('Step 9 - ลงผลลัพธ์ใน Google Sheet', async () => {
            // ดึงวันที่ แล้วแปลงเป็นรูปแบบ 2026-04-11 20:00:00
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const hours = String(currentDate.getHours()).padStart(2, '0');
            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
            const seconds = String(currentDate.getSeconds()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            // อัพเดท Status เป็น Done
            data_create.push({ [uniquekey]: row_uniquekey, ["Test Status"]: 'Done', Result: 'PASS', Remark: 'ทำสำเร็จเรียบร้อยแล้ว', ["Test Date"]: formattedDate, ["เลขกรมธรรม์"]: policyNo, ["เลขใบนำส่ง"]: documentNo_t });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];
          });
        } else if (typeplan === 'PA') {

          // เช็คว่ามีใบรับเงินชั่วคราวหรือยัง ถ้ายังไม่มีให้ทำ process ขอใบขอรับเงินชั่วคราว
          if (temporaryReceipt === '') {
            const tempno = await generateTempReceipt(page, {
              environment: system,
              branch: username,
              agentCode: agentCode
            });

            temporaryReceipt = tempno;

            // อัพเดท Status เป็น In Progress
            data_create.push({ [uniquekey]: row_uniquekey, ["เลขใบรับเงินชั่วคราว"]: tempno });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

          }

          if (system === 'UAT') {
            await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
          }
          else {
            await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
          }

          await test.step('Step 1 - Login เข้าสู่ระบบ', async () => {
            const check_logout = await page.locator('a', { hasText: 'ออกจากระบบ' }).isVisible()
            if (!check_logout) {

              // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
              // Login
              // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

              //login
              await page.locator('#username').click();
              await page.locator('#username').fill(username); //ใส่ username
              await page.locator('#password').click();
              await page.locator('#password').fill('1'); //ใส่ password
              await page.getByRole('button', { name: /login/i }).click();
              await page.waitForLoadState('networkidle'); // รอให้โหลดหน้าเสร็จสมบูรณ์

            }
          });

          await test.step('Step 2 - บันทึกเคสใหม่แบบย่อ (อุบัติเหตุธรรมดา)', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            console.log('\nเริ่มทำการคีย์ข้อมูลเคสใหม่แบบย่อ (อุบัติเหตุธรรมดา) ที่ No:', row_uniquekey);

            //เข้าเมนู
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click();
            await page.getByRole('menuitem', { name: 'บันทึกเคสใหม่แบบย่อ (อุบัติเหตุธรรมดา)' }).click();
            await page.waitForLoadState('networkidle');

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_newcase] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/iserve/newcaseshortly/pa/other/record/v2/list.html') && res.status() === 200
              ),
              //ใส่ตัวแทน
              await page.locator('#agent-code-name').fill(agentCode), //ใส่ agent code
              await page.getByRole('option', { name: agentName }).click() //เลือก agent name
            ]);

            if (customertype === 'ใหม่') {
              //เข้าเมนูเพิ่มเคสใหม่
              await page.locator('#bAddNew').click();
              await page.locator('#addCus').click();
            } else {

            }

            //เพิ่มข้อมูลลูกค้า
            if (cardtype === 'เลขประจำตัว 13 หลัก') {
              await page.selectOption('#cardCusType', { label: 'เลขประจำตัว 13 หลัก' }); //เลือกประเภทบัตร
            } else {
              await page.selectOption('#cardCusType', { label: 'หนังสือเดินทาง (passport)' }); //เลือกประเภทบัตร
            }
            await page.locator('#cardCusNumberAdd').click();
            await page.locator('#cardCusNumberAdd').fill(cardNumber); //ใส่เลขบัตรประจำตัวประชาชน
            await page.locator('#prefixCus').click();
            await page.locator('#prefixCus').fill(title); //ใส่คำนำหน้าชื่อ
            await page.waitForSelector(`li.yui3-aclist-item[data-text="${title}"]`);
            await page.locator(`li.yui3-aclist-item[data-text="${title}"]`).click();
            await page.locator('#nameCusAdd').click();
            await page.locator('#nameCusAdd').fill(name); //ใส่ชื่อ
            await page.locator('#surnameCusAdd').click();
            await page.locator('#surnameCusAdd').fill(surname); //ใส่นามสกุล
            await page.locator('#birthDateCus').click();
            const changeformatbirthdate = birthdate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$1$2$3'); //แปลงรูปแบบวันเกิดจาก dd/mm/yyyy เป็น ddmmyyyy
            await page.locator('#birthDateCus').fill(changeformatbirthdate); //วันเกิด ddmmyyyy

            if (gender_type === 'กรุณาระบุเพศ') {
              // เลือกเพศ
              if (gender === 'ชาย') {
                try {
                  const maleBtn = page.locator('#genderCusM');
                  await Promise.race([
                    maleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              } else if (gender === 'หญิง') {
                try {
                  const femaleBtn = page.locator('#genderCusF');
                  await Promise.race([
                    femaleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              }
            } else {
              // เลือกเพศ
              if (gender_type === 'ชาย') {
                try {
                  const maleBtn = page.locator('#genderCusM');
                  await Promise.race([
                    maleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              } else if (gender_type === 'หญิง') {
                try {
                  const femaleBtn = page.locator('#genderCusF');
                  await Promise.race([
                    femaleBtn.click({ timeout: 1000 }),
                    page.waitForTimeout(1000)
                  ]);
                } catch (e) {
                  // console.log(`Exception while doing something: ${e}`);
                }
              }
            }


            await page.locator('#surnameCusAdd').click();
            await page.locator('#confirmSelfie').click();
            await expect(page.getByRole('button', { name: 'ยืนยัน' })).toBeEnabled(); //ติ๊กถูกที่ช่องยืนยันข้อมูลถูกต้อง
            await page.getByRole('button', { name: 'ยืนยัน' }).click();

            console.log('เริ่มกรอกข้อมูลเคสใหม่')

            //ข้อมูลผู้เอาประกัน
            await page.locator('#requestNo').click();
            await page.locator('#requestNo').fill(requestId); //เลขที่คำขอ

            const today = new Date();
            const day = ("0" + today.getDate()).slice(-2);
            const month = ("0" + (today.getMonth() + 1)).slice(-2); // เดือนต้อง +1
            const yearBE = today.getFullYear() + 543;
            const DateFill = `${day}${month}${yearBE}`;
            const ExpireCardDate = DateFill + 5;

            await page.locator('#requestDateNbUwPdpa').click();
            await page.locator('#requestDateNbUwPdpa').fill(DateFill); //วันเขียนใบคำขอ
            await page.waitForTimeout(300);
            await page.locator('#high').fill(height); // กรอก ส่วนสูง
            await page.locator('#weight').fill(weight); // กรอก น้ำหนัก
            await page.locator('#cardExpiredDate').click();
            const changeformatexpiredate_card = expiredate_card.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$1$2$3'); //แปลงรูปแบบวันเกิดจาก dd/mm/yyyy เป็น ddmmyyyy
            await page.locator('#cardExpiredDate').fill(changeformatexpiredate_card); //วันบัตรหมดอายุ
            await page.waitForTimeout(300);


            await page.selectOption('#checkCard', { label: documenttype }); //เลือกประเภทเอกสาร

            await page.locator('#cusMobile').click();
            await page.locator('#cusMobile').fill(mobile); //เบอร์มือถือ
            await page.waitForTimeout(300);

            //ที่อยู่
            await page.selectOption('#provinceId', { label: province_customer }); //เลือกจังหวัด
            await page.selectOption('#districtId', { label: district_customer }); //เลือกอำเภอ

            //อาชีพ
            const occupation = `${codeoccupation} ${nameoccupation}`;
            await page.locator('#occupationListText').click(); //เลือกอาชีพ
            await page.locator('#occupationListText').fill(occupation).then(await page.waitForTimeout(500));
            await page.locator('li', { hasText: occupation }).click();
            // await page.locator('#rMotorcycleNotuse').click();

            //แบบประกัน
            await page.locator('#tempRecieptDate').fill(DateFill).then(await page.waitForTimeout(300)); // วันที่ใบรับเงินชั่วคราว

            // เลือกแบบประกัน
            const plan = `${nameplan} (${codeplan})`;
            await page.locator('#planMasterList').click().then(await page.waitForTimeout(300));
            // await page.locator('#planMasterList').click().then(await page.waitForTimeout(300));
            await page.selectOption('#planMasterList', { label: plan }); // เลือกแบบประกัน
            await page.selectOption('#sumIns', { label: capital }); // เลือกทุนประกัน

            // ประวัติสุขภาพ
            await page.locator('#insureCompanyAnswerN').click(); // ไม่เคย มีประกันชีวิตหรือประกันสุขภาพ

            // คำแถลง
            await page.locator('#choiceDoctorN').click(); // ไม่เคย มีคำแถลง

            // //ผู้รับผลประโยชน์
            // await page.locator('#i06Yes').click();

            const NumOfBenef = parseInt(NumOfbenef);
            for (let i = 0; i < NumOfBenef; i++) {
              await page.selectOption('#benTitle', { label: data[`คำนำหน้าผรป_${i + 1}`] }); //เลือกคำนำหน้าชื่อ
              await page.locator('#benName').click();
              await page.locator('#benName').fill(data[`ชื่อผรป_${i + 1}`]); //ใส่ชื่อผู้รับผลประโยชน์
              await page.locator('#benSurname').click();
              await page.locator('#benSurname').fill(data[`นามสกุลผรป_${i + 1}`]); //ใส่นามสกุลผู้รับผลประโยชน์
              await page.selectOption('#beneficiaryRelate', { label: data[`ความสัมพันธ์ผรป_${i + 1}`] }); //เลือกความสัมพันธ์
              await page.locator('#beneficiaryAge').click();
              await page.locator('#beneficiaryAge').fill(data[`อายุผรป_${i + 1}`]); //ใส่อายุผู้รับผลประโยชน์
              // await page.locator('#avgBeneficiary').click();
              // await page.selectOption('#listBenefAddress', { label: 'ที่อยู่เดียวกันกับ ที่อยู่ที่ติดต่อผู้เอาประกัน' }); //เลือกที่อยู่ผู้รับผลประโยชน์
              // await page.locator('#beneficiaryHouseNo').click();
              await page.selectOption('#beneficiaryTypeCard', { label: 'เลขประจำตัว 13 หลัก' })
              await page.locator('#beneficiaryIdCard').fill('3969363557967').then(await page.waitForTimeout(500));
              await page.locator('#beneficiaryCardExpires').fill(changeformatexpiredate_card).then(await page.waitForTimeout(500));
              await page.locator('#beneficiaryHouseNo').fill(homeno_customer).then(await page.waitForTimeout(500)); // กรอก บ้านเลขที่
              await page.locator('#beneficiaryVillageNo').fill(moo_customer).then(await page.waitForTimeout(500)); // กรอก หมู่
              await page.locator('#beneficiaryAddress').fill(village_customer).then(await page.waitForTimeout(500)); // กรอก หมู่บ้าน
              await page.locator('#beneficiarySoi').fill(soi_customer).then(await page.waitForTimeout(500)); // กรอก ซอย
              await page.locator('#beneficiaryRoad').fill(road_customer).then(await page.waitForTimeout(500)); // กรอก ถนน
              await page.selectOption('#beneficiaryProvince', { label: province_customer }); //เลือก จังหวัด
              await page.selectOption('#beneficiaryDistrict', { label: district_customer }); //เลือก อำเภอ
              const option = page.locator('#beneficiarySubDistrict option', {
                hasText: subdistrict_customer
              }).first();
              const value = await option.getAttribute('value');
              await page.selectOption('#beneficiarySubDistrict', value);
              await page.locator('#beneficiaryButtonAdd').click().then(await page.waitForTimeout(500));
              // await page.pause();
            }

            await page.locator('#marketingConsentFlagN').click();
            await page.locator('#taxDiscloseStatusYes').click();

            await page.locator('#newcaseshortly-panel').locator('button', { hasText: 'บันทึก' }).click();
            await expect(page.locator('#summary-panel')).toBeVisible({ timeout: 120000 });
            await page.locator('#summary-panel').locator('button', { hasText: 'ยืนยัน' }).click();
            await expect(page.locator('#newcaseshortly-panel')).not.toBeVisible({ timeout: 120000 });

            console.log('ทำการกรอกข้อมูลเคสใหม่ เรียบร้อยแล้ว');
          });

          // จะได้เลข รับฝากเคส จาก Step 3
          await test.step('Step 3 - บันทึกเคสใหม่แบบย่อ (อุบัติเหตุธรรมดา) - ปริ้นใบรับฝากเคส', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // บันทึกเคสใหม่แบบย่อ (อุบัติเหตุธรรมดา) - ปริ้นใบรับฝากเคส
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            if (system === 'UAT') {
              await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
            }
            else {
              await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
            }

            //เข้าเมนู
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'บันทึกเคสใหม่แบบย่อ (อุบัติเหตุธรรมดา)' }).click().then(await page.waitForTimeout(1000));
            await page.waitForLoadState('networkidle');

            console.log('\nเริ่มทำการพิมพ์ใบรับฝากเคส ที่ No:', row_uniquekey);

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_newcase] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/iserve/newcaseshortly/pa/other/record/v2/list.html') && res.status() === 200
              ),
              //ใส่ตัวแทน
              await page.locator('#agent-code-name').fill(agentCode), //ใส่ agent code
              await page.getByRole('option', { name: agentName }).click() //เลือก agent name
            ]);

            page.once('dialog', async dialog => {
              try {
                console.log('Dialog message:', dialog.message());

                await dialog.accept();
              } catch (err) {
                console.log('Dialog already handled');
              }
            });

            // ปิด tab ใหม่ที่เปิดขึ้นมา
            const [newPage] = await Promise.all([
              page.context().waitForEvent('page'),  // รอให้มี tab ใหม่
              //พิมพ์ใบรับฝากเคส
              page.locator('#bPrint').click()
            ]);
            // รอให้โหลดเสร็จ
            if (system === 'UAT') {
              await newPage.waitForURL('**://uatnbs.thaisamut.co.th/**');
            } else {
              await newPage.waitForURL('**://sitnbs.thaisamut.co.th/**');
            }

            // ==============================
            // รอ URL เป็น .html
            // ==============================
            await newPage.waitForURL(/\.html/i, {
              timeout: 15000
            });

            // ==============================
            // ดึง URL
            // ==============================
            const currentUrl = newPage.url();

            console.log('HTML URL:', currentUrl);

            // ==============================
            // ดึง depositNo
            // ==============================
            const urlObj = new URL(currentUrl);

            let documentNo = urlObj.searchParams.get('params.depositIds');

            // เติม 0 ด้านหน้าให้ครบ 8 หลัก
            documentNo = documentNo.padStart(8, '0');

            console.log('เลขที่:', documentNo);

            // ปิด tab
            await newPage.close();

            // อัพเดท Status เป็น Done
            data_create.push({ [uniquekey]: row_uniquekey, ["เลขรับฝาก"]: documentNo });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

            console.log('ทำการพิมพ์ใบรับฝากเคส ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          await test.step('Step 4 - ส่งข้อมูลใบคำขอ', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // ส่งข้อมูลใบคำขอ
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            // //ส่งข้อมูลใบคำขอ
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click().then(await page.waitForTimeout(1000));
            await page.getByRole('menuitem', { name: 'ส่งข้อมูลใบคำขอฯ' }).click().then(await page.waitForTimeout(1000));
            await page.waitForLoadState('networkidle');
            await page.selectOption('#pdGroupCode', { label: '3 : อุบัติเหตุ' });
            await page.waitForLoadState('networkidle');
            await page.locator('#requestNo').fill(requestId);
            await page.waitForTimeout(1000);

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_requestno_otherbranch_new] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/combine2/newcaseshortly/data/transmission/list.html') && res.status() === 200
              ),
              await page.locator('#oSearch').click()
            ]);

            console.log('\nเริ่มทำการส่งข้อมูลใบคำขอ ที่ No:', row_uniquekey);

            await page.locator('div.yui3-datatable-scroll-liner', { hasText: 'ทั้งหมด' }).locator('input[type="checkbox"]').click();
            await page.locator('#oSendData').click();
            await page.waitForTimeout(2000);
            await page.locator('.yui3-widget-buttons').getByRole('button', { name: 'ส่ง' }).click();
            await page.pause();
            await page.getByRole('button', { name: 'ปิดหน้าจอ' }).click();

            console.log('ทำการส่งข้อมูลใบคำขอ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          await test.step('Step 5 - จัดการข้อมูลเคสใหม่อุบัติเหตุ', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // จัดการข้อมูลเคสใหม่สามัญ
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            // //จัดการข้อมูลเคสใหม่สามัญ
            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่อุบัติเหตุ' }).click();
            await page.getByRole('menuitem', { name: 'รายการเคสใหม่' }).click();
            await page.waitForLoadState('networkidle');
            await page.locator('#oClear').click();
            await page.locator('#requestNo').fill(requestId);

            // รอข้อมูลใน ตารางโหลดเสร็จเรียบร้อยแล้วค่อยทำขั้นตอนต่อไป
            const [response_list_newcase_otherbranch_new] = await Promise.all([
              page.waitForResponse(res =>
                res.url().includes('/nbsweb/secure/iserve/newcase/pa/other/search/other/v2/list.html') && res.status() === 200
              ),
              await page.locator('#oEnquiry').click()
            ]);

            console.log('\nเริ่มทำการกรอกข้อมูลเคสใหม่สามัญ ที่ No:', row_uniquekey);

            await page.locator(`td:has-text("${requestId}")`).click();
            // กรอกข้อมูลสถานภาพสมรส
            await page.selectOption('#maritalStatus', { label: marital_status });
            if (marital_status === 'สมรส') {
              await page.selectOption('#titleMate', { label: marital_title }); //เลือกสถานภาพสมรส
              await page.locator('#nameMate').fill(marital_name).then(() => page.waitForTimeout(600)); // ใส่ชื่อคู่สมรส
              await page.locator('#surnameMate').fill(marital_surname).then(() => page.waitForTimeout(600)); // ใส่นามสกุลคู่สมรส
            }

            // กรอก ที่อยู่ทะเบียนบ้าน
            await page.locator('#houseNo').click();
            await page.locator('#houseNo').fill(homeno_customer); //บ้านเลขที่
            await page.waitForTimeout(300);
            await page.locator('#address').click();
            await page.locator('#address').fill(village_customer); //หมู่บ้าน/อาคาร
            await page.waitForTimeout(300);
            await page.locator('#villageNo').click();
            await page.locator('#villageNo').fill(moo_customer); //หมู่ที่
            await page.waitForTimeout(300);
            await page.locator('#soi').click();
            await page.locator('#soi').fill(soi_customer); //ซอย
            await page.waitForTimeout(300);
            await page.locator('#road').click();
            await page.locator('#road').fill(road_customer); //ถนน
            await page.waitForTimeout(300);
            await page.selectOption('#province', { label: province_customer }); //เลือกจังหวัด
            await page.selectOption('#district', { label: district_customer }); //เลือกอำเภอ
            //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
            const option = page.locator('#subdistrict option', {
              hasText: subdistrict_customer
            }).first();
            const value = await option.getAttribute('value');
            await page.selectOption('#subdistrict', value);

            // กรอก ที่อยู่ปัจจุบัน
            if (send_document_current_address_type === 'โปรดระบุ') {
              await page.locator('#contactAddressType').click();
              await page.selectOption('#contactAddressType', { label: send_document_current_address_type }); //เลือกที่อยู่ที่ต้องการให้ส่งเอกสารไป
              await page.locator('#houseNo2').click();
              await page.locator('#houseNo2').fill(send_document_current_address_home_no).then(() => page.waitForTimeout(300)); //บ้านเลขที่
              await page.locator('#address2').click();
              await page.locator('#address2').fill(send_document_current_address_village).then(() => page.waitForTimeout(300)); //หมู่บ้าน/อาคาร
              await page.locator('#villageNo2').click();
              await page.locator('#villageNo2').fill(send_document_current_address_moo).then(() => page.waitForTimeout(300)); //หมู่ที่
              await page.locator('#soi2').click();
              await page.locator('#soi2').fill(send_document_current_address_soi).then(() => page.waitForTimeout(300)); //ซอย
              await page.locator('#road2').click();
              await page.locator('#road2').fill(send_document_current_address_road).then(() => page.waitForTimeout(300)); //ถนน
              await page.selectOption('#province2', { label: send_document_current_address_province }); //เลือกจังหวัด
              await page.selectOption('#district2', { label: send_document_current_address_district }); //เลือกอำเภอ
              //เลือกตำบล โดยเช็คคำที่มี ไม่ทั้งหมด
              const option = page.locator('#subdistrict2 option', {
                hasText: send_document_current_address_subdistrict
              }).first();
              const value = await option.getAttribute('value');
              await page.selectOption('#subdistrict2', value);
            } else {
              await page.locator('#contactAddressType').click();
              await page.selectOption('#contactAddressType', { label: send_document_current_address_type }); //เลือกที่อยู่ที่ต้องการให้ส่งเอกสารไป
            }

            // กรอกตำแหน่ง
            await page.locator('#position').fill('พนักงานทั่วไป').then(() => page.waitForTimeout(300));
            // กรอกข้อมูลรายได้ต่อปี
            await page.locator('#salary').fill(salaryPerYear).then(() => page.waitForTimeout(300)); //ใส่รายได้ต่อปี

            await page.getByRole('tab', { name: 'ข้อมูลการทำประกัน' }).click();
            let totalPremiumText = await page.locator('tr[class="plan-table-end"]').locator('td', { hasText: 'รวมทั้งหมด' }).textContent();
            const match = totalPremiumText.match(/[\d,]+/);
            totalPremiumText = match ? match[0] : null;

            await page.getByRole('tab', { name: 'ใบรับเงินชั่วคราว' }).click().then(await page.waitForTimeout(1000));
            // //xpath ของ ใบรับเงินชั่วคราว
            // const inputXpathTr = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[1]/td[2]/input';
            // const inputFieldTr = page.locator(`xpath=${inputXpathTr}`);
            // await inputFieldTr.fill(temporaryReceipt); //ใส่เลขที่ใบรับเงินชั่วคราว
            await page.locator('tr', { hasText: 'เลขที่ใบรับเงินชั่วคราว' }).locator('td > input[type="text"]').fill(temporaryReceipt);  //ใส่เลขที่ใบรับเงินชั่วคราว
            await page.locator('label', { hasText: 'เลขที่ใบรับเงินชั่วคราว' }).click().then(await page.waitForTimeout(1000));


            if (payTypeBank === 'โอนเงิน') {
              // const inputNameBank = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[16]/td[2]/select';
              // const inputFieldBank = page.locator(`xpath=${inputNameBank}`);
              // await inputFieldBank.selectOption({ label: '002 BBL : ธนาคารกรุงเทพ จำกัด (มหาชน)' });
              await page.locator('td', { hasText: 'โอนเงินเจ้าของบัญชีเงินฝาก' }).locator('input[value="02"]').click().then(await page.waitForTimeout(500));
              await page.locator('td', { hasText: 'โอนเงินเจ้าของบัญชีเงินฝาก' }).locator('input[value="02"]').click().then(await page.waitForTimeout(500));
              await page.locator('tr', { hasText: 'ธนาคาร:' }).locator('td > select').nth(1).selectOption({ label: '002 BBL : ธนาคารกรุงเทพ จำกัด (มหาชน)' });  // เลือกธนาคารที่ใช้ชำระเงิน

              // const inputBranch = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[16]/td[2]/input';
              // const inputFieldBranch = page.locator(`xpath=${inputBranch}`);
              // await inputFieldBranch.fill('สนง.');
              await page.locator('tr', { hasText: 'สาขา:' }).locator('td > input[type="text"]').nth(1).fill('สนง.');  // ใส่สาขาธนาคารที่ใช้ชำระเงิน

              // const inputCusNameBank = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[17]/td[2]/input[1]';
              // const inputFieldCusNameBank = page.locator(`xpath=${inputCusNameBank}`);
              // await inputFieldCusNameBank.fill('เทสเทสโดยออโต้เมท'); //ใส่ชื่อผู้ฝากเงิน
              await page.locator('#newcase-pa-tab').locator('tr', { hasText: 'ชื่อบัญชี' }).locator('td[style="result-nowrap"] > input[type="text"]').nth(0).fill('เทสเทสโดยออโต้เมท'); //ใส่ชื่อผู้ฝากเงิน

              const allowedStartDigits = ['5', '6', '8'];
              const startDigit = allowedStartDigits[Math.floor(Math.random() * allowedStartDigits.length)];
              const remainingDigits = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
              const bankAccountNumber = startDigit + remainingDigits;

              // const inputBankNum = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[17]/td[2]/input[2]';
              // const inputFieldBankNum = page.locator(`xpath=${inputBankNum}`);
              // await inputFieldBankNum.fill(bankAccountNumber); //ใส่เลขบัญชีธนาคาร
              await page.locator('#newcase-pa-tab').locator('tr', { hasText: 'ชื่อบัญชี' }).locator('td[style="result-nowrap"] > input[type="text"]').nth(1).fill(bankAccountNumber); //ใส่เลขบัญชีธนาคาร

              // const inputPremium = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[18]/td[2]/input';
              // const inputFieldPremium = page.locator(`xpath=${inputPremium}`);
              // await inputFieldPremium.click();
              // await inputFieldPremium.fill('');
              // await inputFieldPremium.fill(totalPremiumText);
              await page.locator('#newcase-pa-tab').locator('tr', { hasText: 'จำนวน:' }).locator('td[style="result-nowrap"] > input[type="text"]').nth(4).fill(totalPremiumText); //ใส่เลขบัญชีธนาคาร
            }

            await page.getByRole('tab', { name: 'รูปแบบกรมธรรม์/สถานที่จัดส่ง' }).click();

            // รูปแบบการจัดส่งกรมธรรม์
            if (receive_document_type === 'Paper') {
              await page.locator('#deliveryPolTypeB').click();
              await page.selectOption('#deliveryPolTo', { label: 'ส่งตรงลูกค้า' })
            } else {
              await page.locator('#deliveryPolTypeE').click();
            }

            // รูปแบบการจัดส่งใบเสร็จรับเงิน
            if (receive_document_type === 'Paper') {
              await page.locator('#deliveryDocTypeB').click();
            } else {
              await page.locator('#deliveryDocTypeE').click();
            }

            await page.pause();
            await page.getByRole('button', { name: 'บันทึก' }).click();
            await page.getByRole('button', { name: 'ยืนยัน' }).click();

            await expect(page.locator('#newcase-pa-panel')).not.toBeVisible();

            console.log('ทำการกรอกข้อมูลเคสใหม่สามัญ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          let policyNo;

          await test.step('Step 6 - แสดงสถานะใบคำขอ/กรมธรรม์', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // แสดงสถานะใบคำขอ/กรมธรรม์
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่อุบัติเหตุ' }).click();
            await page.getByRole('menuitem', { name: 'แสดงสถานะใบคำขอ/กรมธรรม์' }).click();
            await page.selectOption('#criteriaType', { label: 'ใบคำขอ' });

            console.log('\nเริ่มทำการตรวจสอบสถานะใบคำขอ/กรมธรรม์ ที่ No:', row_uniquekey);

            await page.locator('#requestNo').fill(requestId);
            await page.waitForTimeout(1000);
            await page.locator('#oEnquiry').click();
            policyNo = await page.locator('td.yui3-datatable-col-policyNo').first().innerText(); //เอาเลขกรมธรรม์จากตาราง
            console.log('เลขกรมธรรม์:', policyNo);

            console.log('ทำการตรวจสอบสถานะใบคำขอ/กรมธรรม์ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          })

          // รอแก้ดึงเลขที่ใบเสร็จ
          await test.step('Step 7 - ตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // ตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่อุบัติเหตุ' }).click();
            await page.getByRole('menuitem', { name: 'ตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์' }).click();

            console.log('\nเริ่มทำการตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์ ที่ No:', row_uniquekey);

            await page.locator('#policyNoCriteria').fill(policyNo);
            await page.waitForTimeout(1000);
            await page.locator('#bSearchPrintPolicy').click();
            await page.getByRole('link', { name: 'เลือก' }).click();
            await page.getByRole('button', { name: 'ตรวจสอบกรมธรรม์' }).click();
            await page.getByRole('button', { name: 'บันทึกข้อมูลผู้ตรวจสอบความถูกต้องของกรมธรรม์' }).click();
            await page.selectOption('#approveName-sel', { label: username });
            await page.selectOption('#approveRemark', { label: 'ประชุม' });
            await page.getByRole('button', { name: 'ยืนยันข้อมูลกรมธรรม์และข้อมูลใบเสร็จ' }).click();
            await expect(page.locator('#slipNo-info-panel')).toBeVisible();
            const slipno = await page.locator('#slipNoInfoShow').inputValue();
            // console.log(slipno)

            // อัพเดท Status เป็น Done
            data_create.push({ [uniquekey]: row_uniquekey, ["เลขใบเสร็จ"]: slipno });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];

            await page.getByRole('button', { name: 'ปิด' }).click();

            const printButtons = page.locator('#print-datatable button:has-text("พิมพ์")');
            const countprint = await printButtons.count();


            // for (let i = 0; i < countprint; i++) {
            //   await printButtons.nth(i).click();
            //   await page.waitForTimeout(1000);
            // }

            for (let i = 0; i < countprint; i++) {
              const [newPage_policy] = await Promise.all([
                page.context().waitForEvent('page'),      // รอ tab ใหม่
                printButtons.nth(i).click()               // 👈 ใช้ตัวที่เปิด tab
              ]);

              // รอให้โหลดเสร็จ
              if (system === 'UAT') {
                await newPage_policy.waitForURL('**://uatnbs.thaisamut.co.th/**');
              } else {
                await newPage_policy.waitForURL('**://sitnbs.thaisamut.co.th/**');
              }

              await newPage_policy.waitForLoadState('networkidle'); // รอให้โหลดเสร็จ

              console.log(`tab ${i}:`, newPage_policy.url());

              await newPage_policy.close();
            }

            try {
              const closeButton = await page.waitForSelector('#newcaseord-complete-print button', { timeout: 5000 });
              await closeButton.click();
              //console.log("คลิกปุ่ม 'ปิด' แล้ว");
            } catch (error) {
              //console.log("ไม่พบปุ่ม 'ปิด' ภายใน 5 วิ:", error);
            }

            console.log('ทำการตรวจสอบรายละเอียดเกี่ยวกับกรมธรรม์ ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          let documentNo_t;

          // สามารถเก็บเลขที่ใบนำส่งได้ และ เลขที่ใบเสร็จได้
          await test.step('Step 8 - พิมพ์ใบนำส่งเบี้ยประกัน ต่างสาขา', async () => {
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //
            // พิมพ์ใบนำส่งเบี้ยประกัน ต่างสาขา
            // /////////////////////////////////////////////////////////////////////////////////////////////////////////// //

            await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
            await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่อุบัติเหตุ' }).click();
            await page.getByRole('menuitem', { name: 'พิมพ์เอกสาร' }).click();
            await page.getByRole('menuitem', { name: 'พิมพ์ใบส่งเงินฯ' }).click();
            await page.waitForLoadState('networkidle');
            // await page.selectOption('#branchListOwner', { value: username });

            console.log('\nเริ่มทำการพิมพ์ใบนำส่งเบี้ยประกัน ที่ No:', row_uniquekey);

            const agentInfo = `${agentCode}: ${agentName}`;
            await page.locator('#agent').fill(agentInfo).then(await page.waitForTimeout(1000)); //ใส่ข้อมูลตัวแทน
            await page.getByRole('option', { name: agentInfo }).click();
            await page.locator('#btnSearch').click().then(await page.waitForTimeout(2000));
            // await page.locator('#oPrint').click();

            const context = page.context();

            let realPdfBuffer = null;
            let realPdfUrl = '';

            // =========================
            // click + new tab
            // =========================
            const [newPage] = await Promise.all([
              context.waitForEvent('page'),
              page.locator('#oPrint').click()
            ]);

            // =========================
            // รอ html
            // =========================
            await newPage.waitForURL(
              url => url.pathname.endsWith('.html'),
              {
                timeout: 60000
              }
            );

            console.log('HTML URL:', newPage.url());

            // =========================
            // รอโหลด
            // =========================
            await newPage.waitForLoadState('domcontentloaded');
            await newPage.waitForLoadState('load');
            await newPage.waitForLoadState('networkidle');
            await newPage.close();


            // await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
            // await page.waitForTimeout(10000);
            await page.getByRole('button', { name: 'ปิดหน้าจอ' }).waitFor({ state: 'visible' });

            // const context = page.context();
            // const mainPage = page; // ✅ ใช้ตัวเดียวไปเลย

            // // รอ tab อื่นโหลดระดับหนึ่ง
            // await Promise.all(
            //   context.pages()
            //     .filter(p => p !== mainPage)
            //     .map(p => p.waitForLoadState('domcontentloaded'))
            // );

            // // loop แบบไม่ใช้ snapshot เก่า
            // for (const p of context.pages()) {
            //   if (p === mainPage || p.isClosed()) continue;

            //   try {
            //     // // รอ redirect เป็น PDF
            //     // await p.waitForURL(/\.pdf/i, { timeout: 10000 });

            //     // const pdfUrl = p.url();
            //     // console.log('PDF URL:', pdfUrl);

            //     // const response = await context.request.get(pdfUrl, {
            //     //   ignoreHTTPSErrors: true
            //     // });

            //     // const buffer = await response.body();
            //     // const data = await pdfParse(buffer);

            //     // const lines = data.text.split(/\r?\n/);
            //     // documentNo_t = lines[10]?.trim();

            //     // console.log('เลขที่:', documentNo_t);

            //     await p.close();

            //   } catch (e) {
            //     console.log('skip tab:', e.message);
            //   }
            // }

            //   //ตารางว่าเข้า AS400 ไหม
            //   const totalItems = await page.locator('#resultAllDataAmount').textContent();
            //   const successCount = await page.locator('#resultSuccessAmount').textContent();
            //   const failCount = await page.locator('#resultFailAmount').textContent();
            //   const as400SuccessCount = await page.locator('#resultAs400SuccessAmount').textContent();
            //   const as400FailCount = await page.locator('#resultAs400FailAmount').textContent();
            //   const allFailCount = await page.locator('#resultAllFailDataAmount').textContent();

            //   console.log(`
            //             ============================================
            //                           สรุปผลการนำส่งเบี้ยประกัน
            //             ============================================
            //             รายการทั้งหมดที่พิมพ์ใบนำส่ง: ${totalItems} รายการ

            //             --------------------------------------------
            //             สถานะการพิมพ์ใบนำส่ง:
            //               ✓ สำเร็จ: ${successCount} รายการ
            //               ✗ ไม่สำเร็จ: ${failCount} รายการ

            //             --------------------------------------------
            //             สถานะการส่งเข้า AS/400:
            //               ✓ สำเร็จ: ${as400SuccessCount} รายการ
            //               ✗ ไม่สำเร็จ: ${as400FailCount} รายการ

            //             ============================================
            //             รวมรายการไม่สำเร็จทั้งหมด: ${allFailCount} รายการ
            //             ============================================
            // `);
            //   await page.screenshot({ path: 'test-results/Test.png', fullPage: true });
            //   const failedAS400 = parseInt(as400FailCount);
            //   const failedPrint = parseInt(failCount);

            //   if (failedAS400 > 0) {
            //     await page.screenshot({ path: 'test-results/FailedAS400.png', fullPage: true });
            //   }

            //   if (failedPrint > 0) {
            //     await page.screenshot({ path: 'test-results/FailedPrint.png', fullPage: true });
            //   }
            await page.getByRole('button', { name: 'ปิดหน้าจอ' }).click();  // แล้วค่อยคลิก

            // Config ENV 
            const env = system // SIT / UAT
            // connection database
            const db_name = 'nbs';
            const db_env = system; // SIT | SIT_EDIT / UAT | UAT_EDIT

            let db;

            db = new Database({
              user: configdb[db_name][db_env].DB_USER,
              host: configdb[db_name][db_env].DB_HOST,
              database: configdb[db_name][db_env].DB_NAME,
              password: configdb[db_name][db_env].DB_PASSWORD,
              port: configdb[db_name][db_env].DB_PORT,
            });

            const query_check_receipt_no = 'select receipt_no from new_case_slip_trn ncst where request_no = $1;';
            const result_check_receipt_no = await db.query(query_check_receipt_no, [requestId]);

            documentNo_t = result_check_receipt_no.rows[0]?.receipt_no || 'ไม่พบเลขที่ใบเสร็จ';

            //   const status = (parseInt(allFailCount) === 0) ? 'ผ่าน✅' : 'ไม่ผ่าน❌';
            //   console.log(`ใบคำขอ : ${requestId},เลขกธ. : ${policyNo} ==> สถานะ ${status}`);
            //   Result.push(`ใบคำขอ : ${requestId},เลขกธ. : ${policyNo} ==> สถานะ ${status}`);
            //   console.log('Result Array:\n', Result);

            console.log('ทำการพิมพ์ใบนำส่งเบี้ยประกัน ที่ No:', row_uniquekey, 'เรียบร้อยแล้ว');
          });

          await test.step('Step 9 - ลงผลลัพธ์ใน Google Sheet', async () => {
            // ดึงวันที่ แล้วแปลงเป็นรูปแบบ 2026-04-11 20:00:00
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const hours = String(currentDate.getHours()).padStart(2, '0');
            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
            const seconds = String(currentDate.getSeconds()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            // อัพเดท Status เป็น Done
            data_create.push({
              [uniquekey]: row_uniquekey, ["Test Status"]: 'Done', Result: 'PASS', Remark: 'ทำสำเร็จเรียบร้อยแล้ว', ["Test Date"]: formattedDate, ["เลขกรมธรรม์"]: policyNo
              , ["เลขใบนำส่ง"]: documentNo_t
            });
            // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
            await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
            // เคลียร์ array หลังอัพโหลด
            data_create = [];
          });

        }

      } catch (error) {
        if (testInfo.retry === testInfo.project.retries) { // ถ้าเป็นการรันครั้งสุดท้าย (ไม่ว่าจะผ่านหรือไม่ผ่าน)

          // อัพเดท Remark เป็น error.message
          data_create.push({ [uniquekey]: row_uniquekey, ["Test Status"]: 'Fail', Remark: error.message });
          // อัพโหลดผลลัพธ์ไปยัง Google Sheet เป็นการ update ที่ range ที่กำหนด
          await googlesheet.updateDynamicRows(auth, spreadsheetId, sheetnamewrite, range_write, data_create, row_header, uniquekey);
          // เคลียร์ array หลังอัพโหลด
          data_create = [];

        }
        throw error; // ต้องโยนออกไปให้ระบบนับว่า fail จะได้ retry
      }
    }
  }
});