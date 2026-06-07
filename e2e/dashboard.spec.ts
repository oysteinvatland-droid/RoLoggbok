import { test, expect } from './fixtures/auth'
import { setupDashboardMocks } from './helpers/apiMock'

test.beforeEach(async ({ page }) => {
  await setupDashboardMocks(page)
  await page.goto('/')
})

test('viser Tilgjengelige-seksjon med testbåten', async ({ page }) => {
  await expect(page.getByText('Tilgjengelige (1)')).toBeVisible()
  await expect(page.getByText('Testbåt')).toBeVisible()
})

test('viser ikke På vannet-seksjon når ingen aktive turer', async ({ page }) => {
  await expect(page.getByText(/På vannet/)).not.toBeVisible()
})

test('søk filtrerer bort båter som ikke matcher', async ({ page }) => {
  await page.getByPlaceholder('Søk på navn...').fill('XyzIngenMatch')
  await expect(page.getByText('Testbåt')).not.toBeVisible()
})
