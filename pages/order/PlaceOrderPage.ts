import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class PlaceOrderPage extends BasePage {
  private readonly ordersNavLink: Locator;
  private readonly placeNewOrderLink: Locator;
  private readonly sendButton: Locator;

  constructor(page: Page) {
    super(page);
    this.ordersNavLink = page.getByText('Orders', { exact: true }).first();
    this.placeNewOrderLink = page.getByRole('button', { name: 'Place New Order' });
    this.sendButton = page.getByRole('button', { name: /send/i });
  }

  async navigateToPlaceNewOrder() {
    await this.page.goto(`${this.baseUrl}/#/order/new`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT.long });
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async selectVendor(vendor: string) {
    const vendorToggle = this.page.getByLabel('Select a vendor activate');
    await vendorToggle.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await vendorToggle.click();

    const option = this.page.getByRole('option', { name: vendor });
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await option.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(3000);
  }

  async setItemQuantity(itemName: string, quantity: string) {
    const row = this.page.getByRole('row').filter({ hasText: itemName }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await row.scrollIntoViewIfNeeded();
    const quantityInput = row.getByRole('spinbutton');
    await quantityInput.fill(quantity);
    await this.page.waitForTimeout(1000);
  }

  async clickSend() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.sendButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.sendButton.click();
    await this.page.waitForTimeout(1000);

    // Wait for the Confirm Order modal (not a dialog role, it's a generic div)
    await this.page.getByRole('heading', { name: 'Confirm Order' }).waitFor({ state: 'visible', timeout: TIMEOUT.default });
    // Click the Send button inside the modal (last Send button on page)
    await this.page.getByRole('button', { name: /send/i }).last().click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }
}
