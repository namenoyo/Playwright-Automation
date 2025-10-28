export const searchExpenseRecordAuditor = (page) => ({
    expenserecordreceiptno: page.getByRole('textbox', { name: 'เลขที่รับเรื่องตรวจสอบสิทธิ์/เลขที่รับเรื่องบันทึกค่าใช้จ่าย' }),
    searchExpenseRecordAuditorbutton: page.getByRole('button', { name: 'ค้นหา', exact: true }),
    actionexpenserecordbutton: (expensenoauditor) => page.locator('div[class="MUIDataTable-responsiveScroll-4"]').locator('tr', { hasText: expensenoauditor }).getByRole('button', { name: '' }),
});

export const informationExpenseRecordAuditor = (page) => ({
    // popup
    popupform: page.locator('div[role="dialog"]'),
    popupformconfirm: page.locator('div[role="dialog"]', { hasText: 'ยืนยันการทำรายการ' }),

    // ปุ่ม บันทึก
    savebutton: page.getByRole('button', { name: 'บันทึกผลพิจารณา', exact: true }),

    // Section ข้อมูลความจำเป็นทางการแพทย์ (เก็บสถิติสำหรับ CoPayment)
    necessaryadmit_no: page.locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-12"]', { hasText: 'มีความจำเป็นต้อง Admit หรือไม่' }).getByRole('radio', { name: '"ไม่มี"' }),
    necessaryadmit_yes: page.locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-12"]', { hasText: 'มีความจำเป็นต้อง Admit หรือไม่' }).getByRole('radio', { name: '"มี"' }),
    surgery_no: page.locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-12"]', { hasText: 'ผ่าตัดใหญ่' }).getByRole('radio', { name: 'No' }),
    surgery_yes: page.locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-12"]', { hasText: 'ผ่าตัดใหญ่' }).getByRole('radio', { name: 'Yes' }),

    // Section ข้อมูลประกอบการพิจารณา
    reasonslettershospital: page.getByRole('textbox', { name: 'เหตุผลสำหรับออกจดหมายให้สถานพยาบาลและลูกค้า *' }),


    // Section popup บันทึกสภาวะ
    popupformrecordcondition: page.locator('div[role="dialog"]', { hasText: 'บันทึกสภาวะ' }),
    notsaverecordconditionbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ไม่บันทึก', exact: true }),

    // Section popup บันทึกผลพิจารณา
    popupformrecordconsideration: page.locator('div[role="dialog"]', { hasText: 'บันทึกผลการพิจารณา' }),
    confirmrecordconsiderationbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน', exact: true }),
    editactionbutton: page.locator('div[role="dialog"]').getByRole('button', { name: '' }),
    subpopupformrecordconsideration: page.locator('div[role="dialog"]', { hasText: 'บันทึกผลพิจารณา' }),
    decisionconsideration: page.getByRole('textbox', { name: 'ผลการพิจารณา *', exact: true }),
    reasonsconsideration: page.getByRole('textbox', { name: 'เหตุผลการพิจารณา *', exact: true }),
    commentsconsideration: page.getByRole('textbox', { name: 'ความคิดเห็น *' }),
    confirmrsubecordconsiderationbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน', exact: true }),
    saveconfirmbutton: page.getByRole('button', { name: 'ตกลง', exact: true }),

    // Section popup บันทึกข้อมูลสำเร็จ
    savesuccessdialog: page.locator('div[role="dialog"]', { hasText: 'บันทึกข้อมูลสำเร็จ' }),
    closesavesuccessbutton: page.locator('div[role="dialog"]').getByRole('button', { name: 'ปิด', exact: true }),
});