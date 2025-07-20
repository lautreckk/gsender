import { EVOLUTION_API_CONFIG, getEvolutionApiConfig } from '@/config/evolutionApi';

export interface SendTextMessageRequest {
  instanceName: string;
  number: string;
  text: string;
}

export interface SendMediaMessageRequest {
  instanceName: string;
  number: string;
  mediatype: 'image' | 'video' | 'document' | 'audio';
  mimetype: string;
  caption?: string;
  media: string; // URL ou base64
  fileName: string;
  delay?: number;
}

export interface SendAudioMessageRequest {
  instanceName: string;
  number: string;
  audio: string; // base64 puro
  delay?: number;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface SendTextMessageResponse extends SendMessageResponse {}
export interface SendMediaMessageResponse extends SendMessageResponse {}
export interface SendAudioMessageResponse extends SendMessageResponse {}

export interface MessageQueueItem {
  id: string;
  instanceName: string;
  contactNumber: string;
  contactName: string;
  messageText: string;
  campaignId: string;
  contactId: string;
  messageIndex: number;
  scheduledAt: Date;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  errorMessage?: string;
}

export class MessageService {
  private static readonly API_BASE_URL = EVOLUTION_API_CONFIG.BASE_URL;
  private static readonly API_KEY = EVOLUTION_API_CONFIG.API_KEY;
  private static readonly MAX_RETRY_ATTEMPTS = EVOLUTION_API_CONFIG.MAX_RETRY_ATTEMPTS;

  // Método para obter configuração dinâmica baseada em configurações do usuário
  private static getApiConfig(userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }) {
    return getEvolutionApiConfig(userApiSettings);
  }

