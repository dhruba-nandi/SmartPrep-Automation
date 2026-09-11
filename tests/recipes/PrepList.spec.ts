import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { PrepListPage } from '../../pages/recipes/SmartPrep/PrepListPage';
import { PreparedItemsPage } from '../../pages/recipes/recipe/PreparedItemsPage';
import { testNames } from '../../fixtures/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Recipe Prep List', () => {
  let prepListPage: PrepListPage;
  let preparedItemsPage: PreparedItemsPage;

  const { results, logResults } = createResultsTracker('Recipe Prep List', [
    'Create Prep List Template',
    'Edit Prep List Template',
    'Verify Prep Items in Prepared Items',
    'Create Prep List with AI Match',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    prepListPage = new PrepListPage(persistentPage);
    preparedItemsPage = new PreparedItemsPage(persistentPage);
  });

  test.afterAll(async () => {
    logResults();
  });

  // ==========================================
  // Stage 1: Create Prep List Template
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
  // Stage 2: Edit Prep List Template
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

  // ==========================================
  // Stage 3: Verify Prep Items in Prepared Items
  // ==========================================

  test('Verify prep items appear on Prepared Items page', async () => {
    await preparedItemsPage.navigateToPreparedItems();
    await preparedItemsPage.searchAndVerifyPreparedItem(testNames.prepItem1);
    await preparedItemsPage.searchAndVerifyPreparedItem(testNames.prepItem2);
    await preparedItemsPage.searchAndVerifyPreparedItem(testNames.prepItem3);
    results['Verify Prep Items in Prepared Items'] = 'passed';
  });

  // ==========================================
  // Stage 4: Create Prep List with AI Match
  // ==========================================

  test('Create prep list using AI Match', async () => {
    await prepListPage.navigateToPrepList();
    await prepListPage.clickCreatePrepList();
    await prepListPage.fillPrepListName(testNames.prepListAIMatch);

    await prepListPage.clickMatchTasksButton();
    await prepListPage.fillAndMatchTasks([
      testNames.prepItem1,
      testNames.prepItem2,
      testNames.prepItem3,
    ]);
    await prepListPage.verifyMatchedTask(testNames.prepItem1);
    await prepListPage.verifyMatchedTask(testNames.prepItem2);
    await prepListPage.verifyMatchedTask(testNames.prepItem3);

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[new Date().getDay()];
    await prepListPage.clickAddSchedule();
    await prepListPage.selectScheduleDay(today);
    await prepListPage.selectTimeToDisplay();
    await prepListPage.selectTimeDue();
    await prepListPage.selectAssignedStores('Wasabi Tysons');

    await prepListPage.clickCreateTemplate();
    await prepListPage.verifyPrepListOnTemplatesTab(testNames.prepListAIMatch);
    results['Create Prep List with AI Match'] = 'passed';
  });
});
