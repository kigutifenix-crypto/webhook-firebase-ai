/**
 * API Serverless - Webhook Receiver para Vercel
 * Recebe webhooks da Toolz e salva no Firebase Realtime Database
 * URL: https://planilhasfenix.vercel.app/api/webhook
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin (apenas uma vez)
let db = null;
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized && admin.apps.length > 0) {
    return admin.database();
  }

  try {
    // Tentar carregar credenciais do ambiente
    let credential = null;

    // 1. Tentar usar variáveis de ambiente individuais
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      credential = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };
    }

    // 2. Tentar usar JSON nas variáveis de ambiente (útil em serverless)
    if (!credential) {
      const envJson = process.env.FIREBASE_CREDENTIALS_JSON || process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || process.env.GOOGLE_CREDENTIALS_JSON;
      if (envJson) {
        try {
          credential = typeof envJson === 'string' ? JSON.parse(envJson) : envJson;
        } catch (err) {
          console.warn('Variável de ambiente de credenciais inválida:', err.message);
        }
      }
    }

    // 3. Tentar usar arquivo de credenciais (em desenvolvimento local)
    if (!credential) {
      const credPath = path.resolve(__dirname, '../google-credentials.json');
      if (fs.existsSync(credPath)) {
        credential = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      }
    }

    if (!credential) {
      throw new Error('Firebase credentials não configuradas. Configure FIREBASE_PRIVATE_KEY e FIREBASE_CLIENT_EMAIL.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(credential),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    firebaseInitialized = true;
    db = admin.database();
    console.log('✅ Firebase inicializado com sucesso');
    return db;

  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    throw error;
  }
}

/**
 * Validar webhook do Toolz
 */
function validarWebhook(dados) {
  if (!dados) return { valido: false, erro: 'Payload vazio' };

  // Validar conversation_id (obrigatório)
  if (!dados.id && !dados.conversation_id) {
    return { valido: false, erro: 'ID da conversa (id/conversation_id) não encontrado' };
  }

  // Validar messages array (obrigatório)
  if (!dados.messages || !Array.isArray(dados.messages)) {
    return { valido: false, erro: 'Messages deve ser um array' };
  }

  // Validar que há pelo menos uma mensagem
  if (dados.messages.length === 0) {
    return { valido: false, erro: 'Messages array vazio' };
  }

  // Validar que cada mensagem tem conteúdo
  for (let msg of dados.messages) {
    if (!msg.content && !msg.body) {
      return { valido: false, erro: 'Mensagem sem conteúdo' };
    }
  }

  return { valido: true };
}

/**
 * Handler principal da função serverless
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      sucesso: false,
      erro: 'Método não permitido. Use POST.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Inicializar Firebase
    const database = initializeFirebase();

    // Validar webhook
    const validacao = validarWebhook(req.body);

    if (!validacao.valido) {
      return res.status(400).json({
        sucesso: false,
        erro: validacao.erro,
        timestamp: new Date().toISOString()
      });
    }

    const dados = req.body;
    const conversation_id = dados.id || dados.conversation_id;

    // Extrair informações do webhook do Toolz
    const informacoes = {
      id: conversation_id,
      conversation_id: conversation_id,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      received_at: new Date().toISOString(),

      // Status e metadados da conversa
      status: dados.status || 'open',
      inbox_id: dados.inbox_id || null,
      priority: dados.priority || null,
      unread_count: dados.unread_count || 0,

      // Informações do Cliente (Sender)
      sender: {
        id: dados.meta?.sender?.id || null,
        name: dados.meta?.sender?.name || 'Desconhecido',
        phone_number: dados.meta?.sender?.phone_number || null,
        email: dados.meta?.sender?.email || null,
        cpf: dados.meta?.sender?.cpf || null,
        type: dados.meta?.sender?.type || 'contact'
      },

      // Informações do Agente (Assignee)
      assignee: {
        id: dados.meta?.assignee?.id || null,
        name: dados.meta?.assignee?.name || 'Não atribuído',
        available_name: dados.meta?.assignee?.available_name || null,
        type: dados.meta?.assignee?.type || 'user'
      },

      // Informações do Time
      team: {
        id: dados.meta?.team?.id || null,
        name: dados.meta?.team?.name || null
      },

      // Rótulos e atributos
      labels: dados.labels || [],
      custom_attributes: dados.custom_attributes || {},

      // Timestamps importantes
      created_at: dados.created_at || new Date().toISOString(),
      first_reply_created_at: dados.first_reply_created_at || null,
      agent_last_seen_at: dados.agent_last_seen_at || null,
      contact_last_seen_at: dados.contact_last_seen_at || null,

      // Últimas mensagens
      messages: dados.messages || [],

      // Tipo de evento (se disponível)
      event: dados.event || null,

      // Dados completos brutos (para auditoria)
      raw_data: dados
    };

    // Salvar no Firebase Realtime Database
    const reference = database.ref(`conversations/${conversation_id}`);

    // Atualizar ou criar registro
    await reference.update(informacoes);

    // Salvar/Atualizar histórico de mensagens
    if (dados.messages && dados.messages.length > 0) {
      const messagesRef = database.ref(`conversations/${conversation_id}/messages_history`);
      const currentSnapshot = await messagesRef.get();
      let messagesList = currentSnapshot.val() || [];

      // Adicionar novas mensagens ao histórico (evitando duplicatas por ID)
      const existingIds = new Set(messagesList.map(m => m.id));

      dados.messages.forEach(msg => {
        if (!existingIds.has(msg.id)) {
          messagesList.push({
            ...msg,
            received_at: new Date().toISOString()
          });
        }
      });

      // Manter os últimos 500 registros (limite de performance)
      if (messagesList.length > 500) {
        messagesList = messagesList.slice(-500);
      }

      await messagesRef.set(messagesList);
    }

    // Log detalhado
    console.log(`✅ Webhook Toolz recebido e salvo`);
    console.log(`   Conversation ID: ${conversation_id}`);
    console.log(`   Cliente: ${informacoes.sender.name || 'Desconhecido'}`);
    console.log(`   Agente: ${informacoes.assignee.name || 'Não atribuído'}`);
    console.log(`   Mensagens: ${dados.messages.length}`);
    console.log(`   Status: ${informacoes.status}`);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Webhook recebido e armazenado com sucesso',
      conversation_id: conversation_id,
      messages_count: dados.messages.length,
      timestamp: new Date().toISOString()
    });

  } catch (erro) {
    console.error('❌ Erro ao processar webhook:', erro);
    console.error('Stack:', erro.stack);
    return res.status(500).json({
      sucesso: false,
      erro: erro.message,
      timestamp: new Date().toISOString()
    });
  }
}
