import { Button } from "@/components/ui/button";
import { CampaignWizard } from '@/components/campaign/CampaignWizard';

interface CreateCampaignViewProps {
  onBack: () => void;
}

export const CreateCampaignView = ({ onBack }: CreateCampaignViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          ← Voltar
        </Button>
        <div>
          <h2 className="text-3xl font-bold mb-2">Nova Campanha</h2>
          <p className="text-muted-foreground">Crie uma nova campanha de disparo</p>
        </div>
      </div>
      
      <CampaignWizard onCampaignCreated={onBack} />
    </div>
  );
};