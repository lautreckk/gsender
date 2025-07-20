import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Save, X } from "lucide-react";

interface CampaignSettings {
  maxMessagesPerCampaign: number;
  maxContactsPerCampaign: number;
  defaultInterval: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  autoDeleteAfterDays: number;
}

interface CampaignSettingsProps {
  settings: CampaignSettings;
  onUpdate: (updates: Partial<CampaignSettings>) => void;
  onSave: () => void;
  loading: boolean;
}

export function CampaignSettings({ settings, onUpdate, onSave, loading }: CampaignSettingsProps) {
  const addFileType = (type: string) => {
    if (type && !settings.allowedFileTypes.includes(type)) {
      onUpdate({ allowedFileTypes: [...settings.allowedFileTypes, type] });
    }
  };

  const removeFileType = (type: string) => {
    onUpdate({ allowedFileTypes: settings.allowedFileTypes.filter(t => t !== type) });
  };

  const handleFileTypeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      addFileType(target.value);
      target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Configurações de Campanhas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="max-messages">Máximo de Mensagens por Campanha</Label>
              <Input
                id="max-messages"
                type="number"
                value={settings.maxMessagesPerCampaign}
                onChange={(e) => onUpdate({ maxMessagesPerCampaign: Number(e.target.value) })}
                min="1"
                max="100000"
              />
            </div>

            <div>
              <Label htmlFor="max-contacts">Máximo de Contatos por Campanha</Label>
              <Input
                id="max-contacts"
                type="number"
                value={settings.maxContactsPerCampaign}
                onChange={(e) => onUpdate({ maxContactsPerCampaign: Number(e.target.value) })}
                min="1"
                max="50000"
              />
            </div>

            <div>
              <Label htmlFor="default-interval">Intervalo Padrão (segundos)</Label>
              <Input
                id="default-interval"
                type="number"
                value={settings.defaultInterval}
                onChange={(e) => onUpdate({ defaultInterval: Number(e.target.value) })}
                min="1"
                max="3600"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Intervalo padrão entre envios de mensagens
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="max-file-size">Tamanho Máximo de Arquivo (MB)</Label>
              <Input
                id="max-file-size"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => onUpdate({ maxFileSize: Number(e.target.value) })}
                min="1"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="auto-delete-days">Auto-exclusão após (dias)</Label>
              <Input
                id="auto-delete-days"
                type="number"
                value={settings.autoDeleteAfterDays}
                onChange={(e) => onUpdate({ autoDeleteAfterDays: Number(e.target.value) })}
                min="1"
                max="365"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Campanhas concluídas serão excluídas automaticamente
              </p>
            </div>

            <div>
              <Label htmlFor="file-types">Tipos de Arquivo Permitidos</Label>
              <Input
                id="file-types"
                placeholder="Digite um tipo (ex: .jpg, .pdf) e pressione Enter"
                onKeyPress={handleFileTypeKeyPress}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.allowedFileTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                    {type}
                    <button
                      onClick={() => removeFileType(type)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
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
            Salvar Configurações de Campanhas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}