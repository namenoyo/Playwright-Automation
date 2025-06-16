// LoginPage class for Playwright
const locators = require('../locators/login.locator');
const path = require('path');

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} env - environment key: 'sit' | 'uat'
   */
  constructor(page, env = 'sit') {
    this.page = page;
    this.env = env;
    try {
      this.envConfig = require(path.resolve(__dirname, `../config/env.${env}.js`));
    } catch (e) {
      this.envConfig = { loginUrl: '' };
    }
  }

  async goto() {
    await this.page.goto(this.envConfig.loginUrl);
  }

  async login(username, password) {
    await this.page.fill(locators.usernameInput, username);
    await this.page.fill(locators.passwordInput, password);
    await this.page.click(locators.loginButton);
    await this.page.waitForLoadState('networkidle');
  }
}

module.exports = { LoginPage };
