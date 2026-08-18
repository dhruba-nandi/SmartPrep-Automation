import { Page, Locator, expect } from '@playwright/test';
import { BasePage, config, TIMEOUT } from '../../BasePage';

export class OrderPage extends BasePage {
  private readonly addInvoiceDropdown: Locator;
  private readonly uploadInvoiceOption: Locator;
  private readonly uploadStatusModalClose: Locator;
  private readonly endPreprocessingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addInvoiceDropdown = page.locator('button, [role="button"]').filter({ hasText: /add invoice/i }).first();
    this.uploadInvoiceOption = page.getByRole('menuitem', { name: /upload invoice/i })
      .or(page.locator('li, [role="option"]').filter({ hasText: /upload invoice/i })).first();
    this.uploadStatusModalClose = page.getByRole('dialog', { name: /upload status/i }).getByRole('button', { name: /close|done|ok/i })
      .or(page.locator('.modal, [class*="modal"]').filter({ hasText: /upload status/i }).getByRole('button', { name: /close|done|ok/i }));
    this.endPreprocessingButton = page.getByRole('button', { name: /end preprocessing/i });
  }

  private async clickConfirmOrOk() {
    const confirmButton = this.page.getByRole('button', { name: /^ok$|^confirm$|^yes$/i });
    if (await this.isVisible(confirmButton)) {
      await confirmButton.click();
    } else {
      await this.page.keyboard.press('Enter');
    }
    await this.waitForPageLoad();
  }

  private async clickSaveOrSaveAndComplete() {
    const saveButton = this.page.getByRole('button', { name: /save and complete/i })
      .or(this.page.getByRole('button', { name: 'Save' }));
    await saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveButton.click();
    await this.waitForPageLoad();
  }

  async navigateToOrdersList() {
    await this.page.goto(this.url('orders'), { waitUntil: 'load', timeout: TIMEOUT.extended });
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended }).catch(() => {});
    await this.page.waitForTimeout(3000);

    // If redirected to login, wait and retry
    if (this.page.url().includes('/login') || this.page.url().includes('/auth')) {
      await this.page.waitForTimeout(5000);
      await this.page.goto(this.url('orders'), { waitUntil: 'load', timeout: TIMEOUT.extended });
      await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended }).catch(() => {});
      await this.page.waitForTimeout(3000);
    }
  }

  async uploadInvoiceImage() {
    await this.addInvoiceDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.addInvoiceDropdown.click();
    await this.page.waitForTimeout(1000);

    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.uploadInvoiceOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.uploadInvoiceOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(config.testData.invoiceImagePath);
    await this.page.waitForTimeout(2000);
  }

  async dismissUploadStatusModal() {
    await this.uploadStatusModalClose.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.uploadStatusModalClose.click();
    await this.waitForPageLoad();
  }

  async endPreprocessing() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(2000);
    await this.endPreprocessingButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.endPreprocessingButton.click();
    await this.page.waitForTimeout(2000);
    await this.clickConfirmOrOk();
  }

  async findAndOpenInitialReviewOrder(): Promise<string> {
    await this.page.waitForTimeout(1000);
    const currentPageIsInitialReview = await this.isVisible(
      this.page.getByText(/the initial review for this order is complete/i)
    );
    if (currentPageIsInitialReview) {
      return this.page.url();
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await this.page.goto(this.url('orders'));
      await this.waitForPageLoad();
      await this.page.waitForTimeout(3000);

      const rows = this.page.getByRole('row').filter({ hasText: /in processing/i });
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await rows.nth(i).click();
        await this.waitForPageLoad();
        await this.page.waitForTimeout(1000);

        const isInitialReview = await this.isVisible(
          this.page.getByText(/the initial review for this order is complete/i)
        );
        if (isInitialReview) {
          return this.page.url();
        }

        await this.page.goto(this.url('orders'));
        await this.waitForPageLoad();
        await this.page.waitForTimeout(1000);
      }

      if (attempt < maxRetries - 1) {
        await this.page.waitForTimeout(5000);
      }
    }

    throw new Error('Could not find an order in Initial Review state');
  }

  async clearSearchInput() {
    const searchInput = this.page.locator('input.MuiOutlinedInput-input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.clear();
    await this.page.waitForTimeout(1000);
  }

  async openFirstInProcessingOrder() {
    const row = this.page.getByRole('row').filter({ hasText: /in processing/i }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await row.click();
    await this.waitForPageLoad();
  }

  async verifyInvoiceStatusInProcessing() {
    const statusCell = this.page.getByRole('cell', { name: /in processing/i }).first();
    await expect(statusCell).toBeVisible({ timeout: TIMEOUT.default });
  }

  async selectVendor(vendorName: string) {
    const vendorDropdown = this.page.getByLabel('Select a vendor activate');
    await vendorDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await vendorDropdown.click();
    await this.page.waitForTimeout(500);

    await this.page.keyboard.type(vendorName);
    await this.page.waitForTimeout(1000);

    const option = this.page.locator('.ui-select-choices-row').filter({ hasText: vendorName }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async generateAndFillInvoiceNumber(): Promise<string> {
    const invoiceNumber = Math.floor(Math.random() * 900000 + 100000).toString();
    const invoiceField = this.page.locator('form').getByRole('textbox').nth(2);
    await invoiceField.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await invoiceField.fill(invoiceNumber);
    return invoiceNumber;
  }

  async fillInvoiceDateWithToday() {
    const invoiceDateField = this.page.locator('form').getByRole('textbox').nth(4);
    await invoiceDateField.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await invoiceDateField.click();
    await this.page.waitForTimeout(1000);

    const todayButton = this.page.getByRole('button', { name: /today/i })
      .or(this.page.locator('[class*="today"]').first());
    if (await this.isVisible(todayButton)) {
      await todayButton.click();
    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await invoiceDateField.fill(dateStr);
      await this.page.keyboard.press('Tab');
    }
    await this.page.waitForTimeout(500);
  }

  async dismissRemittanceAddressIfPresent() {
    const remittanceSection = this.page.getByText(/vendor remittance address/i).first();
    if (await this.isVisible(remittanceSection)) {
      await this.page.getByText('No address is provided on the invoice.', { exact: true }).click();
      await this.page.waitForTimeout(500);
      await this.page.getByText('No Phone number is provided on the invoice.', { exact: true }).click();
      await this.page.waitForTimeout(500);
    }
  }

  async fillVerifiedTotal(amount: string) {
    const totalInput = this.page.getByRole('spinbutton');
    await totalInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await totalInput.fill(amount);
  }

  async searchLineItem(searchText: string) {
    const searchInput = this.page.locator('input[ng-model="filterValue"][placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(2000);
  }

  async clickEnvelopeIcon() {
    const envelopeButton = this.page.locator('span.glyphicon-envelope[title*="imported from email"]');
    await envelopeButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await envelopeButton.click();
    await this.page.waitForTimeout(1000);
  }

  async fixImportedLineItemRatio(ratioValue: string) {
    const ratioInput = this.page.locator('input[ng-model="vpu.ratioDisplay"][ng-change="ratioChange(vpu)"]');
    await ratioInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await ratioInput.clear();
    await ratioInput.fill(ratioValue);
    await this.page.waitForTimeout(500);

    const saveButton = this.page.locator('button[ng-click="saveImportedReconcileLineItem()"]');
    if (await this.isVisible(saveButton)) {
      await saveButton.click();
    } else {
      const fallbackSave = this.page.locator('.modal.in button').filter({ hasText: /save/i });
      await fallbackSave.click();
    }
    await this.page.waitForTimeout(1000);
  }

  async scrollToHandwritingSection() {
    const handwritingSection = this.page.getByText(/handwriting and other adjustments/i).first();
    await handwritingSection.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await handwritingSection.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
  }

  async setHandwritingToNo() {
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.default }).catch(() => {});
    await this.page.waitForTimeout(2000);
    const handwritingSelect = this.page.locator('select[name="handwrittenMarkup"]').first();
    await handwritingSelect.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await handwritingSelect.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    // Set value via DOM and dispatch change event for AngularJS binding
    await this.page.evaluate(() => {
      const selects = document.querySelectorAll('select[name="handwrittenMarkup"]');
      const select = Array.from(selects).find(el => !el.closest('#ediConfirmHandwritingModal')) as HTMLSelectElement;
      select.value = 'boolean:false';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await this.page.waitForTimeout(1000);
  }

  async markInitialReviewComplete() {
    const reviewComplete = this.page.getByText(/the initial review for this order is complete/i);
    await reviewComplete.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await reviewComplete.click();
  }

  async saveAndCompleteInitialReview() {
    await this.clickSaveOrSaveAndComplete();
    await this.page.waitForTimeout(2000);

    // Handle confirmation/verified modal if it appears (similar to reconciliation/final review)
    const verifyButton = this.page.getByRole('button', { name: /verified/i }).first();
    if (await this.isVisible(verifyButton)) {
      await verifyButton.click();
      await this.page.waitForTimeout(2000);
    }

    // Handle any OK/Confirm dialog that might appear
    const okButton = this.page.getByRole('button', { name: /^ok$|^confirm$|^yes$/i });
    if (await this.isVisible(okButton)) {
      await okButton.click();
      await this.page.waitForTimeout(1000);
    }
    await this.waitForPageLoad();
  }

  async searchAndOpenOrder(invoiceNumber: string) {
    // Retry loop to handle page instability after login/tenant switch
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const searchInput = this.page.locator('input.MuiOutlinedInput-input[placeholder="Search"]');
        await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.long });
        await searchInput.fill(invoiceNumber);
        await this.page.waitForTimeout(3000);

        const orderRow = this.page.getByRole('row').filter({ hasText: invoiceNumber }).first();
        await orderRow.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
        await orderRow.click();
        await this.waitForPageLoad();
        await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended }).catch(() => {});
        await this.page.waitForTimeout(3000);
        return;
      } catch (error) {
        if (attempt < 2) {
          console.log(`searchAndOpenOrder attempt ${attempt + 1} failed, retrying...`);
          await this.navigateToOrdersList();
        } else {
          throw error;
        }
      }
    }
  }

  async waitForLockAndProcessInvoice() {
    await this.page.waitForTimeout(2000);

    const lockWarning = this.page.getByText(/this invoice is currently locked for automation processes/i);
    const isLocked = await this.isVisible(lockWarning);

    if (isLocked) {
      console.log('Order is locked — unlocking via Process Invoice...');
      const processInvoiceButton = this.page.getByRole('button', { name: /process invoice/i });
      await processInvoiceButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
      await processInvoiceButton.click();
      await this.page.waitForTimeout(2000);

      await this.clickConfirmOrOk();

      // Wait for any loading spinner to disappear
      const spinner = this.page.locator('.spinner, .loading, .loader, [class*="spinner"], [class*="loading"], [class*="loader"], .overlay, [class*="overlay"]').first();
      await spinner.waitFor({ state: 'hidden', timeout: TIMEOUT.extended }).catch(() => {});
    } else {
      console.log('Order is not locked — skipping unlock step.');
    }

    const heading = this.page.getByRole('heading', { name: /reconcile order/i });
    await expect(heading).toBeVisible({ timeout: TIMEOUT.extended });

    // Wait for the page and form to be fully ready
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended });
    await this.waitForPageLoad();

    // Wait for the vendor dropdown to be visible and interactable
    const vendorDropdown = this.page.getByLabel('Select a vendor activate');
    await vendorDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await this.page.waitForTimeout(2000);
  }

  async fillExistingInvoiceNumber(invoiceNumber: string) {
    const invoiceField = this.page.locator('form').getByRole('textbox').nth(2);
    await invoiceField.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await invoiceField.fill(invoiceNumber);
  }

  async addExistingVendorLineItem(itemName?: string) {
    await this.openAddLineItemModal();
    const modal = this.page.locator('#newReconcileLineItemModal');
    await this.ensureExistingVendorItemSelected(modal);
    await this.searchAndSelectItem(modal, itemName ?? config.testData.searchItemName);
    await this.fillLineQuantityAndPrice(modal, '1', '80');
    await this.confirmAndSelectPackaging(modal);
    await this.saveAndCloseLineItemModal(modal);
    await this.waitForPageLoad();
  }

  async addNewVendorItem(itemName: string, packaging: string, quantity: string, unit: string, price: string) {
    await this.openAddLineItemModal();
    const modal = this.page.locator('#newReconcileLineItemModal');

    // Select "New Vendor Item" radio button
    const newVendorItemRadio = modal.locator('ins.iCheck-helper').nth(1);
    await newVendorItemRadio.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await newVendorItemRadio.click();
    await this.page.waitForTimeout(500);

    // Clear item code field
    const itemCodeInput = modal.locator('input#provisionalProductCode');
    await itemCodeInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await itemCodeInput.clear();
    await this.page.waitForTimeout(300);

    // Enter vendor item name
    const nameInput = modal.locator('input[tabindex="15"][ng-model="newReconcileLineItem.vendorProduct.name"]');
    await nameInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await nameInput.click();
    await this.page.waitForTimeout(300);
    await nameInput.fill(itemName);
    await this.page.waitForTimeout(500);

    // Fill packaging details
    await this.fillModalPackagingDetails(modal, packaging, quantity, unit, price);

    // Save new vendor item
    const saveButton = modal.locator('button[tabindex="24"][ng-click="addNewItem($event)"]');
    await saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveButton.click();
    await this.page.waitForTimeout(2000);
    await this.waitForPageLoad();
  }

  private async fillModalPackagingDetails(modal: Locator, packaging: string, quantity: string, unit: string, price: string) {
    // Packaging (tabindex=18)
    const packagingInput = modal.locator('input[tabindex="18"][ng-model="newReconcileLineItem.unit.packaging"]');
    await packagingInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await packagingInput.fill(packaging);
    await this.page.waitForTimeout(300);

    // Quantity (tabindex=19)
    const quantityInput = modal.locator('input[tabindex="19"][ng-model="newReconcileLineItem.unit.quantity"]');
    await quantityInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await quantityInput.fill(quantity);
    await this.page.waitForTimeout(300);

    // Unit (ui-select dropdown)
    const unitDropdown = modal.getByLabel('Select a unit... activate');
    await unitDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await unitDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.type(unit);
    await this.page.waitForTimeout(1000);
    const unitOption = modal.locator('.ui-select-choices-row').filter({ hasText: unit }).first();
    await unitOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await unitOption.click();
    await this.page.waitForTimeout(300);

    // Price (tabindex=21)
    const priceInput = modal.locator('input[tabindex="21"][ng-model="newReconcileLineItem.unit.price"]');
    await priceInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await priceInput.fill(price);
    await this.page.waitForTimeout(500);
  }

  private async openAddLineItemModal() {
    const addLineItemButton = this.page.getByRole('button', { name: /add line item/i });
    await addLineItemButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await addLineItemButton.click();
    await this.page.waitForTimeout(1000);
  }

  private async ensureExistingVendorItemSelected(modal: Locator) {
    const existingVendorItem = modal.getByRole('radio', { name: /existing vendor item/i })
      .or(modal.getByLabel(/existing vendor item/i));
    const isChecked = await existingVendorItem.isChecked().catch(() => false);
    if (!isChecked) {
      await existingVendorItem.click();
      await this.page.waitForTimeout(500);
    }
  }

  private async searchAndSelectItem(modal: Locator, itemName: string) {
    const itemSearchInput = modal.locator('input[placeholder="Enter at least 2 characters to search for an item code or item name..."]');
    if (!(await this.isVisible(itemSearchInput))) {
      await modal.locator('.ui-select-match').first().click();
      await this.page.waitForTimeout(500);
    }
    await itemSearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await itemSearchInput.fill(itemName);
    await this.page.waitForTimeout(2000);

    const itemOption = modal.getByRole('option', { name: new RegExp(itemName, 'i') })
      .or(modal.locator('li, [role="option"]').filter({ hasText: new RegExp(itemName, 'i') })).first();
    await itemOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await itemOption.click();
    await this.page.waitForTimeout(2000);
  }

  private async fillLineQuantityAndPrice(modal: Locator, quantity: string, price: string) {
    const quantityInput = modal.getByLabel(/line quantity/i)
      .or(modal.getByLabel(/quantity/i))
      .or(modal.locator('input[ng-model*="quantity"], input[name*="quantity"]'))
      .first();
    await quantityInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await quantityInput.fill(quantity);
    await this.page.waitForTimeout(500);

    const unitPriceInput = modal.locator('input[name="unitPrice"]');
    await unitPriceInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await unitPriceInput.fill(price);
    await this.page.waitForTimeout(500);
  }

  private async confirmAndSelectPackaging(modal: Locator) {
    const okButton = this.page.getByRole('button', { name: /^ok$/i })
      .or(this.page.getByRole('button', { name: /ok/i })).first();
    await okButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await okButton.click();
    await this.page.waitForTimeout(3000);

    if (await this.isVisible(modal)) {
      const threeCasesLabel = modal.locator('label').filter({ hasText: /3\s*cases?/i }).first();
      if (await this.isVisible(threeCasesLabel)) {
        await threeCasesLabel.click();
      } else {
        const oneCaseLabel = modal.locator('label').filter({ hasText: /1\s*cases?/i }).first();
        if (await this.isVisible(oneCaseLabel)) {
          await oneCaseLabel.click();
        } else {
          const firstTableRadio = modal.locator('table input[type="radio"]').first();
          const radioExists = await firstTableRadio.count().then(c => c > 0).catch(() => false);
          if (radioExists) {
            await firstTableRadio.click({ force: true });
          }
        }
      }
      await this.page.waitForTimeout(500);
    }
  }

  private async saveAndCloseLineItemModal(modal: Locator) {
    if (!(await this.isVisible(modal))) return;

    const saveButton = modal.getByRole('button', { name: /save/i }).first();
    await saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveButton.click();
    await this.page.waitForTimeout(2000);

    if (await this.isVisible(modal)) {
      const closeBtn = modal.locator('button.close, [aria-label="Close"], button[data-dismiss="modal"]').first();
      if (await this.isVisible(closeBtn)) {
        await closeBtn.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      await this.page.waitForTimeout(500);
    }
  }

  async markReconciliationComplete() {
    const reconciliationComplete = this.page.getByText(/the reconciliation for this order is complete/i);
    await reconciliationComplete.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await reconciliationComplete.click();
  }

  async saveAndCompleteReconciliation() {
    await this.clickSaveOrSaveAndComplete();
  }

  async clickVerifiedInModal() {
    const verifyButton = this.page.getByRole('button', { name: /verified/i }).first();
    await verifyButton.waitFor({ state: 'visible', timeout: TIMEOUT.extended });
    await verifyButton.click();
    await this.page.waitForTimeout(2000);
    await this.navigateToOrdersList();
  }

  async searchOrderInList(invoiceNumber: string) {
    const searchInput = this.page.locator('input.MuiInputBase-input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(invoiceNumber);
    await this.page.waitForTimeout(1000);
  }

  async verifyOrderStatusInList(invoiceNumber: string) {
    const orderRow = this.page.getByRole('row').filter({ hasText: invoiceNumber }).first();
    await orderRow.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    const statusCell = orderRow.getByRole('cell', { name: /in\s*progress|in\s*processing/i });
    await expect(statusCell).toBeVisible({ timeout: TIMEOUT.long });
  }

  async verifyInvoiceStatusClosed(invoiceNumber: string): Promise<boolean> {
    const orderRow = this.page.getByRole('row').filter({ hasText: invoiceNumber }).first();
    await orderRow.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    const closedCell = orderRow.getByRole('cell', { name: /closed/i });
    return closedCell.isVisible({ timeout: TIMEOUT.default });
  }

  async openOrderFromList(invoiceNumber: string) {
    const orderRow = this.page.getByRole('row').filter({ hasText: invoiceNumber }).first();
    await orderRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await orderRow.click();
    await this.waitForPageLoad();
  }

  async markOrderReviewedByCSLead() {
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    const csLeadText = this.page.getByText(/this order has been reviewed and should be reviewed by a client services lead/i);
    await csLeadText.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    const csLeadCheckbox = csLeadText.locator('..').locator('ins.iCheck-helper');
    await csLeadCheckbox.scrollIntoViewIfNeeded();
    await csLeadCheckbox.click();
    await this.page.waitForTimeout(500);
  }

  async markOrderReviewedForClose() {
    const reviewedCheckbox = this.page.getByText(/this order has been reviewed and should be closed/i);
    await reviewedCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await reviewedCheckbox.scrollIntoViewIfNeeded();
    await reviewedCheckbox.click();
  }

  async saveAndCompleteFinalReview() {
    const saveButton = this.page.getByRole('button', { name: /save/i }).first();
    await saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveButton.click();
    await this.page.waitForTimeout(2000);
  }
}
