import { supabase } from '@/integrations/supabase/client';

interface InstanceStatusResponse {
  id: string;
  name: string;
  connectionStatus: 'open' | 'close' | 'connecting';
  ownerJid: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
  integration: string;
  number: string | null;
  businessId: string | null;
  token: string;
  clientName: string;
  disconnectionReasonCode: number | null;
  disconnectionObject: string | null;
  disconnectionAt: string | null;
  createdAt: string;
  updatedAt: string;
  Setting: {
    id: string;
    rejectCall: boolean;
    msgCall: string;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
    wavoipToken: string;
    createdAt: string;
    updatedAt: string;
    instanceId: string;
  };
  _count: {
    Message: number;
    Contact: number;
    Chat: number;
  };
}

export class InstanceStatusService {
  private static readonly API_BASE_URL = 'https://api.gruposena.club';
  private static readonly API_KEY = '3ac318ab976bc8c75dfe827e865a576c';

  // Obter configurações dinâmicas da API
  private static async getApiConfig() {
    try {
      // Tentar carregar configurações do usuário primeiro
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['evolution_api_url', 'evolution_api_key']);
      
      let apiUrl = this.API_BASE_URL;
      let apiKey = this.API_KEY;
      
      if (data && data.length > 0) {
        data.forEach(({ key, value }) => {
          let parsedValue = value;
          if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{') || value.startsWith('['))) {
            try {
              parsedValue = JSON.parse(value);
            } catch {
              parsedValue = value;
            }
          }
          
          // Só usar se o valor não for vazio/null
          if (key === 'evolution_api_url' && parsedValue && parsedValue.trim() !== '') {
            apiUrl = parsedValue.trim();
          } else if (key === 'evolution_api_key' && parsedValue && parsedValue.trim() !== '') {
            apiKey = parsedValue.trim();
          }
        });
      }
      
      console.log('🔧 Configurações da API carregadas:', { 
        apiUrl, 
        hasApiKey: !!apiKey,
        source: data && data.length > 0 ? 'database' : 'default'
      });
      
      return { apiUrl, apiKey };
    } catch (error) {
      console.warn('⚠️ Erro ao carregar configurações, usando padrão:', error);
      return { apiUrl: this.API_BASE_URL, apiKey: this.API_KEY };
    }
  }

