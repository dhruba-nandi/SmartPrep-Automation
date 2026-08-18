import { Page, Locator, expect } from '@playwright/test';
import { BasePage, TIMEOUT } from '../../BasePage';

export class ProductPage extends BasePage {
  private readonly productsNavLink: Locator;
  private readonly viewAllProductsLink: Locator;
  readonly heading: Locator;
  private readonly addProductButton: Locator;
  private readonly productNameInput: Locator;
  private readonly categoryInput: Locator;
  private readonly reportUnitSelect: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productsNavLink = page.getByText('Products', { exact: true }).first();
    this.viewAllProductsLink = page.getByRole('button', { name: /view all products/i }).first();
    this.heading = page.getByRole('heading', { name: /products/i });
    this.addProductButton = page.getByRole('link', { name: /add product/i });
    this.productNameInput = page.locator('.ui-select-match input, .ui-select-search').first();
    this.categoryInput = page.locator('input.MuiAutocomplete-input[placeholder="Select a category"]');
    this.reportUnitSelect = page.locator('select[name="reportUnit"][ng-model="product.reportByUnit.unit"]');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async navigateToProducts() {
    await this.navigateTo(this.url('products'), TIMEOUT.long);
    await this.waitForPageLoad();
  }

  async navigateViaLeftNav() {
    await this.navigateTo(this.baseUrl, TIMEOUT.long);
    await this.productsNavLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.productsNavLink.click();
    await this.viewAllProductsLink.waitFor({ state: 'visible', timeout: TIMEOUT.long });
    await this.viewAllProductsLink.click();
    await this.waitForPageLoad();
  }

