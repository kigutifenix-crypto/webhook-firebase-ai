# 🚀 Toolz Webhook Receiver - Firebase Integration

Sistema completo de recebimento e armazenamento de webhooks da plataforma **Toolz** no **Firebase Realtime Database** com **Dashboard em Tempo Real**.

## ✨ Características

- ✅ **Recebe webhooks** da Toolz automaticamente
- 📊 **Dashboard interativo** com monitoramento em tempo real
- 🔥 **Firebase Realtime Database** para armazenamento sincronizado
- 🔄 **Histórico de mensagens** completo organizadas por conversation_id
- 📱 **Responsivo** e fácil de usar
- 🛡️ **Validação de dados** integrada
- ⚡ **Express.js + Firebase Web SDK** para máxima performance
- 🔗 **Sincronização em Tempo Real** do Firebase no Dashboard
- 📡 **API REST** completa para integrações

## 📋 Pré-requisitos

- Node.js 14+ instalado
- Conta Google com Firebase Project criado
- Credenciais do Firebase Admin SDK (para o servidor)
- Configuração do Firebase Web SDK (para o dashboard)

## 🔧 Instalação e Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Firebase - Servidor (Admin SDK)

O servidor Node.js usa **Firebase Admin SDK** para salvar os webhooks. Você precisa de um `Service Account` JSON.

#### Obter as Credenciais:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **⚙️ Configurações** → **Contas de Serviço**
4. Clique em **Gerar nova chave privada**
5. Um arquivo JSON será baixado

### 3. Configurar Firebase - Dashboard (Web SDK)

O dashboard usa **Firebase Web SDK** para sincronização em tempo real. As credenciais já estão incluídas no `src/public/index.html`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDrXf82t2r3hKzBxoPxvTsxmkwUo5xFjR0",
  authDomain: "qr-code-maquinas-60cb9.firebaseapp.com",
  databaseURL: "https://qr-code-maquinas-60cb9-default-rtdb.firebaseio.com",
  projectId: "qr-code-maquinas-60cb9",
  storageBucket: "qr-code-maquinas-60cb9.firebasestorage.app",
  messagingSenderId: "156754965195",
  appId: "1:156754965195:web:a79e8472bb1dab0ab9614e",
  measurementId: "G-TJB34JTFS3"
};
```

### 4. Configurar Variáveis de Ambiente

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Abra `.env` e adicione as credenciais do Service Account que você baixou:

```env
# Firebase Admin SDK (do JSON que você baixou)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY_ID=sua-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua-chave\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk@seu-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://seu-project-id-default-rtdb.firebaseio.com

PORT=3000
NODE_ENV=production
```

⚠️ **IMPORTANTE**: 
- ✋ **NUNCA** compartilhe o arquivo `.env` ou o JSON do Service Account
- 📛 Adicione `.env` ao `.gitignore`
- 🔐 As chaves privadas são sensíveis e não devem ser commitadas

## 🚀 Executando o Servidor

### Modo Produção

```bash
npm start
```

### Modo Desenvolvimento (com hot-reload)

```bash
npm run dev
```

A aplicação estará disponível em:
- 🌐 **Dashboard**: http://localhost:3000
- 📡 **Webhook endpoint**: http://localhost:3000/webhook
- 📊 **API**: http://localhost:3000/conversations

## 📊 Dashboard em Tempo Real

O dashboard oferece:

- **Status do Servidor**: Indicador de conexão com o Firebase
- **Total de Conversas**: Contagem dinâmica sincronizada com Firebase
- **Última Atualização**: Timestamp da última sincronização
- **Lista de Conversas**: Monitoramento em tempo real dos webhooks recebidos
- **Detalhes da Conversa**: Informações completas, histórico de mensagens e JSON raw

### Funcionalidades Principais

1. **Monitoramento em Tempo Real**
   - Firebase Web SDK sincroniza automaticamente as conversas
   - Atualização instantânea quando novos webhooks chegam
   - Suporta até 50 conversas simultâneas (configurável)

2. **Visualização de Mensagens**
   - Histórico completo de mensagens por conversation_id
   - Informações do remetente (nome, telefone)
   - Responsável atribuído
   - Timestamps precisos

3. **Ferramentas Úteis**
   - Copiar JSON completo da conversa
   - Atualizar manualmente a lista
   - Auto-refresh a cada 30 segundos

## � Configurar Webhook na Toolz

1. Acesse o painel de administração da **Toolz**
2. Vá para **Configurações** → **Webhooks** ou **Integrações**
3. Adicione um novo webhook com:
   - **URL**: `http://seu-dominio.com/webhook` (ou `http://localhost:3000/webhook` em desenvolvimento)
   - **Método**: `POST`
   - **Eventos**: Selecione "Mensagens" ou eventos de conversa
   - **Headers** (opcional): Adicione autenticação se necessário

