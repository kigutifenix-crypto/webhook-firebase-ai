// ============================================
// INSTRUÇÕES PARA CONFIGURAR IA GRATUITA
// ============================================
// OPÇÃO 1: HUGGING FACE (RECOMENDADO - MAIS FÁCIL)
// 1. Acesse: https://huggingface.co/settings/tokens
// 2. Crie uma conta gratuita (não precisa cartão)
// 3. Clique em "New token"
// 4. Nome: "CRM Bot"
// 5. Tipo: "Read" (gratuito)
// 6. Copie o token gerado
// 7. Cole no campo HUGGINGFACE_API_KEY abaixo
// 8. Execute: testarHuggingFace() para testar
//
// OPÇÃO 2: OPENROUTER (MAIS MODELOS)
// 1. Acesse: https://openrouter.ai/keys
// 2. Crie conta gratuita (não precisa cartão)
// 3. Copie a chave
// 4. Cole no campo OPENROUTER_API_KEY
// 5. Execute: testarOpenRouter() para testar
//
// O SCRIPT TENTA HUGGING FACE PRIMEIRO, DEPOIS OPENROUTER
// SE AMBAS FALHAREM, USA CLASSIFICAÇÃO MANUAL
// ============================================

const CONFIG = {
  SHEET_ID: '1t1LN3dS5RvMhQeGREy-RORa9vc7iLWcg8VZ5jqjfE5E', // Cole seu Sheet ID aqui
  SHEET_NAME: 'Leads',
  SHEET_HISTORICO: 'Historico_Mensagens', // Aba para armazenar histórico
  
  // OPÇÃO 1: HUGGING FACE (GRATUITO - RECOMENDADO)
  HUGGINGFACE_API_KEY: 'YOUR_HUGGINGFACE_API_KEY', // Cole seu token Hugging Face aqui
  HUGGINGFACE_MODEL: 'microsoft/DialoGPT-medium', // Modelo gratuito
  
  // OPÇÃO 2: OPENROUTER (GRATUITO - MAIS MODELOS)
  OPENROUTER_API_KEY: 'YOUR_OPENROUTER_API_KEY', // Cole sua chave OpenRouter aqui
  OPENROUTER_MODEL: 'meta-llama/llama-3.2-3b-instruct:free', // Modelo gratuito
  
  CACHE_EXPIRATION_SECONDS: 3600,
  TIPOS: ['academia', 'residencial', 'indefinido', 'fornecedor', 'venda', 'outros', 'condominio'],
  INTERESSES: ['orçamento', 'compra']
};

// ============================================
// HANDLER PRINCIPAL
// ============================================
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return construirResponse(400, 'Erro: Payload vazio');
    }

    const dados = JSON.parse(e.postData.contents);
    
    if (!validarJSON(dados)) {
      return construirResponse(400, 'Erro: JSON inválido');
    }

    // Extrair conversation_id como chave única
    const conversation_id = dados.id;
    const telefone = dados.meta?.sender?.phone_number;
    const nomeSender = dados.meta?.sender?.name;
    const vendedor = dados.meta?.assignee?.name || 'Não atribuído';

    if (!telefone || !conversation_id) {
      return construirResponse(400, 'Erro: Telefone ou ID de conversa não encontrado');
    }

    // Extrair a mensagem atual (sempre primeira do array)
    const mensagemAtual = dados.messages && dados.messages.length > 0 ? dados.messages[0] : null;
    
    if (!mensagemAtual) {
      return construirResponse(400, 'Erro: Nenhuma mensagem encontrada');
    }

    // Armazenar mensagem no histórico
    armazenarMensagemHistorico(conversation_id, nomeSender, telefone, mensagemAtual);

    // Recuperar histórico COMPLETO da conversa
    const textoConcatenado = recuperarHistoricoCompleto(conversation_id);

    // Analisar com IA
    let classificacao = null;
    try {
      classificacao = analisarComIA(textoConcatenado);
    } catch (erro) {
      Logger.log('Erro IA: ' + erro);
      classificacao = fallbackClassificacao(textoConcatenado);
    }

    // Preparar dados do lead
    const dadosLead = {
      nome: nomeSender,
      tipo: classificacao.tipo || '',
      cidade: classificacao.cidade || '',
      interesse: classificacao.interesse || '',
      produtos: (classificacao.produtos || []).join(', '),
      telefone: telefone,
      email: classificacao.email || '',
      temperatura: classificacao.temperatura || 'Frio',
      vendedor: vendedor,
      score: classificacao.score || 0,
      ultimaMensagem: textoConcatenado.substring(0, 100)
    };

    // Salvar ou atualizar
    salvarOuAtualizarLead(dadosLead);

    return construirResponse(200, 'OK');

  } catch (erro) {
    Logger.log('ERRO geral: ' + erro);
    return construirResponse(500, 'Erro interno: ' + erro.toString());
  }
}

