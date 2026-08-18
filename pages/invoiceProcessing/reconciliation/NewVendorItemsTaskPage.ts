import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class NewVendorItemsTaskPage extends BasePage {
  private readonly tenantDropdown: Locator;
  private readonly newVendorItemsOption: Locator;
  private readonly firstRowCheckbox: Locator;
  private readonly assignProductButton: Locator;
  private readonly approveSelectedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.tenantDropdown = page.locator('button#unitMenu_dd');
    this.newVendorItemsOption = page.getByRole('menuitem').filter({ hasText: /new vendor items/i });
    this.firstRowCheckbox = page.locator('.ui-grid-selection-row-header-buttons.clickable').first();
    this.assignProductButton = page.locator('button[ng-click="selectNewAssignProduct()"]');
    this.approveSelectedButton = page.getByRole('button', { name: /approve selected/i });
  }

  async navigateToNewVendorItems() {
    const bellIcon = this.page.locator('[data-testid="NotificationsNoneIcon"]');
    await bellIcon.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await bellIcon.click();
    await this.page.waitForTimeout(1000);

    await this.newVendorItemsOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.newVendorItemsOption.click();
    await this.page.waitForTimeout(1000);
    await this.waitForPageLoad();
    await this.page.waitForTimeout(1000);
    await this.firstRowCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(1000);
  }

  async selectFirstRow() {
    await this.firstRowCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.page.waitForTimeout(1000);
    await this.firstRowCheckbox.click();
    await this.page.waitForTimeout(1000);
  }

  async clickAssignProduct() {
    await this.assignProductButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.page.waitForTimeout(1000);
    await this.assignProductButton.click();
    await this.page.waitForTimeout(1000);
  }

  private async scrollModalToBottom() {
    await this.page.evaluate(() => {
      const modalBody = Array.from(document.querySelectorAll('.modal-body'))
        .find(el => (el as HTMLElement).offsetParent !== null) as HTMLElement;
      if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
    });
  }

  async assignNewProduct(category: string, quantity: string, reportUnit: string, caseQuantity: string) {
    // Step 1: Select "Create new product"
    const createNewProductRadio = this.page.locator('label').filter({ hasText: /create new product/i }).locator('ins.iCheck-helper');
    await createNewProductRadio.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(1000);
    await createNewProductRadio.click();
    await this.page.waitForTimeout(1000);

    // Step 2: Select category — try radio button first, then dropdown search
    const categoryRadio = this.page.locator('span.radio-inline').filter({ hasText: new RegExp(category, 'i') }).locator('ins.iCheck-helper');
    const categoryDropdown = this.page.locator('span[aria-label="Select a category activate"]:visible');
    await categoryDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(1000);

    if (await this.isVisible(categoryRadio)) {
      await categoryRadio.click();
    } else {
      await categoryDropdown.click();
      await this.page.waitForTimeout(1000);
      const categorySearchInput = this.page.locator('.ui-select-search:visible').first();
      await categorySearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
      await categorySearchInput.type(category, { delay: 50 });
      await this.page.waitForTimeout(1000);
      const categoryOption = this.page.locator('.ui-select-choices-row').filter({ hasText: category }).first();
      await categoryOption.waitFor({ state: 'visible', timeout: TIMEOUT.long });
      await categoryOption.click();
    }
    await this.page.waitForTimeout(1000);

    // Step 3: Scroll and enter quantity
    await this.scrollModalToBottom();
    await this.page.waitForTimeout(1000);

    const quantityInput = this.page.locator('input[ng-model="newProduct.reportByUnit.quantity"][ng-change="updateReportByDisplayName()"]:visible');
    await quantityInput.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await quantityInput.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
    await quantityInput.click();
    await quantityInput.clear();
    await quantityInput.fill(quantity);
    await this.page.waitForTimeout(1000);

    // Step 4: Select report unit
    const reportUnitDropdown = this.page.locator('span[aria-label="Select a report unit activate"]:visible');
    await reportUnitDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(1000);
    await reportUnitDropdown.click();
    await this.page.waitForTimeout(1000);
    const reportUnitSearchInput = this.page.locator('.ui-select-search:visible').first();
    await reportUnitSearchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await reportUnitSearchInput.type(reportUnit, { delay: 50 });
    await this.page.waitForTimeout(1000);
    const reportUnitOption = this.page.locator('.ui-select-choices-row').filter({ hasText: reportUnit }).first();
    await reportUnitOption.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await reportUnitOption.click();
    await this.page.waitForTimeout(2000);

    // Step 5: Enter value under "How many Case?"
    // Scroll the Save and Close button into view — this brings the grid into view too
    const saveAndCloseButton = this.page.getByRole('button', { name: /save and close/i });
    await saveAndCloseButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await saveAndCloseButton.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(2000);

    // Find the grid that contains "How many" text in its header (the header is a div, not a button)
    const targetGrid = this.page.locator('.ui-grid').filter({ hasText: /how many/i }).last();
    await targetGrid.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(1000);

    // Target the first data row in the body render container, last cell = "How many" column
    const bodyRow = targetGrid.locator('.ui-grid-render-container-body .ui-grid-canvas .ui-grid-row').first();
    const caseCell = bodyRow.locator('.ui-grid-cell').last();
    await caseCell.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);

    // Double-click the cell to enter edit mode (UI Grid requires dblclick for cell editing)
    await caseCell.dblclick();
    await this.page.waitForTimeout(1000);

    // Fill the input that appeared inside the cell
    const caseInput = caseCell.locator('input');
    if (await caseInput.isVisible().catch(() => false)) {
      await caseInput.fill(caseQuantity);
    } else {
      // Fallback: try single click then look for input anywhere in the grid row
      await caseCell.click();
      await this.page.waitForTimeout(1000);
      const rowInput = bodyRow.locator('input').first();
      await rowInput.waitFor({ state: 'visible', timeout: TIMEOUT.long });
      await rowInput.fill(caseQuantity);
    }
    await this.page.waitForTimeout(1000);

    // Step 6: Click Save and Close
    await saveAndCloseButton.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
    await saveAndCloseButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await saveAndCloseButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForPageLoad();
    await this.page.waitForTimeout(1000);
  }

  async waitForTableRow() {
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.extended }).catch(() => {});
    await this.firstRowCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async selectFirstRowAndApprove() {
    // Step 1: Wait for the table row to be fully visible and interactive
    await this.waitForTableRow();

    // Step 2: Select the first row checkbox
    await this.firstRowCheckbox.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.page.waitForTimeout(1000);
    await this.firstRowCheckbox.click();
    await this.page.waitForTimeout(1000);

    // Step 3: Verify the row is selected before clicking approve
    const selectedRow = this.page.locator('.ui-grid-row.ui-grid-row-selected').first();
    await selectedRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.page.waitForTimeout(1000);

    // Step 4: Click Approve Selected
    await this.approveSelectedButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.page.waitForTimeout(1000);
    await this.approveSelectedButton.click();
    await this.page.waitForTimeout(1000);

    // Step 5: Wait for the "Approved!" modal to appear after the spinner
    const okButton = this.page.locator('button.btn.btn-primary.bootbox-accept');
    await okButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(1000);
    await okButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForPageLoad();
    await this.page.waitForTimeout(1000);
  }

  async clickApproveSelected() {
    await this.approveSelectedButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.page.waitForTimeout(1000);
    await this.approveSelectedButton.click();
    await this.page.waitForTimeout(1000);

    // Wait for the "Approved!" modal to appear after the spinner
    const okButton = this.page.locator('button.btn.btn-primary.bootbox-accept');
    await okButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.page.waitForTimeout(1000);
    await okButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForPageLoad();
    await this.page.waitForTimeout(1000);
  }
}
