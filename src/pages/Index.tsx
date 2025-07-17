
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Users, BarChart3, Settings, Send, History } from 'lucide-react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ConnectionCard } from '@/components/ConnectionCard';
import { CampaignCard } from '@/components/CampaignCard';
import { MetricCard } from '@/components/MetricCard';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock data for demo
  const mockConnections = [
    { id: 1, name: 'WhatsApp Principal', phone: '+55 11 99999-9999', status: 'connected', lastActivity: '2 min atrás' },
    { id: 2, name: 'Suporte', phone: '+55 11 88888-8888', status: 'disconnected', lastActivity: '1 hora atrás' },
    { id: 3, name: 'Vendas', phone: '+55 11 77777-7777', status: 'connecting', lastActivity: 'Conectando...' }
  ];

  const mockCampaigns = [
    { id: 1, name: 'Black Friday 2024', type: 'individual', status: 'active', contacts: 1250, sent: 450, scheduled: '14:00' },
    { id: 2, name: 'Promoção Verão', type: 'group', status: 'paused', contacts: 800, sent: 800, scheduled: 'Pausada' },
    { id: 3, name: 'Newsletter Semanal', type: 'individual', status: 'completed', contacts: 2100, sent: 2100, scheduled: 'Concluída' }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      setIsAuthenticated(true);
      setCurrentTenant({
        name: 'Minha Empresa',
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=face',
        domain: 'app.minhaempresa.com',
        primaryColor: '#25D366'
      });
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Disparamator",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MessageCircle className="h-8 w-8 text-green-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Disparamator
              </h1>
            </div>
            <CardTitle>Fazer Login</CardTitle>
            <CardDescription>
              Entre na sua conta para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral das suas atividades</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Conexões Ativas" value="2" icon={MessageCircle} color="text-green-500" />
        <MetricCard title="Mensagens Enviadas" value="3,350" icon={Send} color="text-blue-500" />
        <MetricCard title="Campanhas Ativas" value="1" icon={BarChart3} color="text-purple-500" />
        <MetricCard title="Contatos" value="4,150" icon={Users} color="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conexões WhatsApp</CardTitle>
            <CardDescription>Status das suas conexões ativas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockConnections.slice(0, 3).map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campanhas Recentes</CardTitle>
            <CardDescription>Suas últimas campanhas de disparo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockCampaigns.slice(0, 3).map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderConnections = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Conexões WhatsApp</h2>
          <p className="text-muted-foreground">Gerencie suas conexões do WhatsApp</p>
        </div>
        <Button>
          <MessageCircle className="mr-2 h-4 w-4" />
          Nova Conexão
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockConnections.map((connection) => (
          <Card key={connection.id}>
            <CardContent className="p-6">
              <ConnectionCard connection={connection} detailed />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Campanhas</h2>
          <p className="text-muted-foreground">Crie e gerencie suas campanhas de disparo</p>
        </div>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>
      
      <div className="space-y-4">
        {mockCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <CampaignCard campaign={campaign} detailed />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DashboardSidebar 
          tenant={currentTenant}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={() => setIsAuthenticated(false)}
        />
        
        <main className="flex-1 p-6 ml-64">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'connections' && renderConnections()}
          {activeView === 'campaigns' && renderCampaigns()}
          {activeView === 'history' && (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Histórico em Desenvolvimento</h3>
              <p className="text-muted-foreground">Esta seção será implementada em breve</p>
            </div>
          )}
          {activeView === 'settings' && (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Configurações em Desenvolvimento</h3>
              <p className="text-muted-foreground">Esta seção será implementada em breve</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
