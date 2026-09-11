# Run Commands

## Individual Test Suites

| Suite | npm script | Playwright command |
|-------|------------|--------------------|
| Recipe Method and Duplication | `npm run test:recipe1` | `npx playwright test tests/recipes/recipeMethodAndDuplication.spec.ts --headed --project=chromium` |
| Recipe Price Change | `npm run test:recipe2` | `npx playwright test tests/recipes/recipePriceChange.spec.ts --headed --project=chromium` |
| Recipe Active Deactive | `npm run test:recipe3` | `npx playwright test tests/recipes/recipeInventory.spec.ts --headed --project=chromium` |
| Recipe Plate Cost | `npm run test:plateCost` | `npx playwright test tests/recipes/recipePlateCost.spec.ts --headed --project=chromium` |
| Recipe Commissary Items | `npm run test:commissary` | `npx playwright test tests/recipes/recipeCommissary.spec.ts --headed --project=chromium` |
| Recipe Smart Prep | `npm run test:smartPrep` | `npx playwright test tests/recipes/CheckList.spec.ts --headed --project=chromium` |
| Recipe Prep List | `npm run test:prepList` | `npx playwright test tests/recipes/PrepList.spec.ts --headed --project=chromium` |

## Run All Recipe Suites Sequentially

```bash
npx playwright test tests/recipes/recipeMethodAndDuplication.spec.ts tests/recipes/recipePriceChange.spec.ts tests/recipes/recipeInventory.spec.ts tests/recipes/recipePlateCost.spec.ts tests/recipes/recipeCommissary.spec.ts tests/recipes/CheckList.spec.ts tests/recipes/PrepList.spec.ts --workers=1 --timeout 600000
```

## Target a Different Environment

By default, tests run against `me-63384.dev.marginedge.com`. Set `TEST_ENV` to override:

```bash
TEST_ENV=master    npx playwright test tests/recipes/recipeMethodAndDuplication.spec.ts --workers=1 --timeout 600000
```

Works with any command — just prefix `TEST_ENV=<env>`.

## Jira Reporting

Add these env vars to post results to a Jira ticket:

```bash
JIRA_TICKET=ME-1234 \
JIRA_BASE_URL=https://marginedge.atlassian.net \
JIRA_EMAIL=user@co.com \
JIRA_API_TOKEN=xxx \
npx playwright test tests/recipes/recipeMethodAndDuplication.spec.ts --workers=1 --timeout 600000
```

## Full Example (Environment + Jira + All Suites)

```bash
TEST_ENV=me-66668 \
JIRA_TICKET=ME-1234 \
JIRA_BASE_URL=https://marginedge.atlassian.net \
JIRA_EMAIL=user@co.com \
JIRA_API_TOKEN=xxx \
npx playwright test tests/recipes/recipeMethodAndDuplication.spec.ts tests/recipes/recipePriceChange.spec.ts tests/recipes/recipeInventory.spec.ts tests/recipes/recipePlateCost.spec.ts tests/recipes/recipeCommissary.spec.ts tests/recipes/CheckList.spec.ts tests/recipes/PrepList.spec.ts --workers=1 --timeout 600000
```
