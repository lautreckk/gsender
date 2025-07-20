import { useState, useEffect } from 'react';
import GroupsService, { GroupWithParticipants } from '@/services/groupsService';

export function useGroups(instances: any[] = [], isAuthenticated: boolean = false) {
  const [groups, setGroups] = useState<GroupWithParticipants[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupsForAllInstances = async () => {
    console.log('fetchGroupsForAllInstances called');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('instances:', instances);
    
    if (!isAuthenticated || !instances.length) {
      console.log('Not authenticated or no instances, setting empty groups');
      setGroups([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connectedInstances = instances.filter(instance => instance.connectionStatus === 'open');
      console.log('Connected instances:', connectedInstances);
      
      const allGroupsPromises = connectedInstances.map(async (instance) => {
        console.log(`Fetching groups for instance: ${instance.instanceName}`);
        try {
          const instanceGroups = await GroupsService.getGroupsWithParticipants(instance.instanceName);
          console.log(`Groups found for ${instance.instanceName}:`, instanceGroups);
          return instanceGroups.map(group => ({
            ...group,
            instanceName: instance.instanceName,
            instanceDisplayName: instance.displayName || instance.instanceName
          }));
        } catch (error) {
          console.error(`Error fetching groups for instance ${instance.instanceName}:`, error);
          return [];
        }
      });

      const allGroupsResults = await Promise.all(allGroupsPromises);
      console.log('All groups results:', allGroupsResults);
      const flattenedGroups = allGroupsResults.flat();
      console.log('Flattened groups:', flattenedGroups);
      
      setGroups(flattenedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupsForInstance = async (instanceName: string) => {
    setLoading(true);
    setError(null);

    try {
      const instanceGroups = await GroupsService.getGroupsWithParticipants(instanceName);
      return instanceGroups;
    } catch (error) {
      console.error(`Error fetching groups for instance ${instanceName}:`, error);
      setError(`Erro ao carregar grupos da instância ${instanceName}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const refreshGroups = () => {
    fetchGroupsForAllInstances();
  };

  useEffect(() => {
    fetchGroupsForAllInstances();
  }, [instances, isAuthenticated]);

  return {
    groups,
    loading,
    error,
    refreshGroups,
    fetchGroupsForInstance
  };
}