import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { ProductPage } from '../../pages/product/ProductPage';
import { VendorItemPage } from '../../pages/vendorItem/VendorItemPage';
import { OrderPage } from '../../pages/reconciliation/OrderPage';
import { MenuItemsPage } from '../../pages/recipe/MenuItemsPage';
import { RecipeSetupPage } from '../../pages/recipe/RecipeSetupPage';
import { testNames } from '../../fixtures/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Recipe Price Change', () => {
  let productPage: ProductPage;
  let vendorItemPage: VendorItemPage;
  let orderPage: OrderPage;
  let menuItemsPage: MenuItemsPage;
  let recipeSetupPage: RecipeSetupPage;
  let invoiceNumber: string;

  const { results, logResults } = createResultsTracker('Recipe Price Change', [
    // Tenant & Recipe Type
    'Switch To Wasabi Tysons',
    'Add Menu Recipe Type',
    // Product, Vendor Item & Recipe
    'Add Product',
    'Add Vendor Item',
    'Add Menu Item',
    'Verify Recipe Price',
    // Invoice Processing
    'File Uploaded',
    'End Preprocessing',
    'Initial Review',
    'Reconciliation',
    'Final Review',
    'Edit Product',
    'Verify Recipe Cost',
    // Cross-Tenant — Invoice Price
    'Switch Tenant To Natick For Price Check',
    'Verify Old Price In Natick',
    'Switch Tenant Back After Price Check',
    // UoM Products & Recipe
    'Add UoM Product 1',
    'Add UoM Product 2',
    'Add UoM Product 3',
    'Add UoM Recipe',
    'Verify UoM Recipe Price List',
    'Verify UoM Recipe Ingredient Total',
    // UoM SubRecipe
    'Add UoM SubRecipe',
    'Verify UoM SubRecipe Price List',
    'Verify UoM SubRecipe Ingredient Total',
    // Cross-Tenant — UoM Before Unit Change
    'Switch To Wasabi Natick',
    'Verify UoM Recipe Price In Natick',
    'Verify UoM Recipe Ingredient Total In Natick',
    'Switch Back To Wasabi Tysons',
    // UoM Unit Change & Verification
    'Change UoM Product 1 Unit To Pound',
    'Verify UoM Recipe Price After Unit Change',
    'Verify UoM SubRecipe Price After Unit Change',
    // Cross-Tenant — UoM After Unit Change
    'Switch To Natick After Unit Change',
    'Verify UoM Recipe Price In Natick After Unit Change',
    'Verify UoM SubRecipe Price In Natick After Unit Change',
    'Switch Back To Tysons After Unit Change',
    // UoMEdit — Products
    'Add UoMEdit Product 1',
    'Add UoMEdit Product 2',
    // UoMEdit — Recipe & SubRecipe
    'Add UoMEdit Recipe',
    'Add UoMEdit SubRecipe',
    // UoMEdit — Edit Ingredient Units
    'Edit UoMEdit Recipe Ingredient Units',
    // UoMEdit — Verify After Change (Tysons)
    'Verify UoMEdit Recipe Price After Change',
    'Verify UoMEdit SubRecipe Price After Change',
    // UoMEdit — Cross-Tenant After Change
    'Switch To Natick After UoMEdit Change',
    'Verify UoMEdit Recipe Price In Natick After Change',
    'Verify UoMEdit SubRecipe Price In Natick After Change',
    'Switch Back To Tysons After UoMEdit Change',
    // Default UoM Check
    'Add Default UoM Product',
    'Verify Default UoM Conversion',
    'Add Default UoM Recipe',
    'Verify Default UoM Recipe Price',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    productPage = new ProductPage(persistentPage);
    vendorItemPage = new VendorItemPage(persistentPage);
    orderPage = new OrderPage(persistentPage);
    menuItemsPage = new MenuItemsPage(persistentPage);
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
  // Stage 2: Product, Vendor Item & Recipe
  // ==========================================

  test('Add new product', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.s2Product);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Case');
    await productPage.setProductPrice('75');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.s2Product);
    results['Add Product'] = 'passed';
  });

  test('Add new vendor item', async () => {
    await vendorItemPage.navigateViaLeftNav();
    await vendorItemPage.verifyVendorItemsPageLoaded();
    await vendorItemPage.clickAddVendorItem();
    await vendorItemPage.selectVendor('Arrow');
    await vendorItemPage.enterVendorItemName(testNames.vendorItem);
    await vendorItemPage.selectProduct(testNames.s2Product);
    await vendorItemPage.clickAddPackagingOption();
    await vendorItemPage.fillPackagingDetails('1 Case', '1', 'Case', '75');
    await vendorItemPage.clickSave();
    await vendorItemPage.verifyVendorItemCreated(testNames.vendorItem);
    results['Add Vendor Item'] = 'passed';
  });

  test('Add new menu item with ingredient', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.s2Recipe, testNames.recipeTypeMenu, '1', 'case');
    await menuItemsPage.addIngredient(testNames.s2Product, '1', 'case');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add Menu Item'] = 'passed';
  });

  test('Verify recipe price after creation', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.s2Recipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.s2Recipe);
    expect(cost).toBe('75.00');
    results['Verify Recipe Price'] = 'passed';
  });

  // ==========================================
  // Stage 3: Invoice Processing — Price Update
  // ==========================================

  test('Upload invoice', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.clearSearchInput();
    await orderPage.uploadInvoiceImage();
    await orderPage.dismissUploadStatusModal();
    results['File Uploaded'] = 'passed';
  });

  test('End preprocessing', async () => {
    await orderPage.endPreprocessing();
    results['End Preprocessing'] = 'passed';
  });

  test('Verify invoice status is In Processing', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.verifyInvoiceStatusInProcessing();
  });

  test('Complete initial review', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.openFirstInProcessingOrder();
    await orderPage.selectVendor('Arrow');
    invoiceNumber = await orderPage.generateAndFillInvoiceNumber();
    await orderPage.fillInvoiceDateWithToday();
    await orderPage.dismissRemittanceAddressIfPresent();
    await orderPage.fillVerifiedTotal('80');
    await orderPage.setHandwritingToNo();
    await orderPage.markInitialReviewComplete();
    await orderPage.saveAndCompleteInitialReview();
    results['Initial Review'] = 'passed';
  });

  test('Complete reconciliation', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.searchAndOpenOrder(invoiceNumber);
    await orderPage.waitForLockAndProcessInvoice();
    await orderPage.selectVendor('Arrow');
    await orderPage.fillExistingInvoiceNumber(invoiceNumber);
    await orderPage.fillInvoiceDateWithToday();
    await orderPage.dismissRemittanceAddressIfPresent();
    await orderPage.addExistingVendorLineItem(testNames.vendorItem);
    await orderPage.setHandwritingToNo();
    await orderPage.markReconciliationComplete();
    await orderPage.saveAndCompleteReconciliation();
    await orderPage.clickVerifiedInModal();
    results['Reconciliation'] = 'passed';
  });

  // ==========================================
  // Stage 4: Final Review & Price Verification
  // ==========================================

  let invoiceStatus: 'in_processing' | 'closed' = 'in_processing';

  test('Verify invoice status after reconciliation', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.searchOrderInList(invoiceNumber);

    const inProcessingCell = orderPage['page'].getByRole('cell', { name: /in processing/i }).first();
    const closedCell = orderPage['page'].getByRole('cell', { name: /closed/i }).first();

    try {
      await inProcessingCell.waitFor({ state: 'visible', timeout: 15000 });
      invoiceStatus = 'in_processing';
    } catch {
      await closedCell.waitFor({ state: 'visible', timeout: 15000 });
      invoiceStatus = 'closed';
    }
  });

  test('Complete final review', async () => {
    test.skip(invoiceStatus !== 'in_processing', 'Skipping — invoice is already Closed');
    await orderPage.navigateToOrdersList();
    await orderPage.searchAndOpenOrder(invoiceNumber);
    await orderPage.markOrderReviewedForClose();
    await orderPage.saveAndCompleteFinalReview();
    await orderPage.clickVerifiedInModal();
    results['Final Review'] = 'passed';
  });

  test('Edit product', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.searchProduct(testNames.s2Product);
    await productPage.openProductByName(testNames.s2Product);
    await productPage.clickEditProduct();
    await productPage.scrollToBottomAndSave();
    results['Edit Product'] = 'passed';
  });

  test('Verify recipe cost after order close', async ({ persistentPage }) => {
    let cost = '';
    for (let attempt = 1; attempt <= 5; attempt++) {
      await menuItemsPage.navigateToMenuItems();
      await menuItemsPage.verifyMenuItemsPageLoaded();
      await menuItemsPage.searchMenuItem(testNames.s2Recipe);
      cost = await menuItemsPage.getMenuItemCost(testNames.s2Recipe);
      if (cost.includes('80')) break;
      await persistentPage.waitForTimeout(15000);
    }
    expect(cost).toContain('80');
    results['Verify Recipe Cost'] = 'passed';
  });

  // ==========================================
  // Stage 5: Cross-Tenant — Invoice Price Check
  // ==========================================

  test('Switch tenant to Wasabi Natick to verify old price', async () => {
    await menuItemsPage.switchTenant('Wasabi Natick');
    results['Switch Tenant To Natick For Price Check'] = 'passed';
  });

  test('Verify recipe shows old price in Wasabi Natick', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.s2Recipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.s2Recipe);
    expect(cost).toBe('75.00');
    results['Verify Old Price In Natick'] = 'passed';
  });

  test('Switch tenant back to Wasabi Tysons after price check', async () => {
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch Tenant Back After Price Check'] = 'passed';
  });

  // ==========================================
  // Stage 6: UoM Products (Kilogram)
  // ==========================================

  test('Add UoM product 1 with price $10', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.uomProduct1);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Kilogram');
    await productPage.setProductPrice('10');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.uomProduct1);
    results['Add UoM Product 1'] = 'passed';
  });

  test('Add UoM product 2 with price $20', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.uomProduct2);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Kilogram');
    await productPage.setProductPrice('20');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.uomProduct2);
    results['Add UoM Product 2'] = 'passed';
  });

  test('Add UoM product 3 with price $30', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.uomProduct3);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Kilogram');
    await productPage.setProductPrice('30');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.uomProduct3);
    results['Add UoM Product 3'] = 'passed';
  });

  // ==========================================
  // Stage 7: UoM Recipe — Create & Verify
  // ==========================================

  test('Create UoM recipe with 3 kilogram products', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.uomRecipe, testNames.recipeTypeMenu, '1', 'kilogram');
    await menuItemsPage.addIngredient(testNames.uomProduct1, '1', 'kilogram');
    await menuItemsPage.clickAddIngredient();
    await menuItemsPage.addIngredient(testNames.uomProduct2, '1', 'kilogram');
    await menuItemsPage.clickAddIngredient();
    await menuItemsPage.addIngredient(testNames.uomProduct3, '1', 'kilogram');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add UoM Recipe'] = 'passed';
  });

  test('Verify UoM recipe price on list page', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomRecipe);
    expect(cost).toBe('60.00');
    results['Verify UoM Recipe Price List'] = 'passed';
  });

  test('Verify UoM recipe ingredient total on detail page', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomRecipe);
    await menuItemsPage.openMenuItemByName(testNames.uomRecipe);
    const total = await menuItemsPage.getDetailPageIngredientTotal();
    expect(total).toBe('60.00');
    results['Verify UoM Recipe Ingredient Total'] = 'passed';
  });

  // ==========================================
  // Stage 8: UoM SubRecipe — Create & Verify
  // ==========================================

  test('Create UoM sub-recipe using UoM recipe as ingredient', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.uomSubRecipe, testNames.recipeTypeMenu, '1', 'kilogram');
    await menuItemsPage.addIngredient(testNames.uomRecipe, '1', 'kilogram');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add UoM SubRecipe'] = 'passed';
  });

  test('Verify UoM sub-recipe price on list page', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomSubRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomSubRecipe);
    expect(cost).toBe('60.00');
    results['Verify UoM SubRecipe Price List'] = 'passed';
  });

  test('Verify UoM sub-recipe ingredient total on detail page', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomSubRecipe);
    await menuItemsPage.openMenuItemByName(testNames.uomSubRecipe);
    const total = await menuItemsPage.getDetailPageIngredientTotal();
    expect(total).toBe('60.00');
    results['Verify UoM SubRecipe Ingredient Total'] = 'passed';
  });

  // ==========================================
  // Stage 9: Cross-Tenant — UoM Before Unit Change
  // ==========================================

  test('Switch to Wasabi Natick', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.switchTenant('Wasabi Natick');
    results['Switch To Wasabi Natick'] = 'passed';
  });

  test('Verify UoM recipe price in Wasabi Natick', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomRecipe);
    expect(cost).toBe('60.00');
    results['Verify UoM Recipe Price In Natick'] = 'passed';
  });

  test('Verify UoM recipe ingredient total in Wasabi Natick', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomRecipe);
    await menuItemsPage.openMenuItemByName(testNames.uomRecipe);
    const total = await menuItemsPage.getDetailPageIngredientTotal();
    expect(total).toBe('60.00');
    results['Verify UoM Recipe Ingredient Total In Natick'] = 'passed';
  });

  test('Switch back to Wasabi Tysons', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch Back To Wasabi Tysons'] = 'passed';
  });

  // ==========================================
  // Stage 10: Change UoM Product 1 — Kilogram to Pound
  // ==========================================

  test('Change UoM product 1 unit from Kilogram to Pound', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.searchProduct(testNames.uomProduct1);
    await productPage.openProductByName(testNames.uomProduct1);
    await productPage.clickEditProduct();
    await productPage.editUsedProductUnit('Pound');
    await productPage.scrollToBottomAndSave();
    results['Change UoM Product 1 Unit To Pound'] = 'passed';
  });

  // ==========================================
  // Stage 11: Verify Prices After Unit Change (Tysons)
  // ==========================================

  test('Verify UoM recipe price changed after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomRecipe);
    expect(cost).toBe('72.05');
    results['Verify UoM Recipe Price After Unit Change'] = 'passed';
  });

  test('Verify UoM sub-recipe price changed after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomSubRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomSubRecipe);
    expect(cost).toBe('72.05');
    results['Verify UoM SubRecipe Price After Unit Change'] = 'passed';
  });

  // ==========================================
  // Stage 12: Cross-Tenant — UoM After Unit Change
  // ==========================================

  test('Switch to Wasabi Natick after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.switchTenant('Wasabi Natick');
    results['Switch To Natick After Unit Change'] = 'passed';
  });

  test('Verify UoM recipe price in Natick after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomRecipe);
    expect(cost).toBe('72.05');
    results['Verify UoM Recipe Price In Natick After Unit Change'] = 'passed';
  });

  test('Verify UoM sub-recipe price in Natick after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomSubRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomSubRecipe);
    expect(cost).toBe('72.05');
    results['Verify UoM SubRecipe Price In Natick After Unit Change'] = 'passed';
  });

  test('Switch back to Wasabi Tysons after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch Back To Tysons After Unit Change'] = 'passed';
  });

  // ==========================================
  // Stage 13: UoMEdit — Products
  // ==========================================

  test('UoMEdit: Add product 1 with price $10', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.uomEditProduct1);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Kilogram');
    await productPage.setProductPrice('10');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.uomEditProduct1);
    results['Add UoMEdit Product 1'] = 'passed';
  });

  test('UoMEdit: Add product 2 with price $20', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.uomEditProduct2);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Kilogram');
    await productPage.setProductPrice('20');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.uomEditProduct2);
    results['Add UoMEdit Product 2'] = 'passed';
  });

  // ==========================================
  // Stage 14: UoMEdit — Recipe & SubRecipe
  // ==========================================

  test('UoMEdit: Create recipe with 2 kilogram products', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.uomEditRecipe, testNames.recipeTypeMenu, '1', 'kilogram');
    await menuItemsPage.addIngredient(testNames.uomEditProduct1, '1', 'kilogram');
    await menuItemsPage.clickAddIngredient();
    await menuItemsPage.addIngredient(testNames.uomEditProduct2, '1', 'kilogram');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add UoMEdit Recipe'] = 'passed';
  });

  test('UoMEdit: Create sub-recipe using recipe as ingredient', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.uomEditSubRecipe, testNames.recipeTypeMenu, '1', 'kilogram');
    await menuItemsPage.addIngredient(testNames.uomEditRecipe, '1', 'kilogram');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add UoMEdit SubRecipe'] = 'passed';
  });

  // ==========================================
  // Stage 15: UoMEdit — Edit Ingredient Units
  // ==========================================

  test('UoMEdit: Change recipe ingredient units to Pound', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomEditRecipe);
    await menuItemsPage.openMenuItemByName(testNames.uomEditRecipe);
    await menuItemsPage.openEditRecipeForm();
    await menuItemsPage.editIngredientUnit(0, 'pound');
    await menuItemsPage.editIngredientUnit(1, 'pound');
    await menuItemsPage.scrollToBottomAndSave();
    results['Edit UoMEdit Recipe Ingredient Units'] = 'passed';
  });

  // ==========================================
  // Stage 17: UoMEdit — Verify After Change (Tysons)
  // ==========================================

  test('UoMEdit: Verify recipe price after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomEditRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomEditRecipe);
    expect(cost).toBe('13.61');
    results['Verify UoMEdit Recipe Price After Change'] = 'passed';
  });

  test('UoMEdit: Verify sub-recipe price after unit change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomEditSubRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomEditSubRecipe);
    expect(cost).toBe('13.61');
    results['Verify UoMEdit SubRecipe Price After Change'] = 'passed';
  });

  // ==========================================
  // Stage 18: UoMEdit — Cross-Tenant After Change
  // ==========================================

  test('UoMEdit: Switch to Natick after change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.switchTenant('Wasabi Natick');
    results['Switch To Natick After UoMEdit Change'] = 'passed';
  });

  test('UoMEdit: Verify recipe price in Natick after change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomEditRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomEditRecipe);
    expect(cost).toBe('13.61');
    results['Verify UoMEdit Recipe Price In Natick After Change'] = 'passed';
  });

  test('UoMEdit: Verify sub-recipe price in Natick after change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.uomEditSubRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.uomEditSubRecipe);
    expect(cost).toBe('13.61');
    results['Verify UoMEdit SubRecipe Price In Natick After Change'] = 'passed';
  });

  test('UoMEdit: Switch back to Tysons after change', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.switchTenant('Wasabi Tysons');
    results['Switch Back To Tysons After UoMEdit Change'] = 'passed';
  });

  // ==========================================
  // Stage 19: Default UoM Check
  // ==========================================

  test('Add local product from central product (oil, canola)', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName('oil, canola');
    await productPage.selectCategory('Liquor');
    await productPage.setProductPrice('10');
    await productPage.clickSave();
    await productPage.verifyProductCreated('oil, canola');
    results['Add Default UoM Product'] = 'passed';
  });

  test('Verify default UoM conversion for oil, canola', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.searchProduct('oil, canola');
    await productPage.openProductByName('oil, canola');
    await productPage.clickEditProduct();
    await productPage.verifyDefaultUomConversion(
      '7.9', 'Ounces', '1', 'Cups',
      '1 Ounce most recently cost $0.079'
    );
    results['Verify Default UoM Conversion'] = 'passed';
  });

  test('Create recipe with oil, canola as ingredient (1 Ounce)', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.openAddMenuItemForm();
    await menuItemsPage.fillMenuItemDetails(testNames.defaultUomRecipe, testNames.recipeTypeMenu, '1', 'Ounce');
    await menuItemsPage.addIngredient('oil, canola', '1', 'Ounce');
    await menuItemsPage.clickSave();
    await menuItemsPage.verifyRedirectedToMenuItemsList();
    results['Add Default UoM Recipe'] = 'passed';
  });

  test('Verify default UoM recipe price', async () => {
    await menuItemsPage.navigateToMenuItems();
    await menuItemsPage.verifyMenuItemsPageLoaded();
    await menuItemsPage.searchMenuItem(testNames.defaultUomRecipe);
    const cost = await menuItemsPage.getMenuItemCost(testNames.defaultUomRecipe);
    expect(cost).toBe('0.08');
    results['Verify Default UoM Recipe Price'] = 'passed';
  });
});