// ============================================
// SALVAR OU ATUALIZAR LEAD (UPSERT)
// ============================================
function salvarOuAtualizarLead(dadosLead) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      // Criar aba se não existir
      const novaSheet = ss.insertSheet(CONFIG.SHEET_NAME);
      criarlinhaCabecalho(novaSheet);
      sheet = novaSheet;
    }

    const dadosSheet = sheet.getDataRange().getValues();
    let linhaExistente = encontrarLead(dadosLead.telefone, dadosSheet);

    if (linhaExistente > 0) {
      // ATUALIZAR linha existente
      const dados_atuais = dadosSheet[linhaExistente - 1];

      // Aplicar merge em campos específicos
      const nome = merge(dados_atuais[0], dadosLead.nome);
      const tipo = mergeTipo(dados_atuais[1], dadosLead.tipo);
      const cidade = merge(dados_atuais[2], dadosLead.cidade);
      const interesse = merge(dados_atuais[3], dadosLead.interesse);
      const produtos = merge(dados_atuais[4], dadosLead.produtos);
      const telefone = dados_atuais[5]; // Nunca muda
      const email = merge(dados_atuais[6], dadosLead.email);
      const dataAtualizacao = new Date();
      const temperatura = merge(dados_atuais[8], dadosLead.temperatura);
      const vendedor = merge(dados_atuais[9], dadosLead.vendedor);
      const etapa = determinarEtapaFunil(interesse);
      const score = merge(dados_atuais[11], dadosLead.score);
      const ultimaMensagem = dadosLead.ultimaMensagem;
      const interacoes = (parseInt(dados_atuais[13] || 0) || 0) + 1;

      const linhaAtualizada = [
        nome, tipo, cidade, interesse, produtos, telefone, email, 
        dataAtualizacao, temperatura, vendedor, etapa, score, ultimaMensagem, interacoes
      ];

      sheet.getRange(linhaExistente, 1, 1, 14).setValues([linhaAtualizada]);

    } else {
      // CRIAR nova linha
      const etapa = determinarEtapaFunil(dadosLead.interesse);

      const novaLinha = [
        dadosLead.nome,
        dadosLead.tipo,
        dadosLead.cidade,
        dadosLead.interesse,
        dadosLead.produtos,
        dadosLead.telefone,
        dadosLead.email,
        new Date(),
        dadosLead.temperatura,
        dadosLead.vendedor,
        etapa,
        dadosLead.score,
        dadosLead.ultimaMensagem,
        1 // primeira interação
      ];

      sheet.appendRow(novaLinha);
    }

  } catch (erro) {
    Logger.log('ERRO ao salvar lead: ' + erro);
    throw erro;
  }
}

