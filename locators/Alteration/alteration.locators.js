import { datadict_endorse_checkbox_sub_status } from "../../data/Alteration/inquiryform_datadict_endorse_checkbox_2_Sub_Status_v1.data"
const { escapeRegex } = require('../../utils/common');

export const menualterationLocator = (page, mainmenu, submenu) => ({
    mainmenu: page.locator(`text = ${mainmenu}`),
    submenu: page.locator(`text = ${submenu}`),
    checkmainmenu: page.locator('li[class="MuiBreadcrumbs-li"]').locator(`text = ${mainmenu}`),
    checksubmenu: page.locator('li[class="MuiBreadcrumbs-li"]').locator(`text = ${submenu}`),
})

export const searchinquiryformLocator = (page) => ({
    dateform: page.locator('input[name="inquiryDateFrom"]'),
    dateto: page.locator('input[name="inquiryDateTo"]'),
    complaintreceivingagency_delete: page.locator('div[class="css-p6nyma-control"]').nth(1).locator('div[class="css-1pseabs-indicatorContainer"]').nth(0),
    policyInput: page.locator('input[class="MuiInputBase-input MuiInput-input"]').nth(1),
    buttonSearch: page.getByRole('button', { name: 'ค้นหา', exact: true }),
    checkdatagridPolicy: (policy) => page.getByRole('gridcell', { name: policy, exact: true }),
    inquiryformdetailButton: page.getByRole('gridcell', { name: '' })
})

