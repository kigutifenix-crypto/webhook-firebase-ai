const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Inicializar Firebase Admin
const FIREBASE_CREDENTIALS_FILE = process.env.FIREBASE_CREDENTIALS_FILE || process.env.GOOGLE_SHEETS_CREDENTIALS_FILE || './google-credentials.json';

function loadFirebaseCredentials() {
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const envConfig = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: envPrivateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  if (envConfig.private_key && envConfig.client_email) {
    return envConfig;
  }

  const credentialsPath = path.resolve(__dirname, FIREBASE_CREDENTIALS_FILE);
  if (fs.existsSync(credentialsPath)) {
    try {
      const serviceAccount = require(credentialsPath);
      if (serviceAccount.private_key && serviceAccount.client_email) {
        return serviceAccount;
      }
      throw new Error('Arquivo de credenciais não contém private_key/client_email válidos.');
    } catch (error) {
      throw new Error(`Erro ao carregar credenciais do arquivo ${credentialsPath}: ${error.message}`);
    }
  }

  throw new Error('Credenciais Firebase não encontradas. Configure FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL ou FIREBASE_CREDENTIALS_FILE.');
}

try {
  const credential = loadFirebaseCredentials();
  admin.initializeApp({
    credential: admin.credential.cert(credential),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  console.error('⚠️  Certifique-se de configurar as variáveis de ambiente FIREBASE_* no Railway');
  // Não sair, permitir que o app inicie mesmo sem Firebase para facilitar deploy
}

let db = null;
if (admin.apps.length > 0) {
  db = admin.database();
}

// Importar ai-analyzer APÓS Firebase ser inicializado
const aiAnalyzer = require('./ai-analyzer');

// ============================================
// VALIDAÇÃO DE WEBHOOK (Formato Toolz)
// ============================================
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

// ============================================
// ROTA: RECEBER WEBHOOK (Toolz Format)
// ============================================
app.post('/webhook', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        sucesso: false,
        erro: 'Firebase não inicializado. Configure as variáveis de ambiente.',
        timestamp: new Date().toISOString()
      });
    }

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
    const reference = db.ref(`conversations/${conversation_id}`);
    
    // Atualizar ou criar registro
    await reference.update(informacoes);

    // Salvar/Atualizar histórico de mensagens
    if (dados.messages && dados.messages.length > 0) {
      const messagesRef = db.ref(`conversations/${conversation_id}/messages_history`);
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
});

// ============================================
// ROTA: OBTER CONVERSA
// ============================================
app.get('/conversation/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        sucesso: false,
        erro: 'Firebase não inicializado. Configure as variáveis de ambiente.',
        timestamp: new Date().toISOString()
      });
    }

    const { id } = req.params;
    const snapshot = await db.ref(`conversations/${id}`).get();
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Conversa não encontrada'
      });
    }

    return res.status(200).json({
      sucesso: true,
      dados: snapshot.val()
    });

  } catch (erro) {
    console.error('❌ Erro ao buscar conversa:', erro);
    return res.status(500).json({
      sucesso: false,
      erro: erro.message
    });
  }
});

// ============================================
// ROTA: LISTAR CONVERSAS
// ============================================
app.get('/conversations', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        sucesso: false,
        erro: 'Firebase não inicializado. Configure as variáveis de ambiente.',
        timestamp: new Date().toISOString()
      });
    }

    const snapshot = await db.ref('conversations').limitToLast(50).get();
    
    if (!snapshot.exists()) {
      return res.status(200).json({
        sucesso: true,
        conversas: [],
        total: 0
      });
    }

    const conversas = [];
    snapshot.forEach(child => {
      conversas.push({
        id: child.key,
        ...child.val()
      });
    });

    return res.status(200).json({
      sucesso: true,
      conversas: conversas,
      total: conversas.length
    });

  } catch (erro) {
    console.error('❌ Erro ao listar conversas:', erro);
    return res.status(500).json({
      sucesso: false,
      erro: erro.message
    });
  }
});

