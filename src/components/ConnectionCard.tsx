
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Smartphone, Wifi, WifiOff, MoreHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Connection {
  id: number;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastActivity: string;
}

interface ConnectionCardProps {
  connection: Connection;
  detailed?: boolean;
}

export function ConnectionCard({ connection, detailed = false }: ConnectionCardProps) {
  const getStatusIcon = () => {
    switch (connection.status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      connected: 'bg-green-100 text-green-800 border-green-200',
      disconnected: 'bg-red-100 text-red-800 border-red-200',
      connecting: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connecting: 'Conectando...'
    };

    return (
      <Badge className={cn("text-xs", variants[connection.status])}>
        {labels[connection.status]}
      </Badge>
    );
  };

  if (detailed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">{connection.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-3 w-3" />
                {connection.phone}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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

        {connection.status === 'connected' && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">Enviar Teste</Button>
            <Button size="sm" variant="outline" className="flex-1">Desconectar</Button>
          </div>
        )}
        
        {connection.status === 'disconnected' && (
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
