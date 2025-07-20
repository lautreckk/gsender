import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Settings } from 'lucide-react';
import { ConnectionCard } from '@/components/ConnectionCard';
import { QRCodeModal } from '@/components/QRCodeModal';
import { DeleteInstanceModal } from '@/components/DeleteInstanceModal';

interface ConnectionsViewProps {
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
    qr_code?: string;
  }>;
  statusUpdateInProgress: boolean;
  onUpdateAllStatus: () => void;
  onOpenCreateModal: () => void;
  onUpdateSingleStatus: (connectionId: string, instanceName: string) => void;
  onConnectionDeleted?: () => void;
}

export const ConnectionsView = ({ 
  connections, 
  statusUpdateInProgress, 
  onUpdateAllStatus,
  onOpenCreateModal,
  onUpdateSingleStatus,
  onConnectionDeleted
}: ConnectionsViewProps) => {
  const [qrCodeModal, setQrCodeModal] = useState<{
    isOpen: boolean;
    instanceName: string;
    qrCode?: string;
  }>({ isOpen: false, instanceName: '' });
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    instanceName: string;
    connectionId: string;
  }>({ isOpen: false, instanceName: '', connectionId: '' });

  const handleShowQRCode = (instanceName: string, existingQRCode?: string) => {
    setQrCodeModal({
      isOpen: true,
      instanceName,
      qrCode: existingQRCode
    });
  };

  const handleDeleteInstance = (instanceName: string, connectionId: string) => {
    setDeleteModal({
      isOpen: true,
      instanceName,
      connectionId
    });
  };

  const handleDeleteSuccess = () => {
    if (onConnectionDeleted) {
      onConnectionDeleted();
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Conexões WhatsApp</h2>
          <p className="text-muted-foreground">Gerencie suas conexões do WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onUpdateAllStatus}
            disabled={statusUpdateInProgress}
          >
            {statusUpdateInProgress ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            Atualizar Status
          </Button>
          <Button onClick={onOpenCreateModal}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Nova Conexão
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            <p className="text-lg">Nenhuma conexão configurada</p>
            <p className="text-sm">Configure suas conexões WhatsApp para começar a enviar mensagens</p>
          </div>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id}>
              <CardContent className="p-6">
                <ConnectionCard 
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
                  detailed 
                  onRefreshStatus={() => onUpdateSingleStatus(connection.id, connection.name)}
                  onShowQRCode={() => handleShowQRCode(connection.name, connection.qr_code)}
                  onDeleteInstance={() => handleDeleteInstance(connection.name, connection.id)}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <QRCodeModal
        isOpen={qrCodeModal.isOpen}
        onOpenChange={(open) => setQrCodeModal(prev => ({ ...prev, isOpen: open }))}
        instanceName={qrCodeModal.instanceName}
        initialQRCode={qrCodeModal.qrCode}
      />

      <DeleteInstanceModal
        isOpen={deleteModal.isOpen}
        onOpenChange={(open) => setDeleteModal(prev => ({ ...prev, isOpen: open }))}
        instanceName={deleteModal.instanceName}
        connectionId={deleteModal.connectionId}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};