#!/usr/bin/env node

/**
 * Exemplo de Webhook Real do Toolz - Pronto para testar
 * 
 * Uso:
 *  node scripts/webhook-real-example.js
 * 
 * Ou via curl:
 *  curl -X POST http://localhost:3000/webhook \
 *    -H "Content-Type: application/json" \
 *    -d @scripts/webhook-real-example.json
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Carregar payload do arquivo JSON
const webhookPayload = JSON.parse(fs.readFileSync(path.join(__dirname, 'webhook-real-example.json'), 'utf8'));

// URL do webhook; use primeiro argumento CLI ou NGROK_WEBHOOK_URL, caso contrário localhost
const defaultWebhookUrl = process.env.NGROK_WEBHOOK_URL || 'https://web-production-0bd2f.up.railway.app/webhook';
const webhookUrl = process.argv[2] || defaultWebhookUrl;
const parsedUrl = new URL(webhookUrl);

// Enviar webhook

function sendWebhook() {
  console.log(`📨 Enviando webhook real do Toolz para ${webhookUrl}...\n`);

  const data = JSON.stringify(webhookPayload);
  const isHttps = parsedUrl.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data, 'utf8')
    }
  };

  const req = lib.request(options, (res) => {
    let responseData = '';
    res.on('data', chunk => { responseData += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        
        console.log('✅ Webhook enviado com sucesso!\n');
        console.log('📊 Resposta do servidor:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('📌 Dados salvos no Firebase:');
        console.log('='.repeat(60));
        console.log(`Conversation ID: ${response.conversation_id}`);
        console.log(`Total de mensagens: ${response.messages_count}`);
        console.log(`Cliente: ${webhookPayload.meta.sender.name}`);
        console.log(`Agente: ${webhookPayload.meta.assignee.name}`);
        console.log(`Time: ${webhookPayload.meta.team.name}`);
        console.log(`Status: ${webhookPayload.status}`);
        console.log(`Timestamp: ${response.timestamp}`);
        
        console.log('\n🔍 Próximos passos:');
        console.log('1. Abra http://localhost:3000 no navegador');
        console.log('2. Você deve ver a conversa no dashboard');
        console.log('3. Clique para ver os detalhes completos');
        console.log('4. Verifique o Firebase Console para os dados brutos');
        
      } catch (e) {
        console.log('❌ Erro ao processar resposta:', e.message);
        console.log('📄 Resposta bruta do servidor:');
        console.log(responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro ao enviar webhook:', error.message);
    console.log('\n💡 Dicas:');
    console.log('1. O servidor está rodando? Execute: npm run dev');
    console.log('2. Porta 3000 está disponível?');
    console.log('3. Firebase está configurado no .env?');
  });

  req.write(data);
  req.end();
}

// Executar
sendWebhook();
