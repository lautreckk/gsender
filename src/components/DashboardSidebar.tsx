
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  MessageCircle, 
  Send, 
  History, 
  Settings, 
  LogOut,
  Users,
  Building,
  UsersRound
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useWhiteLabelSettings } from '@/contexts/SettingsContext';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardSidebarProps {
  tenant: any;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export function DashboardSidebar({ tenant, activeView, onViewChange, onLogout }: DashboardSidebarProps) {
  const whiteLabelSettings = useWhiteLabelSettings();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'connections', label: 'Conexões', icon: MessageCircle },
    { id: 'campaigns', label: 'Campanhas', icon: Send },
    { id: 'groups', label: 'Grupos', icon: UsersRound },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'members', label: 'Membros', icon: Users },
    { id: 'clients', label: 'Clientes', icon: Building },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={whiteLabelSettings.logo || tenant?.logo} />
            <AvatarFallback className="bg-green-500 text-white">
              {(whiteLabelSettings.companyName || tenant?.name || 'T').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{whiteLabelSettings.companyName || tenant?.name || 'Disparamator'}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {whiteLabelSettings.domain || tenant?.domain || 'app.disparamator.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                activeView === item.id && "bg-primary/10 text-primary"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        {/* Theme Toggle */}
        <ThemeToggle variant="ghost" showLabel={true} />
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
