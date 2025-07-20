import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Search, 
  Users, 
  Crown, 
  Shield,
  MessageCircle,
  Calendar,
  ArrowLeft,
  Download,
  Filter,
  Database,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import groupsCacheService, { CachedGroup, GroupFilters } from '@/services/groupsCacheService';

// Extend window interface for temporary API data storage
declare global {
  interface Window {
    lastApiData?: any[];
  }
}

interface Participant {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
}

interface Group {
  id: string;
  subject: string;
  subjectOwner: string;
  subjectTime: number;
  pictureUrl: string | null;
  size: number;
  creation: number;
  owner: string;
  desc: string;
  descId: string;
  restrict: boolean;
  announce: boolean;
  isCommunity: boolean;
  isCommunityAnnounce: boolean;
  participants: Participant[];
}

export function GroupsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<CachedGroup | null>(null);
  const [groups, setGroups] = useState<CachedGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'api'>('cache');
  const [filters, setFilters] = useState<GroupFilters>({});
  const [cacheStats, setCacheStats] = useState<any>(null);
  const { toast } = useToast();


  const loadGroupsDirectFromAPI = async (): Promise<{ converted: any[], original: any[] }> => {
    console.log('Loading groups directly from API...');
    try {
      const response = await fetch('https://api.gruposena.club/group/fetchAllGroups/GabrielSenax?getParticipants=true', {
        method: 'GET',
        headers: {
          'apikey': '3ac318ab976bc8c75dfe827e865a576c',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const apiData = await response.json();
      console.log('API data received:', apiData?.length || 0, 'groups');
      
      if (!Array.isArray(apiData)) {
        throw new Error('API did not return an array');
      }
      
      // Dados originais preservados para retorno
      
      // Converter dados da API para formato esperado
      const convertedGroups = apiData
        .filter(group => group && group.id)
        .map(group => {
          try {
            const processedParticipants = (group.participants || [])
              .filter((p: any) => p && p.id)
              .map((p: any) => ({
                id: p.id,
                admin: p.admin || null
              }));
            
            return {
              id: group.id,
              subject: group.subject || 'Grupo sem nome',
              subjectOwner: group.subjectOwner || '',
              subjectTime: group.subjectTime || 0,
              pictureUrl: group.pictureUrl || null,
              size: group.participants?.length || group.size || 0,
              creation: group.creation || Math.floor(Date.now() / 1000),
              owner: group.owner || '',
              desc: group.desc || '',
              descId: group.descId || '',
              restrict: group.restrict || false,
              announce: group.announce || false,
              isCommunity: group.isCommunity || false,
              isCommunityAnnounce: group.isCommunityAnnounce || false,
              participants: processedParticipants
            };
          } catch (conversionError) {
            console.error('Error converting group:', group, conversionError);
            return null;
          }
        })
        .filter(group => group !== null);
      
      // Log final para debug
      const groupsWithParticipants = convertedGroups.filter(g => g.participants.length > 0);
      console.log(`📊 Total groups: ${convertedGroups.length}, with participants: ${groupsWithParticipants.length}`);
      console.log(`📊 Original API data preserved:`, !!apiData);
      console.log(`📊 Original data has participants:`, apiData?.filter(g => g.participants?.length > 0).length);
      
      return { converted: convertedGroups, original: apiData };
    } catch (error) {
      console.error('Error loading from API:', error);
      throw error;
    }
  };

  const loadGroups = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      let finalGroups: any[] = [];
      let useApiData = false;
      
      // Se for refresh forçado, sempre buscar da API e limpar cache
      if (forceRefresh) {
        console.log('Force refresh: clearing cache and fetching from API...');
        try {
          // Limpar cache antes de buscar novos dados
          await groupsCacheService.clearCache('GabrielSenax');
          console.log('Cache cleared for refresh');
        } catch (clearError) {
          console.warn('Could not clear cache:', clearError);
        }
        useApiData = true;
      }
      
      // Se não temos dados no cache ou é refresh forçado, buscar da API
      if (useApiData || dataSource === 'api') {
        try {
          console.log('Fetching fresh data from API...');
          const apiResult = await loadGroupsDirectFromAPI();
          finalGroups = apiResult.converted;
          
          // SEMPRE tentar salvar no Supabase após buscar da API
          if (finalGroups.length > 0 && apiResult.original) {
            try {
              console.log('Saving to Supabase database...');
              await groupsCacheService.saveGroupsToCache(apiResult.original, 'GabrielSenax');
              console.log('✅ Groups successfully saved to Supabase');
              
              // Atualizar stats do cache
              await loadCacheStats();
              
              toast({
                title: "Dados sincronizados",
                description: `${finalGroups.length} grupos salvos no banco de dados`,
              });
            } catch (saveError) {
              console.warn('❌ Could not save to Supabase:', saveError);
              // Continuar mesmo se não conseguir salvar
              toast({
                title: "Aviso",
                description: "Dados carregados da API, mas não foi possível salvar no banco local",
                variant: "destructive",
              });
            }
          }
        } catch (apiError) {
          console.error('API failed, trying to load from cache:', apiError);
          
          // Se API falhar, tentar carregar do cache
          try {
            const cachedGroups = await groupsCacheService.getGroupsFromCache(filters);
            if (cachedGroups.length > 0) {
              finalGroups = cachedGroups
                .filter(group => group && group.whatsapp_group_id)
                .map(group => ({
                  id: group.whatsapp_group_id,
                  subject: group.subject || 'Grupo sem nome',
                  subjectOwner: group.subject_owner || '',
                  subjectTime: group.subject_time || 0,
                  pictureUrl: group.picture_url || null,
                  size: group.size || 0,
                  creation: group.creation || Math.floor(Date.now() / 1000),
                  owner: group.owner || '',
                  desc: group.description || '',
                  descId: group.desc_id || '',
                  restrict: group.restrict || false,
                  announce: group.announce || false,
                  isCommunity: group.is_community || false,
                  isCommunityAnnounce: group.is_community_announce || false,
                  participants: (group.members || [])
                    .filter(member => member && member.whatsapp_id)
                    .map(member => ({
                      id: member.whatsapp_id,
                      admin: member.admin_role || null
                    }))
                }));
              
              toast({
                title: "Dados do cache",
                description: `${finalGroups.length} grupos carregados do banco local (API indisponível)`,
                variant: "destructive",
              });
            } else {
              throw new Error('Cache também está vazio');
            }
          } catch (cacheError) {
            console.error('Cache also failed:', cacheError);
            throw new Error('API e cache falharam - verifique sua conexão');
          }
        }
      } else {
        // Modo cache - tentar carregar do banco primeiro
        try {
          console.log('Loading from Supabase cache...');
          const cachedGroups = await groupsCacheService.getGroupsFromCache(filters);
          
          if (cachedGroups.length > 0) {
            finalGroups = cachedGroups
              .filter(group => group && group.whatsapp_group_id)
              .map(group => ({
                id: group.whatsapp_group_id,
                subject: group.subject || 'Grupo sem nome',
                subjectOwner: group.subject_owner || '',
                subjectTime: group.subject_time || 0,
                pictureUrl: group.picture_url || null,
                size: group.size || 0,
                creation: group.creation || Math.floor(Date.now() / 1000),
                owner: group.owner || '',
                desc: group.description || '',
                descId: group.desc_id || '',
                restrict: group.restrict || false,
                announce: group.announce || false,
                isCommunity: group.is_community || false,
                isCommunityAnnounce: group.is_community_announce || false,
                participants: (group.members || [])
                  .filter(member => member && member.whatsapp_id)
                  .map(member => ({
                    id: member.whatsapp_id,
                    admin: member.admin_role || null
                  }))
              }));
            
            console.log(`✅ Loaded ${finalGroups.length} groups from cache`);
          } else {
            // Cache vazio, buscar da API
            console.log('Cache empty, fetching from API...');
            const apiResult = await loadGroupsDirectFromAPI();
            finalGroups = apiResult.converted;
            
            // Salvar no cache após buscar da API
            if (finalGroups.length > 0 && apiResult.original) {
              try {
                await groupsCacheService.saveGroupsToCache(apiResult.original, 'GabrielSenax');
                await loadCacheStats();
                console.log('✅ New data saved to cache');
              } catch (saveError) {
                console.warn('Could not save new data to cache:', saveError);
              }
            }
          }
        } catch (cacheError) {
          console.error('Cache failed, falling back to API:', cacheError);
          // Se cache falhar, buscar da API
          const apiResult = await loadGroupsDirectFromAPI();
          finalGroups = apiResult.converted;
        }
      }
      
      // Aplicar filtros se necessário
      if (filters.searchTerm) {
        finalGroups = finalGroups.filter(group => 
          group.subject?.toLowerCase().includes(filters.searchTerm!.toLowerCase())
        );
      }
      
      if (filters.isCommunity !== undefined) {
        finalGroups = finalGroups.filter(group => group.isCommunity === filters.isCommunity);
      }
      
      if (filters.minSize !== undefined) {
        finalGroups = finalGroups.filter(group => group.participants.length >= filters.minSize!);
      }
      
      if (filters.maxSize !== undefined) {
        finalGroups = finalGroups.filter(group => group.participants.length <= filters.maxSize!);
      }
      
      if (filters.hasDescription !== undefined) {
        if (filters.hasDescription) {
          finalGroups = finalGroups.filter(group => group.desc && group.desc.trim() !== '');
        } else {
          finalGroups = finalGroups.filter(group => !group.desc || group.desc.trim() === '');
        }
      }
      
      setGroups(finalGroups);
      setError(null);
      
      toast({
        title: "Grupos carregados",
        description: `${finalGroups.length} grupos encontrados`,
      });
      
    } catch (err) {
      console.error('All load attempts failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar grupos: ${errorMessage}`);
      setGroups([]);
      
      toast({
        title: "Erro ao carregar grupos",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await groupsCacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.warn('Cache stats not available:', error);
      setCacheStats(null);
    }
  };

  useEffect(() => {
    loadGroups();
    if (dataSource === 'cache') {
      loadCacheStats();
    }
  }, [dataSource, filters]);

  // Inicialização - começar no modo cache para usar dados salvos
  useEffect(() => {
    setDataSource('cache');
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      setFilters(prev => ({
        ...prev,
        searchTerm
      }));
    };

    const timeoutId = setTimeout(applyFilters, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  const handleRefresh = async () => {
    toast({
      title: "Atualizando dados",
      description: "Limpando cache e buscando dados atualizados da API...",
    });
    await loadGroups(true);
    if (dataSource === 'cache') {
      await loadCacheStats();
    }
  };

  const handleFilterChange = (key: keyof GroupFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const clearCache = async () => {
    try {
      await groupsCacheService.clearCache();
      toast({
        title: "Cache limpo",
        description: "Todos os dados do cache foram removidos.",
      });
      // Recarregar dados
      loadGroups(true);
    } catch (error) {
      console.warn('Could not clear cache:', error);
      toast({
        title: "Aviso",
        description: "Cache pode não estar disponível, mas dados serão recarregados da API.",
      });
      // Forçar reload da API mesmo se cache falhar
      loadGroups(true);
    }
  };

  const handleGroupClick = (group: any) => {
    setSelectedGroup(group);
  };

  const handleBackToList = () => {
    setSelectedGroup(null);
  };

  const handleCaptureMembros = async () => {
    if (!selectedGroup) return;
    
    try {
      // Preparar dados dos membros para exportação
      const membersData = selectedGroup.participants.map(participant => ({
        telefone: participant.id.split('@')[0],
        whatsapp_id: participant.id,
        admin: participant.admin || 'membro',
        grupo: selectedGroup.subject,
        grupo_id: selectedGroup.id
      }));

      // Criar CSV
      const csvHeaders = ['telefone', 'whatsapp_id', 'admin', 'grupo', 'grupo_id'];
      const csvContent = [
        csvHeaders.join(','),
        ...membersData.map(member => 
          csvHeaders.map(header => `"${member[header as keyof typeof member]}"`).join(',')
        )
      ].join('\n');

      // Baixar arquivo CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `membros_${selectedGroup.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Membros capturados com sucesso!",
        description: `${selectedGroup.participants.length} membros do grupo "${selectedGroup.subject}" foram exportados para CSV.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao capturar membros",
        description: "Ocorreu um erro ao exportar os membros do grupo.",
        variant: "destructive",
      });
    }
  };

  // Se um grupo está selecionado, mostrar página individual do grupo
  if (selectedGroup) {
    return (
      <div className="space-y-6">
        {/* Header da página individual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToList}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{selectedGroup.subject}</h1>
              <p className="text-muted-foreground">Detalhes do grupo</p>
            </div>
          </div>
          <Button 
            onClick={handleCaptureMembros} 
            className="bg-green-600 hover:bg-green-700"
            disabled={selectedGroup.participants.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {selectedGroup.participants.length > 0 ? 'Capturar Membros' : 'Membros não disponíveis'}
          </Button>
        </div>

        {/* Informações do grupo */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                {selectedGroup.pictureUrl ? (
                  <AvatarImage src={selectedGroup.pictureUrl} alt={selectedGroup.subject} />
                ) : (
                  <AvatarFallback className="bg-green-500 text-white text-xl">
                    {selectedGroup.subject?.charAt(0)?.toUpperCase() || 'G'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{selectedGroup.subject}</CardTitle>
                <CardDescription className="mt-2">
                  {selectedGroup.desc || 'Sem descrição disponível'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Membros:</span>
                <p className="font-semibold">{selectedGroup.size}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Criado em:</span>
                <p className="font-semibold">{formatDate(selectedGroup.creation)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-semibold">
                  {selectedGroup.isCommunity ? 'Comunidade' : 'Grupo'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Configurações:</span>
                <div className="flex gap-1 mt-1">
                  {selectedGroup.announce && (
                    <Badge variant="outline" className="text-xs">
                      Apenas admins
                    </Badge>
                  )}
                  {selectedGroup.restrict && (
                    <Badge variant="outline" className="text-xs">
                      Restrito
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Membros</p>
                  <p className="text-2xl font-bold">{selectedGroup.size}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Criação</p>
                  <p className="text-2xl font-bold">{formatDate(selectedGroup.creation)}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-2xl font-bold">
                    {selectedGroup.isCommunity ? 'Comunidade' : 'Grupo'}
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Membros do Grupo */}
        <Card>
          <CardHeader>
            <CardTitle>Membros ({selectedGroup.size || selectedGroup.participants.length})</CardTitle>
            <CardDescription>
              Lista completa de membros do grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {selectedGroup.participants.length > 0 ? (
                selectedGroup.participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">
                        {participant.id.split('@')[0].charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {participant.id.split('@')[0]}
                        </span>
                        {participant.admin === 'superadmin' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {participant.admin === 'admin' && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {participant.id}
                      </span>
                    </div>
                    {participant.admin && (
                      <Badge variant="secondary" className="text-xs">
                        {participant.admin === 'superadmin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">Lista de membros não disponível</p>
                  <p className="text-sm">
                    Este grupo tem {selectedGroup.size} membros, mas os detalhes individuais não foram carregados.
                    <br />
                    Faça uma nova sincronização da API para obter a lista completa.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Página principal com lista de grupos
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Grupos</h1>
            <p className="text-muted-foreground">Gerencie os grupos do WhatsApp</p>
          </div>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos</h1>
          <p className="text-muted-foreground">
            Gerencie os grupos do WhatsApp ({groups.length} grupos encontrados)
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dataSource} onValueChange={(value: 'cache' | 'api') => setDataSource(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cache">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Cache Local
                </div>
              </SelectItem>
              <SelectItem value="api">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  API Direta
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sincronizando...' : 'Sincronizar API'}
          </Button>
        </div>
      </div>

      {/* Cache Stats */}
      {cacheStats && dataSource === 'cache' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Dados Salvos:</span>
                </div>
                <div>
                  <span className="text-green-600">Grupos: </span>
                  <span className="font-medium">{cacheStats.totalGroups}</span>
                </div>
                <div>
                  <span className="text-green-600">Membros: </span>
                  <span className="font-medium">{cacheStats.totalMembers}</span>
                </div>
                {cacheStats.lastSync && (
                  <div>
                    <span className="text-green-600">Última sincronização: </span>
                    <span className="font-medium">
                      {new Date(cacheStats.lastSync).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearCache} className="border-green-300 text-green-700 hover:bg-green-100">
                Limpar Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Mode Info */}
      {dataSource === 'api' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Modo API Direto</span>
              <span className="text-sm">
                Os dados são carregados diretamente da API externa a cada atualização.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar grupos por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.isCommunity?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('isCommunity', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="true">Comunidades</SelectItem>
                <SelectItem value="false">Grupos</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.minSize?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('minSize', value === 'all' ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tamanho mínimo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer tamanho</SelectItem>
                <SelectItem value="1">1+ membros</SelectItem>
                <SelectItem value="5">5+ membros</SelectItem>
                <SelectItem value="10">10+ membros</SelectItem>
                <SelectItem value="50">50+ membros</SelectItem>
                <SelectItem value="100">100+ membros</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.maxSize?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('maxSize', value === 'all' ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tamanho máximo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer tamanho</SelectItem>
                <SelectItem value="10">Até 10 membros</SelectItem>
                <SelectItem value="50">Até 50 membros</SelectItem>
                <SelectItem value="100">Até 100 membros</SelectItem>
                <SelectItem value="500">Até 500 membros</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.hasDescription?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('hasDescription', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Descrição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                <SelectItem value="true">Com descrição</SelectItem>
                <SelectItem value="false">Sem descrição</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Nenhum grupo corresponde aos critérios de pesquisa."
                : "Nenhum grupo foi encontrado."}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Limpar pesquisa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card 
              key={group.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleGroupClick(group)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    {group.pictureUrl ? (
                      <AvatarImage src={group.pictureUrl} alt={group.subject} />
                    ) : (
                      <AvatarFallback className="bg-green-500 text-white">
                        {group.subject?.charAt(0)?.toUpperCase() || 'G'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate mb-1">
                      {group.subject || 'Grupo sem nome'}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Users className="h-3 w-3" />
                      <span>{group.size || group.participants.length} membros</span>
                    </div>

                    {group.desc && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {group.desc}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {group.isCommunity && (
                        <Badge variant="secondary" className="text-xs">
                          Comunidade
                        </Badge>
                      )}
                      {group.announce && (
                        <Badge variant="outline" className="text-xs">
                          Apenas admins
                        </Badge>
                      )}
                      {group.restrict && (
                        <Badge variant="outline" className="text-xs">
                          Restrito
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}