export const detailinquiryformLocator = (page) => ({
    /////////// Consol log แบบ DOM ผันแปร และระบุตาม Label ข้างหน้าแทน     
    /// ชีทสำหรับกำหนด Selector >> https://docs.google.com/spreadsheets/d/1kqtNcJh9Co5eS2jlaaLzYjYFVLiS3OMIJanJTN4-6Tg/edit?gid=1739637696#gid=1739637696
    // เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม> ดูรายละเอียด> Panel ข้อมูลผู้เอาประกันภัย
    
    SELECTOR_Alteration_MENU_SUB_1_In_Page_2_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("ชื่อ-นามสกุล")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_4_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("ประเภทบัตร/เลขที่บัตร")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_6_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("สัญชาติ")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_8_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("วันเดือนปี เกิด")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_10_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("อายุ ณ วันเริ่มสัญญา")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_12_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("อายุ ปัจจุบัน")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_14_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("สาขาต้นสังกัด")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_16_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("เลขที่กรมธรรม์")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_18_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("ประเภทกรมธรรม์")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_20_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("สถานะกรมธรรม์")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_22_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("แบบประกัน")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_24_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("ทุนประกันหลัก")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_26_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("เบี้ยประกันหลัก")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_28_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("งวดชำระ")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_32_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("วันเริ่มสัญญา")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_34_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("ระยะเวลาเอาประกัน")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_36_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("ระยะเวลาชำระเบี้ย")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_38_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("วันครบสัญญา")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_1_In_Page_40_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลผู้เอาประกันภัย")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("วันครบชำระเบี้ย")) div.itemValue p'),

    //เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel รายละเอียดการชำระล่าสุด
    //SELECTOR_Alteration_MENU_SUB_2_In_Page_2_Detail_Panel_Data: page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันที่ชำระ")) >> div[class*="itemValue"] >> div >> p'),
    SELECTOR_Alteration_MENU_SUB_2_In_Page_2_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ประวัติการชำระเบี้ยงวดล่าสุด")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("วันที่ชำระ")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_2_In_Page_4_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ประวัติการชำระเบี้ยงวดล่าสุด")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("ปีที/งวดที่")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_2_In_Page_6_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ประวัติการชำระเบี้ยงวดล่าสุด")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("เลขที่ใบเสร็จ")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_2_In_Page_8_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ประวัติการชำระเบี้ยงวดล่าสุด")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("วันที่ชำระตั้งแต่")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_2_In_Page_10_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ประวัติการชำระเบี้ยงวดล่าสุด")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("วันที่ชำระถึง")) div.itemValue p'),

    //เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel รายละเอียดสลักหลังกรมธรรม์
    SELECTOR_Alteration_MENU_SUB_3_In_Page_2_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("รายละเอียดรับเรื่อง")) ' + 'div.PanelDetailContentColumn-root:has(p:text-is("หน่วยงานรับเรื่อง")) div.itemValue p'),

    //เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel สลักหลัง Non Finance
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data : page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("สลักหลัง Non Finance")) ' + 'div.MuiExpansionPanel-root:has(p:text-is("เปลี่ยนแปลงคำนำหน้าชื่อ ชื่อ - นามสกุล ผู้เอาประกัน")) ' +  'div.PanelDetailContentColumn-root:has(p:text-is("ชื่อ - นามสกุล")) div.itemValue p'),
    
    SELECTOR_Alteration_MENU_SUB_4_In_Page_10_Detail_Panel_Data : page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("สลักหลัง Non Finance")) ' + 'div.MuiExpansionPanel-root:has(p:text-is("ข้อมูลผู้ชำระเบี้ยเดิม")) ' +  'div.PanelDetailContentColumn-root:has(p:text-is("ประเภทผู้ชำระเบี้ย")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_12_Detail_Panel_Data : page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("สลักหลัง Non Finance")) ' + 'div.MuiExpansionPanel-root:has(p:text-is("ข้อมูลผู้ชำระเบี้ยเดิม")) ' +  'div.PanelDetailContentColumn-root:has(p:text-is("ชื่อ - นามสกุล")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_14_Detail_Panel_Data : page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("สลักหลัง Non Finance")) ' + 'div.MuiExpansionPanel-root:has(p:text-is("ข้อมูลผู้ชำระเบี้ยเดิม")) ' +  'div.PanelDetailContentColumn-root:has(p:text-is("ประเภทบัตร/เลขที่บัตร")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_16_Detail_Panel_Data : page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("สลักหลัง Non Finance")) ' + 'div.MuiExpansionPanel-root:has(p:text-is("ข้อมูลผู้ชำระเบี้ยเดิม")) ' +  'div.PanelDetailContentColumn-root:has(p:text-is("วันเดือนปี เกิด")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_18_Detail_Panel_Data : page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("สลักหลัง Non Finance")) ' + 'div.MuiExpansionPanel-root:has(p:text-is("ข้อมูลผู้ชำระเบี้ยเดิม")) ' +  'div.PanelDetailContentColumn-root:has(p:text-is("อายุ ปัจจุบัน")) div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_20_Detail_Panel_Data : page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("สลักหลัง Non Finance")) ' + 'div.MuiExpansionPanel-root:has(p:text-is("ข้อมูลผู้ชำระเบี้ยเดิม")) ' +  'div.PanelDetailContentColumn-root:has(p:text-is("ความสัมพันธ์")) div.itemValue p'),
    
    //เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel รายละเอียดผู้ติดต่อขอเปลี่ยนแปลงกรมธรรม์
    SELECTOR_Alteration_MENU_SUB_6_In_Page_2_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("รายละเอียดผู้ติดต่อขอเปลี่ยนแปลงกรมธรรม์")) div.PanelDetailContentColumn-root:has(p:text-is("ประเภทติดต่อ (ผู้ติดต่อ)"))  div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_6_In_Page_4_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("รายละเอียดผู้ติดต่อขอเปลี่ยนแปลงกรมธรรม์")) div.PanelDetailContentColumn-root:has(p:text-is("ชื่อ - นามสกุล"))  div.itemValue p'),
    SELECTOR_Alteration_MENU_SUB_6_In_Page_6_Detail_Panel_Data: page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("รายละเอียดผู้ติดต่อขอเปลี่ยนแปลงกรมธรรม์")) div.PanelDetailContentColumn-root:has(p:text-is("สาขา"))  div.itemValue p'),
   
    //เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel เอกสารประกอบการรับเรื่อง
    SELECTOR_Alteration_MENU_SUB_7_In_Page_1_Detail_Panel_Data: page.locator('div.MuiCollapse-wrapper').last().locator('tbody.MuiTableBody-root > tr'),
    SELECTOR_Alteration_MENU_SUB_7_In_Page_2_Detail_Panel_Data: page.getByRole('dialog').locator('P'),
})

