import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class PriorityReportPage extends BasePage {
  private readonly setupNavLink: Locator;
  private readonly priorityReportLink: Locator;
  private readonly irStartButton: Locator;
  private readonly recStartButton: Locator;
  private readonly frStartButton: Locator;
  private readonly howManyModalOkButton: Locator;

  constructor(page: Page) {
    super(page);
    this.setupNavLink = page.getByText('Setup', { exact: true }).first();
    this.priorityReportLink = page.getByRole('button', { name: /priority report/i }).first();
    this.irStartButton = page.locator('button.btn-success[ng-click="startTasks(\'INITIAL_REVIEW\')"]');
    this.recStartButton = page.locator('button.btn-success[ng-click="startTasks(\'PENDING_RECONCILIATION\')"]');
    this.frStartButton = page.locator('button.btn-success[ng-click="startTasks(\'FINAL_REVIEW\')"]');
    this.howManyModalOkButton = page.locator('button[ng-click="howManyBulkModalOk()"]');
  }

  async navigateToPriorityReport() {
    await this.navigateTo(this.baseUrl, TIMEOUT.extended);
    await this.setupNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.setupNavLink.click();
    await this.priorityReportLink.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.priorityReportLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async startInitialReview() {
    await this.irStartButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.irStartButton.click();
    await this.howManyModalOkButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.howManyModalOkButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(3000);
    // Wait for the order page to fully load (vendor dropdown signals readiness)
    const vendorDropdown = this.page.getByLabel('Select a vendor activate');
    await vendorDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.page.waitForTimeout(1000);
  }

  async startReconciliation() {
    await this.recStartButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.recStartButton.click();
    await this.howManyModalOkButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.howManyModalOkButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(3000);
  }

  async startFinalReview() {
    await this.frStartButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.frStartButton.click();
    await this.howManyModalOkButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.howManyModalOkButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(3000);
  }
}
