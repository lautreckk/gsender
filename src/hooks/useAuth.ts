import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface TenantData {
  name: string;
  logo: string;
  domain: string;
  primaryColor: string;
}

interface LoginForm {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });
  
  const [currentTenant, setCurrentTenant] = useState<TenantData | null>(() => {
    const savedTenant = localStorage.getItem('currentTenant');
    return savedTenant ? JSON.parse(savedTenant) : null;
  });
  
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      const tenantData: TenantData = {
        name: 'Minha Empresa',
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=face',
        domain: 'app.minhaempresa.com',
        primaryColor: '#25D366'
      };
      
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentTenant', JSON.stringify(tenantData));
      
      setIsAuthenticated(true);
      setCurrentTenant(tenantData);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Disparamator",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentTenant');
    
    setIsAuthenticated(false);
    setCurrentTenant(null);
    setLoginForm({ email: '', password: '' });
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
  };

  const updateLoginForm = (field: keyof LoginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  return {
    isAuthenticated,
    currentTenant,
    loginForm,
    handleLogin,
    handleLogout,
    updateLoginForm
  };
};