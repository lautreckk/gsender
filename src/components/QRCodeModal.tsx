import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, AlertCircle, Smartphone, QrCode } from "lucide-react";
import { InstanceManagementService } from '@/services/instanceManagement';
import { useToast } from "@/hooks/use-toast";
import { useApiSettingsValues } from '@/contexts/SettingsContext';

interface QRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  instanceName: string;
  initialQRCode?: string; // QR code inicial se disponível
}

export function QRCodeModal({ isOpen, onOpenChange, instanceName, initialQRCode }: QRCodeModalProps) {
  const apiSettings = useApiSettingsValues();
  const [qrCode, setQrCode] = useState<string | null>(initialQRCode || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📱 Gerando QR code para instância: ${instanceName}`);
      
      const result = await InstanceManagementService.generateQRCode(instanceName, {
        evolutionApiUrl: apiSettings.evolutionApiUrl,
        evolutionApiKey: apiSettings.evolutionApiKey,
        timeout: apiSettings.timeout,
        retryAttempts: apiSettings.retryAttempts
      });
      
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código com seu WhatsApp para conectar."
        });
      } else {
        setError(result.error || 'Erro ao gerar QR code');
        toast({
          title: "Erro ao gerar QR code",
          description: result.error || 'Não foi possível gerar o QR code.',
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: "Erro ao gerar QR code",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    try {
      // Criar um link de download
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${qrCode}`;
      link.download = `qrcode_${instanceName}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
      
      toast({
        title: "QR Code baixado",
        description: "O arquivo foi salvo em seus downloads."
      });
    } catch (err) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o QR code.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setQrCode(initialQRCode || null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie este QR code com seu WhatsApp para conectar a instância "{instanceName}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badge com nome da instância */}
          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm">
              {instanceName}
            </Badge>
          </div>

          {/* QR Code ou Estado de Loading */}
          <div className="flex justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4 p-8">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gerando QR code...</p>
              </div>
            ) : qrCode ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <img 
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code para conectar WhatsApp"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={generateQRCode}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button 
                    onClick={downloadQRCode}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <QrCode className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">QR Code não disponível</p>
                  <p className="text-sm text-muted-foreground">
                    Gere um novo QR code para conectar esta instância.
                  </p>
                </div>
                <Button onClick={generateQRCode} disabled={loading}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar QR Code
                </Button>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Instruções */}
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              <strong>Como conectar:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em "Mais opções" (três pontos)</li>
                <li>Toque em "Aparelhos conectados"</li>
                <li>Toque em "Conectar um aparelho"</li>
                <li>Aponte a câmera para este QR code</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Fechar
            </Button>
            {!qrCode && !loading && (
              <Button onClick={generateQRCode} className="flex-1">
                <QrCode className="w-4 h-4 mr-2" />
                Gerar QR Code
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}