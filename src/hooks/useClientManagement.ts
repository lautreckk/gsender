import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string;
  status: 'active' | 'suspended' | 'trial';
  plan_type: 'basic' | 'pro' | 'enterprise';
  max_campaigns: number;
  max_contacts: number;
  created_at: string;
}

export interface NewClient {
  name: string;
  email: string;
  company_name: string;
  plan_type: string;
  max_campaigns: number;
  max_contacts: number;
}

// Função para gerar dados de exemplo
const getMockClients = (): Client[] => {
  return [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@empresa.com',
      company_name: 'Empresa ABC Ltda',
      status: 'active',
      plan_type: 'pro',
      max_campaigns: 20,
      max_contacts: 10000,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@startup.com',
      company_name: 'Startup Inovadora',
      status: 'trial',
      plan_type: 'basic',
      max_campaigns: 5,
      max_contacts: 1000,
      created_at: '2024-02-20T14:30:00Z'
    },
    {
      id: '3',
      name: 'Carlos Eduardo',
      email: 'carlos@corporacao.com.br',
      company_name: 'Corporação XYZ',
      status: 'active',
      plan_type: 'enterprise',
      max_campaigns: 100,
      max_contacts: 100000,
      created_at: '2024-01-05T09:15:00Z'
    },
    {
      id: '4',
      name: 'Ana Costa',
      email: 'ana@consultoria.net',
      company_name: 'Consultoria Premium',
      status: 'suspended',
      plan_type: 'pro',
      max_campaigns: 20,
      max_contacts: 10000,
      created_at: '2024-03-10T16:45:00Z'
    },
    {
      id: '5',
      name: 'Roberto Oliveira',
      email: 'roberto@loja.online',
      company_name: 'Loja Online Store',
      status: 'active',
      plan_type: 'basic',
      max_campaigns: 5,
      max_contacts: 1000,
      created_at: '2024-02-28T11:20:00Z'
    }
  ];
};

