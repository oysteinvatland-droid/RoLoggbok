import { test, expect } from '@playwright/test'

const USERNAME = 'testbruker'
const PASSWORD = 'testpassord'

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )
})

test('korrekte credentials gir tilgang til dashboard', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[autocomplete="username"]').fill(USERNAME)
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await expect(page.getByText(/Tilgjengelige/)).toBeVisible()
  const stored = await page.evaluate(() => sessionStorage.getItem('baatlogg_app_auth'))
  expect(stored).toBe('true')
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
