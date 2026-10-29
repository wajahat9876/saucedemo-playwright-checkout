# SauceDemo checkout test (Playwright)

One end-to-end test for the most important flow of [saucedemo.com](https://www.saucedemo.com): log in, add two items, check the cart, fill checkout, verify the totals, finish the order.

## Setup

Needs a current Node.js (tested with v24).

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm test              # headless
npm run test:headed   # watch the browser
npm run report        # open the HTML report after a run
```

Expected result: `2 passed`. One of them is the expected-failure test described below, which the list output shows with a cross.

## What the test checks

| Step | Assertion |
|---|---|
| Log in as `standard_user` | URL is `/inventory.html` |
| Add Backpack and Bike Light | Cart badge shows `2` |
| Open the cart | Item names and prices are exactly the two chosen |
| Fill checkout and continue | URL is `/checkout-step-two.html` |
| Overview | Item total $39.98, tax $3.20, total $43.18 |
| Finish | "Thank you for your order!" and the cart badge is gone |

A second test covers known defect D2: with an empty cart, Checkout should not open the checkout form. It fails today, so it is marked `test.fail()`.

The expected totals are fixed numbers worked out from the catalogue prices (29.99 + 9.99, 8% tax), not read back from the page. A test that copies the app's own numbers cannot catch a wrong total.

## Design choices

- **Selectors:** SauceDemo puts `data-test` on its elements. `testIdAttribute: 'data-test'` in the config lets the test use `getByTestId(...)`, so it does not depend on text, CSS classes or layout.
- **No hard-coded waits:** only Playwright's auto-waiting actions and web-first assertions (`expect(...).toHaveText`, `toHaveURL`). There is no `waitForTimeout`.
- **Isolation:** each test gets a fresh browser context. SauceDemo keeps the cart in `localStorage`, so one test cannot see another's cart. The test logs in through the UI itself and needs no data set up beforehand.
- **Readability:** `test.step` names every stage, so a failure report points to the stage that broke.

## AI use

**What AI did:** an AI assistant (Claude) wrote the first version of the config and the checkout test, and helped with locator choice and assertions.

**Where the AI draft was weak:**
- It checked item names in the cart but not their prices.
- The login username and password were typed straight into the test file.
- It only covered the working path. Nothing tied the automation to a defect I had found.

**What I changed after reviewing it, and why:**
- Added a price check for each cart item, because the same names could show a wrong price.
- Moved the credentials to `SAUCE_USER` and `SAUCE_PASSWORD` (with the public demo values as defaults), so a different account can be used without editing the code.
- Added a second test for defect D2 from my Task B report (checkout with an empty cart). It is marked with `test.fail()`, so it passes today because the defect exists, and turns into a reported failure the day the site is fixed.

**How I checked it:**
- Ran it against the live site: both tests pass.
- Changed an expected total on purpose (`$43.19`): the main test fails with `Expected: "Total: $43.19"`, `Received: "Total: $43.18"`, so the assertions do catch a wrong total.

Note: Playwright's list output shows the expected-failure test with a cross, but counts it as passed (`2 passed`).

## Limitations

- One main flow, one browser (Chromium), one account (`standard_user`). The whole flow is one test, so a failure early on hides the checks after it.
- It runs against the live public site, so a site outage or a change on the site can fail it.
- Only defect D2 is automated. The other defects in the Task B report are not covered.
- Prices and the 8% tax are fixed numbers in the test, so a change in the catalogue breaks the test and the numbers have to be updated by hand.
- The credentials are the public demo ones printed on the SauceDemo login page.
