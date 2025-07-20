import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Mic, 
  X, 
  CheckCircle,
  AlertCircle,
  Link,
  Eye
} from "lucide-react";
import { MediaHelper, MediaFile } from '@/services/mediaHelper';
import { AudioRecorder } from '@/components/ui/AudioRecorder';

interface FileUploadProps {
  accept: string;
  maxSize: number; // in MB
  onFileSelect: (mediaFile: MediaFile) => void;
  onFileRemove: () => void;
  currentFile?: {
    name: string;
    size: number;
    type: string;
    url: string;
    base64?: string;
    mediatype?: 'image' | 'video' | 'document' | 'audio';
  };
  disabled?: boolean;
  allowUrl?: boolean; // Permitir inserção de URL
}

const FILE_ICONS = {
  'image': Image,
  'video': Video,
  'audio': Mic,
  'document': FileText,
} as const;

export function FileUpload({
  accept,
  maxSize,
  onFileSelect,
  onFileRemove,
  currentFile,
  disabled = false,
  allowUrl = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlMode, setUrlMode] = useState(false);
  const [recordMode, setRecordMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAudioUpload = accept.includes('audio');

  const getFileType = (mimeType: string): keyof typeof FILE_ICONS => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Usar validação do MediaHelper
    const validation = MediaHelper.validateMediaFile(file);
    
    if (!validation.isValid) {
      return validation.error || 'Erro de validação';
    }

    // Verificação adicional de tamanho personalizado
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`;
    }

    return null;
  };

  const processFile = async (file: File, url?: string): Promise<MediaFile> => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      setProgress(0);
      
      const interval = setInterval(async () => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploading(false);
            
            // Processar arquivo com MediaHelper
            MediaHelper.processMediaFile(file, url)
              .then(resolve)
              .catch(reject);
            
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    });
  };

  const handleFile = async (file: File, url?: string) => {
    if (disabled) return;
    
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const mediaFile = await processFile(file, url);
      onFileSelect(mediaFile);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim() || !MediaHelper.isValidUrl(urlInput)) {
      setError('URL inválida');
      return;
    }

    // Criar um arquivo fictício para a URL
    const fileName = urlInput.split('/').pop() || 'arquivo_url';
    const file = new File([''], fileName, { type: 'application/octet-stream' });
    
    handleFile(file, urlInput);
    setUrlMode(false);
    setUrlInput('');
  };

  const handleAudioRecord = async (audioBlob: Blob, audioBase64: string) => {
    setError(null);
    
    try {
      // Converter blob em File para usar o processamento padrão
      const audioFile = new File([audioBlob], `gravacao_${Date.now()}.webm`, {
        type: 'audio/webm'
      });

      // Remover o header do base64 se presente
      const base64Pure = MediaHelper.stripBase64Header(audioBase64);
      
      // Processar como arquivo de mídia
      const mediaFile: MediaFile = {
        file: audioFile,
        base64: base64Pure, // Base64 puro para API
        url: audioBase64,   // Base64 com header para preview
        mimetype: 'audio/webm',
        mediatype: 'audio',
        fileName: audioFile.name,
        size: audioFile.size
      };

      console.log('🎵 Áudio gravado processado:', {
        fileName: mediaFile.fileName,
        size: mediaFile.size,
        mimetype: mediaFile.mimetype,
        base64Length: mediaFile.base64.length,
        urlLength: mediaFile.url?.length || 0
      });

      onFileSelect(mediaFile);
      setRecordMode(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao processar gravação');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
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
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    
    setError(null);
    setProgress(0);
    setUrlInput('');
    setUrlMode(false);
    setRecordMode(false);
    onFileRemove();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (currentFile) {
    const FileIcon = FILE_ICONS[getFileType(currentFile.type)];
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <div className="font-medium text-sm">{currentFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(currentFile.size)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!urlMode && !recordMode ? (
        <>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {uploading ? 'Processando arquivo...' : 'Arraste o arquivo aqui ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground">
                Tamanho máximo: {maxSize}MB • Formatos: {accept}
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInput}
              disabled={disabled}
              className="hidden"
            />
          </div>
          
          <div className="flex justify-center gap-2">
            {allowUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUrlMode(true)}
                disabled={disabled}
              >
                <Link className="w-4 h-4 mr-2" />
                Usar URL
              </Button>
            )}
            
            {isAudioUpload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRecordMode(true)}
                disabled={disabled}
              >
                <Mic className="w-4 h-4 mr-2" />
                Gravar Áudio
              </Button>
            )}
          </div>
        </>
      ) : urlMode ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium mb-2">Inserir URL do arquivo</h4>
                <p className="text-sm text-muted-foreground">
                  Cole a URL do arquivo que deseja usar
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url-input">URL do arquivo</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://exemplo.com/arquivo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={disabled}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={disabled || !urlInput.trim()}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUrlMode(false);
                    setUrlInput('');
                    setError(null);
                  }}
                  disabled={disabled}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : recordMode ? (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium mb-2">Gravar Áudio</h4>
            <p className="text-sm text-muted-foreground">
              Clique em gravar para começar a capturar o áudio
            </p>
          </div>
          
          <AudioRecorder
            onAudioRecord={handleAudioRecord}
            onClear={() => setRecordMode(false)}
            maxDuration={300} // 5 minutos
          />
          
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRecordMode(false);
                setError(null);
              }}
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Fazendo upload...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}