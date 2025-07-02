import { loginLocators } from "../locators/login.locators";

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

module.exports = { LoginPage };