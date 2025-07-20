
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, X, Download, Search, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  campaignName: string;
  type: 'individual' | 'group';
  totalMessages: number;
  sent: number;
  pending: number;
  failed: number;
  progress: number;
  startDate: string;
  status: 'sent' | 'in_progress' | 'scheduled' | 'cancelled' | 'failed';
  memberName?: string;
}

// Função para mapear status do Supabase para o tipo do histórico
const mapCampaignStatusToHistory = (status: string): 'sent' | 'in_progress' | 'scheduled' | 'cancelled' | 'failed' => {
  switch (status) {
    case 'completed': return 'sent';
    case 'active': return 'in_progress';
    case 'draft': return 'scheduled';
    case 'paused': return 'cancelled';
    case 'cancelled': return 'cancelled';
    default: return 'scheduled';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    case 'scheduled': return 'bg-yellow-500';
    case 'cancelled': return 'bg-gray-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'sent': return 'Enviado';
    case 'in_progress': return 'Em andamento';
    case 'scheduled': return 'Agendado';
    case 'cancelled': return 'Cancelado';
    case 'failed': return 'Falha';
    default: return 'Desconhecido';
  }
};

interface HistoryViewProps {
  isAdmin?: boolean;
}

export function HistoryView({ isAdmin = false }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para buscar campanhas do Supabase
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar campanhas:', error);
        toast({
          title: 'Erro ao carregar histórico',
          description: 'Não foi possível carregar o histórico de campanhas.',
          variant: 'destructive',
        });
        return;
      }

      // Transformar dados do Supabase para o formato do histórico
      const historyData: HistoryItem[] = campaigns?.map(campaign => {
        const totalMessages = campaign.total_contacts || 0;
        const sent = campaign.sent_messages || 0;
        const failed = campaign.failed_messages || 0;
        const pending = Math.max(0, totalMessages - sent - failed);
        const progress = totalMessages > 0 ? Math.round((sent / totalMessages) * 100) : 0;

        return {
          id: campaign.id,
          campaignName: campaign.name,
          type: campaign.type as 'individual' | 'group',
          totalMessages,
          sent,
          pending,
          failed,
          progress,
          startDate: campaign.created_at ? new Date(campaign.created_at).toLocaleString('pt-BR') : '',
          status: mapCampaignStatusToHistory(campaign.status),
          memberName: 'Sistema' // TODO: Integrar com tabela de membros
        };
      }) || [];

      setHistory(historyData);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar campanhas quando component montar
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.memberName && item.memberName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCancelCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) {
        console.error('Erro ao cancelar campanha:', error);
        toast({
          title: 'Erro ao cancelar campanha',
          description: 'Não foi possível cancelar a campanha.',
          variant: 'destructive',
        });
        return;
      }

      await fetchCampaigns(); // Reload the list
      toast({
        title: 'Campanha cancelada',
        description: 'A campanha foi cancelada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao cancelar campanha:', error);
      toast({
        title: 'Erro ao cancelar campanha',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (id: string) => {
    console.log(`Visualizando detalhes da campanha ${id}`);
    // TODO: Implementar navegação para detalhes
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Histórico de Disparos</h2>
        <p className="text-muted-foreground">
          {isAdmin ? 'Visualize todos os disparos da empresa' : 'Visualize seus disparos realizados'}
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome da campanha ou membro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Grupo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
          <CardDescription>
            {filteredHistory.length} campanhas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center p-8">
              <div className="text-muted-foreground space-y-2">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg">Nenhuma campanha encontrada</p>
                <p className="text-sm">
                  {history.length === 0 
                    ? 'Nenhuma campanha foi criada ainda' 
                    : 'Ajuste os filtros para encontrar campanhas'
                  }
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Tipo</TableHead>
                  {isAdmin && <TableHead>Membro</TableHead>}
                  <TableHead>Mensagens</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.campaignName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.type === 'individual' ? 'Individual' : 'Grupo'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-muted-foreground">
                      {item.memberName}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-green-600">{item.sent}</span> enviadas
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.pending} pendentes • {item.failed} falhas
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{item.progress}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={cn("h-2 rounded-full", getStatusColor(item.status))}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.startDate}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-white", getStatusColor(item.status))}>
                      {getStatusText(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(item.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      {item.status === 'in_progress' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelCampaign(item.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
