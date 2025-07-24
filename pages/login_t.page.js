import { loginLocators } from "../locators/login.locators";
import { loginLocatorsSPLife } from "../locators/login.locators";

export class LoginPage {
    constructor(page) {
        this.page = page;
    }

    async gotoNBS() {
        await this.page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');
    }

    async login(username, password) {
        await this.page.fill(loginLocators.usernameInput, username);
        await this.page.fill(loginLocators.passwordInput, password);
        await this.page.click(loginLocators.buttonLogin);
    }
}

export class LoginPageSPLife {
    constructor(page) {
        this.page = page;
    }

    async gotoSPLife() {
        await this.page.goto('https://sp-life-sit.ochi.link/thaisamut/pub/splife/login.html');
    }

    async login(username, password) {
        await this.page.fill(loginLocatorsSPLife.usernameInput, username);
        await this.page.fill(loginLocatorsSPLife.passwordInput, password);
        await this.page.click(loginLocatorsSPLife.buttonLogin);
    }
}

module.exports = { LoginPage, LoginPageSPLife };