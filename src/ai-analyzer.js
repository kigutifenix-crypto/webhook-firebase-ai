/**
 * Analisador de Conversas com Groq (IA GRATUITA)
 * Extrai informações das conversas e salva em Google Sheets
 */

const admin = require('firebase-admin');
const Groq = require('groq-sdk');
const { google } = require('googleapis');
require('dotenv').config();

// O app Firebase já é inicializado em src/server.js
// Apenas usamos o admin aqui para acessar o database
// sem reinicializar o Firebase App.

function getFirebaseDb() {
  if (admin.apps.length > 0) {
    return admin.database();
  } else {
    throw new Error('Firebase não inicializado. Certifique-se de que src/server.js inicializou o Firebase.');
  }
}

// Inicializar Groq (GRATUITO) - Lazy load
let groq = null;

function getGroqClient() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY não configurada. Configure a variável de ambiente GROQ_API_KEY no Railway.');
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// Inicializar Google Sheets
const sheets = google.sheets('v4');
const googleSheetsAuthOptions = {
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
};

if (process.env.GOOGLE_SHEETS_CREDENTIALS_JSON) {
  try {
    googleSheetsAuthOptions.credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
  } catch (error) {
    console.error('❌ GOOGLE_SHEETS_CREDENTIALS_JSON inválido:', error.message);
  }
} else if (process.env.GOOGLE_SHEETS_CREDENTIALS_FILE) {
  googleSheetsAuthOptions.keyFile = process.env.GOOGLE_SHEETS_CREDENTIALS_FILE;
}

const auth = new google.auth.GoogleAuth(googleSheetsAuthOptions);

// Campos a extrair
const FIELDS_TO_EXTRACT = [
  'cidade',
  'interesse',
  'produtos',
  'nome',
  'tipo',
  'data',
  'temperatura',
  'primeiro_vendedor',
  'vendedor_que_resolveu',
  'status',
  'score',
  'telefone',
  'categoria',
  'resumo',
  'data_criacao'
];

function parseDateValue(value) {
  if (!value) return null;
  const str = String(value).trim();

  if (/^\d{10}$/.test(str)) {
    return new Date(Number(str) * 1000);
  }
  if (/^\d{13}$/.test(str)) {
    return new Date(Number(str));
  }
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  return null;
}

