import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Eye,
  Download
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { CampaignData, ContactData } from '../CampaignWizard';
import { useCampaignSettingsValues } from '@/contexts/SettingsContext';

interface ContactUploadProps {
  data: CampaignData;
  onUpdate: (data: Partial<CampaignData>) => void;
}

interface ValidationResult {
  valid: ContactData[];
  invalid: Array<{ row: number; data: any; errors: string[] }>;
  duplicates: Array<{ row: number; numero: string }>;
}

export function ContactUpload({ data, onUpdate }: ContactUploadProps) {
  const campaignSettings = useCampaignSettingsValues();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: "Formato de arquivo inválido",
        description: "Apenas arquivos CSV ou XLSX são suportados",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const result = await parseFile(file);
      setValidationResult(result);
      
      if (result.valid.length > 0) {
        onUpdate({ contacts: result.valid });
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique o formato do arquivo e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const parseFile = async (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = validateCsvData(text);
        resolve(result);
      };
      
      reader.readAsText(file);
    });
  };

  const validateCsvData = (csvText: string): ValidationResult => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const requiredColumns = ['nome', 'numero', 'tag'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`);
    }

    const nameIndex = headers.indexOf('nome');
    const phoneIndex = headers.indexOf('numero');
    const tagIndex = headers.indexOf('tag');

    const valid: ContactData[] = [];
    const invalid: Array<{ row: number; data: any; errors: string[] }> = [];
    const duplicates: Array<{ row: number; numero: string }> = [];
    const phoneSet = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim());
      const errors: string[] = [];
      
      const nome = columns[nameIndex] || '';
      const numero = columns[phoneIndex] || '';
      const tag = columns[tagIndex] || '';

      if (!nome) errors.push('Nome é obrigatório');
      if (!numero) errors.push('Número é obrigatório');
      if (!tag) errors.push('Tag é obrigatória');

      if (numero && !/^\d{10,15}$/.test(numero.replace(/\D/g, ''))) {
        errors.push('Número deve ter entre 10 e 15 dígitos');
      }

      if (phoneSet.has(numero)) {
        duplicates.push({ row: i + 1, numero });
      } else {
        phoneSet.add(numero);
      }

      if (errors.length > 0) {
        invalid.push({ row: i + 1, data: { nome, numero, tag }, errors });
      } else {
        valid.push({ nome, numero, tag });
      }
    }

    // Check if exceeds maximum contacts limit
    if (valid.length > campaignSettings.maxContactsPerCampaign) {
      throw new Error(`Limite excedido: máximo de ${campaignSettings.maxContactsPerCampaign} contatos por campanha. Arquivo contém ${valid.length} contatos válidos.`);
    }

    return { valid, invalid, duplicates };
  };

  const downloadTemplate = () => {
    const csvContent = 'nome,numero,tag\nJoão Silva,5511999999999,cliente_vip\nMaria Santos,5511888888888,lead_quente\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_contatos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearContacts = () => {
    setValidationResult(null);
    onUpdate({ contacts: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderValidationSummary = () => {
    if (!validationResult) return null;

    const { valid, invalid, duplicates } = validationResult;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resultado da Validação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">{valid.length}</div>
                <div className="text-sm text-green-600">Contatos válidos</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-red-900">{invalid.length}</div>
                <div className="text-sm text-red-600">Contatos inválidos</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-900">{duplicates.length}</div>
                <div className="text-sm text-yellow-600">Duplicatas</div>
              </div>
            </div>
          </div>

          {invalid.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Contatos inválidos encontrados:</strong>
                <ul className="mt-2 space-y-1">
                  {invalid.slice(0, 3).map((item, index) => (
                    <li key={index} className="text-sm">
                      Linha {item.row}: {item.errors.join(', ')}
                    </li>
                  ))}
                  {invalid.length > 3 && (
                    <li className="text-sm">... e mais {invalid.length - 3} erros</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {duplicates.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Números duplicados encontrados:</strong>
                <div className="mt-2 text-sm">
                  {duplicates.slice(0, 3).map((item, index) => (
                    <div key={index}>Linha {item.row}: {item.numero}</div>
                  ))}
                  {duplicates.length > 3 && (
                    <div>... e mais {duplicates.length - 3} duplicatas</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              disabled={valid.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Ocultar' : 'Visualizar'} Contatos
            </Button>
            <Button variant="outline" onClick={clearContacts}>
              <XCircle className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContactPreview = () => {
    if (!showPreview || !validationResult?.valid.length) return null;

    const contactsToShow = validationResult.valid.slice(0, 5);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Preview dos Contatos
            <Badge variant="secondary">
              {contactsToShow.length} de {validationResult.valid.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contactsToShow.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{contact.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {contact.numero}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{contact.tag}</Badge>
              </div>
            ))}
            
            {validationResult.valid.length > 5 && (
              <div className="text-center text-sm text-muted-foreground">
                ... e mais {validationResult.valid.length - 5} contatos
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Contatos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Planilha de Contatos</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Arraste e solte sua planilha aqui ou
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Processando...' : 'Selecionar Arquivo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato obrigatório:</strong> Sua planilha deve conter as colunas:
              <code className="mx-1 px-1 py-0.5 bg-muted rounded">nome</code>,
              <code className="mx-1 px-1 py-0.5 bg-muted rounded">numero</code> (com DDI),
              <code className="mx-1 px-1 py-0.5 bg-muted rounded">tag</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {renderValidationSummary()}
      {renderContactPreview()}

      <Card>
        <CardHeader>
          <CardTitle>Regras de Validação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Colunas obrigatórias:</strong> nome, numero, tag
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Formato do número:</strong> Deve conter DDI (ex: 5511999999999)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Duplicatas:</strong> Números duplicados serão ignorados
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Limite máximo:</strong> {campaignSettings.maxContactsPerCampaign.toLocaleString()} contatos por campanha
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Arquivos suportados:</strong> CSV, XLSX
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}