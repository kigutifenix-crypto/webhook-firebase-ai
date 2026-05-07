// Monitoramento em Tempo Real das Conversas no Firebase

let firebaseConnection = null;
let realtimeListener = null;

/**
 * Conectar e monitorar conversas em tempo real do Firebase
 */
function connectFirebaseRealtime() {
  // Verificar se Firebase está disponível
  if (!window.firebaseDatabase) {
    console.warn('⚠️ Firebase não inicializado ainda. Tentando novamente em 1 segundo...');
    setTimeout(connectFirebaseRealtime, 1000);
    return;
  }

  try {
    const { ref, onValue, query: queryBuilder, limitToLast } = window.firebaseRefs;
    const db = window.firebaseDatabase;

    // Referência às conversas no Firebase
    const conversationsRef = ref(db, 'conversations');
    
    // Query para pegar os últimos 50 registros
    const conversationsQuery = queryBuilder(
      conversationsRef,
      limitToLast(50)
    );

    // Listener em tempo real
    realtimeListener = onValue(conversationsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const firebaseConversations = [];
        const data = snapshot.val();

        // Converter objeto Firebase em array
        for (const [conversationId, conversationData] of Object.entries(data)) {
          firebaseConversations.push({
            id: conversationId,
            ...conversationData
          });
        }

        // Inverter para mostrar as mais recentes primeiro
        firebaseConversations.reverse();

        // Atualizar o estado global
        window.firebaseConversations = firebaseConversations;

        // Atualizar o dashboard
        updateDashboardWithFirebaseData(firebaseConversations);

        console.log(`✅ ${firebaseConversations.length} conversas sincronizadas do Firebase`);
      }
    }, (error) => {
      console.error('❌ Erro ao ler dados do Firebase:', error);
    });

    console.log('🔗 Listener em tempo real do Firebase iniciado');
    firebaseConnection = true;

  } catch (error) {
    console.error('❌ Erro ao conectar Firebase Realtime:', error);
    firebaseConnection = false;
  }
}

/**
 * Atualizar o dashboard com dados do Firebase
 */
function updateDashboardWithFirebaseData(firebaseConversations) {
  // Atualizar total de conversas
  document.getElementById('total-conversations').textContent = firebaseConversations.length;

  // Atualizar lista de conversas
  const listHTML = firebaseConversations.length > 0
    ? firebaseConversations.map(conv => `
        <div class="conversation-item ${selectedConversationId === conv.id ? 'active' : ''}" 
             onclick="selectConversation('${conv.id}', true)">
            <div class="conversation-header">
                <div class="conversation-id">🔗 ${conv.id}</div>
                <div class="conversation-time">${formatTime(conv.received_at)}</div>
            </div>
            <div class="conversation-info">
                <span>👤 ${conv.sender?.name || 'Desconhecido'}</span>
                <span>📱 ${conv.sender?.phone_number || 'N/A'}</span>
            </div>
            <div class="conversation-info">
                <span class="badge badge-success">✓ ${conv.messages?.length || 0} mensagens</span>
            </div>
        </div>
    `).join('')
    : '<p>Nenhuma conversa encontrada</p>';

  document.getElementById('conversations-list').innerHTML = listHTML;
  document.getElementById('last-update').textContent = formatTime(new Date().toISOString());
}

/**
 * Buscar uma conversa específica no Firebase
 */
async function getConversationFromFirebase(conversationId) {
  if (!window.firebaseDatabase) {
    console.error('Firebase não inicializado');
    return null;
  }

  try {
    const { ref, get } = window.firebaseRefs;
    const db = window.firebaseDatabase;
    const snapshot = await get(ref(db, `conversations/${conversationId}`));
    
    if (snapshot.exists()) {
      return {
        id: conversationId,
        ...snapshot.val()
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar conversa do Firebase:', error);
    return null;
  }
}

/**
 * Iniciar monitoramento em tempo real quando Firebase estiver pronto
 */
function initFirebaseRealtime() {
  // Aguardar um pouco para garantir que o Firebase foi carregado
  setTimeout(() => {
    if (window.firebaseDatabase) {
      connectFirebaseRealtime();
    } else {
      console.warn('⚠️ Firebase ainda não disponível, tentando novamente...');
      setTimeout(initFirebaseRealtime, 2000);
    }
  }, 500);
}

// Limpar listener quando descarregar a página
window.addEventListener('beforeunload', () => {
  if (realtimeListener) {
    realtimeListener();
  }
});
