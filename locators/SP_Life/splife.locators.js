const menusplifeLocator = (page, mainmenu) => ({
    mainmenu: page.locator('span[class="MuiButton-label"]', { hasText: mainmenu }) // ✅ แก้ spacing ด้วย
});

const mainmenuLocator = (page) => ({
    quotationButton: page.locator('div[class="MuiBox-root css-19yx029"] > button', { hasText: 'สร้างใบเสนอราคา' }),
})

const quotationLocator = (page, insurancename = '', titlename = '', insurancebroker = '') => ({
    // 1. ข้อมูลนายหน้าประกันชีวิต
    insurancebroker: page.getByRole('region').filter({ hasText: 'รายชื่อนายหน้าประกันชีวิตสาขารหัสพนักงานเลขที่ใบอนุญาตใบอนุญาตหมดอายุวันที่' }).getByLabel('Open'),
    insurancebrokerOption: page.getByRole('option', { name: insurancebroker, exact: true }), // ตัวเลือกนายหน้า
    insurancebrokerClear: page.getByRole('button', { name: 'Clear' }), // ปุ่มเคลียร์นายหน้า
    insurancebranch: page.getByRole('region').filter({ hasText: 'รายชื่อนายหน้าประกันชีวิตกรุณาเลือกรายชื่อนายหน้าประกันชีวิตสาขารหัสพนักงานเลขที่' }).getByRole('textbox').nth(1), // ช่องกรอกสาขานายหน้า

    // 2. เลือกแบบประกัน
    insurancePlan: page.locator('div[class="MuiCardContent-root"]').locator('h6', { hasText: insurancename }),

    // 3. ข้อมูลผู้เอาประกันภัย
    idcard: page.locator('input[name="insureCardNo"]'), // กรอกเลขบัตรประชาชน
    titlename: page.locator('div[class="MuiPaper-root quotation-paper MuiPaper-elevation2 MuiPaper-rounded"]').locator('input[placeholder="กรุณาเลือก"]').nth(1), // ช่องคำนำหน้า
    titalnameOption: page.getByRole('option', { name: titlename, exact: true }), // ตัวเลือกคำนำหน้า
    name: page.locator('input[name="insureName"]'), // กรอกชื่อผู้เอาประกันภัย
    surname: page.locator('input[name="insureSurname"]'), // กรอกนามสกุลผู้เอาประกันภัย
    birthdate: page.locator('input[name="insureBirthdate"]'), // กรอกวันเกิดผู้เอาประกัน
    cardexpiredate: page.locator('input[name="insureCardExpire"]'), // กรอกวันหมดอายุบัตรประชาชน
    mobileno: page.locator('input[name="insureMobileNo"]'), // กรอกเบอร์โทรศัพท์

    // 4. คำนวณเบี้ย และ วิธีการชำระเบี้ย
    insurancesum: page.locator('input[name="sumInsure"]'), // กรอกจำนวนเงินเอาประกันภัย
    coverageyear: page.locator('input[name="coverageYear"]'), // กรอกระยะเวลาคุ้มครอง
    calisurance: page.locator('span[class="MuiButton-label"]', { hasText: 'คำนวณเบี้ย' }), // ปุ่มคำนวณเบี้ย
    totalinsurancepremium: page.locator('div[class="MuiPaper-root quotation-paper MuiPaper-elevation2 MuiPaper-rounded"]').locator('p[class="MuiTypography-root MuiTypography-body1"]').nth(1), // แสดงเบี้ยประกันภัยทั้งหมด

    // 4. วิธีการชำระเบี้ย
    paymentmethod_now: page.locator('label[for="paymentP"]'), // ชำระเบี้ยทันที
    paymentmethod_account: page.locator('label[for="paymentS"]'), // รอตัดบัญชี
    inputdate_account: page.locator('input[name="paymentDate"]'), // รอตัดบัญชีภายในวันที่
    inputpaymentno_account: page.locator('input[name="paymentAccountNo"]'), // เลขที่บัญชี (ระบุเฉพาะตัวเลข)

    // ปุ่มสร้างใบเสนอราคา
    confirmsavequotation: page.locator('span[class="MuiButton-label"]', { hasText: 'ยืนยันข้อมูล' }), // ปุ่มยืนยันข้อมูล
    popupmessageconfirmsavequotation: page.locator('h6[class="MuiTypography-root MuiTypography-h6"]', { hasText: 'ยืนยันการสร้างใบเสนอราคาใช่หรือไม่' }), // pop-up แจ้งเตือนยืนยันการสร้างใบเสนอราคา
    savepopupmessageconfirmsavequotation: page.locator('div[class="MuiDialogContent-root"]').locator('span[class="MuiButton-label"]', { hasText: 'ยืนยัน' }), // ปุ่มยืนยันใน pop-up
    popupmessagesuccessquotation: page.locator('h6[class="MuiTypography-root MuiTypography-h6"]', { hasText: 'สร้างใบเสนอราคาเสร็จสิ้น ระบบจะพาไปยัง หน้าสร้างใบคำขอเอาประกันภัย' }), // pop-up แจ้งเตือนสร้างใบเสนอราคาเสร็จสิ้น

    // pop-up แจ้งเตือน
    popupAlert: page.locator('div[class="MuiDialogContent-root"] > h6'), // pop-up แจ้งเตือน
    // ปุ่มปิด pop-up
    closePopupButton: page.locator('div[class="MuiPaper-root MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthXs MuiPaper-elevation24 MuiPaper-rounded"]').locator('span[class="MuiIconButton-label"]'),
    // ปุ่มปิด pop-up แจ้งเตือน
    closepopupButton: page.getByRole('button', { name: 'close' }),
    // // pop-up error 502
    // popupError502: page.locator('div[class="MuiPaper-root MuiDialog-paper jss6129 MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiPaper-elevation24 MuiPaper-rounded"]').locator('div[class="MuiDialogContent-root jss6134"]').locator('div[class="MuiGrid-root MuiGrid-item"]').nth(1), // pop-up แจ้งเตือน error 502
    // // ปุ่มปิด pop-up error 502
    // closePopupError502Button: page.locator('div[class="MuiPaper-root MuiDialog-paper jss6129 MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiPaper-elevation24 MuiPaper-rounded"]').locator('span[class="MuiButton-label"]').nth(1),
    // pop-up error server
    popupAlertServer: page.locator('div[aria-labelledby="confirmation-dialog-title"]').locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"]').locator('div[class="MuiGrid-root MuiGrid-item"]').first(), // pop-up แจ้งเตือน error server
    // ปุ่มปิด pop-up error server
    closePopupErrorServerButton: page.locator('div[aria-labelledby="confirmation-dialog-title"]').locator('div[class="MuiGrid-root MuiGrid-item"]').locator('button[tabindex="0"]').first(),

})

