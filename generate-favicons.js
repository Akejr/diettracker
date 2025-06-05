const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Instalar sharp se necessário
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'sharp'))) {
  console.log('Instalando sharp...');
  exec('npm install sharp --no-save', (error) => {
    if (error) {
      console.error('Erro ao instalar sharp:', error);
      return;
    }
    console.log('Sharp instalado com sucesso!');
    generateFavicons();
  });
} else {
  generateFavicons();
}

function generateFavicons() {
  const sharp = require('sharp');
  const SOURCE_SVG = path.join(__dirname, 'public', 'logo.svg');
  const PUBLIC_DIR = path.join(__dirname, 'public');
  
  console.log('Gerando favicons...');
  
  // Ler o arquivo SVG
  const svgBuffer = fs.readFileSync(SOURCE_SVG);
  
  // Gerar favicon-16x16.png
  sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'))
    .then(() => console.log('✓ favicon-16x16.png gerado'))
    .catch(err => console.error('Erro ao gerar favicon-16x16.png:', err));
  
  // Gerar favicon-32x32.png
  sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'))
    .then(() => console.log('✓ favicon-32x32.png gerado'))
    .catch(err => console.error('Erro ao gerar favicon-32x32.png:', err));
  
  // Gerar favicon.ico (formato ICO)
  sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer()
    .then(buffer => {
      // Converter para .ico usando outro pacote ou simplesmente salvar como PNG
      // Como não temos o pacote para converter para ICO, vamos duplicar o PNG de 32x32
      fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buffer);
      console.log('✓ favicon.ico gerado (na verdade é um PNG)');
    })
    .catch(err => console.error('Erro ao gerar favicon.ico:', err));
}