4. Teste o webhook para confirmar a conexão

## 📡 Estrutura de Dados

### 1. Receber Webhook
```bash
POST /webhook
```

**Payload esperado:**
```json
{
  "id": "conversation_id_123",
  "conversation_id": "conversation_id_123",
  "messages": [
    {
      "body": "Olá, preciso de um orçamento",
      "from": "1234567890",
      "timestamp": 1234567890
    }
  ],
  "meta": {
    "sender": {
      "name": "João Silva",
      "phone_number": "11987654321",
      "id": "sender_id"
    },
    "assignee": {
      "name": "Vendedor Name",
      "id": "assignee_id"
    }
  }
}
```

**Resposta de sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Webhook recebido e armazenado com sucesso",
  "conversation_id": "conversation_id_123",
  "timestamp": "2024-04-28T10:30:00.000Z"
}
```

### 2. Obter Conversa Específica
```bash
GET /conversation/:id
```

**Exemplo:**
```bash
curl http://localhost:3000/conversation/conversation_id_123
```

**Resposta:**
```json
{
  "sucesso": true,
  "dados": {
    "conversation_id": "conversation_id_123",
    "sender": {
      "name": "João Silva",
      "phone_number": "11987654321"
    },
    "messages": [...],
    "timestamp": 1234567890
  }
}
```

### 3. Listar Conversas (Últimas 50)
```bash
GET /conversations
```

**Resposta:**
```json
{
  "sucesso": true,
  "conversas": [...],
  "total": 42
}
```

### 4. Status do Servidor
```bash
GET /status
```

**Resposta:**
```json
{
  "status": "online",
  "timestamp": "2024-04-28T10:30:00.000Z",
  "firebase": "conectado"
}
```

## 🎯 Dashboard Web

Acesse em `http://localhost:3000`

### Funcionalidades do Dashboard

- 📊 **Sincronização em Tempo Real**: Firebase Web SDK atualiza conversas instantaneamente
- 🟢 **Status do Servidor**: Indicador de conexão com Firebase
- 📬 **Lista de Conversas**: Monitoramento dinâmico com dados em tempo real
- 📋 **Detalhes Completos**: Informações do remetente, responsável e histórico de mensagens
- 💾 **Visualização JSON**: Veja dados brutos de qualquer conversa
- 📋 **Cópia Rápida**: Botão para copiar JSON da conversa
- 🔄 **Auto-atualização**: Sincronização a cada 30 segundos + listener em tempo real Firebase

## 🔗 Configurar Webhook na Toolz

### 1. Acesse o Painel da Toolz
- Vá para Configurações → Webhooks

### 2. Adicione o Endpoint
- **URL**: `https://seu-dominio.com/webhook` (ou `http://localhost:3000/webhook` para teste local)
- **Método**: POST
- **Headers**: Content-Type: application/json
- **Eventos**: Selecione "Mensagens" ou "Todas"

### 3. Teste o Webhook
- Clique em "Enviar teste"
- Verifique no Dashboard se aparece

## 📊 Estrutura de Dados Firebase

### Formato Real do Toolz

Os dados recebidos do Toolz têm esta estrutura (exemplo real):

```json
{
  "id": 4312,
  "inbox_id": 2478,
  "status": "open",
  "messages": [
    {
      "id": 16701945,
      "content": "[AGENT] Perfeito. Você está pensando...",
      "created_at": 1777298574,
      "sender": {"id": 1269, "name": "Toolzz AI"}
    }
  ],
  "meta": {
    "sender": {
      "id": 597190,
      "name": "Romario Rodrigues",
      "phone_number": "+559193378426"
    },
    "assignee": {
      "id": 3718,
      "name": "Erika Santos de Souza"
    },
    "team": {"id": 1454, "name": "atendimento"}
  },
  "timestamp": 1777298924,
  "event": "automation_event.conversation_updated"
}
```

### Estrutura no Firebase Realtime Database