// ============================================
// ANALISAR COM IA (MÚLTIPLAS OPÇÕES GRATUITAS)
// ============================================
function analisarComIA(texto) {
  try {
    // Tentar Hugging Face primeiro (mais confiável)
    if (CONFIG.HUGGINGFACE_API_KEY) {
      try {
        return analisarComHuggingFace(texto);
      } catch (erro) {
        Logger.log('Hugging Face falhou, tentando OpenRouter: ' + erro);
      }
    }
    
    // Tentar OpenRouter se Hugging Face falhar
    if (CONFIG.OPENROUTER_API_KEY) {
      try {
        return analisarComOpenRouter(texto);
      } catch (erro) {
        Logger.log('OpenRouter falhou: ' + erro);
      }
    }
    
    // Se nenhuma API funcionar, usar fallback
    throw new Error('Nenhuma API de IA configurada ou funcionando');
    
  } catch (erro) {
    Logger.log('Erro geral IA: ' + erro);
    throw erro;
  }
}

// ============================================
// HUGGING FACE (GRATUITO - RECOMENDADO)
// ============================================
function analisarComHuggingFace(texto) {
  const prompt = `Analise esta conversa e extraia informações em JSON:

Conversa: ${texto}

Retorne apenas JSON neste formato:
{
  "tipo": "",
  "interesse": "orçamento" ou "compra" ou "",
  "produtos": ["produto1", "produto2"],
  "temperatura": "Frio" ou "Morno" ou "Quente" ou "Muito Quente",
  "score": numero de 0 a 10,
  "cidade": "",
  "email": ""
}

Para tipo, só coloque se mencionado explicitamente: academia, residencial, fornecedor, condominio, venda.
Para interesse, só "orçamento" ou "compra".
Para temperatura baseada no score: 0-3=Frio, 4-5=Morno, 6-7=Quente, 8-10=Muito Quente.`;

  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 300,
      temperature: 0.1,
      return_full_text: false
    }
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${CONFIG.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(`https://api-inference.huggingface.co/models/${CONFIG.HUGGINGFACE_MODEL}`, options);
  const resultado = JSON.parse(response.getContentText());

  if (resultado.error) {
    throw new Error('Hugging Face Error: ' + resultado.error);
  }

  // Extrair JSON da resposta
  let respostaTexto = Array.isArray(resultado) ? resultado[0].generated_text : resultado.generated_text;
  
  // Tentar encontrar JSON na resposta
  const jsonMatch = respostaTexto.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    respostaTexto = jsonMatch[0];
  }

  const classificacao = JSON.parse(respostaTexto);

  return {
    tipo: String(classificacao.tipo || '').toLowerCase().trim().substring(0, 50) || '',
    interesse: validarCampo(String(classificacao.interesse || '').toLowerCase(), CONFIG.INTERESSES),
    produtos: Array.isArray(classificacao.produtos) ? classificacao.produtos.map(p => String(p).trim()).filter(p => p.length > 0) : [],
    temperatura: classificarTemperatura(classificacao.temperatura || ''),
    score: Math.min(10, Math.max(0, Number(classificacao.score || 5))),
    cidade: String(classificacao.cidade || '').substring(0, 100),
    email: String(classificacao.email || '').substring(0, 100)
  };
}

