import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class BarItemsPage extends BasePage {
  private readonly recipesNavLink: Locator;
  private readonly barItemsLink: Locator;
  readonly heading: Locator;
  private readonly addBarItemLink: Locator;
  private readonly nameInput: Locator;
  private readonly typeInput: Locator;
  private readonly quantityInput: Locator;
  private readonly unitInput: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.recipesNavLink = page.getByText('Recipes', { exact: true }).first();
    this.barItemsLink = page.getByRole('button', { name: /bar items/i }).first();
    this.heading = page.getByRole('heading', { name: /bar items/i });
    this.addBarItemLink = page.getByRole('link', { name: 'Add Bar Item' });
    this.nameInput = page.getByPlaceholder('Name', { exact: true });
    this.typeInput = page.getByPlaceholder('Select a Recipe Type...');
    this.quantityInput = page.getByRole('spinbutton', { name: 'Quantity' });
    this.unitInput = page.getByPlaceholder('Select unit');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateToBarItems() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.recipesNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.recipesNavLink.click();
    await this.barItemsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.barItemsLink.click();
    await this.waitForPageLoad();
  }

  async verifyBarItemsPageLoaded() {
    await expect(this.page).toHaveURL(/bar.item|baritem|bar_item/i);
    await expect(this.heading).toBeVisible({ timeout: TIMEOUT.default });
  }

  async openAddBarItemForm() {
    await this.addBarItemLink.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addBarItemLink.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async fillBarItemDetails(name: string, type: string, quantity: string, unit: string) {
    await this.nameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.nameInput.fill(name);

    await this.typeInput.click();
    await this.typeInput.fill(type);
    await this.page.getByRole('option', { name: new RegExp(`^${type}$`, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    await this.quantityInput.fill(quantity);

    await this.unitInput.click();
    await this.unitInput.fill(unit);
    await this.page.getByRole('option', { name: new RegExp(unit, 'i') }).first().click();
    await this.page.waitForTimeout(500);
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
    await this.page.getByRole('option', { name: new RegExp(unit, 'i') }).first().click();
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

  async setGlobalMenuPrice(price: string) {
    const priceInput = this.page.getByRole('textbox', { name: 'Global Menu Price' });
    await priceInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await priceInput.clear();
    await priceInput.fill(price);
    await this.page.waitForTimeout(500);
  }

  async clickSave() {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyRedirectedToBarItemsList() {
    await expect(this.page).toHaveURL(/#\/barItem$/, { timeout: TIMEOUT.long });
    await expect(this.page).toHaveTitle('Bar Items', { timeout: TIMEOUT.default });
    await expect(this.heading).toBeVisible({ timeout: TIMEOUT.default });
  }

  async searchBarItem(name: string) {
    const searchInput = this.page.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(name);
    await this.page.waitForTimeout(2000);
  }

  async getBarItemCost(name: string): Promise<string> {
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const cells = row.getByRole('cell');
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).textContent())?.trim() || '';
      if (/^\$?\d+(\.\d+)?$/.test(text)) {
        return text.replace('$', '');
      }
    }
    return '';
  }

  async openBarItemByName(name: string) {
    const cell = this.page.getByRole('cell', { name });
    await cell.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await cell.click();
    await this.page.waitForURL(/\/recipe\/\d+/, { timeout: TIMEOUT.long });
    await this.waitForPageLoad();
  }

  async getDetailPagePourCost(): Promise<string> {
    const pourCostInput = this.page.getByRole('textbox', { name: 'Pour Cost' });
    await pourCostInput.scrollIntoViewIfNeeded();
    await pourCostInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    return (await pourCostInput.inputValue()).trim();
  }

  async selectBarItemCheckbox(name: string) {
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const checkbox = row.getByRole('checkbox').first();
    await checkbox.click();
    await this.page.waitForTimeout(500);
  }

  async clickManageCostAlerts() {
    const manageCostAlertsButton = this.page.getByRole('button', { name: /manage cost alerts/i });
    await manageCostAlertsButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await manageCostAlertsButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickCreateCostAlert() {
    const createOption = this.page.getByRole('menuitem', { name: /create cost alert/i });
    await createOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await createOption.click();
    await this.page.waitForTimeout(1000);
  }

  async clickSetAlert() {
    const setAlertButton = this.page.getByRole('button', { name: /set alert/i });
    await setAlertButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await setAlertButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async verifyCostAlertStatus(name: string, expectedStatus: string) {
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const alertCell = row.getByRole('cell').last();
    await expect(alertCell).toBeVisible({ timeout: TIMEOUT.default });
    await expect(alertCell).toContainText(expectedStatus);
  }

  async clickEditAlert() {
    const editOption = this.page.getByRole('menuitem', { name: /edit alert/i });
    await editOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editOption.click();
    await this.page.waitForTimeout(1000);
  }

  async editCostAlertThreshold(under: string, over: string) {
    const underInput = this.page.getByRole('spinbutton').first();
    await underInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await underInput.fill(under);

    const overInput = this.page.getByRole('spinbutton').last();
    await overInput.fill(over);
  }

  async clickSaveChanges() {
    const saveButton = this.page.getByRole('button', { name: /save changes/i });
    await saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async clickDeleteAlert() {
    const deleteOption = this.page.getByRole('menuitem', { name: /delete alert/i });
    await deleteOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await deleteOption.click();
    await this.page.waitForTimeout(1000);
  }

  async confirmDeleteAlert() {
    const deleteButton = this.page.getByRole('button', { name: /delete/i });
    await deleteButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await deleteButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async verifyCostAlertDeleted(name: string) {
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const alertCell = row.getByRole('cell').last();
    await expect(alertCell).toBeVisible({ timeout: TIMEOUT.default });
    await expect(alertCell).not.toContainText('On');
  }
}
