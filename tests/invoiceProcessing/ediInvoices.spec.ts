import { test, createResultsTracker } from '../../fixtures/basePersistentContext';
import { LogInOutPage } from '../../pages/LogInOutPage';
import { CentralVendorPage } from '../../pages/invoiceProcessing/vendor/CentralVendorPage';
import { VendorPage } from '../../pages/invoiceProcessing/vendor/VendorPage';
import { config } from '../../pages/BasePage';
import { IntegrationsPage } from '../../pages/invoiceProcessing/integrations/IntegrationsPage';
import { TeamAssignmentsPage } from '../../pages/invoiceProcessing/users/TeamAssignmentsPage';
import { UserPage } from '../../pages/invoiceProcessing/users/UserPage';
import { VendorItemPage } from '../../pages/invoiceProcessing/vendorItem/VendorItemPage';
import { OrderPage } from '../../pages/invoiceProcessing/reconciliation/OrderPage';
import { PriorityReportPage } from '../../pages/invoiceProcessing/reconciliation/PriorityReportPage';
import { NewVendorItemsTaskPage } from '../../pages/invoiceProcessing/reconciliation/NewVendorItemsTaskPage';
import { testNames } from '../../fixtures/testData';
import * as path from 'path';

test.describe.configure({ mode: 'serial' });

