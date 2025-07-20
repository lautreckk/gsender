import { supabase } from '@/integrations/supabase/client';

export interface GroupInfo {
  id: string;
  subject: string;
  creation: number;
  subjectOwner?: string;
  size: number;
  announce?: boolean;
  restrict?: boolean;
  desc?: string;
}

export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
}

export interface GroupWithParticipants extends GroupInfo {
  participants: GroupParticipant[];
}

class GroupsService {
  private static async getApiConfig() {
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['evolution_api_url', 'evolution_api_key']);
    
    let apiUrl = 'http://localhost:8080';
    let apiKey = '';
    
    if (data && data.length > 0) {
      data.forEach(({ key, value }) => {
        if (key === 'evolution_api_url' && value && value.trim() !== '') {
          apiUrl = value.trim();
        } else if (key === 'evolution_api_key' && value && value.trim() !== '') {
          apiKey = value.trim();
        }
      });
    }
    
    return { apiUrl, apiKey };
  }

  static async fetchAllGroups(instanceName: string): Promise<GroupInfo[]> {
    const { apiUrl, apiKey } = await this.getApiConfig();
    
    console.log('Fetching groups for instance:', instanceName);
    console.log('API URL:', apiUrl);
    console.log('API Key length:', apiKey.length);
    
    try {
      const url = `${apiUrl}/group/fetchAllGroups/${instanceName}`;
      console.log('Full URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Groups data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }

  static async findGroupInfos(instanceName: string, groupId: string): Promise<GroupInfo> {
    const { apiUrl, apiKey } = await this.getApiConfig();
    
    console.log('Fetching group info for:', groupId);
    
    try {
      const url = `${apiUrl}/group/findGroupInfos/${instanceName}?groupJid=${groupId}`;
      console.log('Group info URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Group info response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Group info error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Group info data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching group info:', error);
      throw error;
    }
  }

  static async getGroupParticipants(instanceName: string, groupId: string): Promise<GroupParticipant[]> {
    const { apiUrl, apiKey } = await this.getApiConfig();
    
    console.log('Fetching participants for group:', groupId);
    
    try {
      const url = `${apiUrl}/group/participants/${instanceName}?groupJid=${groupId}`;
      console.log('Participants URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Participants response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Participants error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Participants data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching group participants:', error);
      throw error;
    }
  }

  static async getGroupsWithParticipants(instanceName: string): Promise<GroupWithParticipants[]> {
    try {
      const groups = await this.fetchAllGroups(instanceName);
      
      const groupsWithParticipants = await Promise.all(
        groups.map(async (group) => {
          try {
            const participants = await this.getGroupParticipants(instanceName, group.id);
            return {
              ...group,
              participants
            };
          } catch (error) {
            console.error(`Error fetching participants for group ${group.id}:`, error);
            return {
              ...group,
              participants: []
            };
          }
        })
      );

      return groupsWithParticipants;
    } catch (error) {
      console.error('Error fetching groups with participants:', error);
      throw error;
    }
  }
}

export default GroupsService;