import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class VendorPage extends BasePage {
  private readonly vendorsNavLink: Locator;
  private readonly vendorLink: Locator;
  private readonly editVendorButton: Locator;
  private readonly commissaryCheckbox: Locator;
  private readonly commissaryDropdown: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.vendorsNavLink = page.getByText('Vendors', { exact: true }).first();
    this.vendorLink = page.getByRole('button', { name: 'Vendor', exact: true });
    this.editVendorButton = page.getByRole('button', { name: /edit vendor/i });
    this.commissaryCheckbox = page.locator('label').filter({ hasText: 'Commissary Vendor' }).last();
    this.commissaryDropdown = page.locator('select[name="commissaryTenant"]');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateViaLeftNav() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.vendorsNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.vendorsNavLink.click();
    await this.vendorLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.vendorLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async selectVendorByName(vendorName: string) {
    const vendorCell = this.page.getByRole('gridcell', { name: vendorName }).first();
    await vendorCell.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await vendorCell.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async clickEditVendor() {
    await this.editVendorButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.editVendorButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async isCommissaryVendorChecked(): Promise<boolean> {
    await this.commissaryCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    return await this.commissaryDropdown.isVisible();
  }

  async checkCommissaryVendor() {
    const alreadyChecked = await this.isCommissaryVendorChecked();
    if (!alreadyChecked) {
      await this.commissaryCheckbox.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async selectCommissaryRestaurant(restaurantName: string) {
    await this.commissaryDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const isDisabled = await this.commissaryDropdown.isDisabled();
    if (!isDisabled) {
      await this.commissaryDropdown.selectOption(restaurantName);
      await this.page.waitForTimeout(1000);
    }
  }

  async clickSave() {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }
}
