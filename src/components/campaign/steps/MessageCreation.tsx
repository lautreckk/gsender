import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Image, 
  Video, 
  Mic, 
  FileText, 
  Plus, 
  Trash2, 
  GripVertical,
  Eye,
  Tag,
  User
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CampaignData, MessageData } from '../CampaignWizard';
import { FileUpload } from '../FileUpload';
import { MediaHelper, MediaFile } from '@/services/mediaHelper';
import { WhatsAppPreview } from '../WhatsAppPreview';
import { useCampaignSettingsValues } from '@/contexts/SettingsContext';

interface MessageCreationProps {
  data: CampaignData;
  onUpdate: (data: Partial<CampaignData>) => void;
}

const MESSAGE_TYPES = [
  { value: 'text', label: 'Texto', icon: MessageSquare },
  { value: 'image', label: 'Imagem', icon: Image },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'audio', label: 'Áudio', icon: Mic },
  { value: 'document', label: 'Documento', icon: FileText },
] as const;

export function MessageCreation({ data, onUpdate }: MessageCreationProps) {
  const campaignSettings = useCampaignSettingsValues();
  const [newMessageType, setNewMessageType] = useState<'text' | 'image' | 'video' | 'audio' | 'document'>('text');
  const [previewContact] = useState({ nome: 'João Silva', tag: 'cliente_vip' });

  const addMessage = () => {
    if (data.messages.length >= campaignSettings.maxMessagesPerCampaign) return;

    const newMessage: MessageData = {
      id: Date.now().toString(),
      type: newMessageType,
      content: '',
      order: data.messages.length + 1,
    };

    onUpdate({
      messages: [...data.messages, newMessage]
    });
  };

  const updateMessage = (id: string, updates: Partial<MessageData>) => {
    const updatedMessages = data.messages.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    );
    onUpdate({ messages: updatedMessages });
  };

  const handleMediaSelect = (messageId: string, mediaFile: MediaFile) => {
    console.log(`📁 [MessageCreation] handleMediaSelect chamado:`, {
      messageId,
      fileName: mediaFile.fileName,
      size: mediaFile.size,
      mimetype: mediaFile.mimetype,
      mediatype: mediaFile.mediatype,
      hasUrl: !!mediaFile.url,
      hasBase64: !!mediaFile.base64,
      base64Length: mediaFile.base64?.length || 0,
      urlValue: mediaFile.url || 'undefined'
    });
    
    const delay = MediaHelper.calculateDelay(mediaFile.mediatype, mediaFile.size);
    const mediaRepresentation = MediaHelper.getBestMediaRepresentation(mediaFile);
    
    const updateData = {
      fileName: mediaFile.fileName,
      fileSize: mediaFile.size,
      mimeType: mediaFile.mimetype,
      mediaUrl: mediaFile.url,
      mediaBase64: mediaFile.base64,
      delay: delay,
      linkPreview: true
    };
    
    console.log(`💾 [MessageCreation] Dados para updateMessage:`, updateData);
    
    updateMessage(messageId, updateData);
  };

  const handleMediaRemove = (messageId: string) => {
    updateMessage(messageId, {
      fileName: undefined,
      fileSize: undefined,
      mimeType: undefined,
      mediaUrl: undefined,
      mediaBase64: undefined,
      delay: undefined,
      linkPreview: undefined
    });
  };

  const removeMessage = (id: string) => {
    const updatedMessages = data.messages
      .filter(msg => msg.id !== id)
      .map((msg, index) => ({ ...msg, order: index + 1 }));
    onUpdate({ messages: updatedMessages });
  };

  const moveMessage = (id: string, direction: 'up' | 'down') => {
    const currentIndex = data.messages.findIndex(msg => msg.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === data.messages.length - 1)
    ) {
      return;
    }

    const newMessages = [...data.messages];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newMessages[currentIndex], newMessages[targetIndex]] = [newMessages[targetIndex], newMessages[currentIndex]];
    
    const reorderedMessages = newMessages.map((msg, index) => ({
      ...msg,
      order: index + 1
    }));

    onUpdate({ messages: reorderedMessages });
  };

  const insertVariable = (messageId: string, variable: string) => {
    const message = data.messages.find(msg => msg.id === messageId);
    if (!message) return;

    const textarea = document.getElementById(`message-${messageId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = message.content;
    const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
    
    updateMessage(messageId, { content: newText });
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variable.length + 4;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const renderVariableButtons = (messageId: string) => (
    <div className="flex gap-2 mb-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertVariable(messageId, 'nome')}
      >
        <User className="w-3 h-3 mr-1" />
        {"{{nome}}"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertVariable(messageId, 'tag')}
      >
        <Tag className="w-3 h-3 mr-1" />
        {"{{tag}}"}
      </Button>
    </div>
  );

  const renderMessagePreview = (message: MessageData) => {
    let preview = message.content;
    
    preview = preview.replace(/\{\{nome\}\}/g, previewContact.nome);
    preview = preview.replace(/\{\{tag\}\}/g, previewContact.tag);
    
    return (
      <div className="mt-2 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Eye className="w-3 h-3" />
          Preview:
        </div>
        <div className="text-sm">{preview || 'Digite sua mensagem...'}</div>
      </div>
    );
  };

  const renderMessageForm = (message: MessageData) => {
    const MessageIcon = MESSAGE_TYPES.find(type => type.value === message.type)?.icon || MessageSquare;

    return (
      <Card key={message.id} className="relative">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <MessageIcon className="w-4 h-4" />
              <span className="text-sm">
                Mensagem {message.order}
              </span>
              <Badge variant="secondary" className="text-xs">
                {MESSAGE_TYPES.find(type => type.value === message.type)?.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveMessage(message.id, 'up')}
                disabled={message.order === 1}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveMessage(message.id, 'down')}
                disabled={message.order === data.messages.length}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMessage(message.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message.type === 'text' && (
            <div className="space-y-2">
              <Label>Conteúdo da Mensagem</Label>
              {renderVariableButtons(message.id)}
              <Textarea
                id={`message-${message.id}`}
                placeholder="Digite sua mensagem aqui... Use variáveis para personalizar"
                value={message.content}
                onChange={(e) => updateMessage(message.id, { content: e.target.value })}
                className="min-h-[100px]"
              />
              {renderMessagePreview(message)}
            </div>
          )}

          {message.type !== 'text' && (
            <div className="space-y-4">
              <Label>Arquivo de Mídia</Label>
              <FileUpload
                accept={
                  message.type === 'image' ? (campaignSettings.allowedFileTypes.filter(type => type.startsWith('image')).join(',') || 'image/*') :
                  message.type === 'video' ? (campaignSettings.allowedFileTypes.filter(type => type.startsWith('video')).join(',') || 'video/*') :
                  message.type === 'audio' ? (campaignSettings.allowedFileTypes.filter(type => type.startsWith('audio')).join(',') || 'audio/*') :
                  campaignSettings.allowedFileTypes.filter(type => !type.startsWith('image') && !type.startsWith('video') && !type.startsWith('audio')).join(',') || '.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.zip,.rar,.7z,.json,.xml,.csv'
                }
                maxSize={campaignSettings.maxFileSize}
                allowUrl={true}
                onFileSelect={(mediaFile) => handleMediaSelect(message.id, mediaFile)}
                onFileRemove={() => handleMediaRemove(message.id)}
                currentFile={message.fileName ? {
                  name: message.fileName,
                  size: message.fileSize || 0,
                  type: message.mimeType || 'application/octet-stream',
                  url: message.mediaUrl || '',
                  base64: message.mediaBase64,
                  mediatype: MediaHelper.getMediaType(message.mimeType || '')
                } : undefined}
              />
              
              {message.fileName && (
                <div className="space-y-2">
                  <Label>Legenda (opcional)</Label>
                  {renderVariableButtons(message.id)}
                  <Textarea
                    id={`caption-${message.id}`}
                    placeholder="Digite uma legenda para acompanhar o arquivo..."
                    value={message.content}
                    onChange={(e) => updateMessage(message.id, { content: e.target.value })}
                    className="min-h-[80px]"
                  />
                  {message.content && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Eye className="w-3 h-3" />
                        Preview da legenda:
                      </div>
                      <div className="text-sm">
                        {MediaHelper.processMediaCaption(message.content, previewContact)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Alert>
                <AlertDescription>
                  <strong>Limite de tamanho:</strong> Máximo de {campaignSettings.maxFileSize}MB por arquivo
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Messages Form */}
      <div className="xl:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mensagens da Campanha
              </div>
              <Badge variant="outline">
                {data.messages.length}/{campaignSettings.maxMessagesPerCampaign} mensagens
              </Badge>
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma mensagem criada ainda.</p>
                <p className="text-sm">Adicione pelo menos uma mensagem para continuar.</p>
              </div>
            )}

            {data.messages.map(renderMessageForm)}

            {data.messages.length < campaignSettings.maxMessagesPerCampaign && (
              <>
                <Separator />
                <div className="flex items-center gap-4">
                  <Select value={newMessageType} onValueChange={(value: any) => setNewMessageType(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de mensagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESSAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addMessage} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Mensagem
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras e Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Variáveis disponíveis:</strong> Use {"{{nome}}"} e {"{{tag}}"} para personalizar as mensagens
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Limite:</strong> Máximo de {campaignSettings.maxMessagesPerCampaign} mensagens por campanha
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Ordem:</strong> As mensagens serão enviadas na ordem definida
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Obrigatório:</strong> Pelo menos uma mensagem deve ser criada
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* WhatsApp Preview - Fixed width on the right */}
      <div className="xl:col-span-1 space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center overflow-hidden">
            <div className="w-full max-w-[320px]">
              <WhatsAppPreview 
                messages={data.messages}
                contactName={previewContact.nome}
                contactTag={previewContact.tag}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contato de Exemplo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Nome</Label>
                <div className="text-sm text-muted-foreground">{previewContact.nome}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Tag</Label>
                <div className="text-sm text-muted-foreground">{previewContact.tag}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Este é um exemplo de como as variáveis {"{{nome}}"} e {"{{tag}}"} serão substituídas nas mensagens.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}