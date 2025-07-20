export interface MediaFile {
  file: File;
  base64: string;
  url?: string;
  mimetype: string;
  mediatype: 'image' | 'video' | 'document' | 'audio';
  fileName: string;
  size: number;
}

export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  mediatype?: 'image' | 'video' | 'document' | 'audio';
  mimetype?: string;
}

export class MediaHelper {
  // Mapa de extensões para MIME types
  private static readonly MIME_TYPES = {
    // Imagens
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    
    // Vídeos
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    '3gp': 'video/3gpp',
    
    // Áudios
    'mp3': 'audio/mp3',
    'mpeg': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    'wma': 'audio/x-ms-wma',
    
    // Documentos
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv'
  };

  // Tamanhos máximos por tipo (em MB)
  private static readonly MAX_SIZES = {
    image: 10,
    video: 50,
    audio: 20,
    document: 25
  };

  /**
   * Detecta o tipo de mídia baseado no MIME type
   */
  static getMediaType(mimetype: string): 'image' | 'video' | 'document' | 'audio' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Obtém o MIME type baseado na extensão do arquivo
   */
  static getMimeTypeFromExtension(fileName: string): string | null {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return null;
    
    return this.MIME_TYPES[extension as keyof typeof this.MIME_TYPES] || null;
  }

  /**
   * Valida um arquivo de mídia
   */
  static validateMediaFile(file: File): MediaValidationResult {
    // Detectar MIME type
    let mimetype = file.type;
    if (!mimetype) {
      const detectedMime = this.getMimeTypeFromExtension(file.name);
      if (!detectedMime) {
        return {
          isValid: false,
          error: 'Tipo de arquivo não reconhecido'
        };
      }
      mimetype = detectedMime;
    }

    const mediatype = this.getMediaType(mimetype);
    
    // Verificar tamanho máximo
    const maxSizeBytes = this.MAX_SIZES[mediatype] * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo para ${mediatype}: ${this.MAX_SIZES[mediatype]}MB`
      };
    }

    // Verificar se o tipo é suportado
    const supportedExtensions = Object.keys(this.MIME_TYPES);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Formato não suportado. Formatos aceitos: ${supportedExtensions.join(', ')}`
      };
    }

    return {
      isValid: true,
      mediatype,
      mimetype
    };
  }

  /**
   * Converte um arquivo para base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao converter arquivo para base64'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Remove o header do base64 (data:image/png;base64,) deixando apenas o base64 puro
   */
  static stripBase64Header(base64WithHeader: string): string {
    // Remove "data:image/png;base64," ou similar, mantendo apenas o base64
    const base64Match = base64WithHeader.match(/^data:[^;]+;base64,(.+)$/);
    return base64Match ? base64Match[1] : base64WithHeader;
  }

  /**
   * Processa um arquivo completo para envio
   */
  static async processMediaFile(file: File, url?: string): Promise<MediaFile> {
    console.log(`🔧 [MediaHelper] processMediaFile iniciado:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasUrl: !!url,
      url: url || 'undefined'
    });
    
    // Validar arquivo
    const validation = this.validateMediaFile(file);
    if (!validation.isValid) {
      console.error(`❌ [MediaHelper] Validação falhou:`, validation.error);
      throw new Error(validation.error);
    }

    console.log(`✅ [MediaHelper] Arquivo validado:`, {
      mediatype: validation.mediatype,
      mimetype: validation.mimetype
    });

    // Converter para base64
    console.log(`🔄 [MediaHelper] Convertendo para base64...`);
    const base64WithHeader = await this.fileToBase64(file);
    const base64Pure = this.stripBase64Header(base64WithHeader);
    console.log(`✅ [MediaHelper] Base64 gerado:`, {
      comHeader: base64WithHeader.length,
      semHeader: base64Pure.length,
      headerRemovido: base64WithHeader.length - base64Pure.length
    });

    const result = {
      file,
      base64: base64Pure, // Base64 puro para API
      url: url || base64WithHeader, // URL externa ou base64 com header para preview
      mimetype: validation.mimetype!,
      mediatype: validation.mediatype!,
      fileName: file.name,
      size: file.size
    };
    
    console.log(`🎉 [MediaHelper] processMediaFile concluído:`, {
      fileName: result.fileName,
      size: result.size,
      mimetype: result.mimetype,
      mediatype: result.mediatype,
      hasBase64Pure: !!result.base64,
      base64PureLength: result.base64?.length || 0,
      hasUrlOrDataUrl: !!result.url,
      urlLength: result.url?.length || 0,
      isDataUrl: result.url?.startsWith('data:') || false
    });

    return result;
  }

  /**
   * Processa variáveis em legendas de mídia
   */
  static processMediaCaption(caption: string, contact: { nome: string; tag: string; numero?: string }): string {
    if (!caption) return '';
    
    return caption
      .replace(/\{\{nome\}\}/g, contact.nome)
      .replace(/\{\{tag\}\}/g, contact.tag)
      .replace(/\{\{numero\}\}/g, contact.numero || '');
  }

  /**
   * Formata o tamanho do arquivo para exibição
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Gera um nome de arquivo único
   */
  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    return `${nameWithoutExt}_${timestamp}.${extension}`;
  }

  /**
   * Verifica se uma URL é válida
   */
  static isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Decide se usar URL ou base64 baseado no tamanho
   */
  static shouldUseUrl(file: File, url?: string): boolean {
    // Se não tiver URL, usar base64
    if (!url || !this.isValidUrl(url)) {
      return false;
    }
    
    // Para arquivos maiores que 5MB, preferir URL
    const maxBase64Size = 5 * 1024 * 1024; // 5MB
    return file.size > maxBase64Size;
  }

  /**
   * Obtém a melhor representação do arquivo para envio
   */
  static getBestMediaRepresentation(mediaFile: MediaFile): string {
    if (this.shouldUseUrl(mediaFile.file, mediaFile.url)) {
      return mediaFile.url!;
    }
    return mediaFile.base64;
  }

  /**
   * Gera delay baseado no tipo e tamanho do arquivo
   */
  static calculateDelay(mediatype: 'image' | 'video' | 'document' | 'audio', fileSize: number): number {
    const baseSizes = {
      image: 1000,    // 1 segundo base
      video: 5000,    // 5 segundos base
      audio: 3000,    // 3 segundos base
      document: 2000  // 2 segundos base
    };

    const baseDelay = baseSizes[mediatype];
    
    // Adicionar delay baseado no tamanho (1MB = +500ms)
    const sizeDelayFactor = Math.floor(fileSize / (1024 * 1024)) * 500;
    
    return Math.min(baseDelay + sizeDelayFactor, 15000); // Max 15 segundos
  }

  /**
   * Lista de extensões suportadas por categoria
   */
  static getSupportedExtensions(): { [key: string]: string[] } {
    const extensions = Object.keys(this.MIME_TYPES);
    
    return {
      image: extensions.filter(ext => this.getMediaType(this.MIME_TYPES[ext as keyof typeof this.MIME_TYPES]) === 'image'),
      video: extensions.filter(ext => this.getMediaType(this.MIME_TYPES[ext as keyof typeof this.MIME_TYPES]) === 'video'),
      audio: extensions.filter(ext => this.getMediaType(this.MIME_TYPES[ext as keyof typeof this.MIME_TYPES]) === 'audio'),
      document: extensions.filter(ext => this.getMediaType(this.MIME_TYPES[ext as keyof typeof this.MIME_TYPES]) === 'document')
    };
  }
}