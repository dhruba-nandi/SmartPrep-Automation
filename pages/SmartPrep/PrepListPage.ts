import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class PrepListPage extends BasePage {
  private readonly smartPrepNavLink: Locator;
  private readonly prepListLink: Locator;
  private readonly createFirstPrepListButton: Locator;
  private readonly createPrepListButton: Locator;
  private readonly prepListNameInput: Locator;
  private readonly addRecipeButton: Locator;
  private readonly addScheduleButton: Locator;
  private readonly selectStoresButton: Locator;
  private readonly doneButton: Locator;
  private readonly createTemplateButton: Locator;
  private readonly displayTimeInput: Locator;
  private readonly dueTimeInput: Locator;
  private readonly saveRecipeHeading: Locator;
  private readonly saveRecipeButton: Locator;
  private readonly cancelButton: Locator;
  private readonly prepListsTab: Locator;
  private readonly templatesTab: Locator;
  private readonly searchPrepListsInput: Locator;
  private readonly saveTemplateButton: Locator;
  private readonly saveChangesButton: Locator;
  private readonly addSectionButton: Locator;

  constructor(page: Page) {
    super(page);
    this.smartPrepNavLink = page.getByRole('button', { name: 'SmartPrep' });
    this.prepListLink = page.getByRole('button', { name: 'Prep List' });
    this.createFirstPrepListButton = page.getByRole('button', { name: /create prep list/i });
    this.createPrepListButton = page.getByRole('button', { name: 'Create template' });
    this.prepListNameInput = page.getByRole('textbox', { name: 'Prep list name*' });
    this.addRecipeButton = page.getByRole('button', { name: 'Add a recipe' });
    this.addScheduleButton = page.getByRole('button', { name: 'Add schedule' });
    this.selectStoresButton = page.getByRole('button', { name: 'Select stores' });
    this.doneButton = page.getByRole('button', { name: 'Done' });
    this.createTemplateButton = page.getByRole('button', { name: 'Create template' });
    this.displayTimeInput = page.getByRole('textbox', { name: 'Select display time' });
    this.dueTimeInput = page.getByRole('textbox', { name: 'Select due time' });
    this.saveRecipeHeading = page.getByRole('heading', { name: 'Save recipe', level: 1 });
    this.saveRecipeButton = page.getByRole('button', { name: 'Save recipe' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.prepListsTab = page.getByRole('tab', { name: 'Prep lists' });
    this.templatesTab = page.getByRole('tab', { name: 'Templates' });
    this.searchPrepListsInput = page.getByRole('textbox', { name: 'Search Prep Lists' });
    this.saveTemplateButton = page.getByRole('button', { name: 'Update template' });
    this.saveChangesButton = page.getByRole('button', { name: 'Save changes' });
    this.addSectionButton = page.getByRole('button', { name: /add section/i });
  }

  async navigateToPrepList() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.smartPrepNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.smartPrepNavLink.click();
    await this.prepListLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.prepListLink.click();
    await this.waitForPageLoad();
  }

  async clickCreatePrepList() {
    const button = this.createFirstPrepListButton.or(this.createPrepListButton);
    await button.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await button.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async fillPrepListName(name: string) {
    await this.prepListNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.prepListNameInput.fill(name);
  }

  async clickAddRecipe() {
    await this.addRecipeButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addRecipeButton.click();
    await this.page.waitForTimeout(500);
  }

  async addRecipeItem(recipeName: string) {
    const recipeInput = this.page.getByRole('textbox', { name: 'Type to see options' }).last();
    await recipeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await recipeInput.click();
    await recipeInput.pressSequentially(recipeName);
    await this.page.waitForTimeout(500);

    const newOption = this.page.getByRole('option', { name: new RegExp(recipeName) }).first();
    await newOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await newOption.click();
    await this.page.waitForTimeout(1000);
  }

  async clickAddShelfLife() {
    const addShelfLifeButton = this.page.getByRole('button', { name: /Add shelf life/i }).last();
    await addShelfLifeButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await addShelfLifeButton.click();
    await this.saveRecipeHeading.waitFor({ state: 'visible', timeout: TIMEOUT.default });
  }

  async fillSaveRecipeModal(
    shelfLifeQty: string,
    shelfLifeUnit: string,
    yieldQty: string,
    yieldUnit: string
  ) {
    const quantityInputs = this.page.getByRole('spinbutton', { name: 'Quantity' });
    const unitInputs = this.page.getByRole('textbox', { name: 'Select unit' });

    // Fill shelf life
    await quantityInputs.first().waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await quantityInputs.first().fill(shelfLifeQty);
    await unitInputs.first().click();
    await unitInputs.first().pressSequentially(shelfLifeUnit);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: new RegExp(shelfLifeUnit, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    // Fill yield
    await quantityInputs.last().fill(yieldQty);
    await unitInputs.last().click();
    await unitInputs.last().pressSequentially(yieldUnit);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: new RegExp(yieldUnit, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    await this.saveRecipeButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async addRecipeRow() {
    const addRecipeRow = this.page.getByRole('button', { name: 'Add recipe' });
    await addRecipeRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await addRecipeRow.click();
    await this.page.waitForTimeout(500);
  }

  private getNextAvailableTime(minutesAhead: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesAhead);
    const remainder = now.getMinutes() % 15;
    if (remainder !== 0) {
      now.setMinutes(now.getMinutes() + (15 - remainder));
    }
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  }

  async clickAddSchedule() {
    await this.addScheduleButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addScheduleButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectScheduleDay(dayAbbrev: string) {
    const dayButton = this.page.getByRole('button', { name: dayAbbrev });
    await dayButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await dayButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectTimeToDisplay() {
    const time = this.getNextAvailableTime(15);
    await this.displayTimeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.displayTimeInput.click();
    await this.page.getByRole('option', { name: time, exact: true }).click();
    await this.page.waitForTimeout(500);
    return time;
  }

  async selectTimeDue() {
    await this.dueTimeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.dueTimeInput.click();
    await this.page.getByRole('option').nth(1).click();
    await this.page.waitForTimeout(500);
  }

  async selectAssignedStores(storeName: string) {
    await this.selectStoresButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.selectStoresButton.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: new RegExp(storeName, 'i') }).first().click();
    await this.page.waitForTimeout(500);
    await this.doneButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickCreateTemplate() {
    await this.createTemplateButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.createTemplateButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyPrepListOnPrepListsTab(prepListName: string) {
    await this.prepListsTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.prepListsTab.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });

    await this.searchPrepListsInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.searchPrepListsInput.fill(prepListName);
    await this.page.waitForTimeout(1000);

    const prepListRow = this.page.getByRole('cell', { name: prepListName }).first();
    await expect(prepListRow).toBeVisible({ timeout: TIMEOUT.long });
  }

  async verifyPrepListOnTemplatesTab(prepListName: string) {
    await this.templatesTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.templatesTab.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });

    const templateRow = this.page.getByRole('row', { name: new RegExp(prepListName) }).first();
    await expect(templateRow).toBeVisible({ timeout: TIMEOUT.long });
  }

  async clickTemplatesTab() {
    await this.templatesTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.templatesTab.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async clickTemplateToEdit(templateName: string) {
    const templateRow = this.page.getByRole('row', { name: new RegExp(templateName) }).first();
    await templateRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const moreButton = templateRow.getByRole('button').last();
    await moreButton.click();
    await this.page.waitForTimeout(500);

    const editOption = this.page.getByRole('menuitem', { name: /edit/i }).first();
    await editOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editOption.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async editPrepListName(newName: string) {
    await this.prepListNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.prepListNameInput.clear();
    await this.prepListNameInput.fill(newName);
  }

  async addSection() {
    await this.addSectionButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addSectionButton.click();
    await this.page.waitForTimeout(500);
  }

  async updateDisplayTime() {
    const time = this.getNextAvailableTime(30);
    await this.displayTimeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.displayTimeInput.click();
    await this.page.getByRole('option', { name: time, exact: true }).click();
    await this.page.waitForTimeout(500);
    return time;
  }

  async clickSaveTemplate() {
    await this.saveTemplateButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveTemplateButton.click();
    await this.page.waitForTimeout(1000);
  }

  async selectApplyOptionAndSave() {
    const applyHeading = this.page.getByText('Choose where to apply');
    await applyHeading.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const firstOption = this.page.getByRole('radio').first();
    await firstOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await firstOption.click();
    await this.page.waitForTimeout(500);

    await this.saveChangesButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveChangesButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }
}
