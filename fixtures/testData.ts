import * as fs from 'fs';
import * as path from 'path';

/** Shared test run ID set by global-setup so all test files use the same timestamp. */
function getTestRunId(): string {
  if (process.env.TEST_RUN_ID) return process.env.TEST_RUN_ID;
  const runIdFile = path.join(process.cwd(), '.test-run-id');
  if (fs.existsSync(runIdFile)) return fs.readFileSync(runIdFile, 'utf-8').trim();
  return Date.now().toString();
}

export const TEST_RUN_ID = getTestRunId();

export const testNames = {
  product: `Automated Product ${TEST_RUN_ID}`,
  product2: `Automated Product2 ${TEST_RUN_ID}`,
  vendorItem: `Automated Item ${TEST_RUN_ID}`,
  newVendorItem: `Automated New Item ${TEST_RUN_ID}`,
  recipe: `Automated Recipe ${TEST_RUN_ID}`,
  recipe2: `Automated Recipe2 ${TEST_RUN_ID}`,
  invoicePriceProduct: `InvoicePrice Product ${TEST_RUN_ID}`,
  invoicePriceRecipe: `InvoicePrice Recipe ${TEST_RUN_ID}`,
  s3Product: `S3 Product ${TEST_RUN_ID}`,
  s3Recipe: `S3 Recipe ${TEST_RUN_ID}`,
  countSheet: `Automated Countsheet ${TEST_RUN_ID}`,
  countSheet2: `Automated Countsheet2 ${TEST_RUN_ID}`,
  product3: `Automated Product3 ${TEST_RUN_ID}`,
  recipe3: `Automated Recipe3 ${TEST_RUN_ID}`,
  countSheet3: `Automated Countsheet3 ${TEST_RUN_ID}`,
  tenant: `Automated Tenant ${TEST_RUN_ID}`,
  recipeTypeMenu: `Menu Type ${TEST_RUN_ID}`,
  recipeTypePrepared: `Prepared Type ${TEST_RUN_ID}`,
  recipeTypeBar: `Bar Type ${TEST_RUN_ID}`,
  plateCostProduct1: `PlateCost Product1 ${TEST_RUN_ID}`,
  plateCostProduct2: `PlateCost Product2 ${TEST_RUN_ID}`,
  plateCostRecipe: `PlateCost Recipe ${TEST_RUN_ID}`,
  plateCostRecipeAsIngredient: `PlateCost SubRecipe ${TEST_RUN_ID}`,
  plateCostAlertProduct: `PlateCostAlert Product ${TEST_RUN_ID}`,
  plateCostAlertRecipe: `PlateCostAlert Recipe ${TEST_RUN_ID}`,
  duplicateRecipeProduct: `DupRecipe Product ${TEST_RUN_ID}`,
  duplicateRecipe: `DupRecipe ${TEST_RUN_ID}`,
  uomProduct1: `UoM Product1 ${TEST_RUN_ID}`,
  uomProduct2: `UoM Product2 ${TEST_RUN_ID}`,
  uomProduct3: `UoM Product3 ${TEST_RUN_ID}`,
  uomRecipe: `UoM Recipe ${TEST_RUN_ID}`,
  uomSubRecipe: `UoM SubRecipe ${TEST_RUN_ID}`,
  uomEditProduct1: `UoMEdit Product1 ${TEST_RUN_ID}`,
  uomEditProduct2: `UoMEdit Product2 ${TEST_RUN_ID}`,
  uomEditRecipe: `UoMEdit Recipe ${TEST_RUN_ID}`,
  uomEditSubRecipe: `UoMEdit SubRecipe ${TEST_RUN_ID}`,
  deleteCostAlertRecipe: `DeleteAlert Recipe ${TEST_RUN_ID}`,
  pourCostAlertProduct: `PourCostAlert Product ${TEST_RUN_ID}`,
  pourCostAlertRecipe: `PourCostAlert Recipe ${TEST_RUN_ID}`,
  deletePourCostAlertRecipe: `DeletePourAlert Recipe ${TEST_RUN_ID}`,
  recipeTypeCocktails: `Cocktails ${TEST_RUN_ID}`,
  defaultUomProduct: `DefaultUoM Product ${TEST_RUN_ID}`,
  defaultUomRecipe: `DefaultUoM Recipe ${TEST_RUN_ID}`,
  commissaryRecipe: `Commissary Recipe ${TEST_RUN_ID}`,
  smartPrepCheckList: `SmartPrep Checklist ${TEST_RUN_ID}`,
  smartPrepCheckListEdited: `SmartPrep Checklist ${TEST_RUN_ID} Edited`,
  smartPrepTask1: `SmartPrep Task1 ${TEST_RUN_ID}`,
  smartPrepTask2: `SmartPrep Task2 ${TEST_RUN_ID}`,
  smartPrepAIMatch: `SmartPrep AIMatch ${TEST_RUN_ID}`,
  prepList: `PrepList ${TEST_RUN_ID}`,
  prepItem1: `Prep item1 ${TEST_RUN_ID}`,
  prepItem2: `Prep item2 ${TEST_RUN_ID}`,
  prepListEdited: `PrepList ${TEST_RUN_ID} Edited`,
  prepItem3: `Prep item3 ${TEST_RUN_ID}`,
};
