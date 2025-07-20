import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Metrics {
  activeConnections: number;
  totalMessages: number;
  activeCampaigns: number;
  totalContacts: number;
}

export const useMetrics = (isAuthenticated: boolean) => {
  const [metrics, setMetrics] = useState<Metrics>({
    activeConnections: 0,
    totalMessages: 0,
    activeCampaigns: 0,
    totalContacts: 0
  });

  const fetchMetrics = async () => {
    try {
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active');

      const { data: campaignsData, error: messagesError } = await supabase
        .from('campaigns')
        .select('sent_messages');

      const { data: contactsData, error: contactsError } = await supabase
        .from('campaigns')
        .select('total_contacts');

      const { data: activeConnections, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .eq('status', 'connected');

      if (campaignsError || messagesError || contactsError || connectionsError) {
        console.error('Erro ao buscar métricas:', { campaignsError, messagesError, contactsError, connectionsError });
        return;
      }

      const totalMessages = campaignsData?.reduce((sum, campaign) => sum + (campaign.sent_messages || 0), 0) || 0;
      const totalContacts = contactsData?.reduce((sum, campaign) => sum + (campaign.total_contacts || 0), 0) || 0;

      setMetrics({
        activeConnections: activeConnections?.length || 0,
        totalMessages,
        activeCampaigns: activeCampaigns?.length || 0,
        totalContacts
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      await fetchMetrics();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    metrics,
    fetchMetrics
  };
};