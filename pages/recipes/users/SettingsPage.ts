import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class SettingsPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly billPaymentsCheckbox: Locator;
  private readonly preferencesTab: Locator;
  private readonly pricePreferenceDropdown: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="email"][placeholder="Your e-mail"]');
    this.billPaymentsCheckbox = page.locator('[data-testid="BILL_PAYMENTS"] input[name="jobResponsibilities"]');
    this.preferencesTab = page.getByRole('tab', { name: 'Preferences' });
    this.pricePreferenceDropdown = page.locator('input[placeholder="Select price preference"]');
    this.saveButton = page.locator('button#mui-10, button:has-text("Save")').first();
  }

  async enterEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(500);
  }

  async checkBillPayments() {
    const checkbox = this.billPaymentsCheckbox;
    await checkbox.waitFor({ state: 'attached', timeout: TIMEOUT.default });
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      await this.page.locator('[data-testid="BILL_PAYMENTS"]').click();
      await this.page.waitForTimeout(500);
    }
  }

  async clickPreferencesTab() {
    await this.preferencesTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.preferencesTab.click();
    await this.page.waitForTimeout(2000);
  }

  async selectPricePreference(value: string) {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.pricePreferenceDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.pricePreferenceDropdown.click();
    await this.page.waitForTimeout(500);
    const option = this.page.getByRole('option', { name: value });
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async scrollToBottomAndSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('load', { timeout: TIMEOUT.extended });
    await this.page.waitForTimeout(2000);
  }
}
