#!/usr/bin/env node

/**
 * Setup para usar Google Gemini + Google Sheets com as conversas
 * Instruções passo a passo
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║        SETUP: IA para Analisar Conversas (Groq - GRATUITO)     ║
╚════════════════════════════════════════════════════════════════╝

Para usar a IA e salvar em Google Sheets automaticamente, siga:

═══════════════════════════════════════════════════════════════
PASSO 1: Obter chave API do Groq (GRATUITA)
═══════════════════════════════════════════════════════════════

1. Acesse: https://console.groq.com/keys
2. Clique em "Create API Key"
3. Copie a chave gerada
4. Adicione no seu .env:
   GROQ_API_KEY=sua_chave_aqui

═══════════════════════════════════════════════════════════════
PASSO 2: Configurar Google Sheets (Opcional - para salvar dados)
═══════════════════════════════════════════════════════════════

**IMPORTANTE: Use "Dados do Aplicativo" (Service Account)**

Para este sistema automatizado, você deve usar **Service Account** (dados do aplicativo), não dados do usuário:

**Por que Service Account?**
✅ Funciona automaticamente sem login do usuário
✅ Pode ser executado 24/7 sem interação
✅ Mais seguro para aplicações server-side
✅ Permissões consistentes

**Como configurar:**

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto (ou use existente)
3. **ATIVAR APIs (passo crucial):**
   - Menu lateral: "APIs e Serviços" → "Biblioteca"
   - PROCURE por "Google Sheets API" → Clique → "ATIVAR"
   - PROCURE por "Google Drive API" → Clique → "ATIVAR"
4. Vá para "Credenciais" → "Criar Credencial" → "Chave de Conta de Serviço"
5. Dê um nome (ex: "toolz-webhook-bot")
6. Clique em "Criar e Continuar"
7. Na aba "Chaves", clique "Adicionar Chave" → "Criar nova chave" → JSON
8. O arquivo JSON será baixado automaticamente
9. Renomeie para: `google-credentials.json`
10. Coloque na pasta raiz do projeto
11. Adicione no seu .env:
    ```
    GOOGLE_SHEETS_CREDENTIALS_FILE=./google-credentials.json
    GOOGLE_SHEETS_ID=id-da-sua-planilha
    GOOGLE_SHEETS_NAME=Análises
    GROQ_MODEL=llama-3.1-8b-instant
    ```

> Se seu modelo atual estiver deprecado, use `llama-3.1-8b-instant` como padrão.

12. **IMPORTANTE:** Compartilhe a planilha com o email da Service Account
    - Abra sua planilha Google Sheets
    - Clique "Compartilhar"
    - Cole o email que está no arquivo JSON (campo "client_email")
    - Dê permissão de "Editor"

═══════════════════════════════════════════════════════════════
PASSO 3: Instalar dependências
═══════════════════════════════════════════════════════════════

npm install

═══════════════════════════════════════════════════════════════
PASSO 4: Usar o analisador
═══════════════════════════════════════════════════════════════

# Analisar todas as conversas (depois que tiver dados no Firebase)
node src/ai-analyzer.js

Resultado:
✅ Analisa cada conversa com Groq (GRATUITO)
✅ Extrai: Cidade, Interesse, Produtos, Nome, Tipo, Data, etc
✅ Calcula Score de satisfação (1-5)
✅ Salva automaticamente em Google Sheets

═══════════════════════════════════════════════════════════════
PASSO 5: Automatizar análise (Opcional)
═══════════════════════════════════════════════════════════════

Para analisar automaticamente quando novos webhooks chegam:

// Dentro do src/server.js, após salvar no Firebase:
const aiAnalyzer = require('./ai-analyzer');
setTimeout(() => aiAnalyzer.analyzeConversation(convId, dados), 2000);

═══════════════════════════════════════════════════════════════
PRÓXIMAS AÇÕES
═══════════════════════════════════════════════════════════════

1. Obtenha a chave Groq → https://console.groq.com/keys
2. Adicione no .env: GROQ_API_KEY=...
3. Rode: npm install
4. Rode: node src/ai-analyzer.js

Pronto! A IA começará a analisar as conversas automaticamente! 🚀

═══════════════════════════════════════════════════════════════
`);
