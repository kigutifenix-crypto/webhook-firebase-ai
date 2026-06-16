# 🚀 Deploy no Vercel

Este projeto agora está otimizado para rodar na **Vercel** com funções serverless.

## 📝 URL do Webhook

```
https://planilhasfenix.vercel.app/api/webhook
```

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente no Vercel

Acesse o dashboard do Vercel e configure as seguintes variáveis de ambiente:

#### Firebase
```
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY_ID=sua-private-key-id
FIREBASE_PRIVATE_KEY=sua-private-key (com quebras de linha como \n)
FIREBASE_CLIENT_EMAIL=seu-client-email
FIREBASE_CLIENT_ID=seu-client-id
FIREBASE_CLIENT_CERT_URL=seu-cert-url
FIREBASE_DATABASE_URL=https://seu-project.firebaseio.com
```

#### OpenAI/Gemini
```
OPENAI_API_KEY=sua-chave-api
OPENAI_MODEL=gemini-1.5
```

#### Google Sheets (Opcional)
```
GOOGLE_SHEETS_ID=id-da-sua-planilha
GOOGLE_SHEETS_CREDENTIALS_FILE=./google-credentials.json
GOOGLE_SHEETS_NAME=Análises
```

### 2. Deploy

#### Via GitHub (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Cada push para `main` faz deploy automaticamente
3. Configure as variáveis de ambiente no dashboard Vercel

#### Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 📡 Testar Webhook

### Via cURL
```bash
curl -X POST https://planilhasfenix.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

### Via Node.js
```bash
node scripts/webhook-real-example.js
```

## 📊 Monitoramento

### Logs no Vercel
```bash
vercel logs
```

### Real-time Logs
```bash
vercel logs --follow
```

## ⚙️ Estrutura do Projeto

```
├── api/
│   └── webhook.js          # Função serverless do webhook
├── vercel.json             # Configuração do Vercel
├── .env.example            # Template de variáveis
├── package.json
└── src/
    ├── server.js           # Servidor Express (local dev)
    └── ai-analyzer.js      # Analisador de IA
```

## 🔄 Desenvolvimento Local

Para testar localmente antes de fazer deploy:

```bash
# Instalar dependências
npm install

# Configurar variáveis locais
cp .env.example .env
# Edite .env com suas credenciais

# Rodar localmente
npm run dev
```

## 🚨 Limitações do Vercel Free

- **Timeout:** 10 segundos (funções serverless)
- **Memória:** 512 MB
- **Deploy:** Até 100 por dia

Para webhooks com processamento mais pesado, considere Vercel Pro.

## 📋 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Repositório conectado ao Vercel
- [ ] FIREBASE_PRIVATE_KEY com quebras de linha corretas (\n)
- [ ] URL do webhook atualizada na Toolz
- [ ] Testar webhook com um payload de teste
- [ ] Verificar logs no Vercel

## 🆘 Troubleshooting

### "Firebase credentials não configuradas"
- Verifique se `FIREBASE_PRIVATE_KEY` e `FIREBASE_CLIENT_EMAIL` estão definidos no Vercel
- Certifique-se de que `FIREBASE_PRIVATE_KEY` usa `\n` para quebras de linha

### "Timeout"
- Funções serverless têm limite de 10 segundos no Vercel Free
- Considere Vercel Pro para aumentar o limite

### "Invalid JSON"
- O payload do webhook deve ser JSON válido
- Verifique a resposta com: `curl -v https://planilhasfenix.vercel.app/api/webhook`

---

✅ Deploy configurado e pronto para produção!
