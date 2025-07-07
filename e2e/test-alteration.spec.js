import { test, expect } from '@playwright/test'

import { LoginPage } from '../pages/login_t.page'
import { LogoutPage } from '../pages/logout.page'
import { gotoMenu } from '../pages/menu.page'

import { loginData } from '../data/login_t.data'

test('test alteration check data', async ({ page }) => {
    const loginpage = new LoginPage(page);
    const gotomenu = new gotoMenu(page, expect);
    const logoutpage = new LogoutPage(page, expect);


    const logindata = loginData;

    // ไปยังหน้า NBS
    await loginpage.gotoNBS();
    // เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
    await loginpage.login(logindata.username, logindata.password);
    // ไปยังเมนู "ระบบงาน NBS Protal" > "Home"
    await gotomenu.menuAll('ระบบงาน NBS Portal', 'Home');
    // ไปเมนู ที่ทำการเลือกใน NBS Portal
    await gotomenu.menuProtal('alteration');

    

})