// ============================================
// OPENROUTER (GRATUITO - ALTERNATIVA)
// ============================================
function analisarComOpenRouter(texto) {
  const prompt = `Analise esta conversa e extraia informações em JSON:

Conversa: ${texto}

Retorne apenas JSON neste formato:
{
  "tipo": "",
  "interesse": "orçamento" ou "compra" ou "",
  "produtos": ["produto1", "produto2"],
  "temperatura": "Frio" ou "Morno" ou "Quente" ou "Muito Quente",
  "score": numero de 0 a 10,
  "cidade": "",
  "email": ""
}

Para tipo, só coloque se mencionado explicitamente: academia, residencial, fornecedor, condominio, venda.
Para interesse, só "orçamento" ou "compra".
Para temperatura baseada no score: 0-3=Frio, 4-5=Morno, 6-7=Quente, 8-10=Muito Quente.`;

  const payload = {
    model: CONFIG.OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 300
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://script.google.com',
      'X-Title': 'CRM WhatsApp Bot'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', options);
  const resultado = JSON.parse(response.getContentText());

  if (resultado.error) {
    throw new Error('OpenRouter Error: ' + resultado.error.message);
  }

  let conteudo = resultado.choices[0].message.content.trim();
  
  // Tentar extrair JSON se estiver envolvido em markdown
  conteudo = conteudo.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  const classificacao = JSON.parse(conteudo);

  return {
    tipo: String(classificacao.tipo || '').toLowerCase().trim().substring(0, 50) || '',
    interesse: validarCampo(String(classificacao.interesse || '').toLowerCase(), CONFIG.INTERESSES),
    produtos: Array.isArray(classificacao.produtos) ? classificacao.produtos.map(p => String(p).trim()).filter(p => p.length > 0) : [],
    temperatura: classificarTemperatura(classificacao.temperatura || ''),
    score: Math.min(10, Math.max(0, Number(classificacao.score || 5))),
    cidade: String(classificacao.cidade || '').substring(0, 100),
    email: String(classificacao.email || '').substring(0, 100)
  };
}

// ============================================
// FALLBACK CLASSIFICAÇÃO (SEM IA)
// ============================================
function fallbackClassificacao(texto) {
  const textoLower = texto.toLowerCase();

  // Detectar tipo baseado em texto (deixar IA definir)
  let tipo = 'não identificado';
  
  // Só detectar se houver menção explícita
  if (textoLower.includes('academia') || textoLower.includes('estúdio') || textoLower.includes('ginásio')) {
    tipo = 'academia';
  } else if (textoLower.includes('residencial') || textoLower.includes('casa') || textoLower.includes('apartamento')) {
    tipo = 'residencial';
  } else if (textoLower.includes('fornecedor') || textoLower.includes('parceiro') || textoLower.includes('distribuidor')) {
    tipo = 'fornecedor';
  } else if (textoLower.includes('condomínio') || textoLower.includes('condominio')) {
    tipo = 'condominio';
  } else if (textoLower.includes('venda') || textoLower.includes('troca') || textoLower.includes('recompra')) {
    tipo = 'venda';
  }
  
  let interesse = '';
  if (textoLower.includes('orçamento') || textoLower.includes('preço')) {
    interesse = 'orçamento';
  } else if (textoLower.includes('compra') || textoLower.includes('comprar')) {
    interesse = 'compra';
  }

  // Extrair produtos mencionados dinamicamente (palavras com tamanho > 3)
  const palavras = textoLower.match(/\b\w{3,}\b/g) || [];
  const palavrasUnicas = [...new Set(palavras)];
  const produtos = palavrasUnicas.slice(0, 5); // Limitar a 5 produtos

  // Detectar email simples (padrão básico)
  const regexEmail = /[\w.-]+@[\w.-]+\.\w+/g;
  const emails = texto.match(regexEmail) || [];
  const email = emails.length > 0 ? emails[0] : '';

  // Detectar cidades comuns (exemplo básico)
  const cidades = ['são paulo', 'sp', 'rio de janeiro', 'rj', 'belo horizonte', 'minas gerais'];
  let cidade = '';
  for (let c of cidades) {
    if (textoLower.includes(c)) {
      cidade = c;
      break;
    }
  }

  const score = interesse ? 7 : 4;
  const temperatura = classificarTemperaturaPorScore(score);

  return {
    tipo,
    interesse,
    produtos,
    temperatura,
    score,
    cidade,
    email
  };
}

// ============================================
// MERGE DE VALORES
// ============================================
function merge(valorAntigo, valorNovo) {
  // Se novo valor está vazio → manter valor antigo
  if (valorNovo === null || valorNovo === undefined || valorNovo === '') {
    return valorAntigo || '';
  }
  // Se novo valor tem conteúdo → atualizar
  return valorNovo;
}

// ============================================
// MERGE ESPECÍFICO PARA TIPO
// ============================================
function mergeTipo(valorAntigo, valorNovo) {
  // Se novo valor é "não identificado" ou vazio → manter valor antigo
  if (!valorNovo || valorNovo === 'não identificado' || valorNovo === '') {
    return valorAntigo || '';
  }
  
  // Se antigo é vazio ou "não identificado" → usar novo valor
  if (!valorAntigo || valorAntigo === 'não identificado') {
    return valorNovo;
  }
  
  // Se ambos têm valores válidos → manter valor antigo (não sobrescrever)
  return valorAntigo;
}

// ============================================
// ENCONTRAR LEAD POR TELEFONE
// ============================================
function encontrarLead(telefone, dadosSheet) {
  try {
    // A partir da linha 2 (pular cabeçalho)
    for (let i = 1; i < dadosSheet.length; i++) {
      if (dadosSheet[i][5] && String(dadosSheet[i][5]).trim() === String(telefone).trim()) { // Telefone está na coluna 6 (índice 5)
        return i + 1; // Retorna número da linha no sheet
      }
    }
    return -1; // Não encontrado
  } catch (erro) {
    Logger.log('Erro ao encontrar lead: ' + erro);
    return -1;
  }
}

// ============================================
// ARMAZENAR MENSAGEM NO HISTÓRICO
// ============================================
function armazenarMensagemHistorico(conversation_id, nome, telefone, mensagem) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_HISTORICO);

    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_HISTORICO);
      sheet.appendRow(['Conversation_ID', 'Telefone', 'Nome', 'Sender_Type', 'Conteúdo', 'Data']);
    }

    // Determinar tipo de sender
    const sender_type = mensagem.sender_type === 'Contact' ? 'Cliente' : 'Agente';
    const timestamp = new Date();

    sheet.appendRow([
      conversation_id,
      telefone,
      nome,
      sender_type,
      mensagem.content,
      timestamp
    ]);

  } catch (erro) {
    Logger.log('Erro ao armazenar histórico: ' + erro);
  }
}

