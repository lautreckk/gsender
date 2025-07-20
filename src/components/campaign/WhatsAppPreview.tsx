import React from 'react';
import { MessageData } from './CampaignWizard';
import { 
  Image as ImageIcon, 
  Video, 
  Mic, 
  FileText, 
  Play,
  Download,
  Clock
} from "lucide-react";
import { MediaHelper } from '@/services/mediaHelper';

interface WhatsAppPreviewProps {
  messages: MessageData[];
  contactName?: string;
  contactTag?: string;
}

export function WhatsAppPreview({ messages, contactName = "João Silva", contactTag = "cliente_vip" }: WhatsAppPreviewProps) {
  const processMessage = (content: string) => {
    let processed = content;
    processed = processed.replace(/\{\{nome\}\}/g, contactName);
    processed = processed.replace(/\{\{tag\}\}/g, contactTag);
    return processed;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'video': return Video;
      case 'audio': return Mic;
      case 'document': return FileText;
      default: return FileText;
    }
  };

  const renderMessage = (message: MessageData, index: number) => {
    const processedContent = processMessage(message.content);
    const MediaIcon = getMediaIcon(message.type);
    
    // Log para debug de imagens
    if (message.type === 'image') {
      console.log(`🖼️ [WhatsAppPreview] Renderizando imagem:`, {
        id: message.id,
        fileName: message.fileName,
        hasMediaUrl: !!message.mediaUrl,
        hasMediaBase64: !!message.mediaBase64,
        mediaUrlLength: message.mediaUrl?.length || 0,
        mediaBase64Length: message.mediaBase64?.length || 0,
        willShowImage: !!(message.mediaUrl || message.mediaBase64)
      });
    }
    
    return (
      <div key={`${message.id}-${index}`} className="flex justify-end mb-2">
        <div className="max-w-[75%] bg-[#dcf8c6] rounded-lg px-3 py-2 relative shadow-sm">
          {/* Media content */}
          {message.type !== 'text' && message.fileName && (
            <div className="mb-2">
              {message.type === 'image' && (message.mediaUrl || message.mediaBase64) && (
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={message.mediaUrl || message.mediaBase64} 
                    alt={message.fileName}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      console.error('Erro ao carregar imagem no preview:', {
                        fileName: message.fileName,
                        hasMediaUrl: !!message.mediaUrl,
                        hasMediaBase64: !!message.mediaBase64,
                        mediaUrlLength: message.mediaUrl?.length || 0,
                        mediaBase64Length: message.mediaBase64?.length || 0
                      });
                    }}
                  />
                </div>
              )}
              
              {message.type === 'video' && (
                <div className="relative rounded-lg overflow-hidden bg-gray-900 h-32 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-80" />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    {message.fileName}
                  </div>
                </div>
              )}
              
              {message.type === 'audio' && (
                <div className="flex items-center gap-3 bg-white bg-opacity-50 rounded-lg p-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">Áudio</div>
                    <div className="text-xs text-gray-500">
                      {message.fileSize ? formatFileSize(message.fileSize) : ''}
                    </div>
                  </div>
                  <Play className="w-5 h-5 text-gray-600" />
                </div>
              )}
              
              {message.type === 'document' && (
                <div className="flex items-center gap-3 bg-white bg-opacity-50 rounded-lg p-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {message.fileName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {message.fileSize ? formatFileSize(message.fileSize) : ''}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          )}
          
          {/* Text content */}
          {processedContent && (
            <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
              {processedContent}
            </div>
          )}
          
          {/* Message time and status */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-gray-500">
              {new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            <div className="flex">
              <div className="w-3 h-3">
                <svg viewBox="0 0 16 15" className="w-full h-full fill-blue-500">
                  <path d="m15.01 3.316-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.61 3.463c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[300px] mx-auto">
      {/* iPhone mockup */}
      <div className="relative w-full">
        {/* iPhone frame */}
        <div className="bg-black rounded-[2.5rem] p-2 shadow-2xl mx-auto w-full max-w-[280px]">
          <div className="bg-white rounded-[2rem] overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10"></div>
            {/* Status bar - iPhone style */}
            <div className="bg-white px-4 py-1 flex items-center justify-between text-black text-xs pt-8">
              <div className="flex items-center gap-1">
                <div className="flex">
                  <div className="w-1 h-1 bg-black rounded-full"></div>
                  <div className="w-1 h-1 bg-black rounded-full ml-0.5"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full ml-0.5"></div>
                </div>
                <span className="ml-1 font-medium">Operadora</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">9:41</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48zM12 5.47L22 17H2l10-11.53z"/>
                </svg>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.67 4H14V2c0-1.1-.9-2-2-2s-2 .9-2 2v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                </svg>
              </div>
            </div>

            {/* WhatsApp header */}
            <div className="bg-[#075e54] px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                  {contactName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-sm">{contactName}</div>
                  <div className="text-xs opacity-80">online</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Video className="w-5 h-5" />
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                </svg>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
            </div>
            
            {/* Chat background */}
            <div 
              className="h-[350px] overflow-y-auto p-3 min-h-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.08'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#e5ddd5'
              }}
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    📱 Suas mensagens aparecerão aqui
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Adicione mensagens para ver o preview
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message, index) => renderMessage(message, index))}
                </div>
              )}
            </div>
            
            {/* Input area */}
            <div className="bg-[#f0f0f0] p-2 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div className="flex-1 bg-white rounded-full px-3 py-2 flex items-center gap-2">
                <span className="text-gray-400 text-sm">Digite uma mensagem</span>
              </div>
              <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V8a1 1 0 00-2 0v1.5A2.5 2.5 0 0016.5 12h1a2.5 2.5 0 002.5-2.5V8a1 1 0 00-1-1zM12 2a1 1 0 00-1 1v8a3 3 0 006 0V3a1 1 0 00-2 0v8a1 1 0 01-2 0V3a1 1 0 00-1-1z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}