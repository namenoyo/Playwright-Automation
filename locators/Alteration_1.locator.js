module.exports = {

/////////// Consol log แบบ DOM ผันแปร และระบุตาม Label ข้างหน้าแทน
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
SELECTOR_Alteration_MENU_SUB_6_In_Page_6_Detail_Panel_Data : page => page.locator('div.MuiGrid-root.item.MuiGrid-container:has(div[class*="itemLabel"] > p:text-is("สาขา")) >> div[class*="itemValue"] >> div >> p'),

};