// ============================================
// RECUPERAR HISTÓRICO COMPLETO
// ============================================
function recuperarHistoricoCompleto(conversation_id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_HISTORICO);

    if (!sheet) {
      return '';
    }

    const dados = sheet.getDataRange().getValues();
    let historico = [];

    // Iterar pelas linhas (começar em 1 para pular cabeçalho)
    for (let i = 1; i < dados.length; i++) {
      if (dados[i][0] === conversation_id) { // Coluna 0 é Conversation_ID
        const sender = dados[i][3]; // Coluna 3 é Sender_Type
        const conteudo = dados[i][4]; // Coluna 4 é Conteúdo
        historico.push(`${sender}: ${conteudo}`);
      }
    }

    return historico.join('\n');

  } catch (erro) {
    Logger.log('Erro ao recuperar histórico: ' + erro);
    return '';
  }
}

// ============================================
// DETERMINAR ETAPA DO FUNIL
// ============================================
function determinarEtapaFunil(interesse) {
  if (interesse === 'compra') {
    return 'Fechado';
  } else if (interesse === 'orçamento') {
    return 'Qualificado';
  } else if (interesse === 'atendente' || interesse === 'contato') {
    return 'Contato';
  } else {
    return 'Novo';
  }
}

// ============================================
// CLASSIFICAR TEMPERATURA (TEXTO)
// ============================================
function classificarTemperatura(temperaturaTexto) {
  const tempLower = String(temperaturaTexto || '').toLowerCase().trim();
  
  if (tempLower.includes('muito quente') || tempLower.includes('quente')) {
    return 'Muito Quente';
  } else if (tempLower.includes('quente')) {
    return 'Quente';
  } else if (tempLower.includes('morno') || tempLower.includes('morna')) {
    return 'Morno';
  } else {
    return 'Frio';
  }
}

// ============================================
// CLASSIFICAR TEMPERATURA POR SCORE
// ============================================
function classificarTemperaturaPorScore(score) {
  const scoreNum = Number(score) || 0;
  
  if (scoreNum >= 8) {
    return 'Muito Quente';
  } else if (scoreNum >= 6) {
    return 'Quente';
  } else if (scoreNum >= 4) {
    return 'Morno';
  } else {
    return 'Frio';
  }
}