const applicationformLocator = (page, nationality = '', province = '', district = '', subdistrict = '') => ({
    // 2. ข้อมูลผู้เอาประกันภัย และผู้รับผลประโยชน์
    // รายละเอียดผู้เอาประกันภัย
    // สถานะภาพ
    statuspeople_single: page.locator('label[for="single"]'), // โสด
    statuspeople_married: page.locator('label[for="married"]'), // สมรส
    statuspeople_divorced: page.locator('label[for="divorced"]'), // หย่าร้าง
    statuspeople_widowed: page.locator('label[for="widowed"]'), // หม้าย
    // สัญชาติ
    nationality: page.getByRole('button', { name: 'Open' }).first(), // ปุ่มเลือกสัญชาติ
    nationalityOption: page.getByRole('option', { name: nationality, exact: true }), // ตัวเลือกคำนำหน้า

    // ข้อมูลที่อยู่ตามทะเบียนบ้าน
    addressno: page.locator('#registerHouseNo'), // เลขที่
    zipcode: page.locator('#registerZipCode'), // รหัสไปรษณีย์
    province: page.getByRole('button', { name: 'Open' }).nth(1), // ปุ่มเลือกจังหวัด
    provinceOption: page.getByRole('option', { name: province, exact: true }), // ตัวเลือกจังหวัด
    district: page.getByRole('button', { name: 'Open' }).nth(2), // ปุ่มเลือกอำเภอ
    districtOption: page.getByRole('option', { name: district, exact: true }), // ตัวเลือกอำเภอ
    subdistrict: page.getByRole('button', { name: 'Open' }).nth(3), // ปุ่มเลือกตำบล
    subdistrictOption: page.getByRole('option', { name: subdistrict, exact: true }), // ตัวเลือกตำบล

    // ที่อยู่ปัจจุบัน/ที่อยู่ที่สะดวกให้ติดต่อ
    currentaddressnow: page.locator('label[for="contactFlagCurrent"]'), // ที่อยู่ปัจจุบัน

    // ปุ่มสร้างใบคำขอ
    confirmsaveapplicationform: page.locator('span[class="MuiButton-label"]', { hasText: 'ยืนยันข้อมูล' }).nth(1), // ปุ่มยืนยันข้อมูล
    popupmessageconfirmsaveapplicationform: page.locator('h6[class="MuiTypography-root MuiTypography-h6"]', { hasText: 'ยืนยันข้อมูลใบคำขอเอาประกันภัยใช่หรือไม่' }), // pop-up แจ้งเตือนยืนยันการสร้างใบคำขอ
    popupmessagesuccessapplicationform: page.locator('p[class="MuiTypography-root MuiTypography-body1"]', { hasText: 'ยืนยันใบคำขอเอาประกันภัย' }), // pop-up แจ้งเตือนสร้างใบคำขอเสร็จสิ้น
    savepopupmessageconfirmsaveapplicationform: page.locator('div[class="MuiDialogContent-root"]').locator('span[class="MuiButton-label"]', { hasText: 'กลับสู่หน้าหลัก' }), // ปุ่มยืนยันใน pop-up

    popuprefno: page.locator('p[class="MuiTypography-root MuiTypography-body1"] > span') // หมายเลขอ้างอิงใบคำขอ
})

module.exports = { menusplifeLocator, mainmenuLocator, quotationLocator, applicationformLocator };