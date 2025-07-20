import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  Square, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { campaignExecutor, CampaignExecution } from '@/services/campaignExecutor';
import { supabase } from '@/integrations/supabase/client';

interface ExecutionLog {
  id: string;
  timestamp: string;
  campaignId: string;
  campaignName: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export function CampaignExecutionStatus() {
  const [executions, setExecutions] = useState<CampaignExecution[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Atualizar execuções ativas
  const updateExecutions = () => {
    const activeExecutions = campaignExecutor.getActiveExecutions();
    setExecutions(activeExecutions);
  };

  // Buscar logs recentes do Supabase
  const fetchLogs = async () => {
    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, status, sent_messages, created_at')
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !campaigns) return;

      const newLogs: ExecutionLog[] = campaigns.map(campaign => ({
        id: `${campaign.id}-${Date.now()}`,
        timestamp: campaign.created_at || new Date().toISOString(),
        campaignId: campaign.id,
        campaignName: campaign.name,
        level: campaign.status === 'active' ? 'info' : 'success',
        message: campaign.status === 'active' 
          ? `Enviadas ${campaign.sent_messages || 0} mensagens`
          : 'Campanha concluída',
        details: { 
          status: campaign.status, 
          sentMessages: campaign.sent_messages 
        }
      }));

      setLogs(newLogs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      updateExecutions();
      fetchLogs();
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Initial load
  useEffect(() => {
    updateExecutions();
    fetchLogs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      await campaignExecutor.pauseCampaign(campaignId);
      updateExecutions();
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      await campaignExecutor.resumeCampaign(campaignId);
      updateExecutions();
    } catch (error) {
      console.error('Erro ao retomar campanha:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Status de Execução</h3>
          {autoRefresh && (
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Auto
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pausar Auto-refresh
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Iniciar Auto-refresh
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Ocultar Logs
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Mostrar Logs
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateExecutions();
              fetchLogs();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Execuções Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Campanhas em Execução ({executions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Square className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma campanha em execução</p>
              <p className="text-sm">As campanhas ativas serão exibidas aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div key={execution.campaignId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(execution.status)}`} />
                      <div>
                        <h4 className="font-medium">Campanha {execution.campaignId}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(execution.lastExecution)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getStatusIcon(execution.status)}
                        <span className="ml-1 capitalize">{execution.status}</span>
                      </Badge>
                      
                      {execution.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseCampaign(execution.campaignId)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {execution.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resumeCampaign(execution.campaignId)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Enviadas:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {execution.sentMessages}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Falharam:</span>
                      <span className="ml-1 font-medium text-red-600">
                        {execution.failedMessages}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Posição:</span>
                      <span className="ml-1 font-medium">
                        {execution.currentMessageIndex + 1}
                      </span>
                    </div>
                  </div>
                  
                  {execution.error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      <strong>Erro:</strong> {execution.error}
                    </div>
                  )}
                  
                  {execution.nextExecution && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Próxima execução: {formatTime(execution.nextExecution)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs de Execução */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Logs de Execução ({logs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum log encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 pb-3 border-b">
                      <div className="mt-0.5">
                        {getLogIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {log.campaignName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.message}
                        </p>
                        {log.details && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Status: {log.details.status} | 
                            Enviadas: {log.details.sentMessages || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}