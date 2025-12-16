export const search_NewCase = (page) => ({
    newcase_inputBranchCode: page.locator('#searchCriteria_branchCode'),
    newcase_listBranchCode: (branchcode) => page.getByRole('option', { name: branchcode }),
    newcase_inputAgentCode: page.locator('#searchCriteria_agentCode'),
    newcase_listAgentCode: (agentcode) => page.getByRole('option', { name: agentcode }),
    newcase_btnAddNewCase: page.locator('#searchCriteria_addNewCaseBtn'),
});

export const table_NewCase = (page) => ({
    newcase_tblCaseRow: (requestcode) => page.locator('#main-body').getByRole('row', { name: requestcode }),
    newcase_tbl_btnEditCase: (requestcode) => page.locator('#main-body').getByRole('row', { name: requestcode }).getByRole('button', { name: 'แก้ไข' }),
    newcase_tbl_chkSelectCase: (requestcode) => page.locator('#main-body').getByRole('row', { name: requestcode }).locator('input[type="checkbox"]'),
});

export const popup_NewCase_CustomerInfo = (page) => ({
    newcase_popupCustomerInfo_btnAddCustomer: page.locator('#addCisCustomer'),
    newcase_popupCustomerInfo_optionCustomerType: (typecard) => page.locator('#cusCardTypeTarget > select').selectOption({ label: typecard }),
    newcase_popupCustomerInfo_txtCardNo: page.locator('#customerCardNo'),
    newcase_popupCustomerInfo_txtTitle: page.locator('#customerTitle'),
    newcase_popupCustomerInfo_listTitle: (title) => page.locator('#show-cis-confirm-content').getByRole('option', { name: title }),
    newcase_popupCustomerInfo_txtName: page.locator('#customerName'),
    newcase_popupCustomerInfo_txtSurname: page.locator('#customerSurname'),
    newcase_popupCustomerInfo_txtBirthday: page.locator('#customerBirthdate'),
    newcase_popupCustomerInfo_btnConfirmAddCustomer: page.locator('#show-cis-confirm-content').getByRole('button', { name: 'ยืนยัน' }),
});

