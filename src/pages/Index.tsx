import { useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { HistoryView } from '@/components/HistoryView';
import { MembersView } from '@/components/MembersView';
import { ClientManagement } from '@/components/ClientManagement';
import { CreateInstanceModal } from '@/components/CreateInstanceModal';
import { SettingsPage } from '@/components/SettingsPage';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Dashboard } from '@/components/Dashboard';
import { ConnectionsView } from '@/components/ConnectionsView';
import { CampaignsView } from '@/components/CampaignsView';
import { CreateCampaignView } from '@/components/CreateCampaignView';
import { GroupsView } from '@/components/GroupsView';
import { useAuthWithSupabase } from '@/hooks/useAuthWithSupabase';
import { useConnections } from '@/hooks/useConnections';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useMetrics } from '@/hooks/useMetrics';
import { useGroups } from '@/hooks/useGroups';
import { useWhiteLabelSettings } from '@/contexts/SettingsContext';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isCreateInstanceModalOpen, setIsCreateInstanceModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const { 
    isAuthenticated, 
    currentTenant, 
    loginForm, 
    handleLogin, 
    handleRegister,
    handleLogout, 
    updateLoginForm,
    loading: authLoading,
    userProfile,
    isTrialActive,
    trialDaysRemaining
  } = useAuthWithSupabase();
  const { connections, statusUpdateInProgress, updateAllInstancesStatus, updateSingleInstanceStatus, handleInstanceCreated, refetchConnections } = useConnections(isAuthenticated);
  const { campaigns, loading: campaignsLoading, fetchCampaigns } = useCampaigns(isAuthenticated);
  const { metrics } = useMetrics(isAuthenticated);
  const { groups, loading: groupsLoading, error: groupsError, refreshGroups } = useGroups(connections, isAuthenticated);
  const whiteLabelSettings = useWhiteLabelSettings();


  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === 'campaigns') {
      fetchCampaigns();
    }
  };

  const handleBackToCampaigns = () => {
    setActiveView('campaigns');
    fetchCampaigns();
  };

  if (!isAuthenticated) {
    if (authMode === 'login') {
      return (
        <LoginForm 
          loginForm={loginForm}
          onLogin={handleLogin}
          onUpdateForm={updateLoginForm}
          onSwitchToRegister={() => setAuthMode('register')}
          isLoading={authLoading}
        />
      );
    } else {
      return (
        <RegisterForm 
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthMode('login')}
          isLoading={authLoading}
        />
      );
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DashboardSidebar 
          tenant={currentTenant}
          activeView={activeView}
          onViewChange={handleViewChange}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 p-6 ml-64">
          {activeView === 'dashboard' && (
            <Dashboard 
              metrics={metrics}
              connections={connections}
              campaigns={campaigns}
              loading={campaignsLoading}
              onViewChange={handleViewChange}
              isTrialActive={isTrialActive}
              trialDaysRemaining={trialDaysRemaining}
              subscriptionPlan={userProfile?.subscription_plan}
              couponCode={userProfile?.coupon_code}
            />
          )}
          {activeView === 'connections' && (
            <ConnectionsView 
              connections={connections}
              statusUpdateInProgress={statusUpdateInProgress}
              onUpdateAllStatus={updateAllInstancesStatus}
              onOpenCreateModal={() => setIsCreateInstanceModalOpen(true)}
              onUpdateSingleStatus={updateSingleInstanceStatus}
              onConnectionDeleted={() => {
                // Recarregar conexões após deletar
                refetchConnections();
              }}
            />
          )}
          {activeView === 'campaigns' && (
            <CampaignsView 
              campaigns={campaigns}
              loading={campaignsLoading}
              onViewChange={handleViewChange}
            />
          )}
          {activeView === 'create-campaign' && (
            <CreateCampaignView onBack={handleBackToCampaigns} />
          )}
          {activeView === 'groups' && (
            <GroupsView 
              groups={groups}
              loading={groupsLoading}
              error={groupsError}
              onRefresh={refreshGroups}
            />
          )}
          {activeView === 'history' && <HistoryView isAdmin={true} />}
          {activeView === 'members' && <MembersView />}
          {activeView === 'clients' && <ClientManagement />}
          {activeView === 'settings' && <SettingsPage />}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-background border-t border-border p-4 text-center text-sm text-muted-foreground ml-64">
        {whiteLabelSettings.footerText || 'Powered by Disparamator'}
      </footer>
      
      {/* Modal de Criação de Instância */}
      <CreateInstanceModal
        isOpen={isCreateInstanceModalOpen}
        onOpenChange={setIsCreateInstanceModalOpen}
        onInstanceCreated={handleInstanceCreated}
      />
    </div>
  );
};

export default Index;
