import { test, expect, Page } from '@playwright/test';

// Public demo credentials shown on the SauceDemo login page. Override with SAUCE_USER / SAUCE_PASSWORD.
const USER = {
  username: process.env.SAUCE_USER ?? 'standard_user',
  password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
};

// Catalogue prices: backpack 29.99 + bike light 9.99 = 39.98, tax 8% = 3.20, total 43.18.
const ITEMS = [
  { id: 'sauce-labs-backpack', name: 'Sauce Labs Backpack', price: '$29.99' },
  { id: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light', price: '$9.99' },
];
const EXPECTED = { subtotal: 'Item total: $39.98', tax: 'Tax: $3.20', total: 'Total: $43.18' };

async function login(page: Page) {
  await page.goto('/');
  await page.getByTestId('username').fill(USER.username);
  await page.getByTestId('password').fill(USER.password);
  await page.getByTestId('login-button').click();
  await expect(page).toHaveURL(/inventory\.html/);
}

test('standard user can buy two items and the order totals are correct', async ({ page }) => {
  await test.step('log in', () => login(page));

  await test.step('add two items and check the cart badge', async () => {
    for (const item of ITEMS) {
      await page.getByTestId(`add-to-cart-${item.id}`).click();
    }
    await expect(page.getByTestId('shopping-cart-badge')).toHaveText('2');
  });

  await test.step('cart lists exactly the chosen items with their prices', async () => {
    await page.getByTestId('shopping-cart-link').click();
    await expect(page.getByTestId('inventory-item-name')).toHaveText(ITEMS.map((i) => i.name));
    await expect(page.getByTestId('inventory-item-price')).toHaveText(ITEMS.map((i) => i.price));
  });

  await test.step('fill checkout details', async () => {
    await page.getByTestId('checkout').click();
    await page.getByTestId('firstName').fill('Ali');
    await page.getByTestId('lastName').fill('Khan');
    await page.getByTestId('postalCode').fill('12345');
    await page.getByTestId('continue').click();
  });

  await test.step('overview shows correct totals', async () => {
    await expect(page).toHaveURL(/checkout-step-two\.html/);
    await expect(page.getByTestId('subtotal-label')).toHaveText(EXPECTED.subtotal);
    await expect(page.getByTestId('tax-label')).toHaveText(EXPECTED.tax);
    await expect(page.getByTestId('total-label')).toHaveText(EXPECTED.total);
  });

  await test.step('finish the order and confirm the cart is cleared', async () => {
    await page.getByTestId('finish').click();
    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
    await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
  });
});

// Known defect D2 (Task B report): the site lets a user check out with an empty cart.
// Marked as an expected failure. If the site is fixed this test "unexpectedly passes" and
// Playwright reports it, which is the signal to remove test.fail().
test('checkout is blocked when the cart is empty (known defect D2)', async ({ page }) => {
  test.fail();
  await login(page);
  await page.getByTestId('shopping-cart-link').click();
  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  await page.getByTestId('checkout').click();
  await expect(page).not.toHaveURL(/checkout-step-one\.html/);
});
