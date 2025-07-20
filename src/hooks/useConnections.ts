import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { InstanceStatusService } from '@/services/instanceStatus';

export const useConnections = (isAuthenticated: boolean) => {
  const [connections, setConnections] = useState<Array<{
    id: string;
    name: string;
    phone: string | null;
    status: string;
    connection_status: string;
    profile_name?: string;
    profile_pic_url?: string;
    whatsapp_number?: string;
    messages_count?: number;
    contacts_count?: number;
    chats_count?: number;
    owner_jid?: string;
    last_activity?: string;
  }>>([]);
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState(false);
  const { toast } = useToast();

  const fetchConnections = useCallback(async () => {
    if (!isAuthenticated) {
      setConnections([]);
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setConnections([]);
        return;
      }

      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar conexões:', error);
        return;
      }

      setConnections(data || []);
    } catch (error) {
      console.error('Erro ao buscar conexões:', error);
    }
  }, [isAuthenticated]);

  const updateAllInstancesStatus = async () => {
    setStatusUpdateInProgress(true);
    try {
      const result = await InstanceStatusService.updateAllInstancesStatus();
      
      if (result.success > 0) {
        await fetchConnections();
        toast({
          title: "Status atualizado",
          description: `${result.success} instâncias atualizadas${result.skipped > 0 ? `, ${result.skipped} puladas` : ''}.`
        });
      }
      
      if (result.failed > 0) {
        toast({
          title: "Algumas atualizações falharam",
          description: `${result.failed} instâncias não puderam ser atualizadas. Verifique sua conexão e configurações da API.`,
          variant: "destructive"
        });
      }
      
      if (result.success === 0 && result.failed === 0 && result.skipped === 0) {
        toast({
          title: "API não acessível",
          description: "Não foi possível conectar à Evolution API. Verifique as configurações.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status das instâncias:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status das instâncias.",
        variant: "destructive"
      });
    } finally {
      setStatusUpdateInProgress(false);
    }
  };

  const updateSingleInstanceStatus = async (connectionId: string, instanceName: string) => {
    try {
      const success = await InstanceStatusService.updateSingleInstanceStatus(connectionId, instanceName);
      
      if (success) {
        await fetchConnections();
        toast({
          title: "Status atualizado",
          description: `Status da instância "${instanceName}" atualizado.`
        });
      } else {
        toast({
          title: "Erro ao atualizar",
          description: `Não foi possível atualizar o status da instância "${instanceName}".`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status da instância:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o status da instância.",
        variant: "destructive"
      });
    }
  };

  const handleInstanceCreated = async (instanceData: {
    instance: {
      instanceName: string;
      instanceId: string;
      integration: string;
    };
    qrcode: {
      base64: string;
    };
    settings: Record<string, unknown>;
    hash: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          name: instanceData.instance.instanceName,
          phone: null,
          status: 'connecting',
          connection_status: 'connecting',
          qr_code: instanceData.qrcode.base64,
          instance_api_id: instanceData.instance.instanceId,
          session_data: {
            instanceId: instanceData.instance.instanceId,
            integration: instanceData.instance.integration,
            settings: instanceData.settings,
            hash: instanceData.hash
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar instância:', error);
        toast({
          title: "Erro ao salvar instância",
          description: "A instância foi criada mas não foi possível salvar no banco de dados.",
          variant: "destructive"
        });
        return;
      }

      await fetchConnections();
      
      toast({
        title: "Instância criada com sucesso",
        description: "A instância foi criada. Verificando status..."
      });

      setTimeout(async () => {
        await InstanceStatusService.checkNewInstanceStatus(data.id, instanceData.instance.instanceName);
        await fetchConnections();
      }, 5000);

    } catch (error) {
      console.error('Erro ao processar instância:', error);
      toast({
        title: "Erro ao processar instância",
        description: "Ocorreu um erro ao processar a instância criada.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConnections();
    }
  }, [isAuthenticated, fetchConnections]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Reduzir frequência para 2 minutos para evitar sobrecarga
    const interval = setInterval(async () => {
      if (!statusUpdateInProgress) {
        console.log('🔄 Atualização automática de status das instâncias...');
        await InstanceStatusService.updateAllInstancesStatus();
        await fetchConnections();
      }
    }, 120000); // 2 minutos

    return () => clearInterval(interval);
  }, [isAuthenticated, statusUpdateInProgress, fetchConnections]);

  return {
    connections,
    statusUpdateInProgress,
    fetchConnections,
    updateAllInstancesStatus,
    updateSingleInstanceStatus,
    handleInstanceCreated,
    refetchConnections: fetchConnections
  };
};