  /**
   * Envia uma mensagem de áudio via WhatsApp
   */
  static async sendAudioMessage(request: SendAudioMessageRequest, userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }): Promise<SendAudioMessageResponse> {
    try {
      console.log(`🎵 [sendAudioMessage] Iniciando envio de áudio para ${request.number}`);
      console.log(`🎧 [sendAudioMessage] Detalhes:`, {
        audioLength: request.audio?.length || 0,
        delay: request.delay,
        instancia: request.instanceName
      });
      
      const apiConfig = this.getApiConfig(userApiSettings);
      console.log(`🔧 [sendAudioMessage] Config da API:`, {
        baseUrl: apiConfig.BASE_URL,
        hasApiKey: !!apiConfig.API_KEY
      });
      
      const payload = {
        number: request.number,
        audio: request.audio,
        delay: request.delay || 3600
      };

      console.log(`🚀 [sendAudioMessage] Payload completo:`, {
        number: payload.number,
        delay: payload.delay,
        audioLength: payload.audio?.length || 0,
        audioType: typeof payload.audio,
        audioPreview: payload.audio ? payload.audio.substring(0, 50) + '...' : 'NULL'
      });
      
      console.log(`📋 [sendAudioMessage] Comparação com CURL esperado:`, {
        payloadAtual: JSON.stringify(payload, null, 2),
        curlEsperado: `{
  "number": "${payload.number}",
  "audio": "base64...(${payload.audio?.length || 0} chars)",
  "delay": ${payload.delay}
}`
      });
      
      const url = `${apiConfig.BASE_URL}/message/sendWhatsAppAudio/${request.instanceName}`;
      console.log(`📡 [sendAudioMessage] URL da requisição: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiConfig.API_KEY
        },
        body: JSON.stringify(payload)
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
      console.log('✅ Resposta da API (áudio):', result);

      // Verificar se a resposta indica sucesso
      const isSuccess = result.success === true || 
                       result.status === 'success' || 
                       result.status === 'PENDING' ||
                       result.messageId ||
                       result.key; // Evolution API sempre retorna 'key' em caso de sucesso
                       
      console.log(`🔍 [sendAudioMessage] Verificando sucesso:`, {
        hasSuccess: result.success === true,
        status: result.status,
        hasMessageId: !!result.messageId,
        hasKey: !!result.key,
        finalSuccess: isSuccess
      });
      
      if (isSuccess) {
        return {
          success: true,
          messageId: result.messageId || result.key?.id || result.id || 'unknown',
          details: result
        };
      } else {
        let errorMessage = 'Erro desconhecido na API';
        if (result.error) {
          errorMessage = typeof result.error === 'object' ? JSON.stringify(result.error) : String(result.error);
        } else if (result.message) {
          errorMessage = typeof result.message === 'object' ? JSON.stringify(result.message) : String(result.message);
        }
        
        return {
          success: false,
          error: errorMessage,
          details: result
        };
      }

    } catch (error) {
      console.error('❌ Erro ao enviar áudio:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de rede ou conexão',
        details: { error: String(error) }
      };
    }
  }

  /**
   * Envia uma mensagem de mídia via WhatsApp
   */
  static async sendMediaMessage(request: SendMediaMessageRequest, userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }): Promise<SendMediaMessageResponse> {
    try {
      console.log(`📤 [sendMediaMessage] Iniciando envio de mídia para ${request.number}`);
      console.log(`📁 [sendMediaMessage] Detalhes:`, {
        tipo: request.mediatype,
        arquivo: request.fileName,
        mimeType: request.mimetype,
        caption: request.caption,
        mediaLength: request.media?.length || 0,
        instancia: request.instanceName
      });
      
      const apiConfig = this.getApiConfig(userApiSettings);
      console.log(`🔧 [sendMediaMessage] Config da API:`, {
        baseUrl: apiConfig.BASE_URL,
        hasApiKey: !!apiConfig.API_KEY
      });
      
      const payload = {
        number: request.number,
        mediatype: request.mediatype,
        mimetype: request.mimetype,
        caption: request.caption || '',
        media: request.media,
        fileName: request.fileName,
        delay: request.delay || 3200
      };

      console.log(`🚀 [sendMediaMessage] Payload completo:`, {
        number: payload.number,
        mediatype: payload.mediatype,
        mimetype: payload.mimetype,
        caption: payload.caption,
        fileName: payload.fileName,
        delay: payload.delay,
        mediaLength: payload.media?.length || 0,
        mediaType: typeof payload.media,
        mediaPreview: payload.media ? payload.media.substring(0, 50) + '...' : 'NULL'
      });
      
      console.log(`📋 [sendMediaMessage] Comparação com CURL esperado:`, {
        payloadAtual: JSON.stringify(payload, null, 2),
        curlEsperado: `{
  "number": "${payload.number}",
  "mediatype": "${payload.mediatype}",
  "mimetype": "${payload.mimetype}",
  "caption": "${payload.caption}",
  "media": "base64...(${payload.media?.length || 0} chars)",
  "fileName": "${payload.fileName}",
  "delay": ${payload.delay}
}`
      });
      
      const url = `${apiConfig.BASE_URL}/message/sendMedia/${request.instanceName}`;
      console.log(`📡 [sendMediaMessage] URL da requisição: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiConfig.API_KEY
        },
        body: JSON.stringify(payload)
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
      console.log('✅ Resposta da API (mídia):', result);

      // Verificar se a resposta indica sucesso
      // Para Evolution API: PENDING = mensagem aceita, SUCCESS = entregue
      const isSuccess = result.success === true || 
                       result.status === 'success' || 
                       result.status === 'PENDING' ||
                       result.messageId ||
                       result.key; // Evolution API sempre retorna 'key' em caso de sucesso
                       
      console.log(`🔍 [sendMessage] Verificando sucesso:`, {
        hasSuccess: result.success === true,
        status: result.status,
        hasMessageId: !!result.messageId,
        hasKey: !!result.key,
        finalSuccess: isSuccess
      });
      
      if (isSuccess) {
        return {
          success: true,
          messageId: result.messageId || result.key?.id || result.id || 'unknown',
          details: result
        };
      } else {
        // Melhor formatação de erro
        let errorMessage = 'Erro desconhecido na API';
        if (result.error) {
          errorMessage = typeof result.error === 'object' ? JSON.stringify(result.error) : String(result.error);
        } else if (result.message) {
          errorMessage = typeof result.message === 'object' ? JSON.stringify(result.message) : String(result.message);
        }
        
        return {
          success: false,
          error: errorMessage,
          details: result
        };
      }

    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de rede ou conexão',
        details: { error: String(error) }
      };
    }
  }

  /**
   * Envia uma mensagem de texto via WhatsApp
   */
  static async sendTextMessage(request: SendTextMessageRequest, userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }): Promise<SendTextMessageResponse> {
    try {
      console.log(`📤 Enviando mensagem via API para ${request.number}...`);
      
      const apiConfig = this.getApiConfig(userApiSettings);
      
      // Usar o formato correto da API
      const payload = {
        number: request.number,
        text: request.text,
        delay: 3200
      };
      
      const response = await fetch(`${apiConfig.BASE_URL}/message/sendText/${request.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiConfig.API_KEY
        },
        body: JSON.stringify(payload)
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
      console.log('✅ Resposta da API:', result);

      // Verificar se a resposta indica sucesso
      // Para Evolution API: PENDING = mensagem aceita, SUCCESS = entregue
      const isSuccess = result.success === true || 
                       result.status === 'success' || 
                       result.status === 'PENDING' ||
                       result.messageId ||
                       result.key; // Evolution API sempre retorna 'key' em caso de sucesso
                       
      console.log(`🔍 [sendMessage] Verificando sucesso:`, {
        hasSuccess: result.success === true,
        status: result.status,
        hasMessageId: !!result.messageId,
        hasKey: !!result.key,
        finalSuccess: isSuccess
      });
      
      if (isSuccess) {
        return {
          success: true,
          messageId: result.messageId || result.key?.id || result.id || 'unknown',
          details: result
        };
      } else {
        // Melhor formatação de erro
        let errorMessage = 'Erro desconhecido na API';
        if (result.error) {
          errorMessage = typeof result.error === 'object' ? JSON.stringify(result.error) : String(result.error);
        } else if (result.message) {
          errorMessage = typeof result.message === 'object' ? JSON.stringify(result.message) : String(result.message);
        }
        
        return {
          success: false,
          error: errorMessage,
          details: result
        };
      }

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de rede ou conexão',
        details: { error: String(error) }
      };
    }
  }

  /**
   * Processa variáveis em uma mensagem ({{nome}}, {{tag}}, etc.)
   */
  static processMessageVariables(messageText: string, contact: { nome: string; tag: string }): string {
    return messageText
      .replace(/\{\{nome\}\}/g, contact.nome)
      .replace(/\{\{tag\}\}/g, contact.tag)
      .replace(/\{\{numero\}\}/g, contact.numero || '');
  }

  /**
   * Envia uma mensagem com processamento de variáveis
   */
  static async sendProcessedMessage(
    instanceName: string,
    contact: { nome: string; numero: string; tag: string },
    messageText: string
  ): Promise<SendTextMessageResponse> {
    
    // Processar variáveis na mensagem
    const processedText = this.processMessageVariables(messageText, contact);
    
    console.log(`📝 Mensagem processada para ${contact.nome}:`, processedText);
    
    return await this.sendTextMessage({
      instanceName,
      number: contact.numero,
      text: processedText
    });
  }

  /**
   * Valida se um número de telefone está no formato correto
   */
  static validatePhoneNumber(number: string): boolean {
    // Remove todos os caracteres não numéricos
    const cleanNumber = number.replace(/\D/g, '');
    
    // Verifica se tem entre 10 e 15 dígitos (formato internacional)
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  /**
   * Formata um número de telefone para o padrão da API
   */
  static formatPhoneNumber(number: string): string {
    // Remove todos os caracteres não numéricos
    let cleanNumber = number.replace(/\D/g, '');
    
    // Se começar com 0, remove
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // Se não começar com código do país, adiciona Brasil (55)
    if (!cleanNumber.startsWith('55') && cleanNumber.length <= 11) {
      cleanNumber = '55' + cleanNumber;
    }
    
    return cleanNumber;
  }

  /**
   * Envia uma mensagem (texto ou mídia) baseado no tipo - método unificado para CampaignProcessor
   */
  static async sendMessage(params: {
    instanceId: string;
    phone: string;
    message: string;
    mediaUrl?: string;
    mediaType?: string;
    mimeType?: string;
  }, userApiSettings?: { evolutionApiUrl?: string; evolutionApiKey?: string }): Promise<SendMessageResponse> {
    
    console.log(`🚀 MessageService.sendMessage chamado:`, {
      instanceId: params.instanceId,
      phone: params.phone,
      messageLength: params.message?.length || 0,
      hasMediaUrl: !!params.mediaUrl,
      mediaType: params.mediaType,
      mediaUrlLength: params.mediaUrl?.length || 0
    });
    
    if (params.mediaUrl && params.mediaType) {
      // Verificar se é áudio para usar endpoint específico
      if (params.mediaType === 'audio') {
        console.log(`🎵 Enviando mensagem de ÁUDIO`);
        
        // Validar se mediaUrl não está vazia
        if (!params.mediaUrl.trim()) {
          console.error(`❌ AudioUrl está vazia para áudio`);
          return {
            success: false,
            error: `Dados de áudio vazios`
          };
        }
        
        const audioRequest = {
          instanceName: params.instanceId,
          number: params.phone,
          audio: params.mediaUrl, // Base64 puro para áudio
          delay: 3600
        };
        
        console.log(`🎧 Payload para sendAudioMessage:`, {
          instanceName: audioRequest.instanceName,
          number: audioRequest.number,
          audioLength: audioRequest.audio.length,
          delay: audioRequest.delay,
          audioPreview: audioRequest.audio.substring(0, 100) + '...'
        });
        
        return await this.sendAudioMessage(audioRequest, userApiSettings);
      } else {
        // Mensagem de mídia (imagem, vídeo, documento)
        console.log(`📱 Enviando mensagem de MÍDIA (${params.mediaType})`);
        
        // Validar se mediaUrl não está vazia
        if (!params.mediaUrl.trim()) {
          console.error(`❌ MediaUrl está vazia para tipo ${params.mediaType}`);
          return {
            success: false,
            error: `Dados de mídia vazios para ${params.mediaType}`
          };
        }
        
        const mediaRequest = {
          instanceName: params.instanceId,
          number: params.phone,
          mediatype: params.mediaType as 'image' | 'video' | 'document',
          mimetype: params.mimeType || this.getMimeType(params.mediaType), // Usar MIME type específico se fornecido
          caption: params.message,
          media: params.mediaUrl,
          fileName: `file.${this.getFileExtension(params.mediaType)}`,
          delay: 3200
        };
        
        console.log(`📤 Payload para sendMediaMessage:`, {
          instanceName: mediaRequest.instanceName,
          number: mediaRequest.number,
          mediatype: mediaRequest.mediatype,
          mimetype: mediaRequest.mimetype,
          mimeTypeSource: params.mimeType ? 'Database específico' : 'Fallback genérico',
          caption: mediaRequest.caption,
          fileName: mediaRequest.fileName,
          mediaLength: mediaRequest.media.length,
          mediaPreview: mediaRequest.media.substring(0, 100) + '...'
        });
        
        return await this.sendMediaMessage(mediaRequest, userApiSettings);
      }
    } else {
      // Mensagem de texto
      console.log(`📝 Enviando mensagem de TEXTO`);
      
      const textRequest = {
        instanceName: params.instanceId,
        number: params.phone,
        text: params.message
      };
      
      console.log(`📤 Payload para sendTextMessage:`, textRequest);
      
      return await this.sendTextMessage(textRequest, userApiSettings);
    }
  }

  /**
   * Método alternativo mantido para compatibilidade com campanhas complexas
   */
  static async sendComplexMessage(
    instanceName: string,
    contact: { nome: string; numero: string; tag: string },
    message: {
      type: 'text' | 'image' | 'video' | 'audio' | 'document';
      content: string;
      fileName?: string;
      mimeType?: string;
      mediaUrl?: string;
      mediaBase64?: string;
      delay?: number;
    }
  ): Promise<SendMessageResponse> {
    
    if (message.type === 'text') {
      const processedText = this.processMessageVariables(message.content, contact);
      return await this.sendTextMessage({
        instanceName,
        number: contact.numero,
        text: processedText
      });
    } else {
      // Mensagem de mídia
      const processedCaption = this.processMessageVariables(message.content, contact);
      const mediaData = message.mediaBase64 || message.mediaUrl || '';
      
      if (!mediaData) {
        return {
          success: false,
          error: 'Arquivo de mídia não encontrado'
        };
      }

      return await this.sendMediaMessage({
        instanceName,
        number: contact.numero,
        mediatype: message.type,
        mimetype: message.mimeType || 'application/octet-stream',
        caption: processedCaption,
        media: mediaData,
        fileName: message.fileName || 'arquivo',
        delay: message.delay
      });
    }
  }

  /**
   * Obtém o MIME type baseado no tipo de mídia
   */
  private static getMimeType(mediaType: string): string {
    const mimeTypes: { [key: string]: string } = {
      'image': 'image/jpeg',
      'video': 'video/mp4',
      'audio': 'audio/mpeg',
      'document': 'application/pdf'
    };
    return mimeTypes[mediaType] || 'application/octet-stream';
  }

  /**
   * Obtém a extensão do arquivo baseado no tipo de mídia
   */
  private static getFileExtension(mediaType: string): string {
    const extensions: { [key: string]: string } = {
      'image': 'jpg',
      'video': 'mp4',
      'audio': 'mp3',
      'document': 'pdf'
    };
    return extensions[mediaType] || 'bin';
  }

  /**
   * Executa uma campanha de mensagens com controle de intervalo
   */
  static async executeCampaign(
    instanceName: string,
    messages: Array<{
      type: 'text' | 'image' | 'video' | 'audio' | 'document';
      content: string;
      fileName?: string;
      mimeType?: string;
      mediaUrl?: string;
      mediaBase64?: string;
      delay?: number;
    }>,
    contacts: Array<{ nome: string; numero: string; tag: string }>,
    intervalSeconds: number,
    onProgress?: (sent: number, total: number, current: string) => void
  ): Promise<{ success: number; failed: number; details: any[] }> {
    
    const totalMessages = messages.length * contacts.length;
    let successCount = 0;
    let failedCount = 0;
    const details: any[] = [];

    console.log(`🚀 Iniciando campanha: ${messages.length} mensagens para ${contacts.length} contatos`);
    console.log(`⏱️ Intervalo entre envios: ${intervalSeconds} segundos`);

    for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
      const message = messages[messageIndex];
      
      for (let contactIndex = 0; contactIndex < contacts.length; contactIndex++) {
        const contact = contacts[contactIndex];
        const currentProgress = (messageIndex * contacts.length) + contactIndex + 1;
        
        try {
          // Callback de progresso
          if (onProgress) {
            onProgress(
              successCount, 
              totalMessages, 
              `Enviando ${message.type} para ${contact.nome} (${currentProgress}/${totalMessages})`
            );
          }

          // Validar e formatar número
          if (!this.validatePhoneNumber(contact.numero)) {
            console.warn(`⚠️ Número inválido para ${contact.nome}: ${contact.numero}`);
            failedCount++;
            details.push({
              contact: contact.nome,
              number: contact.numero,
              message: messageIndex + 1,
              messageType: message.type,
              success: false,
              error: 'Número de telefone inválido'
            });
            continue;
          }

          const formattedNumber = this.formatPhoneNumber(contact.numero);
          
          // Enviar mensagem (texto ou mídia)
          const result = await this.sendComplexMessage(instanceName, contact, message);
          
          if (result.success) {
            successCount++;
            console.log(`✅ ${message.type} enviada para ${contact.nome}`);
          } else {
            failedCount++;
            console.error(`❌ Falha ao enviar ${message.type} para ${contact.nome}:`, result.error);
          }
          
          details.push({
            contact: contact.nome,
            number: formattedNumber,
            message: messageIndex + 1,
            messageType: message.type,
            fileName: message.fileName,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
            details: result.details
          });

          // Aguardar intervalo antes do próximo envio (exceto no último)
          // Para mídia, usar delay personalizado se disponível
          const customDelay = message.delay || intervalSeconds * 1000;
          if (currentProgress < totalMessages) {
            console.log(`⏳ Aguardando ${customDelay/1000}s antes do próximo envio...`);
            await new Promise(resolve => setTimeout(resolve, customDelay));
          }

        } catch (error) {
          failedCount++;
          console.error(`❌ Erro inesperado ao enviar para ${contact.nome}:`, error);
          
          details.push({
            contact: contact.nome,
            number: contact.numero,
            message: messageIndex + 1,
            messageType: message.type,
            success: false,
            error: String(error)
          });
        }
      }
    }

    console.log(`🎉 Campanha finalizada: ${successCount} sucessos, ${failedCount} falhas`);
    
    return {
      success: successCount,
      failed: failedCount,
      details
    };
  }

  /**
   * Testa a conectividade com uma instância
   */
  static async testInstance(instanceName: string): Promise<boolean> {
    try {
      // Usar o endpoint de fetchInstances para verificar se a instância está conectada
      const response = await fetch(`${this.API_BASE_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.API_KEY
        }
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.connectionStatus === 'open';
      
    } catch (error) {
      console.error('Erro ao testar instância:', error);
      return false;
    }
  }
}