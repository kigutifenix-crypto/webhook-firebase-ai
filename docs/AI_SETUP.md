# SETUP: IA para Analisar Conversas (Gemini/OpenAI)

## Passo 1: Obter chave API do OpenAI

1. Acesse: https://platform.openai.com/account/api-keys
2. Clique em "Create new secret key"
3. Copie a chave gerada
4. Adicione no seu `.env`:

```bash
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gemini-1.5
```

## Passo 2: Configurar Google Sheets (Opcional)

**IMPORTANTE: Use "Dados do Aplicativo" (Service Account)**

Para este sistema automatizado, use **Service Account** (dados do aplicativo), não dados do usuário.

**Por que Service Account?**
- ✅ Funciona automaticamente sem login do usuário
- ✅ Pode ser executado 24/7 sem interação
- ✅ Mais seguro para aplicações server-side
- ✅ Permissões consistentes

**Como configurar:**

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou use um já existente
3. Vá em "APIs e Serviços" → "Biblioteca"
4. Ative:
   - Google Sheets API
   - Google Drive API
5. Vá em "Credenciais" → "Criar Credencial" → "Chave de Conta de Serviço"
6. Dê um nome à conta (ex: `toolz-webhook-bot`)
7. Crie a chave em formato JSON
8. Renomeie o arquivo para `google-credentials.json`
9. Coloque o arquivo na pasta raiz do projeto
10. No `.env`, adicione:

```bash
GOOGLE_SHEETS_CREDENTIALS_FILE=./google-credentials.json
GOOGLE_SHEETS_ID=id-da-sua-planilha
GOOGLE_SHEETS_NAME=Análises
```

11. Compartilhe a planilha com o email do Service Account
    - Abra a planilha no Google Sheets
    - Clique em "Compartilhar"
    - Cole o email que está no arquivo JSON (`client_email`)
    - Dê permissão de Editor

## Passo 3: Instalar dependências

```bash
npm install
```

## Passo 4: Usar o analisador

```bash
node src/ai-analyzer.js
```

### O que o analisador faz

- ✅ Analisa cada conversa com Gemini/OpenAI
- ✅ Extrai: Cidade, Interesse, Produtos, Nome, Tipo, Data, etc
- ✅ Calcula Score de satisfação
- ✅ Salva automaticamente em Google Sheets (se configurado)

## Passo 5: Automatizar análise (Opcional)

No `src/server.js`, após salvar no Firebase, você pode chamar:

```js
const aiAnalyzer = require('./ai-analyzer');
setTimeout(() => aiAnalyzer.analyzeConversation(convId, dados), 2000);
```

## Próximos passos

1. Obtenha a chave OpenAI: https://platform.openai.com/account/api-keys
2. Defina `OPENAI_API_KEY` em `.env`
3. Rode `npm install`
4. Rode `node src/ai-analyzer.js`

Pronto! O sistema começará a analisar as conversas automaticamente com Gemini/OpenAI.
