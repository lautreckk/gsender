import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from 'lucide-react';
import { Client } from '@/hooks/useClientManagement';

interface EditClientDialogProps {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => Promise<boolean>;
  saving: boolean;
}

export function EditClientDialog({ client, isOpen, onOpenChange, onUpdateClient, saving }: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_name: '',
    plan_type: 'basic',
    max_campaigns: 5,
    max_contacts: 1000,
    status: 'active'
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        company_name: client.company_name,
        plan_type: client.plan_type,
        max_campaigns: client.max_campaigns,
        max_contacts: client.max_contacts,
        status: client.status
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    
    const success = await onUpdateClient(client.id, formData);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const handlePlanChange = (planType: string) => {
    const planLimits = {
      basic: { max_campaigns: 5, max_contacts: 1000 },
      pro: { max_campaigns: 20, max_contacts: 10000 },
      enterprise: { max_campaigns: 100, max_contacts: 100000 }
    };

    setFormData(prev => ({
      ...prev,
      plan_type: planType,
      ...planLimits[planType as keyof typeof planLimits]
    }));
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Altere as informações do cliente conforme necessário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-company_name">Nome da Empresa</Label>
            <Input
              id="edit-company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-plan_type">Plano</Label>
              <Select value={formData.plan_type} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico (5 campanhas, 1.000 contatos)</SelectItem>
                  <SelectItem value="pro">Pro (20 campanhas, 10.000 contatos)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (100 campanhas, 100.000 contatos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'suspended' | 'trial' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-max_campaigns">Máx. Campanhas</Label>
              <Input
                id="edit-max_campaigns"
                type="number"
                value={formData.max_campaigns}
                onChange={(e) => setFormData(prev => ({ ...prev, max_campaigns: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-max_contacts">Máx. Contatos</Label>
              <Input
                id="edit-max_contacts"
                type="number"
                value={formData.max_contacts}
                onChange={(e) => setFormData(prev => ({ ...prev, max_contacts: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}