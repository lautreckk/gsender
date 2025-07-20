import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Palette, Save, Upload, Moon, Sun, ImageIcon, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WhiteLabelSettings {
  companyName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  domain: string;
  supportEmail: string;
  supportPhone: string;
  termsUrl: string;
  privacyUrl: string;
  footerText: string;
  darkMode: boolean;
}

interface WhiteLabelSettingsProps {
  settings: WhiteLabelSettings;
  onUpdate: (updates: Partial<WhiteLabelSettings>) => void;
  onSave: () => void;
  loading: boolean;
}

export function WhiteLabelSettings({ settings, onUpdate, onSave, loading }: WhiteLabelSettingsProps) {
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  // Garantir que darkMode tenha um valor padrão
  const darkModeValue = settings.darkMode ?? false;

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return;

    // Validate file size and type
    const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 1 * 1024 * 1024; // 2MB for logo, 1MB for favicon
    if (file.size > maxSize) {
      alert(`Arquivo muito grande. Tamanho máximo: ${type === 'logo' ? '2MB' : '1MB'}`);
      return;
    }

    const allowedTypes = type === 'logo' 
      ? ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
      : ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg'];
    
    if (!allowedTypes.includes(file.type)) {
      alert(`Tipo de arquivo não suportado. Use: ${allowedTypes.join(', ')}`);
      return;
    }

    setUploading(true);
    
    try {
      // Convert to base64 for now (later can be enhanced to use Supabase Storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (type === 'logo') {
          onUpdate({ logo: base64 });
        } else {
          onUpdate({ favicon: base64 });
        }
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Erro ao processar arquivo');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload do arquivo');
      setUploading(false);
    }
  };

  const handleLogoUpload = () => {
    logoInputRef.current?.click();
  };

  const handleFaviconUpload = () => {
    faviconInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Configurações de White Label
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={settings.companyName}
                onChange={(e) => onUpdate({ companyName: e.target.value })}
                placeholder="Sua Empresa LTDA"
              />
            </div>

            <div>
              <Label htmlFor="domain">Domínio Personalizado</Label>
              <Input
                id="domain"
                value={settings.domain}
                onChange={(e) => onUpdate({ domain: e.target.value })}
                placeholder="app.suaempresa.com"
              />
            </div>

            <div>
              <Label htmlFor="support-email">E-mail de Suporte</Label>
              <Input
                id="support-email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => onUpdate({ supportEmail: e.target.value })}
                placeholder="suporte@suaempresa.com"
              />
            </div>

            <div>
              <Label htmlFor="support-phone">Telefone de Suporte</Label>
              <Input
                id="support-phone"
                value={settings.supportPhone}
                onChange={(e) => onUpdate({ supportPhone: e.target.value })}
                placeholder="(11) 9999-9999"
              />
            </div>

            <div>
              <Label htmlFor="terms-url">URL dos Termos de Uso</Label>
              <Input
                id="terms-url"
                value={settings.termsUrl}
                onChange={(e) => onUpdate({ termsUrl: e.target.value })}
                placeholder="https://suaempresa.com/termos"
              />
            </div>

            <div>
              <Label htmlFor="privacy-url">URL da Política de Privacidade</Label>
              <Input
                id="privacy-url"
                value={settings.privacyUrl}
                onChange={(e) => onUpdate({ privacyUrl: e.target.value })}
                placeholder="https://suaempresa.com/privacidade"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    value={settings.logo}
                    onChange={(e) => onUpdate({ logo: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogoUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {settings.logo && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <ImageIcon className="w-4 h-4" />
                    <img 
                      src={settings.logo} 
                      alt="Logo preview" 
                      className="h-8 w-auto max-w-20 object-contain" 
                    />
                  </div>
                )}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tamanho recomendado:</strong> 200x60px ou proporção similar. Máximo 2MB. Formatos: PNG, JPG, SVG, WebP.
                  </AlertDescription>
                </Alert>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'logo');
                }}
                className="hidden"
              />
            </div>

            <div>
              <Label htmlFor="favicon">Favicon</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="favicon"
                    value={settings.favicon}
                    onChange={(e) => onUpdate({ favicon: e.target.value })}
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleFaviconUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {settings.favicon && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <ImageIcon className="w-4 h-4" />
                    <img 
                      src={settings.favicon} 
                      alt="Favicon preview" 
                      className="h-4 w-4 object-contain" 
                    />
                  </div>
                )}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tamanho recomendado:</strong> 32x32px ou 16x16px. Máximo 1MB. Formatos: ICO, PNG, JPG.
                  </AlertDescription>
                </Alert>
              </div>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'favicon');
                }}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="primary-color">Cor Primária</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary-color">Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accent-color">Cor de Destaque</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => onUpdate({ accentColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={settings.accentColor}
                    onChange={(e) => onUpdate({ accentColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <div className="flex items-center gap-3 mt-2">
                <Switch
                  id="dark-mode"
                  checked={darkModeValue}
                  onCheckedChange={(checked) => onUpdate({ darkMode: checked })}
                />
                <div className="flex items-center gap-2">
                  {darkModeValue ? (
                    <>
                      <Moon className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">Ativado</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">Desativado</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Permite aos usuários alternar entre tema claro e escuro
              </p>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="footer-text">Texto do Rodapé</Label>
          <Textarea
            id="footer-text"
            value={settings.footerText}
            onChange={(e) => onUpdate({ footerText: e.target.value })}
            placeholder="© 2024 Sua Empresa. Todos os direitos reservados."
            className="min-h-[100px]"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={loading || uploading}>
            {loading || uploading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Fazendo Upload...' : 'Salvar White Label'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}