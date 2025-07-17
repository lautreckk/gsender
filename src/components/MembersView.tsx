
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Edit, Trash2, Shield, MessageCircle, Users, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: number;
  name: string;
  email: string;
  connectionsCount: number;
  status: 'active' | 'suspended';
  canSendIndividual: boolean;
  canSendGroup: boolean;
  createdAt: string;
}

const mockMembers: Member[] = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao@empresa.com',
    connectionsCount: 3,
    status: 'active',
    canSendIndividual: true,
    canSendGroup: false,
    createdAt: '2024-01-10'
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    connectionsCount: 2,
    status: 'active',
    canSendIndividual: true,
    canSendGroup: true,
    createdAt: '2024-01-12'
  },
  {
    id: 3,
    name: 'Pedro Costa',
    email: 'pedro@empresa.com',
    connectionsCount: 1,
    status: 'suspended',
    canSendIndividual: false,
    canSendGroup: false,
    createdAt: '2024-01-15'
  }
];

export function MembersView() {
  const [members, setMembers] = useState(mockMembers);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    canSendIndividual: true,
    canSendGroup: false
  });
  const { toast } = useToast();

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Erro",
        description: "Nome e e-mail são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const member: Member = {
      id: Date.now(),
      name: newMember.name,
      email: newMember.email,
      connectionsCount: 0,
      status: 'active',
      canSendIndividual: newMember.canSendIndividual,
      canSendGroup: newMember.canSendGroup,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setMembers([...members, member]);
    setNewMember({ name: '', email: '', canSendIndividual: true, canSendGroup: false });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Membro adicionado",
      description: `${member.name} foi adicionado com sucesso. Um convite foi enviado para ${member.email}.`
    });
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;

    setMembers(members.map(m => 
      m.id === editingMember.id ? editingMember : m
    ));
    setEditingMember(null);
    
    toast({
      title: "Membro atualizado",
      description: "As informações do membro foram atualizadas com sucesso."
    });
  };

  const handleToggleStatus = (id: number) => {
    setMembers(members.map(member => 
      member.id === id 
        ? { ...member, status: member.status === 'active' ? 'suspended' : 'active' as const }
        : member
    ));
    
    const member = members.find(m => m.id === id);
    toast({
      title: "Status alterado",
      description: `${member?.name} foi ${member?.status === 'active' ? 'suspenso' : 'ativado'}.`
    });
  };

  const handleDeleteMember = (id: number) => {
    const member = members.find(m => m.id === id);
    if (confirm(`Tem certeza que deseja excluir ${member?.name}? Esta ação não pode ser desfeita.`)) {
      setMembers(members.filter(m => m.id !== id));
      toast({
        title: "Membro excluído",
        description: `${member?.name} foi excluído do sistema.`
      });
    }
  };

  const handleImpersonate = (member: Member) => {
    toast({
      title: "Impersonação ativada",
      description: `Você agora está visualizando o sistema como ${member.name}.`
    });
    // Implementar lógica de impersonação
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Gestão de Membros</h2>
          <p className="text-muted-foreground">
            Gerencie os membros da sua empresa e suas permissões
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Membro</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo membro. Um convite será enviado por e-mail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="email@empresa.com"
                />
              </div>
              <div className="space-y-4">
                <Label>Permissões</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="individual" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Pode disparar individual
                  </Label>
                  <Switch
                    id="individual"
                    checked={newMember.canSendIndividual}
                    onCheckedChange={(checked) => setNewMember({...newMember, canSendIndividual: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="group" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pode disparar em grupo
                  </Label>
                  <Switch
                    id="group"
                    checked={newMember.canSendGroup}
                    onCheckedChange={(checked) => setNewMember({...newMember, canSendGroup: checked})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember}>
                Adicionar Membro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Membros</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Membros Ativos</p>
                <p className="text-2xl font-bold">{members.filter(m => m.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Conexões</p>
                <p className="text-2xl font-bold">{members.reduce((acc, m) => acc + m.connectionsCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            Lista completa dos membros da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Conexões</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {member.connectionsCount} conexões
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {member.canSendIndividual && (
                        <Badge variant="secondary" className="text-xs">
                          Individual
                        </Badge>
                      )}
                      {member.canSendGroup && (
                        <Badge variant="secondary" className="text-xs">
                          Grupo
                        </Badge>
                      )}
                      {!member.canSendIndividual && !member.canSendGroup && (
                        <Badge variant="outline" className="text-xs">
                          Sem permissões
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={member.status === 'active' ? 'default' : 'destructive'}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(member.id)}
                    >
                      {member.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImpersonate(member)}
                        title="Impersonar usuário"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Membro</DialogTitle>
              <DialogDescription>
                Atualize as informações e permissões do membro
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({...editingMember, email: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <Label>Permissões</Label>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Pode disparar individual
                  </Label>
                  <Switch
                    checked={editingMember.canSendIndividual}
                    onCheckedChange={(checked) => setEditingMember({...editingMember, canSendIndividual: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pode disparar em grupo
                  </Label>
                  <Switch
                    checked={editingMember.canSendGroup}
                    onCheckedChange={(checked) => setEditingMember({...editingMember, canSendGroup: checked})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateMember}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
