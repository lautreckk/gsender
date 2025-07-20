import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Users, 
  Settings,
  PlayCircle,
  Save,
  AlertCircle,
  Edit,
  User,
  Tag,
  Timer,
  FileText,
  Image,
  Video,
  Mic,
  MessageCircle,
  Smartphone
} from "lucide-react";
import { CampaignData } from '../CampaignWizard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MediaHelper } from '@/services/mediaHelper';

interface CampaignReviewProps {
  data: CampaignData;
  onUpdate: (data: Partial<CampaignData>) => void;
  onCampaignCreated?: () => void;
}

const MESSAGE_ICONS = {
  text: MessageSquare,
  image: Image,
  video: Video,
  audio: Mic,
  document: FileText,
} as const;

const WEEK_DAYS = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
} as const;

export function CampaignReview({ data, onUpdate, onCampaignCreated }: CampaignReviewProps) {
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const { toast } = useToast();

  const saveCampaign = async (shouldLaunch: boolean = false) => {
    if (shouldLaunch) {
      setLaunching(true);
    } else {
      setSaving(true);
    }

    try {
      // Para testes, usar NULL no created_by (RLS desabilitado)
      const campaignData = {
        name: data.name,
        type: data.type,
        status: shouldLaunch ? 'active' : 'draft',
        created_by: null,
        instance_id: data.selectedInstance?.id || null,
        scheduled_days: data.scheduling.days,
        start_time: data.scheduling.startTime,
        end_time: data.scheduling.endTime,
        message_interval: data.scheduling.interval,
        start_date: data.scheduling.immediate ? null : data.scheduling.startDate,
        total_contacts: data.contacts.length,
        sent_messages: 0,
        failed_messages: 0,
      };

      // SALVAMENTO REAL NO SUPABASE
      console.log('💾 Salvando campanha no Supabase...');
      console.log('📊 Dados da campanha:', campaignData);
      console.log('📧 Contatos:', data.contacts);
      console.log('💬 Mensagens:', data.messages);
      
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (campaignError) {
        console.error('❌ Erro ao criar campanha:', campaignError);
        throw campaignError;
      }

      console.log('✅ Campanha criada:', campaign);

      const contactsData = data.contacts.map(contact => ({
        campaign_id: campaign.id,
        nome: contact.nome,
        numero: contact.numero,
        tag: contact.tag,
        status: 'pending',
      }));

      console.log('💾 Salvando contatos...', contactsData);

      const { error: contactsError } = await supabase
        .from('contacts')
        .insert(contactsData);

      if (contactsError) {
        console.error('❌ Erro ao criar contatos:', contactsError);
        throw contactsError;
      }

      console.log('✅ Contatos criados');

      const messagesData = data.messages.map((message, index) => {
        console.log(`📄 [CampaignReview] Processando mensagem ${index + 1}:`, {
          id: message.id,
          type: message.type,
          fileName: message.fileName,
          hasMediaUrl: !!message.mediaUrl,
          hasMediaBase64: !!message.mediaBase64,
          mediaUrlLength: message.mediaUrl?.length || 0,
          mediaBase64Length: message.mediaBase64?.length || 0
        });
        
        return {
          campaign_id: campaign.id,
          type: message.type,
          content: message.content, // Para texto é o conteúdo, para mídia é a legenda
          order_index: message.order,
          file_name: message.fileName,
          file_size: message.fileSize,
          mime_type: message.mimeType,
          media_url: message.mediaUrl, // URL da mídia
          media_base64: message.mediaBase64, // Base64 da mídia
        };
      });

      console.log('💾 Salvando mensagens no banco...', messagesData);

      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messagesData);

      if (messagesError) {
        console.error('❌ Erro ao criar mensagens:', messagesError);
        throw messagesError;
      }

      console.log('✅ Mensagens criadas');
      console.log('🎉 Campanha completa salva no Supabase!');

      toast({
        title: shouldLaunch ? 'Campanha lançada!' : 'Campanha salva!',
        description: shouldLaunch 
          ? 'Sua campanha foi criada e iniciada com sucesso.'
          : 'Sua campanha foi salva como rascunho.',
      });

      // Redirecionar para a lista de campanhas após 1 segundo
      setTimeout(() => {
        if (onCampaignCreated) {
          onCampaignCreated();
        }
      }, 1000);

      console.log('✅ Processo concluído! Campanha salva no Supabase.');

    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      toast({
        title: 'Erro ao salvar campanha',
        description: 'Ocorreu um erro ao processar sua campanha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setLaunching(false);
    }
  };

  const renderMessagePreview = (message: any) => {
    const Icon = MESSAGE_ICONS[message.type as keyof typeof MESSAGE_ICONS];
    const sampleContact = data.contacts[0] || { nome: 'João', tag: 'cliente' };
    
    return (
      <div key={message.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
          <Badge variant="secondary" className="text-xs">
            {message.order}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          {message.type === 'text' ? (
            <div className="text-sm break-words">
              {MediaHelper.processMediaCaption(message.content, sampleContact)}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {message.type === 'image' && '🖼️ Imagem'}
                  {message.type === 'video' && '🎥 Vídeo'}
                  {message.type === 'audio' && '🎵 Áudio'}
                  {message.type === 'document' && '📄 Documento'}
                </span>
                {message.fileName && (
                  <span className="text-muted-foreground text-xs">
                    {message.fileName} ({MediaHelper.formatFileSize(message.fileSize || 0)})
                  </span>
                )}
              </div>
              
              {/* Preview de imagem se disponível */}
              {message.type === 'image' && (message.mediaUrl || message.mediaBase64) && (
                <div className="max-w-[200px]">
                  <img 
                    src={message.mediaUrl || message.mediaBase64} 
                    alt="Preview"
                    className="w-full h-auto rounded border max-h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Legenda se disponível */}
              {message.content && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Legenda:</span> {MediaHelper.processMediaCaption(message.content, sampleContact)}
                </div>
              )}
              
              {/* Informações técnicas */}
              <div className="text-xs text-muted-foreground">
                {message.mimeType && <span>Tipo: {message.mimeType}</span>}
                {message.delay && <span className="ml-2">Delay: {message.delay/1000}s</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatSchedulingDays = () => {
    if (!data.scheduling.days || data.scheduling.days.length === 0) {
      return 'Nenhum dia selecionado';
    }
    
    return data.scheduling.days
      .map(day => WEEK_DAYS[day as keyof typeof WEEK_DAYS])
      .join(', ');
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Revisão da Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Revise todos os detalhes da sua campanha antes de finalizar. 
            Você pode salvar como rascunho ou lançar imediatamente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informações Gerais
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <Badge variant="outline" className="capitalize">
                {data.type === 'individual' ? 'Individual' : 'Grupo'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Instância WhatsApp
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.selectedInstance ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <div className="font-semibold">{data.selectedInstance.name}</div>
                {data.selectedInstance.profile_name && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {data.selectedInstance.profile_name}
                  </div>
                )}
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  {data.selectedInstance.whatsapp_number}
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Conectado
              </Badge>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhuma instância selecionada</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensagens ({data.messages.length})
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.messages.map(renderMessagePreview)}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="font-semibold text-blue-600">
                {data.messages.filter(m => m.type === 'text').length}
              </div>
              <div>Texto</div>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="font-semibold text-green-600">
                {data.messages.filter(m => m.type === 'image').length}
              </div>
              <div>Imagens</div>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div className="font-semibold text-purple-600">
                {data.messages.filter(m => m.type === 'video').length}
              </div>
              <div>Vídeos</div>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div className="font-semibold text-orange-600">
                {data.messages.filter(m => ['audio', 'document'].includes(m.type)).length}
              </div>
              <div>Outros</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-3 h-3" />
            <span>Preview com: {data.contacts[0]?.nome || 'João'}</span>
            <Tag className="w-3 h-3 ml-2" />
            <span>Tag: {data.contacts[0]?.tag || 'cliente'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Contatos ({data.contacts.length})
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {data.contacts.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Contatos</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {new Set(data.contacts.map(c => c.tag)).size}
              </div>
              <div className="text-sm text-muted-foreground">Tags Únicas</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {data.messages.length * data.contacts.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Envios</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Primeiros 5 contatos:</h4>
            {data.contacts.slice(0, 5).map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{contact.nome}</span>
                  <span className="text-muted-foreground text-sm">{contact.numero}</span>
                </div>
                <Badge variant="outline" className="text-xs">{contact.tag}</Badge>
              </div>
            ))}
            {data.contacts.length > 5 && (
              <div className="text-center text-sm text-muted-foreground">
                ... e mais {data.contacts.length - 5} contatos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agendamento
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
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
                <span className="font-medium">{formatSchedulingDays()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium">
                  {data.scheduling.startTime} - {data.scheduling.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intervalo:</span>
                <span className="font-medium">{data.scheduling.interval}s</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <span className="font-medium">Tempo Estimado:</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {calculateEstimatedTime()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Verifique se todas as informações estão corretas.
          Após o lançamento, a campanha não poderá ser editada, apenas pausada ou cancelada.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => saveCampaign(false)}
              disabled={saving || launching}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Rascunho
                </>
              )}
            </Button>

            <Button
              onClick={() => saveCampaign(true)}
              disabled={saving || launching}
              className="flex items-center gap-2"
            >
              {launching ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Lançando...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Salvar e Lançar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}