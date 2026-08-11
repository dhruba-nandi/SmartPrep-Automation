import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class RecipeSetupPage extends BasePage {
  private readonly manageRecipeTypesButton: Locator;
  private readonly addRecipeTypeButton: Locator;
  private readonly nameInput: Locator;
  private readonly categoryDropdown: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.manageRecipeTypesButton = page.getByRole('link', { name: /manage recipe types/i });
    this.addRecipeTypeButton = page.getByRole('link', { name: /add a new recipe type/i });
    this.nameInput = page.locator('input.MuiOutlinedInput-input').first();
    this.categoryDropdown = page.getByRole('combobox');
    this.saveButton = page.getByRole('button', { name: /save/i });
  }

  async navigateToRecipeSetup() {
    await this.page.goto(`${this.baseUrl}/#/recipeSetup`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT.long });
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long }).catch(() => {});
    await this.page.waitForTimeout(3000);
  }

  async clickManageRecipeTypes() {
    await this.manageRecipeTypesButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.manageRecipeTypesButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long }).catch(() => {});
  }

  async clickAddNewRecipeType() {
    await this.addRecipeTypeButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addRecipeTypeButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long }).catch(() => {});
  }

  async fillRecipeTypeName(name: string) {
    await this.nameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.nameInput.fill(name);
  }

  async selectRecipeCategoryType(category: string) {
    await this.categoryDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.categoryDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: new RegExp(category, 'i') }).first().click();
    await this.page.waitForTimeout(500);
  }

  async clickSave() {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long }).catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async addRecipeType(name: string, category: string) {
    await this.clickAddNewRecipeType();
    await this.fillRecipeTypeName(name);
    await this.selectRecipeCategoryType(category);
    await this.clickSave();
  }
}
