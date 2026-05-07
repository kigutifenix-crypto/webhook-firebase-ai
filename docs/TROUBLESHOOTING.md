# 🆘 FAQ e Troubleshooting

## ❓ Perguntas Frequentes

### P: Como obtenho as credenciais do Firebase?
**R:** 
1. Acesse https://console.firebase.google.com/
2. Selecione seu projeto
3. Vá para ⚙️ **Configurações** → **Contas de Serviço**
4. Clique em **"Gerar nova chave privada"**
5. Um arquivo JSON será baixado automaticamente
6. Copie os valores para o `.env`

### P: Qual é a diferença entre Firebase Admin SDK e Web SDK?
**R:** 
- **Admin SDK**: Usado no servidor (Node.js) para receber e salvar webhooks no Firebase
- **Web SDK**: Usado no navegador (Dashboard) para sincronização em tempo real
- Ambas usam o mesmo banco de dados, mas têm propósitos diferentes

### P: Posso usar só a Web SDK sem o Admin SDK?
**R:** Não. O Admin SDK é necessário para receber os webhooks da Toolz e salvar no Firebase. A Web SDK é apenas para visualização.

### P: Quantas conversas o dashboard suporta?
**R:** O dashboard mostra as últimas 50 conversas em tempo real. O Firebase suporta ilimitadas, mas recomenda-se paginar para melhor performance.

### P: É seguro compartilhar a chave do Firebase?
**R:** Não! A chave privada (Admin SDK) é confidencial. Nunca faça commit no Git ou compartilhe. Use variáveis de ambiente (.env).

