import { test, expect } from '@playwright/test'
import { setupLoginMocks } from './helpers/apiMock'

const USERNAME = 'admin'
const PASSWORD = 'testpassord'

test.beforeEach(async ({ page }) => {
  // Ikke innlogget; /api/login godtar kun USERNAME/PASSWORD, resten av API-et mockes.
  await setupLoginMocks(page, USERNAME, PASSWORD)
})

test('korrekte credentials gir tilgang til dashboard', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[autocomplete="username"]').fill(USERNAME)
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await expect(page.getByText(/Tilgjengelige/)).toBeVisible()
})

test('feil passord viser feilmelding', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[autocomplete="username"]').fill(USERNAME)
  await page.locator('input[autocomplete="current-password"]').fill('feil-passord')
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await expect(page.getByText('Feil brukernavn eller passord')).toBeVisible()
})

test('feilmelding forsvinner når bruker begynner å skrive', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[autocomplete="username"]').fill(USERNAME)
  await page.locator('input[autocomplete="current-password"]').fill('feil')
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await expect(page.getByText('Feil brukernavn eller passord')).toBeVisible()
  await page.locator('input[autocomplete="username"]').type('x')
  await expect(page.getByText('Feil brukernavn eller passord')).not.toBeVisible()
})
