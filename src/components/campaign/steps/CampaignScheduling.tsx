import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Calendar, 
  PlayCircle, 
  Timer,
  AlertCircle,
  Settings
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CampaignData } from '../CampaignWizard';
import { useCampaignSettingsValues } from '@/contexts/SettingsContext';

interface CampaignSchedulingProps {
  data: CampaignData;
  onUpdate: (data: Partial<CampaignData>) => void;
}

const WEEK_DAYS = [
  { value: 'monday', label: 'Segunda', short: 'Seg' },
  { value: 'tuesday', label: 'Terça', short: 'Ter' },
  { value: 'wednesday', label: 'Quarta', short: 'Qua' },
  { value: 'thursday', label: 'Quinta', short: 'Qui' },
  { value: 'friday', label: 'Sexta', short: 'Sex' },
  { value: 'saturday', label: 'Sábado', short: 'Sáb' },
  { value: 'sunday', label: 'Domingo', short: 'Dom' },
];

export function CampaignScheduling({ data, onUpdate }: CampaignSchedulingProps) {
  const campaignSettings = useCampaignSettingsValues();
  const handleDayToggle = (day: string, checked: boolean) => {
    const currentDays = data.scheduling.days || [];
    const updatedDays = checked
      ? [...currentDays, day]
      : currentDays.filter(d => d !== day);
    
    onUpdate({
      scheduling: {
        ...data.scheduling,
        days: updatedDays
      }
    });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    onUpdate({
      scheduling: {
        ...data.scheduling,
        [field]: value
      }
    });
  };

  const handleIntervalChange = (value: string) => {
    const interval = parseInt(value) || campaignSettings.defaultInterval;
    onUpdate({
      scheduling: {
        ...data.scheduling,
        interval
      }
    });
  };

  const handleImmediateToggle = (immediate: boolean) => {
    onUpdate({
      scheduling: {
        ...data.scheduling,
        immediate
      }
    });
  };

  const handleStartDateChange = (value: string) => {
    onUpdate({
      scheduling: {
        ...data.scheduling,
        startDate: value
      }
    });
  };

  const selectAllDays = () => {
    const workDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    onUpdate({
      scheduling: {
        ...data.scheduling,
        days: workDays
      }
    });
  };

  const selectWeekend = () => {
    const weekendDays = ['saturday', 'sunday'];
    onUpdate({
      scheduling: {
        ...data.scheduling,
        days: weekendDays
      }
    });
  };

  const clearAllDays = () => {
    onUpdate({
      scheduling: {
        ...data.scheduling,
        days: []
      }
    });
  };

  const calculateEstimatedTime = () => {
    const totalMessages = data.messages.length;
    const totalContacts = data.contacts.length;
    const totalMessagesToSend = totalMessages * totalContacts;
    const intervalSeconds = data.scheduling.interval;
    const estimatedMinutes = Math.round((totalMessagesToSend * intervalSeconds) / 60);
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutos`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Início Imediato</Label>
              <p className="text-sm text-muted-foreground">
                Iniciar campanha imediatamente após a criação
              </p>
            </div>
            <Switch
              checked={data.scheduling.immediate}
              onCheckedChange={handleImmediateToggle}
            />
          </div>

          {!data.scheduling.immediate && (
            <div className="space-y-2">
              <Label htmlFor="start-date">Data e Hora de Início</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={data.scheduling.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={getCurrentDateTime()}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dias da Semana
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllDays}
            >
              Dias Úteis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectWeekend}
            >
              Fim de Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllDays}
            >
              Limpar
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {WEEK_DAYS.map((day) => (
              <div
                key={day.value}
                className={`flex items-center space-x-2 p-3 rounded-lg border ${
                  data.scheduling.days?.includes(day.value)
                    ? 'bg-primary/5 border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <Checkbox
                  id={day.value}
                  checked={data.scheduling.days?.includes(day.value) || false}
                  onCheckedChange={(checked) => 
                    handleDayToggle(day.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={day.value}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  <div className="hidden md:block">{day.label}</div>
                  <div className="md:hidden">{day.short}</div>
                </Label>
              </div>
            ))}
          </div>

          {data.scheduling.days && data.scheduling.days.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Selecionados:</span>
              <div className="flex flex-wrap gap-1">
                {data.scheduling.days.map((day) => {
                  const dayInfo = WEEK_DAYS.find(d => d.value === day);
                  return (
                    <Badge key={day} variant="secondary" className="text-xs">
                      {dayInfo?.short}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Horário de Início</Label>
              <Input
                id="start-time"
                type="time"
                value={data.scheduling.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Horário de Fim</Label>
              <Input
                id="end-time"
                type="time"
                value={data.scheduling.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
              />
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As mensagens serão enviadas apenas dentro do horário configurado.
              Fora do horário, as mensagens ficam na fila para o próximo período ativo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Intervalo entre Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo (segundos)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="3600"
              value={data.scheduling.interval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              placeholder={campaignSettings.defaultInterval.toString()}
            />
            <p className="text-sm text-muted-foreground">
              Tempo de espera entre o envio de cada mensagem (1-3600 segundos)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[10, 30, 60, 120].map((seconds) => (
              <Button
                key={seconds}
                variant="outline"
                size="sm"
                onClick={() => handleIntervalChange(seconds.toString())}
                className={data.scheduling.interval === seconds ? 'bg-primary/10' : ''}
              >
                {seconds}s
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Estimativa de Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {data.messages.length}
                </div>
                <div className="text-sm text-muted-foreground">Mensagens</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {data.contacts.length}
                </div>
                <div className="text-sm text-muted-foreground">Contatos</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {data.messages.length * data.contacts.length}
                </div>
                <div className="text-sm text-muted-foreground">Total de Envios</div>
              </div>
            </div>

            <Separator />

            <div className="text-center">
              <div className="text-lg font-semibold mb-1">
                Tempo Estimado: {calculateEstimatedTime()}
              </div>
              <p className="text-sm text-muted-foreground">
                Baseado no intervalo de {data.scheduling.interval} segundos entre mensagens
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Início:</span>
              <span className="font-medium">
                {data.scheduling.immediate ? 'Imediato' : 
                  data.scheduling.startDate ? 
                    new Date(data.scheduling.startDate).toLocaleString('pt-BR') : 
                    'Não definido'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dias:</span>
              <span className="font-medium">
                {data.scheduling.days?.length || 0} selecionado(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horário:</span>
              <span className="font-medium">
                {data.scheduling.startTime} - {data.scheduling.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intervalo:</span>
              <span className="font-medium">
                {data.scheduling.interval} segundos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}