// ============================================
// ROTA: ANALISAR CONVERSA INDIVIDUAL
// ============================================
app.post('/analyze/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        sucesso: false,
        erro: 'Firebase não inicializado. Configure as variáveis de ambiente.',
        timestamp: new Date().toISOString()
      });
    }

    const conversationId = req.params.id;
    const snapshot = await db.ref(`conversations/${conversationId}`).get();
    if (!snapshot.exists()) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Conversa não encontrada'
      });
    }

    const conversationData = snapshot.val();
    const analysis = await aiAnalyzer.analyzeConversation(conversationId, conversationData);

    await db.ref(`conversations/${conversationId}/analysis`).set(analysis);

    // Se Google Sheets estiver configurado, atualiza também a planilha
    if (process.env.GOOGLE_SHEETS_ID) {
      await aiAnalyzer.saveToGoogleSheets(
        process.env.GOOGLE_SHEETS_ID,
        process.env.GOOGLE_SHEETS_NAME || 'Análises',
        [analysis]
      );
    }

    return res.status(200).json({
      sucesso: true,
      analysis
    });
  } catch (erro) {
    console.error('❌ Erro ao analisar conversa:', erro);
    return res.status(500).json({
      sucesso: false,
      erro: erro.message
    });
  }
});

// Status da análise em andamento
let analysisStatus = {
  inProgress: false,
  progress: 0,
  total: 0,
  current: '',
  error: null,
  startTime: null,
  results: null
};

// ============================================
// ROTA: ANALISAR TODAS AS CONVERSAS
// ============================================
app.post('/analyze', async (req, res) => {
  console.log('📡 Recebida requisição POST /analyze');

  try {
    if (!db) {
      console.error('❌ Firebase não inicializado no servidor');
      return res.status(503).json({
        sucesso: false,
        erro: 'Firebase não inicializado. Configure as variáveis de ambiente.',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se já há uma análise em andamento
    if (analysisStatus.inProgress) {
      return res.status(409).json({
        sucesso: false,
        erro: 'Análise já em andamento. Aguarde a conclusão.',
        status: analysisStatus,
        timestamp: new Date().toISOString()
      });
    }

    // Iniciar análise em background
    analysisStatus = {
      inProgress: true,
      progress: 0,
      total: 0,
      current: 'Iniciando...',
      error: null,
      startTime: new Date(),
      results: null
    };

    // Executar análise em background (não bloquear a resposta)
    analyzeAllConversationsBackground();

    console.log('🚀 Análise iniciada em background');

    return res.status(202).json({
      sucesso: true,
      mensagem: 'Análise iniciada em background',
      status: analysisStatus,
      timestamp: new Date().toISOString()
    });

  } catch (erro) {
    console.error('❌ Erro ao iniciar análise:', erro);
    analysisStatus = {
      inProgress: false,
      progress: 0,
      total: 0,
      current: '',
      error: erro.message,
      startTime: null,
      results: null
    };

    return res.status(500).json({
      sucesso: false,
      erro: erro.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ROTA: STATUS DA ANÁLISE
// ============================================
app.get('/analyze/status', (req, res) => {
  return res.json({
    ...analysisStatus,
    timestamp: new Date().toISOString()
  });
});

// Função para executar análise em background
async function analyzeAllConversationsBackground() {
  try {
    console.log('🔍 Iniciando análise de todas as conversas em background...');

    // Callback para atualizar o progresso
    const onProgress = (status) => {
      analysisStatus.progress = status.progress;
      analysisStatus.total = status.total;
      analysisStatus.current = status.current;
      console.log(`📊 Progresso: ${status.progress}% - ${status.current}`);
    };

    analysisStatus.current = 'Conectando ao Firebase...';
    const results = await aiAnalyzer.analyzeAllConversations(onProgress);

    analysisStatus.results = results;
    analysisStatus.progress = 100;
    analysisStatus.current = `Concluído! ${results.length} conversas analisadas`;
    analysisStatus.inProgress = false;

    console.log(`✅ Análise em background concluída. ${results.length} conversas analisadas`);

  } catch (error) {
    console.error('❌ Erro na análise em background:', error);
    analysisStatus.error = error.message;
    analysisStatus.inProgress = false;
    analysisStatus.current = 'Erro na análise';
  }
}

// ============================================
// ROTA: STATUS
// ============================================
app.get('/status', (req, res) => {
  return res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    firebase: 'conectado'
  });
});

// ============================================
// ROTA: RAIZ (HTML DASHBOARD)
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook`);
});
