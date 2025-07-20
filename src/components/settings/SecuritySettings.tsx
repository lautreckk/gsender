import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, Plus, Trash2, Lock, Clock } from "lucide-react";

interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireStrongPassword: boolean;
  enableTwoFactor: boolean;
  ipWhitelist: string[];
  logRetentionDays: number;
}

interface SecuritySettingsProps {
  settings: SecuritySettings;
  onUpdate: (updates: Partial<SecuritySettings>) => void;
  onSave: () => void;
  loading: boolean;
}

export function SecuritySettings({ settings, onUpdate, onSave, loading }: SecuritySettingsProps) {
  const addToWhitelist = () => {
    const newIp = prompt('Digite o IP para adicionar à whitelist:');
    if (newIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(newIp)) {
      const newWhitelist = [...settings.ipWhitelist, newIp];
      onUpdate({ ipWhitelist: newWhitelist });
    }
  };

  const removeFromWhitelist = (ip: string) => {
    const newWhitelist = settings.ipWhitelist.filter(item => item !== ip);
    onUpdate({ ipWhitelist: newWhitelist });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Configurações de Segurança
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-timeout">Timeout da Sessão (minutos)</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => onUpdate({ sessionTimeout: Number(e.target.value) })}
                  min="5"
                  max="1440"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="max-login-attempts">Máximo de Tentativas de Login</Label>
              <Input
                id="max-login-attempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => onUpdate({ maxLoginAttempts: Number(e.target.value) })}
                min="1"
                max="10"
              />
            </div>

            <div>
              <Label htmlFor="log-retention-days">Retenção de Logs (dias)</Label>
              <Input
                id="log-retention-days"
                type="number"
                value={settings.logRetentionDays}
                onChange={(e) => onUpdate({ logRetentionDays: Number(e.target.value) })}
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-yellow-500" />
                <div>
                  <Label htmlFor="require-strong-password">Senha Forte Obrigatória</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir senhas com pelo menos 8 caracteres
                  </p>
                </div>
              </div>
              <Switch
                id="require-strong-password"
                checked={settings.requireStrongPassword}
                onCheckedChange={(checked) => onUpdate({ requireStrongPassword: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <Label htmlFor="enable-two-factor">Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar 2FA para todos os usuários
                  </p>
                </div>
              </div>
              <Switch
                id="enable-two-factor"
                checked={settings.enableTwoFactor}
                onCheckedChange={(checked) => onUpdate({ enableTwoFactor: checked })}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Whitelist de IPs</Label>
            <Button variant="outline" size="sm" onClick={addToWhitelist}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar IP
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[50px] p-3 border rounded-lg">
            {settings.ipWhitelist.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum IP na whitelist. Adicione IPs para restringir o acesso.
              </p>
            ) : (
              settings.ipWhitelist.map((ip) => (
                <Badge key={ip} variant="secondary" className="flex items-center gap-1">
                  {ip}
                  <button
                    onClick={() => removeFromWhitelist(ip)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações de Segurança
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}