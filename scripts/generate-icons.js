import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [
  { size: 192, name: 'logo192.png' },
  { size: 512, name: 'logo512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' }
];

async function generateIcons() {
  const sourceFile = join(__dirname, '../public/logo.svg');
  const outputDir = join(__dirname, '../public');

  for (const { size, name } of sizes) {
    const outputFile = join(outputDir, name);
    await sharp(sourceFile)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`Generated icon: ${name} (${size}x${size})`);
  }
}

generateIcons().catch(console.error); 