export const useClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Buscar clientes do Supabase
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        
        // Se a tabela não existe, usar dados de exemplo
        if (error.message.includes('relation "public.clients" does not exist')) {
          console.warn('Tabela clients não existe, usando dados de exemplo');
          setClients(getMockClients());
          toast({
            title: "Modo demonstração",
            description: "A tabela de clientes não foi configurada. Exibindo dados de exemplo.",
            variant: "default",
          });
          return;
        }
        
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      // Em caso de erro, usar dados de exemplo
      setClients(getMockClients());
      toast({
        title: "Modo demonstração",
        description: "Usando dados de exemplo. Configure o Supabase para dados reais.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Adicionar novo cliente
  const addClient = async (clientData: NewClient): Promise<boolean> => {
    try {
      setSaving(true);
      
      // Simular delay para demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        
        // Se a tabela não existe, simular adição local
        if (error.message.includes('relation "public.clients" does not exist')) {
          const newClient: Client = {
            id: Date.now().toString(),
            ...clientData,
            status: 'active',
            created_at: new Date().toISOString()
          };
          
          setClients(prev => [newClient, ...prev]);
          
          toast({
            title: "Cliente criado (Demo)",
            description: `O cliente ${clientData.name} foi adicionado ao modo demonstração.`,
          });
          
          return true;
        }
        
        toast({
          title: "Erro ao criar cliente",
          description: "Não foi possível criar o cliente. Verifique os dados.",
          variant: "destructive",
        });
        return false;
      }

      // Atualizar lista local
      setClients(prev => [data, ...prev]);
      
      toast({
        title: "Cliente criado com sucesso!",
        description: `O cliente ${clientData.name} foi adicionado.`,
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      
      // Fallback para modo demo
      const newClient: Client = {
        id: Date.now().toString(),
        ...clientData,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      setClients(prev => [newClient, ...prev]);
      
      toast({
        title: "Cliente criado (Demo)",
        description: `O cliente ${clientData.name} foi adicionado ao modo demonstração.`,
      });
      
      return true;
    } finally {
      setSaving(false);
    }
  };

  // Atualizar cliente
  const updateClient = async (clientId: string, updates: Partial<Client>): Promise<boolean> => {
    try {
      setSaving(true);
      
      // Simular delay para demo
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        
        // Se a tabela não existe, simular atualização local
        if (error.message.includes('relation "public.clients" does not exist')) {
          setClients(prev => 
            prev.map(client => 
              client.id === clientId ? { ...client, ...updates } : client
            )
          );
          
          toast({
            title: "Cliente atualizado (Demo)",
            description: "As informações foram atualizadas no modo demonstração.",
          });
          
          return true;
        }
        
        toast({
          title: "Erro ao atualizar cliente",
          description: "Não foi possível atualizar o cliente.",
          variant: "destructive",
        });
        return false;
      }

      // Atualizar lista local
      setClients(prev => 
        prev.map(client => 
          client.id === clientId ? { ...client, ...data } : client
        )
      );
      
      toast({
        title: "Cliente atualizado!",
        description: "As informações do cliente foram atualizadas.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      
      // Fallback para modo demo
      setClients(prev => 
        prev.map(client => 
          client.id === clientId ? { ...client, ...updates } : client
        )
      );
      
      toast({
        title: "Cliente atualizado (Demo)",
        description: "As informações foram atualizadas no modo demonstração.",
      });
      
      return true;
    } finally {
      setSaving(false);
    }
  };

  // Deletar cliente
  const deleteClient = async (clientId: string): Promise<boolean> => {
    try {
      setSaving(true);
      
      // Simular delay para demo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Erro ao deletar cliente:', error);
        
        // Se a tabela não existe, simular deleção local
        if (error.message.includes('relation "public.clients" does not exist')) {
          setClients(prev => prev.filter(client => client.id !== clientId));
          
          toast({
            title: "Cliente deletado (Demo)",
            description: "O cliente foi removido do modo demonstração.",
          });
          
          return true;
        }
        
        toast({
          title: "Erro ao deletar cliente",
          description: "Não foi possível deletar o cliente.",
          variant: "destructive",
        });
        return false;
      }

      // Atualizar lista local
      setClients(prev => prev.filter(client => client.id !== clientId));
      
      toast({
        title: "Cliente deletado!",
        description: "O cliente foi removido com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      
      // Fallback para modo demo
      setClients(prev => prev.filter(client => client.id !== clientId));
      
      toast({
        title: "Cliente deletado (Demo)",
        description: "O cliente foi removido do modo demonstração.",
      });
      
      return true;
    } finally {
      setSaving(false);
    }
  };

  // Alterar status do cliente
  const changeClientStatus = async (clientId: string, status: 'active' | 'suspended' | 'trial'): Promise<boolean> => {
    return updateClient(clientId, { status });
  };

  // Alterar plano do cliente
  const changeClientPlan = async (clientId: string, planType: 'basic' | 'pro' | 'enterprise'): Promise<boolean> => {
    const planLimits = {
      basic: { max_campaigns: 5, max_contacts: 1000 },
      pro: { max_campaigns: 20, max_contacts: 10000 },
      enterprise: { max_campaigns: 100, max_contacts: 100000 }
    };

    return updateClient(clientId, {
      plan_type: planType,
      ...planLimits[planType]
    });
  };

  // Buscar estatísticas dos clientes
  const getClientStats = useCallback(() => {
    const stats = {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      suspended: clients.filter(c => c.status === 'suspended').length,
      trial: clients.filter(c => c.status === 'trial').length,
      basic: clients.filter(c => c.plan_type === 'basic').length,
      pro: clients.filter(c => c.plan_type === 'pro').length,
      enterprise: clients.filter(c => c.plan_type === 'enterprise').length
    };

    return stats;
  }, [clients]);

  // Buscar cliente por ID
  const getClientById = useCallback((clientId: string): Client | undefined => {
    return clients.find(client => client.id === clientId);
  }, [clients]);

  // Filtrar clientes
  const filterClients = useCallback((filters: {
    status?: string;
    planType?: string;
    searchTerm?: string;
  }) => {
    let filtered = clients;

    if (filters.status) {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    if (filters.planType) {
      filtered = filtered.filter(client => client.plan_type === filters.planType);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.company_name.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [clients]);

  // Carregar clientes na inicialização
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    saving,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
    changeClientStatus,
    changeClientPlan,
    getClientStats,
    getClientById,
    filterClients
  };
};