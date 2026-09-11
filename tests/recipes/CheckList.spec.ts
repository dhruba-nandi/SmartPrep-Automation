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
  ]);

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

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    //const today = days[new Date().getDay()];
    await checkListPage.clickAddSchedule();
    for (const day of days) {
  await checkListPage.selectScheduleDay(day);
}
    //await checkListPage.selectScheduleDay(today);
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

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[new Date().getDay()];
    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(today);
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
});
