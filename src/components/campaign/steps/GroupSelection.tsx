import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Filter,
  RefreshCw
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { CampaignData, ContactData } from '../CampaignWizard';
import { useCampaignSettingsValues } from '@/contexts/SettingsContext';
import groupsCacheService, { CachedGroup } from '@/services/groupsCacheService';

interface GroupSelectionProps {
  data: CampaignData;
  onUpdate: (data: Partial<CampaignData>) => void;
}

export function GroupSelection({ data, onUpdate }: GroupSelectionProps) {
  const campaignSettings = useCampaignSettingsValues();
  const [groups, setGroups] = useState<CachedGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<CachedGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [minSize, setMinSize] = useState<number>(0);
  const [maxSize, setMaxSize] = useState<number>(999999);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [groups, searchTerm, minSize, maxSize]);

  useEffect(() => {
    // Convert selected groups to contacts format with group ID in numero field
    const selectedGroups = groups.filter(group => selectedGroupIds.has(group.whatsapp_group_id));
    const contactsFromGroups: ContactData[] = selectedGroups.map(group => ({
      nome: group.subject,
      numero: group.whatsapp_group_id, // Store group ID in numero field as requested
      tag: 'grupo'
    }));
    
    onUpdate({ contacts: contactsFromGroups });
  }, [selectedGroupIds, groups, onUpdate]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const cachedGroups = await groupsCacheService.getGroupsFromCache({
        instanceName: 'GabrielSenax' // Default instance, could be made configurable
      });
      setGroups(cachedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Erro ao carregar grupos",
        description: "Não foi possível carregar os grupos do WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = groups;

    if (searchTerm) {
      filtered = filtered.filter(group => 
        group.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (minSize > 0) {
      filtered = filtered.filter(group => group.size >= minSize);
    }

    if (maxSize < 999999) {
      filtered = filtered.filter(group => group.size <= maxSize);
    }

    setFilteredGroups(filtered);
  };

  const handleGroupSelect = (groupId: string, selected: boolean) => {
    const newSelected = new Set(selectedGroupIds);
    
    if (selected) {
      if (newSelected.size >= campaignSettings.maxContactsPerCampaign) {
        toast({
          title: "Limite excedido",
          description: `Máximo de ${campaignSettings.maxContactsPerCampaign} grupos por campanha.`,
          variant: "destructive",
        });
        return;
      }
      newSelected.add(groupId);
    } else {
      newSelected.delete(groupId);
    }
    
    setSelectedGroupIds(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const groupsToSelect = filteredGroups.slice(0, campaignSettings.maxContactsPerCampaign);
      setSelectedGroupIds(new Set(groupsToSelect.map(g => g.whatsapp_group_id)));
    } else {
      setSelectedGroupIds(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedGroupIds(new Set());
  };

  const renderGroupCard = (group: CachedGroup) => {
    const isSelected = selectedGroupIds.has(group.whatsapp_group_id);
    
    return (
      <Card 
        key={group.whatsapp_group_id}
        className={`cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
        onClick={() => handleGroupSelect(group.whatsapp_group_id, !isSelected)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Checkbox 
                checked={isSelected}
                onChange={() => {}} // Handled by card click
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{group.subject}</div>
                  <div className="text-sm text-muted-foreground">
                    {group.size} {group.size === 1 ? 'membro' : 'membros'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline">{group.size}</Badge>
              {group.is_community && (
                <Badge variant="secondary">Comunidade</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Carregando grupos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seleção de Grupos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar grupos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite o nome do grupo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" onClick={loadGroups}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="minSize">Membros mínimo</Label>
                <Input
                  id="minSize"
                  type="number"
                  min="0"
                  value={minSize}
                  onChange={(e) => setMinSize(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="maxSize">Membros máximo</Label>
                <Input
                  id="maxSize"
                  type="number"
                  min="0"
                  value={maxSize === 999999 ? '' : maxSize}
                  onChange={(e) => setMaxSize(Number(e.target.value) || 999999)}
                  placeholder="Sem limite"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">
                  {selectedGroupIds.size} {selectedGroupIds.size === 1 ? 'grupo selecionado' : 'grupos selecionados'}
                </span>
              </div>
              <Badge variant="outline">
                {filteredGroups.length} {filteredGroups.length === 1 ? 'grupo disponível' : 'grupos disponíveis'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(true)}
                disabled={filteredGroups.length === 0 || selectedGroupIds.size >= campaignSettings.maxContactsPerCampaign}
              >
                Selecionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selectedGroupIds.size === 0}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {groups.length === 0 
                ? 'Nenhum grupo encontrado. Sincronize os grupos primeiro.' 
                : 'Nenhum grupo corresponde aos filtros aplicados.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(renderGroupCard)}
          
          {filteredGroups.length > 50 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Mostrando {Math.min(filteredGroups.length, 50)} grupos. Use os filtros para refinar a busca.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Rules Card */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Seleção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Limite máximo:</strong> {campaignSettings.maxContactsPerCampaign.toLocaleString()} grupos por campanha
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Identificação:</strong> Os grupos são identificados pelo ID do WhatsApp
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Filtros:</strong> Use busca por nome e filtros por número de membros
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Atualização:</strong> Sincronize periodicamente para obter grupos atualizados
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}