import { loginLocators } from "../locators/login.locators";
import { loginLocatorsSPLife } from "../locators/login.locators";

export class LoginPage {
    constructor(page) {
        this.page = page;
    }

    async gotoNBS() {
        await this.page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');
        // Wait for the page to load
        await this.page.waitForLoadState('networkidle');
    }

    async gotoNBSENV(env) {
        if (env === 'SIT') {
            await this.page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');
            // Wait for the page to load
            await this.page.waitForLoadState('networkidle');
        } else if (env === 'UAT') {
            await this.page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html');
            // Wait for the page to load
            await this.page.waitForLoadState('networkidle');
        }

    }

    async login(username, password) {
        await this.page.fill(loginLocators.usernameInput, username);
        await this.page.fill(loginLocators.passwordInput, password);
        await this.page.click(loginLocators.buttonLogin);
        await this.page.waitForLoadState('networkidle');
    }
}

export class LoginPageSPLife {
    constructor(page) {
        this.page = page;
    }

    async gotoSPLife() {
        await this.page.goto('https://sp-life-sit.ochi.link/thaisamut/pub/splife/login.html');
        await this.page.waitForLoadState('networkidle');
    }

    async login(username, password) {
        await this.page.fill(loginLocatorsSPLife.usernameInput, username);
        await this.page.fill(loginLocatorsSPLife.passwordInput, password);
        await this.page.click(loginLocatorsSPLife.buttonLogin);
        await this.page.waitForLoadState('networkidle');
    }
}

module.exports = { LoginPage, LoginPageSPLife };