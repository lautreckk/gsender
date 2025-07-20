import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Save, Mail, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";

interface NotificationSettings {
  emailNotifications: boolean;
  webhookNotifications: boolean;
  campaignStart: boolean;
  campaignComplete: boolean;
  instanceDisconnect: boolean;
  quotaAlert: boolean;
  errorAlert: boolean;
}

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onUpdate: (updates: Partial<NotificationSettings>) => void;
  onSave: () => void;
  loading: boolean;
}

export function NotificationSettings({ settings, onUpdate, onSave, loading }: NotificationSettingsProps) {
  const notificationTypes = [
    {
      key: 'campaignStart' as keyof NotificationSettings,
      label: 'Início de Campanha',
      description: 'Notificar quando uma campanha for iniciada',
      icon: <MessageSquare className="w-4 h-4" />
    },
    {
      key: 'campaignComplete' as keyof NotificationSettings,
      label: 'Campanha Concluída',
      description: 'Notificar quando uma campanha for concluída',
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      key: 'instanceDisconnect' as keyof NotificationSettings,
      label: 'Instância Desconectada',
      description: 'Notificar quando uma instância WhatsApp desconectar',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      key: 'quotaAlert' as keyof NotificationSettings,
      label: 'Alerta de Cota',
      description: 'Notificar quando próximo do limite de mensagens',
      icon: <Bell className="w-4 h-4" />
    },
    {
      key: 'errorAlert' as keyof NotificationSettings,
      label: 'Alertas de Erro',
      description: 'Notificar sobre erros no sistema',
      icon: <AlertTriangle className="w-4 h-4" />
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Configurações de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Canais de Notificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <Label htmlFor="email-notifications">Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações via e-mail
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => onUpdate({ emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <div>
                    <Label htmlFor="webhook-notifications">Notificações via Webhook</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações para webhook
                    </p>
                  </div>
                </div>
                <Switch
                  id="webhook-notifications"
                  checked={settings.webhookNotifications}
                  onCheckedChange={(checked) => onUpdate({ webhookNotifications: checked })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Tipos de Notificação</h3>
            <div className="space-y-3">
              {notificationTypes.map((type) => (
                <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {type.icon}
                    <div>
                      <Label htmlFor={type.key}>{type.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={type.key}
                    checked={settings[type.key] as boolean}
                    onCheckedChange={(checked) => onUpdate({ [type.key]: checked })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações de Notificações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}