test.describe('EDI Invoices', () => {
  let loginPage: LogInOutPage;
  let centralVendorPage: CentralVendorPage;
  let vendorPage: VendorPage;
  let integrationsPage: IntegrationsPage;
  let teamAssignmentsPage: TeamAssignmentsPage;
  let userPage: UserPage;
  let vendorItemPage: VendorItemPage;
  let orderPage: OrderPage;
  let priorityReportPage: PriorityReportPage;
  let newVendorItemsTaskPage: NewVendorItemsTaskPage;

  const { results, logResults } = createResultsTracker('EDI Invoices', [
    'Assign Lead Analyst to The Analyst',
    'Assign Lead Analyst to Second Analyst',
    'Set Office for Analyst 1',
    'Set Office for Analyst 2',
    'Set Office for Analyst 3',
    'Central Vendor EDI Config',
    'Local Vendor EDI Config',
    'Reconciliation',
    'Final Review',
    'Assign New Vendor Item Product',
    'Approve New Vendor Item',
    'Invoice Closed',
  ]);

  test.beforeAll(async ({ persistentPage }) => {
    test.setTimeout(600000);
    loginPage = new LogInOutPage(persistentPage);
    centralVendorPage = new CentralVendorPage(persistentPage);
    vendorPage = new VendorPage(persistentPage);
    integrationsPage = new IntegrationsPage(persistentPage);
    teamAssignmentsPage = new TeamAssignmentsPage(persistentPage);
    userPage = new UserPage(persistentPage);
    vendorItemPage = new VendorItemPage(persistentPage);
    orderPage = new OrderPage(persistentPage);
    priorityReportPage = new PriorityReportPage(persistentPage);
    newVendorItemsTaskPage = new NewVendorItemsTaskPage(persistentPage);
  });

  test.afterAll(async () => {
    logResults();
  });

  // --- Team Assignments ---

  test('Navigate to Team Assignments', async () => {
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

  // --- Central Vendor EDI Config ---

  test('Navigate to Central Vendors', async () => {
    await centralVendorPage.navigateToCentralVendors();
  });

  test('Search and open central vendor JFC', async () => {
    await centralVendorPage.searchCentralVendor('JFC');
    await centralVendorPage.openCentralVendorRow();
  });

  test('Setup EDI vendor format', async () => {
    const hasEdiRow = await centralVendorPage.hasCentralVendorEdiFormatRow('marginedge.com');

    if (!hasEdiRow) {
      await centralVendorPage.addCentralVendorInboundEdiFormat('marginedge.com');
    }

    await centralVendorPage.scrollToBottomAndSaveCentralVendor();
    results['Central Vendor EDI Config'] = 'passed';
  });

  // --- Local Vendor EDI Config ---

  test('Navigate to Vendors', async () => {
    await vendorPage.navigateToVendors();
  });

  test('Search and open vendor JFC', async () => {
    await vendorPage.searchVendor('JFC');
    await vendorPage.clickVendorSearchResult('JFC');
  });

  test('Edit vendor with EDI configuration', async () => {
    await vendorPage.clickEditVendor();
    await vendorPage.enterVendorAccountNumber('99999');
    await vendorPage.selectEdiMode('EDI-first Processing');
    await vendorPage.clickSave();
    results['Local Vendor EDI Config'] = 'passed';
  });

  // --- Re-login as Developer ---

  test('Logout as accountmanager', async () => {
    await loginPage.logout();
  });

  test('Login as developer', async () => {
    await loginPage.login('developer', config.credentials.password);
  });

  // --- Throw Mock Event ---

  test('Navigate to Integrations', async () => {
    await integrationsPage.navigateToIntegrations();
  });

  test('Submit Mock SQS Event', async () => {
    const mockEventPath = path.resolve(__dirname, '../../fixtures/files/mockSqsEvent.json');
    await integrationsPage.selectQueueSuffix('inboundemail-marginedge-com');
    await integrationsPage.fillMockSqsPacket(mockEventPath);
    await integrationsPage.clickSend();
  });

  // --- Re-login as Analyst2 ---

  test('Logout as developer', async () => {
    await loginPage.logout();
  });

  test('Login as analyst2', async () => {
    await loginPage.login('analyst2', config.credentials.password);
  });

  // --- Reconciliation ---

  test('Verify EDI invoice status is In Reconciliation', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.searchOrderInList('IMPORTED2');
    const statusCell = orderPage['page'].getByRole('cell', { name: /in reconciliation/i }).first();
    await statusCell.waitFor({ state: 'visible', timeout: 15000 });
  });

  test('Start reconciliation', async () => {
    await priorityReportPage.navigateToPriorityReport();
    await priorityReportPage.startReconciliation();
  });

  test('Complete reconciliation', async () => {
    await orderPage.waitForPageLoad();
    await orderPage.searchLineItem('Ajino');
    await orderPage.clickEnvelopeIcon();
    await orderPage.fixImportedLineItemRatio('11');
    await orderPage.scrollToHandwritingSection();
    await orderPage.setHandwritingToNo();
    await orderPage.markReconciliationComplete();
    await orderPage.saveAndCompleteReconciliation();
    await orderPage.clickVerifiedInModal();
    results['Reconciliation'] = 'passed';
  });

  // --- Verify Status & Re-login for Next Review ---

  let invoiceStatus: 'final_review' | 'am_review' = 'final_review';

  test('Verify EDI invoice status is in Final Review or AM Review', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.searchOrderInList('IMPORTED2');

    const finalReviewCell = orderPage['page'].getByRole('cell', { name: /final review/i }).first();
    const amReviewCell = orderPage['page'].getByRole('cell', { name: /am review/i }).first();

    try {
      await finalReviewCell.waitFor({ state: 'visible', timeout: 15000 });
      invoiceStatus = 'final_review';
    } catch {
      await amReviewCell.waitFor({ state: 'visible', timeout: 15000 });
      invoiceStatus = 'am_review';
    }
  });

  test('Logout analyst2', async () => {
    await loginPage.logout();
  });

  test('Login for next review', async () => {
    if (invoiceStatus === 'final_review') {
      await loginPage.login('leadanalyst', config.credentials.password);
    } else {
      await loginPage.login('accountmanager', config.credentials.password);
    }
  });

  // --- Final Review (if applicable) ---

  test('Start final review', async () => {
    test.skip(invoiceStatus !== 'final_review', 'Skipping — status is not Final Review');
    await priorityReportPage.navigateToPriorityReport();
    await priorityReportPage.startFinalReview();
  });

  test('Complete final review', async () => {
    test.skip(invoiceStatus !== 'final_review', 'Skipping — status is not Final Review');
    await orderPage.markOrderReviewedByCSLead();
    await orderPage.saveAndCompleteFinalReview();
    await orderPage.clickVerifiedInModal();
    results['Final Review'] = 'passed';
  });

  // --- New Vendor Item Approval (if applicable) ---

  test('Assign product to new vendor item', async () => {
    test.skip(invoiceStatus !== 'am_review', 'Skipping — status is not AM Review');
    await newVendorItemsTaskPage.navigateToNewVendorItems();
    await newVendorItemsTaskPage.selectFirstRow();
    await newVendorItemsTaskPage.clickAssignProduct();
    await newVendorItemsTaskPage.assignNewProduct('Baked Goods', '1', 'Case', '1');
    results['Assign New Vendor Item Product'] = 'passed';
  });

  test('Approve new vendor item', async () => {
    test.skip(invoiceStatus !== 'am_review', 'Skipping — status is not AM Review');
    await newVendorItemsTaskPage.selectFirstRowAndApprove();
    results['Approve New Vendor Item'] = 'passed';
  });

  // --- Invoice Status Verification ---

  test('Verify invoice status is Closed', async () => {
    await orderPage.navigateToOrdersList();
    await orderPage.searchOrderInList('IMPORTED2');
    const isClosed = await orderPage.verifyInvoiceStatusClosed('IMPORTED2');
    if (isClosed) {
      results['Invoice Closed'] = 'passed';
    }
  });
});
