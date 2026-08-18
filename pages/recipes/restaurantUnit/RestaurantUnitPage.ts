import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class RestaurantUnitPage extends BasePage {
  private readonly centralNavLink: Locator;
  private readonly restaurantUnitsLink: Locator;
  private readonly bulkAddRestaurantButton: Locator;
  private readonly cantFindCompanyLink: Locator;
  private readonly conceptDropdown: Locator;
  private readonly companyDropdown: Locator;
  private readonly crossUnitReportingCheckbox: Locator;
  private readonly restaurantUnitNameInput: Locator;
  private readonly stateDropdown: Locator;
  private readonly zipCodeInput: Locator;
  private readonly posDropdown: Locator;
  private readonly accountingDropdown: Locator;
  private readonly subscriptionInput: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.centralNavLink = page.getByText('Central', { exact: true }).first();
    this.restaurantUnitsLink = page.getByRole('button', { name: /restaurant units/i }).first();
    this.bulkAddRestaurantButton = page.getByRole('button', { name: /bulk add restaurant/i });
    this.cantFindCompanyLink = page.locator('a').filter({ hasText: /can't find your company/i });
    this.conceptDropdown = page.getByLabel('Select a Concept activate');
    this.companyDropdown = page.getByLabel('Select a Company activate');
    this.crossUnitReportingCheckbox = page.locator('input[name="includeInReports"]');
    this.restaurantUnitNameInput = page.locator('input[ng-model="unit.name"]');
    this.stateDropdown = page.getByLabel('Select a state activate');
    this.zipCodeInput = page.locator('[data-testid="restaurant-unit-zip-code"]');
    this.posDropdown = page.getByTestId('restaurant-unit-pos').getByLabel('Select a POS activate');
    this.accountingDropdown = page.getByTestId('restaurant-unit-accounting').getByLabel('Select an Accounting System activate');
    this.subscriptionInput = page.locator('input[ng-model="unit.subscription"]');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateToRestaurantUnits() {
    await this.navigateTo(this.url('restaurantUnit'), TIMEOUT.long);
    await this.page.waitForLoadState('load', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async navigateViaLeftNav() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.centralNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.centralNavLink.click();
    await this.restaurantUnitsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.restaurantUnitsLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async verifyRestaurantUnitsPageLoaded() {
    await expect(this.page).toHaveURL(/restaurantUnit/, { timeout: TIMEOUT.long });
  }

  async clickBulkAddRestaurant() {
    await this.bulkAddRestaurantButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.bulkAddRestaurantButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickCantFindCompanyLink() {
    await this.cantFindCompanyLink.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.cantFindCompanyLink.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  private async selectFromUiSelect(toggle: Locator, value: string) {
    await toggle.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await toggle.click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.type(value);
    await this.page.waitForTimeout(1000);

    const option = this.page.locator('.ui-select-choices-row').filter({ hasText: value }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async selectConcept(concept: string) {
    await this.selectFromUiSelect(this.conceptDropdown, concept);
  }

  async selectCompany(company: string) {
    await this.selectFromUiSelect(this.companyDropdown, company);
  }

  async checkCrossUnitReporting() {
    const iCheckWrapper = this.page.locator('.icheckbox_minimal-blue').filter({ has: this.crossUnitReportingCheckbox });
    await iCheckWrapper.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const isChecked = await iCheckWrapper.evaluate(el => el.classList.contains('checked'));
    if (!isChecked) {
      await iCheckWrapper.click();
    }
    await this.page.waitForTimeout(500);
  }

  async enterRestaurantUnitName(name: string) {
    await this.restaurantUnitNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.restaurantUnitNameInput.fill(name);
    await this.page.waitForTimeout(500);
  }

  async selectState(state: string) {
    await this.selectFromUiSelect(this.stateDropdown, state);
  }

  async enterZipCode(zipCode: string) {
    await this.zipCodeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.zipCodeInput.fill(zipCode);
    await this.page.waitForTimeout(500);
  }

  async selectPOS(pos: string) {
    await this.selectFromUiSelect(this.posDropdown, pos);
  }

  async selectAccounting(accounting: string) {
    await this.selectFromUiSelect(this.accountingDropdown, accounting);
  }

  async enterSubscription(value: string) {
    await this.subscriptionInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.subscriptionInput.fill(value);
    await this.page.waitForTimeout(500);
  }

  async scrollToBottomAndSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);

    // Handle confirmation dialog
    const confirmModal = this.page.locator('.modal-dialog');
    await confirmModal.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const modalSaveButton = confirmModal.getByRole('button', { name: /save/i });
    await modalSaveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await modalSaveButton.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async verifyTenantCreated() {
    await expect(this.page).not.toHaveURL(/restaurantUnit\/bulkAdd/, { timeout: TIMEOUT.long });
    await expect(this.page).toHaveURL(/restaurantUnit/, { timeout: TIMEOUT.long });
  }
}
