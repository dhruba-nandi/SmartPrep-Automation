import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';
import { extractPdfText } from '../../../utils/pdfText';

/** Date-group heading on the Checklists tab, e.g. "Fri 09/11/2026". */
const DATE_HEADING = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{2}\/\d{2}\/\d{4}$/;

/**
 * The values the Checklists tab prints in an occurrence's status column. The column is
 * headed "Upcoming" but its cell text changes to "Skipped" once the occurrence is skipped,
 * so the status is located by matching this vocabulary rather than by a fixed cell index.
 */
const OCCURRENCE_STATUS = /^(Upcoming|Skipped|In Progress|Complete|Completed|Overdue|Incomplete|Missed)$/i;

/**
 * The two ways a template edit can be applied, as the "Choose where to apply" step labels
 * them. Applying to the next 14 days rewrites the checklists the template has already
 * generated, while applying to future checklists only leaves those exactly as they are and
 * changes nothing before the next one the template generates.
 */
export const APPLY_TO = {
  next14Days: 'Apply to next 14 days of checklists',
  futureOnly: 'Only apply to future checklists',
} as const;

/**
 * What one Print action produced: the kebab entry's state, the PDF the app built for the
 * occurrence, and the URL of the tab it was opened in.
 */
export interface PrintedChecklist {
  menuItemEnabled: boolean;
  previewUrl: string;
  type: string;
  size: number;
  header: string;
  /** Every value printed on the page, one per line, read out of the PDF itself. */
  lines: string[];
}

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

  /** Whether the print-document capture has already been installed on this browser context. */
  private printCaptureInstalled = false;

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

  /**
   * The task row that is waiting to be filled in: the last row whose name box is still empty.
   *
   * Rows are matched by their placeholder, which a row keeps after a task has been picked, so
   * taking the last box outright can land on a row that already holds a task while the newly
   * added row has not rendered yet - the name then gets appended to the wrong task and the
   * options list never offers the one being typed. Scanning back from the end for an empty box
   * types into the new row instead, and waits for it when it is still rendering.
   */
  private async emptyTaskInput(): Promise<Locator> {
    const inputs = this.page.getByRole('textbox', { name: 'Type to see options' });
    await inputs.first().waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const deadline = Date.now() + TIMEOUT.default;
    do {
      for (let index = (await inputs.count()) - 1; index >= 0; index--) {
        const input = inputs.nth(index);
        if (await this.isVisible(input) && (await input.inputValue().catch(() => 'x')) === '') {
          return input;
        }
      }
      await this.page.waitForTimeout(250);
    } while (Date.now() < deadline);

    throw new Error('No empty task row appeared to type a task name into.');
  }

  /**
   * Types a task name into the empty task row and waits for the options list to settle.
   *
   * The template re-renders as tasks and sections are added, and a row re-rendered mid-typing
   * drops the characters typed so far - leaving an empty box that never triggers a search, so
   * the caller then waits out its whole timeout on an option that cannot appear. The name is
   * therefore read back after typing and typed again if it did not stick or produced no option.
   */
  private async typeTaskName(taskName: string) {
    const options = this.page.getByRole('option');
    let typed = '';

    for (let attempt = 1; attempt <= 3; attempt++) {
      const taskInput = await this.emptyTaskInput();
      await taskInput.click();
      await taskInput.pressSequentially(taskName, { delay: 50 });
      typed = await taskInput.inputValue().catch(() => '');

      if (typed === taskName) {
        // Any option at all means the search ran; which one to click is the caller's business.
        const listed = await options.first()
          .waitFor({ state: 'visible', timeout: TIMEOUT.short })
          .then(() => true)
          .catch(() => false);
        if (listed) return;
      }

      // Clear whatever survived so the retry types the name once rather than twice.
      await taskInput.fill('').catch(() => {});
      await this.page.waitForTimeout(500);
    }

    throw new Error(`The task row did not take the name "${taskName}" - it last read "${typed}".`);
  }

  async addTaskItem(taskName: string, responseType: string) {
    await this.typeTaskName(taskName);

    const createOption = this.page.getByRole('option', { name: `Create "${taskName}"` });
    const existingOption = this.page.getByRole('option', { name: taskName }).first();

    // The options are fetched while the name is typed, so wait for whichever entry the app
    // settles on. Without this the visibility check below can run against a list that has not
    // rendered yet and fall through to clicking an option that is not there, which waits out
    // the whole test rather than failing.
    await createOption.or(existingOption).first()
      .waitFor({ state: 'visible', timeout: TIMEOUT.default });

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

  /** Appends a schedule block to the template. The button stays put however many exist. */
  async clickAddSchedule() {
    const addSchedule = this.addScheduleButton.last();
    await addSchedule.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await addSchedule.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Picks a weekday on the schedule that was added last. A template can carry several
   * schedules and every one of them renders its own set of day buttons, display and due time
   * inputs and store picker, so each of these acts on the newest block - which is the one
   * being filled in right after clickAddSchedule.
   */
  async selectScheduleDay(dayAbbrev: string) {
    const dayButton = this.page.getByRole('button', { name: dayAbbrev }).last();
    await dayButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await dayButton.click();
    await this.page.waitForTimeout(500);
  }

  /** Minute of the day the clock reads right now, e.g. 03:46 -> 226. */
  private minutesNow(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Reads a slot label such as "4:01 AM" as a minute of the day, or NaN when the text is not a
   * time at all. The gap before AM/PM is a narrow no-break space rather than a plain one, so it
   * is matched as whitespace instead of compared literally.
   */
  private parseTimeSlot(label: string): number {
    const parts = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!parts) return NaN;
    const hours = (Number(parts[1]) % 12) + (parts[3].toUpperCase() === 'PM' ? 12 : 0);
    return hours * 60 + Number(parts[2]);
  }

  /**
   * Lists the slots the open time dropdown is offering, in the order they are rendered.
   *
   * The list runs on the quarter hour across the whole day, but the app drops the slots around
   * the current time: at 3:59 it offers ... 3:30, 3:45, 4:15, 4:30 ..., with 4:00 missing because
   * it is less than fifteen minutes away. Which slots exist is therefore only knowable by reading
   * them, and every caller here picks from what it finds rather than naming a time.
   */
  private async readTimeSlots(): Promise<{ index: number; label: string; minutes: number }[]> {
    const options = this.page.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: TIMEOUT.default });

    // A slot reads as the time over how far away it is - "4:01 AM" then "(~15 mins)" - and only
    // the first line is the time itself.
    return (await options.allInnerTexts())
      .map((text, index) => {
        const label = text.trim().split('\n')[0].trim();
        return { index, label, minutes: this.parseTimeSlot(label) };
      })
      .filter(slot => !Number.isNaN(slot.minutes));
  }

  /**
   * Opens the display-time dropdown and clicks the slot `choose` settles on, reporting the label
   * that was actually picked.
   *
   * The field arrives pre-filled with "12:00 AM" and filters its list down to whatever text the
   * input holds, so it is emptied before the slots are read - otherwise midnight is the only
   * entry the list ever renders. Passing `typed` puts a time of your own into the field first,
   * which the app adds to the list as an extra option - the only way to reach a minute the
   * quarter-hour grid does not land on.
   */
  private async pickDisplayTime(
    requirement: string,
    choose: (slots: { index: number; label: string; minutes: number }[]) => { index: number; label: string } | undefined,
    typed?: string,
  ): Promise<string> {
    const displayTime = this.displayTimeInput.last();
    await displayTime.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await displayTime.click();
    await displayTime.fill('');

    if (typed) {
      await displayTime.pressSequentially(typed);
      await this.page.waitForTimeout(1000);
    }

    const slots = await this.readTimeSlots();
    const slot = choose(slots);
    if (!slot) {
      throw new Error(
        `No display time slot is ${requirement}. ` +
        `The dropdown offered: ${slots.map(s => s.label).join(', ') || '(nothing)'}.`
      );
    }

    await this.page.getByRole('option').nth(slot.index).click();
    await this.page.waitForTimeout(500);
    return slot.label;
  }

  /** Formats a time the way the dropdown labels its slots, e.g. "4:05 AM". */
  private toTimeLabel(date: Date): string {
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${date.getHours() < 12 ? 'AM' : 'PM'}`;
  }

  /**
   * Sets the display time to exactly `minutesFromNow` minutes ahead of the clock.
   *
   * The dropdown only lists quarter-hour slots, so an exact offset - in particular one inside
   * the 15-minute window where the app stops generating an occurrence for today - is not on
   * offer. Typing the time into the field puts it in the list as its own option, which is then
   * selected like any other slot.
   */
  async selectDisplayTimeMinutesFromNow(minutesFromNow: number): Promise<string> {
    const target = new Date(Date.now() + minutesFromNow * 60000);
    const label = this.toTimeLabel(target);
    const targetMinutes = target.getHours() * 60 + target.getMinutes();

    return this.pickDisplayTime(
      `exactly ${minutesFromNow} minutes from now (${label})`,
      slots => slots.find(slot => slot.minutes === targetMinutes),
      label,
    );
  }

  /** Picks the earliest offered display time that is at least `minutesAhead` minutes from now. */
  async selectTimeToDisplay(minutesAhead: number = 15) {
    const earliest = this.minutesNow() + minutesAhead;
    return this.pickDisplayTime(
      `at least ${minutesAhead} minutes from now`,
      slots => slots.find(slot => slot.minutes >= earliest),
    );
  }

  /**
   * Picks the latest offered display time that has already passed: `minutesBefore` minutes or
   * more behind the clock. A schedule whose display time is behind the clock generates no
   * occurrence for today, so the first one the app creates lands on the next scheduled weekday
   * instead.
   */
  async selectPastTimeToDisplay(minutesBefore: number = 60) {
    const latest = this.minutesNow() - minutesBefore;
    return this.pickDisplayTime(
      `${minutesBefore} minutes or more behind the clock`,
      slots => [...slots].reverse().find(slot => slot.minutes <= latest),
    );
  }

  /**
   * Picks the earliest offered due-time slot and reports its label, e.g. "2:15 AM".
   *
   * How many slots the dropdown offers depends on the display time that was just set: a
   * display time the clock has already passed leaves a single option - the next quarter hour -
   * so the list is read rather than indexed into at a fixed position.
   */
  async selectTimeDue(): Promise<string> {
    const dueTime = this.dueTimeInput.last();
    await dueTime.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await dueTime.click();

    const [slot] = await this.readTimeSlots();
    if (!slot) {
      throw new Error('The due time dropdown offered no selectable slot.');
    }

    await this.page.getByRole('option').nth(slot.index).click();
    await this.page.waitForTimeout(500);
    return slot.label;
  }

  async selectAssignedStores(storeName: string) {
    const selectStores = this.selectStoresButton.last();
    await selectStores.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await selectStores.click();
    await this.page.waitForTimeout(500);

    await this.page.getByRole('option', { name: new RegExp(storeName, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    await this.doneButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * The greyed-out Create template button carries `aria-disabled="true"` rather than the
   * native `disabled` attribute, so Playwright still accepts the click and the click simply
   * does nothing - the failure then surfaces many seconds later as a timeout waiting for the
   * Checklists tab. Checking the state up front turns that into an immediate, readable error.
   *
   * The usual cause is a template name over the UI's 40-character cap, so the name and its
   * length are reported in the message.
   */
  private async assertCreateTemplateEnabled() {
    const ariaDisabled = await this.createTemplateButton.getAttribute('aria-disabled');
    if (ariaDisabled !== 'true' && await this.createTemplateButton.isEnabled()) return;

    const name = await this.templateNameInput.inputValue().catch(() => '');
    throw new Error(
      `Create template is disabled, so the template was never saved. ` +
      `Template name is ${name.length} characters (the UI caps it at 40): "${name}".`
    );
  }

  async clickCreateTemplate() {
    await this.createTemplateButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.assertCreateTemplateEnabled();
    await this.createTemplateButton.click();
    await this.waitForNetworkSettled();
  }

  /**
   * Switches tabs and waits for the tab itself to report that it is selected, so the next
   * read happens against the new tab's table rather than the outgoing one.
   *
   * An open MUI menu or dialog marks the rest of the app `aria-hidden="true"`, which takes the
   * tabs out of the accessibility tree entirely - `getByRole('tab')` then matches nothing and
   * the wait below times out even though the tab is on screen. So an overlay left open by the
   * previous step is dismissed first rather than waited out.
   */
  private async clickTab(tab: Locator) {
    if (await tab.count() === 0) {
      await this.closeOccurrenceMenu();
    }
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

  /**
   * Fills and submits the Create New Task modal. `photoRequired` drives the "Photo receipt
   * required" checkbox either way rather than only ticking it, so a task can be created with
   * the toggle deliberately off.
   */
  async fillCreateTaskModal(
    taskName: string,
    responseType: string,
    description: string,
    photoRequired: boolean = true,
  ) {
    await this.createNewTaskHeading.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    await this.taskNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.taskNameInput.fill(taskName);

    await this.responseTypeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.responseTypeInput.click();
    await this.page.getByRole('option', { name: new RegExp(`^${responseType}$`, 'i') }).first().click();
    await this.page.waitForTimeout(500);

    if (photoRequired) {
      await this.photoRequiredCheckbox.check();
    } else {
      await this.photoRequiredCheckbox.uncheck();
    }
    await this.page.waitForTimeout(300);

    await this.descriptionInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.descriptionInput.fill(description);

    const modalCreateButton = this.createTaskButton.last();
    await modalCreateButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await modalCreateButton.click();
    await this.waitForNetworkSettled();
  }

  /** Asserts a table cell carrying this text is on screen. */
  private async expectCellVisible(text: string) {
    await expect(this.page.getByRole('cell', { name: text })).toBeVisible({ timeout: TIMEOUT.default });
  }

  /** Asserts a task is listed on the Tasks tab. */
  async verifyTaskCreated(taskName: string) {
    await this.expectCellVisible(taskName);
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

  /** Asserts Match tasks pulled a task into the template being built. */
  async verifyMatchedTask(taskName: string) {
    await this.expectCellVisible(taskName);
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

    // The editor is a page of its own and paints after the navigation settles. A read taken
    // before it does finds no task rows and no day buttons, so it reports an empty template
    // instead of failing - which is why the form itself is waited for here.
    await this.templateNameInput.waitFor({ state: 'visible', timeout: TIMEOUT.long });
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

  /**
   * Removes one task row from the template being edited. The row carries its own Delete
   * button, so the row is found by the task's name rather than by position and the task that
   * goes is the one that was named.
   */
  async deleteTemplateTask(taskName: string) {
    const taskRow = this.page.getByRole('row').filter({ hasText: taskName }).first();
    await taskRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    await taskRow.getByRole('button', { name: 'Delete', exact: true }).click();
    await this.page.waitForTimeout(1000);
  }

  /** One per schedule block on the template form, in the order the blocks are rendered. */
  private get deleteScheduleButtons(): Locator {
    return this.page.getByRole('button', { name: 'Delete schedule' });
  }

  /** How many schedule blocks the template being edited carries. */
  async getScheduleCount(): Promise<number> {
    return this.deleteScheduleButtons.count();
  }

  /**
   * Removes one schedule block, counted from the top of the form, so position 0 is the one
   * headed "Schedule 1". The blocks share no container that can be addressed by role, so each
   * is reached through its own Delete schedule button. Reopening a saved template does not
   * render its schedules in the order they were added, so prefer deleteScheduleForDay when the
   * block to remove is known by its weekday rather than by where it sits on the form.
   */
  async deleteSchedule(position: number) {
    const deleteButton = this.deleteScheduleButtons.nth(position);
    await deleteButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await deleteButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Removes the schedule block that displays on `dayAbbrev` (e.g. "Tue"), whichever position
   * the form happens to render it in. Schedule blocks come back in the app's own order when a
   * saved template is reopened, not the order they were created in, so addressing one by its
   * weekday is what makes it certain that the intended schedule is the one deleted.
   *
   * Selected days and Delete schedule buttons line up index for index only while every block
   * carries exactly one day, which is checked before either is used.
   */
  async deleteScheduleForDay(dayAbbrev: string) {
    const selectedDays = await this.getSelectedScheduleDays();
    const scheduleCount = await this.getScheduleCount();

    if (selectedDays.length !== scheduleCount) {
      throw new Error(
        `Cannot delete the schedule for ${dayAbbrev}: ${scheduleCount} schedule block(s) carry ` +
          `${selectedDays.length} selected day(s) (${selectedDays.join(', ')}), so a day no ` +
          'longer identifies a single block.'
      );
    }

    const position = selectedDays.indexOf(dayAbbrev);
    if (position === -1) {
      throw new Error(
        `No schedule block is set to ${dayAbbrev}; the form shows ${selectedDays.join(', ')}.`
      );
    }

    await this.deleteSchedule(position);
  }

  /**
   * The weekdays selected across every schedule block on the form, in the order the blocks are
   * rendered, e.g. ["Tue", "Mon"] for a template scheduled on each of the next two days. That
   * order is the app's, not the order the schedules were added in - reopening a saved template
   * can list them the other way round - so callers should compare the days as a set rather than
   * as a sequence. A selected day button says so in its accessible name, which is what tells the
   * blocks apart and so what makes it checkable that deleting a schedule removed the intended one.
   */
  async getSelectedScheduleDays(): Promise<string[]> {
    // The schedule blocks render after the rest of the form, so the section's own Add schedule
    // button is waited for first: a read taken before they paint reports no selected day at
    // all rather than failing.
    await this.addScheduleButton.last().waitFor({ state: 'visible', timeout: TIMEOUT.long });

    const selectedDays = this.page.getByRole('button', { name: /\(selected\)/ });
    return (await selectedDays.allInnerTexts()).map(text => text.trim());
  }

  /** Asserts a template is still listed on the Templates tab. */
  async verifyTemplateExists(templateName: string) {
    await expect(this.templateRows(templateName).first()).toBeVisible({ timeout: TIMEOUT.long });
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

  /**
   * Answers the "Choose where to apply" step that a saved template edit lands on and saves.
   * The option is picked by its label rather than its position, because which of the two is
   * chosen decides whether the checklists the template has already generated are rewritten -
   * see APPLY_TO.
   */
  async selectApplyOptionAndSave(option: string = APPLY_TO.next14Days) {
    const applyHeading = this.page.getByText('Choose where to apply');
    await applyHeading.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const choice = this.page.getByRole('radio', { name: option, exact: true });
    await choice.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await choice.click();
    await expect(choice).toBeChecked({ timeout: TIMEOUT.default });
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

    return this.collectDateHeadings();
  }

  /** The distinct date-group headings the occurrence list currently shows, in render order. */
  private async collectDateHeadings(): Promise<string[]> {
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
   * Narrows the Checklists tab to one checklist and returns its store-level occurrence row,
   * skipping each date group's summary row, which has no kebab button. Without a date heading the first occurrence the tab lists
   * is returned, which is the next checklist the template will generate.
   */
  private async findOccurrenceRow(checklistName: string, dateHeading?: string): Promise<Locator> {
    await this.filterChecklistsTo(checklistName);
    await this.waitForChecklistRow(checklistName);

    for (const { row, text, dateGroup, isDateHeading } of await this.readOccurrenceRows()) {
      if (isDateHeading) continue;
      if (dateHeading !== undefined && dateGroup !== dateHeading) continue;
      if (!text.includes(checklistName)) continue;
      if (await row.getByRole('button').count() === 0) continue;

      return row;
    }
    throw new Error(
      dateHeading === undefined
        ? `No occurrence row for "${checklistName}"`
        : `No occurrence row for "${checklistName}" under "${dateHeading}"`
    );
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

  /**
   * Opens one occurrence's kebab menu and clicks "Delete". The action is only offered
   * outside the 15-minute lock window, so a locked entry is reported as such instead of
   * being clicked, which would silently do nothing. Some builds ask for confirmation in a
   * dialog, so a confirming button is clicked when one appears.
   */
  async deleteOccurrence(checklistName: string, dateHeading: string) {
    const row = await this.findOccurrenceRow(checklistName, dateHeading);
    await this.openOccurrenceMenu(row);

    await this.deleteMenuItem.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    if (!(await this.isMenuItemEnabled(this.deleteMenuItem))) {
      throw new Error(`Delete is locked for "${checklistName}" on ${dateHeading}`);
    }

    await this.deleteMenuItem.click();
    await this.page.waitForTimeout(1000);

    const confirmDeleteOccurrenceButton = this.page
      .getByRole('button', { name: /^(delete|delete checklist|delete occurrence|yes, delete)$/i })
      .first();
    if (await this.isVisible(confirmDeleteOccurrenceButton)) {
      await confirmDeleteOccurrenceButton.click();
    }
    await this.waitForNetworkSettled();
    await this.page.waitForTimeout(2000);
  }

  /**
   * The date headings a checklist still has occurrences under, tolerating it having none at
   * all. getScheduledDatesForChecklist waits for the checklist's row and re-applies the
   * filters when it does not turn up, which is right while occurrences are expected; after a
   * delete the row is legitimately gone, so this variant reads whatever the filtered list
   * shows rather than waiting for a row that should not be there.
   */
  async getRemainingScheduledDates(checklistName: string): Promise<string[]> {
    await this.filterChecklistsTo(checklistName);

    return this.collectDateHeadings();
  }

  /** The kebab entry that opens the occurrence's printable checklist. */
  private get printMenuItem(): Locator {
    return this.page.getByRole('menuitem').filter({ hasText: /^Print$/ }).first();
  }

  /**
   * Wraps URL.createObjectURL so every blob the app hands to the browser is recorded with its
   * type, size and leading bytes. Print builds its PDF inside the page and opens it as a blob
   * URL in a new tab; the blob is revoked as soon as that tab holds it, so it can no longer be
   * fetched back afterwards - recording it as it is created is what makes the printed document
   * readable at all. Installed on the context so the print tab is covered too, and it only
   * takes effect on the next navigation, so call it before navigateToSmartPrep.
   */
  async startCapturingPrintDocuments() {
    if (this.printCaptureInstalled) return;

    await this.page.context().addInitScript(() => {
      (window as any).__printedDocuments = [];

      const createObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (source: any) {
        const url = createObjectURL(source);
        if (source && typeof source.size === 'number' && typeof source.slice === 'function') {
          const record = { url, type: source.type, size: source.size, header: '', base64: '' };
          // Read the list off window on every call rather than closing over it, so emptying it
          // between prints leaves the next document being recorded on the list the test reads.
          const captured = (window as any).__printedDocuments || ((window as any).__printedDocuments = []);
          captured.push(record);
          source.slice(0, 5).text().then((head: string) => { record.header = head; }).catch(() => {});
          // The bytes come back base64 encoded because only strings survive the trip out of
          // the page, and they are what the printed values are then read from.
          source.arrayBuffer().then((buffer: ArrayBuffer) => {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            record.base64 = btoa(binary);
          }).catch(() => {});
        }
        return url;
      };
    });

    this.printCaptureInstalled = true;
  }

  private async readPrintedDocuments(): Promise<(Omit<PrintedChecklist, 'menuItemEnabled' | 'previewUrl' | 'lines'> & { base64: string })[]> {
    return this.page.evaluate(() => (window as any).__printedDocuments || []);
  }

  /**
   * Waits for the print tab to settle on the blob URL. The tab is opened empty and is only
   * pointed at the document once the PDF has been built, so its URL reads as about:blank for
   * a moment after the page event fires.
   */
  private async waitForPreviewUrl(previewTab: Page): Promise<string> {
    const deadline = Date.now() + TIMEOUT.default;
    let url = previewTab.url();

    while (!url.startsWith('blob:') && Date.now() < deadline) {
      await this.page.waitForTimeout(250);
      url = previewTab.url();
    }
    return url;
  }

  /** Waits for the printed PDF to be recorded, including the leading bytes read off the blob. */
  private async waitForPrintedDocument() {
    const deadline = Date.now() + TIMEOUT.default;
    let printed: Awaited<ReturnType<CheckListPage['readPrintedDocuments']>>[number] | undefined;

    while (Date.now() < deadline) {
      [printed] = await this.readPrintedDocuments();
      if (printed && printed.header && printed.base64) return printed;
      await this.page.waitForTimeout(250);
    }

    // A document whose bytes never arrived is still returned, so the caller's assertion
    // reports what was actually printed instead of a timeout.
    if (printed) return printed;
    throw new Error('Print did not produce a document blob');
  }

  /** The detail panel's collapsible list of the tasks that are still to be done. */
  private get pendingTasksToggle(): Locator {
    return this.page.getByRole('button', { name: /^Pending/ }).first();
  }

  /**
   * Opens one occurrence's detail panel from the Checklists tab and returns the task names its
   * Pending section lists. Without a date heading the checklist's first occurrence is read -
   * the topmost date the tab lists it under, which is the next checklist the template will
   * generate.
   *
   * The panel shows what the checklist itself holds rather than what the template it came from
   * now holds, so this is where an edit saved as "only apply to future checklists" can be seen
   * to have left an existing checklist alone.
   */
  async getPendingTasksForOccurrence(checklistName: string, dateHeading?: string): Promise<string[]> {
    const row = await this.findOccurrenceRow(checklistName, dateHeading);
    await row.getByRole('cell').filter({ hasText: checklistName }).first().click();

    const toggle = this.pendingTasksToggle;
    await toggle.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    const section = toggle.locator('..');

    // The section reads as its own two heading lines - "Pending" and the count - followed by one
    // line per task, so anything shorter than that means it is still collapsed. It is read
    // rather than clicked blind because a second click would collapse an already open section.
    const readLines = async () => (await section.innerText()).split('\n').map(line => line.trim());
    if ((await readLines()).length <= 2) {
      await toggle.click();
      await this.page.waitForTimeout(1000);
    }

    const [, , ...taskNames] = await readLines();

    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    return taskNames.filter(name => name.length > 0);
  }

  /**
   * Opens one occurrence's kebab menu and clicks Print, then reports the PDF the app built and
   * the tab it opened it in. The print tab is closed again so the suite is left on the page it
   * started from.
   */
  async printOccurrence(checklistName: string, dateHeading: string): Promise<PrintedChecklist> {
    const row = await this.findOccurrenceRow(checklistName, dateHeading);
    await this.openOccurrenceMenu(row);

    await this.printMenuItem.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    const menuItemEnabled = await this.isMenuItemEnabled(this.printMenuItem);

    await this.page.evaluate(() => { (window as any).__printedDocuments = []; });

    const previewTabPromise = this.page.context().waitForEvent('page', { timeout: TIMEOUT.long });
    await this.printMenuItem.click();
    const previewTab = await previewTabPromise;

    const previewUrl = await this.waitForPreviewUrl(previewTab);
    const { base64, ...printed } = await this.waitForPrintedDocument();

    await previewTab.close();
    await this.page.waitForTimeout(500);

    // Print leaves the kebab menu open - the click opened a new tab instead of dismissing it,
    // and focus moved away so no outside click ever lands. While it is open the app root is
    // `aria-hidden`, so the next step's tab switch would find no tab to click.
    await this.page.bringToFront();
    await this.closeOccurrenceMenu();

    const lines = base64 ? extractPdfText(Buffer.from(base64, 'base64')) : [];
    return { menuItemEnabled, previewUrl, ...printed, lines };
  }
}
