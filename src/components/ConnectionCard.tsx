
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MessageCircle, Smartphone, Wifi, WifiOff, MoreHorizontal, User, BarChart3, Users, MessageSquare, RefreshCw, QrCode, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Connection {
  id: number;
  name: string;
  phone: string | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastActivity: string;
  connection_status?: 'open' | 'close' | 'connecting' | 'error' | 'disconnected';
  profile_name?: string | null;
  profile_pic_url?: string | null;
  whatsapp_number?: string | null;
  messages_count?: number;
  contacts_count?: number;
  chats_count?: number;
  owner_jid?: string | null;
}

interface ConnectionCardProps {
  connection: Connection;
  detailed?: boolean;
  onRefreshStatus?: () => void;
  onShowQRCode?: () => void;
  onDeleteInstance?: () => void;
}

export function ConnectionCard({ connection, detailed = false, onRefreshStatus, onShowQRCode, onDeleteInstance }: ConnectionCardProps) {
  const getStatusIcon = () => {
    // Priorizar connection_status se disponível
    const status = connection.connection_status || connection.status;
    
    switch (status) {
      case 'open':
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'close':
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    // Priorizar connection_status se disponível
    const status = connection.connection_status || connection.status;
    
    const variants = {
      open: 'bg-green-100 text-green-800 border-green-200',
      connected: 'bg-green-100 text-green-800 border-green-200',
      close: 'bg-red-100 text-red-800 border-red-200',
      disconnected: 'bg-red-100 text-red-800 border-red-200',
      connecting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      open: 'Conectado',
      connected: 'Conectado',
      close: 'Desconectado',
      disconnected: 'Desconectado',
      connecting: 'Conectando...',
      error: 'Erro'
    };

    return (
      <Badge className={cn("text-xs", variants[status as keyof typeof variants] || variants.error)}>
        {labels[status as keyof typeof labels] || 'Desconhecido'}
      </Badge>
    );
  };

  if (detailed) {
    const displayPhone = connection.whatsapp_number || connection.phone || 'Aguardando conexão';
    const isConnected = connection.connection_status === 'open';
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Foto do perfil se disponível */}
            {connection.profile_pic_url ? (
              <img 
                src={connection.profile_pic_url} 
                alt={connection.profile_name || connection.name}
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{connection.name}</h3>
              {connection.profile_name && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <User className="h-3 w-3" />
                  {connection.profile_name}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-3 w-3" />
                {displayPhone}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onRefreshStatus && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onRefreshStatus}
                title="Atualizar status"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onShowQRCode && (
                  <DropdownMenuItem onClick={onShowQRCode}>
                    <QrCode className="mr-2 h-4 w-4" />
                    {isConnected ? 'Ver QR Code' : 'Gerar QR Code'}
                  </DropdownMenuItem>
                )}
                {onDeleteInstance && (
                  <>
                    {onShowQRCode && <DropdownMenuSeparator />}
                    <DropdownMenuItem 
                      onClick={onDeleteInstance}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar Instância
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
          <div className="text-sm text-muted-foreground">
            {connection.lastActivity}
          </div>
        </div>

        {/* Estatísticas se conectado */}
        {isConnected && (connection.messages_count || connection.contacts_count || connection.chats_count) && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted p-2 rounded">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Mensagens
              </div>
              <div className="font-semibold text-sm">{connection.messages_count?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-muted p-2 rounded">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Contatos
              </div>
              <div className="font-semibold text-sm">{connection.contacts_count?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-muted p-2 rounded">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                Chats
              </div>
              <div className="font-semibold text-sm">{connection.chats_count?.toLocaleString() || 0}</div>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">Enviar Teste</Button>
            <Button size="sm" variant="outline" className="flex-1">Desconectar</Button>
          </div>
        )}
        
        {!isConnected && connection.connection_status !== 'connecting' && (
          <Button size="sm" className="w-full">Reconectar</Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{connection.name}</span>
        </div>
        {getStatusBadge()}
      </div>
      <div className="text-sm text-muted-foreground">
        {connection.lastActivity}
      </div>
    </div>
  );
}
