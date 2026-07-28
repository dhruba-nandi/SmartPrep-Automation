# MarginEdge Playwright Test Suite

End-to-end test automation framework for the [MarginEdge](https://me-63384.dev.marginedge.com) restaurant management application, built with Playwright and TypeScript.

## Project Structure

```
playWrightProject/
├── config/
│   ├── config.ts                        # Config loader (supports TEST_ENV override)
│   └── dev.json                         # Environment config (URLs, credentials, timeouts)
├── fixtures/
│   ├── basePersistentContext.ts          # Custom fixture with persistent browser context
│   ├── testData.ts                      # Dynamic test data (run ID-based naming)
│   └── files/
│       ├── testing_image.png            # Sample image for upload tests
│       └── recipeMethod/               # Recipe method step images
│           ├── method1.jpg – method5.jpg # Supported image attachments
│           └── unsupported.avif         # Unsupported format for modal test
├── pages/                               # Page Object Model classes
│   ├── BasePage.ts                      # Base class (navigation, waits, tenant switching)
│   ├── LogInOutPage.ts                  # Login/logout
│   ├── developer/
│   │   └── AppConfigPage.ts             # Developer app configuration
│   ├── inventory&CountSheet/
│   │   ├── CountSheet.ts               # Count sheet management
│   │   └── Inventory.ts                # Inventory counts & closing
│   ├── product/
│   │   └── ProductPage.ts              # Product creation, editing, unit & price changes
│   ├── recipe/
│   │   ├── MenuItemsPage.ts            # Menu items, recipes, ingredients, cost alerts, method steps
│   │   └── RecipeSetupPage.ts          # Recipe type management
│   ├── reconciliation/
│   │   └── OrderPage.ts                # Invoice upload & reconciliation
│   ├── restaurantUnit/
│   │   └── RestaurantUnitPage.ts       # Tenant/restaurant unit management
│   ├── users/
│   │   ├── SettingsPage.ts             # User settings & preferences
│   │   └── UserPage.ts                 # User setup & office assignment
│   └── vendorItem/
│       └── VendorItemPage.ts           # Vendor items & packaging options
├── tests/
│   └── recipes/
│       ├── recipeRegressionTest.spec.ts    # Recipe methods, duplicates, cross-tenant
│       ├── recipePlateCost.spec.ts         # Plate cost calculations & cost alerts
│       ├── recipePriceChange.spec.ts       # Invoice pricing, UoM conversions
│       └── recipeActiveDeactive.spec.ts    # Inventory lifecycle, recipe deactivation
├── reporters/
│   └── jira-reporter.ts                # Custom Jira integration reporter
├── test_scripts/                       # Test script documentation (manual test steps)
│   └── recipe/
├── COMMANDS.md                         # Quick-reference run commands
├── global-setup.ts                     # Global test initialization (login, run ID)
└── playwright.config.ts                # Playwright configuration
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests with Playwright UI mode
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run individual recipe suites
npm run test:recipe1          # Recipe Regression Test
npm run test:recipe2          # Recipe Price Change
npm run test:recipe3          # Recipe Active Deactive
npm run test:plateCost        # Recipe Plate Cost

# Run all recipe suites sequentially
npx playwright test tests/recipes/recipeRegressionTest.spec.ts tests/recipes/recipePriceChange.spec.ts tests/recipes/recipeActiveDeactive.spec.ts tests/recipes/recipePlateCost.spec.ts --workers=1 --timeout 600000

# Target a different environment
TEST_ENV=master npx playwright test tests/recipes/recipeRegressionTest.spec.ts --workers=1 --timeout 600000

# Open the HTML test report
npm run test:report
```

See `COMMANDS.md` for the full list of run commands, environment targeting, and Jira reporting options.

## Test Coverage

| Suite | Test File | Stages | Description |
|-------|-----------|--------|-------------|
| Recipe Regression | `recipes/recipeRegressionTest.spec.ts` | 5 | Recipe creation with method steps & attachments, duplicate recipes, cross-tenant verification |
| Recipe Plate Cost | `recipes/recipePlateCost.spec.ts` | 10 | Plate cost calculations, price update propagation, sub-recipe cost verification, developer app config, accountant alert preferences, cost alert creation, editing & verification |
| Recipe Price Change | `recipes/recipePriceChange.spec.ts` | 10 | Invoice processing price updates, UoM product unit conversions (kg/lb), recipe ingredient unit editing with price recalculation, cross-tenant verification |
| Recipe Active Deactive | `recipes/recipeActiveDeactive.spec.ts` | 7 | Inventory lifecycle (create, close, reopen, delete), recipe deactivation protection across same-tenant, same-company, and cross-company boundaries |

## Architecture

- **Page Object Model (POM):** All page classes extend `BasePage`, encapsulating locators and interaction methods.
- **Persistent Browser Context:** Tests reuse a single browser session via `basePersistentContext` fixture to maintain authentication state.
- **Serial Execution:** Test suites run in serial mode (`test.describe.configure({ mode: 'serial' })`) since workflows are multi-step and order-dependent.
- **Dynamic Test Data:** Entity names include a `TEST_RUN_ID` timestamp for test isolation across parallel runs.
- **Results Tracking:** Custom `createResultsTracker()` utility reports pass/fail status per stage in `afterAll` hooks.
- **Jira Integration:** Custom `jira-reporter.ts` posts test results and failure details to Jira tickets when configured via environment variables.
- **Cross-Tenant Testing:** Tests verify data consistency across tenants (Wasabi Tysons, Wasabi Natick) and across company boundaries.

## Configuration

Environment settings are stored in `config/dev.json`:

- **baseUrl** — Target application URL (overridable via `TEST_ENV` env var)
- **routes** — Application route mappings (orders, inventory, menu items, etc.)
- **credentials** — Login credentials
- **timeouts** — Short (5s), default (15s), long (30s), extended (60s), global (300s)
- **browser** — Chrome launch arguments and user data directory

## Jira Reporting

Add these environment variables to post results to a Jira ticket:

```bash
JIRA_TICKET=ME-1234 \
JIRA_BASE_URL=https://marginedge.atlassian.net \
JIRA_EMAIL=user@co.com \
JIRA_API_TOKEN=xxx \
npx playwright test tests/recipes/recipePlateCost.spec.ts --headed --project=chromium
```

## Tech Stack

- **[Playwright](https://playwright.dev/)** v1.60 — Browser automation and test runner
- **TypeScript** — Type-safe test authoring
- **HTML Reporter** — Built-in test report generation
- **Jira Reporter** — Custom reporter for CI/CD integration
