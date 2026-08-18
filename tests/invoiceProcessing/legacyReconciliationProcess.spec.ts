import { test, createResultsTracker } from '../../fixtures/basePersistentContext';
import { TeamAssignmentsPage } from '../../pages/invoiceProcessing/users/TeamAssignmentsPage';
import { UserPage } from '../../pages/invoiceProcessing/users/UserPage';
import { ProductPage } from '../../pages/invoiceProcessing/product/ProductPage';
import { VendorItemPage } from '../../pages/invoiceProcessing/vendorItem/VendorItemPage';
import { OrderPage } from '../../pages/invoiceProcessing/reconciliation/OrderPage';
import { LogInOutPage } from '../../pages/LogInOutPage';
import { PriorityReportPage } from '../../pages/invoiceProcessing/reconciliation/PriorityReportPage';
import { NewVendorItemsTaskPage } from '../../pages/invoiceProcessing/reconciliation/NewVendorItemsTaskPage';
import { testNames } from '../../fixtures/testData';
import { config } from '../../pages/BasePage';

test.describe.configure({ mode: 'serial' });

test.describe('Legacy Reconciliation Process', () => {
  let teamAssignmentsPage: TeamAssignmentsPage;
  let userPage: UserPage;
  let productPage: ProductPage;
  let vendorItemPage: VendorItemPage;
  let orderPage: OrderPage;
  let logInOutPage: LogInOutPage;
  let priorityReportPage: PriorityReportPage;
  let newVendorItemsTaskPage: NewVendorItemsTaskPage;
  let invoiceNumber: string;

  const { results, logResults } = createResultsTracker('Legacy Reconciliation Process', [
    'Assign Lead Analyst to The Analyst',
    'Assign Lead Analyst to Second Analyst',
    'Set Office for Analyst 1',
    'Set Office for Analyst 2',
    'Set Office for Lead Analyst',
    'Add Product',
    'Add Vendor Item',
    'File Uploaded',
    'End Preprocessing',
    'Initial Review',
    'Reconciliation',
    'Final Review',
    'Assign New Vendor Item Product',
    'Approve New Vendor Item',
    'Invoice Closed',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    teamAssignmentsPage = new TeamAssignmentsPage(persistentPage);
    userPage = new UserPage(persistentPage);
    productPage = new ProductPage(persistentPage);
    vendorItemPage = new VendorItemPage(persistentPage);
    orderPage = new OrderPage(persistentPage);
    logInOutPage = new LogInOutPage(persistentPage);
    priorityReportPage = new PriorityReportPage(persistentPage);
    newVendorItemsTaskPage = new NewVendorItemsTaskPage(persistentPage);
  });

  test.afterAll(async () => {
    logResults();
  });

  // --- Team Assignments ---

  test('Navigate to Team Assignments', async () => {
    await teamAssignmentsPage.navigateToUsersViaLeftNav();
    await teamAssignmentsPage.switchTenant('Wasabi Tysons');
    await teamAssignmentsPage.navigateToUsersViaLeftNav();
    await teamAssignmentsPage.clickTeamAssignments();
  });

  test('Assign Lead Analyst to The Analyst', async () => {
    await teamAssignmentsPage.searchAnalyst('The Analyst');
    await teamAssignmentsPage.selectLeadAnalystFromDropdown();
    await teamAssignmentsPage.clickSaveChanges();
    results['Assign Lead Analyst to The Analyst'] = 'passed';
  });

  test('Assign Lead Analyst to Second Analyst', async () => {
    await teamAssignmentsPage.clearSearch();
    await teamAssignmentsPage.searchAnalyst('Second Analyst');
    await teamAssignmentsPage.selectLeadAnalystFromDropdown();
    await teamAssignmentsPage.clickSaveChanges();
    results['Assign Lead Analyst to Second Analyst'] = 'passed';
  });

  // --- User Office Setup ---

  test('Set office to Dhaka for first analyst', async () => {
    await userPage.navigateToSetupUsersViaLeftNav();
    await userPage.selectMarginEdgeStaff();
    await userPage.searchUser('the');
    await userPage.openUserRow(1);
    await userPage.selectOffice('Dhaka');
    await userPage.scrollToBottomAndSave();
    results['Set Office for Analyst 1'] = 'passed';
  });

  test('Set office to Dhaka for second analyst', async () => {
    await userPage.selectMarginEdgeStaff();
    await userPage.searchUser('second');
    await userPage.openUserRow(1);
    await userPage.selectOffice('Dhaka');
    await userPage.scrollToBottomAndSave();
    results['Set Office for Analyst 2'] = 'passed';
  });

  test('Set office to Dhaka for lead analyst', async () => {
    await userPage.selectMarginEdgeStaff();
    await userPage.searchUser('lead');
    await userPage.openUserRow(1);
    await userPage.selectOffice('Dhaka');
    await userPage.scrollToBottomAndSave();
    results['Set Office for Lead Analyst'] = 'passed';
  });

  // --- Product & Vendor Item Setup ---

  test('Add new product', async () => {
    await productPage.navigateViaLeftNav();
    await productPage.verifyProductsPageLoaded();
    await productPage.clickAddProduct();
    await productPage.enterProductName(testNames.product);
    await productPage.selectCategory('Cleaning Supplies');
    await productPage.selectUnit('Case');
    await productPage.clickSave();
    await productPage.verifyProductCreated(testNames.product);
    results['Add Product'] = 'passed';
  });

  test('Add new vendor item', async () => {
    await vendorItemPage.navigateViaLeftNav();
    await vendorItemPage.verifyVendorItemsPageLoaded();
    await vendorItemPage.clickAddVendorItem();
    await vendorItemPage.selectVendor('Arrow');
    await vendorItemPage.enterVendorItemName(testNames.vendorItem);
    await vendorItemPage.selectProduct(testNames.product);
    await vendorItemPage.clickAddPackagingOption();
    await vendorItemPage.fillPackagingDetails('1 Case', '1', 'Case', '80');
    await vendorItemPage.clickSave();
    await vendorItemPage.verifyVendorItemCreated(testNames.vendorItem);
    results['Add Vendor Item'] = 'passed';
  });

  // --- Invoice Upload & Preprocessing ---

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

  // --- Initial Review ---

  test('Logout', async () => {
    await logInOutPage.logout();
  });

  test('Login as analyst', async () => {
    await logInOutPage.login('analyst', config.credentials.password);
    await logInOutPage.switchTenant('Wasabi Tysons');
  });

  test('Start initial review', async () => {
    await priorityReportPage.navigateToPriorityReport();
    await priorityReportPage.startInitialReview();
  });

  test('Complete initial review', async () => {
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

  // --- Reconciliation ---

  test('Logout analyst', async () => {
    await logInOutPage.logout();
  });

  test('Login as analyst2', async () => {
    await logInOutPage.login('analyst2', config.credentials.password);
    await logInOutPage.switchTenant('Wasabi Tysons');
  });

  test('Unlock order for reconciliation', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.searchAndOpenOrder(invoiceNumber);
    await orderPage.waitForLockAndProcessInvoice();
  });

  test('Start reconciliation', async () => {
    await priorityReportPage.navigateToPriorityReport();
    await priorityReportPage.startReconciliation();
  });

  test('Complete reconciliation', async () => {
    await orderPage.selectVendor('Arrow');
    await orderPage.fillExistingInvoiceNumber(invoiceNumber);
    await orderPage.fillInvoiceDateWithToday();
    await orderPage.dismissRemittanceAddressIfPresent();
    await orderPage.addExistingVendorLineItem(testNames.vendorItem);
    await orderPage.addNewVendorItem(testNames.newVendorItem, '1 Case', '1', 'Case', '20');
    await orderPage.setHandwritingToNo();
    await orderPage.markReconciliationComplete();
    await orderPage.saveAndCompleteReconciliation();
    await orderPage.clickVerifiedInModal();
    results['Reconciliation'] = 'passed';
  });

  // --- Final Review ---

  test('Logout analyst2', async () => {
    await logInOutPage.logout();
  });

  test('Login as leadanalyst', async () => {
    await logInOutPage.login('leadanalyst', config.credentials.password);
    await logInOutPage.switchTenant('Wasabi Tysons');
  });

  test('Start final review', async () => {
    await priorityReportPage.navigateToPriorityReport();
    await priorityReportPage.startFinalReview();
  });

  test('Complete final review', async () => {
    await orderPage.markOrderReviewedByCSLead();
    await orderPage.saveAndCompleteFinalReview();
    await orderPage.clickVerifiedInModal();
    results['Final Review'] = 'passed';
  });

  // --- New Vendor Item Approval ---

  test('Logout leadanalyst', async () => {
    await logInOutPage.logout();
  });

  test('Login as accountmanager for tasks', async () => {
    await logInOutPage.login('accountmanager', config.credentials.password);
    await logInOutPage.switchTenant('Wasabi Tysons');
  });

  test('Assign product to new vendor item', async () => {
    await newVendorItemsTaskPage.navigateToNewVendorItems();
    await newVendorItemsTaskPage.selectFirstRow();
    await newVendorItemsTaskPage.clickAssignProduct();
    await newVendorItemsTaskPage.assignNewProduct('Baked Goods', '1', 'Case', '1');
    results['Assign New Vendor Item Product'] = 'passed';
  });

  test('Approve new vendor item', async () => {
    await newVendorItemsTaskPage.selectFirstRowAndApprove();
    results['Approve New Vendor Item'] = 'passed';
  });

  // --- Invoice Status Verification ---

  test('Verify invoice status is Closed', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.clearSearchInput();
    await orderPage.searchOrderInList(invoiceNumber);
    const isClosed = await orderPage.verifyInvoiceStatusClosed(invoiceNumber);
    if (isClosed) {
      results['Invoice Closed'] = 'passed';
    }
  });
});