  async verifyProductsPageLoaded() {
    await expect(this.page).toHaveURL(/product/, { timeout: TIMEOUT.long });
    const searchInput = this.page.locator('input.MuiOutlinedInput-input.MuiInputBase-input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.clear();
    await this.page.waitForTimeout(1000);
  }

  async clickAddProduct() {
    await this.addProductButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.addProductButton.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT.long });
    const selectToggle = this.page.getByRole('form').getByLabel('Select a product activate');
    await selectToggle.waitFor({ state: 'visible', timeout: TIMEOUT.long });
  }

  async enterProductName(name: string) {
    const selectToggle = this.page.getByRole('form').getByLabel('Select a product activate');
    await selectToggle.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await selectToggle.click();

    const searchInput = this.page.locator('input.ui-select-search').first();
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(name);
    await this.page.waitForTimeout(1000);

    const option = this.page.locator('.ui-select-choices-row').filter({ hasText: name }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async selectCategory(category: string) {
    await this.categoryInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.categoryInput.click();
    await this.categoryInput.fill(category);
    await this.page.waitForTimeout(500);

    const option = this.page.getByRole('option', { name: new RegExp(category, 'i') }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  async selectUnit(unit: string) {
    await this.reportUnitSelect.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.reportUnitSelect.selectOption({ label: unit });
    await this.page.waitForTimeout(500);
  }

  async clickSave() {
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUT.long });
  }

  async verifyProductCreated(name: string) {
    await this.navigateViaLeftNav();
    await this.verifyProductsPageLoaded();

    const allStoresTab = this.page.getByRole('button', { name: 'All stores' });
    await allStoresTab.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await allStoresTab.click();
    await this.page.waitForTimeout(1000);

    await this.searchProduct(name);

    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await expect(row).toBeVisible();
  }

  async searchProduct(name: string) {
    const searchInput = this.page.locator('input.MuiOutlinedInput-input.MuiInputBase-input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await searchInput.fill(name);
    await this.page.waitForTimeout(2000);
  }

  async openProductByName(name: string) {
    const row = this.page.getByRole('row').filter({ hasText: name }).first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await row.click();
    await this.waitForPageLoad();
  }

  async clickEditProduct() {
    const editButton = this.page.getByRole('button', { name: /edit product/i })
      .or(this.page.getByRole('link', { name: /edit product/i }));
    await editButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editButton.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT.long });
    await this.page.waitForTimeout(2000);
  }

  async scrollToBottomAndSave() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    await this.saveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);

    // Handle "Affected Recipes" modal if it appears
    const affectedRecipesModal = this.page.locator('.modal-dialog').filter({ hasText: /affected recipes/i });
    try {
      await affectedRecipesModal.waitFor({ state: 'visible', timeout: TIMEOUT.short });
      const modalSaveButton = affectedRecipesModal.locator('button[type="submit"]');
      await modalSaveButton.waitFor({ state: 'visible', timeout: TIMEOUT.short });
      await modalSaveButton.click();
      await this.page.waitForTimeout(1000);
    } catch {
      // No Affected Recipes modal
    }
    await this.waitForPageLoad();
  }

  async setProductPrice(price: string) {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    const priceInput = this.page.locator('input[name="reportPrice"][ng-model="displayReportUnitPrice"]:not([ng-disabled])');
    await priceInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await priceInput.clear();
    await priceInput.fill(price);
    await priceInput.blur();
    await this.page.waitForTimeout(500);
  }

  async editUsedProductPrice(price: string) {
    const editUnitAndNameButton = this.page.getByRole('button', { name: /edit unit and name/i });
    await editUnitAndNameButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editUnitAndNameButton.click();

    const modal = this.page.locator('.modal-dialog.modal-md').filter({ hasText: /how do you want to see this product on reports/i });
    await modal.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const priceInput = modal.locator('input[name="reportPrice"][ng-model="newProductUnit.price"]');
    await priceInput.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await priceInput.clear();
    await priceInput.fill(price);
    await this.page.waitForTimeout(500);

    const modalSaveButton = modal.locator('button[type="submit"]');
    await modalSaveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await modalSaveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async editUsedProductUnit(unit: string) {
    const editUnitAndNameButton = this.page.getByRole('button', { name: /edit unit and name/i });
    await editUnitAndNameButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await editUnitAndNameButton.click();

    const modal = this.page.locator('.modal-dialog.modal-md').filter({ hasText: /how do you want to see this product on reports/i });
    await modal.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    const unitSelect = modal.locator('select[name="reportUnit"]');
    await unitSelect.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await unitSelect.selectOption({ label: unit });
    await this.page.waitForTimeout(500);

    const modalSaveButton = modal.locator('button[type="submit"]');
    await modalSaveButton.waitFor({ state: 'visible', timeout: TIMEOUT.default });
    await modalSaveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyDefaultUomConversion(
    conversionAmount: string,
    fromUnit: string,
    toAmount: string,
    toUnit: string,
    expectedCost: string
  ) {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);

    // Find the conversion row that contains the expected cost text
    const conversionRow = this.page.locator('tr').filter({ hasText: expectedCost }).first();
    await conversionRow.waitFor({ state: 'visible', timeout: TIMEOUT.default });

    // Verify conversion amount (e.g., 7.9)
    const fromInput = conversionRow.locator('input[name="convertFromQuantityDisplay"]');
    await expect(fromInput).toHaveValue(conversionAmount);

    // Verify "from" unit selected option (e.g., Ounces)
    const fromSelect = conversionRow.locator('select[name="unit"]');
    const selectedFromText = await fromSelect.locator('option:checked').textContent();
    expect(selectedFromText?.trim()).toBe(fromUnit);

    // Verify "to" amount (e.g., 1)
    const toInput = conversionRow.locator('input[name="convertToQuantityDisplay"]');
    await expect(toInput).toHaveValue(toAmount);

    // Verify "to" unit selected option (e.g., Cups)
    const toSelect = conversionRow.locator('select[name="convertToUnit"]');
    const selectedToText = await toSelect.locator('option:checked').textContent();
    expect(selectedToText?.trim()).toBe(toUnit);

    // Verify cost text
    await expect(conversionRow).toContainText(expectedCost);
  }

  async addProduct(name: string, category: string, unit: string) {
    await this.clickAddProduct();
    await this.enterProductName(name);
    await this.selectCategory(category);
    await this.selectUnit(unit);
    await this.clickSave();
  }
}
