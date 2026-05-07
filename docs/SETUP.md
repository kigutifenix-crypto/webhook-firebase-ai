# ⚡ Guia Rápido de Configuração

## 1️⃣ Instalar Dependências
```bash
npm install
```

## 2️⃣ Configurar Firebase Admin SDK (Servidor)

### Obter credenciais:
1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto **"qr-code-maquinas-60cb9"**
3. Vá para ⚙️ **Configurações** → **Contas de Serviço**
4. Clique em **"Gerar nova chave privada"**
5. Arquivo JSON será baixado

### Configurar .env:
```bash
# Copiar template
cp .env.example .env

# Abrir e editar com as credenciais do JSON
# Windows: notepad .env
# Mac/Linux: nano .env
```

### Preencher variáveis no .env:
- `FIREBASE_PROJECT_ID` → `projectId` do JSON
- `FIREBASE_PRIVATE_KEY_ID` → `private_key_id` do JSON
- `FIREBASE_PRIVATE_KEY` → `private_key` do JSON
- `FIREBASE_CLIENT_EMAIL` → `client_email` do JSON
- `FIREBASE_CLIENT_ID` → `client_id` do JSON
- `FIREBASE_DATABASE_URL` → https://seu-project-id-default-rtdb.firebaseio.com

## 3️⃣ Iniciar Servidor

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Ou Produção
npm start
```

## 4️⃣ Acessar Dashboard

Abra no navegador: **http://localhost:3000**

## 5️⃣ Testar Webhook

### Opção A: curl
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_conversation_1",
    "conversation_id": "test_conversation_1",
    "messages": [
      {
        "body": "Teste de webhook",
        "from": "1234567890",
        "timestamp": 1619645000
      }
    ],
    "meta": {
      "sender": {
        "name": "João Silva",
        "phone_number": "11987654321",
        "id": "sender_123"
      },
      "assignee": {
        "name": "Vendedor",
        "id": "assignee_123"
      }
    }
  }'
```

### Opção B: Postman
1. POST `http://localhost:3000/webhook`
2. Body → raw JSON (copiar exemplo acima)
3. Send

## 6️⃣ Firebase Web SDK (Dashboard)

✅ **Já configurado!** O dashboard usa Firebase Web SDK com a URL:
- `https://qr-code-maquinas-60cb9-default-rtdb.firebaseio.com`

Você verá as conversas em **tempo real** no dashboard!

## 🚨 Problemas Comuns

| Erro | Solução |
|------|---------|
| `FIREBASE_PRIVATE_KEY not found` | Cheque se .env foi preenchido corretamente |
| `Port 3000 already in use` | Mude a porta: `PORT=3001 npm start` |
| `Firebase connection failed` | Verifique internet e credenciais |
| `Webhook 400 Bad Request` | Certifique-se que `id` ou `conversation_id` está no JSON |

## ✅ Checklist Final

- [ ] `npm install` executado
- [ ] `.env` preenchido com credenciais Firebase
- [ ] `npm run dev` rodando
- [ ] Dashboard abre em `http://localhost:3000`
- [ ] Firebase mostra "🟢 Online"
- [ ] Webhook teste retorna sucesso
- [ ] Nova conversa aparece no dashboard

## 📞 Próximos Passos

1. Configure webhook na Toolz: `http://seu-dominio.com/webhook`
2. Comece a receber webhooks
3. Veja conversas em tempo real no dashboard!

---

**Dúvidas?** Verifique o [README.md](README.md) completo
