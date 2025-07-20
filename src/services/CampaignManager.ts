import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { CampaignScheduler } from './CampaignScheduler';
import { CampaignProcessor, CampaignExecution } from './CampaignProcessor';

export class CampaignManager {
  private static instance: CampaignManager;
  private scheduler: CampaignScheduler;
  private processor: CampaignProcessor;
  private activeExecutions: Map<string, CampaignExecution> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  private constructor() {
    this.scheduler = new CampaignScheduler();
    this.processor = new CampaignProcessor();
  }

  static getInstance(): CampaignManager {
    if (!CampaignManager.instance) {
      CampaignManager.instance = new CampaignManager();
    }
    return CampaignManager.instance;
  }

  // Iniciar o gerenciador
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 CampaignManager iniciado');
    
    // Verificar campanhas ativas a cada 30 segundos
    this.scheduleCheck();
  }

  // Parar o gerenciador
  stop() {
    this.isRunning = false;
    
    // Limpar todos os timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    
    console.log('⏹️ CampaignManager parado');
  }

  // Agendar próxima verificação
  private scheduleCheck() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      await this.checkActiveCampaigns();
      this.scheduleCheck(); // Reagendar
    }, 30000); // 30 segundos
  }

  // Verificar campanhas ativas
  private async checkActiveCampaigns() {
    try {
      console.log('🔍 Verificando campanhas ativas...');
      
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('❌ Erro ao buscar campanhas:', error);
        return;
      }

      if (!campaigns || campaigns.length === 0) {
        console.log('📭 Nenhuma campanha ativa encontrada');
        return;
      }

      console.log(`📋 Encontradas ${campaigns.length} campanhas ativas`);

      for (const campaign of campaigns) {
        await this.processCampaign(campaign);
      }
    } catch (error) {
      console.error('❌ Erro na verificação de campanhas:', error);
    }
  }

  // Processar uma campanha específica
  private async processCampaign(campaign: Tables<'campaigns'>) {
    try {
      const campaignId = campaign.id;
      
      // Verificar se já está sendo executada
      if (this.activeExecutions.has(campaignId)) {
        console.log(`⏳ Campanha ${campaign.name} já está sendo executada`);
        return;
      }

      // Verificar se campanha está expirada
      if (this.scheduler.isExpired(campaign)) {
        console.log(`⏰ Campanha ${campaign.name} expirou`);
        await this.processor.markCampaignCompleted(campaignId, 'expired');
        return;
      }

      // Verificar se deve executar agora
      if (!this.scheduler.shouldExecuteNow(campaign)) {
        console.log(`⏰ Campanha ${campaign.name} não deve executar agora`);
        return;
      }

      console.log(`🎯 Iniciando execução da campanha: ${campaign.name}`);

      // Inicializar execução
      const execution: CampaignExecution = {
        campaignId,
        status: 'running',
        currentMessageIndex: 0,
        sentMessages: campaign.sent_messages || 0,
        failedMessages: 0,
        lastExecution: new Date().toISOString()
      };

      this.activeExecutions.set(campaignId, execution);

      // Executar campanha
      const result = await this.processor.processMessages(campaign, execution);

      // Atualizar status da execução
      if (result.success) {
        execution.status = 'completed';
        console.log(`✅ Campanha ${campaign.name} executada com sucesso`);
        
        // Verificar se há mais contatos pendentes
        const hasMoreContacts = await this.hasMorePendingContacts(campaignId);
        
        if (!hasMoreContacts) {
          await this.processor.markCampaignCompleted(campaignId, 'finished');
        }
      } else {
        execution.status = 'error';
        execution.error = result.error;
        console.error(`❌ Erro na execução da campanha ${campaign.name}:`, result.error);
      }

      // Remover da lista de execuções ativas
      this.activeExecutions.delete(campaignId);

    } catch (error) {
      console.error(`❌ Erro ao processar campanha ${campaign.name}:`, error);
      
      // Marcar execução como erro
      const execution = this.activeExecutions.get(campaign.id);
      if (execution) {
        execution.status = 'error';
        execution.error = error instanceof Error ? error.message : 'Erro desconhecido';
      }
      
      this.activeExecutions.delete(campaign.id);
    }
  }

  // Verificar se há mais contatos pendentes
  private async hasMorePendingContacts(campaignId: string): Promise<boolean> {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .limit(1);

    if (error) {
      console.error('Erro ao verificar contatos pendentes:', error);
      return false;
    }

    return contacts && contacts.length > 0;
  }

  // Obter execuções ativas
  getActiveExecutions(): CampaignExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  // Obter execução específica
  getExecution(campaignId: string): CampaignExecution | undefined {
    return this.activeExecutions.get(campaignId);
  }

  // Pausar campanha manualmente
  async pauseCampaign(campaignId: string) {
    const execution = this.activeExecutions.get(campaignId);
    if (execution) {
      execution.status = 'paused';
    }
    
    await this.processor.pauseCampaign(campaignId);
  }

  // Retomar campanha
  async resumeCampaign(campaignId: string) {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'active'
        })
        .eq('id', campaignId);

      if (error) {
        console.error('❌ Erro ao retomar campanha:', error);
      } else {
        console.log(`▶️ Campanha ${campaignId} retomada`);
      }
    } catch (err) {
      console.error('❌ Erro ao retomar campanha:', err);
    }
  }

  // Obter estatísticas do sistema
  async getSystemStats() {
    const activeExecutions = this.getActiveExecutions();
    
    const stats = {
      totalActive: activeExecutions.length,
      totalSent: activeExecutions.reduce((sum, exec) => sum + exec.sentMessages, 0),
      totalFailed: activeExecutions.reduce((sum, exec) => sum + exec.failedMessages, 0),
      runningExecutions: activeExecutions.filter(exec => exec.status === 'running').length,
      errorExecutions: activeExecutions.filter(exec => exec.status === 'error').length
    };

    return stats;
  }

  // Forçar verificação de campanhas
  async forceCheck() {
    console.log('🔄 Verificação forçada de campanhas');
    await this.checkActiveCampaigns();
  }
}