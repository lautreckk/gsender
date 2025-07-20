import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Save, Eye, EyeOff, RefreshCw, AlertTriangle } from "lucide-react";

interface APISettings {
  evolutionApiUrl: string;
  evolutionApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  webhookUrl: string;
  webhookSecret: string;
  rateLimitPerMinute: number;
  timeout: number;
  retryAttempts: number;
}

interface ApiSettingsProps {
  settings: APISettings;
  onUpdate: (updates: Partial<APISettings>) => void;
  onSave: () => void;
  loading: boolean;
}

export function ApiSettings({ settings, onUpdate, onSave, loading }: ApiSettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [showEvolutionApiKey, setShowEvolutionApiKey] = useState(false);
  const [showSupabaseAnonKey, setShowSupabaseAnonKey] = useState(false);
  const [showSupabaseServiceKey, setShowSupabaseServiceKey] = useState(false);

  const generateWebhookSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    onUpdate({ webhookSecret: secret });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Configurações de API e Integração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Mantenha suas chaves de API em segurança. Não compartilhe com terceiros.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* EvolutionAPI Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">EvolutionAPI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="evolution-api-url">URL do Servidor EvolutionAPI</Label>
                <Input
                  id="evolution-api-url"
                  value={settings.evolutionApiUrl}
                  onChange={(e) => onUpdate({ evolutionApiUrl: e.target.value })}
                  placeholder="https://api.gruposena.club"
                />
              </div>
              <div>
                <Label htmlFor="evolution-api-key">API Key Global</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="evolution-api-key"
                    type={showEvolutionApiKey ? "text" : "password"}
                    value={settings.evolutionApiKey}
                    onChange={(e) => onUpdate({ evolutionApiKey: e.target.value })}
                    placeholder="Sua chave API global da EvolutionAPI"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEvolutionApiKey(!showEvolutionApiKey)}
                  >
                    {showEvolutionApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Supabase Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Supabase</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="supabase-url">URL do Projeto</Label>
                <Input
                  id="supabase-url"
                  value={settings.supabaseUrl}
                  onChange={(e) => onUpdate({ supabaseUrl: e.target.value })}
                  placeholder="https://seuprojetoid.supabase.co"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supabase-anon-key">Anon Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="supabase-anon-key"
                      type={showSupabaseAnonKey ? "text" : "password"}
                      value={settings.supabaseAnonKey}
                      onChange={(e) => onUpdate({ supabaseAnonKey: e.target.value })}
                      placeholder="Chave anônima do Supabase"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSupabaseAnonKey(!showSupabaseAnonKey)}
                    >
                      {showSupabaseAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="supabase-service-key">Service Role Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="supabase-service-key"
                      type={showSupabaseServiceKey ? "text" : "password"}
                      value={settings.supabaseServiceRoleKey}
                      onChange={(e) => onUpdate({ supabaseServiceRoleKey: e.target.value })}
                      placeholder="Chave de service role do Supabase"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSupabaseServiceKey(!showSupabaseServiceKey)}
                    >
                      {showSupabaseServiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Webhooks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <Label htmlFor="webhook-url">URL do Webhook</Label>
                <Input
                  id="webhook-url"
                  value={settings.webhookUrl}
                  onChange={(e) => onUpdate({ webhookUrl: e.target.value })}
                  placeholder="https://seuapp.com/webhook"
                />
              </div>
              <div>
                <Label htmlFor="webhook-secret">Segredo do Webhook</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="webhook-secret"
                    type={showWebhookSecret ? "text" : "password"}
                    value={settings.webhookSecret}
                    onChange={(e) => onUpdate({ webhookSecret: e.target.value })}
                    placeholder="Segredo para validar webhooks"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  >
                    {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateWebhookSecret}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Configurações Avançadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rate-limit">Limite de Requisições por Minuto</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={settings.rateLimitPerMinute}
                  onChange={(e) => onUpdate({ rateLimitPerMinute: Number(e.target.value) })}
                  min="1"
                  max="1000"
                />
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={settings.timeout}
                  onChange={(e) => onUpdate({ timeout: Number(e.target.value) })}
                  min="1"
                  max="300"
                />
              </div>
              <div>
                <Label htmlFor="retry-attempts">Tentativas de Retry</Label>
                <Input
                  id="retry-attempts"
                  type="number"
                  value={settings.retryAttempts}
                  onChange={(e) => onUpdate({ retryAttempts: Number(e.target.value) })}
                  min="0"
                  max="10"
                />
              </div>
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
            Salvar Configurações de API
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}