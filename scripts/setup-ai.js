#!/usr/bin/env node

/**
 * Script interativo para configurar Gemini API
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

async function setupGemini() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Configurar Gemini/OpenAI + Google Sheets                   ║
╚════════════════════════════════════════════════════════════════╝
  `);

  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  console.log('1️⃣  Obtenha sua chave API em: https://platform.openai.com/account/api-keys');
  console.log('   (Clique em "Create new secret key" → Copie)\n');
  
  const openaiKey = await question('Cole aqui sua chave OpenAI: ').catch(() => '');
  
  if (!openaiKey) {
    console.log('\n❌ Chave não fornecida. Abortando.');
    rl.close();
    return;
  }

  // Perguntar sobre Google Sheets
  console.log('\n2️⃣  Quer usar Google Sheets para salvar os dados? (s/n): ');
  const useSheets = await question('').catch(() => 'n');

  let sheetsConfig = '';
  if (useSheets.toLowerCase() === 's') {
    console.log('\n   ⚠️  IMPORTANTE: Use "Dados do Aplicativo" (Service Account)');
    console.log('   ✅ Funciona automaticamente sem login');
    console.log('   ✅ Mais seguro para aplicações automatizadas\n');
    
    console.log('\n   📚 PASSOS PARA GOOGLE SHEETS:');
    console.log('   1. Vá em: https://console.cloud.google.com/');
    console.log('   2. Menu lateral: "APIs e Serviços" → "Biblioteca"');
    console.log('   3. PROCURE por "Google Sheets API" → ATIVAR');
    console.log('   4. PROCURE por "Google Drive API" → ATIVAR');
    console.log('   5. Vá para "Credenciais" → "Criar Service Account"');
    console.log('   6. Baixe JSON → renomeie para: google-credentials.json\n');
    
    const sheetsId = await question('ID da planilha Google Sheets (ou Enter para pular): ').catch(() => '');
    if (sheetsId) {
      sheetsConfig = `
GOOGLE_SHEETS_CREDENTIALS_FILE=./google-credentials.json
GOOGLE_SHEETS_ID=${sheetsId}
GOOGLE_SHEETS_NAME=Análises`;
    }
  }

  // Atualizar .env
  if (!envContent.includes('OPENAI_API_KEY')) {
    envContent += `\n# ============================================\n# Gemini/OpenAI\n# ============================================\nOPENAI_API_KEY=${openaiKey}\nOPENAI_MODEL=gemini-1.5${sheetsConfig}\n`;
  } else {
    envContent = envContent.replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${openaiKey}`);
    if (!envContent.includes('OPENAI_MODEL=')) {
      envContent += '\nOPENAI_MODEL=gemini-1.5\n';
    }
  }

  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuração salva em .env');
  console.log('\n📦 Agora instale as dependências:');
  console.log('   npm install\n');
  console.log('📊 Depois rode:');
  console.log('   node src/ai-analyzer.js\n');
  
  rl.close();
}

setupGemini().catch(console.error);
