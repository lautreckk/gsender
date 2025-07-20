import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { campaignExecutor } from '@/services/campaignExecutor';

export const useCampaigns = (isAuthenticated: boolean) => {
  const [campaigns, setCampaigns] = useState<Tables<'campaigns'>[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCampaigns = useCallback(async () => {
    if (!isAuthenticated) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar campanhas:', error);
        toast({
          title: 'Erro ao carregar campanhas',
          description: 'Não foi possível carregar as campanhas. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setCampaigns(data || []);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
    }
  }, [isAuthenticated, fetchCampaigns]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🚀 Iniciando CampaignExecutor...');
      campaignExecutor.start();
      
      return () => {
        console.log('⏹️ Parando CampaignExecutor...');
        campaignExecutor.stop();
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      await fetchCampaigns();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchCampaigns]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CAMPAIGN_CREATED') {
        fetchCampaigns();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    fetchCampaigns
  };
};