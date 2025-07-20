
import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  name: string;
  email: string;
  connections_count: number;
  status: 'active' | 'suspended';
  can_send_individual: boolean;
  can_send_group: boolean;
  created_at: string;
}

export function MembersView() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    can_send_individual: true,
    can_send_group: false
  });
  const { toast } = useToast();

  // Função para buscar membros do Supabase
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar membros:', error);
        toast({
          title: 'Erro ao carregar membros',
          description: 'Não foi possível carregar os membros. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setMembers(data || []);
      console.log('📊 Membros carregados do Supabase:', data?.length || 0, data);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar membros quando component montar
  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Erro",
        description: "Nome e e-mail são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .insert({
          name: newMember.name,
          email: newMember.email,
          status: 'active',
          can_send_individual: newMember.can_send_individual,
          can_send_group: newMember.can_send_group,
          connections_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar membro:', error);
        toast({
          title: "Erro",
          description: error.message.includes('duplicate') ? 
            "Este e-mail já está em uso" : 
            "Erro ao adicionar membro. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      await fetchMembers(); // Reload the list
      setNewMember({ name: '', email: '', can_send_individual: true, can_send_group: false });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Membro adicionado",
        description: `${data.name} foi adicionado com sucesso. Um convite foi enviado para ${data.email}.`
      });
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: editingMember.name,
          email: editingMember.email,
          can_send_individual: editingMember.can_send_individual,
          can_send_group: editingMember.can_send_group,
          status: editingMember.status
        })
        .eq('id', editingMember.id);

      if (error) {
        console.error('Erro ao atualizar membro:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar membro. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      await fetchMembers(); // Reload the list
      setEditingMember(null);
      
      toast({
        title: "Membro atualizado",
        description: "As informações do membro foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar membro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    const newStatus = member.status === 'active' ? 'suspended' : 'active';

    try {
      const { error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Erro ao alterar status:', error);
        toast({
          title: "Erro",
          description: "Erro ao alterar status. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      await fetchMembers(); // Reload the list
      
      toast({
        title: "Status alterado",
        description: `${member.name} foi ${newStatus === 'active' ? 'ativado' : 'suspenso'}.`
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMember = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    if (confirm(`Tem certeza que deseja excluir ${member.name}? Esta ação não pode ser desfeita.`)) {
      try {
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Erro ao excluir membro:', error);
          toast({
            title: "Erro",
            description: "Erro ao excluir membro. Tente novamente.",
            variant: "destructive"
          });
          return;
        }

        await fetchMembers(); // Reload the list
        
        toast({
          title: "Membro excluído",
          description: `${member.name} foi excluído do sistema.`
        });
      } catch (error) {
        console.error('Erro ao excluir membro:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir membro. Tente novamente.",
          variant: "destructive"
        });
      }
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
                    checked={newMember.can_send_individual}
                    onCheckedChange={(checked) => setNewMember({...newMember, can_send_individual: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="group" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pode disparar em grupo
                  </Label>
                  <Switch
                    id="group"
                    checked={newMember.can_send_group}
                    onCheckedChange={(checked) => setNewMember({...newMember, can_send_group: checked})}
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
                <p className="text-2xl font-bold">{members.reduce((acc, m) => acc + m.connections_count, 0)}</p>
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
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center p-8">
              <div className="text-muted-foreground space-y-2">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg">Nenhum membro encontrado</p>
                <p className="text-sm">Comece adicionando o primeiro membro da equipe</p>
              </div>
            </div>
          ) : (
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
                        {member.connections_count} conexões
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {member.can_send_individual && (
                          <Badge variant="secondary" className="text-xs">
                            Individual
                          </Badge>
                        )}
                        {member.can_send_group && (
                          <Badge variant="secondary" className="text-xs">
                            Grupo
                          </Badge>
                        )}
                        {!member.can_send_individual && !member.can_send_group && (
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
                    <TableCell>{new Date(member.created_at).toLocaleDateString('pt-BR')}</TableCell>
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
          )}
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
                    checked={editingMember.can_send_individual}
                    onCheckedChange={(checked) => setEditingMember({...editingMember, can_send_individual: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pode disparar em grupo
                  </Label>
                  <Switch
                    checked={editingMember.can_send_group}
                    onCheckedChange={(checked) => setEditingMember({...editingMember, can_send_group: checked})}
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
