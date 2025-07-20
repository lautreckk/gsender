import { supabase } from '@/integrations/supabase/client';

export interface GroupMember {
  id: string;
  group_id: string;
  whatsapp_id: string;
  phone_number: string;
  admin_role: 'admin' | 'superadmin' | null;
  joined_at: string;
  created_at: string;
}

export interface CachedGroup {
  id: string;
  whatsapp_group_id: string;
  subject: string;
  subject_owner: string | null;
  subject_time: number | null;
  picture_url: string | null;
  size: number;
  creation: number;
  owner: string | null;
  description: string | null;
  desc_id: string | null;
  restrict: boolean;
  announce: boolean;
  is_community: boolean;
  is_community_announce: boolean;
  instance_name: string;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
}

export interface GroupFilters {
  instanceName?: string;
  minSize?: number;
  maxSize?: number;
  isCommunity?: boolean;
  hasDescription?: boolean;
  adminRole?: 'admin' | 'superadmin';
  searchTerm?: string;
}

class GroupsCacheService {
  
  async saveGroupsToCache(groups: any[], instanceName = 'GabrielSenax'): Promise<void> {
    try {
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found for saving groups');
        throw new Error('User not authenticated');
      }

      console.log(`🔄 Saving ${groups.length} groups to cache for user ${user.id} and instance:`, instanceName);
      console.log(`🔍 First group sample:`, groups[0]);
      
      // Debug: verificar quantos grupos têm participants
      const groupsWithParticipants = groups.filter(g => g.participants && g.participants.length > 0);
      console.log(`📊 Groups with participants: ${groupsWithParticipants.length}/${groups.length}`);
      
      if (groupsWithParticipants.length > 0) {
        console.log(`🔍 Sample group with participants:`, groupsWithParticipants[0].subject);
        console.log(`🔍 Sample participants:`, groupsWithParticipants[0].participants?.slice(0, 2));
      }
      
      // Primeiro, limpar todos os grupos existentes desta instância para este usuário
      console.log(`🗑️ Clearing existing groups for user ${user.id} and instance: ${instanceName}`);
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('instance_name', instanceName);
      
      if (deleteError) {
        console.warn('Warning clearing existing groups:', deleteError);
        // Continuar mesmo se der erro na limpeza
      }
      
      // Agora inserir todos os grupos novos
      const groupsToInsert = groups.map(group => ({
        whatsapp_group_id: group.id,
        subject: group.subject || 'Grupo sem nome',
        subject_owner: group.subjectOwner,
        subject_time: group.subjectTime,
        picture_url: group.pictureUrl,
        size: group.participants?.length || group.size || 0,
        creation: group.creation,
        owner: group.owner,
        description: group.desc,
        desc_id: group.descId,
        restrict: group.restrict || false,
        announce: group.announce || false,
        is_community: group.isCommunity || false,
        is_community_announce: group.isCommunityAnnounce || false,
        instance_name: instanceName,
        last_sync_at: new Date().toISOString()
      }));

      console.log(`📝 Inserting ${groupsToInsert.length} groups...`);
      const { data: insertedGroups, error: insertError } = await supabase
        .from('groups')
        .insert(groupsToInsert)
        .select('id, whatsapp_group_id');

      if (insertError) {
        throw insertError;
      }

      if (!insertedGroups || insertedGroups.length === 0) {
        throw new Error('No groups were inserted');
      }

      console.log(`✅ Inserted ${insertedGroups.length} groups`);

      // Criar mapa de whatsapp_group_id para id do banco
      const groupIdMap = new Map();
      insertedGroups.forEach(g => {
        groupIdMap.set(g.whatsapp_group_id, g.id);
      });

      // Preparar dados dos membros
      const allMembersData: any[] = [];
      for (const group of groups) {
        const groupId = groupIdMap.get(group.id);
        if (groupId && group.participants && group.participants.length > 0) {
          console.log(`🔍 Processing group "${group.subject}" with ${group.participants.length} participants`);
          const membersData = group.participants.map((participant: any) => ({
            group_id: groupId,
            whatsapp_id: participant.id,
            phone_number: participant.id.split('@')[0],
            admin_role: participant.admin || null
          }));
          allMembersData.push(...membersData);
          console.log(`✅ Added ${membersData.length} members for group "${group.subject}"`);
        } else {
          console.log(`⚠️ Group "${group.subject}" has no participants or missing groupId`);
        }
      }

      // Inserir todos os membros de uma vez
      console.log(`🔍 Total members collected: ${allMembersData.length}`);
      if (allMembersData.length > 0) {
        console.log(`👥 Inserting ${allMembersData.length} members...`);
        console.log(`👥 Sample member data:`, allMembersData[0]);
        const { error: membersError } = await supabase
          .from('group_members')
          .insert(allMembersData);

        if (membersError) {
          console.error('Error inserting members:', membersError);
          // Não fazer throw aqui, grupos já foram salvos
        } else {
          console.log(`✅ Inserted ${allMembersData.length} members`);
        }
      }

      console.log('🎉 Groups and members saved to cache successfully');
    } catch (error) {
      console.error('❌ Error saving groups to cache:', error);
      throw error;
    }
  }

  async getGroupsFromCache(filters: GroupFilters = {}): Promise<CachedGroup[]> {
    try {
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found for groups');
        return [];
      }

      let query = supabase
        .from('groups')
        .select(`
          *,
          members:group_members(*)
        `)
        .order('last_sync_at', { ascending: false });

      // Aplicar filtros
      if (filters.instanceName) {
        query = query.eq('instance_name', filters.instanceName);
      }

      if (filters.minSize !== undefined) {
        query = query.gte('size', filters.minSize);
      }

      if (filters.maxSize !== undefined) {
        query = query.lte('size', filters.maxSize);
      }

      if (filters.isCommunity !== undefined) {
        query = query.eq('is_community', filters.isCommunity);
      }

      if (filters.hasDescription !== undefined) {
        if (filters.hasDescription) {
          query = query.not('description', 'is', null);
        } else {
          query = query.is('description', null);
        }
      }

      if (filters.searchTerm) {
        query = query.ilike('subject', `%${filters.searchTerm}%`);
      }

      const { data: groups, error } = await query;

      if (error) {
        throw error;
      }

      return groups || [];
    } catch (error) {
      console.error('Error getting groups from cache:', error);
      throw error;
    }
  }

  async getGroupById(groupId: string): Promise<CachedGroup | null> {
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(*)
        `)
        .eq('whatsapp_group_id', groupId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Grupo não encontrado
        }
        throw error;
      }

      return group;
    } catch (error) {
      console.error('Error getting group by ID:', error);
      throw error;
    }
  }

  async getCacheStats(): Promise<{
    totalGroups: number;
    totalMembers: number;
    lastSync: string | null;
    groupsByInstance: { [key: string]: number };
  }> {
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('instance_name, last_sync_at');

      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('id');

      if (groupsError || membersError) {
        throw groupsError || membersError;
      }

      const groupsByInstance: { [key: string]: number } = {};
      let lastSync: string | null = null;

      groups?.forEach(group => {
        groupsByInstance[group.instance_name] = (groupsByInstance[group.instance_name] || 0) + 1;
        if (!lastSync || new Date(group.last_sync_at) > new Date(lastSync)) {
          lastSync = group.last_sync_at;
        }
      });

      return {
        totalGroups: groups?.length || 0,
        totalMembers: members?.length || 0,
        lastSync,
        groupsByInstance
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  async clearCache(instanceName?: string): Promise<void> {
    try {
      let query = supabase.from('groups').delete();
      
      if (instanceName) {
        query = query.eq('instance_name', instanceName);
      } else {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async isCacheStale(maxAgeMinutes = 30): Promise<boolean> {
    try {
      const { data: latestGroup } = await supabase
        .from('groups')
        .select('last_sync_at')
        .order('last_sync_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestGroup) {
        return true; // Sem cache, está desatualizado
      }

      const lastSync = new Date(latestGroup.last_sync_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

      return diffMinutes > maxAgeMinutes;
    } catch (error) {
      console.error('Error checking cache staleness:', error);
      return true; // Em caso de erro, considerar desatualizado
    }
  }
}

export default new GroupsCacheService();