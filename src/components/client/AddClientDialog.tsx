import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from 'lucide-react';
import { NewClient } from '@/hooks/useClientManagement';

interface AddClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (client: NewClient) => Promise<boolean>;
  saving: boolean;
}

export function AddClientDialog({ isOpen, onOpenChange, onAddClient, saving }: AddClientDialogProps) {
  const [formData, setFormData] = useState<NewClient>({
    name: '',
    email: '',
    company_name: '',
    plan_type: 'basic',
    max_campaigns: 5,
    max_contacts: 1000
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onAddClient(formData);
    
    if (success) {
      // Reset form
      setFormData({
        name: '',
        email: '',
        company_name: '',
        plan_type: 'basic',
        max_campaigns: 5,
        max_contacts: 1000
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente para criar uma nova conta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company_name">Nome da Empresa</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="plan_type">Plano</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_campaigns">Máx. Campanhas</Label>
              <Input
                id="max_campaigns"
                type="number"
                value={formData.max_campaigns}
                onChange={(e) => setFormData(prev => ({ ...prev, max_campaigns: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="max_contacts">Máx. Contatos</Label>
              <Input
                id="max_contacts"
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
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Criar Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}