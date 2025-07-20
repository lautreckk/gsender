import { EVOLUTION_API_CONFIG, getEvolutionApiConfig } from '@/config/evolutionApi';

export interface DeleteInstanceResponse {
  success: boolean;
  error?: string;
  details?: any;
}

export interface GenerateQRCodeResponse {
  success: boolean;
  qrCode?: string; // base64
  error?: string;
  details?: any;
}

export class InstanceManagementService {
  private static readonly API_BASE_URL = EVOLUTION_API_CONFIG.BASE_URL;
  private static readonly API_KEY = EVOLUTION_API_CONFIG.API_KEY;

  // Método para obter configuração dinâmica baseada em configurações do usuário
  private static getApiConfig(userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }) {
    return getEvolutionApiConfig(userApiSettings);
  }

  /**
   * Deleta uma instância da Evolution API
   */
  static async deleteInstance(
    instanceName: string, 
    userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }
  ): Promise<DeleteInstanceResponse> {
    try {
      console.log(`🗑️ [deleteInstance] Iniciando exclusão da instância: ${instanceName}`);
      
      const apiConfig = this.getApiConfig(userApiSettings);
      console.log(`🔧 [deleteInstance] Config da API:`, {
        baseUrl: apiConfig.BASE_URL,
        hasApiKey: !!apiConfig.API_KEY
      });

      const url = `${apiConfig.BASE_URL}/instance/delete/${instanceName}`;
      console.log(`📡 [deleteInstance] URL da requisição: ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': apiConfig.API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro HTTP ${response.status}:`, errorText);
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          details: { status: response.status, response: errorText }
        };
      }

      const result = await response.json();
      console.log('✅ Resposta da API (delete):', result);

      return {
        success: true,
        details: result
      };

    } catch (error) {
      console.error('❌ Erro ao deletar instância:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de rede ou conexão',
        details: { error: String(error) }
      };
    }
  }

  /**
   * Gera QR Code para uma instância existente
   */
  static async generateQRCode(
    instanceName: string, 
    userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }
  ): Promise<GenerateQRCodeResponse> {
    try {
      console.log(`📱 [generateQRCode] Gerando QR code para instância: ${instanceName}`);
      
      const apiConfig = this.getApiConfig(userApiSettings);
      console.log(`🔧 [generateQRCode] Config da API:`, {
        baseUrl: apiConfig.BASE_URL,
        hasApiKey: !!apiConfig.API_KEY
      });

      const url = `${apiConfig.BASE_URL}/instance/connect/${instanceName}`;
      console.log(`📡 [generateQRCode] URL da requisição: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': apiConfig.API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro HTTP ${response.status}:`, errorText);
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          details: { status: response.status, response: errorText }
        };
      }

      const result = await response.json();
      console.log('✅ Resposta da API (QR code):', result);

      // Verificar se o resultado contém o QR code
      let qrCodeBase64 = null;
      
      // Diferentes formatos possíveis de resposta da API
      if (result.qrcode) {
        qrCodeBase64 = result.qrcode.base64 || result.qrcode;
      } else if (result.base64) {
        qrCodeBase64 = result.base64;
      } else if (result.qr) {
        qrCodeBase64 = result.qr.base64 || result.qr;
      }

      if (!qrCodeBase64) {
        console.error('❌ QR code não encontrado na resposta:', result);
        return {
          success: false,
          error: 'QR code não encontrado na resposta da API',
          details: result
        };
      }

      console.log(`✅ QR code gerado com sucesso - ${qrCodeBase64.length} caracteres`);

      return {
        success: true,
        qrCode: qrCodeBase64,
        details: result
      };

    } catch (error) {
      console.error('❌ Erro ao gerar QR code:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de rede ou conexão',
        details: { error: String(error) }
      };
    }
  }

  /**
   * Obtém informações da instância
   */
  static async getInstanceInfo(
    instanceName: string,
    userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`ℹ️ [getInstanceInfo] Buscando informações da instância: ${instanceName}`);
      
      const apiConfig = this.getApiConfig(userApiSettings);
      const url = `${apiConfig.BASE_URL}/instance/fetchInstances?instanceName=${instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': apiConfig.API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('✅ Informações da instância:', result);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('❌ Erro ao buscar informações da instância:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de rede ou conexão'
      };
    }
  }
}