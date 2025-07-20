import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { InstanceManagementService } from '@/services/instanceManagement';
import { useToast } from "@/hooks/use-toast";
import { useApiSettingsValues } from '@/contexts/SettingsContext';

interface DeleteInstanceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  instanceName: string;
  connectionId: string;
  onDeleteSuccess: () => void;
}

export function DeleteInstanceModal({ 
  isOpen, 
  onOpenChange, 
  instanceName, 
  connectionId,
  onDeleteSuccess 
}: DeleteInstanceModalProps) {
  const apiSettings = useApiSettingsValues();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🗑️ Deletando instância: ${instanceName} (ID: ${connectionId})`);
      
      // Deletar da Evolution API
      const apiResult = await InstanceManagementService.deleteInstance(instanceName, {
        evolutionApiUrl: apiSettings.evolutionApiUrl,
        evolutionApiKey: apiSettings.evolutionApiKey,
        timeout: apiSettings.timeout,
        retryAttempts: apiSettings.retryAttempts
      });
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Erro ao deletar instância da API');
      }
      
      // Deletar do banco de dados
      const { supabase } = await import('@/integrations/supabase/client');
      const { error: dbError } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (dbError) {
        console.error('Erro ao deletar do banco:', dbError);
        // Mesmo com erro no banco, a instância foi deletada da API
        toast({
          title: "Instância deletada da API",
          description: "A instância foi removida da Evolution API, mas houve erro ao remover do banco de dados.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Instância deletada",
          description: `A instância "${instanceName}" foi removida com sucesso.`
        });
      }
      
      onDeleteSuccess();
      onOpenChange(false);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao deletar instância:', err);
      
      toast({
        title: "Erro ao deletar instância",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Deletar Instância
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Isso irá permanentemente deletar a instância e remover todos os dados associados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badge com nome da instância */}
          <div className="flex justify-center">
            <Badge variant="destructive" className="text-sm">
              {instanceName}
            </Badge>
          </div>

          {/* Aviso importante */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Remover a instância da Evolution API</li>
                <li>Desconectar o WhatsApp desta instância</li>
                <li>Excluir todos os dados salvos da conexão</li>
                <li>Invalidar todas as campanhas que usam esta instância</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}