import { test, expect } from '@playwright/test'
import { setupAdminPinMocks } from './helpers/apiMock'

test.beforeEach(async ({ page }) => {
  // Innlogget app; admin-PIN verifiseres server-side. Korrekt PIN = 0000.
  await setupAdminPinMocks(page, '0000')
})

test('navigasjon til /admin viser PIN-numpad', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByText('Skriv inn PIN-kode')).toBeVisible()
  await expect(page.getByRole('button', { name: '1' })).toBeVisible()
})

test('feil PIN viser Feil PIN', async ({ page }) => {
  await page.goto('/admin')
  for (const digit of ['1', '2', '3', '4']) {
    await page.getByRole('button', { name: digit }).click()
  }
  await expect(page.getByText('Feil PIN')).toBeVisible()
})

test('korrekt PIN (0000) gir tilgang til admin', async ({ page }) => {
  await page.goto('/admin')
  for (const digit of ['0', '0', '0', '0']) {
    await page.getByRole('button', { name: digit }).click()
  }
  await expect(page.getByText('Skriv inn PIN-kode')).not.toBeVisible()
  await expect(page.getByRole('link', { name: 'Roere' })).toBeVisible()
})
