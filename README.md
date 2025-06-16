# 🧪 Playwright End-to-End Testing Project

ระบบทดสอบแบบอัตโนมัติด้วย [Playwright](https://playwright.dev/) ที่ออกแบบมาเพื่อให้ Maintain ได้ง่าย รองรับการทำงานเป็นทีม และสามารถต่อยอดกับระบบ CI/CD, Google Sheets, Jira และ API ได้ในอนาคต

---

## 📁 โครงสร้างโปรเจกต์

project-root/
├── e2e/                      # เก็บ Test Case (เฉพาะไฟล์ที่ run test)
├── pages/                    # Page Object Model - รวม action ของแต่ละหน้า
├── selectors/                # เก็บ selectors ของ UI แยกออกจาก logic
├── utils/                    # ฟังก์ชันช่วยเหลือทั่วไป
├── fixtures/                 # ข้อมูลทดสอบ เช่น username, password
├── config/                   # config สำหรับ environment ต่าง ๆ
├── testsSetup/               # setup/teardown ก่อนและหลังรันเทส
├── playwright.config.ts      # config หลักของ Playwright
├── tsconfig.json             # TypeScript config
├── package.json              # npm scripts, dependencies
└── README.md                 # คู่มือใช้งาน


### 🧱 อธิบายโฟลเดอร์
Folder	คำอธิบาย
e2e/	เก็บ test cases จริงที่รัน โดยแยกตาม feature เช่น login, dashboard
pages/	Page Object Model (POM): รวม action หรือ function ที่ใช้ในแต่ละหน้า
selectors/	เก็บ locator (เช่น id, class) ของแต่ละหน้าที่ใช้ใน test
utils/	ฟังก์ชันช่วยเหลือ เช่น สร้าง email, แปลงเวลา, ดึงข้อมูลจาก API
fixtures/	เก็บข้อมูลจำลองที่ใช้ในการทดสอบ เช่น username/password
config/	เก็บค่าคงที่ เช่น baseURL, timeout หรือค่า env
testsSetup/	โค้ดที่ใช้เตรียมข้อมูล/สิ่งแวดล้อมก่อนและหลังการทดสอบ