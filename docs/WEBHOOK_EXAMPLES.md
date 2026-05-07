# 📋 Exemplos de Payloads - Webhook Toolz (Formato Real)

## ⭐ Exemplo 1: Webhook Real do Toolz (IMPORTANTE!)

Este é o **formato exato** que o Toolz envia:

```json
{
  "additional_attributes": {},
  "can_reply": true,
  "channel": "Channel::Api",
  "contact_inbox": {
    "id": 1018191,
    "contact_id": 597190,
    "inbox_id": 2478,
    "source_id": "ed22ed1b-3784-4069-8756-88331bb24304",
    "created_at": "2026-04-23T11:38:52.385Z",
    "updated_at": "2026-04-23T11:38:52.385Z",
    "hmac_verified": false,
    "pubsub_token": "zxs2axiFsLwmEgzBMkB9YnFd"
  },
  "id": 4312,
  "inbox_id": 2478,
  "messages": [
    {
      "id": 16701945,
      "content": "[AGENT] Perfeito. Você está pensando em algo para uso residencial ou para montar/estruturar uma academia?\n\nEstá mais interessado em cardio, musculação ou quer avaliar um projeto mais completo?",
      "account_id": 1158,
      "inbox_id": 2478,
      "conversation_id": 4312,
      "message_type": 1,
      "created_at": 1777298574,
      "updated_at": "2026-04-27T14:02:54.750Z",
      "private": false,
      "status": "sent",
      "source_id": null,
      "content_type": "text",
      "content_attributes": {},
      "sender_type": "User",
      "sender_id": 1269,
      "external_source_ids": {},
      "additional_attributes": {},
      "processed_message_content": "[AGENT] Perfeito. Você está pensando em algo para uso residencial ou para montar/estruturar uma academia?\n\nEstá mais interessado em cardio, musculação ou quer avaliar um projeto mais completo?",
      "sentiment": {},
      "conversation": {
        "assignee_id": 3718,
        "unread_count": 0,
        "last_activity_at": 1777298924,
        "contact_inbox": {
          "source_id": "ed22ed1b-3784-4069-8756-88331bb24304"
        }
      },
      "sender": {
        "id": 1269,
        "name": "Toolzz AI",
        "available_name": "Toolzz AI",
        "avatar_url": "https://chat.toolzz.ai/...",
        "type": "user",
        "availability_status": null,
        "thumbnail": "https://chat.toolzz.ai/...",
        "bot_id": null
      }
    }
  ],
  "labels": [],
  "meta": {
    "sender": {
      "additional_attributes": {},
      "custom_attributes": {},
      "email": null,
      "cpf": null,
      "id": 597190,
      "identifier": null,
      "name": "Romario Rodrigues",
      "phone_number": "+559193378426",
      "thumbnail": "",
      "company_ids": [],
      "companies": [],
      "type": "contact"
    },
    "assignee": {
      "id": 3718,
      "name": "Erika Santos de Souza",
      "available_name": "Erika Souza",
      "avatar_url": "https://chat.toolzz.ai/...",
      "type": "user",
      "availability_status": null,
      "thumbnail": "https://chat.toolzz.ai/...",
      "bot_id": null
    },
    "team": {
      "id": 1454,
      "name": "atendimento"
    },
    "hmac_verified": false
  },
  "status": "open",
  "custom_attributes": {},
  "snoozed_until": null,
  "unread_count": 0,
  "first_reply_created_at": "2026-04-23T11:39:40.161Z",
  "priority": null,
  "waiting_since": 0,
  "agent_last_seen_at": 1777298761,
  "contact_last_seen_at": 0,
  "last_activity_at": 1777298924,
  "timestamp": 1777298924,
  "created_at": 1776944332,
  "event": "automation_event.conversation_updated"
}
```

### 🎯 Campos Principais para Extrair

```javascript
// ID da Conversa (usar como chave Firebase)
conversation_id = id (4312)

// Informações do Cliente
sender = meta.sender
// {
//   "id": 597190,
//   "name": "Romario Rodrigues",
//   "phone_number": "+559193378426"
// }

// Agente Responsável
assignee = meta.assignee
// {
//   "id": 3718,
//   "name": "Erika Santos de Souza"
// }

// Mensagens
messages = array com conteúdo completo

// Status da Conversa
status = "open" | "resolved" | etc

// Timestamp da última atividade
timestamp = 1777298924
```



