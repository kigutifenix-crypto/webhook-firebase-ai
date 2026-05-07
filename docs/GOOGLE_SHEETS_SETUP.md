╔════════════════════════════════════════════════════════════════╗
║        GOOGLE SHEETS API: Service Account vs OAuth 2.0         ║
╚════════════════════════════════════════════════════════════════╝

Para seu sistema de webhooks automatizado, use **SERVICE ACCOUNT**!

═══════════════════════════════════════════════════════════════
DIFERENÇAS PRINCIPAIS:
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────┬─────────────────────────────────┐
│         SERVICE ACCOUNT         │           OAUTH 2.0            │
├─────────────────────────────────┼─────────────────────────────────┤
│ ✅ Dados do aplicativo          │ ❌ Dados do usuário            │
│ ✅ Funciona automaticamente      │ ❌ Requer login manual         │
│ ✅ 24/7 sem interação           │ ❌ Token expira                │
│ ✅ Mais seguro                  │ ❌ Menos seguro                │
│ ✅ Ideal para servidores        │ ❌ Ideal para apps cliente     │
│ ✅ Permissões consistentes      │ ❌ Depende do usuário          │
└─────────────────────────────────┴─────────────────────────────────┘

═══════════════════════════════════════════════════════════════
QUANDO USAR CADA UM:
═══════════════════════════════════════════════════════════════

🔹 **SERVICE ACCOUNT** (Recomendado para você):
   • Aplicações automatizadas
   • Servidores backend
   • Webhooks e APIs
   • Processos em lote
   • SEU CASO: Sistema que salva dados automaticamente

🔹 **OAUTH 2.0** (Dados do usuário):
   • Apps móveis/desktop
   • Sites que acessam dados pessoais
   • Quando o usuário precisa escolher permissões
   • Aplicações interativas

═══════════════════════════════════════════════════════════════
CONFIGURAÇÃO SERVICE ACCOUNT (PASSO A PASSO):
═══════════════════════════════════════════════════════════════

1. **ACESSAR GOOGLE CLOUD CONSOLE:**
   • Vá para: https://console.cloud.google.com/
   • Selecione ou crie um projeto

2. **ATIVAR APIs (IMPORTANTE - Biblioteca de APIs):**
   • No menu lateral esquerdo: "APIs e Serviços" → "Biblioteca"
   • PROCURE por "Google Sheets API" e clique
   • Clique "ATIVAR" (se já estiver ativada, pula)
   • PROCURE por "Google Drive API" e clique
   • Clique "ATIVAR"

   **Se não encontrar:**
   • Digite "sheets" na barra de busca
   • Selecione "Google Sheets API"
   • Mesmo para "drive" → "Google Drive API"

3. **CRIAR CREDENCIAIS:**
   • Menu lateral: "APIs e Serviços" → "Credenciais"
   • Clique: "+ CRIAR CREDENCIAIS" → "Chave de conta de serviço"
   • Nome: "toolz-webhook-bot" (ou qualquer nome)
   • Função: Deixe em branco ou selecione "Editor"
   • Clique "Concluído"

4. **BAIXAR CHAVE:**
   • Na lista de contas de serviço, clique na conta criada
   • Aba "Chaves" → "Adicionar chave" → "Criar nova chave"
   • Tipo: JSON
   • Clique "Criar" - arquivo será baixado automaticamente
   • Renomeie o arquivo para: `google-credentials.json`
   • Coloque na raiz do projeto

═══════════════════════════════════════════════════════════════
PERMISSÕES DA PLANILHA:
═══════════════════════════════════════════════════════════════

1. Abra sua planilha Google Sheets
2. Clique "Compartilhar" (botão azul no canto superior direito)
3. Cole o email da Service Account (do arquivo JSON, campo "client_email")
4. Dê permissão de "Editor"
5. Clique "Enviar"

═══════════════════════════════════════════════════════════════
PERMISSÕES DA PLANILHA:
═══════════════════════════════════════════════════════════════

1. Abra sua planilha Google Sheets
2. Clique "Compartilhar" (botão azul no canto superior direito)
3. Cole o email da Service Account (do arquivo JSON, campo "client_email")
4. Dê permissão de "Editor"
5. Clique "Enviar"

═══════════════════════════════════════════════════════════════
VARIÁVEIS DE AMBIENTE (.env):
═══════════════════════════════════════════════════════════════

GOOGLE_SHEETS_CREDENTIALS_FILE=./google-credentials.json
GOOGLE_SHEETS_ID=1ABC123... (ID da sua planilha)
GOOGLE_SHEETS_NAME=Análises

═══════════════════════════════════════════════════════════════
TESTANDO:
═══════════════════════════════════════════════════════════════

npm run setup:ai
# Responda "s" quando perguntar sobre Google Sheets
# Cole o ID da planilha quando solicitado

npm run analyze
# Deve salvar automaticamente na planilha!

═══════════════════════════════════════════════════════════════</content>
<parameter name="filePath">c:\Users\adm\Desktop\VSCODE\Planilhas\docs\GOOGLE_SHEETS_SETUP.md