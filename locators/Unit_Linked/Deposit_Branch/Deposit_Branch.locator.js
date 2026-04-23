export const table_Depositbranch = (page) => ({
    depositbranch_tbl_chkSelectCase: (requestcode) => page.getByText(requestcode)
})

export const add_Depositbranch = (page) => ({
    depositbranch_btn_add: () => page.getByRole('button', { name: 'เพิ่มรายการรับฝาก' }),
    depositbranch_popup_add: () => page.locator('#deposit-record-panel'),
});

export const form_AddDepositBranch = (page) => ({
    depositbranch_form_txtName: () => page.locator('#depositName'),
    depositbranch_form_txtLastName: () => page.locator('#depositLname'),
    depositbranch_form_seltypepayment: () => page.locator('#moneyType1'),
    depositbranch_form_txtAmount: () => page.locator('#cachAmount1'),
    depositbranch_form_creditcard_selbank: () => page.locator('#creditcardBankCode1'),
    depositbranch_form_creditcard_seltypecard: () => page.locator('#creditcardType1'),
    depositbranch_form_creditcard_txtamount: () => page.locator('#creditcardAmount1'),
    depositbranch_form_creditcard_selmachinecredit: () => page.locator('#creditcardMachineCode1'),
    depositbranch_form_creditcard_seltypefee: () => page.locator('#creditFeeType1'),
    depositbranch_form_creditcard_txtslip: () => page.locator('#creditSlip1'),
    depositbranch_form_radiocustomer: () => page.locator('#depositFromC'),
    depositbranch_form_radionewcase: () => page.locator('#reasonCode01'),
    depositbranch_form_selpolicyplan: () => page.locator('#policyPlan'),
    depositbranch_form_txtrequestcode: () => page.locator('#policyAppNo'),
    depositbranch_form_seltitle: () => page.locator('#title'),
    depositbranch_form_txtnamecustomer: () => page.locator('#customerName'),
    depositbranch_form_txtlastnamecustomer: () => page.locator('#customerLname'),
    depositbranch_form_selagentcode: () => page.locator('#agentCode'),
    depositbranch_form_btnsave: () => page.locator('#deposit-record-panel').getByRole('button', { name: 'บันทึก' }),
    depositbranch_popup_confirmsave: () => page.locator('#confirmDialog'),
})