Após processar, os dados são organizados assim:

```
conversations/
├── 4312/                                (conversation_id)
│   ├── id: 4312
│   ├── status: "open"
│   ├── inbox_id: 2478
│   ├── priority: null
│   ├── labels: []
│   ├── custom_attributes: {}
│   │
│   ├── sender:
│   │   ├── id: 597190
│   │   ├── name: "Romario Rodrigues"
│   │   ├── phone_number: "+559193378426"
│   │   ├── email: null
│   │   ├── cpf: null
│   │   └── type: "contact"
│   │
│   ├── assignee:
│   │   ├── id: 3718
│   │   ├── name: "Erika Santos de Souza"
│   │   ├── available_name: "Erika Souza"
│   │   └── type: "user"
│   │
│   ├── team:
│   │   ├── id: 1454
│   │   └── name: "atendimento"
│   │
│   ├── messages: [...]                  (últimas mensagens)
│   ├── messages_history: [...]          (histórico completo)
│   ├── raw_data: {...}                  (JSON original completo)
│   │
│   ├── timestamp: 1777298924000         (ServerValue.TIMESTAMP)
│   ├── received_at: "2026-04-28T..."    (ISO 8601)
│   ├── created_at: 1776944332
│   └── event: "automation_event.conversation_updated"
│
├── 4313/
│   └── ...
└── 4314/
    └── ...
```

### Campos Extras Suportados

O sistema automaticamente salva todos estes campos se presentes:

- ✅ `email`, `cpf` do cliente
- ✅ `priority`, `labels`, `custom_attributes`
- ✅ `first_reply_created_at`, `agent_last_seen_at`
- ✅ Todos os metadados do Toolz
- ✅ Histórico de mensagens completo
- ✅ JSON bruto para auditoria

## 🐛 Troubleshooting

### Firebase não conecta

**Erro**: `Service account credentials not found`

**Solução**:
```bash
# Verifique se .env está preenchido corretamente
# Teste a conexão com Firebase
node -e "const admin = require('firebase-admin'); console.log('Firebase SDK loaded successfully')"
```

### Webhook não recebe dados

**Erro**: `400 Bad Request`

**Solução**:
- Verifique se o JSON está correto
- Confirme se `id` ou `conversation_id` está presente
- Veja logs do servidor: `node src/server.js`

### Porta 3000 já está em uso

**Solução**:
```bash
# Usar outra porta
PORT=3001 npm start

# Ou matar o processo
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

## 📈 Deploy em Produção

### Opção 1: Heroku

```bash
# Login
heroku login

# Criar app
heroku create seu-webhook-app

# Adicionar variáveis de ambiente
heroku config:set FIREBASE_PROJECT_ID=seu-project-id
heroku config:set FIREBASE_PRIVATE_KEY="..."
# ... adicione todas do .env

# Deploy
git push heroku main
```

### Opção 2: Railway.app

1. Conecte seu repositório Git
2. Adicione variáveis de ambiente no painel
3. Faça deploy automaticamente

### Opção 3: AWS Lambda + API Gateway

Veja documentação específica para serverless

### Opção 4: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t toolz-webhook .
docker run -e FIREBASE_PROJECT_ID=xxx ... -p 3000:3000 toolz-webhook
```

## 🔐 Segurança

1. ✅ Use HTTPS em produção
2. ✅ Adicione autenticação (bearer token)
3. ✅ Valide origem do webhook
4. ✅ Nunca commite `.env`
5. ✅ Rotacione chaves periodicamente
6. ✅ Use rate limiting
7. ✅ Monitore acessos

## 📝 Logs

Os logs aparecem no console:

```
✅ Firebase inicializado com sucesso
🚀 Servidor rodando em http://localhost:3000
📊 Dashboard: http://localhost:3000
🔗 Webhook endpoint: http://localhost:3000/webhook
✅ Webhook recebido e salvo: conversation_id_123
```

## 📦 Tecnologias Utilizadas

- **Express.js** - Framework web
- **Firebase Admin SDK** - Acesso ao Firebase
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Variáveis de ambiente
- **Node.js** - Runtime JavaScript

## 📄 Licença

MIT

## 👨‍💻 Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `npm start`
2. Consulte a documentação do Firebase
3. Veja os examples no código

## 🎉 Pronto!

Você agora tem um sistema robusto para receber webhooks da Toolz e armazenar em Firebase! 🚀