export const form_AddNewCase_Tab1 = (page) => ({
    // Tab 1: ผู้เอาประกัน/ตัวแทน/แบบประกัน
    // Section: 1. ชื่อและนามสกุลของผู้เอาประกันภัย
    newcase_formAddNewCase_tab1_txtRequestCode: page.locator('#insureDetailsCriteria_requestCode'),
    newcase_formAddNewCase_tab1_txtDateRequestCode: page.locator('#insureDetailsCriteria_confirmDate'),
    newcase_formAddNewCase_tab1_txtPaymentDate: page.locator('#insureDetailsCriteria_paymentReceiveDate'),
    newcase_formAddNewCase_tab1_selMalitality: page.locator('#insureDetailsCriteria_custStatus'),
    newcase_formAddNewCase_tab1_txtDateCardExpire: page.locator('#insureDetailsCriteria_custIdCardExpire'),
    newcase_formAddNewCase_tab1_selDocumentUsed: page.locator('#insureDetailsCriteria_documentType'),

    // Section: 2. ที่อยู่และที่ทำงาน
    newcase_formAddNewCase_tab1_Register_txtHouseNo: page.locator('#locationCriteria_houseNumber'),
    newcase_formAddNewCase_tab1_Register_selProvince: page.locator('#locationCriteria_houseProvince'),
    newcase_formAddNewCase_tab1_Register_selDistrict: page.locator('#locationCriteria_houseDistrict'),
    newcase_formAddNewCase_tab1_Register_selSubDistrict: page.locator('#locationCriteria_houseSubDistrict'),
    newcase_formAddNewCase_tab1_Current_selSameAddress: page.locator('#locationCriteria_presentHouseSameType'),
    newcase_formAddNewCase_tab1_radioSendDocumentTo: page.locator(`#locationCriteria_contactLocationHouse`),
    newcase_formAddNewCase_tab1_txtMobilePhone: page.locator('#locationCriteria_custMobile'),
    newcase_formAddNewCase_tab1_radioSendDocumentTypePaper1: page.locator('#locationCriteria_policySendTypePaper'),
    newcase_formAddNewCase_tab1_radioSendDocumentTypePaper2: page.locator('#locationCriteria_docSendTypePaper'),

    // Section: 3. อาชีพ
    newcase_formAddNewCase_tab1_txtOccupation: page.locator('#occupationCriteria_mainJobType'),
    newcase_formAddNewCase_tab1_txtOccupationlist: (occupation) => page.getByRole('option', { name: new RegExp(`^${occupation}\\b`) }).nth(0),
    newcase_formAddNewCase_tab1_txtAnnualIncome: page.locator('#occupationCriteria_mainJobIncome'),
    newcase_formAddNewCase_tab1_radioNotUsedMotorcycle: page.locator('#occupationCriteria_useMotorcycleNo'),
    newcase_formAddNewCase_tab1_radioUsedMotorcycle: page.locator('#occupationCriteria_useMotorcycleYes'),

    // Section: 4. แบบประกัน
    newcase_formAddNewCase_tab1_selProduct: page.locator('#planCriteria_productName'),
    newcase_formAddNewCase_tab1_selPaymentPeriod: page.locator('#planCriteria_paymentPeroid'),
    newcase_formAddNewCase_tab1_txtRegularPremium: page.locator('#planCriteria_mainPremiumAmount'),
    newcase_formAddNewCase_tab1_txtInsureAmount: page.locator('#planCriteria_insureAmount'),
    newcase_formAddNewCase_tab1_txtTopUpPremium: page.locator('#planCriteria_specialPremiumAmount'),

    // Section: 5. การจัดสรรสัดส่วนการลงทุน
    newcase_formAddNewCase_tab1_txtCriteriaSuitability: page.locator('#investmentCriteria_suitability'),
    newcase_formAddNewCase_tab1_txtCriteriaEvaluateDate: page.locator('#investmentCriteria_evaluateDate'),

    // Section: 5.1 การจัดสรรสัดส่วนการลงทุน เบี้ยประกันภัยหลัก (Regular Premium) หรือ เบี้ยประกันภัยชำระครั้งเดียว (Single Premium)
    newcase_formAddNewCase_tab1_btnInvestmentthai: page.locator('#investmentCriteria_riskAcknowledgeCheck'),

    // Section: 5.2 การจัดสรรสัดส่วนการลงทุน เบี้ยประกันภัยเพิ่มเติม (Top-Up Premium)
    newcase_formAddNewCase_tab1_btnInvestmentother: page.locator('#investmentCriteria_riskAcknowledgeCheck2'),

    // Sub-section: การจัดสรรสัดส่วนการลงทุน
    newcase_formAddNewCase_tab1_btnInvestmentRegularPremium: page.locator('#regularPremiumBtn'),
    newcase_formAddNewCase_tab1_btnInvestmentTopUpPremium: page.locator('#topUpPremiumBtn'),
    newcase_formAddNewCase_tab1_popupInvestment: page.locator('#investmentDetailsDialogId'),
    newcase_formAddNewCase_tab1_popupInvestment_selFund: page.locator('#investmentDetailsCriteria_investmentName'),
    newcase_formAddNewCase_tab1_popupInvestment_txtFundPercent: page.locator('#investmentDetailsCriteria_investmentPercent'),
    newcase_formAddNewCase_tab1_popupInvestment_btnAddFund: page.locator('#investmentAddBtn'),

    // Section: 6. วิธีการชำระเบี้ยประกันภัยและรับผลประโยชน์
    newcase_formAddNewCase_tab1_radioPaymentTypeSelf: page.locator('#paymentCriteria_paymentTypeSelf'),
    newcase_formAddNewCase_tab1_txtFirstPaymentTempReceiptNo: page.locator('#paymentCriteria_firstPaymentTempReceiptNo'),
    newcase_formAddNewCase_tab1_txtTotalAmount: page.locator('#planDataDiv').locator('tr', { hasText: 'รวมทั้งหมด' }).locator('td').nth(2),
    newcase_formAddNewCase_tab1_chkPayByCash: page.locator('#paymentCriteria_payByCash'),
    newcase_formAddNewCase_tab1_txtPayByCashAmount: page.locator('#paymentCriteria_cashAmount'),
    newcase_formAddNewCase_tab1_chkPayByCreditCard: page.locator('#paymentCriteria_payByCredit'),
    newcase_formAddNewCase_tab1_selPayByCreditCardBank: page.locator('#paymentCriteria_creditIssuer'),
    newcase_formAddNewCase_tab1_txtPayByCreditCardNo: page.locator('#creditNoDiv'),
    newcase_formAddNewCase_tab1_selEndMonthCreditCard: page.locator('#paymentCriteria_creditExpireMonth'),
    newcase_formAddNewCase_tab1_selEndYearCreditCard: page.locator('#paymentCriteria_creditExpireYear'),
    newcase_formAddNewCase_tab1_txtCreditAmount: page.locator('#paymentCriteria_creditAmount'),
    newcase_formAddNewCase_tab1_radioNextPaymentTypeOther: page.locator('#paymentCriteria_nextPaymentTypeOther'),
    newcase_formAddNewCase_tab1_selNextPaymentTypeOther: page.locator('#paymentCriteria_nextPaymentTypeOtherType'),
    newcase_formAddNewCase_tab1_chkReceiveTypePromptPay: page.locator('#paymentCriteria_receiveTypePromptpay'),
    newcase_formAddNewCase_tab1_chkReceiveTypeBankAccount: page.locator('#paymentCriteria_receiveTypeBank'),
    newcase_formAddNewCase_tab1_chkReceiveTypeCheque: page.locator('#paymentCriteria_receiveTypeCheque'),
    newcase_formAddNewCase_tab1_selReceiveBank: page.locator('#paymentCriteria_receiveTypeBankName'),
    newcase_formAddNewCase_tab1_selNameAccountBank: page.locator('#paymentCriteria_receiveTypeBankAcctType'),
    newcase_formAddNewCase_tab1_txtAccountNo: page.locator('#paymentCriteria_receiveTypeBankAcctNo'),
    newcase_formAddNewCase_tab1_txtBranchBank: page.locator('#paymentCriteria_receiveTypeBankBranch'),
});

