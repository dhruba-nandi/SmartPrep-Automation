import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class CentralVendorPage extends BasePage {
  private readonly centralNavLink: Locator;
  private readonly vendorsLink: Locator;
  private readonly vendorSearchInput: Locator;
  private readonly addInboundEdiFormatButton: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.centralNavLink = page.locator('#navbar_central');
    this.vendorsLink = page.locator('a[href="#/central/vendor"]');
    this.vendorSearchInput = page.getByRole('textbox', { name: /search central vendors/i });
    this.addInboundEdiFormatButton = page.locator('button[ng-click="addRow()"]');
    this.saveButton = page.getByRole('button', { name: /save/i }).first();
  }

  async navigateToCentralVendors() {
    await this.navigateTo(this.baseUrl, TIMEOUT.extended);
    await this.centralNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.centralNavLink.click();
    await this.page.waitForTimeout(1000);

    // Scroll down in the left nav to reveal the Vendors link
    const navPanel = this.page.locator('nav, [class*="sidebar"], [class*="nav"]').first();
    await navPanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await this.page.waitForTimeout(1000);

    await this.vendorsLink.scrollIntoViewIfNeeded();
    await this.vendorsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.vendorsLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async searchCentralVendor(vendorName: string) {
    await this.vendorSearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.vendorSearchInput.clear();
    await this.vendorSearchInput.fill(vendorName);
    await this.page.waitForTimeout(2000);
  }

  async openCentralVendorRow() {
    const vendorRow = this.page.locator('.ui-grid-row').first();
    await vendorRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await vendorRow.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async hasCentralVendorEdiFormatRow(value: string): Promise<boolean> {
    const ediGrid = this.page.locator('.grid-on-form');
    await ediGrid.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.page.waitForTimeout(1000);
    const ediRow = ediGrid.locator('.ui-grid-cell-contents').filter({ hasText: new RegExp(value, 'i') });
    return this.isVisible(ediRow);
  }

  async addCentralVendorInboundEdiFormat(formatName: string) {
    await this.addInboundEdiFormatButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addInboundEdiFormatButton.click();
    await this.page.waitForTimeout(1000);

    // Double-click the new row's cell via evaluate to reliably enter edit mode
    await this.page.evaluate(() => {
      const ediGrid = document.querySelector('.grid-on-form');
      const cells = ediGrid?.querySelectorAll('.ui-grid-cell-contents.ng-binding');
      const lastCell = cells?.[cells.length - 1];
      if (lastCell) {
        lastCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
      }
    });
    await this.page.waitForTimeout(1000);

    // After dblclick, an input appears inside the cell's parent .ui-grid-cell
    const ediGrid = this.page.locator('.grid-on-form');
    const cellInput = ediGrid.locator('.ui-grid-cell input[type="text"]').last();
    await cellInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await cellInput.fill(formatName);
    await this.page.waitForTimeout(1000);
  }

  async scrollToBottomAndSaveCentralVendor() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }
}
