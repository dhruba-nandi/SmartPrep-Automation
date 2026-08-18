import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class TeamAssignmentsPage extends BasePage {
  private readonly centralNavLink: Locator;
  private readonly usersLink: Locator;
  private readonly teamAssignmentsButton: Locator;
  private readonly searchInput: Locator;
  private readonly saveChangesButton: Locator;

  constructor(page: Page) {
    super(page);
    this.centralNavLink = page.getByText('Central', { exact: true }).first();
    this.usersLink = page.getByRole('button', { name: /users/i }).first();
    this.teamAssignmentsButton = page.getByRole('button', { name: /team assignments/i });
    this.searchInput = page.locator('input[name="filter"][placeholder="Search"]');
    this.saveChangesButton = page.getByRole('button', { name: /save changes/i });
  }

  async navigateToUsersViaLeftNav() {
    await this.navigateTo(this.baseUrl, TIMEOUT.extended);
    await this.centralNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.centralNavLink.click();
    await this.usersLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.usersLink.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async clickTeamAssignments() {
    await this.teamAssignmentsButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.teamAssignmentsButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async searchAnalyst(analystName: string) {
    await this.searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.searchInput.fill(analystName);
    await this.page.waitForTimeout(2000);
  }

  async clearSearch() {
    await this.searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.searchInput.clear();
    await this.page.waitForTimeout(1000);
  }

  async selectLeadAnalystFromDropdown() {
    const autocompleteInput = this.page.locator('input.MuiAutocomplete-input').first();
    await autocompleteInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await autocompleteInput.click();
    await autocompleteInput.clear();
    await autocompleteInput.fill('Lead Analyst');
    await this.page.waitForTimeout(1000);

    const leadAnalystOption = this.page.getByRole('option', { name: /lead analyst/i }).first();
    await leadAnalystOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await leadAnalystOption.click();
    await this.page.waitForTimeout(500);
  }

  async clickSaveChanges() {
    await this.saveChangesButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const isDisabled = await this.saveChangesButton.isDisabled();
    if (isDisabled) {
      console.log('Save Changes button is disabled — no changes to save.');
      return;
    }
    await this.saveChangesButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }
}
