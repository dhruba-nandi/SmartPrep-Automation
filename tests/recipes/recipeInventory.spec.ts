import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { ProductPage } from '../../pages/product/ProductPage';
import { MenuItemsPage } from '../../pages/recipe/MenuItemsPage';
import { RecipeSetupPage } from '../../pages/recipe/RecipeSetupPage';
import { CountSheet } from '../../pages/inventory&CountSheet/CountSheet';
import { Inventory } from '../../pages/inventory&CountSheet/Inventory';
import { RestaurantUnitPage } from '../../pages/restaurantUnit/RestaurantUnitPage';
import { testNames } from '../../fixtures/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Recipe Active Deactive', () => {
  let productPage: ProductPage;
  let menuItemsPage: MenuItemsPage;
  let countSheetPage: CountSheet;
  let inventoryPage: Inventory;
  let restaurantUnitPage: RestaurantUnitPage;
  let recipeSetupPage: RecipeSetupPage;

  const { results, logResults } = createResultsTracker('Recipe Active Deactive', [
    // Tenant & Recipe Type
    'Switch To Wasabi Tysons',
    'Add Menu Recipe Type',
    // Product & Recipe Setup
    'Add Product',
    'Add Menu Item',
    // Inventory Lifecycle
    'Create Count Sheet',
    'Close Inventory',
    'Update Inventory',
    'Reopen Inventory',
    'Deactivate Recipe',
    'Delete Inventory',
    'Deactivate Recipe After Delete Inventory',
    // Same Company Tenant Check
    'Add Product 2',
    'Add Menu Item 2',
    'Create Count Sheet 2',
    'Close Inventory 2',
    'Switch Tenant',
    'Deactivate Recipe In Use',
    'Switch Tenant Back',
    // Cross-Company Tenant Check
    'Add Tenant',
    'Add Product 3',
    'Add Menu Item 3',
    'Create Count Sheet 3',
    'Save and Exit Inventory 3',
    'Switch Tenant To New',
    'Deactivate Recipe In Use 2',
    'Switch Tenant Back 2',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    productPage = new ProductPage(persistentPage);
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
  // Stage 1: Tenant & Recipe Type Setup
  // ==========================================

  test('Switch to Wasabi Tysons', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch To Wasabi Tysons'] = 'passed';
  });

  test('Add Menu recipe type', async () => {
    await recipeSetupPage.navigateToRecipeSetup();
    await recipeSetupPage.clickManageRecipeTypes();
    await recipeSetupPage.addRecipeType(testNames.recipeTypeMenu, 'Menu Items');
    results['Add Menu Recipe Type'] = 'passed';
  });

  // ==========================================
  // Stage 2: Product & Recipe Setup
  // ==========================================

  test('Add new product', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.s3Product);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Case');
    await productPage.setProductPrice('75');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.s3Product);
    results['Add Product'] = 'passed';
  });

  test('Add new menu item with ingredient', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.s3Recipe, testNames.recipeTypeMenu, '1', 'case');
    await menuItemsPage.addIngredient(testNames.s3Product, '1', 'case');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add Menu Item'] = 'passed';
  });

  // ==========================================
  // Stage 3: Inventory Lifecycle — Create & Close
  // ==========================================

  test('Create an inventory count sheet', async () => {
    await countSheetPage.navigateToInventorySetup();
    await countSheetPage.clickAddCountSheet();
    await countSheetPage.fillCountSheetName(testNames.countSheet);
    await countSheetPage.clickAddRecipe();
    await countSheetPage.searchAndSelectRecipe(testNames.s3Recipe);
    await countSheetPage.clickAddRecipeInModal();
    await countSheetPage.scrollToBottomAndSave();
    await countSheetPage.verifyCountSheetCreated(testNames.countSheet);
    results['Create Count Sheet'] = 'passed';
  });

  test('Close inventory count', async () => {
    await inventoryPage.navigateToInventoryCounts();
    await inventoryPage.selectMyStoreTab();
    await inventoryPage.selectCountSheet(testNames.countSheet);
    await inventoryPage.setInventoryDate();
    await inventoryPage.enterCountForRecipe(testNames.s3Recipe, '5');
    await inventoryPage.saveAndCloseInventory();
    await inventoryPage.confirmClose();
    await inventoryPage.navigateToInventoryCounts();
    await inventoryPage.verifyInventoryClosed(testNames.countSheet);
    results['Close Inventory'] = 'passed';
  });

  // ==========================================
  // Stage 4: Inventory Lifecycle — Update & Reopen
  // ==========================================

  test('Update inventory count sheet', async () => {
    await countSheetPage.navigateToInventorySetup();
    await countSheetPage.openCountSheet(testNames.countSheet);
    await countSheetPage.deleteRecipeFromCountSheet(testNames.s3Recipe);
    await countSheetPage.scrollToBottomAndSave();
    await countSheetPage.verifyRecipeRemoved(testNames.s3Recipe);
    results['Update Inventory'] = 'passed';
  });

  test('Reopen closed inventory', async () => {
    await inventoryPage.navigateToInventoryCounts();
    await inventoryPage.selectMyStoreTab();
    await inventoryPage.openClosedInventory(testNames.countSheet);
    await inventoryPage.clickReopen();
    await inventoryPage.verifyInventoryReopened(testNames.countSheet);
    results['Reopen Inventory'] = 'passed';
  });

  // ==========================================
  // Stage 5: Recipe Deactivation — Blocked & Success
  // ==========================================

  test('Deactivate recipe', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.s3Recipe);
    await menuItemsPage.openMenuItemByName(testNames.s3Recipe);
    await menuItemsPage.toggleRecipeOff();
    results['Deactivate Recipe'] = 'passed';
  });

  test('Delete saved inventory', async () => {
    await inventoryPage.navigateToInventoryCounts();
    await inventoryPage.selectMyStoreTab();
    await inventoryPage.openSavedInventory(testNames.countSheet);
    await inventoryPage.clickEdit();
    await inventoryPage.clickDeleteInventory();
    await inventoryPage.verifyInventoryDeleted(testNames.countSheet);
    results['Delete Inventory'] = 'passed';
  });

  test('Deactivate recipe after inventory delete', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.s3Recipe);
    await menuItemsPage.openMenuItemByName(testNames.s3Recipe);
    const result = await menuItemsPage.toggleRecipeOff();
    expect(result).toBe('deactivated');
    await menuItemsPage.verifyRecipeDisabled();
    results['Deactivate Recipe After Delete Inventory'] = 'passed';
  });

  // ==========================================
  // Stage 6: Same Company Tenant Check — Setup
  // ==========================================

  test('Add new product 2', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.product2);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Case');
    await productPage.setProductPrice('75');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.product2);
    results['Add Product 2'] = 'passed';
  });

  test('Add new menu item 2', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.recipe2, testNames.recipeTypeMenu, '1', 'case');
    await menuItemsPage.addIngredient(testNames.product2, '1', 'case');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add Menu Item 2'] = 'passed';
  });

  test('Create an inventory count sheet 2', async () => {
    await countSheetPage.navigateToInventorySetup();
    await countSheetPage.clickAddCountSheet();
    await countSheetPage.fillCountSheetName(testNames.countSheet2);
    await countSheetPage.clickAddRecipe();
    await countSheetPage.searchAndSelectRecipe(testNames.recipe2);
    await countSheetPage.clickAddRecipeInModal();
    await countSheetPage.scrollToBottomAndSave();
    await countSheetPage.verifyCountSheetCreated(testNames.countSheet2);
    results['Create Count Sheet 2'] = 'passed';
  });

  test('Save and exit inventory count 2', async () => {
    await inventoryPage.navigateToInventoryCounts();
    await inventoryPage.selectMyStoreTab();
    await inventoryPage.selectCountSheet(testNames.countSheet2);
    await inventoryPage.setInventoryDate();
    await inventoryPage.enterCountForRecipe(testNames.recipe2, '5');
    await inventoryPage.saveAndExitInventory();
    await inventoryPage.verifyInventoryIsCreated(testNames.countSheet2);
    results['Close Inventory 2'] = 'passed';
  });

  // ==========================================
  // Stage 7: Same Company Tenant Check — Deactivation Blocked
  // ==========================================

  test('Switch tenant to Wasabi Natick', async () => {
    await menuItemsPage.switchTenant('Wasabi Natick');
    results['Switch Tenant'] = 'passed';
  });

  test('Verify recipe in use cannot be deactivated', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.recipe2);
    await menuItemsPage.openMenuItemByName(testNames.recipe2);
    const result = await menuItemsPage.toggleRecipeOff();
    expect(result).toBe('in_use');
    results['Deactivate Recipe In Use'] = 'passed';
  });

  test('Switch tenant back to Wasabi Tysons', async () => {
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch Tenant Back'] = 'passed';
  });

  // ==========================================
  // Stage 8: Cross-Company Tenant — Create New Tenant
  // ==========================================

  test('Add new tenant', async () => {
    await restaurantUnitPage.navigateViaLeftNav();
    await restaurantUnitPage.verifyRestaurantUnitsPageLoaded();
    await restaurantUnitPage.clickBulkAddRestaurant();
    await restaurantUnitPage.clickCantFindCompanyLink();
    await restaurantUnitPage.selectConcept('Wasabi');
    await restaurantUnitPage.selectCompany('Mid-States Management Group');
    await restaurantUnitPage.checkCrossUnitReporting();
    await restaurantUnitPage.enterRestaurantUnitName(testNames.tenant);
    await restaurantUnitPage.selectState('Alabama');
    await restaurantUnitPage.enterZipCode('12345');
    await restaurantUnitPage.selectPOS('-- None --');
    await restaurantUnitPage.selectAccounting('-- None --');
    await restaurantUnitPage.enterSubscription('12');
    await restaurantUnitPage.scrollToBottomAndSave();
    await restaurantUnitPage.verifyTenantCreated();
    results['Add Tenant'] = 'passed';
  });

  // ==========================================
  // Stage 9: Cross-Company Tenant — Setup
  // ==========================================

  test('Add new product 3', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.product3);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Case');
    await productPage.setProductPrice('75');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.product3);
    results['Add Product 3'] = 'passed';
  });

  test('Add new menu item 3', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.recipe3, testNames.recipeTypeMenu, '1', 'case');
    await menuItemsPage.addIngredient(testNames.product3, '1', 'case');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add Menu Item 3'] = 'passed';
  });

  test('Create an inventory count sheet 3', async () => {
    await countSheetPage.navigateToInventorySetup();
    await countSheetPage.clickAddCountSheet();
    await countSheetPage.fillCountSheetName(testNames.countSheet3);
    await countSheetPage.clickAddRecipe();
    await countSheetPage.searchAndSelectRecipe(testNames.recipe3);
    await countSheetPage.clickAddRecipeInModal();
    await countSheetPage.scrollToBottomAndSave();
    await countSheetPage.verifyCountSheetCreated(testNames.countSheet3);
    results['Create Count Sheet 3'] = 'passed';
  });

  test('Save and exit inventory count 3', async () => {
    await inventoryPage.navigateToInventoryCounts();
    await inventoryPage.selectMyStoreTab();
    await inventoryPage.selectCountSheet(testNames.countSheet3);
    await inventoryPage.setInventoryDate();
    await inventoryPage.enterCountForRecipe(testNames.recipe3, '5');
    await inventoryPage.saveAndExitInventory();
    await inventoryPage.verifyInventoryIsCreated(testNames.countSheet3);
    results['Save and Exit Inventory 3'] = 'passed';
  });

  // ==========================================
  // Stage 10: Cross-Company Tenant — Deactivation Blocked
  // ==========================================

  test('Switch tenant to new tenant', async () => {
    await menuItemsPage.switchTenant(testNames.tenant);
    results['Switch Tenant To New'] = 'passed';
  });

  test('Verify recipe in use cannot be deactivated in new tenant', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.recipe3);
    await menuItemsPage.openMenuItemByName(testNames.recipe3);
    const result = await menuItemsPage.toggleRecipeOff();
    expect(result).toBe('in_use');
    results['Deactivate Recipe In Use 2'] = 'passed';
  });

  test('Switch tenant back to Wasabi Tysons after new tenant', async () => {
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch Tenant Back 2'] = 'passed';
  });
});
