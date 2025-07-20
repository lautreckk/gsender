import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, Download, Upload, Save, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface BackupSettingsProps {
  onSave: () => void;
  loading: boolean;
}

export function BackupSettings({ onSave, loading }: BackupSettingsProps) {
  const [autoBackup, setAutoBackup] = React.useState(true);
  const [backupFrequency, setBackupFrequency] = React.useState('daily');
  const [backupRetention, setBackupRetention] = React.useState(30);
  const [includeMedia, setIncludeMedia] = React.useState(false);

  const backups = [
    {
      id: 1,
      date: '2024-01-15 10:30:00',
      size: '2.3 GB',
      type: 'Completo',
      status: 'success'
    },
    {
      id: 2,
      date: '2024-01-14 10:30:00',
      size: '1.8 GB',
      type: 'Incremental',
      status: 'success'
    },
    {
      id: 3,
      date: '2024-01-13 10:30:00',
      size: '2.1 GB',
      type: 'Completo',
      status: 'success'
    },
    {
      id: 4,
      date: '2024-01-12 10:30:00',
      size: '1.5 GB',
      type: 'Incremental',
      status: 'error'
    }
  ];

  const handleManualBackup = () => {
    // Implementar backup manual
    console.log('Iniciando backup manual...');
  };

  const handleRestoreBackup = (backupId: number) => {
    // Implementar restauração
    console.log(`Restaurando backup ${backupId}...`);
  };

  const handleDownloadBackup = (backupId: number) => {
    // Implementar download
    console.log(`Baixando backup ${backupId}...`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Processando</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configurações de Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="auto-backup">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Realizar backups automaticamente
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>

              {autoBackup && (
                <div>
                  <Label htmlFor="backup-frequency">Frequência do Backup</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="include-media">Incluir Arquivos de Mídia</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir imagens, documentos e outros arquivos
                  </p>
                </div>
                <Switch
                  id="include-media"
                  checked={includeMedia}
                  onCheckedChange={setIncludeMedia}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ações de Backup</Label>
                <Button onClick={handleManualBackup} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Backup Manual
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4" />
                  <span className="font-semibold">Próximo Backup</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hoje às 23:00 (em 4 horas)
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">Último Backup</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hoje às 10:30 (2.3 GB)
                </p>
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
              Salvar Configurações de Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Backups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(backup.status)}
                  <div>
                    <p className="font-medium">{backup.date}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{backup.size}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>{backup.type}</span>
                      <Separator orientation="vertical" className="h-4" />
                      {getStatusBadge(backup.status)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadBackup(backup.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreBackup(backup.id)}
                    disabled={backup.status === 'error'}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}