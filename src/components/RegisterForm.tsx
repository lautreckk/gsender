import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Gift, Clock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useWhiteLabelSettings } from '@/contexts/SettingsContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  couponCode: string;
}

interface RegisterFormProps {
  onRegister: (data: RegisterFormData) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

export const RegisterForm = ({ onRegister, onSwitchToLogin, isLoading = false }: RegisterFormProps) => {
  const whiteLabelSettings = useWhiteLabelSettings();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    couponCode: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros antes de continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      await onRegister(formData);
    } catch (error) {
      console.error('Erro no registro:', error);
    }
  };

  const updateForm = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getTrialInfo = () => {
    const coupon = formData.couponCode.toLowerCase().trim();
    if (coupon === 'gruposena') {
      return {
        days: 7,
        label: '7 dias grátis',
        variant: 'default' as const,
        icon: <Gift className="w-4 h-4" />
      };
    } else {
      return {
        days: 1,
        label: '24 horas grátis',
        variant: 'secondary' as const,
        icon: <Clock className="w-4 h-4" />
      };
    }
  };

  const trialInfo = getTrialInfo();

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
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Comece seu trial gratuito agora mesmo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponCode">Código do cupom (opcional)</Label>
              <Input
                id="couponCode"
                type="text"
                placeholder="Digite seu código"
                value={formData.couponCode}
                onChange={(e) => updateForm('couponCode', e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Badge variant={trialInfo.variant} className="flex items-center gap-1">
                  {trialInfo.icon}
                  {trialInfo.label}
                </Badge>
                {formData.couponCode.toLowerCase().trim() === 'gruposena' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                <strong>Trial gratuito:</strong> {trialInfo.label} para testar todas as funcionalidades.
                {formData.couponCode.toLowerCase().trim() !== 'gruposena' && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    💡 Dica: Use o código "gruposena" para 7 dias grátis
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar conta grátis'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Button variant="link" onClick={onSwitchToLogin} className="p-0 h-auto">
                Fazer login
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};