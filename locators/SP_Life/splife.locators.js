const menusplifeLocator = (page, mainmenu) => ({
    mainmenu: page.locator('span[class="MuiButton-label"]', { hasText: mainmenu }) // ✅ แก้ spacing ด้วย
});

const mainmenuLocator = (page) => ({
    quotationButton: page.locator('div[class="MuiBox-root css-19yx029"] > button', { hasText: 'สร้างใบเสนอราคา' }),
})

const quotationLocator = (page, insurancename, titlename) => ({
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
})

module.exports = { menusplifeLocator, mainmenuLocator, quotationLocator };