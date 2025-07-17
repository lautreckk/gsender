
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Square, Users, Send, Clock, MoreHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Campaign {
  id: number;
  name: string;
  type: 'individual' | 'group';
  status: 'active' | 'paused' | 'completed' | 'scheduled';
  contacts: number;
  sent: number;
  scheduled: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  detailed?: boolean;
}

export function CampaignCard({ campaign, detailed = false }: CampaignCardProps) {
  const getStatusBadge = () => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      scheduled: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const labels = {
      active: 'Ativo',
      paused: 'Pausado',
      completed: 'Concluído',
      scheduled: 'Agendado'
    };

    return (
      <Badge className={cn("text-xs", variants[campaign.status])}>
        {labels[campaign.status]}
      </Badge>
    );
  };

  const getTypeIcon = () => {
    return campaign.type === 'individual' ? <Users className="h-4 w-4" /> : <Send className="h-4 w-4" />;
  };

  const progress = (campaign.sent / campaign.contacts) * 100;

  if (detailed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              {getTypeIcon()}
            </div>
            <div>
              <h3 className="font-semibold">{campaign.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{campaign.type === 'individual' ? 'Individual' : 'Grupo'}</span>
                •
                <span>{campaign.contacts} contatos</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{campaign.sent} / {campaign.contacts}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {campaign.scheduled}
          </div>
          
          <div className="flex gap-2">
            {campaign.status === 'active' && (
              <Button size="sm" variant="outline">
                <Pause className="h-3 w-3 mr-1" />
                Pausar
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button size="sm">
                <Play className="h-3 w-3 mr-1" />
                Retomar
              </Button>
            )}
            {(campaign.status === 'active' || campaign.status === 'paused') && (
              <Button size="sm" variant="destructive">
                <Square className="h-3 w-3 mr-1" />
                Parar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="font-medium">{campaign.name}</span>
        </div>
        {getStatusBadge()}
      </div>
      <div className="text-sm text-muted-foreground">
        {campaign.sent} / {campaign.contacts}
      </div>
    </div>
  );
}