// ============================================
// VALIDAR JSON (Nova estrutura Toolzz)
// ============================================
function validarJSON(dados) {
  try {
    return dados && 
           dados.id && 
           dados.event && 
           dados.meta && 
           dados.meta.sender && 
           dados.meta.sender.phone_number &&
           dados.messages &&
           Array.isArray(dados.messages) &&
           dados.messages.length > 0;
  } catch (erro) {
    return false;
  }
}

// ============================================
// VALIDAR CAMPO CONTRA LISTA
// ============================================
function validarCampo(valor, lista) {
  for (let item of lista) {
    if (valor.includes(item)) {
      return item;
    }
  }
  return '';
}



// ============================================
// CRIAR LINHA CABEÇALHO
// ============================================
function criarlinhaCabecalho(sheet) {
  const cabecalho = [
    'Nome',
    'Tipo',
    'Cidade',
    'Interesse',
    'Produtos',
    'Telefone',
    'Email',
    'Data Última Atualização',
    'Temperatura',
    'Vendedor',
    'Etapa',
    'Score',
    'Última Mensagem',
    'Interações'
  ];
  sheet.appendRow(cabecalho);
}

// ============================================
// CONSTRUIR RESPONSE
// ============================================
function construirResponse(statusCode, mensagem) {
  try {
    const response = {
      status: statusCode === 200 ? 'OK' : 'ERROR',
      message: mensagem,
      timestamp: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    Logger.log('Erro ao construir response: ' + erro);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ERROR',
        message: 'Erro ao processar resposta'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// DEPLOY TEST (para testar localmente)
// ============================================
function testarWebhook() {
  const payloadTeste = {
    "id": 4312,
    "inbox_id": 2478,
    "event": "automation_event.message_created",
    "channel": "Channel::Api",
    "messages": [
      {
        "id": 16702805,
        "content": "Um projeto mais completo",
        "sender_type": "Contact",
        "sender_id": 597190,
        "created_at": 1777298977,
        "status": "sent"
      }
    ],
    "meta": {
      "sender": {
        "id": 597190,
        "name": "Romario Rodrigues",
        "phone_number": "+559193378426",
        "type": "contact"
      },
      "assignee": {
        "id": 3718,
        "name": "Erika Santos de Souza",
        "type": "user"
      }
    }
  };

  const e = {
    postData: {
      contents: JSON.stringify(payloadTeste)
    }
  };

  const resultado = doPost(e);
  Logger.log('Resultado Teste: ' + resultado.getContent());
}

// ============================================
// TESTAR TODAS AS OPÇÕES DE IA (RECOMENDADO)
// ============================================
function testarTodasAsIAs() {
  Logger.log('🔍 Testando todas as opções de IA gratuita...');
  Logger.log('');
  
  let funcionando = false;
  
  // Testar Hugging Face
  if (CONFIG.HUGGINGFACE_API_KEY) {
    Logger.log('🤖 Testando Hugging Face...');
    try {
      testarHuggingFace();
      funcionando = true;
    } catch (erro) {
      Logger.log('❌ Hugging Face falhou');
    }
  } else {
    Logger.log('⚠️  Hugging Face não configurado (recomendado)');
  }
  
  Logger.log('');
  
  // Testar OpenRouter
  if (CONFIG.OPENROUTER_API_KEY) {
    Logger.log('🚀 Testando OpenRouter...');
    try {
      testarOpenRouter();
      funcionando = true;
    } catch (erro) {
      Logger.log('❌ OpenRouter falhou');
    }
  } else {
    Logger.log('⚠️  OpenRouter não configurado');
  }
  
  Logger.log('');
  
  if (funcionando) {
    Logger.log('✅ Pelo menos uma IA está funcionando!');
    Logger.log('🎉 Seu CRM está pronto para uso!');
  } else {
    Logger.log('❌ Nenhuma IA configurada ou funcionando');
    Logger.log('📝 Configure pelo menos uma opção gratuita:');
    Logger.log('   - Hugging Face: https://huggingface.co/settings/tokens');
    Logger.log('   - OpenRouter: https://openrouter.ai/keys');
  }
}

// ============================================
// TESTAR CONEXÃO COM HUGGING FACE (GRATUITO)
// ============================================
function testarHuggingFace() {
  try {
    if (!CONFIG.HUGGINGFACE_API_KEY) {
      Logger.log('❌ HUGGINGFACE_API_KEY não configurada!');
      Logger.log('📝 Siga as instruções no topo do arquivo para obter seu token gratuito.');
      Logger.log('🔗 https://huggingface.co/settings/tokens');
      return;
    }

    const prompt = 'Olá! Responda apenas com "OK" se você está funcionando.';

    const payload = {
      inputs: prompt,
      parameters: {
        max_new_tokens: 50,
        temperature: 0.1,
        return_full_text: false
      }
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${CONFIG.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(`https://api-inference.huggingface.co/models/${CONFIG.HUGGINGFACE_MODEL}`, options);
    const resultado = JSON.parse(response.getContentText());

    if (resultado.error) {
      Logger.log('❌ Erro na API Hugging Face: ' + resultado.error);
      return;
    }

    const resposta = Array.isArray(resultado) ? resultado[0].generated_text : resultado.generated_text;
    Logger.log('✅ Hugging Face funcionando! Resposta: ' + resposta.trim());
    Logger.log('🎉 Sua IA gratuita está pronta para uso!');

  } catch (erro) {
    Logger.log('❌ Erro ao testar Hugging Face: ' + erro);
  }
}

// ============================================
// TESTAR CONEXÃO COM OPENROUTER (GRATUITO)
// ============================================
function testarOpenRouter() {
  try {
    if (!CONFIG.OPENROUTER_API_KEY) {
      Logger.log('❌ OPENROUTER_API_KEY não configurada!');
      Logger.log('📝 Siga as instruções no topo do arquivo para obter sua chave gratuita.');
      Logger.log('🔗 https://openrouter.ai/keys');
      return;
    }

    const payload = {
      model: CONFIG.OPENROUTER_MODEL,
      messages: [
        {
          role: "user",
          content: "Olá! Responda apenas com 'OK' se você está funcionando."
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://script.google.com',
        'X-Title': 'CRM WhatsApp Bot'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', options);
    const resultado = JSON.parse(response.getContentText());

    if (resultado.error) {
      Logger.log('❌ Erro na API OpenRouter: ' + resultado.error.message);
      return;
    }

    const resposta = resultado.choices[0].message.content.trim();
    Logger.log('✅ OpenRouter funcionando! Resposta: ' + resposta);
    Logger.log('🎉 Sua IA gratuita está pronta para uso!');

  } catch (erro) {
    Logger.log('❌ Erro ao testar OpenRouter: ' + erro);
  }
}

// ============================================
// LIMPAR DUPLICATAS (executar manualmente)
// ============================================
function limparDuplicatas() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      Logger.log('Aba Leads não encontrada');
      return;
    }

    const dados = sheet.getDataRange().getValues();
    const telefonesUnicos = new Set();
    const linhasParaDeletar = [];

    // Começar da linha 1 (pular cabeçalho)
    for (let i = 1; i < dados.length; i++) {
      const telefone = String(dados[i][5] || '').trim(); // Coluna F (índice 5)
      
      if (telefone) {
        if (telefonesUnicos.has(telefone)) {
          // Já existe, marcar para deletar
          linhasParaDeletar.push(i + 1); // +1 porque sheet é 1-indexed
        } else {
          telefonesUnicos.add(telefone);
        }
      }
    }

    // Deletar linhas duplicadas (do final para o início para não afetar índices)
    linhasParaDeletar.reverse().forEach(linha => {
      sheet.deleteRow(linha);
    });

    Logger.log(`Removidas ${linhasParaDeletar.length} linhas duplicadas`);

  } catch (erro) {
    Logger.log('Erro ao limpar duplicatas: ' + erro);
  }
}
