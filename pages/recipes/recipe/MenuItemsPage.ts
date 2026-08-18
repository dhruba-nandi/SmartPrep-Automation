import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';
import * as path from 'path';

export class MenuItemsPage extends BasePage {
  private readonly recipesNavLink: Locator;
  private readonly menuItemsLink: Locator;
  readonly heading: Locator;
  private readonly addMenuItemLink: Locator;
  private readonly nameInput: Locator;
  private readonly typeInput: Locator;
  private readonly quantityInput: Locator;
  private readonly unitInput: Locator;
  private readonly saveButton: Locator;
  private readonly editRecipeButton: Locator;
  private readonly addStepButton: Locator;

  constructor(page: Page) {
    super(page);
    this.recipesNavLink = page.getByText('Recipes', { exact: true }).first();
    this.menuItemsLink = page.getByRole('button', { name: /menu items/i }).first();
    this.heading = page.getByRole('heading', { name: /menu items/i });
    this.addMenuItemLink = page.getByRole('link', { name: 'Add Menu Item' });
    this.nameInput = page.getByPlaceholder('Name', { exact: true });
    this.typeInput = page.getByPlaceholder('Select a Recipe Type...');
    this.quantityInput = page.getByRole('spinbutton', { name: 'Quantity' });
    this.unitInput = page.getByPlaceholder('Select unit');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.editRecipeButton = page.getByRole('button', { name: /edit recipe/i });
    this.addStepButton = page.getByRole('button', { name: /add step/i });
  }

