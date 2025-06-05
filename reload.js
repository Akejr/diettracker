// Script para limpar o cache e reiniciar o servidor Vite
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando cache...');

// Remover o diretório node_modules/.vite
const viteCache = path.join(__dirname, 'node_modules', '.vite');
if (fs.existsSync(viteCache)) {
  try {
    fs.rmSync(viteCache, { recursive: true, force: true });
    console.log('✅ Cache do Vite removido com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao remover o cache do Vite:', err);
  }
}

// Remover o diretório dist
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Diretório de build removido com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao remover o diretório de build:', err);
  }
}

console.log('🚀 Iniciando servidor de desenvolvimento...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Erro ao iniciar o servidor:', err);
} 