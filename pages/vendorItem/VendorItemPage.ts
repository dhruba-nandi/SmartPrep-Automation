import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class VendorItemPage extends BasePage {
  private readonly vendorsNavLink: Locator;
  private readonly vendorItemsLink: Locator;
  private readonly addVendorItemButton: Locator;
  private readonly vendorItemNameInput: Locator;
  private readonly addPackagingOptionButton: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.vendorsNavLink = page.getByText('Vendors', { exact: true }).first();
    this.vendorItemsLink = page.getByRole('button', { name: /vendor items/i }).first();
    this.addVendorItemButton = page.getByText('Add a new Vendor Item');
    this.vendorItemNameInput = page.getByRole('textbox', { name: 'Please enter a name for the' });
    this.addPackagingOptionButton = page.getByRole('button', { name: /add packaging option/i });
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateViaLeftNav() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.vendorsNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.vendorsNavLink.click();
    await this.vendorItemsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.vendorItemsLink.click();
    await this.waitForPageLoad();
  }

  async verifyVendorItemsPageLoaded() {
    await expect(this.page).toHaveURL(/vendorProduct/, { timeout: TIMEOUT.long });
  }

  async clickAddVendorItem() {
    await this.addVendorItemButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addVendorItemButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async selectVendor(vendor: string) {
    const vendorToggle = this.page.getByLabel('Select a vendor activate');
    await vendorToggle.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await vendorToggle.click();

    const searchInput = this.page.locator('input[aria-label="Select a vendor"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(vendor);
    await this.page.waitForTimeout(1000);

    const option = this.page.locator('.ui-select-choices-row').filter({ hasText: vendor }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async enterVendorItemName(name: string) {
    await this.vendorItemNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.vendorItemNameInput.fill(name);
    await this.page.waitForTimeout(500);
  }

  async selectProduct(productName: string) {
    const productToggle = this.page.getByLabel('Select a product activate').first();
    await productToggle.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await productToggle.click();

    const searchInput = this.page.locator('input[aria-label="Select a product"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(productName);
    await this.page.waitForTimeout(2000);

    const option = this.page.locator('.ui-select-choices-row').filter({ hasText: productName }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async clickAddPackagingOption() {
    await this.addPackagingOptionButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addPackagingOptionButton.click();
    await this.page.waitForTimeout(500);
  }

  async fillPackagingDetails(packaging: string, quantity: string, unit: string, price: string) {
    const row = this.page.locator('.ui-grid-row').last();
    const cells = row.locator('.ui-grid-cell');

    await cells.nth(0).locator('.ui-grid-cell-contents').click();
    await this.page.waitForTimeout(500);
    await cells.nth(0).locator('input').fill(packaging);
    await this.page.waitForTimeout(300);

    await cells.nth(1).locator('.ui-grid-cell-contents').click();
    await this.page.waitForTimeout(500);
    await cells.nth(1).locator('input').fill(quantity);
    await this.page.waitForTimeout(300);

    await cells.nth(2).locator('.ui-grid-cell-contents').click();
    await this.page.waitForTimeout(500);
    await cells.nth(2).locator('select').selectOption({ label: unit });
    await this.page.waitForTimeout(300);

    await cells.nth(3).locator('.ui-grid-cell-contents').click();
    await this.page.waitForTimeout(500);
    await cells.nth(3).locator('input').fill(price);
    await this.page.waitForTimeout(500);
  }

  async searchVendorItem(name: string) {
    const searchInput = this.page.locator('input[ng-model="filterValue"][placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.clear();
    await searchInput.fill(name);
    await this.page.waitForTimeout(2000);
  }

  async clickVendorItemSearchResult(name: string) {
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await row.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async clickEditVendorItem() {
    const editButton = this.page.locator('button[ui-sref*="vendorProductEdit"]');
    await editButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async checkAndFixPackagingRatio(ratioValue: string) {
    const lastRow = this.page.locator('.ui-grid-row').last();
    await lastRow.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);

    // Find the Ratio cell in the last row (typically the last or second-to-last column)
    const cells = lastRow.locator('.ui-grid-cell');
    const cellCount = await cells.count();

    // Look for a cell containing "0" as the ratio value
    for (let i = 0; i < cellCount; i++) {
      const cellText = await cells.nth(i).locator('.ui-grid-cell-contents').textContent();
      if (cellText?.trim() === '0') {
        await cells.nth(i).locator('.ui-grid-cell-contents').click();
        await this.page.waitForTimeout(500);
        const input = cells.nth(i).locator('input');
        await input.waitFor({ state: 'visible', timeout: TIMEOUT.default });
        await input.clear();
        await input.fill(ratioValue);
        await this.page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  }

  async setOrderGuide(value: string) {
    const lastRow = this.page.locator('.ui-grid-row').last();
    const cells = lastRow.locator('.ui-grid-cell');
    const cellCount = await cells.count();
    // Order Guide is the last column
    const orderGuideCell = cells.nth(cellCount - 1);
    await orderGuideCell.locator('.ui-grid-cell-contents').click();
    await this.page.waitForTimeout(500);
    await orderGuideCell.locator('select').selectOption({ label: value });
    await this.page.waitForTimeout(500);
  }

  async scrollToBottomAndSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async clickSave() {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyVendorItemCreated(vendorItemName: string) {
    await this.navigateViaLeftNav();
    await this.verifyVendorItemsPageLoaded();

    const searchInput = this.page.locator('input[ng-model="filterValue"][placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.click();
    await searchInput.clear();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.type(vendorItemName);
    await this.page.waitForTimeout(2000);

    const row = this.page.getByRole('row').filter({ hasText: vendorItemName }).first();
    await expect(row).toBeVisible({ timeout: TIMEOUT.default });
  }
}
