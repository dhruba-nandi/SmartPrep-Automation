import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class VendorPage extends BasePage {
  private readonly vendorsNavLink: Locator;
  private readonly vendorLink: Locator;
  private readonly vendorSearchInput: Locator;
  private readonly editVendorButton: Locator;
  private readonly accountNumberInput: Locator;
  private readonly ediModeSelect: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.vendorsNavLink = page.getByText('Vendors', { exact: true }).first();
    this.vendorLink = page.getByRole('button', { name: /^vendor$/i }).first();
    this.vendorSearchInput = page.locator('input[ng-model="filterValue"][placeholder="Search"]');
    this.editVendorButton = page.locator('[data-testid="edit-vendor-btn"]');
    this.accountNumberInput = page.locator('input[name="accountNumber"]');
    this.ediModeSelect = page.locator('select[name="ediMode"]');
    this.saveButton = page.locator('#vendorSaveBtn');
  }

  async navigateToVendors() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.vendorsNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.vendorsNavLink.click();
    await this.vendorLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.vendorLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async searchVendor(vendorName: string) {
    await this.vendorSearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.vendorSearchInput.clear();
    await this.vendorSearchInput.fill(vendorName);
    await this.page.waitForTimeout(2000);
  }

  async clickVendorSearchResult(vendorName: string) {
    const row = this.page.getByRole('row').filter({ hasText: vendorName }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await row.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async clickEditVendor() {
    await this.editVendorButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.editVendorButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async enterVendorAccountNumber(accountNumber: string) {
    await this.accountNumberInput.scrollIntoViewIfNeeded();
    await this.accountNumberInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.accountNumberInput.clear();
    await this.accountNumberInput.fill(accountNumber);
    await this.page.waitForTimeout(500);
  }

  async selectEdiMode(mode: string) {
    await this.ediModeSelect.scrollIntoViewIfNeeded();
    await this.ediModeSelect.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.ediModeSelect.selectOption({ label: mode });
    await this.page.waitForTimeout(1000);
  }

  async clickSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }
}