export const requestissueformLocator = (page) => ({
    //เข้าสู่หน้าจอระบบ Alteration > หน้าจอ รับเรื่องสลักหลัง > ดูรายละเอียด > Panel สลักหลัง Non Finance
    // ECN01
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Title: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'คำนำหน้า' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Name: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'ชื่อ' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Surname: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'นามสกุล' }),

    // ECN02
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_House_Number: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'บ้านเลขที่' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Moo: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'หมู่ที่' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Village_Tower: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'หมู่บ้าน/อาคาร' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Soi: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'ตรอก/ซอย' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Road: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'ถนน' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Provice: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'จังหวัด' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_District: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'อำเภอ/เขต' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Subdistrict: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'ตำบล/แขวง' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Postal_Code: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('textbox', { name: 'รหัสไปรษณีย์' }),

    // ECN03
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_btn_ManageBenefit: (endorse) => page.locator(`#section-endorsement-${endorse}`).getByRole('button', { name: 'จัดการข้อมูลผู้รับประโยชน์' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_btn_edit_Benefit: page.locator('#section-endorsement-${endorse}').locator('i[title="แก้ไขผู้รับประโยชน์"]'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_btn_delete_Benefit: page.locator('#section-endorsement-${endorse}').locator('i[title="ลบผู้รับประโยชน์"]'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_btn_arrowup_Benefit: page.locator('#section-endorsement-${endorse}').locator('i[title="เลื่อนลำดับผู้รับประโยชน์"]').nth(1),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_btn_arrowdown_Benefit: page.locator('#section-endorsement-${endorse}').locator('i[title="เลื่อนลำดับผู้รับประโยชน์"]').nth(0),
        // ข้อมูลผู้รับประโยชน์
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Relationship: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ความสัมพันธ์ *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Relationship_Other: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'อื่น ๆ โปรดระบุ' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Title: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'คำนำหน้า *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Name: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ชื่อ *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Surname: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'นามสกุล *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Title_Eng: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'คำนำหน้า (ภาษาอังกฤษ)' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Name_Eng: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ชื่อ (ภาษาอังกฤษ)' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Surname_Eng: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'นามสกุล (ภาษาอังกฤษ)' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Sex: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'เพศ *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Birthdate: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'วันเดือนปี เกิด *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_TypeCard: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ประเภทบัตร *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_IDCard: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'เลขที่บัตร *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Percentage: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'สัดส่วนผลประโยชน์ *' }),
        // ที่อยู่ติดต่อ
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_HouseNumber: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'เลขที่ *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Moo: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'หมู่ที่' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_VillageBuilding: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'หมู่บ้าน / อาคาร' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Soi: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ตรอก / ซอย' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Road: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ถนน' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Province: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'จังหวัด *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_District: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'อำเภอ / เขต *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Subdistrict: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'ตำบล / แขวง *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PostalCode: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'รหัสไปรษณีย์ *' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PhoneNumber: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'โทรศัพท์มือถือ' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PhoneNumber_Home: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'โทรศัพท์บ้าน' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Email: page.locator('div[role="dialog"]').getByRole('textbox', { name: 'อีเมล' }),
        // ปุ่มการทำงาน
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Save: page.locator('div[role="dialog"]').getByRole('button', { name: 'ตกลง' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Cancel: page.locator('div[role="dialog"]').getByRole('button', { name: 'ยกเลิก' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Cancel_popup_Confirm: page.locator('div[role="dialog"]', { hasText: 'ยืนยันการยกเลิก' }).getByRole('button', { name: 'ยืนยัน' }),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Cancel_popup_Confirm_Cancel: page.locator('div[role="dialog"]', { hasText: 'ยืนยันการยกเลิก' }).getByRole('button', { name: 'ยกเลิก' }),

    // ECN07
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_NoEndorseCancel: page.locator(`#lastEndorsementNo`),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_DateSaveEndorse: page.locator(`#lastEndorsementDate`),

    // ECN08
    // ข้อมูลลูกค้าผู้ชำระเบี้ย
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_radio_Editdata: page.locator('#changeAction-0'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_radio_ChangePremiumPayer: page.locator('#changeAction-1'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Benefit_to_PremiumPayer: page.locator('#beneficiaryName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Title: page.locator('#payerTitleCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Name: page.locator('#payerName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Surname: page.locator('#payerLastName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_radio_Gender_Male: page.locator('#payerGender-0'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_radio_Gender_Female: page.locator('#payerGender-1'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Birthdate: page.locator('#payerBirthDate'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Title_Eng: page.locator('#payerTitleCodeEng'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Name_Eng: page.locator('#payerNameEng'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Surname_Eng: page.locator('#payerSurnameEng'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Title_Old: page.locator('#originalTitleCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Name_Old: page.locator('#originalFirstname'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Surname_Old: page.locator('#originalLastName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Relationship: page.locator('#relationshipCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Relationship_Other: page.locator('#relationshipName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Cardtype: page.locator('#payerCardType'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_usedDocument: page.locator('#payerCardDocCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_IDCard: page.locator('#payerCardNo'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_CardExpireDate: page.locator('#payerCardExpiredDate'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Nationality: page.locator('#nationalityCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_MaritalCode: page.locator('#payerMaritalCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_TitleCouple: page.locator('#coupleTitleCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_NameCouple: page.locator('#coupleName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_SurnameCouple: page.locator('#coupleSurname'),
    // ที่อยู้ตามทะเบียนบ้าน
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_HouseNumber: page.locator('#registerHouseNo'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Moo: page.locator('#registerVillage'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_VillageBuilding: page.locator('#registerBuilding'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Soi: page.locator('#registerAlley'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Road: page.locator('#registerRoad'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Province: page.locator('#registerProvinceCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_District: page.locator('#registerDistrictCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Subdistrict: page.locator('#registerSubDistrictCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_PostalCode: page.locator('#registerZipCode'),
    // ที่อยู่ปัจจุบัน (ที่อยู่ติดต่อ)
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_chk_SameAddress: page.locator('input[name="useRegAsConAddress"]'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Current_HouseNumber: page.locator('#currentHouseNo'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Current_Moo: page.locator('#currentVillage'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Current_VillageBuilding: page.locator('#currentBuilding'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Current_Soi: page.locator('#currentAlley'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Current_Road: page.locator('#currentRoad'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Current_Province: page.locator('#currentProvinceCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Current_District: page.locator('#currentDistrictCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Current_Subdistrict: page.locator('#currentSubDistrictCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Current_PostalCode: page.locator('#currentZipCode'),
    // สถานที่ทำงาน
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Workplace_Name: page.locator('#workPlaceName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Workplace_Address: page.locator('#workHouseNo'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Workplace_Moo: page.locator('#workVillage'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Workplace_VillageBuilding: page.locator('#workBuilding'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Workplace_Soi: page.locator('#workAlley'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Workplace_Road: page.locator('#workRoad'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Workplace_Province: page.locator('#workProvinceCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Workplace_District: page.locator('#workDistrictCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Workplace_Subdistrict: page.locator('#workSubDistrictCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Workplace_PostalCode: page.locator('#workZipCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_radio_sendDocumentBy_registerhome: page.locator('#contactType-0'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_radio_sendDocumentBy_currentaddress: page.locator('#contactType-1'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_radio_sendDocumentBy_workplace: page.locator('#contactType-2'),
    // ข้อมูลติดต่อ
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_PhoneNumber_Mobile: page.locator('#mobileNo'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_PhoneNumber_Home: page.locator('#homeTelephoneNo'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_PhoneNumber_Office: page.locator('#workTelephoneNo'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_PhoneNumber_Office_To: page.locator('#workTelephoneExt'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Email: page.locator('#email'),
    // อาชีพ
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_Occupation: page.locator('#occupationCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Occupation_Other: page.locator('#otherOccupationName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Position: page.locator('#occupationPosition'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Nature_of_Work: page.locator('#occupationType'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Nature_of_business: page.locator('#occupationBusiness'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_Annual_Income: page.locator('#annualRevenue'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_sel_If_Occupation_Other: page.locator('#extraOccupationCode'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_If_Occupation_Other: page.locator('#extraOccupationName'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_If_Position: page.locator('#extraOccupationPosition'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_If_Nature_of_Work: page.locator('#extraOccupationType'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_If_Nature_of_business: page.locator('#extraOccupationBusiness'),
    SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_txt_If_Annual_Income: page.locator('#extraAnnualRevenue'),

});

export const inquiryendorseformLocator = (page) => ({
    endorse_checkbox_locator: (endorsecode) => page.locator('div.MuiGrid-root.MuiGrid-item', { hasText: 'ประเภทสลักหลัง' }).locator(`label#${endorsecode}`).locator(`input#${endorsecode}`),
    endorse_name_locator: (endorsecode, endorsename) => page.locator('div.MuiGrid-root.MuiGrid-item', { hasText: 'ประเภทสลักหลัง' }).locator(`label#${endorsecode}`).locator('span', { hasText: new RegExp(escapeRegex(endorsename)) }),
    action_button: page.locator('button', { hasText: 'ดำเนินการ' }),
    confirm_popup: page.locator('div[role="dialog"]', { hasText: 'ยืนยันประเภทสลักหลัง' }),
    confirm_button: page.locator('div[role="dialog"]').getByRole('button', { name: 'ยืนยัน' }),
})