import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import { useWhiteLabelSettings } from '@/contexts/SettingsContext';

interface LoginFormProps {
  loginForm: {
    email: string;
    password: string;
  };
  onLogin: (e: React.FormEvent) => void;
  onUpdateForm: (field: 'email' | 'password', value: string) => void;
  onSwitchToRegister?: () => void;
  isLoading?: boolean;
}

export const LoginForm = ({ loginForm, onLogin, onUpdateForm, onSwitchToRegister, isLoading = false }: LoginFormProps) => {
  const whiteLabelSettings = useWhiteLabelSettings();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {whiteLabelSettings.logo ? (
              <img src={whiteLabelSettings.logo} alt="Logo" className="h-8 w-8" />
            ) : (
              <MessageCircle className="h-8 w-8 text-green-500" />
            )}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {whiteLabelSettings.companyName || 'Disparamator'}
            </h1>
          </div>
          <CardTitle>Fazer Login</CardTitle>
          <CardDescription>
            Entre na sua conta para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={loginForm.email}
                onChange={(e) => onUpdateForm('email', e.target.value)}
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
                onChange={(e) => onUpdateForm('password', e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {onSwitchToRegister && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Button variant="link" onClick={onSwitchToRegister} className="p-0 h-auto">
                  Criar conta grátis
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};