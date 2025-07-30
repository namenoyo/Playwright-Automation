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

    // pop-up แจ้งเตือน
    popupAlert: page.locator('div[class="MuiDialogContent-root"] > h6'), // pop-up แจ้งเตือน
    // ปุ่มปิด pop-up
    closePopupButton: page.locator('div[class="MuiPaper-root MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthXs MuiPaper-elevation24 MuiPaper-rounded"]').locator('span[class="MuiIconButton-label"]'),
    // // pop-up error 502
    // popupError502: page.locator('div[class="MuiPaper-root MuiDialog-paper jss6129 MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiPaper-elevation24 MuiPaper-rounded"]').locator('div[class="MuiDialogContent-root jss6134"]').locator('div[class="MuiGrid-root MuiGrid-item"]').nth(1), // pop-up แจ้งเตือน error 502
    // // ปุ่มปิด pop-up error 502
    // closePopupError502Button: page.locator('div[class="MuiPaper-root MuiDialog-paper jss6129 MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiPaper-elevation24 MuiPaper-rounded"]').locator('span[class="MuiButton-label"]').nth(1),
    // pop-up error server
    popupAlertServer: page.locator('div[aria-labelledby="confirmation-dialog-title"]').locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"]').locator('div[class="MuiGrid-root MuiGrid-item"]'), // pop-up แจ้งเตือน error server
    // ปุ่มปิด pop-up error server
    closePopupErrorServerButton: page.locator('div[aria-labelledby="confirmation-dialog-title"]').locator('div[class="MuiGrid-root MuiGrid-item"]').locator('button[tabindex="0"]'),

})

module.exports = { menusplifeLocator, mainmenuLocator, quotationLocator };