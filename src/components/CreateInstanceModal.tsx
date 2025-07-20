import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, QrCode, Settings, Shield, Users, Eye, Clock, History } from 'lucide-react';
import { useApiSettingsValues } from '@/contexts/SettingsContext';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInstanceCreated?: (instanceData: any) => void;
}

interface InstanceConfig {
  instanceName: string;
  msgCall: string;
  qrcode: boolean;
  rejectCall: boolean;
  groupsIgnore: boolean;
  alwaysOnline: boolean;
  readMessages: boolean;
  readStatus: boolean;
  syncFullHistory: boolean;
}

interface InstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    integration: string;
    status: string;
  };
  qrcode: {
    base64: string;
    code: string;
  };
  settings: any;
}

export function CreateInstanceModal({ isOpen, onOpenChange, onInstanceCreated }: CreateInstanceModalProps) {
  const apiSettings = useApiSettingsValues();
  const [config, setConfig] = useState<InstanceConfig>({
    instanceName: '',
    msgCall: 'Olá! No momento não posso atender chamadas. Por favor, envie uma mensagem de texto.',
    qrcode: true,
    rejectCall: true,
    groupsIgnore: false,
    alwaysOnline: true,
    readMessages: true,
    readStatus: true,
    syncFullHistory: true
  });

  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<any>(null);
  const { toast } = useToast();

  const handleCreateInstance = async () => {
    if (!config.instanceName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da instância é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!config.msgCall.trim()) {
      toast({
        title: "Erro", 
        description: "Mensagem de chamada é obrigatória",
        variant: "destructive"
      });
      return;
    }

    // Validar configurações da API
    if (!apiSettings.evolutionApiUrl || !apiSettings.evolutionApiKey) {
      toast({
        title: "Configuração incompleta",
        description: "Configure a URL e chave da Evolution API nas configurações do sistema.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔧 Criando instância com configurações:', {
        apiUrl: apiSettings.evolutionApiUrl,
        instanceName: config.instanceName,
        hasApiKey: !!apiSettings.evolutionApiKey
      });

      const response = await fetch(`${apiSettings.evolutionApiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiSettings.evolutionApiKey
        },
        body: JSON.stringify({
          instanceName: config.instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: config.qrcode,
          rejectCall: config.rejectCall,
          msgCall: config.msgCall,
          groupsIgnore: config.groupsIgnore,
          alwaysOnline: config.alwaysOnline,
          readMessages: config.readMessages,
          readStatus: config.readStatus,
          syncFullHistory: config.syncFullHistory
        }),
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        console.error('❌ Erro HTTP ao criar instância:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data: InstanceResponse = await response.json();
      console.log('✅ Instância criada com sucesso:', data);
      
      setInstanceData(data);
      setQrCodeData(data.qrcode.base64);
      
      toast({
        title: "Instância criada com sucesso!",
        description: `Instância "${data.instance.instanceName}" foi criada. Escaneie o QR Code para conectar.`
      });

      // Chamar callback se fornecido
      if (onInstanceCreated) {
        onInstanceCreated(data);
      }

    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      
      let errorMessage = "Não foi possível criar a instância. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Timeout: A criação da instância demorou muito. Verifique sua conexão.";
        } else if (error.message.includes('fetch')) {
          errorMessage = "Erro de conexão com a Evolution API. Verifique as configurações.";
        } else if (error.message.includes('HTTP')) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro ao criar instância",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfig({
      instanceName: '',
      msgCall: 'Olá! No momento não posso atender chamadas. Por favor, envie uma mensagem de texto.',
      qrcode: true,
      rejectCall: true,
      groupsIgnore: false,
      alwaysOnline: true,
      readMessages: true,
      readStatus: true,
      syncFullHistory: true
    });
    setQrCodeData(null);
    setInstanceData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Nova Instância WhatsApp
          </DialogTitle>
          <DialogDescription>
            Configure uma nova instância para conexão com WhatsApp
          </DialogDescription>
        </DialogHeader>

        {!qrCodeData ? (
          <div className="space-y-6">
            {/* Nome da Instância */}
            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância *</Label>
              <Input
                id="instanceName"
                placeholder="Ex: MinhaEmpresa-Principal"
                value={config.instanceName}
                onChange={(e) => setConfig({...config, instanceName: e.target.value})}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Nome único para identificar esta instância
              </p>
            </div>

            {/* Mensagem de Chamada */}
            <div className="space-y-2">
              <Label htmlFor="msgCall">Mensagem de Chamada *</Label>
              <Input
                id="msgCall"
                placeholder="Mensagem enviada quando chamadas são rejeitadas"
                value={config.msgCall}
                onChange={(e) => setConfig({...config, msgCall: e.target.value})}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Mensagem automática enviada quando chamadas são rejeitadas
              </p>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <Label className="text-base font-medium">Configurações</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    <div>
                      <Label className="text-sm font-medium">Rejeitar Chamadas</Label>
                      <p className="text-xs text-muted-foreground">Rejeitar chamadas automaticamente</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.rejectCall}
                    onCheckedChange={(checked) => setConfig({...config, rejectCall: checked})}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <div>
                      <Label className="text-sm font-medium">Ignorar Grupos</Label>
                      <p className="text-xs text-muted-foreground">Não processar mensagens de grupos</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.groupsIgnore}
                    onCheckedChange={(checked) => setConfig({...config, groupsIgnore: checked})}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <div>
                      <Label className="text-sm font-medium">Sempre Online</Label>
                      <p className="text-xs text-muted-foreground">Manter status sempre online</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.alwaysOnline}
                    onCheckedChange={(checked) => setConfig({...config, alwaysOnline: checked})}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <div>
                      <Label className="text-sm font-medium">Ler Mensagens</Label>
                      <p className="text-xs text-muted-foreground">Marcar mensagens como lidas</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.readMessages}
                    onCheckedChange={(checked) => setConfig({...config, readMessages: checked})}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <div>
                      <Label className="text-sm font-medium">Ler Status</Label>
                      <p className="text-xs text-muted-foreground">Marcar status como visualizado</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.readStatus}
                    onCheckedChange={(checked) => setConfig({...config, readStatus: checked})}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-500" />
                    <div>
                      <Label className="text-sm font-medium">Sincronizar Histórico</Label>
                      <p className="text-xs text-muted-foreground">Sincronizar todo o histórico</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.syncFullHistory}
                    onCheckedChange={(checked) => setConfig({...config, syncFullHistory: checked})}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">QR Code Gerado</h3>
              </div>
              
              <div className="flex justify-center">
                <img 
                  src={qrCodeData} 
                  alt="QR Code WhatsApp" 
                  className="max-w-xs border rounded-lg shadow-md"
                />
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em "Mais opções" {'>'}  "Aparelhos conectados"</p>
                <p>3. Toque em "Conectar um aparelho"</p>
                <p>4. Aponte a câmera do seu celular para este QR Code</p>
              </div>

              {instanceData && (
                <div className="bg-muted p-4 rounded-lg text-left">
                  <h4 className="font-medium mb-2">Detalhes da Instância:</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nome:</span> {instanceData.instance.instanceName}</p>
                    <p><span className="font-medium">ID:</span> {instanceData.instance.instanceId}</p>
                    <p><span className="font-medium">Status:</span> {instanceData.instance.status}</p>
                    <p><span className="font-medium">Integração:</span> {instanceData.instance.integration}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!qrCodeData ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleCreateInstance} disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Criar Instância
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}