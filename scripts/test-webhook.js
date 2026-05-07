#!/usr/bin/env node

/**
 * Script para testar conexão com Firebase e enviar webhook de teste
 * Uso: node scripts/test-webhook.js
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🧪 Iniciando testes...\n');

// 1. Verificar variáveis de ambiente
console.log('1️⃣  Verificando variáveis de ambiente...');
const requiredEnvs = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_DATABASE_URL'
];

let missingEnvs = [];
requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    missingEnvs.push(env);
    console.log(`   ❌ ${env} não encontrado`);
  } else {
    console.log(`   ✅ ${env} configurado`);
  }
});

if (missingEnvs.length > 0) {
  console.log('\n❌ Variáveis de ambiente faltando! Configure .env');
  process.exit(1);
}

// 2. Testar conexão com servidor
console.log('\n2️⃣  Testando conexão com servidor na porta 3000...');

function testConnection() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/status',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`   ✅ Servidor respondendo: ${response.status}`);
          console.log(`   ✅ Firebase status: ${response.firebase}`);
          resolve(true);
        } catch (e) {
          console.log('   ⚠️  Resposta inválida do servidor');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Servidor não respondeu: ${error.message}`);
      console.log('   💡 Execute: npm run dev');
      resolve(false);
    });

    req.end();
  });
}

// 3. Enviar webhook de teste
function sendTestWebhook() {
  return new Promise((resolve) => {
    const testPayload = {
      id: `test_webhook_${Date.now()}`,
      conversation_id: `test_webhook_${Date.now()}`,
      messages: [
        {
          body: 'Webhook de teste - ' + new Date().toISOString(),
          from: '5511987654321',
          timestamp: Math.floor(Date.now() / 1000)
        }
      ],
      meta: {
        sender: {
          name: 'Cliente Teste',
          phone_number: '11987654321',
          id: 'test_user'
        },
        assignee: {
          name: 'Agente Teste',
          id: 'test_agent'
        }
      }
    };

    const data = JSON.stringify(testPayload);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('\n3️⃣  Enviando webhook de teste...');

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.sucesso) {
            console.log(`   ✅ Webhook enviado com sucesso!`);
            console.log(`   📌 Conversation ID: ${response.conversation_id}`);
            console.log(`   ⏰ Timestamp: ${response.timestamp}`);
            resolve(true);
          } else {
            console.log(`   ❌ Erro ao enviar webhook: ${response.erro}`);
            resolve(false);
          }
        } catch (e) {
          console.log(`   ❌ Erro ao processar resposta: ${e.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Erro ao enviar webhook: ${error.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 4. Listar conversas
function listConversations() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/conversations',
      method: 'GET'
    };

    console.log('\n4️⃣  Listando conversas...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.sucesso) {
            console.log(`   ✅ Total de conversas: ${response.total}`);
            if (response.conversas.length > 0) {
              console.log(`   📝 Últimas 3 conversas:`);
              response.conversas.slice(0, 3).forEach((conv, idx) => {
                console.log(`      ${idx + 1}. ${conv.id} - ${conv.sender?.name || 'Desconhecido'}`);
              });
            }
            resolve(true);
          } else {
            console.log(`   ❌ Erro ao listar conversas`);
            resolve(false);
          }
        } catch (e) {
          console.log(`   ❌ Erro ao processar resposta`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Erro ao listar conversas: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Executar testes em sequência
async function runTests() {
  const serverConnected = await testConnection();
  
  if (serverConnected) {
    const webhookSent = await sendTestWebhook();
    if (webhookSent) {
      // Aguardar um pouco para Firebase sincronizar
      console.log('\n⏳ Aguardando sincronização com Firebase...');
      setTimeout(() => {
        listConversations();
        printSummary();
      }, 1000);
    } else {
      console.log('\n❌ Falha ao enviar webhook');
    }
  } else {
    console.log('\n❌ Servidor não está respondendo');
    console.log('💡 Inicie o servidor com: npm run dev');
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('✅ TESTES CONCLUÍDOS!');
  console.log('='.repeat(50));
  console.log('\n🎯 Próximos passos:');
  console.log('  1. Abra http://localhost:3000 no navegador');
  console.log('  2. Você deve ver a conversa de teste no dashboard');
  console.log('  3. Configure o webhook na Toolz:');
  console.log('     POST http://seu-dominio.com/webhook');
  console.log('\n📖 Mais informações: veja WEBHOOK_EXAMPLES.md');
}

// Iniciar testes
runTests();
