# Toolz Webhook Receiver

Website para receber webhooks da Toolz e salvar no Firebase Realtime Database.

## 📁 Estrutura do Projeto

```
├── src/
│   ├── server.js              # Backend Node.js + Express
│   └── public/                # Frontend (Dashboard)
│       ├── index.html         # Interface web
│       ├── firebase-config.js # Config Firebase Web SDK
│       └── firebase-realtime.js # Funções realtime
├── scripts/                   # Scripts de teste
│   ├── test-webhook.js        # Teste automático
│   ├── webhook-real-example.js # Exemplo real
│   └── webhook-real-example.json # Payload JSON
├── docs/                      # Documentação completa
│   ├── README.md              # Documentação técnica
│   ├── SETUP.md               # Instruções de setup
│   ├── AI_SETUP.md            # Setup IA gratuita (Groq)
│   ├── GOOGLE_SHEETS_SETUP.md # Guia Google Sheets API
│   ├── GOOGLE_API_GUIA_VISUAL.md # Guia visual passo-a-passo
│   ├── TROUBLESHOOTING.md    # Solução de problemas
│   └── WEBHOOK_EXAMPLES.md    # Exemplos de payloads
├── .env                       # Configurações (não commitar)
├── .env.example               # Template de configuração
├── package.json               # Dependências
└── .gitignore                 # Arquivos ignorados
```

## 🚀 Início Rápido

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar Firebase:**
   - Copie `.env.example` para `.env`
   - Preencha com suas credenciais do Firebase

3. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

4. **Acessar dashboard:**
   - Abra http://localhost:3000

5. **Testar webhook:**
   ```bash
   node scripts/webhook-real-example.js
   ```

## 🤖 IA para Análise Automática (OPCIONAL)

Para analisar conversas automaticamente com IA gratuita:

```bash
npm run setup:ai
```

A IA extrai automaticamente:
- Resumo da conversa
- Cidade, interesse, produtos
- Nome, telefone, tipo de cliente
- Score de satisfação
- E muito mais!

## 📊 Google Sheets Automático (OPCIONAL)

Para salvar análises em planilhas automaticamente:

1. **Leia o guia visual:** [docs/GOOGLE_API_GUIA_VISUAL.md](docs/GOOGLE_API_GUIA_VISUAL.md)
2. **Ou o guia completo:** [docs/GOOGLE_SHEETS_SETUP.md](docs/GOOGLE_SHEETS_SETUP.md)
3. **Use Service Account** (dados do aplicativo) - não OAuth!
4. **Defina o modelo Groq em `.env` se precisar:**
   ```bash
   GROQ_MODEL=llama-3.1-8b-instant
   ```
5. **Execute setup:**
   ```bash
   npm run setup:ai
   ```

**IMPORTANTE:** Use "Service Account" para funcionamento automático 24/7!

## 📚 Documentação

- **[Documentação Completa](docs/README.md)** - Guia técnico detalhado
- **[Setup](docs/SETUP.md)** - Instruções passo a passo
- **[Exemplos](docs/WEBHOOK_EXAMPLES.md)** - Payloads e testes
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Solução de problemas

## 🎯 Funcionalidades

- ✅ Recebimento de webhooks da Toolz
- ✅ Validação automática de dados
- ✅ Salvamento no Firebase Realtime Database
- ✅ Dashboard web em tempo real
- ✅ Histórico de mensagens
- ✅ Suporte completo ao formato Toolz

## 🔧 Scripts Disponíveis

```bash
npm start      # Produção
npm run dev    # Desenvolvimento (com nodemon)
npm test       # Teste automático completo
npm run test:webhook # Teste específico de webhook
```

## 📄 Licença

MIT