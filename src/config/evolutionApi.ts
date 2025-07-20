// Configuração da EvolutionAPI
// NOTA: Esta configuração pode ser sobrescrita por configurações do usuário
export const EVOLUTION_API_CONFIG = {
  BASE_URL: 'https://api.gruposena.club', // Fallback padrão
  API_KEY: '3ac318ab976bc8c75dfe827e865a576c', // Fallback padrão
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_DELAY: 3200, // 3.2 segundos
  TIMEOUT: 30000, // 30 segundos
  
  // Endpoints
  ENDPOINTS: {
    SEND_TEXT: '/message/sendText',
    SEND_MEDIA: '/message/sendMedia',
    FETCH_INSTANCES: '/instance/fetchInstances',
    CREATE_INSTANCE: '/instance/create',
    DISCONNECT_INSTANCE: '/instance/disconnect'
  },
  
  // Configurações de retry
  RETRY_CONFIG: {
    attempts: 3,
    delay: 1000, // 1 segundo
    backoff: 2 // multiplicador exponencial
  }
};

// Função para obter configuração dinâmica da API
export const getEvolutionApiConfig = (userSettings?: { 
  evolutionApiUrl?: string; 
  evolutionApiKey?: string;
  timeout?: number;
  retryAttempts?: number;
}) => {
  return {
    ...EVOLUTION_API_CONFIG,
    BASE_URL: userSettings?.evolutionApiUrl || EVOLUTION_API_CONFIG.BASE_URL,
    API_KEY: userSettings?.evolutionApiKey || EVOLUTION_API_CONFIG.API_KEY,
    TIMEOUT: userSettings?.timeout || EVOLUTION_API_CONFIG.TIMEOUT,
    MAX_RETRY_ATTEMPTS: userSettings?.retryAttempts || EVOLUTION_API_CONFIG.MAX_RETRY_ATTEMPTS
  };
};