### P: Como faço deploy em produção?
**R:** Veja a seção "Deploy" no [README.md](README.md#-deploy-em-produção)

---

## 🐛 Solução de Problemas

### ❌ "Firebase Admin SDK initialization failed"

**Causa**: Credenciais Firebase incorretas no `.env`

**Solução**:
```bash
# 1. Verifique se .env existe
ls -la .env

# 2. Verifique o conteúdo
cat .env

# 3. Certifique-se de que os valores estão corretos:
#    - FIREBASE_PROJECT_ID
#    - FIREBASE_PRIVATE_KEY (com quebras de linha corretas)
#    - FIREBASE_CLIENT_EMAIL
#    - FIREBASE_DATABASE_URL

# 4. Se a private_key tem \n no lugar de quebras de linha:
#    Isso é esperado! O código faz a conversão automaticamente
```

### ❌ "listen EADDRINUSE: address already in use :::3000"

**Causa**: Porta 3000 já está em uso

**Solução - Windows:**
```powershell
# Encontrar processo na porta
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F

# Ou usar outra porta
$env:PORT = 3001
npm run dev
```

**Solução - Mac/Linux:**
```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar outra porta
PORT=3001 npm run dev
```

### ❌ "Cannot find module 'firebase-admin'"

**Causa**: Dependências não instaladas

**Solução**:
```bash
npm install

# Se ainda tiver problema, remova e reinstale
rm -rf node_modules package-lock.json
npm install
```

### ❌ Dashboard mostra "Conectando..." e não carrega conversas

**Causa**: Firebase não inicializado no cliente

**Solução**:
1. Verifique se o servidor está rodando: `npm run dev`
2. Verifique console do navegador (F12) para erros
3. Certifique-se que a credencial Web SDK está correta no `index.html`
4. Verifique se a URL do banco de dados está correta

```javascript
// No console do navegador, teste:
console.log(window.firebaseDatabase) // deve retornar o objeto
```

### ❌ Webhook retorna "400 Bad Request"

**Causa**: Payload inválido

**Solução**:
- Certifique-se que tem `id` ou `conversation_id`
- Certifique-se que tem `messages` como array
- Cada mensagem deve ter `body`
- Valide o JSON em https://jsonlint.com/

**Exemplo correto:**
```json
{
  "id": "conv_123",
  "messages": [
    {"body": "Olá"}
  ],
  "meta": {
    "sender": {"name": "João"}
  }
}
```

### ❌ Firebase "Permission denied" ao salvar dados

**Causa**: Regras de segurança do Firebase restringem acesso

**Solução**:
1. Acesse Firebase Console
2. Vá para **Realtime Database** → **Regras**
3. Mude para:
```json
{
  "rules": {
    "conversations": {
      ".read": true,
      ".write": true
    }
  }
}
```
⚠️ **Isso é apenas para desenvolvimento!** Em produção, configure regras apropriadas.

### ❌ "FIREBASE_PRIVATE_KEY is not valid PEM format"

**Causa**: Quebras de linha na chave privada não estão corretas

**Solução**:
```bash
# O .env deve ter a chave com \n (escape sequence)
# ERRADO:
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...

# CORRETO:
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nconteudo\n-----END PRIVATE KEY-----\n"

# O servidor converte \n em quebras reais automaticamente
```

### ❌ Webhook foi enviado mas não aparece no dashboard

**Causa**: Dados salvos no Firebase mas dashboard não sincronizou

**Solução**:
1. Aguarde 2-3 segundos (sincronização em tempo real)
2. Clique em "Atualizar" no dashboard
3. Abra DevTools (F12) e verifique se há erros
4. Verifique Firebase Console → Realtime Database se tem dados

### ❌ "WebSocket connection failed" (CORS erro)

**Causa**: CORS não configurado corretamente

**Solução**:
- Verificar se CORS está habilitado no servidor (já está por padrão)
- Se ainda tiver problema, abra o arquivo `src/server.js` e confirme:
```javascript
app.use(cors()); // Deve estar presente
```

### ❌ Dashboard vazio mesmo após enviar webhook

**Causa**: Credencial Web SDK diferente do Admin SDK

**Solução**:
Certifique-se que ambos apontam para o **mesmo Firebase Project**:
- Web SDK `databaseURL`: deve ser igual a
- Admin SDK `FIREBASE_DATABASE_URL`

```bash
# Ambas devem ser:
https://seu-project-id-default-rtdb.firebaseio.com
```

---

## 🔍 Como Debugar

### 1. Ativar logs detalhados do servidor:

Edite `src/server.js` e adicione mais console.log() onde necessário.

### 2. Ver dados no Firebase Console:

1. Acesse https://console.firebase.google.com/
2. Selecione seu projeto
3. Vá para **Realtime Database**
4. Você verá a estrutura: `conversations` → `conversation_id` → dados

### 3. Testar webhook com curl:

```bash
# Enviar webhook de teste
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"id":"test","conversation_id":"test","messages":[{"body":"teste"}]}'

# Listar conversas
curl http://localhost:3000/conversations

# Obter conversa específica
curl http://localhost:3000/conversation/test
```

### 4. Ver logs do navegador:

Abra DevTools → Console → verifique mensagens do Firebase SDK

### 5. Usar script de teste automatizado:

```bash
npm run test

# Este script verifica:
# ✅ Variáveis de ambiente
# ✅ Conexão com servidor
# ✅ Envio de webhook
# ✅ Listagem de conversas
```

---

## 📞 Não Consegui Resolver?

### Checklist final:

- [ ] Instalei dependências: `npm install`
- [ ] Copiei `.env.example` para `.env`
- [ ] Preenchi `.env` com credenciais corretas
- [ ] Servidor está rodando: `npm run dev`
- [ ] Dashboard abre: `http://localhost:3000`
- [ ] Firebase mostra "🟢 Online" no dashboard
- [ ] Testei webhook com: `npm run test`
- [ ] Verifiquei logs do navegador (F12)
- [ ] Verifiquei Firebase Console → Realtime Database

### Modo debug:

```bash
# Ver todas as variáveis carregadas
npm run dev -- --debug

# Ver logs detalhados
DEBUG=* npm run dev

# Testar conexão Firebase
node -e "const admin = require('firebase-admin'); console.log('✅ Firebase module loaded')"
```

### Recursos úteis:

- 📚 [Firebase Admin SDK Docs](https://firebase.google.com/docs/database/admin/start)
- 🌐 [Firebase Web SDK Docs](https://firebase.google.com/docs/database/web)
- 💬 [Stack Overflow Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)
- 🆘 [Firebase Support](https://firebase.google.com/support)

---

Não resolveu? Entre em contato com o suporte! 🤝
