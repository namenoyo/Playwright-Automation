module.exports = {
 
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
//เข้า CIS > ค้นหาข้อมูลลูกค้า > เข้าเลือกธุรกรรม ของกธ > สอบถามสลักหลัง > ประเภทติดต่อ (ผู้ติดต่อ)
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// กรณี Login ด้วย BRN
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ยังไม่ระบุค่าประเภทติดต่อ (ผู้ติดต่อ)
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_1_Input_Text : page => page.locator('#contactTypeCode'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_2_Input_Text : page => page.locator('.MuiTextField-root').filter({ hasText: 'ประเภทติดต่อ (ผู้ติดต่อ)' }).locator('div[class*="singleValue"]'),

// หลังจากระบุเลือก ตัวแทนยื่นคำขอแทนผู้เอาประกันภัย AGT
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_AGT_1_Input_Text : page => page.locator('#agentBranchCode'), //  เช่น 0001 : ฝ่ายปฎิบัติการประกันชีวิต
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_AGT_2_Input_Text : page => page.locator('#agentCode'),       //  เช่น 3265258 : นางทีเอส หกเอบีโอ

// หลังจากระบุเลือก ผู้ชำระเบี้ย PAY
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_PAY_1_Input_Text : page => page.locator('#contactName'),    //  เช่น ออโต้ เพลไร้
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_PAY_2_Input_Text : page => page.locator('#relationType'),   //  เช่น บุตร

// หลังจากระบุเลือก ผู้ปกครองโดยชอบธรรม LGS
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_LGS_1_Input_Text : page => page.locator('#contactName'),    //  เช่น ออโต้ เพลไร้
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_LGS_2_Input_Text : page => page.locator('#relationType'),   //  เช่น บุตร

// หลังจากระบุเลือก ผู้รับประโยชน์ BNF
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_BNF_1_Input_Text : page => page.locator('#contactName'),    //  เช่น ออโต้ เพลไร้
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_BNF_2_Input_Text : page => page.locator('#relationType'),   //  เช่น บุตร

// หลังจากระบุเลือก ผู้รับมอบอำนาจ ATN
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_ATN_1_Input_Text : page => page.locator('#contactName'),    //  เช่น ออโต้ เพลไร้

// หลังจากระบุเลือก เจ้าหน้าที่สาขา BRP
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_BRP_1_Input_Text : page => page.locator('#officerUsername'),  //  เช่น wanida.ja
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_BRP_2_Button : page => page.locator('#searchOfficerUsername'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_BRP_3_Input_Text : page => page.locator('#contactName'),  //  ระบบ Auto fill  เช่น วนิดา จันทรเพชร
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_BRN_BRP_4_Input_Text : page => page.locator('#position'), //  ระบบ Auto fill เช่น ผู้จัดการสำนักงาน

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// กรณี Login ด้วย OPR
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ยังไม่ระบุค่าประเภทติดต่อ (ผู้ติดต่อ)
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_OPR_1_Input_Text : page => page.locator('#contactTypeCode'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_OPR_2_Input_Text : page => page.locator('.MuiTextField-root').filter({ hasText: 'ประเภทติดต่อ (ผู้ติดต่อ)' }).locator('div[class*="singleValue"]'),

// หลังจากระบุเลือก Branch สาขา  BRN
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_OPR_BRN_1_Input_Text : page => page.locator('#contactBranchCode'),

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// กรณี Login ด้วย SVC
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ยังไม่ระบุค่าประเภทติดต่อ (ผู้ติดต่อ)
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_1_Input_Text : page => page.locator('#contactTypeCode'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_2_Input_Text : page => page.locator('.MuiTextField-root').filter({ hasText: 'ประเภทติดต่อ (ผู้ติดต่อ)' }).locator('div[class*="singleValue"]'),

// หลังจากระบุเลือก ตัวแทนยื่นคำขอแทนผู้เอาประกันภัย  AGT
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_AGT_1_Input_Text : page => page.locator('#agentBranchCode'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_AGT_2_Input_Text : page => page.locator('#agentCode'),

// หลังจากระบุเลือก ผู้ชำระเบี้ย  PAY
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_PAY_1_Input_Text : page => page.locator('#contactName'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_PAY_2_Input_Text : page => page.locator('#relationType'),

// หลังจากระบุเลือก ผู้ปกครองโดยชอบธรรม LGS
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_LGS_1_Input_Text : page => page.locator('#contactName'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_LGS_2_Input_Text : page => page.locator('#relationType'),

// หลังจากระบุเลือก ผู้รับประโยชน์ BNF
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_BNF_1_Input_Text : page => page.locator('#contactName'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_BNF_2_Input_Text : page => page.locator('#relationType'),

// หลังจากระบุเลือก ผู้รับมอบอำนาจ ATN
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_ATN_1_Input_Text : page => page.locator('#contactName'),

// หลังจากระบุเลือก เจ้าหน้าที่สาขา BRP
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_BRP_1_Input_Text : page => page.locator('#officerUsername'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_BRP_2_Button : page => page.locator('#searchOfficerUsername'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_BRP_3_Input_Text : page => page.locator('#contactName'),
SELECTOR_Alteration_MENU_SUB_inquiry_1_In_Page_SVC_BRP_4_Input_Text : page => page.locator('#position'),

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════


/////////// Consol log แบบ DOM ผันแปร และระบุตาม Label ข้างหน้าแทน
//══════════════════════
// Static Panel
//══════════════════════
// เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม> ดูรายละเอียด> Panel ข้อมูลผู้เอาประกันภัย
SELECTOR_Alteration_MENU_SUB_1_In_Page_2_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ชื่อ-นามสกุล")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_4_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ประเภทบัตร/เลขที่บัตร")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_6_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("สัญชาติ")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_8_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันเดือนปี เกิด")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_10_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("อายุ ณ วันเริ่มสัญญา")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_12_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("อายุ ปัจจุบัน")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_14_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("สาขาต้นสังกัด")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_16_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("เลขที่กรมธรรม์")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_18_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ประเภทกรมธรรม์")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_20_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("สถานะกรมธรรม์")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_22_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("แบบประกัน")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_24_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ทุนประกันหลัก")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_26_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("เบี้ยประกันหลัก")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_28_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("งวดชำระ")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_32_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันเริ่มสัญญา")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_34_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ระยะเวลาเอาประกัน")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_36_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ระยะเวลาชำระเบี้ย")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_38_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันครบสัญญา")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_1_In_Page_40_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันครบชำระเบี้ย")) >> div[class*="itemValue"] >> div >> p'),

//เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel รายละเอียดการชำระล่าสุด
SELECTOR_Alteration_MENU_SUB_2_In_Page_2_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันที่ชำระ")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_2_In_Page_4_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ปีที/งวดที่")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_2_In_Page_6_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("เลขที่ใบเสร็จ")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_2_In_Page_8_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันที่ชำระตั้งแต่")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_2_In_Page_10_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("วันที่ชำระถึง")) >> div[class*="itemValue"] >> div >> p'),

//เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel รายละเอียดสลักหลังกรมธรรม์
SELECTOR_Alteration_MENU_SUB_3_In_Page_2_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("หน่วยงานรับเรื่อง")) >> div[class*="itemValue"] >> div >> p'),

//เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel สลักหลัง Non Finance
SELECTOR_Alteration_MENU_SUB_4_In_Page_2_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ชื่อ - นามสกุล")) >> div[class*="itemValue"] >> div >> p'),

//เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel รายละเอียดผู้ติดต่อขอเปลี่ยนแปลงกรมธรรม์
SELECTOR_Alteration_MENU_SUB_6_In_Page_2_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("ประเภทติดต่อ (ผู้ติดต่อ)")) >> div[class*="itemValue"] >> div >> p'),
SELECTOR_Alteration_MENU_SUB_6_In_Page_4_Detail_Panel_Data : page => page.locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("รายละเอียดผู้ติดต่อขอเปลี่ยนแปลงกรมธรรม์")) div.PanelDetailContentColumn-root:has(p:text-is("ชื่อ - นามสกุล"))  div.itemValue p'),
SELECTOR_Alteration_MENU_SUB_6_In_Page_6_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("สาขา")) >> div[class*="itemValue"] >> div >> p'),

//เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม > ดูรายละเอียด > Panel เอกสารประกอบการรับเรื่อง
SELECTOR_Alteration_MENU_SUB_7_In_Page_1_Detail_Panel_Data: page => page.locator('div.MuiCollapse-wrapper').last().locator('tbody.MuiTableBody-root'),

SELECTOR_Alteration_MENU_SUB_7_In_Page_2_Detail_Panel_Data: page => page.getByRole('dialog').locator('P').nth(0),
SELECTOR_Alteration_MENU_SUB_7_In_Page_3_Detail_Panel_Data: page => page.getByRole('dialog').locator('P').nth(1),
SELECTOR_Alteration_MENU_SUB_7_In_Page_4_Button: page => page.locator('div.MuiCollapse-wrapper').last().locator('tbody.MuiTableBody-root button').nth(0), // dynamic ไปตามจำนวน column รายการเอกสาร

//══════════════════════
// Dynamic Panel
//══════════════════════
// เข้าสู่หน้าจอระบบ Alteration > หน้าจอ ค้นหาใบสอบถาม> ดูรายละเอียด> Panel ข้อมูลผู้เอาประกันภัย


};