import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, BarChart3, Send } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { ConnectionCard } from '@/components/ConnectionCard';
import { CampaignCard } from '@/components/CampaignCard';
import { TrialStatusBanner } from '@/components/TrialStatusBanner';
import { Tables } from '@/integrations/supabase/types';

interface DashboardProps {
  metrics: {
    activeConnections: number;
    totalMessages: number;
    activeCampaigns: number;
    totalContacts: number;
  };
  connections: Array<{
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
  }>;
  campaigns: Tables<'campaigns'>[];
  loading: boolean;
  onViewChange: (view: string) => void;
  // Trial props
  isTrialActive?: boolean;
  trialDaysRemaining?: number;
  subscriptionPlan?: string;
  couponCode?: string | null;
}

export const Dashboard = ({ 
  metrics, 
  connections, 
  campaigns, 
  loading, 
  onViewChange,
  isTrialActive,
  trialDaysRemaining,
  subscriptionPlan,
  couponCode
}: DashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Trial Status Banner */}
      {(isTrialActive !== undefined && trialDaysRemaining !== undefined) && (
        <TrialStatusBanner 
          isTrialActive={isTrialActive}
          trialDaysRemaining={trialDaysRemaining}
          subscriptionPlan={subscriptionPlan}
          couponCode={couponCode}
          onUpgrade={() => {
            // TODO: Implement upgrade flow
            console.log('Upgrade clicked');
          }}
        />
      )}

      <div>
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral das suas atividades</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Conexões Ativas" 
          value={metrics.activeConnections.toString()} 
          icon={MessageCircle} 
          color="text-green-500" 
        />
        <MetricCard 
          title="Mensagens Enviadas" 
          value={metrics.totalMessages.toLocaleString('pt-BR')} 
          icon={Send} 
          color="text-blue-500" 
        />
        <MetricCard 
          title="Campanhas Ativas" 
          value={metrics.activeCampaigns.toString()} 
          icon={BarChart3} 
          color="text-purple-500" 
        />
        <MetricCard 
          title="Contatos" 
          value={metrics.totalContacts.toLocaleString('pt-BR')} 
          icon={Users} 
          color="text-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conexões WhatsApp</CardTitle>
            <CardDescription>Status das suas conexões ativas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <p>Nenhuma conexão configurada</p>
              </div>
            ) : (
              connections.slice(0, 3).map((connection) => (
                <ConnectionCard 
                  key={connection.id} 
                  connection={{
                    id: connection.id,
                    name: connection.name,
                    phone: connection.phone || null,
                    status: connection.status as 'connected' | 'disconnected' | 'connecting' | 'error',
                    connection_status: connection.connection_status as 'open' | 'close' | 'connecting' | 'error' | 'disconnected',
                    profile_name: connection.profile_name,
                    profile_pic_url: connection.profile_pic_url,
                    whatsapp_number: connection.whatsapp_number,
                    messages_count: connection.messages_count,
                    contacts_count: connection.contacts_count,
                    chats_count: connection.chats_count,
                    owner_jid: connection.owner_jid,
                    lastActivity: connection.last_activity ? 
                      new Date(connection.last_activity).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'Nunca'
                  }} 
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campanhas Recentes</CardTitle>
            <CardDescription>Suas últimas campanhas de disparo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <p>Nenhuma campanha encontrada</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => onViewChange('campaigns')}
                >
                  Criar primeira campanha
                </Button>
              </div>
            ) : (
              campaigns.slice(0, 3).map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={{
                    id: campaign.id,
                    name: campaign.name,
                    type: campaign.type as 'individual' | 'group',
                    status: campaign.status as 'active' | 'paused' | 'completed' | 'draft',
                    contacts: campaign.total_contacts || 0,
                    sent: campaign.sent_messages || 0,
                    scheduled: campaign.status === 'active' ? campaign.start_time || 'Ativo' : 
                             campaign.status === 'paused' ? 'Pausada' : 
                             campaign.status === 'completed' ? 'Concluída' : 'Rascunho'
                  }} 
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};