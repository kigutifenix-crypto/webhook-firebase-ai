#!/usr/bin/env node

/**
 * Instruções para configurar Vercel
 * Execute: node scripts/vercel-setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

async function setupVercel() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Setup Vercel - Webhook Receiver Serverless                 ║
╚════════════════════════════════════════════════════════════════╝
  `);

  console.log('\n✅ PASSOS PARA CONFIGURAR NO VERCEL:');
  console.log('\n1️⃣  Instale Vercel CLI (se ainda não tiver):');
  console.log('    npm i -g vercel');
  
  console.log('\n2️⃣  Faça login no Vercel:');
  console.log('    vercel login');
  
  console.log('\n3️⃣  Configure as variáveis de ambiente:');
  console.log('    https://vercel.com/dashboard');
  console.log('    → Selecione seu projeto');
  console.log('    → Settings → Environment Variables');
  console.log('    → Adicione as seguintes variáveis:');
  
  console.log('\n   📋 VARIÁVEIS OBRIGATÓRIAS:');
  console.log('   - FIREBASE_PROJECT_ID');
  console.log('   - FIREBASE_PRIVATE_KEY (com \\n para quebras de linha)');
  console.log('   - FIREBASE_CLIENT_EMAIL');
  console.log('   - FIREBASE_DATABASE_URL');
  console.log('   - OPENAI_API_KEY');
  
  console.log('\n4️⃣  Deploy automático:');
  console.log('    git push origin main');
  console.log('    (Vercel fará deploy automaticamente)');
  
  console.log('\n5️⃣  Verifique o deploy:');
  console.log('    https://vercel.com/dashboard → Deployments');
  
  console.log('\n6️⃣  Obtenha a URL do webhook:');
  console.log('    https://planilhasfenix.vercel.app/api/webhook');
  
  console.log('\n7️⃣  Configure na Toolz:');
  console.log('    Toolz → Configurações → Webhooks');
  console.log('    URL: https://planilhasfenix.vercel.app/api/webhook');
  
  console.log('\n8️⃣  Teste o webhook:');
  console.log('    node scripts/webhook-real-example.js');
  
  console.log('\n9️⃣  Monitore os logs:');
  console.log('    vercel logs --follow');
  
  console.log('\n✅ Setup concluído!');
  console.log('\n📚 Para mais informações, leia: docs/VERCEL_DEPLOYMENT.md\n');
  
  rl.close();
}

setupVercel().catch(console.error);