## Exemplo 2: Conversa com Múltiplas Mensagens

```json
{
  "id": 4313,
  "inbox_id": 2478,
  "status": "open",
  "timestamp": 1777298924,
  "created_at": 1776944332,
  "event": "automation_event.conversation_updated",
  "messages": [
    {
      "id": 16701944,
      "content": "Olá, gostaria de informações sobre equipamentos de musculação",
      "created_at": 1777298400,
      "sender": {
        "id": 1270,
        "name": "Cliente X",
        "type": "contact"
      }
    },
    {
      "id": 16701945,
      "content": "[AGENT] Claro! Qual é seu orçamento?",
      "created_at": 1777298574,
      "sender": {
        "id": 1269,
        "name": "Toolzz AI",
        "type": "user"
      }
    }
  ],
  "meta": {
    "sender": {
      "id": 597190,
      "name": "Cliente X",
      "phone_number": "+559193378426",
      "email": null
    },
    "assignee": {
      "id": 3718,
      "name": "Erika Santos de Souza"
    },
    "team": {
      "id": 1454,
      "name": "atendimento"
    }
  }
}
```

## Exemplo 3: Webhook com Rótulos (Labels)

```json
{
  "id": 4314,
  "inbox_id": 2478,
  "status": "open",
  "labels": ["lead", "vip", "urgente"],
  "priority": "high",
  "custom_attributes": {
    "valor_orcamento": "5000",
    "tipo_equipamento": "cardio"
  },
  "messages": [
    {
      "id": 16701946,
      "content": "Preciso urgente de um orçamento para 10 esteiras",
      "created_at": 1777298600,
      "sender": {
        "id": 597191,
        "name": "João Academia",
        "type": "contact"
      }
    }
  ],
  "meta": {
    "sender": {
      "id": 597191,
      "name": "João Academia",
      "phone_number": "+559191234567",
      "cpf": "123.456.789-00"
    },
    "assignee": {
      "id": 3718,
      "name": "Erika Santos de Souza"
    }
  }
}
```

## Testes com curl

### Enviar Webhook Real (Exemplo 1):
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "id": 4312,
  "inbox_id": 2478,
  "status": "open",
  "timestamp": 1777298924,
  "messages": [
    {
      "id": 16701945,
      "content": "[AGENT] Perfeito. Você está pensando em algo para uso residencial?",
      "sender": {
        "id": 1269,
        "name": "Toolzz AI"
      }
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
    "team": {
      "id": 1454,
      "name": "atendimento"
    }
  }
}
EOF
```

### Listar todas as conversas:
```bash
curl http://localhost:3000/conversations | python -m json.tool
```

### Obter conversa específica:
```bash
curl http://localhost:3000/conversation/conv_12345 | python -m json.tool
```

## Validação de Payload

O servidor valida:
- ✅ `id` deve existir (será usada como conversation_id)
- ✅ `messages` deve ser um array
- ✅ Cada mensagem deve ter pelo menos `content`
- ✅ `meta.sender` com informações do cliente
- ✅ `meta.assignee` com informações do agente

⚠️ Estrutura esperada do Toolz:
```json
{
  "id": <número>,                    // obrigatório!
  "inbox_id": <número>,
  "messages": [                      // obrigatório! array
    {
      "id": <número>,
      "content": "texto",           // obrigatório! conteúdo da mensagem
      "created_at": <timestamp>,
      "sender": {...}
    }
  ],
  "meta": {
    "sender": {
      "id": <número>,
      "name": "string",
      "phone_number": "string"
    },
    "assignee": {
      "id": <número>,
      "name": "string"
    }
  },
  "status": "open|resolved|pending",
  "timestamp": <número>,
  "event": "automation_event.conversation_updated"
}
```

Se um campo obrigatório faltar:
```json
{
  "sucesso": false,
  "erro": "conversation_id não encontrado ou messages não é array",
  "timestamp": "2026-04-28T10:30:00.000Z"
}
```

## Estrutura Firebase Resultante

Após receber o webhook do Toolz, os dados serão salvos assim:

```
conversations/
└── 4312/                                          (id do webhook)
    ├── conversation_id: 4312
    ├── timestamp: 1777298924000                  (ServerValue.TIMESTAMP)
    ├── received_at: "2026-04-28T14:02:54.750Z"   (ISO string)
    ├── status: "open"
    ├── inbox_id: 2478
    ├── sender:
    │   ├── name: "Romario Rodrigues"
    │   ├── phone_number: "+559193378426"
    │   └── id: 597190
    ├── assignee:
    │   ├── name: "Erika Santos de Souza"
    │   └── id: 3718
    ├── team:
    │   ├── id: 1454
    │   └── name: "atendimento"
    ├── messages: [                              (últimas mensagens recebidas)
    │   {
    │     "id": 16701945,
    │     "content": "[AGENT] Perfeito...",
    │     "created_at": 1777298574,
    │     "sender_id": 1269,
    │     "sender_name": "Toolzz AI"
    │   }
    │ ]
    ├── messages_history: [                      (histórico completo)
    │   {todas as mensagens com received_at}
    │ ]
    └── raw_data: {...}                          (JSON original completo)
