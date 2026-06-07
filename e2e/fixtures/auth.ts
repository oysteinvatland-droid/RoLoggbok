// Auth håndteres nå server-side; testene mocker GET /api/session til { authenticated: true }
// i helpers/apiMock.ts, så ingen sessionStorage-triks trengs lenger. Beholdt som tynt
// gjenbrukspunkt slik at spec-ene kan importere test/expect herfra.
import { test, expect } from '@playwright/test'

export { test, expect }
