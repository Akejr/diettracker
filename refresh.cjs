const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando cache e preparando ambiente...');

// Limpar cache do navegador e service workers
console.log('📦 Removendo .vite cache...');
try {
  const viteCachePath = path.join(__dirname, 'node_modules', '.vite');
  if (fs.existsSync(viteCachePath)) {
    fs.rmSync(viteCachePath, { recursive: true, force: true });
    console.log('✅ Cache .vite removido com sucesso!');
  } else {
    console.log('ℹ️ Não foi encontrado cache .vite para remover.');
  }
} catch (error) {
  console.error('❌ Erro ao remover cache .vite:', error);
}

// Verificar e remover service worker
console.log('🧹 Verificando service-worker.js...');
const swPath = path.join(__dirname, 'public', 'service-worker.js');
try {
  if (fs.existsSync(swPath)) {
    // Vamos renomear em vez de excluir, como backup
    fs.renameSync(swPath, path.join(__dirname, 'public', 'service-worker.js.bak'));
    console.log('✅ Service worker renomeado para backup.');
  }
} catch (error) {
  console.error('❌ Erro ao lidar com service worker:', error);
}

// Iniciar o servidor
console.log('🚀 Iniciando servidor Vite na porta padrão 5173...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erro ao iniciar o servidor:', error);
  process.exit(1);
} 