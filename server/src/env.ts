import path from 'node:path'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Mangler påkrevd miljøvariabel: ${name}`)
  return value
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'production',

  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // Klubb-scoping (alle spørringer filtreres på denne)
  CLUB_ID: required('CLUB_ID'),

  // Auth (server-side hemmeligheter — ALDRI i frontend-bundelen)
  APP_USERNAME: process.env.APP_USERNAME ?? 'admin',
  APP_PASSWORD: required('APP_PASSWORD'),
  ADMIN_PIN: required('ADMIN_PIN'),
  SESSION_SECRET: required('SESSION_SECRET'),

  // Statiske SPA-filer som serveres av samme container
  STATIC_DIR: process.env.STATIC_DIR ?? path.join(__dirname, '..', 'public'),
}

export const isProd = env.NODE_ENV === 'production'
