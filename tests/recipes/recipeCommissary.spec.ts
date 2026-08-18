import { test, expect, createResultsTracker } from '../../fixtures/basePersistentContext';
import { VendorPage } from '../../pages/recipes/vendor/VendorPage';
import { PreparedItemsPage } from '../../pages/recipes/recipe/PreparedItemsPage';
import { VendorItemPage } from '../../pages/recipes/vendorItem/VendorItemPage';
import { PlaceOrderPage } from '../../pages/recipes/order/PlaceOrderPage';
import { InboundOrderPage } from '../../pages/recipes/order/InboundOrderPage';
import { testNames } from '../../fixtures/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Recipe Commissary Items', () => {
  let vendorPage: VendorPage;
  let preparedItemsPage: PreparedItemsPage;
  let vendorItemPage: VendorItemPage;
  let placeOrderPage: PlaceOrderPage;
  let inboundOrderPage: InboundOrderPage;

  const { results, logResults } = createResultsTracker('Recipe Commissary Items', [
    'Set Sysco As Commissary Vendor',
    'Create Commissary Recipe',
    'Verify Commissary Vendor Item Created',
    'Switch Tenant To Natick',
    'Set Vendor Item Order Guide To Yes',
    'Place Order With Commissary Item',
    'Switch Tenant Back To Tysons',
    'Ship Inbound Order From Natick',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    vendorPage = new VendorPage(persistentPage);
    preparedItemsPage = new PreparedItemsPage(persistentPage);
    vendorItemPage = new VendorItemPage(persistentPage);
    placeOrderPage = new PlaceOrderPage(persistentPage);
    inboundOrderPage = new InboundOrderPage(persistentPage);
  });

  test.afterAll(async () => {
    logResults();
  });

  // ==========================================
  // Stage 1: Set Up Commissary Vendor
  // ==========================================

  test('Set Sysco as commissary vendor for Wasabi Tysons', async () => {
    await vendorPage.navigateViaLeftNav();
    await vendorPage.selectVendorByName('Sysco');
    await vendorPage.clickEditVendor();
    await vendorPage.checkCommissaryVendor();
    await vendorPage.selectCommissaryRestaurant('Wasabi Tysons');
    await vendorPage.clickSave();
    results['Set Sysco As Commissary Vendor'] = 'passed';
  });

  // ==========================================
  // Stage 2: Create Commissary Recipe
  // ==========================================

  test('Create commissary recipe via Prepared Items', async () => {
    await preparedItemsPage.navigateToPreparedItems();
    await preparedItemsPage.openAddPreparedItemForm();
    await preparedItemsPage.fillPreparedItemDetails(
      testNames.commissaryRecipe, 'Cold Prepped', '1', 'count'
    );
    await preparedItemsPage.checkCommissaryRecipe();
    await preparedItemsPage.fillOrderGuidePackaging('1 count', '1', 'count', 'Yes');
    await preparedItemsPage.addIngredient('Tea Bags - Iced', '1', 'count');
    await preparedItemsPage.clickSave();
    await preparedItemsPage.verifyRedirectedToPreparedItemsList();
    results['Create Commissary Recipe'] = 'passed';
  });

  // ==========================================
  // Stage 3: Verify Commissary Vendor Item Created
  // ==========================================

  test('Verify vendor item is created for commissary recipe', async () => {
    await vendorItemPage.verifyVendorItemCreated(testNames.commissaryRecipe);
    results['Verify Commissary Vendor Item Created'] = 'passed';
  });

  // ==========================================
  // Stage 4: Switch Tenant to Natick
  // ==========================================

  test('Switch tenant from Tysons to Natick', async () => {
    await vendorPage.navigateTo(vendorPage.baseUrl);
    await vendorPage.switchTenant('Wasabi Natick');
    results['Switch Tenant To Natick'] = 'passed';
  });

  // ==========================================
  // Stage 5: Edit Vendor Item Order Guide
  // ==========================================

  test('Set vendor item order guide to Yes in Natick', async () => {
    await vendorItemPage.navigateViaLeftNav();
    await vendorItemPage.searchVendorItem(testNames.commissaryRecipe);
    await vendorItemPage.clickVendorItemSearchResult(testNames.commissaryRecipe);
    await vendorItemPage.clickEditVendorItem();
    await vendorItemPage.setOrderGuide('Yes');
    await vendorItemPage.scrollToBottomAndSave();
    results['Set Vendor Item Order Guide To Yes'] = 'passed';
  });

  // ==========================================
  // Stage 6: Place Order With Commissary Item
  // ==========================================

  test('Place new order with commissary recipe item', async () => {
    await placeOrderPage.navigateToPlaceNewOrder();
    await placeOrderPage.selectVendor('Sysco');
    await placeOrderPage.setItemQuantity(testNames.commissaryRecipe, '5');
    await placeOrderPage.clickSend();
    results['Place Order With Commissary Item'] = 'passed';
  });

  // ==========================================
  // Stage 7: Switch Tenant Back to Tysons
  // ==========================================

  test('Switch tenant from Natick back to Tysons', async () => {
    await vendorPage.navigateTo(vendorPage.baseUrl);
    await vendorPage.switchTenant('Wasabi Tysons');
    results['Switch Tenant Back To Tysons'] = 'passed';
  });

  // ==========================================
  // Stage 8: Ship Inbound Order
  // ==========================================

  test('Ship inbound order from Wasabi Natick', async () => {
    await inboundOrderPage.navigateToInboundOrders();
    await inboundOrderPage.selectFirstInboundOrder();
    await inboundOrderPage.clickShipOrder();
    results['Ship Inbound Order From Natick'] = 'passed';
  });
});
