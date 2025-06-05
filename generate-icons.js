const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Verifica se o Sharp está instalado
try {
  require.resolve('sharp');
} catch (e) {
  console.log('Instalando dependência Sharp...');
  exec('npm install sharp', (error) => {
    if (error) {
      console.error(`Erro ao instalar Sharp: ${error}`);
      return;
    }
    console.log('Sharp instalado com sucesso. Executando script novamente...');
    exec('node generate-icons.js', (err) => {
      if (err) {
        console.error(`Erro ao executar script: ${err}`);
      }
    });
    return;
  });
  return;
}

const sharp = require('sharp');

const ICON_SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const SOURCE_SVG = path.join(__dirname, 'public', 'logo.svg');
const TARGET_DIR = path.join(__dirname, 'public', 'icons');

// Garantir que o diretório de destino existe
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateIcons() {
  console.log('Gerando ícones a partir do SVG...');
  
  try {
    // Ler o arquivo SVG
    const svgBuffer = fs.readFileSync(SOURCE_SVG);
    
    // Gerar cada tamanho de ícone
    for (const size of ICON_SIZES) {
      const outputPath = path.join(TARGET_DIR, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Ícone ${size}x${size} gerado`);
    }
    
    console.log('Todos os ícones foram gerados com sucesso!');
    console.log('Agora você pode fazer o build e o deploy novamente.');
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
  }
}

generateIcons();
