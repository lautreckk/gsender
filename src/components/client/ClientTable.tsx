import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Building, Users, Crown } from 'lucide-react';
import { Client } from '@/hooks/useClientManagement';

interface ClientTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  loading: boolean;
}

export function ClientTable({ clients, onEditClient, onDeleteClient, loading }: ClientTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenso</Badge>;
      case 'trial':
        return <Badge variant="secondary">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'basic':
        return <Users className="w-4 h-4" />;
      case 'pro':
        return <Building className="w-4 h-4" />;
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'Básico';
      case 'pro':
        return 'Pro';
      case 'enterprise':
        return 'Enterprise';
      default:
        return plan;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum cliente encontrado</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Plano</TableHead>
          <TableHead>Campanhas</TableHead>
          <TableHead>Contatos</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell>{client.email}</TableCell>
            <TableCell>{client.company_name}</TableCell>
            <TableCell>{getStatusBadge(client.status)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getPlanIcon(client.plan_type)}
                <span className="capitalize">{getPlanLabel(client.plan_type)}</span>
              </div>
            </TableCell>
            <TableCell>{client.max_campaigns}</TableCell>
            <TableCell>{client.max_contacts.toLocaleString()}</TableCell>
            <TableCell>
              {new Date(client.created_at).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEditClient(client)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDeleteClient(client)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}