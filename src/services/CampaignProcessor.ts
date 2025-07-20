import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { MessageService } from './messageService';

export interface CampaignExecution {
  campaignId: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  currentMessageIndex: number;
  sentMessages: number;
  failedMessages: number;
  lastExecution: string;
  nextExecution?: string;
  error?: string;
}

export interface ProcessingResult {
  success: boolean;
  sentMessages: number;
  failedMessages: number;
  error?: string;
}

export class CampaignProcessor {
  private apiSettings: { evolutionApiUrl?: string; evolutionApiKey?: string } = {};

  constructor() {
    // MessageService é uma classe estática, não precisa de instanciação
    this.loadApiSettings();
  }

  // Carregar configurações da API do banco de dados
  private async loadApiSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['evolution_api_url', 'evolution_api_key']);
      
      if (data && !error) {
        data.forEach(({ key, value }) => {
          let parsedValue = value;
          if (typeof value === 'string') {
            try {
              // Only try to parse if it looks like JSON
              if (value.startsWith('"') || value.startsWith('{') || value.startsWith('[')) {
                parsedValue = JSON.parse(value);
              } else {
                parsedValue = value;
              }
            } catch (error) {
              parsedValue = value;
            }
          }
          
          if (key === 'evolution_api_url') {
            this.apiSettings.evolutionApiUrl = parsedValue;
          } else if (key === 'evolution_api_key') {
            this.apiSettings.evolutionApiKey = parsedValue;
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da API:', error);
      // Continua com configurações padrão em caso de erro
    }
  }

  // Processar mensagens de uma campanha
  async processMessages(campaign: Tables<'campaigns'>, execution: CampaignExecution): Promise<ProcessingResult> {
    try {
      console.log(`📨 Processando mensagens da campanha: ${campaign.name}`);

      // Buscar mensagens da campanha
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('order_index');

      if (error || !messages || messages.length === 0) {
        console.log(`📭 Nenhuma mensagem encontrada para campanha ${campaign.name}`);
        return { success: false, sentMessages: 0, failedMessages: 0, error: 'Nenhuma mensagem encontrada' };
      }

      // Buscar contatos da campanha
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'pending');

      if (contactsError || !contacts || contacts.length === 0) {
        console.log(`📭 Nenhum contato pendente para campanha ${campaign.name}`);
        return { success: false, sentMessages: 0, failedMessages: 0, error: 'Nenhum contato pendente' };
      }

      let sentCount = 0;
      let failedCount = 0;

      // Processar cada contato
      for (const contact of contacts) {
        try {
          // Verificar se campanha ainda está ativa
          if (execution.status !== 'running') {
            console.log(`⏹️ Campanha ${campaign.name} foi pausada/parada`);
            break;
          }

          // Processar mensagem para este contato (individual) ou grupo
          // Note: contact.numero pode ser um número individual ou group ID (termina com @g.us)
          const result = await this.processMessageForContact(campaign, contact, messages);
          
          if (result.success) {
            sentCount++;
            
            // Atualizar status do contato
            await this.updateContactStatus(contact.id, 'sent');
            
            console.log(`✅ Mensagem enviada para ${contact.numero || contact.phone}`);
          } else {
            failedCount++;
            
            // Atualizar status do contato com erro
            await this.updateContactStatus(contact.id, 'failed', result.error);
            
            console.log(`❌ Falha ao enviar para ${contact.numero || contact.phone}: ${result.error}`);
          }

          // Atualizar execução
          execution.sentMessages += result.success ? 1 : 0;
          execution.failedMessages += result.success ? 0 : 1;

          // Intervalo entre mensagens
          if (campaign.interval && campaign.interval > 0) {
            await this.delay(campaign.interval * 1000);
          }

        } catch (error) {
          failedCount++;
          console.error(`❌ Erro ao processar contato ${contact.numero || contact.phone}:`, error);
          
          await this.updateContactStatus(contact.id, 'failed', error instanceof Error ? error.message : 'Erro desconhecido');
        }
      }

      // Atualizar estatísticas da campanha
      await this.updateCampaignStats(campaign.id, sentCount, failedCount);

      return {
        success: true,
        sentMessages: sentCount,
        failedMessages: failedCount
      };

    } catch (error) {
      console.error(`❌ Erro no processamento da campanha ${campaign.name}:`, error);
      return {
        success: false,
        sentMessages: 0,
        failedMessages: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Processar mensagem para um contato específico
  private async processMessageForContact(
    campaign: Tables<'campaigns'>, 
    contact: any, 
    messages: any[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar conexão da campanha
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', campaign.instance_id)
        .single();

      if (connectionError || !connection) {
        return { success: false, error: 'Conexão não encontrada' };
      }

      // Verificar se conexão está ativa
      if (connection.status !== 'connected') {
        return { success: false, error: 'Conexão não está ativa' };
      }

      // Processar cada mensagem
      for (const message of messages) {
        console.log(`📤 Processando mensagem tipo "${message.type}" para ${contact.nome || contact.name}`);
        
        // Determinar se é mensagem de mídia ou texto
        const isMediaMessage = message.type !== 'text';
        const processedContent = this.replacePlaceholders(message.content || '', {
          name: contact.nome || contact.name,
          phone: contact.numero || contact.phone,
          email: contact.email,
          custom_fields: contact.custom_fields
        });

        if (isMediaMessage) {
          // Para mensagens de mídia, validar se tem dados de mídia
          console.log(`🔍 Verificando dados de mídia:`, {
            type: message.type,
            fileName: message.file_name,
            hasMediaUrl: !!message.media_url,
            hasMediaBase64: !!message.media_base64,
            mediaUrlLength: message.media_url ? message.media_url.length : 0,
            mediaBase64Length: message.media_base64 ? message.media_base64.length : 0
          });

          // Para envio: usar media_base64 (base64 puro) ou media_url (URL externa)
          let mediaDataForApi;
          
          if (message.media_base64) {
            // Base64 puro (já limpo, sem header)
            mediaDataForApi = message.media_base64;
            console.log(`📤 Usando media_base64 (base64 puro): ${mediaDataForApi.length} caracteres`);
          } else if (message.media_url && !message.media_url.startsWith('data:')) {
            // URL externa
            mediaDataForApi = message.media_url;
            console.log(`📤 Usando media_url (URL externa): ${mediaDataForApi}`);
          } else {
            console.error(`❌ Mensagem de ${message.type} sem dados válidos! ID: ${message.id}`);
            return { 
              success: false, 
              error: `Mensagem de ${message.type} "${message.file_name || 'arquivo'}" não possui dados de mídia válidos (URL externa ou Base64 puro).` 
            };
          }

          console.log(`✅ Enviando ${message.type} com dados: ${mediaDataForApi.startsWith('http') ? 'URL' : 'Base64'} (${mediaDataForApi.length} chars)`);
          
          const result = await MessageService.sendMessage({
            instanceId: connection.name,
            phone: contact.numero || contact.phone,
            message: processedContent,
            mediaUrl: mediaDataForApi,
            mediaType: message.type,
            mimeType: message.mime_type // Passar MIME type específico do arquivo
          }, this.apiSettings);

          if (!result.success) {
            console.error(`❌ Falha ao enviar ${message.type}:`, result.error);
            return { success: false, error: `Erro ao enviar ${message.type}: ${result.error}` };
          }

          console.log(`✅ ${message.type} enviada com sucesso para ${contact.nome || contact.name}`);
        } else {
          // Mensagem de texto
          console.log(`📝 Enviando texto para ${contact.nome || contact.name}: "${processedContent.substring(0, 50)}..."`);
          
          const result = await MessageService.sendMessage({
            instanceId: connection.name,
            phone: contact.numero || contact.phone,
            message: processedContent
          }, this.apiSettings);

          if (!result.success) {
            console.error(`❌ Falha ao enviar texto:`, result.error);
            return { success: false, error: `Erro ao enviar texto: ${result.error}` };
          }

          console.log(`✅ Texto enviado com sucesso para ${contact.nome || contact.name}`);
        }

        // Delay entre mensagens se houver múltiplas
        if (messages.length > 1) {
          console.log(`⏳ Aguardando 2s antes da próxima mensagem...`);
          await this.delay(2000); // 2 segundos entre mensagens
        }
      }

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Substituir placeholders na mensagem
  private replacePlaceholders(content: string, contact: {
    name?: string;
    phone?: string;
    email?: string;
    custom_fields?: Record<string, any>;
  }): string {
    let message = content;
    
    // Substituir placeholders básicos
    message = message.replace(/\{\{nome\}\}/g, contact.name || '');
    message = message.replace(/\{\{telefone\}\}/g, contact.phone || '');
    message = message.replace(/\{\{email\}\}/g, contact.email || '');
    
    // Substituir campos personalizados
    if (contact.custom_fields) {
      Object.entries(contact.custom_fields).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        message = message.replace(placeholder, String(value));
      });
    }
    
    return message;
  }

  // Atualizar status do contato
  private async updateContactStatus(contactId: string, status: string, error?: string) {
    const updateData: any = {
      status
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (error) {
      updateData.error_message = error;
    }

    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId);

      if (updateError) {
        console.error('❌ Erro ao atualizar status do contato:', updateError);
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar status do contato:', err);
    }
  }

  // Atualizar estatísticas da campanha
  private async updateCampaignStats(campaignId: string, sentMessages: number, failedMessages: number) {
    try {
      const { data: currentStats } = await supabase
        .from('campaigns')
        .select('sent_messages, failed_messages')
        .eq('id', campaignId)
        .single();

      const newSentMessages = (currentStats?.sent_messages || 0) + sentMessages;
      const newFailedMessages = (currentStats?.failed_messages || 0) + failedMessages;

      const { error } = await supabase
        .from('campaigns')
        .update({
          sent_messages: newSentMessages,
          failed_messages: newFailedMessages
        })
        .eq('id', campaignId);

      if (error) {
        console.error('❌ Erro ao atualizar estatísticas da campanha:', error);
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar estatísticas da campanha:', err);
    }
  }

  // Marcar campanha como completa
  async markCampaignCompleted(campaignId: string, reason: string = 'finished') {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'completed'
        })
        .eq('id', campaignId);

      if (error) {
        console.error('❌ Erro ao marcar campanha como completa:', error);
      } else {
        console.log(`✅ Campanha ${campaignId} marcada como completa: ${reason}`);
      }
    } catch (err) {
      console.error('❌ Erro ao marcar campanha como completa:', err);
    }
  }

  // Pausar campanha
  async pauseCampaign(campaignId: string) {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'paused'
        })
        .eq('id', campaignId);

      if (error) {
        console.error('❌ Erro ao pausar campanha:', error);
      } else {
        console.log(`⏸️ Campanha ${campaignId} pausada`);
      }
    } catch (err) {
      console.error('❌ Erro ao pausar campanha:', err);
    }
  }

  // Delay helper
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}