function formatDateBR(value) {
  const date = parseDateValue(value);
  if (!date) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeCategory(value) {
  if (!value) return null;
  const str = String(value).trim().toLowerCase();
  if (/academ|st[úu]dio|clube/.test(str)) return 'Academia / Stúdio / Clube';
  if (/resid|pessoal/.test(str)) return 'Residencial / pessoal';
  if (/condom/.test(str)) return 'Condomínio';
  if (/parcer|fornec/.test(str)) return 'Parcerias / Fornecedores';
  if (/outro/.test(str)) return 'outros';
  return null;
}

function buildFallbackSummary(conversationText, metadata, analysisResult) {
  const lines = conversationText.split('\n\n').filter(Boolean);
  const firstLine = lines[0] || '';
  const secondLine = lines[1] || '';
  const interest = analysisResult.interesse || metadata.labels || 'interesse não identificado';
  const products = analysisResult.produtos || '';
  const category = analysisResult.categoria || analysisResult.tipo || 'Indefinido';
  const name = metadata.cliente_nome || 'Cliente';
  const phone = metadata.cliente_telefone ? `Telefone: ${metadata.cliente_telefone}` : '';

  let summary = `${name} busca ${interest}`;
  if (products) summary += ` para ${products}`;
  summary += ` (${category}).`;
  if (firstLine) summary += ` Primeira mensagem: ${firstLine.replace(/\s+/g, ' ').trim()}`;
  if (secondLine) summary += ` Seguimento: ${secondLine.replace(/\s+/g, ' ').trim()}`;
  if (phone) summary += ` ${phone}`;
  return summary.substring(0, 300).trim();
}

/**
 * Chamada ao Groq com retry exponencial para rate limiting
 */
async function callGroqWithRetry(messages, maxRetries = 5) {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await getGroqClient().chat.completions.create({
        messages,
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 512, // Reduzido de 1024 para economizar tokens
      });
    } catch (error) {
      lastError = error;
      
      // Verificar se é um erro de rate limit (429)
      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
        console.warn(`⚠️  Rate limit atingido. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Se não for rate limit, lançar o erro
      throw error;
    }
  }
  
  // Se chegou aqui, esgotou as tentativas
  throw lastError;
}

/**
 * Analisa uma conversa com Groq
 */
async function analyzeConversation(conversationId, conversationData) {
  // Montar o texto da conversa com diversos campos possíveis
  const messages = conversationData.messages || conversationData.messages_history || [];
  const conversationText = messages
    .map(m => {
      const senderName = m.sender?.name || m.author?.name || m.from || m.from_name || m.from?.name || 'Unknown';
      const content = m.content || m.body || m.text || m.message || m.message_text || '';
      return `${senderName}: ${content}`.trim();
    })
    .filter(line => line.length > 0)
    .join('\n\n');

  const conversationDate = conversationData.created_at || conversationData.first_reply_created_at || conversationData.received_at || conversationData.timestamp || null;
  const conversationCreatedDate = formatDateBR(conversationData.created_at || conversationData.received_at || conversationData.timestamp || conversationData.first_reply_created_at);

  const metadata = {
    cliente_nome: conversationData.sender?.name || null,
    cliente_telefone: conversationData.sender?.phone_number || null,
    cliente_email: conversationData.sender?.email || null,
    vendedor: conversationData.assignee?.name || null,
    status: conversationData.status || null,
    labels: Array.isArray(conversationData.labels) ? conversationData.labels.join(', ') : ''
  };

  const prompt = 'Analise a seguinte conversa e extraia APENAS um JSON com essas informações (pode estar em português ou inglês):\n' +
    '\nCONVERSA:\n' +
    conversationText + '\n\n' +
    'METADADOS:\n' +
    `Cliente nome: ${metadata.cliente_nome || 'não informado'}\n` +
    `Cliente telefone: ${metadata.cliente_telefone || 'não informado'}\n` +
    `Cliente email: ${metadata.cliente_email || 'não informado'}\n` +
    `Vendedor: ${metadata.vendedor || 'não informado'}\n` +
    `Status: ${metadata.status || 'não informado'}\n` +
    `Data de criação: ${conversationCreatedDate || 'não informado'}\n` +
    `Labels: ${metadata.labels || 'não informado'}\n\n` +
    'Retorne um JSON válido com EXATAMENTE esses campos (use null se não encontrar):\n' +
    '{\n' +
    '  "resumo": "resumo detalhado da conversa (máximo 300 caracteres) descrevendo: o assunto principal, o que o cliente quer, quais foram as soluções oferecidas ou acordadas",\n' +
    '  "cidade": "cidade mencionada ou null",\n' +
    '  "interesse": "interesse ou intenção do cliente, por exemplo: compra, orçamento, suporte, agendamento, reclamação, dúvida, etc",\n' +
    '  "produtos": "lista de produtos mencionados, separados por vírgula",\n' +
    '  "nome": "nome do cliente, preferencialmente usando o metadata sender.name ou pelo que foi identificado na conversa",\n' +
    '  "categoria": "EXATAMENTE uma dessas categorias: Academia / Stúdio / Clube | Residencial / pessoal | Condomínio | Parcerias / Fornecedores | outros | Indefinido",\n' +
    '  "data_criacao": "data de criação da conversa em formato DD/MM/YYYY",\n' +
    '  "primeiro_vendedor": "nome do primeiro vendedor ou atendente que começou a conversa",\n' +
    '  "vendedor_que_resolveu": "nome do vendedor ou agente que assumiu e resolveu o atendimento",\n' +
    '  "temperatura": "temperatura do lead: frio (sem interesse), morno (interesse potencial), ou quente (muito interessado)",\n' +
    '  "status": "status da conversa",\n' +
    '  "score": "score de satisfação (1-10) baseado no tom da conversa",\n' +
    '  "telefone": "telefone do lead, preferencialmente usando o metadata sender.phone_number"\n' +
    '}\n\n' +
    'Retorne APENAS o JSON, sem markdown ou explicações.';

  try {
    const chatCompletion = await callGroqWithRetry([
      {
        role: 'system',
        content: 'Você é um extrator de dados. Responda apenas com JSON válido e nada mais.'
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const responseText = chatCompletion.choices[0]?.message?.content || '';

    // Limpar resposta (remover markdown se houver)
    const jsonText = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const analysisData = JSON.parse(jsonText);

    const analysisResult = {
      conversationId,
      ...analysisData,
      analyzedAt: new Date().toISOString()
    };

    // Fallback para dados já presentes no webhook / metadata
    if ((!analysisResult.nome || analysisResult.nome === '') && conversationData.sender?.name) {
      analysisResult.nome = conversationData.sender.name;
    }
    if ((!analysisResult.telefone || analysisResult.telefone === '') && conversationData.sender?.phone_number) {
      analysisResult.telefone = conversationData.sender.phone_number;
    }
    if ((!analysisResult.primeiro_vendedor || analysisResult.primeiro_vendedor === '') && conversationData.assignee?.name) {
      analysisResult.primeiro_vendedor = conversationData.assignee.name;
    }
    if ((!analysisResult.vendedor_que_resolveu || analysisResult.vendedor_que_resolveu === '') && conversationData.assignee?.name) {
      analysisResult.vendedor_que_resolveu = conversationData.assignee.name;
    }
    if ((!analysisResult.status || analysisResult.status === '') && conversationData.status) {
      analysisResult.status = conversationData.status;
    }
    if ((!analysisResult.data_criacao || analysisResult.data_criacao === '') && conversationCreatedDate) {
      analysisResult.data_criacao = conversationCreatedDate;
    }
    if ((!analysisResult.data || analysisResult.data === '') && conversationDate) {
      const dateFormatted = formatDateBR(conversationDate);
      if (dateFormatted) {
        analysisResult.data = dateFormatted;
      }
    }

    // Validar e corrigir categoria para ser apenas uma das opções definidas
    const VALID_CATEGORIES = [
      'Academia / Stúdio / Clube',
      'Residencial / pessoal',
      'Condomínio',
      'Parcerias / Fornecedores',
      'outros',
      'Indefinido'
    ];

    if ((!analysisResult.categoria || !VALID_CATEGORIES.includes(analysisResult.categoria)) && (!analysisResult.tipo || !VALID_CATEGORIES.includes(analysisResult.tipo))) {
      analysisResult.categoria = 'Indefinido';
    } else if (!analysisResult.categoria && VALID_CATEGORIES.includes(analysisResult.tipo)) {
      analysisResult.categoria = analysisResult.tipo;
    }
    if (analysisResult.categoria && !VALID_CATEGORIES.includes(analysisResult.categoria)) {
      const normalized = normalizeCategory(analysisResult.categoria) || normalizeCategory(analysisResult.tipo);
      analysisResult.categoria = normalized || 'Indefinido';
    }

    if ((!analysisResult.interesse || analysisResult.interesse === '') && Array.isArray(conversationData.labels) && conversationData.labels.length > 0) {
      analysisResult.interesse = conversationData.labels.join(', ');
    }
    if ((!analysisResult.resumo || analysisResult.resumo === '') || analysisResult.resumo.length < 20) {
      analysisResult.resumo = buildFallbackSummary(conversationText, metadata, analysisResult);
    }
    if (analysisResult.resumo && analysisResult.resumo.length > 300) {
      analysisResult.resumo = analysisResult.resumo.substring(0, 300).trim();
    }

    return analysisResult;
  } catch (error) {
    // Verificar se é erro de rate limit
    const isRateLimit = error.status === 429 || error.code === 'rate_limit_exceeded' || error.message?.includes('rate_limit');
    if (isRateLimit) {
      console.error(`❌ Erro ao analisar conversa ${conversationId}: Rate limit do Groq atingido. ${error.message}`);
    } else {
      console.error(`❌ Erro ao analisar conversa ${conversationId}:`, error.message);
    }
    
    return {
      conversationId,
      nome: conversationData.sender?.name || '',
      telefone: conversationData.sender?.phone_number || '',
      categoria: 'Indefinido',
      resumo: buildFallbackSummary(conversationText, metadata, {}),
      data_criacao: conversationCreatedDate || '',
      analyzedAt: new Date().toISOString(),
      erro: error.message
    };
  }
}

/**
 * Salva dados analisados em Google Sheets
 */
async function saveToGoogleSheets(spreadsheetId, sheetName, analysisResults) {
  const authClient = await auth.getClient();

  // Preparar linhas para planilha no formato exato das fotos
  const headers = [
    'Data de Criação',
    'Nome do Cliente',
    'Primeiro Vendedor',
    'Vendedor que Resolveu',
    'Telefone',
    'Categoria',
    'Resumo da Conversa'
  ];

  const uniqueResults = Array.from(new Map(analysisResults.map(result => [result.conversationId, result])).values());
  const rows = uniqueResults.map(result => [
    result.data_criacao || '',
    result.nome || '',
    result.primeiro_vendedor || '',
    result.vendedor_que_resolveu || '',
    result.telefone || '',
    result.categoria || result.tipo || 'Indefinido',
    result.resumo || ''
  ]);

  const values = [headers, ...rows];

  try {
    await sheets.spreadsheets.values.clear({
      auth: authClient,
      spreadsheetId,
      range: `${sheetName}!A1:G1000`
    });

    await sheets.spreadsheets.values.update(
      {
        auth: authClient,
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values }
      }
    );
    console.log(`✅ ${rows.length} linhas salvas em Google Sheets`);
  } catch (error) {
    console.error('Erro ao salvar em Google Sheets:', error.message);
  }
}

/**
 * Analisa todas as conversas do Firebase
 */
async function analyzeAllConversations() {
  console.log('🔍 Iniciando análise de conversas...\n');

  const db = getFirebaseDb();
  const conversationsRef = db.ref('conversations');

  try {
    const snapshot = await conversationsRef.get();
    if (!snapshot.exists()) {
      console.log('Nenhuma conversa encontrada no Firebase');
      return []; // Retornar array vazio em vez de undefined
    }

    const conversations = snapshot.val();
    const analysisResults = [];

    console.log(`📊 Encontradas ${Object.keys(conversations).length} conversas\n`);

    // Analisar cada conversa
    for (const [convId, convData] of Object.entries(conversations)) {
      console.log(`⏳ Analisando conversa ${convId}...`);
      const analysis = await analyzeConversation(convId, convData);
      analysisResults.push(analysis);

      // Delay aumentado para evitar rate limiting (2 segundos entre análises)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Salvar em Google Sheets
    if (process.env.GOOGLE_SHEETS_ID) {
      console.log('\n💾 Salvando em Google Sheets...');
      await saveToGoogleSheets(
        process.env.GOOGLE_SHEETS_ID,
        process.env.GOOGLE_SHEETS_NAME || 'Análises',
        analysisResults
      );
    }

    console.log('\n✅ Análise concluída!');
    return analysisResults;

  } catch (error) {
    console.error('Erro ao analisar conversas:', error.message);
    throw error; // Relançar o erro para que seja tratado no servidor
  }
}

// Exportar funções
module.exports = {
  analyzeConversation,
  saveToGoogleSheets,
  analyzeAllConversations
};

// Executar se chamado diretamente
if (require.main === module) {
  analyzeAllConversations().catch(console.error);
}