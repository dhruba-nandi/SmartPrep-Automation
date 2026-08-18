import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class CountSheet extends BasePage {
  private readonly addCountSheetButton: Locator;
  private readonly countSheetNameInput: Locator;
  private readonly addRecipeButton: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addCountSheetButton = page.getByRole('button', { name: /add count sheet/i });
    this.countSheetNameInput = page.locator('input[name="name"][ng-model="inventorySetup.name"]');
    this.addRecipeButton = page.getByRole('button', { name: /add recipe/i });
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateToInventorySetup() {
    await this.page.goto(this.url('inventorySetup'), { waitUntil: 'domcontentloaded', timeout: TIMEOUT.long });
    await this.page.waitForLoadState('load', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async clickAddCountSheet() {
    await this.addCountSheetButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addCountSheetButton.click();
    await this.waitForPageLoad();
  }

  async fillCountSheetName(name: string) {
    await this.countSheetNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.countSheetNameInput.fill(name);
  }

  async clickAddRecipe() {
    await this.addRecipeButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addRecipeButton.click();
    await this.page.waitForTimeout(1000);
  }

  async searchAndSelectRecipe(recipeName: string) {
    const recipeDropdown = this.page.locator('.ui-select-match').filter({ hasText: /enter at least 2 characters to search for a recipe/i });
    await recipeDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await recipeDropdown.click();
    await this.page.waitForTimeout(1000);

    const recipeSearchInput = this.page.getByLabel('Select a recipe', { exact: true });
    await recipeSearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await recipeSearchInput.fill(recipeName);
    await this.page.waitForTimeout(2000);

    const recipeOption = this.page.locator('.ui-select-choices-row, [id^="ui-select-choices-row"]')
      .filter({ hasText: new RegExp(recipeName, 'i') }).first();
    await recipeOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await recipeOption.click();
    await this.page.waitForTimeout(1000);
  }

  async clickAddRecipeInModal() {
    const modalAddRecipeButton = this.page.locator('#newRecipeModal').getByRole('button', { name: /add recipe/i });
    await modalAddRecipeButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await modalAddRecipeButton.click();
    await this.page.waitForTimeout(1000);
  }

  async scrollToBottomAndSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);

    // Dismiss any bootbox alert (e.g. duplicate name error on re-runs)
    const bootboxOk = this.page.locator('.bootbox-accept');
    if (await this.isVisible(bootboxOk)) {
      await bootboxOk.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async openCountSheet(name: string) {
    const countSheetCell = this.page.locator('.ui-grid-cell-contents').filter({ hasText: name });
    await countSheetCell.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await countSheetCell.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async deleteRecipeFromCountSheet(recipeName: string) {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);

    const deleteButton = this.page.locator(`[data-testid="itemDeleteCS-${recipeName}"]`);
    await deleteButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();
    await this.page.waitForTimeout(1000);

    const bootboxOk = this.page.locator('.bootbox-accept');
    if (await this.isVisible(bootboxOk)) {
      await bootboxOk.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async verifyRecipeRemoved(recipeName: string) {
    const deleteButton = this.page.locator(`[data-testid="itemDeleteCS-${recipeName}"]`);
    await expect(deleteButton).not.toBeVisible({ timeout: TIMEOUT.default });
  }

  async verifyCountSheetCreated(name: string) {
    await this.page.goto(this.url('inventory'), { waitUntil: 'domcontentloaded', timeout: TIMEOUT.long });
    await this.page.waitForLoadState('load', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(5000);

    const enterCountDropdown = this.page.locator('button.btn.btn-primary.dropdown-toggle').filter({ hasText: /enter a count/i });
    await enterCountDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await enterCountDropdown.click();
    await this.page.waitForTimeout(1000);

    const countSheetOption = this.page.locator('ul.dropdown-menu a.ng-binding')
      .filter({ hasText: new RegExp(name, 'i') }).last();
    await expect(countSheetOption).toBeVisible({ timeout: TIMEOUT.default });

    await this.page.keyboard.press('Escape');
  }
}
