import { test as base, expect } from '@playwright/test'

export const test = base.extend<object, object>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('baatlogg_app_auth', 'true')
    })
    await use(page)
  },
})

export { expect }
