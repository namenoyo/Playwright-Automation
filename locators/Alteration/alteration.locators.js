import { datadict_endorse_checkbox } from "../../data/Alteration/inquiryform_datadict_endorse_checkbox.data"

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
    //SELECTOR_Alteration_MENU_SUB_1_In_Page_2_Detail_Panel_Data: page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ชื่อ-นามสกุล")) >> div[class*="itemValue"] >> div >> p'),
    
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

export const inquiryendorseformLocator = (page) => ({
    endorse_checkbox_locator: (endorsecode) => page.locator('div.MuiGrid-root.MuiGrid-item', { hasText: 'ประเภทสลักหลัง' }).locator(`label#${endorsecode}`).locator(`input#${endorsecode}`),
    endorse_name_locator: (endorsecode) => page.locator('div.MuiGrid-root.MuiGrid-item', { hasText: 'ประเภทสลักหลัง' }).locator(`label#${endorsecode}`).locator('span').nth(3)
})