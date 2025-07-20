import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Smartphone, User, RefreshCw, AlertCircle, CheckCircle, Wifi } from "lucide-react";
import { CampaignData } from '../CampaignWizard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InstanceSelectionProps {
  data: CampaignData;
  onUpdate: (data: Partial<CampaignData>) => void;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  connection_status: string;
  profile_name?: string;
  profile_pic_url?: string;
  whatsapp_number?: string;
  phone?: string;
}

export function InstanceSelection({ data, onUpdate }: InstanceSelectionProps) {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchConnectedInstances = async () => {
    try {
      setLoading(true);
      
      const { data: connections, error } = await supabase
        .from('connections')
        .select('*')
        .eq('connection_status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar instâncias:', error);
        toast({
          title: "Erro ao carregar instâncias",
          description: "Não foi possível carregar as instâncias conectadas.",
          variant: "destructive"
        });
        return;
      }

      setInstances(connections || []);
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      toast({
        title: "Erro ao carregar instâncias",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshInstances = async () => {
    setRefreshing(true);
    await fetchConnectedInstances();
    setRefreshing(false);
    toast({
      title: "Instâncias atualizadas",
      description: "Lista de instâncias conectadas foi atualizada."
    });
  };

  useEffect(() => {
    fetchConnectedInstances();
  }, []);

  const handleInstanceSelect = (instance: WhatsAppInstance) => {
    const selectedInstance = {
      id: instance.id,
      name: instance.name,
      whatsapp_number: instance.whatsapp_number || instance.phone || '',
      profile_name: instance.profile_name
    };
    
    onUpdate({ selectedInstance });
    
    toast({
      title: "Instância selecionada",
      description: `Instância "${instance.name}" foi selecionada para esta campanha.`
    });
  };

  const isSelected = (instanceId: string) => {
    return data.selectedInstance?.id === instanceId;
  };

  const renderInstanceCard = (instance: WhatsAppInstance) => {
    const displayNumber = instance.whatsapp_number || instance.phone || 'Número não disponível';
    const displayName = instance.profile_name || instance.name;
    const selected = isSelected(instance.id);

    return (
      <Card 
        key={instance.id} 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          selected ? 'ring-2 ring-primary border-primary' : ''
        }`}
        onClick={() => handleInstanceSelect(instance)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Foto do perfil ou ícone padrão */}
            {instance.profile_pic_url ? (
              <img 
                src={instance.profile_pic_url} 
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{instance.name}</h3>
                {selected && (
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
              
              {instance.profile_name && (
                <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{instance.profile_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Smartphone className="h-3 w-3" />
                <span className="truncate">{displayNumber}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
              {selected && (
                <Badge variant="default" className="text-xs">
                  Selecionado
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Seleção de Instância
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Seleção de Instância WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Selecione a instância WhatsApp que será usada para enviar as mensagens desta campanha.
              Apenas instâncias conectadas estão disponíveis.
            </p>
            
            {data.type === 'group' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Campanhas do tipo "Grupo" são limitadas a apenas uma instância WhatsApp.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Instâncias Conectadas ({instances.length})</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshInstances}
              disabled={refreshing}
            >
              {refreshing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma instância conectada</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Você precisa ter pelo menos uma instância WhatsApp conectada para criar campanhas.
              </p>
              <Button variant="outline" onClick={refreshInstances}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar novamente
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {instances.map(renderInstanceCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {data.selectedInstance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Instância Selecionada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <div>
                <div className="font-semibold">{data.selectedInstance.name}</div>
                {data.selectedInstance.profile_name && (
                  <div className="text-sm text-green-600">
                    {data.selectedInstance.profile_name}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {data.selectedInstance.whatsapp_number}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}