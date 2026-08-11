import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class PreparedItemsPage extends BasePage {
  private readonly recipesNavLink: Locator;
  private readonly preparedItemsLink: Locator;
  readonly heading: Locator;
  private readonly addPreparedItemLink: Locator;
  private readonly nameInput: Locator;
  private readonly typeInput: Locator;
  private readonly quantityInput: Locator;
  private readonly unitInput: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.recipesNavLink = page.getByText('Recipes', { exact: true }).first();
    this.preparedItemsLink = page.getByRole('button', { name: /prepared items/i }).first();
    this.heading = page.getByRole('heading', { name: /prepared items/i });
    this.addPreparedItemLink = page.getByRole('link', { name: 'Add Prepared Item' });
    this.nameInput = page.getByPlaceholder('Name', { exact: true });
    this.typeInput = page.getByPlaceholder('Select a Recipe Type...');
    this.quantityInput = page.getByRole('spinbutton', { name: 'Quantity' });
    this.unitInput = page.getByPlaceholder('Select unit');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateToPreparedItems() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.recipesNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.recipesNavLink.click();
    await this.preparedItemsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.preparedItemsLink.click();
    await this.waitForPageLoad();
  }

  async verifyPreparedItemsPageLoaded() {
    await expect(this.page).toHaveURL(/prepared.item|prepareditem|prepared_item/i);
    await expect(this.heading).toBeVisible({ timeout: TIMEOUT.default });
  }

  async openAddPreparedItemForm() {
    await this.addPreparedItemLink.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addPreparedItemLink.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async fillPreparedItemDetails(name: string, type: string, quantity: string, unit: string) {
    await this.nameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.nameInput.fill(name);

    await this.typeInput.click();
    await this.typeInput.fill(type);
    await this.page.getByRole('option', { name: new RegExp(`^${type}$`, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    await this.quantityInput.fill(quantity);

    await this.unitInput.click();
    await this.unitInput.fill(unit);
    await this.page.getByRole('option', { name: new RegExp(`^${unit}$`, 'i') }).first().click();
    await this.page.waitForTimeout(500);
  }

  async checkCommissaryRecipe() {
    const commissaryCheckbox = this.page.getByRole('checkbox', { name: /commissary recipe/i });
    await commissaryCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await commissaryCheckbox.scrollIntoViewIfNeeded();
    await commissaryCheckbox.click();
    await this.page.waitForTimeout(1000);
  }

  async fillOrderGuidePackaging(packaging: string, quantity: string, unit: string, orderGuide: string) {
    const packagingInput = this.page.getByTestId('commissaryPackagingName');
    await packagingInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await packagingInput.fill(packaging);

    const ogQuantityInput = this.page.getByRole('spinbutton', { name: 'Quantity' }).last();
    await ogQuantityInput.fill(quantity);

    const ogUnitInput = this.page.getByRole('textbox', { name: 'Packaging Unit' });
    await ogUnitInput.click();
    await ogUnitInput.fill(unit);
    await this.page.getByRole('option', { name: new RegExp(`^${unit}$`, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    const orderGuideInput = this.page.getByRole('textbox', { name: 'commissaryPackagingOrderGuide' });
    const currentValue = await orderGuideInput.inputValue();
    if (currentValue.toLowerCase() !== orderGuide.toLowerCase()) {
      await orderGuideInput.click();
      await this.page.getByRole('option', { name: new RegExp(orderGuide, 'i') }).first().click();
      await this.page.waitForTimeout(500);
    }
  }

  async addIngredient(item: string, quantity: string, unit: string) {
    const itemInput = this.page.getByPlaceholder('Type to see options').last();
    await itemInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await itemInput.click();
    await itemInput.fill(item);
    await this.page.getByRole('option', { name: item }).first().click();
    await this.page.waitForTimeout(500);

    const ingredientRow = this.page.getByRole('row').filter({ has: this.page.getByPlaceholder('Type to see options') }).last();
    await ingredientRow.getByRole('textbox', { name: 'Quantity' }).fill(quantity);

    const unitInput = ingredientRow.getByPlaceholder('Unit');
    await unitInput.click();
    await unitInput.fill(unit);
    await this.page.getByRole('option', { name: new RegExp(`^${unit}$`, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    // Handle conversion modal if it appears
    const howManyInput = this.page.getByPlaceholder('how many');
    if (await this.isVisible(howManyInput)) {
      await howManyInput.fill('1');
      const unitsCombobox = this.page.getByRole('combobox');
      await unitsCombobox.click();
      await this.page.waitForTimeout(500);
      await this.page.getByRole('option').first().click();
      await this.page.waitForTimeout(500);
      await this.page.getByRole('button', { name: 'Save' }).click();
      await this.page.waitForTimeout(500);
    }
  }

  async clickSave() {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyRedirectedToPreparedItemsList() {
    await expect(this.page).toHaveURL(/#\/preparedItem$/, { timeout: TIMEOUT.long });
    await expect(this.page).toHaveTitle('Prepared Items', { timeout: TIMEOUT.default });
    await expect(this.heading).toBeVisible({ timeout: TIMEOUT.default });
  }

  async searchAndVerifyPreparedItem(name: string) {
    const searchInput = this.page.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(name);
    await this.page.waitForTimeout(2000);
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await expect(row).toBeVisible({ timeout: TIMEOUT.default });
  }
}
