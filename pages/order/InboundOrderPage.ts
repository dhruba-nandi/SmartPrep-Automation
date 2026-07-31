import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class InboundOrderPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToInboundOrders() {
    await this.page.goto(`${this.baseUrl}/#/order/inbound`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT.long });
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async selectFirstInboundOrder() {
    const checkbox = this.page.getByRole('checkbox', { name: 'Row 1, Row Selection Checkbox' });
    await checkbox.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await checkbox.click();
    await this.page.waitForTimeout(2000);
  }

  async clickShipOrder() {
    const shipButton = this.page.getByRole('button', { name: /ship order/i });
    await expect(shipButton).toBeEnabled({ timeout: TIMEOUT.default });
    await shipButton.click();

    // Confirm the ship modal
    const okButton = this.page.getByText('OK', { exact: true });
    await okButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await okButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }
}