  /**
   * Testa conectividade com a API
   */
  private static async testApiConnectivity(apiUrl: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 segundos timeout - mais rápido
      });
      
      // Aceitar códigos de sucesso e códigos que indicam API funcionando
      return response.ok || response.status === 404 || response.status === 401; // 401 = API key inválida mas API funciona
    } catch (error) {
      console.warn(`⚠️ Teste de conectividade falhou para ${apiUrl}:`, error);
      return false;
    }
  }

  /**
   * Busca o status de uma instância específica pela API
   */
  static async fetchInstanceStatus(instanceName: string): Promise<InstanceStatusResponse | null> {
    try {
      const { apiUrl, apiKey } = await this.getApiConfig();
      
      // Testar conectividade primeiro (mas não falhar se não conectar)
      const isApiAccessible = await this.testApiConnectivity(apiUrl, apiKey);
      if (!isApiAccessible) {
        console.warn(`⚠️ Teste de conectividade falhou, tentando buscar instância mesmo assim: ${apiUrl}`);
        // Não retornar null aqui - tentar mesmo assim
      }
      
      const response = await fetch(
        `${apiUrl}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
        {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(15000) // 15 segundos timeout
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        console.error(`❌ Erro HTTP ${response.status} ao buscar status da instância ${instanceName}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: `${apiUrl}/instance/fetchInstances?instanceName=${instanceName}`
        });
        return null;
      }

      const data: InstanceStatusResponse[] = await response.json();
      
      // A API retorna um array, pegamos o primeiro item
      return data.length > 0 ? data[0] : null;

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`⏱️ Timeout ao buscar status da instância ${instanceName}`);
        } else if (error.message.includes('fetch')) {
          console.error(`🌐 Erro de rede ao buscar status da instância ${instanceName}:`, error.message);
        } else {
          console.error(`❌ Erro desconhecido ao buscar status da instância ${instanceName}:`, error);
        }
      } else {
        console.error(`❌ Erro ao buscar status da instância ${instanceName}:`, error);
      }
      return null;
    }
  }

  /**
   * Atualiza o status de uma instância no banco de dados
   */
  static async updateInstanceStatusInDB(connectionId: string, apiData: InstanceStatusResponse) {
    try {
      const { error } = await supabase
        .from('connections')
        .update({
          connection_status: apiData.connectionStatus,
          owner_jid: apiData.ownerJid,
          profile_name: apiData.profileName,
          profile_pic_url: apiData.profilePicUrl,
          whatsapp_number: apiData.number,
          disconnection_reason_code: apiData.disconnectionReasonCode,
          disconnection_at: apiData.disconnectionAt,
          messages_count: apiData._count.Message,
          contacts_count: apiData._count.Contact,
          chats_count: apiData._count.Chat,
          instance_api_id: apiData.id,
          // Atualizar phone se tiver número disponível
          phone: apiData.number || apiData.ownerJid?.replace('@s.whatsapp.net', '') || null,
          // Mapear connection_status para status mais simples
          status: this.mapConnectionStatusToStatus(apiData.connectionStatus),
          last_activity: new Date().toISOString(),
          // Atualizar session_data com informações da API
          session_data: {
            ...apiData,
            lastStatusUpdate: new Date().toISOString()
          }
        })
        .eq('id', connectionId);

      if (error) {
        console.error('Erro ao atualizar status da instância no banco:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status da instância:', error);
      return false;
    }
  }

  /**
   * Mapeia o status da API para o status simplificado usado na interface
   */
  private static mapConnectionStatusToStatus(connectionStatus: string): string {
    switch (connectionStatus) {
      case 'open':
        return 'connected';
      case 'close':
        return 'disconnected';
      case 'connecting':
        return 'connecting';
      default:
        return 'error';
    }
  }

  /**
   * Atualiza o status de uma instância específica
   */
  static async updateSingleInstanceStatus(connectionId: string, instanceName: string): Promise<boolean> {
    try {
      const apiData = await this.fetchInstanceStatus(instanceName);
      
      if (!apiData) {
        console.warn(`⚠️ Não foi possível buscar dados da instância ${instanceName} - mantendo status atual`);
        // NÃO marcar como erro imediatamente - pode ser problema temporário
        // Só atualizar last_activity
        await supabase
          .from('connections')
          .update({
            last_activity: new Date().toISOString()
          })
          .eq('id', connectionId);
        
        return false;
      }

      return await this.updateInstanceStatusInDB(connectionId, apiData);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da instância:', error);
      return false;
    }
  }

  /**
   * Atualiza o status de todas as instâncias ativas
   */
  static async updateAllInstancesStatus(): Promise<{ success: number; failed: number; skipped: number }> {
    try {
      console.log('🔄 Iniciando atualização de status de todas as instâncias...');
      
      // Primeiro testar conectividade da API
      const { apiUrl, apiKey } = await this.getApiConfig();
      const isApiAccessible = await this.testApiConnectivity(apiUrl, apiKey);
      
      if (!isApiAccessible) {
        console.warn(`⚠️ API Evolution não acessível: ${apiUrl}. Pulando atualização automática.`);
        return { success: 0, failed: 0, skipped: 0 };
      }
      
      // Buscar todas as conexões ativas do banco
      const { data: connections, error } = await supabase
        .from('connections')
        .select('id, name, status, last_activity')
        .neq('status', 'error'); // Não atualizar instâncias com erro permanente

      if (error) {
        console.error('Erro ao buscar conexões:', error);
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;
      let skipped = 0;

      // Processar instâncias em lotes para evitar sobrecarga
      const batchSize = 3;
      for (let i = 0; i < (connections || []).length; i += batchSize) {
        const batch = connections!.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (connection) => {
            try {
              // Pular instâncias atualizadas recentemente (menos de 5 minutos)
              if (connection.last_activity) {
                const lastActivity = new Date(connection.last_activity);
                const now = new Date();
                const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
                
                if (diffMinutes < 5 && connection.status === 'connected') {
                  skipped++;
                  return;
                }
              }
              
              const result = await this.updateSingleInstanceStatus(connection.id, connection.name);
              if (result) {
                success++;
              } else {
                failed++;
              }
            } catch (error) {
              console.error(`❌ Erro ao processar instância ${connection.name}:`, error);
              failed++;
            }
          })
        );
        
        // Pequena pausa entre lotes
        if (i + batchSize < (connections || []).length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ Atualização concluída: ${success} sucesso, ${failed} falhas, ${skipped} puladas`);
      return { success, failed, skipped };
    } catch (error) {
      console.error('❌ Erro ao atualizar status de todas as instâncias:', error);
      return { success: 0, failed: 0, skipped: 0 };
    }
  }

  /**
   * Verifica se uma instância específica está conectada
   */
  static async checkInstanceConnection(instanceName: string): Promise<boolean> {
    const apiData = await this.fetchInstanceStatus(instanceName);
    return apiData?.connectionStatus === 'open';
  }

  /**
   * Obtém estatísticas de uma instância
   */
  static async getInstanceStats(instanceName: string): Promise<{
    messages: number;
    contacts: number;
    chats: number;
  } | null> {
    const apiData = await this.fetchInstanceStatus(instanceName);
    
    if (!apiData) {
      return null;
    }

    return {
      messages: apiData._count.Message,
      contacts: apiData._count.Contact,
      chats: apiData._count.Chat
    };
  }

  /**
   * Força a atualização de status após criação de instância
   */
  static async checkNewInstanceStatus(connectionId: string, instanceName: string, maxRetries: number = 10): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      // Aguardar alguns segundos antes de tentar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const apiData = await this.fetchInstanceStatus(instanceName);
      
      if (apiData) {
        await this.updateInstanceStatusInDB(connectionId, apiData);
        return true;
      }
    }
    
    return false;
  }
}