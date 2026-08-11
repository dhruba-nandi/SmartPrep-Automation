import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../BasePage';

export class CheckListPage extends BasePage {
  private readonly smartPrepNavLink: Locator;
  private readonly checklistLink: Locator;
  private readonly createFirstChecklistButton: Locator;
  private readonly createChecklistButton: Locator;
  private readonly templateNameInput: Locator;
  private readonly addTaskButton: Locator;
  private readonly addSectionButton: Locator;
  private readonly addScheduleButton: Locator;
  private readonly selectStoresButton: Locator;
  private readonly doneButton: Locator;
  private readonly createTemplateButton: Locator;
  private readonly tasksTab: Locator;
  private readonly createTaskButton: Locator;
  private readonly createNewTaskHeading: Locator;
  private readonly taskNameInput: Locator;
  private readonly responseTypeInput: Locator;
  private readonly photoRequiredCheckbox: Locator;
  private readonly descriptionInput: Locator;
  private readonly displayTimeInput: Locator;
  private readonly dueTimeInput: Locator;
  private readonly matchTasksButton: Locator;
  private readonly matchTasksHeading: Locator;
  private readonly matchTasksInput: Locator;
  private readonly matchTasksDrawerButton: Locator;
  private readonly checklistsTab: Locator;
  private readonly storesFilterButton: Locator;
  private readonly checklistFilterButton: Locator;
  private readonly scheduledFilterButton: Locator;
  private readonly selectAllOption: Locator;
  private readonly filterDoneButton: Locator;
  private readonly searchChecklistsInput: Locator;
  private readonly templatesTab: Locator;
  private readonly saveTemplateButton: Locator;
  private readonly saveChangesButton: Locator;

  constructor(page: Page) {
    super(page);
    this.smartPrepNavLink = page.getByRole('button', { name: 'SmartPrep' });
    this.checklistLink = page.getByRole('button', { name: 'Checklist' });
    this.createFirstChecklistButton = page.getByRole('button', { name: /create first checklist/i });
    this.createChecklistButton = page.getByRole('button', { name: 'Create checklist' });
    this.templateNameInput = page.getByPlaceholder('Name the template');
    this.addTaskButton = page.getByRole('button', { name: /^add (?:a )?task$/i });
    this.addSectionButton = page.getByRole('button', { name: /add section/i });
    this.addScheduleButton = page.getByRole('button', { name: 'Add schedule' });
    this.selectStoresButton = page.getByRole('button', { name: 'Select stores' });
    this.doneButton = page.getByRole('button', { name: 'Done' });
    this.createTemplateButton = page.getByRole('button', { name: 'Create template' });
    this.displayTimeInput = page.getByRole('textbox', { name: 'Select display time' });
    this.dueTimeInput = page.getByRole('textbox', { name: 'Select due time' });
    this.tasksTab = page.getByRole('tab', { name: 'Tasks' });
    this.createTaskButton = page.getByRole('button', { name: 'Create Task' });
    this.createNewTaskHeading = page.getByRole('heading', { name: 'Create New Task', level: 1 });
    this.taskNameInput = page.getByRole('textbox', { name: 'Task name*' });
    this.responseTypeInput = page.getByRole('textbox', { name: 'Select response type' });
    this.photoRequiredCheckbox = page.getByRole('checkbox', { name: 'Photo receipt required' });
    this.descriptionInput = page.getByRole('textbox', { name: 'Description' });
    this.matchTasksButton = page.getByRole('button', { name: /Match tasks/ });
    this.matchTasksHeading = page.getByRole('heading', { name: 'Match tasks', level: 1 });
    this.matchTasksInput = page.getByRole('textbox', { name: 'Type or paste tasks' });
    this.matchTasksDrawerButton = page.getByRole('button', { name: /Match tasks/ }).last();
    this.checklistsTab = page.getByRole('tab', { name: 'Checklists' });
    this.storesFilterButton = page.getByLabel('Stores', { exact: true });
    this.checklistFilterButton = page.getByLabel('Checklist', { exact: true });
    this.scheduledFilterButton = page.getByLabel('Scheduled', { exact: true });
    this.selectAllOption = page.getByRole('option', { name: 'Select All' });
    this.filterDoneButton = page.getByRole('button', { name: 'Done' });
    this.searchChecklistsInput = page.getByRole('textbox', { name: 'Search upcoming checklists' });
    this.templatesTab = page.getByRole('tab', { name: 'Templates' });
    this.saveTemplateButton = page.getByRole('button', { name: 'Save' });
    this.saveChangesButton = page.getByRole('button', { name: 'Save changes' });
  }

