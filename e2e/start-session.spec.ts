import { test, expect } from './fixtures/auth'
import { setupDashboardMocks } from './helpers/supabaseMock'

test.beforeEach(async ({ page }) => {
  await setupDashboardMocks(page)
  await page.goto('/')
  await expect(page.getByText('Tilgjengelige (1)')).toBeVisible()
})

test('klikk på ledig båt åpner Start tur-modal', async ({ page }) => {
  await page.locator('[role="button"]').filter({ hasText: 'Testbåt' }).click()
  await expect(page.getByRole('heading', { name: /Start tur — Testbåt/ })).toBeVisible()
})

test('full veiviser: velg roer, ingen rute, bekreft, båt flyttes til På vannet', async ({ page }) => {
  await page.locator('[role="button"]').filter({ hasText: 'Testbåt' }).click()
  await expect(page.getByText('Velg roere')).toBeVisible()

  // Steg 1: velg roer
  await expect(page.getByRole('button', { name: 'Kari Nordmann' })).toBeVisible()
  await page.getByRole('button', { name: 'Kari Nordmann' }).click()
  const nesteBtn = page.getByRole('button', { name: 'Neste →' })
  await expect(nesteBtn).toBeEnabled()
  await nesteBtn.click()

  // Steg 2: rute — "Ingen rute" er forhåndsvalgt
  await expect(page.getByText('Velg rute')).toBeVisible()
  await page.getByRole('button', { name: 'Neste →' }).click()

  // Steg 3: tidspunkt
  await expect(page.getByText('Tidspunkt', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Neste →' }).click()

  // Steg 4: bekreft
  await expect(page.getByText('Bekreft', { exact: true })).toBeVisible()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/Kari Nordmann/)).toBeVisible()
  await expect(dialog.getByText('Testbåt', { exact: true })).toBeVisible()

  // Start turen
  await page.getByRole('button', { name: 'Start tur' }).click()

  // Modal lukkes og båt er nå på vannet
  await expect(page.getByRole('heading', { name: /Start tur/ })).not.toBeVisible()
  await expect(page.getByText('På vannet (1)')).toBeVisible()
})

test('Avbryt-knapp lukker modalen uten å starte tur', async ({ page }) => {
  await page.locator('[role="button"]').filter({ hasText: 'Testbåt' }).click()
  await expect(page.getByRole('heading', { name: /Start tur/ })).toBeVisible()
  await page.getByRole('button', { name: 'Avbryt' }).click()
  await expect(page.getByRole('heading', { name: /Start tur/ })).not.toBeVisible()
  await expect(page.getByText('Tilgjengelige (1)')).toBeVisible()
})
