import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';
import * as fs from 'fs';
import * as path from 'path';

export class IntegrationsPage extends BasePage {
  private readonly setupNavLink: Locator;
  private readonly integrationsLink: Locator;
  private readonly queueSuffixSelect: Locator;
  private readonly mockSqsPacketInput: Locator;
  private readonly sendButton: Locator;

  constructor(page: Page) {
    super(page);
    this.setupNavLink = page.getByText('Setup', { exact: true }).first();
    this.integrationsLink = page.getByText('Integrations', { exact: true }).first();
    this.queueSuffixSelect = page.locator('select[name="queueSuffix"]');
    this.mockSqsPacketInput = page.locator('textarea#mockSqsEventPath');
    this.sendButton = page.locator('button[ng-click="sendMockSqsEvent()"]');
  }

  async navigateToIntegrations() {
    await this.navigateTo(this.baseUrl, TIMEOUT.extended);
    await this.setupNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.setupNavLink.click();
    await this.page.waitForTimeout(1000);

    // Scroll down in the left nav to reveal the Integrations link
    const navPanel = this.page.locator('nav, [class*="sidebar"], [class*="nav"]').first();
    await navPanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await this.page.waitForTimeout(1000);

    await this.integrationsLink.scrollIntoViewIfNeeded();
    await this.integrationsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.integrationsLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async selectQueueSuffix(queue: string) {
    await this.queueSuffixSelect.scrollIntoViewIfNeeded();
    await this.queueSuffixSelect.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.queueSuffixSelect.selectOption({ label: queue });
    await this.page.waitForTimeout(1000);
  }

  async fillMockSqsPacket(filePath: string) {
    const mockEvent = fs.readFileSync(filePath, 'utf-8').trim();
    await this.mockSqsPacketInput.scrollIntoViewIfNeeded();
    await this.mockSqsPacketInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.mockSqsPacketInput.clear();
    await this.mockSqsPacketInput.fill(mockEvent);
    await this.page.waitForTimeout(500);
  }

  async clickSend() {
    await this.sendButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.sendButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended }).catch(() => {});
    await this.page.waitForTimeout(2000);

    // Wait for success modal and dismiss it
    const successModal = this.page.locator('.modal-content').filter({ hasText: 'Success!' });
    await successModal.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const okButton = successModal.locator('button.bootbox-accept');
    await okButton.click();
    await this.page.waitForTimeout(1000);
  }
}
