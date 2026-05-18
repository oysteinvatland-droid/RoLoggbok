import { test, expect } from './fixtures/auth'
import { setupOnWaterMocks } from './helpers/supabaseMock'

test.beforeEach(async ({ page }) => {
  await setupOnWaterMocks(page)
  await page.goto('/')
  await expect(page.getByText('På vannet (1)')).toBeVisible()
})

test('klikk på båt på vannet åpner Avslutt tur-modal', async ({ page }) => {
  await page.locator('[role="button"]').filter({ hasText: 'Testbåt' }).click()
  await expect(page.getByRole('heading', { name: /Avslutt tur — Testbåt/ })).toBeVisible()
})

test('modalen viser roerens navn', async ({ page }) => {
  await page.locator('[role="button"]').filter({ hasText: 'Testbåt' }).click()
  await expect(page.getByRole('dialog').getByText('Kari Nordmann')).toBeVisible()
})

test('klikk Avslutt tur returnerer båt til Tilgjengelige', async ({ page }) => {
  await page.locator('[role="button"]').filter({ hasText: 'Testbåt' }).click()
  await page.getByRole('button', { name: 'Avslutt tur' }).click()
  await expect(page.getByRole('heading', { name: /Avslutt tur/ })).not.toBeVisible()
  await expect(page.getByText('Tilgjengelige (1)')).toBeVisible()
})
