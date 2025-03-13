const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configurações
const sizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const splashSizes = [
  { width: 2048, height: 2732 },
  { width: 1668, height: 2224 },
  { width: 1536, height: 2048 },
  { width: 1125, height: 2436 },
  { width: 1242, height: 2208 },
  { width: 750, height: 1334 },
  { width: 640, height: 1136 }
];

// Função para gerar ícones
async function generateIcons() {
  const logoPath = path.join(__dirname, '../src/assets/logo.svg');
  const outputDir = path.join(__dirname, '../public/icons');

  // Garante que o diretório existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
  }
}

// Função para gerar splash screens
async function generateSplashScreens() {
  const splashPath = path.join(__dirname, '../src/assets/splash.svg');
  const outputDir = path.join(__dirname, '../public/splash');

  // Garante que o diretório existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of splashSizes) {
    await sharp(splashPath)
      .resize(size.width, size.height)
      .png()
      .toFile(path.join(outputDir, `apple-splash-${size.width}-${size.height}.png`));
  }
}

// Executa a geração
async function generateAll() {
  try {
    console.log('Gerando ícones...');
    await generateIcons();
    console.log('Gerando splash screens...');
    await generateSplashScreens();
    console.log('Concluído!');
  } catch (error) {
    console.error('Erro ao gerar imagens:', error);
  }
}

generateAll(); 