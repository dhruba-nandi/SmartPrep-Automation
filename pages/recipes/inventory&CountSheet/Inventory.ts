import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class Inventory extends BasePage {
  private readonly myStoreTab: Locator;
  private readonly enterCountDropdown: Locator;
  private readonly inventoryDateInput: Locator;
  private readonly saveButton: Locator;
  private readonly saveExpandButton: Locator;
  private readonly okButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myStoreTab = page.locator('a.nav-link').filter({ hasText: /my store/i });
    this.enterCountDropdown = page.locator('button.btn.btn-primary.dropdown-toggle').filter({ hasText: /enter a count/i });
    this.inventoryDateInput = page.locator('input[name="inventoryDate"]');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.saveExpandButton = page.getByRole('button', { name: 'Expand more options' });
    this.okButton = page.locator('.bootbox-accept');
  }

  async navigateToInventoryCounts() {
    await this.page.goto(this.url('inventory'), { waitUntil: 'domcontentloaded', timeout: TIMEOUT.long });
    await this.page.waitForLoadState('load', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async selectMyStoreTab() {
    await this.myStoreTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.myStoreTab.click();
    await this.page.waitForTimeout(1000);
  }

  async selectCountSheet(name: string) {
    await this.enterCountDropdown.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.enterCountDropdown.click();
    await this.page.waitForTimeout(1000);

    const countSheetOption = this.page.locator('ul.dropdown-menu a.ng-binding')
      .filter({ hasText: new RegExp(name, 'i') }).last();
    await countSheetOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await countSheetOption.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async setInventoryDate() {
    await this.inventoryDateInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.inventoryDateInput.click();
    await this.page.waitForTimeout(500);

    const todayButton = this.page.getByRole('button', { name: /today/i })
      .or(this.page.locator('button.btn-info').filter({ hasText: /today/i }));
    if (await this.isVisible(todayButton)) {
      await todayButton.click();
    } else {
      const today = new Date();
      const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
      await this.inventoryDateInput.fill(dateStr);
      await this.page.keyboard.press('Tab');
    }
    await this.page.waitForTimeout(500);
  }

  async enterCountForRecipe(recipeName: string, count: string) {
    const countInput = this.page.locator(`[data-testid="invCount-${recipeName}"]`);
    await countInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await countInput.scrollIntoViewIfNeeded();
    await countInput.fill(count);
    await this.page.waitForTimeout(500);
  }

  async saveAndCloseInventory() {
    await this.saveExpandButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveExpandButton.click();
    await this.page.waitForTimeout(500);
    const saveAndCloseOption = this.page.getByRole('menuitem', { name: /save and close/i })
      .or(this.page.getByRole('menuitem', { name: /save & close/i }));
    await saveAndCloseOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveAndCloseOption.click();
    await this.waitForPageLoad();
  }

  async saveAndExitInventory() {
    await this.saveExpandButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveExpandButton.click();
    await this.page.waitForTimeout(500);
    const saveAndExitOption = this.page.getByRole('menuitem', { name: /save and exit/i })
      .or(this.page.getByRole('menuitem', { name: /save & exit/i }));
    await saveAndExitOption.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await saveAndExitOption.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async verifyInventoryIsCreated(countSheetName: string) {
    await this.navigateToInventoryCounts();
    await this.selectMyStoreTab();
    await this.page.waitForTimeout(3000);

    const inventoryRow = this.page.getByRole('row').filter({ hasText: new RegExp(countSheetName, 'i') }).first();
    await inventoryRow.waitFor({ state: 'visible', timeout: TIMEOUT.long });

    const statusCell = inventoryRow.getByRole('gridcell', { name: /saved/i });
    await expect(statusCell).toBeVisible({ timeout: TIMEOUT.default });
  }

  async confirmClose() {
    await this.okButton.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.okButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async openClosedInventory(countSheetName: string) {
    const inventoryRow = this.page.getByRole('row').filter({ hasText: new RegExp(countSheetName, 'i') }).first();
    await inventoryRow.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await inventoryRow.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async clickReopen() {
    const reopenButton = this.page.getByRole('button', { name: /reopen/i });
    await reopenButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await reopenButton.click();
    await this.page.waitForTimeout(1000);

    const confirmButton = this.page.getByRole('button', { name: /^ok$|^confirm$|^yes$/i });
    if (await this.isVisible(confirmButton)) {
      await confirmButton.click();
    } else {
      await this.page.keyboard.press('Enter');
    }
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async verifyInventoryReopened(countSheetName: string) {
    await this.navigateToInventoryCounts();
    await this.selectMyStoreTab();
    await this.page.waitForTimeout(3000);

    const inventoryRow = this.page.getByRole('row').filter({ hasText: new RegExp(countSheetName, 'i') }).first();
    await inventoryRow.waitFor({ state: 'visible', timeout: TIMEOUT.long });

    const statusCell = inventoryRow.getByRole('gridcell', { name: /saved/i });
    await expect(statusCell).toBeVisible({ timeout: TIMEOUT.default });
  }

  async openSavedInventory(countSheetName: string) {
    const inventoryRow = this.page.getByRole('row').filter({ hasText: new RegExp(countSheetName, 'i') }).first();
    await inventoryRow.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await inventoryRow.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async clickEdit() {
    const editButton = this.page.getByRole('button', { name: /edit/i });
    await editButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async clickDeleteInventory() {
    const deleteButton = this.page.locator('button.btn.btn-danger.pull-right[ng-click="delete()"]');
    await deleteButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();
    await this.page.waitForTimeout(1000);

    const confirmDeleteButton = this.page.locator('#deleteInventoryConfirmation button[type="submit"].btn-danger');
    await confirmDeleteButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await confirmDeleteButton.click();
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  async verifyInventoryDeleted(countSheetName: string) {
    await this.navigateToInventoryCounts();
    await this.selectMyStoreTab();
    await this.page.waitForTimeout(3000);

    const inventoryRow = this.page.getByRole('row').filter({ hasText: new RegExp(countSheetName, 'i') }).first();
    await expect(inventoryRow).not.toBeVisible({ timeout: TIMEOUT.default });
  }

  async verifyInventoryClosed(countSheetName: string) {
    await this.page.goto(this.url('inventory'), { waitUntil: 'domcontentloaded', timeout: TIMEOUT.long });
    await this.page.waitForLoadState('load', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(3000);

    await this.selectMyStoreTab();
    await this.page.waitForTimeout(3000);

    const bodyText = await this.page.locator('body').innerText();
    expect(bodyText).toContain(countSheetName);
  }
}
