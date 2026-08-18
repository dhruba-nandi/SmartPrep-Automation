import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class AppConfigPage extends BasePage {
  private readonly developerNavLink: Locator;
  private readonly appConfigLink: Locator;
  private readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.developerNavLink = page.getByText('Developer', { exact: true }).first();
    this.appConfigLink = page.getByRole('button', { name: /app config/i }).first();
    this.searchInput = page.locator('input.form-control[ng-model="filter"]');
  }

  async navigateToAppConfig() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.developerNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.developerNavLink.click();
    await this.appConfigLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.appConfigLink.click();
    await this.waitForPageLoad();
  }

  async verifyAppConfigPageLoaded() {
    await expect(this.page).toHaveURL(/appconfig/, { timeout: TIMEOUT.default });
  }

  async searchConfig(term: string) {
    await this.searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(2000);
  }

  async updateConfigValue(oldText: string, newText: string) {
    const configTextarea = this.page.locator('textarea, [contenteditable="true"], pre').filter({
      hasText: oldText.split(':')[0].replace(/"/g, '').trim(),
    }).first();
    await configTextarea.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const currentValue = await configTextarea.inputValue().catch(async () => {
      return await configTextarea.textContent() || '';
    });

    const updatedValue = currentValue.replace(oldText, newText);

    await configTextarea.click();
    await configTextarea.fill(updatedValue);
    await this.page.waitForTimeout(1000);
  }

  async clickSaveConfig() {
    const saveButton = this.page.locator('a[ng-click="saveAppConfig($event, entry)"]');
    await saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveButton.click();

    // Wait for and handle the "Are you sure?" confirmation modal
    const modal = this.page.locator('.modal-content').filter({ hasText: 'Are you sure you want to update this app config?' });
    await modal.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const okButton = modal.locator('button.bootbox-accept');
    await okButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await okButton.click();

    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }
}