```

### Exemplo de Leitura no Firebase

```javascript
// Acessar conversa específica
db.ref('conversations/4312').on('value', snapshot => {
  const conv = snapshot.val();
  
  console.log(conv.id);                    // 4312
  console.log(conv.sender.name);           // "Romario Rodrigues"
  console.log(conv.assignee.name);         // "Erika Santos de Souza"
  console.log(conv.messages.length);       // Número de mensagens
  console.log(conv.messages_history);      // Histórico completo
});
```

## 🎯 Tips Específicos para Toolz

### Campos Importantes do Webhook Toolz

| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| `id` | ID da conversa (use como chave Firebase) | ✅ Sim |
| `inbox_id` | ID da caixa de entrada | ✅ Sim |
| `messages` | Array com todas as mensagens | ✅ Sim |
| `meta.sender` | Informações do cliente | ⚠️ Recomendado |
| `meta.assignee` | Informações do agente responsável | ⚠️ Recomendado |
| `status` | "open", "resolved", etc | ⚠️ Recomendado |
| `timestamp` | Unix timestamp da última atividade | ⚠️ Recomendado |
| `created_at` | Data de criação da conversa | ⚠️ Recomendado |
| `event` | Tipo de evento (ex: "automation_event.conversation_updated") | ⚠️ Recomendado |

### Formato de Data/Hora

- ✅ `created_at` (timestamps): Unix time (segundos)
- ✅ `updated_at` (timestamps em strings): ISO 8601 format
- ✅ O servidor automaticamente adiciona `received_at` em ISO format

### Extração de Dados Úteis

```javascript
// No seu processamento do webhook:

const conversationId = payload.id;                    // 4312
const clienteName = payload.meta.sender.name;        // "Romario Rodrigues"
const clientePhone = payload.meta.sender.phone_number;  // "+559193378426"
const agentName = payload.meta.assignee.name;        // "Erika Santos de Souza"
const teamName = payload.meta.team.name;             // "atendimento"
const status = payload.status;                       // "open"
const messageCount = payload.messages.length;        // Quantas mensagens
const lastMessage = payload.messages[payload.messages.length - 1]; // Última msg
```

### Lidar com Múltiplas Mensagens

O Toolz pode enviar **apenas as novas mensagens** ou **todas as mensagens** da conversa. 

O servidor automaticamente:
1. Salva as mensagens recebidas em `messages`
2. Adiciona ao histórico em `messages_history`
3. Preserva mensagens anteriores

```javascript
// No Firebase, você terá:
conversation.messages              // Última atualização
conversation.messages_history      // Histórico completo
```

### Eventos do Toolz

O campo `event` indica o tipo de evento:
- `"automation_event.conversation_updated"` - Conversa atualizada
- Pode haver outros tipos, todos são salvos automaticamente

### CPF e Dados Adicionais

O Toolz pode enviar dados adicionais em `meta.sender`:
```json
"meta": {
  "sender": {
    "cpf": "123.456.789-00",
    "email": "email@example.com",
    "custom_attributes": {...},
    "company_ids": [],
    "companies": []
  }
}
```

Todos são automaticamente salvos em Firebase!
