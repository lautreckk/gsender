import { Tables } from '@/integrations/supabase/types';

export interface ScheduleConfig {
  startTime?: string;
  endTime?: string;
  scheduleDays?: string[]; // Mudança: agora usa strings ['monday', 'tuesday'] em vez de números
  scheduleTime?: string;
  interval?: number;
  quickStart?: boolean; // Novo campo para indicar início rápido
}

export class CampaignScheduler {
  // Verificar se uma campanha deve executar agora
  shouldExecuteNow(campaign: Tables<'campaigns'>): boolean {
    const now = new Date();
    
    // Verificar se é uma campanha de início rápido
    if (this.isQuickStartCampaign(campaign)) {
      // Campanha de início rápido - deve executar imediatamente
      return true;
    }
    
    // Verificar se tem horário de início
    if (campaign.start_date) {
      const startDate = new Date(campaign.start_date);
      if (now < startDate) {
        return false; // Ainda não chegou a hora
      }
    }

    // Verificar se tem horário de fim
    if (campaign.end_date) {
      const endDate = new Date(campaign.end_date);
      if (now > endDate) {
        return false; // Campanha expirou
      }
    }

    // Verificar dias da semana (se configurado e não for início rápido)
    if (campaign.scheduled_days && Array.isArray(campaign.scheduled_days) && campaign.scheduled_days.length > 0) {
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      if (!campaign.scheduled_days.includes(currentDay)) {
        return false; // Hoje não é um dia agendado
      }
    }

    // Verificar horário do dia (se configurado)
    if (campaign.start_time && campaign.end_time) {
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      // Verificar se está dentro do horário operacional
      if (currentTime < campaign.start_time || currentTime > campaign.end_time) {
        return false;
      }
    }

    return true;
  }

  // Calcular próxima execução
  getNextExecutionTime(campaign: Tables<'campaigns'>): Date | null {
    const now = new Date();
    
    // Se tem horário específico configurado
    if (campaign.schedule_time) {
      const [hours, minutes] = campaign.schedule_time.split(':').map(Number);
      const nextExecution = new Date(now);
      nextExecution.setHours(hours, minutes, 0, 0);
      
      // Se já passou da hora hoje, agendar para amanhã
      if (nextExecution <= now) {
        nextExecution.setDate(nextExecution.getDate() + 1);
      }
      
      return nextExecution;
    }
    
    // Se tem intervalo configurado
    if (campaign.interval) {
      const nextExecution = new Date(now.getTime() + campaign.interval * 1000);
      return nextExecution;
    }
    
    // Execução imediata se não tem agendamento específico
    return null;
  }

  // Verificar se campanha está expirada
  isExpired(campaign: Tables<'campaigns'>): boolean {
    if (!campaign.end_time) return false;
    
    const now = new Date();
    const endTime = new Date(campaign.end_time);
    
    return now > endTime;
  }

  // Verificar se campanha deve iniciar
  shouldStart(campaign: Tables<'campaigns'>): boolean {
    const now = new Date();
    
    if (!campaign.start_time) return true;
    
    const startTime = new Date(campaign.start_time);
    return now >= startTime;
  }

  // Verificar se é uma campanha de início rápido
  isQuickStartCampaign(campaign: Tables<'campaigns'>): boolean {
    // Campanha de início rápido = sem data de início definida
    // Isso significa que deve executar imediatamente após criação
    return !campaign.start_date;
  }

  // Verificar se é uma campanha recorrente
  isRecurringCampaign(campaign: Tables<'campaigns'>): boolean {
    // Campanha recorrente = tem dias da semana configurados
    return campaign.scheduled_days && Array.isArray(campaign.scheduled_days) && campaign.scheduled_days.length > 0;
  }

  // Calcular delay para próxima execução
  calculateDelay(campaign: Tables<'campaigns'>): number {
    // Campanhas de início rápido executam imediatamente
    if (this.isQuickStartCampaign(campaign)) {
      return 0;
    }
    
    const nextExecution = this.getNextExecutionTime(campaign);
    
    if (!nextExecution) return 0;
    
    const now = new Date();
    const delay = nextExecution.getTime() - now.getTime();
    
    return Math.max(0, delay);
  }

  // Validar configuração de agendamento
  validateSchedule(schedule: ScheduleConfig): string[] {
    const errors: string[] = [];
    
    if (schedule.startTime && schedule.endTime) {
      const start = new Date(schedule.startTime);
      const end = new Date(schedule.endTime);
      
      if (start >= end) {
        errors.push('Data de início deve ser anterior à data de fim');
      }
    }
    
    if (schedule.scheduleDays && schedule.scheduleDays.length > 0) {
      const validDays = schedule.scheduleDays.every(day => day >= 0 && day <= 6);
      if (!validDays) {
        errors.push('Dias da semana devem estar entre 0 (domingo) e 6 (sábado)');
      }
    }
    
    if (schedule.scheduleTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(schedule.scheduleTime)) {
        errors.push('Formato de horário inválido (deve ser HH:MM)');
      }
    }
    
    if (schedule.interval && schedule.interval < 1) {
      errors.push('Intervalo deve ser maior que 0 segundos');
    }
    
    return errors;
  }

  // Validar campanha considerando modo imediato
  validateCampaign(campaign: Tables<'campaigns'>): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Verificar se é início rápido
    if (this.isQuickStartCampaign(campaign)) {
      // Campanha de início rápido - validações específicas
      warnings.push('Campanha de início rápido: será executada imediatamente após criação');
      
      // Se tem dias configurados em campanha de início rápido, avisar sobre comportamento
      if (campaign.scheduled_days && campaign.scheduled_days.length > 0) {
        warnings.push('Campanha de início rápido com dias configurados: executará apenas uma vez hoje');
      }
    } else {
      // Campanha agendada - validações específicas
      if (!campaign.start_date) {
        errors.push('Campanha agendada deve ter data de início');
      }
      
      if (campaign.start_date && campaign.end_date) {
        const start = new Date(campaign.start_date);
        const end = new Date(campaign.end_date);
        
        if (start >= end) {
          errors.push('Data de início deve ser anterior à data de fim');
        }
      }
      
      // Verificar se tem dias da semana configurados
      if (!campaign.scheduled_days || campaign.scheduled_days.length === 0) {
        warnings.push('Campanha sem dias da semana configurados: executará apenas uma vez');
      }
    }
    
    // Validações gerais
    if (campaign.start_time && campaign.end_time) {
      if (campaign.start_time >= campaign.end_time) {
        errors.push('Horário de início deve ser anterior ao horário de fim');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}