import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { CampaignCard } from '@/components/CampaignCard';
import { CampaignExecutionStatus } from '@/components/CampaignExecutionStatus';
import { Tables } from '@/integrations/supabase/types';

interface CampaignsViewProps {
  campaigns: Tables<'campaigns'>[];
  loading: boolean;
  onViewChange: (view: string) => void;
}

export const CampaignsView = ({ campaigns, loading, onViewChange }: CampaignsViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Campanhas</h2>
          <p className="text-muted-foreground">Crie e gerencie suas campanhas de disparo</p>
        </div>
        <Button onClick={() => onViewChange('create-campaign')}>
          <Send className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>
      
      <CampaignExecutionStatus />
      
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg">Nenhuma campanha encontrada</p>
                <p className="text-sm">Comece criando sua primeira campanha de disparo</p>
                <Button 
                  className="mt-4"
                  onClick={() => onViewChange('create-campaign')}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Criar Primeira Campanha
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <CampaignCard 
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
                  detailed 
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};