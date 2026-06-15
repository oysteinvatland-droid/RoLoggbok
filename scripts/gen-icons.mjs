import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.resolve(__dirname, '../public/icons')
const publicDir = path.resolve(__dirname, '../public')
const source = path.join(iconsDir, 'BærumLogo.png')

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

// Lager et kvadratisk ikon: logoen sentrert på hvit bakgrunn.
// `coverage` = hvor stor andel av kanten logoen får fylle (resten blir marg).
async function makeIcon(size, coverage, outPath) {
  const inner = Math.round(size * coverage)
  const logo = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outPath)

  console.log('skrev', path.relative(path.resolve(__dirname, '..'), outPath))
}

// Standard-ikoner: logoen fyller det meste av flaten.
await makeIcon(180, 0.86, path.join(publicDir, 'apple-touch-icon.png'))
await makeIcon(192, 0.86, path.join(iconsDir, 'icon-192.png'))
await makeIcon(512, 0.86, path.join(iconsDir, 'icon-512.png'))
// Maskable: logoen holdes innenfor Androids ~80% safe zone.
await makeIcon(512, 0.62, path.join(iconsDir, 'icon-512-maskable.png'))
