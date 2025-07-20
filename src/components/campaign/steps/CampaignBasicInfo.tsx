import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Users, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CampaignData } from '../CampaignWizard';

interface CampaignBasicInfoProps {
  data: CampaignData;
  onUpdate: (data: Partial<CampaignData>) => void;
}

export function CampaignBasicInfo({ data, onUpdate }: CampaignBasicInfoProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
  };

  const handleTypeChange = (type: 'individual' | 'group') => {
    onUpdate({ type });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Informações da Campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Nome da Campanha *</Label>
            <Input
              id="campaign-name"
              placeholder="Ex: Campanha Black Friday 2024"
              value={data.name}
              onChange={handleNameChange}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Escolha um nome descritivo para identificar sua campanha
            </p>
          </div>

          <div className="space-y-4">
            <Label>Tipo de Campanha *</Label>
            <RadioGroup
              value={data.type}
              onValueChange={handleTypeChange}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="relative">
                <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                <Label
                  htmlFor="individual"
                  className="flex items-start gap-3 p-4 border-2 border-muted rounded-lg cursor-pointer transition-all hover:border-primary peer-checked:border-primary peer-checked:bg-primary/5"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-current opacity-0 peer-checked:opacity-100"></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">Individual</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Enviar mensagens personalizadas para contatos individuais
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="relative">
                <RadioGroupItem value="group" id="group" className="peer sr-only" />
                <Label
                  htmlFor="group"
                  className="flex items-start gap-3 p-4 border-2 border-muted rounded-lg cursor-pointer transition-all hover:border-primary peer-checked:border-primary peer-checked:bg-primary/5"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-current opacity-0 peer-checked:opacity-100"></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">Grupo</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Enviar mensagens para grupos do WhatsApp
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {data.type === 'group' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Campanhas do tipo "Grupo" são limitadas a apenas uma conexão WhatsApp.
                Certifique-se de que sua conexão está ativa antes de prosseguir.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">
                {data.name || 'Não definido'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium capitalize">
                {data.type === 'individual' ? 'Individual' : 'Grupo'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}