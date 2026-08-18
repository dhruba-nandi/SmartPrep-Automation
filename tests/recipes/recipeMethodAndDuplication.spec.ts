import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { ProductPage } from '../../pages/recipes/product/ProductPage';
import { VendorItemPage } from '../../pages/recipes/vendorItem/VendorItemPage';
import { OrderPage } from '../../pages/recipes/reconciliation/OrderPage';
import { MenuItemsPage } from '../../pages/recipes/recipe/MenuItemsPage';
import { RecipeSetupPage } from '../../pages/recipes/recipe/RecipeSetupPage';
import { CountSheet } from '../../pages/recipes/inventory&CountSheet/CountSheet';
import { Inventory } from '../../pages/recipes/inventory&CountSheet/Inventory';
import { RestaurantUnitPage } from '../../pages/recipes/restaurantUnit/RestaurantUnitPage';
import { testNames } from '../../fixtures/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Recipe Method and Duplication', () => {
  let productPage: ProductPage;
  let vendorItemPage: VendorItemPage;
  let orderPage: OrderPage;
  let menuItemsPage: MenuItemsPage;
  let countSheetPage: CountSheet;
  let inventoryPage: Inventory;
  let restaurantUnitPage: RestaurantUnitPage;
  let recipeSetupPage: RecipeSetupPage;

  const { results, logResults } = createResultsTracker('Recipe Method and Duplication', [
    // Recipe Type
    'Add Menu Recipe Type',
    // Recipe Methods
    'Add Menu Item With Methods',
    'Verify Recipe Methods',
    'Unsupported Image Format Modal',
    // Duplicate Recipe
    'Add Duplicate Recipe Product',
    'Create Duplicate Recipe Source',
    'Create Duplicate Recipe',
    'Verify Duplicate Recipe Name',
    // Cross-Tenant — Duplicate Recipe
    'Switch Tenant To Natick For Duplicate',
    'Verify Duplicate Recipe In Natick',
    'Switch Tenant Back After Duplicate',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    productPage = new ProductPage(persistentPage);
    vendorItemPage = new VendorItemPage(persistentPage);
    orderPage = new OrderPage(persistentPage);
    menuItemsPage = new MenuItemsPage(persistentPage);
    countSheetPage = new CountSheet(persistentPage);
    inventoryPage = new Inventory(persistentPage);
    restaurantUnitPage = new RestaurantUnitPage(persistentPage);
    recipeSetupPage = new RecipeSetupPage(persistentPage);
  });

  test.afterAll(async () => {
    logResults();
  });

  // ==========================================
  // Stage 1: Recipe Type Setup
  // ==========================================

  test('Add Menu recipe type', async () => {
    await recipeSetupPage.navigateToRecipeSetup();
    await recipeSetupPage.clickManageRecipeTypes();
    await recipeSetupPage.addRecipeType(testNames.recipeTypeMenu, 'Menu Items');
    results['Add Menu Recipe Type'] = 'passed';
  });

  // ==========================================
  // Stage 2: Recipe Methods — Create & Verify
  // ==========================================

  test('Add menu item with 5 method steps and attachments', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.recipe, testNames.recipeTypeMenu, '1', 'case');

    await menuItemsPage.addMultipleMethods([
      { text: 'Step 1: Prepare all ingredients and mise en place', filePath: 'method1.jpg' },
      { text: 'Step 2: Combine dry ingredients and mix thoroughly', filePath: 'method2.jpg' },
      { text: 'Step 3: Add wet ingredients and fold gently', filePath: 'method3.jpg' },
      { text: 'Step 4: Cook at the proper temperature until done', filePath: 'method4.jpg' },
      { text: 'Step 5: Plate and garnish before serving', filePath: 'method5.jpg' },
    ]);

    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add Menu Item With Methods'] = 'passed';
  });

  test('Verify recipe method steps and images on view page', async () => {
    await menuItemsPage.searchMenuItem(testNames.recipe);
    await menuItemsPage.openMenuItemByName(testNames.recipe);
    await menuItemsPage.verifyMethodSteps([
      'Step 1: Prepare all ingredients and mise en place',
      'Step 2: Combine dry ingredients and mix thoroughly',
      'Step 3: Add wet ingredients and fold gently',
      'Step 4: Cook at the proper temperature until done',
      'Step 5: Plate and garnish before serving',
    ]);
    results['Verify Recipe Methods'] = 'passed';
  });

  test('Verify unsupported image format modal on method upload', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.recipe, testNames.recipeTypeMenu, '1', 'case');
    await menuItemsPage.scrollToMethodSection();
    await menuItemsPage.uploadUnsupportedMethodAttachment(0, 'unsupported.avif');
    results['Unsupported Image Format Modal'] = 'passed';
  });

  // ==========================================
  // Stage 3: Duplicate Recipe — Create & Verify
  // ==========================================

  test('Add product for duplicate recipe with price $10', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.duplicateRecipeProduct);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Each');
    await productPage.setProductPrice('10');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.duplicateRecipeProduct);
    results['Add Duplicate Recipe Product'] = 'passed';
  });

  test('Create recipe for duplication', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.duplicateRecipe, testNames.recipeTypeMenu, '1', 'each');
    await menuItemsPage.addIngredient(testNames.duplicateRecipeProduct, '1', 'each');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Create Duplicate Recipe Source'] = 'passed';
  });

  test('Create duplicate recipe via More Options', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.duplicateRecipe);
    await menuItemsPage.openMenuItemByName(testNames.duplicateRecipe);
    await menuItemsPage.clickMoreOptions();
    await menuItemsPage.clickCreateDuplicateRecipe();
    await menuItemsPage.scrollToBottomAndSave();
    results['Create Duplicate Recipe'] = 'passed';
  });

  test('Verify duplicate recipe name on detail page', async ({ persistentPage }) => {
    const duplicateName = `Copy1-${testNames.duplicateRecipe}`;
    await persistentPage.waitForTimeout(2000);
    const nameOnPage = await menuItemsPage.getRecipeDetailName();
    expect(nameOnPage).toContain(duplicateName);
    results['Verify Duplicate Recipe Name'] = 'passed';
  });

  // ==========================================
  // Stage 4: Cross-Tenant — Duplicate Recipe
  // ==========================================

  test('Switch tenant to Wasabi Natick after duplicate', async () => {
    await menuItemsPage.switchTenant('Wasabi Natick');
    results['Switch Tenant To Natick For Duplicate'] = 'passed';
  });

  test('Verify duplicate recipe is listed in Wasabi Natick', async () => {
    const duplicateName = `Copy1-${testNames.duplicateRecipe}`;
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(duplicateName);
    const row = menuItemsPage['page'].getByRole('row').filter({ hasText: duplicateName }).first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await expect(row).toBeVisible();
    results['Verify Duplicate Recipe In Natick'] = 'passed';
  });

  test('Switch tenant back to Wasabi Tysons after duplicate check', async () => {
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch Tenant Back After Duplicate'] = 'passed';
  });
});
