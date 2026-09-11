import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

/** Date-group heading on the Checklists tab, e.g. "Fri 09/11/2026". */
const DATE_HEADING = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{2}\/\d{2}\/\d{4}$/;

/**
 * The values the Checklists tab prints in an occurrence's status column. The column is
 * headed "Upcoming" but its cell text changes to "Skipped" once the occurrence is skipped,
 * so the status is located by matching this vocabulary rather than by a fixed cell index.
 */
const OCCURRENCE_STATUS = /^(Upcoming|Skipped|In Progress|Complete|Completed|Overdue|Incomplete|Missed)$/i;

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
  private readonly searchChecklistsInput: Locator;
  private readonly templatesTab: Locator;
  private readonly saveTemplateButton: Locator;
  private readonly saveChangesButton: Locator;
  private readonly confirmDeleteButton: Locator;

  /**
   * Whether the Checklists tab filters have already been opened and set to "Select All" in
   * this run. The selection survives tab switches and reloads, so it is done once rather
   * than on every checklist verification.
   */
  private allFiltersSelected = false;

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
    this.searchChecklistsInput = page.getByRole('textbox', { name: 'Search upcoming checklists' });
    this.templatesTab = page.getByRole('tab', { name: 'Templates' });
    this.saveTemplateButton = page.getByRole('button', { name: 'Save' });
    this.saveChangesButton = page.getByRole('button', { name: 'Save changes' });
    this.confirmDeleteButton = page.getByRole('button', { name: /^delete checklist$/i });
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
    await this.waitForNetworkSettled();
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

  /** Types a task name into the last task row and waits for the options list to settle. */
  private async typeTaskName(taskName: string) {
    const taskInput = this.page.getByRole('textbox', { name: 'Type to see options' }).last();
    await taskInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await taskInput.click();
    await taskInput.pressSequentially(taskName);
    await this.page.waitForTimeout(1000);
  }

  async addTaskItem(taskName: string, responseType: string) {
    await this.typeTaskName(taskName);

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

  /**
   * Adds a task that already exists on the Tasks tab. Unlike addTaskItem this never creates a
   * new task and never touches the response type, which the app fills in from the saved task.
   */
  async addExistingTaskItem(taskName: string) {
    await this.typeTaskName(taskName);

    const existingOption = this.page.getByRole('option', { name: taskName }).first();
    await existingOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await existingOption.click();
    await this.page.waitForTimeout(1000);
  }

  async clickAddSection() {
    await this.addSectionButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addSectionButton.click();
    await this.page.waitForTimeout(500);
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

  /** Renders minutes-into-the-day as the dropdown's slot label, e.g. 825 -> "1:45 PM". */
  private formatTimeSlot(minutesIntoDay: number): string {
    const hours = Math.floor(minutesIntoDay / 60) % 24;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutesIntoDay % 60).padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  }

  private getNextAvailableTime(minutesAhead: number): string {
    const now = new Date();
    const target = now.getHours() * 60 + now.getMinutes() + minutesAhead;
    return this.formatTimeSlot(Math.ceil(target / 15) * 15);
  }

  /** Opens the display-time dropdown and picks the 15-minute slot with this label. */
  private async pickDisplayTime(time: string) {
    await this.displayTimeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.displayTimeInput.click();
    await this.page.getByRole('option', { name: time, exact: true }).click();
    await this.page.waitForTimeout(500);
    return time;
  }

  /** Picks a display time at least `minutesAhead` minutes from now, rounded up to the next 15-minute slot. */
  async selectTimeToDisplay(minutesAhead: number = 15) {
    return this.pickDisplayTime(this.getNextAvailableTime(minutesAhead));
  }

  /**
   * Picks a display time that has already passed today: `minutesBefore` minutes behind the
   * clock, rounded down to a 15-minute slot and clamped so it never wraps back past midnight.
   * A schedule whose display time is behind the clock generates no occurrence for today, so
   * the first one the app creates lands on the next scheduled weekday instead.
   */
  async selectPastTimeToDisplay(minutesBefore: number = 60) {
    const now = new Date();
    const target = now.getHours() * 60 + now.getMinutes() - minutesBefore;
    return this.pickDisplayTime(this.formatTimeSlot(Math.max(0, Math.floor(target / 15) * 15)));
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
    await this.waitForNetworkSettled();
  }

  /**
   * Switches tabs and waits for the tab itself to report that it is selected, so the next
   * read happens against the new tab's table rather than the outgoing one.
   */
  private async clickTab(tab: Locator) {
    await tab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: TIMEOUT.default });
    await this.waitForNetworkSettled();
  }

  async clickTasksTab() {
    await this.clickTab(this.tasksTab);
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
    await this.waitForNetworkSettled();
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
    await this.waitForNetworkSettled();
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

    await this.doneButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickTemplatesTab() {
    await this.clickTab(this.templatesTab);
  }

  /** Resolves a Templates-tab column index by its header text, so the table can gain or reorder columns. */
  private async getTemplatesColumnIndex(headerName: string): Promise<number> {
    const headers = this.page.getByRole('columnheader');
    await headers.first().waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).innerText()).trim();
      if (text.toLowerCase() === headerName.toLowerCase()) {
        return i;
      }
    }
    throw new Error(`Column "${headerName}" was not found on the Templates tab`);
  }

  /** Every row on the Templates tab whose text contains this template name. */
  private templateRows(templateName: string): Locator {
    return this.page.getByRole('row').filter({ hasText: templateName });
  }

  /** Reads the number shown in the Templates tab "Tasks" column for a template. */
  async getTemplateTaskCount(templateName: string): Promise<number> {
    const tasksColumn = await this.getTemplatesColumnIndex('Tasks');

    const templateRow = this.templateRows(templateName).first();
    await templateRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const cellText = (await templateRow.getByRole('cell').nth(tasksColumn).innerText()).trim();
    return Number(cellText);
  }

  private async openTemplateRowMenu(templateName: string) {
    const templateRow = this.templateRows(templateName).first();
    await templateRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const moreButton = templateRow.getByRole('button').last();
    await moreButton.click();
    await this.page.waitForTimeout(500);
  }

  async clickTemplateToEdit(templateName: string) {
    await this.openTemplateRowMenu(templateName);

    const editOption = this.page.getByRole('menuitem', { name: /edit/i }).first();
    await editOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editOption.click();
    await this.waitForNetworkSettled();
  }

  async clickDeleteTemplate(templateName: string) {
    await this.openTemplateRowMenu(templateName);

    const deleteOption = this.page.getByRole('menuitem', { name: /delete/i }).first();
    await deleteOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await deleteOption.click();
    await this.page.waitForTimeout(1000);
  }

  async confirmDeleteTemplate() {
    await this.confirmDeleteButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.confirmDeleteButton.click();
    await this.waitForNetworkSettled();
    await this.page.waitForTimeout(2000);
  }

  async verifyTemplateDeleted(templateName: string) {
    await expect(this.templateRows(templateName)).toHaveCount(0, { timeout: TIMEOUT.long });
  }

  /** Moves an existing template's display time forward, used by the edit flow. */
  async updateDisplayTime() {
    return this.selectTimeToDisplay(30);
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
    await this.waitForNetworkSettled();
  }

  /**
   * Opens the Stores, Checklist and Scheduled filters and selects everything in each one.
   * Each filter costs a dropdown open, a checkbox read and a Done click, so this is the
   * slowest part of reaching the Checklists tab and is deliberately not repeated per
   * checklist - see filterChecklistsTo.
   */
  private async selectAllChecklistFilters() {
    await this.selectAllInFilter(this.storesFilterButton);
    await this.selectAllInFilter(this.checklistFilterButton);
    await this.selectAllInFilter(this.scheduledFilterButton);
    this.allFiltersSelected = true;
  }

  private async searchChecklists(checklistName: string) {
    await this.searchChecklistsInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.searchChecklistsInput.fill(checklistName);
    await this.page.waitForTimeout(2000);
  }

  /**
   * Opens the Checklists tab and narrows the occurrence list to one checklist. The app keeps
   * the filter selection between visits, so the filters are only opened the first time the
   * tab is used; every later visit just searches, which is what makes the repeated reads in
   * the later stages cheap.
   */
  private async filterChecklistsTo(checklistName: string) {
    await this.clickTab(this.checklistsTab);

    if (!this.allFiltersSelected) {
      await this.selectAllChecklistFilters();
    }

    await this.searchChecklists(checklistName);
  }

  /**
   * Waits for a checklist's row in the filtered list. A checklist created after the filters
   * were last selected is not part of that saved selection, so when the row does not turn up
   * quickly the filters are re-selected once and the search is retried before failing.
   */
  private async waitForChecklistRow(checklistName: string): Promise<Locator> {
    const checklistRow = this.page.getByRole('cell', { name: checklistName }).first();

    try {
      await checklistRow.waitFor({ state: 'visible', timeout: TIMEOUT.short });
    } catch {
      await this.selectAllChecklistFilters();
      await this.searchChecklists(checklistName);
      await checklistRow.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    }
    return checklistRow;
  }

  async verifyChecklistOnChecklistsTab(checklistName: string) {
    await this.filterChecklistsTo(checklistName);

    const checklistRow = await this.waitForChecklistRow(checklistName);
    await expect(checklistRow).toBeVisible();
  }

  /**
   * Filters the Checklists tab down to one checklist and returns the date-group headings the
   * app generated occurrences under, e.g. ["Fri 09/11/2026", "Fri 09/18/2026"].
   */
  async getScheduledDatesForChecklist(checklistName: string): Promise<string[]> {
    await this.filterChecklistsTo(checklistName);
    await this.waitForChecklistRow(checklistName);

    const dates: string[] = [];
    for (const { isDateHeading, text } of await this.readOccurrenceRows()) {
      if (isDateHeading && !dates.includes(text)) {
        dates.push(text);
      }
    }
    return dates;
  }

  /**
   * Walks the occurrence list once, tagging every row with the date group it falls under.
   * The list is grouped by day: each group opens with a heading row whose only content is
   * the date ("Fri 09/11/2026"), followed by a rolled-up summary row ("1 store") with no
   * kebab button, then one store-level row per store carrying the actions menu.
   */
  private async readOccurrenceRows() {
    const rows = this.page.getByRole('row');
    const rowCount = await rows.count();

    const parsed: { row: Locator; text: string; dateGroup: string; isDateHeading: boolean }[] = [];
    let dateGroup = '';

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const firstCell = row.getByRole('cell').first();
      if (await firstCell.count() === 0) continue;

      const text = (await firstCell.innerText()).trim().replace(/\s+/g, ' ');
      const isDateHeading = DATE_HEADING.test(text);
      if (isDateHeading) dateGroup = text;

      parsed.push({ row, text, dateGroup, isDateHeading });
    }
    return parsed;
  }

  /**
   * Finds the store-level occurrence row for a checklist under one date-group heading,
   * skipping the group's summary row, which has no kebab button.
   */
  private async findOccurrenceRow(checklistName: string, dateHeading: string): Promise<Locator> {
    for (const { row, text, dateGroup, isDateHeading } of await this.readOccurrenceRows()) {
      if (isDateHeading) continue;
      if (dateGroup !== dateHeading) continue;
      if (!text.includes(checklistName)) continue;
      if (await row.getByRole('button').count() === 0) continue;

      return row;
    }
    throw new Error(`No occurrence row for "${checklistName}" under "${dateHeading}"`);
  }

  /**
   * Reads the status an occurrence row shows in its "Upcoming" column. The cell is found by
   * matching the status vocabulary rather than by index so the table can gain or reorder
   * columns without breaking the read.
   */
  private async readOccurrenceStatus(row: Locator): Promise<string> {
    const cells = row.getByRole('cell');
    const cellCount = await cells.count();

    for (let i = 0; i < cellCount; i++) {
      const text = (await cells.nth(i).innerText()).trim().replace(/\s+/g, ' ');
      if (OCCURRENCE_STATUS.test(text)) {
        return text;
      }
    }
    throw new Error(`No status cell found on the occurrence row (read ${cellCount} cells)`);
  }

  /** Hovers an occurrence row so its kebab button renders, then opens the actions menu. */
  private async openOccurrenceMenu(row: Locator) {
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await this.page.waitForTimeout(400);
    await row.getByRole('button').last().click();
    await this.page.waitForTimeout(1000);
  }

  private async closeOccurrenceMenu() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(600);
  }

  /** The kebab entry that reads "Skip this checklist", or "Un-skip this checklist" once skipped. */
  private get skipMenuItem(): Locator {
    return this.page.getByRole('menuitem').filter({ hasText: /skip this checklist/i }).first();
  }

  private get deleteMenuItem(): Locator {
    return this.page.getByRole('menuitem').filter({ hasText: /^Delete$/ }).first();
  }

  /**
   * A locked kebab entry is a MUI menu item marked `aria-disabled="true"` — it carries no
   * native `disabled` attribute, which is what Playwright's `isEnabled()` looks at, so that
   * check alone reports every entry as enabled.
   */
  private async isMenuItemEnabled(item: Locator): Promise<boolean> {
    return (await item.getAttribute('aria-disabled')) !== 'true';
  }

  /**
   * Reads one occurrence's status and whether its kebab-menu Skip and Delete actions are
   * enabled. Both lock once the occurrence's display time is within 15 minutes, so the
   * answer depends on the clock; skipping an occurrence on its own locks neither.
   */
  async getOccurrenceActionState(checklistName: string, dateHeading: string) {
    await this.filterChecklistsTo(checklistName);
    await this.waitForChecklistRow(checklistName);

    const row = await this.findOccurrenceRow(checklistName, dateHeading);
    const status = await this.readOccurrenceStatus(row);

    await this.openOccurrenceMenu(row);

    await this.skipMenuItem.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const skipEnabled = await this.isMenuItemEnabled(this.skipMenuItem);
    const deleteEnabled = await this.isMenuItemEnabled(this.deleteMenuItem);

    await this.closeOccurrenceMenu();

    return { status, skipEnabled, deleteEnabled };
  }

  /**
   * Opens one occurrence's kebab menu and clicks "Skip this checklist". Some builds ask for
   * confirmation in a dialog, so a confirming button is clicked when one appears.
   */
  async skipOccurrence(checklistName: string, dateHeading: string) {
    await this.filterChecklistsTo(checklistName);
    await this.waitForChecklistRow(checklistName);

    const row = await this.findOccurrenceRow(checklistName, dateHeading);
    await this.openOccurrenceMenu(row);

    await this.skipMenuItem.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.skipMenuItem.click();
    await this.page.waitForTimeout(1000);

    const confirmSkipButton = this.page.getByRole('button', { name: /^(skip|skip checklist|yes, skip)$/i }).first();
    if (await this.isVisible(confirmSkipButton)) {
      await confirmSkipButton.click();
    }
    await this.waitForNetworkSettled();
    await this.page.waitForTimeout(1500);
  }
}