  async navigateToSmartPrep() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.smartPrepNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.smartPrepNavLink.click();
    await this.checklistLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.checklistLink.click();
    await this.waitForPageLoad();
  }

  async clickCreateChecklist() {
    const button = this.createFirstChecklistButton.or(this.createChecklistButton);
    await button.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await button.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async fillTemplateName(name: string) {
    await this.templateNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.templateNameInput.fill(name);
  }

  async editTemplateName(newName: string) {
    await this.templateNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.templateNameInput.clear();
    await this.templateNameInput.fill(newName);
  }

  async clickAddTask() {
    const addTask = this.addTaskButton.last();
    await addTask.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await addTask.click();
    await this.page.waitForTimeout(500);
  }

  async addTaskItem(taskName: string, responseType: string) {
    const taskInput = this.page.getByRole('textbox', { name: 'Type to see options' }).last();
    await taskInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await taskInput.click();
    await taskInput.pressSequentially(taskName);
    await this.page.waitForTimeout(500);

    const createOption = this.page.getByRole('option', { name: `Create "${taskName}"` });
    const existingOption = this.page.getByRole('option', { name: taskName }).first();
    if (await this.isVisible(createOption)) {
      await createOption.click();
    } else {
      await existingOption.click();
    }
    await this.page.waitForTimeout(1000);

    const responseDropdown = this.responseTypeInput.last();
    if (await this.isVisible(responseDropdown)) {
      await responseDropdown.click();
      await this.page.getByRole('option', { name: new RegExp(`^${responseType}$`, 'i') }).first().click();
      await this.page.waitForTimeout(500);
    }
  }

  async clickAddSection() {
    await this.addSectionButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addSectionButton.click();
    await this.page.waitForTimeout(500);
  }

  async fillSectionName(sectionIndex: number, name: string) {
    const sectionInput = this.page.getByPlaceholder('Enter section name').nth(sectionIndex);
    await sectionInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await sectionInput.clear();
    await sectionInput.fill(name);
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

  async clickTasksTab() {
    await this.tasksTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.tasksTab.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async clickCreateTaskButton() {
    await this.createTaskButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.createTaskButton.click();
    await this.page.waitForTimeout(500);
  }

  async fillCreateTaskModal(taskName: string, responseType: string, description: string) {
    await this.createNewTaskHeading.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    await this.taskNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.taskNameInput.fill(taskName);

    await this.responseTypeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.responseTypeInput.click();
    await this.page.getByRole('option', { name: new RegExp(`^${responseType}$`, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    await this.photoRequiredCheckbox.check();
    await this.page.waitForTimeout(300);

    await this.descriptionInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.descriptionInput.fill(description);

    const modalCreateButton = this.createTaskButton.last();
    await modalCreateButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await modalCreateButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyTaskCreated(taskName: string) {
    const taskRow = this.page.getByRole('cell', { name: taskName });
    await expect(taskRow).toBeVisible({ timeout: TIMEOUT.default });
  }

  async clickMatchTasksButton() {
    await this.matchTasksButton.first().waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.matchTasksButton.first().click();
    await this.matchTasksHeading.waitFor({ state: 'visible', timeout: TIMEOUT.default });
  }

  async fillAndMatchTasks(taskNames: string[]) {
    await this.matchTasksInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.matchTasksInput.fill(taskNames.join('\n'));
    await this.page.waitForTimeout(500);

    await this.matchTasksDrawerButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.matchTasksDrawerButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyMatchedTask(taskName: string) {
    const taskCell = this.page.getByRole('cell', { name: taskName });
    await expect(taskCell).toBeVisible({ timeout: TIMEOUT.default });
  }

  private async selectAllInFilter(filterButton: Locator) {
    await filterButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await filterButton.click();
    await this.page.waitForTimeout(500);

    const selectAllCheckbox = this.selectAllOption.getByRole('checkbox');
    if (!(await selectAllCheckbox.isChecked())) {
      await this.selectAllOption.click();
      await this.page.waitForTimeout(300);
    }

    await this.filterDoneButton.click();
    await this.page.waitForTimeout(500);
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

  async verifyChecklistOnChecklistsTab(checklistName: string) {
    await this.checklistsTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.checklistsTab.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });

    await this.selectAllInFilter(this.storesFilterButton);
    await this.selectAllInFilter(this.checklistFilterButton);
    await this.selectAllInFilter(this.scheduledFilterButton);

    await this.searchChecklistsInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.searchChecklistsInput.fill(checklistName);
    await this.page.waitForTimeout(1000);

    const checklistRow = this.page.getByRole('cell', { name: checklistName }).first();
    await expect(checklistRow).toBeVisible({ timeout: TIMEOUT.long });
  }
}
