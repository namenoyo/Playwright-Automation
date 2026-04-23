const { table_Depositbranch, add_Depositbranch, form_AddDepositBranch } = require('../../../locators/Unit_Linked/Deposit_Branch/Deposit_Branch.locator');

class Deposit_BranchPage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.table_Depositbranch = table_Depositbranch(page);
        this.add_Depositbranch = add_Depositbranch(page);
        this.form_AddDepositBranch = form_AddDepositBranch(page);
    }

    async clickAddDepositBranch() {
        // กดปุ่ม เพิ่มรายการรับฝาก
        await this.add_Depositbranch.depositbranch_btn_add().click({ timeout: 10000 });
        await this.expect(this.add_Depositbranch.depositbranch_popup_add()).toBeVisible({ timeout: 10000 });
    }

    async formAddDepositBranch(data) {
        // กรอกข้อมูลในฟอร์ม เพิ่มรายการรับฝาก
        // กรอกชื่อ
        await this.form_AddDepositBranch.depositbranch_form_txtName().fill(data.name);
        // กรอกนามสกุล
        await this.form_AddDepositBranch.depositbranch_form_txtLastName().fill(data.lastname);

        if (data.totalamountclean > 50000) {
            // เลือกประเภทการชำระเงินเป็น บัตรเครดิต
            await this.form_AddDepositBranch.depositbranch_form_seltypepayment().selectOption('บัตรเครดิต');
            // เลือกธนาคารในช่อง บัตรเครดิต
            await this.form_AddDepositBranch.depositbranch_form_creditcard_selbank().selectOption('KBANK');
            // เลือกประเภทบัตรในช่อง บัตรเครดิต
            await this.form_AddDepositBranch.depositbranch_form_creditcard_seltypecard().selectOption('VISA');
            // กรอกจำนวนเงินในช่อง บัตรเครดิต
            await this.form_AddDepositBranch.depositbranch_form_creditcard_txtamount().type(data.totalamountclean.toString(), { delay: 100 });
            // เลือกเครื่องรูดบัตรในช่อง บัตรเครดิต
            await this.form_AddDepositBranch.depositbranch_form_creditcard_selmachinecredit().selectOption('87260481 : KBANK (UL)');
            if (data.product === 'UL001') {
                // เลือกประเภทค่าธรรมเนียมในช่อง บัตรเครดิต
                await this.form_AddDepositBranch.depositbranch_form_creditcard_seltypefee().selectOption('ยกเว้นค่าธรรมเนียม ยูนิต ลิงค์');
            } else if (data.product === 'UL002') {
                // เลือกประเภทค่าธรรมเนียมในช่อง บัตรเครดิต
                await this.form_AddDepositBranch.depositbranch_form_creditcard_seltypefee().selectOption('เงินสด');
            }
            // กรอกเลขสลิปในช่อง บัตรเครดิต
            await this.form_AddDepositBranch.depositbranch_form_creditcard_txtslip().type('1234567890', { delay: 100 });
        } else {
            // เลือกประเภทการชำระเงินเป็น เงินสด
            await this.form_AddDepositBranch.depositbranch_form_seltypepayment().selectOption('เงินสด');
            // กรอกจำนวนเงิน
            await this.form_AddDepositBranch.depositbranch_form_txtAmount().type(data.totalamountclean.toString(), { delay: 100 });
        }

        // เลือกรับฝากจากลูกค้า
        await this.form_AddDepositBranch.depositbranch_form_radiocustomer().check();
        // เลือกเหตุผลเป็น กรณีใหม่
        await this.form_AddDepositBranch.depositbranch_form_radionewcase().check();
        // เลือกแผนประกัน
        await this.form_AddDepositBranch.depositbranch_form_selpolicyplan().selectOption(data.product, { timeout: 10000 });
        // กรอกเลขคำขอในช่องคำขอ
        await this.form_AddDepositBranch.depositbranch_form_txtrequestcode().type(data.requestcode, { delay: 100 });
        // เลือกคำนำหน้าชื่อ
        const titleValue = data.title.split(' ')[0];
        await this.form_AddDepositBranch.depositbranch_form_seltitle().selectOption(titleValue, { timeout: 10000 });
        // กรอกชื่อผู้รับฝาก
        await this.form_AddDepositBranch.depositbranch_form_txtnamecustomer().type(`${data.name}`, { delay: 100 });
        // กรอกนามสกุลผู้รับฝาก
        await this.form_AddDepositBranch.depositbranch_form_txtlastnamecustomer().type(`${data.lastname}`, { delay: 100 });
        // เลือกโค้ดตัวแทน
        await this.form_AddDepositBranch.depositbranch_form_selagentcode().selectOption(data.agentcode, { timeout: 10000 });
        // กดปุ่ม บันทึก
        await this.form_AddDepositBranch.depositbranch_form_btnsave().click({ timeout: 10000 });
        // เช็คว่ามีป็อปอัพยืนยันการบันทึกขึ้นมาหรือไม่
        await this.expect(this.form_AddDepositBranch.depositbranch_popup_confirmsave()).toBeVisible({ timeout: 10000 });
        // กดปุ่ม ตกลง ในป็อปอัพยืนยันการบันทึก
        await this.form_AddDepositBranch.depositbranch_popup_confirmsave().getByRole('button', { name: 'OK' }).click({ timeout: 10000 });
        // เช็คว่าป็อปอัพยืนยันการบันทึกหายไปหรือไม่
        await this.expect(this.form_AddDepositBranch.depositbranch_popup_confirmsave()).not.toBeVisible({ timeout: 10000 });
        // รอ popup บันทึกรายการรับฝาก หายไป
        await this.expect(this.add_Depositbranch.depositbranch_popup_add()).not.toBeVisible({ timeout: 10000 });
    }
}

module.exports = { Deposit_BranchPage }