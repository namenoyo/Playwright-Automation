export const searchVerifyAssessor = (page) => ({
    dateofreceiptform: page.getByRole('textbox', { name: 'วันที่รับเรื่องจาก' }),
    dateofreceiptto: page.getByRole('textbox', { name: 'วันที่รับเรื่องถึง' }),
    policyno: page.getByRole('textbox', { name: 'เลขที่กรมธรรม์' }),
    searchbutton: page.getByRole('button', { name: 'ค้นหา', exact: true }),
    addreciptbutton: page.getByRole('button', { name: 'เพิ่มรายการรับเรื่อง', exact: true }),
    checkpolicyno: (policyno) => page.locator('div[class="MUIDataTable-responsiveScroll-4"]').getByRole('gridcell', { name: policyno }),
});

export const popupAddReceiptVerifyAssessor = (page) => ({
    popup_addreceipt: page.locator('div[role="dialog"]'),
    policyno: page.locator('div[role="dialog"]').locator('#policyNo'),
    searchbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ค้นหา', exact: true }),
    selectlistbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'เลือก', exact: true }),
});

export const informationVerifyAssessor = (page) => ({
    // popup
    popupform: page.locator('div[role="dialog"]'),
    popupformconfirm: page.locator('div[role="dialog"]', { hasText: 'ยืนยันการทำรายการ' }),

    // ปุ่ม บันทึก
    savebutton: page.getByRole('button', { name: 'บันทึกและส่งพิจารณา', exact: true }),

    // Section ข้อมูลสถานพยาบาล
    namehospital: page.getByRole('textbox', { name: 'ชื่อสถานพยาบาล' }),
    qualityhospital: page.getByRole('textbox', { name: 'คุณภาพสถานพยาบาล *' }),

    // Section ข้อมูลเรียกร้องสินไหม
    receipttype: page.getByRole('textbox', { name: 'ประเภทรับเรื่อง' }),
    receipttypeclearbutton: page.locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-2"]', { hasText: 'ประเภทรับเรื่อง' }).locator('svg').nth(0),
    datetimesentdocumenthospital: page.getByRole('textbox', { name: 'วันและเวลาที่สถานพยาบาลส่งเอกสาร *' }),
    datetimeincident: page.getByRole('textbox', { name: 'วันและเวลาที่เกิดเหตุ *' }),
    datetimetreatmentstart: page.getByRole('textbox', { name: 'วันและเวลาที่เข้ารับการรักษา *' }),
    datetimedischargehospital: page.getByRole('textbox', { name: 'วันและเวลาที่ออกจากสถานพยาบาล *' }),
    daysicuroom: page.getByRole('textbox', { name: 'จำนวนวันที่เรียกร้องห้อง ICU *' }),
    bloodpressure: page.getByRole('textbox', { name: 'Blood Pressure (BP) *' }),
    heartrate: page.getByRole('textbox', { name: 'Heart Rate / Pulse Rate (HR / PR) *' }),
    temperature: page.getByRole('textbox', { name: 'Temperature (T) *' }),
    respirationrate: page.getByRole('textbox', { name: 'Respiration Rate (RR) *' }),
    claimtype: page.getByRole('textbox', { name: 'Claim Type *' }),
    causeofclaim: page.getByRole('textbox', { name: 'Cause of Claim *' }),
    treatmentresult: page.locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-4"]', { hasText: 'ผลการรักษา *' }).getByRole('textbox'),
    treatmentplan: page.getByRole('textbox', { name: 'Treatment Plan *' }),
    incidentcause: page.getByRole('textbox', { name: 'Incident Cause (สาเหตุการเคลม) *' }),

    // Section ICD10
    addidc10button: page.getByRole('button', { name: 'เพิ่ม ICD10', exact: true }),
    icd10code: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ICD10 *' }),
    icd10confirmbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน', exact: true }),

    // Section ข้อมูลการเรียกร้องสินไหมสัญญาเพิ่มเติม
    servicetypebutton: (rider) => page.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'ข้อมูลการเรียกร้องสินไหมสัญญาเพิ่มเติม' }).locator('tr', { hasText: `${rider}` }).getByRole('gridcell', { name: '' }).getByRole('button'),
    servicetypecode: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'Service Type *'}),
    servicetypesavebutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'บันทึก', exact: true }),

    // Section ข้อมูลบันทึกค่าใช้จ่าย
    addexpensebutton: page.getByRole('button', { name: 'เพิ่มรายการค่าใช้จ่าย', exact: true }),
    addexpensepolicyno: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'เลขที่กรมธรรม์ *' }),
    addexpenseridercode: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'สัญญาเพิ่มเติม *' }),
    addexpensestandardbilling: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'Standard Billing *' }),
    addexpenseprotectioncategory: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'หมวดความคุ้มครอง *' }),
    addexpensechargeamount: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'Charge' }),
    addexpensebuttonsavebutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน', exact: true }),

    // Section ข้อมูลเอกสารแนบประกอบการพิจารณา
    addattachmentbutton: page.getByRole('button', { name: '吝 ข้อมูลเอกสารแนบประกอบการพิจารณา  เพิ่มเอกสาร' }).getByRole('button'),
    attachmenttypedocument: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ประเภทเอกสาร *' }),
    attachmenttypedocumentconfirmbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ตกลง', exact: true }),
    attachmentuploadfile: page.locator('div[role="dialog"]').locator('input[type="file"]'),
    attachmentbuttonsavebutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน', exact: true }),

    // Section เอกสารจำเป็น
    necessarydocumenttab: (documentname) => page.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'เอกสารจำเป็น' }).getByRole('row', { name: `${documentname}` }).getByRole('checkbox'),

    // Section เอกสารเพิ่มเติม
    additionaldocumenttab: (documentothername) => page.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'เอกสารเพิ่มเติม' }).getByRole('row', { name: `${documentothername}` }).getByRole('checkbox'),
    consideration: page.getByRole('textbox', { name: 'เสนอการพิจารณา *', exact: true }),
    reasonsconsideration: page.getByRole('textbox', { name: 'เหตุผลที่เสนอพิจารณา *', exact: true }),
    assigntoauditor: page.locator('div').filter({ hasText: /^กรุณาระบุ$/ }).nth(3),
    assigntoauditorfirst: page.locator('#react-select-28-option-0'),
    assigntoauditortext: page.locator('div[role="dialog"]').locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-4"]', { hasText: 'Auditor ที่ต้องการมอบหมาย *' }),
    saveconfirmbutton: page.getByRole('button', { name: 'ตกลง', exact: true }),

    // popup บันทึกข้อมูลสำเร็จ
    savesuccessdialog: page.locator('div[role="dialog"]', { hasText: 'บันทึกข้อมูลสำเร็จ' }),
    closesavesuccessbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ปิด', exact: true }),
});