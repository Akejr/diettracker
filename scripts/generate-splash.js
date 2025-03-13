import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [
  { width: 1290, height: 2796 },
  { width: 1179, height: 2556 },
  { width: 1284, height: 2778 },
  { width: 1170, height: 2532 },
  { width: 1125, height: 2436 }
];

async function generateSplashScreens() {
  const sourceFile = join(__dirname, '../public/logo.svg');
  const outputDir = join(__dirname, '../public');

  // Criar um fundo gradiente
  const gradient = Buffer.from(`
    <svg width="1" height="1">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#22C55E;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1" height="1" fill="url(#grad)" />
    </svg>
  `);

  for (const size of sizes) {
    const { width, height } = size;
    const outputFile = join(outputDir, `splash_${width}x${height}.png`);
    const logoSize = Math.min(width, height) * 0.4;

    // Redimensionar o logo primeiro
    const resizedLogo = await sharp(sourceFile)
      .resize(Math.round(logoSize), Math.round(logoSize))
      .toBuffer();

    // Criar o fundo com gradiente e sobrepor o logo
    await sharp(gradient)
      .resize(width, height)
      .composite([{
        input: resizedLogo,
        top: Math.round((height - logoSize) / 2),
        left: Math.round((width - logoSize) / 2)
      }])
      .toFile(outputFile);

    console.log(`Generated splash screen: ${width}x${height}`);
  }
}

generateSplashScreens().catch(console.error); 