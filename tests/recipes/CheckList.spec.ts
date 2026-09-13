import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { CheckListPage, APPLY_TO } from '../../pages/recipes/SmartPrep/CheckListPage';
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
    print: 5,     // three tasks in the first section + two in the second
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
    'Print Checklist Occurrence',
    'Edit Applies To Future Only',
  ]);

  const DAY_ABBREVS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const DAY_HEADINGS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /** A new date `days` days after `date`, leaving the original untouched. */
  function addDays(date: Date, days: number): Date {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
  }

  /** Formats a date the way the Checklists tab groups its occurrences, e.g. "Fri 09/11/2026". */
  function toChecklistDateHeading(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${DAY_HEADINGS[date.getDay()]} ${mm}/${dd}/${date.getFullYear()}`;
  }

  /** Formats a date the way the printed PDF heads its page, e.g. "Sun, Sep 13". */
  function toPrintedDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

    // The edit was saved over the next 14 days of checklists, so the checklists the template
    // had already generated carry it too. Opening the first one on the Checklists tab brings up
    // its detail panel, and the Pending dropdown there lists the task just added alongside the
    // four the template started with.
    const pendingTasks = await checkListPage.getPendingTasksForOccurrence(
      testNames.smartPrepCheckListEdited
    );
    expect(pendingTasks).toContain('Equipment Check');
    expect(pendingTasks).toHaveLength(EXPECTED_TASKS.edited);

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
    // Create the task on the Tasks tab with a Temperature response type. Earlier stages leave
    // the browser on the Checklist page already, but navigating first is what lets this stage
    // and the one after it be run on their own.
    await checkListPage.navigateToSmartPrep();
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

    // Schedule it for today, displaying at least 30 minutes from now. Stages 7 and 8 read and
    // then skip this occurrence, and both need it to still be more than 15 minutes out by the
    // time they run, or the app will have locked Skip and Delete on it.
    const today = new Date();
    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(DAY_ABBREVS[today.getDay()]);
    await checkListPage.selectTimeToDisplay(30);
    await checkListPage.selectTimeDue();
    await checkListPage.selectAssignedStores('Wasabi Tysons');
    await checkListPage.clickCreateTemplate();

    // A weekly schedule generates an occurrence today and again on the same weekday next week.
    const nextWeek = addDays(today, 7);

    const scheduledDates = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepTempCheckList
    );
    expect(scheduledDates).toContain(toChecklistDateHeading(today));
    expect(scheduledDates).toContain(toChecklistDateHeading(nextWeek));

    results['Temperature Task Checklist Schedule'] = 'passed';
  });

  // ==========================================
  // Stage 7: Scheduling Inside The 15-minute Window
  // ==========================================

  test('Scheduling inside the 15-minute window skips today and leaves later occurrences actionable', async () => {
    const today = new Date();
    const todayHeading = toChecklistDateHeading(today);

    const nextWeek = addDays(today, 7);
    const nextWeekHeading = toChecklistDateHeading(nextWeek);

    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepLockedCheckList);
    await checkListPage.clickAddTask();
    await checkListPage.addExistingTaskItem(testNames.smartPrepTempTask);

    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(DAY_ABBREVS[today.getDay()]);

    // Five minutes out is well inside the 15-minute window. The dropdown lists only quarter-hour
    // slots, so how far away its earliest one is depends on where the clock happens to sit in
    // the quarter - anywhere from a few minutes to half an hour, which decides the outcome of
    // this test. The time is therefore typed in rather than picked off the list, which is what
    // makes the schedule land inside the window on every run.
    await checkListPage.selectDisplayTimeMinutesFromNow(5);
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

    // Stage 6's checklist was scheduled at least 30 minutes out, so its occurrence for today is
    // still comfortably outside the lock window — the actions are driven by the clock, not by
    // the date. It has not been skipped yet, so both actions are still open here.
    const tempTodayState = await checkListPage.getOccurrenceActionState(
      testNames.smartPrepTempCheckList,
      todayHeading
    );
    expect(tempTodayState.status).toBe('Upcoming');
    expect(tempTodayState.skipEnabled).toBe(true);
    expect(tempTodayState.deleteEnabled).toBe(true);

    // Reading that Delete is enabled only proves the app offers the action, so it is carried
    // out for real here. The locked checklist's next-week occurrence is the one asserted just
    // above to sit outside the lock window, and no later stage depends on it.
    await checkListPage.deleteOccurrence(testNames.smartPrepLockedCheckList, nextWeekHeading);

    // Asserting only that the heading is gone would also pass if the delete had wiped every
    // occurrence, so the whole remaining list is compared against what was there before minus
    // the one date deleted — the sibling occurrences have to survive.
    const remainingDates = await checkListPage.getRemainingScheduledDates(
      testNames.smartPrepLockedCheckList
    );
    expect(remainingDates).toEqual(lockedDates.filter((date) => date !== nextWeekHeading));

    // Deleting an occurrence removes that one date, not the template it was generated from.
    await checkListPage.clickTemplatesTab();
    await checkListPage.verifyTemplateExists(testNames.smartPrepLockedCheckList);

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

  test('Scheduling a display time before the current time creates the next two weekly occurrences', async () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const weekAfterNext = addDays(today, 14);

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
    // for today. The weekly schedule instead rolls forward and produces two occurrences, on
    // the same weekday next week and the week after that.
    const scheduledDates = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepPastTimeCheckList
    );
    expect(scheduledDates).toEqual([
      toChecklistDateHeading(nextWeek),
      toChecklistDateHeading(weekAfterNext),
    ]);

    results['Past Time Checklist Schedule'] = 'passed';
  });

  // ==========================================
  // Stage 10: Multi-Section, Multi-Schedule Checklist + Print
  // ==========================================

  test('Create a two-section, two-schedule checklist and print its occurrences', async () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    const todayHeading = toChecklistDateHeading(today);
    const tomorrowHeading = toChecklistDateHeading(tomorrow);

    // Five tasks split across the template's two sections, one per response type the app
    // offers, so the printed checklist carries every kind of response row.
    const firstSection = [
      { name: testNames.smartPrepPrintTask1, responseType: 'Checkmark' },
      { name: testNames.smartPrepPrintTask2, responseType: 'Numerical' },
      { name: testNames.smartPrepPrintTask3, responseType: 'Text entry' },
    ];
    const secondSection = [
      { name: testNames.smartPrepPrintTask4, responseType: 'Temperature' },
      { name: testNames.smartPrepPrintTask5, responseType: 'Yes/No' },
    ];

    // Print builds its PDF in the page and opens it as a blob URL that is revoked straight
    // away, so the capture has to be in place before the app loads - see the page object.
    await checkListPage.startCapturingPrintDocuments();

    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepPrintCheckList);

    // The first section starts empty, so every task needs its own row; adding a section
    // brings its first row with it, which is why only the tasks after it add one.
    for (const task of firstSection) {
      await checkListPage.clickAddTask();
      await checkListPage.addTaskItem(task.name, task.responseType);
    }
    await checkListPage.clickAddSection();
    for (const [index, task] of secondSection.entries()) {
      if (index > 0) await checkListPage.clickAddTask();
      await checkListPage.addTaskItem(task.name, task.responseType);
    }

    // Two schedules on different weekdays - today and tomorrow - each displaying far enough
    // ahead of the clock that the occurrence is generated and stays outside the lock window.
    const dueTimes = new Map<string, string>();
    for (const day of [today, tomorrow]) {
      await checkListPage.clickAddSchedule();
      await checkListPage.selectScheduleDay(DAY_ABBREVS[day.getDay()]);
      await checkListPage.selectTimeToDisplay(20);
      dueTimes.set(toChecklistDateHeading(day), await checkListPage.selectTimeDue());
      await checkListPage.selectAssignedStores('Wasabi Tysons');
    }
    await checkListPage.clickCreateTemplate();

    // Every task from both sections is carried by the template the print will be built from.
    await checkListPage.clickTemplatesTab();
    expect(await checkListPage.getTemplateTaskCount(testNames.smartPrepPrintCheckList))
      .toBe(EXPECTED_TASKS.print);

    // Both schedules land on the Checklists tab under their own date, and nothing lands on a
    // weekday that was never scheduled. Checking the weekday of every heading rather than an
    // exact list keeps the assertion independent of how far ahead the tab looks.
    const scheduledDates = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepPrintCheckList
    );
    expect(scheduledDates).toContain(todayHeading);
    expect(scheduledDates).toContain(tomorrowHeading);

    const scheduledWeekdays = [DAY_HEADINGS[today.getDay()], DAY_HEADINGS[tomorrow.getDay()]];
    for (const dateHeading of scheduledDates) {
      expect(scheduledWeekdays).toContain(dateHeading.split(' ')[0]);
    }

    // Print each schedule's occurrence. The app builds a PDF in the page - "%PDF-" is the file
    // signature every PDF opens with - and opens it in a new tab pointed at that same blob.
    for (const [dayIndex, day] of [today, tomorrow].entries()) {
      const dateHeading = [todayHeading, tomorrowHeading][dayIndex];
      const printed = await checkListPage.printOccurrence(
        testNames.smartPrepPrintCheckList,
        dateHeading
      );

      expect(printed.menuItemEnabled).toBe(true);
      expect(printed.type).toBe('application/pdf');
      expect(printed.header).toBe('%PDF-');
      expect(printed.size).toBeGreaterThan(0);
      expect(printed.previewUrl).toMatch(/^blob:/);

      // Everything the template was built from has to come back out of the printed page: the
      // occurrence it was printed for, and every task with the response type it was given.
      const printedText = printed.lines.join('\n');
      expect(printedText).toContain(testNames.smartPrepPrintCheckList);
      expect(printedText).toContain('Wasabi Tysons');
      expect(printedText).toContain(toPrintedDate(day));
      expect(printedText).toContain(`Due ${dueTimes.get(dateHeading)}`);

      for (const [sectionIndex, section] of [firstSection, secondSection].entries()) {
        expect(printedText).toContain(`Section ${sectionIndex + 1}`);
        for (const task of section) {
          expect(printedText).toContain(task.name);
          expect(printedText).toContain(task.responseType);
        }
      }
    }

    results['Print Checklist Occurrence'] = 'passed';
  });

  // ==========================================
  // Stage 11: Editing A Template With "Only apply to future checklists"
  // ==========================================

  test('Deleting a task and a schedule and applying to future checklists only leaves existing checklists untouched', async () => {
    // This stage builds two tasks, a two-schedule template and an edit of it before it reads
    // anything back, which is more than the file's default budget covers.
    test.setTimeout(600000);

    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);

    const tomorrowHeading = toChecklistDateHeading(tomorrow);
    const dayAfterHeading = toChecklistDateHeading(dayAfterTomorrow);

    await checkListPage.navigateToSmartPrep();

    // Two new tasks that differ only in the photo toggle, so the template carries the setting
    // both ways round. Neither name may contain the other: the template's task picker treats a
    // task whose name contains one already added to the template as added too, and offers it
    // disabled - which is why these are PhotoOn/PhotoOff rather than Photo/NoPhoto.
    await checkListPage.clickTasksTab();
    await checkListPage.clickCreateTaskButton();
    await checkListPage.fillCreateTaskModal(
      testNames.smartPrepPhotoTask,
      'Checkmark',
      'Automated task that requires a photo',
      true
    );
    await checkListPage.verifyTaskCreated(testNames.smartPrepPhotoTask);

    await checkListPage.clickCreateTaskButton();
    await checkListPage.fillCreateTaskModal(
      testNames.smartPrepNoPhotoTask,
      'Yes/No',
      'Automated task that needs no photo',
      false
    );
    await checkListPage.verifyTaskCreated(testNames.smartPrepNoPhotoTask);

    // A template carrying both tasks, scheduled on each of the next two days. Both days are
    // in the future, so neither schedule is anywhere near the 15-minute lock window.
    await checkListPage.navigateToSmartPrep();
    await checkListPage.clickCreateChecklist();
    await checkListPage.fillTemplateName(testNames.smartPrepEditScopeCheckList);
    await checkListPage.clickAddTask();
    await checkListPage.addExistingTaskItem(testNames.smartPrepPhotoTask);
    await checkListPage.clickAddTask();
    await checkListPage.addExistingTaskItem(testNames.smartPrepNoPhotoTask);

    // The two schedules are given different display times on purpose: the app folds schedules
    // that share a display time, due time and store into a single block carrying both days, and
    // this stage needs two blocks so that one of them can be deleted on its own.
    const displayOffsets = [20, 50];
    for (const [index, day] of [tomorrow, dayAfterTomorrow].entries()) {
      await checkListPage.clickAddSchedule();
      await checkListPage.selectScheduleDay(DAY_ABBREVS[day.getDay()]);
      await checkListPage.selectTimeToDisplay(displayOffsets[index]);
      await checkListPage.selectTimeDue();
      await checkListPage.selectAssignedStores('Wasabi Tysons');
    }
    await checkListPage.clickCreateTemplate();

    // Both schedules generate their occurrence before anything is edited.
    const scheduledDates = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepEditScopeCheckList
    );
    expect(scheduledDates).toContain(tomorrowHeading);
    expect(scheduledDates).toContain(dayAfterHeading);

    // What the first checklist holds before the edit, read from its own detail panel: both
    // tasks. This is the baseline the same checklist is compared against afterwards, so what
    // the edit did and did not change is measured rather than assumed.
    const pendingBeforeEdit = await checkListPage.getPendingTasksForOccurrence(
      testNames.smartPrepEditScopeCheckList,
      tomorrowHeading
    );
    expect(pendingBeforeEdit).toEqual([
      testNames.smartPrepPhotoTask,
      testNames.smartPrepNoPhotoTask,
    ]);

    // Edit the template down to one task and one schedule: the no-photo task goes, and so
    // does the second schedule - the one that generated the day-after-tomorrow occurrence.
    await checkListPage.clickTemplatesTab();
    await checkListPage.clickTemplateToEdit(testNames.smartPrepEditScopeCheckList);
    expect(await checkListPage.getScheduleCount()).toBe(2);
    // Sorted before comparing: a reopened template lists its schedule blocks in the app's own
    // order, not the order they were added, so only the set of scheduled days is meaningful.
    expect((await checkListPage.getSelectedScheduleDays()).sort()).toEqual(
      [DAY_HEADINGS[tomorrow.getDay()], DAY_HEADINGS[dayAfterTomorrow.getDay()]].sort()
    );

    await checkListPage.deleteTemplateTask(testNames.smartPrepNoPhotoTask);
    // Deleted by its weekday rather than by position, for the same reason: the block holding
    // the day-after-tomorrow schedule is not reliably the second one on the form.
    await checkListPage.deleteScheduleForDay(DAY_HEADINGS[dayAfterTomorrow.getDay()]);

    // The block that is left is the one for tomorrow, which is how the schedule that was
    // removed is known to be the right one.
    expect(await checkListPage.getScheduleCount()).toBe(1);
    expect(await checkListPage.getSelectedScheduleDays())
      .toEqual([DAY_HEADINGS[tomorrow.getDay()]]);

    await checkListPage.clickSaveTemplate();
    await checkListPage.selectApplyOptionAndSave(APPLY_TO.futureOnly);

    // The template itself now carries only the task that was kept.
    await checkListPage.clickTemplatesTab();
    expect(await checkListPage.getTemplateTaskCount(testNames.smartPrepEditScopeCheckList))
      .toBe(1);

    // "Only apply to future checklists" changes nothing the template has already generated:
    // the deleted schedule's occurrence is still on the Checklists tab, under every date it
    // was listed under before the edit.
    const datesAfterEdit = await checkListPage.getScheduledDatesForChecklist(
      testNames.smartPrepEditScopeCheckList
    );
    expect(datesAfterEdit).toContain(tomorrowHeading);
    expect(datesAfterEdit).toContain(dayAfterHeading);
    expect(datesAfterEdit).toEqual(scheduledDates);

    // ...and neither is the deleted task. Opening the first checklist on the Checklists tab
    // brings up its detail panel, and the Pending dropdown there still lists both tasks: the
    // task was deleted from the template only, not from the checklists it had already
    // generated.
    const pendingAfterEdit = await checkListPage.getPendingTasksForOccurrence(
      testNames.smartPrepEditScopeCheckList,
      tomorrowHeading
    );
    expect(pendingAfterEdit).toEqual(pendingBeforeEdit);

    results['Edit Applies To Future Only'] = 'passed';
  });
});
