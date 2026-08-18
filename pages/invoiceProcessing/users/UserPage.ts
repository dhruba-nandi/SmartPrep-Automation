import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class UserPage extends BasePage {
  private readonly setupNavLink: Locator;
  private readonly setupUsersLink: Locator;
  private readonly showDropdownButton: Locator;
  private readonly userSearchInput: Locator;
  private readonly officeDropdown: Locator;
  private readonly editButton: Locator;
  private readonly rolesSelect: Locator;
  private readonly emailInput: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.setupNavLink = page.getByText('Setup', { exact: true }).first();
    this.setupUsersLink = page.getByRole('button', { name: /users/i }).first();
    this.showDropdownButton = page.locator('button.btn-info.dropdown-toggle');
    this.userSearchInput = page.locator('input[ng-model="filterValue"][placeholder="Search"]');
    this.officeDropdown = page.locator('select[name="office"]');
    this.editButton = page.getByRole('button', { name: /edit/i }).first();
    this.rolesSelect = page.locator('select[name="role"]');
    this.emailInput = page.locator('input[type="email"][name="email"]');
    this.saveButton = page.getByRole('button', { name: /save/i }).first();
  }

  async navigateToSetupUsersViaLeftNav() {
    await this.navigateTo(this.baseUrl, TIMEOUT.extended);
    await this.setupNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.setupNavLink.click();
    await this.setupUsersLink.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.setupUsersLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async selectMarginEdgeStaff() {
    await this.showDropdownButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.showDropdownButton.click();
    await this.page.waitForTimeout(500);
    const marginEdgeStaffOption = this.page.locator('a, li, [role="menuitem"]').filter({ hasText: /marginedge staff/i }).first();
    await marginEdgeStaffOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await marginEdgeStaffOption.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async searchUser(name: string) {
    await this.userSearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.userSearchInput.fill(name);
    await this.page.waitForTimeout(2000);
  }

  async clearUserSearch() {
    await this.userSearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.userSearchInput.clear();
    await this.page.waitForTimeout(1000);
  }

  async openUserRow(rowIndex: number) {
    const row = this.page.locator('.ui-grid-canvas .ui-grid-row').nth(rowIndex - 1);
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const cellContent = row.locator('.ui-grid-cell-contents').first();
    await cellContent.dblclick();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(3000);
  }

  async clickEditUser() {
    await this.editButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.editButton.click();
    await this.page.waitForTimeout(2000);
  }

  async selectRoles(roleLabels: string[]) {
    await this.rolesSelect.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.rolesSelect.selectOption(roleLabels.map((label) => ({ label })));
    await this.page.waitForTimeout(500);
  }

  async selectOffice(officeName: string) {
    await this.officeDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.officeDropdown.selectOption({ label: officeName });
    await this.page.waitForTimeout(500);
  }

  async selectFirstOffice() {
    await this.officeDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    const options = this.officeDropdown.locator('option');
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const value = await options.nth(i).getAttribute('value');
      if (value && value !== '?') {
        await this.officeDropdown.selectOption({ index: i });
        break;
      }
    }
    await this.page.waitForTimeout(500);
  }

  async enterEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(500);
  }

  async scrollToBottomAndSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }
}
