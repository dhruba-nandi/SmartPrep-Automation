import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { CheckListPage } from '../../pages/recipes/SmartPrep/CheckListPage';
import { testNames } from '../../fixtures/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Recipe Smart Prep', () => {
  let checkListPage: CheckListPage;

  // Expected values for the Templates tab "Tasks" column. Sections are not counted —
  // the column is the total number of task rows summed across every section.
  const EXPECTED_TASKS = {
    created: 4,   // Cleaning, Dishwasher + Inventory Count, Food Prep
    edited: 5,    // the four above + Equipment Check added during the edit
    aiMatch: 2,   // the two tasks fed into Match tasks
  };

  const { results, logResults } = createResultsTracker('Recipe Smart Prep', [
    'Create Checklist Template',
    'Edit Checklist Template',
    'Create Tasks',
    'AI Match Checklist',
    'Delete Checklist Template',
    'Temperature Task Checklist Schedule',
    'Skip And Delete Lock Window',
    'Skip Checklist Occurrence',
    'Past Time Checklist Schedule',
  ]);

  const DAY_ABBREVS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const DAY_HEADINGS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /** Formats a date the way the Checklists tab groups its occurrences, e.g. "Fri 09/11/2026". */
  function toChecklistDateHeading(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${DAY_HEADINGS[date.getDay()]} ${mm}/${dd}/${date.getFullYear()}`;
  }

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    checkListPage = new CheckListPage(persistentPage);
  });

  test.afterAll(async () => {
    logResults();
  });

  // ==========================================
  // Stage 1: Create Checklist Template
  // ==========================================

  test('Create checklist template with sections and tasks', async () => {
    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepCheckList);

    await checkListPage.clickAddTask();
    await checkListPage.addTaskItem('Cleaning', 'Checkmark');
    await checkListPage.clickAddTask();
    await checkListPage.addTaskItem('Dishwasher', 'Checkmark');

    await checkListPage.clickAddSection();
    await checkListPage.addTaskItem('Inventory Count', 'Checkmark');
    await checkListPage.clickAddTask();
    await checkListPage.addTaskItem('Food Prep', 'Checkmark');

    await checkListPage.clickAddSchedule();
    for (const day of DAY_ABBREVS) {
      await checkListPage.selectScheduleDay(day);
    }
    await checkListPage.selectTimeToDisplay();
    await checkListPage.selectTimeDue();
    await checkListPage.selectAssignedStores('Wasabi Tysons');

    await checkListPage.clickCreateTemplate();
    await checkListPage.verifyChecklistOnChecklistsTab(testNames.smartPrepCheckList);

    await checkListPage.clickTemplatesTab();
    expect(await checkListPage.getTemplateTaskCount(testNames.smartPrepCheckList))
      .toBe(EXPECTED_TASKS.created);
    results['Create Checklist Template'] = 'passed';
  });

  // ==========================================
  // Stage 2: Edit Checklist Template
  // ==========================================

  test('Edit checklist template - rename, add task and change time', async () => {
    await checkListPage.clickTemplatesTab();
    await checkListPage.clickTemplateToEdit(testNames.smartPrepCheckList);
    await checkListPage.editTemplateName(testNames.smartPrepCheckListEdited);
    await checkListPage.clickAddTask();
    await checkListPage.addTaskItem('Equipment Check', 'Checkmark');
    await checkListPage.updateDisplayTime();
    await checkListPage.clickSaveTemplate();
    await checkListPage.selectApplyOptionAndSave();
    await checkListPage.verifyChecklistOnChecklistsTab(testNames.smartPrepCheckListEdited);

    await checkListPage.clickTemplatesTab();
    expect(await checkListPage.getTemplateTaskCount(testNames.smartPrepCheckListEdited))
      .toBe(EXPECTED_TASKS.edited);
    results['Edit Checklist Template'] = 'passed';
  });

  // ==========================================
  // Stage 3: Create Tasks
  // ==========================================

  test('Create tasks from Tasks tab', async () => {
    await checkListPage.clickTasksTab();
    await checkListPage.clickCreateTaskButton();
    await checkListPage.fillCreateTaskModal(
      testNames.smartPrepTask1,
      'Checkmark',
      'Automated task for cleaning verification'
    );
    await checkListPage.verifyTaskCreated(testNames.smartPrepTask1);
    await checkListPage.clickCreateTaskButton();
    await checkListPage.fillCreateTaskModal(
      testNames.smartPrepTask2,
      'Numerical',
      'Automated task for temperature logging'
    );
    await checkListPage.verifyTaskCreated(testNames.smartPrepTask2);
    results['Create Tasks'] = 'passed';
  });

  // ==========================================
  // Stage 4: AI Match Checklist
  // ==========================================

  test('Create checklist using AI Match tasks', async () => {
    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepAIMatch);

    await checkListPage.clickMatchTasksButton();
    await checkListPage.fillAndMatchTasks([
      testNames.smartPrepTask1,
      testNames.smartPrepTask2,
    ]);
    await checkListPage.verifyMatchedTask(testNames.smartPrepTask1);
    await checkListPage.verifyMatchedTask(testNames.smartPrepTask2);

    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(DAY_ABBREVS[new Date().getDay()]);
    await checkListPage.selectTimeToDisplay();
    await checkListPage.selectTimeDue();
    await checkListPage.selectAssignedStores('Wasabi Tysons');

    await checkListPage.clickCreateTemplate();
    await checkListPage.verifyChecklistOnChecklistsTab(testNames.smartPrepAIMatch);

    await checkListPage.clickTemplatesTab();
    expect(await checkListPage.getTemplateTaskCount(testNames.smartPrepAIMatch))
      .toBe(EXPECTED_TASKS.aiMatch);
    results['AI Match Checklist'] = 'passed';
  });

  // ==========================================
  // Stage 5: Delete Checklist Template
  // ==========================================

  test('Delete checklist template from Templates tab', async () => {
    await checkListPage.clickTemplatesTab();
    await checkListPage.clickDeleteTemplate(testNames.smartPrepCheckListEdited);
    await checkListPage.confirmDeleteTemplate();
    await checkListPage.verifyTemplateDeleted(testNames.smartPrepCheckListEdited);
    results['Delete Checklist Template'] = 'passed';
  });

  // ==========================================
  // Stage 6: Temperature Task + Scheduled Checklist
  // ==========================================

  test('Create temperature task, schedule it today and verify both weekly occurrences', async () => {
    // Create the task on the Tasks tab with a Temperature response type.
    await checkListPage.clickTasksTab();
    await checkListPage.clickCreateTaskButton();
    await checkListPage.fillCreateTaskModal(
      testNames.smartPrepTempTask,
      'Temperature',
      'Automated task for walk-in temperature check'
    );
    await checkListPage.verifyTaskCreated(testNames.smartPrepTempTask);

    // Build a checklist template around that existing task.
    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepTempCheckList);
    await checkListPage.clickAddTask();
    await checkListPage.addExistingTaskItem(testNames.smartPrepTempTask);

    // Schedule it for today, displaying at least 20 minutes from now.
    const today = new Date();
    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(DAY_ABBREVS[today.getDay()]);
    await checkListPage.selectTimeToDisplay(20);
    await checkListPage.selectTimeDue();
    await checkListPage.selectAssignedStores('Wasabi Tysons');
    await checkListPage.clickCreateTemplate();

    // A weekly schedule generates an occurrence today and again on the same weekday next week.
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const scheduledDates = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepTempCheckList
    );
    expect(scheduledDates).toContain(toChecklistDateHeading(today));
    expect(scheduledDates).toContain(toChecklistDateHeading(nextWeek));

    results['Temperature Task Checklist Schedule'] = 'passed';
  });

  // ==========================================
  // Stage 7: Skip / Delete 15-minute Lock Window
  // ==========================================

  test('Scheduling inside the 15-minute window skips today and leaves later occurrences actionable', async () => {
    const today = new Date();
    const todayHeading = toChecklistDateHeading(today);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekHeading = toChecklistDateHeading(nextWeek);

    // Schedule at the next 15-minute slot, which is always less than 15 minutes away.
    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepLockedCheckList);
    await checkListPage.clickAddTask();
    await checkListPage.addExistingTaskItem(testNames.smartPrepTempTask);

    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(DAY_ABBREVS[today.getDay()]);
    await checkListPage.selectTimeToDisplay(0);
    await checkListPage.selectTimeDue();
    await checkListPage.selectAssignedStores('Wasabi Tysons');
    await checkListPage.clickCreateTemplate();

    // Because the display time falls inside the 15-minute window, the app does not generate
    // today's occurrence at all — the first one lands on the next scheduled weekday instead.
    const lockedDates = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepLockedCheckList
    );
    expect(lockedDates).not.toContain(todayHeading);
    expect(lockedDates).toContain(nextWeekHeading);

    // That future occurrence sits far outside the window, so both actions stay available.
    const nextWeekState = await checkListPage.getOccurrenceActionState(
      testNames.smartPrepLockedCheckList,
      nextWeekHeading
    );
    expect(nextWeekState.skipEnabled).toBe(true);
    expect(nextWeekState.deleteEnabled).toBe(true);

    // Stage 6's checklist was scheduled at least 20 minutes out, so its occurrence for today
    // does exist and is still outside the window — the actions are driven by the clock, not
    // by the date. It has not been skipped yet, so both actions are still open here.
    const tempTodayState = await checkListPage.getOccurrenceActionState(
      testNames.smartPrepTempCheckList,
      todayHeading
    );
    expect(tempTodayState.status).toBe('Upcoming');
    expect(tempTodayState.skipEnabled).toBe(true);
    expect(tempTodayState.deleteEnabled).toBe(true);

    results['Skip And Delete Lock Window'] = 'passed';
  });

  // ==========================================
  // Stage 8: Skip a Checklist Occurrence
  // ==========================================

  test('Skip the temperature checklist occurrence and verify it is marked Skipped', async () => {
    const todayHeading = toChecklistDateHeading(new Date());
    await checkListPage.navigateToSmartPrep();

    // Stage 7 left this occurrence Upcoming and actionable, so Skip is available here.
    await checkListPage.skipOccurrence(testNames.smartPrepTempCheckList, todayHeading);

    // The "Upcoming" column flips to "Skipped" and the kebab's first entry becomes
    // "Un-skip this checklist", which is still enabled so the skip can be reversed.
    const skippedState = await checkListPage.getOccurrenceActionState(
      testNames.smartPrepTempCheckList,
      todayHeading
    );
    expect(skippedState.status).toBe('Skipped');
    expect(skippedState.skipEnabled).toBe(true);

    results['Skip Checklist Occurrence'] = 'passed';
  });

  // ==========================================
  // Stage 9: Schedule With A Display Time In The Past
  // ==========================================

  test('Scheduling a display time before the current time creates only the next week occurrence', async () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepPastTimeCheckList);

    // Built inline rather than reusing an earlier stage's task, so this stage can be run on
    // its own - every run gets a fresh TEST_RUN_ID, so another run's data is unreachable.
    await checkListPage.clickAddTask();
    await checkListPage.addTaskItem('Cleaning', 'Checkmark');

    // Same weekday as today, but at a display time the clock has already passed.
    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(DAY_ABBREVS[today.getDay()]);
    await checkListPage.selectPastTimeToDisplay();
    await checkListPage.selectTimeDue();
    await checkListPage.selectAssignedStores('Wasabi Tysons');
    await checkListPage.clickCreateTemplate();

    // Today's display time is already behind the clock, so the app generates no occurrence
    // for today - the weekly schedule produces exactly one, on the same weekday next week.
    const scheduledDates = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepPastTimeCheckList
    );
    expect(scheduledDates).toEqual([toChecklistDateHeading(nextWeek)]);

    results['Past Time Checklist Schedule'] = 'passed';
  });
});
