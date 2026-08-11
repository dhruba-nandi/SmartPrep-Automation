import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { CheckListPage } from '../../pages/SmartPrep/CheckListPage';
import { PrepListPage } from '../../pages/SmartPrep/PrepListPage';
import { testNames } from '../../fixtures/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Recipe Smart Prep', () => {
  let checkListPage: CheckListPage;
  let prepListPage: PrepListPage;

  const { results, logResults } = createResultsTracker('Recipe Smart Prep', [
    'Create Checklist Template',
    'Edit Checklist Template',
    'Create Tasks',
    'AI Match Checklist',
    'Create Prep List Template',
    'Edit Prep List Template',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    checkListPage = new CheckListPage(persistentPage);
    prepListPage = new PrepListPage(persistentPage);
  });

  test.afterAll(async () => {
    logResults();
  });

  // ==========================================
  // Stage 1: Create Checklist Template
  // ==========================================

  test.skip('Create checklist template with sections and tasks', async () => {
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
    const today = days[new Date().getDay()];
    await checkListPage.clickAddSchedule();
    await checkListPage.selectScheduleDay(today);
    await checkListPage.selectTimeToDisplay();
    await checkListPage.selectTimeDue();
    await checkListPage.selectAssignedStores('Wasabi Tysons');

    await checkListPage.clickCreateTemplate();
    await checkListPage.verifyChecklistOnChecklistsTab(testNames.smartPrepCheckList);
    results['Create Checklist Template'] = 'passed';
  });

  // ==========================================
  // Stage 2: Edit Checklist Template
  // ==========================================

  test.skip('Edit checklist template - rename, add task and change time', async () => {
    await checkListPage.clickTemplatesTab();
    await checkListPage.clickTemplateToEdit(testNames.smartPrepCheckList);
    await checkListPage.editTemplateName(testNames.smartPrepCheckListEdited);
    await checkListPage.clickAddTask();
    await checkListPage.addTaskItem('Equipment Check', 'Checkmark');
    await checkListPage.updateDisplayTime();
    await checkListPage.clickSaveTemplate();
    await checkListPage.selectApplyOptionAndSave();
    await checkListPage.verifyChecklistOnChecklistsTab(testNames.smartPrepCheckListEdited);
    results['Edit Checklist Template'] = 'passed';
  });

  // ==========================================
  // Stage 3: Create Tasks
  // ==========================================

  test.skip('Create tasks from Tasks tab', async () => {
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

  test.skip('Create checklist using AI Match tasks', async () => {
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
    results['AI Match Checklist'] = 'passed';
  });

  // ==========================================
  // Stage 5: Create Prep List Template
  // ==========================================

  test('Create prep list template with recipes and schedule', async () => {
    await prepListPage.navigateToPrepList();
    await prepListPage.clickCreatePrepList();
    await prepListPage.fillPrepListName(testNames.prepList);

    await prepListPage.clickAddRecipe();
    await prepListPage.addRecipeItem(testNames.prepItem1);
    await prepListPage.clickAddShelfLife();
    await prepListPage.fillSaveRecipeModal('1', 'day', '1', 'kilogram');

    await prepListPage.addRecipeRow();
    await prepListPage.addRecipeItem(testNames.prepItem2);
    await prepListPage.clickAddShelfLife();
    await prepListPage.fillSaveRecipeModal('1', 'day', '1', 'kilogram');

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[new Date().getDay()];
    await prepListPage.clickAddSchedule();
    await prepListPage.selectScheduleDay(today);
    await prepListPage.selectTimeToDisplay();
    await prepListPage.selectTimeDue();
    await prepListPage.selectAssignedStores('Wasabi Tysons');

    await prepListPage.clickCreateTemplate();
    await prepListPage.verifyPrepListOnPrepListsTab(testNames.prepList);
    results['Create Prep List Template'] = 'passed';
  });

  // ==========================================
  // Stage 6: Edit Prep List Template
  // ==========================================

  test('Edit prep list template - rename, add recipe and change time', async () => {
    await prepListPage.clickTemplatesTab();
    await prepListPage.clickTemplateToEdit(testNames.prepList);
    await prepListPage.editPrepListName(testNames.prepListEdited);

    await prepListPage.addSection();
    await prepListPage.addRecipeItem(testNames.prepItem3);
    await prepListPage.clickAddShelfLife();
    await prepListPage.fillSaveRecipeModal('1', 'day', '1', 'kilogram');

    await prepListPage.updateDisplayTime();
    await prepListPage.clickSaveTemplate();
    await prepListPage.selectApplyOptionAndSave();
    await prepListPage.verifyPrepListOnTemplatesTab(testNames.prepListEdited);
    results['Edit Prep List Template'] = 'passed';
  });
});