  async navigateToMenuItems() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.recipesNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.recipesNavLink.click();
    await this.menuItemsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.menuItemsLink.click();
    await this.waitForPageLoad();
  }

  async verifyMenuItemsPageLoaded() {
    await expect(this.page).toHaveURL(/menu.item|menuitem|menu_item/i);
    await expect(this.heading).toBeVisible({ timeout: TIMEOUT.default });
  }

  async openAddMenuItemForm() {
    await this.addMenuItemLink.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addMenuItemLink.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async fillMenuItemDetails(name: string, type: string, quantity: string, unit: string) {
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

  async clickSave() {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyRedirectedToMenuItemsList() {
    await expect(this.page).toHaveURL(/#\/menuItem$/, { timeout: TIMEOUT.long });
    await expect(this.page).toHaveTitle('Menu Items', { timeout: TIMEOUT.default });
    await expect(this.heading).toBeVisible({ timeout: TIMEOUT.default });
  }

  async openMenuItemByName(name: string) {
    const cell = this.page.getByRole('cell', { name });
    await cell.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await cell.click();
    await this.page.waitForURL(/\/recipe\/\d+/, { timeout: TIMEOUT.long });
    await this.waitForPageLoad();
  }

  async openEditRecipeForm() {
    await this.editRecipeButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.editRecipeButton.click();
    await this.page.waitForURL(/\/recipe\/\d+\/edit/, { timeout: TIMEOUT.long });
    await this.waitForPageLoad();
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

  async verifyRecipeDetailPageLoaded() {
    await expect(this.page).toHaveURL(/\/recipe\/\d+\?category=MENU/, { timeout: TIMEOUT.default });
    await expect(this.page).toHaveTitle('Recipe', { timeout: TIMEOUT.default });
  }

  async toggleRecipeOff(): Promise<'deactivated' | 'in_use'> {
    const recipeToggle = this.page.locator('[data-testid="activationButton"]');
    await recipeToggle.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await recipeToggle.click();

    const recipeInUseModal = this.page.getByRole('dialog').filter({ hasText: /recipe in use/i });
    try {
      await recipeInUseModal.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    } catch {
      return 'deactivated';
    }

    if (await this.isVisible(recipeInUseModal)) {
      await this.page.waitForTimeout(3000);
      const modalButton = recipeInUseModal.getByRole('button').first();
      if (await this.isVisible(modalButton)) {
        await modalButton.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      await this.page.waitForTimeout(1000);
      return 'in_use';
    }

    return 'deactivated';
  }

  async verifyRecipeDisabled() {
    const disabledBanner = this.page.locator('div.tvA8-YbO7y6KD1lLM\\+3Rjw\\=\\=');
    await expect(disabledBanner).toBeVisible({ timeout: TIMEOUT.default });
    await expect(disabledBanner.locator('span')).toHaveText('Recipe Is Disabled');
  }

  async getMenuItemCost(name: string): Promise<string> {
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

  async searchMenuItem(name: string) {
    const searchInput = this.page.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(name);
    await this.page.waitForTimeout(2000);
  }

  async verifyMethodSteps(expectedMethods: string[]) {
    const methodHeading = this.page.getByRole('heading', { name: 'Method' });
    await methodHeading.scrollIntoViewIfNeeded();
    await expect(methodHeading).toBeVisible({ timeout: TIMEOUT.default });

    const methodSection = methodHeading.locator('..');
    for (let i = 0; i < expectedMethods.length; i++) {
      const stepNumber = `${i + 1}.`;
      const stepText = expectedMethods[i];

      // Verify step text is visible
      const stepSpan = methodSection.getByText(stepText);
      await expect(stepSpan).toBeVisible({ timeout: TIMEOUT.default });

      // Verify step number is visible
      const numberSpan = methodSection.getByText(stepNumber, { exact: true });
      await expect(numberSpan).toBeVisible({ timeout: TIMEOUT.default });

      // Verify image is visible for this step
      const methodImage = methodSection.getByAltText('Recipe Method Media').nth(i);
      await expect(methodImage).toBeVisible({ timeout: TIMEOUT.default });
    }
  }

  async scrollToMethodSection() {
    const methodSection = this.page.getByText('Method', { exact: true });
    await methodSection.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
  }

  async enterMethodText(stepIndex: number, text: string) {
    const textarea = this.page.locator('textarea.MuiInputBase-inputMultiline:not([aria-hidden="true"]):not([readonly])').nth(stepIndex);
    await textarea.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await textarea.click();
    await this.page.waitForTimeout(300);
    await textarea.fill(text);
    await this.page.waitForTimeout(500);
  }

  async uploadMethodAttachment(stepIndex: number, filePath: string) {
    const uploadButton = this.page.locator('[data-testid="fileUploadButton"]').nth(stepIndex);
    await uploadButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    // Click once to move focus away from the textbox to the upload button
    await uploadButton.click();
    await this.page.waitForTimeout(500);

    // Click again to trigger the file chooser
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await uploadButton.click();

    const fileChooser = await fileChooserPromise;
    const absolutePath = path.resolve(filePath);
    await fileChooser.setFiles(absolutePath);
    await this.page.waitForTimeout(2000);
  }

  async uploadUnsupportedMethodAttachment(stepIndex: number, filePath: string) {
    const fixturesDir = path.resolve('fixtures', 'files', 'recipeMethod');
    const absolutePath = path.resolve(fixturesDir, filePath);
    const fileInput = this.page.locator('input[type="file"]').nth(stepIndex);
    await fileInput.setInputFiles(absolutePath);
    await this.page.waitForTimeout(2000);

    // Verify the unsupported format modal appears
    const modal = this.page.getByRole('dialog').filter({ hasText: /unsupported image format detected/i });
    await modal.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await expect(modal).toBeVisible();

    const modalText = await modal.textContent();
    expect(modalText).toContain('The image you uploaded is not in a supported format (PNG, JPG, or JPEG)');
    expect(modalText).toContain('Please select an image in a supported format and try again');

    // Dismiss the modal
    const closeButton = modal.getByRole('button').first();
    if (await this.isVisible(closeButton)) {
      await closeButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async clickAddStep() {
    await this.addStepButton.scrollIntoViewIfNeeded();
    await this.addStepButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addStepButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickAddIngredient() {
    const addButton = this.page.getByRole('button', { name: 'Add ingredient' });
    await addButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await addButton.click();
    await this.page.waitForTimeout(500);
  }

  async editIngredientUnit(ingredientIndex: number, newUnit: string) {
    const ingredientRows = this.page.getByRole('row').filter({ has: this.page.getByPlaceholder('Unit') });
    const row = ingredientRows.nth(ingredientIndex);

    const unitInput = row.getByPlaceholder('Unit');
    await unitInput.click();
    await unitInput.fill(newUnit);
    await this.page.getByRole('option', { name: new RegExp(`^${newUnit}$`, 'i') }).first().click();
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

  async getDetailPageIngredientTotal(): Promise<string> {
    await this.page.waitForTimeout(2000);
    // Scroll to the very bottom of the page
    await this.page.evaluate(async () => {
      const scrollableElements = document.querySelectorAll('*');
      for (const el of scrollableElements) {
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTop = el.scrollHeight;
        }
      }
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(2000);
    const ingredientTotalInput = this.page.getByRole('textbox', { name: 'Ingredient Total' });
    await ingredientTotalInput.scrollIntoViewIfNeeded();
    await ingredientTotalInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    return (await ingredientTotalInput.inputValue()).trim();
  }

  async getDetailPagePlateCost(): Promise<string> {
    const plateCostInput = this.page.getByRole('textbox', { name: 'Plate Cost' });
    await plateCostInput.scrollIntoViewIfNeeded();
    await plateCostInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    return (await plateCostInput.inputValue()).trim();
  }

  async clickMoreOptions() {
    const moreOptionsButton = this.page.getByRole('button', { name: 'More Options', exact: true });
    await moreOptionsButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await moreOptionsButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickCreateDuplicateRecipe() {
    const duplicateOption = this.page.getByRole('menuitem', { name: /create duplicate recipe/i });
    await duplicateOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await duplicateOption.click();
    await this.page.waitForURL(/\/recipe\/\d+\/edit/, { timeout: TIMEOUT.long });
    await this.waitForPageLoad();
  }

  async scrollToBottomAndSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async getRecipeDetailName(): Promise<string> {
    // On the recipe detail page, the name is displayed as a heading
    const nameHeading = this.page.getByRole('heading').first();
    await nameHeading.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    return (await nameHeading.textContent())?.trim() || '';
  }

  async verifyCostAlertStatus(name: string, expectedStatus: string) {
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const alertCell = row.getByRole('cell').last();
    await expect(alertCell).toBeVisible({ timeout: TIMEOUT.default });
    await expect(alertCell).toContainText(expectedStatus);
  }

  async selectMenuItemCheckbox(name: string) {
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

  async clickEditAlert() {
    const editOption = this.page.getByRole('menuitem', { name: /edit alert/i });
    await editOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editOption.click();
    await this.page.waitForTimeout(1000);
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

  async addMultipleMethods(methods: { text: string; filePath: string }[]) {
    const fixturesDir = path.resolve('fixtures', 'files', 'recipeMethod');

    for (let i = 0; i < methods.length; i++) {
      if (i > 0) {
        await this.clickAddStep();
      }

      await this.scrollToMethodSection();
      const fullPath = path.resolve(fixturesDir, methods[i].filePath);
      await this.enterMethodText(i, methods[i].text);
      await this.uploadMethodAttachment(i, fullPath);
    }
  }
}