export const form_AddNewCase_Tab2 = (page) => ({
    // Tab 2: ผู้รับผลประโยชน์/คำแถลงสุขภาพ
    newcase_formAddNewCase_tab2_btnSubMenu2: page.locator('ul[role="tablist"]').getByRole('tab', { name: 'ผู้รับผลประโยชน์/คำแถลงสุขภาพ' }),

    // Section: 7. ผู้รับผลประโยชน์
    newcase_formAddNewCase_tab2_btnYesAddBeneficiary: page.locator('#beneficiaryCriteria_benefitYes'),
    newcase_formAddNewCase_tab2_btnManageBeneficiary: page.locator('#beneficiaryManagementBtn'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary: page.locator('#benificiaryManagementDialogId'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_selTitle: page.locator('#benificiaryManagementCriteria_titleCode'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_txtName: page.locator('#benificiaryManagementCriteria_name'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_txtSurname: page.locator('#benificiaryManagementCriteria_surname'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_btnSameSurname: page.locator('#sameSurnameBtn'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_selRelationship: page.locator('#benificiaryManagementCriteria_relationshipTypeCode'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_txtAge: page.locator('#benificiaryManagementCriteria_age'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_chkShareBenefitPercent: page.locator('#benificiaryManagementCriteria_sharedBenefit'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_selSameAddress: page.locator('#benificiaryManagementCriteria_useSameClientAddress'),
    newcase_formAddNewCase_tab2_popupManageBeneficiary_btnAddBeneficiary: page.locator('#benificiaryManagementAddBtn'),

    // Section: 8. ท่านมีหรือเคยมีประกันชีวิตหรือประกันสุขภาพ หรือประกันอุบัติเหตุ หรือกำลังขอเอาประกันภัยดังกล่าวไว้กับบริษัทนี้หรือบริษัทอื่นหรือไม่
    newcase_formAddNewCase_tab2_radioHaveInsuranceNo: page.locator('#insureBackgroundCriteria_haveInsuredNo'),

    // Section: 9. ท่านเคยถูกปฏิเสธ เลื่อนการรับประกัน ยกเลิกสัญญาเพิ่มเติม เพิ่มอัตราเบี้ยประกันภัย เปลี่ยนแปลงเงื่อนไข สำหรับการขอเอาประกันภัย หรือการขอกลับคืนสู่สถานะเดิม หรือการต่ออายุของกรมธรรม์จากบริษัทนี้ หรือบริษัทอื่นหรือไม่
    newcase_formAddNewCase_tab2_radioDeniedInsuranceNo: page.locator('#insureBackgroundCriteria_haveRejectedNo'),

    // Section: 10. ส่วนสูง / น้ำหนัก
    newcase_formAddNewCase_tab2_txtHeight: page.locator('#bodyCriteria_height'),
    newcase_formAddNewCase_tab2_txtWeight: page.locator('#bodyCriteria_weight'),
    newcase_formAddNewCase_tab2_radioNoChangeWeight6Month: page.locator('#bodyCriteria_weightChangeNo'),

    // Section: 11. ท่านสูบบุหรี่หรือเคยสูบบุหรี่ หรือยาสูบชนิดอื่นหรือไม่
    newcase_formAddNewCase_tab2_radioSmokerNo: page.locator('#smokeCriteria_smokeNo'),

    // Section: 12. ท่านดื่มหรือเคยดื่มเครื่องดื่มที่มีแอลกอฮอล์เป็นประจำหรือไม่
    newcase_formAddNewCase_tab2_radioAlcoholNo: page.locator('#alcoholCriteria_alcoholNo'),

    // Section: 13. ท่านเสพ หรือเคยเสพยาเสพติด หรือสารเสพติดหรือไม่
    newcase_formAddNewCase_tab2_radioDrugNo: page.locator('#drugsCriteria_drugsNo'),

    // Section: 14. ท่านเคยมีส่วนเกี่ยวข้องกับการค้ายาเสพติดหรือเคยต้องโทษเกี่ยวกับคดียาเสพติดหรือไม่
    newcase_formAddNewCase_tab2_radioDrugTradeNo: page.locator('#drugDealerCriteria_drugDealerNo'),

    // Section: 15. ประวัติสุขภาพในช่วงเวลาที่ผ่านมา
    newcase_formAddNewCase_tab2_radioHealthHistoryNo: page.locator('#healthCheckOrInjuryCriteria_healthCheckNo'),

    // Section: 16. ท่านเคยได้รับการวินิจฉัย หรือรับการรักษา หรือตั้งข้อสังเกตโดยแพทย์ว่า ป่วยเป็นโรคตามรายการหรือไม่
    newcase_formAddNewCase_tab2_radioDiagnosedDiseaseNo: page.locator('#diagnoseCriteria_diagnoseNo'),

    // Section: 17. ท่านเคยมี หรือกำลังมีอาการ ตามรายการหรือไม่
    newcase_formAddNewCase_tab2_radioHaveSymptomsNo: page.locator('#symptomCriteria_symptomNo'),

    // Section: 18. เฉพาะสตรี
    newcase_formAddNewCase_tab2_radioPregnantNo: page.locator('#pregnantCriteria_pregnantNo'),
    newcase_formAddNewCase_tab2_radioPregnantComplicationsNo: page.locator('#pregnantCriteria_pregnantComplicationsNo'),
    newcase_formAddNewCase_tab2_radioPregnantMenstruationNo: page.locator('#pregnantCriteria_pregnantMenstruationNo'),

    // Section: 19. ท่านเคยได้รับการวินิจฉัย หรือรับการรักษา หรือตั้งข้อสังเกตจากแพทย์ว่าเป็นโรคตามรายการท้ายคำถามนี้หรือไม่ (คำถามใช้สำหรับการขอเอาประกันภัยสัญญาเพิ่มเติมเกี่ยวกับสุขภาพหรือโรคร้ายแรง)
    newcase_formAddNewCase_tab2_radioSeriousIllnessNo: page.locator('#diagnoseFinalCriteria_diagnoseFinalNo'),

    // Section: 22. ผู้ขอเอาประกันภัยประสงค์จะใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่
    newcase_formAddNewCase_tab2_radioTaxExemptionNo: page.locator('#taxCriteria_taxNo'),

    // Section: 23. การรับรองสถานะและคำยินยอมและตกลงเพื่อปฏิบัติตามกฎหมาย Foreign Account Tax Compliance Act ของสหรัฐอเมริกา (กฎหมาย FATCA)
    newcase_formAddNewCase_tab2_radioAmericanNo: page.locator('#fatcaCriteria_americanNo'),
    newcase_formAddNewCase_tab2_radioGreenCardNo: page.locator('#fatcaCriteria_greenCardNo'),
    newcase_formAddNewCase_tab2_radioAmericanTaxNo: page.locator('#fatcaCriteria_americanTaxNo'),
    newcase_formAddNewCase_tab2_radioLiveInAmericanNo: page.locator('#fatcaCriteria_liveInAmericanNo'),

    // การยินยอมเพื่อวัตถุประสงค์ทางการตลาด
    newcase_formAddNewCase_tab2_radioMarketingConsentNo: page.locator('#minorCriteria_consentNo'),

    // ข้อมูลถิ่นที่อยู่ภาษี
    newcase_formAddNewCase_tab2_radioTaxResidenceInfo: page.locator('#crsFormCriteriaFields_countryTaxinThaiYes'),
});

export const form_AddNewCase_Tab3 = (page) => ({
    // Tab 3: เอกสารประกอบการเอาประกัน
    newcase_formAddNewCase_tab3_btnSubMenu3: page.locator('ul[role="tablist"]').getByRole('tab', { name: 'เอกสารประกอบการเอาประกัน' }),
    newcase_formAddNewCase_tab3_chkIDCard: page.locator('input[id="34"]'),
    newcase_formAddNewCase_tab3_chkFactSheet: page.locator('input[id="35"]'),
    newcase_formAddNewCase_tab3_chkSignatureWitness: page.locator('input[id="1"]'),
    newcase_formAddNewCase_tab3_chkCertifiedTrueCopy: page.locator('input[id="2"]'),
    newcase_formAddNewCase_tab3_chkDocumentExpiryDate: page.locator('input[id="3"]'),
    newcase_formAddNewCase_tab3_selDocumentBranch: page.locator('select[id="sendPolicyFormCriteriaFields_sendPolicyBranch"]'),
    newcase_formAddNewCase_tab3_btnSaveDraft: page.locator('#mainDialogId').getByRole('button', { name: 'บันทึกร่าง', exact: true }),
});

export const form_AddNewCase_SaveDraft = (page) => ({
    newcase_formAddNewCase_btnSaveDraft: page.locator('#mainDialogId').getByRole('button', { name: 'บันทึกร่าง', exact: true }),
    newcase_formAddNewCase_popupSaveDraftSuccess: page.locator('#alert-dialog-model-id', { hasText: 'บันทึกข้อมูลเรียบร้อยแล้ว' }),
});